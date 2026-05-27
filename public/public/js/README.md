# Structure JavaScript

Le front est rangé par responsabilités, avec des scripts chargés dans l’ordre depuis `public/index.html`.

- `config/` : réglages globaux, libellés, textes, options, constantes et état de configuration.
- `core/` : cœur technique du jeu : état principal, runtime et moteur de cartes.
- `economy/` : mises, jackpots, gains, répartition et logique liée à l’argent.
- `game/` : déroulement d’une manche et calculs de cotes.
- `ui/` : rendu visuel, layout, panneaux, overlays, habillage et réglages visibles.
- `controllers/` : actions utilisateur et fonctions déclenchées par les boutons/clics.
- `api/` : synchronisation avec le serveur.

Le chargement reste séquentiel pour limiter le risque de régression sur cette base existante : aucun passage en modules ES n’a été fait.

Fichiers déplacés pendant le rangement :

- `core/config-state.js` → `config/game-config.js`
- `core/actions.js` → `controllers/actions.js`
- `game/betting.js` → `economy/betting.js`
- `game/jackpot-engine.js` → `economy/jackpot-engine.js`
- `game/jackpots.js` → `economy/jackpots.js`
- `game/cards-engine.js` → `core/cards-engine.js`

Fichiers volontairement conservés :

- `game/round-flow.js` reste dans `game/`, car il pilote le déroulement d’une manche.
- `game/odds.js` reste dans `game/`, car il calcule les cotes utilisées pendant la manche.
- `ui/rendering.js` et `ui/setup-ui.js` restent dans `ui/`, car ils concernent l’affichage et l’interface.
