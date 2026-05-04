// ==================================================
// LOCAL SIMULATION / ROUND FLOW
// ==================================================

function workerCode() {
 const cmpRank = (a, b) => {
 const n = Math.max(a.length, b.length);
 for (let i = 0; i < n; i++) {
 const av = a[i] ?? -1;
 const bv = b[i] ?? -1;
 if (av !== bv) return av > bv ? 1 : -1;
 }
 return 0;
 };

 const straightHighFromMask = (mask) => {
 for (let high = 14; high >= 5; high--) {
 let needed = 0;
 for (let r = high; r > high - 5; r--) needed |= (1 << r);
 if ((mask & needed) === needed) return high;
 }
 const wheel = (1 << 14) | (1 << 5) | (1 << 4) | (1 << 3) | (1 << 2);
 if ((mask & wheel) === wheel) return 5;
 return 0;
 };

 const rank7Fast = (cards7) => {
 const rankCounts = new Uint8Array(15);
 let mask = 0;

 let suitCountS = 0, suitCountH = 0, suitCountD = 0, suitCountC = 0;
 let suitMaskS = 0, suitMaskH = 0, suitMaskD = 0, suitMaskC = 0;

 for (let i = 0; i < 7; i++) {
 const c = cards7[i];
 const r = c.r;
 rankCounts[r] += 1;
 mask |= (1 << r);

 if (c.s === "S") {
 suitCountS++;
 suitMaskS |= (1 << r);
 } else if (c.s === "H") {
 suitCountH++;
 suitMaskH |= (1 << r);
 } else if (c.s === "D") {
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
 };

 const makeDeck = () => {
 const suits = ["S", "H", "D", "C"];
 const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
 const d = [];
 for (const s of suits) for (const r of ranks) d.push({ r, s });
 return d;
 };

 const evaluateBoard = (hands, fullBoard, out) => {
 const board0 = fullBoard[0];
 const board1 = fullBoard[1];
 const board2 = fullBoard[2];
 const board3 = fullBoard[3];
 const board4 = fullBoard[4];

 const ranks = new Array(hands.length);
 let best = null;

 for (let i = 0; i < hands.length; i++) {
 const r = rank7Fast([hands[i][0], hands[i][1], board0, board1, board2, board3, board4]);
 ranks[i] = r;
 if (!best || cmpRank(r, best) > 0) best = r;
 }

 let winnersCount = 0;
 let lastWinner = -1;
 const winners = [];

 for (let i = 0; i < ranks.length; i++) {
 if (cmpRank(ranks[i], best) === 0) {
 winnersCount++;
 lastWinner = i;
 winners.push(i);
 }
 }

 if (winnersCount >= 2) {
 out.tieBoards += 1;
 for (let k = 0; k < winners.length; k++) {
 out.hands[winners[k]].tieWins += 1;
 }
 } else {
 out.hands[lastWinner].soloWins += 1;
 }

 out.totalBoards += 1;
 };

 onmessage = (e) => {
 const { hands, board } = e.data;

 const used = new Set();
 for (let i = 0; i < hands.length; i++) {
 used.add(`${hands[i][0].r}${hands[i][0].s}`);
 used.add(`${hands[i][1].r}${hands[i][1].s}`);
 }
 for (let i = 0; i < board.length; i++) used.add(`${board[i].r}${board[i].s}`);

 const remaining = makeDeck().filter(c => !used.has(`${c.r}${c.s}`));
 const missing = 5 - board.length;

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
 for (let f = d + 1; f < remaining.length; f++) {
 evaluateBoard(hands, [remaining[a], remaining[b], remaining[c], remaining[d], remaining[f]], acc);
 }
 }
 }
 }
 }
 } else {
 postMessage({ error: `Unsupported missing board size: ${missing}` });
 return;
 }

 const total = acc.totalBoards || 1;
 postMessage({
 hands: acc.hands.map(h => ({
 soloProb: h.soloWins / total,
 tieProb: h.tieWins / total,
 })),
 tieProb: acc.tieBoards / total,
 totalBoards: acc.totalBoards,
 exact: true,
 });
 };
}

