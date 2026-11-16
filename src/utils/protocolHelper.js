const path = require("path");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  AttachmentBuilder
} = require("discord.js");
const { PROTOCOL_ID, PROTOCOL_EN } = require("../config/protocol-text");

const BANNER_PATH = path.join(__dirname, "../../assets/server-protocol-banner.jpg");

function splitProtocolSections(text) {
  const isEn = text.includes("SERVER REGULATIONS");
  const s2Tag = isEn ? "## II. SERVER REGULATIONS" : "## II. PERATURAN SERVER";
  const s3Tag = isEn ? "## III. SECURITY AND DIGITAL PROTOCOLS" : "## III. KEAMANAN DAN ETIKA DIGITAL";

  const idx2 = text.indexOf(s2Tag);
  const idx3 = text.indexOf(s3Tag);

  const part1 = text.slice(0, idx2).trim();
  const part2 = text.slice(idx2, idx3).trim();
  const part3 = text.slice(idx3).trim();

  return { part1, part2, part3 };
}

function buildProtocolComponents(currentLang = "id") {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("protocol_lang_select")
    .setPlaceholder("🌐 Pilih Bahasa / Select Language")
    .addOptions([
      {
        label: "Bahasa Indonesia",
        value: "id",
        description: "Tampilkan seluruh protokol dalam Bahasa Indonesia",
        emoji: "🇮🇩",
        default: currentLang === "id"
      },
      {
        label: "English",
        value: "en",
        description: "Display complete server protocol in English",
        emoji: "🇬🇧",
        default: currentLang === "en"
      }
    ]);

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("protocol_btn_id")
      .setLabel("Bahasa Indonesia")
      .setEmoji("🇮🇩")
      .setStyle(currentLang === "id" ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("protocol_btn_en")
      .setLabel("English")
      .setEmoji("🇬🇧")
      .setStyle(currentLang === "en" ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  const menuRow = new ActionRowBuilder().addComponents(selectMenu);

  return [menuRow, buttonRow];
}

function buildProtocolMessage1(lang = "id") {
  const text = lang === "en" ? PROTOCOL_EN : PROTOCOL_ID;
  const { part1, part2 } = splitProtocolSections(text);

  const fileName = `server-protocol-banner-${Date.now()}.jpg`;
  const attachment = new AttachmentBuilder(BANNER_PATH, { name: fileName });

  const embed1 = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setTitle(lang === "en" ? "HOLLOWBORN — SERVER PROTOCOL" : "HOLLOWBORN — PROTOKOL SERVER")
    .setDescription(part1)
    .setImage(`attachment://${fileName}`);

  const embed2 = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setDescription(part2);

  return {
    embeds: [embed1, embed2],
    files: [attachment]
  };
}

function buildProtocolMessage2(lang = "id") {
  const text = lang === "en" ? PROTOCOL_EN : PROTOCOL_ID;
  const { part3 } = splitProtocolSections(text);

  const embed = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setDescription(part3);

  const components = buildProtocolComponents(lang);

  return {
    embeds: [embed],
    components
  };
}

function buildProtocolEphemeral(lang = "en") {
  const text = lang === "en" ? PROTOCOL_EN : PROTOCOL_ID;
  const { part1, part2, part3 } = splitProtocolSections(text);

  const embed1 = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setTitle(lang === "en" ? "🛡️ HOLLOWBORN — SERVER PROTOCOL (ENGLISH)" : "🛡️ HOLLOWBORN — PROTOKOL SERVER (INDONESIA)")
    .setDescription(part1);

  const embed2 = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setDescription(part2);

  const embed3 = new EmbedBuilder()
    .setColor("#FFFFFF")
    .setDescription(part3);

  const components = buildProtocolComponents(lang);

  return {
    embeds: [embed1, embed2, embed3],
    components,
    ephemeral: true
  };
}

module.exports = {
  buildProtocolMessage1,
  buildProtocolMessage2,
  buildProtocolEphemeral,
  buildProtocolComponents
};
