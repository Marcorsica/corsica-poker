const CARD_BACK_URL = "https://deckofcardsapi.com/static/img/back.png";

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
const JACKPOT_RESETS = { argent: 250, or: 800, diamant: 8000 };
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
 } catch (_) {}
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
        <p>Corsica Poker est une expérience inspirée du Texas Hold’em, avec une approche unique : vous ne jouez pas une main… vous pariez sur celles des autres.</p>
        <p>Vous observez une table de joueurs virtuels et votre objectif est d’anticiper l’issue de la manche afin de placer vos mises au moment le plus opportun.</p>
        <p>Chaque décision repose sur un équilibre entre l’intuition, la lecture du jeu et l’analyse des probabilités.</p>
        <p>Plus vous prenez de risques, plus les cotes sont élevées… et plus les gains peuvent être importants.</p>
        <p><strong>Attention :</strong> une main est déclarée victorieuse uniquement si elle gagne seule. La case <strong>Égalité</strong> permet de couvrir ce risque.</p>
      </section>

      <section class="rules-section">
        <h3>Structure d’une manche</h3>
        <p>Choisissez le nombre de joueurs, de 4 à 10, ou laissez faire le hasard.</p>
        <p>Plus il y a de joueurs, plus les cotes sont généralement importantes.</p>
        <p>Une manche se déroule en plusieurs étapes, chacune influençant les probabilités et vos décisions.</p>
      </section>

      <section class="rules-section">
        <h3>1. Préflop — Lecture initiale</h3>
        <p>Chaque joueur reçoit 2 cartes privatives visibles.</p>
        <p>Vous pouvez observer les forces initiales, placer vos premières mises sur une ou plusieurs mains, ou sur l’égalité, et identifier des opportunités à forte valeur.</p>
        <p>Miser tôt permet souvent d’obtenir les meilleures cotes.</p>
      </section>

      <section class="rules-section">
        <h3>2. Flop — Premières tendances</h3>
        <p>Trois cartes communes sont révélées.</p>
        <p>Les cotes sont recalculées en temps réel.</p>
        <p>Vous pouvez de nouveau placer vos mises.</p>
      </section>

      <section class="rules-section">
        <h3>3. Turn — Confirmation</h3>
        <p>Une quatrième carte commune apparaît.</p>
        <p>À ce stade, les probabilités deviennent généralement plus faibles et les scénarios se resserrent.</p>
        <p>C’est souvent la dernière phase stratégique pour miser efficacement : le meilleur compromis entre risque et information.</p>
      </section>

      <section class="rules-section">
        <h3>4. River — Verdict imminent</h3>
        <p>La cinquième et dernière carte commune est révélée.</p>
        <p>À partir de ce moment, aucune mise supplémentaire n’est possible et toutes les mains sont définitivement formées.</p>
      </section>

      <section class="rules-section">
        <h3>5. Résultat — Attribution des gains</h3>
        <p>La meilleure combinaison de 5 cartes remporte la manche.</p>
        <p>Vos gains sont calculés en fonction de vos mises et des cotes au moment exact où vous avez parié.</p>
        <p>Deux joueurs ayant misé sur la même main peuvent donc gagner des montants différents.</p>
      </section>

      <section class="rules-section">
        <h3>Types de mises</h3>
        <p><strong>Une main spécifique :</strong> pariez sur un joueur précis, ou sur l’égalité, que vous pensez gagnant.</p>
        <p><strong>Les jackpots :</strong></p>
        <p>• <strong>Jackpot Bronze</strong> : rareté d’entrée, accessible.</p>
        <p>• <strong>Jackpot Argent</strong> : niveau intermédiaire.</p>
        <p>• <strong>Jackpot Or</strong> : niveau premium.</p>
        <p>• <strong>Jackpot Diamant</strong> : niveau prestige, très rare.</p>
        <p>Ces paris sont les plus risqués, mais extrêmement rémunérateurs.</p>
      </section>

      <section class="rules-section">
        <h3>Comprendre les cotes</h3>
        <p>Les cotes reflètent les probabilités de victoire.</p>
        <p><strong>Cote élevée</strong> → faible probabilité, gain important.</p>
        <p><strong>Cote faible</strong> → forte probabilité, gain plus modéré.</p>
        <p>Elles évoluent en permanence en fonction des cartes révélées et de la situation de jeu.</p>
      </section>

      <section class="rules-section">
        <h3>Approche stratégique</h3>
        <p>Corsica Poker est un jeu d’anticipation.</p>
        <p><strong>Prendre position tôt</strong> permet de maximiser les gains potentiels.</p>
        <p><strong>Attendre davantage d’informations</strong> réduit le risque, mais fait souvent baisser les cotes.</p>
        <p>Il faut trouver le bon équilibre entre sécurité et rendement.</p>
      </section>
 `,
 en: `
      <section class="rules-section">
        <h3>Concept</h3>
        <p>Corsica Poker is inspired by Texas Hold’em, with a distinctive twist: you do not play a hand yourself—you bet on the hands of the players at the table.</p>
        <p>You observe a table of virtual players and your objective is to anticipate the outcome of the round in order to place bets at the most opportune moment.</p>
        <p>Each decision balances intuition, game reading and probability analysis.</p>
        <p>The more risk you take, the higher the odds can become—and the larger the payout may be.</p>
        <p><strong>Important:</strong> a hand is considered victorious only if it wins outright. The <strong>Tie</strong> box lets you cover split outcomes.</p>
      </section>

      <section class="rules-section">
        <h3>Round structure</h3>
        <p>Choose the number of players, from 4 to 10, or let the game decide randomly.</p>
        <p>The more players there are, the higher the odds generally become.</p>
        <p>A round unfolds in several stages, each influencing the probabilities and your decisions.</p>
      </section>

      <section class="rules-section">
        <h3>1. Preflop — Initial read</h3>
        <p>Each player receives 2 visible private cards.</p>
        <p>You can assess the starting strength, place your first bets on one or several hands or on the tie outcome, and identify high-value opportunities.</p>
        <p>Betting early often gives access to the best odds.</p>
      </section>

      <section class="rules-section">
        <h3>2. Flop — Early trends</h3>
        <p>Three community cards are revealed.</p>
        <p>Odds are recalculated in real time.</p>
        <p>You may place bets again during this phase.</p>
      </section>

      <section class="rules-section">
        <h3>3. Turn — Confirmation</h3>
        <p>A fourth community card is revealed.</p>
        <p>At this stage, probabilities usually tighten and the range of scenarios narrows.</p>
        <p>It is often the last strategic phase to bet efficiently: the best trade-off between risk and information.</p>
      </section>

      <section class="rules-section">
        <h3>4. River — Final verdict</h3>
        <p>The fifth and last community card is revealed.</p>
        <p>From this point on, no further bets can be placed and every hand is fully formed.</p>
      </section>

      <section class="rules-section">
        <h3>5. Result — Winnings settlement</h3>
        <p>The best 5-card combination wins the round.</p>
        <p>Your winnings are calculated from your stakes and the odds at the exact moment you placed each bet.</p>
        <p>Two players who bet on the same hand can therefore receive different payouts.</p>
      </section>

      <section class="rules-section">
        <h3>Bet types</h3>
        <p><strong>A specific hand:</strong> bet on a particular player, or on the tie outcome, that you believe will win.</p>
        <p><strong>Jackpots:</strong></p>
        <p>• <strong>Bronze Jackpot</strong>: accessible entry rarity.</p>
        <p>• <strong>Silver Jackpot</strong>: intermediate tier.</p>
        <p>• <strong>Gold Jackpot</strong>: premium tier.</p>
        <p>• <strong>Diamond Jackpot</strong>: prestige tier, very rare.</p>
        <p>These bets are the riskiest, but also the most rewarding.</p>
      </section>

      <section class="rules-section">
        <h3>Understanding odds</h3>
        <p>Odds reflect winning probabilities.</p>
        <p><strong>High odds</strong> → low probability, larger payout.</p>
        <p><strong>Low odds</strong> → high probability, more moderate payout.</p>
        <p>They evolve continuously according to the revealed cards and the game situation.</p>
      </section>

      <section class="rules-section">
        <h3>Strategic approach</h3>
        <p>Corsica Poker is a game of anticipation.</p>
        <p><strong>Taking a position early</strong> helps maximize potential returns.</p>
        <p><strong>Waiting for more information</strong> reduces risk, but usually lowers the odds.</p>
        <p>The challenge is to find the right balance between safety and return.</p>
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
 settingsAudio6: "Casino",
 styleClassic: "Classique",
 styleMetal: "Métal",
 stylePremium: "Premium",
 validateBets: "Je valide mes mises",
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
 settingsAudio6: "Casino",
 styleClassic: "Classic",
 styleMetal: "Metal",
 stylePremium: "Premium",
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

