# Carnegie Mellon Web Kilt

The Carnegie Mellon Web Kilt (`cmu-web-kilt`) builds on Carnegie Mellon's web
template with components for a unified look across CMU websites and the web
apps around them: path cards, callouts, testimonials, embedded pages, status
pills, tabs, dialogs, file drop zones, bulk selection bars, copy buttons and
more. It works alongside the template without changing how it looks.

**Documentation and live examples: https://webkilt.andrew.cmu.edu/**

## Three Files

- `css/cmu-cms.css`: page components, for the CMS and apps alike
- `css/cmu-app.css`: app components, loaded after `cmu-cms.css`
- `js/cmu-app.js`: behavior for the components that need it, such as copy
  buttons

## Add It to the CMS

In Cascade, add this line to the text block your site's `setup` block puts
in the head, above your site's own stylesheet:

<!-- prettier-ignore -->
```html
<link href="https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.5.0/css/cmu-cms.css" integrity="sha384-jLB4PsCj8eJZzLvX09Rp//BaeUnjZFFNVOS3iVyZhktnIw9EkiZPVseQWE+Yjz/q" crossorigin="anonymous" media="screen" rel="stylesheet" type="text/css"/>
```

Then paste components into a content section's Source code view. The
[Install](https://webkilt.andrew.cmu.edu/install.html) page
walks through it step by step.

## Add It to an App

In the page's `<head>`, link CMU's template first, then the kit, then your
own stylesheet:

<!-- prettier-ignore -->
```html
<link href="https://www.cmu.edu/common/standard-v6/css/main.6.7.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.5.0/css/cmu-cms.css" integrity="sha384-jLB4PsCj8eJZzLvX09Rp//BaeUnjZFFNVOS3iVyZhktnIw9EkiZPVseQWE+Yjz/q" crossorigin="anonymous" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.5.0/css/cmu-app.css" integrity="sha384-47JHEYH0eYcLdN5TBfxjXH8Pep2phRVwi/F1EqzR+oM66o/7KGNVEubYiKV9QSGh" crossorigin="anonymous" rel="stylesheet">
<link href="/css/your-app.css" rel="stylesheet">
```

The kit's script goes just before `</body>`, after the template's scripts:

<!-- prettier-ignore -->
```html
<script src="https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@0.5.0/js/cmu-app.js" integrity="sha384-Etmkex3xbkUyRJUcASnyzfeR4g6yNwaWbaK+Z3sJvOxk76pCKgcYHAtNZppbmH8Z" crossorigin="anonymous"></script>
```

For an app in production, keep your own copy of a release instead; the
[Install](https://webkilt.andrew.cmu.edu/install.html) page
shows how for Node and other stacks.

## Versions

Every link names an exact version, so your pages never change until you
choose to move to a newer one. CDN links also carry an `integrity` hash of
that release's file, so browsers refuse a changed file; copy each line whole. See the
[releases](https://github.com/cmu-web/cmu-web-kilt/releases) for what each
version changed.

## About

The Office of the Vice Provost for Teaching and Learning Innovation built the
kit while rewriting the Syllabus Registry. Each component starts from a real
CMU page that already does it well; the
[About](https://webkilt.andrew.cmu.edu/about.html) page has more.

## License

The code and documentation are under the BSD 3-Clause License (see
`LICENSE`), copyright Carnegie Mellon University. It doesn't cover:

- **Carnegie Mellon's names and marks**, including the Scotty image in
  `docs/images/scotty.png` (the Scotty chatbot's avatar). The license grants
  no rights to them, and its third clause bars using the university's name
  to endorse or promote work derived from this code.
- **CMU's web template**, which the kit builds on. The university hosts it
  at www.cmu.edu/common/standard-v6; it isn't part of this repository.

## Questions and Requests

Missing a component, or found a problem?
[Open an issue](https://github.com/cmu-web/cmu-web-kilt/issues). To work on
the kit itself, see [CONTRIBUTING.md](CONTRIBUTING.md),
[DEVELOPMENT.md](DEVELOPMENT.md), and [DEPLOYMENT.md](DEPLOYMENT.md).
