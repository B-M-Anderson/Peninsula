import { ImageResponse } from "next/og";

// PNG favicon fallback for browsers that ignore SVG icons (older Safari, some
// bookmark/tab-strip renderers). Same monogram as public/ba-favicon.svg.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<Monogram px={64} />, size);
}

export function Monogram({ px }: { px: number }) {
  // Everything scales from the 120-unit design grid of the SVG.
  const u = px / 120;
  const letters = (color: string) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: px,
        height: px,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        fontSize: 58 * u,
        fontWeight: 700,
        letterSpacing: -1.5 * u,
        lineHeight: 1,
        paddingBottom: 4 * u,
      }}
    >
      BA
    </div>
  );
  return (
    <div style={{ width: px, height: px, display: "flex", position: "relative", background: "transparent" }}>
      <div
        style={{
          position: "absolute",
          left: 8 * u,
          top: 8 * u,
          width: 104 * u,
          height: 104 * u,
          borderRadius: "50%",
          background: "#2A190D",
          border: `${5 * u}px solid #D3B68A`,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: 32 * u, height: 26 * u, background: "#D3B68A", display: "flex" }} />
      </div>
      {letters("#F5EBDA")}
      <div style={{ position: "absolute", left: 0, top: 40 * u, width: px, height: 26 * u, overflow: "hidden", display: "flex" }}>
        <div style={{ position: "absolute", left: 0, top: -40 * u, width: px, height: px, display: "flex" }}>{letters("#2A190D")}</div>
      </div>
    </div>
  );
}
