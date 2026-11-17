import { storageGet } from "./storage";

/* The ground (light or dark) as an external store, shared by the navbar toggle
   and the generated leaf, which is a different plant on each ground. The saved
   override wins; without one the browser's prefers-color-scheme decides. */

export type Theme = "light" | "dark";

export function subscribeTheme(cb: () => void) {
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

export function readTheme(): Theme {
  const saved = storageGet("local", "theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** What the server renders before the visitor's ground is known. */
export const serverTheme = (): Theme => "dark";

/** Browser chrome colour (Android address bar, iOS tab strip) for each ground. */
export const THEME_COLOR: Record<Theme, string> = { dark: "#161B20", light: "#EEEED2" };
