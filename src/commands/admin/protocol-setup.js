const { PermissionsBitField, ChannelType } = require("discord.js");
const { buildProtocolMessage1, buildProtocolMessage2 } = require("../../utils/protocolHelper");

module.exports = {
  name: "protocol-setup",
  description: "Kirim panel Protokol Server HOLLOWBORN dengan banner dan pemilih bahasa (ID/EN)",
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

      const p1 = buildProtocolMessage1("id");
      const msg1 = await targetChannel.send(p1);

      const p2 = buildProtocolMessage2("id");
      const msg2 = await targetChannel.send(p2);

      return interaction.editReply({
        content: `✅ **Berhasil Mengirim Protokol Server!**\nPanel protokol telah dikirim ke <#${targetChannel.id}> (Message 1: \`${msg1.id}\`, Message 2: \`${msg2.id}\`).`
      });
    } catch (err) {
      console.error("[ProtocolSetup] Gagal:", err);
      return interaction.editReply({ content: `❌ Gagal mengirim protokol: ${err.message}` });
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

    const p1 = buildProtocolMessage1("id");
    const msg1 = await targetChannel.send(p1);

    const p2 = buildProtocolMessage2("id");
    const msg2 = await targetChannel.send(p2);

    return message.reply(`✅ **Panel Protokol Berhasil Dikirim ke <#${targetChannel.id}>!** (Message 1: \`${msg1.id}\`, Message 2: \`${msg2.id}\`)`);
  }
};
