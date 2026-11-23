import { MARK_PATHS } from "./markPaths";

/**
 * The Monstera mark as plain elements for next/og (favicons, the home-screen
 * icon, the share card), which render outside the page and so cannot use the
 * theme's CSS variables. Beige ground, chess-green leaf, letters cut through.
 */
export const TILE = { ground: "#EEEED2", leaf: "#5E8040", ink: "#1E2A17", muted: "#4B5A3D" } as const;

export function LeafGlyph({ height, color = TILE.leaf }: { height: number; color?: string }) {
  const m = MARK_PATHS.monstera;
  const [, , w, h] = m.vb.split(" ").map(Number);
  return (
    <svg width={Math.round((height * w) / h)} height={height} viewBox={m.vb}>
      <path fillRule="evenodd" fill={color} d={m.body} />
      <path fill={color} d={m.stem} />
    </svg>
  );
}
