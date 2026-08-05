import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { redis, relayConfigured, KEYS } from "../upstash";
import { CONCIERGE_PRIORITY_CODE } from "../../../data/site";

// Concierge ask endpoint. Every question is enqueued to the desktop node via the
// Upstash relay; we poll for the answer and return it. On timeout or any error we
// FAIL CLOSED (answer:null -> UI shows the honest offline message). No canned
// intercepts — the model answers everything, so real questions aren't hijacked.

export const maxDuration = 60; // must exceed ANSWER_WAIT_MS (Vercel Hobby allows up to 60s)

const MAX_QUESTION_LENGTH = 500;
const ANSWER_WAIT_MS = 45000; // warm answers ~9-25s; generous ceiling before failing closed
const POLL_INTERVAL_MS = 700;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  let question = "";
  try {
    const body = await req.json();
    question = String(body.question ?? "").slice(0, MAX_QUESTION_LENGTH);
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

  const id = randomUUID();
  const secret = process.env.CONCIERGE_SHARED_SECRET;
  const job = JSON.stringify({
    id,
    question,
    ts: Date.now(),
    priority,
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
