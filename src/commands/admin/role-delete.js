const { PermissionsBitField } = require("discord.js");
const { canManageRole } = require("../../utils/helpers");

module.exports = {
  name: "role-delete",
  description: "Menghapus role tertentu secara permanen dari server Discord",
  aliases: ["deleterole", "hapusrole"],
  async executeSlash(interaction) {
    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const hasPerm = interaction.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return interaction.reply({
        content: "❌ Kamu membutuhkan permission **Manage Roles** untuk menggunakan perintah ini.",
        ephemeral: true
      });
    }

    const role = interaction.options.getRole("role", true);
    if (role.managed) {
      return interaction.reply({ content: "Role integrasi tidak dapat dihapus.", ephemeral: true });
    }
    if (role.name === "👑 𝐓𝐇𝐄 𝐅𝐎𝐔𝐍𝐃𝐄𝐑") {
      return interaction.reply({ content: "❌ Founder role dilindungi.", ephemeral: true });
    }
    if (!await canManageRole(interaction, role)) return;

    await role.delete(`Deleted by ${interaction.user.tag}`);
    return interaction.reply({ content: "🗑️ Role berhasil dihapus." });
  },
  async executePrefix(message) {
    const isOwner = message.author.id === message.guild.ownerId;
    const hasPerm = message.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return message.reply("❌ Kamu membutuhkan permission **Manage Roles** untuk menggunakan perintah ini.");
    }

    const role = message.mentions.roles.first();
    if (!role) {
      return message.reply("💡 Format: `!role-delete @role`");
    }
    if (role.managed) return message.reply("Role integrasi tidak dapat dihapus.");
    if (role.name === "👑 𝐓𝐇𝐄 𝐅𝐎𝐔𝐍𝐃𝐄𝐑") return message.reply("❌ Founder role dilindungi.");

    await role.delete(`Deleted by ${message.author.tag}`);
    return message.reply("🗑️ Role berhasil dihapus.");
  }
};

