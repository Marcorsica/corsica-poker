// Protection jeu : empêche l’ouverture accidentelle du menu clic droit
// pendant les mises rapides et les déplacements de souris.
document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

document.addEventListener("dragstart", (event) => {
  event.preventDefault();
});

// Point d'entrée léger : les scripts sont désormais découpés par responsabilités.
// Voir public/js/config, public/js/core, public/js/economy, public/js/game, public/js/ui, public/js/controllers et public/js/api.
