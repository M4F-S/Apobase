/* Apobase 2.0 — app: shared chrome, search, calculators */
(function () {
  const D = APOBASE;

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
      .map(([t, u]) => `<a href="${u}"${u === active || u === "index.html#themen" && active === "index.html" ? "" : ""} class="${active === u ? "active" : ""}">${t}</a>`)
      .join("");
    const header = document.getElementById("site-header");
    if (header) {
      header.innerHTML = `
        <div class="container header-inner">
          <a class="brand" href="index.html"><span class="dot"></span>Apobase <small>Apotheken-Info-Terminal</small></a>
          <nav class="main-nav">${navHtml}</nav>
        </div>`;
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

  // ---------- hub: tiles ----------
  function renderTiles() {
    const el = document.getElementById("tile-grid");
    if (!el) return;
    el.innerHTML = D.tiles
      .map(
        (t) =>
          `<a class="tile" href="${t.u}"><span class="ico">${t.i}</span><span>${t.t}</span><span class="tag">${t.tag}</span></a>`
      )
      .join("");
  }

  // ---------- hub: quick strip ----------
  function renderQuick() {
    const el = document.getElementById("quick-strip");
    if (!el) return;
    el.innerHTML = D.quick
      .map(
        (q) =>
          `<div class="quick-card"><div class="k">${q.k}</div><div class="v">${q.v}</div><div class="s">${q.s}</div></div>`
      )
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
          .map(
            (h) =>
              `<a class="hit" href="${h.u}"><b>${esc(h.t)}</b> <small>${esc(h.d)}</small></a>`
          )
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

  // ---------- boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    injectChrome(location.pathname.split("/").pop() || "index.html");
    renderTiles();
    renderQuick();
    renderExternal();
    initSearch();
    initNeedleCalc();
    initMwstCalc();
    initFristen();
  });
})();
