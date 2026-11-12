const { loadRoadmapProgress, buildRoadmapDashboard } = require("../../storage/roadmapStorage");

module.exports = {
  name: "roadmap",
  description: "Menampilkan panduan 7 tahapan urutan tamat cerita Sons of The Forest",
  aliases: ["progres", "story", "tamat"],
  async executeSlash(interaction) {
    const progress = loadRoadmapProgress();
    const { embed, rows, files } = buildRoadmapDashboard(progress);
    return interaction.reply({ embeds: [embed], components: rows, files });
  },
  async executePrefix(message) {
    const progress = loadRoadmapProgress();
    const { embed, rows, files } = buildRoadmapDashboard(progress);
    return message.reply({ embeds: [embed], components: rows, files });
  }
};

