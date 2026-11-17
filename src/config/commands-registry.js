// ==========================================
// 📋 REGISTRY PERINTAH BOT (OTOMATIS TAMPIL DI DAFTAR)
// ==========================================

const COMMANDS_REGISTRY = [
  {
    name: "profile",
    title: "🪪 Tactical Survivor ID Card",
    description: "Kartu identitas survivor taktikal dengan Canvas, statistik ekspedisi, dan tema interaktif.",
    category: "🎮 Gaming & Komunitas",
    permission: "Semua Anggota",
    usage: ["!profile", "!profile @user", "/profile", "/profile member:@user"],
    examples: ["!profile", "/profile"]
  },
  {
    name: "leaderboard",
    title: "🏆 Voice Hall of Fame",
    description: "Papan peringkat Top 10 survivor paling aktif di Voice Channel server.",
    category: "🎮 Gaming & Komunitas",
    permission: "Semua Anggota",
    usage: ["!leaderboard", "!top", "/leaderboard"],
    examples: ["!leaderboard", "/leaderboard"]
  },
  {
    name: "welcome-test",
    title: "🛬 Pratinjau Welcome Canvas Banner",
    description: "Menampilkan pratinjau banner militer penyambutan survivor baru berbasis Canvas.",
    category: "📖 Bantuan & Informasi",
    permission: "Manage Roles / Owner",
    usage: ["!welcome-test", "/welcome-test"],
    examples: ["!welcome-test", "/welcome-test"]
  },
  {
    name: "welcome-setup",
    title: "🛬 Setup Channel Welcome Canvas",
    description: "Menetapkan channel resmi untuk pengiriman banner Canvas militer selamat datang member baru secara otomatis.",
    category: "🌲 Panduan Sons of The Forest",
    permission: "Manage Roles / Owner",
    usage: ["!welcome-setup", "!welcome-setup #channel", "/welcome-setup [channel]"],
    examples: ["!welcome-setup", "!welcome-setup #selamat-datang", "/welcome-setup"]
  },
  {
    name: "mabar",
    title: "🎮 Jadwal Mabar Cepat (Tombol & RSVP)",
    description: "Atur jadwal mabar anti-misskom dengan 2-klik tombol cepat, live countdown, dan RSVP kehadiran.",
    category: "🎮 Gaming & Komunitas",
    permission: "Semua Anggota",
    usage: [
      "!mabar (menu tombol 2-klik)",
      "!mabar <waktu> (contoh: !mabar 20:00 atau !mabar sekarang)",
      "!mabar <game> <waktu> (contoh: !mabar DayZ 21:00)",
      "/mabar (tanpa opsi = tombol cepat)"
    ],
    examples: [
      "!mabar (paling praktis)",
      "!mabar sekarang",
      "!mabar 20:00",
      "!mabar DayZ 21:00"
    ],
    notes: [
      "Tersedia panel tombol cepat: pilih game lalu pilih jam mabar langsung jadi!",
      "Discord otomatis menampilkan waktu sesuai jam lokal perangkat masing-masing pemain.",
      "Bot otomatis mengirim alarm pengingat 10 menit sebelum mabar dan saat waktu tiba."
    ]
  },
  {
    name: "commands",
    title: "📋 Daftar Seluruh Perintah Bot",
    description: "Menampilkan daftar seluruh perintah yang tersedia pada bot HOLLOWBORN secara otomatis.",
    category: "📖 Bantuan & Informasi",
    permission: "Semua Anggota",
    usage: ["!commands", "/commands", "!menu", "!list-command"],
    examples: ["!commands", "/commands"]
  },
  {
    name: "help",
    title: "📖 Buku Panduan & Bantuan",
    description: "Membuka panduan lengkap dan contoh pemakaian setiap perintah bot dalam Bahasa Indonesia.",
    category: "📖 Bantuan & Informasi",
    permission: "Semua Anggota",
    usage: ["/help", "!help", "!panduan", "!help <command>"],
    examples: ["!help", "!help mabar", "!help role-preset"]
  },
  {
    name: "role-preset",
    title: "🌲 Generator 28 Role Preset HOLLOWBORN",
    description: "Generate otomatis seluruh 28 role preset resmi server HOLLOWBORN sekaligus.",
    category: "🌲 Role Management",
    permission: "Manage Roles / Owner",
    usage: ["/role-preset", "!role-preset"],
    examples: ["/role-preset", "!role-preset"],
    notes: [
      "Role yang sudah ada akan dilewati otomatis agar tidak duplikat.",
      "Role Founder otomatis diberikan ke server owner tanpa izin Administrator demi keamanan Crown."
    ]
  },
  {
    name: "role-create",
    title: "🛠️ Buat Role Custom",
    description: "Membuat role custom baru dengan nama, kode warna HEX, dan permission pilihan.",
    category: "🌲 Role Management",
    permission: "Manage Roles",
    usage: [
      "/role-create name:<nama> color:<hex> [permissions]",
      "!role-create <nama> | <hex> | [permissions]"
    ],
    examples: [
      "/role-create name:🔥 FIREEATER color:#FF4500 permissions:ViewChannel,SendMessages",
      "!role-create Survivor Pro | #00E5FF | ViewChannel,SendMessages"
    ]
  },
  {
    name: "role-list",
    title: "📋 Daftar Role Server",
    description: "Melihat daftar 40 role teratas di server beserta kode warna HEX.",
    category: "🌲 Role Management",
    permission: "Semua Anggota",
    usage: ["/role-list", "!role-list"],
    examples: ["/role-list", "!role-list"]
  },
  {
    name: "role-grant",
    title: "➕ Berikan Role ke Anggota",
    description: "Memberikan role tertentu kepada seorang anggota target.",
    category: "🌲 Role Management",
    permission: "Manage Roles",
    usage: ["/role-grant member:<@user> role:<@role>", "!role-grant @user @role"],
    examples: ["/role-grant member:@Zelix role:@WARLORD", "!role-grant @Zelix @WARLORD"]
  },
  {
    name: "role-revoke",
    title: "➖ Cabut Role dari Anggota",
    description: "Mencabut role tertentu dari seorang anggota target.",
    category: "🌲 Role Management",
    permission: "Manage Roles",
    usage: ["/role-revoke member:<@user> role:<@role>", "!role-revoke @user @role"],
    examples: ["/role-revoke member:@Zelix role:@WARLORD", "!role-revoke @Zelix @WARLORD"]
  },
  {
    name: "role-delete",
    title: "🗑️ Hapus Role dari Server",
    description: "Menghapus role tertentu secara permanen dari server Discord.",
    category: "🌲 Role Management",
    permission: "Manage Roles",
    usage: ["/role-delete role:<@role>", "!role-delete @role"],
    examples: ["/role-delete role:@Recruit", "!role-delete @Recruit"]
  },
  {
    name: "queue",
    title: "🎙️ Antrean Voice Verification",
    description: "Melihat daftar antrean verifikasi suara Emperor dan nomor urut giliran survivor.",
    category: "🛡️ Voice Verification",
    permission: "Semua Anggota",
    usage: ["/queue", "!queue", "!antrean"],
    examples: ["/queue", "!queue"]
  },
  {
    name: "verification-status",
    title: "🛡️ Status Emperor Voice Verification",
    description: "Melihat status detail antrean dan sesi pemutaran suara transmisi Emperor yang sedang berjalan.",
    category: "🛡️ Voice Verification",
    permission: "Manage Roles",
    usage: ["/verification-status", "!vstatus"],
    examples: ["/verification-status", "!vstatus"]
  },
  {
    name: "verification-cancel",
    title: "🛑 Batalkan Sesi / Bersihkan Antrean",
    description: "Membatalkan sesi verifikasi yang macet atau membersihkan seluruh antrean Waiting Room.",
    category: "🛡️ Voice Verification",
    permission: "Manage Roles",
    usage: ["/verification-cancel [aksi] [member]", "!vcancel"],
    examples: ["/verification-cancel", "/verification-cancel aksi:clear_queue", "!vcancel"]
  },
  {
    name: "verification-setup",
    title: "⚙️ Setup Panel Voice Verification",
    description: "Mengirimkan embed panel tutorial verifikasi suara dua bahasa beserta banner dan tombol Waiting Room.",
    category: "🛡️ Voice Verification",
    permission: "Manage Roles",
    usage: ["/verification-setup [channel]", "!vsetup"],
    examples: ["/verification-setup", "!vsetup"]
  },
  {
    name: "protocol-setup",
    title: "📜 Setup Protokol Server HOLLOWBORN",
    description: "Mengirimkan dokumen resmi Protokol Server HOLLOWBORN dengan banner taktis dan dropdown pemilih bahasa.",
    category: "🛡️ Server Governance",
    permission: "Manage Roles",
    usage: ["/protocol-setup [channel]", "!psetup"],
    examples: ["/protocol-setup", "!psetup"]
  }
];

module.exports = {
  COMMANDS_REGISTRY
};

