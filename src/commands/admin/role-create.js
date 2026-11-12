const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { isHexColor, cleanHex, parsePermissions } = require("../../utils/helpers");

module.exports = {
  name: "role-create",
  description: "Membuat role baru dengan nama, warna HEX, dan permissions kustom",
  aliases: ["createrole", "newrole"],
  async executeSlash(interaction) {
    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const hasPerm = interaction.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return interaction.reply({
        content: "❌ Kamu membutuhkan permission **Manage Roles** untuk menggunakan perintah ini.",
        ephemeral: true
      });
    }

    const name = interaction.options.getString("name", true);
    const colorInput = interaction.options.getString("color", true);
    const permissionInput = interaction.options.getString("permissions") || "";

    if (!isHexColor(colorInput)) {
      return interaction.reply({
        content: "Gunakan warna HEX yang valid, contoh `#FF1744`.",
        ephemeral: true
      });
    }

    const permissions = parsePermissions(permissionInput);
    const role = await interaction.guild.roles.create({
      name,
      color: cleanHex(colorInput),
      permissions,
      reason: `Created by ${interaction.user.tag}`
    });

    const embed = new EmbedBuilder()
      .setColor(role.color || 0x808080)
      .setTitle("🌲 HOLLOWBORN ROLE CREATED")
      .addFields(
        { name: "Role", value: role.name, inline: true },
        { name: "Color", value: cleanHex(colorInput), inline: true },
        { name: "Permissions", value: permissionInput || "No special permissions" }
      )
      .setFooter({ text: "HOLLOWBORN • Role Generator" });

    return interaction.reply({ embeds: [embed] });
  },
  async executePrefix(message, args) {
    const isOwner = message.author.id === message.guild.ownerId;
    const hasPermission = message.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPermission) {
      return message.reply("❌ Membutuhkan permission **Manage Roles**.");
    }

    const rest = args.join(" ").trim();
    if (!rest || rest.toLowerCase() === "help") {
      return message.reply("💡 **Format Pemakaian:**\n`!role-create Nama Role | #FF1744 | ViewChannel,SendMessages`");
    }

    const parts = rest.split("|").map(x => x.trim()).filter(Boolean);
    if (parts.length < 2) {
      return message.reply("❌ Format salah. Gunakan:\n`!role-create Nama Role | #FF1744 | ViewChannel,SendMessages`");
    }

    const [name, colorInput, permInput] = parts;
    if (!isHexColor(colorInput)) {
      return message.reply("❌ Warna HEX tidak valid. Gunakan format contoh `#FF1744`.");
    }

    try {
      const permissions = parsePermissions(permInput || "");
      const role = await message.guild.roles.create({
        name,
        color: cleanHex(colorInput),
        permissions,
        reason: `Created by ${message.author.tag} via !role-create`
      });

      const embed = new EmbedBuilder()
        .setColor(role.color || 0x808080)
        .setTitle("🌲 HOLLOWBORN ROLE CREATED")
        .addFields(
          { name: "Role", value: role.name, inline: true },
          { name: "Color", value: cleanHex(colorInput), inline: true },
          { name: "Permissions", value: permInput || "No special permissions" }
        )
        .setFooter({ text: "HOLLOWBORN • Role Generator" });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      return message.reply(`❌ ${err.message}`);
    }
  }
};

