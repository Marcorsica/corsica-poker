// ==================================================
// SERVER API / SYNCHRONISATION
// ==================================================

function serverCardClone(c) {
  return { r: Number(c.r), s: String(c.s) };
}

async function serverStartRound(players) {
  const extremeCaseId = typeof window.consumePendingExtremeCaseId === "function"
    ? window.consumePendingExtremeCaseId()
    : null;
  log("Demande serveur : nouvelle manche", { event: "client.server.start.request", data: { players, extremeCaseId } });
  const query = new URLSearchParams({ players: String(players) });
  if (extremeCaseId) query.set("testCaseId", String(extremeCaseId));
  const res = await fetch(`/start?${query.toString()}`);
  if (!res.ok) {
    log("Erreur serveur au démarrage", { level: "error", event: "client.server.start.error", data: { status: res.status } });
    throw new Error(`start failed: ${res.status}`);
  }
  const data = await res.json();
  log("Réponse serveur : nouvelle manche reçue", { event: "client.server.start.success", data: { gameId: data.gameId, hands: Array.isArray(data.hands) ? data.hands.length : 0 } });
  return data;
}

async function serverNextStreet() {
  log("Demande serveur : street suivante", { event: "client.server.next.request", data: { gameId: serverGameId, phase } });
  const res = await fetch(`/next?gameId=${encodeURIComponent(serverGameId)}`);
  if (!res.ok) {
    log("Erreur serveur sur la street suivante", { level: "error", event: "client.server.next.error", data: { status: res.status, gameId: serverGameId } });
    throw new Error(`next failed: ${res.status}`);
  }
  const data = await res.json();
  log("Réponse serveur : street révélée", { event: "client.server.next.success", data: { gameId: data.gameId, phase: data.phase, boardLength: Array.isArray(data.board) ? data.board.length : 0 } });
  return data;
}

async function serverGetResult() {
  log("Demande serveur : résultat final", { event: "client.server.result.request", data: { gameId: serverGameId } });
  const res = await fetch(`/result?gameId=${encodeURIComponent(serverGameId)}`);
  if (!res.ok) {
    log("Erreur serveur sur le résultat final", { level: "error", event: "client.server.result.error", data: { status: res.status, gameId: serverGameId } });
    throw new Error(`result failed: ${res.status}`);
  }
  const data = await res.json();
  log("Réponse serveur : résultat final reçu", { event: "client.server.result.success", data: { gameId: data.gameId, winnerType: data.winnerType, winners: data.winners } });
  return data;
}

function applyServerHands(serverHands) {
  setHands(serverHands.map((cards) => ({
    cards: cards.map(serverCardClone),
    oddsStr: "—",
    preflopOddsStr: "—",
    finalOddsStr: "—",
    resultLabel: "",
    status: "active",
    bets: { pre: 0, flop: 0, turn: 0 },
    betLots: { pre: [], flop: [], turn: [] },
  })));
}

function applyServerBoard(serverBoard) {
  setBoard((serverBoard || []).map(serverCardClone));
}

async function finalizeRiverFromServerResult() {
  const result = await serverGetResult();
  const winners = Array.isArray(result.winners) ? result.winners : [];
  const isTie = result.winnerType === "tie" || winners.length > 1;

  for (const h of hands) {
    h.finalOddsStr = (h.oddsStr || "—") + " | pre " + (h.preflopOddsStr || "—");
    h.resultLabel = "";
  }
  tieBet.finalOddsStr = (tieBet.oddsStr || "—") + " | pre " + (tieBet.preflopOddsStr || "—");
  tieBet.resultLabel = "";

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
    applyServerJackpotPayouts(settlement.jackpotPayouts || []);
    log(`🏆 ${t.winners}: ${handsTxt} (${t.tie})`);
  } else if (winners.length) {
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
    applyServerJackpotPayouts(settlement.jackpotPayouts || []);
    log(`🏆 ${t.winner}: ${cardToStr(hc[0])} ${cardToStr(hc[1])}`);
  }

  log(`— ${t.roundSummary} —`);
  log(`${t.betsEngaged}: ${engagedTotal.toFixed(0)} (pre ${engagedPre.toFixed(0)} / flop ${engagedFlop.toFixed(0)} / turn ${engagedTurn.toFixed(0)})`);
  log(`${t.winningsPaid}: ${paid.toFixed(2)}`);

  roundFinished = true;
  computeTotalBets();
  refreshActionButtons();
  renderHands();
}

