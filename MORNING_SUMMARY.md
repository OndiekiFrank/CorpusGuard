# CorpusGuard — Morning Summary

Branch: `overnight-audit` (based on `main`) · Audit date: 2026-07-21
Full detail in `PROJECT_STATE.md` (proofs), `CHANGELOG_OVERNIGHT.md` (every change + why), `IMPROVEMENTS.md` (roadmap/backlog).

## TL;DR
The stack is real and now runs, curl-verified end to end. Every priority P1–P6 holds with recorded proof; the README no longer makes a claim the code can't back. 19/19 tests green.

---

## What works (verified this session)

| Area | Proof |
|---|---|
| **Docker Compose full stack** | `docker-compose up -d` → `corpusguard-api` (healthy), `corpusguard-ui`, `corpusguard-redis` all up. `curl :8000/api/v1/health` → **200**, `curl :3000` → **200** (CorpusGuard app HTML). |
| **All 7 REST endpoints** | curl-exercised against the live API (scan `e6c967af`): health, scan (POST→queued), scan/{id} (→complete), owasp/{id}, report/{id} (valid `%PDF-`), defend, scans; unknown id → 404. Table in PROJECT_STATE.md. |
| **Bank compliance demo** | `python examples/bank_compliance_demo.py` runs all 5 phases, writes `reports/bank_compliance_demo.pdf`. |
| **Tests** | **19 passed** on Python 3.8.5 (9 original + 7 new API smoke tests + 3 new CLI tests). |
| **CLI** | `scan` / `attack` / `defend` / `report` all run clean via the `corpusguard` entry point; `scan` now also emits `risk_score.txt`. |
| **MHL / OWASP / QTPI / campaign / monitor / PDF / Streamlit UI / 6 React tabs** | Present and exercised (see claims table). |

### Key fixes that made it work
- **Lean API image**: new `requirements-api.txt` + `Dockerfile` (`--no-deps`, dropped `build-essential`) — the original build pulled the entire torch/faiss/sentence-transformers stack the API never uses.
- **`.dockerignore`**: original `COPY . .` stalled for minutes on `frontend/node_modules`.
- **Healthcheck `start_period: 40s`**: frontend no longer aborts while the API is still importing on cold start.
- **Env-driven vite proxy**: dockerized frontend can actually reach the `api` service.
- **README corrected**: `pip install corpusguard` → from source (not on PyPI); removed the non-existent `helm/` chart; endpoints 6→7; test count/versions honest.
- **CI made consistent**: `scan` writes `risk_score.txt` so `security-gate.yml` works; `setup.py` gained the `[dev]` extra `ci.yml` expects; gate installs from source.

---

## What's BLOCKED
Nothing was left BLOCKED — no single issue exceeded the time box.

**Environment caveat (not a defect):** this host has only legacy `docker-compose` v1.29.2 against Docker Engine 29.3.1, and the daemon **denies `kill`/`stop`/`rm`** on running containers for this user (`could not kill container: permission denied`). Consequences:
- The running stack cannot be torn down here, so a from-absolute-scratch cold `up` couldn't be re-demonstrated after the first success (it was proven once from a clean state).
- Any change to API-path code (`api/main.py`, `scanner/owasp.py`) can't be re-proven against a fresh container in this environment — so deeper P7 on those was deliberately deferred rather than risk source/proof divergence.
On a normal host with Docker Compose v2 (what the README documents), none of this applies.

---

## Top 5 recommended next steps
1. **Publish the container / verify on a v2 host.** Run `docker compose up` on a machine with Compose v2 and unrestricted daemon perms to confirm the clean cold-start path (should "just work" — config is proven correct).
2. **Author the real Helm chart** (`helm/corpusguard/`) — Deployment + Service for the API, optional Redis subchart, values for image tag and risk threshold — to back the (now-removed) Kubernetes claim, then restore it in the README.
3. **Publish to PyPI** (owner action; the overnight run deliberately did not), then restore `pip install corpusguard` and publish the `corpusguard-action@v1` composite action the CI snippet references.
4. **Unify the version string** across `setup.py` (0.1.0), `frontend/package.json` (0.2.0), `App.jsx` (v0.2.0), and the API `/health` (0.1.0) — pick one source of truth; then rebuild the API image so `/health` matches.
5. **API hardening (P7 backlog):** structured `logging` in `api/main.py` `_run_scan` (currently swallows exceptions into a string), and fix `OWASPScorecard` to report PARTIAL findings as their own summary bucket instead of folding them into `not_tested`.
