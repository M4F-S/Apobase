"""RAG: ChromaDB vector store + multilingual embeddings + retrieval."""
import os
import re
import glob
import logging

import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer

log = logging.getLogger("rag")

CORPUS_DIR = os.environ.get("CORPUS_DIR", "/app/app/corpus")
DB_DIR = os.environ.get("DB_DIR", "/app/data/chroma")
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"  # German-capable, small, CPU

# Domain alias: pharmacy terms in questions → corpus files that hold the answer.
# Used as hard retrieval signal when vector similarity is weak (e.g. "1-0-1",
# "°", "[6]-Feld", "Packungen" — tokens that don't lexically match filenames).
ALIASES = {
    "unterschrift": ["nullretax", "retax-check", "pharm-bedenken"],
    "1-0-1": ["abkuerzungen"],
    "101": ["abkuerzungen"],
    "grad": ["abkuerzungen"],
    "tropfen": ["abkuerzungen"],
    "feld": ["abkuerzungen"],
    "packung": ["auseinzeln"],
    "packungen": ["auseinzeln"],
    "rezeptur": ["auseinzeln", "rezeptur"],
    "rezepturen": ["auseinzeln", "rezeptur"],
    "dosierung": ["dosierung-rechner"],
    "dosis": ["dosierung-rechner"],
    "ibuprofen": ["dosierung-rechner"],
    "paracetamol": ["dosierung-rechner"],
    "kindern": ["dosierung-rechner"],
    "säugling": ["dosierung-rechner"],
    "saeugling": ["dosierung-rechner"],
    "impf": ["impfstoffe"],
    "stiko": ["impfstoffe"],
    "malaria": ["malaria"],
    "reise": ["reiseapotheke"],
    "homöopath": ["homoeopathie", "homoeopathie-gkv"],
    "homoeopath": ["homoeopathie", "homoeopathie-gkv"],
    "bachblüten": ["bachblueten"],
    "cannabis": ["cannabis"],
    "erezept": ["erezept"],
    "e-rezept": ["erezept"],
    "btm": ["btm-vorschriften"],
    "betäubungsmittel": ["btm-vorschriften"],
    "aut-idem": ["aut-idem-kreuz"],
    "autidem": ["aut-idem-kreuz"],
    "giftnotruf": ["notfall"],
    "vergift": ["notfall"],
    "giftinfo": ["notfall"],
    "notfalldepot": ["notfalldepot", "notfall"],
    "sonder-pzn": ["sonder-pzn"],
    "sonderpzn": ["sonder-pzn"],
    "retax": ["nullretax", "retax-check"],
    "nullretax": ["nullretax", "retax-check"],
    "einzelimport": ["einzelimport"],
    "import": ["einzelimport"],
    "penicillin": ["antibiotika", "alternativen-ampicillin"],
    "ampicillin": ["alternativen-ampicillin", "antibiotika"],
    "amoxicillin": ["alternativen-ampicillin", "antibiotika"],
    "kopf": ["laeusemittel"],
    "läuse": ["laeusemittel"],
    "lause": ["laeusemittel"],
    "vitamin": ["vitamin-d", "vitamine"],
    "gkv": ["homoeopathie-gkv", "cannabis"],
    "kassenrezept": ["rezepte", "fristen"],
    "rezept gültig": ["rezepte", "fristen"],
    "frist": ["fristen", "rezepte"],
    "gültig": ["fristen", "rezepte"],
    "gueltig": ["fristen", "rezepte"],
    "entlass": ["entlassrezept"],
    "aufbrauchfrist": ["fristen"],
    "notdienst": ["notdienst"],
    "apothekenreform": ["maga", "maga-detail"],
    "apovwg": ["maga", "maga-detail"],
    "pta": ["maga-detail", "maga"],
    "pille danach": ["pille-danach"],
    "notfallkontrazeption": ["pille-danach"],
    "levonorgestrel": ["pille-danach"],
    "ulipristal": ["pille-danach"],
    "bsnr": ["bsnr-check"],
    "betriebsstättennummer": ["bsnr-check"],
    "betriebsstaettennummer": ["bsnr-check"],
    "p-sätze": ["ghs-gefahrensaetze"],
    "h-sätze": ["ghs-gefahrensaetze"],
    "ghs": ["ghs-gefahrensaetze"],
    "clp": ["ghs-gefahrensaetze"],
    "kennzeichnung": ["ghs-gefahrensaetze"],
    "warnhinweis": ["ghs-gefahrensaetze"],
    "trockenes auge": ["trockenes-auge"],
    "tränenersatz": ["trockenes-auge"],
    "tranenersatz": ["trockenes-auge"],
    "lieferengpass": ["austausch-nichtlieferbar", "austauschverbotsliste"],
    "nicht lieferbar": ["austausch-nichtlieferbar"],
    "austausch": ["austausch-nichtlieferbar", "aut-idem-kreuz"],
    "t-rezept": ["t-rezept"],
    "trezept": ["t-rezept"],
    "abkuerzung": ["abkuerzungen"],
    "abkürzung": ["abkuerzungen"],
    "darreichungsform": ["abk-darreichungsformen"],
    "sprache": ["sprachen", "englisch"],
    "englisch": ["englisch"],
    "notfall": ["notfall", "notdienst"],
    "augen": ["trockenes-auge", "alternativen-blephamide"],
    "maga": ["maga", "maga-detail"],
}

