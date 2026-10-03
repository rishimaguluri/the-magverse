// plannerEngine.js
// Pure logic for the planning companion: priority recommendation (transparent, rule-based —
// never an opaque score), context-aware before/after templates, session-outcome handling, and
// applying an AI proposal onto planner state. No JSX here. Loaded after plannerStorage.js,
// before plannerScheduling.js/plannerValidation.js/plannerAI.js.
//
// Reuses todayStr()/addDaysStr()/daysBetweenStr() from strategyEngine.js (loaded earlier in
// index.html) rather than redefining them — same convention consultingEngine.js already uses.

/* ---------- priority recommendation (Part 18 — explain decisions, never a score) ---------- */

// One sentence per rule, in priority order. Returns {priority, reason} — reason is shown
// directly to the user as "why", never compressed into a number.
function recommendPriority(workItem, today, allWorkItems){
  if(workItem.status === 'blocked'){
    return { priority: 'waiting', reason: workItem.blockerNote ? ('Blocked: ' + workItem.blockerNote) : 'Blocked on something else' };
  }
  const unmetDep = (workItem.dependencies || []).find(depId => {
    const dep = (allWorkItems || []).find(wi => wi.id === depId);
    return dep && dep.status !== 'done';
  });
  if(unmetDep){
    const dep = (allWorkItems || []).find(wi => wi.id === unmetDep);
    return { priority: 'waiting', reason: 'Waiting on "' + (dep ? dep.title : 'another item') + '" to finish first' };
  }
  if(workItem.deadline){
    const daysUntil = daysBetweenStr(today, workItem.deadline);
    if(daysUntil <= 0) return { priority: 'now', reason: daysUntil === 0 ? 'Due today' : 'Overdue' };
    if(daysUntil === 1) return { priority: 'now', reason: 'Due tomorrow' };
    if(daysUntil <= 3) return { priority: 'next', reason: 'Due in ' + daysUntil + ' days' };
    return { priority: 'later', reason: 'Due in ' + daysUntil + ' days — not urgent yet' };
  }
  if(workItem.schedulingFlexibility === 'fixed' && workItem.earliestStart && workItem.earliestStart <= today){
    return { priority: 'now', reason: 'Scheduled to happen now' };
  }
  if(workItem.schedulingFlexibility === 'flexible' && !workItem.deadline){
    return { priority: 'someday', reason: 'No deadline — flexible, can wait' };
  }
  return { priority: 'later', reason: 'No urgency signal yet' };
}

function groupByPriority(workItems){
  const groups = { now: [], next: [], later: [], someday: [], waiting: [] };
  (workItems || []).forEach(wi => {
    if(wi.status === 'done' || wi.status === 'dropped') return;
    (groups[wi.priority] || groups.later).push(wi);
  });
  return groups;
}

/* ---------- context-aware before/after templates (Part 37-38) ---------- */

const CONTEXT_TEMPLATES = {
  study: { beforeSteps: ['Open notes and problem set', 'Get calculator', 'Phone on do-not-disturb'],
    afterSteps: ['Check answers against solutions', 'Add missed questions to a review list'], closeoutPrompt: 'What still feels shaky?' },
  case: { beforeSteps: ['Get water and paper', 'Open the case prompt / Case Tracker'],
    afterSteps: ['Write a 2-line reflection', 'Log the case in Case Tracker'], closeoutPrompt: 'What was the biggest weakness?' },
  writing: { beforeSteps: ['Open the outline', 'Close messaging apps'],
    afterSteps: ['Read once for structure', 'Save or send the draft'], closeoutPrompt: 'What remains unfinished?' },
  call: { beforeSteps: ['Review context', 'Write 2-3 questions'],
    afterSteps: ['Capture takeaways', 'Send a follow-up if needed'], closeoutPrompt: 'Any follow-up needed?' },
  coding: { beforeSteps: ['Open the code and requirements', 'Phone away'],
    afterSteps: ['Note what remains unfinished', 'Commit or save progress'], closeoutPrompt: 'What remains unfinished?' },
  admin: { beforeSteps: [], afterSteps: [], closeoutPrompt: null },
};

