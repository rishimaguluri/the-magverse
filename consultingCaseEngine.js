// consultingCaseEngine.js
// Case state machine, anti-hallucination prompt construction, reveal-gating, the [[META:]] turn
// marker parser, and light case-recommendation/coverage helpers. Plain classic script. Loaded
// after consultingCaseContent.js (CASES_CATALOG/getCaseConfig), before consultingCasePanel.jsx.

const CASE_STATES=['opening','clarify','objective','structure','exploration','synthesis','recommendation','debrief','done'];
const CASE_STATE_LABELS={opening:'Opening',clarify:'Clarification',objective:'Objective',structure:'Structure',exploration:'Analysis',synthesis:'Synthesis',recommendation:'Recommendation',debrief:'Debrief',done:'Complete'};

/* ---------- progression ---------- */

// Practice Mode's literal "Next Phase" button — candidate-driven, linear.
function nextManualState(current){
  const cur=CASE_STATES.indexOf(current);
  if(cur<0||cur>=CASE_STATES.length-2) return current;
  return CASE_STATES[cur+1];
}
// Interview Mode advances only from the AI's own [[META:]] signal, clamped forward-only so a
// malformed or regressive signal can never corrupt the session.
function clampPhaseForward(current, proposed){
  if(!proposed || !CASE_STATES.includes(proposed)) return current;
  return CASE_STATES.indexOf(proposed) > CASE_STATES.indexOf(current) ? proposed : current;
}

// Every interviewer reply ends with a trailing [[META:{...}]] block (never shown to the
// candidate — stripped before render). Parsing is defensive: a missing or malformed marker is a
// harmless no-op, never a thrown error.
function parseCaseMeta(replyText){
  const idx=(replyText||'').indexOf('[[META:');
  if(idx<0) return {cleanText:replyText||'', meta:null};
  const cleanText=replyText.slice(0,idx).trimEnd();
  const tail=replyText.slice(idx+7);
  const end=tail.lastIndexOf(']]');
  const jsonStr=end>=0?tail.slice(0,end):tail;
  try{
    const meta=JSON.parse(jsonStr);
    return {cleanText, meta:{
      revealedFactIds:Array.isArray(meta.revealedFactIds)?meta.revealedFactIds:[],
      revealedExhibitIds:Array.isArray(meta.revealedExhibitIds)?meta.revealedExhibitIds:[],
      phase:typeof meta.phase==='string'?meta.phase:null,
    }};
  }catch(e){ return {cleanText, meta:null}; }
}
// Streaming display helper — strips everything from the marker onward so it never flashes even
// mid-stream (called on every chunk, not just the final one).
function stripCaseMeta(text){
  const idx=(text||'').indexOf('[[META:');
  return idx<0 ? (text||'') : text.slice(0,idx).trimEnd();
}

/* ---------- anti-hallucination reveal gating ---------- */

// Splits a case's hiddenFacts+exhibits into what the AI may state verbatim vs. what it may only
// acknowledge exists (topic label only, never the actual content) — the mechanism that keeps the
// interviewer from inventing numbers.
function resolveCaseReveal(caseContent, revealed){
  const revealedFactIds=new Set(revealed?.factIds||[]);
  const revealedExhibitIds=new Set(revealed?.exhibitIds||[]);
  const alreadyRevealedFacts=[], revealableFacts=[], offLimitsFacts=[];
  (caseContent.hiddenFacts||[]).forEach(f=>{
    if(f.revealPolicy==='PROACTIVELY_GIVEN' || revealedFactIds.has(f.id)) alreadyRevealedFacts.push(f);
    else if(f.revealPolicy==='NOT_AVAILABLE') offLimitsFacts.push(f);
    else revealableFacts.push(f); // AVAILABLE_ON_REQUEST or IRRELEVANT
  });
  const alreadyRevealedExhibits=[], revealableExhibits=[];
  (caseContent.exhibits||[]).forEach(ex=>{
    if(ex.revealPolicy==='PROACTIVELY_GIVEN' || revealedExhibitIds.has(ex.id)) alreadyRevealedExhibits.push(ex);
    else if(ex.revealPolicy!=='NOT_AVAILABLE') revealableExhibits.push(ex); // AVAILABLE_ON_REQUEST or IRRELEVANT
  });
  return {alreadyRevealedFacts, revealableFacts, offLimitsFacts, alreadyRevealedExhibits, revealableExhibits};
}
// Auto-populate PROACTIVELY_GIVEN items at case start (before any candidate interaction).
function initialRevealState(caseContent){
  return {
    factIds:(caseContent.hiddenFacts||[]).filter(f=>f.revealPolicy==='PROACTIVELY_GIVEN').map(f=>f.id),
    exhibitIds:(caseContent.exhibits||[]).filter(ex=>ex.revealPolicy==='PROACTIVELY_GIVEN').map(ex=>ex.id),
  };
}

/* ---------- prompt construction ---------- */

