const { Events, ActivityType } = require("discord.js");
const { startMabarReminderInterval, loadMabarSessions } = require("../utils/mabarManager");
const { initVoiceTracking } = require("../storage/voiceStorage");
const { initVoiceVerificationRecovery } = require("../utils/voiceVerificationManager");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`HOLLOWBORN online sebagai ${client.user.tag}`);
    // Dynamic Rotating Presence (15 Detik Rotasi)
    const activities = [
      () => ({ name: "HOLLOWBORN // PROTOCOL", type: ActivityType.Watching }),
      () => ({ name: "Signal Transmission", type: ActivityType.Listening }),
      () => {
        const totalMembers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
        return { name: `${totalMembers.toLocaleString("id-ID")} Operatives`, type: ActivityType.Watching };
      },
      () => ({ name: "BORN FROM NOTHING. UNITED AS ONE", type: ActivityType.Playing })
    ];

    let currentActivityIndex = 0;
    const rotateActivity = () => {
      try {
        const act = activities[currentActivityIndex]();
        client.user.setActivity(act.name, { type: act.type });
        currentActivityIndex = (currentActivityIndex + 1) % activities.length;
      } catch (err) {
        // Abaikan jika terjadi glitch koneksi sesaat saat update presence
      }
    };

    rotateActivity();
    setInterval(rotateActivity, 15000);

    // Load active persistent mabar sessions
    loadMabarSessions();
    console.log("[Mabar] Sesi mabar aktif dimuat dari storage.");

    // Start mabar reminder loop
    startMabarReminderInterval(client);

    // Initialize Voice Activity Tracking & scan VC
    initVoiceTracking(client);

    // Initialize Emperor Voice Verification System & Startup Reconciliation
    await initVoiceVerificationRecovery(client).catch(err => {
      console.error("[VoiceVerification] Gagal menjalankan inisialisasi pemulihan:", err.message);
    });
  }
};
