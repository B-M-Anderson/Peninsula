"use client";

import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "../components/ui";
import { storageGet, storageSet } from "./storage";

/* A per-page choice between a page's software-styled look ("themed") and its
   plain original ("plain"), kept per visitor. A visitor's own choice always
   wins. With none, phones and forced-colors displays get the plain look — the
   themed ones are laid out for a desktop or tablet — and everything else the
   themed one. The server makes that call from the request (styleServer.ts) so
   the first paint is already right; the client re-checks the real viewport and
   follows it if it changes. Held in memory too, so the switch still works for
   the visit when storage is blocked. */

export type StyleChoice = "themed" | "plain";

/** Viewports the themed looks are not laid out for. */
const COMPACT = "(max-width: 719px), (forced-colors: active)";

const EVENT = "pagestylechange";
const memory: Record<string, StyleChoice> = {};
// Set by the switch, cleared by StyleView once the other look is on screen, so
// only a deliberate switch moves focus — never a swap that follows hydration or a resize.
let switched = false;

function saved(page: string): StyleChoice | null {
  const v = storageGet("local", `style-${page}`);
  return v === "plain" || v === "themed" ? v : null;
}

const read = (page: string): StyleChoice => memory[page] ?? saved(page) ?? (window.matchMedia(COMPACT).matches ? "plain" : "themed");

function subscribe(cb: () => void) {
  const mq = window.matchMedia(COMPACT);
  mq.addEventListener("change", cb);
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    mq.removeEventListener("change", cb);
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** `fallback` is what the server rendered (see serverStyleDefault); the client takes over after hydration. */
export function useStyleChoice(page: string, fallback: StyleChoice = "themed"): [StyleChoice, (v: StyleChoice) => void] {
  // Stable identity, or useSyncExternalStore re-subscribes on every render.
  const snapshot = useCallback(() => read(page), [page]);
  const choice = useSyncExternalStore(subscribe, snapshot, () => fallback);
  const set = (v: StyleChoice) => {
    memory[page] = v;
    storageSet("local", `style-${page}`, v);
    switched = true;
    window.dispatchEvent(new Event(EVENT));
  };
  return [choice, set];
}

/** Shows one of two server-built looks for the same page. */
export function StyleView({ page, themed, plain, serverDefault }: { page: string; themed: ReactNode; plain: ReactNode; serverDefault?: StyleChoice }) {
  const [choice] = useStyleChoice(page, serverDefault);
  // The switch that was clicked unmounts with the old look, so focus would fall
  // to the body. Land on the new look's <main> instead — without scrolling, so a
  // deep-linked row still gets to bring itself into view.
  useEffect(() => {
    if (!switched) return;
    switched = false;
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [choice]);
  return choice === "plain" ? plain : themed;
}

/** The button that flips a page to the other look. */
export function StyleSwitch({ page, to, children }: { page: string; to: StyleChoice; children: ReactNode }) {
  const [, set] = useStyleChoice(page);
  return (
    <Button size="sm" variant="ghost" onClick={() => set(to)}>
      {children}
    </Button>
  );
}
