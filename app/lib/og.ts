import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "../data/site";

/**
 * Open Graph for one page. Next replaces a layout's `openGraph` wholesale
 * rather than merging it, so every page builds its own from this and adds the
 * URL that matches its canonical.
 */
export function openGraphFor(path: string, description: string = SITE_DESCRIPTION): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: path,
    description,
  };
}
