import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FileText, Linkedin, Github } from "lucide-react";
import LeafLogo from "./components/brand/LeafLogo";
import { SKILL_GROUPS } from "./components/SkillsSection";
import { Badge, Button, Dotted, TextLink, statusLabel } from "./components/ui";
import { typeset } from "./lib/typeset";
import { openGraphFor } from "./lib/og";
import { projectCounts, publishedProjects, projectSlug, statusOf, summaryOf } from "./data/projects";
import { postLabel } from "./data/posts";
import { getPosts } from "./lib/posts";
import {
  BLURB,
  CURRENTLY,
  GITHUB_URL,
  HERO_FACTS,
  LINKEDIN_URL,
  RESUME_PATH,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  SUBSTACK_URL,
  YOUTUBE_URL,
  X_URL,
} from "./data/site";

// The page is built once and refreshed every 15 minutes so the Posts tile is in
// the HTML on first paint (see app/lib/posts.ts).
export const revalidate = 900;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: openGraphFor("/"),
};

function postDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/**
 * The front page is a hub, not an article: who I am and what I'm looking for
 * in the first screen, then one tile per section of the site, each showing its
 * newest few things and leading to its own page.
 */
export default async function HomePage() {
  const posts = [...(await getPosts())].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  // Newest first, so the tile leads with whatever was worked on last.
  const newest = [...publishedProjects].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  const counts = projectCounts();

  // Structured data: who this site is about, and the profiles it links to.
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
    jobTitle: "Biomedical engineering senior",
    affiliation: { "@type": "CollegeOrUniversity", name: "Iowa State University" },
    sameAs: [GITHUB_URL, LINKEDIN_URL, YOUTUBE_URL, X_URL, SUBSTACK_URL].filter(Boolean),
  };

  return (
    <main id="main" tabIndex={-1} className="pg md-dapple">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />

      {/* Hero: the leaf grown for this visit beside the introduction. On a phone the leaf comes first. */}
      <section className="home-hero" aria-labelledby="home-name">
        <div className="home-leaf">
          <LeafLogo />
        </div>
        <div className="home-intro">
          <p className="home-tagline">{SITE_TAGLINE}</p>
          <h1 id="home-name" className="home-name">{SITE_NAME}</h1>
          <p className="md-label" style={{ margin: 0, lineHeight: 1.8 }}>
            <Dotted items={HERO_FACTS} />
          </p>
          <p className="md-lede" style={{ margin: 0 }}>{typeset(BLURB)}</p>
          <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="primary" href={RESUME_PATH} newTab iconLeft={<FileText size={15} />}>
              Resume (PDF)
            </Button>
            <Button variant="secondary" href={LINKEDIN_URL} rel="me" iconLeft={<Linkedin size={15} />}>
              LinkedIn
            </Button>
            <Button variant="secondary" href={GITHUB_URL} rel="me" iconLeft={<Github size={15} />}>
              GitHub
            </Button>
          </div>
        </div>
      </section>

      {/* The two lines a recruiter or collaborator wants first. */}
      <dl className="home-status">
        <div className="home-status-card" data-lead="">
          <dt>
            <span aria-hidden className="home-dot" />
            Looking for
          </dt>
          <dd>{typeset(CURRENTLY.lookingFor)}</dd>
        </div>
        <div className="home-status-card">
          <dt>
            <span aria-hidden className="home-dot md-pulse" style={{ background: "var(--status-complete)" }} />
            Now
          </dt>
          <dd>{typeset(CURRENTLY.now)}</dd>
        </div>
      </dl>

      {/* One tile per section of the site. */}
      <div className="hub">
        <section className="hub-tile hub-wide" aria-labelledby="hub-projects">
          <div className="hub-head">
            <h2 id="hub-projects"><Link href="/projects">Projects</Link></h2>
            <span className="md-label"><Dotted items={[`${counts.total} projects`, `${counts.byStatus.complete} complete`, counts.latestLabel ? `updated ${counts.latestLabel}` : null]} /></span>
          </div>
          <ul className="hub-rows">
            {newest.map((p) => {
              const status = statusOf(p);
              return (
                <li key={p.title}>
                  <Link href={`/projects/${projectSlug(p)}`} className="hub-row">
                    <Image src={p.thumbnailUrl ?? "/thumbnails/default.png"} alt="" width={44} height={44} className="hub-thumb" />
                    <span className="hub-row-text">
                      <span className="hub-row-title">
                        {p.title} <Badge status={status}>{statusLabel[status]}</Badge>
                      </span>
                      <span className="hub-row-sub">{summaryOf(p)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <TextLink href="/projects" arrow>{`All ${publishedProjects.length} projects`}</TextLink>
        </section>

        <section className="hub-tile" aria-labelledby="hub-posts">
          <div className="hub-head">
            <h2 id="hub-posts"><Link href="/posts">Posts</Link></h2>
            <span className="md-label"><Dotted items={["Video", "essays", "posts"]} /></span>
          </div>
          {posts.length ? (
            <ul className="hub-rows">
              {posts.map((p) => (
                <li key={`${p.date}-${p.url}`}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="hub-row">
                    <span className="hub-row-text">
                      <span className="md-label">{postLabel(p)} · {postDate(p.date)}</span>
                      <span className="hub-row-title">{p.title}</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hub-text">Nothing published yet — the channels below are where it will land.</p>
          )}
          <TextLink href="/posts" arrow>All posts</TextLink>
        </section>

        <section className="hub-tile" aria-labelledby="hub-about">
          <div className="hub-head">
            <h2 id="hub-about"><Link href="/about">About</Link></h2>
            <span className="md-label">What I can do</span>
          </div>
          <ul className="hub-chips" aria-label="Skill groups">
            {SKILL_GROUPS.map((g) => (
              <li key={g.name} className="md-chip">
                {g.name} <span style={{ color: "var(--text-faint)" }}>{g.count}</span>
              </li>
            ))}
          </ul>
          <TextLink href="/about" arrow>Skills, background and Penrose</TextLink>
        </section>

        <section className="hub-tile" aria-labelledby="hub-ask">
          <div className="hub-head">
            <h2 id="hub-ask"><Link href="/ask">askB.AI</Link></h2>
          </div>
          <p className="hub-text">Questions about my work, answered by a small language model running on an old desktop in my house.</p>
          <TextLink href="/ask" arrow>Ask a question</TextLink>
        </section>

        <section className="hub-tile" aria-labelledby="hub-contact">
          <div className="hub-head">
            <h2 id="hub-contact"><Link href="/contact">Contact</Link></h2>
          </div>
          <p className="hub-text">Email, phone or LinkedIn all work. Say what it&rsquo;s about in your first message.</p>
          <TextLink href="/contact" arrow>Get in touch</TextLink>
        </section>
      </div>
    </main>
  );
}
