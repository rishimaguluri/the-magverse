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

/* ---------- grouping for the Later lane (Part "Auto-grouping" / "Project Clusters") ---------- */

const GROUP_LABELS = ['Recruiting', 'Consulting', 'Magverse', 'School', 'Personal', 'Admin'];

// Heuristic, not a forced taxonomy — same spirit as inferContextTemplate. Order matters: more
// specific categories are checked first so e.g. a "consulting case" for recruiting purposes
// still lands in Recruiting rather than the more generic Consulting bucket.
function inferGroupLabel(workItem){
  const t = ((workItem.title || '') + ' ' + (workItem.outcome || '') + ' ' + (workItem.context || '')).toLowerCase();
  if(/coffee chat|interview|resume|application|internship|recruit|bain program|mckinsey|bcg\b/.test(t)) return 'Recruiting';
  if(/\bcase\b|casing|market sizing/.test(t)) return 'Consulting';
  if(/magverse|navigator|strategy lesson|strategy section/.test(t)) return 'Magverse';
  if(/stats|homework|exam|class|chapter|philosophy|international business|school|course|professor|syllabus|tophat/.test(t)) return 'School';
  if(/\bcall\b|workout|gym|parents|appointment/.test(t)) return 'Personal';
  return 'Admin';
}

// Groups work items by inferred label, preserving each item's current array order within its
// group (so drag-reordering, which also just reorders the underlying array, is reflected here
// with no separate "group order" field to keep in sync).
function groupWorkItemsByLabel(workItems){
  const groups = {};
  (workItems || []).forEach(wi => {
    const label = inferGroupLabel(wi);
    (groups[label] = groups[label] || []).push(wi);
  });
  return groups;
}

/* ---------- drag-and-drop reordering (Part "Every task must be draggable") ---------- */

// Moves `draggedId` into `targetPriority`'s lane, positioned immediately before
// `beforeId` (or at the end of that lane if beforeId is null/omitted). Reorders the single
// workItems array itself — group/lane order is just a filtered view of that array order
// (groupByPriority/groupWorkItemsByLabel), so there is no separate "lane order" field to drift
// out of sync. Pure function — the caller persists the result.
function reorderWorkItems(workItems, draggedId, targetPriority, beforeId){
  const dragged = workItems.find(wi => wi.id === draggedId);
  if(!dragged) return workItems;
  const updatedDragged = dragged.priority === targetPriority ? dragged : { ...dragged, priority: targetPriority, updatedAt: new Date().toISOString() };
  const withoutDragged = workItems.filter(wi => wi.id !== draggedId);

  if(beforeId){
    const neighborIdx = withoutDragged.findIndex(wi => wi.id === beforeId);
    if(neighborIdx >= 0) return [...withoutDragged.slice(0, neighborIdx), updatedDragged, ...withoutDragged.slice(neighborIdx)];
  }
  // No neighbor given (or it wasn't found) — append after the last item currently in that lane,
  // or at the very end of the array if the lane is empty.
  const lastLaneIdx = withoutDragged.reduce((last, wi, i) => wi.priority === targetPriority ? i : last, -1);
  if(lastLaneIdx < 0) return [...withoutDragged, updatedDragged];
  return [...withoutDragged.slice(0, lastLaneIdx + 1), updatedDragged, ...withoutDragged.slice(lastLaneIdx + 1)];
}

// Pass A's applyAIProposal() (whole-WorkItem re-proposal) is superseded by
// plannerOperations.js's applyOperations() (structured per-field operations) — see that file.
