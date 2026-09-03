import { TextLink } from "./ui";
import Year from "./Year";
import { CONTACT_MAILTO, GITHUB_URL, LINKEDIN_URL, REPO_URL, RESUME_PATH, SITE_NAME } from "../data/site";

/** One hairline row at the foot of every page: name, year, the places to find me. */
export default function Footer() {
  return (
    <footer className="md-site-footer" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-page)" }}>
      <div
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "var(--space-6) var(--gutter-page)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-5)",
          flexWrap: "wrap",
        }}
      >
        <span className="md-label">
          {SITE_NAME} · © <Year />
        </span>
        <nav aria-label="Footer" style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
          <TextLink href={GITHUB_URL}>GitHub</TextLink>
          <TextLink href={LINKEDIN_URL}>LinkedIn</TextLink>
          <TextLink href={CONTACT_MAILTO}>Email</TextLink>
          <TextLink href={RESUME_PATH} newTab>Resume</TextLink>
          <TextLink href={REPO_URL}>Source</TextLink>
        </nav>
      </div>
    </footer>
  );
}
