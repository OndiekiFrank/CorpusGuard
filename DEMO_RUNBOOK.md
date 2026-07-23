# CorpusGuard — Demo Runbook (BSides)

Everything you need to run the live demo, with the exact numbers to expect at
each step. All figures below are deterministic (attack seed = 42) — what you say
on stage will match the screen.

---

## 0. Cold start (do this before you go on)

```bash
cd CorpusGuard
docker compose up -d --build        # older Docker: docker-compose up -d --build
```

Wait ~30–60s for the API healthcheck to go healthy, then confirm:

```bash
curl -s localhost:8000/api/v1/health     # -> {"status":"healthy","version":"0.1.0",...}
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000   # -> 200
```

Open the dashboard: **http://localhost:3000**
API Swagger (optional second tab): **http://localhost:8000/docs**

Approx timings: image build 1–3 min cold (seconds if cached); UI first paint <2s;
`npm install` in the UI container runs on first boot (~30–60s) — watch
`docker compose logs -f frontend` until you see "VITE ready".

Optional CLI demo (separate terminal, produces a PDF in `./reports/`):

```bash
python examples/bank_compliance_demo.py
```

---

## 1. Click path (6 tabs) with expected numbers

Header should read **v0.1.0**, **API ready**. Default target is
"RBC AML Compliance Agent", vector **QTPI**, budget **β=50**.

### Step 1 — Run a scan
Click **▶ Run scan**. Progress bar runs ~3s. Top KPI cards land on:

| Card | Value |
|---|---|
| Risk score | **98/100** (Critical) |
| Baseline F1 | **0.919** |
| Attacked F1 | **0.017** (98.2% degradation) |
| Quarantined | **20/20** (100% detection, measured) |

> Talking point: F1 collapses 0.919 → 0.017 with **0 log anomalies**. The paper's
> headline is 0.014 / 98.4% at β=50; the live simulator lands on 0.017 / 98.2%
> (same curve, rounding at the floor — see note at the bottom).

### Tab 1 — Attack results
F1 degradation curve (labelled "SSRN 6734225 Figure 3"), red marker at β=50.
Detail grid: Attack vector QTPI · Budget β=50 · Baseline 0.919 · Attacked **0.017**
· Degradation **98.2%** · Log anomalies **0** · Quarantined **20/20** · Verdict **CRITICAL**.

### Tab 2 — OWASP Top 10
Summary tiles: **Passed 0 · Failed 2 · Partial 3 · Not tested 5**.
Overall status: **NON-COMPLIANT**. LLM01 Prompt Injection = FAILED/CRITICAL.

### Tab 3 — MHL defense
Click **🛡 Deploy MHL** first (top bar) — takes ~1.5s, header flips to **MHL active**.
Three modules pulse green. Metric grid: Detection **100%** · False quarantine **0%**
· Latency p99 **22.6ms** · Retraining **None**, with a 📄 note that these are
**published benchmarks (SSRN 6734225)**, not measured in-session.

### Tab 4 — Campaign
Click **▶ Run campaign** (β base 50). Three phases run ~1s each:

| Phase | β | Attacked F1 | Degradation |
|---|---|---|---|
| Recon | 10 | 0.735 | 20.0% |
| Exploit | 50 | 0.017 | 98.2% |
| Persist | 100 | 0.012 | 98.7% |

Summary: Worst F1 **0.012** · Peak degradation **98.7%** · Total log anomalies **0**.

### Tab 5 — Monitor
Click **▶ Start monitor**. A live document feed streams (~1 doc/1.2s); ~15% are
adversarial and get **QUARANTINED** (red). Inspected/Quarantined/Rate/Alerts
counters climb; the corpus-health line chart updates. Counts here are a live
random feed and will differ run-to-run (this is the only non-deterministic tab —
don't quote exact counts). Click **⏹ Stop** when done.

### Tab 6 — Threat intel
Static feed of 4 documented attack patterns (QTPI-2026-001 … PI-2026-004) with
actor / target / mitigation. No interaction needed.

### Step — Download the PDF
Click **📄 Download PDF** (top right, enabled after a scan). Saves a CISO report.
A pre-built copy also lives at **`docs/sample_report.pdf`**.

---

## 2. One-command reset (if a demo goes sideways)

```bash
make reset          # or: ./scripts/demo-reset.sh
```

Tears down, rebuilds, relaunches, waits for healthy, and smoke-tests both ports.
Recovers to a known-good state in under a minute (seconds if images are cached).

---

## 3. Troubleshooting — three most likely failures

**A. Port already in use (`bind: address already in use` on 3000/8000).**
Something else holds the port. Find and stop it:
```bash
docker ps                        # is an old corpusguard-* container still up?
docker compose down --remove-orphans
# or find the offender:  ss -ltnp | grep -E ':3000|:8000'
```
Then `docker compose up -d`. If you cannot stop the old container (permissions),
launch on alternate ports: `docker compose up -d` after editing the `ports:`
mappings to `8001:8000` / `3001:3000`, and demo on those.

**B. Dashboard loads but scan says "API unavailable — simulation mode".**
The UI falls back to a built-in simulation, so the numbers above still appear —
the demo is safe. To fix the live API: check it's healthy
(`curl localhost:8000/api/v1/health`); if not, `docker compose logs api` and
`docker compose restart api`. The Vite proxy sends `/api` → `http://api:8000`
inside the compose network.

**C. Frontend container still installing / blank page on first load.**
On first boot the UI container runs `npm install`. Watch
`docker compose logs -f frontend` until "VITE ... ready", then refresh. If it
wedged, `docker compose restart frontend`.

---

## Note on the two attack numbers
- **Measured live (this tool):** F1 0.017 / **98.2%** degradation at β=50.
- **Published (SSRN 6734225 / README):** F1 0.014 / **98.4%** at β=50.
Both describe the same degradation curve; the simulator's exponential fit sits
just above the 0.014 floor at exactly β=50. If asked, cite the paper figure and
note the tool reproduces the same collapse. (Tracked in POLISH_STATE.md as
DISCREPANCY-1 for the author to reconcile.)
