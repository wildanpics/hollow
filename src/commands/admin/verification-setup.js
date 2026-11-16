const { PermissionsBitField, ChannelType } = require("discord.js");
const VERIFICATION_CONFIG = require("../../config/verification");
const { buildVerificationTutorialPayload } = require("../../utils/verificationHelper");

module.exports = {
  name: "verification-setup",
  description: "Kirim panel instruksi Emperor Voice Verification dengan banner dan tombol Waiting Room",
  aliases: ["vsetup", "setup-verifikasi"],
  async executeSlash(interaction) {
    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const hasPerm = interaction.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return interaction.reply({
        content: "❌ Kamu membutuhkan permission **Manage Roles** atau Owner server untuk menjalankan perintah ini.",
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = interaction.guild;
      let targetChannel = interaction.options.getChannel("channel");

      if (!targetChannel) {
        targetChannel = guild.channels.cache.get(VERIFICATION_CONFIG.VERIFICATION_CHANNEL_ID) ||
          await guild.channels.fetch(VERIFICATION_CONFIG.VERIFICATION_CHANNEL_ID).catch(() => null);
      }

      if (!targetChannel) {
        targetChannel = guild.channels.cache.find(c =>
          c.type === ChannelType.GuildText && (c.name.includes("verification") || c.name.includes("verifikasi"))
        );
      }

      if (!targetChannel || !targetChannel.isTextBased()) {
        return interaction.editReply({
          content: "❌ Channel teks untuk verifikasi tidak ditemukan. Tentukan opsi channel saat menjalankan command."
        });
      }

      const payload = buildVerificationTutorialPayload(guild.id);
      const sentMessage = await targetChannel.send(payload);

      return interaction.editReply({
        content: `✅ **Berhasil Mengirim Panel Verifikasi!**\nPanel tutorial verifikasi suara telah dikirim ke <#${targetChannel.id}> (Message ID: \`${sentMessage.id}\`).`
      });
    } catch (err) {
      console.error("[VerificationSetup] Gagal mengirim panel verifikasi:", err);
      return interaction.editReply({
        content: `❌ Gagal mengirim panel verifikasi: ${err.message}`
      });
    }
  },
  async executePrefix(message) {
    const isOwner = message.author.id === message.guild.ownerId;
    const hasPerm = message.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return message.reply("❌ Kamu butuh izin `Manage Roles` atau Owner Server untuk menjalankan perintah ini.");
    }

    const guild = message.guild;
    let targetChannel = message.mentions.channels.first();

    if (!targetChannel) {
      targetChannel = guild.channels.cache.get(VERIFICATION_CONFIG.VERIFICATION_CHANNEL_ID) ||
        await guild.channels.fetch(VERIFICATION_CONFIG.VERIFICATION_CHANNEL_ID).catch(() => null);
    }

    if (!targetChannel || !targetChannel.isTextBased()) {
      return message.reply("❌ Channel teks verifikasi tidak ditemukan.");
    }

    const payload = buildVerificationTutorialPayload(guild.id);
    const sentMessage = await targetChannel.send(payload);

    return message.reply(`✅ **Panel Verifikasi Berhasil Dikirim ke <#${targetChannel.id}>!** (Message ID: \`${sentMessage.id}\`)`);
  }
};
