"use client";

import { useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";

/* MarcDesign01 primitives, ported from the reference implementation. Structural
   styling lives in globals.css (.md-btn, .md-chip, .md-card, .md-acc-*). */

// ---- Button ----------------------------------------------------------------

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
  href?: string;
  download?: boolean;
  onClick?: () => void;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  href,
  download,
  onClick,
  iconLeft,
  iconRight,
  className,
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
    const external = href.startsWith("http");
    return (
      <a
        href={href}
        className={cls}
        download={download}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
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

const statusColor: Record<string, string> = {
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
  status?: string;
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
          style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor[status] ?? "var(--text-accent)", flex: "0 0 auto" }}
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
      <div style={{ height: 8, borderRadius: "var(--radius-sm)", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
        <div style={{ width: `${v}%`, height: "100%", background: fill }} />
      </div>
    </div>
  );
}

// ---- SectionHeading --------------------------------------------------------

export function SectionHeading({ children, kicker }: { children: ReactNode; kicker?: string }) {
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
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 500, letterSpacing: "var(--tracking-display)", color: "var(--text-strong)", margin: 0 }}>
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
}: {
  children: ReactNode;
  href: string;
  arrow?: boolean;
  onClick?: (e: MouseEvent) => void;
}) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  return (
    <a
      href={href}
      className="md-link"
      onClick={onClick}
      {...(external ? { target: href.startsWith("http") ? "_blank" : undefined, rel: "noopener noreferrer" } : {})}
    >
      {children}
      {arrow ? <span aria-hidden>→</span> : null}
    </a>
  );
}

// ---- Accordion -------------------------------------------------------------

export type AccordionItem = {
  title: ReactNode;
  meta?: ReactNode;
  content: ReactNode;
};

export function Accordion({ items, defaultOpen }: { items: AccordionItem[]; defaultOpen?: number }) {
  const [open, setOpen] = useState<number | null>(defaultOpen ?? null);
  return (
    <div>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`md-acc-row${isOpen ? " md-acc-open" : ""}`}>
            <button
              className="md-acc-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="min-w-0" style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
                {item.title}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
                {item.meta ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--text-faint)", whiteSpace: "nowrap" }}>{item.meta}</span>
                ) : null}
                <span className="md-acc-marker" aria-hidden>+</span>
              </span>
            </button>
            <div className="md-acc-panel">
              <div className="md-acc-inner">
                <div style={{ padding: "0 0 var(--space-7)" }}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
