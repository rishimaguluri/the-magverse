// plannerOperations.js
// Applies structured AI operations onto planner state, one at a time, each gated by
// plannerValidation.js's validateOperation() first. Replaces Pass A's "propose whole
// WorkItems" model — a single correction now patches only the affected item/session instead
// of regenerating everything, and every apply returns a changeSummary so the UI can animate
// exactly what changed (never silently mutate everything). Loaded after plannerEngine.js /
// plannerScheduling.js, before plannerValidation.js (which plannerPage.jsx calls directly) —
// plannerValidation.js's validateOperation is only ever invoked from here at call time, so the
// relative load order between the two files doesn't actually matter (same forward-reference
// reasoning used throughout this app), but this keeps the dependency direction readable.

const PLANNER_OP_TYPES = [
  'CREATE_TASK', 'UPDATE_TASK', 'MOVE_TASK', 'DELETE_TASK',
  'CREATE_SESSION', 'MOVE_SESSION', 'SET_DEADLINE', 'SET_DEPENDENCY',
  'GROUP_TASKS', 'CREATE_PROJECT', 'REQUEST_CLARIFICATION',
];

function emptyChangeSummary(){
  return { createdIds: [], updatedIds: [], movedIds: [], deletedIds: [] };
}

// Applies ONE operation. Returns {plannerState, summary, ok, error}. Never throws — an
// unknown id or malformed op comes back as ok:false with a human-readable error instead.
function applyOperation(plannerState, op, today){
  const workItems = [...(plannerState.workItems || [])];
  const workSessions = [...(plannerState.workSessions || [])];
  const projects = [...(plannerState.projects || [])];
  const summary = emptyChangeSummary();
  const next = (patch) => ({ plannerState: { ...plannerState, workItems, workSessions, projects, ...patch }, summary, ok: true });
  const fail = (error) => ({ plannerState, summary: emptyChangeSummary(), ok: false, error });

  switch(op.op){
    case 'CREATE_TASK': {
      const base = { ...(op.workItem || {}) };
      delete base.id;
      const rec = recommendPriority({ ...base, status: 'not_started' }, today, workItems);
      const item = newWorkItem({ ...base, priority: base.priority || rec.priority });
      workItems.push(item);
      summary.createdIds.push(item.id);
      return next({ workItems });
    }
    case 'UPDATE_TASK': {
      const idx = workItems.findIndex(wi => wi.id === op.workItemId);
      if(idx < 0) return fail('UPDATE_TASK: unknown workItemId ' + op.workItemId);
      workItems[idx] = { ...workItems[idx], ...(op.patch || {}), updatedAt: new Date().toISOString() };
      summary.updatedIds.push(op.workItemId);
      return next({ workItems });
    }
    case 'MOVE_TASK': {
      const idx = workItems.findIndex(wi => wi.id === op.workItemId);
      if(idx < 0) return fail('MOVE_TASK: unknown workItemId ' + op.workItemId);
      if(!PRIORITY_BUCKETS.includes(op.priority)) return fail('MOVE_TASK: invalid priority "' + op.priority + '"');
      workItems[idx] = { ...workItems[idx], priority: op.priority, updatedAt: new Date().toISOString() };
      summary.movedIds.push(op.workItemId);
      return next({ workItems });
    }
    case 'DELETE_TASK': {
      const idx = workItems.findIndex(wi => wi.id === op.workItemId);
      if(idx < 0) return fail('DELETE_TASK: unknown workItemId ' + op.workItemId);
      workItems[idx] = { ...workItems[idx], status: 'dropped', updatedAt: new Date().toISOString() };
      summary.deletedIds.push(op.workItemId);
      return next({ workItems });
    }
    case 'CREATE_SESSION': {
      const item = workItems.find(wi => wi.id === op.workItemId);
      if(!item) return fail('CREATE_SESSION: unknown workItemId ' + op.workItemId);
      const template = inferContextTemplate(item);
      const s = op.session || {};
      const session = newWorkSession({
        workItemId: item.id,
        title: s.title || item.title,
        plannedMinutes: s.plannedMinutes != null ? s.plannedMinutes : (item.estimatedMinutes || null),
        beforeSteps: (s.beforeSteps && s.beforeSteps.length) ? s.beforeSteps : template.beforeSteps,
        workSteps: s.workSteps || [],
        definitionOfDone: s.definitionOfDone || '',
        afterSteps: (s.afterSteps && s.afterSteps.length) ? s.afterSteps : template.afterSteps,
      });
      workSessions.push(session);
      summary.createdIds.push(session.id);
      return next({ workSessions });
    }
    case 'MOVE_SESSION': {
      const idx = workSessions.findIndex(ws => ws.id === op.sessionId);
      if(idx < 0) return fail('MOVE_SESSION: unknown sessionId ' + op.sessionId);
      workSessions[idx] = { ...workSessions[idx], scheduledStart: op.scheduledStart || null, scheduledEnd: op.scheduledEnd || null };
      summary.movedIds.push(op.sessionId);
      return next({ workSessions });
    }
    case 'SET_DEADLINE': {
      const idx = workItems.findIndex(wi => wi.id === op.workItemId);
      if(idx < 0) return fail('SET_DEADLINE: unknown workItemId ' + op.workItemId);
      workItems[idx] = { ...workItems[idx], deadline: op.deadline || null, updatedAt: new Date().toISOString() };
      summary.updatedIds.push(op.workItemId);
      return next({ workItems });
    }
    case 'SET_DEPENDENCY': {
      const idx = workItems.findIndex(wi => wi.id === op.workItemId);
      if(idx < 0) return fail('SET_DEPENDENCY: unknown workItemId ' + op.workItemId);
      if(!workItems.some(wi => wi.id === op.dependsOnId)) return fail('SET_DEPENDENCY: unknown dependsOnId ' + op.dependsOnId);
      const deps = workItems[idx].dependencies || [];
      workItems[idx] = { ...workItems[idx], dependencies: deps.includes(op.dependsOnId) ? deps : [...deps, op.dependsOnId], updatedAt: new Date().toISOString() };
      summary.updatedIds.push(op.workItemId);
      return next({ workItems });
    }
    case 'GROUP_TASKS':
    case 'CREATE_PROJECT': {
      const ids = op.workItemIds || [];
      const project = newProject({ title: op.projectTitle || op.title || 'Project', workItemIds: ids });
      projects.push(project);
      ids.forEach(id => {
        const idx = workItems.findIndex(wi => wi.id === id);
        if(idx >= 0){ workItems[idx] = { ...workItems[idx], projectId: project.id }; summary.updatedIds.push(id); }
      });
      summary.createdIds.push(project.id);
      return next({ workItems, projects });
    }
    case 'REQUEST_CLARIFICATION':
      return next({}); // no state change — handled by the caller as a question, not an operation
    default:
      return fail('Unknown operation: ' + op.op);
  }
}

