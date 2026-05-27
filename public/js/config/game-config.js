const CARD_BACK_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3OCAxMDkiIHdpZHRoPSI3OCIgaGVpZ2h0PSIxMDkiPgogIDxkZWZzPgogICAgPHBhdHRlcm4gaWQ9ImRpYW1vbmRzIiB4PSIwIiB5PSIwIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cG9seWdvbiBwb2ludHM9IjYsMCAxMiw2IDYsMTIgMCw2IiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjEyLDE3NSw1NSwwLjI4KSIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICAgIDwvcGF0dGVybj4KICAgIDxwYXR0ZXJuIGlkPSJkb3RzIiB4PSIwIiB5PSIwIiB3aWR0aD0iNiIgaGVpZ2h0PSI2IiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPGNpcmNsZSBjeD0iMyIgY3k9IjMiIHI9IjAuNiIgZmlsbD0icmdiYSgyMTIsMTc1LDU1LDAuMTgpIi8+CiAgICA8L3BhdHRlcm4+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzBkMTgyOCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6IzA4MGUxYSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMxMDFlMzAiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI3OCIgaGVpZ2h0PSIxMDkiIHJ4PSI4IiBmaWxsPSJ1cmwoI2JnKSIvPgogIDxyZWN0IHdpZHRoPSI3OCIgaGVpZ2h0PSIxMDkiIHJ4PSI4IiBmaWxsPSJ1cmwoI2RvdHMpIi8+CiAgPHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjcwIiBoZWlnaHQ9IjEwMSIgcng9IjUiIGZpbGw9InVybCgjZGlhbW9uZHMpIi8+CiAgPHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjcwIiBoZWlnaHQ9IjEwMSIgcng9IjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTIsMTc1LDU1LDAuNDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8cmVjdCB4PSIxLjUiIHk9IjEuNSIgd2lkdGg9Ijc1IiBoZWlnaHQ9IjEwNiIgcng9IjciIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTIsMTc1LDU1LDAuMjApIiBzdHJva2Utd2lkdGg9IjEiLz4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzOSw1NC41KSI+CiAgICA8cGF0aCBkPSJNMCwtMTYgQzQsLTEwIDE0LC00IDE0LDQgQzE0LDEwIDgsMTQgMCwxMCBDLTgsMTQgLTE0LDEwIC0xNCw0IEMtMTQsLTQgLTQsLTEwIDAsLTE2IFoiIGZpbGw9InJnYmEoMjEyLDE3NSw1NSwwLjg1KSIvPgogICAgPHBhdGggZD0iTTAsMTAgTDQsMTggTC00LDE4IFoiIGZpbGw9InJnYmEoMjEyLDE3NSw1NSwwLjg1KSIvPgogICAgPHJlY3QgeD0iLTUiIHk9IjE3IiB3aWR0aD0iMTAiIGhlaWdodD0iMiIgcng9IjEiIGZpbGw9InJnYmEoMjEyLDE3NSw1NSwwLjg1KSIvPgogIDwvZz4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMCwxMCkgc2NhbGUoMC40NSkiPgogICAgPHBhdGggZD0iTTAsLTEyIEMzLC03IDEwLC0zIDEwLDMgQzEwLDggNiwxMCAwLDcgQy02LDEwIC0xMCw4IC0xMCwzIEMtMTAsLTMgLTMsLTcgMCwtMTIgWiIgZmlsbD0icmdiYSgyMTIsMTc1LDU1LDAuNTUpIi8+CiAgPC9nPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDY4LDk5KSBzY2FsZSgwLjQ1KSByb3RhdGUoMTgwKSI+CiAgICA8cGF0aCBkPSJNMCwtMTIgQzMsLTcgMTAsLTMgMTAsMyBDMTAsOCA2LDEwIDAsNyBDLTYsMTAgLTEwLDggLTEwLDMgQy0xMCwtMyAtMywtNyAwLC0xMiBaIiBmaWxsPSJyZ2JhKDIxMiwxNzUsNTUsMC41NSkiLz4KICA8L2c+Cjwvc3ZnPg==";