function recalcOdds() {
 if (phase === "river") return;

 setCalcStatus(true);

 for (const h of hands) {
 h.oddsStr = "—";
 }
 tieBet.oddsStr = "—";
 renderHands();

 const t0 = performance.now();

 const blob = new Blob([`(${workerCode.toString()})()`], { type: "application/javascript" });
 const url = URL.createObjectURL(blob);
 const w = new Worker(url);

 const msg = {
 hands: hands.map(h => [h.cards[0], h.cards[1]]),
 board: board.map(cloneCard),
 phase,
 };

 const handle = (e) => {
 const res = e.data;
 const dt = Math.round(performance.now() - t0);
 if (calcMs) {
 const boardsLabel = res.totalBoards ? ` • ${res.totalBoards.toLocaleString()} boards` : "";
 calcMs.textContent = `${dt} ms${boardsLabel}`;
 }

 URL.revokeObjectURL(url);
 w.removeEventListener("message", handle);
 w.terminate();

 for (let i = 0; i < hands.length; i++) {
 const pSolo = res.hands[i].soloProb;
 const pTie = res.hands[i].tieProb;

 hands[i].soloProb = pSolo;
 hands[i].tieProb = pTie;

 if (pSolo > 0) {
 hands[i].status = "active";
 hands[i].oddsStr = isCertainWinProbability(pSolo) ? I18N[lang].gameFinished : formatOddsDisplay(pSolo);
 if (phase === "pre") hands[i].preflopOddsStr = hands[i].oddsStr;
 } else if (pTie > 0) {
 hands[i].status = "splitOnly";
 hands[i].oddsStr = "—";
 if (phase === "pre") hands[i].preflopOddsStr = "—";
 } else {
 hands[i].status = "elim";
 hands[i].oddsStr = "—";
 if (phase === "pre") hands[i].preflopOddsStr = "—";
 }
 }

 tieBet.tieProb = res.tieProb;
 tieBet.oddsStr = isCertainWinProbability(res.tieProb)
 ? I18N[lang].gameFinished
 : formatOddsDisplay(res.tieProb);
 if (phase === "pre") tieBet.preflopOddsStr = tieBet.oddsStr;

 setCalcStatus(false);
 renderHands();

 if (hasWinningHandLocked()) {
 autoFinishTimer = clearTimeoutRef(autoFinishTimer);
 autoFinishTimer = setTimeout(() => {
 autoFinishTimer = null;
 autoFinishRoundIfLockedWinner();
 }, 2000);
 }
 };

 w.addEventListener("message", handle);
 w.postMessage(msg);
}

function resetBets() {
 for (const h of hands) {
 h.bets = { pre: 0, flop: 0, turn: 0 };
 h.betLots = { pre: [], flop: [], turn: [] };
 }
 tieBet = {
 bets: { pre: 0, flop: 0, turn: 0 },
 lots: { pre: [], flop: [], turn: [] },
 oddsStr: "—",
 preflopOddsStr: "—",
 finalOddsStr: "—",
 resultLabel: "",
 };
}

function newRound() {
 applyPendingJackpotCredits();
 phase = "pre";
 roundFinished = false;
 advanceUnlockedForRound = false;
 isAdvancingPhase = false;
 if (autoFinishTimer) {
 clearTimeout(autoFinishTimer);
 autoFinishTimer = null;
 }
 jackpotBets = { argent: [], or: [], diamant: [] };
 jackpotRoundStake = { argent: 0, or: 0, diamant: 0 };
 deck = shuffleInPlace(makeDeck());
 board = [];

 hands = [];
 for (let i = 0; i < currentHandsCount; i++) {
 hands.push({
 cards: [draw(deck), draw(deck)],
 oddsStr: "—",
 preflopOddsStr: "—",
 finalOddsStr: "—",
 resultLabel: "",
 status: "active",
 bets: { pre: 0, flop: 0, turn: 0 },
 betLots: { pre: [], flop: [], turn: [] },
 });
 }

 resetBets();
 buildHandsUI();

 const tieBox = document.getElementById("tieBox");
 if (tieBox) {
 tieBox.classList.remove("tie-win", "tie-lose", "tie-expanded-final");
 }

 totalWins = 0;
 lastWinningTargets = [];
 updateTotalWinsDisplay();

 renderBoard();
 setLang(lang);

 for (const h of hands) h.resultLabel = "";
 tieBet.resultLabel = "";

 if (handsLayer) {
 handsLayer.querySelectorAll(".hand").forEach(n => {
 n.style.opacity = "";
 n.classList.remove("winner");
 });
 }

 playSound(sndDeal);
 log(`— ${I18N[lang].newRound} (${currentHandsCount}) —`);
 computeTotalBets();
 refreshActionButtons();
 recalcOdds();
}



