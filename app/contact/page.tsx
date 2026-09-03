import type { Metadata } from "next";
import { Mail, Phone, Linkedin, Github, ArrowRight, FileText } from "lucide-react";
import CopyButton from "../components/CopyButton";
import StripeBand from "../components/brand/StripeBand";
import { Button, TextLink } from "../components/ui";
import { CONTACT_EMAIL, CONTACT_MAILTO, CONTACT_PHONE, CONTACT_PHONE_TEL, LINKEDIN_URL, GITHUB_URL, GITHUB_USER, RESUME_META, RESUME_PATH } from "../data/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email, phone, LinkedIn and GitHub for Bennett M. Anderson.",
  alternates: { canonical: "/contact" },
};

type Row = { icon: React.ReactNode; label: string; value: string; href?: string; rel?: string; copy?: string };

/** The handle shown for a profile URL, derived so it can't drift from the link. */
function handleOf(url: string): string {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() ?? url;
  } catch {
    return url;
  }
}

export default function ContactPage() {
  const rows: Row[] = [
    { icon: <Mail size={18} />, label: "Email", value: CONTACT_EMAIL, href: CONTACT_MAILTO, copy: CONTACT_EMAIL },
    { icon: <Phone size={18} />, label: "Phone", value: CONTACT_PHONE, href: `tel:${CONTACT_PHONE_TEL}` },
    { icon: <Linkedin size={18} />, label: "LinkedIn", value: handleOf(LINKEDIN_URL), href: LINKEDIN_URL, rel: "me" },
    { icon: <Github size={18} />, label: "GitHub", value: GITHUB_USER, href: GITHUB_URL, rel: "me" },
    { icon: <FileText size={18} />, label: "Resume", value: `PDF · ${RESUME_META.pages} page · ${RESUME_META.updated}`, href: RESUME_PATH },
  ];

  return (
    <div>
      <div className="md-grain md-surface" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title="Get in touch" subtitle="Context in the first message, please" />
      </div>

      {/* The column sits in the page's content column so the copy starts under the band's title */}
      <main id="main" tabIndex={-1} className="md-dapple" style={{ position: "relative", minHeight: "60vh", maxWidth: "var(--max-width)", margin: "0 auto", padding: "var(--page-top) var(--gutter-page) var(--space-11)" }}>
        <div className="md-above" style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          <p className="md-lede">
            Email, phone or LinkedIn all work. Say what it&rsquo;s about in your first message, or it will likely be ignored.
          </p>

          <dl className="md-surface" style={{ margin: 0, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-raised)", boxShadow: "var(--shadow-sm)", padding: "var(--space-2)" }}>
            {rows.map((r, i) => (
              <div key={r.label} className="md-contact-row" style={{ borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                {/* display: contents so the icon and label are the grid's first two cells */}
                <dt style={{ display: "contents" }}>
                  <span aria-hidden style={{ color: "var(--text-accent)", display: "flex" }}>{r.icon}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-faint)" }}>
                    {r.label}
                  </span>
                </dt>
                <dd className="md-contact-value" style={{ margin: 0, display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
                  {r.href ? (
                    <TextLink href={r.href} rel={r.rel}>{r.value}</TextLink>
                  ) : (
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{r.value}</span>
                  )}
                  {r.copy ? <CopyButton text={r.copy} /> : null}
                </dd>
              </div>
            ))}
          </dl>

          <div>
            <Button variant="primary" href={CONTACT_MAILTO} iconRight={<ArrowRight size={15} />}>
              Start an email
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
