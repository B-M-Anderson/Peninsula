/**
 * Straight quotes and three dots come out of the keyboard; the fonts carry the
 * real marks. Applied to rendered prose only — never to code or URLs.
 */
export function typeset(text: string): string {
  return text
    .replace(/(^|[\s(\[{])"/g, "$1“")
    .replace(/"/g, "”")
    .replace(/(^|[\s(\[{])'/g, "$1‘")
    .replace(/'/g, "’")
    .replace(/\.\.\./g, "…");
}
