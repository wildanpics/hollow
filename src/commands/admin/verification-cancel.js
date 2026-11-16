const { PermissionsBitField } = require("discord.js");
const { cancelActiveSession, triggerQueueProcessing } = require("../../utils/voiceVerificationManager");
const { clearQueue, getCurrentSession, removeMember } = require("../../storage/verificationQueue");

module.exports = {
  name: "verification-cancel",
  description: "Batalkan sesi verifikasi suara yang macet atau bersihkan antrean",
  aliases: ["vcancel", "cancel-verifikasi"],
  async executeSlash(interaction) {
    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const hasPerm = interaction.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return interaction.reply({
        content: "❌ Kamu membutuhkan permission **Manage Roles** atau Owner server untuk menjalankan perintah ini.",
        ephemeral: true
      });
    }

    const action = interaction.options.getString("aksi") || "session";
    const targetUser = interaction.options.getUser("member");
    const guild = interaction.guild;

    if (action === "clear_queue") {
      clearQueue(guild.id);
      return interaction.reply({
        content: "🧹 **Antrean Berhasil Dibersihkan!** Seluruh antrean verifikasi suara telah di-reset.",
        ephemeral: true
      });
    }

    if (targetUser) {
      const removed = removeMember(guild.id, targetUser.id);
      if (removed) {
        return interaction.reply({
          content: `✅ Member <@${targetUser.id}> berhasil dihapus dari antrean verifikasi.`,
          ephemeral: true
        });
      }
      // If currently active
      const session = getCurrentSession(guild.id);
      if (session && session.userId === targetUser.id) {
        cancelActiveSession(guild.id, `Admin ${interaction.user.tag} membatalkan sesi member`);
        return interaction.reply({
          content: `🛑 Sesi verifikasi aktif untuk <@${targetUser.id}> berhasil dibatalkan.`,
          ephemeral: true
        });
      }
      return interaction.reply({
        content: `⚠️ Member <@${targetUser.id}> tidak ditemukan dalam antrean atau sesi aktif.`,
        ephemeral: true
      });
    }

    // Default: Cancel current running session
    const session = getCurrentSession(guild.id);
    if (!session) {
      return interaction.reply({
        content: "ℹ️ Tidak ada sesi verifikasi yang sedang berjalan.",
        ephemeral: true
      });
    }

    cancelActiveSession(guild.id, `Dibatalkan oleh Admin ${interaction.user.tag}`);

    // Trigger next in queue after short pause
    setTimeout(() => {
      triggerQueueProcessing(guild);
    }, 2000);

    return interaction.reply({
      content: `🛑 **Sesi Verifikasi Dibatalkan!**\nSesi untuk <@${session.userId}> [${session.survivorTag}] telah dihentikan, dan sistem akan memproses antrean berikutnya.`,
      ephemeral: true
    });
  },
  async executePrefix(message) {
    const isOwner = message.author.id === message.guild.ownerId;
    const hasPerm = message.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return message.reply("❌ Kamu butuh izin `Manage Roles` atau Owner Server untuk menjalankan perintah ini.");
    }

    const guild = message.guild;
    const session = getCurrentSession(guild.id);

    if (!session) {
      return message.reply("ℹ️ Tidak ada sesi verifikasi yang sedang berjalan.");
    }

    cancelActiveSession(guild.id, `Dibatalkan oleh Admin ${message.author.tag}`);
    setTimeout(() => {
      triggerQueueProcessing(guild);
    }, 2000);

    return message.reply(`🛑 **Sesi Verifikasi Dibatalkan!** Sesi untuk <@${session.userId}> [${session.survivorTag}] dihentikan.`);
  }
};
