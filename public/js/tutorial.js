'use strict';

// ── Tutoriel Corsica Poker ────────────────────────────────────────────────────

const TUTORIAL_KEY = 'corsicaPokerTutorial';

const TOOLTIPS = {
  fr: {
    handsLayer:        { text: 'Chaque carte affiche une cote (ex: 6.83). Plus la cote est haute, plus la main est risquée — mais le gain est multiplié par ce coefficient si elle gagne. Cliquez sur une main pour miser dessus. Elle doit gagner SEULE pour que vous soyez payé.', pos: 'center' },
    tieBox:            { text: 'Case Égalité : misez ici si vous pensez que deux joueurs ou plus terminent avec la même combinaison.', pos: 'top' },
    betPanel:          { text: 'Choisissez votre mise en cliquant sur une valeur, puis cliquez sur la main de votre choix ou l\'égalité.', pos: 'right' },
    boardCards:        { text: 'Les cartes communes, révélées progressivement : Flop (3 cartes), Turn (1), River (1). Elles sont communes à tous les joueurs.', pos: 'bottom' },
    boardTitle:        { text: 'Phase en cours. Les cotes évoluent à chaque nouvelle carte révélée.', pos: 'bottom' },
    argentJackpotBox:  { text: 'Jackpot Argent — progressif. Misez 1 jeton pour tenter de remporter ce pot quand une main rare apparaît.', pos: 'bottom' },
    orJackpotBox:      { text: 'Jackpot Or — progressif et rare. Le pot augmente à chaque manche jouée.', pos: 'bottom' },
    diamantJackpotBox: { text: 'Jackpot Diamant — exceptionnel. Les situations qui le déclenchent sont très rares, les gains à la hauteur.', pos: 'bottom' },
    btnAdvance:        { text: 'Révèle la prochaine série de cartes : Flop → Turn → River. Les cotes se recalculent à chaque étape.', pos: 'top' },
    btnSameTable:      { text: 'Relance une nouvelle manche avec le même nombre de joueurs.', pos: 'top' },
    btnChangeTable:    { text: 'Relance une nouvelle manche avec un nombre de joueurs différent.', pos: 'top' },
    toggleLogBtn:      { text: 'Ouvre le journal de la manche : historique de vos mises et gains.', pos: 'bottom' },
    rulesGameBtn:      { text: 'Consulte les règles complètes du jeu.', pos: 'bottom' },
    btnAbandon:        { text: 'Ne pas jouer cette partie — relance immédiatement une nouvelle manche.', pos: 'top' },
    btnToggleTutorial: { text: 'Basculer entre le mode tutoriel (jackpots simulés, explications) et le jeu réel.', pos: 'bottom' },
    lblTotalBets:      { text: 'Total de vos mises en cours sur cette manche.', pos: 'bottom' },
    btnManualHands:    { text: 'Valide le nombre de joueurs choisi et lance la manche.', pos: 'top' },
  },
  en: {
    handsLayer:        { text: 'Each hand shows an odds number (e.g. 6.83). The higher the odds, the riskier the hand — but your winnings are multiplied by that number if it wins. Click a hand to bet on it. It must win OUTRIGHT for you to be paid.', pos: 'center' },
    tieBox:            { text: 'Tie box: bet here if you think two or more players will finish with the same combination.', pos: 'top' },
    betPanel:          { text: 'Choose your stake by clicking a chip value, then click the hand or tie box of your choice.', pos: 'right' },
    boardCards:        { text: 'Community cards, revealed progressively: Flop (3), Turn (1), River (1). They belong to all players.', pos: 'bottom' },
    boardTitle:        { text: 'Current phase. Odds update with every new card revealed.', pos: 'bottom' },
    argentJackpotBox:  { text: 'Silver Jackpot — progressive. Bet 1 chip to try to win this pot when a rare hand appears.', pos: 'bottom' },
    orJackpotBox:      { text: 'Gold Jackpot — progressive and rare. The pot grows every round.', pos: 'bottom' },
    diamantJackpotBox: { text: 'Diamond Jackpot — exceptional. The situations that trigger it are extremely rare — and the rewards match.', pos: 'bottom' },
    btnAdvance:        { text: 'Reveals the next cards: Flop → Turn → River. Odds recalculate at each step.', pos: 'top' },
    btnSameTable:      { text: 'Start a new round with the same number of players.', pos: 'top' },
    btnChangeTable:    { text: 'Start a new round with a different number of players.', pos: 'top' },
    toggleLogBtn:      { text: 'Open the round log: history of your bets and winnings.', pos: 'bottom' },
    rulesGameBtn:      { text: 'Read the full game rules.', pos: 'bottom' },
    btnAbandon:        { text: 'Skip this round — immediately starts a new hand.', pos: 'top' },
    btnToggleTutorial: { text: 'Switch between tutorial mode (simulated jackpots, tips) and real game.', pos: 'bottom' },
    lblTotalBets:      { text: 'Total bets placed in the current round.', pos: 'bottom' },
    btnManualHands:    { text: 'Confirm the selected number of players and start the round.', pos: 'top' },
  },
};


