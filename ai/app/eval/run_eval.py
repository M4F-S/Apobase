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
            # retrieval: expected source file appears in retrieved sources
            ret_ok = any(exp_src.replace(".md", "") in s.replace(".md", "") for s in srcs)
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
