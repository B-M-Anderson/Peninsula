import type { CSSProperties, ReactNode } from "react";

/**
 * How every subpage opens: the page's one <main id="main"> (the skip-link
 * target) with the shared column and gutters, a plain header carrying the
 * page's <h1>, then the page's own layout. Flat ground, no ornament: the
 * generated leaf on the homepage is the site's only decoration.
 */
export default function PageFrame({
  title,
  subtitle,
  kicker,
  maxWidth,
  minHeight = "50vh",
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** A small line above the title: where this page sits, e.g. a link back to its section. */
  kicker?: ReactNode;
  /** Cap for narrow pages; left-aligned in the shared column, never centred. */
  maxWidth?: number;
  minHeight?: CSSProperties["minHeight"];
  children: ReactNode;
}) {
  return (
    <main id="main" tabIndex={-1} className="pg md-dapple" style={{ minHeight }}>
      <header className="pg-head">
        {kicker ? <div className="md-label pg-kicker">{kicker}</div> : null}
        <h1 className="pg-title">{title}</h1>
        {subtitle ? <p className="pg-sub">{subtitle}</p> : null}
      </header>
      <div style={maxWidth ? { maxWidth } : undefined}>{children}</div>
    </main>
  );
}
