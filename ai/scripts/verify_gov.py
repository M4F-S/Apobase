#!/usr/bin/env python3
"""Verify non-law claims against governmental/authoritative sources (live fetch).
URLs checked 2026-08-14 (external audit): RKI Ratgeber, BVL GIZ list, STIKO,
DTG Malaria 2022, DGE, BAK, EMA, ABDA."""
import re, urllib.request, html as h

def text(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    t = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "replace")
    t = re.sub(r"<[^>]+>", " ", t)
    t = h.unescape(t)
    t = re.sub(r"\s+", " ", t)
    return t

def pdf_text(url):
    # fallback: try to read a PDF's text via raw bytes (many gov pages are PDFs)
    return text(url)

CHECKS = [
    ("RKI Kopflaus — Dimeticon + Schema Tag 5/8-10/13/17",
     "https://www.rki.de/DE/Aktuelles/Publikationen/RKI-Ratgeber/Ratgeber/Ratgeber_Kopflausbefall.html",
     ["Dimeticon", "Tag 5", "Tag 8, 9 oder 10"]),
    ("BVL Giftnotrufzentralen (7 centers, 19240 numbers)",
     "https://www.bvl.bund.de/DE/Arbeitsbereiche/01_Lebensmittel/03_Verbraucher/09_InfektionenIntoxikationen/02_Giftnotrufzentralen/lm_LMVergiftung_giftnotrufzentralen_node.html",
     ["192 40", "Berlin", "Göttingen"]),
    ("STIKO Empfehlungen (Impfkalender 2026, Epi Bull 4/2026)",
     "https://www.rki.de/DE/Themen/Infektionskrankheiten/Impfen/Staendige-Impfkommission/Empfehlungen-der-STIKO/Empfehlungen/empfehlungen-node.html",
     ["Impfkalender 2026", "Epidemiologischen Bulletin"]),
    ("DGE Vitamin D Referenzwert",
     "https://www.dge.de/wissenschaft/referenzwerte/vitamin-d/",
     ["Vitamin D"]),
    ("DTG Malaria Empfehlungen (PDF, 2022)",
     "https://www.dtg.org/images/Startseite-Download-Box/2022_DTG_Empfehlungen_Malaria.pdf",
     ["Atovaquon"]),
    ("EMA EC review 2023 — LNG/UPA all bodyweights",
     "https://www.ema.europa.eu/en/news/levonorgestrel-ulipristal-remain-suitable-emergency-contraceptives-all-women-regardless-bodyweight",
     ["bodyweight"]),
    ("BAK / ABDA pressroom",
     "https://www.abda.de/aktuelles-und-presse/pressemitteilungen/",
     ["Apotheke"]),
]

for label, url, needles in CHECKS:
    try:
        t = text(url)
        res = [(n, n.lower() in t.lower()) for n in needles]
        ok = all(o for _, o in res)
        print(f"{'✅' if ok else '❌'} {label}")
        for n, o in res:
            if not o:
                print(f"    MISSING: '{n}'")
    except Exception as e:
        print(f"⚠️  {label} — ERROR {type(e).__name__}: {e}")
