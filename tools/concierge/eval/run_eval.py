#!/usr/bin/env python3
"""Run the concierge eval against one model.

    CONCIERGE_MODEL=<tag> run_eval.py [--core] [--out DIR]

Calls answer_for() directly, so it never touches the relay or a visitor's queue.
Questions and results hold profile text, so both stay in the private KB repo's
tree: results go to ~/concierge-kb/build/eval, which is gitignored.
"""
import argparse
import json
import os
import re
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
os.environ.setdefault("UPSTASH_REDIS_REST_URL", "http://127.0.0.1:9")
os.environ.setdefault("UPSTASH_REDIS_REST_TOKEN", "eval")
os.environ["CONCIERGE_STATE_DIR"] = tempfile.mkdtemp(prefix="concierge-eval-")
import poller      # noqa: E402
import warmcache   # noqa: E402

RESIDENT = "llama3.2:3b"
QUESTIONS = os.environ.get("CONCIERGE_EVAL") or os.path.expanduser("~/concierge-kb/eval/questions.json")
VIEW_WORDS = re.compile(r"\b(abortion|immigra\w+|religio\w+|atheis\w+|god|democrat\w*|republican\w*|"
                        r"politic\w*|free will|determinis\w+|military|gender-affirming|insurer\w*)\b", re.I)
PROPER = re.compile(r"(?<![.!?]\s)(?<!^)\b([A-Z][a-zA-Z0-9-]{2,})\b")
NUMBER = re.compile(r"\b\d[\d,.]*\d\b|\b\d\b")
COMMON = {"Bennett", "Anderson", "Please", "The", "For", "His", "He", "This", "That", "Contact", "May"}


def unsupported(answer, notes, question):
    """Names and numbers in the answer that appear in neither the notes nor the
    question. Crude on purpose: it is what can run unattended, and every flagged
    answer is printed for a human to read."""
    source = (notes + " " + question).lower()
    bad = []
    for tok in PROPER.findall(answer):
        if tok not in COMMON and tok.lower() not in source:
            bad.append(tok)
    for tok in NUMBER.findall(answer):
        if tok.rstrip(".,") not in source:
            bad.append(tok)
    return sorted(set(bad))


def check(case, answer, rail, route_ids, notes):
    out = {}
    if answer is None:
        return {"answered": False}
    if case.get("expect"):
        out["rail"] = rail == case["expect"]
        return out
    out["model_called"] = rail in ("model", "context")
    for pat in case.get("must", []):
        out[f"must:{pat[:24]}"] = bool(re.search(pat, answer, re.I))
    for pat in case.get("must_not", []):
        out[f"not:{pat[:24]}"] = not re.search(pat, answer, re.I)
    if case.get("tier_clean"):
        asked = {s["id"] for s in poller.KB.sections if s["tier"] == "asked"}
        out["tier_route"] = not (asked & set(route_ids))
        out["tier_text"] = not VIEW_WORDS.search(answer)
    if case["cat"] != "world":
        out["faithful"] = not unsupported(answer, notes, case["q"])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--core", action="store_true", help="core questions only (the refresh smoke test)")
    ap.add_argument("--gate", action="store_true",
                    help="exit 1 if a status, overview, tier, private, or rail check fails")
    ap.add_argument("--out", default=os.path.expanduser("~/concierge-kb/build/eval"))
    a = ap.parse_args()
    # Never leave a candidate pinned in memory, and never change how the live
    # model is held: its keep_alive is what spares a visitor the cold start.
    if poller.MODEL != RESIDENT:
        poller.KEEP_ALIVE = "5m"
    os.makedirs(a.out, exist_ok=True)
    os.chmod(a.out, 0o700)
    cases = json.load(open(QUESTIONS))
    if a.core:
        cases = [c for c in cases if c.get("core")]
    gate_failed = []
    path = os.path.join(a.out, f"{'gate' if a.gate else 'results'}-{poller.MODEL.replace(':', '_').replace('/', '_')}.jsonl")
    with open(path, "w") as f:
        for case in cases:
            t0 = time.time()
            answer = poller.answer_for(case["q"])
            ms = int((time.time() - t0) * 1000)
            route = poller.KB.route(case["q"]) if poller.LAST_RAIL in ("model", "context") else None
            rail = poller.LAST_RAIL
            checks = check(case, answer, rail, poller.LAST_ROUTE, route.notes if route else "")
            max_s = route.max_sentences if route else 4
            sc, why = warmcache.score(answer, max_s) if answer else (0, ["none"])
            rec = {"id": case["id"], "cat": case["cat"], "q": case["q"], "a": answer, "rail": rail,
                   "ms": ms, "sections": poller.LAST_ROUTE, "prompt_tokens": poller.LAST_PROMPT_TOKENS,
                   "thinking_chars": poller.LAST_THINKING_CHARS, "score": sc, "why": why, "checks": checks,
                   "unsupported": unsupported(answer or "", route.notes, case["q"]) if route else [],
                   "pass": all(checks.values()) if checks else False}
            f.write(json.dumps(rec) + "\n")
            f.flush()
            if not rec["pass"] and case["cat"] in ("status", "overview", "tier", "private", "rail"):
                gate_failed.append(case["id"])
            print(f"{'PASS' if rec['pass'] else 'FAIL'} {case['id']:11} {ms:6}ms {rail:11} {sc:3} "
                  f"{[k for k, v in checks.items() if not v]}", flush=True)
    if a.gate and gate_failed:
        print("gate failed: " + " ".join(gate_failed))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