const CONFIG = {
 margin: 0.05,
 minHands: 4,
 maxHands: 10,
 simsByPhase: {
 pre: 15000,
 flop: 12000,
 turn: 10000,
 river: 1
 }
};

const JACKPOT_TYPES = ["argent","or","diamant"];
const JACKPOT_RESETS = { argent: 250, or: 850, diamant: 8000 };
const JACKPOT_SPLITS = { argent: 0.40, or: 0.35, diamant: 0.25 };

// ==================================================
// UI / HELPERS
// ==================================================

function restartClassAnimation(node, className) {
 if (!node) return;
 node.classList.remove(className);
 void node.offsetWidth;
 node.classList.add(className);
}

function clearTimeoutRef(timerRef) {
 if (timerRef) clearTimeout(timerRef);
 return null;
}

function playChipClickSound() {
 if (!soundEnabled) return;
 const ctx = getAudioContext();
 if (!ctx) return;

 const now = ctx.currentTime;

 const osc1 = ctx.createOscillator();
 const osc2 = ctx.createOscillator();
 const gain1 = ctx.createGain();
 const gain2 = ctx.createGain();
 const filter = ctx.createBiquadFilter();

 osc1.type = "triangle";
 osc2.type = "square";
 filter.type = "lowpass";
 filter.frequency.setValueAtTime(2200, now);

 osc1.frequency.setValueAtTime(860, now);
 osc1.frequency.exponentialRampToValueAtTime(260, now + 0.06);

 osc2.frequency.setValueAtTime(410, now);
 osc2.frequency.exponentialRampToValueAtTime(180, now + 0.05);

 gain1.gain.setValueAtTime(0.0001, now);
 gain1.gain.exponentialRampToValueAtTime(0.05, now + 0.008);
 gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

 gain2.gain.setValueAtTime(0.0001, now);
 gain2.gain.exponentialRampToValueAtTime(0.025, now + 0.01);
 gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

 osc1.connect(gain1);
 osc2.connect(gain2);
 gain1.connect(filter);
 gain2.connect(filter);
 filter.connect(ctx.destination);

 osc1.start(now);
 osc2.start(now);
 osc1.stop(now + 0.08);
 osc2.stop(now + 0.065);
}

function flashChipButton(btn) {
 if (!btn) return;
 restartClassAnimation(btn, "clicked");
 setTimeout(() => btn.classList.remove("clicked"), 260);
}


function animateBetSquare(selector) {
 const run = () => {
  const node = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!node) return;
  restartClassAnimation(node, "bet-placed-anim");
  setTimeout(() => node.classList.remove("bet-placed-anim"), 620);
 };
 if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
 else run();
}




function triggerStreetImpact() {
 try {
  const table = document.querySelector(".table");
  const boardCenter = document.querySelector(".board-center");
  restartClassAnimation(table, "street-hit");
  restartClassAnimation(boardCenter, "street-hit");
 } catch(_){ console.warn("[game-config.js] erreur silencieuse:", _); }
}

function triggerBetImpactSound() {
 if (!soundEnabled) return;
 playChipClickSound();
 setTimeout(() => playChipClickSound(), 36);
}

function simsForPhase() {
 return CONFIG.simsByPhase[phase] || CONFIG.simsByPhase.pre;
}

