# EXTERNAL AUDIT PROMPT — Apobase Platform (VPS 187.124.2.26)

You are an independent technical + content auditor. You have SSH access to the VPS and full read access to the platform. Your job: run a **technical audit** (does the website break?) and a **factual audit** (is every piece of information 100% accurate?) of the German pharmacy information platform **Apobase**. Be strict, evidence-based, and word-by-word thorough. Do NOT modify anything — audit only, report findings.

---

## 1. ACCESS THE VPS

```
ssh root@187.124.2.26
```
(You already have the SSH key configured. If asked for a passphrase, use your existing setup. If you need the host fingerprint: it is the user's personal VPS — accept it.)

Once in, confirm: `hostname && uptime`

---

## 2. WHERE THE PLATFORM LIVES

### Live website (what users see)
- **URL:** https://42berlinaiclub.de/apobase/
- **Static files (live root, served by Caddy):** `/srv/apobase/` on the VPS host
  - 74 HTML pages + `style.css`, `app.js`, `data.js`, `ai-fab.js`, `robots.txt`, `sitemap.xml`
- **Reverse proxy / routing:** Caddy container `sophia-caddy`
  - Config: `/opt/sophia-shopper/docker/Caddyfile` (bind-mounted into the container)
  - Check: `docker ps --filter name=sophia-caddy`
  - Validate config: `docker exec sophia-caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile`

### Source code (development copy)
- **Path on host:** `/root/.hermes/sowedoo/` (same files as the live root, plus the `ai/` backend)
- **GitHub repo:** `M4F-S/Apobase` (private) — the `main` branch should match the live deployment

### AI chat backend
- **Container:** `apobase-ai` (Python/FastAPI, RAG over the corpus)
- **Health:** `curl -s http://localhost:8100/health` (expect `{"status":"ok","model":"gpt-5.6-luna","chunks":161}`)
- **Code:** `/root/.hermes/sowedoo/ai/app/` → `main.py` (API), `rag.py` (retrieval), `guardrails.py` (safety), `corpus/` (71 .md knowledge files)
- **Public endpoint (through Caddy):** `POST https://42berlinaiclub.de/apobase/ai/api/chat` with JSON `{"question":"..."}`
- **Verification scripts (run inside container):**
  - `docker exec apobase-ai /opt/venv/bin/python /app/app/scripts/verify_corpus.py --corpus /app/app/corpus` → expect `AUDIT: ✅ ALL CLEAN`
  - `docker exec apobase-ai /opt/venv/bin/python /app/app/eval/run_eval.py` → expect `EVAL RESULT: 30/30`
  - `docker exec apobase-ai /opt/venv/bin/python /app/app/scripts/monthly_check.py` → all green
  - Law verification: `cd /root/.hermes/sowedoo && python3 ai/scripts/verify_laws.py` and `python3 ai/scripts/verify_gov.py`

### Deploy script
- `/root/.hermes/sowedoo/scripts/deploy-live.sh` — the ONLY sanctioned way to push source → live (it excludes `.git`, `.env`, `ai/` backend from the public root). Confirm it works.

---

## 3. TECHNICAL AUDIT — "Does the website break?"

Run every check, record PASS/FAIL with evidence.

1. **All pages load:** fetch all 74 pages over HTTPS → every one must return HTTP 200 and contain a complete HTML document. List any 404/500/empty page.
2. **Broken links:** extract every `href`/`src` from all pages → every internal link must resolve (no missing .html targets, no dead anchors to non-existent ids, no references to `themen.html`/`datenschutz.html` — those must be `index.html#themen` / `impressum.html#datenschutz`).
3. **JavaScript:** extract all inline `<script>` blocks from every page + `app.js`, `data.js`, `ai-fab.js` → syntax-check with `node --check`; zero errors. Then load the site in a real browser (headless) and confirm: no console errors, the AI chat widget (💬 button) opens and answers, tools (Dosierungs-Rechner, Retax-Check, Notfalldepot, BSNR-Check, PKA-Trainer) compute correctly.
4. **HTML validity:** all pages well-formed (balanced div/table/tr tags, proper charset utf-8, `lang="de"`).
5. **Security:**
   - No sensitive paths exposed: `/apobase/.git/*`, `/apobase/.env`, `/apobase/ai/*` must return 404.
   - No secrets anywhere in the public tree (no `.env` files, no tokens, no SSH keys, no API keys in HTML/JS).
   - Security headers present on `/apobase/`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`.
   - Unknown paths return real 404 (not a 200 homepage catch-all).
6. **Caddy config:** `caddy validate` passes; restart `docker restart sophia-caddy` → site + AI endpoint still work.
7. **AI backend health:** `/health` OK; a real chat question returns a grounded answer with a `sources` list of real law/Fachinfo labels (NOT internal .md filenames); the eval is 30/30.
8. **Consistency:** live root `/srv/apobase/` vs source `/root/.hermes/sowedoo/` — the HTML/JS/CSS files must be identical (diff them); the repo `main` must be clean/pushed.
9. **Mobile:** viewport meta present; pages readable at 375px width (spot-check 5 pages).

**Output table per check:** `[PASS|FAIL|WARN] check — evidence (HTTP code, command output, screenshot)`

---

## 4. FACTUAL AUDIT — "Is every word accurate?"

This is the critical part. The platform is for **pharmacy staff in Germany**; errors are harmful. Verify EVERY claim against primary sources. Do not trust the pages' own source badges — check the law text yourself.

### 4a. Legal citations — verify against gesetze-im-internet.de
For every page that cites a law, fetch the actual Einzelnorm and confirm the citation + claim word-for-word. Key pages and their laws:
- `rezepte.html`, `fristen.html` — §11 Abs. 4 AM-RL (28 Tage rosa), Entlassrezept 3 Werktage, BtM 7 Tage, Privat 3 Monate
- `entlassrezept.html` — 3 Werktage incl. Ausstellungstag, Rahmenvertrag §6 Abs. 6
- `notfalldepot.html`, `notfall.html` — §15 Abs. 2 ApBetrO (the 11-item list: Botulismus-Antitoxin vom Pferd, Diphtherie-Antitoxin, Schlangengift-Immunserum polyvalent Europa, Tollwut-Impfstoff, Tollwut-Immunglobulin, Varizella-Zoster-Immunglobulin, C1-Esterase-Inhibitor, Hepatitis-B-Immunglobulin, Hepatitis-B-Impfstoff, Digitalis-Antitoxin, **Opioide in transdermaler und transmucosaler Darreichungsform**); §15 Abs. 1 (Analgetika, BtM incl. Opioide zur Injektion, Glucocorticoide, Antihistaminika, med. Kohle 50 g, Tetanus, Epinephrin, NaCl 0,9%, Verbandstoffe…)
- `t-rezept.html` — **§3a AMVV** (T-Rezept = ONLY Lenalidomid, Pomalidomid, Thalidomid; official BfArM form or TI eRezept marked "T-Rezept"; prescriber must confirm safety measures per Fachinfo). ⚠️ Known past error: §6 AMVV is repealed — the page must NOT reference §6/Transfusions-/Hormonpräparate.
- `aut-idem-kreuz.html`, `austausch-nichtlieferbar.html`, `austauschverbotsliste.html`, `retax-check.html`, `nullretax.html`, `sonder-pzn.html`, `unklare-verordnung.html` — §129 SGB V (Rahmenvertrag, Austauschpflicht, Rabattvertrag), AMVV §2 (Formvorschriften), Rahmenvertrag §6 Abs. 1 (unbedeutende Fehler keine Retaxation), BKK Nullretax-Kriterien
- `cannabis.html`, `homoeopathie-gkv.html`, `homoeopathie.html`, `bachblueten.html` — §31 Abs. 6 SGB V (GKV-Beitragssatzstabilisierungsgesetz, verkündet 29.07.2026, in Kraft 30.07.2026: Homöopathika/Anthroposophika + Cannabisblüten raus aus GKV; bestimmte Extrakte/Cannabinoide bleiben unter Bedingungen)
- `btm-vorschriften.html`, `btm.html` — BtMG, BtMVV §4 (Verschreiben), Aufbewahrung 3 Jahre
- `einzelimport.html` — §73 Abs. 3 AMG
- `erezept.html` — §360 SGB V (E-Rezept seit 01.01.2024)
- `maga.html`, `maga-detail.html` — ApoVWG (BT-Drs. 21/4084), Apothekenreform 22.05.2026, PTA max. 20 Tage, Apotheken dürfen impfen
- `auseinzeln.html` — BSG-Urt. v. 13.11.2025 (Rezepturen: ganze Packungen abrechenbar), Hilfstaxe, ALVVG
- `ghs-gefahrensaetze.html` — CLP-VO (EG) 1272/2008, P-Sätze max. 6, neue Gefahrenklassen 01.05.2025/01.05.2026 (EU 2023/707)
- `bg-rezept.html` — SGB VII (Unfallversicherung, eigenes Formular)
- `bsnr-check.html` — SGB V §75 Abs. 7 (BSNR 9-stellig)
- `dosierung-rechner.html` — Fachinformationen: Paracetamol 10–15 mg/kg ED, max. 60 mg/kg/Tag, Intervall ≥6h; Ibuprofen 7–10 mg/kg ED, max. 30 mg/kg/Tag, ≥6h, kontraindiziert <6 Monate/<6 kg; PITCH-Studie
- `impressum.html` — DDG §5, MStV §18 Abs. 2, HWG (disclaimer compliance)
- `notdienst.html` — ApBetrO §1, Notdienstregelungen
- `zweigapotheken.html` — ApoG §7 (persönliche Leitung), §16 (Zweigapotheke), ApoVWG
- `pille-danach.html` — BAK-Handlungsempfehlung: LNG ≤72h, UPA ≤120h, BMI>30/70kg Hinweise
- `vitamin-d.html`, `vitamine.html` — DGE-Referenzwerte 3. Aufl. 2025: 20 µg/800 IE Erwachsene, 10 µg/400 IE Säuglinge; NVS II
- `laeusemittel.html` — RKI-Ratgeber Kopflausbefall: Dimeticon, Therapieschema Tag 1/5/8-10/13/17, nur lebende Läuse behandlungsbedürftig
- `malaria.html` — DTG-Empfehlungen: Atovaquon/Proguanil 250/100 mg täglich ab 40 kg, Doxycyclin 100 mg, Mefloquin 250 mg wöchentlich (≥90 kg: 375 mg), Standby-Therapie
- `impfstoffe.html` — STIKO-Empfehlungen (Epid. Bulletin 4/2026), Nirsevimab, Apotheken-Impfen ApoVWG
- `notfall.html` — Giftnotruf-Nummern (alle 7, from BVL list): Berlin 030/19240, Bonn 0228/19240, Erfurt 0361/730730, Freiburg 0761/19240, Göttingen 0551/19240, Mainz 06131/19240, München 089/19240

**For each:** fetch `https://www.gesetze-im-internet.de/<law>/__<sec>.html` (or the official source), confirm the claim. Note any wrong section number, wrong date, wrong dose, wrong list item, wrong phone number, or missing caveat.

### 4b. Internal consistency
- Every page's `Stand:`/`Zuletzt geprüft` date is the same (12.08.2026 or newer) and matches the Quellen-Status badge.
- No page contradicts another (e.g., a Fristen number on one page vs another).
- The 30-question eval set (`ai/app/eval/questions.json`) matches the pages: for each eval question, the expected fact must be findable on the corresponding page.

### 4c. AI answers
Ask the live chat 15–20 questions covering: prescription validity periods, Notfalldepot, T-Rezept, §31 cuts (Homöopathie + Cannabis), dosing (PCM/Ibuprofen children), GIZ numbers, Aut-idem, Retax, BSNR, E-Rezept, Lieferengpass, Pille danach, Malaria, STIKO/Impfen, ApoVWG/PTA. For each: the answer must be **factually correct**, **cite real sources** (laws/Fachinfo/ABDA — never .md filenames), and refuse properly when out of scope (dose computation → point to the Rechner; diagnosis → refuse; emergency → 112 + Giftnotruf).

### 4d. Report structure
```
FACTUAL AUDIT
  [PASS|FAIL|WARN] page — claim verified against <source URL> — result
  ...
SUMMARY
  X claims verified correct
  Y errors found (list each: page, wrong claim, correct fact, source URL)
```

---

## 5. DELIVERABLE

A single Markdown report with two sections (Technical Audit, Factual Audit), each item `[PASS|FAIL|WARN]` + evidence + the failing item's exact location (page, line, file). End with:

- **Ship verdict:** READY TO SHIP / NOT READY (with the exact blocking list)
- **Priority fixes:** P0 (breaks site or wrong safety info), P1 (wrong content, should fix before ship), P2 (cosmetic)
- **No modifications** — you are read-only. If you find something broken, report it precisely; the owner will fix it.

Be adversarial: hunt for the errors, don't confirm what's already confirmed. The platform owner specifically wants you to find anything wrong.
