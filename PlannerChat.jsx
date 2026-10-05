// PlannerChat.jsx
// The companion/conversation panel — now a minority of the screen (Part "Desktop layout": 70-75%
// workbench / 25-30% companion), collapsible, with compact message rows instead of giant
// stacked bubbles, and an auto-growing single-line-default input instead of a fixed textarea.
// Voice reuses the shared useDictation hook (App.jsx) — same pattern QuickCaptureModal already
// uses, not a second SpeechRecognition implementation.

const PCH_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b' };

function PlannerChat({ conversation, onSend, loading, collapsed, onToggleCollapse, quickChips }){
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const dict = useDictation(t => setDraft(prev => (prev ? prev + ' ' + t : t)));

  useEffect(() => { if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [conversation, loading]);
  useEffect(() => {
    if(!taRef.current) return;
    taRef.current.style.height = 'auto';
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 132) + 'px'; // ~6 lines max
  }, [draft]);

  const send = () => {
    const text = draft.trim();
    if(!text || loading) return;
    setDraft('');
    onSend(text);
  };

  if(collapsed){
    return (
      <button onClick={onToggleCollapse} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: 12.5, color: PCH_T.mid }}>Tell Navigator anything…</span>
      </button>
    );
  }

  const recent = conversation.slice(-12);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: PCH_T.faint }}>Navigator</span>
        {onToggleCollapse && <button onClick={onToggleCollapse} style={{ fontSize: 11.5, color: PCH_T.faint }}>Hide</button>}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto space-y-1.5 mb-2" style={{ minHeight: 0 }}>
        {conversation.length === 0 && (
          <div style={{ fontSize: 13, color: PCH_T.faint, lineHeight: 1.55 }}>
            Dump everything on me. Tasks, deadlines, stuff you're avoiding. Messy is fine.
          </div>
        )}
        {recent.map(m => (
          m.role === 'user' ? (
            <div key={m.id} className="text-xs rounded-lg px-2.5 py-1.5" style={{ maxWidth: '90%', marginLeft: 'auto', background: 'rgba(99,102,241,0.14)', color: PCH_T.text }}>
              {m.text}
            </div>
          ) : (
            <div key={m.id} style={{ fontSize: 13, color: PCH_T.dim, lineHeight: 1.5, padding: '2px 0' }}>{m.text}</div>
          )
        ))}
        {loading && <div style={{ fontSize: 12, color: PCH_T.faint }}>…</div>}
      </div>

      {quickChips?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {quickChips.map((c, i) => (
            <button key={i} onClick={() => onSend(c)} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: PCH_T.mid }}>{c}</button>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 items-end">
        <textarea
          ref={taRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(); } }}
          placeholder="Tell Navigator anything…"
          rows={1}
          className="flex-1 rounded-lg px-2.5 py-2 text-sm"
          style={{ background: 'rgba(255,255,255,0.04)', color: PCH_T.text, border: '1px solid rgba(255,255,255,0.08)', resize: 'none', fontFamily: 'inherit', overflowY: 'auto', maxHeight: 132 }}
        />
        {dict.hasSpeech && (
          <button onClick={dict.toggle} aria-label={dict.listening ? 'Stop voice input' : 'Start voice input'}
            className="px-2.5 py-2 rounded-lg text-sm flex-shrink-0"
            style={{ background: dict.listening ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.05)', color: dict.listening ? '#f87171' : PCH_T.mid }}>
            🎤
          </button>
        )}
        <button onClick={send} disabled={!draft.trim() || loading} className="px-3 py-2 rounded-lg text-sm font-medium text-white flex-shrink-0"
          style={{ background: (!draft.trim() || loading) ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', opacity: (!draft.trim() || loading) ? 0.6 : 1 }}>
          →
        </button>
      </div>
    </div>
  );
}
