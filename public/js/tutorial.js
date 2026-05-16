'use strict';

// ═══════════════════════════════════════════════════════════════════════
// TUTORIEL GUIDÉ — Corsica Poker
// ═══════════════════════════════════════════════════════════════════════

const TUTORIAL_KEY = 'corsicaPokerTutorial';
let tutoStep = -1;
let tutoActive = false;
let bubbleEl = null;
let badgeEl = null;
let pollTimer = null;

// ── Étapes du parcours guidé ──────────────────────────────────────────
const STEPS = [
  {
    target: 'roundSetupOverlay',
    title: '👥 Combien de joueurs ?',
    text: 'Choisissez le nombre de joueurs à la table (4 à 10) avec le sélecteur, puis validez avec la flèche <strong>➜</strong>. Vous pouvez aussi cliquer sur le bouton pour un nombre aléatoire.',
    pos: 'center',
    waitFor: function() {
      var el = document.getElementById('roundSetupOverlay');
      return el && el.classList.contains('hidden');
    }
  },
  {
    target: 'handsLayer',
    title: '🃏 Voici les mains',
    text: 'Chaque joueur reçoit 2 cartes. Le nombre au-dessus est la <strong>cote</strong> : plus elle est élevée, plus le risque est grand mais le gain aussi. Votre mise sera <strong>multipliée par cette cote</strong> si la main gagne seule.',
    pos: 'center',
    advance: 'click'
  },
  {
    target: 'betPanel',
    title: '💰 Choisissez votre mise',
    text: 'Cliquez sur un jeton (<strong>1, 2, 5, 10 ou 20</strong>) pour sélectionner votre mise. Vous pourrez ensuite cliquer sur les mains pour y placer des jetons.',
    pos: 'right',
    advance: 'click'
  },
  {
    target: 'handsLayer',
    title: '👆 Placez votre mise !',
    text: 'Cliquez sur une main pour y miser. Vous pouvez miser sur <strong>plusieurs mains</strong>. La <strong>gomme 🧹</strong> sur un jeton posé permet de retirer la mise.',
    pos: 'center',
    waitFor: function() {
      return document.querySelector('.sq.hasBet') !== null;
    }
  },
  {
    target: 'tieBox',
    title: '🤝 Case Égalité',
    text: 'Misez ici si vous pensez que <strong>deux joueurs ou plus</strong> terminent avec la même combinaison. C\'est un pari bonus indépendant des mains.',
    pos: 'left',
    advance: 'click'
  },
  {
    target: 'btnAdvance',
    title: '✅ Validez vos mises',
    text: 'Cliquez sur <strong>Valider les mises</strong> pour lancer le dévoilement des cartes communes. C\'est parti !',
    pos: 'top',
    waitFor: function() {
      return typeof phase !== 'undefined' && phase !== 'pre';
    }
  },
  {
    target: 'boardCards',
    title: '🂠 Le Flop — 3 cartes',
    text: 'Les 3 premières <strong>cartes communes</strong> sont révélées. Elles sont partagées par tous les joueurs. Les cotes se <strong>recalculent en direct</strong> — certains joueurs sont éliminés !',
    pos: 'bottom',
    advance: 'click'
  },
  {
    target: 'btnAdvance',
    title: '➡️ Turn, puis River',
    text: 'Cliquez pour révéler la <strong>4ème carte</strong> (Turn) puis la <strong>5ème</strong> (River). Un son de suspense accompagne la dernière carte. Les cotes bougent à chaque révélation.',
    pos: 'top',
    waitFor: function() {
      return typeof roundFinished !== 'undefined' && roundFinished === true;
    }
  },
  {
    target: 'handsLayer',
    title: '🏆 Résultat de la manche',
    text: 'La <strong>main gagnante brille en doré</strong>. Si vous aviez misé dessus, vous remportez <strong>mise × cote</strong> ! Les perdants sont grisés. Votre solde est mis à jour en haut.',
    pos: 'center',
    advance: 'click'
  },
  {
    target: 'argentJackpotBox',
    title: '💎 Les Jackpots Progressifs',
    text: 'Trois jackpots (<strong>Argent, Or, Diamant</strong>) grossissent à chaque manche. Quand une mention "Tente le Jackpot" apparaît sur une main, misez 1 jeton pour tenter de remporter toute la cagnotte !',
    pos: 'bottom',
    advance: 'click'
  },
  {
    target: 'settingsBtn',
    title: '⚙️ Paramètres',
    text: 'Ici vous pouvez changer le <strong>thème visuel</strong>, la <strong>couleur du tapis</strong>, l\'<strong>ambiance sonore</strong>, la <strong>langue</strong>... Tout est personnalisable !',
    pos: 'bottom',
    advance: 'click'
  },
  {
    target: 'btnSameTable',
    title: '🔄 Rejouez !',
    text: '« <strong>Même table</strong> » relance avec le même nombre de joueurs. « <strong>Changer de table</strong> » vous permet d\'en choisir un autre. À vous de jouer !',
    pos: 'top',
    advance: 'click'
  },
  {
    target: null,
    title: '🎉 Tutoriel terminé !',
    text: 'Vous connaissez maintenant toutes les bases de <strong>Corsica Poker</strong>. Misez sur les cotes, tentez les jackpots et surtout... bonne chance !',
    pos: 'center',
    advance: 'click',
    isFinal: true
  }
];

