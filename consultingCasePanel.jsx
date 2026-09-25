// consultingCasePanel.jsx
// Replaces CasesSubtab wholesale (same one-file-per-subtab precedent as consultingLearnPanel.jsx).
// Real exhibits, Practice vs. Interview mode, firm styles, interviewer-driven progression,
// anti-hallucination prompt construction, automatic Tracker draft. Classic Babel script.

const CP = {text:'#e2e8f0', dim:'#94a3b8', faint:'#64748b', accent:'#818cf8', good:'#34d399', warn:'#f59e0b', bad:'#f87171'};
const CP_FIELD = {background:'rgba(255,255,255,0.04)', color:CP.text, border:'1px solid rgba(255,255,255,0.08)'};

function CPPrimaryButton({onClick, children, disabled, small}){
  return <button onClick={onClick} disabled={disabled} className={`rounded-lg font-semibold ${small?'px-3 py-1.5 text-xs':'px-4 py-2 text-sm'}`} style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff',opacity:disabled?0.4:1}}>{children}</button>;
}
function CPSecondaryButton({onClick, children}){
  return <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-xs" style={{background:'rgba(255,255,255,0.05)',color:CP.dim}}>{children}</button>;
}

/* ==================== root panel ==================== */

function CasePanel({consulting, setConsulting, apiKey, toasts, voiceEnabled, setVoiceEnabled, onGoToLearn, onGoToDrill, caseInit, isMobile}){
  const [view,setView]=useState('lobby'); // lobby | active | debrief
  const [activeCase,setActiveCase]=useState(null);
  const [pendingStart,setPendingStart]=useState(null); // case config awaiting mode/firm choice
  const [input,setInput]=useState('');
  const [streaming,setStreaming]=useState(false);
  const [streamText,setStreamText]=useState('');
  const [suggestedPhase,setSuggestedPhase]=useState(null); // Practice Mode advisory hint
  const [objInput,setObjInput]=useState('');
  const [objFeedback,setObjFeedback]=useState(null);
  const [objSubmitting,setObjSubmitting]=useState(false);
  const [showObjTips,setShowObjTips]=useState(false);
  const [objBannerOpen,setObjBannerOpen]=useState(true);
  const [focusExhibitId,setFocusExhibitId]=useState(null);
  const [scratchpadDraft,setScratchpadDraft]=useState('');
  const [mobileTab,setMobileTab]=useState('interview'); // interview | exhibit | notes
  const [now,setNow]=useState(Date.now());
  const scrollRef=useRef(null);
  const dict=useDictation(t=>{setInput(p=>p?p+' '+t:t);});

  useEffect(()=>{ if(caseInit) setPendingStart(getCaseConfig(caseInit)); }, [caseInit]);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[activeCase?.sessionLog,streamText]);
  useEffect(()=>{
    if(!activeCase || activeCase.state==='done' || activeCase.timer?.pausedAt) return;
    const t=setInterval(()=>setNow(Date.now()),1000);
    return ()=>clearInterval(t);
  },[activeCase?.state, activeCase?.timer?.pausedAt]);

  const loggedMagverseIds=new Set((consulting.caseLog||[]).filter(cl=>cl.magverseCaseId).map(cl=>cl.magverseCaseId));

  const updateCase=(patch)=>{
    setActiveCase(prev=>{ const nc={...prev,...patch}; setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===nc.id?nc:x)})); return nc; });
  };

  const startCase=(cfg, mode, firmStyleId)=>{
    const init=initialRevealState(cfg);
    const nc={ id:uid('cs'), title:cfg.title, industry:cfg.industry, type:cfg.id, mode, firmStyle:firmStyleId,
      state:'opening', sessionLog:[], competencyScores:{}, competencyNotes:{}, weaknesses:[], strengths:[],
      userObjective:'', objectiveFeedback:null, objectiveScore:null,
      revealedFactIds:init.factIds, revealedExhibitIds:init.exhibitIds, scratchpad:'',
      timer:{startedAt:Date.now(), pausedMs:0, pausedAt:null, finishedAt:null},
      startedAt:Date.now(), finishedAt:null, topNextCaseFocus:'', debriefInsight:'' };
    setConsulting(c=>({...c,cases:[...(c.cases||[]),nc]}));
    setActiveCase(nc); setView('active'); setStreamText(''); setObjInput(''); setObjFeedback(null); setScratchpadDraft(''); setPendingStart(null); setSuggestedPhase(null);
    sendInterviewerOpener(nc,cfg);
  };
  const resumeCase=(c)=>{
    setActiveCase(c); setView('active'); setScratchpadDraft(c.scratchpad||'');
    if(c.state==='objective'){setObjInput(c.userObjective||'');setObjFeedback(c.objectiveFeedback||null);}
    else{setObjInput('');setObjFeedback(null);}
  };

  const applyMeta=(nc, meta, cfg)=>{
    if(!meta) return nc;
    const revealedFactIds=[...new Set([...(nc.revealedFactIds||[]), ...meta.revealedFactIds])];
    const revealedExhibitIds=[...new Set([...(nc.revealedExhibitIds||[]), ...meta.revealedExhibitIds])];
    let state=nc.state;
    if(nc.mode==='interview'){ state=clampPhaseForward(nc.state, meta.phase); }
    else { setSuggestedPhase(meta.phase && meta.phase!==nc.state ? meta.phase : null); }
    return {...nc, revealedFactIds, revealedExhibitIds, state};
  };

  const sendInterviewerOpener=async(nc,cfg)=>{
    if(!apiKey){const updated={...nc,sessionLog:[{role:'interviewer',content:'Add your OpenAI API key in Settings to start.',at:Date.now()}]};setActiveCase(updated);setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===updated.id?updated:x)}));return;}
    setStreaming(true);
    try{
      const system=buildCaseInterviewerPrompt(cfg,'opening',nc.mode,nc.firmStyle,{factIds:nc.revealedFactIds,exhibitIds:nc.revealedExhibitIds},'');
      const raw=await streamFeedback(apiKey,system,'Introduce the case to the candidate now.',t=>setStreamText(stripCaseMeta(t)));
      const {cleanText,meta}=parseCaseMeta(raw);
      let updated={...nc, sessionLog:[{role:'interviewer',content:cleanText,at:Date.now()}]};
      updated=applyMeta(updated, meta, cfg);
      setActiveCase(updated); setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===updated.id?updated:x)}));
      setStreamText('');
    }catch(e){toasts.push('Error: '+e.message);}
    setStreaming(false);
  };

  const sendMessage=async()=>{
    if(!input.trim()||streaming||!activeCase)return;
    if(!apiKey){toasts.push('Add API key in Settings');return;}
    const cfg=getCaseConfig(activeCase.type);
    const userMsg={role:'candidate',content:input.trim(),at:Date.now()};
    const updatedLog=[...activeCase.sessionLog,userMsg];
    const uc={...activeCase,sessionLog:updatedLog};
    setActiveCase(uc); setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===uc.id?uc:x)}));
    setInput(''); setStreaming(true); setStreamText('');
    try{
      const history=updatedLog.slice(-14).map(m=>({role:m.role==='interviewer'?'assistant':'user',content:m.content}));
      const system=buildCaseInterviewerPrompt(cfg,uc.state,uc.mode,uc.firmStyle,{factIds:uc.revealedFactIds,exhibitIds:uc.revealedExhibitIds},uc.userObjective||'');
      const raw=await streamFeedback(apiKey,system,history,t=>setStreamText(stripCaseMeta(t)),400);
      const {cleanText,meta}=parseCaseMeta(raw);
      let fc={...uc, sessionLog:[...updatedLog,{role:'interviewer',content:cleanText,at:Date.now()}]};
      fc=applyMeta(fc, meta, cfg);
      setActiveCase(fc); setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===fc.id?fc:x)}));
      setStreamText('');
      if(fc.state==='debrief' && activeCase.state!=='debrief') runDebrief(fc);
    }catch(e){toasts.push('Error: '+e.message);}
    setStreaming(false);
  };

  const advanceState=()=>{ // Practice Mode only
    const next=nextManualState(activeCase.state);
    if(next===activeCase.state) return;
    updateCase({state:next});
    setSuggestedPhase(null);
    if(next==='debrief') runDebrief({...activeCase,state:next});
  };

  const evaluateObjective=async()=>{
    const text=objInput.trim();
    if(!text||objSubmitting||!apiKey)return;
    setObjSubmitting(true);
    try{
      const cfg=getCaseConfig(activeCase.type);
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},max_tokens:500,messages:[
        {role:'system',content:buildObjectiveEvalSystem(cfg)},{role:'user',content:`My case objective: "${text}"`}
      ]})});
      const j=await resp.json();
      const parsed=JSON.parse(j.choices[0].message.content);
      setObjFeedback(parsed);
      updateCase({userObjective:text, objectiveFeedback:parsed, objectiveScore:parsed.rating});
    }catch(e){toasts.push('Error: '+e.message);}
    setObjSubmitting(false);
  };
  const confirmObjective=()=>{ updateCase({state:'structure'}); setObjFeedback(null); setObjInput(''); setObjBannerOpen(true); };

  const runDebrief=async(nc)=>{
    if(!apiKey)return;
    setStreaming(true);
    try{
      const cfg=getCaseConfig(nc.type);
      const transcript=nc.sessionLog.map(m=>`${m.role==='interviewer'?'Interviewer':'Candidate'}: ${m.content}`).join('\n\n');
      const objLine=nc.userObjective?`\nCandidate's stated case objective: "${nc.userObjective}"`:'\nCandidate did not state a case objective.';
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},max_tokens:1000,messages:[
        {role:'system',content:buildCaseDebriefPrompt(cfg)},{role:'user',content:`Case type: ${nc.type}${objLine}\n\nTranscript:\n${transcript}`}
      ]})});
      const j=await resp.json();
      const parsed=JSON.parse(j.choices[0].message.content);
      const scores=parsed.competencyScores||{};
      const elapsedMs=computeElapsedMs(nc.timer, Date.now());
      const finished={...nc, state:'done', competencyScores:scores, competencyNotes:parsed.competencyNotes||{},
        objectiveDisciplineAssessment:parsed.objectiveDisciplineAssessment||'', weaknesses:parsed.weaknesses||[], strengths:parsed.strengths||[],
        debriefInsight:parsed.insight||'', topNextCaseFocus:parsed.topNextCaseFocus||'',
        timer:{...nc.timer, finishedAt:Date.now()}, finishedAt:Date.now()};
      setActiveCase(finished);
      setConsulting(c=>{
        const already=(c.cases||[]).find(x=>x.id===finished.id);
        if(already && already.state==='done') return {...c, cases:(c.cases||[]).map(x=>x.id===finished.id?finished:x)}; // idempotent guard
        const cases=(c.cases||[]).map(x=>x.id===finished.id?finished:x);
        const alreadyLogged=(c.caseLog||[]).some(cl=>cl.magverseCaseId===finished.id);
        const caseLog = alreadyLogged ? (c.caseLog||[]) : [...(c.caseLog||[]), buildAutoTrackerDraft(finished, cfg, elapsedMs)];
        return {...c, cases, caseLog};
      });
      Object.entries(scores).forEach(([comp,score])=>{
        recordConsultingEvidence({sourceType:'case', sourceId:finished.id, competency:comp, score, observation:(parsed.competencyNotes?.[comp]?.observed)||''}, setConsulting);
        if(score<6){
          const errEntry={id:uid('er'),dimension:comp,drillId:null,caseId:nc.id,description:(parsed.weaknesses||[]).find(w=>w.toLowerCase().includes(comp.toLowerCase()))||'Below threshold in '+comp,feedback:parsed.insight||'',createdAt:Date.now(),resolved:false};
          setConsulting(c=>({...c,errorLog:[...(c.errorLog||[]),errEntry]}));
        }
      });
      setView('debrief');
      toasts.push('Case complete — logged to Tracker');
    }catch(e){toasts.push('Debrief error: '+e.message);}
    setStreaming(false);
  };

  const saveScratchpad=()=>{ if(activeCase) updateCase({scratchpad:scratchpadDraft}); };

  const caseStateIdx=CASE_STATES.indexOf(activeCase?.state||'opening');
  const isObjPhase=activeCase?.state==='objective';
  const showObjBanner=['structure','exploration','synthesis','recommendation'].includes(activeCase?.state)&&activeCase?.userObjective;
  const RATING_COLOR_MAP={STRONG:'#34d399',SOLID:'#a5b4fc',DEVELOPING:'#f59e0b',WEAK:'#f87171'};

  return (
    <div style={{maxWidth:840}}>
      {view==='lobby' && (
        <CaseLibrary consulting={consulting} loggedMagverseIds={loggedMagverseIds} onResume={resumeCase} onRequestStart={cfg=>setPendingStart(cfg)} />
      )}
      {pendingStart && <CaseStartModal cfg={pendingStart} onStart={(mode,firm)=>startCase(pendingStart,mode,firm)} onClose={()=>setPendingStart(null)} />}

      {view==='debrief' && activeCase && (
        <CaseDebrief activeCase={activeCase} cfg={getCaseConfig(activeCase.type)} loggedMagverseIds={loggedMagverseIds}
          onGoToLearn={onGoToLearn} consulting={consulting} onBack={()=>setView('lobby')} />
      )}

      {view==='active' && activeCase && isObjPhase && (
        <ObjectiveStep activeCase={activeCase} cfg={getCaseConfig(activeCase.type)} objInput={objInput} setObjInput={setObjInput}
          objFeedback={objFeedback} objSubmitting={objSubmitting} evaluateObjective={evaluateObjective} confirmObjective={confirmObjective}
          showObjTips={showObjTips} setShowObjTips={setShowObjTips} onExit={()=>setView('lobby')} caseStateIdx={caseStateIdx} RATING_COLOR_MAP={RATING_COLOR_MAP} />
      )}

      {view==='active' && activeCase && !isObjPhase && (
        <ConsultingCaseWorkspace activeCase={activeCase} cfg={getCaseConfig(activeCase.type)} now={now}
          input={input} setInput={setInput} streaming={streaming} streamText={streamText} sendMessage={sendMessage}
          caseStateIdx={caseStateIdx} showObjBanner={showObjBanner} objBannerOpen={objBannerOpen} setObjBannerOpen={setObjBannerOpen}
          advanceState={advanceState} suggestedPhase={suggestedPhase}
          voiceEnabled={voiceEnabled} setVoiceEnabled={setVoiceEnabled} dict={dict}
          focusExhibitId={focusExhibitId} setFocusExhibitId={setFocusExhibitId}
          scratchpadDraft={scratchpadDraft} setScratchpadDraft={setScratchpadDraft} saveScratchpad={saveScratchpad}
          onGoToLearn={onGoToLearn} consulting={consulting} scrollRef={scrollRef}
          mobileTab={mobileTab} setMobileTab={setMobileTab} isMobile={isMobile}
          onExit={()=>setView('lobby')} onPause={()=>updateCase({timer:{...activeCase.timer, pausedAt:Date.now()}})}
          onResume={()=>updateCase({timer:{...activeCase.timer, pausedMs:(activeCase.timer.pausedMs||0)+(Date.now()-activeCase.timer.pausedAt), pausedAt:null}})} />
      )}
    </div>
  );
}

