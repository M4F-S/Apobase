#!/usr/bin/env python3
"""Eval: 30/30 gate. Checks (1) retrieval: expected source in top-5; (2) answer:
expected key facts present (substring match on normalized answer)."""
import json
import os
import re
import sys
import time
import urllib.request

BASE = os.environ.get("EVAL_BASE", "http://localhost:8100")
EVAL_FILE = os.path.join(os.path.dirname(__file__), "questions.json")
CORPUS_DIR = os.environ.get("CORPUS_DIR", "/app/app/corpus")


def _build_real_src_map():
    """Map corpus filename (no .md) -> its real source label, so retrieval
    checks accept the law/Fachinfo labels the answers now cite."""
    m = {}
    import glob
    try:
        sys.path.insert(0, "/app")  # container root so `from app import rag` works
        from app import rag
        for f in glob.glob(os.path.join(CORPUS_DIR, "*.md")):
            base = os.path.basename(f).replace(".md", "")
            text = open(f, encoding="utf-8").read()
            m[base] = rag._real_sources(base + ".md", text)
    except Exception:
        pass
    return m


REAL_SRC = _build_real_src_map()


def norm(s):
    s = s.lower()
    s = re.sub(r"[^a-zäöüß0-9 %/.°-]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def ask(q):
    body = json.dumps({"question": q}).encode()
    req = urllib.request.Request(f"{BASE}/chat", data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def key_facts(a):
    """The eval now uses the short `fact` field — kept for compatibility."""
    return [a]


def main():
    qs = json.load(open(EVAL_FILE, encoding="utf-8"))
    # warm up
    try:
        ask("Warm-up: Was ist Apobase?")
    except Exception as e:
        print(f"FATAL: cannot reach {BASE}: {e}")
        sys.exit(1)

    passed = 0
    rows = []
    for i, item in enumerate(qs, 1):
        try:
            t0 = time.time()
            res = ask(item["q"])
            dt = time.time() - t0
            ans = norm(res["answer"])
            srcs = res.get("sources", [])
            exp_src = item["src"]
            fact = norm(item["fact"])
            # retrieval: the expected source file's REAL label (or its filename)
            # appears in the retrieved sources (answers now cite laws, not .md names)
            exp_real = REAL_SRC.get(exp_src.replace(".md", ""), exp_src.replace(".md", ""))
            ret_ok = any(
                exp_src.replace(".md", "") in s.replace(".md", "")
                or (exp_real and exp_real.lower()[:20] in s.lower())
                for s in srcs
            )
            # answer: the short discriminating fact appears in the answer
            fact_ok = fact in ans
            ok = ret_ok and fact_ok
            if ok:
                passed += 1
            rows.append((ok, i, item["q"][:50], exp_src, srcs[:3], ret_ok, fact_ok, round(dt, 1)))
        except Exception as e:
            rows.append((False, i, item["q"][:50], item["src"], [], False, False, f"ERR {e}"))

    print(f"\n{'='*70}\nEVAL RESULT: {passed}/{len(qs)}\n{'='*70}")
    for ok, i, q, exp, srcs, ret, fact, dt in rows:
        mark = "✅" if ok else "❌"
        print(f"{mark} [{i:02d}] {q}")
        if not ok:
            print(f"     expected src: {exp}")
            print(f"     got srcs: {srcs}")
            print(f"     retrieval_ok={ret} answer_ok={fact} t={dt}s")
    print(f"\n{'PASS' if passed == len(qs) else 'FAIL'} — gate: 30/30 required")
    return 0 if passed == len(qs) else 1


if __name__ == "__main__":
    sys.exit(main())
