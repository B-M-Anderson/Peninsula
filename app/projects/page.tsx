import type { Metadata } from "next";
import Image from "next/image";
import PageFrame from "../components/PageFrame";
import MediaBadge from "../components/MediaBadge";
import ProjectsList, { type ProjectRow } from "./ProjectsList";
import ProjectDetail from "./ProjectDetail";
import { Badge, Chip, Dotted, statusLabel } from "../components/ui";
import { projectCounts, projectSlug, publishedProjects, statusOf, summaryOf, type Project } from "../data/projects";
import { openGraphFor } from "../lib/og";

const description = "Everything I've built or fixed, with what it's made of and how far along it is.";

export const metadata: Metadata = {
  title: "Projects",
  description,
  alternates: { canonical: "/projects" },
  openGraph: openGraphFor("/projects", description),
};

function ledger(): string[] {
  const years = publishedProjects
    .map((p) => new Date(p.date).getFullYear())
    .filter((y) => Number.isFinite(y));
  const span = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "";
  const n = publishedProjects.length;
  const c = projectCounts();
  // Every project lands in exactly one of these, so the ledger adds up to n.
  const parts = [`${n} ${n === 1 ? "project" : "projects"}`, span, `${c.byStatus.complete} complete`, `${c.inProgress} in progress`];
  if (c.byStatus.shelved) parts.push(`${c.byStatus.shelved} shelved`);
  if (c.byStatus.terminated) parts.push(`${c.byStatus.terminated} stopped`);
  if (c.latestLabel) parts.push(`updated ${c.latestLabel}`);
  return parts;
}

// Rows are rendered here, on the server: the client list only sorts them.
function rowOf(p: Project): ProjectRow {
  const status = statusOf(p);
  return {
    id: projectSlug(p),
    dateMs: new Date(p.date).getTime() || 0,
    completion: p.completion ?? 0,
    subtitle: summaryOf(p),
    meta: p.date,
    extra: (
      <span className="md-acc-skills">
        {(p.importantSkills?.length ? p.importantSkills : p.skills).slice(0, 4).map((s) => (
          <Chip key={s}>{s}</Chip>
        ))}
      </span>
    ),
    title: (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
        {/* Thumbnail and title stay together; only the badges may wrap to the next line */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-4)", minWidth: 0 }}>
          <Image
            src={p.thumbnailUrl ?? "/thumbnails/default.png"}
            alt=""
            width={34}
            height={34}
            style={{ borderRadius: "var(--radius-sm)", objectFit: "cover", border: "1px solid var(--border-subtle)", background: "var(--surface-sunken)", width: 34, height: 34, flex: "0 0 auto" }}
          />
          <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px, 5.5vw, var(--text-xl))", lineHeight: 1.2, letterSpacing: "var(--tracking-display)", color: "var(--text-strong)" }}>{p.title}</span>
        </span>
        <Badge status={status}>{statusLabel[status]}</Badge>
        <MediaBadge media={p.media} />
      </span>
    ),
    content: <ProjectDetail p={p} />,
  };
}

export default function ProjectsPage() {
  return (
    <PageFrame title="Projects" subtitle={<Dotted items={ledger()} />}>
      <ProjectsList rows={publishedProjects.map(rowOf)} />
    </PageFrame>
  );
}
