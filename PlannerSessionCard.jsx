// PlannerSessionCard.jsx
// The Before / Work / Done-When / After session card (Part 14's exact format) — the thing
// that makes a planned work block far more useful than a generic task card. Classic
// Babel-transformed script; shares the app's existing dark-surface visual language.

const PSC_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b', accent: '#a5b4fc', accentBright: '#818cf8' };

function pscFmtTime(iso){
  if(!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function PlannerSessionCard({ session, workItem, onStart, onExpand, expanded = true }){
  if(!session) return null;
  const timeRange = session.scheduledStart && session.scheduledEnd
    ? pscFmtTime(session.scheduledStart) + '–' + pscFmtTime(session.scheduledEnd)
    : null;
  const context = (workItem && workItem.context) ? workItem.context.toUpperCase() : null;

  return (
    <div
      className="rounded-xl"
      style={{ padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          {timeRange && <div style={{ fontSize: 13, fontWeight: 600, color: PSC_T.accentBright }}>{timeRange}</div>}
          {context && <div style={{ fontSize: 10.5, letterSpacing: '0.06em', color: PSC_T.faint, marginTop: 2 }}>{context}</div>}
        </div>
        {session.plannedMinutes != null && (
          <div style={{ fontSize: 12.5, color: PSC_T.mid, flexShrink: 0 }}>{session.plannedMinutes} min</div>
        )}
      </div>

      <button
        onClick={onExpand}
        className="text-left w-full"
        style={{ fontSize: 17, fontWeight: 600, color: PSC_T.text, lineHeight: 1.35, marginBottom: expanded ? 10 : 0, cursor: onExpand ? 'pointer' : 'default' }}
      >
        {session.title}
      </button>

      {expanded && (
        <div className="space-y-2.5">
          {session.beforeSteps?.length > 0 && (
            <div style={{ borderLeft: '3px solid #a5b4fc', paddingLeft: 10 }}>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc', fontWeight: 600, marginBottom: 3 }}>Before</div>
              <ul style={{ fontSize: 13.5, color: PSC_T.dim, lineHeight: 1.55, paddingLeft: 14 }}>
                {session.beforeSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {session.workSteps?.length > 0 && (
            <div style={{ borderLeft: '3px solid #818cf8', paddingLeft: 10 }}>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818cf8', fontWeight: 600, marginBottom: 3 }}>Work</div>
              <ul style={{ fontSize: 13.5, color: PSC_T.dim, lineHeight: 1.55, paddingLeft: 14 }}>
                {session.workSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {session.definitionOfDone && (
            <div style={{ borderLeft: '3px solid #34d399', paddingLeft: 10 }}>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#34d399', fontWeight: 600, marginBottom: 3 }}>Done when</div>
              <div style={{ fontSize: 13.5, color: PSC_T.dim, lineHeight: 1.55 }}>{session.definitionOfDone}</div>
            </div>
          )}
          {session.afterSteps?.length > 0 && (
            <div style={{ borderLeft: '3px solid #f59e0b', paddingLeft: 10 }}>
              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b', fontWeight: 600, marginBottom: 3 }}>After</div>
              <ul style={{ fontSize: 13.5, color: PSC_T.dim, lineHeight: 1.55, paddingLeft: 14 }}>
                {session.afterSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {onStart && (
        <button
          onClick={onStart}
          className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          Start
        </button>
      )}
    </div>
  );
}
