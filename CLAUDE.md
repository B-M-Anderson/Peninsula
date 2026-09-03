# CLAUDE.md — Operating guide for this repo

Personal portfolio site (Next.js 16 + TypeScript + Tailwind v4), deployed on Vercel with a custom domain (`www.bennettanderson.com`). Full reference docs: [SITE_DOCS.md](SITE_DOCS.md).

## Current design (MarcDesign01) — key facts

- **Look**: brown ground with tan two-band motif, cream type; a functional light ("eggshell") ground. Dark-first. Design tokens live in `app/globals.css` — `@theme` holds the raw ramps, `:root` the dark semantic aliases (`--surface-*`, `--text-*`, `--border-*`, `--status-*`, `--mark-*`), `html.light` / `.md-light` the light aliases. **Author against the semantic aliases, never the raw ramps.** Component primitives (`.md-btn`, `.md-chip`, `.md-card`, `.md-acc-*`, `.md-link`, `.md-contact-row`, `.md-project-card`, `.md-lede` for a page's opening paragraph) live in the same file; their React wrappers are in `app/components/ui.tsx` (which also has `Dotted` for "a · b · c" lines that must never wrap after a dot, and `statusLabel` for what a status badge says).
- **Theme switching** is a class on `<html>` (`dark` / `light`), set before paint by the inline script in `app/layout.tsx` and kept in sync by `Navbar`. Tailwind's `dark:` variant is class-based via `@custom-variant dark`. The BA mark and the `<meta name="theme-color">` follow the class with no JS branching.
- **Brand components**: `StripeBand` (the two bands; renders the page `<h1>` by default, text shares the page's content column) and `Mark` (the BA monogram) in `app/components/brand/`. Every subpage opens with a 232px `md-grain` title frame (a `<div>`, not a `<header>` — the navbar is the page's one banner) + `StripeBand`, then `<main id="main" className="md-dapple">`; the homepage is the one exception — it puts the grain and foot dapple on a single wrapper around its hero and main (see `app/page.tsx`).
- **Layout tokens**: `--max-width: 1180px`, `--gutter-page: clamp(20px, 5vw, 48px)` (use it for every page's horizontal padding — never a fixed `var(--space-9)`), `--page-top` (top padding of every subpage `<main>` under its title frame), `--measure: 68ch`. Narrow pages (contact, ask, 404, error) cap their column with `maxWidth` inside the shared `--max-width` column — left-aligned, never centred — so copy starts under the band's title.
- **Prose**: rendered prose goes through `typeset()` (`app/lib/typeset.ts`) for real quotes and ellipses — `RichText` and `summaryOf()` already do; keep the data files typed with plain straight quotes.
- **Site config** (name, tagline, description, hero facts, the Now / Looking-for lines, resume meta, URLs, contact, easter-egg codes, upload limit) is centralized in `app/data/site.ts`. Project entries live in `app/data/projects.ts` (with `statusOf()`, `projectSlug()`, `summaryOf()`, `projectCounts()`, `relatedProjects()`; shared by `/`, `/projects` and `scripts/site-health-check.mjs`). A project's optional `summary` is the one line shown on its collapsed row. Hand-written posts live in `app/data/posts.ts`.
- **Recent posts** are merged server-side in `app/lib/posts.ts` (YouTube + Substack feeds + the hand list) and rendered into the homepage HTML; the homepage is ISR with `revalidate = 900`. `/api/posts` exposes the same list as JSON.
- **Server/client split**: `app/page.tsx`, `app/contact/page.tsx`, `app/projects/page.tsx`, `app/ask/page.tsx`, `app/darkroom/page.tsx`, `app/vault/page.tsx` are server components that export `metadata`; interactive halves are `ProjectsList.tsx`, `AskClient.tsx`, `DarkroomClient.tsx`, `VaultClient.tsx`. Keep it that way — a `"use client"` page cannot export metadata.
- **Metadata**: root `layout.tsx` sets `metadataBase`, a title template, description, Open Graph/Twitter defaults, `viewport.themeColor`. `app/opengraph-image.tsx` generates the share card; `app/icon0.svg`, `app/icon1.tsx`, `app/apple-icon.tsx` are the favicons (file-based, so don't also set `metadata.icons`). `app/sitemap.ts` and `app/robots.ts` serve `/sitemap.xml` and `/robots.txt` — nothing is generated into `public/`. `/vault` and `/darkroom` are `noindex` and left out of the sitemap.
- **Hidden vault page** (`/vault`): summoned by typing `penny` or `penrose` anywhere on the site (outside a text field); access code is `helix` (both in `app/data/site.ts`). Client-side easter egg, NOT real security. Vault content is the `CURRENTLY`/`PENNY_STATS` block at the top of `app/vault/VaultClient.tsx` — edit freely.
- **Gotcha that has bitten twice**: multi-line plain-string JSX attributes (e.g. a `className="..."` spanning lines) break hydration in Next 16. Keep string attributes on one line; template literals are fine.
- **Lint**: `eslint-config-next` 16 enforces `react-hooks/set-state-in-effect` — don't seed state via `setState` in `useEffect`; use `useSyncExternalStore` (see Navbar, the Accordion's hash store, VaultClient) or derive it during render.
- **Dev-server quirk**: if styling looks stale after big CSS changes, restart the dev server — Turbopack has served stale CSS from cache before.
- **JSX gotcha**: a literal `//` at the start of JSX text is parsed as a comment (`react/jsx-no-comment-textnodes` lint error). Wrap such text in a string expression: `{"// text"}`.
- **Layout padding — do NOT add global padding or a `<main>` to `app/layout.tsx`.** The root layout renders `{children}` bare; every page owns its single `<main id="main">` (the skip-link target) and its own gutters via `var(--gutter-page)`. Two `<main>` landmarks per page was a real bug once.
- **Accordion** (`ui.tsx`): rows are keyed by a stable `id`, collapsed panels are `inert`, and with `syncHash` the open row follows `#id` in the URL (homepage cards link to `/projects#<slug>`).
- **YouTube** embeds go through `YouTubeEmbed` (click-to-play poster) — never a bare `<iframe>`.

## Pages & routes (current)

- `/` home, `/projects`, `/ask` (concierge), `/contact` — in the navbar.
- `/vault` — hidden easter-egg page (noindex, not in nav/sitemap).
- `/darkroom` — photo gallery + gated upload (noindex, not in nav/sitemap; linked from the cat section).
- `not-found.tsx` / `error.tsx` — branded 404 and error boundary.
- API routes: `/api/posts` (merged feed), `/api/concierge/status` + `/api/concierge/ask` + `/api/concierge/progress` (AI node relay), `/api/photos` (Blob gallery/upload).

## Environment variables (set in Vercel; all optional — features degrade gracefully without them)

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — the concierge relay. Unset → `/ask` reports "not yet provisioned" and questions fail closed.
- `CONCIERGE_SHARED_SECRET` — attached to each queued job so the desktop node can verify origin.
- `BLOB_READ_WRITE_TOKEN` — auto-injected by Vercel when a Blob store is attached. Unset → darkroom shows "storage isn't provisioned" and uploads 503.
- `DARKROOM_CODE` — the upload password (server-checked, constant-time compare, failed attempts rate-limited through the relay when it's configured). Unset → uploads 503 even with a token.

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
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run preflight` | lint + type-check + build together — run before every push |

### Safe order of operations for any change
1. Create a branch off `main`.
2. Make the change.
3. Run `npm run preflight` — fix anything it flags.
4. Push the branch, open a PR (Vercel builds a preview on any branch push).
5. Share the Vercel preview URL and wait for explicit approval.
6. Only then merge to `main`.

## Where things live

- **Thumbnails**: `public/thumbnails/<name>.png`, referenced from a project's `thumbnailUrl`. Missing files fall back to `public/thumbnails/default.png` (the health check flags dangling references).
- **Project preview images**: `public/Previews/<Name>.png`, referenced via `imageUrl`; set `imageAspect` (width / height) alongside it so the panel reserves the right space before the image loads.
- **Cat photos**: `public/cats/Penny<N>.jpeg`.
- **Resume**: `public/ResumeBennettAnderson.pdf` (opens in a new tab from the hero) + `public/Previews/BennettAndersonResume1.png` (preview screenshot).
- **Favicons**: `app/icon0.svg` (the monogram; browsers that support SVG icons use it), `app/icon1.tsx` (64px PNG fallback, generated), `app/apple-icon.tsx` (180px home-screen icon, generated). `public/thumbnails/favicon.png` is a project thumbnail, not the browser favicon.
- **Share image**: `app/opengraph-image.tsx` (1200×630, generated at build).

## Add-a-project procedure

1. Add a new entry to the `projects` array in `app/data/projects.ts`, matching the `Project` type (see `SITE_DOCS.md` for what every field controls). `date` must parse with `new Date()` (e.g. `"August 21, 2026"`).
2. Drop the thumbnail into `public/thumbnails/` and set `thumbnailUrl` to match.
3. If there's demo media, add it under `public/Previews/` and set `imageUrl` + `imageAspect`; for a video set `videoUrl` to any YouTube link.
4. Set `media` (`"photo" | "video" | "both" | "none"`), `completion`, `aiUsage`, and the status booleans. `completed: true` only reads as "complete" when `completion` is 100; otherwise the badge shows `wip`/`ongoing`.
5. Run `npm run preflight`.
6. Push a branch, get a Vercel preview, walk `/projects` (and the deep link `/projects#<slug>`) in the preview to confirm the card renders as expected.
7. Get explicit approval, then merge to `main`.

## Branch → preview → approve → merge flow

This is the only deploy path. No exceptions, no direct pushes to `main`, regardless of how small the change looks.

```
git checkout -b <descriptive-branch-name>
# make changes
npm run preflight
git add <specific files>
git commit -m "..."
git push -u origin <branch-name>
# → Vercel builds a preview URL automatically
# → share the preview URL, wait for approval
# → only after approval: merge to main
```

## Weekly automated health check

`.github/workflows/ci.yml` runs lint + type-check + build on every pull request and branch push. `.github/workflows/site-maintenance.yml` runs weekly and is strictly read-only: lint, type-check, build, `npm audit`, `npm outdated`, then `scripts/site-health-check.mjs` (media references, project data sanity). It reports to the workflow job summary / a GitHub issue — it never modifies code, bumps dependencies, or pushes/merges anything.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
