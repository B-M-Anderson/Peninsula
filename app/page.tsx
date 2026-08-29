"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Linkedin, Github, ArrowRight, Camera, Video, Youtube } from "lucide-react";
import StripeBand from "./components/brand/StripeBand";
import SkillsSection from "./components/SkillsSection";
import RecentPosts from "./components/RecentPosts";
import { Button, Card, Badge, ProgressBar, SectionHeading, TextLink } from "./components/ui";
import { projects, type Project } from "./data/projects";
import { GITHUB_URL, LINKEDIN_URL, RESUME_PATH, SUBSTACK_URL, YOUTUBE_URL, X_URL } from "./data/site";

function XLogo({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SITE_NAME = "Bennett M. Anderson";
const BLURB =
  "I'm a biomedical engineering student working to improve my skills, computational and otherwise, to become the best engineer/scientist I can in the pursuit of the betterment of global health.";

const catPhotos = [
  "/cats/Penny1.jpeg",
  "/cats/Penny2.jpeg",
  "/cats/Penny3.jpeg",
  "/cats/Penny4.jpeg",
  "/cats/Penny5.jpeg",
  "/cats/Penny6.jpeg",
];

function statusOf(p: Project): string {
  if (p.terminated) return "terminated";
  if (p.completed) return "complete";
  if (p.ongoing) return "ongoing";
  if (p.wip) return "wip";
  if (p.shelved) return "shelved";
  return "ongoing";
}

function MediaBadge({ media }: { media?: Project["media"] }) {
  if (!media || media === "none") return null;
  const icon = media === "video" ? <Video size={11} /> : <Camera size={11} />;
  return <Badge icon={icon}>{media} demo</Badge>;
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <Link href="/projects" className="block" style={{ textDecoration: "none", color: "inherit" }}>
      <Card interactive style={{ display: "flex", gap: "var(--space-6)" }}>
        <Image
          src={p.thumbnailUrl ?? "/thumbnails/default.png"}
          alt=""
          width={56}
          height={56}
          style={{ borderRadius: "var(--radius-md)", objectFit: "cover", border: "1px solid var(--border-subtle)", background: "var(--surface-sunken)", flex: "0 0 auto", height: 56 }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", margin: 0, color: "var(--text-strong)" }}>{p.title}</h3>
            <Badge status={statusOf(p)}>{statusOf(p)}</Badge>
            <MediaBadge media={p.media} />
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
            {p.description}
          </p>
          {p.completion !== undefined && <ProgressBar label="completion" value={p.completion} style={{ maxWidth: 240 }} />}
        </div>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  return (
    // One continuous sunken, grained field — hero and content share a ground so
    // "about me" and the rest read as a single panel. A single full-bleed dapple
    // sits at the true foot (fixed height, not % of this tall page).
    <div
      className="md-grain md-dapple"
      style={{
        position: "relative",
        background: "var(--surface-sunken)",
        overflow: "hidden",
        ["--dapple-height" as string]: "150px",
      } as React.CSSProperties}
    >
      {/* Hero — the two-band motif; no divider dapple, so it flows into the content */}
      <header
        style={{ position: "relative", overflow: "hidden", paddingBottom: "var(--space-11)" }}
      >
        <StripeBand offset="104px" title={SITE_NAME} subtitle="Biomedical engineering · Iowa State University" />
        <div
          className="md-above"
          style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "248px var(--space-9) 0" }}
        >
          <div className="flex flex-col md:flex-row" style={{ gap: "var(--space-10)", alignItems: "flex-start" }}>
            <Image
              src="/profile.jpeg"
              alt={SITE_NAME}
              width={188}
              height={188}
              priority
              style={{ borderRadius: "var(--radius-lg)", objectFit: "cover", border: "1px solid var(--border-default)", flex: "0 0 auto", width: 188, height: 188 }}
            />
            <div>
              <p style={{ margin: 0, maxWidth: "var(--measure)", fontSize: "var(--text-lg)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)" }}>
                {BLURB}
              </p>
              <div style={{ display: "flex", gap: "var(--space-5)", marginTop: "var(--space-7)", flexWrap: "wrap" }}>
                <Button variant="primary" href={RESUME_PATH} download iconLeft={<Download size={15} />}>
                  Download resume
                </Button>
                <Button variant="secondary" href={LINKEDIN_URL} iconLeft={<Linkedin size={15} />}>
                  LinkedIn
                </Button>
                <Button variant="secondary" href={GITHUB_URL} iconLeft={<Github size={15} />}>
                  GitHub
                </Button>
                {YOUTUBE_URL && (
                  <Button variant="secondary" href={YOUTUBE_URL} iconLeft={<Youtube size={15} />}>
                    YouTube
                  </Button>
                )}
                {X_URL && (
                  <Button variant="secondary" href={X_URL} iconLeft={<XLogo />}>
                    X
                  </Button>
                )}
                {SUBSTACK_URL && (
                  <Button variant="ghost" href={SUBSTACK_URL} iconRight={<ArrowRight size={15} />}>
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
        style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "var(--space-10) var(--space-9) var(--space-11)" }}
      >
        <div className="md-above md-content-split">
          <section className="md-col-main">
            <SectionHeading kicker="Selected work">Projects</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {projects.slice(0, 3).map((p) => (
                <ProjectCard key={p.title} p={p} />
              ))}
            </div>
            <div style={{ marginTop: "var(--space-6)" }}>
              <TextLink href="/projects" arrow>
                All four projects
              </TextLink>
            </div>
          </section>

          <aside className="md-rail">
            <section>
              <SectionHeading kicker="Video · essays · posts">Recent posts</SectionHeading>
              <RecentPosts />
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

          <section className="md-col-main">
            <SectionHeading kicker="What I can do">Skills</SectionHeading>
            <SkillsSection />
          </section>

          <section className="md-col-main">
            <SectionHeading kicker="Lab assistant · quality assurance (naps on keyboards) · morale">Penrose</SectionHeading>
            <p style={{ margin: "0 0 var(--space-6)", fontSize: "var(--text-sm)", color: "var(--text-faint)" }}>
              She answers to her name. Type it anywhere.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: "var(--space-5)" }}>
              {catPhotos.map((src, i) => (
                <figure key={src} style={{ margin: 0 }}>
                  <div style={{ aspectRatio: "1", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                    <Image src={src} alt={`Penrose, observation ${i + 1}`} width={400} height={400} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
