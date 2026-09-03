import type { Metadata } from "next";
import StripeBand from "../components/brand/StripeBand";
import AskClient from "./AskClient";

export const metadata: Metadata = {
  title: "Ask",
  description: "Ask a small language model, running on my own desktop, about my work — no cloud, no API key.",
  alternates: { canonical: "/ask" },
};

export default function AskPage() {
  return (
    <div>
      <div className="md-grain md-surface" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title="Ask" subtitle="A small model on my desktop, answering for me" />
      </div>

      <main
        id="main" tabIndex={-1}
        className="md-dapple"
        style={{ position: "relative", minHeight: "60vh", maxWidth: "var(--max-width)", margin: "0 auto", padding: "var(--page-top) var(--gutter-page) var(--space-11)" }}
      >
        <div className="md-above" style={{ maxWidth: 760 }}>
          <AskClient />
        </div>
      </main>
    </div>
  );
}
