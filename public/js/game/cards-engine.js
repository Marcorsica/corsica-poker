// ==================================================
// CARDS / ODDS ENGINE
// ==================================================

function makeDeck() {
 const suits = ["S", "H", "D", "C"];
 const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
 const d = [];
 for (const s of suits) for (const r of ranks) d.push({ r, s });
 return d;
}

function shuffleInPlace(a) {
 for (let i = a.length - 1; i > 0; i--) {
 const j = (Math.random() * (i + 1)) | 0;
 [a[i], a[j]] = [a[j], a[i]];
 }
 return a;
}

function draw(deckArr) {
 return deckArr.pop();
}

function cloneCard(c) {
 return { r: c.r, s: c.s };
}

function suitPretty(s) {
 return s === "S" ? "♠" : s === "H" ? "♥" : s === "D" ? "♦" : "♣";
}

function cardToStr(c) {
 const map = { 11: "J", 12: "Q", 13: "K", 14: "A" };
 const rr = map[c.r] || String(c.r);
 return rr + suitPretty(c.s);
}

function cardImage(card) {
 if (!card || typeof card.r === "undefined" || typeof card.s === "undefined") {
 return CARD_BACK_URL;
 }

 const rankMap = {
 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
 10: "0", 11: "J", 12: "Q", 13: "K", 14: "A"
 };

 const suitMap = { S: "S", H: "H", D: "D", C: "C" };
 const r = rankMap[card.r];
 const s = suitMap[card.s];

 if (!r || !s) return CARD_BACK_URL;
 return `https://deckofcardsapi.com/static/img/${r}${s}.png`;
}

function oddsValue(prob) {
 if (!prob || prob <= 0) return null;
 const fair = 1 / prob;
 const withMargin = fair * (1 - CONFIG.margin);
 return Math.round(withMargin * 100) / 100;
}

function isCertainWinProbability(prob) {
 return Number.isFinite(prob) && prob >= 0.999999;
}

function formatOddsDisplay(prob) {
 const ov = oddsValue(prob);
 if (!ov) return "—";
 if (ov < 1.01) return I18N[lang].lowOdds;
 return ov.toFixed(2);
}

function isLowOddsDisplay(v) {
 return v === I18N.fr.lowOdds || v === I18N.en.lowOdds;
}

function computePotentialByPhase(lotsByPhase) {
 const out = { pre: 0, flop: 0, turn: 0 };
 for (const ph of ["pre", "flop", "turn"]) {
 for (const lot of lotsByPhase[ph]) out[ph] += lot.amt * lot.odds;
 }
 return out;
}

function computeTotalFromLots(lotsByPhase) {
 const p = computePotentialByPhase(lotsByPhase);
 return p.pre + p.flop + p.turn;
}

function phasePotentialForHand(hand, ph) {
 if (!hand || !hand.betLots || !hand.betLots[ph]) return 0;
 return hand.betLots[ph].reduce((sum, lot) => sum + (lot.amt * lot.odds), 0);
}

function phasePotentialForTie(ph) {
 if (!tieBet || !tieBet.lots || !tieBet.lots[ph]) return 0;
 return tieBet.lots[ph].reduce((sum, lot) => sum + (lot.amt * lot.odds), 0);
}


