// Protection jeu : désactive le menu clic droit / long press accidentel
// même pendant les mises rapides.
if (!window.__corsicaContextMenuDisabled) {
  window.__corsicaContextMenuDisabled = true;
  const blockGameContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  };
  window.addEventListener("contextmenu", blockGameContextMenu, true);
  document.addEventListener("contextmenu", blockGameContextMenu, true);
  document.addEventListener("pointerdown", (event) => {
    if (event.button === 2) blockGameContextMenu(event);
  }, true);
  document.addEventListener("dragstart", blockGameContextMenu, true);
}

// ==================================================
// SETTINGS UI / INIT
// ==================================================

function hexToRgb(hex) {
 const safe = String(hex || "").trim().replace("#", "");
 if (!/^[0-9a-fA-F]{6}$/.test(safe)) return { r: 15, g: 95, b: 60 };
 const num = parseInt(safe, 16);
 return {
  r: (num >> 16) & 255,
  g: (num >> 8) & 255,
  b: num & 255,
 };
}

function rgbToHex(r, g, b) {
 const clamp = (v) => Math.max(0, Math.min(255, Math.round(v || 0)));
 return "#" + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, "0")).join("");
}

function mixColors(hexA, hexB, weight = 0.5) {
 const a = hexToRgb(hexA);
 const b = hexToRgb(hexB);
 const w = Math.max(0, Math.min(1, Number(weight) || 0));
 return rgbToHex(
  a.r + (b.r - a.r) * w,
  a.g + (b.g - a.g) * w,
  a.b + (b.b - a.b) * w,
 );
}

function relativeLuminance(hex) {
 const { r, g, b } = hexToRgb(hex);
 const norm = [r, g, b].map((value) => {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
 });
 return (0.2126 * norm[0]) + (0.7152 * norm[1]) + (0.0722 * norm[2]);
}

function feltToneSet(palette) {
 const base = palette?.table || "#0f5f3c";
 const deep = palette?.table2 || base;
 const brightFelt = relativeLuminance(base) > 0.42;
 const panelBase = mixColors(base, deep, 0.45);
 const panelBg = brightFelt ? mixColors(panelBase, "#ffffff", 0.12) : mixColors(panelBase, "#000000", 0.24);
 const panelBorder = brightFelt ? mixColors(base, "#000000", 0.34) : mixColors(base, "#ffffff", 0.20);
 const sameBtnTop = brightFelt ? mixColors(base, "#ffffff", 0.06) : mixColors(base, "#ffffff", 0.16);
 const sameBtnBottom = brightFelt ? mixColors(deep, "#000000", 0.16) : mixColors(deep, "#ffffff", 0.04);
 const changeBtnTop = brightFelt ? mixColors(base, "#000000", 0.08) : mixColors(base, "#000000", 0.05);
 const changeBtnBottom = brightFelt ? mixColors(deep, "#000000", 0.24) : mixColors(deep, "#000000", 0.18);
 const buttonBorder = brightFelt ? mixColors(base, "#000000", 0.38) : mixColors(base, "#ffffff", 0.22);
 const buttonText = brightFelt ? "#1d1407" : (palette?.text || "#f7fff9");
 const buttonTextShadow = brightFelt
  ? "0 1px 1px rgba(255,255,255,.18), 0 0 4px rgba(255,255,255,.10)"
  : "0 1px 2px rgba(0,0,0,.55), 0 0 6px rgba(255,255,255,.12)";

 return {
  panelBg,
  panelBorder,
  panelGlow: brightFelt ? "rgba(0,0,0,.18)" : "rgba(0,0,0,.30)",
  buttonBorder,
  sameBtnTop,
  sameBtnBottom,
  changeBtnTop,
  changeBtnBottom,
  buttonText,
  buttonTextShadow,
 };
}

function applyFeltColor(index) {
 const safeIndex = Math.max(0, Math.min(FELT_COLORS.length - 1, Number(index) || 0));
 const palette = FELT_COLORS[safeIndex] || FELT_COLORS[0];
 const tones = feltToneSet(palette);
 currentFeltIndex = safeIndex;
 document.documentElement.style.setProperty("--table", palette.table);
 document.documentElement.style.setProperty("--table2", palette.table2);
 document.documentElement.style.setProperty("--felt-text", palette.text || "#F5FBFF");
 document.documentElement.style.setProperty("--felt-muted", palette.muted || "#D7E8F3");
 document.documentElement.style.setProperty("--post-round-panel-bg", tones.panelBg);
 document.documentElement.style.setProperty("--post-round-panel-border", tones.panelBorder);
 document.documentElement.style.setProperty("--post-round-panel-glow", tones.panelGlow);
 document.documentElement.style.setProperty("--post-round-btn-border", tones.buttonBorder);
 document.documentElement.style.setProperty("--post-round-btn-same-top", tones.sameBtnTop);
 document.documentElement.style.setProperty("--post-round-btn-same-bottom", tones.sameBtnBottom);
 document.documentElement.style.setProperty("--post-round-btn-change-top", tones.changeBtnTop);
 document.documentElement.style.setProperty("--post-round-btn-change-bottom", tones.changeBtnBottom);
 document.documentElement.style.setProperty("--post-round-btn-text", tones.buttonText);
 document.documentElement.style.setProperty("--post-round-btn-text-shadow", tones.buttonTextShadow);
 if (feltColorOptions) {
  Array.from(feltColorOptions.children).forEach((btn, i) => {
   btn.classList.toggle("active", i === safeIndex);
  });
 }
 saveSettings();
}

