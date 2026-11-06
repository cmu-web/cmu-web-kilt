// The docs and README show the current release in every copy-paste example
// (cmu-web-kilt@X.Y.Z, cmu-web-kilt#X.Y.Z, V=X.Y.Z). This keeps them equal to
// package.json's version.
//   node tools/versions.mjs            check: fail if any differ
//   node tools/versions.mjs 0.2.0      release: set package.json and every mention
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const files = [
  "README.md",
  ...readdirSync(new URL("docs/", root))
    .filter((f) => f.endsWith(".html"))
    .map((f) => "docs/" + f),
];
const MENTION =
  /(cmu-web-kilt?[@#]|cmu-web-kilt?-(?=\d+\.\d+\.\d+(?:\.gem|\/))|\bV=)(\d+\.\d+\.\d+)/g;
const pkgUrl = new URL("package.json", root);
const pkg = JSON.parse(readFileSync(pkgUrl, "utf8"));
const next = process.argv[2];

if (next) {
  if (!/^\d+\.\d+\.\d+$/.test(next)) throw new Error(`not a version: ${next}`);
  const newer = (a, b) => {
    const [x, y] = [a, b].map((v) => v.split(".").map(Number));
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  };
  if (newer(next, pkg.version) <= 0) throw new Error(`${next} isn't newer than ${pkg.version}`);
  pkg.version = next;
  writeFileSync(pkgUrl, JSON.stringify(pkg, null, 2) + "\n");
  let n = 0;
  for (const f of files) {
    const url = new URL(f, root),
      s = readFileSync(url, "utf8");
    const t = s.replace(MENTION, (_, pre) => (n++, pre + next));
    if (t !== s) writeFileSync(url, t);
  }
  console.log(`package.json and ${n} mentions now say ${next}. Next:
  git commit -am "chore: release ${next}"
  git tag -a ${next} -m "Carnegie Mellon Web Kilt ${next}"
  git push origin main ${next}
Then check jsDelivr (DEPLOYMENT.md#check-a-release) and add release notes on GitHub.`);
} else {
  const wrong = [];
  for (const f of files)
    for (const [i, line] of readFileSync(new URL(f, root), "utf8").split("\n").entries())
      for (const m of line.matchAll(MENTION))
        if (m[2] !== pkg.version) wrong.push(`${f}:${i + 1}: ${m[0]}`);
  if (wrong.length) {
    console.error(`These don't say ${pkg.version}:\n  ${wrong.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`ok: every mention says ${pkg.version}`);
}
