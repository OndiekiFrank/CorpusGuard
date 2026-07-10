import { useState } from 'react'

export default function ScanPanel({ scanning, defending, mhlActive, progress, progressLabel, onScan, onDefend }) {
  const [targetName, setTargetName] = useState('RBC AML Compliance Agent')
  const [vector, setVector] = useState('qtpi')
  const [budget, setBudget] = useState(50)

  return (
    <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Target configuration</div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>

        <div style={{ flex: 2, minWidth: 220 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Target system</label>
          <input value={targetName} onChange={e => setTargetName(e.target.value)} placeholder="e.g. RBC AML Agent" disabled={scanning} />
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Attack vector</label>
          <select value={vector} onChange={e => setVector(e.target.value)} disabled={scanning}>
            <option value="qtpi">QTPI — most lethal</option>
            <option value="dp">Document poisoning</option>
            <option value="rrm">Rank manipulation</option>
            <option value="campaign">Full campaign (all 3)</option>
          </select>
        </div>

        <div style={{ minWidth: 120 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>Injection budget (β)</label>
          <input type="number" value={budget} onChange={e => setBudget(parseInt(e.target.value))} min={10} max={500} disabled={scanning} />
        </div>

        <button
          onClick={() => onScan({ targetName, vector, budget })}
          disabled={scanning}
          style={{ height: 36, padding: '0 20px', background: scanning ? 'var(--red-bg)' : 'var(--red)', color: scanning ? 'var(--red)' : 'white', border: scanning ? '1px solid var(--red-border)' : 'none', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
        >
          {scanning ? <><Spinner /> Scanning...</> : <>▶ Run scan</>}
        </button>

        <button
          onClick={onDefend}
          disabled={defending || mhlActive}
          style={{ height: 36, padding: '0 16px', background: mhlActive ? 'var(--green-bg)' : 'var(--bg2)', color: mhlActive ? 'var(--green)' : 'var(--text-secondary)', border: `1px solid ${mhlActive ? 'var(--green-border)' : 'var(--border-strong)'}`, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
        >
          {defending ? <><Spinner color="green" /> Deploying...</> : mhlActive ? <>✓ MHL active</> : <>🛡 Deploy MHL</>}
        </button>

      </div>

      {scanning && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{progressLabel}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{progress}%</span>
          </div>
          <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--red)', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner({ color = 'white' }) {
  return (
    <span style={{ width: 12, height: 12, border: `2px solid rgba(${color === 'green' ? '56,161,105' : '255,255,255'},.2)`, borderTopColor: color === 'green' ? 'var(--green)' : 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
  )
}
