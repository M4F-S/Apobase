"""FastAPI app: /health, /chat (RAG-grounded, gpt-5.6-luna via OpenCode Go)."""
import os
import logging
import time

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import rag, guardrails

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("apobase-ai")

app = FastAPI(title="Apobase AI", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

API_KEY = os.environ.get("OPENCODE_GO_API_KEY", "")
BASE_URL = os.environ.get("OPENCODE_GO_BASE_URL", "https://opencode.ai/zen/go/v1")
MODEL = os.environ.get("MODEL", "gpt-5.6-luna")

SYSTEM_PROMPT = """Du bist Apobase, der Beratungsassistent für Apothekenpersonal in Deutschland.
Antworte NACH deutschem Apothekenrecht und deutschen Leitlinien. 
Regeln:
1. Beantworte NUR mit den bereitgestellten Quellen (RETRIEVED CONTEXT). Erfinde nichts.
2. Prüfe ALLE bereitgestellten Quellenblöcke, bevor du antwortest. Wenn die Antwort in einem
   der Blöcke steht (auch nur teilweise), nutze sie. Gib erst auf, wenn KEINE Quelle
   die Information enthält.
3. Zitiere die Quellen im Antworttext (Dateiname).
4. Wenn die Quellen nicht reichen: sag "Das kann ich nicht sicher beantworten" und verweise auf Fachinformation/Arzt.
5. Keine Diagnosen. Keine Dosierungsberechnung — verweise auf den Dosierungs-Rechner und die Fachinformation.
6. Bei Vergiftung/Notfall: nenne 112 und den Giftnotruf.
7. Antwortet auf Deutsch, kurz, sachlich, für Fachpersonal.
8. Keine Werbung, neutraler Ton (HWG-konform).
"""


class ChatReq(BaseModel):
    question: str
    history: list = []  # previous turns: [{"role": "user"|"assistant", "content": "..."}]


class ChatResp(BaseModel):
    answer: str
    sources: list


@app.on_event("startup")
def startup():
    n = rag.build_index()
    log.info("corpus indexed: %d chunks", n)


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL, "chunks": rag._collection.count() if rag._collection else 0}


@app.post("/chat")
def chat(req: ChatReq):
    if guardrails.check_empty(req.question):
        return ChatResp(answer="Bitte geben Sie eine Frage ein.", sources=[])

    t0 = time.time()
    # Conversation memory: for follow-ups ("und wie sieht es mit Ibuprofen aus?")
    # retrieval uses the last user turn + current question so the query has context.
    hist = [h for h in (req.history or []) if isinstance(h, dict) and h.get("role") in ("user", "assistant")][-12:]
    prior_user = ""
    for h in hist:
        if h["role"] == "user":
            prior_user = h["content"]
    retrieval_q = f"{prior_user} {req.question}".strip() if prior_user else req.question
    sources = rag.retrieve(retrieval_q, k=8)
    ctx = "\n\n".join(f"[{i+1}] (Quelle: {s['source']})\n{s['text']}" for i, s in enumerate(sources))

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    # inject conversation memory (previous turns, no context blocks)
    for h in hist:
        messages.append({"role": h["role"], "content": h["content"][:1200]})
    # current turn with fresh retrieval context
    messages.append({"role": "user", "content": f"FRAGE:\n{req.question}\n\nRETRIEVED CONTEXT:\n{ctx}\n\nAntworte gemäß Regeln, mit Quellenangaben."})

    answer = _call_llm(messages) or ""
    answer = guardrails.apply_guardrails(req.question, answer)
    answer += guardrails.source_line(sources)
    log.info("chat q=%.60s history=%d n_sources=%d t=%.2fs", req.question, len(hist), len(sources), time.time() - t0)
    return ChatResp(answer=answer, sources=[s["source"] for s in sources])


def _call_llm(messages, retries=2):
    url = f"{BASE_URL}/chat/completions"
    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 700,
    }
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    for attempt in range(retries + 1):
        try:
            r = httpx.post(url, json=payload, headers=headers, timeout=45)
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            log.warning("LLM attempt %d failed: %s", attempt + 1, e)
            if attempt == retries:
                return f"⚠️ Der Sprachdienst ist gerade nicht erreichbar. Versuchen Sie es später erneut. ({type(e).__name__})"
            time.sleep(2)
