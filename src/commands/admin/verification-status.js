const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const VERIFICATION_CONFIG = require("../../config/verification");
const { getQueue, getCurrentSession } = require("../../storage/verificationQueue");

module.exports = {
  name: "verification-status",
  description: "Cek status antrean dan sesi Emperor Voice Verification yang sedang berjalan",
  aliases: ["vstatus", "status-verifikasi"],
  async executeSlash(interaction) {
    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const hasPerm = interaction.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return interaction.reply({
        content: "❌ Kamu membutuhkan permission **Manage Roles** atau Owner server untuk menjalankan perintah ini.",
        ephemeral: true
      });
    }

    const guild = interaction.guild;
    const queue = getQueue(guild.id);
    const session = getCurrentSession(guild.id);

    const embed = new EmbedBuilder()
      .setTitle("🛡️ HOLLOWBORN — EMPEROR VOICE VERIFICATION STATUS")
      .setColor("#00E5FF")
      .setTimestamp();

    // 1. Current Session
    if (session) {
      const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      embed.addFields({
        name: "🔴 SESI AKTIF SEDANG BERJALAN",
        value: `**Survivor:** <@${session.userId}> (\`${session.survivorTag}\`)\n` +
          `**User Tag:** \`${session.userTag || "Unknown"}\`\n` +
          `**Channel:** <#${session.tempChannelId}>\n` +
          `**Durasi:** \`${elapsed} detik\`\n` +
          `**Status:** Memutar Transmisi Suara Kaisar...`,
        inline: false
      });
    } else {
      embed.addFields({
        name: "⚪ SESI AKTIF",
        value: "Tidak ada sesi yang sedang berlangsung (Standby).",
        inline: false
      });
    }

    // 2. Queue List
    if (queue.length > 0) {
      const queueList = queue.slice(0, 10).map((item, index) => {
        const waitingSec = Math.floor((Date.now() - item.queuedAt) / 1000);
        return `\`#${index + 1}\` <@${item.userId}> [**${item.survivorTag}**] • Menunggu ${waitingSec}s`;
      }).join("\n");

      const extra = queue.length > 10 ? `\n*...dan ${queue.length - 10} lainnya.*` : "";

      embed.addFields({
        name: `📋 DAFTAR ANTREAN (${queue.length} Member Menunggu)`,
        value: queueList + extra,
        inline: false
      });
    } else {
      embed.addFields({
        name: "📋 DAFTAR ANTREAN",
        value: "Antrean kosong. Tidak ada member yang menunggu di Waiting Room.",
        inline: false
      });
    }

    // 3. Configuration Info
    embed.addFields({
      name: "⚙️ KONFIGURASI SISTEM",
      value: `🔊 **Waiting Room:** <#${VERIFICATION_CONFIG.WAITING_ROOM_ID}>\n` +
        `🎖️ **Role Diberikan:** <@&${VERIFICATION_CONFIG.SURVIVOR_ROLE_ID}>\n` +
        `⏱️ **Timeout Transmisi:** \`${VERIFICATION_CONFIG.PLAYBACK_TIMEOUT_MS / 1000}s\``,
      inline: false
    });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
  async executePrefix(message) {
    const isOwner = message.author.id === message.guild.ownerId;
    const hasPerm = message.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return message.reply("❌ Kamu butuh izin `Manage Roles` atau Owner Server untuk menjalankan perintah ini.");
    }

    const guild = message.guild;
    const queue = getQueue(guild.id);
    const session = getCurrentSession(guild.id);

    const embed = new EmbedBuilder()
      .setTitle("🛡️ HOLLOWBORN — EMPEROR VOICE VERIFICATION STATUS")
      .setColor("#00E5FF")
      .setTimestamp();

    if (session) {
      const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
      embed.addFields({
        name: "🔴 SESI AKTIF SEDANG BERJALAN",
        value: `**Survivor:** <@${session.userId}> (\`${session.survivorTag}\`)\n` +
          `**Channel:** <#${session.tempChannelId}>\n` +
          `**Durasi:** \`${elapsed} detik\``,
        inline: false
      });
    } else {
      embed.addFields({
        name: "⚪ SESI AKTIF",
        value: "Tidak ada sesi yang sedang berlangsung (Standby).",
        inline: false
      });
    }

    if (queue.length > 0) {
      const queueList = queue.slice(0, 10).map((item, index) => {
        return `\`#${index + 1}\` <@${item.userId}> [**${item.survivorTag}**]`;
      }).join("\n");
      embed.addFields({
        name: `📋 DAFTAR ANTREAN (${queue.length} Member)`,
        value: queueList,
        inline: false
      });
    } else {
      embed.addFields({
        name: "📋 DAFTAR ANTREAN",
        value: "Antrean kosong.",
        inline: false
      });
    }

    return message.reply({ embeds: [embed] });
  }
};
