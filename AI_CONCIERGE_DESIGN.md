# Design proposal — AI Q&A concierge (draft, not built)

Goal: a chat widget on the site where visitors ask questions and get answered by a small local model running on your desktop PC, which also directs them to the right project/contact links. This doc is the architecture + security plan for your review. **No code has been written for this.**

## Why this needs a relay, not a direct connection

The site runs on Vercel; your desktop is on your home network behind NAT with no public IP or open ports. Vercel can't reach it directly, and — per your answer — we're avoiding opening any inbound port on your home network. So the desktop has to be the one reaching *out*, never the other way around.

## Architecture (outbound-only relay / job queue)

```
Visitor → Vercel API route (/api/ask) → Queue (Upstash Redis) ← polls ← Desktop poller script → local model (Ollama, localhost-only)
                                              ↓ (answer written back)
Visitor ← Vercel API route ← Queue ←──────────┘
```

1. **Website side** — a new Next.js API route (e.g. `app/api/ask/route.ts`) that:
   - Accepts `{ question }` from the chat widget.
   - Rate-limits per IP (e.g. 5 requests/minute) and caps question length, to stop someone from hammering your home PC through the relay.
   - Writes a job `{ id, question, createdAt }` to the queue.
   - Waits (short-polls the queue, capped at ~20–25s to stay under Vercel's serverless execution limit) for a matching answer.
   - Returns the answer, or — if nothing arrives in time — a friendly fallback: *"The AI assistant is offline right now — here's the [Projects](/projects) page and [Contact](/contact) info directly."* This fallback is the normal path whenever your desktop/model isn't running, not an error state.

2. **Queue/relay** — Upstash Redis (generous free tier, simple REST API, pairs naturally with Vercel serverless — no server for you to keep running). Two keys per job: a pending question and, once answered, the answer.

3. **Desktop side** — a small script (Node or Python) that:
   - Runs continuously, polling the queue over HTTPS every 1–2 seconds (outbound only — nothing to open on your router).
   - On a new job, sends the question plus a fixed system prompt to a locally-running model server (e.g. Ollama on `localhost:11434`, never exposed beyond your machine).
   - The system prompt is built from content already in this repo — your bio blurb, the `projects` array, and contact info — so the model only ever "knows" what you've already chosen to put on the site publicly, nothing extra.
   - Posts the answer back to the queue.
   - This script needs to be running whenever you want the concierge live — realistically as a background process/service on the desktop, started on login.

## Security & abuse considerations
- **Two separate secrets**: one for the website→queue write (Vercel env var), one for the desktop→queue poll (local env/config on the desktop, never committed to this repo).
- **Rate limiting** on the public API route — without this, a bad actor could keep your desktop's model busy or run up any hosting costs.
- **Prompt-injection / off-topic guardrail**: since the model is public-facing, expect attempts to make it say things unrelated to you. The system prompt should explicitly instruct it to stay on-topic (your background, skills, projects, how to reach you) and to redirect anything else to the Contact page rather than improvise.
- **No PII logging by default** — log question/answer pairs for your own review (useful for catching abuse or gaps), but skip storing visitor IPs unless you specifically want that for rate-limiting purposes.
- **Graceful offline behavior is not optional** — the feature must degrade to plain links whenever the desktop is off; visitors should never see a hung request or a raw error.

## Open questions before I'd write any code
1. Does your desktop already have a local model runtime installed (Ollama, LM Studio, something else)? That determines the API shape the poller script targets.
2. Are you fine with Upstash Redis (free tier) as the relay, or is there a hosting provider you'd rather standardize on?
3. Roughly how available do you expect this to be — "on whenever my desktop's on" is fine, but worth confirming that's the expectation rather than something closer to always-on.
4. Any topics/questions you'd want the model to explicitly refuse or redirect on?

Once you're happy with this shape (or want changes to it), I'll turn it into an implementation plan and start on a branch — still with a preview before anything touches `main`.
