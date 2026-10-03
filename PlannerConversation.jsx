// PlannerConversation.jsx
// Message list + brain-dump input. Voice reuses the shared useDictation hook (App.jsx) —
// exactly the same non-memoized inline-callback pattern QuickCaptureModal already uses, not a
// second SpeechRecognition implementation. Small floating task-scrap tiles acknowledge newly
// extracted items without a particle-physics engine — plain CSS fade/slide.

const PCV_T = { text: '#e2e8f0', dim: '#cbd5e1', mid: '#94a3b8', faint: '#64748b' };

function PlannerConversation({ conversation, onSend, loading, newlyExtractedTitles }){
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);
  const dict = useDictation(t => setDraft(prev => (prev ? prev + ' ' + t : t)));

  useEffect(() => { if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [conversation, loading]);

  const send = () => {
    const text = draft.trim();
    if(!text || loading) return;
    setDraft('');
    onSend(text);
  };

  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes pcvScrapIn { from{ opacity:0; transform:translateY(-6px) scale(0.92); } to{ opacity:1; transform:translateY(0) scale(1); } }
        .pcv-scrap { animation: pcvScrapIn 0.3s ease both; }
      `}</style>

      {newlyExtractedTitles?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {newlyExtractedTitles.map((t, i) => (
            <span key={i} className="pcv-scrap text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', animationDelay: (i * 60) + 'ms' }}>
              + {t.length > 34 ? t.slice(0, 34) + '…' : t}
            </span>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-auto space-y-3 mb-3" style={{ minHeight: 0 }}>
        {conversation.length === 0 && (
          <div style={{ fontSize: 14, color: PCV_T.faint, lineHeight: 1.6 }}>
            Dump everything on me. Tasks, deadlines, stuff you should probably do, things you're avoiding. It can be messy.
          </div>
        )}
        {conversation.map(m => (
          <div key={m.id} className="text-sm rounded-lg p-2.5" style={{ maxWidth: '88%', marginLeft: m.role === 'user' ? 'auto' : 0, background: m.role === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', color: PCV_T.text, whiteSpace: 'pre-line' }}>
            {m.text}
          </div>
        ))}
        {loading && <div style={{ fontSize: 12.5, color: PCV_T.faint }}>Thinking…</div>}
      </div>

      <div className="flex gap-2 items-end">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send(); } }}
          placeholder="What's on your mind? Messy is fine."
          rows={2}
          className="flex-1 rounded-lg p-2.5 text-sm"
          style={{ background: 'rgba(255,255,255,0.04)', color: PCV_T.text, border: '1px solid rgba(255,255,255,0.08)', resize: 'none', fontFamily: 'inherit' }}
        />
        {dict.hasSpeech && (
          <button
            onClick={dict.toggle}
            aria-label={dict.listening ? 'Stop voice input' : 'Start voice input'}
            className="px-3 py-2.5 rounded-lg text-sm flex-shrink-0"
            style={{ background: dict.listening ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.05)', color: dict.listening ? '#f87171' : PCV_T.mid }}
          >
            🎤
          </button>
        )}
        <button
          onClick={send}
          disabled={!draft.trim() || loading}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-white flex-shrink-0"
          style={{ background: (!draft.trim() || loading) ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', opacity: (!draft.trim() || loading) ? 0.6 : 1 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