function inferContextTemplate(workItem){
  const t = ((workItem.title || '') + ' ' + (workItem.outcome || '') + ' ' + (workItem.context || '')).toLowerCase();
  if(/\bcase\b|market sizing|pricing case/.test(t)) return CONTEXT_TEMPLATES.case;
  if(/study|exam|homework|chapter|problem set|practice set|stats/.test(t)) return CONTEXT_TEMPLATES.study;
  if(/write|draft|essay|\bdeck\b|memo/.test(t)) return CONTEXT_TEMPLATES.writing;
  if(/\bcall\b|phone|coffee chat|talk to/.test(t)) return CONTEXT_TEMPLATES.call;
  if(/code|redesign|lesson|debug|strategy|consulting|magverse/.test(t)) return CONTEXT_TEMPLATES.coding;
  return CONTEXT_TEMPLATES.admin;
}

/* ---------- session outcomes (Part 62-64) ---------- */

// outcome: 'done'|'partial'|'blocked'|'skipped'. Returns {patch, followUp} — followUp is a new,
// unscheduled WorkSession for the same WorkItem when the user says the work is only partial
// (never recreates the whole original task, per Part 63).
function completeWorkSession(session, outcome, note){
  const now = new Date().toISOString();
  const patch = { status: outcome, actualEnd: now, outcome: note || '' };
  let followUp = null;
  if(outcome === 'partial'){
    followUp = newWorkSession({
      workItemId: session.workItemId,
      title: session.title,
      workSteps: [note && note.trim() ? note.trim() : 'Finish remaining work'],
      definitionOfDone: session.definitionOfDone,
      plannedMinutes: Math.max(15, Math.round((session.plannedMinutes || 30) / 2)),
    });
  }
  if(outcome === 'blocked'){
    patch.blockerNote = note || '';
  }
  return { patch, followUp };
}

/* ---------- applying an AI proposal onto planner state (Part 54 — structured only) ---------- */

function stripSessions(p){
  const { sessions, ...rest } = p;
  return rest;
}

// Merges proposedWorkItems (+ their nested proposed sessions) into plannerState. Creates a new
// WorkItem when no matching id is given, otherwise patches the existing one. Never touches
// companionMessage/prose — only the structured fields drive this.
function applyAIProposal(plannerState, aiResponse, today){
  const workItems = [...(plannerState.workItems || [])];
  const workSessions = [...(plannerState.workSessions || [])];
  const createdOrUpdatedIds = [];

  (aiResponse.proposedWorkItems || []).forEach(p => {
    let item;
    const existingIdx = p.id ? workItems.findIndex(wi => wi.id === p.id) : -1;
    if(existingIdx >= 0){
      item = { ...workItems[existingIdx], ...stripSessions(p), updatedAt: new Date().toISOString() };
      workItems[existingIdx] = item;
    } else {
      const base = stripSessions(p);
      delete base.id;
      const rec = recommendPriority({ ...base, status: 'not_started' }, today, workItems);
      item = newWorkItem({ ...base, priority: base.priority || rec.priority });
      workItems.push(item);
    }
    createdOrUpdatedIds.push(item.id);
    (p.sessions || []).forEach(s => {
      const template = inferContextTemplate(item);
      workSessions.push(newWorkSession({
        workItemId: item.id,
        title: s.title || item.title,
        plannedMinutes: s.plannedMinutes != null ? s.plannedMinutes : (item.estimatedMinutes || null),
        beforeSteps: (s.beforeSteps && s.beforeSteps.length) ? s.beforeSteps : template.beforeSteps,
        workSteps: s.workSteps || [],
        definitionOfDone: s.definitionOfDone || '',
        afterSteps: (s.afterSteps && s.afterSteps.length) ? s.afterSteps : template.afterSteps,
      }));
    });
  });

  const validation = validatePlanChanges({ workItems, workSessions }, plannerState, []);
  return { nextPlannerState: { ...plannerState, workItems, workSessions }, validation, createdOrUpdatedIds };
}
