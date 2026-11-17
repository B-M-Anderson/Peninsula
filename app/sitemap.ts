import type { MetadataRoute } from "next";
import { SITE_URL } from "./data/site";
import { projectSlug, publishedProjects } from "./data/projects";

// The public pages. /vault and /darkroom are deliberately absent (both are
// noindex); API routes aren't pages. Served at /sitemap.xml.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/projects", "/posts", "/about", "/ask", "/contact", ...publishedProjects.map((p) => `/projects/${projectSlug(p)}`)];
  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
