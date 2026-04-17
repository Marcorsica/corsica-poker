// ==================================================
// BETTING FLOW
// ==================================================

function placeBetOnHand(index, ph) {
 if (!canBetOnPhase(ph)) return;
 const h = hands[index];
 if (!h) return;

 const jackpotType = jackpotTypeForOddsValue(getTargetOddsValue("hand", index));
 const jackpotSuppressed = jackpotType && shouldSuppressJackpotOfferAtPhase(jackpotType, "hand", index, ph);
 if (jackpotType && ph === phase && !jackpotSuppressed) {
  placeJackpotBet(jackpotType, "hand", index);
  return;
 }

 if (h.status === "elim" || h.status === "splitOnly") {
 return;
 }

 if (h.oddsStr === I18N[lang].gameFinished) {
 autoFinishRoundIfLockedWinner();
 return;
 }

 if (isLowOddsDisplay(h.oddsStr)) {
 return;
 }

 if (bankroll < selectedBet) {
 log(I18N[lang].insufficient);
 return;
 }

 h.bets[ph] += selectedBet;
 h.betLots[ph].push({
 amt: selectedBet,
 odds: Math.max(0, Number(h.oddsStr) || 0),
 });

 updateBankroll(-selectedBet);
 const targetNode = document.querySelector(`.hand:nth-child(${index + 1}) .hand-inner`) || document.querySelector(`.hand[data-hand="${index}"] .hand-inner`);
 triggerBetImpactSound();
 launchChipFlight(targetNode);
 computeTotalBets();
 renderHands();
 animateBetSquare(`.sq[data-phase="${ph}"][data-hand="${index}"]`);
 log(`${I18N[lang].betPlaced}: ${selectedBet} → main ${index + 1} (${I18N[lang].phase[ph]})`);
 if (phase === "pre" && getPreflopCommittedBetTotal() > 0) advanceUnlockedForRound = true;
 refreshActionButtons();
}

function placeBetOnTie(ph) {
 if (!canBetOnPhase(ph)) return;
 const jackpotType = jackpotTypeForOddsValue(getTargetOddsValue("tie", -1));
 const jackpotSuppressed = jackpotType && shouldSuppressJackpotOfferAtPhase(jackpotType, "tie", -1, ph);
 if (jackpotType && ph === phase && !jackpotSuppressed) {
  placeJackpotBet(jackpotType, "tie", -1);
  return;
 }
 if (bankroll < selectedBet) {
 log(I18N[lang].insufficient);
 return;
 }

 tieBet.bets[ph] += selectedBet;
 tieBet.lots[ph].push({
 amt: selectedBet,
 odds: Math.max(0, Number(tieBet.oddsStr) || 0),
 });

 updateBankroll(-selectedBet);
 triggerBetImpactSound();
 launchChipFlight(document.getElementById("tieBox"));
 computeTotalBets();
 renderHands();
 animateBetSquare(`.sq[data-tie-phase="${ph}"]`);
 log(`${I18N[lang].betPlaced}: ${selectedBet} → ${I18N[lang].tie} (${I18N[lang].phase[ph]})`);
 if (phase === "pre" && getPreflopCommittedBetTotal() > 0) advanceUnlockedForRound = true;
 refreshActionButtons();
}

function undoHandBet(index, ph) {
 const h = hands[index];
 if (!h || !h.betLots[ph] || h.betLots[ph].length === 0 || roundFinished || isCalculating) return;

 const removed = h.betLots[ph].pop();
 h.bets[ph] = Math.max(0, h.bets[ph] - removed.amt);

 updateBankroll(removed.amt);
 computeTotalBets();
 renderHands();
 log(`${I18N[lang].undo}: main ${index + 1} (${I18N[lang].phase[ph]})`);
 if (phase === "pre" && getPreflopCommittedBetTotal() <= 0) advanceUnlockedForRound = false;
 refreshActionButtons();
}

function undoTieBet(ph) {
 if (!tieBet.lots[ph] || tieBet.lots[ph].length === 0 || roundFinished || isCalculating) return;

 const removed = tieBet.lots[ph].pop();
 tieBet.bets[ph] = Math.max(0, tieBet.bets[ph] - removed.amt);

 updateBankroll(removed.amt);
 computeTotalBets();
 renderHands();
 log(`${I18N[lang].undo}: ${I18N[lang].tie} (${I18N[lang].phase[ph]})`);
 if (phase === "pre" && getPreflopCommittedBetTotal() <= 0) advanceUnlockedForRound = false;
 refreshActionButtons();
}

function onHandClick(index, ph) {
 startAmbience();
 placeBetOnHand(index, ph);
}

function onTieClick(ph) {
 startAmbience();
 placeBetOnTie(ph);
}

