const { buildProfileMessage } = require("../../utils/statsHelper");

module.exports = {
  name: "profile",
  description: "Menampilkan kartu ID clearance tactical survival member berbasis Canvas HUD",
  aliases: ["profil", "id", "card"],
  async executeSlash(interaction) {
    const targetUser = interaction.options.getUser("member") || interaction.options.getUser("user") || interaction.user;
    const theme = interaction.options.getString("tema") || "chrome";
    const targetMember = interaction.guild.members.cache.get(targetUser.id) || await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.reply({ content: "Survivor tidak ditemukan di server.", ephemeral: true });
    }

    await interaction.deferReply();
    const { embed, rows, files } = await buildProfileMessage(targetMember, theme);
    return interaction.editReply({ embeds: [embed], components: rows, files });
  },
  async executePrefix(message) {
    const targetUser = message.mentions.users.first() || message.author;
    const targetMember = message.guild.members.cache.get(targetUser.id) || await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) return message.reply("Survivor tidak ditemukan di server.");

    const { embed, rows, files } = await buildProfileMessage(targetMember, "chrome");
    return message.reply({ embeds: [embed], components: rows, files });
  }
};

