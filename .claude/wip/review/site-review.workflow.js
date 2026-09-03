export const meta = {
  name: 'site-review',
  description: 'Review the portfolio site across 8 dimensions, adversarially verify each finding',
  phases: [
    { title: 'Find', detail: 'one reviewer per dimension' },
    { title: 'Verify', detail: 'two skeptics per finding, distinct lenses' },
  ],
}

const REPO = '/home/user/Peninsula'

const CONTEXT = `
You are reviewing a small personal portfolio website (Next.js 16 App Router, React 19, TypeScript, Tailwind v4, deployed on Vercel at https://www.bennettanderson.com). Repo root: ${REPO}. Dependencies are installed. Baseline lint, tsc and build all pass.

Important facts:
- The site was recently re-skinned to "MarcDesign01": brown/tan/cream palette, design tokens + component primitives in app/globals.css, primitives in app/components/ui.tsx, StripeBand + Mark brand components. CLAUDE.md and SITE_DOCS.md are STALE (they describe an older "cyber-bio terminal" design with an AsciiDna component and #scroll-panel that no longer exist) — do not trust them as ground truth; trust the code.
- Pages: / (app/page.tsx), /projects, /ask (local-LLM concierge), /contact, /vault (easter egg), /darkroom (photo gallery on Vercel Blob). API routes under app/api/. Data in app/data/. Root layout app/layout.tsx. Fonts app/fonts.ts. Config: next.config.ts, next-sitemap.config.js, eslint.config.mjs, tsconfig.json. CI: .github/workflows/site-maintenance.yml + scripts/site-health-check.mjs.
- The owner asked for "a full review and overhaul ... to make it as professional, smooth, and generally the best possible experience for the user". We want concrete, actionable improvements. Copy/content/design changes are allowed but must be flagged so the owner can veto them.

Rules: READ-ONLY. Do not edit any file. You may run \`npm run lint\` and \`npx tsc --noEmit\` but do NOT run \`npm run build\` or \`npm run dev\`. Read every file relevant to your dimension in full (they are small; total app/ is ~3300 lines). Cite exact file paths and line numbers. Prefer findings that are specific and verifiable over generic advice. Do not pad: only report things that are actually true of this code. For each finding give a concrete proposed fix.
`

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'integer' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          evidence: { type: 'string', description: 'What the code does today and why it is a problem; quote the relevant lines' },
          proposed_fix: { type: 'string', description: 'Concrete change, specific enough to implement' },
          user_visible_change: { type: 'boolean', description: 'true if the fix changes copy, content, or visual design that the owner should sign off on' },
        },
        required: ['title', 'file', 'line', 'severity', 'evidence', 'proposed_fix', 'user_visible_change'],
      },
    },
  },
  required: ['findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    real: { type: 'boolean', description: 'The problem genuinely exists in this codebase as described' },
    worth_doing: { type: 'boolean', description: 'Fixing it materially improves the site and the proposed fix is sound' },
    risk: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Risk that the proposed fix breaks something or is contested' },
    note: { type: 'string', description: 'One to three sentences: why, and any correction to the finding or fix' },
  },
  required: ['real', 'worth_doing', 'risk', 'note'],
}

