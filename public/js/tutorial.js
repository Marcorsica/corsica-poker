'use strict';
const TUTORIAL_KEY='corsicaPokerTutorial';
let tutoStep=-1,tutoActive=false,bubbleEl=null,badgeEl=null,pollTimer=null;
let arrowEls=[],rafId=null;
var cachedDynTargets=null;
var jpCallWatcher=null,jpBubbleDismissed=false,jpBubbleManuallyMoved=false;
var blockOverlayEl=null,jpBlockOverlayEl=null,loadingOverlayEl=null;
var fixedDealApplied=false;

// ── Partie fixe pré-codée (9 mains, main 8 = jackpot éligible) ───────
var FIXED_HANDS=[
  [{r:14,s:'S'},{r:14,s:'H'}], // AA
  [{r:13,s:'C'},{r:13,s:'D'}], // KK
  [{r:12,s:'S'},{r:12,s:'H'}], // QQ
  [{r:11,s:'C'},{r:11,s:'D'}], // JJ
  [{r:10,s:'S'},{r:10,s:'H'}], // TT
  [{r:9,s:'C'},{r:9,s:'D'}],   // 99
  [{r:8,s:'C'},{r:8,s:'D'}],   // 88
  [{r:5,s:'S'},{r:5,s:'H'}],   // 55
  [{r:7,s:'C'},{r:2,s:'D'}]    // 72o → jackpot éligible
];
var FIXED_BOARD=[{r:3,s:'H'},{r:6,s:'S'},{r:13,s:'H'},{r:4,s:'C'},{r:9,s:'H'}];

function applyFixedDeal(){
  // La distribution fixe est maintenant appliquée côté serveur (/start?discovery=1).
  // Ne jamais modifier les cartes côté client : sinon les cartes affichées et les cotes serveur divergent.
  fixedDealApplied=true;
  return;
}

// ── Démonstration forcée des cotes en mode découverte ────────────────
// Objectif validé : au lancement du mode découverte, montrer toujours :
// - une cote dorée supérieure à 100 ;
// - une main éligible au jackpot.
// Cette surcharge reste limitée au mode tutoriel et ne touche jamais le mode réel.
function enforceDiscoveryDemoOdds(){
  // Les cotes du mode découverte ne sont plus forcées côté interface.
  // Elles viennent du serveur après calcul exact sur la configuration fixe.
  return;
}

function startDiscoveryDemoOddsWatch(){
  var tries=0;
  var w=setInterval(function(){
    tries++;
    if(!tutoActive||tries>40){clearInterval(w);return;}
    enforceDiscoveryDemoOdds();
  },150);
}

