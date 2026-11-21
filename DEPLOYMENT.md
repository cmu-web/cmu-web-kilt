# Deployment

## Release Files

Each version tag (e.g., `0.8.18`) publishes:

- **The browser files,** through jsDelivr at
  `https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@X.Y.Z/` plus
  `css/cmu-cms.css`, `css/cmu-app.css` or `js/cmu-app.js`. A tagged file
  never changes, so pages can pin it with an integrity hash; the
  [installation guide](https://webkilt.andrew.cmu.edu/0/install.html) has
  the tags with their hashes. Use these readable files; minified variants
  have different bytes and hashes.
- **The Rails gem,** `cmu-web-kilt`, at the same version, with the same
  files the CDN serves; see [its README](packages/rails/README.md).
- **The docs,** in `docs/` at that tag. webkilt.andrew.cmu.edu serves each
  template line's docs under its own number (line 0 at `/0/`), each from a
  pinned release tag; its root goes to the newest line.

## Install

The [installation guide](https://webkilt.andrew.cmu.edu/0/install.html)
covers each way in: a CMS such as Cascade, an app with or without a
framework, a prototype and Rails. Pages load CMU's template from
www.cmu.edu first, then the kit's files.

### Update

Change the pinned version and its integrity hashes (or `bundle update
cmu-web-kilt` for the gem), then check the affected pages. A release's notes
give migration steps for any incompatible change. To roll back, restore the
previous version and its files or hashes.

### Serve the Docs

The docs are static. Copy `docs/` to the site's root, then add the kit's
`css/` and `js/` beside it, as `npm run docs` serves them locally.
