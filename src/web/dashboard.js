const http = require("http");
const { SURVIVAL_TIPS } = require("../config/sotf-tips");
const { SOTF_ITEMS } = require("../config/sotf-items");
const { SOTF_ROADMAP } = require("../config/sotf-roadmap");
const { COMMANDS_REGISTRY } = require("../config/commands-registry");
const { loadRoadmapProgress } = require("../storage/roadmapStorage");
const { loadBasesData, BASE_TYPES } = require("../storage/baseStorage");
const { mabarSessions } = require("../utils/mabarManager");
const { formatUptime } = require("../utils/helpers");

const PORT = process.env.PORT || 3000;

function startDashboard(client) {
  const webServer = http.createServer((req, res) => {
    // REST API Endpoints
    if (req.url === "/api/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      const guild = client.guilds.cache.get(process.env.GUILD_ID);
      return res.end(JSON.stringify({
        status: "online",
        bot: client.user ? client.user.tag : "connecting",
        uptime: formatUptime(process.uptime()),
        guild: guild ? { name: guild.name, members: guild.memberCount, roles: guild.roles.cache.size } : null,
        mabarCount: mabarSessions.size
      }));
    }

    if (req.url === "/api/tips") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(SURVIVAL_TIPS));
    }

    if (req.url === "/api/items") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(SOTF_ITEMS));
    }

    if (req.url === "/api/roadmap") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        roadmap: SOTF_ROADMAP,
        progress: loadRoadmapProgress()
      }));
    }

    if (req.url === "/api/bases") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(loadBasesData()));
    }

    // HTML Dashboard
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const guildName = guild ? guild.name : "HOLLOWBORN (SOF)";
    const memberCount = guild ? guild.memberCount : "-";
    const roleCount = guild ? guild.roles.cache.size : 29;
    const botTag = client.user ? client.user.tag : "hollowborn#9457";
    const ping = client.ws.ping >= 0 ? `${client.ws.ping}ms` : "Active";
    const uptime = formatUptime(process.uptime());

    // Mabar List HTML
    let mabarHtml = "";
    if (mabarSessions.size === 0) {
      mabarHtml = '<div class="empty-state">Belum ada sesi mabar yang aktif saat ini. Buat dengan <code>!mabar</code> di Discord!</div>';
    } else {
      for (const [id, s] of mabarSessions.entries()) {
        mabarHtml += `
          <div class="mabar-card">
            <div class="mabar-header">
              <span class="mabar-game">🎮 ${s.game}</span>
              <span class="mabar-badge">${s.attendees.size} Pemain Siap</span>
            </div>
            <div class="mabar-body">
              <div>⏱️ Waktu: <b>${s.targetTime.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</b></div>
              <div>📝 Catatan: ${s.note || "Mabar santai HOLLOWBORN"}</div>
            </div>
          </div>
        `;
      }
    }

    // Commands Table
    let cmdRows = "";
    for (const cmd of COMMANDS_REGISTRY) {
      cmdRows += `
        <tr>
          <td><code>${cmd.name}</code></td>
          <td><b>${cmd.title}</b></td>
          <td>${cmd.description}</td>
          <td><span class="perm-badge">${cmd.permission}</span></td>
        </tr>
      `;
    }

    // Tips Cards HTML
    let tipsCardsHtml = "";
    for (const t of SURVIVAL_TIPS) {
      tipsCardsHtml += `
        <div class="tip-card" data-cat="${t.category}">
          <div class="tip-header">
            <span class="tip-cat-badge">${t.categoryName}</span>
          </div>
          <h3 class="tip-title">${t.title}</h3>
          <p class="tip-content">${t.content}</p>
          <div class="tip-protip">💡 <b>Pro Tip:</b> ${t.proTip}</div>
        </div>
      `;
    }

    // Items Cards HTML
    let itemCardsHtml = "";
    for (const it of SOTF_ITEMS) {
      itemCardsHtml += `
        <div class="item-card">
          <div class="item-header">
            <span class="item-name">${it.name}</span>
            <span class="item-cat-badge">${it.category}</span>
          </div>
          <p class="item-desc">${it.description}</p>
          <div class="item-meta">
            <div>📍 <b>Lokasi:</b> ${it.location}</div>
            <div>⚠️ <b>Syarat Wajib:</b> ${it.prerequisites}</div>
            <div>🧟 <b>Musuh:</b> ${it.threats}</div>
            <div class="item-tip">💡 <b>Trik:</b> ${it.proTips}</div>
          </div>
        </div>
      `;
    }

    // Roadmap Steps HTML with live progress
    const rmProgress = loadRoadmapProgress();
    const rmSteps = rmProgress.steps || {};
    let rmCompletedCount = 0;
    for (let i = 1; i <= 7; i++) {
      if (rmSteps[String(i)]?.completed) rmCompletedCount++;
    }
    const rmPercent = Math.round((rmCompletedCount / 7) * 100);

    let rmNextStep = null;
    for (let i = 1; i <= 7; i++) {
      if (!rmSteps[String(i)]?.completed) {
        rmNextStep = i;
        break;
      }
    }

    let roadmapHtml = "";
    for (const rm of SOTF_ROADMAP) {
      const s = rmSteps[String(rm.step)];
      const isDone = s?.completed;
      const isNext = rm.step === rmNextStep;

      let badgeClass = "badge-locked";
      let badgeText = "🔒 Terkunci";
      if (isDone) {
        badgeClass = "badge-done";
        badgeText = `✅ Selesai (${s.completedBy ? s.completedBy.split("#")[0] : "Survivor"})`;
      } else if (isNext) {
        badgeClass = "badge-active";
        badgeText = "🎯 Target Sekarang";
      }

      roadmapHtml += `
        <div class="roadmap-step ${isDone ? 'step-completed' : (isNext ? 'step-current' : '')}">
          <div class="step-badge ${isDone ? 'badge-step-done' : ''}">${rm.icon} Tahap ${rm.step}</div>
          <div class="step-body">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <h3 class="step-title" style="margin:0;">${rm.title}</h3>
              <span class="step-status ${badgeClass}">${badgeText}</span>
            </div>
            <div class="step-meta" style="margin-top:10px;">
              <div>📍 <b>Lokasi:</b> ${rm.location}</div>
              <div>⚠️ <b>Syarat Wajib:</b> ${rm.prerequisite}</div>
              <div>🔓 <b>Hasil Terbuka:</b> <span class="step-unlock">${rm.unlocks}</span></div>
            </div>
          </div>
        </div>
      `;
    }

    // Bases Cards HTML
    const allBases = loadBasesData();
    let basesCardsHtml = "";
    if (allBases.length === 0) {
      basesCardsHtml = '<div class="empty-state">Belum ada titik base yang didaftarkan. Gunakan <code>!base add</code> di Discord untuk mendaftarkan markas tim!</div>';
    } else {
      for (const b of allBases) {
        const typeInfo = BASE_TYPES[b.type] || { name: b.typeName || "Base", emoji: "📍" };
        basesCardsHtml += `
          <div class="item-card" style="border-top-color: #00E5FF;">
            <div class="item-header">
              <span class="item-name">${typeInfo.emoji} ${b.name}</span>
              <span class="item-cat-badge" style="background: rgba(0, 229, 255, 0.15); color: #00E5FF;">${typeInfo.name}</span>
            </div>
            <div class="item-meta">
              <div>📍 <b>Lokasi:</b> ${b.location}</div>
              <div>🧭 <b>Koordinat:</b> <code>${b.coords || "GPS Map"}</code></div>
              <div>🛠️ <b>Fasilitas:</b> ${b.notes || "Tidak ada catatan khusus."}</div>
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; color: var(--text-muted);">Oleh: <b>${b.addedBy || "Survivor"}</b></span>
                <a href="${b.mapUrl || 'https://mapgenie.io/sons-of-the-forest/maps/world'}" target="_blank" style="font-size: 12px; color: var(--cyan); text-decoration: none; font-weight: 600;">🗺️ Buka Peta SOTF &rarr;</a>
              </div>
            </div>
          </div>
        `;
      }
    }

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HOLLOWBORN — Survival Hub & Bot Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090a0f;
      --card-bg: #12141c;
      --card-border: #1e2233;
      --accent: #FF1744;
      --accent-glow: rgba(255, 23, 68, 0.25);
      --green: #00E676;
      --cyan: #00E5FF;
      --gold: #FFD700;
      --text: #F0F2F8;
      --text-muted: #8B949E;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(255, 23, 68, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(0, 229, 255, 0.06) 0%, transparent 40%);
    }
    .container { max-width: 1140px; margin: 0 auto; padding: 32px 20px; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-icon {
      font-size: 32px;
      background: linear-gradient(135deg, #FF1744, #FF5252);
      border-radius: 12px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px var(--accent-glow);
    }
    .brand h1 { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .brand p { font-size: 13px; color: var(--text-muted); }
    .status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(0, 230, 118, 0.08);
      border: 1px solid rgba(0, 230, 118, 0.3);
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      color: var(--green);
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--green);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--green);
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }

    /* Navigation Tabs */
    .tabs-nav {
      display: flex;
      gap: 8px;
      margin-bottom: 28px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 12px;
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .tab-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.04); }
    .tab-btn.active {
      color: #fff;
      background: var(--card-bg);
      border-color: var(--accent);
      box-shadow: 0 4px 16px var(--accent-glow);
    }

    .tab-pane { display: none; }
    .tab-pane.active { display: block; animation: fadeIn 0.25s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 20px;
      transition: transform 0.2s, border-color 0.2s;
    }
    .stat-card:hover { transform: translateY(-2px); border-color: rgba(255, 23, 68, 0.4); }
    .stat-label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 24px; font-weight: 800; color: #fff; margin-top: 6px; }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mabar-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 36px;
    }
    .mabar-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      border-left: 4px solid var(--cyan);
    }
    .mabar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .mabar-game { font-weight: 700; color: #fff; font-size: 15px; }
    .mabar-badge { background: rgba(0, 229, 255, 0.12); color: var(--cyan); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .mabar-body { font-size: 13px; color: var(--text-muted); }
    .empty-state {
      background: var(--card-bg);
      border: 1px dashed var(--card-border);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
      margin-bottom: 36px;
    }
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      overflow-x: auto;
      margin-bottom: 32px;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
    th { padding: 14px 18px; background: rgba(255, 255, 255, 0.02); color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--card-border); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 14px 18px; border-bottom: 1px solid var(--card-border); }
    tr:last-child td { border-bottom: none; }
    code { background: rgba(255, 255, 255, 0.06); padding: 3px 8px; border-radius: 6px; font-family: monospace; color: #FF80AB; font-size: 13px; }
    .perm-badge { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); padding: 3px 8px; border-radius: 4px; font-size: 12px; }

    /* Tips Cards */
    .tips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 18px;
    }
    .tip-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 20px;
      transition: transform 0.2s, border-color 0.2s;
    }
    .tip-card:hover { transform: translateY(-2px); border-color: rgba(0, 230, 118, 0.4); }
    .tip-cat-badge {
      display: inline-block;
      background: rgba(0, 230, 118, 0.12);
      color: var(--green);
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .tip-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .tip-content { font-size: 14px; color: #CBD5E1; line-height: 1.6; margin-bottom: 12px; }
    .tip-protip {
      background: rgba(255, 255, 255, 0.03);
      border-left: 3px solid var(--gold);
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #F1F5F9;
    }

    /* Items Cards */
    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
      gap: 18px;
    }
    .item-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 20px;
      border-top: 3px solid var(--cyan);
      transition: transform 0.2s, border-color 0.2s;
    }
    .item-card:hover { transform: translateY(-2px); border-color: var(--cyan); }
    .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .item-name { font-size: 16px; font-weight: 800; color: #fff; }
    .item-cat-badge { background: rgba(0, 229, 255, 0.12); color: var(--cyan); padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .item-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 14px; }
    .item-meta { font-size: 13px; color: #E2E8F0; display: flex; flex-direction: column; gap: 6px; }
    .item-tip { margin-top: 6px; padding: 8px 12px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; color: #F8FAFC; }

    /* Roadmap Timeline */
    .roadmap-timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .roadmap-step {
      display: flex;
      gap: 18px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 20px;
      align-items: flex-start;
      border-left: 4px solid var(--gold);
    }
    .step-badge {
      background: rgba(255, 215, 0, 0.12);
      color: var(--gold);
      font-size: 13px;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: 10px;
      white-space: nowrap;
    }
    .step-body { flex: 1; }
    .step-title { font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .step-meta { font-size: 14px; color: #CBD5E1; display: flex; flex-direction: column; gap: 4px; }
    .step-unlock { color: var(--green); font-weight: 600; }

    /* Roadmap Summary Box & Progress */
    .roadmap-summary-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
      border-left: 4px solid var(--green);
    }
    .progress-bar-container {
      width: 100%;
      height: 12px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #00E676, #00E5FF);
      border-radius: 999px;
      transition: width 0.4s ease;
    }
    .step-status {
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 8px;
    }
    .badge-done {
      background: rgba(0, 230, 118, 0.15);
      color: var(--green);
      border: 1px solid rgba(0, 230, 118, 0.3);
    }
    .badge-active {
      background: rgba(0, 229, 255, 0.15);
      color: var(--cyan);
      border: 1px solid rgba(0, 229, 255, 0.3);
      animation: pulse 2s infinite;
    }
    .badge-locked {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .step-completed {
      border-left-color: var(--green) !important;
      opacity: 0.85;
    }
    .step-current {
      border-left-color: var(--cyan) !important;
      box-shadow: 0 0 15px rgba(0, 229, 255, 0.1);
    }
    .badge-step-done {
      background: rgba(0, 230, 118, 0.15) !important;
      color: var(--green) !important;
    }
    @keyframes pulse {
      0% { opacity: 0.8; }
      50% { opacity: 1; }
      100% { opacity: 0.8; }
    }

    .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 32px; }
    .btn {
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary { background: var(--accent); color: #fff; box-shadow: 0 4px 16px var(--accent-glow); }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-secondary { background: var(--card-bg); border: 1px solid var(--card-border); color: var(--text); }
    .btn-secondary:hover { border-color: rgba(255, 255, 255, 0.2); }
    footer { text-align: center; font-size: 13px; color: var(--text-muted); padding-top: 24px; border-top: 1px solid var(--card-border); margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-icon">🌲</div>
        <div>
          <h1>HOLLOWBORN SURVIVAL HUB</h1>
          <p>Sons of the Forest Guide & Discord Bot Dashboard</p>
        </div>
      </div>
      <div class="status-pill">
        <div class="pulse-dot"></div>
        <span>${botTag} • ONLINE</span>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <nav class="tabs-nav">
      <button class="tab-btn active" onclick="switchTab('overview')">📊 Overview & Mabar</button>
      <button class="tab-btn" onclick="switchTab('tips')">💡 Survival Tips (${SURVIVAL_TIPS.length})</button>
      <button class="tab-btn" onclick="switchTab('items')">🗺️ Senjata & Item Kunci (${SOTF_ITEMS.length})</button>
      <button class="tab-btn" onclick="switchTab('roadmap')">📋 Roadmap Tamat (${SOTF_ROADMAP.length} Tahap)</button>
      <button class="tab-btn" onclick="switchTab('bases')">📍 Base & Markers (${allBases.length})</button>
    </nav>

    <!-- TAB 1: OVERVIEW -->
    <div id="tab-overview" class="tab-pane active">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Server Discord</div>
          <div class="stat-value">${guildName}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Anggota</div>
          <div class="stat-value">${memberCount} Survivor</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Role Server</div>
          <div class="stat-value">${roleCount} Role</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ping / Uptime</div>
          <div class="stat-value" style="font-size: 18px;">${ping} • ${uptime}</div>
        </div>
      </div>

      <div class="actions">
        <a class="btn btn-primary" href="https://discord.com/oauth2/authorize?client_id=1567385134674477186&scope=bot%20applications.commands&permissions=268454912" target="_blank">
          ➕ Invite Bot ke Server
        </a>
        <a class="btn btn-secondary" href="https://discord.com/channels/1566751263260151808" target="_blank">
          💬 Buka Server HOLLOWBORN
        </a>
      </div>

      <div class="section-title">🎮 Sesi Mabar Aktif (${mabarSessions.size})</div>
      <div class="mabar-list">
        ${mabarHtml}
      </div>

      <div class="section-title">📋 Daftar Perintah Bot Aktif (${COMMANDS_REGISTRY.length})</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Perintah</th>
              <th>Judul Fitur</th>
              <th>Deskripsi</th>
              <th>Hak Izin</th>
            </tr>
          </thead>
          <tbody>
            ${cmdRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: SURVIVAL TIPS -->
    <div id="tab-tips" class="tab-pane">
      <div class="section-title">💡 Ensiklopedia Tips Bertahan Hidup Sons of The Forest</div>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Koleksi strategi rahasia mengelola base, melatih Virginia, perintah Kelvin, dan trik musim salju.</p>
      <div class="tips-grid">
        ${tipsCardsHtml}
      </div>
    </div>

    <!-- TAB 3: ITEMS DATABASE -->
    <div id="tab-items" class="tab-pane">
      <div class="section-title">🗺️ Lokasi Senjata & Item Penting Pulau SOTF</div>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Panduan syarat wajib dan bahaya musuh sebelum menjelajahi gua atau bunker.</p>
      <div class="items-grid">
        ${itemCardsHtml}
      </div>
    </div>

    <!-- TAB 4: STORY ROADMAP -->
    <div id="tab-roadmap" class="tab-pane">
      <div class="section-title">📋 Urutan Tahapan Tamat Cerita Sons of The Forest</div>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Ikuti 7 langkah resmi ini agar tidak terhalang pintu terkunci atau gua berair dalam.</p>

      <div class="roadmap-summary-box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:10px;">
          <div>
            <span style="font-weight: 800; font-size: 16px; color: #fff;">📊 Status Progres Pulau Bersama</span>
            <span style="color: var(--text-muted); font-size: 13px; margin-left: 8px;">(${rmCompletedCount}/7 Tahap Selesai)</span>
          </div>
          <div style="font-weight: 800; font-size: 18px; color: ${rmPercent === 100 ? 'var(--gold)' : 'var(--green)'};">${rmPercent}%</div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${rmPercent}%;"></div>
        </div>
        <div style="margin-top: 10px; font-size: 13px; color: var(--text-muted);">
          ${rmPercent === 100
      ? '👑 <b>Semua tahapan tamat selesai!</b> Pintu emas siap dibuka!'
      : `🎯 <b>Target sekarang:</b> Tahap ${rmNextStep}: ${SOTF_ROADMAP[rmNextStep - 1].title}`}
        </div>
      </div>

      <div class="roadmap-timeline">
        ${roadmapHtml}
      </div>
    </div>

    <!-- TAB 5: BASES & ISLAND MARKERS -->
    <div id="tab-bases" class="tab-pane">
      <div class="section-title">📍 Direktori Base Camp & Titik Penting Pulau</div>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Lacak markas utama, perkemahan darurat lereng salju, jaringan zipline, dan tempat parkir hang glider tim HOLLOWBORN. Tambahkan titik baru lewat bot Discord dengan <code>!base add</code> atau <code>/base add</code>!</p>
      <div class="items-grid">
        ${basesCardsHtml}
      </div>
    </div>

    <footer>
      HOLLOWBORN • Born in the Dark. Forged by Survival.
    </footer>
  </div>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      
      const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
      if (targetBtn) targetBtn.classList.add('active');
      
      const targetPane = document.getElementById('tab-' + tabId);
      if (targetPane) targetPane.classList.add('active');
    }
  </script>
</body>
</html>`;

    res.end(html);
  });

  webServer.listen(PORT, () => {
    console.log(`Web Dashboard HOLLOWBORN berjalan di http://localhost:${PORT}`);
  });

  return webServer;
}

module.exports = {
  startDashboard
};

