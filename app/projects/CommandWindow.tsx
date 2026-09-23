"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { TextLink, statusLabel } from "../components/ui";
import { complete, runCommand, type CmdRow } from "./matlabCommands";
import type { ActivityPanel, BrowserRow } from "./ProjectBrowser";

type Line = { id: number; kind: "in" | "out" | "err"; text: string };

const toCmd = (r: BrowserRow): CmdRow => ({
  id: r.id,
  name: r.name,
  file: r.file,
  dateShort: r.dateShort,
  statusText: statusLabel[r.status],
  summary: r.summary,
  skills: r.skills,
  vars: r.vars,
  githubUrl: r.githubUrl,
  videoUrl: r.videoUrl,
});

/**
 * The Command Window: the selected project's links up top, then a real prompt
 * that runs a small set of MATLAB commands (see matlabCommands.ts). It only
 * reads and steers the page; it never evaluates what is typed.
 */
export default function CommandWindow({
  rows,
  shown,
  selected,
  filters,
  activity,
  activityOn,
  onOpen,
  onFilter,
  onSort,
  onOpenRelated,
  onActivity,
}: {
  rows: BrowserRow[];
  shown: BrowserRow[];
  selected: BrowserRow;
  /** Filter keys that have at least one project, so `show` can't pick an empty one. */
  filters: string[];
  /** Recent activity; undefined when no feed could be read. */
  activity?: ActivityPanel;
  /** activity.mlx is the document in front. */
  activityOn: boolean;
  onOpen: (id: string) => void;
  onFilter: (filter: string) => void;
  onSort: (sort: string) => void;
  onOpenRelated: (id: string) => void;
  onActivity: () => void;
}) {
  const router = useRouter();
  const newest = activity?.feed[0];
  const [lines, setLines] = useState<Line[]>([]);
  const [text, setText] = useState("");
  const ans = useRef<number | null>(null);
  const past = useRef<string[]>([]);
  const at = useRef(0);
  const nextId = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el && lines.length) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const submit = () => {
    const input = text;
    setText("");
    if (input.trim() && past.current[past.current.length - 1] !== input) past.current.push(input);
    at.current = past.current.length;

    const res = runCommand(input, {
      rows: rows.map(toCmd),
      shown: shown.map(toCmd),
      selected: toCmd(selected),
      filters,
      ans: ans.current,
      feed: activity?.feed ?? [],
      channels: activity?.channels ?? [],
    });
    if (res.ans !== undefined) ans.current = res.ans;
    const kind = res.error ? "err" : "out";
    const made: Line[] = [{ kind: "in", text: input }, ...res.out.map((t) => ({ kind, text: t }))].map((l) => ({ ...l, id: nextId.current++ }) as Line);
    setLines((prev) => (res.action?.type === "clear" ? [] : [...prev, ...made].slice(-300)));

    const a = res.action;
    if (!a) return;
    if (a.type === "open") onOpen(a.id);
    else if (a.type === "activity") onActivity();
    else if (a.type === "filter") onFilter(a.filter);
    else if (a.type === "sort") onSort(a.sort);
    else if (a.type === "web") window.open(a.url, "_blank", "noopener,noreferrer");
    else if (a.type === "exit") router.push("/");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!past.current.length) return;
      e.preventDefault();
      at.current = Math.max(0, Math.min(past.current.length, at.current + (e.key === "ArrowUp" ? -1 : 1)));
      setText(past.current[at.current] ?? "");
    } else if (e.key === "Tab" && text.trim() && !e.shiftKey) {
      // Only claim Tab when there is something to complete; otherwise it moves focus on.
      const done = complete(text, { rows: rows.map(toCmd) });
      if (done && done !== text) {
        e.preventDefault();
        setText(done);
      }
    }
  };

  return (
    <div className="mw-pane mw-cmd">
      <div className="mw-pane-head">Command Window</div>
      <div
        ref={bodyRef}
        className="mw-scroll mw-cmd-body"
        role="region"
        aria-label="Command window"
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest("a, button, input") && !window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
        }}
      >
        {newest && !activityOn ? (
          <div className="mw-line mw-banner">
            <span className="mw-key">new</span>
            <span>
              <TextLink href={newest.url} arrow>
                {newest.title}
              </TextLink>{" "}
              <span className="mw-muted">
                {newest.kind}, {newest.when}.
              </span>{" "}
              <button type="button" className="md-link" onClick={onActivity}>
                See all activity
              </button>
            </span>
          </div>
        ) : null}
        <div className="mw-line">
          <span aria-hidden className="mw-prompt">
            &gt;&gt;
          </span>
          <span>
            <span className="mw-kw">open</span>(<span className="mw-str">&quot;{activityOn ? "activity.mlx" : selected.file}&quot;</span>)
          </span>
        </div>
        {activityOn && activity
          ? activity.channels.map((c) => (
              <div key={c.key} className="mw-line mw-out">
                <span className="mw-key">{c.key}</span>
                <TextLink href={c.url} arrow>
                  {c.name}
                </TextLink>
              </div>
            ))
          : null}
        {activityOn ? null : selected.githubUrl ? (
          <div className="mw-line mw-out">
            <span className="mw-key">source</span>
            <TextLink href={selected.githubUrl} arrow>
              View on GitHub
            </TextLink>
          </div>
        ) : null}
        {!activityOn && selected.videoUrl ? (
          <div className="mw-line mw-out">
            <span className="mw-key">video</span>
            <TextLink href={selected.videoUrl} arrow>
              Watch on YouTube
            </TextLink>
          </div>
        ) : null}
        {!activityOn && selected.related.length > 0 ? (
          <div className="mw-line mw-out">
            <span className="mw-key">see also</span>
            <span className="mw-related">
              {selected.related.map((r) => (
                <button key={r.id} type="button" className="md-link" onClick={() => onOpenRelated(r.id)}>
                  {r.name}
                </button>
              ))}
            </span>
          </div>
        ) : null}
        <div role="log" aria-live="polite" aria-label="Command output">
          {lines.map((l) =>
            l.kind === "in" ? (
              <div key={l.id} className="mw-line">
                <span aria-hidden className="mw-prompt">
                  &gt;&gt;
                </span>
                <span className="mw-typed">{l.text}</span>
              </div>
            ) : (
              <div key={l.id} className={l.kind === "err" ? "mw-res mw-err" : "mw-res"}>
                {l.text || " "}
              </div>
            )
          )}
        </div>
        <form className="mw-line mw-input-line" onSubmit={(e) => e.preventDefault()}>
          <span aria-hidden className="mw-prompt">
            &gt;&gt;
          </span>
          <input
            ref={inputRef}
            className="mw-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            aria-label="Type a command"
            placeholder="type help"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
          />
        </form>
      </div>
    </div>
  );
}
