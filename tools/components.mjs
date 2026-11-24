// The Components page lists every component in the docs, built from the
// section headings of the topic pages, with where each works and the
// classes listed under it. A section whose components each have an h3 with
// labels of its own gets a row with all their labels, then a row for each
// ("Tables: Sorting"); an h3 marked kit-example is an example, not a row.
// This rewrites that table.
//   node tools/components.mjs            write the table into docs/components.html
//   node tools/components.mjs --check    fail if the table is out of date
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";

const docs = new URL("../docs/", import.meta.url);
const read = (f) => readFileSync(new URL(f, docs), "utf8");
// The topic pages, in the order the Components page lists them
const PAGES = [
  "sections.html",
  "pathways.html",
  "buttons.html",
  "content.html",
  "media.html",
  "sidebars.html",
  "people.html",
  "news.html",
  "lists.html",
  "forms.html",
  "messages.html",
  "accounts.html",
  "layout.html",
];
// Sections that explain rather than show a component
const SKIP = new Set(["sections", "more-template", "colors", "color-tokens"]);

const text = (html) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
const pageTitle = (html) => text(html.match(/<h1>(.*?)<\/h1>/s)[1]);

// A section's labels: the spans inside its heading's kit-where, in the
// order Template, CMS, App, Script, Icons
const KINDS = ["template", "cms", "app", "script", "icons"];
const labelsOf = (heading) => {
  const where = heading.match(/<span class="kit-where"\s*>([\s\S]*)<\/span\s*>/);
  return where
    ? [...where[1].matchAll(/<span\s+class="kit-where-(\w+)"[\s\S]*?<\/span\s*>/g)].map((m) => ({
        kind: m[1],
        html: m[0]
          .replace(/\s+/g, " ")
          .replace(/\s*>\s*/g, ">")
          .replace(/\s*<\s*/g, "<"),
        name: text(m[0]),
      }))
    : [];
};
const nameOf = (heading) =>
  text(heading.replace(/<span class="kit-where"\s*>[\s\S]*<\/span\s*>/, ""));
// Every class list in a part, such as one per variant, each class once
const classesIn = (part) =>
  [
    ...new Set(
      [...part.matchAll(/<p class="kit-classes">(.*?)<\/p>/gs)].flatMap((l) =>
        [...l[1].matchAll(/<code>(.*?)<\/code>/g)].map((m) => m[1]),
      ),
    ),
  ].join(", ");
const row = (name, href, labels, page, classes, parent = name) => {
  const sorted = KINDS.flatMap((k) => labels.filter((l) => l.kind === k).slice(0, 1));
  return {
    name,
    parent,
    href,
    set: sorted.map((l) => l.name).join(", "),
    // The same labels as the heading's, as pills
    pills: `<span class="kit-where">${sorted.map((l) => l.html).join("")}</span>`,
    page,
    classes,
  };
};

const rows = [];
for (const file of PAGES) {
  const html = read(file);
  const page = pageTitle(html);
  // Each docs section starts with <h2 id="…" class="rule-top">; headings
  // inside examples have neither
  const parts = html.split(/<h2 id="(?=[\w-]+" class="rule-top")/).slice(1);
  for (const part of parts) {
    const [, id, heading] = part.match(/^([\w-]+)"[^>]*>(.*?)<\/h2\s*>/s);
    if (SKIP.has(id)) continue;
    // Its components: each h3 with labels of its own (not an example, which
    // is marked kit-example), with the part of the section under it
    const subs = [...part.matchAll(/<h3 id="([\w-]+)"([^>]*)>(.*?)<\/h3\s*>/gs)]
      .filter((m) => !/kit-example/.test(m[2]) && labelsOf(m[3]).length)
      .map((m, i, all) => ({
        id: m[1],
        heading: m[3],
        body: part.slice(m.index, all[i + 1] ? all[i + 1].index : undefined),
      }));
    // Where it works: the heading's labels, or all of its components'.
    // Page Layout's own sections, the template's frame, have none
    const own = labelsOf(heading);
    const labels = own.length ? own : subs.flatMap((s) => labelsOf(s.heading));
    if (!labels.length) continue;
    const name = nameOf(heading);
    const classes = classesIn(part);
    rows.push(row(name, `${file}#${id}`, labels, page, classes));
    // Each component gets a row too, named after the section
    for (const s of subs)
      rows.push(
        row(
          `${name}: ${nameOf(s.heading)}`,
          `${file}#${s.id}`,
          labelsOf(s.heading),
          page,
          classesIn(s.body) || classes,
          name,
        ),
      );
  }
}

const esc = (s) => s.replace(/&(?!\w+;)/g, "&amp;");
const table = `<!-- components:start (written by tools/components.mjs) -->
      <table class="alternate cmu-full" id="kit-components" data-kit-sortable>
        <thead><tr><th scope="col" data-sort-key="name" aria-sort="ascending"><button class="cmu-sort" type="button">Component<span class="cmu-sort-arrow"> ▲</span></button></th><th scope="col" data-sort-key="set"><button class="cmu-sort" type="button">Requires<span class="cmu-sort-arrow"></span></button></th><th scope="col" data-sort-key="page"><button class="cmu-sort" type="button">Page<span class="cmu-sort-arrow"></span></button></th><th scope="col">Classes</th></tr></thead>
        <tbody>
${rows
  // A component's row right after its section's
  .sort(
    (a, b) =>
      a.parent.localeCompare(b.parent) ||
      (a.name !== a.parent) - (b.name !== b.parent) ||
      a.name.localeCompare(b.name),
  )
  .map(
    (r) =>
      `          <tr><td><a href="${r.href}">${esc(r.name)}</a></td><td class="cmu-fit">${r.pills}</td><td>${esc(r.page)}</td><td>${r.classes ? `<code>${r.classes.split(", ").join("</code>, <code>")}</code>` : ""}</td></tr>`,
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
