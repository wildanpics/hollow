const {
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder
} = require("discord.js");
const { SOTF_ITEMS } = require("../config/sotf-items");
const { SOTF_ROADMAP, SOTF_TIPS_BY_STAGE } = require("../config/sotf-roadmap");
const {
  loadRoadmapProgress,
  saveRoadmapProgress,
  syncRoadmapPermanentMessage,
  buildRoadmapDashboard
} = require("../storage/roadmapStorage");
const {
  BASE_TYPES,
  resolveBaseType,
  loadBasesData,
  saveBasesData,
  buildBaseListEmbed,
  buildBaseDetailEmbed,
  buildBaseSelectMenu,
  buildBaseActionButtons,
  buildAddBaseModal
} = require("../storage/baseStorage");
const { loadUserLoadouts, saveUserLoadouts } = require("../storage/loadoutStorage");
const {
  mabarSessions,
  buildQuickMabarTimePanel,
  parseMabarTime,
  buildMabarPayload,
  buildQuickMabarGamePanel
} = require("../utils/mabarManager");
const {
  buildProfileMessage,
  buildMapMessage,
  buildLoadoutMessage,
  buildPoiDossierEmbed,
  poiSectorMap
} = require("../utils/statsHelper");
const { buildTipsEmbed, buildTipsButtons } = require("../commands/sotf/tips");
const { buildItemEmbed, buildItemSelectMenu } = require("../commands/sotf/item");
const {
  buildCommandsListEmbed,
  buildGeneralHelpEmbed,
  buildHelpSelectMenu,
  buildCommandHelpEmbed
} = require("../commands/general/help");

