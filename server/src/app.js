const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const session = require('express-session');
const audit = require('../audit/auditLogger');

console.log("A2 RNG SERVER LOADED");

const app = express();
const ACCESS_CODE = String(process.env.CORSICA_ACCESS_CODE || '1969');
const SESSION_SECRET = String(process.env.SESSION_SECRET || 'corsica-poker-session-secret');
const LOCAL_AUDIO_DIR = path.join(__dirname, '..', '..', 'public', 'audio');
const EXTERNAL_AUDIO_DIR = process.env.CORSICA_AUDIO_DIR || 'C:\\Users\\user\\Desktop\\CORSICA\\CorsicaPokerAssets\\audio';
audit.startSession({ app: 'Corsica Poker A2', port: Number(process.env.PORT || 3001) });
const PORT = Number(process.env.PORT || 3001);
const games = Object.create(null);
const MARGIN = 0.015;

const jackpotConfig = {
  argent: { reset: 250, color: '#C0C0C0' },
  or: { reset: 800, color: '#FFD700' },
  diamant: { reset: 8000, color: '#7dd3fc' },
};
const ECONOMY_SPLITS = {
  baseValue: 0.36,
  argentVisible: 0.21,
  orVisible: 0.15,
  diamantVisible: 0.115,
  argentHidden: 0.04,
  orHidden: 0.05,
  diamantHidden: 0.06,
};

const jackpotSplits = {
  argent: ECONOMY_SPLITS.argentVisible,
  or: ECONOMY_SPLITS.orVisible,
  diamant: ECONOMY_SPLITS.diamantVisible,
};

const jackpotHiddenSplits = {
  argent: ECONOMY_SPLITS.argentHidden,
  or: ECONOMY_SPLITS.orHidden,
  diamant: ECONOMY_SPLITS.diamantHidden,
};

const EXTREME_CASES_FILE = path.join(__dirname, '..', 'test-data', 'extreme-cases.json');
let extremeCasesLibrary = [];
try {
  extremeCasesLibrary = JSON.parse(fs.readFileSync(EXTREME_CASES_FILE, 'utf8'));
} catch (err) {
  extremeCasesLibrary = [];
  console.error('EXTREME CASES LOAD ERROR', err);
}

function codeToCard(code) {
  const match = String(code || '').match(/^(A|K|Q|J|10|[2-9])([SHDC])$/);
  if (!match) throw new Error(`Invalid card code: ${code}`);
  const rankMap = { A: 14, K: 13, Q: 12, J: 11 };
  return { r: rankMap[match[1]] || Number(match[1]), s: match[2] };
}

function cloneCard(card) {
  return { r: Number(card.r), s: String(card.s) };
}

