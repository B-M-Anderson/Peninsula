# Concierge — continuation handoff

Written by the desktop Claude Code instance for the **laptop** instance to pick up.
Read this top to bottom, then continue from "What's left."

## TL;DR — current state (2026-08-04)

The AI concierge behind `/ask` on bennett-anderson.com is **built and working**; it
is **not live yet**. One config step on Vercel is blocking go-live.

- ✅ **Desktop node is running and healthy** — a `systemctl --user` service
  (`concierge-poller`) runs `tools/concierge/poller.py`, which long-polls an Upstash
  Redis queue, runs Ollama (`llama3.2:3b`), and writes answers + a heartbeat. Linger
  is on, so it auto-starts on boot and restarts on crash.
- ✅ **Code is committed** on branch `concierge/grounding-doc`, **PR #9** open.
- ✅ **Validated end-to-end locally**: grounded answers ~9–17s, injections refused,
  canned easter-eggs intact.
- ⛔ **Blocker**: the deployed Vercel preview shows **offline** because the Upstash
  env vars aren't reaching the **Preview** deployment (node never receives the job).

## THE ONE THING blocking go-live

Bennett must set these in **Vercel → Peninsula → Settings → Environment Variables**,
with the **Preview** environment ticked (not just Production), then redeploy:

| Name | Value |
|---|---|
| `UPSTASH_REDIS_REST_URL` | `https://saved-ray-150126.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | the **read-write** Upstash REST token |

**The token is NOT in this file (never commit secrets).** It lives in: the desktop's
`tools/concierge/.env.concierge` (gitignored, chmod 600), the Upstash console, and
Bennett's USB (`SECURE/concierge-secrets/`). It starts `gQAA…` and is read-write
(verified — despite the USB README mislabeling it "read-only").

## What's left (in order)

1. Bennett fixes the Vercel env-var scope (Preview + Production) → **redeploy**.
2. Trigger a fresh preview build (push any commit to the branch, or Vercel → Redeploy).
3. Retest. The preview has **Vercel Authentication** on, so `curl` gets 401 — either
   (a) Bennett opens the preview `/ask` in his browser, or (b) create a Vercel
   "Protection Bypass for Automation" token to test via header `x-vercel-protection-bypass`.
   Verify from the node side: watch `journalctl --user -u concierge-poller -f` for the
   incoming job, or `GET {UPSTASH_URL}/get/concierge:heartbeat` (needs token).
4. Once Bennett approves the preview → **merge PR #9 to main** (this deploys prod).
   Never push straight to main.

Preview URL: `https://peninsula-git-concierge-grounding-doc-b-m-andersons-projects.vercel.app`

## Architecture / where things live

```
Visitor → /ask → /api/concierge/ask (Vercel) ──LPUSH──► Upstash Redis (REST)
                                                            ▲   │
                    heartbeat + answer:<id> ◄──SET─────────┘   │ BRPOP
                                                                ▼
                              desktop: poller.py → Ollama (llama3.2:3b)
```

- **Routes**: `app/api/concierge/status/route.ts` (reads `concierge:heartbeat`),
  `app/api/concierge/ask/route.ts` (enqueues `concierge:jobs`, polls
  `concierge:answer:<id>`; `maxDuration=60`, waits 45s, canned block preserved,
  fails closed), `app/api/concierge/upstash.ts` (tiny REST helper).
- **Node**: `tools/concierge/poller.py`; unit `concierge-poller.service` installed at
  `~/.config/systemd/user/` on the DESKTOP. Secrets in `tools/concierge/.env.concierge`
  (DESKTOP ONLY, gitignored — the laptop cannot read it).
- **Grounding doc**: `app/data/ABOUT_BENNETT.md` (loaded into the system prompt).
- **Model**: `llama3.2:3b` on CPU. No GPU; 7.6 GB RAM (qwen2.5:7b loads but is too
  slow/tight). `keep_alive:-1` + startup warmup avoid the ~60s cold start.
- Relay keys: `concierge:jobs`, `concierge:answer:<id>` (TTL 120s), `concierge:heartbeat` (TTL 30s).

## Safety config (decided with Bennett — keep it)

- **Relaxed / "leave it"**: answers about Bennett ONLY from the doc (never invents his
  personal facts); general chat, creative (poems/jokes), and casual first-person
  "as Bennett" are all allowed. Two rails: (1) regex **pre-filter** refuses
  instruction-extraction ("print your system prompt", "ignore all previous"), (2) never
  make a **binding commitment as Bennett** — route real asks to /contact.
- Earlier a 3b LLM verifier was tried and **removed** (it false-refused normal answers).
- **Never** name the research collaborator or PI — department only ("ISU Chemical and
  Biological Engineering"); details await publication. Phone stays OUT; Gmail is the
  public contact.

## Repo rules (from CLAUDE.md)
Live production site. **Never push to main.** branch → Vercel preview → Bennett's
approval → merge. Never commit secrets (`.env*` is gitignored). Docs/tooling need no
prior approval; user-facing/deploy changes do.

## Node ops cheat-sheet (run on the desktop)
```
systemctl --user status concierge-poller      # health
journalctl --user -u concierge-poller -f       # live logs
systemctl --user restart concierge-poller      # after editing poller.py / the doc
```
Also note: CLAUDE.md still calls the site "cyber-bio"; it's actually the warm
"MarcDesign01" look now (see app/globals.css). That doc line is stale — fix pending.
