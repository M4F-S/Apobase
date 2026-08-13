/* Apobase AI — chat FAB widget (site-wide, injected with shared chrome) */
(function () {
  // Only run on pages that load app.js (all site pages) — skip the standalone AI test page
  if (window.location.pathname.indexOf("ai-test.html") !== -1) return;

  const CSS_ID = "apobase-ai-css";
  if (!document.getElementById(CSS_ID)) {
    const s = document.createElement("style");
    s.id = CSS_ID;
    s.textContent = `
.apo-fab{position:fixed;right:20px;bottom:20px;z-index:9999;width:58px;height:58px;border-radius:50%;
  background:linear-gradient(135deg,var(--gold,#dca967),var(--bronze,#7b5830));border:1px solid var(--border-hi,rgba(220,169,103,.38));
  color:#190e0a;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;
  box-shadow:0 8px 24px rgba(0,0,0,.45);transition:transform .15s ease}
.apo-fab:hover{transform:scale(1.06)}
.apo-fab .pulse{position:absolute;width:12px;height:12px;border-radius:50%;background:var(--green,#12b33f);
  border:2px solid #190e0a;top:2px;right:2px}
.apo-panel{position:fixed;right:20px;bottom:88px;z-index:9999;width:min(380px,calc(100vw - 40px));
  max-height:min(620px,calc(100vh - 120px));display:flex;flex-direction:column;border-radius:16px;
  background:#190e0a;border:1px solid var(--border-hi,rgba(220,169,103,.38));box-shadow:0 16px 48px rgba(0,0,0,.6);
  overflow:hidden;font-family:var(--font-body,'Manrope',system-ui,sans-serif);font-size:14px;color:var(--text,#f4efe6);
  transform:translateY(12px);opacity:0;pointer-events:none;transition:transform .18s ease,opacity .18s ease}
.apo-panel.open{transform:translateY(0);opacity:1;pointer-events:auto}
.apo-head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--surface-hi,rgba(255,255,255,.07));
  border-bottom:1px solid var(--border,rgba(220,169,103,.16))}
.apo-head .dot{width:9px;height:9px;border-radius:50%;background:var(--green,#12b33f);animation:apoPulse 2s infinite}
@keyframes apoPulse{50%{opacity:.4}}
.apo-head b{font-size:14px;letter-spacing:.3px}
.apo-head small{color:var(--text-dim,#8a8071);font-size:11px;display:block}
.apo-close{margin-left:auto;background:none;border:none;color:var(--text-soft,#b9ae9a);font-size:18px;cursor:pointer;padding:4px}
.apo-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;min-height:200px}
.apo-msg{max-width:88%;padding:9px 12px;border-radius:12px;line-height:1.5;white-space:pre-wrap;font-size:13px}
.apo-msg.user{align-self:flex-end;background:var(--bronze,#7b5830);color:#f4efe6;border-bottom-right-radius:3px}
.apo-msg.bot{align-self:flex-start;background:var(--surface,rgba(255,255,255,.04));border:1px solid var(--border,rgba(220,169,103,.16));
  border-bottom-left-radius:3px;color:var(--text,#f4efe6)}
.apo-msg .src{display:block;margin-top:6px;font-size:10.5px;color:var(--text-dim,#8a8071)}
.apo-msg .src b{color:var(--gold,#dca967);font-weight:600}
.apo-msg.err{border-color:var(--red,#e5484d);color:var(--red,#e5484d)}
.apo-typing{align-self:flex-start;background:var(--surface,rgba(255,255,255,.04));border:1px solid var(--border,rgba(220,169,103,.16));
  padding:9px 12px;border-radius:12px;font-size:12px;color:var(--text-dim,#8a8071);animation:apoPulse 1.6s infinite}
.apo-sugg{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:2px}
.apo-sugg button{background:var(--surface,rgba(255,255,255,.04));border:1px solid var(--border,rgba(220,169,103,.16));
  color:var(--gold,#dca967);font-size:11.5px;padding:5px 10px;border-radius:16px;cursor:pointer;font-family:inherit}
.apo-sugg button:hover{border-color:var(--gold-bright,#f0c98a)}
.apo-input{display:flex;gap:8px;padding:12px;border-top:1px solid var(--border,rgba(220,169,103,.16));background:var(--surface-hi,rgba(255,255,255,.07))}
.apo-input input{flex:1;background:rgba(0,0,0,.3);border:1px solid var(--border,rgba(220,169,103,.16));border-radius:10px;
  color:var(--text,#f4efe6);padding:9px 12px;font-size:13px;font-family:inherit;outline:none}
.apo-input input:focus{border-color:var(--gold,#dca967)}
.apo-input button{background:var(--gold,#dca967);color:#190e0a;border:none;border-radius:10px;padding:9px 16px;font-weight:700;
  cursor:pointer;font-family:inherit;font-size:13px}
.apo-input button:disabled{opacity:.5}
.apo-note{font-size:10px;color:var(--text-dim,#8a8071);text-align:center;padding:6px 12px;border-top:1px solid var(--border,rgba(220,169,103,.16))}
@media (max-width:520px){.apo-panel{right:10px;bottom:80px;width:calc(100vw - 20px)}.apo-fab{right:14px;bottom:14px}}
`;
    document.head.appendChild(s);
  }

  const API = "/apobase/ai/api/chat";
  const SUGG = [
    "Wie lange ist ein rosa Kassenrezept gültig?",
    "Was gehört ins Notfalldepot nach § 15 (2) ApBetrO?",
    "Was bedeutet 1-0-1 auf einem Rezept?",
    "Was tue ich bei fehlender Arztunterschrift?"
  ];

  const host = document.createElement("div");
  host.innerHTML = `
    <button class="apo-fab" id="apoFab" title="Apobase AI — Frage stellen" aria-label="Chat öffnen">💬<span class="pulse"></span></button>
    <div class="apo-panel" id="apoPanel" role="dialog" aria-label="Apobase AI Chat">
      <div class="apo-head"><span class="dot"></span><div><b>Apobase AI</b><small>Fachinfo-Assistent · Quellen-geprüft</small></div>
        <button class="apo-close" id="apoClose" aria-label="Schließen">✕</button></div>
      <div class="apo-body" id="apoBody">
        <div class="apo-sugg" id="apoSugg"></div>
      </div>
      <div class="apo-input">
        <input id="apoInp" type="text" placeholder="Frage an Apobase AI…" autocomplete="off">
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

  SUGG.forEach(s => {
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

  fab.onclick = () => panel.classList.toggle("open");
  document.getElementById("apoClose").onclick = () => panel.classList.remove("open");
  btn.onclick = () => { ask(inp.value); inp.value = ""; };
  inp.addEventListener("keydown", e => { if (e.key === "Enter") { ask(inp.value); inp.value = ""; } });
})();
