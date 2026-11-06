# Concierge node: operator guide

The local half of the bennett-anderson.com **askB.AI** concierge. It runs on Bennett's
OptiPlex 5040 (Debian 13, i5-6500, 7.6 GB RAM, no GPU) and reaches the site through
an outbound-only relay, so no ports are open to the internet.

```
Visitor -> /ask -> /api/concierge/ask (Vercel) -> relay -> poller.py
                                                             |
              rails -> route (router.py) -> generate (Ollama) -> register check
                              |
                 ~/concierge-kb/build/index.json (private)
```

## Files

| File | What it does |
|---|---|
| `poller.py` | Polls the relay, runs the rails, generates, writes answers and the heartbeat. |
| `router.py` | Picks 1-2 profile sections per question. No LLM call. |
| `warmcache.py` | Register scorer, self-disclosure guard, logs. The name is historical; the answer cache is gone. |
| `build_kb.py` | Validates `profile.md` and builds the index. |
| `refresh.sh`, `refresh_prompt.md`, `kb_notify.py` | The scheduled refresh. |
| `kb-rollback.sh` | Puts a previous profile back live. |
| `eval/` | Eval harness. Its questions and results stay in the private repo. |
| `.env.concierge` | Relay credentials and `CONCIERGE_MODEL`. Gitignored, chmod 600. |

## The knowledge base

The profile lives in the private repo `B-M-Anderson/concierge-kb`, cloned at
`~/concierge-kb`. Never copy `profile.md`, or anything built from it, into this repo.
That includes eval questions, which state expected answers.

```bash
python3 build_kb.py --check ~/concierge-kb/profile.md   # validate, change nothing
python3 build_kb.py                                     # rebuild the index
```

The poller reloads when the index's mtime changes, or on SIGHUP, within one heartbeat.
A bad index leaves the previous one loaded. To record a fact for the next refresh, add
a dated line to `~/concierge-kb/inbox.md`.

## Answer pipeline

1. **Rails, no model call.** `LEAK`, `IMPERSONATE`, `COMMITMENT`, `PRIVATE`.
2. **Route.** Cosine similarity blended with keyword hits. `asked` sections need a
   topic keyword or an opinion question, and `related` never pulls them in from an
   `open` section. Overview questions go to `overview` + `status-and-goals`.
3. **Generate.** `SYSTEM` stays byte-identical so Ollama reuses its cached prefix. The
   sections go in the user turn. `num_ctx` is explicit and `shift` is off, so an
   overflow fails closed instead of silently losing the prompt.
4. **Check.** The self-disclosure guard, then `score()`. Below the floor, it retries once
   at a different temperature and keeps the better answer.

Any model or router error returns no answer, so the site shows its offline message.

## One rule for anything that talks to Ollama

Any request for the chat model must send the same `shift` and `num_ctx` as the
poller (`shift: false`, `num_ctx` from `CONCIERGE_NUM_CTX`). Ollama fixes both when
it starts a runner, so a request with different values needs a new runner. With
`keep_alive -1` the old one is never unloaded, so every poller request waits until it
times out. That took the concierge down for 35 minutes on 2026-11-05. A plain `curl`
to `/api/chat` does it too. The poller now unloads the model after a timeout, so the
next question recovers, but avoid it. To recover by hand:
`curl -s localhost:11434/api/generate -d '{"model":"llama3.2:3b","keep_alive":0}'`.

## Records of visitor questions

`~/.local/share/concierge/served.jsonl` keeps every real question and answer and is
never trimmed. `activity.jsonl` keeps recent ones, journald also has them, and
`concierge-library-push` copies these files to the private `concierge-backup` repo
nightly.

## Refresh

`refresh.sh` gathers projects, the resume, and the Substack and YouTube feeds, merges
with headless Claude Code, validates, swaps, smoke-tests, and notifies. It fetches
rather than pulls because the poller runs from this checkout. `build_kb.py
--guard-against` rejects any change to tiers, owners, or the section list, and any
change to an `owner: bennett` section with no inbox note. If the merge cannot run,
the live KB is left as it is and the notification says so.

```bash
tools/concierge/refresh.sh --dry-run                  # change nothing live
systemctl --user list-timers concierge-kb-refresh     # is it scheduled?
```

To schedule it, link `systemd/concierge-kb-refresh.{service,timer}` into
`~/.config/systemd/user/`, then run `systemctl --user enable --now
concierge-kb-refresh.timer`. Notifications go to `~/concierge-kb/build/refresh-log.md`,
and to Discord or Gmail if `~/.config/concierge/notify.env` (chmod 600) sets
`DISCORD_WEBHOOK_URL`, or `GMAIL_USER` and `GMAIL_APP_PASSWORD`.

## Rollback

```bash
tools/concierge/kb-rollback.sh --list
tools/concierge/kb-rollback.sh                        # newest backup
tools/concierge/kb-rollback.sh backups/profile-DATE.md
```

## Operate

The service is system-scope. Ignore the disabled user unit of the same name.

```bash
systemctl status concierge-poller
journalctl -u concierge-poller -f
sudo systemctl restart concierge-poller
```

Keep the machine awake: if it suspends, the node goes offline and nothing can wake it.
