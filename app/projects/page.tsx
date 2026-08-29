"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Camera, Video } from "lucide-react";
import StripeBand from "../components/brand/StripeBand";
import { Button, Badge, Chip, ProgressBar, TextLink, Accordion, type AccordionItem } from "../components/ui";
import RichText from "../components/RichText";
import { publishedProjects, type Project } from "../data/projects";

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
  return <Badge icon={icon}>{media}</Badge>;
}

/** Pull the video id out of any of the shapes a YouTube link comes in. */
function youTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function ProjectDetail({ p }: { p: Project }) {
  const skills = [...p.skills].sort(
    (a, b) => (p.importantSkills?.includes(b) ? 1 : 0) - (p.importantSkills?.includes(a) ? 1 : 0)
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-faint)" }}>
        most recently updated:{" "}
        <span style={{ color: "var(--text-muted)" }}>{p.date}</span>
      </div>
      {p.imageUrl && (
        <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)", maxWidth: 420 }}>
          <Image src={p.imageUrl} alt={`${p.title} preview`} width={420} height={420} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      )}
      <p style={{ margin: 0, maxWidth: "var(--measure)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)", whiteSpace: "pre-line" }}>
        <RichText text={p.description} />
      </p>
      <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
        {skills.map((s) => (
          <Chip key={s} emphasis={p.importantSkills?.includes(s) ? "strong" : "normal"}>
            {s}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-8)", maxWidth: 520 }}>
        {p.completion !== undefined && <ProgressBar label="completion" value={p.completion} />}
        {p.aiUsage !== undefined && <ProgressBar label="estimated ai usage" value={p.aiUsage} tone="moss" />}
      </div>
      {p.videoUrl && youTubeId(p.videoUrl) && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youTubeId(p.videoUrl)}`}
              title={`${p.title} — video`}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
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

export default function ProjectsPage() {
  const [sort, setSort] = useState<SortKey>("new");

  const list = useMemo<Project[]>(() => {
    const c = [...publishedProjects];
    if (sort === "new") c.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sort === "old") c.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sort === "done") c.sort((a, b) => (b.completion ?? 0) - (a.completion ?? 0));
    return c;
  }, [sort]);

  const subtitle = useMemo(() => {
    const years = publishedProjects
      .map((p) => new Date(p.date).getFullYear())
      .filter((y) => Number.isFinite(y));
    const span = years.length
      ? `${Math.min(...years)}\u2014${Math.max(...years)}`
      : "";
    const n = publishedProjects.length;
    return `${n} ${n === 1 ? "entry" : "entries"}${span ? ` \u00b7 ${span}` : ""}`;
  }, []);

  const items: AccordionItem[] = list.map((p) => ({
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
    meta: p.date,
    content: <ProjectDetail p={p} />,
  }));

  return (
    <div>
      <header className="md-grain" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title="Projects" subtitle={subtitle} />
      </header>
      <main className="md-dapple" style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "var(--space-9) var(--space-9) var(--space-11)" }}>
        <div className="md-above">
          <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-8)", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-faint)", marginRight: "var(--space-3)" }}>
              Sort
            </span>
            {sortOptions.map(([k, label]) => (
              <Button key={k} size="sm" variant={sort === k ? "primary" : "secondary"} onClick={() => setSort(k)}>
                {label}
              </Button>
            ))}
          </div>
          <Accordion items={items} defaultOpen={0} />
        </div>
      </main>
    </div>
  );
}
