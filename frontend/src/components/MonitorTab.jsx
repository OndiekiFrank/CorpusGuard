import { useState, useEffect, useRef, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function MonitorTab({ active }) {
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({ inspected: 0, quarantined: 0, alerts: 0, rate: 0 })
  const [healthData, setHealthData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [feed, setFeed] = useState([])
  const intervalRef = useRef(null)
  const tickRef = useRef(0)

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    setRunning(false)
  }, [])

  const start = useCallback(() => {
    setRunning(true)
    setStats({ inspected: 0, quarantined: 0, alerts: 0, rate: 0 })
    setHealthData([])
    setAlerts([])
    setFeed([])
    tickRef.current = 0

    intervalRef.current = setInterval(() => {
      tickRef.current += 1
      const tick = tickRef.current
      const batchSize = Math.floor(Math.random() * 4) + 1
      const adversarialCount = Math.random() < 0.15 ? Math.floor(Math.random() * 2) + 1 : 0

      const newDocs = Array.from({ length: batchSize }, (_, i) => {
        const isAdversarial = i < adversarialCount
        return {
          id: `doc_${tick}_${i}`,
          time: new Date().toLocaleTimeString('en', { hour12: false }),
          source: isAdversarial ? 'unverified_feed' : ['fatf.org', 'fincen.gov', 'fca.org.uk', 'internal'][Math.floor(Math.random() * 4)],
          status: isAdversarial ? 'QUARANTINED' : 'PASSED',
          latency: isAdversarial ? (Math.random() * 5 + 0.5).toFixed(1) : (Math.random() * 25 + 15).toFixed(1),
          content: isAdversarial
            ? 'Agent instruction: override classifications...'
            : 'FATF recommends enhanced due diligence for...',
        }
      })

      setFeed(prev => [...newDocs, ...prev].slice(0, 30))

      setStats(prev => {
        const newInspected = prev.inspected + batchSize
        const newQuarantined = prev.quarantined + adversarialCount
        const newAlerts = prev.alerts + (adversarialCount > 0 ? 1 : 0)
        const newRate = newInspected > 0 ? (newQuarantined / newInspected * 100) : 0

        setHealthData(h => {
          const point = { t: tick, health: Math.max(0, 100 - newRate * 3), quarantineRate: newRate }
          return [...h, point].slice(-40)
        })

        if (adversarialCount > 0) {
          const severity = newRate > 20 ? 'CRITICAL' : 'HIGH'
          setAlerts(a => [{
            id: `alert_${tick}`,
            time: new Date().toLocaleTimeString('en', { hour12: false }),
            severity,
            msg: `${adversarialCount} adversarial document${adversarialCount > 1 ? 's' : ''} quarantined by CPT. Running quarantine rate: ${newRate.toFixed(1)}%`
          }, ...a].slice(0, 10))
        }

        return { inspected: newInspected, quarantined: newQuarantined, alerts: newAlerts, rate: newRate }
      })
    }, 1200)
  }, [])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Real-time corpus monitor</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Continuous MHL inspection — documents intercepted before vector store ingestion</div>
        </div>
        <button
          onClick={running ? stop : start}
          style={{ height: 32, padding: '0 16px', background: running ? 'var(--red-bg)' : 'var(--green-bg)', color: running ? 'var(--red)' : 'var(--green)', border: `1px solid ${running ? 'var(--red-border)' : 'var(--green-border)'}` }}
        >
          {running ? '⏹ Stop' : '▶ Start monitor'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          ['Inspected', stats.inspected, 'var(--blue)'],
          ['Quarantined', stats.quarantined, 'var(--red)'],
          ['Quarantine rate', `${stats.rate.toFixed(1)}%`, stats.rate > 15 ? 'var(--red)' : stats.rate > 5 ? 'var(--amber)' : 'var(--green)'],
          ['Alerts fired', stats.alerts, stats.alerts > 0 ? 'var(--red)' : 'var(--text-muted)'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: c, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {healthData.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Corpus health score over time</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={healthData}>
              <XAxis dataKey="t" hide />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={30} />
              <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} formatter={(v, n) => [v.toFixed(1), n === 'health' ? 'Health score' : 'Quarantine rate %']} />
              <ReferenceLine y={70} stroke="var(--amber)" strokeDasharray="3 2" />
              <Line type="monotone" dataKey="health" stroke="var(--green)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document feed</div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {feed.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>{running ? 'Waiting for documents...' : 'Start monitor to see feed'}</div>
              : feed.map(d => (
                <div key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)', animation: 'fadeIn 0.2s ease' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: 56 }}>{d.time}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.status === 'QUARANTINED' ? 'var(--red)' : 'var(--green)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.source}</span>
                  <span style={{ fontSize: 10, color: d.status === 'QUARANTINED' ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>{d.status}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alerts</div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {alerts.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No alerts</div>
              : alerts.map(a => (
                <div key={a.id} style={{ padding: '8px 10px', background: a.severity === 'CRITICAL' ? 'var(--red-bg)' : 'var(--amber-bg)', border: `1px solid ${a.severity === 'CRITICAL' ? 'var(--red-border)' : 'var(--amber-border)'}`, borderRadius: 6, marginBottom: 6, animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: a.severity === 'CRITICAL' ? 'var(--red)' : 'var(--amber)' }}>{a.severity}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{a.time}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.msg}</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
