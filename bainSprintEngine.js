// bainSprintEngine.js
// Pure logic for the Bain Capital Sprint: the paper-LBO math (deterministic — AI never grades
// arithmetic), the competency/evidence model, the adaptive "Today" recommender, error
// detection, and archive-date logic. No JSX here. Loaded after bainSprintContent.js, before
// bainSprintPanel.jsx.
//
// Reuses todayStr()/addDaysStr()/daysBetweenStr()/scheduleAfterEvidence()/deriveMasteryStatus()
// from strategyEngine.js (loaded earlier in index.html) rather than redefining them — those are
// already fully generic (operate on whatever evidence-array/object shape is passed in, zero
// STRATEGY_CONTENT coupling), same convention consultingEngine.js already established.

/* ---------- sprint lifecycle ---------- */

const BAIN_SPRINT_TARGET_DATE = '2026-11-20';

function emptyBainSprint(strategy){
  return {
    status: 'active', // 'active'|'completed'
    archivedAt: null,
    startedAt: null,
    capabilities: {}, // {[capId]: {evidence:[], status}}
    dealMastery: {}, // {[dealId]: {dealId, studiedAt, lastPracticed, timesPracticed, evidence, nextReviewDate, reviewIntervalDays}}
    moduleProgress: {}, // {[moduleId]: {completedAt, reflection}}
    lboAttempts: [], // [{id, problemId, inputs, result, ts}]
    cases: [], // same attempt shape as Strategy's case attempts (timer/scorecard/reflection)
    ic60Attempts: [], // [{id, ts, scenarioId, response, selfRating:{answerFirst,thesis,economics,downside,concision}}]
    errorLog: [],
    ...((strategy && strategy.bainSprint) || {}),
  };
}

function isSprintActive(bainSprint, today){
  if(bainSprint.status === 'completed') return false;
  return today <= BAIN_SPRINT_TARGET_DATE;
}

// Pure status flip — never deletes anything. Call once on mount; harmless to call repeatedly.
function maybeArchiveSprint(bainSprint, today){
  if(bainSprint.status !== 'completed' && today > BAIN_SPRINT_TARGET_DATE){
    return { ...bainSprint, status: 'completed', archivedAt: new Date().toISOString() };
  }
  return bainSprint;
}

function daysUntilSprintTarget(today){
  return daysBetweenStr(today, BAIN_SPRINT_TARGET_DATE);
}

/* ---------- competency model (10 Sprint + 3 Fit — Fit modeled now, no Fit drill ships yet) ---------- */

const BAIN_CAPABILITY_LABELS = {
  marketAttractiveness: 'Market Attractiveness', businessQuality: 'Business Quality', competitiveAdvantage: 'Competitive Advantage',
  investmentThesis: 'Investment Thesis', valueCreation: 'Value Creation', returnsReasoning: 'Financial / Returns Reasoning',
  downsideRisk: 'Downside & Risk', diligence: 'Diligence', investmentJudgment: 'Investment Judgment', investmentCommunication: 'Investment Communication',
  whyBain: 'Why Bain Capital', whyInvesting: 'Why Investing / PE', behavioral: 'Behavioral Communication',
};
const BAIN_CAPABILITY_IDS = Object.keys(BAIN_CAPABILITY_LABELS);
// The 6 shown on Sprint Home's compact "Current Development" (Part "Sprint Home") — the rest
// are still tracked, just not all crammed onto the home screen.
const BAIN_HOME_CAPABILITY_IDS = ['investmentThesis', 'businessQuality', 'returnsReasoning', 'downsideRisk', 'diligence', 'investmentCommunication'];

const BAIN_SCORECARD_DIMENSIONS = [
  { id: 'marketAttractiveness', label: 'Market Attractiveness' },
  { id: 'businessQuality', label: 'Business Quality' },
  { id: 'competitiveAdvantage', label: 'Competitive Advantage' },
  { id: 'investmentThesis', label: 'Investment Thesis' },
  { id: 'valueCreation', label: 'Value Creation' },
  { id: 'returnsReasoning', label: 'Financial / Returns Reasoning' },
  { id: 'downsideRisk', label: 'Downside & Risk' },
  { id: 'diligence', label: 'Diligence' },
  { id: 'investmentJudgment', label: 'Investment Judgment' },
  { id: 'investmentCommunication', label: 'Investment Communication' },
];

