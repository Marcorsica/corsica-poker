// ==================================================
// TABLE LAYOUT / RENDERING
// ==================================================

function getHandPositions(count) {
 const total = Math.max(CONFIG.minHands, Math.min(CONFIG.maxHands, count || CONFIG.maxHands));
 const startAngle = -Math.PI / 2;
 const step = (Math.PI * 2) / total;

 // Symmetric oval around the board with identical angular spacing, whatever the hand count.
 const radiusX = ({ 4: 33, 5: 34, 6: 34, 7: 35, 8: 35, 9: 36, 10: 36 }[total] || 35);
 const radiusY = ({ 4: 34, 5: 35, 6: 35, 7: 36, 8: 36, 9: 37, 10: 37 }[total] || 36);
 const centerX = 50;
 const centerY = 50;

 return Array.from({ length: total }, (_, i) => {
  const angle = startAngle + (step * i);
  return {
   x: centerX + (Math.cos(angle) * radiusX),
   y: centerY + (Math.sin(angle) * radiusY)
  };
 });
}

let handLayoutRaf = 0;

function getHandScale(count, layerRect) {
 let scale = ({ 4: 1.11, 5: 1.10, 6: 1.08, 7: 1.05, 8: 1.00, 9: 0.97, 10: 0.94 }[count] || 0.94);

 if (layerRect.width < 1300) scale -= 0.02;
 if (layerRect.width < 1120) scale -= 0.03;
 if (layerRect.width < 980) scale -= 0.04;
 if (layerRect.height < 760) scale -= 0.02;

 return Math.max(0.87, Math.min(1.12, scale));
}

function getRelativeObstacleRect(node, layerRect, padX = 0, padY = 0, extraLeft = 0, extraRight = 0) {
 if (!node) return null;
 const rect = node.getBoundingClientRect();
 return {
 left: rect.left - layerRect.left - padX - extraLeft,
 right: rect.right - layerRect.left + padX + extraRight,
 top: rect.top - layerRect.top - padY,
 bottom: rect.bottom - layerRect.top + padY
 };
}

function clampHandPoint(point, hw, hh, width, height) {
 point.x = Math.max(hw + 12, Math.min(width - hw - 12, point.x));
 point.y = Math.max(hh + 12, Math.min(height - hh - 12, point.y));
}

function resolveHandsLayout() {
 if (!handsLayer || !hands.length) return;

 const nodes = Array.from(handsLayer.querySelectorAll(".hand"));
 if (!nodes.length) return;

 const layerRect = handsLayer.getBoundingClientRect();
 if (!layerRect.width || !layerRect.height) return;

 const boardNode = document.querySelector(".board-center");
 const boardRect = boardNode ? boardNode.getBoundingClientRect() : null;
 const anchors = getHandPositions(nodes.length);
 const scale = getHandScale(nodes.length, layerRect);

 const firstRect = nodes[0].getBoundingClientRect();
 const baseWidth = firstRect.width || 236;
 const baseHeight = firstRect.height || 146;

 const handWidth = baseWidth * scale;
 const handHeight = baseHeight * scale;
 const hw = (handWidth / 2) + 8;
 const hh = (handHeight / 2) + 8;

 const centerX = layerRect.width / 2;
 const centerY = layerRect.height / 2;
 const boardWidth = boardRect ? boardRect.width : Math.min(420, layerRect.width * 0.38);
 const boardHeight = boardRect ? boardRect.height : Math.min(180, layerRect.height * 0.24);

 const radialGapX = Math.max(70, handWidth * 0.58);
 const radialGapY = Math.max(54, handHeight * 0.62);

 const minRadiusX = (boardWidth / 2) + radialGapX;
 const minRadiusY = (boardHeight / 2) + radialGapY;
 const maxRadiusX = (layerRect.width / 2) - hw - 18;
 const maxRadiusY = (layerRect.height / 2) - hh - 18;

 const preferredRadiusX = layerRect.width * ({ 4: 0.31, 5: 0.32, 6: 0.33, 7: 0.34, 8: 0.35, 9: 0.36, 10: 0.365 }[nodes.length] || 0.35);
 const preferredRadiusY = layerRect.height * ({ 4: 0.30, 5: 0.31, 6: 0.32, 7: 0.325, 8: 0.33, 9: 0.335, 10: 0.34 }[nodes.length] || 0.33);

 const radiusX = Math.max(minRadiusX, Math.min(maxRadiusX, preferredRadiusX));
 const radiusY = Math.max(minRadiusY, Math.min(maxRadiusY, preferredRadiusY));

 anchors.forEach((anchor, index) => {
  const node = nodes[index];
  if (!node) return;

  const angle = Math.atan2(anchor.y - 50, anchor.x - 50);
  const point = {
   x: centerX + (Math.cos(angle) * radiusX),
   y: centerY + (Math.sin(angle) * radiusY)
  };

  clampHandPoint(point, hw, hh, layerRect.width, layerRect.height);

  node.style.left = `${point.x}px`;
  node.style.top = `${point.y}px`;
  node.style.transform = `translate(-50%,-50%) scale(${scale})`;
  node.style.transformOrigin = "center center";
 });

 updateJackpotDisplays();
}

function scheduleHandsLayout() {
 if (handLayoutRaf) cancelAnimationFrame(handLayoutRaf);
 handLayoutRaf = requestAnimationFrame(() => {
 handLayoutRaf = 0;
 resolveHandsLayout();
 });
}



function setOddsDisplay(node, mainText, noteText = "") {
 if (!node) return;
 const safeMain = mainText || "—";
 const safeNote = noteText || "";
 node.innerHTML = safeNote
 ? `<div class="odds-main">${safeMain}</div><div class="odds-note">(${safeNote})</div>`
 : `<div class="odds-main">${safeMain}</div>`;
}

function makeResultLabel(preflopStr) {
 if (!preflopStr || preflopStr === "—") return "";
 return `${lang === "fr" ? "préflop" : "preflop"} : ${preflopStr}`;
}



function premiumBoardImpact() {
 try {
  const node = document.querySelector(".board-center");
  if (!node) return;
  node.classList.remove("cinematic-flash");
  void node.offsetWidth;
  node.classList.add("cinematic-flash");
 } catch (_) {}
}

