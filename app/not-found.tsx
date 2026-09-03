import type { Metadata } from "next";
import PageFrame from "./components/PageFrame";
import { Button, TextLink } from "./components/ui";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageFrame title="Not found" subtitle="404 · nothing lives at this address" maxWidth={720}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-7)" }}>
          <p className="md-lede">
            The page you were after has moved, never existed, or is hiding somewhere it shouldn&rsquo;t be. The
            navigation above still works.
          </p>
          <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="primary" href="/">Back to the front page</Button>
            <TextLink href="/projects" arrow>Browse projects</TextLink>
          </div>
      </div>
    </PageFrame>
  );
}