// Dimension ids are 1:1 with capability ids by design (no separate mapping table needed).
function evidenceFromBainCaseScorecard(attempt){
  const out = {};
  Object.entries(attempt.scorecard?.dimensions || {}).forEach(([dimId, d]) => {
    if(!d.score) return;
    out[dimId] = [{ ts: new Date().toISOString(), score: d.score, source: 'bain-case', sourceId: attempt.id }];
  });
  return out;
}

// Which Bain dimensions also credit the main Strategy capability model (Part "Consulting
// Transfer" / "Data Separation") — a deliberate, narrow subset, not a 1:1 mirror.
const BAIN_TO_STRATEGY_CAPABILITY = {
  investmentThesis: 'diagnosis', businessQuality: 'businessIntuition', returnsReasoning: 'quantitativeReasoning',
  investmentJudgment: 'decisionQuality', investmentCommunication: 'communication',
};
function evidenceForStrategyTransfer(attempt){
  const bainEv = evidenceFromBainCaseScorecard(attempt);
  const out = {};
  Object.entries(BAIN_TO_STRATEGY_CAPABILITY).forEach(([bainDim, stratCap]) => {
    if(bainEv[bainDim]) out[stratCap] = bainEv[bainDim];
  });
  return out;
}

/* ---------- deal mastery (spaced retrieval — reuses strategyEngine.js's generic scheduler) ---------- */

function initDealMasteryEntry(dealId, today){
  return { dealId, studiedAt: today, lastPracticed: null, timesPracticed: 0, evidence: [], nextReviewDate: addDaysStr(today, 2), reviewIntervalDays: 2 };
}

/* ---------- paper LBO engine (deterministic — Part "Deterministic math") ---------- */

// Level 1: no growth, no paydown (set ebitdaGrowthPct=0, paydownPct=0). Level 2: adds both.
// Returns a returns-bridge decomposition that is an EXACT identity (verified by a test):
// equityInvested + ebitdaGrowthContribution + multipleChangeContribution + deleveragingContribution === exitEquity
function computeLBO(inputs){
  const { revenue, ebitdaMargin, entryMultiple, debtPct, ebitdaGrowthPct = 0, years = 1, exitMultiple, paydownPct = 0 } = inputs;
  const entryEBITDA = revenue * ebitdaMargin;
  const purchasePrice = entryEBITDA * entryMultiple;
  const debt = purchasePrice * debtPct;
  const equityInvested = purchasePrice - debt;
  const exitEBITDA = entryEBITDA * Math.pow(1 + ebitdaGrowthPct, years);
  const exitEV = exitEBITDA * exitMultiple;
  const remainingDebt = debt * (1 - paydownPct);
  const exitEquity = exitEV - remainingDebt;
  const moic = equityInvested > 0 ? exitEquity / equityInvested : null;
  const irr = (moic != null && moic > 0 && years > 0) ? Math.pow(moic, 1 / years) - 1 : null;

  const ebitdaGrowthContribution = (exitEBITDA - entryEBITDA) * entryMultiple;
  const multipleChangeContribution = exitEBITDA * (exitMultiple - entryMultiple);
  const deleveragingContribution = debt - remainingDebt;

  return {
    entryEBITDA, purchasePrice, debt, equityInvested,
    exitEBITDA, exitEV, remainingDebt, exitEquity, moic, irr,
    returnsBridge: { ebitdaGrowthContribution, multipleChangeContribution, deleveragingContribution },
  };
}

// Deterministic "what drove the return" explanation (Part "Ask: what drove the return?") — the
// AI is never asked to judge the arithmetic, only this code is.
function interpretLBOResult(result){
  const { ebitdaGrowthContribution: g, multipleChangeContribution: m, deleveragingContribution: d } = result.returnsBridge;
  const total = Math.abs(g) + Math.abs(m) + Math.abs(d);
  if(total === 0) return 'No value was created or destroyed beyond the entry structure.';
  const shares = [
    { label: 'EBITDA growth', value: g, share: Math.abs(g) / total },
    { label: 'multiple change', value: m, share: Math.abs(m) / total },
    { label: 'deleveraging', value: d, share: Math.abs(d) / total },
  ].sort((a, b) => b.share - a.share);
  const dominant = shares[0];
  const pct = Math.round(dominant.share * 100);
  const direction = dominant.value >= 0 ? 'drove' : 'hurt';
  const takeaway = dominant.label === 'multiple change'
    ? "That's a fragile return — it depends on someone else paying more for the same business, not on the business getting better."
    : dominant.label === 'EBITDA growth'
      ? 'That return is durable — the business itself got more valuable, independent of market multiples.'
      : "That's a mechanical return — debt paydown, not operating performance, drove the gain.";
  return dominant.label + ' ' + direction + ' most of the return (' + pct + '% of the value change). ' + takeaway;
}

