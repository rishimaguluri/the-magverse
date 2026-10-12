// bainDiligenceEngine.js
// Pure logic for the "PE Diligence Case" mode — a second, candidate-led, faster case format
// inside Bain Capital Sprint -> Cases, alongside the existing "Investment Case" scorecard mode.
// No JSX here. Loaded after bainDiligenceContent.js, consultingCaseEngine.js (reuses
// parseCaseMeta/stripCaseMeta/resolveCaseReveal/initialRevealState directly), consultingQuantEngine.js
// (reuses checkQuantAnswer directly — ALL arithmetic grading here is deterministic code, never
// AI judgment), consultingExhibits.js (describeExhibitForPrompt), and consultingCompetencies.js
// (migrateConsultingDimension/PRIMARY_COMPETENCY_IDS, for the transferable-evidence bridge).
//
// What is copy-adapted rather than reused from consultingCaseEngine.js, and why: that file's
// nextManualState()/clampPhaseForward() close over the GLOBAL CASE_STATES constant, so they are
// not actually parameterized/reusable for a different state list — this file defines its own
// PE_CASE_STATES and the two small analogous helpers below. Everything else that IS generic
// (parseCaseMeta, stripCaseMeta, resolveCaseReveal, initialRevealState, checkQuantAnswer) is
// called directly, unmodified.

/* ---------- state arc (own, candidate-driven — "do not force every case into this order") ---------- */

const PE_CASE_STATES = ['opening', 'clarify', 'hypothesis', 'economics', 'valuation', 'valueCreation', 'exhibit', 'revisedValuation', 'recommendation', 'debrief', 'done'];
const PE_CASE_STATE_LABELS = {
  opening: 'Opening', clarify: 'Clarification', hypothesis: 'Hypothesis', economics: 'Business Economics',
  valuation: 'Valuation', valueCreation: 'Value Creation', exhibit: 'Exhibit Review', revisedValuation: 'Revised Valuation',
  recommendation: 'Recommendation', debrief: 'Debrief', done: 'Complete',
};

// Practice Mode's "Next Phase" button — same shape as Consulting's nextManualState, parameterized
// on PE_CASE_STATES instead of the global CASE_STATES.
function peNextManualState(current){
  const cur = PE_CASE_STATES.indexOf(current);
  if(cur < 0 || cur >= PE_CASE_STATES.length - 2) return current;
  return PE_CASE_STATES[cur + 1];
}
// Interview Mode's forward-only clamp against the AI's own [[META:]] phase signal.
function peClampPhaseForward(current, proposed){
  if(!proposed || !PE_CASE_STATES.includes(proposed)) return current;
  return PE_CASE_STATES.indexOf(proposed) > PE_CASE_STATES.indexOf(current) ? proposed : current;
}

/* ---------- attempt lifecycle ---------- */

function initPEDiligenceAttempt(caseContentId, mode){
  const cfg = getPEDiligenceCaseConfig(caseContentId);
  const init = initialRevealState(cfg);
  return {
    id: uid('pecase'), caseContentId, mode: mode || 'practice', status: 'in_progress', state: 'opening',
    sessionLog: [], revealedFactIds: init.factIds, revealedExhibitIds: init.exhibitIds,
    solvedQuantIds: [], quantResults: {}, userHypothesis: '', scratchpad: '',
    timer: { startedAt: Date.now(), pausedMs: 0, pausedAt: null, finishedAt: null },
    startedAt: Date.now(), finishedAt: null,
    dimensionScores: {}, dimensionNotes: {}, observedFailureModes: [], strengths: [], weaknesses: [],
    debriefInsight: '', topNextCaseFocus: '',
  };
}

/* ---------- prompt construction ---------- */

// Same marker mechanism as Consulting's CASE_META_INSTRUCTION, own text because the phase list
// differs. parseCaseMeta()/stripCaseMeta() (consultingCaseEngine.js) parse/strip this unmodified.
const PE_META_INSTRUCTION = `At the very end of EVERY reply, on its own line, append a machine-readable marker the candidate will never see (it is stripped before display): [[META:{"revealedFactIds":[...ids of any hidden facts you just revealed, if any],"revealedExhibitIds":[...ids of any exhibits you just revealed, if any],"phase":"<one of opening|clarify|hypothesis|economics|valuation|valueCreation|exhibit|revisedValuation|recommendation|debrief — your best judgment of the case's current phase after this reply>"}]]. Always include this marker, with empty arrays if nothing new was revealed.`;

