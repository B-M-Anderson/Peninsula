import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageFrame from "../components/PageFrame";
import MediaBadge from "../components/MediaBadge";
import ProjectsGrid, { type GridRow } from "./ProjectsGrid";
import { Badge, Card, Chip, Dotted, statusLabel } from "../components/ui";
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

// Cards are rendered here, on the server: the client grid only filters and sorts them.
function gridRow(p: Project): GridRow {
  const status = statusOf(p);
  const id = projectSlug(p);
  const group = status === "complete" ? "complete" : status === "ongoing" || status === "wip" ? "progress" : "other";
  return {
    id,
    dateMs: new Date(p.date).getTime() || 0,
    completion: p.completion ?? 0,
    group,
    card: (
      <Link href={`/projects/${id}`} className="md-card-link">
        <Card interactive className="proj-card">
          <div className="proj-card-top">
            <Image src={p.thumbnailUrl ?? "/thumbnails/default.png"} alt="" width={48} height={48} className="hub-thumb" />
            <div style={{ minWidth: 0 }}>
              <h2 className="proj-card-title">{p.title}</h2>
              <span className="md-label">{p.date}</span>
            </div>
          </div>
          <p className="proj-card-sum">{summaryOf(p)}</p>
          <ul aria-label="Key skills" className="proj-card-chips">
            {(p.importantSkills?.length ? p.importantSkills : p.skills).slice(0, 4).map((s) => (
              <li key={s}>
                <Chip>{s}</Chip>
              </li>
            ))}
          </ul>
          <div className="proj-card-foot">
            <Badge status={status}>{statusLabel[status]}</Badge>
            <MediaBadge media={p.media} />
            {p.completion !== undefined ? (
              <span className="proj-meter" role="img" aria-label={`${p.completion}% complete`}>
                <span><span style={{ width: `${Math.max(0, Math.min(100, p.completion))}%` }} /></span>
                <span aria-hidden>{p.completion}%</span>
              </span>
            ) : null}
          </div>
        </Card>
      </Link>
    ),
  };
}

/* /projects is an index: one card per project, filterable and sortable, each
   leading to that project's own page (app/projects/[slug]/page.tsx). */
export default function ProjectsPage() {
  return (
    <PageFrame title="Projects" subtitle={<Dotted items={ledger()} />}>
      <ProjectsGrid rows={publishedProjects.map(gridRow)} />
    </PageFrame>
  );
}
