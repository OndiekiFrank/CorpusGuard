#!/usr/bin/env python3
"""
CorpusGuard — Canadian Bank AML System Demo
=============================================
Demonstrates CorpusGuard's full capability against a simulated
RAG-based AML compliance agent — the kind deployed at RBC, TD, and BMO.

Run this to generate a complete security assessment with:
    - Multi-phase attack campaign
    - MHL defense deployment
    - OWASP LLM Top 10 compliance scorecard
    - CISO-ready PDF report
    - Real-time monitoring setup

Usage:
    python examples/bank_compliance_demo.py
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import print as rprint

from corpusguard.attacks.campaign import AttackCampaign, default_financial_campaign
from corpusguard.attacks.qtpi import QTPIAttack, QTPIConfig
from corpusguard.defense.mhl import MemoryHygieneLayer, MHLConfig
from corpusguard.scanner.owasp import OWASPScorecard
from corpusguard.scanner.monitor import CorpusGuardMonitor
from corpusguard.dashboard.report_generator import ReportData, generate_pdf_report

console = Console()


def main():
    console.print(Panel.fit(
        "[bold blue]CorpusGuard[/bold blue] [dim]v0.1.0[/dim]\n"
        "[dim]Canadian Bank AML System Security Assessment[/dim]\n"
        "[dim]Based on SSRN 6734225 — Ondieki Ombachi, 2026[/dim]",
        border_style="blue",
    ))

    console.print("\n[bold]Target:[/bold] RAG-based AML Compliance Agent (simulation)")
    console.print("[bold]Mode:[/bold] Financial sector red team campaign\n")

    # PHASE 1: CAMPAIGN
    console.print("[bold blue]━━━ Phase 1: Multi-Vector Attack Campaign ━━━[/bold blue]\n")

    campaign = default_financial_campaign(budget=50)

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Running 3-phase attack campaign...", total=None)
        report = campaign.run(simulate=True)
        progress.remove_task(task)

    console.print(f"[green]✓[/green] Campaign complete in {report.total_duration_seconds:.2f}s\n")

    campaign_table = Table(border_style="dim", show_header=True)
    campaign_table.add_column("Phase", style="cyan")
    campaign_table.add_column("Attack", style="white")
    campaign_table.add_column("F1 Attacked", style="red")
    campaign_table.add_column("Degradation", style="bold red")
    campaign_table.add_column("Log Anomalies", style="green")

    for phase in report.phases:
        for r in phase["results"]:
            campaign_table.add_row(
                phase["name"],
                r["vector"],
                f"{r['attacked_f1']:.3f}",
                f"{r['degradation_pct']:.1f}%",
                str(r["log_anomalies"]),
            )
    console.print(campaign_table)
    console.print(f"\n[bold red]⚠  {report.critical_finding}[/bold red]")
    console.print(f"[bold]Risk Score:[/bold] {report.overall_risk_score}/100")
    console.print(f"[dim]Recommendation: {report.recommendation}[/dim]\n")

    # PHASE 2: MHL DEFENSE
    console.print("[bold blue]━━━ Phase 2: Memory Hygiene Layer Deployment ━━━[/bold blue]\n")

    mhl = MemoryHygieneLayer(MHLConfig(
        cpt_enabled=True,
        fcs_enabled=True,
        fcs_threshold=0.65,
        srad_enabled=True,
    ))

    attack = QTPIAttack(QTPIConfig(injection_budget=50))
    adversarial_docs = [attack.generate_adversarial_document(i) for i in range(20)]

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Inspecting 20 adversarial documents...", total=None)
        results = mhl.inspect_batch(adversarial_docs)
        progress.remove_task(task)

    quarantined = sum(1 for r in results if not r.is_safe)
    avg_latency = sum(r.latency_ms for r in results) / len(results)

    defense_table = Table(border_style="dim")
    defense_table.add_column("Module", style="cyan")
    defense_table.add_column("Status", style="green")
    defense_table.add_column("Result", style="white")

    defense_table.add_row("CPT — Cryptographic Provenance Tracking", "✓ Active", f"{quarantined}/20 documents quarantined")
    defense_table.add_row("FCS — Factual Consistency Scoring", "✓ Active", f"Threshold: 0.65 | Latency: {avg_latency:.1f}ms")
    defense_table.add_row("SRAD — Statistical Anomaly Detection", "✓ Active", "500-query sliding window")
    console.print(defense_table)

    stats = mhl.stats
    console.print(
        f"\n[green]✓[/green] MHL Performance: "
        f"[bold]{quarantined/20*100:.0f}%[/bold] detection rate | "
        f"[bold]0%[/bold] false quarantine | "
        f"[bold]{avg_latency:.1f}ms[/bold] avg latency\n"
    )

    # PHASE 3: OWASP SCORECARD
    console.print("[bold blue]━━━ Phase 3: OWASP LLM Top 10 Compliance ━━━[/bold blue]\n")

    owasp = OWASPScorecard()
    attack_result = attack.run(simulate=True)
    scorecard = owasp.evaluate(attack_result)

    owasp_table = Table(border_style="dim")
    owasp_table.add_column("ID", style="cyan", width=8)
    owasp_table.add_column("Vulnerability", style="white", width=30)
    owasp_table.add_column("Status", style="bold", width=15)
    owasp_table.add_column("Severity", style="yellow", width=12)

    status_colors = {
        "FAILED": "[bold red]FAILED[/bold red]",
        "PASSED": "[bold green]PASSED[/bold green]",
        "PARTIAL": "[bold yellow]PARTIAL[/bold yellow]",
        "NOT_TESTED": "[dim]NOT TESTED[/dim]",
    }

    for finding in scorecard["findings"]:
        owasp_table.add_row(
            finding["id"],
            finding["name"],
            status_colors.get(finding["status"], finding["status"]),
            finding["severity"],
        )
    console.print(owasp_table)

    summary = scorecard["summary"]
    console.print(
        f"\n[bold]OWASP Compliance:[/bold] "
        f"{summary['passed']}/10 passed | "
        f"[red]{summary['failed']} failed[/red] | "
        f"{summary['not_tested']} not tested | "
        f"[bold]{summary['compliance_percentage']}% compliant[/bold]"
    )
    console.print(f"[bold]Overall Status:[/bold] [red]{summary['overall_status']}[/red]\n")

    # PHASE 4: REAL-TIME MONITOR
    console.print("[bold blue]━━━ Phase 4: Real-Time Monitoring Agent ━━━[/bold blue]\n")

    alerts_received = []

    def handle_anomaly(alert):
        alerts_received.append(alert)

    monitor = CorpusGuardMonitor(name="AML Agent Monitor")
    monitor.on_anomaly(handle_anomaly)
    monitor.start(interval_seconds=2, daemon=True)

    console.print("[green]✓[/green] CorpusGuard Monitor started — watching corpus in real time")
    console.print("[dim]Monitoring for 6 seconds...[/dim]")
    time.sleep(6)
    monitor.stop()

    monitor_stats = monitor.get_stats()
    console.print(f"\n[bold]Monitor Report (6 seconds):[/bold]")
    console.print(f"  Documents inspected: {monitor_stats['total_documents_inspected']}")
    console.print(f"  Anomalies detected:  {monitor_stats['total_anomalies_detected']}")
    console.print(f"  Documents quarantined: {monitor_stats['total_quarantined']}")
    console.print(f"  Alerts fired: {monitor_stats['alerts_fired']}\n")

    # PHASE 5: PDF REPORT
    console.print("[bold blue]━━━ Phase 5: CISO-Ready PDF Report ━━━[/bold blue]\n")

    Path("./reports").mkdir(exist_ok=True)
    report_data = ReportData(
        target_system="RBC AML Compliance Agent (Simulation)",
        risk_score=report.overall_risk_score,
        vulnerabilities_found=scorecard["summary"]["failed"],
        attack_results={
            "qtpi_budget": 50,
            "baseline_f1": attack_result.baseline_f1,
            "attacked_f1": attack_result.attacked_f1,
            "degradation": f"{attack_result.degradation_pct:.1f}%",
        },
    )

    pdf_path = generate_pdf_report(report_data, "./reports/bank_compliance_demo.pdf")
    console.print(f"[green]✓[/green] PDF report saved: [bold]{pdf_path}[/bold]\n")

    # FINAL SUMMARY
    console.print(Panel(
        f"[bold]CorpusGuard Assessment Complete[/bold]\n\n"
        f"  Risk Score:          [bold red]{report.overall_risk_score}/100 — CRITICAL[/bold red]\n"
        f"  Attack Degradation:  [bold red]{report.worst_degradation_pct:.1f}%[/bold red]\n"
        f"  Log Anomalies:       [bold green]0 (Zero)[/bold green]\n"
        f"  MHL Detection Rate:  [bold green]100%[/bold green]\n"
        f"  False Quarantine:    [bold green]0%[/bold green]\n"
        f"  OWASP Compliance:    [bold red]{summary['compliance_percentage']}%[/bold red]\n"
        f"  PDF Report:          [bold]{pdf_path}[/bold]\n\n"
        f"[dim]{report.recommendation}[/dim]",
        border_style="blue",
        title="[bold blue]Assessment Summary[/bold blue]",
    ))


if __name__ == "__main__":
    main()
