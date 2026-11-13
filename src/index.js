require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");
const { loadCommands } = require("./handlers/commandHandler");
const { startDashboard } = require("./web/dashboard");

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// 1. Load All Commands (Modularized per Category)
loadCommands(client);

// 2. Register All Event Listeners
const eventsDir = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsDir).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(path.join(eventsDir, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}
console.log(`[EventManager] Berhasil mendaftarkan ${eventFiles.length} event listeners.`);

// 3. Start Web Dashboard & REST API
startDashboard(client);

// 4. Connect to Discord
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error("Gagal login ke Discord:", err.message);
  process.exit(1);
});
