'use strict';

const fs   = require('fs');
const path = require('path');
const { jackpotConfig, ECONOMY_SPLITS, MARGIN_JACKPOT } = require('../config');
const { rawOddsValue } = require('../utils/odds');

// ── État en mémoire ───────────────────────────────────────────────────────────

const jackpots = Object.fromEntries(
  Object.entries(jackpotConfig).map(([k, v]) => [
    k,
    { value: v.reset, reset: v.reset, relay: 0, color: v.color },
  ])
);

const jackpotSplits = {
  argent:  ECONOMY_SPLITS.argentVisible,
  or:      ECONOMY_SPLITS.orVisible,
  diamant: ECONOMY_SPLITS.diamantVisible,
};

const jackpotHiddenSplits = {
  argent:  ECONOMY_SPLITS.argentHidden,
  or:      ECONOMY_SPLITS.orHidden,
  diamant: ECONOMY_SPLITS.diamantHidden,
};

// ── Persistence ───────────────────────────────────────────────────────────────

const JACKPOTS_FILE = path.join(__dirname, '..', '..', 'data', 'jackpots.json');

function saveJackpots() {
  try {
    const dir = path.dirname(JACKPOTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = {};
    for (const [k, v] of Object.entries(jackpots)) {
      data[k] = { value: v.value, relay: v.relay };
    }
    fs.writeFileSync(JACKPOTS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('saveJackpots error:', e.message);
  }
}

function loadJackpots() {
  try {
    if (!fs.existsSync(JACKPOTS_FILE)) return;
    const data = JSON.parse(fs.readFileSync(JACKPOTS_FILE, 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (jackpots[k] && typeof v.value === 'number' && v.value >= jackpots[k].reset) {
        jackpots[k].value = Math.round(v.value  * 100) / 100;
        jackpots[k].relay = Math.round((v.relay || 0) * 100) / 100;
      }
    }
    console.log('Jackpots restaurés:', JSON.stringify(jackpotSnapshot()));
  } catch (e) {
    console.error('loadJackpots error:', e.message);
  }
}

// ── Opérations ────────────────────────────────────────────────────────────────

function jackpotSnapshot() {
  const out = {};
  for (const [k, v] of Object.entries(jackpots)) out[k] = Math.round(v.value * 100) / 100;
  return out;
}

function contributeJackpots(amount) {
  const net = Math.max(0, Number(amount || 0)) * (1 - MARGIN_JACKPOT);
  for (const key of Object.keys(jackpots)) {
    jackpots[key].value += net * jackpotSplits[key];
    jackpots[key].relay += net * jackpotHiddenSplits[key];
    jackpots[key].value  = Math.round(jackpots[key].value * 100) / 100;
    jackpots[key].relay  = Math.round(jackpots[key].relay * 100) / 100;
  }
  saveJackpots();
}

function refundJackpots(amount) {
  const net = Math.max(0, Number(amount || 0)) * (1 - MARGIN_JACKPOT);
  for (const key of Object.keys(jackpots)) {
    jackpots[key].value = Math.max(
      jackpots[key].reset,
      jackpots[key].value - net * jackpotSplits[key]
    );
    jackpots[key].value = Math.round(jackpots[key].value * 100) / 100;
  }
  saveJackpots();
}

function claimJackpot(type) {
  const jp = jackpots[type];
  if (!jp) return null;
  const paid        = Math.round(jp.value * 100) / 100;
  const relayBoost  = jp.relay * 0.75;                          // 75% du relay, sans plafond
  jp.value = Math.round((jp.reset + relayBoost) * 100) / 100;
  jp.relay = Math.round(Math.max(0, jp.relay - relayBoost) * 100) / 100;
  saveJackpots();
  return { type, paid, resetTo: jp.value };
}

// ── Helpers tier/phase ────────────────────────────────────────────────────────

const jackpotTierRank = { argent: 1, or: 2, diamant: 3 };

function jackpotTierFromRawOdds(rawOdds) {
  const odds = Number(rawOdds);
  if (!Number.isFinite(odds)) return null;
  if (odds >= 8000) return 'diamant';
  if (odds >= 800)  return 'or';
  if (odds >= 220)  return 'argent';
  return null;
}

function currentJackpotPhase(game) {
  const { phaseKey } = require('../utils/odds');
  return phaseKey(game.board.length);
}

function rawOddsForTargetAtPhase(game, targetKind, targetIndex, phase) {
  const odds = game?.oddsHistory?.[phase];
  if (!odds) return 0;
  if (targetKind === 'tie') return rawOddsValue(Number(odds.tieProb || 0));
  return rawOddsValue(Number(odds.hands?.[targetIndex]?.soloProb || 0));
}

function winProbForTargetAtPhase(game, targetKind, targetIndex, phase) {
  const odds = game?.oddsHistory?.[phase];
  if (!odds) return 0;
  if (targetKind === 'tie') return Number(odds.tieProb || 0);
  return Number(odds.hands?.[targetIndex]?.soloProb || 0);
}

module.exports = {
  jackpots, jackpotConfig,
  loadJackpots, saveJackpots, jackpotSnapshot,
  contributeJackpots, refundJackpots, claimJackpot,
  jackpotTierRank, jackpotTierFromRawOdds,
  currentJackpotPhase, rawOddsForTargetAtPhase, winProbForTargetAtPhase,
};
