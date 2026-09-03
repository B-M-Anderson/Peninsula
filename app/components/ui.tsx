"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import type { ProjectStatus } from "../data/projects";

/* MarcDesign01 primitives, ported from the reference implementation. Structural
   styling lives in globals.css (.md-btn, .md-chip, .md-card, .md-acc-*). */

// ---- link helpers ----------------------------------------------------------

const isExternal = (href: string) => /^https?:\/\//i.test(href);
/** An in-app route (not a static file such as the resume PDF). */
const isRoute = (href: string) => href.startsWith("/") && !/\.[a-z0-9]{2,5}(\?|#|$)/i.test(href);

/** Screen-reader note for links that leave the site in a new tab. */
function NewTabCue() {
  return <span className="sr-only"> (opens in a new tab)</span>;
}

// ---- Button ----------------------------------------------------------------

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
  href?: string;
  download?: boolean;
  /** Open an internal file (e.g. the resume PDF) in a new tab. */
  newTab?: boolean;
  onClick?: () => void;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  /** Toggle-button state, rendered as aria-pressed. */
  pressed?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  rel?: string;
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  href,
  download,
  newTab,
  onClick,
  iconLeft,
  iconRight,
  className,
  pressed,
  disabled,
  type = "button",
  rel,
}: ButtonProps) {
  const cls = `md-btn md-btn-${variant}${size === "sm" ? " md-btn-sm" : ""}${className ? ` ${className}` : ""}`;
  const inner = (
    <>
      {iconLeft}
      {children}
      {iconRight}
    </>
  );
  if (href) {
    const external = isExternal(href);
    const blank = external || newTab;
    if (!external && !download && !newTab && isRoute(href)) {
      return (
        <Link href={href} className={cls} rel={rel}>
          {inner}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className={cls}
        download={download}
        target={blank ? "_blank" : undefined}
        rel={[blank ? "noopener noreferrer" : "", rel ?? ""].filter(Boolean).join(" ") || undefined}
      >
        {inner}
        {blank ? <NewTabCue /> : null}
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} aria-pressed={pressed} disabled={disabled}>
      {inner}
    </button>
  );
}

// ---- Chip ------------------------------------------------------------------

export function Chip({ children, emphasis = "normal" }: { children: ReactNode; emphasis?: "normal" | "strong" }) {
  return <span className={`md-chip${emphasis === "strong" ? " md-chip-strong" : ""}`}>{children}</span>;
}

// ---- Card ------------------------------------------------------------------

export function Card({
  children,
  interactive,
  onClick,
  style,
  className,
}: {
  children: ReactNode;
  interactive?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}) {
  const cls = `md-card${interactive ? " md-card-interactive" : ""}${className ? ` ${className}` : ""}`;
  // Only take on button semantics when we actually own the click; when nested in
  // a Link (no onClick) we just want the hover-border styling.
  if (onClick) {
    return (
      <div
        className={cls}
        style={style}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {children}
      </div>
    );
  }
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

// ---- Badge -----------------------------------------------------------------

const statusColor: Record<ProjectStatus, string> = {
  ongoing: "var(--status-ongoing)",
  complete: "var(--status-complete)",
  wip: "var(--status-wip)",
  shelved: "var(--status-shelved)",
  terminated: "var(--status-terminated)",
};

export function Badge({
  children,
  status,
  icon,
}: {
  children: ReactNode;
  status?: ProjectStatus;
  icon?: ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: "var(--space-2)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-3xs)",
        letterSpacing: "var(--tracking-label)",
        textTransform: "lowercase",
        color: "var(--text-muted)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        padding: "3px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {status ? (
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor[status], flex: "0 0 auto" }}
        />
      ) : null}
      {icon}
      {children}
    </span>
  );
}

// ---- ProgressBar -----------------------------------------------------------

export function ProgressBar({
  label,
  value,
  tone = "tan",
  style,
}: {
  label: string;
  value: number;
  tone?: "tan" | "moss";
  style?: CSSProperties;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const fill = tone === "moss" ? "var(--status-complete)" : "var(--text-accent)";
  return (
    <div style={style}>
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-3xs)",
            letterSpacing: "var(--tracking-label)",
            textTransform: "uppercase",
            color: "var(--text-faint)",
          }}
        >
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--text-muted)" }}>{v}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        style={{ height: 8, borderRadius: "var(--radius-sm)", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", overflow: "hidden" }}
      >
        <div style={{ width: `${v}%`, height: "100%", background: fill }} />
      </div>
    </div>
  );
}

// ---- SectionHeading --------------------------------------------------------

