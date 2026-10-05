// bainSprintPanel.jsx
// All Bain Capital Sprint UI. Classic Babel-transformed script — shares the global scope with
// strategyContent.js/strategyEngine.js/strategyPanel.jsx/strategyLessonRenderer.jsx/
// strategyVisualRenderer.jsx (loaded earlier), bainSprintContent.js/bainSprintEngine.js
// (loaded just before this file), consultingQuantEngine.js (for parseNumericAnswer), and
// plannerTypes.js/plannerStorage.js (for the "Plan in Navigator" action). Reuses extensively
// rather than duplicating: T/FIELD_STYLE/PrimaryButton/SecondaryButton/Pill/ScoreDots/
// STATUS_COLOR/mergeCapabilityEvidenceInto (strategyPanel.jsx), getLessonBlocks (strategyEngine.js),
// LessonBlockRenderer/Prose/ConnectionFooter (strategyLessonRenderer.jsx), VisualBlock
// (strategyVisualRenderer.jsx), computeElapsedMs/fmtDuration/fmtRelDate/deriveMasteryStatus/
// scheduleAfterEvidence/buildNoteFromText (strategyEngine.js), parseNumericAnswer
// (consultingQuantEngine.js), newWorkItem (plannerTypes.js), emptyPlanner (plannerStorage.js).
// Zero changes to any of those files.

const BSP_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b', accent: '#a5b4fc', accentBright: '#818cf8' };

const BAIN_TABS = [
  { id: 'home', label: 'Home' }, { id: 'firm', label: 'Firm' }, { id: 'deals', label: 'Deal Room' },
  { id: 'learn', label: 'Learn' }, { id: 'lbo', label: 'Returns Lab' }, { id: 'cases', label: 'Cases' }, { id: 'ic60', label: '60-Sec IC' },
];

/* ==================== Home ==================== */

function BainSprintHome({ bainSprint, setBainTab, onOpenModule, onOpenDeal, onOpenLbo, onOpenCase }){
  const today = todayStr();
  const daysLeft = daysUntilSprintTarget(today);
  const next = getNextBainSprintSession(bainSprint, BAIN_SPRINT_CONTENT, today);
  const studiedDealsCount = Object.keys(bainSprint.dealMastery || {}).length;
  const modulesCount = BAIN_SPRINT_CONTENT.learnModules.filter(m => (bainSprint.moduleProgress || {})[m.id]?.completedAt).length;
  const casesCount = (bainSprint.cases || []).filter(c => c.status === 'completed').length;
  const lboCount = (bainSprint.lboAttempts || []).length;
  const firmDone = !!(bainSprint.moduleProgress || {})['bain-firm']?.completedAt;

  const goToNext = () => {
    if(next.type === 'module') onOpenModule(next.moduleId);
    else if(next.type === 'deal-review') onOpenDeal(next.dealId);
    else if(next.type === 'lbo') onOpenLbo(next.problemId);
    else if(next.type === 'case' || next.type === 'case-new') onOpenCase(next.caseContentId || next.attemptId, next.attemptId);
    else if(next.type === 'ic60') setBainTab('ic60');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: BSP_T.text }}>Bain Capital Sprint</h1>
          <div style={{ fontSize: 12.5, color: BSP_T.faint }}>Target: Nov 20, 2026</div>
        </div>
        <div className="rounded-full px-3 py-1.5" style={{ background: daysLeft <= 7 ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)', color: daysLeft <= 7 ? '#f87171' : BSP_T.accent, fontSize: 13, fontWeight: 600 }}>
          {daysLeft >= 0 ? daysLeft + ' days to Nov 20' : 'Sprint complete'}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.05)' }}>
        <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: BSP_T.accentBright }}>Today's Rep</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: BSP_T.text, marginBottom: 4 }}>{next.title || "All caught up"}</div>
        {next.sub && <div style={{ fontSize: 12.5, color: BSP_T.faint, marginBottom: 10 }}>{next.sub}{next.minutes ? ' · ~' + next.minutes + ' min' : ''}</div>}
        {next.type !== 'done' && <PrimaryButton onClick={goToNext}>Start</PrimaryButton>}
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: BSP_T.faint }}>Current Development</div>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {BAIN_HOME_CAPABILITY_IDS.map(id => {
            const status = deriveMasteryStatus(bainSprint.capabilities?.[id]?.evidence);
            return <span key={id} style={{ fontSize: 13, color: BSP_T.dim }}>{BAIN_CAPABILITY_LABELS[id]}: <span style={{ color: STATUS_COLOR[status], fontWeight: 600 }}>{status}</span></span>;
          })}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: BSP_T.faint }}>Sprint Coverage</div>
        <div className="flex flex-wrap gap-4" style={{ fontSize: 13, color: BSP_T.mid }}>
          <button onClick={() => setBainTab('firm')} style={{ color: firmDone ? '#34d399' : BSP_T.mid }}>Firm {firmDone ? '✓' : '—'}</button>
          <button onClick={() => setBainTab('deals')}>Deals {studiedDealsCount}/3</button>
          <button onClick={() => setBainTab('learn')}>Modules {modulesCount}/{BAIN_SPRINT_CONTENT.learnModules.length}</button>
          <button onClick={() => setBainTab('cases')}>Cases {casesCount}/{BAIN_SPRINT_CONTENT.cases.length}</button>
          <button onClick={() => setBainTab('lbo')}>LBO reps {lboCount}</button>
          <span style={{ color: BSP_T.faint }}>Written Case — later</span>
          <span style={{ color: BSP_T.faint }}>Fit — later</span>
        </div>
      </div>
    </div>
  );
}

