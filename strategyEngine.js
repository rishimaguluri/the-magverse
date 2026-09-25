// strategyEngine.js
// Pure logic for the Strategy tab: state shaping, mastery derivation, spaced-retrieval
// scheduling, next-session selection, error detection, cross-module payload builders.
// NO JSX here — plain classic script, loaded after strategyContent.js and before
// strategyPanel.jsx (all three, plus App.jsx, share one global scope in the browser).
//
// Deterministic by design: every status/priority here is computed from an evidence
// array via a rule you can state in one sentence. No LLM calls, no ML, nothing hidden.

/* ---------- state shaping ---------- */

function emptyStrategy(data){
  return {
    currentWeekId:'p1w1', streak:{count:0,lastActiveDate:null}, weekProgress:{}, frameworksLearned:[],
    sourceNotes:{}, cases:[], companies:[], decisions:[], journal:[], playbook:[],
    learnerModel:{capabilities:{}}, conceptMastery:{}, errorLog:[],
    ...(data.strategy||{}),
  };
}

function todayStr(){ return new Date().toISOString().slice(0,10); }
function addDaysStr(dateStr, days){ const d=new Date(dateStr+'T00:00:00'); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }
function daysBetweenStr(fromStr, toStr){ return Math.round((new Date(toStr+'T00:00:00') - new Date(fromStr+'T00:00:00'))/86400000); }

function computeElapsedMs(timer, nowMs){
  if(!timer || !timer.startedAt) return 0;
  const end = timer.finishedAt || timer.pausedAt || nowMs;
  return Math.max(0, end - timer.startedAt - (timer.pausedMs||0));
}
function fmtDuration(ms){
  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return h>0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
}
function fmtRelDate(ts){
  if(!ts) return '';
  const d = new Date(ts); const days = Math.floor((Date.now()-d.getTime())/86400000);
  if(days<=0) return 'today';
  if(days===1) return 'yesterday';
  if(days<7) return days+'d ago';
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
}

function getTotalHours(strategy){
  let ms = 0;
  Object.values(strategy.weekProgress||{}).forEach(wp=>{ ms += (wp.lessonsRead||[]).length * 15*60000; });
  (strategy.cases||[]).forEach(c=>{ ms += computeElapsedMs(c.timer, Date.now()); });
  return Math.round((ms/3600000)*10)/10;
}

function getJournalFeed(strategy, content){
  const items = (strategy.journal||[]).map(j=>({...j, kind:'manual'}));
  Object.entries(strategy.weekProgress||{}).forEach(([weekId, wp])=>{
    Object.entries(wp.reflections||{}).forEach(([lessonId, text])=>{
      if(text && text.trim()){
        const lesson = content.lessons[lessonId];
        items.push({id:'auto-lesson-'+lessonId, kind:'lesson', text, tags:[lesson?lesson.title:lessonId], ts: wp.completedAt || new Date().toISOString()});
      }
    });
  });
  (strategy.cases||[]).forEach(c=>{
    const r = c.reflection||{};
    const combined = [r.strongestInsight, r.missed, r.wouldDoDifferently].filter(Boolean).join(' — ');
    if(combined.trim()){
      const cc = content.cases[c.caseContentId];
      items.push({id:'auto-case-'+c.id, kind:'case', text:combined, tags:[cc?cc.title:c.caseContentId], ts: c.timer?.finishedAt ? new Date(c.timer.finishedAt).toISOString() : c.dateStarted});
    }
  });
  (strategy.decisions||[]).forEach(d=>{
    if(d.finalDecision && d.finalDecision.trim()){
      items.push({id:'auto-decision-'+d.id, kind:'decision', text:`${d.decision||'Decision'}: ${d.finalDecision}`, tags:['decision'], ts: d.date ? new Date(d.date).toISOString() : new Date().toISOString()});
    }
  });
  return items.sort((a,b)=> new Date(b.ts)-new Date(a.ts));
}

/* ---------- capability model (13 capabilities, evidence-derived, never hand-set) ---------- */