function stopSuspenseAudio() {
 if (!suspenseAudio) return;
 try {
 suspenseAudio.pause();
 suspenseAudio.currentTime = 0;
 } catch (_) {}
}

function duckSuspenseForCoins(durationMs = 950) {
 if (!suspenseAudio) return;

 if (suspenseDuckTimer) {
 clearTimeout(suspenseDuckTimer);
 suspenseDuckTimer = null;
 }

 const current = Number(suspenseAudio.volume || 0);
 const lowered = Math.min(current, 0.28);
 suspenseAudio.volume = lowered;

 suspenseDuckTimer = setTimeout(() => {
 if (suspenseAudio) {
 suspenseAudio.volume = Math.max(Number(suspenseAudio.volume || 0), 1);
 }
 suspenseDuckTimer = null;
 }, durationMs);
}

function playTensionBeforeRiver(callback) {
 const tensionMs = 1800;

 if (!soundEnabled) {
 setTimeout(callback, tensionMs);
 return;
 }

 stopSuspenseAudio();
 suspenseAudio = new Audio("/assets/audio/suspense.mp3");
 suspenseAudio.volume = 0.18;
 suspenseAudio.play().catch(() => {});

 const start = performance.now();

 function ramp() {
 if (!suspenseAudio) return;
 const progress = Math.min(1, (performance.now() - start) / tensionMs);
 suspenseAudio.volume = Math.min(1, 0.18 + (progress * progress * 0.96));
 if (progress < 1) {
 requestAnimationFrame(ramp);
 }
 }

 ramp();

 setTimeout(() => {
 stopSuspenseAudio();
 callback();
 }, tensionMs);
}

function hasCertainWinnerBeforeRiver() {
 if (phase !== "turn") return false;
 const soloLocked = hands.some((h) => h && h.status === "active" && h.oddsStr === I18N[lang].gameFinished);
 const tieLocked = isCertainWinProbability(tieBet?.tieProb);
 return soloLocked || tieLocked;
}

function hasWinningHandLocked() {
 if (phase === "river") return false;
 const soloLocked = hands.some((h) => h && h.status === "active" && h.oddsStr === I18N[lang].gameFinished);
 const tieLocked = isCertainWinProbability(tieBet?.tieProb);
 return soloLocked || tieLocked;
}

function closeAllHandDetails() {
 if (!handsLayer) return;
 handsLayer.querySelectorAll(".hand.details-open").forEach((node) => {
 node.classList.remove("details-open");
 });
}

function autoFinishRoundIfLockedWinner() {
 if (roundFinished || isCalculating || phase === "river") return;
 if (!hasWinningHandLocked()) return;

 closeAllHandDetails();

 if (btnAdvance) btnAdvance.disabled = true;

 if (phase === "pre") {
 board.push(draw(deck), draw(deck), draw(deck));
 phase = "flop";
 playSound(sndCard);
 renderBoard();
 setLang(lang);
 triggerStreetImpact();
 recalcOdds();
 return;
 }

 if (phase === "flop") {
 board.push(draw(deck));
 phase = "turn";
 playSound(sndCard);
 renderBoard();
 setLang(lang);
 triggerStreetImpact();
 recalcOdds();
 return;
 }

 if (phase === "turn") {
 autoFinishTimer = clearTimeoutRef(autoFinishTimer);
 autoFinishTimer = setTimeout(() => {
 autoFinishTimer = null;
 if (!roundFinished && !isAdvancingPhase) advanceToShowdown();
 }, 1000);
 }
}

