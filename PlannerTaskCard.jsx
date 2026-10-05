// PlannerTaskCard.jsx
// A compact, draggable, directly-manipulable task card. Click to expand inline (no modal) —
// shows outcome/done-when/before/work/after/dependencies, editable. A "⋯" quick-action menu is
// the mandatory non-drag alternative to every drag action (Move to Now/Next/Later/Waiting,
// Move up/down, Break down, Make shorter, Change deadline, Mark done, Delete, Ask Navigator) —
// present on every card, every platform, so dragging is an enhancement, never a requirement.

const PTC_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b' };

function deadlineLabel(deadline, today){
  if(!deadline) return null;
  const days = daysBetweenStr(today, deadline);
  if(days < 0) return { text: 'Overdue', color: '#f87171' };
  if(days === 0) return { text: 'Today', color: '#f59e0b' };
  if(days === 1) return { text: 'Tomorrow', color: '#f59e0b' };
  if(days <= 6) return { text: new Date(deadline + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' }), color: PTC_T.mid };
  return { text: days + ' days', color: PTC_T.faint };
}

function PlannerTaskCard({
  workItem, sessions, today, variant = 'compact', justChanged,
  draggable, onDragStart, onDragEnd,
  onMoveTo, onMoveUpDown, onBreakDown, onMakeShorter, onChangeDeadline, onMarkDone, onDelete, onAskNavigator,
  onStart, onPatch,
}){
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dl = deadlineLabel(workItem.deadline, today);
  const session = (sessions || [])[0];

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="rounded-lg select-none"
      style={{
        padding: variant === 'now' ? 14 : 10,
        background: justChanged ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.035)',
        border: '1px solid ' + (justChanged ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'),
        cursor: draggable ? 'grab' : 'default',
        transition: 'background 0.5s ease, border-color 0.5s ease',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => setExpanded(e => !e)} className="text-left flex-1 min-w-0">
          <div style={{ fontSize: variant === 'now' ? 15.5 : 13.5, fontWeight: 600, color: PTC_T.text, lineHeight: 1.3 }}>{workItem.title}</div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {workItem.estimatedMinutes != null && <span style={{ fontSize: 11, color: PTC_T.faint }}>~{workItem.estimatedMinutes}m</span>}
            {dl && <span style={{ fontSize: 11, color: dl.color, fontWeight: dl.color === '#f87171' ? 700 : 400 }}>{dl.text}</span>}
          </div>
        </button>
        <div className="relative flex-shrink-0">
          <button onClick={() => setMenuOpen(m => !m)} aria-label="Task actions" style={{ color: PTC_T.faint, fontSize: 16, padding: '0 4px' }}>⋯</button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-20 rounded-lg py-1" style={{ background: 'rgba(15,15,22,0.98)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
              onMouseLeave={() => setMenuOpen(false)}>
              {[
                ['Move to Now', () => onMoveTo && onMoveTo('now')],
                ['Move to Next', () => onMoveTo && onMoveTo('next')],
                ['Move to Later', () => onMoveTo && onMoveTo('later')],
                ['Move to Waiting', () => onMoveTo && onMoveTo('waiting')],
                ['Move up', () => onMoveUpDown && onMoveUpDown('up')],
                ['Move down', () => onMoveUpDown && onMoveUpDown('down')],
                ['Break down', () => onBreakDown && onBreakDown()],
                ['Make shorter', () => onMakeShorter && onMakeShorter()],
                ['Change deadline…', () => onChangeDeadline && onChangeDeadline()],
                ['Mark done', () => onMarkDone && onMarkDone()],
                ['Ask Navigator', () => onAskNavigator && onAskNavigator()],
                ['Delete', () => onDelete && onDelete()],
              ].map(([label, fn]) => (
                <button key={label} onClick={() => { fn(); setMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5" style={{ color: label === 'Delete' ? '#f87171' : PTC_T.dim }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {variant === 'now' && session && !expanded && (
        <div className="mt-3 space-y-2">
          {session.beforeSteps?.length > 0 && (
            <div style={{ fontSize: 12, color: PTC_T.faint }}>Before: {session.beforeSteps.join(', ')}</div>
          )}
          {session.definitionOfDone && (
            <div style={{ fontSize: 12.5, color: PTC_T.dim }}>Done when: {session.definitionOfDone}</div>
          )}
          {onStart && (
            <button onClick={onStart} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              Start
            </button>
          )}
        </div>
      )}

      {expanded && (
        <div className="mt-3 space-y-2.5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <label className="block">
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: PTC_T.faint, marginBottom: 2 }}>Outcome</div>
            <textarea defaultValue={workItem.outcome} rows={2} onBlur={e => onPatch && onPatch({ outcome: e.target.value })}
              className="w-full rounded-lg p-2 text-sm" style={{ background: 'rgba(255,255,255,0.04)', color: PTC_T.text, border: '1px solid rgba(255,255,255,0.08)', resize: 'none' }} />
          </label>
          {session && (
            <>
              {session.beforeSteps?.length > 0 && (
                <div><div style={{ fontSize: 10.5, textTransform: 'uppercase', color: '#a5b4fc', fontWeight: 600, marginBottom: 2 }}>Before</div>
                  <ul style={{ fontSize: 13, color: PTC_T.dim, paddingLeft: 16 }}>{session.beforeSteps.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
              )}
              {session.workSteps?.length > 0 && (
                <div><div style={{ fontSize: 10.5, textTransform: 'uppercase', color: '#818cf8', fontWeight: 600, marginBottom: 2 }}>Work</div>
                  <ul style={{ fontSize: 13, color: PTC_T.dim, paddingLeft: 16 }}>{session.workSteps.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
              )}
              {session.definitionOfDone && (
                <div><div style={{ fontSize: 10.5, textTransform: 'uppercase', color: '#34d399', fontWeight: 600, marginBottom: 2 }}>Done when</div>
                  <div style={{ fontSize: 13, color: PTC_T.dim }}>{session.definitionOfDone}</div></div>
              )}
              {session.afterSteps?.length > 0 && (
                <div><div style={{ fontSize: 10.5, textTransform: 'uppercase', color: '#f59e0b', fontWeight: 600, marginBottom: 2 }}>After</div>
                  <ul style={{ fontSize: 13, color: PTC_T.dim, paddingLeft: 16 }}>{session.afterSteps.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
              )}
            </>
          )}
          {workItem.dependencies?.length > 0 && (
            <div style={{ fontSize: 12, color: PTC_T.faint }}>Depends on {workItem.dependencies.length} other item{workItem.dependencies.length !== 1 ? 's' : ''}</div>
          )}
          {workItem.blockerNote && <div style={{ fontSize: 12.5, color: '#f59e0b' }}>Waiting on: {workItem.blockerNote}</div>}
        </div>
      )}
    </div>
  );
}
