// plannerAI.js
// The one AI entrypoint for every planner conversation turn. Pass B rewrite: the model now
// returns structured OPERATIONS (CREATE_TASK/UPDATE_TASK/MOVE_TASK/DELETE_TASK/CREATE_SESSION/
// MOVE_SESSION/SET_DEADLINE/SET_DEPENDENCY/GROUP_TASKS/CREATE_PROJECT/REQUEST_CLARIFICATION)
// instead of whole re-proposed WorkItems — a single correction ("Stats is Monday, not
// tomorrow") now patches exactly one field via UPDATE_TASK instead of regenerating everything.
// plannerOperations.js applies these; this file only interprets language and builds the
// prompt. Still mirrors the existing voice-to-calendar precedent (parseTranscriptLLM, App.jsx):
// JSON-mode, explicit schema, "Return ONLY valid JSON", existing data given as context, and a
// graceful heuristic fallback when there's no API key. JSON-mode is never combined with
// streaming, consistent with every other JSON-mode call site in this app.
//
// Structured operations are the ONLY thing allowed to mutate planner state (Part 54/
// "Structured AI output") — companionMessage is pure display prose, never parsed back into data.

function buildCalendarContextLines(events, dateStr){
  return (events || [])
    .filter(ev => eventOccursOnDate(ev, dateStr))
    .map(ev => {
      const fmt = h => { const wh = Math.floor(h), m = Math.round((h - wh) * 60); return String(wh).padStart(2, '0') + ':' + String(m).padStart(2, '0'); };
      return fmt(ev.when.hour || 0) + '-' + fmt(ev.when.endHour != null ? ev.when.endHour : (ev.when.hour || 0) + 1) + ' ' + (ev.title || 'Event');
    });
}

function buildPlannerSystemPrompt(plannerState, calendarLines, phase){
  const today = todayStr();
  const existingItemsCtx = (plannerState.workItems || [])
    .filter(i => i.status !== 'dropped' && i.status !== 'done')
    .map(i => '- [' + i.id + '] "' + i.title + '" (priority:' + i.priority +
      (i.deadline ? ', deadline:' + i.deadline : '') +
      (i.estimatedMinutes ? ', ~' + i.estimatedMinutes + 'min' : '') + ')')
    .join('\n') || '(none yet)';
  const calendarCtx = (calendarLines || []).join('\n') || '(none)';

  return 'You are the planning intelligence behind "' + PLANNER_FEATURE_NAME + '" inside Magverse — a conversational ' +
    'work-planning companion living in a visual workbench, not a to-do list or a chatbot that spits out a schedule. ' +
    'Today is ' + today + '.\n\n' +
    'Your job: read what the user says and emit a list of small, precise OPERATIONS that change planner state. You ' +
    'never invent a schedule yourself — free time, overlaps, and overcommitment are computed by deterministic code, ' +
    'not you. You never rewrite the whole plan: a correction to one thing is ONE operation on that one thing, never ' +
    'a full re-proposal of everything.\n\n' +
    'AVAILABLE OPERATIONS:\n' +
    '- CREATE_TASK {workItem:{title,outcome,deadline,estimatedMinutes,estimateConfidence,priority,schedulingFlexibility,context}}\n' +
    '- UPDATE_TASK {workItemId, patch:{...any WorkItem fields}}\n' +
    '- MOVE_TASK {workItemId, priority: "now"|"next"|"later"|"someday"|"waiting"}\n' +
    '- DELETE_TASK {workItemId}  (the user no longer wants/needs this)\n' +
    '- CREATE_SESSION {workItemId, session:{title,plannedMinutes,beforeSteps,workSteps,definitionOfDone,afterSteps}} ' +
    '(for any work item representing meaningful focused work, not a 2-minute errand)\n' +
    '- MOVE_SESSION {sessionId, scheduledStart, scheduledEnd}  (ISO datetimes, or omit to unschedule)\n' +
    '- SET_DEADLINE {workItemId, deadline}  (YYYY-MM-DD or null)\n' +
    '- SET_DEPENDENCY {workItemId, dependsOnId}\n' +
    '- GROUP_TASKS {workItemIds:[...], projectTitle}  (when several items belong to one outcome)\n' +
    '- REQUEST_CLARIFICATION {question}  (only when it would materially change the plan)\n\n' +
    'RULES:\n' +
    '1. Extract every distinct obligation as its own CREATE_TASK. Do not merge unrelated obligations into one.\n' +
    '2. Convert vague activities into a concrete OUTCOME. "work on X" is not an acceptable title — propose what DONE ' +
    'would actually look like (e.g. "Redesign Strategy lesson reader and test one lesson", not "work on Magverse").\n' +
    '3. If an existing work item below already covers what the user is describing, emit UPDATE_TASK/MOVE_TASK/' +
    'SET_DEADLINE on its id instead of CREATE_TASK — never duplicate.\n' +
    '4. Mark estimateConfidence "known" only if the user stated a duration explicitly, "likely" for a reasonable ' +
    'inference, "unknown" if you are genuinely guessing.\n' +
    '5. Only use REQUEST_CLARIFICATION when it would materially change the plan (unclear deadline, large duration ' +
    'uncertainty, a genuinely ambiguous outcome, a hard calendar constraint). Batch multiple uncertainties into one ' +
    'question. At most 2 per turn. Never ask about things you can reasonably infer.\n' +
    '6. companionMessage is short (1-4 sentences), direct, warm, a little playful, never guilt-inducing, willing to ' +
    'name a real tradeoff or disagree plainly when the user is overcommitting. Never use exclamation-heavy or ' +
    'childish language ("Woohoo!", "+50 XP!") — this is a calm co-pilot, not a mascot.\n' +
    '7. Current phase: ' + phase + '.\n\n' +
    'Existing open work items:\n' + existingItemsCtx + '\n\n' +
    "Today's calendar (fixed commitments — never schedule a session over these):\n" + calendarCtx + '\n\n' +
    'Return ONLY valid JSON, no other text, in exactly this shape:\n' +
    '{"operations":[{"op":"CREATE_TASK","workItem":{"title":"","outcome":"","deadline":null,"estimatedMinutes":null,' +
    '"estimateConfidence":"unknown","priority":"later","schedulingFlexibility":"flexible"}}],' +
    '"companionMessage":"","suggestedCompanionState":"idle"}\n' +
    '(Mix operation types freely in one array; use UPDATE_TASK/MOVE_TASK/SET_DEADLINE/DELETE_TASK/CREATE_SESSION/ ' +
    'MOVE_SESSION/SET_DEPENDENCY/GROUP_TASKS/REQUEST_CLARIFICATION as needed, each with its own fields as listed above.)';
}

