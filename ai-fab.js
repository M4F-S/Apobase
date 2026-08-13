/* Apobase AI — chat widget (slide-over drawer, site-wide) */
(function () {
  // Only run on pages that load app.js (all site pages) — skip the standalone AI test page
  if (window.location.pathname.indexOf("ai-test.html") !== -1) return;

  const CSS_ID = "apobase-ai-css";
  if (!document.getElementById(CSS_ID)) {
    const s = document.createElement("style");
    s.id = CSS_ID;
    s.textContent = `
.apo-fab{position:fixed;right:20px;bottom:20px;z-index:120;width:56px;height:56px;border-radius:50%;
  background:var(--brand-primary,#f59e0b);color:#1a1409;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;
  border:none;box-shadow:var(--shadow-lg,0 12px 28px rgba(0,0,0,.45));transition:transform .2s cubic-bezier(.16,1,.3,1),box-shadow .2s}
.apo-fab:hover{transform:translateY(-2px) scale(1.04);box-shadow:var(--shadow-lg,0 12px 28px rgba(0,0,0,.45)),0 0 0 4px var(--brand-primary-glow,rgba(245,158,11,.15))}
.apo-fab .pulse{position:absolute;width:12px;height:12px;border-radius:50%;background:var(--accent-success,#1db954);border:2px solid #fff;top:2px;right:2px}
.apo-panel{position:fixed;top:0;right:0;bottom:0;z-index:130;width:min(460px,100vw);
  background:var(--bg-surface,#fff);border-left:1px solid var(--border-medium,#d0d0d6);box-shadow:var(--shadow-lg,0 16px 48px rgba(0,0,0,.5));
  display:flex;flex-direction:column;overflow:hidden;font-family:var(--font-body,'Manrope',system-ui,sans-serif);font-size:14px;color:var(--text-primary,#1c1f26);
  transform:translateX(100%);opacity:1;pointer-events:none;transition:transform .3s cubic-bezier(.16,1,.3,1)}
.apo-panel.open{transform:translateX(0);pointer-events:auto}
.apo-head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--bg-surface-raised,#f7f8fa);
  border-bottom:1px solid var(--border-subtle,#e6e7eb)}
.apo-head .dot{width:9px;height:9px;border-radius:50%;background:var(--accent-success,#1db954);animation:apoPulse 2s infinite}
@keyframes apoPulse{50%{opacity:.4}}
.apo-head b{font-size:14px;font-family:var(--font-display,'Manrope',sans-serif);letter-spacing:.3px;color:var(--text-primary,#1c1f26)}
.apo-head small{color:var(--text-tertiary,#8a8f99);font-size:11px;display:block}
.apo-close{margin-left:auto;background:none;border:none;color:var(--text-secondary,#5c616b);font-size:18px;cursor:pointer;padding:6px 8px;border-radius:8px}
.apo-close:hover{background:var(--bg-surface-active,#e8eaee)}
.apo-sugg{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px;border-bottom:1px solid var(--border-subtle,#e6e7eb)}
.apo-sugg button{background:var(--bg-surface-raised,#f7f8fa);border:1px solid var(--border-medium,#d0d0d6);
  color:var(--brand-primary-hover,#d97706);font-size:11.5px;padding:6px 12px;border-radius:20px;cursor:pointer;font-family:inherit;transition:all .2s cubic-bezier(.16,1,.3,1)}
.apo-sugg button:hover{border-color:var(--brand-primary,#f59e0b);color:var(--brand-primary-hover,#d97706)}
.apo-body{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;min-height:200px}
.apo-msg{max-width:88%;padding:9px 12px;border-radius:12px;line-height:1.5;white-space:pre-wrap;font-size:13px}
.apo-msg.user{align-self:flex-end;background:var(--brand-primary,#f59e0b);color:#1a1409;border-bottom-right-radius:3px}
.apo-msg.bot{align-self:flex-start;background:var(--bg-surface-raised,#f7f8fa);border:1px solid var(--border-subtle,#e6e7eb);
  border-bottom-left-radius:3px;color:var(--text-primary,#1c1f26)}
.apo-msg .src{display:block;margin-top:6px;font-size:10.5px;color:var(--text-tertiary,#8a8f99)}
.apo-msg .src b{color:var(--brand-primary-hover,#d97706);font-weight:600}
.apo-msg.err{border-color:var(--accent-danger,#e1405a);color:var(--accent-danger,#e1405a)}
.apo-typing{align-self:flex-start;background:var(--bg-surface-raised,#f7f8fa);border:1px solid var(--border-subtle,#e6e7eb);
  padding:9px 12px;border-radius:12px;font-size:12px;color:var(--text-tertiary,#8a8f99);animation:apoPulse 1.6s infinite}
.apo-input{display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--border-subtle,#e6e7eb);background:var(--bg-surface-raised,#f7f8fa)}
.apo-input input{flex:1;background:var(--bg-surface,#fff);border:1px solid var(--border-medium,#d0d0d6);border-radius:10px;
  color:var(--text-primary,#1c1f26);padding:9px 12px;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s}
.apo-input input:focus{border-color:var(--brand-primary,#f59e0b);box-shadow:0 0 0 3px var(--brand-primary-glow,rgba(245,158,11,.15))}
.apo-input button{background:var(--brand-primary,#f59e0b);color:#1a1409;border:none;border-radius:10px;padding:9px 16px;font-weight:700;
  cursor:pointer;font-family:inherit;font-size:13px;transition:background .2s}
.apo-input button:hover{background:var(--brand-primary-hover,#d97706);color:#fff}
.apo-input button:disabled{opacity:.5}
.apo-note{font-size:10px;color:var(--text-tertiary,#8a8f99);text-align:center;padding:6px 12px;border-top:1px solid var(--border-subtle,#e6e7eb)}
@media (prefers-reduced-motion: reduce){.apo-panel{transition:none}}
@media (max-width:520px){.apo-panel{width:100vw}}
`;
    document.head.appendChild(s);
  }

  const API = "/apobase/ai/api/chat";
  const BASE_SUGG = [
    "Wie lange ist ein rosa Kassenrezept gültig?",
    "Was gehört ins Notfalldepot nach § 15 (2) ApBetrO?",
    "Was bedeutet 1-0-1 auf einem Rezept?",
    "Was tue ich bei fehlender Arztunterschrift?"
  ];
  // contextual suggestions by page (plan §4.3)
  const PAGE_SUGG = {
    "t-rezept.html": [
      "Für welche Wirkstoffe gilt das T-Rezept?",
      "Ist die ärztliche Bestätigung von Sicherheitsmaßnahmen Pflicht?"
    ],
    "notfalldepot.html": [
      "Was gehört ins Notfalldepot nach § 15 (2) ApBetrO?",
      "Wie lange muss das Depot geprüft werden?"
    ],
    "dosierung-rechner.html": [
      "Welche Paracetamol-Dosis für 12,5 kg?",
      "Ab wann ist Ibuprofen kontraindiziert?"
    ],
    "retax-check.html": [
      "Was ist bei fehlender Unterschrift zu tun?",
      "Wann droht eine Nullretaxation?"
    ],
    "cannabis.html": [
      "Sind Cannabisblüten noch GKV-Leistung?",
      "Was bleibt nach dem § 31 Abs. 6 SGB V?"
    ],
    "homoeopathie-gkv.html": [
      "Sind Homöopathika noch GKV-fähig?",
      "Seit wann gilt die Streichung?"
    ],
    "rezepte.html": [
      "Wie lange ist ein rosa Rezept gültig?",
      "Was gilt für das Entlassrezept?"
    ],
    "fristen.html": [
      "Wie lange gilt ein BtM-Rezept?",
      "Was gilt beim Privatrezept?"
    ],
    "notfall.html": [
      "Welcher Giftnotruf gehört zu Berlin?",
      "Welche Nummer gilt in Göttingen?"
    ]
  };

  const host = document.createElement("div");
  host.innerHTML = `
    <button class="apo-fab" id="apoFab" title="Apobase AI — Frage stellen" aria-label="Chat öffnen" aria-expanded="false">💬<span class="pulse"></span></button>
    <div class="apo-panel" id="apoPanel" role="dialog" aria-modal="true" aria-label="Apobase AI Chat">
      <div class="apo-head"><span class="dot"></span><div><b>Apobase AI</b><small>Fachinfo-Assistent · Quellen-geprüft</small></div>
        <button class="apo-close" id="apoClose" aria-label="Schließen">✕</button></div>
      <div class="apo-sugg" id="apoSugg"></div>
      <div class="apo-body" id="apoBody"></div>
      <div class="apo-input">
        <input id="apoInp" type="text" placeholder="Frage an Apobase AI…" autocomplete="off" aria-label="Frage eingeben">
        <button id="apoSend">Senden</button>
      </div>
      <div class="apo-note">Informationshilfe für Fachpersonal — keine Rechts-/Therapieberatung. Ersetzt nicht Fachinformation &amp; ABDA.</div>
    </div>`;
  document.body.appendChild(host);

  const fab = document.getElementById("apoFab");
  const panel = document.getElementById("apoPanel");
  const body = document.getElementById("apoBody");
  const inp = document.getElementById("apoInp");
  const btn = document.getElementById("apoSend");
  const history = [];

  // contextual suggestions: current page first, then base
  const page = location.pathname.split("/").pop() || "";
  const suggs = (PAGE_SUGG[page] || []).concat(BASE_SUGG).slice(0, 4);
  suggs.forEach(s => {
    const b = document.createElement("button");
    b.textContent = s;
    b.onclick = () => ask(s);
    document.getElementById("apoSugg").appendChild(b);
  });

  function addMsg(text, cls, srcs) {
    const d = document.createElement("div");
    d.className = "apo-msg " + cls;
    d.textContent = text;
    if (srcs && srcs.length) {
      const sp = document.createElement("span");
      sp.className = "src";
      sp.innerHTML = "Quellen: <b>" + [...new Set(srcs)].join("</b>, <b>") + "</b>";
      d.appendChild(sp);
    }
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
    return d;
  }

  async function ask(q) {
    if (!q.trim()) return;
    addMsg(q, "user");
    history.push({ role: "user", content: q });
    const t = document.createElement("div");
    t.className = "apo-typing";
    t.textContent = "…";
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
    btn.disabled = true;
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history: history.slice(0, -1) })
      });
      const d = await r.json();
      t.remove();
      if (d.answer) {
        addMsg(d.answer, "bot", d.sources);
        history.push({ role: "assistant", content: d.answer });
      } else {
        addMsg("Leere Antwort.", "err");
      }
    } catch (e) {
      t.remove();
      addMsg("Fehler: " + e.message, "err");
    }
    btn.disabled = false;
  }

  function setOpen(open) {
    panel.classList.toggle("open", open);
    fab.setAttribute("aria-expanded", String(open));
  }
  fab.onclick = () => setOpen(!panel.classList.contains("open"));
  document.getElementById("apoClose").onclick = () => setOpen(false);
  btn.onclick = () => { ask(inp.value); inp.value = ""; };
  inp.addEventListener("keydown", e => { if (e.key === "Enter") { ask(inp.value); inp.value = ""; } });
  document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
})();
