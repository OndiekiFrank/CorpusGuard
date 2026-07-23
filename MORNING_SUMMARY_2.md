# CorpusGuard — Polish Pass Summary (MORNING_SUMMARY_2)

Branch: **`polish-pass`** (off `main` @ a1cf57c). All work committed; the branch is
coherent and resumable at any commit. Full detail in `CHANGELOG_POLISH.md`,
proof in `POLISH_STATE.md`, deferred/blocked items in `IMPROVEMENTS.md`.

**Bottom line:** all five phases complete. Fresh-clone acceptance test is green
(docker healthy, both endpoints 200, demo PDF, pytest 24 passed). No ambiguous
metric remains in the UI, CLI, or PDF — every paper-cited figure is labelled as
published; every runtime value is measured. Two items need a human decision
(below); two are deferred with rationale.

---

## What changed (by phase)

**Phase 1 — correctness & honesty (highest priority):**
- **Version unified to 0.1.0** from one source of truth (`corpusguard/__version__.py`);
  `/health`, UI badge, CLI banner, PDF headers, demo all agree. Guarded by tests.
- **Measured vs published figures separated everywhere.** The MHL tab's 100% /
  0% / 22.6ms now carry a "published (SSRN 6734225)" note; the "Quarantined" card
  shows the *measured* detection rate; the PDF's QTPI caption interpolates the
  *actual* scanned degradation (not a hardcoded 98.4%); the demo splits
  measured-this-run latency from the published p99; `/defend` gained a
  `metrics_source` field.
- **Monitor duration bug fixed** — "Stopped after 6s" (was 0s).
- **Stray "0.75" removed** (it was a Recharts auto Y-tick; pinned to [0, 0.5, 1])
  and the activity log's leading "00:00:00" now uses the real time.
- **API hardening** — `_run_scan` logs full tracebacks (`logger.exception`) and
  returns a typed error; **OWASP scorecard now reports PARTIAL as its own bucket**
  (was folded into not_tested → the misleading "8 not tested").
- **Figures reconciled** against the paper (see decision needed #1).

**Phase 2 — repo hygiene:**
- compose: dropped obsolete `version:`, healthcheck 10s→30s, anonymous
  `node_modules` volume (stops root-owned host writes).
- Dependencies pinned (`requirements-api.txt` to container-verified versions;
  `requirements.txt` pinned + **added missing `scipy`**).
- Added `docs/sample_report.pdf` (linked from README), `SECURITY.md`,
  `CITATION.cff`.
- All 6 README badges verified 200; **secret scan clean** (no keys/.env/tokens/
  local paths committed).

**Phase 3 — demo readiness:**
- `DEMO_RUNBOOK.md` (cold start, 6-tab click path with exact numbers, timings,
  troubleshooting), `scripts/demo-reset.sh` + `Makefile` (`make reset`),
  determinism verified (identical F1 every run), **zero external network requests**
  at runtime (CDP-verified), and projection legibility improved (critical
  readouts 11→14px).

**Phase 4 — fresh-clone acceptance:** green (see below). Surfaced and fixed a
real P1: `python_requires` was `>=3.8` but `reportlab>=4.0.0` breaks PDF
generation on 3.8 → set floor to `>=3.9`.

---

## BLOCKED (environment, not the repo)

- **Cannot stop/replace the running containers.** The pre-existing
  `corpusguard-{api,ui,redis}` containers cannot be stopped/removed here
  (`docker stop|rm|down` → daemon `permission denied`; no passwordless sudo).
  They hold ports 8000/3000. The new API image **built successfully** with the
  pinned deps but could not be swapped in; new API behaviour is validated
  in-process by pytest. **On your machine:** `docker compose down && docker
  compose up -d --build` picks up the new image and all compose fixes.
- Consequently the acceptance test ran from a `/home` clone on ports 8002/3002
  (also because this daemon can't bind-mount `/tmp`). Cleanup of the
  `cg-fresh-*/cg2-*/cg3-*` test containers is likewise blocked here; a normal
  `docker compose down` clears them on your host.

## Needs a human decision

1. **DISCREPANCY-1 (paper vs simulator).** The simulator deterministically yields
   **F1 0.017 / 98.2%** at β=50; the paper/README headline is **0.014 / 98.4%**.
   Cause: the exponential fit sits just above the 0.014 floor at exactly β=50.
   I did **not** change either side (per the rules) — both are now shown with
   clear provenance. Pick one: (a) tweak the fit so β=50 lands on 0.014,
   (b) change the headline β, or (c) keep the labelled dual presentation.
   Details in `POLISH_STATE.md §1.6`.
2. **SSRN link not auto-verifiable.** `papers.ssrn.com/...abstract_id=6734225`
   returns 403 to all automated clients (SSRN anti-bot) — not a 404, so I kept
   it. Please click it in a browser to confirm abstract 6734225 is live/public.

## Deferred (documented in IMPROVEMENTS.md)

- **npm vite/esbuild advisories (1 high, 1 moderate):** fix requires a breaking
  vite 5→7/8 major upgrade; all advisories are **dev-server-only** (the high one
  is Windows-only) and don't affect the Linux demo. Not worth the regression risk
  the night before a talk with no frontend tests. Post-demo: bump vite to 7.x and
  re-verify the dashboard.
- **recharts 2.x (EOL) → v3:** breaking, no visual tests — deferred.

---

## Demo-day pre-flight checklist (one page)

**T-30 min — bring the stack up**
- [ ] `cd CorpusGuard && docker compose up -d --build` (on your machine, ports 8000/3000)
- [ ] `curl -s localhost:8000/api/v1/health` → `"version":"0.1.0"`, `"status":"healthy"`
- [ ] `curl -s -o /dev/null -w '%{http_code}' localhost:3000` → `200`
- [ ] Open **http://localhost:3000**; header shows **v0.1.0 · API ready**
- [ ] (Optional) second tab: **http://localhost:8000/docs**

**Smoke-test the click path** (numbers must match — they're deterministic)
- [ ] Run scan (β=50): Risk **98/100**, Baseline **0.919**, Attacked **0.017**, **98.2%**, Quarantined **20/20**
- [ ] OWASP tab: **0 passed / 2 failed / 3 partial / 5 not tested**, NON-COMPLIANT
- [ ] Deploy MHL → header flips to **MHL active**; MHL tab shows the 📄 "published benchmark" note
- [ ] Campaign: phases **0.735 / 0.017 / 0.012**, peak **98.7%**
- [ ] Monitor: Start → live feed streams, some docs QUARANTINED → Stop
- [ ] Download PDF works (or show pre-built `docs/sample_report.pdf`)

**If it breaks**
- [ ] Recover: `make reset` (or `./scripts/demo-reset.sh`) — back to known-good in <1 min
- [ ] Port already in use → `docker compose down --remove-orphans` then `up -d`
- [ ] "API unavailable — simulation mode" → the UI still shows the right numbers; you're safe. Fix later with `docker compose restart api`.
- [ ] Full runbook: `DEMO_RUNBOOK.md`

**Talking-point guardrail**
- [ ] If asked about the exact number: the tool measures **0.017 / 98.2%**; the
      **paper reports 0.014 / 98.4%** at β=50 — same collapse, same curve.
- [ ] All MHL 100% / 0% / 22.6ms figures are **published benchmarks (SSRN 6734225)**, labelled as such on screen.
