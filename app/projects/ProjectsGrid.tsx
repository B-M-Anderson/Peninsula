"use client";

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui";

/**
 * One card, built on the server (projects/page.tsx) so the data module never
 * enters a client bundle. The client keeps only what filtering and sorting need.
 */
export type GridRow = {
  id: string;
  dateMs: number;
  completion: number;
  group: "complete" | "progress" | "other";
  card: ReactNode;
};

const filters = [
  ["all", "All"],
  ["complete", "Complete"],
  ["progress", "In progress"],
  ["other", "Set aside"],
] as const;
const sorts = [
  ["new", "Newest"],
  ["old", "Oldest"],
  ["done", "Most complete"],
] as const;

type FilterKey = (typeof filters)[number][0];
type SortKey = (typeof sorts)[number][0];

/* The view (filter and sort) lives in the URL hash — #show=complete&sort=done —
   so a filtered list can be linked to, and the command prompt's `show` and
   `sort` commands land here with their choice already applied. */
const VIEW_EVENT = "projects:view";
function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  window.addEventListener(VIEW_EVENT, cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener(VIEW_EVENT, cb);
  };
}
const readHash = () => window.location.hash.slice(1);

function parseView(hash: string): { filter: FilterKey; sort: SortKey } {
  const q = new URLSearchParams(hash.includes("=") ? hash : "");
  const show = q.get("show");
  const sort = q.get("sort");
  return {
    filter: filters.some(([k]) => k === show) ? (show as FilterKey) : "all",
    sort: sorts.some(([k]) => k === sort) ? (sort as SortKey) : "new",
  };
}

function writeView(filter: FilterKey, sort: SortKey) {
  const q = new URLSearchParams();
  if (filter !== "all") q.set("show", filter);
  if (sort !== "new") q.set("sort", sort);
  const hash = q.toString();
  history.replaceState(null, "", hash ? `#${hash}` : window.location.pathname);
  window.dispatchEvent(new Event(VIEW_EVENT));
}

export default function ProjectsGrid({ rows }: { rows: GridRow[] }) {
  const router = useRouter();
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const { filter, sort } = parseView(hash);

  // Old links pointed at a row on this page (/projects#pitv) or at the activity
  // section; each project and the activity feed now have a page of their own.
  useEffect(() => {
    if (!hash || hash.includes("=")) return;
    if (hash === "activity") router.replace("/posts");
    else if (rows.some((r) => r.id === hash)) router.replace(`/projects/${hash}`);
  }, [hash, rows, router]);

  const shown = useMemo(() => {
    const c = rows.filter((r) => filter === "all" || r.group === filter);
    if (sort === "new") c.sort((a, b) => b.dateMs - a.dateMs);
    if (sort === "old") c.sort((a, b) => a.dateMs - b.dateMs);
    if (sort === "done") c.sort((a, b) => b.completion - a.completion || b.dateMs - a.dateMs);
    return c;
  }, [rows, filter, sort]);

  const count = (k: FilterKey) => (k === "all" ? rows.length : rows.filter((r) => r.group === k).length);

  return (
    <>
      <div className="proj-tools">
        <div role="group" aria-label="Show projects" className="proj-tool">
          <span aria-hidden className="md-label">Show</span>
          {filters.map(([k, label]) =>
            // A filter with nothing in it is left out rather than offered and then empty.
            count(k) ? (
              <Button key={k} size="sm" variant={filter === k ? "primary" : "secondary"} pressed={filter === k} onClick={() => writeView(k, sort)}>
                {`${label} ${count(k)}`}
              </Button>
            ) : null
          )}
        </div>
        <div role="group" aria-label="Sort projects" className="proj-tool">
          <span aria-hidden className="md-label">Sort</span>
          {sorts.map(([k, label]) => (
            <Button key={k} size="sm" variant={sort === k ? "primary" : "secondary"} pressed={sort === k} onClick={() => writeView(filter, k)}>
              {label}
            </Button>
          ))}
        </div>
      </div>
      <ul className="proj-grid">
        {shown.map((r) => (
          <li key={r.id}>{r.card}</li>
        ))}
      </ul>
    </>
  );
}
