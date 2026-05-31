'use strict';

const express  = require('express');
const crypto   = require('crypto');
const { jackpots, jackpotConfig, jackpotSnapshot, contributeJackpots,
        refundJackpots, claimJackpot, jackpotTierFromRawOdds,
        currentJackpotPhase, rawOddsForTargetAtPhase, winProbForTargetAtPhase } = require('../services/jackpots');
const { logServer } = require('../utils/logger');

const router = express.Router();

router.get('/', (req, res) => {
  const gameId = String(req.query.gameId || '');
  const game   = gameId ? req.app.locals.games[gameId] : null;
  res.json({
    jackpots: jackpotSnapshot(),
    config:   jackpotConfig,
    snapshots: Array.isArray(game?.jackpotSnapshots) ? game.jackpotSnapshots : [],
  });
});

router.post('/bet', (req, res) => {
  const gameId = String(req.body?.gameId || '');
  const game   = req.app.locals.games[gameId];
  if (!game) {
    logServer('jackpots.bet.missing', 'Partie introuvable pour snapshot jackpot', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  const targetKind       = String(req.body?.targetKind || '');
  const targetIndex      = Number(req.body?.targetIndex);
  const phase            = String(req.body?.phase || '');
  const rawOddsAtBetTime = Number(req.body?.rawOddsAtBetTime || 0);
  const amount           = 1; // mise jackpot strictement unitaire
  const livePhase        = currentJackpotPhase(game);

  if (!['hand', 'tie'].includes(targetKind) || !['pre', 'flop', 'turn'].includes(phase) || phase !== livePhase) {
    logServer('jackpots.bet.invalid_phase', 'Snapshot jackpot refusé', { gameId, targetKind, targetIndex, phase, livePhase }, 'error');
    return res.status(400).json({ error: 'Invalid jackpot phase or target' });
  }

  const expectedRawOdds = rawOddsForTargetAtPhase(game, targetKind, targetIndex, phase);
  const expectedTier    = jackpotTierFromRawOdds(expectedRawOdds);
  const requestedTier   = jackpotTierFromRawOdds(rawOddsAtBetTime);

  if (!expectedTier || !requestedTier || expectedTier !== requestedTier || Math.abs(expectedRawOdds - rawOddsAtBetTime) > 0.11) {
    logServer('jackpots.bet.invalid_odds', 'Snapshot jackpot refusé pour incohérence de cote', {
      gameId, targetKind, targetIndex, phase, rawOddsAtBetTime, expectedRawOdds, expectedTier, requestedTier,
    }, 'error');
    return res.status(400).json({ error: 'Invalid jackpot odds snapshot' });
  }

  const alreadyBet = game.jackpotSnapshots.some((snap) =>
    snap && snap.tier === expectedTier &&
    snap.targetKind === targetKind &&
    Number(snap.targetIndex) === Number(targetIndex)
  );
  if (alreadyBet) {
    logServer('jackpots.bet.already_taken', 'Snapshot jackpot refusé — déjà misé sur ce tier/cible', {
      gameId, targetKind, targetIndex, phase, tier: expectedTier,
    }, 'warn');
    return res.status(409).json({ error: 'Jackpot already bet for this target and tier in this round' });
  }

  const snapshotId = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const snapshot = {
    snapshotId, gameId, targetKind, targetIndex, phase,
    rawOddsAtBetTime: expectedRawOdds,
    tier: expectedTier, amount: 1,
    createdAt: new Date().toISOString(),
  };

  game.jackpotSnapshots.push(snapshot);
  contributeJackpots(amount);
  logServer('jackpots.bet', 'Snapshot jackpot enregistré', { snapshot, jackpots: jackpotSnapshot() });
  res.json({ ok: true, snapshot, jackpots: jackpotSnapshot() });
});

router.post('/refund', (req, res) => {
  const gameId = String(req.body?.gameId || '');
  const game   = req.app.locals.games[gameId];
  if (!game) {
    logServer('jackpots.refund.missing', 'Partie introuvable pour remboursement jackpot', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  const snapshotId = String(req.body?.snapshotId || '');
  let idx = snapshotId ? game.jackpotSnapshots.findIndex(s => s.snapshotId === snapshotId) : -1;

  if (idx === -1) {
    const targetKind  = String(req.body?.targetKind || '');
    const targetIndex = Number(req.body?.targetIndex);
    const phase       = String(req.body?.phase || '');
    idx = game.jackpotSnapshots.findIndex(s => s.targetKind === targetKind && s.targetIndex === targetIndex && s.phase === phase);
  }

  if (idx === -1) return res.status(404).json({ error: 'Jackpot snapshot not found' });

  const [removed] = game.jackpotSnapshots.splice(idx, 1);
  refundJackpots(removed.amount || 1);
  logServer('jackpots.refund', 'Snapshot jackpot remboursé', { removed, jackpots: jackpotSnapshot() });
  res.json({ ok: true, removed, jackpots: jackpotSnapshot() });
});

router.post('/contribute', (req, res) => {
  const amount = Number(req.body?.amount || 0);
  contributeJackpots(amount);
  logServer('jackpots.contribute', 'Contribution jackpots appliquée', { amount, jackpots: jackpotSnapshot() });
  res.json({ ok: true, jackpots: jackpotSnapshot() });
});

router.post('/claim', (req, res) => {
  const type  = String(req.body?.type || '');
  const claim = claimJackpot(type);
  if (!claim) return res.status(400).json({ error: 'Invalid jackpot type' });
  logServer('jackpots.claim', 'Jackpot payé', { ...claim, jackpots: jackpotSnapshot() });
  res.json({ ok: true, ...claim, jackpots: jackpotSnapshot() });
});

module.exports = router;
