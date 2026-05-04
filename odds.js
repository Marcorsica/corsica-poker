(function initCorsicaState(global) {
  const state = {
    lang: 'fr',
    phase: 'pre',
    deck: [],
    board: [],
    hands: [],
    selectedBet: 5,
    bankroll: 1000,
    totalWins: 0,
    jackpots: { argent: 250, or: 800, diamant: 8000 },
    oddsSnapshots: { pre: null, flop: null, turn: null, river: null },
    jackpotSnapshots: { pre: null, flop: null, turn: null, river: null },
    jackpotBets: { argent: [], or: [], diamant: [] },
    jackpotRoundStake: { argent: 0, or: 0, diamant: 0 },
    jackpotSyncBusy: false,
    currentHandsCount: 10,
    roundFinished: true,
    tieBet: {
      bets: { pre: 0, flop: 0, turn: 0 },
      lots: { pre: [], flop: [], turn: [] },
      oddsStr: '—',
      preflopOddsStr: '—',
      finalOddsStr: '—',
      resultLabel: '',
    },
    soundEnabled: true,
    ambienceStarted: false,
    isCalculating: false,
    ambienceVolume: 0.2,
    currentAudioStyle: 0,
    casinoLayerEnabled: true,
    ambienceFadeFrame: null,
    suspenseAudio: null,
    suspenseDuckTimer: null,
    isAdvancingPhase: false,
    autoFinishTimer: null,
    lastWinningTargets: [],
    advanceUnlockedForRound: false,
    currentFeltIndex: 9,
    serverGameId: null,
  };

  function defineStateAlias(key) {
    Object.defineProperty(global, key, {
      configurable: true,
      enumerable: true,
      get() {
        return state[key];
      },
      set(value) {
        state[key] = value;
      }
    });
  }

  function setStateValue(key, value) {
    state[key] = value;
    return state[key];
  }

  function patchState(patch) {
    if (!patch || typeof patch !== 'object') return state;
    Object.assign(state, patch);
    return state;
  }

  function resetRoundState() {
    state.phase = 'pre';
    state.deck = [];
    state.board = [];
    state.hands = [];
    state.jackpotBets = { argent: [], or: [], diamant: [] };
    state.oddsSnapshots = { pre: null, flop: null, turn: null, river: null };
    state.jackpotSnapshots = { pre: null, flop: null, turn: null, river: null };
    state.jackpotRoundStake = { argent: 0, or: 0, diamant: 0 };
    state.roundFinished = true;
    state.tieBet = {
      bets: { pre: 0, flop: 0, turn: 0 },
      lots: { pre: [], flop: [], turn: [] },
      oddsStr: '—',
      preflopOddsStr: '—',
      finalOddsStr: '—',
      resultLabel: '',
    };
    state.isCalculating = false;
    state.isAdvancingPhase = false;
    state.autoFinishTimer = null;
    state.lastWinningTargets = [];
    state.advanceUnlockedForRound = false;
    state.serverGameId = null;
    return state;
  }

  global.CorsicaState = state;
  global.setStateValue = setStateValue;
  global.patchState = patchState;
  global.resetRoundState = resetRoundState;

  [
    'lang', 'phase', 'deck', 'board', 'hands', 'selectedBet', 'bankroll', 'totalWins',
    'jackpots', 'oddsSnapshots', 'jackpotSnapshots', 'jackpotBets', 'jackpotRoundStake', 'jackpotSyncBusy', 'currentHandsCount',
    'roundFinished', 'tieBet', 'soundEnabled', 'ambienceStarted', 'isCalculating',
    'ambienceVolume', 'currentAudioStyle', 'casinoLayerEnabled', 'ambienceFadeFrame', 'suspenseAudio', 'suspenseDuckTimer',
    'isAdvancingPhase', 'autoFinishTimer', 'lastWinningTargets', 'advanceUnlockedForRound',
    'currentFeltIndex', 'serverGameId'
  ].forEach(defineStateAlias);
})(window);
