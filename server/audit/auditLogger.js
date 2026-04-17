const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AuditLogger {
  constructor() {
    this.exportsDir = path.join(__dirname, 'exports');
    this.reset();
    fs.mkdirSync(this.exportsDir, { recursive: true });
  }

  reset() {
    this.session = null;
    this.handIndexByGameId = new Map();
  }

  startSession(meta = {}) {
    if (this.session) return this.session;
    this.session = {
      sessionId: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      startTime: new Date().toISOString(),
      version: '1.0',
      meta,
      hands: []
    };
    return this.session;
  }

  endSession(extra = {}) {
    if (!this.session) return null;
    this.session.endTime = new Date().toISOString();
    if (Object.keys(extra).length) this.session.meta = { ...(this.session.meta || {}), ...extra };
    return this.export();
  }

  startHand({ gameId, playerCount, initialBalance = null, serverSeedHash = null, createdAt = null } = {}) {
    this.startSession();
    const hand = {
      handId: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      gameId: gameId || null,
      playerCount: playerCount ?? null,
      startTime: new Date().toISOString(),
      createdAt: createdAt || null,
      initialState: { balance: initialBalance },
      rng: {},
      actions: [],
      streets: {},
      result: {}
    };
    const index = this.session.hands.push(hand) - 1;
    if (gameId) this.handIndexByGameId.set(String(gameId), index);
    return hand;
  }

  getHand(gameId) {
    if (!this.session) return null;
    if (gameId != null && this.handIndexByGameId.has(String(gameId))) {
      return this.session.hands[this.handIndexByGameId.get(String(gameId))] || null;
    }
    return this.session.hands[this.session.hands.length - 1] || null;
  }

  setRNG(gameId, rngData = {}) {
    const hand = this.getHand(gameId);
    if (!hand) return;
    hand.rng = { ...hand.rng, ...rngData };
  }

  logAction(gameId, action = {}) {
    const hand = this.getHand(gameId);
    if (!hand) return;
    hand.actions.push({
      ...action,
      timestamp: new Date().toISOString(),
    });
  }

  logStreet(gameId, name, cards) {
    const hand = this.getHand(gameId);
    if (!hand) return;
    hand.streets[name] = cards;
  }

  logResult(gameId, result = {}) {
    const hand = this.getHand(gameId);
    if (!hand) return;
    hand.result = { ...result };
    hand.endTime = new Date().toISOString();
  }

  export() {
    if (!this.session) return null;
    const fileName = `audit_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(this.exportsDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(this.session, null, 2), 'utf8');
    return filePath;
  }
}

module.exports = new AuditLogger();
