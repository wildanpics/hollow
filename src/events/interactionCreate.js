const { Events } = require("discord.js");
const { handleComponent } = require("../handlers/componentHandler");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      // 1. Menu Dropdowns, Buttons, and Modal Submissions
      if (
        interaction.isStringSelectMenu() ||
        interaction.isButton() ||
        interaction.isModalSubmit()
      ) {
        return await handleComponent(interaction);
      }

      // 2. Chat Input (Slash Commands)
      if (interaction.isChatInputCommand()) {
        if (!interaction.inGuild()) {
          return interaction.reply({
            content: "Command hanya dapat digunakan di server.",
            ephemeral: true
          });
        }

        const command = client.commands.get(interaction.commandName);
        if (!command) {
          console.warn(`[Interaction] Perintah /${interaction.commandName} tidak ditemukan di client.commands.`);
          return interaction.reply({
            content: `Perintah \`/${interaction.commandName}\` belum terdaftar.`,
            ephemeral: true
          });
        }

        await command.executeSlash(interaction);
      }
    } catch (error) {
      console.error(`[Interaction Error - ${interaction.commandName || interaction.customId}]:`, error);
      const errMsg = error.message || "Terjadi kesalahan sistem.";
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({ content: `❌ ${errMsg}`, ephemeral: true }).catch(() => {});
      }
      return interaction.reply({ content: `❌ ${errMsg}`, ephemeral: true }).catch(() => {});
    }
  }
};