const RULES_HTML = {
 fr: `
      <section class="rules-section">
        <h3>Concept</h3>
        <p>Corsica Poker est une expérience inspirée du Texas Hold'em, avec une approche unique : vous ne jouez pas une main — vous pariez sur celles des autres.</p>
        <p>Vous observez une table de joueurs virtuels et votre objectif est d'anticiper l'issue de la manche pour placer vos mises au moment le plus opportun.</p>
        <p>Plus vous prenez de risques, plus les cotes sont élevées — et plus les gains peuvent être importants.</p>
        <p><em>Important : une main est déclarée victorieuse uniquement si elle gagne seule. La case <strong>Égalité</strong> permet de couvrir les situations de partage.</em></p>
      </section>

      <section class="rules-section">
        <h3>Structure d'une manche</h3>
        <p>Choisissez de 4 à 10 joueurs, ou laissez faire le hasard. Plus il y a de joueurs, plus les cotes sont généralement élevées.</p>
        <p>La manche se déroule en quatre phases successives.</p>
      </section>

      <section class="rules-section">
        <h3>1. Préflop — Lecture initiale</h3>
        <p>Chaque joueur reçoit 2 cartes privatives visibles.</p>
        <p>Vous pouvez observer les forces initiales et placer vos premières mises. Miser tôt donne accès aux meilleures cotes.</p>
      </section>

      <section class="rules-section">
        <h3>2. Flop — Premières tendances</h3>
        <p>Trois cartes communes sont révélées. Les cotes sont recalculées en temps réel.</p>
        <p>Vous pouvez de nouveau miser.</p>
      </section>

      <section class="rules-section">
        <h3>3. Turn — Confirmation</h3>
        <p>Une quatrième carte commune apparaît. Les probabilités se resserrent.</p>
        <p>C'est souvent le dernier moment stratégique pour miser efficacement.</p>
      </section>

      <section class="rules-section">
        <h3>4. River — Verdict</h3>
        <p>La cinquième et dernière carte est révélée. Aucune mise supplémentaire n'est possible.</p>
        <p>La meilleure combinaison de 5 cartes remporte la manche.</p>
      </section>

      <section class="rules-section">
        <h3>Calcul des gains</h3>
        <p>Vos gains sont calculés selon vos mises et les cotes au moment exact où vous avez parié.</p>
        <p>Deux joueurs ayant misé sur la même main peuvent donc recevoir des montants différents.</p>
      </section>

      <section class="rules-section rules-section--jackpot">
        <h3>Les jackpots progressifs</h3>
        <p>Ils se déclenchent automatiquement lorsqu'une main atteint un niveau de rareté suffisant. La mise est toujours de <strong>1 jeton</strong>. Une seule mise jackpot est possible par cible et par type.</p>
        <p>Si la main visée ne gagne pas, la mise est perdue. Si elle gagne, vous remportez l'intégralité du pot correspondant.</p>
        <p>Il est possible de cumuler des gains jackpot et des gains normaux sur une même manche.</p>
        <p>Un curseur de "chaleur" vous indique statistiquement si le jackpot risque de tomber, mais c'est toujours le hasard qui décide !</p>
        <ul class="rules-jackpot-list">
          <li><span class="jackpot-label jackpot-argent">Jackpot Argent</span> — Le plus accessible des trois. Se déclenche sur des mains peu fréquentes.</li>
          <li><span class="jackpot-label jackpot-or">Jackpot Or</span> — Rare. Réservé aux configurations inhabituelles.</li>
          <li><span class="jackpot-label jackpot-diamant">Jackpot Diamant</span> — Exceptionnel. Les situations qui le déclenchent sont très rares — et les gains à la hauteur.</li>
        </ul>
      </section>

      <section class="rules-section">
        <h3>Comprendre les cotes</h3>
        <p><strong>Cote élevée</strong> → faible probabilité, gain important.</p>
        <p><strong>Cote faible</strong> → forte probabilité, gain modéré.</p>
        <p>Elles évoluent en permanence au fil des cartes révélées.</p>
      </section>

      <section class="rules-section">
        <h3>Approche stratégique</h3>
        <p>Prendre position tôt maximise les gains potentiels mais augmente le risque.</p>
        <p>Attendre réduit le risque mais fait baisser les cotes.</p>
        <p>L'enjeu est de trouver le bon équilibre entre sécurité et rendement.</p>
      </section>
 `,
 en: `
      <section class="rules-section">
        <h3>Concept</h3>
        <p>Corsica Poker is inspired by Texas Hold'em, with a distinctive twist: you do not play a hand yourself — you bet on the hands of the players at the table.</p>
        <p>You observe a table of virtual players and your objective is to anticipate the outcome of the round in order to place bets at the most opportune moment.</p>
        <p>The more risk you take, the higher the odds — and the larger the potential payout.</p>
        <p><em>Important: a hand is considered victorious only if it wins outright. The <strong>Tie</strong> box lets you cover split outcomes.</em></p>
      </section>

      <section class="rules-section">
        <h3>Round structure</h3>
        <p>Choose from 4 to 10 players, or let the game decide randomly. The more players there are, the higher the odds generally become.</p>
        <p>A round unfolds in four successive phases.</p>
      </section>

      <section class="rules-section">
        <h3>1. Preflop — Initial read</h3>
        <p>Each player receives 2 visible private cards.</p>
        <p>You can assess starting strengths and place your first bets. Betting early gives access to the best odds.</p>
      </section>

      <section class="rules-section">
        <h3>2. Flop — Early trends</h3>
        <p>Three community cards are revealed. Odds are recalculated in real time.</p>
        <p>You may place bets again.</p>
      </section>

      <section class="rules-section">
        <h3>3. Turn — Confirmation</h3>
        <p>A fourth community card is revealed. Probabilities tighten.</p>
        <p>It is often the last strategic phase to bet efficiently.</p>
      </section>

      <section class="rules-section">
        <h3>4. River — Final verdict</h3>
        <p>The fifth and last community card is revealed. No further bets can be placed.</p>
        <p>The best 5-card combination wins the round.</p>
      </section>

      <section class="rules-section">
        <h3>Winnings settlement</h3>
        <p>Your winnings are calculated from your stakes and the odds at the exact moment you placed each bet.</p>
        <p>Two players who bet on the same hand can therefore receive different payouts.</p>
      </section>

      <section class="rules-section rules-section--jackpot">
        <h3>Progressive jackpots</h3>
        <p>They trigger automatically when a hand reaches a sufficient rarity threshold. Each jackpot bet costs exactly <strong>1 chip</strong>. Only one jackpot bet per target and per type is allowed.</p>
        <p>If the targeted hand does not win, the bet is lost. If it wins, you collect the entire corresponding jackpot pool.</p>
        <p>Jackpot winnings and normal winnings can be combined in the same round.</p>
        <p>A "heat" indicator gives you a statistical sense of whether a jackpot is likely to hit soon — but it's always chance that has the final word!</p>
        <ul class="rules-jackpot-list">
          <li><span class="jackpot-label jackpot-argent">Silver Jackpot</span> — The most accessible of the three. Triggers on uncommon hand configurations.</li>
          <li><span class="jackpot-label jackpot-or">Gold Jackpot</span> — Rare. Reserved for unusual game situations.</li>
          <li><span class="jackpot-label jackpot-diamant">Diamond Jackpot</span> — Exceptional. The situations that trigger it are extremely rare — and the rewards match.</li>
        </ul>
      </section>

      <section class="rules-section">
        <h3>Understanding odds</h3>
        <p><strong>High odds</strong> → low probability, larger payout.</p>
        <p><strong>Low odds</strong> → high probability, more moderate payout.</p>
        <p>They evolve continuously as cards are revealed.</p>
      </section>

      <section class="rules-section">
        <h3>Strategic approach</h3>
        <p>Taking a position early maximises potential returns but increases risk.</p>
        <p>Waiting reduces risk but lowers the odds.</p>
        <p>The challenge is finding the right balance between safety and return.</p>
      </section>
 `
};

