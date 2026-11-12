const { buildMapMessage } = require("../../utils/statsHelper");

module.exports = {
  name: "map",
  description: "Menampilkan radar peta taktis pulau Sons of the Forest dengan titik base & POI cerita",
  aliases: ["peta", "radar"],
  async executeSlash(interaction) {
    const filter = interaction.options.getString("filter") || "all";
    const sector = interaction.options.getString("sector") || "full";
    await interaction.deferReply();
    const { embed, rows, files } = await buildMapMessage(filter, { sector, season: "normal" });
    return interaction.editReply({ embeds: [embed], components: rows, files });
  },
  async executePrefix(message, args) {
    let filter = "all";
    let sector = "full";
    let season = "normal";

    for (const arg of args) {
      const p = arg.toLowerCase();
      // Filter
      if (p.includes("base") || p.includes("markas")) filter = "bases";
      else if (p.includes("gua") || p.includes("cave") || p.includes("story")) filter = "story";
      else if (p.includes("key") || p.includes("keycard") || p.includes("bunker")) filter = "keycard";
      else if (p.includes("crash") || p.includes("heli")) filter = "crash";
      else if (p.includes("solafite") || p.includes("mine") || p.includes("tambang")) filter = "solafite";
      // Sector
      else if (p.includes("utara") || p.includes("north")) sector = "utara";
      else if (p.includes("barat") || p.includes("danau") || p.includes("west")) sector = "barat";
      else if (p.includes("gunung") || p.includes("salju") || p.includes("snow")) sector = "gunung";
      else if (p.includes("timur") || p.includes("golf") || p.includes("east")) sector = "timur";
      else if (p.includes("selatan") || p.includes("lava") || p.includes("south")) sector = "selatan";
      // Season
      else if (p.includes("winter") || p.includes("dingin") || p.includes("salju")) season = "winter";
    }

    const { embed, rows, files } = await buildMapMessage(filter, { sector, season });
    return message.reply({ embeds: [embed], components: rows, files });
  }
};

