import type { Metadata } from "next";
import StripeBand from "../components/brand/StripeBand";
import DarkroomClient from "./DarkroomClient";

export const metadata: Metadata = {
  title: "Darkroom",
  description: "Field observations, developed on site.",
  // Linked from the front page for people, not for search engines.
  robots: { index: false, follow: false },
};

export default function DarkroomPage() {
  return (
    <div>
      <div className="md-grain md-surface" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title="Darkroom" subtitle="Field observations, developed on site" />
      </div>
      <main id="main" tabIndex={-1} className="md-dapple" style={{ maxWidth: "var(--max-width)", margin: "0 auto", minHeight: "50vh", padding: "var(--space-9) var(--gutter-page) var(--space-11)" }}>
        <div className="md-above md-fade-in">
          <DarkroomClient />
        </div>
      </main>
    </div>
  );
}