const I18N = {
 fr: {
 subtitle: "Démo – Pas d'argent réel",
 calcStatus: "Calcul des cotes en cours...",
 sims: "Simulations",
 margin: "Marge maison",
 calc: "Temps calcul",
 bankroll: "Solde (jetons)",
 totalBets: "Mises en cours",
 totalWins: "Gains",
 board: "Board",
 roundEnded: "Manche terminée",
 reviewRound: "Revoir la partie",
 sameTable: "Même table",
 changeTable: "Changer de table",
 abandon: "Abandonner",
 closeBetting: "Mises terminées",
 betTitle: "choisir une mise",
 logTitle: "Journal",
 tie: "Égalité",
 split: "Partage possible",
 eliminated: "Éliminée",
 betPlaced: " placée",
 undo: "Effacer",
 lowOdds: "cote trop faible",
 roundSetupTitle: "Nouvelle manche",
 newRound: "Nouvelle manche",
 roundSetupSubtitle: "",
 randomHands: "Aléatoire (entre 4 et 10)",
 manualHands: "Choisir manuellement",
 handsChoiceOr: "ou",
 handsCountLabel: "Nombre de joueurs :",
 phase: { pre: "Preflop", flop: "Flop", turn: "Turn", river: "River" },
 roundSummary: "Résumé de manche",
 betsEngaged: "Mises engagées",
 winningsPaid: "Gains payés",
 winner: "Gagnant",
 winners: "Gagnants",
 actions: "",
 betPanel: "",
 tiePanel: "Égalité",
 "Supprimer les mises": "Effacer la de la phase",
 insufficient: "Solde insuffisant",
 finishRoundFirst: "Terminez d\'abord la manche en cours",
 bronzeJackpot: "Jackpot Bronze",
 argentJackpot: "Jackpot Argent",
 orJackpot: "Jackpot Or",
 diamantJackpot: "Jackpot Diamant",
 tryBronzeJackpot: "Tente le jackpot bronze",
 tryArgentJackpot: "Tente le jackpot argent",
 tryOrJackpot: "Tente le jackpot or",
 tryDiamantJackpot: "Tente le jackpot diamant",
 jackpotWon: "Jackpot gagné",
 gameFinished: "Main gagnante",
 settingsTitle: "Paramètres",
 rulesButton: "Règles du jeu",
 settingsLanguage: "Langues",
 settingsSound: "Son",
 settingsFelt: "Couleur du tapis",
 settingsStyle: "Style de jeu",
 settingsAudio1: "Jazz 1",
 settingsAudio2: "Jazz 2",
 settingsAudio3: "Beats",
 settingsAudio4: "RNB",
 settingsAudio5: "Relax",
 settingsAudio6: "Ambiance casino",
 settingsCustomAudio: "Son personnalisé",
 settingsNoCustomAudio: "Aucun fichier",
 settingsCustomBg: "Fond personnalisé",
 settingsCardBack: "Dos des cartes du board",
 styleClassic: "Classique",
 styleMetal: "Métal",
 stylePremium: "Premium",
 styleNuit: "Nuit",
 validateBets: "Valider les mises",
 clearBetsTitle: "Effacer les mises",
 rulesTitle: "Règles du jeu",
 rulesClose: "Fermer",
 rulesSlogan: "Jouez la cote",
 },
 en: {
 subtitle: "Demo – No real money",
 calcStatus: "Calculating odds...",
 sims: "Simulations",
 margin: "House margin",
 calc: "Calc time",
 bankroll: "Balance (chips)",
 totalBets: "Current bets",
 totalWins: "Winnings",
 board: "Board",
 roundEnded: "Round over",
 reviewRound: "Review round",
 sameTable: "Same table",
 changeTable: "Change table",
 abandon: "Abandon",
 closeBetting: "Betting closed",
 betTitle: "Choose a bet",
 logTitle: "Log",
 tie: "Tie",
 split: "Split possible",
 eliminated: "Eliminated",
 betPlaced: "Bet placed",
 undo: "Undo",
 lowOdds: "odds too low",
 roundSetupTitle: "New round",
 newRound: "New round",
 roundSetupSubtitle: "Choose your table",
 randomHands: "Random",
 manualHands: "Choose manually",
 handsChoiceOr: "or",
 handsCountLabel: "Number of players:",
 phase: { pre: "Preflop", flop: "Flop", turn: "Turn", river: "River" },
 roundSummary: "Round summary",
 betsEngaged: "Bets engaged",
 winningsPaid: "Winnings paid",
 winner: "Winner",
 winners: "Winners",
 actions: "",
 betPanel: "Bet",
 betSquare: "Bet",
 tiePanel: "Tie",
 "Supprimer les mises": "Clear phase bet",
 insufficient: "Insufficient balance",
 finishRoundFirst: "Finish the current round first",
 bronzeJackpot: "Bronze Jackpot",
 argentJackpot: "Silver Jackpot",
 orJackpot: "Gold Jackpot",
 diamantJackpot: "Diamond Jackpot",
 tryBronzeJackpot: "Try the bronze jackpot",
 tryArgentJackpot: "Try the silver jackpot",
 tryOrJackpot: "Try the gold jackpot",
 tryDiamantJackpot: "Try the diamond jackpot",
 jackpotWon: "Jackpot won",
 gameFinished: "WINNING HAND",
 settingsTitle: "Settings",
 rulesButton: "Game rules",
 settingsLanguage: "Languages",
 settingsSound: "Sound",
 settingsFelt: "Felt color",
 settingsStyle: "Game style",
 settingsAudio1: "Jazz 1",
 settingsAudio2: "Jazz 2",
 settingsAudio3: "Beats",
 settingsAudio4: "RNB",
 settingsAudio5: "Relax",
 settingsAudio6: "Casino ambience",
 settingsCustomAudio: "Custom sound",
 settingsNoCustomAudio: "No file",
 settingsCustomBg: "Custom background",
 settingsCardBack: "Board card backs",
 styleClassic: "Classic",
 styleMetal: "Metal",
 stylePremium: "Premium",
 styleNuit: "Night",
 validateBets: "Confirm my bets",
 clearBetsTitle: "Clear bets",
 rulesTitle: "Game rules",
 rulesClose: "Close",
 rulesSlogan: "Play the odds",
 },
};

