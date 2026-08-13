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
          <a class="brand" href="index.html"><span class="dot"></span>Apobase <small>Apotheken-Info-Terminal</small></a>
          <nav class="main-nav">${navHtml}</nav>
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

  // ---------- hub: tiles ----------
  function renderTiles() {
    const el = document.getElementById("tile-grid");
    if (!el) return;
    el.innerHTML = D.tiles
      .map((t) => `<a class="tile" href="${t.u}"><span class="ico">${t.i}</span><span>${t.t}</span><span class="tag">${t.tag}</span></a>`)
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

  // ---------- boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    injectChrome(location.pathname.split("/").pop() || "index.html");
    renderTiles();
    renderQuick();
    renderExternal();
    initSearch();
    initNeedleCalc();
    initMwstCalc();
    initFristen();
    initCiteCopy();
    initSW();
    // global palette shortcuts
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
      else if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); openPalette(); }
      else if (e.key === "Escape" && paletteEl && !paletteEl.classList.contains("hidden")) closePalette();
    });
  });
})();
