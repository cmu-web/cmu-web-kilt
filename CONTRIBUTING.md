# Contributing

For setup and checks, see [Development](DEVELOPMENT.md).

## Report a Problem

Check existing issues first, then
[report a problem](https://github.com/cmu-web/cmu-web-kilt/issues/new?template=bug_report.yml).
For a visual problem, include a screenshot and the viewport size. You don't
need a code change to contribute.

To propose a component,
[request one](https://github.com/cmu-web/cmu-web-kilt/issues/new?template=feature_request.yml):
describe the task it helps someone complete, and link a CMU page that
handles the task well if you know one. Discuss changes to existing markup or
behavior before making them, since other sites may already depend on it.

For the [gallery](https://webkilt.andrew.cmu.edu/0/gallery.html), use the
[Gallery form](https://docs.google.com/forms/d/e/1FAIpQLSdSdq2bVAyNyiUcqXex-Kr686RGS4_4pn0liGEi0cI9y48wHg/viewform)
for a public site or app whose owner is happy to have it listed. We take the
screenshot from a public page; it must not expose private information.

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

**Example pages:** `docs/examples/` holds whole pages that don't fit inside
a docs page, such as an interstitial. An example people can click is shown
live in a frame (`kit-page-frame`); a static one is a screenshot.
Components stay live in the docs themselves.

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

## Submit a Pull Request

- Use [Development](DEVELOPMENT.md) to set up a checkout and work through the
  edit, preview and check cycle.
- Branch from the version's branch (see Two Versions) and open the pull
  request against it, with one problem or addition per pull request.
- Explain what prompted the change, what a user will experience and how you
  checked it.
- Include before-and-after screenshots for visual changes, and call out
  changes consumers need to make.
- Run `npm run check` before submitting (it needs network access). The Check
  Code workflow runs it again on the pull request, with the Rails package's
  tests. Passing checks supplement browser review of layout and behavior.

## Code and Writing Style

- Follow the Web Kilt's
  [conventions](https://webkilt.andrew.cmu.edu/0/conventions.html) for naming,
  writing and page structure, in the docs and examples too: AP style, and
  Title Case for headings, buttons and labels.
- **Example content:** Made-up people are Andrew Carnegie (ac00) first, then
  Margaret Morrison (mm00) and Andrew Mellon (am00). When an example needs an
  app, it's **Buggy**, a made-up site for the Spring Carnival Sweepstakes (the
  buggy races): teams, drivers, heats, roll times and race-day news. Older
  pages still use other scenarios; move them to Buggy when they next change.
- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
  for commit subjects.

## CMU's Names and Marks

CMU's names, marks and artwork aren't covered by the license. Use them only
as the project already does.