const el = (id) => document.getElementById(id);

const subtitle = el("subtitle");
const statusEl = el("status");

const lblSims = el("lblSims");
const lblMargin = el("lblMargin");
const lblCalc = el("lblCalc");
const lblBankroll = el("lblBankroll");
const lblTotalBets = el("lblTotalBets");
const lblTotalWins = el("lblTotalWins");

const simsCount = el("simsCount");
const marginPct = el("marginPct");
const calcMs = el("calcMs");
const bankrollEl = el("bankroll");
const totalBetsEl = el("totalBets");
const totalWinsEl = el("totalWins");
const jackpotValueEls = {
 bronze: el("bronzeJackpotValue"),
 argent: el("argentJackpotValue"),
 or: el("orJackpotValue"),
 diamant: el("diamantJackpotValue")
};
const jackpotBoxEls = {
 bronze: el("bronzeJackpotBox"),
 argent: el("argentJackpotBox"),
 or: el("orJackpotBox"),
 diamant: el("diamantJackpotBox")
};

const boardTitle = el("boardTitle");
const boardCards = el("boardCards");

const btnSameTable = el("btnSameTable");
const btnChangeTable = el("btnChangeTable");
const btnAdvance = el("btnAdvance");
const btnAbandon = el("btnAbandon");

const betTitle = el("betTitle");

