import type { Metadata } from "next";
import StripeBand from "../components/brand/StripeBand";
import VaultClient from "./VaultClient";

export const metadata: Metadata = {
  title: "Vault",
  description: "Restricted partition.",
  robots: { index: false, follow: false },
};

export default function VaultPage() {
  return (
    <div>
      <div className="md-grain md-surface" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title="Vault" subtitle="Restricted partition · session-scoped" />
      </div>
      <main id="main" tabIndex={-1} className="md-dapple" style={{ maxWidth: "var(--max-width)", margin: "0 auto", minHeight: "50vh", padding: "var(--page-top) var(--gutter-page) var(--space-11)" }}>
        <div className="md-above md-fade-in" style={{ maxWidth: 760 }}>
          <VaultClient />
        </div>
      </main>
    </div>
  );
}
