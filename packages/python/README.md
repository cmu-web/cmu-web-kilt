# Carnegie Mellon Web Kilt for Python

The [Carnegie Mellon Web Kilt](https://webkilt.andrew.cmu.edu/) extends
Carnegie Mellon University's web template with page and app components.
This package carries one kit release: its stylesheets and script, and their
integrity hashes. Its version is the kit's version, so Dependabot or
Renovate can propose each release.

```console
pip install cmu-web-kilt
```

## Serve the Files From Django

Add the package to `INSTALLED_APPS`, and `collectstatic` picks up its
files:

```python
INSTALLED_APPS = [
    # ...
    "cmu_web_kilt",
]
```

```html
{% load static %}
<link href="{% static 'cmu-web-kilt/css/cmu-cms.css' %}" rel="stylesheet" />
<link href="{% static 'cmu-web-kilt/css/cmu-app.css' %}" rel="stylesheet" />
<script src="{% static 'cmu-web-kilt/js/cmu-app.js' %}"></script>
```

Outside Django, `cmu_web_kilt.STATIC_DIR` is the folder that holds `css/`
and `js/`.

## Link the Files on jsDelivr

`cdn_url` gives a file's address on jsDelivr for this release, and
`INTEGRITY` its hash, so the browser refuses a changed file:

```python
import cmu_web_kilt

for file in ("css/cmu-cms.css", "css/cmu-app.css"):
    print(
        f'<link href="{cmu_web_kilt.cdn_url(file)}" '
        f'integrity="{cmu_web_kilt.INTEGRITY[file]}" crossorigin="anonymous" rel="stylesheet">'
    )
```

`cmu_web_kilt.VERSION` is the release, such as for a page's footer or a
cache key.

## License

BSD 3-Clause. CMU's names, marks and artwork retain their own usage
requirements and are not covered by that license.
