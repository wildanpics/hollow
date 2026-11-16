const path = require("path");

const VERIFICATION_CONFIG = {
  WAITING_ROOM_ID: process.env.WAITING_ROOM_ID || "1571888536565710878",
  SURVIVOR_ROLE_ID: process.env.SURVIVOR_ROLE_ID || "1567389277468500008",
  EMPEROR_AUDIO_PATH: process.env.EMPEROR_AUDIO_PATH || path.join(__dirname, "../../assets/sound/emperor-welcome.mp3"),
  PLAYBACK_TIMEOUT_MS: parseInt(process.env.VERIFICATION_PLAYBACK_TIMEOUT_MS, 10) || 45000,
  SESSION_TIMEOUT_MS: parseInt(process.env.VERIFICATION_SESSION_TIMEOUT_MS, 10) || 90000,
  TEMP_CHANNEL_PREFIX: "identity-",
  CATEGORY_NAME: "VOICE VERIFICATION"
};

module.exports = VERIFICATION_CONFIG;
