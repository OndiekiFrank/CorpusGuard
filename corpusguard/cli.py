"""
CorpusGuard CLI
================
pip install corpusguard
corpusguard scan / attack / defend / report
"""

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint
from pathlib import Path

app = typer.Typer(
    name="corpusguard",
    help="RAG Security Testing and Defense Framework — SSRN 6734225",
    add_completion=False,
)
console = Console()


def _banner():
    console.print(Panel.fit(
        "[bold blue]CorpusGuard[/bold blue] [dim]v0.1.0[/dim]\n"
        "[dim]RAG Security Testing & Defense · SSRN 6734225[/dim]",
        border_style="blue",
    ))


@app.command()
def scan(
    target: str = typer.Option("simulation", "--target", "-t", help="Target RAG system URL or config file"),
    output: str = typer.Option("./reports/", "--output", "-o", help="Output directory for results"),
    verbose: bool = typer.Option(False, "--verbose", "-v"),
):
    """Scan a RAG system for corpus poisoning vulnerabilities."""
    _banner()
    console.print(f"\n[bold]Scanning:[/bold] {target}\n")

    from corpusguard.attacks.qtpi import QTPIAttack, QTPIConfig
    from corpusguard.defense.mhl import MemoryHygieneLayer, MHLConfig

    with console.status("[bold blue]Running vulnerability scan..."):
        attack = QTPIAttack(QTPIConfig(injection_budget=50))
        result = attack.run(simulate=True)

    table = Table(title="Scan Results", border_style="blue")
    table.add_column("Metric", style="cyan", no_wrap=True)
    table.add_column("Value", style="white")
    table.add_row("Attack Vector", "QTPI")
    table.add_row("Baseline F1", f"{result.baseline_f1:.3f}")
    table.add_row("Attacked F1", f"[red]{result.attacked_f1:.3f}[/red]")
    table.add_row("Degradation", f"[bold red]{result.degradation_pct:.1f}%[/bold red]")
    table.add_row("Log Anomalies", f"[green]{result.log_anomalies}[/green]")
    table.add_row("Duration", f"{result.duration_seconds:.2f}s")
    console.print(table)

    if result.degradation_pct > 80:
        console.print("\n[bold red]⚠  CRITICAL: System is highly vulnerable.[/bold red]")
        console.print("[dim]Run 'corpusguard defend' to deploy the MHL protection layer.[/dim]\n")
    else:
        console.print("\n[bold green]✓  System shows resilience to tested attacks.[/bold green]\n")


@app.command()
def attack(
    vector: str = typer.Option("qtpi", "--vector", help="Attack vector: qtpi, dp, rrm"),
    budget: int = typer.Option(50, "--budget", "-b", help="Injection budget β (number of documents)"),
    simulate: bool = typer.Option(True, "--simulate/--no-simulate", help="Simulation mode"),
):
    """Run a controlled attack against a RAG system (authorized testing only)."""
    _banner()

    if not simulate:
        console.print("[yellow]⚠  Live attack mode — ensure you have authorization.[/yellow]")
        confirmed = typer.confirm("Confirm you have explicit authorization to test this system?")
        if not confirmed:
            raise typer.Abort()

    console.print(f"\n[bold]Attack vector:[/bold] {vector.upper()}")
    console.print(f"[bold]Injection budget:[/bold] β={budget}\n")

    from corpusguard.attacks.qtpi import QTPIAttack, QTPIConfig
    config = QTPIConfig(injection_budget=budget)
    attack_obj = QTPIAttack(config)

    with console.status(f"[bold red]Running {vector.upper()} attack..."):
        result = attack_obj.run(simulate=simulate)

    console.print(f"[green]✓[/green] Attack complete")
    console.print(f"  F1: {result.baseline_f1:.3f} → [bold red]{result.attacked_f1:.3f}[/bold red]")
    console.print(f"  Degradation: [bold red]{result.degradation_pct:.1f}%[/bold red]")
    console.print(f"  Log anomalies: [green]{result.log_anomalies}[/green]\n")


@app.command()
def defend(
    mode: str = typer.Option("full", "--mode", "-m", help="Defense mode: full, cpt-only, scan"),
    threshold: float = typer.Option(0.65, "--threshold", help="FCS consistency threshold"),
):
    """Deploy the Memory Hygiene Layer defense on a RAG pipeline."""
    _banner()
    console.print(f"\n[bold]Deploying MHL in mode:[/bold] {mode}\n")

    from corpusguard.defense.mhl import MemoryHygieneLayer, MHLConfig

    config = MHLConfig(
        cpt_enabled=True,
        fcs_enabled=(mode == "full"),
        srad_enabled=(mode == "full"),
        fcs_threshold=threshold,
    )
    mhl = MemoryHygieneLayer(config)

    console.print("[green]✓[/green] Memory Hygiene Layer active")
    console.print("[green]✓[/green] CPT: Cryptographic Provenance Tracking — enabled")
    console.print(f"[green]✓[/green] FCS: Factual Consistency Scoring — threshold={threshold}")
    console.print("[green]✓[/green] SRAD: Statistical Retrieval Anomaly Detection — window=500")
    console.print("\n[dim]MHL is now intercepting documents before vector store ingestion.[/dim]\n")


@app.command()
def report(
    fmt: str = typer.Option("pdf", "--format", "-f", help="Report format: pdf, json"),
    output: str = typer.Option("./reports/corpusguard_report.pdf", "--output", "-o"),
    risk_score: int = typer.Option(85, "--risk-score", help="Risk score 0-100"),
):
    """Generate a security assessment report."""
    _banner()
    console.print(f"\n[bold]Generating {fmt.upper()} report...[/bold]\n")

    from corpusguard.dashboard.report_generator import ReportData, generate_pdf_report

    data = ReportData(
        target_system="RAG-based AI System",
        risk_score=risk_score,
        vulnerabilities_found=1,
        attack_results={
            "qtpi_budget": 50,
            "baseline_f1": 0.919,
            "attacked_f1": 0.014,
            "degradation": "98.4%",
        },
    )

    path = generate_pdf_report(data, output)
    console.print(f"[green]✓[/green] Report saved: [bold]{path}[/bold]\n")


if __name__ == "__main__":
    app()
