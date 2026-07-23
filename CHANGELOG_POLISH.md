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
