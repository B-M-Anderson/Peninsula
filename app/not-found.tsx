import type { Metadata } from "next";
import StripeBand from "./components/brand/StripeBand";
import { Button, TextLink } from "./components/ui";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div>
      <div className="md-grain md-surface" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title="Not found" subtitle="404 · nothing lives at this address" />
      </div>
      <main id="main" tabIndex={-1} className="md-dapple" style={{ position: "relative", minHeight: "50vh", maxWidth: "var(--max-width)", margin: "0 auto", padding: "var(--page-top) var(--gutter-page) var(--space-11)" }}>
        <div className="md-above" style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: "var(--space-7)" }}>
          <p className="md-lede">
            The page you were after has moved, never existed, or is hiding somewhere it shouldn&rsquo;t be. The
            navigation above still works.
          </p>
          <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="primary" href="/">Back to the front page</Button>
            <TextLink href="/projects" arrow>Browse projects</TextLink>
          </div>
        </div>
      </main>
    </div>
  );
}
