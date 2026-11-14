# Development

The docs are the kit's working environment: edit a component, see it on a
real CMU page and inspect the same markup a user will copy. This guide
follows that cycle. For what belongs in the kit, start with
[Contributing](CONTRIBUTING.md).

## Get a Page Running

Use the Node version in [`.node-version`](.node-version). From the checkout:

```bash
npm ci
npx prek install
npm run docs
```

Open http://127.0.0.1:8123/. Keep the server running while you edit and
reload the page to see changes. To use another port, run
`npm run docs -- 9000`.

There is no browser asset build. The server serves `docs/` as the site root
and supplies the kit's files under `css/` and `js/`, matching the published
layout. An HTML file opened directly from disk does not reproduce that setup.

## Where to Make Changes

| To Change                                | Start Here                 |
| ---------------------------------------- | -------------------------- |
| Components for CMS pages and apps        | `css/cmu-cms.css`          |
| Components intended for apps             | `css/cmu-app.css`          |
| Component behavior                       | `js/cmu-app.js`            |
| Documentation and live examples          | HTML pages in `docs/`      |
| The docs site's styling and behavior     | `docs/css/` and `docs/js/` |
| The preview server, generators or checks | `tools/`                   |
| The Rails gem                            | `packages/rails/`          |

## Make the Change Where It Belongs

For a component change, start with its existing live example and follow it
to the source using the table above.

Keep reusable component behavior in the kit rather than making an example
work only through the docs script. New behavior should also work with
markup added after page load. Prefix kit classes, custom properties and
hooks with `cmu-`; use `--` for class modifiers.

### Make the Example the Source

A live example's markup becomes its copyable code sample. Edit that markup
once, inside `div.kit-demo`, with `<!-- prettier-ignore -->` immediately
before the wrapper. The docs script generates the displayed code.

For a new component, copy a neighboring reference section's structure:

- An `h2` with `id` followed by `class="rule-top"`, a component name and
  `span.kit-where` requirement labels
- A short explanation of when to use it
- A `p.kit-classes` listing the classes and variants
- A live example with enough content to show the behavior

Keep the heading's attribute order and requirement labels: the generators
use them to discover the component and list its dependencies. Use `h1`
for sections on pages with a hero; reference components use the `h2`
structure above. If adding a new reference page, add it to the `PAGES`
lists in both `tools/components.mjs` and `tools/data.mjs`.

Whole page examples use `div.kit-demo.kit-demo--wide` directly inside
`#content`. Follow them with `div.content.wide.kit-follow` containing
`p.cmu-note` notes. The docs script places their code and notes alongside
the section. Use an existing wide example as the starting point.

### Add CMS and Framework Notes

Each example's code has HTML, CMS and Framework tabs. Where a CMS or
framework requires its own steps, put a block right after the example:

- `div.kit-cms` with `data-cms="Cascade"` (or `"Another CMS"`), holding that
  CMS's steps. Without one, the tab says to paste the HTML, or that an App
  component isn't available there.
- `div.kit-framework` with `data-framework` naming one or more frameworks
  (`"React Svelte Vue"`). A note can write `{framework}` for the reader's
  framework. A block with a `pre` replaces the generated code; without one,
  the note sits above it.

Every other framework version is made from the example's HTML, React's as
JSX. The frameworks and their version labels are listed in
`docs/js/docs.js`, `tools/data.mjs` and the MCP server; change all three
together.

### Refresh What the Docs Generate

Run the commands that apply to the source you changed, in this order:

| When You Change                                                         | Run                  | Result                                               |
| ----------------------------------------------------------------------- | -------------------- | ---------------------------------------------------- |
| Component headings, requirements or class lists                         | `npm run components` | Updates the Components table                         |
| Page titles or descriptions                                             | `npm run opengraph`  | Updates link preview metadata                        |
| Components, examples, installation snippets, conventions or the version | `npm run data`       | Updates `docs/kit.json` for tools that read the docs |

Include generated changes with their source. Edit the source HTML to fix a
mistake in generated content. Markdown-only edits skip these generators.

## Check the Result

Preview the changed example with realistic amounts of content and use its
controls with a keyboard. For CSS changes, compare every docs page before
and after at 1300px and 390px: shared rules can affect examples you didn't
edit. Check for horizontal overflow and disable template transitions before
comparing computed styles.

Then format the changes and run validation:

```bash
npm run format
npm run check
```

Review the diff after formatting. Live examples retain their own formatting
because of the ignore markers. Additional ignore markers are sometimes
needed where template elements must touch without whitespace; explain
those exceptions in a comment.

The full check runs linting, formatting, release version and integrity
checks, template class collision checks and validation of generated docs.
It fetches CMU's live template CSS, so it runs with network access. CI runs the same
command, including a weekly run to detect template changes.

### When a Check Fails

| Failure                               | Next Step                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Lint or formatting                    | Run `npm run lint:fix` or `npm run format`, then review the diff                                |
| Generated content is stale            | Run its generator above and include the output                                                  |
| A live example lacks an ignore marker | Add it immediately before `div.kit-demo`                                                        |
| A version or integrity hash differs   | Check against `package.json`; keep published release hashes intact while editing browser assets |
| The template defines a kit class      | Inspect the template change and resolve the overlap before releasing                            |
| The template cannot be fetched        | Restore network access and rerun the check                                                      |

`npm run lint` and `npm run format:check` check without changing files.
The hooks installed during setup run a subset of validation when you
commit; run the full check before submitting. To run the hooks manually,
use `npx prek run --all-files`.

## Maintain the CMU Web Preview

The CMU Web projects each publish `/images/cmu-web-preview.webp` for the
other projects' cards and gallery entries. In this repository, that file
is `docs/images/cmu-web-preview.webp`. Keep it a clean landscape screenshot
at 1040 by 656 pixels, without the decorative browser frame; the cards add
that frame themselves.

Replace the image at the same path when the site changes. Consumers link
the owning project's public URL, so they don't copy the image or release an
update. Use general alt text on those cards.
This asset is independent of the Open Graph image, `images/preview.jpg`.

## Work on the Rails Package

The gem lives in `packages/rails/`. For engine or packaging changes,
install Ruby and Bundler, then run:

```bash
cd packages/rails
bundle install
bundle exec rake test build
```

Asset edits belong in the kit's `css/` and `js/`; never edit the gem's
copies. `rake assets` (run by `test` and `build`) copies those files, the
license and the version from `package.json` into the gem, and the build
writes to `packages/rails/pkg/`. `rake clean` removes the copies, so a path
gem uses the repository's files again. See
[the gem's README](packages/rails/README.md#compatibility-and-integration-coverage)
for integration coverage and [the CI workflow](.github/workflows/check.yml)
for the test matrix.

## Prepare a Release

Start on an up-to-date `0.x` with passing CI and a clean working tree.
Choose a patch for fixes, a minor version for additions or a major version
for incompatible changes to public classes, custom properties or hooks.

Run the release tool with the next version in place of `X.Y.Z`:

```bash
npm run release -- X.Y.Z
npm run data
npm run format
npm run check
```

The release tool updates `package.json`, versioned installation examples
and integrity hashes from the browser files. Regenerating the component
data afterward gives tools the same version and installation snippets.
Run the Rails checks too: every release tag publishes the gem.

Review and commit the complete release preparation. Prepare release notes
that explain user-visible changes and give migration steps for incompatible
changes. Continue with [publishing and verification](DEPLOYMENT.md#publish-a-release).
