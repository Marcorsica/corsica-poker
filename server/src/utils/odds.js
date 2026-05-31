'use strict';

const { MARGIN_NORMAL } = require('../config');
const { rank7Fast, cmpRank, createDeck, cardCode } = require('./cards');

// ── Helpers ───────────────────────────────────────────────────────────────────

function phaseKey(boardLength) {
  if (boardLength === 0) return 'pre';
  if (boardLength === 3) return 'flop';
  if (boardLength === 4) return 'turn';
  return 'river';
}

function nChooseK(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let out = 1;
  for (let i = 1; i <= k; i++) out = (out * (n - k + i)) / i;
  return Math.round(out);
}

function probabilityFromCount(count, total) {
  return total > 0 ? count / total : 0;
}

function oddsValue(prob) {
  if (!prob || prob <= 0) return 0;
  return Math.round((1 / prob) * (1 - MARGIN_NORMAL) * 100) / 100;
}

function rawOddsValue(prob) {
  if (!prob || prob <= 0) return 0;
  return Math.round((1 / prob) * 100) / 100;
}

function rtpValue(prob) {
  if (!prob || prob <= 0) return 0;
  return Math.round(prob * oddsValue(prob) * 10000) / 10000;
}

// ── Calcul des cotes par énumération complète ─────────────────────────────────

function usedSet(hands, board) {
  const used = new Set();
  for (const hand of hands) {
    used.add(`${hand[0].r}${hand[0].s}`);
    used.add(`${hand[1].r}${hand[1].s}`);
  }
  for (const c of board) used.add(`${c.r}${c.s}`);
  return used;
}

function remainingDeckForGame(game) {
  const used = usedSet(game.hands, game.board);
  return createDeck().filter(c => !used.has(`${c.r}${c.s}`));
}

function evaluateBoard(hands, fullBoard, acc) {
  const [b0, b1, b2, b3, b4] = fullBoard;
  const ranks = new Array(hands.length);
  let best    = null;

  for (let i = 0; i < hands.length; i++) {
    const r = rank7Fast([hands[i][0], hands[i][1], b0, b1, b2, b3, b4]);
    ranks[i] = r;
    if (!best || cmpRank(r, best) > 0) best = r;
  }

  const winners = [];
  for (let i = 0; i < ranks.length; i++) {
    if (cmpRank(ranks[i], best) === 0) winners.push(i);
  }

  if (winners.length >= 2) {
    acc.tieBoards += 1;
    for (const w of winners) acc.hands[w].tieWins += 1;
  } else {
    acc.hands[winners[0]].soloWins += 1;
  }
  acc.totalBoards += 1;
}

function computeOdds(game) {
  const { hands, board } = game;
  const remaining = remainingDeckForGame(game);
  const missing   = 5 - board.length;

  if (![0, 1, 2, 5].includes(missing)) {
    throw new Error(`Unsupported missing board size: ${missing}`);
  }

  const acc = {
    hands:       hands.map(() => ({ soloWins: 0, tieWins: 0 })),
    totalBoards: 0,
    tieBoards:   0,
  };

  if (missing === 0) {
    evaluateBoard(hands, board, acc);
  } else if (missing === 1) {
    for (let i = 0; i < remaining.length; i++) {
      evaluateBoard(hands, [board[0], board[1], board[2], board[3], remaining[i]], acc);
    }
  } else if (missing === 2) {
    for (let i = 0; i < remaining.length - 1; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        evaluateBoard(hands, [board[0], board[1], board[2], remaining[i], remaining[j]], acc);
      }
    }
  } else {
    for (let a = 0; a < remaining.length - 4; a++)
      for (let b = a + 1; b < remaining.length - 3; b++)
        for (let c = b + 1; c < remaining.length - 2; c++)
          for (let d = c + 1; d < remaining.length - 1; d++)
            for (let e = d + 1; e < remaining.length; e++)
              evaluateBoard(hands, [remaining[a], remaining[b], remaining[c], remaining[d], remaining[e]], acc);
  }

  const total = acc.totalBoards;
  const expectedTotalBoards = nChooseK(remaining.length, missing);
  if (total !== expectedTotalBoards) {
    throw new Error(`Exact odds enumeration mismatch: counted ${total}, expected ${expectedTotalBoards}`);
  }

  return {
    exact: true,
    method: 'complete-board-enumeration-v2',
    knownCards:       hands.length * 2 + board.length,
    remainingCards:   remaining.length,
    missingBoardCards: missing,
    totalBoards:      total,
    expectedTotalBoards,
    hands: acc.hands.map(h => {
      const soloProb = probabilityFromCount(h.soloWins, total);
      const tieProb  = probabilityFromCount(h.tieWins, total);
      return {
        soloWins:       h.soloWins,
        tieWins:        h.tieWins,
        soloProb,
        tieProb,
        fairSoloOdds:   rawOddsValue(soloProb),
        quotedSoloOdds: oddsValue(soloProb),
      };
    }),
    tieBoards:    acc.tieBoards,
    tieProb:      probabilityFromCount(acc.tieBoards, total),
    fairTieOdds:  rawOddsValue(probabilityFromCount(acc.tieBoards, total)),
    quotedTieOdds: oddsValue(probabilityFromCount(acc.tieBoards, total)),
  };
}