function buildFeltColorOptions() {
 if (!feltColorOptions || feltColorOptions.childElementCount) return;
 FELT_COLORS.forEach((palette, index) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "felt-color-btn";
  btn.style.background = `linear-gradient(180deg, ${palette.table}, ${palette.table2})`;
  btn.setAttribute("aria-label", `Couleur tapis ${index + 1}`);
  btn.addEventListener("click", () => applyFeltColor(index));
  feltColorOptions.appendChild(btn);
 });
}


function setupSettingsPanel() {
 if (settingsBtn && settingsPanel) {
  let settingsHoverWatcher = null;
  let settingsCloseArmedAt = 0;
  const SETTINGS_CLOSE_DELAY_MS = 680;

  const stopSettingsHoverWatcher = () => {
   if (settingsHoverWatcher) {
    clearInterval(settingsHoverWatcher);
    settingsHoverWatcher = null;
   }
   settingsCloseArmedAt = 0;
  };

  const armSettingsClose = () => {
   settingsCloseArmedAt = Date.now() + SETTINGS_CLOSE_DELAY_MS;
  };

  const startSettingsHoverWatcher = () => {
   stopSettingsHoverWatcher();
   armSettingsClose();
   settingsHoverWatcher = setInterval(() => {
    if (settingsPanel.classList.contains("hidden")) {
      stopSettingsHoverWatcher();
      return;
    }

    const panelHovered = settingsPanel.matches(":hover");
    const buttonHovered = settingsBtn.matches(":hover");

    if (panelHovered || buttonHovered) {
      settingsCloseArmedAt = 0;
      return;
    }

    if (!settingsCloseArmedAt) {
      armSettingsClose();
      return;
    }

    if (Date.now() >= settingsCloseArmedAt) {
      settingsPanel.classList.add("hidden");
      stopSettingsHoverWatcher();
    }
   }, 60);
  };

  settingsBtn.addEventListener("click", (e) => {
   e.stopPropagation();
   settingsPanel.classList.toggle("hidden");

   if (settingsPanel.classList.contains("hidden")) stopSettingsHoverWatcher();
   else startSettingsHoverWatcher();
  });

  settingsPanel.addEventListener("click", (e) => e.stopPropagation());

  settingsPanel.addEventListener("mouseenter", () => {
   settingsCloseArmedAt = 0;
   if (!settingsPanel.classList.contains("hidden")) startSettingsHoverWatcher();
  });

  settingsPanel.addEventListener("mouseleave", () => {
   if (!settingsPanel.classList.contains("hidden")) {
    armSettingsClose();
   }
  });

  document.addEventListener("click", () => {
   if (!settingsPanel.classList.contains("hidden")) {
    settingsPanel.classList.add("hidden");
    stopSettingsHoverWatcher();
   }
  });
 }

 buildFeltColorOptions();
 const savedSettings = typeof loadSettings === "function" ? (loadSettings() || {}) : {};
 const savedFeltIndex = Number.isFinite(Number(savedSettings.feltIndex)) ? Number(savedSettings.feltIndex) : currentFeltIndex;
 currentFeltIndex = Math.max(0, Math.min(FELT_COLORS.length - 1, savedFeltIndex));
 if (typeof savedSettings.lang === "string" && savedSettings.lang) lang = savedSettings.lang;
 if (typeof savedSettings.soundEnabled === "boolean") soundEnabled = savedSettings.soundEnabled;
 if (Number.isFinite(Number(savedSettings.ambienceVolume))) ambienceVolume = Math.max(0, Math.min(1, Number(savedSettings.ambienceVolume)));
 currentAudioStyle = Number.isFinite(Number(savedSettings.currentAudioStyle)) ? Number(savedSettings.currentAudioStyle) : 0;
 if (typeof savedSettings.casinoLayerEnabled === "boolean") casinoLayerEnabled = savedSettings.casinoLayerEnabled;
 applyFeltColor(currentFeltIndex);
}

document.querySelectorAll(".chip").forEach(btn => {
 btn.addEventListener("click", () => {
 startAmbience();
 playChipClickSound();
 flashChipButton(btn);
 premiumBoardImpact();
 document.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
 btn.classList.add("active");
 selectedBet = Number(btn.dataset.amt);
 });
});

