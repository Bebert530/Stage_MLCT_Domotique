#pragma once

#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include "DeviceManager.h"
#include "AutomationManager.h"
#include "WiFiManager.h"
#include "DiagnosticManager.h"

/**
 * @brief Configure l'ensemble des routes REST, WebSockets et statiques pour le serveur web embarqué
 */
void setupWebServerRoutes(AsyncWebServer& server, DeviceManager& devManager, AutomationManager& autoManager, WiFiManager& wifiManager, DiagnosticManager& diagManager);

/**
 * @brief Diffuse l'état actuel des périphériques à tous les clients WebSocket connectés
 */
void broadcastDeviceState(DeviceManager& devManager);
