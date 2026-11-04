# Development

The kit is plain CSS and one browser script, with no build step. Its docs
are static HTML pages that use the files in place. The command-line tools
in `tools/` and the checks need Node; nothing else does.

## Setup

Use the Node version in `.node-version` (the current LTS line). Install the
development tools and enable the pre-commit hooks once per checkout:

```bash
npm ci
npx prek install
```

## View the Docs

Serve the repository root, not `docs/`, since the docs load `../css/` and
`../js/`:

```bash
python3 -m http.server 8123
```

Then open http://127.0.0.1:8123/docs/. The server caches nothing itself,
but browsers do: hard-refresh after changing CSS or JavaScript.

## Checks

### Pre-commit Hooks

The hooks in `.pre-commit-config.yaml` run ESLint and Prettier's check on
every commit. When the docs, README or `package.json` change, they also
check that every version in an example matches `package.json`, and that the
Components table is up to date. If a hook fails, fix what it reports and
commit again. To run them all by hand:

```bash
npx prek run --all-files
```

### Full Validation

```bash
npm run check
```

This runs ESLint, Prettier's check, the version and Components table
checks and the template check: it downloads CMU's live template CSS and
fails if the template has started defining a class name the kit uses. CI
runs the same command on every push and pull request, and weekly, since the
template can change on its own.

### Linting and Formatting

ESLint (`eslint.config.mjs`) checks the kit's script, the docs' script
and the tools with the recommended rules. Prettier (`.prettierrc.json`)
formats CSS, JavaScript, Markdown, JSON, YAML and the docs' HTML.

Two kinds of HTML are marked `<!-- prettier-ignore -->` so Prettier leaves
them as written:

- **Every live example** (`<div class="kit-demo">`). The docs show each
  example's markup as its code sample, so it stays the way people should
  copy it.
- **Places where the template needs elements to touch**, outside an
  example: a sidebar right after the content's `</div>`, and a header logo
  right after the site name's `</div>`. Whitespace between them breaks the
  layout. Only the sample page has these; say why in a comment above the
  mark.

Prettier's HTML formatting otherwise changes no pixels; compare screenshots
of a page before and after if you're unsure.

```bash
npm run lint:fix
npm run format
```

Review the diff afterward.

## Writing Components

See [CONTRIBUTING.md](CONTRIBUTING.md#rules-for-components) for what belongs
in the kit. To add one:

1. Add its rules to `css/cmu-cms.css` (anything a Cascade page could use)
   or `css/cmu-app.css` (only apps), with a short comment saying what it
   is. Check the template first: if it already does the job, document the
   template's class instead.
2. Add a section to the right docs page: an `<h2 id="…" class="rule-top">`,
   a paragraph on when to use it, a `p.kit-classes` listing its classes,
   and a live example inside `<div class="kit-demo">`, with a
   `<!-- prettier-ignore -->` line right before it. The docs' script shows
   each example's markup under it, so write the example once.
   For a whole page section (a color band, a grid, content with a sidebar),
   make it a wide example instead: close the page's text block, add
   `<div class="kit-demo kit-demo--wide">` directly in `#content` and open
   a new text block after it. It runs the full width like a real section.
   Notes about it go in a `<div class="content wide kit-follow">` right
   after it, as `<p class="cmu-note">`. When the section has a background,
   the docs' script moves its code and those notes inside it, so the color
   and pattern run unbroken; otherwise the code goes at the top of the text
   block after it.

   ```bash
   npm run components
   ```

3. Check it at desktop and phone widths, with nothing scrolling sideways.

Behavior goes in `js/cmu-app.js`, hooked onto a `data-cmu-*` attribute and
working on markup added later. Pages load it after the template's scripts.

## Folders

Named the way CMU's own sites name them (`/common/standard-v6/css/`,
`/common/standard-v6/js/`, `/common/standard-v6/images/`):

| Path         | What                                                               |
| ------------ | ------------------------------------------------------------------ |
| `css/`       | The kit's stylesheets: `cmu-cms.css` and `cmu-app.css`             |
| `js/`        | The kit's browser script, `cmu-app.js`                             |
| `docs/`      | The docs site: pages, plus their own `css/`, `js/` and `images/`   |
| `tools/`     | Command-line tools: the checks, the Components table and releasing |
| `index.html` | Sends the GitHub Pages root to `docs/`                             |

`js/` is only for browser JavaScript, never `javascript/` or `scripts/`.
Images go in `images/`, never `img/`. A `scripts/` folder, where a project
has one, is only for command-line and operations scripts.

## Releasing

Releases follow semver. A patch fixes things, a minor version adds
components or behavior and a major version renames or removes a class,
custom property or `data-cmu-*` hook.

1. Release from an up-to-date `main` whose latest CI run passed.
2. Set the version in `package.json` and in every example in the docs and
   README:

   ```bash
   npm run release -- 0.2.0
   ```

3. Commit, tag and push, as the command prints:

   ```bash
   git commit -am "chore: release 0.2.0"
   git tag -a 0.2.0 -m "Carnegie Mellon Web Kit 0.2.0"
   git push origin main 0.2.0
   ```

   Tags have no `v`, so the jsDelivr addresses read `@0.2.0`.

4. [Check the release on jsDelivr](DEPLOYMENT.md#check-a-release).
5. On GitHub, publish release notes from the tag. For a major version,
   list every renamed or removed class.
