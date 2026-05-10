// ==================================================
// ODDS / JACKPOTS
// ==================================================


const JACKPOT_HEAT_STEP = {
 argent: 1 / 800,
 or: 1 / 26500,
 diamant: 1 / 210000
};

const jackpotHeatState = {
 argent: 0,
 or: 0,
 diamant: 0
};

function updateJackpotHeatBars() {
 for (const type of JACKPOT_TYPES) {
  const fill = document.getElementById(`${type}HeatFill`);
  if (!fill) continue;
  const pct = Math.max(0, Math.min(1, jackpotHeatState[type] || 0));
  fill.style.width = "100%";
  fill.style.setProperty("--heat-progress", `${pct * 100}%`);
 }
}

function advanceJackpotHeat(type) {
 if (!(type in jackpotHeatState)) return;
 jackpotHeatState[type] = Math.min(1, jackpotHeatState[type] + (JACKPOT_HEAT_STEP[type] || 0));
 updateJackpotHeatBars();
}

function normalizeJackpotHeatType(type) {
 const normalized = String(type || "").toLowerCase().trim();
 if (normalized === "silver") return "argent";
 if (normalized === "gold") return "or";
 if (normalized === "diamond") return "diamant";
 return normalized;
}

function resetJackpotHeat(type) {
 const normalizedType = normalizeJackpotHeatType(type);
 if (!(normalizedType in jackpotHeatState)) return;
 jackpotHeatState[normalizedType] = 0;
 updateJackpotHeatBars();
}

function resetJackpotHeatOnWin(type) {
 // Règle validée : dès qu'un jackpot est gagné,
 // le curseur de chaleur associé repart immédiatement à 0.
 resetJackpotHeat(type);
}


function setJackpotHeatForTest(percent = 0.9) {
 const pct = Math.max(0, Math.min(1, Number(percent)));
 for (const type of JACKPOT_TYPES) {
  if (type in jackpotHeatState) jackpotHeatState[type] = pct;
 }
 updateJackpotHeatBars();
}


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
 // Règle validée Corsica Poker : une seule mise de 1 est autorisée
 // par jackpot ET par main/cible.
 // Exemple : Argent main 1 bloque seulement Argent main 1.
 // Argent main 2, Or main 1 et Diamant main 1 restent jouables si éligibles.
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
 // Ne masquer/verrouiller que l'offre déjà jouée sur cette même cible.
 // Les autres mains éligibles au même jackpot doivent rester disponibles.
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
  log(`${jackpotPotLabel(type)} ${lang === 'fr' ? 'déjà misé pour cette manche' : 'already bet for this round'}`);
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
 advanceJackpotHeat(type);

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