// ── Textes FR/EN ─────────────────────────────────────────────────────
var T={
  fr:{
    s0t:'👥 Combien de joueurs ?',s0:'Choisissez le nombre de mains, aléatoire ou pas. Pour la découverte, la partie se jouera avec <strong>9 joueurs</strong>. Validez avec la flèche <strong>➜</strong>.',
    s1t:'♠ Les mains et les cotes',s1:'Chaque joueur reçoit 2 cartes. Le nombre au-dessus est la <strong>cote</strong> : plus elle est élevée, plus le gain est important mais le risque aussi. Votre mise sera <strong>multipliée par cette cote</strong> si la main gagne seule. La cote la plus basse clignote en <strong style="color:#ef4444">rouge</strong> (favori), les plus élevées brillent en <strong style="color:#eab308">doré</strong>.',
    s2t:'💰 Choisissez votre mise',s2:'Cliquez sur un jeton (<strong>1, 2, 5, 10 ou 20</strong>) pour sélectionner le montant de votre mise.',
    s3t:'🚫 Abandonner la manche',s3:'Si les cartes ne vous inspirent pas, cliquez ici pour <strong>passer votre tour</strong> et relancer une nouvelle manche.',
    s4t:'👆 Placez votre mise !',s4:'Cliquez sur la case <strong>« Miser »</strong> d\'une main pour y placer votre jeton. Vous pouvez miser sur <strong>plusieurs mains</strong>.',
    jpBubT:'🎰 Tentez le Jackpot !',jpBub:'Cette mention signifie que la main est éligible à un <strong>jackpot</strong>. Misez <strong>1 jeton</strong> sur cette case pour tenter de remporter toute la cagnotte si la main gagne !',
    s5t:'🤝 Case Égalité',s5:'Misez ici si vous pensez que <strong>deux joueurs ou plus</strong> gagneront avec la même combinaison.',
    s6t:'✅ Validez vos mises',s6:'Amusez-vous à miser où vous le souhaitez. Quand vous avez placé tous vos paris, cliquez sur <strong>Valider les mises</strong> pour dévoiler le flop.',
    s7t:'🂠 Le Flop — 3 cartes communes',s7:'Les 3 premières cartes communes sont révélées et de nouvelles cotes apparaissent. Certains joueurs peuvent être éliminés.',
    s8t:'💰 Vous pouvez encore miser !',s8:'Avant la <strong>4ème carte (Turn)</strong>, vous pouvez ajouter de nouvelles mises. Cliquez sur <strong>Valider</strong> quand vous êtes prêt.',
    s9t:'💰 Dernière chance de miser !',s9:'Avant la <strong>5ème et dernière carte (River)</strong>, vous pouvez encore ajuster vos mises. Après, c\'est fini !',
    s10t:'🏆 Résultat de la manche',s10:'La <strong>main gagnante est révélée</strong>. Si vous aviez misé dessus, vous remportez <strong>mise × cote</strong>. Les mains perdantes sont grisées.',
    s11t:'💎 Les Jackpots Progressifs',s11:'Trois jackpots (<strong>Argent, Or, Diamant</strong>) grossissent à chaque manche. Quand <strong>« Tente le Jackpot »</strong> apparaît, misez <strong>1 jeton</strong> pour tenter de remporter toute la cagnotte !',
    s12t:'⚙️ Paramètres',s12:'Changez le <strong>thème visuel</strong>, la <strong>couleur du tapis</strong>, l\'<strong>ambiance sonore</strong>, la <strong>langue</strong>… Tout est personnalisable !',
    s13t:'🔄 Rejouez !',s13:'« <strong>Même table</strong> » relance avec le même nombre de joueurs. « <strong>Changer de table</strong> » vous permet d\'en choisir un autre.',
    s14t:'🎉 Tutoriel terminé !',s14:'Vous connaissez maintenant toutes les bases de <strong>Corsica Poker</strong>. Misez sur les cotes, tentez les jackpots… Bonne chance !',
    ok:'J\'ai compris ➜',finish:'🎉 Commencer à jouer',wait:'⏳ Faites l\'action indiquée…',drag:'☰ Déplacez cette bulle',loading:'🔍 Préparation…',badge:'🎓 MODE DÉCOUVERTE'
  },
  en:{
    s0t:'👥 How many players?',s0:'Choose the number of hands, random or not. For the tutorial, the game will be played with <strong>9 players</strong>. Press the arrow <strong>➜</strong> to start.',
    s1t:'♠ Hands & Odds',s1:'Each player receives 2 cards. The number above is the <strong>odds</strong>: the higher, the bigger the reward but also the risk. Your bet is <strong>multiplied by the odds</strong> if the hand wins. The lowest odds blink in <strong style="color:#ef4444">red</strong> (favorite), the highest glow in <strong style="color:#eab308">gold</strong>.',
    s2t:'💰 Choose your bet',s2:'Click a chip (<strong>1, 2, 5, 10, or 20</strong>) to select your bet amount.',
    s3t:'🚫 Skip this hand',s3:'If the cards don\'t look promising, click here to <strong>skip</strong> and start a new round.',
    s4t:'👆 Place your bet!',s4:'Click the <strong>"Bet"</strong> box on a hand to place your chip. You can bet on <strong>multiple hands</strong>.',
    jpBubT:'🎰 Try the Jackpot!',jpBub:'This label means the hand is eligible for a <strong>jackpot</strong>. Bet <strong>1 chip</strong> on this square to try to win the entire pot if the hand wins!',
    s5t:'🤝 Tie bet',s5:'Bet here if you think <strong>two or more players</strong> will win with the same combination.',
    s6t:'✅ Confirm your bets',s6:'Have fun betting wherever you want. When you have placed all your bets, click <strong>Confirm bets</strong> to reveal the flop.',
    s7t:'🂠 The Flop — 3 community cards',s7:'The first 3 community cards are revealed and new odds appear. Some players may be eliminated.',
    s8t:'💰 You can still bet!',s8:'Before the <strong>4th card (Turn)</strong>, you can add new bets. Click <strong>Confirm</strong> when ready.',
    s9t:'💰 Last chance to bet!',s9:'Before the <strong>5th and final card (River)</strong>, you can still adjust your bets. After that, it\'s over!',
    s10t:'🏆 Round result',s10:'The <strong>winning hand is revealed</strong>. If you bet on it, you win <strong>bet × odds</strong>. Losing hands are grayed out.',
    s11t:'💎 Progressive Jackpots',s11:'Three jackpots (<strong>Silver, Gold, Diamond</strong>) grow each round. When <strong>"Try the Jackpot"</strong> appears, bet <strong>1 chip</strong> to try to win the entire pot!',
    s12t:'⚙️ Settings',s12:'Change the <strong>visual theme</strong>, <strong>table color</strong>, <strong>background music</strong>, <strong>language</strong>… Everything is customizable!',
    s13t:'🔄 Play again!',s13:'<strong>"Same table"</strong> restarts with the same number of players. <strong>"Change table"</strong> lets you pick a different number.',
    s14t:'🎉 Tutorial complete!',s14:'You now know all the basics of <strong>Corsica Poker</strong>. Play the odds, try the jackpots… Good luck!',
    ok:'Got it ➜',finish:'🎉 Start playing',wait:'⏳ Perform the action…',drag:'☰ Drag this bubble',loading:'🔍 Preparing…',badge:'🎓 DISCOVERY MODE'
  }
};
function tx(){return T[typeof lang!=='undefined'?lang:'fr']||T.fr;}

