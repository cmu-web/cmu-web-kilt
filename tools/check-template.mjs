// Fails if the live CMU template CSS defines any class we define, so a
// template update can't silently collide with ours, or if the template's
// search magnifier changes, since cmu-cms.css redraws it. Run: npm run check
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const TEMPLATE = [
  "https://www.cmu.edu/common/standard-v6/css/main.6.7.min.css",
  "https://www.cmu.edu/common/standard-v6/css/print.min.css",
];
const ours = new Set();
for (const f of ["css/cmu-cms.css", "css/cmu-app.css"])
  for (const m of readFileSync(new URL(`../${f}`, import.meta.url), "utf8").matchAll(
    /\.(cmu-[\w-]+)/g,
  ))
    ours.add(m[1]);
// The template's magnifier, as it was when cmu-cms.css redrew it as an SVG
const MAGNIFIER = "https://www.cmu.edu/common/standard-v6/images/icon-magnify.png";
const MAGNIFIER_SHA256 = "04f2e2b330c4f9ed591da6ae80d23523b561286aa17f63c3ee3ddfed9215aadb";
// www.cmu.edu sometimes drops a connection, so each file gets three tries
async function get(url, bytes = false) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      return bytes ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}
const theirs = new Set();
for (const url of TEMPLATE)
  for (const m of (await get(url)).matchAll(/\.(cmu-[\w-]+)/g)) theirs.add(m[1]);
const clash = [...ours].filter((c) => theirs.has(c));
if (clash.length) {
  console.error("The template now defines:", clash.join(" "));
  process.exit(1);
}
const magnifier = createHash("sha256")
  .update(await get(MAGNIFIER, true))
  .digest("hex");
if (magnifier !== MAGNIFIER_SHA256) {
  console.error(
    "The template's search magnifier changed: redraw the search field's SVG in css/cmu-cms.css, then update MAGNIFIER_SHA256",
  );
  process.exit(1);
}
console.log(
  `ok: ${ours.size} classes, none in the template (${theirs.size} cmu- classes there), and the same search magnifier`,
);
