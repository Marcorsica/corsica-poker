// Protection jeu : empêche l’ouverture accidentelle du menu clic droit
// pendant les mises rapides et les déplacements de souris.
document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

document.addEventListener("dragstart", (event) => {
  event.preventDefault();
});

// Point d'entrée léger : les scripts sont désormais découpés par responsabilités.
// Voir public/js/core, public/js/game, public/js/ui et public/js/api.
