# CorpusGuard — Polish Pass Changelog

Chronological record of every change made on branch `polish-pass` and the reasoning behind it.

## Phase 0 — Preflight
- Verified docker compose v5.3.1, docker runs without sudo, pytest green on main (19 passed).
- Created branch `polish-pass` from `main` (a1cf57c).
- Recorded baseline in POLISH_STATE.md.

## Phase 1 — Correctness and honesty

### 1.1 Unify version string → 0.1.0 (single source of truth)
- Added `corpusguard/__version__.py` holding the only `__version__ = "0.1.0"`.
- `corpusguard/__init__.py` now re-exports it instead of defining its own.
- `setup.py` parses the version out of that file with a regex (no import, so it works before deps are installed).
- `api/main.py` imports `__version__` for both `FastAPI(version=...)` and `/health`.
- `cli.py` banner, `report_generator.py` (cover "Framework Version" + footer), and `examples/bank_compliance_demo.py` banner all import and interpolate `__version__`.
- Frontend synced 0.2.0 → 0.1.0: `frontend/package.json`, `App.jsx` init log, `Header.jsx` badge, `PDFReport.jsx` client-report footer.
- Reasoning: `/health` and the UI reported different versions (0.1.0 vs 0.2.0), undermining trust. Now every surface reads 0.1.0 from one place.
- Verified: `corpusguard.__version__ == app.version == 0.1.0`; pytest 19 passed.
- Added `tests/test_version.py` (4 tests) guarding against future drift.

### 1.3 Monitor duration bug
- `scanner/monitor.py` `stop()` now recomputes `uptime_seconds` from `_start_time` before printing. Previously `uptime_seconds` was only updated inside `get_stats()`, so `stop()` printed "Stopped after 0s" even after a 6s run.
- Verified: demo now prints "Stopped after 6s"; unit check with a 2.3s run prints "2s".
- CLI and Monitor tab do NOT share this code path (the Monitor tab is a self-contained client-side simulation), so no further change needed there.

### 1.5 API hardening + OWASP PARTIAL bucket
- `api/main.py` `_run_scan`: replaced silent `_scans[id]["message"] = str(e)` with `logger.exception(...)` (preserves the traceback in server logs) plus a typed client message (`Scan failed (ErrorType): ...`) and an `error_type` field.
- `scanner/owasp.py` `evaluate()`: added a dedicated `partial` counter; PARTIAL findings are no longer folded into `not_tested`. Overall status treats partial-or-not-tested (with no failures) as PARTIALLY_COMPLIANT. Summary now reads "0 passed | 2 failed | 3 partial | 5 not tested" instead of the misleading "8 not tested".
- Updated `bank_compliance_demo.py` to print the partial count.
- Added `tests/test_api.py::test_owasp_partial_bucket_is_reported_separately`.
- Verified: pytest 24 passed; demo shows "3 partial | 5 not tested".

### 1.4 Stray "0.75" + leading "00:00:00" activity-log entry
- Root cause of the stray "0.75": the F1 degradation curve's `<YAxis domain={[0,1]}>` let Recharts auto-generate ticks (0, 0.25, 0.5, **0.75**, 1). Recharts also appended an off-screen text-measurement `<span>` to `document.body` carrying the last-measured string ("0.75"). Diagnosed by driving the live dashboard over the Chrome DevTools Protocol and locating both the SVG `<tspan>` and the body `<span>`.
- Fix: set explicit `ticks={[0,0.5,1]}` on the F1 YAxis. No bare "0.75" renders, and the axis is cleaner for projection (helps Phase 3.5). Verified via CDP that zero `0.75` elements remain after a scan.
- The leading "00:00:00" activity-log entry was a hardcoded `time:'00:00:00'` in the initial `useState` log. Now initialised with the real `new Date().toLocaleTimeString(...)` (fixed alongside the version string in the same line).

### 1.2 Measured vs paper-cited figures
- Established one convention: runtime-computed numbers are shown as measured; static SSRN 6734225 figures carry a visible "published"/"SSRN 6734225" label.
- `TabView.jsx`: added a reusable `ProvenanceNote` and attached it under the MHL 100%/0%/22.6ms grid; changed "22.6ms p99 on CPU" → "22.6ms p99 latency".
- `MetricCards.jsx`: "Quarantined" sub is now the measured detection rate (`round(q/20*100)% detection (measured)`), not a hardcoded "100%".
- `App.jsx`: MHL-deploy log line prefixed "Published benchmark (SSRN 6734225)".
- `api/main.py` `/defend`: added `metrics_source` provenance field.
- `report_generator.py`: MHL Detection Rate row labelled "published, SSRN 6734225"; QTPI caption now interpolates the actual scanned degradation (98.2% for a live run) instead of a hardcoded 98.4%; DP/RRM rows marked `†` with a footnote citing the paper's 0.014/98.4%.
- `bank_compliance_demo.py`: MHL line separated into measured-this-run (stub ≈0.1ms) vs published benchmark (22.6ms p99); final summary tags detection/false-quarantine as published.
- Verified by regenerating PDFs: live-scan PDF caption reads "98.2%"; `report` template reads "98.4%"; both cite the paper value.