const CAPABILITY_LABELS = {
  diagnosis:'Diagnosis', problemIdentification:'Problem Identification', structure:'Structure',
  prioritization:'Prioritization', quantitativeReasoning:'Quantitative Reasoning', businessIntuition:'Business Intuition',
  strategicInsight:'Strategic Insight', useOfEvidence:'Use of Evidence', creativity:'Creativity',
  decisionQuality:'Decision Quality', communication:'Communication', adaptability:'Adaptability',
  intellectualHumility:'Intellectual Humility',
};
const CAPABILITY_IDS = Object.keys(CAPABILITY_LABELS);

// case scorecard dimension id -> [{cap, weight}] — a judgment call, isolated here so it's cheap to revise
const SCOREDIM_TO_CAPABILITY = {
  businessUnderstanding:[{cap:'businessIntuition',weight:1}],
  diagnosis:[{cap:'diagnosis',weight:1},{cap:'problemIdentification',weight:1}],
  structure:[{cap:'structure',weight:1}],
  prioritization:[{cap:'prioritization',weight:1}],
  quantitativeReasoning:[{cap:'quantitativeReasoning',weight:1}],
  strategicDepth:[{cap:'strategicInsight',weight:1}],
  creativity:[{cap:'creativity',weight:1}],
  communication:[{cap:'communication',weight:1}],
  adaptability:[{cap:'adaptability',weight:1}],
  executivePresence:[{cap:'communication',weight:0.5}],
};

// rolling average of last 6 evidence pieces, gated by a minimum evidence-count floor —
// one sentence, transparent, no black box.
function deriveMasteryStatus(evidence){
  if(!evidence || evidence.length===0) return 'UNTESTED';
  const recent = evidence.slice(-6);
  const avg = recent.reduce((s,e)=>s+e.score,0)/recent.length; // score is 0-5
  if(evidence.length < 2) return avg>=3 ? 'DEVELOPING' : 'WEAK';
  if(avg>=4.3 && evidence.length>=5) return 'MASTERED';
  if(avg>=3.5 && evidence.length>=3) return 'STRONG';
  if(avg>=2.5) return 'DEVELOPING';
  return 'WEAK';
}

// Evidence to append to learnerModel.capabilities from a completed case attempt.
// Returns { [capId]: evidenceItem }, caller merges into existing arrays (never overwrites).
function evidenceFromCaseScorecard(attempt){
  const out = {};
  Object.entries(attempt.scorecard?.dimensions||{}).forEach(([dimId, d])=>{
    if(!d.score) return;
    (SCOREDIM_TO_CAPABILITY[dimId]||[]).forEach(({cap, weight})=>{
      if(!out[cap]) out[cap] = [];
      out[cap].push({ts:new Date().toISOString(), score:d.score*weight, source:'case', sourceId:attempt.id});
    });
  });
  return out;
}

// Evidence from a decision review — the ONLY path to decisionQuality/intellectualHumility/useOfEvidence.
function evidenceFromDecisionReview(dec){
  const out = {};
  const ts = new Date().toISOString();
  if(dec.wasProcessGood===true || dec.wasProcessGood===false){
    out.decisionQuality = [{ts, score: dec.wasProcessGood?5:1, source:'decision', sourceId:dec.id}];
  }
  if(dec.whatWouldChangeMyMind && dec.whatWouldChangeMyMind.trim().length>15){
    out.intellectualHumility = [{ts, score:4, source:'decision', sourceId:dec.id}];
  }
  if((dec.baseRates && dec.baseRates.trim()) || (dec.keyUnknowns && dec.keyUnknowns.trim())){
    out.useOfEvidence = [{ts, score:4, source:'decision', sourceId:dec.id}];
  }
  return out;
}

/* ---------- concept mastery (spaced retrieval) ---------- */

