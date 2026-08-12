#!/usr/bin/env node
/* Apobase page generator — Phase 1 mass production.
   Reads topics.json, emits one HTML page per topic using the approved
   Phase-0 template (Faktenbox + Detail + Quellen badges + Stand + disclaimer). */
const fs = require('fs');
const path = require('path');

const HEAD = (title, desc) => `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Apobase</title>
<meta name="description" content="${desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header id="site-header" class="site-header"></header>

<main class="container">
  <div class="page-hero">
    <h1>${title}</h1>
    <div class="sub">${desc}</div>
  </div>

  <div class="page-body">
    <nav class="toc">
      <div class="toc-title">Auf dieser Seite</div>`;

const FAKTENBOX = (rows, badge) => `
    <div class="prose">
      <div class="faktenbox">
        <div class="fb-title">Faktenbox</div>
        <table class="data">
          <tbody>
            ${rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('\n            ')}
          </tbody>
        </table>
        <div class="fb-badge">${badge}</div>
      </div>`;

const SOURCES = (sources, stand) => `
      <h2 id="quellen">Quellen &amp; Prüfstatus</h2>
      ${sources.map(s => `<div class="src-badge ${s.badge || ''}">${s.txt}</div>`).join('\n      ')}
      <div class="src-badge">📅 Zuletzt geprüft: <b>${stand}</b> · Nächste Prüfung: monatlich</div>

      <div class="note"><b>Hinweis:</b> Keine Rechts- oder Therapieberatung. Im Einzelfall Fachinformationen, ABDA-Datenbank und Rücksprache mit dem Arzt.</div>
    </div>
  </div>
</main>

<footer id="site-footer" class="site-footer"></footer>

<script src="data.js"></script>
<script src="app.js"></script>
</body>
</html>`;

const topics = JSON.parse(fs.readFileSync(path.join(__dirname, 'topics.json'), 'utf8'));

// emit per-topic pages (independent URLs)
let count = 0;
for (const t of topics) {
  if (t.skip || !t.url) continue;
  const html = HEAD(t.title, t.desc) + `
      ${t.toc.map(x => `<a href="#${x.id}">${x.txt}</a>`).join('\n      ')}
    </nav>
` + FAKTENBOX(t.fakten, t.badge) + `
      ${t.sections.map(s => `<h2 id="${s.id}">${s.h}</h2>\n      ${s.body}`).join('\n\n      ')}
` + SOURCES(t.sources, t.stand);
  fs.writeFileSync(path.join(__dirname, t.url), html);
  console.log('wrote', t.url);
  count++;
}
console.log('done:', count, 'pages');