function buildPEDiligencePrompt(caseContent, caseState, mode, revealed, userHypothesis){
  const { alreadyRevealedFacts, revealableFacts, offLimitsFacts, alreadyRevealedExhibits, revealableExhibits } = resolveCaseReveal(caseContent, revealed);

  const factLine = f => `- [${f.id}] ${f.fact}`;
  const exLine = ex => `- [${ex.id}] ${describeExhibitForPrompt(ex)}`;

  const revealedBlock = (alreadyRevealedFacts.length || alreadyRevealedExhibits.length)
    ? `ALREADY REVEALED TO THE CANDIDATE (you may restate these, verbatim, any time):\n${alreadyRevealedFacts.map(factLine).join('\n')}\n${alreadyRevealedExhibits.map(exLine).join('\n')}`.trim() : 'ALREADY REVEALED: none yet.';
  const revealableBlock = (revealableFacts.length || revealableExhibits.length)
    ? `REVEALABLE ON REQUEST (use ONLY these exact facts/numbers if the candidate asks for something matching one of these — never invent a number not listed here; if no threshold/number has been given for something, say so plainly rather than making one up):\n${revealableFacts.map(factLine).join('\n')}\n${revealableExhibits.map(exLine).join('\n')}`.trim() : 'REVEALABLE ON REQUEST: none remaining.';
  const offLimitsBlock = offLimitsFacts.length
    ? `NEVER REVEAL (you may acknowledge these topics exist but must say the specific detail isn't available — NEVER state the actual fact):\n${offLimitsFacts.map(f => `- [${f.id}] topic: ${f.category}`).join('\n')}` : '';
  const leversBlock = (caseContent.valueCreationLevers || []).length
    ? `VALUE-CREATION LEVER BANK (use ONLY to give a gentle hint if the candidate is stuck or asks what levers exist — never volunteer this list proactively, and never present a hint as a fact the candidate hasn't earned):\n${caseContent.valueCreationLevers.map(l => `- ${l.lever}: ${l.hint}`).join('\n')}` : '';

  const stateGuide = {
    opening: 'Introduce the case naturally — name the company, industry, and the central decision (would you invest, and at what price). Do not volunteer any hidden fact or exhibit yet beyond what is marked ALREADY REVEALED.',
    clarify: 'Answer clarifying questions concisely, using only the REVEALED/REVEALABLE lists above. If a specific number or threshold has not been given, say plainly that it has not been provided yet rather than inventing one.',
    hypothesis: 'Let the candidate state an initial view or structure before you give more data. Do not auto-advance once they finish structuring — ask an open question like "Where would you like to start?" and let THEM choose the next thread; you are not running a fixed script.',
    economics: 'Support the candidate while they build up the business economics (revenue, margin, EBITDA). If their calculation setup/logic is sound, say so explicitly even before they reach a final number — a correct SETUP deserves credit on its own, separate from whether the final arithmetic (graded elsewhere, deterministically) is exactly right.',
    valuation: 'Support the candidate while they translate economics into an implied valuation or deal value. Keep pushing for an explicit multiple or price, not just a qualitative "it seems expensive/cheap."',
    valueCreation: 'If the candidate names a value-creation lever without quantifying it, ask them to put a number on it — a lever that is only named, never sized, is not yet a real argument.',
    exhibit: 'If an exhibit is revealed, let the candidate interpret it. If they only narrate what the exhibit shows ("staffing is 52%, supplies is 18%...") without saying what it MEANS for the case, ask directly what they take away from it — narrating data is not the same as synthesizing it.',
    revisedValuation: 'Help the candidate connect value creation back to a revised view of value or return. This is the critical moment: if the candidate concludes "invest" the instant computed value exceeds the price, do not let that pass — push them toward returns thinking: what return does that imply, over what hold, financed how, and what would have to go wrong for it not to work? Do not accept "value > price" alone as a complete investment case.',
    recommendation: 'Ask for a clear, concrete recommendation: invest or not, at what price or condition, and what the single biggest risk is. If the candidate names a risk with no mitigation or diligence next step attached, ask directly what they would do about it. Push back if the recommendation is generic, is longer than it needs to be, or has no concrete next step.',
    debrief: 'The case is complete — this phase is handled separately, not in conversation.',
  };

  return `You are a thoughtful PE diligence interviewer running a candidate-led practice case. This practice format is modeled on a candidate-led PE diligence case style seen in external interview-prep material — it is NOT an official Bain Capital case, and you should never claim or imply that it is. You are conducting a "${caseContent.title}" case.

CRITICAL: Case facts and exhibits below are AUTHORITATIVE. You may paraphrase them, but you must NEVER invent a fact, number, or exhibit not explicitly listed below. If asked for something not in ALREADY REVEALED or REVEALABLE ON REQUEST, say plainly it isn't available rather than making it up.

CRITICAL: You are helpful, not adversarial, by default. The candidate drives the case — they choose what to explore next; you support, prompt, and occasionally push back, but you do not force a fixed sequence. If their direction is sound but their arithmetic stalls, give a hint toward the right setup rather than just saying "no."

CRITICAL: Arithmetic/numeric answers in this case are graded by deterministic code, not by you — when a numeric "Quant Check" result appears in the conversation, it is already final; do not re-judge whether the number was right, only engage with the reasoning and communication around it.

Case: "${caseContent.prompt}"
${userHypothesis ? `\nCandidate's stated initial hypothesis: "${userHypothesis}"` : ''}

${revealedBlock}

${revealableBlock}
${offLimitsBlock ? '\n' + offLimitsBlock : ''}
${leversBlock ? '\n' + leversBlock : ''}

Current phase (your best estimate, not a fixed script): ${PE_CASE_STATE_LABELS[caseState] || caseState}. Your role now: ${stateGuide[caseState] || 'Continue the case naturally, following the candidate\'s lead.'}

Keep responses concise (2-4 sentences typically). Give information only when directly or clearly asked — never volunteer beyond ALREADY REVEALED.

${mode === 'interview' ? 'You are running this in a realistic interview simulation — do not show phase labels, hints, or scores; the candidate sees only your dialogue, the exhibits, and their own scratchpad.' : 'You are running this in a practice/coaching context — phase labels and an optional "Next Phase" control are visible to the candidate; your phase judgment is advisory.'}

${PE_META_INSTRUCTION}`;
}

/* ---------- failure-mode taxonomy (judgment-detected at debrief, never regex) ---------- */

const PE_FAILURE_MODES = {
  'no-initial-hypothesis': 'Jumped into data-gathering without ever stating an initial view or hypothesis.',
  'generic-structure': 'Structure named broad categories without a concrete, case-specific path to a decision.',
  'weak-case-drive': 'Waited for the interviewer to supply direction instead of driving toward the next useful thread.',
  'math-without-setup': 'Gave or attempted a number without first stating how it was being calculated.',
  'correct-math-no-so-what': 'Arithmetic was correct but the candidate never explained what the number means for the decision.',
  'exhibit-narration': 'Described what an exhibit shows without synthesizing what it implies.',
  'misread-exhibit-base': 'Misread the exhibit\'s base, units, or scale when citing it.',
  'over-calculation': 'Kept calculating well past the point where the answer was already clear enough to act on.',
  'value-creation-without-quantification': 'Named a value-creation lever without ever putting a number on it.',
  'valuation-without-returns-thinking': 'Concluded "invest" as soon as computed value exceeded price, without checking the implied return, hold period, or downside.',
  'risk-without-mitigation': 'Named a real risk but never proposed a mitigation or a diligence step to resolve it.',
  'no-concrete-next-step': 'Landed on a recommendation with no concrete next action attached.',
  'recommendation-too-long': 'Recommendation was long and hedged rather than a clear, concise call.',
};
const PE_FAILURE_MODE_IDS = Object.keys(PE_FAILURE_MODES);

// Light cross-link from a failure mode to an already-authored Bain Sprint Learn module (the 8
// modules in bainSprintContent.js's learnModules[]) — reused as-is, no new content needed.
const PE_FAILURE_MODE_TO_LEARN_MODULE = {
  'no-initial-hypothesis': 'inv-01', 'generic-structure': 'inv-02', 'weak-case-drive': 'inv-01',
  'math-without-setup': 'inv-04', 'correct-math-no-so-what': 'inv-04', 'exhibit-narration': 'inv-02',
  'misread-exhibit-base': 'inv-02', 'over-calculation': 'inv-04', 'value-creation-without-quantification': 'inv-05',
  'valuation-without-returns-thinking': 'inv-08', 'risk-without-mitigation': 'inv-06', 'no-concrete-next-step': 'inv-07',
  'recommendation-too-long': 'inv-01',
};

/* ---------- evidence scoping — "never score what wasn't tested," reusing both taxonomies ---------- */

// Structural (not content-specific) map from a PE case phase to the ONE Consulting competency
// that phase mechanically exercises — satisfies "map transferable evidence into Consulting's own
// named competencies" without inventing a second parallel taxonomy; every id here is a real
// PRIMARY_COMPETENCIES id (consultingCompetencies.js).
const PE_PHASE_TO_CONSULTING_COMPETENCY = {
  hypothesis: 'structuring', economics: 'quantitativeReasoning', valuation: 'quantitativeReasoning',
  exhibit: 'exhibitInterpretation', valueCreation: 'synthesis', revisedValuation: 'quantitativeReasoning',
  recommendation: 'recommendation',
};

// Mirrors consultingCaseEngine.js's caseEvidencedCompetencies() "never score what wasn't tested"
// discipline, scoped to THIS case's own gradingEvidence, across BOTH taxonomies at once.
function peDiligenceEvidencedDimensions(caseContent){
  const ge = caseContent.gradingEvidence || {};
  const bainDims = new Set(['investmentCommunication']);
  const consultingComps = new Set(['caseManagement']);
  Object.entries(ge).forEach(([phase, ids]) => {
    (ids || []).forEach(id => bainDims.add(id));
    if(PE_PHASE_TO_CONSULTING_COMPETENCY[phase]) consultingComps.add(PE_PHASE_TO_CONSULTING_COMPETENCY[phase]);
  });
  return { bainDims: [...bainDims], consultingComps: [...consultingComps] };
}

function buildPEDebriefPrompt(caseContent){
  const { bainDims } = peDiligenceEvidencedDimensions(caseContent);
  const dimList = bainDims.map(id => `"${id}":0`).join(',');
  return `You are a PE case coach. This case only genuinely tests these dimensions: ${bainDims.join(', ')} — score ONLY these, 1-10, based on the transcript. Do NOT include any dimension not in this list. Use EXACTLY these ids (camelCase).

Any line in the transcript marked "[DETERMINISTIC CHECK]" was already graded by code — never re-judge whether that number was right; only use it as context for the surrounding reasoning and communication.

For each scored dimension, give a one-sentence OBSERVED note (what the candidate actually did) and one concrete NEXT REP suggestion. Also review the transcript for any of these specific failure patterns and list the ids of any you actually observed (do not guess — only list ones with clear evidence in the transcript): ${PE_FAILURE_MODE_IDS.join(', ')}.

Return JSON: {"dimensionScores":{${dimList}},"dimensionNotes":{${bainDims.map(id => `"${id}":{"observed":"","good":"","improve":"","nextRep":""}`).join(',')}},"observedFailureModes":["id1"],"strengths":["strength 1"],"weaknesses":["specific weakness 1"],"insight":"1 sentence overall summary","topNextCaseFocus":"one specific behavior to focus on next case"}`;
}

/* ---------- light recommendation (mirrors getRecommendedNextCase's style, own data source) ---------- */

function getNextPEDiligenceCase(bainSprint){
  const attempted = new Set((bainSprint.diligenceCases || []).map(c => c.caseContentId));
  const next = PE_DILIGENCE_CASES.find(c => !attempted.has(c.id));
  return next || PE_DILIGENCE_CASES[0];
}
