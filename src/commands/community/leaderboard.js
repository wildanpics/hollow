const { buildLeaderboardMessage } = require("../../utils/statsHelper");

module.exports = {
  name: "leaderboard",
  description: "Papan peringkat survivor paling aktif berkontribusi di pulau SOTF",
  aliases: ["top", "halloffame", "peringkat"],
  async executeSlash(interaction) {
    const { embed, files } = await buildLeaderboardMessage(interaction.guild);
    return interaction.reply({ embeds: [embed], files });
  },
  async executePrefix(message) {
    const { embed, files } = await buildLeaderboardMessage(message.guild);
    return message.reply({ embeds: [embed], files });
  }
};

