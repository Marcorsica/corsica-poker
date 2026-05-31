'use strict';

const express  = require('express');
const crypto   = require('crypto');
const path     = require('path');
const fs       = require('fs');
const audit    = require('../../audit/auditLogger');

const { cardCode, deckCodes, cloneCard, codeToCard, sha256Hex,
        deterministicShuffle, computeDeckCommitment,
        buildFullDeckForExtremeCase } = require('../utils/cards');
const { phaseKey, computeOdds, getResult, oddsValue, rawOddsValue,
        buildRtpSummary }             = require('../utils/odds');
const { logServer }                   = require('../utils/logger');
const { jackpotSnapshot, claimJackpot, jackpotTierFromRawOdds } = require('../services/jackpots');

// ── Cas extrêmes ───────────────────────────────────────────────────────────────

const EXTREME_CASES_FILE = path.join(__dirname, '..', '..', 'test-data', 'extreme-cases.json');
let extremeCasesLibrary  = [];
try {
  extremeCasesLibrary = JSON.parse(fs.readFileSync(EXTREME_CASES_FILE, 'utf8'));
} catch (err) {
  extremeCasesLibrary = [];
  console.error('EXTREME CASES LOAD ERROR', err);
}

function getExtremeCaseById(caseId) {
  return extremeCasesLibrary.find(e => String(e.id) === String(caseId)) || null;
}

function applyExtremeCaseOddsOverride(game, phase, odds) {
  const cfg    = game.extremeCaseId ? getExtremeCaseById(game.extremeCaseId) : null;
  const phCfg  = cfg?.phases?.[phase];
  const target = cfg?.target;
  if (!phCfg || !target || !odds) return odds;

  const rawOdds   = Number(phCfg.rawOdds || 0);
  const forcedProb = rawOdds > 0 ? (1 / rawOdds) : 0;

  if (target.kind === 'tie') {
    odds.tieProb     = forcedProb;
    odds.fairTieOdds = rawOdds > 0 ? rawOdds : 0;
    return odds;
  }
  const idx = Number(target.index);
  if (Array.isArray(odds.hands) && odds.hands[idx]) {
    odds.hands[idx].soloProb     = forcedProb;
    odds.hands[idx].fairSoloOdds = rawOdds > 0 ? rawOdds : 0;
  }
  return odds;
}


// ── Configuration fixe du mode découverte ───────────────────────────────────
// Objectif : cartes joueurs fixes et crédibles, issues de la capture validée,
// board tiré normalement, cotes calculées réellement par le moteur.
// Ordre des mains : haut-centre puis sens horaire.
const DISCOVERY_FIXED_CASE = {
  id: 'discovery-fixed-user-screen-v2',
  playerCount: 9,
  hands: [
    ['AD', '6H'], // haut centre
    ['8C', '7S'], // haut droite
    ['8S', '6C'], // milieu droite
    ['3D', 'QC'], // bas droite - éligible jackpot diamant
    ['QH', '3C'], // bas droit / centre
    ['6D', '6S'], // bas centre
    ['JD', '4H'], // bas gauche
    ['AC', '8H'], // milieu gauche
    ['2D', '2H'], // haut gauche
  ],
};

function isDiscoveryStartRequest(req) {
  return String(req.query.discovery || '').trim() === '1';
}

// ── Fairness ──────────────────────────────────────────────────────────────────

function buildFairnessReveal(game) {
  return {
    gameId:  game.gameId,
    settled: Boolean(game.fairnessRevealedAt),
    fairness: {
      algorithm:          'sha256-deterministic-sort-v1',
      serverSeedHash:     game.serverSeedHash,
      serverSeed:         game.fairnessRevealedAt ? game.serverSeed : null,
      clientSeed:         game.clientSeed,
      nonce:              game.nonce,
      deckCommitment:     game.deckCommitment,
      fairnessRevealedAt: game.fairnessRevealedAt,
      revealedDeck:       game.fairnessRevealedAt ? deckCodes(game.fullDeck) : null,
      revealedHands:      game.fairnessRevealedAt ? game.hands.map(h => h.map(cardCode)) : null,
      revealedBoard:      game.fairnessRevealedAt ? deckCodes(game.board) : null,
      verification:       game.fairnessRevealedAt ? 'reproducible' : 'pending_settlement',
    },
  };
}