newRound = async function newRoundServerDriven() {
  try {
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
    board = [];
    deck = [];

    const data = await serverStartRound(currentHandsCount);
    setServerGameId(data.gameId);
    applyServerHands(data.hands || []);
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
    log(`— Nouvelle manche (${currentHandsCount}) —`);
    computeTotalBets();
    refreshActionButtons();
    recalcOdds();
  } catch (err) {
    console.error(err);
    log("Erreur serveur au démarrage de la manche");
    roundFinished = true;
    refreshActionButtons();
  }
};

advanceToShowdown = async function advanceToShowdownServerDriven() {
  if (phase === "pre" && getPreflopCommittedBetTotal() > 0) advanceUnlockedForRound = true;
  if (phase === "river" || roundFinished || isCalculating || isAdvancingPhase) return;
  if (!serverGameId) {
    log("Partie serveur introuvable");
    return;
  }

  isAdvancingPhase = true;
  let deferReset = false;

  try {
    if (phase === "pre" || phase === "flop") {
      const data = await serverNextStreet();
      applyServerBoard(data.board || []);
      phase = board.length === 3 ? "flop" : "turn";
      playSound(sndCard);
      renderBoard();
      setLang(lang);
      triggerStreetImpact();
      if (phase === "flop") log(`→ ${I18N[lang].phase.flop}: ${board.slice(0, 3).map(cardToStr).join(" ")}`);
      if (phase === "turn") log(`→ ${I18N[lang].phase.turn}: ${cardToStr(board[3])}`);
      recalcOdds();
      return;
    }

    if (phase === "turn") {
      const revealRiver = async () => {
        if (autoFinishTimer) {
          clearTimeout(autoFinishTimer);
          autoFinishTimer = null;
        }

        const data = await serverNextStreet();
        applyServerBoard(data.board || []);
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

        log(`→ ${I18N[lang].phase.river}: ${cardToStr(board[4])}`);
        await finalizeRiverFromServerResult();
      };

      if (hasCertainWinnerBeforeRiver()) {
        await revealRiver();
      } else {
        deferReset = true;
        playTensionBeforeRiver(() => {
          revealRiver().catch((err) => {
            console.error(err);
            log("Erreur serveur à la river");
          }).finally(() => {
            isAdvancingPhase = false;
          });
        });
        return;
      }
    }
  } catch (err) {
    console.error(err);
    log("Erreur serveur pendant l'avancement de la manche");
  } finally {
    if (!deferReset) {
      isAdvancingPhase = false;
    }
  }
};

autoFinishRoundIfLockedWinner = async function autoFinishRoundIfLockedWinnerServerDriven() {
  if (roundFinished || isCalculating || phase === "river") return;
  if (!hasWinningHandLocked()) return;

  closeAllHandDetails();

  if (btnAdvance) btnAdvance.disabled = true;

  if (phase === "pre" || phase === "flop") {
    await advanceToShowdown();
    return;
  }

  if (phase === "turn") {
    autoFinishTimer = clearTimeoutRef(autoFinishTimer);
    autoFinishTimer = setTimeout(() => {
      autoFinishTimer = null;
      if (!roundFinished && !isAdvancingPhase) {
        advanceToShowdown().catch((err) => {
          console.error(err);
          log("Erreur serveur en fin automatique de manche");
        });
      }
    }, 1000);
  }
};

settleWinners = function settleWinnersServerOverride() {
  console.warn("settleWinners local bypassed: server is authoritative");
  return [];
};
/* === END SERVER AUTHORITY PATCH === */


/* === STEP 4 PATCH : server-side odds + normal payouts === */
async function serverGetOdds() {
  log("Demande serveur : calcul des cotes", { event: "client.server.odds.request", data: { gameId: serverGameId, phase } });
  const res = await fetch(`/odds?gameId=${encodeURIComponent(serverGameId)}`);
  if (!res.ok) {
    log("Erreur serveur sur le calcul des cotes", { level: "error", event: "client.server.odds.error", data: { status: res.status, gameId: serverGameId, phase } });
    throw new Error(`odds failed: ${res.status}`);
  }
  const data = await res.json();
  log("Réponse serveur : cotes reçues", { event: "client.server.odds.success", data: { gameId: serverGameId, phase: data.phase, totalBoards: data.totalBoards } });
  return data;
}

