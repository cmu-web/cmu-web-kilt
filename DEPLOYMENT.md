# Deployment

Maintainers publish two things from this repository: versioned kit files
and the documentation site. Publishing the docs can expose changes before
a release, so check which path a change takes.

| Change                    | Publication Trigger           | What Changes for Users                                             |
| ------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| Documentation or examples | Push to `0.x`                 | The GitHub Pages site updates, using the current repository assets |
| Kit release               | Push an annotated version tag | The tagged files become available through jsDelivr and GitHub      |
| Rails gem                 | Push an annotated version tag | The same version becomes available on RubyGems                     |

Application installation belongs in the
[installation guide](https://webkilt.andrew.cmu.edu/0/install.html).
This guide covers the maintainer's publishing work.

## Publish a Release

First complete [release preparation](DEVELOPMENT.md#prepare-a-release).
Confirm that the release commit is on `0.x`, the working tree is clean
and the checks have passed. From that commit:

```bash
kit_version=$(node -p 'require("./package.json").version')
git tag -a "$kit_version" -m "Carnegie Mellon Web Kilt $kit_version"
git push origin 0.x "$kit_version"
```

Tags have no `v` prefix. The push publishes the files through GitHub and
makes them available to jsDelivr; it also triggers the documentation build
for `0.x`, and the Rails gem's publication to RubyGems. It does not update
applications that already use the kit.

### RubyGems Publishing

The [Publish Gem workflow](.github/workflows/publish-gem.yml) publishes the gem from
each version tag with trusted publishing, so there's no API key. RubyGems.org
trusts it as: GitHub Actions, owner `cmu-web`, repository `cmu-web-kilt`,
workflow `publish-gem.yml` and environment `rubygems`. Renaming the workflow file
stops publishing until that trusted publisher is changed to match.

### Check a Release

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

### Correct a Bad Release

Keep the published tag intact. jsDelivr caches versioned files, and
consumers rely on those contents staying stable. Make the correction in a
new patch release and explain which version it replaces in the release notes.
An application rolling back restores its previous version and that
version's files or integrity hashes.

## Publish the Documentation

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
