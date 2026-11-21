#!/usr/bin/env node
// Keeps an app's links to the kit on jsDelivr on the installed release: every
// https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@X.Y.Z/... gets this
// package's version, and the integrity hash in the same <link> or <script>
// gets the release's hash for that file, from this package's package.json.
//   cmu-web-kilt-links docs src           rewrite the links in these files and folders
//   cmu-web-kilt-links --check docs src   change nothing; fail if a link is stale
// Folders are searched for .html, .ejs, .ts, .js and .mjs files. A link
// without an integrity attribute gets none; a file the release has no hash
// for (a .min. copy, say) gets the new version only, with a warning if its
// tag has a hash, which no longer matches.
import { readFileSync, writeFileSync, readdirSync, statSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const EXTENSIONS = /\.(html|ejs|ts|js|mjs)$/;
const SKIP = new Set(["node_modules", "dist", ".git", "_site", "site"]);
const URL_ =
  /(https:\/\/cdn\.jsdelivr\.net\/gh\/cmu-web\/cmu-web-kilt@)(\d+\.\d+\.\d+)(\/[\w./-]+)/g;
// A <link> or <script> tag, as HTML, as code shown in a page (&lt;...&gt;) or
// in a string, its attributes on one line or several
const TAG = /(<|&lt;)(link|script)\b((?:(?!>|&gt;)[\s\S])*?)(>|&gt;)/g;

// The installed release: its version and its files' hashes
export function installed() {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  return { version: pkg.version, integrity: pkg.integrity || {} };
}

// The text with its kit links on this release, and what was stale, by offset
export function relink(text, kit) {
  const stale = [];
  const warnings = [];
  const fix = (match, start, base, version, path) => {
    if (version !== kit.version) stale.push({ at: start, found: version, path: path.slice(1) });
    return base + kit.version + path;
  };
  // Tags first, so each link's hash moves with it
  let out = text.replace(TAG, (tag, open, name, attrs, close, at) => {
    URL_.lastIndex = 0;
    const link = URL_.exec(attrs);
    if (!link) return tag;
    const file = link[3].slice(1);
    let next = attrs.replace(URL_, (m, base, version, path, offset) =>
      fix(m, at + open.length + name.length + offset, base, version, path),
    );
    const hash = /\bintegrity="([^"]*)"/.exec(next);
    if (hash) {
      const want = kit.integrity[file];
      if (!want)
        warnings.push(`${file} has no hash in ${kit.version}; its integrity no longer matches`);
      else if (hash[1] !== want) {
        stale.push({ at: at + open.length + name.length + hash.index, found: "hash", path: file });
        next = next.replace(/\bintegrity="[^"]*"/, `integrity="${want}"`);
      }
    }
    return open + name + next + close;
  });
  // Then any link outside a tag, such as an address in a string
  out = out.replace(URL_, (m, base, version, path, at) => fix(m, at, base, version, path));
  // A link fixed in the tag pass is reported once
  const seen = new Set();
  const unique = stale.filter((s) => {
    const key = `${s.at}:${s.path}`;
    return seen.has(key) ? false : seen.add(key);
  });
  return { text: out, stale: unique, warnings: [...new Set(warnings)] };
}

function walk(path, found = []) {
  if (statSync(path).isDirectory()) {
    for (const name of readdirSync(path)) if (!SKIP.has(name)) walk(join(path, name), found);
  } else if (EXTENSIONS.test(path)) found.push(path);
  return found;
}

const lineOf = (text, at) => text.slice(0, at).split("\n").length;

function main(argv) {
  const check = argv.includes("--check");
  const paths = argv.filter((a) => a !== "--check");
  if (!paths.length) {
    console.error("Usage: cmu-web-kilt-links [--check] <files or folders...>");
    return 2;
  }
  const kit = installed();
  let links = 0;
  let problems = 0;
  for (const file of paths.flatMap((p) => walk(p))) {
    const text = readFileSync(file, "utf8");
    links += (text.match(URL_) || []).length;
    const result = relink(text, kit);
    for (const w of result.warnings) console.warn(`warning: ${file}: ${w}`);
    if (!result.stale.length) continue;
    if (check) {
      for (const s of result.stale)
        console.error(
          `${file}:${lineOf(text, s.at)}: ${s.path} ${s.found === "hash" ? "has an old hash" : `is on ${s.found}`}, not ${kit.version}`,
        );
      problems += result.stale.length;
    } else {
      writeFileSync(file, result.text);
      console.log(`${file}: ${result.stale.length} updated to ${kit.version}`);
    }
  }
  if (check && problems) {
    console.error(`${problems} stale; run cmu-web-kilt-links without --check`);
    return 1;
  }
  if (check) console.log(`ok: ${links} links on ${kit.version}`);
  return 0;
}

// Run as a command, including through node_modules/.bin's link to this file
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exitCode = main(process.argv.slice(2));
