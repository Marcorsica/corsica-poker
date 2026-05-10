'use strict';

const express  = require('express');
const path     = require('path');
const session  = require('express-session');
const audit    = require('../audit/auditLogger');

const { requireAuth, hasValidOpenToken } = require('./utils/auth');
const { logServer, logClient }           = require('./utils/logger');
const { loadJackpots }                   = require('./services/jackpots');

const authRoutes    = require('./routes/auth');
const gameRoutes    = require('./routes/game');
const jackpotRoutes = require('./routes/jackpots');

console.log('A2 RNG SERVER LOADED');

const ACCESS_CODE    = String(process.env.CORSICA_ACCESS_CODE || '');
const SESSION_SECRET = String(process.env.SESSION_SECRET || '');
const PORT           = Number(process.env.PORT || 3001);

if (!ACCESS_CODE) {
  console.error("⛔  ERREUR CRITIQUE : La variable CORSICA_ACCESS_CODE n'est pas définie.");
  process.exit(1);
}
if (!SESSION_SECRET) {
  console.error("⛔  ERREUR CRITIQUE : La variable SESSION_SECRET n'est pas définie.");
  process.exit(1);
}
if (ACCESS_CODE.length < 6) {
  console.warn("⚠️  AVERTISSEMENT : Le code d'accès fait moins de 6 caractères.");
}

const app = express();
app.locals.games = Object.create(null);

const LOCAL_AUDIO_DIR    = path.join(__dirname, '..', '..', 'public', 'audio');
const EXTERNAL_AUDIO_DIR = process.env.CORSICA_AUDIO_DIR || 'C:\\Users\\user\\Desktop\\CORSICA\\CorsicaPokerAssets\\audio';

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(session({
  name: 'corsica.sid', secret: SESSION_SECRET,
  resave: false, saveUninitialized: false,
  proxy: process.env.NODE_ENV === 'production',
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
}));

// /audio et /external-audio sont servis via express.static(public) ci-dessous
app.use(express.static(path.join(__dirname, '..', '..', 'public'), { index: false }));

app.use((req, res, next) => {
  if (req.path !== '/log') {
    logServer('http.request', 'Requête HTTP reçue', { method: req.method, path: req.path, query: req.query || {} });
  }
  next();
});

app.use(authRoutes);

app.post('/log', (req, res) => {
  const entry = logClient(req.body || {});
  logServer('client.log.received', 'Log client reçu', { originalEvent: entry.event, message: entry.message });
  res.json({ ok: true });
});

app.get('/audio-health', (req, res) => {
  const fs = require('fs');
  const expectedFiles = [
    'audio_1_jazz.mp3','audio_2_jazz.mp3','audio_3_beats.mp3','audio_4_rnb.mp3',
    'audio_5_relax.mp3','audio_6_casino.mp3','snd_deal.mp3','snd_card.mp3','suspense.mp3',
  ];
  const files = Object.fromEntries(expectedFiles.map(name => [name, {
    local:    fs.existsSync(path.join(LOCAL_AUDIO_DIR,    name)),
    external: fs.existsSync(path.join(EXTERNAL_AUDIO_DIR, name)),
  }]));
  res.json({ ok: true, localAudioDir: LOCAL_AUDIO_DIR, externalAudioDir: EXTERNAL_AUDIO_DIR, files });
});

app.get('/', requireAuth, (req, res) => {
  if (!hasValidOpenToken(req)) return res.redirect('/login');
  delete req.session.corsicaOpenToken;
  req.session.save(() => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
  });
});

app.use(['/start','/next','/settle','/result','/odds','/fairness','/rtp','/test','/jackpots'], requireAuth);
app.use(gameRoutes);
app.use('/jackpots', jackpotRoutes);

audit.startSession({ app: 'Corsica Poker A2', port: PORT });
loadJackpots();

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
  app, startServer,
  ...require('./utils/cards'),
  ...require('./utils/odds'),
  ...require('./services/jackpots'),
};

process.on('SIGINT', () => {
  try { audit.endSession({ reason: 'SIGINT' }); } catch (err) { console.error('Audit export failed:', err); }
  process.exit();
});
