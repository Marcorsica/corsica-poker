const { performance } = require('perf_hooks');

const {
  computeOdds,
  getResult,
  createDeck,
  rawOddsValue,
  jackpotTierFromRawOdds,
} = require('./server/src/app');

const NB_SIMULATIONS = Number(process.argv[2] || 100);
const PLAYERS = Number(process.argv[3] || 6);
const PHASES = [
  { key: 'pre', boardSize: 0 },
  { key: 'flop', boardSize: 3 },
  { key: 'turn', boardSize: 4 },
];
const TIERS = ['argent', 'or', 'diamant'];

function emptyTierStats() {
  return Object.fromEntries(TIERS.map((tier) => [tier, 0]));
}

function createStats() {
  return {
    opportunities: emptyTierStats(),
    hits: emptyTierStats(),
    phaseOpportunities: Object.fromEntries(PHASES.map((p) => [p.key, emptyTierStats()])),
    phaseHits: Object.fromEntries(PHASES.map((p) => [p.key, emptyTierStats()])),
    targetOpportunities: { hand: emptyTierStats(), tie: emptyTierStats() },
    targetHits: { hand: emptyTierStats(), tie: emptyTierStats() },
    totalSnapshots: 0,
    totalHits: 0,
    tieFinals: 0,
    singleFinals: 0,
  };
}

function shuffle(deck) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function recordOpportunity(stats, snapshot, result) {
  const { tier, phase, targetKind, targetIndex } = snapshot;
  stats.opportunities[tier] += 1;
  stats.phaseOpportunities[phase][tier] += 1;
  stats.targetOpportunities[targetKind][tier] += 1;
  stats.totalSnapshots += 1;

  const isHit = targetKind === 'tie'
    ? result.winnerType === 'tie'
    : result.winnerType === 'single' && result.winners[0] === targetIndex;

  if (isHit) {
    stats.hits[tier] += 1;
    stats.phaseHits[phase][tier] += 1;
    stats.targetHits[targetKind][tier] += 1;
    stats.totalHits += 1;
  }
}

function collectSnapshotsForPhase(hands, board, phase) {
  const odds = computeOdds({ hands, board });
  const snapshots = [];

  for (let i = 0; i < odds.hands.length; i++) {
    const soloProb = Number(odds.hands[i].soloProb || 0);
    const rawOdds = rawOddsValue(soloProb);
    const tier = jackpotTierFromRawOdds(rawOdds, soloProb);
    if (tier) {
      snapshots.push({ phase, targetKind: 'hand', targetIndex: i, rawOdds, winProb: soloProb, tier });
    }
  }

  const tieProb = Number(odds.tieProb || 0);
  const tieRawOdds = rawOddsValue(tieProb);
  const tieTier = jackpotTierFromRawOdds(tieRawOdds, tieProb);
  if (tieTier) {
    snapshots.push({ phase, targetKind: 'tie', targetIndex: -1, rawOdds: tieRawOdds, winProb: tieProb, tier: tieTier });
  }

  return snapshots;
}

function simulateOne(stats) {
  const deck = shuffle(createDeck());
  const hands = [];
  for (let i = 0; i < PLAYERS; i++) {
    hands.push([deck.pop(), deck.pop()]);
  }

  const fullBoard = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
  const result = getResult({ hands, board: fullBoard });
  if (result.winnerType === 'tie') stats.tieFinals += 1;
  else stats.singleFinals += 1;

  for (const phase of PHASES) {
    const boardAtPhase = fullBoard.slice(0, phase.boardSize);
    const snapshots = collectSnapshotsForPhase(hands, boardAtPhase, phase.key);
    for (const snapshot of snapshots) recordOpportunity(stats, snapshot, result);
  }
}

function ratio(count, total) {
  if (!total) return '—';
  return `1 / ${(total / count).toFixed(1)}`;
}

function printTierTable(title, data, denominator) {
  console.log(`\n${title}`);
  console.log('Tier       Count      Frequency');
  console.log('--------------------------------');
  for (const tier of TIERS) {
    const count = data[tier] || 0;
    const freq = count > 0 ? ratio(count, denominator) : '0';
    console.log(`${tier.padEnd(10)} ${String(count).padStart(7)}   ${freq}`);
  }
}

const stats = createStats();
const t0 = performance.now();
console.log('=================================');
console.log('SIMULATION JACKPOTS CORSICA POKER');
console.log('=================================');
console.log('Simulations :', NB_SIMULATIONS);
console.log('Joueurs     :', PLAYERS);
console.log('Phases      : pre / flop / turn');
console.log('Mode        : énumération exacte des cotes');

for (let i = 0; i < NB_SIMULATIONS; i++) {
  simulateOne(stats);
  if ((i + 1) % Math.max(1, Math.floor(NB_SIMULATIONS / 10)) === 0) {
    console.log(`Progression : ${i + 1}/${NB_SIMULATIONS}`);
  }
}

const seconds = ((performance.now() - t0) / 1000).toFixed(1);
console.log('\n=================================');
console.log('RÉSULTATS');
console.log('=================================');
console.log('Durée                    :', `${seconds} sec`);
console.log('Final single winners      :', stats.singleFinals);
console.log('Final ties                :', stats.tieFinals);
console.log('Snapshots jackpot trouvés :', stats.totalSnapshots);
console.log('Hits jackpot théoriques   :', stats.totalHits);

printTierTable('Opportunités jackpot par tier', stats.opportunities, NB_SIMULATIONS);
printTierTable('Hits jackpot théoriques par tier', stats.hits, NB_SIMULATIONS);

console.log('\nDétail opportunités par phase');
for (const phase of PHASES) printTierTable(`Phase ${phase.key}`, stats.phaseOpportunities[phase.key], NB_SIMULATIONS);

console.log('\nDétail hits par phase');
for (const phase of PHASES) printTierTable(`Phase ${phase.key}`, stats.phaseHits[phase.key], NB_SIMULATIONS);

console.log('\nDétail par cible');
printTierTable('Opportunités mains', stats.targetOpportunities.hand, NB_SIMULATIONS);
printTierTable('Opportunités égalité', stats.targetOpportunities.tie, NB_SIMULATIONS);
printTierTable('Hits mains', stats.targetHits.hand, NB_SIMULATIONS);
printTierTable('Hits égalité', stats.targetHits.tie, NB_SIMULATIONS);

console.log('\nLecture simple :');
console.log('- Opportunité = une main ou égalité devient éligible à un jackpot à une phase.');
console.log('- Hit théorique = cette opportunité gagne réellement à la river.');
console.log('- Ce simulateur ne suppose pas que le joueur mise chaque opportunité ; il mesure la fréquence brute.');
console.log('=================================');
