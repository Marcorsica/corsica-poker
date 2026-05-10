'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const LOGS_DIR       = path.join(__dirname, '..', '..', '..', 'logs');
const SERVER_LOG_FILE = path.join(LOGS_DIR, 'corsica-server.log');
const CLIENT_LOG_FILE = path.join(LOGS_DIR, 'corsica-client.log');

fs.mkdirSync(LOGS_DIR, { recursive: true });

function appendLog(filePath, payload) {
  const entry = {
    id:   `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    time: new Date().toISOString(),
    ...payload,
  };
  fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8');
  return entry;
}

function logServer(event, message, data = {}, level = 'info') {
  return appendLog(SERVER_LOG_FILE, { source: 'server', level, event, message, data });
}

function logClient(payload = {}) {
  return appendLog(CLIENT_LOG_FILE, {
    source:  'client',
    level:   payload.level   || 'info',
    event:   payload.event   || 'client.log',
    message: payload.message || '',
    data:    payload.data    || {},
  });
}

module.exports = { logServer, logClient };
