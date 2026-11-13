const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} = require("discord.js");
const { generateMabarTicketCanvas } = require("../canvas-renderers");

const mabarSessions = new Map();
const SESSIONS_FILE = path.join(__dirname, "../../data/mabar-sessions.json");

function loadMabarSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
      const now = Date.now();
      for (const [id, s] of Object.entries(data)) {
        const targetTime = new Date(s.targetTime);
        if (now - targetTime.getTime() < 8 * 3600 * 1000) {
          mabarSessions.set(id, {
            game: s.game,
            note: s.note || "",
            targetTime,
            rawTime: s.rawTime || formatMabarTimeDisplay(targetTime),
            hostId: s.hostId,
            hostTag: s.hostTag || "Host",
            channelId: s.channelId,
            mentionRoleId: s.mentionRoleId || null,
            attendees: new Set(s.attendees || []),
            late: new Set(s.late || []),
            declined: new Set(s.declined || []),
            reminded10m: Boolean(s.reminded10m),
            remindedStart: Boolean(s.remindedStart)
          });
        }
      }
    }
  } catch (err) {
    console.error("Gagal membaca mabar-sessions.json:", err.message);
  }
}

function saveMabarSessions() {
  try {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const obj = {};
    for (const [id, s] of mabarSessions.entries()) {
      obj[id] = {
        game: s.game,
        note: s.note,
        targetTime: s.targetTime.toISOString(),
        rawTime: s.rawTime,
        hostId: s.hostId,
        hostTag: s.hostTag,
        channelId: s.channelId,
        mentionRoleId: s.mentionRoleId,
        attendees: Array.from(s.attendees || []),
        late: Array.from(s.late || []),
        declined: Array.from(s.declined || []),
        reminded10m: s.reminded10m,
        remindedStart: s.remindedStart
      };
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan mabar-sessions.json:", err.message);
  }
}

// Load saved sessions on startup
loadMabarSessions();

function buildQuickMabarGamePanel() {
  const embed = new EmbedBuilder()
    .setColor(0x00E5FF)
    .setTitle("🎮 BUAT JADWAL MABAR CEPAT (2-KLIK)")
    .setDescription(
      "**Langkah 1 dari 2:** Klik salah satu tombol game di bawah:\n\n" +
      "*(Atau ketik cepat di chat:* `!mabar 20:00` *atau* `!mabar sekarang`*)*"
    )
    .setFooter({ text: "HOLLOWBORN Quick Mabar Panel" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("qm_game_sotf")
      .setLabel("Sons of The Forest")
      .setEmoji("🪓")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("qm_game_custom")
      .setLabel("Game Lain...")
      .setEmoji("✏️")
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, row };
}

function buildQuickMabarTimePanel(gameName) {
  const encGame = encodeURIComponent(gameName);
  const embed = new EmbedBuilder()
    .setColor(0x00E5FF)
    .setTitle("🎮 PILIH WAKTU MABAR")
    .setDescription(
      `Game Terpilih: **${gameName}**\n\n` +
      "**Langkah 2 dari 2:** Klik tombol waktu di bawah untuk langsung mempublikasikan jadwal & countdown live:"
    )
    .setFooter({ text: "Jadwal akan otomatis dipublish saat tombol waktu diklik!" });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`qm_time_now_${encGame}`)
      .setLabel("Sekarang Juga!")
      .setEmoji("⚡")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`qm_time_30m_${encGame}`)
      .setLabel("30 Menit Lagi")
      .setEmoji("⏱️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`qm_time_1h_${encGame}`)
      .setLabel("1 Jam Lagi")
      .setEmoji("⏱️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`qm_time_2000_${encGame}`)
      .setLabel("Jam 20:00 WIB")
      .setEmoji("🌙")
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`qm_time_2100_${encGame}`)
      .setLabel("Jam 21:00 WIB")
      .setEmoji("🌙")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`qm_time_custom_${encGame}`)
      .setLabel("Ketik Jam Lain...")
      .setEmoji("✏️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("qm_cancel")
      .setLabel("Batal")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger)
  );

  return { embed, rows: [row1, row2] };
}

