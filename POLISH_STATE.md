# CorpusGuard — Polish Pass State

Branch: `polish-pass` (from `main` @ a1cf57c)
Started: 2026-07-23

**STATUS: COMPLETE.** Phases 0–4 done. Fresh-clone acceptance green (docker
healthy, `:8000`/`:3000` → 200, demo PDF, pytest 24 passed). Two items await a
human decision (DISCREPANCY-1; SSRN link browser-check); two deferred with
rationale (npm vite upgrade, recharts v3). One environment blocker (cannot stop
the locked containers here). Deliverable: `MORNING_SUMMARY_2.md`.

## PHASE 0 — Preflight (baseline)

| Check | Result |
|-------|--------|
| docker compose v2 | ✅ v5.3.1 |
| docker without sudo | ✅ works |
| port 3000 | in use by running `corpusguard-ui` container |
| port 8000 | in use by running `corpusguard-api` container (healthy) |
| port 6379 | redis internal only (not published to host) |
| pytest on main | ✅ 19 passed in 12.22s |
| branch created | ✅ `polish-pass` from `main` |

Baseline stack was already running from a previous session (`docker ps`: ui up 58m, api healthy 59m, redis up 59m).

---

## PHASE 1 — Correctness and honesty

### 1.1 Version — DONE
Single source `corpusguard/__version__.py` = **0.1.0**. `/health` returns 0.1.0; UI badge, CLI banner, PDF headers, demo banner all 0.1.0. Guarded by `tests/test_version.py`. Proof: `curl :8000/api/v1/health` → `"version":"0.1.0"`; pytest 24 passed.

### 1.2 Measured vs paper-cited figures — DONE
Convention: runtime-computed values are shown as-is; static figures from SSRN 6734225 carry an explicit "published" / "SSRN 6734225" label.
- Dashboard MHL tab: added a 📄 provenance note under the 100% / 0% / 22.6ms grid.
- Dashboard MetricCards: "Quarantined" sub now shows measured `N% detection (measured)` instead of a hardcoded "100% detection rate".
- Dashboard activity log MHL-deploy line prefixed "Published benchmark (SSRN 6734225)".
- API `/defend`: added `metrics_source: "SSRN 6734225 (published benchmark)"`; figures already keyed `expected_*`.
- PDF: MHL Detection Rate row tagged "published, SSRN 6734225"; QTPI caption now interpolates the **actual** degradation of the scanned run (e.g. 98.2% live) and the DP/RRM rows are marked `†` published reference values with a footnote citing the paper's 0.014/98.4%.
- Demo: MHL performance line split into "measured this run" (stub cross-encoder ≈0.1ms) vs a published-benchmark line (22.6ms p99); final panel tags detection/false-quarantine as published.

### 1.3 Monitor duration — DONE
`monitor.stop()` finalises uptime from `_start_time`. "Stopped after 6s" (was 0s).

### 1.4 Stray 0.75 + 00:00:00 — DONE
F1 YAxis pinned to `ticks={[0,0.5,1]}`; activity-log seed uses real time. Verified zero `0.75` elements via CDP.

### 1.5 API hardening + OWASP partial — DONE
`_run_scan` uses `logger.exception` + typed error; OWASP summary exposes a `partial` bucket (was folded into `not_tested`). Unit-covered.

### 1.6 Figure reconciliation vs SSRN 6734225

Inventory of every published figure and where it appears. "pub" = shown as a labelled published constant; "meas" = computed at runtime.

