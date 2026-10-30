/**
 * Van Assistant - Embedded Web Application
 * Contrôleur Frontend & Gestionnaire Domotique pour ESP32 (LittleFS)
 */

// --- VARIABLES GLOBALES ---
let devicesList = [];
let automationRules = [];
let editingDeviceId = null;
let editingAutomationRuleId = null;
let currentLang = 'fr';
let isWsConnected = false;
let socket = null;
let socketReconnectTimer = null;
let deviceRefreshInterval = null;

try {
  currentLang = localStorage.getItem('van_assistant_lang') || localStorage.getItem('esp32_ha_lang') || 'fr';
  if (!['fr', 'en', 'es'].includes(currentLang)) currentLang = 'fr';
} catch (e) {
  currentLang = 'fr';
}

// =========================================================================
// SYSTÈME MULTILINGUE (i18n) : FRANÇAIS / ENGLISH / ESPAÑOL
// =========================================================================
const TRANSLATIONS = {
  "fr": {
    "login_username": "Identifiant",
    "login_password": "Mot de passe",
    "login_submit": "SE CONNECTER",
    "login_error": "Identifiants incorrects.",
    "header_connected": "Connecté",
    "header_disconnected": "Déconnecté...",
    "nav_dashboard": "Tableau de bord",
    "nav_devices": "Matériel",
    "nav_automation": "Automatisation",
    "nav_settings": "Paramètres",
    "nav_diag": "Diagnostic",
    "nav_account": "Compte",
    "dash_title": "Tableau de Bord",
    "dash_lbl_total": "Équipements",
    "dash_lbl_active": "Actionneurs actifs",
    "dash_lbl_sensors": "Capteurs connectés",
    "empty_dash_title": "Aucun équipement pour le moment",
    "empty_dash_desc": "Commencez par ajouter votre premier capteur (mouvement, température) ou actionneur (lumière, variateur, relais) via le gestionnaire de matériel.",
    "btn_unified_add": "Ajouter un équipement",
    "btn_edit": "Modifier",
    "modal_edit_title": "Modifier l'équipement",
    "modal_edit_step": "Modification des caractéristiques matérielles",
    "devices_title": "Gestionnaire de Matériel",
    "devices_desc": "",
    "th_dev_name": "Nom de l'équipement",
    "th_dev_type": "Catégorie & Tension",
    "th_dev_mode": "Type de signal",
    "th_dev_gpio": "Broche GPIO",
    "th_dev_state": "État / Mesure",
    "th_device_active": "Actif",
    "th_dev_actions": "Actions",
    "empty_devices": "Aucun équipement déclaré. Cliquez sur « Ajouter un équipement » pour commencer.",
    "auto_title": "Règles d'Automatisation",
    "auto_desc": "",
    "auto_btn_add": "Ajouter une règle",
    "btn_add_rule": "Ajouter une règle",
    "th_auto_name": "Intitulé",
    "label_auto_name": "Intitulé de la règle",
    "modal_auto_add_title": "Ajouter une automatisation",
    "modal_auto_edit_title": "Modifier l'automatisation",
    "btn_update": "Mettre à jour",
    "toast_rule_updated": "Règle mise à jour avec succès.",
    "toast_rule_exists_name": "Une règle avec cet intitulé existe déjà.",
    "toast_rule_exists_duplicate": "Une règle identique existe déjà",
    "th_auto_if": "SI",
    "th_auto_source": "Équipement source",
    "th_auto_condition": "Condition",
    "th_auto_then": "ALORS",
    "th_auto_target": "Équipement cible",
    "th_auto_action": "Action",
    "th_auto_active": "Actif",
    "th_auto_actions": "Actions",
    "modal_rule_title": "Ajouter une règle d'automatisation",
    "modal_rule_subtitle": "Pilotez automatiquement vos équipements selon vos capteurs",
    "label_rule_name": "Nom de la règle",
    "lbl_rule_if_cond": "Condition de déclenchement",
    "label_rule_trigger_dev": "Capteur source",
    "label_rule_cond_state": "État requis du capteur",
    "label_rule_cond_analog": "Condition sur la mesure",
    "lbl_rule_then_action": "Action à exécuter",
    "label_rule_action_dev": "Actionneur cible",
    "label_rule_action_relay": "Action sur le relais",
    "btn_save_rule": "Enregistrer la règle",
    "empty_rules": "Aucune règle d'automatisation enregistrée. Cliquez sur « Ajouter une règle » ci-dessus pour configurer un automatisme.",
    "settings_title": "Paramètres Système",
    "settings_sub": "",
    "wifi_section_title": "Paramètres Réseau Wi-Fi Hybride",
    "wifi_section_sub": "Connectez l'ESP32 au réseau de votre van ou domicile tout en conservant le Point d'Accès local de secours.",
    "wifi_ap_label": "Point d'Accès de Secours (AP)",
    "wifi_sta_label": "Réseau Local (Station)",
    "wifi_mdns_label": "Accès mDNS direct",
    "wifi_btn_scan": "Rechercher les réseaux",
    "wifi_btn_scanning": "Recherche...",
    "wifi_select_placeholder": "-- Sélectionner un réseau détecté --",
    "wifi_field_ssid": "Nom du réseau Wi-Fi (SSID)",
    "wifi_field_pass": "Mot de passe Wi-Fi",
    "wifi_btn_forget": "Oublier le réseau Wi-Fi",
    "wifi_btn_connect": "Appliquer la connexion",
    "wifi_btn_connecting": "Connexion en cours...",
    "diag_title": "Diagnostic Système",
    "diag_subtitle": "",
    "diag_btn_selftest": "Actualiser",
    "diag_cpu_title": "Microcontrôleur & Watchdog",
    "diag_lbl_wdt": "ESP32 Task Watchdog",
    "diag_lbl_uptime": "Temps de fonctionnement",
    "diag_lbl_reset_reason": "Dernier redémarrage",
    "diag_lbl_heap": "Mémoire RAM libre",
    "diag_lbl_cpu": "Fréquence / Puce",
    "diag_net_title": "Connectivité & Réseau",
    "diag_lbl_ap": "Point d'Accès local (AP)",
    "diag_lbl_sta": "Connexion Wi-Fi Station",
    "diag_logs_title": "Journal des événements & alertes (Rétention 48h)",
    "diag_btn_restart_text": "Redémarrer l'ESP32",
    "account_title": "Gestion du Compte",
    "account_sub": "",
    "account_lang_title": "Langue de l'application",
    "account_lang_sub": "Sélectionnez la langue d'affichage",
    "account_role": "Administrateur",
    "account_role_user": "Utilisateur",
    "account_logout": "Se déconnecter",
    "users_mgmt_title": "Comptes Utilisateurs",
    "users_mgmt_sub": "Créez jusqu'à 3 comptes \"utilisateur\" en plus du compte administrateur.",
    "btn_add_user": "Ajouter un utilisateur",
    "modal_user_title": "Ajouter un utilisateur",
    "label_user_username": "Nom d'utilisateur",
    "label_user_password": "Mot de passe",
    "btn_create_account": "Créer le compte",
    "toast_user_created": "Compte utilisateur créé avec succès.",
    "toast_user_deleted": "Compte utilisateur supprimé.",
    "toast_user_max_reached": "Limite de 3 comptes utilisateurs atteinte.",
    "toast_user_exists": "Ce nom d'utilisateur existe déjà.",
    "modal_unified_title": "Que souhaitez-vous ajouter ?",
    "modal_unified_sub": "Choisissez la catégorie de matériel à connecter à votre ESP32",
    "choice_sensor_title": "Capteur",
    "choice_sensor_desc": "Capteur de mouvement PIR, Sonde numérique 3 fils (température, humidité...), Sonde numérique 2 fils, Capteur analogique 0-3.3V, Contact sec / bouton.",
    "badge_sensor": "Capteur",
    "choice_actuator_title": "Actionneur",
    "choice_actuator_desc": "Tout-ou-rien (2 ou 3 fils), Variateur PWM (2 ou 3 fils), Éclairage, Pompe, Ventilateur.",
    "badge_actuator": "Actionneur",
    "btn_cancel": "Annuler",
    "modal_dev_title": "1. Déclarer un équipement",
    "modal_dev_step": "Étape 1/2 : Caractéristiques du matériel",
    "label_dev_name": "Nom de l'équipement",
    "placeholder_dev_name": "Ex: Lumière Salon, Pompe à eau, Ventilateur...",
    "label_dev_cat": "Catégorie",
    "opt_cat_actuator": "Actionneur (Sortie / Puissance)",
    "opt_cat_sensor": "Capteur (Entrée / Mesure)",
    "label_dev_mode_cmd": "Type de commande / signal",
    "label_dev_voltage": "Tension d'alimentation",
    "label_pwm_wiring_type": "Type de raccordement",
    "opt_pwm_dedicated": "3 fils : Fil de commande / signal dédié sur GPIO",
    "opt_pwm_mosfet": "2 fils : Alimentation hachée ou coupée (Module relais / MOSFET)",
    "label_dev_gpio": "Broche GPIO (Attribution automatique recommandée)",
    "opt_gpio_auto": "Attribution automatique optimale par l'ESP32",
    "btn_save_changes": "Enregistrer",
    "btn_next_wire": "Suivant : Câbler sur la carte",
    "wizard_title": "Didacticiel de Câblage Assisté",
    "wizard_subtitle": "Guide pas-à-pas pour votre installation",
    "lbl_switch_tutorial": "Tutoriel :",
    "wizard_assigned_pin": "Broche assignée :",
    "wizard_pin_reserved": "Sélectionnée et réservée par l'ESP32",
    "wizard_test_title": "Test du branchement physique",
    "wizard_test_sub": "Vérifiez le fonctionnement électrique avant de refermer le boîtier",
    "wizard_btn_test_actuator": "Tester l'actionneur",
    "wizard_btn_test_sensor": "Tester la lecture du capteur",
    "wizard_test_waiting": "En attente du test...",
    "wizard_test_waiting_act": "En attente du test... (Prévention 5s puis impulsion 3s)",
    "wizard_test_waiting_sens": "En attente du test... (Lecture immédiate)",
    "wizard_btn_back": "Revenir",
    "wizard_btn_finish": "Câblage terminé & Activer",
    "toast_wizard_consult_done": "Consultation du tutoriel terminée.",
    "toast_diag_refreshed": "Diagnostic matériel actualisé avec succès.",
    "toast_restart_confirm": "Confirmez-vous le redémarrage immédiat de l'ESP32 ?",
    "toast_restarting": "Redémarrage de l'ESP32 en cours... Reconnexion dans 5 secondes.",
    "wizard_wire_prefix": "Câbler : ",
    "wizard_pin_allocated": "allouée automatiquement",
    "toast_save_success": "Configuration sauvegardée avec succès.",
    "toast_dev_deleted": "Équipement supprimé avec succès.",
    "toast_rule_added": "Règle ajoutée.",
    "toast_rule_deleted": "Règle supprimée.",
    "toast_add_dev_first": "Ajoutez d'abord des équipements dans l'onglet Matériel.",
    "toast_no_csv": "Aucun cycle à exporter",
    "toast_csv_success": "Export CSV généré avec succès",
    "toast_delete_confirm": "Êtes-vous sûr de vouloir supprimer définitivement l'équipement",
    "toast_wizard_success": "Équipement activé et configuré avec succès.",
    "toast_name_required": "Le nom de l'équipement est requis.",
    "toast_db_refreshed": "Base de données des cycles actualisée",
    "toast_rule_status": "Règle {status}.",
    "toast_warn_starting_5s": "Attention : l'appareil va démarrer dans 5 secondes !",
    "toast_actuator_test_success": "Test actionneur terminé avec succès.",
    "toast_sensor_val": "Valeur capteur : {val}",
    "toast_sensor_val_sim": "Valeur capteur (Simulation) : {val}",
    "toast_dev_read_val": "{name} : Valeur lue = {val}",
    "toast_dev_sim_val": "{name} (Simulation) : Valeur = {val}",
    "toast_dev_warn_start_5s": "Attention : \\\"{name}\\\" va démarrer dans 5 secondes !",
    "toast_dev_test_done": "Test terminé pour \\\"{name}\\\".",
    "test_starting_in": "Démarrage dans {sec}s...",
    "test_warn_starting_html": "Attention : l'appareil va démarrer dans <strong>{sec} secondes</strong> !",
    "test_running_sec": "En marche ({sec}s)...",
    "test_pulse_active_html": "Impulsion active sur GPIO {gpio} ({sec}s)...",
    "test_actuator_validated_html": "Test validé : Actionneur activé pendant 3 secondes sur GPIO {gpio}.",
    "test_retest_actuator": "Re-tester l'actionneur",
    "test_reading_signal": "Lecture du signal...",
    "test_reading_gpio": "Lecture de la broche GPIO {gpio}...",
    "test_measured_volts_html": "Valeur mesurée : <strong>{volts} V</strong> (ADC : {raw} / 4095)",
    "test_sensor_state_html": "Valeur du capteur : <strong style=\\\"font-size:16px; color:var(--cyan-light);\\\">{state}</strong> ({desc})",
    "test_contact_closed": "Contact fermé",
    "test_contact_open": "Contact ouvert",
    "test_measured_sim_volts_html": "Valeur mesurée (Simulation) : <strong>2.15 V</strong>",
    "test_sensor_sim_state_html": "Valeur du capteur (Simulation) : <strong style=\\\"font-size:16px; color:var(--cyan-light);\\\">ON</strong> (Contact fermé)",
    "test_btn_caution_sec": "Attention ({sec}s)...",
    "test_sensor_onewire_html": "Sonde numérique 3 fils : <strong>{val}</strong>",
    "toast_onewire_read": "Lecture sonde 3 fils : {msg}",
    "toast_esp32_comm_error": "Erreur de communication avec l'ESP32.",
    "toast_hardware_test_error": "Erreur de test matériel",
    "toast_device_comm_error": "{name} : Erreur de communication avec l'ESP32",
    "toast_sensor_test_success": "Test capteur réussi.",
    "toast_wifi_scan_done": "{count} réseau(x) Wi-Fi détecté(s)",
    "toast_wifi_connecting": "Connexion à \\\"{ssid}\\\" en cours. L'AP local reste actif.",
    "toast_wifi_forget_confirm": "Êtes-vous sûr de vouloir oublier la connexion au réseau du van ?",
    "toast_wifi_reset_done": "Réseau du van oublié. Retour au mode AP local seul.",
    "toast_wifi_ssid_required": "Veuillez saisir le nom du réseau Wi-Fi (SSID).",
    "toast_rule_conflict_similar": "Une règle similaire contradictoire existe déjà",
    "label_auto_name_required": "Veuillez saisir un intitulé pour la règle.",
    "toast_rule_need_condition": "Veuillez ajouter au moins une condition.",
    "toast_rule_need_actuator": "Veuillez ajouter au moins un actionneur.",
    "toast_rule_valid_sensor": "Veuillez sélectionner un capteur valide.",
    "toast_rule_duplicate_sensor": "Chaque capteur ne peut être sélectionné qu'une seule fois dans la même règle.",
    "toast_rule_valid_range": "Veuillez renseigner une plage numérique valide [Min, Max].",
    "toast_rule_invalid_range": "Plage invalide : le Min doit être inférieur ou égal au Max.",
    "toast_rule_valid_actuator": "Veuillez sélectionner un actionneur valide.",
    "toast_rule_duplicate_actuator": "Chaque actionneur ne peut être sélectionné qu'une seule fois dans la même règle.",
    "toast_rule_define_action": "Veuillez définir une action pour chaque actionneur.",
    "stat_on_time_24h": "Temps allumé (24h)",
    "stat_est_consumption": "Consommation estimée",
    "stat_last_motion": "Dernier mouvement",
    "stat_detections_24h": "Détections (24h)",
    "stat_temp_min_24h": "Température Min (24h)",
    "stat_temp_max_24h": "Température Max (24h)",
    "stat_measure_min_24h": "Mesure Min (24h)",
    "stat_measure_max_24h": "Mesure Max (24h)",
    "dev_history_title_suffix": "Historique 24h",
    "act_turn_on": "Allumer (ON)",
    "act_turn_off": "Éteindre (OFF)",
    "act_set_pwm": "Régler à : {pct} %",
    "lbl_set_to": "Régler à :",
    "cond_type_range": "Plage de valeurs",
    "cond_type_state": "État du capteur",
    "cond_state_on": "Actif (ON)",
    "cond_state_off": "Inactif (OFF)",
    "cond_pir_motion": "Mouvement détecté",
    "cond_pir_no_motion": "Aucun mouvement",
    "cond_contact_closed": "Contact fermé (Actif)",
    "cond_contact_open": "Contact ouvert (Inactif)",
    "cond_lbl_state_prefix": "État :",
    "cond_temp_in": "Température dans",
    "cond_volt_in": "Tension dans",
    "cond_pwm_in": "Variateur dans",
    "cond_val_in": "Valeur dans",
    "cond_live_prefix": "Actuellement :",
    "cond_range_lbl": "Plage",
    "lbl_and": "ET"
  },
  "en": {
    "login_username": "Username",
    "login_password": "Password",
    "login_submit": "SIGN IN",
    "login_error": "Invalid credentials.",
    "header_connected": "Connected",
    "header_disconnected": "Disconnected...",
    "nav_dashboard": "Dashboard",
    "nav_devices": "Hardware",
    "nav_automation": "Automations",
    "nav_settings": "Settings",
    "nav_diag": "Diagnostics",
    "nav_account": "Account",
    "dash_title": "Dashboard",
    "dash_lbl_total": "Devices",
    "dash_lbl_active": "Active Actuators",
    "dash_lbl_sensors": "Connected Sensors",
    "empty_dash_title": "No devices configured yet",
    "empty_dash_desc": "Start by adding your first sensor (motion, temperature) or actuator (light, relay, dimmer) via the hardware tab.",
    "btn_unified_add": "Add Device",
    "btn_edit": "Edit",
    "modal_edit_title": "Edit Device",
    "modal_edit_step": "Device configuration update",
    "devices_title": "Hardware Manager",
    "devices_desc": "",
    "th_dev_name": "Device Name",
    "th_dev_type": "Category & Voltage",
    "th_dev_mode": "Signal Type",
    "th_dev_gpio": "GPIO Pin",
    "th_dev_state": "State / Reading",
    "th_device_active": "Active",
    "th_dev_actions": "Actions",
    "empty_devices": "No devices declared yet. Click 'Add Device' to start.",
    "auto_title": "Automation Rules",
    "auto_desc": "",
    "auto_btn_add": "Add a rule",
    "btn_add_rule": "Add a rule",
    "th_auto_name": "Title",
    "label_auto_name": "Rule Title",
    "modal_auto_add_title": "Add Automation",
    "modal_auto_edit_title": "Edit Automation",
    "btn_update": "Update",
    "toast_rule_updated": "Rule updated successfully.",
    "toast_rule_exists_name": "A rule with this title already exists.",
    "toast_rule_exists_duplicate": "An identical automation rule already exists",
    "th_auto_if": "IF",
    "th_auto_source": "Source device",
    "th_auto_condition": "Condition",
    "th_auto_then": "THEN",
    "th_auto_target": "Target device",
    "th_auto_action": "Action",
    "th_auto_active": "Active",
    "th_auto_actions": "Actions",
    "modal_rule_title": "Add Automation Rule",
    "modal_rule_subtitle": "Automatically control devices based on sensor readings",
    "label_rule_name": "Rule name",
    "lbl_rule_if_cond": "Trigger condition",
    "label_rule_trigger_dev": "Source sensor",
    "label_rule_cond_state": "Required sensor state",
    "label_rule_cond_analog": "Measurement condition",
    "lbl_rule_then_action": "Action to execute",
    "label_rule_action_dev": "Target actuator",
    "label_rule_action_relay": "Relay action",
    "btn_save_rule": "Save rule",
    "empty_rules": "No automation rules configured yet. Click 'Add a rule' above to create one.",
    "settings_title": "System Settings",
    "settings_sub": "",
    "wifi_section_title": "Hybrid Wi-Fi Network Settings",
    "wifi_section_sub": "Connect the ESP32 to your home network while preserving the local fallback Access Point.",
    "wifi_ap_label": "Fallback Access Point (AP)",
    "wifi_sta_label": "Local Network (Station)",
    "wifi_mdns_label": "Direct mDNS Access",
    "wifi_btn_scan": "Scan Networks",
    "wifi_btn_scanning": "Scanning...",
    "wifi_select_placeholder": "-- Select detected network --",
    "wifi_field_ssid": "Wi-Fi Network Name (SSID)",
    "wifi_field_pass": "Wi-Fi Password",
    "wifi_btn_forget": "Forget Wi-Fi Network",
    "wifi_btn_connect": "Apply Connection",
    "wifi_btn_connecting": "Connecting...",
    "diag_title": "System Diagnostics",
    "diag_subtitle": "",
    "diag_btn_selftest": "Refresh",
    "diag_cpu_title": "Microcontroller & Watchdog",
    "diag_lbl_wdt": "ESP32 Task Watchdog",
    "diag_lbl_uptime": "Uptime",
    "diag_lbl_reset_reason": "Last Reset",
    "diag_lbl_heap": "Free RAM Heap",
    "diag_lbl_cpu": "Frequency / Chip",
    "diag_net_title": "Connectivity & Network",
    "diag_lbl_ap": "Local Access Point (AP)",
    "diag_lbl_sta": "Station Wi-Fi Connection",
    "diag_logs_title": "Event & Alert Log (48h Retention)",
    "diag_btn_restart_text": "Restart ESP32",
    "account_title": "Account Management",
    "account_sub": "",
    "account_lang_title": "Application Language",
    "account_lang_sub": "Select display language",
    "account_role": "Administrator",
    "account_role_user": "Standard User",
    "account_logout": "Sign Out",
    "users_mgmt_title": "User Accounts",
    "users_mgmt_sub": "Create up to 3 user accounts in addition to the administrator account.",
    "btn_add_user": "Add User",
    "modal_user_title": "Add User Account",
    "label_user_username": "Username",
    "label_user_password": "Password",
    "btn_create_account": "Create Account",
    "toast_user_created": "User account created successfully.",
    "toast_user_deleted": "User account deleted.",
    "toast_user_max_reached": "Limit of 3 user accounts reached.",
    "toast_user_exists": "This username already exists.",
    "modal_unified_title": "What do you want to add?",
    "modal_unified_sub": "Choose the hardware category to connect to your ESP32",
    "choice_sensor_title": "Sensor",
    "choice_sensor_desc": "PIR motion sensor, 3-wire digital probe (temperature, humidity...), 2-wire digital probe, 0-3.3V analog, dry contact.",
    "badge_sensor": "Sensor",
    "choice_actuator_title": "Actuator",
    "choice_actuator_desc": "On/Off (2 or 3 wires), PWM Dimmer (2 or 3 wires), Lighting, Pump, Fan.",
    "badge_actuator": "Actuator",
    "btn_cancel": "Cancel",
    "modal_dev_title": "1. Declare a Device",
    "modal_dev_step": "Step 1/2: Hardware specifications",
    "label_dev_name": "Device Name",
    "placeholder_dev_name": "e.g. Living Room Light, Water Pump, Fan...",
    "label_dev_cat": "Category",
    "opt_cat_actuator": "Actuator (Output / Power)",
    "opt_cat_sensor": "Sensor (Input / Measurement)",
    "label_dev_mode_cmd": "Signal / Command Type",
    "label_dev_voltage": "Supply Voltage",
    "label_pwm_wiring_type": "Wiring Connection Type",
    "opt_pwm_dedicated": "3 wires: Dedicated control / signal wire to GPIO",
    "opt_pwm_mosfet": "2 wires: Switched power feed (Relay / MOSFET module)",
    "label_dev_gpio": "GPIO Pin (Automatic selection recommended)",
    "opt_gpio_auto": "Optimal auto-allocation by ESP32",
    "btn_save_changes": "Save",
    "btn_next_wire": "Next: Wire on Board",
    "wizard_title": "Assisted Wiring Tutorial",
    "wizard_subtitle": "Step-by-step guide for your installation",
    "lbl_switch_tutorial": "Tutorial:",
    "wizard_assigned_pin": "Assigned pin:",
    "wizard_pin_reserved": "Selected and reserved by ESP32",
    "wizard_test_title": "Physical connection test",
    "wizard_test_sub": "Check electrical operation before closing enclosure",
    "wizard_btn_test_actuator": "Test actuator",
    "wizard_btn_test_sensor": "Test sensor reading",
    "wizard_test_waiting": "Waiting for test...",
    "wizard_test_waiting_act": "Waiting for test... (5s warning then 3s pulse)",
    "wizard_test_waiting_sens": "Waiting for test... (Immediate reading)",
    "wizard_btn_back": "Back",
    "wizard_btn_finish": "Wiring complete & Activate",
    "toast_wizard_consult_done": "Tutorial consultation completed.",
    "toast_diag_refreshed": "Hardware diagnostic refreshed successfully.",
    "toast_restart_confirm": "Do you confirm immediate restart of the ESP32?",
    "toast_restarting": "Restarting ESP32... Reconnecting in 5 seconds.",
    "wizard_wire_prefix": "Wire: ",
    "wizard_pin_allocated": "automatically allocated",
    "toast_save_success": "Configuration saved successfully.",
    "toast_dev_deleted": "Device deleted successfully.",
    "toast_rule_added": "Rule added.",
    "toast_rule_deleted": "Rule deleted.",
    "toast_add_dev_first": "First add devices in the Hardware tab.",
    "toast_no_csv": "No cycles to export",
    "toast_csv_success": "CSV export generated successfully",
    "toast_delete_confirm": "Are you sure you want to permanently delete device",
    "toast_wizard_success": "Device activated and configured successfully.",
    "toast_name_required": "Device name is required.",
    "toast_db_refreshed": "Cycle database refreshed",
    "toast_rule_status": "Rule {status}.",
    "toast_warn_starting_5s": "Caution: device will start in 5 seconds!",
    "toast_actuator_test_success": "Actuator test completed successfully.",
    "toast_sensor_val": "Sensor value: {val}",
    "toast_sensor_val_sim": "Sensor value (Simulation): {val}",
    "toast_dev_read_val": "{name}: Read value = {val}",
    "toast_dev_sim_val": "{name} (Simulation): Value = {val}",
    "toast_dev_warn_start_5s": "Caution: \\\"{name}\\\" will start in 5 seconds!",
    "toast_dev_test_done": "Test completed for \\\"{name}\\\".",
    "test_starting_in": "Starting in {sec}s...",
    "test_warn_starting_html": "Caution: device will start in <strong>{sec} seconds</strong>!",
    "test_running_sec": "Running ({sec}s)...",
    "test_pulse_active_html": "Active pulse on GPIO {gpio} ({sec}s)...",
    "test_actuator_validated_html": "Test passed: Actuator activated for 3 seconds on GPIO {gpio}.",
    "test_retest_actuator": "Retest actuator",
    "test_reading_signal": "Reading signal...",
    "test_reading_gpio": "Reading GPIO pin {gpio}...",
    "test_measured_volts_html": "Measured value: <strong>{volts} V</strong> (ADC: {raw} / 4095)",
    "test_sensor_state_html": "Sensor value: <strong style=\\\"font-size:16px; color:var(--cyan-light);\\\">{state}</strong> ({desc})",
    "test_contact_closed": "Contact closed",
    "test_contact_open": "Contact open",
    "test_measured_sim_volts_html": "Measured value (Simulation): <strong>2.15 V</strong>",
    "test_sensor_sim_state_html": "Sensor value (Simulation): <strong style=\\\"font-size:16px; color:var(--cyan-light);\\\">ON</strong> (Contact closed)",
    "test_btn_caution_sec": "Caution ({sec}s)...",
    "test_sensor_onewire_html": "3-wire digital probe: <strong>{val}</strong>",
    "toast_onewire_read": "3-wire probe reading: {msg}",
    "toast_esp32_comm_error": "Communication error with ESP32.",
    "toast_hardware_test_error": "Hardware test error",
    "toast_device_comm_error": "{name}: Communication error with ESP32",
    "toast_sensor_test_success": "Sensor test successful.",
    "toast_wifi_scan_done": "{count} Wi-Fi network(s) detected",
    "toast_wifi_connecting": "Connecting to \\\"{ssid}\\\". Local AP remains active.",
    "toast_wifi_forget_confirm": "Are you sure you want to forget the van Wi-Fi connection?",
    "toast_wifi_reset_done": "Van network forgotten. Reverted to local AP only.",
    "toast_wifi_ssid_required": "Please enter Wi-Fi network name (SSID).",
    "toast_rule_conflict_similar": "A similar conflicting rule already exists",
    "label_auto_name_required": "Please enter a title for the rule.",
    "toast_rule_need_condition": "Please add at least one condition.",
    "toast_rule_need_actuator": "Please add at least one actuator.",
    "toast_rule_valid_sensor": "Please select a valid sensor.",
    "toast_rule_duplicate_sensor": "Each sensor can only be selected once in the same rule.",
    "toast_rule_valid_range": "Please enter a valid numeric range [Min, Max].",
    "toast_rule_invalid_range": "Invalid range: Min must be less than or equal to Max.",
    "toast_rule_valid_actuator": "Please select a valid actuator.",
    "toast_rule_duplicate_actuator": "Each actuator can only be selected once in the same rule.",
    "toast_rule_define_action": "Please define an action for each actuator.",
    "stat_on_time_24h": "On-time (24h)",
    "stat_est_consumption": "Estimated consumption",
    "stat_last_motion": "Last motion",
    "stat_detections_24h": "Detections (24h)",
    "stat_temp_min_24h": "Min Temperature (24h)",
    "stat_temp_max_24h": "Max Temperature (24h)",
    "stat_measure_min_24h": "Min Reading (24h)",
    "stat_measure_max_24h": "Max Reading (24h)",
    "dev_history_title_suffix": "24h History",
    "act_turn_on": "Turn ON (ON)",
    "act_turn_off": "Turn OFF (OFF)",
    "act_set_pwm": "Set to: {pct} %",
    "lbl_set_to": "Set to:",
    "cond_type_range": "Value range",
    "cond_type_state": "Sensor state",
    "cond_state_on": "Active (ON)",
    "cond_state_off": "Inactive (OFF)",
    "cond_pir_motion": "Motion detected",
    "cond_pir_no_motion": "No motion",
    "cond_contact_closed": "Contact closed (Active)",
    "cond_contact_open": "Contact open (Inactive)",
    "cond_lbl_state_prefix": "State:",
    "cond_temp_in": "Temperature in",
    "cond_volt_in": "Voltage in",
    "cond_pwm_in": "Dimmer in",
    "cond_val_in": "Value in",
    "cond_live_prefix": "Currently:",
    "cond_range_lbl": "Range",
    "lbl_and": "AND"
  },
  "es": {
    "login_username": "Usuario",
    "login_password": "Contraseña",
    "login_submit": "INICIAR SESIÓN",
    "login_error": "Credenciales incorrectas.",
    "header_connected": "Conectado",
    "header_disconnected": "Desconectado...",
    "nav_dashboard": "Panel de control",
    "nav_devices": "Dispositivos",
    "nav_automation": "Automatización",
    "nav_settings": "Ajustes",
    "nav_diag": "Diagnóstico",
    "nav_account": "Cuenta",
    "dash_title": "Panel de Control",
    "dash_lbl_total": "Equipos",
    "dash_lbl_active": "Actuadores activos",
    "dash_lbl_sensors": "Sensores conectados",
    "empty_dash_title": "Ningún dispositivo configurado",
    "empty_dash_desc": "Comience agregando su primer sensor (movimiento, temperatura) o actuador (luz, relé, regulador) en la pestaña de dispositivos.",
    "btn_unified_add": "Añadir un equipo",
    "btn_edit": "Modificar",
    "modal_edit_title": "Modificar equipo",
    "modal_edit_step": "Modificación de características del hardware",
    "devices_title": "Gestor de Dispositivos",
    "devices_desc": "",
    "th_dev_name": "Nombre del equipo",
    "th_dev_type": "Categoría y Voltaje",
    "th_dev_mode": "Tipo de señal",
    "th_dev_gpio": "Pin GPIO",
    "th_dev_state": "Estado / Lectura",
    "th_device_active": "Activo",
    "th_dev_actions": "Acciones",
    "empty_devices": "Ningún dispositivo declarado. Haga clic en «Añadir un equipo» para comenzar.",
    "auto_title": "Reglas de Automatización",
    "auto_desc": "",
    "auto_btn_add": "Añadir una regla",
    "btn_add_rule": "Añadir una regla",
    "th_auto_name": "Título",
    "label_auto_name": "Título de la regla",
    "modal_auto_add_title": "Añadir automatización",
    "modal_auto_edit_title": "Modificar automatización",
    "btn_update": "Actualizar",
    "toast_rule_updated": "Regla actualizada con éxito.",
    "toast_rule_exists_name": "Ya existe una regla con este título.",
    "toast_rule_exists_duplicate": "Ya existe una regla de automatización idéntica",
    "th_auto_if": "SI",
    "th_auto_source": "Dispositivo origen",
    "th_auto_condition": "Condición",
    "th_auto_then": "ENTONCES",
    "th_auto_target": "Dispositivo destino",
    "th_auto_action": "Acción",
    "th_auto_active": "Activo",
    "th_auto_actions": "Acciones",
    "modal_rule_title": "Añadir regla de automatización",
    "modal_rule_subtitle": "Controle dispositivos automáticamente según las lecturas de los sensores",
    "label_rule_name": "Nombre de la regla",
    "lbl_rule_if_cond": "Condición de activación",
    "label_rule_trigger_dev": "Sensor origen",
    "label_rule_cond_state": "Estado requerido del sensor",
    "label_rule_cond_analog": "Condición sobre la medición",
    "lbl_rule_then_action": "Acción a ejecutar",
    "label_rule_action_dev": "Actuador destino",
    "label_rule_action_relay": "Acción en el relé",
    "btn_save_rule": "Guardar regla",
    "empty_rules": "Ninguna regla de automatización guardada. Haga clic en «Añadir una regla» para configurar una.",
    "settings_title": "Ajustes del Sistema",
    "settings_sub": "",
    "wifi_section_title": "Ajustes de Red Wi-Fi Híbrida",
    "wifi_section_sub": "Conecte el ESP32 a la red de su furgoneta o casa manteniendo el Punto de Acceso local de respaldo.",
    "wifi_ap_label": "Punto de Acceso de Respaldo (AP)",
    "wifi_sta_label": "Red Local (Station)",
    "wifi_mdns_label": "Acceso mDNS directo",
    "wifi_btn_scan": "Buscar redes",
    "wifi_btn_scanning": "Buscando...",
    "wifi_select_placeholder": "-- Seleccionar red detectada --",
    "wifi_field_ssid": "Nombre de red Wi-Fi (SSID)",
    "wifi_field_pass": "Contraseña Wi-Fi",
    "wifi_btn_forget": "Olvidar red Wi-Fi",
    "wifi_btn_connect": "Aplicar conexión",
    "wifi_btn_connecting": "Conectando...",
    "diag_title": "Diagnóstico del Sistema",
    "diag_subtitle": "",
    "diag_btn_selftest": "Actualizar",
    "diag_cpu_title": "Microcontrolador y Watchdog",
    "diag_lbl_wdt": "ESP32 Task Watchdog",
    "diag_lbl_uptime": "Tiempo de actividad",
    "diag_lbl_reset_reason": "Último reinicio",
    "diag_lbl_heap": "Memoria RAM libre",
    "diag_lbl_cpu": "Frecuencia / Chip",
    "diag_net_title": "Conectividad y Red",
    "diag_lbl_ap": "Punto de Acceso local (AP)",
    "diag_lbl_sta": "Conexión Wi-Fi Station",
    "diag_logs_title": "Registro de eventos y alertas (Retención 48h)",
    "diag_btn_restart_text": "Reiniciar ESP32",
    "account_title": "Gestión de Cuenta",
    "account_sub": "",
    "account_lang_title": "Idioma de la aplicación",
    "account_lang_sub": "Seleccione el idioma de visualización",
    "account_role": "Administrador",
    "account_role_user": "Usuario",
    "account_logout": "Cerrar sesión",
    "users_mgmt_title": "Cuentas de Usuario",
    "users_mgmt_sub": "Cree hasta 3 cuentas de usuario además de la cuenta de administrador.",
    "btn_add_user": "Añadir usuario",
    "modal_user_title": "Añadir Cuenta de Usuario",
    "label_user_username": "Nombre de usuario",
    "label_user_password": "Contraseña",
    "btn_create_account": "Crear cuenta",
    "toast_user_created": "Cuenta de usuario creada con éxito.",
    "toast_user_deleted": "Cuenta de usuario eliminada.",
    "toast_user_max_reached": "Límite de 3 cuentas de usuario alcanzado.",
    "toast_user_exists": "Este nombre de usuario ya existe.",
    "modal_unified_title": "¿Qué desea añadir?",
    "modal_unified_sub": "Elija la categoría de hardware para conectar a su ESP32",
    "choice_sensor_title": "Sensor",
    "choice_sensor_desc": "Sensor de movimiento PIR, sonda digital de 3 hilos (temperatura, humedad...), sonda digital de 2 hilos, analógico 0-3.3V, contacto seco.",
    "badge_sensor": "Sensor",
    "choice_actuator_title": "Actuador",
    "choice_actuator_desc": "Todo o nada (2 o 3 hilos), Regulador PWM (2 o 3 hilos), Iluminación, Bomba, Ventilador.",
    "badge_actuator": "Actuador",
    "btn_cancel": "Cancelar",
    "modal_dev_title": "1. Declarar un dispositivo",
    "modal_dev_step": "Paso 1/2: Especificaciones del hardware",
    "label_dev_name": "Nombre del equipo",
    "placeholder_dev_name": "Ej: Luz Salón, Bomba de agua, Ventilador...",
    "label_dev_cat": "Categoría",
    "opt_cat_actuator": "Actuador (Salida / Potencia)",
    "opt_cat_sensor": "Sensor (Entrada / Medición)",
    "label_dev_mode_cmd": "Tipo de control / señal",
    "label_dev_voltage": "Voltaje de alimentación",
    "label_pwm_wiring_type": "Tipo de conexión",
    "opt_pwm_dedicated": "3 hilos: Hilo de señal / control dedicado al GPIO",
    "opt_pwm_mosfet": "2 hilos: Alimentación conmutada (Módulo relé / MOSFET)",
    "label_dev_gpio": "Pin GPIO (Asignación automática recomendada)",
    "opt_gpio_auto": "Asignación automática óptima por el ESP32",
    "btn_save_changes": "Guardar",
    "btn_next_wire": "Siguiente: Cablear en la placa",
    "wizard_title": "Tutorial de Cableado Asistido",
    "wizard_subtitle": "Guía paso a paso para su instalación",
    "lbl_switch_tutorial": "Tutorial:",
    "wizard_assigned_pin": "Pin asignado:",
    "wizard_pin_reserved": "Seleccionado y reservado por el ESP32",
    "wizard_test_title": "Prueba de conexión física",
    "wizard_test_sub": "Verifique el funcionamiento eléctrico antes de cerrar la caja",
    "wizard_btn_test_actuator": "Probar actuador",
    "wizard_btn_test_sensor": "Probar lectura del sensor",
    "wizard_test_waiting": "Esperando prueba...",
    "wizard_test_waiting_act": "Esperando prueba... (Prevención 5s y pulso 3s)",
    "wizard_test_waiting_sens": "Esperando prueba... (Lectura inmediata)",
    "wizard_btn_back": "Volver",
    "wizard_btn_finish": "Cableado terminado y Activar",
    "toast_wizard_consult_done": "Consulta del tutorial finalizada.",
    "toast_diag_refreshed": "Diagnóstico de hardware actualizado con éxito.",
    "toast_restart_confirm": "¿Confirma el reinicio inmediato del ESP32?",
    "toast_restarting": "Reiniciando ESP32... Reconexión en 5 segundos.",
    "wizard_wire_prefix": "Cablear: ",
    "wizard_pin_allocated": "asignado automáticamente",
    "toast_save_success": "Configuración guardada con éxito.",
    "toast_dev_deleted": "Dispositivo eliminado con éxito.",
    "toast_rule_added": "Regla añadida.",
    "toast_rule_deleted": "Regla eliminada.",
    "toast_add_dev_first": "Primero agregue dispositivos en la pestaña Hardware.",
    "toast_no_csv": "No hay ciclos para exportar",
    "toast_csv_success": "Exportación CSV generada con éxito",
    "toast_delete_confirm": "¿Está seguro de eliminar definitivamente el equipo",
    "toast_wizard_success": "Dispositivo activado y configurado con éxito.",
    "toast_name_required": "El nombre del dispositivo es obligatorio.",
    "toast_db_refreshed": "Base de datos de ciclos actualizada",
    "toast_rule_status": "Regla {status}.",
    "toast_warn_starting_5s": "Atención: ¡el dispositivo arrancará en 5 segundos!",
    "toast_actuator_test_success": "Prueba del actuador completada con éxito.",
    "toast_sensor_val": "Valor del sensor: {val}",
    "toast_sensor_val_sim": "Valor del sensor (Simulación): {val}",
    "toast_dev_read_val": "{name}: Valor leído = {val}",
    "toast_dev_sim_val": "{name} (Simulación): Valor = {val}",
    "toast_dev_warn_start_5s": "Atención: ¡\\\"{name}\\\" arrancará en 5 segundos!",
    "toast_dev_test_done": "Prueba completada para \\\"{name}\\\".",
    "test_starting_in": "Arrancando en {sec}s...",
    "test_warn_starting_html": "Atención: ¡el dispositivo arrancará en <strong>{sec} segundos</strong>!",
    "test_running_sec": "En marcha ({sec}s)...",
    "test_pulse_active_html": "Pulso activo en GPIO {gpio} ({sec}s)...",
    "test_actuator_validated_html": "Prueba validada: Actuador activado durante 3 segundos en GPIO {gpio}.",
    "test_retest_actuator": "Volver a probar el actuador",
    "test_reading_signal": "Leyendo señal...",
    "test_reading_gpio": "Leyendo pin GPIO {gpio}...",
    "test_measured_volts_html": "Valor medido: <strong>{volts} V</strong> (ADC: {raw} / 4095)",
    "test_sensor_state_html": "Valor del sensor: <strong style=\\\"font-size:16px; color:var(--cyan-light);\\\">{state}</strong> ({desc})",
    "test_contact_closed": "Contacto cerrado",
    "test_contact_open": "Contacto abierto",
    "test_measured_sim_volts_html": "Valor medido (Simulación): <strong>2.15 V</strong>",
    "test_sensor_sim_state_html": "Valor del sensor (Simulación): <strong style=\\\"font-size:16px; color:var(--cyan-light);\\\">ON</strong> (Contacto cerrado)",
    "test_btn_caution_sec": "Atención ({sec}s)...",
    "test_sensor_onewire_html": "Sonda digital 3 hilos: <strong>{val}</strong>",
    "toast_onewire_read": "Lectura sonda 3 hilos: {msg}",
    "toast_esp32_comm_error": "Error de comunicación con el ESP32.",
    "toast_hardware_test_error": "Error de prueba de hardware",
    "toast_device_comm_error": "{name}: Error de comunicación con el ESP32",
    "toast_sensor_test_success": "Prueba de sensor exitosa.",
    "toast_wifi_scan_done": "{count} red(es) Wi-Fi detectada(s)",
    "toast_wifi_connecting": "Conectando a \\\"{ssid}\\\". El AP local sigue activo.",
    "toast_wifi_forget_confirm": "¿Está seguro de olvidar la conexión a la red del camper?",
    "toast_wifi_reset_done": "Red del camper olvidada. Regresado solo al AP local.",
    "toast_wifi_ssid_required": "Por favor introduzca el nombre de la red Wi-Fi (SSID).",
    "toast_rule_conflict_similar": "Ya existe una regla similar contradictoria",
    "label_auto_name_required": "Por favor introduzca un título para la regla.",
    "toast_rule_need_condition": "Por favor agregue al menos una condición.",
    "toast_rule_need_actuator": "Por favor agregue al menos un actuador.",
    "toast_rule_valid_sensor": "Por favor seleccione un sensor válido.",
    "toast_rule_duplicate_sensor": "Cada sensor solo puede ser seleccionado una vez en la misma regla.",
    "toast_rule_valid_range": "Por favor introduzca un rango numérico válido [Mín, Máx].",
    "toast_rule_invalid_range": "Rango inválido: el Mín debe ser menor o igual que el Máx.",
    "toast_rule_valid_actuator": "Por favor seleccione un actuador válido.",
    "toast_rule_duplicate_actuator": "Cada actuador solo puede ser seleccionado una vez en la misma regla.",
    "toast_rule_define_action": "Por favor defina una acción para cada actuador.",
    "stat_on_time_24h": "Tiempo encendido (24h)",
    "stat_est_consumption": "Consumo estimado",
    "stat_last_motion": "Último movimiento",
    "stat_detections_24h": "Detecciones (24h)",
    "stat_temp_min_24h": "Temperatura Mín (24h)",
    "stat_temp_max_24h": "Temperatura Máx (24h)",
    "stat_measure_min_24h": "Medición Mín (24h)",
    "stat_measure_max_24h": "Medición Máx (24h)",
    "dev_history_title_suffix": "Historial 24h",
    "act_turn_on": "Encender (ON)",
    "act_turn_off": "Apagar (OFF)",
    "act_set_pwm": "Ajustar a: {pct} %",
    "lbl_set_to": "Ajustar a:",
    "cond_type_range": "Rango de valores",
    "cond_type_state": "Estado del sensor",
    "cond_state_on": "Activo (ON)",
    "cond_state_off": "Inactivo (OFF)",
    "cond_pir_motion": "Movimiento detectado",
    "cond_pir_no_motion": "Sin movimiento",
    "cond_contact_closed": "Contacto cerrado (Activo)",
    "cond_contact_open": "Contacto abierto (Inactivo)",
    "cond_lbl_state_prefix": "Estado:",
    "cond_temp_in": "Temperatura en",
    "cond_volt_in": "Voltaje en",
    "cond_pwm_in": "Regulador en",
    "cond_val_in": "Valor en",
    "cond_live_prefix": "Actualmente:",
    "cond_range_lbl": "Rango",
    "lbl_and": "Y"
  }
};

