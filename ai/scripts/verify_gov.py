#!/usr/bin/env python3
"""Verify non-law claims against governmental/authoritative sources (live fetch)."""
import re, urllib.request, html as h

def text(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    t = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "replace")
    t = re.sub(r"<[^>]+>", " ", t)
    t = h.unescape(t)
    t = re.sub(r"\s+", " ", t)
    return t

CHECKS = [
    ("RKI Läuse — nur lebende Läuse behandlungsbedürftig, Dimeticon (RKI-Ratgeber)",
     "https://www.rki.de/DE/Content/Infekt/EpidBull/Merkblaetter/Ratgeber_Laeusebefall.html",
     "Dimeticon"),
    ("DGE Vitamin D Referenzwert 20 µg/800 IE Erwachsene",
     "https://www.dge.de/wissenschaft/referenzwerte/vitamin-d/",
     "20"),
    ("BZgA Giftnotruf/GIZ Telefonnummern",
     "https://www.bzga.de/service/notrufnummern/",
     "19240"),
    ("STIKO Impfkalender / Empfehlungen",
     "https://www.rki.de/DE/Content/Kommissionen/STIKO/Empfehlungen/Impfempfehlung_node.html",
     "Impfung"),
    ("BfArM T-Rezept Formblatt (Lenalidomid/Pomalidomid/Thalidomid)",
     "https://www.bfarm.de/DE/Arzneimittel/Arzneimittelzulassung/Antragsverfahren/AMHandel/Lenalidomid.html",
     "Lenalidomid"),
    ("DTG Malaria (Deutsche Gesellschaft für Tropenmedizin)",
     "https://www.dtg.org/empfehlungen-und-leitlinien/empfehlungen/malaria-kurzfassung.html",
     "Atovaquon"),
    ("BAK Pille danach Handlungsempfehlung (LNG 72h / UPA 120h)",
     "https://www.abda.de/aktuelles-und-presse/pressemitteilungen/",
     "Pille"),
    ("GKV-Spitzenverband Rahmenvertrag §129",
     "https://www.gkv-spitzenverband.de/krankenversicherung/arzneimittel/rahmenvertrag/rahmenvertrag.jsp",
     "Rahmenvertrag"),
    ("Pharmazeutische Zentralbibliothek / ABDA ABDA-Datenbank",
     "https://www.abda.de/",
     "Apotheke"),
]

for label, url, needle in CHECKS:
    try:
        t = text(url)
        found = needle.lower() in t.lower()
        print(f"{'✅' if found else '❌'} {label} — '{needle}' {'FOUND' if found else 'NOT FOUND'}")
    except Exception as e:
        print(f"⚠️  {label} — ERROR {type(e).__name__}: {e}")
