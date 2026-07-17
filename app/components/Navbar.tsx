"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  // Dark by default (cyber-bio aesthetic); the toggle sets a manual override.
  const [override, setOverride] = useState<boolean | null>(null);
  const dark = override ?? true;

  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();

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

  const linkClass = (href: string) =>
    `font-term transition hover:opacity-80 ${
      pathname === href
        ? "text-bio-green dark:text-phos glow"
        : ""
    }`;

  return (
    <nav
      className={`
        fixed top-0 left-0 w-full z-50
        flex justify-between items-center px-6 py-4
        transition-all duration-400 ease-in-out backdrop-blur-md
        ${hidden ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"}
        bg-bio-bg/90 text-bio-fg
        dark:bg-abyss/90 dark:text-phos-bright
      `}
    >
      <div className="flex items-center gap-3 min-w-0 flex-shrink overflow-hidden">
        {/* Full name on large screens */}
        <span className="hidden lg:block font-term text-xl font-semibold whitespace-nowrap flex-shrink">
          <span className="text-bio-green dark:text-phos glow">bennett@anderson</span>
          <span className="opacity-50">:~$</span>
          <span className="cursor-blink text-bio-green dark:text-phos">▮</span>
        </span>

        {/* Abbreviation on small+medium; hidden on large */}
        <span className="block lg:hidden font-term text-lg font-semibold whitespace-nowrap flex-shrink-0">
          <span className="text-bio-green dark:text-phos glow">BA</span>
          <span className="opacity-50">:~$</span>
        </span>

        {/* Status readout */}
        <span className="font-term text-[11px] opacity-60 pl-3 hidden sm:flex items-center gap-2 whitespace-nowrap flex-shrink overflow-hidden text-ellipsis">
          <span className="inline-block w-2 h-2 rounded-full bg-bio-green dark:bg-phos bio-pulse" />
          {"// corp. security software may limit some features"}
        </span>
      </div>

      {/* Navigation links */}
      <div className="flex gap-4 sm:gap-6 items-center text-base">
        <Link href="/" className={linkClass("/")}>~/home</Link>
        <Link href="/projects" className={linkClass("/projects")}>~/projects</Link>
        <Link href="/ask" className={linkClass("/ask")}>~/ask</Link>
        <Link href="/contact" className={linkClass("/contact")}>~/contact</Link>

        {/* Dark/light toggle */}
        <button
          onClick={() => setOverride(!dark)}
          aria-label="Toggle dark mode"
          className="p-2 rounded-lg hover:bg-bio-surface dark:hover:bg-abyss-surface transition opacity-80 hover:opacity-100"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  );
}
