"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import Image from "next/image";
import { Archive, CalendarArrowDown, CalendarArrowUp, CircleCheck, Gauge, Layers, LayoutList, Loader, Rss, X, type LucideIcon } from "lucide-react";
import { RowOpenContext, noHash, readHash, subscribeHash } from "../components/Accordion";
import { statusColor, statusLabel } from "../components/ui";
import CommandWindow from "./CommandWindow";
import type { CmdChannel, CmdFeedItem } from "./matlabCommands";
import PlotFigure from "./PlotFigure";
import { useStyleChoice } from "../lib/stylePref";
import type { ProjectStatus } from "../data/projects";

/* The projects page as a MATLAB-style desktop: ribbon (filter + sort), Current
   Folder (the projects), a Live Editor page for the selected one, Workspace
   (its facts as variables) and a Command Window (its links). Rows are built on
   the server (projects/page.tsx); this half only filters, sorts and swaps which
   project is showing, and keeps the selection in the #hash so /projects#slug
   deep links keep working. A second document, activity.mlx (#activity), holds
   the recent posts and commits; it is built on the server too (ActivityDoc). */

export type WorkspaceVar = { name: string; value: string; status?: ProjectStatus; bar?: number; struct?: boolean };

/** Everything the page needs for activity.mlx, made on the server. */
export type ActivityPanel = {
  doc: ReactNode;
  vars: WorkspaceVar[];
  /** Items listed in the document. */
  total: number;
  /** Items from the last 30 days: the ribbon button's count. */
  recent: number;
  /** Something landed in the last week: the tab gets a dot. */
  fresh: boolean;
  feed: CmdFeedItem[];
  channels: CmdChannel[];
};

export const ACTIVITY_ID = "activity";
const ACTIVITY_FILE = "activity.mlx";
/** Past this many open documents, opening another closes the one opened longest ago. */
const MAX_TABS = 8;

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