const DIMENSIONS = [
  { key: 'a11y', prompt: `Dimension: ACCESSIBILITY. Audit against WCAG 2.2 AA: landmarks (note: check whether pages nest a <main> inside the root layout's <main>), heading hierarchy (is there an h1 on each page?), keyboard operability and focus order, focus visibility, ARIA usage on the Accordion/disclosures (are collapsed panels' links/iframes still tabbable?), dialogs (VaultGate overlay: role, modal semantics, Escape, focus management), form labels, live regions on /ask, colour contrast of the muted/faint text tokens on both grounds (compute contrast ratios from the hex/rgba values in globals.css), reduced-motion handling, skip links, tap-target sizes on mobile, alt text, link purpose (external links opening new tabs without warning), the theme toggle button semantics.` },
  { key: 'seo', prompt: `Dimension: SEO, METADATA, SOCIAL SHARING, CRAWLABILITY. Inspect app/layout.tsx metadata and every page for: title/description quality and per-page titles (client pages cannot export metadata — check which pages are client components), metadataBase/canonical, Open Graph + Twitter cards and an OG image (none exists — consider app/opengraph-image.tsx via next/og), viewport/themeColor, robots/noindex for /vault and /darkroom (they are excluded from the sitemap but is there a noindex?), structured data (Person JSON-LD) suitability, sitemap/robots correctness (next-sitemap.config.js, public/robots.txt), heading semantics (StripeBand renders the page title as a <span>), lang, icons (app/favicon.ico does NOT exist; icon is /ba-favicon.svg — is there an apple-touch-icon / PNG fallback?), the Google/Bing verification files in public/, link rel for external links.` },
  { key: 'perf', prompt: `Dimension: PERFORMANCE & LOADING. Look at: client/server component boundaries (app/page.tsx and app/contact/page.tsx are "use client" but use no hooks — could they be server components? what does that save?), whether RecentPosts fetching /api/posts on the client causes a visible content flash/CLS (app/data/posts.ts is EMPTY so first paint shows "nothing published yet" then swaps), whether posts could be fetched server-side with ISR, YouTube iframe embeds in the projects Accordion (every project with videoUrl renders an iframe even when collapsed — check the loading behaviour; consider a click-to-load facade), next/image usage (sizes props, priority, remote patterns), font loading (app/fonts.ts weights), framer-motion bundle usage, third-party scripts (@vercel/analytics/react vs /next entry point), caching headers on API routes, revalidate settings, anything that runs on every render or every scroll without throttling (Navbar scroll handler), image asset sizes in public/ (public/cats is 1.5MB; are they served through next/image?).` },
  { key: 'react', prompt: `Dimension: REACT/NEXT CORRECTNESS & BUGS. Hunt for real bugs: the Navbar scroll-hide effect references document.getElementById("scroll-panel") which no longer exists anywhere (grep to confirm) — what is the actual behaviour on desktop vs mobile, and on resize?; Accordion uses index keys and an index-based open state — what happens on /projects when the sort changes (does the open panel silently switch to a different project)?; hydration risks (useSyncExternalStore server snapshots, the inline theme script, suppressHydrationWarning scope); stale closures (ask page's history built from \`lines\`); effects that set state without cleanup; AbortController usage; date parsing of non-ISO strings like "August 21, 2026" across browsers; the \`useEffect(refresh, [])\` in darkroom (refresh returns undefined — fine? check it doesn't return a promise); TextLink target logic for mailto; RecentPosts using next/link for external URLs; any TypeScript looseness (statusOf returning string, Badge statusColor Record<string,...>), the Project type's mutually exclusive status booleans; anything that eslint would not catch but is wrong.` },
  { key: 'api', prompt: `Dimension: API ROUTES — SECURITY, ROBUSTNESS, ERROR HANDLING. Review app/api/** and app/api/concierge/upstash.ts: input validation, untrusted input in Redis keys, unhandled promise rejections (e.g. \`put()\` in /api/photos POST throwing → 500 with a stack?), formData parsing of oversized bodies before size checks, missing try/catch, Cache-Control choices vs \`export const revalidate\`, whether /api/posts being prerendered static at build (○ in the build output) is what we want, the User-Agent strings referencing the wrong domain (bennett-anderson.com vs bennettanderson.com), regex-based XML parsing edge cases (CDATA, entities, missing fields), is /api/substack still used anywhere (grep) or dead code superseded by /api/posts, the priority code in the client bundle (documented as intentional — but check the header comparison is not vulnerable to anything), security headers in next.config.ts (none set: consider X-Content-Type-Options, Referrer-Policy, X-Frame-Options/frame-ancestors, Permissions-Policy, poweredByHeader), and anything a pentester would flag.` },
  { key: 'responsive', prompt: `Dimension: RESPONSIVE LAYOUT, MOBILE UX, DESIGN CONSISTENCY. Trace the CSS and inline styles for phones (360px) through desktop (1440px): page gutters (pages use a fixed var(--space-9)=48px side padding on mobile; /ask uses clamp), hero padding-top 248px on app/page.tsx and StripeBand offsets vs the fixed Navbar height, the whitespace-nowrap title in StripeBand at 7.6vw, --stripe-inset max(48px, ...), overflow-x-hidden dependency notes in globals.css that reference a "mobile DNA strip" that no longer exists, the homepage grid split at 900px, ProjectCard thumbnail+title+badges wrapping, the cats grid, Navbar link strip overflow on narrow screens, the theme toggle target size, /darkroom and /vault which still use the legacy "font-term" terminal look and Tailwind utility styling rather than the MarcDesign01 StripeBand/tokens (design inconsistency — propose bringing them in line, flagged as user-visible), light-mode parity of every surface (any hard-coded colours that ignore html.light?), the Mark component tone prop vs theme, color-scheme for native form controls/scrollbars, print styles.` },
  { key: 'ux', prompt: `Dimension: UX POLISH, STATES, MICRO-INTERACTIONS. Walk each page as a first-time visitor (a recruiter or collaborator): what's missing or rough? Consider: no custom 404 (app/not-found.tsx) or error boundary (app/error.tsx) or loading UI; homepage project cards link to /projects generically rather than opening that specific project (deep-link + open the matching accordion item + scroll); /projects sort buttons lack aria-pressed/group semantics and the open panel resets confusingly; contact page phone number is not a tel: link; darkroom code input doesn't submit on Enter and the upload flow's messages; /ask empty/offline/error states and the disabled-send affordance; the vault gate overlay closing on backdrop click during boot; the navbar hide-on-scroll consistency; external links opening in new tabs; the "Download resume" affordance; copy typos or inconsistencies you notice in UI strings (report but flag as user_visible_change=true, do NOT propose rewrites of the owner's prose in app/data/projects.ts beyond obvious typos); footer absence (no site footer with links/copyright/last-updated); anything a professional portfolio typically has that this lacks — but only propose things that fit this site's restrained design.` },
  { key: 'hygiene', prompt: `Dimension: TOOLING, DOCS, CONFIG, REPO HYGIENE. Check: README.md is the untouched create-next-app template; CLAUDE.md and SITE_DOCS.md describe a design that no longer exists (list the specific stale claims: cyber-bio terminal, AsciiDna, #scroll-panel, dark: class variant via @custom-variant — verify which are still true, e.g. the @custom-variant dark line DOES still exist in globals.css), leftover create-next-app assets in public/ (next.svg, vercel.svg, file.svg, globe.svg, window.svg — grep to confirm unused), scripts/site-health-check.mjs still checks GitHub repo thumbnails for a homepage feature that was removed (verify), the weekly workflow's node version (20) vs package engines, next.config.ts (no images.remotePatterns, no headers, no poweredByHeader), tsconfig target ES2017, eslint config, .gitignore, package.json name "my-portfolio", the committed public/sitemap*.xml drift (postbuild regenerates it — is committing it a good idea?), TASKS.md, the tools/ directory relevance to the site, .claude/ local Windows launch files committed to the repo, any secrets or PII risks (CONTACT_PHONE is rendered on the public contact page — that's intentional; just note it), the Analytics import path.` },
]

