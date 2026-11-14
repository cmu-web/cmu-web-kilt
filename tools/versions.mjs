// The docs and README show the current release in every copy-paste example
// (cmu-web-kilt@X.Y.Z, cmu-web-kilt#X.Y.Z, V=X.Y.Z). This keeps them equal to
// package.json's version, and gives every <link> or <script> that loads a
// pinned file from jsDelivr its integrity hash, so browsers refuse a changed
// file.
//   node tools/versions.mjs            check: fail if a version or hash differs
//   node tools/versions.mjs 0.2.0      release: set package.json, every mention
//                                      and every hash
//
// A release's hashes are of its css/ and js/ as they are when it's made, and
// package.json keeps them ("integrity"). The check compares the docs with
// those, not with the working files, which change between releases.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const files = [
  "README.md",
  "packages/rails/README.md",
  ...readdirSync(new URL("docs/", root))
    .filter((f) => f.endsWith(".html"))
    .map((f) => "docs/" + f),
];
const MENTION =
  /(cmu-web-kilt?[@#]|cmu-web-kilt?-(?=\d+\.\d+\.\d+(?:\.gem|\/))|\bV=)(\d+\.\d+\.\d+)/g;
const KIT_FILES = ["css/cmu-cms.css", "css/cmu-app.css", "js/cmu-app.js"];
// Bootstrap Icons, which the docs load from jsDelivr's npm copy. Its hash only
// changes with its version; checked against the npm package itself.
const ICONS = {
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css":
    "sha384-CK2SzKma4jA5H/MXDUU7i1TqZlCFaD4T01vtyDFvPlD97JQyS+IsSh1nI2EFbpyk",
};
const KIT_URL = /^https:\/\/cdn\.jsdelivr\.net\/gh\/cmu-web\/cmu-web-kilt@\d+\.\d+\.\d+\/(.+)$/;
// A <link> or <script> tag, as HTML or shown as code (&lt;...&gt;)
const TAG = /(<|&lt;)(link|script)\b((?:(?!>|&gt;)[\s\S])*?)(\s*\/?)(>|&gt;)/g;

const pkgUrl = new URL("package.json", root);
const pkg = JSON.parse(readFileSync(pkgUrl, "utf8"));
const next = process.argv[2];

const sri = (file) =>
  "sha384-" +
  createHash("sha384")
    .update(readFileSync(new URL(file, root)))
    .digest("base64");

// Each pinned jsDelivr tag gets integrity and crossorigin right after its
// href or src; tags for anything else stay as they are
function withIntegrity(text, hashes) {
  return text.replace(TAG, (tag, open, name, attrs, end, close) => {
    const url = /\b(?:href|src)="([^"]+)"/.exec(attrs)?.[1];
    const kit = url && KIT_URL.exec(url);
    const hash = kit ? hashes[kit[1]] : ICONS[url];
    if (!hash) return tag;
    const rest = attrs.replace(/\s+integrity="[^"]*"/, "").replace(/\s+crossorigin(="[^"]*")?/, "");
    // Same spacing as the tag's other attributes: a space on one line, a new
    // indented line when Prettier has wrapped the tag
    const tagged = rest.replace(/\b((?:href|src)="[^"]+")(\s*)/, (_, attr, ws) => {
      const gap = ws || " ";
      return `${attr}${gap}integrity="${hash}"${gap}crossorigin="anonymous"${ws}`;
    });
    return open + name + tagged + end + close;
  });
}

if (next) {
  if (!/^\d+\.\d+\.\d+$/.test(next)) throw new Error(`not a version: ${next}`);
  const newer = (a, b) => {
    const [x, y] = [a, b].map((v) => v.split(".").map(Number));
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  };
  if (newer(next, pkg.version) <= 0) throw new Error(`${next} isn't newer than ${pkg.version}`);
  pkg.version = next;
  pkg.integrity = Object.fromEntries(KIT_FILES.map((f) => [f, sri(f)]));
  writeFileSync(pkgUrl, JSON.stringify(pkg, null, 2) + "\n");
  let n = 0;
  for (const f of files) {
    const url = new URL(f, root),
      s = readFileSync(url, "utf8");
    const t = withIntegrity(
      s.replace(MENTION, (_, pre) => (n++, pre + next)),
      pkg.integrity,
    );
    if (t !== s) writeFileSync(url, t);
  }
  console.log(`package.json, ${n} mentions and their integrity hashes now say ${next}. Next:
  git commit -am "chore: release ${next}"
  git tag -a ${next} -m "Carnegie Mellon Web Kilt ${next}"
  git push origin main ${next}
Then check jsDelivr (DEPLOYMENT.md#check-a-release) and add release notes on GitHub.`);
} else {
  const wrong = [];
  for (const f of files) {
    const s = readFileSync(new URL(f, root), "utf8");
    for (const [i, line] of s.split("\n").entries())
      for (const m of line.matchAll(MENTION))
        if (m[2] !== pkg.version) wrong.push(`${f}:${i + 1}: ${m[0]}`);
    if (pkg.integrity) {
      const lines = withIntegrity(s, pkg.integrity).split("\n");
      s.split("\n").forEach((line, i) => {
        if (line !== lines[i]) wrong.push(`${f}:${i + 1}: integrity or crossorigin`);
      });
    }
  }
  if (wrong.length) {
    console.error(`These don't match ${pkg.version} (run node tools/versions.mjs X.Y.Z to release):
  ${wrong.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`ok: every mention and hash matches ${pkg.version}`);
}