// ── Badge mode tutoriel ───────────────────────────────────────────────────────

function injectTutorialBadge() {
  if (document.getElementById('tutorialModeBadge')) return;
  var badge = document.createElement('div');
  badge.id = 'tutorialModeBadge';
  badge.textContent = '🎓 MODE TUTORIEL';
  document.body.appendChild(badge);
}

// ── Jackpots tutoriel ─────────────────────────────────────────────────────────

function applyTutorialJackpots() {
  var map = {
    argentJackpotValue: '324.26',
    orJackpotValue: '2 654.78',
    diamantJackpotValue: '26 314.77',
    splashJpArgent: '324.26',
    splashJpOr: '2 654.78',
    splashJpDiamant: '26 314.77'
  };
  for (var id in map) {
    var el = document.getElementById(id);
    if (el) el.textContent = map[id];
  }
  // Barres de chaleur aléatoires
  ['argentHeatFill','orHeatFill','diamantHeatFill',
   'splashArgentFill','splashOrFill','splashDiamantFill'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.setProperty('--heat-progress', (20 + Math.floor(Math.random()*65)) + '%');
  });
}



// ── Badge mode tutoriel ───────────────────────────────────────────────────────

function injectTutorialBadge() {
  if (document.getElementById('tutorialModeBadge')) return;
  var badge = document.createElement('div');
  badge.id = 'tutorialModeBadge';
  badge.textContent = '🎓 MODE TUTORIEL';
  document.body.appendChild(badge);
}

// ── Jackpots tutoriel ─────────────────────────────────────────────────────────

function applyTutorialJackpots() {
  // Valeurs simulées réalistes
  var base = { argent: 324.26, or: 2654.78, diamant: 26314.77 };
  // Légère variation aléatoire à chaque passage
  function randomize(v) {
    return (v + Math.random() * v * 0.08 - v * 0.04).toFixed(2);
  }
  var vals = {
    argent:  randomize(base.argent),
    or:      randomize(base.or),
    diamant: randomize(base.diamant)
  };
  // Barres de chaleur aléatoires réalistes :
  // argent : souvent proche, or : moyen, diamant : bas
  var heats = {
    argent:  Math.floor(35 + Math.random() * 50),   // 35-85%
    or:      Math.floor(20 + Math.random() * 45),   // 20-65%
    diamant: Math.floor(5  + Math.random() * 30)    // 5-35%
  };
  var ids = {
    argent:  { val: ['argentJackpotValue','splashJpArgent'],   heat: ['argentHeatFill','splashArgentFill'] },
    or:      { val: ['orJackpotValue',    'splashJpOr'],       heat: ['orHeatFill',    'splashOrFill'] },
    diamant: { val: ['diamantJackpotValue','splashJpDiamant'], heat: ['diamantHeatFill','splashDiamantFill'] }
  };
  for (var k in ids) {
    var v = vals[k]; var h = heats[k];
    ids[k].val.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = v;
    });
    ids[k].heat.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.setProperty('--heat-progress', h + '%');
    });

  }
}


// ── Gestion état bouton toggle ────────────────────────────────────────────────

function updateToggleButton() {
  var btn = document.getElementById('btnToggleTutorial');
  if (!btn) return;
  var splash   = document.getElementById('splashScreen');
  var setup    = document.getElementById('roundSetupOverlay');
  var abandon  = document.getElementById('btnAbandon');
  var splashVisible  = splash  && !splash.classList.contains('hidden');
  var setupVisible   = setup   && !setup.classList.contains('hidden');
  var abandonVisible = abandon && abandon.style.display !== 'none'
                    && abandon.offsetParent !== null;
  var roundIsOver    = (typeof roundFinished !== 'undefined') ? roundFinished : true;
  var canSwitch = splashVisible || setupVisible || roundIsOver || abandonVisible;
  btn.disabled = !canSwitch;
  btn.style.opacity = canSwitch ? '1' : '0.38';
  btn.style.pointerEvents = canSwitch ? 'auto' : 'none';
}

