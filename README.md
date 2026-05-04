// ==================================================
// SETTINGS / LOGGING / BANKROLL
// ==================================================

function saveSettings() {
 try {
  const payload = {
   feltIndex: currentFeltIndex,
   ambienceVolume,
   soundEnabled,
   lang,
   currentAudioStyle,
   casinoLayerEnabled
  };
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
 } catch (_) {}
}

function loadSettings() {
 try {
  const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" ? parsed : null;
 } catch (_) {
  return null;
 }
}


const roundSetupOverlay = el("roundSetupOverlay");
const roundSetupTitle = el("roundSetupTitle");
const roundSetupSubtitle = el("roundSetupSubtitle");
const btnRandomHands = el("btnRandomHands");
const btnManualHands = el("btnManualHands");
const handsCountLabel = el("handsCountLabel");
const handsCountSelect = el("handsCountSelect");

const sndDeal = document.getElementById("sndDeal");
const sndCard = document.getElementById("sndCard");
const sndAmbience = document.getElementById("sndAmbience");
const sndCasino = document.getElementById("sndCasino");
const splashScreen = el("splashScreen");
const btnStart = el("btnStart");

function sendClientLog(entry) {
 try {
  fetch("/log", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(entry),
   keepalive: true,
  }).catch(() => {});
 } catch (_) {}
}

function log(line, meta = {}) {
 const entry = {
  source: "client",
  time: new Date().toISOString(),
  level: meta.level || "info",
  event: meta.event || "client.ui.log",
  message: String(line),
  data: meta.data || {}
 };

 if (logBody) {
  const div = document.createElement("div");
  div.className = "log-line";
  div.textContent = line;
  logBody.prepend(div);
 }

 sendClientLog(entry);
}

function updateBankroll(delta) {
 setBankroll(bankroll + delta);
 if (bankrollEl) bankrollEl.textContent = bankroll.toFixed(2);
}

function computeTotalBets() {
 let total = 0;
 for (const h of hands) {
 total += (h.bets.pre || 0) + (h.bets.flop || 0) + (h.bets.turn || 0);
 }
 total += (tieBet.bets.pre || 0) + (tieBet.bets.flop || 0) + (tieBet.bets.turn || 0);
 total += JACKPOT_TYPES.reduce((sum,t)=>sum+Number(jackpotRoundStake?.[t]||0),0);
 if (totalBetsEl) totalBetsEl.textContent = total.toFixed(0);
}


function showWinPopup(amount){
 const div = document.createElement("div");
 div.className = "win-popup" + (amount >= 120 ? " big" : "");
 div.textContent = "+" + amount.toFixed(2);
 document.body.appendChild(div);

 setTimeout(()=>div.remove(), amount >= 120 ? 2400 : 2000);
}

function triggerWinEffects(amount){
 if(amount <= 0) return;

 showWinPopup(amount);

 const winsBox = document.querySelector(".stat.total-wins");
 if (winsBox) {
  winsBox.classList.remove("win-flash", "win-impact");
  void winsBox.offsetWidth;
  winsBox.classList.add("win-flash", "win-impact");
  setTimeout(() => winsBox.classList.remove("win-flash", "win-impact"), amount >= 120 ? 1800 : 1500);
 }
}

function updateTotalWinsDisplay() {
 if (totalWinsEl) totalWinsEl.textContent = totalWins.toFixed(2);
}


function getPreflopCommittedBetTotal() {
 let total = 0;

 for (const h of hands) {
  total += Number(h?.bets?.pre || 0);
 }

 total += Number(tieBet?.bets?.pre || 0);
 total += JACKPOT_TYPES.reduce((sum,t)=>sum+Number(jackpotRoundStake?.[t]||0),0);

 return total;
}

function getJackpotNetContribution(amount) {
 return Number(amount || 0) * (1 - CONFIG.margin);
}

async function fetchJackpotsFromServer() {
 try {
  const suffix = serverGameId ? `?gameId=${encodeURIComponent(serverGameId)}` : '';
  const res = await fetch(`/jackpots${suffix}`);
  if (!res.ok) return jackpots;
  const data = await res.json();
  if (data && data.jackpots) jackpots = { ...jackpots, ...data.jackpots };
  return jackpots;
 } catch (_) {
  return jackpots;
 }
}

async function syncJackpotDisplayFromServer() {
 if (jackpotSyncBusy) return;
 jackpotSyncBusy = true;
 try {
  await fetchJackpotsFromServer();
  updateJackpotDisplays();
 } finally {
  jackpotSyncBusy = false;
 }
}

async function placeJackpotSnapshotOnServer(targetKind, targetIndex, phaseName, rawOddsAtBetTime) {
 try {
  const res = await fetch('/jackpots/bet', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
    gameId: serverGameId,
    targetKind,
    targetIndex,
    phase: phaseName,
    rawOddsAtBetTime: Number(rawOddsAtBetTime || 0),
    amount: 1
   })
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.jackpots) jackpots = { ...jackpots, ...data.jackpots };
  return data;
 } catch (_) {
  return null;
 }
}

async function refundJackpotSnapshotOnServer(snapshotId, targetKind, targetIndex, phaseName) {
 try {
  const res = await fetch('/jackpots/refund', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
    gameId: serverGameId,
    snapshotId,
    targetKind,
    targetIndex,
    phase: phaseName
   })
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.jackpots) jackpots = { ...jackpots, ...data.jackpots };
  return data;
 } catch (_) {
  return null;
 }
}

function applyPendingJackpotCredits() {
 return syncJackpotDisplayFromServer();
}

function getCommittedBetTotal() {

 let total = 0;

 for (const h of hands) {
  total += Number(h?.bets?.pre || 0) + Number(h?.bets?.flop || 0) + Number(h?.bets?.turn || 0);
 }

 total += Number(tieBet?.bets?.pre || 0) + Number(tieBet?.bets?.flop || 0) + Number(tieBet?.bets?.turn || 0);
 total += JACKPOT_TYPES.reduce((sum,t)=>sum+Number(jackpotRoundStake?.[t]||0),0);

 return total;
}

function hasCommittedBet() {
 return getCommittedBetTotal() > 0;
}

function canUseAbandon() {
 const splashVisible = !!(splashScreen && !splashScreen.classList.contains("hidden"));
 const setupVisible = !!(roundSetupOverlay && !roundSetupOverlay.classList.contains("hidden"));
 return !splashVisible && !setupVisible && !roundFinished && phase === "pre" && !hasCommittedBet() && !isCalculating && !isAdvancingPhase;
}

function refreshActionButtons() {
 // v15.20 : déverrouillage robuste de la validation.
 // Dès qu'une mise réelle existe (main, égalité ou jackpot), le bouton doit pouvoir valider.
 if (getCommittedBetTotal() > 0) {
  advanceUnlockedForRound = true;
 }

 if (btnSameTable) btnSameTable.disabled = !roundFinished;
 if (btnChangeTable) btnChangeTable.disabled = !roundFinished;
 if (btnAdvance) {
  btnAdvance.disabled = roundFinished || isCalculating || isAdvancingPhase || !advanceUnlockedForRound;
  btnAdvance.style.pointerEvents = btnAdvance.disabled ? "none" : "auto";
 }

 if (btnAbandon) {
  const visible = canUseAbandon();
  btnAbandon.disabled = !visible;
  btnAbandon.classList.toggle("show-abandon", visible);
 }
 updateJackpotDisplays();
 syncPostRoundControls();
 if (typeof syncAbandonDockVisibility === "function") syncAbandonDockVisibility();
 if (typeof ensureAdvanceDockUsable === "function") ensureAdvanceDockUsable();
}