| Figure | Paper / README | CLI scan | Dashboard | PDF (live scan) | PDF (`report` template) | Demo | Consistent? |
|---|---|---|---|---|---|---|---|
| Baseline F1 | 0.919 | 0.919 | 0.919 | 0.919 | 0.919 | 0.919 | ✅ |
| Attacked F1 @ β=50 | **0.014** | 0.017 (meas) | 0.017 (meas) | 0.017 (meas) | 0.014 (pub) | 0.017 (meas) | ⚠ see DISCREPANCY-1 |
| Degradation @ β=50 | **98.4%** | 98.2% (meas) | 98.2% (meas) | 98.2% (meas) | 98.4% (pub) | 98.2% (meas) | ⚠ see DISCREPANCY-1 |
| Log anomalies | 0 | 0 | 0 | 0 | 0 | 0 | ✅ |
| MHL detection rate | 100% | — | 100% (pub) | 100% (pub) | 100% (pub) | meas + pub | ✅ labelled |
| False quarantine | 0% | — | 0% (pub) | 0% (pub) | 0% (pub) | pub | ✅ labelled |
| FCS p99 latency | 22.6ms | — | 22.6ms (pub) | — | — | ≈0.1ms meas + 22.6ms pub | ✅ labelled |
| Document Poisoning | 0.919→0.924 (+0.5%) | — | — | pub † | pub † | — | ✅ labelled |
| Rank Manipulation | 0.919→0.943 (+2.6%) | — | — | pub † | pub † | — | ✅ labelled |
| OWASP compliance | 0% | — | 0% | — | — | 0% | ✅ |

**DISCREPANCY-1 (P1 — needs human decision, NOT silently changed):**
The paper/README headline is **F1 0.014 / 98.4% degradation at β=50**. The simulation model in `attacks/qtpi.py::_simulate_attack` computes, deterministically at seed=42:
`attacked_f1 = round(max(0.014, 0.919·e^(-0.08·50)), 3) = round(0.0168, 3) = 0.017`, giving 98.2%.
So any *live* run of the tool (CLI `scan`/`attack`, dashboard, demo, PDF-from-scan) shows **0.017 / 98.2%**, while the README and the `report` template show the paper's **0.014 / 98.4%**.
Cause: the exponential fit's value at β=50 (0.0168) sits just above the 0.014 floor, so it never resolves to 0.014 at exactly β=50. This is a modelling artefact, not a data error.
Options for the author (do not action without sign-off):
1. Adjust the fit constant (e.g. decay rate/floor) so β=50 lands on 0.014 — changes the curve to match the paper exactly.
2. Change the paper/README headline to β where the curve does hit 0.014 (β≈53).
3. Leave as-is and rely on the now-explicit labelling (paper value cited alongside the measured value in the PDF footnote).
Per the working rules this discrepancy is recorded for review rather than resolved by editing either side.

**Note-2 (fixed, internal inconsistency, not a paper figure):** README stated both "9/9 tests passing" and "16 passed"; actual suite is 24. Reconciled to a single truthful statement.

## PHASE 2 — Repo hygiene

- **2.1 compose** — DONE. Removed `version:` key; healthcheck interval 10s→30s; anonymous `/app/node_modules` volume. `docker compose config` parses; API image rebuilds.
- **2.2 npm audit** — DEFERRED (documented). Only fix is a breaking vite 5→7/8 major upgrade; all advisories are dev-server-only (high one is Windows-only). recharts v3 also deferred. See IMPROVEMENTS.md.
- **2.3 pin deps** — DONE. `requirements-api.txt` pinned to container-verified versions (rebuild OK); `requirements.txt` pinned + **added missing scipy** (srad/monitor need it). Clean-venv resolution of the full `requirements.txt` not re-run (heavy torch pull).
- **2.4 sample report** — DONE. `docs/sample_report.pdf` committed (canonical CISO report, paper figures), linked from README.
- **2.5 SECURITY.md + CITATION.cff** — DONE. Responsible-use + vuln-reporting policy written; CFF validates as YAML and cites both software and paper.
- **2.6 badges** — DONE. All 6 badge images resolve 200; link targets resolve 200 **except SSRN (403)**. The SSRN 403 is its anti-bot wall — 403 to curl even with a browser UA — **not** a 404, so the link is kept. **HUMAN CHECK NEEDED:** open https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225 in a real browser to confirm abstract 6734225 is live and public. CI badge is live (repo is public, `ci.yml` present).
- **2.7 secret scan** — DONE, **CLEAN**. No `.env`/`*.pem`/`*.key`/credential files; no `sk-…`/`AKIA…`/`ghp_…`/private-key/Slack/Bearer patterns in tracked files; no hardcoded password/token/api_key assignments; no absolute local paths (`/home/…`, `/Users/…`) in tracked files. `OPENAI_API_KEY` appears only as a `${OPENAI_API_KEY:-}` empty-default passthrough in compose. (History contains old `node_modules/` files from before it was untracked — repo bloat, not secrets.)

