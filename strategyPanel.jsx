// strategyPanel.jsx
// All Strategy tab UI. Classic Babel-transformed script — shares global scope with
// strategyContent.js (static content), strategyEngine.js (pure logic), and App.jsx
// (uid, ls, React hooks). Loaded after strategyEngine.js, before App.jsx.

const T = { text:'#e2e8f0', dim:'#cbd5e1', mid:'#94a3b8', faint:'#64748b', accent:'#a5b4fc', accentBright:'#818cf8', border:'rgba(255,255,255,0.08)' };
const FIELD_STYLE = {background:'rgba(255,255,255,0.04)', color:T.text, border:'1px solid '+T.border};
const STATUS_COLOR = { UNTESTED:'#64748b', WEAK:'#ef4444', DEVELOPING:'#f59e0b', STRONG:'#10b981', MASTERED:'#6366f1' };

/* ---------- shared primitives (replace 15+ repeated inline-style blocks) ---------- */

function Field({label, value, onBlur, onChange, rows, type='textarea', options, placeholder, controlled}){
  const cls = "w-full rounded-lg p-2 text-sm mt-0.5";
  return (
    <div>
      {label && <label className="text-xs" style={{color:T.faint}}>{label}</label>}
      {type==='textarea' && (controlled
        ? <textarea value={value} onChange={onChange} rows={rows||2} placeholder={placeholder} className={cls} style={FIELD_STYLE} />
        : <textarea defaultValue={value} onBlur={onBlur} rows={rows||2} placeholder={placeholder} className={cls} style={FIELD_STYLE} />)}
      {type==='text' && (controlled
        ? <input value={value} onChange={onChange} placeholder={placeholder} className={cls} style={FIELD_STYLE} />
        : <input defaultValue={value} onBlur={onBlur} placeholder={placeholder} className={cls} style={FIELD_STYLE} />)}
      {type==='number' && <input type="number" defaultValue={value} onBlur={onBlur} className={cls} style={FIELD_STYLE} />}
      {type==='date' && <input type="date" defaultValue={value} onBlur={onBlur} className={cls} style={FIELD_STYLE} />}
      {type==='select' && (
        <select defaultValue={value} onChange={onChange} className={cls} style={FIELD_STYLE}>
          {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </div>
  );
}
function PrimaryButton({onClick, children, small}){
  return <button onClick={onClick} className={`rounded-lg font-medium text-white ${small?'px-3 py-1.5 text-sm':'px-4 py-2 text-sm'}`} style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>{children}</button>;
}
function SecondaryButton({onClick, children}){
  return <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-sm" style={{background:'rgba(255,255,255,0.06)',color:T.mid}}>{children}</button>;
}
function Row({onClick, title, sub, right}){
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between text-left py-2.5" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
      <div className="min-w-0">
        <div className="text-sm truncate" style={{color:T.text}}>{title}</div>
        {sub && <div className="text-xs truncate" style={{color:T.faint}}>{sub}</div>}
      </div>
      {right}
    </button>
  );
}
function Pill({children, color}){
  return <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{background:'rgba(255,255,255,0.05)', color:color||T.mid}}>{children}</span>;
}

/* ---------- small pure helpers local to this file (concept-mastery record init) ---------- */

function initConceptEntry(conceptId, today){
  return {conceptId, label:CONCEPT_LABELS[conceptId], introduced:today, lastPracticed:null, timesPracticed:0,
    evidence:[], status:'DEVELOPING', nextReviewDate:addDaysStr(today,2), reviewIntervalDays:2};
}
function mergeIntroducedConcepts(conceptMastery, conceptIds, today){
  const cm = {...conceptMastery};
  (conceptIds||[]).forEach(cid=>{ if(!cm[cid]) cm[cid] = initConceptEntry(cid, today); });
  return cm;
}
function mergeCapabilityEvidenceInto(capabilities, evidenceMap){
  const caps = {...capabilities};
  Object.entries(evidenceMap).forEach(([capId, items])=>{
    const curr = caps[capId] || {evidence:[], status:'UNTESTED'};
    const evidence = [...curr.evidence, ...items];
    caps[capId] = {evidence, status:deriveMasteryStatus(evidence)};
  });
  return caps;
}

/* ==================== root panel ==================== */

const STRATEGY_TABS = [
  {id:'home', label:'Home'}, {id:'roadmap', label:'Roadmap'}, {id:'review', label:'Review'},
  {id:'frameworks', label:'Frameworks'}, {id:'sources', label:'Sources'}, {id:'cases', label:'Cases'},
  {id:'companies', label:'Companies'}, {id:'decisions', label:'Decisions'}, {id:'journal', label:'Journal'}, {id:'playbook', label:'Playbook'},
];
const NAV_KEY = 'magverse:strategy:nav';

function StrategyPanel({data, setData, toasts, isMobile}){
  const initialNav = (()=>{ try{ return JSON.parse(sessionStorage.getItem(NAV_KEY)||'{}'); }catch(e){ return {}; } })();
  const [tab, setTabRaw] = useState(initialNav.tab || 'home');
  const [activeLessonId, setActiveLessonId] = useState(initialNav.activeLessonId || null);
  const [activeCaseAttemptId, setActiveCaseAttemptId] = useState(initialNav.activeCaseAttemptId || null);
  const [activeCompanyId, setActiveCompanyId] = useState(initialNav.activeCompanyId || null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachContext, setCoachContext] = useState(null);
  const [pendingCaseId, setPendingCaseId] = useState(null);

  const setTab = (t) => setTabRaw(t);
  useEffect(()=>{
    try{ sessionStorage.setItem(NAV_KEY, JSON.stringify({tab, activeLessonId, activeCaseAttemptId, activeCompanyId})); }catch(e){}
  }, [tab, activeLessonId, activeCaseAttemptId, activeCompanyId]);
  useEffect(()=>{ if(tab!=='lesson' && tab!=='case') setCoachContext(null); }, [tab]);

  const strategy = emptyStrategy(data);
  const content = STRATEGY_CONTENT;
  const apiKey = data.settings?.apiKey || '';

  const upStrategy = (patch) => setData(d=>({...d, strategy:{...emptyStrategy(d), ...patch}}));

  useEffect(()=>{
    if((data.strategy?.companies||[]).length===0 && typeof STRATEGY_SEED_COMPANY_NVIDIA!=='undefined'){
      upStrategy({ companies:[{id:uid('co'), ...STRATEGY_SEED_COMPANY_NVIDIA, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()}] });
    }
  }, []);

  const bumpStreak = () => {
    setData(d=>{
      const s = emptyStrategy(d);
      const today = todayStr();
      if(s.streak.lastActiveDate === today) return d;
      const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
      const count = s.streak.lastActiveDate===yesterday ? (s.streak.count||0)+1 : 1;
      return {...d, strategy:{...s, streak:{count, lastActiveDate:today}}};
    });
  };

  const upWeekProgress = (weekId, patch) => {
    const curr = strategy.weekProgress[weekId] || {lessonsRead:[], reflections:{}};
    upStrategy({ weekProgress:{...strategy.weekProgress, [weekId]:{...curr, ...patch}} });
  };
  const saveReflectionDraft = (lessonId, weekId, text) => {
    setData(d=>{
      const s = emptyStrategy(d);
      const wp = s.weekProgress[weekId] || {lessonsRead:[], reflections:{}};
      return {...d, strategy:{...s, weekProgress:{...s.weekProgress, [weekId]:{...wp, reflections:{...(wp.reflections||{}), [lessonId]:text}}}}};
    });
  };
  const markLessonComplete = (lessonId, weekId, reflectionText) => {
    const today = todayStr();
    setData(d=>{
      const s = emptyStrategy(d);
      const wp = s.weekProgress[weekId] || {lessonsRead:[], reflections:{}};
      const lessonsRead = (wp.lessonsRead||[]).includes(lessonId) ? wp.lessonsRead : [...(wp.lessonsRead||[]), lessonId];
      return {...d, strategy:{...s,
        weekProgress:{...s.weekProgress, [weekId]:{...wp, lessonsRead, reflections:{...(wp.reflections||{}), [lessonId]:reflectionText}, completedAt:new Date().toISOString()}},
        conceptMastery: mergeIntroducedConcepts(s.conceptMastery, LESSON_TO_CONCEPT[lessonId], today),
      }};
    });
    bumpStreak();
    toasts.push('Lesson marked complete');
  };

  const addCaseAttempt = (caseContentId, focusDims) => {
    const id = uid('case');
    const attempt = { id, caseContentId, status:'in_progress', focusDims: focusDims||[],
      timer:{startedAt:Date.now(), pausedMs:0, pausedAt:null, finishedAt:null},
      dateStarted:new Date().toISOString(),
      scorecard:{ dimensions:Object.fromEntries(CASE_SCORECARD_DIMENSIONS.map(d=>[d.id,{score:0,whatWentWell:'',whatToImprove:''}])),
        strengths:'', weaknesses:'', keyLesson:'', feedback:'', areasToImprove:'', frameworksUsed:'', importantMistakes:'' },
      reflection:{diagnosedCorrectly:'', missed:'', strongestInsight:'', weakAssumption:'', wouldDoDifferently:'', nextPractice:''} };
    upStrategy({ cases:[...strategy.cases, attempt] });
    return id;
  };
  const updateCaseAttempt = (attemptId, patch) => {
    upStrategy({ cases: strategy.cases.map(c=>c.id===attemptId?{...c,...patch}:c) });
  };
  const onCaseFinished = (attempt, caseContent) => {
    bumpStreak();
    setData(d=>{
      const s = emptyStrategy(d);
      const caps = mergeCapabilityEvidenceInto(s.learnerModel.capabilities, evidenceFromCaseScorecard(attempt));
      const errs = detectErrorsFromCase(attempt).map(e=>({id:uid('err'), ts:new Date().toISOString(), ...e}));
      const consulting = d.consulting || {};
      return {...d,
        strategy:{...s, learnerModel:{capabilities:caps}, errorLog:[...s.errorLog, ...errs]},
        consulting:{...consulting, caseLog:[...(consulting.caseLog||[]), buildCaseTrackerEntry(attempt, caseContent)]},
      };
    });
    toasts.push('Case completed — logged to Case Tracker');
  };

  const addCompany = (seed={}) => {
    const id = uid('co');
    const company = { id, name:'New Company', industry:'', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(),
      linkedCaseId:null, status:'partial', fields:Object.fromEntries(COMPANY_ANALYSIS_FIELDS.map(f=>[f.id,''])), viewHistory:[], ...seed };
    upStrategy({ companies:[...strategy.companies, company] });
    return id;
  };
  const updateCompany = (id, patch) => {
    upStrategy({ companies: strategy.companies.map(c=>c.id===id?{...c,...patch,updatedAt:new Date().toISOString()}:c) });
  };

  const addDecision = (seed={}) => {
    const id = uid('dec');
    const decision = { id, decision:'', date:todayStr(), context:'', options:'', assumptions:'', baseRates:'',
      expectedUpside:'', expectedDownside:'', probability:'', reversibility:'', opportunityCost:'', keyUnknowns:'',
      whatWouldChangeMyMind:'', finalDecision:'', confidencePct:'', reviewDate:'', laterOutcome:null, wasProcessGood:null,
      _evidenceLogged:false, ...seed };
    upStrategy({ decisions:[...strategy.decisions, decision] });
    return id;
  };
  const updateDecision = (id, patch) => {
    upStrategy({ decisions: strategy.decisions.map(d=>d.id===id?{...d,...patch}:d) });
  };
  const reviewDecision = (id, patch) => {
    const existing = strategy.decisions.find(d=>d.id===id);
    const merged = {...existing, ...patch};
    const shouldLog = !merged._evidenceLogged && (merged.wasProcessGood===true || merged.wasProcessGood===false);
    if(!shouldLog){ updateDecision(id, patch); return; }
    setData(d=>{
      const s = emptyStrategy(d);
      const caps = mergeCapabilityEvidenceInto(s.learnerModel.capabilities, evidenceFromDecisionReview(merged));
      const errs = detectErrorsFromDecision(merged).map(e=>({id:uid('err'), ts:new Date().toISOString(), ...e}));
      const decisions = s.decisions.map(dec=>dec.id===id?{...dec,...patch,_evidenceLogged:true}:dec);
      return {...d, strategy:{...s, decisions, learnerModel:{capabilities:caps}, errorLog:[...s.errorLog, ...errs]}};
    });
  };

  const addJournalEntry = (text, tags) => {
    if(!text || !text.trim()) return;
    upStrategy({ journal:[...strategy.journal, {id:uid('j'), text, tags:tags||[], ts:new Date().toISOString()}] });
  };

  const addPlaybookPrinciple = (seed={}) => {
    const id = uid('pb');
    const principle = { id, principle:'', whyIBelieveIt:'', evidence:'', whenItFails:'', questionsItHelpsMeAsk:'',
      confidence:'medium', status:'active', createdAt:new Date().toISOString(), lastUpdatedAt:new Date().toISOString(), revisionHistory:[], ...seed };
    upStrategy({ playbook:[...strategy.playbook, principle] });
    return id;
  };
  const revisePlaybookPrinciple = (id, patch) => {
    upStrategy({ playbook: strategy.playbook.map(p=>{
      if(p.id!==id) return p;
      const history = patch.principle && patch.principle!==p.principle ? [...(p.revisionHistory||[]), {text:p.principle, ts:p.lastUpdatedAt}] : (p.revisionHistory||[]);
      return {...p, ...patch, revisionHistory:history, lastUpdatedAt:new Date().toISOString()};
    })});
  };
  const archivePlaybookPrinciple = (id) => {
    upStrategy({ playbook: strategy.playbook.map(p=>p.id===id?{...p,status:p.status==='archived'?'active':'archived'}:p) });
  };

  const toggleFrameworkLearned = (id) => {
    const curr = strategy.frameworksLearned||[];
    const turningOn = !curr.includes(id);
    const frameworksLearned = turningOn ? [...curr, id] : curr.filter(x=>x!==id);
    if(turningOn && FRAMEWORK_TO_CONCEPT[id]){
      const today = todayStr();
      setData(d=>{
        const s = emptyStrategy(d);
        return {...d, strategy:{...s, frameworksLearned, conceptMastery: mergeIntroducedConcepts(s.conceptMastery, FRAMEWORK_TO_CONCEPT[id], today)}};
      });
    } else {
      upStrategy({ frameworksLearned });
    }
  };

  const recordReview = (conceptId, score) => {
    const today = todayStr();
    setData(d=>{
      const s = emptyStrategy(d);
      const c = s.conceptMastery[conceptId] || initConceptEntry(conceptId, today);
      const evidence = [...c.evidence, {ts:new Date().toISOString(), score, source:'review'}];
      const sched = scheduleAfterEvidence(c, score, today);
      return {...d, strategy:{...s, conceptMastery:{...s.conceptMastery, [conceptId]:{...c, evidence, timesPracticed:(c.timesPracticed||0)+1, lastPracticed:today, status:deriveMasteryStatus(evidence), ...sched}}}};
    });
  };

  const saveNote = (title, text) => {
    if(!text || !text.trim()) return;
    setData(d=>({...d, notes:[...(d.notes||[]), buildNoteFromText(title, text)]}));
    toasts.push('Saved to Notes');
  };

  const openLesson = (lessonId) => { setActiveLessonId(lessonId); setTab('lesson'); };
  const openCase = (attemptId) => { setActiveCaseAttemptId(attemptId); setTab('case'); };
  const openCompany = (companyId) => { setActiveCompanyId(companyId); setTab('company'); };
  const requestStartCase = (caseContentId) => setPendingCaseId(caseContentId);
  const confirmStartCase = (focusDims) => { const cid = pendingCaseId; setPendingCaseId(null); openCase(addCaseAttempt(cid, focusDims)); };

  const nextSession = getNextStrategySession(strategy, content);

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold" style={{color:T.text}}>Strategy</h1>
          <p className="text-xs" style={{color:T.faint}}>Your long-term strategy-mastery workspace</p>
        </div>
        <PrimaryButton onClick={()=>setCoachOpen(true)}>Ask the Coach</PrimaryButton>
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {STRATEGY_TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{background: tab===t.id ? 'rgba(99,102,241,0.18)' : 'transparent', color: tab===t.id ? T.accent : T.mid, fontWeight: tab===t.id?600:400}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==='home' && <StrategyHome strategy={strategy} content={content} nextSession={nextSession} setTab={setTab} openLesson={openLesson} openCase={openCase} requestStartCase={requestStartCase} />}
      {tab==='roadmap' && <StrategyRoadmap strategy={strategy} content={content} openLesson={openLesson} />}
      {tab==='review' && <StrategyReview strategy={strategy} recordReview={recordReview} />}
      {tab==='lesson' && activeLessonId && <LessonViewer lessonId={activeLessonId} strategy={strategy} setCoachContext={setCoachContext}
        markLessonComplete={markLessonComplete} saveReflectionDraft={saveReflectionDraft} saveNote={saveNote} onBack={()=>setTab('roadmap')} />}
      {tab==='frameworks' && <FrameworkLibrary strategy={strategy} content={content} toggleFrameworkLearned={toggleFrameworkLearned} />}
      {tab==='sources' && <SourceLibrary strategy={strategy} content={content} upStrategy={upStrategy} />}
      {tab==='cases' && <CasePractice strategy={strategy} content={content} requestStartCase={requestStartCase} openCase={openCase} />}
      {tab==='case' && activeCaseAttemptId && <CaseWorkspace attemptId={activeCaseAttemptId} strategy={strategy} content={content}
        updateCaseAttempt={updateCaseAttempt} setCoachContext={setCoachContext} onCaseFinished={onCaseFinished} saveNote={saveNote} onBack={()=>setTab('cases')} />}
      {tab==='companies' && <CompanyAnalysis strategy={strategy} addCompany={addCompany} openCompany={openCompany} />}
      {tab==='company' && activeCompanyId && <CompanyDetail companyId={activeCompanyId} strategy={strategy} updateCompany={updateCompany}
        addJournalEntry={addJournalEntry} addDecision={addDecision} setTab={setTab} saveNote={saveNote} onBack={()=>setTab('companies')} />}
      {tab==='decisions' && <DecisionLab strategy={strategy} addDecision={addDecision} updateDecision={updateDecision} reviewDecision={reviewDecision} addJournalEntry={addJournalEntry} saveNote={saveNote} />}
      {tab==='journal' && <StrategyJournal strategy={strategy} content={content} addJournalEntry={addJournalEntry} addPlaybookPrinciple={addPlaybookPrinciple} setTab={setTab} />}
      {tab==='playbook' && <StrategyPlaybook strategy={strategy} addPlaybookPrinciple={addPlaybookPrinciple} revisePlaybookPrinciple={revisePlaybookPrinciple} archivePlaybookPrinciple={archivePlaybookPrinciple} saveNote={saveNote} />}

      {pendingCaseId && (
        <PreCaseFocusModal suggested={pickPreCaseFocus(strategy, 2)} onStart={confirmStartCase} onClose={()=>setPendingCaseId(null)} />
      )}
      {coachOpen && <StrategyCoachDrawer onClose={()=>setCoachOpen(false)} coachContext={coachContext} strategy={strategy} apiKey={apiKey} toasts={toasts} />}
    </div>
  );
}

