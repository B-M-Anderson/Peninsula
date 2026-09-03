"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import Mark from "./brand/Mark";
import { SITE_NAME } from "../data/site";

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
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Phone-width store, so the hide-on-scroll behaviour follows the viewport if it
// is resized or rotated rather than whatever it was on first paint.
const PHONE_QUERY = "(max-width: 639px)";
function subscribePhone(cb: () => void) {
  const mq = window.matchMedia(PHONE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const readPhone = () => window.matchMedia(PHONE_QUERY).matches;

export default function Navbar() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark");
  const dark = theme === "dark";
  const phone = useSyncExternalStore(subscribePhone, readPhone, () => false);

  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();

  // Keep the <html> ground class in sync at runtime (toggle or OS change).
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", dark);
    html.classList.toggle("light", !dark);
  }, [dark]);

  // On phones the bar tucks away while scrolling down and returns on the first
  // scroll up, giving the small screen back. Wider viewports keep it pinned.
  useEffect(() => {
    if (!phone) {
      setHidden(false);
      return;
    }
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // Ignore tiny jitters (rubber-banding, address-bar resize) so the bar
        // doesn't flicker.
        if (y < 20) setHidden(false);
        else if (Math.abs(y - lastY) > 6) setHidden(y > lastY);
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phone, pathname]);

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
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${
        hidden ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100 translate-y-0"
      }`}
      style={{
        background: "color-mix(in srgb, var(--surface-page) 88%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border-subtle)",
        color: "var(--text-body)",
      }}
    >
      <nav aria-label="Primary" className="flex justify-between items-center gap-3 px-4 sm:px-6 py-2.5">
        {/* Left: mark + name */}
        <Link href="/" className="flex items-center gap-2.5 min-w-0 flex-shrink-0 rounded-sm" aria-label={`${SITE_NAME} — home`}>
          <Mark variant="favicon" size={26} tone={dark ? "dark" : "light"} />
          <span
            className="hidden sm:block whitespace-nowrap"
            style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", letterSpacing: "-0.015em", color: "var(--text-strong)" }}
          >
            {SITE_NAME}
          </span>
        </Link>

        {/* Links + toggle. On narrow screens the links scroll horizontally between
            the pinned identity (left) and the toggle (right). */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <ul className="flex gap-1 sm:gap-2 items-center overflow-x-auto no-scrollbar min-w-0 m-0 p-0 list-none" style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)" }}>
            {links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <li key={href} className="flex-shrink-0">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className="block whitespace-nowrap px-2 py-2 transition-colors rounded-sm"
                    style={{
                      color: active ? "var(--text-strong)" : "var(--text-muted)",
                      boxShadow: active ? "inset 0 -1.5px 0 var(--text-accent)" : undefined,
                    }}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Ground toggle — overrides the browser preference; always pinned */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? "Switch to the light ground" : "Switch to the dark ground"}
            title={dark ? "Light ground" : "Dark ground"}
            className="flex-shrink-0 grid place-items-center transition-colors"
            style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", color: "var(--text-muted)" }}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
