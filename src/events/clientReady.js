const { Events, ActivityType } = require("discord.js");
const { loadRoadmapProgress, syncRoadmapPermanentMessage } = require("../storage/roadmapStorage");
const { startMabarReminderInterval } = require("../utils/mabarManager");

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

    // Start mabar reminder loop
    startMabarReminderInterval(client);
  }
};

