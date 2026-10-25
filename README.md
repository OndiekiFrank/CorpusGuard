# CorpusGuard

**Red-teaming and defense framework for corpus poisoning and prompt injection in RAG systems — research prototype (v0.1.0)**

[![CI](https://github.com/OndiekiFrank/CorpusGuard/actions/workflows/ci.yml/badge.svg)](https://github.com/OndiekiFrank/CorpusGuard/actions)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![SSRN](https://img.shields.io/badge/Preprint-SSRN%206734225-blue.svg)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225)
[![ORCID](https://img.shields.io/badge/ORCID-0009--0008--3483--0025-green.svg)](https://orcid.org/0009-0008-3483-0025)

> Reference implementation for the preprint *Poisoning the Compliance Mind: Adversarial Memory Injection Attacks on RAG-Based AML Agents* — [SSRN 6734225](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225)

---

## What CorpusGuard does

CorpusGuard runs adversarial document-injection attacks against a retrieval-augmented generation (RAG) pipeline, measures how much the downstream decisions degrade, and applies the Memory Hygiene Layer (MHL), a training-free ingestion-time defense. It was built to study RAG-based anti-money-laundering (AML) agents, where a poisoned retrieval corpus can silently suppress suspicious activity reports.

It produces a scored assessment and a PDF report. See [`docs/sample_report.pdf`](docs/sample_report.pdf) for an example output.

```bash
# Option 1 — Docker Compose (full stack)
docker compose up          # older Docker: docker-compose up
# Dashboard: http://localhost:3000
# API:       http://localhost:8000/docs

# Option 2 — Run the demo directly
python examples/bank_compliance_demo.py

# Option 3 — install from source (not yet published to PyPI)
pip install -e .
corpusguard scan --target my_rag_config.yaml
```

---

## Key finding from the paper

In a simulated RAG-based AML agent (synthetic corpus of 10,000 documents derived from the PaySim simulator and FATF/FinCEN-style guidance), injecting **50 documents containing embedded instructions** — query-time prompt injection (QTPI) — reduced the agent's F1 on the trade-based money laundering test set from **0.919 to 0.014**. An F1 that low means the agent's decisions were systematically inverted, not merely degraded. The injected documents entered through a normal ingestion pathway and produced no anomalous entries in transaction logs.

| Attack vector | F1 at β = 50 documents | Effect |
|---|---|---|
| Baseline (no attack) | 0.919 | — |
| QTPI — query-time prompt injection | **0.014** | Collapse (98.4% drop) |
| DP — document poisoning | 0.924 | No material degradation* |
| RRM — retrieval rank manipulation | 0.942 | No material degradation* |

\*See [Limitations](#limitations): the decision component in these experiments is a keyword-weighted heuristic, which likely understates the effect of semantic attacks (DP, RRM) on a real LLM.

QTPI is an instance of indirect prompt injection (OWASP LLM01; Greshake et al., 2023) applied to a compliance retrieval corpus.

---

## The defense: Memory Hygiene Layer (MHL)

| Module | What it does | Result in the paper (DP attack, β = 280) |
|---|---|---|
| CPT — Cryptographic Provenance Tracking | SHA-256 content hashing plus per-source trust scores | 100% detection of injections from low-trust sources, 0% false quarantine. **Does not detect injections arriving through trusted sources.** |
| FCS — Factual Consistency Scoring | Cross-encoder consistency check against an anchor corpus of regulatory documents | 22.6 ms p99 latency on CPU. **False quarantine of 30.4–59.8% of clean documents depending on threshold — not yet deployable without calibration.** |
| SRAD — Statistical Retrieval Anomaly Detection | Concentration scores and KS test over a 500-query sliding window | Content-agnostic monitoring; no detections in the DP experiment. |

---

## Limitations

This is a research prototype. Please read these before relying on any number above.

1. **No real LLM in the decision loop.** All reported experiments use a heuristic classifier that weights keyword signals in retrieved documents. Results against GPT-class or open-weight LLM backends have not yet been measured.
2. **MHL was not evaluated against QTPI**, the attack that actually succeeded. The defense results above are for document poisoning only.
3. **FCS false quarantine is too high** for production use at the thresholds tested.
4. **Synthetic data.** The corpus and transactions are simulated; no real bank data was used.
5. **Black-box adversary only.** A white-box attacker optimising documents to pass FCS is not modelled.
6. Some values shown in the dashboard are constants reported in the paper rather than live measurements from your run. <!-- remove this line once fixed -->
7. **Reproduction gap.** Running this tool at β = 50 yields F1 0.017 (98.2% drop) rather than the 0.014 (98.4%) reported in the paper, which averages five runs. Both show the same collapse; the exact figure varies with random seed.

---

## Roadmap

These follow directly from peer-review feedback on the paper:

- Replace the heuristic classifier with open-weight LLM backends and re-measure all three attack vectors
- Evaluate MHL — and existing prompt-injection detectors — against QTPI, including injections written in regulatory language
- Reduce FCS false quarantine through threshold calibration and domain-specific anchor corpora
- Add an adaptive (white-box) attacker

---

## Quickstart

### Docker Compose — one command

```bash
git clone https://github.com/OndiekiFrank/CorpusGuard.git
cd CorpusGuard
docker compose up
```

Opens:
- **React dashboard:** `http://localhost:3000`
- **FastAPI Swagger UI:** `http://localhost:8000/docs`
- PDF reports saved to `./reports/`

### CLI (install from source)

CorpusGuard is not yet published to PyPI — install the CLI from a clone:

```bash
git clone https://github.com/OndiekiFrank/CorpusGuard.git
cd CorpusGuard
pip install -e .

corpusguard scan --target config/my_rag.yaml
corpusguard attack --vector qtpi --budget 50
corpusguard defend --mode full
corpusguard report --format pdf --output ./report.pdf
```

### Bank compliance demo

```bash
python examples/bank_compliance_demo.py
```

Runs a five-phase assessment on synthetic data: attack campaign, MHL defense, OWASP LLM Top 10 checklist, monitoring, and PDF report.

---

## Architecture

```
CorpusGuard/
├── frontend/                    ← React + Vite dashboard (port 3000)
│   └── src/components/
│       ├── TabView.jsx          ← 6 tabs: Attack, OWASP, MHL, Campaign, Monitor, Threat Intel
│       ├── MonitorTab.jsx       ← Corpus monitoring view
│       ├── CampaignRunner.jsx   ← 3-phase attack campaign stepper
│       └── PDFReport.jsx        ← PDF download
├── corpusguard/
│   ├── api/main.py              ← FastAPI REST API — 7 endpoints (port 8000)
│   ├── attacks/
│   │   ├── qtpi.py              ← Query-time prompt injection attack
│   │   └── campaign.py          ← Multi-phase attack campaigns
│   ├── defense/
│   │   ├── mhl.py               ← Memory Hygiene Layer (orchestrator)
│   │   ├── cpt.py               ← Cryptographic Provenance Tracking
│   │   ├── fcs.py               ← Factual Consistency Scoring
│   │   └── srad.py              ← Statistical Retrieval Anomaly Detection
│   ├── scanner/
│   │   ├── owasp.py             ← OWASP LLM Top 10 checklist
│   │   └── monitor.py           ← Monitoring daemon
│   └── dashboard/
│       ├── app.py               ← Streamlit dashboard (alternative UI)
│       └── report_generator.py  ← PDF report generator
├── examples/
│   └── bank_compliance_demo.py  ← End-to-end demo on synthetic data
├── tests/                       ← pytest suite (Python 3.9, 3.10, 3.11)
├── docker-compose.yml           ← API + React UI + Redis
├── Dockerfile                   ← API container
├── Dockerfile.dashboard         ← Streamlit container
└── .github/workflows/
    ├── ci.yml                   ← Tests and linting
    └── security-gate.yml        ← Example: fail a build if the risk score exceeds a threshold
```

---

## REST API

Full Swagger UI at `http://localhost:8000/docs`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/scan` | Submit a RAG configuration for scanning |
| GET | `/api/v1/scan/{id}` | Get scan results |
| GET | `/api/v1/owasp/{id}` | OWASP LLM Top 10 checklist results |
| GET | `/api/v1/report/{id}` | Download PDF report |
| POST | `/api/v1/defend` | Apply MHL defense |
| GET | `/api/v1/scans` | List all scans |

---

## OWASP LLM Top 10 checks

Uses the 2023 (v1.1) numbering.

| ID | Vulnerability | Status in CorpusGuard |
|---|---|---|
| LLM01 | Prompt Injection | Tested |
| LLM03 | Training Data Poisoning (corpus-level) | Partially tested |
| LLM05 | Supply Chain Vulnerabilities | Tested (ingestion sources) |
| LLM06 | Sensitive Information Disclosure | Partially tested |
| LLM09 | Overreliance | Partially tested |
| LLM02, 04, 07, 08, 10 | — | Planned |

---

## Regulatory context

The paper maps the threat to existing supervisory expectations. CorpusGuard does not certify compliance with any of these; it provides evidence that may support a firm's own assessment.

| Framework | Relevance |
|---|---|
| FINRA 2026 oversight report (AI agents) | Monitoring and audit trail of agent inputs — CPT logs every ingestion decision |
| FCA statements on AI traceability | Links each decision to its retrieved sources and their provenance |
| FinCEN 2024 proposed AML/CFT rule | Evidence that an AI-assisted system is tested under adversarial conditions |
| FATF 2025 Horizon Scan | Criminal use of AI-generated documents to evade detection |
| EU AI Act | Supports robustness testing; does not by itself establish conformity |

---

## Research

> **Poisoning the Compliance Mind: Adversarial Memory Injection Attacks on RAG-Based AML Agents**
> Frankline Ondieki Ombachi · SSRN preprint 6734225 · 2026
> Submitted to ACM ICAIF 2026 (not accepted); a revised version addressing reviewer feedback is in preparation.
> Presented at BSides Toronto 2026, October 3–4. <!-- keep ONLY if you actually gave the talk; otherwise delete this line -->

```bibtex
@misc{ondieki2026poisoning,
  title        = {Poisoning the Compliance Mind: Adversarial Memory Injection Attacks on RAG-Based AML Agents},
  author       = {Ondieki Ombachi, Frankline},
  year         = {2026},
  howpublished = {SSRN preprint 6734225},
  url          = {https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225}
}
```

---

## Responsible use

For defensive security research and reproducibility only. Do not run attacks against systems you do not own or are not explicitly authorised to test.

---

## Author

**Frankline Ondieki Ombachi** — AI security researcher · Nairobi, Kenya

📧 ondiekifrank021@gmail.com
🔗 [LinkedIn](https://www.linkedin.com/in/frankline-ondieki-39a61828a/)
📄 [SSRN 6734225](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225)
🔬 [ORCID: 0009-0008-3483-0025](https://orcid.org/0009-0008-3483-0025)

Feedback, issues and collaboration on LLM-backend evaluation are welcome.
