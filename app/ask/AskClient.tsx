"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Send } from "lucide-react";
import { TextLink } from "../components/ui";
import { json, type AskResponse, type ProgressResponse, type StatusResponse } from "../lib/api-types";
import SystemPanel, { ago } from "./SystemPanel";
import { StyleSwitch } from "../lib/stylePref";
import "./notebook.css";

type Line = { from: "you" | "bot" | "sys"; text: string };

type Progress = { state: string; ahead: number; seconds: number };

// Module scope on purpose: these are impure, and the React Compiler lint rightly
// rejects calling them anywhere it considers render.
function newJobId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowMs(): number {
  return Date.now();
}

/** Plain-language account of where a question currently is. */
function progressLabel(p: Progress): string {
  // `ahead` is the queue length, which counts this job too — so only claim a
  // number when there is genuinely someone else in line.
  if (p.state === "queued" && p.ahead > 1) {
    return `waiting, ${p.ahead - 1} question${p.ahead - 1 === 1 ? "" : "s"} ahead of yours`;
  }
  if (p.state === "queued") return "waiting for the desktop to pick it up…";
  if (p.state === "working") {
    if (p.seconds < 4) return "the desktop picked it up";
    if (p.seconds < 15) return `writing an answer, ${p.seconds}s so far`;
    return `still writing (${p.seconds}s). A new question gets worked out one word at a time on the CPU, so this can take a bit.`;
  }
  if (p.state === "done") return "almost done…";
  if (p.state === "offline") return "the desktop isn't answering right now";
  return `working, ${p.seconds}s`;
}

type Cell = { n: number | null; q: string | null; out: { kind: "bot" | "sys"; text: string } | null };

/** The transcript as notebook cells: each question with the output that answered it. */
function toCells(lines: Line[]): Cell[] {
  const cells: Cell[] = [];
  let n = 0;
  for (const l of lines) {
    if (l.from === "you") {
      cells.push({ n: ++n, q: l.text, out: null });
      continue;
    }
    const last = cells[cells.length - 1];
    const out = { kind: l.from === "bot" ? ("bot" as const) : ("sys" as const), text: l.text };
    if (last && last.q !== null && last.out === null) last.out = out;
    else cells.push({ n: null, q: null, out });
  }
  return cells;
}

// Short topics for the empty state; each fires a fuller question.
const TOPICS: { label: string; q: string }[] = [
  { label: "Research", q: "What research is Bennett doing right now?" },
  { label: "Projects", q: "What are Bennett's projects?" },
  { label: "After graduation", q: "What is Bennett looking for after he graduates?" },
  { label: "Penny", q: "Tell me about Penny the cat." },
  { label: "Strengths", q: "What is Bennett best at?" },
];

const MAX = 500;
// The node's heartbeat expires after ~30s, so the pill re-checks on that cadence.
const STATUS_REFRESH_MS = 30000;
const THINKING = "thinking. It's a real computer in my house, so give it a few seconds";
const PROGRESS_POLL_MS = 2000;

const bubble = {
  padding: "10px 14px",
  borderRadius: 14,
  fontSize: "var(--text-sm)",
  lineHeight: "var(--leading-relaxed)",
} as const;

