const path = require("path");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
} = require("discord.js");
const VERIFICATION_CONFIG = require("../config/verification");

function buildVerificationTutorialPayload(guildId) {
  const attachment = new AttachmentBuilder(VERIFICATION_CONFIG.BANNER_PATH, {
    name: "voice-verification-banner.jpg"
  });

  const waitingRoomId = VERIFICATION_CONFIG.WAITING_ROOM_ID;

  const embed = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setTitle("HOLLOWBORN — VOICE VERIFICATION")
    .setDescription(
      `The signal has reached you. But reaching HOLLOWBORN does not mean you have been accepted.\n\n` +
      `The Emperor must acknowledge your presence before you can enter the Order.\n\n` +
      `Proceed to the designated transmission channel. Wait for your call, listen carefully, and let your identity be recognized.\n\n` +
      `Not everyone reaches this transmission.\n\n` +
      `──────────────────────────────────────────────\n` +
      `### 🇬🇧 HOW TO VERIFY (ENGLISH)\n` +
      `**Step 1:** Click the **Join Waiting Room** button below or enter the <#${waitingRoomId}> voice channel.\n` +
      `**Step 2:** You will automatically be placed into the verification queue. The bot processes operatives one by one in FIFO order.\n` +
      `**Step 3:** When your turn arrives, the bot will create a private temporary chamber (\`🔒 identity-hb-xxxx\`) and automatically move you inside.\n` +
      `**Step 4:** Listen to **THE EMPEROR'S TRANSMISSION** (~15 seconds). **Do NOT disconnect or switch channels** during the broadcast.\n` +
      `**Step 5:** Once the transmission finishes and your identity is confirmed, you will automatically receive the **SURVIVOR** role and gain full operational access to the server.\n\n` +
      `──────────────────────────────────────────────\n` +
      `### 🇮🇩 CARA VERIFIKASI (BAHASA INDONESIA)\n` +
      `**Langkah 1:** Klik tombol **Masuk Waiting Room** di bawah atau masuk langsung ke voice channel <#${waitingRoomId}>.\n` +
      `**Langkah 2:** Kamu akan otomatis terdaftar ke dalam antrean verifikasi (FIFO). Bot akan memproses member satu per satu secara berurutan.\n` +
      `**Langkah 3:** Saat giliranmu tiba, bot akan membuat ruang khusus (\`🔒 identity-hb-xxxx\`) dan memindahkanmu ke dalamnya secara otomatis.\n` +
      `**Langkah 4:** Dengarkan **Transmisi Sambutan Emperor** (durasi ~15 detik). **Jangan keluar atau berpindah channel** selama siaran berlangsung.\n` +
      `**Langkah 5:** Setelah transmisi selesai dan identitasmu terkonfirmasi, kamu akan langsung menerima role **SURVIVOR** dan mendapatkan akses penuh ke seluruh server HOLLOWBORN.\n\n` +
      `──────────────────────────────────────────────`
    )
    .setImage("attachment://voice-verification-banner.jpg");

  const waitingRoomUrl = `https://discord.com/channels/${guildId}/${waitingRoomId}`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("🔊 Join Waiting Room / Masuk Waiting Room")
      .setStyle(ButtonStyle.Link)
      .setURL(waitingRoomUrl),
    new ButtonBuilder()
      .setCustomId("check_my_queue")
      .setLabel("📋 Cek Posisi Antrean (Check Queue)")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    components: [row],
    files: [attachment]
  };
}

module.exports = {
  buildVerificationTutorialPayload
};
