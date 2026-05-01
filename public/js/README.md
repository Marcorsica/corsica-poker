# Structure JavaScript

Le front a été découpé en scripts spécialisés, chargés dans l'ordre depuis `public/index.html`.

- `core/` : configuration, état, utilitaires transverses, audio
- `game/` : jackpots, moteur de cartes, flux de manche, mises
- `ui/` : rendu, layout, réglages, overlays, habillage UI
- `api/` : synchronisation avec le serveur

Le chargement reste volontairement séquentiel pour limiter le risque de régression sur cette base existante.


Nouveaux moteurs isolés :
- `game/odds.js` : construit et applique des snapshots de cotes à partir des réponses serveur
- `game/jackpot-engine.js` : évalue l'éligibilité jackpot par phase à partir des snapshots de cotes
