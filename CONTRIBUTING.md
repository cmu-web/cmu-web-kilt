# Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for setup, checks and releasing, and
[DEPLOYMENT.md](DEPLOYMENT.md) for how releases reach jsDelivr.

## Issues

For a problem, include the page or app, the browser, what happened and
what you expected; a screenshot helps. For a new component, describe where
you'd use it and link a CMU page that does something like it. Check
existing issues first.

## Pull Requests

Branch from `main` and open pull requests against `main`. Keep each one to
a single concern, and explain the problem and the result. Run the
[checks](DEVELOPMENT.md#checks) and enable the
[pre-commit hooks](DEVELOPMENT.md#pre-commit-hooks) before submitting.
Update the docs whenever a component changes.

## Rules for Components

- **The template comes first.** Link CMU's template CSS and use its
  classes as they are: `btn`, `btn small`, `ghost`, `cta`,
  `table.alternate`, `.sidebar`, `.sr-only`. Never copy its rules or
  values. Add a component only for what the template doesn't already do, and prefer
  the template's own spacing to an override.
- **Prefix `cmu-`** for every class, custom property (`--cmu-red`) and
  JavaScript hook (`data-cmu-copy`). Modifiers use `--` (`cmu-pill--green`).
- **`cmu-cms.css`** is for anything a Cascade page could use;
  **`cmu-app.css`** and **`cmu-app.js`** are for what only apps need.
- **Every component gets a docs section** with a live example, checked at
  desktop and phone widths.
- **Base it on CMU's pages.** Name a CMU page that does something like it
  when you can, and use made-up content in examples, never real people's
  data.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Style

Prettier formats CSS, JavaScript, Markdown, JSON, YAML and the docs' HTML
(except the live examples) and ESLint checks the JavaScript; see
[linting and formatting](DEVELOPMENT.md#linting-and-formatting).

For the docs and for text in examples, follow the
[writing conventions](https://cmu-web.github.io/cmu-web-kit/docs/about.html#writing):
Title Case for headings, buttons and labels; buttons and calls to action
that start with a verb; and the Oxford comma. Otherwise, follow the
[GitHub Docs style guide](https://docs.github.com/en/contributing/style-guide-and-content-model/style-guide)
and, for grammar and punctuation, the
[Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/).