### 1.6 Figure reconciliation vs SSRN 6734225
- Built a full figure inventory across CLI / dashboard / PDF / demo / README (recorded in POLISH_STATE.md §1.6).
- **DISCREPANCY-1 (P1, recorded for human review, NOT silently changed):** the simulation yields F1 0.017 / 98.2% at β=50 while the paper/README state 0.014 / 98.4%. Root cause and three resolution options documented in POLISH_STATE.md.
- Fixed an internal README inconsistency (claimed both "9/9" and "16" tests passing) — reworded to a version-independent truthful statement.

## Phase 2 — Repo hygiene

### 2.1 docker-compose.yml
- Removed the obsolete top-level `version: "3.9"` key (Compose v2 warns on it).
- API healthcheck `interval` 10s → **30s** (less log noise; the spec noted flooding).
- Added an anonymous volume `/app/node_modules` to the frontend service so the container's `node_modules` no longer writes root-owned files back into the host `./frontend`.
- Verified `docker compose config` parses; rebuilt the API image successfully.

### 2.2 npm vulnerabilities — DEFERRED (documented, not forced)
- `npm audit fix` without `--force` resolves nothing; the only fix is a breaking vite 5→7/8 major upgrade. All advisories are dev-server-only (the high-severity one is Windows-only), so they don't affect the Linux demo. Rationale + post-demo remediation recorded in IMPROVEMENTS.md. recharts 2.x→v3 similarly deferred (breaking, no visual tests).

### 2.3 Pin dependency versions
- `requirements-api.txt`: pinned to the exact versions in the healthy API container (fastapi 0.139.2, uvicorn 0.51.0, pydantic 2.13.4, numpy 2.4.6, scipy 1.17.1, reportlab 5.0.0). Validated by a successful image rebuild.
- `requirements.txt`: pinned all entries; **added scipy** (required by `defense/srad.py` and the monitor, previously missing — a real reproducibility gap). Tested subset pinned to locally-verified versions; the rest pinned to numpy-1.24-compatible releases.
- Note: `requirements.txt` full clean-venv resolution was not re-validated (heavy torch pull; time/bandwidth) — the build-critical `requirements-api.txt` is validated by the Phase 4 rebuild.

### Environment blocker
- Pre-existing containers could not be stopped (daemon `permission denied`, no sudo). Recorded under IMPROVEMENTS.md BLOCKED. New API image built but not swapped in; functional coverage via pytest.

### 2.4 Sample report
- Committed `docs/sample_report.pdf` (canonical CISO report, paper figures) and linked it near the top of the README.

### 2.5 SECURITY.md + CITATION.cff
- `SECURITY.md`: responsible-use policy for the shipped attack engine + private vulnerability-reporting process.
- `CITATION.cff`: cites the software and the SSRN paper; validates as YAML.

### 2.6 Badges
- Verified all 6 badge images return 200 and all link targets return 200 except SSRN, which returns 403 to any automated client (its anti-bot wall) — kept as-is; flagged for a human browser check in POLISH_STATE.md.

### 2.7 Secret scan — CLEAN
- No secret/key/`.env` files, no credential patterns, no hardcoded secrets, no absolute local paths in tracked files. Full result in POLISH_STATE.md §Phase 2.7.

## Phase 3 — Demo readiness

### 3.3 Determinism — VERIFIED (no code change needed)
- QTPI is seeded (`QTPIConfig.seed=42`); ran `default_financial_campaign(50).run()` twice — identical F1 every time: phase F1s (0.735, 0.017, 0.012), worst degradation 98.7%, risk 98. The frontend's hardcoded simulation values match the backend exactly (β≤10→0.735/20.0, β≤50→0.017/98.2, β>50→0.012/98.7), so on-stage numbers match the screen.

### 3.4 No runtime external dependency — VERIFIED
- Static scan: no external http(s) asset URLs in `frontend/src` or `index.html` (favicon is a data URI, fonts are the system stack, React/recharts bundled locally).
- Runtime scan via CDP `Network.enable`: loaded the dashboard and exercised scan + MHL deploy — **25 requests, 0 external** (all localhost:3000). UI renders fully with no CDN/font/remote fetch.

### 3.5 Projection legibility
- Bumped the critical value readouts in the Attack-results and MHL detail grids from 11px→**14px** (bold) with labels 11→12px, and Campaign result tiles 13→14px. Headline KPI cards were already 28px. Verified via before/after screenshots that nothing wraps or overflows. Dark theme already provides high contrast on the primary/colored values (#f0f0f5 / red / green on near-black).