function flashBoardCenter() {
 try{
 const bc = document.querySelector(".board-center");
 if (bc) {
 bc.classList.remove("card-impact","cinematic-flash");
 void bc.offsetWidth;
 bc.classList.add("card-impact","cinematic-flash");
 }
 } catch(e) {}
 const boardCenter = document.querySelector(".board-center");
 if (boardCenter) {
 boardCenter.classList.remove("card-impact");
 void boardCenter.offsetWidth;
 boardCenter.classList.add("card-impact");
 }
 const boardNode = document.querySelector(".board-center");
 if (!boardNode) return;
 boardNode.classList.remove("board-flash");
 void boardNode.offsetWidth;
 boardNode.classList.add("board-flash");
}

function showRoundSetup() {
 advanceUnlockedForRound = false;
 if (roundSetupOverlay) roundSetupOverlay.classList.remove("hidden");
 updateValidationButtonContext();
}

function hideRoundSetup() {
 if (roundSetupOverlay) roundSetupOverlay.classList.add("hidden");
 updateValidationButtonContext();
}


function playTableTransition(callback){
  const t = document.getElementById("tableTransition");
  if (!t) {
    if (typeof callback === "function") callback();
    return;
  }

  t.classList.add("active");

  setTimeout(() => {
    if (typeof callback === "function") callback();
    t.classList.remove("active");
  }, 400);
}

function launchNewRoundWithCount(count) {
 currentHandsCount = Math.max(CONFIG.minHands, Math.min(CONFIG.maxHands, count));
 hideRoundSetup();
 playTableTransition(() => {
  newRound();
 });
}

function setLang(newLang) {
 lang = newLang;
 document.documentElement.lang = lang;

 if (btnFR) btnFR.classList.toggle("active", lang === "fr");
 if (btnEN) btnEN.classList.toggle("active", lang === "en");
 const settingsLangFR = el("settingsLangFR");
 const settingsLangEN = el("settingsLangEN");
 if (settingsLangFR) settingsLangFR.classList.toggle("active", lang === "fr");
 if (settingsLangEN) settingsLangEN.classList.toggle("active", lang === "en");

 const t = I18N[lang];

 if (simsCount) simsCount.textContent = String(simsForPhase());
 if (subtitle) subtitle.textContent = t.subtitle;
 if (lblSims) lblSims.textContent = t.sims;
 if (lblMargin) lblMargin.textContent = t.margin;
 if (lblCalc) lblCalc.textContent = t.calc;
 if (lblBankroll) lblBankroll.textContent = t.bankroll;
 if (lblTotalBets) lblTotalBets.textContent = t.totalBets;
 if (lblTotalWins) lblTotalWins.textContent = t.totalWins;
 if (el("lblBronzeJackpot")) el("lblBronzeJackpot").textContent = t.bronzeJackpot;
 if (el("lblArgentJackpot")) el("lblArgentJackpot").textContent = t.argentJackpot;
 if (el("lblOrJackpot")) el("lblOrJackpot").textContent = t.orJackpot;
 if (el("lblDiamantJackpot")) el("lblDiamantJackpot").textContent = t.diamantJackpot;

 if (boardTitle) boardTitle.textContent = t.board + " – " + t.phase[phase];
 if (btnSameTable) btnSameTable.textContent = t.sameTable;
 if (btnChangeTable) btnChangeTable.textContent = t.changeTable;
 if (btnAdvance) {
  btnAdvance.innerHTML = `<span class="advance-check">✓</span><span>${t.validateBets}</span>`;
  btnAdvance.setAttribute("aria-label", t.validateBets);
  btnAdvance.title = t.clearBetsTitle;
}
 if (btnAbandon) btnAbandon.textContent = t.abandon;

 if (betTitle) betTitle.textContent = t.betTitle;
 if (logTitle) logTitle.textContent = t.logTitle;
 if (el("toggleLogBtn")) el("toggleLogBtn").textContent = t.logTitle;
 if (el("settingsBtn")) el("settingsBtn").setAttribute("aria-label", t.settingsTitle);
 if (el("settingsPanel")) el("settingsPanel").setAttribute("aria-label", t.settingsTitle);

 if (betPanelTitle) betPanelTitle.textContent = t.betPanel;
 if (tiePanelTitle) tiePanelTitle.textContent = t.tiePanel;
 if (actPanelTitle) actPanelTitle.textContent = "";


 if (el("settingsTitle")) el("settingsTitle").textContent = t.settingsTitle;
 if (el("rulesGameBtn")) el("rulesGameBtn").textContent = t.rulesButton;
 if (el("settingsLanguageLabel")) el("settingsLanguageLabel").textContent = t.settingsLanguage;
 if (el("settingsSoundLabel")) el("settingsSoundLabel").textContent = t.settingsSound;
 if (el("settingsFeltLabel")) el("settingsFeltLabel").textContent = t.settingsFelt;
 if (el("settingsStyleLabel")) el("settingsStyleLabel").textContent = t.settingsStyle;
 if (el("gameStyleClassicBtn")) el("gameStyleClassicBtn").textContent = t.styleClassic;
 if (el("gameStyleMetalBtn")) el("gameStyleMetalBtn").textContent = t.styleMetal;
 if (el("gameStylePremiumBtn")) el("gameStylePremiumBtn").textContent = t.stylePremium;
 const audioLabels = [t.settingsAudio1, t.settingsAudio2, t.settingsAudio3, t.settingsAudio4, t.settingsAudio5, t.settingsAudio6];
 document.querySelectorAll('.settings-audio-btn').forEach((btn, index) => {
  if (audioLabels[index]) btn.textContent = audioLabels[index];
 });
 if (el("rulesTitle")) el("rulesTitle").textContent = t.rulesTitle;
 if (el("rulesCloseBtn")) el("rulesCloseBtn").setAttribute("aria-label", t.rulesClose);
 if (el("rulesSlogan")) el("rulesSlogan").textContent = t.rulesSlogan;
 if (el("rulesBody")) el("rulesBody").innerHTML = RULES_HTML[lang] || RULES_HTML.fr;

 if (roundSetupTitle) roundSetupTitle.textContent = t.roundSetupTitle;
 if (roundSetupSubtitle) roundSetupSubtitle.textContent = t.roundSetupSubtitle;
 if (btnRandomHands) btnRandomHands.textContent = t.randomHands;
 if (btnManualHands) btnManualHands.textContent = t.manualHands;
 if (handsCountLabel) handsCountLabel.textContent = t.handsCountLabel;

 setCalcStatus(isCalculating);
 renderHands();
 renderBoard();
 // Do not relayout hands here: phase changes (flop/turn/river) must not move seat blocks.
 computeTotalBets();
 updateTotalWinsDisplay();
 updateJackpotDisplays();
 refreshActionButtons();
}

