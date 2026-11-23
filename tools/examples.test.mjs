// Example pages embedded in the docs show the same markup as the code sample
// beside them.
//   npm run test:examples
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const docs = (file) => readFileSync(new URL(`../docs/${file}`, import.meta.url), "utf8");
const unescape = (html) =>
  html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
const squeeze = (html) =>
  html.replace(/\s+>/g, ">").replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();

test("the navigation example's nav#nav is Page Layout's code sample", () => {
  const sample = docs("layout.html").match(
    /<pre class="kit-code"[^>]*><code>(&lt;nav id="nav"&gt;[\s\S]*?&lt;\/nav&gt;)<\/code><\/pre>/,
  );
  const page = docs("examples/navigation.html").match(/<nav id="nav">[\s\S]*?<\/nav>/);
  assert.ok(sample, "Page Layout has no nav#nav code sample");
  assert.ok(page, "The example page has no nav#nav");
  assert.equal(squeeze(page[0]), squeeze(unescape(sample[1])));
});
