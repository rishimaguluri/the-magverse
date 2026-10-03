// PlannerTimeline.jsx
// The path/journey visualization — today's plan as a vertical waypoint path (NOW gets full
// Before/Work/Done/After treatment; NEXT/LATER/SOMEDAY/WAITING stay light, per Part 15: the
// system proposes buckets, it does not force the user to sort everything). Shows the realistic-
// workload check (Part 19) and a "why this order" explanation (Part 18/25) built from
// recommendPriority()'s transparent reasons, never an opaque score.

const PT_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b', accent: '#a5b4fc' };

function pscFmtMinutes(min){
  if(min == null) return '';
  const h = Math.floor(min / 60), m = min % 60;
  if(h <= 0) return m + 'm';
  return h + 'h' + (m ? ' ' + m + 'm' : '');
}

function PlannerTimeline({ plannerState, events, onExpandSession, onStartSession, onPreviewCalendarAdd, today }){
  const workItems = plannerState.workItems || [];
  const workSessions = plannerState.workSessions || [];
  const groups = groupByPriority(workItems);
  const [showWhy, setShowWhy] = useState(false);

  const nowSessions = workSessions
    .filter(ws => ws.status === 'planned' && groups.now.some(wi => wi.id === ws.workItemId))
    .sort((a, b) => (a.scheduledStart || '').localeCompare(b.scheduledStart || ''));

  const windows = computeAvailableWindows(events || [], today, new Date().getHours() + new Date().getMinutes() / 60, 23);
  const availableMinutes = windowsTotalMinutes(windows);
  const plannedMinutes = computeWorkload(nowSessions);
  const { overcommitted, deltaMinutes } = detectOvercommitment(availableMinutes, plannedMinutes);

  const itemById = id => workItems.find(wi => wi.id === id);

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl p-3.5"
        style={{ background: overcommitted ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (overcommitted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)') }}
      >
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span style={{ fontSize: 13, color: PT_T.mid }}>You have <strong style={{ color: PT_T.text }}>{pscFmtMinutes(availableMinutes)}</strong> available</span>
          <span style={{ fontSize: 13, color: overcommitted ? '#f87171' : PT_T.mid }}>You planned <strong style={{ color: overcommitted ? '#f87171' : PT_T.text }}>{pscFmtMinutes(plannedMinutes)}</strong></span>
        </div>
        {overcommitted && (
          <div style={{ fontSize: 12.5, color: '#f87171', marginTop: 6 }}>
            That's {pscFmtMinutes(deltaMinutes)} more than you have. Something needs to move.
          </div>
        )}
      </div>

      {groups.now.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: PT_T.faint, fontWeight: 600 }}>Now</div>
            <button onClick={() => setShowWhy(w => !w)} style={{ fontSize: 11.5, color: PT_T.accent }}>{showWhy ? 'Hide why' : 'Why this order?'}</button>
          </div>
          <div className="space-y-3">
            {groups.now.map((item, i) => {
              const sessions = nowSessions.filter(ws => ws.workItemId === item.id);
              const reason = recommendPriority(item, today, workItems).reason;
              return (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center" style={{ width: 18 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 99, background: item.status === 'done' ? '#10b981' : '#6366f1', flexShrink: 0, marginTop: 4 }} />
                    {i < groups.now.length - 1 && <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.1)', marginTop: 4 }} />}
                  </div>
                  <div className="flex-1 pb-1 min-w-0 space-y-2">
                    {showWhy && <div style={{ fontSize: 12, color: PT_T.faint }}>{reason}</div>}
                    {sessions.length > 0 ? sessions.map(ws => (
                      <PlannerSessionCard key={ws.id} session={ws} workItem={item} onExpand={() => onExpandSession && onExpandSession(ws.id)} onStart={() => onStartSession && onStartSession(ws.id)} />
                    )) : (
                      <div style={{ fontSize: 14, color: PT_T.text }}>{item.title}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {['next', 'later', 'waiting', 'someday'].map(bucket => (
        groups[bucket].length > 0 && (
          <div key={bucket}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: PT_T.faint, fontWeight: 600, marginBottom: 6 }}>{bucket}</div>
            <div className="space-y-1">
              {groups[bucket].map(item => (
                <div key={item.id} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 13.5, color: PT_T.dim }}>{item.title}</span>
                  {item.deadline && <span style={{ fontSize: 11, color: PT_T.faint }}>{item.deadline}</span>}
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {onPreviewCalendarAdd && nowSessions.some(ws => ws.scheduledStart) && (
        <button onClick={onPreviewCalendarAdd} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: PT_T.mid }}>
          Preview calendar additions
        </button>
      )}
    </div>
  );
}
