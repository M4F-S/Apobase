# Apobase — Final Skeptical Deep Review (2026-08-14)

Purpose: post-modernization adversarial re-verification. Everything below was TESTED, not assumed.

## Git / GitHub state ✅
- Repo `M4F-S/Apobase`, branch main, HEAD = **`535d5df`** (frontend modernization report)
- `git status` clean (no uncommitted changes), `git fetch` → no ahead/behind (fully pushed)
- Commit chain preserved: `354e0ae` (external audit fixes) → `3facbc9` (modernization) → `535d5df` (report)

## Live vs source integrity ✅
- 12 critical files MD5-identical live vs source: index.html, style.css, tokens.css, app.js, data.js, ai-fab.js, sw.js, dosierung-rechner.html, notfalldepot.html, retax-check.html, t-rezept.html, schlau-im-hv.html

## Security re-verification ✅ (all 404)
- /apobase/.git/config · .env · ai/app/main.py · scripts/deploy-live.sh · README.md · frontend-modernization-report.md → all 404
- Deploy script excludes: .git, .git*, ai, ai/, scripts, scripts/, *.env, *.md, README.md, audit-fix-plan.md, external-audit-prompt.md
- CSP: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' + fonts; font-src + gstatic; connect-src 'self' (AI chat same-origin OK); frame-ancestors 'none'
- sw.js served as text/javascript with nosniff ✅

## Dark/light theme — adversarial check ✅
- Fresh load (no localStorage): light, bg rgb(246,247,248), dark text rgb(23,28,38) — correct contrast
- Toggle → dark: bg rgb(9,9,11) = exact #09090b token, stored "dark", button ☀️
- **Legacy pages (retax/dosierung/notfalldepot)**: inline hardcoded colors (#f2e8da, #190e0a, rgba gold) were a RISK — verified they resolve through var(--text)/var(--accent) aliases defined in tokens.css, so they adapt in both themes. Computed styles confirmed.
- Note: one browser read returned stale styles immediately after setAttribute (reflow timing); re-read after navigation confirmed correct behavior — not a bug.

## Interactive components (live prod browser) ✅
- Command palette (⌘K): opens, filters ("t-rezept" → 1 result), grouped by category
- Theme toggle on prod: works, persisted
- **AI drawer on prod through Caddy**: "Wie lange gilt ein BtM-Rezept?" → "7 Kalendertage ab Ausstellungsdatum, § 4 BtMVV" with real source citations (BtMVV §4 · BtMG · AM-RL §11 Abs. 4 · ABDA) — end-to-end ✅
- Dosierung: PCM 12.5kg → 125–188mg / 750mg/day / 6h; IBU <6kg → Kontraindiziert warning
- Notfalldepot: localStorage persists {"0":true}, score 1/11
- Retax wizard: step 1 done → step 2 cur progress chips
- 0 console errors, 0 JS errors on all pages

## Content integrity (last modernization pass) ✅
- Stale T-Rezept text ("Transfusions-/Hormonpräparate: § 6 AMVV") found in data.js searchIndex + schlau-im-hv.html DURING this pass — both fixed to §3a AMVV (Lenalidomid/Pomalidomid/Thalidomid)
- grep sweep: 0 hits for Transfusions/Hormonpräparate in all 74 HTML
- Eval 30/30 × 3 consecutive runs
- Corpus audit ALL CLEAN (71 files)

## Static analysis ✅
- check_js.py: 0 JS errors (all pages)
- audit_links.py: 74 pages, 0 broken local refs
- PWA: sw.js registered only on https (guard), cache-first assets / network-first pages, scope = /apobase/

## Verdict
**PASS — ship-ready.** No regressions from the modernization. Two real issues were found during the skeptical pass (stale T-Rezept in search index + overview table) and both are fixed, deployed, committed, and verified. Git fully pushed. Vault reports saved (20+ apobase analysis files).

Remaining (out of my control): PAT rotation for the previously-exposed token; optional Caddyfile `caddy fmt` (cosmetic).
