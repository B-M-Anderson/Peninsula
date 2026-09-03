import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "./data/site";

// Social-share card: the two-band motif on the brown ground, same tokens as
// globals.css. Generated at build time; linked from the root metadata.
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#2A190D",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 218,
            height: 150,
            background: "#D3B68A",
            display: "flex",
            alignItems: "center",
            paddingLeft: 96,
            color: "#2A190D",
            fontSize: 86,
            fontWeight: 500,
            letterSpacing: -2,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 392,
            height: 72,
            background: "#BE9E70",
            display: "flex",
            alignItems: "center",
            paddingLeft: 96,
            color: "#2A190D",
            fontSize: 34,
            fontWeight: 500,
          }}
        >
          {SITE_TAGLINE}
        </div>
        <div
          style={{
            position: "absolute",
            left: 96,
            bottom: 56,
            display: "flex",
            color: "#D3B68A",
            fontSize: 28,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          bennettanderson.com
        </div>
      </div>
    ),
    size
  );
}
