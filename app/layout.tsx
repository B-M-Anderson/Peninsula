import type { Metadata, Viewport } from "next";
import "./globals.css";
import { display, body, mono } from "./fonts";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SkipLink from "./components/SkipLink";
import VaultGate from "./components/VaultGate";
import CommandPalette, { type PaletteLink } from "./components/CommandPalette";
import { statusLabel } from "./components/ui";
import { projectSlug, publishedProjects, statusOf, summaryOf } from "./data/projects";
import type { CmdRow } from "./lib/commands";
import { Analytics } from "@vercel/analytics/next";
import { CONTACT_MAILTO, GITHUB_URL, LINKEDIN_URL, RESUME_PATH, SITE_DESCRIPTION, SITE_NAME, SITE_URL, SUBSTACK_URL, X_HANDLE, X_URL, YOUTUBE_URL } from "./data/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  // No title/url here on purpose: each page's own title and canonical flow
  // into the card, so a shared /projects link says "Projects · Bennett…".
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    creator: `@${X_HANDLE}`,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EEEED2" },
    { media: "(prefers-color-scheme: dark)", color: "#161B20" },
  ],
};

// Runs before paint: pick the ground from a saved override, else the browser's
// prefers-color-scheme. Keeps the class (and the browser-chrome colour) in sync
// before React hydrates so there's no flash of the wrong theme.
const themeInit = `(function(){try{var s=localStorage.getItem('theme');var d=(s==='dark'||s==='light')?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var c=document.documentElement.classList;c.toggle('dark',d);c.toggle('light',!d);var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++){m[i].content=d?'#161B20':'#EEEED2';}}catch(e){}})();`;

// What the command prompt can reach. Built here, on the server, so the projects
// data module never enters a client bundle.
const shortDate = (d: string) => {
  const ms = new Date(d).getTime();
  return ms ? new Date(ms).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
};
const paletteRows: CmdRow[] = publishedProjects.map((p) => {
  const status = statusOf(p);
  const id = projectSlug(p);
  const vars = [
    { name: "updated", value: `"${p.date}"` },
    { name: "status", value: `"${statusLabel[status]}"` },
  ];
  if (p.completion !== undefined) vars.push({ name: "completion", value: String(p.completion) });
  if (p.aiUsage !== undefined) vars.push({ name: "estAiUsage", value: String(p.aiUsage) });
  vars.push({ name: "skills", value: `1×${p.skills.length} string` });
  return { id, name: p.title, file: `${id}.mlx`, dateShort: shortDate(p.date), statusText: statusLabel[status], summary: summaryOf(p), skills: p.skills, vars, githubUrl: p.githubUrl, videoUrl: p.videoUrl };
});
const paletteLinks: PaletteLink[] = [
  { label: "Home", href: "/", group: "Pages" },
  { label: "Projects", href: "/projects", group: "Pages", keywords: "work builds" },
  { label: "Posts", href: "/posts", group: "Pages", keywords: "writing video activity youtube substack" },
  { label: "About", href: "/about", group: "Pages", keywords: "skills penrose now looking for" },
  { label: "askB.AI", href: "/ask", group: "Pages", keywords: "ask question concierge" },
  { label: "Contact", href: "/contact", group: "Pages", keywords: "email phone" },
  { label: "Resume (PDF)", href: RESUME_PATH, group: "Links", keywords: "cv" },
  { label: "GitHub", href: GITHUB_URL, group: "Links" },
  { label: "LinkedIn", href: LINKEDIN_URL, group: "Links" },
  ...(YOUTUBE_URL ? [{ label: "YouTube", href: YOUTUBE_URL, group: "Links" as const }] : []),
  ...(SUBSTACK_URL ? [{ label: "Substack", href: SUBSTACK_URL, group: "Links" as const }] : []),
  ...(X_URL ? [{ label: "X", href: X_URL, group: "Links" as const }] : []),
  { label: "Email", href: CONTACT_MAILTO, group: "Links", keywords: "mail" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <VaultGate>
          <SkipLink />
          <Navbar />
          {/* No global padding and no landmark here — each page owns its own
              <main id="main"> (the skip-link target) and its own gutters. */}
          {children}
          <Footer />
          <CommandPalette rows={paletteRows} links={paletteLinks} />
        </VaultGate>
        <Analytics />
      </body>
    </html>
  );
}
