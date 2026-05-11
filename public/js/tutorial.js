'use strict';

// ── Tutoriel Corsica Poker ────────────────────────────────────────────────────

const TUTORIAL_KEY = 'corsicaPokerTutorial';

const TOOLTIPS = {
  fr: {
    handsLayer:        { text: 'Chaque carte affiche une cote (ex: 6.83). Plus la cote est haute, plus la main est risquée — mais le gain est multiplié par ce chiffre si elle gagne. Cliquez sur une main pour miser dessus. Elle doit gagner SEULE pour que vous soyez payé.', pos: 'center' },
    tieBox:            { text: 'Case Égalité : misez ici si vous pensez que deux joueurs ou plus terminent avec la même combinaison.', pos: 'top' },
    betPanel:          { text: 'Choisissez votre mise en cliquant sur une valeur, puis cliquez sur la main de votre choix ou l\'égalité.', pos: 'right' },
    boardCards:        { text: 'Les cartes communes, révélées progressivement : Flop (3 cartes), Turn (1), River (1). Elles appartiennent à tous les joueurs.', pos: 'bottom' },
    boardTitle:        { text: 'Phase en cours. Les cotes évoluent à chaque nouvelle carte révélée.', pos: 'bottom' },
    argentJackpotBox:  { text: 'Jackpot Argent — progressif. Misez 1 jeton pour tenter de remporter ce pot quand une main rare apparaît.', pos: 'bottom' },
    orJackpotBox:      { text: 'Jackpot Or — progressif et rare. Le pot augmente à chaque manche jouée.', pos: 'bottom' },
    diamantJackpotBox: { text: 'Jackpot Diamant — exceptionnel. Les situations qui le déclenchent sont très rares, les gains à la hauteur.', pos: 'bottom' },
    btnAdvance:        { text: 'Révèle la prochaine série de cartes : Flop → Turn → River. Les cotes se recalculent à chaque étape.', pos: 'top' },
    btnSameTable:      { text: 'Relance une nouvelle manche avec les mêmes joueurs.', pos: 'top' },
    btnChangeTable:    { text: 'Relance une nouvelle manche avec d\'autres joueurs.', pos: 'top' },
    toggleLogBtn:      { text: 'Ouvre le journal de la manche : historique de vos mises et gains.', pos: 'bottom' },
    rulesGameBtn:      { text: 'Consulte les règles complètes du jeu.', pos: 'bottom' },
    btnAbandon:        { text: 'Ne pas jouer cette partie — relance immédiatement une nouvelle manche.', pos: 'top' },
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
    btnSameTable:      { text: 'Start a new round with the same players.', pos: 'top' },
    btnChangeTable:    { text: 'Start a new round with different players.', pos: 'top' },
    toggleLogBtn:      { text: 'Open the round log: history of your bets and winnings.', pos: 'bottom' },
    rulesGameBtn:      { text: 'Read the full game rules.', pos: 'bottom' },
    btnAbandon:        { text: 'Skip this round — immediately starts a new hand.', pos: 'top' },
    lblTotalBets:      { text: 'Total bets placed in the current round.', pos: 'bottom' },
    btnManualHands:    { text: 'Confirm the selected number of players and start the round.', pos: 'top' },
  },
};

// ── Détection du mode tutoriel ────────────────────────────────────────────────

function isTutorialMode() {
  try { return sessionStorage.getItem(TUTORIAL_KEY) === '1'; } catch(_) { return false; }
}

function activateTutorial() {
  try { sessionStorage.setItem(TUTORIAL_KEY, '1'); } catch(_) {}

  // Initialiser le mode tutoriel immédiatement sur la page courante
  if (!document.body.classList.contains('tutorial-mode')) {
    document.body.classList.add('tutorial-mode');
    injectReturnBanner();
    attachTooltips();
  }

  const btn = document.getElementById('btnStart');
  if (btn) btn.click();

  // Re-attache le tooltip de btnManualHands après l'animation d'entrée de l'overlay (720ms)
  // pour contourner les conflits de compositing avec backdrop-filter.
  setTimeout(function() {
    var currentLang = (typeof lang !== 'undefined' ? lang : 'fr');
    var tips = TOOLTIPS[currentLang] || TOOLTIPS.fr;
    var el = document.getElementById('btnManualHands');
    var cfg = tips['btnManualHands'];
    if (el && cfg) {
      el.addEventListener('mouseenter', function() { showTooltip(el, cfg.text, cfg.pos); });
      el.addEventListener('mouseleave', function() { hideTimer = setTimeout(hideTooltip, 200); });
    }
  }, 800);
}

function exitTutorial() {
  try { sessionStorage.removeItem(TUTORIAL_KEY); } catch(_) {}
  window.location.href = window.location.pathname;
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
    el.addEventListener('mouseenter', function() { showTooltip(el, cfg.text, cfg.pos); });
    el.addEventListener('mouseleave', function() { hideTimer = setTimeout(hideTooltip, 200); });
    el.addEventListener('focus',      function() { showTooltip(el, cfg.text, cfg.pos); });
    el.addEventListener('blur',       function() { hideTooltip(); });
  });

  window.addEventListener('scroll', function() { if (activeTarget) positionTooltip(activeTarget, activePos); }, { passive: true });
  window.addEventListener('resize', function() { if (activeTarget) positionTooltip(activeTarget, activePos); }, { passive: true });

  // Tooltip dynamique sur les mains individuelles
  var handsLayerEl = document.getElementById('handsLayer');
  if (handsLayerEl) {
    handsLayerEl.addEventListener('mouseover', function(e) {
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
        : 'Chaque main affiche une cote (ex : ' + oddsVal + '). Plus la cote est haute, plus la main est risquée. La mise est multipliée par ce chiffre si la main gagne. Cliquez dans la phase de jeu pour miser. La main doit gagner SEULE sinon c\'est la case égalité qui gagne.';
      showTooltip(handEl, text, 'center');
    });
    handsLayerEl.addEventListener('mouseleave', function() {
      hideTimer = setTimeout(hideTooltip, 200);
    });
  }
}

// ── Bandeau retour ────────────────────────────────────────────────────────────

function injectReturnBanner() {
  if (document.getElementById('tutorialBanner')) return;
  var currentLang = (typeof lang !== 'undefined' ? lang : 'fr');
  var modeLabel  = currentLang === 'en' ? '🎓 Tutorial mode' : '🎓 Mode tutoriel';
  var exitLabel  = currentLang === 'en' ? '← Back to real game' : '← Retour au jeu réel';

  var banner = document.createElement('div');
  banner.id = 'tutorialBanner';
  banner.className = 'tutorial-banner';
  banner.innerHTML = '<span class="tutorial-banner__label">' + modeLabel + '</span><button type="button" class="tutorial-banner__exit" id="btnExitTutorial">' + exitLabel + '</button>';
  document.body.prepend(banner);
  document.getElementById('btnExitTutorial').addEventListener('click', exitTutorial);
}

// ── Init ──────────────────────────────────────────────────────────────────────

(function initTutorial() {
  function onReady() {
    var btnTutorial = document.getElementById('btnTutorial');
    if (btnTutorial) {
      btnTutorial.addEventListener('click', activateTutorial);
    }

    if (!isTutorialMode()) return;

    document.body.classList.add('tutorial-mode');
    injectReturnBanner();
    attachTooltips();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
