// layout.tsx
"use client";

import { useState } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "B. Anderson",
  description: "Personal portfolio of B. Anderson",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [dark, setDark] = useState(false);

  return (
    <html lang="en" className={dark ? "dark" : ""}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${
          dark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        } min-h-screen transition-colors duration-300`}
      >
        <nav className="flex justify-between items-center px-8 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold">B. Anderson</h1>
          <div className="flex gap-6 items-center">
            <Link href="/">Home</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/contact">Contact</Link>
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-xl border border-gray-300 dark:border-gray-700"
            >
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