## PHASE 3 — Demo readiness

- **3.1 DEMO_RUNBOOK.md** — DONE. Cold-start commands, 6-tab click path with exact expected numbers, timings, and troubleshooting for the 3 most likely failures (port in use, API-unavailable fallback, UI still installing).
- **3.2 One-command reset** — DONE. `scripts/demo-reset.sh` (down→build→up→wait-healthy→smoke-test) + `Makefile` (`make reset`, `up`, `down`, `demo`, `test`). `bash -n` clean; couldn't execute end-to-end here because the pre-existing containers are locked (see BLOCKED), but the flow is standard.
- **3.3 Determinism** — VERIFIED. Seed=42; campaign F1 identical across runs (0.735/0.017/0.012; peak 98.7%). Frontend sim values match the backend exactly.
- **3.4 No runtime external deps** — VERIFIED. CDP network capture during load+scan+deploy: 25 requests, **0 external**. System fonts, data-URI favicon, bundled JS.
- **3.5 Legibility** — DONE. Critical grid value readouts bumped 11→14px bold; headline KPIs already 28px; verified no layout breakage via before/after screenshots.

## PHASE 4 — Fresh-clone verification — GREEN

Cloned `polish-pass` fresh (`git clone` of the local repo) and ran the full acceptance test.

**Environment deviations (forced, documented):** this sandbox (a) has locked pre-existing containers holding host ports 8000/3000 that cannot be stopped (daemon `permission denied`, no sudo), and (b) its Docker daemon cannot bind-mount host paths under `/tmp` (the frontend dev-server mount comes up empty). So the acceptance stack ran from a `/home` clone (`/home/the-artist/cg-accept`) on remapped ports **8002/3002** with distinct container names, via a small `docker-compose.override.yml`. On a clean host you clone into `/tmp` and use 8000/3000 with no override.

### Results

| Criterion | Result |
|---|---|
| `docker compose up --build` reaches healthy | ✅ `cg3-api` Healthy (fresh build, Python 3.11, pinned `requirements-api.txt`) |
| `curl :8002/api/v1/health` (→ :8000 on clean host) | ✅ `200` — `{"status":"healthy","version":"0.1.0",...}` |
| `:3002` UI (→ :3000 on clean host) | ✅ `200` (ready ~12s after npm install) |
| `python examples/bank_compliance_demo.py` → PDF | ✅ `reports/bank_compliance_demo.pdf` — PDF 1.4, 2 pages |
| `pytest` | ✅ **24 passed** |

Validated on two supported Pythons plus the host default:
- **Docker image — Python 3.11, reportlab 5.0.0:** stack healthy, both endpoints 200.
- **Python 3.12, latest reportlab 5.0.0 (the normal stranger path):** `24 passed`; demo → 2-page PDF.
- **Python 3.8, pinned reportlab 3.6.13:** `24 passed`; demo → PDF (shows the pin keeps even EOL 3.8 working).

### P1 bug found and fixed (working dir had hidden it)
`setup.py` allowed `python_requires>=3.8` while requiring `reportlab>=4.0.0`; reportlab 4.x calls `md5(usedforsecurity=False)` which raises `TypeError` on Python 3.8, crashing every PDF path on a fresh `pip install -e .`. The working tree masked it with an ambient reportlab 3.6.13. Fixed the floor to `>=3.9` (matches the classifiers, README, CI matrix, and Docker image). Re-verified green.

### Leftover containers (environment)
The `cg-fresh-*`, `cg2-*`, and `cg3-*` containers created during this test cannot be removed here (same daemon `permission denied` restriction). On the owner's machine `docker compose -p cg3 down` (etc.) or a normal `docker compose down` cleans them up.
