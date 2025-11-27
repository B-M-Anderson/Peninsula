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

  // Scroll-hide behavior
  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    let lastY = 0;

    const getY = () => {
      if (isMobile) return window.scrollY;
      const panel = document.getElementById("scroll-panel");
      return panel?.scrollTop ?? 0;
    };

    const handleScroll = () => {
      const y = getY();
      if (y < 20) {
        setHidden(false);
        lastY = y;
        return;
      }
      if (y > lastY) setHidden(true);
      else setHidden(false);
      lastY = y;
    };

    if (isMobile) window.addEventListener("scroll", handleScroll);
    else document.getElementById("scroll-panel")?.addEventListener("scroll", handleScroll);

    return () => {
      if (isMobile) window.removeEventListener("scroll", handleScroll);
      else document.getElementById("scroll-panel")?.removeEventListener("scroll", handleScroll);
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
<div className="flex items-center gap-3 min-w-0 flex-shrink overflow-hidden">

  {/* Full name on large screens */}
  <span className="hidden lg:block text-2xl font-semibold whitespace-nowrap flex-shrink">
    Bennett M. Anderson
  </span>

  {/* Abbreviation on small+medium; hidden on large */}
  <span className="block lg:hidden text-xl font-semibold whitespace-nowrap flex-shrink-0">
    BA
  </span>

  {/* Company software note */}
  <span
    className={`
      text-xs font-thin opacity-70 pl-3
      hidden sm:block
      whitespace-normal
      flex-shrink
      overflow-hidden
      text-ellipsis
      ${dark ? "text-neutral-400" : "text-neutral-600"}
    `}
    style={{ maxWidth: "100%" }}
  >
    NOTE: Company security softwares may limit or block functionality.
  </span>
</div>

      {/* Navigation links */}
      <div className="flex gap-4 sm:gap-6 items-center text-lg font-medium">
        <Link href="/" className="hover:opacity-80 transition">Home</Link>
        <Link href="/projects" className="hover:opacity-80 transition">Projects</Link>
        <Link href="/contact" className="hover:opacity-80 transition">Contact</Link>

        {/* Dark/light toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="p-2.5 rounded-lg border border-neutral-400 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
}
