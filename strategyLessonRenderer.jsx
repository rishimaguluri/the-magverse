// strategyLessonRenderer.jsx
// The new block-based lesson experience (Strategy Experience Upgrade, Pass A/B). Replaces the
// old LessonSection/LessonViewer stacked-accordion pattern with a single-scroll, typographically
// distinct rendering of a lesson's blocks[] — reading-optimized body text, one visual treatment
// per content type instead of another glass card, and light interactive checks.
//
// Reuses T / FIELD_STYLE / PrimaryButton / SecondaryButton / Pill from strategyPanel.jsx and
// VisualBlock from strategyVisualRenderer.jsx — safe regardless of relative <script> order since
// these are only referenced inside component bodies at render time, after every classic script
// on the page has already executed (same forward-reference pattern strategyPanel.jsx already
// uses for STRATEGY_CONTENT/strategyEngine.js exports). Classic Babel-transformed script.
//
// getLessonBlocks(lesson) (strategyEngine.js) is the ONLY place that decides native-blocks[]
// vs. legacy-8-field lessons — this file always just renders whatever array it returns.

const LR_KIND_META = {
  text: {label:'Idea', color:'#a5b4fc'},
  example: {label:'Example', color:'#34d399'},
  counterexample: {label:'Counterexample', color:'#f59e0b'},
  'company-vignette': {label:'Company', color:'#22d3ee'},
};

function Prose({children}){
  return <div style={{fontSize:16.5, lineHeight:1.65, color:'#cbd5e1', maxWidth:'68ch', whiteSpace:'pre-line'}}>{children}</div>;
}

function BlockFrame({kind, heading, emphasis, children}){
  const meta = LR_KIND_META[kind] || LR_KIND_META.text;
  return (
    <div style={{borderLeft:`3px solid ${meta.color}`, paddingLeft:16,
      ...(emphasis ? {background:'rgba(99,102,241,0.06)', borderRadius:'0 10px 10px 0', padding:'12px 16px'} : {})}}>
      <div style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', color:meta.color, fontWeight:600, marginBottom:6}}>{heading || meta.label}</div>
      {children}
    </div>
  );
}

function WorkedExampleBlock({block}){
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)'}}>
      <div style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', color:T.accent, fontWeight:600, marginBottom:8}}>Worked Example</div>
      <Prose>{block.question}</Prose>
      {!revealed ? (
        <button onClick={()=>setRevealed(true)} className="text-xs mt-3 px-2 py-1 rounded-lg" style={{background:'rgba(255,255,255,0.06)', color:T.mid}}>
          Show a weak answer, and why it's weak
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <div><div style={{fontSize:11, color:'#f59e0b', fontWeight:600, marginBottom:2}}>Weak answer</div><Prose>{block.weakAnswer}</Prose></div>
          <div><div style={{fontSize:11, color:'#f59e0b', fontWeight:600, marginBottom:2}}>Why it's weak</div><Prose>{block.whyWeak}</Prose></div>
          <div><div style={{fontSize:11, color:'#34d399', fontWeight:600, marginBottom:2}}>Stronger analysis</div><Prose>{block.strongerAnswer}</Prose></div>
          <div><div style={{fontSize:11, color:'#34d399', fontWeight:600, marginBottom:2}}>Why it's stronger</div><Prose>{block.whyStrong}</Prose></div>
        </div>
      )}
      {block.yourTurnPrompt && (
        <div className="mt-3 pt-3" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{fontSize:11, color:T.accent, fontWeight:600, marginBottom:4}}>Your turn</div>
          <Prose>{block.yourTurnPrompt}</Prose>
        </div>
      )}
    </div>
  );
}

function QuestionBlock({block}){
  const [picked, setPicked] = useState(null);
  if(block.freeText || !block.choices){
    return (
      <div className="rounded-xl p-4" style={{background:'rgba(165,180,252,0.06)', border:'1px solid rgba(165,180,252,0.25)'}}>
        <div style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', color:T.accent, fontWeight:600, marginBottom:6}}>Think first</div>
        <Prose>{block.prompt}</Prose>
      </div>
    );
  }
  const correctIdx = block.choices.findIndex(c=>c.correct);
  return (
    <div className="rounded-xl p-4" style={{background:'rgba(165,180,252,0.06)', border:'1px solid rgba(165,180,252,0.25)'}}>
      <div style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', color:T.accent, fontWeight:600, marginBottom:6}}>Quick check</div>
      <Prose>{block.prompt}</Prose>
      <div className="mt-3 space-y-1.5">
        {block.choices.map((c,i)=>{
          const showState = picked!==null;
          const isPicked = picked===i;
          const bg = showState ? (c.correct ? 'rgba(52,211,153,0.15)' : (isPicked ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.02)')) : 'rgba(255,255,255,0.03)';
          return (
            <button key={i} onClick={()=>picked===null && setPicked(i)} className="w-full text-left text-sm rounded-lg px-3 py-2"
              style={{background:bg, color:'#cbd5e1', border:'1px solid rgba(255,255,255,0.06)'}}>{c.label}</button>
          );
        })}
      </div>
      {picked!==null && (
        <div className="mt-2 text-sm" style={{color: picked===correctIdx ? '#34d399' : '#f87171'}}>
          {picked===correctIdx ? 'Correct. ' : 'Not quite. '}{block.explanation}
        </div>
      )}
    </div>
  );
}

function MiniCheckBlock({block}){
  const [confidence, setConfidence] = useState(null);
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)'}}>
      <div style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', color:'#c4b5fd', fontWeight:600, marginBottom:6}}>Calibration check</div>
      <Prose>{block.prompt}</Prose>
      {!revealed ? (
        <>
          <textarea value={answer} onChange={e=>setAnswer(e.target.value)} rows={2} placeholder="Your answer..."
            className="w-full rounded-lg p-2 text-sm mt-2" style={FIELD_STYLE} />
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs" style={{color:T.faint}}>How confident are you?</span>
            {[50,60,70,80,90].map(p=>(
              <button key={p} onClick={()=>setConfidence(p)} className="text-xs px-2 py-1 rounded-lg"
                style={{background: confidence===p ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)', color: confidence===p ? T.accent : T.mid}}>{p}%</button>
            ))}
          </div>
          <button onClick={()=>setRevealed(true)} disabled={!answer.trim()||!confidence} className="text-xs mt-3 px-2 py-1 rounded-lg"
            style={{background:'rgba(255,255,255,0.06)', color: (!answer.trim()||!confidence) ? T.faint : T.mid, opacity: (!answer.trim()||!confidence) ? 0.5 : 1}}>
            Reveal reference answer
          </button>
        </>
      ) : (
        <>
          <div className="text-sm mt-2 p-2 rounded-lg" style={{background:'rgba(255,255,255,0.03)', color:'#cbd5e1'}}>{block.reveal}</div>
          <div className="text-xs mt-2" style={{color:T.faint}}>You said {confidence}% confident. Calibration means your confidence should roughly match how often you're actually right — track this over time in Review.</div>
        </>
      )}
    </div>
  );
}

