# Conception Technique — Inversion de Logique Matériel (Admin Only)

## 1. Contexte & Objectif
Dans le tableau de gestion des équipements matériels (`#view-devices`), ajouter une colonne supplémentaire réservée à l'administrateur (`admin`/`admin`) avec un bouton textuel à deux états (**« Normale »** / **« Inversée »**) permettant d'inverser la logique électrique d'un équipement (actionneur ou capteur).

## 2. Périmètre & Rôles
- **Compte `admin` :** Visualise la colonne « Logique » et peut cliquer sur le bouton pour basculer la logique.
- **Compte `user` (standard) :** La colonne « Logique » est complètement masquée via la classe CSS `.col-admin-only` pilotée par `applyUserRoleVisibility()`.

## 3. Approches étudiées
- **Approche 1 (Retenue) : Bascule directe en ligne** — Clic immédiat sur le bouton textuel façon badge, bascule instantanée du niveau électrique GPIO, persistance flash et affichage d'un toast. Ergonomique et réactif.
- **Approche 2 : Bascule avec dialogue de confirmation** — Demande une confirmation modale à chaque clic. Rejetée car trop lourde pour l'administrateur.

## 4. Spécifications Détaillées

### A. Backend C++ ESP32
1. **Structure `Device` (`DeviceManager.h`) :**
   - Ajout du champ `bool inverted = false;`.
2. **Persistance LittleFS (`DeviceManager.cpp`) :**
   - Lecture : `dev.inverted = obj["inverted"] | false;` dans `loadFromFS()`.
   - Écriture : `obj["inverted"] = dev.inverted;` dans `saveConfig()`.
3. **Application de la logique électrique :**
   - **Sorties Tout-ou-Rien (Relais / Direct) :**
     - Si non-inversé : ON (`state == 1`) $\to$ `HIGH`, OFF (`state == 0`) $\to$ `LOW`.
     - Si inversé : ON (`state == 1`) $\to$ `LOW`, OFF (`state == 0`) $\to$ `HIGH`.
   - **Entrées Digitales (`MODE_INPUT_DIGITAL`) :**
     - Si non-inversé : `val == LOW` $\to$ `state = 1`, `val == HIGH` $\to$ `state = 0`.
     - Si inversé : `val == HIGH` $\to$ `state = 1`, `val == LOW` $\to$ `state = 0`.
   - **Entrées PIR (`MODE_INPUT_PIR`) :**
     - Si non-inversé : `val == HIGH` $\to$ `state = 1`.
     - Si inversé : `val == LOW` $\to$ `state = 1`.
4. **Nouvelle méthode & Route API :**
   - Méthode `bool setDeviceInverted(uint8_t id, bool inverted);` dans `DeviceManager`.
   - Route `POST /api/devices/toggle-inverted` dans `WebServerRoutes.cpp` avec journalisation diagnostic et notification WebSocket.

### B. Frontend (`index.html`, `style.css`, `app.js`)
1. **`index.html` :**
   - Ajout d'une colonne `<th class="col-center col-admin-only" data-i18n="th_device_logic">Logique</th>` dans l'en-tête du tableau.
2. **`style.css` :**
   - Définition de styles pour les boutons textuels 2 états :
     - `.btn-logic-toggle` : bouton compact badge interactif.
     - `.btn-logic-normal` : style sobre (fond discret, texte clair).
     - `.btn-logic-inverted` : style alerte (bordure cyan/ambrée, texte coloré).
3. **`app.js` :**
   - Dans `renderDevicesTable()` :
     - Si compte `admin`, génération de la cellule `<td>` avec le bouton textuel affichant « Normale » ou « Inversée ».
   - Fonction `toggleDeviceInverted(id, isCurrentlyInverted)` :
     - Envoi de la requête `POST /api/devices/toggle-inverted`.
     - Mise à jour locale de `devicesList` et synchronisation `localStorage`.
     - Rafraîchissement du tableau et toast de confirmation.
   - Dans `applyUserRoleVisibility()` :
     - Masquage des éléments `.col-admin-only` pour le rôle `user`.

