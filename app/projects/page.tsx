import type { Metadata } from "next";
import StripeBand from "../components/brand/StripeBand";
import ProjectsList from "./ProjectsList";
import { Dotted } from "../components/ui";
import { projectCounts, publishedProjects } from "../data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Everything I've built or fixed, with what it's made of and how far along it is.",
  alternates: { canonical: "/projects" },
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

export default function ProjectsPage() {
  return (
    <div>
      <div className="md-grain md-surface" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title="Projects" subtitle={<Dotted items={ledger()} />} />
      </div>
      <main id="main" tabIndex={-1} className="md-dapple" style={{ maxWidth: "var(--max-width)", margin: "0 auto", padding: "var(--space-9) var(--gutter-page) var(--space-11)" }}>
        <div className="md-above">
          <ProjectsList />
        </div>
      </main>
    </div>
  );
}