/* ---------- error log (Part "Error Log") ---------- */

const BAIN_ERROR_TYPES = {
  'good-company-not-good-investment': 'Treats "good company" as equivalent to "good investment"',
  'ignores-entry-price': 'Ignores entry price / what was paid',
  'relies-on-multiple-expansion': 'Return depends on multiple expansion, not operating improvement',
  'weak-downside': 'Downside case is weak or missing',
  'laundry-list-diligence': 'Diligence questions are a laundry list, not prioritized',
  'no-conviction': 'Recommendation lacks a clear conviction',
};
const BAIN_DIMENSION_TO_ERROR_HINT = {
  valueCreation: 'relies-on-multiple-expansion', downsideRisk: 'weak-downside', diligence: 'laundry-list-diligence',
  investmentJudgment: 'no-conviction', investmentThesis: 'good-company-not-good-investment',
};
function detectErrorsFromBainCase(attempt){
  const found = [];
  Object.entries(attempt.scorecard?.dimensions || {}).forEach(([dimId, d]) => {
    if(d.score > 0 && d.score <= 2 && d.whatToImprove?.trim() && BAIN_DIMENSION_TO_ERROR_HINT[dimId]){
      found.push({ errorType: BAIN_DIMENSION_TO_ERROR_HINT[dimId], sourceType: 'case', sourceId: attempt.id, note: d.whatToImprove, detected: 'auto' });
    }
  });
  return found;
}

/* ---------- adaptive "Today" recommender (mirrors getNextStrategySession's priority-ladder style) ---------- */

// Priority: (1) resume an in-progress case, (2) a deal due for spaced retrieval, (3) the next
// unstarted learn module, (4) the next not-yet-attempted LBO drill, (5) the next unattempted
// case, (6) a free 60-second IC rep. Every branch is a named, explainable rule.
function getNextBainSprintSession(bainSprint, content, today){
  const inProgress = (bainSprint.cases || []).find(c => c.status !== 'completed');
  if(inProgress){
    const c = content.cases.find(x => x.id === inProgress.caseContentId);
    return { type: 'case', caseContentId: inProgress.caseContentId, attemptId: inProgress.id, title: 'Resume: ' + (c ? c.title : 'your case'), sub: 'In-progress investment case' };
  }

  const dueDeals = Object.values(bainSprint.dealMastery || {}).filter(d => d.nextReviewDate && d.nextReviewDate <= today);
  if(dueDeals.length){
    const deal = content.deals.find(x => x.id === dueDeals[0].dealId);
    return { type: 'deal-review', dealId: dueDeals[0].dealId, title: 'Recall: ' + (deal ? deal.company : 'a deal'), sub: 'Due for retrieval' };
  }

  const nextModule = content.learnModules.find(m => !(bainSprint.moduleProgress || {})[m.id]?.completedAt);
  if(nextModule) return { type: 'module', moduleId: nextModule.id, title: nextModule.title, sub: 'Investor-mindset module', minutes: nextModule.estimatedMinutes || 8 };

  const nextLbo = content.lboDrills.find(p => !(bainSprint.lboAttempts || []).some(a => a.problemId === p.id));
  if(nextLbo) return { type: 'lbo', problemId: nextLbo.id, title: 'Paper LBO: ' + nextLbo.title, sub: nextLbo.level, minutes: 10 };

  const attemptedCaseIds = new Set((bainSprint.cases || []).map(c => c.caseContentId));
  const nextCase = content.cases.find(c => !attemptedCaseIds.has(c.id));
  if(nextCase) return { type: 'case-new', caseContentId: nextCase.id, title: nextCase.title, sub: 'Investment case — ' + nextCase.suggestedTimeMin + ' min' };

  const studiedDeals = Object.keys(bainSprint.dealMastery || {});
  if(studiedDeals.length) return { type: 'ic60', title: '60-second IC rep', sub: 'Keep the reflex sharp' };

  return { type: 'done' };
}
