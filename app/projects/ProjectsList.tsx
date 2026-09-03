"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Button } from "../components/ui";
import { Accordion, type AccordionItem } from "../components/Accordion";

/**
 * One row, built on the server (projects/page.tsx) so the data module never
 * enters a client bundle. The client keeps only what sorting needs.
 */
export type ProjectRow = {
  id: string;
  dateMs: number;
  completion: number;
  title: ReactNode;
  subtitle: string;
  extra: ReactNode;
  meta: string;
  content: ReactNode;
};

const sortOptions = [
  ["new", "Newest"],
  ["old", "Oldest"],
  ["done", "Most complete"],
] as const;

type SortKey = (typeof sortOptions)[number][0];

export default function ProjectsList({ rows }: { rows: ProjectRow[] }) {
  const [sort, setSort] = useState<SortKey>("new");

  const items = useMemo<AccordionItem[]>(() => {
    const c = [...rows];
    if (sort === "new") c.sort((a, b) => b.dateMs - a.dateMs);
    if (sort === "old") c.sort((a, b) => a.dateMs - b.dateMs);
    if (sort === "done") c.sort((a, b) => b.completion - a.completion || b.dateMs - a.dateMs);
    return c.map(({ id, title, subtitle, extra, meta, content }) => ({ id, title, subtitle, extra, meta, content }));
  }, [rows, sort]);

  return (
    <>
      <div role="group" aria-label="Sort projects" style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-8)", alignItems: "center", flexWrap: "wrap" }}>
        <span aria-hidden className="md-label" style={{ marginRight: "var(--space-3)" }}>
          Sort
        </span>
        {sortOptions.map(([k, label]) => (
          <Button key={k} size="sm" variant={sort === k ? "primary" : "secondary"} pressed={sort === k} onClick={() => setSort(k)}>
            {label}
          </Button>
        ))}
      </div>
      <Accordion items={items} syncHash />
      <div style={{ marginTop: "var(--space-9)" }}>
        <button type="button" className="md-link" onClick={() => window.scrollTo({ top: 0 })}>
          <span aria-hidden>↑</span> Back to top
        </button>
      </div>
    </>
  );
}
