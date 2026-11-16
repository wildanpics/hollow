const { Events, ActivityType } = require("discord.js");
const { loadRoadmapProgress, syncRoadmapPermanentMessage } = require("../storage/roadmapStorage");
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

    // Auto-sync pinned roadmap dashboard with latest Canvas graphic on startup
    const initialRoadmap = loadRoadmapProgress();
    if (initialRoadmap.channelId && initialRoadmap.messageId) {
      await syncRoadmapPermanentMessage(client, initialRoadmap).catch(() => {});
      console.log("[Roadmap] Pinned Roadmap Dashboard tersinkronisasi ke tampilan Canvas HUD terbaru.");
    }

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
