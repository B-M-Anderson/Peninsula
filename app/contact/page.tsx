import type { Metadata } from "next";
import { Mail, Phone, Linkedin, Github, ArrowRight } from "lucide-react";
import StripeBand from "../components/brand/StripeBand";
import { Button, TextLink } from "../components/ui";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_TEL, LINKEDIN_URL, GITHUB_URL, GITHUB_USER } from "../data/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email, phone, LinkedIn and GitHub for Bennett M. Anderson.",
  alternates: { canonical: "/contact" },
};

type Row = { icon: React.ReactNode; label: string; value: string; href?: string; rel?: string };

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
    { icon: <Mail size={18} />, label: "Email", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
    { icon: <Phone size={18} />, label: "Phone", value: CONTACT_PHONE, href: `tel:${CONTACT_PHONE_TEL}` },
    { icon: <Linkedin size={18} />, label: "LinkedIn", value: handleOf(LINKEDIN_URL), href: LINKEDIN_URL, rel: "me" },
    { icon: <Github size={18} />, label: "GitHub", value: GITHUB_USER, href: GITHUB_URL, rel: "me" },
  ];

  return (
    <div>
      <header className="md-grain md-surface" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title="Get in touch" subtitle="Context in the first message, please" />
      </header>

      <main id="main" className="md-dapple" style={{ position: "relative", minHeight: "60vh", padding: "var(--space-11) var(--gutter-page)" }}>
        <div className="md-above" style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-lg)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)" }}>
            Feel free to reach out via email, phone, or LinkedIn. If using phone or email, please provide context in your first
            message or it will likely be ignored.
          </p>

          <dl className="md-surface" style={{ margin: 0, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-raised)", boxShadow: "var(--shadow-sm)", padding: "var(--space-2)" }}>
            {rows.map((r, i) => (
              <div key={r.label} className="md-contact-row" style={{ borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                <span aria-hidden style={{ color: "var(--text-accent)", display: "flex" }}>{r.icon}</span>
                <dt style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-faint)" }}>
                  {r.label}
                </dt>
                <dd className="md-contact-value" style={{ margin: 0 }}>
                  {r.href ? (
                    <TextLink href={r.href} rel={r.rel}>{r.value}</TextLink>
                  ) : (
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{r.value}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div>
            <Button variant="primary" href={`mailto:${CONTACT_EMAIL}`} iconRight={<ArrowRight size={15} />}>
              Start an email
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