function buildSteps(){var t=tx();return[
  {id:'s0',staticArrows:['btnRandomHands','handsCountSelect','btnManualHands'],title:t.s0t,text:t.s0,pos:'topright',
    onEnter:function(){var s=document.getElementById('handsCountSelect');if(s)s.value='9';},
    waitFor:function(){var el=document.getElementById('roundSetupOverlay');return el&&el.classList.contains('hidden');}},
  {id:'s1',title:t.s1t,text:t.s1,pos:'center',queryTargets:function(){var h=document.querySelectorAll('#handsLayer .hand:not(.hand-elim)');var a=[];for(var i=0;i<h.length&&i<5;i++)a.push(h[i]);return a;},advance:'click',block:true,onEnter:function(){enforceDiscoveryDemoOdds();startDiscoveryDemoOddsWatch();}},
  {id:'s2',staticArrows:['betPanel'],title:t.s2t,text:t.s2,pos:'right',advance:'click',block:true},
  {id:'s3',staticArrows:['btnAbandon'],title:t.s3t,text:t.s3,pos:'aboveabandon',advance:'click',block:true,
    onEnter:function(){document.body.classList.add('tuto-show-abandon');var btn=document.getElementById('btnAbandon');if(btn){btn.style.display='inline-flex';btn.classList.add('show-abandon');btn.disabled=true;btn.style.opacity='0.42';btn.style.pointerEvents='none';}var dock=document.getElementById('abandonDock');if(dock)dock.classList.add('show-abandon-dock');},
    onExit:function(){document.body.classList.remove('tuto-show-abandon');var btn=document.getElementById('btnAbandon');if(btn){btn.style.opacity='';btn.style.pointerEvents='';btn.disabled=true;}var dock=document.getElementById('abandonDock');if(dock)dock.classList.remove('show-abandon-dock');}},
  {id:'jpCall',title:t.jpBubT,text:t.jpBub,pos:'underjackpotcall',advance:'click',block:true,queryTargets:function(){var target=getVisibleJpCallTarget();return target?[target]:[];}},
  {id:'s4',title:t.s4t,text:t.s4,pos:'center',queryTargets:function(){var all=document.querySelectorAll('.sq[data-phase="pre"]:not(.hasBet):not(.disabled)');if(!all.length)return[];return[all[Math.floor(Math.random()*Math.min(all.length,5))]];},queryOnce:true,waitFor:function(){return !!document.querySelector('.sq.hasBet');}},
  {id:'s5',staticArrows:['tieBox'],title:t.s5t,text:t.s5,pos:'left',advance:'click',block:true},
  {id:'s6',staticArrows:['btnAdvance'],title:t.s6t,text:t.s6,pos:'top',waitFor:function(){return typeof phase!=='undefined'&&phase!=='pre';}},
  {id:'s7',title:t.s7t,text:t.s7,pos:'topleft',queryTargets:function(){var c=document.querySelectorAll('#boardCards .card');var a=[];for(var i=0;i<c.length&&i<3;i++){if(c[i].offsetParent!==null)a.push(c[i]);}return a;},advance:'click',block:true},
  {id:'s8',title:t.s8t,text:t.s8,pos:'topleft',queryTargets:function(){var sq=document.querySelector('.sq[data-phase="flop"]:not(.disabled)');return sq?[sq]:[];},waitFor:function(){return typeof phase!=='undefined'&&phase==='turn';}},
  {id:'s9',title:t.s9t,text:t.s9,pos:'topleft',queryTargets:function(){var sq=document.querySelector('.sq[data-phase="turn"]:not(.disabled)');return sq?[sq]:[];},waitFor:function(){return typeof roundFinished!=='undefined'&&roundFinished===true;}},
  {id:'s10',title:t.s10t,text:t.s10,pos:'topleft',queryTargets:function(){var tb=document.querySelector('.tie-box.tie-win');if(tb)return[tb];var w=document.querySelector('#handsLayer .hand.winner');return w?[w]:[];},advance:'click',block:true},
  {id:'s12',staticArrows:['settingsBtn'],title:t.s12t,text:t.s12,pos:'undersettings',advance:'click',block:true,
    onEnter:function(){
      var panel=document.getElementById('settingsPanel');
      if(panel)panel.classList.add('hidden');
    },
    onExit:function(){
      var panel=document.getElementById('settingsPanel');
      if(panel)panel.classList.add('hidden');
    }},
  {id:'s13',staticArrows:['btnSameTable'],title:t.s13t,text:t.s13,pos:'top',advance:'click',block:true},
  {id:'s14',title:t.s14t,text:t.s14,pos:'center',advance:'click',isFinal:true,block:true}
];}
var STEPS=[];

function isTutorialMode(){return tutoActive;}
window.isTutorialMode=isTutorialMode;
function showBlockOverlay(){removeBlockOverlay();blockOverlayEl=document.createElement('div');blockOverlayEl.id='tutoBlockOverlay';document.body.appendChild(blockOverlayEl);}
function removeBlockOverlay(){var el=document.getElementById('tutoBlockOverlay');if(el)el.parentNode.removeChild(el);blockOverlayEl=null;}
function showJpBlockOverlay(){removeJpBlockOverlay();jpBlockOverlayEl=document.createElement('div');jpBlockOverlayEl.id='jpCallBlockOverlay';document.body.appendChild(jpBlockOverlayEl);}
function removeJpBlockOverlay(){var el=document.getElementById('jpCallBlockOverlay');if(el)el.parentNode.removeChild(el);jpBlockOverlayEl=null;}

