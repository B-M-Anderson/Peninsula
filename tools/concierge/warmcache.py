"""warmcache — precomputed-answer store, register scorer, and activity log.

Why this exists
---------------
A 3b on four CPU cores answers in 10-20s. Most of that is unavoidable per token,
so the only way to make the site feel fast is to not run the model at all for
questions we have already seen. The box is idle almost all the time; this turns
that idle time into a cache of ready answers.

Three pieces, deliberately kept free of any poller imports so there is no
circular dependency — the poller owns the model, this owns the bookkeeping:

  Cache      normalized question -> answer, invalidated by a fingerprint of the
             system prompt + grounding doc, so editing either retires every
             stale entry automatically.
  score()    rates an answer against the formal register (contractions, filler,
             fourth-wall leaks, sentence count). Used to pick the best of N
             candidates offline, where extra generations cost nothing.
  activity   append-only JSONL of what the model did while nobody was watching.

Matching is normalized-exact only — no embeddings, no fuzzy similarity. A wrong
cache hit would serve a confidently incorrect answer about a real person, which
is far worse than a slow correct one.
"""
import hashlib
import json
import os
import re
import time

STATE_DIR = os.path.expanduser("~/.local/share/concierge")
CACHE_PATH = os.path.join(STATE_DIR, "cache.json")
ACTIVITY_PATH = os.path.join(STATE_DIR, "activity.jsonl")
ACTIVITY_MAX = 4000          # lines kept before the log is trimmed
CACHE_MAX = 400              # entries kept before the coldest are dropped

_PUNCT = re.compile(r"[^\w\s]")
_WS = re.compile(r"\s+")


def normalize(q):
    """Fold trivial variation (case, punctuation, spacing, a leading 'so'/'and')
    without touching meaning. Deliberately conservative."""
    s = _PUNCT.sub(" ", (q or "").lower())
    s = _WS.sub(" ", s).strip()
    for lead in ("so ", "and ", "ok ", "okay ", "hey ", "hi "):
        if s.startswith(lead):
            s = s[len(lead):]
    return s


def fingerprint(*parts):
    h = hashlib.sha256()
    for p in parts:
        h.update((p or "").encode("utf-8", "replace"))
        h.update(b"\x00")
    return h.hexdigest()[:16]


# ---- register scoring -------------------------------------------------------

# Explicit list, not \w+'s — "Bennett's research" is a possessive and perfectly
# formal, while "he's" is a contraction the register bans. A generic pattern
# cannot tell them apart and would penalise good answers.
CONTRACTION = re.compile(
    r"\b(?:is|are|was|were|do|does|did|has|have|had|would|could|should|will|"
    r"can|must|ai)n(?:'|’)t\b|"
    r"\b(?:i|you|he|she|it|we|they|that|there|who|what|here)(?:'|’)"
    r"(?:s|re|ve|ll|d|m)\b|"
    r"\b(?:won|shan|ca)n(?:'|’)t\b|\bwon(?:'|’)t\b|\bcan(?:'|’)t\b", re.I)
FOURTH_WALL = re.compile(
    r"\b(the (?:profile|document|record|file|context|information provided)|"
    r"provided (?:information|profile|document)|based on the (?:profile|document|information)|"
    r"my (?:instructions|rules|prompt|training)|this service (?:provides|is|describes)|"
    r"as an ai|language model|i do not have access)\b", re.I)
FILLER = re.compile(
    r"^\s*(great question|good question|sure(?: thing)?|certainly|of course|"
    r"absolutely|well[,!]|happy to help)", re.I)
FIRST_PERSON = re.compile(r"\b(i am|i'm|my name is|i have|i work|i study)\b", re.I)
SENTENCE = re.compile(r"[.!?](?:\s|$)")


def score(ans):
    """0-100 against the formal register. Returns (score, [reasons])."""
    if not ans or not ans.strip():
        return 0, ["empty"]
    a = ans.strip()
    s, why = 100, []

    if not a[-1] in ".!?":
        s -= 35
        why.append("unterminated")
    n_sent = len(SENTENCE.findall(a))
    if n_sent > 3:
        s -= 12 * (n_sent - 3)
        why.append(f"{n_sent} sentences")
    if len(a) < 25:
        s -= 30
        why.append("too short")

    for pat, pen, tag in (
        (FOURTH_WALL, 45, "fourth-wall"),
        (FIRST_PERSON, 40, "first-person"),
        (FILLER, 20, "filler opener"),
        (CONTRACTION, 12, "contraction"),
    ):
        hits = len(pat.findall(a))
        if hits:
            s -= pen if pat is FILLER else pen * min(hits, 2)
            why.append(tag)
    if "!" in a:
        s -= 10
        why.append("exclamation")
    if "\n" in a.strip():
        s -= 8
        why.append("multi-paragraph")

    return max(0, min(100, s)), why


# ---- cache ------------------------------------------------------------------

class Cache:
    def __init__(self, fp):
        self.fp = fp
        self.data = {}
        self._load()

    def _load(self):
        try:
            with open(CACHE_PATH) as f:
                blob = json.load(f)
            if blob.get("fingerprint") == self.fp:
                self.data = blob.get("entries", {})
            # fingerprint mismatch => prompt or doc changed => start clean
        except (OSError, ValueError):
            self.data = {}

    def save(self):
        os.makedirs(STATE_DIR, exist_ok=True)
        if len(self.data) > CACHE_MAX:
            keep = sorted(self.data.items(), key=lambda kv: kv[1].get("hits", 0), reverse=True)
            self.data = dict(keep[:CACHE_MAX])
        tmp = CACHE_PATH + ".tmp"
        with open(tmp, "w") as f:
            json.dump({"fingerprint": self.fp, "entries": self.data}, f, indent=1)
        os.replace(tmp, CACHE_PATH)

    def get(self, question):
        e = self.data.get(normalize(question))
        if e:
            e["hits"] = e.get("hits", 0) + 1
            e["last_hit"] = int(time.time())
        return e["a"] if e else None

    def has(self, question):
        return normalize(question) in self.data

    def put(self, question, answer, src="idle", sc=None, gen_ms=None):
        self.data[normalize(question)] = {
            "q": question, "a": answer, "src": src, "score": sc,
            "gen_ms": gen_ms, "ts": int(time.time()), "hits": 0,
        }

    def stats(self):
        hits = sum(e.get("hits", 0) for e in self.data.values())
        return len(self.data), hits


# ---- activity log -----------------------------------------------------------

def log_activity(action, **fields):
    os.makedirs(STATE_DIR, exist_ok=True)
    rec = {"ts": int(time.time()), "action": action}
    rec.update(fields)
    try:
        with open(ACTIVITY_PATH, "a") as f:
            f.write(json.dumps(rec) + "\n")
    except OSError:
        return
    try:
        if os.path.getsize(ACTIVITY_PATH) > 1_500_000:
            with open(ACTIVITY_PATH) as f:
                lines = f.readlines()[-ACTIVITY_MAX:]
            with open(ACTIVITY_PATH, "w") as f:
                f.writelines(lines)
    except OSError:
        pass


def read_activity(limit=20):
    try:
        with open(ACTIVITY_PATH) as f:
            lines = f.readlines()[-limit:]
    except OSError:
        return []
    out = []
    for ln in lines:
        try:
            out.append(json.loads(ln))
        except ValueError:
            continue
    return out
