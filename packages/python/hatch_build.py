"""Copies the kit's browser files, manifest and license into the package and
takes the package's version from the kit's package.json.

In a checkout, the kit is the repository root, two folders up. An sdist
already carries the copies, so it builds without the repository."""

import json
import shutil
from pathlib import Path

from hatchling.metadata.plugin.interface import MetadataHookInterface

FILES = ["css/cmu-cms.css", "css/cmu-app.css", "js/cmu-app.js"]


class KitHook(MetadataHookInterface):
    def update(self, metadata: dict) -> None:
        here = Path(self.root)
        package = here / "src" / "cmu_web_kilt"
        kit = here.parent.parent
        manifest = kit / "package.json"
        if manifest.is_file() and json.loads(manifest.read_text("utf-8")).get("name") == "@cmu-web/kilt":
            for file in FILES:
                target = package / "static" / "cmu-web-kilt" / file
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(kit / file, target)
            shutil.copyfile(manifest, package / "package.json")
            shutil.copyfile(kit / "LICENSE", here / "LICENSE")
        metadata["version"] = json.loads((package / "package.json").read_text("utf-8"))["version"]
