import { ImageResponse } from "next/og";
import { Monogram } from "./components/brand/MonogramOg";

// Home-screen icon for iOS/iPadOS. Apple ignores SVG icons and composites its
// own corner radius, so this is a full-bleed brown tile with the monogram.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#2A190D" }}>
        <Monogram px={150} />
      </div>
    ),
    size
  );
}