const CASE_META_INSTRUCTION = `At the very end of EVERY reply, on its own line, append a machine-readable marker the candidate will never see (it is stripped before display): [[META:{"revealedFactIds":[...ids of any hidden facts you just revealed, if any],"revealedExhibitIds":[...ids of any exhibits you just revealed, if any],"phase":"<one of opening|clarify|objective|structure|exploration|synthesis|recommendation|debrief — your best judgment of the case's current phase after this reply>"}]]. Always include this marker, with empty arrays if nothing new was revealed.`;

function buildCaseInterviewerPrompt(caseContent, caseState, mode, firmStyleId, revealed, userObjective){
  const style=getInterviewStyle(firmStyleId);
  const {alreadyRevealedFacts, revealableFacts, offLimitsFacts, alreadyRevealedExhibits, revealableExhibits}=resolveCaseReveal(caseContent, revealed);

  const factLine=f=>`- [${f.id}] ${f.fact}`;
  const exLine=ex=>`- [${ex.id}] ${describeExhibitForPrompt(ex)}`;

  const revealedBlock = (alreadyRevealedFacts.length||alreadyRevealedExhibits.length)
    ? `ALREADY REVEALED TO THE CANDIDATE (you may restate these, verbatim, any time):\n${alreadyRevealedFacts.map(factLine).join('\n')}\n${alreadyRevealedExhibits.map(exLine).join('\n')}`.trim() : 'ALREADY REVEALED: none yet.';
  const revealableBlock = (revealableFacts.length||revealableExhibits.length)
    ? `REVEALABLE ON REQUEST (use ONLY these exact facts/numbers if the candidate asks for something matching one of these — never invent a number not listed here):\n${revealableFacts.map(factLine).join('\n')}\n${revealableExhibits.map(exLine).join('\n')}`.trim() : 'REVEALABLE ON REQUEST: none remaining.';
  const offLimitsBlock = offLimitsFacts.length
    ? `NEVER REVEAL (you may acknowledge these topics exist but must say the specific detail isn't available — NEVER state the actual fact):\n${offLimitsFacts.map(f=>`- [${f.id}] topic: ${f.category}`).join('\n')}` : '';

  const stateGuide={
    opening:'Introduce the case naturally — name the client, industry, and central question. Do not volunteer any hidden fact or exhibit yet beyond what is marked ALREADY REVEALED.',
    clarify:'Answer clarifying questions with concise, specific answers drawn only from the REVEALED/REVEALABLE lists above. If asked something in NEVER REVEAL, say that detail isn\'t available.',
    objective:'The candidate is about to state their understanding of the case objective. Do not prompt them yet — this is handled separately in the UI.',
    structure:`The candidate will present their structure. Give honest brief feedback on whether it is MECE and complete.${userObjective?' Explicitly assess whether it would actually answer the stated objective: "'+userObjective+'". If it drifts, name the gap.':''} Then move into exploration.`,
    exploration:`Provide facts/exhibits from the REVEALABLE list only when directly asked, in the specific terms requested. If they pursue an unproductive branch, let them spend 1-2 turns before redirecting.${userObjective?' Occasionally check that analysis stays relevant to the stated objective.':''}`,
    synthesis:`Ask the candidate to summarize findings in 2-3 sentences. Push back if vague or missing a key driver.${userObjective?' Verify the synthesis addresses the original objective.':''}`,
    recommendation:`Ask for a clear actionable recommendation with quantitative rationale. Push back if generic or risk-blind.${userObjective?' Ensure the recommendation directly answers the stated objective; flag the gap if it does not.':''}`,
    debrief:'The case is complete — this phase is handled separately, not in conversation.',
  };

  return `You are ${style.personaLine}. You are conducting a ${caseContent.label} case interview. ${style.toneNotes} ${style.structurePreference} Pushback style: ${style.pushbackStyle}. Data delivery: ${style.dataDeliveryStyle} ${style.closingStyle}

CRITICAL: Case facts and exhibits below are AUTHORITATIVE. You may paraphrase them, but you must NEVER invent a fact, number, or exhibit that is not explicitly listed below. If asked for something not in ALREADY REVEALED or REVEALABLE ON REQUEST, say it isn't available rather than making it up.

Case: "${caseContent.prompt}"
${userObjective?`\nCandidate's stated case objective: "${userObjective}"`:''}

${revealedBlock}

${revealableBlock}
${offLimitsBlock?'\n'+offLimitsBlock:''}

Current phase: ${CASE_STATE_LABELS[caseState]||caseState}. Your role now: ${stateGuide[caseState]||'Continue the interview naturally.'}

Keep responses concise (2-4 sentences typically). Give information only when directly asked — never volunteer beyond ALREADY REVEALED. When the candidate makes a sound move, acknowledge briefly and continue; when they struggle, ask a guiding question.

${mode==='interview' ? 'You are running this in a realistic interview simulation — you alone decide when enough has been demonstrated to move to the next phase; the candidate has no "next phase" control.' : 'You are running this in a practice/coaching context — the candidate may also advance phases manually; your phase judgment is advisory.'}

${CASE_META_INSTRUCTION}`;
}

function buildObjectiveEvalSystem(caseContent){
  const comps=(caseContent.objective?.components||[]).join('; ');
  const cons=(caseContent.objective?.constraints||[]).join('; ')||'none stated';
  const sc=caseContent.objective?.successCriteria||'not specified';
  return `You are a case interview coach evaluating a candidate's case objective statement.\n\nCase prompt: "${caseContent.prompt}"\nRequired components a strong objective must cover: ${comps}\nKey constraints (if any): ${cons}\nSuccess criteria: ${sc}\n\nEvaluate the candidate's statement on these dimensions:\n- clientCentered: reflects what the client actually cares about\n- decisionOriented: identifies a clear decision or outcome\n- specific: captures the actual problem, not a generic restatement\n- complete: covers ALL required components\n- notOverSpecified: does not assume or prescribe the solution prematurely\n- concise: 1-2 sentences, not a paragraph\n\nReturn JSON only: {"rating":"STRONG|SOLID|DEVELOPING|WEAK","assessment":"2-3 sentence assessment, be specific","whatsMissing":null or "what is missing","strongVersion":"one strong version in 1-2 sentences","dimensions":{"clientCentered":true,"decisionOriented":true,"specific":true,"complete":true,"notOverSpecified":true,"concise":true}}\n\nScore MEANING not wording. Many phrasings can be STRONG. STRONG=captures decision and all components concisely. SOLID=good but slightly incomplete or imprecise. DEVELOPING=shows understanding but misses something important. WEAK=misses the core decision or too generic.`;
}

// Competencies actually in scope for a case — the union of its gradingEvidence phases, plus
// communication/caseManagement which are observable in literally every case by construction
// (how you talk and manage the conversation is always evidenced, regardless of case type).
function caseEvidencedCompetencies(caseContent){
  const ge=caseContent.gradingEvidence||{};
  const set=new Set(['communication','caseManagement']);
  Object.values(ge).forEach(arr=>(arr||[]).forEach(id=>set.add(id)));
  return [...set];
}

// Replaces the old buildDebriefSystem() — only requests/accepts competencies actually in scope
// for THIS case (Part 23: never score what wasn't tested), never the fixed full 12.
function buildCaseDebriefPrompt(caseContent){
  const ids=caseEvidencedCompetencies(caseContent);
  const dimList=ids.map(id=>`"${id}":0`).join(',');
  return `You are a case coach. This case only genuinely tests these competencies: ${ids.join(', ')} — score ONLY these, 1-10, based on the transcript. Do NOT include any competency not in this list, even if you have an opinion about it. Use EXACTLY these ids (camelCase). For each scored competency, also give a one-sentence OBSERVED note (what the candidate actually did) and one concrete NEXT REP suggestion. Return JSON: {"competencyScores":{${dimList}},"competencyNotes":{${ids.map(id=>`"${id}":{"observed":"","good":"","improve":"","nextRep":""}`).join(',')}},"objectiveDisciplineAssessment":"1-2 sentences on whether they stayed on-objective","strengths":["strength 1"],"weaknesses":["specific weakness 1"],"insight":"1 sentence overall summary","topNextCaseFocus":"one specific behavior to focus on next case"}`;
}

/* ---------- light recommendation + coverage (Part 41: call shared helpers, don't build a second independent recommender) ---------- */

// Recommends a case using the SAME "open error dimensions" signal Home/Review already use
// (consulting.errorLog), not a new independent adaptive engine — matches Part 41's constraint
// that Pass 2 should prepare for, not build, the unified getNextConsultingAction() (Pass 3).
function getRecommendedNextCase(consulting){
  const openDims=new Set((consulting.errorLog||[]).filter(e=>!e.resolved).map(e=>migrateConsultingDimension(e.dimension)));
  const attemptedTypes=new Set((consulting.cases||[]).map(c=>c.type));
  const scored=CASES_CATALOG.map(c=>{
    const evidenced=caseEvidencedCompetencies(c);
    const weaknessMatches=evidenced.filter(id=>openDims.has(id)).length;
    const isNewType=!attemptedTypes.has(c.id);
    return {c, score:weaknessMatches*10+(isNewType?3:0)};
  }).sort((a,b)=>b.score-a.score);
  return scored[0]?.c || CASES_CATALOG[0];
}

// Coverage = what's been PRACTICED (exposure), deliberately separate from competency mastery
// (how well) — Part 33. Never merge these into one number.
function computeCaseCoverage(consulting){
  const done=(consulting.cases||[]).filter(c=>c.state==='done');
  const by=key=>{
    const counts={};
    done.forEach(c=>{
      const cfg=getCaseConfig(c.type);
      const v = key==='caseType'?cfg.caseType : key==='industry'?cfg.industry : key==='difficulty'?cfg.difficulty : c.firmStyle||'general';
      counts[v]=(counts[v]||0)+1;
    });
    return counts;
  };
  return { caseType:by('caseType'), industry:by('industry'), difficulty:by('difficulty'), firmStyle:by('firmStyle'), totalCompleted:done.length };
}
