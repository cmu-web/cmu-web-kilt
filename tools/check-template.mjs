// Fails if the live CMU template CSS defines any class we define, so a
// template update can't silently collide with ours. Run: npm run check
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
// www.cmu.edu sometimes drops a connection, so each file gets three tries
async function get(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      return await res.text();
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
console.log(`ok: ${ours.size} classes, none in the template (${theirs.size} cmu- classes there)`);
