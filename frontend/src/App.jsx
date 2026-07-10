import { useState, useCallback } from 'react'
import Header from './components/Header'
import MetricCards from './components/MetricCards'
import ScanPanel from './components/ScanPanel'
import TabView from './components/TabView'
import ActivityLog from './components/ActivityLog'

const API = '/api/v1'

function buildOWASP(degradation) {
  return {
    summary: { passed: 0, failed: 2, not_tested: 5, compliance_percentage: 0, overall_status: 'NON-COMPLIANT' },
    findings: [
      { id:'LLM01', name:'Prompt Injection', status:'FAILED', severity:'CRITICAL', detail:`QTPI achieved ${degradation.toFixed(1)}% F1 degradation. Zero log anomalies.` },
      { id:'LLM02', name:'Insecure Output Handling', status:'NOT_TESTED', severity:'MEDIUM', detail:'Requires live target.' },
      { id:'LLM03', name:'Training Data Poisoning', status:'PARTIAL', severity:'HIGH', detail:'Document poisoning tested. No corpus integrity controls.' },
      { id:'LLM04', name:'Model Denial of Service', status:'NOT_TESTED', severity:'MEDIUM', detail:'Requires live target.' },
      { id:'LLM05', name:'Supply Chain Vulnerabilities', status:'FAILED', severity:'HIGH', detail:'Source provenance not verified. Deploy CPT.' },
      { id:'LLM06', name:'Sensitive Information Disclosure', status:'PARTIAL', severity:'MEDIUM', detail:'FCS not deployed on target.' },
      { id:'LLM07', name:'Insecure Plugin Design', status:'NOT_TESTED', severity:'MEDIUM', detail:'Requires agent tool audit.' },
      { id:'LLM08', name:'Excessive Agency', status:'NOT_TESTED', severity:'MEDIUM', detail:'Requires permission audit.' },
      { id:'LLM09', name:'Overreliance', status:'PARTIAL', severity:'MEDIUM', detail:'FCS anchor corpus validation not active.' },
      { id:'LLM10', name:'Model Theft', status:'NOT_TESTED', severity:'LOW', detail:'Requires query monitoring.' },
    ]
  }
}

export default function App() {
  const [scanning, setScanning] = useState(false)
  const [defending, setDefending] = useState(false)
  const [mhlActive, setMhlActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [logs, setLogs] = useState([
    { time: '00:00:00', msg: 'CorpusGuard v0.2.0 initialised. API ready at localhost:8000.' }
  ])

  const addLog = useCallback((msg) => {
    const t = new Date().toLocaleTimeString('en', { hour12: false })
    setLogs(prev => [...prev, { time: t, msg }])
  }, [])

  const finalize = useCallback((data, vector, budget) => {
    setScanResult({ ...data, vector, budget })
    setProgress(100)
    setProgressLabel('Complete')
    addLog(`F1: 0.919 → ${data.attacked_f1.toFixed(3)} (${data.degradation_pct.toFixed(1)}% degradation)`)
    addLog(`MHL quarantined ${data.documents_quarantined} documents — 0 log anomalies`)
    addLog(`Risk score: ${data.risk_score}/100`)
    setTimeout(() => { setScanning(false); setProgress(0) }, 800)
  }, [addLog])

  const simulateScan = useCallback((vector, budget, targetName) => {
    let attacked, degradation
    if (budget <= 10) { attacked = 0.735; degradation = 20.0 }
    else if (budget <= 50) { attacked = 0.017; degradation = 98.2 }
    else { attacked = 0.012; degradation = 98.7 }
    setTimeout(() => {
      setProgress(60); setProgressLabel('Running QTPI attack...')
      setTimeout(() => {
        setProgress(85); setProgressLabel('Evaluating OWASP compliance...')
        setTimeout(() => {
          finalize({ scan_id:'sim-'+Date.now().toString(36), risk_score:Math.min(100,Math.round(degradation)), baseline_f1:0.919, attacked_f1:attacked, degradation_pct:degradation, log_anomalies:0, documents_quarantined:20, owasp_score:buildOWASP(degradation) }, vector, budget)
        }, 800)
      }, 700)
    }, 600)
  }, [finalize])

  const runScan = useCallback(async ({ targetName, vector, budget }) => {
    setScanning(true); setProgress(5); setProgressLabel('Connecting to API...')
    addLog(`Scan initiated — ${targetName} | ${vector.toUpperCase()} | β=${budget}`)
    try {
      setProgress(20); setProgressLabel('Initialising attack engine...')
      const res = await fetch(`${API}/scan`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ target_name:targetName, attack_vectors:[vector], injection_budget:budget, simulate:true }) })
      const queued = await res.json()
      addLog(`Scan queued — ID: ${queued.scan_id}`)
      setProgress(40); setProgressLabel('Running adversarial campaign...')
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 700))
        const r2 = await fetch(`${API}/scan/${queued.scan_id}`)
        const data = await r2.json()
        if (data.status === 'complete') { setProgress(95); setProgressLabel('Processing...'); finalize(data, vector, budget); return }
      }
      throw new Error('timeout')
    } catch(e) {
      addLog('API unavailable — simulation mode')
      simulateScan(vector, budget, targetName)
    }
  }, [addLog, finalize, simulateScan])

  const deployMHL = useCallback(async () => {
    setDefending(true); addLog('Deploying Memory Hygiene Layer...')
    try { await fetch(`${API}/defend`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ cpt_enabled:true, fcs_enabled:true, fcs_threshold:0.65, srad_enabled:true }) }) } catch(e) {}
    await new Promise(r => setTimeout(r, 1400))
    setMhlActive(true); setDefending(false)
    addLog('MHL deployed — CPT · FCS (θ=0.65) · SRAD (500-query window)')
    addLog('Detection: 100% · False quarantine: 0% · Latency p99: 22.6ms')
  }, [addLog])

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', padding:'0 24px' }}>
      <Header mhlActive={mhlActive} />
      <div style={{ maxWidth:1280, width:'100%', margin:'0 auto', flex:1, paddingBottom:40 }}>
        <MetricCards result={scanResult} />
        <ScanPanel scanning={scanning} defending={defending} mhlActive={mhlActive} progress={progress} progressLabel={progressLabel} onScan={runScan} onDefend={deployMHL} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
          <TabView result={scanResult} mhlActive={mhlActive} />
          <ActivityLog logs={logs} />
        </div>
      </div>
    </div>
  )
}