function makeEraser(onClick) {
 const b = document.createElement("button");
 b.type = "button";
 b.className = "eraser";
 b.title = "Supprimer les mises";
 b.addEventListener("click", (e) => {
 e.stopPropagation();
 onClick();
 });
 return b;
}

function updateHandDetailsPlacement(wrap) {
 if (!wrap || !handsLayer) return;
 const layerRect = handsLayer.getBoundingClientRect();
 const wrapRect = wrap.getBoundingClientRect();
 if (!layerRect || !wrapRect || !layerRect.width || !layerRect.height) return;

 const centerX = (wrapRect.left - layerRect.left) + (wrapRect.width / 2);
 const centerY = (wrapRect.top - layerRect.top) + (wrapRect.height / 2);
 const xRatio = centerX / layerRect.width;
 const yRatio = centerY / layerRect.height;

 wrap.classList.toggle("hand-edge-left", xRatio < 0.24);
 wrap.classList.toggle("hand-edge-right", xRatio > 0.76);
 wrap.classList.toggle("hand-bottom", yRatio > 0.52);
 wrap.classList.toggle("hand-top", yRatio <= 0.52);
}

function closeOtherHandDetails(activeWrap) {
 if (!handsLayer) return;
 Array.from(handsLayer.children).forEach((node) => {
 if (node === activeWrap) return;
 if (node._closeDetailsTimer) {
 clearTimeout(node._closeDetailsTimer);
 node._closeDetailsTimer = null;
 }
 node.classList.remove("details-open");
 });
}


// Suivi souris robuste pour éviter les fermetures fantômes quand le panneau
// chevauche visuellement une autre zone de cartes.
window.__corsicaPointer = window.__corsicaPointer || { x: -9999, y: -9999 };
if (!window.__corsicaPointerTrackingInstalled) {
  window.__corsicaPointerTrackingInstalled = true;
  document.addEventListener("pointermove", (event) => {
    window.__corsicaPointer.x = event.clientX;
    window.__corsicaPointer.y = event.clientY;
  }, true);
  document.addEventListener("mousemove", (event) => {
    window.__corsicaPointer.x = event.clientX;
    window.__corsicaPointer.y = event.clientY;
  }, true);
  document.addEventListener("pointerdown", (event) => {
    window.__corsicaPointer.x = event.clientX;
    window.__corsicaPointer.y = event.clientY;
  }, true);
}

function isPointerInsideElement(el, tolerance = 8) {
  if (!el || !window.__corsicaPointer) return false;
  const rect = el.getBoundingClientRect();
  const x = window.__corsicaPointer.x;
  const y = window.__corsicaPointer.y;
  return x >= rect.left - tolerance && x <= rect.right + tolerance &&
         y >= rect.top - tolerance && y <= rect.bottom + tolerance;
}

function openHandDetails(wrap) {
 if (!wrap) return;
 if (typeof hasWinningHandLocked === "function" && hasWinningHandLocked()) return;
 closeOtherHandDetails(wrap);
 updateHandDetailsPlacement(wrap);
 if (wrap._closeDetailsTimer) {
 clearTimeout(wrap._closeDetailsTimer);
 wrap._closeDetailsTimer = null;
 }
 wrap.classList.add("details-open");
}

function getElementUnderPointer() {
  if (!window.__corsicaPointer || window.__corsicaPointer.x < -1000) return null;
  return document.elementFromPoint(window.__corsicaPointer.x, window.__corsicaPointer.y);
}

function isPointerInsideHandInteractiveArea(wrap) {
  if (!wrap) return false;
  const under = getElementUnderPointer();
  if (under && under.closest) {
    const activeArea = under.closest(".hand-main, .hand-details");
    if (activeArea && wrap.contains(activeArea)) return true;
  }
  const trigger = wrap.querySelector(".hand-main");
  const details = wrap.querySelector(".hand-details");
  return !!(
    (trigger && isPointerInsideElement(trigger, 14)) ||
    (details && wrap.classList.contains("details-open") && isPointerInsideElement(details, 18))
  );
}

function closeHandDetailsSoon(wrap, delay = 320) {
 if (!wrap) return;
 if (wrap._closeDetailsTimer) clearTimeout(wrap._closeDetailsTimer);
 wrap._closeDetailsTimer = setTimeout(() => {
 if (isPointerInsideHandInteractiveArea(wrap)) {
   wrap._closeDetailsTimer = null;
   return;
 }
 wrap.classList.remove("details-open");
 wrap._closeDetailsTimer = null;
 }, delay);
}

function pinHandDetailsBriefly(wrap, delay = 260) {
 if (!wrap) return;
 openHandDetails(wrap);
 closeHandDetailsSoon(wrap, delay);
}

