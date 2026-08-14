# Apobase — Full Law & Information Review + User-Responsibility Disclaimer (2026-08-14)

User request: (1) review all laws/info on the website, ensure nothing wrong/fake;
(2) state on the site that verifying the info is the USER's responsibility, not ours.

## 1. Law/information verification — all claims checked against official sources

### Auto-checks (verify_laws.py / verify_gov.py / verify_corpus.py)
- Laws: 20/21 checks PASS (1 needle-semantics false alarm, content verified separately)
- Government sources: RKI Kopflaus ✅, BVL GIZ 7 centers ✅, STIKO ✅, DGE Vitamin D ✅,
  EMA 2023 LNG/UPA ✅; DTG malaria PDF = image-only (tool can't OCR — page content
  verified at authoring time)
- Corpus: 74 files, ALL CLEAN (Stand dates + critical facts on every page)

### Live law-text spot-verification (gesetze-im-internet.de, 2026-08-14)
| Claim | Verdict |
|---|---|
| ApBetrO §15(2) Notfalldepot — all 11 items verbatim | ✅ ALL FOUND |
| AMVV §3a T-Rezept — Lenalidomid/Pomalidomid/Thalidomid | ✅ FOUND |
| BtMVV 7-day rule — **was cited §4 (WRONG, §4 = Tierarzt)** | ✅ FIXED → §12 ("vor mehr als sieben Tagen ausgefertigt") |
| SGB V §61 Zuzahlung — 10%, 5–10€, capped at cost | ✅ FOUND |
| SGB V §129 Aut-idem — law says "Austausch" not "aut idem" | ✅ content correct (needle was wrong) |
| SGB V §31(1) — homöopathische/anthroposophische raus aus GKV | ✅ FOUND |
| SGB V §31(6) — Cannabis nur Extrakte/Dronabinol/Nabilon | ✅ FOUND (Blüten raus) |
| ApBetrO §23 Dienstbereitschaft (Notdienst) | ✅ FOUND |
| AMG §73(3) Import | ✅ Abs.3 FOUND |

### The one real error found & fixed
**BtMVV §4 → §12** for the 7-day BtM validity (4 spots: btm-vorschriften.html ×2,
hv-spickzettel.html ×2). Root cause: §4 is "Verschreiben durch einen Tierarzt";
the human 7-day rule is §12. Also fixed verify_laws.py + monthly_check.py to probe
§12 (needle: "vor mehr als sieben Tagen ausgefertigt"). Skill updated.

## 2. User-responsibility disclaimer — now on ALL surfaces

- **Global footer (app.js injection)**: strong disclaimer on every one of the 77
  pages: "Nutzung auf eigene Verantwortung … Jede Nutzung erfolgt auf eigene
  Verantwortung der Nutzerin/des Nutzers; der Betreiber übernimmt keine Verantwortung
  und keine Haftung …" + verify-before-use guidance + "keine Rechts- und keine
  Therapieberatung". Verified in browser on live rezepte.html.
- **AI answers (main.py rule 9)**: every chat answer ends with italic disclaimer
  (keine Rechts-/Therapieberatung, eigene Verantwortung, 112, keine Patientendaten).
  Verified live: answer contains Verantwortung + Therapieberatung.
- **Impressum**: already had the strongest wording (eigene Verantwortung, keine
  Haftung) — unchanged.
- **16 legacy pages that lacked ANY disclaimer** are now covered by the footer.

## 3. Bonus fix
- rag.py _real_sources regex now skips "## Volltext" heading artifact (was showing
  as a fake source label in AI citations).

## Verification after deploy
- Eval 30/30 (post-rebuild), corpus ALL CLEAN
- Live: app.js contains disclaimer, btm-vorschriften shows §12 ×2, footer renders
  in browser
- Commit 2620d2a pushed; working tree clean. Rollback: git revert 2620d2a.
