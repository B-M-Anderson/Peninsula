import type { Metadata } from "next";
import Image from "next/image";
import { FileText, Linkedin, Github } from "lucide-react";
import penny1 from "../../public/cats/Penny1.jpeg";
import penny2 from "../../public/cats/Penny2.jpeg";
import penny3 from "../../public/cats/Penny3.jpeg";
import penny4 from "../../public/cats/Penny4.jpeg";
import penny5 from "../../public/cats/Penny5.jpeg";
import penny6 from "../../public/cats/Penny6.jpeg";
import PageFrame from "../components/PageFrame";
import SkillsSection from "../components/SkillsSection";
import { Button, Dotted, SectionHeading, TextLink } from "../components/ui";
import { typeset } from "../lib/typeset";
import { openGraphFor } from "../lib/og";
import { BLURB, CURRENTLY, GITHUB_URL, HERO_FACTS, LINKEDIN_URL, RESUME_PATH, SITE_TAGLINE, SUBSTACK_URL, X_URL, YOUTUBE_URL } from "../data/site";

const description = "Who I am, what I'm looking for, what I can do, and Penrose.";

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about" },
  openGraph: openGraphFor("/about", description),
};

// Static imports so each photo blurs up from its own colours instead of a
// blank box; the health check reads the import paths above.
const catPhotos = [penny1, penny2, penny3, penny4, penny5, penny6];

/* About gathers what used to trail down the homepage: the introduction, the
   Now / Looking-for lines, skills, and Penrose. A short index at the top jumps
   to each part. */
export default function AboutPage() {
  return (
    <PageFrame title="About" subtitle={SITE_TAGLINE}>
      <nav aria-label="On this page" className="about-index">
        <TextLink href="#now-heading">Now</TextLink>
        <TextLink href="#skills-heading">Skills</TextLink>
        <TextLink href="#penrose-heading">Penrose</TextLink>
      </nav>

      <div className="about-grid">
        <section aria-label="Introduction" className="about-intro">
          <p className="home-facts">
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
          {/* The places I publish — one quiet line, not three more buttons */}
          {(YOUTUBE_URL || X_URL || SUBSTACK_URL) && (
            <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
              {YOUTUBE_URL && <TextLink href={YOUTUBE_URL} rel="me" arrow>YouTube</TextLink>}
              {SUBSTACK_URL && <TextLink href={SUBSTACK_URL} rel="me" arrow>Substack</TextLink>}
              {X_URL && <TextLink href={X_URL} rel="me" arrow>X</TextLink>}
            </div>
          )}
        </section>

        <section aria-labelledby="now-heading">
          <h2 id="now-heading" className="sr-only">Now</h2>
          <dl className="md-status-list" style={{ marginTop: 0 }}>
            <div className="md-status-row">
              <dt>
                Now
              </dt>
              <dd>{typeset(CURRENTLY.now)}</dd>
            </div>
            <div className="md-status-row">
              <dt>Looking for</dt>
              <dd>{typeset(CURRENTLY.lookingFor)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section aria-labelledby="skills-heading" className="about-section">
        <SectionHeading kicker="What I can do" id="skills-heading">Skills</SectionHeading>
        <div style={{ maxWidth: 860 }}>
          <SkillsSection />
        </div>
      </section>

      <section aria-labelledby="penrose-heading" className="about-section">
        <SectionHeading kicker={<Dotted items={["Lab assistant", "quality assurance (naps on keyboards)", "morale"]} />} id="penrose-heading">Penrose</SectionHeading>
        <p style={{ margin: "0 0 var(--space-6)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          She answers to her name. Type it anywhere.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" style={{ gap: "var(--space-5)" }}>
          {catPhotos.map((src, i) => (
            <figure key={src.src} className="md-reveal" style={{ margin: 0 }}>
              <div style={{ aspectRatio: "1", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                <Image
                  src={src}
                  alt={`Penrose, observation ${i + 1}`}
                  placeholder="blur"
                  sizes="(min-width: 1024px) 180px, (min-width: 640px) 30vw, 50vw"
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
    </PageFrame>
  );
}
