"use client";

import { useSyncExternalStore } from "react";
import { CONCIERGE } from "../data/site";
import { readNode, serverNode, subscribeNode } from "../lib/nodeStatus";
import { ago } from "../lib/ago";

/** The state as words, for screen readers and the tooltip. */
function words(n: ReturnType<typeof readNode>): string {
  if (n.kind === "online") return `${CONCIERGE.label} is online`;
  if (n.kind === "offline") return `${CONCIERGE.label} is offline: the home desktop that runs it is off or asleep`;
  return "";
}

/** A small light beside a link: filled green when the desktop is awake, an amber ring when it is not. Renders nothing until the first reading. */
export function NodeDot({ withLabel = false }: { withLabel?: boolean }) {
  const n = useSyncExternalStore(subscribeNode, readNode, serverNode);
  if (n.kind === "unknown") return null;
  const on = n.kind === "online";
  return (
    <span className="node-status" data-on={on ? "" : undefined} title={words(n)}>
      <span className="node-dot" aria-hidden />
      {withLabel && !on ? <span className="node-off-label" aria-hidden>offline</span> : null}
      <span className="sr-only">{on ? " (online)" : " (offline)"}</span>
    </span>
  );
}

/** One line for the home tile: whether the desktop is on, and when it was last seen if it is not. */
export function NodeStatusLine() {
  const n = useSyncExternalStore(subscribeNode, readNode, serverNode);
  // The line's height is reserved so the tile does not jump when the reading arrives.
  return (
    <p className="node-line" aria-live="polite" data-state={n.kind}>
      {n.kind === "unknown" ? null : (
        <>
          <span className="node-status" data-on={n.kind === "online" ? "" : undefined}>
            <span className="node-dot" aria-hidden />
          </span>
          {n.kind === "online"
            ? "The desktop is on. Questions get answered."
            : `The desktop is off${n.lastSeenAt ? `, last seen ${ago(n.lastSeenAt, n.checkedAt)}` : ""}. A question will wait a moment, then give up.`}
        </>
      )}
    </p>
  );
}
