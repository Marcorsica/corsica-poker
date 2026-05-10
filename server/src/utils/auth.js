'use strict';

const crypto = require('crypto');
const { LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS, LOGIN_LOCKOUT_MS } = require('../config');

// ── Protection anti brute-force ───────────────────────────────────────────────

const loginAttempts = new Map(); // ip -> { count, firstAttempt, lockedUntil }

function getLoginState(ip) {
  const now   = Date.now();
  let   state = loginAttempts.get(ip);
  if (!state) {
    state = { count: 0, firstAttempt: now, lockedUntil: 0 };
    loginAttempts.set(ip, state);
  }
  if (now - state.firstAttempt > LOGIN_WINDOW_MS && now > state.lockedUntil) {
    state.count        = 0;
    state.firstAttempt = now;
  }
  return state;
}

function isLoginBlocked(ip) {
  return Date.now() < getLoginState(ip).lockedUntil;
}

function recordFailedAttempt(ip) {
  const state = getLoginState(ip);
  state.count += 1;
  if (state.count >= LOGIN_MAX_ATTEMPTS) {
    state.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
  }
}

function resetLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

// Nettoyage périodique
setInterval(() => {
  const now = Date.now();
  for (const [ip, state] of loginAttempts.entries()) {
    if (now - state.firstAttempt > LOGIN_WINDOW_MS * 2 && now > state.lockedUntil) {
      loginAttempts.delete(ip);
    }
  }
}, 30 * 60 * 1000);

// ── Comparaison sécurisée (timing-safe) ──────────────────────────────────────

function timingSafeCodeEqual(input, expected) {
  try {
    const a = Buffer.from(String(input).padEnd(64, '\0'));
    const b = Buffer.from(String(expected).padEnd(64, '\0'));
    return crypto.timingSafeEqual(a, b) && input.length === expected.length;
  } catch {
    return false;
  }
}

// ── Helpers session ───────────────────────────────────────────────────────────

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
  const protectedPaths = ['/api/', '/start', '/next', '/settle', '/fairness', '/test/'];
  if (protectedPaths.some(p => req.path.startsWith(p) || req.path === p)) {
    return res.status(401).json({ ok: false, error: 'AUTH_REQUIRED' });
  }
  return res.redirect('/login');
}

module.exports = {
  isLoginBlocked, recordFailedAttempt, resetLoginAttempts,
  timingSafeCodeEqual, isAuthenticated, createOpenToken,
  hasValidOpenToken, requireAuth,
};
