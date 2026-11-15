const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

// Register bundled fonts so text renders reliably on any OS (Linux, Docker, Windows)
const fontBoldPath = path.resolve(__dirname, "../assets/fonts/segoeuib.ttf");
const fontRegPath = path.resolve(__dirname, "../assets/fonts/segoeui.ttf");
const altFontBoldPath = path.resolve(__dirname, "assets/fonts/segoeuib.ttf");
const altFontRegPath = path.resolve(__dirname, "assets/fonts/segoeui.ttf");

if (fs.existsSync(fontBoldPath)) {
  GlobalFonts.registerFromPath(fontBoldPath, "HollowBold");
} else if (fs.existsSync(altFontBoldPath)) {
  GlobalFonts.registerFromPath(altFontBoldPath, "HollowBold");
}

if (fs.existsSync(fontRegPath)) {
  GlobalFonts.registerFromPath(fontRegPath, "HollowRegular");
} else if (fs.existsSync(altFontRegPath)) {
  GlobalFonts.registerFromPath(altFontRegPath, "HollowRegular");
}

// ==========================================
// 🎨 SHARED CANVAS UTILITIES & HELPERS
// ==========================================

let cachedSotfMapImage = null;
let cachedWelcomeBgImage = null;
let cachedWelcomeFrameImage = null;

async function loadCachedAsset(cacheRef, relPath, label) {
  if (cacheRef) return cacheRef;
  const fullPath = path.resolve(__dirname, relPath);
  if (fs.existsSync(fullPath)) {
    try {
      const buf = fs.readFileSync(fullPath);
      return await loadImage(buf);
    } catch (e) {
      console.error(`Gagal load ${label}:`, e.message);
    }
  }
  return null;
}

async function getSotfMapImage() {
  cachedSotfMapImage = await loadCachedAsset(cachedSotfMapImage, "../assets/sotf-map.webp", "sotf-map.webp");
  return cachedSotfMapImage;
}

async function getWelcomeBgImage() {
  cachedWelcomeBgImage = await loadCachedAsset(cachedWelcomeBgImage, "../assets/welcome-bg.jpg", "welcome-bg.jpg");
  return cachedWelcomeBgImage;
}

async function getWelcomeFrameImage() {
  cachedWelcomeFrameImage = await loadCachedAsset(cachedWelcomeFrameImage, "../assets/welcome-avatar-frame.png", "welcome-avatar-frame.png");
  return cachedWelcomeFrameImage;
}

const SMALL_CAPS_MAP = {
  'ᴀ': 'A', 'ᴁ': 'AE', 'ᴂ': 'AE', 'ᴃ': 'B', 'ʙ': 'B', 'ᴄ': 'C', 'ᴅ': 'D', 'ᴆ': 'D', 'ᴇ': 'E',
  'ᴈ': 'E', 'ᴉ': 'I', 'ᴊ': 'J', 'ᴋ': 'K', 'ᴌ': 'L', 'ʟ': 'L', 'ᴍ': 'M', 'ɴ': 'N', 'ᴎ': 'N',
  'ᴏ': 'O', 'ᴐ': 'O', 'ᴑ': 'O', 'ᴒ': 'O', 'ᴓ': 'O', 'ᴔ': 'OE', 'ᴘ': 'P', 'ᴙ': 'R', 'ᴚ': 'R',
  'ᴛ': 'T', 'ᴜ': 'U', 'ᴝ': 'U', 'ᴞ': 'U', 'ᴟ': 'M', 'ᴠ': 'V', 'ᴡ': 'W', 'ᴢ': 'Z', 'ᴣ': 'Z',
  'ᴦ': 'G', 'ᴤ': 'L', 'ᴪ': 'PSI', 'ǫ': 'Q', 'ʀ': 'R', 'ꜱ': 'S', 'ɢ': 'G', 'ʜ': 'H', 'ɪ': 'I',
  'ʏ': 'Y', 'ғ': 'F', 'Ɪ': 'I'
};

function sanitizeCanvasText(str, fallback = "") {
  if (!str) return fallback;
  // 1. Convert small caps and phonetic unicode variants to standard ASCII
  let s = str.replace(/[\u0250-\u02AF\u1D00-\u1D7F\uA720-\uA7FF]/gu, ch => SMALL_CAPS_MAP[ch] || ch);
  // 2. Normalize fancy unicode alphabets (Mathematical Bold, Gothic, Fullwidth, etc.) to standard ASCII
  s = s.normalize("NFKC");
  // 3. Strip emojis, flags, pictographs, symbols that cause tofu box in Skia
  s = s.replace(/[\p{Extended_Pictographic}\uFE0F\u200D\u2600-\u27BF]/gu, "");
  // 4. Keep only printable ASCII and Latin-1 characters (guarantees no tofu boxes on Windows Segoe UI)
  s = s.replace(/[^\x20-\x7E\u00A0-\u00FF]/gu, "");
  // 5. Keep clean characters and collapse duplicate spaces
  s = s.replace(/\s+/g, " ").trim();
  // 6. If nothing left after sanitizing, return fallback
  return s || fallback;
}