function shuffleArray(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function buildFullDeckForExtremeCase(caseData) {
  const hands = (caseData.hands || []).map((hand) => hand.map(codeToCard));
  const board = (caseData.board || []).map(codeToCard);
  const used = new Set();
  for (const hand of hands) for (const card of hand) used.add(cardCode(card));
  for (const card of board) used.add(cardCode(card));

  const filler = shuffleArray(createDeck().filter((card) => !used.has(cardCode(card))));
  const tail = [];
  for (let i = hands.length - 1; i >= 0; i--) {
    tail.push(cloneCard(hands[i][1]));
    tail.push(cloneCard(hands[i][0]));
  }
  tail.push(cloneCard(board[4]));
  tail.push(cloneCard(board[3]));
  tail.push(cloneCard(board[2]));
  tail.push(cloneCard(board[1]));
  tail.push(cloneCard(board[0]));

  return filler.concat(tail);
}

function getExtremeCaseById(caseId) {
  return extremeCasesLibrary.find((entry) => String(entry.id) === String(caseId)) || null;
}

const jackpots = Object.fromEntries(Object.entries(jackpotConfig).map(([k,v]) => [k, { value: v.reset, reset: v.reset, relay: 0, color: v.color }]));

function jackpotSnapshot() {
  const out = {};
  for (const [k,v] of Object.entries(jackpots)) out[k] = Math.round(v.value * 100) / 100;
  return out;
}

function contributeJackpots(amount) {
  const net = Math.max(0, Number(amount || 0)) * (1 - MARGIN);
  for (const key of Object.keys(jackpots)) {
    jackpots[key].value += net * jackpotSplits[key];
    jackpots[key].relay += net * jackpotHiddenSplits[key];
    jackpots[key].value = Math.round(jackpots[key].value * 100) / 100;
    jackpots[key].relay = Math.round(jackpots[key].relay * 100) / 100;
  }
}

function refundJackpots(amount) {
  const net = Math.max(0, Number(amount || 0)) * (1 - MARGIN);
  for (const key of Object.keys(jackpots)) {
    jackpots[key].value = Math.max(jackpots[key].reset, jackpots[key].value - (net * jackpotSplits[key]));
    jackpots[key].value = Math.round(jackpots[key].value * 100) / 100;
  }
}

function claimJackpot(type) {
  const jp = jackpots[type];
  if (!jp) return null;
  const paid = Math.round(jp.value * 100) / 100;
  const relayBoost = Math.min(jp.relay, jp.reset * 0.25);
  jp.value = Math.round((jp.reset + relayBoost) * 100) / 100;
  jp.relay = Math.round(Math.max(0, jp.relay - relayBoost) * 100) / 100;
  return { type, paid, resetTo: jp.value };
}

const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');
const SERVER_LOG_FILE = path.join(LOGS_DIR, 'corsica-server.log');
const CLIENT_LOG_FILE = path.join(LOGS_DIR, 'corsica-client.log');
fs.mkdirSync(LOGS_DIR, { recursive: true });

function appendLog(filePath, payload) {
  const entry = {
    id: `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    time: new Date().toISOString(),
    ...payload,
  };
  fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8');
  return entry;
}

function logServer(event, message, data = {}, level = 'info') {
  return appendLog(SERVER_LOG_FILE, {
    source: 'server',
    level,
    event,
    message,
    data,
  });
}

function logClient(payload = {}) {
  return appendLog(CLIENT_LOG_FILE, {
    source: 'client',
    level: payload.level || 'info',
    event: payload.event || 'client.log',
    message: payload.message || '',
    data: payload.data || {},
  });
}

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(session({
  name: 'corsica.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: process.env.NODE_ENV === 'production',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    // Pas de maxAge : cookie de session uniquement.
    // Le droit d'ouvrir la table est controle par un jeton d'ouverture unique.
  },
}));
app.use('/audio', express.static(LOCAL_AUDIO_DIR, { fallthrough: true }));
app.use('/external-audio', express.static(EXTERNAL_AUDIO_DIR, { fallthrough: true }));
app.use(express.static(path.join(__dirname, '..', '..', 'public'), { index: false }));

function isAuthenticated(req) {
  return !!(req.session && req.session.corsicaAuthenticated);
}

function createOpenToken() {
  return crypto.randomBytes(24).toString('hex');
}

function hasValidOpenToken(req) {
  const token = String(req.query?.open || '');
  return !!(token && req.session && req.session.corsicaOpenToken && token === req.session.corsicaOpenToken);
}

function requireAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  if (req.path.startsWith('/api/') || req.path === '/start' || req.path === '/next' || req.path === '/settle' || req.path.startsWith('/fairness') || req.path.startsWith('/test/')) {
    return res.status(401).json({ ok: false, error: 'AUTH_REQUIRED' });
  }
  return res.redirect('/login');
}

app.get('/login', (req, res) => {
  // Toujours afficher l'ecran de code : une ancienne session ne doit plus
  // permettre d'ouvrir automatiquement le jeu.
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const code = String(req.body?.code || '').trim();
  if (code !== ACCESS_CODE) {
    logServer('auth.login.failed', "Code d'accès refusé", { ip: req.ip }, 'warn');
    return res.status(401).json({ ok: false, error: 'INVALID_CODE' });
  }
  req.session.regenerate((err) => {
    if (err) {
      logServer('auth.login.error', 'Erreur création session', { error: String(err) }, 'error');
      return res.status(500).json({ ok: false, error: 'SESSION_ERROR' });
    }
    req.session.corsicaAuthenticated = true;
    const openToken = createOpenToken();
    req.session.corsicaOpenToken = openToken;
    req.session.save((saveErr) => {
      if (saveErr) {
        logServer('auth.login.save_error', 'Erreur sauvegarde session', { error: String(saveErr) }, 'error');
        return res.status(500).json({ ok: false, error: 'SESSION_SAVE_ERROR' });
      }
      logServer('auth.login.success', "Code d'accès validé", { ip: req.ip });
      return res.json({ ok: true, redirect: `/?open=${encodeURIComponent(openToken)}` });
    });
  });
});

app.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('corsica.sid');
    logServer('auth.logout', 'Session verrouillée', { ip: req.ip });
    res.json({ ok: true });
  });
});

app.get('/audio-health', (req, res) => {
  const expectedFiles = [
    'audio_1_jazz.mp3',
    'audio_2_jazz.mp3',
    'audio_3_beats.mp3',
    'audio_4_rnb.mp3',
    'audio_5_relax.mp3',
    'audio_6_casino.mp3',
    'snd_deal.mp3',
    'snd_card.mp3',
    'suspense.mp3',
  ];
  const files = Object.fromEntries(expectedFiles.map((name) => [name, {
    local: fs.existsSync(path.join(LOCAL_AUDIO_DIR, name)),
    external: fs.existsSync(path.join(EXTERNAL_AUDIO_DIR, name)),
  }]));
  res.json({ ok: true, localAudioDir: LOCAL_AUDIO_DIR, externalAudioDir: EXTERNAL_AUDIO_DIR, files });
});

app.get('/', requireAuth, (req, res) => {
  if (!hasValidOpenToken(req)) {
    return res.redirect('/login');
  }

  // Jeton consomme : un rechargement, une nouvelle fenetre ou une reouverture
  // de l'URL exigera de nouveau le code d'acces.
  delete req.session.corsicaOpenToken;
  req.session.save(() => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
  });
});

app.use((req, res, next) => {
  if (req.path === '/log') return next();
  logServer('http.request', 'Requête HTTP reçue', {
    method: req.method,
    path: req.path,
    query: req.query || {},
  });
  next();
});

app.use(['/start', '/next', '/settle', '/fairness', '/fairness/verify', '/test', '/test/extreme-cases'], requireAuth);

app.post('/log', (req, res) => {
  const entry = logClient(req.body || {});
  logServer('client.log.received', 'Log client reçu', {
    originalEvent: entry.event,
    message: entry.message,
  });
  res.json({ ok: true });
});

function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function createDeck() {
  const suits = ['S', 'H', 'D', 'C'];
  const ranks = [2,3,4,5,6,7,8,9,10,11,12,13,14];
  const deck = [];
  for (const s of suits) for (const r of ranks) deck.push({ r, s });
  return deck;
}

function cardCode(card) {
  if (!card) return null;
  const rankMap = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J' };
  const rank = rankMap[card.r] || String(card.r);
  return `${rank}${card.s}`;
}

function deckCodes(deck) {
  return Array.isArray(deck) ? deck.map(cardCode) : [];
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
  let suitMaskS = 0, suitMaskH = 0, suitMaskD = 0, suitMaskC = 0;

  for (let i = 0; i < 7; i++) {
    const c = cards7[i];
    const r = c.r;
    rankCounts[r] += 1;
    mask |= (1 << r);

    if (c.s === 'S') {
      suitCountS++;
      suitMaskS |= (1 << r);
    } else if (c.s === 'H') {
      suitCountH++;
      suitMaskH |= (1 << r);
    } else if (c.s === 'D') {
      suitCountD++;
      suitMaskD |= (1 << r);
    } else {
      suitCountC++;
      suitMaskC |= (1 << r);
    }
  }

  let flushMask = 0;
  if (suitCountS >= 5) flushMask = suitMaskS;
  else if (suitCountH >= 5) flushMask = suitMaskH;
  else if (suitCountD >= 5) flushMask = suitMaskD;
  else if (suitCountC >= 5) flushMask = suitMaskC;

  if (flushMask) {
    const sfHigh = straightHighFromMask(flushMask);
    if (sfHigh) return [8, sfHigh];
  }

  let quad = 0;
  const trips = [];
  const pairs = [];

  for (let r = 14; r >= 2; r--) {
    const c = rankCounts[r];
    if (c === 4) quad = r;
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
    const p1 = pairs[0];
    const p2 = pairs[1];
    for (let r = 14; r >= 2; r--) {
      if (r !== p1 && r !== p2 && rankCounts[r] > 0) return [2, p1, p2, r];
    }
  }

  if (pairs.length === 1) {
    const p = pairs[0];
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
  const board0 = fullBoard[0], board1 = fullBoard[1], board2 = fullBoard[2], board3 = fullBoard[3], board4 = fullBoard[4];
  const ranks = new Array(hands.length);
  let best = null;

  for (let i = 0; i < hands.length; i++) {
    const r = rank7Fast([hands[i][0], hands[i][1], board0, board1, board2, board3, board4]);
    ranks[i] = r;
    if (!best || cmpRank(r, best) > 0) best = r;
  }

  let winnersCount = 0;
  const winners = [];
  for (let i = 0; i < ranks.length; i++) {
    if (cmpRank(ranks[i], best) === 0) {
      winnersCount++;
      winners.push(i);
    }
  }

  if (winnersCount >= 2) {
    acc.tieBoards += 1;
    for (const w of winners) acc.hands[w].tieWins += 1;
  } else {
    acc.hands[winners[0]].soloWins += 1;
  }

  acc.totalBoards += 1;
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

function computeOdds(game) {
  const hands = game.hands;
  const board = game.board;
  const remaining = remainingDeckForGame(game);
  const missing = 5 - board.length;

  if (![0, 1, 2, 5].includes(missing)) {
    throw new Error(`Unsupported missing board size: ${missing}`);
  }

  const acc = {
    hands: hands.map(() => ({ soloWins: 0, tieWins: 0 })),
    totalBoards: 0,
    tieBoards: 0,
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
  } else if (missing === 5) {
    for (let a = 0; a < remaining.length - 4; a++) {
      for (let b = a + 1; b < remaining.length - 3; b++) {
        for (let c = b + 1; c < remaining.length - 2; c++) {
          for (let d = c + 1; d < remaining.length - 1; d++) {
            for (let e = d + 1; e < remaining.length; e++) {
              evaluateBoard(hands, [remaining[a], remaining[b], remaining[c], remaining[d], remaining[e]], acc);
            }
          }
        }
      }
    }
  }

  const total = acc.totalBoards;
  const expectedTotalBoards = nChooseK(remaining.length, missing);
  if (total !== expectedTotalBoards) {
    throw new Error(`Exact odds enumeration mismatch: counted ${total}, expected ${expectedTotalBoards}`);
  }

  return {
    exact: true,
    method: "complete-board-enumeration-v2",
    knownCards: hands.length * 2 + board.length,
    remainingCards: remaining.length,
    missingBoardCards: missing,
    totalBoards: total,
    expectedTotalBoards,
    hands: acc.hands.map(h => {
      const soloProb = probabilityFromCount(h.soloWins, total);
      const tieProb = probabilityFromCount(h.tieWins, total);
      return {
        soloWins: h.soloWins,
        tieWins: h.tieWins,
        soloProb,
        tieProb,
        fairSoloOdds: rawOddsValue(soloProb),
        quotedSoloOdds: oddsValue(soloProb),
      };
    }),
    tieBoards: acc.tieBoards,
    tieProb: probabilityFromCount(acc.tieBoards, total),
    fairTieOdds: rawOddsValue(probabilityFromCount(acc.tieBoards, total)),
    quotedTieOdds: oddsValue(probabilityFromCount(acc.tieBoards, total)),
  };
}

function oddsValue(prob) {
  if (!prob || prob <= 0) return 0;
  const fair = 1 / prob;
  return Math.round((fair * (1 - MARGIN)) * 100) / 100;
}

function rawOddsValue(prob) {
  if (!prob || prob <= 0) return 0;
  return Math.round((1 / prob) * 100) / 100;
}

const jackpotTierRank = { argent: 1, or: 2, diamant: 3 };

function jackpotTierFromRawOdds(rawOdds) {
  const odds = Number(rawOdds);
  if (!Number.isFinite(odds)) return null;
  if (odds >= 8000) return "diamant";
  if (odds >= 800) return "or";
  if (odds >= 220) return "argent";
  return null;
}

function currentJackpotPhase(game) {
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



function pickBestSnapshot(snapshots) {
  if (!Array.isArray(snapshots) || !snapshots.length) return null;
  return snapshots.slice().sort((a, b) => {
    const tierDiff = (jackpotTierRank[b.tier] || 0) - (jackpotTierRank[a.tier] || 0);
    if (tierDiff !== 0) return tierDiff;
    const oddsDiff = Number(b.rawOddsAtBetTime || 0) - Number(a.rawOddsAtBetTime || 0);
    if (oddsDiff !== 0) return oddsDiff;
    return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
  })[0];
}

function rtpValue(prob) {
  if (!prob || prob <= 0) return 0;
  return Math.round(prob * oddsValue(prob) * 10000) / 10000;
}

function buildFairnessReveal(game) {
  return {
    gameId: game.gameId,
    settled: Boolean(game.fairnessRevealedAt),
    fairness: {
      algorithm: 'sha256-deterministic-sort-v1',
      serverSeedHash: game.serverSeedHash,
      serverSeed: game.fairnessRevealedAt ? game.serverSeed : null,
      clientSeed: game.clientSeed,
      nonce: game.nonce,
      deckCommitment: game.deckCommitment,
      fairnessRevealedAt: game.fairnessRevealedAt,
      revealedDeck: game.fairnessRevealedAt ? deckCodes(game.fullDeck) : null,
      revealedHands: game.fairnessRevealedAt ? game.hands.map((hand) => hand.map(cardCode)) : null,
      revealedBoard: game.fairnessRevealedAt ? deckCodes(game.board) : null,
      verification: game.fairnessRevealedAt ? 'reproducible' : 'pending_settlement',
    },
  };
}

function buildRtpSummary() {
  return {
    mode: 'dynamic-probability-quoted-odds',
    margin: MARGIN,
    quotedOddsFormula: 'rounded((1 / probability) * (1 - margin), 2)',
    standardBetRtpFormula: 'probability * quotedOdds',
    standardBetRtpTarget: Number((1 - MARGIN).toFixed(4)),
    standardBetRtpPercentTarget: Number(((1 - MARGIN) * 100).toFixed(2)),
    roundingImpact: {
      quotedOddsPrecision: 2,
      theoreticalMinRtpPercent: Number((((1 - MARGIN) - 0.005) * 100).toFixed(2)),
      theoreticalMaxRtpPercent: Number((((1 - MARGIN) + 0.005) * 100).toFixed(2)),
      note: 'Real RTP of an individual priced bet stays close to the 95% target because quoted odds are rounded to 2 decimals.',
    },
    scope: 'Standard win and tie bets settled by /settle. Jackpot side bets are excluded from this RTP summary.',
    examples: [
      { probability: 0.5, quotedOdds: oddsValue(0.5), rtpPercent: Number((rtpValue(0.5) * 100).toFixed(2)) },
      { probability: 0.25, quotedOdds: oddsValue(0.25), rtpPercent: Number((rtpValue(0.25) * 100).toFixed(2)) },
      { probability: 0.1, quotedOdds: oddsValue(0.1), rtpPercent: Number((rtpValue(0.1) * 100).toFixed(2)) },
      { probability: 0.02, quotedOdds: oddsValue(0.02), rtpPercent: Number((rtpValue(0.02) * 100).toFixed(2)) },
    ],
  };
}

function phaseKey(boardLength) {
  if (boardLength === 0) return 'pre';
  if (boardLength === 3) return 'flop';
  if (boardLength === 4) return 'turn';
  return 'river';
}

function getResult(game) {
  if (game.board.length !== 5) {
    throw new Error('River not revealed yet');
  }
  const ranks = game.hands.map(hand => rank7Fast([hand[0], hand[1], ...game.board]));
  let best = ranks[0];
  for (let i = 1; i < ranks.length; i++) {
    if (cmpRank(ranks[i], best) > 0) best = ranks[i];
  }
  const winners = [];
  for (let i = 0; i < ranks.length; i++) {
    if (cmpRank(ranks[i], best) === 0) winners.push(i);
  }
  return {
    winnerType: winners.length > 1 ? 'tie' : 'single',
    winners,
    ranks,
  };
}



function getExtremeCaseRuntimeConfig(game) {
  if (!game || !game.extremeCaseId) return null;
  return getExtremeCaseById(game.extremeCaseId);
}

function applyExtremeCaseOddsOverride(game, phase, odds) {
  const extremeCase = getExtremeCaseRuntimeConfig(game);
  const phaseCfg = extremeCase?.phases?.[phase];
  const target = extremeCase?.target;
  if (!phaseCfg || !target || !odds) return odds;

  const rawOdds = Number(phaseCfg.rawOdds || 0);
  const forcedProb = rawOdds > 0 ? (1 / rawOdds) : 0;

  if (target.kind === 'tie') {
    odds.tieProb = forcedProb;
    odds.fairTieOdds = rawOdds > 0 ? rawOdds : 0;
    return odds;
  }

  const index = Number(target.index);
  if (Array.isArray(odds.hands) && odds.hands[index]) {
    odds.hands[index].soloProb = forcedProb;
    odds.hands[index].fairSoloOdds = rawOdds > 0 ? rawOdds : 0;
  }
  return odds;
}

app.get('/test/extreme-cases', (req, res) => {
  const items = (extremeCasesLibrary || []).map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    playerCount: Number(entry.playerCount || 10),
    target: entry.target || null,
    phases: entry.phases || {},
  }));
  res.json({ cases: items });
});

app.get('/start', (req, res) => {
  const gameId = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const requestedPlayers = Math.max(4, Math.min(10, Number(req.query.players) || 10));
  const requestedCaseId = String(req.query.testCaseId || '').trim();
  const extremeCase = requestedCaseId ? getExtremeCaseById(requestedCaseId) : null;
  const playerCount = extremeCase ? Number(extremeCase.playerCount || requestedPlayers) : requestedPlayers;
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = sha256Hex(serverSeed);
  const clientSeed = String(req.query.clientSeed || `client-${gameId.slice(0, 8)}`);
  const nonce = Number.isFinite(Number(req.query.nonce)) ? Number(req.query.nonce) : 0;

  let fullDeck;
  let deck;
  let hands;

  if (extremeCase) {
    fullDeck = buildFullDeckForExtremeCase(extremeCase);
    const forcedBoard = (extremeCase.board || []).map(codeToCard);
    const usedBoard = new Set(forcedBoard.map(cardCode));
    deck = fullDeck.filter((card) => !usedBoard.has(cardCode(card))).concat([
      cloneCard(forcedBoard[4]),
      cloneCard(forcedBoard[3]),
      cloneCard(forcedBoard[2]),
      cloneCard(forcedBoard[1]),
      cloneCard(forcedBoard[0]),
    ]);
    hands = (extremeCase.hands || []).map((hand) => hand.map(codeToCard));
  } else {
    fullDeck = deterministicShuffle(createDeck(), { serverSeed, clientSeed, nonce, gameId });
    deck = fullDeck.slice();
    hands = [];
    for (let i = 0; i < playerCount; i++) hands.push([deck.pop(), deck.pop()]);
  }

  const deckCommitment = computeDeckCommitment(fullDeck);

  games[gameId] = {
    gameId,
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce,
    deckCommitment,
    fullDeck,
    deck,
    hands,
    board: [],
    oddsHistory: {},
    jackpotSnapshots: [],
    createdAt: new Date().toISOString(),
    fairnessRevealedAt: null,
    extremeCaseId: extremeCase ? String(extremeCase.id) : null,
  };

  audit.startHand({
    gameId,
    playerCount,
    initialBalance: null,
    serverSeedHash,
    createdAt: games[gameId].createdAt,
  });
  audit.setRNG(gameId, {
    algorithm: extremeCase ? 'preloaded-extreme-case-v1' : 'sha256 deterministic shuffle',
    serverSeedHash,
    clientSeed,
    nonce,
    deckCommitment,
    dealtHands: hands.map((hand) => hand.map(cardCode)),
  });

  logServer('server_seed_hash', 'Empreinte du seed serveur générée', {
    gameId,
    serverSeedHash,
    clientSeed,
    nonce,
    deckCommitment,
    playerCount,
    extremeCaseId: extremeCase ? extremeCase.id : null,
  });
  logServer('round.start', 'Nouvelle manche démarrée', { gameId, playerCount, extremeCaseId: extremeCase ? extremeCase.id : null });
  audit.logAction(gameId, { type: 'hand_start', playerCount, extremeCaseId: extremeCase ? extremeCase.id : null });

  res.json({
    gameId,
    hands,
    board: [],
    extremeCaseId: extremeCase ? extremeCase.id : null,
    fairness: {
      serverSeedHash,
      clientSeed,
      nonce,
      deckCommitment,
    },
  });
});

app.get('/next', (req, res) => {
  const gameId = String(req.query.gameId || '');
  const game = games[gameId];
  if (!game) {
    logServer('round.next.missing', 'Partie introuvable', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  if (game.board.length === 0) {
    game.board.push(game.deck.pop(), game.deck.pop(), game.deck.pop());
  } else if (game.board.length === 3) {
    game.board.push(game.deck.pop());
  } else if (game.board.length === 4) {
    game.board.push(game.deck.pop());
  }

  const phase = phaseKey(game.board.length);
  logServer('round.next', 'Street révélée', {
    gameId,
    phase,
    boardLength: game.board.length,
  });
  audit.logStreet(gameId, phase, game.board.slice());
  audit.logAction(gameId, { type: 'street_reveal', phase, boardLength: game.board.length });

  res.json({ gameId, board: game.board, phase });
});


app.get('/fairness', (req, res) => {
  const gameId = String(req.query.gameId || '');
  const game = games[gameId];
  if (!game) {
    logServer('fairness.missing', 'Partie introuvable pour fairness', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  res.json(buildFairnessReveal(game));
});

app.get('/fairness/reveal', (req, res) => {
  const gameId = String(req.query.gameId || '');
  const game = games[gameId];
  if (!game) {
    logServer('fairness.reveal.missing', 'Partie introuvable pour reveal fairness', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  if (!game.fairnessRevealedAt) {
    logServer('fairness.reveal.pending', 'Reveal fairness demandé avant règlement', { gameId });
    return res.status(409).json({
      error: 'Fairness reveal unavailable before settlement',
      ...buildFairnessReveal(game),
    });
  }

  logServer('fairness.reveal.success', 'Reveal fairness renvoyé', { gameId, fairnessRevealedAt: game.fairnessRevealedAt });
  res.json(buildFairnessReveal(game));
});

app.get('/rtp', (req, res) => {
  res.json(buildRtpSummary());
});

app.get('/fairness/verify', (req, res) => {
  const gameId = String(req.query.gameId || '');
  const game = games[gameId];
  if (!game) {
    logServer('fairness.verify.missing', 'Partie introuvable pour vérification fairness', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  if (!game.fairnessRevealedAt) {
    return res.status(400).json({ error: 'Fairness unavailable until settlement' });
  }

  const reconstructedDeck = deterministicShuffle(createDeck(), {
    serverSeed: game.serverSeed,
    clientSeed: game.clientSeed,
    nonce: game.nonce,
    gameId: game.gameId,
  });

  const reconstructedCommitment = computeDeckCommitment(reconstructedDeck);
  const reconstructedHash = sha256Hex(game.serverSeed);
  const revealedDeckMatches = JSON.stringify(deckCodes(reconstructedDeck)) === JSON.stringify(deckCodes(game.fullDeck));

  res.json({
    gameId,
    verifiedAt: new Date().toISOString(),
    serverSeedHashMatches: reconstructedHash === game.serverSeedHash,
    deckCommitmentMatches: reconstructedCommitment === game.deckCommitment,
    revealedDeckMatches,
    fairness: {
      serverSeed: game.serverSeed,
      serverSeedHash: game.serverSeedHash,
      clientSeed: game.clientSeed,
      nonce: game.nonce,
      deckCommitment: game.deckCommitment,
      revealedDeck: deckCodes(game.fullDeck),
      reconstructedDeck: deckCodes(reconstructedDeck),
    },
  });
});

app.get('/odds', (req, res) => {
  const gameId = String(req.query.gameId || '');
  const game = games[gameId];
  if (!game) {
    logServer('odds.missing', 'Partie introuvable pour calcul des cotes', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  try {
    let odds = computeOdds(game);
    const phase = phaseKey(game.board.length);
    odds = applyExtremeCaseOddsOverride(game, phase, odds);
    game.oddsHistory[phase] = odds;
    logServer('odds.computed', 'Cotes calculées', {
      gameId,
      phase,
      totalBoards: odds.totalBoards,
    });
    audit.logAction(gameId, { type: 'odds_computed', phase, totalBoards: odds.totalBoards });
    res.json({ gameId, phase, ...odds });
  } catch (err) {
    logServer('odds.error', 'Erreur de calcul des cotes', { gameId, error: String(err.message || err) }, 'error');
    res.status(500).json({ error: 'Odds computation failed' });
  }
});

app.get('/result', (req, res) => {
  const gameId = String(req.query.gameId || '');
  const game = games[gameId];
  if (!game) {
    logServer('result.missing', 'Partie introuvable pour résultat', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  try {
    const result = getResult(game);
    logServer('result.computed', 'Résultat final calculé', {
      gameId,
      winnerType: result.winnerType,
      winners: result.winners,
    });
    res.json({ gameId, ...result });
  } catch (err) {
    logServer('result.error', 'Erreur de calcul du résultat', { gameId, error: String(err.message || err) }, 'error');
    res.status(400).json({ error: 'Result unavailable' });
  }
});

app.post('/settle', (req, res) => {
  const { gameId, handBets = [], tieBets = { pre: 0, flop: 0, turn: 0 } } = req.body || {};
  const game = games[String(gameId || '')];
  if (!game) {
    logServer('settle.missing', 'Partie introuvable pour règlement', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  try {
    const result = getResult(game);
    const phaseOdds = game.oddsHistory || {};
    const payoutByPhase = (phaseName, amount) => {
      const odds = phaseOdds[phaseName];
      if (!odds) return 0;

      if (result.winnerType === 'tie') {
        const tieProb = odds.tieProb || 0;
        return amount > 0 ? amount * oddsValue(tieProb) : 0;
      }

      const winnerIndex = result.winners[0];
      const winnerProb = odds.hands?.[winnerIndex]?.soloProb || 0;
      return amount > 0 ? amount * oddsValue(winnerProb) : 0;
    };

    let normalPaid = 0;
    if (result.winnerType === 'tie') {
      normalPaid += payoutByPhase('pre', Number(tieBets.pre || 0));
      normalPaid += payoutByPhase('flop', Number(tieBets.flop || 0));
      normalPaid += payoutByPhase('turn', Number(tieBets.turn || 0));
    } else {
      const winnerIndex = result.winners[0];
      const winnerBets = handBets[winnerIndex] || { pre: 0, flop: 0, turn: 0 };
      normalPaid += payoutByPhase('pre', Number(winnerBets.pre || 0));
      normalPaid += payoutByPhase('flop', Number(winnerBets.flop || 0));
      normalPaid += payoutByPhase('turn', Number(winnerBets.turn || 0));
    }

    normalPaid = Math.round(normalPaid * 100) / 100;

    const eligibleTarget = result.winnerType === 'tie'
      ? { targetKind: 'tie', targetIndex: -1 }
      : { targetKind: 'hand', targetIndex: result.winners[0] };
    const matchingSnapshots = Array.isArray(game.jackpotSnapshots)
      ? game.jackpotSnapshots.filter((snap) => snap.targetKind === eligibleTarget.targetKind && snap.targetIndex === eligibleTarget.targetIndex)
      : [];
    const jackpotPayouts = [];
    for (const snapshot of matchingSnapshots) {
      const claim = claimJackpot(snapshot.tier);
      if (!claim) continue;
      jackpotPayouts.push({
        snapshotId: snapshot.snapshotId,
        targetKind: snapshot.targetKind,
        targetIndex: snapshot.targetIndex,
        phase: snapshot.phase,
        rawOddsAtBetTime: snapshot.rawOddsAtBetTime,
        tier: snapshot.tier,
        paid: claim.paid,
        resetTo: claim.resetTo,
      });
    }
    const totalJackpotPaid = Math.round(jackpotPayouts.reduce((sum, payout) => sum + Number(payout.paid || 0), 0) * 100) / 100;
    const totalPaid = Math.round((normalPaid + totalJackpotPaid) * 100) / 100;
    game.jackpotSnapshots = [];

    logServer('round.end', 'Manche réglée', {
      gameId,
      winnerType: result.winnerType,
      winners: result.winners,
      normalPaid,
      totalJackpotPaid,
      totalPaid,
      jackpotPayouts,
      jackpots: jackpotSnapshot(),
    });

    game.fairnessRevealedAt = new Date().toISOString();

    audit.logResult(gameId, {
      winnerType: result.winnerType,
      winners: result.winners,
      normalPaid,
      totalJackpotPaid,
      totalPaid,
      jackpotPayouts,
      handBets,
      tieBets,
      finalBoard: game.board.slice(),
      fairnessRevealedAt: game.fairnessRevealedAt,
      serverSeed: game.serverSeed,
      serverSeedHash: game.serverSeedHash,
      clientSeed: game.clientSeed,
      nonce: game.nonce,
      deckCommitment: game.deckCommitment,
      revealedDeck: deckCodes(game.fullDeck),
    });
    const auditFilePath = audit.export();

    logServer('server_seed_reveal', 'Seed serveur révélé en fin de manche', {
      gameId,
      serverSeed: game.serverSeed,
      serverSeedHash: game.serverSeedHash,
      clientSeed: game.clientSeed,
      nonce: game.nonce,
      deckCommitment: game.deckCommitment,
      fairnessRevealedAt: game.fairnessRevealedAt,
      auditFilePath,
    });

    res.json({
      gameId,
      winnerType: result.winnerType,
      winners: result.winners,
      normalPaid,
      totalJackpotPaid,
      totalPaid,
      jackpotPayouts,
      jackpots: jackpotSnapshot(),
      fairness: buildFairnessReveal(game).fairness,
      rtp: buildRtpSummary(),
    });
  } catch (err) {
    logServer('settle.error', 'Erreur de règlement', { gameId, error: String(err.message || err) }, 'error');
    res.status(400).json({ error: 'Settlement unavailable' });
  }
});


app.get('/jackpots', (req, res) => {
  const gameId = String(req.query.gameId || '');
  const game = gameId ? games[gameId] : null;
  res.json({
    jackpots: jackpotSnapshot(),
    config: jackpotConfig,
    snapshots: Array.isArray(game?.jackpotSnapshots) ? game.jackpotSnapshots : [],
  });
});

app.post('/jackpots/bet', (req, res) => {
  const gameId = String(req.body?.gameId || '');
  const game = games[gameId];
  if (!game) {
    logServer('jackpots.bet.missing', 'Partie introuvable pour snapshot jackpot', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  const targetKind = String(req.body?.targetKind || '');
  const targetIndex = Number(req.body?.targetIndex);
  const phase = String(req.body?.phase || '');
  const rawOddsAtBetTime = Number(req.body?.rawOddsAtBetTime || 0);
  // Mise jackpot strictement unitaire : toujours 1, jamais plus.
  const amount = 1;
  const livePhase = currentJackpotPhase(game);

  if (!['hand', 'tie'].includes(targetKind) || !['pre', 'flop', 'turn'].includes(phase) || phase !== livePhase) {
    logServer('jackpots.bet.invalid_phase', 'Snapshot jackpot refusé', { gameId, targetKind, targetIndex, phase, livePhase }, 'error');
    return res.status(400).json({ error: 'Invalid jackpot phase or target' });
  }

  const expectedRawOdds = rawOddsForTargetAtPhase(game, targetKind, targetIndex, phase);
  const expectedWinProb = winProbForTargetAtPhase(game, targetKind, targetIndex, phase);
  const requestedWinProb = rawOddsAtBetTime > 0 ? (1 / rawOddsAtBetTime) : 0;
  const expectedTier = jackpotTierFromRawOdds(expectedRawOdds, expectedWinProb);
  const requestedTier = jackpotTierFromRawOdds(rawOddsAtBetTime, requestedWinProb);

  if (!expectedTier || !requestedTier || expectedTier !== requestedTier || Math.abs(expectedRawOdds - rawOddsAtBetTime) > 0.11) {
    logServer('jackpots.bet.invalid_odds', 'Snapshot jackpot refusé pour incohérence de cote', {
      gameId, targetKind, targetIndex, phase, rawOddsAtBetTime, expectedRawOdds, expectedTier, requestedTier
    }, 'error');
    return res.status(400).json({ error: 'Invalid jackpot odds snapshot' });
  }

  const alreadyBetThisTierOnTarget = game.jackpotSnapshots.some((snap) => snap &&
    snap.tier === expectedTier &&
    snap.targetKind === targetKind &&
    Number(snap.targetIndex) === Number(targetIndex)
  );
  if (alreadyBetThisTierOnTarget) {
    logServer('jackpots.bet.already_taken', 'Snapshot jackpot refusé car cette main/cible a déjà une mise de 1 sur ce jackpot', {
      gameId,
      targetKind,
      targetIndex,
      phase,
      tier: expectedTier,
    }, 'warn');
    return res.status(409).json({ error: 'Jackpot already bet for this target and tier in this round' });
  }

  const snapshotId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const snapshot = {
    snapshotId,
    gameId,
    targetKind,
    targetIndex,
    phase,
    rawOddsAtBetTime: expectedRawOdds,
    tier: expectedTier,
    amount: 1,
    createdAt: new Date().toISOString(),
  };

  game.jackpotSnapshots.push(snapshot);
  contributeJackpots(amount);
  logServer('jackpots.bet', 'Snapshot jackpot enregistré', { snapshot, jackpots: jackpotSnapshot() });
  res.json({ ok: true, snapshot, jackpots: jackpotSnapshot() });
});

app.post('/jackpots/refund', (req, res) => {
  const gameId = String(req.body?.gameId || '');
  const game = games[gameId];
  if (!game) {
    logServer('jackpots.refund.missing', 'Partie introuvable pour remboursement jackpot', { gameId }, 'error');
    return res.status(404).json({ error: 'Game not found' });
  }

  const snapshotId = String(req.body?.snapshotId || '');
  let idx = -1;
  if (snapshotId) {
    idx = game.jackpotSnapshots.findIndex((snap) => snap.snapshotId === snapshotId);
  }
  if (idx === -1) {
    const targetKind = String(req.body?.targetKind || '');
    const targetIndex = Number(req.body?.targetIndex);
    const phase = String(req.body?.phase || '');
    idx = game.jackpotSnapshots.findIndex((snap) => snap.targetKind === targetKind && snap.targetIndex === targetIndex && snap.phase === phase);
  }

  if (idx === -1) return res.status(404).json({ error: 'Jackpot snapshot not found' });

  const [removed] = game.jackpotSnapshots.splice(idx, 1);
  refundJackpots(removed.amount || 1);
  logServer('jackpots.refund', 'Snapshot jackpot remboursé', { removed, jackpots: jackpotSnapshot() });
  res.json({ ok: true, removed, jackpots: jackpotSnapshot() });
});

app.post('/jackpots/contribute', (req, res) => {
  const amount = Number(req.body?.amount || 0);
  contributeJackpots(amount);
  logServer('jackpots.contribute', 'Contribution jackpots appliquée', { amount, jackpots: jackpotSnapshot() });
  res.json({ ok: true, jackpots: jackpotSnapshot() });
});

app.post('/jackpots/claim', (req, res) => {
  const type = String(req.body?.type || '');
  const claim = claimJackpot(type);
  if (!claim) return res.status(400).json({ error: 'Invalid jackpot type' });
  logServer('jackpots.claim', 'Jackpot payé', { ...claim, jackpots: jackpotSnapshot() });
  res.json({ ok: true, ...claim, jackpots: jackpotSnapshot() });
});

function startServer() {
  return app.listen(PORT, () => {
    const msg = `Corsica Poker A2 server running on http://localhost:${PORT}`;
    console.log(msg);
    logServer('server.start', msg, { port: PORT });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
  createDeck,
  computeOdds,
  getResult,
  rawOddsValue,
  oddsValue,
  jackpotTierFromRawOdds,
  rank7Fast,
  cmpRank,
};

process.on('SIGINT', () => {
  try {
    audit.endSession({ reason: 'SIGINT' });
  } catch (err) {
    console.error('Audit export failed on shutdown:', err);
  }
  process.exit();
});
