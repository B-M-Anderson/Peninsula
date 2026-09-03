import type { CSSProperties, ReactNode } from "react";
import StripeBand from "./brand/StripeBand";

/**
 * How every subpage opens: the 232px grain title frame carrying the bands and
 * the page's <h1>, then the page's one <main id="main"> (the skip-link target)
 * with the shared column and gutters. Pages supply their own inner layout.
 */
export default function PageFrame({
  title,
  subtitle,
  maxWidth,
  minHeight = "50vh",
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  /** Cap for narrow pages; left-aligned in the shared column, never centred. */
  maxWidth?: number;
  minHeight?: CSSProperties["minHeight"];
  children: ReactNode;
}) {
  return (
    <div>
      <div className="md-grain md-surface" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title={title} subtitle={subtitle} />
      </div>
      <main
        id="main"
        tabIndex={-1}
        className="md-dapple"
        style={{ position: "relative", maxWidth: "var(--max-width)", margin: "0 auto", minHeight, padding: "var(--page-top) var(--gutter-page) var(--space-11)" }}
      >
        <div className="md-above" style={maxWidth ? { maxWidth } : undefined}>
          {children}
        </div>
      </main>
    </div>
  );
}
