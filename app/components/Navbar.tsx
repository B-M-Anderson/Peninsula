"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [dark, setDark] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Track route changes
  const pathname = usePathname();

  // Detect system preference
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(media.matches);

    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // Apply class to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", dark);
    html.classList.toggle("light", !dark);
  }, [dark]);

  // Scroll-hide behavior that reconnects on every route change
  useEffect(() => {
    let panel: HTMLElement | null = null;
    let lastY = 0;

    const attach = () => {
      panel = document.getElementById("scroll-panel");
      if (!panel) {
        // Try again shortly (needed because page renders async)
        setTimeout(attach, 50);
        return;
      }

      const handleScroll = () => {
        const y = panel!.scrollTop;

        if (y < 20) {
          setHidden(false);
          lastY = y;
          return;
        }

        if (y > lastY) setHidden(true);
        else setHidden(false);

        lastY = y;
      };

      panel.addEventListener("scroll", handleScroll);

      return () => {
        panel?.removeEventListener("scroll", handleScroll);
      };
    };

    const cleanup = attach();

    return cleanup;
  }, [pathname]); // rerun every time the page changes

  return (
    <nav
  className={`
    fixed top-0 left-0 w-full z-50 
    flex justify-between items-center px-6 py-4 
    border-b transition-all duration-400 ease-in-out

    ${hidden 
      ? "opacity-0 -translate-y-full backdrop-blur-md" 
      : "opacity-100 translate-y-0 backdrop-blur-5"
    }

    ${
      dark
        ? "bg-neutral-900 text-white border-neutral-700"
        : "bg-white text-neutral-900 border-neutral-200"
    }
  `}
>


      <h1 className="text-xl font-semibold hidden sm:block">
        Bennett M. Anderson 
              </h1>

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
