import { NextResponse } from "next/server";

// Concierge ask endpoint. When the desktop relay exists this will enqueue the
// question and wait for the local model's answer. Until then: a few canned
// "protocol responses" (including the vault-hint easter egg) and an honest
// offline message for everything else.

const MAX_QUESTION_LENGTH = 500;

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

  // future: enqueue to the relay and await the local model's answer
  return NextResponse.json({
    online: false,
    canned: false,
    answer: null,
  });
}