const settingsLangFR = el("settingsLangFR");
const settingsLangEN = el("settingsLangEN");
const settingsAudioButtons = Array.from(document.querySelectorAll(".settings-audio-btn"));

if (settingsLangFR) settingsLangFR.addEventListener("click", () => setLang("fr"));
if (settingsLangEN) settingsLangEN.addEventListener("click", () => setLang("en"));
settingsAudioButtons.forEach((btn) => {
 btn.addEventListener("click", () => {
  const styleIndex = Number(btn.dataset.audioStyle);
  if (styleIndex === 5) {
   toggleCasinoLayer();
  } else {
   applyAudioStyle(styleIndex);
  }
  if (soundEnabled && Number(ambienceVolume) > 0) startAmbience();
 });
});


if (btnSameTable) {
 btnSameTable.addEventListener("click", () => {
  startAmbience();
  if (!roundFinished) {
   log(I18N[lang].finishRoundFirst);
   return;
  }
  launchNewRoundWithCount(currentHandsCount);
 });
}

if (btnChangeTable) {
 btnChangeTable.addEventListener("click", () => {
  startAmbience();
  if (!roundFinished) {
   log(I18N[lang].finishRoundFirst);
   return;
  }
  showRoundSetup();
 });
}

if (btnAdvance) {
btnAdvance.addEventListener("click", () => {
 startAmbience();
 if (btnAdvance.disabled) return;
 if (isCalculating || isAdvancingPhase) return;
 advanceToShowdown();
 });
}


if (btnAbandon) {
 btnAbandon.addEventListener("click", () => {
  startAmbience();
  if (!canUseAbandon()) return;

  roundFinished = true;
  isAdvancingPhase = false;

  if (autoFinishTimer) {
   clearTimeout(autoFinishTimer);
   autoFinishTimer = null;
  }

  log(`→ ${I18N[lang].abandon}`);
  refreshActionButtons();
  showRoundSetup();
 });
}


if (btnRandomHands) {
 btnRandomHands.addEventListener("click", () => {
 startAmbience();
 const n = CONFIG.minHands + Math.floor(Math.random() * (CONFIG.maxHands - CONFIG.minHands + 1));
 if (handsCountSelect) handsCountSelect.value = String(n);
 launchNewRoundWithCount(n);
 });
}

if (btnManualHands) {
 btnManualHands.addEventListener("click", () => {
 startAmbience();
 const n = handsCountSelect ? Number(handsCountSelect.value) : 10;
 launchNewRoundWithCount(n);
 });
}

if (btnSound) {
 btnSound.addEventListener("click", () => {
 soundEnabled = !soundEnabled;
 applySoundState();
 if (soundEnabled) startAmbience();
 });
}

if (volumeSlider) {
 volumeSlider.addEventListener("input", () => {
  ambienceVolume = Math.max(0, Math.min(1, Number(volumeSlider.value)));
  soundEnabled = ambienceVolume > 0;
  applySoundState();
  if (soundEnabled) startAmbience();
 });
}

document.addEventListener("click", startAmbience, { once: true });

const settingsLockBtn = document.getElementById("settingsLockBtn");
if (settingsLockBtn) {
 settingsLockBtn.addEventListener("click", async () => {
  try { await fetch("/logout", { method: "POST" }); } catch (_) {}
  window.location.href = "/login";
 });
}
document.addEventListener("pointerdown", () => { const ctx = getAudioContext?.(); if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {}); }, { once: true });


function hideSplashScreen() {
 if (splashScreen) splashScreen.classList.add("hidden");
 if (roundSetupOverlay) roundSetupOverlay.classList.remove("hidden");
 updateValidationButtonContext();
}

function clearPregameOverlays() {
  if (splashScreen) splashScreen.classList.add("hidden");
  if (roundSetupOverlay) roundSetupOverlay.classList.add("hidden");
  const rulesModal = document.getElementById("rulesModal");
  if (rulesModal) {
    rulesModal.classList.add("hidden");
    rulesModal.setAttribute("aria-hidden", "true");
  }
  const settingsPanel = document.getElementById("settingsPanel");
  if (settingsPanel) settingsPanel.classList.add("hidden");
  const tableTransition = document.getElementById("tableTransition");
  if (tableTransition) tableTransition.classList.remove("active");
  document.body.classList.remove("pregame-screen", "setup-screen");
  document.body.classList.add("gameplay-screen");
  updateValidationButtonContext();
}

if (btnStart) {
 btnStart.addEventListener("click", () => {
  log("Ouverture du choix de manche", { event: "client.ui.start_click" });
  startAmbience();
  hideSplashScreen();
  if (handsCountSelect && !handsCountSelect.value) {
    handsCountSelect.value = String(currentHandsCount || 10);
  }
 });
}

