const fs = require("fs");
const path = require("path");
const {
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require("discord.js");
const { MAP_INTEL } = require("../config/map-intel");
const { loadRoadmapProgress } = require("../storage/roadmapStorage");
const { loadBasesData } = require("../storage/baseStorage");
const { loadUserLoadouts } = require("../storage/loadoutStorage");
const { mabarSessions } = require("./mabarManager");
const {
  generateProfileCanvas,
  generateIslandRadarCanvas,
  generateLoadoutCanvas,
  generateLeaderboardCanvas,
  generateWelcomeCanvas
} = require("../canvas-renderers");

function computeSurvivorStats(user, guild) {
  const progress = loadRoadmapProgress();
  const bases = loadBasesData();

  let completedRoadmap = 0;
  if (progress && progress.steps) {
    for (let i = 1; i <= 7; i++) {
      const step = progress.steps[String(i)];
      if (step?.completed && step?.completedBy) {
        if (
          step.completedBy === user.tag ||
          step.completedBy === user.username ||
          step.completedBy.startsWith(user.username)
        ) {
          completedRoadmap++;
        }
      }
    }
  }

  let registeredBases = 0;
  bases.forEach(b => {
    if (
      b.createdBy === user.id ||
      b.createdBy === user.tag ||
      b.author === user.tag
    ) {
      registeredBases++;
    }
  });

  let mabarJoined = 0;
  for (const session of mabarSessions.values()) {
    if (session.attendees && session.attendees.has(user.id)) {
      mabarJoined++;
    }
  }

  const score = completedRoadmap * 25 + registeredBases * 20 + mabarJoined * 15;
  return { completedRoadmap, registeredBases, mabarJoined, score };
}

function computeAllSurvivorLeaderboard(guild) {
  const members = guild.members.cache;
  const list = [];
  members.forEach(m => {
    if (m.user.bot) return;
    const stats = computeSurvivorStats(m.user, guild);
    list.push({
      user: m.user,
      displayName: m.displayName || m.user.username,
      score: stats.score,
      stats
    });
  });

  list.sort((a, b) => b.score - a.score);
  return list;
}

async function buildProfileMessage(member, theme = "chrome") {
  const stats = computeSurvivorStats(member.user, member.guild);
  const buffer = await generateProfileCanvas(member, stats, theme);
  const attachment = new AttachmentBuilder(buffer, { name: "survivor-profile.png" });

  const THEME_COLORS = {
    chrome: 0xE2E8F0,
    bunker: 0x00E5FF,
    frost: 0x80D8FF,
    solafite: 0xFFD700,
    toxic: 0x00E676
  };
  const embedColor = THEME_COLORS[theme] || THEME_COLORS.chrome;

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`🪪 TACTICAL SURVIVOR ID // ${member.displayName.toUpperCase()}`)
    .setDescription(
      `**OPERATIVE:** <@${member.id}> (${member.user.tag})\n` +
      `**STATUS CLEARANCE:** \`LEVEL-1 VERIFIED\` • **TOTAL SKOR:** \`${stats.score} Poin\`\n\n` +
      `• 🗺️ **Roadmap Gua Selesai:** **${stats.completedRoadmap}/7** Tahapan\n` +
      `• 🏰 **Markas Tim Terdaftar:** **${stats.registeredBases}** Base Camp\n` +
      `• 🎮 **Ekspedisi Mabar:** **${stats.mabarJoined}** Sesi Diikuti\n\n` +
      `*Gunakan tombol di bawah untuk mengganti tema visual kartu identitasmu:*`
    )
    .setImage("attachment://survivor-profile.png")
    .setFooter({ text: "HOLLOWBORN • BORN FROM NOTHING. UNITED AS ONE." })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`prof_chrome_${member.id}`).setLabel("Chrome").setEmoji("⚔️").setStyle(theme === "chrome" ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`prof_bunker_${member.id}`).setLabel("Bunker").setEmoji("🎛️").setStyle(theme === "bunker" ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`prof_frost_${member.id}`).setLabel("Frost").setEmoji("❄️").setStyle(theme === "frost" ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`prof_solafite_${member.id}`).setLabel("Solafite").setEmoji("👑").setStyle(theme === "solafite" ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`prof_toxic_${member.id}`).setLabel("Toxic").setEmoji("☣️").setStyle(theme === "toxic" ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  return { embed, rows: [row], files: [attachment] };
}

