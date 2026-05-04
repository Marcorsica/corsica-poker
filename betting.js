function setPhase(nextPhase) {
  return setStateValue('phase', nextPhase);
}

function setBankroll(nextBankroll) {
  return setStateValue('bankroll', Number(nextBankroll || 0));
}

function setServerGameId(nextGameId) {
  return setStateValue('serverGameId', nextGameId || null);
}

function setCurrentHandsCount(nextCount) {
  return setStateValue('currentHandsCount', Number(nextCount || 0));
}

function setRoundFinished(isFinished) {
  return setStateValue('roundFinished', !!isFinished);
}

function setHands(nextHands) {
  return setStateValue('hands', Array.isArray(nextHands) ? nextHands : []);
}

function setBoard(nextBoard) {
  return setStateValue('board', Array.isArray(nextBoard) ? nextBoard : []);
}

function setOddsSnapshot(snapshotPhase, snapshot) {
  const next = { ...(CorsicaState.oddsSnapshots || {}) };
  next[snapshotPhase] = snapshot || null;
  return setStateValue('oddsSnapshots', next);
}

function setJackpotSnapshot(snapshotPhase, snapshot) {
  const next = { ...(CorsicaState.jackpotSnapshots || {}) };
  next[snapshotPhase] = snapshot || null;
  return setStateValue('jackpotSnapshots', next);
}
