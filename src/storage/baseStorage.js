const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const BASES_FILE = path.join(__dirname, "../../data/bases-markers.json");

const BASE_TYPES = {
  main_base: { name: "🏰 Base Utama", emoji: "🏰", color: 0xFFD700 },
  outpost: { name: "⛺ Outpost / Shelter", emoji: "⛺", color: 0x00E5FF },
  zipline: { name: "🚡 Jaringan Zipline", emoji: "🚡", color: 0x69F0AE },
  vehicle: { name: "🚗 Parkir Kendaraan / Glider", emoji: "🚗", color: 0xFFAB40 },
  cache: { name: "📦 Gudang Stok & Cache", emoji: "📦", color: 0xB388FF }
};

function resolveBaseType(rawType) {
  const t = (rawType || "").toLowerCase().trim();
  if (t.includes("utama") || t.includes("main")) return "main_base";
  if (t.includes("zipline") || t.includes("rope") || t.includes("kabel")) return "zipline";
  if (t.includes("kendaraan") || t.includes("mobil") || t.includes("glider") || t.includes("parkir") || t.includes("vehicle")) return "vehicle";
  if (t.includes("gudang") || t.includes("stok") || t.includes("cache") || t.includes("item")) return "cache";
  return "outpost";
}

function loadBasesData() {
  try {
    if (fs.existsSync(BASES_FILE)) {
      return JSON.parse(fs.readFileSync(BASES_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Gagal membaca bases-markers.json:", err.message);
  }
  return [];
}

function saveBasesData(data) {
  try {
    const dir = path.dirname(BASES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BASES_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan bases-markers.json:", err.message);
  }
}

function buildBaseListEmbed(bases) {
  const embed = new EmbedBuilder()
    .setColor(0x00E5FF)
    .setTitle("📍 HOLLOWBORN — DIREKTORI BASE & MARKER PULAU")
    .setDescription(
      "Daftar titik base camp, outpost shelter darurat, dan jaringan zipline tim di pulau Sons of The Forest.\n\n" +
      "• **Pilih menu dropdown di bawah** untuk melihat detail lengkap & rute base.\n" +
      "• Klik tombol **➕ Tambah Base** untuk mendaftarkan titik baru dengan form mudah!\n" +
      "• Klik **🗺️ Peta Interaktif** untuk membuka map GPS resmi pulau SOTF."
    )
    .setFooter({ text: "HOLLOWBORN Island Base System • Selalu siap bertahan hidup" })
    .setTimestamp();

  if (!bases || bases.length === 0) {
    embed.addFields({
      name: "Belum Ada Base Terdaftar",
      value: "Belum ada titik base yang disimpan. Klik tombol **➕ Tambah Base** di bawah atau ketik `!base add` untuk menambahkan base pertama!"
    });
    return embed;
  }

  for (let i = 0; i < bases.length; i++) {
    const b = bases[i];
    const typeInfo = BASE_TYPES[b.type] || { name: b.typeName || "📍 Base", emoji: "📍" };
    embed.addFields({
      name: `${i + 1}. ${typeInfo.emoji} ${b.name}`,
      value: `Tipe: **${typeInfo.name}**\n📍 **Lokasi:** ${b.location}\n📝 **Fasilitas:** ${b.notes || "Tidak ada catatan khusus."}\n🧭 **Koordinat:** \`${b.coords || "GPS Map"}\``,
      inline: false
    });
  }

  return embed;
}

function buildBaseDetailEmbed(base) {
  const typeInfo = BASE_TYPES[base.type] || { name: base.typeName || "📍 Base", emoji: "📍", color: 0x00E5FF };
  const timeStr = base.createdAt ? `<t:${Math.floor(new Date(base.createdAt).getTime() / 1000)}:R>` : "Baru saja";
  const embed = new EmbedBuilder()
    .setColor(typeInfo.color || 0x00E5FF)
    .setTitle(`${typeInfo.emoji} ${base.name}`)
    .setDescription(
      `**Tipe Titik:** ${typeInfo.name}\n` +
      `**Didaftarkan Oleh:** \`${base.addedBy || "Survivor"}\` • ${timeStr}`
    )
    .addFields(
      { name: "📍 Lokasi / Patokan Area", value: base.location || "Pulau Sons of the Forest", inline: false },
      { name: "🧭 Koordinat GPS / Arah", value: `\`${base.coords || "Cek GPS Tracker"}\``, inline: true },
      { name: "🗺️ Peta Interaktif", value: `[Buka MapGenie Sons of the Forest](${base.mapUrl || "https://mapgenie.io/sons-of-the-forest/maps/world"})`, inline: true },
      { name: "🛠️ Fasilitas & Catatan Base", value: base.notes || "Tidak ada catatan fasilitas khusus.", inline: false }
    )
    .setFooter({ text: "Gunakan tombol di bawah untuk kembali ke daftar base atau menghapusnya." });

  return embed;
}

function buildBaseSelectMenu(bases) {
  if (!bases || bases.length === 0) return null;

  const menu = new StringSelectMenuBuilder()
    .setCustomId("base_select")
    .setPlaceholder("📌 Pilih Base untuk melihat detail & fasilitas...");

  for (let i = 0; i < Math.min(bases.length, 25); i++) {
    const b = bases[i];
    const typeInfo = BASE_TYPES[b.type] || { name: "Base", emoji: "📍" };
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(`${i + 1}. ${b.name}`.slice(0, 100))
        .setValue(b.id)
        .setDescription(`${typeInfo.name} • ${b.location}`.slice(0, 100))
        .setEmoji(typeInfo.emoji)
    );
  }

  return new ActionRowBuilder().addComponents(menu);
}

function buildBaseActionButtons(selectedBaseId = null) {
  const row = new ActionRowBuilder();

  if (selectedBaseId) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("base_btn_back")
        .setLabel("Kembali ke Daftar")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`base_delete_${selectedBaseId}`)
        .setLabel("Hapus Base Ini")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setLabel("Buka Map SOTF")
        .setEmoji("🗺️")
        .setStyle(ButtonStyle.Link)
        .setURL("https://mapgenie.io/sons-of-the-forest/maps/world")
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("base_btn_add")
        .setLabel("Tambah Base Baru")
        .setEmoji("➕")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("base_btn_refresh")
        .setLabel("Segarkan")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel("Buka Peta Interaktif")
        .setEmoji("🗺️")
        .setStyle(ButtonStyle.Link)
        .setURL("https://mapgenie.io/sons-of-the-forest/maps/world")
    );
  }

  return row;
}

