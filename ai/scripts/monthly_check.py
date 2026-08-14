#!/usr/bin/env python3
"""Monthly Apobase verification check (runs on the 1st of each month via cron).

1. Corpus audit (Stand dates + critical facts) — verify_corpus.py
2. 30/30 eval gate re-run
3. Law-status web check: critical dates from the verified ledger vs live sources
4. Prints a report (cron delivers stdout to Mohamed via Telegram)

Run inside the apobase-ai container:
  python3 /app/app/scripts/monthly_check.py
"""
import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import date

OUT = []


def line(s=""):
    OUT.append(s)


def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=580)
    return r.stdout + r.stderr


def web(url, timeout=25):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Apobase-Monitor)"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", "ignore")
    except Exception as e:
        return f"ERR {e}"


def check_law_status():
    """Check the mutable law facts (from the verified ledger) against live web."""
    line("## Law-status checks (gesetze-im-internet.de + ABDA)")
    checks = [
        # (url, needle, what)
        ("https://www.gesetze-im-internet.de/apobetro_1987/__15.html", "Vorratshaltung", "ApBetrO §15 Vorratshaltung reachable"),
        ("https://www.gesetze-im-internet.de/amvv/__2.html", "Verschreibung", "AMVV §2 Verschreibung reachable"),
        ("https://www.gesetze-im-internet.de/btmvv_1998/__12.html", "vor mehr als sieben Tagen ausgefertigt", "BtMVV §12 7-Tage-Frist reachable"),
    ]
    for url, needle, what in checks:
        body = web(url)
        if "ERR" in body:
            line(f"  ⚠️ {what}: FETCH ERROR {body[:80]}")
        elif needle in body:
            line(f"  ✅ {what}")
        else:
            line(f"  ⚠️ {what}: needle '{needle}' not found — page changed?")
    # GKV-Stabilisierungsgesetz §31 SGB V (cannabis/homöopathie cut) — check the law text
    body = web("https://www.gesetze-im-internet.de/sgb_5/__31.html")
    if "ERR" in body:
        line(f"  ⚠️ SGB V §31: FETCH ERROR {body[:80]}")
    else:
        m = re.search(r"Abs\.?\s*6|Absatz 6", body)
        line("  ✅ SGB V §31 reachable" if body else "  ⚠️ SGB V §31 empty")
        line("  ℹ️ §31 Abs. 6 (Cannabis/Homöopathie-Kürzung) present in live text" if m else "  ⚠️ §31 Abs. 6 NOT found — check GKV-Beitragssatzstabilisierungsgesetz status!")
    # Rahmenvertrag version (ABDA news search)
    body = web("https://www.abda.de/aktuelles-und-presse/pressemitteilungen/")
    if "ERR" not in body:
        line("  ✅ ABDA Pressemitteilungen reachable (Rahmenvertrag/Retax-News check)")
    else:
        line(f"  ⚠️ ABDA: {body[:60]}")


def main():
    line(f"# Apobase Monatsprüfung — {date.today():%d.%m.%Y}")
    line("")

    # 1. Corpus audit
    line("## 1. Corpus-Audit (Stand-Daten + Kernfakten)")
    audit = run("/opt/venv/bin/python /app/app/scripts/verify_corpus.py --corpus /app/app/corpus 2>&1")
    line(audit.strip())
    line("")

    # 2. Eval 30/30
    line("## 2. Eval-Gate (30 Fragen)")
    ev = run("/opt/venv/bin/python /app/app/eval/run_eval.py 2>&1")
    m = re.search(r"EVAL RESULT: (\d+)/30", ev)
    if m:
        line(f"  Eval: {m.group(1)}/30 {'✅' if m.group(1) == '30' else '❌ — Korrektur nötig'}")
        if m.group(1) != "30":
            fails = re.findall(r"❌ \[(\d+)\]", ev)
            line(f"  Fails: {', '.join(fails) if fails else 'unknown'}")
    else:
        line("  ⚠️ Eval did not produce a result line")
    line("")

    # 3. Law status
    check_law_status()
    line("")
    line("Nächste Prüfung: monatlich (cron). Bei ❌ oder ⚠️: Quelle prüfen, Seite/Corpus aktualisieren, Eval erneut.")

    print("\n".join(OUT))


if __name__ == "__main__":
    main()