function TakeawayBlock({block}){
  return (
    <div className="rounded-xl p-4" style={{background:'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border:'1px solid rgba(99,102,241,0.3)'}}>
      <div style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em', color:T.accentBright, fontWeight:600, marginBottom:6}}>The rule</div>
      <div style={{fontSize:18, fontWeight:600, color:T.text, lineHeight:1.4}}>{block.body}</div>
    </div>
  );
}

function ConnectionFooter({items}){
  if(!items || !items.length) return null;
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs" style={{color:T.faint}}>Coming next:</span>
      {items.map((it,i)=>(
        <span key={i} className="text-xs px-2 py-1 rounded-full" style={{background:'rgba(255,255,255,0.05)', color:T.mid}}>{it.label}</span>
      ))}
    </div>
  );
}

function LessonBlockRenderer({block}){
  if(!block) return null;
  switch(block.type){
    case 'text': return block.body ? <BlockFrame kind="text" heading={block.heading} emphasis={block.emphasis}><Prose>{block.body}</Prose></BlockFrame> : null;
    case 'example': return block.body ? <BlockFrame kind="example" heading={block.heading}><Prose>{block.body}</Prose></BlockFrame> : null;
    case 'counterexample': return block.body ? <BlockFrame kind="counterexample" heading={block.heading}><Prose>{block.body}</Prose></BlockFrame> : null;
    case 'company-vignette': return block.body ? <BlockFrame kind="company-vignette" heading={block.company || block.heading}><Prose>{block.body}</Prose></BlockFrame> : null;
    case 'source': return block.body ? <div style={{fontSize:12, color:T.faint, fontStyle:'italic'}}>Source: {block.body}</div> : null;
    case 'visual': return block.visual ? <VisualBlock visual={block.visual} /> : null;
    case 'worked-example': return <WorkedExampleBlock block={block} />;
    case 'question': return <QuestionBlock block={block} />;
    case 'mini-check': return <MiniCheckBlock block={block} />;
    case 'takeaway': return block.body ? <TakeawayBlock block={block} /> : null;
    default: return null;
  }
}

function LessonViewerV2({lessonId, strategy, markLessonComplete, saveReflectionDraft, saveNote, setCoachContext, onBack}){
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

  const blocks = getLessonBlocks(lesson);

  return (
    <div className="space-y-5" style={{maxWidth:'42rem'}}>
      <button onClick={onBack} className="text-xs" style={{color:T.faint}}>← Back to roadmap</button>

      <div>
        {lesson.subtitle && <div className="text-xs uppercase tracking-wide" style={{color:T.faint, marginBottom:4}}>{lesson.subtitle}</div>}
        <h2 style={{fontSize:32, fontWeight:700, lineHeight:1.2, color:T.text, letterSpacing:'-0.01em'}}>{lesson.title}</h2>
        {lesson.bigQuestion && <div style={{fontSize:16.5, color:T.accent, marginTop:8, lineHeight:1.4}}>{lesson.bigQuestion}</div>}
        {lesson.estimatedMinutes && <div className="text-xs mt-2" style={{color:T.faint}}>~{lesson.estimatedMinutes} min</div>}
      </div>

      {blocks.map((b,i)=><LessonBlockRenderer key={i} block={b} />)}

      <ConnectionFooter items={lesson.nextConnections} />

      <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{fontSize:15, fontWeight:600, color:T.text, marginBottom:6}}>{lesson.strategicQuestion || 'What did you learn?'}</div>
        <textarea value={reflection} onChange={e=>setReflection(e.target.value)} onBlur={e=>saveReflectionDraft(lessonId, weekId, e.target.value)} rows={4}
          placeholder="Write your own answer before moving on..."
          className="w-full rounded-lg p-2 text-sm" style={FIELD_STYLE} />
        <div className="flex gap-2 mt-2">
          <button onClick={()=>markLessonComplete(lessonId, weekId, reflection)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{background: done ? '#10b981' : 'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
            {done ? 'Update reflection' : 'Mark Complete'}
          </button>
          <SecondaryButton onClick={()=>saveNote(lesson.title, reflection)}>Save to Notes</SecondaryButton>
        </div>
      </div>
    </div>
  );
}
