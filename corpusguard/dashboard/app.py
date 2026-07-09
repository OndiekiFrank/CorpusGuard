"""
CorpusGuard Dashboard
======================
Live Streamlit dashboard for RAG security monitoring.
Run: streamlit run corpusguard/dashboard/app.py
"""

import time
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import streamlit as st
import pandas as pd
import numpy as np

st.set_page_config(
    page_title="CorpusGuard — RAG Security Monitor",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
.metric-card {
    background: #EBF3FB;
    border-left: 4px solid #1F4E79;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}
.risk-critical { color: #C00000; font-weight: bold; font-size: 2rem; }
.risk-moderate { color: #BA7517; font-weight: bold; font-size: 2rem; }
.risk-low { color: #1D9E75; font-weight: bold; font-size: 2rem; }
</style>
""", unsafe_allow_html=True)

# SIDEBAR
with st.sidebar:
    st.markdown("## 🛡️ CorpusGuard")
    st.markdown("*RAG Security Testing & Defense*")
    st.divider()

    st.markdown("### Target System")
    target_url = st.text_input("RAG system URL", placeholder="http://localhost:8000")
    attack_vector = st.selectbox(
        "Attack vector",
        ["QTPI (most lethal)", "Document Poisoning", "Rank Manipulation", "All vectors"]
    )
    injection_budget = st.slider("Injection budget (β)", 10, 500, 50, step=10)
    simulate_mode = st.checkbox("Simulation mode", value=True, help="Run without a real target")

    st.divider()
    st.markdown("### MHL Defense")
    enable_cpt = st.checkbox("CPT — Provenance Tracking", value=True)
    enable_fcs = st.checkbox("FCS — Consistency Scoring", value=True)
    fcs_threshold = st.slider("FCS threshold", 0.3, 0.9, 0.65, step=0.05)
    enable_srad = st.checkbox("SRAD — Anomaly Detection", value=True)

    st.divider()
    run_scan = st.button("🔍 Run Security Scan", type="primary", use_container_width=True)
    gen_report = st.button("📄 Generate PDF Report", use_container_width=True)

# MAIN CONTENT
st.title("🛡️ CorpusGuard — RAG Security Monitor")
st.caption("Based on published research: SSRN 6734225 — Ondieki Ombachi, 2026")
st.divider()

# STATUS METRICS
col1, col2, col3, col4 = st.columns(4)

if "scan_done" not in st.session_state:
    st.session_state.scan_done = False
    st.session_state.baseline_f1 = 0.919
    st.session_state.attacked_f1 = None
    st.session_state.degradation = None
    st.session_state.risk_score = 0
    st.session_state.docs_inspected = 0
    st.session_state.docs_quarantined = 0

with col1:
    risk = st.session_state.risk_score
    risk_class = "critical" if risk >= 70 else ("moderate" if risk >= 40 else "low")
    st.metric("Risk Score", f"{risk}/100", delta=None)

with col2:
    st.metric("Baseline F1", f"{st.session_state.baseline_f1:.3f}")

with col3:
    atk = st.session_state.attacked_f1
    st.metric(
        "Attacked F1",
        f"{atk:.3f}" if atk is not None else "—",
        delta=f"{st.session_state.degradation:.1f}%" if st.session_state.degradation else None,
        delta_color="inverse",
    )

with col4:
    st.metric(
        "Documents Quarantined",
        st.session_state.docs_quarantined,
    )

st.divider()

# RUN SCAN
if run_scan:
    with st.spinner("Running security assessment..."):
        progress = st.progress(0, text="Initialising attack engine...")
        time.sleep(0.5)

        from corpusguard.attacks.qtpi import QTPIAttack, QTPIConfig
        from corpusguard.defense.mhl import MemoryHygieneLayer, MHLConfig

        config = QTPIConfig(injection_budget=injection_budget)
        attack = QTPIAttack(config)

        progress.progress(25, text="Running attack simulation...")
        time.sleep(0.8)
        result = attack.run(simulate=True)

        progress.progress(50, text="Deploying MHL defense...")
        time.sleep(0.5)

        mhl_config = MHLConfig(
            cpt_enabled=enable_cpt,
            fcs_enabled=enable_fcs,
            fcs_threshold=fcs_threshold,
            srad_enabled=enable_srad,
        )
        mhl = MemoryHygieneLayer(mhl_config)

        docs = [attack.generate_adversarial_document(i) for i in range(min(20, injection_budget))]
        inspections = mhl.inspect_batch(docs)

        progress.progress(75, text="Generating risk score...")
        time.sleep(0.5)

        quarantined = sum(1 for r in inspections if not r.is_safe)
        risk_score = min(100, int(result.degradation_pct))

        st.session_state.scan_done = True
        st.session_state.attacked_f1 = result.attacked_f1
        st.session_state.degradation = -result.degradation_pct
        st.session_state.risk_score = risk_score
        st.session_state.docs_inspected = len(inspections)
        st.session_state.docs_quarantined = quarantined
        st.session_state.result = result
        st.session_state.inspections = inspections

        progress.progress(100, text="Complete.")
        time.sleep(0.3)
        st.rerun()

# RESULTS
if st.session_state.scan_done:
    result = st.session_state.result
    inspections = st.session_state.inspections

    tab1, tab2, tab3 = st.tabs(["📊 Attack Results", "🛡️ MHL Defense", "📋 Inspection Log"])

    with tab1:
        st.markdown("### Attack Degradation")
        col1, col2 = st.columns(2)

        with col1:
            betas = list(range(0, injection_budget + 1, max(1, injection_budget // 20)))
            f1_values = []
            for b in betas:
                if b == 0:
                    f1_values.append(0.919)
                elif b <= 10:
                    f1_values.append(max(0.014, 0.919 * (1 - 0.02 * b)))
                else:
                    f1_values.append(max(0.014, 0.919 * np.exp(-0.08 * b)))

            df_attack = pd.DataFrame({"Injection budget (β)": betas, "Agent F1 score": f1_values})
            st.line_chart(df_attack.set_index("Injection budget (β)"), color="#C00000")
            st.caption("QTPI attack: F1 degradation curve (from SSRN 6734225 Figure 3)")

        with col2:
            st.markdown(f"""
| Metric | Value |
|---|---|
| **Attack vector** | QTPI |
| **Injection budget** | {injection_budget} documents |
| **Baseline F1** | {result.baseline_f1:.3f} |
| **Attacked F1** | {result.attacked_f1:.3f} |
| **Degradation** | **{result.degradation_pct:.1f}%** |
| **Log anomalies** | **{result.log_anomalies} (Zero)** |
| **Attack duration** | {result.duration_seconds:.2f}s |
""")
            if result.degradation_pct > 80:
                st.error("⚠️ CRITICAL: System is highly vulnerable to QTPI attacks.")
            elif result.degradation_pct > 40:
                st.warning("⚠️ MODERATE: Partial vulnerability detected.")
            else:
                st.success("✅ LOW: System shows resilience to tested attacks.")

    with tab2:
        st.markdown("### Memory Hygiene Layer Performance")
        col1, col2, col3 = st.columns(3)

        with col1:
            cpt_caught = sum(1 for r in inspections if any("CPT" in reason for reason in r.reasons))
            st.metric("CPT Detection Rate", f"{cpt_caught/len(inspections)*100:.0f}%", help="Cryptographic Provenance Tracking")

        with col2:
            avg_latency = np.mean([r.latency_ms for r in inspections])
            st.metric("Avg MHL Latency", f"{avg_latency:.1f}ms", help="Per-document inspection latency")

        with col3:
            quarantine_rate = st.session_state.docs_quarantined / len(inspections) * 100
            st.metric("Quarantine Rate", f"{quarantine_rate:.0f}%")

        df_mhl = pd.DataFrame([{
            "Doc ID": r.document_id,
            "Verdict": r.verdict.value,
            "CPT Score": f"{r.cpt_score:.3f}",
            "FCS Score": f"{r.fcs_score:.3f}",
            "SRAD Score": f"{r.srad_score:.3f}",
            "Latency (ms)": f"{r.latency_ms:.1f}",
        } for r in inspections])
        st.dataframe(df_mhl, use_container_width=True)

    with tab3:
        st.markdown("### Document Inspection Log")
        for r in inspections[:10]:
            status = "🔴 QUARANTINED" if not r.is_safe else "🟢 SAFE"
            with st.expander(f"{status} — {r.document_id}"):
                st.json({
                    "verdict": r.verdict.value,
                    "cpt_score": r.cpt_score,
                    "fcs_score": r.fcs_score,
                    "srad_score": r.srad_score,
                    "latency_ms": r.latency_ms,
                    "reasons": r.reasons,
                    "metadata": r.metadata,
                })

# GENERATE REPORT
if gen_report:
    with st.spinner("Generating PDF report..."):
        from corpusguard.dashboard.report_generator import ReportData, generate_pdf_report

        ar = {}
        if st.session_state.scan_done and hasattr(st.session_state, "result"):
            r = st.session_state.result
            ar = {
                "qtpi_budget": r.injection_budget,
                "baseline_f1": r.baseline_f1,
                "attacked_f1": r.attacked_f1,
                "degradation": f"{r.degradation_pct:.1f}%",
            }

        data = ReportData(
            target_system=target_url or "RAG-based AML Compliance Agent",
            risk_score=st.session_state.risk_score,
            vulnerabilities_found=1 if st.session_state.scan_done else 0,
            attack_results=ar,
        )

        path = generate_pdf_report(data, "./reports/corpusguard_report.pdf")
        st.success(f"✅ PDF report generated: {path}")

        try:
            with open(path, "rb") as f:
                st.download_button(
                    "⬇️ Download PDF Report",
                    f.read(),
                    file_name="corpusguard_report.pdf",
                    mime="application/pdf",
                )
        except FileNotFoundError:
            st.info("Report saved to ./reports/corpusguard_report.pdf")

# FOOTER
st.divider()
st.caption(
    "CorpusGuard v0.1.0 · github.com/OndiekiFrank/CorpusGuard · "
    "Based on SSRN 6734225 · Frankline Ondieki Ombachi · "
    "For authorized security testing only"
)
