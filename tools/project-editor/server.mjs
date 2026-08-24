// Tiny local project-editor server. No dependencies — Node core modules only.
// Run: node tools/project-editor/server.mjs
// Then open http://localhost:4545

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PROJECTS_FILE = path.join(REPO_ROOT, "app", "data", "projects.ts");
const THUMBNAILS_DIR = path.join(REPO_ROOT, "public", "thumbnails");
const PREVIEWS_DIR = path.join(REPO_ROOT, "public", "Previews");
const PORT = 4545;

const FIELDS = [
  { key: "title", type: "string", required: true },
  { key: "description", type: "text", required: true },
  { key: "githubUrl", type: "string" },
  { key: "date", type: "string", required: true },
  { key: "skills", type: "stringArray" },
  { key: "importantSkills", type: "stringArray" },
  { key: "media", type: "enum", options: ["photo", "video", "both", "none"] },
  { key: "aiUsage", type: "number" },
  { key: "completion", type: "number" },
  { key: "thumbnailUrl", type: "string" },
  { key: "imageUrl", type: "string" },
  { key: "wip", type: "boolean" },
  { key: "terminated", type: "boolean" },
  { key: "completed", type: "boolean" },
  { key: "ongoing", type: "boolean" },
  { key: "shelved", type: "boolean" },
];

function readProjects() {
  const text = fs.readFileSync(PROJECTS_FILE, "utf8");
  const match = text.match(/export const projects: Project\[\] = (\[[\s\S]*\]);\s*$/);
  if (!match) throw new Error("Could not find `export const projects: Project[] = [...]` in projects.ts");
  const arrayLiteral = match[1];
  // The array literal is plain JS (template literals included), safe to eval in this local-only tool.
  const projects = new Function(`"use strict"; return (${arrayLiteral});`)();
  const header = text.slice(0, match.index);
  return { header, projects };
}

function jsStringLiteral(str) {
  return JSON.stringify(str ?? "");
}

function serializeValue(field, value) {
  if (value === undefined || value === "") return undefined;
  switch (field.type) {
    case "text":
      // Use a template literal so multi-line descriptions stay readable in the file.
      return "`" + String(value).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") + "`";
    case "string":
      return jsStringLiteral(value);
    case "enum":
      return jsStringLiteral(value);
    case "number":
      return Number.isFinite(Number(value)) ? String(Number(value)) : undefined;
    case "boolean":
      return value ? "true" : "false";
    case "stringArray": {
      const arr = Array.isArray(value) ? value : String(value).split(",").map((s) => s.trim()).filter(Boolean);
      if (!arr.length) return undefined;
      return "[" + arr.map(jsStringLiteral).join(", ") + "]";
    }
    default:
      return jsStringLiteral(value);
  }
}

function serializeProject(project) {
  const lines = [];
  for (const field of FIELDS) {
    const serialized = serializeValue(field, project[field.key]);
    if (serialized === undefined) continue;
    lines.push(`    ${field.key}: ${serialized},`);
  }
  return "  {\n" + lines.join("\n") + "\n  }";
}

function writeProjects(header, projects) {
  const body = projects.map(serializeProject).join(",\n\n");
  const text = `${header}export const projects: Project[] = [\n${body},\n];\n`;
  fs.writeFileSync(PROJECTS_FILE, text, "utf8");
}

function git(args) {
  return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

function gh(args) {
  return execFileSync("gh", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

function publishBranch() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const branch = `projects-update-${stamp}`;

  git(["checkout", "main"]);
  git(["pull", "--ff-only"]);
  git(["checkout", "-b", branch]);
  git(["add", "app/data/projects.ts", "public/thumbnails", "public/Previews"]);

  const status = git(["status", "--porcelain"]);
  if (!status) {
    git(["checkout", "main"]);
    git(["branch", "-D", branch]);
    throw new Error("No changes to commit.");
  }

  git(["commit", "-m", "Update projects"]);
  git(["push", "-u", "origin", branch]);

  let prUrl;
  try {
    prUrl = gh(["pr", "create", "--fill", "--base", "main", "--head", branch]);
  } catch (err) {
    prUrl = `Branch pushed, but PR creation failed (open one manually): ${err.message}`;
  }

  git(["checkout", "main"]);
  return { branch, prUrl };
}

function listDir(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => !f.startsWith("."));
  } catch {
    return [];
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  try {
    if (req.method === "GET" && url.pathname === "/") {
      const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/projects") {
      const { projects } = readProjects();
      sendJson(res, 200, { fields: FIELDS, projects });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/assets") {
      sendJson(res, 200, {
        thumbnails: listDir(THUMBNAILS_DIR),
        previews: listDir(PREVIEWS_DIR),
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/upload") {
      const kind = url.searchParams.get("kind"); // "thumbnail" | "preview"
      const filename = url.searchParams.get("filename");
      if (!filename || !/^[\w.\- ]+\.\w+$/.test(filename)) {
        sendJson(res, 400, { error: "Invalid filename" });
        return;
      }
      const dir = kind === "preview" ? PREVIEWS_DIR : THUMBNAILS_DIR;
      const body = await readBody(req);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, filename), body);
      const publicPath = kind === "preview" ? `/Previews/${filename}` : `/thumbnails/${filename}`;
      sendJson(res, 200, { path: publicPath });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/save") {
      const body = JSON.parse((await readBody(req)).toString("utf8"));
      const { header } = readProjects();
      writeProjects(header, body.projects);
      sendJson(res, 200, { saved: true });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/publish") {
      const body = JSON.parse((await readBody(req)).toString("utf8"));
      const { header } = readProjects();
      writeProjects(header, body.projects);
      const result = publishBranch();
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    sendJson(res, 500, { error: err.message, stack: err.stack });
  }
});

server.listen(PORT, () => {
  console.log(`Project editor running at http://localhost:${PORT}`);
});
