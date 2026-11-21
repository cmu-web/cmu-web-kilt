// Browser test for js/cmu-app.js: Escape closes the template's menu, once,
// including under Turbo, which runs the template's scripts again on every
// page it shows and so adds another of their Escape listeners each time. It
// needs Playwright's Chromium and the network (the template's scripts load
// from www.cmu.edu, Turbo from jsDelivr).
//   npx playwright install chromium   (once)
//   npm run test:browser
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
/* global document, window */

const root = new URL("../", import.meta.url);
const TURBO = "https://cdn.jsdelivr.net/npm/@hotwired/turbo@8.0.12/dist/turbo.es2017-umd.js";
const TEMPLATE = "https://www.cmu.edu/common/standard-v6";
const SCRIPTS = [
  `${TEMPLATE}/js/list.min.js`,
  `${TEMPLATE}/js/jquery-1.10.1.min.js`,
  `${TEMPLATE}/js/main.6.7.min.js`,
];

// A docs page's header, content, footer and menu, without its scripts, as a
// server sends a page body before any script has changed it
const docsPage = await readFile(new URL("docs/quirks.html", root), "utf8");
const body = docsPage.slice(
  docsPage.indexOf(">", docsPage.indexOf("<body")) + 1,
  docsPage.indexOf(`<script src="${SCRIPTS[0]}"`),
);

// Numbered pages that link to the next one, with Turbo, as a Rails app has
// it, and the kit's script once in the head with defer, as the Rails install
// loads it. Under /plain/ the kit is left out, to show the template alone.
function page(kit, number) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Page ${number}</title>
  <link href="${TEMPLATE}/css/main.6.7.min.css" rel="stylesheet">
  <link href="/css/cmu-cms.css" rel="stylesheet">
  <link href="/css/cmu-app.css" rel="stylesheet">
  <script src="${TURBO}"></script>
  ${kit ? '<script src="/js/cmu-app.js" defer></script>' : ""}
</head>
<body class="no-js">${body}
  <p><a id="next" href="${kit ? "/kit" : "/plain"}/${number + 1}">Next Page</a></p>
  ${SCRIPTS.map((src) => `<script src="${src}"></script>`).join("\n  ")}
</body>
</html>`;
}

let server, browser, base;
before(async () => {
  server = createServer(async (req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    const numbered = path.match(/^\/(kit|plain)\/(\d+)$/);
    if (numbered) {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(page(numbered[1] === "kit", Number(numbered[2])));
    }
    if (/^\/(css|js)\/[\w.-]+$/.test(path)) {
      try {
        const type = path.endsWith(".css") ? "text/css" : "text/javascript";
        const file = await readFile(new URL(path.slice(1), root));
        res.writeHead(200, { "content-type": type });
        return res.end(file);
      } catch {
        // fall through to 404
      }
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  server?.close();
});

// The next page, through its link: Turbo swaps in its body and runs the
// template's scripts again, while the document and its listeners stay. The
// template's script takes no-js off the body when it has run.
async function visit(tab) {
  const title = `Page ${Number((await tab.title()).split(" ")[1]) + 1}`;
  // The menu, open on a wide window, covers the page; follow the link anyway
  await tab.$eval("#next", (a) => a.click());
  await tab.waitForFunction(
    (t) => document.title === t && !document.body.classList.contains("no-js"),
    title,
  );
  assert.equal(await tab.evaluate(() => !!window.Turbo), true, "Turbo made the visit");
  await settle(tab);
}

// The template finishes setting up the menu a moment after it runs (a wide
// window opens it), so wait until the menu stays the same for half a second
async function settle(tab) {
  await tab.waitForFunction(
    () =>
      new Promise((resolve) => {
        const before = document.body.className;
        setTimeout(() => resolve(document.body.className === before), 500);
      }),
  );
}

const menuOn = (tab) => tab.evaluate(() => document.body.classList.contains("menu-on"));
// Opens or closes the menu the way its buttons do. The template shows its
// button in the roof, a copy at the top of the menu or both, depending on the
// window, so the test uses the toggle they call. A wide window opens the
// menu on load.
const toggleMenu = (tab) => tab.evaluate(() => window.cmuHelpers.toggleNav(true));

// Opens the menu if it isn't, then presses Escape; true if it closed
async function escapeCloses(tab) {
  if (!(await menuOn(tab))) await toggleMenu(tab);
  await settle(tab);
  assert.equal(await menuOn(tab), true, "the menu is open");
  await tab.keyboard.press("Escape");
  await settle(tab);
  return !(await menuOn(tab));
}

test("without the kit, Escape doesn't close the menu", async () => {
  // The template's Escape listener calls its toggle without the argument that
  // makes it act, so it does nothing, on any visit
  const tab = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await tab.goto(`${base}/plain/1`, { waitUntil: "load" });
  await settle(tab);
  assert.equal(await escapeCloses(tab), false, "first visit");
  await visit(tab);
  assert.equal(await escapeCloses(tab), false, "second visit");
  await tab.close();
});

test("with the kit, Escape closes the menu on every visit", async () => {
  const tab = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await tab.goto(`${base}/kit/1`, { waitUntil: "load" });
  await settle(tab);
  for (let visits = 1; visits <= 4; visits++) {
    if (visits > 1) await visit(tab);
    assert.equal(await escapeCloses(tab), true, `visit ${visits}`);
    const pressed = await tab.getAttribute(".roof .menu-btn", "aria-pressed");
    assert.equal(pressed, "false", `visit ${visits}: the button says the menu is closed`);
  }
  await tab.close();
});

test("with the menu closed, Escape reaches the page's own listeners", async () => {
  const tab = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await tab.goto(`${base}/kit/1`, { waitUntil: "load" });
  await settle(tab);
  await visit(tab);
  if (await menuOn(tab)) await toggleMenu(tab);
  await settle(tab);
  await tab.evaluate(() => {
    window.escapes = 0;
    document.addEventListener("keyup", (e) => {
      if (e.key === "Escape") window.escapes++;
    });
  });
  await tab.keyboard.press("Escape");
  assert.equal(await tab.evaluate(() => window.escapes), 1);
  assert.equal(await menuOn(tab), false);
  await tab.close();
});
