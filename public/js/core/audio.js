// ==================================================
// AUDIO
// ==================================================

const MAIN_AUDIO_TRACKS = {
  0: ["/audio/audio_1_jazz.mp3", "/external-audio/audio_1_jazz.mp3"],
  1: ["/audio/audio_2_jazz.mp3", "/external-audio/audio_2_jazz.mp3"],
  2: ["/audio/audio_3_beats.mp3", "/external-audio/audio_3_beats.mp3"],
  3: ["/audio/audio_4_rnb.mp3", "/external-audio/audio_4_rnb.mp3"],
  4: ["/audio/audio_5_relax.mp3", "/external-audio/audio_5_relax.mp3"]
};

const CASINO_AUDIO_TRACKS = ["/audio/audio_6_casino.mp3", "/external-audio/audio_6_casino.mp3"];
const AUDIO_FALLBACK_TRACKS = ["/audio/audio_1_jazz.mp3", "/external-audio/audio_1_jazz.mp3"];

function assetExists(url) {
 return fetch(url, { method: "HEAD", cache: "no-store" })
  .then((response) => response.ok)
  .catch(() => false);
}

async function resolvePlayableFromList(candidates) {
 const list = Array.isArray(candidates) ? candidates : [candidates];
 for (const candidate of list) {
  if (!candidate) continue;
  if (await assetExists(candidate)) return candidate;
 }
 return null;
}

async function resolvePlayableTrack(styleIndex) {
 const normalized = Number.isFinite(Number(styleIndex)) ? Number(styleIndex) : 0;
 const candidates = MAIN_AUDIO_TRACKS[normalized] || MAIN_AUDIO_TRACKS[0] || AUDIO_FALLBACK_TRACKS;
 return (await resolvePlayableFromList(candidates)) || AUDIO_FALLBACK_TRACKS[0];
}

let pendingMainTrackToken = 0;

async function setMainTrackSource(styleIndex) {
 if (!sndAmbience) return;
 const requestToken = ++pendingMainTrackToken;
 const nextSrc = await resolvePlayableTrack(styleIndex);
 if (requestToken !== pendingMainTrackToken) return;

 const currentSrc = sndAmbience.getAttribute("src") || "";
 if (currentSrc === nextSrc) return;

 const shouldResume = ambienceStarted && soundEnabled && Number(ambienceVolume) > 0;
 sndAmbience.pause();
 sndAmbience.setAttribute("src", nextSrc);
 sndAmbience.load();
 if (shouldResume) {
  sndAmbience.play().catch(() => {});
 }
}

function ensureCasinoTrackSource() {
 if (!sndCasino) return;
 resolvePlayableFromList(CASINO_AUDIO_TRACKS).then((resolvedSrc) => {
  const nextSrc = resolvedSrc || CASINO_AUDIO_TRACKS[0];
  const currentSrc = sndCasino.getAttribute("src") || "";
  if (currentSrc !== nextSrc) {
   sndCasino.setAttribute("src", nextSrc);
   sndCasino.load();
  }
 });
}

function getTargetAmbienceVolumes() {
 const ambienceLevel = soundEnabled ? ambienceVolume : 0;
 const mainVolume = ambienceLevel * 0.3;
 const casinoVolume = (casinoLayerEnabled && ambienceLevel > 0) ? ambienceLevel * 0.28 : 0;
 return {
  ambience: mainVolume,
  casino: casinoVolume
 };
}

function setAmbienceVolumes(ambienceVol, casinoVol) {
 if (sndAmbience) sndAmbience.volume = Math.max(0, Math.min(1, ambienceVol));
 if (sndCasino) sndCasino.volume = Math.max(0, Math.min(1, casinoVol));
}

function stopAmbienceFade() {
 if (ambienceFadeFrame) {
  cancelAnimationFrame(ambienceFadeFrame);
  ambienceFadeFrame = null;
 }
}

