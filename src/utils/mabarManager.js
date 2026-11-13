const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} = require("discord.js");
const { generateMabarTicketCanvas } = require("../canvas-renderers");

const mabarSessions = new Map();

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

function parseMabarTime(inputRaw) {
  if (!inputRaw || !inputRaw.trim()) return null;
  const input = inputRaw.trim().toLowerCase();
  const now = new Date();

  if (input === "sekarang" || input === "now") return now;

  const relHourMatch = input.match(/^(\d+(\.\d+)?)\s*(jam|h|hour|hours)/);
  if (relHourMatch) {
    return new Date(now.getTime() + parseFloat(relHourMatch[1]) * 3600000);
  }

  const relMinMatch = input.match(/^(\d+)\s*(menit|m|min|mins|minute|minutes)/);
  if (relMinMatch) {
    return new Date(now.getTime() + parseInt(relMinMatch[1], 10) * 60000);
  }

  const besokMatch = input.match(/besok\s+(\d{1,2})[:.](\d{2})/);
  if (besokMatch) {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    t.setHours(parseInt(besokMatch[1], 10), parseInt(besokMatch[2], 10), 0, 0);
    return t;
  }

  const clockMatch = input.match(/^(\d{1,2})[:.](\d{2})$/);
  if (clockMatch) {
    const h = parseInt(clockMatch[1], 10);
    const m = parseInt(clockMatch[2], 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    const t = new Date(now);
    t.setHours(h, m, 0, 0);
    if (t.getTime() <= now.getTime()) {
      t.setDate(t.getDate() + 1);
    }
    return t;
  }

  return null;
}

function formatMabarTimeDisplay(targetTime) {
  if (!targetTime) return "SEGERA";
  const diffMin = Math.round((targetTime.getTime() - Date.now()) / 60000);
  if (diffMin <= 2 && diffMin >= -2) return "SEGERA (NOW)";
  const hours = String(targetTime.getHours()).padStart(2, "0");
  const mins = String(targetTime.getMinutes()).padStart(2, "0");
  const clockStr = `${hours}:${mins} WIB`;
  if (diffMin > 0 && diffMin <= 120) {
    return `${clockStr} (${diffMin}m lagi)`;
  }
  return clockStr;
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
      .setStyle(ButtonStyle.Secondary)
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
    for (const [messageId, session] of mabarSessions.entries()) {
      const targetMs = session.targetTime.getTime();

      if (targetMs - now <= 10 * 60 * 1000 && targetMs > now && !session.reminded10m) {
        session.reminded10m = true;
        try {
          const channel = await client.channels.fetch(session.channelId);
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

      if (now >= targetMs && !session.remindedStart) {
        session.remindedStart = true;
        try {
          const channel = await client.channels.fetch(session.channelId);
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

      if (now - targetMs > 6 * 3600 * 1000) {
        mabarSessions.delete(messageId);
      }
    }
  }, 30000);
}

module.exports = {
  mabarSessions,
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

