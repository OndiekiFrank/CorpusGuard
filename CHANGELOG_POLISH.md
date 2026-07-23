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
