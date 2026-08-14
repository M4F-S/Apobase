# Apobase — Phase 5: Platform & Frontend Master Plan (2026-08-14)

Source: Toy's platform review + frontend-specialist recommendations (user-approved direction).
Baseline: 75 pages, 114 search topics, tokens.css design system, light/dark, eval 30/30, git clean @ 0dda78e.

---

## Phase 0 — Checkpoint (10 min)
- [ ] `git add -A && git commit` current state → rollover point `P0`
- [ ] Backup Caddyfile + verify live (curl /apobase/ → 200)

## Phase 1 — Content Gaps (build)
Ordered by pharmacy daily value.

### 1.1 Lieferengpass page (NEW — `lieferengpass.html`)
The #1 daily HV pain has no dedicated page today. Build:
- Flowchart: Rezept vorliegen → aut-idem Kreuz? → Verbotsliste? → Austausch §129 SGB V → Rücksprache Pflicht bei Unklarheit
- Engpass-Formular (Rabattvertrag), § 129 Abs. 2a SGB V Befugnisse, ALVVG
- "Was tun wenn nicht lieferbar" Praxisschritte
- Faktenbox + Quellen badges (standards template)
- Wire into: tiles (tag: HV), searchIndex, schlau-im-hv A-Z table, hub
- Sources: Rahmenvertrag 01.04.2026, DAV/GKV Verbotsliste, § 129 SGB V (already verified in repo)

### 1.2 Collapse "ALT" tiles (refactor)
Currently 6+ ALTERNATIVEN tiles clutter the grid (Ampicillin-Alt, Tacrolimus-Alt, Erythro-Gel-Alt, Verhütungsring-Alt, Alternativen A–Z → all point to similar pages).
- Build ONE `alternativen.html` index page: Wirkstoff-Alternativen A–Z (links to all 20+ Alternativen pages)
- Remove 4 redundant tiles from data.js; keep: Ampicillin-Alt (top use), Alternativen A–Z (→ alternativen.html), Tacrolimus/Erythro/Verhütungsring stay as searchIndex entries but not tiles
- Result: hub tiles 44 → ~39, cleaner

### 1.3 Reiseapotheke promotion (move tile #15 → #7)
Pharmacy reality: Reiseapotheke is a top OTC consult. Move tile up in data.js (after Reiseapotheke position in grid). Also add link in Notfall section + AI contextual chips on reiseapotheke.html.

### 1.4 HV-Spickzettel — printable quick reference (NEW `hv-spickzettel.html`)
One page = the sheet pharmacies tape at the counter:
- 28 Tage rosa · 3 Werktage Entlass · 7 Tage BtM · 3 Monate Privat
- Aut-idem / Verbotsliste / Austausch shortcuts
- GIZ numbers (7), Notfalldepot 11 items
- Print-optimized (@media print: no header/footer/toc, compact table)
- Wire: tiles (tag: Tool, icon 🗒), searchIndex, schlau-im-hv
- Deliverable doubles as Phase 2.6 print-style test case

### 1.5 Notdienst map link (1-line addition)
Add to notdienst.html + notfall.html: link to aponet.de Notdienst-Suche (official) — "Nächstgelegene Notdienstapotheke suchen".

### 1.6 Print-per-Faktenbox (app.js enhancement)
Add "🖨 Drucken" button to every .faktenbox (copy pattern from Notfalldepot D.print()): window.print with @media print rules isolating the box.
- app.js: inject button into each .faktenbox, class .fb-print

---

## Phase 2 — Frontend Identity: "Pharmazie-Grün" (tokens + components)

### 2.1 Token rebrand (tokens.css — single source, zero page edits)
Swap primary/accent roles:
- `--brand-primary: #059669` (emerald-600, Apo-green) — brand, active states, links
- `--brand-primary-hover: #047857` (emerald-700)
- `--brand-primary-subtle: #ecfdf5` (emerald-50)
- `--brand-primary-glow: hsla(160, 84%, 39%, 0.15)`
- `--accent-warning: #f59e0b` (amber moves to urgency/fristen role)
- Keep: danger #e1405a, success green family, info blue, dark mode OLED values
- Alias tokens (`--gold`, `--accent`, `--text`, `--border`, `--bg`) updated to map to new values → legacy inline styles follow automatically
- Update `.chip.gold` → amber, `.chip.green` → emerald, primary buttons → emerald
- Fonts unchanged (Plus Jakarta + Inter already correct)

