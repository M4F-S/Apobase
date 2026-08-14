/* Apobase 2.0 — data: tiles, search index, links, calculator logic */
const APOBASE = (() => {
  // ---- tile grid (hub) ----
  const tiles = [
    { t: "Rezept-Arten", u: "rezepte.html", i: "🩺", tag: "Fristen" },
    { t: "T-Rezept", u: "t-rezept.html", i: "🔴", tag: "RECHT", d: "§ 3a AMVV: nur Lenalidomid, Pomalidomid, Thalidomid; BfArM-Formular." },
    { t: "Entlassrezept", u: "entlassrezept.html", i: "🏥", tag: "Fristen", d: "3 Werktage inkl. Ausstellungstag, Sonder-Kennzeichen." },
    { t: "Fristkalender", u: "fristen.html", i: "📅", tag: "Tool" },
    { t: "Giftnotruf & Notfalldepots", u: "notfall.html", i: "🚨", tag: "Notfall" },
    { t: "HV-Spickzettel", u: "hv-spickzettel.html", i: "🗒️", tag: "Tool", d: "Fristen, Giftnotruf, Notfalldepot, Aut-idem — druckbar auf einen Blick." },
    { t: "Rechner", u: "rechner.html", i: "🧮", tag: "Tool" },
    { t: "Schlau im HV", u: "schlau-im-hv.html", i: "💡", tag: "A–Z" },
    { t: "Reiseapotheke", u: "reiseapotheke.html", i: "✈️", tag: "Thema", d: "Checkliste Basis + Tropen, Kühlkette, DTG-Empfehlungen." },
    { t: "BtM-Vorschriften", u: "btm-vorschriften.html", i: "⚖️", tag: "RECHT" },
    { t: "Cannabis", u: "cannabis.html", i: "🌿", tag: "RECHT" },
    { t: "eRezept", u: "erezept.html", i: "🖥️", tag: "RECHT" },
    { t: "Einzelimport", u: "einzelimport.html", i: "📦", tag: "RECHT" },
    { t: "Retax / Nullretax", u: "nullretax.html", i: "🛡️", tag: "HV" },
    { t: "Lieferengpass", u: "austausch-nichtlieferbar.html", i: "📦", tag: "HV", d: "Austausch bei Nichtlieferbarkeit: § 129 SGB V, Rücksprache, ApoVWG 2026." },
    { t: "Auseinzeln", u: "auseinzeln.html", i: "🔍", tag: "HV", d: "Teilmengen abgeben: Rahmenvertrag § 129 SGB V, Abrechnung 02567053, Ausnahmen." },
    { t: "Ampicillin-Alt.", u: "alternativen-ampicillin.html", i: "💊", tag: "ALT", d: "Umstellung bei Engpass/Allergie: Amoxicillin, Cephalosporine, Makrolide." },
    { t: "Alternativen A–Z", u: "alternativen.html", i: "🔁", tag: "ALT", d: "Wirkstoff-Alternativen bei Engpass: Amitriptylin, Erythromycin, Cotrimoxazol, Colchicin, Cefixim…" },
    { t: "Impfstoffe & STIKO", u: "impfstoffe.html", i: "💉", tag: "Thema", d: "STIKO-Impfkalender 2026, Erwachsenen-Impfungen, ApoVWG Impfen." },
    { t: "Pille danach", u: "pille-danach.html", i: "⏱️", tag: "Thema", d: "LNG 72h vs. UPA 120h, BAK-Beratung, Abgabe." },
    { t: "Malaria", u: "malaria.html", i: "🦟", tag: "Thema", d: "DTG-Prophylaxe: Atovaquon/Proguanil, Doxycyclin, Mefloquin, Standby." },
    { t: "Abkürzungen", u: "abkuerzungen.html", i: "🔤", tag: "Tool", d: "Rezept-Kürzel: 1-0-1, p.o., a.c., °, [7]-Feld, 2× tgl." },
    { t: "Englisch", u: "englisch.html", i: "🇬🇧", tag: "Tool", d: "Pharmacy English: Dosierung, Allergie, OTC, Notfall." },
    { t: "Läusemittel", u: "laeusemittel.html", i: "🐛", tag: "Thema", d: "RKI 2025: Dimeticon, Tag-1-17-Schema, Auskämmen, Resistenzen." },
    { t: "Vitamin D", u: "vitamin-d.html", i: "☀️", tag: "Thema", d: "DGE 800 IE, Mangel, BfR-Sicherheit, Präparate." },
    { t: "Trockenes Auge", u: "trockenes-auge.html", i: "👁️", tag: "Thema", d: "DOG/BVA: Tränenersatzstoffe, Hyaluronat, Lipid, konservierungsfrei." },
    { t: "Vitamine", u: "vitamine.html", i: "💊", tag: "Thema", d: "NVS II: D/Folsäure/Calcium/Jod, Multivitamin-Beratung, BfR." },
    { t: "GHS H/P-Sätze", u: "ghs-gefahrensaetze.html", i: "☣️", tag: "RECHT", d: "CLP: H-/P-Sätze, Kennzeichnung, ABDA-Regeln (P101/P102)." },
    { t: "BSNR-Check", u: "bsnr-check.html", i: "🔢", tag: "Tool", d: "BSNR prüfen: 9-stellig, KV-Schlüssel, IK/LANR-Abgrenzung." },
    { t: "PKA-Trainer", u: "pka-trainer.html", i: "🎓", tag: "Tool", d: "Warenkunde-Quiz: Stammpflanzen, Salbengrundlagen, Drogen." },
    { t: "Retax-Check", u: "retax-check.html", i: "🧾", tag: "Tool", d: "Rezept vor Abgabe prüfen: Formfehler, Fristen, Aut-idem, Sonder-PZN." },
    { t: "Dosierung Kinder", u: "dosierung-rechner.html", i: "🧒", tag: "Tool", d: "Paracetamol/Ibuprofen nach kg: ED, Tagesdosis, Intervall." },
    { t: "Notfalldepot", u: "notfalldepot.html", i: "🚨", tag: "Tool", d: "§ 15(2) ApBetrO: 11 Positionen interaktiv prüfen." },
    { t: "Antibiotika", u: "antibiotika.html", i: "💊", tag: "Thema" },
    { t: "Bachblüten", u: "bachblueten.html", i: "🌸", tag: "Thema" },
    { t: "Homöopathie", u: "homoeopathie.html", i: "🌿", tag: "Thema" },
    { t: "Biochemie", u: "biochemie.html", i: "🧪", tag: "Thema" },
    { t: "Rezeptur", u: "rezeptur.html", i: "⚗️", tag: "Thema" },
    { t: "Entlassrezept", u: "entlassrezept.html", i: "🏥", tag: "Thema" },
    { t: "MAGA", u: "maga.html", i: "📢", tag: "Aktuell" },
    { t: "Organisationen & Links", u: "organisationen.html", i: "🔗", tag: "Info" },
  ];

  // ---- search index ----
  const searchIndex = [
    { t: "Rosa Rezept (Kassenrezept)", d: "Gültigkeit: 28 Tage ab Ausstellung. §11 Abs. 4 AM-RL.", u: "rezepte.html#kassen" },
    { t: "Entlassrezept", d: "Gültigkeit: 3 Werktage inkl. Ausstellungstag (Entlassmanagement).", u: "rezepte.html#entlass" },
    { t: "BtM-Rezept (gelb)", d: "Gültigkeit: 7 Tage. Betäubungsmittel-Verschreibung.", u: "rezepte.html#btm" },
    { t: "Privatrezept (blau)", d: "Gültigkeit: 3 Monate.", u: "rezepte.html#privat" },
    { t: "Grünes Rezept", d: "Empfehlung, unbegrenzt gültig, keine Kassenleistung.", u: "rezepte.html#gruen" },
    { t: "28-Tage-Frist", d: "Kassenrezepte sind 28 Tage gültig.", u: "fristen.html" },
    { t: "Fristkalender", d: "Berechne das Gültigkeitsende von Rezepten.", u: "fristen.html" },
    { t: "Auseinzeln", d: "Teilmengen aus Fertigpackungen: Rahmenvertrag § 129 SGB V, Sonderkennzeichen 02567053, Ausnahmen Akutfall/Notdienst.", u: "auseinzeln.html" },
    { t: "Zuzahlung bei Stückelung", d: "Teilmengenabgabe: Zuzahlung 10 % (5–10 €) nach § 61 SGB V, Berechnung, Beispiele.", u: "zuzahlung-stueckelung.html" },
    { t: "Ampicillin Alternativen", d: "Umstellung bei Lieferengpass oder Penicillin-Allergie: Amoxicillin, Cephalosporine, Makrolide, Clindamycin.", u: "alternativen-ampicillin.html" },
    { t: "Alternativen A–Z", d: "Wirkstoff-Alternativen bei Engpass/Allergie: alle Wirkstoffe von Amitriptylin bis Verhütungsringe.", u: "alternativen.html" },
    { t: "Giftnotruf", d: "Giftinformationszentren (GIZ) in Deutschland.", u: "notfall.html#giftnotruf" },
    { t: "Notfalldepot", d: "§15(2) ApBetrO: 11 Pflichtwirkstoffe vorrätig.", u: "notfall.html#depot" },
    { t: "HV-Spickzettel", d: "Fristen, Giftnotruf, Notfalldepot, Aut-idem, Zuzahlung — druckbar.", u: "hv-spickzettel.html" },
    { t: "Nadel Rechner", d: "Preiskalkulation Spritzen/Kanülen Tax-VK.", u: "rechner.html#nadel" },
    { t: "Lanzetten Rechner", d: "Preiskalkulation Lanzetten mit 19% MwSt.", u: "rechner.html#nadel" },
    { t: "Tax-VK", d: "Taxverkaufspreis, Grundlage der Preiskalkulation.", u: "rechner.html#nadel" },
    { t: "Auseinzeln", d: "Abgabe von Teilmengen aus Packungen.", u: "schlau-im-hv.html#auseinzeln" },
    { t: "Aut-Idem", d: "Austauschregelung / Aut-idem-Kreuz.", u: "schlau-im-hv.html#autidem" },
    { t: "eRezept", d: "Elektronische Verordnung, Abgabe-Regeln.", u: "schlau-im-hv.html#erezept" },
    { t: "Antibiotika", d: "Säfte, Anmischen, Alternativen, Kreuzallergie.", u: "antibiotika.html" },
    { t: "Bachblüten", d: "Basiswissen, Dosierung, Rescue, Mittel.", u: "bachblueten.html" },
    { t: "Homöopathie", d: "Potenzierung, Dosierung, Anwendung.", u: "homoeopathie.html" },
    { t: "Biochemie", d: "Schüßler-Salze, Nummerierung, Anwendung.", u: "biochemie.html" },
    { t: "Rezeptur", d: "Herstellung, DAC/NRF, Dokumentation.", u: "rezeptur.html" },
    { t: "Entlassmanagement", d: "Entlassrezept-Regeln und Fristen.", u: "entlassrezept.html" },
    { t: "BtM", d: "Betäubungsmittel: Vorschriften, Verschreibungsbefugnis, BtM-Buch, Cannabis.", u: "btm-vorschriften.html" },
    { t: "Aut-Idem", d: "Substitutionsausschluss: Kreuz gesetzt = kein Austausch (§ 129 SGB V).", u: "aut-idem-kreuz.html" },
    { t: "Retax", d: "Nullretaxation vermeiden: Gründe, Fristen, Einspruch.", u: "nullretax.html" },
    { t: "Lieferengpass", d: "Austausch bei Nichtlieferbarkeit, Rücksprache, ApoVWG 2026.", u: "austausch-nichtlieferbar.html" },
    { t: "Pharmazeutische Bedenken", d: "Rücksprache mit Arzt, Abgabe-Dokumentation, § 17 ApBetrO.", u: "pharm-bedenken.html" },
    { t: "Unklare Verordnung", d: "Unleserlich/unvollständig: zurückfragen, nicht raten.", u: "unklare-verordnung.html" },
    { t: "OTC statt Rx", d: "OTC auf Kassenrezept: § 34 SGB V, Erstattungsausnahmen.", u: "otc-statt-rx.html" },
    { t: "Doku-Fristen", d: "BtM-Buch 3 Jahre, Rezeptur-Doku, Rücksprachen, Aufbewahrung.", u: "doku-fristen.html" },
    { t: "BG-Rezept", d: "Verordnung über Berufsgenossenschaft: Formular, Abrechnung.", u: "bg-rezept.html" },
    { t: "T-Rezept", d: "Lenalidomid, Pomalidomid, Thalidomid (§ 3a AMVV), BfArM-Formular.", u: "t-rezept.html" },
    { t: "Cannabis", d: "CanG 2024: normales Rezept, kein BtM; GKV-Blüten-Stopp 30.07.2026, Retax-Risiko.", u: "cannabis.html" },
    { t: "CanG", d: "Cannabisgesetz: Verschreibung, MedCanG, Nabilon BtM-pflichtig.", u: "cannabis.html" },
    { t: "eRezept", d: "E-Rezept: eGK/App/Token, Signatur eHBA, Fristen, Heimversorgung.", u: "erezept.html" },
    { t: "Einzelimport", d: "§ 73 Abs. 3 AMG: 4 Voraussetzungen, Prüfschema, Haftung.", u: "einzelimport.html" },
    { t: "Medizinprodukte", d: "MDR 2017/745: CE, UDI, IVD, Verbandmittel, Apotheke.", u: "medizinprodukte-recht.html" },
    { t: "Notdienst", d: "Akutversorgung, Teilnotdienste ApoVWG 2026, Notdienstfonds.", u: "notdienst.html" },
    { t: "Zweigapotheke", d: "ApoVWG 2026: leichtere Gründung, Doppelleitung, PTA-Vertretung 20 Tage.", u: "zweigapotheken.html" },
    { t: "Austausch-Verbotsliste", d: "Arzneimittel ohne Austausch: Rahmenvertrag § 129 SGB V.", u: "austauschverbotsliste.html" },
    { t: "Sonder-PZN", d: "02567053 Auseinzelung, 02566993 Teilmenge, Hilfstaxe-Anlagen.", u: "sonder-pzn.html" },
    { t: "Mehrkosten", d: "Festbetrag, Rabattvertrag, ApoVWG 2026 vorrätige Mittel.", u: "mehrkosten.html" },
    { t: "Homöopathika GKV", d: "Seit 30.07.2026 nicht mehr GKV-verordnungsfähig (§ 31 SGB V).", u: "homoeopathie-gkv.html" },
    { t: "Amitriptylin Alternativen", d: "Nortriptylin, TZA-Wechsel, neuropathischer Schmerz, CYP-Interaktionen.", u: "alternativen-amitriptylin.html" },
    { t: "Erythromycin Alternativen", d: "Clarithromycin/Azithromycin: CYP3A4, QT, Indikationen.", u: "alternativen-erythromycin.html" },
    { t: "Cotrimoxazol Alternativen", d: "HWI: Nitrofurantoin/Fosfomycin; PjP: kein Ersatz — Rücksprache.", u: "alternativen-cotrimoxazol.html" },
    { t: "Colchicin Alternativen", d: "Gichtanfall: NSAR/Kortikoide/low-dose Colchicin; Allopurinol/Febuxostat.", u: "alternativen-colchicin.html" },
    { t: "Cefixim Alternativen", d: "Cefpodoxim, Ceftibuten (orale 3.-Gen-Cephalosporine), Dosierung.", u: "alternativen-cefixim.html" },
    { t: "Benzbromaron Alternativen", d: "Allopurinol 1. Wahl, Febuxostat; Urikosurikum = Reserve.", u: "alternativen-benzbromaron.html" },
    { t: "Nortriptylin Alternativen", d: "Amitriptylin, SSRI/SNRI, Duloxetin/Gabapentin neuropathischer Schmerz.", u: "alternativen-nortriptylin.html" },
    { t: "Thiazid Alternativen", d: "HCT, Chlortalidon, Indapamid, Xipamid — Äquivalenzen, GFR-Grenze.", u: "alternativen-thiazid.html" },
    { t: "STIKO", d: "Impfkalender 2026 (Epi Bull 4/2026): Kinder, Erwachsene, RSV-Nirsevimab, ApoVWG-Impfen.", u: "impfstoffe.html" },
    { t: "Impfungen", d: "Standardimpfungen, Auffrischung, Apotheken-Impfungen (Totimpfstoffe).", u: "impfstoffe.html" },
    { t: "Reiseapotheke", d: "Basisausstattung, Tropen, Kühlkette, Dengue-ASS-Hinweis.", u: "reiseapotheke.html" },
    { t: "Pille danach", d: "Levonorgestrel 72h, Ulipristalacetat 120h, BAK-Beratung, rezeptfrei bis 21 J. Kassenleistung.", u: "pille-danach.html" },
    { t: "Notfallkontrazeption", d: "LNG/UPA, Spirale danach, Gewichts-/Interaktions-Hinweise.", u: "pille-danach.html" },
    { t: "Malaria", d: "DTG-Prophylaxe: Malarone, Doxycyclin, Mefloquin; Standby; Kinder/SS.", u: "malaria.html" },
    { t: "Tacrolimus Alternativen", d: "Pimecrolimus, topische Kortikoide, Ciclosporin; Anwendung/Altersgrenzen.", u: "alternativen-tacrolimus.html" },
    { t: "Erythromycin Gel Alternativen", d: "Akne: Clindamycin, Nadifloxacin, Duac/Epiduo, Retinoide, Resistenz.", u: "alternativen-erythromycin-gel.html" },
    { t: "Blasenspülung Alternativen", d: "Neomycin/Polymyxin, NaCl-Instillation (Waites 2006), Bakteriophagen.", u: "alternativen-blasenspuelung.html" },
    { t: "Blephamide Alternativen", d: "Blepharitis: Lidhygiene, Bibrocathol, Azithromycin 1%, Doxycyclin oral.", u: "alternativen-blephamide.html" },
    { t: "Verhütungsring Alternativen", d: "NuvaRing/Cyclelle/Ornibel, Pille/Pflaster-Umstellung, hormonfrei.", u: "alternativen-verhuetungsringe.html" },
    { t: "Naftidrofuryl Alternativen", d: "pAVK: Gehtraining, ASS/Clopidogrel, Statine, Cilostazol, S3-Leitlinie.", u: "alternativen-naftidrofuryl.html" },
    { t: "OGT Alternativen", d: "OGTT 75g, HbA1c, Nüchtern-Glukose, CGM; Teststreifen gerätespezifisch.", u: "alternativen-ogt.html" },
    { t: "Gelenkspülung Alternativen", d: "Ringer-Laktat, NaCl 0,9% bei Arthroskopie; sterile Spüllösungen.", u: "alternativen-gelenkspuelung.html" },
    { t: "Abkürzungen Rezept", d: "1-0-1, p.o., a.c., q.s., °, Ø, x-tgl-Schemata, [6]-[9]-Felder.", u: "abkuerzungen.html" },
    { t: "Darreichungsformen", d: "Tabl., Kaps., Supp., Ung., Tct., Sir., Gtt., Collyr., Spec.", u: "abk-darreichungsformen.html" },
    { t: "Englisch Apotheke", d: "Pharmacy English: Begrüßung, Rezept, Dosierung, Allergie, OTC, Notfall.", u: "englisch.html" },
    { t: "Sprachen Beratung", d: "Türkisch/Arabisch/Russisch Kernphrasen; Dolmetscher-Hinweise, DSGVO.", u: "sprachen.html" },
    { t: "Kopfläuse", d: "RKI 2025: Dimeticon, Pyrethroid-Resistenz, Tag-1/5/8-10/13/17-Schema, SS/Stillzeit.", u: "laeusemittel.html" },
    { t: "Vitamin D", d: "DGE 20 µg/800 IE, Mangeltherapie, BfR-Stellungnahme 031/2025, 25(OH)D.", u: "vitamin-d.html" },
    { t: "Trockenes Auge", d: "DOG/BVA Leitlinie 11: Tränenersatzstoffe, Viskosität, unkonserviert, Lidrandpflege.", u: "trockenes-auge.html" },
    { t: "Vitamine", d: "NVS II kritische Nährstoffe, DGE-Referenzwerte, Multivitamin-Überdosierung, BfR-Höchstmengen.", u: "vitamine.html" },
    { t: "GHS H-Sätze", d: "CLP 1272/2008: H2xx/H3xx/H4xx, EUH; P101/P102/P501, max. 6 P-Sätze (ABDA).", u: "ghs-gefahrensaetze.html" },
    { t: "H-Sätze P-Sätze", d: "Gefahren- und Sicherheitshinweise, Kennzeichnung bei Chemikalienabgabe.", u: "ghs-gefahrensaetze.html" },
    { t: "BSNR", d: "Betriebsstättennummer: 9-stellig, KV-Schlüssel, NBSNR, nicht IK/LANR.", u: "bsnr-check.html" },
    { t: "PKA Trainer", d: "Warenkunde-Quiz: Matricaria, Mentha piperita, Lanolin, O/W, Foeniculi fructus.", u: "pka-trainer.html" },
    { t: "Retax", d: "Retax-Check-Wizard: Fristen, Signatur, Aut-idem, Rabattvertrag, Sonder-PZN — Risiko-Bewertung.", u: "retax-check.html" },
    { t: "Dosierung Paracetamol Kinder", d: "10-15 mg/kg ED, max 60 mg/kg/Tag, Intervall 6h; Saft/Zäpfchen nach Gewicht.", u: "dosierung-rechner.html" },
    { t: "Dosierung Ibuprofen Kinder", d: "7-10 mg/kg ED, max 30 mg/kg/Tag, ab 6kg; Intervall ≥6h (Fachinfo 06/2026).", u: "dosierung-rechner.html" },
    { t: "Notfalldepot", d: "§15(2) ApBetrO: Botulismus-/Diphtherie-Antitoxin, Schlangengift-Immunserum, Tollwut, Varizella, C1-Inhibitor, HepB, Digitalis-Antitoxin, Opioide.", u: "notfalldepot.html" },
    { t: "MAGA", d: "Make Apotheken Great Again: eHBA, Reform, Bürokratie.", u: "maga.html" },
    { t: "Apotheke Adhoc", d: "Nachrichtenportal.", u: "https://www.apotheke-adhoc.de/" },
    { t: "DAZ", d: "Deutsche Apotheker Zeitung.", u: "https://www.deutsche-apotheker-zeitung.de/" },
    { t: "PZ", d: "Pharmazeutische Zeitung.", u: "https://www.pharmazeutische-zeitung.de/" },
    { t: "PTA-Forum", d: "Forum der Pharmazeutischen Zeitung.", u: "https://ptaforum.pharmazeutische-zeitung.de/" },
    { t: "GKV Spitzenverband", d: "Rahmenvertrag §129 SGB V.", u: "https://www.gkv-spitzenverband.de/" },
    { t: "ABDA", d: "Bundesvereinigung Deutscher Apothekerverbände.", u: "https://www.abda.de/" },
    { t: "ApBetrO §15", d: "Notfallapotheke + Notfalldepot.", u: "https://www.gesetze-im-internet.de/apobetro_1987/__15.html" },
  ];

  // ---- quick strip (hub) ----
  const quick = [
    { k: "Rosa Rezept", v: "28 Tage", s: "Gültigkeit" },
    { k: "Entlassrezept", v: "3 Werktage", s: "inkl. Ausstellungstag" },
    { k: "BtM-Rezept", v: "7 Tage", s: "gelbes Rezept" },
    { k: "Privatrezept", v: "3 Monate", s: "blaues Rezept" },
  ];

  // ---- external links ----
  const external = [
    { t: "Apotheke adhoc", u: "https://www.apotheke-adhoc.de/" },
    { t: "DAZ — Deutsche Apotheker Zeitung", u: "https://www.deutsche-apotheker-zeitung.de/" },
    { t: "PZ — Pharmazeutische Zeitung", u: "https://www.pharmazeutische-zeitung.de/" },
    { t: "PTA-Forum", u: "https://ptaforum.pharmazeutische-zeitung.de/" },
    { t: "ABDA", u: "https://www.abda.de/" },
    { t: "GKV-Spitzenverband", u: "https://www.gkv-spitzenverband.de/" },
    { t: "Gesetze im Internet (ApBetrO)", u: "https://www.gesetze-im-internet.de/apobetro_1987/" },
    { t: "Giftinformationszentren [PZ]", u: "https://www.pharmazeutische-zeitung.de/service/giftinfo/" },
    { t: "Giftnotrufe [GIZ-Nord]", u: "https://www.giz-nord.de/cms/index.php/giftnotrufliste-lang.html" },
  ];

  // ---- needle/lancet calculator (ported from apobase math, verified) ----
  // Input: Tax-VK (€, e.g. 4.36) + Stück (e.g. 100)
  // brutto/Stück = VK / Stück
  // netto/Stück  = brutto / 1.19 (MwSt 19%), auf 3 Dezimalen abgeschnitten
  // netto gerundet = kaufmännisch auf 2 Dezimalen
  // Packung = netto gerundet × Stück
  // neuer Tax-VK = Packung × 1.19
  function calcNeedle(vk, stueck) {
    const brutto = vk / stueck;
    const nettoRaw = brutto / 1.19;
    const nettoCut = Math.floor(nettoRaw * 1000) / 1000;          // 3 Dezimalen abschneiden (f_mathcut)
    const nettoRund = Math.round(nettoCut * 100) / 100;           // kaufmännisch 2 Dez.
    const packung = Math.round(nettoRund * stueck * 100) / 100;
    const neuerVK = Math.round(packung * 1.19 * 100) / 100;
    return {
      brutto: +brutto.toFixed(4),
      netto: nettoCut.toFixed(3),
      nettoRund: nettoRund.toFixed(2),
      packung: packung.toFixed(2),
      neuerVK: neuerVK.toFixed(2),
    };
  }

  // ---- generic netto/brutto converter ----
  function calcMwst(amount, rate, direction) {
    // direction: "brutto" -> given is brutto (return netto), "netto" -> given is netto (return brutto)
    const r = (rate || 19) / 100;
    if (direction === "netto") return +(amount * (1 + r)).toFixed(2);
    return +(amount / (1 + r)).toFixed(2);
  }

  // ---- Fristen: compute validity end ----
  // type: 'kassen28' | 'entlass3' | 'btm7' | 'privat3m' | 'gruen'
  function fristEnde(dateStr, type) {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d)) return null;
    const addDays = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const addMonths = (n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
    const fmt = (x) => x.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    switch (type) {
      case "kassen28": return fmt(addDays(27));      // 28 Tage gültig -> letzter Tag = +27
      case "entlass3": return fmt(addDays(2));       // 3 Werktage inkl. Ausstellungstag (approx. Kalendertage)
      case "btm7":     return fmt(addDays(6));       // 7 Tage -> letzter Tag +6
      case "privat3m": return fmt(addMonths(3));     // 3 Monate
      case "gruen":    return "unbegrenzt";
      default: return null;
    }
  }

  return { tiles, searchIndex, quick, external, calcNeedle, calcMwst, fristEnde };
})();

if (typeof module !== "undefined") module.exports = APOBASE;
