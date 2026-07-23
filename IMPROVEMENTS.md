# CorpusGuard — Improvements & Roadmap

Tracks MISSING/BROKEN claims stripped from the README, deferred code-quality work, and anything BLOCKED during the overnight audit.

## Stripped from README (moved to roadmap)
- **Helm chart (`helm/corpusguard/`)** — claimed in the architecture tree but the directory does not exist. Removed the line from README. *Roadmap:* author a real Helm chart (Deployment + Service for the API, optional Redis subchart, values for image tag / risk threshold) to back the "Kubernetes Helm chart" claim.
- **`pip install corpusguard`** — not published to PyPI. README now says "install from source". *Roadmap:* publish to PyPI (owner action — the overnight run must not publish), then restore the `pip install corpusguard` instructions and the `corpusguard-action@v1` marketplace action referenced in the CI/CD Security Gate section.
- **`corpusguard-action@v1`** (GitHub Marketplace action in the CI/CD Security Gate snippet) — does not exist. Left the snippet as an illustrative example; *roadmap:* publish the composite action or replace the snippet with a direct `security-gate.yml` `workflow_call`.

## BLOCKED
_(none — no single issue exceeded the time box.)_

## Code-quality backlog (P7, highest severity first)
- ~~**CI `.[dev]` extra undefined**~~ — FIXED: added `extras_require={"dev": [...]}` to `setup.py`.
- ~~**`security-gate.yml` risk_score.txt never written**~~ — FIXED: `corpusguard scan` now writes `{output}/risk_score.txt`, and the gate installs from source (`pip install -e .`). (Not executable on a local runner, but the chain is now internally consistent and unit-covered by the CLI writing the file.)
- ~~**Version drift**~~ — FIXED (polish-pass): single source of truth `corpusguard/__version__.py` (0.1.0). `setup.py` parses it, `api/main.py`, `cli.py`, `report_generator.py`, `bank_compliance_demo.py` import it; frontend `package.json`, `App.jsx`, `Header.jsx`, `PDFReport.jsx` synced to 0.1.0.
- **Duplicate `from __future__ import annotations`** in `campaign.py`, `owasp.py`, `monitor.py`, `examples/bank_compliance_demo.py` — the duplicate demotes the module docstring to a plain expression. Cosmetic. (Severity: low.)
- ~~**API scan error handling**~~ — FIXED (polish-pass): `_run_scan` now uses `logger.exception(...)` to preserve tracebacks and returns a typed error message + `error_type`.
- ~~**`OWASPScorecard.evaluate`** counts PARTIAL as `not_tested`~~ — FIXED (polish-pass): added a `partial` bucket to the summary; overall status logic and the demo output updated. Unit-covered.
