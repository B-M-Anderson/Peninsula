// Renders resume.html to ResumeBennettAnderson.pdf at exact US Letter, no margins,
// and a 2x PNG of the .page element for the site's Resume Refresh project card.
//   npm i -D puppeteer && node print-resume.mjs
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";

const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
await page.goto("file://" + path.join(here, "resume.html"), { waitUntil: "networkidle0" });
await page.evaluateHandle("document.fonts.ready");

await page.pdf({
  path: path.join(here, "ResumeBennettAnderson.pdf"),
  width: "8.5in",
  height: "11in",
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  pageRanges: "1",
});
console.log("wrote ResumeBennettAnderson.pdf");

// PNG preview at 2x of the .page element
const el = await page.$(".page");
await el.screenshot({ path: path.join(here, "resume-preview.png") });
console.log("wrote resume-preview.png");

await browser.close();
