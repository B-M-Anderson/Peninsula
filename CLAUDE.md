# CLAUDE.md — Operating guide for this repo

Personal portfolio site (Next.js 16 + TypeScript + Tailwind v4), deployed on Vercel with a custom domain. Full reference docs: [SITE_DOCS.md](SITE_DOCS.md).

## July 2026 redesign — key facts

- **Cyber-bio terminal aesthetic**, dark-first with a functional light mode. Design tokens live in `app/globals.css` (`@theme` block: `bio-*` for light, `phos`/`cyto`/`plasmid`/`abyss` for dark). The `dark:` Tailwind variant is **class-based** via `@custom-variant dark` in globals.css — all theme styling uses `dark:` utilities, never JS branching.
- **Site config** (Substack URL, vault code/trigger, contact info, GitHub user) is centralized in `app/data/site.ts`. Project entries live in `app/data/projects.ts` (shared by `/projects` and `scripts/site-health-check.mjs`).
- **Substack**: `SUBSTACK_URL` in `app/data/site.ts` is `null` until configured; the homepage feed section shows a placeholder. Feed is fetched server-side via `app/api/substack/route.ts` (RSS, hourly revalidate).
- **Hidden vault page** (`/vault`): summoned by typing `penny` anywhere on the site or triple-clicking the DNA helix; access code is `helix` (both in `app/data/site.ts`). Client-side easter egg, NOT real security. Excluded from the sitemap (`next-sitemap.config.js` `exclude`). Vault content is the `CURRENTLY`/`PENNY_STATS` block at the top of `app/vault/page.tsx` — edit freely.
- **ASCII DNA helix**: `app/components/AsciiDna.tsx`, pauses under `prefers-reduced-motion` and in hidden tabs (rAF).
- **Gotcha that has bitten twice**: multi-line plain-string JSX attributes (e.g. a `className="..."` spanning lines) break hydration in Next 16. Keep string attributes on one line; template literals are fine.
- **Lint**: `eslint-config-next` 16 enforces `react-hooks/set-state-in-effect` — don't seed state via `setState` in `useEffect`; use `useSyncExternalStore` (see Navbar/AsciiDna/vault page for the pattern) or `useMemo` for derived state.
- **Dev-server quirk**: if styling looks stale after big CSS changes, restart the dev server — Turbopack has served stale CSS from cache before.
- **JSX gotcha**: a literal `//` at the start of JSX text is parsed as a comment (`react/jsx-no-comment-textnodes` lint error). Wrap terminal-style `// comment` UI text in a string expression: `{"// text"}`.

## Pages & routes (current)

- `/` home, `/projects`, `/ask` (concierge), `/contact` — in the navbar.
- `/vault` — hidden easter-egg page (not in nav/sitemap).
- `/darkroom` — photo gallery + gated upload (not in nav/sitemap; linked from the cat section).
- API routes: `/api/substack` (RSS feed), `/api/concierge/status` + `/api/concierge/ask` (AI node), `/api/photos` (Blob gallery/upload).

## Environment variables (set in Vercel; all optional — features degrade gracefully without them)

- `CONCIERGE_STATUS_URL` — heartbeat endpoint of the desktop AI node. Unset → `/ask` shows OFFLINE / "not yet provisioned".
- `BLOB_READ_WRITE_TOKEN` — auto-injected by Vercel when a Blob store is attached to the project. Unset → darkroom shows "chemicals not yet delivered" and uploads 503.
- `DARKROOM_CODE` — the upload password (server-checked, real auth). Unset → uploads 503 even with a token.

## AI concierge reference doc

`app/data/ABOUT_BENNETT.md` is the grounding doc for the local LLM — it gets loaded into the system prompt. It's a skeleton with `???`/`TODO(bennett)` sections for Bennett to fill in. The model is instructed to treat empty sections as "I don't know" and never invent.

## Guardrails (always in effect)

