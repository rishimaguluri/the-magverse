// plannerStorage.js
// Default-shape + migration helpers for data.planner, mirroring the emptyStrategy()/
// getDefaultConsulting() spread-merge convention used elsewhere in this app. Loaded after
// plannerTypes.js, before plannerEngine.js.

function emptyPlanner(data){
  return {
    phase: 'landing', // 'landing'|'dumping'|'clarifying'|'planning'|'executing'
    conversation: [],
    workItems: [],
    workSessions: [],
    projects: [],
    planVersion: 0,
    planHistory: [],
    legacyRampSessions: [],
    activeSessionId: null,
    companionState: 'idle',
    pendingClarifyingQuestions: [],
    lastExtractedTitles: [],
    planLocked: false,
    ...((data && data.planner) || {}),
  };
}

// One-time, additive migration: copies the OLD Deep Work Ramp's completed sessions into a
// read-only legacy list inside the new planner namespace. data.rampSessions itself is never
// touched or deleted — this only runs once (guarded by legacyRampSessions already being
// populated) and is purely a read-and-copy.
function migrateLegacyRampSessions(plannerState, rampSessions){
  if(!rampSessions || !rampSessions.length) return plannerState;
  if(plannerState.legacyRampSessions && plannerState.legacyRampSessions.length) return plannerState;
  const legacy = rampSessions.map(s => ({
    id: s.id,
    title: s.deliverable || '(untitled focus session)',
    plannedMinutes: s.timerLengthMin || null,
    outcomeNote: s.outcomeNote || '',
    nextMicroAction: s.nextMicroAction || '',
    completedAt: s.startedAt || null,
  }));
  return { ...plannerState, legacyRampSessions: legacy };
}
