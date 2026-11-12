const { PermissionsBitField } = require("discord.js");
const { canManageRole } = require("../../utils/helpers");

module.exports = {
  name: "role-grant",
  description: "Memberikan role tertentu kepada salah satu anggota server",
  aliases: ["grantrole", "addrole"],
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

    const botMember = await guild.members.fetchMe();
    if (member.id !== guild.ownerId && member.roles.highest.position >= botMember.roles.highest.position) {
      return interaction.reply({
        content: "Role tertinggi member berada di atas atau setara dengan bot.",
        ephemeral: true
      });
    }

    if (member.id === guild.ownerId && role.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ Administrator role tidak diberikan kepada Server Owner demi melindungi Crown Discord.",
        ephemeral: true
      });
    }

    await member.roles.add(role);
    return interaction.reply({ content: `✅ **${role.name}** diberikan kepada ${member.user.tag}.` });
  },
  async executePrefix(message, args) {
    const isOwner = message.author.id === message.guild.ownerId;
    const hasPerm = message.member?.permissions.has(PermissionsBitField.Flags.ManageRoles);
    if (!isOwner && !hasPerm) {
      return message.reply("❌ Kamu membutuhkan permission **Manage Roles** untuk menggunakan perintah ini.");
    }

    const targetUser = message.mentions.users.first();
    const role = message.mentions.roles.first();
    if (!targetUser || !role) {
      return message.reply("💡 Format: `!role-grant @user @role`");
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) return message.reply("Member tidak ditemukan.");
    if (role.managed) return message.reply("Role integrasi tidak dapat diberikan.");

    if (member.id === message.guild.ownerId && role.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Administrator role tidak diberikan kepada Server Owner demi melindungi Crown Discord.");
    }

    await member.roles.add(role);
    return message.reply(`✅ **${role.name}** diberikan kepada ${member.user.tag}.`);
  }
};

