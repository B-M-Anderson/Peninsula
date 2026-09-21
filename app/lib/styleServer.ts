import { headers } from "next/headers";
import type { StyleChoice } from "./stylePref";

/**
 * Which look to render first for this request: the plain one for phones (the
 * themed looks are laid out for a desktop or tablet), the themed one otherwise.
 * Reads the request, so pages that call it render per request. The client
 * re-checks the real viewport after hydration and a visitor's saved choice
 * overrides this either way (see stylePref.tsx). Tablets say "?0" / carry no
 * "Mobi", so they get the themed look, which is laid out for them.
 */
export async function serverStyleDefault(): Promise<StyleChoice> {
  const h = await headers();
  if (h.get("sec-ch-ua-mobile") === "?1") return "plain";
  return /iPhone|iPod|Mobi/i.test(h.get("user-agent") ?? "") ? "plain" : "themed";
}
