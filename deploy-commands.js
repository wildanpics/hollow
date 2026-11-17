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
    .setName("profile")
    .setDescription("Lihat kartu identitas survivor taktikal (PuffCorp ID) dengan Canvas.")
    .addUserOption(o => o.setName("member").setDescription("Pilih anggota yang ingin dicek profilnya (opsional)").setRequired(false))
    .addStringOption(o => o.setName("tema").setDescription("Pilih tema visual kartu identitas (opsional)").setRequired(false)
      .addChoices(
        { name: "⚔️ Hollow Chrome (Default)", value: "chrome" },
        { name: "🎛️ Bunker Cyan", value: "bunker" },
        { name: "❄️ Frost Peak", value: "frost" },
        { name: "👑 Solafite Gold", value: "solafite" },
        { name: "☣️ Toxic Green", value: "toxic" }
      )),

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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Lihat status antrean verifikasi suara dan nomor urut giliranmu."),

  new SlashCommandBuilder()
    .setName("verification-status")
    .setDescription("Cek status antrean dan sesi Emperor Voice Verification yang sedang berjalan.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("verification-cancel")
    .setDescription("Batalkan sesi verifikasi suara yang macet atau bersihkan antrean.")
    .addStringOption(o =>
      o.setName("aksi")
        .setDescription("Aksi pembatalan")
        .setRequired(false)
        .addChoices(
          { name: "Batalkan Sesi Aktif Saat Ini", value: "session" },
          { name: "Bersihkan Seluruh Antrean (Clear Queue)", value: "clear_queue" }
        )
    )
    .addUserOption(o => o.setName("member").setDescription("Member spesifik yang ingin dibatalkan/dihapus dari antrean").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("verification-setup")
    .setDescription("Kirim panel instruksi Emperor Voice Verification dengan banner dan tombol Waiting Room.")
    .addChannelOption(o => o.setName("channel").setDescription("Channel teks tujuan pengiriman panel (opsional)").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("protocol-setup")
    .setDescription("Kirim panel Protokol Server HOLLOWBORN dengan banner dan pemilih bahasa (ID/EN).")
    .addChannelOption(o => o.setName("channel").setDescription("Channel teks tujuan pengiriman protokol (opsional)").setRequired(false))
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