function parseWibTime(h, m, isBesok = false) {
  const now = new Date();
  const wibNow = new Date(now.getTime() + 7 * 3600 * 1000);
  let year = wibNow.getUTCFullYear();
  let month = wibNow.getUTCMonth();
  let day = wibNow.getUTCDate();

  const currentWibHour = wibNow.getUTCHours();
  const currentWibMin = wibNow.getUTCMinutes();
  if (isBesok || (h < currentWibHour || (h === currentWibHour && m <= currentWibMin))) {
    day += 1;
  }

  return new Date(Date.UTC(year, month, day, h - 7, m, 0, 0));
}

function parseMabarTime(inputRaw) {
  if (!inputRaw || !inputRaw.trim()) return null;
  let input = inputRaw.trim().toLowerCase();
  const now = new Date();

  // 1. Sekarang / Now
  if (["sekarang", "now", "skrg", "gas", "gass", "ready"].includes(input)) {
    return now;
  }

  const isBesok = input.includes("besok") || input.includes("tomorrow");
  input = input.replace(/\b(besok|tomorrow)\b/g, "").trim();

  // Strip prefixes like 'jam', 'pukul', and suffixes like 'wib', 'wita', 'wit'
  input = input.replace(/\b(wib|wita|wit)\b/g, "").trim();
  input = input.replace(/^(pukul|jam)\s*/g, "").trim();

  // 2. Relative Minutes / Hours (e.g. '30m', '45 menit', '1 jam', '2 jam')
  const relHourMatch = input.match(/^(\d+(\.\d+)?)\s*(jam|h|hour|hours)$/);
  if (relHourMatch) {
    return new Date(now.getTime() + parseFloat(relHourMatch[1]) * 3600000);
  }

  const relMinMatch = input.match(/^(\d+)\s*(menit|m|min|mins|minute|minutes)$/);
  if (relMinMatch) {
    return new Date(now.getTime() + parseInt(relMinMatch[1], 10) * 60000);
  }

  // 3. Indonesian period of day: '8 malam', '2 siang', '4 sore', '7 pagi'
  const periodMatch = input.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)$/);
  if (periodMatch) {
    let h = parseInt(periodMatch[1], 10);
    const m = periodMatch[2] ? parseInt(periodMatch[2], 10) : 0;
    const period = periodMatch[3];
    if (period === "malam" && h < 12) h += 12;
    if (period === "sore" && h < 12) h += 12;
    if (period === "siang" && h < 12 && h >= 1 && h <= 5) h += 12;
    if (period === "pagi" && h === 12) h = 0;
    return parseWibTime(h, m, isBesok);
  }

  // 4. Standard Clock: '20:00', '20.00', '08:30'
  const clockMatch = input.match(/^(\d{1,2})[:.](\d{2})$/);
  if (clockMatch) {
    const h = parseInt(clockMatch[1], 10);
    const m = parseInt(clockMatch[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return parseWibTime(h, m, isBesok);
    }
  }

  // 5. Plain single hour: '20', '21', '8'
  const singleHourMatch = input.match(/^(\d{1,2})$/);
  if (singleHourMatch) {
    let h = parseInt(singleHourMatch[1], 10);
    if (h >= 1 && h <= 23) {
      if (h <= 6) h += 12;
      else if (h <= 11) {
        const wibNow = new Date(now.getTime() + 7 * 3600 * 1000);
        if (wibNow.getUTCHours() >= 12) h += 12;
      }
      return parseWibTime(h, 0, isBesok);
    }
  }

  return null;
}