async function handleComponent(interaction) {
  // 1. Select Menus
  if (interaction.isStringSelectMenu()) {
    // Help Category Selector
    if (interaction.customId === "help_category_select") {
      const val = interaction.values[0];
      if (val === "help_general") {
        const embed = buildGeneralHelpEmbed();
        const menuRow = buildHelpSelectMenu();
        return interaction.update({ embeds: [embed], components: [menuRow] });
      }
      if (val === "help_all_commands") {
        const embed = buildCommandsListEmbed();
        const menuRow = buildHelpSelectMenu();
        return interaction.update({ embeds: [embed], components: [menuRow] });
      }
      if (val.startsWith("help_")) {
        const cmdKey = val.replace("help_", "");
        const embed = buildCommandHelpEmbed(cmdKey);
        const menuRow = buildHelpSelectMenu();
        return interaction.update({ embeds: [embed], components: [menuRow] });
      }
    }

    // Dropdown Item Selector
    if (interaction.customId === "item_select") {
      const itemId = interaction.values[0];
      const item = SOTF_ITEMS.find(i => i.id === itemId);
      const embed = buildItemEmbed(item);
      const menuRow = buildItemSelectMenu();
      return interaction.update({ embeds: [embed], components: [menuRow] });
    }

    // Dropdown Base Selector
    if (interaction.customId === "base_select") {
      const baseId = interaction.values[0];
      const bases = loadBasesData();
      const base = bases.find(b => b.id === baseId);
      if (!base) {
        return interaction.reply({ content: "Base tidak ditemukan atau sudah dihapus.", ephemeral: true });
      }
      const embed = buildBaseDetailEmbed(base);
      const btnRow = buildBaseActionButtons(base.id);
      return interaction.update({ embeds: [embed], components: [btnRow] });
    }

    // Dropdown Roadmap View Mode
    if (interaction.customId === "rm_view_mode") {
      const selectedMode = interaction.values[0];
      const progress = loadRoadmapProgress();
      progress.viewMode = selectedMode;
      saveRoadmapProgress(progress);
      const { embed, rows, files } = buildRoadmapDashboard(progress, selectedMode);
      return interaction.update({ embeds: [embed], components: rows, files });
    }

    // MAP SECTOR ZOOM Dropdown
    if (interaction.customId === "map_sector_select") {
      const sector = interaction.values[0];
      // Try to preserve current filter from embed description
      const currentDesc = interaction.message?.embeds?.[0]?.description || "";
      const filterMatch = currentDesc.match(/Filter Aktif.*?`([^`]+)`/);
      const filterLabelsInv = {
        "SEMUA TITIK": "all", "GUA CERITA (7 Tahap)": "story", "MARKAS TIM": "bases",
        "KEYCARD BUNKER": "keycard", "CRASH SITES": "crash", "TAMBANG SOLAFITE": "solafite"
      };
      const rawFilter = filterMatch ? filterLabelsInv[filterMatch[1]] || "all" : "all";
      const seasonMatch = currentDesc.includes("MUSIM DINGIN") ? "winter" : "normal";
      await interaction.deferUpdate();
      const { embed, rows, files } = await buildMapMessage(rawFilter, { sector, season: seasonMatch });
      return interaction.editReply({ embeds: [embed], components: rows, files });
    }

    // MAP POI DOSSIER Dropdown
    if (interaction.customId === "map_poi_dossier") {
      const val = interaction.values[0];
      const poiId = val.replace("poi_", "");
      const progress = loadRoadmapProgress();
      const result = buildPoiDossierEmbed(poiId, progress);
      if (!result) return interaction.reply({ content: "Intel tidak ditemukan.", ephemeral: true });
      return interaction.update({ embeds: [result.embed], components: result.rows, files: [] });
    }
  }

  // 2. Buttons
  if (interaction.isButton()) {
    const cid = interaction.customId;

    // PROFILE THEME BUTTONS
    if (cid.startsWith("prof_")) {
      const parts = cid.split("_");
      const theme = parts[1];
      const targetId = parts[2];
      const targetMember = interaction.guild.members.cache.get(targetId) || await interaction.guild.members.fetch(targetId).catch(() => null);
      if (!targetMember) return interaction.reply({ content: "Survivor tidak ditemukan.", ephemeral: true });

      const { embed, rows, files } = await buildProfileMessage(targetMember, theme);
      return interaction.update({ embeds: [embed], components: rows, files });
    }

    // MAP — Filter Buttons
    if (cid.startsWith("map_filter_")) {
      const filter = cid.replace("map_filter_", "");
      // Preserve sector & season state from current message
      const currentDesc = interaction.message?.embeds?.[0]?.description || "";
      const sectorLabelsInv = {
        "Full Island": "full", "Pantai Utara": "utara", "Hutan & Danau Barat": "barat",
        "Pegunungan Salju": "gunung", "Lapangan Golf & Timur": "timur", "Tebing Selatan": "selatan"
      };
      const sectorMatch = currentDesc.match(/Zoom Sektor.*?`([^`]+)`/);
      const sector = sectorMatch ? (sectorLabelsInv[sectorMatch[1]] || "full") : "full";
      const season = currentDesc.includes("MUSIM DINGIN") ? "winter" : "normal";
      await interaction.deferUpdate();
      const { embed, rows, files } = await buildMapMessage(filter, { sector, season });
      return interaction.editReply({ embeds: [embed], components: rows, files });
    }

    // MAP — Season Toggle
    if (cid.startsWith("map_season_")) {
      const season = cid.replace("map_season_", "");
      const currentDesc = interaction.message?.embeds?.[0]?.description || "";
      const filterLabelsInv = {
        "SEMUA TITIK": "all", "GUA CERITA (7 Tahap)": "story", "MARKAS TIM": "bases",
        "KEYCARD BUNKER": "keycard", "CRASH SITES": "crash", "TAMBANG SOLAFITE": "solafite"
      };
      const sectorLabelsInv = {
        "Full Island": "full", "Pantai Utara": "utara", "Hutan & Danau Barat": "barat",
        "Pegunungan Salju": "gunung", "Lapangan Golf & Timur": "timur", "Tebing Selatan": "selatan"
      };
      const filterMatch = currentDesc.match(/Filter Aktif.*?`([^`]+)`/);
      const filter = filterMatch ? (filterLabelsInv[filterMatch[1]] || "all") : "all";
      const sectorMatch = currentDesc.match(/Zoom Sektor.*?`([^`]+)`/);
      const sector = sectorMatch ? (sectorLabelsInv[sectorMatch[1]] || "full") : "full";
      await interaction.deferUpdate();
      const { embed, rows, files } = await buildMapMessage(filter, { sector, season });
      return interaction.editReply({ embeds: [embed], components: rows, files });
    }

    // MAP — Sector Button (from dossier "Lihat di Peta")
    if (cid.startsWith("map_sector_btn_")) {
      const sector = cid.replace("map_sector_btn_", "");
      await interaction.deferUpdate();
      const { embed, rows, files } = await buildMapMessage("all", { sector, season: "normal" });
      return interaction.editReply({ embeds: [embed], components: rows, files });
    }

    // MAP — Back to main map (from dossier)
    if (cid === "map_back_main") {
      await interaction.deferUpdate();
      const { embed, rows, files } = await buildMapMessage("all", { sector: "full", season: "normal" });
      return interaction.editReply({ embeds: [embed], components: rows, files });
    }

    // MAP — Rally Ekspedisi (Generic / no specific POI)
    if (cid === "map_rally_sotf") {
      const { embed, row } = buildQuickMabarGamePanel();
      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // MAP — Rally Ekspedisi dari dossier (specific POI)
    if (cid.startsWith("map_rally_poi_")) {
      const poiId = cid.replace("map_rally_poi_", "");
      const { MAP_INTEL } = require("../config/map-intel");
      const poi = MAP_INTEL.story.find(p => p.id === poiId);
      const gameName = poi ? `Sons of The Forest — Ekspedisi ke ${poi.name}` : "Sons of The Forest";
      const { embed, rows } = buildQuickMabarTimePanel(gameName);
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    }

    // LOADOUT PRESET BUTTONS
    if (cid.startsWith("lo_")) {
      const loadouts = loadUserLoadouts();
      const userId = interaction.user.id;

      if (cid.startsWith("lo_preset_combat_")) {
        loadouts[userId] = {
          primary: "Shotgun (Pompa) + Laser Sight",
          melee: "Katana & Chainsaw",
          gear: "Rebreather & Flashlight",
          armor: "Ancient Armor (Solafite Plated)",
          throwable: "Time Bomb C4 (3x) + Meds"
        };
      } else if (cid.startsWith("lo_preset_scout_")) {
        loadouts[userId] = {
          primary: "Crossbow / Compound Bow",
          melee: "Machete & Stun Baton",
          gear: "Rope Gun & GPS Tracker",
          armor: "Tech Armor / Stealth Suit",
          throwable: "Molotov Cocktail + Energy Bar"
        };
      } else if (cid.startsWith("lo_preset_miner_")) {
        loadouts[userId] = {
          primary: "Pistol Silenced + Torch",
          melee: "Modern Axe & Slingshot",
          gear: "Shovel (Sekop) + Rebreather",
          armor: "Bone Armor (10/10)",
          throwable: "Flare & Energy Drink"
        };
      } else if (cid.startsWith("lo_reset_")) {
        delete loadouts[userId];
      }

      saveUserLoadouts(loadouts);
      const { embed, rows, files } = buildLoadoutMessage(interaction.member);
      return interaction.update({ embeds: [embed], components: rows, files });
    }

    // TIPS BUTTONS
    if (cid.startsWith("tips_")) {
      let cat = null;
      if (cid === "tips_random") cat = null;
      else if (cid.startsWith("tips_cat_")) cat = cid.replace("tips_cat_", "");

      const embed = buildTipsEmbed(cat);
      const buttons = buildTipsButtons();
      return interaction.update({ embeds: [embed], components: buttons });
    }

    // QUICK MABAR BUTTONS
    if (cid === "qm_cancel") {
      return interaction.message.delete().catch(() => { });
    }

    if (cid === "qm_game_sotf" || cid === "qm_game_dayz" || cid === "qm_game_valheim") {
      let gameName = "Sons of The Forest";
      if (cid === "qm_game_dayz") gameName = "DayZ";
      if (cid === "qm_game_valheim") gameName = "Valheim";

      const { embed, rows } = buildQuickMabarTimePanel(gameName);
      return interaction.update({ embeds: [embed], components: rows });
    }

    if (cid === "qm_game_custom") {
      const modal = new ModalBuilder()
        .setCustomId("qm_modal_game")
        .setTitle("Pilih Game Mabar")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("input_custom_game")
              .setLabel("Nama Game")
              .setPlaceholder("Contoh: Rust, Project Zomboid, Phasmophobia")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      return interaction.showModal(modal);
    }

    if (cid.startsWith("qm_time_")) {
      const parts = cid.split("_");
      const timeType = parts[2];
      const gameName = decodeURIComponent(parts.slice(3).join("_"));

      if (timeType === "custom") {
        const modal = new ModalBuilder()
          .setCustomId(`qm_modal_time_${encodeURIComponent(gameName)}`)
          .setTitle(`Waktu Mabar: ${gameName.slice(0, 30)}`)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("input_custom_time")
                .setLabel("Waktu Mabar")
                .setPlaceholder("Contoh: 21:30 atau 45 menit atau sekarang")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            )
          );
        return interaction.showModal(modal);
      }

      let targetTime = new Date();
      if (timeType === "30m") targetTime = new Date(Date.now() + 30 * 60000);
      if (timeType === "1h") targetTime = new Date(Date.now() + 60 * 60000);
      if (timeType === "2000") targetTime = parseMabarTime("20:00");
      if (timeType === "2100") targetTime = parseMabarTime("21:00");

      const guild = interaction.guild;
      const mentionRole = guild.roles.cache.find(r =>
        r.name.includes(gameName) || r.name.includes("GAME NIGHT")
      );

      const session = {
        game: gameName,
        note: "Mabar santai HOLLOWBORN",
        targetTime,
        hostId: interaction.user.id,
        channelId: interaction.channelId,
        mentionRoleId: mentionRole ? mentionRole.id : null,
        attendees: new Set([interaction.user.id]),
        late: new Set(),
        declined: new Set(),
        reminded10m: false,
        remindedStart: false
      };

      const payload = await buildMabarPayload(session, interaction.client);
      if (mentionRole) payload.content = `<@&${mentionRole.id}> Waktu mabar baru telah dijadwalkan!`;
      await interaction.update(payload);

      mabarSessions.set(interaction.message.id, session);
      return;
    }

    // MABAR RSVP BUTTONS
    if (cid.startsWith("mabar_")) {
      const session = mabarSessions.get(interaction.message.id);
      if (!session) {
        return interaction.reply({
          content: "Sesi jadwal mabar ini sudah kedaluwarsa atau bot telah direstart.",
          ephemeral: true
        });
      }

      const userId = interaction.user.id;
      if (cid === "mabar_join") {
        session.attendees.add(userId);
        session.late.delete(userId);
        session.declined.delete(userId);
      } else if (cid === "mabar_late") {
        session.late.add(userId);
        session.attendees.delete(userId);
        session.declined.delete(userId);
      } else if (cid === "mabar_leave") {
        session.declined.add(userId);
        session.attendees.delete(userId);
        session.late.delete(userId);
      }

      const payload = await buildMabarPayload(session, interaction.client);
      return interaction.update(payload);
    }

    // ROADMAP TOGGLE BUTTONS
    if (cid.startsWith("rm_toggle_")) {
      const stepNum = cid.replace("rm_toggle_", "");
      const progress = loadRoadmapProgress();
      if (!progress.steps) progress.steps = {};
      if (!progress.steps[stepNum]) {
        progress.steps[stepNum] = { completed: false, completedBy: null, completedAt: null };
      }
      const current = progress.steps[stepNum].completed;
      const newStatus = !current;
      progress.steps[stepNum].completed = newStatus;
      progress.steps[stepNum].completedBy = newStatus ? interaction.user.tag : null;
      progress.steps[stepNum].completedAt = newStatus ? new Date().toISOString() : null;

      saveRoadmapProgress(progress);

      const { embed, rows, files } = buildRoadmapDashboard(progress, progress.viewMode || "full");
      await interaction.update({ embeds: [embed], components: rows, files });

      if (interaction.message.id !== progress.messageId) {
        syncRoadmapPermanentMessage(interaction.client, progress);
      }
      return;
    }

    // ROADMAP RESET BUTTON
    if (cid === "rm_reset") {
      const member = interaction.member;
      const isOwner = interaction.guild && interaction.guild.ownerId === interaction.user.id;
      const hasPerm = member && member.permissions && member.permissions.has(PermissionsBitField.Flags.ManageRoles);

      if (!isOwner && !hasPerm) {
        return interaction.reply({
          content: "❌ Hanya Admin / Owner server yang dapat mereset checklist roadmap.",
          ephemeral: true
        });
      }

      const progress = loadRoadmapProgress();
      for (let i = 1; i <= 7; i++) {
        progress.steps[String(i)] = { completed: false, completedBy: null, completedAt: null };
      }
      saveRoadmapProgress(progress);

      const { embed, rows, files } = buildRoadmapDashboard(progress, progress.viewMode || "full");
      await interaction.update({ embeds: [embed], components: rows, files });

      if (interaction.message.id !== progress.messageId) {
        syncRoadmapPermanentMessage(interaction.client, progress);
      }
      return;
    }

    // ROADMAP TIP TARGET BUTTON
    if (cid === "rm_tip_target") {
      const progress = loadRoadmapProgress();
      let nextStepNum = null;
      for (let i = 1; i <= 7; i++) {
        if (!progress.steps[String(i)]?.completed) {
          nextStepNum = i;
          break;
        }
      }

      if (!nextStepNum) {
        return interaction.reply({
          content: "👑 **SELURUH TAHAPAN SELESAI!**\nTim kalian sudah siap membuka Pintu Emas (Golden Door) di **Luxury Bunker / Lava Cave** untuk menyelesaikan ending cerita Sons of The Forest!",
          ephemeral: true
        });
      }

      const tip = SOTF_TIPS_BY_STAGE[nextStepNum];
      const tipEmbed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle(`💡 PANDUAN CEPAT: Tahap ${nextStepNum} — ${SOTF_ROADMAP[nextStepNum - 1].title}`)
        .setDescription(tip.guide)
        .addFields(
          { name: "📍 Lokasi Gua / Bunker", value: tip.location, inline: false },
          { name: "🎒 Perlengkapan Wajib", value: tip.gear, inline: true },
          { name: "🧟 Ancaman Mutan", value: tip.threats, inline: true },
          { name: "⚡ Trik Rahasia Survivor", value: tip.proTip, inline: false }
        )
        .setFooter({ text: "HOLLOWBORN Tactical Survival Guide • Hanya terlihat olehmu" });

      return interaction.reply({ embeds: [tipEmbed], ephemeral: true });
    }

    // BASE TRACKER BUTTONS
    if (cid === "base_btn_add") {
      const modal = buildAddBaseModal();
      return interaction.showModal(modal);
    }

    if (cid === "base_btn_refresh" || cid === "base_btn_back") {
      const bases = loadBasesData();
      const embed = buildBaseListEmbed(bases);
      const menuRow = buildBaseSelectMenu(bases);
      const btnRow = buildBaseActionButtons();
      const components = menuRow ? [menuRow, btnRow] : [btnRow];
      return interaction.update({ embeds: [embed], components });
    }

    if (cid.startsWith("base_delete_")) {
      const targetId = cid.replace("base_delete_", "");
      let bases = loadBasesData();
      const target = bases.find(b => b.id === targetId);
      if (!target) {
        return interaction.reply({ content: "Base tidak ditemukan atau sudah dihapus.", ephemeral: true });
      }
      bases = bases.filter(b => b.id !== targetId);
      saveBasesData(bases);

      const embed = buildBaseListEmbed(bases);
      const menuRow = buildBaseSelectMenu(bases);
      const btnRow = buildBaseActionButtons();
      const components = menuRow ? [menuRow, btnRow] : [btnRow];
      return interaction.update({
        content: `🗑️ Base **${target.name}** berhasil dihapus dari direktori pulau.`,
        embeds: [embed],
        components
      });
    }
  }

  // 3. Modal Submissions
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "qm_modal_game") {
      const customGame = interaction.fields.getTextInputValue("input_custom_game");
      const { embed, rows } = buildQuickMabarTimePanel(customGame);
      return interaction.update({ embeds: [embed], components: rows });
    }

    if (interaction.customId.startsWith("qm_modal_time_")) {
      const gameName = decodeURIComponent(interaction.customId.replace("qm_modal_time_", ""));
      const customTimeInput = interaction.fields.getTextInputValue("input_custom_time");
      const targetTime = parseMabarTime(customTimeInput) || new Date();

      const guild = interaction.guild;
      const mentionRole = guild.roles.cache.find(r =>
        r.name.includes(gameName) || r.name.includes("GAME NIGHT")
      );

      const session = {
        game: gameName,
        note: "Mabar santai HOLLOWBORN",
        targetTime,
        hostId: interaction.user.id,
        channelId: interaction.channelId,
        mentionRoleId: mentionRole ? mentionRole.id : null,
        attendees: new Set([interaction.user.id]),
        late: new Set(),
        declined: new Set(),
        reminded10m: false,
        remindedStart: false
      };

      const payload = await buildMabarPayload(session, interaction.client);
      if (mentionRole) payload.content = `<@&${mentionRole.id}> Waktu mabar baru telah dijadwalkan!`;
      await interaction.update(payload);

      mabarSessions.set(interaction.message.id, session);
      return;
    }

    // MODAL ADD BASE
    if (interaction.customId === "base_modal_add") {
      const name = interaction.fields.getTextInputValue("input_base_name").trim();
      const rawType = interaction.fields.getTextInputValue("input_base_type").trim();
      const location = interaction.fields.getTextInputValue("input_base_loc").trim();
      const coords = interaction.fields.getTextInputValue("input_base_coords")?.trim() || "Cek GPS Map";
      const notes = interaction.fields.getTextInputValue("input_base_notes")?.trim() || "Tidak ada catatan khusus.";

      const type = resolveBaseType(rawType);
      const typeInfo = BASE_TYPES[type];

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

      const bases = loadBasesData();
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
  }
}

module.exports = {
  handleComponent
};

