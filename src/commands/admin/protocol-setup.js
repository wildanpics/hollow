const { PermissionsBitField, ChannelType } = require("discord.js");
const { buildProtocolPanel } = require("../../utils/protocolHelper");

module.exports = {
  name: "protocol-setup",
  description: "Kirim panel interaktif Protokol Server HOLLOWBORN (Chapter Navigator)",
  aliases: ["psetup", "setup-protocol"],
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
        targetChannel = guild.channels.cache.get("1571908999329087628") ||
          await guild.channels.fetch("1571908999329087628").catch(() => null);
      }

      if (!targetChannel) {
        targetChannel = guild.channels.cache.find(c =>
          c.type === ChannelType.GuildText && (c.name.includes("protocol") || c.name.includes("aturan") || c.name.includes("rules"))
        );
      }

      if (!targetChannel || !targetChannel.isTextBased()) {
        return interaction.editReply({
          content: "❌ Channel teks untuk protokol server tidak ditemukan."
        });
      }

      // Bersihkan pesan lama bot jika ada di channel tersebut
      const oldMessages = await targetChannel.messages.fetch({ limit: 10 }).catch(() => null);
      if (oldMessages) {
        const botMsgs = oldMessages.filter(m => m.author.id === interaction.client.user.id);
        for (const [_, msg] of botMsgs) {
          await msg.delete().catch(() => {});
        }
      }

      const payload = buildProtocolPanel("overview", "id");
      const sentMsg = await targetChannel.send(payload);

      return interaction.editReply({
        content: `✅ **Berhasil Memasang Panel Protokol Server!**\nPanel interaktif bab navigator telah aktif di <#${targetChannel.id}> (Message ID: \`${sentMsg.id}\`).`
      });
    } catch (err) {
      console.error("[ProtocolSetup] Gagal:", err);
      return interaction.editReply({ content: `❌ Gagal memasang protokol: ${err.message}` });
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
      targetChannel = guild.channels.cache.get("1571908999329087628") ||
        await guild.channels.fetch("1571908999329087628").catch(() => null);
    }

    if (!targetChannel || !targetChannel.isTextBased()) {
      return message.reply("❌ Channel teks protokol tidak ditemukan.");
    }

    const oldMessages = await targetChannel.messages.fetch({ limit: 10 }).catch(() => null);
    if (oldMessages) {
      const botMsgs = oldMessages.filter(m => m.author.id === message.client.user.id);
      for (const [_, msg] of botMsgs) {
        await msg.delete().catch(() => {});
      }
    }

    const payload = buildProtocolPanel("overview", "id");
    const sentMsg = await targetChannel.send(payload);

    return message.reply(`✅ **Panel Protokol Berhasil Dipasang ke <#${targetChannel.id}>!** (Message ID: \`${sentMsg.id}\`)`);
  }
};