async function serverSettleRound() {
  const payload = {
    gameId: serverGameId,
    handBets: hands.map((h) => ({
      pre: Number(h?.bets?.pre || 0),
      flop: Number(h?.bets?.flop || 0),
      turn: Number(h?.bets?.turn || 0)
    })),
    tieBets: {
      pre: Number(tieBet?.bets?.pre || 0),
      flop: Number(tieBet?.bets?.flop || 0),
      turn: Number(tieBet?.bets?.turn || 0)
    }
  };

  log("Demande serveur : règlement de manche", { event: "client.server.settle.request", data: { gameId: serverGameId } });
  const res = await fetch(`/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    log("Erreur serveur sur le règlement", { level: "error", event: "client.server.settle.error", data: { status: res.status, gameId: serverGameId } });
    throw new Error(`settle failed: ${res.status}`);
  }
  const data = await res.json();
  log("Réponse serveur : règlement reçu", { event: "client.server.settle.success", data: { gameId: data.gameId, winnerType: data.winnerType, normalPaid: data.normalPaid, jackpotPayouts: data.jackpotPayouts || [] } });
  return data;
}

recalcOdds = async function recalcOddsServerDriven() {
  if (phase === "river") return;

  setCalcStatus(true);
  for (const h of hands) h.oddsStr = "—";
  tieBet.oddsStr = "—";
  renderHands();

  const t0 = performance.now();
  try {
    const res = await serverGetOdds();
    const dt = Math.round(performance.now() - t0);
    if (calcMs) {
      const boardsLabel = res.totalBoards ? ` • ${Number(res.totalBoards).toLocaleString()} boards exacts` : "";
      const methodLabel = res.exact ? " • exact" : "";
      calcMs.textContent = `${dt} ms${boardsLabel}${methodLabel}`;
    }

    const oddsSnapshot = buildOddsSnapshotFromServerResponse(res, phase);
    applyOddsSnapshot(oddsSnapshot);
    evaluateJackpotSnapshot(oddsSnapshot);

    renderHands();

    if (hasWinningHandLocked()) {
      autoFinishTimer = clearTimeoutRef(autoFinishTimer);
      const autoFinishDelayMs = (phase === "flop" || phase === "turn") ? 1000 : 2000;
      autoFinishTimer = setTimeout(() => {
        autoFinishTimer = null;
        autoFinishRoundIfLockedWinner();
      }, autoFinishDelayMs);
    }
  } catch (err) {
    console.error(err);
    log("Erreur serveur pendant le calcul des cotes");
  } finally {
    setCalcStatus(false);
  }
};

finalizeRiverFromServerResult = async function finalizeRiverFromServerResultServerSettlement() {
  const settlement = await serverSettleRound();
  const winners = Array.isArray(settlement.winners) ? settlement.winners : [];
  const isTie = settlement.winnerType === "tie" || winners.length > 1;

  for (const h of hands) {
    h.finalOddsStr = (h.oddsStr || "—") + " | pre " + (h.preflopOddsStr || "—");
    h.resultLabel = "";
  }
  tieBet.finalOddsStr = (tieBet.oddsStr || "—") + " | pre " + (tieBet.preflopOddsStr || "—");
  tieBet.resultLabel = "";

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
  const paid = Number(settlement.normalPaid || 0);

  if (isTie) {
    const handsTxt = winners.map(i => {
      const hc = hands[i].cards;
      return `${cardToStr(hc[0])} ${cardToStr(hc[1])}`;
    }).join(" | ");

    if (paid > 0) {
      launchWinCoinBurst(document.getElementById("tieBox"), paid);
      updateBankroll(paid);
      totalWins += paid;
      triggerWinEffects(paid);
      updateTotalWinsDisplay();
    }

    tieBet.resultLabel = makeResultLabel(tieBet.preflopOddsStr);
    applyServerJackpotPayouts(settlement.jackpotPayouts || []);
    log(`🏆 ${t.winners}: ${handsTxt} (${t.tie})`);
  } else if (winners.length) {
    const w = winners[0];
    const hc = hands[w].cards;

    if (paid > 0) {
      const winnerNode = handsLayer ? handsLayer.children[w]?.querySelector(".hand-inner") : null;
      launchWinCoinBurst(winnerNode, paid);
      updateBankroll(paid);
      totalWins += paid;
      triggerWinEffects(paid);
      updateTotalWinsDisplay();
    }

    hands[w].resultLabel = makeResultLabel(hands[w].preflopOddsStr);
    applyServerJackpotPayouts(settlement.jackpotPayouts || []);
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
/* === END STEP 4 PATCH === */

window.addEventListener("load", syncJackpotDisplayFromServer);