function init() {
 if (simsCount) simsCount.textContent = String(simsForPhase());
 if (marginPct) marginPct.textContent = String(Math.round(CONFIG.margin * 100));
 if (bankrollEl) bankrollEl.textContent = bankroll.toFixed(2);

 computeTotalBets();
 updateTotalWinsDisplay();
 setupSettingsPanel();
 applySoundState();

 const chip5 = document.querySelector('.chip[data-amt="5"]');
 if (chip5) chip5.classList.add("active");

 setLang(lang || "fr");
 renderBoard();
 showRoundSetup();
 refreshActionButtons();
 scheduleHandsLayout();
}

function renderBoard() {
 if (!boardCards) return;
 boardCards.innerHTML = "";

 const animatedIndexes = phase === "flop"
 ? new Set([0, 1, 2])
 : phase === "turn"
 ? new Set([3])
 : phase === "river"
 ? new Set([4])
 : new Set();

 for (let i = 0; i < 5; i++) {
 const d = document.createElement("div");
 d.className = "card";
 if (board[i] && animatedIndexes.has(i)) {
 d.classList.add("card-deal");
 if (phase === "river" && i === 4) d.classList.add("card-river");
 }
 if (board[i]) d.style.backgroundImage = `url("${cardImage(board[i])}")`;
 else d.style.backgroundImage = `url("${CARD_BACK_URL}")`;
 boardCards.appendChild(d);
 }

 if (animatedIndexes.size) {
 flashBoardCenter();
 }

 if (boardTitle) {
 boardTitle.textContent = I18N[lang].board + " – " + I18N[lang].phase[phase];
 }
}


window.addEventListener("resize", scheduleHandsLayout);
// Tie panel hover must not relayout hand positions; expanded tie panel may overlay them.



document.addEventListener("keydown", (e) => {
 if (!splashScreen || splashScreen.classList.contains("hidden")) return;
 if (e.key === "Enter" || e.key === " ") {
  e.preventDefault();
  startAmbience();
  hideSplashScreen();
 }
});

init();
document.addEventListener("pointerdown", resumeAudioContext, { passive: true });


// === FORCE MAX SUSPENSE VOLUME ===
(function(){
  const _origPlayTensionBeforeRiver =
    (typeof playTensionBeforeRiver === "function") ? playTensionBeforeRiver : null;

  if (_origPlayTensionBeforeRiver) {
    playTensionBeforeRiver = function(callback){
      _origPlayTensionBeforeRiver(callback);
      const forceTimer = setInterval(() => {
        if (!suspenseAudio) {
          clearInterval(forceTimer);
          return;
        }
        suspenseAudio.volume = 1;
      }, 40);
      setTimeout(() => clearInterval(forceTimer), 2400);
    };
  }
})();


// === RULES MODAL FROM SETTINGS ===
(function(){
  function setupRulesModal(){
    const btn = document.getElementById("rulesGameBtn");
    const modal = document.getElementById("rulesModal");
    const closeBtn = document.getElementById("rulesCloseBtn");
    if (!btn || !modal) return;

    const openRules = () => {
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
    };

    const closeRules = () => {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    };

    if (!btn.dataset.rulesBound) {
      btn.addEventListener("click", openRules);
      btn.dataset.rulesBound = "1";
    }

    if (closeBtn && !closeBtn.dataset.rulesBound) {
      closeBtn.addEventListener("click", closeRules);
      closeBtn.dataset.rulesBound = "1";
    }

    modal.querySelectorAll("[data-close-rules='true']").forEach((el) => {
      if (!el.dataset.rulesBound) {
        el.addEventListener("click", closeRules);
        el.dataset.rulesBound = "1";
      }
    });

    if (!document.body.dataset.rulesKeyBound) {
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) closeRules();
      });
      document.body.dataset.rulesKeyBound = "1";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupRulesModal);
  } else {
    setupRulesModal();
  }
})();



// === TOGGLE JOURNAL ===
const toggleLogBtn = el("toggleLogBtn");
const logPanel = document.querySelector(".log");
const mainContainer = document.querySelector(".container");

function syncLogLayout() {
  if (!logPanel || !mainContainer || !toggleLogBtn) return;
  const hidden = logPanel.classList.contains("hidden");
  mainContainer.classList.toggle("log-hidden", hidden);
  toggleLogBtn.classList.toggle("active", !hidden);
  toggleLogBtn.setAttribute("aria-pressed", hidden ? "false" : "true");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (typeof scheduleHandsLayout === "function") scheduleHandsLayout();
      if (typeof renderHands === "function") renderHands();
    });
  });
}

if (toggleLogBtn && logPanel) {
  syncLogLayout();
  toggleLogBtn.addEventListener("click", () => {
    logPanel.classList.toggle("hidden");
    syncLogLayout();
  });
}