function activateTutorial(){
  tutoActive=true;tutoStep=-1;jpBubbleDismissed=false;jpBubbleManuallyMoved=false;fixedDealApplied=false;
  STEPS=buildSteps();
  try{sessionStorage.setItem(TUTORIAL_KEY,'1');}catch(e){}
  document.body.classList.add('tutorial-mode','tuto-hide-abandon');
  injectBadge();applyTutorialJackpots();
  var splash=document.getElementById('splashScreen');
  if(splash)splash.classList.add('hidden');
  if(typeof showRoundSetup==='function')showRoundSetup();
  setTimeout(function(){goToStep(0);},600);
  if(pollTimer)clearInterval(pollTimer);
  pollTimer=setInterval(pollWaitFor,350);
  startArrowTracking();
  // Appliquer la partie fixe dès que les mains sont prêtes
  startFixedDealWatch();
  // Désactiver abandonner en découverte (visible mais grisé)
}

function exitTutorial(){
  tutoActive=false;tutoStep=-1;window._tutoRerolling=false;
  try{sessionStorage.removeItem(TUTORIAL_KEY);}catch(e){}
  document.body.classList.remove('tutorial-mode','tuto-rerolling','tuto-hide-abandon','tuto-settings-step');
  removeBubble();removeAllArrows();removeBadge();closeJpBubble();removeJpBlockOverlay();
  var settBtn=document.getElementById('settingsBtn');if(settBtn)settBtn.style.pointerEvents='';
  removeBlockOverlay();stopArrowTracking();
  if(pollTimer){clearInterval(pollTimer);pollTimer=null;}
  if(jpCallWatcher){clearInterval(jpCallWatcher);jpCallWatcher=null;}

  ['argentHeatFill','orHeatFill','diamantHeatFill','splashArgentFill','splashOrFill','splashDiamantFill'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.removeProperty('--heat-progress');});

  if(typeof updateJackpotHeatBars==='function')updateJackpotHeatBars();
  if(typeof updateJackpotDisplays==='function')updateJackpotDisplays();
}

// ── Appliquer la partie fixe après newRound ──────────────────────────
function startFixedDealWatch(){
  var w=setInterval(function(){
    if(!tutoActive){clearInterval(w);return;}
    if(typeof hands!=='undefined'&&hands.length===9&&typeof phase!=='undefined'&&phase==='pre'){
      applyFixedDeal();
      clearInterval(w);
    }
  },300);
}

// ── Forcer 9 joueurs + partie fixe à chaque manche découverte ──────────
(function(){
  var origLaunch=null,origNewRound=null;
  function scheduleFixedDeal(){
    if(!tutoActive)return;
    fixedDealApplied=false;
    setTimeout(function(){startFixedDealWatch();},80);
  }
  function patch(){
    if(typeof launchNewRoundWithCount==='function'&&!origLaunch){
      origLaunch=launchNewRoundWithCount;
      window.launchNewRoundWithCount=function(c){
        if(tutoActive)c=9;
        var r=origLaunch(c);
        if(tutoActive)scheduleFixedDeal();
        return r;
      };
      try{launchNewRoundWithCount=window.launchNewRoundWithCount;}catch(e){}
    }
    if(typeof newRound==='function'&&!origNewRound){
      origNewRound=newRound;
      window.newRound=function(){
        if(tutoActive){currentHandsCount=9;fixedDealApplied=false;}
        var r=origNewRound();
        if(tutoActive)scheduleFixedDeal();
        return r;
      };
      try{newRound=window.newRound;}catch(e){}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){patch();setTimeout(patch,600);});
  else {setTimeout(patch,100);setTimeout(patch,800);}
})();

function applyTutorialJackpots(){
  var base={argent:324.26,or:2654.78,diamant:26314.77};function rnd(v){return(v+Math.random()*v*0.08-v*0.04).toFixed(2);}
  var vals={argent:rnd(base.argent),or:rnd(base.or),diamant:rnd(base.diamant)};
  var heats={argent:35+Math.floor(Math.random()*50),or:20+Math.floor(Math.random()*45),diamant:5+Math.floor(Math.random()*30)};
  var ids={argent:{val:['argentJackpotValue','splashJpArgent'],heat:['argentHeatFill','splashArgentFill']},or:{val:['orJackpotValue','splashJpOr'],heat:['orHeatFill','splashOrFill']},diamant:{val:['diamantJackpotValue','splashJpDiamant'],heat:['diamantHeatFill','splashDiamantFill']}};
  for(var k in ids){ids[k].val.forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=vals[k];});ids[k].heat.forEach(function(id){var el=document.getElementById(id);if(el)el.style.setProperty('--heat-progress',heats[k]+'%');});}
}

function injectBadge(){
  // Sécurité : le badge "MODE DÉCOUVERTE" ne doit exister qu'en mode découverte réel.
  if(!tutoActive){removeBadge();return;}
  var existing=document.getElementById('tutorialModeBadge');
  if(existing){existing.textContent=tx().badge;return;}
  var b=document.createElement('div');
  b.id='tutorialModeBadge';
  b.textContent=tx().badge;
  document.body.appendChild(b);
}
function removeBadge(){var b=document.getElementById('tutorialModeBadge');if(b)b.remove();}

