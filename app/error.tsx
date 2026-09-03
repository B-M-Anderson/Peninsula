"use client";

import { useEffect } from "react";
import PageFrame from "./components/PageFrame";
import { Button, TextLink } from "./components/ui";

// Route-level error boundary. Keeps the brand frame so a crash still looks
// like this site rather than a blank page, and offers a one-click retry.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageFrame title="Something broke" subtitle="An error on this page, not on your end" maxWidth={720}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-7)" }}>
          <p className="md-lede">
            The page hit an error while rendering. Trying again usually clears it; if it keeps happening, the
            contact page still works.
          </p>
          {error.digest ? (
            <p className="md-label" style={{ margin: 0 }}>
              reference {error.digest}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="primary" onClick={reset}>Try again</Button>
            <TextLink href="/" arrow>Front page</TextLink>
            <TextLink href="/contact" arrow>Contact</TextLink>
          </div>
      </div>
    </PageFrame>
  );
}