_embedder = None
_client = None
_collection = None


def _get_embedder():
    global _embedder
    if _embedder is None:
        log.info("loading embedding model %s ...", MODEL_NAME)
        _embedder = SentenceTransformer(MODEL_NAME)
    return _embedder


def _split_chunks(text, source, max_len=2000, overlap=120):
    """Split a markdown/text document into chunks, keeping section boundaries."""
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        return []
    # split on markdown section headers first
    sections = re.split(r"(?=^## )", text, flags=re.M)
    chunks = []
    for sec in sections:
        sec = sec.strip()
        if not sec:
            continue
        if len(sec) <= max_len:
            if len(sec) >= 40:
                chunks.append({"text": sec, "source": source})
            continue
        # still too long: fall back to fixed-length splits
        for i in range(0, len(sec), max_len - overlap):
            chunk = sec[i:i + max_len]
            if len(chunk.strip()) >= 40:
                chunks.append({"text": chunk, "source": source})
    return chunks


def build_index():
    """Index all *.md files under CORPUS_DIR into ChromaDB (idempotent-ish)."""
    global _collection
    embedder = _get_embedder()
    _client = chromadb.PersistentClient(path=DB_DIR, settings=ChromaSettings(anonymized_telemetry=False))
    _collection = _client.get_or_create_collection("apobase", metadata={"hnsw:space": "cosine"})

    files = sorted(glob.glob(os.path.join(CORPUS_DIR, "*.md")))
    if not files:
        raise RuntimeError(f"no corpus files in {CORPUS_DIR}")
    log.info("indexing %d corpus files", len(files))

    docs, metas, ids = [], [], []
    n = _collection.count()
    for f in files:
        source = os.path.basename(f)
        text = open(f, encoding="utf-8").read()
        for i, c in enumerate(_split_chunks(text, source)):
            docs.append(c["text"])
            metas.append({"source": source, "chunk": i})
            ids.append(f"{source}#{i}")

    # simple refresh: wipe + re-add (corpus is small; correctness over speed)
    if n > 0:
        old_ids = _collection.get()["ids"]
        if old_ids:
            _collection.delete(ids=old_ids)
    _collection.add(ids=ids, documents=docs, metadatas=metas, embeddings=embedder.encode(docs, show_progress_bar=False).tolist())
    log.info("indexed %d chunks", len(ids))
    return len(ids)


