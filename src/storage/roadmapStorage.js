const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder
} = require("discord.js");
const { SOTF_ROADMAP, SOTF_TIPS_BY_STAGE } = require("../config/sotf-roadmap");
const { generateRoadmapCanvas } = require("../canvas-renderers");

const ROADMAP_FILE = path.join(__dirname, "../../data/roadmap-progress.json");

function loadRoadmapProgress() {
  try {
    if (fs.existsSync(ROADMAP_FILE)) {
      return JSON.parse(fs.readFileSync(ROADMAP_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Gagal membaca roadmap-progress.json:", err.message);
  }
  return {
    channelId: null,
    messageId: null,
    lastUpdated: null,
    steps: {
      "1": { completed: false, completedBy: null, completedAt: null },
      "2": { completed: false, completedBy: null, completedAt: null },
      "3": { completed: false, completedBy: null, completedAt: null },
      "4": { completed: false, completedBy: null, completedAt: null },
      "5": { completed: false, completedBy: null, completedAt: null },
      "6": { completed: false, completedBy: null, completedAt: null },
      "7": { completed: false, completedBy: null, completedAt: null }
    }
  };
}

function saveRoadmapProgress(data) {
  try {
    const dir = path.dirname(ROADMAP_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    data.lastUpdated = Date.now();
    fs.writeFileSync(ROADMAP_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan roadmap-progress.json:", err.message);
  }
}

async function syncRoadmapPermanentMessage(discordClient, progressData) {
  if (!progressData.channelId || !progressData.messageId) return;
  try {
    const channel = await discordClient.channels.fetch(progressData.channelId).catch(() => null);
    if (!channel) return;
    const msg = await channel.messages.fetch(progressData.messageId).catch(() => null);
    if (!msg) return;
    const { embed, rows, files } = buildRoadmapDashboard(progressData, progressData.viewMode || "full");
    await msg.edit({ embeds: [embed], components: rows, files });
  } catch (err) {
    console.error("Gagal sync permanent roadmap message:", err.message);
  }
}

function buildRoadmapDashboard(progressData, viewMode = "full") {
  const steps = progressData.steps || {};
  let completedCount = 0;
  for (let i = 1; i <= 7; i++) {
    if (steps[String(i)]?.completed) completedCount++;
  }

  const percent = Math.round((completedCount / 7) * 100);

  // Tactical HUD Progress Bar
  const totalBlocks = 12;
  const filledBlocks = Math.round((completedCount / 7) * totalBlocks);
  const hudProgressBar = "▰".repeat(filledBlocks) + "▱".repeat(totalBlocks - filledBlocks);

  let nextStepNum = null;
  for (let i = 1; i <= 7; i++) {
    if (!steps[String(i)]?.completed) {
      nextStepNum = i;
      break;
    }
  }

  const isAllCompleted = completedCount === 7;

  // Last update time string
  let lastActivityText = "Belum ada riwayat aktivitas.";
  let lastCompletedStep = null;
  for (let i = 7; i >= 1; i--) {
    if (steps[String(i)]?.completed && steps[String(i)]?.completedBy) {
      lastCompletedStep = i;
      break;
    }
  }
  if (lastCompletedStep) {
    const s = steps[String(lastCompletedStep)];
    const timeAgo = s.completedAt ? `<t:${Math.floor(new Date(s.completedAt).getTime() / 1000)}:R>` : "Baru saja";
    lastActivityText = `Tahap ${lastCompletedStep} (${SOTF_ROADMAP[lastCompletedStep - 1].title.split(":")[1]?.trim() || "Item"}) diselesaikan oleh **${s.completedBy}** • ${timeAgo}`;
  }

  const embed = new EmbedBuilder()
    .setColor(isAllCompleted ? 0xFFD700 : (completedCount > 0 ? 0x00E5FF : 0xFF1744))
    .setTitle("🗺️ HOLLOWBORN — SOTF STORY EXPEDITION RADAR")
    .setDescription(
      `**PROGRES CERITA PULAU:** \`[${hudProgressBar}]\` **${percent}%** (${completedCount}/7 Tahap Selesai)\n` +
      `👑 **ALUR MENUJU TAMAT:** 🤿 Alat Selam ➔ 🔫 Zipline ➔ ⛏️ Sekop ➔ 💳 Keycard Fasilitas ➔ 🛡️ Ancient Armor ➔ 🌋 Gua Lava & Cube ➔ 🚁 Tamat SOTF!\n\n` +
      (isAllCompleted
        ? "🎉 **LUAR BIASA! SELURUH 7 TAHAPAN TAMAT SELESAI!**\n👑 *Tim kalian sudah siap membuka Pintu Tangan Emas, menjelajahi Gua Lava, dan menamatkan misteri Cube kuno bersama tim!*"
        : `🎯 **TARGET MISI AKTIF SEKARANG:**\n👉 **Tahap ${nextStepNum}: ${SOTF_ROADMAP[nextStepNum - 1].title}**\n📍 *Lokasi:* ${SOTF_ROADMAP[nextStepNum - 1].location}\n⚠️ *Syarat Wajib:* ${SOTF_ROADMAP[nextStepNum - 1].prerequisite}\n🔓 *Hasil Membuka:* ${SOTF_ROADMAP[nextStepNum - 1].unlocks}\n\n` +
        `💡 *Klik tombol **[💡 Trik Target]** untuk panduan taktis & rahasia gua target ini!*\n` +
        `🕒 *Aktivitas Terakhir: ${lastActivityText}*`)
    )
    .setImage("attachment://roadmap-hud.png")
    .setFooter({
      text: "HOLLOWBORN Interactive Roadmap • Klik tombol nomor di bawah untuk update checklist!"
    })
    .setTimestamp();

  // If Full Mode: Add 7 steps fields
  if (viewMode === "full") {
    for (const item of SOTF_ROADMAP) {
      const s = steps[String(item.step)];
      const isDone = s?.completed;
      const isNext = item.step === nextStepNum;

      let statusBadge = "⏳ **Belum Selesai**";
      if (isDone) {
        statusBadge = `✅ **SELESAI** *(dicentang oleh ${s.completedBy || "Survivor"})*`;
      } else if (isNext) {
        statusBadge = "🎯 **SEDANG BERJALAN / TARGET UTAMA**";
      } else {
        statusBadge = `🔒 *Terkunci (Selesaikan Tahap ${item.step - 1} terlebih dahulu)*`;
      }

      let fieldValue =
        `• **Status:** ${statusBadge}\n` +
        `• 📍 **Lokasi:** ${item.location}\n` +
        `• 🎒 **Syarat Wajib:** ${item.prerequisite}\n` +
        `• 🎁 **Item & Senjata:** ${item.loot}\n` +
        `• 🔓 **Akses Terbuka:** ${item.unlocks}\n` +
        `• 🧟 **Ancaman Musuh:** ${item.threats}`;

      if (item.endingGuide) {
        fieldValue += `\n• 🏆 **Panduan Tamat:** ${item.endingGuide}`;
      }

      embed.addFields({
        name: `${isDone ? "✅" : (isNext ? "🎯" : "🔒")} ${item.title}`,
        value: fieldValue,
        inline: false
      });
    }
  } else if (viewMode === "threats") {
    // Mode Bahaya & Syarat Gua
    for (let i = 1; i <= 7; i++) {
      const tip = SOTF_TIPS_BY_STAGE[i];
      const s = steps[String(i)];
      const isDone = s?.completed;

      embed.addFields({
        name: `${isDone ? "✅" : "⚠️"} Tahap ${i}: ${SOTF_ROADMAP[i - 1].title}`,
        value: `🧟 **Musuh:** ${tip.threats}\n🎒 **Bawa Wajib:** ${tip.gear}\n📍 **Lokasi:** ${tip.location}`,
        inline: false
      });
    }
  }

  // Row 0: Dropdown Mode Tampilan
  const viewSelect = new StringSelectMenuBuilder()
    .setCustomId("rm_view_mode")
    .setPlaceholder("🎛️ Pilih Mode Tampilan Embed...")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Mode Lengkap (Semua 7 Tahapan & Ending)")
        .setValue("full")
        .setDescription("Menampilkan detail seluruh 7 gua & bunker pulau menuju tamat")
        .setEmoji("📜")
        .setDefault(viewMode === "full"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Mode Ringkas (HUD & Target Aktif)")
        .setValue("compact")
        .setDescription("Fokus ke target sekarang dan grafik HUD (ramah layar HP)")
        .setEmoji("📊")
        .setDefault(viewMode === "compact"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Mode Bahaya & Syarat Gua")
        .setValue("threats")
        .setDescription("Menampilkan daftar musuh mutan & gear wajib tiap tahap")
        .setEmoji("⚠️")
        .setDefault(viewMode === "threats")
    );

  const rowView = new ActionRowBuilder().addComponents(viewSelect);

  const getBtnStyle = (stepNum) => {
    if (steps[String(stepNum)]?.completed) return ButtonStyle.Success;
    if (stepNum === nextStepNum) return ButtonStyle.Primary;
    return ButtonStyle.Secondary;
  };

  const getBtnEmoji = (stepNum, defaultEmoji) => {
    if (steps[String(stepNum)]?.completed) return "✅";
    if (stepNum === nextStepNum) return "🎯";
    return defaultEmoji;
  };

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("rm_toggle_1")
      .setLabel("1. Rebreather")
      .setEmoji(getBtnEmoji(1, "🤿"))
      .setStyle(getBtnStyle(1)),
    new ButtonBuilder()
      .setCustomId("rm_toggle_2")
      .setLabel("2. Rope Gun")
      .setEmoji(getBtnEmoji(2, "🔫"))
      .setStyle(getBtnStyle(2)),
    new ButtonBuilder()
      .setCustomId("rm_toggle_3")
      .setLabel("3. Shovel")
      .setEmoji(getBtnEmoji(3, "⛏️"))
      .setStyle(getBtnStyle(3)),
    new ButtonBuilder()
      .setCustomId("rm_toggle_4")
      .setLabel("4. Maint Card")
      .setEmoji(getBtnEmoji(4, "💳"))
      .setStyle(getBtnStyle(4))
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("rm_toggle_5")
      .setLabel("5. VIP Card")
      .setEmoji(getBtnEmoji(5, "🍸"))
      .setStyle(getBtnStyle(5)),
    new ButtonBuilder()
      .setCustomId("rm_toggle_6")
      .setLabel("6. Guest Card")
      .setEmoji(getBtnEmoji(6, "🎟️"))
      .setStyle(getBtnStyle(6)),
    new ButtonBuilder()
      .setCustomId("rm_toggle_7")
      .setLabel("7. Golden Door")
      .setEmoji(getBtnEmoji(7, "👑"))
      .setStyle(getBtnStyle(7)),
    new ButtonBuilder()
      .setCustomId("rm_tip_target")
      .setLabel("Trik Target")
      .setEmoji("💡")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("rm_reset")
      .setLabel("Reset")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Danger)
  );

  const buffer = generateRoadmapCanvas(progressData);
  const attachment = new AttachmentBuilder(buffer, { name: "roadmap-hud.png" });

  return { embed, rows: [rowView, row1, row2], files: [attachment] };
}

module.exports = {
  ROADMAP_FILE,
  loadRoadmapProgress,
  saveRoadmapProgress,
  syncRoadmapPermanentMessage,
  buildRoadmapDashboard
};

