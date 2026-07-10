import { useEffect, useRef } from 'react'

export default function ActivityLog({ logs }) {
  const ref = useRef()
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])

  return (
    <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Activity log</span>
        <span style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>Live</span>
      </div>
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: '8px 0', maxHeight: 440 }}>
        {logs.map((log, i) => (
          <div key={i} style={{ padding: '6px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', animation: i === logs.length - 1 ? 'fadeIn 0.2s ease' : 'none' }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: 70, paddingTop: 1, flexShrink: 0 }}>{log.time}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
