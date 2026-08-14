/* Apobase 2.0 — app: shared chrome, theme, search, calculators, palette */
(function () {
  const D = APOBASE;

  // ---------- theme switcher (light/dark, persisted) ----------
  function initTheme() {
    const root = document.documentElement;
    let theme = localStorage.getItem("apobase-theme");
    if (!theme) theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(theme);
  }
  function applyTheme(t) {
    const root = document.documentElement;
    if (t === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    localStorage.setItem("apobase-theme", t);
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
  }

  // ---------- shared header/footer injection ----------
  function injectChrome(active) {
    const nav = [
      ["Hub", "index.html"],
      ["Fristen", "fristen.html"],
      ["Notfall", "notfall.html"],
      ["Rechner", "rechner.html"],
      ["Schlau im HV", "schlau-im-hv.html"],
      ["Themen", "index.html#themen"],
    ];
    const navHtml = nav
      .map(([t, u]) => `<a href="${u}" class="${active === u ? "active" : ""}">${t}</a>`)
      .join("");
    const header = document.getElementById("site-header");
    if (header) {
      header.innerHTML = `
        <div class="container header-inner">
          <button class="nav-toggle" id="nav-toggle" aria-label="Menü öffnen" aria-expanded="false">☰</button>
          <a class="brand" href="index.html"><span class="dot"></span>Apobase <small>Apotheken-Info-Terminal</small></a>
          <nav class="main-nav" id="main-nav">${navHtml}</nav>
          <div class="header-actions">
            <button class="icon-btn" id="cmd-palette-btn" title="Schnelle Suche (Cmd+K oder /)" aria-label="Schnelle Suche">⌘<span class="kbd-hint" style="margin-left:2px">K</span></button>
            <button class="icon-btn" id="theme-toggle" title="Tag/Nacht-Modus" aria-label="Tag/Nacht-Modus umschalten">🌙</button>
          </div>
        </div>`;
      applyTheme(localStorage.getItem("apobase-theme") || "light");
      document.getElementById("cmd-palette-btn").addEventListener("click", openPalette);
      document.getElementById("theme-toggle").addEventListener("click", () => {
        applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
      });
      const tog = document.getElementById("nav-toggle");
      const navEl = document.getElementById("main-nav");
      tog.addEventListener("click", () => {
        const open = navEl.classList.toggle("open");
        tog.setAttribute("aria-expanded", open ? "true" : "false");
        tog.textContent = open ? "✕" : "☰";
      });
      navEl.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
        navEl.classList.remove("open");
        tog.setAttribute("aria-expanded", "false");
        tog.textContent = "☰";
      }));
    }
    const footer = document.getElementById("site-footer");
    if (footer) {
      footer.innerHTML = `
        <div class="container row">
          <div>© 2026 Apobase — Info-Terminal für kompetente Beratung in der Apotheke</div>
          <div class="row">
            <a href="impressum.html">Impressum</a>
            <a href="impressum.html#datenschutz">Datenschutz</a>
            <span>Kein Ersatz für fachliche Prüfung. Angaben ohne Gewähr.</span>
          </div>
        </div>`;
    }
  }

  // ---------- command palette (Cmd+K / /) ----------
  let paletteEl = null, palItems = [], palIdx = -1, palInput = null, palCat = {};

  function buildPaletteIndex() {
    const items = [];
    const cat = (c) => ({ c });
    D.tiles.forEach((t) => items.push({ icon: t.i || "📄", label: t.t, sub: t.tag || "Thema", url: t.u, cat: "📋 Themen & A–Z" }));
    D.quick.forEach((q) => items.push({ icon: "⏳", label: q.v + " — " + q.k, sub: q.s || "", url: q.u || "index.html", cat: "⏳ Fristen" }));
    (D.searchIndex || []).forEach((s) => {
      if (s.t && s.u) items.push({ icon: "⚖️", label: s.t, sub: (s.d || "").slice(0, 60), url: s.u, cat: "📋 Themen & A–Z" });
    });
    // dedupe by url+label
    const seen = new Set();
    const out = [];
    items.forEach((i) => {
      const k = i.url + "|" + i.label;
      if (!seen.has(k)) { seen.add(k); out.push(i); }
    });
    return out;
  }

  function openPalette() {
    if (!paletteEl) {
      paletteEl = document.createElement("div");
      paletteEl.className = "cmd-backdrop";
      paletteEl.innerHTML = `
        <div class="cmd-palette" role="dialog" aria-modal="true" aria-label="Schnelle Suche">
          <div class="cmd-input-wrap"><span class="ico">🔍</span><input class="cmd-input" placeholder="Suchen… Fristen, Paragrafen, Rechner, Giftnotruf" aria-label="Suchen"></div>
          <div class="cmd-groups"></div>
        </div>`;
      document.body.appendChild(paletteEl);
      palInput = paletteEl.querySelector(".cmd-input");
      paletteEl.addEventListener("click", (e) => { if (e.target === paletteEl) closePalette(); });
      palInput.addEventListener("input", renderPalette);
      palInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closePalette();
        else if (e.key === "ArrowDown") { e.preventDefault(); movePal(1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); movePal(-1); }
        else if (e.key === "Enter") { e.preventDefault(); if (palIdx >= 0 && palItems[palIdx]) location.href = palItems[palIdx].url; }
      });
    }
    paletteEl.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    renderPalette();
    palInput.value = "";
    setTimeout(() => palInput.focus(), 30);
  }
  function closePalette() {
    if (paletteEl) { paletteEl.classList.add("hidden"); document.body.style.overflow = ""; }
  }
  function renderPalette() {
    if (!paletteEl) return;
    const q = palInput.value.trim().toLowerCase();
    const all = buildPaletteIndex();
    palItems = q ? all.filter((i) => (i.label + " " + i.sub + " " + i.cat).toLowerCase().includes(q)).slice(0, 30) : all.slice(0, 24);
    palIdx = -1;
    const groupsEl = paletteEl.querySelector(".cmd-groups");
    if (!palItems.length) {
      groupsEl.innerHTML = `<div class="cmd-empty">Keine Treffer für „${esc(q)}“</div>`;
      return;
    }
    // group by cat
    const groups = {};
    palItems.forEach((i) => { (groups[i.cat] = groups[i.cat] || []).push(i); });
    groupsEl.innerHTML = Object.keys(groups).map((c) => `
      <div class="cmd-group-label">${c}</div>
      ${groups[c].map((i, idx) => `<div class="cmd-item" data-i="${idx}"><span class="ci-ico">${i.icon}</span><span>${esc(i.label)}</span><span class="ci-sub">${esc(i.sub)}</span></div>`).join("")}
    `).join("");
    groupsEl.querySelectorAll(".cmd-item").forEach((el) => {
      el.addEventListener("click", () => { location.href = palItems[parseInt(el.dataset.i, 10)].url; });
      el.addEventListener("mouseenter", () => setPal(parseInt(el.dataset.i, 10)));
    });
  }
  function setPal(i) {
    palIdx = i;
    paletteEl.querySelectorAll(".cmd-item").forEach((el, idx) => el.classList.toggle("active", idx === i));
  }
  function movePal(d) {
    if (!palItems.length) return;
    setPal((palIdx + d + palItems.length) % palItems.length);
  }

  // ---------- citation copy (Faktenbox 2.0) ----------
  function initCiteCopy() {
    document.querySelectorAll(".src-badge, .fb-badge").forEach((el) => {
      if (el.querySelector(".copy-cite")) return;
      const text = el.textContent.trim().replace(/^(✅|🟡|⚠️)\s*/, "").replace(/^\s*Stand[^·]*·?\s*/, "").slice(0, 90);
      if (!text || text.length < 4) return;
      const btn = document.createElement("button");
      btn.className = "copy-cite";
      btn.textContent = "⧉ zitieren";
      btn.title = "Rechtsquelle kopieren";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = "✓ kopiert";
          btn.classList.add("copied");
          setTimeout(() => { btn.textContent = "⧉ zitieren"; btn.classList.remove("copied"); }, 1500);
        }).catch(() => {});
      });
      el.appendChild(btn);
    });
  }

  // ---------- print per Faktenbox (HV reference cards) ----------
  function initFaktenboxPrint() {
    document.querySelectorAll(".faktenbox").forEach((box) => {
      if (box.querySelector(".fb-print")) return;
      const btn = document.createElement("button");
      btn.className = "fb-print";
      btn.textContent = "🖨 Drucken";
      btn.title = "Faktenbox als Zettel drucken";
      btn.addEventListener("click", () => {
        const clone = box.cloneNode(true);
        const style = document.createElement("style");
        style.textContent =
          "@media print { body * { visibility: hidden; } .fb-print-solo, .fb-print-solo * { visibility: visible; } .fb-print-solo { position: absolute; left: 0; top: 0; width: 100%; } }";
        clone.classList.add("fb-print-solo");
        document.body.appendChild(style);
        document.body.appendChild(clone);
        window.print();
        document.body.removeChild(style);
        document.body.removeChild(clone);
      });
      box.appendChild(btn);
    });
  }

  // ---------- hub: tiles ----------
  const ICONS = {
    "🩺": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M3 4h3l2 7 3-6 2 6 2-7h3"/><path d="M12 11v6M9 14h6"/></svg>',
    "📅": '<svg class="tile-svg" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
    "🚨": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M12 3 2 20h20L12 3z"/><path d="M12 9v5M12 17h.01"/></svg>',
    "🧮": '<svg class="tile-svg" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 15h.01M12 15h.01M15 15h.01M9 18h.01M12 18h.01M15 18h.01"/></svg>',
    "💡": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/></svg>',
    "⚖️": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M12 3v18M8 21h8M6 7h12M6 7l-3 5a3 3 0 0 0 6 0L6 7zM18 7l-3 5a3 3 0 0 0 6 0l-3-5z"/></svg>',
    "🌿": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M12 21c0-6 3-11 9-13 1 7-3 12-9 13z"/><path d="M12 21c0-5-2-9-7-11 0 6 3 10 7 11z"/></svg>',
    "🖥️": '<svg class="tile-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    "📦": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
    "🛡️": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
    "🔍": '<svg class="tile-svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>',
    "💊": '<svg class="tile-svg" viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="18" rx="3"/><path d="M8 10h8"/></svg>',
    "🔁": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>',
    "💉": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M6 3v8l6 6V9l-6-6zM6 7h6M9 3v4"/><path d="M12 17l3-3M18 7l3 3-8 8h-3"/></svg>',
    "✈️": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M10 13 3 10l3-2 7 2 4-4a1.5 1.5 0 0 1 2 2l-4 4 2 7-2 3-3-7-6 3-2-3z"/></svg>',
    "⏱️": '<svg class="tile-svg" viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
    "🦟": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M12 7v10M12 12c-2 1-4 0-5-2M12 12c2 1 4 0 5-2M12 10l-4-3M12 10l4-3M12 14l-4 3M12 14l4 3"/></svg>',
    "🔤": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M4 7V5h16v2M12 5v14M8 19h8"/></svg>',
    "🇬🇧": '<svg class="tile-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/></svg>',
    "🐛": '<svg class="tile-svg" viewBox="0 0 24 24"><circle cx="12" cy="13" r="5"/><path d="M12 8V5M12 18v3M7 12H4M20 12h-3M8 8l-2-2M16 8l2-2M8 18l-2 2M16 18l2 2"/></svg>',
    "☀️": '<svg class="tile-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    "👁️": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    "☣️": '<svg class="tile-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M12 10a6 6 0 0 1 5 3M12 10a6 6 0 0 0-5 3M12 10v-6M10 3h4M12 14a6 6 0 0 1-5-3M12 14a6 6 0 0 0 5-3M12 14v6M10 21h4"/></svg>',
    "🔢": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M4 6h4v12M4 10h3M13 6c2 0 3 1 3 2.5S13.5 10 13 12c-.5 2 1 3 2 3s3-1 3-3"/></svg>',
    "🎓": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M2 9l10-5 10 5-10 5L2 9z"/><path d="M6 11v5c0 1 3 3 6 3s6-2 6-3v-5"/></svg>',
    "🧾": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 12h6"/></svg>',
    "🧒": '<svg class="tile-svg" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 21c1-4 4-6 7-6s6 2 7 6"/></svg>',
    "🌸": '<svg class="tile-svg" viewBox="0 0 24 24"><circle cx="12" cy="9" r="3"/><path d="M12 6C10 4 8 4 8 6s2 3 4 3M12 6c2-2 4-2 4 0s-2 3-4 3M12 12c0-2 2-4 4-4M12 12c0-2-2-4-4-4M12 12v8"/></svg>',
    "🧪": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-6 10a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3"/><path d="M7 15h10"/></svg>',
    "⚗️": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M10 3h4M11 3v5l-6 10a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-6-10V3"/><path d="M8 16h8"/></svg>',
    "🏥": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-6h6v6M12 9v6"/></svg>',
    "📢": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M3 10v4l4 1 8 5V4l-8 5-4 1z"/><path d="M18 9a4 4 0 0 1 0 6"/></svg>',
    "🔗": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/></svg>',
    "🗒️": '<svg class="tile-svg" viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6V3z"/><path d="M14 3v5h5M9 11h6M9 15h6"/></svg>',
    "🔴": '<svg class="tile-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
  };
  function renderTiles() {
    const el = document.getElementById("tile-grid");
    if (!el) return;
    el.innerHTML = D.tiles
      .map((t) => `<a class="tile" href="${t.u}"><span class="ico">${ICONS[t.i] || t.i}</span><span>${t.t}</span><span class="tag">${t.tag}</span></a>`)
      .join("");
  }

  // ---------- hub: quick strip ----------
  function renderQuick() {
    const el = document.getElementById("quick-strip");
    if (!el) return;
    el.innerHTML = D.quick
      .map((q) => `<div class="quick-card"><div class="k">${q.k}</div><div class="v">${q.v}</div><div class="s">${q.s}</div></div>`)
      .join("");
  }

  // ---------- hub: external links ----------
  function renderExternal() {
    const el = document.getElementById("external-list");
    if (!el) return;
    el.innerHTML = D.external
      .map((x) => `<li><a href="${x.u}" target="_blank" rel="noopener">${x.t}</a></li>`)
      .join("");
  }

  // ---------- search ----------
  function initSearch() {
    const input = document.getElementById("search-input");
    const results = document.getElementById("search-results");
    if (!input || !results) return;
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { results.classList.add("hidden"); return; }
      const hits = D.searchIndex
        .filter((s) => (s.t + " " + s.d).toLowerCase().includes(q))
        .slice(0, 8);
      if (!hits.length) {
        results.innerHTML = `<div class="hit"><small>Keine Treffer für „${esc(input.value)}“</small></div>`;
      } else {
        results.innerHTML = hits
          .map((h) => `<a class="hit" href="${h.u}"><b>${esc(h.t)}</b> <small>${esc(h.d)}</small></a>`)
          .join("");
      }
      results.classList.remove("hidden");
    });
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- calculator: needle/lancet ----------
  function initNeedleCalc() {
    const vk = document.getElementById("nc-vk");
    const anz = document.getElementById("nc-anz");
    const out = document.getElementById("nc-out");
    if (!vk || !anz || !out) return;
    const run = () => {
      const v = parseFloat(String(vk.value).replace(",", "."));
      const n = parseInt(String(anz.value).replace(/[^\d]/g, ""), 10);
      if (!(v > 0) || !(n > 0)) { out.innerHTML = ""; return; }
      const r = D.calcNeedle(v, n);
      out.innerHTML = `
        <div class="row total"><span>Neuer Tax-VK</span><b>${r.neuerVK} €</b></div>
        <div class="row"><span>Tax-VK (bisher)</span><b>${v.toFixed(2)} €</b></div>
        <div class="row"><span>brutto / Stück</span><b>${r.brutto} €</b></div>
        <div class="row"><span>netto / Stück</span><b>${r.netto} €</b></div>
        <div class="row"><span>netto gerundet</span><b>${r.nettoRund} €</b></div>
        <div class="row"><span>Packung (${n} St.)</span><b>${r.packung} €</b></div>
        <div class="row"><span>+ 19 % MwSt</span><b>${r.neuerVK} €</b></div>`;
    };
    vk.addEventListener("input", run);
    anz.addEventListener("input", run);
    document.getElementById("nc-reset")?.addEventListener("click", () => {
      vk.value = ""; anz.value = ""; out.innerHTML = "";
    });
  }

  // ---------- calculator: MwSt converter ----------
  function initMwstCalc() {
    const amount = document.getElementById("mw-amount");
    const rate = document.getElementById("mw-rate");
    const dir = document.getElementById("mw-dir");
    const out = document.getElementById("mw-out");
    if (!amount || !rate || !dir || !out) return;
    const run = () => {
      const a = parseFloat(String(amount.value).replace(",", "."));
      const r = parseFloat(rate.value) || 19;
      if (!(a > 0)) { out.innerHTML = ""; return; }
      const isBrutto = dir.value === "brutto";
      const res = D.calcMwst(a, r, isBrutto ? "brutto" : "netto");
      out.innerHTML = `
        <div class="row total"><span>${isBrutto ? "Netto" : "Brutto"}</span><b>${res.toFixed(2)} €</b></div>
        <div class="row"><span>${isBrutto ? "Brutto (gegeben)" : "Netto (gegeben)"}</span><b>${a.toFixed(2)} €</b></div>
        <div class="row"><span>MwSt ${r} %</span><b>${(Math.abs(res - a)).toFixed(2)} €</b></div>`;
    };
    amount.addEventListener("input", run);
    rate.addEventListener("input", run);
    dir.addEventListener("change", run);
  }

  // ---------- Fristen tool ----------
  function initFristen() {
    const date = document.getElementById("fr-date");
    const type = document.getElementById("fr-type");
    const out = document.getElementById("fr-out");
    if (!date || !type || !out) return;
    if (!date.value) date.value = new Date().toISOString().slice(0, 10);
    const run = () => {
      const end = D.fristEnde(date.value, type.value);
      if (!end) { out.innerHTML = ""; return; }
      out.innerHTML = `<div class="row total"><span>Gültig bis</span><b>${end}</b></div>`;
    };
    date.addEventListener("change", run);
    type.addEventListener("change", run);
    run();
  }

  // ---------- service worker (PWA offline) ----------
  function initSW() {
    if (!("serviceWorker" in navigator) || location.protocol !== "https:") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  // ---------- breadcrumbs (content pages, not hub/tools) ----------
  function initBreadcrumbs(page) {
    const hero = document.querySelector(".page-hero h1");
    if (!hero || page === "index.html" || page === "rechner.html" || page === "fristen.html" || page === "schlau-im-hv.html" || page === "notfall.html") return;
    const crumb = document.createElement("nav");
    crumb.className = "breadcrumb";
    crumb.setAttribute("aria-label", "Breadcrumb");
    const title = hero.textContent.replace(/^[^\wßäöüA-Z]+/, "").slice(0, 42);
    crumb.innerHTML = `<a href="index.html">Hub</a><span class="sep">›</span><a href="index.html#themen">Themen</a><span class="sep">›</span><span>${title}</span>`;
    const heroBox = document.querySelector(".page-hero");
    heroBox.appendChild(crumb);
  }

  // ---------- boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    injectChrome(location.pathname.split("/").pop() || "index.html");
    initBreadcrumbs(location.pathname.split("/").pop() || "index.html");
    renderTiles();
    renderQuick();
    renderExternal();
    initSearch();
    initNeedleCalc();
    initMwstCalc();
    initFristen();
    initCiteCopy();
    initFaktenboxPrint();
    initSW();
    // global palette shortcuts
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
      else if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); openPalette(); }
      else if (e.key === "Escape" && paletteEl && !paletteEl.classList.contains("hidden")) closePalette();
    });
  });
})();
