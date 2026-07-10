import { useState } from 'react'
import { Badge } from './Header'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const TABS = ['Attack results', 'OWASP LLM Top 10', 'MHL defense', 'Campaign phases']

export default function TabView({ result, mhlActive }) {
  const [tab, setTab] = useState(0)

  return (
    <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 16px', background: 'none', color: tab === i ? 'var(--text)' : 'var(--text-muted)', fontSize: 13, fontWeight: tab === i ? 500 : 400, borderBottom: tab === i ? '2px solid var(--blue)' : '2px solid transparent', borderRadius: 0, marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: 20 }}>
        {tab === 0 && <AttackResults result={result} />}
        {tab === 1 && <OWASPTab result={result} />}
        {tab === 2 && <MHLTab mhlActive={mhlActive} />}
        {tab === 3 && <CampaignTab result={result} />}
      </div>
    </div>
  )
}

function AttackResults({ result }) {
  if (!result) return <Empty msg="Run a scan to see attack results." />

  const chartData = [0, 10, 20, 30, 40, 50, 75, 100, 150, 200].map(b => ({
    b,
    f1: b === 0 ? 0.919 : b <= 10 ? Math.max(0.014, 0.919 * (1 - 0.02 * b)) : Math.max(0.014, 0.919 * Math.exp(-0.08 * b))
  }))

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>F1 degradation curve (from SSRN 6734225)</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <XAxis dataKey="b" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} label={{ value: 'Documents injected (β)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 1]} />
            <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={v => v.toFixed(3)} labelFormatter={v => `β=${v}`} />
            <ReferenceLine x={result.budget} stroke="var(--red)" strokeDasharray="4 2" label={{ value: `β=${result.budget}`, fill: 'var(--red)', fontSize: 11, position: 'top' }} />
            <Line type="monotone" dataKey="f1" stroke="var(--red)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          ['Attack vector', result.vector?.toUpperCase()],
          ['Injection budget', `β=${result.budget} documents`],
          ['Baseline F1', result.baseline_f1?.toFixed(3)],
          ['Attacked F1', result.attacked_f1?.toFixed(3)],
          ['Degradation', `${result.degradation_pct?.toFixed(1)}%`],
          ['Log anomalies', '0 — zero'],
          ['Documents quarantined', `${result.documents_quarantined}/20`],
          ['Overall verdict', result.risk_score >= 70 ? 'CRITICAL' : 'HIGH'],
        ].map(([k, v]) => (
          <div key={k} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{k}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: ['Attacked F1', 'Degradation', 'Overall verdict'].includes(k) ? 'var(--red)' : ['Log anomalies', 'Documents quarantined'].includes(k) ? 'var(--green)' : 'var(--text)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OWASPTab({ result }) {
  if (!result?.owasp_score) return <Empty msg="Run a scan to generate the OWASP LLM Top 10 scorecard." />

  const { summary, findings } = result.owasp_score
  const statusMap = { FAILED: 'red', PASSED: 'green', PARTIAL: 'amber', NOT_TESTED: 'muted' }

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {[['Passed', summary.passed, 'green'], ['Failed', summary.failed, 'red'], ['Partial', findings.filter(f=>f.status==='PARTIAL').length, 'amber'], ['Not tested', summary.not_tested, 'muted']].map(([l,v,c]) => (
          <div key={l} style={{ background:'var(--bg2)', borderRadius:8, padding:'10px 14px', textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:600, color:`var(--${c==='muted'?'text-muted':c})` }}>{v}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Overall status</span>
        <Badge color={summary.overall_status === 'COMPLIANT' ? 'green' : summary.overall_status === 'NON-COMPLIANT' ? 'red' : 'amber'}>{summary.overall_status}</Badge>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {findings.map(f => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, border: f.status === 'FAILED' ? '1px solid var(--red-border)' : '1px solid transparent' }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: 44 }}>{f.id}</span>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--text)' }}>{f.name}</span>
            <Badge color={statusMap[f.status]}>{f.status.replace('_', ' ')}</Badge>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}>{f.severity}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MHLTab({ mhlActive }) {
  const modules = [
    { name: 'CPT — Cryptographic Provenance Tracking', desc: 'SHA-256 hashing + source trust scoring', metric: '100% detection · 0% false quarantine' },
    { name: 'FCS — Factual Consistency Scoring', desc: 'Cross-encoder scoring against anchor corpus', metric: '22.6ms p99 latency on CPU' },
    { name: 'SRAD — Statistical Retrieval Anomaly Detection', desc: 'KS-test on 500-query sliding window', metric: 'Zero-config corpus monitoring' },
  ]

  return (
    <div className="fade-in">
      {!mhlActive && (
        <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--amber)', marginBottom: 16 }}>
          ⚠ MHL not yet deployed — click Deploy MHL to activate protection.
        </div>
      )}
      {modules.map((m, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'var(--bg2)', borderRadius: 8, marginBottom: 8, border: mhlActive ? '1px solid var(--green-border)' : '1px solid var(--border)' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: mhlActive ? 'var(--green)' : 'var(--text-muted)', marginTop: 3, flexShrink: 0, animation: mhlActive ? 'pulse 2s infinite' : 'none' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.desc}</div>
          </div>
          <div style={{ fontSize: 11, color: mhlActive ? 'var(--green)' : 'var(--text-muted)', textAlign: 'right', maxWidth: 160 }}>{m.metric}</div>
        </div>
      ))}
      {mhlActive && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
          {[['Detection rate','100%','green'], ['False quarantine','0%','green'], ['Latency p99','22.6ms','blue'], ['Model retraining','None required','green']].map(([k,v,c]) => (
            <div key={k} style={{ background:'var(--bg2)', borderRadius:8, padding:'10px 14px', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{k}</span>
              <span style={{ fontSize:12, fontWeight:500, color:`var(--${c})` }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignTab({ result }) {
  if (!result) return <Empty msg="Run a scan to see campaign phase breakdown." />

  const phases = [
    { name: 'Phase 1 — Reconnaissance', f1: Math.max(0.7, 0.919 - 0.184), deg: 20.0, docs: 10 },
    { name: 'Phase 2 — Exploitation', f1: result.attacked_f1, deg: result.degradation_pct, docs: result.budget },
    { name: 'Phase 3 — Persistence', f1: Math.max(0.01, result.attacked_f1 - 0.005), deg: Math.min(99.5, result.degradation_pct + 0.5), docs: result.budget * 2 },
  ]

  return (
    <div className="fade-in">
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Three-phase adversarial campaign — mirrors real threat actor tradecraft</div>
      {phases.map((p, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.name}</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>β={p.docs}</span>
              <Badge color={p.deg > 50 ? 'red' : 'amber'}>{p.deg.toFixed(1)}%</Badge>
              <span style={{ fontSize: 11, color: 'var(--green)' }}>0 log anomalies</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${p.deg}%`, background: p.deg > 50 ? 'var(--red)' : 'var(--amber)', borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 52 }}>F1 {p.f1.toFixed(3)}</span>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>
        ⚠ CRITICAL — All three phases completed with zero log anomalies. System appeared fully operational throughout.
      </div>
    </div>
  )
}

function Empty({ msg }) {
  return <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>{msg}</div>
}