/* ==================== Firm module ==================== */

function BainFirmModule({ bainSprint, onComplete, onSaveNote }){
  const fm = BAIN_SPRINT_CONTENT.firmModule;
  const done = !!(bainSprint.moduleProgress || {})['bain-firm']?.completedAt;
  return (
    <div className="space-y-5" style={{ maxWidth: '42rem' }}>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: BSP_T.text }}>{fm.title}</h2>
      <div style={{ fontSize: 11, color: BSP_T.faint }}>{fm.sourceLabel} — fetched {fm.sourceUrls[0].fetchedDate}</div>
      <Prose>{fm.whatItIs}</Prose>
      <div>
        <div style={{ fontSize: 11, textTransform: 'uppercase', color: BSP_T.accent, fontWeight: 600, marginBottom: 6 }}>Core PE Verticals</div>
        <div className="space-y-2">
          {fm.verticals.map(v => (
            <div key={v.name}><span style={{ fontWeight: 600, color: BSP_T.text }}>{v.name}: </span><span style={{ color: BSP_T.dim, fontSize: 14 }}>{v.description}</span></div>
          ))}
        </div>
      </div>
      <div style={{ borderLeft: '3px solid #a5b4fc', paddingLeft: 14 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#a5b4fc', fontWeight: 600, marginBottom: 4 }}>Value Creation Philosophy</div>
        <Prose>{fm.valueCreationPhilosophy.coreStatement}</Prose>
        <Prose>{fm.valueCreationPhilosophy.portfolioGroup}</Prose>
        <ul style={{ fontSize: 14.5, color: BSP_T.dim, paddingLeft: 18, lineHeight: 1.6 }}>
          {fm.valueCreationPhilosophy.managementPartnership.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
      <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginBottom: 4 }}>{fm.operatingVsFinancialEngineering.sourceLabel}</div>
        <Prose>{fm.operatingVsFinancialEngineering.statement}</Prose>
      </div>
      <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div style={{ fontSize: 11, color: BSP_T.accentBright, fontWeight: 600, marginBottom: 4 }}>What this means for you</div>
        <div style={{ fontSize: 15.5, fontWeight: 600, color: BSP_T.text }}>{fm.implication}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onComplete('bain-firm')} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: done ? '#10b981' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{done ? 'Reviewed' : 'Mark Reviewed'}</button>
        <SecondaryButton onClick={() => onSaveNote(fm.title, fm.implication)}>Save to Notes</SecondaryButton>
      </div>
    </div>
  );
}

/* ==================== Deal Room ==================== */

function BainDealRoom({ bainSprint, onOpenDeal }){
  return (
    <div className="space-y-2">
      {BAIN_SPRINT_CONTENT.deals.map(d => {
        const mastered = !!(bainSprint.dealMastery || {})[d.id];
        return (
          <Row key={d.id} onClick={() => onOpenDeal(d.id)} title={d.company} sub={d.sector + ' · announced ' + d.announcedDate}
            right={<Pill color={mastered ? '#10b981' : BSP_T.mid}>{mastered ? 'Studied' : 'Not studied'}</Pill>} />
        );
      })}
    </div>
  );
}

