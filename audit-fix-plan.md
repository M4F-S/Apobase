# Apobase — Final Audit Fix Plan (2026-08-13)

Source of truth: strict audit report (same day). Every item has a fix action, verification, and owner. Order = priority.

## P0 — Security (1 item, user action required)
| # | Issue | Fix | Verify | Owner |
|---|---|---|---|---|
| 1 | GitHub PAT was publicly downloadable via `/apobase/.git/config` (now blocked, but token must be considered compromised) | **Rotate PAT in GitHub** → update remote URL in `/opt/data/sowedoo`: `git remote set-url origin https://x-access-token:NEW@github.com/M4F-S/Apobase.git` → `git push` | `git ls-remote origin` OK | **Mohamed** (I provide steps; he clicks) |

## P1 — Content correctness (fixes already in source; DEPLOY + VERIFY + COMMIT)
| # | Issue | Fix (done in source) | Verify |
|---|---|---|---|
| 2 | notfalldepot.html §15(2) "Opioide (parenteral/transmukosal)" — wrong vs law text | → "Opioide in transdermaler und transmucosaler Darreichungsform" (verified vs gesetze-im-internet.de) | grep live page + corpus |
| 3 | notfall.html GIZ Erfurt "0361 / 730 730" inconsistent | → "0361 / 730730" | grep live |
| 4 | bachblueten.html + homoeopathie.html had ZERO source badges | → added standard "✅ Quellen-Status … Zuletzt geprüft" block | audit ALL CLEAN |
| 5 | 6 broken links in 3 tool pages (`themen.html`, `datenschutz.html`) | → `index.html#themen`, `impressum.html#datenschutz` | link-scan re-run = 0 broken |

Deploy command (safe, excludes .git/ai): `cd /opt/data/sowedoo && ./scripts/deploy-live.sh`
Verify: curl all 6 touched pages + 404 probes.

## P1 — AI correctness (3 items)
| # | Issue | Fix | Verify |
|---|---|---|---|
| 6 | Eval [19] Vitamin D 29/30 — answer correct ("800 I.E."), norm mismatch | Eval norm now strips inter-letter dots (`I.E.→ie`). Rerun eval 3×; if still 29/30, inspect actual model answer drift | `EVAL RESULT: 30/30` |
| 7 | AI corpus stale (old opioid text) | Corpus rebuilt (71 files, ALL CLEAN audit) + copied into container; re-verify after restart | `verify_corpus.py` ALL CLEAN + eval |
| 8 | Monthly check must stay green | Re-run `monthly_check.py` end-to-end | All ✅ + eval 30/30 |

## P2 — Infrastructure hardening (applied on host; BACKUP + FINAL SWEEP)
| # | Issue | Fix (applied) | Verify |
|---|---|---|---|
| 9 | Caddyfile truncated mid-audit (restored + rebuilt: ai/api route, deny .git/.env/ai, real 404s, CSP) | Host file = 235 lines, validated; **back up to `/root/.hermes/caddyfile.apobase-2026-08-13` + vault** | `caddy validate` = Valid |
| 10 | Catch-all returned homepage 200 for everything | `handle_errors` → real 404s; `try_files` without index fallback | `/apobase/nope.html` → 404 |
| 11 | No robots.txt / sitemap.xml | Created (73 URLs, disallow ai-test) — live 200 | curl both |
| 12 | No CSP on /apobase/ | CSP added (inline scripts allowed, frame-ancestors none) | header check |

## P3 — Hygiene & ship gate
| # | Action | Command |
|---|---|---|
| 13 | Commit all source fixes + deploy script + robots/sitemap + eval fix | `cd /opt/data/sowedoo && git add -A && git commit -m "strict-audit fixes: P0 .git exposure (deploy-live.sh, Caddy denies), §15(2) opioid wording, GIZ format, source badges, link fixes, CSP/404/robots/sitemap, eval norm" && git push` |
| 14 | Vault report: `apobase-final-audit-2026-08-13.md` (this plan + results) | write_file → /opt/data/vault/Analysis/ |
| 15 | FINAL SHIP SWEEP | 74 pages 200 · AI chat 200 · eval 30/30 · audit clean · secrets 404 · root site 301s intact |

## Ship gate = all of: 30/30 eval, ALL CLEAN audit, 0 broken links, 404s real, secrets blocked, git pushed.
Open question for Mohamed: rotate PAT now (P0#1) or after ship? Recommended: now.
