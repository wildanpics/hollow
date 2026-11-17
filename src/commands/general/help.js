const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require("discord.js");
const { COMMANDS_REGISTRY } = require("../../config/commands-registry");

function buildCommandsListEmbed() {
  const embed = new EmbedBuilder()
    .setColor(0xFF1744)
    .setTitle("📋 DAFTAR LENGKAP COMMAND HOLLOWBORN")
    .setDescription(
      `Saat ini terdapat total **${COMMANDS_REGISTRY.length} perintah** aktif pada bot.\n` +
      "Setiap ada fitur baru yang ditambahkan ke bot, daftar ini akan **otomatis diperbarui**.\n" +
      "Bisa dijalankan lewat slash command (`/`) atau prefix (`!`).\n"
    )
    .setFooter({ text: "Ketik !help <nama_command> untuk detail panduan pemakaian" })
    .setTimestamp();

  const categories = {};
  for (const cmd of COMMANDS_REGISTRY) {
    if (!categories[cmd.category]) {
      categories[cmd.category] = [];
    }
    categories[cmd.category].push(cmd);
  }

  for (const [catName, cmds] of Object.entries(categories)) {
    const lines = cmds.map(c => `• **\`${c.name}\`** — ${c.description}\n  *Cara:* \`${c.usage[0]}\` | *Izin:* \`${c.permission}\``);
    embed.addFields({
      name: catName,
      value: lines.join("\n\n"),
      inline: false
    });
  }

  return embed;
}

function buildGeneralHelpEmbed() {
  return new EmbedBuilder()
    .setColor(0xFF1744)
    .setTitle("🌲 BUKU PANDUAN COMMAND HOLLOWBORN")
    .setDescription(
      "Selamat datang di panduan sistem bot **HOLLOWBORN**.\n" +
      "Bot ini mendukung **Slash Commands** (`/`) dan **Prefix Commands** (`!`).\n\n" +
      "Gunakan menu pilihan di bawah untuk membuka panduan detail & contoh pemakaian tiap fitur."
    )
    .addFields(
      {
        name: "🛡️ Emperor Voice Verification",
        value: "`!queue` • `!vstatus` • `!vsetup` — Sistem antrean verifikasi suara otomatis dengan siaran radio Kaisar.",
        inline: false
      },
      {
        name: "📜 Protokol & Aturan Server",
        value: "`!psetup` atau `/protocol-setup` — Panel interaktif aturan server dua bahasa (ID/EN) per-bab.",
        inline: false
      },
      {
        name: "🎮 Jadwal Mabar Cepat & Anti-Misskom",
        value: "`!mabar` — Tombol 2-klik, live countdown, mention role game, dan tombol RSVP kehadiran.",
        inline: false
      },
      {
        name: "📋 Daftar Lengkap Command Otomatis",
        value: "`!commands` atau `/commands` — Menampilkan seluruh perintah aktif bot.",
        inline: false
      },
      {
        name: "🌲 Preset Role Resmi (28 Role)",
        value: "`!role-preset` — Generate 28 role preset HOLLOWBORN sekaligus.",
        inline: false
      },
      {
        name: "🛠️ Pengelolaan Role",
        value: "`role-create` • `role-list` • `role-grant` • `role-revoke` • `role-delete`",
        inline: false
      }
    )
    .setFooter({ text: "Gunakan menu dropdown di bawah atau ketik !help <command>" })
    .setTimestamp();
}

function buildHelpSelectMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("help_category_select")
    .setPlaceholder("🔍 Pilih command untuk membuka panduan detail...");

  menu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setValue("help_general")
      .setLabel("📌 Ringkasan Panduan")
      .setDescription("Kembali ke ringkasan menu utama")
      .setEmoji("📖"),
    new StringSelectMenuOptionBuilder()
      .setValue("help_all_commands")
      .setLabel("📋 Daftar Semua Command (Otomatis)")
      .setDescription("Daftar lengkap seluruh command yang tersedia")
      .setEmoji("📋")
  );

  for (const cmd of COMMANDS_REGISTRY) {
    if (cmd.name === "help" || cmd.name === "commands") continue;
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setValue(`help_${cmd.name}`)
        .setLabel(cmd.title.slice(0, 95))
        .setDescription(cmd.description.slice(0, 95))
    );
  }

  return new ActionRowBuilder().addComponents(menu);
}

function buildCommandHelpEmbed(commandKey) {
  const cleanKey = commandKey.toLowerCase().replace(/^[!/]/, "");
  const guide = COMMANDS_REGISTRY.find(c => c.name === cleanKey);
  if (!guide) return buildGeneralHelpEmbed();

  const embed = new EmbedBuilder()
    .setColor(0xFF1744)
    .setTitle(guide.title)
    .setDescription(guide.description)
    .addFields(
      { name: "📂 Kategori", value: guide.category, inline: true },
      { name: "🔒 Izin Diperlukan", value: guide.permission, inline: true },
      {
        name: "⌨️ Format Penggunaan",
        value: guide.usage.map(u => `\`${u}\``).join("\n"),
        inline: false
      },
      {
        name: "💡 Contoh Pemakaian",
        value: guide.examples.map(e => `\`\`\`text\n${e}\n\`\`\``).join(""),
        inline: false
      }
    );

  if (guide.notes && guide.notes.length > 0) {
    embed.addFields({
      name: "📌 Catatan Penting",
      value: guide.notes.map(n => `• ${n}`).join("\n"),
      inline: false
    });
  }

  embed.setFooter({ text: "HOLLOWBORN Panduan Sistem" }).setTimestamp();
  return embed;
}

module.exports = {
  name: "help",
  description: "Buku panduan lengkap seluruh command dan fitur bot HOLLOWBORN",
  aliases: ["panduan", "bantuan"],
  buildCommandsListEmbed,
  buildGeneralHelpEmbed,
  buildHelpSelectMenu,
  buildCommandHelpEmbed,
  async executeSlash(interaction) {
    const specific = interaction.options.getString("command");
    if (specific) {
      const cleanKey = specific.toLowerCase().replace(/^[!/]/, "");
      const embed = buildCommandHelpEmbed(cleanKey);
      const menuRow = buildHelpSelectMenu();
      return interaction.reply({ embeds: [embed], components: [menuRow], ephemeral: true });
    }
    const embed = buildGeneralHelpEmbed();
    const menuRow = buildHelpSelectMenu();
    return interaction.reply({ embeds: [embed], components: [menuRow], ephemeral: true });
  },
  async executePrefix(message, args) {
    const specificCmd = args[0]?.toLowerCase().replace(/^[!/]/, "");
    if (specificCmd) {
      const embed = buildCommandHelpEmbed(specificCmd);
      const menuRow = buildHelpSelectMenu();
      return message.reply({ embeds: [embed], components: [menuRow] });
    }

    const embed = buildGeneralHelpEmbed();
    const menuRow = buildHelpSelectMenu();
    return message.reply({ embeds: [embed], components: [menuRow] });
  }
};

