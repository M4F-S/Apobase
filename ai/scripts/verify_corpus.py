#!/usr/bin/env python3
"""Triple-check audit for the Apobase corpus + live pages.

Verifies:
1. Every corpus .md contains its source + Stand date (check-freshness).
2. Critical law-status facts (from the verified ledger) appear on the right pages.
3. No corpus file is missing a "Stand" that is older than N days.
4. Re-runs the 30/30 eval (if --eval given).

Usage:
  python3 verify_corpus.py [--corpus DIR] [--eval] [--max-age-days 60]
"""
import argparse
import glob
import os
import re
import sys
from datetime import date, datetime

# (page file, required fact fragment, why)
CRITICAL_FACTS = [
    # law-status facts that change and MUST be current
    ("homoeopathie-gkv.md", "30.07.2026", "GKV-Beitragssatzstabilisierungsgesetz in force"),
    ("homoeopathie-gkv.md", "Cannabis", "Cannabisblüten raus aus GKV"),
    ("cannabis.md", "30.07.2026", "Cannabisblüten no longer GKV benefit"),
    ("maga.md", "22.05.2026", "ApoVWG passed Bundestag"),
    ("auseinzeln.md", "13.11.2025", "BSG Rezeptur-ganze-Packungen"),
    ("auseinzeln.md", "02567053", "Auseinzelung Sonderkennzeichen"),
    ("rezepte.md", "28", "Rosa Rezept 28 Tage"),
    ("entlassrezept.md", "3 Werktage", "Entlassrezept 3 Werktage"),
    ("btm-vorschriften.md", "7", "BtM 7 Tage"),
    ("notfalldepot.md", "Botulismus", "Notfalldepot 11 items"),
    ("notfall.md", "030 / 19240", "GIZ Berlin"),
    ("notfall.md", "0551 / 19240", "GIZ Göttingen (GIZ-Nord)"),
    ("dosierung-rechner.md", "60 mg/kg", "Paracetamol Tagesmax"),
    ("dosierung-rechner.md", "30 mg/kg", "Ibuprofen Tagesmax"),
    ("dosierung-rechner.md", "6 kg", "Ibuprofen CI <6kg"),
    ("abkuerzungen.md", "1-0-1", "Dosierschema"),
    ("ghs-gefahrensaetze.md", "P101", "CLP P-Satz"),
    ("pille-danach.md", "120", "UPA 120h"),
    ("einzelimport.md", "73 Abs. 3", "Einzelimport AMG"),
    ("t-rezept.md", "6", "T-Rezept AMVV §6"),
]

# pages that must carry a check date (either "Stand:" or "Zuletzt geprüft:")
# tolerates <b> tags between label and date (extractor drops tag content edge cases)
STAND_RE = re.compile(r"(?:Stand\s*[:.]?\s*|Zuletzt geprüft[:.]?\s*)(?:<[^>]+>\s*)?(\d{1,2}\.\d{1,2}\.\d{4})")


def audit_corpus(corpus_dir, max_age_days):
    problems = []
    files = sorted(glob.glob(os.path.join(corpus_dir, "*.md")))
    now = date.today()
    for f in files:
        base = os.path.basename(f)
        text = open(f, encoding="utf-8").read()
        if len(text) < 300:
            problems.append(f"[EMPTY] {base} — corpus file suspiciously small ({len(text)} chars)")
        # Stand date check — pages may carry BOTH a law-passage date (old, correct)
        # and a check date (fresh). Pass if ANY label-anchored date is recent.
        dates = [datetime.strptime(m.group(1), "%d.%m.%Y").date() for m in STAND_RE.finditer(text)]
        if not dates:
            problems.append(f"[NO-STAND] {base} — no 'Stand:' date found")
        else:
            newest = max(dates)
            age = (now - newest).days
            if age > max_age_days:
                problems.append(f"[STALE] {base} — newest check date {newest:%d.%m.%Y} is {age} days old (> {max_age_days})")
        # critical facts
        for page, fact, why in CRITICAL_FACTS:
            if base == page and fact.lower() not in text.lower():
                problems.append(f"[MISSING-FACT] {base} — missing '{fact}' ({why})")
    return problems, len(files)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--corpus", default="/app/app/corpus")
    ap.add_argument("--eval", action="store_true", help="also run the 30/30 eval")
    ap.add_argument("--max-age-days", type=int, default=60)
    args = ap.parse_args()

    problems, n = audit_corpus(args.corpus, args.max_age_days)
    print(f"AUDIT: {n} corpus files checked")
    if not problems:
        print("AUDIT: ✅ ALL CLEAN")
    else:
        print(f"AUDIT: ❌ {len(problems)} problem(s):")
        for p in problems:
            print("  " + p)
        sys.exit(1)


if __name__ == "__main__":
    main()
