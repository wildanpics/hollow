const {
  mabarSessions,
  buildQuickMabarGamePanel,
  parseMabarTime,
  parseQuickMabarText,
  buildMabarPayload
} = require("../../utils/mabarManager");

module.exports = {
  name: "mabar",
  description: "Buat jadwal mabar cepat dengan panel 2-klik, countdown live, dan tiket Canvas",
  aliases: ["mainbareng", "party"],
  async executeSlash(interaction) {
    const game = interaction.options.getString("game");
    const timeInput = interaction.options.getString("waktu");
    const note = interaction.options.getString("keterangan") || "";
    const mentionRole = interaction.options.getRole("mention");

    if (!game || !timeInput) {
      const { embed, row } = buildQuickMabarGamePanel();
      return interaction.reply({ embeds: [embed], components: [row] });
    }

    const targetTime = parseMabarTime(timeInput);
    if (!targetTime) {
      return interaction.reply({
        content: "❌ Format waktu tidak valid. Gunakan contoh:\n• Jam pasti: `20:00`, `21.30`, `besok 20:00`\n• Durasi: `2 jam`, `45 menit`, `sekarang`",
        ephemeral: true
      });
    }

    const session = {
      game,
      note,
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
    payload.fetchReply = true;

    const replyMsg = await interaction.reply(payload);
    mabarSessions.set(replyMsg.id, session);
    return;
  },
  async executePrefix(message, args) {
    const rest = args.join(" ").trim();
    const parsed = parseQuickMabarText(rest);

    if (parsed.type === "PANEL") {
      const { embed, row } = buildQuickMabarGamePanel();
      return message.reply({ embeds: [embed], components: [row] });
    }

    const targetTime = parseMabarTime(parsed.time) || new Date();
    const mentionRole = message.guild.roles.cache.find(r =>
      r.name.includes(parsed.game) || r.name.includes("GAME NIGHT")
    );

    const session = {
      game: parsed.game,
      note: parsed.note || "Mabar santai HOLLOWBORN",
      targetTime,
      hostId: message.author.id,
      channelId: message.channel.id,
      mentionRoleId: mentionRole ? mentionRole.id : null,
      attendees: new Set([message.author.id]),
      late: new Set(),
      declined: new Set(),
      reminded10m: false,
      remindedStart: false
    };

    const payload = await buildMabarPayload(session, message.client);
    if (mentionRole) payload.content = `<@&${mentionRole.id}> Waktu mabar baru telah dijadwalkan!`;

    const sent = await message.channel.send(payload);
    mabarSessions.set(sent.id, session);
    return;
  }
};

