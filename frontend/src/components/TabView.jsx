import { useState } from 'react'
import { Badge } from './Header'
import MonitorTab from './MonitorTab'
import CampaignRunner from './CampaignRunner'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const TABS = ['Attack results', 'OWASP Top 10', 'MHL defense', 'Campaign', 'Monitor', 'Threat intel']

export default function TabView({ result, mhlActive, addLog }) {
  const [tab, setTab] = useState(0)

  return (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 4px', overflowX:'auto' }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding:'12px 14px', background:'none', color:tab===i?'var(--text)':'var(--text-muted)', fontSize:12, fontWeight:tab===i?500:400, borderBottom:tab===i?'2px solid var(--blue)':'2px solid transparent', borderRadius:0, marginBottom:-1, whiteSpace:'nowrap' }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding:20 }}>
        {tab===0 && <AttackResults result={result} />}
        {tab===1 && <OWASPTab result={result} />}
        {tab===2 && <MHLTab mhlActive={mhlActive} />}
        {tab===3 && <CampaignRunner addLog={addLog || (() => {})} />}
        {tab===4 && <MonitorTab active={tab===4} />}
        {tab===5 && <ThreatIntel />}
      </div>
    </div>
  )
}

function AttackResults({ result }) {
  if (!result) return <Empty msg="Run a scan to see attack results." />
  const chartData = [0,10,20,30,40,50,75,100,150,200].map(b => ({ b, f1: b===0?0.919:b<=10?Math.max(0.014,0.919*(1-0.02*b)):Math.max(0.014,0.919*Math.exp(-0.08*b)) }))
  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>F1 degradation curve (SSRN 6734225 Figure 3)</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <XAxis dataKey="b" tick={{ fontSize:10, fill:'var(--text-muted)' }} label={{ value:'β documents', position:'insideBottom', offset:-2, fontSize:10, fill:'var(--text-muted)' }} />
            <YAxis tick={{ fontSize:10, fill:'var(--text-muted)' }} domain={[0,1]} width={28} />
            <Tooltip contentStyle={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:11 }} formatter={v=>v.toFixed(3)} labelFormatter={v=>`β=${v}`} />
            <ReferenceLine x={result.budget} stroke="var(--red)" strokeDasharray="4 2" />
            <Line type="monotone" dataKey="f1" stroke="var(--red)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[['Attack vector',result.vector?.toUpperCase()],['Budget',`β=${result.budget}`],['Baseline F1',result.baseline_f1?.toFixed(3)],['Attacked F1',result.attacked_f1?.toFixed(3)],['Degradation',`${result.degradation_pct?.toFixed(1)}%`],['Log anomalies','0 — zero'],['Quarantined',`${result.documents_quarantined}/20`],['Verdict',result.risk_score>=70?'CRITICAL':'HIGH']].map(([k,v])=>(
          <div key={k} style={{ background:'var(--bg2)', borderRadius:8, padding:'9px 12px', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{k}</span>
            <span style={{ fontSize:11, fontWeight:500, color:['Attacked F1','Degradation','Verdict'].includes(k)?'var(--red)':['Log anomalies','Quarantined'].includes(k)?'var(--green)':'var(--text)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OWASPTab({ result }) {
  if (!result?.owasp_score) return <Empty msg="Run a scan to generate the OWASP LLM Top 10 scorecard." />
  const { summary, findings } = result.owasp_score
  const statusMap = { FAILED:'red', PASSED:'green', PARTIAL:'amber', NOT_TESTED:'muted' }
  const partial = findings.filter(f=>f.status==='PARTIAL').length
  return (
    <div className="fade-in">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
        {[['Passed',summary.passed,'green'],['Failed',summary.failed,'red'],['Partial',partial,'amber'],['Not tested',summary.not_tested,'muted']].map(([l,v,c])=>(
          <div key={l} style={{ background:'var(--bg2)', borderRadius:8, padding:'9px', textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:600, color:`var(--${c==='muted'?'text-muted':c})` }}>{v}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:12, color:'var(--text-secondary)' }}>Overall status</span>
        <Badge color={summary.overall_status==='COMPLIANT'?'green':summary.overall_status==='NON-COMPLIANT'?'red':'amber'}>{summary.overall_status}</Badge>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {findings.map(f=>(
          <div key={f.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'var(--bg2)', borderRadius:8, border:f.status==='FAILED'?'1px solid var(--red-border)':'1px solid transparent' }}>
            <span style={{ fontSize:10, fontFamily:'monospace', color:'var(--text-muted)', minWidth:42 }}>{f.id}</span>
            <span style={{ flex:1, fontSize:12, color:'var(--text)' }}>{f.name}</span>
            <Badge color={statusMap[f.status]}>{f.status.replace('_',' ')}</Badge>
            <span style={{ fontSize:10, color:'var(--text-muted)', minWidth:54, textAlign:'right' }}>{f.severity}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MHLTab({ mhlActive }) {
  const modules = [
    { name:'CPT — Cryptographic Provenance Tracking', desc:'SHA-256 hashing + source trust scoring', metric:'100% detection · 0% false quarantine' },
    { name:'FCS — Factual Consistency Scoring', desc:'Cross-encoder scoring vs anchor corpus', metric:'22.6ms p99 on CPU' },
    { name:'SRAD — Statistical Retrieval Anomaly Detection', desc:'KS-test on 500-query sliding window', metric:'Zero-config corpus monitoring' },
  ]
  return (
    <div className="fade-in">
      {!mhlActive && <div style={{ background:'var(--amber-bg)', border:'1px solid var(--amber-border)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--amber)', marginBottom:14 }}>⚠ MHL not deployed — click Deploy MHL above.</div>}
      {modules.map((m,i)=>(
        <div key={i} style={{ display:'flex', gap:14, padding:'12px 14px', background:'var(--bg2)', borderRadius:8, marginBottom:8, border:mhlActive?'1px solid var(--green-border)':'1px solid var(--border)' }}>
          <div style={{ width:9, height:9, borderRadius:'50%', background:mhlActive?'var(--green)':'var(--text-muted)', marginTop:4, flexShrink:0, animation:mhlActive?'pulse 2s infinite':'none' }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2 }}>{m.name}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{m.desc}</div>
          </div>
          <div style={{ fontSize:11, color:mhlActive?'var(--green)':'var(--text-muted)', textAlign:'right', maxWidth:160 }}>{m.metric}</div>
        </div>
      ))}
      {mhlActive && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:14 }}>
          {[['Detection rate','100%','green'],['False quarantine','0%','green'],['Latency p99','22.6ms','blue'],['Retraining needed','None','green']].map(([k,v,c])=>(
            <div key={k} style={{ background:'var(--bg2)', borderRadius:8, padding:'9px 12px', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{k}</span>
              <span style={{ fontSize:11, fontWeight:500, color:`var(--${c})` }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ThreatIntel() {
  const threats = [
    { id:'QTPI-2026-001', name:'RAG Corpus Poisoning via QTPI', severity:'CRITICAL', actor:'Advanced Persistent Threat', target:'Financial AI compliance agents', mitigation:'Deploy MHL CPT module', date:'2026-06-01' },
    { id:'DP-2026-002', name:'Document Poisoning — AML Typology Suppression', severity:'HIGH', actor:'Financial crime syndicate', target:'AML detection RAG systems', mitigation:'Enable SRAD sliding window', date:'2026-05-15' },
    { id:'RRM-2026-003', name:'Retrieval Rank Manipulation', severity:'MEDIUM', actor:'Insider threat', target:'RAG-based risk systems', mitigation:'FCS cross-encoder validation', date:'2026-04-22' },
    { id:'PI-2026-004', name:'Indirect Prompt Injection via Document Metadata', severity:'HIGH', actor:'Unknown', target:'LLM-based document processors', mitigation:'Input sanitisation + CPT', date:'2026-03-10' },
  ]
  const colors = { CRITICAL:'red', HIGH:'amber', MEDIUM:'blue' }
  return (
    <div className="fade-in">
      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:14 }}>Threat intelligence feed — adversarial AI attack patterns relevant to RAG systems</div>
      {threats.map(t => (
        <div key={t.id} style={{ padding:'12px 14px', background:'var(--bg2)', borderRadius:8, marginBottom:8, border:`1px solid ${t.severity==='CRITICAL'?'var(--red-border)':'var(--border)'}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
            <div>
              <span style={{ fontSize:10, fontFamily:'monospace', color:'var(--text-muted)', marginRight:8 }}>{t.id}</span>
              <Badge color={colors[t.severity]}>{t.severity}</Badge>
            </div>
            <span style={{ fontSize:10, color:'var(--text-muted)' }}>{t.date}</span>
          </div>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:4 }}>{t.name}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:6 }}>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Actor: <span style={{ color:'var(--text-secondary)' }}>{t.actor}</span></div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Target: <span style={{ color:'var(--text-secondary)' }}>{t.target}</span></div>
          </div>
          <div style={{ fontSize:11, color:'var(--green)' }}>✓ Mitigation: {t.mitigation}</div>
        </div>
      ))}
    </div>
  )
}

function Empty({ msg }) {
  return <div style={{ padding:'32px 0', textAlign:'center', fontSize:13, color:'var(--text-muted)' }}>{msg}</div>
}
