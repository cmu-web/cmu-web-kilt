// Tests for tools/preview.mjs against a small stand-in app.
//   npm run test:preview
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { connect } from "node:net";
import { readFile } from "node:fs/promises";
import { createPreview, useLocalKilt } from "./preview.mjs";

const RELEASE = "https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.8.15";
const PAGE = `<!doctype html>
<link href="${RELEASE}/css/cmu-cms.css" integrity="sha384-abc" crossorigin="anonymous" rel="stylesheet">
<link href="https://www.cmu.edu/common/standard-v6/css/main.6.7.min.css" integrity="sha384-keep" rel="stylesheet">
<script src="${RELEASE}/js/cmu-app.js" integrity="sha384-def" crossorigin></script>
<a href="ORIGIN/teams">Teams</a>`;

let app, preview, appOrigin, here;
const upgraded = [];

before(async () => {
  app = createServer((req, res) => {
    if (req.url === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(PAGE.replace("ORIGIN", appOrigin));
    }
    if (req.url === "/old") {
      res.writeHead(302, { location: `${appOrigin}/teams` });
      return res.end();
    }
    if (req.url === "/data.json") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(`{"kilt":"${RELEASE}/css/cmu-cms.css"}`);
    }
    res.writeHead(404).end();
  });
  app.on("upgrade", (req, socket) => {
    upgraded.push(socket);
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n",
    );
    socket.on("data", (d) => socket.write(`echo ${d}`));
  });
  await new Promise((r) => app.listen(0, "127.0.0.1", r));
  appOrigin = `http://127.0.0.1:${app.address().port}`;
  preview = createPreview({ upstream: appOrigin, here: () => here });
  await new Promise((r) => preview.listen(0, "127.0.0.1", r));
  here = `http://127.0.0.1:${preview.address().port}`;
});

after(() => {
  for (const server of [app, preview]) {
    server.closeAllConnections();
    server.close();
  }
  for (const socket of upgraded) socket.destroy();
});

test("Kilt links point at the checkout, without the release's hash", async () => {
  const html = await (await fetch(`${here}/`)).text();
  assert.match(html, /href="\/kilt-local\/css\/cmu-cms\.css" rel="stylesheet"/);
  assert.match(html, /<script src="\/kilt-local\/js\/cmu-app\.js"><\/script>/);
  assert.doesNotMatch(html, /sha384-abc|sha384-def|crossorigin/);
  assert.match(html, /integrity="sha384-keep"/, "other links keep their hashes");
  assert.match(html, new RegExp(`href="${here}/teams"`), "full links stay on the proxy");
});

test("the Kilt's own files come from the checkout", async () => {
  const res = await fetch(`${here}/kilt-local/css/cmu-cms.css`);
  assert.equal(res.status, 200);
  assert.equal(
    await res.text(),
    await readFile(new URL("../css/cmu-cms.css", import.meta.url), "utf8"),
  );
  assert.equal((await fetch(`${here}/kilt-local/package.json`)).status, 404);
  assert.equal((await fetch(`${here}/kilt-local/css/..%2f..%2fpackage.json`)).status, 404);
});

test("redirects to the app's own address stay on the proxy", async () => {
  const res = await fetch(`${here}/old`, { redirect: "manual" });
  assert.equal(res.headers.get("location"), `${here}/teams`);
});

test("anything but HTML passes through untouched", async () => {
  const body = await (await fetch(`${here}/data.json`)).text();
  assert.equal(body, `{"kilt":"${RELEASE}/css/cmu-cms.css"}`);
});

test("WebSockets pass through", async () => {
  const { port } = preview.address();
  const reply = await new Promise((resolve, reject) => {
    const s = connect(port, "127.0.0.1", () => {
      s.write(
        "GET /socket HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n",
      );
    });
    let got = "";
    s.on("data", (d) => {
      got += d;
      if (got.includes("\r\n\r\n") && !got.includes("echo")) s.write("hi");
      if (got.includes("echo hi")) {
        s.destroy();
        resolve(got);
      }
    });
    s.on("error", reject);
  });
  assert.match(reply, /101 Switching Protocols/);
});

test("a down app gets a plain 502 that says so", async () => {
  const down = createPreview({ upstream: "http://127.0.0.1:9", here: () => "" });
  await new Promise((r) => down.listen(0, "127.0.0.1", r));
  const res = await fetch(`http://127.0.0.1:${down.address().port}/`);
  assert.equal(res.status, 502);
  assert.match(await res.text(), /Start the app or server first/);
  down.closeAllConnections();
  down.close();
});

test("useLocalKilt leaves a page without the Kilt alone", () => {
  const html = '<link href="https://example.com/a.css" integrity="sha384-x" crossorigin>';
  assert.equal(useLocalKilt(html), html);
});
