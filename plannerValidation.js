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
