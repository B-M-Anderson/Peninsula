"""warmcache: register scorer, self-disclosure guard, and the logs.

The name is historical. The answer cache that gave it this name was removed in
concierge v2; every answer is now generated from freshly routed sections. What
remains is the bookkeeping the poller still needs:

  score()              rates an answer against the formal register.
  leaks_instructions() catches the model describing its own setup.
  activity / served    what the node did, and the permanent record of real answers.
"""
import json
import os
import re
import time

STATE_DIR = os.environ.get("CONCIERGE_STATE_DIR") or os.path.expanduser("~/.local/share/concierge")
ACTIVITY_PATH = os.path.join(STATE_DIR, "activity.jsonl")
# activity.jsonl is a rolling operational log: log_activity() trims it to the
# last ACTIVITY_MAX lines once it passes 1.5 MB. served.jsonl is the opposite: only real answers, appended, never trimmed by
# this process. It is the permanent record.
SERVED_PATH = os.path.join(STATE_DIR, "served.jsonl")
ACTIVITY_MAX = 4000          # lines kept before the log is trimmed

# ---- self-disclosure guard --------------------------------------------------
#
# The input LEAK rail in poller.py catches people ASKING for the prompt. It
# cannot catch the model volunteering it, and on 2026-08-29 a visitor typed
# "How has this conversation gone" and got back a summary that included
# "reminded the assistant to describe Bennett in the third person ... and
# maintain a formal register". Nothing in that question looks like an attack, so
# no input pattern was ever going to stop it. This checks the OUTPUT instead.
#
# Deliberately narrow. "third person" and "assistant" both appear in perfectly
# good answers about the concierge project itself, so matching those alone would
# refuse legitimate questions. Every pattern here is the model describing its own
# operating instructions, which a good answer never needs to do.
SELF_DISCLOSURE = re.compile(
    r"(system (?:prompt|message)|developer message|grounding (?:document|doc)|"
    r"my (?:instruction|guideline|rule|prompt|directive|configuration)s?\b|"
    r"(?:the )?assistant (?:was|is|has been|had been) "
    r"(?:told|instructed|reminded|asked|required|configured|programmed)|"
    r"reminded (?:the assistant|me) to|"
    r"I (?:was|have been|had been|am being) "
    r"(?:told|instructed|reminded|programmed|configured)|"
    r"(?:instructed|reminded|told) to (?:describe|answer|respond|maintain|write|refer)|"
    r"maintain a formal register|"
    r"formal register|"
    r"in the third[- ]person(?:\s+(?:as|per|because|since)\b)|"
    r"according to (?:my|the) (?:instruction|prompt|rule|guideline))", re.I)


def leaks_instructions(text):
    """True when an answer is describing how the model was set up.

    Runs on every generated answer, because no input pattern can stop this.
    """
    return bool(SELF_DISCLOSURE.search(text or ""))


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


def score(ans, max_sentences=4):
    """0-100 against the formal register. Returns (score, [reasons])."""
    if not ans or not ans.strip():
        return 0, ["empty"]
    a = ans.strip()
    s, why = 100, []

    if not a[-1] in ".!?":
        s -= 35
        why.append("unterminated")
    n_sent = len(SENTENCE.findall(a))
    if n_sent > max_sentences:
        s -= 12 * (n_sent - max_sentences)
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


# ---- activity log -----------------------------------------------------------

def log_served(**fields):
    """Append one permanently-retained record of a real answer.

    Deliberately separate from log_activity():
      * it is never trimmed, so history does not quietly evaporate;
      * only real visitor traffic lands here, so the file stays small -- a few
        hundred bytes per answer means years fit in a handful of megabytes;
      * a failure to write must never cost a visitor their answer, so it is
        wrapped and swallowed rather than raised.

    Rotation, if it is ever wanted, is logrotate's job with no expiry. The
    application does not delete its own audit trail.
    """
    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        rec = {"ts": int(time.time()), **fields}
        with open(SERVED_PATH, "a") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    except Exception:                                        # noqa: BLE001
        pass


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
