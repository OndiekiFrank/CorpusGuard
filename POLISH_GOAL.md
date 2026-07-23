# CorpusGuard — BSides Polish Pass Specification

## PHASE 0 — Preflight (10 min)
Verify docker compose v2 works, ports 3000/8000/6379 free, docker runs without sudo, pytest passes on main. Create branch polish-pass from main. Record baseline in POLISH_STATE.md.

## PHASE 1 — Correctness and honesty (highest priority)
1.1 Unify the version string. It is currently 0.1.0 in setup.py and the API /health, 0.2.0 in frontend/package.json and App.jsx. Establish ONE source of truth (corpusguard/__version__.py), have setup.py and the API read from it, sync the frontend, rebuild so /health matches the UI. Pick 0.1.0 and propagate everywhere including the CLI banner and every report header.
1.2 Distinguish measured metrics from paper-cited constants. The MHL tab displays "22.6ms p99" and "100% detection" as if live, but the demo measures 0.1ms. Every static figure sourced from SSRN 6734225 must be visibly labelled as such in the UI; anything computed at runtime must show the real measured value. Same audit in CLI output and PDF report. Credibility requirement, not cosmetic — no number may be ambiguous about its provenance.
1.3 Fix the monitor duration bug: demo prints "Monitoring for 6 seconds" then "Stopped after 0s". Fix the timing calculation in scanner/monitor.py, in both the CLI and the Monitor tab if they share a code path.
1.4 Fix the stray "0.75" rendering at the bottom of the dashboard, and the activity log's leading "00:00:00" entry.
1.5 API hardening from IMPROVEMENTS.md: replace exception-swallowing in api/main.py _run_scan with structured logging preserving tracebacks; fix OWASPScorecard so PARTIAL findings report as their own bucket instead of folding into not_tested (output currently reads "0/10 passed | 2 failed | 8 not tested" while three are actually PARTIAL — misleading).
1.6 Verify every figure in README, CLI output, PDF report, and dashboard matches the numbers published in SSRN 6734225. This tool is the reference implementation of a paper under peer review; anyone who runs it must get numbers consistent with the publication. Any discrepancy is P1 — record it in POLISH_STATE.md for human review rather than silently changing either side.

## PHASE 2 — Repo hygiene
2.1 docker-compose.yml: remove obsolete top-level `version:` key; set API healthcheck interval to 30s (currently polls every ~2s and floods logs); add anonymous volume for /app/node_modules so the container stops writing root-owned files into the host frontend directory.
2.2 Resolve npm vulnerabilities (1 high, 1 moderate). Run npm audit fix WITHOUT --force first; breaking upgrades only if tests and dashboard still work. recharts 2.x is EOL — evaluate v3 migration; if not low-risk, log in IMPROVEMENTS.md rather than attempting.
2.3 Pin dependency versions in requirements.txt and requirements-api.txt so a clone in October builds the same stack as today.
2.4 Add docs/sample_report.pdf — one deliberately committed CISO report so visitors see the output without running anything. Link from README.
2.5 Add SECURITY.md (responsible-use and vulnerability-reporting policy — this repo ships an attack engine) and CITATION.cff (paper citable from GitHub).
2.6 Verify every README badge resolves and reports truthfully. Remove or fix any that 404 or reference something unpublished.
2.7 Scan repo for accidentally committed secrets, tokens, .env files, or absolute local paths. Report findings; do not commit anything found into the log.

## PHASE 3 — Demo readiness (live stage performance)
3.1 Write DEMO_RUNBOOK.md: exact cold-start command sequence, click path through all six tabs, expected numbers at each step, approximate timings, troubleshooting for the three most likely failures.
3.2 Add one-command reset (Makefile target or scripts/demo-reset.sh) that tears down, rebuilds, relaunches to a known-good state — botched demo recovers in under a minute.
3.3 Make the demo deterministic: seed any randomness so identical inputs produce identical F1 figures every run. Numbers quoted on stage must match the screen.
3.4 Verify the stack runs with no external network dependency at runtime. Any CDN font, script, or remote asset fetched at load time must be vendored locally. Test with networking disabled and confirm the UI renders fully.
3.5 Check dashboard legibility for projection: no critical text under 14px, sufficient contrast on the dark theme. Fix anything unreadable from the back of a room.

## PHASE 4 — Fresh-clone verification (acceptance test)
Clone the repo into /tmp from the local git remote as a stranger would. From that clean clone: docker compose up must reach healthy, curl :8000/api/v1/health and :3000 must both return 200, python examples/bank_compliance_demo.py must produce a PDF, pytest must pass. Record exact output in POLISH_STATE.md. A fresh-clone failure that the working directory doesn't show is a P1 bug — something untracked is load-bearing.

## DELIVERABLE
MORNING_SUMMARY_2.md: what changed, what is BLOCKED, what still needs a human decision, and a one-page pre-flight checklist for demo day.