const betPanelTitle = el("betPanelTitle");
const tiePanelTitle = el("tiePanelTitle");
const actPanelTitle = el("actPanelTitle");

const handsLayer = el("handsLayer");
const chipFlightLayer = el("chipFlightLayer");
const tieOddsEl = el("tieOdds");
const tieResultInfo = el("tieResultInfo");

const logTitle = el("logTitle");
const logBody = el("logBody");

const btnFR = el("btnFR");
const btnEN = el("btnEN");
const btnSound = el("btnSound");
const volumeSlider = el("volumeSlider");
const settingsMutedIcon = el("settingsMutedIcon");
const settingsBtn = el("settingsBtn");
const settingsPanel = el("settingsPanel");
const feltColorOptions = el("feltColorOptions");


const BOARD_CARD_BACK_STYLES = [
 { name: "Classique", legacy: true },
 { name: "Bleu", bg: "#102a55", accent: "#67e8f9", pattern: "waves" },
 { name: "Rouge", bg: "#4a0f16", accent: "#f5c2c7", pattern: "stars" },
 { name: "Vert", bg: "#083d2b", accent: "#7cf7b4", pattern: "clubs" },
 { name: "Violet", bg: "#2d145f", accent: "#d8b4fe", pattern: "grid" },
 { name: "Noir & or", bg: "#111318", accent: "#f6d36b", pattern: "spades" }
];

function clampBoardCardBackStyle(styleIndex) {
 const max = Math.max(0, (typeof BOARD_CARD_BACK_STYLES !== "undefined" ? BOARD_CARD_BACK_STYLES.length : 1) - 1);
 return Math.max(0, Math.min(max, Number(styleIndex) || 0));
}

