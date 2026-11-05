"""router: pick the profile sections that answer a question, with no LLM call.

Score = cosine(query, section) blended with keyword hits. `asked` sections are
eligible only when the question names their topic, are never pulled in through
`related` from an `open` section, and never join an overview-style question.

The index holds private text. Log section ids and scores, never bodies.
"""
import json
import math
import os
import re
import threading
import urllib.request
from collections import namedtuple

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434").rstrip("/")
EMBED_MODEL = os.environ.get("CONCIERGE_EMBED_MODEL", "nomic-embed-text")
KB_PATH = os.environ.get("CONCIERGE_KB") or os.path.expanduser("~/concierge-kb/build/index.json")

KEYWORD_WEIGHT = 0.08     # per keyword hit, on top of cosine
KEYWORD_CAP = 3           # hits counted, so a long keyword list cannot run away
# Measured on nomic-embed-text against this profile: world questions top out near
# 0.53, and the shared word "Bennett" lifts every section to about 0.55-0.70.
TOP_THRESHOLD = 0.59      # a section must reach this to answer at all
SECOND_MARGIN = 0.05      # a second section must be within this of the first
RELATED_THRESHOLD = 0.63  # a `related` section needs this on its own score
ASKED_THRESHOLD = 0.62    # the cosine floor for `asked`; see asked_eligible() for the rest
MAX_SECTIONS = 2

OVERVIEW = re.compile(
    r"^\W*(?:(?:so|ok|okay|hi|hey|hello)\W+)?(?:who(?:'s| is| are)\s+(?:bennett(?:\s+anderson)?|he|this(?:\s+guy|\s+person)?)"
    r"|(?:tell|teach)\s+me\s+(?:a\s+(?:bit|little)\s+)?about\s+(?:bennett(?:\s+anderson)?|him|yourself)"
    r"|(?:what|anything)\s+(?:should|can|could)\s+(?:i|you)\s+(?:know|tell\s+me)\s+about\s+(?:bennett|him)"
    r"|introduce\s+(?:bennett|him|me\s+to\s+bennett)|give\s+me\s+(?:an?\s+)?(?:overview|summary|bio)"
    r"|(?:bio|background|summary|overview)(?:\s+(?:of|on)\s+bennett)?)\W*$", re.I)
WORD = re.compile(r"[a-z0-9']+")
# Asking what someone thinks. Without this or a topic keyword, a question has not
# asked about views, however similar its embedding looks.
OPINION = re.compile(
    r"\b(think|thinks|opinion|opinions|view|views|believe|believes|belief|beliefs|stance|position|"
    r"positions|feel about|feels about|support|supports|oppose|opposes|agree|agrees|take on)\b", re.I)
# Keywords that are also everyday words. "right now" must not count as politics.
AMBIGUOUS = {"right", "left", "rights", "food", "water", "meaning", "truth", "knowledge", "government",
             "sports", "distrust", "budget"}
ABOUT_HIM = re.compile(r"\b(?:he|his|him|bennett(?:'?s)?)\b", re.I)

Route = namedtuple("Route", "ids notes scores max_sentences")


def embed_query(text):
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/embed",
        data=json.dumps({"model": EMBED_MODEL, "input": [f"search_query: {text}"],
                         "keep_alive": -1}).encode(),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["embeddings"][0]


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na, nb = math.sqrt(sum(x * x for x in a)), math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def _fold(text):
    """Lowercase, tokenize, and drop a plural s, so 'papers' matches 'paper'."""
    return [w[:-1] if len(w) > 3 and w.endswith("s") and not w.endswith("ss") else w
            for w in WORD.findall(text.lower())]


def keyword_hits(question, keywords, skip=()):
    q = " " + " ".join(_fold(question)) + " "
    hits = 0
    for kw in keywords:
        if kw.lower() in skip:
            continue
        k = " ".join(_fold(kw))
        if k and f" {k} " in q:
            hits += 1
    return min(hits, KEYWORD_CAP)


def core_card(section):
    """First two body lines of `overview`, so pronouns resolve in every answer."""
    return "\n".join(section["body"].splitlines()[:2])