function formatMabarTimeDisplay(targetTime) {
  if (!targetTime) return "SEGERA";
  const diffMin = Math.round((targetTime.getTime() - Date.now()) / 60000);
  if (diffMin <= 2 && diffMin >= -2) return "SEGERA (NOW)";

  const wibTime = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(targetTime).replace(".", ":");

  if (diffMin > 0 && diffMin <= 120) {
    return `${wibTime} WIB (${diffMin}m lagi)`;
  }
  if (diffMin < 0) {
    return `${wibTime} WIB (Sedang Berlangsung)`;
  }
  return `${wibTime} WIB`;
}

function parseQuickMabarText(text) {
  const t = text.trim();
  if (!t) return { type: "PANEL" };

  if (t.includes("|")) {
    const parts = t.split("|").map(x => x.trim()).filter(Boolean);
    return { type: "DIRECT", game: parts[0], time: parts[1], note: parts[2] || "" };
  }

  const timeOnly = ["sekarang", "now", "30m", "30 menit", "45 menit", "1 jam", "2 jam"];
  const clockMatch = t.match(/^(\d{1,2})[:.](\d{2})$/);
  if (clockMatch || timeOnly.some(x => t.toLowerCase() === x || t.toLowerCase().startsWith(x))) {
    return { type: "DIRECT", game: "Sons of The Forest", time: t, note: "" };
  }

  const lastSpace = t.lastIndexOf(" ");
  if (lastSpace !== -1) {
    const potentialTime = t.slice(lastSpace + 1).trim();
    const potentialGame = t.slice(0, lastSpace).trim();
    if (potentialTime.match(/^(\d{1,2})[:.](\d{2})$/) || ["sekarang", "now", "30m", "1h", "2h"].includes(potentialTime.toLowerCase())) {
      return { type: "DIRECT", game: potentialGame, time: potentialTime, note: "" };
    }
  }

  return { type: "DIRECT", game: t, time: "sekarang", note: "" };
}

function buildMabarEmbed(session) {
  const unix = Math.floor(session.targetTime.getTime() / 1000);

  const attendeesList = session.attendees.size > 0
    ? Array.from(session.attendees).map(id => `<@${id}>`).join(", ")
    : "_Belum ada yang konfirmasi_";

  const lateList = session.late.size > 0
    ? Array.from(session.late).map(id => `<@${id}>`).join(", ")
    : "_Tidak ada_";

  const declinedList = session.declined.size > 0
    ? Array.from(session.declined).map(id => `<@${id}>`).join(", ")
    : "_Tidak ada_";

  const isStarted = Date.now() >= session.targetTime.getTime();

  const embed = new EmbedBuilder()
    .setColor(isStarted ? 0x00E676 : 0xCBD5E1)
    .setTitle(`🎫 EXPEDITION PASS // ${session.game.toUpperCase()}`)
    .setDescription(
      `**HOST OPERATIVE:** <@${session.hostId}>\n` +
      (session.mentionRoleId ? `🔔 **TARGET NOTIFIKASI:** <@&${session.mentionRoleId}>\n` : "") +
      (session.note ? `📝 **CATATAN MISI:** *${session.note}*\n` : "") +
      `\n⏱️ **WAKTU BERANGKAT:** <t:${unix}:F> (<t:${unix}:R>)\n` +
      `*Klik tombol di bawah untuk mengisi slot squad & konfirmasi kehadiran!*`
    )
    .addFields(
      { name: `⚔️ Squad Siap (${session.attendees.size}/8)`, value: attendeesList, inline: false },
      { name: `⏳ Menyusul (${session.late.size})`, value: lateList, inline: true },
      { name: `❌ Skip / Berhalangan (${session.declined.size})`, value: declinedList, inline: true }
    )
    .setFooter({ text: "HOLLOWBORN • BORN FROM NOTHING. UNITED AS ONE." })
    .setTimestamp(session.targetTime);

  return embed;
}