const CONCEPT_LABELS = {
  diagnosis:'Diagnosis', 'guiding-policy':'Guiding Policy', 'coherent-action':'Coherent Action',
  tradeoffs:'Tradeoffs', positioning:'Positioning', 'activity-system-fit':'Activity-System Fit',
  'added-value':'Added Value', 'willingness-to-pay':'Willingness to Pay', 'willingness-to-sell':'Willingness to Sell (SOC)',
  'five-forces':'Five Forces', 'better-off-test':'The Better-Off Test', 'ownership-test':'The Ownership Test',
  // Phase 3 — Business Models & Industry Economics
  'value-capture':'Value Capture', 'unit-economics':'Unit Economics', 'operating-leverage':'Operating Leverage', 'pricing-power':'Pricing Power',
  // Phase 4 — Decision-Making Under Uncertainty
  'base-rates':'Base Rates', 'expected-value':'Expected Value', reversibility:'Reversibility', 'information-value':'Value of Information',
  // Phase 5 — Growth & Corporate Strategy
  'vertical-integration':'Vertical Integration', synergies:'Synergies', 'capital-allocation':'Capital Allocation',
};
// concept id -> where its content lives in STRATEGY_CONTENT (no parallel taxonomy — ties back to real ids)
const CONCEPT_TO_CONTENT = {
  diagnosis:{lessonId:'p1w2-l02'}, 'guiding-policy':{lessonId:'p1w1-l01'}, 'coherent-action':{lessonId:'p1w1-l02'},
  tradeoffs:{frameworkId:'positioning-tradeoffs', lessonId:'p2w2-l02'}, positioning:{frameworkId:'positioning-tradeoffs', lessonId:'p2w2-l02'},
  'activity-system-fit':{frameworkId:'value-chain-activity-analysis', lessonId:'p2w2-l01'},
  'added-value':{frameworkId:'added-value-wtp-soc', lessonId:'p2w1-l02'},
  'willingness-to-pay':{frameworkId:'added-value-wtp-soc', lessonId:'p2w1-l01'},
  'willingness-to-sell':{frameworkId:'added-value-wtp-soc', lessonId:'p2w1-l01'},
  'five-forces':{frameworkId:'five-forces', lessonId:'p1w2-l02'},
  'better-off-test':{frameworkId:'better-off-test'}, 'ownership-test':{frameworkId:'ownership-test'},
  // Phase 3 — new concepts, each anchored to the lesson that introduces it
  'value-capture':{lessonId:'p3w1-l01'}, 'unit-economics':{lessonId:'p3w1-l02'},
  'operating-leverage':{lessonId:'p3w1-l03'}, 'pricing-power':{lessonId:'p3w2-l02'},
  // Phase 4 — new concepts
  'base-rates':{lessonId:'p4w1-l01'}, 'expected-value':{lessonId:'p4w1-l01'},
  reversibility:{lessonId:'p4w2-l01'}, 'information-value':{lessonId:'p4w2-l02'},
  // Phase 5 — new concepts
  'vertical-integration':{lessonId:'p5w1-l03'}, synergies:{lessonId:'p5w2-l02'}, 'capital-allocation':{lessonId:'p5w3-l01'},
};
// reverse maps, derived (not hand-duplicated, so they can't drift from CONCEPT_TO_CONTENT)
const LESSON_TO_CONCEPT = {}, FRAMEWORK_TO_CONCEPT = {};
Object.entries(CONCEPT_TO_CONTENT).forEach(([conceptId, link])=>{
  if(link.lessonId){ (LESSON_TO_CONCEPT[link.lessonId] = LESSON_TO_CONCEPT[link.lessonId]||[]).push(conceptId); }
  if(link.frameworkId){ (FRAMEWORK_TO_CONCEPT[link.frameworkId] = FRAMEWORK_TO_CONCEPT[link.frameworkId]||[]).push(conceptId); }
});

// Classic expanding/contracting spaced interval: success multiplies the gap ~1.8x,
// struggle halves it. One sentence, explainable, not ML.
function scheduleAfterEvidence(concept, latestScore, today){
  const success = latestScore >= 3;
  const prevInterval = concept.reviewIntervalDays || 2;
  const nextInterval = success ? Math.max(1, Math.round(prevInterval*1.8)) : Math.max(1, Math.round(prevInterval*0.5));
  return { reviewIntervalDays: nextInterval, nextReviewDate: addDaysStr(today, nextInterval) };
}
function conceptPriority(concept, today){
  if(!concept.nextReviewDate) return concept.timesPracticed ? 0 : 0.3;
  const daysOverdue = daysBetweenStr(concept.nextReviewDate, today);
  if(daysOverdue < 0) return 0;
  return Math.min(1, 0.4 + daysOverdue*0.1);
}

/* ---------- error log ---------- */

