const { performance } = require('perf_hooks');

const {
  computeOdds,
  getResult,
  createDeck
} = require('./server/src/app');

const NB_SIMULATIONS = Number(process.argv[2] || 5000);
const PLAYERS = Number(process.argv[3] || 6);
const PAYOUT_FACTOR = Number(process.argv[4] || 0.95);

function shuffle(deck) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function simulateGame() {
  const deck = shuffle(createDeck());
  const hands = [];
  for (let i = 0; i < PLAYERS; i++) hands.push([deck.pop(), deck.pop()]);

  const oddsPreflop = computeOdds({ hands, board: [] });
  const betHandIndex = Math.floor(Math.random() * PLAYERS);
  const betProb = oddsPreflop.hands[betHandIndex].soloProb;
  const betOdds = betProb > 0 ? (1 / betProb) * PAYOUT_FACTOR : 0;

  const board = [];
  while (board.length < 5) board.push(deck.pop());

  const result = getResult({ hands, board });
  return result.winnerType === 'single' && result.winners[0] === betHandIndex ? betOdds : 0;
}

let totalBet = 0;
let totalWon = 0;
const t0 = performance.now();

for (let i = 0; i < NB_SIMULATIONS; i++) {
  totalBet += 1;
  totalWon += simulateGame();
}

const t1 = performance.now();
console.log('=================================');
console.log('SIMULATION RTP PREFLOP');
console.log('=================================');
console.log('Simulations :', NB_SIMULATIONS);
console.log('Joueurs :', PLAYERS);
console.log('Facteur paiement :', PAYOUT_FACTOR);
console.log('Total misé :', totalBet);
console.log('Total payé :', totalWon.toFixed(2));
console.log('RTP :', ((totalWon / totalBet) * 100).toFixed(2) + '%');
console.log('Durée :', Math.round((t1 - t0) / 1000), 'sec');
console.log('=================================');
