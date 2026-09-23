// The dappling at the foot of every page (.md-dapple::after in globals.css):
// a field of small dots scattered at random, drawn fresh each time a page is
// rendered, so there is no tile and no pattern to spot. It is emitted as an SVG
// mask in the --dapple-dots custom property by the root layout; the CSS colours
// it (--dapple-color, which follows the theme) and fades it out upward.
//
// Static pages get a new field whenever they are regenerated; per-request pages
// get one on every load. Server-only: the numbers are never re-rolled in the
// browser, so hydration never sees a different field.

/** One strip, repeated sideways: wider than most screens, so a repeat is rarely on screen at all. */
const WIDTH = 1800;
const HEIGHT = 128;
const DOTS = 620;

const n = (x: number) => (Math.round(x * 10) / 10).toString();

export function dappleField(): string {
  let dots = "";
  for (let i = 0; i < DOTS; i++) {
    const x = Math.random() * WIDTH;
    // Denser toward the bottom edge: squaring a uniform draw piles values near 0.
    const y = HEIGHT * (1 - Math.random() ** 1.6);
    const r = 0.9 + Math.random() ** 2 * 1.9;
    // About a third are ovals, stretched either way.
    const oval = Math.random() < 0.35;
    const k = 0.7 + Math.random() * 0.25;
    dots += oval
      ? Math.random() < 0.5
        ? `%3Cellipse cx='${n(x)}' cy='${n(y)}' rx='${n(r)}' ry='${n(r * k)}'/%3E`
        : `%3Cellipse cx='${n(x)}' cy='${n(y)}' rx='${n(r * k)}' ry='${n(r)}'/%3E`
      : `%3Ccircle cx='${n(x)}' cy='${n(y)}' r='${n(r)}'/%3E`;
  }
  // Single quotes inside, %3C/%3E for the brackets: the whole thing sits in a double-quoted url().
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${WIDTH}' height='${HEIGHT}'%3E${dots}%3C/svg%3E")`;
}

export const DAPPLE_WIDTH = WIDTH;