/* ── JACKPOT WIN OVERLAY ─────────────────────────────────────── */
(function() {

  const JP_THEME = {
    argent:  { label:'JACKPOT ARGENT',  c1:'#f0f2ff', c2:'#8090b8', glow:'#c8d4ff', bg:'rgba(10,12,24,.97)', colors:['#fff','#c8d4ff','#e0e8ff','#a0b0e0','#f0f4ff'], duration:15000 },
    or:      { label:'JACKPOT OR',      c1:'#f6d36b', c2:'#b07010', glow:'#f6c030', bg:'rgba(10,6,0,.97)',   colors:['#f6d36b','#ffec9a','#d4a820','#fff8c0','#ffc040'], duration:30000 },
    diamant: { label:'JACKPOT DIAMANT', c1:'#88eeff', c2:'#1880c0', glow:'#60ddff', bg:'rgba(0,6,18,.97)',   colors:['#80e8ff','#ffffff','#40c8f0','#c0f8ff','#2090d0'], duration:60000 },
  };

  const COLOR_FAMILIES = [
    ['#ff2020','#ff4040','#ff6060','#cc1010','#ff8080'],
    ['#ff7700','#ff9900','#ffaa22','#dd6600','#ffbb55'],
    ['#ffdd00','#ffee33','#ffe800','#ccbb00','#fff066'],
    ['#22cc22','#44ee44','#33dd33','#118811','#66ff66'],
    ['#2288ff','#44aaff','#1166dd','#66ccff','#0055cc'],
    ['#8833ff','#aa55ff','#6611dd','#cc88ff','#9944ee'],
    ['#ff22aa','#ff55cc','#dd1188','#ff88dd','#ee33bb'],
    ['#00cccc','#22eeee','#009999','#44ffff','#0088aa'],
  ];

  function rndGold() {
    const g = ['#f6d36b','#ffe08a','#ffd040','#fff0a0','#c8960a'];
    return g[Math.floor(Math.random()*g.length)];
  }

  function playEntryBoom(ctx, intensity) {
    if (!ctx) return;
    const t = ctx.currentTime, amp = intensity || 1;
    const sub = ctx.createOscillator(), subG = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(55, t);
    sub.frequency.exponentialRampToValueAtTime(28, t+0.35);
    subG.gain.setValueAtTime(0.0001, t);
    subG.gain.exponentialRampToValueAtTime(0.55*amp, t+0.02);
    subG.gain.exponentialRampToValueAtTime(0.0001, t+0.40);
    sub.connect(subG); subG.connect(ctx.destination);
    sub.start(t); sub.stop(t+0.42);
    const len = Math.floor(ctx.sampleRate*0.18), nb = ctx.createBuffer(1,len,ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i=0;i<len;i++) nd[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.4);
    const ns = ctx.createBufferSource(); ns.buffer = nb;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.30*amp, t); ng.gain.exponentialRampToValueAtTime(0.0001, t+0.18);
    const hpf = ctx.createBiquadFilter(); hpf.type='highpass'; hpf.frequency.value=180;
    ns.connect(hpf); hpf.connect(ng); ng.connect(ctx.destination);
    ns.start(t); ns.stop(t+0.20);
  }

  function playFanfare(ctx, type) {
    if (!ctx) return;
    const t = ctx.currentTime+0.12, master = ctx.createGain();
    master.gain.setValueAtTime(0.28, t); master.connect(ctx.destination);
    const scales = {
      argent:[392,494,587,740,880],
      or:[440,554,659,880,1108,659,880,1108],
      diamant:[523,659,784,1047,1319,784,1047,1319,1568,1319,1047,1319],
    };
    (scales[type]||scales.or).forEach((freq,i) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = i%2===0?'triangle':'sine';
      osc.frequency.setValueAtTime(freq, t+i*0.10);
      g.gain.setValueAtTime(0.0001, t+i*0.10);
      g.gain.exponentialRampToValueAtTime(0.15, t+i*0.10+0.035);
      g.gain.exponentialRampToValueAtTime(0.0001, t+i*0.10+0.28);
      osc.connect(g); g.connect(master);
      osc.start(t+i*0.10); osc.stop(t+i*0.10+0.30);
    });
  }

  function playBang(ctx, intensity) {
    if (!ctx) return;
    try {
      const t = ctx.currentTime, amp = Math.max(0.06, Math.min(0.50, intensity)), dur = 0.07+intensity*0.11;
      const len = Math.floor(ctx.sampleRate*(dur+0.06)), buf = ctx.createBuffer(1,len,ctx.sampleRate), d = buf.getChannelData(0);
      for (let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.6);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const dist = ctx.createWaveShaper(), k = 60*amp, cv = new Float32Array(256);
      for (let i=0;i<256;i++){const x=(i*2)/256-1; cv[i]=((Math.PI+k)*x)/(Math.PI+k*Math.abs(x));}
      dist.curve=cv;
      const hpf = ctx.createBiquadFilter(); hpf.type='highpass'; hpf.frequency.value=220+intensity*280;
      const g = ctx.createGain();
      g.gain.setValueAtTime(amp,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur+0.05);
      src.connect(dist); dist.connect(hpf); hpf.connect(g); g.connect(ctx.destination);
      src.start(t); src.stop(t+dur+0.07);
    } catch(e){ console.warn('[jackpot] bang error:', e); }
  }

  function launchFireworks(canvas, durationMs, audioCtx) {
    const ctx2d = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = [], coins = [];
    let running = true;

    function burst(x, y, count) {
      const n = count||75, intensity = 0.12+(1-y/canvas.height)*0.62;
      playBang(audioCtx, intensity);
      const family = COLOR_FAMILIES[Math.floor(Math.random()*COLOR_FAMILIES.length)];
      for (let i=0;i<n;i++){
        const angle=(Math.PI*2*i)/n+(Math.random()-.5)*0.55, speed=2+Math.random()*6.5;
        const isCore=i<4;
        particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-2.2,
          color:isCore?'#ffffff':family[Math.floor(Math.random()*family.length)],
          alpha:1,size:isCore?3.8:1.8+Math.random()*2.8,decay:0.009+Math.random()*0.012,
          gravity:0.052+Math.random()*0.045,trail:[],twinkle:Math.random()<0.28});
      }
    }

    function coinGeyser() {
      const n=18+Math.floor(Math.random()*14);
      for (let i=0;i<n;i++){
        coins.push({x:canvas.width*(0.3+Math.random()*0.4),y:canvas.height+10,
          vx:(Math.random()-.5)*5,vy:-(8+Math.random()*10),rot:Math.random()*Math.PI*2,
          rotV:(Math.random()-.5)*0.25,color:rndGold(),alpha:1,size:7+Math.random()*7,
          decay:0.014+Math.random()*0.010,gravity:0.18+Math.random()*0.08});
      }
    }

    const schedule=[];
    for (let i=0;i<999;i++) schedule.push({time:performance.now()+250+i*680+Math.random()*350,big:i%3===0});
    for (let i=0;i<4;i++) schedule.unshift({time:performance.now()+i*180,big:true});
    const coinSchedule=[];
    for (let i=0;i<999;i++) coinSchedule.push(performance.now()+500+i*2200+Math.random()*800);

    function frame(now){
      if(!running) return;
      ctx2d.fillStyle='rgba(0,0,0,0.15)'; ctx2d.fillRect(0,0,canvas.width,canvas.height);
      while(schedule.length&&schedule[0].time<=now){
        const s=schedule.shift(), x=canvas.width*(0.10+Math.random()*0.80), y=canvas.height*(0.05+Math.random()*0.55);
        burst(x,y,s.big?130:75);
      }
      while(coinSchedule.length&&coinSchedule[0]<=now){ coinSchedule.shift(); coinGeyser(); }
      for(let i=particles.length-1;i>=0;i--){
        const p=particles[i];
        p.trail.push({x:p.x,y:p.y}); if(p.trail.length>7) p.trail.shift();
        p.x+=p.vx; p.y+=p.vy; p.vy+=p.gravity; p.vx*=0.982; p.alpha-=p.decay;
        if(p.alpha<=0.015){particles.splice(i,1);continue;}
        for(let ti=0;ti<p.trail.length;ti++){
          ctx2d.beginPath(); ctx2d.arc(p.trail[ti].x,p.trail[ti].y,p.size*0.40,0,Math.PI*2);
          ctx2d.fillStyle=p.color; ctx2d.globalAlpha=(ti/p.trail.length)*p.alpha*0.32; ctx2d.fill();
        }
        const da=p.twinkle?p.alpha*(0.55+0.45*Math.sin(now*0.016+p.x)):p.alpha;
        ctx2d.beginPath(); ctx2d.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx2d.fillStyle=p.color; ctx2d.globalAlpha=da; ctx2d.fill();
        ctx2d.globalAlpha=1;
      }
      for(let i=coins.length-1;i>=0;i--){
        const c=coins[i];
        c.x+=c.vx; c.y+=c.vy; c.vy+=c.gravity; c.vx*=0.99; c.rot+=c.rotV; c.alpha-=c.decay;
        if(c.alpha<=0.02||c.y>canvas.height+20){coins.splice(i,1);continue;}
        ctx2d.save(); ctx2d.globalAlpha=c.alpha; ctx2d.translate(c.x,c.y); ctx2d.rotate(c.rot);
        ctx2d.scale(Math.max(0.08,Math.abs(Math.cos(c.rot))),1);
        ctx2d.beginPath(); ctx2d.ellipse(0,0,c.size,c.size*0.85,0,0,Math.PI*2);
        const grad=ctx2d.createRadialGradient(-c.size*.3,-c.size*.3,0,0,0,c.size);
        grad.addColorStop(0,'#fff8d0'); grad.addColorStop(0.4,c.color); grad.addColorStop(1,'#8a6000');
        ctx2d.fillStyle=grad; ctx2d.fill();
        ctx2d.strokeStyle='rgba(80,50,0,0.55)'; ctx2d.lineWidth=0.8; ctx2d.stroke();
        ctx2d.restore();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return () => { running=false; ctx2d.clearRect(0,0,canvas.width,canvas.height); };
  }

  window.triggerJackpotWinOverlay = function(jackpots, normalPaid, winCards, winBoard) {
    if (!jackpots||!jackpots.length) return;
    const allColors = jackpots.flatMap(j=>(JP_THEME[j.type]||JP_THEME.or).colors);

    let jpAudioCtx = null;
    try {
      jpAudioCtx = (window.AudioContext||window.webkitAudioContext)
        ? new (window.AudioContext||window.webkitAudioContext)() : null;
    } catch(e){ console.warn('[jackpot] audio:', e); }
    if (jpAudioCtx) {
      playEntryBoom(jpAudioCtx, 0.6+jackpots.length*0.25);
      const bigType = [...jackpots].sort((a,b)=>(JP_THEME[b.type]||JP_THEME.or).duration-(JP_THEME[a.type]||JP_THEME.or).duration)[0].type;
      setTimeout(()=>playFanfare(jpAudioCtx, bigType), 180);
    }

    const overlay = document.createElement('div');
    overlay.className = 'jp-win-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:all;overflow:hidden;display:flex;align-items:center;justify-content:center;';
    if (jackpots.length > 1) {
      overlay.style.background = 'rgba(4,4,12,.97)';
    } else {
      overlay.style.background = (JP_THEME[jackpots[0].type]||JP_THEME.or).bg;
    }

    const canvas = document.createElement('canvas');
    canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    overlay.appendChild(canvas);

    const cardsHtml = jackpots.map(j=>{
      const th=JP_THEME[j.type]||JP_THEME.or;
      return '<div class="jp-card" style="--jp-c1:'+th.c1+';--jp-c2:'+th.c2+';--jp-glow:'+th.glow+';">'
        +'<div class="jp-card-icon">&#9824;</div>'
        +'<div class="jp-card-label">'+th.label+'</div>'
        +'<div class="jp-card-amount">+'+j.paid.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+'</div>'
        +'</div>';
    }).join('');

    const normalHtml = (normalPaid&&normalPaid>0)
      ? '<div class="jp-normal-win">GAIN : +'+normalPaid.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+'</div>' : '';

    const totalGain = jackpots.reduce((s,j)=>s+j.paid,0)+(normalPaid||0);
    const totalHtml = '<div class="jp-total-gain">TOTAL : +'+totalGain.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+'</div>';

    const firstTheme = JP_THEME[jackpots[0].type]||JP_THEME.or;
    // Affichage des cartes gagnantes (2 cartes de la main + board)
    // Cartes : couche fixe indépendante sur le body (z-index max)
    let cardLayer = null;
    if (Array.isArray(winCards) && winCards.length >= 2) {
      const mc = (d) => {
        const el = document.createElement('div');
        el.style.cssText = 'width:44px;height:62px;background:#fff;border-radius:7px;'
          +'display:inline-flex;flex-direction:column;align-items:center;justify-content:center;'
          +'font-weight:900;color:'+(d.red?'#cc2233':'#111827')+';'
          +'box-shadow:0 4px 14px rgba(0,0,0,.9);flex-shrink:0;gap:2px;';
        el.innerHTML = '<span style="font-size:14px;line-height:1.1;">'+d.rank+'</span>'
          +'<span style="font-size:18px;line-height:1;">'+d.suit+'</span>';
        return el;
      };
      const sep = document.createElement('span');
      sep.style.cssText = 'color:rgba(255,255,255,.4);font-size:18px;padding:0 6px;align-self:center;';
      sep.textContent = '|';
      cardLayer = document.createElement('div');
      cardLayer.style.cssText = 'position:fixed;top:50px;left:50%;transform:translateX(-50%);'
        +'z-index:999999;display:flex;align-items:center;gap:6px;pointer-events:none;'
        +'background:rgba(0,0,0,.50);padding:10px 18px;border-radius:12px;'
        +'box-shadow:0 4px 24px rgba(0,0,0,.85);';
      winCards.slice(0,2).forEach(d => cardLayer.appendChild(mc(d)));
      cardLayer.appendChild(sep);
      (winBoard||[]).forEach(d => cardLayer.appendChild(mc(d)));
      document.body.appendChild(cardLayer);
    }
    let handCardsHtml = '';

    const content = document.createElement('div');
    content.className = 'jp-win-content';
    content.style.cssText = 'max-height:92vh;overflow-y:auto;overflow-x:hidden;';
    content.innerHTML = '<div class="jp-win-sub">FELICITATIONS</div>'
      +'<div class="jp-cards-row">'+cardsHtml+'</div>'
      +normalHtml+totalHtml
      +'<button class="jp-win-btn" style="--jp-c1:'+firstTheme.c1+';--jp-glow:'+firstTheme.glow+';">ENCAISSER</button>';
    overlay.appendChild(content);

    document.body.appendChild(overlay);
    const stopFW = launchFireworks(canvas, 0, jpAudioCtx);
    content.querySelector('.jp-win-btn').addEventListener('click', function() {
      stopFW();
      if (cardLayer) cardLayer.remove();
      overlay.classList.add('jp-win-exit');
      setTimeout(()=>overlay.remove(), 650);
    });
  };

})();
/* ── END JACKPOT WIN OVERLAY ─────────────────────────────────── */

