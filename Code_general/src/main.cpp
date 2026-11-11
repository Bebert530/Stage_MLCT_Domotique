#include <Arduino.h>
#include <WiFi.h>
#include <LittleFS.h>
#include <ESPAsyncWebServer.h>

#include "DeviceManager.h"
#include "AutomationManager.h"
#include "WiFiManager.h"
#include "DiagnosticManager.h"
#include "WebServerRoutes.h"

// Instances globales
AsyncWebServer server(80);
DeviceManager devManager;
AutomationManager autoManager;
WiFiManager wifiManager;
DiagnosticManager diagManager;

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n==================================================");
    Serial.println("         VAN ASSISTANT - HUB EMBARQUÉ            ");
    Serial.println("==================================================");

    // 0. Initialisation du Gestionnaire de Diagnostic & Watchdog matériel (10s)
    diagManager.begin(10);

    // 1. Initialisation du Gestionnaire de matériel (LittleFS + GPIO + /config.json)
    if (!devManager.begin("/config.json")) {
        Serial.println("[MAIN] ERREUR CRITIQUE : Échec de démarrage du DeviceManager !");
    } else {
        Serial.println("[MAIN] DeviceManager opérationnel.");
    }

    // 2. Initialisation du Moteur d'automatisation (/automations.json)
    if (!autoManager.begin("/automations.json")) {
        Serial.println("[MAIN] Avertissement : Échec chargement initial des automatisations.");
    } else {
        Serial.println("[MAIN] AutomationManager opérationnel.");
    }

    // 3. Initialisation du Gestionnaire Wi-Fi Hybride résilient (AP 'Van-Assistant-Local' + STA /wifi.json + mDNS)
    wifiManager.begin("/wifi.json");

    // 4. Configuration des endpoints API REST, WebSockets et distribution des fichiers LittleFS
    setupWebServerRoutes(server, devManager, autoManager, wifiManager, diagManager);

    // 5. Lancement du serveur Web asynchrone
    server.begin();
    Serial.println("[MAIN] Serveur HTTP & WebSockets démarré avec succès.");
    Serial.println("==================================================\n");
}

void loop() {
    // 0. Réarmement du Watchdog matériel (Auto-Recovery)
    diagManager.feedWatchdog();

    // 1. Surveillance & reconnexion non-bloquante du Wi-Fi
    wifiManager.update();

    // 2. Mise à jour des capteurs physiques généraux et fin des tests matériels temporaires
    devManager.updateHardwareTests();
    devManager.updateSensors();

    // 3. Évaluation et exécution autonome des règles d'automatisation
    autoManager.update(devManager);

    // 4. Surveillance continue de diagnostic matériel et enregistrement d'événements 48h
    diagManager.update(devManager, wifiManager);

    // 5. Diffusion WebSocket périodique (toutes les 1.5s) des états de capteurs et actionneurs
    static unsigned long lastWsPush = 0;
    if (millis() - lastWsPush >= 1500) {
        lastWsPush = millis();
        broadcastDeviceState(devManager);
    }

    // 6. Délai FreeRTOS coopératif (50ms)
    vTaskDelay(pdMS_TO_TICKS(50));
}
