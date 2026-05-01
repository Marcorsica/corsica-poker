Corsica Poker — Base premium nettoyée

Cette base a été nettoyée sans modification fonctionnelle du jeu.

Nettoyage effectué
- suppression des anciens mémos temporaires de patch
- suppression du doublon serveur `server/server.js.txt`
- vidage des logs runtime (`logs/`)
- suppression des exports d’audit historiques (`server/audit/exports/`)

État fonctionnel conservé
- démarrage du jeu inchangé
- choix du nombre de mains avant la première partie
- jackpot snapshot serveur actif
- seuil jackpot Diamant basé sur la cote brute : > 7000
- clignotement jackpot limité au temps où le jackpot peut encore être gagné

Fichiers utiles conservés
- `CERTIFICATION_BACKEND_NOTES.md`
- `CERTIFICATION_RTP.md`
- `server/audit/auditLogger.js`
- `logs/` pour les nouveaux journaux à l’exécution
- `server/audit/exports/` pour les nouveaux exports d’audit
