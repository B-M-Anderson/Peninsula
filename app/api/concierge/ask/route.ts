import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { redis, relayConfigured, KEYS } from "../upstash";
import { sameSecret } from "../../../lib/secret";
import type { AskResponse } from "../../../lib/api-types";

// Concierge ask endpoint. Every question is enqueued to the desktop node via the
// Upstash relay; we poll for the answer and return it. On timeout or any error we
// FAIL CLOSED (answer:null -> UI shows the honest offline message). No canned
// intercepts — the model answers everything, so real questions aren't hijacked.

export const maxDuration = 60; // must exceed ANSWER_WAIT_MS (Vercel Hobby allows up to 60s)

const MAX_QUESTION_LENGTH = 500;
// Follow-ups ("where?", "tell me more") are meaningless without the turns before
// them. Only a couple are carried: the node runs a 3b on CPU and pays for every
// prompt token. The node re-validates all of this — never trust the browser.
const MAX_HISTORY_TURNS = 2;
const MAX_HISTORY_CHARS = 400;

// Guard rails against a flood: the node is one CPU in a house and the relay's
// free tier has a daily command budget. Priority sessions are exempt from the
// per-address limit (that is what the passphrase buys) but not the queue cap.
const RATE_LIMIT_PER_MIN = 6;
const QUEUE_CAP = 25;

type Turn = { q: string; a: string };

function cleanHistory(raw: unknown): Turn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-MAX_HISTORY_TURNS)
    .map((t) => {
      const o = (t ?? {}) as Record<string, unknown>;
      return {
        q: String(o.q ?? "").slice(0, MAX_HISTORY_CHARS),
        a: String(o.a ?? "").slice(0, MAX_HISTORY_CHARS),
      };
    })
    .filter((t) => t.q.trim() && t.a.trim());
}
const ANSWER_WAIT_MS = 45000; // warm answers ~9-25s; generous ceiling before failing closed
// Cached answers land within a second or two, so poll briskly at first, then
// settle down — the browser's own progress poll covers the long waits.
const POLL_FAST_MS = 500;
const POLL_FAST_FOR_MS = 3000;
const POLL_SLOW_MS = 1200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const offline = () => NextResponse.json({ online: false, canned: false, answer: null } satisfies AskResponse);

/** The fast-lane passphrase, or null when the fast lane is switched off. */
const priorityCode = () => process.env.CONCIERGE_PRIORITY_CODE || null;

export async function POST(req: Request) {
  // A cross-site form post can't set this header without a CORS preflight, so
  // requiring it keeps third-party pages from enqueuing questions on a
  // visitor's behalf.
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return NextResponse.json({ error: "expected application/json" }, { status: 415 });
  }

  let question = "";
  let history: Turn[] = [];
  let clientId = "";
  try {
    const body = await req.json();
    question = String(body.question ?? "").slice(0, MAX_QUESTION_LENGTH);
    history = cleanHistory(body.history);
    // The page may name its own job so it can poll that job's progress while this
    // request is still open. Only accept an id shaped like a uuid.
    const raw = String(body.id ?? "");
    if (/^[0-9a-f-]{8,64}$/i.test(raw)) clientId = raw;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!question.trim()) {
    return NextResponse.json({ error: "empty question" }, { status: 400 });
  }

  // The passphrase typed as a question unlocks the fast lane instead of being
  // asked. Checked here, in constant time, so the code never leaves the server.
  const code = priorityCode();
  if (code && sameSecret(question.trim(), code)) {
    return NextResponse.json({ online: true, answer: null, unlocked: true } satisfies AskResponse);
  }

  // No relay configured -> honest offline (unchanged behavior).
  if (!relayConfigured()) return offline();

  // Priority pass: the /ask box sends this header once someone has unlocked the
  // fast lane. Priority jobs RPUSH to the tail so the poller's BRPOP grabs them
  // next — ahead of everyone already queued — and skip the per-address limit.
  const provided = req.headers.get("x-concierge-priority") ?? "";
  const priority = Boolean(code && provided && sameSecret(provided, code));

  try {
    const depth = Number(await redis(["LLEN", KEYS.jobs], 3000));
    if (depth >= QUEUE_CAP) {
      return NextResponse.json({ online: true, busy: true, answer: null } satisfies AskResponse, { status: 503 });
    }
  } catch {
    /* as above */
  }

  if (!priority) {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    try {
      // The window is created with its expiry in one command (SET NX EX) so a
      // missed EXPIRE can never leave a counter that only ever climbs.
      await redis(["SET", KEYS.rate(ip), 0, "EX", 60, "NX"], 3000);
      const n = Number(await redis(["INCR", KEYS.rate(ip)], 3000));
      if (n > RATE_LIMIT_PER_MIN) {
        return NextResponse.json({ online: true, limited: true, answer: null } satisfies AskResponse, { status: 429 });
      }
    } catch {
      /* relay hiccup: don't block a real visitor over the counter */
    }
  }

  const id = clientId || randomUUID();
  const secret = process.env.CONCIERGE_SHARED_SECRET;
  const job = JSON.stringify({
    id,
    question,
    ts: Date.now(),
    priority,
    ...(history.length ? { history } : {}),
    ...(secret ? { secret } : {}),
  });

  try {
    await redis([priority ? "RPUSH" : "LPUSH", KEYS.jobs, job], 5000);
  } catch {
    return offline();
  }

  const started = Date.now();
  const deadline = started + ANSWER_WAIT_MS;
  while (Date.now() < deadline) {
    await sleep(Date.now() - started < POLL_FAST_FOR_MS ? POLL_FAST_MS : POLL_SLOW_MS);
    try {
      const ans = await redis(["GET", KEYS.answer(id)], 4000);
      if (ans) {
        // consume the answer so it doesn't linger in the relay
        redis(["DEL", KEYS.answer(id)], 3000).catch(() => {});
        return NextResponse.json({
          online: true,
          canned: false,
          answer: String(ans),
        } satisfies AskResponse);
      }
    } catch {
      // transient relay hiccup — keep polling until the deadline
    }
  }

  // timed out waiting for the node -> fail closed
  return offline();
}
