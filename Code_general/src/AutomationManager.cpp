#include "AutomationManager.h"
#include <cmath>

AutomationManager::AutomationManager() 
    : _rulesPath("/automations.json"), _evalTimer(500) {
    _mutex = xSemaphoreCreateMutex();
}

AutomationManager::~AutomationManager() {
    if (_mutex) {
        vSemaphoreDelete(_mutex);
    }
}

bool AutomationManager::begin(const char* rulesPath) {
    if (rulesPath && strlen(rulesPath) > 0) {
        _rulesPath = rulesPath;
    }
    _evalTimer.start(500);
    return loadRules();
}

bool AutomationManager::loadRules() {
    xSemaphoreTake(_mutex, portMAX_DELAY);
    _rules.clear();

    if (!LittleFS.exists(_rulesPath)) {
        Serial.printf("[AutomationManager] Fichier %s inexistant. Initialisation vide.\n", _rulesPath.c_str());
        xSemaphoreGive(_mutex);
        return true;
    }

    File f = LittleFS.open(_rulesPath, "r");
    if (!f) {
        Serial.printf("[AutomationManager] Impossible d'ouvrir %s en lecture.\n", _rulesPath.c_str());
        xSemaphoreGive(_mutex);
        return false;
    }

#if defined(ARDUINOJSON_VERSION_MAJOR) && (ARDUINOJSON_VERSION_MAJOR >= 7)
    JsonDocument doc;
#else
    DynamicJsonDocument doc(4096);
#endif
    DeserializationError err = deserializeJson(doc, f);
    f.close();

    if (err) {
        Serial.printf("[AutomationManager] Erreur désérialisation JSON : %s\n", err.c_str());
        xSemaphoreGive(_mutex);
        return false;
    }

    JsonArray array = doc["rules"].as<JsonArray>();
    for (JsonObject obj : array) {
        AutomationRule rule;
        rule.id = obj["id"] | 0;
        rule.name = (const char*)(obj["name"] | (const char*)(obj["title"] | ""));
        rule.enabled = obj["enabled"] | true;

        if (obj["conditions"].is<JsonArray>()) {
            JsonArray conds = obj["conditions"].as<JsonArray>();
            for (JsonObject cObj : conds) {
                AutomationCondition cond;
                cond.triggerId = cObj["triggerId"] | (cObj["triggerDeviceId"] | 0);
                cond.conditionValue = (const char*)(cObj["conditionValue"] | "ON");
                cond.op = (const char*)(cObj["operator"] | (const char*)(cObj["op"] | "BETWEEN"));
                cond.threshold = cObj["threshold"] | 0.0f;
                cond.minVal = cObj["minVal"] | (cObj["min"] | 0.0f);
                cond.maxVal = cObj["maxVal"] | (cObj["max"] | 0.0f);
                cond.isNumerical = cObj["isNumerical"] | (cond.op == "BETWEEN" || cObj["minVal"].is<float>());
                if (cond.triggerId > 0) {
                    rule.conditions.push_back(cond);
                }
            }
        } else if (obj["triggerId"].is<uint8_t>() || obj["triggerDeviceId"].is<uint8_t>()) {
            AutomationCondition cond;
            cond.triggerId = obj["triggerId"] | (obj["triggerDeviceId"] | 0);
            cond.conditionValue = (const char*)(obj["conditionValue"] | "ON");
            cond.op = (const char*)(obj["operator"] | "BETWEEN");
            cond.threshold = obj["threshold"] | 0.0f;
            cond.minVal = obj["minVal"] | (obj["min"] | 0.0f);
            cond.maxVal = obj["maxVal"] | (obj["max"] | 0.0f);
            cond.isNumerical = obj["isNumerical"] | (cond.op == "BETWEEN" || obj["minVal"].is<float>());
            if (cond.triggerId > 0) {
                rule.conditions.push_back(cond);
            }
        }

        if (obj["actions"].is<JsonArray>()) {
            JsonArray acts = obj["actions"].as<JsonArray>();
            for (JsonObject aObj : acts) {
                AutomationAction act;
                act.targetId = aObj["targetId"] | (aObj["actionDeviceId"] | 0);
                act.actionValue = (const char*)(aObj["actionValue"] | "ON");
                act.actionPercent = aObj["actionPercent"] | 100;
                if (act.targetId > 0) {
                    rule.actions.push_back(act);
                }
            }
        } else if (obj["targetId"].is<uint8_t>() || obj["actionDeviceId"].is<uint8_t>()) {
            AutomationAction act;
            act.targetId = obj["targetId"] | (obj["actionDeviceId"] | 0);
            act.actionValue = (const char*)(obj["actionValue"] | "ON");
            act.actionPercent = obj["actionPercent"] | 100;
            if (act.targetId > 0) {
                rule.actions.push_back(act);
            }
        }

        _rules.push_back(rule);
    }

    Serial.printf("[AutomationManager] %u règles chargées depuis %s.\n", (unsigned int)_rules.size(), _rulesPath.c_str());
    xSemaphoreGive(_mutex);
    return true;
}