function stylizeAdvanceButtonInPlace(){
  if (!btnAdvance) return;

  const wanted = `<span class="advance-check">✓</span><span>${(I18N[lang] || I18N.fr).validateBets}</span>`;
  if (btnAdvance.innerHTML !== wanted) {
    btnAdvance.innerHTML = wanted;
  }
  btnAdvance.setAttribute("aria-label", (I18N[lang] || I18N.fr).validateBets);
  btnAdvance.title = (I18N[lang] || I18N.fr).clearBetsTitle;
}
window.addEventListener("DOMContentLoaded", stylizeAdvanceButtonInPlace);
window.addEventListener("load", stylizeAdvanceButtonInPlace);
setTimeout(stylizeAdvanceButtonInPlace, 0);
setTimeout(stylizeAdvanceButtonInPlace, 100);
setTimeout(stylizeAdvanceButtonInPlace, 300);








function mountValidationButtonBottomRight(){
  if (!btnAdvance || !document.body) return;

  let dock = document.getElementById("advanceDock");
  if (!dock){
    dock = document.createElement("div");
    dock.id = "advanceDock";
    document.body.appendChild(dock);
  }

  if (btnAdvance.parentElement !== dock){
    dock.appendChild(btnAdvance);
  }

  const wanted = `<span class="advance-check">✓</span><span>${(I18N[lang] || I18N.fr).validateBets}</span>`;
  if (btnAdvance.innerHTML !== wanted){
    btnAdvance.innerHTML = wanted;
  }

  btnAdvance.setAttribute("aria-label", (I18N[lang] || I18N.fr).validateBets);
  btnAdvance.title = (I18N[lang] || I18N.fr).clearBetsTitle;

  btnAdvance.style.position = "relative";
  btnAdvance.style.left = "auto";
  btnAdvance.style.top = "auto";
  btnAdvance.style.right = "auto";
  btnAdvance.style.bottom = "auto";
}

window.addEventListener("DOMContentLoaded", mountValidationButtonBottomRight);
window.addEventListener("load", mountValidationButtonBottomRight);
window.addEventListener("resize", mountValidationButtonBottomRight);
setTimeout(mountValidationButtonBottomRight, 0);
setTimeout(mountValidationButtonBottomRight, 200);
setTimeout(mountValidationButtonBottomRight, 800);






function isOverlayActuallyVisible(node){
  if (!node) return false;
  if (node.classList.contains("hidden")) return false;
  const cs = window.getComputedStyle(node);
  return cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0";
}




function updateValidationButtonContext(){
  if (!document.body) return;

  const splashVisible = !!(splashScreen && !splashScreen.classList.contains("hidden"));
  const setupVisible = !!(roundSetupOverlay && !roundSetupOverlay.classList.contains("hidden"));

  document.body.classList.remove("pregame-screen", "setup-screen", "gameplay-screen");

  if (splashVisible){
    document.body.classList.add("pregame-screen");
  } else if (setupVisible){
    document.body.classList.add("setup-screen");
  } else {
    document.body.classList.add("gameplay-screen");
  }

  const dock = document.getElementById("advanceDock");
  if (dock){
    dock.style.display = (!splashVisible && !setupVisible) ? "flex" : "none";
  }

  if (typeof syncHeaderTestButton === "function") syncHeaderTestButton();

  if (btnAdvance){
    btnAdvance.style.display = (!splashVisible && !setupVisible) ? "inline-flex" : "none";
  }
  if (btnAbandon){
    btnAbandon.style.display = (!splashVisible && !setupVisible && canUseAbandon()) ? "inline-flex" : "none";
    btnAbandon.classList.toggle("show-abandon", (!splashVisible && !setupVisible && canUseAbandon()));
  }
}

window.addEventListener("DOMContentLoaded", updateValidationButtonContext);
window.addEventListener("load", updateValidationButtonContext);
window.addEventListener("resize", updateValidationButtonContext);
setTimeout(updateValidationButtonContext, 0);
setTimeout(updateValidationButtonContext, 200);
setTimeout(updateValidationButtonContext, 800);
setInterval(updateValidationButtonContext, 150);









function syncPostRoundControls(){
  if (!document.body) return;

  const controlsWrap = document.querySelector(".table-choice-controls");
  const splashVisible = !!(splashScreen && !splashScreen.classList.contains("hidden"));
  const setupVisible = !!(roundSetupOverlay && !roundSetupOverlay.classList.contains("hidden"));
  const canShowPostRound = !!roundFinished && !splashVisible && !setupVisible;

  document.body.classList.toggle("round-ended", canShowPostRound);

  if (controlsWrap){
    controlsWrap.style.display = canShowPostRound ? "flex" : "none";
    controlsWrap.style.visibility = canShowPostRound ? "visible" : "hidden";
    controlsWrap.style.opacity = canShowPostRound ? "1" : "0";
    controlsWrap.style.pointerEvents = canShowPostRound ? "auto" : "none";
  }

  if (btnSameTable){
    btnSameTable.style.display = canShowPostRound ? "inline-flex" : "none";
    btnSameTable.style.visibility = canShowPostRound ? "visible" : "hidden";
    btnSameTable.style.pointerEvents = canShowPostRound ? "auto" : "none";
  }

  if (btnChangeTable){
    btnChangeTable.style.display = canShowPostRound ? "inline-flex" : "none";
    btnChangeTable.style.visibility = canShowPostRound ? "visible" : "hidden";
    btnChangeTable.style.pointerEvents = canShowPostRound ? "auto" : "none";
  }
}

