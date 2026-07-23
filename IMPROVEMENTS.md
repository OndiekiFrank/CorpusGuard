# CorpusGuard — Improvements & Roadmap

Tracks MISSING/BROKEN claims stripped from the README, deferred code-quality work, and anything BLOCKED during the overnight audit.

## Stripped from README (moved to roadmap)
- **Helm chart (`helm/corpusguard/`)** — claimed in the architecture tree but the directory does not exist. Removed the line from README. *Roadmap:* author a real Helm chart (Deployment + Service for the API, optional Redis subchart, values for image tag / risk threshold) to back the "Kubernetes Helm chart" claim.
- **`pip install corpusguard`** — not published to PyPI. README now says "install from source". *Roadmap:* publish to PyPI (owner action — the overnight run must not publish), then restore the `pip install corpusguard` instructions and the `corpusguard-action@v1` marketplace action referenced in the CI/CD Security Gate section.
- **`corpusguard-action@v1`** (GitHub Marketplace action in the CI/CD Security Gate snippet) — does not exist. Left the snippet as an illustrative example; *roadmap:* publish the composite action or replace the snippet with a direct `security-gate.yml` `workflow_call`.

## Deferred with rationale (polish-pass)

### npm audit — vite/esbuild (1 high, 1 moderate) — DEFERRED, not attempted
`npm audit fix` (no `--force`) resolves nothing: every advisory is fixed only by upgrading **vite 5.4.21 → 7/8** (npm proposes vite@8.1.5), a 3-major breaking jump. Analysis of the advisories:
- esbuild GHSA-67mh-4wv8-2f99 (moderate): dev server allows any website to send requests to it — **dev-server only**.
- vite GHSA-fx2h-pf6j-xcff (high): `server.fs.deny` bypass on **Windows alternate paths** — dev-server + **Windows only**.
- vite GHSA-4w7w-66w2-5vf9 / GHSA-v6wh-96g9-6wx3 (moderate): optimized-deps `.map` path traversal / launch-editor NTLM on Windows — dev-server only.
None affect a built/production bundle; the demo serves the Vite **dev** server on **Linux** over localhost. Real-world risk in the demo context is negligible. There are no frontend tests to catch a regression from a 3-major upgrade, so forcing it the night before a live demo is the larger risk.
*Remediation (post-demo, owner):* bump to the latest vite 7.x, run `npm install`, and manually re-verify all six dashboard tabs + the proxy to the API. Then re-run `npm audit`.

### recharts 2.x EOL → v3 — DEFERRED, not attempted
recharts 2.12.7 is EOL; v3 is a breaking API change (chart component props, `ResponsiveContainer`, tooltip API). The dashboard uses `LineChart`/`Line`/`XAxis`/`YAxis`/`Tooltip`/`ResponsiveContainer`/`ReferenceLine` across the Attack-results and Monitor charts. Migration is not low-risk and there are no visual regression tests. *Remediation (post-demo):* migrate to recharts v3 on a branch, visually diff both charts, then merge.

## BLOCKED
- **Cannot restart/replace the running containers (environment, not repo).** The pre-existing `corpusguard-api`, `corpusguard-ui`, and `…_corpusguard-redis` containers (started ~2h before this session, in another context) cannot be stopped/killed/removed: `docker stop|rm|kill` and `docker compose down` all return `permission denied` from the daemon, and there is no passwordless sudo. They hold host ports 8000/3000. Consequences and mitigations:
  - The freshly built `corpusguard-api:latest` image (with pinned `requirements-api.txt`) **built successfully** but could not be swapped in; the live `:8000` still serves the previous image. New API behaviour is validated in-process by pytest (24 passing), which imports the current `corpusguard.api.main`.
  - The Phase 4 fresh-clone acceptance test was run with a separate compose project on **remapped host ports** to avoid the locked 8000/3000 (documented in POLISH_STATE.md §Phase 4). On a clean host it uses 8000/3000 directly.
  - *Resolution for the owner:* on your own machine `docker compose down && docker compose up -d --build` will pick up the new image and the compose fixes with no remapping.

## Code-quality backlog (P7, highest severity first)
- ~~**CI `.[dev]` extra undefined**~~ — FIXED: added `extras_require={"dev": [...]}` to `setup.py`.
- ~~**`security-gate.yml` risk_score.txt never written**~~ — FIXED: `corpusguard scan` now writes `{output}/risk_score.txt`, and the gate installs from source (`pip install -e .`). (Not executable on a local runner, but the chain is now internally consistent and unit-covered by the CLI writing the file.)
- ~~**Version drift**~~ — FIXED (polish-pass): single source of truth `corpusguard/__version__.py` (0.1.0). `setup.py` parses it, `api/main.py`, `cli.py`, `report_generator.py`, `bank_compliance_demo.py` import it; frontend `package.json`, `App.jsx`, `Header.jsx`, `PDFReport.jsx` synced to 0.1.0.
- **Duplicate `from __future__ import annotations`** in `campaign.py`, `owasp.py`, `monitor.py`, `examples/bank_compliance_demo.py` — the duplicate demotes the module docstring to a plain expression. Cosmetic. (Severity: low.)
- ~~**API scan error handling**~~ — FIXED (polish-pass): `_run_scan` now uses `logger.exception(...)` to preserve tracebacks and returns a typed error message + `error_type`.
- ~~**`OWASPScorecard.evaluate`** counts PARTIAL as `not_tested`~~ — FIXED (polish-pass): added a `partial` bucket to the summary; overall status logic and the demo output updated. Unit-covered.