function cardBackSvg(styleIndex) {
 const idx = clampBoardCardBackStyle(styleIndex);
 const style = BOARD_CARD_BACK_STYLES[idx] || BOARD_CARD_BACK_STYLES[0];
 if (style.legacy) return CARD_BACK_URL;
 const symbol = style.pattern === "clubs" ? "♣" : style.pattern === "spades" ? "♠" : style.pattern === "stars" ? "★" : style.pattern === "waves" ? "≈" : style.pattern === "grid" ? "◆" : "♦";
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 109" width="78" height="109"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${style.bg}"/><stop offset="1" stop-color="#05070b"/></linearGradient><pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse"><text x="8" y="12" text-anchor="middle" font-size="10" fill="${style.accent}" opacity=".32">${symbol}</text></pattern></defs><rect width="78" height="109" rx="9" fill="url(#g)"/><rect x="4" y="4" width="70" height="101" rx="6" fill="url(#p)" stroke="${style.accent}" stroke-width="1.4" opacity=".95"/><rect x="10" y="10" width="58" height="89" rx="5" fill="none" stroke="${style.accent}" stroke-width="1" opacity=".5"/><text x="39" y="61" text-anchor="middle" font-size="32" fill="${style.accent}" opacity=".9">${symbol}</text></svg>`;
 return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function getBoardCardBackUrl() {
 return cardBackSvg(typeof boardBackStyle !== "undefined" ? boardBackStyle : 0);
}

const FELT_COLORS = [
  // ── Couleurs unies ───────────────────────────────────────────────────────────
  { table: "#2b2b2b", table2: "#161616", text: "#fafafa", muted: "#cfcfcf" },  // 0  Gris anthracite
  { table: "#3e424e", table2: "#1e2028", text: "#f4f6fa", muted: "#bbc3d4" },  // 1  Gris acier bleuté
  { table: "#0b1f3a", table2: "#071325", text: "#f4f8ff", muted: "#d7e3f6" },  // 2  Bleu nuit
  { table: "#0b1f3a", table2: "#1e5f74", text: "#f4faff", muted: "#d3e8f1" },  // 3  Bleu nuit › mer
  { table: "#0f5f3c", table2: "#0a4028", text: "#f2fff8", muted: "#d1ecdd" },  // 4  Vert casino
  { table: "#556b2f", table2: "#3b4a20", text: "#f8fbe9", muted: "#dde7c8" },  // 5  Vert olive
  { table: "#4a2c2a", table2: "#321d1b", text: "#fff8f4", muted: "#e7d6d1" },  // 6  Marron cuir
  { table: "#7a1c1c", table2: "#541212", text: "#fff7f7", muted: "#f0d2d2" },  // 7  Rouge profond
  { table: "#f5e6ca", table2: "#dcc8a3", text: "#3c2f1d", muted: "#655845" },  // 8  Beige sable
  { table: "#0b4a52", table2: "#062e35", text: "#f0fbfc", muted: "#b8dde2" },  // 9  Teal sombre

  // ── Paysages (dégradés atmosphériques discrets) ──────────────────────────────
  {                                                                              // 10 Madagascar (plage)
    table: "#1e3848", table2: "#2a2210", text: "#faf8f2", muted: "#c4c0b0",
    bg: "url('/img/mada.jpg') center/cover no-repeat"
  },
  {                                                                              // 11 Montagne
    table: "#1e2840", table2: "#0e1810", text: "#f2f5f8", muted: "#b8c4d0",
    bg: "url('/img/montagne.jpg') center/cover no-repeat"
  },
  {                                                                              // 12 Paris nuit
    table: "#1a1e14", table2: "#0e1008", text: "#f8f8f0", muted: "#c0c4b0",
    bg: "url('/img/paris.jpg') center/cover no-repeat"
  },
  {                                                                              // 13 Réunion
    table: "#1a2830", table2: "#0e1418", text: "#f2f8fa", muted: "#b8c8d0",
    bg: "url('/img/reunion.jpg') center/cover no-repeat"
  },
  {                                                                              // 14 Corse
    table: "#2a1808", table2: "#0e0808", text: "#fff8f2", muted: "#d0b8a8",
    bg: "url('/img/corse.jpg') center/cover no-repeat"
  },
];


const SETTINGS_STORAGE_KEY = "corsicaPokerSettings";

