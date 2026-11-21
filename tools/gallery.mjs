// The Gallery page's cards come from docs/gallery.json, the sites and apps
// built with the kit. This checks every entry and rewrites the cards.
//   node tools/gallery.mjs            write the cards into docs/gallery.html
//   node tools/gallery.mjs --check    fail on a bad entry or out-of-date cards
//
// An entry: { id, name, url, link, login?, image?, zoom?, alt, summary, pills }
//   id       the card's anchor (other pages link to gallery.html#id)
//   link     the words of the link to the site, e.g. "Visit Binder"
//   login    true adds "[login required]" after the link
//   image    a screenshot, 1040 × 656, relative to docs/ or a full address;
//            leave it out for a placeholder until there's a screenshot
//   zoom     a larger image to open on click, if not the image itself
//   pills    labels from PILLS below, what the site is and what it's built with
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";

// Every pill a card can have, with its classes (the Kilt's own pill, so any
// site can show them) and tooltip. Other projects' gallery.json files use the
// same list, and the CMU Web gallery's tools/gallery.py mirrors it.
export const PILLS = {
  CMS: ["cmu-pill cmu-pill--blue", "A content site"],
  App: ["cmu-pill cmu-pill--green", "A web app"],
  Cascade: ["cmu-pill cmu-pill--outline", "Built in Cascade"],
  HTML: ["cmu-pill cmu-pill--outline", "Hand-written HTML pages"],
  Jekyll: ["cmu-pill cmu-pill--outline", "Built with Jekyll on GitHub Pages"],
  Node: ["cmu-pill cmu-pill--outline", "A Node app"],
  Rails: ["cmu-pill cmu-pill--outline", "A Ruby on Rails app"],
  WordPress: ["cmu-pill cmu-pill--outline", "Built in WordPress"],
};
// Longest summary. Cards in a row line up their links whatever the length
// (cmu-cards-links), but a long summary still makes one card tower over the
// rest: at 1280 pixels wide, 150 characters is about four lines.
export const SUMMARY_MAX = 150;
const PLACEHOLDER = "https://placemellon.andrew.cmu.edu/1040/656.svg?solid&text";
const FIELDS = ["id", "name", "url", "link", "login", "image", "zoom", "alt", "summary", "pills"];

const docs = new URL("../docs/", import.meta.url);
const entries = JSON.parse(readFileSync(new URL("gallery.json", docs), "utf8"));

const problems = [];
const ids = new Set();
for (const [i, e] of entries.entries()) {
  const at = e.id || `entry ${i + 1}`;
  for (const f of ["id", "name", "url", "link", "alt", "summary", "pills"])
    if (!e[f] || (Array.isArray(e[f]) && !e[f].length)) problems.push(`${at}: no ${f}`);
  for (const f of Object.keys(e))
    if (!FIELDS.includes(f)) problems.push(`${at}: unknown field ${f}`);
  if (ids.has(e.id)) problems.push(`${at}: the id is used twice`);
  ids.add(e.id);
  for (const p of e.pills || [])
    if (!PILLS[p])
      problems.push(`${at}: no pill named ${p} (use ${Object.keys(PILLS).join(", ")})`);
  if (e.summary && e.summary.length > SUMMARY_MAX)
    problems.push(
      `${at}: the summary is ${e.summary.length} characters; keep it to ${SUMMARY_MAX}`,
    );
  if (!e.image && e.zoom) problems.push(`${at}: a zoom image needs an image`);
}
if (problems.length) {
  console.error(`docs/gallery.json:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const pill = (p) => `<span class="${PILLS[p][0]}" title="${esc(PILLS[p][1])}">${esc(p)}</span>`;
const card = (e) => {
  const img = `<img src="${esc(e.image || PLACEHOLDER)}" alt="${esc(e.alt)}" width="1040" height="656" />`;
  const shot = e.image ? `<a href="${esc(e.zoom || e.image)}" data-cmu-zoom>${img}</a>` : img;
  return `<div id="${esc(e.id)}">
<figure class="cmu-shot cmu-shot--browser">${shot}</figure>
<h2>${esc(e.name)} <span class="kit-where">${e.pills.map(pill).join("")}</span></h2>
<p>${esc(e.summary)}</p>
<p><a class="external" href="${esc(e.url)}">${esc(e.link)}</a>${e.login ? " [login required]" : ""}</p>
</div>`;
};
const cards = `<!-- gallery:start (written by tools/gallery.mjs from gallery.json) -->
${entries.map(card).join("\n")}
<!-- gallery:end -->`;

const file = new URL("gallery.html", docs);
const html = readFileSync(file, "utf8");
if (!html.includes("<!-- gallery:start"))
  throw new Error("gallery.html has no gallery:start/end markers");
// Formatted as Prettier would, so writing it and Prettier's check agree
const path = fileURLToPath(file);
const next = await prettier.format(
  html.replace(/<!-- gallery:start[\s\S]*?<!-- gallery:end -->/, cards),
  { ...(await prettier.resolveConfig(path)), filepath: path },
);

if (process.argv.includes("--check")) {
  if (next !== html) {
    console.error("The gallery is out of date: run node tools/gallery.mjs");
    process.exit(1);
  }
  console.log(`ok: the gallery shows all ${entries.length} entries`);
} else {
  writeFileSync(file, next);
  console.log(`gallery.html shows ${entries.length} entries`);
}
