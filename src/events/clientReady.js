const { Events, ActivityType } = require("discord.js");
const { startMabarReminderInterval, loadMabarSessions } = require("../utils/mabarManager");
const { initVoiceTracking } = require("../storage/voiceStorage");
const { initVoiceVerificationRecovery } = require("../utils/voiceVerificationManager");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`HOLLOWBORN online sebagai ${client.user.tag}`);
    client.user.setActivity("HOLLOWBORN | Survival", {
      type: ActivityType.Playing
    });

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
