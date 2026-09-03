import Image from "next/image";
import Link from "next/link";
import { FileText, Linkedin, Github, ArrowRight, Youtube } from "lucide-react";
import StripeBand from "./components/brand/StripeBand";
import SkillsSection from "./components/SkillsSection";
import RecentPosts from "./components/RecentPosts";
import MediaBadge from "./components/MediaBadge";
import { Button, Card, Badge, ProgressBar, SectionHeading, TextLink } from "./components/ui";
import RichText from "./components/RichText";
import { publishedProjects, projectSlug, statusOf, type Project } from "./data/projects";
import { getPosts } from "./lib/posts";
import {
  BLURB,
  GITHUB_URL,
  LINKEDIN_URL,
  RESUME_PATH,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  SUBSTACK_URL,
  YOUTUBE_URL,
  X_URL,
} from "./data/site";

// The page is built once and refreshed every 15 minutes so the "Recent posts"
// rail is in the HTML on first paint (see app/lib/posts.ts).
export const revalidate = 900;

function XLogo({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const catPhotos = [
  "/cats/Penny1.jpeg",
  "/cats/Penny2.jpeg",
  "/cats/Penny3.jpeg",
  "/cats/Penny4.jpeg",
  "/cats/Penny5.jpeg",
  "/cats/Penny6.jpeg",
];

// The band sits a little lower on the front page than on the subpages; on a
// phone that extra room is dead space, so it tightens up as the viewport does.
const HERO_OFFSET = "clamp(80px, 12vw, 104px)";

function ProjectCard({ p }: { p: Project }) {
  const status = statusOf(p);
  return (
    <Link href={`/projects#${projectSlug(p)}`} className="block" style={{ textDecoration: "none", color: "inherit" }}>
      <Card interactive className="md-project-card">
        <Image
          src={p.thumbnailUrl ?? "/thumbnails/default.png"}
          alt=""
          width={56}
          height={56}
          className="md-project-thumb"
          style={{ borderRadius: "var(--radius-md)", objectFit: "cover", border: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", margin: 0, color: "var(--text-strong)" }}>{p.title}</h3>
            <Badge status={status}>{status}</Badge>
            <MediaBadge media={p.media} suffix=" demo" />
          </div>
          <p
            style={{
              margin: "0 0 var(--space-5)",
              fontSize: "var(--text-sm)",
              lineHeight: "var(--leading-relaxed)",
              color: "var(--text-muted)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <RichText text={p.description} stripAsides links={false} />
          </p>
          {p.completion !== undefined && <ProgressBar label="completion" value={p.completion} style={{ maxWidth: 240 }} />}
        </div>
      </Card>
    </Link>
  );
}

export default async function HomePage() {
  const posts = await getPosts();
  // Newest first, so the homepage leads with whatever was worked on last.
  const recentProjects = [...publishedProjects].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Structured data: who this site is about, and the profiles it links to.
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/profile.jpeg`,
    jobTitle: "Biomedical engineering student",
    affiliation: { "@type": "CollegeOrUniversity", name: "Iowa State University" },
    sameAs: [GITHUB_URL, LINKEDIN_URL, YOUTUBE_URL, X_URL, SUBSTACK_URL].filter(Boolean),
  };

  return (
    // One continuous sunken, grained field — hero and content share a ground so
    // "about me" and the rest read as a single panel. A single full-bleed dapple
    // sits at the true foot (fixed height, not % of this tall page).
    <div
      className="md-grain md-dapple md-surface"
      style={{
        position: "relative",
        background: "var(--surface-sunken)",
        overflow: "hidden",
        ["--dapple-height" as string]: "150px",
      } as React.CSSProperties}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />

      {/* Hero — the two-band motif; no divider dapple, so it flows into the content */}
      <header style={{ position: "relative", overflow: "hidden", paddingBottom: "var(--space-11)" }}>
        <StripeBand offset={HERO_OFFSET} title={SITE_NAME} subtitle={SITE_TAGLINE} />
        <div
          className="md-above"
          style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: `calc(${HERO_OFFSET} + 144px) var(--gutter-page) 0` }}
        >
          <div className="flex flex-col md:flex-row" style={{ gap: "var(--space-10)", alignItems: "flex-start" }}>
            <Image
              src="/profile.jpeg"
              alt={`${SITE_NAME}, kayaking`}
              width={188}
              height={188}
              priority
              sizes="188px"
              style={{ borderRadius: "var(--radius-lg)", objectFit: "cover", border: "1px solid var(--border-default)", flex: "0 0 auto", width: "clamp(140px, 40vw, 188px)", height: "auto" }}
            />
            <div>
              <p style={{ margin: 0, maxWidth: "var(--measure)", fontSize: "var(--text-lg)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)" }}>
                {BLURB}
              </p>
              <div style={{ display: "flex", gap: "var(--space-5)", marginTop: "var(--space-7)", flexWrap: "wrap" }}>
                <Button variant="primary" href={RESUME_PATH} newTab iconLeft={<FileText size={15} />}>
                  Resume (PDF)
                </Button>
                <Button variant="secondary" href={LINKEDIN_URL} rel="me" iconLeft={<Linkedin size={15} />}>
                  LinkedIn
                </Button>
                <Button variant="secondary" href={GITHUB_URL} rel="me" iconLeft={<Github size={15} />}>
                  GitHub
                </Button>
                {YOUTUBE_URL && (
                  <Button variant="secondary" href={YOUTUBE_URL} rel="me" iconLeft={<Youtube size={15} />}>
                    YouTube
                  </Button>
                )}
                {X_URL && (
                  <Button variant="secondary" href={X_URL} rel="me" iconLeft={<XLogo />}>
                    X
                  </Button>
                )}
                {SUBSTACK_URL && (
                  <Button variant="ghost" href={SUBSTACK_URL} rel="me" iconRight={<ArrowRight size={15} />}>
                    Substack
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content — shares the hero's ground; the foot dapple lives on the wrapper */}
      <main
        id="main"
        style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "var(--space-10) var(--gutter-page) var(--space-11)" }}
      >
        <div className="md-above md-content-split">
          <section className="md-col-main" aria-labelledby="projects-heading">
            <SectionHeading kicker="Selected work" id="projects-heading">Projects</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {recentProjects.slice(0, 3).map((p) => (
                <ProjectCard key={p.title} p={p} />
              ))}
            </div>
            <div style={{ marginTop: "var(--space-6)" }}>
              <TextLink href="/projects" arrow>
                {`All ${publishedProjects.length} projects`}
              </TextLink>
            </div>
          </section>

          <aside className="md-rail" aria-labelledby="posts-heading">
            <section>
              <SectionHeading kicker="Video · essays · posts" id="posts-heading">Recent posts</SectionHeading>
              <RecentPosts posts={posts} />
              <div style={{ display: "flex", gap: "var(--space-6)", marginTop: "var(--space-6)", flexWrap: "wrap" }}>
                {YOUTUBE_URL && (
                  <TextLink href={YOUTUBE_URL} arrow>
                    YouTube
                  </TextLink>
                )}
                {SUBSTACK_URL && (
                  <TextLink href={SUBSTACK_URL} arrow>
                    Substack
                  </TextLink>
                )}
                {X_URL && (
                  <TextLink href={X_URL} arrow>
                    X
                  </TextLink>
                )}
              </div>
            </section>
          </aside>

          <section className="md-col-main" aria-labelledby="skills-heading">
            <SectionHeading kicker="What I can do" id="skills-heading">Skills</SectionHeading>
            <SkillsSection />
          </section>

          <section className="md-col-main" aria-labelledby="penrose-heading">
            <SectionHeading kicker="Lab assistant · quality assurance (naps on keyboards) · morale" id="penrose-heading">Penrose</SectionHeading>
            <p style={{ margin: "0 0 var(--space-6)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              She answers to her name. Type it anywhere.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: "var(--space-5)" }}>
              {catPhotos.map((src, i) => (
                <figure key={src} style={{ margin: 0 }}>
                  <div style={{ aspectRatio: "1", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                    <Image
                      src={src}
                      alt={`Penrose, observation ${i + 1}`}
                      width={400}
                      height={400}
                      sizes="(min-width: 1180px) 240px, (min-width: 640px) 22vw, 50vw"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                  <figcaption style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--text-faint)", marginTop: "var(--space-4)" }}>
                    obs_{String(i + 1).padStart(3, "0")}.jpeg
                  </figcaption>
                </figure>
              ))}
            </div>
            <div style={{ marginTop: "var(--space-6)" }}>
              <TextLink href="/darkroom" arrow>
                More prints in the darkroom
              </TextLink>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
