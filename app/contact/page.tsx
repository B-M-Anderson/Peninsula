import type { Metadata } from "next";
import PageFrame from "../components/PageFrame";
import PlasmidContact, { type Feature } from "./PlasmidContact";
import { openGraphFor } from "../lib/og";
import { CONTACT_EMAIL, CONTACT_MAILTO, CONTACT_PHONE, CONTACT_PHONE_TEL, LINKEDIN_URL, GITHUB_URL, GITHUB_USER, RESUME_META, RESUME_PATH } from "../data/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email, phone, LinkedIn and GitHub for Bennett M. Anderson.",
  alternates: { canonical: "/contact" },
  openGraph: openGraphFor("/contact", "How to reach me: email, phone, LinkedIn, and the resume."),
};

type Row = { key: Feature["key"]; label: string; value: string; href?: string; rel?: string; copy?: string; newTab?: boolean };

/** The handle shown for a profile URL, derived so it can't drift from the link. */
function handleOf(url: string): string {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() ?? url;
  } catch {
    return url;
  }
}

/* The page's words. */
const NOTE = "Context in the first message, please";
const LEDE = <>Email, phone or LinkedIn all work. Say what it&rsquo;s about in your first message, or it will likely be ignored.</>;

export default function ContactPage() {
  const rows: Row[] = [
    { key: "email", label: "Email", value: CONTACT_EMAIL, href: CONTACT_MAILTO, copy: CONTACT_EMAIL },
    { key: "phone", label: "Phone", value: CONTACT_PHONE, href: `tel:${CONTACT_PHONE_TEL}` },
    { key: "linkedin", label: "LinkedIn", value: handleOf(LINKEDIN_URL), href: LINKEDIN_URL, rel: "me" },
    { key: "github", label: "GitHub", value: GITHUB_USER, href: GITHUB_URL, rel: "me" },
    { key: "resume", label: "Resume", value: `PDF · ${RESUME_META.pages} page · ${RESUME_META.updated}`, href: RESUME_PATH, newTab: true },
  ];

  const spans: Record<Feature["key"], [number, number]> = { email: [8, 62], phone: [84, 124], linkedin: [146, 214], github: [236, 300], resume: [322, 346] };
  const features: Feature[] = rows.map((r) => ({ key: r.key, label: r.label, value: r.value, href: r.href, rel: r.rel, copy: r.copy, newTab: r.newTab, span: spans[r.key] }));

  return (
    <PageFrame title="Get in touch" subtitle={NOTE} minHeight="60vh">
      <PlasmidContact features={features} lede={LEDE} />
    </PageFrame>
  );
}