def retrieve(query, k=5):
    """Return top-k chunks for query (hybrid: vector + keyword + filename + source-pull)."""
    embedder = _get_embedder()
    if _collection is None:
        raise RuntimeError("index not built — call build_index()")
    qv = embedder.encode([query]).tolist()
    res = _collection.query(query_embeddings=qv, n_results=min(k * 10, 80))
    out = []
    query_terms = {t.lower() for t in re.findall(r"[a-zäöüß0-9§.-]{3,}", query.lower()) if len(t) > 2}
    stop = {"der", "die", "das", "ist", "was", "wie", "und", "oder", "ein", "eine", "für", "von", "auf", "mit", "nach", "dem", "den", "bei", "zur", "zum", "sich", "nicht", "sind", "auch", "des", "im", "in", "aus", "am", "an", "als", "wird", "kann", "bei"}
    query_terms -= stop

    # source-pull: collect all chunks from files whose name matches a query term
    # (word-boundary match: "rezept" hits "rezepte" but NOT "rezeptur")
    matched_sources = set()
    all_meta = []
    if _collection is not None:
        all_meta = _collection.get(include=["metadatas"])["metadatas"]
        for meta in all_meta:
            src_l = meta["source"].replace(".md", "").replace("-", " ").lower()
            if any(re.search(rf"(^|[^a-zäöüß])({re.escape(t)})([^a-zäöüß]|$)", src_l) for t in query_terms):
                matched_sources.add(meta["source"])
    # alias-pull: domain alias table overrides weak vector similarity
    q_lower = query.lower()
    for alias, targets in ALIASES.items():
        if alias in q_lower:
            for tgt in targets:
                for meta in all_meta:
                    if meta["source"].replace(".md", "") == tgt:
                        matched_sources.add(meta["source"])

    # For each matched source, ALSO pull its best chunks directly (by vector,
    # but with the where filter) — chunks with weak embeddings still surface.
    pulled = {}
    for src in matched_sources:
        try:
            sub = _collection.query(query_embeddings=qv, n_results=5, where={"source": src})
            for doc, meta, dist in zip(sub["documents"][0], sub["metadatas"][0], sub["distances"][0]):
                key = (meta["source"], doc[:80])
                if key not in pulled:
                    pulled[key] = {"doc": doc, "meta": meta, "dist": dist}
        except Exception:
            continue

    for doc, meta, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
        text_l = doc.lower()
        kw_hits = sum(1 for t in query_terms if t in text_l)
        src_l = meta["source"].replace(".md", "").replace("-", " ").lower()
        fn_hits = sum(1 for t in query_terms if re.search(rf"(^|[^a-zäöüß])({re.escape(t)})([^a-zäöüß]|$)", src_l))
        pull_bonus = 0.25 if meta["source"] in matched_sources else 0.0
        boost = kw_hits * 0.05 + fn_hits * 0.15 + pull_bonus
        score = round(float(dist) - boost, 4)
        out.append({"text": doc, "source": meta["source"], "score": score, "kw_hits": kw_hits, "fn_hits": fn_hits, "pull": bool(pull_bonus)})

    # merged pulled chunks (source-filtered queries) — they get the same boost logic
    for (doc, meta, dist) in [(v["doc"], v["meta"], v["dist"]) for v in pulled.values()]:
        if any(o["text"][:80] == doc[:80] and o["source"] == meta["source"] for o in out):
            continue
        text_l = doc.lower()
        kw_hits = sum(1 for t in query_terms if t in text_l)
        src_l = meta["source"].replace(".md", "").replace("-", " ").lower()
        fn_hits = sum(1 for t in query_terms if re.search(rf"(^|[^a-zäöüß])({re.escape(t)})([^a-zäöüß]|$)", src_l))
        boost = kw_hits * 0.05 + fn_hits * 0.15 + 0.30
        score = round(float(dist) - boost, 4)
        out.append({"text": doc, "source": meta["source"], "score": score, "kw_hits": kw_hits, "fn_hits": fn_hits, "pull": True})

    out.sort(key=lambda r: r["score"])
    return out[:k]