const ERROR_TYPES = {
  'jumps-to-solution':'Jumps to a solution before diagnosis', 'no-quantification':'Does not quantify',
  'laundry-list-framework':'Gives a laundry-list framework', 'ignores-competitor-response':'Ignores competitor response',
  'fails-to-prioritize':'Fails to prioritize', 'confuses-growth-with-value':'Confuses growth with value creation',
  'ignores-opportunity-cost':'Ignores opportunity cost', 'avoids-recommendation':'Avoids committing to a recommendation',
  'no-evidence':'Gives a recommendation without evidence', 'fails-to-update':'Fails to update after new information',
};
// coarse, secondary auto-signal — the reliable path is a manual "tag an error" affordance
const DIMENSION_TO_ERROR_HINT = {
  structure:'laundry-list-framework', prioritization:'fails-to-prioritize', quantitativeReasoning:'no-quantification',
  strategicDepth:'confuses-growth-with-value', diagnosis:'jumps-to-solution',
};
function detectErrorsFromCase(attempt){
  const found = [];
  Object.entries(attempt.scorecard?.dimensions||{}).forEach(([dimId, d])=>{
    if(d.score>0 && d.score<=2 && d.whatToImprove?.trim() && DIMENSION_TO_ERROR_HINT[dimId]){
      found.push({errorType:DIMENSION_TO_ERROR_HINT[dimId], sourceType:'case', sourceId:attempt.id, note:d.whatToImprove, detected:'auto'});
    }
  });
  return found;
}
function detectErrorsFromDecision(dec){
  if(dec.wasProcessGood===false && !dec.whatWouldChangeMyMind?.trim()){
    return [{errorType:'no-evidence', sourceType:'decision', sourceId:dec.id, note:'Process rated bad; no falsifying evidence identified.', detected:'auto'}];
  }
  return [];
}
function recurringErrorTypes(errorLog, minCount){
  const counts = {};
  (errorLog||[]).forEach(e=>{ counts[e.errorType] = (counts[e.errorType]||0)+1; });
  return Object.entries(counts).filter(([,n])=>n>=(minCount||3)).sort((a,b)=>b[1]-a[1]).map(([type,count])=>({errorType:type, count}));
}

/* ---------- next-best-session engine ---------- */

function findNextUnstartedLesson(strategy, content){
  for(const phase of content.phases){
    if(phase.status!=='authored') continue;
    for(const weekId of phase.weekIds){
      const week = content.weeks[weekId];
      const wp = (strategy.weekProgress||{})[weekId] || {lessonsRead:[]};
      for(const lessonId of week.lessonIds){
        if(!(wp.lessonsRead||[]).includes(lessonId)){
          const lesson = content.lessons[lessonId];
          return {weekId, lessonId, title:lesson.title, sub:`${phase.name} — ${week.name}`};
        }
      }
    }
  }
  return null;
}
function mostRecentlyCompletedLesson(strategy, content){
  let best = null;
  Object.entries(strategy.weekProgress||{}).forEach(([weekId, wp])=>{
    (wp.lessonsRead||[]).forEach(lessonId=>{
      const ts = wp.completedAt || '';
      if(!best || ts > best.ts) best = {lessonId, weekId, ts, title: content.lessons[lessonId]?.title||''};
    });
  });
  return best;
}
function weakestRecentDimension(cases, lastN){
  const recent = [...(cases||[])].filter(c=>c.status==='completed').slice(-1*(lastN||3));
  if(!recent.length) return null;
  const totals = {};
  recent.forEach(c=>{
    Object.entries(c.scorecard?.dimensions||{}).forEach(([dimId, d])=>{
      if(!d.score) return;
      if(!totals[dimId]) totals[dimId] = {sum:0, n:0};
      totals[dimId].sum += d.score; totals[dimId].n += 1;
    });
  });
  let worst = null;
  Object.entries(totals).forEach(([dimId, t])=>{
    const avg = t.sum/t.n;
    if(avg<=3 && (!worst || avg<worst.avg)) worst = {dimId, avg};
  });
  return worst ? worst.dimId : null;
}

function findInProgressCase(strategy){
  return (strategy.cases||[]).find(c=>c.status!=='completed') || null;
}
function findNextUnattemptedCase(strategy, content){
  const attemptedIds = new Set((strategy.cases||[]).map(c=>c.caseContentId));
  return Object.values(content.cases).find(c=>!attemptedIds.has(c.id)) || null;
}

