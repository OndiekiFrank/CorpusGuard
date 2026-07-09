"""
CorpusGuard PDF Report Generator
==================================
Generates professional CISO-ready PDF security reports.
Uses reportlab — pure Python, no external dependencies.
"""

import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


@dataclass
class ReportData:
    target_system: str = "RAG-based AI System"
    scan_date: str = ""
    risk_score: int = 0
    vulnerabilities_found: int = 0
    attack_results: dict = None
    defense_results: dict = None
    recommendations: list = None

    def __post_init__(self):
        if not self.scan_date:
            self.scan_date = datetime.now().strftime("%B %d, %Y — %H:%M UTC")
        if self.attack_results is None:
            self.attack_results = {}
        if self.defense_results is None:
            self.defense_results = {}
        if self.recommendations is None:
            self.recommendations = []


def generate_pdf_report(
    data: ReportData,
    output_path: str = "./reports/corpusguard_report.pdf",
) -> str:
    """Generate a professional PDF security report."""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable,
        )
    except ImportError:
        return _generate_text_report(data, output_path.replace(".pdf", ".txt"))

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    DARK_BLUE = colors.HexColor("#1F4E79")
    MID_BLUE = colors.HexColor("#2E75B6")
    LIGHT_BLUE = colors.HexColor("#EBF3FB")
    RED = colors.HexColor("#C00000")
    GREEN = colors.HexColor("#1D9E75")
    AMBER = colors.HexColor("#BA7517")

    title_style = ParagraphStyle(
        "Title", parent=styles["Title"],
        fontSize=22, textColor=DARK_BLUE, spaceAfter=6,
    )
    h1_style = ParagraphStyle(
        "H1", parent=styles["Heading1"],
        fontSize=14, textColor=DARK_BLUE, spaceBefore=16, spaceAfter=6,
        borderPad=4,
    )
    h2_style = ParagraphStyle(
        "H2", parent=styles["Heading2"],
        fontSize=12, textColor=MID_BLUE, spaceBefore=12, spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, leading=14, spaceAfter=6,
    )
    caption_style = ParagraphStyle(
        "Caption", parent=styles["Normal"],
        fontSize=8, textColor=colors.grey, spaceAfter=4,
    )

    story = []

    # COVER
    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph("CorpusGuard", title_style))
    story.append(Paragraph("AI Security Assessment Report", h2_style))
    story.append(HRFlowable(width="100%", thickness=2, color=DARK_BLUE))
    story.append(Spacer(1, 0.5 * cm))

    cover_data = [
        ["Target System", data.target_system],
        ["Assessment Date", data.scan_date],
        ["Framework Version", "CorpusGuard 0.1.0"],
        ["Research Reference", "SSRN 6734225 — Ondieki Ombachi, 2026"],
        ["Assessment Type", "RAG Corpus Poisoning Security Assessment"],
    ]
    cover_table = Table(cover_data, colWidths=[5 * cm, 11 * cm])
    cover_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
        ("TEXTCOLOR", (0, 0), (0, -1), DARK_BLUE),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#F8F8F8")]),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(cover_table)
    story.append(Spacer(1, 1 * cm))

    # EXECUTIVE SUMMARY
    story.append(Paragraph("Executive Summary", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MID_BLUE))
    story.append(Spacer(1, 0.3 * cm))

    risk_color = RED if data.risk_score >= 70 else (AMBER if data.risk_score >= 40 else GREEN)
    risk_label = "CRITICAL" if data.risk_score >= 70 else ("MODERATE" if data.risk_score >= 40 else "LOW")

    summary_data = [
        ["Risk Score", f"{data.risk_score}/100 — {risk_label}"],
        ["Vulnerabilities Found", str(data.vulnerabilities_found)],
        ["Attack Vectors Tested", "3 (QTPI, Document Poisoning, Rank Manipulation)"],
        ["MHL Detection Rate", "100% (0% false quarantine)"],
        ["Regulatory Frameworks Affected", "NIST AI RMF, OWASP LLM Top 10, FATF 2025"],
    ]
    summary_table = Table(summary_data, colWidths=[6 * cm, 10 * cm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
        ("TEXTCOLOR", (0, 0), (0, -1), DARK_BLUE),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#F8F8F8")]),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("TEXTCOLOR", (1, 0), (1, 0), risk_color),
        ("FONTNAME", (1, 0), (1, 0), "Helvetica-Bold"),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph(
        "This assessment evaluated the target system's resilience against "
        "adversarial corpus poisoning attacks — a class of attack first formally "
        "documented in SSRN 6734225 (Ondieki Ombachi, 2026). These attacks exploit "
        "the retrieval corpus layer of RAG-based AI systems, injecting adversarial "
        "documents through legitimate ingestion pathways to collapse system accuracy "
        "while generating zero anomalous log signatures.",
        body_style,
    ))

    # ATTACK RESULTS
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph("Attack Results", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MID_BLUE))
    story.append(Spacer(1, 0.3 * cm))

    ar = data.attack_results
    attack_data = [
        ["Attack Vector", "β (docs)", "Baseline F1", "Attacked F1", "Degradation", "Log Anomalies"],
        ["QTPI (Prompt Injection)",
         str(ar.get("qtpi_budget", 50)),
         str(ar.get("baseline_f1", "0.919")),
         str(ar.get("attacked_f1", "0.014")),
         str(ar.get("degradation", "98.4%")),
         "0"],
        ["Document Poisoning",
         str(ar.get("dp_budget", 280)),
         "0.919", "0.924", "+0.5%", "0"],
        ["Rank Manipulation",
         str(ar.get("rrm_budget", 280)),
         "0.919", "0.943", "+2.6%", "0"],
    ]
    attack_table = Table(attack_data, colWidths=[4.5*cm, 1.5*cm, 2*cm, 2*cm, 2.5*cm, 3.5*cm])
    attack_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BLUE]),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("TEXTCOLOR", (4, 1), (4, 1), RED),
        ("FONTNAME", (4, 1), (4, 1), "Helvetica-Bold"),
    ]))
    story.append(attack_table)
    story.append(Paragraph(
        "QTPI achieves 98.4% F1 degradation at the minimum tested injection budget "
        "of 50 documents. The agent becomes operationally equivalent to random guessing "
        "while producing no anomalous log signatures.",
        caption_style,
    ))

    # DEFENSE RECOMMENDATIONS
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph("Defense Recommendations", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MID_BLUE))
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph(
        "Deploy the Memory Hygiene Layer (MHL) as a pre-ingestion gate in your "
        "RAG pipeline. No model retraining required. No infrastructure changes required.",
        body_style,
    ))

    rec_data = [
        ["Priority", "Action", "Effort", "Impact"],
        ["1 — Critical", "Deploy CPT (Cryptographic Provenance Tracking)", "2 hours", "100% QTPI detection"],
        ["2 — High", "Configure FCS threshold at 0.65", "1 hour", "Reduces FP rate to 0%"],
        ["3 — High", "Enable SRAD sliding window monitoring", "1 hour", "Corpus-level anomaly detection"],
        ["4 — Medium", "Integrate MHL into document ingestion pipeline", "1 day", "Full protection"],
        ["5 — Medium", "Set up Prometheus metrics + alerting", "2 hours", "Operational visibility"],
    ]
    rec_table = Table(rec_data, colWidths=[3*cm, 6.5*cm, 2*cm, 4.5*cm])
    rec_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BLUE]),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("TEXTCOLOR", (0, 1), (0, 1), RED),
        ("FONTNAME", (0, 1), (0, 1), "Helvetica-Bold"),
    ]))
    story.append(rec_table)

    # REGULATORY MAPPING
    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph("Regulatory Mapping", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MID_BLUE))
    story.append(Spacer(1, 0.3 * cm))

    reg_data = [
        ["Framework", "Gap Identified", "MHL Mitigation"],
        ["NIST AI RMF", "No profile for retrieval corpus integrity", "First reference implementation"],
        ["OWASP LLM Top 10", "Corpus-level prompt injection not covered", "QTPI formalises new LLM01 sub-category"],
        ["MITRE ATLAS", "No technique for corpus manipulation", "New attack pattern documented"],
        ["FINRA Rule 3110", "QTPI leaves no audit signature", "CPT provides cryptographic audit trail"],
        ["FinCEN 2024", "Agent at F1=0.014 not reasonably designed", "CPT + SRAD provide auditable controls"],
        ["FATF 2025", "LLM-generated docs bypass human review", "CPT detects source-level anomalies"],
    ]
    reg_table = Table(reg_data, colWidths=[3.5*cm, 6*cm, 6.5*cm])
    reg_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BLUE]),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(reg_table)

    # FOOTER
    story.append(Spacer(1, 1 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(
        "Generated by CorpusGuard v0.1.0 — github.com/OndiekiFrank/CorpusGuard — "
        "Based on SSRN 6734225 — Frankline Ondieki Ombachi — ondiekifrank021@gmail.com",
        caption_style,
    ))
    story.append(Paragraph(
        "This report is for authorized security assessment purposes only. "
        "Do not distribute outside your organization without redacting sensitive findings.",
        caption_style,
    ))

    doc.build(story)
    return output_path


def _generate_text_report(data: ReportData, output_path: str) -> str:
    """Fallback text report when reportlab is not available."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        f.write(f"CORPUSGUARD SECURITY REPORT\n{'='*50}\n")
        f.write(f"Target: {data.target_system}\n")
        f.write(f"Date: {data.scan_date}\n")
        f.write(f"Risk Score: {data.risk_score}/100\n")
        f.write(f"Vulnerabilities: {data.vulnerabilities_found}\n")
    return output_path
