// plannerValidation.js
// Deterministic validation — AI proposes, this decides (Part 55/56). Nothing from an AI
// response or a drag/edit is applied to data.planner without passing validatePlanChanges()
// first. Loaded after plannerScheduling.js, before plannerAI.js.

function validatePlanChanges(proposed, plannerState, events){
  const errors = [];
  const warnings = [];
  const items = proposed.workItems || [];
  const sessions = proposed.workSessions || [];
  const allKnownItems = [...(plannerState?.workItems || []), ...items];

  // Possible duplicate work items (same title, case-insensitive) — a warning, not a hard
  // error, since two genuinely different obligations can share a title.
  const seenTitles = new Set();
  items.forEach(it => {
    const key = (it.title || '').trim().toLowerCase();
    if(!key) return;
    if(seenTitles.has(key)) warnings.push('Possible duplicate work item: "' + it.title + '"');
    seenTitles.add(key);
  });

  sessions.forEach(ws => {
    if(ws.plannedMinutes != null && ws.plannedMinutes <= 0){
      errors.push('Session "' + (ws.title || ws.id) + '" has a non-positive duration');
    }
    if(ws.scheduledStart && ws.scheduledEnd && new Date(ws.scheduledEnd) <= new Date(ws.scheduledStart)){
      errors.push('Session "' + (ws.title || ws.id) + '" ends before (or when) it starts');
    }
  });

  // Sessions overlapping each other.
  const timed = sessions.filter(ws => ws.scheduledStart && ws.scheduledEnd);
  for(let i = 0; i < timed.length; i++){
    for(let j = i + 1; j < timed.length; j++){
      const a = timed[i], b = timed[j];
      const aS = new Date(a.scheduledStart), aE = new Date(a.scheduledEnd);
      const bS = new Date(b.scheduledStart), bE = new Date(b.scheduledEnd);
      if(aS < bE && bS < aE) errors.push('"' + (a.title || a.id) + '" overlaps "' + (b.title || b.id) + '"');
    }
  }

  // Calendar conflicts — a session scheduled over a fixed commitment.
  timed.forEach(ws => {
    const dateStr = ws.scheduledStart.slice(0, 10);
    (events || []).filter(ev => eventOccursOnDate(ev, dateStr)).forEach(ev => {
      const evStart = hourToISO(dateStr, ev.when.hour || 0);
      const evEnd = hourToISO(dateStr, ev.when.endHour != null ? ev.when.endHour : (ev.when.hour || 0) + 1);
      if(new Date(ws.scheduledStart) < new Date(evEnd) && new Date(evStart) < new Date(ws.scheduledEnd)){
        errors.push('"' + (ws.title || ws.id) + '" conflicts with calendar event "' + (ev.title || 'Event') + '"');
      }
    });
  });

  // A session scheduled to finish after its own work item's deadline.
  sessions.forEach(ws => {
    const item = allKnownItems.find(i => i.id === ws.workItemId);
    if(item && item.deadline && ws.scheduledEnd){
      const deadlineEnd = new Date(item.deadline + 'T23:59:59');
      if(new Date(ws.scheduledEnd) > deadlineEnd){
        errors.push('"' + (ws.title || ws.id) + '" is scheduled after "' + item.title + '"\'s deadline (' + item.deadline + ')');
      }
    }
  });

  // Dependency ordering — a session scheduled before its work item's dependency is done/scheduled.
  sessions.forEach(ws => {
    const item = allKnownItems.find(i => i.id === ws.workItemId);
    if(!item || !item.dependencies || !item.dependencies.length || !ws.scheduledStart) return;
    item.dependencies.forEach(depId => {
      const dep = allKnownItems.find(i => i.id === depId);
      if(dep && dep.status === 'done') return;
      const depSessions = [...sessions, ...(plannerState?.workSessions || [])].filter(s => s.workItemId === depId && s.scheduledEnd);
      if(!depSessions.length){ warnings.push('"' + item.title + '" depends on an item with no scheduled session yet'); return; }
      const earliestDepEnd = depSessions.reduce((min, s) => (!min || new Date(s.scheduledEnd) < min) ? new Date(s.scheduledEnd) : min, null);
      if(earliestDepEnd && new Date(ws.scheduledStart) < earliestDepEnd){
        errors.push('"' + (ws.title || ws.id) + '" is scheduled before its dependency finishes');
      }
    });
  });

  return { valid: errors.length === 0, errors, warnings };
}

/* ---------- per-operation validation (Part "Deterministic validation" for structured ops) ---------- */

// Gates a single structured AI operation (plannerOperations.js) before it's applied. Checks
// are intentionally op-specific and narrow — applyOperation() itself still guards against
// unknown ids defensively, this is the semantic/business layer (duplicates, bad durations,
// overlaps, dependency cycles, invalid buckets).
function validateOperation(op, plannerState, today){
  const errors = [];
  const items = plannerState.workItems || [];
  const sessions = plannerState.workSessions || [];

  switch(op.op){
    case 'CREATE_TASK': {
      const title = ((op.workItem && op.workItem.title) || '').trim().toLowerCase();
      if(!title) errors.push('CREATE_TASK: title is required');
      else if(items.some(wi => wi.status !== 'dropped' && (wi.title || '').trim().toLowerCase() === title)){
        errors.push('CREATE_TASK: a work item titled "' + op.workItem.title + '" already exists');
      }
      break;
    }
    case 'CREATE_SESSION': {
      if(!items.some(wi => wi.id === op.workItemId)) errors.push('CREATE_SESSION: unknown workItemId ' + op.workItemId);
      if(op.session && op.session.plannedMinutes != null && op.session.plannedMinutes <= 0) errors.push('CREATE_SESSION: plannedMinutes must be positive');
      break;
    }
    case 'MOVE_SESSION': {
      if(op.scheduledStart && op.scheduledEnd && new Date(op.scheduledEnd) <= new Date(op.scheduledStart)){
        errors.push('MOVE_SESSION: end must be after start');
      } else if(op.scheduledStart && op.scheduledEnd){
        const aS = new Date(op.scheduledStart), aE = new Date(op.scheduledEnd);
        sessions.filter(ws => ws.id !== op.sessionId && ws.scheduledStart && ws.scheduledEnd).forEach(ws => {
          const bS = new Date(ws.scheduledStart), bE = new Date(ws.scheduledEnd);
          if(aS < bE && bS < aE) errors.push('MOVE_SESSION: would overlap "' + (ws.title || ws.id) + '"');
        });
      }
      break;
    }
    case 'SET_DEPENDENCY': {
      if(op.workItemId === op.dependsOnId){
        errors.push('SET_DEPENDENCY: a task cannot depend on itself');
      } else {
        const target = items.find(wi => wi.id === op.dependsOnId);
        if(target && (target.dependencies || []).includes(op.workItemId)) errors.push('SET_DEPENDENCY: would create a dependency cycle');
      }
      break;
    }
    case 'MOVE_TASK': {
      if(!PRIORITY_BUCKETS.includes(op.priority)) errors.push('MOVE_TASK: invalid priority "' + op.priority + '"');
      break;
    }
    default:
      break;
  }
  return { valid: errors.length === 0, errors };
}
