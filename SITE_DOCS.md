# Site Documentation — bennett-anderson.com (Peninsula)

Reference for the personal portfolio site as it is today. Operating rules and the short version live in [CLAUDE.md](CLAUDE.md).

## 1. Stack

| Package | Role |
|---|---|
| `next` 16 (App Router, React Compiler on) | Framework |
| `react` / `react-dom` 19 | UI runtime |
| `typescript` 5 | Type checking |
| `tailwindcss` 4 via `@tailwindcss/postcss` | Utility classes (no `tailwind.config`; `@import "tailwindcss"` in `app/globals.css`) |
| `lucide-react` | Icons |
| `@vercel/analytics` (`/next` entry) | Page views |
| `@vercel/blob` | Darkroom photo storage |

## 2. Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run preflight` | lint + typecheck + build |

## 3. Design system

Everything visual comes from `app/globals.css`:

- `@theme` — raw colour ramps (`leaf`, `beige`, `gold` for the light Monstera brand; `slate`, `ice` for the dark lace-leaf brand), type scale, radii, shadows, easings.
- `:root` — dark-ground semantic aliases: `--surface-page/raised/sunken/card`, `--text-body/strong/muted/faint/accent`, `--border-*`, `--action-primary-*`, `--status-*` (+ `--status-wip-text`), `--brand` (the leaf), `--highlight` (the rare accent: gold on light, ice blue on dark).
- `html.light` / `.md-light` — the light aliases. `color-scheme` follows the class. `@media print` uses a paper palette and hides chrome.
- Primitives: `.md-btn` (+ `-primary/-secondary/-ghost/-sm`), `.md-chip`, `.md-card`, `.md-link` (underlined when it sits inside running text), `.md-acc-*` (disclosure rows).
- Page pieces: `.pg` / `.pg-head` (every page's frame), `.home-*` and `.hub-*` (home hub), `.proj-*` (projects grid and project pages), `.about-*`, `.cmdk-*` (command prompt), `.nav-sheet` (phone menu), `.site-foot` (footer), `.ba-*` (the leaf).
- Motion: pages fade up on arrival (`md-route-in`); the home leaf grows in (`ba-blade`, `ba-open`, `ba-etch`); a reading hairline grows along the navbar as you scroll. Everything uses `both` fill, so the reduced-motion rule (0ms) lands it finished.

Theme switching: light is the default for every visitor. The inline script in `app/layout.tsx` sets `html.dark` only when the visitor saved dark, before paint; `app/lib/theme.ts` is the store (`readTheme`, `toggleTheme`) shared by `Navbar` and `LeafLogo`. The choice is saved in localStorage and never changes by itself.

## 4. App Router structure

Root layout `app/layout.tsx`: fonts, site-wide `metadata` and `viewport.themeColor`; a skip link to `#main`; `VaultGate` wrapping `Navbar`, the page, `Footer` and `CommandPalette` (whose project rows and links are built here, on the server).

| Route | Server file (metadata) | Client half | Notes |
|---|---|---|---|
| `/` | `app/page.tsx` (ISR, `revalidate = 900`) | `LeafLogo.tsx` | Hub: leaf + intro, Looking for / Now, one tile per section |
| `/projects` | `app/projects/page.tsx` (static) | `ProjectsGrid.tsx` | Card grid; filter and sort live in the hash (`#show=…&sort=…`); old `#slug` / `#activity` links redirect |
| `/projects/[slug]` | `app/projects/[slug]/page.tsx` (`generateStaticParams`, `dynamicParams = false`) | — | One project: demo + write-up, facts sidebar, newer/older links |
| `/posts` | `app/posts/page.tsx` (ISR) | — | `ActivityList.tsx`: newest from each channel, then a timeline; falls back to `RecentPosts` |
| `/about` | `app/about/page.tsx` | `Accordion` (skills) | Intro, Now / Looking for, skills, Penrose |
| `/ask` | `app/ask/page.tsx` | `AskClient.tsx`, `SystemPanel.tsx` | Chat with the desktop concierge; exchanges labelled In [n] / Out [n] |
| `/contact` | `app/contact/page.tsx` | `CopyButton` | `PlasmidContact.tsx`: the features list (the content) beside an `aria-hidden` map of it |
| `/darkroom` | `app/darkroom/page.tsx` (noindex) | `DarkroomClient.tsx` | Gallery first; upload behind "Keeper's entrance" |
| `/vault` | `app/vault/page.tsx` (noindex) | `VaultClient.tsx` | Gate form server-rendered; unlocked view depends on a sessionStorage flag |
| 404 / error | `app/not-found.tsx`, `app/error.tsx` | — | Same frame as every page |

Generated metadata files: `app/opengraph-image.tsx` (1200×630 share card), `app/icon0.svg`, `app/icon1.tsx`, `app/apple-icon.tsx` (the Monstera, via `LeafTile.tsx`), `app/sitemap.ts` (includes every project page), `app/robots.ts`.

## 5. Components

- `lib/baLeafCore.js` + `lib/leaf.ts` — the leaf generator (letters first as whitespace, leaf grown around them, `interrupt` caps how much tissue crosses the letters).
- `components/brand/LeafLogo.tsx` — the generated leaf on the home page: a still leaf from first paint, then a new seed grows in; click regrows, right-click / press-and-hold switches ground, a focus-only button does the same for the keyboard.
- `components/brand/Mark.tsx` — the small navbar/footer leaf (both plants in the markup, CSS shows one), paths baked in `markPaths.ts`. `LeafTile.tsx` is the version for `next/og`.
- `components/CommandPalette.tsx` — Ctrl/Cmd+K or the navbar search button: jump to pages, projects and links, or run commands through `lib/commands.ts`.
- `components/ui.tsx` — `Button`, `Chip`, `Card`, `Badge`, `ProgressBar`, `Dotted`, `SectionHeading`, `TextLink`, `statusLabel`.
- `components/Accordion.tsx` — the one stateful primitive (id-keyed, `aria-controls`, `inert` panels, optional `syncHash`).
- `components/PageFrame.tsx` — every subpage's `<main id="main">` and header; `maxWidth` makes a centred narrow column.
- `components/Navbar.tsx` — fixed bar, `aria-current` on the active link, command prompt and theme buttons; below 640px a Menu sheet; tucks away on scroll-down on phones.
- `components/Footer.tsx` — profiles, email, site source, back to top (deliberately not the navbar again).
- `components/RecentPosts.tsx`, `components/RichText.tsx`, `components/MediaBadge.tsx`, `components/YouTubeEmbed.tsx`, `components/SkillsSection.tsx`, `components/VaultGate.tsx`, `components/SourceLogo.tsx`.

## 6. Data

`app/data/site.ts` — every site-wide constant (name, tagline, description, blurb, hero fact line `HERO_FACTS`, the `CURRENTLY` now / looking-for lines, `RESUME_META`, URLs and handles, contact details and `CONTACT_MAILTO`, vault code/triggers, concierge priority code, darkroom upload limit).

`app/data/projects.ts` — the `Project` type and list, plus `publishedProjects` (drafts filtered), `statusOf()`, `projectSlug()`, `summaryOf()`, `projectCounts()` (the ledger lines under headings) and `relatedProjects()` (the "Also see" links).

| Field | Drives |
|---|---|
| `title` | Card/row heading; slug source |
| `description` | Rendered through `RichText` (`whiteSpace: pre-line` on `/projects`; 2-line clamp without `~` asides on `/`) |
| `summary` | One line on the collapsed `/projects` row; defaults to the description's first sentence (`summaryOf()`) |
| `githubUrl`, `videoUrl` | "View on GitHub" / "Watch on YouTube" links; `videoUrl` also drives the embed |
| `date` | Display + sort key (`new Date(date)`; keep it parseable) |
| `skills`, `importantSkills` | Chips; important ones sort first and render strong |
| `media` | `"photo" | "video" | "both" | "none"` badge |
| `aiUsage`, `completion` | Progress bars |
| `thumbnailUrl`, `imageUrl`, `imageAspect` | Row thumbnail; expanded preview image and its width/height ratio |
| `wip` / `ongoing` / `completed` / `terminated` / `shelved` | Resolved by `statusOf()`: terminated → complete (only at 100%) → ongoing → wip → shelved → ongoing |
| `draft` | Keeps an entry out of the site |

`app/data/posts.ts` — hand-written posts (X entries can only come from here) plus the helpers that give every post its tag (`postLabel`: "YouTube short", "Substack article", …) and thumbnail (`thumbnailOf`); an entry may set `format` or `thumbnail` to override. `app/lib/posts.ts` merges them with the YouTube and Substack feeds (fetch cache 15 min, failures not cached).

## 7. API routes

| Route | Behaviour |
|---|---|
| `GET /api/posts` | Merged post list (dynamic; CDN `s-maxage=900`) |
| `GET /api/concierge/status` | Reads the desktop heartbeat from Upstash; reports provisioned/online/latency/machine |
| `POST /api/concierge/ask` | Requires `application/json`; per-address limit 6/min (priority header exempt), queue cap 25; enqueues to Upstash and polls for the answer up to 45s (fast poll for 3s, then 1.2s); fails closed |
| `GET /api/concierge/progress?id=` | Per-question state; queue depth only while still queued |
| `GET /api/photos` | Blob listing (`s-maxage=60`) |
| `POST /api/photos` | `x-darkroom-code` compared in constant time, 5 failures/10 min per address (when the relay is configured), 4 MB ceiling checked from `content-length` and again after parsing, magic-byte sniffing, `addRandomSuffix` |

Environment variables: see CLAUDE.md.

## 8. SEO & sharing

- `metadataBase` = `https://www.bennett-anderson.com`; per-page titles via the root template; canonical on `/projects`, `/ask`, `/contact`.
- Open Graph + Twitter (`summary_large_image`) with the generated share card.
- `/vault`, `/darkroom` are `noindex, nofollow` and left out of `app/sitemap.ts`; `app/robots.ts` disallows `/api/`.
- Person JSON-LD on the homepage; `rel="me"` on profile links.
- `public/google2d940cbb57351271.html`, `public/BingSiteAuth.xml` — search-console verification files.

## 9. Security headers (next.config.ts)

`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo/payment/usb off), `poweredByHeader: false`. Images: AVIF + WebP; remote pattern for `*.public.blob.vercel-storage.com`.

## 10. Assets in `public/`

- `thumbnails/` — project thumbnails + `default.png` fallback.
- `Previews/BennettAndersonResume1.png` — resume preview (1632×2112).
- `cats/Penny1–6.jpeg` — Penrose grid (served through `next/image` with `sizes`).
- `profile.jpeg` — hero portrait.
- `ResumeBennettAnderson.pdf` — the resume.

## 11. Tooling

- `scripts/site-health-check.mjs` — media references, project data sanity (dates, status flags, video links), homepage photos.
- `.github/workflows/ci.yml` — preflight on every PR/branch push; `.github/workflows/site-maintenance.yml` — weekly read-only report.
- `tools/resume/` (LaTeX-style resume builder), `tools/project-editor/` (local GUI for `projects.ts`), `tools/concierge/` (the desktop node that answers `/ask`).
