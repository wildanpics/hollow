const { Events } = require("discord.js");
const { buildGeneralHelpEmbed, buildHelpSelectMenu } = require("../commands/general/help");

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot || !message.inGuild()) return;

    const raw = message.content.trim();
    const lower = raw.toLowerCase();
    const isMentioned = message.mentions.has(client.user.id);

    // 1. Natural Mention Shortcuts
    if (isMentioned) {
      if (lower.includes("tips")) {
        const cmd = client.commands.get("tips");
        if (cmd) return cmd.executePrefix(message, []);
      }
      if (lower.includes("profile")) {
        const cmd = client.commands.get("profile");
        if (cmd) return cmd.executePrefix(message, []);
      }
      if (lower.includes("map")) {
        const cmd = client.commands.get("map");
        if (cmd) return cmd.executePrefix(message, []);
      }
      if (lower.includes("top") || lower.includes("leaderboard")) {
        const cmd = client.commands.get("leaderboard");
        if (cmd) return cmd.executePrefix(message, []);
      }
      if (lower.includes("help") || lower.includes("panduan")) {
        const cmd = client.commands.get("help");
        if (cmd) return cmd.executePrefix(message, []);
      }
      if (lower.includes("role-preset")) {
        const cmd = client.commands.get("role-preset");
        if (cmd) return cmd.executePrefix(message, []);
      }
      if (lower.includes("role-list")) {
        const cmd = client.commands.get("role-list");
        if (cmd) return cmd.executePrefix(message, []);
      }

      // Default Greeting & Menu when mentioned alone
      const words = raw.split(/\s+/).filter(w => !w.startsWith("<@"));
      if (words.length === 0) {
        const embed = buildGeneralHelpEmbed();
        const menuRow = buildHelpSelectMenu();
        return message.reply({
          content: "🌲 **Halo Survivor!** Butuh bantuan perintah bot?",
          embeds: [embed],
          components: [menuRow]
        });
      }
    }

    // 2. Prefix Commands (Starts with !)
    if (!raw.startsWith("!")) return;

    const args = raw.slice(1).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    // Check by command name or registered alias
    const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));

    if (!command) return;

    try {
      await command.executePrefix(message, args);
    } catch (error) {
      console.error(`[Prefix Error - !${commandName}]:`, error);
      return message.reply(`❌ Terjadi kesalahan saat menjalankan perintah: ${error.message}`).catch(() => {});
    }
  }
};

