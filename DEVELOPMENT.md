# Development

Set up your computer once with
[Working on CMU Web Projects](https://github.com/cmu-web/.github/blob/main/DEVELOPMENT.md);
this page covers this project's own commands.

The docs are the kit's working environment: edit a component, see it on a
real CMU page and inspect the same markup a user will copy. This guide
follows that cycle. For what belongs in the kit, start with
[Contributing](CONTRIBUTING.md).

## Run It

Use the Node version in [`.node-version`](.node-version). From the checkout:

```bash
npm ci
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
| The Python package                       | `packages/python/`         |

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

`data-demo-skip` on an element leaves it out of the copied code, such as a
control that only works in the docs. A sidebar component can put its
description and its `p.kit-classes` in the demo's content column, beside the
sidebar, each marked `data-demo-skip` and followed by a plain placeholder
("Your page's content."); `tools/data.mjs` reads them from there when nothing
comes before the demo.

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
| The Gallery's sites, in `docs/gallery.json`                             | `npm run gallery`    | Updates the Gallery's cards                          |
| Components, examples, installation snippets, conventions or the version | `npm run data`       | Updates `docs/kit.json` for tools that read the docs |

Include generated changes with their source. Edit the source HTML to fix a
mistake in generated content. Markdown-only edits skip these generators.

## Check a Change

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

The everyday check is `npm run check`: it needs nothing beyond `npm ci`, plus
network access, since it fetches CMU's live template CSS. It runs linting,
formatting, release version and integrity checks, template class collision
checks, validation of generated docs and the tools' own tests. The Check Code
workflow runs the same command on every push and pull request, and weekly to
catch template changes, and also runs the Rails package's tests (see
[Work on the Rails Package](#work-on-the-rails-package)).

Browser tests are their own command, `npm run test:browser`. They need
Playwright's Chromium (`npx playwright install chromium`, once) and the
network, since they load the template's scripts and Turbo. Run them when you
change `js/cmu-app.js`; the Check Code workflow runs them too.

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

## Try a Change in Another Project

To see an unreleased change in a project that loads the kit from jsDelivr,
put the preview proxy in front of the project. Start the project as usual,
then, from this checkout:

```bash
npm run preview -- --proxy http://localhost:3000
```

It serves the project at http://127.0.0.1:4100/ (`--port` for another)
with the page's kit links pointed at this checkout, on whatever branch is
checked out. Reload to see each change. The project itself is untouched:
its own address still shows the released kit.

For a folder of static pages, start a server for it first, such as
`python3 -m http.server 4200` in that folder, and proxy that.

A project keeps the command in a `preview:kilt` npm script or its README,
with the right port. It doesn't cover a project that keeps its own copy of
the kit (a Rails app on the gem, or a vendored release); point those at
this checkout their own way, such as the Gemfile's `path:` option.

## Maintain the CMU Web Preview

The CMU Web projects each publish `/images/cmu-web-preview.webp` for the
other projects' cards and gallery entries. In this repository, that file
is `docs/images/cmu-web-preview.webp`. Keep it a clean landscape screenshot
at 1040 × 656 pixels, without the decorative browser frame; the cards add
that frame themselves.

To make it, capture the published home page with FencePost's gallery
command, from a FencePost checkout. It takes the public page at 1040 × 656,
signed out, with the menu closed:

```bash
npm run gallery -- https://webkilt.andrew.cmu.edu/0/ /path/to/cmu-web-kilt/docs/images/cmu-web-preview.webp
```

Replace the image at the same path when the site changes. Consumers link
the owning project's public URL, so they don't copy the image or release an
update. Use general alt text on those cards.
This asset is independent of the Open Graph image, `images/preview.jpg`.

## Work on the Rails Package

The gem lives in `packages/rails/`: the asset engine, the kit's layout and
its helpers (`app/views/`, `lib/cmu_web_kilt/`), the install generator
(`lib/generators/`) and the template for new apps (`templates/app.rb`). For
changes to any of them, install Ruby and Bundler, then run:

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
for integration coverage and [the Check Code workflow](.github/workflows/check-code.yml)
for the test matrix.

The tests render the layout in a small app (`test/layout_app.rb`) and run
the generator in a throwaway one (`test/generator_app.rb`) without
installing anything. Before a release that changes the layout, the
generator or the template, also make a real app from the template with the
checkout, and run its own checks:

```bash
CMU_WEB_KILT_PATH="$PWD/packages/rails" CMU_WEB_STYLE_PATH="$PWD/../cmu-web-style" \
  CMU_SITE_NAME="Spring Carnival Sweepstakes" CMU_TABS="Teams,Drivers,Heats" CMU_SIGN_IN=entra \
  rails new /tmp/sweepstakes -m packages/rails/templates/app.rb
cd /tmp/sweepstakes && bin/rails test && bin/rubocop && bundle exec erb_lint --lint-all
```

`CMU_WEB_STYLE_PATH` points at a checkout of `cmu-web-style`; leave it out
to use the released gem. The template's `KILT_VERSION` and its address in
the docs are set by `npm run release`.

## Publish the Docs

The [Publish Test Copy workflow](.github/workflows/publish-test-copy.yml) runs on pushes to `0.x`
and can be run manually. It copies `docs/` to the site root, then adds the
kit's CSS and JavaScript to the site's `css/` and `js/` folders. This is the
layout served locally by `npm run docs`.

After a push, check the Publish Test Copy workflow and open the changed pages at
https://cmu-web.github.io/cmu-web-kilt/0/. Check a live example as well as the
page text when assets changed. The public documentation address is
https://webkilt.andrew.cmu.edu/0/; hosting at that address is managed outside
the Publish Test Copy workflow in this repository. It serves each template line's docs
under its own number (line 0 at /0/), each from a pinned release tag, so
docs-only changes reach it with the next release. The site's root redirects
to the newest line; other paths outside a line are not found.

The Publish Test Copy workflow publishes independently of the Check Code workflow. Check a
change before pushing it to `0.x`; a later validation failure does not
undo publication. To correct a published docs change, push a follow-up fix
or revert. Keep release tags in place.

## Release

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

Review and commit the complete release preparation, and write release notes
that explain user-visible changes and give migration steps for incompatible
ones.

### Tag and Publish

Confirm that the release commit is on `0.x`, the working tree is clean
and the checks have passed. From that commit:

```bash
kit_version=$(node -p 'require("./package.json").version')
git tag -a "$kit_version" -m "Carnegie Mellon Web Kilt $kit_version"
git push origin 0.x "$kit_version"
```

Tags have no `v`. The push publishes the files through GitHub and
makes them available to jsDelivr; it also triggers the documentation build
for `0.x`, and the kit's publication to RubyGems, npm and PyPI. It does not update
applications that already use the kit.

### The Gem

The [Publish Gem workflow](.github/workflows/publish-gem.yml) publishes the gem from
each version tag with trusted publishing, so there's no API key. RubyGems.org
trusts it as: GitHub Actions, owner `cmu-web`, repository `cmu-web-kilt`,
workflow `publish-gem.yml` and environment `rubygems`. Renaming the workflow file
stops publishing until that trusted publisher is changed to match.

### Check the CDN

Verify the CDN contents from the checkout of the published tag. This Bash
example downloads each browser file and compares it with the tagged copy:

```bash
(
  set -eu
  kit_version=$(node -p 'require("./package.json").version')
  kit_check_dir=$(mktemp -d)
  trap 'rm -rf "$kit_check_dir"' EXIT
  for file in css/cmu-cms.css css/cmu-app.css js/cmu-app.js; do
    curl --fail --show-error --location \
      "https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@$kit_version/$file" \
      --output "$kit_check_dir/asset"
    cmp "$file" "$kit_check_dir/asset"
    printf 'Verified %s\n' "$file"
  done
)
```

Allow time for a new tag to become available. All three comparisons must
pass before announcing the release. Use the readable file URLs shown here;
minified variants have different bytes and integrity hashes.

Publish GitHub release notes from the tag once verification passes. Include
migration steps for breaking changes. Deployments can then update their
pinned version, dependency or vendored files and check the affected pages.

### npm

The [Publish npm workflow](.github/workflows/publish-npm.yml) publishes the
browser files and `package.json`, with the release's integrity hashes, to npm
as `@cmu-web/kilt` from each version tag, with trusted publishing and
provenance. npmjs.com trusts it as: GitHub Actions, owner `cmu-web`,
repository `cmu-web-kilt` and workflow `publish-npm.yml`. Apps that depend on
the package get a Dependabot pull request for each release. The package ships
the `cmu-web-kilt-links` command, which keeps an app's jsDelivr links and
hashes on the installed release (`--check` fails on a stale one).

### PyPI

The [Publish PyPI workflow](.github/workflows/publish-pypi.yml) publishes
the Python package, `cmu-web-kilt`, from each version tag, after its tests
pass. It carries the browser files, laid out as a Django app's static
files, and `package.json`, so the package's `VERSION` and `INTEGRITY` are
the release's. PyPI trusts the workflow as: GitHub Actions, owner `cmu-web`,
repository `cmu-web-kilt`, workflow `publish-pypi.yml` and environment
`pypi`. The package's first release needs a pending publisher with those
fields. `packages/python/hatch_build.py` copies the files and the version in
at build time; to check a change:

```bash
python -m pip install build
python -m unittest discover packages/python/tests
```

### Update Jekyll & Plaid

Jekyll & Plaid loads a default Web Kilt release, so a site built on it gets
the kit's changes only when that default moves. After the CDN check, in the
`cmu-web-jekyll-and-plaid` checkout:

1. Set the default to the new release in `_includes/cmu/settings.html`, and
   in the comment in `_layouts/default.html` that names it.
2. Build Jekyll & Plaid's docs (see its DEVELOPMENT.md) and look at a page.
3. Commit and push to `0.x`.

A site that loads Jekyll & Plaid's `0.x` branch, as the CMU Web home page
does, gets the new release with that push; other sites get it with Jekyll &
Plaid's next release.

### Correct a Bad Release

Keep the published tag intact. jsDelivr caches versioned files, and
consumers rely on those contents staying stable. Make the correction in a
new patch release and explain which version it replaces in the release notes.
An application rolling back restores its previous version and that
version's files or integrity hashes.