// ── Initialisation des mises serveur ─────────────────────────────────────────

function initServerBets(playerCount) {
  return {
    hands: Array.from({ length: playerCount }, () => ({ pre: 0, flop: 0, turn: 0 })),
    tie:   { pre: 0, flop: 0, turn: 0 },
  };
}

// ── Router ─────────────────────────────────────────────────────────────────────

const router = express.Router();

router.get('/test/extreme-cases', (req, res) => {
  const items = (extremeCasesLibrary || []).map(entry => ({
    id:          entry.id,
    title:       entry.title,
    description: entry.description,
    playerCount: Number(entry.playerCount || 10),
    target:      entry.target || null,
    phases:      entry.phases || {},
  }));
  res.json({ cases: items });
});

router.get('/start', (req, res) => {
  const games            = req.app.locals.games;
  const gameId           = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const requestedPlayers = Math.max(4, Math.min(10, Number(req.query.players) || 10));
  const discoveryMode    = isDiscoveryStartRequest(req);
  const requestedCaseId  = String(req.query.testCaseId || '').trim();
  const extremeCase      = discoveryMode
    ? DISCOVERY_FIXED_CASE
    : (requestedCaseId ? getExtremeCaseById(requestedCaseId) : null);
  const playerCount      = discoveryMode
    ? DISCOVERY_FIXED_CASE.playerCount
    : (extremeCase ? Number(extremeCase.playerCount || requestedPlayers) : requestedPlayers);

  const serverSeed     = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = sha256Hex(serverSeed);
  const clientSeed     = String(req.query.clientSeed || `client-${gameId.slice(0, 8)}`);
  const nonce          = Number.isFinite(Number(req.query.nonce)) ? Number(req.query.nonce) : 0;

  let fullDeck, deck, hands;

  if (discoveryMode) {
    // En découverte, seules les cartes des joueurs sont figées.
    // Le board reste tiré depuis un paquet mélangé, sans les cartes déjà utilisées.
    hands = DISCOVERY_FIXED_CASE.hands.map(h => h.map(codeToCard));
    const used = new Set();
    for (const hand of hands) for (const card of hand) used.add(cardCode(card));
    fullDeck = deterministicShuffle(require('../utils/cards').createDeck(), { serverSeed, clientSeed, nonce, gameId });
    deck = fullDeck.filter(c => !used.has(cardCode(c)));
  } else if (extremeCase) {
    fullDeck = buildFullDeckForExtremeCase(extremeCase);
    const forcedBoard = (extremeCase.board || []).map(codeToCard);
    const usedBoard   = new Set(forcedBoard.map(cardCode));
    deck  = fullDeck.filter(c => !usedBoard.has(cardCode(c)))
      .concat([...forcedBoard].reverse().map(cloneCard));
    hands = (extremeCase.hands || []).map(h => h.map(codeToCard));
  } else {
    fullDeck = deterministicShuffle(require('../utils/cards').createDeck(), { serverSeed, clientSeed, nonce, gameId });
    deck     = fullDeck.slice();
    hands    = [];
    for (let i = 0; i < playerCount; i++) hands.push([deck.pop(), deck.pop()]);
  }

  const deckCommitment = computeDeckCommitment(fullDeck);

  games[gameId] = {
    gameId, serverSeed, serverSeedHash, clientSeed, nonce, deckCommitment,
    fullDeck, deck, hands, board: [], oddsHistory: {}, jackpotSnapshots: [],
    createdAt: new Date().toISOString(), fairnessRevealedAt: null,
    extremeCaseId: extremeCase ? String(extremeCase.id) : null,
    discoveryMode,
    // ── SÉCURITÉ : mises enregistrées côté serveur ──────────────────────────
    serverBets: initServerBets(playerCount),
  };

  audit.startHand({ gameId, playerCount, initialBalance: null, serverSeedHash, createdAt: games[gameId].createdAt });
  audit.setRNG(gameId, {
    algorithm: discoveryMode ? 'discovery-fixed-real-odds-v1' : (extremeCase ? 'preloaded-extreme-case-v1' : 'sha256 deterministic shuffle'),
    serverSeedHash, clientSeed, nonce, deckCommitment,
    dealtHands: hands.map(h => h.map(cardCode)),
  });
  logServer('round.start', 'Nouvelle manche démarrée', { gameId, playerCount, extremeCaseId: extremeCase?.id || null, discoveryMode });
  audit.logAction(gameId, { type: 'hand_start', playerCount });

  res.json({
    gameId, hands, board: [],
    extremeCaseId: extremeCase?.id || null,
    discoveryMode,
    fairness: { serverSeedHash, clientSeed, nonce, deckCommitment },
  });
});

