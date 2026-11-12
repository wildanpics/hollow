// ==========================================
// 📋 DATABASE ROADMAP TAMAT GAME SOTF (LENGKAP)
// ==========================================

const SOTF_ROADMAP = [
  {
    step: 1,
    icon: "🤿",
    title: "Tahap 1: Ambil Rebreather (Alat Selam)",
    location: "Gua Pantai Utara (Dekat titik awal pantai spawn)",
    prerequisite: "Tanpa syarat (Bisa langsung saat hari pertama)",
    unlocks: "Membuka kemampuan bernapas & menyelam di gua bawah air seluruh pulau.",
    loot: "Rebreather (Alat Selam) + Stun Gun & Leather Jacket",
    threats: "Blind Mutants di lorong air dangkal (buta, hanya merespon suara langkah)."
  },
  {
    step: 2,
    icon: "🔫",
    title: "Tahap 2: Ambil Rope Gun (Zipline)",
    location: "Gua Barat Daya (Kaki bukit dekat danau kecil)",
    prerequisite: "Bawa bahan peledak (C4/Time Bomb) untuk meledakkan mutan Sluggy pemblokir celah batu.",
    unlocks: "Membuka kemampuan menyeberangi jurang tali stalagmit menuju Gua Shovel.",
    loot: "Rope Gun (Alat Tali Zipline) + Crossbow di bunker terdekat",
    threats: "Sluggy (Gumpalan daging raksasa), Mutant Babies, Fingers."
  },
  {
    step: 3,
    icon: "⛏️",
    title: "Tahap 3: Ambil Shovel (Sekop Utama)",
    location: "Gua Salju Tengah (Lereng bebatuan gunung es)",
    prerequisite: "WAJIB sudah punya Rebreather & Rope Gun!",
    unlocks: "Membuka kemampuan menggali gundukan tanah bunker rahasia di seluruh pulau.",
    loot: "Shovel (Sekop Utama) + Flashlight Attachment & Slingshot",
    threats: "Twins (Mutan Kembar merangkak), Fingers, Blind Mutants bawah air."
  },
  {
    step: 4,
    icon: "💳",
    title: "Tahap 4: Ambil Maintenance Keycard",
    location: "Maintenance Bunker A (Gali tanah di area barat dekat golf cart terbalik)",
    prerequisite: "Gali tumpukan tanah dengan Sekop (Shovel) sampai pintu hatch besi terbuka.",
    unlocks: "Membuka pintu fasilitas bunker makanan, hidroponik, dan riset bawah tanah.",
    loot: "Maintenance Keycard + Laser Sight, Firefighter Axe, fasilitas 3D Printer",
    threats: "Mutant Babies di koridor kantor."
  },
  {
    step: 5,
    icon: "🍸",
    title: "Tahap 5: Ambil VIP Keycard & Shotgun",
    location: "Food & Dining Bunker (Bunker Bawah Tanah Barat dekat danau)",
    prerequisite: "Buka pintu kaca bunker dengan Maintenance Keycard.",
    unlocks: "Membuka pintu ruang kendali CCTV kamera, kamar tamu VIP, dan gerbang keamanan.",
    loot: "VIP Keycard + Shotgun & Shotgun Rail Attachment",
    threats: "Fingers, Blind Mutants, John 2.0 (Mutan Cacing panjang)."
  },
  {
    step: 6,
    icon: "🎟️",
    title: "Tahap 6: Ambil Guest Keycard, Chainsaw & Katana",
    location: "Entertainment & Gym Bunker (Timur Pulau dekat pantai)",
    prerequisite: "Buka pintu kaca fasilitas dengan VIP Keycard & Maintenance Keycard.",
    unlocks: "Membuka akses ke area perumahan mewah, nightclub, dan fasilitas rekreasi.",
    loot: "Guest Keycard + Senjata Katana, Chainsaw, Guitar, dan Putter",
    threats: "Mutant bertangan banyak (Legsy), Fingers, Mutan Bayi agresif."
  },
  {
    step: 7,
    icon: "👑",
    title: "Tahap 7: Ancient Armor, Pintu Emas & Ending Cube (Tamat Cerita)",
    location: "Luxury Bunker Tenggara & Gua Lava Bawah Tanah",
    prerequisite: "Buka pintu Luxury Bunker pakai Guest Keycard & wajib pakai Ancient Armor (dilapisi Solafite).",
    unlocks: "Pintu Tangan Emas ➔ Gua Lava ➔ Masuk Cube Kuno ➔ Boss Terakhir ➔ Pilihan 2 Ending Tamat!",
    loot: "Ancient Armor (Golden Plated) + Golden Space Helmet + Salib Pengusir Demon + Shotgun Ammo",
    threats: "Demon (Mutan berkaki laba-laba bertanduk api), Mutan Lava, dan Final Boss Mutasi.",
    endingGuide: "Pakai Ancient Armor & tempelkan tangan ke Pintu Emas. Masuk lorong lava ke Cube kuno. Setelah cutscene, keluar ke pantai & kalahkan Final Boss! Pilih ending: (1) Naik Helikopter bersama Tim (Tamat/Pulang), atau (2) Ambil Ransel (Tinggal di Pulau)!"
  }
];

