const { buildLoadoutMessage } = require("../../utils/statsHelper");

module.exports = {
  name: "loadout",
  description: "Matras perlengkapan taktis survival dan kustomisasi gear ekspedisi",
  aliases: ["tas", "bag", "gear"],
  async executeSlash(interaction) {
    const { embed, rows, files } = buildLoadoutMessage(interaction.member);
    return interaction.reply({ embeds: [embed], components: rows, files });
  },
  async executePrefix(message) {
    const { embed, rows, files } = buildLoadoutMessage(message.member);
    return message.reply({ embeds: [embed], components: rows, files });
  }
};