function BainDealStudio({ dealId, bainSprint, onRecordMastery, onSaveNote, onPlanInNavigator, onBack }){
  const deal = BAIN_SPRINT_CONTENT.deals.find(d => d.id === dealId);
  const [step, setStep] = useState(1);
  const [initialThesis, setInitialThesis] = useState('');
  const [tags, setTags] = useState({});
  const [valueCreationPlan, setValueCreationPlan] = useState('');
  const [downside, setDownside] = useState('');

  if(!deal) return <div style={{ color: BSP_T.faint }}>Deal not found. <button onClick={onBack} style={{ color: BSP_T.accent }}>← Back</button></div>;

  const tagRow = (f, key) => (
    <div className="flex items-center justify-between gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize: 13.5, color: BSP_T.dim, flex: 1 }}>{f}</div>
      <div className="flex gap-1 flex-shrink-0">
        {['attractive', 'unattractive', 'unknown'].map(t => (
          <button key={t} onClick={() => setTags(s => ({ ...s, [key]: t }))} className="text-[11px] px-2 py-1 rounded-lg"
            style={{ background: tags[key] === t ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)', color: tags[key] === t ? BSP_T.accent : BSP_T.mid }}>{t}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4" style={{ maxWidth: '42rem' }}>
      <button onClick={onBack} className="text-xs" style={{ color: BSP_T.faint }}>← Back to Deal Room</button>
      <div>
        <div className="text-xs uppercase tracking-wide" style={{ color: BSP_T.faint }}>{deal.sector}</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: BSP_T.text }}>{deal.company}</h2>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <Prose>{deal.basicIntro}</Prose>
          <div className="rounded-xl p-4" style={{ background: 'rgba(165,180,252,0.06)', border: '1px solid rgba(165,180,252,0.25)' }}>
            <div style={{ fontSize: 11, color: BSP_T.accent, fontWeight: 600, marginBottom: 6 }}>THINK FIRST</div>
            <Prose>{deal.thinkFirstQuestion}</Prose>
          </div>
          <textarea value={initialThesis} onChange={e => setInitialThesis(e.target.value)} rows={4} placeholder="Your initial thesis..." className="w-full rounded-lg p-2 text-sm" style={FIELD_STYLE} />
          <PrimaryButton small onClick={() => setStep(2)}>Reveal market &amp; company facts</PrimaryButton>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-1">
          <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginTop: 4 }}>FACT — MARKET</div>
          {deal.marketFacts.map((f, i) => tagRow(f, 'm' + i))}
          <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginTop: 14 }}>FACT — COMPANY</div>
          {deal.companyFacts.map((f, i) => tagRow(f, 'c' + i))}
          <PrimaryButton small onClick={() => setStep(3)}>Next: Value-creation plan</PrimaryButton>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div style={{ fontSize: 14, color: BSP_T.text }}>Given what you've seen, what's your value-creation plan? Be specific — quantify where you can.</div>
          <textarea value={valueCreationPlan} onChange={e => setValueCreationPlan(e.target.value)} rows={4} className="w-full rounded-lg p-2 text-sm" style={FIELD_STYLE} />
          <PrimaryButton small onClick={() => setStep(4)}>Next: Downside</PrimaryButton>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <div style={{ fontSize: 14, color: BSP_T.text }}>What's your downside case? What would make you walk away?</div>
          <textarea value={downside} onChange={e => setDownside(e.target.value)} rows={4} className="w-full rounded-lg p-2 text-sm" style={FIELD_STYLE} />
          <PrimaryButton small onClick={() => setStep(5)}>Reveal Bain's stated rationale</PrimaryButton>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginBottom: 6 }}>{deal.sourceLabel}</div>
            {deal.bainStatedRationale.map((q, i) => (
              <div key={i} style={{ fontSize: 14, color: BSP_T.dim, marginBottom: 8, fontStyle: 'italic' }}>"{q.quote}" <span style={{ fontStyle: 'normal', color: BSP_T.faint }}>— {q.speaker}, {q.role}</span></div>
            ))}
            <div style={{ fontSize: 12, color: BSP_T.faint, marginTop: 6 }}>Stated growth plans: {deal.bainStatedGrowthPlans.join(', ')}</div>
            {deal.dealValueEstimate && <div style={{ fontSize: 11, color: BSP_T.faint, marginTop: 4 }}>{deal.dealValueEstimate.label}: {deal.dealValueEstimate.value} ({deal.dealValueEstimate.source})</div>}
            <a href={deal.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: BSP_T.accent, display: 'block', marginTop: 6, wordBreak: 'break-all' }}>{deal.sourceUrl}</a>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginBottom: 6 }}>{deal.myInvestmentInference.label}</div>
            <div style={{ fontSize: 12, color: BSP_T.faint, marginBottom: 3 }}>Possible value-creation levers:</div>
            <ul style={{ fontSize: 13.5, color: BSP_T.dim, paddingLeft: 16, marginBottom: 8 }}>{deal.myInvestmentInference.valueCreationLevers.map((l, i) => <li key={i}>{l}</li>)}</ul>
            <div style={{ fontSize: 12, color: BSP_T.faint, marginBottom: 3 }}>Risks:</div>
            <ul style={{ fontSize: 13.5, color: BSP_T.dim, paddingLeft: 16 }}>{deal.myInvestmentInference.risks.map((l, i) => <li key={i}>{l}</li>)}</ul>
            <div style={{ fontSize: 12.5, color: BSP_T.faint, marginTop: 8 }}>Possible exit: {deal.myInvestmentInference.possibleExit}</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: BSP_T.text, marginBottom: 6 }}>What changed in your thesis?</div>
            <div style={{ fontSize: 13.5, color: BSP_T.dim, whiteSpace: 'pre-line' }}>Your initial thesis: {initialThesis || '(none written)'}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <PrimaryButton onClick={() => onRecordMastery(dealId)}>Mark deal studied</PrimaryButton>
            <SecondaryButton onClick={() => onSaveNote(deal.company + ' — investment thesis', 'Initial thesis: ' + initialThesis + '\n\nValue creation: ' + valueCreationPlan + '\n\nDownside: ' + downside)}>Save to Notes</SecondaryButton>
            <SecondaryButton onClick={() => onPlanInNavigator(deal.company + ' deal mastery — explain in 60-90s', 15, 'Can explain thesis, value creation, downside, and diligence for ' + deal.company + ' from memory')}>Plan in Navigator</SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== Learn modules (thin wrapper reusing the Strategy block renderer) ==================== */

