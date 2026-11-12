const {
  BASE_TYPES,
  resolveBaseType,
  loadBasesData,
  saveBasesData,
  buildBaseListEmbed,
  buildBaseDetailEmbed,
  buildBaseSelectMenu,
  buildBaseActionButtons
} = require("../../storage/baseStorage");

module.exports = {
  name: "base",
  description: "Lacak markas, shelter, zipline, dan titik penting pulau Sons of The Forest",
  aliases: ["markas", "shelter"],
  async executeSlash(interaction) {
    const subcommand = interaction.options.getSubcommand();
    let bases = loadBasesData();

    if (subcommand === "list") {
      const embed = buildBaseListEmbed(bases);
      const menuRow = buildBaseSelectMenu(bases);
      const btnRow = buildBaseActionButtons();
      const components = menuRow ? [menuRow, btnRow] : [btnRow];
      return interaction.reply({ embeds: [embed], components });
    }

    if (subcommand === "add") {
      const name = interaction.options.getString("nama", true);
      const type = interaction.options.getString("tipe", true);
      const location = interaction.options.getString("lokasi", true);
      const notes = interaction.options.getString("catatan") || "Tidak ada catatan khusus.";
      const coords = interaction.options.getString("koordinat") || "Cek GPS Map";

      const typeInfo = BASE_TYPES[type] || { name: "Base", emoji: "📍" };
      const newBase = {
        id: `base-${Date.now()}`,
        name,
        type,
        typeName: typeInfo.name,
        location,
        coords,
        notes,
        mapUrl: "https://mapgenie.io/sons-of-the-forest/maps/world",
        addedBy: interaction.user.tag,
        createdAt: new Date().toISOString()
      };

      bases.push(newBase);
      saveBasesData(bases);

      const embed = buildBaseDetailEmbed(newBase);
      const btnRow = buildBaseActionButtons(newBase.id);
      return interaction.reply({
        content: `✅ Titik baru **${typeInfo.emoji} ${name}** berhasil ditambahkan ke direktori pulau!`,
        embeds: [embed],
        components: [btnRow]
      });
    }

    if (subcommand === "delete") {
      const targetId = interaction.options.getString("id", true);
      const target = bases.find(b => b.id === targetId || b.name.toLowerCase() === targetId.toLowerCase());
      if (!target) {
        return interaction.reply({ content: "Base tidak ditemukan.", ephemeral: true });
      }

      bases = bases.filter(b => b.id !== target.id);
      saveBasesData(bases);
      return interaction.reply({ content: `🗑️ Base **${target.name}** berhasil dihapus.` });
    }
  },
  async executePrefix(message, args) {
    let bases = loadBasesData();
    const sub = args[0]?.toLowerCase();

    if (sub === "add") {
      const content = args.slice(1).join(" ").trim();
      if (!content) {
        return message.reply("💡 **Format Tambah Base Cepat:**\n`!base add <Nama Base> | <Lokasi> | [Tipe] | [Fasilitas/Catatan]`\n*Contoh:*\n`!base add Base Air Terjun | Puncak Tebing Barat | zipline | Ada 2 hang glider dan zipline ke danau`\n*(Atau ketik `!base` lalu klik tombol **➕ Tambah Base**)*");
      }
      const parts = content.split("|").map(s => s.trim());
      const name = parts[0];
      const location = parts[1] || "Pulau SOTF";
      const rawType = parts[2] || "outpost";
      const notes = parts[3] || "Tidak ada fasilitas khusus.";
      const type = resolveBaseType(rawType);
      const typeInfo = BASE_TYPES[type];

      const newBase = {
        id: `base-${Date.now()}`,
        name,
        type,
        typeName: typeInfo.name,
        location,
        coords: "Cek GPS Map",
        notes,
        mapUrl: "https://mapgenie.io/sons-of-the-forest/maps/world",
        addedBy: message.author.tag,
        createdAt: new Date().toISOString()
      };

      bases.push(newBase);
      saveBasesData(bases);

      const embed = buildBaseDetailEmbed(newBase);
      const btnRow = buildBaseActionButtons(newBase.id);
      return message.reply({
        content: `✅ Titik baru **${typeInfo.emoji} ${name}** berhasil dicatat ke pulau!`,
        embeds: [embed],
        components: [btnRow]
      });
    }

    if (sub === "delete" || sub === "del" || sub === "hapus") {
      const query = args.slice(1).join(" ").trim().toLowerCase();
      if (!query) {
        return message.reply("💡 Contoh: `!base delete Base Danau` atau ketik `!base` lalu pilih menu.");
      }
      const idx = bases.findIndex(b => b.id.toLowerCase() === query || b.name.toLowerCase().includes(query));
      if (idx === -1) {
        return message.reply(`❌ Base dengan nama atau ID "${query}" tidak ditemukan.`);
      }
      const deleted = bases.splice(idx, 1)[0];
      saveBasesData(bases);
      return message.reply(`🗑️ Base **${deleted.name}** berhasil dihapus.`);
    }

    // Default: menu dropdown & tombol list base
    const embed = buildBaseListEmbed(bases);
    const menuRow = buildBaseSelectMenu(bases);
    const btnRow = buildBaseActionButtons();
    const components = menuRow ? [menuRow, btnRow] : [btnRow];
    return message.reply({ embeds: [embed], components });
  }
};

