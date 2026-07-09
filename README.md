# CorpusGuard

**Production-ready RAG security testing and defense framework**

[![PyPI](https://img.shields.io/pypi/v/corpusguard.svg)](https://pypi.org/project/corpusguard/)
[![Docker](https://img.shields.io/docker/pulls/ondiekifrank/corpusguard.svg)](https://hub.docker.com/r/ondiekifrank/corpusguard)
[![CI](https://github.com/OndiekiFrank/CorpusGuard/actions/workflows/ci.yml/badge.svg)](https://github.com/OndiekiFrank/CorpusGuard/actions)
[![SSRN](https://img.shields.io/badge/Research-SSRN%206734225-blue.svg)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225)
[![ACM ICAIF 2026](https://img.shields.io/badge/ACM%20ICAIF-2026%20Under%20Review-orange.svg)](https://icaif2026.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org)
[![ORCID](https://img.shields.io/badge/ORCID-0009--0008--3483--0025-green.svg)](https://orcid.org/0009-0008-3483-0025)

> Based on published research: *Poisoning the Compliance Mind: Adversarial Memory Injection Attacks on RAG-Based AML Agents* — [SSRN 6734225](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225)

---

## What CorpusGuard does

CorpusGuard automatically red teams any RAG-based AI system for corpus poisoning vulnerabilities — the attack documented in SSRN 6734225 — and deploys the Memory Hygiene Layer (MHL) defense to protect it.

**One command. Full security assessment. PDF report for your CISO.**

```bash
docker compose up
# Dashboard: http://localhost:8501
# PDF report: ./reports/corpusguard_report.pdf
```

---

## The attack it finds

An adversary injects 50 strategically crafted documents into a RAG system's vector database through legitimate ingestion pathways. The AI agent's accuracy collapses from **91.9% to 1.4%**. Zero anomalous log signatures. The system appears fully operational while making catastrophically wrong decisions.

This vulnerability exists in every RAG-based AI system that does not implement corpus integrity controls — including AI compliance agents, RAG-based legal research tools, and automated regulatory reporting systems at financial institutions.

| Finding | Result |
|---|---|
| Baseline AML agent F1 | 0.919 |
| After QTPI attack (β=50 docs) | **0.014 — 98.4% degradation** |
| Log anomalies generated | **Zero** |
| Existing framework coverage | **None** — not in NIST AI RMF, OWASP LLM Top 10, or MITRE ATLAS |

---

## The defense it deploys

The Memory Hygiene Layer (MHL) — a modular, training-free defense that intercepts documents before they enter the vector index.

| MHL Component | Function | Result |
|---|---|---|
| CPT — Cryptographic Provenance Tracking | SHA-256 hashing + source trust scoring | 100% detection, 0% false quarantine |
| FCS — Factual Consistency Scoring | Cross-encoder scoring against anchor corpus | 22.6ms p99 latency on CPU |
| SRAD — Statistical Retrieval Anomaly Detection | KS-test on 500-query sliding window | Zero-config anomaly detection |

---

## Quickstart

### Option 1 — Docker Compose (recommended)

```bash
git clone https://github.com/OndiekiFrank/CorpusGuard.git
cd CorpusGuard
docker compose up
```

Opens:
- Dashboard: `http://localhost:8501`
- API: `http://localhost:8000`
- PDF report auto-saved to `./reports/`

### Option 2 — Kubernetes (production)

```bash
helm install corpusguard ./helm/corpusguard \
  --set target.url=https://your-rag-system.com \
  --set report.output=s3://your-bucket/reports/
```

### Option 3 — pip CLI

```bash
pip install corpusguard

# Scan a RAG system for vulnerabilities
corpusguard scan --target config/my_rag.yaml

# Run a controlled attack (research/testing only)
corpusguard attack --vector qtpi --budget 50

# Deploy the MHL defense layer
corpusguard defend --mode full

# Generate a PDF report
corpusguard report --format pdf --output ./ciso_report.pdf
```

---

## Architecture

```
CorpusGuard/
├── corpusguard/
│   ├── attacks/
│   │   ├── qtpi.py              # Query-Time Prompt Injection
│   │   ├── document_poisoning.py
│   │   ├── rank_manipulation.py
│   │   └── runner.py            # Orchestrates all attack vectors
│   ├── defense/
│   │   ├── mhl.py               # Memory Hygiene Layer (main)
│   │   ├── cpt.py               # Cryptographic Provenance Tracking
│   │   ├── fcs.py               # Factual Consistency Scoring
│   │   └── srad.py              # Statistical Retrieval Anomaly Detection
│   ├── scanner/
│   │   ├── corpus_inspector.py  # Scan existing vector DB
│   │   └── risk_scorer.py       # Risk score 0-100
│   ├── dashboard/
│   │   ├── app.py               # Streamlit live dashboard
│   │   └── report_generator.py  # Auto PDF report (CISO-ready)
│   └── api/
│       └── main.py              # FastAPI gateway
├── docker-compose.yml
├── Dockerfile
├── helm/corpusguard/            # Kubernetes Helm chart
└── .github/workflows/ci.yml    # GitHub Actions CI/CD
```

---

## PDF Report

CorpusGuard automatically generates a professional PDF security report containing:

- **Executive summary** — risk score, vulnerabilities found, recommended actions (written for a CISO, not a developer)
- **Attack results** — F1 degradation curves, minimum injection budget, attack vector analysis
- **Defense recommendations** — MHL deployment instructions, CPT configuration
- **Regulatory mapping** — NIST AI RMF gaps, OWASP LLM Top 10 coverage, FINRA/FinCEN implications

---

## Regulatory Coverage

| Framework | Vulnerability Addressed | CorpusGuard Mitigation |
|---|---|---|
| NIST AI RMF | No profile governs retrieval corpus integrity | First reference implementation for RAG corpus security |
| OWASP LLM Top 10 | Prompt injection extended to corpus level — not covered | QTPI formalises new sub-category |
| MITRE ATLAS | No technique covers corpus-level manipulation | New attack pattern documented and mitigated |
| FINRA Rule 3110 | QTPI corrupts agent reasoning with no audit signature | CPT audit trail with cryptographic integrity |
| FinCEN 2024 Proposed Rule | Agent at F1=0.014 is not "reasonably designed" | CPT + SRAD provide auditable controls |
| FATF 2025 AI Horizon Scan | LLM-generated adversarial documents bypass review | CPT detects source-level anomalies |

---

## Research

This framework implements the attack and defense described in:

> **Poisoning the Compliance Mind: Adversarial Memory Injection Attacks on RAG-Based AML Agents**
> Frankline Ondieki Ombachi · SSRN Preprint 6734225 · 2026
> Under peer review at ACM ICAIF 2026, Milan, Italy

```bibtex
@article{ondieki2026poisoning,
  title   = {Poisoning the Compliance Mind: Adversarial Memory Injection Attacks on RAG-Based AML Agents},
  author  = {Ondieki Ombachi, Frankline},
  journal = {SSRN Preprint 6734225},
  year    = {2026},
  url     = {https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225},
  note    = {Under peer review at ACM ICAIF 2026, Milan, Italy}
}
```

---

## Disclaimer

The attack methodology is provided for academic reproducibility and defensive security research only. CorpusGuard is designed to help organisations find and fix vulnerabilities in their own AI systems. The Memory Hygiene Layer defense is described in greater implementation detail than the attacks, reflecting the net-positive safety intent of this disclosure. Do not use these techniques against systems you do not own or have explicit permission to test.

---

## Author

**Frankline Ondieki Ombachi** — AI Security Researcher · Nairobi, Kenya

📧 ondiekifrank021@gmail.com
🔗 [LinkedIn](https://www.linkedin.com/in/frankline-ondieki-39a61828a/)
📄 [SSRN Research](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6734225)
🔬 [ORCID: 0009-0008-3483-0025](https://orcid.org/0009-0008-3483-0025)

*If your organisation runs RAG-based AI systems — run CorpusGuard before someone else does.*
