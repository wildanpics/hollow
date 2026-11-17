const {
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags
} = require("discord.js");
const {
  mabarSessions,
  saveMabarSessions,
  buildQuickMabarTimePanel,
  parseMabarTime,
  formatMabarTimeDisplay,
  buildMabarPayload,
  buildQuickMabarGamePanel
} = require("../utils/mabarManager");
const {
  buildProfileMessage
} = require("../utils/statsHelper");
const {
  buildCommandsListEmbed,
  buildGeneralHelpEmbed,
  buildHelpSelectMenu,
  buildCommandHelpEmbed
} = require("../commands/general/help");

async function handleComponent(interaction) {
  // 1. Select Menus
  if (interaction.isStringSelectMenu()) {
    // Protocol Chapter Selector (Dropdown)
    if (interaction.customId.startsWith("protocol_chapter_select_")) {
      const lang = interaction.customId.replace("protocol_chapter_select_", "");
      const selectedChapter = interaction.values[0];
      const { buildProtocolPanel } = require("../utils/protocolHelper");
      const payload = buildProtocolPanel(selectedChapter, lang);
      return interaction.update(payload);
    }

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
  }

  // 2. Buttons
  if (interaction.isButton()) {
    const cid = interaction.customId;

    // PROTOCOL — Navigation Buttons (Previous / Next)
    if (cid.startsWith("protocol_nav_")) {
      const parts = cid.split("_"); // ["protocol", "nav", chapterKey, lang]
      const targetChapter = parts[2];
      const lang = parts[3] || "id";
      if (targetChapter === "none") return interaction.deferUpdate();
      const { buildProtocolPanel } = require("../utils/protocolHelper");
      const payload = buildProtocolPanel(targetChapter, lang);
      return interaction.update(payload);
    }

    // PROTOCOL — Language Toggle Buttons (ID / EN)
    if (cid.startsWith("protocol_toggle_")) {
      const parts = cid.split("_"); // ["protocol", "toggle", lang, chapterKey]
      const lang = parts[2];
      const chapterKey = parts[3] || "overview";
      const { buildProtocolPanel } = require("../utils/protocolHelper");
      const payload = buildProtocolPanel(chapterKey, lang);
      return interaction.update(payload);
    }

    // VERIFICATION — Check Queue Button
    if (cid === "check_my_queue") {
      const { getQueue, getCurrentSession, getMemberPosition } = require("../storage/verificationQueue");
      const VERIFICATION_CONFIG = require("../config/verification");
      const guild = interaction.guild;
      const queue = getQueue(guild.id);
      const session = getCurrentSession(guild.id);
      const userPos = getMemberPosition(guild.id, interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle("🎙️ HOLLOWBORN — STATUS ANTREAN VERIFIKASI")
        .setColor("#00E5FF")
        .setTimestamp();

      if (userPos === 0) {
        embed.setDescription("🟢 **GILIRAN KAMU SEDANG BERJALAN!**\nKamu sedang berada di dalam channel verifikasi suara.");
      } else if (userPos > 0) {
        embed.setDescription(`🟡 **Nomor Urut Kamu:** \`#${userPos}\` dari ${queue.length} survivor di antrean.\nHarap tetap berada di <#${VERIFICATION_CONFIG.WAITING_ROOM_ID}> hingga bot memindahkanmu!`);
      } else {
        embed.setDescription(`ℹ️ Kamu belum berada di antrean. Klik tombol **Join Waiting Room** atau masuk ke <#${VERIFICATION_CONFIG.WAITING_ROOM_ID}> untuk memulai verifikasi suara.`);
      }

      if (session) {
        embed.addFields({
          name: "🔴 Sedang Diproses",
          value: `<@${session.userId}> [**${session.survivorTag}**]`,
          inline: true
        });
      }

      embed.addFields({
        name: "👥 Total Menunggu",
        value: `${queue.length} Survivor`,
        inline: true
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // PROFILE THEME BUTTONS
    if (cid.startsWith("prof_")) {
      const parts = cid.split("_");
      const theme = parts[1];
      const targetId = parts[2];
      const targetMember = interaction.guild.members.cache.get(targetId) || await interaction.guild.members.fetch(targetId).catch(() => null);
      if (!targetMember) return interaction.reply({ content: "Survivor tidak ditemukan.", ephemeral: true });

      await interaction.deferUpdate();
      const { embed, rows, files } = await buildProfileMessage(targetMember, theme);
      return interaction.editReply({ embeds: [embed], components: rows, files });
    }

    // QUICK MABAR — Game Pick Buttons
    if (cid.startsWith("qm_game_")) {
      const gameKey = cid.replace("qm_game_", "");
      const gameNames = {
        sotf: "Sons of The Forest",
        dayz: "DayZ",
        valheim: "Valheim"
      };
      const gameName = gameNames[gameKey] || gameKey.toUpperCase();
      const { embed, rows } = buildQuickMabarTimePanel(gameName);
      return interaction.update({ embeds: [embed], components: rows });
    }

    // QUICK MABAR — Custom Game Name Modal
    if (cid === "qm_custom_game_btn") {
      const modal = new ModalBuilder()
        .setCustomId("qm_modal_game")
        .setTitle("🎮 Game Apa yang Mau Dimainin?");

      const input = new TextInputBuilder()
        .setCustomId("input_custom_game")
        .setLabel("Nama Game")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Contoh: Lethal Company, Rust, Apex...")
        .setRequired(true)
        .setMaxLength(40);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    // QUICK MABAR — Time Preset Selection
    if (cid.startsWith("qm_time_")) {
      await interaction.deferUpdate().catch(() => {});

      const parts = cid.split("_");
      const gameName = decodeURIComponent(parts[2]);
      const presetTime = parts[3];

      if (presetTime === "custom") {
        const modal = new ModalBuilder()
          .setCustomId(`qm_modal_time_${encodeURIComponent(gameName)}`)
          .setTitle(`⏰ Jam Berapa Main ${gameName.slice(0, 20)}?`);

        const input = new TextInputBuilder()
          .setCustomId("input_custom_time")
          .setLabel("Waktu Mabar")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Contoh: 21:30, 2 jam lagi, atau besok pagi")
          .setRequired(true)
          .setMaxLength(30);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      const targetTime = parseMabarTime(presetTime) || new Date();
      const guild = interaction.guild;
      const mentionRole = guild.roles.cache.find(r =>
        r.name.includes(gameName) || r.name.includes("GAME NIGHT")
      );

      const hostName = interaction.member?.displayName || interaction.user.displayName || interaction.user.username;
      const diffMs = targetTime.getTime() - Date.now();
      const isImmediate = diffMs <= 2 * 60000;

      const session = {
        game: gameName,
        note: "Mabar santai HOLLOWBORN",
        targetTime,
        rawTime: formatMabarTimeDisplay(targetTime),
        hostId: interaction.user.id,
        hostTag: hostName,
        channelId: interaction.channelId,
        mentionRoleId: mentionRole ? mentionRole.id : null,
        attendees: new Set([interaction.user.id]),
        late: new Set(),
        declined: new Set(),
        isImmediate,
        reminded10m: isImmediate || diffMs < 10 * 60000,
        remindedStart: isImmediate
      };

      const payload = await buildMabarPayload(session, interaction.client);
      if (mentionRole) payload.content = `<@&${mentionRole.id}> Waktu mabar baru telah dijadwalkan!`;

      if (interaction.message?.flags?.has(MessageFlags.Ephemeral) || interaction.message?.ephemeral) {
        const sentMsg = await interaction.channel.send(payload);
        mabarSessions.set(sentMsg.id, session);
        saveMabarSessions();
        return interaction.editReply({
          content: `⚔️ **Jadwal Ekspedisi Mabar Berhasil Dipublish!**\nTiket misi telah dibuka untuk seluruh anggota di channel ini:\n${sentMsg.url}`,
          embeds: [],
          components: []
        });
      } else {
        await interaction.editReply(payload);
        mabarSessions.set(interaction.message.id, session);
        saveMabarSessions();
        return;
      }
    }

    // MABAR RSVP BUTTONS
    if (cid.startsWith("mabar_")) {
      const parts = cid.split("_");
      const action = parts[1];
      const sessionId = parts[2];
      const session = mabarSessions.get(sessionId);

      if (!session) {
        return interaction.reply({
          content: "❌ Sesi mabar ini sudah berakhir atau tidak ditemukan.",
          ephemeral: true
        });
      }

      const uid = interaction.user.id;
      session.attendees.delete(uid);
      session.late.delete(uid);
      session.declined.delete(uid);

      if (action === "join") {
        session.attendees.add(uid);
        await interaction.reply({ content: `✅ Kamu berhasil bergabung ke skuad **${session.game}**!`, ephemeral: true });
      } else if (action === "late") {
        session.late.add(uid);
        await interaction.reply({ content: `⏰ Kamu konfirmasi akan telat/menyusul di sesi **${session.game}**.`, ephemeral: true });
      } else if (action === "decline") {
        session.declined.add(uid);
        await interaction.reply({ content: `❌ Kamu berhalangan hadir di sesi **${session.game}**.`, ephemeral: true });
      }

      saveMabarSessions();
      const payload = await buildMabarPayload(session, interaction.client);
      return interaction.message.edit(payload).catch(() => {});
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
      await interaction.deferUpdate().catch(() => {});

      const gameName = decodeURIComponent(interaction.customId.replace("qm_modal_time_", ""));
      const customTimeInput = interaction.fields.getTextInputValue("input_custom_time");
      const targetTime = parseMabarTime(customTimeInput) || new Date();

      const guild = interaction.guild;
      const mentionRole = guild.roles.cache.find(r =>
        r.name.includes(gameName) || r.name.includes("GAME NIGHT")
      );

      const hostName = interaction.member?.displayName || interaction.user.displayName || interaction.user.username;
      const diffMs = targetTime.getTime() - Date.now();
      const isImmediate = diffMs <= 2 * 60000;

      const session = {
        game: gameName,
        note: "Mabar santai HOLLOWBORN",
        targetTime,
        rawTime: formatMabarTimeDisplay(targetTime),
        hostId: interaction.user.id,
        hostTag: hostName,
        channelId: interaction.channelId,
        mentionRoleId: mentionRole ? mentionRole.id : null,
        attendees: new Set([interaction.user.id]),
        late: new Set(),
        declined: new Set(),
        isImmediate,
        reminded10m: isImmediate || diffMs < 10 * 60000,
        remindedStart: isImmediate
      };

      const payload = await buildMabarPayload(session, interaction.client);
      if (mentionRole) payload.content = `<@&${mentionRole.id}> Waktu mabar baru telah dijadwalkan!`;

      if (interaction.message?.flags?.has(MessageFlags.Ephemeral) || interaction.message?.ephemeral) {
        const sentMsg = await interaction.channel.send(payload);
        mabarSessions.set(sentMsg.id, session);
        saveMabarSessions();
        return interaction.editReply({
          content: `⚔️ **Jadwal Ekspedisi Mabar Berhasil Dipublish!**\nTiket misi telah dibuka untuk seluruh anggota di channel ini:\n${sentMsg.url}`,
          embeds: [],
          components: []
        });
      } else {
        await interaction.editReply(payload);
        mabarSessions.set(interaction.message.id, session);
        saveMabarSessions();
        return;
      }
    }
  }
}

module.exports = {
  handleComponent
};
