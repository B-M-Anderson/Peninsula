"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import Mark from "./brand/Mark";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/ask", label: "Ask" },
  { href: "/contact", label: "Contact" },
];

// Theme store: the effective ground follows a saved override, or the browser's
// prefers-color-scheme when there's no override.
function subscribeTheme(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  window.addEventListener("themechange", cb);
  window.addEventListener("storage", cb);
  return () => {
    mq.removeEventListener("change", cb);
    window.removeEventListener("themechange", cb);
    window.removeEventListener("storage", cb);
  };
}

function readTheme(): "light" | "dark" {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function Navbar() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark");
  const dark = theme === "dark";

  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();

  // Keep the <html> ground class in sync at runtime (toggle or OS change).
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

  // Toggle sets an explicit override (persisted); clearing it would fall back to
  // the browser preference again.
  const toggleTheme = () => {
    const next = dark ? "light" : "dark";
    try {
      localStorage.setItem("theme", next);
    } catch {}
    window.dispatchEvent(new Event("themechange"));
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 flex justify-between items-center gap-3 px-4 sm:px-6 py-3 transition-all duration-300 ease-in-out ${
        hidden ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"
      }`}
      style={{
        background: "color-mix(in srgb, var(--surface-page) 88%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border-subtle)",
        color: "var(--text-body)",
      }}
    >
      {/* Left: mark + name */}
      <Link href="/" className="flex items-center gap-2.5 min-w-0 flex-shrink-0" aria-label="Home">
        <Mark variant="favicon" size={26} tone={dark ? "dark" : "light"} />
        <span
          className="hidden sm:block whitespace-nowrap"
          style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", letterSpacing: "-0.015em", color: "var(--text-strong)" }}
        >
          Bennett M. Anderson
        </span>
      </Link>

      {/* Links + toggle. On narrow screens the links scroll horizontally between
          the pinned identity (left) and the toggle (right). */}
      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
        <div className="flex gap-4 sm:gap-6 items-center overflow-x-auto no-scrollbar min-w-0" style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)" }}>
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap flex-shrink-0 pb-0.5 transition-colors"
                style={{
                  color: active ? "var(--text-strong)" : "var(--text-muted)",
                  borderBottom: active ? "1.5px solid var(--text-accent)" : "1.5px solid transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Ground toggle — overrides the browser preference; always pinned */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle light and dark ground"
          className="flex-shrink-0 p-2 transition-colors"
          style={{ borderRadius: "var(--radius-sm)", color: "var(--text-muted)" }}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </nav>
  );
}