function buildHandsUI() {
 if (!handsLayer) return;
 handsLayer.innerHTML = "";

 const positions = getHandPositions(hands.length);

 for (let i = 0; i < hands.length; i++) {
 const wrap = document.createElement("div");
 wrap.className = "hand";
 wrap.dataset.anchorX = String(positions[i].x);
 wrap.dataset.anchorY = String(positions[i].y);
 wrap.style.left = positions[i].x + "%";
 wrap.style.top = positions[i].y + "%";

 const inner = document.createElement("div");
 inner.className = "hand-inner hand-main";

 const odds = document.createElement("div");
 odds.className = "hand-odds";
 odds.dataset.handOdds = String(i);

 const cards = document.createElement("div");
 cards.className = "hand-cards";

 const betDot = document.createElement("div");
 betDot.className = "hand-bet-dot";
 betDot.dataset.handBetDot = String(i);

 const c1 = document.createElement("div");
 c1.className = "card";
 c1.style.backgroundImage = `url("${cardImage(hands[i].cards[0])}")`;

 const c2 = document.createElement("div");
 c2.className = "card";
 c2.style.backgroundImage = `url("${cardImage(hands[i].cards[1])}")`;

 cards.appendChild(c1);
 cards.appendChild(c2);

 const details = document.createElement("div");
 details.className = "hand-details";

 const detailsPanel = document.createElement("div");
 detailsPanel.className = "hand-details-panel";

 const sub = document.createElement("div");
 sub.className = "hand-sub";
 sub.dataset.handSub = String(i);

 const sqs = document.createElement("div");
 sqs.className = "squares";

 for (const ph of ["pre", "flop", "turn"]) {
 const col = document.createElement("div");
 col.className = "phase-col";

 const sq = document.createElement("div");
 sq.className = "sq";
 sq.dataset.phase = ph;
 sq.dataset.hand = String(i);
 sq.addEventListener("click", () => {
 openHandDetails(wrap);
 onHandClick(i, ph);
 });

 const betText = document.createElement("div");
 betText.className = "bet-in-square";
 betText.dataset.betSquare = `${i}:${ph}`;
 sq.appendChild(betText);

 sq.appendChild(makeEraser(() => undoHandBet(i, ph)));

 const pot = document.createElement("div");
 pot.className = "pot";
 pot.dataset.pot = `${i}:${ph}`;

 col.appendChild(sq);
 col.appendChild(pot);
 sqs.appendChild(col);
 }

 detailsPanel.appendChild(sub);
 detailsPanel.appendChild(sqs);
 details.appendChild(detailsPanel);

 inner.appendChild(odds);
 inner.appendChild(cards);
 inner.appendChild(betDot);

 const handlePlayerSquareEnter = (event) => {
 // Seul le carré visible cartes/cote peut OUVRIR le panneau.
 if (event && event.pointerType === "touch") return;
 openHandDetails(wrap);
 };

 const handlePlayerSquareLeave = (event) => {
 const next = event && event.relatedTarget;
 if (next && details.contains(next)) return;
 closeHandDetailsSoon(wrap);
 };

 const handleBetPanelEnter = () => {
 // Le panneau peut seulement MAINTENIR l'ouverture. Il ne doit jamais
 // s'ouvrir tout seul quand la souris passe sur sa future position.
 if (!wrap.classList.contains("details-open")) return;
 if (wrap._closeDetailsTimer) {
 clearTimeout(wrap._closeDetailsTimer);
 wrap._closeDetailsTimer = null;
 }
 };

 const handleBetPanelLeave = (event) => {
 const next = event && event.relatedTarget;
 if (next && inner.contains(next)) return;
 closeHandDetailsSoon(wrap);
 };

 // Open only when entering the visible player square (odds + cards).
 inner.addEventListener("mouseenter", handlePlayerSquareEnter);
 inner.addEventListener("pointerenter", handlePlayerSquareEnter);
 inner.addEventListener("mouseleave", handlePlayerSquareLeave);
 inner.addEventListener("pointerleave", handlePlayerSquareLeave);

 // Keep open while using the betting panel, without making the invisible/future
 // panel area a trigger zone.
 details.addEventListener("mouseenter", handleBetPanelEnter);
 details.addEventListener("pointerenter", handleBetPanelEnter);
 details.addEventListener("mouseleave", handleBetPanelLeave);
 details.addEventListener("pointerleave", handleBetPanelLeave);

 detailsPanel.addEventListener("pointerdown", (event) => {
 if (!wrap.classList.contains("details-open")) return;
 if (wrap._closeDetailsTimer) {
 clearTimeout(wrap._closeDetailsTimer);
 wrap._closeDetailsTimer = null;
 }
 event.stopPropagation();
 });
 detailsPanel.addEventListener("click", (event) => {
 event.stopPropagation();
 });
 detailsPanel.addEventListener("contextmenu", (event) => {
 event.preventDefault();
 event.stopPropagation();
 return false;
 });

 wrap.appendChild(inner);
 wrap.appendChild(details);
 handsLayer.appendChild(wrap);
 }

 const tieSquares = document.querySelectorAll("[data-tie-phase]");
 tieSquares.forEach((sq) => {
 const cleanSq = sq.cloneNode(false);
 sq.replaceWith(cleanSq);

 const betText = document.createElement("div");
 betText.className = "bet-in-square";
 betText.dataset.tieBetSquare = cleanSq.dataset.tiePhase;
 cleanSq.appendChild(betText);

 cleanSq.addEventListener("click", () => onTieClick(cleanSq.dataset.tiePhase));
 cleanSq.appendChild(makeEraser(() => undoTieBet(cleanSq.dataset.tiePhase)));
 });

 renderHands();
 scheduleHandsLayout();
}

function renderBoard() {
 if (!boardCards) return;
 boardCards.innerHTML = "";
 for (let i = 0; i < 5; i++) {
 const d = document.createElement("div");
 d.className = "card";
 if (board[i]) d.style.backgroundImage = `url("${cardImage(board[i])}")`;
 else d.style.backgroundImage = `url("${CARD_BACK_URL}")`;
 boardCards.appendChild(d);
 }
 if (boardTitle) boardTitle.textContent = I18N[lang].board + " – " + I18N[lang].phase[phase];
}


function highlightLowestDisplayedOdds() {
 const oddsNodes = [];
 let hasLowOddsHand = false;

 hands.forEach((h, i) => {
 const wrap = handsLayer?.children?.[i];
 const oddsNode = wrap?.querySelector(`[data-hand-odds="${i}"]`);
 if (!oddsNode) return;

 oddsNode.classList.remove("lowest-odds");

 if (h && isLowOddsDisplay(h.oddsStr)) {
 hasLowOddsHand = true;
 }

 const value = parseOddsNumber(phase === "river" ? (h.oddsStr || "—") : (h.oddsStr || "—"));
 if (value && !oddsNode.classList.contains("jackpot-call")) {
 oddsNodes.push({ node: oddsNode, value });
 }
 });

 if (tieOddsEl) {
 tieOddsEl.classList.remove("lowest-odds");
 const tieValue = parseOddsNumber(phase === "river" ? (tieBet.oddsStr || "—") : (tieBet.oddsStr || "—"));
 if (tieValue && !tieOddsEl.classList.contains("jackpot-call")) {
 oddsNodes.push({ node: tieOddsEl, value: tieValue });
 }
 }

 if (hasLowOddsHand) return;
 if (!oddsNodes.length) return;

 let lowest = oddsNodes[0];
 for (const item of oddsNodes) {
 if (item.value < lowest.value) lowest = item;
 }

 lowest.node.classList.add("lowest-odds");
}