function buildMabarButtons(session) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("mabar_join")
      .setLabel(`Hadir (${session.attendees.size}/8)`)
      .setEmoji("⚔️")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("mabar_late")
      .setLabel(`Menyusul (${session.late.size})`)
      .setEmoji("⏳")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("mabar_leave")
      .setLabel(`Skip (${session.declined.size})`)
      .setEmoji("❌")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("mabar_cancel")
      .setLabel("Batalkan")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
  );
}

async function buildMabarPayload(session, discordClient) {
  if (!session.rawTime && session.targetTime) {
    session.rawTime = formatMabarTimeDisplay(session.targetTime);
  }

  const embed = buildMabarEmbed(session);
  const buttons = buildMabarButtons(session);

  let attendeesUsers = [];
  if (discordClient && session.attendees && session.attendees.size > 0) {
    for (const uid of session.attendees) {
      const u = discordClient.users.cache.get(uid) || await discordClient.users.fetch(uid).catch(() => null);
      if (u) attendeesUsers.push(u);
    }
  }

  try {
    const ticketBuffer = await generateMabarTicketCanvas(session, attendeesUsers);
    const attachment = new AttachmentBuilder(ticketBuffer, { name: "mabar-ticket.png" });
    embed.setImage("attachment://mabar-ticket.png");
    return { embeds: [embed], components: [buttons], files: [attachment] };
  } catch (err) {
    console.error("Gagal generate mabar ticket canvas:", err.message);
    return { embeds: [embed], components: [buttons] };
  }
}

function startMabarReminderInterval(client) {
  return setInterval(async () => {
    const now = Date.now();
    let hasChanges = false;
    for (const [messageId, session] of mabarSessions.entries()) {
      const targetMs = session.targetTime.getTime();

      // Only send 10-minute reminder if target time is more than 2 minutes in future
      if (targetMs - now <= 10 * 60 * 1000 && targetMs - now > 2 * 60 * 1000 && !session.reminded10m) {
        session.reminded10m = true;
        hasChanges = true;
        try {
          const channel = await client.channels.fetch(session.channelId).catch(() => null);
          if (channel) {
            const pings = session.attendees.size > 0
              ? Array.from(session.attendees).map(id => `<@${id}>`).join(" ")
              : (session.mentionRoleId ? `<@&${session.mentionRoleId}>` : "");
            await channel.send({
              content: `🔔 **PENGINGAT MABAR (10 Menit Lagi)!**\nGame: **${session.game}**\nPemain siap: ${pings || "Semua survivor"}\nBersiaplah kumpul di Voice Channel!`
            });
          }
        } catch (err) {
          console.error("Gagal mengirim pengingat 10m mabar:", err.message);
        }
      }

      // Remind when start time arrives
      if (now >= targetMs && !session.remindedStart) {
        session.remindedStart = true;
        hasChanges = true;
        try {
          const channel = await client.channels.fetch(session.channelId).catch(() => null);
          if (channel) {
            const pings = session.attendees.size > 0
              ? Array.from(session.attendees).map(id => `<@${id}>`).join(" ")
              : (session.mentionRoleId ? `<@&${session.mentionRoleId}>` : "");
            await channel.send({
              content: `🚨 **WAKTU MABAR TELAH TIBA!**\nSesi game **${session.game}** dimulai sekarang!\n${pings}`
            });
          }
        } catch (err) {
          console.error("Gagal mengirim pengingat waktu mulai mabar:", err.message);
        }
      }

      if (now - targetMs > 8 * 3600 * 1000) {
        mabarSessions.delete(messageId);
        hasChanges = true;
      }
    }
    if (hasChanges) saveMabarSessions();
  }, 30000);
}

module.exports = {
  mabarSessions,
  saveMabarSessions,
  loadMabarSessions,
  buildQuickMabarGamePanel,
  buildQuickMabarTimePanel,
  parseMabarTime,
  formatMabarTimeDisplay,
  parseQuickMabarText,
  buildMabarEmbed,
  buildMabarButtons,
  buildMabarPayload,
  startMabarReminderInterval
};

