// The Components page lists every component in the docs, built from the
// section headings of the topic pages, with where each works and the
// classes listed under it. This rewrites that table.
//   node tools/components.mjs            write the table into docs/components.html
//   node tools/components.mjs --check    fail if the table is out of date
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";

const docs = new URL("../docs/", import.meta.url);
const read = (f) => readFileSync(new URL(f, docs), "utf8");
// The topic pages, in the order the Components page lists them
const PAGES = [
  "tops.html",
  "sections.html",
  "content.html",
  "sidebars.html",
  "previews.html",
  "people.html",
  "news.html",
  "lists.html",
  "forms.html",
  "messages.html",
  "accounts.html",
  "layout.html",
];
// Sections that explain rather than show a component
const SKIP = new Set(["sections", "more-template", "service-home", "colors", "color-tokens"]);

const text = (html) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
const pageTitle = (html) => text(html.match(/<h1>(.*?)<\/h1>/s)[1]);

const rows = [];
for (const file of PAGES) {
  const html = read(file);
  const page = pageTitle(html);
  // Each docs section starts with <h2 id="…" class="rule-top">; headings
  // inside examples have neither
  const parts = html.split(/<h2 id="(?=[\w-]+" class="rule-top")/).slice(1);
  for (const part of parts) {
    const [, id, heading] = part.match(/^([\w-]+)"[^>]*>(.*?)<\/h2\s*>/s);
    // Where it works: the labels after the heading's name. Page Layout's own
    // sections, the template's frame, have none
    const where = heading.match(/<span class="kit-where"\s*>([\s\S]*)<\/span\s*>/);
    const name = heading.replace(/<span class="kit-where"\s*>[\s\S]*<\/span\s*>/, "");
    if (SKIP.has(id) || !where) continue;
    // Every class list in the section, such as one per variant, each class once
    const lists = [...part.matchAll(/<p class="kit-classes">(.*?)<\/p>/gs)];
    const classes = [
      ...new Set(lists.flatMap((l) => [...l[1].matchAll(/<code>(.*?)<\/code>/g)].map((m) => m[1]))),
    ].join(", ");
    rows.push({
      name: text(name),
      href: `${file}#${id}`,
      set: [...where[1].matchAll(/>([^<]+)<\/span/g)].map((m) => m[1].trim()).join(", "),
      page,
      classes,
    });
  }
}

const esc = (s) => s.replace(/&(?!\w+;)/g, "&amp;");
const table = `<!-- components:start (written by tools/components.mjs) -->
      <table class="alternate cmu-full" id="kit-components" data-kit-sortable>
        <thead><tr><th scope="col" data-sort-key="name" aria-sort="ascending"><button class="cmu-sort" type="button">Component<span class="cmu-sort-arrow"> ▲</span></button></th><th scope="col" data-sort-key="set"><button class="cmu-sort" type="button">Needs<span class="cmu-sort-arrow"></span></button></th><th scope="col" data-sort-key="page"><button class="cmu-sort" type="button">Page<span class="cmu-sort-arrow"></span></button></th><th scope="col">Classes</th></tr></thead>
        <tbody>
${rows
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(
    (r) =>
      `          <tr><td><a href="${r.href}">${esc(r.name)}</a></td><td class="cmu-fit">${r.set}</td><td>${esc(r.page)}</td><td>${r.classes ? `<code>${r.classes.split(", ").join("</code>, <code>")}</code>` : ""}</td></tr>`,
  )
  .join("\n")}
        </tbody>
      </table>
      <!-- components:end -->`;

const file = new URL("components.html", docs);
const html = readFileSync(file, "utf8");
// Formatted as Prettier would, so writing it and Prettier's check agree
const path = fileURLToPath(file);
const next = await prettier.format(
  html.replace(/<!-- components:start[\s\S]*?<!-- components:end -->/, table),
  { ...(await prettier.resolveConfig(path)), filepath: path },
);
if (next === html && !html.includes("<!-- components:start"))
  throw new Error("components.html has no components:start/end markers");
// Every live example keeps its markup as written: Prettier must skip it
const unmarked = readdirSync(docs)
  .filter((f) => f.endsWith(".html"))
  .flatMap((f) =>
    [...read(f).matchAll(/(.*)\n\s*<div class="kit-demo[" ]/g)]
      .filter((m) => !m[1].includes("<!-- prettier-ignore -->"))
      .map(() => f),
  );
if (unmarked.length) {
  console.error(
    `Add <!-- prettier-ignore --> right before each kit-demo in: ${[...new Set(unmarked)].join(", ")}`,
  );
  process.exit(1);
}

if (process.argv.includes("--check")) {
  if (next !== html) {
    console.error("The components table is out of date: run node tools/components.mjs");
    process.exit(1);
  }
  console.log(`ok: the components table lists all ${rows.length}`);
} else {
  writeFileSync(file, next);
  console.log(`components.html lists ${rows.length} components`);
}
