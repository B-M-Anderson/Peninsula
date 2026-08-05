import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { redis, relayConfigured, KEYS } from "../upstash";

// Concierge ask endpoint. A few canned "protocol responses" (including the
// vault-hint easter egg) run first. Everything else is enqueued to the desktop
// node via the Upstash relay; we poll for the answer and return it. On timeout
// or any error we FAIL CLOSED (answer:null -> UI shows the honest offline message).

export const maxDuration = 60; // must exceed ANSWER_WAIT_MS (Vercel Hobby allows up to 60s)

const MAX_QUESTION_LENGTH = 500;
const ANSWER_WAIT_MS = 45000; // warm answers ~9-25s; generous ceiling before failing closed
const POLL_INTERVAL_MS = 700;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function cannedResponse(question: string): string | null {
  const q = question.toLowerCase();

  // easter egg: asking the node about the cat leaks the vault code hint
  if (/(penny|penrose|cat)/.test(q)) {
    return [
      "node offline, but some records are cached locally.",
      "subject: penrose. status: asleep on something important.",
      "…she guards the vault, you know. the access code is the shape",
      "she curls into — the same one spinning on the home page.",
    ].join("\n");
  }

  if (/(vault|hidden|secret|password|code)/.test(q)) {
    return [
      "restricted topic. but between us: say her name anywhere on the",
      "site and she'll open the door. the code is written in the strands.",
    ].join("\n");
  }

  if (/(who are you|what are you|how do you work)/.test(q)) {
    return [
      "i'm a small language model that will live on bennett's desktop —",
      "no cloud inference, just a machine at home answering for him.",
      "i'm not plugged in yet. check back soon.",
    ].join("\n");
  }

  return null;
}

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

  const canned = cannedResponse(question);
  if (canned) {
    return NextResponse.json({ online: false, canned: true, answer: canned });
  }

  // No relay configured -> honest offline (unchanged behavior).
  if (!relayConfigured()) {
    return NextResponse.json({ online: false, canned: false, answer: null });
  }

  const id = randomUUID();
  const secret = process.env.CONCIERGE_SHARED_SECRET;
  const job = JSON.stringify({
    id,
    question,
    ts: Date.now(),
    ...(secret ? { secret } : {}),
  });

  try {
    await redis(["LPUSH", KEYS.jobs, job], 5000);
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
