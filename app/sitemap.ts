import type { MetadataRoute } from "next";
import { SITE_URL } from "./data/site";

// The public pages. /vault and /darkroom are deliberately absent (both are
// noindex); API routes aren't pages. Served at /sitemap.xml.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/projects", "/ask", "/contact"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
