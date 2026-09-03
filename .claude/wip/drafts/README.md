# bennettanderson.com

Personal portfolio of Bennett M. Anderson — biomedical engineering student at Iowa State University. Live at [www.bennettanderson.com](https://www.bennettanderson.com), deployed on Vercel from `main`.

## Stack

- **Next.js 16** (App Router, React Compiler) + **React 19** + **TypeScript**
- **Tailwind v4** for utilities; the design system itself is plain CSS custom properties and component primitives in `app/globals.css` + `app/components/ui.tsx`
- `next/font/google` (Newsreader, Hanken Grotesk, JetBrains Mono)
- Vercel Analytics, Vercel Blob (photo gallery), Upstash Redis (relay for the local-LLM concierge)

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run preflight  # lint + type-check + production build (run before every push)
```

`npm run build` also regenerates `public/sitemap*.xml` and `public/robots.txt` via `next-sitemap`; commit those alongside your change.

## Where things live

| Path | What |
|---|---|
| `app/data/site.ts` | Every site-wide constant: name, tagline, URLs, contact details, easter-egg codes |
| `app/data/projects.ts` | The project list rendered on `/` and `/projects` |
| `app/data/posts.ts` | Hand-maintained "Recent posts" entries (merged with the live YouTube/Substack feeds) |
| `app/data/ABOUT_BENNETT.md` | Grounding document for the `/ask` concierge model |
| `app/globals.css` | Design tokens (light + dark grounds), brand textures, component primitives |
| `app/components/` | Navbar, brand marks (`StripeBand`, `Mark`), UI primitives, shared widgets |
| `app/api/` | Posts feed, concierge relay, photo gallery |
| `public/` | Static assets — thumbnails, previews, cat photos, resume PDF |
| `scripts/site-health-check.mjs` | Read-only asset/sitemap check run by the weekly GitHub Action |
| `tools/` | Offline helpers: resume builder, project editor, concierge desktop node |

See [CLAUDE.md](CLAUDE.md) for the operating guardrails and [SITE_DOCS.md](SITE_DOCS.md) for the full reference.

## Environment variables

All optional — each feature degrades to an honest "not configured" state without them.

| Variable | Feature |
|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | `/ask` concierge relay (queue + heartbeat) |
| `CONCIERGE_SHARED_SECRET` | Attached to each queued question so the desktop node can verify origin |
| `BLOB_READ_WRITE_TOKEN` | `/darkroom` gallery storage (auto-injected by Vercel when a Blob store is attached) |
| `DARKROOM_CODE` | Upload password for `/darkroom` (server-checked) |

## Deploy flow

Branch → push → Vercel preview → review → merge to `main`. Never push to `main` directly; every push there is a production deploy.
