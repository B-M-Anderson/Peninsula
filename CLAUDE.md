# CLAUDE.md — Operating guide for this repo

Personal portfolio site (Next.js 16 + TypeScript + Tailwind v4), deployed on Vercel with a custom domain (`www.bennett-anderson.com`; note the hyphen, `bennettanderson.com` is someone else's site). Full reference docs: [SITE_DOCS.md](SITE_DOCS.md).

## Current design (Leaf identity) — key facts

- **Look**: two brands on one design. The **light** ground is the Monstera brand (chess green on beige, gold used rarely: `--highlight`); the **dark** ground is the lace-leaf brand (very light blue on slate). Flat grounds, no ornament: the generated leaf is the site's only decoration. Design tokens live in `app/globals.css` — `@theme` holds the raw ramps (`leaf`, `beige`, `gold`, `slate`, `ice`), `:root` the dark semantic aliases (`--surface-*`, `--text-*`, `--border-*`, `--status-*`, `--brand`, `--highlight`), `html.light` / `.md-light` the light aliases. **Author against the semantic aliases, never the raw ramps.** Display face is Jost, body Hanken Grotesk, mono JetBrains Mono (`app/fonts.ts`). Component primitives (`.md-btn`, `.md-chip`, `.md-card`, `.md-acc-*`, `.md-link`, `.md-lede`) live in the same file; their React wrappers are in `app/components/ui.tsx` (which also has `Dotted` for "a · b · c" lines that must never wrap after a dot, and `statusLabel` for what a status badge says).
- **The leaf generator** (`app/lib/baLeafCore.js`, plain ES5, typed entry points in `app/lib/leaf.ts`): lays out the B and A first as reserved whitespace, then grows a seeded Monstera (`monstera()`) or Madagascar lace-leaf (`lace()`) around them, with a cap on how much leaf tissue may cross the letters (`interrupt`). `LeafLogo` (`app/components/brand/LeafLogo.tsx`) grows a new leaf on every visit after hydration (stem, blade, holes from the base outward, letters last; reduced motion lands it finished) and regrows when clicked — deliberately no caption. It paints holes in `--surface-page`, so it must sit on the page ground. `Mark` is the small static version for the navbar: both leaves are in the markup and CSS shows the one for the ground (`.ba-mark`), baked into `markPaths.ts`. The favicons and share card (`icon0.svg`, `icon1.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`) draw the Monstera through `LeafTile.tsx`.
- **Theme switching** is a class on `<html>` (`dark` / `light`), set before paint by the inline script in `app/layout.tsx` and kept in sync by `Navbar`. **Light is the default for everyone** (the OS setting is ignored); a visitor's switch — the navbar button, or right-click / press-and-hold on the home leaf — is saved in localStorage and sticks. The store is `app/lib/theme.ts` (shared by the navbar and the leaf). Tailwind's `dark:` variant is class-based via `@custom-variant dark`.
- **Structure**: the site is split into short pages rather than one long one. `/` is a hub (hero with the leaf beside the intro, the Looking-for / Now cards, then one tile per section). `/projects` is a filterable, sortable card grid (`ProjectsGrid.tsx`; the view lives in the hash, `#show=complete&sort=done`), and every project has its own page at `/projects/<slug>` (statically generated; facts sidebar, newer/older links). Old `/projects#<slug>` and `/projects#activity` links are redirected client-side. `/posts` is recent activity across YouTube, Substack, X and GitHub (`app/posts/ActivityList.tsx`). `/about` holds the intro, Now / Looking for, skills and Penrose.
- **Command prompt** (`app/components/CommandPalette.tsx`): opens from the navbar's search button or Ctrl/Cmd+K. Typing jumps to a page, project or link; commands run through the pure interpreter carried over from the old MATLAB view (`app/lib/commands.ts`; keep the "Not affiliated with MathWorks" line in `version`). Its rows and links are built on the server in `app/layout.tsx`, so the projects data module never enters a client bundle. The other two themed views were folded in: askB.AI numbers its exchanges like notebook cells, and Contact is the plasmid map (`.pm-*`, `app/contact/plasmid.css`; the list is the content and comes first in the DOM, the SVG is a picture).
- **Navbar**: links on wider screens; below 640px a Menu button opens a sheet with the links and the resume, and the bar tucks away while scrolling down.
- **Layout tokens**: `--max-width: 1180px`, `--gutter-page: clamp(20px, 5vw, 48px)` (use it for every page's horizontal padding — never a fixed `var(--space-9)`), `--measure: 68ch`. Narrow pages (ask, 404, error, vault) cap their column with `maxWidth` inside the shared column — left-aligned, never centred.
- **Subpages** open with `PageFrame` (`app/components/PageFrame.tsx`): the page's one `<main id="main" class="pg">` with a plain header carrying the `<h1>` (optional `kicker` above it, e.g. "← All projects"). Pages fade up on arrival (`md-route-in`). Each page's `metadata` sets `alternates.canonical` and `openGraph: openGraphFor(path, description)` (`app/lib/og.ts`) — Next replaces a layout's `openGraph` rather than merging it.
- **Prose**: rendered prose goes through `typeset()` (`app/lib/typeset.ts`) for real quotes and ellipses — `RichText` and `summaryOf()` already do; keep the data files typed with plain straight quotes.
- **Site config** (name, tagline, description, hero facts, the Now / Looking-for lines, resume meta, URLs, contact, easter-egg codes, upload limit) is centralized in `app/data/site.ts`. Project entries live in `app/data/projects.ts` (with `statusOf()`, `projectSlug()`, `summaryOf()`, `projectCounts()`, `relatedProjects()`). A project's optional `summary` is the one line shown on its card. Hand-written posts live in `app/data/posts.ts`.
- **Recent posts** are merged server-side in `app/lib/posts.ts` (YouTube + Substack feeds + the hand list); `/` and `/posts` are ISR with `revalidate = 900`. `/api/posts` exposes the same list as JSON.
- **Server/client split**: pages are server components that export `metadata`; the interactive halves are `ProjectsGrid.tsx`, `AskClient.tsx`, `DarkroomClient.tsx`, `VaultClient.tsx`, `LeafLogo.tsx`, `CommandPalette.tsx` and `Navbar.tsx`. `ui.tsx` has no `"use client"`; the `Accordion` (`app/components/Accordion.tsx`, used by Skills on /about) is the one primitive that hydrates. Keep it that way — a `"use client"` page cannot export metadata.
- **API shapes** live in `app/lib/api-types.ts`; routes return `NextResponse.json({...} satisfies X)` and clients parse with `json<X>()`.
- **Metadata**: root `layout.tsx` sets `metadataBase`, a title template, description, Open Graph/Twitter defaults, `viewport.themeColor`. File-based favicons, so don't also set `metadata.icons`. `app/sitemap.ts` (includes every project page) and `app/robots.ts` serve `/sitemap.xml` and `/robots.txt`. `/vault` and `/darkroom` are `noindex` and left out of the sitemap.
- **Hidden vault page** (`/vault`): summoned by typing `penny` or `penrose` anywhere on the site (outside a text field); access code is `helix` (both in `app/data/site.ts`). Client-side easter egg, NOT real security.
- **Gotcha that has bitten twice**: multi-line plain-string JSX attributes (e.g. a `className="..."` spanning lines) break hydration in Next 16. Keep string attributes on one line; template literals are fine.
- **Lint**: `eslint-config-next` 16 enforces `react-hooks/set-state-in-effect`, `react-hooks/refs` and `react-hooks/immutability` — don't seed state via `setState` in `useEffect` (use `useSyncExternalStore` or derive it during render), and don't build closures that read refs while rendering.
- **Dev-server quirk**: if styling looks stale after big CSS changes, restart the dev server — Turbopack has served stale CSS from cache before.
- **JSX gotcha**: a literal `//` at the start of JSX text is parsed as a comment. Wrap such text in a string expression: `{"// text"}`.
- **Layout padding — do NOT add global padding or a `<main>` to `app/layout.tsx`.** The root layout renders `{children}` bare; every page owns its single `<main id="main">`.
- **askB.AI status** (`/api/concierge/status`): every live heartbeat is also saved to `concierge:lastseen` with no expiry, and returned as `lastSeen` while the desktop is off.
- **YouTube** embeds go through `YouTubeEmbed` (click-to-play poster) — never a bare `<iframe>`.

## Pages & routes (current)

- `/` home hub, `/projects` (+ `/projects/<slug>`), `/posts`, `/about`, `/ask` (labelled **askB.AI** everywhere a visitor sees it), `/contact` — in the navbar.
- `/vault` — hidden easter-egg page (noindex, not in nav/sitemap).
- `/darkroom` — photo gallery + gated upload (noindex, not in nav/sitemap; linked from Penrose on /about).
- `not-found.tsx` / `error.tsx` — branded 404 and error boundary.
- API routes: `/api/posts` (merged feed), `/api/concierge/status` + `/api/concierge/ask` + `/api/concierge/progress` (AI node relay), `/api/photos` (Blob gallery/upload).

## Environment variables (set in Vercel; all optional — features degrade gracefully without them)

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — the concierge relay. Unset → `/ask` reports "not yet provisioned" and questions fail closed.
- `CONCIERGE_SHARED_SECRET` — attached to each queued job so the desktop node can verify origin.
- `CONCIERGE_PRIORITY_CODE` — the /ask fast-lane passphrase (typed into the ask box; checked on the server in constant time, never in the bundle). Unset → no fast lane; the passphrase is just asked as a question.
- `BLOB_READ_WRITE_TOKEN` — auto-injected by Vercel when a Blob store is attached. Unset → darkroom shows "storage isn't provisioned" and uploads 503.
- `GITHUB_TOKEN` — optional, any fine-grained token with no extra scopes. Lifts the GitHub API limit for the projects page's recent activity from 60/hour (shared across Vercel's IPs) to 5,000. Unset → still works until the shared limit is hit, then GitHub drops out of the feed for that cache window.
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
- **Resume**: `public/ResumeBennettAnderson.pdf` (opens in a new tab from the hero, navbar and phone menu) + `public/Previews/BennettAndersonResume1.png` (preview screenshot).
- **Favicons**: `app/icon0.svg` (the Monstera leaf; browsers that support SVG icons use it), `app/icon1.tsx` (64px PNG fallback, generated), `app/apple-icon.tsx` (180px home-screen icon, generated). `public/thumbnails/favicon.png` is a project thumbnail, not the browser favicon.
- **Share image**: `app/opengraph-image.tsx` (1200×630, generated at build).

## Add-a-project procedure

1. Add a new entry to the `projects` array in `app/data/projects.ts`, matching the `Project` type (see `SITE_DOCS.md` for what every field controls). `date` must parse with `new Date()` (e.g. `"August 21, 2026"`).
2. Drop the thumbnail into `public/thumbnails/` and set `thumbnailUrl` to match.
3. If there's demo media, add it under `public/Previews/` and set `imageUrl` + `imageAspect`; for a video set `videoUrl` to any YouTube link.
4. Set `media` (`"photo" | "video" | "both" | "none"`), `completion`, `aiUsage`, and the status booleans. `completed: true` only reads as "complete" when `completion` is 100; otherwise the badge shows `wip`/`ongoing`.
5. Run `npm run preflight`.
6. Push a branch, get a Vercel preview, walk `/projects` and the project's own page `/projects/<slug>` in the preview to confirm both render as expected.
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
