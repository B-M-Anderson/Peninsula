"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [dark, setDark] = useState(false);
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();

  // Detect system preference
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(media.matches);

    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // Apply dark/light class to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", dark);
    html.classList.toggle("light", !dark);
  }, [dark]);

  // Scroll-hide behavior for both desktop (panel) and mobile (window)
  useEffect(() => {
    let panel: HTMLElement | null = document.getElementById("scroll-panel");
    let lastY = 0;

    const handleScroll = () => {
      const y = panel ? panel.scrollTop : window.scrollY;

      if (y < 20) {
        setHidden(false);
        lastY = y;
        return;
      }

      if (y > lastY) setHidden(true);
      else setHidden(false);

      lastY = y;
    };

    if (panel) panel.addEventListener("scroll", handleScroll);
    else window.addEventListener("scroll", handleScroll);

    return () => {
      if (panel) panel.removeEventListener("scroll", handleScroll);
      else window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  return (
    <nav
      className={`
        fixed top-0 left-0 w-full z-50
        flex justify-between items-center px-6 py-4
        border-b transition-all duration-400 ease-in-out
        ${hidden ? "opacity-0 -translate-y-full backdrop-blur-md" : "opacity-100 translate-y-0 backdrop-blur-md"}
        ${dark ? "bg-neutral-900 text-white border-neutral-700" : "bg-white text-neutral-900 border-neutral-200"}
      `}
    >
      {/* Branding / title */}
      <h1 className="text-xl font-semibold hidden sm:block">
        Bennett M. Anderson
      </h1>

      {/* Navigation links */}
      <div className="flex gap-6 items-center">
        <Link href="/">Home</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/contact">Contact</Link>

        {/* Dark/light toggle */}
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
