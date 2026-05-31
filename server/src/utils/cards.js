'use strict';

const crypto = require('crypto');

// ── Deck de base ──────────────────────────────────────────────────────────────

function createDeck() {
  const suits = ['S', 'H', 'D', 'C'];
  const ranks = [2,3,4,5,6,7,8,9,10,11,12,13,14];
  const deck  = [];
  for (const s of suits) for (const r of ranks) deck.push({ r, s });
  return deck;
}

function cardCode(card) {
  if (!card) return null;
  const rankMap = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J' };
  return `${rankMap[card.r] || String(card.r)}${card.s}`;
}

function deckCodes(deck) {
  return Array.isArray(deck) ? deck.map(cardCode) : [];
}

function cloneCard(card) {
  return { r: Number(card.r), s: String(card.s) };
}

function codeToCard(code) {
  const match = String(code || '').match(/^(A|K|Q|J|10|[2-9])([SHDC])$/);
  if (!match) throw new Error(`Invalid card code: ${code}`);
  const rankMap = { A: 14, K: 13, Q: 12, J: 11 };
  return { r: rankMap[match[1]] || Number(match[1]), s: match[2] };
}

// ── Shuffle déterministe SHA-256 ───────────────────────────────────────────────

function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function deterministicShuffle(deck, { serverSeed, clientSeed, nonce, gameId }) {
  return deck
    .map((card, index) => ({
      card,
      key: sha256Hex(`${serverSeed}|${clientSeed}|${nonce}|${gameId}|${index}|${card.r}${card.s}`),
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((item) => item.card);
}

function computeDeckCommitment(fullDeck) {
  return sha256Hex(JSON.stringify(deckCodes(fullDeck)));
}

// ── Cas extrêmes ───────────────────────────────────────────────────────────────

function shuffleArray(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildFullDeckForExtremeCase(caseData) {
  const hands = (caseData.hands || []).map((hand) => hand.map(codeToCard));
  const board  = (caseData.board  || []).map(codeToCard);
  const used   = new Set();
  for (const hand of hands) for (const card of hand) used.add(cardCode(card));
  for (const card of board) used.add(cardCode(card));

  const filler = shuffleArray(createDeck().filter((card) => !used.has(cardCode(card))));
  const tail   = [];
  for (let i = hands.length - 1; i >= 0; i--) {
    tail.push(cloneCard(hands[i][1]));
    tail.push(cloneCard(hands[i][0]));
  }
  [board[4], board[3], board[2], board[1], board[0]].forEach(c => tail.push(cloneCard(c)));
  return filler.concat(tail);
}

// ── Évaluation des mains (rank7Fast) ──────────────────────────────────────────

function cmpRank(a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const av = a[i] ?? -1;
    const bv = b[i] ?? -1;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}

function straightHighFromMask(mask) {
  for (let high = 14; high >= 5; high--) {
    let needed = 0;
    for (let r = high; r > high - 5; r--) needed |= (1 << r);
    if ((mask & needed) === needed) return high;
  }
  const wheel = (1 << 14) | (1 << 5) | (1 << 4) | (1 << 3) | (1 << 2);
  if ((mask & wheel) === wheel) return 5;
  return 0;
}

function rank7Fast(cards7) {
  const rankCounts = new Uint8Array(15);
  let mask = 0;
  let suitCountS = 0, suitCountH = 0, suitCountD = 0, suitCountC = 0;
  let suitMaskS  = 0, suitMaskH  = 0, suitMaskD  = 0, suitMaskC  = 0;

  for (let i = 0; i < 7; i++) {
    const c = cards7[i];
    const r = c.r;
    rankCounts[r] += 1;
    mask |= (1 << r);
    if      (c.s === 'S') { suitCountS++; suitMaskS |= (1 << r); }
    else if (c.s === 'H') { suitCountH++; suitMaskH |= (1 << r); }
    else if (c.s === 'D') { suitCountD++; suitMaskD |= (1 << r); }
    else                  { suitCountC++; suitMaskC |= (1 << r); }
  }

  let flushMask = 0;
  if      (suitCountS >= 5) flushMask = suitMaskS;
  else if (suitCountH >= 5) flushMask = suitMaskH;
  else if (suitCountD >= 5) flushMask = suitMaskD;
  else if (suitCountC >= 5) flushMask = suitMaskC;

  if (flushMask) {
    const sfHigh = straightHighFromMask(flushMask);
    if (sfHigh) return [8, sfHigh];
  }

  let quad = 0;
  const trips = [], pairs = [];
  for (let r = 14; r >= 2; r--) {
    const c = rankCounts[r];
    if      (c === 4) quad = r;
    else if (c === 3) trips.push(r);
    else if (c === 2) pairs.push(r);
  }

  if (quad) {
    for (let r = 14; r >= 2; r--) {
      if (r !== quad && rankCounts[r] > 0) return [7, quad, r];
    }
  }

  if (trips.length && (trips.length >= 2 || pairs.length)) {
    return [6, trips[0], trips.length >= 2 ? trips[1] : pairs[0]];
  }

  if (flushMask) {
    const out = [5];
    for (let r = 14; r >= 2; r--) {
      if (flushMask & (1 << r)) out.push(r);
      if (out.length === 6) return out;
    }
  }

  const straightHigh = straightHighFromMask(mask);
  if (straightHigh) return [4, straightHigh];

  if (trips.length) {
    const out = [3, trips[0]];
    for (let r = 14; r >= 2; r--) {
      if (r !== trips[0] && rankCounts[r] > 0) out.push(r);
      if (out.length === 4) return out;
    }
  }

  if (pairs.length >= 2) {
    const p1 = pairs[0], p2 = pairs[1];
    for (let r = 14; r >= 2; r--) {
      if (r !== p1 && r !== p2 && rankCounts[r] > 0) return [2, p1, p2, r];
    }
  }

  if (pairs.length === 1) {
    const p   = pairs[0];
    const out = [1, p];
    for (let r = 14; r >= 2; r--) {
      if (r !== p && rankCounts[r] > 0) out.push(r);
      if (out.length === 5) return out;
    }
  }

  const out = [0];
  for (let r = 14; r >= 2; r--) {
    if (rankCounts[r] > 0) out.push(r);
    if (out.length === 6) return out;
  }
  return out;
}

module.exports = {
  createDeck, cardCode, deckCodes, cloneCard, codeToCard,
  sha256Hex, deterministicShuffle, computeDeckCommitment,
  shuffleArray, buildFullDeckForExtremeCase,
  cmpRank, rank7Fast,
};
