"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";

export default function Navbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.remove("light");
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
      html.classList.add("light");
    }
  }, [dark]);

  return (
    <nav
      className={`flex justify-between items-center px-8 py-4 border-b transition-colors duration-300 ${
        dark
          ? "bg-neutral-900 text-white border-neutral-700"
          : "bg-white text-neutral-900 border-neutral-200"
      }`}
    >
      <h1 className="text-xl font-semibold">Hosted on Vercel & Coded in TypeScript</h1>

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
