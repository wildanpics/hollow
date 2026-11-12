const fs = require("fs");
const path = require("path");

const WELCOME_CONFIG_FILE = path.join(__dirname, "../../data/welcome-config.json");
const DEFAULT_GREET_CHANNEL_ID = "1566751264258400269";

function loadWelcomeConfig() {
  try {
    if (fs.existsSync(WELCOME_CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(WELCOME_CONFIG_FILE, "utf-8"));
      return {
        channelId: parsed.channelId || null,
        greetChannelId: parsed.greetChannelId || DEFAULT_GREET_CHANNEL_ID,
        enabled: parsed.enabled !== false,
        greetEnabled: parsed.greetEnabled !== false,
        lastUpdated: parsed.lastUpdated || null
      };
    }
  } catch (err) {
    console.error("Gagal membaca welcome-config.json:", err.message);
  }
  return {
    channelId: null,
    greetChannelId: DEFAULT_GREET_CHANNEL_ID,
    enabled: true,
    greetEnabled: true,
    lastUpdated: null
  };
}

function saveWelcomeConfig(data) {
  try {
    const dir = path.dirname(WELCOME_CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    data.lastUpdated = Date.now();
    fs.writeFileSync(WELCOME_CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan welcome-config.json:", err.message);
  }
}

module.exports = {
  WELCOME_CONFIG_FILE,
  loadWelcomeConfig,
  saveWelcomeConfig
};