function advanceToShowdown() {
 if (phase === "pre" && getPreflopCommittedBetTotal() > 0) advanceUnlockedForRound = true;

 if (phase === "river" || roundFinished || isCalculating || isAdvancingPhase) return;
 isAdvancingPhase = true;

 if (phase === "pre") {
 board.push(draw(deck), draw(deck), draw(deck));
 phase = "flop";
 playSound(sndCard);
 renderBoard();
 setLang(lang);
 triggerStreetImpact();
 log(`→ ${I18N[lang].phase.flop}: ${board.slice(0, 3).map(cardToStr).join(" ")}`);
 recalcOdds();
 isAdvancingPhase = false;
 return;
 }

 if (phase === "flop") {
 board.push(draw(deck));
 phase = "turn";
 playSound(sndCard);
 renderBoard();
 setLang(lang);
 triggerStreetImpact();
 log(`→ ${I18N[lang].phase.turn}: ${cardToStr(board[3])}`);
 recalcOdds();
 isAdvancingPhase = false;
 return;
 }

 if (phase === "turn") {
 const revealRiver = () => {
 if (autoFinishTimer) {
 clearTimeout(autoFinishTimer);
 autoFinishTimer = null;
 }
 board.push(draw(deck));
 phase = "river";
 playSound(sndCard);
 renderBoard();
 setLang(lang);
 triggerStreetImpact();

 const boardCenter = document.querySelector(".board-center");
 if (boardCenter) {
 boardCenter.classList.remove("card-impact");
 void boardCenter.offsetWidth;
 boardCenter.classList.add("card-impact");
 }

 for (const h of hands) {
 h.finalOddsStr = (h.oddsStr || "—") + " | pre " + (h.preflopOddsStr || "—");
 h.resultLabel = "";
 }
 tieBet.finalOddsStr = (tieBet.oddsStr || "—") + " | pre " + (tieBet.preflopOddsStr || "—");
 tieBet.resultLabel = "";

 log(`→ ${I18N[lang].phase.river}: ${cardToStr(board[4])}`);

 const winners = settleWinners();
 const isTie = winners.length >= 2;
 lastWinningTargets = isTie ? [{ targetKind: "tie", targetIndex: -1 }] : winners.map((w) => ({ targetKind: "hand", targetIndex: w }));

 const tieBox = document.getElementById("tieBox");
 if (tieBox) {
 tieBox.classList.remove("tie-win", "tie-lose", "tie-expanded-final");
 tieBox.classList.add(isTie ? "tie-win" : "tie-lose");
 }

 if (handsLayer) {
 handsLayer.querySelectorAll(".hand").forEach((node, i) => {
 if (!winners.includes(i)) {
 node.style.opacity = "0.12";
 node.classList.remove("winner");
 } else {
 node.style.opacity = "";
 node.classList.add("winner");
 }
 });
 }

 const t = I18N[lang];
 let engagedPre = 0, engagedFlop = 0, engagedTurn = 0;

 for (const h of hands) {
 engagedPre += h.bets.pre || 0;
 engagedFlop += h.bets.flop || 0;
 engagedTurn += h.bets.turn || 0;
 }
 engagedPre += tieBet.bets.pre || 0;
 engagedFlop += tieBet.bets.flop || 0;
 engagedTurn += tieBet.bets.turn || 0;

 const engagedTotal = engagedPre + engagedFlop + engagedTurn;
 let paid = 0;

 if (isTie) {
 const handsTxt = winners.map(i => {
 const hc = hands[i].cards;
 return `${cardToStr(hc[0])} ${cardToStr(hc[1])}`;
 }).join(" | ");

 paid = computeTotalFromLots(tieBet.lots);
 if (paid > 0) {
 launchWinCoinBurst(document.getElementById("tieBox"), paid);
 updateBankroll(paid);
 totalWins += paid;
 triggerWinEffects(paid);
 updateTotalWinsDisplay();
 }

 tieBet.resultLabel = makeResultLabel(tieBet.preflopOddsStr);
 maybePayJackpotForWinner("tie", -1, document.getElementById("tieBox"));
 log(`🏆 ${t.winners}: ${handsTxt} (${t.tie})`);
 } else {
 const w = winners[0];
 const hc = hands[w].cards;

 paid = computeTotalFromLots(hands[w].betLots);
 if (paid > 0) {
 const winnerNode = handsLayer ? handsLayer.children[w]?.querySelector(".hand-inner") : null;
 launchWinCoinBurst(winnerNode, paid);
 updateBankroll(paid);
 totalWins += paid;
 triggerWinEffects(paid);
 updateTotalWinsDisplay();
 }

 hands[w].resultLabel = makeResultLabel(hands[w].preflopOddsStr);
 const winnerNode = handsLayer ? handsLayer.children[w]?.querySelector(".hand-inner") : null;
 maybePayJackpotForWinner("hand", w, winnerNode);
 log(`🏆 ${t.winner}: ${cardToStr(hc[0])} ${cardToStr(hc[1])}`);
 }

 log(`— ${t.roundSummary} —`);
 log(`${t.betsEngaged}: ${engagedTotal.toFixed(0)} (pre ${engagedPre.toFixed(0)} / flop ${engagedFlop.toFixed(0)} / turn ${engagedTurn.toFixed(0)})`);
 log(`${t.winningsPaid}: ${paid.toFixed(2)}`);

 roundFinished = true;
 computeTotalBets();
 refreshActionButtons();
 renderHands();
 };

 if (hasCertainWinnerBeforeRiver()) revealRiver();
 else playTensionBeforeRiver(revealRiver);
 return;
 }
}

