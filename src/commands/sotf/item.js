const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require("discord.js");
const { SOTF_ITEMS, findSotfItem } = require("../../config/sotf-items");

function buildItemEmbed(item) {
  if (!item) {
    return new EmbedBuilder()
      .setColor(0x00E5FF)
      .setTitle("🗺️ DATABASE LOKASI ITEM & SENJATA SONS OF THE FOREST")
      .setDescription(
        "Pilih salah satu item pada menu dropdown di bawah untuk melihat:\n" +
        "• 📍 Lokasi gua / bunker di peta\n" +
        "• ⚠️ Syarat alat wajib yang harus dibawa\n" +
        "• 🧟 Bahaya mutant / musuh di dalam lokasi\n" +
        "• 💡 Trik ampuh mempermudah pengambilan"
      )
      .addFields(
        { name: "Alat Kunci Cerita", value: "`shovel` • `rebreather` • `rope_gun` • `keycards`", inline: true },
        { name: "Senjata Mematikan", value: "`shotgun` • `katana` • `pistol` • `revolver` • `chainsaw`", inline: true }
      )
      .setFooter({ text: "Gunakan menu dropdown di bawah atau ketik !item <nama>" });
  }

  return new EmbedBuilder()
    .setColor(0x00E5FF)
    .setTitle(`🗺️ LOKASI ITEM: ${item.name.toUpperCase()}`)
    .setDescription(item.description)
    .addFields(
      { name: "📍 Lokasi di Peta", value: item.location, inline: false },
      { name: "⚠️ Syarat Alat Wajib", value: item.prerequisites, inline: true },
      { name: "🧟 Ancaman Musuh", value: item.threats, inline: true },
      { name: "💡 Trik Survivor", value: `*${item.proTips}*`, inline: false }
    )
    .setFooter({ text: "HOLLOWBORN Survival Guide • Gunakan dropdown untuk cek item lain" });
}

function buildItemSelectMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("item_select")
    .setPlaceholder("🔍 Pilih item / senjata untuk melihat lokasinya...");

  for (const item of SOTF_ITEMS) {
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setValue(item.id)
        .setLabel(item.name.slice(0, 95))
        .setDescription(item.location.slice(0, 95))
    );
  }

  return new ActionRowBuilder().addComponents(menu);
}

module.exports = {
  name: "item",
  description: "Cari lokasi item penting dan senjata di pulau Sons of The Forest",
  aliases: ["items", "senjata"],
  buildItemEmbed,
  buildItemSelectMenu,
  async executeSlash(interaction) {
    const nama = interaction.options.getString("nama");
    const item = nama ? findSotfItem(nama) : null;
    const embed = buildItemEmbed(item);
    const menuRow = buildItemSelectMenu();
    return interaction.reply({ embeds: [embed], components: [menuRow] });
  },
  async executePrefix(message, args) {
    const query = args.join(" ").trim();
    const item = query ? findSotfItem(query) : null;
    const embed = buildItemEmbed(item);
    const menuRow = buildItemSelectMenu();
    return message.reply({ embeds: [embed], components: [menuRow] });
  }
};

