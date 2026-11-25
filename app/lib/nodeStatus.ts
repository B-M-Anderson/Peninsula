import { json, type StatusResponse } from "./api-types";

/* Whether the home desktop behind askB.AI is awake, as an external store so the
   navbar dot, the home tile and anything else can show it without each one
   polling. It reads the same /api/concierge/status the ask page uses, once a
   minute while a tab is visible, and only while something is subscribed. */

export type NodeState =
  | { kind: "unknown" }
  | { kind: "online"; checkedAt: number }
  | { kind: "offline"; checkedAt: number; lastSeenAt: number | null };

const UNKNOWN: NodeState = { kind: "unknown" };
const REFRESH_MS = 60_000;

let snapshot: NodeState = UNKNOWN;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let inFlight = false;

function publish(next: NodeState) {
  const same =
    next.kind === snapshot.kind &&
    (next.kind !== "offline" || (snapshot.kind === "offline" && next.lastSeenAt === snapshot.lastSeenAt)) &&
    (next.kind === "unknown" || (snapshot.kind !== "unknown" && next.checkedAt - snapshot.checkedAt < 1000));
  if (same) return;
  snapshot = next;
  listeners.forEach((l) => l());
}

function load() {
  if (inFlight || document.hidden) return;
  inFlight = true;
  fetch("/api/concierge/status", { cache: "no-store" })
    .then(json<StatusResponse>)
    .then((s) => {
      const checkedAt = Date.now();
      publish(s.online === true ? { kind: "online", checkedAt } : { kind: "offline", checkedAt, lastSeenAt: s.lastSeen?.at ?? null });
    })
    // A failed read says nothing about the desktop, so the last known state stays.
    .catch(() => {})
    .finally(() => {
      inFlight = false;
    });
}

export function subscribeNode(cb: () => void) {
  listeners.add(cb);
  if (listeners.size === 1) {
    load();
    timer = setInterval(load, REFRESH_MS);
    document.addEventListener("visibilitychange", load);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      if (timer) clearInterval(timer);
      timer = null;
      document.removeEventListener("visibilitychange", load);
    }
  };
}

export const readNode = (): NodeState => snapshot;
export const serverNode = (): NodeState => UNKNOWN;
