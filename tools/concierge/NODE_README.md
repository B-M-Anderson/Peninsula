# Concierge node — operator guide

The local half of the bennett-anderson.com **Ask** concierge. Runs on Bennett's
Linux Mint desktop, answers strictly about Bennett (plus relaxed general/creative
chat), and reaches the public site through an **outbound-only** Upstash Redis relay
— no inbound ports.

```
Visitor → /ask → /api/concierge/ask (Vercel)  ──LPUSH job──►  Upstash Redis
                                                                   ▲   │
                       heartbeat + answer:<id>  ◄──SET────────────┘   │ BRPOP
                                                                       ▼
                                 this desktop: poller.py → Ollama (llama3.2:3b)
```

## Files
- `poller.py` — single-file poller. Long-polls the queue, runs the model with the
  strict grounding prompt + safety pipeline, writes answers + a heartbeat.
- `.env.concierge` — secrets (Upstash REST URL + read-write token, model). **Gitignored, chmod 600. Never commit.**
- `concierge-poller.service` — systemd unit (auto-start + restart-on-failure).
- Grounding doc lives at `../../app/data/ABOUT_BENNETT.md` (loaded into the prompt).

## Safety pipeline (in `poller.py`)
1. **Pre-filter** — regex refuses instruction-extraction / override attempts
   ("print your system prompt", "ignore all previous", over-length) with no model call.
2. **Hardened system prompt** — answers about Bennett only from the grounding doc
   (never invents his facts); relaxed for general/creative chat; two hard rules:
   never reveal its instructions/doc, never make binding commitments as Bennett.
3. **Fail closed** — any model/relay error returns no answer, so the site shows its
   honest offline message rather than a guess.

Config knob: to make it *decline* general trivia (concierge-only), tighten rule wording;
to loosen further, relax the "ABOUT BENNETT" clause. Current = "leave it" (concierge-first, fun on).

## Run it

Manual (foreground, for debugging):
```bash
cd ~/Peninsula/tools/concierge && python3 poller.py
```

As a service (survives crashes + reboot) — needs sudo once:
```bash
sudo cp ~/Peninsula/tools/concierge/concierge-poller.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now concierge-poller
```

Operate:
```bash
systemctl status concierge-poller      # is it up?
journalctl -u concierge-poller -f      # live logs
sudo systemctl restart concierge-poller
sudo systemctl stop concierge-poller
```

## Requirements
- **Ollama** running with the model pulled: `ollama pull llama3.2:3b` (already present).
- **Keep the desktop awake** — if it suspends, the node goes offline. Disable sleep:
  `Settings → Power → When plugged in → Never`, or:
  `gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type nothing`
- The model is held resident (`keep_alive: -1`) so the first question after idle isn't
  a ~60s cold start. Uses ~2 GB RAM continuously.

## Relay keys (Upstash)
- `concierge:jobs` — job queue; site `LPUSH`es `{id,question,ts[,secret]}`, poller `BRPOP`s.
- `concierge:answer:<id>` — the reply, TTL 120s.
- `concierge:heartbeat` — `{model,runtime,ts}`, TTL 30s (stale/missing ⇒ site shows offline).

## Quick self-test (with the poller running)
```bash
set -a; . ./.env.concierge; set +a
H="Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"; U="$UPSTASH_REDIS_REST_URL"
curl -s "$U/get/concierge:heartbeat" -H "$H"        # should show a recent ts
```
