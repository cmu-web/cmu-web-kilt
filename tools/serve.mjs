// Serves the docs as the site publishes them: docs/ at the root, with the
// kit's own css/ and js/ beside the docs' (see .github/workflows/pages.yml).
//   npm run docs              http://127.0.0.1:8123/
//   node tools/serve.mjs 9000 another port
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.argv[2]) || 8123;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

// A path is looked for in docs/ first, then, for css/ and js/, in the kit
async function find(path) {
  const rel = normalize(decodeURIComponent(path)).replace(/^(\.\.[/\\])+/, "");
  const tries = [join(root, "docs", rel)];
  if (/^[/\\](css|js)[/\\]/.test(rel)) tries.push(join(root, rel));
  for (let f of tries) {
    try {
      if ((await stat(f)).isDirectory()) f = join(f, "index.html");
      return { file: f, body: await readFile(f) };
    } catch {
      /* try the next place */
    }
  }
  return null;
}

createServer(async (req, res) => {
  const found = await find(new URL(req.url, "http://localhost").pathname);
  if (!found) {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found\n");
    return;
  }
  res
    .writeHead(200, {
      "Content-Type": TYPES[extname(found.file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    })
    .end(found.body);
}).listen(port, "127.0.0.1", () => console.log(`Docs at http://127.0.0.1:${port}/`));
