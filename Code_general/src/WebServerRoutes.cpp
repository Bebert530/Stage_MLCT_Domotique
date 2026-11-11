#include "WebServerRoutes.h"
#include <ArduinoJson.h>
#include <LittleFS.h>

static void addCorsHeaders(AsyncWebServerResponse *response) {
    response->addHeader("Access-Control-Allow-Origin", "*");
    response->addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response->addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

static void sendJsonResponse(AsyncWebServerRequest *request, int code, const String& json) {
    AsyncWebServerResponse *response = request->beginResponse(code, "application/json", json);
    addCorsHeaders(response);
    request->send(response);
}

static void sendJsonDoc(AsyncWebServerRequest *request, int code, const JsonDocument& doc) {
    String output;
    serializeJson(doc, output);
    sendJsonResponse(request, code, output);
}

static void sendSuccess(AsyncWebServerRequest *request, const String& msg = "") {
    JsonDocument doc;
    doc["success"] = true;
    if (msg.length() > 0) doc["message"] = msg;
    sendJsonDoc(request, 200, doc);
}

static void sendError(AsyncWebServerRequest *request, int code, const String& err) {
    JsonDocument doc;
    doc["success"] = false;
    doc["error"] = err;
    sendJsonDoc(request, code, doc);
}

static void handleBodyChunk(AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
    String* body = (String*)request->_tempObject;
    if (index == 0) {
        body = new String();
        request->_tempObject = body;
    }
    if (body) {
        body->concat((const char*)data, len);
    }
}

static bool parseJsonBody(AsyncWebServerRequest *request, JsonDocument& doc) {
    String* body = (String*)request->_tempObject;
    if (!body || body->length() == 0) {
        sendError(request, 400, "Corps JSON vide");
        return false;
    }
    DeserializationError error = deserializeJson(doc, *body);
    delete body;
    request->_tempObject = nullptr;

    if (error) {
        sendError(request, 400, "JSON invalide");
        return false;
    }
    return true;
}

static AsyncWebSocket ws("/ws");

void broadcastDeviceState(DeviceManager& devManager) {
    if (ws.count() > 0) {
        ws.textAll(devManager.getDevicesJson());
    }
}

void setupWebServerRoutes(AsyncWebServer& server, DeviceManager& devManager, AutomationManager& autoManager, WiFiManager& wifiManager, DiagnosticManager& diagManager) {
    // -------------------------------------------------------------
    // WEBSOCKET TEMPS RÉEL (/ws)
    // -------------------------------------------------------------
    ws.onEvent([&devManager](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
        if (type == WS_EVT_CONNECT) {
            Serial.printf("[WebSocket] Client #%u connecte depuis %s\n", client->id(), client->remoteIP().toString().c_str());
            client->text(devManager.getDevicesJson());
        } else if (type == WS_EVT_DISCONNECT) {
            Serial.printf("[WebSocket] Client #%u deconnecte\n", client->id());
        } else if (type == WS_EVT_DATA) {
            AwsFrameInfo *info = (AwsFrameInfo*)arg;
            if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
                JsonDocument doc;
                DeserializationError err = deserializeJson(doc, data, len);
                if (!err) {
                    const char* cmd = doc["cmd"] | "";
                    if (strcmp(cmd, "getState") == 0) {
                        client->text(devManager.getDevicesJson());
                    } else if (strcmp(cmd, "setState") == 0) {
                        uint8_t id = doc["id"] | 0;
                        uint8_t state = doc["state"] | 0;
                        uint8_t value = doc["value"] | 0;
                        devManager.setDeviceState(id, state, value);
                        ws.textAll(devManager.getDevicesJson());
                    } else if (strcmp(cmd, "setInverted") == 0) {
                        uint8_t id = doc["id"] | 0;
                        bool inverted = doc["inverted"] | false;
                        devManager.setDeviceInverted(id, inverted);
                        ws.textAll(devManager.getDevicesJson());
                    }
                }
            }
        }
    });

    server.addHandler(&ws);

    // -------------------------------------------------------------
    // GESTION GLOBALE CORS (Options pre-flight)
    // -------------------------------------------------------------
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");

    // -------------------------------------------------------------
    // 1. GET /api/devices : Retourne la liste complète des périphériques
    // -------------------------------------------------------------
    server.on("/api/devices", HTTP_GET, [&devManager](AsyncWebServerRequest *request) {
        sendJsonResponse(request, 200, devManager.getDevicesJson());
    });

    // -------------------------------------------------------------
    // 2. GET /api/available-pins : Retourne la liste des pins sûrs & libres
    // -------------------------------------------------------------
    server.on("/api/available-pins", HTTP_GET, [&devManager](AsyncWebServerRequest *request) {
        sendJsonResponse(request, 200, devManager.getAvailablePinsJson());
    });

    server.on("/api/pins", HTTP_GET, [&devManager](AsyncWebServerRequest *request) {
        sendJsonResponse(request, 200, devManager.getAvailablePinsJson());
    });

    // -------------------------------------------------------------
    // 3. GET /api/pins/suggest : Attribution automatique intelligente d'un GPIO
    // -------------------------------------------------------------
    server.on("/api/pins/suggest", HTTP_GET, [&devManager](AsyncWebServerRequest *request) {
        String typeStr = "OUTPUT_RELAY";
        if (request->hasParam("type")) {
            typeStr = request->getParam("type")->value();
        }
        SignalMode mode = DeviceManager::stringToSignalMode(typeStr);
        int8_t pin = devManager.suggestPin(mode);

        JsonDocument doc;
        if (pin >= 0) {
            doc["success"] = true;
            doc["gpio"] = pin;
            doc["mode"] = DeviceManager::signalModeToString(mode);
            doc["message"] = "Broche GPIO " + String(pin) + " sélectionnée avec succès";
            sendJsonDoc(request, 200, doc);
        } else {
            sendError(request, 400, "Aucune broche compatible disponible pour ce type de signal.");
        }
    });

    // -------------------------------------------------------------
    // 4. POST /api/devices/save : Enregistrement complet (Wizard ou modification)
    // -------------------------------------------------------------
    server.on("/api/devices/save", HTTP_POST,
        [&devManager, &diagManager](AsyncWebServerRequest *request) {
            JsonDocument doc;
            if (!parseJsonBody(request, doc)) return;

            uint8_t id = 0;
            if (doc["id"].is<int>()) {
                id = doc["id"].as<uint8_t>();
            } else if (doc["id"].is<String>()) {
                id = (uint8_t)doc["id"].as<String>().toInt();
            }

            String name = doc["name"] | "";
            String catStr = doc["category"] | "ACTUATOR";
            String voltage = doc["voltage"] | "12V";
            String modeStr = doc["mode"] | "OUTPUT_RELAY";

            uint8_t gpio = 255;
            if (doc["gpio"].is<int>()) {
                gpio = doc["gpio"].as<uint8_t>();
            } else if (doc["gpio"].is<String>()) {
                gpio = (uint8_t)doc["gpio"].as<String>().toInt();
            }

            bool isCore = doc["isCore"] | false;

            DeviceCategory cat = DeviceManager::stringToCategory(catStr);
            SignalMode mode = DeviceManager::stringToSignalMode(modeStr);
            String errorMsg;

            Device* existingDev = (id > 0) ? devManager.getDeviceById(id) : nullptr;
            bool isModification = (existingDev != nullptr);

            bool ok = devManager.saveDevice(id, name, cat, voltage, mode, gpio, isCore, errorMsg);
            if (ok) {
                if (isModification) {
                    diagManager.addLog("INFO", "Modification équipement : \"" + name + "\" (ID #" + String(id) + ", GPIO " + String(gpio) + ")");
                } else {
                    diagManager.addLog("INFO", "Création équipement : \"" + name + "\" (GPIO " + String(gpio) + ")");
                }
                broadcastDeviceState(devManager);
                sendSuccess(request, "Équipement enregistré et activé avec succès");
            } else {
                sendError(request, 400, errorMsg);
            }
        },
        NULL,
        handleBodyChunk
    );

    // -------------------------------------------------------------
    // 5. POST /api/devices/delete : Suppression d'un équipement
    // -------------------------------------------------------------
    server.on("/api/devices/delete", HTTP_POST,
        [&devManager, &diagManager](AsyncWebServerRequest *request) {
            JsonDocument doc;
            if (!parseJsonBody(request, doc)) return;

            uint8_t id = doc["id"] | 0;
            String errorMsg;

            Device* dev = devManager.getDeviceById(id);
            String devName = dev ? dev->name : ("ID #" + String(id));

            bool ok = devManager.deleteDevice(id, errorMsg);
            if (ok) {
                diagManager.addLog("INFO", "Suppression équipement : \"" + devName + "\" (ID #" + String(id) + ")");
                broadcastDeviceState(devManager);
                sendSuccess(request, "Périphérique supprimé et broche libérée");
            } else {
                int statusCode = errorMsg.indexOf("Core") >= 0 ? 403 : 400;
                sendError(request, statusCode, errorMsg);
            }
        },
        NULL,
        handleBodyChunk
    );

    // -------------------------------------------------------------
    // 5bis. POST /api/devices/toggle-enabled : Activation / Désactivation
    // -------------------------------------------------------------
    server.on("/api/devices/toggle-enabled", HTTP_POST,
        [&devManager, &diagManager](AsyncWebServerRequest *request) {
            JsonDocument doc;
            if (!parseJsonBody(request, doc)) return;

            uint8_t id = doc["id"] | 0;
            bool enabled = doc["enabled"] | false;

            Device* dev = devManager.getDeviceById(id);
            String devName = dev ? dev->name : ("ID #" + String(id));

            bool ok = devManager.setDeviceEnabled(id, enabled);
            if (ok) {
                diagManager.addLog("INFO", (enabled ? "Activation équipement : \"" : "Désactivation équipement : \"") + devName + "\" (ID #" + String(id) + ")");
                broadcastDeviceState(devManager);
                sendSuccess(request, enabled ? "Équipement activé" : "Équipement désactivé");
            } else {
                sendError(request, 404, "Périphérique introuvable");
            }
        },
        NULL,
        handleBodyChunk
    );

    // -------------------------------------------------------------
    // 5ter. POST /api/devices/toggle-inverted : Inversion logique (Normale / Inversée)
    // -------------------------------------------------------------
    server.on("/api/devices/toggle-inverted", HTTP_POST,
        [&devManager, &diagManager](AsyncWebServerRequest *request) {
            JsonDocument doc;
            if (!parseJsonBody(request, doc)) return;

            uint8_t id = doc["id"] | 0;
            bool inverted = doc["inverted"] | false;

            Device* dev = devManager.getDeviceById(id);
            String devName = dev ? dev->name : ("ID #" + String(id));

            bool ok = devManager.setDeviceInverted(id, inverted);
            if (ok) {
                diagManager.addLog("INFO", "Logique équipement : \"" + devName + "\" modifiée en " + (inverted ? "INVERSÉE" : "NORMALE"));
                broadcastDeviceState(devManager);
                sendSuccess(request, inverted ? "Logique inversée" : "Logique normale");
            } else {
                sendError(request, 404, "Périphérique introuvable");
            }
        },
        NULL,
        handleBodyChunk
    );

    // -------------------------------------------------------------
    // 6. POST /api/devices/test : Test matériel temporaire (Actionneur 3s ou Capteur)
    // -------------------------------------------------------------
    server.on("/api/devices/test", HTTP_POST,
        [&devManager](AsyncWebServerRequest *request) {
            JsonDocument doc;
            if (!parseJsonBody(request, doc)) return;

            uint16_t duration = doc["duration"] | 3000;
            DeviceTestResult testRes;

            if (doc["id"].is<uint8_t>() && doc["id"].as<uint8_t>() > 0) {
                uint8_t id = doc["id"].as<uint8_t>();
                testRes = devManager.testDevice(id, duration);
            } else if (doc["gpio"].is<uint8_t>()) {
                uint8_t gpio = doc["gpio"].as<uint8_t>();
                String modeStr = doc["mode"] | "OUTPUT_RELAY";
                SignalMode mode = DeviceManager::stringToSignalMode(modeStr);
                testRes = devManager.testPinDirect(gpio, mode, duration);
            } else {
                testRes.success = false;
                testRes.message = "Paramètre 'id' ou 'gpio' manquant pour le test.";
            }

            JsonDocument respDoc;
            respDoc["success"] = testRes.success;
            respDoc["message"] = testRes.message;
            respDoc["reading"] = testRes.rawValue;
            respDoc["voltage"] = testRes.voltageValue;
            sendJsonDoc(request, testRes.success ? 200 : 400, respDoc);
        },
        NULL,
        handleBodyChunk
    );

    // -------------------------------------------------------------
    // 7. POST /api/devices/set-state & /api/devices/control : Commande en direct depuis l'UI
    // -------------------------------------------------------------
    auto handleSetDeviceState = [&devManager, &diagManager](AsyncWebServerRequest *request) {
        JsonDocument doc;
        if (!parseJsonBody(request, doc)) return;

        uint8_t id = doc["id"] | 0;
        uint8_t state = doc["state"] | 0;
        uint8_t value = doc["value"] | 0;
        if (!doc.containsKey("value")) {
            value = state ? 100 : 0;
        }

        Device* dev = devManager.getDeviceById(id);
        String devName = dev ? dev->name : ("ID #" + String(id));

        bool ok = devManager.setDeviceState(id, state, value);
        if (ok) {
            diagManager.addLog("INFO", "Commande UI : \"" + devName + "\" -> " + (state ? "ACTIF (val=" + String(value) + ")" : "ARRÊT"));
            broadcastDeviceState(devManager);
            sendSuccess(request);
        } else {
            sendError(request, 404, "Périphérique introuvable");
        }
    };

    server.on("/api/devices/set-state", HTTP_POST, handleSetDeviceState, NULL, handleBodyChunk);
    server.on("/api/devices/control", HTTP_POST, handleSetDeviceState, NULL, handleBodyChunk);

    // -------------------------------------------------------------
    // 8. GET & POST /api/automations : Gestion des règles d'automatisation
    // -------------------------------------------------------------
    server.on("/api/automations", HTTP_GET, [&autoManager](AsyncWebServerRequest *request) {
        sendJsonResponse(request, 200, autoManager.getRulesJson());
    });

    server.on("/api/automations", HTTP_POST,
        [&autoManager](AsyncWebServerRequest *request) {
            String* body = (String*)request->_tempObject;
            if (!body || body->length() == 0) {
                sendError(request, 400, "Corps JSON vide");
                return;
            }
            bool ok = autoManager.saveRules(*body);
            delete body;
            request->_tempObject = nullptr;

            if (ok) {
                sendSuccess(request);
            } else {
                sendError(request, 500, "Échec de sauvegarde");
            }
        },
        nullptr,
        handleBodyChunk
    );

    // -------------------------------------------------------------
    // 9. Wi-Fi Hybride : /api/wifi/status, /api/wifi/scan, /api/wifi/connect, /api/wifi/reset
    // -------------------------------------------------------------
    server.on("/api/wifi/status", HTTP_GET, [&wifiManager](AsyncWebServerRequest *request) {
        sendJsonResponse(request, 200, wifiManager.getStatusJson());
    });

    server.on("/api/wifi/scan", HTTP_GET, [&wifiManager](AsyncWebServerRequest *request) {
        if (request->hasParam("start")) {
            wifiManager.startScan();
        }
        sendJsonResponse(request, 200, wifiManager.getScanResultsJson());
    });

    server.on("/api/wifi/connect", HTTP_POST,
        [&wifiManager](AsyncWebServerRequest *request) {
            JsonDocument doc;
            if (!parseJsonBody(request, doc)) return;

            String ssid = doc["ssid"] | "";
            String pass = doc["pass"] | (doc["password"] | "");

            if (ssid.length() == 0) {
                sendError(request, 400, "Le nom du réseau (SSID) est obligatoire.");
                return;
            }

            bool ok = wifiManager.connectSTA(ssid, pass);
            if (ok) {
                sendSuccess(request, "Connexion en cours vers '" + ssid + "'. L'AP local reste actif.");
            } else {
                sendError(request, 500, "Impossible d'initialiser la connexion station.");
            }
        },
        nullptr,
        handleBodyChunk
    );

    server.on("/api/wifi/reset", HTTP_POST, [&wifiManager](AsyncWebServerRequest *request) {
        wifiManager.resetSTA();
        sendSuccess(request, "Configuration Wi-Fi réinitialisée. Retour au mode AP local seul.");
    });

    server.on("/api/wifi/forget", HTTP_POST, [&wifiManager](AsyncWebServerRequest *request) {
        wifiManager.resetSTA();
        sendSuccess(request, "Configuration Wi-Fi réinitialisée. Retour au mode AP local seul.");
    });

    // -------------------------------------------------------------
    // 10. DIAGNOSTIC & SANTÉ DU SYSTÈME (/api/diagnostics & /api/system/restart)
    // -------------------------------------------------------------
    server.on("/api/diagnostics", HTTP_GET, [&devManager, &wifiManager, &diagManager](AsyncWebServerRequest *request) {
        if (request->hasParam("ts")) {
            uint32_t clientTs = request->getParam("ts")->value().toInt();
            if (clientTs > 1600000000) {
                diagManager.syncTime(clientTs);
            }
        }
        sendJsonResponse(request, 200, diagManager.getDiagnosticsJson(devManager, wifiManager));
    });

    server.on("/api/diag", HTTP_GET, [&devManager, &wifiManager, &diagManager](AsyncWebServerRequest *request) {
        if (request->hasParam("ts")) {
            uint32_t clientTs = request->getParam("ts")->value().toInt();
            if (clientTs > 1600000000) {
                diagManager.syncTime(clientTs);
            }
        }
        sendJsonResponse(request, 200, diagManager.getDiagnosticsJson(devManager, wifiManager));
    });

    server.on("/api/diagnostics/clear", HTTP_POST, [&diagManager](AsyncWebServerRequest *request) {
        diagManager.clearLogs();
        sendSuccess(request, "Historique de diagnostic effacé avec succès.");
    });

    server.on("/api/diag/clear", HTTP_POST, [&diagManager](AsyncWebServerRequest *request) {
        diagManager.clearLogs();
        sendSuccess(request, "Historique de diagnostic effacé avec succès.");
    });

    server.on("/api/diagnostics/log", HTTP_POST,
        [&diagManager](AsyncWebServerRequest *request) {
            JsonDocument doc;
            if (!parseJsonBody(request, doc)) return;

            String level = doc["level"] | "INFO";
            String message = doc["message"] | "";
            if (message.length() > 0) {
                diagManager.addLog(level, message);
            }
            sendSuccess(request, "Événement consigné dans le journal.");
        },
        NULL,
        handleBodyChunk
    );

    // -------------------------------------------------------------
    // 5ter. POST /api/devices/toggle-inverted : Inversion logique (Normale / Inversée)
    // -------------------------------------------------------------
    server.on("/api/devices/toggle-inverted", HTTP_POST,
        [&devManager, &diagManager](AsyncWebServerRequest *request) {
            JsonDocument doc;
            if (!parseJsonBody(request, doc)) return;

            uint8_t id = doc["id"] | 0;
            bool inverted = doc["inverted"] | false;

            Device* dev = devManager.getDeviceById(id);
            String devName = dev ? dev->name : ("ID #" + String(id));

            bool ok = devManager.setDeviceInverted(id, inverted);
            if (ok) {
                diagManager.addLog("INFO", "Logique équipement : \"" + devName + "\" modifiée en " + (inverted ? "INVERSÉE" : "NORMALE"));
                broadcastDeviceState(devManager);
                sendSuccess(request, inverted ? "Logique inversée" : "Logique normale");
            } else {
                sendError(request, 404, "Périphérique introuvable");
            }
        },
        NULL,
        handleBodyChunk
    );

    server.on("/api/system/restart", HTTP_POST, [&diagManager](AsyncWebServerRequest *request) {
        sendSuccess(request, "Redémarrage de l'ESP32 en cours...");
        vTaskDelay(pdMS_TO_TICKS(300));
        diagManager.restartSystem();
    });

    // -------------------------------------------------------------
    // 11. Fichiers statiques LittleFS
    // -------------------------------------------------------------
    server.serveStatic("/", LittleFS, "/").setDefaultFile("index.html").setCacheControl("no-cache, no-store, must-revalidate");

    // -------------------------------------------------------------
    // Gestionnaire 404 & OPTIONS
    // -------------------------------------------------------------
    server.onNotFound([](AsyncWebServerRequest *request) {
        if (request->method() == HTTP_OPTIONS) {
            AsyncWebServerResponse *response = request->beginResponse(200);
            addCorsHeaders(response);
            request->send(response);
        } else {
            AsyncWebServerResponse *response = request->beginResponse(404, "text/plain", "404: Not Found");
            addCorsHeaders(response);
            request->send(response);
        }
    });

    Serial.println("[WebServer] Routes API REST, Didacticiel et LittleFS configurées.");
}
