"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";
import StripeBand from "../components/brand/StripeBand";
import { TextLink } from "../components/ui";
import { CONCIERGE_PRIORITY_CODE } from "../data/site";

type Status = {
  online: boolean;
  provisioned: boolean;
  model: string | null;
  runtime: string;
  host: string;
  note?: string;
  latencyMs?: number | null;
};

type Line = { from: "you" | "bot" | "sys"; text: string };

const GREETING =
  "Ask me about Bennett — his work, his projects, the cat, what he's after next. I only know what he's put out in the open.";

const SUGGESTIONS = [
  "What's Bennett working on now?",
  "What's he looking for after graduation?",
  "What are his projects?",
  "Tell me about Penny.",
  "What's he best at?",
];

const MAX = 500;

export default function AskPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [lines, setLines] = useState<Line[]>([{ from: "bot", text: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [priority, setPriority] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    fetch("/api/concierge/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [lines, busy]);

  const ask = async (raw: string) => {
    const q = raw.trim();
    if (!q || busy) return;

    // Priority passphrase: unlock the fast lane instead of asking a question.
    if (q === CONCIERGE_PRIORITY_CODE) {
      setInput("");
      setPriority(true);
      setLines((l) => [
        ...l,
        { from: "sys", text: "Priority access on — your questions now jump the queue and skip limits." },
      ]);
      return;
    }

    setInput("");
    setBusy(true);
    setLines((l) => [...l, { from: "you", text: q }]);
    try {
      const res = await fetch("/api/concierge/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(priority ? { "x-concierge-priority": CONCIERGE_PRIORITY_CODE } : {}),
        },
        body: JSON.stringify({ question: q.slice(0, MAX) }),
      });
      const data = await res.json();
      if (data.answer) {
        setLines((l) => [...l, { from: "bot", text: data.answer }]);
      } else {
        setLines((l) => [
          ...l,
          {
            from: "sys",
            text: "The desktop that runs this is asleep or not wired up right now — it keeps its own hours. Try Projects or Contact in the meantime.",
          },
        ]);
      }
    } catch {
      setLines((l) => [...l, { from: "sys", text: "That didn't go through. Give it another try." }]);
    }
    setBusy(false);
  };

  const asked = lines.some((l) => l.from === "you");
  const online = status?.online === true;
  const pill =
    status === null
      ? { dot: "var(--text-faint)", label: "Connecting…", pulse: true }
      : online
      ? { dot: "var(--status-complete)", label: "Online", pulse: true }
      : { dot: "var(--status-wip)", label: "Offline — the desktop's asleep", pulse: false };

  return (
    <div>
      <header
        className="md-grain"
        style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}
      >
        <StripeBand offset="80px" title="Ask" subtitle="A small model on my desktop, answering for me" />
      </header>

      <main
        className="md-dapple"
        style={{ position: "relative", minHeight: "60vh", padding: "clamp(28px, 6vw, 64px) clamp(18px, 5vw, 48px)" }}
      >
        <div
          className="md-above"
          style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}
        >
          <p style={{ margin: 0, fontSize: "var(--text-md)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)" }}>
            No cloud, no third-party AI. A small model runs on my desktop at home, answers your
            question, and goes back to sleep. It only speaks from what I&apos;ve published — and it
            talks about me, not as me.
          </p>

          {/* chat panel */}
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
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-3xs)",
                    letterSpacing: "var(--tracking-label)",
                    textTransform: "uppercase",
                    color: "var(--text-faint)",
                  }}
                >
                  Concierge
                </span>
                {priority && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-3xs)",
                      letterSpacing: "var(--tracking-label)",
                      textTransform: "uppercase",
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
                  className={pill.pulse && !reduce ? "md-pulse" : undefined}
                  style={{ width: 7, height: 7, borderRadius: "50%", background: pill.dot, flex: "0 0 auto" }}
                />
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>{pill.label}</span>
              </span>
            </div>

            {/* messages */}
            <div
              ref={logRef}
              aria-live="polite"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
                padding: "var(--space-5)",
                height: "min(56vh, 440px)",
                overflowY: "auto",
              }}
            >
              {lines.map((line, i) => {
                if (line.from === "sys") {
                  return (
                    <p
                      key={i}
                      style={{ margin: 0, alignSelf: "center", maxWidth: "90%", textAlign: "center", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--text-faint)" }}
                    >
                      {line.text}
                    </p>
                  );
                }
                const you = line.from === "you";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 0.84, 0.44, 1] }}
                    style={{
                      alignSelf: you ? "flex-end" : "flex-start",
                      maxWidth: "86%",
                      padding: "10px 14px",
                      borderRadius: 14,
                      borderBottomRightRadius: you ? 4 : 14,
                      borderBottomLeftRadius: you ? 14 : 4,
                      background: you ? "var(--action-primary-bg)" : "var(--surface-sunken)",
                      color: you ? "var(--action-primary-fg)" : "var(--text-body)",
                      border: you ? "none" : "1px solid var(--border-subtle)",
                      fontSize: "var(--text-sm)",
                      lineHeight: "var(--leading-relaxed)",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {line.text}
                  </motion.div>
                );
              })}

              {busy && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    padding: "10px 14px",
                    borderRadius: 14,
                    borderBottomLeftRadius: 4,
                    background: "var(--surface-sunken)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ display: "inline-flex", gap: 4 }}>
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className={reduce ? undefined : "md-pulse"}
                        style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-accent)", animationDelay: `${d * 0.2}s` }}
                      />
                    ))}
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    thinking — it&apos;s a real machine at home, give it a few seconds
                  </span>
                </div>
              )}
            </div>

            {/* starter questions — only before the first ask */}
            {!asked && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", padding: "0 var(--space-5) var(--space-4)" }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)} disabled={busy} className="md-btn md-btn-secondary md-btn-sm">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--border-subtle)" }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX))}
                placeholder="Ask about Bennett…"
                aria-label="Ask about Bennett"
                enterKeyHint="send"
                autoComplete="off"
                disabled={busy}
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
              <button
                type="submit"
                aria-label="Send question"
                disabled={busy || input.trim().length === 0}
                className="md-btn md-btn-primary"
                style={{ opacity: busy || input.trim().length === 0 ? 0.5 : 1, minHeight: 44 }}
              >
                <Send size={16} />
                <span>Ask</span>
              </button>
            </form>
          </div>

          {/* char counter + escape hatches */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", gap: "var(--space-5)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              Not what you&apos;re after? <TextLink href="/projects">Projects</TextLink>
              <TextLink href="/contact">Contact</TextLink>
            </span>
            {input.length > 0 && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: input.length >= MAX ? "var(--status-wip)" : "var(--text-faint)" }}>
                {input.length}/{MAX}
              </span>
            )}
          </div>

          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-faint)", lineHeight: "var(--leading-relaxed)" }}>
            Even asleep, it remembers a few things. Mostly about the cat.
          </p>
        </div>
      </main>
    </div>
  );
}
