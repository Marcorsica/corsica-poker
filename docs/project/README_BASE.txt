CORSICA POKER - A1 SECURISE

Structure :
- public/ : front + sons
- server/ : serveur autoritaire pour start/next/odds/result/settle/log
- logs/ : fichiers de logs

Correctifs inclus :
- ajout session_start côté client
- ajout round_start côté client et serveur
- ajout round_end côté client et serveur
- correction du libellé Nouvelle manche
- serveur complet étape 4 conservé

Lancement :
1. npm install
2. npm start
3. ouvrir http://localhost:3000
