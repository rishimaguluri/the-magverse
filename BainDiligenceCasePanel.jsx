// BainDiligenceCasePanel.jsx
// Active-case workspace + debrief for the "PE Diligence Case" mode — copy-adapted from
// ConsultingCaseWorkspace's proven layout, own component names throughout (deliberately, to avoid
// any repeat of the CaseWorkspace/ConsultingCaseWorkspace naming-collision near-miss from
// Consulting Pass 2). The lobby/case-picker lives inline in bainSprintPanel.jsx's BainCasePractice
// (small addition there); this file is just the live workspace + debrief screen.
//
// Reuses directly, unmodified: ExhibitViewer (consultingExhibitRenderer.jsx), useDictation/
// streamFeedback/uid (App.jsx), computeElapsedMs/fmtDuration (strategyEngine.js), checkQuantAnswer
// (consultingQuantEngine.js — ALL arithmetic here is graded by this deterministic function, never
// by the AI), parseCaseMeta/stripCaseMeta/resolveCaseReveal (consultingCaseEngine.js),
// PRIMARY_COMPETENCY_LABELS (consultingCompetencies.js), BAIN_CAPABILITY_LABELS
// (bainSprintEngine.js), and everything from bainDiligenceEngine.js/bainDiligenceContent.js.
// Classic Babel-transformed script, shares the global scope with every file loaded before it.

const BDC_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b', accent: '#a5b4fc', accentBright: '#818cf8', good: '#34d399', warn: '#f59e0b', bad: '#f87171' };
const BDC_FIELD = { background: 'rgba(255,255,255,0.04)', color: BDC_T.text, border: '1px solid rgba(255,255,255,0.08)' };

function BDCPrimaryButton({ onClick, children, disabled, small }){
  return <button onClick={onClick} disabled={disabled} className={`rounded-lg font-semibold ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`} style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', color: '#fff', opacity: disabled ? 0.4 : 1 }}>{children}</button>;
}
function BDCSecondaryButton({ onClick, children }){
  return <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: BDC_T.dim }}>{children}</button>;
}
function fmtPECaseTimer(ms){ const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; }

/* ==================== Root — routes active workspace vs. debrief by attempt.status ==================== */

