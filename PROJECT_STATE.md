# CorpusGuard — Project State (overnight audit)

Branch: `overnight-audit` (from `main`)
Audit date: 2026-07-21
Auditor: autonomous overnight run

---

## Phase 0 — Preflight findings

| Check | Result |
|---|---|
| Docker daemon | **UP** — Server Version 29.3.1 (`docker ps` succeeds) |
| `docker compose` (v2 plugin) | **ABSENT** — `docker: unknown command: docker compose` |
| `docker-compose` (v1 legacy) | **PRESENT** — v1.29.2. Will use this for the compose proof. |
| Ports 3000 / 8000 / 6379 | **FREE** (no remap needed) |
| Python | **3.8.5** (conda env `learn-env`). README claims 3.9/3.10/3.11 — see audit. |
| pip | 25.0.1 |
| node / npm | **v22.22.0 / 10.9.4** |
| `frontend/node_modules` | already installed |
| Core Python deps (fastapi, uvicorn, pydantic, numpy, scipy, reportlab, typer, rich) | already installed in env → **native run viable without heavy installs** |
| `corpusguard` package | installed editable (`pip install -e .` already done) |

Notes:
- README uses `docker compose up` (v2 syntax); only `docker-compose` (v1) exists here. The audit tests with `docker-compose`.
- Heavy deps in `requirements.txt` (sentence-transformers, faiss-cpu, torch chain) are **not** needed on the simulate/default runtime path — the API, CLI, demo, and MHL all run on the core deps above.
- Stray directory named `{corpusguard/{attacks,defense,scanner,dashboard,api},tests,examples,helm` exists at repo root — brace-expansion cruft from a failed `mkdir`. Empty. Slated for removal in Phase 2.

---

## Phase 1 — Claims audit

Legend: **VERIFIED** = code exists and exercised · **BROKEN** = exists but does not work as claimed · **MISSING** = not present.

| # | README claim | Status | Evidence |
|---|---|---|---|
| 1 | 7 REST API endpoints | **VERIFIED (code)** | `corpusguard/api/main.py` defines all 7: `GET /api/v1/health`, `POST /api/v1/scan`, `GET /api/v1/scan/{id}`, `GET /api/v1/owasp/{id}`, `GET /api/v1/report/{id}`, `POST /api/v1/defend`, `GET /api/v1/scans`. Runtime curl proof pending P2. (Architecture text says "6 endpoints" — off-by-one vs the 7-row table; table is correct.) |
| 2 | 6 React tabs | **VERIFIED** | `frontend/src/components/TabView.jsx` `TABS = ['Attack results','OWASP Top 10','MHL defense','Campaign','Monitor','Threat intel']` with matching render branches; components present. |
| 3 | QTPI attack | **VERIFIED** | `corpusguard/attacks/qtpi.py`; `python -m corpusguard.cli attack` → F1 0.919→0.017, 98.2% degradation. |
| 4 | Campaign runner | **VERIFIED** | `corpusguard/attacks/campaign.py` (`AttackCampaign`, `default_financial_campaign`); demo runs 3 phases. Frontend `CampaignRunner.jsx` present. |
| 5 | MHL (CPT / FCS / SRAD) | **VERIFIED** | `defense/mhl.py` orchestrates `cpt.py`, `fcs.py`, `srad.py`; 9/9 tests pass. |
| 6 | OWASP LLM Top 10 scorecard | **VERIFIED** | `scanner/owasp.py` (`OWASPScorecard.evaluate`); demo prints full 10-item scorecard. |
| 7 | Monitoring daemon | **VERIFIED** | `scanner/monitor.py` (`CorpusGuardMonitor`, daemon thread); demo ran 6s, 8 alerts fired. |
| 8 | Threat intel feed | **VERIFIED (static)** | `TabView.jsx` `ThreatIntel()` — hardcoded demo patterns, frontend-only. Not a live feed. |
| 9 | Streamlit alt UI | **VERIFIED (code)** | `dashboard/app.py` imports cleanly; `streamlit` in requirements. Not launched in this audit. |
| 10 | PDF generator | **VERIFIED** | `dashboard/report_generator.py` (reportlab); CLI/demo produce valid PDFs in `./reports/`. |
| 11 | Helm chart `helm/corpusguard/` | **MISSING** | No `helm/` directory exists. Only referenced inside the brace-cruft dir name. |
| 12 | `ci.yml` | **VERIFIED-present / BROKEN step** | `.github/workflows/ci.yml` exists. Step `pip install -e ".[dev]"` references a `[dev]` extra **not defined** in `setup.py` → CI install step would fail. Also `build-docker`/`security-scan` push to Docker Hub with secrets. |
| 13 | `security-gate.yml` | **VERIFIED-present / BROKEN logic** | `.github/workflows/security-gate.yml` exists. Reads `./corpusguard-results/risk_score.txt`, but `corpusguard scan` writes **no such file** → RISK always defaults to 0, gate never triggers. |
| 14 | "9/9 tests on Py 3.9/3.10/3.11" | **VERIFIED count / UNVERIFIED versions** | `pytest` → **9 passed** (4 in `test_attacks.py` + 5 in `test_defense.py`). Ran on **Python 3.8.5**, not 3.9/3.10/3.11 (that matrix is only asserted by CI, unexecuted here). |

### Additional discrepancies noted (for README correction in P6)
- **Version drift**: code/report say `0.1.0`, `frontend/package.json` says `0.2.0`, `App.jsx` banner says `v0.2.0`, git log mentions `v0.3.0`. No single source of truth.
- **`docker compose` vs `docker-compose`**: README command is v2 syntax; environment only has v1.
- **`.[dev]` extra**: referenced by `ci.yml`, undefined in `setup.py`.
- **Streamlit container**: `Dockerfile.dashboard` exists but is **not** wired into `docker-compose.yml` (compose = api + frontend + redis only).
- **Duplicate `from __future__ import annotations`** in `campaign.py`, `owasp.py`, `monitor.py`, and demo (harmless; the second makes the module docstring a plain expression).

---

## Phase 2 — Fix log

(populated as fixes land; see CHANGELOG_OVERNIGHT.md for full detail)

### P1 — docker compose full stack
_status: pending_

### P2 — 7 API endpoints via curl
_status: pending_

### P3 — bank_compliance_demo.py → PDF
**PASS (native)** — `python examples/bank_compliance_demo.py` runs all 5 phases, wrote `./reports/bank_compliance_demo.pdf` (6160 bytes). Re-verify after any API change.

### P4 — pytest
**PASS** — 9/9 on Python 3.8.5.

### P5 — CLI commands
**PASS (native)** — `scan`, `attack`, `defend`, `report` all run without traceback; `report` wrote a valid PDF.
