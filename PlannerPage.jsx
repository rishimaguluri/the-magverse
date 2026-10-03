// PlannerPage.jsx
// Orchestrator for the Navigator conversational planning companion. Holds the data.planner
// slice, a simple phase machine (landing|dumping|clarifying|planning|executing), and composes
// PlannerCompanion/PlannerConversation/PlannerTimeline/PlannerExecution. Desktop: conversation+
// companion left/center, timeline right (Part 59). Mobile: Chat/Plan tabs (Part 85).
// App.jsx should only ever render <PlannerPage/> for this feature — no planner logic lives there.

const PP_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b', accent: '#a5b4fc' };

const PLANNER_QUICK_CHIPS = [
  'Plan today',
  "What should I do now?",
  'I want to do a full brain dump of everything on my plate.',
  'Replan my day — something changed.',
];

function findNextPlannedSession(workItems, workSessions){
  const nowIds = new Set(groupByPriority(workItems).now.map(wi => wi.id));
  const candidates = (workSessions || []).filter(ws => ws.status === 'planned' && nowIds.has(ws.workItemId));
  const timed = candidates.filter(ws => ws.scheduledStart).sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  return timed[0] || candidates[0] || null;
}

function PlannerPage({ data, setData, toasts, isMobile }){
  const planner = emptyPlanner(data);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState('chat');
  const [calendarPreview, setCalendarPreview] = useState(null);

  useEffect(() => {
    if((data.rampSessions || []).length && !(data.planner?.legacyRampSessions?.length)){
      setData(d => ({ ...d, planner: migrateLegacyRampSessions(emptyPlanner(d), d.rampSessions) }));
    }
  }, []);

  const upPlanner = (patch) => setData(d => ({ ...d, planner: { ...emptyPlanner(d), ...patch } }));

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
      const { nextPlannerState, validation } = applyAIProposal(workingPlanner, aiResp, today);
      const companionEntry = newConversationEntry('companion', aiResp.companionMessage, aiResp.suggestedCompanionState);
      const newTitles = (aiResp.proposedWorkItems || []).map(p => p.title).filter(Boolean);
      const nextPhase = (aiResp.clarifyingQuestions || []).length ? 'clarifying' : (nextPlannerState.workItems.length ? 'planning' : phaseForCall);
      setData(d => ({ ...d, planner: {
        ...nextPlannerState,
        conversation: [...nextPlannerState.conversation, companionEntry],
        companionState: aiResp.suggestedCompanionState,
        pendingClarifyingQuestions: aiResp.clarifyingQuestions || [],
        lastExtractedTitles: newTitles,
        phase: nextPhase,
      } }));
      if(!validation.valid) toasts.push('Heads up: ' + validation.errors[0]);
    } catch (e) {
      upPlanner({ companionState: 'idle' });
      toasts.push('Error: ' + (e.message || 'something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  const lockPlan = () => {
    const sessionsToSchedule = planner.workSessions.filter(ws => ws.status === 'planned' && nowBucketIds.has(ws.workItemId) && !ws.scheduledStart);
    const { placed, unplaced } = scheduleSessionsIntoWindows(sessionsToSchedule, windows, today, 10);
    const nextSessions = planner.workSessions.map(ws => placed.find(p => p.id === ws.id) || ws);
    const validation = validatePlanChanges({ workItems: planner.workItems, workSessions: nextSessions }, planner, data.events || []);
    if(!validation.valid){ toasts.push('Could not lock: ' + validation.errors[0]); return; }
    const snapshot = { workItems: planner.workItems, workSessions: planner.workSessions };
    upPlanner({
      workSessions: nextSessions,
      planLocked: true,
      planVersion: planner.planVersion + 1,
      planHistory: [...planner.planHistory.slice(-4), snapshot],
    });
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
      nextItems = planner.workItems.map(wi => wi.id === session.workItemId ? { ...wi, status: 'blocked', updatedAt: new Date().toISOString() } : wi);
    }
    const nextActive = findNextPlannedSession(nextItems, nextSessions);
    upPlanner({
      workSessions: nextSessions,
      workItems: nextItems,
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
      return {
        id: uid(), title: ws.title, type: 'Personal', notes: 'Planned via ' + PLANNER_FEATURE_NAME,
        when: { exactDate: ws.scheduledStart.slice(0, 10), hour: start.getHours() + start.getMinutes() / 60, endHour: end.getHours() + end.getMinutes() / 60, day: (start.getDay() + 6) % 7 },
      };
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
  const nextUpSession = activeSession ? findNextPlannedSession(planner.workItems.filter(wi => wi.id !== activeSession.workItemId || true), planner.workSessions.filter(ws => ws.id !== activeSession.id)) : null;

  const conversationPane = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <PlannerCompanion state={displayCompanionState} size={64} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: PP_T.text }}>
            {planner.phase === 'landing' ? 'What are we figuring out?' : PLANNER_FEATURE_NAME}
          </div>
          {planner.phase === 'landing' && <div style={{ fontSize: 12.5, color: PP_T.faint }}>Tell me everything you need to get done. Messy is fine.</div>}
        </div>
      </div>
      {planner.phase === 'landing' && planner.conversation.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {PLANNER_QUICK_CHIPS.map((c, i) => (
            <button key={i} onClick={() => sendMessage(c)} className="text-xs px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: PP_T.mid }}>{c}</button>
          ))}
        </div>
      )}
      <PlannerConversation conversation={planner.conversation} onSend={sendMessage} loading={loading} newlyExtractedTitles={planner.lastExtractedTitles} />
    </div>
  );

  const planPane = (
    <div>
      {planner.workItems.length === 0 ? (
        <div style={{ fontSize: 13.5, color: PP_T.faint }}>Nothing planned yet — tell me what's on your mind.</div>
      ) : (
        <>
          <PlannerTimeline plannerState={planner} events={data.events || []} today={today}
            onStartSession={startSession}
            onPreviewCalendarAdd={previewCalendarAdditions} />
          <div className="flex gap-2 flex-wrap mt-4">
            {!planner.planLocked && nowSessions.length > 0 && (
              <button onClick={lockPlan} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Lock plan</button>
            )}
            {nowSessions.length > 0 && (
              <button onClick={() => { const s = findNextPlannedSession(planner.workItems, planner.workSessions); if(s) startSession(s.id); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Start Next</button>
            )}
            {planner.planHistory.length > 0 && (
              <button onClick={undoLastChange} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.06)', color: PP_T.mid }}>Undo</button>
            )}
          </div>
        </>
      )}
    </div>
  );

  const executionPane = (
    <PlannerExecution
      session={activeSession}
      workItem={activeWorkItem}
      nextSession={nextUpSession}
      onFinish={finishActiveSession}
      onQuickCapture={quickCapture}
      onBack={() => upPlanner({ phase: 'planning' })}
    />
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
        executionPane
      ) : isMobile ? (
        <div>
          <div className="flex gap-1 mb-4">
            {['chat', 'plan'].map(t => (
              <button key={t} onClick={() => setMobileTab(t)} className="px-3 py-1.5 rounded-lg text-sm capitalize"
                style={{ background: mobileTab === t ? 'rgba(99,102,241,0.18)' : 'transparent', color: mobileTab === t ? PP_T.accent : PP_T.mid, fontWeight: mobileTab === t ? 600 : 400 }}>
                {t}
              </button>
            ))}
          </div>
          {mobileTab === 'chat' ? conversationPane : planPane}
        </div>
      ) : (
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr', height: '100%' }}>
          <div style={{ minHeight: 0 }}>{conversationPane}</div>
          <div style={{ overflowY: 'auto' }}>{planPane}</div>
        </div>
      )}
    </div>
  );
}
