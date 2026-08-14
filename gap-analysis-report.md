# Apobase vs Sowedoo — Gap Analysis + AI Reply Fix (2026-08-14)

## 1. Sowedoo ↔ Apobase comparison

Method: diffed original sowedoo (commit 92644e5) against current main. Current = 75 pages, 114 search topics vs old ~40 topics, 14 tiles.

**Verdict: apobase STRICTLY SUPERSETS sowedoo — nothing dropped.** All 14 original tile targets exist (btm.html preserved via 301 → btm-vorschriften.html). 72 files added since.

### What the user saw as "missing" — root causes:
1. **T-Rezept invisible on main Rezept page**: rezepte.html covered only Rosa/Entlass/BtM/Privat/Grün — no T-Rezept section, no TOC entry, no table row. Page existed but undiscoverable.
2. **No hub tile for T-Rezept or Entlassrezept** — buried in search only.
3. **3 stale "🔜 soon" markers in schlau-im-hv.html**: Entlassrezept, Importe/Einzelimport (both HAD dedicated pages — stale markers), Zuzahlung bei Stückelung (genuinely missing — dead link target from auseinzeln.html).
4. **btm.html orphan** (old sowedoo tile target, identical content to btm-vorschriften.html, no inbound links, still live).
5. **Reiseapotheke**: exists (4.2KB, tile #15, in search) — user's "no Reiseapotheke" = buried tile, not absence.

### Fixes shipped (commit 223e5ae):
- rezepte.html: T-Rezept section (§3a AMVV: Lenalidomid/Pomalidomid/Thalidomid, BfArM form, not-BtM warning) + TOC link + summary-table row
- data.js: T-Rezept + Entlassrezept hub tiles (top of grid)
- zuzahlung-stueckelung.html NEW (verified § 61 SGB V live: 10 % Abgabepreis, min 5 €, max 10 €, NEVER more than cost of the item — example table corrected to legal cap), wired into schlau-im-hv table + auseinzeln link + search index
- schlau-im-hv: 3 "soon" rows → real links (entlassrezept, einzelimport) / new page (zuzahlung)
- btm.html → 301 redirect to btm-vorschriften.html (old bookmarks preserved)

## 2. AI assistant fixes (user complaint: "replies too short", "shows end not beginning")

Root causes found:
1. **System prompt said "kurz"** (main.py line 36) → model intentionally short
2. **Drawer scrolled to BOTTOM** after bot reply (ai-fab.js scrollTop = scrollHeight) → user sees disclaimer at end, misses answer beginning

Fixes:
- SYSTEM_PROMPT rule 7 rewritten: full, structured (### sections), all facts/actions/sources, NEVER stub-short; begin with most useful info. Deployed via docker cp main.py + restart.
- ai-fab.js addMsg: bot messages scroll so message TOP is visible (offsetTop - bodyOffset - 8); user/typing still scroll bottom.

### Verified live:
- trockene-augen answer: 2551 chars, "### Erste Wahl: Tränenersatzmittel" first, 5 sections (Erste Wahl, Auswahl in der Beratung, Lidrandpflege, Wann ärztlich, + more), DOG/BVA + MSD citations
- Drawer after reply: scrollTop=53 while bot message top=280 (answer visible), scrollHeight=1788 (full below)
- Eval 30/30, corpus ALL CLEAN

## Notes
- Remaining "Reiseapotheke visibility" optional: bump tile order (currently #15 of 40) — user may want it higher
- Sources list in AI answer can include retrieval noise (unrelated blocks) — cosmetic, not blocking
