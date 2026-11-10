// The kit's docs as data, for tools such as the kit's MCP server: every
// component with its labels, description, notes, classes and example markup,
// the install snippets for each setup, and the conventions. Each release
// carries its own copy, so jsDelivr serves the data for any version:
//   https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.2.7/docs/kit.json
//   node tools/data.mjs            write docs/kit.json
//   node tools/data.mjs --check    fail if docs/kit.json is out of date
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";

const docs = new URL("../docs/", import.meta.url);
const read = (f) => readFileSync(new URL(f, docs), "utf8");
const version = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
).version;

// The topic pages, as tools/components.mjs lists them
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
const SKIP = new Set(["sections", "more-template", "service-home", "colors", "color-tokens"]);
const LABELS = { template: "Template", cms: "CMS", app: "App", script: "Script", icons: "Icons" };

// Named entities the docs use, as plain characters, so kit.json's text reads
// as text. An entity missing here stops the build instead of reaching a
// release; add it.
const entities = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  thinsp: "\u2009",
  ldquo: "\u201C",
  rdquo: "\u201D",
  lsquo: "\u2018",
  rsquo: "\u2019",
  laquo: "\u00AB",
  raquo: "\u00BB",
  lsaquo: "\u2039",
  rsaquo: "\u203A",
  hellip: "\u2026",
  mdash: "\u2014",
  ndash: "\u2013",
  times: "\u00D7",
  copy: "\u00A9",
  rarr: "\u2192",
  larr: "\u2190",
  middot: "\u00B7",
};
// One pass, so "&amp;lt;" (a literal &lt; in the docs) stays "&lt;"
const decode = (s) =>
  s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === "#")
      return String.fromCodePoint(
        e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1),
      );
    if (!(e in entities)) throw new Error(`tools/data.mjs doesn't know the entity ${m}; add it.`);
    return entities[e];
  });
const text = (html) =>
  decode(
    html
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );

// The element that starts at `start` (an opening <div), through its matching </div>
function balanced(html, start) {
  const tag = /<\/?div\b[^>]*>/g;
  tag.lastIndex = start;
  let depth = 0;
  for (let m; (m = tag.exec(html));) {
    depth += m[0][1] === "/" ? -1 : 1;
    if (depth === 0) return html.slice(start, tag.lastIndex);
  }
  return html.slice(start);
}

// An example's markup as the docs' HTML tab shows it: the demo's contents,
// without the docs' own data-kit-* hooks, out-dented
function example(demo) {
  const inner = demo.replace(/^<div[^>]*>/, "").replace(/<\/div>\s*$/, "");
  const lines = inner
    .replace(/<[^>]*data-demo-skip[\s\S]*?<\/\w+>\s*/g, "")
    .replace(/ data-kit-[\w-]+(="[^"]*")?/g, "")
    .replace(/ data-preview/g, "")
    .replace(/^\s*\n|\s+$/g, "")
    .split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent)).join("\n");
}

const components = [];
for (const file of PAGES) {
  const html = read(file);
  const page = text(html.match(/<h1>(.*?)<\/h1>/s)[1]);
  const parts = html.split(/<h2 id="(?=[\w-]+" class="rule-top")/).slice(1);
  for (const part of parts) {
    const [whole, id, heading] = part.match(/^([\w-]+)"[^>]*>(.*?)<\/h2\s*>/s);
    const where = heading.match(/<span class="kit-where"\s*>([\s\S]*)<\/span\s*>/);
    if (SKIP.has(id) || !where) continue;
    const body = part.slice(whole.length);
    // The section's own text ends where its first example starts
    const firstDemo = body.search(/<div class="kit-demo[" ]/);
    const prose = firstDemo < 0 ? body : body.slice(0, firstDemo);
    const examples = [];
    for (const m of body.matchAll(/<div class="kit-demo[" ][^>]*>/g))
      examples.push(example(balanced(body, m.index)));
    // A section with no live example shows its markup in code blocks instead
    if (!examples.length)
      for (const m of prose.matchAll(/<pre[^>]*>\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g))
        examples.push(decode(m[1].replace(/<[^>]+>/g, "")));
    const classes = [
      ...new Set(
        [...prose.matchAll(/<p class="kit-classes">(.*?)<\/p>/gs)].flatMap((l) =>
          [...l[1].matchAll(/<code>(.*?)<\/code>/g)].map((c) => decode(c[1])),
        ),
      ),
    ];
    components.push({
      id,
      name: text(heading.replace(/<span class="kit-where"\s*>[\s\S]*<\/span\s*>/, "")),
      page,
      url: `https://webkilt.andrew.cmu.edu/${file}#${id}`,
      labels: [...where[1].matchAll(/kit-where-(\w+)/g)].map((m) => LABELS[m[1]] ?? m[1]),
      description: [...prose.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => text(m[1])).join("\n\n"),
      notes: [...prose.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => text(m[1])),
      classes,
      examples,
    });
  }
}

// Install: each section's snippets, in order
function snippets(html) {
  const out = {};
  const parts = html.split(/<h[23] id="(?=[\w-]+")/).slice(1);
  for (const part of parts) {
    const id = part.match(/^([\w-]+)"/)[1];
    const code = [...part.matchAll(/<pre[^>]*>\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g)].map((m) =>
      decode(m[1].replace(/<[^>]+>/g, "")),
    );
    if (code.length) out[id] = code;
  }
  return out;
}

// Conventions: each section's heading and text
function sections(html) {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
  return main
    .split(/<h2 id="(?=[\w-]+" class="rule-top")/)
    .slice(1)
    .map((part) => {
      const [whole, id, heading] = part.match(/^([\w-]+)"[^>]*>(.*?)<\/h2\s*>/s);
      const body = part.slice(whole.length).replace(/<div class="kit-demo[\s\S]*$/, "");
      const lines = [...body.matchAll(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/g)].map(
        (m) => (m[1] === "li" ? "- " : "") + text(m[2]),
      );
      return { id, heading: text(heading), text: lines.filter((l) => l.trim()).join("\n") };
    });
}

const data = {
  name: "Carnegie Mellon Web Kilt",
  version,
  docs: "https://webkilt.andrew.cmu.edu/",
  files: {
    "cmu-cms.css": `https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@${version}/css/cmu-cms.css`,
    "cmu-app.css": `https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@${version}/css/cmu-app.css`,
    "cmu-app.js": `https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@${version}/js/cmu-app.js`,
  },
  labels: {
    Template: "Part of CMU's template stylesheet and scripts; nothing from the kit.",
    CMS: "Requires cmu-cms.css.",
    App: "Requires cmu-cms.css, cmu-app.css and the cmu-app class on <body> (or cmu-framed on a page inside another tool).",
    Script: "Requires cmu-app.js, at the end of <body>.",
    Icons: "Requires the optional Bootstrap Icons stylesheet.",
  },
  components: components.sort((a, b) => a.name.localeCompare(b.name)),
  install: snippets(read("install.html")),
  conventions: sections(read("conventions.html")),
};

const out = new URL("kit.json", docs);
// Formatted as Prettier would, so writing it and Prettier's check agree
const path = fileURLToPath(out);
const next = await prettier.format(JSON.stringify(data), {
  ...(await prettier.resolveConfig(path)),
  filepath: path,
});
if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(out, "utf8");
  } catch {
    // No file yet: it's out of date
  }
  if (current !== next) {
    console.error("docs/kit.json is out of date: run node tools/data.mjs");
    process.exit(1);
  }
  console.log(`ok: docs/kit.json has all ${components.length} components`);
} else {
  writeFileSync(out, next);
  console.log(`docs/kit.json: ${components.length} components`);
}
