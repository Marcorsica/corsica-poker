// ==================================================
// ODDS / JACKPOTS
// ==================================================

function parseOddsNumber(v) {
 if (!v || v === "—" || isLowOddsDisplay(v)) return null;
 const n = Number(v);
 return Number.isFinite(n) ? n : null;
}

function jackpotTypeForOddsValue(oddsValue) {
 if (!Number.isFinite(Number(oddsValue))) return null;
 if (Number(oddsValue) >= 8000) return "diamant";
 if (Number(oddsValue) >= 800) return "or";
 if (Number(oddsValue) >= 220) return "argent";
 return null;
}

function fairOddsValue(prob) {
 if (!prob || prob <= 0) return null;
 const fair = 1 / prob;
 return Math.round(fair * 100) / 100;
}

function getTargetOddsValue(targetKind, targetIndex, useFairOddsForJackpot = true) {
 if (targetKind === "tie") {
  if (useFairOddsForJackpot) return fairOddsValue(Number(tieBet?.tieProb || 0));
  return parseOddsNumber(phase === "river" ? tieBet.finalOddsStr : tieBet.oddsStr);
 }
 const h = hands[targetIndex];
 if (!h) return null;
 if (useFairOddsForJackpot) return fairOddsValue(Number(h?.soloProb || 0));
 return parseOddsNumber(phase === "river" ? h.finalOddsStr : h.oddsStr);
}

function getJackpotTarget(kind) {
 const snapshot = typeof getCurrentJackpotSnapshot === "function" ? getCurrentJackpotSnapshot() : null;
 if (snapshot?.bestByType?.[kind]) return snapshot.bestByType[kind];

 const candidates = [];

 hands.forEach((h, index) => {
 const oddsValue = getTargetOddsValue("hand", index);
 if (jackpotTypeForOddsValue(oddsValue) === kind) {
 candidates.push({ targetKind: "hand", targetIndex: index, oddsValue });
 }
 });

 const tieOddsValue = getTargetOddsValue("tie", -1);
 if (jackpotTypeForOddsValue(tieOddsValue) === kind) {
 candidates.push({ targetKind: "tie", targetIndex: -1, oddsValue: tieOddsValue });
 }

 if (!candidates.length) return null;
 candidates.sort((a, b) => b.oddsValue - a.oddsValue);
 return candidates[0];
}

function getJackpotAvailability() {
 return {
  argent: !!getJackpotTarget("argent"),
  or: !!getJackpotTarget("or"),
  diamant: !!getJackpotTarget("diamant")
 };
}

function getJackpotValueForType(type) {
 return Number(jackpots?.[type] || JACKPOT_RESETS[type] || 0);
}

function jackpotPotLabel(type) {
 const labels = {
  argent: lang === 'fr' ? 'ARGENT' : 'SILVER',
  or: lang === 'fr' ? 'OR' : 'GOLD',
  diamant: lang === 'fr' ? 'DIAMANT' : 'DIAMOND'
 };
 return labels[type] || '';
}

function jackpotPromptForType(type) {
 const map = {
  argent: 'tryArgentJackpot',
  or: 'tryOrJackpot',
  diamant: 'tryDiamantJackpot'
 };
 return I18N[lang][map[type]] || '';
}

function getJackpotBetList(type) {
 return Array.isArray(jackpotBets[type]) ? jackpotBets[type] : [];
}

function hasJackpotBet(type, targetKind, targetIndex, ph = null) {
 return getJackpotBetList(type).some((bet) =>
 bet.targetKind === targetKind &&
 bet.targetIndex === targetIndex &&
 (ph === null || bet.phase === ph)
 );
}

function hasAnyJackpotBetOnTarget(targetKind, targetIndex, ph = null) {
 return JACKPOT_TYPES.some((type) => hasJackpotBet(type, targetKind, targetIndex, ph));
}

function hasAnyJackpotBetOfType(type) {
 return getJackpotBetList(type).length > 0;
}

function isJackpotTypeLocked(type) {
 return hasAnyJackpotBetOfType(type);
}

function isJackpotTypeLockedForTarget(type, targetKind, targetIndex) {
 return hasJackpotTypeAlreadyBetOnTarget(type, targetKind, targetIndex);
}

function hasJackpotTypeAlreadyBetOnTarget(type, targetKind, targetIndex) {
 return getJackpotBetList(type).some((bet) =>
  bet.targetKind === targetKind && bet.targetIndex === targetIndex
 );
}

function hasJackpotTypeBetOnTargetAtPhase(type, targetKind, targetIndex, ph) {
 return getJackpotBetList(type).some((bet) =>
  bet.targetKind === targetKind &&
  bet.targetIndex === targetIndex &&
  bet.phase === ph
 );
}

