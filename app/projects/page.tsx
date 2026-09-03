import type { Metadata } from "next";
import StripeBand from "../components/brand/StripeBand";
import ProjectsList from "./ProjectsList";
import { projectCounts, publishedProjects } from "../data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Everything I've built or fixed, with what it's made of and how far along it is.",
  alternates: { canonical: "/projects" },
};

function subtitle(): string {
  const years = publishedProjects
    .map((p) => new Date(p.date).getFullYear())
    .filter((y) => Number.isFinite(y));
  const span = years.length ? `${Math.min(...years)}—${Math.max(...years)}` : "";
  const n = publishedProjects.length;
  const c = projectCounts();
  const parts = [`${n} ${n === 1 ? "entry" : "entries"}`, span, `${c.byStatus.complete} complete`, `${c.inProgress} in progress`];
  if (c.latestLabel) parts.push(`last touched ${c.latestLabel}`);
  return parts.filter(Boolean).join(" · ");
}

export default function ProjectsPage() {
  return (
    <div>
      <div className="md-grain md-surface" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title="Projects" subtitle={subtitle()} />
      </div>
      <main id="main" tabIndex={-1} className="md-dapple" style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "var(--space-9) var(--gutter-page) var(--space-11)" }}>
        <div className="md-above">
          <ProjectsList />
        </div>
      </main>
    </div>
  );
}
