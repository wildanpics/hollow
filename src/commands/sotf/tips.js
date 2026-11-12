const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { SURVIVAL_TIPS } = require("../../config/sotf-tips");

function buildTipsEmbed(filterCatOrId) {
  let tip;
  if (typeof filterCatOrId === "number") {
    tip = SURVIVAL_TIPS.find(t => t.id === filterCatOrId);
  } else if (filterCatOrId && filterCatOrId !== "all") {
    const matching = SURVIVAL_TIPS.filter(t => t.category === filterCatOrId);
    tip = matching[Math.floor(Math.random() * matching.length)];
  }

  if (!tip) {
    tip = SURVIVAL_TIPS[Math.floor(Math.random() * SURVIVAL_TIPS.length)];
  }

  return new EmbedBuilder()
    .setColor(0x00E676)
    .setTitle(`💡 TIPS SURVIVAL: ${tip.title}`)
    .setDescription(tip.content)
    .addFields(
      { name: "📂 Kategori", value: tip.categoryName, inline: true },
      { name: "💡 Pro Tip Survivor", value: `*${tip.proTip}*`, inline: false }
    )
    .setFooter({ text: "Gunakan tombol di bawah untuk ganti kategori tips" });
}

function buildTipsButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("tips_random")
      .setLabel("Tips Acak")
      .setEmoji("🎲")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("tips_cat_kelvin_virginia")
      .setLabel("Kelvin & Virginia")
      .setEmoji("👥")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("tips_cat_base_building")
      .setLabel("Base Building")
      .setEmoji("🪓")
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("tips_cat_combat")
      .setLabel("Combat & Senjata")
      .setEmoji("⚔️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("tips_cat_survival")
      .setLabel("Survival & Musim")
      .setEmoji("❄️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("tips_cat_caves")
      .setLabel("Gua & Bunker")
      .setEmoji("🔦")
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

module.exports = {
  name: "tips",
  description: "Menampilkan tips dan trik bertahan hidup Sons of the Forest",
  aliases: ["tip", "sotf-tips"],
  buildTipsEmbed,
  buildTipsButtons,
  async executeSlash(interaction) {
    const cat = interaction.options.getString("kategori");
    const embed = buildTipsEmbed(cat);
    const buttons = buildTipsButtons();
    return interaction.reply({ embeds: [embed], components: buttons });
  },
  async executePrefix(message, args) {
    const cat = args[0]?.toLowerCase() || null;
    const embed = buildTipsEmbed(cat);
    const buttons = buildTipsButtons();
    return message.reply({ embeds: [embed], components: buttons });
  }
};