// ONE reusable function — everything about "what should I do next" lives here.
// Priority, in order: (1) unfinished active work, (2) due review, (3) curriculum progression
// (with an immediate reinforcement drill for whatever was just learned), (4) a strategically
// useful case, (5) weak-capability reinforcement via free review. Every branch is a named,
// explainable rule — nothing here is randomized or scored by a black box.
function getNextStrategySession(strategy, content){
  // 1. unfinished active work — never leave a half-finished case attempt behind
  const inProgress = findInProgressCase(strategy);
  if(inProgress){
    const c = content.cases[inProgress.caseContentId];
    return {type:'case', caseContentId:inProgress.caseContentId, attemptId:inProgress.id,
      title:`Resume: ${c?.title||'your case'}`, sub:'You have an in-progress case attempt'};
  }

  // 2. due review — concepts overdue per the spaced-retrieval schedule
  const today = todayStr();
  const overdue = Object.values(strategy.conceptMastery||{})
    .map(c=>({...c, _priority: conceptPriority(c, today)}))
    .filter(c=>c._priority>0.4)
    .sort((a,b)=>b._priority-a._priority);
  if(overdue.length){
    const ids = overdue.slice(0,3).map(c=>c.conceptId);
    return {type:'review', conceptIds:ids, title:'Review: '+ids.map(id=>CONCEPT_LABELS[id]).join(', '), sub:`${overdue.length} concept(s) due for retrieval`};
  }

  // 3. curriculum progression — reinforce what was just learned before piling on new material
  const lastLesson = mostRecentlyCompletedLesson(strategy, content);
  if(lastLesson){
    const conceptIds = LESSON_TO_CONCEPT[lastLesson.lessonId] || [];
    const untouched = conceptIds.find(cid => !(strategy.conceptMastery||{})[cid] || !(strategy.conceptMastery[cid].timesPracticed));
    if(untouched){
      return {type:'drill', conceptId:untouched, title:`Quick drill: ${CONCEPT_LABELS[untouched]}`, sub:`Reinforce what you just learned in "${lastLesson.title}"`};
    }
  }
  const lessonNext = findNextUnstartedLesson(strategy, content);
  if(lessonNext) return {type:'lesson', ...lessonNext};

  // 4. a strategically useful case — targeted at a recently weak dimension when one exists
  const weakDim = weakestRecentDimension(strategy.cases, 3);
  const nextCase = findNextUnattemptedCase(strategy, content);
  if(nextCase){
    const label = weakDim && CASE_SCORECARD_DIMENSIONS.find(d=>d.id===weakDim)?.label;
    return {type:'case', caseContentId:nextCase.id, title:nextCase.title,
      sub: label ? `Recent weak spot: ${label} — ${nextCase.suggestedTimeMin} min` : `Case Practice — ${nextCase.suggestedTimeMin} min`};
  }

  // 5. weak-capability reinforcement — every case attempted, every concept schedule current: free review
  const introducedConcepts = Object.keys(strategy.conceptMastery||{});
  if(introducedConcepts.length){
    return {type:'review', conceptIds:introducedConcepts.slice(0,3), title:'Free review', sub:'Keep concepts sharp'};
  }
  return {type:'done'};
}

/* ---------- review-mode prompt templates ---------- */

