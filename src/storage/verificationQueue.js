const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
const PERSISTENT_FILE = path.join(DATA_DIR, "verification-queue-persistent.json");
const BACKUP_FILE = path.join(DATA_DIR, "verification-queue-persistent.json.bak");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let queueCache = null;

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8").trim();
    if (!raw || raw === "{}" || raw === "null") return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (err) {
    console.error(`[VerificationQueue] Gagal membaca ${path.basename(filePath)}:`, err.message);
  }
  return null;
}

function atomicWriteJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const content = JSON.stringify(data, null, 2);
  const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
  try {
    fs.writeFileSync(tmpPath, content, "utf-8");
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      fs.writeFileSync(filePath, content, "utf-8");
    } catch (fallbackErr) {
      console.error(`[VerificationQueue] Gagal menulis ke ${path.basename(filePath)}:`, fallbackErr.message);
    }
  } finally {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
  }
}

function loadQueueData() {
  if (queueCache) return queueCache;

  const data = safeReadJson(PERSISTENT_FILE) || safeReadJson(BACKUP_FILE) || { guilds: {} };
  if (!data.guilds) data.guilds = {};
  queueCache = data;
  return queueCache;
}

function saveQueueData(data) {
  queueCache = data;
  atomicWriteJson(PERSISTENT_FILE, data);
  try {
    fs.copyFileSync(PERSISTENT_FILE, BACKUP_FILE);
  } catch (_) {}
}

function getGuildState(guildId) {
  const data = loadQueueData();
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      queue: [],
      currentSession: null,
      history: []
    };
    saveQueueData(data);
  }
  return data.guilds[guildId];
}

function isUserInQueue(guildId, userId) {
  const state = getGuildState(guildId);
  return state.queue.some(item => item.userId === userId);
}

function isUserInSession(guildId, userId) {
  const state = getGuildState(guildId);
  return state.currentSession && state.currentSession.userId === userId;
}

function getQueue(guildId) {
  const state = getGuildState(guildId);
  return [...state.queue];
}

function getCurrentSession(guildId) {
  const state = getGuildState(guildId);
  return state.currentSession ? { ...state.currentSession } : null;
}

function getMemberPosition(guildId, userId) {
  const state = getGuildState(guildId);
  if (state.currentSession && state.currentSession.userId === userId) {
    return 0; // Currently in progress
  }
  const index = state.queue.findIndex(item => item.userId === userId);
  return index !== -1 ? index + 1 : -1;
}

function enqueueMember(guildId, member, survivorTag = null) {
  const data = loadQueueData();
  const state = getGuildState(guildId);

  // Check if currently being verified
  if (state.currentSession && state.currentSession.userId === member.id) {
    return { enqueued: false, position: 0, reason: "ACTIVE_SESSION" };
  }

  // Check if already in queue
  const existingIdx = state.queue.findIndex(item => item.userId === member.id);
  if (existingIdx !== -1) {
    return { enqueued: false, position: existingIdx + 1, reason: "ALREADY_QUEUED" };
  }

  const tag = survivorTag || `HB-${String(member.guild.memberCount || 1).padStart(4, "0")}`;
  const queueItem = {
    userId: member.id,
    username: member.user.username,
    displayName: member.displayName || member.user.username,
    survivorTag: tag,
    queuedAt: Date.now()
  };

  state.queue.push(queueItem);
  saveQueueData(data);

  return { enqueued: true, position: state.queue.length, item: queueItem };
}

function dequeueNext(guildId) {
  const data = loadQueueData();
  const state = getGuildState(guildId);
  if (state.queue.length === 0) return null;

  const next = state.queue.shift();
  saveQueueData(data);
  return next;
}

function peekNext(guildId) {
  const state = getGuildState(guildId);
  return state.queue[0] || null;
}

function removeMember(guildId, userId) {
  const data = loadQueueData();
  const state = getGuildState(guildId);
  const initialLength = state.queue.length;
  state.queue = state.queue.filter(item => item.userId !== userId);

  if (state.queue.length !== initialLength) {
    saveQueueData(data);
    return true;
  }
  return false;
}

function setCurrentSession(guildId, sessionData) {
  const data = loadQueueData();
  const state = getGuildState(guildId);
  state.currentSession = sessionData;
  saveQueueData(data);
}

function clearCurrentSession(guildId) {
  const data = loadQueueData();
  const state = getGuildState(guildId);
  state.currentSession = null;
  saveQueueData(data);
}

function recordHistory(guildId, record) {
  const data = loadQueueData();
  const state = getGuildState(guildId);
  if (!state.history) state.history = [];
  state.history.unshift({
    ...record,
    timestamp: Date.now()
  });
  if (state.history.length > 50) {
    state.history = state.history.slice(0, 50);
  }
  saveQueueData(data);
}

function clearQueue(guildId) {
  const data = loadQueueData();
  const state = getGuildState(guildId);
  state.queue = [];
  saveQueueData(data);
}

module.exports = {
  loadQueueData,
  getGuildState,
  isUserInQueue,
  isUserInSession,
  getQueue,
  getCurrentSession,
  getMemberPosition,
  enqueueMember,
  dequeueNext,
  peekNext,
  removeMember,
  setCurrentSession,
  clearCurrentSession,
  recordHistory,
  clearQueue
};
