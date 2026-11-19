// Previews this checkout of the Web Kilt in another project before a
// release. It sits in front of the project's running app or static server
// and points the page's jsDelivr Kilt links at this checkout, so the page
// shows the Kilt as it is here, on whatever branch is checked out.
//   node tools/preview.mjs --proxy http://localhost:3000
//   node tools/preview.mjs --proxy http://localhost:3000 --port 4100
// For a static folder, start a server for it first:
//   python3 -m http.server 4200
// Development only, with no dependencies. See CONTRIBUTING.md.
import { createServer, request } from "node:http";
import { connect } from "node:net";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const KILT = fileURLToPath(new URL("../", import.meta.url));
const LOCAL = "/kilt-local/";
const RELEASE = /https:\/\/cdn\.jsdelivr\.net\/gh\/cmu-web\/cmu-web-kilt@[^/"']+\//g;
const TYPES = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

// A page's Kilt <link> and <script> tags, pointed at this checkout. The
// integrity hash and crossorigin go, since they belong to the release.
export function useLocalKilt(html, upstream, here) {
  let out = html.replace(/<(link|script)\b[^>]*cmu-web-kilt@[^>]*>/g, (tag) =>
    tag
      .replace(RELEASE, LOCAL)
      .replace(/\s+integrity=("[^"]*"|'[^']*')/, "")
      .replace(/\s+crossorigin(=("[^"]*"|'[^']*'))?/, ""),
  );
  // Links the app writes out in full keep the visitor on the proxy
  if (upstream && here) out = out.split(upstream).join(here);
  return out;
}

// The Kilt's own files, from this checkout: /kilt-local/css/... and /kilt-local/js/...
async function serveKilt(path, res) {
  const rel = normalize(decodeURIComponent(path.slice(LOCAL.length)));
  if (!/^(css|js)[/\\]/.test(rel) || rel.split(sep).includes("..")) {
    return res.writeHead(404).end();
  }
  try {
    const body = await readFile(join(KILT, rel));
    res.writeHead(200, {
      "content-type": TYPES[extname(rel)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}

export function createPreview({ upstream, here }) {
  const target = new URL(upstream);
  const origin = target.origin;

  const server = createServer((req, res) => {
    if (req.url.startsWith(LOCAL)) return serveKilt(req.url.split("?")[0], res);
    const headers = { ...req.headers, host: target.host, "accept-encoding": "identity" };
    const up = request(
      { host: target.hostname, port: target.port, method: req.method, path: req.url, headers },
      (upRes) => {
        const out = { ...upRes.headers };
        if (out.location?.startsWith(origin))
          out.location = here() + out.location.slice(origin.length);
        if (!String(out["content-type"] || "").includes("text/html")) {
          res.writeHead(upRes.statusCode, out);
          return upRes.pipe(res);
        }
        const chunks = [];
        upRes.on("data", (c) => chunks.push(c));
        upRes.on("end", () => {
          const body = Buffer.from(
            useLocalKilt(Buffer.concat(chunks).toString("utf8"), origin, here()),
          );
          // The page is rewritten whole, so it goes out with its own length
          delete out["content-encoding"];
          delete out["transfer-encoding"];
          delete out.etag;
          out["content-length"] = body.length;
          res.writeHead(upRes.statusCode, out);
          res.end(body);
        });
      },
    );
    up.on("error", () => {
      if (res.headersSent) return res.destroy();
      res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
      res.end(`Nothing is answering at ${origin}. Start the app or server first.\n`);
    });
    req.pipe(up);
  });

  // WebSockets (hot reload, Turbo and the like) pass straight through
  server.on("upgrade", (req, socket, head) => {
    const up = connect(target.port || 80, target.hostname, () => {
      const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const name = req.rawHeaders[i];
        lines.push(`${name}: ${/^host$/i.test(name) ? target.host : req.rawHeaders[i + 1]}`);
      }
      up.write(lines.join("\r\n") + "\r\n\r\n");
      if (head?.length) up.write(head);
      up.pipe(socket).pipe(up);
    });
    up.on("error", () => socket.destroy());
    up.on("close", () => socket.destroy());
    socket.on("error", () => up.destroy());
    socket.on("close", () => up.destroy());
  });

  return server;
}

function describeCheckout() {
  const pkg = JSON.parse(readFileSync(join(KILT, "package.json"), "utf8"));
  let branch = "";
  try {
    branch = execFileSync("git", ["-C", KILT, "rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    /* not a git checkout */
  }
  return `${pkg.version}${branch ? ` on ${branch}` : ""}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const upstream = opt("--proxy");
  if (!upstream) {
    console.error("Usage: node tools/preview.mjs --proxy http://localhost:3000 [--port 4100]");
    process.exit(1);
  }
  const port = Number(opt("--port")) || 4100;
  const here = `http://127.0.0.1:${port}`;
  createPreview({ upstream, here: () => here }).listen(port, "127.0.0.1", () => {
    console.log(`Web Kilt ${describeCheckout()} from ${KILT}`);
    console.log(`${upstream} with this Kilt: ${here}/`);
  });
}
