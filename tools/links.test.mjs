// Tests for bin/cmu-web-kilt-links.mjs, which keeps an app's links to the kit
// on jsDelivr on the installed release.
//   npm run test:links
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { relink } from "../bin/cmu-web-kilt-links.mjs";

const kit = {
  version: "1.2.3",
  integrity: {
    "css/cmu-cms.css": "sha384-NEWCMS",
    "js/cmu-app.js": "sha384-NEWJS",
  },
};
const cdn = "https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@";

test("a stale link gets the release's version and hash", () => {
  const page = `<link href="${cdn}1.0.0/css/cmu-cms.css" integrity="sha384-OLD" crossorigin="anonymous" rel="stylesheet" />`;
  const out = relink(page, kit);
  assert.equal(
    out.text,
    `<link href="${cdn}1.2.3/css/cmu-cms.css" integrity="sha384-NEWCMS" crossorigin="anonymous" rel="stylesheet" />`,
  );
  assert.equal(out.stale.length, 2);
});

test("a current link is left alone and reports nothing", () => {
  const page = `<script src="${cdn}1.2.3/js/cmu-app.js" integrity="sha384-NEWJS" crossorigin="anonymous"></script>`;
  const out = relink(page, kit);
  assert.equal(out.text, page);
  assert.deepEqual(out.stale, []);
});

test("attributes wrapped across lines keep their layout", () => {
  const page = `<link
      href="${cdn}1.0.0/css/cmu-cms.css"
      integrity="sha384-OLD"
      crossorigin="anonymous"
      rel="stylesheet"
    />`;
  const out = relink(page, kit).text;
  assert.match(out, /cmu-web-kilt@1\.2\.3\/css\/cmu-cms\.css"\n {6}integrity="sha384-NEWCMS"\n/);
});

test("a link in a TypeScript string is updated", () => {
  const source = `const page = \`<script src="${cdn}1.0.0/js/cmu-app.js" integrity="sha384-OLD" crossorigin="anonymous"></script>\`;
export const css = "${cdn}1.0.0/css/cmu-cms.css";`;
  const out = relink(source, kit).text;
  assert.match(out, /cmu-web-kilt@1\.2\.3\/js\/cmu-app\.js" integrity="sha384-NEWJS"/);
  assert.match(
    out,
    /const css = "https:\/\/cdn\.jsdelivr\.net\/gh\/cmu-web\/cmu-web-kilt@1\.2\.3\/css\/cmu-cms\.css"/,
  );
});

test("a link without integrity gets the version and no hash", () => {
  const page = `<link href="${cdn}1.0.0/css/cmu-cms.css" rel="stylesheet" />`;
  const out = relink(page, kit).text;
  assert.equal(out, `<link href="${cdn}1.2.3/css/cmu-cms.css" rel="stylesheet" />`);
});

test("a file the release has no hash for gets the version and a warning", () => {
  const page = `<link href="${cdn}1.0.0/css/cmu-cms.min.css" integrity="sha384-OLD" rel="stylesheet" />`;
  const out = relink(page, kit);
  assert.match(out.text, /@1\.2\.3\/css\/cmu-cms\.min\.css" integrity="sha384-OLD"/);
  assert.equal(out.warnings.length, 1);
});

// The command itself, on a folder, against this package's own release
test("--check fails on a stale link, and passes once it's rewritten", () => {
  const { version, integrity } = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  const dir = mkdtempSync(join(tmpdir(), "kilt-links-"));
  const file = join(dir, "index.html");
  writeFileSync(
    file,
    `<link href="${cdn}0.0.1/css/cmu-cms.css" integrity="sha384-OLD" rel="stylesheet" />\n`,
  );
  const bin = new URL("../bin/cmu-web-kilt-links.mjs", import.meta.url).pathname;
  const run = (...args) => {
    try {
      return {
        code: 0,
        out: execFileSync("node", [bin, ...args], { encoding: "utf8", stdio: "pipe" }),
      };
    } catch (error) {
      return { code: error.status, out: error.stderr };
    }
  };
  const stale = run("--check", dir);
  assert.equal(stale.code, 1);
  assert.match(stale.out, /index\.html:1: css\/cmu-cms\.css is on 0\.0\.1/);
  assert.equal(run(dir).code, 0);
  assert.equal(run("--check", dir).code, 0);
  const fixed = readFileSync(file, "utf8");
  assert.ok(fixed.includes(`cmu-web-kilt@${version}/css/cmu-cms.css`));
  assert.ok(fixed.includes(`integrity="${integrity["css/cmu-cms.css"]}"`));
});