function BainDiligenceCasePanel({ attemptId, bainSprint, apiKey, toasts, onUpdateAttempt, onCaseFinished, onGoToModule, onSaveNote, onBack, isMobile }){
  const attempt = (bainSprint.diligenceCases || []).find(c => c.id === attemptId);
  const cfg = attempt ? getPEDiligenceCaseConfig(attempt.caseContentId) : null;
  const [now, setNow] = useState(Date.now());
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [suggestedPhase, setSuggestedPhase] = useState(null);
  const [quantDraft, setQuantDraft] = useState('');
  const [scratchpadDraft, setScratchpadDraft] = useState(attempt?.scratchpad || '');
  const [focusExhibitId, setFocusExhibitId] = useState(null);
  const [mobileTab, setMobileTab] = useState('interview');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const scrollRef = useRef(null);
  const dict = useDictation(t => { setInput(p => p ? p + ' ' + t : t); });

  useEffect(() => { if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [attempt?.sessionLog, streamText]);
  useEffect(() => {
    if(!attempt || attempt.status === 'completed' || attempt.timer?.pausedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [attempt?.status, attempt?.timer?.pausedAt]);
  useEffect(() => {
    if(attempt && attempt.sessionLog.length === 0) sendInterviewerOpener();
  }, [attempt?.id]);

  if(!attempt || !cfg) return <div style={{ color: BDC_T.faint }}>Case not found. <button onClick={onBack} style={{ color: BDC_T.accent }}>← Back</button></div>;

  const applyMeta = (nc, meta) => {
    if(!meta) return nc;
    const revealedFactIds = [...new Set([...(nc.revealedFactIds || []), ...meta.revealedFactIds])];
    const revealedExhibitIds = [...new Set([...(nc.revealedExhibitIds || []), ...meta.revealedExhibitIds])];
    let state = nc.state;
    if(nc.mode === 'interview'){ state = peClampPhaseForward(nc.state, meta.phase); }
    else { setSuggestedPhase(meta.phase && meta.phase !== nc.state ? meta.phase : null); }
    return { ...nc, revealedFactIds, revealedExhibitIds, state };
  };

  const sendInterviewerOpener = async () => {
    if(!apiKey){ onUpdateAttempt(attemptId, { sessionLog: [{ role: 'interviewer', content: 'Add your OpenAI API key in Settings to start.', at: Date.now() }] }); return; }
    setStreaming(true);
    try{
      const system = buildPEDiligencePrompt(cfg, 'opening', attempt.mode, { factIds: attempt.revealedFactIds, exhibitIds: attempt.revealedExhibitIds }, '');
      const raw = await streamFeedback(apiKey, system, 'Introduce the case to the candidate now.', t => setStreamText(stripCaseMeta(t)));
      const { cleanText, meta } = parseCaseMeta(raw);
      let updated = { ...attempt, sessionLog: [{ role: 'interviewer', content: cleanText, at: Date.now() }] };
      updated = applyMeta(updated, meta);
      onUpdateAttempt(attemptId, updated);
      setStreamText('');
    }catch(e){ toasts.push('Error: ' + e.message); }
    setStreaming(false);
  };

  const sendMessage = async () => {
    if(!input.trim() || streaming) return;
    if(!apiKey){ toasts.push('Add API key in Settings'); return; }
    const text = input.trim();
    const userMsg = { role: 'candidate', content: text, at: Date.now() };
    let hypothesis = attempt.userHypothesis;
    if(!hypothesis && attempt.state === 'hypothesis') hypothesis = text;
    const updatedLog = [...attempt.sessionLog, userMsg];
    onUpdateAttempt(attemptId, { sessionLog: updatedLog, userHypothesis: hypothesis });
    setInput(''); setStreaming(true); setStreamText('');
    try{
      const history = updatedLog.slice(-16).map(m => ({
        role: m.role === 'interviewer' ? 'assistant' : 'user',
        content: m.role === 'quant' ? `[DETERMINISTIC CHECK — already graded by code, do not re-judge] ${m.content}` : m.content,
      }));
      const system = buildPEDiligencePrompt(cfg, attempt.state, attempt.mode, { factIds: attempt.revealedFactIds, exhibitIds: attempt.revealedExhibitIds }, hypothesis || '');
      const raw = await streamFeedback(apiKey, system, history, t => setStreamText(stripCaseMeta(t)), 400);
      const { cleanText, meta } = parseCaseMeta(raw);
      let fc = { ...attempt, sessionLog: [...updatedLog, { role: 'interviewer', content: cleanText, at: Date.now() }], userHypothesis: hypothesis };
      fc = applyMeta(fc, meta);
      onUpdateAttempt(attemptId, fc);
      setStreamText('');
      if(fc.state === 'debrief' && attempt.state !== 'debrief') runDebrief(fc);
    }catch(e){ toasts.push('Error: ' + e.message); }
    setStreaming(false);
  };

  // The ONE place arithmetic is graded in this case — checkQuantAnswer is deterministic code, the
  // AI never sees or judges the raw number until AFTER this verdict exists.
  const submitQuantAnswer = (problem) => {
    if(!quantDraft.trim()) return;
    const result = checkQuantAnswer(problem, quantDraft.trim());
    const verdictLine = result.correct
      ? `Candidate answered "${quantDraft.trim()}" to "${problem.prompt}" — CORRECT (target ${problem.unit === '$' ? '$' : ''}${problem.correctAnswer}${problem.unit && problem.unit !== '$' ? problem.unit : ''}). Model reasoning: ${problem.modelAnswer}`
      : `Candidate answered "${quantDraft.trim()}" to "${problem.prompt}" — NOT YET CORRECT (target ${problem.unit === '$' ? '$' : ''}${problem.correctAnswer}${problem.unit && problem.unit !== '$' ? problem.unit : ''}). Model reasoning: ${problem.modelAnswer}`;
    const entry = { role: 'quant', content: verdictLine, problemId: problem.id, correct: result.correct, modelAnswer: problem.modelAnswer, userAnswer: quantDraft.trim(), at: Date.now() };
    const nc = {
      ...attempt, sessionLog: [...attempt.sessionLog, entry],
      solvedQuantIds: [...new Set([...(attempt.solvedQuantIds || []), problem.id])],
      quantResults: { ...attempt.quantResults, [problem.id]: { userAnswer: quantDraft.trim(), correct: result.correct, target: problem.correctAnswer, unit: problem.unit } },
    };
    onUpdateAttempt(attemptId, nc);
    setQuantDraft('');
  };

  const peNextManualAdvance = () => {
    const next = peNextManualState(attempt.state);
    if(next === attempt.state) return;
    onUpdateAttempt(attemptId, { state: next });
    setSuggestedPhase(null);
    if(next === 'debrief') runDebrief({ ...attempt, state: next });
  };

  const runDebrief = async (nc) => {
    if(!apiKey) return;
    setStreaming(true);
    try{
      const transcript = nc.sessionLog.map(m => {
        if(m.role === 'quant') return `[DETERMINISTIC CHECK] ${m.content}`;
        return `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`;
      }).join('\n\n');
      const resp = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey }, body: JSON.stringify({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, max_tokens: 1200, messages: [
        { role: 'system', content: buildPEDebriefPrompt(cfg) }, { role: 'user', content: `Case: ${cfg.title}\n\nTranscript:\n${transcript}` },
      ] }) });
      const j = await resp.json();
      const parsed = JSON.parse(j.choices[0].message.content);
      const finished = {
        ...nc, status: 'completed', state: 'done',
        dimensionScores: parsed.dimensionScores || {}, dimensionNotes: parsed.dimensionNotes || {},
        observedFailureModes: (parsed.observedFailureModes || []).filter(id => PE_FAILURE_MODE_IDS.includes(id)),
        strengths: parsed.strengths || [], weaknesses: parsed.weaknesses || [],
        debriefInsight: parsed.insight || '', topNextCaseFocus: parsed.topNextCaseFocus || '',
        timer: { ...nc.timer, finishedAt: Date.now() }, finishedAt: Date.now(),
      };
      onUpdateAttempt(attemptId, finished);
      onCaseFinished(finished, cfg);
      toasts.push('Case complete — logged');
    }catch(e){ toasts.push('Debrief error: ' + e.message); }
    setStreaming(false);
  };

  const saveScratchpad = () => onUpdateAttempt(attemptId, { scratchpad: scratchpadDraft });

  if(attempt.status === 'completed'){
    return <PEDiligenceDebrief attempt={attempt} cfg={cfg} onGoToModule={onGoToModule} onBack={onBack} />;
  }

  const isPractice = attempt.mode === 'practice';
  const elapsed = computeElapsedMs(attempt.timer, now);
  const isPaused = !!attempt.timer.pausedAt;
  const caseStateIdx = PE_CASE_STATES.indexOf(attempt.state);
  const revealedExhibits = (cfg.exhibits || []).filter(ex => (attempt.revealedExhibitIds || []).includes(ex.id));
  const focusExhibit = focusExhibitId ? cfg.exhibits.find(ex => ex.id === focusExhibitId) : null;
  const pendingQuant = (cfg.quantProblems || []).find(q => q.triggerPhase === attempt.state && !(attempt.solvedQuantIds || []).includes(q.id));
  const showHypothesisBanner = attempt.userHypothesis && PE_CASE_STATES.indexOf(attempt.state) > PE_CASE_STATES.indexOf('hypothesis');

  const conversation = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{cfg.title}</span>
          {isPractice && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: BDC_T.accentBright }}>{PE_CASE_STATE_LABELS[attempt.state] || 'Active'}</span>}
          {isPractice && <div className="flex gap-0.5">{PE_CASE_STATES.slice(0, -2).map((s, i) => <div key={s} className="w-2 h-2 rounded-full" style={{ background: i <= caseStateIdx ? '#6366f1' : 'rgba(255,255,255,0.1)' }} />)}</div>}
          <span className="text-xs font-mono" style={{ color: BDC_T.faint }}>{fmtPECaseTimer(elapsed)}</span>
          {!isPaused ? <button onClick={() => onUpdateAttempt(attemptId, { timer: { ...attempt.timer, pausedAt: Date.now() } })} className="text-xs px-2 py-0.5 rounded" style={{ color: BDC_T.faint, background: 'rgba(255,255,255,0.05)' }}>Pause</button>
            : <button onClick={() => onUpdateAttempt(attemptId, { timer: { ...attempt.timer, pausedMs: (attempt.timer.pausedMs || 0) + (Date.now() - attempt.timer.pausedAt), pausedAt: null } })} className="text-xs px-2 py-0.5 rounded" style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)' }}>Resume</button>}
        </div>
        <div className="flex items-center gap-2">
          {isPractice && caseStateIdx < PE_CASE_STATES.length - 2 && (
            <button onClick={peNextManualAdvance} disabled={streaming} className="text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', opacity: streaming ? 0.4 : 1 }}>Next Phase →</button>
          )}
          <button onClick={onBack} className="text-xs px-2 py-1 rounded" style={{ color: '#64748b' }}>Exit</button>
        </div>
      </div>
      {isPractice && suggestedPhase && suggestedPhase !== attempt.state && (
        <div className="flex-shrink-0 mb-2 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)', color: BDC_T.accent }}>Interviewer suggests moving to {PE_CASE_STATE_LABELS[suggestedPhase] || suggestedPhase} — use "Next Phase" when ready.</div>
      )}
      {showHypothesisBanner && (
        <div className="flex-shrink-0 mb-3 rounded-xl px-4 py-2.5" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}>
          <div className="text-xs font-bold tracking-widest mb-0.5" style={{ color: '#818cf8' }}>YOUR INITIAL HYPOTHESIS</div>
          <div className="text-xs leading-relaxed" style={{ color: BDC_T.mid }}>{attempt.userHypothesis}</div>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {(attempt.sessionLog || []).map((m, i) => {
          if(m.role === 'quant'){
            return (
              <div key={i} className="flex justify-center">
                <div className="max-w-md rounded-xl px-3 py-2.5 text-xs" style={{ background: m.correct ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${m.correct ? 'rgba(52,211,153,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                  <div className="font-semibold mb-1 text-center" style={{ color: m.correct ? BDC_T.good : BDC_T.warn }}>{m.correct ? `✓ Correct — ${m.userAnswer}` : `○ Not quite — you answered ${m.userAnswer}`}</div>
                  <div style={{ color: BDC_T.mid }}>{m.modelAnswer}</div>
                </div>
              </div>
            );
          }
          return (
            <div key={i} className={`flex ${m.role === 'candidate' ? 'justify-end' : ''}`}>
              <div className="max-w-lg rounded-xl px-4 py-3 text-sm" style={{ background: m.role === 'interviewer' ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.15)', color: '#e2e8f0' }}>
                <div className="text-xs mb-1 font-semibold" style={{ color: m.role === 'interviewer' ? '#64748b' : '#818cf8' }}>{m.role === 'interviewer' ? 'Interviewer' : 'You'}</div>
                {m.content}
              </div>
            </div>
          );
        })}
        {streaming && streamText && (
          <div className="flex"><div className="max-w-lg rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>
            <div className="text-xs mb-1 font-semibold" style={{ color: '#64748b' }}>Interviewer</div>{streamText}<span className="animate-pulse">▋</span>
          </div></div>
        )}
      </div>
      {pendingQuant && (
        <div className="flex-shrink-0 mb-2 rounded-xl p-3" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)' }}>
          <div className="text-xs font-bold tracking-widest mb-1" style={{ color: BDC_T.accentBright }}>QUANT CHECK</div>
          <div className="text-sm mb-2" style={{ color: BDC_T.text }}>{pendingQuant.prompt}</div>
          <div className="flex gap-2">
            <input value={quantDraft} onChange={e => setQuantDraft(e.target.value)} onKeyDown={e => { if(e.key === 'Enter'){ e.preventDefault(); submitQuantAnswer(pendingQuant); } }} placeholder="Your number…" className="flex-1 px-3 py-1.5 rounded-lg text-sm" style={BDC_FIELD} />
            <BDCPrimaryButton small onClick={() => submitQuantAnswer(pendingQuant)} disabled={!quantDraft.trim()}>Check</BDCPrimaryButton>
          </div>
          <div className="text-[11px] mt-1.5" style={{ color: BDC_T.faint }}>Graded deterministically — this number is checked by code, not by the interviewer.</div>
        </div>
      )}
      <div className="flex-shrink-0">
        <div className="flex gap-2 mb-1.5 items-center">
          <button onClick={() => setVoiceEnabled(v => !v)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: voiceEnabled ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${voiceEnabled ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`, color: voiceEnabled ? '#818cf8' : '#64748b' }}>🎙 Voice {voiceEnabled ? 'ON' : 'OFF'}</button>
        </div>
        <div className="flex gap-2">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); } }} rows={2} placeholder="Your response… (Enter to send, Shift+Enter for newline)" className="flex-1 px-3 py-2 rounded-xl text-sm bg-transparent resize-none outline-none" style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }} />
          <div className="flex flex-col gap-1">
            {voiceEnabled && <button onClick={() => { if(!dict.hasSpeech) return; dict.toggle(); }} title={dict.listening ? 'Stop' : 'Record'} className="px-3 rounded-lg text-xs" style={{ background: dict.listening ? 'rgba(248,113,113,0.2)' : 'rgba(99,102,241,0.15)', color: dict.listening ? '#f87171' : '#818cf8', height: '50%' }}>{dict.listening ? '⏹' : '🎙'}</button>}
            <button onClick={sendMessage} disabled={streaming || !input.trim()} className="px-3 rounded-lg text-xs font-semibold" style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', color: '#fff', height: '50%', opacity: streaming || !input.trim() ? 0.4 : 1 }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );

  const exhibitPane = (
    <div>
      <div className="text-xs font-semibold mb-2" style={{ color: BDC_T.faint }}>EXHIBITS {revealedExhibits.length > 0 ? `(${revealedExhibits.length})` : ''}</div>
      {revealedExhibits.length === 0 && <div className="text-xs" style={{ color: BDC_T.faint }}>None revealed yet — ask the interviewer for relevant data.</div>}
      <div className="space-y-2">
        {revealedExhibits.map(ex => (
          <div key={ex.id} onClick={() => setFocusExhibitId(ex.id)} style={{ cursor: 'pointer' }}>
            <ExhibitViewer exhibit={ex} mode="panel" onExpand={() => setFocusExhibitId(ex.id)} />
          </div>
        ))}
      </div>
    </div>
  );

  const notesPane = (
    <div>
      <div className="text-xs font-semibold mb-2" style={{ color: BDC_T.faint }}>SCRATCHPAD</div>
      <textarea value={scratchpadDraft} onChange={e => setScratchpadDraft(e.target.value)} onBlur={saveScratchpad} rows={16}
        placeholder={'Optional — not graded. Objective / Structure / Math / Insights / Risks…'}
        className="w-full rounded-lg p-2 text-sm" style={BDC_FIELD} />
    </div>
  );

  const focusModal = focusExhibit && <ExhibitViewer exhibit={focusExhibit} mode="focus" onClose={() => setFocusExhibitId(null)} />;

  if(isMobile){
    return (
      <div style={{ height: 'calc(100vh - 160px)' }} className="flex flex-col">
        <div className="flex gap-1 mb-3 flex-shrink-0">
          {[['interview', 'Interview'], ['exhibit', 'Exhibit'], ['notes', 'Notes']].map(([id, label]) => (
            <button key={id} onClick={() => setMobileTab(id)} className="flex-1 py-1.5 rounded-lg text-xs font-medium" style={{ background: mobileTab === id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', color: mobileTab === id ? BDC_T.accent : BDC_T.faint }}>{label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {mobileTab === 'interview' && conversation}
          {mobileTab === 'exhibit' && exhibitPane}
          {mobileTab === 'notes' && notesPane}
        </div>
        {focusModal}
      </div>
    );
  }
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 320px', height: 'calc(100vh - 140px)' }}>
      <div>{conversation}</div>
      <div className="overflow-y-auto space-y-5">{exhibitPane}{notesPane}</div>
      {focusModal}
    </div>
  );
}

/* ==================== Debrief ==================== */

function PEDiligenceDebrief({ attempt, cfg, onGoToModule, onBack }){
  const scores = attempt.dimensionScores || {};
  const notes = attempt.dimensionNotes || {};
  const overall = Object.values(scores).length ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length) : null;
  const failureModes = attempt.observedFailureModes || [];
  const top2 = [attempt.topNextCaseFocus, ...(attempt.weaknesses || [])].filter(Boolean).slice(0, 2);

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="text-xs leading-relaxed" style={{ color: BDC_T.faint }}>This practice format is modeled on a candidate-led PE diligence case style seen in external interview-prep material — not an official Bain Capital case.</div>
      </div>
      <div className="glass rounded-xl p-6 border-subtle mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Debrief — {cfg.title}</div>
          {overall != null && <div className="text-2xl font-bold" style={{ color: overall >= 7 ? '#34d399' : overall >= 5 ? '#f59e0b' : '#f87171' }}>{overall}<span className="text-sm" style={{ color: '#64748b' }}>/10</span></div>}
        </div>
        {attempt.debriefInsight && <div className="text-xs mb-4 p-3 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{attempt.debriefInsight}</div>}

        {top2.length > 0 && (
          <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="text-xs font-bold tracking-widest mb-1" style={{ color: '#818cf8' }}>TOP 2 THINGS TO FIX</div>
            <ul className="space-y-1">{top2.map((t, i) => <li key={i} className="text-sm" style={{ color: '#e2e8f0' }}>{i + 1}. {t}</li>)}</ul>
          </div>
        )}

        <div className="space-y-3 mb-4">
          {Object.entries(scores).map(([k, v]) => {
            const n = notes[k] || {};
            const label = BAIN_CAPABILITY_LABELS[k] || k;
            const linkedModeIds = failureModes.filter(fid => PE_FAILURE_MODE_TO_LEARN_MODULE[fid]);
            return (
              <div key={k} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm font-bold" style={{ color: v >= 7 ? '#34d399' : v >= 5 ? '#f59e0b' : '#f87171' }}>{v}/10</span>
                </div>
                {n.observed && <div className="text-xs mb-1" style={{ color: '#94a3b8' }}><span style={{ color: '#64748b' }}>Observed: </span>{n.observed}</div>}
                {n.good && <div className="text-xs mb-1" style={{ color: '#34d399' }}>+ {n.good}</div>}
                {(n.improve || linkedModeIds.length > 0) && (
                  <div className="text-xs mb-1" style={{ color: '#f59e0b' }}>
                    ↑ {n.improve}
                    {linkedModeIds.map(fid => ` ${PE_FAILURE_MODES[fid]}`).join('')}
                  </div>
                )}
                {n.nextRep && <div className="text-xs" style={{ color: '#818cf8' }}>Next rep: {n.nextRep}</div>}
              </div>
            );
          })}
        </div>

        {failureModes.length > 0 && onGoToModule && (() => {
          const moduleIds = [...new Set(failureModes.map(fid => PE_FAILURE_MODE_TO_LEARN_MODULE[fid]).filter(Boolean))].slice(0, 2);
          return moduleIds.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {moduleIds.map(mid => <button key={mid} onClick={() => onGoToModule(mid)} className="text-xs px-2 py-1 rounded" style={{ color: '#a5b4fc', background: 'rgba(99,102,241,0.08)' }}>Learn more →</button>)}
            </div>
          ) : null;
        })()}
      </div>
      <BDCSecondaryButton onClick={onBack}>← All Cases</BDCSecondaryButton>
    </div>
  );
}