bool AutomationManager::saveRules(const String& jsonContent) {
    xSemaphoreTake(_mutex, portMAX_DELAY);

    File f = LittleFS.open(_rulesPath, "w");
    if (!f) {
        Serial.printf("[AutomationManager] Impossible d'ouvrir %s en écriture.\n", _rulesPath.c_str());
        xSemaphoreGive(_mutex);
        return false;
    }

    size_t written = f.print(jsonContent);
    f.close();
    xSemaphoreGive(_mutex);

    if (written > 0) {
        Serial.printf("[AutomationManager] %u octets écrits dans %s.\n", (unsigned int)written, _rulesPath.c_str());
        loadRules();
        return true;
    }
    return false;
}

String AutomationManager::getRulesJson() {
    xSemaphoreTake(_mutex, portMAX_DELAY);

    if (!LittleFS.exists(_rulesPath)) {
        xSemaphoreGive(_mutex);
        return "{\"rules\":[]}";
    }

    File f = LittleFS.open(_rulesPath, "r");
    if (!f) {
        xSemaphoreGive(_mutex);
        return "{\"rules\":[]}";
    }

    String content = f.readString();
    f.close();
    xSemaphoreGive(_mutex);
    return content.length() > 0 ? content : "{\"rules\":[]}";
}

#include <map>

