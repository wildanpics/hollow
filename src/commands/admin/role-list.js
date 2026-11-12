const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "role-list",
  description: "Menampilkan daftar seluruh role server HOLLOWBORN beserta kode warna HEX",
  aliases: ["roles", "list-roles"],
  async executeSlash(interaction) {
    const roles = interaction.guild.roles.cache
      .filter(role => role.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .first(40);

    const lines = roles.map(role => `**${role.name}** — \`${role.hexColor}\``);

    const embed = new EmbedBuilder()
      .setColor(0xFF1744)
      .setTitle("🌲 HOLLOWBORN ROLE LIST")
      .setDescription(lines.join("\n") || "No roles found.")
      .setFooter({ text: "HOLLOWBORN Role Management" });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
  async executePrefix(message) {
    const roles = message.guild.roles.cache
      .filter(r => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .first(40);

    const lines = roles.map(r => `**${r.name}** — \`${r.hexColor}\``);
    const embed = new EmbedBuilder()
      .setColor(0xFF1744)
      .setTitle("🌲 HOLLOWBORN ROLE LIST")
      .setDescription(lines.join("\n") || "No roles found.")
      .setFooter({ text: "HOLLOWBORN Role Management" });

    return message.reply({ embeds: [embed] });
  }
};

