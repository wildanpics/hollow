const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
const PERSISTENT_VOICE_FILE = path.join(DATA_DIR, "voice-stats-persistent.json");
const BACKUP_VOICE_FILE = path.join(DATA_DIR, "voice-stats-persistent.json.bak");
const LEGACY_VOICE_FILE = path.join(DATA_DIR, "voice-stats.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory active voice sessions: userId => { joinTime, channelId, channelName, guildId, displayName, username, avatarURL }
const activeVoiceSessions = new Map();

let voiceStatsCache = null;

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8").trim();
    if (!raw || raw === "{}" || raw === "null") return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error(`[VoiceStorage] Gagal parse ${path.basename(filePath)}:`, err.message);
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
    // Fallback direct write if atomic rename is blocked
    try {
      fs.writeFileSync(filePath, content, "utf-8");
    } catch (fallbackErr) {
      console.error(`[VoiceStorage] Gagal menulis ke ${path.basename(filePath)}:`, fallbackErr.message);
    }
  } finally {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
  }
}

function loadVoiceStats() {
  if (voiceStatsCache && Object.keys(voiceStatsCache).length > 0) {
    return voiceStatsCache;
  }

  // 1. Coba baca file persisten (kebal git pull / git reset)
  let loaded = safeReadJson(PERSISTENT_VOICE_FILE);

  // 2. Fallback ke file backup jika file persisten kosong/korup
  if (!loaded || Object.keys(loaded).length === 0) {
    const backup = safeReadJson(BACKUP_VOICE_FILE);
    if (backup && Object.keys(backup).length > 0) {
      console.log(`[VoiceStorage] Berhasil memulihkan ${Object.keys(backup).length} data voice dari backup.`);
      loaded = backup;
    }
  }

  // 3. Fallback ke legacy voice-stats.json jika baru migrasi
  if (!loaded || Object.keys(loaded).length === 0) {
    const legacy = safeReadJson(LEGACY_VOICE_FILE);
    if (legacy && Object.keys(legacy).length > 0) {
      console.log(`[VoiceStorage] Mengimpor ${Object.keys(legacy).length} data voice dari legacy voice-stats.json.`);
      loaded = legacy;
    }
  }

  voiceStatsCache = loaded || voiceStatsCache || {};

  // Jika ada data yang dimuat, langsung sinkronkan ke persisten & backup
  if (Object.keys(voiceStatsCache).length > 0) {
    saveVoiceStats();
  }

  return voiceStatsCache;
}

function saveVoiceStats() {
  try {
    if (!voiceStatsCache) voiceStatsCache = {};

    // 1. Simpan secara atomik ke file persisten (git-ignored)
    atomicWriteJson(PERSISTENT_VOICE_FILE, voiceStatsCache);

    // 2. Simpan backup berkala jika ada data valid
    if (Object.keys(voiceStatsCache).length > 0) {
      try {
        fs.copyFileSync(PERSISTENT_VOICE_FILE, BACKUP_VOICE_FILE);
      } catch (_) {}
    }

    // 3. Sinkronkan juga ke legacy file untuk backward-compatibility
    atomicWriteJson(LEGACY_VOICE_FILE, voiceStatsCache);
  } catch (err) {
    console.error("[VoiceStorage] Gagal menyimpan voice stats:", err.message);
  }
}

function handleVoiceJoin(member, channel) {
  if (!member || !member.user || member.user.bot || !channel) return;
  const userId = member.id;

  // Flush previous session if still marked active
  if (activeVoiceSessions.has(userId)) {
    flushUserSession(userId);
  }

  let avatarURL = null;
  try {
    avatarURL = member.displayAvatarURL ? member.displayAvatarURL({ extension: "png", size: 128 }) : null;
  } catch (_) {}

  const displayName = member.displayName || member.user.username;
  const username = member.user.username;

  activeVoiceSessions.set(userId, {
    joinTime: Date.now(),
    channelId: channel.id,
    channelName: channel.name,
    guildId: channel.guild ? channel.guild.id : null,
    displayName,
    username,
    avatarURL
  });

  // Pastikan data profil tercatat di stats cache
  const stats = loadVoiceStats();
  if (!stats[userId]) {
    stats[userId] = {
      userId,
      displayName,
      username,
      avatarURL,
      totalSeconds: 0,
      totalSessions: 0,
      lastActive: new Date().toISOString(),
      lastChannelName: channel.name
    };
  } else {
    stats[userId].displayName = displayName;
    stats[userId].username = username;
    if (avatarURL) stats[userId].avatarURL = avatarURL;
  }
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
        userId,
        displayName: member.displayName || session.displayName || member.user.username,
        username: member.user.username || session.username,
        avatarURL: session.avatarURL || null,
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
    stats[userId].displayName = member.displayName || session.displayName || stats[userId].displayName;
    stats[userId].username = member.user.username || session.username || stats[userId].username;

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
        userId,
        displayName: session.displayName || "Survivor",
        username: session.username || "Survivor",
        avatarURL: session.avatarURL || null,
        totalSeconds: 0,
        totalSessions: 0,
        lastActive: new Date().toISOString(),
        lastChannelName: session.channelName || "Voice Room"
      };
    }
    stats[userId].totalSeconds = (stats[userId].totalSeconds || 0) + elapsedSec;
    stats[userId].lastActive = new Date().toISOString();
    stats[userId].lastChannelName = session.channelName || "Voice Room";
    if (session.displayName) stats[userId].displayName = session.displayName;
    if (session.username) stats[userId].username = session.username;
    if (session.avatarURL) stats[userId].avatarURL = session.avatarURL;

    // Reset anchor time to now
    session.joinTime = now;
  }
}

