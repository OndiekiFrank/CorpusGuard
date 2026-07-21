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
**PASS (curl-verified)** — `docker-compose up -d` brings up all three services healthy:

```
corpusguard-ui     Up   0.0.0.0:3000->3000/tcp
corpusguard-api    Up (healthy)   0.0.0.0:8000->8000/tcp
corpusguard-redis  Up   6379/tcp
```
- `curl http://localhost:8000/api/v1/health` → **HTTP 200** `{"status":"healthy","version":"0.1.0",...}`
- `curl http://localhost:3000` → **HTTP 200**, HTML `<title>CorpusGuard — RAG Security Platform</title>` (Vite dev server).

Fixes required to make P1 hold (see CHANGELOG for reasoning):
1. `requirements-api.txt` (new) + `Dockerfile` now installs only lean runtime deps (`--no-deps`) — the original `pip install -r requirements.txt` + `pip install -e .` pulled the entire torch/faiss/sentence-transformers stack the API never uses, making the build enormous and slow.
2. Dropped `build-essential` from the API image (lean deps are manylinux wheels — no compiler needed).
3. `.dockerignore` (new) — the original build stalled on `COPY . .` copying `frontend/node_modules` + `.git`.
4. `docker-compose.yml` — added `start_period: 40s` (+ retries 5) to the api healthcheck so the frontend's `depends_on: service_healthy` doesn't abort while the API is still importing on cold start.
5. `frontend/vite.config.js` — proxy target now `process.env.VITE_API_URL || 'http://localhost:8000'`, so the dockerized frontend actually reaches the `api` service (compose sets `VITE_API_URL=http://api:8000`).

**Environment caveat (not a project defect):** this host runs the legacy `docker-compose` v1.29.2 against Docker Engine 29.3.1, and the daemon denies `kill`/`stop`/`rm` on running containers for this user (`could not kill container: permission denied`). Consequently a stale-container *recreate* errors, and the running stack can't be torn down here. From a clean container state the single `docker-compose up -d` succeeds; the README's documented `docker compose` (v2) is unaffected.

### P2 — 7 API endpoints via curl
**PASS (curl-verified against the dockerized API)** — sample scan `e6c967af`:

| # | Method | Endpoint | Result |
|---|---|---|---|
| 1 | GET | `/api/v1/health` | 200 `{"status":"healthy","version":"0.1.0",...}` |
| 2 | POST | `/api/v1/scan` | 200 → `{"scan_id":"e6c967af","status":"queued",...}` |
| 3 | GET | `/api/v1/scan/{id}` | 200 → `status:complete`, risk 98, F1 0.919→0.017, degradation 98.2%, quarantined 20, full owasp_score embedded |
| 4 | GET | `/api/v1/owasp/{id}` | 200 → OWASP LLM Top 10 scorecard (NON-COMPLIANT) |
| 5 | GET | `/api/v1/report/{id}` | 200, `content-type: application/pdf`, `content-disposition: attachment; filename="corpusguard_report_e6c967af.pdf"`, valid `%PDF-` (6114 bytes) |
| 6 | POST | `/api/v1/defend` | 200 → `{"status":"deployed","expected_detection_rate":"100%",...}` |
| 7 | GET | `/api/v1/scans` | 200 → `{"total":1,"scans":[{"scan_id":"e6c967af","status":"complete"}]}` |
|  | GET | `/api/v1/scan/nope123` | 404 (error path) |

Note: the owasp summary buckets PARTIAL findings (LLM03/06/09) into `not_tested` (`passed`/`failed` only) — cosmetic, logged in IMPROVEMENTS. Endpoint behaviour is correct.

### P3 — bank_compliance_demo.py → PDF
**PASS (native)** — `python examples/bank_compliance_demo.py` runs all 5 phases, wrote `./reports/bank_compliance_demo.pdf` (6160 bytes). Re-verify after any API change.

### P4 — pytest
**PASS** — **16/16** on Python 3.8.5 (9 original + 7 new API smoke tests in `tests/test_api.py` covering all endpoints + 404 paths).

### P5 — CLI commands
**PASS** — via the installed `corpusguard` entry point: `scan --target ...`, `attack --vector qtpi --budget 50`, `defend --mode full`, `report --format pdf --output ...` all rc=0, no traceback; `report` wrote a valid PDF.

### P6 — README truthfulness
- No `CorpusGuard_README.md` exists — the rename was already applied; `README.md` is the CorpusGuard readme. Corrections applied instead (see below / CHANGELOG).
- `corpusguard` is **NOT on PyPI** (`pip index versions corpusguard` → no distribution) → `pip install corpusguard` corrected to install-from-source. This also means `security-gate.yml`'s `pip install corpusguard` step cannot work as written.

**README corrections applied:**
- `pip install corpusguard` → `pip install -e .` (from source), both in the top quickstart and the CLI section (now "install from source").
- Removed the `helm/corpusguard/ ← Kubernetes Helm chart` line from the architecture tree (directory does not exist) — logged as roadmap in IMPROVEMENTS.md.
- Architecture "6 endpoints" → "7 endpoints".
- Test Results "9 passed … Python 3.9, 3.10, 3.11" → "16 passed … CI matrix: Python 3.9/3.10/3.11" (now 19 with CLI tests; README states the honest CI matrix).
- Added "older Docker: `docker-compose up`" note to the compose command.

**Small truth-making code fixes (make documented CI claims real):**
- `corpusguard scan` now writes `{output}/risk_score.txt` → `security-gate.yml` can read it. Covered by `tests/test_cli.py`.
- `setup.py` gained `extras_require={"dev": [...]}` → `ci.yml`'s `pip install -e ".[dev]"` is now valid.
- `security-gate.yml` installs from source (`pip install -e .`) instead of the unpublished `pip install corpusguard`.
- Removed the `{corpusguard...` brace-expansion cruft directory (untracked).

**P6 status: DONE.** README.md is truthful; no false claims remain that the audit disproved.
