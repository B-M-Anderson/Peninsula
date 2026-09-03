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
      <main id="main" tabIndex={-1} className="md-dapple" style={{ position: "relative", minHeight: "50vh", padding: "var(--space-11) var(--gutter-page)" }}>
        <div className="md-above" style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-7)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-lg)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)", maxWidth: "var(--measure)" }}>
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
