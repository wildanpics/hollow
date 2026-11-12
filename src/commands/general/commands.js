const { buildCommandsListEmbed } = require("./help");

module.exports = {
  name: "commands",
  description: "Menampilkan daftar seluruh perintah aktif bot yang otomatis terupdate",
  aliases: ["menu", "list-command", "cmd"],
  async executeSlash(interaction) {
    const embed = buildCommandsListEmbed();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
  async executePrefix(message) {
    const embed = buildCommandsListEmbed();
    return message.reply({ embeds: [embed] });
  }
};

