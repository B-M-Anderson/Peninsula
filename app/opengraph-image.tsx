import { ImageResponse } from "next/og";
import { LeafGlyph, TILE } from "./components/brand/LeafTile";
import { SITE_NAME, SITE_TAGLINE } from "./data/site";

// Social-share card: the leaf beside the name on the beige ground. Generated at
// build time; linked from the root metadata.
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 64, padding: "0 96px", background: TILE.ground }}>
        <LeafGlyph height={430} />
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 76, fontWeight: 500, letterSpacing: -1.5, color: TILE.ink }}>{SITE_NAME}</div>
          <div style={{ fontSize: 34, color: TILE.muted }}>{SITE_TAGLINE}</div>
          <div style={{ marginTop: 24, fontSize: 24, letterSpacing: 3, textTransform: "uppercase", color: TILE.leaf }}>bennett-anderson.com</div>
        </div>
      </div>
    ),
    size
  );
}
