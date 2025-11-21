"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";

export default function Navbar() {
  const [dark, setDark] = useState(false);

  // Detect system preference
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(darkModeMediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    darkModeMediaQuery.addEventListener("change", handler);

    return () => darkModeMediaQuery.removeEventListener("change", handler);
  }, []);

  // Apply class to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
    }
  }, [dark]);

  return (
    <nav
      className={`flex justify-between items-center px-6 py-4 border-b transition-colors duration-300 ${
        dark
          ? "bg-neutral-900 text-white border-neutral-700"
          : "bg-white text-neutral-900 border-neutral-200"
      }`}
    >
      {/* Heading text hidden on small screens */}
      <h1 className="text-xl font-semibold hidden sm:block">
        Hosted on Vercel & Coded in TypeScript
      </h1>

      {/* Nav links + dark/light toggle */}
      <div className="flex gap-6 items-center">
        <Link href="/">Home</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/contact">Contact</Link>

        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-xl border border-neutral-400 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
}