router.get('/next', (req, res) => {
  const games  = req.app.locals.games;
  const gameId = String(req.query.gameId || '');
  const game   = games[gameId];
  if (!game) {
    logServer('round.next.missing', 'Partie introuvable', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  if      (game.board.length === 0) game.board.push(game.deck.pop(), game.deck.pop(), game.deck.pop());
  else if (game.board.length === 3) game.board.push(game.deck.pop());
  else if (game.board.length === 4) game.board.push(game.deck.pop());

  const phase = phaseKey(game.board.length);
  logServer('round.next', 'Street révélée', { gameId, phase, boardLength: game.board.length });
  audit.logStreet(gameId, phase, game.board.slice());
  audit.logAction(gameId, { type: 'street_reveal', phase, boardLength: game.board.length });

  res.json({ gameId, board: game.board, phase });
});

router.get('/odds', (req, res) => {
  const games  = req.app.locals.games;
  const gameId = String(req.query.gameId || '');
  const game   = games[gameId];
  if (!game) {
    logServer('odds.missing', 'Partie introuvable pour calcul des cotes', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }
  try {
    let odds  = computeOdds(game);
    const phase = phaseKey(game.board.length);
    odds      = applyExtremeCaseOddsOverride(game, phase, odds);
    game.oddsHistory[phase] = odds;
    logServer('odds.computed', 'Cotes calculées', { gameId, phase, totalBoards: odds.totalBoards });
    audit.logAction(gameId, { type: 'odds_computed', phase, totalBoards: odds.totalBoards });
    res.json({ gameId, phase, ...odds });
  } catch (err) {
    logServer('odds.error', 'Erreur de calcul des cotes', { gameId, error: String(err.message || err) }, 'error');
    res.status(500).json({ error: 'Odds computation failed' });
  }
});

// ── SÉCURITÉ : enregistrement des mises côté serveur ─────────────────────────

router.post('/bet', (req, res) => {
  const games  = req.app.locals.games;
  const { gameId, target, index, phase, amount } = req.body || {};
  const game   = games[String(gameId || '')];

  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.board.length >= 5) return res.status(409).json({ error: 'Round already finished' });

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const validPhases = ['pre', 'flop', 'turn'];
  if (!validPhases.includes(phase)) return res.status(400).json({ error: 'Invalid phase' });

  if (target === 'hand') {
    const idx = Number(index);
    if (!Number.isFinite(idx) || idx < 0 || idx >= game.hands.length) {
      return res.status(400).json({ error: 'Invalid hand index' });
    }
    if (!game.serverBets.hands[idx]) game.serverBets.hands[idx] = { pre: 0, flop: 0, turn: 0 };
    game.serverBets.hands[idx][phase] = Math.round((game.serverBets.hands[idx][phase] + amt) * 100) / 100;
  } else if (target === 'tie') {
    game.serverBets.tie[phase] = Math.round((game.serverBets.tie[phase] + amt) * 100) / 100;
  } else {
    return res.status(400).json({ error: 'Invalid target' });
  }

  audit.logAction(gameId, { type: 'bet_placed', target, index: target === 'hand' ? Number(index) : -1, phase, amount: amt });
  res.json({ ok: true });
});

router.post('/bet/undo', (req, res) => {
  const games  = req.app.locals.games;
  const { gameId, target, index, phase, amount } = req.body || {};
  const game   = games[String(gameId || '')];

  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.board.length >= 5) return res.status(409).json({ error: 'Round already finished' });

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const validPhases = ['pre', 'flop', 'turn'];
  if (!validPhases.includes(phase)) return res.status(400).json({ error: 'Invalid phase' });

  if (target === 'hand') {
    const idx = Number(index);
    if (!Number.isFinite(idx) || idx < 0 || idx >= game.hands.length) {
      return res.status(400).json({ error: 'Invalid hand index' });
    }
    if (!game.serverBets.hands[idx]) game.serverBets.hands[idx] = { pre: 0, flop: 0, turn: 0 };
    game.serverBets.hands[idx][phase] = Math.max(0, Math.round((game.serverBets.hands[idx][phase] - amt) * 100) / 100);
  } else if (target === 'tie') {
    game.serverBets.tie[phase] = Math.max(0, Math.round((game.serverBets.tie[phase] - amt) * 100) / 100);
  } else {
    return res.status(400).json({ error: 'Invalid target' });
  }

  audit.logAction(gameId, { type: 'bet_undone', target, index: target === 'hand' ? Number(index) : -1, phase, amount: amt });
  res.json({ ok: true });
});

// ── Résultat ──────────────────────────────────────────────────────────────────

router.get('/result', (req, res) => {
  const games  = req.app.locals.games;
  const gameId = String(req.query.gameId || '');
  const game   = games[gameId];
  if (!game) {
    logServer('result.missing', 'Partie introuvable pour résultat', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }
  try {
    const result = getResult(game);
    logServer('result.computed', 'Résultat final calculé', { gameId, winnerType: result.winnerType, winners: result.winners });
    res.json({ gameId, ...result });
  } catch (err) {
    logServer('result.error', 'Erreur de calcul du résultat', { gameId, error: String(err.message || err) }, 'error');
    res.status(400).json({ error: 'Result unavailable' });
  }
});

// ── SÉCURITÉ : règlement avec mises serveur uniquement ───────────────────────

router.post('/settle', (req, res) => {
  const games  = req.app.locals.games;
  const { gameId } = req.body || {};
  const game   = games[String(gameId || '')];
  if (!game) {
    logServer('settle.missing', 'Partie introuvable pour règlement', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  try {
    const result    = getResult(game);
    const phaseOdds = game.oddsHistory || {};

    // Les mises viennent exclusivement du serveur — jamais du navigateur
    const handBets = game.serverBets?.hands || [];
    const tieBets  = game.serverBets?.tie   || { pre: 0, flop: 0, turn: 0 };

    const payoutByPhase = (phaseName, amount) => {
      const odds = phaseOdds[phaseName];
      if (!odds) return 0;
      if (result.winnerType === 'tie') {
        return amount > 0 ? amount * oddsValue(odds.tieProb || 0) : 0;
      }
      const winnerProb = odds.hands?.[result.winners[0]]?.soloProb || 0;
      return amount > 0 ? amount * oddsValue(winnerProb) : 0;
    };

    let normalPaid = 0;
    if (result.winnerType === 'tie') {
      normalPaid += payoutByPhase('pre',  Number(tieBets.pre  || 0));
      normalPaid += payoutByPhase('flop', Number(tieBets.flop || 0));
      normalPaid += payoutByPhase('turn', Number(tieBets.turn || 0));
    } else {
      const wb = handBets[result.winners[0]] || { pre: 0, flop: 0, turn: 0 };
      normalPaid += payoutByPhase('pre',  Number(wb.pre  || 0));
      normalPaid += payoutByPhase('flop', Number(wb.flop || 0));
      normalPaid += payoutByPhase('turn', Number(wb.turn || 0));
    }
    normalPaid = Math.round(normalPaid * 100) / 100;

    const eligibleTarget = result.winnerType === 'tie'
      ? { targetKind: 'tie', targetIndex: -1 }
      : { targetKind: 'hand', targetIndex: result.winners[0] };

    const matchingSnapshots = (game.jackpotSnapshots || []).filter(
      s => s.targetKind === eligibleTarget.targetKind && s.targetIndex === eligibleTarget.targetIndex
    );
    const jackpotPayouts = [];
    for (const snap of matchingSnapshots) {
      const claim = claimJackpot(snap.tier);
      if (!claim) continue;
      jackpotPayouts.push({
        snapshotId:        snap.snapshotId,
        targetKind:        snap.targetKind,
        targetIndex:       snap.targetIndex,
        phase:             snap.phase,
        rawOddsAtBetTime:  snap.rawOddsAtBetTime,
        tier:              snap.tier,
        paid:              claim.paid,
        resetTo:           claim.resetTo,
      });
    }

    const totalJackpotPaid = Math.round(jackpotPayouts.reduce((s, p) => s + Number(p.paid || 0), 0) * 100) / 100;
    const totalPaid        = Math.round((normalPaid + totalJackpotPaid) * 100) / 100;
    game.jackpotSnapshots  = [];
    game.fairnessRevealedAt = new Date().toISOString();

    logServer('round.end', 'Manche réglée', {
      gameId, winnerType: result.winnerType, winners: result.winners,
      normalPaid, totalJackpotPaid, totalPaid, jackpotPayouts, jackpots: jackpotSnapshot(),
    });

    audit.logResult(gameId, {
      winnerType: result.winnerType, winners: result.winners,
      normalPaid, totalJackpotPaid, totalPaid, jackpotPayouts,
      handBets, tieBets, finalBoard: game.board.slice(),
      fairnessRevealedAt: game.fairnessRevealedAt,
      serverSeed: game.serverSeed, serverSeedHash: game.serverSeedHash,
      clientSeed: game.clientSeed, nonce: game.nonce,
      deckCommitment: game.deckCommitment, revealedDeck: deckCodes(game.fullDeck),
    });
    const auditFilePath = audit.export();
    logServer('server_seed_reveal', 'Seed serveur révélé', {
      gameId, serverSeed: game.serverSeed, serverSeedHash: game.serverSeedHash,
      clientSeed: game.clientSeed, nonce: game.nonce,
      deckCommitment: game.deckCommitment, auditFilePath,
    });

    res.json({
      gameId, winnerType: result.winnerType, winners: result.winners,
      normalPaid, totalJackpotPaid, totalPaid, jackpotPayouts,
      jackpots: jackpotSnapshot(),
      fairness: buildFairnessReveal(game).fairness,
      rtp: buildRtpSummary(),
    });
  } catch (err) {
    logServer('settle.error', 'Erreur de règlement', { gameId, error: String(err.message || err) }, 'error');
    res.status(400).json({ error: 'Settlement unavailable' });
  }
});

router.get('/fairness', (req, res) => {
  const games  = req.app.locals.games;
  const gameId = String(req.query.gameId || '');
  const game   = games[gameId];
  if (!game) {
    logServer('fairness.missing', 'Partie introuvable pour fairness', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(buildFairnessReveal(game));
});

router.get('/fairness/reveal', (req, res) => {
  const games  = req.app.locals.games;
  const gameId = String(req.query.gameId || '');
  const game   = games[gameId];
  if (!game) {
    logServer('fairness.reveal.missing', 'Partie introuvable pour reveal fairness', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }
  if (!game.fairnessRevealedAt) {
    return res.status(409).json({ error: 'Fairness reveal unavailable before settlement', ...buildFairnessReveal(game) });
  }
  res.json(buildFairnessReveal(game));
});

router.get('/fairness/verify', (req, res) => {
  const games  = req.app.locals.games;
  const gameId = String(req.query.gameId || '');
  const game   = games[gameId];
  if (!game) {
    logServer('fairness.verify.missing', 'Partie introuvable pour vérification fairness', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }
  if (!game.fairnessRevealedAt) {
    return res.status(400).json({ error: 'Fairness unavailable until settlement' });
  }
  const { createDeck, deterministicShuffle, computeDeckCommitment, deckCodes, sha256Hex } = require('../utils/cards');
  const reconstructedDeck       = deterministicShuffle(createDeck(), { serverSeed: game.serverSeed, clientSeed: game.clientSeed, nonce: game.nonce, gameId: game.gameId });
  const reconstructedCommitment = computeDeckCommitment(reconstructedDeck);
  const reconstructedHash       = sha256Hex(game.serverSeed);
  const revealedDeckMatches     = JSON.stringify(deckCodes(reconstructedDeck)) === JSON.stringify(deckCodes(game.fullDeck));

  res.json({
    gameId, verifiedAt: new Date().toISOString(),
    serverSeedHashMatches:  reconstructedHash       === game.serverSeedHash,
    deckCommitmentMatches:  reconstructedCommitment === game.deckCommitment,
    revealedDeckMatches,
    fairness: {
      serverSeed: game.serverSeed, serverSeedHash: game.serverSeedHash,
      clientSeed: game.clientSeed, nonce: game.nonce,
      deckCommitment: game.deckCommitment,
      revealedDeck:      deckCodes(game.fullDeck),
      reconstructedDeck: deckCodes(reconstructedDeck),
    },
  });
});

router.get('/rtp', (req, res) => {
  res.json(buildRtpSummary());
});

module.exports = router;
