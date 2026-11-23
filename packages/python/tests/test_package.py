"""Builds the sdist, then the wheel from it, installs the wheel in a new
virtual environment and checks what it carries against the kit.

    python -m unittest discover packages/python/tests

Needs the build package. KILT_RELEASE=1 also checks each file's hash against
the release's integrity map, which matches only at a release tag."""

import base64
import hashlib
import json
import os
import subprocess
import sys
import tarfile
import tempfile
import unittest
import venv
import zipfile
from pathlib import Path

PACKAGE = Path(__file__).resolve().parents[1]
KIT = PACKAGE.parents[1]
FILES = ["css/cmu-cms.css", "css/cmu-app.css", "js/cmu-app.js"]

PROBE = """
import json, cmu_web_kilt as k
print(json.dumps({
    "version": k.VERSION,
    "integrity": k.INTEGRITY,
    "static_dir": str(k.STATIC_DIR),
    "cdn_url": k.cdn_url("css/cmu-cms.css"),
}))
"""


class PackageTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        out = Path(cls.tmp.name)
        # With no target, build makes the sdist and then the wheel from it
        subprocess.run([sys.executable, "-m", "build", "--outdir", out / "dist", PACKAGE], check=True)
        cls.manifest = json.loads((KIT / "package.json").read_text("utf-8"))
        cls.wheel = next((out / "dist").glob("*.whl"))
        cls.sdist = next((out / "dist").glob("*.tar.gz"))
        venv.create(out / "venv", with_pip=True)
        python = out / "venv" / ("Scripts" if os.name == "nt" else "bin") / "python"
        subprocess.run([python, "-m", "pip", "install", "--quiet", "--no-index", cls.wheel], check=True)
        cls.found = json.loads(
            subprocess.run([python, "-c", PROBE], check=True, capture_output=True, text=True, cwd=out).stdout
        )

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_version_and_integrity_come_from_package_json(self):
        self.assertEqual(self.found["version"], self.manifest["version"])
        self.assertEqual(self.found["integrity"], self.manifest["integrity"])
        self.assertIn(f"cmu_web_kilt-{self.manifest['version']}-", self.wheel.name)

    def test_files_are_the_kits(self):
        static = Path(self.found["static_dir"])
        for file in FILES:
            self.assertEqual((static / file).read_bytes(), (KIT / file).read_bytes(), file)

    @unittest.skipUnless(os.environ.get("KILT_RELEASE"), "hashes match only at a release tag")
    def test_files_match_their_hashes(self):
        static = Path(self.found["static_dir"])
        for file in FILES:
            digest = base64.b64encode(hashlib.sha384((static / file).read_bytes()).digest()).decode()
            self.assertEqual(f"sha384-{digest}", self.found["integrity"][file], file)

    def test_cdn_url(self):
        self.assertEqual(
            self.found["cdn_url"],
            f"https://cdn.jsdelivr.net/gh/cmu-web/cmu-web-kilt@{self.manifest['version']}/css/cmu-cms.css",
        )

    def test_wheel_contents(self):
        names = set(zipfile.ZipFile(self.wheel).namelist())
        for name in ["cmu_web_kilt/__init__.py", "cmu_web_kilt/py.typed", "cmu_web_kilt/package.json"]:
            self.assertIn(name, names)
        for file in FILES:
            self.assertIn(f"cmu_web_kilt/static/cmu-web-kilt/{file}", names)
        self.assertTrue(any(name.endswith("licenses/LICENSE") for name in names))

    def test_sdist_builds_without_the_repository(self):
        names = {name.split("/", 1)[1] for name in tarfile.open(self.sdist).getnames() if "/" in name}
        for name in ["hatch_build.py", "LICENSE", "src/cmu_web_kilt/package.json"]:
            self.assertIn(name, names)
        for file in FILES:
            self.assertIn(f"src/cmu_web_kilt/static/cmu-web-kilt/{file}", names)


if __name__ == "__main__":
    unittest.main()
