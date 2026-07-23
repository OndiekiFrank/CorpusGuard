"""Guards the single source of truth for the version string.

If these fail, some surface has drifted away from corpusguard/__version__.py.
"""

import json
import re
from pathlib import Path

from corpusguard import __version__
from corpusguard.api.main import app

ROOT = Path(__file__).resolve().parent.parent


def test_api_matches_package_version():
    assert app.version == __version__


def test_health_endpoint_reports_package_version():
    from fastapi.testclient import TestClient
    r = TestClient(app).get("/api/v1/health")
    assert r.json()["version"] == __version__


def test_setup_py_parses_same_version():
    src = ROOT.joinpath("setup.py").read_text()
    # setup.py parses corpusguard/__version__.py, so importing the built
    # metadata is unnecessary here; assert it does not hardcode a different one.
    assert not re.search(r'version\s*=\s*"\d', src), "setup.py must not hardcode a version literal"


def test_frontend_package_json_in_sync():
    pkg = json.loads(ROOT.joinpath("frontend", "package.json").read_text())
    assert pkg["version"] == __version__
