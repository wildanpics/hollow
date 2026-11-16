const path = require("path");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  AttachmentBuilder
} = require("discord.js");
const { CHAPTERS_ID, CHAPTERS_EN } = require("../config/protocol-text");

const BANNER_PATH = path.join(__dirname, "../../assets/server-protocol-banner.jpg");

const CHAPTER_KEYS = ["overview", "bab1", "bab2", "bab3", "bab4"];

function getChapterData(chapterKey = "overview", lang = "id") {
  const dict = lang === "en" ? CHAPTERS_EN : CHAPTERS_ID;
  return dict[chapterKey] || dict.overview;
}

function buildProtocolPanel(chapterKey = "overview", lang = "id") {
  if (!CHAPTER_KEYS.includes(chapterKey)) {
    chapterKey = "overview";
  }

  const chapter = getChapterData(chapterKey, lang);
  const isEn = lang === "en";

  const fileName = `server-protocol-banner-${Date.now()}.jpg`;
  const attachment = new AttachmentBuilder(BANNER_PATH, { name: fileName });

  // 1. Embed Header & Chapter Content
  const embed = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setTitle(chapter.title)
    .setDescription(chapter.description)
    .setImage(`attachment://${fileName}`)
    .setFooter({
      text: isEn ? "HOLLOWBORN // SERVER PROTOCOL DIRECTIVES" : "HOLLOWBORN // PROTOKOL & ATURAN RESMI SERVER"
    });

  // 2. Dropdown Menu for Chapters
  const options = isEn ? [
    { label: "Server Protocol Overview", value: "overview", description: "Official protocol overview & index", emoji: "📜" },
    { label: "Chapter I: Community Principles", value: "bab1", description: "Loyalty, Respect, Unity, Confidentiality, Responsibility", emoji: "🛡️" },
    { label: "Chapter II: Server Regulations", value: "bab2", description: "Conduct, Channel Usage, Content Security, Voice, Identity", emoji: "⚔️" },
    { label: "Chapter III: Security & Digital Protocols", value: "bab3", description: "Account Defense, Data Privacy, Feature Usage, Escalation", emoji: "🔐" },
    { label: "Chapter IV & V: Sanctions & Final Decree", value: "bab4", description: "Disciplinary actions, appeals & HOLLOWBORN decree", emoji: "⚖️" }
  ] : [
    { label: "Ringkasan Protokol Server", value: "overview", description: "Ringkasan & daftar isi protokol resmi", emoji: "📜" },
    { label: "Bab I: Prinsip Komunitas", value: "bab1", description: "Loyalitas, Rasa Hormat, Persatuan, Kerahasiaan, Tanggung Jawab", emoji: "🛡️" },
    { label: "Bab II: Peraturan Server", value: "bab2", description: "Perilaku, Channel, Konten & Keamanan, Voice, Identitas", emoji: "⚔️" },
    { label: "Bab III: Keamanan & Etika Digital", value: "bab3", description: "Keamanan Akun, Perlindungan Data, Fitur Discord, Pelaporan", emoji: "🔐" },
    { label: "Bab IV & V: Sanksi & Pernyataan Akhir", value: "bab4", description: "Sanksi penindakan & Sumpah persatuan HOLLOWBORN", emoji: "⚖️" }
  ];

  // Mark active option
  options.forEach(opt => {
    opt.default = opt.value === chapterKey;
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`protocol_chapter_select_${lang}`)
    .setPlaceholder(isEn ? "📖 Select Chapter to View..." : "📖 Pilih Bab Protokol untuk Dibaca...")
    .addOptions(options);

  const menuRow = new ActionRowBuilder().addComponents(selectMenu);

  // 3. Navigation & Language Buttons
  const currIdx = CHAPTER_KEYS.indexOf(chapterKey);
  const prevKey = currIdx > 0 ? CHAPTER_KEYS[currIdx - 1] : null;
  const nextKey = currIdx < CHAPTER_KEYS.length - 1 ? CHAPTER_KEYS[currIdx + 1] : null;

  const btnRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`protocol_nav_${prevKey || "none"}_${lang}`)
      .setLabel(isEn ? "Previous Chapter" : "Bab Sebelumnya")
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!prevKey),

    new ButtonBuilder()
      .setCustomId(`protocol_nav_${nextKey || "none"}_${lang}`)
      .setLabel(isEn ? "Next Chapter" : "Bab Selanjutnya")
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!nextKey),

    new ButtonBuilder()
      .setCustomId(`protocol_toggle_id_${chapterKey}`)
      .setLabel("Bahasa Indonesia")
      .setEmoji("🇮🇩")
      .setStyle(!isEn ? ButtonStyle.Primary : ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`protocol_toggle_en_${chapterKey}`)
      .setLabel("English")
      .setEmoji("🇬🇧")
      .setStyle(isEn ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    components: [menuRow, btnRow],
    files: [attachment]
  };
}

module.exports = {
  CHAPTER_KEYS,
  buildProtocolPanel
};