export default function ProjectBrowser({ rows, activity }: { rows: BrowserRow[]; activity?: ActivityPanel }) {
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
  const tabbarRef = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const hasActivity = Boolean(activity?.total);
  const hashId = hash && (byId.has(hash) || (hasActivity && hash === ACTIVITY_ID)) ? hash : null;
  const chosen = choice !== undefined && choice.hash === hash;
  const docId = (chosen ? choice.id : (hashId ?? initial)) ?? "";
  const activityOn = hasActivity && docId === ACTIVITY_ID;
  // With activity.mlx in front, the project tab keeps the last project shown.
  const [lastProject, setLastProject] = useState(initial);
  if (!activityOn && byId.has(docId) && docId !== lastProject) setLastProject(docId);
  const wanted = byId.get(activityOn ? (lastProject ?? "") : docId);
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

  const docShown = activityOn ? ACTIVITY_ID : selected?.id;

  // The open documents, in tab order, like the editor's own tabs: opening one
  // that isn't open (folder, plot, a link, a command, the #hash) adds a tab.
  const [tabs, setTabs] = useState<string[]>(() => [...(initial ? [initial] : []), ...(hasActivity ? [ACTIVITY_ID] : [])]);
  if (docShown && !tabs.includes(docShown)) {
    const next = [...tabs, docShown];
    setTabs(next.length > MAX_TABS ? next.slice(next.length - MAX_TABS) : next);
  }

  useEffect(() => {
    editorScrollRef.current?.scrollTo({ top: 0 });
    // Keep the tab in front visible in a tab strip that has overflowed sideways.
    const bar = tabbarRef.current;
    const tab = bar?.querySelector<HTMLElement>('[aria-selected="true"]')?.parentElement;
    if (!bar || !tab) return;
    if (tab.offsetLeft < bar.scrollLeft) bar.scrollLeft = tab.offsetLeft;
    else if (tab.offsetLeft + tab.offsetWidth > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = tab.offsetLeft + tab.offsetWidth - bar.clientWidth;
  }, [docShown]);

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

  const openActivity = () => {
    select(ACTIVITY_ID);
    if (isNarrow()) bring(editorRef.current);
  };

  // The ribbon button toggles: pressed again, it puts the project back in front.
  const toggleActivity = () => (activityOn ? select(selected.id) : openActivity());

  const openTab = (id: string) => (id === ACTIVITY_ID ? openActivity() : select(id));

  /** Close a tab; closing the one in front brings up its neighbour. The last tab stays open. */
  const closeTab = (id: string, refocus = false) => {
    if (tabs.length < 2) return;
    const i = tabs.indexOf(id);
    const rest = tabs.filter((t) => t !== id);
    setTabs(rest);
    if (id !== docShown) return;
    const next = rest[Math.min(i, rest.length - 1)];
    select(next);
    if (refocus) requestAnimationFrame(() => document.getElementById(`mw-tab-${next}`)?.focus());
  };

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]"));
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    if (e.key === "Delete") {
      e.preventDefault();
      closeTab(tabs[i], true);
      return;
    }
    const to = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? btns.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const next = btns[(to + btns.length) % btns.length];
    next?.focus();
    next?.click();
  };

  const file = activityOn ? ACTIVITY_FILE : selected.file;
  const vars = activityOn && activity ? activity.vars : selected.vars;

  const onFilter = (f: string) => {
    // A filter with nothing in it is never offered in the ribbon; the Command
    // Window rejects it too, so this only guards against a stale key.
    if (!counts[f]) return;
    setFilter(f);
    if (!matches(f, selected.status)) {
      const first = order(rows, sort).find((r) => matches(f, r.status));
      // Filtering the folder leaves activity.mlx in front; only the project behind it changes.
      if (first) {
        if (activityOn) setLastProject(first.id);
        else select(first.id);
      }
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
        {hasActivity && activity ? (
          <div className="mw-group">
            <div role="group" aria-label="Activity" className="mw-btns">
              <button type="button" className="mw-tool" aria-pressed={activityOn} onClick={toggleActivity}>
                <Rss size={20} strokeWidth={1.6} />
                <span>What&apos;s new</span>
                {activity.recent ? <span className="mw-count">{activity.recent}</span> : null}
              </button>
            </div>
            <div className="mw-group-label" aria-hidden>
              ACTIVITY
            </div>
          </div>
        ) : null}
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
          Peninsula <i>›</i> projects <i>›</i> <b>{file}</b>
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
                      <button type="button" className="mw-file" aria-current={!activityOn && r.id === selected.id ? "true" : undefined} onClick={() => pick(r.id)}>
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
          <div ref={tabbarRef} className="mw-tabbar" role="tablist" aria-label="Open documents" onKeyDown={onTabKey}>
            {tabs.map((id) => {
              const isActivity = id === ACTIVITY_ID;
              const label = isActivity ? (hasActivity ? ACTIVITY_FILE : null) : byId.get(id)?.file;
              if (!label) return null;
              const on = id === docShown;
              return (
                <div
                  key={id}
                  role="presentation"
                  className="mw-doctab"
                  data-on={on}
                  onAuxClick={(e) => {
                    // Middle-click closes, as in any editor.
                    if (e.button !== 1) return;
                    e.preventDefault();
                    closeTab(id);
                  }}
                >
                  <button type="button" role="tab" id={`mw-tab-${id}`} className="mw-tab-btn" aria-selected={on} aria-controls="mw-doc-panel" tabIndex={on ? 0 : -1} onClick={() => on || openTab(id)}>
                    {label}
                    {isActivity && activity?.fresh ? (
                      <>
                        <span aria-hidden className="mw-tabdot" />
                        <span className="sr-only">, new this week</span>
                      </>
                    ) : null}
                  </button>
                  {tabs.length > 1 ? (
                    // Mouse only: from the keyboard, Delete closes the focused tab.
                    <button type="button" className="mw-tab-close" tabIndex={-1} aria-label={`Close ${label}`} title={`Close ${label}`} onClick={() => closeTab(id)}>
                      <X size={12} strokeWidth={2} />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div ref={editorScrollRef} id="mw-doc-panel" className="mw-scroll mw-editor-scroll" tabIndex={0} role="tabpanel" aria-labelledby={`mw-tab-${docShown}`}>
            {rows.map((r) => {
              const on = !activityOn && r.id === selected.id;
              return (
                <div key={r.id} hidden={!on}>
                  <RowOpenContext.Provider value={on}>{r.doc}</RowOpenContext.Provider>
                </div>
              );
            })}
            {hasActivity && activity ? <div hidden={!activityOn}>{activity.doc}</div> : null}
          </div>
        </div>

        <div className="mw-pane mw-work">
          <div className="mw-pane-head">Workspace</div>
          <div className="mw-scroll" tabIndex={0} role="region" aria-label="Workspace variables">
            <table className="mw-vars">
              <caption className="sr-only">Variables for {activityOn ? "recent activity" : selected.name}</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {vars.map((v) => {
                  const str = v.value.includes('"') || v.value.includes("string");
                  const kind = v.struct ? "struct" : str ? "str" : "num";
                  return (
                    <tr key={v.name}>
                      <th scope="row">
                        <span aria-hidden className="mw-vicon" data-k={kind}>
                          {kind === "struct" ? "{}" : str ? "ab" : "#"}
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

        <CommandWindow
          rows={rows}
          shown={shown}
          selected={selected}
          filters={available.map(([k]) => k)}
          activity={hasActivity ? activity : undefined}
          activityOn={activityOn}
          onOpen={pick}
          onFilter={onFilter}
          onSort={setSort}
          onOpenRelated={openRelated}
          onActivity={openActivity}
        />
      </div>

      <div className="mw-status">
        <span>{file}</span>
        <span role="status">{activityOn && activity ? `${activity.total} items · refreshed every 15 min` : `${shown.length} of ${rows.length} projects`}</span>
      </div>
    </section>
  );
}
