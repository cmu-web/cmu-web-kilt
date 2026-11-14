# Deployment

Maintainers publish two things from this repository: versioned kit files
and the documentation site. Publishing the docs can expose changes before
a release, so check which path a change takes.

| Change                    | Publication Trigger           | What Changes for Users                                             |
| ------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| Documentation or examples | Push to `main`                | The GitHub Pages site updates, using the current repository assets |
| Kit release               | Push an annotated version tag | The tagged files become available through jsDelivr and GitHub      |
| Rails gem                 | Push an annotated version tag | The same version becomes available on RubyGems                     |

Application installation belongs in the
[installation guide](https://webkilt.andrew.cmu.edu/install.html).
This guide covers the maintainer's publishing work.

## Publish a Release

First complete [release preparation](DEVELOPMENT.md#prepare-a-release).
Confirm that the release commit is on `main`, the working tree is clean
and the checks have passed. From that commit:

```bash
kit_version=$(node -p 'require("./package.json").version')
git tag -a "$kit_version" -m "Carnegie Mellon Web Kilt $kit_version"
git push origin main "$kit_version"
```

Tags have no `v` prefix. The push publishes the files through GitHub and
makes them available to jsDelivr; it also triggers the documentation build
for `main`, and the Rails gem's publication to RubyGems. It does not update
applications that already use the kit.

### Set Up RubyGems Publishing

The [RubyGems workflow](.github/workflows/rubygems.yml) publishes the gem with
trusted publishing, so it needs no API key, but RubyGems.org has to trust it
first. Do this once, before the first tag that should publish the gem:

1. Sign in to RubyGems.org with an account that has multi-factor
   authentication on.
2. Under Trusted Publishers, add a pending trusted publisher for the gem
   `cmu-web-kilt`: GitHub Actions, owner `cmu-web`, repository
   `cmu-web-kilt`, workflow `rubygems.yml` and environment `rubygems`.

The first successful run creates the gem on RubyGems.org, owned by that
account. Until then, the workflow fails on each tag; the kit's own release
isn't affected.

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

The [Pages workflow](.github/workflows/pages.yml) runs on pushes to `main`
and can be run manually. It copies `docs/` to the site root, then adds the
kit's CSS and JavaScript to the site's `css/` and `js/` folders. This is the
layout served locally by `npm run docs`.

After a push, check the Pages workflow and open the changed pages at
https://cmu-web.github.io/cmu-web-kilt/. Check a live example as well as the
page text when assets changed. The public documentation address is
https://webkilt.andrew.cmu.edu/; hosting at that address is managed outside
the Pages workflow in this repository. It serves the docs from a pinned
release tag, so docs-only changes reach it with the next release.

The Pages workflow publishes independently of the check workflow. Check a
change before pushing it to `main`; a later validation failure does not
undo publication. To correct a published docs change, push a follow-up fix
or revert. Keep release tags in place.
