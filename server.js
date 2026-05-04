// ==================================================
// JACKPOT ENGINE / SNAPSHOTS
// ==================================================

function evaluateJackpotSnapshot(oddsSnapshot) {
  const snapshot = {
    phase: oddsSnapshot?.phase || phase || 'pre',
    availableByType: { argent: [], or: [], diamant: [] },
    bestByType: { argent: null, or: null, diamant: null },
    bestByTarget: {}
  };

  if (!oddsSnapshot) return snapshot;

  (oddsSnapshot.hands || []).forEach((entry) => {
    const type = jackpotTypeForOddsValue(entry?.oddsValue);
    if (!type) return;
    const candidate = {
      targetKind: 'hand',
      targetIndex: Number(entry.handIndex),
      oddsValue: Number(entry.oddsValue || 0),
      phase: snapshot.phase
    };
    snapshot.availableByType[type].push(candidate);
    const targetKey = `hand:${entry.handIndex}`;
    const prev = snapshot.bestByTarget[targetKey];
    if (!prev || JACKPOT_TYPES.indexOf(type) > JACKPOT_TYPES.indexOf(prev.type)) {
      snapshot.bestByTarget[targetKey] = { type, ...candidate };
    }
  });

  const tieType = jackpotTypeForOddsValue(oddsSnapshot?.tie?.oddsValue);
  if (tieType) {
    const candidate = {
      targetKind: 'tie',
      targetIndex: -1,
      oddsValue: Number(oddsSnapshot.tie.oddsValue || 0),
      phase: snapshot.phase
    };
    snapshot.availableByType[tieType].push(candidate);
    snapshot.bestByTarget['tie:-1'] = { type: tieType, ...candidate };
  }

  JACKPOT_TYPES.forEach((type) => {
    const list = snapshot.availableByType[type] || [];
    list.sort((a, b) => Number(b.oddsValue || 0) - Number(a.oddsValue || 0));
    snapshot.bestByType[type] = list[0] || null;
  });

  if (typeof setJackpotSnapshot === 'function') setJackpotSnapshot(snapshot.phase, snapshot);
  return snapshot;
}

function getCurrentJackpotSnapshot() {
  return CorsicaState?.jackpotSnapshots?.[phase] || null;
}