function renderHands() {
 if (!handsLayer) return;

 hands.forEach((h, i) => {
 const wrap = handsLayer.children[i];
 if (!wrap) return;

 wrap.classList.toggle("hand-elim", h.status === "elim");
 wrap.classList.toggle("hand-splitOnly", h.status === "splitOnly");

 // Detect top/bottom from actual on-screen position, not raw style.top, because layout uses pixel values.
 const layerRect = handsLayer ? handsLayer.getBoundingClientRect() : null;
 const wrapRect = wrap.getBoundingClientRect();
 const wrapCenterY = layerRect
 ? ((wrapRect.top - layerRect.top) + (wrapRect.height / 2))
 : (parseFloat(wrap.style.top) || 0);
 const isBottomHand = layerRect
 ? (wrapCenterY > (layerRect.height / 2))
 : ((parseFloat(wrap.style.top) || 0) > 50);

 wrap.classList.toggle("hand-bottom", isBottomHand);
 wrap.classList.toggle("hand-top", !isBottomHand);
 updateHandDetailsPlacement(wrap);

 const odds = wrap.querySelector(`[data-hand-odds="${i}"]`);
 const sub = wrap.querySelector(`[data-hand-sub="${i}"]`);

 if (odds) {
 const displayOdds = (phase === "river" ? (h.oddsStr || "—") : (h.oddsStr || "—"));
 const currentJackpotType = phase !== "river" ? jackpotTypeForOddsValue(getTargetOddsValue("hand", i)) : null;
 const jackpotOfferSuppressed = !!currentJackpotType && shouldSuppressJackpotOfferAtPhase(currentJackpotType, "hand", i, phase);
 const jackpotLabel = phase !== "river" && h.status === "active" && !jackpotOfferSuppressed ? jackpotLabelForTarget("hand", i) : null;

 odds.onclick = null;
 odds.classList.remove("jackpot-call", "jackpot-locked");
 odds.classList.toggle("low", false);

 const jackpotLockedByBet = !!currentJackpotType && isJackpotTypeLockedForTarget(currentJackpotType, "hand", i);
 const visibleJackpotLabel = jackpotLabel || (jackpotLockedByBet && h.status === "active" ? jackpotPromptForType(currentJackpotType) : null);

 if (visibleJackpotLabel) {
 odds.textContent = visibleJackpotLabel;
 odds.classList.add("jackpot-call");
 const type = currentJackpotType;
 const jackpotLocked = !!type && isJackpotTypeLockedForTarget(type, "hand", i);
 odds.classList.toggle("jackpot-locked", jackpotLocked);
 odds.onclick = jackpotLocked ? null : () => {
 const type = jackpotTypeForOddsValue(getTargetOddsValue("hand", i));
 if (type) placeJackpotBet(type, "hand", i);
 };
 } else {
 const finalMain = h.status === "splitOnly" && phase !== "river" ? "—" : displayOdds;
 if (phase === "river" && h.resultLabel) {
 setOddsDisplay(odds, finalMain, h.resultLabel);
 } else {
 setOddsDisplay(odds, finalMain, "");
 odds.classList.toggle("low", isLowOddsDisplay(finalMain));
 }
 }
 }

 if (sub) {
 if (phase === "river") {
 sub.textContent = h.resultLabel || "";
 } else {
 if (h.status === "splitOnly") sub.textContent = I18N[lang].split;
 else if (h.status === "elim") sub.textContent = I18N[lang].eliminated;
 else sub.textContent = "";
 }
 }

 const betDot = wrap.querySelector(`[data-hand-bet-dot="${i}"]`);
 if (betDot) {
 const hasAnyBet = ((h.bets.pre || 0) + (h.bets.flop || 0) + (h.bets.turn || 0)) > 0 || hasAnyJackpotBetOnTarget("hand", i);
 betDot.classList.toggle("visible", hasAnyBet);
 }

 ["pre", "flop", "turn"].forEach((ph) => {
 const sq = wrap.querySelector(`.sq[data-phase="${ph}"][data-hand="${i}"]`);
 const pot = wrap.querySelector(`.pot[data-pot="${i}:${ph}"]`);
 const betSquare = wrap.querySelector(`[data-bet-square="${i}:${ph}"]`);
 if (!sq || !pot) return;

 const jackpotType = jackpotTypeForOddsValue(getTargetOddsValue("hand", i));
 const jackpotOfferSuppressed = jackpotType && shouldSuppressJackpotOfferAtPhase(jackpotType, "hand", i, ph);
 const jackpotEligibleCurrentPhase = jackpotType && ph === phase && phase !== "river" && !jackpotOfferSuppressed;
 const bettableHand = h.status === "active" && !isLowOddsDisplay(h.oddsStr);
 const active = phase === ph && phase !== "river" && (bettableHand || jackpotEligibleCurrentPhase);
 const jackpotBetTypeOnSquare = getJackpotBetTypeOnTargetPhase("hand", i, ph);
 sq.classList.toggle("active", active);
 sq.classList.toggle("disabled", phase === "river" || !["pre", "flop", "turn"].includes(phase) || !active);
 sq.classList.toggle("hasBet", (h.bets[ph] || 0) > 0 || !!jackpotBetTypeOnSquare);
 sq.classList.toggle("has-jackpot-bet", !!jackpotBetTypeOnSquare);

 const eraserBtn = sq.querySelector(".eraser");
 if (eraserBtn) {
  eraserBtn.onclick = (e) => {
   e.stopPropagation();
   if (jackpotBetTypeOnSquare) undoJackpotBet(jackpotBetTypeOnSquare, "hand", i, ph);
   else undoHandBet(i, ph);
  };
 }

 if (betSquare) {
 const lostJackpotText = getLostJackpotText("hand", i, ph);
 const squareText = phase === "river"
 ? (lostJackpotText || jackpotSquareText("hand", i, ph))
 : (jackpotEligibleCurrentPhase ? jackpotSquareText("hand", i, ph) || "1" : jackpotSquareText("hand", i, ph));
 betSquare.textContent = squareText;
 betSquare.classList.toggle("jackpot-lost", !!lostJackpotText);
 }

 const jackpotBetPlacedHere = hasAnyJackpotBetOnTarget("hand", i, ph);
 pot.classList.remove("jackpot-bronze", "jackpot-argent", "jackpot-or", "jackpot-diamant");

 if (jackpotBetPlacedHere) {
  const placedType = JACKPOT_TYPES.find((type) => hasJackpotBet(type, "hand", i, ph));
  pot.textContent = jackpotPotLabel(placedType);
  if (placedType) pot.classList.add(`jackpot-${placedType}`);
 } else {
  pot.textContent = jackpotEligibleCurrentPhase ? jackpotPotLabel(jackpotType) : (phasePotentialForHand(h, ph) > 0 ? phasePotentialForHand(h, ph).toFixed(2) : "");
 }
 });
 });

 
 const tieBetDot = document.getElementById("tieBetDot");
 if (tieBetDot) {
 const hasTieBet =
 (tieBet.bets.pre || 0) +
 (tieBet.bets.flop || 0) +
 (tieBet.bets.turn || 0) > 0 || hasAnyJackpotBetOnTarget("tie", -1);

 tieBetDot.classList.toggle("visible", hasTieBet);
 }

if (tieOddsEl) {
 const displayOdds = phase === "river" ? (tieBet.oddsStr || "—") : (tieBet.oddsStr || "—");
 const currentTieJackpotType = phase !== "river" ? jackpotTypeForOddsValue(getTargetOddsValue("tie", -1)) : null;
 const tieJackpotOfferSuppressed = !!currentTieJackpotType && shouldSuppressJackpotOfferAtPhase(currentTieJackpotType, "tie", -1, phase);
 const jackpotLabel = phase !== "river" && !tieJackpotOfferSuppressed ? jackpotLabelForTarget("tie", -1) : null;

 tieOddsEl.onclick = null;
 tieOddsEl.classList.remove("jackpot-call", "jackpot-locked");
 tieOddsEl.classList.toggle("low", false);

 const tieJackpotLockedByBet = !!currentTieJackpotType && isJackpotTypeLockedForTarget(currentTieJackpotType, "tie", -1);
 const visibleTieJackpotLabel = jackpotLabel || (tieJackpotLockedByBet ? jackpotPromptForType(currentTieJackpotType) : null);

 if (visibleTieJackpotLabel) {
 tieOddsEl.textContent = visibleTieJackpotLabel;
 tieOddsEl.classList.add("jackpot-call");
 const type = currentTieJackpotType;
 const jackpotLocked = !!type && isJackpotTypeLockedForTarget(type, "tie", -1);
 tieOddsEl.classList.toggle("jackpot-locked", jackpotLocked);
 tieOddsEl.onclick = jackpotLocked ? null : () => {
 const type = jackpotTypeForOddsValue(getTargetOddsValue("tie", -1));
 if (type) placeJackpotBet(type, "tie", -1);
 };
 } else {
 setOddsDisplay(tieOddsEl, displayOdds, "");
 tieOddsEl.classList.toggle("low", isLowOddsDisplay(displayOdds));
 }
 }

 if (tieResultInfo) {
 tieResultInfo.textContent = phase === "river" ? (tieBet.resultLabel || "") : "";
 }

 ["pre", "flop", "turn"].forEach((ph) => {
 const sq = document.querySelector(`.sq[data-tie-phase="${ph}"]`);
 const pot = document.querySelector(`.pot[data-tie-pot="${ph}"]`);
 const betSquare = document.querySelector(`[data-tie-bet-square="${ph}"]`);
 if (!sq || !pot) return;

 const tieJackpotType = jackpotTypeForOddsValue(getTargetOddsValue("tie", -1));
 const tieJackpotOfferSuppressed = tieJackpotType && shouldSuppressJackpotOfferAtPhase(tieJackpotType, "tie", -1, ph);
 const jackpotEligibleCurrentPhase = tieJackpotType && ph === phase && phase !== "river" && !tieJackpotOfferSuppressed;
 const active = phase === ph && phase !== "river";
 const jackpotBetTypeOnSquare = getJackpotBetTypeOnTargetPhase("tie", -1, ph);
 sq.classList.toggle("active", active);
 sq.classList.toggle("disabled", phase === "river" || !active);
 sq.classList.toggle("hasBet", (tieBet.bets[ph] || 0) > 0 || !!jackpotBetTypeOnSquare);
 sq.classList.toggle("has-jackpot-bet", !!jackpotBetTypeOnSquare);

 const eraserBtn = sq.querySelector(".eraser");
 if (eraserBtn) {
  eraserBtn.onclick = (e) => {
   e.stopPropagation();
   if (jackpotBetTypeOnSquare) undoJackpotBet(jackpotBetTypeOnSquare, "tie", -1, ph);
   else undoTieBet(ph);
  };
 }

 if (betSquare) {
 const lostJackpotText = getLostJackpotText("tie", -1, ph);
 const squareText = phase === "river"
 ? (lostJackpotText || jackpotSquareText("tie", -1, ph))
 : (jackpotEligibleCurrentPhase ? jackpotSquareText("tie", -1, ph) || "1" : jackpotSquareText("tie", -1, ph));
 betSquare.textContent = squareText;
 betSquare.classList.toggle("jackpot-lost", !!lostJackpotText);
 }

 const jackpotBetPlacedHere = hasAnyJackpotBetOnTarget("tie", -1, ph);
 pot.classList.remove("jackpot-bronze", "jackpot-argent", "jackpot-or", "jackpot-diamant");

 if (jackpotBetPlacedHere) {
  const placedType = JACKPOT_TYPES.find((type) => hasJackpotBet(type, "tie", -1, ph));
  pot.textContent = jackpotPotLabel(placedType);
  if (placedType) pot.classList.add(`jackpot-${placedType}`);
 } else {
  pot.textContent = jackpotEligibleCurrentPhase ? jackpotPotLabel(tieJackpotType) : (phasePotentialForTie(ph) > 0 ? phasePotentialForTie(ph).toFixed(2) : "");
 }
 });

 highlightLowestDisplayedOdds();
}


