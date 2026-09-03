# WIP: website review & overhaul — resume notes

**This directory is temporary.** It is NOT part of the site build (nothing under
`.claude/` is imported by Next). Delete it before the PR is marked ready.

## State when paused (2026-09-03)

- Branch `claude/website-review-overhaul-dpoy2m`, no site code changed yet. Baseline
  `npm run preflight` (lint + tsc + build) is green on `main`/this branch.
- The 8-dimension review workflow (`review/site-review.workflow.js`) was stopped mid-run
  because the container only runs 2 agents at a time. Its journal lives in the container
  and will likely be gone; re-run the workflow from that script (16 agents: 8 finders,
  8 batched verifiers). `review/finder-results.jsonl` holds the one finder (SEO) that
  completed — it matches the plan below.
- `review/before-report.json` + `review/shoot.js`: Playwright pass over every page
  (mobile/desktop × light/dark) BEFORE changes. Findings: no `<h1>` anywhere except
  /darkroom, two `<main>` landmarks on /, /projects, /ask, /contact, every tab titled
  "B. A.", default unstyled 404. The only console 404 is `/_vercel/insights/script.js`,
  which only exists on Vercel — not a bug.
- The sandbox cannot reach youtube.com / substack.com, so `/api/posts` is empty here.
  That is an egress restriction, not a site bug.

## Drafts (`drafts/`) — new files, not yet wired in

| Draft | Intended location | Notes |
|---|---|---|
| `opengraph-image.tsx` | `app/opengraph-image.tsx` | needs `SITE_NAME`, `SITE_TAGLINE` exported from `app/data/site.ts` |
| `icon.tsx`, `apple-icon.tsx` | `app/icon.tsx`, `app/apple-icon.tsx` | move the `Monogram` helper out of `icon.tsx` into `app/components/brand/MonogramOg.tsx` (metadata route files should only have the standard exports) |
| `not-found.tsx`, `error.tsx` | `app/` | use a new `--gutter` token (`clamp(20px, 5vw, 48px)`) to add to `globals.css` |
| `lib-posts.ts` | `app/lib/posts.ts` | drop the `import "server-only"` line (package not installed) or `npm i server-only`; needs `SITE_URL`, `YOUTUBE_CHANNEL_ID` in site.ts; `/api/posts/route.ts` becomes a thin wrapper; homepage calls `getPosts()` server-side with `export const revalidate = 900` |
| `YouTubeEmbed.tsx` | `app/components/YouTubeEmbed.tsx` | click-to-play facade replacing the always-loaded iframe in the projects accordion |
| `Navbar.tsx` | replaces `app/components/Navbar.tsx` | fixes dead `#scroll-panel` reference; `<header><nav>`; `aria-current`; 40px toggle target; phone-only hide-on-scroll via matchMedia |
| `Accordion-part.tsx` | replaces the Accordion section of `app/components/ui.tsx` | id-based open state (fixes the "open row changes when you re-sort" bug), `#hash` deep links, `inert` on collapsed panels; needs `useSyncExternalStore`/`useEffect` imported in ui.tsx; `Button` gains a `pressed` prop (`aria-pressed`) |
| `ProjectsList.tsx` | `app/projects/ProjectsList.tsx` | client half of /projects; `app/projects/page.tsx` becomes a server component exporting metadata; needs `projectSlug()` and `statusOf()` exported from `app/data/projects.ts` and a shared `app/components/MediaBadge.tsx` |
| `README.md` | replaces root `README.md` | |

## Remaining plan (in order)

1. `app/data/site.ts`: add `SITE_URL`, `SITE_NAME`, `SITE_TAGLINE`, `YOUTUBE_CHANNEL_ID`, `CONTACT_PHONE_TEL`.
2. `app/layout.tsx`: full metadata (title template, description, metadataBase, OG/Twitter, icons), `viewport.themeColor`, skip link, root `<main>` → `<div>` so pages own the single `<main>`; `@vercel/analytics/next` import; JSON-LD Person on the homepage.
3. `globals.css`: `--gutter` token, `color-scheme` on `html.dark`/`html.light`, `scroll-margin-top` on accordion rows, `.md-acc-inner[inert]` visibility, video-poster hover.
4. `StripeBand`: title renders as `<h1>` (prop `as`), so every page has one.
5. Pages: `/` and `/contact` → server components; `/projects`, `/ask`, `/vault`, `/darkroom` split into server `page.tsx` (metadata; `robots: noindex` for vault + darkroom) + client component. Homepage project cards link to `/projects#<slug>`.
6. `/contact`: phone becomes a `tel:` link. `/darkroom`: `<form>` so Enter submits, StripeBand header, `next/image` for blob photos (add `images.remotePatterns` for `*.public.blob.vercel-storage.com`).
7. `VaultGate`: `role="dialog"`, `aria-modal`, Escape at any stage, focus restore.
8. `next.config.ts`: `poweredByHeader: false`, security headers (nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy).
9. `next-sitemap.config.js`: `autoLastmod: false` (stops the weekly "SITEMAP DRIFT" false alarm), regenerate `public/sitemap*.xml`.
10. Hygiene: delete `public/{next,vercel,file,globe,window}.svg` and the 4 unused thumbnails (`Peninsula.png`, `Desk-Side-Cat-Tree.png`, `mp3-Playlist-Crossfader.png`, `resume-latex.png`); trim the GitHub-repo check from `scripts/site-health-check.mjs`; rewrite README; refresh the stale design sections of CLAUDE.md / SITE_DOCS.md.
11. `npm run preflight`, Playwright after-pass (`review/shoot.js` with `BASE`/`OUT` env), adversarial diff-review workflow, commit, push, draft PR listing every user-visible change for veto.
