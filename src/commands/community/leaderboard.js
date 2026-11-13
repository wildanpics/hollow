const { buildLeaderboardMessage } = require("../../utils/statsHelper");

module.exports = {
  name: "leaderboard",
  description: "Papan peringkat survivor paling aktif berkontribusi di pulau SOTF",
  aliases: ["top", "halloffame", "peringkat"],
  async executeSlash(interaction) {
    await interaction.deferReply();
    const { embed, files } = await buildLeaderboardMessage(interaction.guild);
    return interaction.editReply({ embeds: [embed], files });
  },
  async executePrefix(message) {
    await message.channel.sendTyping().catch(() => {});
    const { embed, files } = await buildLeaderboardMessage(message.guild);
    return message.reply({ embeds: [embed], files });
  }
};