// ── Détection du mode tutoriel ────────────────────────────────────────────────

function isTutorialMode() {
  try { return sessionStorage.getItem(TUTORIAL_KEY) === '1'; } catch(_) { return false; }
}

function activateTutorial() {
  try { sessionStorage.setItem(TUTORIAL_KEY, '1'); } catch(_) {}
  document.body.classList.add('tutorial-mode');
  attachTooltips();
  applyTutorialJackpots();
  updateToggleButton();
  injectTutorialBadge();
  // Aller directement au choix des joueurs (pas la page d'accueil du code)
  if (typeof showRoundSetup === 'function') showRoundSetup();
}


function exitTutorial() {
  try { sessionStorage.removeItem(TUTORIAL_KEY); } catch(_) {}
  document.body.classList.remove('tutorial-mode');
  if (typeof hideTooltip === 'function') hideTooltip();
  var badge = document.getElementById('tutorialModeBadge');
  if (badge) badge.remove();
  updateToggleButton();
  // Restaurer les barres de chaleur réelles (effacer les valeurs CSS du tutoriel)
  ['argentHeatFill','orHeatFill','diamantHeatFill',
   'splashArgentFill','splashOrFill','splashDiamantFill'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.removeProperty('--heat-progress');
  });
  // Forcer le rafraîchissement avec l'état réel
  if (typeof updateJackpotHeatBars === 'function') updateJackpotHeatBars();
  if (typeof updateJackpotDisplays === 'function') updateJackpotDisplays();
  // Aller au choix des joueurs en mode réel
  if (typeof showRoundSetup === 'function') showRoundSetup();
}

// ── Tooltip engine ────────────────────────────────────────────────────────────

let tooltipEl = null;
let activeTarget = null;
let activePos = 'bottom';
let hideTimer = null;

function createTooltipEl() {
  const el = document.createElement('div');
  el.id = 'tutorialTooltip';
  el.className = 'tutorial-tooltip';
  el.setAttribute('role', 'tooltip');
  document.body.appendChild(el);
  return el;
}

function showTooltip(target, text, pos) {
  if (!tooltipEl) tooltipEl = createTooltipEl();
  clearTimeout(hideTimer);
  activeTarget = target;
  activePos = pos;
  tooltipEl.textContent = text;
  if (pos === 'center') {
    tooltipEl.className = 'tutorial-tooltip tutorial-tooltip--center tutorial-tooltip--visible';
  } else {
    tooltipEl.className = 'tutorial-tooltip tutorial-tooltip--visible';
    positionTooltip(target, pos);
  }
}

function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.classList.remove('tutorial-tooltip--visible');
  activeTarget = null;
}

function positionTooltip(target, pos) {
  const r   = target.getBoundingClientRect();
  const gap = 10;
  const tw  = tooltipEl.offsetWidth  || 260;
  const th  = tooltipEl.offsetHeight || 60;
  let top, left;

  if      (pos === 'top')    { top = r.top - th - gap;              left = r.left + r.width / 2 - tw / 2; }
  else if (pos === 'bottom') { top = r.bottom + gap;                 left = r.left + r.width / 2 - tw / 2; }
  else if (pos === 'right')  { top = r.top + r.height / 2 - th / 2; left = r.right + gap; }
  else                       { top = r.top + r.height / 2 - th / 2; left = r.left - tw - gap; }

  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  top  = Math.max(8, top);

  tooltipEl.style.top  = top  + 'px';
  tooltipEl.style.left = left + 'px';
}