1. **This is a live production site.** Every push to `main` auto-deploys to production immediately.
2. **Never change content, copy, project entries, design, or styling without explicit sign-off on that specific change.** Propose the exact diff/text and wait for approval — don't "fix" or "improve" anything unprompted.
3. **Never push directly to `main`.** Always branch → push → get a Vercel preview URL → get approval → merge.
4. Docs, tooling/CI config, and read-only checks (linting, type-checking, reading files, `git status`/`git diff`) don't need prior approval. Anything touching user-facing content or the deploy pipeline does.
5. Node.js/npm may not be installed in every environment this repo is worked in — confirm before assuming `npm run dev` / `preflight` can run locally; the GitHub Actions workflow (§ below) runs them in an environment that always has Node available.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server at `localhost:3000` |
| `npm run lint` | ESLint (flat config, `eslint.config.mjs`) |
| `npx tsc --noEmit` | Type-check without emitting output |
| `npm run build` | Production build (also runs `postbuild` → `next-sitemap`, regenerating `public/sitemap*.xml` and `public/robots.txt`) |
| `npm run preflight` | **Proposed** — runs lint + type-check + build together; see Phase 3 setup |

### Safe order of operations for any change
1. Create a branch off `main`.
2. Make the change.
3. Run `npm run preflight` (or lint + `tsc --noEmit` + `build` individually) — fix anything it flags.
4. Push the branch, open a PR (or just push — Vercel comments/builds a preview on any branch push if the GitHub integration is configured that way).
5. Share the Vercel preview URL and wait for explicit approval.
6. Only then merge to `main`.

## Where things live

- **Thumbnails**: `public/thumbnails/<Name>.png` — for GitHub-repo cards on the homepage, the filename must exactly match the live repo name (case-sensitive; Vercel's filesystem is case-sensitive even though Windows dev machines aren't) with whitespace stripped. Missing thumbnails fall back to `public/thumbnails/default.png` automatically via an `onError` handler.
- **Project preview images**: `public/Previews/<Name>.png`, referenced via a project's `imageUrl`. The `imageUrl` field in `app/projects/page.tsx` is currently typed as a literal union of one exact string — adding a second project's preview image means widening that type to `string` (or a union including the new path) first, otherwise TypeScript will reject it.
- **Cat photos**: `public/cats/Penny<N>.jpeg`.
- **Resume**: `public/ResumeBennettAnderson.pdf` (downloadable) + `public/Previews/BennettAndersonResume1.png` (preview screenshot).
- **Favicon**: `app/favicon.ico` (App Router convention — lives in `app/`, not `public/`). `public/thumbnails/favicon.png` is an unrelated thumbnail asset (the "BA" logo), not the actual browser favicon.

## Add-a-project procedure

1. Add a new entry to the `projects` array in `app/projects/page.tsx`, matching the `Project` type (see `SITE_DOCS.md` §5 for what every field controls).
2. Drop the thumbnail into `public/thumbnails/` and set `thumbnailUrl` to match.
3. If there's demo media (screenshot/video), add it under `public/Previews/` (or wherever appropriate) and set `imageUrl` — widen the `imageUrl` type first if it's a new path (see above).
4. Set `media` (`"photo" | "video" | "both" | "none"`), `completion`, `aiUsage`, and exactly the status booleans that apply (`wip`/`ongoing`/`completed`/`terminated`/`shelved`).
5. Run `npm run build` locally (or let `preflight` do it) so `postbuild` regenerates the sitemap — don't hand-edit `public/sitemap*.xml`.
6. Run `npm run preflight`.
7. Push a branch, get a Vercel preview, walk `/projects` in the preview to confirm the card renders as expected (thumbnail loads, badges correct, description formatting correct).
8. Get explicit approval.
9. Merge to `main`.

## Branch → preview → approve → merge flow

This is the only deploy path. No exceptions, no direct pushes to `main`, regardless of how small the change looks.

```
git checkout -b <descriptive-branch-name>
# make changes
npm run preflight
git add <specific files>
git commit -m "..."
git push -u origin <branch-name>
# → Vercel builds a preview URL automatically (if GitHub integration is connected)
# → share the preview URL, wait for approval
# → only after approval: merge to main (PR merge, or fast-forward merge — ask which the operator prefers)
```

## Weekly automated health check

`.github/workflows/site-maintenance.yml` runs on a weekly schedule and is strictly read-only: lint, type-check, build, `npm audit`, `npm outdated`, sitemap/media sanity checks. It reports to the workflow job summary / a GitHub issue — it never modifies code, bumps dependencies, or pushes/merges anything. See the workflow file for exact steps.
