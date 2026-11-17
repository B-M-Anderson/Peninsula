import { MARK_PATHS } from "./markPaths";

/**
 * The small BA leaf: a Monstera on the light ground, a lace-leaf on the dark one.
 * Both are in the markup and CSS shows the one for the current ground
 * (.ba-mark in globals.css), so the mark follows html.light / html.dark with no
 * JavaScript and never flips after hydration. The shapes are baked from the leaf
 * generator (app/lib/baLeafCore.js) at plain detail; the big generated leaf on
 * the homepage is LeafLogo.
 */
export default function Mark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span className={`ba-mark${className ? ` ${className}` : ""}`} aria-hidden style={{ height: size }}>
      {(["monstera", "lace"] as const).map((k) => (
        <svg key={k} className={k === "monstera" ? "ba-mark-light" : "ba-mark-dark"} viewBox={MARK_PATHS[k].vb} height={size} focusable="false">
          <path fillRule="evenodd" fill="var(--brand)" d={MARK_PATHS[k].body} />
          <path fill="var(--brand)" d={MARK_PATHS[k].stem} />
        </svg>
      ))}
    </span>
  );
}
