"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import Image from "next/image";
import { Archive, CalendarArrowDown, CalendarArrowUp, CircleCheck, Gauge, Layers, LayoutList, Loader, type LucideIcon } from "lucide-react";
import { RowOpenContext, noHash, readHash, subscribeHash } from "../components/Accordion";
import { statusColor, statusLabel } from "../components/ui";
import CommandWindow from "./CommandWindow";
import PlotFigure from "./PlotFigure";
import { useStyleChoice } from "../lib/stylePref";
import type { ProjectStatus } from "../data/projects";

/* The projects page as a MATLAB-style desktop: ribbon (filter + sort), Current
   Folder (the projects), a Live Editor page for the selected one, Workspace
   (its facts as variables) and a Command Window (its links). Rows are built on
   the server (projects/page.tsx); this half only filters, sorts and swaps which
   project is showing, and keeps the selection in the #hash so /projects#slug
   deep links keep working. */

export type WorkspaceVar = { name: string; value: string; status?: ProjectStatus; bar?: number };

export type BrowserRow = {
  id: string;
  name: string;
  file: string;
  dateMs: number;
  dateShort: string;
  completion: number;
  status: ProjectStatus;
  thumb: string;
  summary: string;
  skills: string[];
  /** Has a demo video or preview image, so its document opens with a figure. */
  hasDemo: boolean;
  vars: WorkspaceVar[];
  githubUrl?: string;
  videoUrl?: string;
  related: { id: string; name: string }[];
  doc: ReactNode;
};

const filterOptions: readonly [string, string, LucideIcon][] = [
  ["all", "All", Layers],
  ["complete", "Complete", CircleCheck],
  ["progress", "In progress", Loader],
  ["other", "Set aside", Archive],
];

const sortOptions: readonly [string, string, LucideIcon][] = [
  ["new", "Newest", CalendarArrowDown],
  ["old", "Oldest", CalendarArrowUp],
  ["done", "Most complete", Gauge],
];

function matches(filter: string, s: ProjectStatus) {
  if (filter === "complete") return s === "complete";
  if (filter === "progress") return s === "ongoing" || s === "wip";
  if (filter === "other") return s === "shelved" || s === "terminated";
  return true;
}

function order(rows: BrowserRow[], sort: string) {
  const c = [...rows];
  if (sort === "new") c.sort((a, b) => b.dateMs - a.dateMs);
  if (sort === "old") c.sort((a, b) => a.dateMs - b.dateMs);
  if (sort === "done") c.sort((a, b) => b.completion - a.completion || b.dateMs - a.dateMs);
  return c;
}

const isNarrow = () => window.matchMedia("(max-width: 719px)").matches;
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Scroll a pane into view, honouring a reduced-motion preference. */
const bring = (el: HTMLElement | null, smooth = true) => el?.scrollIntoView({ block: "start", behavior: smooth && !still() ? "smooth" : "auto" });