function applyServerJackpotPayouts(jackpotPayouts = [], normalPaid = 0) {
 const wonJackpots = [];
 for (const payout of jackpotPayouts) {
  const type = normalizeJackpotHeatType(payout?.tier || payout?.type || payout?.jackpotType);
  const paid = Number(payout?.paid || 0);
  const targetKind = payout?.targetKind;
  const targetIndex = Number(payout?.targetIndex);
  const sourceNode = targetKind === 'tie'
   ? document.getElementById('tieBox')
   : (handsLayer ? handsLayer.children[targetIndex]?.querySelector('.hand-inner') : null);

  if (paid > 0) {
   launchWinCoinBurst(sourceNode, paid);
   updateBankroll(paid);
   addToTotalWins(paid, "jackpots");
   triggerWinEffects(paid);
   updateTotalWinsDisplay();
  }

  if (type && paid > 0) {
   resetJackpotHeatOnWin(type);
   log(`🏆 ${I18N[lang].jackpotWon}: ${jackpotPotLabel(type)} +${paid.toFixed(2)}`);
   wonJackpots.push({ type, paid });
  }
 }

 if (wonJackpots.length > 0 && typeof window.triggerJackpotWinOverlay === "function") {
  let winCards = null;
  let winBoard = null;

  // Board via CorsicaState ou global
  try {
   const b = (typeof CorsicaState !== 'undefined' && Array.isArray(CorsicaState.board))
    ? CorsicaState.board
    : (typeof board !== 'undefined' && Array.isArray(board) ? board : null);
   if (b && b.length > 0) winBoard = b;
  } catch(e) {}

  // Main gagnante via lastWinningTargets ou jackpotPayouts
  try {
   const targets = (typeof lastWinningTargets !== 'undefined' && Array.isArray(lastWinningTargets))
    ? lastWinningTargets : [];
   const solo = targets.find(t => t.targetKind === 'hand');
   const idx = solo ? solo.targetIndex
    : (jackpotPayouts.find(p => p?.targetKind === 'hand')?.targetIndex ?? -1);
   if (idx >= 0 && Array.isArray(hands) && hands[idx]?.cards) {
    winCards = hands[idx].cards;
   }
  } catch(e) {}

  // Pré-calculer rank+suit+couleur — pas d'images externes
  const _toCardData = (c) => {
   if (!c || c.r == null || !c.s) return null;
   const rmap = {14:'A',13:'K',12:'Q',11:'J',10:'10',9:'9',8:'8',7:'7',6:'6',5:'5',4:'4',3:'3',2:'2'};
   const smap = {S:'♠',H:'♥',D:'♦',C:'♣'};
   return { rank: rmap[c.r]||String(c.r), suit: smap[c.s]||c.s, red: c.s==='H'||c.s==='D' };
  };
  const winCardData = winCards ? winCards.map(_toCardData).filter(Boolean) : null;
  const winBoardData = winBoard ? winBoard.map(_toCardData).filter(Boolean) : null;
  console.log('[JP] cartes:', winCardData, 'board:', winBoardData);
  window.triggerJackpotWinOverlay(wonJackpots, normalPaid, winCardData, winBoardData);
 }

 resetJackpotRound("jackpots");
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