function BainLessonViewer({ moduleId, bainSprint, onComplete, onSaveReflectionDraft, onSaveNote, onBack }){
  const module = BAIN_SPRINT_CONTENT.learnModules.find(m => m.id === moduleId);
  const progress = (bainSprint.moduleProgress || {})[moduleId] || {};
  const [reflection, setReflection] = useState(progress.reflection || '');
  useEffect(() => { setReflection(progress.reflection || ''); }, [moduleId]);
  if(!module) return <div style={{ color: BSP_T.faint }}>Module not found. <button onClick={onBack} style={{ color: BSP_T.accent }}>← Back</button></div>;
  const blocks = getLessonBlocks(module);
  const done = !!progress.completedAt;
  return (
    <div className="space-y-5" style={{ maxWidth: '42rem' }}>
      <button onClick={onBack} className="text-xs" style={{ color: BSP_T.faint }}>← Back to Learn</button>
      <div>
        {module.subtitle && <div className="text-xs uppercase tracking-wide" style={{ color: BSP_T.faint, marginBottom: 4 }}>{module.subtitle}</div>}
        <h2 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2, color: BSP_T.text }}>{module.title}</h2>
        {module.bigQuestion && <div style={{ fontSize: 16, color: BSP_T.accent, marginTop: 8 }}>{module.bigQuestion}</div>}
        {module.estimatedMinutes && <div className="text-xs mt-2" style={{ color: BSP_T.faint }}>~{module.estimatedMinutes} min</div>}
      </div>
      {blocks.map((b, i) => <LessonBlockRenderer key={i} block={b} />)}
      <ConnectionFooter items={module.nextConnections} />
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: BSP_T.text, marginBottom: 6 }}>{module.strategicQuestion || 'What did you learn?'}</div>
        <textarea value={reflection} onChange={e => setReflection(e.target.value)} onBlur={e => onSaveReflectionDraft(moduleId, e.target.value)} rows={4}
          className="w-full rounded-lg p-2 text-sm" style={FIELD_STYLE} />
        <div className="flex gap-2 mt-2">
          <button onClick={() => onComplete(moduleId, reflection)} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: done ? '#10b981' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {done ? 'Update reflection' : 'Mark Complete'}
          </button>
          <SecondaryButton onClick={() => onSaveNote(module.title, reflection)}>Save to Notes</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