function flushAllActiveSessions() {
  if (activeVoiceSessions.size === 0) {
    if (voiceStatsCache && Object.keys(voiceStatsCache).length > 0) {
      saveVoiceStats();
    }
    return;
  }
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

  // 1. Kumpulkan semua user ID yang punya rekaman voice atau sedang live di VC
  const recordedUserIds = new Set([
    ...Object.keys(stats),
    ...activeVoiceSessions.keys()
  ]);

  // 2. Pre-fetch members jika memungkinkan
  try {
    await guild.members.fetch().catch(() => {});
  } catch (_) {}

  const list = [];
  const processedIds = new Set();

  // Pass 1: Tambahkan semua user yang memiliki riwayat durasi voice
  for (const userId of recordedUserIds) {
    const totalSeconds = getUserVoiceSeconds(userId);
    if (totalSeconds <= 0) continue;
    const isLive = isUserInVoice(userId);

    let member = guild.members.cache.get(userId);
    if (!member) {
      try {
        member = await guild.members.fetch(userId).catch(() => null);
      } catch (_) {}
    }

    const stat = stats[userId] || {};
    const displayName = member?.displayName || stat.displayName || stat.username || "Operative";
    const user = member?.user || {
      username: stat.username || displayName,
      displayAvatarURL: () => stat.avatarURL || null
    };

    list.push({
      id: userId,
      member: member || { displayName, user, displayAvatarURL: () => stat.avatarURL || null },
      user,
      displayName,
      totalSeconds,
      timeDisplay: formatVoiceDuration(totalSeconds),
      shortDisplay: formatVoiceShort(totalSeconds),
      isLive,
      score: totalSeconds
    });
    processedIds.add(userId);
  }

  // Pass 2: Jika data kurang dari limit (misal bot baru), isi slot tersisa dari member guild (dengan 0s)
  if (list.length < limit && guild.members?.cache?.size > 0) {
    const remainingMembers = guild.members.cache.filter(m => !m.user?.bot && !processedIds.has(m.id));
    for (const [id, member] of remainingMembers) {
      if (list.length >= limit) break;
      list.push({
        id,
        member,
        user: member.user,
        displayName: member.displayName || member.user?.username || "Survivor",
        totalSeconds: 0,
        timeDisplay: formatVoiceDuration(0),
        shortDisplay: formatVoiceShort(0),
        isLive: isUserInVoice(id),
        score: 0
      });
      processedIds.add(id);
    }
  }

  // Urutkan terbesar ke terkecil
  list.sort((a, b) => b.totalSeconds - a.totalSeconds);

  return list.slice(0, limit).map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

let intervalStarted = false;
let exitHandlersRegistered = false;

function initVoiceTracking(client) {
  loadVoiceStats();

  // Scan semua voice channel untuk memuat user yang sedang aktif saat bot nyala
  try {
    client.guilds.cache.forEach(guild => {
      guild.channels.cache.forEach(channel => {
        if (channel.isVoiceBased && channel.isVoiceBased()) {
          channel.members.forEach(member => {
            if (!member.user.bot && !activeVoiceSessions.has(member.id)) {
              let avatarURL = null;
              try {
                avatarURL = member.displayAvatarURL ? member.displayAvatarURL({ extension: "png", size: 128 }) : null;
              } catch (_) {}

              const displayName = member.displayName || member.user.username;
              const username = member.user.username;

              activeVoiceSessions.set(member.id, {
                joinTime: Date.now(),
                channelId: channel.id,
                channelName: channel.name,
                guildId: guild.id,
                displayName,
                username,
                avatarURL
              });

              // Pastikan metadata user tersimpan di cache
              const stats = loadVoiceStats();
              if (!stats[member.id]) {
                stats[member.id] = {
                  userId: member.id,
                  displayName,
                  username,
                  avatarURL,
                  totalSeconds: 0,
                  totalSessions: 0,
                  lastActive: new Date().toISOString(),
                  lastChannelName: channel.name
                };
              }
            }
          });
        }
      });
    });
    console.log(`[VoiceStorage] Active voice tracking diinisialisasi. Memantau ${activeVoiceSessions.size} user di VC.`);
  } catch (err) {
    console.error("[VoiceStorage] Error inisialisasi voice tracking:", err.message);
  }

  // Auto flush active session ke file setiap 15 detik (sangat cepat & aman dari crash/restart)
  if (!intervalStarted) {
    intervalStarted = true;
    setInterval(() => {
      try {
        flushAllActiveSessions();
      } catch (err) {
        console.error("[VoiceStorage] Error auto-flush:", err.message);
      }
    }, 15000);
  }

  // Daftarkan graceful exit listener
  if (!exitHandlersRegistered) {
    exitHandlersRegistered = true;

    const gracefulExit = (signal) => {
      try {
        console.log(`[VoiceStorage] Sinyal ${signal} diterima. Menyimpan seluruh sesi voice ke storage persisten...`);
        flushAllActiveSessions();
        console.log("[VoiceStorage] Penyimpanan selesai.");
      } catch (err) {
        console.error("[VoiceStorage] Gagal simpan saat graceful exit:", err.message);
      }
      process.exit(0);
    };

    process.on("SIGINT", () => gracefulExit("SIGINT"));
    process.on("SIGTERM", () => gracefulExit("SIGTERM"));
    process.on("beforeExit", () => {
      flushAllActiveSessions();
    });
    process.on("exit", () => {
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
