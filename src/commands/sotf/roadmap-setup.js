const { ChannelType, PermissionsBitField } = require("discord.js");
const {
  loadRoadmapProgress,
  saveRoadmapProgress,
  buildRoadmapDashboard
} = require("../../storage/roadmapStorage");

module.exports = {
  name: "roadmap-setup",
  description: "Pasang panel roadmap permanen dan checklist interaktif di channel server",
  aliases: ["roadmaps-setup", "setup-roadmap"],
  async executeSlash(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const guild = interaction.guild;
      let targetChannel = interaction.options.getChannel("channel");
      if (!targetChannel) {
        const existing = guild.channels.cache.find(c =>
          c.type === ChannelType.GuildText && (c.name.includes("roadmap") || c.name === "🗺️┃roadmap-progres")
        );
        if (existing) {
          targetChannel = existing;
        } else {
          targetChannel = await guild.channels.create({
            name: "🗺️┃roadmap-progres",
            type: ChannelType.GuildText,
            topic: "Pantau progres tamat cerita Sons of The Forest secara realtime dengan tombol ceklis interaktif.",
            reason: `Created by ${interaction.user.tag} for SOTF Roadmap`
          });
        }
      }

      const progress = loadRoadmapProgress();
      const { embed, rows, files } = buildRoadmapDashboard(progress);

      let sentMsg = null;
      if (progress.channelId === targetChannel.id && progress.messageId) {
        sentMsg = await targetChannel.messages.fetch(progress.messageId).catch(() => null);
      }

      if (sentMsg) {
        await sentMsg.edit({ embeds: [embed], components: rows, files });
      } else {
        sentMsg = await targetChannel.send({ embeds: [embed], components: rows, files });
        await sentMsg.pin().catch(() => { });
        progress.channelId = targetChannel.id;
        progress.messageId = sentMsg.id;
        saveRoadmapProgress(progress);
      }

      return interaction.editReply({
        content: `✅ Panel Roadmap Interaktif & Canvas HUD berhasil diperbarui dan disinkronkan di channel <#${targetChannel.id}>!\nSetiap tim menekan tombol nomor, grafik radar & checklist otomatis terupdate secara realtime!`
      });
    } catch (err) {
      console.error("Gagal setup roadmap:", err);
      return interaction.editReply({ content: `❌ Gagal memasang roadmap permanen: ${err.message}` });
    }
  },
  async executePrefix(message) {
    const member = message.member;
    const isOwner = message.guild.ownerId === message.author.id;
    const hasPerm = member && member.permissions && member.permissions.has(PermissionsBitField.Flags.ManageRoles);

    if (!isOwner && !hasPerm) {
      return message.reply("❌ Kamu butuh izin `Manage Roles` atau Owner Server untuk menjalankan `!roadmap-setup`.");
    }

    const guild = message.guild;
    let targetChannel = message.mentions.channels.first();
    if (!targetChannel) {
      const existing = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildText && (c.name.includes("roadmap") || c.name === "🗺️┃roadmap-progres")
      );
      if (existing) {
        targetChannel = existing;
      } else {
        targetChannel = await guild.channels.create({
          name: "🗺️┃roadmap-progres",
          type: ChannelType.GuildText,
          topic: "Pantau progres tamat cerita Sons of The Forest secara realtime dengan tombol ceklis interaktif.",
          reason: `Created by ${message.author.tag} for SOTF Roadmap`
        });
      }
    }

    const progress = loadRoadmapProgress();
    const { embed, rows, files } = buildRoadmapDashboard(progress);

    let sentMsg = null;
    if (progress.channelId === targetChannel.id && progress.messageId) {
      sentMsg = await targetChannel.messages.fetch(progress.messageId).catch(() => null);
    }

    if (sentMsg) {
      await sentMsg.edit({ embeds: [embed], components: rows, files });
    } else {
      sentMsg = await targetChannel.send({ embeds: [embed], components: rows, files });
      await sentMsg.pin().catch(() => { });
      progress.channelId = targetChannel.id;
      progress.messageId = sentMsg.id;
      saveRoadmapProgress(progress);
    }

    return message.reply(`✅ Panel Roadmap Interaktif & Canvas HUD berhasil diperbarui dan disinkronkan di channel <#${targetChannel.id}>!\nSetiap tim menekan tombol nomor, grafik radar & checklist otomatis terupdate secara realtime!`);
  }
};

