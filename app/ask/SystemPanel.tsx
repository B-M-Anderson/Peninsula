"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export type SystemStatus = {
  online: boolean;
  provisioned: boolean;
  model: string | null;
  runtime: string;
  host: string;
  latencyMs?: number | null;
  machine?: { cpu?: string; cores?: number; ramGb?: number; gpu?: string | null } | null;
  cache?: { entries?: number; hits?: number } | null;
  idle?: { precomputed?: number; improved?: number } | null;
};

const EASE: [number, number, number, number] = [0.16, 0.84, 0.44, 1];

const label = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-3xs)",
  letterSpacing: "var(--tracking-label)",
  textTransform: "uppercase" as const,
  color: "var(--text-faint)",
};

const mono = { fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)" };

/** One step in the journey a question takes. */
function Hop({ n, where, what, last }: { n: number; where: string; what: string; last?: boolean }) {
  return (
    <li style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
        <span
          style={{
            ...mono,
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-faint)",
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
          }}
        >
          {n}
        </span>
        {!last && <span style={{ width: 1, flex: 1, minHeight: 14, background: "var(--border-subtle)" }} />}
      </span>
      <span style={{ paddingBottom: last ? 0 : "var(--space-3)" }}>
        <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{where}</span>
        <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{what}</span>
      </span>
    </li>
  );
}

function Stat({ k, v, note }: { k: string; v: string; note?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={label}>{k}</span>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{v}</span>
      {note && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{note}</span>}
    </div>
  );
}

export default function SystemPanel({ status }: { status: SystemStatus | null }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const m = status?.machine;
  const cache = status?.cache;
  const cores = m?.cores ? `${m.cores} cores` : null;
  const ram = m?.ramGb ? `${m.ramGb} GB RAM` : null;
  const cpuShort = m?.cpu?.replace(/\(R\)|\(TM\)|CPU|@.*/g, "").trim();

  return (
    <div
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        background: "var(--surface-card)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          padding: "var(--space-4) var(--space-5)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          minHeight: 44,
        }}
      >
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={label}>Under the hood</span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            {status?.model ? (
              <>
                Running <span style={{ ...mono, color: "var(--text-body)" }}>{status.model}</span>
                {cpuShort ? ` on a ${cpuShort}` : ""} — no GPU, no API key, no data centre.
              </>
            ) : (
              "What actually happens when you ask a question."
            )}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: EASE }}
          style={{ display: "grid", placeItems: "center", color: "var(--text-faint)", flex: "0 0 auto" }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
        style={{ overflow: "hidden" }}
      >
        <div
          style={{
            padding: "var(--space-5)",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-5)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "var(--space-4)",
            }}
          >
            <Stat k="Model" v={status?.model ?? "—"} note="3 billion parameters, 4-bit quantised, held in memory so there is no cold start" />
            <Stat k="Machine" v={cpuShort ?? "desktop"} note={[cores, ram].filter(Boolean).join(" · ") || undefined} />
            <Stat k="Graphics" v="None" note="every token is computed on the CPU" />
            <Stat
              k="Answer library"
              v={cache?.entries != null ? String(cache.entries) : "—"}
              note="written ahead while the desktop is idle, and copied off the machine nightly"
            />
          </div>

          <div>
            <span style={label}>The trip your question takes</span>
            <ol
              style={{
                listStyle: "none",
                margin: "var(--space-3) 0 0",
                padding: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Hop n={1} where="Your browser → this site" what="Vercel takes the question; it never touches the model." />
              <Hop n={2} where="A queue on the desktop" what="Vercel hands the question to a queue running at Bennett's house, over a private tunnel with no port forwarded." />
              <Hop
                n={3}
                where="Safety rails"
                what="Prompt-injection attempts, impersonation, and anything binding Bennett to work are answered by fixed rules — the model never sees them."
              />
              <Hop
                n={4}
                where="The library is checked first"
                what="Most of what people ask has already been written out during idle hours. A match comes back in about a third of a second."
              />
              <Hop
                n={5}
                where="The model reads a profile"
                what="One document about Bennett. If a fact is not in it, the honest answer is that it is not available."
              />
              <Hop n={6} where="Back to you" what="Instant if it was written ahead, 10–20 seconds if the question is genuinely new." last />
            </ol>
          </div>

          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: 1.6 }}>
            The slow part is honest: a small model thinking on four CPU cores in a house, not a rented GPU.
            While nobody is asking, it works ahead — writing answers to likely questions so the common ones come
            back the moment you hit enter. Ask something new and you will feel the machine actually think.
            On weekdays between nine and five that preparation stands down so the desktop is quiet while Bennett
            works at it; a question from a visitor is never the thing that gets paused.
          </p>

          {status?.latencyMs != null && (
            <span style={{ ...mono, color: "var(--text-faint)" }}>
              last heartbeat from the desktop · {status.latencyMs}ms round trip
              {cache?.hits ? ` · ${cache.hits} answers served from cache` : ""}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
