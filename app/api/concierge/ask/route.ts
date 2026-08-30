import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { redis, relayConfigured, KEYS } from "../upstash";
import { CONCIERGE_PRIORITY_CODE } from "../../../data/site";

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
const POLL_INTERVAL_MS = 700;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
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

  // No relay configured -> honest offline (unchanged behavior).
  if (!relayConfigured()) {
    return NextResponse.json({ online: false, canned: false, answer: null });
  }

  // Priority pass: the /ask box sends this header once someone has unlocked the
  // fast lane. Priority jobs RPUSH to the tail so the poller's BRPOP grabs them
  // next — ahead of everyone already queued — and they skip any request limits.
  const priority = req.headers.get("x-concierge-priority") === CONCIERGE_PRIORITY_CODE;

  const id = clientId || randomUUID();
  const secret = process.env.CONCIERGE_SHARED_SECRET;

  // Where the question came from. The desktop node never sees the visitor -- it
  // only ever reads a job off the queue -- so if this is not attached here it
  // cannot be recovered later.
  //
  // Vercel injects these at the edge. City names arrive percent-encoded.
  const geo = (h: string) => {
    const v = req.headers.get(h);
    if (!v) return undefined;
    try { return decodeURIComponent(v); } catch { return v; }
  };

  // Referrer is reduced to host + path. The query string is dropped: it is the
  // part most likely to carry something personal, and it answers no question
  // worth answering about where a visitor came from.
  let ref: string | undefined;
  const rawRef = req.headers.get("referer");
  if (rawRef) {
    try {
      const u = new URL(rawRef);
      ref = `${u.host}${u.pathname}`.replace(/\/$/, "");
    } catch { /* malformed referer: drop it rather than store junk */ }
  }

  // A stable per-visitor pseudonym instead of the IP itself, so "how many
  // distinct people asked something" is answerable without keeping an address.
  // Salted with the shared secret, which never leaves the server; rotating that
  // secret rotates every pseudonym, which is the correct behaviour.
  let visitor: string | undefined;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip && secret) {
    visitor = createHash("sha256").update(`${secret}:${ip}`).digest("hex").slice(0, 12);
  }

  const origin = {
    ...(geo("x-vercel-ip-country") ? { country: geo("x-vercel-ip-country") } : {}),
    ...(geo("x-vercel-ip-country-region") ? { region: geo("x-vercel-ip-country-region") } : {}),
    ...(geo("x-vercel-ip-city") ? { city: geo("x-vercel-ip-city") } : {}),
    ...(geo("x-vercel-ip-timezone") ? { tz: geo("x-vercel-ip-timezone") } : {}),
    ...(ref ? { ref } : {}),
    ...(visitor ? { visitor } : {}),
    ...(priority ? { priority: true } : {}),
  };

  const job = JSON.stringify({
    id,
    question,
    ts: Date.now(),
    priority,
    ...(Object.keys(origin).length ? { origin } : {}),
    ...(history.length ? { history } : {}),
    ...(secret ? { secret } : {}),
  });

  try {
    await redis([priority ? "RPUSH" : "LPUSH", KEYS.jobs, job], 5000);
  } catch {
    return NextResponse.json({ online: false, canned: false, answer: null });
  }

  const deadline = Date.now() + ANSWER_WAIT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const ans = await redis(["GET", KEYS.answer(id)], 4000);
      if (ans) {
        // consume the answer so it doesn't linger in the relay
        redis(["DEL", KEYS.answer(id)], 3000).catch(() => {});
        return NextResponse.json({
          online: true,
          canned: false,
          answer: String(ans),
        });
      }
    } catch {
      // transient relay hiccup — keep polling until the deadline
    }
  }

  // timed out waiting for the node -> fail closed
  return NextResponse.json({ online: false, canned: false, answer: null });
}