export default function ProjectBrowser({ rows }: { rows: BrowserRow[] }) {
  const hash = useSyncExternalStore(subscribeHash, readHash, noHash);
  const [, setView] = useStyleChoice("projects");
  // A click records the visitor's pick with the hash it was made under; a later
  // real hash change (back/forward, a pasted link) outranks it.
  const [choice, setChoice] = useState<{ hash: string; id: string } | undefined>(undefined);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("new");
  // The newest project with something to show opens first, so the page lands on
  // a demo rather than a wall of text. Latched on first render so re-sorting
  // never hands the selection to another row.
  const [initial] = useState(() => {
    const newest = order(rows, "new");
    return (newest.find((r) => r.hasDemo) ?? newest[0])?.id ?? null;
  });

  const windowRef = useRef<HTMLElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const hashId = hash && byId.has(hash) ? hash : null;
  const chosen = choice !== undefined && choice.hash === hash;
  const wanted = byId.get((chosen ? choice.id : (hashId ?? initial)) ?? "");
  // A deep link to a project the current filter hides shows everything instead.
  const activeFilter = wanted && !matches(filter, wanted.status) ? "all" : filter;
  const shown = useMemo(() => order(rows, sort).filter((r) => matches(activeFilter, r.status)), [rows, sort, activeFilter]);
  const selected = wanted ?? shown[0];

  const counts = useMemo(() => {
    const n: Record<string, number> = {};
    for (const [k] of filterOptions) n[k] = rows.filter((r) => matches(k, r.status)).length;
    return n;
  }, [rows]);
  // A filter nothing falls into is offered neither in the ribbon nor at the prompt.
  const available = useMemo(() => filterOptions.filter(([k]) => k === "all" || counts[k] > 0), [counts]);

  const selectedId = selected?.id;
  useEffect(() => {
    editorScrollRef.current?.scrollTo({ top: 0 });
  }, [selectedId]);

  useEffect(() => {
    if (!hashId || chosen) return;
    bring((isNarrow() ? editorRef : windowRef).current, false);
  }, [hashId, chosen]);

  if (!selected) return null;

  const select = (id: string) => {
    setChoice({ hash, id });
    history.replaceState(history.state, "", `#${encodeURIComponent(id)}`);
  };

  const pick = (id: string) => {
    select(id);
    // Stacked layout: the document is below the list, so follow the choice down.
    if (isNarrow()) bring(editorRef.current);
  };

  const openRelated = (id: string) => {
    select(id);
    editorScrollRef.current?.focus({ preventScroll: true });
    if (isNarrow()) bring(editorRef.current);
  };

  const onFilter = (f: string) => {
    // A filter with nothing in it is never offered in the ribbon; the Command
    // Window rejects it too, so this only guards against a stale key.
    if (!counts[f]) return;
    setFilter(f);
    if (!matches(f, selected.status)) {
      const first = order(rows, sort).find((r) => matches(f, r.status));
      if (first) select(first.id);
    }
  };

  const onListKey = (e: KeyboardEvent<HTMLTableSectionElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const files = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button.mw-file"));
    const i = files.indexOf((e.target as HTMLElement).closest("button.mw-file") as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const next = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : files.length - 1;
    files[Math.max(0, Math.min(files.length - 1, next))]?.focus();
  };

  return (
    <section ref={windowRef} className="mw" aria-label="Project browser">
      <div className="mw-tools">
        <div className="mw-group">
          <div role="group" aria-label="Show projects" className="mw-btns">
            {available.map(([k, label, Icon]) => (
              <button key={k} type="button" className="mw-tool" aria-pressed={activeFilter === k} onClick={() => onFilter(k)}>
                <Icon size={20} strokeWidth={1.6} />
                <span>{label}</span>
                <span className="mw-count">{counts[k]}</span>
              </button>
            ))}
          </div>
          <div className="mw-group-label" aria-hidden>
            SHOW
          </div>
        </div>
        <div className="mw-group">
          <div role="group" aria-label="Sort projects" className="mw-btns">
            {sortOptions.map(([k, label, Icon]) => (
              <button key={k} type="button" className="mw-tool" aria-pressed={sort === k} onClick={() => setSort(k)}>
                <Icon size={20} strokeWidth={1.6} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="mw-group-label" aria-hidden>
            SORT
          </div>
        </div>
        <div className="mw-group">
          <div role="group" aria-label="View" className="mw-btns">
            <button type="button" className="mw-tool" onClick={() => setView("plain")}>
              <LayoutList size={20} strokeWidth={1.6} />
              <span>Classic view</span>
            </button>
          </div>
          <div className="mw-group-label" aria-hidden>
            VIEW
          </div>
        </div>
      </div>

      <div className="mw-pathbar" aria-hidden>
        <span className="mw-address">
          Peninsula <i>›</i> projects <i>›</i> <b>{selected.file}</b>
        </span>
      </div>

      <div className="mw-body">
        <div className="mw-pane mw-folder">
          <div className="mw-pane-head">Current Folder</div>
          <div className="mw-scroll mw-folder-scroll" tabIndex={0} role="region" aria-label="Projects">
            <table className="mw-files">
              <caption className="sr-only">Projects. Choose one to open it.</caption>
              <colgroup>
                <col />
                <col className="mw-col-date" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Modified</th>
                </tr>
              </thead>
              <tbody onKeyDown={onListKey}>
                {shown.map((r) => (
                  <tr key={r.id} id={r.id}>
                    <td>
                      <button type="button" className="mw-file" aria-current={r.id === selected.id ? "true" : undefined} onClick={() => pick(r.id)}>
                        <span aria-hidden className="mw-dot" style={{ background: statusColor[r.status] }} />
                        <Image src={r.thumb} alt="" width={20} height={20} className="mw-thumb" />
                        <span className="mw-file-name">{r.name}</span>
                        <span className="sr-only">, {statusLabel[r.status]}</span>
                      </button>
                    </td>
                    <td className="mw-file-date">{r.dateShort}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div ref={editorRef} className="mw-pane mw-editor">
          <div className="mw-tabbar">
            <span className="mw-doctab">{selected.file}</span>
          </div>
          <div ref={editorScrollRef} className="mw-scroll mw-editor-scroll" tabIndex={0} role="region" aria-label={`${selected.name} document`}>
            {rows.map((r) => {
              const on = r.id === selected.id;
              return (
                <div key={r.id} hidden={!on}>
                  <RowOpenContext.Provider value={on}>{r.doc}</RowOpenContext.Provider>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mw-pane mw-work">
          <div className="mw-pane-head">Workspace</div>
          <div className="mw-scroll" tabIndex={0} role="region" aria-label="Workspace variables">
            <table className="mw-vars">
              <caption className="sr-only">Variables for {selected.name}</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {selected.vars.map((v) => {
                  const str = v.value.includes('"') || v.value.includes("string");
                  return (
                    <tr key={v.name}>
                      <th scope="row">
                        <span aria-hidden className="mw-vicon" data-k={str ? "str" : "num"}>
                          {str ? "ab" : "#"}
                        </span>
                        {v.name}
                      </th>
                      <td className="mw-val" data-k={v.value.startsWith('"') ? "str" : "num"}>
                        {v.status ? <span aria-hidden className="mw-dot" style={{ background: statusColor[v.status] }} /> : null}
                        {v.value}
                        {v.bar !== undefined ? (
                          <span aria-hidden className="mw-bar">
                            <i style={{ width: `${Math.max(0, Math.min(100, v.bar))}%` }} />
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <PlotFigure rows={rows} selectedId={selected.id} onPick={pick} />
          </div>
        </div>

        <CommandWindow rows={rows} shown={shown} selected={selected} filters={available.map(([k]) => k)} onOpen={pick} onFilter={onFilter} onSort={setSort} onOpenRelated={openRelated} />
      </div>

      <div className="mw-status">
        <span>{selected.file}</span>
        <span role="status">
          {shown.length} of {rows.length} projects
        </span>
      </div>
    </section>
  );
}