async function fetchImageBuffer(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function safeLoadAvatar(url) {
  const buf = await fetchImageBuffer(url);
  if (!buf) return null;
  try {
    return await loadImage(buf);
  } catch {
    return null;
  }
}

function drawTechGrid(ctx, width, height, step = 40, strokeStyle = "rgba(0, 229, 255, 0.04)") {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawHudFrame(ctx, x, y, w, h, color = "#00E5FF", cornerLen = 14) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // 4 Tactical Corner Brackets
  ctx.fillStyle = color;
  // Top-Left
  ctx.fillRect(x, y, cornerLen, 3);
  ctx.fillRect(x, y, 3, cornerLen);
  // Top-Right
  ctx.fillRect(x + w - cornerLen, y, cornerLen, 3);
  ctx.fillRect(x + w - 3, y, 3, cornerLen);
  // Bottom-Left
  ctx.fillRect(x, y + h - 3, cornerLen, 3);
  ctx.fillRect(x, y + h - cornerLen, 3, cornerLen);
  // Bottom-Right
  ctx.fillRect(x + w - cornerLen, y + h - 3, cornerLen, 3);
  ctx.fillRect(x + w - 3, y + h - cornerLen, 3, cornerLen);
}

function drawBarcode(ctx, x, y, width, height, color = "rgba(255, 255, 255, 0.35)") {
  ctx.fillStyle = color;
  const pattern = [2, 1, 3, 1, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1];
  let curX = x;
  let idx = 0;
  while (curX < x + width) {
    const barW = pattern[idx % pattern.length];
    if (idx % 2 === 0) {
      ctx.fillRect(curX, y, barW, height);
    }
    curX += barW + 1;
    idx++;
  }
}

function drawFallbackAvatar(ctx, cx, cy, radius, primaryColor = "#00E5FF") {
  ctx.save();
  ctx.fillStyle = "#101622";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Tactical reticle crosshair inside
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.8, cy);
  ctx.lineTo(cx + radius * 0.8, cy);
  ctx.moveTo(cx, cy - radius * 0.8);
  ctx.lineTo(cx, cy + radius * 0.8);
  ctx.stroke();

  // Head/Shoulder silhouette
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(cx, cy - radius * 0.15, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + radius * 0.55, radius * 0.45, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

function drawCircularAvatar(ctx, img, cx, cy, radius, ringColor = "#00E5FF") {
  ctx.save();

  // Outer glow ring
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
  ctx.stroke();

  // Clip circular area
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (img) {
    ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
  } else {
    drawFallbackAvatar(ctx, cx, cy, radius, ringColor);
  }

  ctx.restore();
}

// ==========================================
// 1. 🛬 MILITARY IN-PROCESSING WELCOME BANNER
// ==========================================

function drawSlantedStripes(ctx, x, y, count, barW, gap, height, slant, color) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const sx = x + i * (barW + gap);
    ctx.beginPath();
    ctx.moveTo(sx + slant, y);
    ctx.lineTo(sx + slant + barW, y);
    ctx.lineTo(sx + barW, y + height);
    ctx.lineTo(sx, y + height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}


function drawTrackedText(ctx, text, x, y, spacing) {
  let curX = x;
  for (const ch of text) {
    ctx.fillText(ch, curX, y);
    curX += ctx.measureText(ch).width + spacing;
  }
  return curX - x;
}

async function generateWelcomeCanvas(member) {
  const width = 1024;
  const height = 460;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const [avatarImg, bgImg, frameImg] = await Promise.all([
    safeLoadAvatar(member.user.displayAvatarURL({ extension: "png", size: 256 })),
    getWelcomeBgImage(),
    getWelcomeFrameImage()
  ]);

  // 1. Monochrome Chrome Background Template (1024x460)
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, width, height);
  } else {
    const fallbackGrad = ctx.createLinearGradient(0, 0, width, height);
    fallbackGrad.addColorStop(0, "#050507");
    fallbackGrad.addColorStop(1, "#12141a");
    ctx.fillStyle = fallbackGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Left Circular Avatar + Metallic Star-Compass Frame Overlay
  const avCX = 194;
  const avCY = 242;
  const frameW = 282;
  const frameH = frameImg ? Math.round(frameW * (frameImg.height / frameImg.width)) : 278;
  const avR = 92; // Tucks neatly inside the inner bezel edge (320/1024 * 282 ≈ 88px)

  ctx.save();
  ctx.beginPath();
  ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (avatarImg) {
    ctx.drawImage(avatarImg, avCX - avR, avCY - avR, avR * 2, avR * 2);
  } else {
    drawFallbackAvatar(ctx, avCX, avCY, avR, "#E2E8F0");
  }

  // Subtle dark inner vignette so photo blends seamlessly into the chrome bezel
  const innerShade = ctx.createRadialGradient(avCX, avCY, avR * 0.65, avCX, avCY, avR);
  innerShade.addColorStop(0, "rgba(0, 0, 0, 0)");
  innerShade.addColorStop(1, "rgba(0, 0, 0, 0.38)");
  ctx.fillStyle = innerShade;
  ctx.fillRect(avCX - avR, avCY - avR, avR * 2, avR * 2);
  ctx.restore();

  if (frameImg) {
    ctx.save();
    ctx.shadowColor = "rgba(255, 255, 255, 0.16)";
    ctx.shadowBlur = 14;
    ctx.drawImage(frameImg, avCX - frameW / 2, avCY - frameH / 2, frameW, frameH);
    ctx.restore();
  }

  // 3. Right Chrome Hexagonal Main Panel (centered at x = 652, y = 164..272)
  const hexCX = 652;
  ctx.save();
  ctx.textAlign = "center";

  // Top sub-label
  ctx.fillStyle = "#A1A1AA";
  ctx.font = "600 10px Segoe UI, sans-serif";
  const welcomeSub = "WELCOME TO HOLLOWBORN";
  const subSpacing = 3.2;
  let subTotalW = 0;
  for (const ch of welcomeSub) subTotalW += ctx.measureText(ch).width + subSpacing;
  ctx.textAlign = "start";
  drawTrackedText(ctx, welcomeSub, hexCX - (subTotalW - subSpacing) / 2, 190, subSpacing);

  // Member Display Name
  ctx.textAlign = "center";
  const fallbackUser = sanitizeCanvasText(member.user.username, "Recruit");
  const rawName = member.displayName || member.user.username;
  const cleanName = sanitizeCanvasText(rawName, fallbackUser);
  const displayName = cleanName.length > 26 ? cleanName.slice(0, 24) + "..." : cleanName;
  const nameFontSize = displayName.length > 19 ? 23 : displayName.length > 13 ? 28 : 34;

  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(255, 255, 255, 0.25)";
  ctx.shadowBlur = 10;
  ctx.font = `bold ${nameFontSize}px Segoe UI, sans-serif`;
  ctx.fillText(displayName, hexCX, 229, 390);
  ctx.shadowBlur = 0;

  // @username
  const cleanHandle = sanitizeCanvasText((member.user.username || member.user.tag || "recruit").replace(/#0$/, ""), "recruit");
  ctx.fillStyle = "#CBD5E1";
  ctx.font = "500 13.5px Segoe UI, sans-serif";
  ctx.fillText("@" + cleanHandle, hexCX, 252, 360);
  ctx.restore();

  // 4. Right Bottom Chrome Pill Bar (right of 👥 | at x = 498..890, midY = 318)
  const memberCount = member.guild.memberCount;
  const partLeft = `SURVIVOR RECRUIT #${memberCount}`;
  const partSep = "   •   ";
  const partRight = "SELAMAT DATANG DI KOMUNITAS";

  ctx.save();
  ctx.font = "bold 11.5px Segoe UI, sans-serif";
  const wLeft = ctx.measureText(partLeft).width;
  ctx.font = "500 11px Segoe UI, sans-serif";
  const wSep = ctx.measureText(partSep).width;
  const wRight = ctx.measureText(partRight).width;

  const pillTextStart = 516;
  const pillBaseY = 322;

  ctx.font = "bold 11.5px Segoe UI, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(partLeft, pillTextStart, pillBaseY);

  ctx.font = "500 11px Segoe UI, sans-serif";
  ctx.fillStyle = "#71717A";
  ctx.fillText(partSep, pillTextStart + wLeft, pillBaseY);

  ctx.fillStyle = "#D4D4D8";
  ctx.fillText(partRight, pillTextStart + wLeft + wSep, pillBaseY, Math.max(120, 882 - (pillTextStart + wLeft + wSep)));
  ctx.restore();

  return canvas.toBuffer("image/png");
}

// ==========================================
// 2. 🪪 TACTICAL SURVIVOR PROFILE ID CARD
// ==========================================

async function generateProfileCanvas(member, stats = {}, theme = "chrome") {
  const width = 1024;
  const height = 460;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const [avatarImg, bgImg, frameImg] = await Promise.all([
    safeLoadAvatar(member.user.displayAvatarURL({ extension: "png", size: 256 })),
    getWelcomeBgImage(),
    getWelcomeFrameImage()
  ]);

  const THEMES = {
    chrome: { primary: "#FFFFFF", accent: "#E2E8F0", glow: "rgba(255, 255, 255, 0.45)" },
    bunker: { primary: "#00E5FF", accent: "#38BDF8", glow: "rgba(0, 229, 255, 0.5)" },
    frost: { primary: "#80D8FF", accent: "#BAE6FD", glow: "rgba(128, 216, 255, 0.5)" },
    solafite: { primary: "#FFD700", accent: "#FDE047", glow: "rgba(255, 215, 0, 0.5)" },
    toxic: { primary: "#00E676", accent: "#4ADE80", glow: "rgba(0, 230, 118, 0.5)" }
  };
  const t = THEMES[theme] || THEMES.chrome;

  // 1. Black & Chrome Metallic Template Background (1024x460)
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, width, height);
  } else {
    const fallbackGrad = ctx.createLinearGradient(0, 0, width, height);
    fallbackGrad.addColorStop(0, "#050507");
    fallbackGrad.addColorStop(0.5, "#0d0e14");
    fallbackGrad.addColorStop(1, "#050507");
    ctx.fillStyle = fallbackGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Left Circular Avatar + Metallic Star-Compass Frame Overlay
  const avCX = 194;
  const avCY = 242;
  const frameW = 282;
  const frameH = frameImg ? Math.round(frameW * (frameImg.height / frameImg.width)) : 278;
  const avR = 92;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (avatarImg) {
    ctx.drawImage(avatarImg, avCX - avR, avCY - avR, avR * 2, avR * 2);
  } else {
    drawFallbackAvatar(ctx, avCX, avCY, avR, "#E2E8F0");
  }

  // Subtle dark inner vignette so photo blends seamlessly into the chrome bezel
  const innerShade = ctx.createRadialGradient(avCX, avCY, avR * 0.65, avCX, avCY, avR);
  innerShade.addColorStop(0, "rgba(0, 0, 0, 0)");
  innerShade.addColorStop(1, "rgba(0, 0, 0, 0.38)");
  ctx.fillStyle = innerShade;
  ctx.fillRect(avCX - avR, avCY - avR, avR * 2, avR * 2);
  ctx.restore();

  // Frame with Theme Accent Glow
  if (frameImg) {
    ctx.save();
    ctx.shadowColor = t.glow;
    ctx.shadowBlur = 16;
    ctx.drawImage(frameImg, avCX - frameW / 2, avCY - frameH / 2, frameW, frameH);
    ctx.restore();
  }

  // 3. Right Chrome Hexagonal Main Panel (centered at x = 652)
  const hexCX = 652;
  ctx.save();
  ctx.textAlign = "center";

  // Top sub-label
  ctx.fillStyle = t.accent;
  ctx.font = "bold 10px Segoe UI, sans-serif";
  ctx.fillText("HOLLOWBORN // TACTICAL SURVIVOR ID", hexCX, 190);

  // Member Display Name
  const fallbackUser = sanitizeCanvasText(member.user.username, "Recruit");
  const rawName = member.displayName || member.user.username;
  const cleanName = sanitizeCanvasText(rawName, fallbackUser);
  const displayName = cleanName.length > 24 ? cleanName.slice(0, 22) + "..." : cleanName;
  const nameFontSize = displayName.length > 18 ? 24 : displayName.length > 12 ? 28 : 32;

  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = t.glow;
  ctx.shadowBlur = 10;
  ctx.font = `bold ${nameFontSize}px Segoe UI, sans-serif`;
  ctx.fillText(displayName, hexCX, 224, 380);
  ctx.shadowBlur = 0;

  // Handle & Highest Role
  const cleanHandle = sanitizeCanvasText((member.user.username || member.user.tag || "operative").replace(/#0$/, ""), "operative");
  const primaryRole = member.roles.highest ? member.roles.highest.name : "Operative";
  let cleanRole = sanitizeCanvasText(primaryRole, "Operative");
  if (cleanRole === "@everyone" || !cleanRole) cleanRole = "SURVIVOR RECRUIT";

  ctx.fillStyle = "#CBD5E1";
  ctx.font = "600 12px Segoe UI, sans-serif";
  ctx.fillText(`@${cleanHandle} • ${cleanRole.toUpperCase()} • CLEARANCE LEVEL-1`, hexCX, 247, 380);
  ctx.restore();

  // 4. Lower Pill Bar (midY = 322, text starts at x = 512, ends <= 890)
  const pillStart = 512;
  const pillY = 322;
  ctx.save();
  ctx.textAlign = "start";

  const statsParts = [
    { label: "VOICE: ", val: stats.voiceDisplay || "0m" },
    { sep: "   •   " },
    { label: "ROADMAP: ", val: `${stats.completedRoadmap || 0}/7` },
    { sep: "   •   " },
    { label: "BASE: ", val: `${stats.registeredBases || 0}` },
    { sep: "   •   " },
    { label: "MABAR: ", val: `${stats.mabarJoined || 0}X` }
  ];

  let curX = pillStart;
  for (const p of statsParts) {
    if (p.sep) {
      ctx.fillStyle = "#71717A";
      ctx.font = "500 11px Segoe UI, sans-serif";
      ctx.fillText(p.sep, curX, pillY);
      curX += ctx.measureText(p.sep).width;
    } else {
      ctx.fillStyle = "#A1A1AA";
      ctx.font = "bold 10px Segoe UI, sans-serif";
      ctx.fillText(p.label, curX, pillY);
      curX += ctx.measureText(p.label).width;

      ctx.fillStyle = t.primary;
      ctx.font = "bold 11px Segoe UI, sans-serif";
      ctx.fillText(p.val, curX, pillY);
      curX += ctx.measureText(p.val).width;
    }
  }
  ctx.restore();

  return canvas.toBuffer("image/png");
}

// ==========================================
// 3. 🗺️ TACTICAL ISLAND SATELLITE RADAR MAP
// ==========================================

async function generateIslandRadarCanvas(bases = [], filterMode = "all", progressData = {}, options = {}) {
  const width = 1240;
  const height = 750;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const { sector = "full", season = "normal" } = options;
  const steps = progressData?.steps || {};
  let completedCount = 0;
  for (let i = 1; i <= 7; i++) {
    if (steps[String(i)]?.completed) completedCount++;
  }
  const percent = Math.round((completedCount / 7) * 100);

  let nextStepNum = null;
  for (let i = 1; i <= 7; i++) {
    if (!steps[String(i)]?.completed) {
      nextStepNum = i;
      break;
    }
  }

  // ── Sector zoom configs (cx, cy, cw in 3840x3840 source)
  const SECTOR_CROPS = {
    full: { cropX: 170, cropY: 540, cropW: 3500 },
    utara: { cropX: 1050, cropY: 350, cropW: 1600 },
    barat: { cropX: 350, cropY: 1100, cropW: 1900 },
    gunung: { cropX: 850, cropY: 850, cropW: 2200 },
    timur: { cropX: 1950, cropY: 1050, cropW: 1700 },
    selatan: { cropX: 1700, cropY: 1950, cropW: 2000 }
  };
  const sc = SECTOR_CROPS[sector] || SECTOR_CROPS.full;

  // ── Season tint palette
  const isWinter = season === "winter";

  // 1. Dark Cyber Background
  ctx.fillStyle = isWinter ? "#080d16" : "#060a12";
  ctx.fillRect(0, 0, width, height);

  // Background Grid
  drawTechGrid(ctx, width, height, 40, isWinter ? "rgba(140,210,255,0.04)" : "rgba(0,229,255,0.035)");

  const accentColor = isWinter ? "#82CFFF" : "#00E5FF";
  const accentDim = isWinter ? "rgba(130,207,255,0.35)" : "rgba(0,229,255,0.4)";

  // Main Outer HUD Frame
  drawHudFrame(ctx, 16, 16, width - 32, height - 32, accentColor, 16);

  // Top Header Bar
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px Segoe UI, sans-serif";
  const sectorLabels = { full: "FULL ISLAND", utara: "SEKTOR UTARA", barat: "SEKTOR BARAT", gunung: "PEGUNUNGAN", timur: "SEKTOR TIMUR", selatan: "TEBING SELATAN" };
  ctx.fillText(`HOLLOWBORN // TACTICAL RECON MAP — ${sectorLabels[sector] || "FULL ISLAND"}`, 36, 48);

  ctx.fillStyle = accentColor;
  ctx.font = "600 11px Segoe UI, sans-serif";
  const seasonLabel = isWinter ? "[ MODE MUSIM DINGIN — SNOW VISIBILITY REDUCED ]" : "SONS OF THE FOREST • REAL TOPOGRAPHY & EXPEDITION PROGRESS TRACKER";
  ctx.fillText(seasonLabel, 36, 66);

  // Top Right Status Badge
  const badgeText = completedCount === 7 ? "PULAU 100% TERJELAJAHI" : `EKSPLORASI: ${completedCount}/7 LOKASI`;
  ctx.font = "bold 11px Segoe UI, sans-serif";
  const bWidth = ctx.measureText(badgeText).width;
  const bX = width - bWidth - 55;

  ctx.fillStyle = completedCount === 7 ? "rgba(255,215,0,0.15)" : `rgba(0,229,255,0.15)`;
  ctx.strokeStyle = completedCount === 7 ? "#FFD700" : accentColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bX, 32, bWidth + 24, 26, 13);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = completedCount === 7 ? "#FFD700" : accentColor;
  ctx.fillText(badgeText, bX + 12, 49);

  // 2. Map Viewport Frame
  const mfX = 26;
  const mfY = 82;
  const mfW = 810;
  const mfH = 640;

  const mapImg = await getSotfMapImage();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(mfX, mfY, mfW, mfH, 10);
  ctx.clip();

  // Sector-aware crop
  const cropW = sc.cropW;
  const cropH = Math.round(cropW * (mfH / mfW));
  const cropX = sc.cropX;
  const cropY = sc.cropY;

  if (mapImg) {
    ctx.drawImage(mapImg, cropX, cropY, cropW, cropH, mfX, mfY, mfW, mfH);

    // Winter Overlay
    if (isWinter) {
      ctx.fillStyle = "rgba(140, 200, 255, 0.18)";
      ctx.fillRect(mfX, mfY, mfW, mfH);
    }

    // Tactical Vignette
    const vig = ctx.createRadialGradient(mfX + mfW / 2, mfY + mfH / 2, 180, mfX + mfW / 2, mfY + mfH / 2, mfW / 1.4);
    vig.addColorStop(0, "rgba(0, 0, 0, 0)");
    vig.addColorStop(1, isWinter ? "rgba(5, 10, 22, 0.5)" : "rgba(3, 7, 14, 0.45)");
    ctx.fillStyle = vig;
    ctx.fillRect(mfX, mfY, mfW, mfH);

    // GPS Grid A-H / 1-8 inside map
    const cols = 8, rows = 8;
    const cellW = mfW / cols;
    const cellH = mfH / rows;
    const colLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];

    ctx.strokeStyle = `rgba(0,229,255,0.09)`;
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(mfX + c * cellW, mfY);
      ctx.lineTo(mfX + c * cellW, mfY + mfH);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(mfX, mfY + r * cellH);
      ctx.lineTo(mfX + mfW, mfY + r * cellH);
      ctx.stroke();
    }

    // Grid coordinate labels
    ctx.font = "bold 9px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = "rgba(0,229,255,0.65)";
      ctx.fillText(colLabels[c], mfX + c * cellW + cellW / 2, mfY + 12);
    }
    ctx.textAlign = "start";
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = "rgba(0,229,255,0.65)";
      ctx.fillText(String(r + 1), mfX + 4, mfY + r * cellH + cellH / 2 + 4);
    }
  } else {
    ctx.fillStyle = "#101622";
    ctx.fillRect(mfX, mfY, mfW, mfH);
  }

  ctx.restore();

  // Map Border Frame
  ctx.strokeStyle = accentDim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(mfX, mfY, mfW, mfH, 10);
  ctx.stroke();

  // Compass Rose
  const compX = mfX + 45;
  const compY = mfY + 45;
  ctx.strokeStyle = `rgba(0,229,255,0.7)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(compX, compY, 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(compX, compY - 18);
  ctx.lineTo(compX - 4, compY);
  ctx.lineTo(compX + 4, compY);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.beginPath();
  ctx.moveTo(compX, compY + 18);
  ctx.lineTo(compX - 4, compY);
  ctx.lineTo(compX + 4, compY);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 9px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("N", compX, compY - 21);
  ctx.textAlign = "start";

  // Sector label badge (bottom-left inside map)
  if (sector !== "full") {
    const sectorDesc = { utara: "PANTAI UTARA [A1-D3]", barat: "HUTAN & DANAU [A3-D7]", gunung: "PEGUNUNGAN SALJU [C2-G6]", timur: "GOLF TIMUR [E2-H5]", selatan: "TEBING SELATAN [D6-H8]" };
    const sLabel = sectorDesc[sector] || sector.toUpperCase();
    ctx.fillStyle = "rgba(10,16,26,0.9)";
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(mfX + 20, mfY + mfH - 36, 220, 20, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accentColor;
    ctx.font = "bold 10px Segoe UI, sans-serif";
    ctx.fillText(`ZOOM: ${sLabel}`, mfX + 28, mfY + mfH - 22);
  }

  // GPS Scale bar
  const scX = sector !== "full" ? mfX + 260 : mfX + 20;
  const scY = mfY + mfH - 24;
  ctx.fillStyle = "rgba(10, 16, 26, 0.85)";
  ctx.strokeStyle = "rgba(0, 229, 255, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(scX, scY, 160, 16, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = "600 9px Segoe UI, sans-serif";
  ctx.fillText("GPS SCALE: 0 --- 2.5 KM --- 5 KM", scX + 8, scY + 11);

  // Coordinate Conversion helper (sector-aware)
  function toMap(nx, ny) {
    const rx = (nx - cropX) / cropW;
    const ry = (ny - cropY) / cropH;
    return { x: mfX + rx * mfW, y: mfY + ry * mfH };
  }

  // Clamp — only render pins visible in current crop
  function inView(pt) {
    return pt.x >= mfX + 2 && pt.x <= mfX + mfW - 2 && pt.y >= mfY + 2 && pt.y <= mfY + mfH - 2;
  }

  // 3. Plot Story POIs (7 Stages) & Key Loot Caves
  const storyPOIs = [
    { step: 1, name: "Gua Rebreather", item: "Alat Selam (Rebreather)", nx: 1650, ny: 800 },
    { step: 2, name: "Gua Rope Gun",   item: "Zipline Gun (Rope)",      nx: 1080, ny: 2200 },
    { step: 3, name: "Gua Sekop",      item: "Sekop Utama (Shovel)",    nx: 1720, ny: 1720, flipY: false },
    { step: 4, name: "Maint Bunker A", item: "Maintenance Keycard",     nx: 1250, ny: 1400 },
    { step: 5, name: "VIP Food Bunker",item: "VIP Card & Shotgun",      nx: 920,  ny: 1850, flipY: true },
    { step: 6, name: "Guest Bunker",   item: "Katana & Chainsaw",       nx: 2800, ny: 1820 },
    { step: 7, name: "Luxury Bunker",  item: "Ancient Armor (Pintu Emas)", nx: 3080, ny: 2780 }
  ];

  const bonusCaves = [
    { name: "Maint Bunker B", item: "Compound Bow & Silencer", nx: 1100, ny: 2600 },
    { name: "Maint Bunker C", item: "Revolver", nx: 2700, ny: 2200 },
    { name: "Gua Air Terjun", item: "Stun Baton", nx: 1380, ny: 1980, flipY: true },
    { name: "Perahu Pantai", item: "Pistol & Flare Gun", nx: 1450, ny: 480 },
    { name: "Gua Solafite", item: "Plating Senjata Emas", nx: 1980, ny: 1460, flipY: true }
  ];

  function calcBadgePos(pt, bW, bH, flipY = false) {
    let bX = pt.x + 14;
    if (bX + bW > mfX + mfW - 8) {
      bX = Math.max(mfX + 8, mfX + mfW - bW - 8);
    }
    let bY = flipY ? (pt.y + 14) : (pt.y - 17);
    bY = Math.max(mfY + 8, Math.min(bY, mfY + mfH - bH - 8));
    return { bX, bY };
  }

  if (filterMode === "all" || filterMode === "story" || filterMode === "keycard") {
    const keycardSteps = new Set([4, 5, 6, 7]); // Maintenance + VIP + Guest + Golden
    storyPOIs.forEach(poi => {
      if (filterMode === "keycard" && !keycardSteps.has(poi.step)) return;
      const pt = toMap(poi.nx, poi.ny);
      if (!inView(pt)) return;

      const isDone = steps[String(poi.step)]?.completed;
      const isActive = poi.step === nextStepNum;

      if (isActive) {
        // High-intensity Glowing Cyan Target Reticle
        ctx.strokeStyle = "#00E5FF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pt.x - 28, pt.y); ctx.lineTo(pt.x - 16, pt.y);
        ctx.moveTo(pt.x + 16, pt.y); ctx.lineTo(pt.x + 28, pt.y);
        ctx.moveTo(pt.x, pt.y - 28); ctx.lineTo(pt.x - 16, pt.y);
        ctx.moveTo(pt.x, pt.y + 16); ctx.lineTo(pt.x + 28, pt.y);
        ctx.stroke();

        ctx.beginPath(); ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2);
        ctx.fillStyle = "#00E5FF"; ctx.fill();
        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#050c18";
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fill();

        // Target Badge
        const bW = 205;
        const bH = 34;
        const { bX, bY } = calcBadgePos(pt, bW, bH, poi.flipY);

        ctx.fillStyle = "#00E5FF";
        ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, 6); ctx.fill();
        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.5; ctx.stroke();

        ctx.fillStyle = "#040810"; ctx.font = "bold 10px Segoe UI, sans-serif";
        ctx.fillText(`>> TARGET: T${poi.step}. ${poi.name}`, bX + 8, bY + 14);

        ctx.fillStyle = "#06182c"; ctx.font = "bold 9px Segoe UI, sans-serif";
        ctx.fillText(`Ambil: ${poi.item}`, bX + 8, bY + 28);
      } else if (isDone) {
        // Explored Green Pin with Vector Checkmark (No Unicode Tofu Box)
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,230,118,0.25)"; ctx.fill();
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#00E676"; ctx.fill();
        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2; ctx.stroke();

        // Vector checkmark inside the round pin
        ctx.strokeStyle = "#041008"; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(pt.x - 4, pt.y); ctx.lineTo(pt.x - 1, pt.y + 3); ctx.lineTo(pt.x + 4, pt.y - 3); ctx.stroke();

        // Cleared Badge with Cave Name and Item Details
        const bW = 215;
        const bH = 34;
        const { bX, bY } = calcBadgePos(pt, bW, bH, poi.flipY);

        ctx.fillStyle = "rgba(8,24,16,0.93)"; ctx.strokeStyle = "rgba(0,230,118,0.65)"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, 5); ctx.fill(); ctx.stroke();

        ctx.fillStyle = "#00E676"; ctx.font = "bold 10px Segoe UI, sans-serif";
        ctx.fillText(`[CLEARED] T${poi.step}: ${poi.name}`, bX + 8, bY + 14);

        ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = "8.5px Segoe UI, sans-serif";
        const rawWho = steps[String(poi.step)]?.completedBy || "Survivor";
        const cleanWho = sanitizeCanvasText(rawWho, "Survivor");
        ctx.fillText(`Ambil: ${poi.item} - @${cleanWho.split("#")[0]}`, bX + 8, bY + 28);
      } else {
        // Unexplored Amber Pin
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#FF9100"; ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.lineWidth = 1.5; ctx.stroke();

        const bW = 205;
        const bH = 32;
        const { bX, bY } = calcBadgePos(pt, bW, bH, poi.flipY);

        ctx.fillStyle = "rgba(18,14,10,0.92)"; ctx.strokeStyle = "rgba(255,145,0,0.55)"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, 4); ctx.fill(); ctx.stroke();

        ctx.fillStyle = "#FF9100"; ctx.font = "bold 10px Segoe UI, sans-serif";
        ctx.fillText(`[LOCKED] T${poi.step}: ${poi.name}`, bX + 8, bY + 13);

        ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "8.5px Segoe UI, sans-serif";
        ctx.fillText(`Ambil: ${poi.item}`, bX + 8, bY + 26);
      }
    });

    // Plot Bonus Loot Caves (when viewing story or all)
    if (filterMode === "all" || filterMode === "story") {
      bonusCaves.forEach(bc => {
        const pt = toMap(bc.nx, bc.ny);
        if (!inView(pt)) return;

        // Cyan Diamond/Circle Pin
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#00E5FF"; ctx.fill();
        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.5; ctx.stroke();

        // Pin Glow
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,229,255,0.4)"; ctx.lineWidth = 1; ctx.stroke();

        const bW = 185;
        const bH = 30;
        const { bX, bY } = calcBadgePos(pt, bW, bH, bc.flipY);

        ctx.fillStyle = "rgba(6,18,28,0.92)"; ctx.strokeStyle = "rgba(0,229,255,0.5)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, 4); ctx.fill(); ctx.stroke();

        ctx.fillStyle = "#00E5FF"; ctx.font = "bold 9.5px Segoe UI, sans-serif";
        ctx.fillText(`[GUA] ${bc.name}`, bX + 8, bY + 12);

        ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = "8px Segoe UI, sans-serif";
        ctx.fillText(`Ambil: ${bc.item}`, bX + 8, bY + 24);
      });
    }
  }

  // 4. Crash Sites & Helicopter Wrecks
  const crashSites = [
    { name: "Helipad Crash A", nx: 2200, ny: 900 },
    { name: "Helipad Crash B", nx: 1600, ny: 600 },
    { name: "Golf Cart Site", nx: 2600, ny: 1600 },
    { name: "Boat Wreck", nx: 1300, ny: 500 }
  ];
  if (filterMode === "crash") {
    crashSites.forEach(cs => {
      const pt = toMap(cs.nx, cs.ny);
      if (!inView(pt)) return;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#FF4081"; ctx.fill();
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "rgba(14,10,22,0.9)"; ctx.strokeStyle = "#FF4081"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(pt.x + 10, pt.y - 9, 110, 16, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#FF4081"; ctx.font = "bold 8px Segoe UI, sans-serif";
      ctx.fillText(`[CRASH] ${cs.name}`, pt.x + 14, pt.y + 2);
    });
  }

  // 5. Solafite Mine Spots
  const solafiteMines = [
    { name: "Mine Alpha", nx: 1900, ny: 1500 },
    { name: "Mine Beta", nx: 1400, ny: 1800 },
    { name: "Mine Gamma", nx: 2500, ny: 2200 },
    { name: "Summit Vein", nx: 1920, ny: 1100 }
  ];
  if (filterMode === "solafite") {
    solafiteMines.forEach(m => {
      const pt = toMap(m.nx, m.ny);
      if (!inView(pt)) return;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#B388FF"; ctx.fill();
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "rgba(10,8,22,0.9)"; ctx.strokeStyle = "#B388FF"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(pt.x + 10, pt.y - 9, 110, 16, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#B388FF"; ctx.font = "bold 8px Segoe UI, sans-serif";
      ctx.fillText(`[ORE] ${m.name}`, pt.x + 14, pt.y + 2);
    });
  }

  // 6. Plot Player Bases
  if (filterMode === "all" || filterMode === "bases") {
    const sectorOffsets = {
      utara: { nx: 1800, ny: 950 }, pantai: { nx: 1500, ny: 750 },
      barat: { nx: 1100, ny: 1600 }, salju: { nx: 1920, ny: 1920 },
      timur: { nx: 2700, ny: 1700 }, tenggara: { nx: 2900, ny: 2600 },
      danau: { nx: 1150, ny: 2300 }, air: { nx: 1450, ny: 1900 }
    };
    const typeColors = { main_base: "#FFD700", outpost: "#00E5FF", zipline: "#69F0AE", vehicle: "#FFAB40", cache: "#B388FF" };

    bases.forEach((b, idx) => {
      const loc = (b.location || "").toLowerCase();
      let coords = { nx: 1500 + ((idx * 280) % 1200), ny: 1400 + ((idx * 220) % 900) };
      for (const [key, off] of Object.entries(sectorOffsets)) {
        if (loc.includes(key)) { coords = { nx: off.nx + ((idx * 60) % 180) - 90, ny: off.ny + ((idx * 50) % 150) - 75 }; break; }
      }
      const pt = toMap(coords.nx, coords.ny);
      if (!inView(pt)) return;
      const pinColor = typeColors[b.type] || "#00E676";

      ctx.beginPath(); ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = pinColor; ctx.fill();
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
      ctx.strokeStyle = pinColor; ctx.lineWidth = 1.2; ctx.stroke();

      const cleanBaseName = sanitizeCanvasText(b.name, "Base");
      ctx.fillStyle = "rgba(10,16,26,0.9)"; ctx.strokeStyle = pinColor; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(pt.x + 12, pt.y - 12, 130, 22, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 9px Segoe UI, sans-serif";
      ctx.fillText(`[BASE] ${cleanBaseName.slice(0, 14)}`, pt.x + 18, pt.y + 3);
    });
  }

  // 7. Right Side Tactical Data Panel
  const panelX = 855;
  const panelY = 82;
  const panelW = width - panelX - 26;
  const panelH = mfH;

  ctx.fillStyle = "rgba(12,17,28,0.88)";
  ctx.strokeStyle = isWinter ? "rgba(130,207,255,0.3)" : "rgba(0,229,255,0.3)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(panelX, panelY, panelW, panelH, 10); ctx.fill(); ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = "bold 13px Segoe UI, sans-serif";
  ctx.fillText(">> STATUS EKSPLORASI PULAU", panelX + 20, panelY + 28);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 30px Segoe UI, sans-serif";
  ctx.fillText(`${percent}%`, panelX + 20, panelY + 64);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "600 12px Segoe UI, sans-serif";
  ctx.fillText(`${completedCount} dari 7 Sektor Cerita Tuntas`, panelX + 90, panelY + 64);

  // Progress Bar
  const pbX = panelX + 20, pbY = panelY + 76, pbW = panelW - 40, pbH = 10;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath(); ctx.roundRect(pbX, pbY, pbW, pbH, 5); ctx.fill();
  const fillW = Math.max(10, (pbW * percent) / 100);
  const pGrad = ctx.createLinearGradient(pbX, 0, pbX + fillW, 0);
  pGrad.addColorStop(0, "#00E676"); pGrad.addColorStop(1, "#00E5FF");
  ctx.fillStyle = pGrad;
  ctx.beginPath(); ctx.roundRect(pbX, pbY, fillW, pbH, 5); ctx.fill();

  // Active Objective Card
  const objY = panelY + 98;
  ctx.fillStyle = "rgba(0,229,255,0.07)"; ctx.strokeStyle = accentColor; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.roundRect(panelX + 16, objY, panelW - 32, 92, 7); ctx.fill(); ctx.stroke();

  ctx.fillStyle = accentColor; ctx.font = "bold 10px Segoe UI, sans-serif";
  ctx.fillText(">> TARGET EKSPLORASI SEKARANG:", panelX + 26, objY + 20);

  const nextNames = [
    "Tahap 1: Rebreather (Alat Selam)",
    "Tahap 2: Rope Gun (Zipline)",
    "Tahap 3: Shovel (Sekop Utama)",
    "Tahap 4: Maintenance Keycard",
    "Tahap 5: VIP Keycard & Shotgun",
    "Tahap 6: Guest Bunker (Katana)",
    "Tahap 7: Ancient Armor (Pintu Emas)"
  ];
  const nextLocs = [
    "Gua Pantai Utara [B2]",
    "Gua Danau Barat Daya [B5]",
    "Gua Salju Tengah [D4]",
    "Maintenance Bunker A [C3]",
    "VIP Food Bunker Barat [B4]",
    "Guest Bunker Golf Timur [F4]",
    "Luxury Bunker Lava Cave [F7]"
  ];

  if (nextStepNum) {
    ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 12px Segoe UI, sans-serif";
    ctx.fillText(nextNames[nextStepNum - 1], panelX + 26, objY + 40);
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "500 10.5px Segoe UI, sans-serif";
    ctx.fillText(`Lokasi: ${nextLocs[nextStepNum - 1]}`, panelX + 26, objY + 58);
    ctx.fillStyle = "rgba(0,229,255,0.85)"; ctx.font = "500 10px Segoe UI, sans-serif";
    ctx.fillText("Pilih dropdown Dossier di bawah untuk info loot!", panelX + 26, objY + 76);
  } else {
    ctx.fillStyle = "#FFD700"; ctx.font = "bold 13px Segoe UI, sans-serif";
    ctx.fillText("SEMUA 7 TAHAP SELESAI!", panelX + 26, objY + 44);
    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "500 11px Segoe UI, sans-serif";
    ctx.fillText("Pintu Emas & Gua Lava Siap Ditembus!", panelX + 26, objY + 68);
  }

  // Filter Mode Active Pill
  const filterLabels = { all: "SEMUA TITIK", story: "GUA CERITA", bases: "MARKAS TIM", keycard: "KEYCARD BUNKER", crash: "CRASH SITES", solafite: "TAMBANG SOLAFITE" };
  const fLabel = filterLabels[filterMode] || filterMode.toUpperCase();
  const fPillY = panelY + 200;
  ctx.fillStyle = "rgba(0,229,255,0.12)"; ctx.strokeStyle = accentColor; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(panelX + 16, fPillY, panelW - 32, 22, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = accentColor; ctx.font = "bold 10px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`FILTER RADAR: ${fLabel}`, panelX + panelW / 2, fPillY + 15);
  ctx.textAlign = "start";

  // Radar Legend Box
  const legY = panelY + 232;
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.beginPath(); ctx.roundRect(panelX + 16, legY, panelW - 32, 138, 8); ctx.fill();

  ctx.fillStyle = "#CBD5E1"; ctx.font = "bold 10.5px Segoe UI, sans-serif";
  ctx.fillText("LEGENDA STATUS RADAR:", panelX + 26, legY + 20);

  const legends = [
    { color: "#00E676", label: "Selesai / Sudah Dijelajahi" },
    { color: "#00E5FF", label: "Target Misi Aktif Sekarang" },
    { color: "#FF9100", label: "Belum Dijelajahi / Terkunci" },
    { color: "#FF4081", label: "Crash Site / Wreck" },
    { color: "#B388FF", label: "Spot Solafite / Tambang" },
    { color: "#FFD700", label: "Pintu Emas (Tamat Game)" }
  ];
  legends.forEach((l, idx) => {
    const ly = legY + 38 + idx * 16;
    ctx.beginPath(); ctx.arc(panelX + 32, ly, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = l.color; ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "9.5px Segoe UI, sans-serif";
    ctx.fillText(l.label, panelX + 44, ly + 3.5);
  });

  // Base list
  const baseListY = panelY + 382;
  ctx.fillStyle = accentColor; ctx.font = "bold 11px Segoe UI, sans-serif";
  ctx.fillText(`MARKAS TIM TERDAFTAR (${bases.length}):`, panelX + 20, baseListY);

  if (bases.length === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px Segoe UI, sans-serif";
    ctx.fillText("Belum ada markas terdaftar.", panelX + 20, baseListY + 22);
    ctx.fillText("Ketik /base add untuk mendaftarkan!", panelX + 20, baseListY + 38);
  } else {
    bases.slice(0, 4).forEach((b, idx) => {
      const by = baseListY + 20 + idx * 34;
      const cleanBName = sanitizeCanvasText(b.name, "Base");
      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 10px Segoe UI, sans-serif";
      ctx.fillText(`${idx + 1}. [BASE] ${cleanBName.slice(0, 18)}`, panelX + 20, by);
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "9.5px Segoe UI, sans-serif";
      ctx.fillText(`Lokasi: ${(b.location || "SOTF").slice(0, 24)}`, panelX + 20, by + 13);
    });
    if (bases.length > 4) {
      ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "9.5px Segoe UI, sans-serif";
      ctx.fillText(`+ ${bases.length - 4} markas lainnya...`, panelX + 20, baseListY + 20 + 4 * 34);
    }
  }

  // Footer Tagline
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.font = "500 11px Segoe UI, sans-serif";
  ctx.fillText("HOLLOWBORN TACTICAL NETWORK • SOTF SURVIVOR REGISTRY #SITE-2", 36, height - 26);

  return canvas.toBuffer("image/png");
}

// ==========================================
// 3. 🗺️ TACTICAL ISLAND SATELLITE RADAR MAP

// ==========================================
// 4. 🎫 MABAR MISSION DEPARTURE TICKET
// ==========================================

async function generateMabarTicketCanvas(session, attendeeUsers = []) {
  const width = 1040;
  const height = 390;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Load attendee avatars (up to 8) and frame asset
  const [frameImg, ...loadedAvatars] = await Promise.all([
    getWelcomeFrameImage(),
    ...attendeeUsers.slice(0, 8).map(async u => {
      if (u && typeof u.displayAvatarURL === "function") {
        const img = await safeLoadAvatar(u.displayAvatarURL({ extension: "png", size: 128 }));
        const cleanAttName = sanitizeCanvasText(u.displayName || u.username, "Survivor");
        return { img, name: cleanAttName };
      }
      return null;
    })
  ]);

  const validAvatars = loadedAvatars.filter(Boolean);

  // 1. Deep Black Metallic Background with Subtle Chrome Sheen
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#050507");
  bgGrad.addColorStop(0.5, "#0d0e15");
  bgGrad.addColorStop(1, "#050507");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle chrome light wave on top & bottom
  const topGlow = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, 420);
  topGlow.addColorStop(0, "rgba(255, 255, 255, 0.12)");
  topGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, width, 130);

  // 2. Chrome Metallic Borders & Corner Crosshairs
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  const drawCornerCrosshair = (cx, cy) => {
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
    ctx.stroke();
  };
  drawCornerCrosshair(28, 28);
  drawCornerCrosshair(width - 28, 28);
  drawCornerCrosshair(28, height - 28);
  drawCornerCrosshair(width - 28, height - 28);

  // 3. Top Header
  ctx.textAlign = "start";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 22px Segoe UI, sans-serif";
  ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
  ctx.shadowBlur = 8;
  ctx.fillText("HOLLOWBORN // TACTICAL EXPEDITION PASS", 48, 56);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#94A3B8";
  ctx.font = "600 11px Segoe UI, sans-serif";
  ctx.fillText("BORN FROM NOTHING. UNITED AS ONE. • SQUAD BOARDING TICKET", 48, 74);

  // Barcode Top Right
  drawBarcode(ctx, width - 210, 38, 160, 24, "rgba(255, 255, 255, 0.35)");

  // 4. Two Metallic Info Boxes
  const boxY = 96;
  const boxH = 76;
  const boxW = 460;

  // Box 1: Game & Departure Time
  const gradBox1 = ctx.createLinearGradient(48, boxY, 48 + boxW, boxY + boxH);
  gradBox1.addColorStop(0, "rgba(255, 255, 255, 0.07)");
  gradBox1.addColorStop(1, "rgba(255, 255, 255, 0.02)");
  ctx.fillStyle = gradBox1;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(48, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#94A3B8";
  ctx.font = "bold 10px Segoe UI, sans-serif";
  ctx.fillText("TARGET GAME // MISI EKSPEDISI:", 68, boxY + 24);

  const gameTitle = sanitizeCanvasText((session.game || "Sons of The Forest").toUpperCase(), "SONS OF THE FOREST");
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px Segoe UI, sans-serif";
  ctx.fillText(gameTitle.length > 24 ? gameTitle.slice(0, 22) + "..." : gameTitle, 68, boxY + 48);

  const timeStr = session.rawTime || "SEGERA";
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "600 11.5px Segoe UI, sans-serif";
  ctx.fillText(`⏱️ Waktu: ${timeStr}`, 68, boxY + 66);

  // Box 2: Host Operative & Mission Note
  const hostBoxX = width - 48 - boxW;
  const gradBox2 = ctx.createLinearGradient(hostBoxX, boxY, hostBoxX + boxW, boxY + boxH);
  gradBox2.addColorStop(0, "rgba(255, 255, 255, 0.07)");
  gradBox2.addColorStop(1, "rgba(255, 255, 255, 0.02)");
  ctx.fillStyle = gradBox2;
  ctx.beginPath();
  ctx.roundRect(hostBoxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#94A3B8";
  ctx.font = "bold 10px Segoe UI, sans-serif";
  ctx.fillText("EXPEDITION LEADER // HOST:", hostBoxX + 20, boxY + 24);

  const rawHost = session.hostTag ? session.hostTag.split("#")[0] : "Operative Host";
  const cleanHost = sanitizeCanvasText(rawHost, "Operative Host");
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px Segoe UI, sans-serif";
  ctx.fillText(cleanHost.length > 24 ? cleanHost.slice(0, 22) + "..." : cleanHost, hostBoxX + 20, boxY + 48);

  const noteStr = session.note ? `📝 ${session.note}` : "STATUS: RECRUITMENT OPEN • TARGET: SITE-2";
  const cleanNote = sanitizeCanvasText(noteStr, "STATUS: RECRUITMENT OPEN");
  ctx.fillStyle = "#CBD5E1";
  ctx.font = "600 11.5px Segoe UI, sans-serif";
  ctx.fillText(cleanNote.length > 38 ? cleanNote.slice(0, 36) + "..." : cleanNote, hostBoxX + 20, boxY + 66);

  // 5. Squad Attendees Slots Section
  const slotSectionY = 200;
  const attCount = session.attendees ? session.attendees.size : validAvatars.length;
  ctx.fillStyle = "#CBD5E1";
  ctx.font = "bold 12px Segoe UI, sans-serif";
  ctx.fillText(`SQUAD ATTENDEES (${attCount} / 8 OPERATIVE TERKONFIRMASI):`, 48, slotSectionY);

  const slotStartX = 92;
  const slotY = 260;
  const slotSpacing = 122;
  const totalSlots = 8;

  for (let i = 0; i < totalSlots; i++) {
    const sx = slotStartX + i * slotSpacing;
    const att = validAvatars[i];

    if (att && att.img) {
      // 1. Clipped circular avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, slotY, 26, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(att.img, sx - 26, slotY - 26, 52, 52);

      // Subtle vignette
      const avVignette = ctx.createRadialGradient(sx, slotY, 16, sx, slotY, 26);
      avVignette.addColorStop(0, "rgba(0,0,0,0)");
      avVignette.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = avVignette;
      ctx.fillRect(sx - 26, slotY - 26, 52, 52);
      ctx.restore();

      // 2. Mini Chrome Star Frame overlay
      if (frameImg) {
        ctx.save();
        ctx.shadowColor = "rgba(255, 255, 255, 0.25)";
        ctx.shadowBlur = 8;
        ctx.drawImage(frameImg, sx - 38, slotY - 38, 76, 76);
        ctx.restore();
      } else {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, slotY, 26, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Attendee Name
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 10px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(att.name.slice(0, 11), sx, slotY + 46);
      ctx.textAlign = "start";
    } else {
      // Empty Slot (Sleek Chrome dashed placeholder)
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(sx, slotY, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = "bold 10px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`SLOT ${i + 1}`, sx, slotY + 46);
      ctx.textAlign = "start";
    }
  }

  // 6. Footer Tagline
  ctx.fillStyle = "#71717A";
  ctx.font = "500 11px Segoe UI, sans-serif";
  ctx.fillText("Klik tombol [Hadir] di Discord untuk mengisi slot squad! • HOLLOWBORN TACTICAL NETWORK", 48, height - 24);

  return canvas.toBuffer("image/png");
}

// ==========================================
// 5. 🎒 SURVIVAL LOADOUT BLUEPRINT
// ==========================================

function generateLoadoutCanvas(member, loadout = {}) {
  const width = 940;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Dark Tactical Carbon Background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#080c14");
  grad.addColorStop(0.5, "#0f1624");
  grad.addColorStop(1, "#070a10");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  drawTechGrid(ctx, width, height, 40, "rgba(0, 229, 255, 0.04)");
  drawHudFrame(ctx, 16, 16, width - 32, height - 32, "#00E5FF", 16);

  // Header
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px Segoe UI, sans-serif";
  ctx.fillText("HOLLOWBORN // TACTICAL SURVIVAL LOADOUT", 36, 52);

  const rawName = member.displayName || member.user.username;
  ctx.fillStyle = "#00E5FF";
  ctx.font = "600 12px Segoe UI, sans-serif";
  ctx.fillText(`GEAR LOADOUT BLUEPRINT • OPERATIVE: ${rawName.toUpperCase()}`, 36, 72);

  // 5 Gear Category Cards
  const categories = [
    {
      slot: "PRIMARY FIREARM / RANGED",
      name: loadout.primary || "Shotgun (Pompa)",
      spec: "Amunisi Buckshot / Slug • Attach: Laser Sight & Flashlight",
      color: "#00E5FF"
    },
    {
      slot: "MELEE & UTILITY WEAPON",
      name: loadout.melee || "Katana & Chainsaw",
      spec: "Serangan Cepat Tanpa Konsumsi Stamina • Pemotong Kayu Efisien",
      color: "#00E676"
    },
    {
      slot: "ESSENTIAL CAVE GEAR",
      name: loadout.gear || "Rebreather & Rope Gun & Shovel",
      spec: "Alat Selam Dalam Air, Zipline Jurang, dan Penggali Bunker",
      color: "#FFD700"
    },
    {
      slot: "ARMOR SUIT TYPE",
      name: loadout.armor || "Ancient Armor (Solafite Plated)",
      spec: "Pertahanan Tertinggi Terhadap Serangan Demon & Mutan Lava",
      color: "#FF9100"
    },
    {
      slot: "TACTICAL THROWABLE & MEDS",
      name: loadout.throwable || "Time Bomb C4 + Meds Pill",
      spec: "Peledak Mutan Sluggy & Pemulih Darah Instan",
      color: "#FF5252"
    }
  ];

  const cardStartX = 36;
  const cardStartY = 100;
  const cardW = width - 72;
  const cardH = 64;
  const cardSpacing = 72;

  categories.forEach((cat, idx) => {
    const cy = cardStartY + idx * cardSpacing;

    ctx.fillStyle = "rgba(18, 26, 42, 0.85)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(cardStartX, cy, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();

    // Color Accent Strip Left
    ctx.fillStyle = cat.color;
    ctx.beginPath();
    ctx.roundRect(cardStartX, cy, 6, cardH, [8, 0, 0, 8]);
    ctx.fill();

    // Slot Label
    ctx.fillStyle = cat.color;
    ctx.font = "bold 10px Segoe UI, sans-serif";
    ctx.fillText(`>> SLOT ${idx + 1}: ${cat.slot}`, cardStartX + 20, cy + 22);

    // Item Name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Segoe UI, sans-serif";
    ctx.fillText(cat.name, cardStartX + 20, cy + 46);

    // Spec / Notes Right
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "500 11px Segoe UI, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(cat.spec, cardStartX + cardW - 20, cy + 44);
    ctx.textAlign = "start";
  });

  // Footer Tagline
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.font = "500 11px Segoe UI, sans-serif";
  ctx.fillText("TACTICAL LOADOUT MAT • HOLLOWBORN SURVIVAL PREPARATION TERMINAL", 36, height - 16);

  return canvas.toBuffer("image/png");
}

// ==========================================
// 6. 🏆 HALL OF FAME / EXPEDITION LEADERBOARD
// ==========================================

async function generateLeaderboardCanvas(guild, topMembers = []) {
  const width = 1024;
  const height = 680;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Load Background, Avatar Frame, and Top 3 Avatars
  const [bgImg, frameImg, ...topAvatars] = await Promise.all([
    getWelcomeBgImage(),
    getWelcomeFrameImage(),
    ...topMembers.slice(0, 3).map(async m => {
      if (!m) return null;
      let img = null;
      if (m.user && typeof m.user.displayAvatarURL === "function") {
        img = await safeLoadAvatar(m.user.displayAvatarURL({ extension: "png", size: 128 }));
      }
      const cleanLbName = sanitizeCanvasText(m.displayName || (m.user ? m.user.username : "Operative"), "Operative");
      return {
        img,
        name: cleanLbName,
        score: m.totalSeconds || m.score || 0,
        shortDisplay: m.shortDisplay || "0m",
        timeDisplay: m.timeDisplay || "0 Menit",
        isLive: m.isLive || false
      };
    })
  ]);

  // 1. Deep Metallic Carbon Background
  const baseGrad = ctx.createLinearGradient(0, 0, width, height);
  baseGrad.addColorStop(0, "#040508");
  baseGrad.addColorStop(0.5, "#0a0d14");
  baseGrad.addColorStop(1, "#040508");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // Overlay Metallic Welcome Template
  if (bgImg) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.drawImage(bgImg, 0, 0, width, height);
    ctx.restore();
  }

  // Vignette & Scanlines
  const vigGrad = ctx.createRadialGradient(width / 2, height / 2, 200, width / 2, height / 2, 600);
  vigGrad.addColorStop(0, "rgba(0,0,0,0)");
  vigGrad.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle Cyan Ambient Flare from Top
  const topFlare = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, 480);
  topFlare.addColorStop(0, "rgba(56, 189, 248, 0.15)");
  topFlare.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = topFlare;
  ctx.fillRect(0, 0, width, 240);

  // Outer Border & Corner Brackets
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  const drawCornerBracket = (bx, by, xDir, yDir) => {
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, by + yDir * 18);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + xDir * 18, by);
    ctx.stroke();
  };
  drawCornerBracket(20, 20, 1, 1);
  drawCornerBracket(width - 20, 20, -1, 1);
  drawCornerBracket(20, height - 20, 1, -1);
  drawCornerBracket(width - 20, height - 20, -1, -1);

  // 2. Header
  ctx.textAlign = "start";
  ctx.fillStyle = "#38BDF8";
  ctx.font = "11px HollowBold, Segoe UI, sans-serif";
  ctx.fillText("// HOLLOWBORN TACTICAL NETWORK • OP-NET v2.4", 48, 48);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "24px HollowBold, Segoe UI, sans-serif";
  ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
  ctx.shadowBlur = 10;
  ctx.fillText("EXPEDITION HALL OF FAME", 48, 76);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#94A3B8";
  ctx.font = "11px HollowRegular, Segoe UI, sans-serif";
  ctx.fillText("TOP 10 SURVIVORS • REAL-TIME VOICE DURATION & ENGAGEMENT TRACKER", 48, 94);

  // Real-Time Sync Badge
  const syncX = width - 180;
  const syncY = 48;
  ctx.fillStyle = "rgba(34, 197, 94, 0.12)";
  ctx.strokeStyle = "#22C55E";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(syncX, syncY, 132, 24, 12);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(syncX + 14, syncY + 12, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#22C55E";
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "10px HollowBold, Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("REAL-TIME SYNC", syncX + 24, syncY + 16);

  // 3. Top 3 Podium
  const podiumLayout = [
    { rank: 2, data: topAvatars[1], x: 230, y: 195, r: 44, color: "#E2E8F0", glow: "rgba(226, 232, 240, 0.45)", title: "RANK 02 // SILVER", standH: 62 },
    { rank: 1, data: topAvatars[0], x: 512, y: 172, r: 54, color: "#FFD700", glow: "rgba(255, 215, 0, 0.6)", title: "RANK 01 // CHAMPION", standH: 72 },
    { rank: 3, data: topAvatars[2], x: 794, y: 202, r: 40, color: "#F59E0B", glow: "rgba(245, 158, 11, 0.45)", title: "RANK 03 // BRONZE", standH: 58 }
  ];

  podiumLayout.forEach(p => {
    // Ambient radial glow behind avatar
    const flare = ctx.createRadialGradient(p.x, p.y, p.r * 0.4, p.x, p.y, p.r * 2.2);
    flare.addColorStop(0, p.glow);
    flare.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (p.data && p.data.img) {
      // Circular avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(p.data.img, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);

      // Vignette inside avatar
      const innerVignette = ctx.createRadialGradient(p.x, p.y, p.r * 0.65, p.x, p.y, p.r);
      innerVignette.addColorStop(0, "rgba(0,0,0,0)");
      innerVignette.addColorStop(1, "rgba(0,0,0,0.38)");
      ctx.fillStyle = innerVignette;
      ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      ctx.restore();
    } else {
      drawFallbackAvatar(ctx, p.x, p.y, p.r, p.color);
    }

    // Frame overlay with glow
    if (frameImg) {
      const fW = Math.round(p.r * 2.8);
      const fH = Math.round(fW * (frameImg.height / frameImg.width));
      ctx.save();
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 16;
      ctx.drawImage(frameImg, p.x - fW / 2, p.y - fH / 2, fW, fH);
      ctx.restore();
    }

    // Pedestal Card Stand
    const standW = p.rank === 1 ? 210 : 180;
    const standX = p.x - standW / 2;
    const standY = p.y + p.r + 14;

    ctx.save();
    // Glass base
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.rank === 1 ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.roundRect(standX, standY, standW, p.standH, 8);
    ctx.fill();
    ctx.stroke();

    // Top neon glow line on stand
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(standX + 16, standY);
    ctx.lineTo(standX + standW - 16, standY);
    ctx.stroke();

    // Rank Title
    ctx.textAlign = "center";
    ctx.fillStyle = p.color;
    ctx.font = "10px HollowBold, Segoe UI, sans-serif";
    ctx.fillText(p.title, p.x, standY + 18);

    // Name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = (p.rank === 1 ? "16px" : "14px") + " HollowBold, Segoe UI, sans-serif";
    const nameStr = p.data && p.data.name ? p.data.name.slice(0, 16) : "_Belum Terisi_";
    ctx.fillText(nameStr, p.x, standY + 36);

    // Duration & Live tag
    ctx.fillStyle = "#38BDF8";
    ctx.font = "11px HollowBold, Segoe UI, sans-serif";
    const durStr = p.data && p.data.shortDisplay ? p.data.shortDisplay : "0m";
    const liveTag = p.data && p.data.isLive ? " • [LIVE VC]" : "";
    ctx.fillText(durStr + liveTag, p.x, standY + 52);
    ctx.restore();
  });

  // 4. Ranks 4 to 10 Table
  const tableY = 360;
  const tableW = width - 96;

  ctx.textAlign = "start";
  ctx.fillStyle = "#94A3B8";
  ctx.font = "11px HollowBold, Segoe UI, sans-serif";
  ctx.fillText("TOP VOICE SURVIVORS • PERINGKAT 04 - 10", 48, tableY);

  const subRanks = topMembers.slice(3, 10);
  const colW = (tableW - 24) / 2;

  subRanks.forEach((m, idx) => {
    const isRight = idx >= 4;
    const rowIdx = isRight ? idx - 4 : idx;
    const slotX = 48 + (isRight ? colW + 24 : 0);
    const slotY = tableY + 16 + rowIdx * 52;
    const slotH = 44;

    // Card background
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.strokeStyle = m.isLive ? "rgba(34, 197, 94, 0.45)" : "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(slotX, slotY, colW, slotH, 6);
    ctx.fill();
    ctx.stroke();

    // Rank pill box
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.roundRect(slotX + 10, slotY + 10, 32, 24, 4);
    ctx.fill();

    ctx.fillStyle = "#CBD5E1";
    ctx.font = "11px HollowBold, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("#" + (idx + 4 < 10 ? "0" : "") + (idx + 4), slotX + 26, slotY + 26);

    // Live beacon / offline dot
    ctx.beginPath();
    ctx.arc(slotX + 54, slotY + 22, 4, 0, Math.PI * 2);
    ctx.fillStyle = m.isLive ? "#22C55E" : "#64748B";
    ctx.fill();
    if (m.isLive) {
      ctx.strokeStyle = "rgba(34, 197, 94, 0.4)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Name
    ctx.textAlign = "start";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "14px HollowBold, Segoe UI, sans-serif";
    const rawName = m.displayName || (m.user ? m.user.username : "Operative");
    const name = sanitizeCanvasText(rawName, "Operative");
    ctx.fillText(name.slice(0, 16), slotX + 68, slotY + 27);

    // Duration Pill Right
    const timeBoxW = 96;
    const timeBoxX = slotX + colW - timeBoxW - 12;
    ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(timeBoxX, slotY + 10, timeBoxW, 24, 4);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#38BDF8";
    ctx.font = "11px HollowBold, Segoe UI, sans-serif";
    const durationText = m.shortDisplay || m.timeDisplay || "0m";
    ctx.fillText(durationText, timeBoxX + timeBoxW / 2, slotY + 26);
    ctx.restore();
  });

  // Slot 8 in right column (Active Comms info)
  const slot8X = 48 + colW + 24;
  const slot8Y = tableY + 16 + 3 * 52;
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.roundRect(slot8X, slot8Y, colW, 44, 6);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = "center";
  ctx.fillStyle = "#38BDF8";
  ctx.font = "11px HollowBold, Segoe UI, sans-serif";
  ctx.fillText(">> JOIN VOICE CHAT TO CLIMB THE LEADERBOARD <<", slot8X + colW / 2, slot8Y + 26);
  ctx.restore();

  // 5. Footer Tagline
  ctx.textAlign = "center";
  ctx.fillStyle = "#64748B";
  ctx.font = "10px HollowRegular, Segoe UI, sans-serif";
  ctx.fillText("HOLLOWBORN TACTICAL LEADERBOARD • BORN FROM NOTHING. UNITED AS ONE. • ENCRYPTED COMMS", width / 2, height - 16);

  return canvas.toBuffer("image/png");
}

// ==========================================
// 🗺️ TACTICAL SOTF ROADMAP HUD CANVAS
// ==========================================

function generateRoadmapCanvas(progressData) {
  const width = 920;
  const height = 440;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const steps = progressData.steps || {};
  let completedCount = 0;
  for (let i = 1; i <= 7; i++) {
    if (steps[String(i)]?.completed) completedCount++;
  }
  const percent = Math.round((completedCount / 7) * 100);

  let nextStepNum = null;
  for (let i = 1; i <= 7; i++) {
    if (!steps[String(i)]?.completed) {
      nextStepNum = i;
      break;
    }
  }

  // 1. Dark Cyber-Survival Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#080b12");
  bgGrad.addColorStop(0.5, "#0d121c");
  bgGrad.addColorStop(1, "#06080e");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Tactical Radar Grid lines
  ctx.strokeStyle = "rgba(0, 229, 255, 0.04)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Tech Frame Border
  ctx.strokeStyle = "rgba(0, 229, 255, 0.2)";
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Corner highlights
  ctx.fillStyle = "#00E5FF";
  const cornerSize = 14;
  ctx.fillRect(16, 16, cornerSize, 3);
  ctx.fillRect(16, 16, 3, cornerSize);
  ctx.fillRect(width - 16 - cornerSize, 16, cornerSize, 3);
  ctx.fillRect(width - 19, 16, 3, cornerSize);
  ctx.fillRect(16, height - 19, cornerSize, 3);
  ctx.fillRect(16, height - 16 - cornerSize, 3, cornerSize);
  ctx.fillRect(width - 16 - cornerSize, height - 19, cornerSize, 3);
  ctx.fillRect(width - 19, height - 16 - cornerSize, 3, cornerSize);

  // 4. Header Bar
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px Segoe UI, sans-serif";
  ctx.fillText("HOLLOWBORN // TACTICAL EXPEDITION RADAR", 36, 48);

  ctx.fillStyle = "#00E5FF";
  ctx.font = "600 12px Segoe UI, sans-serif";
  ctx.fillText("SONS OF THE FOREST • ISLAND STORYLINE TRACKER", 36, 68);

  // Status Pill Right
  const pillText = percent === 100 ? "GOLDEN DOOR UNLOCKED" : "EXPEDITION IN PROGRESS";
  ctx.font = "bold 11px Segoe UI, sans-serif";
  const textWidth = ctx.measureText(pillText).width;
  const pillX = width - 40 - textWidth - 28;

  ctx.fillStyle = percent === 100 ? "rgba(255, 215, 0, 0.15)" : "rgba(0, 230, 118, 0.15)";
  ctx.strokeStyle = percent === 100 ? "#FFD700" : "#00E676";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pillX, 32, textWidth + 28, 26, 13);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = percent === 100 ? "#FFD700" : "#00E676";
  ctx.beginPath();
  ctx.arc(pillX + 12, 45, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = percent === 100 ? "#FFD700" : "#00E676";
  ctx.fillText(pillText, pillX + 22, 49);

  // 5. 7-Node Story Trail (Island Waypoint Path)
  const nodeStartX = 75;
  const nodeSpacing = (width - 150) / 6;
  const nodeY = 145;

  const stepLabels = [
    "1. Rebreather",
    "2. Rope Gun",
    "3. Shovel",
    "4. Maint Card",
    "5. VIP Card",
    "6. Guest Card",
    "7. Golden Door"
  ];

  // Connecting Lines
  for (let i = 0; i < 6; i++) {
    const x1 = nodeStartX + i * nodeSpacing;
    const x2 = nodeStartX + (i + 1) * nodeSpacing;
    const isLineDone = steps[String(i + 1)]?.completed && steps[String(i + 2)]?.completed;
    const isLineActive = steps[String(i + 1)]?.completed && (i + 2 === nextStepNum);

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, nodeY);
    ctx.lineTo(x2, nodeY);

    if (isLineDone) {
      ctx.strokeStyle = "#00E676";
    } else if (isLineActive) {
      ctx.strokeStyle = "#00E5FF";
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    }
    ctx.stroke();
  }

  // Draw Nodes
  for (let i = 1; i <= 7; i++) {
    const cx = nodeStartX + (i - 1) * nodeSpacing;
    const cy = nodeY;
    const isDone = steps[String(i)]?.completed;
    const isActive = i === nextStepNum;

    // Outer glow for active target
    if (isActive) {
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 229, 255, 0.15)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.strokeStyle = "#00E5FF";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // "TARGET" Badge above active node
      ctx.fillStyle = "#00E5FF";
      ctx.beginPath();
      ctx.roundRect(cx - 24, cy - 40, 48, 16, 4);
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.font = "bold 9px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TARGET", cx, cy - 28);
      ctx.textAlign = "start";
    }

    // Node Circle
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    if (isDone) {
      ctx.fillStyle = "#00E676";
      ctx.fill();
    } else if (isActive) {
      ctx.fillStyle = "#0a1926";
      ctx.fill();
      ctx.strokeStyle = "#00E5FF";
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.fillStyle = "#141a24";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Node Icon/Number
    ctx.textAlign = "center";
    if (isDone) {
      // Draw crisp vector checkmark path (no missing unicode tofu box)
      ctx.strokeStyle = "#081018";
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy);
      ctx.lineTo(cx - 1, cy + 4);
      ctx.lineTo(cx + 6, cy - 4);
      ctx.stroke();
    } else {
      ctx.fillStyle = isActive ? "#00E5FF" : "rgba(255, 255, 255, 0.5)";
      ctx.font = "bold 12px Segoe UI, sans-serif";
      ctx.fillText(String(i), cx, cy + 4);
    }

    // Label below node
    ctx.font = isActive ? "bold 11px Segoe UI, sans-serif" : "500 10px Segoe UI, sans-serif";
    ctx.fillStyle = isDone ? "#00E676" : (isActive ? "#00E5FF" : "rgba(255, 255, 255, 0.45)");
    ctx.fillText(stepLabels[i - 1], cx, cy + 34);
    ctx.textAlign = "start";
  }

  // 6. Lower Dashboard Box
  const boxY = 225;
  const boxHeight = 175;

  // Left Card: Current Objective
  const leftW = 470;
  ctx.fillStyle = "rgba(18, 24, 38, 0.85)";
  ctx.strokeStyle = nextStepNum ? "rgba(0, 229, 255, 0.3)" : "rgba(255, 215, 0, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(36, boxY, leftW, boxHeight, 10);
  ctx.fill();
  ctx.stroke();

  // Left Card Header
  ctx.fillStyle = nextStepNum ? "#00E5FF" : "#FFD700";
  ctx.font = "bold 13px Segoe UI, sans-serif";
  ctx.fillText(nextStepNum ? ">> TARGET MISI AKTIF BERIKUTNYA" : ">> STATUS AKHIR MISI PULAU", 54, boxY + 30);

  if (nextStepNum) {
    const nextTitles = [
      "Tahap 1: Ambil Rebreather (Alat Selam)",
      "Tahap 2: Ambil Rope Gun (Zipline)",
      "Tahap 3: Ambil Shovel (Sekop Utama)",
      "Tahap 4: Ambil Maintenance Keycard",
      "Tahap 5: Ambil VIP Keycard & Shotgun",
      "Tahap 6: Ambil Guest Keycard, Chainsaw & Katana",
      "Tahap 7: Ancient Armor & Pintu Emas Tamat"
    ];
    const nextLocs = [
      "Gua Pantai Utara (Tanpa syarat khusus)",
      "Gua Barat Daya (Bawa peledak C4/Time Bomb)",
      "Gua Salju Tengah (Wajib bawa Rebreather & Rope Gun)",
      "Maintenance Bunker A (Gali tanah dengan Sekop)",
      "Food & Dining Bunker Barat (Gunakan Maint Card)",
      "Entertainment Bunker Timur (Gunakan VIP Card)",
      "Luxury Bunker / Lava Cave Tenggara"
    ];

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Segoe UI, sans-serif";
    ctx.fillText(nextTitles[nextStepNum - 1], 54, boxY + 62);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "500 12px Segoe UI, sans-serif";
    ctx.fillText("LOKASI: " + nextLocs[nextStepNum - 1], 54, boxY + 92);

    ctx.fillStyle = "#00E676";
    ctx.font = "600 12px Segoe UI, sans-serif";
    ctx.fillText("PETUNJUK: Klik tombol [Trik Target] di Discord untuk rahasia gua!", 54, boxY + 120);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "11px Segoe UI, sans-serif";
    ctx.fillText("Tekan tombol nomor di Discord untuk mencentang tahap ini.", 54, boxY + 148);
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 17px Segoe UI, sans-serif";
    ctx.fillText(">> EKSPEDISI SELESAI: 7/7 TAHAP TUNTAS", 54, boxY + 65);

    ctx.fillStyle = "#00E676";
    ctx.font = "600 13px Segoe UI, sans-serif";
    ctx.fillText("Pintu Tangan Emas & Gua Lava Terbuka!", 54, boxY + 95);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "12px Segoe UI, sans-serif";
    ctx.fillText("Kalian telah menguasai seluruh pulau dan siap menamatkan Sons of The Forest.", 54, boxY + 125);
  }

  // Right Card: Completion Progress
  const rightX = 36 + leftW + 18;
  const rightW = width - rightX - 36;
  ctx.fillStyle = "rgba(18, 24, 38, 0.85)";
  ctx.strokeStyle = "rgba(0, 230, 118, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rightX, boxY, rightW, boxHeight, 10);
  ctx.fill();
  ctx.stroke();

  // Progress Title & Big Percent
  ctx.fillStyle = "#CBD5E1";
  ctx.font = "bold 12px Segoe UI, sans-serif";
  ctx.fillText("PROGRES CERITA PULAU", rightX + 20, boxY + 30);

  ctx.fillStyle = percent === 100 ? "#FFD700" : "#00E676";
  ctx.font = "bold 28px Segoe UI, sans-serif";
  ctx.fillText(percent + "%", rightX + rightW - 75, boxY + 36);

  // Modern Glowing Progress Bar
  const pBarX = rightX + 20;
  const pBarY = boxY + 54;
  const pBarW = rightW - 40;
  const pBarH = 16;

  // Background Bar
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.roundRect(pBarX, pBarY, pBarW, pBarH, 8);
  ctx.fill();

  // Fill Bar
  if (percent > 0) {
    const fillW = Math.max(16, (pBarW * percent) / 100);
    const barGrad = ctx.createLinearGradient(pBarX, 0, pBarX + fillW, 0);
    barGrad.addColorStop(0, "#00E676");
    barGrad.addColorStop(1, "#00E5FF");

    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(pBarX, pBarY, fillW, pBarH, 8);
    ctx.fill();
  }

  // Stats Text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 13px Segoe UI, sans-serif";
  ctx.fillText(`${completedCount} dari 7 Tahap Selesai`, rightX + 20, boxY + 98);

  // Last Activity
  let lastInfo = "Belum ada aktivitas tercatat.";
  let lastCompletedStep = null;
  for (let i = 7; i >= 1; i--) {
    if (steps[String(i)]?.completed && steps[String(i)]?.completedBy) {
      lastCompletedStep = i;
      break;
    }
  }

  if (lastCompletedStep) {
    const s = steps[String(lastCompletedStep)];
    const rawWho = s.completedBy ? s.completedBy.split("#")[0] : "Survivor";
    const who = sanitizeCanvasText(rawWho, "Survivor");
    lastInfo = `Tahap ${lastCompletedStep} dicentang oleh ${who}`;
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "500 11px Segoe UI, sans-serif";
  ctx.fillText("STATUS LOG TERAKHIR:", rightX + 20, boxY + 128);

  ctx.fillStyle = "#00E5FF";
  ctx.font = "600 12px Segoe UI, sans-serif";
  ctx.fillText(lastInfo, rightX + 20, boxY + 148);

  return canvas.toBuffer("image/png");
}

module.exports = {
  sanitizeCanvasText,
  generateWelcomeCanvas,
  generateProfileCanvas,
  generateIslandRadarCanvas,
  generateMabarTicketCanvas,
  generateLoadoutCanvas,
  generateLeaderboardCanvas,
  generateRoadmapCanvas
};


