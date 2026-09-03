import Image from "next/image";
import { Chip, ProgressBar, TextLink } from "../components/ui";
import RichText from "../components/RichText";
import DeferredMedia from "../components/DeferredMedia";
import YouTubeEmbed from "../components/YouTubeEmbed";
import { youTubeId } from "../lib/youtube";
import { projectSlug, relatedProjects, type Project } from "../data/projects";

/** The open panel of a project row. Rendered on the server; only the media
    waits for the row to be opened (DeferredMedia). */
export default function ProjectDetail({ p }: { p: Project }) {
  const skills = [...p.skills].sort(
    (a, b) => (p.importantSkills?.includes(b) ? 1 : 0) - (p.importantSkills?.includes(a) ? 1 : 0)
  );
  const videoId = p.videoUrl ? youTubeId(p.videoUrl) : null;
  const related = relatedProjects(p);
  const aspect = p.imageAspect ?? 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="md-label md-acc-date">
        Updated <span style={{ color: "var(--text-muted)" }}>{p.date}</span>
      </div>
      {p.imageUrl && (
        <DeferredMedia aspect={aspect} style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)", maxWidth: 420, width: "100%" }}>
          <Image src={p.imageUrl} alt={`${p.title} preview`} width={420} height={Math.round(420 / aspect)} sizes="(max-width: 640px) 100vw, 420px" style={{ width: "100%", height: "auto", display: "block" }} />
        </DeferredMedia>
      )}
      <p className="md-prose" style={{ margin: 0, maxWidth: "var(--measure)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)", whiteSpace: "pre-line" }}>
        <RichText text={p.description} />
      </p>
      <ul aria-label="Skills used" style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", listStyle: "none", margin: 0, padding: 0 }}>
        {skills.map((s) => (
          <li key={s}>
            <Chip emphasis={p.importantSkills?.includes(s) ? "strong" : "normal"}>{s}</Chip>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-8)", maxWidth: 520 }}>
        {p.completion !== undefined && <ProgressBar label="completion" value={p.completion} />}
        {p.aiUsage !== undefined && <ProgressBar label="estimated ai usage" value={p.aiUsage} tone="moss" />}
      </div>
      {videoId && (
        <DeferredMedia aspect={16 / 9} style={{ maxWidth: 560, width: "100%" }}>
          <YouTubeEmbed id={videoId} title={`${p.title} — video`} />
        </DeferredMedia>
      )}
      <div style={{ display: "flex", gap: "var(--space-7)", flexWrap: "wrap" }}>
        {p.githubUrl && (
          <TextLink href={p.githubUrl} arrow>
            View on GitHub
          </TextLink>
        )}
        {p.videoUrl && (
          <TextLink href={p.videoUrl} arrow>
            Watch on YouTube
          </TextLink>
        )}
      </div>
      {related.length > 0 && (
        <div>
          <div className="md-label" style={{ marginBottom: "var(--space-3)" }}>
            Also see
          </div>
          <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
            {related.map((r) => (
              // plain anchors: a same-page #hash fires hashchange, which the accordion follows
              <TextLink key={r.title} href={`#${projectSlug(r)}`} arrow>
                {r.title}
              </TextLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