function BainLearnList({ bainSprint, onOpenModule }){
  return (
    <div>
      {BAIN_SPRINT_CONTENT.learnModules.map(m => {
        const done = !!(bainSprint.moduleProgress || {})[m.id]?.completedAt;
        return (
          <button key={m.id} onClick={() => onOpenModule(m.id)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-white/5">
            <span style={{ width: 8, height: 8, borderRadius: 99, background: done ? '#10b981' : 'rgba(255,255,255,0.15)', flexShrink: 0 }}></span>
            <span style={{ color: done ? BSP_T.mid : BSP_T.text, fontSize: 14 }}>{m.title}</span>
          </button>
        );
      })}
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide mb-1" style={{ color: BSP_T.faint }}>Roadmap</div>
        {BAIN_SPRINT_CONTENT.roadmap.map(w => (
          <div key={w.week} className="flex items-center gap-2 py-1" style={{ opacity: w.status === 'authored' ? 1 : 0.5 }}>
            <span style={{ fontSize: 12, color: BSP_T.faint }}>Week {w.week}</span>
            <span style={{ fontSize: 13, color: BSP_T.dim }}>{w.name}</span>
            {w.status !== 'authored' && <Pill>Not yet authored</Pill>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== Returns Lab / Paper LBO ==================== */

function bspFmt(v, unit){
  if(v == null || isNaN(v)) return '—';
  if(unit === 'x') return v.toFixed(2) + 'x';
  if(unit === '%') return (v * 100).toFixed(1) + '%';
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M';
}

function BainLboDrill({ problemId, onRecordAttempt, onBack }){
  const problem = BAIN_SPRINT_CONTENT.lboDrills.find(p => p.id === problemId);
  const [purchasePriceGuess, setPurchasePriceGuess] = useState('');
  const [equityGuess, setEquityGuess] = useState('');
  const [exitEquityGuess, setExitEquityGuess] = useState('');
  const [moicGuess, setMoicGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [whatDrove, setWhatDrove] = useState('');
  const [fragileAssumption, setFragileAssumption] = useState('');

  if(!problem) return <div style={{ color: BSP_T.faint }}>Problem not found. <button onClick={onBack} style={{ color: BSP_T.accent }}>← Back</button></div>;
  const result = computeLBO(problem.inputs);

  const withinTolerance = (guess, actual, tol) => {
    const parsed = parseNumericAnswer(guess);
    if(parsed == null || isNaN(parsed)) return null;
    return Math.abs(parsed - actual) <= Math.abs(actual) * (tol || 0.05);
  };
  const grades = revealed ? {
    purchasePrice: withinTolerance(purchasePriceGuess, result.purchasePrice, 0.05),
    equity: withinTolerance(equityGuess, result.equityInvested, 0.05),
    exitEquity: withinTolerance(exitEquityGuess, result.exitEquity, 0.08),
    moic: withinTolerance(moicGuess, result.moic, 0.08),
  } : null;

  const gradeMark = (g) => g === true ? <span style={{ color: '#34d399' }}>✓</span> : g === false ? <span style={{ color: '#f87171' }}>✗</span> : <span style={{ color: BSP_T.faint }}>—</span>;

  const bridgeVisual = {
    type: 'bar-compare', title: 'What drove the return', unit: '$',
    categories: ['EBITDA growth', 'Multiple change', 'Deleveraging'],
    series: [{ label: 'Contribution ($M)', values: [result.returnsBridge.ebitdaGrowthContribution, result.returnsBridge.multipleChangeContribution, result.returnsBridge.deleveragingContribution] }],
  };

  return (
    <div className="space-y-4" style={{ maxWidth: '42rem' }}>
      <button onClick={onBack} className="text-xs" style={{ color: BSP_T.faint }}>← Back to Returns Lab</button>
      <div>
        <div className="text-xs uppercase tracking-wide" style={{ color: BSP_T.faint }}>{problem.level}</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: BSP_T.text }}>{problem.title}</h2>
      </div>
      <Prose>{problem.prompt}</Prose>

      {!revealed ? (
        <div className="space-y-2.5">
          <Field label="Purchase price (entry EV)" value={purchasePriceGuess} type="text" controlled onChange={e => setPurchasePriceGuess(e.target.value)} placeholder="e.g. $1,200M or 1200" />
          <Field label="Equity invested" value={equityGuess} type="text" controlled onChange={e => setEquityGuess(e.target.value)} placeholder="e.g. $600M" />
          <Field label="Exit equity value" value={exitEquityGuess} type="text" controlled onChange={e => setExitEquityGuess(e.target.value)} placeholder="e.g. $1,330M" />
          <Field label="MOIC" value={moicGuess} type="text" controlled onChange={e => setMoicGuess(e.target.value)} placeholder="e.g. 2.2x" />
          <PrimaryButton onClick={() => setRevealed(true)}>Reveal answer</PrimaryButton>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl p-4 space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex justify-between text-sm"><span style={{ color: BSP_T.mid }}>Purchase price {gradeMark(grades.purchasePrice)}</span><span style={{ color: BSP_T.text }}>{bspFmt(result.purchasePrice)}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: BSP_T.mid }}>Debt</span><span style={{ color: BSP_T.text }}>{bspFmt(result.debt)}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: BSP_T.mid }}>Equity invested {gradeMark(grades.equity)}</span><span style={{ color: BSP_T.text }}>{bspFmt(result.equityInvested)}</span></div>
            <div className="flex justify-between text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6, marginTop: 4 }}><span style={{ color: BSP_T.mid }}>Exit EBITDA</span><span style={{ color: BSP_T.text }}>{bspFmt(result.exitEBITDA)}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: BSP_T.mid }}>Exit EV</span><span style={{ color: BSP_T.text }}>{bspFmt(result.exitEV)}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: BSP_T.mid }}>Exit equity {gradeMark(grades.exitEquity)}</span><span style={{ color: BSP_T.text }}>{bspFmt(result.exitEquity)}</span></div>
            <div className="flex justify-between text-sm font-semibold" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6, marginTop: 4 }}><span style={{ color: BSP_T.accent }}>MOIC {gradeMark(grades.moic)}</span><span style={{ color: BSP_T.accent }}>{bspFmt(result.moic, 'x')}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: BSP_T.mid }}>IRR</span><span style={{ color: BSP_T.text }}>{bspFmt(result.irr, '%')}</span></div>
          </div>
          <VisualBlock visual={bridgeVisual} />
          <div className="rounded-xl p-3" style={{ background: 'rgba(165,180,252,0.06)', border: '1px solid rgba(165,180,252,0.2)' }}>
            <Prose>{interpretLBOResult(result)}</Prose>
          </div>
          <Field label="What drove the return, in your own words?" value={whatDrove} type="textarea" controlled onChange={e => setWhatDrove(e.target.value)} />
          <Field label="Which assumption is most fragile?" value={fragileAssumption} type="textarea" controlled onChange={e => setFragileAssumption(e.target.value)} />
          <PrimaryButton onClick={() => onRecordAttempt(problemId, { purchasePriceGuess, equityGuess, exitEquityGuess, moicGuess, whatDrove, fragileAssumption, grades })}>Finish</PrimaryButton>
        </div>
      )}
    </div>
  );
}

function BainReturnsLab({ bainSprint, onOpenLbo }){
  return (
    <div className="space-y-1">
      {BAIN_SPRINT_CONTENT.lboDrills.map(p => {
        const attempted = (bainSprint.lboAttempts || []).some(a => a.problemId === p.id);
        return (
          <Row key={p.id} onClick={() => onOpenLbo(p.id)} title={p.title} sub={p.level}
            right={<Pill color={attempted ? '#10b981' : BSP_T.mid}>{attempted ? 'Done' : 'Not started'}</Pill>} />
        );
      })}
    </div>
  );
}

/* ==================== Investment Cases ("Would you invest?") ==================== */

function initBainCaseAttempt(caseContentId){
  return {
    id: uid('bcase'), caseContentId, status: 'in_progress',
    timer: { startedAt: Date.now(), pausedMs: 0, pausedAt: null, finishedAt: null },
    dateStarted: new Date().toISOString(),
    recommendation: null, atWhatPrice: '',
    scorecard: { dimensions: Object.fromEntries(BAIN_SCORECARD_DIMENSIONS.map(d => [d.id, { score: 0, whatWentWell: '', whatToImprove: '' }])), strengths: '', weaknesses: '', keyLesson: '', feedback: '' },
    reflection: { biggestRisk: '', whatWouldChangeMyMind: '', nextPractice: '' },
  };
}

function BainCasePractice({ bainSprint, onStartCase, onOpenCase }){
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: BSP_T.faint }}>Investment cases</div>
        {BAIN_SPRINT_CONTENT.cases.map(c => (
          <Row key={c.id} onClick={() => onStartCase(c.id)} title={c.title} sub={c.sector + ' · ' + c.difficulty + ' · ~' + c.suggestedTimeMin + ' min'}
            right={<PrimaryButton small onClick={(e) => { e.stopPropagation(); onStartCase(c.id); }}>Start</PrimaryButton>} />
        ))}
      </div>
      {bainSprint.cases.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: BSP_T.faint }}>Your attempts</div>
          {[...bainSprint.cases].reverse().map(a => {
            const c = BAIN_SPRINT_CONTENT.cases.find(x => x.id === a.caseContentId);
            return <Row key={a.id} onClick={() => onOpenCase(a.id)} title={c?.title} sub={fmtRelDate(a.dateStarted) + ' · ' + (a.status === 'completed' ? 'Completed' : 'In progress')}
              right={a.recommendation && <Pill color={a.recommendation === 'invest' ? '#10b981' : '#f59e0b'}>{a.recommendation === 'invest' ? 'Would invest' : 'Would pass'}</Pill>} />;
          })}
        </div>
      )}
    </div>
  );
}

