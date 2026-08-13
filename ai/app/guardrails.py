"""Guardrails: disclaimer, escalation, refusal, source-linking."""
import re

GIFTNOTRUF = "112 (Notruf) · Giftnotruf: Berlin 030/19240, Bonn 0228/19240, Erfurt 0361/730730, Freiburg 0761/19240, Göttingen 0551/19240, Mainz 06131/19240, München 089/19240"

DISCLAIMER = (
    "\n\n—\n*Hinweis: Informationshilfe für pharmazeutisches Fachpersonal, keine Rechts- oder "
    "Therapieberatung. Ersetzt nicht Fachinformation, ABDA-Datenbank und ärztliche Rücksprache. "
    "Bei Notfällen: 112. Keine Patientendaten eingeben.*"
)

# Terms that MUST trigger escalation/refusal regardless of retrieval
EMERGENCY_TERMS = ["vergiftung", "giftnotruf", "suizid", "überdosis", "lebensgefahr", "notfall", "anaphylaxie", "bewusstlos"]
DOSE_TERMS = ["wie viel", "dosierung", "dosis", "wieviel", "mg/kg", "einnehmen soll"]
DIAGNOSIS_TERMS = ["diagnose", "was habe ich", "was könnte ich haben", "bin ich krank", "welche krankheit"]

REFUSAL_DOSE = (
    "⚠️ **Dosierung:** Ich berechne keine Dosen. Nutzen Sie den **Dosierungs-Rechner** "
    "(Apobase, Fachinfo-basiert) und prüfen Sie die aktuelle **Fachinformation** des Präparats. "
    "Bei Unsicherheit: ärztliche Rücksprache."
)
REFUSAL_DIAGNOSIS = (
    "⚠️ **Keine Diagnose:** Ich stelle keine Diagnosen. Beschreiben Sie die Symptome dem Arzt. "
    "Bei akuten Beschwerden: Arzt oder 112."
)
ESCALATION = (
    f"🚨 **Notfall-Verdacht:** Bei Vergiftung/Notfall sofort handeln — {GIFTNOTRUF}."
)


def apply_guardrails(question: str, answer: str) -> str:
    """Inject escalation/refusal/disclaimer based on question + answer."""
    q = question.lower()
    blocks = []

    if any(t in q for t in EMERGENCY_TERMS):
        blocks.append(ESCALATION)
    if any(t in q for t in DIAGNOSIS_TERMS) or any(t in answer.lower() for t in DIAGNOSIS_TERMS):
        blocks.append(REFUSAL_DIAGNOSIS)
    if any(t in q for t in DOSE_TERMS) or "mg" in q and ("kind" in q or "säugling" in q or "kinder" in q):
        blocks.append(REFUSAL_DOSE)

    parts = [answer]
    parts.extend(blocks)
    parts.append(DISCLAIMER)
    return "\n\n".join(p for p in parts if p)


def source_line(sources):
    if not sources:
        return "\n\n*Quellen: —*"
    seen = []
    for s in sources:
        rs = s.get("realsrc") or s.get("source", "")
        if rs and rs not in seen:
            seen.append(rs)
    items = " · ".join(f"`{x}`" for x in seen[:6])
    return f"\n\n**Quellen (verifiziert):** {items}"


def check_empty(question):
    return not question or not question.strip()