export function SectionHeading({ children, kicker, id }: { children: ReactNode; kicker?: string; id?: string }) {
  return (
    <div style={{ marginBottom: "var(--space-7)" }}>
      {kicker ? (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-3xs)",
            letterSpacing: "var(--tracking-label)",
            textTransform: "uppercase",
            color: "var(--text-faint)",
            marginBottom: "var(--space-3)",
          }}
        >
          {kicker}
        </div>
      ) : null}
      <h2 id={id} style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 500, letterSpacing: "var(--tracking-display)", color: "var(--text-strong)", margin: 0 }}>
        {children}
      </h2>
    </div>
  );
}

// ---- TextLink --------------------------------------------------------------

export function TextLink({
  children,
  href,
  arrow,
  onClick,
  rel,
}: {
  children: ReactNode;
  href: string;
  arrow?: boolean;
  onClick?: (e: MouseEvent) => void;
  rel?: string;
}) {
  const external = isExternal(href);
  // → for a move within the site, ↗ for one that leaves it.
  const glyph = arrow ? <span aria-hidden>{external ? "↗" : "→"}</span> : null;
  if (!external && isRoute(href)) {
    return (
      <Link href={href} className="md-link" onClick={onClick} rel={rel}>
        {children}
        {glyph}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className="md-link"
      onClick={onClick}
      target={external ? "_blank" : undefined}
      rel={[external ? "noopener noreferrer" : "", rel ?? ""].filter(Boolean).join(" ") || undefined}
    >
      {children}
      {external ? <NewTabCue /> : null}
      {glyph}
    </a>
  );
}

// ---- Accordion -------------------------------------------------------------

export type AccordionItem = {
  /** Stable id: element id for deep links, and the key React tracks the row by. */
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  content: ReactNode;
};

// Location hash as an external store, so a `/projects#slug` link (or a
// back/forward move between hashes) can open the matching row without a
// setState-in-effect. The server snapshot is empty; the client re-reads on
// hydration, which is the documented useSyncExternalStore behaviour.
function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
// Total: a mangled fragment (#%E2) must not throw inside render — it just
// matches no row.
const readHash = () => {
  const raw = window.location.hash.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};
const noHash = () => "";

export function Accordion({
  items,
  defaultOpen,
  syncHash,
}: {
  items: AccordionItem[];
  /** id of the row open on first paint; defaults to none. */
  defaultOpen?: string;
  /** Read #hash on load / hashchange, and write it back as rows open. */
  syncHash?: boolean;
}) {
  const hash = useSyncExternalStore(subscribeHash, syncHash ? readHash : noHash, noHash);
  // `undefined` = the visitor hasn't touched anything yet, so the hash (if it
  // names a row) or the default decides. `null` = they closed everything.
  const [choice, setChoice] = useState<string | null | undefined>(undefined);
  // The default is latched on first render: re-sorting the list must not hand
  // the open state to whichever row lands first.
  const [initial] = useState(defaultOpen ?? null);
  const hashOpen = hash && items.some((it) => it.id === hash) ? hash : null;
  const open = choice !== undefined ? choice : (hashOpen ?? initial);

  // Bring a deep-linked row into view: once now, and again after the panels
  // above it have finished collapsing (0.28s grid transition), since that
  // shifts the row up. The fixed navbar is covered by scroll-margin-top.
  useEffect(() => {
    if (!syncHash || !hashOpen || choice !== undefined) return;
    const go = () => document.getElementById(hashOpen)?.scrollIntoView({ block: "start" });
    go();
    const t = setTimeout(go, 340);
    return () => clearTimeout(t);
  }, [syncHash, hashOpen, choice]);

  const toggle = (id: string) => {
    const next = open === id ? null : id;
    setChoice(next);
    if (syncHash && typeof history !== "undefined") {
      const url = next ? `#${encodeURIComponent(next)}` : window.location.pathname + window.location.search;
      history.replaceState(history.state, "", url);
    }
  };

  return (
    <div>
      {items.map((item) => {
        const isOpen = open === item.id;
        const panelId = `${item.id}-panel`;
        const triggerId = `${item.id}-trigger`;
        return (
          <div key={item.id} id={item.id} className={`md-acc-row${isOpen ? " md-acc-open" : ""}`}>
            <button
              type="button"
              id={triggerId}
              className="md-acc-trigger"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
            >
              <span className="min-w-0" style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
                {item.title}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
                {item.meta ? (
                  <span className="md-acc-meta" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--text-faint)", whiteSpace: "nowrap" }}>{item.meta}</span>
                ) : null}
                <span className="md-acc-marker" aria-hidden>+</span>
              </span>
            </button>
            <div className="md-acc-panel">
              {/* inert keeps links, buttons and embeds inside a collapsed panel
                  out of the tab order and away from screen readers. */}
              <div id={panelId} role="region" aria-labelledby={triggerId} className="md-acc-inner" inert={!isOpen}>
                <div style={{ padding: "0 0 var(--space-7)" }}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
