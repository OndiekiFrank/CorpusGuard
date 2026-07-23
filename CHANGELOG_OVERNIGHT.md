# CorpusGuard — Overnight Audit Changelog

All changes on branch `overnight-audit`, newest first.

## 2026-07-21

### Phase 0 + Phase 1 — Preflight & claims audit (no code changes)
- Verified environment: Docker daemon up (29.3.1), only legacy `docker-compose` v1.29.2 available, ports free, Python 3.8.5, node 22, core Python deps + editable package already installed.
- Read the entire codebase (api, attacks, defense, scanner, dashboard, frontend, examples, tests, infra, workflows).
- Smoke-verified before writing the audit: `pytest` 9/9 pass; all 11 modules import; CLI `scan`/`attack`/`defend`/`report` run clean; `bank_compliance_demo.py` runs end-to-end and writes a PDF.
- Confirmed `helm/` is **MISSING**.
- Authored `PROJECT_STATE.md` with the full claims table.
- Reasoning: establish a truthful, committed baseline before touching any code so the branch is resumable at any point.

### Phase 2 — P1: docker compose full stack (PASS)
- **New `requirements-api.txt`**: lean API runtime deps (fastapi, uvicorn, pydantic, numpy, scipy, reportlab). Reason: the API's simulate path never touches torch/faiss/sentence-transformers, so installing the full `requirements.txt` was pure build bloat.
- **`Dockerfile`**: install `requirements-api.txt` then `pip install -e . --no-deps` (was: full `requirements.txt` + `pip install -e .`, which re-resolved setup.py's heavy `install_requires`). Dropped `build-essential` (kept only `curl` for the healthcheck) — lean deps ship manylinux wheels.
- **New `.dockerignore`**: excludes `.git`, `**/node_modules`, `*.pdf`, caches. Reason: `COPY . .` was stalling for minutes copying `frontend/node_modules`.
- **`docker-compose.yml`**: api healthcheck gains `start_period: 40s` and `retries: 5`. Reason: without a start period the frontend's `depends_on: service_healthy` aborted while the API was still importing numpy/scipy on cold start.
- **`frontend/vite.config.js`**: proxy target is now `process.env.VITE_API_URL || 'http://localhost:8000'`. Reason: the dockerized frontend proxied `/api` to its own localhost; compose already sets `VITE_API_URL=http://api:8000`, so the browser can now reach the API service. Native dev still defaults to localhost:8000.
- Proof recorded in PROJECT_STATE.md (health 200 + app HTML 200).
- Environment caveat documented: legacy docker-compose v1.29.2 + Engine 29 denies container kill/stop/rm for this user; does not affect the compose config or README's `docker compose` v2.

### Phase 2 — P2: all 7 API endpoints (PASS)
- Exercised every documented endpoint via curl against the dockerized API (scan `e6c967af`). All return correct status/content; `/report/{id}` streams a valid PDF; unknown scan → 404. Proof table in PROJECT_STATE.md. No code changes needed — endpoints already correct.

### Phase 2 — P3/P4/P5 (PASS)
- **P3**: re-ran `python examples/bank_compliance_demo.py` → all 5 phases, wrote `reports/bank_compliance_demo.pdf` (6161 bytes). rc=0.
- **P4**: added `tests/test_api.py` (7 FastAPI TestClient smoke tests: health, scan lifecycle, owasp, report=PDF, defend, list, 404 paths). Full suite **16 passed**.
- **P5**: all 4 README CLI commands run clean via the `corpusguard` entry point (`scan`/`attack`/`defend`/`report`), rc=0; `report` wrote a valid PDF.
- **P6 precheck**: no `CorpusGuard_README.md` to rename (README.md already is it). Verified `corpusguard` is NOT on PyPI → `pip install corpusguard` is false; will correct to install-from-source.

### Phase 2 — P6: README truthfulness + truth-making fixes
- **README.md**: `pip install corpusguard` → install-from-source (not on PyPI, verified); removed non-existent `helm/corpusguard/` from architecture; "6 endpoints" → "7"; test results → "16 passed, CI matrix 3.9/3.10/3.11"; added docker-compose v1 note.
- **corpusguard/cli.py**: `scan` writes `{output}/risk_score.txt` (makes `security-gate.yml` functional). Reason: the gate read a file nothing produced.
- **setup.py**: added `extras_require={"dev": ["pytest","pytest-cov","httpx"]}`. Reason: `ci.yml` installs `.[dev]`.
- **.github/workflows/security-gate.yml**: install from source instead of unpublished PyPI package.
- **tests/test_cli.py** (new): CLI smoke tests — scan writes risk_score.txt, defend runs, report writes a valid PDF. Suite now **19 passed**.
- Removed `{corpusguard...` brace-expansion cruft directory (untracked).
- IMPROVEMENTS.md updated: helm chart / PyPI publish / corpusguard-action moved to roadmap; CI fixes marked done.

### Phase 2 — P7 (light, safe pass)
- Removed the duplicate `from __future__ import annotations` in `campaign.py`, `owasp.py`, `monitor.py` (redundant line; behaviorally inert, so the running-container P1/P2 proofs remain valid). Deeper P7 (version unification, structured API logging, OWASP summary partial-bucketing) left as backlog in IMPROVEMENTS.md — changing `api/main.py`/`owasp.py` behavior would diverge from the already-proven running container, which this environment cannot rebuild/recreate (daemon denies container kill/stop/rm).
