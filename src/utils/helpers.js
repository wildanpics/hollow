const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { PRESET_ROLES } = require("../config/roles");

function parsePermissions(input = "") {
  if (!input.trim()) return [];
  const flags = PermissionsBitField.Flags;
  const requested = input.split(",").map(x => x.trim()).filter(Boolean);
  const invalid = requested.filter(name => !(name in flags));
  if (invalid.length) {
    throw new Error(`Permission tidak dikenal: ${invalid.join(", ")}`);
  }
  return requested.map(name => flags[name]);
}

function isHexColor(value) {
  return /^#?([0-9a-fA-F]{6})$/.test(value);
}

function cleanHex(value) {
  return value.startsWith("#") ? value : `#${value}`;
}

async function canManageRole(interaction, role) {
  const botMember = await interaction.guild.members.fetchMe();
  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    if (interaction.reply) {
      await interaction.reply({
        content: "Bot membutuhkan permission Manage Roles.",
        ephemeral: true
      });
    }
    return false;
  }
  if (role.position >= botMember.roles.highest.position) {
    if (interaction.reply) {
      await interaction.reply({
        content: "Posisi role bot harus lebih tinggi dari role target. Atur di Server Settings → Roles.",
        ephemeral: true
      });
    }
    return false;
  }
  return true;
}

async function generatePresetRoles(guild) {
  const botMember = await guild.members.fetchMe();
  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    throw new Error("Bot membutuhkan permission Manage Roles.");
  }

  const created = [];
  const skipped = [];
  const failed = [];

  for (const preset of PRESET_ROLES) {
    try {
      const existing = guild.roles.cache.find(role => role.name === preset.name);
      if (existing) {
        skipped.push(preset.name);
        continue;
      }
      const role = await guild.roles.create({
        name: preset.name,
        color: preset.color,
        permissions: preset.permissions.map(p => PermissionsBitField.Flags[p]),
        reason: "HOLLOWBORN complete role generation"
      });
      created.push(role.name);
    } catch (error) {
      console.error(`Gagal membuat role ${preset.name}:`, error.message);
      failed.push(preset.name);
    }
  }

  await guild.roles.fetch();

  const founderRole = guild.roles.cache.find(role => role.name === "👑 𝐓𝐇𝐄 𝐅𝐎𝐔𝐍𝐃𝐄𝐑");
  let founderAssigned = false;
  if (founderRole) {
    try {
      const owner = await guild.members.fetch(guild.ownerId);
      if (!owner.roles.cache.has(founderRole.id)) {
        await owner.roles.add(founderRole, "HOLLOWBORN Founder assignment");
      }
      founderAssigned = true;
    } catch (error) {
      console.error("Penetapan role Founder gagal:", error.message);
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0xFF1744)
    .setTitle("🌲 HOLLOWBORN — ROLE GENERATOR")
    .setDescription("Seluruh role preset HOLLOWBORN telah selesai diproses.")
    .addFields(
      { name: "✅ Berhasil Dibuat", value: `**${created.length}** role`, inline: true },
      { name: "⏭️ Sudah Ada", value: `**${skipped.length}** role`, inline: true },
      { name: "❌ Gagal", value: `**${failed.length}** role`, inline: true },
      {
        name: "👑 The Founder",
        value: founderAssigned ? "Diberikan ke Server Owner" : "Gagal menetapkan",
        inline: false
      }
    )
    .setFooter({ text: "HOLLOWBORN • Born in the Dark. Forged by Survival." })
    .setTimestamp();

  return embed;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}h ${h}j ${m}m ${s}d`;
}

module.exports = {
  parsePermissions,
  isHexColor,
  cleanHex,
  canManageRole,
  generatePresetRoles,
  formatUptime
};

