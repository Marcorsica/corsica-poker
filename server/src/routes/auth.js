'use strict';

const express  = require('express');
const path     = require('path');
const { isLoginBlocked, recordFailedAttempt, resetLoginAttempts,
        timingSafeCodeEqual, createOpenToken } = require('../utils/auth');
const { logServer } = require('../utils/logger');

const ACCESS_CODE = String(process.env.CORSICA_ACCESS_CODE || '');
const router      = express.Router();

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', '..', 'public', 'login.html'));
});

router.post('/login', (req, res) => {
  const ip   = String(req.ip || 'unknown');
  const code = String(req.body?.code || '').trim();

  if (isLoginBlocked(ip)) {
    logServer('auth.login.blocked', 'IP bloquée temporairement', { ip }, 'warn');
    return res.status(429).json({ ok: false, error: 'TOO_MANY_ATTEMPTS' });
  }

  if (!timingSafeCodeEqual(code, ACCESS_CODE)) {
    recordFailedAttempt(ip);
    logServer('auth.login.failed', "Code d'accès refusé", { ip }, 'warn');
    return res.status(401).json({ ok: false, error: 'INVALID_CODE' });
  }

  resetLoginAttempts(ip);
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

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('corsica.sid');
    logServer('auth.logout', 'Session verrouillée', { ip: req.ip });
    res.json({ ok: true });
  });
});

module.exports = router;
