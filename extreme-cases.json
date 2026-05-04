// ==================================================
// ODDS ENGINE / SNAPSHOTS
// ==================================================

function getPhaseLabelForSnapshot(snapshotPhase) {
  const ph = snapshotPhase || phase || "pre";
  return ph;
}

function createEmptyOddsSnapshot(snapshotPhase = phase) {
  return {
    phase: getPhaseLabelForSnapshot(snapshotPhase),
    boardCount: Array.isArray(board) ? board.length : 0,
    totalBoards: 0,
    hands: [],
    tie: { tieProb: 0, oddsValue: null, oddsStr: "—", status: "elim" }
  };
}

function buildOddsSnapshotFromServerResponse(serverOdds, snapshotPhase = phase) {
  const safeHands = Array.isArray(hands) ? hands : [];
  const snapshot = createEmptyOddsSnapshot(snapshotPhase);
  snapshot.totalBoards = Number(serverOdds?.totalBoards || 0);

  snapshot.hands = safeHands.map((hand, index) => {
    const soloProb = Number(serverOdds?.hands?.[index]?.soloProb || 0);
    const tieProb = Number(serverOdds?.hands?.[index]?.tieProb || 0);
    let status = 'elim';
    let oddsStr = '—';

    if (soloProb > 0) {
      status = 'active';
      oddsStr = isCertainWinProbability(soloProb) ? I18N[lang].gameFinished : formatOddsDisplay(soloProb);
    } else if (tieProb > 0) {
      status = 'splitOnly';
    }

    return {
      handIndex: index,
      soloProb,
      tieProb,
      oddsValue: fairOddsValue(soloProb),
      oddsStr,
      status
    };
  });

  const tieProb = Number(serverOdds?.tieProb || 0);
  snapshot.tie = {
    tieProb,
    oddsValue: fairOddsValue(tieProb),
    oddsStr: isCertainWinProbability(tieProb) ? I18N[lang].gameFinished : formatOddsDisplay(tieProb),
    status: tieProb > 0 ? 'active' : 'elim'
  };

  return snapshot;
}

function applyOddsSnapshot(snapshot) {
  if (!snapshot) return;

  snapshot.hands.forEach((entry, index) => {
    if (!hands[index]) return;
    hands[index].soloProb = Number(entry.soloProb || 0);
    hands[index].tieProb = Number(entry.tieProb || 0);
    hands[index].status = entry.status || 'elim';
    hands[index].oddsStr = entry.oddsStr || '—';
    if (snapshot.phase === 'pre') {
      hands[index].preflopOddsStr = hands[index].oddsStr;
    }
  });

  tieBet.tieProb = Number(snapshot.tie?.tieProb || 0);
  tieBet.oddsStr = snapshot.tie?.oddsStr || '—';
  if (snapshot.phase === 'pre') {
    tieBet.preflopOddsStr = tieBet.oddsStr;
  }

  if (typeof setOddsSnapshot === 'function') setOddsSnapshot(snapshot.phase, snapshot);
}
