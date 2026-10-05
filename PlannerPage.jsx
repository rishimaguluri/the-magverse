// PlannerPage.jsx
// Orchestrator for the Navigator workshop/command-center. Pass B: desktop is a 70/30
// workbench/companion split (not 50/50 chat-vs-list); mobile is Today/Later/Navigator tabs.
// Holds the data.planner slice, the phase machine, drag-independent direct-manipulation
// handlers (move/reorder/mark-done/delete/change-deadline), and the AI round-trip via the new
// structured-operations pipeline (plannerAI.js + plannerOperations.js). App.jsx only ever
// renders <PlannerPage/> for this feature — no planner logic lives there.

const PP_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b', accent: '#a5b4fc' };

function findNextPlannedSession(workItems, workSessions){
  const nowIds = new Set(groupByPriority(workItems).now.map(wi => wi.id));
  const candidates = (workSessions || []).filter(ws => ws.status === 'planned' && nowIds.has(ws.workItemId));
  const timed = candidates.filter(ws => ws.scheduledStart).sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  return timed[0] || candidates[0] || null;
}

function PlannerPage({ data, setData, toasts, isMobile }){
  const planner = emptyPlanner(data);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState('today');
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [calendarPreview, setCalendarPreview] = useState(null);
  const [justChangedIds, setJustChangedIds] = useState(new Set());

  useEffect(() => {
    if((data.rampSessions || []).length && !(data.planner?.legacyRampSessions?.length)){
      setData(d => ({ ...d, planner: migrateLegacyRampSessions(emptyPlanner(d), d.rampSessions) }));
    }
  }, []);

  const upPlanner = (patch) => setData(d => ({ ...d, planner: { ...emptyPlanner(d), ...patch } }));
  const flashChanged = (ids) => { setJustChangedIds(new Set(ids)); setTimeout(() => setJustChangedIds(new Set()), 1400); };

  const today = todayStr();
  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
  const windows = computeAvailableWindows(data.events || [], today, nowHour, 23);
  const availableMinutes = windowsTotalMinutes(windows);
  const nowBucketIds = new Set(groupByPriority(planner.workItems).now.map(wi => wi.id));
  const nowSessions = planner.workSessions.filter(ws => (ws.status === 'planned' || ws.status === 'active') && nowBucketIds.has(ws.workItemId));
  const plannedMinutes = computeWorkload(nowSessions);
  const { overcommitted } = detectOvercommitment(availableMinutes, plannedMinutes);
  const displayCompanionState = planner.phase === 'executing' ? 'working' : (overcommitted ? 'concerned' : planner.companionState);

  const sendMessage = async (text) => {
    const userEntry = newConversationEntry('user', text);
    const workingPlanner = { ...planner, conversation: [...planner.conversation, userEntry] };
    upPlanner({ conversation: workingPlanner.conversation, companionState: 'thinking' });
    setLoading(true);
    try {
      const apiKey = data.settings?.apiKey || '';
      const phaseForCall = planner.phase === 'landing' ? 'dumping' : planner.phase;
      const aiResp = await interpretPlannerMessage(apiKey, text, workingPlanner, data.events || [], phaseForCall);
      const { nextPlannerState, summary, errors, clarifyingQuestions } = applyOperations(workingPlanner, aiResp.operations, today);
      const companionEntry = newConversationEntry('companion', aiResp.companionMessage, aiResp.suggestedCompanionState);
      const nextPhase = clarifyingQuestions.length ? 'clarifying' : (nextPlannerState.workItems.length ? 'planning' : phaseForCall);
      const changedIds = [...summary.createdIds, ...summary.updatedIds, ...summary.movedIds, ...summary.deletedIds];
      const snapshot = { workItems: planner.workItems, workSessions: planner.workSessions };
      setData(d => ({ ...d, planner: {
        ...nextPlannerState,
        conversation: [...nextPlannerState.conversation, companionEntry],
        companionState: aiResp.suggestedCompanionState,
        pendingClarifyingQuestions: clarifyingQuestions,
        phase: nextPhase,
        planHistory: changedIds.length ? [...nextPlannerState.planHistory.slice(-4), snapshot] : nextPlannerState.planHistory,
      } }));
      if(changedIds.length) flashChanged(changedIds);
      if(errors.length) toasts.push('Heads up: ' + errors[0]);
    } catch (e) {
      upPlanner({ companionState: 'idle' });
      toasts.push('Error: ' + (e.message || 'something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  // --- direct manipulation: every drag action has one of these as its non-drag equivalent ---
  const moveCard = (workItemId, targetPriority, beforeId) => {
    upPlanner({ workItems: reorderWorkItems(planner.workItems, workItemId, targetPriority, beforeId) });
  };
  const moveUpDown = (workItemId, dir) => {
    const item = planner.workItems.find(wi => wi.id === workItemId);
    if(!item) return;
    const laneIds = groupByPriority(planner.workItems)[item.priority].map(wi => wi.id);
    const idx = laneIds.indexOf(workItemId);
    if(dir === 'up'){
      if(idx <= 0) return;
      upPlanner({ workItems: reorderWorkItems(planner.workItems, workItemId, item.priority, laneIds[idx - 1]) });
    } else {
      if(idx < 0 || idx >= laneIds.length - 1) return;
      upPlanner({ workItems: reorderWorkItems(planner.workItems, workItemId, item.priority, laneIds[idx + 2] || null) });
    }
  };
  const markDone = (id) => upPlanner({ workItems: planner.workItems.map(wi => wi.id === id ? { ...wi, status: 'done', updatedAt: new Date().toISOString() } : wi) });
  const deleteItem = (id) => upPlanner({ workItems: planner.workItems.map(wi => wi.id === id ? { ...wi, status: 'dropped', updatedAt: new Date().toISOString() } : wi) });
  const changeDeadline = (id) => {
    const item = planner.workItems.find(wi => wi.id === id);
    const input = window.prompt('New deadline (YYYY-MM-DD), blank to clear:', item?.deadline || '');
    if(input === null) return;
    upPlanner({ workItems: planner.workItems.map(wi => wi.id === id ? { ...wi, deadline: input.trim() || null, updatedAt: new Date().toISOString() } : wi) });
  };
  const breakDown = (id) => { const item = planner.workItems.find(wi => wi.id === id); if(item) sendMessage('Break down "' + item.title + '" into smaller steps.'); };
  const makeShorter = (id) => { const item = planner.workItems.find(wi => wi.id === id); if(item) sendMessage('Make "' + item.title + '" shorter.'); };
  const askNavigator = () => setChatCollapsed(false);

  const lockPlan = () => {
    const sessionsToSchedule = planner.workSessions.filter(ws => ws.status === 'planned' && nowBucketIds.has(ws.workItemId) && !ws.scheduledStart);
    const { placed, unplaced } = scheduleSessionsIntoWindows(sessionsToSchedule, windows, today, 10);
    const nextSessions = planner.workSessions.map(ws => placed.find(p => p.id === ws.id) || ws);
    const validation = validatePlanChanges({ workItems: planner.workItems, workSessions: nextSessions }, planner, data.events || []);
    if(!validation.valid){ toasts.push('Could not lock: ' + validation.errors[0]); return; }
    const snapshot = { workItems: planner.workItems, workSessions: planner.workSessions };
    upPlanner({ workSessions: nextSessions, planLocked: true, planVersion: planner.planVersion + 1, planHistory: [...planner.planHistory.slice(-4), snapshot] });
    toasts.push(unplaced.length ? (unplaced.length + " session(s) didn't fit today and stay unscheduled.") : 'Plan locked.');
  };

  const undoLastChange = () => {
    if(!planner.planHistory.length) return;
    const last = planner.planHistory[planner.planHistory.length - 1];
    upPlanner({ workItems: last.workItems, workSessions: last.workSessions, planHistory: planner.planHistory.slice(0, -1) });
    toasts.push('Undone.');
  };

  const startSession = (sessionId) => {
    const nextSessions = planner.workSessions.map(ws => ws.id === sessionId ? { ...ws, status: 'active', actualStart: new Date().toISOString() } : ws);
    upPlanner({ workSessions: nextSessions, activeSessionId: sessionId, phase: 'executing', companionState: 'working' });
  };

  const finishActiveSession = (outcome, note) => {
    const session = planner.workSessions.find(ws => ws.id === planner.activeSessionId);
    if(!session) return;
    const { patch, followUp } = completeWorkSession(session, outcome, note);
    let nextSessions = planner.workSessions.map(ws => ws.id === session.id ? { ...ws, ...patch } : ws);
    if(followUp) nextSessions = [...nextSessions, followUp];
    let nextItems = planner.workItems;
    if(outcome === 'done'){
      const remaining = nextSessions.some(ws => ws.workItemId === session.workItemId && ws.status !== 'done' && ws.status !== 'skipped');
      if(!remaining) nextItems = planner.workItems.map(wi => wi.id === session.workItemId ? { ...wi, status: 'done', updatedAt: new Date().toISOString() } : wi);
    }
    if(outcome === 'blocked'){
      nextItems = planner.workItems.map(wi => wi.id === session.workItemId ? { ...wi, status: 'blocked', priority: 'waiting', blockerNote: note || '', updatedAt: new Date().toISOString() } : wi);
    }
    const nextActive = findNextPlannedSession(nextItems, nextSessions);
    upPlanner({
      workSessions: nextSessions, workItems: nextItems,
      activeSessionId: nextActive ? nextActive.id : null,
      phase: nextActive ? 'executing' : 'planning',
      companionState: outcome === 'done' ? 'celebrating' : 'idle',
    });
  };

  const quickCapture = (text) => {
    setData(d => ({ ...d, inbox: [...(d.inbox || []), { id: uid(), text, createdAt: new Date().toISOString(), source: 'text' }] }));
  };

  const previewCalendarAdditions = () => {
    const toAdd = planner.workSessions.filter(ws => ws.scheduledStart && nowBucketIds.has(ws.workItemId) && ws.status === 'planned');
    if(!toAdd.length){ toasts.push('Nothing scheduled yet to add.'); return; }
    setCalendarPreview(toAdd);
  };
  const confirmCalendarAdditions = () => {
    const newEvents = calendarPreview.map(ws => {
      const start = new Date(ws.scheduledStart), end = new Date(ws.scheduledEnd);
      return { id: uid(), title: ws.title, type: 'Personal', notes: 'Planned via ' + PLANNER_FEATURE_NAME,
        when: { exactDate: ws.scheduledStart.slice(0, 10), hour: start.getHours() + start.getMinutes() / 60, endHour: end.getHours() + end.getMinutes() / 60, day: (start.getDay() + 6) % 7 } };
    });
    const notDupe = newEvents.filter(ev => !(data.events || []).some(e =>
      e.when?.exactDate === ev.when.exactDate && Math.abs((e.when?.hour || 0) - ev.when.hour) < 0.25 && (e.title || '').toLowerCase() === ev.title.toLowerCase()
    ));
    setData(d => ({ ...d, events: [...(d.events || []), ...notDupe] }));
    toasts.push('Added ' + notDupe.length + ' session' + (notDupe.length !== 1 ? 's' : '') + ' to Calendar.');
    setCalendarPreview(null);
  };

  const activeSession = planner.workSessions.find(ws => ws.id === planner.activeSessionId);
  const activeWorkItem = activeSession ? planner.workItems.find(wi => wi.id === activeSession.workItemId) : null;
  const nextUpSession = activeSession ? findNextPlannedSession(planner.workItems, planner.workSessions.filter(ws => ws.id !== activeSession.id)) : null;

  const workspaceProps = {
    plannerState: planner, events: data.events || [], today,
    onMoveCard: moveCard, onMoveUpDown: moveUpDown, onStartSession: startSession,
    onLockPlan: lockPlan, onUndo: undoLastChange, onPreviewCalendarAdd: previewCalendarAdditions,
    onBreakDown: breakDown, onMakeShorter: makeShorter, onChangeDeadline: changeDeadline, onMarkDone: markDone, onDelete: deleteItem, onAskNavigator: askNavigator,
    justChangedIds,
  };

  const quickChips = planner.phase === 'landing' && planner.conversation.length === 0
    ? ['Plan today', "What should I do now?", 'I want to do a full brain dump of everything on my plate.']
    : (overcommitted ? ['Make today lighter', "What's next?"] : []);

  const companionPanel = (collapsedControl) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <PlannerCompanion state={displayCompanionState} size={56} />
        {planner.phase === 'landing' && planner.conversation.length === 0 && (
          <div style={{ fontSize: 13.5, color: PP_T.mid }}>What are we figuring out?</div>
        )}
      </div>
      <PlannerChat conversation={planner.conversation} onSend={sendMessage} loading={loading} quickChips={quickChips}
        collapsed={collapsedControl ? chatCollapsed : false} onToggleCollapse={collapsedControl ? () => setChatCollapsed(c => !c) : undefined} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20" style={{ height: isMobile ? 'auto' : 'calc(100vh - 140px)' }}>
      {calendarPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCalendarPreview(null)} />
          <div className="relative glass rounded-2xl p-5 max-w-sm w-full" style={{ background: 'rgba(10,10,15,0.98)' }}>
            <div className="text-sm font-medium mb-3" style={{ color: PP_T.text }}>Add to Calendar?</div>
            <div className="space-y-1.5 mb-4 max-h-56 overflow-auto">
              {calendarPreview.map(ws => (
                <div key={ws.id} style={{ fontSize: 13, color: PP_T.dim }}>{new Date(ws.scheduledStart).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} — {ws.title}</div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCalendarPreview(null)} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.06)', color: PP_T.mid }}>Cancel</button>
              <button onClick={confirmCalendarAdditions} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {planner.phase === 'executing' && activeSession ? (
        <PlannerExecution session={activeSession} workItem={activeWorkItem} nextSession={nextUpSession} onFinish={finishActiveSession} onQuickCapture={quickCapture} onBack={() => upPlanner({ phase: 'planning' })} />
      ) : isMobile ? (
        <div>
          <div className="flex gap-1 mb-4">
            {[['today', 'Today'], ['later', 'Later'], ['navigator', 'Navigator']].map(([id, label]) => (
              <button key={id} onClick={() => setMobileTab(id)} className="px-3 py-1.5 rounded-lg text-sm"
                style={{ background: mobileTab === id ? 'rgba(99,102,241,0.18)' : 'transparent', color: mobileTab === id ? PP_T.accent : PP_T.mid, fontWeight: mobileTab === id ? 600 : 400 }}>
                {label}
              </button>
            ))}
          </div>
          {mobileTab === 'today' && <PlannerWorkspace {...workspaceProps} show={{ now: true, next: true, later: false, waiting: false, controls: true }} />}
          {mobileTab === 'later' && <PlannerWorkspace {...workspaceProps} show={{ now: false, next: false, later: true, waiting: true, controls: false }} />}
          {mobileTab === 'navigator' && companionPanel(false)}
        </div>
      ) : (
        <div className="grid gap-6" style={{ gridTemplateColumns: '7fr 3fr', height: '100%' }}>
          <div style={{ overflowY: 'auto' }}>
            {planner.workItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center" style={{ minHeight: 240 }}>
                <PlannerCompanion state={displayCompanionState} size={72} />
                <div style={{ fontSize: 15, color: PP_T.mid, marginTop: 12 }}>What are we figuring out?</div>
              </div>
            ) : <PlannerWorkspace {...workspaceProps} />}
          </div>
          <div style={{ minHeight: 0 }}>{companionPanel(true)}</div>
        </div>
      )}
    </div>
  );
}