function BainCaseWorkspace({ attemptId, bainSprint, onUpdateAttempt, onCaseFinished, onSaveNote, onBack }){
  const attempt = bainSprint.cases.find(c => c.id === attemptId);
  const c = attempt ? BAIN_SPRINT_CONTENT.cases.find(x => x.id === attempt.caseContentId) : null;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if(!attempt || attempt.status === 'completed' || attempt.timer.pausedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [attempt?.status, attempt?.timer?.pausedAt]);

  if(!attempt || !c) return <div style={{ color: BSP_T.faint }}>Case not found. <button onClick={onBack} style={{ color: BSP_T.accent }}>← Back</button></div>;
  const elapsed = computeElapsedMs(attempt.timer, now);
  const isDone = attempt.status === 'completed';

  const setDim = (dimId, patch) => onUpdateAttempt(attemptId, { scorecard: { ...attempt.scorecard, dimensions: { ...attempt.scorecard.dimensions, [dimId]: { ...attempt.scorecard.dimensions[dimId], ...patch } } } });
  const setScorecard = (patch) => onUpdateAttempt(attemptId, { scorecard: { ...attempt.scorecard, ...patch } });
  const setReflection = (patch) => onUpdateAttempt(attemptId, { reflection: { ...attempt.reflection, ...patch } });

  const finish = () => {
    if(isDone) return;
    const finished = { ...attempt, status: 'completed', timer: { ...attempt.timer, finishedAt: Date.now() } };
    onUpdateAttempt(attemptId, { status: 'completed', timer: finished.timer });
    onCaseFinished(finished, c);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs" style={{ color: BSP_T.faint }}>← Back to cases</button>
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h2 className="text-lg font-semibold" style={{ color: BSP_T.text }}>{c.title}</h2>
          <span className="text-sm font-mono" style={{ color: BSP_T.mid }}>{fmtDuration(elapsed)}</span>
        </div>
        <p className="text-sm whitespace-pre-line" style={{ color: BSP_T.dim }}>{c.prompt}</p>
        <details className="mt-3">
          <summary className="text-xs cursor-pointer" style={{ color: BSP_T.accent }}>Exhibits</summary>
          <ul className="text-sm mt-2 space-y-1 list-disc pl-4" style={{ color: BSP_T.mid }}>{c.exhibits.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </details>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-medium mb-3" style={{ color: BSP_T.text }}>Would you invest?</div>
        <div className="flex gap-2 mb-3">
          <button onClick={() => onUpdateAttempt(attemptId, { recommendation: 'invest' })} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: attempt.recommendation === 'invest' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', color: attempt.recommendation === 'invest' ? '#34d399' : BSP_T.mid }}>Invest</button>
          <button onClick={() => onUpdateAttempt(attemptId, { recommendation: 'pass' })} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: attempt.recommendation === 'pass' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)', color: attempt.recommendation === 'pass' ? '#f59e0b' : BSP_T.mid }}>Pass</button>
        </div>
        <Field label="At what price / under what condition?" value={attempt.atWhatPrice} onBlur={e => onUpdateAttempt(attemptId, { atWhatPrice: e.target.value })} />
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-medium mb-3" style={{ color: BSP_T.text }}>Scorecard</div>
        <div className="space-y-3">
          {BAIN_SCORECARD_DIMENSIONS.map(dim => {
            const d = attempt.scorecard.dimensions[dim.id];
            return (
              <div key={dim.id} className="border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: BSP_T.dim }}>{dim.label}</span>
                  <ScoreDots value={d.score} onChange={v => setDim(dim.id, { score: v })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-2 mt-1">
                  <input defaultValue={d.whatWentWell} onBlur={e => setDim(dim.id, { whatWentWell: e.target.value })} placeholder="What went well" className="text-xs rounded-lg px-2 py-1.5" style={FIELD_STYLE} />
                  <input defaultValue={d.whatToImprove} onBlur={e => setDim(dim.id, { whatToImprove: e.target.value })} placeholder="What to improve" className="text-xs rounded-lg px-2 py-1.5" style={FIELD_STYLE} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid sm:grid-cols-2 gap-2 mt-4">
          {[['strengths', 'Strengths'], ['weaknesses', 'Weaknesses'], ['keyLesson', 'Key Lesson']].map(([k, label]) => (
            <Field key={k} label={label} value={attempt.scorecard[k]} onBlur={e => setScorecard({ [k]: e.target.value })} />
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="text-sm font-medium mb-3" style={{ color: BSP_T.text }}>Reflection</div>
        <div className="space-y-2">
          {[['biggestRisk', 'What was the biggest thesis-threatening risk?'], ['whatWouldChangeMyMind', 'What would change my mind?'], ['nextPractice', 'What should I practice next?']].map(([k, label]) => (
            <Field key={k} label={label} value={attempt.reflection[k]} onBlur={e => setReflection({ [k]: e.target.value })} />
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          {!isDone && <PrimaryButton onClick={finish}>Finish Case</PrimaryButton>}
          {isDone && <div className="text-xs self-center" style={{ color: '#10b981' }}>Completed {fmtRelDate(attempt.timer.finishedAt)}</div>}
          <SecondaryButton onClick={() => onSaveNote(c.title, attempt.scorecard.keyLesson || attempt.reflection.biggestRisk || '')}>Save to Notes</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

/* ==================== 60-second IC mode ==================== */

function BainIc60({ onRecordAttempt }){
  const [scenario] = useState(() => BAIN_SPRINT_CONTENT.ic60Scenarios[Math.floor(Math.random() * BAIN_SPRINT_CONTENT.ic60Scenarios.length)]);
  const [response, setResponse] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState({ answerFirst: 0, thesis: 0, economics: 0, downside: 0, concision: 0 });
  const dims = [['answerFirst', 'Answer first'], ['thesis', 'Thesis'], ['economics', 'Economics'], ['downside', 'Downside'], ['concision', 'Concision']];

  return (
    <div className="space-y-4" style={{ maxWidth: '38rem' }}>
      <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
        <div style={{ fontSize: 11, color: BSP_T.accent, fontWeight: 600, marginBottom: 6 }}>THE PARTNER WALKS INTO THE ELEVATOR. 60 SECONDS.</div>
        <Prose>{scenario.snapshot}</Prose>
      </div>
      <textarea value={response} onChange={e => setResponse(e.target.value)} rows={4} placeholder="Give your recommendation out loud, then type it here..." className="w-full rounded-lg p-2 text-sm" style={FIELD_STYLE} />
      {!revealed ? (
        <PrimaryButton onClick={() => setRevealed(true)}>Reveal a model answer</PrimaryButton>
      ) : (
        <>
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}><Prose>{scenario.modelAnswer}</Prose></div>
          <div className="space-y-2">
            {dims.map(([id, label]) => (
              <div key={id} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: BSP_T.dim }}>{label}</span>
                <ScoreDots value={ratings[id]} onChange={v => setRatings(r => ({ ...r, [id]: v }))} />
              </div>
            ))}
          </div>
          <PrimaryButton onClick={() => onRecordAttempt(scenario.id, response, ratings)}>Done</PrimaryButton>
        </>
      )}
    </div>
  );
}

/* ==================== Root panel ==================== */

function BainSprintPanel({ data, setData, toasts }){
  const strategy = emptyStrategy(data);
  const bainSprint = maybeArchiveSprint(emptyBainSprint(strategy), todayStr());
  const [bainTab, setBainTab] = useState('home');
  const [activeDealId, setActiveDealId] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLboId, setActiveLboId] = useState(null);
  const [activeCaseAttemptId, setActiveCaseAttemptId] = useState(null);

  const upBain = (patch) => setData(d => {
    const s = emptyStrategy(d);
    return { ...d, strategy: { ...s, bainSprint: { ...emptyBainSprint(s), ...patch } } };
  });

  useEffect(() => {
    if(!bainSprint.startedAt) upBain({ startedAt: new Date().toISOString() });
  }, []);

  const onComplete = (moduleId, reflection) => {
    upBain({ moduleProgress: { ...bainSprint.moduleProgress, [moduleId]: { completedAt: new Date().toISOString(), reflection: reflection || '' } } });
    toasts.push('Marked complete');
  };
  const onSaveReflectionDraft = (moduleId, text) => {
    const curr = bainSprint.moduleProgress[moduleId] || {};
    upBain({ moduleProgress: { ...bainSprint.moduleProgress, [moduleId]: { ...curr, reflection: text } } });
  };
  const onSaveNote = (title, text) => {
    if(!text || !text.trim()) return;
    setData(d => ({ ...d, notes: [...(d.notes || []), buildNoteFromText(title, text)] }));
    toasts.push('Saved to Notes');
  };
  const planInNavigator = (title, minutes, doneWhen) => {
    setData(d => {
      const planner = emptyPlanner(d);
      const item = newWorkItem({ title, estimatedMinutes: minutes, outcome: doneWhen, priority: 'next', source: { type: 'strategy', id: 'bain-sprint' } });
      return { ...d, planner: { ...planner, workItems: [...planner.workItems, item] } };
    });
    toasts.push('Added to Navigator');
  };

  const onOpenDeal = (dealId) => { setActiveDealId(dealId); setBainTab('deal'); };
  const onRecordDealMastery = (dealId) => {
    const today = todayStr();
    const existing = bainSprint.dealMastery[dealId] || initDealMasteryEntry(dealId, today);
    const evidence = [...existing.evidence, { ts: new Date().toISOString(), score: 4, source: 'deal-studio' }];
    const sched = scheduleAfterEvidence(existing, 4, today);
    upBain({ dealMastery: { ...bainSprint.dealMastery, [dealId]: { ...existing, evidence, timesPracticed: (existing.timesPracticed || 0) + 1, lastPracticed: today, ...sched } } });
    toasts.push('Deal studied — logged');
    setBainTab('deals'); setActiveDealId(null);
  };

  const onOpenModule = (moduleId) => { setActiveModuleId(moduleId); setBainTab('module'); };
  const onOpenLbo = (problemId) => { setActiveLboId(problemId); setBainTab('lbo-detail'); };
  const onRecordLboAttempt = (problemId, payload) => {
    upBain({ lboAttempts: [...bainSprint.lboAttempts, { id: uid('lbo'), problemId, ...payload, ts: new Date().toISOString() }] });
    toasts.push('LBO rep logged');
    setBainTab('lbo'); setActiveLboId(null);
  };

  const onStartCase = (caseContentId) => {
    const attempt = initBainCaseAttempt(caseContentId);
    upBain({ cases: [...bainSprint.cases, attempt] });
    setActiveCaseAttemptId(attempt.id);
    setBainTab('case');
  };
  const onOpenCaseAttempt = (attemptId) => { setActiveCaseAttemptId(attemptId); setBainTab('case'); };
  const onUpdateCaseAttempt = (attemptId, patch) => {
    upBain({ cases: bainSprint.cases.map(c => c.id === attemptId ? { ...c, ...patch } : c) });
  };
  const onCaseFinished = (attempt, caseContent) => {
    setData(d => {
      const s = emptyStrategy(d);
      const bs = emptyBainSprint(s);
      const bainEv = evidenceFromBainCaseScorecard(attempt);
      let nextCaps = { ...bs.capabilities };
      Object.entries(bainEv).forEach(([capId, items]) => {
        const curr = nextCaps[capId] || { evidence: [], status: 'UNTESTED' };
        const evidence = [...curr.evidence, ...items];
        nextCaps[capId] = { evidence, status: deriveMasteryStatus(evidence) };
      });
      const errs = detectErrorsFromBainCase(attempt).map(e => ({ id: uid('err'), ts: new Date().toISOString(), ...e }));
      const transferEv = evidenceForStrategyTransfer(attempt);
      const stratCaps = mergeCapabilityEvidenceInto(s.learnerModel.capabilities, transferEv);
      const nextBs = { ...bs, capabilities: nextCaps, errorLog: [...bs.errorLog, ...errs], cases: bs.cases.map(x => x.id === attempt.id ? attempt : x) };
      return { ...d, strategy: { ...s, learnerModel: { capabilities: stratCaps }, bainSprint: nextBs } };
    });
    toasts.push('Case logged — evidence recorded');
  };

  const onRecordIc60 = (scenarioId, response, ratings) => {
    upBain({ ic60Attempts: [...bainSprint.ic60Attempts, { id: uid('ic60'), scenarioId, response, selfRating: ratings, ts: new Date().toISOString() }] });
    toasts.push('Rep logged');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-1 mb-4 flex-wrap">
        {BAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setBainTab(t.id)} className="px-3 py-1.5 rounded-lg text-sm"
            style={{ background: bainTab === t.id ? 'rgba(99,102,241,0.18)' : 'transparent', color: bainTab === t.id ? BSP_T.accent : BSP_T.mid, fontWeight: bainTab === t.id ? 600 : 400 }}>
            {t.label}
          </button>
        ))}
        {bainSprint.status === 'completed' && <Pill color="#10b981">Completed Sprint</Pill>}
      </div>

      {bainTab === 'home' && <BainSprintHome bainSprint={bainSprint} setBainTab={setBainTab} onOpenModule={onOpenModule} onOpenDeal={onOpenDeal} onOpenLbo={onOpenLbo} onOpenCase={onOpenCaseAttempt} />}
      {bainTab === 'firm' && <BainFirmModule bainSprint={bainSprint} onComplete={onComplete} onSaveNote={onSaveNote} />}
      {bainTab === 'deals' && <BainDealRoom bainSprint={bainSprint} onOpenDeal={onOpenDeal} />}
      {bainTab === 'deal' && activeDealId && <BainDealStudio dealId={activeDealId} bainSprint={bainSprint} onRecordMastery={onRecordDealMastery} onSaveNote={onSaveNote} onPlanInNavigator={planInNavigator} onBack={() => setBainTab('deals')} />}
      {bainTab === 'learn' && <BainLearnList bainSprint={bainSprint} onOpenModule={onOpenModule} />}
      {bainTab === 'module' && activeModuleId && <BainLessonViewer moduleId={activeModuleId} bainSprint={bainSprint} onComplete={onComplete} onSaveReflectionDraft={onSaveReflectionDraft} onSaveNote={onSaveNote} onBack={() => setBainTab('learn')} />}
      {bainTab === 'lbo' && <BainReturnsLab bainSprint={bainSprint} onOpenLbo={onOpenLbo} />}
      {bainTab === 'lbo-detail' && activeLboId && <BainLboDrill problemId={activeLboId} onRecordAttempt={onRecordLboAttempt} onBack={() => setBainTab('lbo')} />}
      {bainTab === 'cases' && <BainCasePractice bainSprint={bainSprint} onStartCase={onStartCase} onOpenCase={onOpenCaseAttempt} />}
      {bainTab === 'case' && activeCaseAttemptId && <BainCaseWorkspace attemptId={activeCaseAttemptId} bainSprint={bainSprint} onUpdateAttempt={onUpdateCaseAttempt} onCaseFinished={onCaseFinished} onSaveNote={onSaveNote} onBack={() => setBainTab('cases')} />}
      {bainTab === 'ic60' && <BainIc60 onRecordAttempt={onRecordIc60} />}
    </div>
  );
}
