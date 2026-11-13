const { buildLeaderboardMessage } = require("../../utils/statsHelper");

module.exports = {
  name: "leaderboard",
  description: "Papan peringkat Top 10 survivor paling aktif di Voice Channel (VC)",
  aliases: ["top", "halloffame", "peringkat", "voiceleaderboard", "vc"],
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