function goToStep(n){
  if(!tutoActive)return;if(n>=STEPS.length){exitTutorial();return;}
  tutoStep=n;cachedDynTargets=null;
  var step=STEPS[n];
  // TOUTES les étapes bloquent sauf les waitFor sans block
  if(step.block||step.advance==='click')showBlockOverlay();else removeBlockOverlay();
  // Bloquer settings sauf à l'étape 12 (13/15 Paramètres)
  var settBtn=document.getElementById('settingsBtn');
  document.body.classList.toggle('tuto-settings-step', n===12);
  if(settBtn)settBtn.style.pointerEvents=(n===12)?'auto':'none';
  if(step.onEnter)step.onEnter();
  showBubble(step);
}
function nextStep(){
  removeBlockOverlay();
  // Call onExit of current step if exists
  if(tutoStep>=0&&tutoStep<STEPS.length&&STEPS[tutoStep].onExit)STEPS[tutoStep].onExit();
  goToStep(tutoStep+1);
}
function previousStep(){
  if(!tutoActive||tutoStep<=0)return;
  removeBlockOverlay();
  closeJpBubble();
  removeJpBlockOverlay();
  jpBubbleDismissed=false;
  jpBubbleManuallyMoved=false;
  if(tutoStep>=0&&tutoStep<STEPS.length&&STEPS[tutoStep].onExit)STEPS[tutoStep].onExit();
  goToStep(tutoStep-1);
}
function pollWaitFor(){if(!tutoActive||tutoStep<0||tutoStep>=STEPS.length)return;var step=STEPS[tutoStep];if(step.waitFor&&step.waitFor())nextStep();}
function forceSettingsPanelOpen(){var panel=document.getElementById('settingsPanel');if(panel){panel.classList.remove('hidden');panel.style.display='';panel.style.pointerEvents='auto';}var btn=document.getElementById('settingsBtn');if(btn)btn.style.pointerEvents='auto';}

// ── Flèches ──────────────────────────────────────────────────────────
function resolveTargets(step){var t=[];if(step.staticArrows)step.staticArrows.forEach(function(id){var el=document.getElementById(id);if(el&&el.offsetParent!==null)t.push(el);});if(step.queryTargets){if(step.queryOnce&&cachedDynTargets){var ok=cachedDynTargets.every(function(el){return document.contains(el)&&el.offsetParent!==null;});if(ok)t=t.concat(cachedDynTargets);else{cachedDynTargets=step.queryTargets();t=t.concat(cachedDynTargets);}}else{var f=step.queryTargets();if(step.queryOnce)cachedDynTargets=f;t=t.concat(f);}}return t;}
function syncArrows(targets){while(arrowEls.length>targets.length){var x=arrowEls.pop();if(x&&x.parentNode)x.parentNode.removeChild(x);}while(arrowEls.length<targets.length){var a=document.createElement('div');a.className='tuto-arrow';document.body.appendChild(a);arrowEls.push(a);}for(var i=0;i<targets.length;i++){var a=arrowEls[i];a.classList.toggle('tuto-arrow--settings',!!(targets[i]&&targets[i].id==='settingsBtn'));posArrow(a,targets[i]);}}
function posArrow(ad,te){if(!te||!ad)return;var r=te.getBoundingClientRect();if(r.width===0&&r.height===0){ad.style.display='none';return;}ad.style.display='';var aw=ad.offsetWidth||42;var ah=ad.offsetHeight||66;ad.classList.remove('tuto-arrow--above');
  if(te.id==='settingsBtn'){
    // La flèche paramètres doit viser exactement le centre du logo ⚙️.
    // On supprime le décalage visuel dû à la rotation standard.
    var lset=r.left+r.width/2-aw/2;
    var tset=r.bottom+10;
    if(tset+ah>window.innerHeight){tset=r.top-ah-10;ad.classList.add('tuto-arrow--above');}
    ad.style.left=Math.max(6,Math.min(window.innerWidth-aw-6,lset))+'px';
    ad.style.top=Math.max(6,tset)+'px';
    return;
  }
  var l=r.left+r.width/2-aw/2,tp=r.bottom+8;if(tp+ah>window.innerHeight){tp=r.top-ah-8;ad.classList.add('tuto-arrow--above');}ad.style.left=Math.max(6,Math.min(window.innerWidth-aw-6,l))+'px';ad.style.top=Math.max(6,tp)+'px';}
function removeAllArrows(){arrowEls.forEach(function(a){if(a&&a.parentNode)a.parentNode.removeChild(a);});arrowEls=[];}
function startArrowTracking(){stopArrowTracking();function tick(){if(!tutoActive)return;if(tutoStep>=0&&tutoStep<STEPS.length)syncArrows(resolveTargets(STEPS[tutoStep]));rafId=requestAnimationFrame(tick);}rafId=requestAnimationFrame(tick);}
function stopArrowTracking(){if(rafId){cancelAnimationFrame(rafId);rafId=null;}}

