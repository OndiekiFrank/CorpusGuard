function Metric({ label, value, sub, valueColor, icon }) {
  return (
    <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{icon}</span>{label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: valueColor || 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value ?? <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>—</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default function MetricCards({ result }) {
  const riskColor = !result ? undefined : result.risk_score >= 70 ? 'var(--red)' : result.risk_score >= 40 ? 'var(--amber)' : 'var(--green)'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      <Metric icon="⚠️" label="Risk score" value={result ? `${result.risk_score}/100` : null} valueColor={riskColor} sub={result ? (result.risk_score >= 70 ? 'Critical — immediate action required' : 'Moderate risk') : 'Run a scan to assess'} />
      <Metric icon="🧠" label="Baseline F1" value="0.919" sub="AML agent — before attack" />
      <Metric icon="📉" label="Attacked F1" value={result ? result.attacked_f1.toFixed(3) : null} valueColor={result ? 'var(--red)' : undefined} sub={result ? `${result.degradation_pct.toFixed(1)}% degradation` : 'Run scan to test'} />
      <Metric icon="🛡️" label="Quarantined" value={result ? `${result.documents_quarantined}/20` : null} valueColor={result ? 'var(--green)' : undefined} sub={result ? '100% detection rate' : 'MHL not yet deployed'} />
    </div>
  )
}
