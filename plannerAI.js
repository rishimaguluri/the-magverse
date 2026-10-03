// plannerAI.js
// The one AI entrypoint for every planner conversation turn — brain dump, clarification
// answer, tradeoff discussion, natural-language edit, replan request, or "what should I do
// now". Mirrors the existing voice-to-calendar precedent (parseTranscriptLLM, App.jsx) exactly:
// JSON-mode, explicit schema, "Return ONLY valid JSON", existing data given as context, and a
// graceful heuristic fallback when there's no API key. JSON-mode is never combined with
// streaming here, consistent with every other JSON-mode call site in this app.
//
// Structured fields are the ONLY thing allowed to mutate planner state (Part 54) —
// companionMessage is pure display prose, never parsed back into data.

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
    'work-planning companion, not a to-do list or a chatbot that spits out a schedule. Today is ' + today + '.\n\n' +
    'Your job: read what the user says and extract/update STRUCTURED work data. You never invent a schedule yourself — ' +
    'free time, overlaps, and overcommitment are computed by deterministic code, not you. You only propose items, ' +
    'sessions, durations, priorities, and questions.\n\n' +
    'RULES:\n' +
    '1. Extract every distinct obligation as its own work item. Do not merge unrelated obligations into one.\n' +
    '2. Convert vague activities into a concrete OUTCOME. "work on X" is not an acceptable title — propose what DONE ' +
    'would actually look like (e.g. "Redesign Strategy lesson reader and test one lesson", not "work on Magverse").\n' +
    '3. For any work item representing meaningful focused work (not a 2-minute errand), propose 1+ sessions, each ' +
    'with beforeSteps, workSteps, definitionOfDone, and afterSteps — concrete, never generic.\n' +
    '4. Mark estimateConfidence "known" only if the user stated a duration explicitly, "likely" for a reasonable ' +
    'inference, "unknown" if you are genuinely guessing.\n' +
    '5. Only ask a clarifying question when it would materially change the plan (unclear deadline, large duration ' +
    'uncertainty, a genuinely ambiguous outcome, a hard calendar constraint). Never ask about things you can ' +
    'reasonably infer, and never ask one question per field — batch multiple uncertainties into one question. ' +
    'At most 2 questions per turn.\n' +
    '6. If an existing work item below already covers what the user is describing, reuse its id (so it gets updated, ' +
    'not duplicated) and list that id in updatedWorkItemIds.\n' +
    '7. companionMessage is short (1-4 sentences), direct, warm, a little playful, never guilt-inducing, and willing ' +
    'to name a real tradeoff or disagree plainly when the user is overcommitting.\n' +
    '8. Current phase: ' + phase + '.\n\n' +
    'Existing open work items:\n' + existingItemsCtx + '\n\n' +
    "Today's calendar (fixed commitments — never schedule over these):\n" + calendarCtx + '\n\n' +
    'Return ONLY valid JSON, no other text, in exactly this shape:\n' +
    '{"proposedWorkItems":[{"id":null,"title":"","outcome":"","deadline":null,"estimatedMinutes":null,' +
    '"estimateConfidence":"unknown","priority":"later","schedulingFlexibility":"flexible","dependencies":[],' +
    '"sessions":[{"title":"","plannedMinutes":null,"beforeSteps":[],"workSteps":[],"definitionOfDone":"","afterSteps":[]}]}],' +
    '"updatedWorkItemIds":[],"clarifyingQuestions":[],"companionMessage":"","suggestedCompanionState":"idle"}\n' +
    '("id":null means create new; pass an existing item\'s id string to update it instead.)';
}

function normalizePlannerAIResponse(parsed){
  return {
    proposedWorkItems: Array.isArray(parsed.proposedWorkItems) ? parsed.proposedWorkItems : [],
    clarifyingQuestions: Array.isArray(parsed.clarifyingQuestions) ? parsed.clarifyingQuestions : [],
    companionMessage: typeof parsed.companionMessage === 'string' ? parsed.companionMessage : '',
    suggestedCompanionState: COMPANION_STATES.includes(parsed.suggestedCompanionState) ? parsed.suggestedCompanionState : 'idle',
  };
}

// Naive clause-split fallback when there's no API key — mirrors heuristicParse's role for
// voice-to-calendar: never silently fail, just degrade to something rougher.
function heuristicInterpretPlannerMessage(message){
  const clauses = (message || '')
    .split(/[.;\n]|,\s*(?:and\s+)?/i)
    .map(s => s.trim())
    .filter(s => s.length > 3);
  const proposedWorkItems = clauses.slice(0, 8).map(c => ({
    id: null,
    title: c.length > 70 ? c.slice(0, 70) + '…' : c,
    outcome: c,
    deadline: null,
    estimatedMinutes: null,
    estimateConfidence: 'unknown',
    priority: 'later',
    schedulingFlexibility: 'flexible',
    dependencies: [],
    sessions: [],
  }));
  return {
    proposedWorkItems,
    clarifyingQuestions: [],
    companionMessage: proposedWorkItems.length
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