// ── Bulle jackpot (apparaît entre step 4 et step 5) ──────────────────
function getVisibleJpCallTarget(){
  var calls=document.querySelectorAll('.hand-odds.jackpot-call, .tie-value.jackpot-call');
  for(var i=0;i<calls.length;i++){
    var el=calls[i];
    if(!document.contains(el))continue;
    var r=el.getBoundingClientRect();
    if(el.offsetParent!==null&&r.width>0&&r.height>0)return el;
  }
  return null;
}
function positionJpBubble(target){
  var bub=document.getElementById('jpCallBubble');
  if(!bub||!target)return;
  var r=target.getBoundingClientRect();
  var margin=16;
  var gap=28;
  var vw=window.innerWidth;
  var vh=window.innerHeight;
  var bw=Math.min(320,vw-(margin*2));
  bub.style.width=bw+'px';

  // Important : la bulle explicative ne doit jamais recouvrir
  // le petit rectangle doré/argent/diamant "Tentez le jackpot" qu'elle désigne.
  // On privilégie donc un placement latéral, puis on bascule au-dessus/dessous
  // uniquement si l'écran est trop étroit.
  var bh=bub.offsetHeight||170;
  var candidates=[];
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function add(left,top,name){
    left=clamp(left,margin,vw-bw-margin);
    top=clamp(top,margin,vh-bh-margin);
    var overlap=!(left+bw<r.left-gap||left>r.right+gap||top+bh<r.top-gap||top>r.bottom+gap);
    candidates.push({left:left,top:top,name:name,overlap:overlap});
  }

  add(r.left-bw-gap,r.top+(r.height/2)-(bh/2),'left');
  add(r.right+gap,r.top+(r.height/2)-(bh/2),'right');
  add(r.left+(r.width/2)-(bw/2),r.top-bh-gap,'above');
  add(r.left+(r.width/2)-(bw/2),r.bottom+gap,'below');

  var chosen=candidates.find(function(c){return !c.overlap;})||candidates[candidates.length-1];
  bub.style.left=chosen.left+'px';
  bub.style.top=chosen.top+'px';
}
function startJpCallWatch(){
  if(jpCallWatcher){clearInterval(jpCallWatcher);jpCallWatcher=null;}
  closeJpBubble();
  removeJpBlockOverlay();
  return;
  jpCallWatcher=setInterval(function(){
    if(!tutoActive){clearInterval(jpCallWatcher);closeJpBubble();removeJpBlockOverlay();return;}
    if(tutoStep<4){closeJpBubble();removeJpBlockOverlay();return;}
    var target=getVisibleJpCallTarget();
    if(!target){closeJpBubble();removeJpBlockOverlay();jpBubbleDismissed=false;jpBubbleManuallyMoved=false;return;}
    if(jpBubbleDismissed){removeJpBlockOverlay();return;}

    // La bulle jackpot est prioritaire : tant qu'elle n'a pas été validée,
    // aucune action de jeu ne doit passer, même si la bulle principale 5/15
    // demande déjà de miser. Seule la bulle jackpot reste cliquable/déplaçable.
    if(!document.getElementById('jpCallBlockOverlay'))showJpBlockOverlay();

    var bub=document.getElementById('jpCallBubble');
    if(!bub)showJpBubble(target);
    else if(!jpBubbleManuallyMoved)positionJpBubble(target);
  },150);
}
function showJpBubble(target){closeJpBubble();jpBubbleManuallyMoved=false;var t=tx();var bub=document.createElement('div');bub.id='jpCallBubble';bub.className='tuto-bubble tuto-bubble--visible tuto-jp-call-bubble';bub.style.cssText='position:fixed;z-index:10120;width:320px;';bub.innerHTML='<div class="tuto-bubble-drag-handle">☰</div><div class="tuto-bubble-title">'+t.jpBubT+'</div><div class="tuto-bubble-text">'+t.jpBub+'</div><div style="text-align:center;margin-top:10px"><button class="tuto-btn-next" id="jpDismissBtn">'+t.ok+'</button></div>';document.body.appendChild(bub);positionJpBubble(target);makeDraggable(bub);setTimeout(function(){var btn=document.getElementById('jpDismissBtn');if(btn)btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();jpBubbleDismissed=true;closeJpBubble();removeJpBlockOverlay();},true);},50);}
function closeJpBubble(){var el=document.getElementById('jpCallBubble');if(el&&el.parentNode)el.parentNode.removeChild(el);}

