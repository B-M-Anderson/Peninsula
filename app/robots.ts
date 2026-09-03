import type { MetadataRoute } from "next";
import { SITE_URL } from "./data/site";

// Served at /robots.txt. The hidden pages are kept crawlable so their noindex
// meta tag is actually seen; only the JSON endpoints are disallowed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
