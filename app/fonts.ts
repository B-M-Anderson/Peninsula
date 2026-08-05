import { Newsreader, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

export const display = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display-src",
  display: "swap",
});

export const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
