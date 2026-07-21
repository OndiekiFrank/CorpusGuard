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