/* ==================== Home ==================== */

function StatChip({label, value}){
  return <span className="text-xs" style={{color:T.faint}}>{value} {label}</span>;
}

function NextSessionCard({nextSession, openLesson, openCase, requestStartCase, setTab}){
  if(nextSession.type==='lesson') return (
    <>
      <div className="text-lg font-semibold mb-1" style={{color:T.text}}>{nextSession.title}</div>
      <div className="text-xs mb-3" style={{color:T.faint}}>{nextSession.sub}</div>
      <PrimaryButton onClick={()=>openLesson(nextSession.lessonId)}>Start lesson</PrimaryButton>
    </>
  );
  if(nextSession.type==='drill' || nextSession.type==='review') return (
    <>
      <div className="text-lg font-semibold mb-1" style={{color:T.text}}>{nextSession.title}</div>
      <div className="text-xs mb-3" style={{color:T.faint}}>{nextSession.sub}</div>
      <PrimaryButton onClick={()=>setTab('review')}>Start review</PrimaryButton>
    </>
  );
  if(nextSession.type==='case') return (
    <>
      <div className="text-lg font-semibold mb-1" style={{color:T.text}}>{nextSession.title}</div>
      <div className="text-xs mb-3" style={{color:T.faint}}>{nextSession.sub}</div>
      {nextSession.attemptId
        ? <PrimaryButton onClick={()=>openCase(nextSession.attemptId)}>Resume case</PrimaryButton>
        : <PrimaryButton onClick={()=>requestStartCase(nextSession.caseContentId)}>Start case</PrimaryButton>}
    </>
  );
  return <div className="text-sm" style={{color:T.mid}}>You've worked through all authored content. Review the Journal or Playbook, or revisit a case.</div>;
}