function getNodeCenterInLayer(node, layerRect) {
 return getNodePointInLayer(node, layerRect, 0.5, 0.5);
}

function getStatVisualAnchor(node, layerRect) {
 if (!node || !layerRect) return null;
 const stat = node.closest?.(".stat") || node;
 return getNodePointInLayer(stat, layerRect, 0.5, 0.5);
}

function getNodePointInLayer(node, layerRect, rx = 0.5, ry = 0.5) {
 if (!node || !layerRect) return null;
 const rect = node.getBoundingClientRect();
 return {
  x: rect.left - layerRect.left + (rect.width * rx),
  y: rect.top - layerRect.top + (rect.height * ry)
 };
}

function getBankrollBoxNode() {
 return document.getElementById("bankroll")?.closest(".stat") || document.getElementById("bankroll");
}

function getWinsBoxNode() {
 return document.querySelector(".stat.total-wins") || document.getElementById("totalWins")?.closest(".stat") || document.getElementById("totalWins");
}

function launchChipFlight(targetNode) {
 if (!chipFlightLayer || !targetNode) return;

 const layerRect = chipFlightLayer.getBoundingClientRect();
 if (!layerRect.width || !layerRect.height) return;

 const sourceNode = getBankrollBoxNode() || document.getElementById("betPanel");

 // Mise : départ visuel strict depuis le centre de la case Solde.
 // On ne part plus de la zone de menu ou d'un point approximatif.
 const source = getStatVisualAnchor(sourceNode, layerRect);
 const target = getNodeCenterInLayer(targetNode, layerRect);

 if (!source || !target) return;

 const chip = document.createElement("div");
 chip.className = "flying-chip bet-flight";
 chip.textContent = String(selectedBet);
 chip.style.left = `${source.x}px`;
 chip.style.top = `${source.y}px`;
 const dx = target.x - source.x;
 const dy = target.y - source.y;
 chip.style.setProperty("--chip-dx", `${dx}px`);
 chip.style.setProperty("--chip-dy", `${dy}px`);
 chip.style.setProperty("--chip-mid-x", `${dx * 0.48}px`);
 chip.style.setProperty("--chip-mid-y", `${Math.min(-34, dy * 0.10)}px`);
 chip.style.setProperty("--chip-bet-duration", "880ms");

 chipFlightLayer.appendChild(chip);
 chip.getBoundingClientRect();
 chip.classList.add("animating");

 const cleanup = () => chip.remove();
 chip.addEventListener("animationend", cleanup, { once: true });
 setTimeout(cleanup, 1050);
}


