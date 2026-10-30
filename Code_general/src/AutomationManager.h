#pragma once

#include <Arduino.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <vector>
#include "TimerUtil.h"
#include "DeviceManager.h"

/**
 * @struct AutomationCondition
 * @brief Condition élémentaire d'une règle
 */
struct AutomationCondition {
    uint8_t triggerId;      // ID de l'équipement déclencheur (source)
    String conditionValue;  // "ON" ou "OFF" pour Tout-ou-Rien
    String op;              // "<", ">", "=", "BETWEEN", "STATE"
    float threshold;        // Seuil numérique legacy (°C, Volts, %, etc.)
    float minVal = 0.0f;    // Seuil minimum de la plage fermée [Min, Max]
    float maxVal = 0.0f;    // Seuil maximum de la plage fermée [Min, Max]
    bool isNumerical = false; // Vrai si condition basée sur une plage numérique
};

/**
 * @struct AutomationAction
 * @brief Action élémentaire à exécuter sur un actionneur
 */
struct AutomationAction {
    uint8_t targetId;       // ID de l'équipement cible (actionneur)
    String actionValue;     // "ON" ou "OFF" pour relais
    uint8_t actionPercent;  // 0 à 100% pour variateur PWM
};

/**
 * @struct AutomationRule
 * @brief Représentation d'une règle d'automatisation (SI [conditions] ALORS [actions])
 */
struct AutomationRule {
    uint8_t id;             // Identifiant unique de la règle
    String name;            // Intitulé de la règle
    bool enabled;           // Règle activée ou désactivée
    std::vector<AutomationCondition> conditions;
    std::vector<AutomationAction> actions;
};

/**
 * @class AutomationManager
 * @brief Moteur d'évaluation et de persistance des règles d'automatisation
 */
class AutomationManager {
public:
    AutomationManager();
    ~AutomationManager();

    bool begin(const char* rulesPath = "/automations.json");
    bool loadRules();
    bool saveRules(const String& jsonContent);
    String getRulesJson();

    /**
     * @brief Évalue périodiquement les règles actives et pilote les équipements
     * @param devManager Référence vers le DeviceManager
     */
    void update(DeviceManager& devManager);

private:
    String _rulesPath;
    std::vector<AutomationRule> _rules;
    SemaphoreHandle_t _mutex;
    NonBlockingTimer _evalTimer;
};
