"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { TextLink } from "../components/ui";
import { json, type AskResponse, type ProgressResponse, type StatusResponse } from "../lib/api-types";
import SystemPanel from "./SystemPanel";

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
    return `waiting — ${p.ahead - 1} question${p.ahead - 1 === 1 ? "" : "s"} ahead of yours`;
  }
  if (p.state === "queued") return "waiting for the desktop to pick it up…";
  if (p.state === "working") {
    if (p.seconds < 4) return "the desktop picked it up";
    if (p.seconds < 15) return `writing an answer — ${p.seconds}s`;
    return `still writing — ${p.seconds}s. New questions are composed a word at a time on a CPU.`;
  }
  if (p.state === "done") return "finishing up…";
  if (p.state === "offline") return "the desktop isn't answering right now";
  return `working — ${p.seconds}s`;
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
const PROGRESS_POLL_MS = 2000;

const bubble = {
  padding: "10px 14px",
  borderRadius: 14,
  fontSize: "var(--text-sm)",
  lineHeight: "var(--leading-relaxed)",
} as const;

export default function AskClient() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
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
        .then((s) => setStatus(s))
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
        setLines((l) => [...l.slice(0, -1), { from: "sys", text: "Priority access on — your questions now jump the queue and skip limits." }]);
      } else if (data.answer) {
        setLines((l) => [...l, { from: "bot", text: data.answer as string }]);
      } else if (data.limited) {
        setLines((l) => [...l, { from: "sys", text: "That's a lot of questions in one minute — give it a moment before the next one." }]);
      } else if (data.busy) {
        setLines((l) => [...l, { from: "sys", text: "The queue is full right now. Try again in a minute." }]);
      } else {
        setLines((l) => [
          ...l,
          {
            from: "sys",
            text: "The desktop that runs this is asleep right now — it keeps its own hours. Try Projects or Contact in the meantime.",
          },
        ]);
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setLines((l) => [...l, { from: "sys", text: "That didn't go through. Give it another try." }]);
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
      : { dot: "var(--status-wip)", label: "Offline", pulse: false };

  const empty = lines.length === 0;
  const asleep = status !== null && !online;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
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
            <span className="md-label">Concierge</span>
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
                  The desktop is asleep right now. A question will wait up to 45 seconds for it to wake, then
                  give up — Projects and Contact still work.
                </p>
              )}
              <span className="md-label">Pick a topic — or just ask</span>
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
                {progress ? progressLabel(progress) : "thinking — real machine at home, give it a few seconds"}
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
      <SystemPanel status={status} />

      {/* footer: escape hatches + counter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", gap: "var(--space-5)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          <TextLink href="/projects">Projects</TextLink>
          <TextLink href="/contact">Contact</TextLink>
        </span>
        {input.length > 0 && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: input.length >= MAX ? "var(--status-wip-text)" : "var(--text-faint)" }}>
            {input.length}/{MAX}
          </span>
        )}
      </div>
    </div>
  );
}
