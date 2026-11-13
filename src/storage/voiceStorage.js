const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
const VOICE_FILE = path.join(DATA_DIR, "voice-stats.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory active voice sessions: userId => { joinTime, channelId, channelName, guildId }
const activeVoiceSessions = new Map();

let voiceStatsCache = null;

function loadVoiceStats() {
  if (voiceStatsCache) return voiceStatsCache;
  try {
    if (fs.existsSync(VOICE_FILE)) {
      const raw = fs.readFileSync(VOICE_FILE, "utf-8");
      voiceStatsCache = JSON.parse(raw);
    } else {
      voiceStatsCache = {};
      fs.writeFileSync(VOICE_FILE, JSON.stringify(voiceStatsCache, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("[VoiceStorage] Gagal memuat voice-stats.json:", err.message);
    voiceStatsCache = {};
  }
  return voiceStatsCache;
}

function saveVoiceStats() {
  try {
    if (!voiceStatsCache) voiceStatsCache = {};
    fs.writeFileSync(VOICE_FILE, JSON.stringify(voiceStatsCache, null, 2), "utf-8");
  } catch (err) {
    console.error("[VoiceStorage] Gagal menyimpan voice-stats.json:", err.message);
  }
}

function handleVoiceJoin(member, channel) {
  if (!member || !member.user || member.user.bot || !channel) return;
  const userId = member.id;

  // Flush previous session if still marked active
  if (activeVoiceSessions.has(userId)) {
    flushUserSession(userId);
  }

  activeVoiceSessions.set(userId, {
    joinTime: Date.now(),
    channelId: channel.id,
    channelName: channel.name,
    guildId: channel.guild ? channel.guild.id : null
  });
}

function handleVoiceLeave(member, channel) {
  if (!member || !member.user || member.user.bot) return;
  const userId = member.id;

  if (activeVoiceSessions.has(userId)) {
    const session = activeVoiceSessions.get(userId);
    const elapsedSec = Math.max(0, Math.floor((Date.now() - session.joinTime) / 1000));

    const stats = loadVoiceStats();
    if (!stats[userId]) {
      stats[userId] = {
        totalSeconds: 0,
        totalSessions: 0,
        lastActive: new Date().toISOString(),
        lastChannelName: channel?.name || session.channelName || "Voice Room"
      };
    }

    stats[userId].totalSeconds = (stats[userId].totalSeconds || 0) + elapsedSec;
    stats[userId].totalSessions = (stats[userId].totalSessions || 0) + 1;
    stats[userId].lastActive = new Date().toISOString();
    stats[userId].lastChannelName = channel?.name || session.channelName || "Voice Room";

    activeVoiceSessions.delete(userId);
    saveVoiceStats();
  }
}

function handleVoiceSwitch(member, oldChannel, newChannel) {
  if (!member || !member.user || member.user.bot) return;
  handleVoiceLeave(member, oldChannel);
  handleVoiceJoin(member, newChannel);
}

function flushUserSession(userId) {
  if (!activeVoiceSessions.has(userId)) return;
  const session = activeVoiceSessions.get(userId);
  const now = Date.now();
  const elapsedSec = Math.max(0, Math.floor((now - session.joinTime) / 1000));

  if (elapsedSec > 0) {
    const stats = loadVoiceStats();
    if (!stats[userId]) {
      stats[userId] = {
        totalSeconds: 0,
        totalSessions: 0,
        lastActive: new Date().toISOString(),
        lastChannelName: session.channelName || "Voice Room"
      };
    }
    stats[userId].totalSeconds = (stats[userId].totalSeconds || 0) + elapsedSec;
    stats[userId].lastActive = new Date().toISOString();
    stats[userId].lastChannelName = session.channelName || "Voice Room";
    // Reset anchor time to now
    session.joinTime = now;
  }
}

function flushAllActiveSessions() {
  if (activeVoiceSessions.size === 0) return;
  for (const userId of activeVoiceSessions.keys()) {
    flushUserSession(userId);
  }
  saveVoiceStats();
}

function getUserVoiceSeconds(userId) {
  const stats = loadVoiceStats();
  let total = stats[userId]?.totalSeconds || 0;
  if (activeVoiceSessions.has(userId)) {
    const session = activeVoiceSessions.get(userId);
    const activeSec = Math.max(0, Math.floor((Date.now() - session.joinTime) / 1000));
    total += activeSec;
  }
  return total;
}

function isUserInVoice(userId) {
  return activeVoiceSessions.has(userId);
}

function formatVoiceDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds < 60) return "< 1 Menit";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} Menit`;
  }
  if (minutes === 0) {
    return `${hours} Jam`;
  }
  return `${hours} Jam ${minutes} Menit`;
}

function formatVoiceShort(totalSeconds) {
  if (!totalSeconds || totalSeconds < 60) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}j`;
  }
  return `${hours}j ${minutes}m`;
}

async function getTopVoiceSurvivors(guild, limit = 10) {
  const stats = loadVoiceStats();
  if (!guild) return [];

  // Ensure member cache is loaded
  try {
    await guild.members.fetch().catch(() => {});
  } catch (_) {}

  const members = guild.members.cache.filter(m => !m.user.bot);
  const list = [];

  for (const [id, member] of members) {
    const totalSeconds = getUserVoiceSeconds(id);
    const isLive = isUserInVoice(id);

    list.push({
      id,
      member,
      user: member.user,
      displayName: member.displayName || member.user.username,
      totalSeconds,
      timeDisplay: formatVoiceDuration(totalSeconds),
      shortDisplay: formatVoiceShort(totalSeconds),
      isLive,
      score: totalSeconds // For compatibility with canvas / rank functions
    });
  }

  // Sort descending by total voice seconds
  list.sort((a, b) => b.totalSeconds - a.totalSeconds);

  // Return top N
  return list.slice(0, limit).map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

let intervalStarted = false;
function initVoiceTracking(client) {
  loadVoiceStats();

  // Scan all voice channels to catch existing users currently in VC
  try {
    client.guilds.cache.forEach(guild => {
      guild.channels.cache.forEach(channel => {
        if (channel.isVoiceBased && channel.isVoiceBased()) {
          channel.members.forEach(member => {
            if (!member.user.bot && !activeVoiceSessions.has(member.id)) {
              activeVoiceSessions.set(member.id, {
                joinTime: Date.now(),
                channelId: channel.id,
                channelName: channel.name,
                guildId: guild.id
              });
            }
          });
        }
      });
    });
    console.log(`[VoiceStorage] Active voice tracking diinisialisasi. Memantau ${activeVoiceSessions.size} user di VC.`);
  } catch (err) {
    console.error("[VoiceStorage] Error inisialisasi voice tracking:", err.message);
  }

  // Auto flush active session to file every 60s
  if (!intervalStarted) {
    intervalStarted = true;
    setInterval(() => {
      flushAllActiveSessions();
    }, 60000);

    // Save on graceful exit
    process.on("SIGINT", () => {
      flushAllActiveSessions();
    });
    process.on("SIGTERM", () => {
      flushAllActiveSessions();
    });
  }
}

module.exports = {
  loadVoiceStats,
  saveVoiceStats,
  handleVoiceJoin,
  handleVoiceLeave,
  handleVoiceSwitch,
  getUserVoiceSeconds,
  isUserInVoice,
  formatVoiceDuration,
  formatVoiceShort,
  getTopVoiceSurvivors,
  initVoiceTracking,
  flushAllActiveSessions,
  activeVoiceSessions
};
