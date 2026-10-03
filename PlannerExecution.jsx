// PlannerExecution.jsx
// The calm single-task execution view after "Start Next" — current session, before checklist,
// definition of done, a small (not giant) elapsed-time display, quick capture that writes
// straight into the universal data.inbox (no second inbox), Done/Partial/Blocked/Skip, and a
// preview of what's next. The companion is calmer here by design (PlannerPage passes a quieter
// companionState while this view is active).

const PEX_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b' };

function pexFmtElapsed(ms){
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60), sec = s % 60;
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

function PlannerExecution({ session, workItem, nextSession, onFinish, onQuickCapture, onBack }){
  const [checked, setChecked] = useState({});
  const [now, setNow] = useState(Date.now());
  const [captureText, setCaptureText] = useState('');
  const [captureAck, setCaptureAck] = useState(false);
  const [closing, setClosing] = useState(null); // 'partial'|'blocked' while asking a follow-up note
  const [closeNote, setCloseNote] = useState('');
  const startRef = useRef(session?.actualStart ? new Date(session.actualStart).getTime() : Date.now());

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  if(!session) return <div style={{ fontSize: 14, color: PEX_T.faint }}>Nothing in progress.</div>;

  const elapsed = now - startRef.current;

  const submitCapture = () => {
    if(!captureText.trim()) return;
    onQuickCapture(captureText.trim());
    setCaptureText('');
    setCaptureAck(true);
    setTimeout(() => setCaptureAck(false), 1600);
  };

  const finishWith = (outcome) => {
    if(outcome === 'partial' || outcome === 'blocked'){ setClosing(outcome); return; }
    onFinish(outcome, '');
  };
  const confirmClosing = () => { onFinish(closing, closeNote); setClosing(null); setCloseNote(''); };

  return (
    <div className="space-y-4" style={{ maxWidth: '38rem' }}>
      {onBack && <button onClick={onBack} className="text-xs" style={{ color: PEX_T.faint }}>← Back to plan</button>}

      <div className="flex items-center justify-between">
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: PEX_T.faint }}>Right now</div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: PEX_T.mid }}>{pexFmtElapsed(elapsed)}</div>
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 700, color: PEX_T.text, lineHeight: 1.3 }}>{session.title}</h2>

      {session.beforeSteps?.length > 0 && (
        <div style={{ borderLeft: '3px solid #a5b4fc', paddingLeft: 12 }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc', fontWeight: 600, marginBottom: 4 }}>Before</div>
          <div className="space-y-1">
            {session.beforeSteps.map((s, i) => (
              <label key={i} className="flex items-center gap-2 text-sm" style={{ color: checked[i] ? PEX_T.faint : PEX_T.dim, textDecoration: checked[i] ? 'line-through' : 'none' }}>
                <input type="checkbox" checked={!!checked[i]} onChange={() => setChecked(c => ({ ...c, [i]: !c[i] }))} />
                {s}
              </label>
            ))}
          </div>
        </div>
      )}

      {session.workSteps?.length > 0 && (
        <div style={{ borderLeft: '3px solid #818cf8', paddingLeft: 12 }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818cf8', fontWeight: 600, marginBottom: 4 }}>Work</div>
          <ul style={{ fontSize: 14, color: PEX_T.dim, lineHeight: 1.6, paddingLeft: 16 }}>
            {session.workSteps.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {session.definitionOfDone && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#34d399', fontWeight: 600, marginBottom: 3 }}>Done when</div>
          <div style={{ fontSize: 13.5, color: PEX_T.dim }}>{session.definitionOfDone}</div>
        </div>
      )}

      {closing ? (
        <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 13, color: PEX_T.dim }}>{closing === 'partial' ? 'What remains?' : 'What are you blocked on?'}</div>
          <input value={closeNote} onChange={e => setCloseNote(e.target.value)} autoFocus
            className="w-full rounded-lg px-2.5 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.04)', color: PEX_T.text, border: '1px solid rgba(255,255,255,0.08)' }} />
          <div className="flex gap-2">
            <button onClick={confirmClosing} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Confirm</button>
            <button onClick={() => setClosing(null)} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.06)', color: PEX_T.mid }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => finishWith('done')} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Done</button>
          <button onClick={() => finishWith('partial')} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.06)', color: PEX_T.mid }}>Partial</button>
          <button onClick={() => finishWith('blocked')} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.06)', color: PEX_T.mid }}>Blocked</button>
          <button onClick={() => finishWith('skipped')} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.06)', color: PEX_T.mid }}>Skip</button>
        </div>
      )}

      <div className="rounded-lg p-2.5 flex gap-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <input value={captureText} onChange={e => setCaptureText(e.target.value)}
          onKeyDown={e => { if(e.key === 'Enter') submitCapture(); }}
          placeholder="Something else on your mind? Capture it without losing your place."
          className="flex-1 text-sm" style={{ background: 'transparent', color: PEX_T.text, outline: 'none' }} />
        <button onClick={submitCapture} style={{ fontSize: 12.5, color: PEX_T.mid }}>Capture</button>
      </div>
      {captureAck && <div style={{ fontSize: 12.5, color: PEX_T.faint }}>Got it. Back to {workItem ? workItem.title : 'this'}.</div>}

      {nextSession && (
        <div style={{ fontSize: 12.5, color: PEX_T.faint }}>Up next: {nextSession.title}</div>
      )}
    </div>
  );
}
