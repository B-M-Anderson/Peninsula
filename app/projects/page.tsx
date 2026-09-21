import type { Metadata } from "next";
import Image from "next/image";
import PageFrame from "../components/PageFrame";
import MediaBadge from "../components/MediaBadge";
import ProjectBrowser, { type BrowserRow, type WorkspaceVar } from "./ProjectBrowser";
import ProjectDoc from "./ProjectDoc";
import ProjectsList, { type ProjectRow } from "./ProjectsList";
import ProjectDetail from "./ProjectDetail";
import { StyleView } from "../lib/stylePref";
import { serverStyleDefault } from "../lib/styleServer";
import { Badge, Chip, Dotted, statusLabel } from "../components/ui";
import { projectCounts, projectSlug, publishedProjects, relatedProjects, statusOf, summaryOf, type Project } from "../data/projects";
import { youTubeId } from "../lib/youtube";
import { openGraphFor } from "../lib/og";

const description = "Everything I've built or fixed, with what it's made of and how far along it is.";

export const metadata: Metadata = {
  title: "Projects",
  description,
  alternates: { canonical: "/projects" },
  openGraph: openGraphFor("/projects", description),
};

/* /projects has two looks over the same data: the MATLAB-style browser (the
   default) and the original accordion list ("classic"). Both are built here on
   the server; StyleView shows whichever the visitor has chosen. */

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

// ---- classic ---------------------------------------------------------------

// Rows are rendered here, on the server: the client list only sorts them.
function classicRow(p: Project): ProjectRow {
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

// ---- MATLAB ----------------------------------------------------------------

const shortDate = (ms: number) => (ms ? new Date(ms).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "");

/** The Workspace pane: a project's facts as the variables MATLAB would list. */
function workspaceOf(p: Project, status: ReturnType<typeof statusOf>): WorkspaceVar[] {
  const vars: WorkspaceVar[] = [
    { name: "updated", value: `"${p.date}"` },
    { name: "status", value: `"${statusLabel[status]}"`, status },
  ];
  if (p.completion !== undefined) vars.push({ name: "completion", value: String(p.completion), bar: p.completion });
  if (p.aiUsage !== undefined) vars.push({ name: "estAiUsage", value: String(p.aiUsage), bar: p.aiUsage });
  if (p.media && p.media !== "none") vars.push({ name: "media", value: `"${p.media}"` });
  vars.push({ name: "skills", value: `1×${p.skills.length} string` });
  if (p.importantSkills?.length) vars.push({ name: "keySkills", value: `1×${p.importantSkills.length} string` });
  return vars;
}

// Everything but the description is plain data; the client only filters, sorts
// and swaps which project is showing. Docs are built here so the projects data
// module never enters a client bundle.
function browserRow(p: Project): BrowserRow {
  const status = statusOf(p);
  const dateMs = new Date(p.date).getTime() || 0;
  const id = projectSlug(p);
  const videoUrl = p.videoUrl && youTubeId(p.videoUrl) ? p.videoUrl : undefined;
  return {
    id,
    name: p.title,
    file: `${id}.mlx`,
    dateMs,
    dateShort: shortDate(dateMs),
    completion: p.completion ?? 0,
    status,
    thumb: p.thumbnailUrl ?? "/thumbnails/default.png",
    summary: summaryOf(p),
    skills: p.skills,
    hasDemo: Boolean(videoUrl || p.imageUrl),
    vars: workspaceOf(p, status),
    githubUrl: p.githubUrl,
    videoUrl,
    related: relatedProjects(p).map((r) => ({ id: projectSlug(r), name: r.title })),
    doc: <ProjectDoc p={p} />,
  };
}

export default async function ProjectsPage() {
  const matlab = (
    // No title frame: the browser is the page. The h1 stays for screen readers,
    // and the padding clears the fixed navbar.
    <main id="main" tabIndex={-1} className="md-dapple" style={{ position: "relative", paddingTop: 59 }}>
      <h1 className="sr-only">Projects</h1>
      <div className="md-above">
        <ProjectBrowser rows={publishedProjects.map(browserRow)} />
      </div>
    </main>
  );
  const classic = (
    <PageFrame title="Projects" subtitle={<Dotted items={ledger()} />}>
      <ProjectsList rows={publishedProjects.map(classicRow)} />
    </PageFrame>
  );
  return <StyleView page="projects" themed={matlab} plain={classic} serverDefault={await serverStyleDefault()} />;
}
