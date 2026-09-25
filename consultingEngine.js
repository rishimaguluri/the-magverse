// consultingEngine.js
// Pure logic for the Consulting Learn rebuild: module-state derivation, spaced-retrieval
// scheduling, linkage tables (Learn <-> Drill <-> Case), the next-module recommender, and the
// deterministic quant-exercise checker. Plain classic script, loaded after consultingContent/*
// and before consultingLearnPanel.jsx/App.jsx — shares one global scope with all of them.
//
// Reuses todayStr()/addDaysStr()/daysBetweenStr() from strategyEngine.js (loaded earlier in
// index.html) rather than redefining them — same date-math helpers, one source of truth.

/* ---------- module state model ---------- */

const MODULE_STATES = ['NOT_STARTED','LEARNED','PRACTICED','RETRIEVED','STRONG'];

// Derived (never hand-set) from the full progress history, so it's monotonic by construction —
// once an array contains a success, no later failed attempt can remove it, so state can only
// move forward as evidence accumulates. One sentence, explainable, no black box:
// LEARNED once opened -> PRACTICED once an exercise is answered correctly -> RETRIEVED once a
// later spaced-retrieval check succeeds -> STRONG once there are 4+ total successes including
// at least one retrieval (i.e. it has held up more than once, in more than one context).
function deriveModuleState(progress){
  if(!progress || !progress.learnedAt) return 'NOT_STARTED';
  const attempts = progress.exerciseAttempts||[];
  const retrievals = progress.retrievalChecks||[];
  const successfulAttempts = attempts.filter(a=>a.correct).length;
  const successfulRetrievals = retrievals.filter(r=>r.correct).length;
  const totalSuccesses = successfulAttempts + successfulRetrievals;
  if(successfulRetrievals>=1 && totalSuccesses>=4) return 'STRONG';
  if(successfulRetrievals>=1) return 'RETRIEVED';
  if(successfulAttempts>=1) return 'PRACTICED';
  return 'LEARNED';
}

// Same expanding/contracting spaced-interval scheme as Strategy's scheduleAfterEvidence —
// success ~1.8x's the gap, a miss halves it.
function scheduleModuleRetrieval(progress, wasCorrect, today){
  const prevInterval = (progress&&progress.retrievalIntervalDays) || 2;
  const nextInterval = wasCorrect ? Math.max(1, Math.round(prevInterval*1.8)) : Math.max(1, Math.round(prevInterval*0.5));
  return { retrievalIntervalDays: nextInterval, nextRetrievalDate: addDaysStr(today, nextInterval) };
}
function moduleRetrievalPriority(progress, today){
  if(!progress || !progress.learnedAt) return 0;
  if(!progress.nextRetrievalDate) return 0.3; // learned but never scheduled yet (no exercise attempt logged)
  const daysOverdue = daysBetweenStr(progress.nextRetrievalDate, today);
  if(daysOverdue < 0) return 0;
  return Math.min(1, 0.4 + daysOverdue*0.1);
}

/* ---------- linkage tables, derived from the authored modules themselves ---------- */

const MODULE_TO_DRILL = Object.fromEntries(CONSULTING_MODULES.filter(m=>m.nextDrillId).map(m=>[m.id, m.nextDrillId]));
const MODULE_TO_CASE = Object.fromEntries(CONSULTING_MODULES.filter(m=>m.relatedCaseIds&&m.relatedCaseIds.length).map(m=>[m.id, m.relatedCaseIds]));

function moduleCompetencyLabel(module){
  return PRIMARY_COMPETENCY_LABELS[module.primaryCompetency] || FIT_COMPETENCY_LABELS[module.primaryCompetency] || module.primaryCompetency;
}
function prereqsSatisfied(module, learnProgress){
  return (module.prerequisites||[]).every(pid => deriveModuleState(learnProgress[pid]) !== 'NOT_STARTED');
}

/* ---------- next-module recommender ---------- */

// Priority: (1) an unstarted module whose primary competency has an OPEN error-log weakness,
// (2) any other unstarted module (in curriculum/track order), (3) a module due for spaced
// retrieval, (4) any remaining not-yet-STRONG module. Every branch is a named, explainable rule.
function getNextLearnModule(learnProgress, openErrorDimensions){
  const lp = learnProgress||{};
  const openSet = new Set((openErrorDimensions||[]).map(migrateConsultingDimension));
  const eligible = CONSULTING_MODULES.filter(m => deriveModuleState(lp[m.id])!=='STRONG' && prereqsSatisfied(m, lp));
  if(!eligible.length) return null;

  const notStarted = eligible.filter(m=>deriveModuleState(lp[m.id])==='NOT_STARTED');
  const weakMatch = notStarted.find(m=>openSet.has(m.primaryCompetency));
  if(weakMatch) return weakMatch;
  if(notStarted.length) return notStarted[0];

  const today = todayStr();
  const due = eligible
    .map(m=>({m, priority:moduleRetrievalPriority(lp[m.id], today)}))
    .filter(x=>x.priority>0.4)
    .sort((a,b)=>b.priority-a.priority);
  if(due.length) return due[0].m;

  return eligible[0];
}

// Used by the Phase-4 deep-link chips (Drills/Review/Cases debrief) — "Learn X" for a specific
// weak competency, rather than the general next-module recommendation above.
function findModuleForCompetency(competencyId, learnProgress){
  const lp = learnProgress||{};
  const id = migrateConsultingDimension(competencyId);
  const candidates = CONSULTING_MODULES.filter(m=>m.primaryCompetency===id && deriveModuleState(lp[m.id])!=='STRONG' && prereqsSatisfied(m, lp));
  if(!candidates.length) return null;
  return candidates.find(m=>deriveModuleState(lp[m.id])==='NOT_STARTED') || candidates[0];
}

function searchConsultingModules(query){
  const q=(query||'').trim().toLowerCase();
  if(!q) return [];
  return CONSULTING_MODULES.filter(m =>
    m.title.toLowerCase().includes(q) ||
    (m.concepts||[]).some(c=>c.toLowerCase().includes(q)) ||
    moduleCompetencyLabel(m).toLowerCase().includes(q)
  );
}

// checkQuantAnswer moved to consultingQuantEngine.js in Pass 2 (generalized beyond Learn to
// Drills/Cases quant moments) — loaded before this file, resolves as a normal global here.

// Named AI builder for the (minority of) open-ended, non-numeric module exercises — mirrors
// buildDrillEvalSystem/buildCaseSystemPrompt's naming convention.
function buildModuleExerciseEvalSystem(module){
  return `You are a case coach grading a short written exercise for the Learn module "${module.title}" (competency: ${moduleCompetencyLabel(module)}). The reusable rule being tested: "${module.reusableRule}". Score the user's answer 1-10 on how well it demonstrates that rule in THIS specific exercise, referencing the model answer as a guide (not a required exact match): "${module.exercise?.modelAnswer||''}". Give 1-2 sentences of specific, honest feedback. Return JSON: {"score":0,"feedback":"...","correct":true}. Set "correct" to true only if score>=7.`;
}
