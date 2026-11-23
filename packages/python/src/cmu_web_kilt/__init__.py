"""The Carnegie Mellon Web Kilt's browser files and integrity hashes.

As a Django app (add "cmu_web_kilt" to INSTALLED_APPS), its files are at
{% static "cmu-web-kilt/css/cmu-cms.css" %} and so on.
"""

from __future__ import annotations

import json
from pathlib import Path

__all__ = ["INTEGRITY", "STATIC_DIR", "VERSION", "cdn_url"]

_HERE = Path(__file__).resolve().parent
_MANIFEST = json.loads((_HERE / "package.json").read_text("utf-8"))

#: The kit's release, which is also this package's version
VERSION: str = _MANIFEST["version"]

#: Each file's subresource integrity hash, by path ("css/cmu-cms.css"), for
#: the release's copy on jsDelivr
INTEGRITY: dict[str, str] = dict(_MANIFEST["integrity"])

#: The folder that holds the release's css/ and js/
STATIC_DIR: Path = _HERE / "static" / "cmu-web-kilt"


def cdn_url(file: str) -> str:
    """The jsDelivr address of one of the release's files, such as
    "css/cmu-cms.css". Link it with INTEGRITY[file] as its integrity."""
    if file not in INTEGRITY:
        raise ValueError(f"{file!r} isn't one of the kit's files: {', '.join(INTEGRITY)}")
    return f"https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@{VERSION}/{file}"
