const { PermissionsBitField } = require("discord.js");
const { buildWelcomeTestMessage, buildLobbyWelcomeEmbed } = require("../../utils/statsHelper");

module.exports = {
  name: "welcome-test",
  description: "Uji coba kirim banner Canvas militer & embed sapaan member baru",
  aliases: ["welcometest", "testwelcome"],
  async executeSlash(interaction) {
    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const hasPerm = interaction.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return interaction.reply({
        content: "❌ Hanya Admin / Owner server yang dapat melakukan test welcome banner.",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });
    const { content, files } = await buildWelcomeTestMessage(interaction.member);
    await interaction.editReply({ content, files });
    const greetPayload = buildLobbyWelcomeEmbed(interaction.member);
    return interaction.followUp({ ...greetPayload, ephemeral: true });
  },
  async executePrefix(message) {
    const isOwner = message.author.id === message.guild.ownerId;
    const hasPerm = message.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return message.reply("❌ Hanya Admin / Owner server yang dapat melakukan test welcome banner.");
    }
    const { content, files } = await buildWelcomeTestMessage(message.member);
    await message.reply({ content, files });
    const greetPayload = buildLobbyWelcomeEmbed(message.member);
    return message.channel.send(greetPayload);
  }
};