void AutomationManager::update(DeviceManager& devManager) {
    if (!_evalTimer.checkAndReset()) {
        return; // Évaluation toutes les 500ms
    }

    xSemaphoreTake(_mutex, portMAX_DELAY);
    std::vector<AutomationRule> rulesCopy = _rules;
    xSemaphoreGive(_mutex);

    // Structure pour collecter l'état attendu pour chaque actionneur cible
    struct TargetAction {
        bool hasMetRule = false;
        uint8_t desiredState = 0;
        uint8_t desiredPwm = 0;
    };
    std::map<uint8_t, TargetAction> targetActions;

    // 1. Répertorier tous les actionneurs cibles présents dans les règles activées
    for (const auto& rule : rulesCopy) {
        if (!rule.enabled) continue;
        for (const auto& act : rule.actions) {
            if (act.targetId == 0) continue;
            if (targetActions.find(act.targetId) == targetActions.end()) {
                targetActions[act.targetId] = TargetAction();
            }
        }
    }

    // 2. Évaluer chaque règle : TOUTES les conditions de la règle doivent être satisfaites
    for (const auto& rule : rulesCopy) {
        if (!rule.enabled) continue;
        if (rule.conditions.empty() || rule.actions.empty()) continue;

        bool allConditionsMet = true;

        for (const auto& cond : rule.conditions) {
            Device* trig = devManager.getDeviceById(cond.triggerId);
            if (!trig || !trig->enabled) {
                allConditionsMet = false;
                break;
            }

            bool condMet = false;

            bool isStateCondition = (cond.op == "STATE" || cond.op == "==" || !cond.isNumerical);
            if (isStateCondition) {
                uint8_t desiredState = (cond.conditionValue == "ON" || cond.conditionValue == "1") ? 1 : 0;
                condMet = (trig->state == desiredState);
            } else if (trig->mode == MODE_INPUT_ONEWIRE || trig->mode == MODE_INPUT_ADC_NTC) {
                float currentTemp = trig->value / 100.0f;
                if (cond.op == "BETWEEN" || (cond.minVal != 0.0f || cond.maxVal != 0.0f)) {
                    condMet = (currentTemp >= cond.minVal && currentTemp <= cond.maxVal);
                } else if (cond.op == "<") {
                    condMet = (currentTemp < cond.threshold);
                } else if (cond.op == "=") {
                    condMet = (fabs(currentTemp - cond.threshold) < 0.5f);
                } else { // ">"
                    condMet = (currentTemp > cond.threshold);
                }
            } else if (trig->mode == MODE_INPUT_ADC) {
                float volts = (trig->value / 4095.0f) * 3.3f;
                if (cond.op == "BETWEEN" || (cond.minVal != 0.0f || cond.maxVal != 0.0f)) {
                    condMet = (volts >= cond.minVal && volts <= cond.maxVal);
                } else if (cond.op == "<") {
                    condMet = (volts < cond.threshold);
                } else if (cond.op == "=") {
                    condMet = (fabs(volts - cond.threshold) < 0.1f);
                } else { // ">"
                    condMet = (volts > cond.threshold);
                }
            } else if (trig->mode == MODE_OUTPUT_PWM) {
                float pct = (trig->value / 255.0f) * 100.0f;
                if (cond.op == "BETWEEN" || (cond.minVal != 0.0f || cond.maxVal != 0.0f)) {
                    condMet = (pct >= cond.minVal && pct <= cond.maxVal);
                } else if (cond.op == "<") {
                    condMet = (pct < cond.threshold);
                } else if (cond.op == "=") {
                    condMet = (fabs(pct - cond.threshold) < 1.0f);
                } else { // ">"
                    condMet = (pct > cond.threshold);
                }
            } else { // MODE_INPUT_DIGITAL, MODE_INPUT_PIR, MODE_OUTPUT_RELAY
                uint8_t desiredState = (cond.conditionValue == "ON" || cond.conditionValue == "1") ? 1 : 0;
                condMet = (trig->state == desiredState);
            }

            if (!condMet) {
                allConditionsMet = false;
                break;
            }
        }

        // Si toutes les conditions de la règle sont vérifiées, appliquer toutes ses actions
        if (allConditionsMet) {
            for (const auto& act : rule.actions) {
                Device* target = devManager.getDeviceById(act.targetId);
                if (!target || !target->enabled) continue;

                targetActions[act.targetId].hasMetRule = true;

                if (target->mode == MODE_OUTPUT_PWM) {
                    uint8_t pwm = (uint8_t)round((act.actionPercent / 100.0f) * 255.0f);
                    if (pwm >= targetActions[act.targetId].desiredPwm) {
                        targetActions[act.targetId].desiredPwm = pwm;
                        targetActions[act.targetId].desiredState = (pwm > 0) ? 1 : 0;
                    }
                } else {
                    uint8_t st = (act.actionValue == "ON" || act.actionValue == "1") ? 1 : 0;
                    targetActions[act.targetId].desiredState = st;
                }
            }
        }
    }

    // 3. Application des états finaux aux actionneurs
    for (const auto& pair : targetActions) {
        uint8_t targetId = pair.first;
        const TargetAction& act = pair.second;
        Device* target = devManager.getDeviceById(targetId);
        if (!target || !target->enabled) continue;

        if (act.hasMetRule) {
            if (target->mode == MODE_OUTPUT_PWM) {
                if (target->value != act.desiredPwm || target->state != act.desiredState) {
                    devManager.setDeviceState(target->id, act.desiredState, act.desiredPwm);
                }
            } else {
                if (target->state != act.desiredState) {
                    devManager.setDeviceState(target->id, act.desiredState, 0);
                }
            }
        } else {
            // Aucune règle active ne demande la marche de cet actionneur
            if (target->mode == MODE_OUTPUT_PWM) {
                if (target->value != 0 || target->state != 0) {
                    devManager.setDeviceState(target->id, 0, 0);
                }
            } else {
                if (target->state != 0) {
                    devManager.setDeviceState(target->id, 0, 0);
                }
            }
        }
    }
}


