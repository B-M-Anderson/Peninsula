# Site Documentation — bennettanderson.com (Peninsula)

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

- `@theme` — raw colour ramps (brown, tan, cream, clay, moss), type scale, radii, shadows, easings.
- `:root` — dark-ground semantic aliases: `--surface-page/raised/sunken/card`, `--text-body/strong/muted/faint/accent`, `--border-*`, `--action-primary-*`, `--status-*` (+ `--status-wip-text` for readable clay), `--mark-*` (the monogram), stripe metrics, textures, `--max-width`, `--gutter-page` (fluid), `--page-top` (subpage `<main>` top padding), `--leading-body` (summaries) / `--leading-relaxed` (long prose), spacing scale.
- `html.light` / `.md-light` — the eggshell aliases. `color-scheme` follows the class so native scrollbars and form controls match. `@media print` uses a paper palette and hides chrome/textures.
- Brand utilities: `.md-grain` (film grain), `.md-dapple` (foot dappling), `.md-above` (content above the textures).
- Primitives: `.md-btn` (+ `-primary/-secondary/-ghost/-sm`, `:disabled`), `.md-chip`, `.md-card` (tighter padding on phones), `.md-link`, `.md-acc-*` (disclosure rows; collapsed panels are `inert` and hidden; `.md-acc-date` is the panel's date line, shown only on phones where the row meta is hidden), `.md-contact-row`, `.md-project-card`, `.md-lede` (a page's opening paragraph: fluid size, 1.5 leading), `.md-video-poster`, `.md-fade-in`, `.md-skip-link`.
- Motion: the two bands slide in on load (`md-band-in`), cards/rows/figures settle in as they scroll into view (`md-reveal`, CSS scroll-driven, no JS), a deep-linked row lights briefly (`md-landed`), a reading hairline grows along the navbar on `/projects`, the theme toggle's icons cross-fade, `md-pulse` for status dots, `md-fade-in` for things that appear on a visitor's action (a new message on `/ask`, the darkroom form); `prefers-reduced-motion` neutralises all of it, delays included. No animation library — the bands are the one entrance a page makes.

Theme switching: the inline script in `app/layout.tsx` sets `html.dark`/`html.light` (saved override, else OS preference) and the `theme-color` meta before paint; `Navbar` keeps both in sync afterwards through a `useSyncExternalStore` theme store. Storage access goes through `app/lib/storage.ts`, which never throws.

## 4. App Router structure

Root layout `app/layout.tsx`: fonts, site-wide `metadata` (metadataBase, title template, description, Open Graph, Twitter) and `viewport.themeColor`; a skip link to `#main`; `VaultGate` (the typed-word easter egg) wrapping `Navbar`, the page, and `Footer`. No global padding and no landmark — each page renders its own title frame + `<main id="main" tabIndex={-1}>` (the skip-link target; `Navbar` is the single banner landmark).

| Route | Server file (metadata) | Client half | Notes |
|---|---|---|---|
| `/` | `app/page.tsx` (ISR, `revalidate = 900`) | — | Hero (StripeBand, portrait, blurb, profile buttons), Projects (3 newest, deep-linked to `/projects#slug`), Recent posts rail (server-rendered from `app/lib/posts.ts`), Skills accordion, Penrose grid, Person JSON-LD |
| `/projects` | `app/projects/page.tsx` | `ProjectsList.tsx` | Sort group (`aria-pressed`), accordion keyed by slug with `#hash` sync, click-to-play YouTube embeds |
| `/ask` | `app/ask/page.tsx` | `AskClient.tsx`, `SystemPanel.tsx` | Chat with the desktop concierge; status pill refreshes every 30s; progress poll every 2s while a question is in flight |
| `/contact` | `app/contact/page.tsx` | — | Email, phone (`tel:`), LinkedIn, GitHub as a `<dl>` |
| `/darkroom` | `app/darkroom/page.tsx` (noindex) | `DarkroomClient.tsx` | Gallery first; the upload station is behind "Keeper's entrance" |
| `/vault` | `app/vault/page.tsx` (noindex) | `VaultClient.tsx` | Gate form is server-rendered; the unlocked view depends on a sessionStorage flag |
| 404 / error | `app/not-found.tsx`, `app/error.tsx` | — | Same header/band frame as every page |

Generated metadata files: `app/opengraph-image.tsx` (1200×630 share card), `app/icon0.svg` (SVG favicon), `app/icon1.tsx` (64px PNG fallback), `app/apple-icon.tsx` (180px), `app/sitemap.ts` (`/sitemap.xml`), `app/robots.ts` (`/robots.txt`).

## 5. Components

- `components/brand/StripeBand.tsx` — the two bands. Title renders as `<h1>` (prop `as`), subtitle as `<p>`; text sits in a `max-width`/`--gutter-page` column so it aligns with page content at every width. `offset` is the distance from the top of the surface.
- `components/brand/Mark.tsx` — the BA monogram; colours come from `--mark-*` tokens (a `tone` prop forces a ground). `MonogramOg.tsx` is the box-drawn version for `next/og`.
- `components/ui.tsx` — `Button` (internal routes go through `next/link`, external links open in a new tab with a screen-reader cue, `pressed`, `disabled`, `newTab`, `rel`), `Chip`, `Card`, `Badge` (typed `ProjectStatus`), `ProgressBar` (real `role="progressbar"`), `SectionHeading`, `TextLink` (→ for internal, ↗ for external, `newTab` for files), `Dotted`, `statusLabel`. No `"use client"` — these render on the server.
- `components/Accordion.tsx` — the one stateful primitive (id-keyed, `aria-controls`, `inert` panels, optional `syncHash`); it also tells `DeferredMedia` (`components/DeferredMedia.tsx`) whether a row has been opened, so collapsed rows download no images or video posters.
- `components/PageFrame.tsx` — every subpage's opening: title frame + bands + the page's `<main id="main">`.
- `components/Navbar.tsx` — fixed bar with `<header><nav>`, `aria-current` on the active link, 44px theme toggle with a state-dependent label; tucks away on scroll-down on phones only (matchMedia store), pinned elsewhere; `inert` while hidden.
- `components/Footer.tsx` — one row: name + year (`Year.tsx`, computed in the browser), GitHub / LinkedIn / Email / Source. `components/SkipLink.tsx` focuses `#main` without touching the URL fragment.
- `components/RecentPosts.tsx` — renders a `Post[]` passed from the server.
- `components/RichText.tsx` — `**bold**`, `*italic*`, `` `code` ``, bare URLs (shown as host + path), and `~` aside lines; `stripAsides` for clamped previews.
- `components/MediaBadge.tsx`, `components/YouTubeEmbed.tsx` (poster + play button; loads the player only on click), `components/SkillsSection.tsx`, `components/VaultGate.tsx` (dialog semantics, Escape at any stage, focus restore, scroll lock).

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

`app/data/posts.ts` — hand-written posts (X entries can only come from here). `app/lib/posts.ts` merges them with the YouTube and Substack feeds (fetch cache 15 min, failures not cached).

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

- `metadataBase` = `https://www.bennettanderson.com`; per-page titles via the root template; canonical on `/projects`, `/ask`, `/contact`.
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
