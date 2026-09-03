// Web Storage can throw on access (Firefox "block all cookies", Safari with
// storage blocked, some embedded webviews). These never throw; they answer
// null / do nothing instead, so a blocked store degrades to "no preference".

export function storageGet(kind: "local" | "session", key: string): string | null {
  try {
    return window[kind === "local" ? "localStorage" : "sessionStorage"].getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(kind: "local" | "session", key: string, value: string): void {
  try {
    window[kind === "local" ? "localStorage" : "sessionStorage"].setItem(key, value);
  } catch {
    /* storage blocked — the preference just won't persist */
  }
}
