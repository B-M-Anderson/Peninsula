import { timingSafeEqual } from "crypto";

/** Constant-time comparison for codes and passphrases (server only). */
export function sameSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
