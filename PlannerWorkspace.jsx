// PlannerWorkspace.jsx
// The workbench — Now/Next/Later/Waiting lanes, drag-and-drop, the capacity meter. This is the
// 70-75% of the screen that replaces Pass A's static PlannerTimeline.jsx. Now gets full visual
// weight (dominant cards, Before/Work/Done preview, Start CTA); Next is lighter; Later is
// collapsed project/category clusters, not a wall of rows; Waiting is a short list with its
// blocker shown inline. Dragging is real HTML5 drag-and-drop (extends the exact pattern already
// proven in this app's AppCard/AppPipeline Kanban board, App.jsx:9280-9346) and always patches
// real state (plannerEngine.js's reorderWorkItems) — never cosmetic. Every drag action has a
// non-drag equivalent via each card's "⋯" menu (PlannerTaskCard.jsx).

const PWK_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b', accent: '#a5b4fc' };

function PlannerWorkspace({
  plannerState, events, today,
  onMoveCard, onMoveUpDown, onStartSession,
  onLockPlan, onUndo, onPreviewCalendarAdd,
  onBreakDown, onMakeShorter, onChangeDeadline, onMarkDone, onDelete, onAskNavigator,
  justChangedIds,
  show, // optional: {now,next,later,waiting,controls} booleans — lets mobile's Today/Later tabs show a subset
}){
  const vis = { now: true, next: true, later: true, waiting: true, controls: true, ...(show || {}) };
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverLane, setDragOverLane] = useState(null);
  const [dragOverCardId, setDragOverCardId] = useState(null);
  const [dragOverBefore, setDragOverBefore] = useState(true);

  const groups = groupByPriority(plannerState.workItems);
  const sessionsByItem = (id) => plannerState.workSessions.filter(ws => ws.workItemId === id && ws.status !== 'done' && ws.status !== 'skipped');

  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
  const windows = computeAvailableWindows(events || [], today, nowHour, 23);
  const availableMinutes = windowsTotalMinutes(windows);
  const nowSessions = plannerState.workSessions.filter(ws => (ws.status === 'planned' || ws.status === 'active') && groups.now.some(wi => wi.id === ws.workItemId));
  const plannedMinutes = computeWorkload(nowSessions);

  const endDrag = () => { setDraggingId(null); setDragOverLane(null); setDragOverCardId(null); };

  const dropOnLane = (laneId, beforeId) => {
    if(draggingId) onMoveCard(draggingId, laneId, beforeId);
    endDrag();
  };

  const laneCardProps = (wi, laneId) => ({
    today,
    draggable: true,
    onDragStart: () => setDraggingId(wi.id),
    onDragEnd: endDrag,
    onMoveTo: (priority) => onMoveCard(wi.id, priority, null),
    onMoveUpDown: (dir) => onMoveUpDown(wi.id, dir),
    onBreakDown: () => onBreakDown(wi.id),
    onMakeShorter: () => onMakeShorter(wi.id),
    onChangeDeadline: () => onChangeDeadline(wi.id),
    onMarkDone: () => onMarkDone(wi.id),
    onDelete: () => onDelete(wi.id),
    onAskNavigator: () => onAskNavigator(wi.id),
    justChanged: justChangedIds && justChangedIds.has(wi.id),
  });

  const CardSlot = ({ wi, laneId, children }) => (
    <div
      onDragOver={e => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOverLane(laneId);
        setDragOverCardId(wi.id);
        setDragOverBefore((e.clientY - rect.top) < rect.height / 2);
      }}
      onDrop={e => {
        e.preventDefault();
        const laneIds = groups[laneId].map(x => x.id);
        const idx = laneIds.indexOf(wi.id);
        const beforeId = dragOverBefore ? wi.id : (laneIds[idx + 1] || null);
        dropOnLane(laneId, beforeId);
      }}
      style={{ position: 'relative' }}
    >
      {dragOverCardId === wi.id && draggingId && draggingId !== wi.id && (
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: '#818cf8', borderRadius: 1, top: dragOverBefore ? -3 : 'auto', bottom: dragOverBefore ? 'auto' : -3, zIndex: 5 }} />
      )}
      {children}
    </div>
  );

  const laneContainerStyle = (laneId) => ({
    background: dragOverLane === laneId ? 'rgba(99,102,241,0.05)' : 'transparent',
    border: dragOverLane === laneId ? '1px dashed rgba(99,102,241,0.3)' : '1px solid transparent',
    borderRadius: 10,
    padding: 4,
    transition: 'background 0.15s, border-color 0.15s',
    minHeight: 40,
  });

  return (
    <div className="space-y-6">
      {vis.controls && <PlannerCapacityMeter availableMinutes={availableMinutes} plannedMinutes={plannedMinutes} />}

      {vis.controls && <div className="flex gap-2 flex-wrap">
        {!plannerState.planLocked && nowSessions.length > 0 && (
          <button onClick={onLockPlan} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Lock plan</button>
        )}
        {nowSessions.length > 0 && (
          <button onClick={() => { const s = nowSessions.find(ws => ws.status === 'planned'); if(s) onStartSession(s.id); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Start Next</button>
        )}
        {plannerState.planHistory.length > 0 && (
          <button onClick={onUndo} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: PWK_T.mid }}>Undo</button>
        )}
        {nowSessions.some(ws => ws.scheduledStart) && (
          <button onClick={onPreviewCalendarAdd} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: PWK_T.mid }}>Preview calendar additions</button>
        )}
      </div>}

      {/* NOW — dominant */}
      {vis.now && <div onDragOver={e => { e.preventDefault(); setDragOverLane('now'); }} onDrop={e => { e.preventDefault(); dropOnLane('now', null); }} style={laneContainerStyle('now')}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: PWK_T.faint, fontWeight: 700, marginBottom: 8 }}>Now</div>
        {groups.now.length === 0 ? (
          <div style={{ fontSize: 13, color: PWK_T.faint, padding: '6px 4px' }}>Nothing here yet — drag a task in, or just tell Navigator what matters right now.</div>
        ) : (
          <div className="space-y-2">
            {groups.now.map(wi => (
              <CardSlot key={wi.id} wi={wi} laneId="now">
                <PlannerTaskCard workItem={wi} sessions={sessionsByItem(wi.id)} variant="now" onStart={() => { const s = sessionsByItem(wi.id).find(x => x.status === 'planned'); if(s) onStartSession(s.id); }} {...laneCardProps(wi, 'now')} />
              </CardSlot>
            ))}
          </div>
        )}
      </div>}

      {/* NEXT — lighter */}
      {vis.next && <div onDragOver={e => { e.preventDefault(); setDragOverLane('next'); }} onDrop={e => { e.preventDefault(); dropOnLane('next', null); }} style={laneContainerStyle('next')}>
        <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: PWK_T.faint, fontWeight: 600, marginBottom: 6 }}>Next</div>
        {groups.next.length === 0 ? (
          <div style={{ fontSize: 12.5, color: PWK_T.faint }}>—</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.next.map(wi => (
              <CardSlot key={wi.id} wi={wi} laneId="next">
                <div style={{ width: 200 }}><PlannerTaskCard workItem={wi} sessions={sessionsByItem(wi.id)} variant="compact" {...laneCardProps(wi, 'next')} /></div>
              </CardSlot>
            ))}
          </div>
        )}
      </div>}

      {/* LATER — grouped, collapsed by default */}
      {vis.later && <div onDragOver={e => { e.preventDefault(); setDragOverLane('later'); }} onDrop={e => { e.preventDefault(); dropOnLane('later', null); }} style={laneContainerStyle('later')}>
        <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: PWK_T.faint, fontWeight: 600, marginBottom: 6 }}>Later</div>
        {groups.later.length === 0 ? (
          <div style={{ fontSize: 12.5, color: PWK_T.faint }}>—</div>
        ) : (
          (() => {
            const byProject = {};
            const ungrouped = [];
            groups.later.forEach(wi => {
              if(wi.projectId){ (byProject[wi.projectId] = byProject[wi.projectId] || []).push(wi); }
              else ungrouped.push(wi);
            });
            const byLabel = groupWorkItemsByLabel(ungrouped);
            return (
              <>
                {Object.entries(byProject).map(([projectId, items]) => {
                  const project = (plannerState.projects || []).find(p => p.id === projectId);
                  return <PlannerProjectCluster key={projectId} title={project?.title || 'Project'} workItems={items} today={today} onCardProps={wi => laneCardProps(wi, 'later')} />;
                })}
                {Object.entries(byLabel).map(([label, items]) => (
                  <PlannerProjectCluster key={label} title={label} workItems={items} today={today} onCardProps={wi => laneCardProps(wi, 'later')} />
                ))}
              </>
            );
          })()
        )}
      </div>}

      {/* WAITING — short list, blocker shown inline */}
      {vis.waiting && groups.waiting.length > 0 && (
        <div onDragOver={e => { e.preventDefault(); setDragOverLane('waiting'); }} onDrop={e => { e.preventDefault(); dropOnLane('waiting', null); }} style={laneContainerStyle('waiting')}>
          <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: PWK_T.faint, fontWeight: 600, marginBottom: 6 }}>Waiting</div>
          <div className="space-y-1.5">
            {groups.waiting.map(wi => (
              <CardSlot key={wi.id} wi={wi} laneId="waiting">
                <PlannerTaskCard workItem={wi} sessions={sessionsByItem(wi.id)} variant="compact" {...laneCardProps(wi, 'waiting')} />
              </CardSlot>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
