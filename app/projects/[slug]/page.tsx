import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageFrame from "../../components/PageFrame";
import MediaBadge from "../../components/MediaBadge";
import RichText from "../../components/RichText";
import YouTubeEmbed from "../../components/YouTubeEmbed";
import Thumb from "../../components/Thumb";
import { Badge, Chip, ProgressBar, TextLink, statusLabel } from "../../components/ui";
import { projectSlug, publishedProjects, relatedProjects, statusOf, summaryOf } from "../../data/projects";
import { youTubeId } from "../../lib/youtube";
import { openGraphFor } from "../../lib/og";

// Every project page is known at build time; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return publishedProjects.map((p) => ({ slug: projectSlug(p) }));
}

const find = (slug: string) => publishedProjects.find((p) => projectSlug(p) === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = find(slug);
  if (!p) return {};
  const description = summaryOf(p);
  return {
    title: p.title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: openGraphFor(`/projects/${slug}`, description),
  };
}

/**
 * One project on its own page: the demo and the write-up in the main column,
 * the facts (status, how far along, links) beside it, and the way on to the
 * next project at the foot, so the projects read as a set of short pages
 * rather than one long one.
 */
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = find(slug);
  if (!p) notFound();

  const status = statusOf(p);
  const skills = [...p.skills].sort((a, b) => (p.importantSkills?.includes(b) ? 1 : 0) - (p.importantSkills?.includes(a) ? 1 : 0));
  const videoId = p.videoUrl ? youTubeId(p.videoUrl) : null;
  const related = relatedProjects(p);
  const aspect = p.imageAspect ?? 1;

  // Newest first, the same order the index opens in.
  const ordered = [...publishedProjects].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const at = ordered.indexOf(p);
  const newer = at > 0 ? ordered[at - 1] : null;
  const older = at < ordered.length - 1 ? ordered[at + 1] : null;

  return (
    <PageFrame
      title={
        <span className="proj-title">
          <Thumb project={p} size={80} />
          <span>{p.title}</span>
        </span>
      }
      kicker={<TextLink href="/projects">← All projects</TextLink>}
      subtitle={
        <span style={{ display: "inline-flex", gap: "var(--space-4)", alignItems: "center", flexWrap: "wrap" }}>
          <Badge status={status}>{statusLabel[status]}</Badge>
          <MediaBadge media={p.media} />
          <span className="md-label">Updated {p.date}</span>
        </span>
      }
    >
      <div className="proj-page">
        <article className="proj-main">
          {videoId ? (
            <div style={{ maxWidth: 640, width: "100%" }}>
              <YouTubeEmbed id={videoId} title={`${p.title} video`} />
            </div>
          ) : null}
          {p.imageUrl ? (
            <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)", maxWidth: 480, width: "100%", aspectRatio: String(aspect) }}>
              <Image src={p.imageUrl} alt={`${p.title} preview`} width={480} height={Math.round(480 / aspect)} sizes="(max-width: 640px) 100vw, 480px" style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          ) : null}
          <p className="md-prose" style={{ margin: 0, maxWidth: "var(--measure)", fontSize: "var(--text-md)", lineHeight: "var(--leading-relaxed)", color: "var(--text-body)", whiteSpace: "pre-line" }}>
            <RichText text={p.description} />
          </p>
        </article>

        <aside className="proj-facts" aria-label="Project facts">
          {p.completion !== undefined ? <ProgressBar label="completion" value={p.completion} /> : null}
          {p.aiUsage !== undefined ? <ProgressBar label="estimated ai usage" value={p.aiUsage} tone="moss" /> : null}
          <div>
            <div className="md-label" style={{ marginBottom: "var(--space-3)" }}>Skills used</div>
            <ul aria-label="Skills used" style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", listStyle: "none", margin: 0, padding: 0 }}>
              {skills.map((s) => (
                <li key={s}>
                  <Chip emphasis={p.importantSkills?.includes(s) ? "strong" : "normal"}>{s}</Chip>
                </li>
              ))}
            </ul>
          </div>
          {p.githubUrl || p.videoUrl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {p.githubUrl ? <TextLink href={p.githubUrl} arrow>View on GitHub</TextLink> : null}
              {p.videoUrl ? <TextLink href={p.videoUrl} arrow>Watch on YouTube</TextLink> : null}
            </div>
          ) : null}
          {related.length > 0 ? (
            <div>
              <div className="md-label" style={{ marginBottom: "var(--space-3)" }}>Also see</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {related.map((r) => (
                  <TextLink key={r.title} href={`/projects/${projectSlug(r)}`} arrow>
                    {r.title}
                  </TextLink>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <nav aria-label="More projects" className="proj-next">
        {newer ? (
          <Link href={`/projects/${projectSlug(newer)}`} className="proj-next-link">
            <span className="md-label">← Newer</span>
            <span>{newer.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {older ? (
          <Link href={`/projects/${projectSlug(older)}`} className="proj-next-link" style={{ textAlign: "right" }}>
            <span className="md-label">Older →</span>
            <span>{older.title}</span>
          </Link>
        ) : null}
      </nav>
    </PageFrame>
  );
}