function attachTooltips() {
  const currentLang = (typeof lang !== 'undefined' ? lang : 'fr');
  const tips = TOOLTIPS[currentLang] || TOOLTIPS.fr;

  Object.entries(tips).forEach(function(entry) {
    var id = entry[0], cfg = entry[1];
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('mouseenter', function() {
      if (!isTutorialMode()) return;
      showTooltip(el, cfg.text, cfg.pos);
    });
    el.addEventListener('mouseleave', function() {
      if (!isTutorialMode()) return;
      hideTimer = setTimeout(hideTooltip, 200);
    });
    el.addEventListener('focus', function() {
      if (!isTutorialMode()) return;
      showTooltip(el, cfg.text, cfg.pos);
    });
    el.addEventListener('blur', function() {
      if (!isTutorialMode()) return;
      hideTooltip();
    });
  });

  window.addEventListener('scroll', function() { if (activeTarget) positionTooltip(activeTarget, activePos); }, { passive: true });
  window.addEventListener('resize', function() { if (activeTarget) positionTooltip(activeTarget, activePos); }, { passive: true });

  // Tooltip dynamique sur les mains individuelles
  var handsLayerEl = document.getElementById('handsLayer');
  if (handsLayerEl) {
    handsLayerEl.addEventListener('mouseover', function(e) {
      if (!isTutorialMode()) return;
      var handEl = e.target.closest('.hand');
      if (!handEl) return;
      var allHands = Array.from(handsLayerEl.querySelectorAll('.hand'));
      var idx = allHands.indexOf(handEl);
      var oddsVal = '—';
      if (typeof hands !== 'undefined' && hands[idx] && hands[idx].oddsStr) {
        oddsVal = hands[idx].oddsStr;
      }
      var currentLang = (typeof lang !== 'undefined' ? lang : 'fr');
      var text = currentLang === 'en'
        ? 'Each hand shows an odds number (e.g. ' + oddsVal + '). The higher the odds, the riskier the hand. Your bet is multiplied by that number if the hand wins. Click during the game phase to place a bet. The hand must win OUTRIGHT — otherwise the Tie box wins.'
        : 'Chaque main affiche une cote (ex : ' + oddsVal + '). Plus la cote est haute, plus la main est risquée. La mise est multipliée par ce coefficient si la main gagne. Cliquez dans la phase de jeu pour miser. La main doit gagner SEULE sinon c\'est la case égalité qui gagne.';
      showTooltip(handEl, text, 'center');
    });
    handsLayerEl.addEventListener('mouseleave', function() {
      if (!isTutorialMode()) return;
      hideTimer = setTimeout(hideTooltip, 200);
    });
  }

  // Délégation pour les éléments .jackpot-call (créés dynamiquement)
  var jpTexts = {
    fr: {
      argent:  'Tente le Jackpot Argent ! Si cette main gagne, tu remportes le Jackpot Argent.',
      or:      'Tente le Jackpot Or ! Si cette main gagne, tu remportes le Jackpot Or.',
      diamant: 'Tente le Jackpot Diamant ! Si cette main gagne, tu remportes le Jackpot Diamant.'
    },
    en: {
      argent:  'Try the Silver Jackpot! If this hand wins, you take the Silver Jackpot.',
      or:      'Try the Gold Jackpot! If this hand wins, you take the Gold Jackpot.',
      diamant: 'Try the Diamond Jackpot! If this hand wins, you take the Diamond Jackpot.'
    }
  };
  var jpt = jpTexts[currentLang] || jpTexts.fr;
  document.addEventListener('mouseover', function(e) {
    if (!isTutorialMode()) return;
    var el = e.target;
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains('jackpot-call')) {
        var jtype = (el.dataset.jackpotType || 'argent').toLowerCase();
        showTooltip(el, jpt[jtype] || jpt.argent, 'top');
        return;
      }
      el = el.parentElement;
    }
  });
  document.addEventListener('mouseout', function(e) {
    if (!isTutorialMode()) return;
    var el = e.target;
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains('jackpot-call')) {
        hideTimer = setTimeout(hideTooltip, 200);
        return;
      }
      el = el.parentElement;
    }
  });
}


// ── Init ──────────────────────────────────────────────────────────────────────

(function initTutorial() {
  function onReady() {
    var btnTutorial = document.getElementById('btnTutorial');
    if (btnTutorial) {
      btnTutorial.addEventListener('click', activateTutorial);
    }

    // Bouton header toggle tutoriel/réel
    var btnToggle = document.getElementById('btnToggleTutorial');
    if (btnToggle) {
      btnToggle.addEventListener('click', function() {
        if (isTutorialMode()) { exitTutorial(); } else { activateTutorial(); }
      });
    }

    // Mettre à jour l'état du bouton toggle au fil du jeu
    document.addEventListener('roundFinished', updateToggleButton);
    document.addEventListener('roundStarted', updateToggleButton);
    setInterval(updateToggleButton, 500); // polling léger

    if (!isTutorialMode()) return;

    document.body.classList.add('tutorial-mode');
    attachTooltips();
    applyTutorialJackpots();
    injectTutorialBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