function shouldSuppressJackpotOfferAtPhase(type, targetKind, targetIndex, ph) {
 return hasJackpotTypeAlreadyBetOnTarget(type, targetKind, targetIndex);
}

function animateJackpotBoxOnBet(type) {
 const box = jackpotBoxEls?.[type];
 if (!box) return;
 box.classList.remove('jackpot-bet-once');
 void box.offsetWidth;
 box.classList.add('jackpot-bet-once');
}

function jackpotTargetStillAlive(targetKind, targetIndex) {
 if (targetKind === "tie") {
  return tieBet.oddsStr !== "—";
 }
 const h = hands[targetIndex];
 return !!h && h.status === "active";
}

function isJackpotBetStillAlive(bet) {
 if (!bet || roundFinished) return false;
 return jackpotTargetStillAlive(bet.targetKind, bet.targetIndex);
}

function hasAnyLiveJackpotBetOfType(type) {
 return getJackpotBetList(type).some((bet) => isJackpotBetStillAlive(bet));
}

function updateJackpotDisplays() {
 const availability = getJackpotAvailability();
 for (const type of JACKPOT_TYPES) {
  const valueEl = jackpotValueEls[type];
  const boxEl = jackpotBoxEls[type];
  if (valueEl) valueEl.textContent = getJackpotValueForType(type).toFixed(2);
  if (boxEl) {
   const hasBet = getJackpotBetList(type).length > 0;
   const hasLiveBet = hasAnyLiveJackpotBetOfType(type);
   boxEl.classList.toggle('available', !!availability[type]);
   boxEl.classList.toggle('locked', !availability[type]);
   boxEl.classList.toggle('active-bet', hasBet);
   boxEl.classList.toggle('jackpot-bet-persistent', hasLiveBet);
   boxEl.classList.toggle('flash-argent', hasLiveBet && type === 'argent');
   boxEl.classList.toggle('flash-or', hasLiveBet && type === 'or');
   boxEl.classList.toggle('flash-diamant', hasLiveBet && type === 'diamant');
   if (!hasBet) {
    boxEl.classList.remove('jackpot-bet-once');
   }
  }
 }
}


async function placeJackpotBet(type, targetKind, targetIndex) {
 if (roundFinished || isCalculating || phase === "river") return;
 if (isJackpotTypeLockedForTarget(type, targetKind, targetIndex)) {
  log(`${jackpotPotLabel(type)} ${lang === 'fr' ? 'déjà misé sur cette main' : 'already bet on this hand'}`);
  return;
 }

 if (targetKind === "hand") {
  const hand = hands[targetIndex];
  if (hand && hand.oddsStr === I18N[lang].gameFinished) {
   autoFinishRoundIfLockedWinner();
   return;
  }
 }

 const oddsValue = getTargetOddsValue(targetKind, targetIndex);
 if (jackpotTypeForOddsValue(oddsValue) !== type) return;

 if (bankroll < 1) {
  log(I18N[lang].insufficient);
  return;
 }

 const betResponse = await placeJackpotSnapshotOnServer(targetKind, targetIndex, phase, oddsValue);
 if (!betResponse?.snapshot) {
  log('Erreur serveur sur la mise jackpot');
  await syncJackpotDisplayFromServer();
  return;
 }

 getJackpotBetList(type).push({
  targetKind,
  targetIndex,
  phase,
  snapshotId: betResponse.snapshot.snapshotId,
  rawOddsAtBetTime: betResponse.snapshot.rawOddsAtBetTime,
  tier: betResponse.snapshot.tier
 });
 jackpotRoundStake[type] += 1;

 updateBankroll(-1);
 triggerBetImpactSound();
 computeTotalBets();
 renderHands();
 updateJackpotDisplays();
 animateJackpotBoxOnBet(type);

 const targetNode = targetKind === "tie"
 ? document.getElementById("tieBox")
 : handsLayer?.children[targetIndex]?.querySelector(".hand-inner");

 launchChipFlight(targetNode);
 if (targetKind === "tie") {
  animateBetSquare(`.sq[data-tie-phase="${phase}"]`);
 } else {
  animateBetSquare(`.sq[data-phase="${phase}"][data-hand="${targetIndex}"]`);
 }
 if (phase === "pre") advanceUnlockedForRound = true;
 log(`${jackpotPromptForType(type)}: 1`);
 refreshActionButtons();
}