// ── Résultat final ─────────────────────────────────────────────────────────────

function getResult(game) {
  if (game.board.length !== 5) throw new Error('River not revealed yet');
  const ranks = game.hands.map(hand => rank7Fast([hand[0], hand[1], ...game.board]));
  let best = ranks[0];
  for (let i = 1; i < ranks.length; i++) {
    if (cmpRank(ranks[i], best) > 0) best = ranks[i];
  }
  const winners = [];
  for (let i = 0; i < ranks.length; i++) {
    if (cmpRank(ranks[i], best) === 0) winners.push(i);
  }
  return { winnerType: winners.length > 1 ? 'tie' : 'single', winners, ranks };
}

// ── RTP ────────────────────────────────────────────────────────────────────────

function buildRtpSummary() {
  return {
    mode:                     'dynamic-probability-quoted-odds',
    margin:                   MARGIN_NORMAL,
    quotedOddsFormula:        'rounded((1 / probability) * (1 - margin), 2)',
    standardBetRtpFormula:    'probability * quotedOdds',
    standardBetRtpTarget:     Number((1 - MARGIN_NORMAL).toFixed(4)),
    standardBetRtpPercentTarget: Number(((1 - MARGIN_NORMAL) * 100).toFixed(2)),
    roundingImpact: {
      quotedOddsPrecision:        2,
      theoreticalMinRtpPercent:   Number((((1 - MARGIN_NORMAL) - 0.005) * 100).toFixed(2)),
      theoreticalMaxRtpPercent:   Number((((1 - MARGIN_NORMAL) + 0.005) * 100).toFixed(2)),
      note: 'Real RTP of an individual priced bet stays close to the 95% target because quoted odds are rounded to 2 decimals.',
    },
    scope: 'Standard win and tie bets settled by /settle. Jackpot side bets are excluded from this RTP summary.',
    examples: [
      { probability: 0.50, quotedOdds: oddsValue(0.50), rtpPercent: Number((rtpValue(0.50) * 100).toFixed(2)) },
      { probability: 0.25, quotedOdds: oddsValue(0.25), rtpPercent: Number((rtpValue(0.25) * 100).toFixed(2)) },
      { probability: 0.10, quotedOdds: oddsValue(0.10), rtpPercent: Number((rtpValue(0.10) * 100).toFixed(2)) },
      { probability: 0.02, quotedOdds: oddsValue(0.02), rtpPercent: Number((rtpValue(0.02) * 100).toFixed(2)) },
    ],
  };
}

module.exports = {
  phaseKey, oddsValue, rawOddsValue, rtpValue,
  computeOdds, getResult, buildRtpSummary,
  remainingDeckForGame,
};
