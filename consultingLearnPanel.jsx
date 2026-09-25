// consultingLearnPanel.jsx
// The rebuilt Consulting Learn experience — a real curriculum, not a card glossary.
// Classic Babel-transformed script, shares global scope with consultingCompetencies.js,
// consultingContent/*, consultingEngine.js, and App.jsx (uid, ls, React hooks, useDictation).
// Visual language matches the REST of Consulting (glass/border-subtle/indigo accents,
// 90deg gradient buttons) rather than Strategy's — this stays inside one feature's look.

const CL = { text:'#e2e8f0', dim:'#94a3b8', faint:'#64748b', accent:'#818cf8', good:'#34d399', warn:'#f59e0b', bad:'#f87171' };
const CL_FIELD = {background:'rgba(255,255,255,0.04)', color:CL.text, border:'1px solid rgba(255,255,255,0.08)'};
const CL_STATE_DOT = { NOT_STARTED:'○', LEARNED:'◐', PRACTICED:'◐', RETRIEVED:'◐', STRONG:'✓' };
const CL_STATE_COLOR = { NOT_STARTED:'#475569', LEARNED:CL.warn, PRACTICED:CL.warn, RETRIEVED:CL.accent, STRONG:CL.good };

function CLPrimaryButton({onClick, children, disabled}){
  return <button onClick={onClick} disabled={disabled} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff',opacity:disabled?0.5:1}}>{children}</button>;
}
function CLSecondaryButton({onClick, children}){
  return <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-xs" style={{background:'rgba(255,255,255,0.05)',color:CL.dim}}>{children}</button>;
}
function CLCard({children, style}){
  return <div className="glass rounded-xl p-4 border-subtle" style={style}>{children}</div>;
}

/* ==================== root panel ==================== */

