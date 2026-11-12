require("dotenv").config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("role-create")
    .setDescription("Buat role custom dengan warna dan permission.")
    .addStringOption(o => o.setName("name").setDescription("Nama role").setRequired(true).setMaxLength(100))
    .addStringOption(o => o.setName("color").setDescription("Warna HEX, contoh #FF1744").setRequired(true))
    .addStringOption(o => o.setName("permissions").setDescription("Permission dipisahkan koma, contoh ViewChannel,SendMessages").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("role-preset")
    .setDescription("Generate seluruh role preset HOLLOWBORN.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("role-list")
    .setDescription("Lihat daftar role server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("role-grant")
    .setDescription("Berikan role kepada anggota.")
    .addUserOption(o => o.setName("member").setDescription("Anggota target").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("Role yang diberikan").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("role-revoke")
    .setDescription("Cabut role dari anggota.")
    .addUserOption(o => o.setName("member").setDescription("Anggota target").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("Role yang dicabut").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("role-delete")
    .setDescription("Hapus role dari server.")
    .addRoleOption(o => o.setName("role").setDescription("Role yang dihapus").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("mabar")
    .setDescription("Jadwalkan mabar cepat (bisa langsung pakai tombol klik atau isi detail).")
    .addStringOption(o => o.setName("game").setDescription("Nama game (opsional, jika kosong akan muncul menu tombol)").setRequired(false))
    .addStringOption(o => o.setName("waktu").setDescription("Waktu mabar, contoh: 20:00, 2 jam lagi, atau sekarang").setRequired(false))
    .addStringOption(o => o.setName("keterangan").setDescription("Catatan/info tambahan (contoh: Kumpul di Voice Base)").setRequired(false))
    .addRoleOption(o => o.setName("mention").setDescription("Role yang ingin di-tag notifikasi (contoh: @GAME NIGHT)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("commands")
    .setDescription("Lihat daftar seluruh command bot yang tersedia secara otomatis."),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Buku panduan lengkap dan contoh penggunaan seluruh command bot HOLLOWBORN.")
    .addStringOption(o => o.setName("command").setDescription("Nama command spesifik (contoh: mabar, role-preset, role-create)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("tips")
    .setDescription("Ensiklopedia tips bertahan hidup Sons of the Forest (interaktif dengan tombol kategori).")
    .addStringOption(o => o.setName("kategori")
      .setDescription("Pilih kategori tips spesifik")
      .setRequired(false)
      .addChoices(
        { name: "👥 Kelvin & Virginia", value: "kelvin_virginia" },
        { name: "🪓 Base Building & Pertahanan", value: "base_building" },
        { name: "⚔️ Combat & Senjata", value: "combat" },
        { name: "❄️ Survival, Makanan & Musim", value: "survival" },
        { name: "🔦 Eksplorasi Gua & Bunker", value: "caves" }
      )),

  new SlashCommandBuilder()
    .setName("item")
    .setDescription("Cari lokasi senjata, alat selam, sekop, atau keycard penting Sons of The Forest.")
    .addStringOption(o => o.setName("nama")
      .setDescription("Nama item (contoh: shovel, shotgun, katana, rebreather, rope gun, keycard)")
      .setRequired(false)),

  new SlashCommandBuilder()
    .setName("roadmap")
    .setDescription("Panduan checklist urutan tamat cerita Sons of the Forest (Step-by-step Story)."),

  new SlashCommandBuilder()
    .setName("roadmap-setup")
    .setDescription("Setup channel permanen & panel checklist interaktif roadmap Sons of the Forest.")
    .addChannelOption(o => o.setName("channel").setDescription("Pilih channel tujuan (opsional, jika kosong bot buatkan channel khusus)").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("base")
    .setDescription("Kelola titik base camp, shelter, zipline hub, dan titik penting tim di pulau SOTF.")
    .addSubcommand(sub =>
      sub.setName("list")
        .setDescription("Lihat daftar seluruh base camp dan outpost aktif tim HOLLOWBORN.")
    )
    .addSubcommand(sub =>
      sub.setName("add")
        .setDescription("Tambah base camp atau titik penting baru di pulau.")
        .addStringOption(o => o.setName("nama").setDescription("Nama base/shelter (contoh: Base Air Terjun)").setRequired(true))
        .addStringOption(o => o.setName("tipe")
          .setDescription("Tipe base / marker")
          .setRequired(true)
          .addChoices(
            { name: "🏰 Base Utama (Main Base)", value: "main_base" },
            { name: "⛺ Outpost / Shelter Darurat", value: "outpost" },
            { name: "🚡 Jaringan Zipline Hub", value: "zipline" },
            { name: "🚗 Parkir Kendaraan / Glider", value: "vehicle" },
            { name: "📦 Gudang Stok & Cache", value: "cache" }
          )
        )
        .addStringOption(o => o.setName("lokasi").setDescription("Lokasi atau patokan di pulau").setRequired(true))
        .addStringOption(o => o.setName("catatan").setDescription("Fasilitas atau info penting (opsional)").setRequired(false))
        .addStringOption(o => o.setName("koordinat").setDescription("Koordinat GPS atau arah mata angin (opsional)").setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName("delete")
        .setDescription("Hapus base dari daftar.")
        .addStringOption(o => o.setName("nama").setDescription("Nama atau ID base yang ingin dihapus").setRequired(true))
    ),

  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Lihat kartu identitas survivor taktikal (PuffCorp ID) dengan Canvas.")
    .addUserOption(o => o.setName("member").setDescription("Pilih anggota yang ingin dicek profilnya (opsional)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("map")
    .setDescription("Peta radar taktis pulau SOTF dengan plot titik markas dan gua cerita.")
    .addStringOption(o => o.setName("filter").setDescription("Filter tampilan titik radar").setRequired(false)
      .addChoices(
        { name: "Semua Titik (Markas + Gua Cerita)", value: "all" },
        { name: "Hanya Markas Tim HOLLOWBORN", value: "bases" },
        { name: "Hanya Gua Utama & Pintu Emas", value: "story" }
      )),

  new SlashCommandBuilder()
    .setName("loadout")
    .setDescription("Lihat blueprint matras tas survival SOTF dengan senjata, armor, dan gear gua."),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Expedition Hall of Fame / Papan peringkat survivor teraktif di server."),

  new SlashCommandBuilder()
    .setName("welcome-test")
    .setDescription("Pratinjau tampilan banner militer penyambutan member baru berbasis Canvas.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("welcome-setup")
    .setDescription("Atur channel resmi untuk banner Canvas selamat datang member baru.")
    .addChannelOption(o => o.setName("channel").setDescription("Pilih channel tujuan (opsional, jika kosong bot buatkan otomatis)").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
].map(c => c.toJSON());

async function main() {
  const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
  if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    throw new Error("Isi DISCORD_TOKEN, CLIENT_ID, dan GUILD_ID di file .env terlebih dahulu.");
  }
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log("Slash commands HOLLOWBORN berhasil didaftarkan.");
}
main().catch(err => { console.error(err); process.exit(1); });
