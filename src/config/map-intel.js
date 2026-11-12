// ============================================================
// 🗺️ MAP INTEL DATABASE — Sons of The Forest POI Dossier
// ============================================================

const MAP_INTEL = {
  // 7 Main Story POIs
  story: [
    {
      id: "rebreather",
      step: 1,
      name: "Rebreather Cave",
      fullName: "Gua Rebreather — Alat Selam Utama",
      sector: "Pantai Utara",
      gridRef: "B2",
      icon: "🤿",
      loot: ["Rebreather (Wajib untuk gua bawah air)", "Flare Gun + Ammo", "Pistol + Silencer", "Meds & First Aid"],
      threats: ["Kelvin AI Spawn Point", "Cannibal Camps x3", "Virginia Encounter"],
      requirements: ["Tidak ada (gua pertama, bebas masuk)", "Senjata dasar disarankan"],
      difficulty: "⭐ MUDAH",
      difficultyColor: 0x00E676,
      notes: "Gua pertama yang WAJIB dikunjungi. Rebreather diperlukan untuk masuk ke semua gua bawah air berikutnya. Pastikan bawa senjata untuk Cannibal camp di dekat mulut gua.",
      coords: "1650, 800 (peta internal)"
    },
    {
      id: "rope-gun",
      step: 2,
      name: "Rope Gun Cave",
      fullName: "Gua Rope Gun — Zipline Gun Taktis",
      sector: "Hutan & Danau Barat",
      gridRef: "B5",
      icon: "🪝",
      loot: ["Rope Gun (Wajib untuk gua gunung)", "Zipline Rope", "Modern Bow + Ammo", "Shovel Blueprint Clue"],
      threats: ["Fingers Mutant (Tanpa mata, sangat sensitif suara)", "Kelabang Raksasa", "Genap 2 Twins Mutant"],
      requirements: ["Rebreather (Ada bagian bawah air)", "Cahaya (Flashlight/Lighter)", "Bom/Grenade disarankan"],
      difficulty: "⭐⭐⭐ EKSTREM",
      difficultyColor: 0xFF5252,
      notes: "Gua paling berbahaya di early-game. WAJIB bawa Rebreather untuk bagian bawah air. Fingers Mutant adalah blind enemy yang bereaksi terhadap SUARA, jadi hindari berlari atau tembak senjata api.",
      coords: "1080, 2200 (peta internal)"
    },
    {
      id: "shovel-cave",
      step: 3,
      name: "Shovel Cave",
      fullName: "Gua Sekop — The Essential Tool",
      sector: "Kaki Pegunungan Barat",
      gridRef: "D4",
      icon: "⛏️",
      loot: ["Shovel (Sekop, MUTLAK diperlukan)", "Solafite Ore x8", "Gold Armor Parts", "Meds & Vitamins"],
      threats: ["Fingers Mutant (sangat banyak)", "Leg Mutant", "Area gelap total"],
      requirements: ["Rebreather (bagian bawah air awal)", "Rope Gun (rintangan zipline)", "Flashlight Attachment (WAJIB)", "Setidaknya 1 bomb"],
      difficulty: "⭐⭐⭐⭐ SANGAT EKSTREM",
      difficultyColor: 0xFF1744,
      notes: "Gua tersulit kedua. Sekop yang kamu dapat di sini adalah kunci membuka Maintenance Bunker A dan semua bunker selanjutnya. JANGAN masuk tanpa Rebreather + Rope Gun!",
      coords: "1720, 1720 (peta internal)"
    },
    {
      id: "maintenance-bunker",
      step: 4,
      name: "Maintenance Bunker A",
      fullName: "Maintenance Bunker A — Kartu Keycard Pertama",
      sector: "Hutan Barat Laut",
      gridRef: "C3",
      icon: "🔑",
      loot: ["Maintenance Keycard (WAJIB untuk Food Bunker)", "3D Printer + Resin", "Shotgun Rail + Laser", "Guitar (Easter Egg)"],
      threats: ["Zombie Mutant (dalam bunker)", "Security Camera (non-combat)", "Electrical Traps"],
      requirements: ["Shovel (untuk gali pintu masuk)", "Batteries x2 (isi generator)"],
      difficulty: "⭐⭐ SEDANG",
      difficultyColor: 0xFFAB40,
      notes: "Lokasi ini harus DIGALI dengan Shovel. Aktifkan generator dengan 2 baterai. Maintenance Keycard di dalam adalah kunci utama ke Food Bunker dan jalur cerita berikutnya.",
      coords: "1250, 1400 (peta internal)"
    },
    {
      id: "food-bunker",
      step: 5,
      name: "VIP Food Bunker",
      fullName: "Food Bunker — VIP Keycard & Shotgun",
      sector: "Danau Barat",
      gridRef: "B4",
      icon: "🏚️",
      loot: ["VIP Keycard (WAJIB untuk Guest Bunker)", "Pump Shotgun (Senjata terbaik awal)", "Solafite Ore x12", "Food Supply (banyak)"],
      threats: ["Zombie Creepy (dalam terowongan)", "Kelabang Raksasa (di luar)"],
      requirements: ["Maintenance Keycard (untuk membuka pintu)", "Lampu/Flashlight"],
      difficulty: "⭐⭐ SEDANG",
      difficultyColor: 0xFFAB40,
      notes: "Bunker ini relatif aman dibanding gua. Pump Shotgun yang kamu temukan di sini adalah game-changer untuk combat. VIP Keycard membuka Guest Bunker yang berisi Katana.",
      coords: "920, 1850 (peta internal)"
    },
    {
      id: "guest-bunker",
      step: 6,
      name: "Guest Bunker / Katana",
      fullName: "Entertainment Bunker — Katana Legendaris",
      sector: "Lapangan Golf Timur",
      gridRef: "F4",
      icon: "⚔️",
      loot: ["Katana (Senjata Melee Terbaik)", "Solafite Ore x15", "Gold Armor Set (lengkap)", "Night Vision Goggles"],
      threats: ["Zombie Suit (dalam club area)", "Creepy Armor Boss (1 buah)"],
      requirements: ["VIP Keycard (dari Food Bunker)", "Pistol atau Shotgun disarankan"],
      difficulty: "⭐⭐⭐ EKSTREM",
      difficultyColor: 0xFF5252,
      notes: "Lokasi Katana! Senjata melee terkuat dalam game. Bunker ini luas dan memiliki beberapa ruangan termasuk gym, bioskop, dan kolam renang. Lakukan full explore untuk Night Vision.",
      coords: "2800, 1820 (peta internal)"
    },
    {
      id: "golden-door",
      step: 7,
      name: "Golden Door (Cube)",
      fullName: "Luxury Bunker — Pintu Emas & Ending Game",
      sector: "Tebing Selatan",
      gridRef: "F7",
      icon: "🚪",
      loot: ["Solafite Full Armor Set", "Golden Armor (Cinematic)", "Secret Room Items", "Ending Cutscene Access"],
      threats: ["Creepy Armor Boss x3", "Final Mutant Wave", "Tim HARUS bersatu (ADA multi-wave)"],
      requirements: ["VIP Keycard (dari Food Bunker)", "Rope Gun (untuk navigasi tebing)", "Full armor disarankan", "Semua anggota ready"],
      difficulty: "⭐⭐⭐⭐⭐ BOSS FINAL",
      difficultyColor: 0xFFD700,
      notes: "TAMAT GAME! Buka pintu emas yang ada di ujung Luxury Bunker untuk melihat ending. Ini adalah momen puncak — pastikan SELURUH TIM hadir! Siapkan Solafite Armor penuh sebelum masuk.",
      coords: "3080, 2780 (peta internal)"
    }
  ],

  // 5 Geographical Sectors
  sectors: [
    {
      id: "utara",
      name: "Pantai Utara",
      icon: "🌊",
      description: "Zona spawn awal, pantai berpasir, kamp kanibal, dan gua pertama",
      pois: ["Rebreather Cave", "Pantai Spawn Awal", "Camp Kanibal x4"],
      // Crop coordinates into 3840x3840 source map
      cropX: 1200, cropY: 300, cropW: 1500, cropH: 1100,
      gridLabel: "A1-D3"
    },
    {
      id: "barat",
      name: "Hutan & Danau Barat",
      icon: "🌲",
      description: "Lembah danau hijau, air terjun, dua bunker cerita, gua terbahaya",
      pois: ["Rope Gun Cave", "VIP Food Bunker", "Air Terjun Virginia"],
      cropX: 450, cropY: 1200, cropW: 1800, cropH: 1400,
      gridLabel: "A3-D7"
    },
    {
      id: "gunung",
      name: "Pegunungan Salju",
      icon: "🏔️",
      description: "Puncak bersalju, gua sekop, lereng es tertinggi di pulau",
      pois: ["Shovel Cave", "Maintenance Bunker A", "Snow Peak Summit"],
      cropX: 950, cropY: 850, cropW: 2000, cropH: 1500,
      gridLabel: "C2-G6"
    },
    {
      id: "timur",
      name: "Lapangan Golf & Timur",
      icon: "⛳",
      description: "Resor mewah, lapangan golf, helicopter, dan bunker entertainment",
      pois: ["Guest Bunker / Katana", "Helipad Crash Site", "Golf Course"],
      cropX: 2000, cropY: 1000, cropW: 1700, cropH: 1300,
      gridLabel: "E2-H5"
    },
    {
      id: "selatan",
      name: "Tebing & Lava Selatan",
      icon: "🌋",
      description: "Tebing berbahaya, gua lava, Luxury Bunker, dan Pintu Emas tamat",
      pois: ["Golden Door (Cube)", "Luxury Bunker", "Lava Cave"],
      cropX: 1800, cropY: 2000, cropW: 1900, cropH: 1500,
      gridLabel: "D6-H8"
    }
  ]
};

module.exports = { MAP_INTEL };