window.addEventListener("DOMContentLoaded", syncPostRoundControls);
window.addEventListener("load", syncPostRoundControls);
window.addEventListener("resize", syncPostRoundControls);
setTimeout(syncPostRoundControls, 0);
setTimeout(syncPostRoundControls, 250);
setTimeout(syncPostRoundControls, 1000);
setInterval(syncPostRoundControls, 120);


function hideResidualRoundControlsWrapper(){
  const canShowPostRound = !!roundFinished && !(splashScreen && !splashScreen.classList.contains("hidden")) && !(roundSetupOverlay && !roundSetupOverlay.classList.contains("hidden"));
  const candidates = [
    document.querySelector(".table-choice-controls"),
    document.querySelector(".table-choice-controls-wrap"),
    document.querySelector(".post-round-actions"),
    document.querySelector(".end-round-actions"),
    document.querySelector(".round-end-actions"),
    document.getElementById("postRoundActions"),
    document.getElementById("roundEndActions"),
    btnSameTable ? btnSameTable.parentElement : null,
    btnChangeTable ? btnChangeTable.parentElement : null,
  ].filter(Boolean);

  candidates.forEach(el => {
    if (canShowPostRound){
      el.style.display = "";
      el.style.visibility = "visible";
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
      el.style.background = "";
      el.style.boxShadow = "";
      el.style.border = "";
    } else {
      el.style.display = "none";
      el.style.visibility = "hidden";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      el.style.background = "transparent";
      el.style.boxShadow = "none";
      el.style.border = "0";
    }
  });
}

const __origSyncPostRoundControls = typeof syncPostRoundControls === "function" ? syncPostRoundControls : null;
if (__origSyncPostRoundControls) {
  syncPostRoundControls = function(){
    __origSyncPostRoundControls();
    hideResidualRoundControlsWrapper();
  };
}

window.addEventListener("DOMContentLoaded", hideResidualRoundControlsWrapper);
window.addEventListener("load", hideResidualRoundControlsWrapper);
setTimeout(hideResidualRoundControlsWrapper, 0);
setTimeout(hideResidualRoundControlsWrapper, 250);
setTimeout(hideResidualRoundControlsWrapper, 1000);
setInterval(hideResidualRoundControlsWrapper, 150);


function forceControlPanelVisibilityByRoundState(){
  const splashVisible = !!(splashScreen && !splashScreen.classList.contains("hidden"));
  const setupVisible = !!(roundSetupOverlay && !roundSetupOverlay.classList.contains("hidden"));
  const canShowPostRound = !!roundFinished && !splashVisible && !setupVisible;

  if (document.body){
    document.body.classList.toggle("round-ended", canShowPostRound);
  }

  const controlPanel = document.getElementById("controlPanel");
  if (controlPanel){
    controlPanel.style.display = canShowPostRound ? "block" : "none";
    controlPanel.style.visibility = canShowPostRound ? "visible" : "hidden";
    controlPanel.style.opacity = canShowPostRound ? "1" : "0";
    controlPanel.style.pointerEvents = canShowPostRound ? "auto" : "none";
  }
}

const __prevRefreshActionButtons = typeof refreshActionButtons === "function" ? refreshActionButtons : null;
if (__prevRefreshActionButtons) {
  refreshActionButtons = function() {
    __prevRefreshActionButtons();
    forceControlPanelVisibilityByRoundState();
  };
}

window.addEventListener("DOMContentLoaded", forceControlPanelVisibilityByRoundState);
window.addEventListener("load", forceControlPanelVisibilityByRoundState);
window.addEventListener("resize", forceControlPanelVisibilityByRoundState);
setTimeout(forceControlPanelVisibilityByRoundState, 0);
setTimeout(forceControlPanelVisibilityByRoundState, 250);
setTimeout(forceControlPanelVisibilityByRoundState, 1000);
setInterval(forceControlPanelVisibilityByRoundState, 150);



