const { EmbedBuilder } = require("discord.js");
const { getQueue, getCurrentSession, getMemberPosition } = require("../../storage/verificationQueue");
const VERIFICATION_CONFIG = require("../../config/verification");

module.exports = {
  name: "queue",
  description: "Lihat status antrean verifikasi suara dan nomor urut giliranmu",
  aliases: ["antrean", "antrian"],
  async executeSlash(interaction) {
    const guild = interaction.guild;
    const queue = getQueue(guild.id);
    const session = getCurrentSession(guild.id);
    const userPos = getMemberPosition(guild.id, interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle("🎙️ HOLLOWBORN — ANTREAN VERIFIKASI SUARA")
      .setColor("#00E5FF")
      .setTimestamp();

    if (userPos === 0) {
      embed.setDescription(`🟢 **GILIRAN KAMU SEDANG BERJALAN!**\nKamu sedang berada di dalam channel verifikasi suara.`);
    } else if (userPos > 0) {
      embed.setDescription(`🟡 **Nomor Urut Kamu:** \`#${userPos}\` dari ${queue.length} survivor di antrean.\nHarap tetap berada di <#${VERIFICATION_CONFIG.WAITING_ROOM_ID}> hingga bot memindahkanmu!`);
    } else {
      embed.setDescription(`ℹ️ Kamu belum berada di antrean. Masuk ke <#${VERIFICATION_CONFIG.WAITING_ROOM_ID}> untuk memulai verifikasi suara.`);
    }

    if (session) {
      embed.addFields({
        name: "🔴 Sedang Diproses",
        value: `<@${session.userId}> [**${session.survivorTag}**]`,
        inline: true
      });
    } else {
      embed.addFields({
        name: "⚪ Sesi Verifikasi",
        value: "Standby / Kosong",
        inline: true
      });
    }

    embed.addFields({
      name: "👥 Total Menunggu",
      value: `${queue.length} Survivor`,
      inline: true
    });

    if (queue.length > 0) {
      const topList = queue.slice(0, 5).map((item, idx) => {
        const isSelf = item.userId === interaction.user.id ? " **(KAMU)**" : "";
        return `\`#${idx + 1}\` <@${item.userId}> [**${item.survivorTag}**]${isSelf}`;
      }).join("\n");
      const extra = queue.length > 5 ? `\n*...dan ${queue.length - 5} lainnya.*` : "";

      embed.addFields({
        name: "📋 Daftar Terdepan",
        value: topList + extra,
        inline: false
      });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
  async executePrefix(message) {
    const guild = message.guild;
    const queue = getQueue(guild.id);
    const session = getCurrentSession(guild.id);
    const userPos = getMemberPosition(guild.id, message.author.id);

    const embed = new EmbedBuilder()
      .setTitle("🎙️ HOLLOWBORN — ANTREAN VERIFIKASI SUARA")
      .setColor("#00E5FF")
      .setTimestamp();

    if (userPos === 0) {
      embed.setDescription("🟢 **GILIRAN KAMU SEDANG BERJALAN!**");
    } else if (userPos > 0) {
      embed.setDescription(`🟡 **Nomor Urut Kamu:** \`#${userPos}\` dari ${queue.length} survivor.`);
    } else {
      embed.setDescription(`ℹ️ Masuk ke <#${VERIFICATION_CONFIG.WAITING_ROOM_ID}> untuk memulai verifikasi suara.`);
    }

    if (session) {
      embed.addFields({
        name: "🔴 Sedang Diproses",
        value: `<@${session.userId}> [**${session.survivorTag}**]`,
        inline: true
      });
    }

    embed.addFields({
      name: "👥 Total Menunggu",
      value: `${queue.length} Survivor`,
      inline: true
    });

    return message.reply({ embeds: [embed] });
  }
};