// ── Utilitaires ───────────────────────────────────────────────────────
function isTutorialMode() { return tutoActive; }

// ── Activation / Désactivation ────────────────────────────────────────
function activateTutorial() {
  tutoActive = true;
  tutoStep = -1;
  try { sessionStorage.setItem(TUTORIAL_KEY, '1'); } catch(e) {}
  document.body.classList.add('tutorial-mode');
  injectBadge();
  applyTutorialJackpots();

  var splash = document.getElementById('splashScreen');
  if (splash) splash.classList.add('hidden');
  if (typeof showRoundSetup === 'function') showRoundSetup();

  setTimeout(function() { goToStep(0); }, 600);

  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(pollWaitFor, 350);
}

function exitTutorial() {
  tutoActive = false;
  tutoStep = -1;
  try { sessionStorage.removeItem(TUTORIAL_KEY); } catch(e) {}
  document.body.classList.remove('tutorial-mode');
  removeBubble();
  removeBadge();
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }

  ['argentHeatFill','orHeatFill','diamantHeatFill',
   'splashArgentFill','splashOrFill','splashDiamantFill'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.removeProperty('--heat-progress');
  });
  if (typeof updateJackpotHeatBars === 'function') updateJackpotHeatBars();
  if (typeof updateJackpotDisplays === 'function') updateJackpotDisplays();
}

// ── Jackpots simulés ──────────────────────────────────────────────────
function applyTutorialJackpots() {
  var base = { argent: 324.26, or: 2654.78, diamant: 26314.77 };
  function rnd(v) { return (v + Math.random()*v*0.08 - v*0.04).toFixed(2); }
  var vals  = { argent: rnd(base.argent), or: rnd(base.or), diamant: rnd(base.diamant) };
  var heats = { argent: 35+Math.floor(Math.random()*50), or: 20+Math.floor(Math.random()*45), diamant: 5+Math.floor(Math.random()*30) };
  var ids = {
    argent:  { val:['argentJackpotValue','splashJpArgent'],   heat:['argentHeatFill','splashArgentFill'] },
    or:      { val:['orJackpotValue','splashJpOr'],           heat:['orHeatFill','splashOrFill'] },
    diamant: { val:['diamantJackpotValue','splashJpDiamant'], heat:['diamantHeatFill','splashDiamantFill'] }
  };
  for (var k in ids) {
    ids[k].val.forEach(function(id)  { var el = document.getElementById(id); if (el) el.textContent = vals[k]; });
    ids[k].heat.forEach(function(id) { var el = document.getElementById(id); if (el) el.style.setProperty('--heat-progress', heats[k]+'%'); });
  }
}

// ── Badge MODE DÉCOUVERTE ─────────────────────────────────────────────
function injectBadge() {
  if (document.getElementById('tutorialModeBadge')) return;
  badgeEl = document.createElement('div');
  badgeEl.id = 'tutorialModeBadge';
  badgeEl.textContent = '🎓 MODE DÉCOUVERTE';
  document.body.appendChild(badgeEl);
}
function removeBadge() {
  var b = document.getElementById('tutorialModeBadge');
  if (b) b.remove();
  badgeEl = null;
}

// ── Navigation entre étapes ───────────────────────────────────────────
function goToStep(n) {
  if (!tutoActive) return;
  if (n >= STEPS.length) { exitTutorial(); return; }
  tutoStep = n;
  showBubble(STEPS[n]);
}

function nextStep() { goToStep(tutoStep + 1); }

function pollWaitFor() {
  if (!tutoActive || tutoStep < 0 || tutoStep >= STEPS.length) return;
  var step = STEPS[tutoStep];
  if (step.waitFor && step.waitFor()) nextStep();
}

