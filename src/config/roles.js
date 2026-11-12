// ID Role default yang otomatis diberikan saat member baru join
const AUTO_ROLE_ID = "1567389277468500008";

// ==========================================
// 🌲 HOLLOWBORN — 28 ROLE PRESETS
// ==========================================

const PRESET_ROLES = [
  // 👑 LEADERSHIP — 5 ROLES
  { name: "👑 𝐓𝐇𝐄 𝐅𝐎𝐔𝐍𝐃𝐄𝐑", color: "#FFD700", permissions: [] },
  { name: "⚔️ 𝐖𝐀𝐑𝐋𝐎𝐑𝐃", color: "#FF4500", permissions: ["ManageMessages"] },
  { name: "🩸 𝐁𝐋𝐎𝐎𝐃 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐄𝐑", color: "#FF1744", permissions: ["ManageMessages"] },
  { name: "🛡️ 𝐎𝐕𝐄𝐑𝐒𝐄𝐄𝐑", color: "#00E5FF", permissions: ["ManageMessages", "ManageChannels"] },
  { name: "🔨 𝐖𝐀𝐑𝐃𝐄𝐍", color: "#B388FF", permissions: ["ManageMessages"] },

  // 🪓 SURVIVAL DIVISION — 5 ROLES
  { name: "☠️ 𝐀𝐋𝐏𝐇𝐀 𝐒𝐔𝐑𝐕𝐈𝐕𝐎𝐑", color: "#FF5252", permissions: [] },
  { name: "🐺 𝐕𝐄𝐓𝐄𝐑𝐀𝐍", color: "#FF9100", permissions: [] },
  { name: "🌲 𝐒𝐔𝐑𝐕𝐈𝐕𝐎𝐑", color: "#69F0AE", permissions: [] },
  { name: "🪵 𝐑𝐄𝐂𝐑𝐔𝐈𝐓", color: "#40C4FF", permissions: [] },
  { name: "🌑 𝐖𝐀𝐍𝐃𝐄𝐑𝐄𝐑", color: "#B0BEC5", permissions: [] },

  // 🎯 SPECIALIZATION — 7 ROLES
  { name: "🎯 𝐇𝐔𝐍𝐓𝐄𝐑", color: "#C6FF00", permissions: [] },
  { name: "🪓 𝐋𝐔𝐌𝐁𝐄𝐑𝐉𝐀𝐂𝐊", color: "#FFAB40", permissions: [] },
  { name: "🏗️ 𝐀𝐑𝐂𝐇𝐈𝐓𝐄𝐂𝐓", color: "#40C4FF", permissions: [] },
  { name: "🔫 𝐌𝐀𝐑𝐊𝐒𝐌𝐀𝐍", color: "#FF5252", permissions: [] },
  { name: "🩺 𝐌𝐄𝐃𝐈𝐂", color: "#00E676", permissions: [] },
  { name: "🧭 𝐒𝐂𝐎𝐔𝐓", color: "#E040FB", permissions: [] },
  { name: "🎒 𝐐𝐔𝐀𝐑𝐓𝐄𝐑𝐌𝐀𝐒𝐓𝐄𝐑", color: "#FFD740", permissions: [] },

  // ☠️ SPECIAL ROLES — 6 ROLES
  { name: "☠️ 𝕿𝖍𝖊 𝕴𝖒𝖒𝖔𝖗𝖙𝖆𝖑", color: "#E040FB", permissions: [] },
  { name: "🩸 𝕭𝖑𝖔𝖔𝖉𝖇𝖔𝖚𝖓𝖉", color: "#FF1744", permissions: [] },
  { name: "👁️ 𝕿𝖍𝖊 𝖂𝖆𝖙𝖈𝖍𝖊𝖗", color: "#00E5FF", permissions: [] },
  { name: "🌑 𝕹𝖎𝖌𝖍𝖙 𝕾𝖙𝖆𝖑𝖐𝖊𝖗", color: "#7C4DFF", permissions: [] },
  { name: "🦴 𝕭𝖔𝖓𝖊 𝕮𝖔𝖑𝖑𝖊𝖈𝖙𝖔𝖗", color: "#EEEEEE", permissions: [] },
  { name: "🐺 𝕷𝖔𝖓𝖊 𝖂𝖔𝖑𝖋", color: "#90CAF9", permissions: [] },

  // 🔔 NOTIFICATION ROLES — 5 ROLES
  { name: "🎮 𝐆𝐀𝐌𝐄 𝐍𝐈𝐆𝐇𝐓", color: "#FFD700", permissions: [] },
  { name: "🪓 𝐒𝐎𝐍𝐒 𝐎𝐅 𝐓𝐇𝐄 𝐅𝐎𝐑𝐄𝐒𝐓", color: "#69F0AE", permissions: [] },
  { name: "🎥 𝐒𝐓𝐑𝐄𝐀𝐌𝐈𝐍𝐆", color: "#E040FB", permissions: [] },
  { name: "📢 𝐀𝐍𝐍𝐎𝐔𝐍𝐂𝐄𝐌𝐄𝐍𝐓", color: "#FF9100", permissions: [] },
  { name: "🗺️ 𝐄𝐗𝐏𝐄𝐃𝐈𝐓𝐈𝐎𝐍", color: "#40C4FF", permissions: [] }
];

module.exports = {
  AUTO_ROLE_ID,
  PRESET_ROLES
};