/* === son feutré validation + relance fin de manche === */
let __uiAudioCtx = null;
function playSoftUiTone(type = "validate"){
  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!__uiAudioCtx) __uiAudioCtx = new AudioCtx();
    const ctx = __uiAudioCtx;

    const now = ctx.currentTime + 0.01;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc.type = "sine";
    osc2.type = "triangle";

    if (type === "endround"){
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);
      osc2.frequency.setValueAtTime(270, now);
      osc2.frequency.exponentialRampToValueAtTime(360, now + 0.12);
    } else {
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.10);
      osc2.frequency.setValueAtTime(210, now);
      osc2.frequency.exponentialRampToValueAtTime(310, now + 0.10);
    }

    osc.connect(master);
    osc2.connect(master);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.22);
    osc2.stop(now + 0.22);
  }catch(e){}
}

function bindPremiumRoundButtons(){
  if (btnAdvance && !btnAdvance.dataset.softToneBound){
    btnAdvance.dataset.softToneBound = "1";
    btnAdvance.addEventListener("click", () => playSoftUiTone("validate"));
  }

  if (btnSameTable && !btnSameTable.dataset.softToneBound){
    btnSameTable.dataset.softToneBound = "1";
    btnSameTable.addEventListener("click", () => playSoftUiTone("endround"));
  }

  if (btnChangeTable && !btnChangeTable.dataset.softToneBound){
    btnChangeTable.dataset.softToneBound = "1";
    btnChangeTable.addEventListener("click", () => playSoftUiTone("endround"));
  }
}

window.addEventListener("DOMContentLoaded", bindPremiumRoundButtons);
window.addEventListener("load", bindPremiumRoundButtons);
setTimeout(bindPremiumRoundButtons, 0);
setTimeout(bindPremiumRoundButtons, 300);
setTimeout(bindPremiumRoundButtons, 1000);
setInterval(bindPremiumRoundButtons, 1000);



/* === STYLE DE JEU / THEMES === */
const GAME_STYLE_STORAGE_KEY = "corsicaPokerGameStyle";

function applyGameStyle(style){
  const safeStyle = ["current", "fast", "pro"].includes(style) ? style : "current";
  document.body.classList.remove("theme-current", "theme-fast", "theme-pro");
  document.body.classList.add(`theme-${safeStyle}`);

  document.querySelectorAll(".game-style-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.style === safeStyle);
  });

  try{
    localStorage.setItem(GAME_STYLE_STORAGE_KEY, safeStyle);
  }catch(e){}
}

function bindGameStyleSettings(){
  const buttons = document.querySelectorAll(".game-style-btn");
  if (!buttons.length) return;

  buttons.forEach(btn => {
    if (btn.dataset.boundGameStyle === "1") return;
    btn.dataset.boundGameStyle = "1";
    btn.addEventListener("click", () => applyGameStyle(btn.dataset.style || "current"));
  });

  let saved = "current";
  try{
    saved = localStorage.getItem(GAME_STYLE_STORAGE_KEY) || "current";
  }catch(e){}
  applyGameStyle(saved);
}

window.addEventListener("DOMContentLoaded", bindGameStyleSettings);
window.addEventListener("load", bindGameStyleSettings);
setTimeout(bindGameStyleSettings, 0);
setTimeout(bindGameStyleSettings, 300);
setTimeout(bindGameStyleSettings, 1000);
/* === FIN STYLE DE JEU / THEMES === */



function syncAdvanceAndAbandonButtonsSafe(){
  if (typeof mountValidationButtonBottomRight === "function") {
    try { mountValidationButtonBottomRight(); } catch (_) {}
  }
  if (typeof updateValidationButtonContext === "function") {
    try { updateValidationButtonContext(); } catch (_) {}
  }
  if (typeof syncAbandonDockVisibility === "function") {
    try { syncAbandonDockVisibility(); } catch (_) {}
  }
  if (typeof stylizeAdvanceButtonInPlace === "function") {
    try { stylizeAdvanceButtonInPlace(); } catch (_) {}
  }
  if (typeof stylizeAbandonButtonPremium === "function") {
    try { stylizeAbandonButtonPremium(); } catch (_) {}
  }
}

window.addEventListener("DOMContentLoaded", syncAdvanceAndAbandonButtonsSafe);
window.addEventListener("load", syncAdvanceAndAbandonButtonsSafe);
setTimeout(syncAdvanceAndAbandonButtonsSafe, 0);
setTimeout(syncAdvanceAndAbandonButtonsSafe, 200);
setTimeout(syncAdvanceAndAbandonButtonsSafe, 800);
setInterval(syncAdvanceAndAbandonButtonsSafe, 250);


function mountAbandonButtonBottomLeft(){
  if (!btnAbandon || !document.body) return;

  let dock = document.getElementById("abandonDock");
  if (!dock){
    dock = document.createElement("div");
    dock.id = "abandonDock";
    document.body.appendChild(dock);
  }

  if (btnAbandon.parentElement !== dock){
    dock.appendChild(btnAbandon);
  }

  const label = (I18N?.[lang]?.abandon) || "Abandonner";
  btnAbandon.setAttribute("aria-label", label);
  btnAbandon.title = "Supprimer les mises";
}

