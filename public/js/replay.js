// ==================================================
// REPLAY — Revoir la dernière manche
// Utilise les renderers du jeu réel, sans animations
// ==================================================

(function() {

  var _snapshots = [];
  var _cursor    = 0;
  var _active    = false;
  var _saved     = null;

  // ── Capture ───────────────────────────────────────────────
  window.captureReplaySnapshot = function(ph, boardState, handsState, tieBetState, winnersArr) {
    _snapshots.push({
      phase:   ph,
      board:   (boardState || []).map(function(c){ return c ? {r:c.r,s:c.s} : null; }),
      hands:   JSON.parse(JSON.stringify(handsState  || [])),
      tieBet:  JSON.parse(JSON.stringify(tieBetState || {})),
      winners: Array.isArray(winnersArr) ? winnersArr.slice() : []
    });
  };

  window.resetReplaySnapshots = function() { _snapshots = []; };

  // ── Traductions ────────────────────────────────────────────
  function tr(key) {
    var l = (typeof lang !== 'undefined') ? lang : 'fr';
    var d = {
      fr: { reviewRound:'Revoir la partie', close:'Fermer' },
      en: { reviewRound:'Review round',     close:'Close'  }
    };
    return (d[l] || d.fr)[key] || key;
  }

  // ── Bouton "Revoir la partie" ─────────────────────────────
  function ensureBtn() {
    if (document.getElementById('btnReviewRound')) return;
    var btn = document.createElement('button');
    btn.id = 'btnReviewRound';
    btn.type = 'button';
    btn.className = 'btn-review-round';
    btn.addEventListener('click', openReplay);
    document.body.appendChild(btn);
  }

  function updateBtn() {
    var btn = document.getElementById('btnReviewRound');
    if (!btn) { ensureBtn(); btn = document.getElementById('btnReviewRound'); }
    if (!btn) return;
    btn.textContent = tr('reviewRound');
    var show = !!(typeof roundFinished !== 'undefined' && roundFinished && _snapshots.length > 0 && !_active);
    btn.style.display       = show ? 'flex' : 'none';
    btn.style.visibility    = show ? 'visible' : 'hidden';
    btn.style.pointerEvents = show ? 'auto' : 'none';
  }

  // ── Sauvegarde / restauration de l'état du jeu ───────────
  function saveState() {
    _saved = {
      phase:         phase,
      board:         board.slice(),
      hands:         JSON.parse(JSON.stringify(hands)),
      tieBet:        JSON.parse(JSON.stringify(tieBet)),
      roundFinished: roundFinished
    };
  }

  function restoreState() {
    if (!_saved) return;
    phase = _saved.phase;
    board.length = 0; _saved.board.forEach(function(c){ board.push(c); });
    hands.length = 0; _saved.hands.forEach(function(h){ hands.push(h); });
    Object.assign(tieBet, _saved.tieBet);
    // Restaurer roundFinished via la bonne fonction si disponible
    if (typeof setRoundFinished === 'function') setRoundFinished(_saved.roundFinished, 'replay/restore');
    else roundFinished = _saved.roundFinished;
    _saved = null;
  }

  // ── Injection d'un snapshot dans l'état du jeu ───────────
  function applySnapshot(snap) {
    // Phase
    phase = snap.phase;

    // Board
    board.length = 0;
    snap.board.forEach(function(c){ board.push(c); });

    // Mains — copie profonde pour ne pas altérer le snapshot
    hands.length = 0;
    snap.hands.forEach(function(h, i){
      var copy = JSON.parse(JSON.stringify(h));
      // Marquer les gagnants pour que renderHands affiche les bonnes classes
      copy._replayWinner = snap.winners.indexOf(i) >= 0;
      hands.push(copy);
    });

    // TieBet
    Object.assign(tieBet, JSON.parse(JSON.stringify(snap.tieBet)));

    // Forcer roundFinished à true : renderHands affiche winner/loser
    if (typeof setRoundFinished === 'function') setRoundFinished(true, 'replay/apply');
    else roundFinished = true;

    // Pré-marquer les gagnants sur le DOM AVANT renderHands
    // pour que isFinalLoser = !wrap.classList.contains('winner') soit correct
    var hl = document.getElementById('handsLayer');
    if (hl) {
      Array.prototype.forEach.call(hl.children, function(node, i) {
        var isRiver  = snap.phase === 'river';
        var isWinner = snap.winners.indexOf(i) >= 0;
        // River : marquer gagnant/perdant. Autres phases : tout visible
        node.classList.toggle('winner',      isRiver && isWinner);
        node.classList.toggle('final-loser', false); // sera géré par renderHands
        if (!isRiver) node.classList.remove('winner', 'final-loser', 'hand-final-loser');
      });
    }
  }

  // ── Rendu d'un snapshot ───────────────────────────────────
  function renderSnap(snap) {
    applySnapshot(snap);
    renderBoard();
    renderHands();

    // Après renderHands : corriger les classes pour les phases non-river
    var hlPost = document.getElementById('handsLayer');
    if (hlPost) {
      Array.prototype.forEach.call(hlPost.children, function(node, i) {
        var isRiver  = snap.phase === 'river';
        var isWinner = snap.winners.indexOf(i) >= 0;
        if (!isRiver) {
          // Hors river : toutes les mains visibles normalement
          node.classList.remove('winner', 'final-loser', 'hand-final-loser', 'hand-replay-dim');
          node.style.opacity = '';
          node.querySelectorAll('.hand-inner,.hand-main,.hand-cards,.card,.squares,.hand-odds,.hand-sub')
            .forEach(function(el){ el.style.opacity = ''; el.style.filter = ''; });
        } else {
          // River : gagnant en pleine lumière, perdants atténués
          node.classList.toggle('winner', isWinner);
          node.classList.toggle('hand-final-loser', !isWinner && snap.winners.length > 0);
        }
      });
    }

    // Tie
    var tieBox = document.getElementById('tieBox');
    if (tieBox) {
      var isTieWinner = snap.winners.length >= 2;
      tieBox.classList.toggle('tie-win', snap.phase === 'river' && isTieWinner);
      tieBox.classList.toggle('tie-lose', snap.phase === 'river' && !isTieWinner);
    }

    // Désactiver toutes les interactions (cases de mise)
    var gameTable = document.getElementById('gameTable');
    if (gameTable) {
      gameTable.querySelectorAll('.sq, .hand-odds, .tie-value').forEach(function(el){
        el.style.pointerEvents = 'none';
        el.classList.add('replay-no-interact');
      });
    }

    updateNavBar(snap);
  }

  // ── Navigation ────────────────────────────────────────────
  function navigate(dir) {
    var next = _cursor + dir;
    if (next < 0 || next >= _snapshots.length) return;
    _cursor = next;
    renderSnap(_snapshots[_cursor]);
  }

  function updateNavBar(snap) {
    var prev = document.getElementById('replayNavPrev');
    var next = document.getElementById('replayNavNext');
    var lbl  = document.getElementById('replayNavLabel');
    if (prev) prev.disabled = (_cursor <= 0);
    if (next) next.disabled = (_cursor >= _snapshots.length - 1);
    if (lbl) {
      var phaseNames = {
        pre: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River'
      };
      if (typeof I18N !== 'undefined' && typeof lang !== 'undefined' && I18N[lang] && I18N[lang].phase) {
        phaseNames = I18N[lang].phase;
      }
      lbl.textContent = (phaseNames[snap.phase] || snap.phase) + ' — ' + (_cursor + 1) + '/' + _snapshots.length;
    }
  }

  // ── Barre de navigation ───────────────────────────────────
  function buildNavBar() {
    var old = document.getElementById('replayNavBar');
    if (old) old.remove();

    var bar = document.createElement('div');
    bar.id = 'replayNavBar';
    bar.className = 'replay-nav-bar';

    var prev = document.createElement('button');
    prev.id = 'replayNavPrev'; prev.type = 'button'; prev.className = 'replay-nav-btn';
    prev.innerHTML = '&#8592;';
    prev.addEventListener('click', function(){ navigate(-1); });

    var lbl = document.createElement('span');
    lbl.id = 'replayNavLabel'; lbl.className = 'replay-nav-label';

    var next = document.createElement('button');
    next.id = 'replayNavNext'; next.type = 'button'; next.className = 'replay-nav-btn';
    next.innerHTML = '&#8594;';
    next.addEventListener('click', function(){ navigate(1); });

    var close = document.createElement('button');
    close.id = 'replayNavClose'; close.type = 'button'; close.className = 'replay-nav-close';
    close.textContent = tr('close');
    close.addEventListener('click', closeReplay);

    bar.appendChild(prev);
    bar.appendChild(lbl);
    bar.appendChild(next);
    bar.appendChild(close);
    document.body.appendChild(bar);
  }

  // ── Ouvrir / fermer ───────────────────────────────────────
  function openReplay() {
    if (!_snapshots.length) return;
    _active  = true;
    _cursor  = _snapshots.length - 1; // Commencer à la river

    saveState();
    document.body.classList.add('replay-mode');
    buildNavBar();
    renderSnap(_snapshots[_cursor]);
    updateBtn();
  }

  function closeReplay() {
    _active = false;

    // Nettoyer les classes replay
    var hl = document.getElementById('handsLayer');
    if (hl) {
      Array.prototype.forEach.call(hl.children, function(node){
        node.classList.remove('hand-replay-dim');
      });
    }
    var gameTable = document.getElementById('gameTable');
    if (gameTable) {
      gameTable.querySelectorAll('.replay-no-interact').forEach(function(el){
        el.style.pointerEvents = '';
        el.classList.remove('replay-no-interact');
      });
    }

    var bar = document.getElementById('replayNavBar');
    if (bar) bar.remove();

    document.body.classList.remove('replay-mode');

    restoreState();
    renderBoard();
    renderHands();

    updateBtn();
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    ensureBtn();
    setInterval(updateBtn, 300);
    document.addEventListener('keydown', function(e) {
      if (!_active) return;
      if (e.key === 'ArrowLeft')  navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'Escape')     closeReplay();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window._replayOpen  = openReplay;
  window._replayClose = closeReplay;

})();
