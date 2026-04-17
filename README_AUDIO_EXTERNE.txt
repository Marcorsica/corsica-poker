Corsica Poker - Audio externe

Cette base lit maintenant TOUS les sons depuis le dossier local suivant :
C:\Users\user\Desktop\CORSICA\CorsicaPokerAssets\audio

Fichiers attendus :
- audio_1_jazz.mp3
- audio_2_jazz.mp3
- audio_3_beats.mp3
- audio_4_rnb.mp3
- audio_5_relax.mp3
- audio_6_casino.mp3
- snd_deal.mp3
- snd_card.mp3
- suspense.mp3

Notes :
- audio_6_casino.mp3 = couche d'ambiance additionnelle ON/OFF
- audio_1_jazz.mp3 = musique principale actuelle
- les ZIP suivants peuvent rester sans fichiers audio

Vérification rapide :
- lance le serveur
- ouvre http://localhost:3000/audio-health
- tu verras quels fichiers sont trouvés ou manquants

Option avancée :
- si tu changes de PC ou de dossier, tu peux définir la variable d'environnement CORSICA_AUDIO_DIR
  avant de lancer le serveur.
