const { PermissionsBitField } = require("discord.js");
const { generatePresetRoles } = require("../../utils/helpers");

module.exports = {
  name: "role-preset",
  description: "Generate seluruh role preset HOLLOWBORN (28 role resmi) secara otomatis",
  aliases: ["preset-role", "init-roles"],
  async executeSlash(interaction) {
    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const hasPerm = interaction.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return interaction.reply({
        content: "❌ Kamu membutuhkan permission **Manage Roles** untuk menggunakan perintah ini.",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });
    try {
      const embed = await generatePresetRoles(interaction.guild);
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return interaction.editReply({ content: `❌ ${err.message}` });
    }
  },
  async executePrefix(message) {
    const isOwner = message.author.id === message.guild.ownerId;
    const hasPermission = message.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPermission) {
      return message.reply("❌ Kamu membutuhkan permission **Manage Roles** untuk menggunakan perintah ini.");
    }

    const waitMsg = await message.reply("⏳ Memproses pembuatan seluruh preset role HOLLOWBORN...");
    try {
      const embed = await generatePresetRoles(message.guild);
      return waitMsg.edit({ content: null, embeds: [embed] });
    } catch (err) {
      return waitMsg.edit({ content: `❌ ${err.message}` });
    }
  }
};