const FELT_COLORS = [
  { table: "#0b3d2e", table2: "#07281f", text: "#f3fbf5", muted: "#d7eadc" },  // Vert foncé
  { table: "#556b2f", table2: "#3b4a20", text: "#f8fbe9", muted: "#dde7c8" },  // Vert olive
  { table: "#7a1c1c", table2: "#541212", text: "#fff7f7", muted: "#f0d2d2" },  // Rouge profond
  { table: "#4a2c2a", table2: "#321d1b", text: "#fff8f4", muted: "#e7d6d1" },  // Marron cuir
  { table: "#f5e6ca", table2: "#dcc8a3", text: "#3c2f1d", muted: "#655845" },  // Beige sable
  { table: "#2b2b2b", table2: "#161616", text: "#fafafa", muted: "#cfcfcf" },  // Gris anthracite
  { table: "#cfcfcf", table2: "#aaaaaa", text: "#1e1e1e", muted: "#4b4b4b" },  // Gris anthracite clair
  { table: "#9d4edd", table2: "#6f2dbd", text: "#fcf7ff", muted: "#ead7fb" },  // Violet néon clair
  { table: "#0b1f3a", table2: "#071325", text: "#f4f8ff", muted: "#d7e3f6" },  // Bleu nuit
  { table: "#0f5f3c", table2: "#0a4028", text: "#f2fff8", muted: "#d1ecdd" },  // Vert casino

  { table: "#0b1f3a", table2: "#1e5f74", text: "#f4faff", muted: "#d3e8f1" },  // Dégradé bleu nuit > mer
  { table: "#0b3d2e", table2: "#0f5f3c", text: "#f3fff8", muted: "#d4ebdf" },  // Dégradé verts
  { table: "#5a1f2b", table2: "#7a1c1c", text: "#fff7f8", muted: "#eed1d7" },  // Dégradé bordeaux > rouge
  { table: "#4a2c2a", table2: "#121212", text: "#fff8f2", muted: "#dccdca" },  // Dégradé marron > noir
  { table: "#3a0ca3", table2: "#9d4edd", text: "#fcf8ff", muted: "#e6d9fb" },  // Dégradé violet
  { table: "#f6d36b", table2: "#f5e6ca", text: "#3f2f06", muted: "#6a5724" }   // Dégradé or > sable
];


const SETTINGS_STORAGE_KEY = "corsicaPokerSettings";

