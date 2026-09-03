"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

/* The disclosure rows: hairline separators, a + marker that rotates into ×,
   panels that open by animating grid-template-rows (see .md-acc-* in
   globals.css). This is the one primitive that owns state, so it is the one
   that hydrates; the rest of ui.tsx renders on the server. */

export type AccordionItem = {
  /** Stable id: element id for deep links, and the key React tracks the row by. */
  id: string;
  title: ReactNode;
  /** One line under the title, shown only while the row is collapsed. */
  subtitle?: ReactNode;
  /** A row of chips (or similar) under the subtitle, also collapsed-only. */
  extra?: ReactNode;
  meta?: ReactNode;
  content: ReactNode;
};

/**
 * Whether the row a component sits in has ever been opened. Media inside a
 * panel reads this so a collapsed row costs nothing to download; the text
 * stays in the HTML regardless, for deep links and crawlers.
 */
const RowOpenContext = createContext(true);
export const useRowOpened = () => useContext(RowOpenContext);

// Location hash as an external store, so a `/projects#slug` link (or a
// back/forward move between hashes) can open the matching row without a
// setState-in-effect. The server snapshot is empty; the client re-reads on
// hydration, which is the documented useSyncExternalStore behaviour.
function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
// Total: a mangled fragment (#%E2) must not throw inside render — it just
// matches no row.
const readHash = () => {
  const raw = window.location.hash.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};
const noHash = () => "";

export function Accordion({
  items,
  defaultOpen,
  syncHash,
}: {
  items: AccordionItem[];
  /** id of the row open on first paint; defaults to none. */
  defaultOpen?: string;
  /** Read #hash on load / hashchange, and write it back as rows open. */
  syncHash?: boolean;
}) {
  const hash = useSyncExternalStore(subscribeHash, syncHash ? readHash : noHash, noHash);
  // A click records the visitor's choice together with the hash it was made
  // under; a later real hash change (an in-page #slug link, back/forward)
  // outranks it, so deep links keep working after the first toggle.
  const [choice, setChoice] = useState<{ hash: string; id: string | null } | undefined>(undefined);
  // The default is latched on first render: re-sorting the list must not hand
  // the open state to whichever row lands first.
  const [initial] = useState(defaultOpen ?? null);
  // Rows that have been open at least once keep their media mounted.
  const [everOpened, setEverOpened] = useState<ReadonlySet<string>>(() => new Set(initial ? [initial] : []));
  const hashOpen = hash && items.some((it) => it.id === hash) ? hash : null;
  const chosen = choice !== undefined && choice.hash === hash;
  const open = chosen ? choice.id : (hashOpen ?? initial);

  // Bring a deep-linked row into view — once now, and again after the panels
  // above it have finished collapsing (0.28s grid transition) — then light it
  // briefly so the arrival reads once the row is actually on screen. The fixed
  // navbar is covered by scroll-margin-top.
  useEffect(() => {
    if (!syncHash || !hashOpen || chosen) return;
    const row = document.getElementById(hashOpen);
    if (!row) return;
    const go = () => row.scrollIntoView({ block: "start" });
    go();
    const done = () => row.classList.remove("md-landed");
    const t = setTimeout(() => {
      go();
      row.classList.add("md-landed");
      row.addEventListener("animationend", done, { once: true });
    }, 340);
    return () => {
      clearTimeout(t);
      row.removeEventListener("animationend", done);
      row.classList.remove("md-landed");
    };
  }, [syncHash, hashOpen, chosen]);

  const toggle = (id: string) => {
    const next = open === id ? null : id;
    // Recorded under the store's current hash: replaceState below doesn't fire
    // hashchange, so the store keeps that value and the choice stays in force.
    setChoice({ hash, id: next });
    if (next && !everOpened.has(next)) setEverOpened((s) => new Set(s).add(next));
    if (syncHash && typeof history !== "undefined") {
      const url = next ? `#${encodeURIComponent(next)}` : window.location.pathname + window.location.search;
      history.replaceState(history.state, "", url);
    }
  };

  return (
    <div>
      {items.map((item) => {
        const isOpen = open === item.id;
        const panelId = `${item.id}-panel`;
        const triggerId = `${item.id}-trigger`;
        return (
          <div key={item.id} id={item.id} className={`md-acc-row${isOpen ? " md-acc-open" : ""}`}>
            <button
              type="button"
              id={triggerId}
              className="md-acc-trigger"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
            >
              <span className="min-w-0" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", flex: "1 1 auto" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
                  {item.title}
                </span>
                {item.subtitle ? <span className="md-acc-sub">{item.subtitle}</span> : null}
                {item.extra ? <span className="md-acc-extra">{item.extra}</span> : null}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
                {item.meta ? (
                  <span className="md-acc-meta" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--text-faint)", whiteSpace: "nowrap" }}>{item.meta}</span>
                ) : null}
                <span className="md-acc-marker" aria-hidden>+</span>
              </span>
            </button>
            <div className="md-acc-panel">
              {/* inert keeps links, buttons and embeds inside a collapsed panel
                  out of the tab order and away from screen readers. */}
              <div id={panelId} role="region" aria-labelledby={triggerId} className="md-acc-inner" inert={!isOpen}>
                <RowOpenContext.Provider value={isOpen || everOpened.has(item.id)}>
                  <div style={{ padding: "0 0 var(--space-7)" }}>{item.content}</div>
                </RowOpenContext.Provider>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
