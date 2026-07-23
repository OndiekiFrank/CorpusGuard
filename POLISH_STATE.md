# CorpusGuard — Polish Pass State

Branch: `polish-pass` (from `main` @ a1cf57c)
Started: 2026-07-23

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

_(pending)_

## PHASE 3 — Demo readiness

_(pending)_

## PHASE 4 — Fresh-clone verification

_(pending)_