const STATUS_RANK = { WEAK:0, DEVELOPING:1, STRONG:2, MASTERED:3 };

function StrategyHome({strategy, content, nextSession, setTab, openLesson, openCase, requestStartCase}){
  const tested = CAPABILITY_IDS.map(id=>({id, status: deriveMasteryStatus(strategy.learnerModel.capabilities[id]?.evidence)}))
    .filter(c=>c.status!=='UNTESTED').sort((a,b)=>STATUS_RANK[a.status]-STATUS_RANK[b.status]);
  const recent = getJournalFeed(strategy, content).slice(0,4);
  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-5" style={{border:'1px solid rgba(99,102,241,0.25)'}}>
        <div className="text-[11px] uppercase tracking-wide mb-1" style={{color:T.accentBright}}>Continue</div>
        <NextSessionCard nextSession={nextSession} openLesson={openLesson} openCase={openCase} requestStartCase={requestStartCase} setTab={setTab} />
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide mb-1" style={{color:T.faint}}>Current development</div>
        {tested.length===0
          ? <div className="text-sm py-2" style={{color:T.faint}}>Complete a case or a decision review to start building your capability profile.</div>
          : <>
          <div className="text-[11px] mb-1" style={{color:T.faint}}>Weakest first — <span style={{color:STATUS_COLOR.WEAK}}>weak</span>, <span style={{color:STATUS_COLOR.DEVELOPING}}>developing</span>, <span style={{color:STATUS_COLOR.STRONG}}>strong</span>, <span style={{color:STATUS_COLOR.MASTERED}}>mastered</span></div>
          {tested.slice(0,6).map(c=>(
            <div key={c.id} className="flex items-center justify-between py-1.5" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span className="text-sm" style={{color:T.dim}}>{CAPABILITY_LABELS[c.id]}</span>
              <span className="text-xs font-medium" style={{color:STATUS_COLOR[c.status]}}>{c.status}</span>
            </div>
          ))}
          </>}
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide mb-1" style={{color:T.faint}}>Recent work</div>
        {recent.length===0
          ? <div className="text-sm py-2" style={{color:T.faint}}>Nothing yet.</div>
          : recent.map(item=>(
            <div key={item.id} className="py-1.5" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <div className="flex items-center gap-2">
                <Pill>{item.kind}</Pill>
                <span className="text-xs" style={{color:T.faint}}>{fmtRelDate(item.ts)}</span>
              </div>
              <div className="text-sm mt-0.5" style={{color:T.dim}}>{item.text.length>110 ? item.text.slice(0,110)+'…' : item.text}</div>
            </div>
          ))}
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide mb-2" style={{color:T.faint}}>Or do something else</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {[['cases','New Case'],['companies','New Company'],['decisions','New Decision'],['review','Review'],['journal','Journal'],['playbook','Playbook'],['frameworks','Frameworks']].map(([id,label])=>(
            <SecondaryButton key={id} onClick={()=>setTab(id)}>{label}</SecondaryButton>
          ))}
        </div>
        <div className="flex gap-4"><StatChip label="day streak" value={strategy.streak.count} /><StatChip label="hours logged" value={getTotalHours(strategy)} /></div>
      </div>
    </div>
  );
}