class KnowledgeBase:
    """The loaded index. Reloads on SIGHUP or when the file's mtime changes. A bad
    file keeps the previous index, so a broken rebuild never takes answers down."""

    def __init__(self, path=None):
        self.path = path or KB_PATH
        self.sections, self.by_id, self.mtime = [], {}, None
        self.updated, self.hash, self.error = None, "", None
        self._reload = threading.Event()
        self._lock = threading.Lock()
        self.load()

    @property
    def ok(self):
        return bool(self.sections)

    @property
    def size(self):
        return len(self.sections)

    def request_reload(self):
        self._reload.set()      # async-signal-safe; the work happens on the next route

    def load(self):
        try:
            mtime = os.stat(self.path).st_mtime
            with open(self.path) as f:
                blob = json.load(f)
            sections = blob["sections"]
            if not sections or "overview" not in {s["id"] for s in sections}:
                raise ValueError("index has no overview section")
        except (OSError, ValueError, KeyError, TypeError) as e:
            self.error = str(e)
            return False
        with self._lock:
            self.sections, self.by_id = sections, {s["id"]: s for s in sections}
            self.mtime, self.updated = mtime, blob.get("updated")
            self.hash, self.error = blob.get("content_hash", ""), None
        return True

    def maybe_reload(self):
        forced = self._reload.is_set()
        self._reload.clear()
        try:
            changed = os.stat(self.path).st_mtime != self.mtime
        except OSError:
            changed = False
        if forced or changed:
            self.load()

    def score_all(self, question, vector):
        scored = []
        for s in self.sections:
            sc = cosine(vector, s["vector"]) + KEYWORD_WEIGHT * keyword_hits(question, s["keywords"])
            scored.append((sc, s))
        scored.sort(key=lambda p: p[0], reverse=True)
        return scored

    def select(self, question, vector):
        """Return (sections, {id: score}). Pure given a vector, so it is testable."""
        scored = self.score_all(question, vector)
        scores = {s["id"]: round(sc, 3) for sc, s in scored}
        if OVERVIEW.match(question.strip()):
            picks = [self.by_id["overview"]]
            if "status-and-goals" in self.by_id:
                picks.append(self.by_id["status-and-goals"])
            return picks, scores

        # In an opinion question "food" and "water" mean the topic. Elsewhere they,
        # and "right" in "right now", mean nothing about his views.
        skip = () if OPINION.search(question) else AMBIGUOUS

        def asked_topic(s):
            return keyword_hits(question, s["keywords"], skip=skip) > 0

        def eligible(sc, s):
            if s["tier"] != "asked":
                return sc >= TOP_THRESHOLD
            # A score alone is mostly the shared word "Bennett", so views need the topic.
            return sc >= ASKED_THRESHOLD and asked_topic(s)

        ranked = [(sc, s) for sc, s in scored if eligible(sc, s)]
        if not ranked:
            return [], scores
        top_score, top = ranked[0]
        picks = [top]
        for sc, s in ranked[1:]:
            if len(picks) >= MAX_SECTIONS:
                break
            # Filling a slot from `asked` needs the topic itself, since a score alone
            # is mostly the shared word "Bennett".
            if top_score - sc <= SECOND_MARGIN and (s["tier"] != "asked" or asked_topic(s)):
                picks.append(s)
        if len(picks) < MAX_SECTIONS:
            for rid in top.get("related", []):
                r = self.by_id.get(rid)
                if not r or r in picks or scores[rid] < RELATED_THRESHOLD:
                    continue
                # `asked` is never pulled in from `open`. Between two `asked` sections
                # the adjacent pull is the point, but it must be a close match.
                if r["tier"] == "asked" and (top["tier"] != "asked" or top_score - scores[rid] > SECOND_MARGIN):
                    continue
                picks.append(r)
                break
        return picks, scores

    def is_uncovered_opinion(self, question):
        """Asking his view on something no section mentions. Nothing here can answer
        it, and any section the embedding picked would only be a non sequitur."""
        return bool(OPINION.search(question) and ABOUT_HIM.search(question)
                    and not any(keyword_hits(question, s["keywords"]) for s in self.sections))

    def render(self, picks):
        card = core_card(self.by_id["overview"]) if "overview" in self.by_id else ""
        parts = [card] if card and not any(p["id"] == "overview" for p in picks) else []
        for p in picks:
            label = "views" if p["tier"] == "asked" else "facts"
            parts.append(f"[{label}]\n{p['body']}")
        return "\n\n".join(parts)

    def route(self, question, context=""):
        """`context` is the previous question, for follow-ups like "where?". It is
        sanitized by clean_history() first, and adds nothing a visitor could not
        have asked directly."""
        self.maybe_reload()
        if not self.ok:
            raise RuntimeError(f"KB unavailable: {self.error}")
        query = f"{context} {question}".strip() if len(question.split()) < 6 else question
        picks, scores = self.select(query, embed_query(query))
        if not picks:
            # General or world question. Still give pronouns something to resolve to.
            return Route([], core_card(self.by_id["overview"]), scores, 4)
        n = 5 if any(p["tier"] == "asked" for p in picks) else 4
        return Route([p["id"] for p in picks], self.render(picks), scores, n)
