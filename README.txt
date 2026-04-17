# Corsica Poker

Base restructurée pour faciliter la maintenance sans changer le comportement métier.

## Structure

- `public/` : client web
  - `css/` : styles
  - `js/` : logique front
  - `assets/audio/` : sons du jeu
- `server/` : backend Express
  - `server.js` : point d'entrée
  - `src/app.js` : application serveur
  - `audit/` : export et journal d'audit
- `docs/` : documentation projet et certification
- `logs/` : journaux client / serveur

## Démarrage

```bash
npm install
npm start
```

Le serveur démarre par défaut sur `http://localhost:3000`.


## Mode test – cas extrêmes préchargés

Une bibliothèque embarquée de cas extrêmes est disponible via le panneau **🧪 Cas extrêmes préchargés** dans le jeu.

Ces cas :
- utilisent de vraies mains et de vraies cotes du moteur actuel ;
- démarrent comme une vraie manche ;
- laissent l'utilisateur miser et **valider les mises normalement** ;
- forcent uniquement le paquet caché pour reproduire la configuration choisie.

Le panneau peut être coupé dans `public/js/test-mode.js` en passant `ENABLE_EXTREME_CASES_PANEL` à `false`.
