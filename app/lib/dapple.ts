// The dappling at the foot of every page (.md-dapple::after in globals.css):
// a field of small dots scattered at random, so there is no tile and no
// pattern to spot. Served as its own image at /dapple.svg (app/dapple.svg/
// route.ts), freshly drawn for every request and never cached, so each page
// load gets a new field without adding a byte to the page's HTML. The CSS uses
// it as a mask over --dapple-color (which follows the theme) and fades it out
// upward.

/** One strip, repeated sideways: wider than most screens, so a repeat is rarely on screen at all. */
export const DAPPLE_WIDTH = 1800;
const HEIGHT = 128;
const DOTS = 620;

const n = (x: number) => (Math.round(x * 10) / 10).toString();

export function dappleSvg(): string {
  let dots = "";
  for (let i = 0; i < DOTS; i++) {
    const x = Math.round(Math.random() * DAPPLE_WIDTH);
    // Denser toward the bottom edge: a uniform draw raised to a power piles up near 0.
    const y = Math.round(HEIGHT * (1 - Math.random() ** 1.6));
    const r = 0.9 + Math.random() ** 2 * 1.9;
    // About a third are ovals, stretched either way.
    const oval = Math.random() < 0.35;
    const k = 0.7 + Math.random() * 0.25;
    const tall = Math.random() < 0.5;
    dots += oval
      ? `<ellipse cx="${x}" cy="${y}" rx="${n(tall ? r * k : r)}" ry="${n(tall ? r : r * k)}"/>`
      : `<circle cx="${x}" cy="${y}" r="${n(r)}"/>`;
  }
  // viewBox + preserveAspectRatio="none": stretched to whatever height the strip is on each page.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${DAPPLE_WIDTH}" height="${HEIGHT}" viewBox="0 0 ${DAPPLE_WIDTH} ${HEIGHT}" preserveAspectRatio="none">${dots}</svg>`;
}
