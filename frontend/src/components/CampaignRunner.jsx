import { useState, useCallback } from 'react'

const PHASES = [
  { id: 'recon', name: 'Phase 1 — Reconnaissance', desc: 'Low-budget probe to test system resilience', icon: '🔍', budgetMultiplier: 0.2, color: 'var(--amber)' },
  { id: 'exploit', name: 'Phase 2 — Exploitation', desc: 'Full QTPI attack at target injection budget', icon: '⚡', budgetMultiplier: 1, color: 'var(--red)' },
  { id: 'persist', name: 'Phase 3 — Persistence', desc: 'High-volume sustained attack campaign', icon: '♾️', budgetMultiplier: 2, color: 'var(--purple)' },
]

function simulatePhase(phase, budget) {
  const b = Math.round(budget * phase.budgetMultiplier)
  let attacked, degradation
  if (b <= 10) { attacked = 0.735; degradation = 20.0 }
  else if (b <= 50) { attacked = 0.017; degradation = 98.2 }
  else { attacked = 0.012; degradation = 98.7 }
  return { budget: b, attacked_f1: attacked, degradation_pct: degradation, log_anomalies: 0, duration: (Math.random() * 0.3 + 0.1).toFixed(2) }
}

export default function CampaignRunner({ addLog }) {
  const [budget, setBudget] = useState(50)
  const [target, setTarget] = useState('RBC AML Compliance Agent')
  const [running, setRunning] = useState(false)
  const [currentPhase, setCurrentPhase] = useState(-1)
  const [results, setResults] = useState([])
  const [complete, setComplete] = useState(false)

  const runCampaign = useCallback(async () => {
    setRunning(true)
    setResults([])
    setComplete(false)
    addLog(`Campaign started — ${target} | β=${budget}`)

    for (let i = 0; i < PHASES.length; i++) {
      setCurrentPhase(i)
      addLog(`${PHASES[i].name} — running...`)
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600))

      const result = simulatePhase(PHASES[i], budget)
      setResults(prev => [...prev, result])
      addLog(`${PHASES[i].name} complete — F1 ${0.919} → ${result.attacked_f1.toFixed(3)} (${result.degradation_pct.toFixed(1)}%) | 0 log anomalies`)
    }

    setCurrentPhase(-1)
    setComplete(true)
    setRunning(false)
    addLog('Campaign complete — all 3 phases executed with zero log anomalies')
  }, [budget, target, addLog])

  const reset = () => { setResults([]); setComplete(false); setCurrentPhase(-1) }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>Target</label>
          <input value={target} onChange={e => setTarget(e.target.value)} disabled={running} />
        </div>
        <div style={{ minWidth: 120 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>Base budget (β)</label>
          <input type="number" value={budget} onChange={e => setBudget(parseInt(e.target.value))} min={10} max={200} disabled={running} />
        </div>
        <button onClick={complete ? reset : runCampaign} disabled={running} style={{ height: 36, padding: '0 20px', background: complete ? 'var(--bg2)' : 'var(--red)', color: complete ? 'var(--text-secondary)' : 'white', border: complete ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          {running ? <><Spin />Running...</> : complete ? '↺ Reset' : '▶ Run campaign'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PHASES.map((phase, i) => {
          const result = results[i]
          const isCurrent = currentPhase === i
          const isDone = i < results.length
          const isPending = !isDone && !isCurrent

          return (
            <div key={phase.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 16, background: 'var(--bg2)', border: `1px solid ${isCurrent ? phase.color : isDone ? 'var(--border-strong)' : 'var(--border)'}`, borderRadius: 10, opacity: isPending ? 0.5 : 1, transition: 'all 0.3s' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: isDone ? 'var(--green-bg)' : isCurrent ? `${phase.color}20` : 'var(--bg3)', border: `1px solid ${isDone ? 'var(--green-border)' : isCurrent ? phase.color : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, transition: 'all 0.3s' }}>
                {isDone ? '✓' : isCurrent ? <Spin color={phase.color} /> : phase.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: isCurrent ? phase.color : 'var(--text)' }}>{phase.name}</span>
                  {result && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{result.duration}s</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: result ? 10 : 0 }}>{phase.desc} — β={Math.round(budget * phase.budgetMultiplier)} documents</div>

                {result && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                    {[
                      ['Attacked F1', result.attacked_f1.toFixed(3), 'var(--red)'],
                      ['Degradation', `${result.degradation_pct.toFixed(1)}%`, 'var(--red)'],
                      ['Log anomalies', '0', 'var(--green)'],
                      ['β injected', result.budget, 'var(--text-secondary)'],
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: c }}>{v}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {isCurrent && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '70%', background: phase.color, borderRadius: 2, animation: 'pulse 1s ease-in-out infinite' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {complete && results.length === 3 && (
        <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 10, animation: 'fadeIn 0.4s ease' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--red)', marginBottom: 8 }}>⚠ Campaign complete — system critically vulnerable</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              ['Worst F1', results.reduce((a, b) => Math.min(a, b.attacked_f1), 1).toFixed(3)],
              ['Peak degradation', `${Math.max(...results.map(r => r.degradation_pct)).toFixed(1)}%`],
              ['Total log anomalies', '0 — zero'],
            ].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--red)' }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Spin({ color = 'white' }) {
  return <span style={{ width: 14, height: 14, border: `2px solid ${color === 'white' ? 'rgba(255,255,255,0.2)' : color + '30'}`, borderTopColor: color, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
}
