#!/usr/bin/env python3
"""build_kb — validate the concierge profile and build the retrieval index.

    build_kb.py                         validate ~/concierge-kb/profile.md, write build/index.json
    build_kb.py --check PATH            validate PATH only; writes nothing, needs no embedding model
    build_kb.py --profile PATH --out P  build from and to explicit paths
    build_kb.py --check NEXT --guard-against LIVE [--inbox-has-notes]   also apply the refresh rules

Any validation failure exits non-zero and changes nothing: the output is written
to a temp file and moved into place only after every section has been embedded.

The profile lives in the private concierge-kb repo. Nothing here may copy its
text into this public repo, and error messages name the section and rule, not
the offending line, so a pasted build log cannot leak private text.
"""
import argparse
import hashlib
import json
import math
import os
import re
import sys
import tempfile
import time
import urllib.request

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434").rstrip("/")
EMBED_MODEL = os.environ.get("CONCIERGE_EMBED_MODEL", "nomic-embed-text")
TOKEN_MODEL = os.environ.get("CONCIERGE_MODEL", "llama3.2:3b")
NUM_CTX = int(os.environ.get("CONCIERGE_NUM_CTX", "4096"))
DEFAULT_PROFILE = os.path.expanduser("~/concierge-kb/profile.md")

REQUIRED = ("tier", "owner", "summary", "keywords", "related", "updated", "source")
TIERS = {"open", "asked"}
OWNERS = {"bennett", "auto"}
MAX_SECTION_TOKENS = 500
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

# Scanned against body lines only. contact-and-boundaries deliberately lists some
# of these words in its keywords so private questions route to the "keeps that
# private" line, so keywords and summaries are out of scope by design.
DENY = (
    ("phone number", re.compile(r"(?<![\d.])(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?!\d)")),
    ("street address", re.compile(
        r"\b\d{1,6}\s+(?:[NSEW]\.?\s+)?(?:[A-Z][\w'-]*\s+){1,4}"
        r"(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way|Pl|Place|Ter|Terrace)\b\.?")),
    ("private word", re.compile(r"\b(?:salary|income|rent|apartment|diagnos(?:is|es|ed))\b", re.I)),
)


class KBError(Exception):
    pass


def parse(text):
    """Return the list of sections. Raises KBError on structural problems."""
    text = re.sub(r"<!--.*?-->", "", text, count=1, flags=re.S)
    if not re.search(r"^## ", text, re.M):
        raise KBError("no sections found")
    if text[:text.index("## ")].strip():
        raise KBError("content before the first section")
    sections = []
    for block in re.split(r"^## ", text, flags=re.M)[1:]:
        head, _, rest = block.partition("\n")
        sid = head.strip()
        fields, body, in_body = {}, [], False
        for line in rest.splitlines():
            if not in_body:
                if not line.strip():
                    in_body = True
                    continue
                key, sep, val = line.partition(":")
                if not sep or key.strip() not in REQUIRED:
                    raise KBError(f"[{sid}] unrecognized header line")
                fields[key.strip()] = val.strip()
            elif line.strip():
                body.append(line.strip())
        sections.append({"id": sid, **fields, "body": body})
    return sections


def count_tokens(text):
    """chars/4 is the documented fallback; Ollama's tokenizer endpoints are not
    stable across versions, so a real count comes from prompt_eval_count."""
    try:
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/generate",
            # keep_alive -1 matters: a request without it resets the resident model
            # to Ollama's 5-minute default, and the next visitor pays the cold start.
            # shift and num_ctx must match the poller's requests exactly. Ollama sets
            # both when it starts the runner, so a request that differs needs a new
            # runner, and one pinned with keep_alive -1 never unloads to make room:
            # every poller request then waits until it times out.
            data=json.dumps({"model": TOKEN_MODEL, "prompt": text, "raw": True, "stream": False,
                             "keep_alive": -1, "shift": False,
                             "options": {"num_predict": 1, "num_ctx": NUM_CTX}}).encode(),
            headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=60) as r:
            n = json.loads(r.read()).get("prompt_eval_count")
        if isinstance(n, int) and n > 0:
            return n
    except Exception:                                         # noqa: BLE001
        pass
    return math.ceil(len(text) / 4)


def body_text(s):
    return "\n".join(s["body"])


