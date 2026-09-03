"use client";

import { useEffect } from "react";
import StripeBand from "./components/brand/StripeBand";
import { Button, TextLink } from "./components/ui";

// Route-level error boundary. Keeps the brand frame so a crash still looks
// like this site rather than a blank page, and offers a one-click retry.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <header className="md-grain" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title="Something broke" subtitle="An error on this page, not on your end" />
      </header>
      <main id="main" className="md-dapple" style={{ position: "relative", minHeight: "50vh", padding: "var(--space-11) var(--gutter-page)" }}>
        <div className="md-above" style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-7)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-lg)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)", maxWidth: "var(--measure)" }}>
            The page hit an error while rendering. Trying again usually clears it; if it keeps happening, the
            contact page still works.
          </p>
          {error.digest ? (
            <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-faint)" }}>
              reference {error.digest}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="primary" onClick={reset}>Try again</Button>
            <TextLink href="/" arrow>Front page</TextLink>
            <TextLink href="/contact" arrow>Contact</TextLink>
          </div>
        </div>
      </main>
    </div>
  );
}
