# CorpusGuard — Improvements & Roadmap

Tracks MISSING/BROKEN claims stripped from the README, deferred code-quality work, and anything BLOCKED during the overnight audit.

## Stripped from README (moved to roadmap)
_(filled during P6)_

## BLOCKED
_(filled if any issue resists 3 approaches / ~30 min)_

## Code-quality backlog (P7, highest severity first)
- **CI `.[dev]` extra undefined** — `ci.yml` runs `pip install -e ".[dev]"` but `setup.py` defines no `dev` extra. Either add an `extras_require={"dev": ["pytest","pytest-cov"]}` or change the CI step. (Severity: high — CI is red on first run.)
- **`security-gate.yml` risk_score.txt never written** — the gate reads `./corpusguard-results/risk_score.txt`, but `corpusguard scan` produces no such file, so the gate always sees RISK=0 and never blocks. Needs `scan` to emit a machine-readable risk artifact, or the workflow rewritten. (Severity: high — the advertised "blocks deployment above 70" is non-functional.)
- **Version drift** — unify `0.1.0` / `0.2.0` / `0.3.0` across `setup.py`, `api/main.py`, `report_generator.py`, `cli.py`, `frontend/package.json`, `App.jsx`. (Severity: medium.)
- **Duplicate `from __future__ import annotations`** in `campaign.py`, `owasp.py`, `monitor.py`, `examples/bank_compliance_demo.py` — the duplicate demotes the module docstring to a plain expression. Cosmetic. (Severity: low.)
- **API scan error handling** — `_run_scan` swallows exceptions into `_scans[id]["message"]`; no structured logging. Consider `logging` + explicit error codes. (Severity: low.)
- **`OWASPScorecard.evaluate`** counts PARTIAL findings as `not_tested` in the summary (`passed`/`failed` only) — the frontend recomputes PARTIAL separately. Align the API summary to expose `partial`. (Severity: low.)