// ── Bulle guidée ──────────────────────────────────────────────────────
function showBubble(step) {
  removeBubble();

  var targetEl = step.target ? document.getElementById(step.target) : null;
  if (step.target && !targetEl) {
    setTimeout(function() { showBubble(step); }, 400);
    return;
  }

  bubbleEl = document.createElement('div');
  bubbleEl.id = 'tutoBubble';
  bubbleEl.className = 'tuto-bubble';
  bubbleEl.innerHTML =
    '<div class="tuto-bubble-close" id="tutoBubbleClose">✕</div>' +
    (targetEl ? '<div class="tuto-bubble-arrow" id="tutoBubbleArrow"></div>' : '') +
    '<div class="tuto-bubble-title">' + step.title + '</div>' +
    '<div class="tuto-bubble-text">' + step.text + '</div>' +
    '<div class="tuto-bubble-footer">' +
      '<span class="tuto-step-count">' + (tutoStep+1) + ' / ' + STEPS.length + '</span>' +
      (step.isFinal
        ? '<button class="tuto-btn-next tuto-btn-finish" id="tutoBtnNext">🎉 Commencer à jouer</button>'
        : step.advance === 'click'
          ? '<button class="tuto-btn-next" id="tutoBtnNext">Compris ➜</button>'
          : '<span class="tuto-wait-hint">⏳ Faites l\'action indiquée…</span>') +
    '</div>';

  document.body.appendChild(bubbleEl);
  positionBubble(targetEl, step.pos);

  // Listeners
  var btnNext = document.getElementById('tutoBtnNext');
  if (btnNext) btnNext.addEventListener('click', function() {
    if (step.isFinal) exitTutorial();
    else nextStep();
  });
  var btnClose = document.getElementById('tutoBubbleClose');
  if (btnClose) btnClose.addEventListener('click', exitTutorial);

  // Animation d'entrée
  requestAnimationFrame(function() {
    if (bubbleEl) bubbleEl.classList.add('tuto-bubble--visible');
  });
}

function positionBubble(targetEl, pos) {
  if (!bubbleEl) return;
  if (!targetEl || pos === 'center') {
    bubbleEl.classList.add('tuto-bubble--center');
    return;
  }

  var r = targetEl.getBoundingClientRect();
  var bw = 380, margin = 16;
  var left, top;
  var arrowClass = '';

  if (pos === 'bottom') {
    left = Math.max(margin, Math.min(window.innerWidth - bw - margin, r.left + r.width/2 - bw/2));
    top = r.bottom + 18;
    arrowClass = 'arrow-top';
  } else if (pos === 'top') {
    left = Math.max(margin, Math.min(window.innerWidth - bw - margin, r.left + r.width/2 - bw/2));
    top = r.top - 14;
    arrowClass = 'arrow-bottom';
    bubbleEl.style.transform = 'translateY(-100%)';
  } else if (pos === 'right') {
    left = r.right + 18;
    top = Math.max(margin, r.top + r.height/2 - 80);
    arrowClass = 'arrow-left';
  } else if (pos === 'left') {
    left = r.left - bw - 18;
    top = Math.max(margin, r.top + r.height/2 - 80);
    arrowClass = 'arrow-right';
    if (left < margin) { left = r.right + 18; arrowClass = 'arrow-left'; }
  }

  bubbleEl.style.left = left + 'px';
  bubbleEl.style.top = top + 'px';
  bubbleEl.style.width = bw + 'px';

  var arrow = document.getElementById('tutoBubbleArrow');
  if (arrow) arrow.className = 'tuto-bubble-arrow ' + arrowClass;
}

function removeBubble() {
  var el = document.getElementById('tutoBubble');
  if (el) el.remove();
  bubbleEl = null;
}

// ── Bouton toggle header ──────────────────────────────────────────────
function updateToggleButton() {
  var btn = document.getElementById('btnToggleTutorial');
  if (!btn) return;
  var splash   = document.getElementById('splashScreen');
  var setup    = document.getElementById('roundSetupOverlay');
  var abandon  = document.getElementById('btnAbandon');
  var splashVisible  = splash  && !splash.classList.contains('hidden');
  var setupVisible   = setup   && !setup.classList.contains('hidden');
  var abandonVisible = abandon && abandon.style.display!=='none' && abandon.offsetParent!==null;
  var roundIsOver    = (typeof roundFinished!=='undefined') ? roundFinished : true;
  var canSwitch = splashVisible || setupVisible || roundIsOver || abandonVisible;
  btn.disabled = !canSwitch;
  btn.style.opacity = canSwitch ? '1' : '0.38';
  btn.style.pointerEvents = canSwitch ? 'auto' : 'none';
}

// ── Init ──────────────────────────────────────────────────────────────
function onReady() {
  var btnDiscovery = document.getElementById('btnDiscovery');
  if (btnDiscovery) {
    btnDiscovery.addEventListener('click', activateTutorial);
  }

  var btnToggle = document.getElementById('btnToggleTutorial');
  if (btnToggle) {
    btnToggle.addEventListener('click', function() {
      if (tutoActive) {
        exitTutorial();
        if (typeof showRoundSetup === 'function') showRoundSetup();
      } else {
        activateTutorial();
      }
    });
  }

  setInterval(updateToggleButton, 500);
  updateToggleButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onReady);
} else {
  onReady();
}
