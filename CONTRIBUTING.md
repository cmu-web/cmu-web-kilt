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

For the [gallery](https://webkilt.andrew.cmu.edu/gallery.html), submit a
public site or app whose owner is happy to have it listed. We take the
screenshot from a public page; it must not expose private information.

## Decide What Belongs in the Kit

The kit extends CMU's web template. Before proposing new CSS, check the
[component reference](https://webkilt.andrew.cmu.edu/components.html) and
[page layouts](https://webkilt.andrew.cmu.edu/layout.html) for an existing
solution. A useful addition should work beyond the page that prompted it
and fit alongside the template without changing unrelated pages.

Keep component markup, documentation and behavior together in the same
change. Existing class names, custom properties and `data-cmu-*` hooks are
interfaces used by other sites; explain any incompatible change and how
consumers would migrate.

The [conventions](https://webkilt.andrew.cmu.edu/conventions.html) are the
reference for naming, writing and page structure. Use them for the docs
and examples too, including AP style and made-up example content.

## Send a Change for Review

Use [Development](DEVELOPMENT.md) to set up a checkout and work through the
edit, preview and check cycle. Branch from `main` and open the pull request
against `main`, with one problem or addition per pull request.

Explain what prompted the change, what a user will experience and how you
checked it. Include before-and-after screenshots for visual changes and
call out changes consumers need to make. Run the full checks before
submitting; passing checks supplement browser review of layout and behavior.

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
for commit subjects. Release preparation and publishing are maintainer
tasks, covered in [Development](DEVELOPMENT.md#prepare-a-release) and
[Deployment](DEPLOYMENT.md).
