"""Smoke tests for the CorpusGuard CLI."""

from typer.testing import CliRunner

from corpusguard.cli import app

runner = CliRunner()


def test_scan_writes_risk_score(tmp_path):
    """`corpusguard scan --output DIR` must emit a machine-readable risk_score.txt
    (consumed by .github/workflows/security-gate.yml)."""
    result = runner.invoke(app, ["scan", "--target", "x.yaml", "--output", str(tmp_path)])
    assert result.exit_code == 0
    risk_file = tmp_path / "risk_score.txt"
    assert risk_file.exists()
    risk = int(risk_file.read_text().strip())
    assert 0 <= risk <= 100


def test_defend_runs():
    result = runner.invoke(app, ["defend", "--mode", "full"])
    assert result.exit_code == 0


def test_report_writes_pdf(tmp_path):
    out = tmp_path / "report.pdf"
    result = runner.invoke(app, ["report", "--format", "pdf", "--output", str(out)])
    assert result.exit_code == 0
    assert out.exists()
    assert out.read_bytes()[:5] == b"%PDF-"