def validate(sections, tokens=None):
    """Return every problem found, so one run reports them all."""
    tokens = tokens or (lambda t: math.ceil(len(t) / 4))
    errs, ids = [], [s["id"] for s in sections]
    for i in sorted({x for x in ids if ids.count(x) > 1}):
        errs.append(f"[{i}] duplicate section id")
    known = set(ids)
    for s in sections:
        sid = s["id"]
        if not ID.match(sid):
            errs.append(f"[{sid}] bad section id")
        missing = [k for k in REQUIRED if not s.get(k)]
        if missing:
            errs.append(f"[{sid}] missing field(s): {', '.join(missing)}")
        if s.get("tier") and s["tier"] not in TIERS:
            errs.append(f"[{sid}] tier must be one of {sorted(TIERS)}")
        if s.get("owner") and s["owner"] not in OWNERS:
            errs.append(f"[{sid}] owner must be one of {sorted(OWNERS)}")
        if s.get("updated") and not DATE.match(s["updated"]):
            errs.append(f"[{sid}] updated must be YYYY-MM-DD")
        for r in split_list(s.get("related", "")):
            if r not in known:
                errs.append(f"[{sid}] related id does not exist: {r}")
            elif r == sid:
                errs.append(f"[{sid}] section lists itself as related")
        if not s["body"]:
            errs.append(f"[{sid}] empty body")
        for n, line in enumerate(s["body"], 1):
            for label, pat in DENY:
                if pat.search(line):
                    errs.append(f"[{sid}] body line {n}: deny-list hit ({label})")
        n = tokens(body_text(s))
        if n > MAX_SECTION_TOKENS:
            errs.append(f"[{sid}] {n} tokens exceeds the {MAX_SECTION_TOKENS} budget")
    return errs


def split_list(v):
    return [x.strip() for x in (v or "").split(",") if x.strip()]


def guard(old, new, inbox_has_notes):
    """Rules a refresh may never break, checked in code rather than trusted to the
    merge prompt. Returns every violation."""
    errs = []
    before, after = {s["id"]: s for s in old}, {s["id"]: s for s in new}
    if list(before) != list(after):
        errs.append("sections were added, removed, or reordered")
    for sid in before.keys() & after.keys():
        a, b = before[sid], after[sid]
        for field in ("tier", "owner"):
            if a.get(field) != b.get(field):
                errs.append(f"[{sid}] {field} changed")
        if a.get("owner") == "bennett" and not inbox_has_notes and a["body"] != b["body"]:
            errs.append(f"[{sid}] owner:bennett body changed with no inbox note")
    return errs


def embed(texts):
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/embed",
        data=json.dumps({"model": EMBED_MODEL, "input": texts, "keep_alive": "5m"}).encode(),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        out = json.loads(r.read())["embeddings"]
    if len(out) != len(texts):
        raise KBError("embedding model returned the wrong number of vectors")
    return out


def build(sections, raw, out_path):
    docs = [f"search_document: {s['summary']}\nKeywords: {s['keywords']}\n{body_text(s)}"
            for s in sections]
    vectors = embed(docs)
    index = {
        "version": 1,
        "built": int(time.time()),
        "embed_model": EMBED_MODEL,
        "content_hash": hashlib.sha256(raw.encode()).hexdigest(),
        "updated": max(s["updated"] for s in sections),
        "sections": [{
            "id": s["id"], "tier": s["tier"], "owner": s["owner"], "summary": s["summary"],
            "keywords": split_list(s["keywords"]), "related": split_list(s["related"]),
            "updated": s["updated"], "body": body_text(s), "vector": v,
        } for s, v in zip(sections, vectors)],
    }
    out_dir = os.path.dirname(os.path.abspath(out_path))
    os.makedirs(out_dir, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=out_dir, prefix=".index-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(index, f)
        os.chmod(tmp, 0o600)
        os.replace(tmp, out_path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise
    return index


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", metavar="PATH", help="validate PATH and write nothing")
    ap.add_argument("--profile", default=DEFAULT_PROFILE)
    ap.add_argument("--out", help="default: build/index.json beside the profile")
    ap.add_argument("--guard-against", metavar="LIVE", help="with --check: also apply the refresh rules against LIVE")
    ap.add_argument("--inbox-has-notes", action="store_true", help="with --guard-against: bennett sections may change")
    a = ap.parse_args(argv)
    path = a.check or a.profile
    try:
        with open(path) as f:
            raw = f.read()
        sections = parse(raw)
        errs = validate(sections, count_tokens)
        if a.guard_against:
            with open(a.guard_against) as f:
                errs += guard(parse(f.read()), sections, a.inbox_has_notes)
        if errs:
            for e in errs:
                print(f"error: {e}", file=sys.stderr)
            print(f"{len(errs)} problem(s); nothing changed", file=sys.stderr)
            return 1
        if a.check:
            print(f"ok: {len(sections)} sections valid")
            return 0
        out = a.out or os.path.join(os.path.dirname(os.path.abspath(path)), "build", "index.json")
        index = build(sections, raw, out)
    except (OSError, ValueError, KBError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    print(f"built {out}: {len(index['sections'])} sections, hash {index['content_hash'][:12]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