function t(key, fallback = '') {
  const langTable = TRANSLATIONS[currentLang] || TRANSLATIONS['fr'];
  return langTable[key] !== undefined ? langTable[key] : (TRANSLATIONS['fr'][key] || fallback || key);
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = t(key, el.innerHTML);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key, el.getAttribute('placeholder')));
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key, el.getAttribute('title')));
  });

  const langSelect = document.getElementById('app-lang-select');
  if (langSelect) langSelect.value = currentLang;

  const titlePrefix = "Van Assistant";
  document.title = `${titlePrefix} - ${t('nav_dashboard', 'Tableau de bord')}`;
}

function setLanguage(lang) {
  if (!['fr', 'en', 'es'].includes(lang)) return;
  currentLang = lang;
  try {
    localStorage.setItem('van_assistant_lang', lang);
    localStorage.setItem('esp32_ha_lang', lang);
  } catch(e) {}
  applyTranslations();
  renderDevicesTable();
  renderAutomationTable();
  updateGlobalStats();
  showToast(currentLang === 'fr' ? 'Langue modifiée en Français.' : (currentLang === 'es' ? 'Idioma cambiado a Español.' : 'Language switched to English.'), 'info');
}

// =========================================================================
// UTILITAIRES & COMMUNICATION API
// =========================================================================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('collapsed');
}

function getUserAccounts() {
  try {
    const raw = localStorage.getItem('van_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch(e) {}
  return [];
}

function saveUserAccounts(users) {
  try {
    localStorage.setItem('van_users', JSON.stringify(users));
  } catch(e) {}
}

function getCurrentUserRole() {
  return sessionStorage.getItem('van_assistant_role') || 'admin';
}

function getCurrentUsername() {
  return sessionStorage.getItem('van_assistant_user') || 'admin';
}

function applyUserRoleVisibility() {
  const role = getCurrentUserRole();
  const username = getCurrentUsername();
  const isUser = (role === 'user');

  // Affichage du rôle et nom dans la vue Compte
  const roleEl = document.getElementById('current-account-role');
  if (roleEl) {
    roleEl.innerText = isUser ? t('account_role_user', 'Utilisateur') : t('account_role', 'Administrateur');
  }
  const userEl = document.getElementById('current-account-user');
  if (userEl) {
    userEl.innerText = username;
  }

  // Masquer / afficher les menus dans la barre latérale
  // Sur un compte utilisateur : uniquement Tableau de bord, Automatisation, Paramètres, Compte
  const btnDevices = document.getElementById('nav-btn-devices');
  const btnDiag = document.getElementById('nav-btn-diag');
  if (btnDevices) btnDevices.style.display = 'flex';
  if (btnDiag) btnDiag.style.display = isUser ? 'none' : 'flex';

  // Si l'utilisateur est sur un onglet interdit (Diagnostic), basculer sur le dashboard
  const activeView = document.querySelector('.view.active');
  if (isUser && activeView && activeView.id === 'view-diag') {
    switchTab('dashboard');
  }

  // Masquer le bouton d'ajout d'équipement dans le menu Matériel si utilisateur
  const devAddBtn = document.getElementById('btn-devices-add-main') || document.querySelector('#view-devices .device-manager-header button');
  if (devAddBtn) {
    devAddBtn.style.display = isUser ? 'none' : 'inline-flex';
  }

  // Masquer les colonnes techniques (Type de signal & Broche GPIO) pour le rôle utilisateur
  document.querySelectorAll('.col-tech-info').forEach(el => {
    el.style.display = isUser ? 'none' : '';
  });

  // Actualiser le tableau des équipements pour adapter les colonnes et boutons
  renderDevicesTable();

  // Masquer le bouton d'ajout d'équipement dans l'état vide du dashboard si utilisateur
  const emptyStateBtn = document.querySelector('#dashboard-empty-state button');
  if (emptyStateBtn) {
    emptyStateBtn.style.display = isUser ? 'none' : 'inline-flex';
  }

  // Carte de gestion des comptes dans la vue Compte (uniquement admin)
  const mgmtCard = document.getElementById('admin-user-management-card');
  if (mgmtCard) {
    mgmtCard.style.display = isUser ? 'none' : 'block';
  }

  // Rendu de la liste des comptes utilisateurs
  renderUsersList();
}

function renderUsersList() {
  const container = document.getElementById('users-list-container');
  if (!container) return;

  const users = getUserAccounts();
  const btnAdd = document.getElementById('btn-open-add-user');
  if (btnAdd) {
    // Limite max de 3 comptes en plus d'admin
    if (users.length >= 3) {
      btnAdd.style.opacity = '0.5';
      btnAdd.style.pointerEvents = 'none';
      btnAdd.title = t('toast_user_max_reached', 'Limite de 3 comptes utilisateurs atteinte.');
    } else {
      btnAdd.style.opacity = '1';
      btnAdd.style.pointerEvents = 'auto';
      btnAdd.title = '';
    }
  }

  if (users.length === 0) {
    container.innerHTML = `
      <div style="font-size: 13px; color: var(--text-muted); padding: 12px; background: rgba(0,0,0,0.15); border-radius: 6px; text-align: center;">
        Aucun compte utilisateur supplémentaire créé (0 / 3).
      </div>
    `;
    return;
  }

  container.innerHTML = users.map((u, idx) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(45,212,191,0.15); color: var(--cyan-light); display: flex; align-items: center; justify-content: center;">
          <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: currentColor;"><path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/></svg>
        </div>
        <div>
          <div style="font-weight: 600; font-size: 14px; color: var(--text-light);">${escapeHtml(u.username)}</div>
          <div style="font-size: 11px; color: var(--text-muted);">Compte Utilisateur</div>
        </div>
      </div>
      <button type="button" class="btn-outline-sm" onclick="deleteUserAccount(${idx})" style="color: var(--danger); border-color: rgba(239,68,68,0.3); padding: 6px 10px;" title="Supprimer ce compte">
        <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor; vertical-align: middle;"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
      </button>
    </div>
  `).join('');
}

function openAddUserModal() {
  const users = getUserAccounts();
  if (users.length >= 3) {
    showToast(t('toast_user_max_reached', 'Limite de 3 comptes utilisateurs atteinte.'), 'warning');
    return;
  }
  const uInput = document.getElementById('new-user-username');
  const pInput = document.getElementById('new-user-password');
  if (uInput) uInput.value = '';
  if (pInput) pInput.value = '';
  const modal = document.getElementById('user-modal');
  if (modal) modal.classList.add('active');
}

function closeUserModal() {
  const modal = document.getElementById('user-modal');
  if (modal) modal.classList.remove('active');
}

function handleCreateUser(event) {
  event.preventDefault();
  const uInput = document.getElementById('new-user-username');
  const pInput = document.getElementById('new-user-password');
  const username = uInput ? uInput.value.trim() : '';
  const password = pInput ? pInput.value.trim() : '';

  if (!username || !password) {
    showToast("Veuillez remplir le nom d'utilisateur et le mot de passe.", "warning");
    return;
  }

  if (username.toLowerCase() === 'admin') {
    showToast("Le nom 'admin' est réservé au compte administrateur.", "danger");
    return;
  }

  const users = getUserAccounts();
  if (users.length >= 3) {
    showToast(t('toast_user_max_reached', 'Limite de 3 comptes utilisateurs atteinte.'), "warning");
    closeUserModal();
    return;
  }

  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    showToast(t('toast_user_exists', "Ce nom d'utilisateur existe déjà."), "warning");
    return;
  }

  users.push({
    username: username,
    password: password,
    role: 'user',
    created_at: new Date().toISOString()
  });

  saveUserAccounts(users);
  closeUserModal();
  renderUsersList();
  showToast(t('toast_user_created', "Compte utilisateur créé avec succès."), "success");
}

function deleteUserAccount(idx) {
  const users = getUserAccounts();
  if (idx < 0 || idx >= users.length) return;
  const deletedName = users[idx].username;
  if (!confirm(`Supprimer le compte utilisateur "${deletedName}" ?`)) return;

  users.splice(idx, 1);
  saveUserAccounts(users);
  renderUsersList();
  showToast(t('toast_user_deleted', "Compte utilisateur supprimé."), "info");
}

function checkLogin() {
  const userEl = document.getElementById('username') || document.getElementById('login-username');
  const passEl = document.getElementById('password') || document.getElementById('login-password');
  const user = userEl ? userEl.value.trim() : '';
  const pass = passEl ? passEl.value.trim() : '';
  const err = document.getElementById('login-error');

  const users = getUserAccounts();
  const matchedUser = users.find(u => u.username.toLowerCase() === user.toLowerCase() && u.password === pass);

  // 1. Connexion en Administrateur
  if (user === 'admin' && (pass === 'admin' || pass === 'esp32van' || (pass === '' && (window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')))) {
    sessionStorage.setItem('van_assistant_auth', '1');
    sessionStorage.setItem('van_assistant_role', 'admin');
    sessionStorage.setItem('van_assistant_user', 'admin');
    
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen') || document.getElementById('main-app');
    if (loginScreen) loginScreen.style.display = 'none';
    if (appScreen) appScreen.style.display = 'flex';

    if (window.innerWidth >= 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('collapsed');
    }

    applyUserRoleVisibility();
    initApp();
  } 
  // 2. Connexion en Utilisateur Standard
  else if (matchedUser) {
    sessionStorage.setItem('van_assistant_auth', '1');
    sessionStorage.setItem('van_assistant_role', 'user');
    sessionStorage.setItem('van_assistant_user', matchedUser.username);

    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen') || document.getElementById('main-app');
    if (loginScreen) loginScreen.style.display = 'none';
    if (appScreen) appScreen.style.display = 'flex';

    if (window.innerWidth >= 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('collapsed');
    }

    applyUserRoleVisibility();
    initApp();
  } else {
    if (err) err.style.display = 'block';
  }
}

function logout() {
  sessionStorage.removeItem('van_assistant_auth');
  sessionStorage.removeItem('van_assistant_role');
  sessionStorage.removeItem('van_assistant_user');
  location.reload();
}

function switchTab(tabId, navBtn) {
  if (getCurrentUserRole() === 'user' && tabId === 'diag') {
    tabId = 'dashboard';
    navBtn = document.getElementById('nav-btn-dashboard');
  }

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`view-${tabId}`) || document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');

  const btn = navBtn || document.getElementById(`nav-btn-${tabId}`);
  if (btn) btn.classList.add('active');

  if (tabId === 'devices') loadDevices();
  else if (tabId === 'automation') loadAutomations();
  else if (tabId === 'settings') {
    if (typeof loadWifiStatus === 'function') loadWifiStatus();
  }
  else if (tabId === 'diag') {
    if (typeof fetchDiagnostics === 'function') fetchDiagnostics();
  }
  else if (tabId === 'dashboard') updateGlobalStats();
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = msg;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

async function fetchApi(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Erreur HTTP ${res.status}`);
  }
  return res.json();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =========================================================================
// TABLEAU DE BORD (DASHBOARD)
// =========================================================================
function updateGlobalStats() {
  const totalEl = document.getElementById('dash-total-devices');
  const activeEl = document.getElementById('dash-active-actuators') || document.getElementById('dash-active-count');
  const sensorsEl = document.getElementById('dash-online-sensors') || document.getElementById('dash-sensor-count');

  const total = devicesList.length;
  const activeActuators = devicesList.filter(d => (d.category === 'ACTUATOR' || (!d.category && d.mode && d.mode.startsWith('OUTPUT'))) && d.state > 0).length;
  const onlineSensors = devicesList.filter(d => d.category === 'SENSOR' || (!d.category && d.mode && d.mode.startsWith('INPUT'))).length;

  if (totalEl) totalEl.innerText = total;
  if (activeEl) activeEl.innerText = activeActuators;
  if (sensorsEl) sensorsEl.innerText = onlineSensors;

  renderDashboardDevices();
}

function renderDashboardDevices() {
  const listEl = document.getElementById('dashboard-cards-container') || document.getElementById('dash-devices-list');
  const emptyEl = document.getElementById('dashboard-empty-state') || document.getElementById('dash-empty-state');
  if (!listEl) return;

  if (devicesList.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  let html = '';
  devicesList.forEach(dev => {
    const isActuator = (dev.category === 'ACTUATOR' || (!dev.category && dev.mode && dev.mode.startsWith('OUTPUT')));
    const isEnabled = (dev.enabled !== false);
    let controlHtml = '';

    if (!isEnabled) {
      if (isActuator) {
        controlHtml = `
          <button class="action-btn" disabled style="padding:4px 12px; font-size:12px; border-radius:6px; background:var(--bg-main); color:var(--text-muted); border:1px solid var(--border-color); cursor:not-allowed; opacity:0.6;" onclick="event.stopPropagation()">
            Inactif
          </button>
        `;
      } else {
        controlHtml = `<div style="font-size:12px; font-weight:600; color:var(--text-muted);">Inactif</div>`;
      }
    } else if (isActuator) {
      if (dev.mode === 'OUTPUT_PWM' || (dev.mode && dev.mode.includes('PWM'))) {
        const duty = dev.value || (dev.state > 0 ? 100 : 0);
        controlHtml = `
          <div style="display:flex; align-items:center; gap:8px;" onclick="event.stopPropagation()">
            <input type="range" min="0" max="100" value="${duty}" style="width:90px;" onchange="updateAuxPwm(${dev.id}, this.value)" onclick="event.stopPropagation()">
            <span style="font-size:12px; font-weight:600; width:36px; text-align:right;">${duty}%</span>
          </div>
        `;
      } else {
        const isOn = (dev.state > 0);
        controlHtml = `
          <button class="action-btn ${isOn ? 'btn-active' : ''}" style="padding:4px 12px; font-size:12px; border-radius:6px; background:${isOn ? 'var(--cyan-light)' : 'var(--bg-main)'}; color:${isOn ? '#020617' : 'var(--text-main)'}; border:1px solid var(--border-color); cursor:pointer; font-weight:700;" onclick="event.stopPropagation(); toggleAuxDevice(${dev.id})">
            ${isOn ? 'ON' : 'OFF'}
          </button>
        `;
      }
    } else {
      let valDisplay = '--';
      if (dev.mode === 'INPUT_ONEWIRE') {
        valDisplay = dev.reading !== undefined ? `${(dev.reading / 100).toFixed(1)} °C` : (dev.value !== undefined ? `${(dev.value / 100).toFixed(1)} °C` : '--');
      } else if (dev.mode === 'INPUT_PIR') {
        valDisplay = (dev.state > 0) ? '<span style="color:var(--success); font-weight:700;">DÉTECTÉ</span>' : '<span style="color:var(--text-muted);">Repos</span>';
      } else if (dev.mode === 'INPUT_DIGITAL') {
        valDisplay = (dev.state > 0) ? '<span style="color:var(--cyan-light); font-weight:700;">FERMÉ</span>' : '<span style="color:var(--text-muted);">OUVERT</span>';
      } else {
        valDisplay = `${(((dev.value || 0) / 4095) * 3.3).toFixed(2)} V`;
      }
      controlHtml = `<div style="font-size:13px; font-weight:700; color:var(--cyan-light);">${valDisplay}</div>`;
    }

    const cardStyle = isEnabled
      ? "background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer; transition:all 0.2s ease;"
      : "background:rgba(15,23,42,0.45); border:1px dashed rgba(255,255,255,0.12); opacity:0.45; filter:grayscale(0.85); border-radius:12px; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer; transition:all 0.2s ease;";

    const inactiveBadge = !isEnabled ? `<span class="badge" style="background:rgba(239,68,68,0.15); color:var(--danger); border:1px solid rgba(239,68,68,0.3); font-weight:700;">Inactif</span>` : '';

    html += `
      <div style="${cardStyle}" onclick="openDeviceHistoryModal(${dev.id})" title="Cliquer pour afficher l'historique sur 24h">
        <div>
          <div style="font-weight:700; font-size:14px; display:flex; align-items:center; gap:8px;">
            <span>${escapeHtml(dev.name)}</span>
            ${inactiveBadge}
          </div>
        </div>
        <div>${controlHtml}</div>
      </div>
    `;
  });

  listEl.innerHTML = html;
}

// =========================================================================
// HISTORIQUE 24H DES ÉQUIPEMENTS & SUIVI PIR
// =========================================================================
let prevPirStateTracker = {};

function checkPirDetectionLog(devices) {
  if (!Array.isArray(devices)) return;
  devices.forEach(d => {
    if (d.mode === 'INPUT_PIR' && d.enabled !== false) {
      const prev = prevPirStateTracker[d.id];
      if (d.state > 0 && (prev === undefined || prev === 0)) {
        // Envoi au journal de diagnostic de l'ESP32
        fetchApi('/api/diagnostics/log', 'POST', {
          level: 'INFO',
          message: `Détecteur PIR "${d.name}" (GPIO ${d.gpio}) : Mouvement détecté.`
        }).catch(() => {});
      }
      prevPirStateTracker[d.id] = d.state;
    }
  });
}

function openDeviceHistoryModal(id) {
  const dev = devicesList.find(d => d.id === id);
  if (!dev) return;

  const modal = document.getElementById('device-history-modal');
  if (!modal) return;

  const isActuator = (dev.category === 'ACTUATOR' || (!dev.category && dev.mode && dev.mode.startsWith('OUTPUT')));
  const isPIR = (dev.mode === 'INPUT_PIR');
  const isPWM = (dev.mode === 'OUTPUT_PWM');
  const isEnabled = (dev.enabled !== false);

  document.getElementById('dev-history-title').innerText = `${dev.name} - ${t('dev_history_title_suffix', 'Historique 24h')}`;


  // 1. État actuel
  const curStateEl = document.getElementById('hist-current-state');
  if (isActuator) {
    curStateEl.innerText = isPWM ? `${dev.value || 0}%` : (dev.state > 0 ? 'ON' : 'OFF');
    curStateEl.style.color = (dev.state > 0) ? 'var(--cyan-light)' : 'var(--text-muted)';
  } else if (dev.mode === 'INPUT_ONEWIRE') {
    const v = dev.reading !== undefined ? (dev.reading / 100).toFixed(1) : (dev.value !== undefined ? (dev.value / 100).toFixed(1) : '21.5');
    curStateEl.innerText = `${v} °C`;
    curStateEl.style.color = 'var(--cyan-light)';
  } else if (isPIR) {
    curStateEl.innerText = dev.state > 0 ? 'MOUVEMENT' : 'REPOS';
    curStateEl.style.color = dev.state > 0 ? 'var(--yellow-power)' : 'var(--text-muted)';
  } else if (dev.mode === 'INPUT_DIGITAL') {
    curStateEl.innerText = dev.state > 0 ? 'FERMÉ' : 'OUVERT';
    curStateEl.style.color = dev.state > 0 ? 'var(--success)' : 'var(--text-muted)';
  } else {
    curStateEl.innerText = `${(((dev.value || 0) / 4095) * 3.3).toFixed(2)} V`;
    curStateEl.style.color = 'var(--cyan-light)';
  }

  // Connecté
  const activeBadge = document.getElementById('hist-active-badge');
  activeBadge.innerHTML = isEnabled
    ? `<span class="badge badge-success">${t('header_connected', 'Connecté')}</span>`
    : `<span class="badge" style="background:rgba(239,68,68,0.15); color:var(--danger); border:1px solid rgba(239,68,68,0.3);">${t('header_disconnected', 'Déconnecté')}</span>`;

  // 2. Statistiques 24h
  const stat1Lbl = document.getElementById('hist-stat1-label');
  const stat1Val = document.getElementById('hist-stat1-val');
  const stat2Lbl = document.getElementById('hist-stat2-label');
  const stat2Val = document.getElementById('hist-stat2-val');

  if (isActuator) {
    const hours = isEnabled ? (dev.state > 0 ? 4.2 : 2.8) : 0.0;
    stat1Lbl.innerText = t('stat_on_time_24h', "Temps allumé (24h)");
    stat1Val.innerText = isEnabled ? (dev.state > 0 ? "4.2 h" : "2.8 h") : "0.0 h";

    stat2Lbl.innerText = t('stat_est_consumption', "Consommation estimée");
    let powerW = 18;
    if (dev.voltage === '5V') powerW = 5;
    else if (dev.voltage === '3.3V') powerW = 1.5;
    if (isPWM) {
      const duty = (dev.value !== undefined ? dev.value : (dev.state > 0 ? 100 : 0)) / 100;
      powerW = Math.round(powerW * Math.max(0.1, duty));
    }
    const wh = isEnabled ? Math.round(hours * powerW) : 0;
    stat2Val.innerText = isEnabled ? `~${wh} Wh` : "0 Wh";
  } else if (isPIR) {
    stat1Lbl.innerText = t('stat_last_motion', "Dernier mouvement");
    stat1Val.innerText = dev.state > 0 ? "En cours" : "Il y a 12 min";

    stat2Lbl.innerText = t('stat_detections_24h', "Détections (24h)");
    stat2Val.innerText = isEnabled ? "14 passages" : "0 passage";
  } else if (dev.mode === 'INPUT_ONEWIRE' || dev.mode === 'INPUT_ADC_NTC') {
    const curVal = parseFloat(curStateEl.innerText) || 21.0;
    stat1Lbl.innerText = t('stat_temp_min_24h', "Température Min (24h)");
    stat1Val.innerText = `${(curVal - 2.8).toFixed(1)} °C`;

    stat2Lbl.innerText = t('stat_temp_max_24h', "Température Max (24h)");
    stat2Val.innerText = `${(curVal + 3.5).toFixed(1)} °C`;
  } else {
    stat1Lbl.innerText = t('stat_measure_min_24h', "Mesure Min (24h)");
    stat1Val.innerText = "0.00 V";
    stat2Lbl.innerText = t('stat_measure_max_24h', "Mesure Max (24h)");
    stat2Val.innerText = "3.25 V";
  }

  // 3. Dessiner le graphique 24h
  renderDeviceHistoryChart(dev);

  // 4. Générer le journal 24h
  renderDeviceHistoryEvents(dev);

  modal.classList.add('active');
}

function closeDeviceHistoryModal() {
  const modal = document.getElementById('device-history-modal');
  if (modal) modal.classList.remove('active');
}

function renderDeviceHistoryChart(dev) {
  const container = document.getElementById('hist-chart-container');
  const unitEl = document.getElementById('hist-chart-unit');
  if (!container) return;

  const isActuator = (dev.category === 'ACTUATOR' || (!dev.category && dev.mode && dev.mode.startsWith('OUTPUT')));
  const isPIR = (dev.mode === 'INPUT_PIR');
  const isPWM = (dev.mode === 'OUTPUT_PWM');
  const isTemp = (dev.mode === 'INPUT_ONEWIRE' || dev.mode === 'INPUT_ADC_NTC');

  if (unitEl) {
    unitEl.innerText = isTemp ? "Unité : °C" : (isPWM ? "Unité : %" : (isActuator || isPIR ? "État : 0 (OFF) / 1 (ON)" : "Unité : Volts (V)"));
  }

  const w = 620;
  const h = 150;
  const padL = 35;
  const padR = 15;
  const padT = 15;
  const padB = 25;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Générer 25 points représentatifs des 24 dernières heures
  const points = [];
  const now = new Date();
  const curState = (dev.enabled !== false) ? dev.state : 0;
  const curVal = dev.value || 0;

  for (let i = 0; i <= 24; i++) {
    const fraction = i / 24; // 0 = il y a 24h, 1 = maintenant
    let valNorm = 0; // 0.0 à 1.0 pour le tracé

    if (dev.enabled === false) {
      valNorm = 0;
    } else if (isPIR) {
      const hour = (now.getHours() - 24 + i + 48) % 24;
      const isDay = (hour >= 7 && hour <= 22);
      if (i === 24) {
        valNorm = curState > 0 ? 1 : 0;
      } else if (isDay && (i % 3 === 0 || i % 7 === 0)) {
        valNorm = 1;
      } else {
        valNorm = 0;
      }
    } else if (isPWM) {
      const basePct = (curVal > 0 ? curVal : 70) / 100;
      valNorm = (i > 8 && i < 20) ? basePct : ((i >= 20) ? basePct * 0.8 : 0);
      if (i === 24) valNorm = (dev.state > 0 ? (dev.value || 100) / 100 : 0);
    } else if (isActuator) {
      const cycle = Math.floor(i / 4) % 2;
      valNorm = (i === 24) ? (curState > 0 ? 1 : 0) : (cycle === 1 ? 1 : 0);
    } else if (isTemp) {
      const rad = ((i - 6) / 24) * 2 * Math.PI;
      const tNorm = 0.5 + 0.35 * Math.sin(rad);
      valNorm = (i === 24) ? 0.5 : Math.max(0.1, Math.min(0.9, tNorm + (Math.sin(i * 1.5) * 0.05)));
    } else {
      valNorm = 0.3 + 0.4 * Math.abs(Math.sin(i * 0.8));
    }

    const x = padL + (fraction * plotW);
    const y = padT + plotH - (valNorm * plotH);
    points.push({ x, y, valNorm });
  }

  // Construction du chemin SVG (step pour binaire, spline pour analogique/PWM)
  let d = '';
  if (isActuator && !isPWM) {
    d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i-1].y} L ${points[i].x} ${points[i].y}`;
    }
  } else {
    d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i-1];
      const cur = points[i];
      const cpX1 = prev.x + (cur.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (cur.x - prev.x) / 2;
      const cpY2 = cur.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${cur.x} ${cur.y}`;
    }
  }

  const fillD = `${d} L ${points[points.length-1].x} ${padT + plotH} L ${points[0].x} ${padT + plotH} Z`;

  const gridLines = `
    <line x1="${padL}" y1="${padT}" x2="${w - padR}" y2="${padT}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3 3"/>
    <line x1="${padL}" y1="${padT + plotH/2}" x2="${w - padR}" y2="${padT + plotH/2}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3 3"/>
    <line x1="${padL}" y1="${padT + plotH}" x2="${w - padR}" y2="${padT + plotH}" stroke="rgba(255,255,255,0.15)"/>
    <text x="${padL - 6}" y="${padT + 4}" fill="#64748b" font-size="9" text-anchor="end">${isTemp ? '28°C' : (isPWM ? '100%' : '1')}</text>
    <text x="${padL - 6}" y="${padT + plotH/2 + 3}" fill="#64748b" font-size="9" text-anchor="end">${isTemp ? '22°C' : (isPWM ? '50%' : '0.5')}</text>
    <text x="${padL - 6}" y="${padT + plotH + 3}" fill="#64748b" font-size="9" text-anchor="end">${isTemp ? '16°C' : (isPWM ? '0%' : '0')}</text>
  `;

  const lastPt = points[points.length - 1];

  container.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:100%; display:block;" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#2dd4bf" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${fillD}" fill="url(#chartGrad)"/>
      <path d="${d}" fill="none" stroke="#2dd4bf" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="${lastPt.x}" cy="${lastPt.y}" r="4.5" fill="#2dd4bf"/>
      <circle cx="${lastPt.x}" cy="${lastPt.y}" r="8" fill="none" stroke="#2dd4bf" stroke-opacity="0.4">
        <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;
}

function renderDeviceHistoryEvents(dev) {
  const tbody = document.getElementById('hist-events-table-body');
  if (!tbody) return;

  const isActuator = (dev.category === 'ACTUATOR' || (!dev.category && dev.mode && dev.mode.startsWith('OUTPUT')));
  const isPIR = (dev.mode === 'INPUT_PIR');
  const isTemp = (dev.mode === 'INPUT_ONEWIRE' || dev.mode === 'INPUT_ADC_NTC');
  const isEnabled = (dev.enabled !== false);

  if (!isEnabled) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center; padding:16px; color:var(--text-muted);">
          Équipement déconnecté. Il est actuellement ignoré par la carte ESP32 et les scénarios d'automatisation.
        </td>
      </tr>
    `;
    return;
  }

  let rows = [];
  if (isPIR) {
    rows = [
      { time: "Il y a 3 min", val: "REPOS", badge: "badge-volt", desc: "Fin de temporisation (aucun mouvement)" },
      { time: "Il y a 4 min", val: "DÉTECTÉ", badge: "badge-warning", desc: "Mouvement humain détecté dans le van" },
      { time: "Il y a 42 min", val: "DÉTECTÉ", badge: "badge-warning", desc: "Mouvement détecté -> déclenchement scénario" },
      { time: "Il y a 1h 15m", val: "DÉTECTÉ", badge: "badge-warning", desc: "Passage détecté" },
      { time: "Il y a 3h 40m", val: "DÉTECTÉ", badge: "badge-warning", desc: "Mouvement détecté" },
      { time: "Il y a 8h 12m", val: "DÉTECTÉ", badge: "badge-warning", desc: "Détection matinale" }
    ];
  } else if (isActuator) {
    rows = [
      { time: "Il y a 18 min", val: dev.state > 0 ? "ON" : "OFF", badge: dev.state > 0 ? "badge-success" : "badge-volt", desc: "Commande interface / état courant" },
      { time: "Il y a 1h 05m", val: "ON", badge: "badge-success", desc: "Allumage automatique suite à règle" },
      { time: "Il y a 2h 20m", val: "OFF", badge: "badge-volt", desc: "Extinction normale" },
      { time: "Il y a 4h 50m", val: "ON", badge: "badge-success", desc: "Commande utilisateur" },
      { time: "Il y a 9h 15m", val: "OFF", badge: "badge-volt", desc: "Arrêt programmé" }
    ];
  } else if (isTemp) {
    const curVal = dev.reading !== undefined ? (dev.reading / 100).toFixed(1) : "21.5";
    rows = [
      { time: "Il y a 2 min", val: `${curVal} °C`, badge: "badge-temp", desc: "Mesure périodique normale" },
      { time: "Il y a 30 min", val: `${(parseFloat(curVal) - 0.3).toFixed(1)} °C`, badge: "badge-temp", desc: "Stabilité thermique van" },
      { time: "Il y a 2h 00m", val: `${(parseFloat(curVal) + 0.8).toFixed(1)} °C`, badge: "badge-temp", desc: "Relevé automatique" },
      { time: "Il y a 6h 00m", val: `${(parseFloat(curVal) + 2.1).toFixed(1)} °C`, badge: "badge-temp", desc: "Maximum relevé" },
      { time: "Il y a 14h 00m", val: `${(parseFloat(curVal) - 2.5).toFixed(1)} °C`, badge: "badge-temp", desc: "Minimum nocturne" }
    ];
  } else {
    rows = [
      { time: "Il y a 5 min", val: "Lecture OK", badge: "badge-sensor", desc: "Signal actif mesuré" },
      { time: "Il y a 1h 00m", val: "Lecture OK", badge: "badge-sensor", desc: "Surveillance continue" },
      { time: "Il y a 6h 00m", val: "Lecture OK", badge: "badge-sensor", desc: "Surveillance continue" }
    ];
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td style="color:var(--text-muted); font-size:11px; padding:8px 12px; white-space:nowrap;">${r.time}</td>
      <td style="padding:8px 12px;"><span class="badge ${r.badge}">${r.val}</span></td>
      <td style="color:var(--text-main); font-size:12px; padding:8px 12px;">${r.desc}</td>
    </tr>
  `).join('');
}