### 2.2 Tile redesign (style.css + app.js)
- **Emoji → inline SVG icons**: map each tile icon (🩺📅🚨🧮💡⚖️🌿…) to a Lucide-style SVG (24px, stroke 1.5, currentColor) injected by app.js from an ICONS map in data.js; fallback: keep emoji char as hidden alt for a11y
- Tile hover: `translateY(-2px)` + border-color emerald + glow (already has transition)
- Grid: `repeat(auto-fill, minmax(150px, 1fr))` (fixes 6×164px fixed grid)
- Font-size 13→14px, min touch target 44px height via padding

### 2.3 Hero polish (style.css + index.html)
- Soft emerald radial gradient overlay on .hero (in addition to existing)
- h1 in --font-display (Plus Jakarta 700/800)
- Add subtle cross/plus SVG motif (repeating, low-opacity, CSS-only)

### 2.4 Sticky Quick-Fristen strip (app.js + style.css)
- Make .quick-strip `position: sticky; top: 0; z-index: 50;` with backdrop blur
- Keeps 28/3/7/3-Monate always visible = plan §1.1 glanceability
- Ensure doesn't collide with header (sticky offset) + reduced-motion safe

### 2.5 Dark mode green glow
- [data-theme="dark"]: brand glow → emerald hsla(160,84%,50%,0.18); accent stays amber for Fristen chips

### 2.6 Print stylesheet hardening
- Extend @media print: hide .quick-strip, .tile-grid, AI drawer; .faktenbox isolation; .hv-spickzettel compact layout

---

## Phase 3 — Navigation & Ergonomics

### 3.1 Responsive header (app.js + style.css)
- ≤768px: collapse .main-nav into hamburger (☰) → slide-down menu; keep ⌘K + theme toggle visible
- Header search field added (all pages via app.js injection, filters searchIndex inline) — Cmd+K stays as keyboard shortcut

### 3.2 Breadcrumbs (app.js injection)
- On content pages (not hub/tools): `Hub › Kategorie › Page` — derived from data.js category mapping
- aria-label="Breadcrumb", separated with ›, links resolve

### 3.3 Touch targets
- Audit: all interactive elements ≥44px (tile padding, wizard buttons, chips) — fix in style.css

### 3.4 Mobile bottom nav (optional, Phase 3.5)
- ≤768px: fixed bottom bar with 5 items (Hub, Fristen, Notfall, Rechner, Themen) — per ui-ux-pro-max bottom-nav-limit
- Requires body padding-bottom to avoid content hiding

---

## Phase 4 — Verification & Ship
- [ ] `node --check` app.js/data.js + check_js.py → 0 errors
- [ ] audit_links.py → 75+ pages, 0 broken
- [ ] Browser: light/dark toggle, palette, drawer, sticky strip, hamburger at 375px, tiles reflow
- [ ] Eval 30/30, corpus audit clean (only content-add pages change corpus → rebuild + docker cp + restart)
- [ ] Deploy via scripts/deploy-live.sh (excludes: .git/.env/ai/scripts/*.md — new pages are .html, fine)
- [ ] Commit + push (author Mohamed Fathy), vault report `apobase-phase5-plan-exec-2026-08-14.md`

---

## Rollback
- Every phase committed separately (P0, P1, P2, P3, P4) — `git revert <phase>` restores
- tokens.css rebrand isolated to one file — revert restores old palette instantly

## Estimated scope
- Phase 1: ~2 new pages + 1 index refactor + 3 link/move edits
- Phase 2: tokens.css + style.css + app.js/data.js icon map
- Phase 3: app.js + style.css responsive blocks
- All content facts reuse already-verified sources (Rahmenvertrag §129, §61, GIZ, §15(2), AM-RL §11)
