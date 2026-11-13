const { Events, AttachmentBuilder } = require("discord.js");
const { AUTO_ROLE_ID } = require("../config/roles");
const { loadWelcomeConfig } = require("../storage/welcomeStorage");
const { generateWelcomeCanvas } = require("../canvas-renderers");
const { buildLobbyWelcomeEmbed } = require("../utils/statsHelper");

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    // 1. Auto-Role (abaikan akun bot)
    if (member.user?.bot) {
      console.log(`[AutoRole] Melewati auto-role untuk akun bot: ${member.user.tag}`);
    } else {
      try {
        const role = member.guild.roles.cache.get(AUTO_ROLE_ID) || await member.guild.roles.fetch(AUTO_ROLE_ID);
        if (!role) {
          console.warn(`[AutoRole] Role ${AUTO_ROLE_ID} tidak ditemukan di server.`);
        } else {
          await member.roles.add(role, "HOLLOWBORN — Auto Role Member Baru");
          console.log(`[AutoRole] Berhasil memberikan role '${role.name}' kepada member baru: ${member.user.tag}`);
        }
      } catch (error) {
        console.error(`[AutoRole] Gagal memberikan role ke ${member.user.tag}:`, error.message);
      }
    }

    // 2. Military Welcome Canvas Banner (tanpa embed di welcome channel)
    const welcomeCfg = loadWelcomeConfig();
    try {
      let welcomeChannel = null;

      if (welcomeCfg.channelId) {
        welcomeChannel = member.guild.channels.cache.get(welcomeCfg.channelId) || await member.guild.channels.fetch(welcomeCfg.channelId).catch(() => null);
      }

      if (!welcomeChannel) {
        welcomeChannel = member.guild.channels.cache.find(c =>
          c.isTextBased() && (c.name.includes("welcome") || c.name.includes("selamat-datang") || c.name.includes("general") || c.name.includes("chat"))
        ) || member.guild.systemChannel;
      }

      if (welcomeChannel && welcomeCfg.enabled !== false) {
        const welcomeBuffer = await generateWelcomeCanvas(member);
        const attachment = new AttachmentBuilder(welcomeBuffer, { name: "welcome-tactical.png" });

        await welcomeChannel.send({
          content: `🚨 **PERINGATAN RADAR:** Survivor baru mendarat di Site 2: <@${member.id}>`,
          files: [attachment]
        });
        console.log(`[Welcome] Berhasil mengirim welcome canvas banner untuk ${member.user.tag} di channel #${welcomeChannel.name}`);
      }
    } catch (err) {
      console.error("[Welcome] Gagal mengirim welcome banner canvas:", err.message);
    }

    // 3. Welcome Greeting Embed di Channel Lobby (untuk disapa member server)
    try {
      const greetChannelId = welcomeCfg.greetChannelId || "1566751264258400269";
      if (greetChannelId && welcomeCfg.greetEnabled !== false) {
        const greetChannel = member.guild.channels.cache.get(greetChannelId) || await member.guild.channels.fetch(greetChannelId).catch(() => null);
        if (greetChannel && greetChannel.isTextBased()) {
          const payload = buildLobbyWelcomeEmbed(member);
          await greetChannel.send(payload);
          console.log(`[WelcomeGreet] Berhasil mengirim welcome embed sapaan untuk ${member.user.tag} di channel #${greetChannel.name}`);
        } else {
          console.warn(`[WelcomeGreet] Channel ID ${greetChannelId} tidak ditemukan atau bukan text channel.`);
        }
      }
    } catch (err) {
      console.error("[WelcomeGreet] Gagal mengirim welcome embed sapaan:", err.message);
    }
  }
};

