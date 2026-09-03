import { ImageResponse } from "next/og";
import { Monogram } from "./components/brand/MonogramOg";

// PNG favicon fallback for browsers that ignore SVG icons (older Safari, some
// bookmark/tab-strip renderers). Same monogram as public/ba-favicon.svg.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<Monogram px={64} />, size);
}
