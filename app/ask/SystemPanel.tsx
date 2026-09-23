"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { StatusResponse } from "../lib/api-types";

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
      <span className="md-label">{k}</span>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{v}</span>
      {note && <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{note}</span>}
    </div>
  );
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "5 minutes ago", "yesterday", "3 days ago". */
export function ago(at: number, now: number): string {
  const s = Math.round((at - now) / 1000);
  const a = Math.abs(s);
  if (a < 60) return "just now";
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86400), "day");
}

/** "Sep 23, 4:02 PM" in the visitor's own time zone. */
export const stamp = (at: number) => new Date(at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * What's running, for anyone curious enough to open it. Live numbers while the
 * desktop is on; while it's off, the last numbers it reported, labelled with
 * when that was. `now` comes from the parent (a render must not read the clock).
 */
export default function SystemPanel({ status, now }: { status: StatusResponse | null; now: number }) {
  const [open, setOpen] = useState(false);

  const online = status?.online === true;
  const seen = status?.lastSeen ?? null;
  const model = status?.model ?? seen?.model ?? null;
  const m = status?.machine ?? seen?.machine;
  const cache = status?.cache ?? seen?.cache;
  const cores = m?.cores ? `${m.cores} cores` : null;
  const ram = m?.ramGb ? `${m.ramGb} GB RAM` : null;
  const cpuShort = m?.cpu?.replace(/\(R\)|\(TM\)|CPU|@.*/g, "").trim();

  return (
    // The body opens on the same grid-rows transition as the project rows.
    <div
      className={open ? "md-acc-open" : undefined}
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        background: "var(--surface-card)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="system-panel"
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
          <span className="md-label">Under the hood</span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            {model ? (
              <>
                {online ? "Running " : "Last ran "}
                <span style={{ ...mono, color: "var(--text-body)" }}>{model}</span>
                {cpuShort ? ` on a ${cpuShort}` : ""}, an old desktop in my house. No GPU and no data center.
              </>
            ) : (
              "What happens to your question, and the computer that answers it."
            )}
          </span>
        </span>
        <span className="md-chevron" style={{ display: "grid", placeItems: "center", color: "var(--text-faint)", flex: "0 0 auto" }}>
          <ChevronDown size={16} aria-hidden />
        </span>
      </button>

      <div className="md-acc-panel">
        <div id="system-panel" className="md-acc-inner" inert={!open}>
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
              <Stat k="Model" v={model ?? "—"} note={model ? "3 billion parameters, 4-bit quantized" : undefined} />
              <Stat k="Machine" v={cpuShort ?? "desktop"} note={[cores, ram].filter(Boolean).join(" · ") || undefined} />
              <Stat k="Graphics" v={m?.gpu || "None"} note={m?.gpu ? "the model runs on the GPU" : "so every word gets worked out on the CPU"} />
              <Stat k="Answer library" v={cache?.entries != null ? String(cache.entries) : "—"} note="answers it writes ahead of time while nobody's asking" />
            </div>

            {seen ? (
              <span style={{ ...mono, color: online ? "var(--text-faint)" : "var(--text-muted)" }}>
                {online
                  ? `Live numbers, checked ${stamp(seen.at)}`
                  : `The desktop is off, so these are the last numbers it sent, from ${ago(seen.at, now)} (${stamp(seen.at)}).`}
              </span>
            ) : status && !online ? (
              <span style={{ ...mono, color: "var(--text-muted)" }}>The desktop is off and hasn&apos;t reported any numbers yet.</span>
            ) : null}

            <div>
              <span className="md-label">The trip your question takes</span>
              <ol
                style={{
                  listStyle: "none",
                  margin: "var(--space-3) 0 0",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Hop n={1} where="Your browser → this site" what="Vercel hosts the site and holds on to your question. It never runs the model." />
                <Hop n={2} where="A queue in the middle" what="The desktop checks the queue and pulls questions down. Nothing on the internet can connect to it directly." />
                <Hop
                  n={3}
                  where="Safety rails"
                  what="Prompt-injection attempts, impersonation and anything that would commit me to work get a fixed reply, and the model never sees them."
                />
                <Hop n={4} where="The model reads a profile" what="It gets one document about me. If something isn't in there, it's supposed to say it doesn't know." />
                <Hop n={5} where="Back to you" what="Usually 10 to 20 seconds, or right away if someone asked the same thing before." last />
              </ol>
            </div>

            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: 1.6 }}>
              The wait is real. It&apos;s a small model on four CPU cores in my house, with no rented GPU anywhere in the chain. When nobody&apos;s asking it works
              ahead, writing answers to the questions people tend to ask, so those come back as soon as you hit enter. Ask it something new and you&apos;re
              waiting on that old desktop to actually think it through.
            </p>

            {online && status?.latencyMs != null && (
              <span style={{ ...mono, color: "var(--text-faint)" }}>
                last heartbeat from the desktop · {status.latencyMs}ms round trip
                {cache?.hits ? ` · ${cache.hits} answers served from cache` : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