export default function AskClient({ variant = "plain" }: { variant?: "plain" | "notebook" }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  // When the status was last read: the "from 3 hours ago" in the system panel is measured against it.
  const [checkedAt, setCheckedAt] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  // The fast-lane passphrase, once the server has recognised it. It never
  // ships in the page; it is whatever was typed, kept for this visit only.
  const [priority, setPriority] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inflight = useRef<{ abort: AbortController; poll: ReturnType<typeof setInterval> } | null>(null);

  // Live status: on mount, every 30s while the tab is visible, and after each
  // answer — so the pill never claims "Online" about a desktop that went to sleep.
  useEffect(() => {
    const ctrl = new AbortController();
    const load = () => {
      if (document.hidden) return;
      fetch("/api/concierge/status", { cache: "no-store", signal: ctrl.signal })
        .then(json<StatusResponse>)
        .then((s) => {
          setStatus(s);
          setCheckedAt(nowMs());
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, STATUS_REFRESH_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      ctrl.abort();
      clearInterval(t);
      document.removeEventListener("visibilitychange", load);
    };
  }, [busy]);

  // Leaving the page mid-question stops the polling and the pending request.
  useEffect(() => {
    return () => {
      inflight.current?.abort.abort();
      if (inflight.current) clearInterval(inflight.current.poll);
    };
  }, []);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: still ? "auto" : "smooth" });
  }, [lines, busy]);

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || busy) return;

    setInput("");
    setBusy(true);
    setProgress({ state: "queued", ahead: 0, seconds: 0 });
    setLines((l) => [...l, { from: "you", text: q }]);

    // Name the job here so its progress can be polled while the answer request is
    // still open — otherwise the page has no idea whether it is queued or working.
    const jobId = newJobId();
    const startedAt = nowMs();
    const abort = new AbortController();
    const poll = setInterval(async () => {
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      try {
        const r = await fetch(`/api/concierge/progress?id=${jobId}`, { cache: "no-store", signal: abort.signal });
        const p = await json<ProgressResponse>(r);
        setProgress({ state: p.state ?? "queued", ahead: p.ahead ?? 0, seconds });
      } catch {
        setProgress((prev) => (prev ? { ...prev, seconds } : prev));
      }
    }, PROGRESS_POLL_MS);
    inflight.current = { abort, poll };
    // Pair up the transcript so a follow-up ("where?") carries what it refers to.
    // Only real you/bot exchanges — system notices are UI chrome, not conversation.
    const history: { q: string; a: string }[] = [];
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i].from === "you" && lines[i + 1].from === "bot") {
        history.push({ q: lines[i].text, a: lines[i + 1].text });
      }
    }
    try {
      const res = await fetch("/api/concierge/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(priority ? { "x-concierge-priority": priority } : {}),
        },
        body: JSON.stringify({ question: q.slice(0, MAX), history: history.slice(-2), id: jobId }),
        signal: abort.signal,
      });
      const data = await json<AskResponse>(res).catch((): AskResponse => ({ online: false, answer: null }));
      if (data.unlocked) {
        // The passphrase was typed instead of a question: unlock the fast lane
        // and keep the passphrase itself out of the transcript.
        setPriority(q);
        setLines((l) => [...l.slice(0, -1), { from: "sys", text: "Priority is on, so your questions skip the line and the limits." }]);
      } else if (data.answer) {
        setLines((l) => [...l, { from: "bot", text: data.answer as string }]);
      } else if (data.limited) {
        setLines((l) => [...l, { from: "sys", text: "That's a lot of questions in a minute, give it a moment before the next one." }]);
      } else if (data.busy) {
        setLines((l) => [...l, { from: "sys", text: "The queue is full right now, try again in a minute." }]);
      } else {
        setLines((l) => [
          ...l,
          {
            from: "sys",
            text: "The desktop that runs this is off right now, it keeps its own hours. Projects and Contact still work in the meantime.",
          },
        ]);
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setLines((l) => [...l, { from: "sys", text: "That didn't go through, try it again." }]);
    }
    clearInterval(poll);
    inflight.current = null;
    setProgress(null);
    setBusy(false);
    inputRef.current?.focus();
  };

  const online = status?.online === true;
  const pill =
    status === null
      ? { dot: "var(--text-faint)", label: "Connecting…", pulse: true }
      : online
      ? { dot: "var(--status-complete)", label: "Online", pulse: true }
      : {
          dot: "var(--status-wip)",
          label: status.lastSeen ? `Offline · last on ${ago(status.lastSeen.at, checkedAt)}` : "Offline",
          pulse: false,
        };

  const empty = lines.length === 0;
  const asleep = status !== null && !online;

  if (variant === "notebook") {
    const cells = toCells(lines);
    const kernel = busy ? "Busy" : status === null ? "Connecting…" : online ? "Idle" : "Offline";
    return (
      <main id="main" tabIndex={-1} className="md-dapple" style={{ position: "relative", paddingTop: 59 }}>
        <h1 className="sr-only">askAI</h1>
        <div className="md-above">
          <section className="nb" aria-label="Ask notebook">
            <div className="nb-bar">
              <span>askAI.ipynb</span>
              <span className="nb-kernel">
                <span aria-hidden className={pill.pulse ? "nb-dot md-pulse" : "nb-dot"} style={{ background: busy ? "var(--status-ongoing)" : pill.dot }} />
                {status?.model ? `${status.model} · ` : ""}
                {kernel}
                {priority ? " · priority" : ""}
              </span>
              <button type="button" className="nb-tool" disabled={busy || lines.length === 0} onClick={() => setLines([])}>
                Clear outputs
              </button>
              <StyleSwitch page="ask" to="plain">
                Plain view
              </StyleSwitch>
            </div>

            <div className="nb-page">
              <div className="nb-cells">
                {/* The heading and the starters are the page, not transcript, so
                    they stay outside the live region. */}
                <div className="nb-cell nb-md">
                  <h2>askAI</h2>
                  <p>
                    Questions here go to a small language model running on an old desktop in my house. There&apos;s no data center or paid AI service behind it,
                    just that one computer, so it&apos;s slower than you&apos;re used to and it only answers while the computer is on. Run a starter cell or
                    type your own below.
                    {asleep ? " It's off right now, so a question will wait up to 45 seconds for it to wake up and then give up." : ""}
                  </p>
                </div>

                {empty &&
                  TOPICS.map((t) => (
                    <div key={t.label} className="nb-cell">
                      <span aria-hidden className="nb-prompt nb-in">
                        In [&nbsp;]:
                      </span>
                      <button type="button" className="nb-code nb-starter" onClick={() => ask(t.q)} disabled={busy}>
                        <span className="nb-fn">ask</span>(<span className="nb-str">&quot;{t.label}&quot;</span>)
                      </button>
                    </div>
                  ))}

                <div ref={logRef} role="log" aria-live="polite" aria-relevant="additions" className="nb-stream">
                  {cells.map((c, i) => {
                    const running = busy && i === cells.length - 1 && c.q !== null && c.out === null;
                    return (
                      <div key={i} className="nb-cell">
                        {c.q !== null && (
                          <div className="nb-row">
                            <span aria-hidden className="nb-prompt nb-in">
                              In [{running ? "*" : c.n}]:
                            </span>
                            <div className={running ? "nb-code nb-running" : "nb-code"}>{c.q}</div>
                          </div>
                        )}
                        {c.out && (
                          <div className="nb-row">
                            <span aria-hidden className="nb-prompt nb-outp">
                              {c.out.kind === "bot" && c.n !== null ? `Out[${c.n}]:` : ""}
                            </span>
                            <div className={c.out.kind === "sys" ? "nb-out nb-notice" : "nb-out"}>{c.out.text}</div>
                          </div>
                        )}
                        {running && (
                          <div className="nb-row">
                            <span aria-hidden className="nb-prompt nb-outp" />
                            <div className="nb-out nb-progress">{progress ? progressLabel(progress) : THINKING}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <form
                className="nb-cell nb-compose"
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(input);
                }}
              >
                <span aria-hidden className="nb-prompt nb-in">
                  In [&nbsp;]:
                </span>
                <div className="nb-code nb-field">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, MAX))}
                    placeholder={asleep ? "Ask anyway…" : "Ask about Bennett…"}
                    aria-label="Ask about Bennett"
                    enterKeyHint="send"
                    autoComplete="off"
                    readOnly={busy}
                  />
                </div>
                <button type="submit" disabled={busy || input.trim().length === 0} className="md-btn md-btn-primary nb-run">
                  <Play size={15} aria-hidden />
                  <span>Run</span>
                </button>
              </form>

              <div className="nb-foot">
                <span className="nb-links">
                  <TextLink href="/projects">Projects</TextLink>
                  <TextLink href="/contact">Contact</TextLink>
                </span>
                {input.length > 0 && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: input.length >= MAX ? "var(--status-wip-text)" : "var(--text-faint)" }}>
                    {input.length}/{MAX}
                  </span>
                )}
              </div>

              <SystemPanel status={status} now={checkedAt} />
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <p className="md-lede" style={{ fontSize: "var(--text-md)" }}>
        This runs on an old desktop in my house. There&apos;s no data center or AI company behind it, just a small open model on that one computer&apos;s CPU,
        so answers take 10 to 20 seconds and it&apos;s only around while the computer is on.
      </p>
      {/* chat panel — arrives with the page; the bands are the one entrance */}
      <div
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* header: identity + live status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span className="md-label">askAI</span>
            {priority && (
              <span
                className="md-label md-fade-in"
                style={{
                  color: "var(--action-primary-fg)",
                  background: "var(--action-primary-bg)",
                  borderRadius: "var(--radius-sm)",
                  padding: "2px 6px",
                }}
              >
                Priority
              </span>
            )}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span
              aria-hidden
              className={pill.pulse ? "md-pulse" : undefined}
              style={{ width: 7, height: 7, borderRadius: "50%", background: pill.dot, flex: "0 0 auto" }}
            />
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>{pill.label}</span>
          </span>
        </div>

        {/* messages / topic picker */}
        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            padding: "var(--space-5)",
            height: "min(56vh, 440px)",
            overflowY: "auto",
          }}
        >
          {empty ? (
            <div style={{ margin: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-5)", textAlign: "center" }}>
              {asleep && (
                <p style={{ margin: 0, maxWidth: 420, fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)" }}>
                  The desktop is off right now. A question will wait up to 45 seconds for it to wake up and then give up, Projects and Contact still
                  work.
                </p>
              )}
              <span className="md-label">Pick a topic or just ask</span>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "var(--space-2)", maxWidth: 460 }}>
                {TOPICS.map((t) => (
                  <button key={t.label} type="button" onClick={() => ask(t.q)} disabled={busy} className="md-btn md-btn-secondary md-btn-sm">
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            lines.map((line, i) => {
              if (line.from === "sys") {
                return (
                  <p
                    key={i}
                    className="md-fade-in"
                    style={{ margin: 0, alignSelf: "center", maxWidth: "90%", textAlign: "center", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--text-faint)" }}
                  >
                    {line.text}
                  </p>
                );
              }
              const you = line.from === "you";
              return (
                <div
                  key={i}
                  className="md-fade-in"
                  style={{
                    ...bubble,
                    alignSelf: you ? "flex-end" : "flex-start",
                    maxWidth: "86%",
                    borderBottomRightRadius: you ? 4 : 14,
                    borderBottomLeftRadius: you ? 14 : 4,
                    background: you ? "var(--action-primary-bg)" : "var(--surface-sunken)",
                    color: you ? "var(--action-primary-fg)" : "var(--text-body)",
                    border: you ? "none" : "1px solid var(--border-subtle)",
                    whiteSpace: "pre-line",
                  }}
                >
                  {line.text}
                </div>
              );
            })
          )}

          {busy && (
            <div
              className="md-fade-in"
              style={{
                ...bubble,
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-3)",
                borderBottomLeftRadius: 4,
                background: "var(--surface-sunken)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{ display: "inline-flex", gap: 4 }}>
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="md-pulse"
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-accent)", animationDelay: `${d * 0.2}s` }}
                  />
                ))}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                {progress ? progressLabel(progress) : THINKING}
              </span>
            </div>
          )}
        </div>

        {/* composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--border-subtle)" }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX))}
            placeholder={asleep ? "Ask anyway…" : "Ask about Bennett…"}
            aria-label="Ask about Bennett"
            enterKeyHint="send"
            autoComplete="off"
            readOnly={busy}
            style={{
              flex: 1,
              minWidth: 0,
              background: "var(--surface-sunken)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 14px",
              fontFamily: "var(--font-body)",
              fontSize: 16,
              color: "var(--text-body)",
              outline: "none",
            }}
          />
          <button type="submit" disabled={busy || input.trim().length === 0} className="md-btn md-btn-primary" style={{ minHeight: 44 }}>
            <Send size={16} aria-hidden />
            <span>Ask</span>
          </button>
        </form>
      </div>

      {/* what's actually running, for anyone curious enough to look */}
      <SystemPanel status={status} now={checkedAt} />

      {/* footer: escape hatches + counter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", gap: "var(--space-5)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          <TextLink href="/projects">Projects</TextLink>
          <TextLink href="/contact">Contact</TextLink>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-4)" }}>
          {input.length > 0 && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: input.length >= MAX ? "var(--status-wip-text)" : "var(--text-faint)" }}>
              {input.length}/{MAX}
            </span>
          )}
          <StyleSwitch page="ask" to="themed">
            Notebook view
          </StyleSwitch>
        </span>
      </div>
    </div>
  );
}
