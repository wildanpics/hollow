// ==========================================
// 🗺️ DATABASE ITEM & LOKASI SENJATA SOTF
// ==========================================

const SOTF_ITEMS = [
  {
    id: "shovel",
    aliases: ["sekop", "shovel"],
    name: "⛏️ Shovel (Sekop)",
    category: "Alat Kunci Progresi Cerita",
    location: "Gua Sekop (Tengah Peta, lereng dekat Gunung Salju)",
    prerequisites: "WAJIB membawa Rebreather (Alat Selam) & Rope Gun (Zipline)!",
    threats: "Sluggy (Monster Daging Terjepit), Fingers, Twins, Blind Mutants",
    description: "Alat paling penting dalam game untuk menggali bunker-bunker rahasia bawah tanah (Maintenance Bunkers) dan makam.",
    proTips: "Bawa minimal 2 Granat / Time Bomb untuk meledakkan monster 'Sluggy' yang menghalangi lorong sempit di awal gua."
  },
  {
    id: "rebreather",
    aliases: ["alat selam", "rebreather", "selam", "oksigen"],
    name: "🤿 Rebreather (Alat Selam)",
    category: "Alat Kunci Eksplorasi Bawah Air",
    location: "Gua Pantai Utara (Dekat pantai spawn helikopter)",
    prerequisites: "Tidak butuh alat khusus (Bisa diambil di awal game)",
    threats: "Kanibal dasar di dalam gua & Hiu di area keluar laut",
    description: "Memungkinkan survivor menyelam dan bernapas di dalam air tanpa batas waktu.",
    proTips: "Saat keluar lewat danau bawah laut yang tembus ke pantai, hati-hati ada hiu. Berenang cepat ke tepi pantai!"
  },
  {
    id: "rope_gun",
    aliases: ["rope gun", "zipline", "tali", "ropegun"],
    name: "🔫 Rope Gun (Pistol Zipline)",
    category: "Alat Kunci Eksplorasi",
    location: "Gua Barat Daya (Dekat danau bercabang sungai)",
    prerequisites: "Tidak butuh alat khusus, tapi butuh peledak (C4/Time Bomb) untuk buka jalur",
    threats: "Sluggy penghalang pintu, puluhan blind mutants di ruangan luas",
    description: "Senjata pelontar tali zipline untuk menyeberangi jurang dan mengangkut kayu log melintasi bukit.",
    proTips: "Bawa Time Bomb untuk meledakkan monster daging yang terjepit di pintu masuk pertama."
  },
  {
    id: "shotgun",
    aliases: ["shotgun", "senapan", "shotie"],
    name: "💥 Shotgun (Senapan Gentel)",
    category: "Senjata Api Mematikan",
    location: "Makam Tentara (Tanda ungu GPS 'Exclamation Point' di barat laut)",
    prerequisites: "WAJIB sudah memiliki SHOVEL (Sekop) untuk menggali makam!",
    threats: "Kanibal patroli di area permukaan hutan sekitar makam",
    description: "Senjata api terkuat untuk pertempuran jarak dekat. Bisa diberikan ke Virginia untuk pertahanan tanpa batas peluru.",
    proTips: "Pasang Shotgun Rail & Flashlight attachment untuk penerangan gua sekaligus one-shot mutant."
  },
  {
    id: "katana",
    aliases: ["katana", "pedang", "samurai"],
    name: "🗡️ Katana (Pedang Samurai)",
    category: "Senjata Melee Tercepat",
    location: "Residential Bunker (Bunker Timur Tenggara, pintu butuh Maintenance Keycard)",
    prerequisites: "WAJIB membawa Maintenance Keycard & Guest Keycard!",
    threats: "Finger Mutants, Demon, dan Babies",
    description: "Senjata tebas tercepat dalam game. Sangat efektif untuk memotong anggota tubuh kanibal dan mutant dalam hitungan detik.",
    proTips: "Katana tidak bisa memblokir serangan dengan kuat, jadi gunakan gaya hit-and-run (tebas lalu mundur)."
  },
  {
    id: "pistol",
    aliases: ["pistol", "handgun", "pistol 9mm"],
    name: "🔫 Pistol (9mm Handgun)",
    category: "Senjata Api Ringan",
    location: "Rakit Darurat Oranye di laut (Tanda ungu GPS di lepas pantai barat)",
    prerequisites: "Bisa berenang ke rakit (Hati-hati Hiu)",
    threats: "Hiu ganas berputar di sekitar rakit",
    description: "Senjata api serbaguna yang akurat. Bisa dipasangi Silencer (Peredam), Laser Sight, dan Flashlight.",
    proTips: "Tembak hiu dari atas rakit menggunakan panah atau pistol sebelum berenang kembali ke daratan."
  },
  {
    id: "revolver",
    aliases: ["revolver", "magnum"],
    name: "🤠 Revolver (.357 Magnum)",
    category: "Senjata Api Heavy Pistol",
    location: "Maintenance Bunker C (Di lapangan golf utara-timur laut)",
    prerequisites: "WAJIB memiliki SHOVEL (Sekop) untuk menggali pintu palka bunker!",
    threats: "Area relatif aman di dalam bunker",
    description: "Pistol putar dengan damage per tembakan yang jauh lebih dahsyat dibandingkan pistol 9mm standar.",
    proTips: "Bunker C juga berisi banyak ransum makanan, baterai, dan pupuk."
  },
  {
    id: "compound_bow",
    aliases: ["compound bow", "busur panah", "bow"],
    name: "🏹 Compound Bow (Busur Kompon)",
    category: "Senjata Jarak Jauh",
    location: "Maintenance Bunker B (Gali di area hutan tengah selatan)",
    prerequisites: "WAJIB memiliki SHOVEL (Sekop)!",
    threats: "Relatif aman di dalam bunker",
    description: "Busur modern dengan daya tembak sangat kencang dan akurasi tinggi. Membunuh kanibal biasa dalam 1x headshot.",
    proTips: "Di dalam bunker B juga terdapat tempat tidur untuk save game dan bathtub berisi item langka."
  },
  {
    id: "chainsaw",
    aliases: ["chainsaw", "gergaji", "gergaji mesin"],
    name: "🪵 Chainsaw (Gergaji Mesin)",
    category: "Alat Penebang & Senjata Melee",
    location: "Entertainment Bunker (Bunker Bioskop / Bar)",
    prerequisites: "WAJIB membawa Maintenance Keycard & Guest Keycard!",
    threats: "Mutant di lorong bar & bioskop",
    description: "Alat penebang pohon paling cepat di Sons of The Forest. Menghabiskan pohon besar dalam 2 detik menggunakan baterai.",
    proTips: "Bisa digunakan sebagai senjata gergaji mutant dengan efek stagger konstan."
  },
  {
    id: "modern_axe",
    aliases: ["modern axe", "kapak modern"],
    name: "🪓 Modern Axe (Kapak Modern)",
    category: "Senjata & Alat Tebang",
    location: "Perkemahan Tenda Terbengkalai (Dekat danau di lereng barat)",
    prerequisites: "Bebas diambil di permukaan (Tidak perlu masuk gua)",
    threats: "Kanibal patroli hutan",
    description: "Kapak dengan damage tinggi dan daya tebang pohon yang jauh lebih efisien dibanding Tactical Axe awal.",
    proTips: "Cari tenda warna oranye di peta GPS, kapak menancap di mayat survivor."
  },
  {
    id: "machete",
    aliases: ["machete", "golok", "parang"],
    name: "🔪 Machete (Golok Militer)",
    category: "Senjata Melee",
    location: "Pantai Utara (Menancap di ban perahu karet darurat)",
    prerequisites: "Bebas diambil kapan saja di awal game (Tanpa alat khusus)",
    threats: "Hanya kanibal pantai acak",
    description: "Senjata tebas cepat yang jauh lebih lincah dan berdamage dibandingkan starter Tactical Axe.",
    proTips: "Sangat cocok untuk menebang semak belukar dan menguliti mayat kanibal."
  },
  {
    id: "keycards",
    aliases: ["keycard", "kartu", "vip keycard", "guest keycard", "maintenance keycard"],
    name: "💳 Tiga Keycard Utama (Maintenance, VIP, Guest)",
    category: "Kartu Akses Pintu Fasilitas",
    location: "Maintenance Bunker A (Maintenance), Food Bunker (VIP), Nightclub Bunker (Guest)",
    prerequisites: "Urutan wajib: Sekop ➔ Maintenance Keycard ➔ VIP Keycard ➔ Guest Keycard",
    threats: "Mutant Twins, Fingers, dan Bayi Mutant di lorong tertutup",
    description: "Kartu akses elektronik untuk membuka pintu pintu magnetik di seluruh bunker rahasia PuffCorp.",
    proTips: "Tanpa 3 kartu ini, kamu tidak akan bisa menamatkan jalan cerita utama pulau!"
  },
  {
    id: "golden_armor",
    aliases: ["golden armor", "armor emas", "gold armor"],
    name: "👑 Golden Armor (Baju Zirah Kuno)",
    category: "Item Wajib Ending Cerita",
    location: "Cultist Cave / Luxury Bunker (Tenggara pulau)",
    prerequisites: "WAJIB membawa Rebreather & Guest Keycard!",
    threats: "Demon Mutant (Monster berkaki panjang tahan peluru biasa)",
    description: "Armor kuno yang wajib dipakai untuk membuka Pintu Emas (Golden Door) menuju Ending cerita game.",
    proTips: "Bawa Cross (Salib) saat melawan Demon di gua ini, karena Demon sangat lemah dan terbakar oleh Salib!"
  }
];

function findSotfItem(query) {
  if (!query) return null;
  const q = query.toLowerCase().trim();
  return SOTF_ITEMS.find(item =>
    item.id === q ||
    item.name.toLowerCase().includes(q) ||
    item.aliases.some(alias => alias === q || alias.includes(q))
  );
}

module.exports = {
  SOTF_ITEMS,
  findSotfItem
};

