const fs = require("fs");
const path = require("path");

const LOADOUTS_FILE = path.join(__dirname, "../../data/user-loadouts.json");

function loadUserLoadouts() {
  try {
    if (fs.existsSync(LOADOUTS_FILE)) {
      return JSON.parse(fs.readFileSync(LOADOUTS_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Gagal membaca user-loadouts.json:", err.message);
  }
  return {};
}

function saveUserLoadouts(data) {
  try {
    const dir = path.dirname(LOADOUTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOADOUTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan user-loadouts.json:", err.message);
  }
}

module.exports = {
  LOADOUTS_FILE,
  loadUserLoadouts,
  saveUserLoadouts
};