const COMBOS_7C5 = (() => {
 const idx = [];
 for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) for (let k = j + 1; k < 7; k++) for (let l = k + 1; l < 7; l++) for (let m = l + 1; m < 7; m++) {
 idx.push([i, j, k, l, m]);
 }
 return idx;
})();

// ==================================================
// HAND EVALUATION / SETTLEMENT
// ==================================================

function rank5(cards) {
 const rs = cards.map(c => c.r).sort((a, b) => b - a);
 const ss = cards.map(c => c.s);
 const counts = new Map();
 for (const r of rs) counts.set(r, (counts.get(r) || 0) + 1);
 const uniqueRanks = Array.from(counts.keys()).sort((a, b) => b - a);

 const isFlush = ss.every(s => s === ss[0]);

 const dedup = Array.from(new Set(rs)).sort((a, b) => b - a);
 let isStraight = false;
 let straightHigh = null;
 if (dedup.length >= 5) {
 for (let i = 0; i <= dedup.length - 5; i++) {
 const slice = dedup.slice(i, i + 5);
 if (slice[0] - slice[4] === 4 && slice.every((v, idx) => idx === 0 || slice[idx - 1] - v === 1)) {
 isStraight = true;
 straightHigh = slice[0];
 break;
 }
 }
 if (!isStraight && dedup.includes(14) && dedup.includes(5) && dedup.includes(4) && dedup.includes(3) && dedup.includes(2)) {
 isStraight = true;
 straightHigh = 5;
 }
 }

 const groups = Array.from(counts.entries())
 .map(([r, c]) => ({ r, c }))
 .sort((a, b) => (b.c - a.c) || (b.r - a.r));

 if (isStraight && isFlush) return [8, straightHigh];
 if (groups[0].c === 4) {
 const quad = groups[0].r;
 const kicker = uniqueRanks.filter(r => r !== quad)[0];
 return [7, quad, kicker];
 }
 if (groups[0].c === 3 && groups[1] && groups[1].c === 2) {
 return [6, groups[0].r, groups[1].r];
 }
 if (isFlush) return [5, ...rs];
 if (isStraight) return [4, straightHigh];
 if (groups[0].c === 3) {
 const trips = groups[0].r;
 const kickers = uniqueRanks.filter(r => r !== trips).slice(0, 2);
 return [3, trips, ...kickers];
 }
 if (groups[0].c === 2 && groups[1] && groups[1].c === 2) {
 const p1 = Math.max(groups[0].r, groups[1].r);
 const p2 = Math.min(groups[0].r, groups[1].r);
 const kicker = uniqueRanks.filter(r => r !== p1 && r !== p2)[0];
 return [2, p1, p2, kicker];
 }
 if (groups[0].c === 2) {
 const pair = groups[0].r;
 const kickers = uniqueRanks.filter(r => r !== pair).slice(0, 3);
 return [1, pair, ...kickers];
 }
 return [0, ...rs];
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

function rank7(cards7) {
 let best = null;
 for (const idx of COMBOS_7C5) {
 const five = [cards7[idx[0]], cards7[idx[1]], cards7[idx[2]], cards7[idx[3]], cards7[idx[4]]];
 const r = rank5(five);
 if (!best || cmpRank(r, best) > 0) best = r;
 }
 return best;
}

function settleWinners() {
 const ranks = hands.map(h => rank7([h.cards[0], h.cards[1], board[0], board[1], board[2], board[3], board[4]]));
 let best = ranks[0];
 for (let i = 1; i < ranks.length; i++) {
 if (cmpRank(ranks[i], best) > 0) best = ranks[i];
 }
 const winners = [];
 for (let i = 0; i < ranks.length; i++) {
 if (cmpRank(ranks[i], best) === 0) winners.push(i);
 }
 return winners;
}


