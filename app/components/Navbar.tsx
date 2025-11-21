"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [dark, setDark] = useState(false);

  return (
    <nav
      className={`flex justify-between items-center px-8 py-4 border-b transition-colors duration-300 ${
        dark ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"
      }`}
    >
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
  );
}
