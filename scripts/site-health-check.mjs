// Read-only maintenance check: verifies every thumbnailUrl/imageUrl referenced in
// app/data/projects.ts resolves to a real file in public/, flags sitemap drift
// against the freshly-built output, and cross-checks live GitHub repo thumbnails.
// Run by .github/workflows/site-maintenance.yml — never writes back to the repo.
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

let hasIssues = false;

const projectsSrc = readFileSync("app/data/projects.ts", "utf8");
const urlFieldPattern = /(thumbnailUrl|imageUrl)\s*:\s*"([^"]+)"/g;
const referenced = new Set();
let match;
while ((match = urlFieldPattern.exec(projectsSrc))) {
  referenced.add(match[2]);
}

const missing = [...referenced].filter(
  (url) => url.startsWith("/") && !existsSync(`public${url}`)
);

if (missing.length) {
  hasIssues = true;
  console.log(`MISSING MEDIA (${missing.length}):`);
  missing.forEach((m) => console.log(`  - ${m}`));
} else {
  console.log("All thumbnailUrl/imageUrl references in app/data/projects.ts resolve to a file in public/.");
}

try {
  const diff = execSync(
    "git diff --stat -- public/sitemap.xml public/sitemap-0.xml public/robots.txt"
  ).toString().trim();
  if (diff) {
    hasIssues = true;
    console.log("\nSITEMAP DRIFT: committed sitemap/robots.txt differ from what the current build generates:");
    console.log(diff);
  } else {
    console.log("\nSitemap and robots.txt are up to date with the current build.");
  }
} catch (e) {
  console.log("\nCould not diff sitemap output:", e.message);
}

try {
  const res = await fetch("https://api.github.com/users/B-M-Anderson/repos");
  if (res.ok) {
    const repos = await res.json();
    const owned = repos.filter((r) => !r.fork && r.owner.login === "B-M-Anderson");
    const noThumbnail = owned.filter(
      (r) => !existsSync(`public/thumbnails/${r.name.replace(/\s+/g, "")}.png`)
    );
    if (noThumbnail.length) {
      console.log(`\nGITHUB REPOS FALLING BACK TO default.png (${noThumbnail.length}):`);
      noThumbnail.forEach((r) => console.log(`  - ${r.name}`));
    } else {
      console.log("\nEvery live GitHub repo has a matching thumbnail.");
    }
  } else {
    console.log(`\nGitHub API check skipped (status ${res.status}, likely rate-limited).`);
  }
} catch (e) {
  console.log("\nGitHub API check failed:", e.message);
}

if (hasIssues) process.exitCode = 1;