// ── Bulle principale ─────────────────────────────────────────────────
function showBubble(step){
  removeBubble();removeAllArrows();var t=tx();
  var ft=step.staticArrows&&step.staticArrows[0]?document.getElementById(step.staticArrows[0]):null;
  if(step.staticArrows&&step.staticArrows[0]&&!ft){setTimeout(function(){showBubble(step);},400);return;}
  bubbleEl=document.createElement('div');bubbleEl.id='tutoBubble';bubbleEl.className='tuto-bubble';
  var stepNumber=tutoStep+1;
  var noBackSteps={2:true,7:true,9:true,11:true,12:true};
  var canGoBack=tutoActive&&tutoStep>0&&!noBackSteps[stepNumber];
  var stepCounter=canGoBack?'<button type="button" class="tuto-step-count tuto-step-count--back" id="tutoBtnPrev" title="Retour">← '+stepNumber+' / '+STEPS.length+'</button>':'<span class="tuto-step-count">'+stepNumber+' / '+STEPS.length+'</span>';
  bubbleEl.innerHTML='<div class="tuto-bubble-drag-handle">'+t.drag+'</div><div class="tuto-bubble-title">'+step.title+'</div><div class="tuto-bubble-text">'+step.text+'</div><div class="tuto-bubble-footer">'+stepCounter+(step.isFinal?'<button class="tuto-btn-next tuto-btn-finish" id="tutoBtnNext">'+t.finish+'</button>':step.advance==='click'?'<button class="tuto-btn-next" id="tutoBtnNext">'+t.ok+'</button>':'<span class="tuto-wait-hint">'+t.wait+'</span>')+'</div>';
  document.body.appendChild(bubbleEl);
  var posTarget=ft;
  if(!posTarget&&step.queryTargets){var rt=resolveTargets(step);if(rt&&rt.length)posTarget=rt[0];}
  positionBubble(posTarget,step.pos);makeDraggable(bubbleEl);
  var bp=document.getElementById('tutoBtnPrev');
  if(bp)bp.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();previousStep();});
  var bn=document.getElementById('tutoBtnNext');
  if(bn)bn.addEventListener('click',function(){if(step.isFinal){exitTutorial();if(typeof showRoundSetup==='function')showRoundSetup();}else nextStep();});
  requestAnimationFrame(function(){if(bubbleEl)bubbleEl.classList.add('tuto-bubble--visible');});
}
function positionBubble(te,pos){
  if(!bubbleEl)return;var vw=window.innerWidth,bw=Math.min(380,vw-32);
  // Positions fixes — ne dépendent PAS de la cible
  if(pos==='underjackpots'){
    bubbleEl.style.cssText='position:fixed;top:150px;left:50%;transform:translateX(-50%);width:'+bw+'px;z-index:10095;';
    return;
  }
  if(pos==='underjackpotcall'&&te){
    var jr=te.getBoundingClientRect();
    var left=Math.max(12,Math.min(vw-bw-12,jr.left+(jr.width/2)-bw/2));
    var top=Math.min(window.innerHeight-120,jr.bottom+18);
    bubbleEl.style.cssText='position:fixed;left:'+left+'px;top:'+top+'px;width:'+bw+'px;z-index:10095;';
    return;
  }
  if(pos==='undersettings'){
    var sBtn=document.querySelector('.settings-btn');
    if(sBtn){
      var sr=sBtn.getBoundingClientRect();
      var arrowH=72;
      var top=Math.min(window.innerHeight-120, sr.bottom+8+arrowH+8);
      bubbleEl.style.cssText='position:fixed;top:'+top+'px;right:'+(window.innerWidth-sr.right)+'px;width:'+bw+'px;z-index:10095;';
    }
    else{bubbleEl.style.cssText='position:fixed;top:150px;right:12px;width:'+bw+'px;z-index:10095;';}
    return;
  }
  if(pos==='aboveabandon'){var ab=document.getElementById('btnAbandon');var dock=document.getElementById('abandonDock');var target=ab||dock;if(target){var ar=target.getBoundingClientRect();var left=Math.max(12,Math.min(vw-bw-12,ar.left+(ar.width/2)-bw/2));var bh=bubbleEl.offsetHeight||190;var arrowH=72;var top=Math.max(72,ar.top-arrowH-bh-18);bubbleEl.style.cssText='position:fixed;left:'+left+'px;top:'+top+'px;width:'+bw+'px;z-index:10095;';}else{bubbleEl.style.cssText='position:fixed;left:12px;bottom:170px;width:'+bw+'px;z-index:10095;';}return;}
  if(pos==='bottomcenter'){bubbleEl.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);width:'+bw+'px;z-index:10095;';return;}
  if(pos==='topleft'){bubbleEl.style.cssText='position:fixed;top:86px;left:12px;width:'+bw+'px;z-index:10095;max-height:calc(100vh - 100px);overflow-y:auto;';return;}
  if(pos==='topright'){bubbleEl.style.cssText='position:fixed;top:86px;right:'+Math.max(12,vw>600?16:8)+'px;width:'+bw+'px;z-index:10095;';return;}
  if(!te||pos==='center'){bubbleEl.classList.add('tuto-bubble--center');bubbleEl.style.width=bw+'px';return;}
  var r=te.getBoundingClientRect(),m=12,left,top;
  if(pos==='bottom'){left=Math.max(m,Math.min(vw-bw-m,r.left+r.width/2-bw/2));top=r.bottom+14;}
  else if(pos==='top'){left=Math.max(m,Math.min(vw-bw-m,r.left+r.width/2-bw/2));top=Math.max(m,r.top-220);}
  else if(pos==='right'){left=r.right+14;top=Math.max(m,r.top);if(left+bw>vw-m)left=Math.max(m,r.left-bw-14);}
  else if(pos==='left'){left=Math.max(m,r.left-bw-14);top=Math.max(m,r.top);if(left<m)left=r.right+14;}
  bubbleEl.style.cssText='position:fixed;left:'+left+'px;top:'+top+'px;width:'+bw+'px;z-index:10095;';
}
function removeBubble(){var el=document.getElementById('tutoBubble');if(el)el.remove();bubbleEl=null;}

function makeDraggable(el){var h=el.querySelector('.tuto-bubble-drag-handle');if(!h)return;var ox=0,oy=0,sx=0,sy=0,d=false;function dn(e){d=true;if(el&&el.id==='jpCallBubble')jpBubbleManuallyMoved=true;var t=e.touches?e.touches[0]:e;sx=t.clientX;sy=t.clientY;var r=el.getBoundingClientRect();ox=r.left;oy=r.top;el.classList.remove('tuto-bubble--center');el.style.right='auto';el.style.bottom='auto';el.style.transform='none';e.preventDefault();e.stopPropagation();}function mv(e){if(!d)return;var t=e.touches?e.touches[0]:e;var bw=el.offsetWidth||320,bh=el.offsetHeight||160;var left=ox+t.clientX-sx,top=oy+t.clientY-sy;left=Math.max(6,Math.min(window.innerWidth-bw-6,left));top=Math.max(6,Math.min(window.innerHeight-bh-6,top));el.style.left=left+'px';el.style.top=top+'px';e.preventDefault();}function up(){d=false;}h.addEventListener('mousedown',dn);document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);h.addEventListener('touchstart',dn,{passive:false});document.addEventListener('touchmove',mv,{passive:false});document.addEventListener('touchend',up);}

