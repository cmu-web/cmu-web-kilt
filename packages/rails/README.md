# Use the Kit in Rails

Use the asset gem when you want Rails to serve and fingerprint the kit's
files alongside your application's assets. It registers the stylesheets
and browser script and, for importmap apps, supplies a pin. Your layout
still loads CMU's template and decides which files to include.

The gem and its source repository are both named `cmu-web-kilt`; the gem
lives in the repository's `packages/rails/`. Each kit release publishes the
gem at the same version, with the same files the CDN serves.

## Connect Your Application

Add the gem to your application's `Gemfile`:

```ruby
gem 'cmu-web-kilt', '~> 0.6'
```

Run `bundle install` and restart Rails. Keep `Gemfile.lock` with your
application; `bundle update cmu-web-kilt` moves to a newer release.

To work on the kit and an app together, point the app at a checkout instead:

```ruby
gem 'cmu-web-kilt', path: '../cmu-web-kilt/packages/rails'
```

A checkout uses the kit's `css/` and `js/` at the repository root, so CSS
and JavaScript changes show up without building a gem. Switch back to the
released gem before deploying.

If the app already vendors the kit, remove the copied `cmu-cms.css`,
`cmu-app.css` and `cmu-app.js` files and their old includes. Matching asset
names can hide the gem's files, and loading the script twice installs
handlers twice.

## Include the Assets

Keep CMU's template first, the kit second and application styles last:

```erb
<link href="https://www.cmu.edu/common/standard-v6/css/main.6.7.min.css" rel="stylesheet">
<%= stylesheet_link_tag 'cmu-cms', 'cmu-app', 'application', 'data-turbo-track': 'reload' %>
```

Use `cmu-app` on `<body>` for a page with the CMU header and footer, or
`cmu-framed` for a page embedded in another tool. The
[app installation guide](https://webkilt.andrew.cmu.edu/0/install.html#apps)
explains the surrounding markup and template scripts. The gem supplies
neither the template nor fonts or optional icon libraries.

Choose one script loading method; either way, the kit's script runs after
the template's scripts:

### With Importmap

Keep `javascript_importmap_tags` in the layout. In
`app/javascript/application.js`, after any template script import, add:

```javascript
import "cmu-web-kilt";
```

The engine supplies the `cmu-web-kilt` pin for `cmu-app.js`. An application
pin with the same name overrides it.

### With a Script Tag

For an app without importmap, include the asset in the `<head>` with
`defer`:

```erb
<%= javascript_include_tag 'cmu-app', defer: true, 'data-turbo-track': 'reload' %>
```

In the `<head>`, Turbo loads it once and keeps it from page to page; a
script at the end of `<body>` would run again on every Turbo visit and
handle each interaction twice. Deferred, it still runs after the
template's scripts.

This also works alongside a JavaScript bundler. The gem registers Rails
assets; it does not add an npm module to the bundler's dependencies.

## Verify the Integration

Run `bin/rails assets:precompile` in your app. Then open a page using the
kit and check that the stylesheets and script load from Rails asset URLs,
that the template still loads first and that a component interaction works.
Test both a full page load and Turbo navigation if your app uses Turbo.
The kit's script handles Turbo visits and pages Turbo restores from its
cache (0.5.0 and later).

| Symptom                               | Check                                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Rails cannot find a kit asset         | Confirm the bundle includes the gem, restart Rails and check that the app has an asset pipeline |
| An edit in the checkout has no effect | Look for an old vendored file with the same name or an include still pointing at a CDN          |
| The import does not resolve           | Check the generated importmap for `cmu-web-kilt` and any application override of that pin       |
| An interaction happens twice          | Look for both an import and a script tag, or an old copy loaded alongside the gem               |

## Compatibility and Integration Coverage

The gem supports Ruby 3.2 and later with Rails 7.2 through 8.x. CI tests
Rails 7.2, 8.0 and 8.1 with Propshaft, on Ruby 3.2 and 3.4. The suite builds and unpacks the gem, serves its
assets and precompiles them, and checks importmap pins and application
overrides. It also checks booting without importmap or an asset pipeline.
Booting without a pipeline does not make asset helpers available.

The engine registers Sprockets assets too, but Sprockets is not covered by
the integration suite. Run your application's own precompilation and browser
checks when adopting the gem.

To change or build the package itself, follow
[Work on the Rails Package](https://github.com/cmu-web/cmu-web-kilt/blob/main/DEVELOPMENT.md#work-on-the-rails-package).