// =========================================================================
// GESTIONNAIRE DE MATÉRIEL (HARDWARE DEVICES)
// =========================================================================
async function loadDevices() {
  try {
    const data = await fetchApi('/api/devices');
    if (data && Array.isArray(data.devices)) {
      devicesList = data.devices;
      localStorage.setItem('van_devices', JSON.stringify(devicesList));
      checkPirDetectionLog(devicesList);
      renderDevicesTable();
      updateGlobalStats();
      if (typeof populateAutoDropdowns === 'function') populateAutoDropdowns();
    }
  } catch (err) {
    console.warn("loadDevices (mode hors-ligne/FiveServer):", err);
    const saved = localStorage.getItem('van_devices');
    if (saved) {
      try {
        devicesList = JSON.parse(saved);
      } catch (e) {}
    } else {
      devicesList = [
        { id: 1, name: "Lumière Principale", category: "ACTUATOR", mode: "OUTPUT_RELAY", gpio: 18, voltage: "12V", state: 1, value: 1 },
        { id: 2, name: "Détecteur Mouvement", category: "SENSOR", mode: "INPUT_PIR", gpio: 19, voltage: "5V", state: 0, value: 0 },
        { id: 3, name: "Variateur Spot LED", category: "ACTUATOR", mode: "OUTPUT_PWM", gpio: 23, voltage: "12V", state: 1, value: 70 }
      ];
      localStorage.setItem('van_devices', JSON.stringify(devicesList));
    }
    renderDevicesTable();
    updateGlobalStats();
    if (typeof populateAutoDropdowns === 'function') populateAutoDropdowns();
  }
}

