// plannerTypes.js
// Data model + factory helpers for the conversational work-planning companion that replaces
// the old Deep Work Ramp. Plain classic script, loaded first among the planner files (before
// plannerStorage.js/plannerEngine.js/plannerScheduling.js/plannerValidation.js/plannerAI.js and
// the Planner*.jsx UI files), all before App.jsx — same global-scope-sharing convention as
// strategyContent.js/strategyEngine.js and the consulting*.js files.
//
// The displayed feature name lives in ONE place (PLANNER_FEATURE_NAME) so it can be renamed
// later without touching the rest of the implementation.

const PLANNER_FEATURE_NAME = 'Navigator';

// Companion animation/state model — a closed set, never ad hoc booleans.
const COMPANION_STATES = ['idle','listening','thinking','organizing','concerned','ready','working','celebrating'];

const WORK_ITEM_STATUSES = ['not_started','in_progress','done','partial','blocked','dropped'];
const WORK_SESSION_STATUSES = ['planned','active','paused','done','partial','blocked','skipped'];
const PRIORITY_BUCKETS = ['now','next','later','someday','waiting'];

/*
WorkItem {
  id, title, rawSourceText, outcome, deadline (YYYY-MM-DD|null), earliestStart (YYYY-MM-DD|null),
  estimatedMinutes (number|null), estimateConfidence ('known'|'likely'|'unknown'),
  priority ('now'|'next'|'later'|'someday'|'waiting'), energyRequirement ('high'|'low'|null),
  context, projectId, dependencies: [workItemId], subtasks: [{id,title,done}],
  status ('not_started'|'in_progress'|'done'|'partial'|'blocked'|'dropped'),
  schedulingFlexibility ('fixed'|'flexible'),
  source: {type:'manual'|'strategy'|'consulting'|'calendar'|'assignment', id}, // unused this pass except 'manual'
  createdAt, updatedAt
}
*/
function newWorkItem(seed = {}){
  const now = new Date().toISOString();
  return {
    id: uid('wi'),
    title: '',
    rawSourceText: '',
    outcome: '',
    deadline: null,
    earliestStart: null,
    estimatedMinutes: null,
    estimateConfidence: 'unknown',
    priority: 'later',
    energyRequirement: null,
    context: '',
    projectId: null,
    dependencies: [],
    subtasks: [],
    status: 'not_started',
    schedulingFlexibility: 'flexible',
    source: { type: 'manual', id: null },
    createdAt: now,
    updatedAt: now,
    ...seed,
  };
}

/*
WorkSession {
  id, workItemId, title, scheduledStart (ISO|null), scheduledEnd (ISO|null),
  plannedMinutes (number|null), actualStart (ISO|null), actualEnd (ISO|null),
  beforeSteps: [string], workSteps: [string], definitionOfDone (string), afterSteps: [string],
  energyLevel ('high'|'low'|null), status ('planned'|'active'|'paused'|'done'|'partial'|'blocked'|'skipped'),
  outcome (string), blockerNote (string)
}
*/
function newWorkSession(seed = {}){
  return {
    id: uid('ws'),
    workItemId: seed.workItemId || null,
    title: '',
    scheduledStart: null,
    scheduledEnd: null,
    plannedMinutes: null,
    actualStart: null,
    actualEnd: null,
    beforeSteps: [],
    workSteps: [],
    definitionOfDone: '',
    afterSteps: [],
    energyLevel: null,
    status: 'planned',
    outcome: '',
    blockerNote: '',
    ...seed,
  };
}

// Light grouping only — no separate Goal entity this pass (Part 17/46).
function newProject(seed = {}){
  return { id: uid('pj'), title: '', workItemIds: [], ...seed };
}

// One conversation turn — user or companion. companionState is only set on companion turns,
// recording what the character showed at the time (useful for debugging/history, not required).
function newConversationEntry(role, text, companionState){
  return { id: uid('pc'), role, text, ts: new Date().toISOString(), companionState: companionState || null };
}
