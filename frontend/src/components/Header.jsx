export default function Header({ mhlActive }) {
  return (
    <header style={{ borderBottom: '1px solid var(--border)', padding: '16px 0', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛡️</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>CorpusGuard</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>RAG Security Platform · SSRN 6734225</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Badge color="muted">v0.2.0</Badge>
        {mhlActive
          ? <Badge color="green">MHL active</Badge>
          : <Badge color="blue">API ready</Badge>
        }
        <a href="https://github.com/OndiekiFrank/CorpusGuard" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>GitHub</span>
          <span style={{ fontSize: 10 }}>↗</span>
        </a>
      </div>
    </header>
  )
}

export function Badge({ children, color = 'muted' }) {
  const colors = {
    muted: { bg: 'var(--bg3)', color: 'var(--text-secondary)', border: 'var(--border)' },
    red: { bg: 'var(--red-bg)', color: 'var(--red)', border: 'var(--red-border)' },
    green: { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)' },
    amber: { bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--amber-border)' },
    blue: { bg: 'var(--blue-bg)', color: 'var(--blue)', border: 'var(--blue-border)' },
    purple: { bg: 'var(--purple-bg)', color: 'var(--purple)', border: '1px solid rgba(128,90,213,0.25)' },
  }
  const c = colors[color] || colors.muted
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}
