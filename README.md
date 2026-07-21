# CorpusGuard

**Production-ready RAG security testing and defense framework**

[![CI](https://github.com/OndiekiFrank/CorpusGuard/actions/workflows/ci.yml/badge.svg)](https://github.com/OndiekiFrank/CorpusGuard/actions)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![SSRN](https://img.shields.io/badge/Research-SSRN%206734225-blue.svg)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225)
[![ACM ICAIF 2026](https://img.shields.io/badge/ACM%20ICAIF-2026%20Under%20Review-orange.svg)](https://icaif2026.org)
[![ORCID](https://img.shields.io/badge/ORCID-0009--0008--3483--0025-green.svg)](https://orcid.org/0009-0008-3483-0025)

> Built on published research: *Poisoning the Compliance Mind: Adversarial Memory Injection Attacks on RAG-Based AML Agents* — [SSRN 6734225](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225)

---

## What CorpusGuard does

CorpusGuard automatically red teams any RAG-based AI system for corpus poisoning vulnerabilities and deploys the Memory Hygiene Layer (MHL) defense to protect it.

**One command. Full security assessment. CISO-ready PDF report.**

```bash
# Option 1 — Docker Compose (full stack)
docker compose up          # older Docker: docker-compose up
# Dashboard: http://localhost:3000
# API:       http://localhost:8000/docs

# Option 2 — Run demo directly
python examples/bank_compliance_demo.py

# Option 3 — install from source (not yet published to PyPI)
pip install -e .
corpusguard scan --target my_rag_config.yaml
```

---

## The attack it finds

An adversary injects strategically crafted documents into a RAG system's vector database through legitimate ingestion pathways. The AI agent's accuracy collapses from **91.9% to 1.4%** — with zero anomalous log signatures. The system appears fully operational while making catastrophically wrong decisions.

| Finding | Result |
|---|---|
| Baseline AML agent F1 | 0.919 |
| After QTPI attack (β=50 docs) | **0.014 — 98.4% degradation** |
| Log anomalies generated | **Zero** |
| Existing framework coverage | **None** — not in NIST AI RMF, OWASP LLM Top 10, or MITRE ATLAS |

---

## The defense it deploys

| MHL Component | Function | Result |
|---|---|---|
| CPT — Cryptographic Provenance Tracking | SHA-256 hashing + source trust scoring | 100% detection, 0% false quarantine |
| FCS — Factual Consistency Scoring | Cross-encoder scoring against anchor corpus | 22.6ms p99 latency on CPU |
| SRAD — Statistical Retrieval Anomaly Detection | KS-test on 500-query sliding window | Zero-config anomaly detection |

---

## Quickstart

### Docker Compose — one command

```bash
git clone https://github.com/OndiekiFrank/CorpusGuard.git
cd CorpusGuard
docker compose up
```

Opens:
- **React Dashboard:** `http://localhost:3000`
- **FastAPI Swagger UI:** `http://localhost:8000/docs`
- PDF report auto-saved to `./reports/`

### CLI (install from source)

CorpusGuard is not yet published to PyPI — install the CLI from a clone:

```bash
git clone https://github.com/OndiekiFrank/CorpusGuard.git
cd CorpusGuard
pip install -e .

corpusguard scan --target config/my_rag.yaml
corpusguard attack --vector qtpi --budget 50
corpusguard defend --mode full
corpusguard report --format pdf --output ./ciso_report.pdf
```

### Bank compliance demo

```bash
python examples/bank_compliance_demo.py
```

Runs a complete 5-phase assessment — attack campaign, MHL defense, OWASP scorecard, real-time monitor, CISO PDF report.

---

## Architecture

```
CorpusGuard/
├── frontend/                    ← React + Vite professional dark UI (port 3000)
│   └── src/components/
│       ├── TabView.jsx          ← 6 tabs: Attack, OWASP, MHL, Campaign, Monitor, Threat Intel
│       ├── MonitorTab.jsx       ← Real-time corpus monitoring with live chart
│       ├── CampaignRunner.jsx   ← 3-phase visual stepper
│       └── PDFReport.jsx        ← One-click PDF download
├── corpusguard/
│   ├── api/main.py              ← FastAPI REST gateway — 7 endpoints (port 8000)
│   ├── attacks/
│   │   ├── qtpi.py              ← Query-Time Prompt Injection attack
│   │   └── campaign.py          ← Multi-phase attack campaigns
│   ├── defense/
│   │   ├── mhl.py               ← Memory Hygiene Layer (main)
│   │   ├── cpt.py               ← Cryptographic Provenance Tracking
│   │   ├── fcs.py               ← Factual Consistency Scoring
│   │   └── srad.py              ← Statistical Retrieval Anomaly Detection
│   ├── scanner/
│   │   ├── owasp.py             ← OWASP LLM Top 10 compliance scorecard
│   │   └── monitor.py           ← Real-time monitoring daemon
│   └── dashboard/
│       ├── app.py               ← Streamlit dashboard (alternative UI)
│       └── report_generator.py  ← CISO-ready PDF report generator
├── examples/
│   └── bank_compliance_demo.py  ← Full end-to-end bank assessment demo
├── tests/                       ← 9/9 tests passing (Python 3.9, 3.10, 3.11)
├── docker-compose.yml           ← Full stack: API + React UI + Redis
├── Dockerfile                   ← API container (lean runtime deps)
├── Dockerfile.dashboard         ← Streamlit container
└── .github/workflows/
    ├── ci.yml                   ← GitHub Actions CI/CD
    └── security-gate.yml        ← EU AI Act compliance gate
```

---

## REST API

Full Swagger UI at `http://localhost:8000/docs`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/scan` | Submit RAG system for scanning |
| GET | `/api/v1/scan/{id}` | Get scan results |
| GET | `/api/v1/owasp/{id}` | OWASP LLM Top 10 scorecard |
| GET | `/api/v1/report/{id}` | Download PDF report |
| POST | `/api/v1/defend` | Deploy MHL defense |
| GET | `/api/v1/scans` | List all scans |

---

## React Dashboard — 6 Tabs

| Tab | What it shows |
|---|---|
| Attack results | Live F1 degradation chart, attack metrics, verdict |
| OWASP LLM Top 10 | Full compliance scorecard with severity badges |
| MHL defense | Module status with live pulse indicators |
| Campaign | 3-phase visual stepper — Recon → Exploit → Persist |
| Monitor | Real-time document feed, corpus health chart, live alerts |
| Threat intel | Documented attack patterns with actor, target, mitigation |

---

## OWASP LLM Top 10 Coverage

| ID | Vulnerability | Status |
|---|---|---|
| LLM01 | Prompt Injection | **TESTED — CRITICAL** |
| LLM03 | Training Data Poisoning | **TESTED — PARTIAL** |
| LLM05 | Supply Chain Vulnerabilities | **TESTED — FAILED** |
| LLM06 | Sensitive Information Disclosure | **TESTED — PARTIAL** |
| LLM09 | Overreliance | **TESTED — PARTIAL** |
| LLM02, 04, 07, 08, 10 | Various | Planned v0.3 |

---

## Regulatory Coverage

| Framework | CorpusGuard Mitigation |
|---|---|
| NIST AI RMF | First reference implementation for RAG corpus security |
| OWASP LLM Top 10 | QTPI formalises new LLM01 sub-category |
| MITRE ATLAS | New corpus-level attack pattern documented |
| FINRA Rule 3110 | CPT provides cryptographic audit trail |
| FinCEN 2024 | CPT + SRAD provide auditable controls |
| FATF 2025 | CPT detects source-level anomalies |
| EU AI Act Aug 2026 | CI/CD security gate — automated red-teaming built-in |

---

## CI/CD Security Gate

```yaml
- name: CorpusGuard Security Gate
  uses: OndiekiFrank/corpusguard-action@v1
  with:
    target: ${{ secrets.RAG_ENDPOINT }}
    fail-on-risk-score: 70
```

Blocks deployment if RAG system scores above 70/100. EU AI Act compliant.

---

## Test Results

```
16 passed — attack, defense, and API smoke tests
CI matrix: Python 3.9 / 3.10 / 3.11 (.github/workflows/ci.yml)
```

---

## Research

> **Poisoning the Compliance Mind: Adversarial Memory Injection Attacks on RAG-Based AML Agents**
> Frankline Ondieki Ombachi · SSRN 6734225 · 2026
> Under peer review — ACM ICAIF 2026, Milan, Italy
> BSides Toronto 2026 talk submitted — October 3–4

```bibtex
@article{ondieki2026poisoning,
  title  = {Poisoning the Compliance Mind: Adversarial Memory Injection Attacks on RAG-Based AML Agents},
  author = {Ondieki Ombachi, Frankline},
  year   = {2026},
  url    = {https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225},
  note   = {Under peer review at ACM ICAIF 2026}
}
```

---

## Disclaimer

For academic reproducibility and defensive security research only. Do not use against systems you do not own or have explicit permission to test.

---

## Author

**Frankline Ondieki Ombachi** — AI Security Researcher · Nairobi, Kenya

📧 ondiekifrank021@gmail.com
🔗 [LinkedIn](https://www.linkedin.com/in/frankline-ondieki-39a61828a/)
📄 [SSRN 6734225](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225)
🔬 [ORCID: 0009-0008-3483-0025](https://orcid.org/0009-0008-3483-0025)

*If your organisation runs RAG-based AI systems — run CorpusGuard before someone else does.*
