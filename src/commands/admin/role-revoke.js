const { PermissionsBitField } = require("discord.js");
const { canManageRole } = require("../../utils/helpers");

module.exports = {
  name: "role-revoke",
  description: "Mencabut role tertentu dari salah satu anggota server",
  aliases: ["revokerole", "removerole"],
  async executeSlash(interaction) {
    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const hasPerm = interaction.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return interaction.reply({
        content: "❌ Kamu membutuhkan permission **Manage Roles** untuk menggunakan perintah ini.",
        ephemeral: true
      });
    }

    const guild = interaction.guild;
    const user = interaction.options.getUser("member", true);
    let member = interaction.options.getMember("member");
    if (!member) {
      member = await guild.members.fetch(user.id).catch(() => null);
    }
    const role = interaction.options.getRole("role", true);

    if (!member) {
      return interaction.reply({ content: "Member tidak ditemukan.", ephemeral: true });
    }

    if (role.managed) {
      return interaction.reply({ content: "Role integrasi/bot tidak dapat dikelola.", ephemeral: true });
    }

    if (!await canManageRole(interaction, role)) return;

    if (member.id === guild.ownerId && role.name === "👑 𝐓𝐇𝐄 𝐅𝐎𝐔𝐍𝐃𝐄𝐑") {
      return interaction.reply({
        content: "❌ Founder role tidak dapat dicabut dari Server Owner.",
        ephemeral: true
      });
    }

    await member.roles.remove(role);
    return interaction.reply({ content: `✅ **${role.name}** dicabut dari ${member.user.tag}.` });
  },
  async executePrefix(message) {
    const isOwner = message.author.id === message.guild.ownerId;
    const hasPerm = message.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return message.reply("❌ Kamu membutuhkan permission **Manage Roles** untuk menggunakan perintah ini.");
    }

    const targetUser = message.mentions.users.first();
    const role = message.mentions.roles.first();
    if (!targetUser || !role) {
      return message.reply("💡 Format: `!role-revoke @user @role`");
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) return message.reply("Member tidak ditemukan.");
    if (member.id === message.guild.ownerId && role.name === "👑 𝐓𝐇𝐄 𝐅𝐎𝐔𝐍𝐃𝐄𝐑") {
      return message.reply("❌ Founder role tidak dapat dicabut dari Server Owner.");
    }

    await member.roles.remove(role);
    return message.reply(`✅ **${role.name}** dicabut dari ${member.user.tag}.`);
  }
};

