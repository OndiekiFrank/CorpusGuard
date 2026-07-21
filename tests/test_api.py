"""Smoke tests for the CorpusGuard FastAPI gateway.

Exercises every documented endpoint in-process via Starlette's TestClient,
which runs the scan BackgroundTask synchronously — so a scan is already
complete by the time POST /scan returns.
"""

import pytest
from fastapi.testclient import TestClient

from corpusguard.api.main import app

client = TestClient(app)


def _complete_scan_id():
    r = client.post("/api/v1/scan", json={"target_name": "Test RAG", "injection_budget": 50, "simulate": True})
    assert r.status_code == 200
    sid = r.json()["scan_id"]
    # TestClient executes the BackgroundTask before returning; poll defensively.
    for _ in range(20):
        s = client.get(f"/api/v1/scan/{sid}").json()
        if s["status"] == "complete":
            return sid
    pytest.fail("scan did not complete")


def test_health():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_scan_lifecycle_and_results():
    sid = _complete_scan_id()
    s = client.get(f"/api/v1/scan/{sid}").json()
    assert s["baseline_f1"] == 0.919
    assert s["attacked_f1"] < s["baseline_f1"]
    assert s["degradation_pct"] > 80
    assert s["log_anomalies"] == 0
    assert s["risk_score"] >= 70


def test_owasp_scorecard():
    sid = _complete_scan_id()
    r = client.get(f"/api/v1/owasp/{sid}")
    assert r.status_code == 200
    card = r.json()["owasp_llm_top10"]
    assert card["summary"]["total"] == 10
    assert any(f["id"] == "LLM01" and f["status"] == "FAILED" for f in card["findings"])


def test_report_is_pdf():
    sid = _complete_scan_id()
    r = client.get(f"/api/v1/report/{sid}")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:5] == b"%PDF-"


def test_defend():
    r = client.post("/api/v1/defend", json={"cpt_enabled": True, "fcs_enabled": True, "fcs_threshold": 0.65, "srad_enabled": True})
    assert r.status_code == 200
    assert r.json()["status"] == "deployed"


def test_list_scans():
    _complete_scan_id()
    r = client.get("/api/v1/scans")
    assert r.status_code == 200
    assert r.json()["total"] >= 1


def test_unknown_scan_404():
    assert client.get("/api/v1/scan/does-not-exist").status_code == 404
    assert client.get("/api/v1/owasp/does-not-exist").status_code == 404
    assert client.get("/api/v1/report/does-not-exist").status_code == 404
