import { Fragment, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import type { ProjectStatus } from "../data/projects";

/* MarcDesign01 primitives, ported from the reference implementation. Structural
   styling lives in globals.css (.md-btn, .md-chip, .md-card, .md-label, …).
   Nothing here holds state, so these render on the server; the one stateful
   primitive, the Accordion, lives in ./Accordion.tsx and hydrates alone. */

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
  style,
  className,
}: {
  children: ReactNode;
  interactive?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const cls = `md-card${interactive ? " md-card-interactive" : ""}${className ? ` ${className}` : ""}`;
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

// ---- Badge -----------------------------------------------------------------

export const statusColor: Record<ProjectStatus, string> = {
  ongoing: "var(--status-ongoing)",
  complete: "var(--status-complete)",
  wip: "var(--status-wip)",
  shelved: "var(--status-shelved)",
  terminated: "var(--status-terminated)",
};

/** What the badge says. The keys are the data's; the words are a reader's. */
export const statusLabel: Record<ProjectStatus, string> = {
  ongoing: "ongoing",
  complete: "complete",
  wip: "in progress",
  shelved: "shelved",
  terminated: "stopped",
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
        <span className="md-label">{label}</span>
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

/**
 * "a · b · c" as items rather than one string: the dot travels with the item
 * after it, so a wrap can only fall before a separator, never leave one
 * hanging at the end of a line.
 */
export function Dotted({ items }: { items: Array<string | null | undefined | false> }) {
  const list = items.filter((x): x is string => typeof x === "string" && x.length > 0);
  return (
    <>
      {list.map((t, i) => (
        <Fragment key={`${i}-${t}`}>
          {/* a real space between items is the only break opportunity */}
          {i > 0 ? " " : null}
          <span style={{ whiteSpace: "nowrap" }}>
            {i > 0 ? "· " : null}
            {t}
          </span>
        </Fragment>
      ))}
    </>
  );
}

export function SectionHeading({ children, kicker, id }: { children: ReactNode; kicker?: ReactNode; id?: string }) {
  return (
    <div style={{ marginBottom: "var(--space-7)" }}>
      {kicker ? (
        <div className="md-label" style={{ marginBottom: "var(--space-3)" }}>
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
  newTab,
}: {
  children: ReactNode;
  href: string;
  arrow?: boolean;
  onClick?: (e: MouseEvent) => void;
  rel?: string;
  /** Open an internal file (e.g. the resume PDF) in a new tab, as Button does. */
  newTab?: boolean;
}) {
  const external = isExternal(href);
  const blank = external || Boolean(newTab);
  // → for a move within the site, ↗ for one that leaves it.
  const glyph = arrow ? <span aria-hidden>{external ? "↗" : "→"}</span> : null;
  if (!external && !newTab && isRoute(href)) {
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
      target={blank ? "_blank" : undefined}
      rel={[blank ? "noopener noreferrer" : "", rel ?? ""].filter(Boolean).join(" ") || undefined}
    >
      {children}
      {blank ? <NewTabCue /> : null}
      {glyph}
    </a>
  );
}