function syncAbandonDockVisibility(){
  if (!btnAbandon) return;
  mountAbandonButtonBottomLeft();

  const dock = document.getElementById("abandonDock");
  if (!dock) return;

  const visible = canUseAbandon();
  dock.classList.toggle("show-abandon-dock", visible);
  btnAbandon.classList.toggle("show-abandon", visible);
}


function syncAdvanceUnlockState(){
 if (phase === "pre") {
  advanceUnlockedForRound = getPreflopCommittedBetTotal() > 0;
 }
 refreshActionButtons();
}

window.addEventListener("DOMContentLoaded", syncAdvanceUnlockState);
window.addEventListener("load", syncAdvanceUnlockState);
setTimeout(syncAdvanceUnlockState, 0);
setTimeout(syncAdvanceUnlockState, 150);
setTimeout(syncAdvanceUnlockState, 600);
setInterval(syncAdvanceUnlockState, 250);


function stylizeAbandonButtonPremium(){
  if (!btnAbandon) return;

  const label = (I18N?.[lang]?.abandon) || "Abandonner";
  const wanted = '<span class="abandon-icon">↩</span><span class="abandon-label">' + label + '</span>';

  if (btnAbandon.innerHTML !== wanted){
    btnAbandon.innerHTML = wanted;
  }

  btnAbandon.setAttribute("aria-label", label);
  btnAbandon.title = "Supprimer les mises";
}

window.addEventListener("DOMContentLoaded", stylizeAbandonButtonPremium);
window.addEventListener("load", stylizeAbandonButtonPremium);
setTimeout(stylizeAbandonButtonPremium, 0);
setTimeout(stylizeAbandonButtonPremium, 200);
setTimeout(stylizeAbandonButtonPremium, 800);
setInterval(stylizeAbandonButtonPremium, 500);



/* === SERVER AUTHORITY PATCH : deal + streets + winner === */


function syncHeaderTestButton(){
  const journalBtn = document.getElementById("toggleLogBtn");
  const testBtn = document.getElementById("extremeCasesToggleBtn");
  if (!journalBtn || !testBtn || !journalBtn.parentElement) return;

  const isGame = document.body && document.body.classList.contains("gameplay-screen");
  testBtn.style.display = isGame ? "inline-flex" : "none";
  testBtn.style.position = "absolute";
  testBtn.style.top = "12px";
  testBtn.style.right = "64px";
  testBtn.style.transform = "none";
  testBtn.style.zIndex = "2100";
  testBtn.style.pointerEvents = isGame ? "auto" : "none";
  testBtn.style.height = "42px";
  testBtn.style.alignItems = "center";
  testBtn.style.whiteSpace = "nowrap";
  if (testBtn.parentElement !== journalBtn.parentElement) {
    journalBtn.parentElement.insertBefore(testBtn, journalBtn.nextSibling);
  }
}
window.addEventListener("load", syncHeaderTestButton);
window.addEventListener("resize", syncHeaderTestButton);
setTimeout(syncHeaderTestButton, 300);
setTimeout(syncHeaderTestButton, 1200);


/* === v15.20 FIX : validation des mises toujours accessible pendant la manche === */
function ensureAdvanceDockUsable(){
  try{
    if (!document.body || !btnAdvance) return;
    const splashVisible = !!(splashScreen && !splashScreen.classList.contains("hidden"));
    const setupVisible = !!(roundSetupOverlay && !roundSetupOverlay.classList.contains("hidden"));
    const gameplayVisible = !splashVisible && !setupVisible && !roundFinished;
    const dock = document.getElementById("advanceDock");

    if (dock){
      dock.style.display = gameplayVisible ? "flex" : "none";
      dock.style.visibility = gameplayVisible ? "visible" : "hidden";
      dock.style.opacity = gameplayVisible ? "1" : "0";
      dock.style.pointerEvents = gameplayVisible ? "auto" : "none";
    }

    btnAdvance.style.display = gameplayVisible ? "inline-flex" : "none";
    btnAdvance.style.visibility = gameplayVisible ? "visible" : "hidden";
    btnAdvance.style.opacity = gameplayVisible ? "1" : "0";
    btnAdvance.style.pointerEvents = (!btnAdvance.disabled && gameplayVisible) ? "auto" : "none";
  }catch(e){}
}

window.addEventListener("DOMContentLoaded", ensureAdvanceDockUsable);
window.addEventListener("load", ensureAdvanceDockUsable);
window.addEventListener("resize", ensureAdvanceDockUsable);
setTimeout(ensureAdvanceDockUsable, 0);
setTimeout(ensureAdvanceDockUsable, 200);
setTimeout(ensureAdvanceDockUsable, 800);
setInterval(ensureAdvanceDockUsable, 150);
/* === FIN FIX VALIDATION === */