const REVIEW_TEMPLATE_TYPES = ['explain-simply','apply-to-mini-scenario','distinguish-from-similar-concept','identify-when-it-fails'];
const SIMILAR_CONCEPT_PAIRS = [
  ['five-forces','activity-system-fit'], ['better-off-test','ownership-test'],
  ['willingness-to-pay','willingness-to-sell'], ['diagnosis','guiding-policy'],
  ['guiding-policy','coherent-action'], ['added-value','positioning'],
  ['expected-value','base-rates'], ['pricing-power','value-capture'],
  ['vertical-integration','synergies'], ['reversibility','information-value'],
  ['capital-allocation','synergies'],
];
function conceptContent(conceptId){
  const link = CONCEPT_TO_CONTENT[conceptId] || {};
  const framework = link.frameworkId ? STRATEGY_CONTENT.frameworks.find(f=>f.id===link.frameworkId) : null;
  const lesson = link.lessonId ? STRATEGY_CONTENT.lessons[link.lessonId] : null;
  return {
    label: CONCEPT_LABELS[conceptId] || conceptId,
    what: framework?.what || lesson?.coreIdea || '',
    example: framework?.example || lesson?.example || '',
    limitation: framework?.limitations || lesson?.limitation || '',
  };
}
function buildReviewPrompt(conceptId, templateType){
  const c = conceptContent(conceptId);
  if(templateType==='explain-simply'){
    return {templateType, prompt:`In 2-3 sentences, explain "${c.label}" to someone who's never heard of it — no jargon.`, reveal:c.what};
  }
  if(templateType==='apply-to-mini-scenario'){
    const snippet = (c.example||'').split('.').slice(0,1).join('.') + '.';
    return {templateType, prompt:`${snippet ? 'Situation: '+snippet+' ' : ''}How would you apply "${c.label}" here?`, reveal:c.example};
  }
  if(templateType==='distinguish-from-similar-concept'){
    const pair = SIMILAR_CONCEPT_PAIRS.find(p=>p.includes(conceptId));
    if(pair){
      const otherId = pair[0]===conceptId ? pair[1] : pair[0];
      const other = conceptContent(otherId);
      return {templateType, prompt:`What's the difference between "${c.label}" and "${other.label}" — when would you reach for one over the other?`, reveal:`${c.label}: ${c.what}\n\n${other.label}: ${other.what}`};
    }
    return buildReviewPrompt(conceptId, 'explain-simply');
  }
  // identify-when-it-fails
  return {templateType, prompt:`When does "${c.label}" give a misleading answer? Describe a situation where using it naively would mislead you.`, reveal:c.limitation};
}
function getReviewSession(strategy, n){
  const today = todayStr();
  const introduced = Object.values(strategy.conceptMastery||{});
  let ranked = introduced.map(c=>({...c, _priority:conceptPriority(c, today)})).sort((a,b)=>b._priority-a._priority || (a.lastPracticed||'').localeCompare(b.lastPracticed||''));
  const picked = ranked.slice(0, n||3);
  return picked.map((c,i)=>({conceptId:c.conceptId, ...buildReviewPrompt(c.conceptId, REVIEW_TEMPLATE_TYPES[i%4])}));
}

/* ---------- cross-module payload builders ---------- */

// Strategy case -> the global Case Tracker (data.consulting.caseLog) — reuse, don't duplicate.
function buildCaseTrackerEntry(attempt, caseContent){
  const dims = Object.values(attempt.scorecard?.dimensions||{}).filter(d=>d.score>0);
  const avg1to5 = dims.length ? dims.reduce((s,d)=>s+d.score,0)/dims.length : 0;
  const wellTags = Object.entries(attempt.scorecard.dimensions).filter(([,d])=>d.score>=4).map(([id])=>CASE_SCORECARD_DIMENSIONS.find(x=>x.id===id)?.label).filter(Boolean);
  const struggleTags = Object.entries(attempt.scorecard.dimensions).filter(([,d])=>d.score>0 && d.score<=2).map(([id])=>CASE_SCORECARD_DIMENSIONS.find(x=>x.id===id)?.label).filter(Boolean);
  return {
    id: 'cl_'+attempt.id, date: new Date(attempt.timer.finishedAt||Date.now()).toISOString().slice(0,10),
    caseName: caseContent.title, source:'Magverse', caseType: caseContent.type, industry: caseContent.industry,
    mainFeedback: attempt.scorecard.feedback || '', wellTags, struggleTags,
    rating: Math.max(0, Math.min(10, Math.round(avg1to5*2))),
    takeaway: attempt.scorecard.keyLesson || attempt.reflection?.strongestInsight || '',
    magverseCaseId: attempt.caseContentId, createdAt: Date.now(),
  };
}

// One reusable "save to Notes" payload builder — matches data.notes' exact shape (App.jsx newNote()).
function buildNoteFromText(title, text){
  return {
    id: uid('nt'), title: title||'', icon:'',
    blocks:[{id:uid('bl'), type:'text', content:text||'', checked:false, indent:0, color:null, bgColor:null}],
    favorite:false, trashed:false, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
  };
}

/* ---------- Coach: bounded context + mode ---------- */