function normalizePlannerAIResponse(parsed){
  return {
    operations: Array.isArray(parsed.operations) ? parsed.operations : [],
    companionMessage: typeof parsed.companionMessage === 'string' ? parsed.companionMessage : '',
    suggestedCompanionState: COMPANION_STATES.includes(parsed.suggestedCompanionState) ? parsed.suggestedCompanionState : 'idle',
  };
}

// Naive clause-split fallback when there's no API key — mirrors heuristicParse's role for
// voice-to-calendar: never silently fail, just degrade to something rougher. Emits one
// CREATE_TASK per clause (the simplest valid operation list).
function heuristicInterpretPlannerMessage(message){
  const clauses = (message || '')
    .split(/[.;\n]|,\s*(?:and\s+)?/i)
    .map(s => s.trim())
    .filter(s => s.length > 3);
  const operations = clauses.slice(0, 8).map(c => ({
    op: 'CREATE_TASK',
    workItem: {
      title: c.length > 70 ? c.slice(0, 70) + '…' : c,
      outcome: c,
      deadline: null,
      estimatedMinutes: null,
      estimateConfidence: 'unknown',
      priority: 'later',
      schedulingFlexibility: 'flexible',
    },
  }));
  return {
    operations,
    companionMessage: operations.length
      ? 'No API key set, so I can only split this into rough pieces — add your OpenAI key in Settings for real understanding, durations, and a realistic plan.'
      : "I couldn't pull anything structured out of that — try describing one or two things you need to get done.",
    suggestedCompanionState: 'idle',
  };
}

async function interpretPlannerMessage(apiKey, message, plannerState, events, phase){
  if(!apiKey){
    return heuristicInterpretPlannerMessage(message);
  }
  const today = todayStr();
  const calendarLines = buildCalendarContextLines(events, today);
  const system = buildPlannerSystemPrompt(plannerState, calendarLines, phase);
  const history = (plannerState.conversation || []).slice(-8).map(m => ({ role: m.role === 'companion' ? 'assistant' : 'user', content: m.text }));

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      max_tokens: 1800,
      temperature: 0.3,
      messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: message }],
    }),
  });
  if(!resp.ok){
    const j = await resp.json().catch(() => ({}));
    throw new Error(j.error?.message || 'API error ' + resp.status);
  }
  const j = await resp.json();
  const parsed = JSON.parse(j.choices[0].message.content);
  return normalizePlannerAIResponse(parsed);
}
