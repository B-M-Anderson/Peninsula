import type { Metadata, Viewport } from "next";
import "./globals.css";
import { display, body, mono } from "./fonts";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SkipLink from "./components/SkipLink";
import VaultGate from "./components/VaultGate";
import { Analytics } from "@vercel/analytics/next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, X_HANDLE } from "./data/site";

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
    { media: "(prefers-color-scheme: light)", color: "#FAF4E9" },
    { media: "(prefers-color-scheme: dark)", color: "#3A2412" },
  ],
};

// Runs before paint: pick the ground from a saved override, else the browser's
// prefers-color-scheme. Keeps the class (and the browser-chrome colour) in sync
// before React hydrates so there's no flash of the wrong theme.
const themeInit = `(function(){try{var s=localStorage.getItem('theme');var d=(s==='dark'||s==='light')?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var c=document.documentElement.classList;c.toggle('dark',d);c.toggle('light',!d);var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++){m[i].content=d?'#3A2412':'#FAF4E9';}}catch(e){}})();`;

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
        </VaultGate>
        <Analytics />
      </body>
    </html>
  );
}