const COACH_MODES = {
  challenge:'Push back hard on my reasoning. Find the weakest link in my argument and attack it directly.',
  explain:'Teach me the current idea clearly, with a concrete example.',
  socratic:"Don't explain directly — ask me questions that lead me to figure it out myself.",
  critique:"Evaluate my most recent answer or entry critically — what's good, what's weak, what's missing.",
  counterargument:'Attack my current recommendation. Give me the strongest case against it.',
  simplify:'Explain the current idea as simply and clearly as possible. Cut all jargon.',
};

function buildStrategyCoachPrompt(coachContext, strategy, mode){
  let ctx = '';
  if(coachContext?.type==='lesson'){
    const lesson = STRATEGY_CONTENT.lessons[coachContext.id];
    if(lesson) ctx = `The user is currently reading the lesson "${lesson.title}". Core idea: ${lesson.coreIdea}`;
  } else if(coachContext?.type==='case'){
    const c = STRATEGY_CONTENT.cases[coachContext.id];
    if(c) ctx = `The user is currently working the case "${c.title}" (${c.industry}). Prompt: ${c.prompt}`;
  } else if(coachContext?.type==='company'){
    ctx = `The user is currently analyzing a company: "${coachContext.name||''}".`;
  } else if(coachContext?.type==='decision'){
    ctx = `The user is currently working through a decision: "${coachContext.title||''}".`;
  }

  // bounded performance summary — never the whole database
  const caps = Object.entries(strategy.learnerModel?.capabilities||{})
    .map(([id, c])=>({id, status: deriveMasteryStatus(c.evidence)}))
    .filter(c=>c.status==='WEAK' || c.status==='DEVELOPING');
  const weakCaps = caps.slice(0,2).map(c=>CAPABILITY_LABELS[c.id]).join(', ');
  const recurring = recurringErrorTypes(strategy.errorLog, 3).slice(0,2).map(e=>ERROR_TYPES[e.errorType]).join('; ');
  const principles = (strategy.playbook||[]).filter(p=>p.status==='active').slice(0,5).map(p=>'- '+p.principle).filter(Boolean).join('\n');

  const modeLine = mode && COACH_MODES[mode] ? `\nMode: ${COACH_MODES[mode]}` : '';

  return `You are the Strategy Engine inside Magverse — a Strategy Professor, Executive Thinking Coach, and Case Interview Coach. Your job is to train the user to make unusually strong independent strategic judgments, not to recite frameworks.

Rules: Think-first — when the user can attempt a judgment before being taught, ask them to commit to an answer BEFORE explaining. Ground concepts in named thinkers and the specific sources already in this course (Porter, Ghemawat & Rivkin, Casadesus-Masanell, Sørensen & Carroll, the BCG Strategy Palette) rather than generic summaries. Be concise — short explanation, hard question, feedback, next challenge — not a wall of text. Never agree just because the user sounds confident; distinguish fact / assumption / inference / prediction / opinion; ask what evidence would change their mind.${modeLine}
${ctx ? '\nCurrent context: '+ctx : ''}
${weakCaps ? '\nRecent weak spots: '+weakCaps : ''}
${recurring ? '\nRecurring reasoning errors to watch for: '+recurring : ''}
${principles ? '\nThe user\'s current Strategy Playbook (principles already tested — build on these, don\'t restate generic quotes):\n'+principles : ''}`;
}

/* ---------- pre-case focus ---------- */

function pickPreCaseFocus(strategy, n){
  const recent = [...(strategy.cases||[])].filter(c=>c.status==='completed').slice(-3);
  const totals = {};
  recent.forEach(c=>{
    Object.entries(c.scorecard?.dimensions||{}).forEach(([dimId, d])=>{
      if(!d.score) return;
      if(!totals[dimId]) totals[dimId] = {sum:0, n:0};
      totals[dimId].sum += d.score; totals[dimId].n += 1;
    });
  });
  return Object.entries(totals).map(([dimId, t])=>({dimId, avg:t.sum/t.n}))
    .sort((a,b)=>a.avg-b.avg).slice(0, n||2)
    .map(x=>CASE_SCORECARD_DIMENSIONS.find(d=>d.id===x.dimId)?.label).filter(Boolean);
}