function fadeAmbienceToTargets(durationMs = 1800) {
 stopAmbienceFade();

 const startAmbienceVol = sndAmbience ? sndAmbience.volume : 0;
 const startCasinoVol = sndCasino ? sndCasino.volume : 0;
 const target = getTargetAmbienceVolumes();
 const start = performance.now();

 const tick = (now) => {
  const progress = durationMs <= 0 ? 1 : Math.min(1, (now - start) / durationMs);
  const eased = 1 - Math.pow(1 - progress, 3);

  const ambienceVol = startAmbienceVol + ((target.ambience - startAmbienceVol) * eased);
  const casinoVol = startCasinoVol + ((target.casino - startCasinoVol) * eased);
  setAmbienceVolumes(ambienceVol, casinoVol);

  if (progress < 1) {
   ambienceFadeFrame = requestAnimationFrame(tick);
  } else {
   ambienceFadeFrame = null;
   setAmbienceVolumes(target.ambience, target.casino);
  }
 };

 ambienceFadeFrame = requestAnimationFrame(tick);
}

function updateAudioStyleUI() {
 const audioButtons = document.querySelectorAll(".settings-audio-btn");
 audioButtons.forEach((btn) => {
  const styleIndex = Number(btn.dataset.audioStyle);
  const isCasinoBtn = styleIndex === 5;
  const isActive = isCasinoBtn
   ? !!casinoLayerEnabled
   : styleIndex === Number(currentAudioStyle || 0);
  btn.classList.toggle("active", isActive);
  btn.setAttribute("aria-pressed", isActive ? "true" : "false");
 });
}

function applyAudioStyle(styleIndex) {
 const normalized = Number.isFinite(Number(styleIndex)) ? Number(styleIndex) : 0;
 currentAudioStyle = Math.max(0, Math.min(4, normalized));
 setMainTrackSource(currentAudioStyle);
 updateAudioStyleUI();
 saveSettings();
}

function toggleCasinoLayer() {
 casinoLayerEnabled = !casinoLayerEnabled;
 ensureCasinoTrackSource();

 if (ambienceStarted && soundEnabled && Number(ambienceVolume) > 0 && casinoLayerEnabled && sndCasino) {
  sndCasino.play().catch(() => {});
 }

 if (ambienceStarted) {
  fadeAmbienceToTargets(casinoLayerEnabled ? 450 : 250);
 } else {
  const target = getTargetAmbienceVolumes();
  setAmbienceVolumes(target.ambience, target.casino);
 }

 updateAudioStyleUI();
 saveSettings();
}

function applySoundState() {
 const target = getTargetAmbienceVolumes();

 if (ambienceStarted) {
  fadeAmbienceToTargets(soundEnabled ? 600 : 250);
 } else {
  setAmbienceVolumes(target.ambience, target.casino);
 }

 if (btnSound) {
  btnSound.textContent = soundEnabled ? "🔊" : "🔇";
  btnSound.classList.toggle("active", soundEnabled);
 }

 if (volumeSlider) {
  volumeSlider.value = String(ambienceVolume);
 }

 if (settingsMutedIcon) {
  settingsMutedIcon.classList.toggle("is-muted", !soundEnabled || Number(ambienceVolume) <= 0);
  settingsMutedIcon.setAttribute("aria-label", !soundEnabled || Number(ambienceVolume) <= 0 ? "Son coupé" : "Son actif");
 }

 updateAudioStyleUI();
 saveSettings();
}

function startAmbience() {
 if (ambienceStarted) return;
 ambienceStarted = true;

 ensureCasinoTrackSource();
 setMainTrackSource(currentAudioStyle);
 setAmbienceVolumes(0, 0);

 if (sndAmbience) {
  sndAmbience.loop = true;
  sndAmbience.play().catch(() => {});
 }

 if (sndCasino) {
  sndCasino.loop = true;
  sndCasino.play().catch(() => {});
 }

 applySoundState();
 fadeAmbienceToTargets(2200);
}

function playSound(a) {
 if (!a || !soundEnabled) return;
 try {
  a.currentTime = 0;
  if (a === sndDeal) a.volume = 0.30;
  else if (a === sndCard) a.volume = 0.22;
  else a.volume = 0.25;
  a.play().catch(() => {});
 } catch (_) {}
}
