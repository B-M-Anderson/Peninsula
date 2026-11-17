"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import { lace, monstera } from "../../lib/leaf";
import { readTheme, serverTheme, subscribeTheme, toggleTheme } from "../../lib/theme";
import { MARK_PATHS } from "./markPaths";

/* The seed of the leaf grown for this visit. A store rather than state, so it
   is chosen once on the client (never during the server render, where it would
   not match) and "Grow another" can replace it. 0 means "not chosen yet". */
let visitSeed = 0;
const listeners = new Set<() => void>();
const newSeed = () => 1 + Math.floor(Math.random() * 99998);
function subscribeSeed(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function readSeed() {
  if (!visitSeed) visitSeed = newSeed();
  return visitSeed;
}
function regrow() {
  visitSeed = newSeed();
  listeners.forEach((cb) => cb());
}

const f = (n: number) => Math.round(n * 10) / 10;

/**
 * The generated BA leaf. Every visit grows a new one: a Monstera on the light
 * ground, a Madagascar lace-leaf on the dark one, with the same letters laid
 * out first as whitespace. It is drawn in layers with the page's own colours
 * (leaf, then the holes and letters in the ground colour), so it must sit on
 * the page ground. The server renders the empty stage at the right size; the
 * leaf grows in after hydration (blade from the stem, holes from the base
 * outward, letters last). Reduced motion lands it in its final state.
 *
 * A small caption invites play: click (or tap) grows a new leaf; right-click
 * (or press and hold on a phone) switches the ground, which swaps the plant —
 * the way most visitors find the other half of the site.
 */
export default function LeafLogo() {
  const seed = useSyncExternalStore(subscribeSeed, readSeed, () => 0);
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);
  const dark = theme === "dark";
  const parts = useMemo(() => (seed ? (dark ? lace(seed) : monstera(seed, { orient: "down" })) : null), [seed, dark]);

  const name = dark ? "Lace-leaf" : "Monstera";
  const other = dark ? "daylight" : "night";

  // Press and hold on a touch screen switches the ground (iOS has no right-click).
  const hold = useRef<{ timer: number; fired: boolean }>({ timer: 0, fired: false });
  const endHold = () => window.clearTimeout(hold.current.timer);
  const onPointerDown = (e: React.PointerEvent) => {
    hold.current.fired = false;
    if (e.pointerType !== "touch") return;
    hold.current.timer = window.setTimeout(() => {
      hold.current.fired = true;
      toggleTheme();
    }, 520);
  };
  const onClick = () => {
    if (hold.current.fired) return; // the hold already did its job
    regrow();
  };
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hold.current.fired) return; // Android also fires contextmenu on a long press
    toggleTheme();
  };
  let drawing = null;
  if (parts) {
    const [ox, oy] = parts.origin.map(f);
    const far = Math.max(1, ...parts.cutList.map((c) => Math.hypot(c.x - ox, c.y - oy)));
    const at = `translate(${ox} ${oy})`;
    const back = `translate(${-ox} ${-oy})`;
    drawing = (
      // The key restarts the growth whenever the leaf itself changes.
      <svg key={`${seed}-${theme}`} className="ba-leaf ba-grow" viewBox={parts.vb.join(" ")} aria-hidden focusable="false">
        <g transform={at}>
          <g className="ba-stem">
            <path transform={back} fill="var(--brand)" d={parts.stem} />
          </g>
        </g>
        <g transform={at}>
          <g className="ba-blade">
            <g transform={back}>
              <path fill="var(--brand)" d={parts.leaf} />
              {parts.cutList.map((c, i) => {
                const cx = f(c.x);
                const cy = f(c.y);
                const delay = Math.round(520 + (950 * Math.hypot(c.x - ox, c.y - oy)) / far);
                return (
                  <g key={i} transform={`translate(${cx} ${cy})`}>
                    <g className="ba-cut" style={{ animationDelay: `${delay}ms` }}>
                      <path transform={`translate(${-cx} ${-cy})`} fill="var(--surface-page)" d={c.d} />
                    </g>
                  </g>
                );
              })}
              <path className="ba-letters" fill="var(--surface-page)" d={parts.letters} />
            </g>
          </g>
        </g>
      </svg>
    );
  }

  return (
    <figure className="ba-figure">
    <button
      type="button"
      className="ba-stage"
      data-ground={seed ? theme : undefined}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerUp={endHold}
      onPointerLeave={endHold}
      onPointerCancel={endHold}
      disabled={!seed}
      aria-label={`BA ${name.toLowerCase()} logo. Grow another leaf`}
    >
      {/* A still leaf from the first paint, so the stage is never empty while the
          page's script loads. CSS shows the one for the ground; it fades out as
          the generated leaf grows over it. */}
      {(["monstera", "lace"] as const).map((k) => (
        <svg key={k} className={`ba-ghost ${k === "monstera" ? "ba-mark-light" : "ba-mark-dark"}`} viewBox={MARK_PATHS[k].vb} aria-hidden focusable="false">
          <path fillRule="evenodd" fill="var(--brand)" d={MARK_PATHS[k].body} />
          <path fill="var(--brand)" d={MARK_PATHS[k].stem} />
        </svg>
      ))}
      {drawing}
    </button>
    <figcaption className="ba-caption">
      <span className="md-label">Procedurally generated</span>
      <span className="ba-hint ba-hint-mouse">Click to grow another · right-click for {other}</span>
      <span className="ba-hint ba-hint-touch">Tap to grow another · hold for {other}</span>
      {/* Keyboard users get the switch as a real button. */}
      <button type="button" className="ba-switch md-link" onClick={toggleTheme}>
        Switch to {other}
      </button>
    </figcaption>
    </figure>
  );
}