async function buildMapMessage(filterMode = "all", mapOptions = {}) {
  const { sector = "full", season = "normal" } = mapOptions;
  const bases = loadBasesData();
  const progress = loadRoadmapProgress();
  const buffer = await generateIslandRadarCanvas(bases, filterMode, progress, { sector, season });
  const attachment = new AttachmentBuilder(buffer, { name: "island-radar.png" });

  const steps = progress?.steps || {};
  let completedCount = 0;
  for (let i = 1; i <= 7; i++) {
    if (steps[String(i)]?.completed) completedCount++;
  }
  const percent = Math.round((completedCount / 7) * 100);

  const filterLabels = {
    all: "SEMUA TITIK", story: "GUA CERITA (7 Tahap)", bases: "MARKAS TIM",
    keycard: "KEYCARD BUNKER", crash: "CRASH SITES", solafite: "TAMBANG SOLAFITE"
  };
  const sectorLabels = {
    full: "Full Island", utara: "Pantai Utara", barat: "Hutan & Danau Barat",
    gunung: "Pegunungan Salju", timur: "Lapangan Golf & Timur", selatan: "Tebing Selatan"
  };

  const embed = new EmbedBuilder()
    .setColor(season === "winter" ? 0x82CFFF : 0x00E5FF)
    .setTitle("🗺️ HOLLOWBORN — TACTICAL ISLAND SATELLITE RADAR")
    .setDescription(
      `**SONS OF THE FOREST • REAL SATELLITE ISLAND RECONNAISSANCE**\n` +
      `• **Filter Aktif:** \`${filterLabels[filterMode] || filterMode.toUpperCase()}\`\n` +
      `• **Zoom Sektor:** \`${sectorLabels[sector] || sector}\`\n` +
      `• **Mode Musim:** ${season === "winter" ? "❄️ **MUSIM DINGIN**" : "☀️ **NORMAL**"}\n` +
      `• **Progres Eksplorasi:** \`${completedCount}/7\` Titik Cerita Selesai (${percent}%)\n` +
      `• **Markas Tim Terlacak:** \`${bases.length}\` lokasi aktif\n\n` +
      `*Gunakan dropdown **Zoom Sektor** untuk memperbesar wilayah tertentu.*\n` +
      `*Gunakan dropdown **Dossier Intel** untuk melihat loot \& guide gua!*`
    )
    .setImage("attachment://island-radar.png")
    .setFooter({ text: "Ketik /base add untuk mendaftarkan markas baru • !map help untuk panduan lengkap" })
    .setTimestamp();

  // ── Row 1: Sector Zoom Dropdown
  const sectorMenu = new StringSelectMenuBuilder()
    .setCustomId("map_sector_select")
    .setPlaceholder("🔍 Zoom Sektor Wilayah Pulau...")
    .addOptions([
      new StringSelectMenuOptionBuilder().setLabel("Full Island").setValue("full").setEmoji("🗺️").setDescription("Lihat seluruh pulau Sons of The Forest").setDefault(sector === "full"),
      new StringSelectMenuOptionBuilder().setLabel("Pantai Utara").setValue("utara").setEmoji("🌊").setDescription("Rebreather Cave, pantai spawn, kamp awal [A1-D3]").setDefault(sector === "utara"),
      new StringSelectMenuOptionBuilder().setLabel("Hutan & Danau Barat").setValue("barat").setEmoji("🌲").setDescription("Rope Gun Cave, Food Bunker, danau [A3-D7]").setDefault(sector === "barat"),
      new StringSelectMenuOptionBuilder().setLabel("Pegunungan Salju").setValue("gunung").setEmoji("🏔️").setDescription("Shovel Cave, Maint Bunker, lereng salju [C2-G6]").setDefault(sector === "gunung"),
      new StringSelectMenuOptionBuilder().setLabel("Lapangan Golf & Timur").setValue("timur").setEmoji("⛳").setDescription("Guest Bunker, Katana, Helipad Crash Site [E2-H5]").setDefault(sector === "timur"),
      new StringSelectMenuOptionBuilder().setLabel("Tebing Selatan").setValue("selatan").setEmoji("🌋").setDescription("Golden Door, Luxury Bunker, Lava Cave [D6-H8]").setDefault(sector === "selatan"),
    ]);

  // ── Row 2: POI Intel Dossier Dropdown
  const poiMenu = new StringSelectMenuBuilder()
    .setCustomId("map_poi_dossier")
    .setPlaceholder("📖 Pilih Lokasi — Buka Intel Dossier & Guide Loot...")
    .addOptions(MAP_INTEL.story.map(poi => {
      const stepData = steps[String(poi.step)];
      const done = stepData?.completed;
      const statusEmoji = done ? "✅" : (poi.step === parseInt(Object.keys(steps).find(k => !steps[k]?.completed)) ? "🎯" : "🔒");
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${poi.icon} ${poi.name}`)
        .setValue(`poi_${poi.id}`)
        .setEmoji(done ? "✅" : (poi.id === "golden-door" ? "🚪" : "📍"))
        .setDescription(`Tahap ${poi.step} • ${poi.sector} • ${done ? "CLEARED" : "BELUM DIJELAJAHI"}`);
    }));

  // ── Row 3: Filter Category Buttons (6 filter options)
  const filterRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("map_filter_all").setLabel("Semua").setEmoji("🌐").setStyle(filterMode === "all" ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("map_filter_story").setLabel("Gua Cerita").setEmoji("🤿").setStyle(filterMode === "story" ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("map_filter_bases").setLabel("Markas Tim").setEmoji("🏰").setStyle(filterMode === "bases" ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("map_filter_keycard").setLabel("Keycard").setEmoji("🔑").setStyle(filterMode === "keycard" ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("map_filter_crash").setLabel("Crash Site").setEmoji("🚁").setStyle(filterMode === "crash" ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  // ── Row 4: Utility Buttons
  const utilRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("map_filter_solafite").setLabel("Solafite Mine").setEmoji("💎").setStyle(filterMode === "solafite" ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`map_season_${season === "winter" ? "normal" : "winter"}`).setLabel(season === "winter" ? "Mode Normal" : "Mode Dingin").setEmoji(season === "winter" ? "☀️" : "❄️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("map_rally_sotf").setLabel("Buat Ekspedisi Mabar").setEmoji("⚔️").setStyle(ButtonStyle.Danger)
  );

  return {
    embed,
    rows: [
      new ActionRowBuilder().addComponents(sectorMenu),
      new ActionRowBuilder().addComponents(poiMenu),
      filterRow,
      utilRow
    ],
    files: [attachment],
    _state: { filterMode, sector, season }
  };
}

function buildPoiDossierEmbed(poiId, progressData = {}) {
  const poi = MAP_INTEL.story.find(p => p.id === poiId);
  if (!poi) return null;

  const steps = progressData?.steps || {};
  const stepData = steps[String(poi.step)];
  const isDone = stepData?.completed;
  const isActive = !isDone && Object.keys(steps).every((k, i) => parseInt(k) >= poi.step || steps[k]?.completed);

  const lootList = poi.loot.map(l => `> • ${l}`).join("\n");
  const threatList = poi.threats.map(t => `> ⚠️ ${t}`).join("\n");
  const reqList = poi.requirements.map(r => `> ✅ ${r}`).join("\n");

  const statusLine = isDone
    ? `✅ **CLEARED** oleh **@${(stepData.completedBy || "Tim").split("#")[0]}**`
    : (isActive ? `🎯 **TARGET EKSPEDISI AKTIF SEKARANG!**` : `🔒 **TERKUNCI — Selesaikan tahap sebelumnya dulu**`);

  const embed = new EmbedBuilder()
    .setColor(isDone ? 0x00E676 : (isActive ? 0x00E5FF : 0xFF9100))
    .setTitle(`${poi.icon} INTEL DOSSIER — ${poi.fullName}`)
    .setDescription(
      `**STATUS:** ${statusLine}\n` +
      `**Sektor:** \`${poi.sector}\` • **Grid GPS:** \`${poi.gridRef}\` • **Tingkat Ancaman:** ${poi.difficulty}\n\n` +
      `📦 **LOOT UTAMA:**\n${lootList}\n\n` +
      `⚠️ **ANCAMAN & MUSUH:**\n${threatList}\n\n` +
      `🎒 **PERSYARATAN MASUK:**\n${reqList}\n\n` +
      `📋 **CATATAN TAKTIS:**\n> *${poi.notes}*`
    )
    .setFooter({ text: `Tahap ${poi.step} dari 7 • Sons of The Forest Expedition Guide` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`map_rally_poi_${poi.id}`)
      .setLabel(`Buat Ekspedisi ke ${poi.name}`)
      .setEmoji("⚔️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`map_sector_btn_${poiSectorMap[poi.id] || "full"}`)
      .setLabel("Lihat di Peta")
      .setEmoji("📍")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("map_back_main")
      .setLabel("Kembali ke Peta")
      .setEmoji("🗺️")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, rows: [row] };
}

const poiSectorMap = {
  "rebreather": "utara",
  "rope-gun": "barat",
  "shovel-cave": "gunung",
  "maintenance-bunker": "gunung",
  "food-bunker": "barat",
  "guest-bunker": "timur",
  "golden-door": "selatan"
};

function buildLoadoutMessage(member) {
  const loadouts = loadUserLoadouts();
  const userLoadout = loadouts[member.id] || {
    primary: "Shotgun (Pompa) + Laser",
    melee: "Katana & Chainsaw",
    gear: "Rebreather & Rope Gun & Shovel",
    armor: "Ancient Armor (Solafite Plated)",
    throwable: "Time Bomb C4 & Meds"
  };

  const buffer = generateLoadoutCanvas(member, userLoadout);
  const attachment = new AttachmentBuilder(buffer, { name: "survival-loadout.png" });

  const embed = new EmbedBuilder()
    .setColor(0x00E676)
    .setTitle(`🎒 SURVIVAL LOADOUT BLUEPRINT // ${member.displayName.toUpperCase()}`)
    .setDescription(
      `**OPERATIVE:** <@${member.id}>\n` +
      `Matras perlengkapan taktis untuk persiapan ekspedisi gua dan bunker Sons of the Forest.\n\n` +
      `• 🔫 **Senjata Utama:** ${userLoadout.primary}\n` +
      `• ⚔️ **Senjata Melee:** ${userLoadout.melee}\n` +
      `• ⛏️ **Gear Eksplorasi:** ${userLoadout.gear}\n` +
      `• 🛡️ **Tipe Armor:** ${userLoadout.armor}\n` +
      `• 💣 **Item Lempar / Meds:** ${userLoadout.throwable}\n\n` +
      `*Pilih tombol di bawah untuk mengganti preset perlengkapanmu:*`
    )
    .setImage("attachment://survival-loadout.png")
    .setFooter({ text: "Pilih preset gear sesuai peranmu dalam ekspedisi!" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`lo_preset_combat_${member.id}`).setLabel("Preset Tempur (Shotgun)").setEmoji("⚔️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`lo_preset_scout_${member.id}`).setLabel("Preset Scout (Crossbow)").setEmoji("🏹").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`lo_preset_miner_${member.id}`).setLabel("Preset Gua (Shovel)").setEmoji("⛏️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`lo_reset_${member.id}`).setLabel("Reset Default").setEmoji("🔄").setStyle(ButtonStyle.Secondary)
  );

  return { embed, rows: [row], files: [attachment] };
}

async function buildLeaderboardMessage(guild) {
  const topSurvivors = computeAllSurvivorLeaderboard(guild);
  const buffer = await generateLeaderboardCanvas(guild, topSurvivors);
  const attachment = new AttachmentBuilder(buffer, { name: "hall-of-fame.png" });

  let textRanks = "";
  if (topSurvivors.length === 0) {
    textRanks = "_Belum ada kontribusi survivor tercatat. Selesaikan tahap roadmap, daftarkan base, atau ikut mabar!_\n";
  } else {
    topSurvivors.slice(0, 5).forEach((s, idx) => {
      const medals = ["🥇", "🥈", "🥉", "🎖️", "🎖️"];
      textRanks += `${medals[idx] || "•"} **#${idx + 1} ${s.displayName}** — \`${s.score} Poin\` (Roadmap: ${s.stats.completedRoadmap}/7 • Base: ${s.stats.registeredBases} • Mabar: ${s.stats.mabarJoined})\n`;
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle("🏆 HOLLOWBORN — EXPEDITION HALL OF FAME")
    .setDescription(
      `**Papan Peringkat Operative Paling Berjasa di Pulau SOTF:**\n\n` +
      textRanks +
      `\n💡 **Cara Mendapatkan Poin Kontribusi:**\n` +
      `• Centang Tahap Roadmap (\`/roadmap\`): **+25 Poin**\n` +
      `• Tambah Markas Tim (\`/base add\`): **+20 Poin**\n` +
      `• Ikuti Ekspedisi Mabar (\`/mabar\`): **+15 Poin**`
    )
    .setImage("attachment://hall-of-fame.png")
    .setFooter({ text: "Terus berkontribusi untuk menaikkan peringkatmu di Hall of Fame!" })
    .setTimestamp();

  return { embed, files: [attachment] };
}

async function buildWelcomeTestMessage(member) {
  const buffer = await generateWelcomeCanvas(member);
  const attachment = new AttachmentBuilder(buffer, { name: "welcome-tactical.png" });

  return {
    content: `🚨 **PERINGATAN RADAR:** Survivor baru mendarat di Site 2: <@${member.id}>`,
    files: [attachment]
  };
}

function buildLobbyWelcomeEmbed(member) {
  const bannerPath = path.resolve(__dirname, "../../assets/welcome-greet-banner.jpg");
  const files = [];
  const embed = new EmbedBuilder()
    .setColor(0xD4D4D8)
    .setAuthor({
      name: "HOLLOWBORN // NEW MEMBER ARRIVAL",
      iconURL: member.guild?.iconURL({ extension: "png" }) || undefined
    })
    .setTitle(`Selamat Datang, ${member.displayName || member.user.username}!`)
    .setThumbnail(member.user.displayAvatarURL({ extension: "png", size: 256 }))
    .setDescription(
      `Halo <@${member.id}>! Selamat bergabung di server **HOLLOWBORN**. 👋\n\n` +
      `Buat teman-teman yang sedang online, yuk langsung sapa & sambut member baru kita di sini biar makin akrab!\n\n` +
      `• **Member Ke:** \`#${member.guild.memberCount}\`\n` +
      `• **Jangan Sungkan:** Kenalan, ngobrol santai, dan ajak mabar bareng kapan saja!`
    )
    .setFooter({ text: "BORN FROM NOTHING. UNITED AS ONE. • HOLLOWBORN Community" })
    .setTimestamp();

  if (fs.existsSync(bannerPath)) {
    const attachment = new AttachmentBuilder(bannerPath, { name: "hollowborn-welcome-banner.jpg" });
    embed.setImage("attachment://hollowborn-welcome-banner.jpg");
    files.push(attachment);
  }

  return {
    content: `👋 Selamat datang di server, <@${member.id}>! Yuk disapa bareng-bareng teman baru kita!`,
    embeds: [embed],
    files
  };
}

module.exports = {
  computeSurvivorStats,
  computeAllSurvivorLeaderboard,
  buildProfileMessage,
  buildMapMessage,
  buildLoadoutMessage,
  buildLeaderboardMessage,
  buildWelcomeTestMessage,
  buildLobbyWelcomeEmbed,
  buildPoiDossierEmbed,
  poiSectorMap
};

