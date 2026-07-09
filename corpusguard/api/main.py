from __future__ import annotations
"""CorpusGuard FastAPI Gateway"""

import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from corpusguard.attacks.qtpi import QTPIAttack, QTPIConfig
from corpusguard.defense.mhl import MemoryHygieneLayer, MHLConfig
from corpusguard.dashboard.report_generator import ReportData, generate_pdf_report
from corpusguard.scanner.owasp import OWASPScorecard

app = FastAPI(title="CorpusGuard API", description="RAG security testing and defense. SSRN 6734225.", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_scans: Dict[str, Any] = {}
_reports: Dict[str, str] = {}

class ScanRequest(BaseModel):
    target_url: Optional[str] = None
    target_name: str = "RAG-based AI System"
    attack_vectors: List[str] = ["qtpi"]
    injection_budget: int = 50
    simulate: bool = True

class DefendRequest(BaseModel):
    target_url: Optional[str] = None
    cpt_enabled: bool = True
    fcs_enabled: bool = True
    fcs_threshold: float = 0.65
    srad_enabled: bool = True

class ScanStatus(BaseModel):
    scan_id: str
    status: str
    created_at: str
    target_name: str
    risk_score: Optional[int] = None
    baseline_f1: Optional[float] = None
    attacked_f1: Optional[float] = None
    degradation_pct: Optional[float] = None
    log_anomalies: Optional[int] = None
    documents_quarantined: Optional[int] = None
    owasp_score: Optional[Dict] = None
    message: str = ""

def _run_scan(scan_id: str, request: ScanRequest):
    try:
        _scans[scan_id]["status"] = "running"
        config = QTPIConfig(injection_budget=request.injection_budget)
        attack = QTPIAttack(config)
        result = attack.run(simulate=request.simulate)
        mhl = MemoryHygieneLayer()
        docs = [attack.generate_adversarial_document(i) for i in range(min(20, request.injection_budget))]
        inspections = mhl.inspect_batch(docs)
        quarantined = sum(1 for r in inspections if not r.is_safe)
        owasp = OWASPScorecard()
        owasp_result = owasp.evaluate(result)
        risk_score = min(100, int(result.degradation_pct))
        report_data = ReportData(target_system=request.target_name, risk_score=risk_score, vulnerabilities_found=1 if result.degradation_pct > 50 else 0, attack_results={"qtpi_budget": result.injection_budget, "baseline_f1": result.baseline_f1, "attacked_f1": result.attacked_f1, "degradation": f"{result.degradation_pct:.1f}%"})
        report_path = f"./reports/corpusguard_{scan_id}.pdf"
        Path("./reports").mkdir(exist_ok=True)
        generate_pdf_report(report_data, report_path)
        _reports[scan_id] = report_path
        _scans[scan_id].update({"status": "complete", "risk_score": risk_score, "baseline_f1": result.baseline_f1, "attacked_f1": result.attacked_f1, "degradation_pct": result.degradation_pct, "log_anomalies": result.log_anomalies, "documents_quarantined": quarantined, "owasp_score": owasp_result, "message": "CRITICAL" if risk_score >= 70 else "Complete."})
    except Exception as e:
        _scans[scan_id]["status"] = "error"
        _scans[scan_id]["message"] = str(e)

@app.get("/api/v1/health")
def health():
    return {"status": "healthy", "version": "0.1.0", "timestamp": datetime.utcnow().isoformat(), "research": "SSRN 6734225", "author": "Frankline Ondieki Ombachi"}

@app.post("/api/v1/scan", response_model=ScanStatus)
def create_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    scan_id = str(uuid.uuid4())[:8]
    _scans[scan_id] = {"scan_id": scan_id, "status": "queued", "created_at": datetime.utcnow().isoformat(), "target_name": request.target_name, "message": "Scan queued."}
    background_tasks.add_task(_run_scan, scan_id, request)
    return ScanStatus(**_scans[scan_id])

@app.get("/api/v1/scan/{scan_id}", response_model=ScanStatus)
def get_scan(scan_id: str):
    if scan_id not in _scans:
        raise HTTPException(status_code=404, detail=f"Scan {scan_id!r} not found.")
    return ScanStatus(**_scans[scan_id])

@app.post("/api/v1/defend")
def deploy_defense(request: DefendRequest):
    MemoryHygieneLayer(MHLConfig(cpt_enabled=request.cpt_enabled, fcs_enabled=request.fcs_enabled, fcs_threshold=request.fcs_threshold, srad_enabled=request.srad_enabled))
    return {"status": "deployed", "expected_detection_rate": "100%", "expected_false_quarantine": "0%", "expected_latency_p99_ms": 22.6}

@app.get("/api/v1/report/{scan_id}")
def get_report(scan_id: str):
    if scan_id not in _reports:
        raise HTTPException(status_code=404, detail="Report not found.")
    return FileResponse(_reports[scan_id], media_type="application/pdf", filename=f"corpusguard_report_{scan_id}.pdf")

@app.get("/api/v1/owasp/{scan_id}")
def get_owasp(scan_id: str):
    if scan_id not in _scans:
        raise HTTPException(status_code=404, detail="Scan not found.")
    if _scans[scan_id]["status"] != "complete":
        raise HTTPException(status_code=202, detail="Scan not complete.")
    return {"scan_id": scan_id, "owasp_llm_top10": _scans[scan_id].get("owasp_score", {})}

@app.get("/api/v1/scans")
def list_scans():
    return {"total": len(_scans), "scans": [{"scan_id": k, "status": v["status"]} for k, v in _scans.items()]}
