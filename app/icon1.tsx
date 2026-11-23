import { ImageResponse } from "next/og";
import { LeafGlyph, TILE } from "./components/brand/LeafTile";

// PNG favicon fallback for browsers that ignore SVG icons (older Safari, some
// bookmark/tab-strip renderers). Same leaf as app/icon0.svg.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: TILE.ground, borderRadius: 12 }}>
        <LeafGlyph height={58} />
      </div>
    ),
    size
  );
}
