"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { COMMAND_NAMES, complete, runCommand, type CmdRow } from "../lib/commands";

/** Fired on window to open the prompt (the navbar's search button does this). */
export const OPEN_PALETTE_EVENT = "palette:open";

export type PaletteLink = { label: string; href: string; group: "Pages" | "Links"; keywords?: string };

// Plain data: what an item does is decided when it is chosen (activate), not while rendering.
type Item = { key: string; label: string; detail?: string; group: string; href?: string; command?: string };

const FILTERS = ["all", "complete", "progress", "other"];
const isExternal = (href: string) => /^(https?:|mailto:|tel:)/i.test(href);
const isFile = (href: string) => /\.[a-z0-9]{2,5}$/i.test(href);

/**
 * The site's command prompt, carried over from the old MATLAB-style projects
 * window. It does two jobs in one box: type a page, project or link name to
 * jump there, or type a command (help, ls, open pitv, lookfor python, web
 * github, magic(4) …) and it runs through the same pure interpreter as before
 * (app/lib/commands.ts). Opens from the navbar's search button or Ctrl/Cmd+K.
 * Rows and links are built on the server (app/layout.tsx), so the projects
 * data module never enters this bundle.
 */
export default function CommandPalette({ rows, links }: { rows: CmdRow[]; links: PaletteLink[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [cursor, setCursor] = useState(0);
  const [log, setLog] = useState<{ text: string; kind: "in" | "out" | "err" }[]>([]);
  const [ans, setAns] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const listId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setText("");
    setCursor(0);
    returnTo.current?.focus();
  }, []);

  useEffect(() => {
    const show = () => {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((was) => {
          if (!was) returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          return !was;
        });
      }
    };
    window.addEventListener(OPEN_PALETTE_EVENT, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_PALETTE_EVENT, show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Focus the field when the prompt opens, and keep the newest output in view.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const go = useCallback(
    (href: string) => {
      close();
      if (isExternal(href) || isFile(href)) window.open(href, href.startsWith("http") || isFile(href) ? "_blank" : "_self", "noopener,noreferrer");
      else router.push(href);
    },
    [close, router]
  );

  const selected = useMemo(() => rows.find((r) => pathname === `/projects/${r.id}`) ?? rows[0], [rows, pathname]);

  const run = useCallback(
    (input: string) => {
      const res = runCommand(input, { rows, shown: rows, selected, filters: FILTERS, ans, feed: [], channels: [] });
      if (res.ans !== undefined) setAns(res.ans);
      const made = [{ text: `>> ${input}`, kind: "in" as const }, ...res.out.map((t) => ({ text: t, kind: res.error ? ("err" as const) : ("out" as const) }))];
      setLog((prev) => (res.action?.type === "clear" ? [] : [...prev, ...made].slice(-200)));
      setText("");
      setCursor(0);
      const a = res.action;
      if (!a) return;
      if (a.type === "open") go(`/projects/${a.id}`);
      else if (a.type === "activity") go("/posts");
      else if (a.type === "filter") go(`/projects#show=${a.filter}`);
      else if (a.type === "sort") go(`/projects#sort=${a.sort}`);
      else if (a.type === "web") window.open(a.url, "_blank", "noopener,noreferrer");
      else if (a.type === "exit") go("/");
    },
    [rows, selected, ans, go]
  );

  const items = useMemo<Item[]>(() => {
    const q = text.trim().toLowerCase();
    const hit = (s: string) => !q || s.toLowerCase().includes(q);
    const out: Item[] = [];
    const first = q.split(/[\s(]/)[0];
    // A command name, or anything that is not plainly a search word, can be run.
    const runnable = q.length > 0 && (COMMAND_NAMES.includes(first) || /[0-9+\-*/^()'"]/.test(q));
    if (runnable) out.push({ key: "run", label: `Run  ${text.trim()}`, detail: "command", group: "Command", command: text.trim() });
    for (const l of links) if (hit(`${l.label} ${l.keywords ?? ""}`)) out.push({ key: `l-${l.href}`, label: l.label, group: l.group, href: l.href });
    for (const r of rows) if (hit(`${r.name} ${r.skills.join(" ")} ${r.statusText}`)) out.push({ key: `p-${r.id}`, label: r.name, detail: r.statusText, group: "Projects", href: `/projects/${r.id}` });
    // Pages, then projects, then links, with a runnable command always first.
    const order = ["Command", "Pages", "Projects", "Links"];
    return out.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
  }, [text, links, rows]);

  const activate = (it: Item) => {
    if (it.command) run(it.command);
    else if (it.href) go(it.href);
  };

  if (!open) return null;
  const active = Math.min(cursor, Math.max(0, items.length - 1));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(items.length ? (active + 1) % items.length : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(items.length ? (active - 1 + items.length) % items.length : 0);
    } else if (e.key === "Tab") {
      // Tab completes a command or project name; it never leaves the field, which is the dialog's only stop.
      e.preventDefault();
      const done = complete(text, { rows });
      if (done) setText(done);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[active]) activate(items[active]);
      else if (text.trim()) run(text.trim());
    }
  };

  return (
    <div className="cmdk-backdrop" onMouseDown={(e) => (e.target === e.currentTarget ? close() : undefined)}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command prompt">
        <div className="cmdk-field">
          <span aria-hidden className="cmdk-prompt">{">>"}</span>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
            aria-label="Go to a page or project, or type a command"
            placeholder="Go to a page or project, or type a command"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="cmdk-input"
          />
          <button type="button" className="md-btn md-btn-ghost md-btn-sm" onClick={close}>
            Close
          </button>
        </div>
        {log.length ? (
          <div ref={logRef} className="cmdk-log" role="log" aria-live="polite">
            {log.map((l, i) => (
              <div key={i} data-kind={l.kind}>
                {l.text || " "}
              </div>
            ))}
          </div>
        ) : null}
        <ul id={listId} role="listbox" aria-label="Results" className="cmdk-list">
          {items.length === 0 ? <li className="cmdk-empty">Nothing matches. Press Enter to run it as a command, or type help.</li> : null}
          {items.map((it, i) => {
            const head = i === 0 || items[i - 1].group !== it.group ? it.group : null;
            return (
              <li key={it.key} role="presentation">
                {head ? <div className="md-label cmdk-group">{head}</div> : null}
                <div id={`${listId}-${i}`} role="option" aria-selected={i === active} className="cmdk-item" onMouseEnter={() => setCursor(i)} onClick={() => activate(it)}>
                  <span>{it.label}</span>
                  {it.detail ? <span className="cmdk-detail">{it.detail}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="cmdk-foot">
          <span>Enter to go</span>
          <span>Tab to complete</span>
          <span>Esc to close</span>
          <span>help lists the commands</span>
        </div>
      </div>
    </div>
  );
}