/* ==================== Case start modal — mode + firm style ==================== */

function CaseStartModal({cfg, onStart, onClose}){
  const [mode,setMode]=useState('practice');
  const [firm,setFirm]=useState('general');
  const styles=(cfg.supportedFirmStyles||INTERVIEW_STYLE_IDS).map(id=>getInterviewStyle(id));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative glass rounded-2xl p-5 max-w-md w-full border-subtle" style={{background:'rgba(10,10,15,0.98)'}}>
        <div className="text-sm font-semibold mb-1">{cfg.title}</div>
        <div className="text-xs mb-4" style={{color:CP.faint}}>{cfg.industry} · {cfg.difficulty} · ~{cfg.estimatedMin} min</div>

        <div className="text-xs font-semibold mb-2" style={{color:CP.faint}}>MODE</div>
        <div className="flex gap-2 mb-4">
          {[['practice','Practice','Visible phases, optional hints, Learn links.'],['interview','Interview','Realistic simulation — no phase labels, no hints, feedback only at the end.']].map(([id,label,desc])=>(
            <button key={id} onClick={()=>setMode(id)} className="flex-1 text-left p-2.5 rounded-lg" style={{background:mode===id?'rgba(99,102,241,0.18)':'rgba(255,255,255,0.03)', border:mode===id?'1px solid rgba(99,102,241,0.4)':'1px solid transparent'}}>
              <div className="text-xs font-semibold" style={{color:mode===id?CP.accent:CP.text}}>{label}</div>
              <div className="text-[11px] mt-0.5" style={{color:CP.faint}}>{desc}</div>
            </button>
          ))}
        </div>

        <div className="text-xs font-semibold mb-2" style={{color:CP.faint}}>FIRM STYLE</div>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {styles.map(s=>(
            <button key={s.id} onClick={()=>setFirm(s.id)} className="text-xs px-2.5 py-1 rounded-full" style={{background:firm===s.id?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)', color:firm===s.id?CP.accent:CP.faint}}>{s.label}</button>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <CPSecondaryButton onClick={onClose}>Cancel</CPSecondaryButton>
          <CPPrimaryButton onClick={()=>onStart(mode,firm)}>Start {mode==='interview'?'Interview':'Practice'}</CPPrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ==================== Lobby / library ==================== */

function CaseLibrary({consulting, loggedMagverseIds, onResume, onRequestStart}){
  const [filterType,setFilterType]=useState('');
  const [filterDiff,setFilterDiff]=useState('');
  const inProgress=(consulting.cases||[]).filter(c=>c.state!=='done'&&c.state!=='debrief');
  const pastDone=(consulting.cases||[]).filter(c=>c.state==='done').slice(-5).reverse();
  const recommended=getRecommendedNextCase(consulting);
  const DIFF_COLORS={Intermediate:'#f59e0b',Advanced:'#f87171'};
  const types=[...new Set(CASES_CATALOG.map(c=>c.caseType))];
  const diffs=[...new Set(CASES_CATALOG.map(c=>c.difficulty))];
  const filtered=CASES_CATALOG.filter(c=>(!filterType||c.caseType===filterType)&&(!filterDiff||c.difficulty===filterDiff));

  return (
    <div>
      {recommended && (
        <div className="glass rounded-xl p-4 border-subtle mb-4" style={{borderLeft:'3px solid #818cf8'}}>
          <div className="text-[11px] uppercase tracking-wide mb-1" style={{color:CP.accent}}>Recommended Next Case</div>
          <div className="text-sm font-semibold">{recommended.title}</div>
          <div className="text-xs mb-2" style={{color:CP.faint}}>{recommended.industry} · {recommended.difficulty}</div>
          <CPPrimaryButton small onClick={()=>onRequestStart(recommended)}>Start →</CPPrimaryButton>
        </div>
      )}
      {inProgress.length>0&&(
        <div className="glass rounded-xl p-4 border-subtle mb-5" style={{borderLeft:'3px solid #f59e0b'}}>
          <div className="text-xs font-semibold mb-3" style={{color:'#f59e0b'}}>IN PROGRESS</div>
          {inProgress.map(c=>(
            <div key={c.id} className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm font-medium">{c.title}</span>
                {c.mode==='practice' && <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>{CASE_STATE_LABELS[c.state]||c.state}</span>}
              </div>
              <button onClick={()=>onResume(c)} className="text-xs px-3 py-1 rounded-lg font-semibold" style={{background:'rgba(245,158,11,0.15)',color:'#f59e0b'}}>Resume →</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-sm font-semibold">Choose a case</div>
        <div className="flex gap-1.5 flex-wrap">
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="text-xs rounded-lg px-2 py-1" style={CP_FIELD}>
            <option value="">All types</option>{types.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterDiff} onChange={e=>setFilterDiff(e.target.value)} className="text-xs rounded-lg px-2 py-1" style={CP_FIELD}>
            <option value="">All difficulty</option>{diffs.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-3 mb-6" style={{gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))'}}>
        {filtered.map(cfg=>(
          <div key={cfg.id} className="glass rounded-xl p-5 border-subtle flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>{cfg.label}</span>
                <span className="text-xs" style={{color:DIFF_COLORS[cfg.difficulty]||'#64748b'}}>{cfg.difficulty}</span>
                <span className="text-xs" style={{color:'#475569'}}>~{cfg.estimatedMin}min</span>
              </div>
              <div className="text-sm font-semibold">{cfg.title}</div>
              <div className="text-xs mt-0.5" style={{color:'#64748b'}}>{cfg.industry}</div>
            </div>
            <div className="text-xs leading-relaxed" style={{color:'#94a3b8'}}>{cfg.description}</div>
            <CPPrimaryButton onClick={()=>onRequestStart(cfg)}>Start Case</CPPrimaryButton>
          </div>
        ))}
      </div>
      {pastDone.length>0&&(
        <div className="glass rounded-xl p-4 border-subtle">
          <div className="text-xs font-semibold mb-3" style={{color:'#64748b'}}>RECENT COMPLETIONS</div>
          {pastDone.map(c=>(
            <div key={c.id} className="py-2 border-b border-white/3 last:border-0">
              <div className="flex justify-between items-center">
                <span className="text-sm">{c.title}</span>
                <span className="text-xs" style={{color:'#64748b'}}>{new Date(c.startedAt).toLocaleDateString()}</span>
              </div>
              {c.competencyScores&&<div className="flex gap-3 flex-wrap mt-1">{Object.entries(c.competencyScores).map(([k,v])=><span key={k} className="text-xs" style={{color:v>=7?'#34d399':v>=5?'#f59e0b':'#f87171'}}>{(PRIMARY_COMPETENCY_LABELS[k]||k).slice(0,12)}:{v}</span>)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== Objective step (kept from Pass 1, field paths updated) ==================== */

function ObjectiveStep({activeCase, cfg, objInput, setObjInput, objFeedback, objSubmitting, evaluateObjective, confirmObjective, showObjTips, setShowObjTips, onExit, caseStateIdx, RATING_COLOR_MAP}){
  return (
    <div className="flex flex-col" style={{height:'calc(100vh - 140px)'}}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{activeCase.title}</span>
          {activeCase.mode==='practice' && <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(99,102,241,0.2)',color:'#818cf8'}}>Objective</span>}
        </div>
        <button onClick={onExit} className="text-xs px-2 py-1 rounded" style={{color:'#64748b'}}>Exit</button>
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="mb-5">
          <div className="text-lg font-bold mb-1" style={{color:'#e2e8f0',letterSpacing:'0.02em'}}>WHAT IS THE GOAL OF THIS CASE?</div>
          <div className="text-sm" style={{color:'#64748b'}}>Before you structure the problem, state the decision the client needs you to resolve.</div>
        </div>
        <div className="glass rounded-xl p-4 mb-4 text-sm leading-relaxed" style={{color:'#94a3b8',border:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="text-xs font-semibold mb-2" style={{color:'#475569'}}>CASE PROMPT</div>
          {cfg.prompt}
        </div>
        {!objFeedback?(
          <div className="flex flex-col gap-3 mb-4">
            <textarea value={objInput} onChange={e=>setObjInput(e.target.value)} rows={3}
              placeholder="e.g. Determine the root causes of the margin decline and recommend actions to restore profitability."
              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
              style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0'}}/>
            <CPPrimaryButton onClick={evaluateObjective} disabled={objSubmitting||!objInput.trim()}>{objSubmitting?'Evaluating…':'Submit Objective'}</CPPrimaryButton>
          </div>
        ):(
          <div className="flex flex-col gap-3 mb-4">
            <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
              <div className="text-xs font-bold tracking-widest mb-2" style={{color:'#475569'}}>YOUR OBJECTIVE</div>
              <div className="text-sm italic" style={{color:'#cbd5e1'}}>"{activeCase.userObjective}"</div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-base font-bold" style={{color:RATING_COLOR_MAP[objFeedback.rating]||'#e2e8f0'}}>{objFeedback.rating}</span>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(objFeedback.dimensions||{}).map(([k,v])=>(
                  <span key={k} className="text-xs px-2 py-0.5 rounded-full" style={{background:v?'rgba(52,211,153,0.1)':'rgba(248,113,113,0.1)',color:v?'#34d399':'#f87171',border:`1px solid ${v?'rgba(52,211,153,0.25)':'rgba(248,113,113,0.25)'}`}}>{v?'✓':''} {k.replace(/([A-Z])/g,' $1').trim()}</span>
                ))}
              </div>
            </div>
            <div className="text-sm leading-relaxed" style={{color:'#94a3b8'}}>{objFeedback.assessment}</div>
            {objFeedback.whatsMissing&&<div className="text-xs p-3 rounded-lg" style={{background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)',color:'#fbbf24'}}><span className="font-semibold">Missing: </span>{objFeedback.whatsMissing}</div>}
            {objFeedback.strongVersion&&(
              <div className="p-4 rounded-xl" style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)'}}>
                <div className="text-xs font-bold tracking-widest mb-2" style={{color:'#818cf8'}}>ONE STRONG VERSION</div>
                <div className="text-sm italic" style={{color:'#e2e8f0'}}>"{objFeedback.strongVersion}"</div>
              </div>
            )}
            <div className="flex gap-2 flex-wrap mt-1">
              <CPPrimaryButton onClick={confirmObjective}>Continue to Structure →</CPPrimaryButton>
              <CPSecondaryButton onClick={()=>{setObjFeedback(null);}}>Try Again</CPSecondaryButton>
            </div>
          </div>
        )}
        <div className="mt-2">
          <button onClick={()=>setShowObjTips(s=>!s)} className="text-xs flex items-center gap-1" style={{color:'#475569'}}>{showObjTips?'▼':'▶'} How to craft a strong case objective</button>
          {showObjTips&&(
            <div className="mt-3 glass rounded-xl p-5 text-xs leading-relaxed" style={{color:'#94a3b8',border:'1px solid rgba(255,255,255,0.06)'}}>
              Ask: what does the client actually need to DECIDE? Preserve any stated success metric. Include material constraints. Don't assume the answer — the objective defines what must be solved, not how.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== Active case workspace ==================== */

function ConsultingCaseWorkspace(props){
  const {activeCase, cfg, now, input, setInput, streaming, streamText, sendMessage, caseStateIdx, showObjBanner, objBannerOpen, setObjBannerOpen,
    advanceState, suggestedPhase, voiceEnabled, setVoiceEnabled, dict, focusExhibitId, setFocusExhibitId,
    scratchpadDraft, setScratchpadDraft, saveScratchpad, onGoToLearn, consulting, scrollRef, mobileTab, setMobileTab, isMobile, onExit, onPause, onResume}=props;
  const isPractice=activeCase.mode==='practice';
  const elapsed=computeElapsedMs(activeCase.timer, now);
  const isPaused=!!activeCase.timer.pausedAt;
  const revealedExhibits=(cfg.exhibits||[]).filter(ex=>(activeCase.revealedExhibitIds||[]).includes(ex.id));
  const focusExhibit=focusExhibitId ? cfg.exhibits.find(ex=>ex.id===focusExhibitId) : null;
  const hintModule=isPractice && onGoToLearn ? findModuleForCompetency(CASE_STATE_TO_COMPETENCY_HINT[activeCase.state]||'', consulting.learnProgress||{}) : null;

  const conversation=(
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{activeCase.title}</span>
          {isPractice && <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(99,102,241,0.2)',color:'#818cf8'}}>{CASE_STATE_LABELS[activeCase.state]||'Active'}</span>}
          {isPractice && <div className="flex gap-0.5">{CASE_STATES.slice(0,-1).map((s,i)=><div key={s} className="w-2 h-2 rounded-full" style={{background:i<=caseStateIdx?'#6366f1':'rgba(255,255,255,0.1)'}}/>)}</div>}
          <span className="text-xs font-mono" style={{color:CP.faint}}>{fmtCaseTimer(elapsed)}</span>
          {!isPaused ? <button onClick={onPause} className="text-xs px-2 py-0.5 rounded" style={{color:CP.faint,background:'rgba(255,255,255,0.05)'}}>Pause</button>
            : <button onClick={onResume} className="text-xs px-2 py-0.5 rounded" style={{color:'#34d399',background:'rgba(52,211,153,0.1)'}}>Resume</button>}
        </div>
        <div className="flex items-center gap-2">
          {isPractice && caseStateIdx<CASE_STATES.length-2 && (
            <button onClick={advanceState} disabled={streaming} className="text-xs px-3 py-1 rounded-lg" style={{background:'rgba(245,158,11,0.15)',color:'#f59e0b',opacity:streaming?0.4:1}}>Next Phase →</button>
          )}
          <button onClick={onExit} className="text-xs px-2 py-1 rounded" style={{color:'#64748b'}}>Exit</button>
        </div>
      </div>
      {isPractice && suggestedPhase && suggestedPhase!==activeCase.state && (
        <div className="flex-shrink-0 mb-2 text-xs px-3 py-1.5 rounded-lg" style={{background:'rgba(99,102,241,0.08)',color:CP.accent}}>Interviewer suggests moving to {CASE_STATE_LABELS[suggestedPhase]||suggestedPhase} — use "Next Phase" when ready.</div>
      )}
      {isPractice && hintModule && (
        <div className="flex-shrink-0 mb-2">
          <button onClick={()=>onGoToLearn(hintModule.id)} className="text-xs px-2 py-1 rounded" style={{color:'#a5b4fc',background:'rgba(99,102,241,0.08)'}}>Need a hint? Learn: {hintModule.title} →</button>
        </div>
      )}
      {showObjBanner&&(
        <div className="flex-shrink-0 mb-3 rounded-xl px-4 py-2.5 flex items-start gap-3" style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.18)'}}>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold tracking-widest mb-0.5" style={{color:'#818cf8'}}>CASE OBJECTIVE</div>
            {objBannerOpen&&<div className="text-xs leading-relaxed" style={{color:'#94a3b8'}}>{activeCase.userObjective}</div>}
          </div>
          <button onClick={()=>setObjBannerOpen(o=>!o)} className="text-xs flex-shrink-0 mt-0.5" style={{color:'#475569'}}>{objBannerOpen?'▲ hide':'▼ show'}</button>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {(activeCase.sessionLog||[]).map((m,i)=>(
          <div key={i} className={`flex ${m.role==='candidate'?'justify-end':''}`}>
            <div className="max-w-lg rounded-xl px-4 py-3 text-sm" style={{background:m.role==='interviewer'?'rgba(255,255,255,0.04)':'rgba(99,102,241,0.15)',color:'#e2e8f0'}}>
              <div className="text-xs mb-1 font-semibold" style={{color:m.role==='interviewer'?'#64748b':'#818cf8'}}>{m.role==='interviewer'?'Interviewer':'You'}</div>
              {m.content}
            </div>
          </div>
        ))}
        {streaming&&streamText&&(
          <div className="flex"><div className="max-w-lg rounded-xl px-4 py-3 text-sm" style={{background:'rgba(255,255,255,0.04)',color:'#94a3b8'}}>
            <div className="text-xs mb-1 font-semibold" style={{color:'#64748b'}}>Interviewer</div>{streamText}<span className="animate-pulse">▋</span>
          </div></div>
        )}
      </div>
      <div className="flex-shrink-0">
        <div className="flex gap-2 mb-1.5 items-center">
          <button onClick={()=>setVoiceEnabled&&setVoiceEnabled(!voiceEnabled)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{background:voiceEnabled?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.04)',border:`1px solid ${voiceEnabled?'rgba(99,102,241,0.4)':'rgba(255,255,255,0.08)'}`,color:voiceEnabled?'#818cf8':'#64748b'}}>🎙 Voice {voiceEnabled?'ON':'OFF'}</button>
        </div>
        <div className="flex gap-2">
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}} rows={2} placeholder="Your response… (Enter to send, Shift+Enter for newline)" className="flex-1 px-3 py-2 rounded-xl text-sm bg-transparent resize-none outline-none" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}} />
          <div className="flex flex-col gap-1">
            <button onClick={()=>{ if(!dict.hasSpeech){return;} dict.toggle(); }} title={dict.listening?'Stop':'Record'} className="px-3 rounded-lg text-xs" style={{background:dict.listening?'rgba(248,113,113,0.2)':'rgba(99,102,241,0.15)',color:dict.listening?'#f87171':'#818cf8',height:'50%'}}>{dict.listening?'⏹':'🎙'}</button>
            <button onClick={sendMessage} disabled={streaming||!input.trim()} className="px-3 rounded-lg text-xs font-semibold" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff',height:'50%',opacity:streaming||!input.trim()?0.4:1}}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );

  const exhibitPane=(
    <div>
      <div className="text-xs font-semibold mb-2" style={{color:CP.faint}}>EXHIBITS {revealedExhibits.length>0?`(${revealedExhibits.length})`:''}</div>
      {revealedExhibits.length===0 && <div className="text-xs" style={{color:CP.faint}}>None revealed yet — ask the interviewer for relevant data.</div>}
      <div className="space-y-2">
        {revealedExhibits.map(ex=>(
          <div key={ex.id} onClick={()=>setFocusExhibitId(ex.id)} style={{cursor:'pointer'}}>
            <ExhibitViewer exhibit={ex} mode="panel" onExpand={()=>setFocusExhibitId(ex.id)}/>
          </div>
        ))}
      </div>
    </div>
  );

  const notesPane=(
    <div>
      <div className="text-xs font-semibold mb-2" style={{color:CP.faint}}>SCRATCHPAD</div>
      <textarea value={scratchpadDraft} onChange={e=>setScratchpadDraft(e.target.value)} onBlur={saveScratchpad} rows={16}
        placeholder="Objective, structure, math, insights… (private, not graded unless you use it below)"
        className="w-full rounded-lg p-2 text-sm" style={CP_FIELD} />
    </div>
  );

  const focusModal = focusExhibit && <ExhibitViewer exhibit={focusExhibit} mode="focus" onClose={()=>setFocusExhibitId(null)}/>;

  if(isMobile){
    return (
      <div style={{height:'calc(100vh - 160px)'}} className="flex flex-col">
        <div className="flex gap-1 mb-3 flex-shrink-0">
          {[['interview','Interview'],['exhibit','Exhibit'],['notes','Notes']].map(([id,label])=>(
            <button key={id} onClick={()=>setMobileTab(id)} className="flex-1 py-1.5 rounded-lg text-xs font-medium" style={{background:mobileTab===id?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.04)',color:mobileTab===id?CP.accent:CP.faint}}>{label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {mobileTab==='interview' && conversation}
          {mobileTab==='exhibit' && exhibitPane}
          {mobileTab==='notes' && notesPane}
        </div>
        {focusModal}
      </div>
    );
  }
  return (
    <div className="grid gap-4" style={{gridTemplateColumns:'1fr 320px', height:'calc(100vh - 140px)'}}>
      <div>{conversation}</div>
      <div className="overflow-y-auto space-y-5">{exhibitPane}{notesPane}</div>
      {focusModal}
    </div>
  );
}
function fmtCaseTimer(ms){ const s=Math.floor(ms/1000); const m=Math.floor(s/60); return `${m}:${String(s%60).padStart(2,'0')}`; }
// Rough phase->competency mapping for Practice Mode's optional "Need a hint?" Learn deep-link.
const CASE_STATE_TO_COMPETENCY_HINT = {opening:'problemDefinition', clarify:'problemDefinition', structure:'structuring', exploration:'exhibitInterpretation', synthesis:'synthesis', recommendation:'recommendation'};

/* ==================== Debrief ==================== */

function CaseDebrief({activeCase, cfg, loggedMagverseIds, onGoToLearn, consulting, onBack}){
  const scores=activeCase.competencyScores||{};
  const notes=activeCase.competencyNotes||{};
  const overall=Object.values(scores).length ? Math.round(Object.values(scores).reduce((a,b)=>a+b,0)/Object.values(scores).length) : null;
  return (
    <div className="max-w-2xl">
      <div className="glass rounded-xl p-6 border-subtle mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Debrief — {activeCase.title}</div>
          {overall!=null && <div className="text-2xl font-bold" style={{color:overall>=7?'#34d399':overall>=5?'#f59e0b':'#f87171'}}>{overall}<span className="text-sm" style={{color:'#64748b'}}>/10</span></div>}
        </div>
        {activeCase.debriefInsight&&<div className="text-xs mb-4 p-3 rounded-lg" style={{background:'rgba(99,102,241,0.1)',color:'#818cf8'}}>{activeCase.debriefInsight}</div>}

        {activeCase.strengths?.length>0&&<div className="mb-3"><div className="text-xs font-semibold mb-1" style={{color:'#34d399'}}>STRENGTHS</div><ul className="space-y-1">{activeCase.strengths.map((s,i)=><li key={i} className="text-sm" style={{color:'#94a3b8'}}>+ {s}</li>)}</ul></div>}
        {activeCase.weaknesses?.length>0&&<div className="mb-4"><div className="text-xs font-semibold mb-1" style={{color:'#f87171'}}>TOP DEVELOPMENT AREAS</div><ul className="space-y-1">{activeCase.weaknesses.map((w,i)=><li key={i} className="text-sm" style={{color:'#94a3b8'}}>• {w}</li>)}</ul></div>}

        <div className="space-y-3 mb-4">
          {Object.entries(scores).map(([k,v])=>{
            const n=notes[k]||{};
            return (
              <div key={k} className="p-3 rounded-lg" style={{background:'rgba(255,255,255,0.03)'}}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{PRIMARY_COMPETENCY_LABELS[k]||k}</span>
                  <span className="text-sm font-bold" style={{color:v>=7?'#34d399':v>=5?'#f59e0b':'#f87171'}}>{v}/10</span>
                </div>
                {n.observed&&<div className="text-xs mb-1" style={{color:'#94a3b8'}}><span style={{color:'#64748b'}}>Observed: </span>{n.observed}</div>}
                {n.good&&<div className="text-xs mb-1" style={{color:'#34d399'}}>+ {n.good}</div>}
                {n.improve&&<div className="text-xs mb-1" style={{color:'#f59e0b'}}>↑ {n.improve}</div>}
                {n.nextRep&&<div className="text-xs" style={{color:'#818cf8'}}>Next rep: {n.nextRep}</div>}
              </div>
            );
          })}
        </div>

        {activeCase.topNextCaseFocus&&(
          <div className="p-3 rounded-lg mb-3" style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)'}}>
            <div className="text-xs font-bold tracking-widest mb-1" style={{color:'#818cf8'}}>TOP NEXT-CASE FOCUS</div>
            <div className="text-sm" style={{color:'#e2e8f0'}}>{activeCase.topNextCaseFocus}</div>
          </div>
        )}

        {onGoToLearn&&(()=>{
          const weakDims=Object.entries(scores).filter(([,v])=>v<6).map(([k])=>k);
          const mods=weakDims.map(d=>findModuleForCompetency(d, consulting.learnProgress||{})).filter(Boolean);
          const uniqueMods=[...new Map(mods.map(m=>[m.id,m])).values()].slice(0,2);
          return uniqueMods.length>0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {uniqueMods.map(m=><button key={m.id} onClick={()=>onGoToLearn(m.id)} className="text-xs px-2 py-1 rounded" style={{color:'#a5b4fc',background:'rgba(99,102,241,0.08)'}}>Learn: {m.title} →</button>)}
            </div>
          ) : null;
        })()}
      </div>
      <div style={{display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
        <CPSecondaryButton onClick={onBack}>← All Cases</CPSecondaryButton>
        <span className="text-xs" style={{color:loggedMagverseIds.has(activeCase.id)?'#34d399':'#64748b'}}>{loggedMagverseIds.has(activeCase.id)?'✓ Logged to Tracker automatically':''}</span>
      </div>
    </div>
  );
}
