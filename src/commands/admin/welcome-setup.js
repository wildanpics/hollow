const {
  ChannelType,
  PermissionsBitField,
  AttachmentBuilder
} = require("discord.js");
const { loadWelcomeConfig, saveWelcomeConfig } = require("../../storage/welcomeStorage");
const { generateWelcomeCanvas } = require("../../canvas-renderers");

async function sendWelcomeSetupPreview(targetChannel, member) {
  const welcomeBuffer = await generateWelcomeCanvas(member);
  const attachment = new AttachmentBuilder(welcomeBuffer, { name: "welcome-tactical.png" });
  return targetChannel.send({
    content: `🚨 **PERINGATAN RADAR:** Survivor baru mendarat di Site 2: <@${member.id}>`,
    files: [attachment]
  });
}

module.exports = {
  name: "welcome-setup",
  description: "Pasang sistem penyambutan Canvas militer otomatis ke channel tertentu",
  aliases: ["welcomesetup", "setup-welcome"],
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
        const existing = guild.channels.cache.find(c =>
          c.type === ChannelType.GuildText && (c.name.includes("welcome") || c.name.includes("selamat-datang") || c.name === "🛬┃selamat-datang")
        );
        if (existing) {
          targetChannel = existing;
        } else {
          targetChannel = await guild.channels.create({
            name: "🛬┃selamat-datang",
            type: ChannelType.GuildText,
            topic: "Pendaratan resmi survivor baru HOLLOWBORN Sons of The Forest dengan Canvas militer otomatis.",
            reason: `Created by ${interaction.user.tag} for Welcome Channel`
          });
        }
      }

      const welcomeCfg = loadWelcomeConfig();
      welcomeCfg.channelId = targetChannel.id;
      welcomeCfg.enabled = true;
      saveWelcomeConfig(welcomeCfg);

      await sendWelcomeSetupPreview(targetChannel, interaction.member);

      return interaction.editReply({
        content: `✅ **Berhasil Setup Welcome Channel!**\nChannel <#${targetChannel.id}> telah ditetapkan sebagai channel resmi penyambutan Canvas militer.`
      });
    } catch (err) {
      console.error("Gagal setup welcome:", err);
      return interaction.editReply({ content: `❌ Gagal setup welcome channel: ${err.message}` });
    }
  },
  async executePrefix(message) {
    const member = message.member;
    const isOwner = message.guild.ownerId === message.author.id;
    const hasPerm = member && member.permissions && member.permissions.has(PermissionsBitField.Flags.ManageRoles);

    if (!isOwner && !hasPerm) {
      return message.reply("❌ Kamu butuh izin `Manage Roles` atau Owner Server untuk menjalankan `!welcome-setup`.");
    }

    const guild = message.guild;
    let targetChannel = message.mentions.channels.first();

    if (!targetChannel) {
      const existing = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildText && (c.name.includes("welcome") || c.name.includes("selamat-datang") || c.name === "🛬┃selamat-datang")
      );
      if (existing) {
        targetChannel = existing;
      } else {
        targetChannel = await guild.channels.create({
          name: "🛬┃selamat-datang",
          type: ChannelType.GuildText,
          topic: "Pendaratan resmi survivor baru HOLLOWBORN Sons of The Forest dengan Canvas militer otomatis.",
          reason: `Created by ${message.author.tag} for Welcome Channel`
        });
      }
    }

    const welcomeCfg = loadWelcomeConfig();
    welcomeCfg.channelId = targetChannel.id;
    welcomeCfg.enabled = true;
    saveWelcomeConfig(welcomeCfg);

    await sendWelcomeSetupPreview(targetChannel, member);

    return message.reply(
      `✅ **Berhasil Setup Welcome Channel!**\n` +
      `Channel <#${targetChannel.id}> telah ditetapkan sebagai channel resmi penyambutan Canvas militer.\n` +
      `Setiap ada member baru yang bergabung ke server, bot akan otomatis mengirimkan **Banner Militer Canvas Full High-Resolution** beserta nomor urut survivor!`
    );
  }
};