function LearnPanel({consulting, setConsulting, apiKey, toasts, onGoToDrill, onGoToCase, initModuleId}){
  const [view,setView]=useState('home'); // home | track | module | search
  const [activeTrackId,setActiveTrackId]=useState(null);
  const [activeModuleId,setActiveModuleId]=useState(null);
  const [searchQuery,setSearchQuery]=useState('');
  const learnProgress=consulting.learnProgress||{};

  const openModule=(id)=>{ setActiveModuleId(id); setView('module'); };
  const openTrack=(id)=>{ setActiveTrackId(id); setView('track'); };

  // Deep-link from Drills/Review/Cases ("Learn: X →") — each distinct id (even if it repeats
  // later after another) should reopen the reader, so key off the value itself, not just mount.
  useEffect(()=>{ if(initModuleId) openModule(initModuleId); }, [initModuleId]);

  const markLearned=(moduleId)=>{
    setConsulting(c=>{
      const lp=c.learnProgress||{};
      if(lp[moduleId]?.learnedAt) return c; // idempotent — reading again doesn't reset progress
      const prev=lp[moduleId]||{exerciseAttempts:[],retrievalChecks:[]};
      return {...c, learnProgress:{...lp, [moduleId]:{...prev, learnedAt:Date.now()}}};
    });
  };
  const recordAttempt=(moduleId, correct, score)=>{
    const today=todayStr();
    setConsulting(c=>{
      const lp=c.learnProgress||{};
      const prev=lp[moduleId]||{learnedAt:Date.now(),exerciseAttempts:[],retrievalChecks:[]};
      const alreadyPracticed=(prev.exerciseAttempts||[]).some(a=>a.correct);
      const entry={at:Date.now(),correct,score};
      let next;
      if(alreadyPracticed){
        const sched=scheduleModuleRetrieval(prev, correct, today);
        next={...prev, retrievalChecks:[...(prev.retrievalChecks||[]), entry], ...sched};
      } else {
        next={...prev, exerciseAttempts:[...(prev.exerciseAttempts||[]), entry]};
        if(correct) next={...next, ...scheduleModuleRetrieval(prev, true, today)};
      }
      return {...c, learnProgress:{...lp, [moduleId]:next}};
    });
    // Additive — learnProgress above stays the source of truth for deriveModuleState.
    const m=CONSULTING_MODULES.find(x=>x.id===moduleId);
    if(m) recordConsultingEvidence({sourceType:'learn', sourceId:moduleId, competency:m.primaryCompetency, score}, setConsulting);
  };

  const openErrorDimensions=[...new Set((consulting.errorLog||[]).filter(e=>!e.resolved).map(e=>migrateConsultingDimension(e.dimension)))];
  const recommended=getNextLearnModule(learnProgress, openErrorDimensions);
  const inProgress=CONSULTING_MODULES.find(m=>{
    const st=deriveModuleState(learnProgress[m.id]);
    return st==='LEARNED'; // read but not yet practiced
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {view!=='home' && <button onClick={()=>setView('home')} className="text-xs" style={{color:CL.faint}}>← Learn Home</button>}
        </div>
        <div className="flex gap-2">
          <input value={searchQuery} onChange={e=>{setSearchQuery(e.target.value); setView(e.target.value.trim()?'search':'home');}}
            placeholder="Search Learn…" className="px-3 py-1.5 rounded-lg text-xs" style={{...CL_FIELD, width:180}} />
        </div>
      </div>

      {view==='home' && <LearnHomeView consulting={consulting} learnProgress={learnProgress} recommended={recommended} inProgress={inProgress}
        openModule={openModule} openTrack={openTrack} />}
      {view==='search' && <LearnSearchView query={searchQuery} learnProgress={learnProgress} openModule={openModule} />}
      {view==='track' && activeTrackId && <TrackView trackId={activeTrackId} learnProgress={learnProgress} openModule={openModule} onBackToTracks={()=>setView('home')} />}
      {view==='module' && activeModuleId && <ModuleReader moduleId={activeModuleId} consulting={consulting} learnProgress={learnProgress}
        apiKey={apiKey} toasts={toasts} markLearned={markLearned} recordAttempt={recordAttempt} onGoToDrill={onGoToDrill} onGoToCase={onGoToCase} openModule={openModule} onBack={()=>setView('home')} />}
    </div>
  );
}

/* ==================== Learn Home ==================== */

function LearnHomeView({consulting, learnProgress, recommended, inProgress, openModule, openTrack}){
  const recentlyLearned=[...CONSULTING_MODULES]
    .filter(m=>learnProgress[m.id]?.learnedAt)
    .sort((a,b)=>(learnProgress[b.id].learnedAt||0)-(learnProgress[a.id].learnedAt||0))
    .slice(0,4);

  return (
    <div className="space-y-5">
      {recommended && (
        <CLCard style={{border:'1px solid rgba(99,102,241,0.3)'}}>
          <div className="text-[11px] uppercase tracking-wide mb-1" style={{color:CL.accent}}>Recommended Next</div>
          <div className="text-sm font-semibold mb-0.5">{recommended.title}</div>
          <div className="text-xs mb-3" style={{color:CL.faint}}>{recommended.estimatedMinutes} min · {moduleCompetencyLabel(recommended)}</div>
          <CLPrimaryButton onClick={()=>openModule(recommended.id)}>Start</CLPrimaryButton>
        </CLCard>
      )}

      {inProgress && inProgress.id!==recommended?.id && (
        <CLCard>
          <div className="text-[11px] uppercase tracking-wide mb-1" style={{color:CL.faint}}>Continue</div>
          <div className="text-sm font-medium mb-2">{inProgress.title} — you’ve read this, haven’t tried the exercise yet</div>
          <CLSecondaryButton onClick={()=>openModule(inProgress.id)}>Resume</CLSecondaryButton>
        </CLCard>
      )}

      <div>
        <div className="text-xs font-semibold mb-2" style={{color:CL.faint}}>CURRICULUM</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {CONSULTING_TRACKS.map(t=>{
            const mods=CONSULTING_MODULES.filter(m=>m.trackId===t.id);
            const started=mods.filter(m=>deriveModuleState(learnProgress[m.id])!=='NOT_STARTED').length;
            return (
              <button key={t.id} onClick={()=>t.status==='authored'&&openTrack(t.id)} disabled={t.status!=='authored'}
                className="text-left p-3 rounded-lg flex items-center justify-between" style={{background:'rgba(255,255,255,0.03)', opacity:t.status==='authored'?1:0.45, cursor:t.status==='authored'?'pointer':'default'}}>
                <div>
                  <div className="text-sm">{t.name}</div>
                  <div className="text-xs" style={{color:CL.faint}}>{t.status==='authored'?`${started}/${mods.length} started`:'Coming soon'}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {recentlyLearned.length>0 && (
        <div>
          <div className="text-xs font-semibold mb-2" style={{color:CL.faint}}>RECENTLY LEARNED</div>
          {recentlyLearned.map(m=>{
            const st=deriveModuleState(learnProgress[m.id]);
            return (
              <button key={m.id} onClick={()=>openModule(m.id)} className="w-full flex items-center justify-between text-left py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-sm" style={{color:CL.dim}}>{m.title}</span>
                <span className="text-xs" style={{color:CL_STATE_COLOR[st]}}>{CL_STATE_DOT[st]} {st}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LearnSearchView({query, learnProgress, openModule}){
  const results=searchConsultingModules(query);
  return (
    <div className="space-y-1">
      <div className="text-xs mb-2" style={{color:CL.faint}}>{results.length} result{results.length!==1?'s':''} for "{query}"</div>
      {results.map(m=>{
        const st=deriveModuleState(learnProgress[m.id]);
        return (
          <button key={m.id} onClick={()=>openModule(m.id)} className="w-full flex items-center justify-between text-left py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <div>
              <div className="text-sm" style={{color:CL.text}}>{m.title}</div>
              <div className="text-xs" style={{color:CL.faint}}>{CONSULTING_TRACKS.find(t=>t.id===m.trackId)?.name}</div>
            </div>
            <span className="text-xs" style={{color:CL_STATE_COLOR[st]}}>{CL_STATE_DOT[st]}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ==================== Track view ==================== */

function TrackView({trackId, learnProgress, openModule, onBackToTracks}){
  const track=CONSULTING_TRACKS.find(t=>t.id===trackId);
  const mods=CONSULTING_MODULES.filter(m=>m.trackId===trackId);
  if(!track) return null;
  return (
    <div>
      <div className="text-sm font-semibold mb-3">{track.name}</div>
      {mods.map(m=>{
        const st=deriveModuleState(learnProgress[m.id]);
        const locked=!prereqsSatisfied(m, learnProgress);
        return (
          <button key={m.id} onClick={()=>!locked&&openModule(m.id)} disabled={locked}
            className="w-full flex items-center justify-between text-left py-2.5" style={{borderBottom:'1px solid rgba(255,255,255,0.05)', opacity:locked?0.4:1}}>
            <div>
              <div className="text-sm" style={{color:CL.text}}>{m.title}</div>
              <div className="text-xs" style={{color:CL.faint}}>{m.estimatedMinutes} min · {moduleCompetencyLabel(m)}{locked?' · complete prerequisites first':''}</div>
            </div>
            <span className="text-xs" style={{color:CL_STATE_COLOR[st]}}>{CL_STATE_DOT[st]}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ==================== Module reader — the 10-step flow, progressive disclosure ==================== */

function ModuleReader({moduleId, consulting, learnProgress, apiKey, toasts, markLearned, recordAttempt, onGoToDrill, onGoToCase, openModule, onBack}){
  const m=CONSULTING_MODULES.find(x=>x.id===moduleId);
  const [thinkFirstAnswer,setThinkFirstAnswer]=useState('');
  const [stage,setStage]=useState('thinkFirst'); // thinkFirst | coreIdea | examples | tryIt | done
  const [exerciseAnswer,setExerciseAnswer]=useState('');
  const [exerciseResult,setExerciseResult]=useState(null);
  const [grading,setGrading]=useState(false);

  useEffect(()=>{ setStage('thinkFirst'); setThinkFirstAnswer(''); setExerciseAnswer(''); setExerciseResult(null); }, [moduleId]);

  if(!m) return <div className="text-sm" style={{color:CL.faint}}>Module not found. <button onClick={onBack} style={{color:CL.accent}}>← Back</button></div>;

  const state=deriveModuleState(learnProgress[m.id]);
  const submitExercise=async()=>{
    if(!exerciseAnswer.trim()){toasts.push('Write an answer first');return;}
    if(m.exercise.type==='numeric'){
      const result=checkQuantAnswer(m.exercise, exerciseAnswer);
      setExerciseResult(result);
      recordAttempt(m.id, result.correct, result.correct?10:3);
      return;
    }
    if(!apiKey){toasts.push('Add API key in Settings to get feedback on this exercise');return;}
    setGrading(true);
    try{
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},max_tokens:300,messages:[
        {role:'system',content:buildModuleExerciseEvalSystem(m)},
        {role:'user',content:`My answer: ${exerciseAnswer}`}
      ]})});
      const j=await resp.json();
      const parsed=JSON.parse(j.choices[0].message.content);
      setExerciseResult({correct:!!parsed.correct, score:parsed.score, feedback:parsed.feedback, modelAnswer:m.exercise.modelAnswer});
      recordAttempt(m.id, !!parsed.correct, parsed.score);
    }catch(e){toasts.push('Grading failed: '+e.message);}
    setGrading(false);
  };

  const drillType=MODULE_TO_DRILL[m.id];
  const relatedCases=MODULE_TO_CASE[m.id]||[];

  return (
    <div className="space-y-4 max-w-2xl">
      <button onClick={onBack} className="text-xs" style={{color:CL.faint}}>← Back to Learn</button>
      <div>
        <div className="text-xs" style={{color:CL.faint}}>{CONSULTING_TRACKS.find(t=>t.id===m.trackId)?.name}</div>
        <div className="text-lg font-semibold">{m.title}</div>
        <div className="text-xs mt-0.5" style={{color:CL.faint}}>{m.estimatedMinutes} min · {moduleCompetencyLabel(m)} · <span style={{color:CL_STATE_COLOR[state]}}>{CL_STATE_DOT[state]} {state}</span></div>
      </div>

      {(m.exhibits||(m.exhibit?[m.exhibit]:[])).map(ex=><ExhibitViewer key={ex.id} exhibit={ex} mode="panel"/>)}

      <CLCard>
        <div className="text-xs font-semibold mb-2" style={{color:CL.accent}}>THINK FIRST</div>
        <div className="text-sm mb-3">{m.thinkFirst.prompt}</div>
        {stage==='thinkFirst' ? (
          <>
            <textarea value={thinkFirstAnswer} onChange={e=>setThinkFirstAnswer(e.target.value)} rows={3} placeholder="Answer before reading on…"
              className="w-full rounded-lg p-2 text-sm mb-2" style={CL_FIELD} />
            <CLPrimaryButton onClick={()=>setStage('coreIdea')} disabled={!thinkFirstAnswer.trim()}>Continue</CLPrimaryButton>
          </>
        ) : <div className="text-xs" style={{color:CL.faint}}>Your answer: {thinkFirstAnswer || '(skipped)'}</div>}
      </CLCard>

      {stage!=='thinkFirst' && (
        <>
          <CLCard>
            <div className="text-xs font-semibold mb-2" style={{color:CL.accent}}>CORE IDEA</div>
            <div className="text-sm leading-relaxed">{m.coreIdea}</div>
          </CLCard>
          <div className="grid sm:grid-cols-2 gap-3">
            <CLCard style={{border:'1px solid rgba(248,113,113,0.2)'}}>
              <div className="text-xs font-semibold mb-2" style={{color:CL.bad}}>WEAK</div>
              <div className="text-sm mb-2 italic" style={{color:CL.dim}}>"{m.badExample.text}"</div>
              <div className="text-xs" style={{color:CL.faint}}>{m.badExample.why}</div>
            </CLCard>
            <CLCard style={{border:'1px solid rgba(52,211,153,0.2)'}}>
              <div className="text-xs font-semibold mb-2" style={{color:CL.good}}>STRONG</div>
              <div className="text-sm mb-2 italic" style={{color:CL.dim}}>"{m.strongExample.text}"</div>
              <div className="text-xs" style={{color:CL.faint}}>{m.strongExample.why}</div>
            </CLCard>
          </div>
          <CLCard>
            <div className="text-xs font-semibold mb-2" style={{color:CL.accent}}>WHY THIS WORKS</div>
            <div className="text-sm leading-relaxed">{m.explanation}</div>
          </CLCard>
          {stage==='coreIdea' && <CLPrimaryButton onClick={()=>{markLearned(m.id); setStage('tryIt');}}>Try It →</CLPrimaryButton>}
        </>
      )}

      {(stage==='tryIt'||stage==='done') && (
        <CLCard style={{border:'1px solid rgba(99,102,241,0.25)'}}>
          <div className="text-xs font-semibold mb-2" style={{color:CL.accent}}>TRY IT</div>
          <div className="text-sm mb-3">{m.exercise.prompt}</div>
          {!exerciseResult ? (
            <>
              <textarea value={exerciseAnswer} onChange={e=>setExerciseAnswer(e.target.value)} rows={m.exercise.type==='numeric'?1:3}
                placeholder={m.exercise.type==='numeric'?`Your answer (${m.exercise.unit||'number'})…`:'Your answer…'}
                className="w-full rounded-lg p-2 text-sm mb-2" style={CL_FIELD} />
              <CLPrimaryButton onClick={submitExercise} disabled={grading}>{grading?'Grading…':'Submit'}</CLPrimaryButton>
            </>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium" style={{color:exerciseResult.correct?CL.good:CL.warn}}>{exerciseResult.correct?'✓ Correct':'Not quite'}</div>
              {m.exercise.type==='numeric' ? (
                <div className="text-xs" style={{color:CL.dim}}>Your answer: {exerciseResult.parsed}{exerciseResult.unit}. Target: {exerciseResult.target}{exerciseResult.unit}. {exerciseResult.modelAnswer}</div>
              ) : (
                <div className="text-xs" style={{color:CL.dim}}>{exerciseResult.feedback}<br/><span style={{color:CL.faint}}>Model answer: {exerciseResult.modelAnswer}</span></div>
              )}
              {stage!=='done' && <CLSecondaryButton onClick={()=>setStage('done')}>Continue</CLSecondaryButton>}
            </div>
          )}
        </CLCard>
      )}

      {stage==='done' && (
        <>
          <CLCard>
            <div className="text-xs font-semibold mb-2" style={{color:CL.accent}}>ONE REUSABLE RULE</div>
            <div className="text-sm font-medium">{m.reusableRule}</div>
          </CLCard>
          <CLCard>
            <div className="text-xs font-semibold mb-2" style={{color:CL.faint}}>COMMON MISTAKES</div>
            <ul className="text-sm space-y-1 list-disc pl-4" style={{color:CL.dim}}>{m.commonMistakes.map((c,i)=><li key={i}>{c}</li>)}</ul>
          </CLCard>
          <CLCard>
            <div className="text-xs font-semibold mb-2" style={{color:CL.faint}}>NEXT PRACTICE</div>
            <div className="flex flex-wrap gap-2">
              {drillType && onGoToDrill && <CLPrimaryButton onClick={()=>onGoToDrill(m.primaryCompetency, drillType)}>Start Drill</CLPrimaryButton>}
              {relatedCases.length>0 && onGoToCase && <CLSecondaryButton onClick={()=>onGoToCase(relatedCases[0])}>Related case: {(typeof getCaseConfig==='function' && getCaseConfig(relatedCases[0])?.title) || relatedCases[0]} →</CLSecondaryButton>}
              {!drillType && !relatedCases.length && <span className="text-xs" style={{color:CL.faint}}>No linked drill for this module yet.</span>}
            </div>
          </CLCard>
        </>
      )}
    </div>
  );
}
