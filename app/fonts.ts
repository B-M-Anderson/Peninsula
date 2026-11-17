import { Jost, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

// Jost is a geometric sans, chosen to sit with the round B and pointed A cut into the leaf.
export const display = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display-src",
  display: "swap",
});

export const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-src",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-src",
  display: "swap",
});

// In app/layout.tsx:
//   <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
