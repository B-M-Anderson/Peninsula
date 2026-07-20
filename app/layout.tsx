import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import VaultGate from "./components/VaultGate";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "B. A.",
  description: "Personal portfolio of B. Anderson",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className="min-h-screen overflow-x-hidden transition-colors duration-300 scanlines">
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