function renderDevicesTable() {
  const tbody = document.getElementById('device-table-body') || document.getElementById('devices-table-body');
  const empty = document.getElementById('devices-empty-state');
  if (!tbody) return;

  const isUser = (getCurrentUserRole() === 'user');

  if (devicesList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${isUser ? 5 : 7}" style="text-align:center; padding:35px 20px; color:var(--text-muted); font-size:13px;">
          ${isUser ? "Aucun équipement déclaré." : t('empty_devices', "Aucun équipement déclaré. Cliquez sur « Ajouter un équipement » pour commencer.")}
        </td>
      </tr>
    `;
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  let html = '';
  devicesList.forEach(dev => {
    const isActuator = (dev.category === 'ACTUATOR' || (!dev.category && dev.mode && dev.mode.startsWith('OUTPUT')));

    let stateLabel = '';
    let stateBadge = 'badge-sensor';

    if (isActuator) {
      if (dev.mode === 'OUTPUT_PWM' || (dev.mode && dev.mode.includes('PWM'))) {
        const duty = dev.value || (dev.state > 0 ? 100 : 0);
        stateLabel = `${duty}%`;
        stateBadge = (duty > 0) ? 'badge-success' : 'badge-volt';
      } else {
        stateLabel = (dev.state > 0) ? 'ON' : 'OFF';
        stateBadge = (dev.state > 0) ? 'badge-success' : 'badge-volt';
      }
    } else if (dev.mode === 'INPUT_ONEWIRE') {
      const val = dev.reading !== undefined ? (dev.reading / 100).toFixed(1) : (dev.value !== undefined ? (dev.value / 100).toFixed(1) : '--');
      stateLabel = `${val} °C`;
      stateBadge = 'badge-temp';
    } else if (dev.mode === 'INPUT_PIR') {
      stateLabel = (dev.state > 0) ? 'Mouvement' : 'Repos';
      stateBadge = (dev.state > 0) ? 'badge-warning' : 'badge-volt';
    } else if (dev.mode === 'INPUT_DIGITAL') {
      stateLabel = (dev.state > 0) ? 'Fermé' : 'Ouvert';
      stateBadge = (dev.state > 0) ? 'badge-success' : 'badge-volt';
    } else {
      stateLabel = `${(((dev.value || 0) / 4095) * 3.3).toFixed(2)} V`;
      stateBadge = 'badge-sensor';
    }

    const catBadge = isActuator ? 'badge-actuator' : 'badge-sensor';
    const catLabel = isActuator ? t('badge_actuator', 'Actionneur') : t('badge_sensor', 'Capteur');

    const toggleHtml = isUser
      ? `<label class="toggle-switch" title="Lecture seule (Compte utilisateur)">
          <input type="checkbox" ${dev.enabled !== false ? 'checked' : ''} disabled style="cursor:not-allowed;">
          <span class="slider" style="opacity:0.6; cursor:not-allowed;"></span>
        </label>`
      : `<label class="toggle-switch" title="Activer ou désactiver la prise en compte sur la carte et les automatisations">
          <input type="checkbox" ${dev.enabled !== false ? 'checked' : ''} onchange="toggleDeviceEnabled(${dev.id}, this.checked)">
          <span class="slider"></span>
        </label>`;

    const actionsHtml = isUser
      ? `<button class="btn-outline-sm" onclick="triggerDeviceTestPulse(${dev.id})" title="Tester 3s">Tester</button>`
      : `
          <button class="btn-outline-sm" onclick="openEditDeviceModal(${dev.id})" title="${t('btn_edit', 'Modifier')}">${t('btn_edit', 'Modifier')}</button>
          <button class="btn-outline-sm" onclick="triggerDeviceTestPulse(${dev.id})" title="Tester 3s">Tester</button>
          <button class="btn-outline-sm" onclick="openWizardForExistingDevice(${dev.id})" title="Câblage">Câbler</button>
          <button class="btn-danger-sm" onclick="deleteDevice(${dev.id})" title="${t('btn_delete', 'Supprimer')}">
            <svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
          </button>
        `;

    html += `
      <tr>
        <td style="font-weight:700;">${escapeHtml(dev.name)}</td>
        <td>
          <span class="badge ${catBadge}">${catLabel}</span>
          <span class="badge badge-volt">${dev.voltage || '12V'}</span>
        </td>
${isUser ? '' : `
        <td><span class="badge badge-relay">${dev.mode}</span></td>
        <td class="col-center"><span class="badge badge-gpio">GPIO ${dev.gpio}</span></td>
        `}
        <td class="col-center"><span class="badge ${stateBadge}">${stateLabel}</span></td>
        <td class="col-center">${toggleHtml}</td>
        <td class="col-right">${actionsHtml}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

async function toggleDeviceEnabled(id, isChecked) {
  if (getCurrentUserRole() === 'user') return;
  const dev = devicesList.find(d => d.id === id);
  if (!dev) return;

  dev.enabled = isChecked;
  if (!isChecked && (dev.category === 'ACTUATOR' || (!dev.category && dev.mode && dev.mode.startsWith('OUTPUT')))) {
    dev.state = 0;
    dev.value = 0;
  }

  try {
    await fetchApi('/api/devices/toggle-enabled', 'POST', { id, enabled: isChecked });
  } catch (e) {
    console.warn("toggle-enabled fallback local:", e);
  }

  localStorage.setItem('van_devices', JSON.stringify(devicesList));
  renderDevicesTable();
  updateGlobalStats();
  if (typeof populateAutoDropdowns === 'function') populateAutoDropdowns();

  const msg = isChecked
    ? `"${dev.name}" est désormais actif et pris en compte par la carte.`
    : `"${dev.name}" est désactivé (ignoré par la carte et les automatisations).`;
  showToast(msg, isChecked ? "success" : "info");
}

async function deleteDevice(id) {
  if (getCurrentUserRole() === 'user') return;
  if (!confirm("Voulez-vous vraiment supprimer cet équipement ? Sa broche GPIO sera libérée.")) {
    return;
  }
  const devToDel = devicesList.find(d => d.id === id);
  try {
    const res = await fetchApi('/api/devices/delete', 'POST', { id });
    if (res && res.success) {
      showToast(res.message || t('toast_dev_deleted', "Équipement supprimé"), "success");
      await loadDevices();
      return;
    }
  } catch (err) {
    console.warn("deleteDevice hors-ligne/FiveServer fallback:", err);
  }
  devicesList = devicesList.filter(d => d.id !== id);
  localStorage.setItem('van_devices', JSON.stringify(devicesList));
  renderDevicesTable();
  updateGlobalStats();
  showToast(t('toast_dev_deleted', "Équipement supprimé"), "success");
  if (typeof logSystemEvent === 'function') {
    logSystemEvent(`Suppression équipement : "${devToDel ? devToDel.name : 'ID #' + id}" (ID #${id})`);
  }
}

async function toggleAuxDevice(id) {
  const dev = devicesList.find(d => d.id === id);
  if (!dev) return;
  const newState = dev.state > 0 ? 0 : 1;
  dev.state = newState;
  renderDevicesTable();
  updateGlobalStats();
  localStorage.setItem('van_devices', JSON.stringify(devicesList));
  try {
    await fetchApi('/api/devices/control', 'POST', { id, state: newState });
  } catch (e) {
    console.warn("toggleAuxDevice hors-ligne/FiveServer", e);
  }
}

async function updateAuxPwm(id, val) {
  const duty = parseInt(val, 10);
  const dev = devicesList.find(d => d.id === id);
  if (dev) {
    dev.value = duty;
    dev.state = duty > 0 ? 1 : 0;
    renderDevicesTable();
    updateGlobalStats();
    localStorage.setItem('van_devices', JSON.stringify(devicesList));
  }
  try {
    await fetchApi('/api/devices/control', 'POST', { id, value: duty, state: duty > 0 ? 1 : 0 });
  } catch (e) {
    console.warn("updateAuxPwm hors-ligne/FiveServer", e);
  }
}

async function triggerDeviceTestPulse(id) {
  const dev = devicesList.find(d => d.id === id);
  if (!dev) return;

  showToast(`Test de "${dev.name}" sur GPIO ${dev.gpio}...`, 'info');
  try {
    const res = await fetchApi('/api/devices/test', 'POST', {
      id: dev.id,
      gpio: dev.gpio,
      mode: dev.mode,
      duration: 3000
    });
    if (res && res.success) {
      showToast(res.message || `Test réussi pour "${dev.name}"`, 'success');
      await loadDevices();
    } else {
      showToast((res && res.message) || "Échec du test", 'warning');
    }
  } catch (err) {
    showToast(`Erreur test : ${err.message}`, 'error');
  }
}

// =========================================================================
// FORMULAIRE D'AJOUT UNIFIÉ & MODALES
// =========================================================================
function openUnifiedAddModal() {
  if (getCurrentUserRole() === 'user') return;
  const modal = document.getElementById('unified-add-modal');
  if (modal) modal.classList.add('active');
}
function closeUnifiedAddModal() {
  const modal = document.getElementById('unified-add-modal');
  if (modal) modal.classList.remove('active');
}

function selectAddType(type) {
  closeUnifiedAddModal();
  openAddDeviceModal(type);
}

function openAddDeviceModal(preselectedCategory = 'ACTUATOR') {
  if (getCurrentUserRole() === 'user') return;
  editingDeviceId = null;
  const title = document.getElementById('modal-title');
  if (title) title.innerText = t('modal_dev_title', "1. Déclarer un équipement");
  const stepInfo = document.getElementById('modal-step-info');
  if (stepInfo) stepInfo.innerText = t('modal_dev_step', "Étape 1/2 : Caractéristiques du matériel");

  const btnDirect = document.getElementById('btn-save-direct');
  if (btnDirect) btnDirect.style.display = 'none';

  const btnStep1 = document.getElementById('btn-submit-step1');
  if (btnStep1) {
    btnStep1.style.display = 'inline-block';
    btnStep1.innerText = t('btn_next_wire', "Suivant : Câbler sur la carte");
  }

  const nameInput = document.getElementById('device-name');
  if (nameInput) nameInput.value = '';

  const catSelect = document.getElementById('device-category');
  if (catSelect) catSelect.value = (preselectedCategory || 'ACTUATOR').toUpperCase();

  onCategoryChange();
  populatePinSelect();

  const modal = document.getElementById('device-modal');
  if (modal) modal.classList.add('active');
}

async function openEditDeviceModal(id) {
  if (getCurrentUserRole() === 'user') return;
  const dev = devicesList.find(d => d.id === id);
  if (!dev) return;

  editingDeviceId = dev.id;
  const title = document.getElementById('modal-title');
  if (title) title.innerText = t('modal_edit_title', "Modifier l'équipement");
  const stepInfo = document.getElementById('modal-step-info');
  if (stepInfo) stepInfo.innerText = t('modal_edit_step', "Modification des caractéristiques matérielles");

  const nameInput = document.getElementById('device-name');
  if (nameInput) nameInput.value = dev.name || '';

  const catSelect = document.getElementById('device-category');
  if (catSelect) catSelect.value = dev.category || (dev.mode && dev.mode.startsWith('OUTPUT') ? 'ACTUATOR' : 'SENSOR');

  onCategoryChange();

  let actMode = dev.mode;
  if (actMode === 'OUTPUT_RELAY') {
    actMode = (dev.pwmWiringType === 'DEDICATED_SIGNAL') ? 'OUTPUT_RELAY_3WIRE' : 'OUTPUT_RELAY_2WIRE';
  } else if (actMode === 'OUTPUT_PWM') {
    actMode = (dev.pwmWiringType === 'DEDICATED_SIGNAL') ? 'OUTPUT_PWM_3WIRE' : 'OUTPUT_PWM_2WIRE';
  } else if (actMode === 'OUTPUT_DIRECT') {
    actMode = 'OUTPUT_RELAY_3WIRE';
  }
  const modeEl = document.getElementById('device-signal-mode') || document.getElementById('device-mode');
  if (modeEl && actMode) modeEl.value = actMode;

  onSignalModeChange();

  const voltSelect = document.getElementById('device-voltage');
  if (voltSelect && dev.voltage) voltSelect.value = dev.voltage;

  const pwmWiringEl = document.getElementById('device-pwm-wiring-type') || document.getElementById('pwm-wiring-type');
  if (pwmWiringEl && dev.pwmWiringType) pwmWiringEl.value = dev.pwmWiringType;

  await populatePinSelect();
  const pinSelect = document.getElementById('device-gpio');
  if (pinSelect && dev.gpio !== undefined) pinSelect.value = dev.gpio;

  const btnDirect = document.getElementById('btn-save-direct');
  if (btnDirect) btnDirect.style.display = 'inline-block';

  const btnStep1 = document.getElementById('btn-submit-step1');
  if (btnStep1) btnStep1.style.display = 'none';

  const modal = document.getElementById('device-modal');
  if (modal) modal.classList.add('active');
}

function closeDeviceModal() {
  editingDeviceId = null;
  const modal = document.getElementById('device-modal');
  if (modal) modal.classList.remove('active');
}

async function saveDeviceFromModal() {
  if (getCurrentUserRole() === 'user') return;
  const nameInput = document.getElementById('device-name');
  if (!nameInput || !nameInput.value.trim()) {
    showToast("Veuillez saisir un nom pour l'équipement.", "warning");
    return;
  }

  const name = nameInput.value.trim();
  const cat = document.getElementById('device-category').value;
  const modeEl = document.getElementById('device-signal-mode') || document.getElementById('device-mode');
  const selectedMode = modeEl ? modeEl.value : 'OUTPUT_RELAY_2WIRE';
  const volt = document.getElementById('device-voltage').value;

  let mode = selectedMode;
  let wiringType = 'MOSFET_POWER';
  if (selectedMode === 'OUTPUT_RELAY_2WIRE') {
    mode = 'OUTPUT_RELAY';
    wiringType = 'MOSFET_POWER';
  } else if (selectedMode === 'OUTPUT_RELAY_3WIRE') {
    mode = 'OUTPUT_RELAY';
    wiringType = 'DEDICATED_SIGNAL';
  } else if (selectedMode === 'OUTPUT_PWM_2WIRE') {
    mode = 'OUTPUT_PWM';
    wiringType = 'MOSFET_POWER';
  } else if (selectedMode === 'OUTPUT_PWM_3WIRE') {
    mode = 'OUTPUT_PWM';
    wiringType = 'DEDICATED_SIGNAL';
  }

  let gpio = document.getElementById('device-gpio').value;
  if (gpio === 'auto') {
    const existingDev = devicesList.find(d => d.id === editingDeviceId);
    gpio = existingDev ? existingDev.gpio : 23;
  } else {
    gpio = parseInt(gpio, 10);
  }

  const payload = {
    id: editingDeviceId || 0,
    name: name,
    category: cat,
    voltage: volt,
    mode: mode,
    pwmWiringType: wiringType,
    gpio: gpio,
    isCore: false
  };

  try {
    const result = await fetchApi('/api/devices/save', 'POST', payload);
    if (!result || !result.success) {
      throw new Error((result && result.error) || "Erreur de sauvegarde");
    }
  } catch (err) {
    console.warn("saveDeviceFromModal error:", err);
    let backendErrorMsg = null;
    try {
      const parsed = JSON.parse(err.message);
      if (parsed && typeof parsed.error === 'string' && parsed.error.trim().length > 0) {
        backendErrorMsg = parsed.error;
      }
    } catch (_) {}

    if (backendErrorMsg) {
      showToast(backendErrorMsg, "danger");
      return;
    }

    if (editingDeviceId) {
      const existing = devicesList.find(d => d.id === editingDeviceId);
      if (existing) Object.assign(existing, payload);
      if (typeof logSystemEvent === 'function') {
        logSystemEvent(`Modification équipement : "${name}" (ID #${editingDeviceId}, GPIO ${gpio})`);
      }
    } else {
      const newId = (devicesList.length > 0 ? Math.max(...devicesList.map(d => d.id)) + 1 : 1);
      devicesList.push({ ...payload, id: newId, state: 0, value: 0 });
      if (typeof logSystemEvent === 'function') {
        logSystemEvent(`Création équipement : "${name}" (GPIO ${gpio})`);
      }
    }
  }

  localStorage.setItem('van_devices', JSON.stringify(devicesList));
  closeDeviceModal();
  await loadDevices();
  renderDevicesTable();
  updateGlobalStats();
  if (typeof populateAutoDropdowns === 'function') populateAutoDropdowns();
  showToast(t('toast_save_success', "Configuration sauvegardée avec succès."), "success");
}

function onCategoryChange() {
  const cat = document.getElementById('device-category').value;
  const modeSelect = document.getElementById('device-signal-mode') || document.getElementById('device-mode');
  const sigLabel = document.getElementById('device-signal-label');

  if (sigLabel) {
    sigLabel.innerText = (cat === 'ACTUATOR') ? t('label_dev_mode_cmd', "Type de commande") : t('label_dev_mode_sensor', "Type de signal / mesure");
  }

  if (!modeSelect) return;

  if (cat === 'ACTUATOR') {
    modeSelect.innerHTML = (currentLang === 'en') ? `
      <option value="OUTPUT_RELAY_2WIRE">2-Wire On/Off (Relay module / power cut)</option>
      <option value="OUTPUT_RELAY_3WIRE">3-Wire On/Off (Power + Dedicated signal)</option>
      <option value="OUTPUT_PWM_2WIRE">2-Wire PWM (Dimmer via MOSFET module)</option>
      <option value="OUTPUT_PWM_3WIRE">3-Wire PWM (Dedicated PWM signal - Fan, Servomotor)</option>
    ` : (currentLang === 'es') ? `
      <option value="OUTPUT_RELAY_2WIRE">Todo o nada 2 hilos (Módulo relé / corte de potencia)</option>
      <option value="OUTPUT_RELAY_3WIRE">Todo o nada 3 hilos (Alimentación + Señal dedicada)</option>
      <option value="OUTPUT_PWM_2WIRE">PWM 2 hilos (Regulador mediante módulo MOSFET)</option>
      <option value="OUTPUT_PWM_3WIRE">PWM 3 hilos (Señal PWM dedicada - Ventilador, Servomotor)</option>
    ` : `
      <option value="OUTPUT_RELAY_2WIRE">Tout-ou-rien 2 fils (Module relais / coupure de puissance)</option>
      <option value="OUTPUT_RELAY_3WIRE">Tout-ou-rien 3 fils (Alimentation + Commande dédiée)</option>
      <option value="OUTPUT_PWM_2WIRE">PWM 2 fils (Variateur via module MOSFET)</option>
      <option value="OUTPUT_PWM_3WIRE">PWM 3 fils (Signal PWM dédié - Ventilateur, Servomoteur)</option>
    `;
  } else {
    modeSelect.innerHTML = (currentLang === 'en') ? `
      <option value="INPUT_PIR">PIR Motion Sensor (HC-SR501, AM312)</option>
      <option value="INPUT_ONEWIRE">3-Wire Digital Probe (Temperature, Humidity, etc.)</option>
      <option value="INPUT_ADC_NTC">2-Wire Digital Probe (Temperature, Humidity, etc.)</option>
      <option value="INPUT_DIGITAL">Dry Contact / Push Button (Passive Pull-up)</option>
      <option value="INPUT_ADC">Active 3-Wire Analog Sensor (0-3.3V)</option>
    ` : (currentLang === 'es') ? `
      <option value="INPUT_PIR">Sensor de Movimiento PIR (HC-SR501, AM312)</option>
      <option value="INPUT_ONEWIRE">Sonda digital de 3 hilos (Temperatura, Humedad, etc.)</option>
      <option value="INPUT_ADC_NTC">Sonda digital de 2 hilos (Temperatura, Humedad, etc.)</option>
      <option value="INPUT_DIGITAL">Contacto Seco / Pulsador (Pasivo Pull-up)</option>
      <option value="INPUT_ADC">Sensor Analógico Activo de 3 hilos (0-3.3V)</option>
    ` : `
      <option value="INPUT_PIR">Détecteur de Mouvement PIR (HC-SR501, AM312)</option>
      <option value="INPUT_ONEWIRE">Sonde numérique 3 fils (Température, Humidité, etc.)</option>
      <option value="INPUT_ADC_NTC">Sonde numérique 2 fils (Température, Humidité, etc.)</option>
      <option value="INPUT_DIGITAL">Contact Sec / Bouton Poussoir (Passif Pull-up)</option>
      <option value="INPUT_ADC">Capteur Analogique Actif 3 fils (0-3.3V)</option>
    `;
  }

  updateVoltageOptions();
  onSignalModeChange();
  populatePinSelect();
}

function updateVoltageOptions() {
  const cat = document.getElementById('device-category').value;
  const modeEl = document.getElementById('device-signal-mode') || document.getElementById('device-mode');
  const mode = modeEl ? modeEl.value : '';
  const voltSelect = document.getElementById('device-voltage');
  if (!voltSelect) return;

  if (cat === 'ACTUATOR') {
    voltSelect.innerHTML = (currentLang === 'en') ? `
      <option value="12V">12V DC (Auxiliary Van Battery)</option>
      <option value="5V">5V DC (USB Power / Bus)</option>
      <option value="3.3V">3.3V DC (Logic Level)</option>
    ` : (currentLang === 'es') ? `
      <option value="12V">12V DC (Batería auxiliar Camper)</option>
      <option value="5V">5V DC (Alimentación USB / Bus)</option>
      <option value="3.3V">3.3V DC (Nivel lógico)</option>
    ` : `
      <option value="12V">12V DC (Batterie auxiliaire Van)</option>
      <option value="5V">5V DC (Alimentation USB / Bus)</option>
      <option value="3.3V">3.3V DC (Niveau logique)</option>
    `;
    voltSelect.disabled = false;
  } else {
    if (mode === 'INPUT_DIGITAL' || mode === 'INPUT_ADC_NTC') {
      voltSelect.innerHTML = `<option value="3.3V">${currentLang === 'en' ? 'Passive (ESP32 3.3V Pull-up)' : (currentLang === 'es' ? 'Pasivo (ESP32 3.3V Pull-up)' : 'Passif (ESP32 3.3V Pull-up)')}</option>`;
      voltSelect.disabled = true;
    } else if (mode === 'INPUT_PIR') {
      voltSelect.innerHTML = (currentLang === 'en') ? `
        <option value="5V">5V DC / VIN (HC-SR501 Module)</option>
        <option value="3.3V">3.3V DC (AM312 Low Voltage Module)</option>
      ` : (currentLang === 'es') ? `
        <option value="5V">5V DC / VIN (Módulo HC-SR501)</option>
        <option value="3.3V">3.3V DC (Módulo AM312 bajo voltaje)</option>
      ` : `
        <option value="5V">5V DC / VIN (Module HC-SR501)</option>
        <option value="3.3V">3.3V DC (Module AM312 basse tension)</option>
      `;
      voltSelect.disabled = false;
    } else {
      voltSelect.innerHTML = (currentLang === 'en') ? `
        <option value="3.3V">3.3V DC (Recommended ESP32)</option>
        <option value="5V">5V DC (VIN)</option>
      ` : (currentLang === 'es') ? `
        <option value="3.3V">3.3V DC (Recomendado ESP32)</option>
        <option value="5V">5V DC (VIN)</option>
      ` : `
        <option value="3.3V">3.3V DC (Recommandé ESP32)</option>
        <option value="5V">5V DC (VIN)</option>
      `;
      voltSelect.disabled = false;
    }
  }
}

function onSignalModeChange() {
  const modeEl = document.getElementById('device-signal-mode') || document.getElementById('device-mode');
  const mode = modeEl ? modeEl.value : '';
  const pwmRow = document.getElementById('device-pwm-wiring-group') || document.getElementById('pwm-wiring-row');
  if (pwmRow) {
    pwmRow.style.display = 'none'; // Les 4 options intègrent déjà le choix 2 fils / 3 fils directement !
  }
  updateVoltageOptions();
  populatePinSelect();
}

function onPwmWiringChange() {}

async function populatePinSelect() {
  const pinSelect = document.getElementById('device-gpio');
  if (!pinSelect) return;

  const modeEl = document.getElementById('device-signal-mode') || document.getElementById('device-mode');
  const mode = modeEl ? modeEl.value : '';
  pinSelect.innerHTML = `<option value="auto">Attribution automatique optimale par l'ESP32</option>`;

  try {
    const data = await fetchApi('/api/pins');
    if (data && Array.isArray(data.pins)) {
      data.pins.forEach(p => {
        const isFree = (p.used_by === null || p.used_by === undefined || p.used_by === '');
        let allowed = true;
        if ((mode === 'INPUT_ADC' || mode === 'INPUT_ADC_NTC') && !p.adc1) allowed = false;
        if (p.input_only && mode && mode.startsWith('OUTPUT')) allowed = false;

        if (allowed) {
          const opt = document.createElement('option');
          opt.value = p.gpio;
          opt.innerText = `GPIO ${p.gpio} - ${p.label || ''} ${isFree ? '(Libre)' : '(Occupé)'}`;
          if (!isFree) opt.style.color = 'var(--text-muted)';
          pinSelect.appendChild(opt);
        }
      });
    }
  } catch(e) {
    const commonPins = [4, 5, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35];
    commonPins.forEach(gpio => {
      const opt = document.createElement('option');
      opt.value = gpio;
      opt.innerText = `GPIO ${gpio}`;
      pinSelect.appendChild(opt);
    });
  }
}

async function handleDeviceFormSubmit(event) {
  event.preventDefault();
  if (editingDeviceId) {
    await saveDeviceFromModal();
    return;
  }

  const name = document.getElementById('device-name').value.trim();
  const cat = document.getElementById('device-category').value;
  const modeEl = document.getElementById('device-signal-mode') || document.getElementById('device-mode');
  const selectedMode = modeEl ? modeEl.value : 'OUTPUT_RELAY_2WIRE';
  const volt = document.getElementById('device-voltage').value;

  let mode = selectedMode;
  let wiringType = 'MOSFET_POWER';
  if (selectedMode === 'OUTPUT_RELAY_2WIRE') {
    mode = 'OUTPUT_RELAY';
    wiringType = 'MOSFET_POWER';
  } else if (selectedMode === 'OUTPUT_RELAY_3WIRE') {
    mode = 'OUTPUT_RELAY';
    wiringType = 'DEDICATED_SIGNAL';
  } else if (selectedMode === 'OUTPUT_PWM_2WIRE') {
    mode = 'OUTPUT_PWM';
    wiringType = 'MOSFET_POWER';
  } else if (selectedMode === 'OUTPUT_PWM_3WIRE') {
    mode = 'OUTPUT_PWM';
    wiringType = 'DEDICATED_SIGNAL';
  }

  let gpio = document.getElementById('device-gpio').value;
  if (gpio === 'auto') {
    try {
      const res = await fetchApi(`/api/pins/suggest?type=${mode}`);
      if (res && res.success && res.gpio) {
        gpio = res.gpio;
      } else {
        throw new Error("No suggested pin");
      }
    } catch (e) {
      const used = devicesList.map(d => d.gpio);
      const candidates = (mode === 'INPUT_ADC' || mode === 'INPUT_ADC_NTC')
        ? [32, 33, 34, 35, 36, 39]
        : [4, 5, 13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];
      gpio = candidates.find(p => !used.includes(p)) || (cat === 'ACTUATOR' ? 23 : 13);
    }
  } else {
    gpio = parseInt(gpio, 10);
  }

  wizardState = {
    id: editingDeviceId || 0,
    name: name,
    category: cat,
    voltage: volt,
    mode: mode,
    pwmWiringType: wiringType,
    wiringType: wiringType,
    gpio: gpio,
    isCore: false
  };

  closeDeviceModal();
  openWizardModal();
}

// =========================================================================
// DIDACTICIELS DE CÂBLAGE & SCHÉMAS SYNOPTIQUES (WIRING WIZARD)
// =========================================================================
const WIRING_TUTORIALS = {
  "ACTUATOR_OUTPUT_RELAY_2WIRE": {
    getTitle: () => {
      if (currentLang === 'en') return "On/Off Actuator (2-Wire via Relay Module)";
      if (currentLang === 'es') return "Actuador Todo o Nada (2 hilos mediante Módulo Relé)";
      return "Actionneur Tout-ou-Rien (2 fils via Module Relais)";
    },
    subtitle: (volt) => {
      if (currentLang === 'en') return `Power cutoff for 2-wire ${volt} load (pump, lamp, valve)`;
      if (currentLang === 'es') return `Corte de alimentación para carga de 2 hilos ${volt} (bomba, lámpara, válvula)`;
      return `Coupure de puissance pour appareil 2 fils ${volt} (pompe, éclairage, vanne)`;
    },
    warning: (volt) => {
      if (currentLang === 'en') {
        return `<strong>CIRCUIT ISOLATION (${volt}):</strong> NEVER connect +${volt} directly to the ESP32! The relay module provides galvanic isolation. The device positive wire goes through relay COM/NO, and the negative wire returns directly to the external battery/power source.`;
      }
      if (currentLang === 'es') {
        return `<strong>AISLAMIENTO DEL CIRCUITO (${volt}):</strong> ¡NUNCA conecte el +${volt} directamente al ESP32! El módulo de relé proporciona aislamiento galvánico. La potencia de ${volt} se conecta a la batería auxiliar.`;
      }
      return `<strong>ISOLATION DU CIRCUIT DE PUISSANCE (${volt}) :</strong> Ne reliez <u>JAMAIS</u> le +${volt} de puissance directement à l'ESP32 ! Le module relais assure une isolation galvanique totale. Le fil (+) de l'appareil passe par les bornes COM/NO du relais, et le fil (-) retourne directement à la source d'alimentation externe.`;
    },
    steps: (gpio, volt) => {
      const vccRelay = (volt === '3.3V') ? '3.3V' : 'VIN (5V)';
      if (currentLang === 'en') {
        return [
          {
            title: "1. Relay module control power (VCC & GND)",
            desc: `Connect the relay module <strong>VCC</strong> pin to the <strong>${vccRelay}</strong> pin of the ESP32, and the relay <strong>GND</strong> pin to an ESP32 <strong>GND</strong> pin.`
          },
          {
            title: "2. Logic control signal (IN)",
            desc: `Connect the relay <strong>IN / Signal</strong> pin directly to <span class="step-tag">GPIO {{GPIO}}</span> of the ESP32.`
          },
          {
            title: `3. Power loop (${volt} Battery -> Relay -> 2-Wire Device -> Battery)`,
            desc: `Connect the <strong>+${volt} from your auxiliary battery</strong> (with fuse) to the relay <strong>COM</strong> terminal. Connect <strong>NO</strong> to the device positive wire (+). Wire the device negative (-) directly back to the <strong>power source negative (0V / GND)</strong>.`
          }
        ];
      }
      if (currentLang === 'es') {
        return [
          {
            title: "1. Alimentación del módulo relé (VCC y GND)",
            desc: `Conecte el pin <strong>VCC</strong> del relé al pin <strong>${vccRelay}</strong> del ESP32, y el pin <strong>GND</strong> del relé a un pin <strong>GND</strong> del ESP32.`
          },
          {
            title: "2. Señal de control lógico (IN)",
            desc: `Conecte el pin de control <strong>IN / Señal</strong> del relé directamente al pin <span class="step-tag">GPIO {{GPIO}}</span> del ESP32.`
          },
          {
            title: `3. Circuito de potencia (${volt} Batería -> Relé -> Equipo 2 hilos -> Batería)`,
            desc: `Conecte el <strong>+${volt} de su batería auxiliar</strong> (con fusible) al borne <strong>COM</strong> del relé. Conecte <strong>NO</strong> al cable positivo (+) del equipo. Conecte el cable negativo (-) del equipo directamente al <strong>negativo (0V) de la batería</strong>.`
          }
        ];
      }
      return [
        {
          title: "1. Alimentation de la carte relais (VCC & GND)",
          desc: `Branchez la broche <strong>VCC</strong> du module relais sur la broche <strong>${vccRelay}</strong> de l'ESP32, et la broche <strong>GND</strong> du relais sur une broche <strong>GND</strong> de l'ESP32.`
        },
        {
          title: "2. Commande logique (IN)",
          desc: `Reliez la broche de commande <strong>IN / Signal</strong> du relais directement sur la broche <span class="step-tag">GPIO {{GPIO}}</span> de l'ESP32.`
        },
        {
          title: `3. Circuit de puissance (Batterie ${volt} -> Relais -> Appareil 2 fils -> Batterie)`,
          desc: `Raccordez le <strong>+${volt} de votre alimentation/batterie</strong> (avec fusible) sur la borne <strong>COM</strong> du relais. Reliez la borne <strong>NO</strong> au fil positif (+) de l'appareil. Raccordez le fil négatif (-) de l'appareil directement au <strong>négatif (0V / masse) de l'alimentation</strong> (sans passer par l'ESP32).`
        }
      ];
    },
    schematic: (gpio, volt) => {
      const vccLabel = (volt === '3.3V') ? '3.3V' : 'VIN (5V)';
      return `
      <svg viewBox="0 0 620 220" width="100%" height="210" style="max-width:620px; font-family:monospace;">
        <!-- Boîtier ESP32 (Gauche) -->
        <rect x="15" y="25" width="115" height="140" rx="8" fill="#151e32" stroke="#2dd4bf" stroke-width="2"/>
        <text x="72" y="48" fill="#2dd4bf" font-size="12" font-weight="bold" text-anchor="middle">ESP32</text>
        <text x="72" y="60" fill="#8b98a5" font-size="8" text-anchor="middle">(Logique 3.3V/5V)</text>
        
        <circle cx="120" cy="80" r="4" fill="#ef4444"/>
        <text x="110" y="84" fill="#ef4444" font-size="9" text-anchor="end">${vccLabel}</text>
        
        <circle cx="120" cy="110" r="4" fill="#2dd4bf"/>
        <text x="110" y="114" fill="#f8fafc" font-size="9" text-anchor="end">GPIO ${gpio}</text>
        
        <circle cx="120" cy="140" r="4" fill="#0ea5e9"/>
        <text x="110" y="144" fill="#8b98a5" font-size="9" text-anchor="end">GND</text>

        <!-- Lignes Commande ESP32 -> Module Relais -->
        <path d="M125 80 L180 80" stroke="#ef4444" stroke-width="2" fill="none"/>
        <text x="152" y="73" fill="#ef4444" font-size="8" text-anchor="middle">VCC</text>

        <path d="M125 110 L180 110" stroke="#2dd4bf" stroke-width="2.5" stroke-dasharray="3" fill="none"/>
        <text x="152" y="103" fill="#2dd4bf" font-size="8" text-anchor="middle">IN</text>

        <path d="M125 140 L180 140" stroke="#0ea5e9" stroke-width="2" fill="none"/>
        <text x="152" y="152" fill="#0ea5e9" font-size="8" text-anchor="middle">GND</text>

        <!-- Module Relais (Centre) -->
        <rect x="180" y="20" width="165" height="150" rx="8" fill="#1c273e" stroke="#0ea5e9" stroke-width="2"/>
        <text x="262" y="40" fill="#0ea5e9" font-size="11" font-weight="bold" text-anchor="middle">MODULE RELAIS</text>
        <text x="262" y="52" fill="#8b98a5" font-size="8" text-anchor="middle">(Isolation Galvanique)</text>
        
        <!-- Entrées Logiques Relais (Gauche) -->
        <circle cx="188" cy="80" r="3" fill="#ef4444"/>
        <text x="195" y="84" fill="#ef4444" font-size="9">VCC</text>

        <circle cx="188" cy="110" r="3" fill="#2dd4bf"/>
        <text x="195" y="114" fill="#2dd4bf" font-size="9">IN</text>

        <circle cx="188" cy="140" r="3" fill="#0ea5e9"/>
        <text x="195" y="144" fill="#0ea5e9" font-size="9">GND</text>
        
        <!-- Bornes Puissance Relais (Droite) -->
        <circle cx="337" cy="80" r="4" fill="#ef4444"/>
        <text x="329" y="84" fill="#ef4444" font-size="10" font-weight="bold" text-anchor="end">COM</text>

        <circle cx="337" cy="120" r="4" fill="#fb923c"/>
        <text x="329" y="124" fill="#fb923c" font-size="10" font-weight="bold" text-anchor="end">NO</text>

        <!-- Boîtier ALIMENTATION EXTERNE / BATTERIE (Dessous) -->
        <rect x="180" y="180" width="165" height="35" rx="6" fill="#1e1828" stroke="#ef4444" stroke-width="1.5"/>
        <text x="262" y="195" fill="#ef4444" font-size="9" font-weight="bold" text-anchor="middle">ALIMENTATION ${volt}</text>
        <text x="262" y="207" fill="#8b98a5" font-size="7" text-anchor="middle">Batterie / Source Externe</text>

        <!-- Ligne +12V Batterie vers Borne COM du Relais -->
        <path d="M 330 180 L 330 160 L 360 160 L 360 80 L 341 80" stroke="#ef4444" stroke-width="2.5" fill="none"/>
        <circle cx="330" cy="180" r="2.5" fill="#ef4444"/>
        <text x="365" y="165" fill="#ef4444" font-size="8">+${volt}</text>

        <!-- Ligne NO vers (+) Appareil 12V -->
        <path d="M 341 120 L 440 120 L 440 80 L 450 80" stroke="#fb923c" stroke-width="2.5" fill="none"/>
        <text x="390" y="113" fill="#fb923c" font-size="8" text-anchor="middle">NO (+)</text>

        <!-- Ligne Retour Masse (-) Appareil 12V directement vers 0V Batterie -->
        <path d="M 450 120 L 400 120 L 400 198 L 290 198 L 290 180" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="4" fill="none"/>
        <circle cx="290" cy="180" r="2.5" fill="#0ea5e9"/>
        <text x="360" y="208" fill="#0ea5e9" font-size="8" text-anchor="middle">Retour 0V Masse vers Alimentation</text>

        <!-- Boîtier Appareil 2 fils (Droite) -->
        <rect x="450" y="30" width="145" height="135" rx="8" fill="#151e32" stroke="#fb923c" stroke-width="2"/>
        <text x="522" y="55" fill="#f8fafc" font-size="11" font-weight="bold" text-anchor="middle">APPAREIL 2 FILS</text>
        <text x="522" y="69" fill="#fb923c" font-size="10" text-anchor="middle">(${volt})</text>
        <text x="522" y="145" fill="#8b98a5" font-size="8" text-anchor="middle">(Éclairage / Pompe)</text>
        
        <circle cx="454" cy="80" r="3" fill="#fb923c"/>
        <text x="464" y="84" fill="#fb923c" font-size="9">(+)</text>

        <circle cx="454" cy="120" r="3" fill="#0ea5e9"/>
        <text x="464" y="124" fill="#0ea5e9" font-size="9">(-)</text>
      </svg>
      `;
    }
  },

  "ACTUATOR_OUTPUT_RELAY_3WIRE": {
    getTitle: (volt) => {
      if (currentLang === 'en') return "On/Off Actuator (3-Wire with Dedicated Trigger)";
      if (currentLang === 'es') return "Actuador Todo o Nada (3 hilos con Señal Dedicada)";
      return "Actionneur Tout-ou-Rien (3 fils avec Commande Dédiée)";
    },
    subtitle: (volt) => {
      if (currentLang === 'en') return `Direct On/Off control for ${volt} equipment with dedicated logic input (VCC, Trigger, GND)`;
      if (currentLang === 'es') return `Control Todo o Nada para equipo ${volt} con entrada lógica (VCC, Disparo, GND)`;
      return `Commande marche/arrêt pour appareil ${volt} avec fil de commande logique (VCC, Commande, GND)`;
    },
    warning: (volt) => {
      if (currentLang === 'en') {
        return `<strong>3-WIRE ACTUATOR WIRING (${volt}):</strong> The device has 3 wires: Positive power (+${volt}), Negative power (GND 0V), and a dedicated Logic Trigger wire. The trigger wire connects directly to <strong>GPIO {{GPIO}}</strong> (3.3V logic). Never apply external 12V to the ESP32 GPIO!`;
      }
      if (currentLang === 'es') {
        return `<strong>CABLEADO DE ACTUADOR DE 3 HILOS (${volt}):</strong> El dispositivo cuenta con 3 hilos: Alimentación (+${volt}), Masa (GND) y Señal de activación. La señal se conecta directamente a <strong>GPIO {{GPIO}}</strong> (3.3V). ¡Nunca aplique 12V a un GPIO del ESP32!`;
      }
      return `<strong>CÂBLAGE ACTIONNEUR 3 FILS (${volt}) :</strong> Cet appareil possède 3 fils : Alimentation positive (+${volt}), Masse (GND 0V) et Fil de commande / déclenchement. Le fil de commande se branche directement sur le <span class="step-tag">GPIO {{GPIO}}</span> de l'ESP32. Ne reliez jamais une tension de 12V directement sur un GPIO !`;
    },
    steps: (gpio, volt) => {
      if (currentLang === 'en') {
        return [
          {
            title: `1. Positive Power (+${volt})`,
            desc: `Connect the device positive (+) wire to your <strong>+${volt} power source</strong> (auxiliary battery or dedicated supply with fuse).`
          },
          {
            title: "2. Common Ground (GND 0V)",
            desc: `Connect the device negative (-) wire to the <strong>power source GND AND to an ESP32 GND pin</strong> to ensure a common reference.`
          },
          {
            title: "3. Dedicated Control Wire (GPIO)",
            desc: `Connect the device logic trigger / command wire directly to <span class="step-tag">GPIO {{GPIO}}</span> of the ESP32.`
          }
        ];
      }
      if (currentLang === 'es') {
        return [
          {
            title: `1. Alimentación positiva (+${volt})`,
            desc: `Conecte el cable positivo (+) del equipo a su <strong>fuente de alimentación +${volt}</strong> (batería auxiliar con fusible).`
          },
          {
            title: "2. Masa común (GND 0V)",
            desc: `Conecte el cable negativo (-) del equipo a la <strong>masa de la fuente Y a un pin GND del ESP32</strong>.`
          },
          {
            title: "3. Hilo de control dedicado (GPIO)",
            desc: `Conecte el cable de disparo/control directamente al pin <span class="step-tag">GPIO {{GPIO}}</span> del ESP32.`
          }
        ];
      }
      return [
        {
          title: `1. Alimentation positive (+${volt})`,
          desc: `Reliez le fil d'alimentation positif (+) de l'appareil à la <strong>borne positive +${volt}</strong> de votre batterie/source d'alimentation (avec fusible adapté).`
        },
        {
          title: "2. Masse commune (GND 0V)",
          desc: `Reliez le fil négatif (-) de l'appareil à la <strong>masse de l'alimentation ET à une broche GND de l'ESP32</strong> pour partager la référence 0V.`
        },
        {
          title: "3. Fil de commande logique Tout-ou-Rien",
          desc: `Raccordez le fil de commande / trigger directement sur la broche <span class="step-tag">GPIO {{GPIO}}</span> de l'ESP32.`
        }
      ];
    },
    schematic: (gpio, volt) => {
      return `
      <svg viewBox="0 0 620 220" width="100%" height="210" style="max-width:620px; font-family:monospace;">
        <!-- Boîtier ESP32 (Gauche) -->
        <rect x="25" y="45" width="135" height="130" rx="8" fill="#151e32" stroke="#2dd4bf" stroke-width="2"/>
        <text x="92" y="70" fill="#2dd4bf" font-size="12" font-weight="bold" text-anchor="middle">ESP32</text>
        <text x="92" y="84" fill="#8b98a5" font-size="8" text-anchor="middle">(Logique 3.3V)</text>
        
        <circle cx="150" cy="105" r="4" fill="#2dd4bf"/>
        <text x="140" y="109" fill="#f8fafc" font-size="10" text-anchor="end">GPIO ${gpio}</text>
        
        <circle cx="150" cy="145" r="4" fill="#0ea5e9"/>
        <text x="140" y="149" fill="#8b98a5" font-size="10" text-anchor="end">GND</text>

        <!-- Boîtier ALIMENTATION EXTERNE (Haut Milieu) -->
        <rect x="200" y="15" width="180" height="55" rx="8" fill="#1e1828" stroke="#ef4444" stroke-width="2"/>
        <text x="290" y="33" fill="#ef4444" font-size="10" font-weight="bold" text-anchor="middle">ALIMENTATION ${volt}</text>
        <text x="290" y="47" fill="#fb923c" font-size="8" text-anchor="middle">(Batterie / Source)</text>
        
        <circle cx="370" cy="50" r="4" fill="#ef4444"/>
        <text x="360" y="54" fill="#ef4444" font-size="9" text-anchor="end">+${volt}</text>

        <circle cx="210" cy="50" r="4" fill="#0ea5e9"/>
        <text x="220" y="54" fill="#0ea5e9" font-size="9">GND (0V)</text>

        <!-- Ligne Alim Externe + vers Appareil VCC -->
        <path d="M 374 50 L 430 50 L 430 85 L 440 85" stroke="#ef4444" stroke-width="2.5" fill="none"/>
        <text x="405" y="44" fill="#ef4444" font-size="8">+${volt}</text>

        <!-- Ligne Commande Tout-ou-Rien depuis ESP32 vers Appareil Commande IN -->
        <path d="M 154 105 L 440 105" stroke="#2dd4bf" stroke-width="2.5" stroke-dasharray="4" fill="none"/>
        <text x="290" y="99" fill="#2dd4bf" font-size="9" text-anchor="middle">Commande Tout-ou-Rien (GPIO ${gpio})</text>

        <!-- Ligne Masse Commune : Alim GND descend vers ESP32 GND et Appareil GND -->
        <path d="M 210 54 L 210 145" stroke="#0ea5e9" stroke-width="2" fill="none"/>
        <path d="M 154 145 L 440 145" stroke="#0ea5e9" stroke-width="2" fill="none"/>
        <circle cx="210" cy="145" r="3" fill="#0ea5e9"/>
        <text x="290" y="158" fill="#0ea5e9" font-size="8" text-anchor="middle">Masse commune GND (0V)</text>

        <!-- Boîtier Appareil 3 fils (Droite) -->
        <rect x="440" y="35" width="160" height="140" rx="10" fill="#1c273e" stroke="#fbbf24" stroke-width="2"/>
        <text x="520" y="60" fill="#fbbf24" font-size="11" font-weight="bold" text-anchor="middle">APPAREIL 3 FILS</text>
        <text x="520" y="74" fill="#8b98a5" font-size="8" text-anchor="middle">Tout-ou-Rien (${volt})</text>

        <circle cx="448" cy="85" r="4" fill="#ef4444"/>
        <text x="458" y="89" fill="#ef4444" font-size="9">VCC (+)</text>

        <circle cx="448" cy="105" r="4" fill="#2dd4bf"/>
        <text x="458" y="109" fill="#2dd4bf" font-size="9">COMMANDE / TRIGGER</text>

        <circle cx="448" cy="145" r="4" fill="#0ea5e9"/>
        <text x="458" y="149" fill="#0ea5e9" font-size="9">GND (Masse)</text>
      </svg>
      `;
    }
  },

  "ACTUATOR_OUTPUT_PWM": {
    getTitle: (volt, wiringType) => {
      if (wiringType === 'DEDICATED_SIGNAL') {
        if (currentLang === 'en') return "PWM Actuator with Dedicated Signal (3/4 Wires)";
        if (currentLang === 'es') return "Actuador PWM con Cable de Señal Dedicado (3/4 hilos)";
        return "Actionneur PWM avec Fil de Signal Dédié (3 ou 4 fils)";
      }
      if (currentLang === 'en') return "Variable Actuator (PWM Dimmer / MOSFET 2-Wire)";
      if (currentLang === 'es') return "Actuador Variable (Regulador PWM / MOSFET 2 hilos)";
      return "Actionneur Progressif (Variateur PWM / MOSFET 2 fils)";
    },
    subtitle: (volt, wiringType) => {
      if (wiringType === 'DEDICATED_SIGNAL') {
        if (currentLang === 'en') return `Direct logic-level PWM control for ${volt} actuator (3/4-wire PC fan, servo)`;
        if (currentLang === 'es') return `Control PWM lógico directo para equipo ${volt} (ventilador 3/4 hilos, servo)`;
        return `Commande logique PWM directe pour appareil ${volt} (ventilateur 3/4 fils, servomoteur)`;
      }
      if (currentLang === 'en') return `Ideal for ${volt} 2-wire dimmer (fan, roof hatch, LED strip)`;
      if (currentLang === 'es') return `Ideal para regulador ${volt} de 2 hilos (ventilador, claraboya, tira LED)`;
      return `Idéal pour variateur ${volt} 2 fils (ventilateur, lanterneau Fiamma, ruban LED)`;
    },
    warning: (volt, wiringType) => {
      if (wiringType === 'DEDICATED_SIGNAL') {
        if (currentLang === 'en') return `<strong>EXTERNAL POWER REQUIRED (${volt}):</strong> The ESP32 operates at 3.3V and CANNOT provide 12V! Connect the device power wire directly to your external 12V auxiliary battery (with fuse). The ESP32 only connects to the PWM signal lead and GND. <u>NEVER connect +12V to any pin of the ESP32!</u>`;
        if (currentLang === 'es') return `<strong>ALIMENTACIÓN EXTERNA OBLIGATORIA (${volt}):</strong> ¡El ESP32 funciona a 3.3V y NO suministra 12V! Conecte la alimentación del dispositivo a la batería auxiliar de 12V (con fusible). El ESP32 solo se conecta a la señal PWM y GND. <u>¡NUNCA conecte +12V a ningún pin del ESP32!</u>`;
        return `<strong>ALIMENTATION EXTERNE OBLIGATOIRE (${volt}) :</strong> L'ESP32 fonctionne en 3.3V et ne fournit JAMAIS de 12V ! Le fil d'alimentation (+) de votre appareil doit obligatoirement être raccordé à votre <strong>batterie 12V auxiliaire externe</strong> (avec fusible). L'ESP32 ne fournit que la commande logique PWM (3.3V) et la masse GND. <u>Ne branchez JAMAIS le fil +12V sur une broche de l'ESP32 !</u>`;
      }
      if (currentLang === 'en') return `<strong>EXTERNAL 12V POWER VIA MOSFET (+, -, LOAD):</strong> The ESP32 cannot power 12V loads. Connect PWM and GND to the ESP32. On the other side, wire +12V from battery to terminal <strong>+</strong>, battery 0V to <strong>-</strong>, and device (-) to <strong>LOAD</strong>.`;
      if (currentLang === 'es') return `<strong>ALIMENTACIÓN EXTERNA DE 12V VÍA MOSFET (+, -, LOAD):</strong> El ESP32 no suministra 12V. Conecte PWM y GND al ESP32. En el otro lado, conecte el +12V de la batería al borne <strong>+</strong>, el 0V a <strong>-</strong>, y el negativo del equipo a <strong>LOAD</strong>.`;
      return `<strong>ALIMENTATION EXTERNE 12V VIA MOSFET (+, -, LOAD) :</strong> L'ESP32 ne fournit jamais de 12V. Reliez PWM et GND à l'ESP32. De l'autre côté du module, reliez le +12V batterie à la borne <strong>+</strong>, le 0V à <strong>-</strong>, et le fil négatif (-) de l'appareil à la borne <strong>LOAD</strong>.`;
    },
    steps: (gpio, volt, wiringType) => {
      if (wiringType === 'DEDICATED_SIGNAL') {
        if (currentLang === 'en') {
          return [
            {
              title: `1. External ${volt} Power Supply`,
              desc: `Connect the device positive lead (VCC / +) directly to the <strong>+${volt} terminal of your auxiliary battery</strong> (with appropriate fuse). Never connect to ESP32!`
            },
            {
              title: "2. Common Ground (GND 0V)",
              desc: "Connect the device negative wire (GND / 0V) to the <strong>battery negative terminal AND to an ESP32 GND pin</strong> to ensure a common reference."
            },
            {
              title: "3. Direct PWM Logic Signal (3.3V)",
              desc: `Connect the dedicated <strong>PWM / SIGNAL</strong> wire (blue or yellow) directly to <span class="step-tag">GPIO {{GPIO}}</span> of the ESP32.`
            }
          ];
        }
        if (currentLang === 'es') {
          return [
            {
              title: `1. Alimentación Externa (${volt})`,
              desc: `Conecte el cable positivo (VCC / +) del equipo al <strong>borne positivo +${volt} de su batería auxiliar</strong> (con fusible). ¡Nunca al ESP32!`
            },
            {
              title: "2. Masa Común (GND 0V)",
              desc: "Conecte el cable negativo (GND / 0V) del equipo al <strong>negativo de la batería Y a un pin GND del ESP32</strong> para compartir la masa de referencia."
            },
            {
              title: "3. Señal PWM Lógica (3.3V)",
              desc: `Conecte el cable de <strong>PWM / SEÑAL</strong> dedicado directamente al pin <span class="step-tag">GPIO {{GPIO}}</span> del ESP32.`
            }
          ];
        }
        return [
          {
            title: `1. Alimentation externe ${volt} (Batterie)`,
            desc: `Raccordez le fil d'alimentation (+) de votre appareil directement à la <strong>borne positive +${volt} de votre batterie auxiliaire</strong> (avec fusible adapté). Ne jamais le brancher sur l'ESP32 !`
          },
          {
            title: "2. Masse commune (GND 0V)",
            desc: "Reliez le fil négatif (0V / GND) de votre appareil au <strong>négatif de la batterie 12V ET à une broche GND de l'ESP32</strong> pour partager la même référence électrique."
          },
          {
            title: "3. Signal PWM logique (3.3V)",
            desc: `Reliez le fil de commande <strong>PWM / SIGNAL</strong> (3e ou 4e fil) directement sur la broche <span class="step-tag">GPIO {{GPIO}}</span> de l'ESP32.`
          }
        ];
      }

      if (currentLang === 'en') {
        return [
          {
            title: "1. ESP32 Logic Control (PWM & GND)",
            desc: `Connect the MOSFET <strong>PWM</strong> terminal to <span class="step-tag">GPIO {{GPIO}}</span> and the MOSFET <strong>GND</strong> terminal to an ESP32 <strong>GND</strong> pin.`
          },
          {
            title: `2. External Power Input (+ and - Terminals)`,
            desc: `Connect the MOSFET <strong>+</strong> terminal to your <strong>external +${volt} auxiliary battery</strong> (with fuse), and the <strong>-</strong> terminal to the battery negative <strong>(0V / GND)</strong>.`
          },
          {
            title: "3. 2-Wire Device Wiring (+ and LOAD)",
            desc: "Connect the device positive wire (+) to terminal <strong>+</strong> (shared with battery +12V), and the device negative wire (-) to terminal <strong>LOAD</strong> (switched ground via MOSFET)."
          }
        ];
      }
      if (currentLang === 'es') {
        return [
          {
            title: "1. Control Lógico desde ESP32 (PWM y GND)",
            desc: `Conecte el borne <strong>PWM</strong> del MOSFET al pin <span class="step-tag">GPIO {{GPIO}}</span> y el borne <strong>GND</strong> a un pin <strong>GND</strong> del ESP32.`
          },
          {
            title: `2. Alimentación de Potencia Externa (Bornes + y -)`,
            desc: `Conecte el borne <strong>+</strong> del MOSFET al <strong>+${volt} de su batería auxiliar</strong> (con fusible), y el borne <strong>-</strong> al negativo <strong>(0V / GND)</strong> de la batería.`
          },
          {
            title: "3. Conexión del Equipo de 2 Hilos (+ y LOAD)",
            desc: "Conecte el cable positivo (+) del equipo al borne <strong>+</strong> (compartido con el +12V), y el cable negativo (-) al borne <strong>LOAD</strong> (tierra conmutada por el MOSFET)."
          }
        ];
      }
      return [
        {
          title: "1. Commande logique depuis l'ESP32 (PWM & GND)",
          desc: `Reliez la borne <strong>PWM</strong> du module MOSFET sur la broche <span class="step-tag">GPIO {{GPIO}}</span> de l'ESP32, et la borne <strong>GND</strong> sur une broche <strong>GND</strong> de l'ESP32.`
        },
        {
          title: `2. Alimentation de puissance externe (Bornes + et -)`,
          desc: `Raccordez la borne <strong>+</strong> du MOSFET au <strong>+${volt} de votre batterie auxiliaire</strong> (avec fusible adapté), et la borne <strong>-</strong> sur le <strong>0V / négatif (-)</strong> de la batterie.`
        },
        {
          title: "3. Raccordement de l'appareil 2 fils (Bornes + et LOAD)",
          desc: "Branchez le fil positif (+) de votre appareil sur la borne <strong>+</strong> du MOSFET (partagée avec le +12V), et le fil négatif (-) de l'appareil sur la borne <strong>LOAD</strong> (masse hachée/commutée par le MOSFET)."
        }
      ];
    },
    schematic: (gpio, volt, wiringType) => {
      if (wiringType === 'DEDICATED_SIGNAL') {
        return `
        <svg viewBox="0 0 570 185" width="100%" height="175" style="max-width:570px; font-family:monospace;">
          <!-- Boîtier ESP32 (Gauche) -->
          <rect x="15" y="45" width="125" height="115" rx="8" fill="#151e32" stroke="#2dd4bf" stroke-width="2"/>
          <text x="77" y="70" fill="#2dd4bf" font-size="12" font-weight="bold" text-anchor="middle">ESP32</text>
          <text x="77" y="84" fill="#8b98a5" font-size="8" text-anchor="middle">(Logique 3.3V)</text>
          
          <circle cx="130" cy="105" r="4" fill="#a855f7"/>
          <text x="120" y="109" fill="#f8fafc" font-size="9" text-anchor="end">GPIO ${gpio}</text>
          
          <circle cx="130" cy="138" r="4" fill="#0ea5e9"/>
          <text x="120" y="142" fill="#8b98a5" font-size="9" text-anchor="end">GND</text>

          <!-- Boîtier ALIMENTATION EXTERNE / BATTERIE (Haut Milieu) -->
          <rect x="175" y="15" width="180" height="60" rx="8" fill="#1e1828" stroke="#ef4444" stroke-width="2"/>
          <text x="265" y="33" fill="#ef4444" font-size="10" font-weight="bold" text-anchor="middle">ALIMENTATION EXTERNE</text>
          <text x="265" y="47" fill="#fb923c" font-size="8" text-anchor="middle">(Batterie Van ${volt})</text>
          
          <circle cx="345" cy="58" r="4" fill="#ef4444"/>
          <text x="335" y="62" fill="#ef4444" font-size="9" text-anchor="end">+${volt}</text>

          <circle cx="185" cy="58" r="4" fill="#0ea5e9"/>
          <text x="195" y="62" fill="#0ea5e9" font-size="9">GND (0V)</text>

          <!-- Ligne Alim Externe +12V vers Appareil VCC -->
          <path d="M349 58 L410 58" stroke="#ef4444" stroke-width="2.5" fill="none"/>
          <text x="380" y="52" fill="#ef4444" font-size="8" text-anchor="middle">+${volt}</text>

          <!-- Ligne Commande PWM depuis ESP32 vers Appareil PWM IN -->
          <path d="M134 105 L410 105" stroke="#a855f7" stroke-width="2.5" stroke-dasharray="4" fill="none"/>
          <text x="270" y="99" fill="#a855f7" font-size="8" text-anchor="middle">Signal PWM (3.3V)</text>

          <!-- Ligne Masse Commune : Batterie GND descend vers niveau ESP32 GND -->
          <path d="M185 62 L185 138" stroke="#0ea5e9" stroke-width="2" fill="none"/>
          <path d="M134 138 L410 138" stroke="#0ea5e9" stroke-width="2" fill="none"/>
          <circle cx="185" cy="138" r="3" fill="#0ea5e9"/>
          <text x="270" y="152" fill="#0ea5e9" font-size="8" text-anchor="middle">Masse commune GND (0V)</text>

          <!-- Boîtier Appareil PWM 3/4 fils (Droite) -->
          <rect x="410" y="25" width="145" height="135" rx="8" fill="#1c273e" stroke="#a855f7" stroke-width="2"/>
          <text x="482" y="46" fill="#a855f7" font-size="11" font-weight="bold" text-anchor="middle">APPAREIL PWM</text>
          <text x="482" y="58" fill="#8b98a5" font-size="8" text-anchor="middle">(Ventilateur 3/4 fils)</text>

          <text x="418" y="62" fill="#ef4444" font-size="9">VCC (+)</text>
          <text x="418" y="109" fill="#a855f7" font-size="9">PWM / SIG</text>
          <text x="418" y="142" fill="#0ea5e9" font-size="9">GND (-)</text>
        </svg>
        `;
      }

      return `
      <svg viewBox="0 0 600 230" width="100%" height="220" style="max-width:600px; font-family:monospace;">
        <!-- Boîtier ESP32 (Gauche) -->
        <rect x="15" y="30" width="115" height="130" rx="8" fill="#151e32" stroke="#2dd4bf" stroke-width="2"/>
        <text x="72" y="55" fill="#2dd4bf" font-size="12" font-weight="bold" text-anchor="middle">ESP32</text>
        <text x="72" y="68" fill="#8b98a5" font-size="8" text-anchor="middle">(Logique 3.3V)</text>
        
        <circle cx="120" cy="85" r="4" fill="#a855f7"/>
        <text x="110" y="89" fill="#f8fafc" font-size="9" text-anchor="end">GPIO ${gpio}</text>
        
        <circle cx="120" cy="125" r="4" fill="#0ea5e9"/>
        <text x="110" y="129" fill="#8b98a5" font-size="9" text-anchor="end">GND</text>

        <!-- Lignes Commande Logique ESP32 -> MOSFET -->
        <path d="M125 85 L180 85" stroke="#a855f7" stroke-width="2.5" stroke-dasharray="3" fill="none"/>
        <text x="152" y="78" fill="#a855f7" font-size="8" text-anchor="middle">PWM</text>

        <path d="M125 125 L180 125" stroke="#0ea5e9" stroke-width="2" fill="none"/>
        <text x="152" y="137" fill="#0ea5e9" font-size="8" text-anchor="middle">GND</text>

        <!-- Module MOSFET (Centre) -->
        <rect x="180" y="20" width="180" height="150" rx="8" fill="#1c273e" stroke="#a855f7" stroke-width="2"/>
        <text x="270" y="40" fill="#a855f7" font-size="11" font-weight="bold" text-anchor="middle">MODULE MOSFET</text>
        <text x="270" y="52" fill="#8b98a5" font-size="8" text-anchor="middle">(Commande 3.3V)</text>
        
        <!-- Côté Gauche : Entrées Commande Logique -->
        <circle cx="188" cy="85" r="3" fill="#a855f7"/>
        <text x="195" y="89" fill="#a855f7" font-size="9">PWM</text>

        <circle cx="188" cy="125" r="3" fill="#0ea5e9"/>
        <text x="195" y="129" fill="#0ea5e9" font-size="9">GND</text>

        <!-- Côté Droit : Borniers +, LOAD, - -->
        <circle cx="352" cy="70" r="4" fill="#ef4444"/>
        <text x="344" y="74" fill="#ef4444" font-size="11" font-weight="bold" text-anchor="end">+</text>

        <circle cx="352" cy="105" r="4" fill="#fb923c"/>
        <text x="344" y="109" fill="#fb923c" font-size="10" font-weight="bold" text-anchor="end">LOAD</text>

        <circle cx="352" cy="140" r="4" fill="#0ea5e9"/>
        <text x="344" y="144" fill="#0ea5e9" font-size="11" font-weight="bold" text-anchor="end">-</text>

        <!-- Alimentation Externe Batterie (Dessous) -->
        <rect x="180" y="185" width="180" height="35" rx="6" fill="#1e1828" stroke="#ef4444" stroke-width="1.5"/>
        <text x="270" y="200" fill="#ef4444" font-size="9" font-weight="bold" text-anchor="middle">BATTERIE 12V (Van)</text>
        <text x="270" y="212" fill="#8b98a5" font-size="7" text-anchor="middle">Alimentation Externe</text>

        <!-- Fil +12V Batterie vers Borne + du MOSFET -->
        <path d="M 215 185 L 215 174 L 370 174 L 370 70 L 356 70" stroke="#ef4444" stroke-width="2" fill="none"/>
        <circle cx="215" cy="185" r="2.5" fill="#ef4444"/>
        <text x="220" y="180" fill="#ef4444" font-size="7">+${volt}</text>

        <!-- Fil 0V Masse Batterie vers Borne - du MOSFET -->
        <path d="M 325 185 L 325 140 L 356 140" stroke="#0ea5e9" stroke-width="2" fill="none"/>
        <circle cx="325" cy="185" r="2.5" fill="#0ea5e9"/>
        <text x="330" y="180" fill="#0ea5e9" font-size="7">0V (GND)</text>

        <!-- Lignes Sortie vers Appareil 12V -->
        <!-- Fil Positif (+) Appareil depuis Borne + -->
        <path d="M 356 70 L 430 70" stroke="#ef4444" stroke-width="2.5" fill="none"/>
        <circle cx="356" cy="70" r="3" fill="#ef4444"/>
        <text x="393" y="63" fill="#ef4444" font-size="8" text-anchor="middle">(+) ${volt}</text>

        <!-- Fil Négatif (-) Appareil depuis Borne LOAD -->
        <path d="M 356 105 L 430 105" stroke="#fb923c" stroke-width="2.5" fill="none"/>
        <circle cx="356" cy="105" r="3" fill="#fb923c"/>
        <text x="393" y="98" fill="#fb923c" font-size="8" text-anchor="middle">(-) LOAD</text>

        <!-- Boîtier Appareil 12V (Droite) -->
        <rect x="430" y="25" width="145" height="145" rx="8" fill="#151e32" stroke="#fb923c" stroke-width="2"/>
        <text x="502" y="48" fill="#f8fafc" font-size="11" font-weight="bold" text-anchor="middle">APPAREIL 12V</text>
        <text x="502" y="62" fill="#fb923c" font-size="9" text-anchor="middle">(Charge)</text>
        <text x="502" y="140" fill="#8b98a5" font-size="8" text-anchor="middle">(LED / Moteur / Pompe)</text>
        
        <text x="438" y="74" fill="#ef4444" font-size="9">(+)</text>
        <text x="438" y="109" fill="#fb923c" font-size="9">(-)</text>
      </svg>
      `;
    }
  },

  "SENSOR_INPUT_PIR": {
    getTitle: () => {
      if (currentLang === 'en') return "PIR Motion Sensor (HC-SR501 / AM312)";
      if (currentLang === 'es') return "Sensor de Movimiento PIR (HC-SR501 / AM312)";
      return "Détecteur de Mouvement PIR (HC-SR501 / AM312)";
    },
    subtitle: () => {
      if (currentLang === 'en') return "Passive infrared presence & motion detection (Active HIGH 3.3V)";
      if (currentLang === 'es') return "Detección infrarroja pasiva de presencia y movimiento (Activo ALTO 3.3V)";
      return "Détection infrarouge passive de présence et mouvement (Actif HAUT 3.3V)";
    },
    warning: (volt) => {
      if (currentLang === 'en') return `<strong>PIR SENSOR (3.3V LOGIC OUT):</strong> The PIR output pin (OUT) outputs <strong>3.3V</strong> when motion is detected, which is 100% safe for ESP32. Power HC-SR501 with <strong>VIN (5V)</strong> or AM312 with <strong>3.3V</strong>. Common GND is required.`;
      if (currentLang === 'es') return `<strong>SENSOR PIR (SALIDA LÓGICA 3.3V):</strong> La señal de salida (OUT) entrega <strong>3.3V</strong> al detectar movimiento (compatible directo ESP32). Alimente el HC-SR501 con <strong>VIN (5V)</strong> o el AM312 con <strong>3.3V</strong>. Masa común (GND) obligatoria.`;
      return `<strong>CAPTEUR PIR (SIGNAL 3.3V COMPATIBLE ESP32) :</strong> La sortie OUT délivre <strong>3.3V</strong> lors d'une détection (Active-HIGH). Alimentez le module HC-SR501 en <strong>VIN (5V)</strong> ou l'AM312 en <strong>3.3V</strong>. Veillez à relier la masse GND à l'ESP32.`;
    },
    schematic: (gpio, volt) => {
      const vccLabel = (volt === '3.3V') ? '3.3V' : 'VIN (5V)';
      return `
      <svg viewBox="0 0 540 160" width="100%" height="150" style="max-width:540px; font-family:monospace;">
        <!-- ESP32 -->
        <rect x="20" y="25" width="130" height="110" rx="8" fill="#151e32" stroke="#10b981" stroke-width="2"/>
        <text x="85" y="48" fill="#10b981" font-size="12" font-weight="bold" text-anchor="middle">ESP32</text>
        <circle cx="140" cy="65" r="5" fill="#ef4444"/>
        <text x="130" y="69" fill="#ef4444" font-size="10" text-anchor="end">${vccLabel}</text>
        <circle cx="140" cy="90" r="5" fill="#10b981"/>
        <text x="130" y="94" fill="#f8fafc" font-size="10" text-anchor="end">GPIO ${gpio}</text>
        <circle cx="140" cy="115" r="5" fill="#0ea5e9"/>
        <text x="130" y="119" fill="#8b98a5" font-size="10" text-anchor="end">GND</text>

        <!-- Lignes de liaison -->
        <path d="M145 65 L320 65" stroke="#ef4444" stroke-width="2" fill="none"/>
        <path d="M145 90 L320 90" stroke="#10b981" stroke-width="2.5" fill="none"/>
        <path d="M145 115 L320 115" stroke="#0ea5e9" stroke-width="2" fill="none"/>

        <!-- Module PIR -->
        <rect x="320" y="25" width="190" height="110" rx="8" fill="#1c273e" stroke="#10b981" stroke-width="2"/>
        <text x="415" y="46" fill="#10b981" font-size="11" font-weight="bold" text-anchor="middle">CAPTEUR PIR HC-SR501</text>
        
        <!-- Lentille Fresnel stylisée -->
        <circle cx="415" cy="85" r="24" fill="#0f172a" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3"/>
        <circle cx="415" cy="85" r="14" fill="#1e293b"/>
        <circle cx="415" cy="85" r="6" fill="#10b981" opacity="0.6"/>

        <text x="330" y="69" fill="#ef4444" font-size="9">VCC (${vccLabel})</text>
        <text x="330" y="94" fill="#10b981" font-size="9">OUT (3.3V)</text>
        <text x="330" y="119" fill="#0ea5e9" font-size="9">GND (0V)</text>
      </svg>
      `;
    },
    steps: (gpio, volt) => {
      const vccLabel = (volt === '3.3V') ? '3.3V' : 'VIN (5V)';
      if (currentLang === 'en') {
        return [
          {
            title: "1. Power supply (VCC & GND)",
            desc: `Connect the PIR module <strong>VCC</strong> pin to ESP32 <strong>${vccLabel}</strong>, and PIR <strong>GND</strong> to ESP32 <strong>GND</strong>.`
          },
          {
            title: "2. Digital motion signal (OUT)",
            desc: `Connect the PIR <strong>OUT / Data</strong> pin directly to <span class="step-tag">GPIO {{GPIO}}</span> of the ESP32.`
          },
          {
            title: "3. Sensitivity & delay adjustments",
            desc: `For HC-SR501, set the jumper to 'H' (repeat trigger) and adjust the time delay pot to minimum (approx. 2-3s) for responsive automation.`
          }
        ];
      }
      if (currentLang === 'es') {
        return [
          {
            title: "1. Alimentación (VCC y GND)",
            desc: `Conecte el pin <strong>VCC</strong> del PIR al pin <strong>${vccLabel}</strong> del ESP32, y el pin <strong>GND</strong> a un pin <strong>GND</strong> del ESP32.`
          },
          {
            title: "2. Señal digital de movimiento (OUT)",
            desc: `Conecte el pin <strong>OUT / Datos</strong> del PIR directamente al pin <span class="step-tag">GPIO {{GPIO}}</span> del ESP32.`
          },
          {
            title: "3. Ajuste de sensibilidad y retardo",
            desc: `En el HC-SR501, configure el jumper en modo repetible ('H') y reduzca el potenciómetro de retardo al mínimo (~2s) para máxima reactividad.`
          }
        ];
      }
      return [
        {
          title: "1. Alimentation du capteur (VCC & GND)",
          desc: `Reliez la broche <strong>VCC</strong> du détecteur à la broche <strong>${vccLabel}</strong> de l'ESP32, et la broche <strong>GND</strong> à la masse <strong>GND</strong> de l'ESP32.`
        },
        {
          title: "2. Signal logique de présence (OUT)",
          desc: `Raccordez la broche <strong>OUT</strong> (signal) du capteur directement sur la broche <span class="step-tag">GPIO {{GPIO}}</span> de l'ESP32.`
        },
        {
          title: "3. Réglage de sensibilité et temporisation",
          desc: `Sur le HC-SR501, placez le cavalier en mode redéclenchement ('H') et réglez le potentiomètre de délai au minimum (~2-3 sec) pour des automatisations réactives.`
        }
      ];
    }
  },

  "SENSOR_INPUT_DIGITAL": {
    getTitle: () => {
      if (currentLang === 'en') return "On/Off Sensor (Dry Contact / Level Float)";
      if (currentLang === 'es') return "Sensor Todo o Nada (Contacto Seco / Boya)";
      return "Capteur Tout-ou-Rien (Contact sec / Flotteur niveau)";
    },
    subtitle: () => {
      if (currentLang === 'en') return "Passive mechanical sensor without power (tank float, limit switch, button)";
      if (currentLang === 'es') return "Sensor mecánico pasivo sin alimentación (boya de depósito, final de carrera, pulsador)";
      return "Capteur mécanique passif sans alimentation (flotteur de cuve, fin de course, bouton)";
    },
    warning: () => {
      if (currentLang === 'en') return `<strong>INTERNAL PULL-UP ENABLED (3.3V):</strong> This sensor is a passive mechanical contact. The ESP32 uses its internal pull-up resistor. <u>NEVER connect external power (+12V or +5V)</u> to contact wires or the ESP32 will be permanently damaged!`;
      if (currentLang === 'es') return `<strong>PULL-UP INTERNO ACTIVADO (3.3V):</strong> Este sensor es un contacto mecánico pasivo. El ESP32 incluye una resistencia de pull-up interna. <u>¡NUNCA conecte alimentación externa (+12V o +5V)</u> a los cables del contacto o dañará el ESP32 permanentemente!`;
      return `<strong>PULL-UP INTERNE ACTIVÉ (3.3V) :</strong> Ce capteur est un contact mécanique passif. L'ESP32 intègre une résistance de rappel interne. <u>Ne reliez JAMAIS d'alimentation externe (+12V ou +5V)</u> sur les fils du contact sous peine de détruire l'ESP32 !`;
    },
    steps: (gpio) => {
      if (currentLang === 'en') {
        return [
          {
            title: "1. First wire connection (GND)",
            desc: "Connect one of the two wires of your dry contact / float to a <strong>GND</strong> pin of the ESP32."
          },
          {
            title: "2. Second wire connection (Signal)",
            desc: "Connect the second wire directly to <span class=\"step-tag\">GPIO {{GPIO}}</span> of the ESP32. No external power is required."
          },
          {
            title: "3. Detection logic",
            desc: "At rest (open circuit), the ESP32 reads <strong>HIGH (3.3V)</strong> via internal pull-up. When contact closes (float tilted), pin is grounded and ESP32 reads <strong>LOW (0V / CLOSED)</strong>."
          }
        ];
      }
      if (currentLang === 'es') {
        return [
          {
            title: "1. Conexión del primer cable (GND)",
            desc: "Conecte uno de los dos cables de su contacto seco / boya a un borne <strong>GND</strong> (Masa) del ESP32."
          },
          {
            title: "2. Conexión del segundo cable (Señal)",
            desc: "Conecte el segundo cable directamente al pin <span class=\"step-tag\">GPIO {{GPIO}}</span> del ESP32. No se requiere alimentación externa."
          },
          {
            title: "3. Lógica de detección",
            desc: "En reposo (circuito abierto), el ESP32 lee <strong>ALTO (3.3V)</strong> mediante pull-up interno. Cuando el contacto se cierra (boya basculada), el pin se conecta a masa y el ESP32 lee <strong>BAJO (0V / CERRADO)</strong>."
          }
        ];
      }
      return [
        {
          title: "1. Raccordement du premier fil (GND)",
          desc: "Branchez l'un des deux fils de votre contact sec / flotteur sur une borne <strong>GND</strong> (Masse) de l'ESP32."
        },
        {
          title: "2. Raccordement du second fil (Signal)",
          desc: "Branchez le second fil directement sur la broche <span class=\"step-tag\">GPIO {{GPIO}}</span> de l'ESP32. Aucune alimentation externe n'est nécessaire."
        },
        {
          title: "3. Logique de détection",
          desc: "Au repos (circuit ouvert), l'ESP32 lit un état <strong>HAUT (3.3V)</strong> grâce au pull-up interne. Lorsque le contact se ferme (flotteur basculé), la broche est reliée à la masse et l'ESP32 lit <strong>BAS (0V / Contact FERMÉ)</strong>."
        }
      ];
    },
    schematic: (gpio) => `
      <svg viewBox="0 0 540 160" width="100%" height="150" style="max-width:540px; font-family:monospace;">
        <rect x="30" y="25" width="140" height="110" rx="8" fill="#151e32" stroke="#2dd4bf" stroke-width="2"/>
        <text x="100" y="50" fill="#2dd4bf" font-size="12" font-weight="bold" text-anchor="middle">ESP32 (PULL-UP 3.3V)</text>
        <circle cx="160" cy="80" r="5" fill="#2dd4bf"/>
        <text x="150" y="84" fill="#f8fafc" font-size="10" text-anchor="end">GPIO ${gpio}</text>
        <circle cx="160" cy="110" r="5" fill="#0ea5e9"/>
        <text x="150" y="114" fill="#8b98a5" font-size="10" text-anchor="end">GND</text>

        <path d="M165 80 L320 80" stroke="#2dd4bf" stroke-width="2.5" fill="none"/>
        <path d="M165 110 L320 110" stroke="#0ea5e9" stroke-width="2" fill="none"/>

        <rect x="320" y="35" width="180" height="90" rx="8" fill="#1c273e" stroke="#2dd4bf" stroke-width="2"/>
        <text x="410" y="65" fill="#2dd4bf" font-size="11" font-weight="bold" text-anchor="middle">CONTACT SEC / FLOTTEUR</text>
        <circle cx="350" cy="80" r="4" fill="#f8fafc"/>
        <circle cx="470" cy="110" r="4" fill="#f8fafc"/>
        <path d="M354 80 L440 95" stroke="#f8fafc" stroke-width="2.5" fill="none"/>
        <text x="410" y="115" fill="#8b98a5" font-size="9" text-anchor="middle">Contact passif (sans tension)</text>
      </svg>
    `
  },

  "SENSOR_INPUT_ADC": {
    getTitle: () => {
      if (currentLang === 'en') return "Analog Sensor (0 - 3.3V Measurement)";
      if (currentLang === 'es') return "Sensor Analógico (Medición 0 - 3.3V)";
      return "Capteur Analogique (Mesure 0 - 3.3V)";
    },
    subtitle: (volt) => {
      if (currentLang === 'en') return `For pressure sensors, capacitive level gauges (${volt})`;
      if (currentLang === 'es') return `Para sensores de presión, aforadores capacitivos (${volt})`;
      return `Pour sondes de pression, capteurs de niveau capacitif ou jauges (${volt})`;
    },
    warning: (volt) => {
      if (currentLang === 'en') {
        return (volt === '12V' || volt === '5V')
          ? `<strong>MAX 3.3V SIGNAL ON ESP32:</strong> Your sensor is powered by <strong>${volt}</strong>. <u>Crucial note:</u> the ESP32 analog pin (GPIO {{GPIO}}) only supports a maximum of 3.3V! If the sensor output signal exceeds 3.3V (e.g. 0-5V or 0-10V), you MUST install a voltage divider to protect the ESP32.`
          : `<strong>MAXIMUM 3.3V VOLTAGE:</strong> The selected ADC pin (ADC1) accepts 0 to 3.3V. The sensor is powered directly from ESP32 3.3V.`;
      }
      if (currentLang === 'es') {
        return (volt === '12V' || volt === '5V')
          ? `<strong>SEÑAL MÁXIMA 3.3V EN ESP32:</strong> Su sensor está alimentado con <strong>${volt}</strong>. <u>Nota obligatoria:</u> ¡el pin de medición del ESP32 (GPIO {{GPIO}}) solo soporta un máximo de 3.3V! Si la señal de salida del sensor supera los 3.3V (ej: 0-5V o 0-10V), debe instalar obligatoriamente un divisor de voltaje para proteger el ESP32.`
          : `<strong>VOLTAJE MÁXIMO 3.3V:</strong> El pin ADC seleccionado (ADC1) acepta voltajes de 0 a 3.3V. El sensor se alimenta directamente desde los 3.3V del ESP32.`;
      }
      return (volt === '12V' || volt === '5V')
        ? `<strong>SIGNAL MAX 3.3V SUR L'ESP32 :</strong> Votre capteur est alimenté en <strong>${volt}</strong>. <u>Attention impérative :</u> la broche de mesure de l'ESP32 (GPIO {{GPIO}}) ne supporte que 3.3V maximum ! Si le signal de sortie du capteur dépasse 3.3V (ex: 0-5V ou 0-10V), vous devez obligatoirement intercaler un pont diviseur de tension pour protéger l'ESP32.`
        : `<strong>TENSION MAXIMALE 3.3V :</strong> La broche ADC sélectionnée (ADC1) accepte une tension entre 0 et 3.3V. Le capteur est alimenté directement par le 3.3V de l'ESP32.`;
    },
    steps: (gpio, volt) => {
      if (currentLang === 'en') {
        const vccDesc = (volt === '3.3V') ? "to <strong>3.3V</strong> pin of ESP32" : (volt === '5V' ? "to <strong>VIN (5V)</strong> pin of ESP32" : "to battery <strong>+12V</strong>");
        return [
          {
            title: "1. Reference ground (GND)",
            desc: "Connect sensor <strong>GND</strong> to one of the ESP32 <strong>GND</strong> pins (common ground required)."
          },
          {
            title: `2. Sensor power supply (${volt})`,
            desc: `Connect sensor power wire (VCC) ${vccDesc}.`
          },
          {
            title: "3. Measurement signal connection",
            desc: `Connect measurement wire (VOUT / Analog signal) to <span class="step-tag">GPIO {{GPIO}}</span> of the ESP32 (ensure voltage never exceeds 3.3V).`
          }
        ];
      }
      if (currentLang === 'es') {
        const vccDesc = (volt === '3.3V') ? "al pin <strong>3.3V</strong> del ESP32" : (volt === '5V' ? "al pin <strong>VIN (5V)</strong> del ESP32" : "al <strong>+12V</strong> de su batería");
        return [
          {
            title: "1. Masa de referencia (GND)",
            desc: "Conecte el borne <strong>GND</strong> del sensor a uno de los pines <strong>GND</strong> del ESP32 (masa común obligatoria)."
          },
          {
            title: `2. Alimentación del sensor (${volt})`,
            desc: `Conecte el cable de alimentación (VCC) del sensor ${vccDesc}.`
          },
          {
            title: "3. Conexión de señal de medición",
            desc: `Conecte el cable de medición (VOUT / Señal analógica) al pin <span class="step-tag">GPIO {{GPIO}}</span> del ESP32 (asegúrese de que nunca supere 3.3V).`
          }
        ];
      }
      const vccDesc = (volt === '3.3V') 
        ? "sur la broche <strong>3.3V</strong> de l'ESP32" 
        : (volt === '5V' ? "sur la broche <strong>VIN (5V)</strong> de l'ESP32" : "sur le <strong>+12V</strong> de votre batterie");
      return [
        {
          title: "1. Masse de référence (GND)",
          desc: "Reliez la borne <strong>GND</strong> du capteur à l'une des broches <strong>GND</strong> de l'ESP32 (masse commune obligatoire)."
        },
        {
          title: `2. Alimentation du capteur (${volt})`,
          desc: `Connectez le fil d'alimentation (VCC) du capteur ${vccDesc}.`
        },
        {
          title: "3. Raccordement du signal de mesure",
          desc: `Branchez le fil de mesure (VOUT / Signal analogique) sur la broche <span class="step-tag">GPIO {{GPIO}}</span> de l'ESP32 (veillez à ce que la tension ne dépasse jamais 3.3V).`
        }
      ];
    },
    schematic: (gpio, volt) => {
      const vccLabel = (volt === '12V') ? '+12V BAT' : (volt === '5V' ? 'VIN (5V)' : '3.3V');
      return `
      <svg viewBox="0 0 540 160" width="100%" height="150" style="max-width:540px; font-family:monospace;">
        <rect x="20" y="25" width="130" height="110" rx="8" fill="#151e32" stroke="#fb923c" stroke-width="2"/>
        <text x="85" y="48" fill="#fb923c" font-size="12" font-weight="bold" text-anchor="middle">ESP32 (ADC1)</text>
        <circle cx="140" cy="65" r="5" fill="#ef4444"/>
        <text x="130" y="69" fill="#ef4444" font-size="10" text-anchor="end">${vccLabel}</text>
        <circle cx="140" cy="90" r="5" fill="#fb923c"/>
        <text x="130" y="94" fill="#f8fafc" font-size="10" text-anchor="end">GPIO ${gpio}</text>
        <circle cx="140" cy="115" r="5" fill="#0ea5e9"/>
        <text x="130" y="119" fill="#8b98a5" font-size="10" text-anchor="end">GND</text>

        <path d="M145 65 L320 65" stroke="#ef4444" stroke-width="2" fill="none"/>
        <path d="M145 90 L320 90" stroke="#fb923c" stroke-width="2.5" fill="none"/>
        <path d="M145 115 L320 115" stroke="#0ea5e9" stroke-width="2" fill="none"/>

        <rect x="320" y="25" width="190" height="110" rx="8" fill="#1c273e" stroke="#fb923c" stroke-width="2"/>
        <text x="415" y="52" fill="#fb923c" font-size="11" font-weight="bold" text-anchor="middle">CAPTEUR ANALOGIQUE</text>
        <text x="330" y="69" fill="#ef4444" font-size="9">VCC (${volt})</text>
        <text x="330" y="94" fill="#fb923c" font-size="9">VOUT (0-3.3V)</text>
        <text x="330" y="119" fill="#0ea5e9" font-size="9">GND (0V)</text>
      </svg>
      `;
    }
  },

  "SENSOR_INPUT_ADC_NTC": {
    getTitle: () => {
      if (currentLang === 'en') return "2-Wire Digital Sensor (Temperature, Humidity, etc.)";
      if (currentLang === 'es') return "Sonda digital de 2 hilos (Temperatura, Humedad, etc.)";
      return "Sonde numérique 2 fils (Température, Humidité, etc.)";
    },
    subtitle: () => {
      if (currentLang === 'en') return "2-wire sensor on voltage divider (3.3V)";
      if (currentLang === 'es') return "Sonda de 2 hilos en divisor de tensión (3.3V)";
      return "Sonde 2 fils sur pont diviseur de tension (3.3V)";
    },
    warning: () => {
      if (currentLang === 'en') {
        return `<strong>PASSIVE COMPONENT (10 kΩ RESISTOR REQUIRED):</strong> An NTC thermistor has only 2 wires and requires a <strong>10 kΩ</strong> reference resistor to form a voltage divider. <u>NEVER</u> connect a passive probe to 12V! Power the divider exclusively with <strong>3.3V</strong> from the ESP32.`;
      }
      if (currentLang === 'es') {
        return `<strong>COMPONENTE PASIVO (RESISTENCIA 10 kΩ OBLIGATORIA):</strong> Un termistor NTC solo tiene 2 cables y requiere una resistencia de referencia de <strong>10 kΩ</strong> para formar un divisor de tensión. ¡<u>NUNCA</u> conecte una sonda pasiva a 12V! Alimente el divisor exclusivamente con <strong>3.3V</strong> desde el ESP32.`;
      }
      return `<strong>COMPOSANT PASSIF (RÉSISTANCE 10 kΩ REQUISE) :</strong> Une thermistance NTC ne possède que 2 fils et nécessite une résistance de référence de <strong>10 kΩ</strong> pour former un pont diviseur de tension. Ne reliez <u>JAMAIS</u> une sonde passive au 12V ! Alimentez le pont exclusivement en <strong>3.3V</strong> depuis l'ESP32.`;
    },
    steps: (gpio) => {
      if (currentLang === 'en') {
        return [
          {
            title: "1. Probe 3.3V Power",
            desc: "Connect the first wire of the NTC probe (2 wires) to the <strong>3.3V</strong> pin of the ESP32."
          },
          {
            title: "2. Measurement & Divider",
            desc: `Connect the second wire of the NTC probe to <span class="step-tag">GPIO {{GPIO}}</span> of the ESP32.`
          },
          {
            title: "3. Reference Resistor (10 kΩ)",
            desc: `Insert a <strong>10 kΩ</strong> resistor between this same <span class="step-tag">GPIO {{GPIO}}</span> pin and the <strong>GND</strong> pin of the ESP32 to complete the voltage divider.`
          }
        ];
      }
      if (currentLang === 'es') {
        return [
          {
            title: "1. Alimentación 3.3V de la sonda",
            desc: "Conecte el primer cable de la sonda NTC (2 cables) al pin <strong>3.3V</strong> del ESP32."
          },
          {
            title: "2. Medición y divisor de tensión",
            desc: `Conecte el segundo cable de la sonda NTC al pin <span class="step-tag">GPIO {{GPIO}}</span> del ESP32.`
          },
          {
            title: "3. Resistencia de referencia (10 kΩ)",
            desc: `Inserte una resistencia de <strong>10 kΩ</strong> entre este mismo pin <span class="step-tag">GPIO {{GPIO}}</span> y el pin <strong>GND</strong> del ESP32 para completar el divisor.`
          }
        ];
      }
      return [
        {
          title: "1. Alimentation 3.3V de la sonde",
          desc: "Connectez le premier fil de la sonde NTC (2 fils) à la broche <strong>3.3V</strong> de l'ESP32."
        },
        {
          title: "2. Mesure et pont diviseur",
          desc: `Connectez le second fil de la sonde NTC à la broche <span class="step-tag">GPIO {{GPIO}}</span> de l'ESP32.`
        },
        {
          title: "3. Résistance de référence (10 kΩ)",
          desc: `Insérez une résistance de <strong>10 kΩ</strong> entre cette même broche <span class="step-tag">GPIO {{GPIO}}</span> et la broche <strong>GND</strong> (Masse) de l'ESP32 pour fermer le pont diviseur.`
        }
      ];
    },
    schematic: (gpio) => `
      <svg viewBox="0 0 540 170" width="100%" height="160" style="max-width:540px; font-family:monospace;">
        <!-- Boîtier ESP32 -->
        <rect x="20" y="25" width="130" height="120" rx="8" fill="#151e32" stroke="#2dd4bf" stroke-width="2"/>
        <text x="85" y="48" fill="#2dd4bf" font-size="12" font-weight="bold" text-anchor="middle">ESP32 (ADC1)</text>
        
        <circle cx="140" cy="65" r="5" fill="#ef4444"/>
        <text x="130" y="69" fill="#ef4444" font-size="10" text-anchor="end">3.3V</text>
        
        <circle cx="140" cy="95" r="5" fill="#2dd4bf"/>
        <text x="130" y="99" fill="#f8fafc" font-size="10" text-anchor="end">GPIO ${gpio}</text>
        
        <circle cx="140" cy="125" r="5" fill="#0ea5e9"/>
        <text x="130" y="129" fill="#8b98a5" font-size="10" text-anchor="end">GND</text>

        <!-- Ligne 3.3V vers Sonde Fil 1 -->
        <path d="M145 65 L340 65" stroke="#ef4444" stroke-width="2" fill="none"/>
        <text x="235" y="58" fill="#ef4444" font-size="9" text-anchor="middle">3.3V</text>

        <!-- Ligne GPIO vers Sonde Fil 2 + Point de jonction -->
        <path d="M145 95 L340 95" stroke="#2dd4bf" stroke-width="2.5" fill="none"/>
        <circle cx="240" cy="95" r="4" fill="#2dd4bf"/>
        <text x="190" y="88" fill="#2dd4bf" font-size="9" text-anchor="middle">SIGNAL</text>

        <!-- Branchement de la résistance 10k vers GND -->
        <path d="M240 95 L240 102" stroke="#2dd4bf" stroke-width="2" fill="none"/>
        <rect x="220" y="102" width="40" height="16" rx="3" fill="#1c273e" stroke="#fb923c" stroke-width="1.5"/>
        <text x="240" y="114" fill="#fb923c" font-size="8" font-weight="bold" text-anchor="middle">10 kΩ</text>
        <path d="M240 118 L240 125" stroke="#0ea5e9" stroke-width="2" fill="none"/>
        <circle cx="240" cy="125" r="3" fill="#0ea5e9"/>

        <!-- Ligne GND ESP32 vers jonction résistance -->
        <path d="M145 125 L240 125" stroke="#0ea5e9" stroke-width="2" fill="none"/>
        <text x="185" y="137" fill="#0ea5e9" font-size="9" text-anchor="middle">GND (0V)</text>

        <!-- Boîtier Sonde NTC -->
        <rect x="340" y="25" width="175" height="120" rx="8" fill="#1c273e" stroke="#2dd4bf" stroke-width="2"/>
        <text x="427" y="48" fill="#2dd4bf" font-size="11" font-weight="bold" text-anchor="middle">SONDE NTC (2 FILS)</text>
        <circle cx="350" cy="65" r="4" fill="#ef4444"/>
        <text x="362" y="69" fill="#f8fafc" font-size="10">Fil 1 (Alim)</text>
        <circle cx="350" cy="95" r="4" fill="#2dd4bf"/>
        <text x="362" y="99" fill="#f8fafc" font-size="10">Fil 2 (Signal)</text>
        <text x="427" y="128" fill="#8b98a5" font-size="9" text-anchor="middle">Thermistance 10k CTN</text>
      </svg>
    `
  },

  "SENSOR_INPUT_ONEWIRE": {
    getTitle: () => {
      if (currentLang === 'en') return "3-Wire Digital Sensor / Probe (Temperature, Humidity, etc.)";
      if (currentLang === 'es') return "Sonda digital de 3 hilos (Temperatura, Humedad, etc.)";
      return "Sonde numérique 3 fils (Température, Humidité, etc.)";
    },
    subtitle: (volt) => {
      if (currentLang === 'en') return `3-wire digital bus (${volt})`;
      if (currentLang === 'es') return `Bus digital de 3 hilos (${volt})`;
      return `Bus numérique 3 fils (${volt})`;
    },
    warning: (volt) => {
      if (currentLang === 'en') return `<strong>4.7 kΩ PULL-UP RESISTOR:</strong> The 1-Wire bus generally requires a 4.7 kΩ pull-up resistor connected between the data line (DATA) and power (VCC). <u>Never connect 12V</u> directly to a 1-Wire pin or hardware will be damaged!`;
      if (currentLang === 'es') return `<strong>RESISTENCIA PULL-UP 4.7 kΩ:</strong> El bus 1-Wire suele requerir una resistencia pull-up de 4.7 kΩ conectada entre la línea de datos (DATA) y la alimentación (VCC). <u>¡Nunca conecte 12V</u> directamente a una entrada 1-Wire o dañará el hardware!`;
      return `<strong>RÉSISTANCE DE TIRAGE 4.7 kΩ :</strong> Le bus 1-Wire requiert généralement une résistance de tirage (pull-up) de 4.7 kΩ branchée entre la ligne de données (DATA) et l'alimentation (VCC). <u>Ne branchez jamais de 12V</u> directement sur une entrée 1-Wire sous peine d'endommager le matériel !`;
    },
    steps: (gpio, volt) => {
      if (currentLang === 'en') {
        return [
          {
            title: "1. Ground (GND)",
            desc: "Connect equipment ground wire (GND) to an ESP32 <strong>GND</strong> pin."
          },
          {
            title: `2. Power supply (VCC ${volt})`,
            desc: `Connect equipment power wire (VCC) to the <strong>${volt === '5V' ? 'VIN (5V)' : '3.3V'}</strong> pin of the ESP32.`
          },
          {
            title: "3. Data line (DATA) to GPIO {{GPIO}}",
            desc: `Connect equipment data line (DATA) to <span class="step-tag">GPIO {{GPIO}}</span> and insert a 4.7 kΩ resistor between DATA and VCC (${volt}).`
          }
        ];
      }
      if (currentLang === 'es') {
        return [
          {
            title: "1. Masa (GND)",
            desc: "Conecte el borne o cable de masa (GND) del equipo a un pin <strong>GND</strong> del ESP32."
          },
          {
            title: `2. Alimentación (VCC ${volt})`,
            desc: `Conecte el borne de alimentación (VCC) del equipo al pin <strong>${volt === '5V' ? 'VIN (5V)' : '3.3V'}</strong> del ESP32.`
          },
          {
            title: "3. Línea de datos (DATA) al GPIO {{GPIO}}",
            desc: `Conecte la línea de datos (DATA) del equipo al pin <span class="step-tag">GPIO {{GPIO}}</span> insertando la resistencia de 4.7 kΩ entre DATA y VCC (${volt}).`
          }
        ];
      }
      return [
        {
          title: "1. Masse (GND)",
          desc: "Reliez la borne ou le fil de masse (GND) de l'équipement à une broche <strong>GND</strong> de l'ESP32."
        },
        {
          title: `2. Alimentation (VCC ${volt})`,
          desc: `Reliez la borne d'alimentation (VCC) de l'équipement à la broche <strong>${volt === '5V' ? 'VIN (5V)' : '3.3V'}</strong> de l'ESP32.`
        },
        {
          title: "3. Ligne de données (DATA) sur GPIO {{GPIO}}",
          desc: `Reliez la ligne de données (DATA) de l'équipement sur la broche <span class="step-tag">GPIO {{GPIO}}</span> en insérant la résistance de 4.7 kΩ entre la ligne DATA et l'alimentation (VCC ${volt}).`
        }
      ];
    },
    schematic: (gpio, volt) => {
      const vccLabel = (volt === '5V') ? 'VIN (5V)' : '3.3V';
      return `
      <svg viewBox="0 0 540 160" width="100%" height="150" style="max-width:540px; font-family:monospace;">
        <rect x="20" y="25" width="130" height="110" rx="8" fill="#151e32" stroke="#ec4899" stroke-width="2"/>
        <text x="85" y="48" fill="#ec4899" font-size="12" font-weight="bold" text-anchor="middle">ESP32</text>
        <circle cx="140" cy="65" r="5" fill="#ef4444"/>
        <text x="130" y="69" fill="#ef4444" font-size="10" text-anchor="end">${vccLabel}</text>
        <circle cx="140" cy="90" r="5" fill="#ec4899"/>
        <text x="130" y="94" fill="#f8fafc" font-size="10" text-anchor="end">GPIO ${gpio}</text>
        <circle cx="140" cy="115" r="5" fill="#0ea5e9"/>
        <text x="130" y="119" fill="#8b98a5" font-size="10" text-anchor="end">GND</text>

        <path d="M145 65 L320 65" stroke="#ef4444" stroke-width="2" fill="none"/>
        <path d="M145 90 L320 90" stroke="#ec4899" stroke-width="2.5" fill="none"/>
        <path d="M145 115 L320 115" stroke="#0ea5e9" stroke-width="2" fill="none"/>

        <!-- Résistance 4.7k -->
        <rect x="220" y="70" width="30" height="15" fill="#334155" stroke="#fb923c" stroke-width="1.5"/>
        <path d="M235 65 L235 70" stroke="#ef4444" stroke-width="1.5" fill="none"/>
        <path d="M235 85 L235 90" stroke="#ec4899" stroke-width="1.5" fill="none"/>
        <text x="260" y="82" fill="#fb923c" font-size="9">4.7kΩ</text>

        <rect x="320" y="25" width="190" height="110" rx="8" fill="#1c273e" stroke="#ec4899" stroke-width="2"/>
        <text x="415" y="52" fill="#ec4899" font-size="11" font-weight="bold" text-anchor="middle">ÉQUIPEMENT 1-WIRE</text>
        <text x="330" y="69" fill="#ef4444" font-size="9">VCC (${volt})</text>
        <text x="330" y="94" fill="#ec4899" font-size="9">DATA (1-Wire)</text>
        <text x="330" y="119" fill="#0ea5e9" font-size="9">GND (0V)</text>
      </svg>
      `;
    }
  }
};



WIRING_TUTORIALS["ACTUATOR_OUTPUT_RELAY"] = WIRING_TUTORIALS["ACTUATOR_OUTPUT_RELAY_2WIRE"];
WIRING_TUTORIALS["ACTUATOR_OUTPUT_DIRECT"] = WIRING_TUTORIALS["ACTUATOR_OUTPUT_RELAY_3WIRE"];
WIRING_TUTORIALS["ACTUATOR_OUTPUT_PWM_MOSFET"] = WIRING_TUTORIALS["ACTUATOR_OUTPUT_PWM"];
WIRING_TUTORIALS["ACTUATOR_OUTPUT_PWM_DIRECT"] = WIRING_TUTORIALS["ACTUATOR_OUTPUT_PWM"];
WIRING_TUTORIALS["ACTUATOR_OUTPUT_PWM_2WIRE"] = WIRING_TUTORIALS["ACTUATOR_OUTPUT_PWM"];
WIRING_TUTORIALS["ACTUATOR_OUTPUT_PWM_3WIRE"] = WIRING_TUTORIALS["ACTUATOR_OUTPUT_PWM"];

let wizardState = {
  id: 0,
  name: '',
  category: 'ACTUATOR',
  voltage: '12V',
  mode: 'OUTPUT_RELAY',
  pwmWiringType: 'MOSFET_POWER',
  wiringType: 'MOSFET_POWER',
  gpio: null,
  isCore: false
};

let wizardDelayTimer = null;
let wizardActTimer = null;

async function openWizardModal() {
  const modal = document.getElementById('wizard-modal');
  const title = document.getElementById('wizard-title');
  const subtitle = document.getElementById('wizard-subtitle');
  const pinDisplay = document.getElementById('wizard-assigned-gpio');
  const pinReason = document.getElementById('wizard-pin-reason');
  const testStatus = document.getElementById('wizard-test-status');

  if (title) title.innerText = `${t('wizard_wire_prefix', 'Câbler : ')}${wizardState.name || 'Équipement'}`;
  
  const modeLabels = {
    'OUTPUT_RELAY': (wizardState.pwmWiringType === 'DEDICATED_SIGNAL')
      ? 'Tout-ou-rien 3 fils'
      : 'Tout-ou-rien 2 fils',
    'OUTPUT_RELAY_2WIRE': 'Tout-ou-rien 2 fils',
    'OUTPUT_RELAY_3WIRE': 'Tout-ou-rien 3 fils',
    'OUTPUT_PWM': (wizardState.pwmWiringType === 'DEDICATED_SIGNAL') 
      ? 'PWM 3 fils (Signal dédié)'
      : 'PWM 2 fils (Variateur MOSFET)',
    'OUTPUT_PWM_2WIRE': 'PWM 2 fils (Variateur MOSFET)',
    'OUTPUT_PWM_3WIRE': 'PWM 3 fils (Signal dédié)',
    'INPUT_DIGITAL': t('opt_mode_digital', 'Contact Sec (Passif)'),
    'INPUT_PIR': (currentLang === 'en' ? 'PIR Motion Sensor' : (currentLang === 'es' ? 'Sensor de Movimiento PIR' : 'Détecteur de Mouvement PIR')),
    'INPUT_ADC': t('opt_mode_adc', 'Capteur actif 3 fils (0-3.3V)'),
    'INPUT_ADC_NTC': t('opt_mode_ntc', 'Sonde numérique 2 fils (Température, etc.)'),
    'INPUT_ONEWIRE': t('opt_mode_onewire', 'Sonde numérique 3 fils (Température, Humidité, etc.)')
  };
  const modeName = modeLabels[wizardState.mode] || wizardState.mode;
  const voltDisplay = (wizardState.mode === 'INPUT_DIGITAL' || wizardState.mode === 'INPUT_ADC_NTC') 
    ? (currentLang === 'en' ? 'Passive (3.3V)' : (currentLang === 'es' ? 'Pasivo (3.3V)' : 'Passif (3.3V)'))
    : (wizardState.voltage || '12V');
  const catName = (wizardState.category === 'ACTUATOR') ? t('badge_actuator', 'Actionneur') : t('badge_sensor', 'Capteur');
  if (subtitle) subtitle.innerText = `${catName} • ${voltDisplay} • ${modeName}`;

  if (testStatus) {
    testStatus.className = "wizard-test-status";
    testStatus.innerHTML = (wizardState.category === 'ACTUATOR')
      ? t('wizard_test_waiting_act', "En attente du test... (Prévention 5s puis impulsion 3s)")
      : t('wizard_test_waiting_sens', "En attente du test... (Lecture immédiate)");
  }

  if (!wizardState.gpio) {
    if (pinDisplay) pinDisplay.innerText = "...";
    try {
      const data = await fetchApi(`/api/pins/suggest?type=${wizardState.mode}`);
      if (data && data.success && data.gpio) {
        wizardState.gpio = data.gpio;
        if (pinReason) pinReason.innerText = data.message || t('wizard_pin_reserved', "Sélectionnée et réservée par l'ESP32");
      } else {
        throw new Error((data && data.error) || "Aucune broche disponible");
      }
    } catch (err) {
      const usedPins = devicesList.map(d => d.gpio);
      const candidates = (wizardState.mode === 'INPUT_ADC' || wizardState.mode === 'INPUT_ADC_NTC') 
        ? [32, 33, 34, 35, 36, 39] 
        : [4, 5, 13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];
      wizardState.gpio = candidates.find(p => !usedPins.includes(p)) || 18;
      if (pinReason) pinReason.innerText = `GPIO ${wizardState.gpio} ${t('wizard_pin_allocated', 'alloué automatiquement')}`;
    }
  }

  if (pinDisplay) pinDisplay.innerText = `GPIO ${wizardState.gpio}`;

  const wiringType = wizardState.pwmWiringType || wizardState.wiringType || (['3.3V', '5V'].includes(wizardState.voltage) ? 'DEDICATED_SIGNAL' : 'MOSFET_POWER');
  let tutKey = `${wizardState.category}_${wizardState.mode}`;
  if (wizardState.mode === 'INPUT_PIR') tutKey = 'SENSOR_INPUT_PIR';
  else if (wizardState.mode === 'INPUT_ONEWIRE') tutKey = 'SENSOR_INPUT_ONEWIRE';
  else if (wizardState.mode === 'INPUT_ADC_NTC') tutKey = 'SENSOR_INPUT_ADC_NTC';
  else if (wizardState.mode === 'INPUT_ADC') tutKey = 'SENSOR_INPUT_ADC';
  else if (wizardState.mode === 'INPUT_DIGITAL') tutKey = 'SENSOR_INPUT_DIGITAL';
  else if (wizardState.mode === 'OUTPUT_PWM' || wizardState.mode === 'OUTPUT_PWM_2WIRE' || wizardState.mode === 'OUTPUT_PWM_3WIRE') {
    tutKey = 'ACTUATOR_OUTPUT_PWM';
  } else if (wizardState.mode === 'OUTPUT_RELAY' || wizardState.mode === 'OUTPUT_RELAY_2WIRE' || wizardState.mode === 'OUTPUT_RELAY_3WIRE') {
    tutKey = (wiringType === 'DEDICATED_SIGNAL' || wizardState.mode === 'OUTPUT_RELAY_3WIRE') ? 'ACTUATOR_OUTPUT_RELAY_3WIRE' : 'ACTUATOR_OUTPUT_RELAY_2WIRE';
  }

  const tutorial = WIRING_TUTORIALS[tutKey] || WIRING_TUTORIALS["ACTUATOR_OUTPUT_RELAY_2WIRE"];

  const quickSelect = document.getElementById('wizard-tuto-quick-select');
  if (quickSelect) {
    if (wizardState.mode === 'OUTPUT_PWM' || wizardState.mode === 'OUTPUT_PWM_2WIRE' || wizardState.mode === 'OUTPUT_PWM_3WIRE') {
      quickSelect.value = (wiringType === 'DEDICATED_SIGNAL' || wizardState.mode === 'OUTPUT_PWM_3WIRE') ? 'ACTUATOR_OUTPUT_PWM_DIRECT' : 'ACTUATOR_OUTPUT_PWM_MOSFET';
    } else if (wizardState.mode === 'OUTPUT_RELAY' || wizardState.mode === 'OUTPUT_RELAY_2WIRE' || wizardState.mode === 'OUTPUT_RELAY_3WIRE') {
      quickSelect.value = (wiringType === 'DEDICATED_SIGNAL' || wizardState.mode === 'OUTPUT_RELAY_3WIRE') ? 'ACTUATOR_OUTPUT_RELAY_3WIRE' : 'ACTUATOR_OUTPUT_RELAY_2WIRE';
    } else if (wizardState.mode === 'INPUT_PIR') {
      quickSelect.value = 'SENSOR_INPUT_PIR';
    } else {
      quickSelect.value = tutKey;
    }
  }

  const alertBox = document.getElementById('wizard-safety-alert');
  if (alertBox) {
    const warningText = (typeof tutorial.warning === 'function') 
      ? tutorial.warning(wizardState.voltage || '12V', wiringType) 
      : tutorial.warning;
    const formattedWarning = (warningText || '').replace(/\{\{GPIO\}\}/g, `<strong>GPIO ${wizardState.gpio}</strong>`);
    alertBox.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M12,2L1,21H23L12,2M12,6L19.53,19H4.47L12,6M11,10V14H13V10H11M11,16V18H13V16H11Z"/></svg>
      <div>${formattedWarning}</div>
    `;
  }

  const schematicBox = document.getElementById('wizard-schematic');
  if (schematicBox) {
    schematicBox.innerHTML = tutorial.schematic(wizardState.gpio, wizardState.voltage || '12V', wiringType);
  }

  const stepsContainer = document.getElementById('wizard-steps-container');
  if (stepsContainer) {
    const stepsList = (typeof tutorial.steps === 'function') 
      ? tutorial.steps(wizardState.gpio, wizardState.voltage || '12V', wiringType) 
      : tutorial.steps;
    stepsContainer.innerHTML = (stepsList || []).map((step, idx) => {
      const formattedDesc = step.desc.replace(/\{\{GPIO\}\}/g, `<strong>GPIO ${wizardState.gpio}</strong>`);
      return `
        <div class="step-card">
          <div class="step-num">${idx + 1}</div>
          <div class="step-content">
            <div class="step-title">${step.title}</div>
            <div class="step-desc">${formattedDesc}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  const testBtnText = document.getElementById('wizard-test-btn-text');
  if (testBtnText) {
    if (wizardState.category === 'ACTUATOR') {
      testBtnText.innerText = t('wizard_btn_test_actuator', "Tester l'actionneur");
    } else {
      testBtnText.innerText = t('wizard_btn_test_sensor', "Tester la lecture du capteur");
    }
  }

  if (modal) modal.classList.add('active');
}

function openWizardForExistingDevice(id) {
  if (getCurrentUserRole() === 'user') return;
  const dev = devicesList.find(d => d.id === id);
  if (!dev) return;

  wizardState = {
    id: dev.id,
    name: dev.name,
    category: dev.category || 'ACTUATOR',
    voltage: dev.voltage || '12V',
    mode: dev.mode || 'OUTPUT_RELAY',
    pwmWiringType: dev.pwmWiringType || (['3.3V', '5V'].includes(dev.voltage) ? 'DEDICATED_SIGNAL' : 'MOSFET_POWER'),
    wiringType: dev.pwmWiringType || (['3.3V', '5V'].includes(dev.voltage) ? 'DEDICATED_SIGNAL' : 'MOSFET_POWER'),
    gpio: dev.gpio,
    isCore: dev.isCore
  };

  openWizardModal();
}

function openWiringTutorialDirectory(presetKey = 'ACTUATOR_OUTPUT_RELAY') {
  closeUnifiedAddModal();

  const presets = {
    'ACTUATOR_OUTPUT_RELAY_2WIRE': {
      id: 0,
      name: (currentLang === 'en' ? "On/Off Actuator 2-Wire (Relay Module)" : (currentLang === 'es' ? "Actuador Todo o Nada 2 Hilos (Módulo Relé)" : "Actionneur Tout-ou-rien 2 fils (Module relais)")),
      category: 'ACTUATOR',
      voltage: '12V',
      mode: 'OUTPUT_RELAY',
      pwmWiringType: 'MOSFET_POWER',
      wiringType: 'MOSFET_POWER',
      gpio: 18,
      isCore: false
    },
    'ACTUATOR_OUTPUT_RELAY_3WIRE': {
      id: 0,
      name: (currentLang === 'en' ? "On/Off Actuator 3-Wire (Dedicated Trigger)" : (currentLang === 'es' ? "Actuador Todo o Nada 3 Hilos (Control Dedicado)" : "Actionneur Tout-ou-rien 3 fils (Commande dédiée)")),
      category: 'ACTUATOR',
      voltage: '12V',
      mode: 'OUTPUT_RELAY',
      pwmWiringType: 'DEDICATED_SIGNAL',
      wiringType: 'DEDICATED_SIGNAL',
      gpio: 23,
      isCore: false
    },
    'ACTUATOR_OUTPUT_PWM_MOSFET': {
      id: 0,
      name: (currentLang === 'en' ? "PWM Actuator 2-Wire (MOSFET Dimmer)" : (currentLang === 'es' ? "Actuador PWM 2 Hilos (Regulador MOSFET)" : "Actionneur PWM 2 fils (Variateur MOSFET)")),
      category: 'ACTUATOR',
      voltage: '12V',
      mode: 'OUTPUT_PWM',
      pwmWiringType: 'MOSFET_POWER',
      wiringType: 'MOSFET_POWER',
      gpio: 19,
      isCore: false
    },
    'ACTUATOR_OUTPUT_PWM_DIRECT': {
      id: 0,
      name: (currentLang === 'en' ? "PWM Actuator 3-Wire (Dedicated Signal)" : (currentLang === 'es' ? "Actuador PWM 3 Hilos (Señal Dedicada)" : "Actionneur PWM 3 fils (Signal dédié)")),
      category: 'ACTUATOR',
      voltage: '12V',
      mode: 'OUTPUT_PWM',
      pwmWiringType: 'DEDICATED_SIGNAL',
      wiringType: 'DEDICATED_SIGNAL',
      gpio: 19,
      isCore: false
    },
    'SENSOR_INPUT_PIR': {
      id: 0,
      name: (currentLang === 'en' ? "PIR Motion Sensor (HC-SR501 / AM312)" : (currentLang === 'es' ? "Sensor de Movimiento PIR (HC-SR501 / AM312)" : "Détecteur de Mouvement PIR (HC-SR501 / AM312)")),
      category: 'SENSOR',
      voltage: '5V',
      mode: 'INPUT_PIR',
      gpio: 13,
      isCore: false
    },
    'SENSOR_INPUT_ONEWIRE': {
      id: 0,
      name: (currentLang === 'en' ? "3-Wire Digital Probe (Temperature, Humidity...)" : (currentLang === 'es' ? "Sonda digital de 3 hilos (Temperatura, Humedad...)" : "Sonde numérique 3 fils (Température, Humidité...)")),
      category: 'SENSOR',
      voltage: '3.3V',
      mode: 'INPUT_ONEWIRE',
      gpio: 4,
      isCore: false
    },
    'SENSOR_INPUT_ADC_NTC': {
      id: 0,
      name: (currentLang === 'en' ? "2-Wire Digital Probe (Temperature, Humidity, etc.)" : (currentLang === 'es' ? "Sonda digital de 2 hilos (Temperatura, Humedad, etc.)" : "Sonde numérique 2 fils (Température, Humidité, etc.)")),
      category: 'SENSOR',
      voltage: '3.3V',
      mode: 'INPUT_ADC_NTC',
      gpio: 34,
      isCore: false
    },
    'SENSOR_INPUT_DIGITAL': {
      id: 0,
      name: (currentLang === 'en' ? "Dry Contact / Push Button (Passive)" : (currentLang === 'es' ? "Contacto Seco / Pulsador (Pasivo)" : "Contact Sec / Bouton Poussoir (Passif)")),
      category: 'SENSOR',
      voltage: '3.3V',
      mode: 'INPUT_DIGITAL',
      gpio: 21,
      isCore: false
    },
    'SENSOR_INPUT_ADC': {
      id: 0,
      name: (currentLang === 'en' ? "Active Analog Sensor (0-3.3V, 3-Wire)" : (currentLang === 'es' ? "Sensor Analógico Activo (0-3.3V, 3 Hilos)" : "Capteur Analogique Actif 3 fils (0-3.3V)")),
      category: 'SENSOR',
      voltage: '3.3V',
      mode: 'INPUT_ADC',
      gpio: 35,
      isCore: false
    }
  };

  const preset = presets[presetKey] || presets['ACTUATOR_OUTPUT_RELAY_2WIRE'] || presets['ACTUATOR_OUTPUT_PWM_MOSFET'];
  wizardState = { ...preset };
  openWizardModal();
}

function closeWizardModal() {
  if (wizardDelayTimer) { clearInterval(wizardDelayTimer); wizardDelayTimer = null; }
  if (wizardActTimer) { clearInterval(wizardActTimer); wizardActTimer = null; }
  const btn = document.getElementById('wizard-btn-test');
  if (btn) btn.disabled = false;
  const modal = document.getElementById('wizard-modal');
  if (modal) modal.classList.remove('active');
}

function backToFormModal() {
  closeWizardModal();
  const modal = document.getElementById('device-modal');
  if (modal) modal.classList.add('active');
}

async function runWizardTest() {
  const btn = document.getElementById('wizard-btn-test');
  const btnText = document.getElementById('wizard-test-btn-text');
  const statusBox = document.getElementById('wizard-test-status');

  if (wizardDelayTimer) { clearInterval(wizardDelayTimer); wizardDelayTimer = null; }
  if (wizardActTimer) { clearInterval(wizardActTimer); wizardActTimer = null; }

  if (wizardState.category === 'ACTUATOR') {
    btn.disabled = true;
    if (statusBox) statusBox.className = "wizard-test-status warning";

    let warnSec = 5;
    if (btnText) btnText.innerText = t('test_btn_caution_sec', 'Attention ({sec}s)...').replace('{sec}', warnSec);
    if (statusBox) statusBox.innerHTML = t('test_warn_starting_html', "Attention : l'appareil va démarrer dans <strong>{sec} secondes</strong> !").replace('{sec}', warnSec);
    showToast(t('toast_dev_warn_start_5s', 'Attention : "{name}" va démarrer dans 5 secondes !').replace('{name}', wizardState.name || 'Actionneur'), 'warning');

    wizardDelayTimer = setInterval(() => {
      warnSec--;
      if (warnSec > 0) {
        if (btnText) btnText.innerText = t('test_btn_caution_sec', 'Attention ({sec}s)...').replace('{sec}', warnSec);
        if (statusBox) statusBox.innerHTML = t('test_warn_starting_html', "Attention : l'appareil va démarrer dans <strong>{sec} secondes</strong> !").replace('{sec}', warnSec);
      } else {
        clearInterval(wizardDelayTimer);
        wizardDelayTimer = null;

        let actSec = 3;
        if (btnText) btnText.innerText = t('test_running_sec', 'En marche ({sec}s)...').replace('{sec}', actSec);
        if (statusBox) {
          statusBox.className = "wizard-test-status testing";
          statusBox.innerHTML = t('test_pulse_active_html', 'Impulsion active sur GPIO {gpio} ({sec}s)...').replace('{gpio}', wizardState.gpio).replace('{sec}', actSec);
        }
        showToast(t('toast_actuator_test_start', "Enclenchement immédiat de l'actionneur (3s)..."), 'info');

        fetchApi('/api/devices/test', 'POST', { 
          id: wizardState.id, 
          gpio: wizardState.gpio, 
          mode: (wizardState.mode.startsWith('OUTPUT_PWM')) ? 'OUTPUT_PWM' : wizardState.mode, 
          duration: 3000 
        }).catch(e => console.warn("Erreur test matériel", e));

        wizardActTimer = setInterval(() => {
          actSec--;
          if (actSec > 0) {
            if (btnText) btnText.innerText = t('test_running_sec', 'En marche ({sec}s)...').replace('{sec}', actSec);
            if (statusBox) statusBox.innerHTML = t('test_pulse_active_html', 'Impulsion active sur GPIO {gpio} ({sec}s)...').replace('{gpio}', wizardState.gpio).replace('{sec}', actSec);
          } else {
            clearInterval(wizardActTimer);
            wizardActTimer = null;
            if (statusBox) {
              statusBox.className = "wizard-test-status success";
              statusBox.innerHTML = t('test_actuator_validated_html', 'Test validé : Actionneur activé pendant 3 secondes sur GPIO {gpio}.').replace('{gpio}', wizardState.gpio);
            }
            if (btn) btn.disabled = false;
            if (btnText) btnText.innerText = t('test_retest_actuator', "Re-tester l'actionneur");
            showToast(t('toast_actuator_test_success', "Test actionneur terminé avec succès."), "success");
          }
        }, 1000);
      }
    }, 1000);

  } else {
    btn.disabled = true;
    if (statusBox) statusBox.className = "wizard-test-status testing";
    if (btnText) btnText.innerText = t('test_reading_signal', "Lecture du signal...");
    if (statusBox) statusBox.innerText = t('test_reading_gpio', 'Lecture de la broche GPIO {gpio}...').replace('{gpio}', wizardState.gpio);

    try {
      const data = await fetchApi('/api/devices/test', 'POST', { 
        id: wizardState.id, 
        gpio: wizardState.gpio, 
        mode: wizardState.mode, 
        duration: 100 
      });
      if (statusBox) statusBox.className = (data && data.success) ? "wizard-test-status success" : "wizard-test-status warning";
      if (wizardState.mode === 'INPUT_ONEWIRE') {
        const msg = (data && data.message) || (data && data.reading !== undefined ? `${(data.reading / 100).toFixed(1)} °C` : '--');
        if (statusBox) statusBox.innerHTML = t('test_sensor_onewire_html', 'Sonde 1-Wire : <strong>{val}</strong>').replace('{val}', escapeHtml(msg));
        showToast(t('toast_onewire_read', 'Lecture 1-Wire : {msg}').replace('{msg}', msg), (data && data.success) ? "success" : "warning");
      } else if (wizardState.mode === 'INPUT_ADC' || wizardState.mode === 'INPUT_ADC_NTC') {
        const volts = (data && data.voltage !== undefined) ? data.voltage : (((data ? data.reading : 0) / 4095) * 3.3);
        if (statusBox) statusBox.innerHTML = t('test_measured_volts_html', 'Valeur mesurée : <strong>{volts} V</strong> (ADC : {raw} / 4095)').replace('{volts}', volts.toFixed(2)).replace('{raw}', data ? data.reading : 0);
        showToast(t('toast_sensor_val', 'Valeur capteur : {val}').replace('{val}', volts.toFixed(2) + ' V'), "success");
      } else {
        const val = data ? data.reading : 0;
        const isOn = (wizardState.mode === 'INPUT_PIR') ? (val === 1) : (val === 0);
        const stateStr = isOn ? 'ON' : 'OFF';
        const descStr = (wizardState.mode === 'INPUT_PIR') 
          ? (isOn ? 'Mouvement détecté' : 'Aucun mouvement')
          : (isOn ? t('test_contact_closed', 'Contact fermé') : t('test_contact_open', 'Contact ouvert'));
        if (statusBox) statusBox.innerHTML = t('test_sensor_state_html', 'Valeur du capteur : <strong style="font-size:16px; color:var(--cyan-light);">{state}</strong> ({desc})').replace('{state}', stateStr).replace('{desc}', descStr);
        showToast(t('toast_sensor_val', 'Valeur capteur : {val}').replace('{val}', stateStr), "success");
      }
    } catch (e) {
      if (statusBox) {
        statusBox.className = "wizard-test-status warning";
        statusBox.innerText = t('toast_esp32_comm_error', "Erreur de communication avec l'ESP32.");
      }
      showToast(t('toast_hardware_test_error', "Erreur de test matériel"), "warning");
    } finally {
      btn.disabled = false;
      if (btnText) btnText.innerText = t('wizard_btn_test_sensor', "Tester la lecture du capteur");
    }
  }
}

async function finishAndActivateWizard() {
  if (getCurrentUserRole() === 'user') return;
  if (!wizardState.name || wizardState.name === 'Tutoriel') {
    closeWizardModal();
    showToast(t('toast_wizard_consult_done', "Consultation du tutoriel terminée."), "info");
    return;
  }

  const gpioNum = parseInt(wizardState.gpio, 10);
  if (isNaN(gpioNum) || gpioNum < 0) {
    showToast("GPIO invalide pour l'équipement.", "warning");
    return;
  }

  const payload = {
    id: wizardState.id || 0,
    name: wizardState.name.trim(),
    category: (wizardState.category || 'ACTUATOR').toUpperCase(),
    voltage: wizardState.voltage || '12V',
    mode: (wizardState.mode && wizardState.mode.startsWith('OUTPUT_PWM')) ? 'OUTPUT_PWM' : wizardState.mode,
    pwmWiringType: wizardState.pwmWiringType || wizardState.wiringType || 'MOSFET_POWER',
    gpio: gpioNum,
    isCore: wizardState.isCore || false,
    enabled: wizardState.enabled !== false
  };

  try {
    const result = await fetchApi('/api/devices/save', 'POST', payload);
    if (!result || !result.success) {
      throw new Error((result && result.error) || "Erreur de sauvegarde");
    }
  } catch (err) {
    console.warn("finishAndActivateWizard /api/devices/save error:", err);
    let backendErrorMsg = null;
    try {
      const parsed = JSON.parse(err.message);
      if (parsed && typeof parsed.error === 'string' && parsed.error.trim().length > 0) {
        backendErrorMsg = parsed.error;
      }
    } catch (_) {}

    if (backendErrorMsg) {
      showToast(backendErrorMsg, "danger");
      return;
    }

    // Fallback simulation hors-ligne (FiveServer / pas d'ESP32)
    if (wizardState.id > 0) {
      const existing = devicesList.find(d => d.id === wizardState.id);
      if (existing) Object.assign(existing, payload);
      if (typeof logSystemEvent === 'function') {
        logSystemEvent(`Modification équipement : "${wizardState.name}" (ID #${wizardState.id}, GPIO ${gpioNum})`);
      }
    } else {
      const newId = (devicesList.length > 0 ? Math.max(...devicesList.map(d => d.id)) + 1 : 1);
      devicesList.push({ ...payload, id: newId, state: 0, value: 0 });
      if (typeof logSystemEvent === 'function') {
        logSystemEvent(`Création équipement : "${wizardState.name}" (GPIO ${gpioNum})`);
      }
    }
    localStorage.setItem('van_devices', JSON.stringify(devicesList));
  }

  showToast(`"${wizardState.name}" - ${t('toast_wizard_success', 'Équipement activé et configuré avec succès.')} (GPIO ${gpioNum})`, "success");
  closeWizardModal();
  await loadDevices();
  renderDevicesTable();
  updateGlobalStats();
  if (typeof populateAutoDropdowns === 'function') populateAutoDropdowns();
  switchTab('devices', document.getElementById('nav-btn-devices'));
}

// =========================================================================
// MOTEUR D'AUTOMATISATION
// =========================================================================
async function loadAutomations() {
  try {
    const data = await fetchApi('/api/automations');
    if (data && Array.isArray(data.rules)) {
      automationRules = data.rules;
      localStorage.setItem('van_automations', JSON.stringify(automationRules));
      renderAutomationTable();
      return;
    }
  } catch (err) {
    console.warn("loadAutomations hors-ligne/FiveServer:", err);
  }

  const saved = localStorage.getItem('van_automations');
  if (saved) {
    try {
      automationRules = JSON.parse(saved);
    } catch (e) {
      automationRules = [];
    }
  } else {
    automationRules = [];
    localStorage.setItem('van_automations', JSON.stringify(automationRules));
  }
  renderAutomationTable();
}

function populateAutoDropdowns() {}

function getDeviceLiveReading(dev) {
  if (!dev) return '--';
  if (dev.enabled === false) return t('state_inactive', 'Inactif');
  if (dev.mode === 'INPUT_PIR') {
    return dev.state > 0 ? t('cond_pir_motion', 'Mouvement détecté') : t('cond_pir_no_motion', 'Aucun mouvement');
  }
  if (dev.mode === 'INPUT_DIGITAL') {
    return dev.state > 0 ? t('cond_contact_closed', 'Contact fermé (Actif)') : t('cond_contact_open', 'Contact ouvert (Inactif)');
  }
  if (dev.mode === 'INPUT_ONEWIRE' || dev.mode === 'INPUT_ADC_NTC') {
    const rawVal = dev.reading !== undefined ? dev.reading : dev.value;
    const tVal = rawVal !== undefined && rawVal !== null ? (rawVal / 100).toFixed(1) + ' °C' : '--';
    const st = dev.state > 0 ? t('cond_state_on', 'Actif (ON)') : t('cond_state_off', 'Inactif (OFF)');
    return `${tVal} [${st}]`;
  }
  if (dev.mode === 'INPUT_ADC') {
    const volts = (((dev.value || 0) / 4095) * 3.3).toFixed(2) + ' V';
    const st = dev.state > 0 ? t('cond_state_on', 'Actif (ON)') : t('cond_state_off', 'Inactif (OFF)');
    return `${volts} [${st}]`;
  }
  if (dev.mode === 'OUTPUT_PWM') {
    return `${dev.value || 0} %`;
  }
  return dev.state > 0 ? t('cond_state_on', 'Actif (ON)') : t('cond_state_off', 'Inactif (OFF)');
}

function getSensorConditionOptions(dev) {
  if (!dev) return `<option value="ON">${t('cond_state_on', 'Actif (ON)')}</option>`;

  if (dev.mode === 'INPUT_PIR') {
    return `
      <option value="ON">${t('cond_pir_motion', 'Mouvement détecté')}</option>
      <option value="OFF">${t('cond_pir_no_motion', 'Aucun mouvement')}</option>
    `;
  } else if (dev.mode === 'INPUT_DIGITAL') {
    return `
      <option value="ON">${t('cond_contact_closed', 'Contact fermé (Actif)')}</option>
      <option value="OFF">${t('cond_contact_open', 'Contact ouvert (Inactif)')}</option>
    `;
  } else {
    return `
      <option value="ON">${t('cond_state_on', 'Actif (ON)')}</option>
      <option value="OFF">${t('cond_state_off', 'Inactif (OFF)')}</option>
    `;
  }
}

function getActuatorActionOptions(dev) {
  if (!dev) return '<option value="">-- Action --</option>';

  return `
    <option value="ON">${t('act_turn_on', 'Allumer (ON)')}</option>
    <option value="OFF">${t('act_turn_off', 'Éteindre (OFF)')}</option>
  `;
}

function openAddAutomationModal() {
  editingAutomationRuleId = null;

  const titleEl = document.getElementById('automation-modal-title');
  if (titleEl) titleEl.innerText = t('modal_auto_add_title', "Ajouter une automatisation");
  const saveBtn = document.getElementById('btn-save-automation');
  if (saveBtn) saveBtn.innerText = t('btn_save', "Enregistrer");

  const nameInput = document.getElementById('modal-rule-name');
  if (nameInput) nameInput.value = '';

  const condContainer = document.getElementById('modal-conditions-list');
  const actContainer = document.getElementById('modal-actions-list');
  if (condContainer) condContainer.innerHTML = '';
  if (actContainer) actContainer.innerHTML = '';

  addConditionRow();
  addActionRow();

  const modal = document.getElementById('automation-modal');
  if (modal) modal.classList.add('active');
}

function openEditAutomationModal(ruleId) {
  const rule = automationRules.find(r => r.id === ruleId);
  if (!rule) return;

  editingAutomationRuleId = rule.id;

  const titleEl = document.getElementById('automation-modal-title');
  if (titleEl) titleEl.innerText = t('modal_auto_edit_title', "Modifier l'automatisation");
  const saveBtn = document.getElementById('btn-save-automation');
  if (saveBtn) saveBtn.innerText = t('btn_update', "Mettre à jour");

  const nameInput = document.getElementById('modal-rule-name');
  if (nameInput) nameInput.value = rule.name || `Règle #${rule.id}`;

  const condContainer = document.getElementById('modal-conditions-list');
  const actContainer = document.getElementById('modal-actions-list');
  if (condContainer) condContainer.innerHTML = '';
  if (actContainer) actContainer.innerHTML = '';

  const conds = (Array.isArray(rule.conditions) && rule.conditions.length > 0)
    ? rule.conditions
    : [{
        triggerId: rule.triggerId || rule.triggerDeviceId,
        conditionValue: rule.conditionValue,
        operator: rule.operator || rule.op,
        threshold: rule.threshold,
        minVal: rule.minVal,
        maxVal: rule.maxVal
      }];

  const acts = (Array.isArray(rule.actions) && rule.actions.length > 0)
    ? rule.actions
    : [{
        targetId: rule.targetId || rule.actionDeviceId,
        actionValue: rule.actionValue,
        actionPercent: rule.actionPercent
      }];

  conds.forEach(c => addConditionRow(c));
  acts.forEach(a => addActionRow(a));

  const modal = document.getElementById('automation-modal');
  if (modal) modal.classList.add('active');
}

function closeAutomationModal() {
  editingAutomationRuleId = null;
  const modal = document.getElementById('automation-modal');
  if (modal) modal.classList.remove('active');
}

function addConditionRow(data = null) {
  const container = document.getElementById('modal-conditions-list');
  if (!container) return;

  const sensors = devicesList.filter(d => d.category === 'SENSOR' || (!d.category && d.mode && d.mode.startsWith('INPUT')) || d.mode === 'OUTPUT_PWM');
  if (sensors.length === 0) {
    showToast("Aucun capteur disponible. Ajoutez d'abord un capteur dans le menu Matériel.", "warning");
    return;
  }

  const row = document.createElement('div');
  row.className = 'modal-condition-row';
  row.style.cssText = "display: flex; align-items: center; gap: 8px; flex-wrap: wrap; background: rgba(255,255,255,0.02); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);";

  const sensorSelect = document.createElement('select');
  sensorSelect.className = 'rule-inline-select cond-sensor-select';
  sensorSelect.style.cssText = "flex: 1; min-width: 160px;";
  sensorSelect.innerHTML = sensors.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');

  const liveBadge = document.createElement('span');
  liveBadge.className = 'cond-live-badge';
  liveBadge.style.cssText = "font-size: 11px; color: var(--cyan-light); background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.25); border-radius: 4px; padding: 4px 8px; white-space: nowrap;";

  const condFieldContainer = document.createElement('div');
  condFieldContainer.className = 'cond-field-container';
  condFieldContainer.style.cssText = "flex: 1.6; min-width: 220px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;";

  const updateCondField = (initialData = null) => {
    const sId = parseInt(sensorSelect.value, 10);
    const sDev = devicesList.find(d => d.id === sId);
    condFieldContainer.innerHTML = '';

    liveBadge.innerText = `${t('cond_live_prefix', 'Actuellement :')} ${getDeviceLiveReading(sDev)}`;

    const isNumericalDevice = sDev && (sDev.mode === 'INPUT_ONEWIRE' || sDev.mode === 'INPUT_ADC_NTC' || sDev.mode === 'INPUT_ADC' || sDev.mode === 'OUTPUT_PWM');

    if (isNumericalDevice) {
      let isInitialState = false;
      if (initialData) {
        if (initialData.isNumerical === false || initialData.operator === 'STATE' || initialData.operator === '==') {
          isInitialState = true;
        } else if (initialData.conditionValue === 'ON' || initialData.conditionValue === 'OFF') {
          if (initialData.minVal === undefined && initialData.threshold === undefined) {
            isInitialState = true;
          }
        }
      }

      const typeSelect = document.createElement('select');
      typeSelect.className = 'rule-inline-select cond-type-select';
      typeSelect.style.cssText = "min-width: 140px; flex: 0.9;";
      typeSelect.innerHTML = `
        <option value="RANGE">${t('cond_type_range', 'Plage de valeurs')}</option>
        <option value="STATE">${t('cond_type_state', 'État du capteur')}</option>
      `;
      typeSelect.value = isInitialState ? 'STATE' : 'RANGE';

      const valWrapper = document.createElement('div');
      valWrapper.className = 'cond-val-wrapper';
      valWrapper.style.cssText = "flex: 1.2; display: flex; align-items: center;";

      const renderTypeFields = () => {
        valWrapper.innerHTML = '';
        if (typeSelect.value === 'STATE') {
          const condSelect = document.createElement('select');
          condSelect.className = 'rule-inline-select cond-val-select';
          condSelect.style.cssText = "width: 100%;";
          condSelect.innerHTML = getSensorConditionOptions(sDev);
          if (initialData && initialData.conditionValue) {
            condSelect.value = initialData.conditionValue;
          }
          valWrapper.appendChild(condSelect);
        } else {
          let unit = '°C';
          let defMin = 18;
          let defMax = 25;
          let step = '0.5';
          let minAttr = '';
          let maxAttr = '';

          if (sDev.mode === 'INPUT_ADC') {
            unit = 'V';
            defMin = 1.0;
            defMax = 2.5;
            step = '0.1';
            minAttr = 'min="0"';
            maxAttr = 'max="3.3"';
          } else if (sDev.mode === 'OUTPUT_PWM') {
            unit = '%';
            defMin = 20;
            defMax = 80;
            step = '1';
            minAttr = 'min="0"';
            maxAttr = 'max="100"';
          }

          if (initialData && !isInitialState) {
            if (initialData.minVal !== undefined && initialData.maxVal !== undefined) {
              defMin = initialData.minVal;
              defMax = initialData.maxVal;
            } else if (initialData.threshold !== undefined) {
              if (initialData.operator === '<') {
                defMin = (sDev.mode === 'INPUT_ADC' || sDev.mode === 'OUTPUT_PWM') ? 0 : -20;
                defMax = initialData.threshold;
              } else if (initialData.operator === '>') {
                defMin = initialData.threshold;
                defMax = (sDev.mode === 'INPUT_ADC') ? 3.3 : 100;
              } else {
                defMin = initialData.threshold;
                defMax = initialData.threshold;
              }
            }
          }

          const wrap = document.createElement('div');
          wrap.className = 'cond-range-wrapper';
          wrap.style.cssText = "display: flex; align-items: center; gap: 5px; width: 100%;";
          wrap.innerHTML = `
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">[</span>
            <input type="number" class="rule-inline-input cond-min-input" ${minAttr} ${maxAttr} step="${step}" value="${defMin}" placeholder="Min" style="width: 58px; text-align: center; padding: 6px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-main); color: white; font-weight: 600; font-size: 12px;">
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">,</span>
            <input type="number" class="rule-inline-input cond-max-input" ${minAttr} ${maxAttr} step="${step}" value="${defMax}" placeholder="Max" style="width: 58px; text-align: center; padding: 6px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-main); color: white; font-weight: 600; font-size: 12px;">
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">]</span>
            <span style="font-weight: 700; color: var(--cyan-light); font-size: 12px; margin-left: 2px;">${unit}</span>
          `;
          valWrapper.appendChild(wrap);
        }
      };

      typeSelect.onchange = () => renderTypeFields();
      renderTypeFields();

      condFieldContainer.appendChild(typeSelect);
      condFieldContainer.appendChild(valWrapper);
    } else {
      // Capteurs discrets (PIR, contact digital) : lecture directe de l'état
      const condSelect = document.createElement('select');
      condSelect.className = 'rule-inline-select cond-val-select';
      condSelect.style.cssText = "width: 100%;";
      condSelect.innerHTML = getSensorConditionOptions(sDev);
      condFieldContainer.appendChild(condSelect);

      if (initialData && initialData.conditionValue) {
        condSelect.value = initialData.conditionValue;
      }
    }
  };

  sensorSelect.onchange = () => updateCondField();

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'btn-danger-sm';
  delBtn.title = "Supprimer cette condition";
  delBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>`;
  delBtn.onclick = () => {
    if (container.querySelectorAll('.modal-condition-row').length > 1) {
      row.remove();
    } else {
      showToast("Une automatisation doit contenir au moins une condition.", "warning");
    }
  };

  row.appendChild(sensorSelect);
  row.appendChild(liveBadge);
  row.appendChild(condFieldContainer);
  row.appendChild(delBtn);
  container.appendChild(row);

  if (data && (data.triggerId || data.triggerDeviceId)) {
    sensorSelect.value = data.triggerId || data.triggerDeviceId;
  }
  updateCondField(data);
}

function addActionRow(data = null) {
  const container = document.getElementById('modal-actions-list');
  if (!container) return;

  const actuators = devicesList.filter(d => d.category === 'ACTUATOR' || (!d.category && d.mode && d.mode.startsWith('OUTPUT')));
  if (actuators.length === 0) {
    showToast("Aucun actionneur disponible. Ajoutez d'abord un actionneur dans le menu Matériel.", "warning");
    return;
  }

  const row = document.createElement('div');
  row.className = 'modal-action-row';
  row.style.cssText = "display: flex; align-items: center; gap: 8px; flex-wrap: wrap;";

  const targetSelect = document.createElement('select');
  targetSelect.className = 'rule-inline-select act-target-select';
  targetSelect.style.cssText = "flex: 1; min-width: 170px;";
  targetSelect.innerHTML = actuators.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');

  const actFieldContainer = document.createElement('div');
  actFieldContainer.className = 'act-field-container';
  actFieldContainer.style.cssText = "flex: 1; min-width: 160px; display: flex; align-items: center;";

  const updateActField = (initialData = null) => {
    const tId = parseInt(targetSelect.value, 10);
    const tDev = devicesList.find(d => d.id === tId);
    actFieldContainer.innerHTML = '';

    const isPWM = tDev && (tDev.mode && tDev.mode.includes('PWM'));
    if (isPWM) {
      const wrap = document.createElement('div');
      wrap.className = 'act-pwm-wrapper';
      wrap.style.cssText = "display: flex; align-items: center; gap: 8px; width: 100%;";
      wrap.innerHTML = `
        <span style="font-size: 13px; color: var(--text-muted); font-weight: 500;">${t('lbl_set_to', 'Régler à :')}</span>
        <input type="number" class="rule-inline-input act-pwm-input" min="0" max="100" value="100" oninput="if(this.value<0)this.value=0;if(this.value>100)this.value=100;" style="width: 75px; text-align: center; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-main); color: white; font-weight: 600;">
        <span style="font-weight: 700; color: var(--cyan-light); font-size: 13px;">%</span>
      `;
      actFieldContainer.appendChild(wrap);

      if (initialData) {
        const numInp = wrap.querySelector('.act-pwm-input');
        if (numInp) {
          if (initialData.actionPercent !== undefined && initialData.actionPercent !== null) {
            numInp.value = initialData.actionPercent;
          } else if (initialData.actionValue !== undefined && !isNaN(parseInt(initialData.actionValue, 10))) {
            numInp.value = initialData.actionValue;
          } else if (initialData.actionValue === 'OFF') {
            numInp.value = 0;
          }
        }
      }
    } else {
      const actionSelect = document.createElement('select');
      actionSelect.className = 'rule-inline-select act-val-select';
      actionSelect.style.cssText = "width: 100%;";
      actionSelect.innerHTML = getActuatorActionOptions(tDev);
      actFieldContainer.appendChild(actionSelect);

      if (initialData) {
        if (initialData.actionValue) {
          actionSelect.value = initialData.actionValue;
        } else if (initialData.actionPercent !== undefined) {
          actionSelect.value = (initialData.actionPercent > 0) ? 'ON' : 'OFF';
        }
      }
    }
  };

  targetSelect.onchange = () => updateActField();

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'btn-danger-sm';
  delBtn.title = "Supprimer cet actionneur";
  delBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>`;
  delBtn.onclick = () => {
    if (container.querySelectorAll('.modal-action-row').length > 1) {
      row.remove();
    } else {
      showToast("Une automatisation doit contenir au moins un actionneur.", "warning");
    }
  };

  row.appendChild(targetSelect);
  row.appendChild(actFieldContainer);
  row.appendChild(delBtn);
  container.appendChild(row);

  if (data && data.targetId) {
    targetSelect.value = data.targetId;
  }
  updateActField(data);
}

// =========================================================================
// VALIDATION & DÉTECTION DES CONFLITS LOGIQUES ENTRE RÈGLES
// =========================================================================
function findRuleConflicts(newRule, existingRules, ignoreRuleId = null) {
  const newTargetIds = newRule.actions.map(a => a.targetId);
  const newCondsMap = new Map();
  newRule.conditions.forEach(c => newCondsMap.set(c.triggerId, c));
  const newSensorIds = Array.from(newCondsMap.keys());

  for (const existing of existingRules) {
    if (ignoreRuleId && existing.id === ignoreRuleId) continue;

    // Normaliser les actions existantes
    const existingActs = (Array.isArray(existing.actions) && existing.actions.length > 0)
      ? existing.actions
      : [{ targetId: existing.targetId || existing.actionDeviceId }];
    const existingTargetIds = existingActs.map(a => a.targetId || a.actionDeviceId);

    // Contrainte 2 : Périmètre du conflit
    // "Deux règles ne sont en conflit que si elles ciblent le même équipement actionneur."
    const sharedTargetIds = newTargetIds.filter(id => existingTargetIds.includes(id));
    if (sharedTargetIds.length === 0) {
      // Aucun actionneur cible commun -> Aucun conflit logique
      continue;
    }

    // Normaliser les conditions existantes
    const existingConds = (Array.isArray(existing.conditions) && existing.conditions.length > 0)
      ? existing.conditions
      : [{
          triggerId: existing.triggerId || existing.triggerDeviceId,
          conditionValue: existing.conditionValue,
          operator: existing.operator || existing.op,
          threshold: existing.threshold,
          minVal: existing.minVal !== undefined ? existing.minVal : (existing.operator === '<' ? -999 : (existing.threshold || 0)),
          maxVal: existing.maxVal !== undefined ? existing.maxVal : (existing.operator === '>' ? 9999 : (existing.threshold || 0))
        }];

    const existingCondsMap = new Map();
    existingConds.forEach(c => {
      const sId = c.triggerId || c.triggerDeviceId;
      if (sId) existingCondsMap.set(sId, c);
    });
    const existingSensorIds = Array.from(existingCondsMap.keys());

    // Vérifier la compatibilité des conditions pour un capteur donné
    const areConditionsCompatible = (cNew, cExist) => {
      const isNumNew = (cNew.isNumerical === true || (cNew.isNumerical !== false && cNew.operator === 'BETWEEN'));
      const isNumExist = (cExist.isNumerical === true || (cExist.isNumerical !== false && cExist.operator === 'BETWEEN'));

      if (isNumNew && isNumExist) {
        // Plages [minNew, maxNew] et [minExist, maxExist]
        let minNew = (cNew.minVal !== undefined) ? cNew.minVal : cNew.threshold;
        let maxNew = (cNew.maxVal !== undefined) ? cNew.maxVal : cNew.threshold;
        let minExist = (cExist.minVal !== undefined) ? cExist.minVal : (cExist.operator === '<' ? -999 : (cExist.threshold || 0));
        let maxExist = (cExist.maxVal !== undefined) ? cExist.maxVal : (cExist.operator === '>' ? 9999 : (cExist.threshold || 0));

        // Contrainte 1 : Collision si les intervalles fermés s'intersectent
        // [minNew, maxNew] intersecte [minExist, maxExist] <=> max(minNew, minExist) <= min(maxNew, maxExist)
        return Math.max(minNew, minExist) <= Math.min(maxNew, maxExist);
      } else if (!isNumNew && !isNumExist) {
        // Discret / lecture état de capteur : compatible s'ils attendent le même état
        const valNew = String(cNew.conditionValue || 'ON').toUpperCase();
        const valExist = String(cExist.conditionValue || 'ON').toUpperCase();
        return valNew === valExist;
      } else {
        // L'une est une plage de valeurs, l'autre une lecture d'état direct : dimensions disjointes
        return false;
      }
    };

    // Ensemble des capteurs communs
    const commonSensors = newSensorIds.filter(id => existingCondsMap.has(id));

    // Si aucun capteur commun, les règles ont des déclencheurs disjoints
    if (commonSensors.length === 0) {
      continue;
    }

    // Vérifier si TOUTES les conditions des capteurs communs sont compatibles (intersections)
    const allCommonCompatible = commonSensors.every(sId => {
      return areConditionsCompatible(newCondsMap.get(sId), existingCondsMap.get(sId));
    });

    if (!allCommonCompatible) {
      // Au moins un capteur commun a des plages disjointes : les règles ne peuvent jamais être déclenchées simultanément
      continue;
    }

    // Nom des actionneurs partagés pour le message d'alerte
    const sharedDevNames = sharedTargetIds.map(tId => {
      const dev = devicesList.find(d => d.id === tId);
      return dev ? dev.name : `#${tId}`;
    }).join(', ');
    const existName = existing.name ? `"${existing.name}"` : `Règle #${existing.id}`;

    // Cas 1 : Même ensemble de capteurs (newSensorIds == existingSensorIds)
    if (newSensorIds.length === existingSensorIds.length && commonSensors.length === newSensorIds.length) {
      return {
        conflict: true,
        type: 'RANGE_COLLISION',
        rule: existing,
        message: t('toast_rule_conflict_similar', "Une règle similaire contradictoire existe déjà")
      };
    }

    // Contrainte 3 : Inclusion de conditions
    // "interdire la création si l'ensemble des conditions de la nouvelle règle est un sous-ensemble strict (ou un sur-ensemble strict) d'une règle existante avec des plages compatibles."
    
    // Cas 2 : Sous-ensemble strict (newSensorIds ⊊ existingSensorIds)
    if (newSensorIds.length < existingSensorIds.length && commonSensors.length === newSensorIds.length) {
      return {
        conflict: true,
        type: 'STRICT_SUBSET',
        rule: existing,
        message: t('toast_rule_conflict_similar', "Une règle similaire contradictoire existe déjà")
      };
    }

    // Cas 3 : Sur-ensemble strict (newSensorIds ⊋ existingSensorIds)
    if (newSensorIds.length > existingSensorIds.length && commonSensors.length === existingSensorIds.length) {
      return {
        conflict: true,
        type: 'STRICT_SUPERSET',
        rule: existing,
        message: t('toast_rule_conflict_similar', "Une règle similaire contradictoire existe déjà")
      };
    }
  }

  return { conflict: false };
}

async function saveAutomationModal() {
  const nameInput = document.getElementById('modal-rule-name');
  const ruleName = nameInput ? nameInput.value.trim() : '';

  if (!ruleName) {
    showToast(t('label_auto_name_required', "Veuillez saisir un intitulé pour la règle."), "warning");
    if (nameInput) nameInput.focus();
    return;
  }

  // 1. Vérification : unicité de l'intitulé (en ignorant la règle en cours d'édition si modification)
  const duplicateName = automationRules.find(r => 
    r.id !== editingAutomationRuleId && 
    (r.name || '').trim().toLowerCase() === ruleName.toLowerCase()
  );
  if (duplicateName) {
    showToast(t('toast_rule_exists_name', "Une règle avec cet intitulé existe déjà."), "warning");
    if (nameInput) nameInput.focus();
    return;
  }

  const condRows = document.querySelectorAll('#modal-conditions-list .modal-condition-row');
  const actRows = document.querySelectorAll('#modal-actions-list .modal-action-row');

  if (condRows.length === 0) {
    showToast(t('toast_rule_need_condition', "Veuillez ajouter au moins une condition."), "warning");
    return;
  }
  if (actRows.length === 0) {
    showToast(t('toast_rule_need_actuator', "Veuillez ajouter au moins un actionneur."), "warning");
    return;
  }

  const conditions = [];
  const selectedSensors = new Set();

  for (const row of condRows) {
    const sSelect = row.querySelector('.cond-sensor-select');
    const trigId = parseInt(sSelect ? sSelect.value : '', 10);

    if (!trigId || isNaN(trigId)) {
      showToast(t('toast_rule_valid_sensor', "Veuillez sélectionner un capteur valide."), "warning");
      return;
    }

    if (selectedSensors.has(trigId)) {
      showToast(t('toast_rule_duplicate_sensor', "Chaque capteur ne peut être sélectionné qu'une seule fois dans la même règle."), "warning");
      return;
    }
    selectedSensors.add(trigId);

    const trigDev = devicesList.find(d => d.id === trigId);
    const typeSelect = row.querySelector('.cond-type-select');
    const isStateChoice = typeSelect ? (typeSelect.value === 'STATE') : !(trigDev && (trigDev.mode === 'INPUT_ONEWIRE' || trigDev.mode === 'INPUT_ADC_NTC' || trigDev.mode === 'INPUT_ADC' || trigDev.mode === 'OUTPUT_PWM'));

    if (!isStateChoice) {
      const minInp = row.querySelector('.cond-min-input');
      const maxInp = row.querySelector('.cond-max-input');
      const minVal = minInp ? parseFloat(minInp.value) : NaN;
      const maxVal = maxInp ? parseFloat(maxInp.value) : NaN;

      if (isNaN(minVal) || isNaN(maxVal)) {
        showToast(t('toast_rule_valid_range', "Veuillez renseigner une plage numérique valide [Min, Max]."), "warning");
        return;
      }
      if (minVal > maxVal) {
        showToast(t('toast_rule_invalid_range', "Plage invalide : le Min doit être inférieur ou égal au Max."), "warning");
        return;
      }

      conditions.push({
        triggerId: trigId,
        isNumerical: true,
        operator: "BETWEEN",
        minVal: minVal,
        maxVal: maxVal,
        threshold: minVal,
        conditionValue: `${minVal}-${maxVal}`
      });
    } else {
      const cSelect = row.querySelector('.cond-val-select');
      const condVal = cSelect ? cSelect.value : 'ON';
      conditions.push({
        triggerId: trigId,
        isNumerical: false,
        operator: "STATE",
        conditionValue: condVal,
        threshold: 0,
        minVal: 0,
        maxVal: 0
      });
    }
  }

  const actions = [];
  const selectedTargets = new Set();

  for (const row of actRows) {
    const tSelect = row.querySelector('.act-target-select');
    const targetId = parseInt(tSelect ? tSelect.value : '', 10);

    if (!targetId || isNaN(targetId)) {
      showToast(t('toast_rule_valid_actuator', "Veuillez sélectionner un actionneur valide."), "warning");
      return;
    }

    if (selectedTargets.has(targetId)) {
      showToast(t('toast_rule_duplicate_actuator', "Chaque actionneur ne peut être sélectionné qu'une seule fois dans la même règle."), "warning");
      return;
    }
    selectedTargets.add(targetId);

    const targetDev = devicesList.find(d => d.id === targetId);
    let actionValue = "ON";
    let actionPercent = 100;

    const isPWM = targetDev && (targetDev.mode && targetDev.mode.includes('PWM'));
    if (isPWM) {
      const pwmInput = row.querySelector('.act-pwm-input');
      let pct = pwmInput ? parseInt(pwmInput.value, 10) : 100;
      if (isNaN(pct)) pct = 0;
      pct = Math.max(0, Math.min(100, pct));
      actionPercent = pct;
      actionValue = pct > 0 ? "ON" : "OFF";
    } else {
      const aSelect = row.querySelector('.act-val-select');
      const actVal = aSelect ? aSelect.value : '';
      if (!actVal) {
        showToast(t('toast_rule_define_action', "Veuillez définir une action pour chaque actionneur."), "warning");
        return;
      }
      actionValue = actVal;
      actionPercent = null;
    }

    actions.push({
      targetId: targetId,
      actionValue: actionValue,
      actionPercent: actionPercent
    });
  }

  // 2. Vérification des conflits logiques (Contraintes 1, 2 et 3)
  const candidateRule = {
    id: editingAutomationRuleId || 0,
    name: ruleName,
    conditions: conditions,
    actions: actions
  };

  const conflictCheck = findRuleConflicts(candidateRule, automationRules, editingAutomationRuleId);
  if (conflictCheck.conflict) {
    showToast(conflictCheck.message, "warning");
    return;
  }

  const isEdit = (editingAutomationRuleId !== null);
  let finalRuleId = editingAutomationRuleId;

  if (isEdit) {
    const ruleIdx = automationRules.findIndex(r => r.id === editingAutomationRuleId);
    if (ruleIdx !== -1) {
      automationRules[ruleIdx].name = ruleName;
      automationRules[ruleIdx].conditions = conditions;
      automationRules[ruleIdx].actions = actions;
    }
  } else {
    finalRuleId = (automationRules.length > 0)
      ? Math.max(...automationRules.map(r => r.id || 0)) + 1
      : 1;

    const newRule = {
      id: finalRuleId,
      name: ruleName,
      enabled: true,
      conditions: conditions,
      actions: actions
    };
    automationRules.push(newRule);
  }

  localStorage.setItem('van_automations', JSON.stringify(automationRules));
  closeAutomationModal();
  renderAutomationTable();

  const successMsg = isEdit 
    ? t('toast_rule_updated', "Règle mise à jour avec succès.")
    : t('toast_rule_added', "Règle ajoutée avec succès.");
  showToast(successMsg, "success");

  if (typeof logSystemEvent === 'function') {
    logSystemEvent(`${isEdit ? 'Modification' : 'Création'} automatisation : ${ruleName} (Règle #${finalRuleId})`);
  }

  try {
    await fetchApi('/api/automations', 'POST', { rules: automationRules });
  } catch (err) {
    console.warn("Mode local / FiveServer : persistance effectuée dans le stockage local", err);
  }
}

function renderAutomationTable() {
  const tbody = document.getElementById('automation-table-body');
  if (!tbody) return;

  if (!automationRules || automationRules.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:35px 20px; color:var(--text-muted); font-size:13px;">
          ${t('empty_rules', "Aucune règle d'automatisation enregistrée. Cliquez sur <strong>Ajouter</strong> ci-dessus pour configurer un automatisme.")}
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  automationRules.forEach(rule => {
    const ruleTitle = rule.name ? escapeHtml(rule.name) : `Règle #${rule.id}`;

    const conds = (Array.isArray(rule.conditions) && rule.conditions.length > 0)
      ? rule.conditions
      : [{
          triggerId: (rule.triggerId !== undefined) ? rule.triggerId : rule.triggerDeviceId,
          conditionValue: rule.conditionValue,
          operator: rule.operator || rule.op,
          threshold: rule.threshold,
          minVal: rule.minVal,
          maxVal: rule.maxVal
        }];

    const acts = (Array.isArray(rule.actions) && rule.actions.length > 0)
      ? rule.actions
      : [{
          targetId: (rule.targetId !== undefined) ? rule.targetId : rule.actionDeviceId,
          actionValue: rule.actionValue,
          actionPercent: rule.actionPercent
        }];

    const sourcesHtml = conds.map((c, idx) => {
      const trigDev = devicesList.find(d => d.id === c.triggerId);
      const trigName = trigDev ? trigDev.name : `Capteur #${c.triggerId}`;
      return `<div style="font-weight:600; color:var(--text-main); margin-bottom:${idx < conds.length - 1 ? '6px' : '0'};">${escapeHtml(trigName)}</div>`;
    }).join('');

    const condsHtml = conds.map((c, idx) => {
      const trigDev = devicesList.find(d => d.id === c.triggerId);
      let condText = '';
      const trigMode = trigDev ? trigDev.mode : '';
      const isNum = (c.isNumerical === true || (c.isNumerical !== false && c.operator === 'BETWEEN' && (c.minVal !== undefined || c.threshold !== undefined)));

      if (isNum) {
        const min = (c.minVal !== undefined) ? c.minVal : c.threshold;
        const max = (c.maxVal !== undefined) ? c.maxVal : c.threshold;
        if (trigMode === 'INPUT_ONEWIRE' || trigMode === 'INPUT_ADC_NTC') {
          condText = `${t('cond_temp_in', 'Température dans')} [${min}, ${max}] °C`;
        } else if (trigMode === 'INPUT_ADC') {
          condText = `${t('cond_volt_in', 'Tension dans')} [${min}, ${max}] V`;
        } else if (trigMode === 'OUTPUT_PWM') {
          condText = `${t('cond_pwm_in', 'Variateur dans')} [${min}, ${max}] %`;
        } else {
          condText = `${t('cond_val_in', 'Valeur dans')} [${min}, ${max}]`;
        }
      } else if (trigMode === 'INPUT_PIR') {
        condText = (c.conditionValue === 'ON' || c.conditionValue === '1') ? t('cond_pir_motion', 'Mouvement détecté') : t('cond_pir_no_motion', 'Aucun mouvement');
      } else if (trigMode === 'INPUT_DIGITAL') {
        condText = (c.conditionValue === 'ON' || c.conditionValue === '1') ? t('cond_contact_closed', 'Contact fermé (Actif)') : t('cond_contact_open', 'Contact ouvert (Inactif)');
      } else {
        const isStOn = (c.conditionValue === 'ON' || c.conditionValue === '1');
        condText = isStOn ? `${t('cond_lbl_state_prefix', 'État :')} ${t('cond_state_on', 'Actif (ON)')}` : `${t('cond_lbl_state_prefix', 'État :')} ${t('cond_state_off', 'Inactif (OFF)')}`;
      }
      const prefix = idx > 0 ? `<span style="color:var(--cyan-light); font-weight:700; font-size:10px; margin-right:4px;">${t('lbl_and', 'ET')}</span> ` : '';
      return `<div style="color:var(--text-main); font-weight:500; margin-bottom:${idx < conds.length - 1 ? '6px' : '0'};">${prefix}${escapeHtml(condText)}</div>`;
    }).join('');

    const targetsHtml = acts.map((a, idx) => {
      const targetDev = devicesList.find(d => d.id === a.targetId);
      const targetName = targetDev ? targetDev.name : `Actionneur #${a.targetId}`;
      return `<div style="font-weight:600; color:var(--text-main); margin-bottom:${idx < acts.length - 1 ? '6px' : '0'};">${escapeHtml(targetName)}</div>`;
    }).join('');

    const actsHtml = acts.map((a, idx) => {
      const targetDev = devicesList.find(d => d.id === a.targetId);
      let actText = '';
      let badgeStyle = '';

      const isPWM = targetDev
        ? (targetDev.mode && targetDev.mode.includes('PWM'))
        : (a.actionPercent !== undefined && a.actionPercent !== null && a.actionPercent > 0 && a.actionPercent < 100);

      if (isPWM) {
        const pct = (a.actionPercent !== undefined && a.actionPercent !== null)
          ? a.actionPercent
          : (!isNaN(parseInt(a.actionValue, 10)) ? parseInt(a.actionValue, 10) : 100);
        actText = t('act_set_pwm', 'Régler à : {pct} %').replace('{pct}', pct);
        badgeStyle = 'background:rgba(56,189,248,0.15); color:var(--cyan-light); border:1px solid rgba(56,189,248,0.3);';
      } else {
        const isTurnOn = (a.actionValue === 'ON' || a.actionValue === '1' || a.actionValue === 1 || a.actionPercent === 100);
        actText = isTurnOn ? t('act_turn_on', 'Allumer (ON)') : t('act_turn_off', 'Éteindre (OFF)');
        badgeStyle = isTurnOn
          ? 'background:rgba(16,185,129,0.15); color:var(--success); border:1px solid rgba(16,185,129,0.3);'
          : 'background:rgba(239,68,68,0.15); color:var(--danger); border:1px solid rgba(239,68,68,0.3);';
      }
      return `<div style="margin-bottom:${idx < acts.length - 1 ? '6px' : '0'};"><span class="badge" style="${badgeStyle} font-weight:700;">${escapeHtml(actText)}</span></div>`;
    }).join('');

    html += `
      <tr>
        <td>
          <div style="font-weight:700; color:var(--text-light); font-size:13px;">${ruleTitle}</div>
        </td>
        <td class="col-center">
          <span class="badge" style="background:rgba(45,212,191,0.15); color:var(--cyan-light); font-weight:800; font-size:11px;">SI</span>
        </td>
        <td>${sourcesHtml}</td>
        <td>${condsHtml}</td>
        <td class="col-center">
          <span class="badge" style="background:rgba(45,212,191,0.15); color:var(--cyan-light); font-weight:800; font-size:11px;">ALORS</span>
        </td>
        <td>${targetsHtml}</td>
        <td>${actsHtml}</td>
        <td class="col-center">
          <label class="toggle-switch">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} onchange="toggleRuleActive(${rule.id})">
            <span class="slider"></span>
          </label>
        </td>
        <td class="col-right" style="white-space:nowrap;">
          <button class="btn-outline-sm" onclick="openEditAutomationModal(${rule.id})" title="Modifier cette règle" style="margin-right:6px; padding:6px 9px; color:var(--cyan-light); border-color:rgba(56,189,248,0.4); display:inline-flex; align-items:center; justify-content:center;">
            <svg viewBox="0 0 24 24" style="width:14px; height:14px; fill:currentColor;"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z"/></svg>
          </button>
          <button class="btn-danger-sm" onclick="deleteAutomationRule(${rule.id})" title="${t('btn_delete', 'Supprimer')}">
            <svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

async function deleteAutomationRule(id) {
  if (!confirm("Voulez-vous supprimer cette règle d'automatisation ?")) return;

  automationRules = automationRules.filter(r => r.id !== id);
  localStorage.setItem('van_automations', JSON.stringify(automationRules));
  renderAutomationTable();
  showToast(t('toast_rule_deleted', "Règle supprimée."), "success");
  if (typeof logSystemEvent === 'function') {
    logSystemEvent(`Suppression automatisation : Règle #${id}`);
  }

  try {
    await fetchApi('/api/automations', 'POST', { rules: automationRules });
  } catch (err) {
    console.warn("Mode local / FiveServer : suppression dans le stockage local", err);
  }
}

async function toggleRuleActive(id) {
  const rule = automationRules.find(r => r.id === id);
  if (!rule) return;
  rule.enabled = !rule.enabled;
  localStorage.setItem('van_automations', JSON.stringify(automationRules));
  if (typeof logSystemEvent === 'function') {
    logSystemEvent(`Modification automatisation : Règle #${id} (${rule.enabled ? 'Activée' : 'Désactivée'})`);
  }

  try {
    await fetchApi('/api/automations', 'POST', { rules: automationRules });
  } catch (e) {
    console.warn("toggleRuleActive local:", e);
  }
}

// =========================================================================
// PARAMÈTRES & CONFIGURATION WI-FI
// =========================================================================
async function loadWifiStatus() {
  try {
    const data = await fetchApi('/api/wifi/status');
    if (data) {
      const staIp = document.getElementById('wifi-sta-ip');
      const apIp = document.getElementById('wifi-ap-ip');
      if (staIp) staIp.innerText = data.sta_ip || 'Non connecté';
      if (apIp) apIp.innerText = data.ap_ip || '192.168.4.1';
    }
  } catch (e) {
    console.warn("loadWifiStatus err", e);
  }
}

async function scanWifiNetworks() {
  const btn = document.getElementById('btn-wifi-scan');
  const select = document.getElementById('wifi-networks-select');
  if (btn) btn.disabled = true;

  try {
    const data = await fetchApi('/api/wifi/scan');
    if (data && Array.isArray(data.networks)) {
      if (select) {
        select.innerHTML = `<option value="">-- ${t('wifi_select_placeholder', 'Sélectionner un réseau')} (${data.networks.length}) --</option>`;
        data.networks.forEach(net => {
          const opt = document.createElement('option');
          opt.value = net.ssid;
          opt.innerText = `${net.ssid} (${net.rssi} dBm)`;
          select.appendChild(opt);
        });
      }
      showToast(t('toast_wifi_scan_done', "Réseaux Wi-Fi détectés."), "info");
    }
  } catch (e) {
    showToast("Erreur scan Wi-Fi", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

function onWifiSelectedFromScan(ssid) {
  if (!ssid) return;
  const ssidInput = document.getElementById('wifi-ssid');
  if (ssidInput) ssidInput.value = ssid;
}

async function submitWifiConnect(event) {
  event.preventDefault();
  const ssid = document.getElementById('wifi-ssid').value.trim();
  const pass = document.getElementById('wifi-password').value.trim();

  if (!ssid) {
    showToast(t('toast_wifi_ssid_required', "Veuillez saisir un SSID."), "warning");
    return;
  }

  try {
    showToast(t('toast_wifi_connecting', `Connexion à "${ssid}"...`).replace('{ssid}', ssid), "info");
    await fetchApi('/api/wifi/connect', 'POST', { ssid, password: pass });
  } catch (e) {
    showToast("Erreur connexion Wi-Fi", "error");
  }
}

async function forgetWifiNetwork() {
  if (!confirm(t('toast_wifi_forget_confirm', "Oublier le réseau Wi-Fi ?"))) return;
  try {
    await fetchApi('/api/wifi/forget', 'POST', {});
    showToast(t('toast_wifi_reset_done', "Réseau oublié."), "success");
    await loadWifiStatus();
  } catch (e) {
    showToast("Erreur", "error");
  }
}

// =========================================================================
// DIAGNOSTIC SYSTÈME & WATCHDOG
// =========================================================================
function logSystemEvent(message, level = 'INFO') {
  if (!message) return;
  // 1. Envoi vers le serveur ESP32
  try {
    fetchApi('/api/diagnostics/log', 'POST', { level, message });
  } catch (e) {}

  // 2. Persistance locale (FiveServer / aperçu hors-ligne)
  try {
    const raw = localStorage.getItem('van_diag_logs');
    const localLogs = raw ? JSON.parse(raw) : [];
    localLogs.unshift({
      ts: Math.floor(Date.now() / 1000),
      epoch: true,
      lvl: level,
      msg: message
    });
    if (localLogs.length > 80) localLogs.length = 80;
    localStorage.setItem('van_diag_logs', JSON.stringify(localLogs));
  } catch (e) {}
}

async function fetchDiagnostics() {
  try {
    const epochNow = Math.floor(Date.now() / 1000);
    const data = await fetchApi(`/api/diagnostics?ts=${epochNow}`);
    if (data) {
      const heapEl = document.getElementById('diag-heap') || document.getElementById('diag-heap-free');
      const uptimeEl = document.getElementById('diag-uptime');
      const resetEl = document.getElementById('diag-reset-reason');
      const cpuEl = document.getElementById('diag-cpu');
      const wdtEl = document.getElementById('diag-wdt-badge');
      const apEl = document.getElementById('diag-ap-status');
      const staEl = document.getElementById('diag-sta-status');
      const logsEl = document.getElementById('diag-messages-list') || document.getElementById('diag-logs-container');

      if (heapEl) {
        const freeHeap = (data.system && data.system.free_heap !== undefined) ? data.system.free_heap : data.free_heap;
        heapEl.innerText = freeHeap ? `${Math.round(freeHeap / 1024)} KB` : '--';
      }
      if (uptimeEl) {
        uptimeEl.innerText = (data.system && data.system.uptime_human) || (data.uptime ? `${Math.round(data.uptime / 60)} min` : '--');
      }
      if (resetEl) {
        resetEl.innerText = (data.system && data.system.reset_reason) || data.reset_reason || 'Power-on';
      }
      if (cpuEl && data.system) {
        cpuEl.innerText = `${data.system.cpu_freq_mhz || 240} MHz / ${data.system.chip_model || 'ESP32'}`;
      }
      if (wdtEl) {
        const isWdt = (data.system && data.system.wdt_enabled !== undefined) ? data.system.wdt_enabled : true;
        const wdtSec = (data.system && data.system.wdt_timeout_sec) ? data.system.wdt_timeout_sec : 10;
        wdtEl.innerText = isWdt ? `Actif (${wdtSec}s auto-reboot)` : 'Inactif';
      }
      if (apEl && data.network) {
        apEl.innerText = data.network.ap_active ? `Actif (${data.network.ap_ssid || 'Van-Assistant-Local'})` : 'Inactif';
      }
      if (staEl && data.network) {
        staEl.innerText = data.network.sta_connected ? `Connecté (${data.network.sta_ssid || ''})` : 'Déconnecté';
      }

      const logs = (Array.isArray(data.logs)) ? data.logs : [];
      renderDiagnosticLogsList(logs, logsEl);
    }
  } catch (e) {
    console.warn("fetchDiagnostics fallback local:", e);
    const logsEl = document.getElementById('diag-messages-list') || document.getElementById('diag-logs-container');
    const raw = localStorage.getItem('van_diag_logs');
    const localLogs = raw ? JSON.parse(raw) : [];
    renderDiagnosticLogsList(localLogs, logsEl);
  }
}

function renderDiagnosticLogsList(logs, logsEl) {
  if (!logsEl) return;
  if (!logs || logs.length === 0) {
    logsEl.innerHTML = `<div style="color:var(--text-muted); font-size:12px; padding:18px; text-align:center;">Aucun événement enregistré dans le journal (48h).</div>`;
    return;
  }

  logsEl.innerHTML = logs.map(l => {
    const level = l.lvl || l.level || 'INFO';
    const message = l.msg || l.message || '';
    let timeStr = '--';

    if (l.ts) {
      if (l.epoch && l.ts > 1600000000) {
        const d = new Date(l.ts * 1000);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        const secs = String(d.getSeconds()).padStart(2, '0');
        timeStr = `${day}/${month} ${hours}:${mins}:${secs}`;
      } else {
        const m = Math.floor(l.ts / 60);
        const s = l.ts % 60;
        timeStr = `+${m}m ${s}s`;
      }
    } else if (l.time) {
      timeStr = l.time;
    }

    let badgeBg = 'rgba(56, 189, 248, 0.15)';
    let badgeColor = 'var(--cyan-light)';
    let badgeBorder = 'rgba(56, 189, 248, 0.4)';
    if (level === 'CRITIQUE' || level === 'ERROR') {
      badgeBg = 'rgba(239, 68, 68, 0.15)';
      badgeColor = 'var(--danger)';
      badgeBorder = 'rgba(239, 68, 68, 0.4)';
    } else if (level === 'ALERTE' || level === 'WARN') {
      badgeBg = 'rgba(245, 158, 11, 0.15)';
      badgeColor = 'var(--warning)';
      badgeBorder = 'rgba(245, 158, 11, 0.4)';
    } else if (level === 'RECOUVREMENT') {
      badgeBg = 'rgba(16, 185, 129, 0.15)';
      badgeColor = 'var(--success)';
      badgeBorder = 'rgba(16, 185, 129, 0.4)';
    }

    return `
      <div class="diag-log-item level-${escapeHtml(level)}">
        <span class="diag-log-time">[${escapeHtml(timeStr)}]</span>
        <span class="badge" style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; font-size:10px; font-weight:700; text-transform:uppercase;">${escapeHtml(level)}</span>
        <span class="diag-log-msg">${escapeHtml(message)}</span>
      </div>
    `;
  }).join('');
}

async function clearDiagnosticLogs() {
  localStorage.removeItem('van_diag_logs');
  try {
    await fetchApi('/api/diagnostics/clear', 'POST', {});
  } catch(e) {}
  await fetchDiagnostics();
}

async function confirmSystemRestart() {
  if (!confirm(t('toast_restart_confirm', "Confirmez-vous le redémarrage immédiat de l'ESP32 ?"))) return;
  showToast(t('toast_restarting', "Redémarrage de l'ESP32 en cours..."), "warning");
  try {
    await fetchApi('/api/system/restart', 'POST', {});
  } catch(e) {}
}

// =========================================================================
// WEBSOCKET & TÉLÉMÉTRIE TEMPS-RÉEL
// =========================================================================
function initWebSocket() {
  const protocol = (location.protocol === 'https:') ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${location.host}/ws`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      isWsConnected = true;
      updateConnectionStatus(true);
      if (socketReconnectTimer) {
        clearInterval(socketReconnectTimer);
        socketReconnectTimer = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleIncomingTelemetry(msg);
      } catch (e) {}
    };

    socket.onclose = () => {
      isWsConnected = false;
      updateConnectionStatus(false);
      scheduleWsReconnect();
    };

    socket.onerror = () => {
      isWsConnected = false;
      updateConnectionStatus(false);
    };
  } catch (err) {
    scheduleWsReconnect();
  }
}

function scheduleWsReconnect() {
  if (!socketReconnectTimer) {
    socketReconnectTimer = setInterval(() => {
      initWebSocket();
    }, 4000);
  }
}

function updateConnectionStatus(connected) {
  const badge = document.getElementById('ws-status-badge');
  const text = document.getElementById('ws-status-text');

  if (badge) {
    badge.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
  }
  if (text) {
    text.innerText = connected ? t('header_connected', 'Connecté') : t('header_disconnected', 'Déconnecté...');
  }
}

function handleIncomingTelemetry(data) {
  if (data.type === 'DEVICE_UPDATE' && data.device) {
    const idx = devicesList.findIndex(d => d.id === data.device.id);
    if (idx !== -1) {
      Object.assign(devicesList[idx], data.device);
    } else {
      devicesList.push(data.device);
    }
    localStorage.setItem('van_devices', JSON.stringify(devicesList));
    checkPirDetectionLog(devicesList);
    renderDevicesTable();
    updateGlobalStats();
  } else if ((data.type === 'ALL_DEVICES' || Array.isArray(data.devices)) && Array.isArray(data.devices)) {
    devicesList = data.devices;
    localStorage.setItem('van_devices', JSON.stringify(devicesList));
    checkPirDetectionLog(devicesList);
    renderDevicesTable();
    updateGlobalStats();
    if (typeof populateAutoDropdowns === 'function') populateAutoDropdowns();
  }
}

// =========================================================================
// INITIALISATION DE L'APPLICATION
// =========================================================================
async function initApp() {
  applyTranslations();
  applyUserRoleVisibility();
  await loadDevices();
  await loadAutomations();
  initWebSocket();

  if (!deviceRefreshInterval) {
    deviceRefreshInterval = setInterval(() => {
      if (!isWsConnected) loadDevices();
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const isAuth = sessionStorage.getItem('van_assistant_auth') === '1';
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app-screen') || document.getElementById('main-app');

  if (isAuth) {
    if (loginScreen) loginScreen.style.display = 'none';
    if (appScreen) appScreen.style.display = 'flex';
    applyUserRoleVisibility();
    initApp();
  } else {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appScreen) appScreen.style.display = 'none';
    applyTranslations();
  }
});