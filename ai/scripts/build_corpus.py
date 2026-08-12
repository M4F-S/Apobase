#!/usr/bin/env python3
"""Build corpus markdown from verified Apobase HTML pages + law texts.

Run on host (or anywhere with the HTML available): extracts readable text,
keeping headings + key content, strips nav/footer/scripts. Output → app/corpus/*.md
"""
import re
import os
import html as html_mod
import sys

SRC = os.environ.get("APOBASE_SRC", "/opt/data/sowedoo")
OUT = os.path.join(os.path.dirname(__file__), "..", "app", "corpus")

SKIP_FILES = {"index.html", "themen.html", "impressum.html", "datenschutz.html"}


def html_to_md(path):
    t = open(path, encoding="utf-8").read()
    # --- page title for keyword-rich Kernfakten ---
    tm = re.search(r"<title>(.*?)</title>", t, flags=re.S)
    page_title = re.sub(r"<[^>]+>", "", tm.group(1)).strip() if tm else ""
    page_title = re.sub(r"\s*[—|–-]\s*Apobase.*$", "", page_title).strip()
    # --- extract text from inline scripts too (tools embed facts in JS) ---
    js_texts = []
    for m in re.finditer(r"<script[^>]*>(.*?)</script>", t, flags=re.S):
        js = m.group(1)
        # pull quoted German strings that look like content (length > 12, has letters)
        for sm in re.finditer(r"[\"']([^\"']{12,300})[\"']", js):
            s = sm.group(1)
            if re.search(r"[äöüßÄÖÜ]|[A-Za-z]{4}", s) and not s.startswith(("http", "var ", "function", "document", "window", "this")):
                js_texts.append(s)
    t = re.sub(r"<script.*?</script>", "", t, flags=re.S)
    t = re.sub(r"<style.*?</style>", "", t, flags=re.S)
    t = re.sub(r"<nav.*?</nav>", "", t, flags=re.S)
    t = re.sub(r"<footer.*?</footer>", "", t, flags=re.S)
    t = re.sub(r"<header.*?</header>", "", t, flags=re.S)
    t = re.sub(r"<!--.*?-->", "", t, flags=re.S)
    # headings
    t = re.sub(r"<h1[^>]*>(.*?)</h1>", r"\n# \1\n", t, flags=re.S)
    t = re.sub(r"<h2[^>]*>(.*?)</h2>", r"\n## \1\n", t, flags=re.S)
    t = re.sub(r"<h3[^>]*>(.*?)</h3>", r"\n### \1\n", t, flags=re.S)
    # tables → simple rows
    t = re.sub(r"<table.*?</table>", lambda m: _table_to_md(m.group(0)), t, flags=re.S)
    # lists
    t = re.sub(r"<li[^>]*>(.*?)</li>", r"- \1", t, flags=re.S)
    # links
    t = re.sub(r"<a[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>", r"\2 (\1)", t, flags=re.S)
    # paragraphs/divs → newlines
    t = re.sub(r"</(p|div|section|ul|ol|blockquote)>", "\n", t)
    t = re.sub(r"<br[^>]*>", "\n", t)
    t = re.sub(r"<[^>]+>", " ", t)
    t = html_mod.unescape(t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n\s*\n+", "\n\n", t)
    t = t.strip()
    # JS-extracted content facts returned separately (caller puts them in Kernfakten)
    return js_texts, t.strip(), page_title


def _table_to_md(m):
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", m, flags=re.S)
    lines = []
    for r in rows:
        cells = re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", r, flags=re.S)
        cells = [re.sub(r"<[^>]+>", "", c).strip() for c in cells]
        if cells:
            lines.append(" | ".join(cells))
    return "\n".join(lines)


def main():
    os.makedirs(OUT, exist_ok=True)
    count = 0
    for f in sorted(os.listdir(SRC)):
        if not f.endswith(".html") or f in SKIP_FILES:
            continue
        js_facts, md, page_title = html_to_md(os.path.join(SRC, f))
        if len(md) < 200:
            continue
        out = os.path.join(OUT, f.replace(".html", ".md"))
        # Kernfakten = page title + JS tool data (keyword-rich + facts-rich),
        # else first ~1500 chars cut at a sentence boundary, else whole text.
        title_frag = page_title or f
        if js_facts:
            kern = f"{title_frag} | " + " | ".join(s for s in js_facts)
        elif len(md) > 1500:
            cut = md[:1500]
            last = max(cut.rfind(". "), cut.rfind("\n\n"), cut.rfind(". "), cut.rfind("."))
            kern = f"{title_frag} | " + (cut[:last + 1] if last > 600 else cut)
        else:
            kern = f"{title_frag} | {md}"
        with open(out, "w", encoding="utf-8") as w:
            w.write(f"# {f}\n\n## Kernfakten\n{f}: {kern}\n\n## Volltext\n{md}\n")
        count += 1
        print(f"  {f} → {len(md)} chars")
    print(f"\n{count} corpus files written to {os.path.abspath(OUT)}")


if __name__ == "__main__":
    main()
