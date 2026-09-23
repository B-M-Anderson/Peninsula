import type { Metadata } from "next";
import Image from "next/image";
import PageFrame from "../components/PageFrame";
import MediaBadge from "../components/MediaBadge";
import ProjectBrowser, { ACTIVITY_ID, type ActivityPanel, type BrowserRow, type WorkspaceVar } from "./ProjectBrowser";
import ProjectDoc from "./ProjectDoc";
import ActivityDoc, { sourceName, type Channel, type DocItem } from "./ActivityDoc";
import ActivityList from "./ActivityList";
import ProjectsList, { type ProjectRow } from "./ProjectsList";
import ProjectDetail from "./ProjectDetail";
import { StyleView } from "../lib/stylePref";
import { serverStyleDefault } from "../lib/styleServer";
import { Badge, Chip, Dotted, statusLabel } from "../components/ui";
import { projectCounts, projectSlug, publishedProjects, relatedProjects, statusOf, summaryOf, type Project } from "../data/projects";
import { youTubeId } from "../lib/youtube";
import { openGraphFor } from "../lib/og";
import { ageDays, timelineOf, getActivity, type ActivitySource } from "../lib/activity";
import { GITHUB_URL, SUBSTACK_URL, X_URL, YOUTUBE_URL } from "../data/site";

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

// ---- activity.mlx -------------------------------------------------------------

const repoKey = (url: string) => url.toLowerCase().replace(/\/+$/, "");

/** A repo links back to its project only when exactly one project points at it. */
function projectsByRepo(): Map<string, { id: string; file: string }> {
  const seen = new Map<string, Project[]>();
  for (const p of publishedProjects) {
    if (!p.githubUrl) continue;
    const k = repoKey(p.githubUrl);
    seen.set(k, [...(seen.get(k) ?? []), p]);
  }
  const out = new Map<string, { id: string; file: string }>();
  for (const [k, ps] of seen) if (ps.length === 1) out.set(k, { id: projectSlug(ps[0]), file: `${projectSlug(ps[0])}.mlx` });
  return out;
}

const channels: Channel[] = (
  [
    ["youtube", YOUTUBE_URL],
    ["substack", SUBSTACK_URL],
    ["x", X_URL],
    ["github", GITHUB_URL],
  ] as [ActivitySource, string | null][]
).flatMap(([key, url]) => (url ? [{ key, name: sourceName[key], url }] : []));

/** activity.mlx for the MATLAB look, and the items again for the classic look's section. */
async function activityData(): Promise<{ panel: ActivityPanel; items: DocItem[] } | undefined> {
  const { items, now } = await getActivity();
  if (!items.length) return undefined;
  const repos = projectsByRepo();
  const docItems: DocItem[] = items.map((i) => {
    const project = i.repoUrl ? repos.get(repoKey(i.repoUrl)) : undefined;
    return project ? { ...i, project } : i;
  });
  const count = (s: ActivitySource) => items.filter((i) => i.source === s).length;
  const vars: WorkspaceVar[] = (["youtube", "substack", "x", "github"] as ActivitySource[])
    .filter((s) => count(s) > 0)
    .map((s) => ({ name: s, value: `1×${count(s)} struct`, struct: true }));
  vars.push({ name: "latest", value: `"${items[0].at.slice(0, 10)}"` });
  vars.push({ name: "refreshMin", value: "15" });
  // The ribbon's count and the status bar's total both describe the timeline the
  // document actually shows (newest PER_SOURCE per channel), so they agree.
  const timeline = timelineOf(items);
  const panel: ActivityPanel = {
    doc: <ActivityDoc items={docItems} channels={channels} />,
    vars,
    total: timeline.length,
    recent: timeline.filter((i) => ageDays(i.at, now) < 30).length,
    fresh: ageDays(items[0].at, now) < 7,
    feed: items.map((i) => ({ kind: i.kind, title: i.title, detail: i.detail, when: i.when, url: i.url, sha: i.sha })),
    // `web github` already means the open project's repo, so only the other channels are offered by name.
    channels: channels.filter((c) => c.key !== "github"),
  };
  return { panel, items: docItems };
}

export default async function ProjectsPage() {
  const [activity, serverDefault] = await Promise.all([activityData(), serverStyleDefault()]);
  const rows = publishedProjects.map(browserRow);
  // A project named "activity" would collide with activity.mlx's #activity link
  // (and with the classic section's id).
  const activityIdFree = !rows.some((r) => r.id === ACTIVITY_ID);
  const panel = activityIdFree ? activity?.panel : undefined;
  const matlab = (
    // No title frame: the browser is the page. The h1 stays for screen readers,
    // and the padding clears the fixed navbar.
    // No foot dapple here: the desktop runs edge to edge and ends at its status bar.
    <main id="main" tabIndex={-1} style={{ position: "relative", paddingTop: 59 }}>
      <h1 className="sr-only">Projects</h1>
      <div className="md-above">
        <ProjectBrowser rows={rows} activity={panel} />
      </div>
    </main>
  );
  const classic = (
    <PageFrame title="Projects" subtitle={<Dotted items={ledger()} />}>
      <ProjectsList rows={publishedProjects.map(classicRow)} />
      {activity ? <ActivityList id={activityIdFree ? ACTIVITY_ID : undefined} items={activity.items} channels={channels} /> : null}
    </PageFrame>
  );
  return <StyleView page="projects" themed={matlab} plain={classic} serverDefault={serverDefault} />;
}
