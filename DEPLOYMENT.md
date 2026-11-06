# Deployment

The kit has no server. A release is a Git tag, and three places serve it:
jsDelivr for pages that link the kit, GitHub for apps that install it and
webkilt.andrew.cmu.edu for the docs, with a test copy on GitHub Pages. [DEVELOPMENT.md](DEVELOPMENT.md#releasing)
covers making a release; this page covers where it goes and how to check it.

## jsDelivr

jsDelivr serves any tag of a public GitHub repository, with no account or
upload: pushing the tag is the whole deployment. Each file has a fixed
address:

```text
https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.2.2/css/cmu-cms.css
https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.2.2/css/cmu-app.css
https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.2.2/js/cmu-app.js
```

Cascade sites put the first in their head block; apps and static pages
link all three. The docs and README show these addresses for the current
version, and `npm run release` updates them.

### Check a Release

A tag can take a few minutes to appear. Check that each file answers before
announcing the release:

```bash
V=0.2.2
for f in css/cmu-cms.css css/cmu-app.css js/cmu-app.js; do
  curl -fsI "https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@$V/$f" | head -1
done
```

Each line should read `HTTP/2 200`.

### Never Move a Tag

jsDelivr caches a version's files for a long time, and pages link them
expecting them never to change. Don't delete, move or re-push a released
tag. If a release has a mistake, fix it on `main` and release a patch
version.

If a file was served before its tag was right, for example while the tag
was being created, purge it once per file:

```bash
curl -s "https://purge.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.2.2/css/cmu-cms.css"
```

### Minified Files and Integrity Hashes

jsDelivr minifies on request: ask for `cmu-cms.min.css` or `cmu-app.min.js`
in the same folder. The repository keeps only the readable files.

Because a version's files never change, a page can add an
[integrity hash](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
so the browser refuses a file that doesn't match:

```bash
curl -fsSL "https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.2.2/css/cmu-cms.css" \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

Use it as `integrity="sha384-…" crossorigin="anonymous"` on the `<link>` or
`<script>`. Compute it from the exact address the page uses; the minified
file has a different hash.

## GitHub

Node apps install a tag straight from GitHub; the package isn't published
to the npm registry:

```bash
npm install github:cmu-web/cmu-web-kilt#0.2.2
```

`package.json` limits the install to `css/` and `js/`. Apps on other stacks
copy a release's files from jsDelivr into their own static folder, as the
[Install](https://webkilt.andrew.cmu.edu/install.html) page
shows.

## The Docs Site

The docs are served at the site's root, with the kit's own `css/` and `js/`
beside the docs' own `css/` and `js/`. The pages link `css/cmu-cms.css` and
the rest, so they always show the kit as it is in the repo, released or not.

The [Pages workflow](.github/workflows/pages.yml) builds that layout from
`main` and publishes it at https://cmu-web.github.io/cmu-web-kilt/ within a
minute or two of each push (the repository's Pages source is set to GitHub
Actions). That copy is for testing; webkilt.andrew.cmu.edu serves the same
layout: `docs/` as the root, and the repository's `css/*.css` and `js/*.js`
in its `css/` and `js/`.

Pages is for the docs and for trying unreleased changes. Production pages
link a released version on jsDelivr instead: anything on Pages changes the
moment `main` does.

## Moving the Kit's Own Sites to a New Version

After a release, update the places that pin it:

- **Cascade sites** using the kit: the version in the head block's `<link>`.
- **Apps that install it:** the tag in `package.json`, then `npm install`.
- **Apps that copy it:** the files in their vendor folder.

Check each site after the change, on staging first for Cascade. For a major
version, check the release notes for renamed or removed classes first.