const SOTF_TIPS_BY_STAGE = {
  1: {
    location: "Gua Pantai Utara (tepat di tepi laut utara dekat titik spawn helikopter).",
    gear: "Obor (Torch) atau Tombak untuk hemat peluru.",
    threats: "Blind Mutants di area air dangkal & lorong gelap.",
    guide: "Gua pertama yang paling mudah dan tidak butuh syarat kunci apapun.",
    proTip: "Saat pertama masuk, ikuti lorong sebelah kanan. Jangan panik saat mendengar erangan mutan, mereka buta dan hanya bereaksi pada suara langkah kaki cepat. Rebreather ada di tebing ujung dekat mayat pekerja berkepala senter. Setelah ambil Rebreather, langsung selami danau dalam di sebelahnya untuk keluar jalan pintas ke laut lepas!"
  },
  2: {
    location: "Gua Barat Daya (kaki bukit dekat danau kecil bercabang).",
    gear: "Time Bomb atau C4 (Wajib!), Stun Baton/Pistol.",
    threats: "Gumpalan daging Sluggy pemblokir jalan, Mutant Babies, Fingers.",
    guide: "Gua berliku dengan banyak percabangan jurang batu stalagmit.",
    proTip: "Di awal lorong ada mutan daging raksasa (Sluggy) yang terjepit dan menghalangi jalan. Lempar Time Bomb atau C4 ke arahnya untuk meledakkannya! Terus ikuti lorong sampai menemukan koper kargo terbuka berisi Rope Gun. Tembakkan zipline ke atas tebing seberang untuk meluncur cepat keluar dari gua!"
  },
  3: {
    location: "Gua Salju Tengah (lereng bebatuan gunung es).",
    gear: "Rebreather (Wajib), Rope Gun (Wajib), Molotov / Bom C4.",
    threats: "Twins (Mutan Kembar merangkak), Fingers, Blind Mutants bawah air.",
    guide: "Gua paling penting di seluruh game! Tanpa Sekop, kamu tidak bisa menggali bunker manapun.",
    proTip: "Gunakan Rope Gun untuk menyeberangi jurang stalagmit di pintu masuk. Selami danau air dalam pakai Rebreather. Di dalam gua terdapat turunan air terjun; perosot ke bawah dan kalahkan mutan kembar dengan senjata api atau Molotov. Sekop berada di ujung terjauh di tangan mayat berbaju oranye!"
  },
  4: {
    location: "Maintenance Bunker A (gundukan tanah di area barat dekat golf cart terbalik).",
    gear: "Shovel / Sekop (Wajib untuk menggali pintu hatch).",
    threats: "Mutant Babies di koridor kantor.",
    guide: "Fasilitas bawah tanah pertama yang membutuhkan penggalian.",
    proTip: "Gali tumpukan tanah di tengah lapangan sampai pintu palka (hatch) besi bertuliskan 'MAINTENANCE A' terlihat. Turun lewat tangga. Di dalam ruangan kamar mandi ada 3D Printer, dan kartu Maintenance Keycard terletak di atas meja kerja kantor sebelah kiri!"
  },
  5: {
    location: "Food & Dining Bunker (Bunker Bawah Tanah Barat dekat danau).",
    gear: "Maintenance Keycard (Wajib untuk scan kartu pintu masuk).",
    threats: "Fingers, Blind Mutants, John 2.0 (Mutan Cacing panjang).",
    guide: "Bunker mewah dengan fasilitas kebun hidroponik raksasa terendam air.",
    proTip: "Scan Maintenance Keycard di pintu kaca awal. Lewati kebun bawah tanah yang tergenang air. Di lantai atas terdapat ruang pemantauan kamera CCTV; VIP Keycard ada di atas meja kontrol! Setelah mengambil kartu ini, pergilah ke kuburan dekat danau untuk menggali Shotgun."
  },
  6: {
    location: "Entertainment & Gym Bunker (Timur Pulau dekat tebing pantai).",
    gear: "VIP Keycard & Maintenance Keycard.",
    threats: "Mutant bertangan banyak, Fingers, Mutan Bayi agresif.",
    guide: "Kompleks pusat kebugaran, spa bawah tanah, dan nightclub rahasia.",
    proTip: "Scan VIP Keycard di pintu kaca gym. Telusuri lorong menuju lantai dua area nightclub. Guest Keycard terletak di atas meja bundar bar dekat sofa lounge. Jangan keluar dulu! Di ruang tamu perumahan bunker ini terdapat senjata Katana (senjata melee terbaik tanpa stamina) dan Chainsaw!"
  },
  7: {
    location: "Luxury Bunker / Lava Cave (Tenggara Pulau).",
    gear: "Guest Keycard, Golden Armor (Plated Armor), Senjata Api Lengkap.",
    threats: "Mutant Boss Terakhir, Demon, Mutant raksasa lava.",
    guide: "Puncak akhir ekspedisi pulau Sons of The Forest!",
    proTip: "Buka pintu Luxury Bunker menggunakan Guest Keycard. Ambil Golden Armor di lantai bawah. Temukan pintu kuno dengan cetakan tangan manusia emas. Pasang Golden Armor di tubuh karaktermu, lalu tempelkan tangan ke pintu emas untuk memicu pembukaan Cube misterius dan ending cerita Sons of the Forest!"
  }
};

module.exports = {
  SOTF_ROADMAP,
  SOTF_TIPS_BY_STAGE
};

