const fs = require("fs");
const path = require("path");
const { Collection } = require("discord.js");

function loadCommands(client) {
  client.commands = new Collection();
  client.aliases = new Collection();

  const commandsDir = path.join(__dirname, "../commands");
  const categories = fs.readdirSync(commandsDir);

  for (const category of categories) {
    const categoryPath = path.join(commandsDir, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter(file => file.endsWith(".js"));
    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const command = require(filePath);

      if (command.name) {
        client.commands.set(command.name, command);
        if (command.aliases && Array.isArray(command.aliases)) {
          for (const alias of command.aliases) {
            client.aliases.set(alias, command.name);
          }
        }
      }
    }
  }

  console.log(`[CommandHandler] Berhasil memuat ${client.commands.size} perintah (dengan ${client.aliases.size} alias).`);
}

module.exports = {
  loadCommands
};