function buildAddBaseModal() {
  const modal = new ModalBuilder()
    .setCustomId("base_modal_add")
    .setTitle("Tambah Base / Marker Pulau");

  const nameInput = new TextInputBuilder()
    .setCustomId("input_base_name")
    .setLabel("Nama Base / Shelter")
    .setPlaceholder("Contoh: Base Air Terjun, Camp Danau Barat")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const typeInput = new TextInputBuilder()
    .setCustomId("input_base_type")
    .setLabel("Tipe (utama / outpost / zipline / parkir / cache)")
    .setPlaceholder("utama / outpost / zipline / parkir / cache")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const locInput = new TextInputBuilder()
    .setCustomId("input_base_loc")
    .setLabel("Lokasi di Pulau / Patokan Sekitar")
    .setPlaceholder("Contoh: Dekat Gua Rebreather / Tepi Danau Salju")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const coordsInput = new TextInputBuilder()
    .setCustomId("input_base_coords")
    .setLabel("Koordinat GPS / Arah (Opsional)")
    .setPlaceholder("Contoh: Pantai Utara dekat helikopter spawn")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const notesInput = new TextInputBuilder()
    .setCustomId("input_base_notes")
    .setLabel("Fasilitas & Catatan (Opsional)")
    .setPlaceholder("Contoh: Ada helipad, 4 drying rack, 2 water collector")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(typeInput),
    new ActionRowBuilder().addComponents(locInput),
    new ActionRowBuilder().addComponents(coordsInput),
    new ActionRowBuilder().addComponents(notesInput)
  );

  return modal;
}

module.exports = {
  BASES_FILE,
  BASE_TYPES,
  resolveBaseType,
  loadBasesData,
  saveBasesData,
  buildBaseListEmbed,
  buildBaseDetailEmbed,
  buildBaseSelectMenu,
  buildBaseActionButtons,
  buildAddBaseModal
};