// Applies a whole operations[] array in order, validating each one first. Returns the final
// state, an accumulated changeSummary (for the "show AI changes" animation), any clarifying
// questions pulled out of REQUEST_CLARIFICATION ops, and any errors from ops that were
// rejected (rejected ops are skipped, never partially applied).
function applyOperations(plannerState, operations, today){
  let state = plannerState;
  const summary = emptyChangeSummary();
  const errors = [];
  const clarifyingQuestions = [];

  (operations || []).forEach(op => {
    if(!op || !PLANNER_OP_TYPES.includes(op.op)){ errors.push('Skipped unrecognized operation'); return; }
    if(op.op === 'REQUEST_CLARIFICATION'){ if(op.question) clarifyingQuestions.push(op.question); return; }
    const validation = validateOperation(op, state, today);
    if(!validation.valid){ errors.push(...validation.errors); return; }
    const result = applyOperation(state, op, today);
    if(!result.ok){ errors.push(result.error); return; }
    state = result.plannerState;
    summary.createdIds.push(...result.summary.createdIds);
    summary.updatedIds.push(...result.summary.updatedIds);
    summary.movedIds.push(...result.summary.movedIds);
    summary.deletedIds.push(...result.summary.deletedIds);
  });

  return { nextPlannerState: state, summary, errors, clarifyingQuestions };
}
