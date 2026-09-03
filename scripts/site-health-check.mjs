// Read-only maintenance check, run weekly by .github/workflows/site-maintenance.yml
// (never writes back to the repo). It verifies that:
//   - every thumbnailUrl / imageUrl in app/data/projects.ts is a real file in public/
//   - every project date parses, and status flags agree with the completion bar
//   - every videoUrl is a YouTube link the site can embed
//   - the homepage's hard-coded photos exist
import { readFileSync, existsSync } from "node:fs";

let hasIssues = false;
const issue = (msg) => {
  hasIssues = true;
  console.log(msg);
};

const src = readFileSync("app/data/projects.ts", "utf8");

// --- media references ------------------------------------------------------
const referenced = new Set();
for (const m of src.matchAll(/(thumbnailUrl|imageUrl)\s*:\s*"([^"]+)"/g)) referenced.add(m[2]);
const missing = [...referenced].filter((url) => url.startsWith("/") && !existsSync(`public${url}`));
if (missing.length) {
  issue(`MISSING MEDIA (${missing.length}):`);
  missing.forEach((m) => console.log(`  - ${m}`));
} else {
  console.log("All thumbnailUrl/imageUrl references in app/data/projects.ts resolve to a file in public/.");
}

// --- per-project data sanity -----------------------------------------------
// The file is TypeScript, so read each `{ ... }` entry's scalar fields with
// regexes rather than importing it.
const entries = src.split(/\n  \{\n/).slice(1);
for (const entry of entries) {
  const get = (key) => entry.match(new RegExp(`^\\s*${key}\\s*:\\s*("([^"]*)"|[\\w.]+)`, "m"));
  const title = get("title")?.[2] ?? "(untitled)";
  const date = get("date")?.[2];
  if (!date || Number.isNaN(new Date(date).getTime())) issue(`BAD DATE: "${title}" has date ${JSON.stringify(date)} (must parse with new Date()).`);
  const completion = Number(get("completion")?.[1]);
  const flag = (k) => get(k)?.[1] === "true";
  if (flag("completed") && Number.isFinite(completion) && completion < 100) {
    issue(`STATUS: "${title}" is flagged completed but completion is ${completion}% — it renders as work in progress.`);
  }
  if ([flag("completed"), flag("terminated"), flag("shelved")].filter(Boolean).length > 1) {
    issue(`STATUS: "${title}" sets more than one of completed/terminated/shelved.`);
  }
  const video = get("videoUrl")?.[2];
  if (video && !/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)[A-Za-z0-9_-]{11}/.test(video)) {
    issue(`VIDEO: "${title}" videoUrl is not a recognisable YouTube link: ${video}`);
  }
}
if (!hasIssues) console.log("Project dates, status flags and video links look consistent.");

// --- homepage photos -------------------------------------------------------
const page = readFileSync("app/page.tsx", "utf8");
const photos = [...page.matchAll(/"(\/(?:cats|Previews)\/[^"]+|\/profile\.jpeg)"/g)].map((m) => m[1]);
const lost = photos.filter((u) => !existsSync(`public${u}`));
if (lost.length) {
  issue(`\nMISSING HOMEPAGE PHOTOS (${lost.length}):`);
  lost.forEach((m) => console.log(`  - ${m}`));
} else {
  console.log("\nEvery homepage photo resolves to a file in public/.");
}

if (hasIssues) process.exitCode = 1;