async function undoJackpotBet(type, targetKind, targetIndex, ph = phase) {
 if (roundFinished || isCalculating) return;

 const list = getJackpotBetList(type);
 const idx = list.findIndex((bet) =>
  bet.targetKind === targetKind &&
  bet.targetIndex === targetIndex &&
  bet.phase === ph
 );

 if (idx === -1) return;

 const [removedBet] = list.splice(idx, 1);
 const refundResponse = await refundJackpotSnapshotOnServer(removedBet?.snapshotId, targetKind, targetIndex, ph);
 if (!refundResponse?.ok) {
  list.splice(idx, 0, removedBet);
  log('Erreur serveur sur le remboursement jackpot');
  await syncJackpotDisplayFromServer();
  return;
 }
 jackpotRoundStake[type] = Math.max(0, Number(jackpotRoundStake[type] || 0) - 1);

 updateBankroll(1);
 computeTotalBets();
 renderHands();
 updateJackpotDisplays();
 refreshActionButtons();

 if (phase === "pre" && getPreflopCommittedBetTotal() <= 0) {
  advanceUnlockedForRound = false;
 }

 log(`${I18N[lang].undo}: ${jackpotPromptForType(type)}`);
 refreshActionButtons();
}

function jackpotLabelForTarget(targetKind, targetIndex) {
 const oddsValue = getTargetOddsValue(targetKind, targetIndex);
 const type = jackpotTypeForOddsValue(oddsValue);
 if (!type) return null;
 return jackpotPromptForType(type);
}

function jackpotSquareText(targetKind, targetIndex, ph) {
 const jackpotType = jackpotTypeForOddsValue(getTargetOddsValue(targetKind, targetIndex));
 const jackpotEligibleCurrentPhase = jackpotType && ph === phase && phase !== "river";
 const jackpotOfferSuppressed = jackpotType && shouldSuppressJackpotOfferAtPhase(jackpotType, targetKind, targetIndex, ph);
 const betPlaced = hasAnyJackpotBetOnTarget(targetKind, targetIndex, ph);

 if (betPlaced) return "1";

 if (jackpotEligibleCurrentPhase && !jackpotOfferSuppressed) {
 return "0";
 }

 if (targetKind === "tie") {
 const normal = tieBet.bets[ph] || 0;
 return normal > 0 ? normal.toFixed(0) : "";
 } else {
 const h = hands[targetIndex];
 const normal = h?.bets?.[ph] || 0;
 return normal > 0 ? normal.toFixed(0) : "";
 }
}



function getJackpotBetTypeOnTargetPhase(targetKind, targetIndex, ph) {
 for (const type of JACKPOT_TYPES) {
  if (hasJackpotBet(type, targetKind, targetIndex, ph)) return type;
 }
 return null;
}

function jackpotLostLabel(type) {
 return jackpotPotLabel(type);
}



function getLostJackpotText(targetKind, targetIndex, ph) {
 for (const type of JACKPOT_TYPES) {
 const hasBetHere = hasJackpotBet(type, targetKind, targetIndex, ph);
 if (!hasBetHere) continue;

 if (roundFinished) {
 const wonHere = lastWinningTargets.some((winner) =>
 winner.targetKind === targetKind && winner.targetIndex === targetIndex
 );
 if (!wonHere) return jackpotLostLabel(type);
 } else if (!jackpotTargetStillAlive(targetKind, targetIndex)) {
 return jackpotLostLabel(type);
 }
 }
 return "";
}


function applyServerJackpotPayouts(jackpotPayouts = []) {
 for (const payout of jackpotPayouts) {
  const type = payout?.tier;
  const paid = Number(payout?.paid || 0);
  const targetKind = payout?.targetKind;
  const targetIndex = Number(payout?.targetIndex);
  const sourceNode = targetKind === 'tie'
   ? document.getElementById('tieBox')
   : (handsLayer ? handsLayer.children[targetIndex]?.querySelector('.hand-inner') : null);

  if (paid > 0) {
   launchWinCoinBurst(sourceNode, paid);
   updateBankroll(paid);
   totalWins += paid;
   triggerWinEffects(paid);
   updateTotalWinsDisplay();
  }

  if (type) {
   log(`🏆 ${I18N[lang].jackpotWon}: ${jackpotPotLabel(type)} +${paid.toFixed(2)}`);
  }
 }

 jackpotBets = { argent: [], or: [], diamant: [] };
 jackpotRoundStake = { argent: 0, or: 0, diamant: 0 };
 updateJackpotDisplays();
}

async function maybePayJackpotForWinner() {
 return null;
}

function setCalcStatus(on) {
 isCalculating = on;
 if (statusEl) statusEl.textContent = on ? I18N[lang].calcStatus : "";
 refreshActionButtons();
 saveSettings();
}

