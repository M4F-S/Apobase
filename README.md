# Apobase — Germany's most helpful pharmacy platform

Formerly sowedoo.de. Pharmacy info terminal for Apothekenpersonal — law-grounded,
sourced, verified. Live at **https://42berlinaiclub.de/apobase/**

## Two homes in this repo

| Path | What | Live |
|---|---|---|
| `/` (root) | Apobase website — 70+ static pages, generator (`topics.json` + `generate.js`), tools | https://42berlinaiclub.de/apobase/ |
| `/ai/` | **Apobase AI assistant** — self-contained RAG chatbot (FastAPI + ChromaDB + gpt-5.6-luna via OpenCode Go). Portable: `cd ai && docker compose up -d` on ANY machine/VPS | test page: https://42berlinaiclub.de/apobase/ai-test.html |

## AI assistant — quick start
```bash
cd ai
cp .env.example .env   # fill OPENCODE_GO_API_KEY
docker compose up -d   # -> http://localhost:8100/health
# build corpus from the live pages:
python3 scripts/build_corpus.py --src ../*.html
```

- **30/30 eval gate passed** (`ai/app/eval/questions.json` + `run_eval.py`)
- Guardrails: no diagnosis · no dose computation · 112/Giftnotruf escalation ·
  source links · disclaimer on every answer
- Model: gpt-5.6-luna via OpenCode Go (no paid API spend)

## Verification standard
Every page: law/Leitlinie source badges (✅/🟡/⚠️), "Stand:" date, `sources.json`,
disclaimer. Two-step verification: assistant checks vs law + verified DB → user reviews.

© 2026 Apobase / Mohamed Fathy
