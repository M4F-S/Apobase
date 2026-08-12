/* Sowedoo 2.0 — data: tiles, search index, links, calculator logic */
const SOWEDOO = (() => {
  // ---- tile grid (hub) ----
  const tiles = [
    { t: "Rezept-Arten", u: "rezepte.html", i: "🩺", tag: "Fristen" },
    { t: "Fristkalender", u: "fristen.html", i: "📅", tag: "Tool" },
    { t: "Giftnotruf & Notfalldepots", u: "notfall.html", i: "🚨", tag: "Notfall" },
    { t: "Rechner", u: "rechner.html", i: "🧮", tag: "Tool" },
    { t: "Schlau im HV", u: "schlau-im-hv.html", i: "💡", tag: "A–Z" },
    { t: "Antibiotika", u: "antibiotika.html", i: "💊", tag: "Thema" },
    { t: "Bachblüten", u: "bachblueten.html", i: "🌸", tag: "Thema" },
    { t: "Homöopathie", u: "homoeopathie.html", i: "🌿", tag: "Thema" },
    { t: "Biochemie", u: "biochemie.html", i: "🧪", tag: "Thema" },
    { t: "Rezeptur", u: "rezeptur.html", i: "⚗️", tag: "Thema" },
    { t: "Entlassrezept", u: "entlassrezept.html", i: "🏥", tag: "Thema" },
    { t: "BtM-Vorschriften", u: "btm.html", i: "⚖️", tag: "Recht" },
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
    { t: "Giftnotruf", d: "Giftinformationszentren (GIZ) in Deutschland.", u: "notfall.html#giftnotruf" },
    { t: "Notfalldepot", d: "§15(2) ApBetrO: 11 Pflichtwirkstoffe vorrätig.", u: "notfall.html#depot" },
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
    { t: "BtM", d: "Betäubungsmittel: Vorschriften, Verschreibungsbefugnis.", u: "btm.html" },
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

  // ---- needle/lancet calculator (ported from sowedoo.de math, verified) ----
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

if (typeof module !== "undefined") module.exports = SOWEDOO;