const FINDER_PROMPT = (d) => `${CONTEXT}\n\n${d.prompt}\n\nReturn every genuine finding for this dimension (aim for completeness; typically 6-15 findings). Severity: high = broken/clearly wrong for users, medium = noticeably unprofessional or a real bug, low = polish.`

const BATCH_VERDICTS_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer', description: 'zero-based index of the finding in the list you were given' },
          real: { type: 'boolean', description: 'The problem genuinely exists in this codebase exactly as described' },
          worth_doing: { type: 'boolean', description: 'Fixing it materially improves the site and the proposed fix is sound and safe' },
          risk: { type: 'string', enum: ['low', 'medium', 'high'] },
          note: { type: 'string', description: 'One to three sentences: why; any correction to the finding or to the fix approach' },
        },
        required: ['index', 'real', 'worth_doing', 'risk', 'note'],
      },
    },
  },
  required: ['verdicts'],
}

const VERIFY_PROMPT = (d, findings) => `${CONTEXT}

You are a SKEPTICAL VERIFIER for the "${d.key}" review dimension. A reviewer produced the findings below. For EACH finding, open the cited files and check it against the real code, then judge it on two lenses:
(1) DOES IT REPRODUCE? Default to real=false if the evidence does not hold up on inspection, the cited lines do not show what is claimed, or the claim is generic advice rather than a fact about this code. Also check the proposed fix is correct for Next 16 / React 19 / Tailwind v4 as used here.
(2) IS IT WORTH DOING AND SAFE? Default to worth_doing=false for churn, or for fixes that fight the site's deliberately restrained design, or that could break hydration, the react-hooks/set-state-in-effect lint rule, the build, the light theme, the easter eggs, the concierge relay, or the Vercel deploy. If the problem is real but the proposed approach is wrong, set worth_doing=true and give the right approach in note.
Return one verdict per finding, using the finding's zero-based index. Do not skip any.

FINDINGS (${findings.length}):
${JSON.stringify(findings, null, 2)}`

phase('Find')
const results = await pipeline(
  DIMENSIONS,
  (d) => agent(FINDER_PROMPT(d), { label: `find:${d.key}`, phase: 'Find', schema: FINDINGS_SCHEMA }),
  async (found, d) => {
    if (!found || !found.findings || !found.findings.length) return []
    log(`${d.key}: ${found.findings.length} findings — verifying`)
    const v = await agent(VERIFY_PROMPT(d, found.findings), { label: `verify:${d.key}`, phase: 'Verify', schema: BATCH_VERDICTS_SCHEMA })
    const byIdx = new Map((v && v.verdicts ? v.verdicts : []).map((x) => [x.index, x]))
    return found.findings.map((f, i) => ({ dimension: d.key, ...f, verdict: byIdx.get(i) || null }))
  },
)

const all = results.flat().filter(Boolean)
const confirmed = all.filter((f) => f.verdict && f.verdict.real && f.verdict.worth_doing)
const rejected = all.filter((f) => !confirmed.includes(f))
log(`confirmed ${confirmed.length} / ${all.length} findings`)
return { confirmed, rejected }