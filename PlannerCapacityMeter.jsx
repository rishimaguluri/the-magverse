// PlannerCapacityMeter.jsx
// The realistic-workload check as a visual bar, not just text — and it updates LIVE as cards
// drag in/out of Now (the caller re-runs computeWorkload/detectOvercommitment on every
// drag-over, not just on drop), which is the "tactile tradeoff" interaction the spec calls out
// as potentially the coolest thing in the app. No fake productivity score — just the two real
// numbers and a bar.

const PCM_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b' };

function pcmFmtMinutes(min){
  if(min == null) return '';
  const h = Math.floor(Math.abs(min) / 60), m = Math.abs(min) % 60;
  const sign = min < 0 ? '-' : '';
  if(h <= 0) return sign + m + 'm';
  return sign + h + 'h' + (m ? ' ' + m + 'm' : '');
}

function PlannerCapacityMeter({ availableMinutes, plannedMinutes }){
  const { overcommitted, deltaMinutes } = detectOvercommitment(availableMinutes, plannedMinutes);
  const pct = availableMinutes > 0 ? Math.min(100, Math.round((plannedMinutes / availableMinutes) * 100)) : (plannedMinutes > 0 ? 100 : 0);

  return (
    <div className="rounded-xl p-3" style={{ background: overcommitted ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (overcommitted ? 'rgba(239,68,68,0.28)' : 'rgba(255,255,255,0.08)'), transition: 'background 0.3s, border-color 0.3s' }}>
      <div className="flex items-center justify-between flex-wrap gap-1 mb-2">
        <span style={{ fontSize: 12.5, color: PCM_T.mid }}>Available <strong style={{ color: PCM_T.text }}>{pcmFmtMinutes(availableMinutes)}</strong></span>
        <span style={{ fontSize: 12.5, color: overcommitted ? '#f87171' : PCM_T.mid }}>Planned <strong style={{ color: overcommitted ? '#f87171' : PCM_T.text }}>{pcmFmtMinutes(plannedMinutes)}</strong></span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', borderRadius: 99, background: overcommitted ? '#ef4444' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.25s ease, background 0.25s ease' }} />
      </div>
      <div style={{ fontSize: 12, marginTop: 6, color: overcommitted ? '#f87171' : '#34d399', fontWeight: 500 }}>
        {overcommitted ? 'Over by ' + pcmFmtMinutes(deltaMinutes) : (plannedMinutes > 0 ? 'Plan fits' : 'Nothing planned yet')}
      </div>
    </div>
  );
}
