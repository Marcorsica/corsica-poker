'use strict';

const MARGIN_NORMAL  = 0.05;   // marge maison sur mises normales (5%)
const MARGIN_JACKPOT = 0.015;  // prélèvement sur mises jackpot (1,5%)

const jackpotConfig = {
  argent:  { reset: 0,  color: '#C0C0C0' },
  or:      { reset: 0,  color: '#FFD700' },
  diamant: { reset: 0, color: '#7dd3fc' },
};

const ECONOMY_SPLITS = {
  baseValue:       0.36,   // réserve maison pour les resets
  argentVisible:   0.21,
  orVisible:       0.15,
  diamantVisible:  0.115,
  argentHidden:    0.04,
  orHidden:        0.05,
  diamantHidden:   0.06,
};

const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS    = 15 * 60 * 1000;  // 15 minutes
const LOGIN_LOCKOUT_MS   = 15 * 60 * 1000;  // blocage 15 minutes

module.exports = {
  MARGIN_NORMAL,
  MARGIN_JACKPOT,
  jackpotConfig,
  ECONOMY_SPLITS,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  LOGIN_LOCKOUT_MS,
};
