import type { Metadata } from "next";
import "./globals.css";
import { display, body, mono } from "./fonts";
import Navbar from "./components/Navbar";
import VaultGate from "./components/VaultGate";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "B. A.",
  description: "Personal portfolio of B. Anderson",
  icons: {
    icon: "/ba-favicon.svg",
  },
};

// Runs before paint: pick the ground from a saved override, else the browser's
// prefers-color-scheme. Keeps the class in sync before React hydrates so there's
// no flash of the wrong theme.
const themeInit = `(function(){try{var s=localStorage.getItem('theme');var d=(s==='dark'||s==='light')?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var c=document.documentElement.classList;c.toggle('dark',d);c.toggle('light',!d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`overflow-x-hidden ${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="min-h-screen overflow-x-hidden transition-colors duration-300">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <VaultGate>
          <Navbar />
          {/* no global padding — each page owns its own; the homepage needs true
              full-viewport height so it doesn't create a second scrollbar */}
          <main>{children}</main>
        </VaultGate>
        <Analytics />
      </body>
    </html>
  );
}
