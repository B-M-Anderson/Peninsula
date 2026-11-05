# Concierge v2 handoff: new knowledge base, routing, model upgrade, auto-refresh

Written 2026-11-05 from a planning session with Bennett. Read this whole file, then do the work in order. Follow the repo's `CLAUDE.md` guardrails throughout (no pushes to `main`; anything visitor-facing goes branch → `npm run preflight` → Vercel preview → Bennett's explicit OK → merge).

## Where to run this

The concierge node is the Dell OptiPlex 5040 on Bennett's home network (i5-6500, 4 cores, ~7.6 GB RAM, no GPU), running Ollama and `tools/concierge/poller.py` as a service from its own checkout of this repo. Check `systemctl --user status concierge-poller` and `systemctl status concierge-poller` to find which one is live, and read the unit before touching it.

If you are on the laptop instead, first check whether you can reach the node over SSH (`ssh` to its hostname or LAN IP; ask Bennett if you don't know it). If you can't, stop and tell him to run this handoff in Claude Code on the desktop. Code changes can be made from either machine, but everything in steps 2–6 has to land on the node.

## Facts already verified (don't re-derive)

- On 2026-11-05 the live `/ask` answered "What kind of work is Bennett looking for right now?" with "Bennett is currently searching for graduate school opportunities." That comes from `app/data/ABOUT_BENNETT.md` itself (the "What he's doing now" and "Goals" sections), not from the cache. The warm cache is already keyed on a fingerprint of prompt + doc + model, so it resets whenever the doc changes.
- `ABOUT_BENNETT.md` is in a **public** repo, so anyone can read the full profile on GitHub. The only reader is `poller.py` (`DOC_PATH`); nothing in the Next.js app imports it.
- Ollama's default `num_ctx` on a CPU-only host is 4096, and overflow is truncated silently (whole messages dropped from the front, then a block cut from the middle of the prompt). `poller.py` never sets `num_ctx`. The current prompt (~1k token system prompt + ~1.6k token doc) fits, but a bigger profile would be cut without any error.
- `/api/concierge/ask` waits at most 45 s (`ANSWER_WAIT_MS`) inside a 60 s Vercel function. That's the hard latency ceiling for a visitor today.

## What Bennett decided

- **Knowledge base**: a new, larger, sectioned profile (`profile.md`, delivered to Bennett separately, deliberately not in this repo). It lives on the node only. Sections carry `tier`, `owner`, `summary`, `keywords`, `related`, `updated`, `source`; the format is documented in a comment at the top of the file.
- **Retrieve, don't stuff**: answers are slower in exchange for handling a much bigger profile. Pick the relevant sections per question and send only those.
- **Remove the warm-cache system entirely**: the idle worker, question discovery, best-of-N precompute, and cache lookups/stores in `answer_for`. Bennett wants no preloaded answers; every refresh would wipe them anyway. Keep `score()` as a post-generation register check and keep the activity log.
- **Tiers**: `open` sections can answer any relevant question. `asked` sections (healthcare, politics, religion/philosophy) are used only when the question is directly about that topic or a clearly adjacent one (e.g. healthcare questions may pull in his spending views). Never in a general "tell me about Bennett" answer.
- **No speculation**: never state a position he hasn't taken. If asked about an opinion he hasn't covered: "Bennett has not addressed that directly. He has said [closest related positions], which may be relevant. For his view, use /contact." Criticism of named public figures is stated as his view, and unpublished pieces are described as "in progress."
- **Private**: finances, living situation, health, family, relationships, and other people's information are not in the KB at all. The model answers "Bennett keeps that private" and points to /contact.
- **Tone**: professional. Keep the current formal third-person register and all existing rails (LEAK, IMPERSONATE, COMMITMENT, fail-closed, history sanitizing).
- **Disclaimer lives in the UI, not the model**: a small, muted but legible line under every answer, saying it's a small local model that makes mistakes and can state false things, linking to a page that explains the pipeline and the specific kinds of mistakes it makes.
- **Upgrade the model** (step 4).
- **Auto-refresh**: a scheduled job every two weeks that updates the KB from his current content, pushes it live without asking, and sends him a summary of what changed. Keep a backup of the previous version for rollback.

## The work

Use a task list. Before you change anything, back up `~/.local/share/concierge/` and the current unit file.

### 1. Move the KB off the public repo

- Create `~/concierge-kb/` on the node as a **local-only** git repo (no remote, never pushed anywhere) holding `profile.md`, `inbox.md` (empty template: dated notes Bennett can append, like "2026-12-01: accepted a job at X"), `backups/`, and `build/`.
- Ask Bennett where he saved `profile.md`. If it isn't on the node, copy it there (scp from the laptop, or he downloads it on the desktop).
- `poller.py` reads the KB from `CONCIERGE_KB` (default `~/concierge-kb/build/index.json`). Make sure the service's sandboxing (`ProtectHome`, `ReadWritePaths`) allows reading it.
- On a branch: replace `app/data/ABOUT_BENNETT.md` with a short stub saying the grounding data now lives on the node, and update `NODE_README.md`. The old content stays in git history; mention that to Bennett. Docs-only, so no approval is needed before the PR, but don't merge without his OK.

### 2. Build step: `tools/concierge/build_kb.py`

- Parse sections and validate the schema: required fields, `tier` ∈ {open, asked}, `owner` ∈ {bennett, auto}, every `related` id exists, a per-section token budget (≤ 500 tokens, so two sections plus the core card, system prompt and short history stay well under 4096; counted with the model's tokenizer through Ollama, or chars/4 as a fallback), and a deny-list scan of body lines only (phone-number and street-address patterns, plus words like salary, income, rent, apartment, diagnosis, diagnosed). The `contact-and-boundaries` keywords deliberately include some of those words so private questions route to the "keeps that private" line. Any failure means exit non-zero and change nothing.
- Embed each section (summary + keywords + body) with `nomic-embed-text` through Ollama, adding the `search_document: ` prefix explicitly (queries get `search_query: `). It's ~274 MB and CPU-friendly. If RAM is tight, try `all-minilm` and compare retrieval on the eval set.
- Write `build/index.json` with sections, vectors, and a content hash. The poller loads it at start and reloads on SIGHUP or when the file mtime changes.

### 3. Router + answer pass in `poller.py`

- Order: rails → route → generate → register check.
- Routing is deterministic (no LLM call): score = cosine(query, section) blended with keyword hits. Take the top 1–2 sections above a threshold. A `related` section joins only if its own score clears a lower threshold. `asked`-tier sections are eligible only on their own score, never pulled in by `related` from an `open` section and never for overview-style questions. "Who is Bennett / tell me about him" routes to `overview` (+ `status-and-goals`). The section ids in the delivered profile are: overview, status-and-goals, education, research, strengths, projects-software, projects-hardware, writing-and-video, views-healthcare, views-politics, views-religion-philosophy, interests, penny, contact-and-boundaries.
- Always prepend a tiny core card (first two lines of `overview`) so pronouns resolve. If nothing clears the threshold, treat it as a general/world question, as the current prompt already does.
- Keep `SYSTEM` byte-identical across requests so Ollama reuses the cached prefix. Put the retrieved sections in the user turn, before the question, between clear delimiters. Remove the `--- BENNETT PROFILE ---` + `DOC` splice from `SYSTEM`. Keep the "never mention a profile/document" rule.
- Add the decisions above to `SYSTEM` (opinion attribution, the "has not addressed that directly" pattern with one example, private topics, in-progress pieces). Raise the cap from three sentences to four, or five when answering from an `asked` section. Update `score()` to match.
- Set `options.num_ctx` explicitly (4096 unless the new model and RAM allow 8192) and send `"shift": false` so an overflow errors out (and fails closed) instead of being silently truncated. Log `prompt_eval_count` per answer and warn above ~85% of `num_ctx`.
- If `score()` lands below the floor, regenerate once at a different temperature and keep the better answer. Bennett accepts slower answers but not worse ones.
- Remove the cache/idle fields from the heartbeat only together with the matching `SystemPanel.tsx` / status route change in the same PR (that's visitor-facing, so it needs his approval). Swapping in router stats, like which sections answered and the KB's `updated` date, is a nice replacement.

### 4. Model upgrade (eval-driven, don't pick blind)

- Build `tools/concierge/eval/` with ~30 questions and expected behavior covering: current status ("what is he looking for" must say job search), research ("has he done LNP or viral vector work" must say no), a general "tell me about Bennett" (must contain no political or religious content), each `asked` section directly, an adjacent pull (healthcare ↔ spending), an opinion he hasn't covered (must use the "not addressed" pattern), private topics, names of collaborators (must decline), a world question, and the existing injection/impersonation/commitment probes. Score faithfulness, which you can mostly automate: every factual claim must trace to the retrieved section text. Also score the rails, register, and latency (p50/p90, including prompt eval).
- Candidates that fit 7.6 GB RAM: `llama3.2:3b` (current baseline), `qwen3.5:4b` (~3.3–4 GB; it's a thinking model, so send `"think": false`, verify thinking is really off, and check the latency), and `phi4-mini` (~2.5 GB; verify the exact tag). `gemma4:e4b` is 6.6+ GB and won't fit next to the OS and the embed model. Check `ollama.com/library` for anything newer in this size class before you start.
- Pick the model with the best faithfulness and rails whose p90 stays under ~35 s end to end. If the best model needs longer, tell Bennett, and offer to make `/ask` asynchronous (return the job id immediately and let the client poll `/api/concierge/progress` until the answer lands), which removes the 45 s ceiling. That change is visitor-facing and needs his OK.
- Note to Bennett: upgrading the OptiPlex to 16 GB of DDR3L makes the 4B class comfortable.
- Report the eval table to him before switching `CONCIERGE_MODEL`.

### 5. UI disclaimer + explainer (branch → preview → approval)

- Under every answer in `AskClient` (both the notebook look and the plain look), add a small muted line, legible in both themes using the semantic text tokens: "Small local model. It makes mistakes and can state things that aren't true. How this works →". Link it to the concierge entry on `/projects` (`#local-llm-site-concierge`).
- In `app/data/projects.ts`, update that entry. Remove the precompute/cache description. Describe routing and the refresh in a sentence or two. Add a short "What it gets wrong" passage: invented details, the wrong section picked, mangled dates and numbers, misattributing or overstating his views, a profile up to two weeks stale, and being offline. Propose the exact text to Bennett and get his OK before committing.
- Separate small PR, same approval flow, for content that's now wrong on the site: `app/data/site.ts` `lookingFor` and `now` (job search first, grad school later), and the "gRNA Design" skill in `SkillsSection.tsx` (Bennett says he hasn't done gRNA design). Also tell him the resume PDF still lists the research role as "Present." The resume source isn't in this repo.

### 6. Biweekly refresh on the node

- Add a systemd **user** timer with `OnCalendar=*-*-01,15 04:10` and `Persistent=true` (twice a month is close enough to biweekly and much simpler). The script, `tools/concierge/refresh.sh`, does:
  1. **Gather** (deterministic, no LLM): `git pull` the repo checkout. Fetch the Substack RSS (`https://bennettmanderson.substack.com/feed`) and the YouTube channel feed (channel `UCY7H6pvaCxxdUModczjw_ew`). Read project entries from `app/data/projects.ts`. Extract the resume text from `public/ResumeBennettAnderson.pdf`. Read `inbox.md`.
  2. **Merge**: run headless Claude Code (`claude -p` with a fixed prompt file, tools limited to reading the gathered files and writing in `~/concierge-kb/`) to write `profile.next.md` and `changes.md`. Rules for that run: update only `owner: auto` sections from sources. Change `owner: bennett` sections only when an inbox note explicitly says so. Never add a fact that isn't in a source or note. Never move content between tiers. Bump `updated:`. Move processed inbox notes to `inbox-archive.md`. Verify early that `claude -p` authenticates non-interactively on the node. If it can't, fall back to updating only the deterministic parts (project statuses, recent posts) and say so in the notification.
  3. **Validate**: `build_kb.py --check profile.next.md`. On failure, keep the live KB and notify Bennett of the failure.
  4. **Swap**: copy the live `profile.md` to `backups/profile-YYYYMMDD.md` (keep the last 12), commit both in the local KB repo, atomically move `profile.next.md` into place, rebuild the index, and reload the poller.
  5. **Smoke test**: run the eval's core questions. If status, private-topic, or tier checks fail, roll back automatically and notify him.
  6. **Notify**: send `changes.md` plus the smoke-test result. Ask Bennett which channel he wants: a Discord webhook (he runs Hermes on Discord) or email through a Gmail app password. Secrets go in an env file with chmod 600, never in git.
- Add a one-command rollback (`tools/concierge/kb-rollback.sh` or a `just` recipe) and document it in `NODE_README.md`.

## Before you finish

- Run the eval on the final config and include the numbers.
- Ask the live site the stale question again ("What kind of work is Bennett looking for right now?") and confirm the answer now says job search.
- Tell Bennett what you changed, what's waiting on his approval (with preview URLs), the model you picked and why, where the backups are, and how to roll back.
- Don't delete anything beyond the old cache file (after backing it up) without asking him.