function launchWinChipFlight(sourceNode, amount) {
 if (!chipFlightLayer || !sourceNode) return;

 const targetNode = getWinsBoxNode();
 if (!targetNode) return;

 const layerRect = chipFlightLayer.getBoundingClientRect();
 if (!layerRect.width || !layerRect.height) return;

 const source = getNodeCenterInLayer(sourceNode, layerRect);
 const target = getStatVisualAnchor(targetNode, layerRect);
 if (!source || !target) return;

 const chip = document.createElement("div");
 chip.className = "flying-chip win";
 chip.textContent = amount >= 100 ? "++" : "+";

 chip.style.left = `${source.x}px`;
 chip.style.top = `${source.y}px`;
 chip.style.setProperty("--chip-dx", `${target.x - source.x}px`);
 chip.style.setProperty("--chip-dy", `${target.y - source.y}px`);
 chip.style.setProperty("--chip-mid-x", `${(target.x - source.x) * 0.42}px`);
 chip.style.setProperty("--chip-mid-y", `${Math.min(-8, (target.y - source.y) * -0.12)}px`);

 chipFlightLayer.appendChild(chip);
 chip.getBoundingClientRect();
 chip.classList.add("animating");

 const flashNode = getWinsBoxNode();
 if (flashNode) {
 flashNode.classList.remove("win-flash");
 void flashNode.offsetWidth;
 flashNode.classList.add("win-flash");
 }

 const cleanup = () => chip.remove();
 chip.addEventListener("animationend", cleanup, { once: true });
 setTimeout(cleanup, 900);
}


let audioCtx = null;

function resumeAudioContext() {
 const ctx = getAudioContext();
 if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}


function getAudioContext() {
 if (!window.AudioContext && !window.webkitAudioContext) return null;
 if (!audioCtx) {
 const Ctx = window.AudioContext || window.webkitAudioContext;
 audioCtx = new Ctx();
 }
 if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
 return audioCtx;
}

