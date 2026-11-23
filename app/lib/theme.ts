import { storageGet, storageSet } from "./storage";

/* The ground (light or dark) as an external store, shared by the navbar toggle
   and the generated leaf, which is a different plant on each ground. Every
   visitor starts on the light ground (the Monstera brand); once they switch,
   the choice is saved and the site never flips on them by itself, whatever the
   system setting does. */

export type Theme = "light" | "dark";

export function subscribeTheme(cb: () => void) {
  window.addEventListener("themechange", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("themechange", cb);
    window.removeEventListener("storage", cb);
  };
}

export function readTheme(): Theme {
  return storageGet("local", "theme") === "dark" ? "dark" : "light";
}

/** What the server renders before the visitor's ground is known. */
export const serverTheme = (): Theme => "light";

/** Browser chrome colour (Android address bar, iOS tab strip) for each ground. */
export const THEME_COLOR: Record<Theme, string> = { dark: "#161B20", light: "#EEEED2" };

/** Flip the ground and remember the choice (the navbar button and the leaf both use this). */
export function toggleTheme() {
  storageSet("local", "theme", readTheme() === "dark" ? "light" : "dark");
  window.dispatchEvent(new Event("themechange"));
}