function updateToggleButton(){var btn=document.getElementById('btnToggleTutorial');if(!btn)return;var ok=false,sp=document.getElementById('splashScreen'),su=document.getElementById('roundSetupOverlay'),ab=document.getElementById('btnAbandon');if(sp&&!sp.classList.contains('hidden'))ok=true;if(su&&!su.classList.contains('hidden'))ok=true;if(typeof roundFinished!=='undefined'&&roundFinished)ok=true;if(ab&&ab.style.display!=='none'&&ab.offsetParent!==null)ok=true;btn.disabled=!ok;btn.style.opacity=ok?'1':'0.38';btn.style.pointerEvents=ok?'auto':'none';}

// ── Sélecteur de langue splash ───────────────────────────────────────
function initSplashLang(){
  var sel=document.getElementById('splashLangSelector');
  if(!sel)return;
  sel.addEventListener('click',function(e){
    var btn=e.target.closest('[data-lang]');
    if(!btn)return;
    var newLang=btn.dataset.lang;
    if(typeof setLang==='function')setLang(newLang);
    try{
      localStorage.setItem('lang',newLang);
      localStorage.setItem('corsicaLang',newLang);
    }catch(e){}
    // Mettre à jour le tagline
    var tag=document.querySelector('.splash-tagline');
    if(tag)tag.textContent=newLang==='en'?'Play the odds':'Jouez la cote';
    // Mettre à jour le bouton découverte
    var disc=document.getElementById('btnDiscovery');
    if(disc)disc.textContent=newLang==='en'?'🎓 First visit — Discovery':'🎓 Première visite — Découverte';
    // Mettre à jour le bouton jouer
    var play=document.getElementById('btnStart');
    if(play)play.textContent=newLang==='en'?'Play':'Jouer';
    // Jackpot labels on splash
    var jpN=newLang==='en'?{a:'SILVER',o:'GOLD',d:'DIAMOND'}:{a:'ARGENT',o:'OR',d:'DIAMANT'};
    ['splashLblArgent','splashLblOr','splashLblDiamant'].forEach(function(id,i){
      var el=document.getElementById(id);
      if(el){var n=['a','o','d'][i];el.innerHTML='<span class="jackpot-diamond left">◆</span><span class="jackpot-name"><span>JACKPOT</span><span>'+jpN[n]+'</span></span><span class="jackpot-diamond right">◆</span>';}
    });
    // Jackpot names on splash
    var jpN=newLang==='en'?{a:'SILVER',o:'GOLD',d:'DIAMOND'}:{a:'ARGENT',o:'OR',d:'DIAMANT'};
    function updateSplashJpLabels(){
      ['splashLblArgent','splashLblOr','splashLblDiamant'].forEach(function(id,i){
        var el=document.getElementById(id);
        if(el){var n=[jpN.a,jpN.o,jpN.d][i];el.innerHTML='<span class="jackpot-diamond left">◆</span><span class="jackpot-name"><span>JACKPOT</span><span>'+n+'</span></span><span class="jackpot-diamond right">◆</span>';}
      });
    }
    updateSplashJpLabels();
    setTimeout(updateSplashJpLabels,100);
    // Highlight
    sel.querySelectorAll('.splash-lang-btn').forEach(function(b){b.classList.toggle('active',b.dataset.lang===newLang);});
  });
  // Init highlight
  var cur=typeof lang!=='undefined'?lang:'fr';
  sel.querySelectorAll('.splash-lang-btn').forEach(function(b){b.classList.toggle('active',b.dataset.lang===cur);});
}


function refreshTutorialLanguage(){
  try{
    if(tutoActive){
      STEPS=buildSteps();
      var step=STEPS[tutoStep];
      if(step) showBubble(step);
      var jp=document.getElementById('jpCallBubble');
      if(jp){
        var target=document.querySelector('.jackpot-callout, .jackpot-try, .sq-jackpot, .jackpot-eligible, .sq:not(.disabled) .jackpot-mini');
        showJpBubble(target || document.body);
      }
    }
    if(tutoActive){
      injectBadge();
    }else{
      removeBadge();
    }
    updateToggleButton();
  }catch(e){ console.warn('[tutorial] refresh language failed', e); }
}
window.refreshTutorialLanguage=refreshTutorialLanguage;

function onReady(){
  try{if(!localStorage.getItem('tutoSoundFix2')&&typeof soundEnabled!=='undefined'&&!soundEnabled){soundEnabled=true;if(typeof saveSettings==='function')saveSettings();}localStorage.setItem('tutoSoundFix2','1');}catch(e){}
  initSplashLang();
  var btnDisc=document.getElementById('btnDiscovery');if(btnDisc)btnDisc.addEventListener('click',activateTutorial);
  var btnToggle=document.getElementById('btnToggleTutorial');if(btnToggle)btnToggle.addEventListener('click',function(){if(tutoActive){exitTutorial();if(typeof showRoundSetup==='function')showRoundSetup();}else activateTutorial();});
  setInterval(updateToggleButton,500);updateToggleButton();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onReady);
else onReady();
