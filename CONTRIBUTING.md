# Contributing

You can help by reporting a problem, improving an example, proposing a
component or sharing a site built with the kit. Start with the
[issue forms](https://github.com/cmu-web/cmu-web-kilt/issues/new/choose);
you don't need a code change to contribute.

## Bring a Use Case

For a bug, include the affected page or a small markup example, your
browser, what happened and what you expected. For a visual problem, include
a screenshot and the viewport size.

For a new component, describe the task it helps someone complete. Link a
CMU page that handles the task well if you know one. Discuss changes to
existing markup or behavior before implementing them: other sites may
already depend on it.

For the [gallery](https://webkilt.andrew.cmu.edu/0/gallery.html), use the
[Gallery form](https://docs.google.com/forms/d/e/1FAIpQLSdSdq2bVAyNyiUcqXex-Kr686RGS4_4pn0liGEi0cI9y48wHg/viewform) for a public site or app whose owner is happy to
have it listed. We take the screenshot from a public page; it must not expose
private information.

## Decide What Belongs in the Kit

The kit extends CMU's web template. Before proposing new CSS, check the
[component reference](https://webkilt.andrew.cmu.edu/0/components.html) and
[page layouts](https://webkilt.andrew.cmu.edu/0/layout.html) for an existing
solution. A useful addition should work beyond the page that prompted it
and fit alongside the template without changing unrelated pages.

Keep component markup, documentation and behavior together in the same
change. Existing class names, custom properties and `data-cmu-*` hooks are
interfaces used by other sites; explain any incompatible change and how
consumers would migrate.

The [conventions](https://webkilt.andrew.cmu.edu/0/conventions.html) are the
reference for naming, writing and page structure. Use them for the docs
and examples too, including AP style and made-up example content.

## Two Versions

The kit has two versions, each on its own long-lived branch:

- **`0.x`:** the current CMU template. Releases 0.x, docs at `/0/`.
- **`1.x`:** CMU's newer Drupal template (cmu_base). Releases 1.x, docs at `/1/`.

Issues for both live here, labeled `0.x`, `1.x` or both. An issue for both
versions gets a checklist, "Fixed in 0.x" and "Fixed in 1.x," and stays open
until both are done. The first commit says "Part of #12" and the second
"Fixes #12."

Code that doesn't depend on the template, such as most of `cmu-app.js`, goes
in its own commits, so it can be copied to the other branch cleanly. Styles
and docs that do depend on it stay on their own branch.

## Send a Change for Review

Use [Development](DEVELOPMENT.md) to set up a checkout and work through the
edit, preview and check cycle. Branch from the version's branch (see Two
Versions) and open the pull request against it, with one problem or addition
per pull request.

Explain what prompted the change, what a user will experience and how you
checked it. Include before-and-after screenshots for visual changes and
call out changes consumers need to make. Run the full checks before
submitting; passing checks supplement browser review of layout and behavior.

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
for commit subjects. Release preparation and publishing are maintainer
tasks, covered in [Development](DEVELOPMENT.md#prepare-a-release) and
[Deployment](DEPLOYMENT.md).
