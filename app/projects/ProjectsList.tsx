"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button, Badge, Chip, ProgressBar, TextLink, Accordion, type AccordionItem } from "../components/ui";
import MediaBadge from "../components/MediaBadge";
import RichText from "../components/RichText";
import YouTubeEmbed, { youTubeId } from "../components/YouTubeEmbed";
import { publishedProjects, projectSlug, statusOf, type Project } from "../data/projects";

function ProjectDetail({ p }: { p: Project }) {
  const skills = [...p.skills].sort(
    (a, b) => (p.importantSkills?.includes(b) ? 1 : 0) - (p.importantSkills?.includes(a) ? 1 : 0)
  );
  const videoId = p.videoUrl ? youTubeId(p.videoUrl) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-faint)" }}>
        most recently updated:{" "}
        <span style={{ color: "var(--text-muted)" }}>{p.date}</span>
      </div>
      {p.imageUrl && (
        <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)", maxWidth: 420 }}>
          <Image src={p.imageUrl} alt={`${p.title} preview`} width={420} height={Math.round(420 / (p.imageAspect ?? 1))} sizes="(max-width: 640px) 100vw, 420px" style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      )}
      <p style={{ margin: 0, maxWidth: "var(--measure)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)", whiteSpace: "pre-line" }}>
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
        <div style={{ maxWidth: 560 }}>
          <YouTubeEmbed id={videoId} title={`${p.title} — video`} />
        </div>
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
    </div>
  );
}

const sortOptions = [
  ["new", "Newest"],
  ["old", "Oldest"],
  ["done", "Most complete"],
] as const;

type SortKey = (typeof sortOptions)[number][0];

const byDate = (p: Project) => new Date(p.date).getTime();

export default function ProjectsList() {
  const [sort, setSort] = useState<SortKey>("new");

  const list = useMemo<Project[]>(() => {
    const c = [...publishedProjects];
    if (sort === "new") c.sort((a, b) => byDate(b) - byDate(a));
    if (sort === "old") c.sort((a, b) => byDate(a) - byDate(b));
    if (sort === "done") c.sort((a, b) => (b.completion ?? 0) - (a.completion ?? 0) || byDate(b) - byDate(a));
    return c;
  }, [sort]);

  const items: AccordionItem[] = list.map((p) => ({
    id: projectSlug(p),
    title: (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
        <Image
          src={p.thumbnailUrl ?? "/thumbnails/default.png"}
          alt=""
          width={34}
          height={34}
          style={{ borderRadius: "var(--radius-sm)", objectFit: "cover", border: "1px solid var(--border-subtle)", background: "var(--surface-sunken)", width: 34, height: 34 }}
        />
        <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", letterSpacing: "var(--tracking-display)", color: "var(--text-strong)" }}>{p.title}</span>
        <Badge status={statusOf(p)}>{statusOf(p)}</Badge>
        <MediaBadge media={p.media} />
      </span>
    ),
    meta: <span className="md-acc-meta">{p.date}</span>,
    content: <ProjectDetail p={p} />,
  }));

  return (
    <>
      <div role="group" aria-label="Sort projects" style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-8)", alignItems: "center", flexWrap: "wrap" }}>
        <span aria-hidden style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-faint)", marginRight: "var(--space-3)" }}>
          Sort
        </span>
        {sortOptions.map(([k, label]) => (
          <Button key={k} size="sm" variant={sort === k ? "primary" : "secondary"} pressed={sort === k} onClick={() => setSort(k)}>
            {label}
          </Button>
        ))}
      </div>
      <Accordion items={items} defaultOpen={items[0]?.id} syncHash />
    </>
  );
}