function playMetalCoinSound(burstCount = 5, intensity = 1) {
 if (!soundEnabled) return;
 const ctx = getAudioContext();
 if (!ctx) return;

 duckSuspenseForCoins(1100);

 const now = ctx.currentTime;
 const total = Math.max(2, Math.min(14, Math.round(burstCount)));
 const amp = Math.max(0.75, Math.min(1.5, intensity));

 for (let i = 0; i < total; i++) {
 const t = now + (i * (0.09 - Math.min(0.035, (amp - 0.65) * 0.03)));

 const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.13), ctx.sampleRate);
 const data = noiseBuffer.getChannelData(0);
 for (let j = 0; j < data.length; j++) {
 data[j] = (Math.random() * 2 - 1) * (1 - (j / data.length));
 }

 const noise = ctx.createBufferSource();
 noise.buffer = noiseBuffer;

 const bodyOsc = ctx.createOscillator();
 const shineOsc = ctx.createOscillator();
 const ringOsc = ctx.createOscillator();

 const bodyGain = ctx.createGain();
 const shineGain = ctx.createGain();
 const ringGain = ctx.createGain();
 const noiseGain = ctx.createGain();

 const bodyFilter = ctx.createBiquadFilter();
 const shineFilter = ctx.createBiquadFilter();
 const ringFilter = ctx.createBiquadFilter();
 const mix = ctx.createGain();

 bodyOsc.type = "triangle";
 shineOsc.type = "sine";
 ringOsc.type = "sine";

 bodyOsc.frequency.setValueAtTime((900 + (i * 14)) * amp, t);
 bodyOsc.frequency.exponentialRampToValueAtTime(380 + (amp * 40), t + 0.24);

 shineOsc.frequency.setValueAtTime((1500 + (i * 18)) * amp, t);
 shineOsc.frequency.exponentialRampToValueAtTime(690 + (amp * 30), t + 0.17);

 ringOsc.frequency.setValueAtTime(620 + (i * 10), t);
 ringOsc.frequency.exponentialRampToValueAtTime(300, t + 0.28);

 bodyFilter.type = "bandpass";
 bodyFilter.Q.setValueAtTime(3.1, t);
 bodyFilter.frequency.setValueAtTime(1080 + (amp * 120), t);

 shineFilter.type = "highpass";
 shineFilter.frequency.setValueAtTime(880, t);

 ringFilter.type = "lowpass";
 ringFilter.frequency.setValueAtTime(780, t);

 bodyGain.gain.setValueAtTime(0.0001, t);
 bodyGain.gain.exponentialRampToValueAtTime(0.065 * amp, t + 0.012);
 bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

 shineGain.gain.setValueAtTime(0.0001, t);
 shineGain.gain.exponentialRampToValueAtTime(0.024 * amp, t + 0.01);
 shineGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

 ringGain.gain.setValueAtTime(0.0001, t);
 ringGain.gain.exponentialRampToValueAtTime(0.018 * amp, t + 0.015);
 ringGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

 noiseGain.gain.setValueAtTime(0.0001, t);
 noiseGain.gain.exponentialRampToValueAtTime(0.014 * amp, t + 0.004);
 noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

 mix.gain.setValueAtTime(1.35, t);

 bodyOsc.connect(bodyFilter);
 bodyFilter.connect(bodyGain);
 bodyGain.connect(mix);

 shineOsc.connect(shineFilter);
 shineFilter.connect(shineGain);
 shineGain.connect(mix);

 ringOsc.connect(ringFilter);
 ringFilter.connect(ringGain);
 ringGain.connect(mix);

 noise.connect(noiseGain);
 noiseGain.connect(mix);

 mix.connect(ctx.destination);

 bodyOsc.start(t);
 shineOsc.start(t);
 ringOsc.start(t);
 noise.start(t);

 bodyOsc.stop(t + 0.26);
 shineOsc.stop(t + 0.18);
 ringOsc.stop(t + 0.30);
 noise.stop(t + 0.11);
 }
}

function getWinBurstProfile(amount) {
 if (amount >= 2500) {
 return {
 coinCount: 16,
 soundCount: 12,
 durationMs: 2450,
 staggerMs: 55,
 spreadX: 4.2,
 arcBase: -88,
 arcExtra: 0.11,
 flashClass: "win-flash-jackpot",
 soundBoost: 1.2
 };
 }
 if (amount >= 600) {
 return {
 coinCount: 12,
 soundCount: 9,
 durationMs: 2100,
 staggerMs: 62,
 spreadX: 3.8,
 arcBase: -72,
 arcExtra: 0.095,
 flashClass: "win-flash-big",
 soundBoost: 1.06
 };
 }
 if (amount >= 120) {
 return {
 coinCount: 8,
 soundCount: 6,
 durationMs: 1820,
 staggerMs: 72,
 spreadX: 3.2,
 arcBase: -58,
 arcExtra: 0.085,
 flashClass: "win-flash",
 soundBoost: 0.94
 };
 }
 return {
 coinCount: 4,
 soundCount: 3,
 durationMs: 1450,
 staggerMs: 88,
 spreadX: 2.6,
 arcBase: -46,
 arcExtra: 0.06,
 flashClass: "win-flash-soft",
 soundBoost: 0.82
 };
}

function launchWinCoinBurst(sourceNode, amount) {
 if (!chipFlightLayer || !sourceNode) return;

 const targetNode = getWinsBoxNode();
 if (!targetNode) return;

 const layerRect = chipFlightLayer.getBoundingClientRect();
 if (!layerRect.width || !layerRect.height) return;

 const source = getNodeCenterInLayer(sourceNode, layerRect);
 const target = getStatVisualAnchor(targetNode, layerRect);
 if (!source || !target) return;

 const profile = getWinBurstProfile(amount);
 playMetalCoinSound(profile.soundCount, profile.soundBoost);

 for (let i = 0; i < profile.coinCount; i++) {
 const chip = document.createElement("div");
 chip.className = "flying-chip win";
 chip.textContent = "";

 const spread = (i - ((profile.coinCount - 1) / 2));
 const startJitterX = spread * profile.spreadX;
 const startJitterY = (i % 2 === 0 ? -4 : 4);
 // Arrivée précise : très faible dispersion, toujours dans la case Gains.
 const endJitterX = ((i % 3) - 1) * 1.5;
 const endJitterY = ((i % 2) - 0.5) * 1.2;

 const dx = (target.x - source.x) + endJitterX - startJitterX;
 const dy = (target.y - source.y) + endJitterY - startJitterY;

 chip.style.left = `${source.x + startJitterX}px`;
 chip.style.top = `${source.y + startJitterY}px`;
 chip.style.setProperty("--chip-dx", `${dx}px`);
 chip.style.setProperty("--chip-dy", `${dy}px`);
 chip.style.setProperty("--chip-mid-x", `${dx * 0.34}px`);
 chip.style.setProperty("--chip-mid-y", `${Math.min(profile.arcBase, profile.arcBase - Math.abs(dx) * profile.arcExtra)}px`);
 chip.style.setProperty("--chip-end-scale", `${amount >= 2500 ? 1.02 : amount >= 600 ? 0.98 : 0.94 + ((i % 3) * 0.03)}`);
 chip.style.setProperty("--chip-win-duration", `${profile.durationMs}ms`);
 chip.style.animationDelay = `${i * profile.staggerMs}ms`;

 chipFlightLayer.appendChild(chip);
 chip.getBoundingClientRect();
 chip.classList.add("animating");

 const cleanup = () => chip.remove();
 chip.addEventListener("animationend", cleanup, { once: true });
 setTimeout(cleanup, profile.durationMs + (profile.coinCount * profile.staggerMs) + 200);
 }

 const flashNode = getWinsBoxNode();
 if (flashNode) {
 flashNode.classList.remove("win-flash-soft", "win-flash", "win-flash-big", "win-flash-jackpot");
 void flashNode.offsetWidth;
 flashNode.classList.add(profile.flashClass);
 }
}

function canBetOnPhase(ph) {
 return phase === ph && phase !== "river" && !roundFinished && !isCalculating;
}

