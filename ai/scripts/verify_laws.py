#!/usr/bin/env python3
"""Verify page claims against gesetze-im-internet.de law texts (live fetch)."""
import re, urllib.request, html as h

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode("utf-8", "replace")

def text(url):
    t = fetch(url)
    t = re.sub(r"<[^>]+>", " ", t)
    t = h.unescape(t)
    t = re.sub(r"\s+", " ", t)
    return t

# (claim_description, URL, needle_substring)
CHECKS = [
    ("ApBetrO §15(2) Notfalldepot — Botulismus-Antitoxin vom Pferd",
     "https://www.gesetze-im-internet.de/apobetro_1987/__15.html",
     "Botulismus-Antitoxin vom Pferd"),
    ("ApBetrO §15(2) — 11 Wirkstoffe, Tollwut-Impfstoff",
     "https://www.gesetze-im-internet.de/apobetro_1987/__15.html",
     "Tollwut-Impfstoff"),
    ("ApBetrO §15(2) — Digitalis-Antitoxin",
     "https://www.gesetze-im-internet.de/apobetro_1987/__15.html",
     "Digitalis-Antitoxin"),
    ("ApBetrO §15(2) — Opioide transdermal/transmucosal",
     "https://www.gesetze-im-internet.de/apobetro_1987/__15.html",
     "transdermaler und in transmucosaler Darreichungsform"),
    ("AMVV §3a — T-Rezept Lenalidomid/Pomalidomid/Thalidomid",
     "https://www.gesetze-im-internet.de/amvv/__3a.html",
     "Lenalidomid, Pomalidomid oder Thalidomid"),
    ("AMVV §2 — Verschreibung Inhalte",
     "https://www.gesetze-im-internet.de/amvv/__2.html",
     "Verschreibung"),
    ("AMVV §6 — repealed (weggefallen)",
     "https://www.gesetze-im-internet.de/amvv/__6.html",
     "weggefallen"),
    ("BtMVV §4 — Verschreiben BtM",
     "https://www.gesetze-im-internet.de/btmvv_1998/__4.html",
     "Verschreiben"),
    ("SGB V §31 Abs.6 — GKV-Beitragssatzstabilisierungsgesetz (Cannabis/Homöopathie cut)",
     "https://www.gesetze-im-internet.de/sgb_5/__31.html",
     "Absatz 6"),
    ("SGB V §129 — Aut-idem/Rabattvertrag",
     "https://www.gesetze-im-internet.de/sgb_5/__129.html",
     "Rabattvertrag"),
    ("SGB V §73(3) AMG — Einzelimport (AMG not SGB V!)",
     "https://www.gesetze-im-internet.de/amg_1976/__73.html",
     "Einzelimport"),
    ("AMG §73 Abs.3 — Bezug im Ausland",
     "https://www.gesetze-im-internet.de/amg_1976/__73.html",
     "Absatz 3"),
    ("SGB V §360 — E-Rezept",
     "https://www.gesetze-im-internet.de/sgb_5/__360.html",
     "elektronische Verordnung"),
    ("SGB V §34 — OTC-Ausschluss",
     "https://www.gesetze-im-internet.de/sgb_5/__34.html",
     "verschreibungspflichtig"),
    ("SGB V §106 — Wirtschaftlichkeit",
     "https://www.gesetze-im-internet.de/sgb_5/__106.html",
     "Wirtschaftlichkeit"),
    ("ApBetrO §21 — Prüfung Arzneimittel",
     "https://www.gesetze-im-internet.de/apobetro_1987/__21.html",
     "Prüfung"),
    ("ApBetrO §1 — Anwendungsbereich",
     "https://www.gesetze-im-internet.de/apobetro_1987/__1.html",
     "Apothekenbetrieb"),
    ("ApBetrO §7 — Erlaubnis/Zweigapotheken",
     "https://www.gesetze-im-internet.de/apobetro_1987/__7.html",
     "Zweigapotheke"),
    ("ApBetrO §17 — Pharmazeutische Bedenken?",
     "https://www.gesetze-im-internet.de/apobetro_1987/__17.html",
     "Bedenken"),
    ("SGB V §75 Abs.7 — BSNR/KV-Zulassung?",
     "https://www.gesetze-im-internet.de/sgb_5/__75.html",
     "Absatz 7"),
    ("SGB V §35 — Festbeträge",
     "https://www.gesetze-im-internet.de/sgb_5/__35.html",
     "Festbetrag"),
]

for label, url, needle in CHECKS:
    try:
        t = text(url)
        found = needle.lower() in t.lower()
        print(f"{'✅' if found else '❌'} {label} — needle: '{needle}' {'FOUND' if found else 'NOT FOUND'}")
    except Exception as e:
        print(f"⚠️  {label} — ERROR {type(e).__name__}: {e}")
