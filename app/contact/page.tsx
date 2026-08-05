"use client";

import { Mail, Phone, Linkedin, Github, ArrowRight } from "lucide-react";
import StripeBand from "../components/brand/StripeBand";
import { Button, TextLink } from "../components/ui";
import { CONTACT_EMAIL, CONTACT_PHONE, LINKEDIN_URL, GITHUB_URL, GITHUB_USER } from "../data/site";

type Row = { icon: React.ReactNode; label: string; value: string; href?: string };

export default function ContactPage() {
  const rows: Row[] = [
    { icon: <Mail size={18} />, label: "Email", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
    { icon: <Phone size={18} />, label: "Phone", value: CONTACT_PHONE },
    { icon: <Linkedin size={18} />, label: "LinkedIn", value: "bennett-m-anderson", href: LINKEDIN_URL },
    { icon: <Github size={18} />, label: "GitHub", value: GITHUB_USER, href: GITHUB_URL },
  ];

  return (
    <div>
      <header className="md-grain" style={{ position: "relative", background: "var(--surface-sunken)", overflow: "hidden", height: 232 }}>
        <StripeBand offset="80px" title="Get in touch" subtitle="Context in the first message, please" />
      </header>

      <main className="md-dapple" style={{ position: "relative", minHeight: "60vh", padding: "var(--space-11) var(--space-9)" }}>
        <div className="md-above" style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-lg)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)" }}>
            Feel free to reach out via email, phone, or LinkedIn. If using phone or email, please provide context in your first
            message or it will likely be ignored.
          </p>

          <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--surface-raised)", boxShadow: "var(--shadow-sm)", padding: "var(--space-2)" }}>
            {rows.map((r, i) => (
              <div
                key={r.label}
                style={{ display: "flex", alignItems: "center", gap: "var(--space-6)", padding: "var(--space-6)", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}
              >
                <span style={{ color: "var(--text-accent)", display: "flex", flex: "0 0 auto" }}>{r.icon}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-faint)", width: 84, flex: "0 0 auto" }}>
                  {r.label}
                </span>
                {r.href ? (
                  <TextLink href={r.href}>{r.value}</TextLink>
                ) : (
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{r.value}</span>
                )}
              </div>
            ))}
          </div>

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
