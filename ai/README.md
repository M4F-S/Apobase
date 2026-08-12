# Apobase AI Assistant — self-contained RAG backend
**Runs anywhere:** `docker compose up -d` + `.env` with `OPENCODE_GO_API_KEY`.

Portable: publishes its own port (8100), no dependency on the Apobase static
site or Caddy. Front it with any proxy/domain.

## Quick start
```bash
cp .env.example .env      # put OPENCODE_GO_API_KEY in
docker compose up -d --build
curl localhost:8100/health
curl -X POST localhost:8100/chat -H 'Content-Type: application/json' \
  -d '{"question":"Wie lange ist ein rosa Kassenrezept gültig?"}'
```

## Model
Default: `gpt-5.6-luna` via **OpenCode Go** (base_url https://opencode.ai/zen/go/v1,
billing on the Go subscription — no per-token invoices). Swap in `.env` (`MODEL=...`).

## Corpus (retrieval-grounded, no free-wheeling)
- `corpus/` — markdown extracted from the **73 verified Apobase pages** + German
  law texts (ApBetrO, AM-RL, BtMVV, AMVV, CanG — public domain).
- Copyright boundary: AWMF/EMA/Fachinfo are **cite/link only**, never ingested.

## Guardrails (server-side, non-negotiable)
- Disclaimer on every answer · no diagnosis · no dose computation
- Emergency escalation (112 / Giftnotruf numbers)
- Source links in answers (retrieved chunk IDs)
- "Ich bin unsicher" fallback · GDPR: no patient data, 30-day logs

## Eval gate
`app/eval/questions.json` = 30 verified Q&A pairs. `docker compose exec ai python app/eval/run_eval.py`
scores retrieval + refusal correctness. **30/30 required before launch** (two-step:
Toy verifies → Mohamed reviews).

## Layout
```
apobase-ai/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
├── app/
│   ├── main.py         # FastAPI: /health, /chat
│   ├── rag.py          # ChromaDB + embeddings (multilingual MiniLM)
│   ├── guardrails.py   # disclaimer/escalation/refusal logic
│   ├── corpus/         # markdown knowledge base (built by build_corpus.py)
│   └── eval/
│       ├── questions.json
│       └── run_eval.py
└── scripts/
    └── build_corpus.py # host-side: extracts text from Apobase HTML → corpus/
```