/* ==================== Roadmap / Review ==================== */

function StrategyRoadmap({strategy, content, openLesson}){
  const [openPhase, setOpenPhase] = useState(content.phases.find(p=>p.status==='authored')?.id);
  return (
    <div className="space-y-2">
      {content.phases.map(phase=>{
        const isOpen = openPhase===phase.id;
        const authored = phase.status==='authored';
        return (
          <div key={phase.id} className="glass rounded-xl overflow-hidden" style={{opacity: authored?1:0.55}}>
            <button onClick={()=>authored && setOpenPhase(isOpen?null:phase.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left" style={{cursor: authored?'pointer':'default'}}>
              <div>
                <span className="text-xs" style={{color:T.faint}}>Phase {phase.num}</span>
                <div className="text-sm font-medium" style={{color:T.text}}>{phase.name}</div>
              </div>
              {!authored && <Pill>Not yet authored</Pill>}
            </button>
            {isOpen && authored && (
              <div className="px-4 pb-3 space-y-3">
                {phase.weekIds.map(weekId=>{
                  const week = content.weeks[weekId];
                  const wp = strategy.weekProgress[weekId] || {lessonsRead:[]};
                  return (
                    <div key={weekId}>
                      <div className="text-xs font-medium mb-1" style={{color:T.mid}}>Week {week.num} — {week.name}</div>
                      <div className="space-y-1">
                        {week.lessonIds.map(lessonId=>{
                          const lesson = content.lessons[lessonId];
                          const done = (wp.lessonsRead||[]).includes(lessonId);
                          return (
                            <button key={lessonId} onClick={()=>openLesson(lessonId)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm hover:bg-white/5">
                              <span style={{width:8,height:8,borderRadius:99,background: done?'#10b981':'rgba(255,255,255,0.15)',flexShrink:0}}></span>
                              <span style={{color: done?T.mid:T.text}}>{lesson.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StrategyReview({strategy, recordReview}){
  const session = getReviewSession(strategy, 3);
  const [revealed, setRevealed] = useState({});
  if(session.length===0){
    return <div className="text-sm" style={{color:T.faint}}>Nothing to review yet — complete a lesson or mark a framework internalized first, then come back here.</div>;
  }
  return (
    <div className="space-y-4">
      {session.map(item=>(
        <div key={item.conceptId} className="glass rounded-xl p-4">
          <div className="text-xs mb-1" style={{color:T.accent}}>{CONCEPT_LABELS[item.conceptId]}</div>
          <div className="text-sm mb-2" style={{color:T.text}}>{item.prompt}</div>
          {!revealed[item.conceptId]
            ? <SecondaryButton onClick={()=>setRevealed(r=>({...r,[item.conceptId]:true}))}>Reveal</SecondaryButton>
            : (
              <>
                <div className="text-sm mb-3 p-2 rounded-lg" style={{background:'rgba(255,255,255,0.03)', color:T.dim}}>{item.reveal || '(no reference answer authored yet)'}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs" style={{color:T.faint}}>How'd you do?</span>
                  {[['Missed it',1],['Partial',3],['Nailed it',5]].map(([label,score])=>(
                    <button key={score} onClick={()=>{ recordReview(item.conceptId, score); setRevealed(r=>({...r,[item.conceptId]:false})); }}
                      className="text-xs px-2 py-1 rounded-lg" style={{background:'rgba(255,255,255,0.06)',color:T.mid}}>{label}</button>
                  ))}
                </div>
              </>
            )}
        </div>
      ))}
    </div>
  );
}

/* ==================== Lesson ==================== */

function LessonSection({title, children}){
  if(!children) return null;
  return (
    <details className="glass rounded-xl px-4 py-3" open>
      <summary className="text-sm font-medium cursor-pointer" style={{color:T.accent}}>{title}</summary>
      <div className="text-sm mt-2 leading-relaxed" style={{color:T.dim}}>{children}</div>
    </details>
  );
}

function LessonViewer({lessonId, strategy, markLessonComplete, saveReflectionDraft, saveNote, setCoachContext, onBack}){
  const content = STRATEGY_CONTENT;
  const lesson = content.lessons[lessonId];
  const weekId = lesson?.weekId;
  const wp = (weekId && strategy.weekProgress[weekId]) || {lessonsRead:[], reflections:{}};
  const done = (wp.lessonsRead||[]).includes(lessonId);
  const [reflection, setReflection] = useState((wp.reflections||{})[lessonId] || '');

  useEffect(()=>{ if(lesson) setCoachContext({type:'lesson', id:lessonId}); }, [lessonId]);
  useEffect(()=>{ setReflection((wp.reflections||{})[lessonId] || ''); }, [lessonId]);
  useEffect(()=>{
    if(!lesson) return;
    const t = setTimeout(()=>{ if(reflection !== ((wp.reflections||{})[lessonId]||'')) saveReflectionDraft(lessonId, weekId, reflection); }, 1500);
    return ()=>clearTimeout(t);
  }, [reflection]);

  if(!lesson) return (
    <div className="text-sm" style={{color:T.faint}}>Lesson not found. <button onClick={onBack} style={{color:T.accent}}>← Back to roadmap</button></div>
  );
  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-xs" style={{color:T.faint}}>← Back to roadmap</button>
      <h2 className="text-lg font-semibold" style={{color:T.text}}>{lesson.title}</h2>

      <LessonSection title="Core Idea">{lesson.coreIdea}</LessonSection>
      <LessonSection title="Why It Matters">{lesson.whyItMatters}</LessonSection>
      <LessonSection title="Mental Model">{lesson.mentalModel}</LessonSection>
      <LessonSection title="Real Company Example">{lesson.example}</LessonSection>
      <LessonSection title="Counterexample / Limitation">{lesson.limitation}</LessonSection>
      <LessonSection title="Source">{lesson.source}</LessonSection>

      <div className="glass rounded-xl px-4 py-3" style={{border:'1px solid rgba(99,102,241,0.2)'}}>
        <div className="text-sm font-medium mb-1" style={{color:T.accent}}>Application</div>
        <div className="text-sm" style={{color:T.dim}}>{lesson.application}</div>
      </div>
      <div className="glass rounded-xl px-4 py-3" style={{border:'1px solid rgba(139,92,246,0.2)'}}>
        <div className="text-sm font-medium mb-1" style={{color:'#c4b5fd'}}>Strategic Question</div>
        <div className="text-sm" style={{color:T.dim}}>{lesson.strategicQuestion}</div>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="text-sm font-medium mb-2" style={{color:T.text}}>What did you learn?</div>
        <textarea value={reflection} onChange={e=>setReflection(e.target.value)} onBlur={e=>saveReflectionDraft(lessonId, weekId, e.target.value)} rows={4}
          placeholder="Write your own answer before moving on..."
          className="w-full rounded-lg p-2 text-sm" style={FIELD_STYLE} />
        <div className="flex gap-2 mt-2">
          <button onClick={()=>markLessonComplete(lessonId, weekId, reflection)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{background: done?'#10b981':'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
            {done ? 'Update reflection' : 'Mark Complete'}
          </button>
          <SecondaryButton onClick={()=>saveNote(lesson.title, reflection)}>Save to Notes</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

/* ==================== Frameworks / Sources ==================== */

function FrameworkLibrary({strategy, content, toggleFrameworkLearned}){
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {content.frameworks.map(fw=>{
        const learned = (strategy.frameworksLearned||[]).includes(fw.id);
        return (
          <details key={fw.id} className="glass rounded-xl p-4">
            <summary className="cursor-pointer flex items-center justify-between">
              <span className="text-sm font-medium" style={{color:T.text}}>{fw.name}</span>
              {learned && <Pill color="#10b981">Internalized</Pill>}
            </summary>
            <div className="text-sm mt-3 space-y-2" style={{color:T.dim}}>
              <p>{fw.what}</p>
              <p><span style={{color:T.accent}}>When to use: </span>{fw.whenToUse}</p>
              <p><span style={{color:'#f59e0b'}}>When NOT to: </span>{fw.whenNotTo}</p>
              {fw.keyQuestions?.length>0 && <ul className="list-disc pl-4 space-y-0.5">{fw.keyQuestions.map((q,i)=><li key={i}>{q}</li>)}</ul>}
              <p><span style={{color:T.mid}}>Example: </span>{fw.example}</p>
              <p><span style={{color:T.mid}}>Limitations: </span>{fw.limitations}</p>
              <p className="text-xs" style={{color:T.faint}}>{fw.source}</p>
              <button onClick={()=>toggleFrameworkLearned(fw.id)} className="text-xs px-2 py-1 rounded-lg" style={{background:'rgba(255,255,255,0.05)',color:T.mid}}>
                {learned ? 'Unmark internalized' : 'Mark internalized'}
              </button>
            </div>
          </details>
        );
      })}
    </div>
  );
}

function SourceLibrary({strategy, content, upStrategy}){
  const setNote = (sourceId, text) => upStrategy({ sourceNotes:{...strategy.sourceNotes, [sourceId]:text} });
  return (
    <div className="space-y-3">
      <div className="text-xs px-3 py-2 rounded-lg" style={{background:'rgba(245,158,11,0.1)',color:'#f59e0b'}}>
        Catalog only — no file storage in this version. The original documents live wherever you originally uploaded them.
      </div>
      {content.sources.map(src=>(
        <div key={src.id} className="glass rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div>
              <div className="text-sm font-medium" style={{color:T.text}}>{src.title}</div>
              <div className="text-xs" style={{color:T.faint}}>{src.author} · {src.type}</div>
            </div>
            <div className="flex flex-wrap gap-1">{src.topics.map(t=><Pill key={t}>{t}</Pill>)}</div>
          </div>
          <Field type="textarea" value={strategy.sourceNotes[src.id]||''} onBlur={e=>setNote(src.id, e.target.value)} placeholder="Your notes on this source..." />
        </div>
      ))}
    </div>
  );
}

/* ==================== Cases ==================== */

function PreCaseFocusModal({suggested, onStart, onClose}){
  const [mode, setMode] = useState('accept');
  const [picked, setPicked] = useState(suggested);
  const toggle = (label) => setPicked(p=> p.includes(label) ? p.filter(x=>x!==label) : (p.length<2 ? [...p,label] : p));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative glass rounded-2xl p-5 max-w-sm w-full" style={{background:'rgba(10,10,15,0.98)'}}>
        <div className="text-sm font-medium mb-2" style={{color:T.text}}>Focus for this case</div>
        {mode==='accept' ? (
          <>
            <div className="text-xs mb-3" style={{color:T.faint}}>Based on your last few cases:</div>
            <div className="flex flex-wrap gap-1 mb-4">
              {suggested.length ? suggested.map(l=><Pill key={l} color={T.accent}>{l}</Pill>) : <span className="text-xs" style={{color:T.faint}}>Not enough case history yet — no suggestion.</span>}
            </div>
          </>
        ) : (
          <div className="mb-4 space-y-1 max-h-48 overflow-auto">
            {CASE_SCORECARD_DIMENSIONS.map(d=>(
              <label key={d.id} className="flex items-center gap-2 text-sm" style={{color:T.dim}}>
                <input type="checkbox" checked={picked.includes(d.label)} onChange={()=>toggle(d.label)} /> {d.label}
              </label>
            ))}
          </div>
        )}
        <div className="flex gap-2 justify-end flex-wrap">
          <SecondaryButton onClick={()=>onStart([])}>Skip focus</SecondaryButton>
          {mode==='accept' && <SecondaryButton onClick={()=>setMode('change')}>Change focus</SecondaryButton>}
          <PrimaryButton small onClick={()=>onStart(mode==='accept'?suggested:picked)}>{mode==='accept' ? 'Accept & start' : 'Start with these'}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function CasePractice({strategy, content, requestStartCase, openCase}){
  const cases = Object.values(content.cases);
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wide mb-2" style={{color:T.faint}}>Available cases</div>
        {cases.map(c=>(
          <Row key={c.id} onClick={()=>requestStartCase(c.id)} title={c.title} sub={`${c.industry} · ${c.type} · ${c.difficulty} · ~${c.suggestedTimeMin} min`}
            right={<PrimaryButton small onClick={(e)=>{e.stopPropagation(); requestStartCase(c.id);}}>Start</PrimaryButton>} />
        ))}
      </div>
      {strategy.cases.length>0 && (
        <div>
          <div className="text-xs uppercase tracking-wide mb-2" style={{color:T.faint}}>Your attempts</div>
          {[...strategy.cases].reverse().map(a=>{
            const c = content.cases[a.caseContentId];
            const avg = Object.values(a.scorecard?.dimensions||{}).reduce((s,d)=>s+(d.score||0),0) / (CASE_SCORECARD_DIMENSIONS.length||1);
            return (
              <Row key={a.id} onClick={()=>openCase(a.id)} title={c?.title} sub={`${fmtRelDate(a.dateStarted)} · ${a.status==='completed'?'Completed':'In progress'}`}
                right={a.status==='completed' && <span className="text-sm font-semibold" style={{color:T.accent}}>{avg.toFixed(1)}/5</span>} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScoreDots({value, onChange}){
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n=>(
        <button key={n} onClick={()=>onChange(n)} className="w-6 h-6 rounded-full text-[11px] flex items-center justify-center"
          style={{background: n<=value ? '#6366f1' : 'rgba(255,255,255,0.06)', color: n<=value ? '#fff' : T.faint}}>{n}</button>
      ))}
    </div>
  );
}

function CaseWorkspace({attemptId, strategy, content, updateCaseAttempt, setCoachContext, onCaseFinished, saveNote, onBack}){
  const attempt = strategy.cases.find(c=>c.id===attemptId);
  const c = attempt ? content.cases[attempt.caseContentId] : null;
  const [now, setNow] = useState(Date.now());

  useEffect(()=>{ if(c) setCoachContext({type:'case', id:c.id}); }, [c?.id]);
  useEffect(()=>{
    if(!attempt || attempt.status==='completed' || attempt.timer.pausedAt) return;
    const t = setInterval(()=>setNow(Date.now()), 1000);
    return ()=>clearInterval(t);
  }, [attempt?.status, attempt?.timer?.pausedAt]);

  if(!attempt || !c) return (
    <div className="text-sm" style={{color:T.faint}}>Case attempt not found. <button onClick={onBack} style={{color:T.accent}}>← Back to cases</button></div>
  );
  const elapsed = computeElapsedMs(attempt.timer, now);
  const isPaused = !!attempt.timer.pausedAt;
  const isDone = attempt.status==='completed';

  const pause = () => updateCaseAttempt(attemptId, {timer:{...attempt.timer, pausedAt:Date.now()}});
  const resume = () => updateCaseAttempt(attemptId, {timer:{...attempt.timer, pausedMs:(attempt.timer.pausedMs||0)+(Date.now()-attempt.timer.pausedAt), pausedAt:null}});
  const setDim = (dimId, patch) => updateCaseAttempt(attemptId, {scorecard:{...attempt.scorecard, dimensions:{...attempt.scorecard.dimensions, [dimId]:{...attempt.scorecard.dimensions[dimId], ...patch}}}});
  const setScorecard = (patch) => updateCaseAttempt(attemptId, {scorecard:{...attempt.scorecard, ...patch}});
  const setReflection = (patch) => updateCaseAttempt(attemptId, {reflection:{...attempt.reflection, ...patch}});
  const finish = () => {
    if(isDone) return; // guard against double-invocation (rapid double-click) creating duplicate evidence/Case Tracker entries
    const extraPause = attempt.timer.pausedAt ? (Date.now()-attempt.timer.pausedAt) : 0;
    const finished = {...attempt, status:'completed', timer:{...attempt.timer, pausedMs:(attempt.timer.pausedMs||0)+extraPause, finishedAt:Date.now(), pausedAt:null}};
    updateCaseAttempt(attemptId, {status:'completed', timer:finished.timer});
    onCaseFinished(finished, c);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs" style={{color:T.faint}}>← Back to cases</button>
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h2 className="text-lg font-semibold" style={{color:T.text}}>{c.title}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono" style={{color:T.mid}}>{fmtDuration(elapsed)}</span>
            {!isDone && (isPaused
              ? <button onClick={resume} className="text-xs px-2 py-1 rounded-lg" style={{background:'rgba(16,185,129,0.15)',color:'#10b981'}}>Resume</button>
              : <button onClick={pause} className="text-xs px-2 py-1 rounded-lg" style={{background:'rgba(255,255,255,0.06)',color:T.mid}}>Pause</button>)}
          </div>
        </div>
        {attempt.focusDims?.length>0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="text-xs" style={{color:T.faint}}>Focus:</span>
            {attempt.focusDims.map(l=><Pill key={l} color={T.accent}>{l}</Pill>)}
          </div>
        )}
        <p className="text-sm whitespace-pre-line" style={{color:T.dim}}>{c.prompt}</p>
        <details className="mt-3">
          <summary className="text-xs cursor-pointer" style={{color:T.accent}}>Exhibits</summary>
          <ul className="text-sm mt-2 space-y-1 list-disc pl-4" style={{color:T.mid}}>{c.exhibits.map((e,i)=><li key={i}>{e}</li>)}</ul>
        </details>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-medium mb-3" style={{color:T.text}}>Scorecard</div>
        <div className="space-y-3">
          {CASE_SCORECARD_DIMENSIONS.map(dim=>{
            const d = attempt.scorecard.dimensions[dim.id];
            return (
              <div key={dim.id} className="border-b pb-2" style={{borderColor:'rgba(255,255,255,0.06)'}}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{color:T.dim}}>{dim.label}</span>
                  <ScoreDots value={d.score} onChange={v=>setDim(dim.id,{score:v})} />
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mt-1">
                  <input defaultValue={d.whatWentWell} onBlur={e=>setDim(dim.id,{whatWentWell:e.target.value})} placeholder="What went well"
                    className="text-xs rounded-lg px-2 py-1.5" style={FIELD_STYLE} />
                  <input defaultValue={d.whatToImprove} onBlur={e=>setDim(dim.id,{whatToImprove:e.target.value})} placeholder="What to improve"
                    className="text-xs rounded-lg px-2 py-1.5" style={FIELD_STYLE} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid sm:grid-cols-2 gap-2 mt-4">
          {[['strengths','Strengths'],['weaknesses','Weaknesses'],['keyLesson','Key Lesson'],['feedback','Feedback'],['areasToImprove','Areas to Improve'],['frameworksUsed','Frameworks Used'],['importantMistakes','Important Mistakes']].map(([k,label])=>(
            <Field key={k} label={label} value={attempt.scorecard[k]} onBlur={e=>setScorecard({[k]:e.target.value})} />
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-medium mb-3" style={{color:T.text}}>Reflection</div>
        <div className="space-y-2">
          {[['diagnosedCorrectly','What did I diagnose correctly?'],['missed','What did I miss?'],['strongestInsight','What was my strongest insight?'],
            ['weakAssumption','What assumption was weak?'],['wouldDoDifferently','What would I do differently?'],['nextPractice','What should I practice next?']].map(([k,label])=>(
            <Field key={k} label={label} value={attempt.reflection[k]} onBlur={e=>setReflection({[k]:e.target.value})} />
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          {!isDone && <PrimaryButton onClick={finish}>Finish Case</PrimaryButton>}
          {isDone && <div className="text-xs self-center" style={{color:'#10b981'}}>Completed {fmtRelDate(attempt.timer.finishedAt)}</div>}
          <SecondaryButton onClick={()=>saveNote(c.title, attempt.scorecard.keyLesson || attempt.reflection.strongestInsight || '')}>Save to Notes</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

/* ==================== Companies ==================== */

function CompanyAnalysis({strategy, addCompany, openCompany}){
  return (
    <div>
      <PrimaryButton small onClick={()=>openCompany(addCompany())}>New Company</PrimaryButton>
      {strategy.companies.length===0 && <div className="text-sm mt-3" style={{color:T.faint}}>No companies yet.</div>}
      <div className="mt-2">
        {[...strategy.companies].reverse().map(co=>(
          <Row key={co.id} onClick={()=>openCompany(co.id)} title={co.name} sub={co.industry || 'No industry set'}
            right={<Pill color={co.status==='complete'?'#10b981':'#f59e0b'}>{co.status}</Pill>} />
        ))}
      </div>
    </div>
  );
}

function CompanyDetail({companyId, strategy, updateCompany, addJournalEntry, addDecision, setTab, saveNote, onBack}){
  const co = strategy.companies.find(c=>c.id===companyId);
  const [viewNote, setViewNote] = useState('');
  if(!co) return (
    <div className="text-sm" style={{color:T.faint}}>Company not found. <button onClick={onBack} style={{color:T.accent}}>← Back to companies</button></div>
  );
  const sections = [...new Set(COMPANY_ANALYSIS_FIELDS.map(f=>f.section))];
  const addViewHistory = () => {
    if(!viewNote.trim()) return;
    updateCompany(companyId, {viewHistory:[...(co.viewHistory||[]), {ts:new Date().toISOString(), note:viewNote}]});
    setViewNote('');
  };
  const thesisText = () => COMPANY_ANALYSIS_FIELDS.filter(f=>f.section==='Thesis').map(f=>co.fields[f.id]).filter(Boolean).join('\n');
  const saveToJournal = () => { addJournalEntry(thesisText() || `Notes on ${co.name}`, [co.name]); };
  const createDecision = () => { addDecision({context:`Re: ${co.name} — ${co.industry||''}`}); setTab('decisions'); };

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="text-xs" style={{color:T.faint}}>← Back to companies</button>
      <div className="glass rounded-2xl p-4 flex gap-3 flex-wrap items-center">
        <input defaultValue={co.name} onBlur={e=>updateCompany(companyId,{name:e.target.value})} placeholder="Company name"
          className="flex-1 rounded-lg px-3 py-2 text-lg font-semibold" style={{...FIELD_STYLE,minWidth:220}} />
        <input defaultValue={co.industry} onBlur={e=>updateCompany(companyId,{industry:e.target.value})} placeholder="Industry"
          className="rounded-lg px-3 py-2 text-sm" style={{...FIELD_STYLE,minWidth:180}} />
        <select defaultValue={co.status} onChange={e=>updateCompany(companyId,{status:e.target.value})} className="rounded-lg px-3 py-2 text-sm" style={FIELD_STYLE}>
          <option value="partial">Partial</option>
          <option value="complete">Complete</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <SecondaryButton onClick={saveToJournal}>Save to Journal</SecondaryButton>
        <SecondaryButton onClick={createDecision}>Create Decision</SecondaryButton>
        <SecondaryButton onClick={()=>saveNote(co.name, thesisText())}>Save to Notes</SecondaryButton>
      </div>

      {sections.map(section=>(
        <div key={section} className="glass rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wide mb-2" style={{color:T.accentBright}}>{section}</div>
          <div className="space-y-3">
            {COMPANY_ANALYSIS_FIELDS.filter(f=>f.section===section).map(f=>(
              <Field key={f.id} label={f.label} value={co.fields[f.id]} onBlur={e=>updateCompany(companyId,{fields:{...co.fields,[f.id]:e.target.value}})} />
            ))}
          </div>
        </div>
      ))}

      <div className="glass rounded-2xl p-4">
        <div className="text-xs uppercase tracking-wide mb-2" style={{color:T.accentBright}}>How has my view changed?</div>
        <div className="flex gap-2">
          <input value={viewNote} onChange={e=>setViewNote(e.target.value)} placeholder="What changed, and why?"
            className="flex-1 rounded-lg px-3 py-2 text-sm" style={FIELD_STYLE} />
          <SecondaryButton onClick={addViewHistory}>Add</SecondaryButton>
        </div>
        {(co.viewHistory||[]).length>0 && (
          <div className="mt-3 space-y-2">
            {[...co.viewHistory].reverse().map((v,i)=>(
              <div key={i} className="text-sm" style={{color:T.mid}}><span className="text-xs" style={{color:T.faint}}>{fmtRelDate(v.ts)}: </span>{v.note}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== Decisions ==================== */

function decisionQuadrant(d){
  if(d.wasProcessGood===null || d.wasProcessGood===undefined || d.laterOutcome===null || d.laterOutcome===undefined) return {label:'Pending review', color:T.faint};
  if(d.wasProcessGood && d.laterOutcome==='good') return {label:'Good decision / good outcome', color:'#10b981'};
  if(d.wasProcessGood && d.laterOutcome==='bad') return {label:'Good decision / bad outcome', color:'#f59e0b'};
  if(!d.wasProcessGood && d.laterOutcome==='good') return {label:'Bad decision / good outcome', color:'#f59e0b'};
  return {label:'Bad decision / bad outcome', color:'#ef4444'};
}

function DecisionLab({strategy, addDecision, updateDecision, reviewDecision, addJournalEntry, saveNote}){
  const [openId, setOpenId] = useState(null);
  return (
    <div>
      <PrimaryButton small onClick={()=>{ const id=addDecision(); setOpenId(id); }}>New Decision</PrimaryButton>
      {strategy.decisions.length===0 && <div className="text-sm mt-3" style={{color:T.faint}}>No decisions logged yet.</div>}
      {[...strategy.decisions].reverse().map(d=>{
        const q = decisionQuadrant(d);
        const isOpen = openId===d.id;
        return (
          <div key={d.id} className="glass rounded-xl mt-2">
            <button onClick={()=>setOpenId(isOpen?null:d.id)} className="w-full flex items-center justify-between px-4 py-3 text-left">
              <div>
                <div className="text-sm font-medium" style={{color:T.text}}>{d.decision || 'Untitled decision'}</div>
                <div className="text-xs" style={{color:T.faint}}>{d.date}</div>
              </div>
              <Pill color={q.color}>{q.label}</Pill>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-2">
                {[['decision','Decision'],['context','Context'],['options','Options'],['assumptions','Assumptions'],['baseRates','Base Rates'],
                  ['expectedUpside','Expected Upside'],['expectedDownside','Expected Downside'],['reversibility','Reversibility'],['opportunityCost','Opportunity Cost'],
                  ['keyUnknowns','Key Unknowns'],['whatWouldChangeMyMind','What Evidence Would Change My Mind?'],['finalDecision','Final Decision']].map(([k,label])=>(
                  <Field key={k} label={label} value={d[k]} rows={k==='decision'?1:2} onBlur={e=>updateDecision(d.id,{[k]:e.target.value})} />
                ))}
                <div className="grid sm:grid-cols-3 gap-2">
                  <Field label="Probability %" type="number" value={d.probability} onBlur={e=>updateDecision(d.id,{probability:e.target.value})} />
                  <Field label="Confidence %" type="number" value={d.confidencePct} onBlur={e=>updateDecision(d.id,{confidencePct:e.target.value})} />
                  <Field label="Review Date" type="date" value={d.reviewDate} onBlur={e=>updateDecision(d.id,{reviewDate:e.target.value})} />
                </div>
                <div className="border-t pt-2 mt-2" style={{borderColor:'rgba(255,255,255,0.06)'}}>
                  <div className="text-xs uppercase tracking-wide mb-2" style={{color:T.accentBright}}>Review (fill in once you know)</div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Field label="Was my process good?" type="select" value={d.wasProcessGood===null||d.wasProcessGood===undefined?'':String(d.wasProcessGood)}
                      onChange={e=>reviewDecision(d.id,{wasProcessGood: e.target.value===''?null:e.target.value==='true'})}
                      options={[{value:'',label:'Not yet reviewed'},{value:'true',label:'Yes'},{value:'false',label:'No'}]} />
                    <Field label="Later outcome" type="select" value={d.laterOutcome||''}
                      onChange={e=>{
                        const firstTimeSet = !d.laterOutcome && e.target.value;
                        updateDecision(d.id,{laterOutcome: e.target.value||null});
                        if(firstTimeSet) addJournalEntry(`Outcome of "${d.decision||'decision'}": ${e.target.value}. ${d.finalDecision||''}`, ['decision']);
                      }}
                      options={[{value:'',label:'Not yet known'},{value:'good',label:'Good'},{value:'bad',label:'Bad'}]} />
                  </div>
                </div>
                <SecondaryButton onClick={()=>saveNote(d.decision||'Decision', d.finalDecision||'')}>Save to Notes</SecondaryButton>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ==================== Journal / Playbook ==================== */

function StrategyJournal({strategy, content, addJournalEntry, addPlaybookPrinciple, setTab}){
  const [draft, setDraft] = useState('');
  const feed = getJournalFeed(strategy, content);
  const promote = (item) => { addPlaybookPrinciple({principle:item.text, promotedFrom:item.id}); setTab('playbook'); };
  return (
    <div className="space-y-3">
      <div className="glass rounded-xl p-4">
        <textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={3} placeholder="Write a journal entry..." className="w-full rounded-lg p-2 text-sm" style={FIELD_STYLE} />
        <SecondaryButton onClick={()=>{ addJournalEntry(draft, []); setDraft(''); }}>Add entry</SecondaryButton>
      </div>
      {feed.length===0 && <div className="text-sm" style={{color:T.faint}}>Nothing yet — entries also appear automatically from lesson reflections, case reflections, and decisions.</div>}
      {feed.map(item=>{
        const promoted = strategy.playbook.some(p=>p.promotedFrom===item.id);
        return (
          <div key={item.id} className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Pill>{item.kind}</Pill>
              {item.tags.map(t=><span key={t} className="text-[10px]" style={{color:T.faint}}>{t}</span>)}
              <span className="text-[10px] ml-auto" style={{color:T.faint}}>{fmtRelDate(item.ts)}</span>
            </div>
            <div className="text-sm mb-2" style={{color:T.dim}}>{item.text}</div>
            {promoted
              ? <span className="text-xs" style={{color:T.faint}}>Promoted to Playbook</span>
              : <button onClick={()=>promote(item)} className="text-xs" style={{color:T.accent}}>Promote to Playbook →</button>}
          </div>
        );
      })}
    </div>
  );
}

function StrategyPlaybook({strategy, addPlaybookPrinciple, revisePlaybookPrinciple, archivePlaybookPrinciple, saveNote}){
  const [showArchived, setShowArchived] = useState(false);
  const list = strategy.playbook.filter(p=>showArchived ? p.status==='archived' : p.status==='active');
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <PrimaryButton small onClick={()=>addPlaybookPrinciple()}>New Principle</PrimaryButton>
        <button onClick={()=>setShowArchived(s=>!s)} className="text-xs" style={{color:T.faint}}>{showArchived?'Show active':'Show archived'}</button>
      </div>
      {list.length===0 && <div className="text-sm" style={{color:T.faint}}>Only add a principle once you've actually tested it against a case or decision — not famous quotes.</div>}
      {[...list].reverse().map(p=>{
        const complete = p.principle && p.whyIBelieveIt && p.evidence && p.whenItFails;
        return (
          <div key={p.id} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <input defaultValue={p.principle} onBlur={e=>revisePlaybookPrinciple(p.id,{principle:e.target.value})} placeholder="Principle"
                className="flex-1 rounded-lg px-2 py-1.5 text-sm font-medium" style={FIELD_STYLE} />
              {!complete && <Pill color="#f59e0b">Draft</Pill>}
            </div>
            {[['whyIBelieveIt','Why I believe it'],['evidence','Evidence / cases'],['whenItFails','When it fails'],['questionsItHelpsMeAsk','Questions it helps me ask']].map(([k,label])=>(
              <Field key={k} label={label} value={p[k]} onBlur={e=>revisePlaybookPrinciple(p.id,{[k]:e.target.value})} />
            ))}
            <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
              <select defaultValue={p.confidence} onChange={e=>revisePlaybookPrinciple(p.id,{confidence:e.target.value})} className="rounded-lg px-2 py-1 text-xs" style={FIELD_STYLE}>
                <option value="high">High confidence</option>
                <option value="medium">Medium confidence</option>
                <option value="low">Low confidence</option>
              </select>
              <div className="flex gap-2">
                <button onClick={()=>saveNote(p.principle||'Principle', p.evidence||'')} className="text-xs" style={{color:T.faint}}>Save to Notes</button>
                <button onClick={()=>archivePlaybookPrinciple(p.id)} className="text-xs" style={{color:T.faint}}>{p.status==='archived'?'Restore':'Archive'}</button>
              </div>
            </div>
            {(p.revisionHistory||[]).length>0 && (
              <details className="mt-2"><summary className="text-xs cursor-pointer" style={{color:T.faint}}>Revision history ({p.revisionHistory.length})</summary>
                <div className="mt-1 space-y-1">{p.revisionHistory.map((r,i)=><div key={i} className="text-xs" style={{color:T.faint}}>{fmtRelDate(r.ts)}: {r.text}</div>)}</div>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ==================== Coach ==================== */

function StrategyCoachDrawer({onClose, coachContext, strategy, apiKey, toasts}){
  const historyKey = 'magverse:strategy:coach:history';
  const [msgs, setMsgs] = useState(()=> ls(historyKey) || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null);
  const scrollRef = useRef(null);

  useEffect(()=>{ ls(historyKey, msgs); }, [msgs]);
  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, loading]);

  const send = async () => {
    const msg = input.trim();
    if(!msg || loading) return;
    if(!apiKey){ toasts.push('Add your OpenAI API key in Settings to use the Coach'); return; }
    setInput('');
    const history = [...msgs, {role:'user', content:msg}];
    setMsgs(history);
    setLoading(true);
    const systemPrompt = buildStrategyCoachPrompt(coachContext, strategy, mode);
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
        body: JSON.stringify({ model:'gpt-4o', max_tokens:800,
          messages:[{role:'system',content:systemPrompt}, ...history.slice(-12).map(m=>({role:m.role,content:m.content}))] })
      });
      if(!resp.ok){ const errJson = await resp.json().catch(()=>({})); throw new Error(errJson.error?.message || `HTTP ${resp.status}`); }
      const json = await resp.json();
      const replyText = json.choices?.[0]?.message?.content || '(no response)';
      setMsgs(m=>[...m, {role:'assistant', content:replyText}]);
    } catch(e) {
      setMsgs(m=>[...m, {role:'assistant', content:`Error: ${e.message||'unknown'}. Check your OpenAI API key in Settings.`}]);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative w-full sm:w-[420px] h-full glass flex flex-col" style={{background:'rgba(10,10,15,0.98)'}}>
        <div className="flex items-center justify-between p-4" style={{borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div className="text-sm font-medium" style={{color:T.text}}>Strategy Coach</div>
          <button onClick={onClose} className="text-sm" style={{color:T.faint}}>Close</button>
        </div>
        <div className="flex gap-1 px-3 pt-3 flex-wrap">
          {Object.keys(COACH_MODES).map(m=>(
            <button key={m} onClick={()=>setMode(mode===m?null:m)}
              className="text-[11px] px-2 py-1 rounded-full capitalize"
              style={{background: mode===m?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.05)', color: mode===m?T.accent:T.faint}}>{m}</button>
          ))}
        </div>
        <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
          {msgs.length===0 && <div className="text-sm" style={{color:T.faint}}>Ask about the lesson or case you're on, get challenged on a recommendation, or think through a decision.</div>}
          {msgs.map((m,i)=>(
            <div key={i} className="text-sm rounded-lg p-2.5" style={{background: m.role==='user'?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.04)', color:T.text}}>{m.content}</div>
          ))}
          {loading && <div className="text-xs" style={{color:T.faint}}>Thinking...</div>}
        </div>
        <div className="p-3 flex gap-2" style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send(); }}
            placeholder="Ask the Coach..." className="flex-1 rounded-lg px-3 py-2 text-sm" style={FIELD_STYLE} />
          <PrimaryButton onClick={send}>Send</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
