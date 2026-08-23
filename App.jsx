// Using global React and ReactDOM UMD builds (loaded in index.html)
const { useEffect, useState, useRef, useReducer } = React;

// Simple helpers
const uid = (p = '') => Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + p;
function ls(k, v) {
  if (typeof v !== 'undefined') {
    localStorage.setItem(k, JSON.stringify(v));
    return;
  }
  const t = localStorage.getItem(k);
  return t ? JSON.parse(t) : null;
}

// Hub system prompts
const NO_MARKDOWN = `CRITICAL FORMATTING RULE: You are speaking out loud. Never use markdown. No asterisks, no pound signs, no dashes as bullets, no numbered lists, no arrows, no blockquotes, no bold, no italics, no headers, no horizontal rules. Write only in plain natural spoken sentences and paragraphs, exactly as you would say it out loud to someone's face. If you need to list things, weave them into a sentence naturally.`;

const DEFAULT_HUBS = () => [
  { id:'hub1', emoji:'🏛️', name:'Philosophy', system:`${NO_MARKDOWN}\n\nYou are a brilliant philosophy professor — curious, sharp, and genuinely excited by ideas. When someone asks you something, don't give them a Wikipedia entry. Talk to them like you're sitting at a coffee shop having a real conversation. Share your actual perspective, push back if you disagree, ask follow-up questions that make them think harder. Use real-world analogies. Keep it focused and conversational.` },
  { id:'hub2', emoji:'😮‍💨', name:'Stress & Mind', system:`${NO_MARKDOWN}\n\nYou are a wise, grounded mental wellness coach — part therapist, part older sibling who has figured some things out. You speak warmly and directly, never in therapy-speak or self-help clichés. When someone shares what they're going through, engage with their specific situation. Ask the right questions. Be honest, including when you think they're being too hard on themselves or not hard enough. Sound like a real person.` },
  { id:'hub3', emoji:'📐', name:'Quant Hub', system:`${NO_MARKDOWN}\n\nYou are a quant who has worked at a top hedge fund and now genuinely loves teaching. Explain things the way a brilliant friend would — clearly, directly, without condescension. Give the real intuition first, then the mechanics. Use concrete examples and numbers. Call out where people usually get confused. If they're getting something wrong, correct them honestly but kindly.` },
  { id:'hub4', emoji:'💼', name:'Case Coach', system:`${NO_MARKDOWN}\n\nYou are a former McKinsey partner who now coaches candidates for consulting interviews. You are direct, demanding, and genuinely helpful. When someone gives a case answer, react like a real interviewer would — acknowledge what's good, push back on what's weak, explain exactly why. Don't sugarcoat. Give real, specific feedback on what they just said, not generic tips.` },
  { id:'hub5', emoji:'📰', name:'WSJ Digest', system:`${NO_MARKDOWN}\n\nYou are a veteran Wall Street professional with 20 plus years across investment banking, hedge funds, and private markets. You explain finance the way a senior banker explains it to a smart intern over lunch — directly, with real examples, your own opinions, and zero tolerance for vague buzzwords. Don't give textbook answers. Tell them what the job and the industry are actually like. Use specific stories and numbers. Say what you actually think. If someone asks a shallow question, give them a deeper answer than they expected.` },
  { id:'hub6', emoji:'⚙️', name:'Custom Hub', system:'Custom assistant — edit this prompt in Settings to define any persona or expertise you want.' },
  { id:'hub-career', emoji:'🎯', name:'Career Advisor', system:`${NO_MARKDOWN}

You are Rishi Maguluri's personal career strategist — a senior advisor who has worked across McKinsey, Google Strategy, and venture. You know Rishi personally, you know his resume cold, and you think about his career trajectory with the same rigor you'd apply to a consulting engagement. You are direct, honest, and strategic. You do not give generic advice.

RISHI'S BACKGROUND:
- Ohio State University, Honors B.S. Finance + CS Minor, GPA 4.00, ACT 34, Expected May 2028
- Stamps Scholar (full merit scholarship, ~400 selected from 620K applicants)
- Honors Integrated Business & Engineering, Software Innovation Track (36-person cohort)

EXPERIENCE (reverse chronological):
- Bank of America: Incoming Strategy & Management Summer Analyst Intern, Jun–Aug 2026, Charlotte NC
- Ding! (joinding.com): CEO, Aug 2025–Present — AI agent startup for restaurants; 3 restaurants deployed, 50K+ diner questions processed, team of 3 devs
- accelerAIte: Founder, Jun 2024–Aug 2025 — AI chatbots/tutors to 150+ schools, 5K+ users, $3K revenue, boosted test scores 10%+ in at-risk communities
- Fifth Third Bank: Customer MDM Intern, Jun–Aug 2025 — SQL data reconciliation, automated Python script saving 700+ min/year
- Boys and Girls Clubs: Operations Intern, Jun–Aug 2024 — 1 of 315 from 7K+ applicants, Student Leaders program, built grant analysis tool securing $6K+

LEADERSHIP:
- Buckeye Undergraduate Consulting Club: Business Analyst (1 of 20 from 200+ applicants) — advising Nationwide on pricing/distribution for "thriving couples"
- Students Consulting for Nonprofits: Associate Consultant — 20% donor conversion increase, 25% website engagement increase
- Builders: Professional Events Lead — Ohio's first student-run venture fund, speaking engagements for 60+ founders
- INTERalliance of Greater Cincinnati: COO, Aug 2023–May 2025 — directed TechOlympics (nation's largest student-run tech conference, 500+ attendees, 50+ sponsors, $500K+ in sponsorships)

HONORS: NSDA 4th/6K+ Declamation, JPMC Case Competition 1st/800+, Crowe Case 4th/1K+, Eagle Scout, Coolidge Cup Top 0.15%, National Merit Commended Scholar
SKILLS: Python, Java, SQL, HTML/CSS, AI (NLP, LLM Fine-Tuning), Data Analysis

CAREER INTERESTS: Management consulting (McKinsey, BCG, Bain, Oliver Wyman), internal/corporate strategy at large companies (think Google Strategy, Microsoft Corp Dev, Amazon), product management, and eventually big-tech strategy roles. Long arc: consulting → big-tech strategy.

TRAJECTORY CONTEXT: BofA Strategy internship summer 2026. Targeting Oliver Wyman or MBB for summer 2027. Positioning for Bain/top firm full-time or big-tech strategy post-grad.

When Rishi asks for advice, give him your actual read — where he's strong, where he has gaps, what moves make sense given where he is right now. Reference his specific experiences by name. Challenge him when he's thinking too small or too safe. Help him think through recruiting timelines, positioning, case prep, networking, and long-term career architecture.` },
];

// Default data
const defaultState = () => ({
  settings: { apiKey: '', accent: 'indigo', userName: 'You', avatarInitial: 'Y', syncEndpoint: '', syncKey: '' },
  events: [],
  assignments: [],
  workouts: [],
  notes: [],
  journals: [],
  habits: [],
  social: [],
  hubs: DEFAULT_HUBS(),
  career: { contacts: [], questions: [], applications: [] },
  seenDeals: [],
  inbox: [], // §3 universal capture
  planner: {
    areas:[
      {id:'pa1',name:'Startups',color:'#6366f1',description:'Entrepreneurial projects and ideas'},
      {id:'pa2',name:'Academics',color:'#3b82f6',description:'School and intellectual growth'},
      {id:'pa3',name:'Health',color:'#10b981',description:'Physical and mental wellbeing'},
      {id:'pa4',name:'Relationships',color:'#f59e0b',description:'Friends, family, and connections'},
      {id:'pa5',name:'Personal Growth',color:'#8b5cf6',description:'Self-development and mindset'},
    ],
    goals:[],actions:[],people:[],checkins:[],chatHistory:[],undoStack:[],
  },
});

function useLocalState(key, initial) {
  const [state, setState] = useState(() => { const v = ls(key); return v!==null? v : (typeof initial === 'function' ? initial() : initial); });
  useEffect(()=>{ ls(key, state); }, [key, state]);
  return [state, setState];
}

// Toasts
function useToasts(){
  const [toasts, setToasts] = useState([]);
  const push = (payload, timeout=3000)=>{
    const t = typeof payload === 'string' ? {id:uid(), text:payload} : {id:uid(), text:payload.text, actionLabel:payload.actionLabel, action:payload.action};
    setToasts(a=>[...a,t]);
    if(timeout>0){ setTimeout(()=>setToasts(a=>a.filter(x=>x.id!==t.id)), timeout); }
    return t.id;
  };
  const remove = (id)=> setToasts(a=>a.filter(x=>x.id!==id));
  return {toasts, push, remove};
}

// Voice recognition — degrades gracefully on mobile Safari (no SpeechRecognition)
const HAS_SPEECH_API = (typeof window !== 'undefined') && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
function useDictation(onResult){
  const recogRef = useRef(null);
  useEffect(()=>{
    if(!HAS_SPEECH_API) return;
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new R(); r.lang='en-US'; r.interimResults=false; r.maxAlternatives=1;
    r.onresult = (e)=>{ const t = e.results[0][0].transcript; onResult && onResult(t); };
    r.onerror = ()=>{};
    recogRef.current = r;
  },[onResult]);
  const start = ()=>{ if(recogRef.current) try{ recogRef.current.start(); }catch(e){} };
  const stop  = ()=>{ if(recogRef.current) try{ recogRef.current.stop();  }catch(e){} };
  return { start, stop, hasSpeech: HAS_SPEECH_API };
}

/* ── IndexedDB auto-backup (§2) ────────────────────────────────────────────
   Debounced 5 s after each data write. Keeps last 5 snapshots.
   Never stores API responses — only the app data object.                    */
const IDB_NAME = 'magverse-backup', IDB_STORE = 'snapshots', IDB_MAX = 5;
function openIDB(){
  return new Promise((res,rej)=>{
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e=>{ e.target.result.createObjectStore(IDB_STORE, {keyPath:'ts'}); };
    req.onsuccess = e=>res(e.target.result);
    req.onerror   = e=>rej(e.target.error);
  });
}
async function idbSaveSnapshot(data){
  try {
    const db  = await openIDB();
    const tx  = db.transaction(IDB_STORE,'readwrite');
    const st  = tx.objectStore(IDB_STORE);
    const ts  = Date.now();
    st.put({ts, data});
    // Prune old snapshots — keep latest IDB_MAX
    const allReq = st.getAllKeys();
    allReq.onsuccess = ()=>{
      const keys = allReq.result.sort((a,b)=>a-b);
      keys.slice(0, Math.max(0, keys.length - IDB_MAX)).forEach(k=>st.delete(k));
    };
    db.close();
    return ts;
  } catch(e){ return null; }
}
async function idbLatestSnapshot(){
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE,'readonly');
    const st = tx.objectStore(IDB_STORE);
    return await new Promise((res,rej)=>{
      const req = st.openCursor(null,'prev');
      req.onsuccess = e=>res(e.target.result?.value || null);
      req.onerror   = e=>rej(null);
    });
  } catch(e){ return null; }
}
function useIndexedDBBackup(data){
  const [lastBackup, setLastBackup] = useLocalState('magverse:lastBackup', null);
  const timerRef = useRef(null);
  useEffect(()=>{
    clearTimeout(timerRef.current);
    // Debounce 5 s — never writes on every keystroke
    timerRef.current = setTimeout(async ()=>{
      const ts = await idbSaveSnapshot(data);
      if(ts) setLastBackup(ts);
    }, 5000);
    return ()=>clearTimeout(timerRef.current);
  },[data]);
  return lastBackup;
}

/* ── Cloud sync skeleton (§2) ──────────────────────────────────────────────
   No-ops when no endpoint is configured. Swap in a real fetch() later.
   Debounced 30 s to avoid hammering on rapid edits. Backs off on failure.  */
let _syncBackoff = 30000;
async function syncUp(data, settings){
  const url = settings?.syncEndpoint, key = settings?.syncKey;
  if(!url) return;
  try {
    await fetch(url, { method:'POST', headers:{'Content-Type':'application/json','x-sync-key':key||''}, body:JSON.stringify({data, ts:Date.now()}) });
    _syncBackoff = 30000; // reset on success
  } catch(e){ _syncBackoff = Math.min(_syncBackoff*2, 300000); } // back off up to 5 min
}
async function syncDown(settings){
  const url = settings?.syncEndpoint, key = settings?.syncKey;
  if(!url) return null;
  try {
    const r = await fetch(url, { headers:{'x-sync-key':key||''} });
    if(!r.ok) return null;
    const j = await r.json();
    return j?.data || null;
  } catch(e){ return null; }
}

// Main App
function App(){
  const [data, setData] = useLocalState('magverse:v1', defaultState);
  const [active, setActive] = useLocalState('magverse:activeTab','schedule');
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalState('magverse:sidebarCollapsed', false);
  const toasts = useToasts();
  const [isOnboardSeen, setOnboardSeen] = useLocalState('magverse:onboardSeen', false);
  const isMobile = useIsMobile();
  const [captureOpen, setCaptureOpen] = useState(false);

  // §2 — IndexedDB auto-backup (debounced inside hook)
  const lastBackup = useIndexedDBBackup(data);

  // §2 — Cloud sync on load (down) and on a 2-minute interval (up)
  useEffect(()=>{
    const settings = data.settings;
    if(!settings?.syncEndpoint) return;
    syncDown(settings).then(remote=>{ if(remote) setData(d=>({...d,...remote})); });
    // Poll every 2 min — fine for a personal app; no tighter than this
    const id = setInterval(()=>syncUp(data, settings), 120000);
    return ()=>clearInterval(id);
  },[]);

  // §3 — Global 'C' key opens quick-capture (only when not typing in an input)
  useEffect(()=>{
    const handler = (e)=>{
      if(e.key==='c'&&!e.metaKey&&!e.ctrlKey&&!e.altKey) {
        const tag = document.activeElement?.tagName;
        if(tag==='INPUT'||tag==='TEXTAREA'||document.activeElement?.isContentEditable) return;
        setCaptureOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return ()=>window.removeEventListener('keydown', handler);
  },[]);

  useEffect(()=>{ document.title = 'The Magverse'; },[]);

  const inboxCount = (data.inbox||[]).filter(i=>{
    const age = (Date.now()-new Date(i.createdAt).getTime())/3600000;
    return age>48;
  }).length;

  return (
    <div className="h-full flex text-sm">
      {!isMobile && <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} active={active} setActive={setActive} data={data} inboxCount={(data.inbox||[]).length} />}
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar setActive={setActive} data={data} toasts={toasts} isMobile={isMobile} lastBackup={lastBackup} onCapture={()=>setCaptureOpen(true)} />
        <main className="flex-1 overflow-auto" style={{padding: isMobile ? '12px 12px 80px' : '24px'}}>
          <div className="max-w-full">
            {active==='schedule'    && <SchedulePanel    data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='assignments' && <AssignmentsPanel data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='gym'         && <GymPanel         data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='social'      && <SocialPanel      data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='notes'       && <NotesPanel       data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='chathubs'    && <ChatHubsPanel    data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='settings'    && <SettingsPanel    data={data} setData={setData} toasts={toasts} lastBackup={lastBackup} />}
            {active==='career'      && <CareerPanel      data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='inbox'       && <InboxPanel       data={data} setData={setData} toasts={toasts} isMobile={isMobile} setActive={setActive} />}
          </div>
        </main>
      </div>

      {isMobile && <BottomNav active={active} setActive={setActive} inboxCount={(data.inbox||[]).length} />}
      {!isMobile && <ChatLauncher onOpen={()=>setActive('chathubs')} />}

      {/* Mobile floating capture button */}
      {isMobile && (
        <button onClick={()=>setCaptureOpen(true)}
          className="fixed z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{bottom:'80px',right:'16px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',fontSize:'22px'}}>
          +
        </button>
      )}

      {/* §3 Quick Capture Modal */}
      {captureOpen && <QuickCaptureModal onClose={()=>setCaptureOpen(false)} data={data} setData={setData} toasts={toasts} />}

      {/* Toasts */}
      <div className="fixed flex flex-col gap-2 z-50" style={{right:'16px', bottom: isMobile ? '72px' : '24px'}}>
        {toasts.toasts.map(t=> (
          <div key={t.id} className="glass px-4 py-2 rounded shadow flex items-center gap-2">
            <div className="flex-1 text-sm">{t.text}</div>
            {t.actionLabel && <button className="toast-action" onClick={()=>{ t.action && t.action(); }}>{t.actionLabel}</button>}
          </div>
        ))}
      </div>

      {!isOnboardSeen && <OnboardModal onClose={()=>setOnboardSeen(true)} open={!isOnboardSeen} setActive={setActive} />}
      <MainAssistant data={data} setData={setData} toasts={toasts} isMobile={isMobile} />
    </div>
  );
}

/* -------------------- Main Assistant (global planning chat) -------------------- */
function MainAssistant({data, setData, toasts, isMobile}){
  const [open, setOpen] = useState(true);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const dict = useDictation(async (t)=>{ setText(prev=> prev ? prev + ' ' + t : t); setListening(false); await handleSend(t); });

  async function handleSend(msg){
    if(!msg || !msg.trim()) return;
    // try Anthropic if api key present
    const apiKey = (ls('magverse:v1')?.settings?.apiKey) || '';
    if(apiKey){
      try{
        toasts.push('Sending to assistant...');
        const resp = await fetch('https://api.anthropic.com/v1/complete',{
          method:'POST', headers:{'Content-Type':'application/json','x-api-key':apiKey},
          body: JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,prompt:'You are a planning assistant. Parse user intent and return JSON actions. User: '+msg})
        });
        const j = await resp.json();
        const out = j?.completion || j?.output || '';
        // naive JSON extraction
        try{
          const maybe = JSON.parse(out);
          applyActions(maybe.actions || [], setData, toasts);
          toasts.push('Assistant applied plan');
        }catch(e){
          toasts.push('Assistant responded (non-JSON)  -  using heuristic parser');
          const acts = heuristicParse(msg);
          applyActions(acts, setData, toasts);
        }
      }catch(e){
        toasts.push('Assistant error, using local parser');
        const acts = heuristicParse(msg);
        applyActions(acts, setData, toasts);
      }
    }else{
      const acts = heuristicParse(msg);
      applyActions(acts, setData, toasts);
    }
    setText('');
  }

  if(isMobile){
    // Mobile: floating mic button at bottom-left
    return (
      <div className="fixed z-50" style={{bottom:'90px', left:'16px'}}>
        {open && (
          <div className="glass rounded-xl p-4 mb-2" style={{width:'260px',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">Schedule Assistant</span>
              <button onClick={()=>setOpen(false)} style={{color:'#64748b',fontSize:'18px',lineHeight:1}}>×</button>
            </div>
            <div className="text-xs mb-3" style={{color:'#475569'}}>
              Say: <span style={{color:'#818cf8'}}>"gym at 7am monday"</span>, <span style={{color:'#818cf8'}}>"from 9:30 to 11 read and meditate"</span>
            </div>
            {text ? (
              <div className="text-xs px-2 py-1.5 rounded mb-2 italic" style={{background:'rgba(255,255,255,0.04)',color:'#94a3b8'}}>
                "{text}"
              </div>
            ) : null}
            <button
              onClick={()=>{ if(listening){ dict.stop(); setListening(false); } else { dict.start(); setListening(true); } }}
              className="w-full py-2 rounded-lg text-sm font-medium transition-all"
              style={{background:listening?'rgba(239,68,68,0.2)':'rgba(99,102,241,0.15)',
                      color:listening?'#fca5a5':'#818cf8',
                      border:listening?'1px solid rgba(239,68,68,0.5)':'1px solid rgba(99,102,241,0.3)',
                      boxShadow:listening?'0 0 0 3px rgba(239,68,68,0.15)':'none'}}>
              {listening ? '● Listening…' : '🎤 Speak a command'}
            </button>
          </div>
        )}
        <div style={{position:'relative'}}>
          {listening && (
            <span style={{position:'absolute',inset:0,borderRadius:'50%',background:'rgba(239,68,68,0.35)',
              animation:'pulse 1s ease-in-out infinite',pointerEvents:'none'}}/>
          )}
          <button
            onClick={()=>setOpen(o=>!o)}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all"
            style={{background: listening?'rgba(239,68,68,0.85)':open?'rgba(99,102,241,0.4)':'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    border:listening?'1px solid rgba(239,68,68,0.6)':'1px solid rgba(99,102,241,0.4)',
                    boxShadow:listening?'0 4px 20px rgba(239,68,68,0.45)':'0 4px 20px rgba(99,102,241,0.35)',
                    fontSize:'20px',position:'relative',zIndex:1}}>
            {listening ? '●' : open ? '×' : '✦'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-6 bottom-6 z-50">
      {open && (
        <div className="glass p-3 rounded w-80 border-subtle shadow-lg mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Magverse Assistant</div>
            <div className="text-xs opacity-80">Plan your day</div>
          </div>
          <textarea className="w-full p-2 mb-2 bg-transparent border border-white/5 rounded" rows={3} value={text} onChange={e=>setText(e.target.value)} placeholder="Tell me your plan (or use voice)..." />
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-indigo-600" onClick={()=>handleSend(text)}>Send</button>
            <button className="px-3 py-1 rounded"
              style={{background:listening?'rgba(239,68,68,0.2)':'rgba(99,102,241,0.15)',
                      color:listening?'#fca5a5':'#818cf8',
                      border:listening?'1px solid rgba(239,68,68,0.5)':'1px solid rgba(99,102,241,0.3)'}}
              onClick={()=>{ if(listening){ dict.stop(); setListening(false); } else { dict.start(); setListening(true); } }}>
              {listening ? '● Stop' : '🎤 Voice'}
            </button>
            <button className="px-3 py-1 rounded" onClick={()=>setOpen(false)}>Hide</button>
          </div>
        </div>
      )}
      {!open && (
        <button className="glass px-3 py-1.5 rounded-xl text-xs font-semibold border-subtle shadow-lg" onClick={()=>setOpen(true)}>
          ✦ Assistant
        </button>
      )}
    </div>
  );
}

function applyActions(actions, setData, toasts){
  if(!actions || !actions.length) return;
  const newEvents=[], newAssignments=[], newWorkouts=[], newSocial=[];
  const clearFilters=[];
  actions.forEach(a=>{
    if(a.type==='event')       newEvents.push({...a.payload, id:uid()});
    else if(a.type==='assignment') newAssignments.push({...a.payload, id:uid(), status:'To Do'});
    else if(a.type==='workout')    newWorkouts.push({...a.payload, id:uid()});
    else if(a.type==='reminder')   newSocial.push({...a.payload, id:uid()});
    else if(a.type==='clearEvents') clearFilters.push(a.filter||{});
  });
  setData(d=>{
    let events = [...(d.events||[]), ...newEvents];
    if(clearFilters.length){
      const before = events.length;
      events = events.filter(ev => !clearFilters.some(f => eventMatchesClearFilter(ev, f)));
      const removed = before - events.length + newEvents.length;
      if(removed > 0) toasts.push(`Cleared ${removed} event${removed>1?'s':''}`);
      else toasts.push('No matching events found to clear');
    }
    return {
      ...d,
      events,
      assignments: [...(d.assignments||[]), ...newAssignments],
      workouts:    [...(d.workouts||[]),    ...newWorkouts],
      social:      [...(d.social||[]),      ...newSocial],
    };
  });
  if(newEvents.length)      toasts.push(`Added ${newEvents.length} event${newEvents.length>1?'s':''}: ${newEvents.map(e=>e.title).join(', ')}`);
  if(newAssignments.length) toasts.push(`Added ${newAssignments.length} assignment${newAssignments.length>1?'s':''}`);
  if(newSocial.length)      toasts.push('Added reminder');
}

// ---- Multi-event heuristic parser ----
const DAY_MAP = [
  ['monday','mon'],['tuesday','tue'],['wednesday','wed'],
  ['thursday','thu'],['friday','fri'],['saturday','sat'],['sunday','sun']
];

// Normalize spoken/written a.m./p.m. to am/pm for reliable matching
// Also normalize "930 am" → "9:30 am", "1030" (after from/to/at) → "10:30"
function normAmPm(s){
  return s
    .replace(/\ba\.m\./gi,'am').replace(/\bp\.m\./gi,'pm')
    // "930 am" / "1045pm" → "9:30 am" / "10:45 pm"
    .replace(/\b(\d{1,2})([0-5]\d)\s*(am|pm)/gi, (_,h,m,ap)=>`${h}:${m} ${ap}`)
    // "from 930" / "to 1030" / "at 900" without am/pm
    .replace(/\b(from|to|at)\s+(\d{1,2})([0-5]\d)\b/gi, (_,prep,h,m)=>`${prep} ${h}:${m}`);
}

function parseDay(s){
  const t = s.toLowerCase();
  for(let i=0;i<DAY_MAP.length;i++){
    if(DAY_MAP[i].some(d=>{
      const idx=t.indexOf(d);
      return idx!==-1 && (idx===0||!/[a-z]/.test(t[idx-1])) && (idx+d.length>=t.length||!/[a-z]/.test(t[idx+d.length]));
    })) return i;
  }
  return undefined;
}

function parseHourStr(hStr, ap){
  // hStr = "8" or "8:30", ap = "am"/"pm"
  const parts = String(hStr).split(':');
  let h = parseInt(parts[0], 10);
  const mins = parts[1] ? parseInt(parts[1], 10) : 0;
  const a = (ap||'').toLowerCase();
  if(a==='pm' && h!==12) h+=12;
  if(a==='am' && h===12) h=0;
  return h + mins/60;
}

function parseHour(s){
  const t = normAmPm(s).toLowerCase();
  // HH:MM + am/pm
  const m1 = t.match(/(\d{1,2}):\d{2}\s*(am|pm)/);
  if(m1) return parseHourStr(m1[1], m1[2]);
  // HH:MM only
  const m2 = t.match(/(\d{1,2}):\d{2}/);
  if(m2) return parseInt(m2[1], 10);
  // H am/pm
  const m3 = t.match(/(\d{1,2})\s*(am|pm)/);
  if(m3) return parseHourStr(m3[1], m3[2]);
  return undefined;
}

function cleanTitle(seg){
  return seg
    .replace(/\ba\.m\./gi,'').replace(/\bp\.m\./gi,'')
    .replace(/\b(i want to|i need to|i will|i'm going to|i am going to|i'm planning to|please|can you|add|schedule|put|block|set up|then|afterwards|after that)\b/gi,'')
    .replace(/\band\s+then\b/gi,'').replace(/\bI'm going to\b/gi,'')
    .replace(/\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,'')
    .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi,'')
    .replace(/\b(at|by|around|from|to)\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi,'')
    .replace(/\d{1,2}\s*:\s*\d{2}\s*(am|pm)?/gi,'')
    .replace(/\d{1,2}\s*(am|pm)/gi,'')
    .replace(/\bjust\b/gi,'')
    .replace(/^[\s,;.]+|[\s,;.]+$/g,'') // trim leading/trailing punctuation
    .replace(/^\s*(and|but|or|so)\s+/i,'') // strip leading conjunctions
    .replace(/\s+(and|or|but)\s*$/i,'')    // strip trailing conjunctions
    .replace(/\s+/g,' ').trim();
}

// Does event ev appear in column di (0=Mon..6=Sun) at hour h?
function eventMatchesSlot(ev, di, h){
  if(!ev.when || ev.when.hour !== h) return false;
  const r = ev.recurrence;
  if(!r)             return ev.when.day === di;
  if(r==='weekly')   return ev.when.day === di;
  if(r==='daily')    return true;
  if(r==='weekdays') return di >= 0 && di <= 4;
  if(r==='mwf')      return [0,2,4].includes(di);
  if(r==='tth')      return [1,3].includes(di);
  if(r==='custom')   return (ev.customDays||[]).includes(di);
  return ev.when.day === di;
}

function detectType(s){
  const t = s.toLowerCase();
  if(/\bgym\b|workout|bench|squat|deadlift|lift|training|exercise/.test(t)) return 'Gym';
  if(/assignment|homework|due|class|lecture|exam|essay|report|problem set/.test(t)) return 'Assignments';
  if(/dinner|lunch|breakfast|coffee|party|hang|meet|social|friend|date|dining hall/.test(t)) return 'Social';
  return 'Manual';
}

// Convert JS getDay() (0=Sun) to Magverse day index (0=Mon)
function jsDayToMv(jsDay){ return (jsDay + 6) % 7; }

function parseClearCommand(text){
  const t = normAmPm(text).toLowerCase();
  if(!/\b(clear|delete|remove|cancel|erase|wipe)\b/.test(t)) return null;

  const f = {};

  // Clear everything
  if(/\b(all|everything|entire|whole)\b/.test(t) && /\b(schedule|events|day|week)\b/.test(t)) { f.all = true; return {type:'clearEvents',filter:f}; }

  // "today" / "tomorrow"
  if(/\btoday\b/.test(t))    { f.day = jsDayToMv(new Date().getDay()); }
  if(/\btomorrow\b/.test(t)) { const d=new Date(); d.setDate(d.getDate()+1); f.day = jsDayToMv(d.getDay()); }

  // Named day
  const di = parseDay(t);
  if(di !== undefined && f.day === undefined) f.day = di;

  // Time-of-day ranges
  if(/\bmorning\b/.test(t))   { f.hourFrom=5;  f.hourTo=11; }
  if(/\bafternoon\b/.test(t)) { f.hourFrom=12; f.hourTo=16; }
  if(/\bevening\b/.test(t))   { f.hourFrom=17; f.hourTo=20; }
  if(/\bnight\b/.test(t))     { f.hourFrom=20; f.hourTo=23; }

  // Specific hour
  const h = parseHour(t);
  if(h !== undefined) f.hour = h;

  // Title keyword — strip command words and extract what's left
  const kw = t
    .replace(/\b(clear|delete|remove|cancel|erase|wipe|my|all|the|event|events|schedule|today|tomorrow|morning|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/g,'')
    .replace(/\b(at|on|from|between|and)\b/g,'')
    .replace(/\d{1,2}(:\d{2})?\s*(am|pm)/gi,'')
    .replace(/\s+/g,' ').trim();
  if(kw.length > 1) f.title = kw;

  // Only return a clear action if we have at least one filter criterion
  if(Object.keys(f).length === 0) return null;
  return {type:'clearEvents', filter:f};
}

function eventMatchesClearFilter(ev, f){
  if(f.all) return true;
  const day = ev.when?.day;
  const hour = ev.when?.hour;
  const r = ev.recurrence;

  // Day match
  if(f.day !== undefined){
    let dm = false;
    if(!r || r==='weekly') dm = day === f.day;
    else if(r==='daily')   dm = true;
    else if(r==='weekdays')dm = f.day >= 0 && f.day <= 4;
    else if(r==='mwf')     dm = [0,2,4].includes(f.day);
    else if(r==='tth')     dm = [1,3].includes(f.day);
    else if(r==='custom')  dm = (ev.customDays||[]).includes(f.day);
    else dm = day === f.day;
    if(!dm) return false;
  }

  // Hour / range
  if(f.hour !== undefined && (hour === undefined || hour !== f.hour)) return false;
  if(f.hourFrom !== undefined && (hour === undefined || hour < f.hourFrom)) return false;
  if(f.hourTo   !== undefined && (hour === undefined || hour > f.hourTo))   return false;

  // Title keyword
  if(f.title && !ev.title?.toLowerCase().includes(f.title)) return false;

  return true;
}

function parseSubtasks(text){
  // Detect list-intro patterns — colon optional, "do" optional, works with or without punctuation
  const introRe = /(?:i want to (?:do )?|the following[:\s]|these (?:\w+ )?(?:things|tasks|items)[:\s]*|:\s*)(.+)$/i;
  const m = text.match(introRe);
  const listStr = m?.[1]?.trim() || null;
  if(!listStr) return null;

  // Try comma/semicolon split first, fall back to " and " split
  let items = listStr.split(/[,;]/).map(s=>s.replace(/^\s*(and\s+)?/i,'').replace(/\s*[.!?]+$/,'').trim()).filter(s=>s.length>1&&s.length<120);
  if(items.length < 2){
    items = listStr.split(/\s+and\s+/i).map(s=>s.replace(/\s*[.!?]+$/,'').trim()).filter(s=>s.length>1&&s.length<120);
  }
  return items.length >= 2 ? items : null;
}

function heuristicParse(text, _depth=0){
  // Check for clear/delete commands first
  const clearAction = parseClearCommand(text);
  if(clearAction) return [clearAction];

  const norm = normAmPm(text);
  const globalDay = parseDay(norm);

  // Bulk schedule detection: 3+ time expressions OR 2+ "from…to" ranges → split
  if(_depth === 0){
    const allTimes  = [...norm.matchAll(/\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)/gi)];
    const allRanges = [...norm.matchAll(/\bfrom\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s+to\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi)];
    if(allTimes.length >= 3 || allRanges.length >= 2){
      // Split on "then [after that] I/at/from/around" boundaries
      const chunks = norm
        .split(/\n+|(?:\s+(?:and\s+)?)then\s+(?:after\s+(?:that\s+))?(?=(?:at|from|around|i)\b)/i)
        .map(s => s
          .replace(/^(?:then\s+|after\s+that\s+|,\s*)/i,'')
          .replace(/\s+\b(and|or|but)\s*$/i,'')
          .trim())
        .filter(s => s.length > 2);
      if(chunks.length >= 2){
        const inheritDay = globalDay !== undefined ? globalDay : jsDayToMv(new Date().getDay());
        const allActions = [];
        const DAY_NAMES = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)$/i;
        for(const chunk of chunks){
          const acts = heuristicParse(chunk, 1);
          for(const a of acts){
            if(a.type === 'event'){
              // Skip events with no time (can't show on calendar)
              if(a.payload.when?.hour === undefined) continue;
              // Skip chunks that are just day-name placeholders or have no real title
              if(DAY_NAMES.test((a.payload.title||'').trim())) continue;
              if((a.payload.title||'').trim().length < 2) continue;
              if(a.payload.when.day === undefined) a.payload.when = {...a.payload.when, day: inheritDay};
              allActions.push(a);
            } else {
              allActions.push(a);
            }
          }
        }
        const evts = allActions.filter(a => a.type==='event' && a.payload.when?.hour !== undefined);
        if(evts.length >= 2) return allActions;
      }
    }
  }

  // Detect "from HH to HH" time range — treat as single event using start time
  const rangeRe = /\bfrom\s+(\d{1,2}(?::\d{2})?)\s*(am|pm)?\s+to\s+(\d{1,2}(?::\d{2})?)\s*(am|pm)?/i;
  const rangeMatch = norm.match(rangeRe);
  if(rangeMatch){
    const startHour = parseHourStr(rangeMatch[1], rangeMatch[2] || rangeMatch[4] || '');
    const endHour   = parseHourStr(rangeMatch[3], rangeMatch[4] || rangeMatch[2] || '');
    const day = globalDay !== undefined ? globalDay : jsDayToMv(new Date().getDay());
    const when = {day, hour: startHour, endHour: endHour > startHour ? endHour : startHour+1};
    const subtaskItems = parseSubtasks(norm);
    const subtasks = subtaskItems ? subtaskItems.map(t=>({id:uid(),title:t.charAt(0).toUpperCase()+t.slice(1),done:false})) : undefined;
    // Title = text before "from"; if empty/just a day name, use text after the range
    const beforeFrom = norm.slice(0, norm.search(/\bfrom\s+\d/i));
    let rawTitle = cleanTitle(beforeFrom).trim();
    const DAY_ONLY = /^(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;
    if(rawTitle.length <= 1 || DAY_ONLY.test(rawTitle)){
      const afterRange = norm.slice(rangeMatch.index + rangeMatch[0].length);
      rawTitle = cleanTitle(afterRange).trim();
    }
    const title = rawTitle.length > 1 ? rawTitle.charAt(0).toUpperCase()+rawTitle.slice(1) : 'Task Block';
    const type = detectType(norm);
    return [{type:'event', payload:{title, type, notes:text, when, subtasks}}];
  }

  // Find every time expression in the text with its position
  // Pattern covers: "8:30 am", "9:00 pm", "8 am", "12pm" etc.
  const timeRe = /(\d{1,2}(?::\d{2})?)\s*(am|pm)/gi;
  const timeMatches = [];
  let m;
  while((m = timeRe.exec(norm)) !== null){
    timeMatches.push({ pos: m.index, end: m.index + m[0].length, hour: parseHourStr(m[1], m[2]) });
  }

  // Single or no time  -  fall back to simple single-event parse
  if(timeMatches.length <= 1){
    const hour = timeMatches.length===1 ? timeMatches[0].hour : undefined;
    const day  = globalDay !== undefined ? globalDay : (hour !== undefined ? jsDayToMv(new Date().getDay()) : undefined);
    const when = (day!==undefined||hour!==undefined) ? {day,hour} : undefined;
    const rawTitle = cleanTitle(norm);
    const title = rawTitle.length>1 ? rawTitle.charAt(0).toUpperCase()+rawTitle.slice(1) : text.trim();
    const type = detectType(norm);
    const subtaskItems = parseSubtasks(norm);
    const subtasks = subtaskItems ? subtaskItems.map(t=>({id:uid(),title:t.charAt(0).toUpperCase()+t.slice(1),done:false})) : undefined;
    const eventTitle = subtasks
      ? (cleanTitle(norm.split(/i want to|do:|these things|the following/i)[0]).trim() || 'Task Block')
      : title;
    const finalTitle = (eventTitle.length>1 ? eventTitle.charAt(0).toUpperCase()+eventTitle.slice(1) : 'Task Block');
    const actions = [];
    if(/assignment|homework|due/.test(norm.toLowerCase())) actions.push({type:'assignment',payload:{title:finalTitle,subject:'Other',notes:text}});
    if(/remind me|reminder/i.test(norm)) actions.push({type:'reminder',payload:{title:text,date:new Date().toISOString()}});
    if(when || (!actions.length && finalTitle.length>1)) actions.push({type:'event',payload:{title:finalTitle,type,notes:text,when,subtasks}});
    return actions;
  }

  // Multiple times  -  one event per time anchor
  // For each time T[i], the describing text is between T[i-1].end and T[i].end
  const actions = [];
  for(let i=0; i<timeMatches.length; i++){
    // "until TIME" → endHour of the previous event, not a new event
    const before = norm.slice(Math.max(0, timeMatches[i].pos - 20), timeMatches[i].pos);
    if(/\buntil\s*$/i.test(before)){
      if(actions.length > 0){
        const last = actions[actions.length-1];
        if(last.type==='event' && last.payload.when) last.payload.when = {...last.payload.when, endHour: timeMatches[i].hour};
      }
      continue;
    }

    const segStart = i===0 ? 0 : timeMatches[i-1].end;
    const segEnd   = timeMatches[i].end;
    const seg      = norm.slice(segStart, segEnd);

    const rawTitle = cleanTitle(seg);
    // Skip range endpoints like "to 11:00 am" that produce no title
    if(rawTitle.length < 2) continue;

    const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
    const day   = parseDay(seg) !== undefined ? parseDay(seg) : globalDay;
    const hour  = timeMatches[i].hour;
    const type  = detectType(seg);

    const stItems = i===0 ? parseSubtasks(norm) : null;
    const subtasks = stItems ? stItems.map(t=>({id:uid(),title:t.charAt(0).toUpperCase()+t.slice(1),done:false})) : undefined;
    if(/assignment|homework|due/.test(seg.toLowerCase())) actions.push({type:'assignment',payload:{title,subject:'Other',notes:text}});
    actions.push({type:'event', payload:{title, type, notes:text, when:{day, hour}, subtasks}});
  }

  return actions.length ? actions : [{type:'event',payload:{title:cleanTitle(norm)||text,type:'Manual',notes:text,when:{day:globalDay}}}];
}

function useIsMobile(){
  const [m, setM] = useState(()=>window.innerWidth<768);
  useEffect(()=>{
    const h=()=>setM(window.innerWidth<768);
    window.addEventListener('resize',h);
    return ()=>window.removeEventListener('resize',h);
  },[]);
  return m;
}

function BottomNav({active, setActive, inboxCount=0}){
  const items = [
    {id:'schedule',     label:'Schedule', icon:IconCalendar},
    {id:'assignments',  label:'Tasks',    icon:IconKanban},
    {id:'inbox',        label:'Inbox',    icon:IconInbox, badge:inboxCount},
    {id:'notes',        label:'Notes',    icon:IconNotes},
    {id:'chathubs',     label:'Learn',    icon:IconChat},
    {id:'career',       label:'Career',   icon:IconBriefcase},
    {id:'settings',     label:'More',     icon:IconGear},
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center"
      style={{background:'rgba(10,10,15,0.97)',backdropFilter:'blur(16px)',borderTop:'1px solid rgba(255,255,255,0.07)',paddingBottom:'max(8px,env(safe-area-inset-bottom))',paddingTop:'8px'}}>
      {items.map(it=>(
        <button key={it.id} onClick={()=>setActive(it.id)}
          className="relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
          style={{color:active===it.id?'#818cf8':'#475569',minWidth:'44px',minHeight:'44px',justifyContent:'center'}}>
          <it.icon />
          <span style={{fontSize:'9px',fontWeight:active===it.id?700:400}}>{it.label}</span>
          {it.badge>0 && (
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center text-white"
              style={{background:'#ef4444',fontSize:'9px',fontWeight:700}}>{it.badge>9?'9+':it.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
}

function Sidebar({collapsed, setCollapsed, active, setActive, inboxCount=0}){
  const items = [
    {id:'schedule',    label:'Schedule',     icon:IconCalendar},
    {id:'assignments', label:'Tasks',        icon:IconKanban},
    {id:'inbox',       label:'Inbox',        icon:IconInbox, badge:inboxCount},
    {id:'career',      label:'Career',       icon:IconBriefcase},
    {id:'gym',         label:'Gym',          icon:IconDumbbell},
    {id:'social',      label:'Social',       icon:IconUsers},
    {id:'notes',       label:'Notes',        icon:IconNotes},
    {id:'chathubs',    label:'Learning Hub', icon:IconChat},
    {id:'settings',    label:'Settings',     icon:IconGear},
  ];
  return (
    <aside className={`flex-shrink-0 p-3 ${collapsed? 'w-16':'w-56'} h-full border-r border-subtle glass`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full accent-grad flex items-center justify-center text-xs font-bold">M</div>
          {!collapsed && <div className="text-lg font-semibold">The Magverse</div>}
        </div>
        <button onClick={()=>setCollapsed(!collapsed)} className="p-1 rounded hover:bg-white/3">{collapsed? '→':'←'}</button>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(it=> (
          <button key={it.id} onClick={()=>setActive(it.id)}
            className={`relative flex items-center gap-3 w-full p-2 rounded ${active===it.id? 'bg-white/6':''} hover:bg-white/3`}
            style={{minHeight:'44px'}}>
            <it.icon />
            {!collapsed && <span>{it.label}</span>}
            {it.badge>0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-white"
                style={{background:'#ef4444',fontSize:'9px',fontWeight:700}}>{it.badge>9?'9+':it.badge}</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}

const WX_CODES = {
  0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',
  45:'Foggy',48:'Foggy',
  51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',
  61:'Light rain',63:'Rain',65:'Heavy rain',
  71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',
  80:'Showers',81:'Showers',82:'Heavy showers',
  85:'Snow showers',86:'Snow showers',
  95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm',
};
const WX_ICON = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',
  45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌦️',
  61:'🌧️',63:'🌧️',65:'🌧️',
  71:'🌨️',73:'🌨️',75:'🌨️',77:'🌨️',
  80:'🌦️',81:'🌦️',82:'🌦️',
  85:'🌨️',86:'🌨️',
  95:'⛈️',96:'⛈️',99:'⛈️',
};

function useColumbusWeather(){
  const [wx, setWx] = useState(null);
  useEffect(()=>{
    const fetch_ = ()=>
      fetch('https://api.open-meteo.com/v1/forecast?latitude=39.9612&longitude=-82.9988&current_weather=true&temperature_unit=fahrenheit&wind_speed_unit=mph')
        .then(r=>r.json())
        .then(j=>{
          const cw = j.current_weather;
          if(!cw) return;
          setWx({ temp: Math.round(cw.temperature), code: cw.weathercode, wind: Math.round(cw.windspeed) });
        })
        .catch(()=>{});
    fetch_();
    const id = setInterval(fetch_, 30*60*1000);
    return ()=>clearInterval(id);
  },[]);
  return wx;
}

function Topbar({setActive, data, toasts, isMobile}){
  const [now, setNow] = useState(new Date());
  const wx = useColumbusWeather();
  useEffect(()=>{ const id = setInterval(()=>setNow(new Date()), 1000); return ()=>clearInterval(id); },[]);
  const startGlobalMic = ()=>{ if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) { toasts.push('Speech recognition not available'); return;} const R = window.SpeechRecognition || window.webkitSpeechRecognition; const r = new R(); r.lang='en-US'; r.onresult=(e)=>{ const t=e.results[0][0].transcript; toasts.push('Heard: '+t); if(/gym|workout|bench|squat/i.test(t)) setActive('gym'); else if(/assignment|due|homework|problem/i.test(t)) setActive('assignments'); else if(/remind|reminder/i.test(t)) setActive('social'); }; r.start(); };

  if(isMobile){
    return (
      <header className="flex items-center justify-between px-4 py-3 border-b border-subtle glass" style={{minHeight:'52px'}}>
        <div className="font-bold text-base" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>The Magverse</div>
        <div className="flex items-center gap-3">
          {wx && <span className="text-xs font-medium">{WX_ICON[wx.code]} {wx.temp}°F</span>}
          <span className="text-xs" style={{color:'#94a3b8'}}>{now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
          <button className="p-2 rounded-xl hover:bg-white/5" onClick={startGlobalMic}>{IconMic()}</button>
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between p-4 border-b border-subtle glass">
      <div className="flex items-center gap-4">
        <div className="text-lg font-semibold">The Magverse</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-center text-sm opacity-90">{now.toLocaleString()}</div>
        {wx && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
            <span>{WX_ICON[wx.code]||'🌡️'}</span>
            <span className="font-semibold">{wx.temp}°F</span>
            <span style={{color:'#64748b'}}>{WX_CODES[wx.code]||'—'}</span>
            <span style={{color:'#475569',fontSize:'11px'}}>{wx.wind} mph</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded hover:bg-white/3" title="Global mic" onClick={startGlobalMic}>{IconMic()}</button>
        <button className="p-2 rounded hover:bg-white/3" title="Settings" onClick={()=>setActive('settings')}>{IconGear()}</button>
      </div>
    </header>
  );
}

/* -------------------- Daily Insights -------------------- */
const WMO_DESC={0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Dense drizzle',61:'Light rain',63:'Moderate rain',65:'Heavy rain',71:'Light snow',73:'Moderate snow',75:'Heavy snow',77:'Snow grains',80:'Light showers',81:'Showers',82:'Violent showers',85:'Snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Thunderstorm+hail',99:'Thunderstorm+heavy hail'};

async function fetchWeatherForDate(dateStr){
  const today=new Date().toISOString().slice(0,10);
  const isPast=dateStr<today;
  let lat=39.96,lon=-82.99;
  try{
    const cached=sessionStorage.getItem('magverse:geo');
    if(cached){const g=JSON.parse(cached);lat=g.lat;lon=g.lon;}
    else await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(p=>{lat=p.coords.latitude;lon=p.coords.longitude;sessionStorage.setItem('magverse:geo',JSON.stringify({lat,lon}));res();},rej,{timeout:3000}));
  }catch(e){}
  const base=isPast?'https://archive-api.open-meteo.com/v1/archive':'https://api.open-meteo.com/v1/forecast';
  const url=`${base}?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&start_date=${dateStr}&end_date=${dateStr}&timezone=auto&temperature_unit=fahrenheit`;
  const res=await fetch(url,{signal:AbortSignal.timeout(5000)});
  if(!res.ok) return null;
  const d=await res.json();
  if(!d.daily?.temperature_2m_max?.length) return null;
  return{maxF:Math.round(d.daily.temperature_2m_max[0]),minF:Math.round(d.daily.temperature_2m_min[0]),precip:d.daily.precipitation_sum[0]||0,code:d.daily.weathercode[0],desc:WMO_DESC[d.daily.weathercode[0]]||'Unknown'};
}

function extractInsightSections(text){
  const TAGS=['day_summary','patterns','energy_forecast','recommendations','retrospective'];
  const out={};
  TAGS.forEach(tag=>{
    const si=text.indexOf(`<${tag}>`);
    if(si===-1) return;
    const ei=text.indexOf(`</${tag}>`,si);
    if(ei===-1){out[tag]=text.slice(si+tag.length+2).trim();out[tag+'_partial']=true;}
    else out[tag]=text.slice(si+tag.length+2,ei).trim();
  });
  return out;
}

function DailyInsightsSubtab({data}){
  const today=new Date().toISOString().slice(0,10);
  const [date,setDate]=useState(today);
  const [sections,setSections]=useState({});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [lastGen,setLastGen]=useState(null);
  const [weather,setWeather]=useState(null);
  const [wxLoading,setWxLoading]=useState(false);

  const events=data.events||[];
  const journals=data.journals||[];
  const apiKey=data.settings?.apiKey||'';

  const targetDate=new Date(date+'T12:00:00');
  const isToday=date===today;
  const isPast=date<today;
  const isFuture=date>today;
  const targetDow=(targetDate.getDay()+6)%7;
  const dayName=targetDate.toLocaleDateString('en',{weekday:'long'});
  const dateLabel=targetDate.toLocaleDateString('en',{month:'long',day:'numeric',year:'numeric'});

  const dayEvents=events.filter(ev=>{
    if(ev.when?.hour===undefined) return false;
    const r=ev.recurrence,d=ev.when?.day;
    if(!r||r==='weekly') return d===targetDow;
    if(r==='daily') return true;
    if(r==='weekdays') return targetDow>=0&&targetDow<=4;
    if(r==='mwf') return [0,2,4].includes(targetDow);
    return false;
  });

  const journalEntry=journals.find(j=>j.date===date);

  const pastSimilarDays=[];
  for(let w=1;w<=12;w++){
    const d=new Date(targetDate);d.setDate(d.getDate()-w*7);
    const ds=d.toISOString().slice(0,10);
    if(ds<today){const j=journals.find(x=>x.date===ds);if(j)pastSimilarDays.push({date:ds,body:j.body});}
  }

  function computeHash(){
    return simpleHash(JSON.stringify({date,evs:dayEvents.map(e=>e.title+'@'+e.when?.hour),jrn:journalEntry?.body||'',wx:weather?`${weather.maxF}/${weather.minF}`:''}));
  }

  const cacheKey=`magverse:insight:${date}`;

  useEffect(()=>{
    setSections({});setError('');setLastGen(null);
    const cached=ls(cacheKey);
    if(!cached) return;
    const maxAge=isFuture?6*3600000:Infinity;
    if(Date.now()-(cached.at||0)<maxAge&&cached.hash===computeHash()){setSections(cached.sections||{});setLastGen(cached.at);}
  },[date]);

  useEffect(()=>{
    setWeather(null);setWxLoading(true);
    fetchWeatherForDate(date).then(w=>{setWeather(w);setWxLoading(false);}).catch(()=>setWxLoading(false));
  },[date]);

  const navigate=dir=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+dir);setDate(d.toISOString().slice(0,10));};

  async function analyze(force=false){
    if(!apiKey){setError('Add your Anthropic API key in Settings.');return;}
    if(!force){
      const cached=ls(cacheKey);
      if(cached&&cached.hash===computeHash()&&Date.now()-(cached.at||0)<(isFuture?6*3600000:Infinity)){
        setSections(cached.sections||{});setLastGen(cached.at);return;
      }
    }
    setLoading(true);setError('');setSections({});

    const evText=dayEvents.length>0
      ?dayEvents.map(e=>`• ${e.title} (${fmtHour(e.when.hour)}${e.when.endHour?'–'+fmtHour(e.when.endHour):''})`).join('\n')
      :'No scheduled events';
    const wxText=weather?`${weather.desc}, high ${weather.maxF}°F / low ${weather.minF}°F${weather.precip>0?', '+weather.precip.toFixed(1)+'mm precipitation':''}`:'Weather not available';
    const jrnText=journalEntry?`Journal entry:\n"${journalEntry.body}"`:'No journal entry for this day.';
    const pastText=pastSimilarDays.length>0
      ?pastSimilarDays.slice(0,4).map(p=>`${p.date}: ${p.body.slice(0,200)}`).join('\n\n')
      :'No journal entries for past similar days.';
    const mode=isPast?'RETROSPECTIVE':isToday?'TODAY':'FUTURE';

    const system=`You are a personal performance coach doing a ${mode==='RETROSPECTIVE'?'retrospective':'forward-looking'} analysis. Reference the specific events and entries by name — no generic advice. Plain prose only, no markdown, no bullet points.

Output exactly these 5 sections in order, each wrapped in XML tags. 2-4 sentences each.

<day_summary>The overall character, pace, and tone of this day.</day_summary>
<patterns>What's notable or different vs. typical ${dayName}s or this time of year for this person.</patterns>
<energy_forecast>${mode==='RETROSPECTIVE'?'How energy and focus likely played out given the schedule and conditions.':'Projected energy arc through the day given schedule density, weather, and past context.'}</energy_forecast>
<recommendations>${mode==='RETROSPECTIVE'?'What to do differently or carry forward based on this day.':'Specific named actions: what to prep, protect, move, or act on before/during this day.'}</recommendations>
<retrospective>${mode==='RETROSPECTIVE'?'What went well, what to learn, what to carry into future similar days.':'Risks and energy traps to watch — things that tend to derail days like this.'}</retrospective>`;

    const userMsg=`Date: ${dateLabel} (${dayName})\n\nSCHEDULE:\n${evText}\n\nWEATHER:\n${wxText}\n\n${jrnText}\n\nPAST SIMILAR ${dayName.toUpperCase()}S (last 3 months with journal):\n${pastText}`;

    try{
      const resp=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1400,stream:true,system,messages:[{role:'user',content:userMsg}]})
      });
      if(!resp.ok){const j=await resp.json();throw new Error(j.error?.message||'API error '+resp.status);}
      const reader=resp.body.getReader(),dec=new TextDecoder();
      let buf='',full='';
      while(true){
        const{done,value}=await reader.read();
        if(done) break;
        buf+=dec.decode(value,{stream:true});
        const lines=buf.split('\n');buf=lines.pop()||'';
        for(const line of lines){
          if(!line.startsWith('data:')) continue;
          const raw=line.slice(5).trim();
          if(raw==='[DONE]') break;
          try{const ev=JSON.parse(raw);if(ev.type==='content_block_delta'&&ev.delta?.type==='text_delta'){full+=ev.delta.text;setSections(extractInsightSections(full));}}catch(e){}
        }
      }
      const final=extractInsightSections(full);
      setSections(final);
      const at=Date.now();
      ls(cacheKey,{sections:final,hash:computeHash(),at});
      setLastGen(at);
    }catch(e){setError('Analysis failed: '+e.message);}
    setLoading(false);
  }

  const SECTION_META=[
    {key:'day_summary',    label:'Day Summary',       icon:'📋',color:'rgba(99,102,241,0.08)', border:'rgba(99,102,241,0.22)',  hdr:'#818cf8'},
    {key:'patterns',       label:'Patterns Detected', icon:'🔁',color:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.22)',  hdr:'#c4b5fd'},
    {key:'energy_forecast',label:'Energy & Focus',    icon:'⚡',color:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.22)',  hdr:'#fcd34d'},
    {key:'recommendations',label:'Recommendations',   icon:'🎯',color:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.22)',  hdr:'#6ee7b7'},
    {key:'retrospective',  label:isPast?'Retrospective':'Watch For',icon:isPast?'🔍':'⚠️',color:'rgba(251,146,60,0.08)',border:'rgba(251,146,60,0.22)',hdr:'#fdba74'},
  ];

  const hasAny=SECTION_META.some(m=>sections[m.key]);

  return(
    <div>
      {/* Day picker */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button onClick={()=>navigate(-1)} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',fontSize:'18px',width:'32px',height:'32px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>‹</button>
        <div style={{flex:1,minWidth:0}}>
          <div className="font-bold text-lg leading-tight">{dateLabel}</div>
          <div className="text-xs mt-0.5" style={{color:'#475569'}}>
            {dayName} · <span style={{color:isToday?'#6366f1':isPast?'#64748b':'#10b981'}}>{isToday?'Today':isPast?'Past day':'Upcoming'}</span>
            {weather&&<span className="ml-2">{weather.desc} · {weather.maxF}°/{weather.minF}°F</span>}
            {wxLoading&&<span className="ml-2" style={{color:'#334155'}}>Fetching weather…</span>}
          </div>
        </div>
        <button onClick={()=>navigate(1)} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',fontSize:'18px',width:'32px',height:'32px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>›</button>
        {!isToday&&<button onClick={()=>setDate(today)} style={{background:'rgba(99,102,241,0.15)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.3)',borderRadius:'8px',padding:'4px 10px',fontSize:'12px'}}>Today</button>}
        <div className="flex gap-2 items-center" style={{marginLeft:'auto'}}>
          {lastGen&&<span className="text-xs" style={{color:'#334155'}}>Updated {new Date(lastGen).toLocaleTimeString('en',{hour:'numeric',minute:'2-digit'})}</span>}
          {hasAny&&<button onClick={()=>analyze(true)} disabled={loading} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',borderRadius:'8px',padding:'6px 10px',fontSize:'12px'}}>Regenerate</button>}
          <button onClick={()=>analyze(false)} disabled={loading}
            style={{background:loading?'rgba(99,102,241,0.3)':'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white',borderRadius:'12px',padding:'7px 16px',fontSize:'13px',fontWeight:600,boxShadow:loading?'none':'0 0 14px rgba(99,102,241,0.35)',cursor:loading?'default':'pointer'}}>
            {loading?'Analyzing…':'Analyze this day'}
          </button>
        </div>
      </div>

      {/* Context strip */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'10px',padding:'6px 12px',fontSize:'12px',color:'#64748b'}}>
          <span style={{color:'#e2e8f0',fontWeight:600}}>{dayEvents.length}</span> event{dayEvents.length!==1?'s':''}
        </div>
        {dayEvents.slice(0,5).map(e=>(
          <div key={e.id} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'6px 12px',fontSize:'12px',color:'#94a3b8'}}>
            {fmtHour(e.when.hour)} {e.title}
          </div>
        ))}
        {journalEntry&&<div style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:'10px',padding:'6px 12px',fontSize:'12px',color:'#818cf8'}}>📓 Journal entry</div>}
        {pastSimilarDays.length>0&&<div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'6px 12px',fontSize:'12px',color:'#475569'}}>{pastSimilarDays.length} past {dayName}s found</div>}
      </div>

      {error&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',color:'#f87171',borderRadius:'12px',padding:'12px',fontSize:'13px',marginBottom:'16px'}}>{error}</div>}

      {!hasAny&&!loading&&(
        <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'16px',padding:'48px',textAlign:'center'}}>
          <div style={{fontSize:'32px',marginBottom:'12px'}}>🔭</div>
          <div style={{color:'#e2e8f0',fontSize:'14px',marginBottom:'6px'}}>No analysis yet</div>
          <div style={{color:'#334155',fontSize:'12px'}}>Hit "Analyze this day" to generate AI insights for {isToday?'today':isPast?'this past day':'this upcoming day'}.</div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {SECTION_META.map(({key,label,icon,color,border,hdr})=>{
          const text=sections[key];
          const partial=sections[key+'_partial'];
          if(!text&&!loading) return null;
          return(
            <div key={key} style={{background:color,border:`1px solid ${border}`,borderRadius:'16px',padding:'16px',transition:'opacity .3s',animationDelay:'0.05s'}} className="animate-item">
              <div className="flex items-center gap-2 mb-2">
                <span style={{fontSize:'16px'}}>{icon}</span>
                <span style={{fontSize:'11px',fontWeight:'bold',letterSpacing:'0.1em',textTransform:'uppercase',color:hdr}}>{label}</span>
                {partial&&<span style={{fontSize:'11px',color:'#334155'}}>…</span>}
              </div>
              {text?(
                <div style={{fontSize:'14px',lineHeight:'1.65',color:'#e2e8f0'}}>{text}</div>
              ):(
                <div className="space-y-2 py-1">
                  <div className="skeleton h-3 rounded" style={{width:'100%'}}/>
                  <div className="skeleton h-3 rounded" style={{width:'80%'}}/>
                  <div className="skeleton h-3 rounded" style={{width:'60%'}}/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- Schedule Panel -------------------- */
const TYPE_COLORS = {
  Gym:         { bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.3)',  text:'#6ee7b7', dot:'#10b981' },
  Assignments: { bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.3)', text:'#93c5fd', dot:'#3b82f6' },
  Social:      { bg:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.3)', text:'#c4b5fd', dot:'#8b5cf6' },
  Manual:      { bg:'rgba(99,102,241,0.12)', border:'rgba(99,102,241,0.3)', text:'#a5b4fc', dot:'#6366f1' },
};

function fmtHour(h){
  const hr = Math.floor(h);
  const mins = Math.round((h - hr) * 60);
  const ap = hr < 12 ? 'AM' : 'PM';
  const disp = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  const minStr = mins > 0 ? ':' + String(mins).padStart(2,'0') : '';
  return `${disp}${minStr} ${ap}`;
}

function SchedulePanel({data, setData, toasts, isMobile}){
  const [view, setView] = useState(isMobile ? 'day' : 'week');
  const [offset, setOffset] = useState(0);
  const [modal, setModal] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [removingIds, setRemovingIds] = useState([]);
  const [scheduleSubtab, setScheduleSubtab] = useState('calendar');
  const pendingRef = useRef({});
  const events = data.events || [];

  const switchView = (v) => { setView(v); setOffset(0); };

  const addEvent = (ev) => {
    setData(d => ({ ...d, events:[...(d.events||[]), {...ev, id:uid()}] }));
    toasts.push('Event added');
  };

  const editEvent = (id, updates) => {
    setData(d => ({ ...d, events:(d.events||[]).map(e => e.id===id ? {...e,...updates} : e) }));
    toasts.push('Event updated');
  };

  function removeEvent(ev){
    setRemovingIds(r=>[...r, ev.id]);
    const finalize = () => {
      setData(d => ({ ...d, events:(d.events||[]).filter(e=>e.id!==ev.id) }));
      setRemovingIds(r=>r.filter(id=>id!==ev.id));
      delete pendingRef.current[ev.id];
    };
    pendingRef.current[ev.id] = setTimeout(finalize, 460);
    toasts.push({ text:`Deleted "${ev.title||'event'}"`, actionLabel:'Undo', action:()=>{
      clearTimeout(pendingRef.current[ev.id]);
      delete pendingRef.current[ev.id];
      setRemovingIds(r=>r.filter(id=>id!==ev.id));
      toasts.push('Restored');
    }}, 4000);
  }

  const getPeriodLabel = () => {
    const now = new Date();
    if(view==='day'){
      const d = new Date(now); d.setDate(d.getDate()+offset);
      return d.toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    }
    if(view==='week'){
      const dow = (now.getDay()+6)%7;
      const mon = new Date(now); mon.setDate(now.getDate()-dow+offset*7);
      const sun = new Date(mon); sun.setDate(mon.getDate()+6);
      const f = d=>d.toLocaleDateString('en',{month:'short',day:'numeric'});
      return f(mon)+' – '+sun.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'});
    }
    const d = new Date(now.getFullYear(), now.getMonth()+offset, 1);
    return d.toLocaleDateString('en',{month:'long',year:'numeric'});
  };

  return (
    <div>
      {/* Subtab switcher */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
        {[['calendar','Calendar'],['insights','Daily Insights']].map(([v,lbl])=>(
          <button key={v} onClick={()=>setScheduleSubtab(v)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={scheduleSubtab===v?{background:'rgba(255,255,255,0.1)',color:'#e2e8f0'}:{color:'#64748b'}}>
            {lbl}
          </button>
        ))}
      </div>

      {scheduleSubtab==='insights' && <DailyInsightsSubtab data={data} />}

      {scheduleSubtab==='calendar' && <>
      {/* Header */}
      <div className={`flex ${isMobile?'flex-col gap-3':'items-center justify-between'} mb-5`}>
        <div>
          <h2 className={`${isMobile?'text-xl':'text-2xl'} font-bold tracking-tight`}>Schedule</h2>
          <p className="text-xs mt-0.5" style={{color:'var(--muted)'}}>{getPeriodLabel()}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period nav */}
          <div className="flex items-center gap-1">
            <button onClick={()=>setOffset(o=>o-1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all hover:bg-white/10"
              style={{color:'#64748b',border:'1px solid rgba(255,255,255,0.06)'}}>‹</button>
            {offset!==0 && <button onClick={()=>setOffset(0)}
              className="px-2 py-0.5 rounded-lg text-xs transition-all hover:bg-white/10"
              style={{color:'#6366f1',border:'1px solid rgba(99,102,241,0.3)'}}>Today</button>}
            <button onClick={()=>setOffset(o=>o+1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all hover:bg-white/10"
              style={{color:'#64748b',border:'1px solid rgba(255,255,255,0.06)'}}>›</button>
          </div>
          {/* View switcher */}
          <div className="flex gap-0.5 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
            {['Day','Week','Month'].map(v=>(
              <button key={v}
                onClick={()=>switchView(v.toLowerCase())}
                style={view===v.toLowerCase()?{background:'rgba(255,255,255,0.1)',color:'#e2e8f0'}:{color:'#64748b'}}
                className="px-3 py-1 rounded-lg text-sm font-medium transition-all">
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={()=>setModal({when:{}})}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all"
            style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white',boxShadow:'0 0 16px rgba(99,102,241,0.35)'}}>
            + Add Event
          </button>
        </div>
      </div>

      {/* Type legend */}
      <div className="flex gap-5 mb-5">
        {Object.entries(TYPE_COLORS).map(([type,c])=>(
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{background:c.dot}}></div>
            <span className="text-xs" style={{color:'#64748b'}}>{type}</span>
          </div>
        ))}
      </div>

      {view==='week'  && <WeekView  events={events} offset={offset} onAdd={(day,hour)=>setModal({when:{day,hour}})} onRemove={removeEvent} onExpand={setExpandedEvent} removingIds={removingIds} />}
      {view==='day'   && <DayView   events={events} offset={offset} onAdd={(day,hour)=>setModal({when:{day,hour}})} onRemove={removeEvent} onExpand={setExpandedEvent} removingIds={removingIds} />}
      {view==='month' && <MonthView events={events} offset={offset} onAdd={(day)=>setModal({when:{day}})} />}

      {modal && <EventModal modal={modal} onClose={()=>setModal(null)} onSave={(ev)=>{ modal.editId ? editEvent(modal.editId, ev) : addEvent(ev); setModal(null); }} />}
      {expandedEvent && <EventDetailModal
        ev={events.find(e=>e.id===expandedEvent.id) || expandedEvent}
        onClose={()=>setExpandedEvent(null)}
        onRemove={(ev)=>{ removeEvent(ev); setExpandedEvent(null); }}
        onEdit={(ev)=>{ setExpandedEvent(null); setModal({editId:ev.id, when:ev.when, prefill:ev}); }}
        onToggleSubtask={(evId, stId)=>{
          setData(d=>({...d, events:(d.events||[]).map(e=>e.id!==evId?e:{...e,
            subtasks:(e.subtasks||[]).map(s=>s.id===stId?{...s,done:!s.done}:s)
          })}));
        }}
      />}
      </>}
    </div>
  );
}

/* ---- Positioned calendar helpers ---- */
const ROW_H = 56; // px per hour slot

function getEventsForDayColumn(events, di, weekMonDate=null){
  return events.filter(ev=>{
    if(ev.when?.hour === undefined) return false;
    if(ev.when?.exactDate){
      if(!weekMonDate) return false;
      const colDate=new Date(weekMonDate); colDate.setDate(weekMonDate.getDate()+di);
      return ev.when.exactDate===colDate.toISOString().slice(0,10);
    }
    const r = ev.recurrence; const d = ev.when?.day;
    if(!r||r==='weekly') return d===di;
    if(r==='daily') return true;
    if(r==='weekdays') return di>=0&&di<=4;
    if(r==='mwf') return [0,2,4].includes(di);
    if(r==='tth') return [1,3].includes(di);
    if(r==='custom') return (ev.customDays||[]).includes(di);
    return d===di;
  });
}

function layoutDayEvents(evs, firstHour){
  if(!evs.length) return [];
  const items = evs.map(ev=>({
    ev,
    start: ev.when.hour - firstHour,
    end: (ev.when.endHour || ev.when.hour+1) - firstHour,
    lane: 0, numLanes: 1,
  })).sort((a,b)=>a.start!==b.start?a.start-b.start:b.end-a.end);

  // Greedy lane assignment
  const laneEnds=[];
  items.forEach(item=>{
    let lane=laneEnds.findIndex(end=>end<=item.start);
    if(lane===-1) lane=laneEnds.length;
    laneEnds[lane]=item.end; item.lane=lane;
  });

  // Per-event numLanes = highest lane among all overlapping peers + 1
  items.forEach(item=>{
    let maxLane=item.lane;
    items.forEach(other=>{
      if(other!==item && other.start<item.end && other.end>item.start)
        maxLane=Math.max(maxLane, other.lane);
    });
    item.numLanes=maxLane+1;
  });

  return items.map(item=>({
    ev: item.ev,
    top: item.start*ROW_H+1,
    height: Math.max((item.end-item.start)*ROW_H-3, 20),
    leftPct: (item.lane/item.numLanes)*100,
    widthPct: (1/item.numLanes)*100,
  }));
}

function EventBlock({ev, onRemove, onExpand, removingIds, height}){
  const c = TYPE_COLORS[ev.type]||TYPE_COLORS.Manual;
  const subtasks = ev.subtasks||[];
  const doneCount = subtasks.filter(s=>s.done).length;
  const endH = ev.when?.endHour;
  const timeStr = ev.when?.hour!==undefined ? fmtHour(ev.when.hour)+(endH?' – '+fmtHour(endH):'') : '';
  const tall = height >= ROW_H*1.4;
  const isCheckin = ev.isCheckin;
  return (
    <div onClick={e=>{e.stopPropagation();onExpand&&onExpand(ev);}}
      className={`group w-full h-full rounded-lg overflow-hidden cursor-pointer select-none ${removingIds?.includes(ev.id)?'removing':''}`}
      style={{background:isCheckin?'rgba(16,185,129,0.12)':c.bg,border:`1px solid ${isCheckin?'rgba(16,185,129,0.35)':c.border}`,padding:'3px 6px',boxSizing:'border-box',transition:'filter .1s'}}>
      <div className="flex items-start justify-between gap-0.5">
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight" style={{fontSize:'11px',color:isCheckin?'#6ee7b7':c.text,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:tall?3:1,WebkitBoxOrient:'vertical'}}>{ev.title}</div>
          {tall && timeStr && <div style={{fontSize:'10px',color:isCheckin?'#6ee7b7':c.text,opacity:0.7,marginTop:'1px'}}>{timeStr}</div>}
          {tall && subtasks.length>0 && <div style={{fontSize:'10px',color:c.text,opacity:0.7}}>{doneCount}/{subtasks.length} done</div>}
          {!tall && subtasks.length>0 && <div style={{fontSize:'9px',color:c.text,opacity:0.6}}>{doneCount}/{subtasks.length}</div>}
          {isCheckin && tall && <div style={{fontSize:'9px',color:'#6ee7b7',opacity:0.8,marginTop:'2px'}}>Log in Life Planner ›</div>}
        </div>
        <button onClick={e=>{e.stopPropagation();onRemove&&onRemove(ev);}}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center hover:bg-white/25"
          style={{color:isCheckin?'#6ee7b7':c.text,fontSize:'11px',lineHeight:1}}>×</button>
      </div>
      {ev.recurrence && <div style={{fontSize:'8px',color:c.text,opacity:0.5,marginTop:'1px'}}>↻</div>}
    </div>
  );
}

function EventChip({ev, onRemove, onExpand, removingIds, delay=0}){
  const c = TYPE_COLORS[ev.type] || TYPE_COLORS.Manual;
  return (
    <div
      onClick={e=>{e.stopPropagation(); onExpand&&onExpand(ev);}}
      className={`group relative flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium animate-item cursor-pointer ${removingIds?.includes(ev.id)?'removing':''}`}
      style={{background:c.bg, border:`1px solid ${c.border}`, color:c.text, animationDelay:`${delay}ms`}}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:c.dot}}></div>
      <span className="truncate max-w-[90px]">{ev.title}</span>
      {ev.recurrence && <span title={ev.recurrence} style={{fontSize:'9px',opacity:0.6}}>↻</span>}
      {ev.subtasks?.length > 0 && (
        <span style={{fontSize:'9px',opacity:0.75,background:'rgba(255,255,255,0.1)',borderRadius:'4px',padding:'0 3px'}}>
          {ev.subtasks.filter(s=>s.done).length}/{ev.subtasks.length}
        </span>
      )}
      <button
        onClick={e=>{e.stopPropagation(); onRemove&&onRemove(ev);}}
        className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-white/20 text-white/70">
        ×
      </button>
    </div>
  );
}

function EventDetailModal({ev, onClose, onRemove, onEdit, onToggleSubtask}){
  const isMobile = useIsMobile();
  const c = TYPE_COLORS[ev.type] || TYPE_COLORS.Manual;
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const dayStr = ev.when?.day!==undefined ? days[ev.when.day] : null;
  const timeStr = ev.when?.hour!==undefined ? fmtHour(ev.when.hour) : null;
  const subtasks = ev.subtasks || [];
  const doneCount = subtasks.filter(s=>s.done).length;
  const allDone = subtasks.length > 0 && doneCount === subtasks.length;
  return (
    <div className={`fixed inset-0 z-50 flex ${isMobile?'items-end':'items-center'} justify-center`}>
      <div className="absolute inset-0" style={{background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)'}} onClick={onClose}/>
      <div className={`relative z-50 p-6 ${isMobile?'w-full rounded-t-3xl':'rounded-2xl w-[400px]'}`} style={{background:'#1a1a24',border:`1px solid ${c.border}`,boxShadow:`0 -8px 40px rgba(0,0,0,0.7), 0 0 40px ${c.bg}`,maxHeight:'90vh',overflowY:'auto'}}>
        {/* Type badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{background:c.dot}}></div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{color:c.text}}>{ev.type||'Manual'}</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-white/10" style={{color:'#475569'}}>×</button>
        </div>
        {/* Title */}
        <h3 className="text-xl font-bold mb-3" style={{color:'#e2e8f0'}}>{ev.title}</h3>
        {/* Time info */}
        {(dayStr||timeStr) && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{background:'rgba(255,255,255,0.04)'}}>
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{color:'#475569'}}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span className="text-sm" style={{color:'#94a3b8'}}>{[dayStr, timeStr].filter(Boolean).join(' at ')}</span>
          </div>
        )}
        {/* Recurrence */}
        {ev.recurrence && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{background:'rgba(255,255,255,0.04)'}}>
            <span style={{color:'#475569',fontSize:'14px'}}>↻</span>
            <span className="text-sm capitalize" style={{color:'#94a3b8'}}>
              {ev.recurrence==='custom'
                ? 'Repeats ' + (ev.customDays||[]).map(d=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(' / ')
                : {weekly:'Repeats weekly',daily:'Repeats every day',weekdays:'Repeats weekdays (Mon–Fri)',mwf:'Repeats Mon / Wed / Fri',tth:'Repeats Tue / Thu'}[ev.recurrence]||ev.recurrence}
            </span>
          </div>
        )}
        {/* Subtasks checklist */}
        {subtasks.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{color:'#334155'}}>To-Do</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{background: allDone?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.05)', color: allDone?'#34d399':'#64748b'}}>
                {doneCount}/{subtasks.length} {allDone ? '✓ complete' : 'done'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1 rounded-full mb-3 overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{width:`${subtasks.length?doneCount/subtasks.length*100:0}%`,
                        background: allDone?'#10b981':'linear-gradient(90deg,#6366f1,#8b5cf6)'}}/>
            </div>
            <div className="space-y-1.5">
              {subtasks.map(st=>(
                <button key={st.id}
                  onClick={()=>onToggleSubtask&&onToggleSubtask(ev.id, st.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/5 group"
                  style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
                  <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all duration-200"
                    style={{borderColor: st.done?c.dot:'rgba(255,255,255,0.2)', background: st.done?c.bg:'transparent'}}>
                    {st.done && <span style={{color:c.text,fontSize:'9px',fontWeight:'bold'}}>✓</span>}
                  </div>
                  <span className="text-sm flex-1 transition-all duration-200"
                    style={{textDecoration:st.done?'line-through':'none', color:st.done?'#334155':'#e2e8f0'}}>
                    {st.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Notes */}
        {ev.notes && ev.notes !== ev.title && (
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#334155'}}>Notes</div>
            <p className="text-sm leading-relaxed" style={{color:'#94a3b8'}}>{ev.notes}</p>
          </div>
        )}
        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-4" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <button onClick={()=>{onRemove(ev);onClose();}} className="px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-red-900/30" style={{color:'#f87171',border:'1px solid rgba(248,113,113,0.2)'}}>Delete</button>
          <button onClick={()=>onEdit&&onEdit(ev)} className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all" style={{background:'rgba(255,255,255,0.06)',color:'#e2e8f0'}}>Edit</button>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white'}}>Close</button>
        </div>
      </div>
    </div>
  );
}

function WeekView({events, onAdd, onRemove, onExpand, removingIds, offset=0}){
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours = Array.from({length:18}, (_,i)=>6+i);
  const totalH = hours.length * ROW_H;
  const now = new Date();
  const nowDow = (now.getDay()+6)%7;
  const weekMon = new Date(now); weekMon.setDate(now.getDate()-nowDow+offset*7);
  const todayDi = offset===0 ? nowDow : -1;
  const currentHour = offset===0 ? now.getHours() : -1;
  const nowTop = offset===0 ? (now.getHours()-6)*ROW_H+(now.getMinutes()/60)*ROW_H : -1;

  return (
    <div className="rounded-2xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.01)'}}>
      {/* Day headers */}
      <div style={{display:'grid',gridTemplateColumns:'56px repeat(7,1fr)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{borderRight:'1px solid rgba(255,255,255,0.06)'}}/>
        {dayNames.map((d,i)=>{
          const colDate = new Date(weekMon); colDate.setDate(weekMon.getDate()+i);
          const isToday = i===todayDi;
          return (
            <div key={d} style={{padding:'12px 0',textAlign:'center',borderRight:i<6?'1px solid rgba(255,255,255,0.06)':'none',background:isToday?'rgba(99,102,241,0.08)':'transparent'}}>
              <div style={{fontSize:'11px',fontWeight:'bold',letterSpacing:'0.08em',color:isToday?'#818cf8':'#475569'}}>{d}</div>
              <div style={{fontSize:'11px',marginTop:'2px',color:isToday?'#6366f1':'#334155'}}>{isToday?'Today':colDate.getDate()}</div>
            </div>
          );
        })}
      </div>
      {/* Scrollable body */}
      <div style={{maxHeight:'calc(100vh - 300px)',overflowY:'auto',display:'flex'}}>
        {/* Time gutter */}
        <div style={{width:'56px',flexShrink:0,position:'relative',height:totalH,borderRight:'1px solid rgba(255,255,255,0.06)'}}>
          {hours.map(h=>(
            <div key={h} style={{position:'absolute',top:(h-6)*ROW_H,height:ROW_H,right:0,paddingRight:'8px',paddingTop:'5px',display:'flex',alignItems:'flex-start',justifyContent:'flex-end'}}>
              <span style={{fontSize:'10px',whiteSpace:'nowrap',color:h===currentHour?'#6366f1':'#334155',fontWeight:h===currentHour?600:400}}>{fmtHour(h)}</span>
            </div>
          ))}
        </div>
        {/* Day columns */}
        {dayNames.map((d,di)=>{
          const isToday = di===todayDi;
          const colEvs = layoutDayEvents(getEventsForDayColumn(events,di,weekMon), 6);
          return (
            <div key={d} style={{flex:1,position:'relative',height:totalH,borderRight:di<6?'1px solid rgba(255,255,255,0.04)':'none',background:isToday?'rgba(255,255,255,0.005)':'transparent',minWidth:0}}>
              {/* Hour grid lines + click targets */}
              {hours.map(h=>(
                <div key={h} onClick={()=>onAdd(di,h)}
                  className="group/cell"
                  style={{position:'absolute',top:(h-6)*ROW_H,height:ROW_H,left:0,right:0,borderBottom:'1px solid rgba(255,255,255,0.03)',cursor:'pointer'}}>
                  {/* 30-min sub-line */}
                  <div style={{position:'absolute',top:'50%',left:0,right:0,borderBottom:'1px solid rgba(255,255,255,0.015)',pointerEvents:'none'}}/>
                  <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center" style={{background:'rgba(255,255,255,0.02)'}}>
                    <span style={{fontSize:'11px',color:'#334155'}}>+</span>
                  </div>
                </div>
              ))}
              {/* Current time line */}
              {isToday && nowTop>0 && (
                <div style={{position:'absolute',top:nowTop,left:0,right:0,height:'2px',background:'#6366f1',opacity:0.8,zIndex:3,pointerEvents:'none'}}/>
              )}
              {/* Events */}
              {colEvs.map(({ev,top,height,leftPct,widthPct})=>(
                <div key={ev.id} style={{position:'absolute',top,height,left:`calc(${leftPct}% + 2px)`,width:`calc(${widthPct}% - 4px)`,zIndex:2}}>
                  <EventBlock ev={ev} onRemove={onRemove} onExpand={onExpand} removingIds={removingIds} height={height}/>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({events, onAdd, onRemove, onExpand, removingIds, offset=0}){
  const hours = Array.from({length:18}, (_,i)=>6+i);
  const totalH = hours.length * ROW_H;
  const now = new Date();
  const displayDate = new Date(now); displayDate.setDate(now.getDate()+offset);
  const displayDi = (displayDate.getDay()+6)%7;
  const isToday = offset===0;
  const currentHour = isToday ? now.getHours() : -1;
  const nowTop = isToday ? (now.getHours()-6)*ROW_H+(now.getMinutes()/60)*ROW_H : -1;
  const dayLabel = displayDate.toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'});
  const dayViewMon = new Date(displayDate); dayViewMon.setDate(displayDate.getDate()-displayDi);
  const colEvs = layoutDayEvents(getEventsForDayColumn(events, displayDi, dayViewMon), 6);

  return (
    <div className="rounded-2xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{borderColor:'rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}>
        <span className="text-sm font-semibold">{dayLabel}</span>
        <span className="text-xs" style={{color:'#475569'}}>{colEvs.length} event{colEvs.length!==1?'s':''}</span>
      </div>
      <div style={{maxHeight:'calc(100vh - 280px)',overflowY:'auto',display:'flex'}}>
        {/* Time gutter */}
        <div style={{width:'72px',flexShrink:0,position:'relative',height:totalH,borderRight:'1px solid rgba(255,255,255,0.06)'}}>
          {hours.map(h=>(
            <div key={h} style={{position:'absolute',top:(h-6)*ROW_H,height:ROW_H,right:0,paddingRight:'12px',paddingTop:'6px',display:'flex',alignItems:'flex-start',justifyContent:'flex-end'}}>
              <span style={{fontSize:'11px',whiteSpace:'nowrap',color:h===currentHour?'#6366f1':'#334155',fontWeight:h===currentHour?600:400}}>{fmtHour(h)}</span>
            </div>
          ))}
        </div>
        {/* Event column */}
        <div style={{flex:1,position:'relative',height:totalH,minWidth:0}}>
          {hours.map(h=>(
            <div key={h} onClick={()=>onAdd(displayDi,h)}
              className="group/cell"
              style={{position:'absolute',top:(h-6)*ROW_H,height:ROW_H,left:0,right:0,borderBottom:'1px solid rgba(255,255,255,0.03)',cursor:'pointer',background:h===currentHour?'rgba(99,102,241,0.05)':'transparent'}}>
              <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center px-3" style={{background:'rgba(255,255,255,0.015)'}}>
                <span style={{fontSize:'11px',color:'#334155'}}>+ Add event</span>
              </div>
            </div>
          ))}
          {isToday && nowTop>0 && (
            <div style={{position:'absolute',top:nowTop,left:0,right:0,height:'2px',background:'#6366f1',opacity:0.8,zIndex:3,pointerEvents:'none'}}/>
          )}
          {colEvs.map(({ev,top,height,leftPct,widthPct})=>(
            <div key={ev.id} style={{position:'absolute',top,height,left:`calc(${leftPct}% + 4px)`,width:`calc(${widthPct}% - 8px)`,zIndex:2}}>
              <EventBlock ev={ev} onRemove={onRemove} onExpand={onExpand} removingIds={removingIds} height={height}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthView({events, onAdd, offset=0}){
  const now = new Date();
  const displayMonth = new Date(now.getFullYear(), now.getMonth()+offset, 1);
  const year = displayMonth.getFullYear(), month = displayMonth.getMonth();
  const firstDow = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const startPad = (firstDow+6)%7;
  const cells = Array.from({length:startPad+daysInMonth},(_,i)=>i<startPad?null:i-startPad+1);
  while(cells.length%7!==0) cells.push(null);
  const today = now.getDate();
  const isCurrentMonth = year===now.getFullYear() && month===now.getMonth();
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // Build date string → events lookup for month view
  const eventsByDate = {};
  (events||[]).forEach(ev=>{ if(ev.when?.date){ const k=String(ev.when.date); eventsByDate[k]=(eventsByDate[k]||[]); eventsByDate[k].push(ev); } });

  return (
    <div className="rounded-2xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
      <div className="px-5 py-3 border-b" style={{borderColor:'rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}>
        <span className="text-sm font-semibold">{displayMonth.toLocaleDateString('en',{month:'long',year:'numeric'})}</span>
      </div>
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b" style={{borderColor:'rgba(255,255,255,0.06)'}}>
        {dayNames.map(d=>(
          <div key={d} className="py-2 text-center text-xs font-bold uppercase tracking-widest" style={{color:'#334155'}}>{d}</div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day,i)=>{
          if(!day) return <div key={i} className="border-r border-b last:border-r-0" style={{minHeight:'80px',borderColor:'rgba(255,255,255,0.04)',background:'rgba(0,0,0,0.1)'}}/>;
          const isToday = isCurrentMonth && day===today;
          const dayEvs = eventsByDate[String(day)]||[];
          return (
            <div key={i}
              onClick={()=>onAdd(day)}
              className="border-r border-b last:border-r-0 p-2 cursor-pointer transition-colors"
              style={{minHeight:'80px',borderColor:'rgba(255,255,255,0.04)',background:isToday?'rgba(99,102,241,0.08)':'transparent'}}
              onMouseEnter={e=>e.currentTarget.style.background=isToday?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.02)'}
              onMouseLeave={e=>e.currentTarget.style.background=isToday?'rgba(99,102,241,0.08)':'transparent'}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1"
                style={{background:isToday?'#6366f1':'transparent',color:isToday?'white':'#475569'}}>
                {day}
              </div>
              {dayEvs.slice(0,3).map(ev=>{
                const c=TYPE_COLORS[ev.type]||TYPE_COLORS.Manual;
                return <div key={ev.id} className="text-xs truncate px-1 rounded mb-0.5" style={{background:c.bg,color:c.text}}>{ev.title}</div>;
              })}
              {dayEvs.length>3 && <div className="text-xs" style={{color:'#475569'}}>+{dayEvs.length-3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventModal({modal, onClose, onSave}){
  const isMobile = useIsMobile();
  const p = modal.prefill;
  const [title, setTitle]   = useState(p?.title || '');
  const [type, setType]     = useState(p?.type  || 'Manual');
  const [notes, setNotes]   = useState(p?.notes || '');
  const [day,  setDay]      = useState(p?.when?.day  !== undefined ? String(p.when.day)  : modal.when?.day  !== undefined ? String(modal.when.day)  : '');
  const [hour, setHour]     = useState(p?.when?.hour !== undefined ? String(p.when.hour) : modal.when?.hour !== undefined ? String(modal.when.hour) : '');
  const [endHour, setEndHour] = useState(p?.when?.endHour !== undefined ? String(p.when.endHour) : modal.when?.endHour !== undefined ? String(modal.when.endHour) : '');
  const [recurrence, setRecurrence] = useState(p?.recurrence || '');
  const [customDays, setCustomDays] = useState(p?.customDays || []);
  const [subtasks, setSubtasks] = useState(p?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');

  const RECUR_PRESETS = [
    {value:'',        label:'One-time'},
    {value:'daily',   label:'Every day'},
    {value:'weekdays',label:'Weekdays'},
    {value:'weekly',  label:'Weekly'},
    {value:'custom',  label:'Custom…'},
  ];
  const DAY_LABELS = ['M','T','W','T','F','S','S'];
  const DAY_FULL   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  const toggleCustomDay = (i) => setCustomDays(cd => cd.includes(i) ? cd.filter(d=>d!==i) : [...cd,i].sort((a,b)=>a-b));

  // Convert decimal hour (e.g. 8.5 = 8:30) ↔ "HH:MM" for <input type="time">
  const decToTime = (dec) => {
    if(dec===''||dec===undefined) return '';
    const h = Math.floor(Number(dec));
    const m = Math.round((Number(dec)-h)*60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };
  const timeToDec = (str) => {
    if(!str) return '';
    const [h,m] = str.split(':').map(Number);
    return String(h + m/60);
  };

  const save = () => {
    if(!title.trim()) return;
    const when = (day!==''||hour!=='') ? {day:day!==''?Number(day):undefined, hour:hour!==''?Number(hour):undefined, endHour:endHour!==''?Number(endHour):undefined} : undefined;
    const rec = recurrence||undefined;
    const cd  = rec==='custom' && customDays.length ? customDays : undefined;
    onSave({title,type,notes,when,recurrence:rec,customDays:cd,subtasks:subtasks.length?subtasks:undefined});
  };

  const typeStyles = {
    Manual:      {active:'rgba(99,102,241,0.2)',border:'rgba(99,102,241,0.5)',text:'#a5b4fc'},
    Gym:         {active:'rgba(16,185,129,0.2)',border:'rgba(16,185,129,0.5)',text:'#6ee7b7'},
    Assignments: {active:'rgba(59,130,246,0.2)',border:'rgba(59,130,246,0.5)',text:'#93c5fd'},
    Social:      {active:'rgba(139,92,246,0.2)',border:'rgba(139,92,246,0.5)',text:'#c4b5fd'},
  };

  return (
    <div className={`fixed inset-0 z-40 flex ${isMobile?'items-end':'items-center'} justify-center`}>
      <div className="absolute inset-0" style={{background:'rgba(0,0,0,0.65)',backdropFilter:'blur(4px)'}} onClick={onClose}/>
      <div className={`relative z-50 p-6 ${isMobile?'w-full rounded-t-3xl':'rounded-2xl w-[440px]'}`} style={{background:'#1a1a24',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 -8px 40px rgba(0,0,0,0.7)',maxHeight:'92vh',overflowY:'auto'}}>
        <h3 className="font-bold text-lg mb-1">{modal.editId ? 'Edit Event' : 'New Event'}</h3>
        {day!=='' && <p className="text-xs mb-4" style={{color:'#475569'}}>
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][Number(day)]}
          {hour!=='' ? ' . '+fmtHour(Number(hour)) : ''}
        </p>}
        <input
          autoFocus
          className="w-full p-3 rounded-xl text-sm mb-3 transition-all focus:outline-none"
          style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}
          onFocus={e=>e.target.style.borderColor='rgba(99,102,241,0.5)'}
          onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'}
          placeholder="Event title..."
          value={title}
          onChange={e=>setTitle(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') save(); }}
        />
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs mb-1" style={{color:'#475569'}}>Day</label>
            <select className="w-full p-2 rounded-xl text-sm focus:outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}
              value={day} onChange={e=>setDay(e.target.value)}>
              <option value="">No specific day</option>
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d,i)=><option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{color:'#475569'}}>Start Time</label>
            <input type="time" className="w-full p-2 rounded-xl text-sm focus:outline-none"
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',colorScheme:'dark'}}
              onFocus={e=>e.target.style.borderColor='rgba(99,102,241,0.5)'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'}
              value={decToTime(hour)}
              onChange={e=>{
                const v=timeToDec(e.target.value);
                setHour(v);
                if(endHour!==''&&v!==''&&Number(v)>=Number(endHour)) setEndHour('');
              }}
            />
            {hour!=='' && <button className="text-xs mt-0.5 transition-all hover:opacity-80" style={{color:'#475569'}} onClick={()=>setHour('')}>clear</button>}
          </div>
          <div>
            <label className="block text-xs mb-1" style={{color:'#475569'}}>End Time</label>
            <input type="time" className="w-full p-2 rounded-xl text-sm focus:outline-none"
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',colorScheme:'dark'}}
              onFocus={e=>e.target.style.borderColor='rgba(99,102,241,0.5)'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'}
              value={decToTime(endHour)}
              onChange={e=>setEndHour(timeToDec(e.target.value))}
            />
            {endHour!=='' && <button className="text-xs mt-0.5 transition-all hover:opacity-80" style={{color:'#475569'}} onClick={()=>setEndHour('')}>clear</button>}
          </div>
        </div>
        {/* Type picker */}
        <label className="block text-xs mb-2" style={{color:'#475569'}}>Type</label>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {Object.entries(typeStyles).map(([t,s])=>(
            <button key={t}
              onClick={()=>setType(t)}
              className="py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={type===t?{background:s.active,border:`1px solid ${s.border}`,color:s.text}:{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',color:'#475569'}}>
              {t}
            </button>
          ))}
        </div>
        {/* Recurrence picker */}
        <label className="block text-xs mb-2" style={{color:'#475569'}}>Repeat</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {RECUR_PRESETS.map(({value,label})=>(
            <button key={value}
              onClick={()=>{ setRecurrence(value); if(value!=='custom') setCustomDays([]); }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={recurrence===value
                ?{background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.5)',color:'#a5b4fc'}
                :{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',color:'#475569'}}>
              {label}
            </button>
          ))}
        </div>
        {recurrence==='custom' && (
          <div className="flex gap-1.5 mb-2 mt-1">
            {DAY_LABELS.map((d,i)=>(
              <button key={i}
                onClick={()=>toggleCustomDay(i)}
                title={DAY_FULL[i]}
                className="w-8 h-8 rounded-lg text-xs font-bold transition-all flex-shrink-0"
                style={customDays.includes(i)
                  ?{background:'rgba(99,102,241,0.25)',border:'1px solid rgba(99,102,241,0.6)',color:'#a5b4fc'}
                  :{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',color:'#475569'}}>
                {d}
              </button>
            ))}
          </div>
        )}
        <div className="mb-3"/>
        <textarea
          className="w-full p-3 rounded-xl text-sm resize-none mb-4 focus:outline-none transition-all"
          style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}
          onFocus={e=>e.target.style.borderColor='rgba(99,102,241,0.5)'}
          onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'}
          rows={2} placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)}
        />
        {/* Subtasks */}
        <div className="mb-4">
          <label className="block text-xs mb-2" style={{color:'#475569'}}>To-Do Items (optional)</label>
          <div className="space-y-1.5 mb-2">
            {subtasks.map((st,i)=>(
              <div key={st.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                <div className="w-3 h-3 rounded border flex-shrink-0" style={{borderColor:'rgba(255,255,255,0.2)'}}/>
                <span className="flex-1 text-sm" style={{color:'#94a3b8'}}>{st.title}</span>
                <button onClick={()=>setSubtasks(s=>s.filter((_,j)=>j!==i))} className="text-xs hover:text-red-400 transition-colors" style={{color:'#475569'}}>×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 p-2 rounded-xl text-sm focus:outline-none transition-all"
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}
              onFocus={e=>e.target.style.borderColor='rgba(99,102,241,0.5)'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'}
              placeholder="Add a to-do item…"
              value={newSubtask}
              onChange={e=>setNewSubtask(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&newSubtask.trim()){ setSubtasks(s=>[...s,{id:uid(),title:newSubtask.trim(),done:false}]); setNewSubtask(''); e.preventDefault(); }}}
            />
            <button
              onClick={()=>{ if(newSubtask.trim()){ setSubtasks(s=>[...s,{id:uid(),title:newSubtask.trim(),done:false}]); setNewSubtask(''); }}}
              className="px-3 py-1.5 rounded-xl text-sm font-medium"
              style={{background:'rgba(99,102,241,0.15)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.3)'}}>
              + Add
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded-xl text-sm transition-all hover:bg-white/5" style={{color:'#64748b'}} onClick={onClose}>Cancel</button>
          <button
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white',boxShadow:'0 0 16px rgba(99,102,241,0.3)'}}
            onClick={save}>
            {modal.editId ? 'Save Changes' : 'Save Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Shared TTS hook -------------------- */
function useSpeaker(){
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);
  const genRef   = useRef(0);

  const strip = (txt) => txt
    .replace(/#{1,6}\s*/g,'').replace(/\*\*\*(.+?)\*\*\*/g,'$1').replace(/\*\*(.+?)\*\*/g,'$1')
    .replace(/\*(.+?)\*/g,'$1').replace(/__(.+?)__/g,'$1').replace(/_(.+?)_/g,'$1')
    .replace(/`{1,3}[^`]*`{1,3}/g,'').replace(/\[(.+?)\]\(.+?\)/g,'$1')
    .replace(/^>\s*/gm,'').replace(/^[-*+]\s+/gm,'').replace(/^\d+\.\s+/gm,'')
    .replace(/^-{3,}$/gm,'').replace(/→|←|↑|↓|▶|►/g,' ').replace(/\n{3,}/g,'\n\n').trim();

  const chunks = (txt) => {
    const raw = txt.match(/[^.!?]+[.!?]+(\s|$)?/g) || [txt];
    const out = []; let buf = '';
    for(const s of raw){ buf+=s; if(buf.length>=180){out.push(buf.trim());buf='';} }
    if(buf.trim()) out.push(buf.trim());
    return out.length ? out : [txt];
  };

  const fetchUrl = async (text, s) => {
    if(s.ttsProvider==='elevenlabs' && s.elevenLabsKey){
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${s.elevenLabsVoice||'21m00Tcm4TlvDq8ikWAM'}`,{
        method:'POST', headers:{'xi-api-key':s.elevenLabsKey,'Content-Type':'application/json'},
        body:JSON.stringify({text,model_id:'eleven_turbo_v2_5',voice_settings:{stability:0.45,similarity_boost:0.75,style:0.3}})
      });
      if(!r.ok) throw new Error('EL '+r.status);
      return URL.createObjectURL(await r.blob());
    }
    if(s.ttsProvider==='openai' && s.openaiTtsKey){
      const r = await fetch('https://api.openai.com/v1/audio/speech',{
        method:'POST', headers:{'Authorization':'Bearer '+s.openaiTtsKey,'Content-Type':'application/json'},
        body:JSON.stringify({model:'tts-1',voice:s.openaiTtsVoice||'nova',input:text,speed:1.25})
      });
      if(!r.ok) throw new Error('OAI '+r.status);
      return URL.createObjectURL(await r.blob());
    }
    return null;
  };

  const playUrl = (url, gen) => new Promise(res=>{
    if(genRef.current!==gen){URL.revokeObjectURL(url);res();return;}
    const a = new Audio(url); audioRef.current=a;
    const done=()=>{URL.revokeObjectURL(url);audioRef.current=null;res();};
    a.onended=done; a.onerror=done; a.play().catch(done);
  });

  const speak = async (txt) => {
    const gen = ++genRef.current;
    const clean = strip(txt);
    const s = ls('magverse:v1')?.settings || {};
    if(audioRef.current){audioRef.current.pause();audioRef.current=null;}
    window.speechSynthesis?.cancel();
    setSpeaking(true);
    try{
      if((s.ttsProvider==='elevenlabs'&&s.elevenLabsKey)||(s.ttsProvider==='openai'&&s.openaiTtsKey)){
        const parts = chunks(clean);
        let currentFetch = fetchUrl(parts[0], s);
        let prefetch = parts.length > 1 ? fetchUrl(parts[1], s) : null;
        for(let i=0;i<parts.length;i++){
          if(genRef.current!==gen) break;
          const url = await currentFetch;
          currentFetch = prefetch;
          prefetch = (i+2<parts.length) ? fetchUrl(parts[i+2],s) : null;
          await playUrl(url, gen);
        }
        if(genRef.current===gen) setSpeaking(false);
        return;
      }
    }catch(e){ console.warn('TTS fallback',e.message); }
    if(genRef.current!==gen){setSpeaking(false);return;}
    if(!window.speechSynthesis){setSpeaking(false);return;}
    const doSpeak=()=>{
      if(genRef.current!==gen) return;
      const voices=window.speechSynthesis.getVoices();
      const sv=s.ttsVoice||'';
      const ranked=[v=>sv&&v.name===sv,v=>v.name==='Samantha',v=>v.name==='Karen',
        v=>v.name.includes('Aria')&&v.name.includes('Natural'),v=>v.name.includes('Jenny')&&v.name.includes('Natural'),
        v=>v.name.includes('Microsoft Aria'),v=>v.name.includes('Microsoft Jenny'),
        v=>v.lang==='en-US'&&!v.localService,v=>v.lang==='en-US',v=>v.lang.startsWith('en')];
      let voice=null; for(const t of ranked){voice=voices.find(t);if(voice)break;}
      const u=new SpeechSynthesisUtterance(clean);
      if(voice)u.voice=voice; u.rate=0.9;u.pitch=1;u.volume=1;
      u.onstart=()=>setSpeaking(true);u.onend=()=>setSpeaking(false);u.onerror=()=>setSpeaking(false);
      window.speechSynthesis.speak(u);
    };
    window.speechSynthesis.getVoices().length===0
      ? window.speechSynthesis.addEventListener('voiceschanged',doSpeak,{once:true})
      : doSpeak();
  };

  const cancel=()=>{
    genRef.current++;
    if(audioRef.current){audioRef.current.pause();audioRef.current=null;}
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  return {speaking, speak, cancel};
}

/* -------------------- Tasks Panel -------------------- */
const TASK_CATEGORIES = [
  { id:'classroom',      label:'Classroom Tasks',      color:'#6366f1', bg:'rgba(99,102,241,0.12)',  dot:'#818cf8' },
  { id:'extracurricular',label:'Extracurricular Tasks', color:'#10b981', bg:'rgba(16,185,129,0.12)', dot:'#34d399' },
  { id:'personal',       label:'Personal Tasks',        color:'#f59e0b', bg:'rgba(245,158,11,0.12)', dot:'#fbbf24' },
];
const PRIORITY_META = {
  High: { label:'High', color:'#f87171', bg:'rgba(248,113,113,0.15)' },
  Med:  { label:'Med',  color:'#fbbf24', bg:'rgba(251,191,36,0.15)'  },
  Low:  { label:'Low',  color:'#94a3b8', bg:'rgba(148,163,184,0.12)' },
};

function taskUrgencyScore(task){
  if(task.status==='Done') return 1e9;
  const p = {High:3, Med:2, Low:1}[task.priority] || 1;
  const now = Date.now();
  const due = task.dueDate ? new Date(task.dueDate).getTime() : null;
  if(!due) return 10000 - p * 10;
  const days = (due - now) / 86400000;
  if(days < 0)   return -1000 + days - p * 100; // overdue first
  if(days < 1)   return days - p * 50;
  if(days < 3)   return days - p * 20;
  if(days < 7)   return days - p * 5;
  return days - p;
}

function formatDue(dateStr){
  if(!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((dd - today) / 86400000);
  if(diff < 0) return { text: `${Math.abs(diff)}d overdue`, overdue: true };
  if(diff === 0) return { text: 'Due today', urgent: true };
  if(diff === 1) return { text: 'Due tomorrow', urgent: true };
  if(diff <= 7)  return { text: `Due in ${diff}d`, urgent: false };
  return { text: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}), urgent: false };
}

/* -------------------- Tasks AI Chat Panel -------------------- */
function TasksAIChatPanel({ tasks, apiKey, onAddTask, onUpdateTask, onDeleteTask, toasts }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef(null);
  const dict = useDictation((t) => { setInput(prev => prev ? prev + ' ' + t : t); setListening(false); });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, loading]);

  function buildSystem() {
    const today = new Date().toISOString().slice(0, 10);
    const taskList = tasks.map(t => ({
      id: t.id, title: t.title, category: t.category,
      priority: t.priority, status: t.status,
      dueDate: t.dueDate || null, subject: t.subject || null,
    }));
    return `You are Rishi's personal task assistant in Magverse. Help him manage tasks across 3 categories: classroom (academic work, assignments, homework), extracurricular (clubs/activities/sports), personal (life tasks/errands/habits).

You can add tasks, update them, mark done, delete, reprioritize, give workload insights, and help plan what to tackle first.

When performing actions, include them at the END of your response in <magverse-actions> tags:
<magverse-actions>[{"type":"add_task","task":{"title":"...","category":"classroom","priority":"High","dueDate":"YYYY-MM-DD","subject":"","notes":"","status":"To Do"}},{"type":"mark_done","taskId":"id"},{"type":"update_task","taskId":"id","patch":{"priority":"High","dueDate":"2026-05-25"}},{"type":"delete_task","taskId":"id"}]</magverse-actions>

Rules: dueDate = YYYY-MM-DD or null. category = "classroom"|"extracurricular"|"personal". priority = "High"|"Med"|"Low". Always explain briefly before acting. Be concise. Plain text only, no markdown.

Today: ${today}
TASKS: ${JSON.stringify(taskList)}`;
  }

  function execActions(text) {
    const m = text.match(/<magverse-actions>([\s\S]*?)<\/magverse-actions>/);
    if (!m) return;
    try {
      JSON.parse(m[1]).forEach(a => {
        if (a.type === 'add_task') onAddTask(a.task);
        else if (a.type === 'mark_done') onUpdateTask(a.taskId, { status: 'Done', doneAt: new Date().toISOString() });
        else if (a.type === 'update_task') onUpdateTask(a.taskId, a.patch);
        else if (a.type === 'delete_task') onDeleteTask(a.taskId);
      });
    } catch(e) {}
  }

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    if (!apiKey) { toasts.push('Add API key in Settings to use AI chat'); return; }
    setInput('');
    const history = [...msgs, { role: 'user', content: msg }];
    setMsgs(history);
    setLoading(true);
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, stream: true, system: buildSystem(), messages: history.map(m => ({ role: m.role, content: m.content })) })
      });
      if (!resp.ok) throw new Error('API error');
      let full = '';
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      setMsgs(m => [...m, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const j = JSON.parse(line.slice(6));
            if (j.type === 'content_block_delta' && j.delta?.type === 'text_delta') {
              full += j.delta.text;
              setMsgs(m => { const a = [...m]; a[a.length-1] = { role: 'assistant', content: full }; return a; });
            }
          } catch(e) {}
        }
      }
      execActions(full);
    } catch(e) {
      setMsgs(m => [...m, { role: 'assistant', content: 'Could not reach AI. Check your API key in Settings.' }]);
    } finally {
      setLoading(false);
    }
  }

  const displayText = t => t.replace(/<magverse-actions>[\s\S]*?<\/magverse-actions>/g, '').trim();

  return (
    <div style={{ width:'320px', flexShrink:0, borderLeft:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ fontSize:'13px', fontWeight:600, color:'#e2e8f0' }}>AI Assistant</div>
        <div style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>Add, organize & prioritize tasks with AI</div>
      </div>
      <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:'10px' }}>
        {msgs.length === 0 && (
          <div style={{ textAlign:'center', paddingTop:'28px' }}>
            <div style={{ fontSize:'26px', marginBottom:'10px' }}>🤖</div>
            <div style={{ fontSize:'11px', color:'#475569', lineHeight:1.75 }}>
              "Add high priority essay for English due Friday"<br/>
              "What's most urgent right now?"<br/>
              "Mark my CS homework done"<br/>
              "Move Spanish quiz to high priority"<br/>
              "What do I have due this week?"
            </div>
          </div>
        )}
        {msgs.map((m, i) => {
          const txt = displayText(m.content);
          if (!txt && !(m.role === 'assistant' && loading && i === msgs.length - 1)) return null;
          return (
            <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
              <div style={{
                maxWidth:'88%', padding:'8px 11px',
                borderRadius: m.role==='user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                background: m.role==='user' ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${m.role==='user'?'rgba(99,102,241,0.28)':'rgba(255,255,255,0.07)'}`,
                fontSize:'12px', color:'#e2e8f0', lineHeight:1.55, whiteSpace:'pre-wrap'
              }}>
                {txt || <span style={{color:'#475569'}}>...</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:'6px', alignItems:'flex-end' }}>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); } }}
            placeholder="Ask about your tasks…" rows={2}
            style={{ flex:1, resize:'none', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'7px 10px', fontSize:'12px', color:'#e2e8f0', outline:'none', fontFamily:'inherit', lineHeight:1.4 }}
          />
          <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
            <button onClick={()=>{ dict.start(); setListening(true); }}
              style={{ width:'30px', height:'30px', borderRadius:'8px', background:listening?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)', border:listening?'1px solid rgba(239,68,68,0.35)':'1px solid rgba(255,255,255,0.07)', color:listening?'#f87171':'#64748b', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              🎤
            </button>
            <button onClick={send} disabled={loading||!input.trim()}
              style={{ width:'30px', height:'30px', borderRadius:'8px', background:input.trim()?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.04)', border:`1px solid ${input.trim()?'rgba(99,102,241,0.35)':'rgba(255,255,255,0.06)'}`, color:input.trim()?'#a5b4fc':'#334155', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignmentsPanel({data, setData, toasts}){
  const [modalCat, setModalCat] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [sort, setSort] = useState('smart');
  const [filter, setFilter] = useState('active');
  const [collapsed, setCollapsed] = useState({});
  const apiKey = data.settings?.apiKey || '';

  const tasks = data.assignments || [];

  const addTask = (task) => {
    setData(d=>({...d, assignments:[...(d.assignments||[]), {...task, id:uid(), createdAt:new Date().toISOString()}]}));
    toasts.push('Task added');
  };
  const updateTask = (id, patch) => {
    setData(d=>({...d, assignments:(d.assignments||[]).map(t=>t.id===id?{...t,...patch}:t)}));
  };
  const deleteTask = (id) => {
    setData(d=>({...d, assignments:(d.assignments||[]).filter(t=>t.id!==id)}));
    toasts.push('Task removed');
  };
  const toggleDone = (task) => {
    updateTask(task.id, {status: task.status==='Done' ? 'To Do' : 'Done', doneAt: task.status!=='Done' ? new Date().toISOString() : null});
  };

  const sortTasks = (arr) => {
    const a = [...arr];
    if(sort==='smart')    return a.sort((x,y)=>taskUrgencyScore(x)-taskUrgencyScore(y));
    if(sort==='due')      return a.sort((x,y)=>{ const xd=x.dueDate?new Date(x.dueDate):new Date('9999'); const yd=y.dueDate?new Date(y.dueDate):new Date('9999'); return xd-yd; });
    if(sort==='priority') return a.sort((x,y)=>({High:0,Med:1,Low:2}[x.priority]||1)-({High:0,Med:1,Low:2}[y.priority]||1));
    return a;
  };

  const visibleTasks = (cat) => {
    let t = tasks.filter(t=>t.category===cat);
    if(filter==='active') t = t.filter(t=>t.status!=='Done');
    if(filter==='done')   t = t.filter(t=>t.status==='Done');
    return sortTasks(t);
  };

  const totalActive = tasks.filter(t=>t.status!=='Done').length;
  const totalOverdue = tasks.filter(t=>t.status!=='Done' && t.dueDate && new Date(t.dueDate)<new Date()).length;

  return (
    <div style={{ display:'flex', gap:0, height:'calc(100vh - 96px)', overflow:'hidden' }}>
      {/* Left: task list */}
      <div style={{ flex:1, overflowY:'auto', paddingRight:'20px', minWidth:0 }}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-semibold">Tasks</h2>
            <div className="text-xs mt-0.5" style={{color:'#94a3b8'}}>
              {totalActive} active{totalOverdue>0 && <span style={{color:'#f87171'}}> · {totalOverdue} overdue</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded overflow-hidden border" style={{borderColor:'rgba(255,255,255,0.07)'}}>
              {['active','all','done'].map(f=>(
                <button key={f} onClick={()=>setFilter(f)}
                  className="px-3 py-1 text-xs capitalize transition-all"
                  style={{background:filter===f?'rgba(99,102,241,0.3)':'transparent', color:filter===f?'#a5b4fc':'#64748b'}}>
                  {f}
                </button>
              ))}
            </div>
            <select className="px-2 py-1 rounded text-xs border bg-transparent"
              style={{borderColor:'rgba(255,255,255,0.07)',color:'#94a3b8'}}
              value={sort} onChange={e=>setSort(e.target.value)}>
              <option value="smart">Smart sort</option>
              <option value="due">By due date</option>
              <option value="priority">By priority</option>
            </select>
          </div>
        </div>

        {/* Category sections */}
        <div className="space-y-4">
          {TASK_CATEGORIES.map(cat=>{
            const catTasks = visibleTasks(cat.id);
            const allCatTasks = tasks.filter(t=>t.category===cat.id);
            const doneCount = allCatTasks.filter(t=>t.status==='Done').length;
            const isCollapsed = collapsed[cat.id];
            return (
              <div key={cat.id} className="glass rounded border-subtle overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  style={{borderBottom: isCollapsed?'none':'1px solid rgba(255,255,255,0.05)'}}
                  onClick={()=>setCollapsed(c=>({...c,[cat.id]:!c[cat.id]}))}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{background:cat.dot}}/>
                    <span className="font-semibold text-sm">{cat.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:cat.bg, color:cat.color}}>
                      {allCatTasks.filter(t=>t.status!=='Done').length} left
                    </span>
                    {doneCount>0 && <span className="text-xs" style={{color:'#64748b'}}>{doneCount} done</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs px-2 py-1 rounded transition-all"
                      style={{background:cat.bg, color:cat.color}}
                      onClick={e=>{ e.stopPropagation(); setModalCat(cat.id); }}>
                      + Add
                    </button>
                    <span style={{color:'#475569',fontSize:'10px'}}>{isCollapsed?'▶':'▼'}</span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="divide-y" style={{borderColor:'rgba(255,255,255,0.04)'}}>
                    {catTasks.length===0 && (
                      <div className="px-4 py-5 text-xs text-center" style={{color:'#64748b'}}>
                        {filter==='done' ? 'No completed tasks' : 'No tasks — ask AI or click + Add'}
                      </div>
                    )}
                    {catTasks.map(task=>{
                      const due = formatDue(task.dueDate);
                      const pm = PRIORITY_META[task.priority] || PRIORITY_META.Med;
                      const isDone = task.status==='Done';
                      return (
                        <div key={task.id} className="group flex items-start gap-3 px-4 py-3 transition-all hover:bg-white/[0.02]">
                          <button onClick={()=>toggleDone(task)}
                            className="mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all"
                            style={{borderColor: isDone ? cat.color : 'rgba(255,255,255,0.15)', background: isDone ? cat.bg : 'transparent'}}>
                            {isDone && <span style={{color:cat.color, fontSize:'9px'}}>✓</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium leading-snug" style={{textDecoration:isDone?'line-through':'none', color:isDone?'#475569':'#e2e8f0'}}>
                                {task.title}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 font-medium"
                                style={{background:pm.bg, color:pm.color}}>
                                {pm.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {task.subject && <span className="text-xs" style={{color:'#64748b'}}>{task.subject}</span>}
                              {due && (
                                <span className="text-xs font-medium"
                                  style={{color: due.overdue?'#f87171': due.urgent?'#fbbf24':'#64748b'}}>
                                  {due.overdue && '⚠ '}{due.text}
                                </span>
                              )}
                              {task.notes && <span className="text-xs italic truncate max-w-[180px]" style={{color:'#64748b'}}>{task.notes}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            <button onClick={()=>setEditTask(task)} className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-white/10" style={{color:'#64748b'}}>✎</button>
                            <button onClick={()=>deleteTask(task.id)} className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-red-500/20" style={{color:'#64748b'}}>×</button>
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
      </div>

      {/* Right: AI chat */}
      <TasksAIChatPanel
        tasks={tasks}
        apiKey={apiKey}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        toasts={toasts}
      />

      {(modalCat||editTask) && (
        <TaskModal
          initialCat={editTask?.category || modalCat}
          task={editTask}
          onClose={()=>{ setModalCat(null); setEditTask(null); }}
          onSave={(t)=>{
            if(editTask){ updateTask(editTask.id, t); toasts.push('Task updated'); }
            else addTask(t);
            setModalCat(null); setEditTask(null);
          }}
        />
      )}
    </div>
  );
}

function TaskModal({initialCat, task, onClose, onSave}){
  const [title,    setTitle]    = useState(task?.title    || '');
  const [category, setCategory] = useState(task?.category || initialCat || 'classroom');
  const [subject,  setSubject]  = useState(task?.subject  || '');
  const [priority, setPriority] = useState(task?.priority || 'Med');
  const [dueDate,  setDueDate]  = useState(task?.dueDate  || '');
  const [status,   setStatus]   = useState(task?.status   || 'To Do');
  const [notes,    setNotes]    = useState(task?.notes    || '');

  const subjectLabel = category==='classroom' ? 'Class / Course' : category==='extracurricular' ? 'Activity / Club' : 'Area of Life';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="glass rounded-xl z-50 w-full max-w-md p-5 space-y-4" style={{border:'1px solid rgba(255,255,255,0.08)'}}>
        <h3 className="font-semibold">{task ? 'Edit Task' : 'New Task'}</h3>

        <input className="w-full p-2.5 bg-transparent border border-white/5 rounded-lg text-sm focus:outline-none focus:border-indigo-500/50"
          placeholder="Task title" value={title} onChange={e=>setTitle(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter' && title.trim()) onSave({title,category,subject,priority,dueDate,status,notes}); }} autoFocus />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{color:'#64748b'}}>Category</label>
            <select className="w-full p-2 bg-transparent border border-white/5 rounded-lg text-sm"
              value={category} onChange={e=>setCategory(e.target.value)}>
              {TASK_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{color:'#64748b'}}>Priority</label>
            <select className="w-full p-2 bg-transparent border border-white/5 rounded-lg text-sm"
              value={priority} onChange={e=>setPriority(e.target.value)}>
              <option value="High">High</option>
              <option value="Med">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{color:'#64748b'}}>{subjectLabel}</label>
            <input className="w-full p-2 bg-transparent border border-white/5 rounded-lg text-sm"
              placeholder="Optional" value={subject} onChange={e=>setSubject(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{color:'#64748b'}}>Due Date</label>
            <input type="date" className="w-full p-2 bg-transparent border border-white/5 rounded-lg text-sm"
              style={{colorScheme:'dark'}} value={dueDate} onChange={e=>setDueDate(e.target.value)} />
          </div>
          {task && (
            <div className="col-span-2">
              <label className="block text-xs mb-1" style={{color:'#64748b'}}>Status</label>
              <select className="w-full p-2 bg-transparent border border-white/5 rounded-lg text-sm"
                value={status} onChange={e=>setStatus(e.target.value)}>
                <option>To Do</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>
            </div>
          )}
          <div className="col-span-2">
            <label className="block text-xs mb-1" style={{color:'#64748b'}}>Notes</label>
            <textarea className="w-full p-2 bg-transparent border border-white/5 rounded-lg text-sm resize-none"
              rows={2} placeholder="Optional notes…" value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button className="px-3 py-1.5 rounded-lg text-sm" style={{background:'rgba(255,255,255,0.05)'}} onClick={onClose}>Cancel</button>
          <button className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white"
            onClick={()=>{ if(title.trim()) onSave({title,category,subject,priority,dueDate,status,notes}); }}>
            {task ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Tasks Voice Assistant -------------------- */
function parseTaskFromSpeech(raw){
  const t = raw.toLowerCase();

  // --- Title: strip add-task trigger words ---
  let title = raw
    .replace(/^(add|create|new|log|make|put|i (want|need) to add|remind me to|add a task|add a new task)\s+/i,'')
    .replace(/\b(to my (tasks|list|to-do)|on my (list|tasks))\b/gi,'')
    .trim();

  // --- Category ---
  // Explicit "to personal/classroom/extracurricular tasks" overrides keyword detection
  let category = 'personal';
  if(/(to|in|for)\s+(my\s+)?personal\s+(tasks?|list|to-?do)/i.test(t)) category = 'personal';
  else if(/(to|in|for)\s+(my\s+)?classroom\s+(tasks?|list|to-?do)/i.test(t)) category = 'classroom';
  else if(/(to|in|for)\s+(my\s+)?extracurricular\s+(tasks?|list|to-?do)/i.test(t)) category = 'extracurricular';
  else if(/(class|course|homework|assignment|lecture|exam|essay|quiz|problem set|school|study)/i.test(t)) category = 'classroom';
  else if(/(club|sport|extracurricular|activity|practice|rehearsal|team|meet)/i.test(t)) category = 'extracurricular';

  // Strip "to [category] tasks/list" from title
  title = title
    .replace(/\bto\s+(my\s+)?(personal|classroom|extracurricular)\s+(tasks?|list|to-?do)\b/gi,'')
    .replace(/\s{2,}/g,' ').trim();

  // --- Priority ---
  let priority = 'Med';
  if(/(high priority|urgent|important|critical|asap)/i.test(t)) priority = 'High';
  else if(/(low priority|whenever|not urgent|easy)/i.test(t)) priority = 'Low';

  // Strip priority phrases from title
  title = title.replace(/,?\s*(high|low|medium|med)\s+priority/gi,'').trim();

  // --- Due date ---
  let dueDate = null;
  const now = new Date();
  const addDays = (n) => { const d = new Date(now); d.setDate(d.getDate()+n); return d.toISOString().split('T')[0]; };
  if(/\btoday\b/.test(t))    dueDate = addDays(0);
  if(/\btomorrow\b/.test(t)) dueDate = addDays(1);
  const thisWeekday = t.match(/\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  const nextWeekday = t.match(/\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  const dayMap = {monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:0};
  if(thisWeekday || nextWeekday){
    const match = thisWeekday || nextWeekday;
    const targetDay = dayMap[(match[2]||match[1]).toLowerCase()];
    const diff = ((targetDay - now.getDay()) + 7) % 7 || (nextWeekday?7:0);
    dueDate = addDays(diff||7);
  }
  // "by Friday the 20th" / "by the 15th" / "March 15"
  const monthMatch = t.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})\b/i);
  if(monthMatch){
    const months={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
    const mo = months[monthMatch[1].slice(0,3).toLowerCase()];
    const day2 = parseInt(monthMatch[2],10);
    const yr = new Date(now.getFullYear(), mo, day2) < now ? now.getFullYear()+1 : now.getFullYear();
    dueDate = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day2).padStart(2,'0')}`;
  }
  // Strip date phrases from title
  title = title
    .replace(/\b(by|due|on|this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)\b/gi,'')
    .replace(/\bby\s+(the\s+)?\d{1,2}(st|nd|rd|th)?\b/gi,'')
    .replace(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}/gi,'')
    .replace(/,?\s*(high|low|medium|med|urgent|important)\s*/gi,' ')
    .replace(/\s{2,}/g,' ').trim();

  // --- Subject (classroom only) ---
  let subject = 'Other';
  const subjMatch = t.match(/\bfor\s+([a-z ]+?)(?:\s+(?:class|course|by|due|on|this|next|today|tomorrow)|$)/i);
  if(category==='classroom' && subjMatch) subject = subjMatch[1].trim().replace(/\b\w/g,c=>c.toUpperCase());

  return { title: title || raw.trim(), category, priority, dueDate, subject, status:'To Do' };
}

function TasksAssistant({tasks, sort, setSort, filter, setFilter, onAddTask, onEditTask, onDeleteTask, toasts}){
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [lastCmd, setLastCmd] = useState('');
  const {speaking, speak, cancel} = useSpeaker();
  const isMobile = useIsMobile();

  const dueLabelFor = (task) => {
    const d = formatDue(task.dueDate);
    return d ? d.text : 'no due date';
  };

  const readList = (taskList, intro) => {
    if(!taskList.length){ speak(intro+' No tasks found.'); return; }
    const sorted = [...taskList].sort((a,b)=>taskUrgencyScore(a)-taskUrgencyScore(b));
    const lines = sorted.map((t,i)=>{
      const parts = [`${t.title}`];
      if(t.subject) parts.push(t.subject);
      parts.push(`${(t.priority||'Med').toLowerCase()} priority`);
      if(t.dueDate) parts.push(dueLabelFor(t));
      return parts.join(', ');
    });
    speak(`${intro} ${sorted.length} task${sorted.length>1?'s':''}. ${lines.join('. ')}.`);
  };

  const processCommand = (raw) => {
    setLastCmd(raw);
    const t = raw.toLowerCase();
    const active = tasks.filter(x=>x.status!=='Done');
    const now = new Date();

    // Add task
    if(/^(add|create|new|log|make|i (want|need) to add|remind me to)\b/i.test(t)){
      const task = parseTaskFromSpeech(raw);
      if(task.title.length > 1){
        onAddTask(task);
        let conf = `Added "${task.title}" to ${task.category} tasks`;
        if(task.priority==='High') conf += ', high priority';
        if(task.dueDate) conf += `, due ${new Date(task.dueDate+'T12:00:00').toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}`;
        speak(conf+'.');
      } else {
        speak('Please say the task name after "add".');
      }
      return;
    }

    // Sort
    if(/sort.*(priority|important)/.test(t))   { setSort('priority'); speak('Sorted by priority.'); return; }
    if(/sort.*(due|date|deadline)/.test(t))     { setSort('due');      speak('Sorted by due date.'); return; }
    if(/smart sort|sort smart|best order/.test(t)){ setSort('smart');  speak('Using smart sort.'); return; }

    // Filter
    if(/show.*(done|complete|finish)/.test(t))  { setFilter('done');   speak('Showing completed tasks.'); return; }
    if(/show.*(active|pending|todo|open)/.test(t)){ setFilter('active'); speak('Showing active tasks.'); return; }
    if(/show all/.test(t))                      { setFilter('all');    speak('Showing all tasks.'); return; }

    // Overdue
    if(/overdue|late|past due|behind/.test(t)){
      const od = active.filter(x=>x.dueDate && new Date(x.dueDate)<now);
      readList(od, od.length===0 ? '' : 'You have');
      if(!od.length) speak('No overdue tasks. You\'re all caught up.');
      return;
    }

    // Due today
    if(/today|due today/.test(t)){
      const todayEnd = new Date(now); todayEnd.setHours(23,59,59);
      const todayStart = new Date(now); todayStart.setHours(0,0,0);
      const tod = active.filter(x=>x.dueDate&&new Date(x.dueDate)>=todayStart&&new Date(x.dueDate)<=todayEnd);
      readList(tod, tod.length===0 ? '' : 'Due today:');
      if(!tod.length) speak('Nothing due today.');
      return;
    }

    // Due this week
    if(/this week|week/.test(t)){
      const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate()+7);
      const week = active.filter(x=>x.dueDate&&new Date(x.dueDate)<=weekEnd&&new Date(x.dueDate)>=now);
      readList(week, `Due this week:`);
      return;
    }

    // High priority
    if(/high priority|urgent|important/.test(t)){
      readList(active.filter(x=>x.priority==='High'), 'High priority tasks:');
      return;
    }

    // Clear tasks by category (must run before category-read block)
    if(/\b(clear|delete|remove|wipe)\b.*\b(task|tasks)\b/i.test(t) || /\bclear\s+all\b/i.test(t)){
      let catFilter = null;
      if(/personal|life|errand/i.test(t)) catFilter = 'personal';
      else if(/classroom|class|school|homework|course/i.test(t)) catFilter = 'classroom';
      else if(/extracurricular|club|activity|sport|extra/i.test(t)) catFilter = 'extracurricular';
      const toRemove = catFilter ? tasks.filter(x=>x.category===catFilter) : active;
      if(toRemove.length){
        toRemove.forEach(x=>onDeleteTask && onDeleteTask(x.id));
        speak(`Cleared ${toRemove.length} ${catFilter||'active'} task${toRemove.length>1?'s':''}.`);
      } else {
        speak(`No ${catFilter||'active'} tasks to clear.`);
      }
      return;
    }

    // Move task to a different category
    const moveRe = raw.match(/\b(?:move|change|put|transfer|switch)\s+(?:task\s+)?(.+?)\s+to\s+(personal|classroom|extracurricular)\b/i);
    if(moveRe){
      const titleFrag = moveRe[1].replace(/^["']|["']$/g,'').trim().toLowerCase();
      const targetCat = moveRe[2].toLowerCase();
      const found = tasks.find(x=>x.title.toLowerCase().includes(titleFrag));
      if(found){
        onEditTask && onEditTask(found.id, {...found, category: targetCat});
        speak(`Moved "${found.title}" to ${targetCat} tasks.`);
      } else {
        speak(`Couldn't find a task matching "${titleFrag}".`);
      }
      return;
    }

    // Category reads
    if(/classroom|class|school|course|homework|assignment/.test(t)){
      readList(active.filter(x=>x.category==='classroom'), 'Classroom tasks:'); return;
    }
    if(/extracurricular|club|activity|sport|extra/.test(t)){
      readList(active.filter(x=>x.category==='extracurricular'), 'Extracurricular tasks:'); return;
    }
    if(/personal|life|errand|habit/.test(t)){
      readList(active.filter(x=>x.category==='personal'), 'Personal tasks:'); return;
    }

    // Summary / read all
    if(/read|list|what|summary|how many|tell me|tasks/.test(t)){
      if(!active.length){ speak('You have no active tasks right now.'); return; }
      const od = active.filter(x=>x.dueDate&&new Date(x.dueDate)<now).length;
      const bycat = TASK_CATEGORIES.map(c=>{
        const n = active.filter(x=>x.category===c.id).length;
        return n ? `${n} ${c.id}` : '';
      }).filter(Boolean).join(', ');
      const most = [...active].sort((a,b)=>taskUrgencyScore(a)-taskUrgencyScore(b))[0];
      let msg = `You have ${active.length} active task${active.length>1?'s':''}: ${bycat}. `;
      if(od) msg += `${od} are overdue. `;
      if(most) msg += `Most urgent is ${most.title}${most.dueDate?', '+dueLabelFor(most):''}. `;
      speak(msg);
      return;
    }

    speak('Try saying: read my tasks, read classroom tasks, what\'s overdue, due today, sort by priority, or show done.');
  };

  const dict = useDictation((transcript)=>{ setListening(false); processCommand(transcript); });
  const startListening = ()=>{ cancel(); dict.start(); setListening(true); };

  return (
    <div className="fixed z-40 flex flex-col items-end gap-2" style={{bottom: isMobile?'90px':'24px', right:'24px'}}>
      {open && (
        <div className="glass rounded-xl p-4 mb-1" style={{width:'280px',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm">Task Assistant</span>
            <button onClick={()=>setOpen(false)} style={{color:'#64748b',fontSize:'18px',lineHeight:1}}>×</button>
          </div>
          {lastCmd && (
            <div className="text-xs px-2 py-1.5 rounded mb-3 italic" style={{background:'rgba(255,255,255,0.04)',color:'#64748b'}}>
              "{lastCmd}"
            </div>
          )}
          <div className="text-xs mb-3 leading-relaxed" style={{color:'#475569'}}>
            Say: <span style={{color:'#818cf8'}}>"add finish essay high priority"</span>, <span style={{color:'#818cf8'}}>"read my tasks"</span>, <span style={{color:'#818cf8'}}>"what's overdue"</span>, <span style={{color:'#818cf8'}}>"sort by priority"</span>
          </div>
          {speaking ? (
            <button onClick={cancel} className="w-full py-2 rounded-lg text-sm font-medium"
              style={{background:'rgba(248,113,113,0.15)',color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
              ■ Stop speaking
            </button>
          ) : (
            <button onClick={startListening} className="w-full py-2 rounded-lg text-sm font-medium transition-all"
              style={{background:listening?'rgba(239,68,68,0.2)':'rgba(99,102,241,0.15)',
                      color:listening?'#fca5a5':'#818cf8',
                      border:listening?'1px solid rgba(239,68,68,0.5)':'1px solid rgba(99,102,241,0.3)',
                      boxShadow:listening?'0 0 0 3px rgba(239,68,68,0.15)':'none'}}>
              {listening ? '● Listening…' : '🎤 Speak a command'}
            </button>
          )}
        </div>
      )}
      <div style={{position:'relative'}}>
        {listening && (
          <span style={{position:'absolute',inset:0,borderRadius:'50%',background:'rgba(239,68,68,0.35)',
            animation:'pulse 1s ease-in-out infinite',pointerEvents:'none'}}/>
        )}
        <button onClick={()=>setOpen(o=>!o)}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{background: listening?'rgba(239,68,68,0.85)':open?'rgba(99,102,241,0.4)':'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  border:listening?'1px solid rgba(239,68,68,0.6)':'1px solid rgba(99,102,241,0.4)',
                  boxShadow:listening?'0 4px 20px rgba(239,68,68,0.45)':'0 4px 20px rgba(99,102,241,0.35)',
                  fontSize:'20px',position:'relative',zIndex:1}}>
          {listening ? '●' : open ? '×' : '🎤'}
        </button>
      </div>
    </div>
  );
}

/* -------------------- §3 Quick Capture Modal -------------------- */
function QuickCaptureModal({onClose, data, setData, toasts}){
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const dict = useDictation(t=>{ setText(prev=>prev?prev+' '+t:t); setListening(false); });

  useEffect(()=>{ inputRef.current?.focus(); },[]);

  const save = ()=>{
    if(!text.trim()) return;
    const item = {id:uid(), text:text.trim(), createdAt:new Date().toISOString(), source:'text'};
    setData(d=>({...d, inbox:[...(d.inbox||[]), item]}));
    toasts.push('Captured to inbox');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="glass rounded-2xl z-50 w-full max-w-lg p-5 space-y-4" style={{border:'1px solid rgba(255,255,255,0.1)'}}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-base">Quick Capture</div>
            <div className="text-xs mt-0.5" style={{color:'#64748b'}}>Press C anywhere to open · Enter to save</div>
          </div>
          <button onClick={onClose} style={{color:'#64748b',fontSize:'20px',lineHeight:1}}>×</button>
        </div>
        <textarea ref={inputRef} value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); save(); } if(e.key==='Escape') onClose(); }}
          placeholder="Capture anything — task, idea, note, event…"
          rows={3} style={{width:'100%',resize:'none',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'10px',fontSize:'14px',color:'#e2e8f0',outline:'none',fontFamily:'inherit',lineHeight:1.5}}
        />
        <div className="flex items-center gap-2 justify-between">
          {HAS_SPEECH_API ? (
            <button onClick={()=>{ dict.start(); setListening(true); }}
              style={{padding:'8px 14px',borderRadius:'8px',background:listening?'rgba(239,68,68,0.18)':'rgba(255,255,255,0.05)',border:listening?'1px solid rgba(239,68,68,0.35)':'1px solid rgba(255,255,255,0.08)',color:listening?'#f87171':'#64748b',fontSize:'13px',display:'flex',alignItems:'center',gap:'6px'}}>
              🎤 {listening?'Listening…':'Voice'}
            </button>
          ) : (
            <div/>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} style={{padding:'8px 16px',borderRadius:'8px',background:'rgba(255,255,255,0.05)',color:'#94a3b8',fontSize:'13px'}}>Cancel</button>
            <button onClick={save} disabled={!text.trim()}
              style={{padding:'8px 20px',borderRadius:'8px',background:text.trim()?'linear-gradient(90deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.06)',color:text.trim()?'#fff':'#334155',fontSize:'13px',fontWeight:600}}>
              Capture →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- §3 Inbox Panel -------------------- */
const INBOX_TRIAGE = [
  {label:'Task',    color:'#6366f1', bg:'rgba(99,102,241,0.15)',  key:'task'},
  {label:'Note',    color:'#10b981', bg:'rgba(16,185,129,0.15)',  key:'note'},
  {label:'Journal', color:'#8b5cf6', bg:'rgba(139,92,246,0.15)', key:'journal'},
  {label:'Event',   color:'#f59e0b', bg:'rgba(245,158,11,0.15)', key:'event'},
  {label:'Contact', color:'#3b82f6', bg:'rgba(59,130,246,0.15)', key:'contact'},
];

function InboxPanel({data, setData, toasts, isMobile, setActive}){
  const [triaging, setTriaging] = useState(null); // {item, action}
  const inbox = data.inbox || [];

  const removeItem = (id)=> setData(d=>({...d, inbox:(d.inbox||[]).filter(i=>i.id!==id)}));

  const triage = (item, key)=>{
    const text = item.text;
    if(key==='task'){
      setData(d=>({...d, assignments:[...(d.assignments||[]),{id:uid(),title:text,category:'personal',priority:'Med',status:'To Do',createdAt:new Date().toISOString()}]}));
      toasts.push('Added to Tasks');
    } else if(key==='note'){
      setData(d=>({...d, notes:[...(d.notes||[]),{id:uid(),title:text.slice(0,60),body:text,tags:[],createdAt:new Date().toISOString()}]}));
      toasts.push('Added to Notes');
    } else if(key==='journal'){
      setData(d=>({...d, journals:[...(d.journals||[]),{id:uid(),date:new Date().toISOString().slice(0,10),body:text,tags:[],createdAt:new Date().toISOString()}]}));
      toasts.push('Added to Journal');
    } else if(key==='event'){
      setData(d=>({...d, events:[...(d.events||[]),{id:uid(),title:text.slice(0,80),type:'Personal',notes:text,when:{day:new Date().getDay(),hour:9}}]}));
      toasts.push('Added to Calendar');
    } else if(key==='contact'){
      const existing = d=>d.social||[];
      setData(d=>({...d, social:[...existing(d),{id:uid(),name:text.slice(0,60),notes:text,createdAt:new Date().toISOString()}]}));
      toasts.push('Added to Contacts');
    }
    removeItem(item.id);
  };

  const staleThreshold = 48*3600*1000;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold">Inbox</h2>
          <div className="text-xs mt-0.5" style={{color:'#64748b'}}>{inbox.length} item{inbox.length!==1?'s':''} · press <kbd style={{background:'rgba(255,255,255,0.07)',borderRadius:'4px',padding:'1px 5px',fontSize:'11px',fontFamily:'monospace'}}>C</kbd> anywhere to capture</div>
        </div>
      </div>

      {inbox.length===0 && (
        <div className="glass rounded-xl p-10 text-center border-subtle">
          <div style={{fontSize:'32px',marginBottom:'12px'}}>📥</div>
          <div style={{color:'#64748b',fontSize:'14px'}}>Inbox is clear</div>
          <div style={{color:'#334155',fontSize:'12px',marginTop:'4px'}}>Press C to capture anything — tasks, ideas, notes, events</div>
        </div>
      )}

      <div className="space-y-3">
        {[...inbox].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(item=>{
          const age = Date.now()-new Date(item.createdAt).getTime();
          const stale = age > staleThreshold;
          const ageLabel = age<3600000 ? 'just now' : age<86400000 ? `${Math.floor(age/3600000)}h ago` : `${Math.floor(age/86400000)}d ago`;
          return (
            <div key={item.id} className="glass rounded-xl border-subtle p-4" style={{borderLeft:stale?'3px solid #f59e0b':undefined}}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-relaxed" style={{color:'#e2e8f0',whiteSpace:'pre-wrap'}}>{item.text}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs" style={{color:stale?'#fbbf24':'#475569'}}>{ageLabel}{stale?' · needs triage':''}</span>
                  </div>
                  {/* Triage buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {INBOX_TRIAGE.map(t=>(
                      <button key={t.key} onClick={()=>triage(item, t.key)}
                        className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                        style={{background:t.bg,color:t.color,border:`1px solid ${t.color}22`}}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={()=>removeItem(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-red-500/20" style={{color:'#475569',fontSize:'16px'}}>×</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- Gym Panel -------------------- */
function GymPanel({data, setData, toasts}){
  const [logOpen, setLogOpen] = useState(false);
  const addLog = (entry)=>{ setData(d=> ({ ...d, workouts:[...(d.workouts||[]), {...entry,id:uid()}] })); toasts.push('Workout logged'); };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Gym & Fitness</h2>
        <div>
          <button className="px-3 py-1 rounded bg-emerald-600" onClick={()=>setLogOpen(true)}>Log Workout</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4 rounded border-subtle">{/* Log */}
          <h3 className="font-semibold mb-2">Log</h3>
          {(data.workouts||[]).slice().reverse().map(w=> (
            <div key={w.id} className="p-2 border-b border-white/3">{w.name}  -  {w.exercises?.length||0} exercises</div>
          ))}
        </div>
        <div className="glass p-4 rounded border-subtle">{/* Program */}
          <h3 className="font-semibold mb-2">Program</h3>
          <div className="text-sm opacity-80">Push / Pull / Legs / Rest template</div>
        </div>
        <div className="glass p-4 rounded border-subtle">{/* Progress */}
          <h3 className="font-semibold mb-2">Progress</h3>
          <div className="text-sm opacity-80">Simple SVG charts show here</div>
        </div>
      </div>

      {logOpen && <WorkoutModal onClose={()=>setLogOpen(false)} onSave={(w)=>{ addLog(w); setLogOpen(false); }} />}
    </div>
  );
}

function WorkoutModal({onClose, onSave}){
  const [name, setName] = useState('Workout');
  const [exercises, setExercises] = useState([{id:uid(), name:'Bench Press', sets:4, reps:8, weight:135}]);
  const addEx = ()=> setExercises(s=>[...s, {id:uid(),name:'',sets:3,reps:10,weight:0}]);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="glass p-4 rounded z-50 w-96 max-h-[80vh] overflow-auto">
        <h3 className="font-semibold mb-2">Log Workout</h3>
        <input className="w-full p-2 mb-2 bg-transparent border border-white/5 rounded" value={name} onChange={e=>setName(e.target.value)} />
        <div className="flex flex-col gap-2">
          {exercises.map((ex,idx)=> (
            <div key={ex.id} className="p-2 border rounded">
              <input className="w-full p-1 mb-1 bg-transparent border border-white/5 rounded" placeholder="Exercise" value={ex.name} onChange={e=>{ const v=e.target.value; setExercises(s=>s.map(x=>x.id===ex.id?{...x,name:v}:x)); }} />
              <div className="flex gap-2 text-xs">
                <input className="p-1 w-1/3 bg-transparent border border-white/5 rounded" value={ex.sets} onChange={e=>setExercises(s=>s.map(x=>x.id===ex.id?{...x,sets:e.target.value}:x))} />
                <input className="p-1 w-1/3 bg-transparent border border-white/5 rounded" value={ex.reps} onChange={e=>setExercises(s=>s.map(x=>x.id===ex.id?{...x,reps:e.target.value}:x))} />
                <input className="p-1 w-1/3 bg-transparent border border-white/5 rounded" value={ex.weight} onChange={e=>setExercises(s=>s.map(x=>x.id===ex.id?{...x,weight:e.target.value}:x))} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <button className="px-3 py-1 rounded" onClick={addEx}>Add Exercise</button>
          <div className="flex-1" />
          <button className="px-3 py-1 rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1 rounded bg-emerald-600" onClick={()=>onSave({name,exercises,date:new Date().toISOString()})}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Social Panel -------------------- */
function SocialPanel({data, setData, toasts}){
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Social</h2>
        <div>
          <button className="px-3 py-1 rounded bg-purple-600" onClick={()=>setOpen(true)}>New Event</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4 rounded border-subtle">Events</div>
        <div className="glass p-4 rounded border-subtle">People</div>
        <div className="glass p-4 rounded border-subtle">Reminders</div>
      </div>
      {open && <SocialModal onClose={()=>setOpen(false)} onSave={(e)=>{ setData(d=>({...d, social:[...(d.social||[]), {...e,id:uid()}]})); toasts.push('Social event added'); setOpen(false); }} />}
    </div>
  );
}

function SocialModal({onClose, onSave}){
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [place, setPlace] = useState('');
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="glass p-4 rounded z-50 w-96">
        <h3 className="font-semibold mb-2">New Social Event</h3>
        <input className="w-full p-2 mb-2 bg-transparent border border-white/5 rounded" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="w-full p-2 mb-2 bg-transparent border border-white/5 rounded" placeholder="Date" value={date} onChange={e=>setDate(e.target.value)} />
        <input className="w-full p-2 mb-2 bg-transparent border border-white/5 rounded" placeholder="Place" value={place} onChange={e=>setPlace(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1 rounded bg-purple-600" onClick={()=>onSave({title,date,place})}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Notes / Journal / Habits Panel -------------------- */
function NotesPanel({data, setData, toasts}){
  const [subtab, setSubtab] = useState('notes');
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Notes</h2>
        <div className="flex gap-2">
          {[['notes','Notes'],['journal','Journal'],['habits','Habits'],['planner','Life Planner']].map(([t,label])=> (
            <button key={t} className={`px-3 py-1 rounded ${subtab===t?'bg-white/10':'hover:bg-white/3'}`} onClick={()=>setSubtab(t)}>{label}</button>
          ))}
        </div>
      </div>
      {subtab==='notes'   && <NotesSubtab        data={data} setData={setData} toasts={toasts} />}
      {subtab==='journal' && <JournalSubtab       data={data} setData={setData} toasts={toasts} />}
      {subtab==='habits'  && <HabitsSubtab        data={data} setData={setData} toasts={toasts} />}
      {subtab==='planner' && <LifePlannerSubtab   data={data} setData={setData} toasts={toasts} />}
    </div>
  );
}

function NotesSubtab({data, setData, toasts}){
  const notes = data.notes || [];
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null); // note id
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('');

  function openAdd(){ setTitle(''); setBody(''); setTag(''); setEditing(null); setShowAdd(true); }
  function openEdit(n){ setTitle(n.title); setBody(n.body); setTag(n.tag||''); setEditing(n.id); setShowAdd(true); }
  function save(){
    if(!title.trim()) return;
    if(editing){
      setData(d=>({...d, notes:(d.notes||[]).map(n=>n.id===editing?{...n,title,body,tag,updatedAt:new Date().toISOString()}:n)}));
      toasts.push('Note updated');
    } else {
      setData(d=>({...d, notes:[...(d.notes||[]), {id:uid(),title,body,tag,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}]}));
      toasts.push('Note saved');
    }
    setShowAdd(false);
  }
  function remove(id){ setData(d=>({...d, notes:(d.notes||[]).filter(n=>n.id!==id)})); toasts.push('Note deleted'); }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button className="px-3 py-1 rounded bg-indigo-600" onClick={openAdd}>+ New Note</button>
      </div>
      {notes.length===0 && <div className="text-center opacity-50 mt-12">No notes yet  -  create one above.</div>}
      <div className="grid grid-cols-3 gap-4">
        {notes.slice().reverse().map(n=> (
          <div key={n.id} className="glass p-4 rounded border-subtle group relative">
            {n.tag && <div className="text-xs px-2 py-0.5 rounded-full bg-indigo-700/50 w-fit mb-2">{n.tag}</div>}
            <div className="font-medium mb-1">{n.title}</div>
            <div className="text-sm opacity-70 whitespace-pre-wrap line-clamp-5">{n.body}</div>
            <div className="text-xs opacity-40 mt-2">{new Date(n.updatedAt).toLocaleDateString()}</div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
              <button className="px-2 py-0.5 rounded text-xs hover:bg-white/10" onClick={()=>openEdit(n)}>Edit</button>
              <button className="px-2 py-0.5 rounded text-xs hover:bg-red-700/40" onClick={()=>remove(n.id)}>×</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setShowAdd(false)}></div>
          <div className="glass p-5 rounded z-50 w-[560px] flex flex-col gap-3">
            <h3 className="font-semibold">{editing?'Edit Note':'New Note'}</h3>
            <input className="w-full p-2 bg-transparent border border-white/10 rounded" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
            <input className="w-full p-2 bg-transparent border border-white/10 rounded text-sm" placeholder="Tag (optional)" value={tag} onChange={e=>setTag(e.target.value)} />
            <textarea className="w-full p-2 bg-transparent border border-white/10 rounded text-sm" rows={8} placeholder="Write your note..." value={body} onChange={e=>setBody(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded" onClick={()=>setShowAdd(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-indigo-600" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Knowledge Graph Helpers ----
const SIMILARITY_THRESHOLD = 0.28;

function simpleHash(str){
  let h=5381;
  for(let i=0;i<str.length;i++) h=(h*33^str.charCodeAt(i))>>>0;
  return h.toString(16);
}

function cosineSim(a,b){
  let dot=0,na=0,nb=0;
  for(let i=0;i<a.length;i++){dot+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}
  return(na&&nb)?dot/Math.sqrt(na*nb):0;
}

function buildTFIDF(entries){
  const STOP=new Set(['the','and','for','that','this','with','have','from','but','are','was','were','been','has','had','will','would','could','should','its','their','they','them','then','than','when','what','which','who','how','not','can','all','out','into','our','you','your','about','more','just','also','time','some','like','very','only','even','any','there','one','two']);
  const tok=t=>t.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>2&&!STOP.has(w));
  const docs=entries.map(e=>tok(e.body));
  const N=docs.length;
  const df={};
  docs.forEach(d=>{new Set(d).forEach(w=>{df[w]=(df[w]||0)+1;});});
  const vocab=Object.keys(df).filter(w=>df[w]<N);
  const vmap={};vocab.forEach((w,i)=>vmap[w]=i);
  return entries.map((_,ei)=>{
    const tf={};docs[ei].forEach(w=>{tf[w]=(tf[w]||0)+1;});
    const n=docs[ei].length||1;
    const vec=new Array(vocab.length).fill(0);
    Object.entries(tf).forEach(([w,c])=>{if(vmap[w]!==undefined)vec[vmap[w]]=c/n*Math.log((N+1)/(df[w]||1));});
    return vec;
  });
}

async function fetchVoyageEmbeddings(texts,key){
  const res=await fetch('https://api.voyageai.com/v1/embeddings',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
    body:JSON.stringify({input:texts,model:'voyage-3'})
  });
  if(!res.ok) throw new Error('Voyage error '+res.status);
  const d=await res.json();
  return d.data.map(x=>x.embedding);
}

function computeConnections(entries,threshold){
  const th=threshold??SIMILARITY_THRESHOLD;
  const result=entries.map(e=>({...e,connections:[]}));
  for(let i=0;i<result.length;i++){
    for(let j=i+1;j<result.length;j++){
      const ei=result[i],ej=result[j];
      if(!ei.embedding||!ej.embedding) continue;
      const s=cosineSim(ei.embedding,ej.embedding);
      if(s>=th){
        result[i].connections.push({id:ej.id,sim:s,type:'semantic'});
        result[j].connections.push({id:ei.id,sim:s,type:'semantic'});
      }
    }
  }
  result.forEach((ei,i)=>{
    const ta=ei.tags||[];
    if(!ta.length) return;
    result.forEach((ej,j)=>{
      if(i>=j) return;
      const shared=ta.filter(t=>(ej.tags||[]).includes(t));
      if(!shared.length) return;
      const ai=result[i].connections.find(c=>c.id===ej.id);
      const aj=result[j].connections.find(c=>c.id===ei.id);
      if(!ai) result[i].connections.push({id:ej.id,sim:0.5,type:'tag',sharedTags:shared});
      else ai.sharedTags=shared;
      if(!aj) result[j].connections.push({id:ei.id,sim:0.5,type:'tag',sharedTags:shared});
      else aj.sharedTags=shared;
    });
  });
  return result;
}

// ---- Canvas Force-Graph ----
function JournalGraph({entries, selectedId, onSelect, onUpdatePositions}){
  const canvasRef=useRef(null);
  const stRef=useRef({nodes:[],edges:[],dragIdx:-1,dragging:false,animId:null,dragStartX:0,dragStartY:0});

  function buildSim(canvas){
    const W=canvas.width,H=canvas.height;
    const old=stRef.current.nodes;
    stRef.current.nodes=entries.map(e=>{
      const prev=old.find(n=>n.id===e.id);
      return {id:e.id,label:e.date,x:e.position?.x??prev?.x??(W/2+(Math.random()-.5)*220),y:e.position?.y??prev?.y??(H/2+(Math.random()-.5)*180),vx:0,vy:0};
    });
    const edges=[];
    entries.forEach((e,i)=>{
      (e.connections||[]).forEach(c=>{
        const j=entries.findIndex(f=>f.id===c.id);
        if(j>i) edges.push({a:i,b:j,sim:c.sim,type:c.type});
      });
    });
    stRef.current.edges=edges;
  }

  function redraw(canvas){
    const ctx=canvas.getContext('2d');
    const {nodes,edges}=stRef.current;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.setLineDash([]);
    edges.forEach(({a,b,sim,type})=>{
      const na=nodes[a],nb=nodes[b];
      ctx.beginPath();ctx.moveTo(na.x,na.y);ctx.lineTo(nb.x,nb.y);
      if(type==='tag'){ctx.strokeStyle='rgba(251,191,36,0.4)';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);}
      else{ctx.strokeStyle=`rgba(99,102,241,${Math.min(0.85,0.15+sim*0.7)})`;ctx.lineWidth=0.5+sim*2;ctx.setLineDash([]);}
      ctx.stroke();
    });
    ctx.setLineDash([]);
    nodes.forEach(n=>{
      const sel=n.id===selectedId;
      const r=20;
      if(sel){ctx.beginPath();ctx.arc(n.x,n.y,r+7,0,Math.PI*2);ctx.fillStyle='rgba(99,102,241,0.18)';ctx.fill();}
      ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);
      const g=ctx.createRadialGradient(n.x-4,n.y-4,2,n.x,n.y,r);
      if(sel){g.addColorStop(0,'#818cf8');g.addColorStop(1,'#4f46e5');}
      else{g.addColorStop(0,'#22223a');g.addColorStop(1,'#111118');}
      ctx.fillStyle=g;ctx.fill();
      ctx.strokeStyle=sel?'#6366f1':'rgba(255,255,255,0.14)';ctx.lineWidth=sel?2:1;ctx.stroke();
      ctx.fillStyle='rgba(226,232,240,0.8)';ctx.font='9px Inter,sans-serif';ctx.textAlign='center';
      ctx.fillText(n.label.slice(5),n.x,n.y+r+13);
    });
  }

  function runTick(canvas,iter,maxIter){
    const {nodes,edges}=stRef.current;
    const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2;
    nodes.forEach(n=>{n.fx=0;n.fy=0;});
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const dx=nodes[j].x-nodes[i].x,dy=nodes[j].y-nodes[i].y;
        const d2=Math.max(dx*dx+dy*dy,1),d=Math.sqrt(d2),f=3200/d2;
        nodes[i].fx-=f*dx/d;nodes[i].fy-=f*dy/d;
        nodes[j].fx+=f*dx/d;nodes[j].fy+=f*dy/d;
      }
    }
    edges.forEach(({a,b,sim})=>{
      const na=nodes[a],nb=nodes[b];
      const dx=nb.x-na.x,dy=nb.y-na.y,d=Math.sqrt(dx*dx+dy*dy)||1;
      const len=70+90*(1-Math.min(sim,1)),f=(d-len)*0.045;
      na.fx+=f*dx/d;na.fy+=f*dy/d;nb.fx-=f*dx/d;nb.fy-=f*dy/d;
    });
    nodes.forEach(n=>{n.fx+=(cx-n.x)*0.012;n.fy+=(cy-n.y)*0.012;});
    const cool=Math.max(0.25,1-iter/maxIter);
    nodes.forEach((n,i)=>{
      if(stRef.current.dragIdx===i) return;
      n.vx=(n.vx+n.fx)*0.78;n.vy=(n.vy+n.fy)*0.78;
      n.x=Math.max(28,Math.min(W-28,n.x+n.vx*cool));
      n.y=Math.max(28,Math.min(H-28,n.y+n.vy*cool));
    });
    redraw(canvas);
  }

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas||!entries.length) return;
    canvas.width=canvas.offsetWidth||680;canvas.height=canvas.offsetHeight||420;
    buildSim(canvas);
    let iter=0;const maxIter=220;
    function animate(){
      runTick(canvas,iter,maxIter);iter++;
      if(iter<maxIter) stRef.current.animId=requestAnimationFrame(animate);
      else{onUpdatePositions&&onUpdatePositions(stRef.current.nodes.map(n=>({id:n.id,x:n.x,y:n.y})));}
    }
    if(stRef.current.animId) cancelAnimationFrame(stRef.current.animId);
    stRef.current.animId=requestAnimationFrame(animate);
    return()=>{if(stRef.current.animId)cancelAnimationFrame(stRef.current.animId);};
  },[entries.length, entries.map(e=>(e.connections||[]).length).join(',')]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(canvas&&stRef.current.nodes.length) redraw(canvas);
  },[selectedId]);

  function nodeAt(canvas,cx,cy){
    const rect=canvas.getBoundingClientRect();
    const x=cx-rect.left,y=cy-rect.top;
    const {nodes}=stRef.current;
    for(let i=nodes.length-1;i>=0;i--){const dx=nodes[i].x-x,dy=nodes[i].y-y;if(dx*dx+dy*dy<=400) return i;}
    return -1;
  }
  function onMD(e){
    const idx=nodeAt(canvasRef.current,e.clientX,e.clientY);
    if(idx<0) return;
    stRef.current.dragIdx=idx;stRef.current.dragging=false;
    stRef.current.dragStartX=e.clientX;stRef.current.dragStartY=e.clientY;
  }
  function onMM(e){
    const s=stRef.current;
    if(s.dragIdx<0) return;
    if(Math.abs(e.clientX-s.dragStartX)+Math.abs(e.clientY-s.dragStartY)>5) s.dragging=true;
    if(!s.dragging) return;
    const canvas=canvasRef.current;
    const rect=canvas.getBoundingClientRect();
    const n=s.nodes[s.dragIdx];
    n.x=e.clientX-rect.left;n.y=e.clientY-rect.top;n.vx=0;n.vy=0;
    redraw(canvas);
  }
  function onMU(e){
    const s=stRef.current,idx=s.dragIdx,drag=s.dragging;
    s.dragIdx=-1;
    if(!drag&&idx>=0) onSelect&&onSelect(s.nodes[idx].id);
    if(drag) onUpdatePositions&&onUpdatePositions(s.nodes.map(n=>({id:n.id,x:n.x,y:n.y})));
  }
  function onTS(e){const t=e.touches[0];onMD({clientX:t.clientX,clientY:t.clientY});}
  function onTM(e){e.preventDefault();const t=e.touches[0];onMM({clientX:t.clientX,clientY:t.clientY});}

  if(!entries.length) return <div className="flex items-center justify-center text-sm opacity-50" style={{height:420}}>No embedded entries yet — click "Build Connections".</div>;
  return(
    <canvas ref={canvasRef} className="w-full rounded border-subtle" style={{height:420,background:'rgba(255,255,255,0.01)',cursor:'pointer'}}
      onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
      onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onMU}
    />
  );
}

function JournalSubtab({data, setData, toasts}){
  const voyageKey=data.settings?.voyageKey||'';
  const journals=data.journals||[];
  const today=new Date().toISOString().slice(0,10);
  const [date,setDate]=useState(today);
  const existing=journals.find(j=>j.date===date);
  const [body,setBody]=useState(existing?.body||'');
  const [tagsInput,setTagsInput]=useState((existing?.tags||[]).join(', '));
  const [view,setView]=useState('list');
  const [selectedId,setSelectedId]=useState(null);
  const [migrating,setMigrating]=useState(false);
  const [migrateProgress,setMigrateProgress]=useState(0);

  useEffect(()=>{
    const e=(data.journals||[]).find(j=>j.date===date);
    setBody(e?.body||'');
    setTagsInput((e?.tags||[]).join(', '));
  },[date]);

  function save(){
    if(!body.trim()) return;
    const hash=simpleHash(body);
    const tags=tagsInput.split(',').map(t=>t.trim()).filter(Boolean);
    if(existing){
      setData(d=>({...d,journals:(d.journals||[]).map(j=>j.date===date?{...j,body,updatedAt:new Date().toISOString(),tags,contentHash:hash,...(j.contentHash!==hash?{embedding:null,connections:[]}:{})}:j)}));
    } else {
      setData(d=>({...d,journals:[...(d.journals||[]),{id:uid(),date,body,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),tags,contentHash:hash}]}));
    }
    toasts.push('Journal entry saved');
  }

  async function runEmbeddings(){
    const entries=data.journals||[];
    if(entries.length<2){toasts.push('Need at least 2 entries to map');return;}
    setMigrating(true);setMigrateProgress(0);
    try{
      let updated=[...entries];
      if(voyageKey){
        const needsEmbed=entries.filter(e=>!e.embedding||e.contentHash!==simpleHash(e.body));
        if(needsEmbed.length){
          const chunks=[];
          for(let i=0;i<needsEmbed.length;i+=8) chunks.push(needsEmbed.slice(i,i+8));
          let done=0;
          for(const chunk of chunks){
            const embs=await fetchVoyageEmbeddings(chunk.map(e=>e.body),voyageKey);
            chunk.forEach((e,i)=>{
              const idx=updated.findIndex(u=>u.id===e.id);
              if(idx>=0) updated[idx]={...updated[idx],embedding:embs[i],contentHash:simpleHash(e.body)};
            });
            done+=chunk.length;setMigrateProgress(Math.round(done/needsEmbed.length*80));
          }
        }
      } else {
        const vecs=buildTFIDF(updated);
        updated=updated.map((e,i)=>({...e,embedding:vecs[i],contentHash:simpleHash(e.body)}));
        setMigrateProgress(80);
      }
      updated=computeConnections(updated);
      setMigrateProgress(100);
      setData(d=>({...d,journals:updated}));
      const total=updated.reduce((s,e)=>s+(e.connections||[]).length,0)/2;
      toasts.push(`Graph built — ${Math.round(total)} connections across ${updated.length} entries`);
    } catch(err){toasts.push('Failed: '+err.message);}
    setMigrating(false);
  }

  function handleUpdatePositions(positions){
    setData(d=>({...d,journals:(d.journals||[]).map(j=>{
      const p=positions.find(x=>x.id===j.id);
      return p?{...j,position:{x:p.x,y:p.y}}:j;
    })}));
  }

  const sorted=[...journals].sort((a,b)=>b.date.localeCompare(a.date));
  const graphEntries=journals.filter(j=>j.embedding);
  const selectedEntry=selectedId?journals.find(j=>j.id===selectedId):null;

  return(
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={()=>setView('list')} className={`px-3 py-1 rounded text-sm ${view==='list'?'bg-indigo-600':'bg-white/5'}`}>List</button>
        <button onClick={()=>setView('graph')} className={`px-3 py-1 rounded text-sm ${view==='graph'?'bg-indigo-600':'bg-white/5'}`}>Knowledge Graph</button>
        {view==='graph'&&(
          <button onClick={runEmbeddings} disabled={migrating} className="ml-auto px-3 py-1 rounded text-sm" style={{background:'rgba(99,102,241,0.2)',color:'#a5b4fc',border:'1px solid rgba(99,102,241,0.3)'}}>
            {migrating?`Building… ${migrateProgress}%`:`Build Connections${graphEntries.length?` (${graphEntries.length}/${journals.length} mapped)`:''}`}
          </button>
        )}
      </div>

      {view==='list'?(
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 glass p-5 rounded border-subtle flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input type="date" className="p-2 bg-transparent border border-white/10 rounded text-sm" value={date} onChange={e=>setDate(e.target.value)} />
              <span className="text-sm opacity-60">{date===today?'Today':''}</span>
            </div>
            <textarea
              className="flex-1 w-full p-3 bg-transparent border border-white/10 rounded text-sm resize-none min-h-[300px]"
              placeholder="Write your thoughts for the day..."
              value={body} onChange={e=>setBody(e.target.value)}
            />
            <input
              className="w-full p-2 bg-transparent border border-white/10 rounded text-xs"
              placeholder="Tags: ideas, finance, goals  (comma-separated)"
              value={tagsInput} onChange={e=>setTagsInput(e.target.value)}
            />
            <button className="self-end px-4 py-1.5 rounded bg-indigo-600" onClick={save}>Save Entry</button>
          </div>
          <div className="glass p-4 rounded border-subtle">
            <div className="font-semibold mb-3 text-sm">Past Entries</div>
            {sorted.length===0&&<div className="text-xs opacity-50">No entries yet.</div>}
            <div className="flex flex-col gap-2">
              {sorted.map(j=>(
                <button key={j.id} className={`text-left p-2 rounded hover:bg-white/5 ${j.date===date?'bg-white/10':''}`} onClick={()=>setDate(j.date)}>
                  <div className="text-xs font-medium">{j.date}</div>
                  {(j.tags||[]).length>0&&<div className="text-xs mt-0.5" style={{color:'#818cf8'}}>{(j.tags||[]).join(', ')}</div>}
                  <div className="text-xs opacity-60 line-clamp-2 mt-0.5">{j.body}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ):(
        <div className="flex gap-4">
          <div className="flex-1 min-w-0 glass p-3 rounded border-subtle">
            <JournalGraph entries={graphEntries} selectedId={selectedId} onSelect={setSelectedId} onUpdatePositions={handleUpdatePositions} />
          </div>
          {selectedEntry&&(
            <div className="w-64 glass p-4 rounded border-subtle flex flex-col gap-2 text-sm flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">{selectedEntry.date}</div>
                <button onClick={()=>setSelectedId(null)} className="opacity-50 hover:opacity-100 text-xs">✕</button>
              </div>
              {(selectedEntry.tags||[]).length>0&&<div className="text-xs" style={{color:'#818cf8'}}>{selectedEntry.tags.join(', ')}</div>}
              <div className="text-xs opacity-75 leading-relaxed line-clamp-10">{selectedEntry.body}</div>
              {(selectedEntry.connections||[]).length>0&&(
                <div className="mt-1">
                  <div className="text-xs opacity-50 mb-1">Connections:</div>
                  {selectedEntry.connections.slice(0,6).map(c=>{
                    const other=journals.find(j=>j.id===c.id);
                    return other?(
                      <button key={c.id} onClick={()=>setSelectedId(c.id)} className="block w-full text-left p-1 rounded hover:bg-white/5 text-xs">
                        <span style={{color:c.type==='tag'?'#fbbf24':'#818cf8'}}>●</span> {other.date} <span className="opacity-40">{Math.round(c.sim*100)}%</span>
                        {c.sharedTags&&<span className="ml-1 opacity-40">#{c.sharedTags[0]}</span>}
                      </button>
                    ):null;
                  })}
                </div>
              )}
              <button className="mt-auto text-xs text-left" style={{color:'#818cf8'}} onClick={()=>{setView('list');setDate(selectedEntry.date);}}>Open in editor →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Life Planner ----
const PLANNER_TOOLS=[
  {name:'add_area',description:'Create a new life area',input_schema:{type:'object',properties:{name:{type:'string'},description:{type:'string'},color:{type:'string',description:'CSS hex like #6366f1'}},required:['name']}},
  {name:'add_goal',description:'Add a goal to a life area. Use when the user mentions something they want to achieve.',input_schema:{type:'object',properties:{areaId:{type:'string',description:'Life area ID'},title:{type:'string'},description:{type:'string'},targetDate:{type:'string',description:'YYYY-MM-DD'},parentGoalId:{type:'string'},status:{type:'string',enum:['active','paused']}},required:['areaId','title']}},
  {name:'update_goal',description:'Update an existing goal',input_schema:{type:'object',properties:{goalId:{type:'string'},title:{type:'string'},description:{type:'string'},targetDate:{type:'string'},status:{type:'string',enum:['active','paused','done','archived']}},required:['goalId']}},
  {name:'add_action',description:'Add a concrete action/task under a goal',input_schema:{type:'object',properties:{goalId:{type:'string'},title:{type:'string'},dueDate:{type:'string'},estimatedDuration:{type:'string',description:'e.g. "30min","2hr"'},people:{type:'array',items:{type:'string'}},notes:{type:'string'}},required:['goalId','title']}},
  {name:'update_action',description:'Update or complete an action',input_schema:{type:'object',properties:{actionId:{type:'string'},title:{type:'string'},status:{type:'string',enum:['todo','done','skipped']},dueDate:{type:'string'},notes:{type:'string'}},required:['actionId']}},
  {name:'add_person',description:'Add a person to the relationship tracker',input_schema:{type:'object',properties:{name:{type:'string'},relationship:{type:'string',description:'friend, mentor, family, colleague'},cadence:{type:'string',description:'weekly, biweekly, monthly, quarterly'},notes:{type:'string'}},required:['name']}},
  {name:'update_person',description:'Update person info or log an interaction',input_schema:{type:'object',properties:{personId:{type:'string'},name:{type:'string'},relationship:{type:'string'},cadence:{type:'string'},lastInteraction:{type:'string',description:'ISO date YYYY-MM-DD'},notes:{type:'string'}},required:['personId']}},
  {name:'log_checkin',description:'Log a reflection or weekly check-in',input_schema:{type:'object',properties:{summary:{type:'string'},areaUpdates:{type:'array',items:{type:'object',properties:{areaId:{type:'string'},note:{type:'string'}}}}},required:['summary']}},
];

function getDefaultPlanner(){
  return{areas:[{id:'pa1',name:'Startups',color:'#6366f1',description:'Entrepreneurial projects and ideas'},{id:'pa2',name:'Academics',color:'#3b82f6',description:'School and intellectual growth'},{id:'pa3',name:'Health',color:'#10b981',description:'Physical and mental wellbeing'},{id:'pa4',name:'Relationships',color:'#f59e0b',description:'Friends, family, connections'},{id:'pa5',name:'Personal Growth',color:'#8b5cf6',description:'Self-development and mindset'}],goals:[],actions:[],people:[],checkins:[],chatHistory:[],undoStack:[]};
}

function LifePlannerSubtab({data,setData,toasts}){
  const planner=data.planner||getDefaultPlanner();
  const apiKey=data.settings?.apiKey||'';
  const [viewMode,setViewMode]=useState('cards');
  const [detailAreaId,setDetailAreaId]=useState(null);
  const [selectedId,setSelectedId]=useState(null);
  const [selectedType,setSelectedType]=useState(null);
  const [chatInput,setChatInput]=useState('');
  const [streaming,setStreaming]=useState(false);
  const [streamText,setStreamText]=useState('');
  const [inFlightTools,setInFlightTools]=useState([]);
  const [listening,setListening]=useState(false);
  const [liveText,setLiveText]=useState('');
  const [logCheckin,setLogCheckin]=useState(false);
  const [logDate,setLogDate]=useState('');
  const [logNote,setLogNote]=useState('');
  const recogRef=useRef(null);
  const chatEndRef=useRef(null);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[planner.chatHistory?.length,streamText]);

  function mutate(fn,desc){
    setData(d=>{
      const p=d.planner||getDefaultPlanner();
      const next=fn({...p});
      const snap={areas:p.areas,goals:p.goals,actions:p.actions,people:p.people,checkins:p.checkins};
      const undoStack=[...(p.undoStack||[]).slice(-9),{desc,at:Date.now(),snapshot:snap}];
      return{...d,planner:{...next,undoStack,chatHistory:next.chatHistory||p.chatHistory||[]}};
    });
  }

  function undo(){
    const stack=planner.undoStack||[];
    if(!stack.length){toasts.push('Nothing to undo');return;}
    const last=stack[stack.length-1];
    setData(d=>({...d,planner:{...d.planner,...last.snapshot,undoStack:stack.slice(0,-1)}}));
    toasts.push('Undid: '+last.desc);
  }

  function onToggleGoal(goalId,currentStatus){
    const next=currentStatus==='done'?'active':'done';
    mutate(p=>({...p,goals:p.goals.map(g=>g.id===goalId?{...g,status:next}:g)}),next==='done'?'Completed goal':'Reopened goal');
    toasts.push(next==='done'?'Goal marked done!':'Goal reopened');
  }

  function onToggleAction(actionId,currentStatus){
    const next=currentStatus==='done'?'todo':'done';
    mutate(p=>({...p,actions:p.actions.map(a=>a.id===actionId?{...a,status:next}:a)}),'Toggled action');
  }

  function onScheduleCheckin(personId,date){
    const person=(planner.people||[]).find(p=>p.id===personId);
    if(!person) return;
    const dow=(new Date(date+'T12:00:00').getDay()+6)%7;
    const event={id:uid(),title:`☎ Check in: ${person.name}`,type:'Personal',when:{exactDate:date,day:dow,hour:9},isCheckin:true,plannerPersonId:personId};
    setData(d=>({...d,events:[...(d.events||[]),event]}));
    toasts.push(`Check-in with ${person.name} added to calendar on ${date}`);
  }

  function executeTool(name,input){
    const now=new Date().toISOString();
    let label=name;
    mutate(p=>{
      const COLS=['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899'];
      switch(name){
        case 'add_area':{const a={id:uid('pa'),name:input.name,color:input.color||COLS[p.areas.length%COLS.length],description:input.description||'',createdAt:now};label=`Created area: ${input.name}`;return{...p,areas:[...p.areas,a]};}
        case 'add_goal':{const g={id:uid('pg'),areaId:input.areaId,title:input.title,description:input.description||'',status:input.status||'active',targetDate:input.targetDate||null,parentGoalId:input.parentGoalId||null,createdAt:now};label=`Added goal: ${input.title}`;return{...p,goals:[...p.goals,g]};}
        case 'update_goal':{const{goalId,...u}=input;label=`Updated: ${p.goals.find(g=>g.id===goalId)?.title||goalId}`;return{...p,goals:p.goals.map(g=>g.id===goalId?{...g,...u}:g)};}
        case 'add_action':{const a={id:uid('pa'),goalId:input.goalId,title:input.title,dueDate:input.dueDate||null,status:'todo',estimatedDuration:input.estimatedDuration||null,people:input.people||[],notes:input.notes||'',createdAt:now};label=`Added action: ${input.title}`;return{...p,actions:[...p.actions,a]};}
        case 'update_action':{const{actionId,...u}=input;label=`Updated action`;return{...p,actions:p.actions.map(a=>a.id===actionId?{...a,...u}:a)};}
        case 'add_person':{const pr={id:uid('pp'),name:input.name,relationship:input.relationship||'',cadence:input.cadence||'monthly',lastInteraction:null,notes:input.notes||'',createdAt:now};label=`Added: ${input.name}`;return{...p,people:[...p.people,pr]};}
        case 'update_person':{const{personId,...u}=input;label=`Updated person`;return{...p,people:p.people.map(pr=>pr.id===personId?{...pr,...u}:pr)};}
        case 'log_checkin':{const c={id:uid('pc'),date:new Date().toISOString().slice(0,10),summary:input.summary,areaUpdates:input.areaUpdates||[],createdAt:now};label=`Logged check-in`;return{...p,checkins:[...(p.checkins||[]),c]};}
        default:return p;
      }
    },label);
    return `Done — ${label}`;
  }

  function buildContext(){
    const p=planner;
    const today=new Date().toISOString().slice(0,10);
    const dayName=new Date().toLocaleDateString('en',{weekday:'long'});

    // Per area: active goals in full (open actions only), done goals as summary
    const plan=p.areas.map(area=>{
      const all=p.goals.filter(g=>g.areaId===area.id&&g.status!=='archived');
      const active=all.filter(g=>g.status!=='done');
      const done=all.filter(g=>g.status==='done');
      return{
        area:area.name, id:area.id,
        activeGoals:active.map(g=>({
          id:g.id, title:g.title, status:g.status, targetDate:g.targetDate||null,
          openActions:p.actions.filter(a=>a.goalId===g.id&&a.status!=='done').map(a=>({id:a.id,title:a.title,dueDate:a.dueDate||null})),
          doneActionCount:p.actions.filter(a=>a.goalId===g.id&&a.status==='done').length,
        })),
        completedGoals:done.length>0?{count:done.length,titles:done.map(g=>g.title)}:undefined,
      };
    });

    // People: overdue contacts in full, up-to-date as name list only
    const rawPeople=p.people.map(pr=>{
      const days=pr.lastInteraction?Math.floor((Date.now()-new Date(pr.lastInteraction))/86400000):null;
      const cd={weekly:7,biweekly:14,monthly:30,quarterly:90}[pr.cadence]||30;
      return{id:pr.id,name:pr.name,relationship:pr.relationship,cadence:pr.cadence,daysSinceContact:days,overdue:days!==null&&days>cd};
    });
    const people={
      overdue:rawPeople.filter(p=>p.overdue),
      upToDate:rawPeople.filter(p=>!p.overdue).map(p=>p.name),
      total:rawPeople.length,
    };

    // Journals: last 7 days, 80-char preview only
    const recentJournals=(data.journals||[])
      .filter(j=>j.date>=new Date(Date.now()-7*86400000).toISOString().slice(0,10))
      .map(j=>({date:j.date,tags:j.tags||[],preview:j.body.slice(0,80)}));

    return{today,dayOfWeek:dayName,plan,people,recentJournals};
  }

  async function streamRound(messages,onText,onTool){
    const k=(ls('magverse:v1')?.settings||{}).apiKey||'';
    const ctx=buildContext();
    const system=`You are a thoughtful life planner — direct, honest, and analytical. Reference the existing plan in every response. Push back on vague goals and unrealistic timelines. Surface conflicts. When someone is mentioned, check the People list. Never invent commitments the user didn't make.

CURRENT PLAN:
${JSON.stringify(ctx.plan,null,2)}

PEOPLE:
${JSON.stringify(ctx.people,null,2)}

RECENT JOURNAL (7 days):
${JSON.stringify(ctx.recentJournals,null,2)}

Today: ${ctx.today} (${ctx.dayOfWeek})`;
    const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-opus-4-7',max_tokens:2000,stream:true,system,tools:PLANNER_TOOLS,messages})});
    if(!resp.ok){const j=await resp.json();throw new Error(j.error?.message||'API error '+resp.status);}
    const reader=resp.body.getReader(),dec=new TextDecoder();
    let buf='',fullText='',stopReason='end_turn';
    let curBlock=null,curInput='';
    const toolCalls=[],rawContent=[];
    while(true){
      const{done,value}=await reader.read();if(done)break;
      buf+=dec.decode(value,{stream:true});
      const lines=buf.split('\n');buf=lines.pop()||'';
      for(const line of lines){
        if(!line.startsWith('data:'))continue;
        const raw=line.slice(5).trim();if(raw==='[DONE]')break;
        try{
          const ev=JSON.parse(raw);
          if(ev.type==='message_delta'&&ev.delta?.stop_reason)stopReason=ev.delta.stop_reason;
          else if(ev.type==='content_block_start'){curBlock=ev.content_block;curInput='';if(ev.content_block.type==='text')rawContent.push({type:'text',text:''});else if(ev.content_block.type==='tool_use')rawContent.push({...ev.content_block,input:{}});}
          else if(ev.type==='content_block_delta'){
            if(ev.delta.type==='text_delta'){fullText+=ev.delta.text;if(rawContent.length&&rawContent[rawContent.length-1].type==='text')rawContent[rawContent.length-1].text+=ev.delta.text;onText(fullText);}
            else if(ev.delta.type==='input_json_delta')curInput+=ev.delta.partial_json;
          }
          else if(ev.type==='content_block_stop'&&curBlock?.type==='tool_use'){
            try{const inp=JSON.parse(curInput||'{}');rawContent[rawContent.length-1].input=inp;const result=executeTool(curBlock.name,inp);const tc={id:curBlock.id,name:curBlock.name,input:inp,result};toolCalls.push(tc);onTool(tc);}catch(e){}
          }
        }catch(e){}
      }
    }
    return{text:fullText,toolCalls,stopReason,rawContent};
  }

  async function sendMessage(text){
    if(!text.trim()||streaming)return;
    const userMsg={role:'user',content:text.trim(),id:uid(),at:Date.now()};
    setData(d=>{const p=d.planner||getDefaultPlanner();return{...d,planner:{...p,chatHistory:[...(p.chatHistory||[]),userMsg]}};});
    setChatInput('');setStreamText('');setInFlightTools([]);
    if(!apiKey){
      const e={role:'assistant',content:'Add your Anthropic API key in Settings.',id:uid(),at:Date.now()};
      setData(d=>({...d,planner:{...d.planner,chatHistory:[...d.planner.chatHistory,e]}}));return;
    }
    setStreaming(true);
    const collected=[];
    try{
      const history=(planner.chatHistory||[]).slice(-10).map(m=>({role:m.role,content:m.content}));
      const messages=[...history,{role:'user',content:text.trim()}];
      const{text:t1,toolCalls:tc1,stopReason,rawContent}=await streamRound(messages,ft=>setStreamText(ft),tc=>{collected.push(tc);setInFlightTools([...collected]);});
      let finalText=t1;
      if(tc1.length>0&&stopReason==='tool_use'){
        const toolResults=tc1.map(tc=>({type:'tool_result',tool_use_id:tc.id,content:tc.result}));
        setStreamText('');
        const{text:t2}=await streamRound([...messages,{role:'assistant',content:rawContent},{role:'user',content:toolResults}],ft=>setStreamText(ft),()=>{});
        finalText=t2;
      }
      const aMsg={role:'assistant',content:finalText,toolCalls:collected,id:uid(),at:Date.now()};
      setData(d=>({...d,planner:{...d.planner,chatHistory:[...d.planner.chatHistory,aMsg]}}));
    }catch(e){
      const eMsg={role:'assistant',content:'Error: '+e.message,id:uid(),at:Date.now()};
      setData(d=>({...d,planner:{...d.planner,chatHistory:[...d.planner.chatHistory,eMsg]}}));
    }
    setStreamText('');setInFlightTools([]);setStreaming(false);
  }

  function startListening(){
    const R=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!R){toasts.push('Speech not supported');return;}
    const r=new R();r.lang='en-US';r.interimResults=true;r.continuous=false;
    let acc='';
    r.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)acc+=t+' ';else interim=t;}setLiveText(acc+interim);};
    r.onend=()=>{setListening(false);const f=acc.trim();if(f){setChatInput(prev=>prev?prev+' '+f:f);setLiveText('');}else setLiveText('');};
    r.onerror=()=>{setListening(false);setLiveText('');};
    recogRef.current=r;r.start();setListening(true);setLiveText('');
  }
  function stopListening(){recogRef.current?.stop();setListening(false);}

  const selGoal=selectedType==='goal'?planner.goals?.find(g=>g.id===selectedId):null;
  const selAction=selectedType==='action'?planner.actions?.find(a=>a.id===selectedId):null;
  const selPerson=selectedType==='person'?planner.people?.find(p=>p.id===selectedId):null;

  if(detailAreaId){
    const area=(planner.areas||[]).find(a=>a.id===detailAreaId);
    if(area) return <PlannerAreaDetail planner={planner} area={area} onBack={()=>setDetailAreaId(null)} onToggleGoal={onToggleGoal} onToggleAction={onToggleAction} apiKey={apiKey}/>;
  }

  return(
    <div style={{display:'flex',gap:'16px',height:'calc(100vh - 215px)',minHeight:'520px'}}>
      {/* LEFT: Visualization */}
      <div style={{flex:'0 0 55%',display:'flex',flexDirection:'column',gap:'10px',overflow:'hidden',paddingRight:'12px',borderRight:'1px solid rgba(255,255,255,0.05)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
          <div style={{display:'flex',gap:'2px',padding:'4px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
            {[['cards','Cards'],['timeline','Timeline'],['tree','Tree'],['people','People']].map(([v,l])=>(
              <button key={v} onClick={()=>setViewMode(v)} style={viewMode===v?{background:'rgba(255,255,255,0.1)',color:'#e2e8f0',padding:'3px 10px',borderRadius:'8px',fontSize:'12px',fontWeight:600}:{color:'#64748b',padding:'3px 10px',fontSize:'12px',cursor:'pointer'}}>{l}</button>
            ))}
          </div>
          <button onClick={undo} style={{marginLeft:'auto',fontSize:'11px',color:'#475569',padding:'4px 8px',borderRadius:'6px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',cursor:'pointer'}}>↩ Undo</button>
          <button onClick={()=>{const j=JSON.stringify(planner,null,2);const b=new Blob([j],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='life-plan.json';a.click();URL.revokeObjectURL(u);}} style={{fontSize:'11px',color:'#475569',padding:'4px 8px',borderRadius:'6px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',cursor:'pointer'}}>Export</button>
        </div>
        <div style={{flex:1,overflowY:'auto',minHeight:0}}>
          {viewMode==='cards'&&<PlannerCardsView planner={planner} onSelect={(t,id)=>{setSelectedType(t);setSelectedId(id);}} selectedId={selectedId} onOpenArea={id=>setDetailAreaId(id)}/>}
          {viewMode==='timeline'&&<PlannerTimelineView planner={planner} onSelect={(t,id)=>{setSelectedType(t);setSelectedId(id);}} onToggleGoal={onToggleGoal} onOpenArea={id=>setDetailAreaId(id)}/>}
          {viewMode==='tree'&&<PlannerTreeView planner={planner} onSelect={(t,id)=>{setSelectedType(t);setSelectedId(id);}} selectedId={selectedId}/>}
          {viewMode==='people'&&<PlannerPeopleView planner={planner} onSelect={id=>{setSelectedType('person');setSelectedId(id);setLogCheckin(false);}} selectedId={selectedId} onScheduleCheckin={onScheduleCheckin}/>}
        </div>
        {(selGoal||selAction||selPerson)&&(
          <div style={{flexShrink:0,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'12px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
              <div style={{fontSize:'13px',fontWeight:600,color:'#e2e8f0'}}>{selGoal?.title||selAction?.title||selPerson?.name}</div>
              <button onClick={()=>{setSelectedId(null);setSelectedType(null);}} style={{color:'#475569',fontSize:'14px',cursor:'pointer'}}>✕</button>
            </div>
            {selGoal&&<>
              <div style={{fontSize:'11px',color:'#64748b',marginBottom:'6px'}}>{selGoal.status}{selGoal.targetDate&&` · target: ${selGoal.targetDate}`}</div>
              {selGoal.description&&<div style={{fontSize:'12px',color:'#94a3b8',marginBottom:'6px'}}>{selGoal.description}</div>}
              {planner.actions.filter(a=>a.goalId===selGoal.id).map(a=>(
                <div key={a.id} style={{fontSize:'11px',color:a.status==='done'?'#475569':'#94a3b8',display:'flex',gap:'6px',marginBottom:'3px'}}>
                  <span style={{color:a.status==='done'?'#10b981':'#334155'}}>{a.status==='done'?'✓':'○'}</span>{a.title}{a.dueDate&&<span style={{color:'#334155'}}>· {a.dueDate}</span>}
                </div>
              ))}
            </>}
            {selAction&&<>
              <div style={{fontSize:'11px',color:'#64748b'}}>{selAction.status}{selAction.dueDate&&` · due ${selAction.dueDate}`}{selAction.estimatedDuration&&` · ${selAction.estimatedDuration}`}</div>
              {selAction.notes&&<div style={{fontSize:'12px',color:'#94a3b8',marginTop:'4px'}}>{selAction.notes}</div>}
              {selAction.people?.length>0&&<div style={{fontSize:'11px',color:'#818cf8',marginTop:'4px'}}>With: {selAction.people.join(', ')}</div>}
            </>}
            {selPerson&&<>
              <div style={{fontSize:'11px',color:'#64748b',marginBottom:'6px'}}>{selPerson.relationship} · {selPerson.cadence} · {selPerson.lastInteraction?`Last: ${selPerson.lastInteraction}`:'Never logged'}</div>
              {selPerson.notes&&<div style={{fontSize:'12px',color:'#94a3b8',marginBottom:'8px'}}>{selPerson.notes}</div>}
              {!logCheckin?(
                <button onClick={()=>{setLogCheckin(true);setLogDate(new Date().toISOString().slice(0,10));setLogNote('');}}
                  style={{padding:'5px 12px',borderRadius:'7px',fontSize:'11px',fontWeight:600,color:'#6ee7b7',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.25)',cursor:'pointer'}}>
                  ✓ Log Check-in
                </button>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:'6px',background:'rgba(16,185,129,0.05)',border:'1px solid rgba(16,185,129,0.15)',borderRadius:'8px',padding:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:600,color:'#6ee7b7',marginBottom:'2px'}}>Log check-in with {selPerson.name}</div>
                  <input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)}
                    style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'6px',padding:'5px 8px',color:'#e2e8f0',fontSize:'12px',colorScheme:'dark',outline:'none'}}/>
                  <textarea placeholder="What did you talk about?" value={logNote} onChange={e=>setLogNote(e.target.value)} rows={2}
                    style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'6px',padding:'6px 8px',color:'#e2e8f0',fontSize:'12px',resize:'none',fontFamily:'inherit',outline:'none'}}/>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button onClick={()=>{
                      if(!logDate) return;
                      mutate(p=>({...p,people:p.people.map(pr=>pr.id===selPerson.id?{...pr,lastInteraction:logDate,notes:logNote?`${logDate}: ${logNote}${pr.notes?'\n'+pr.notes:''}`:pr.notes}:pr)}),`Logged check-in: ${selPerson.name}`);
                      // Remove matching check-in calendar events for this date+person
                      setData(d=>({...d,events:(d.events||[]).filter(ev=>!(ev.isCheckin&&ev.plannerPersonId===selPerson.id&&ev.when?.exactDate===logDate))}));
                      toasts.push(`Logged check-in with ${selPerson.name}`);
                      setLogCheckin(false);setLogNote('');
                    }} style={{flex:1,padding:'5px',borderRadius:'6px',fontSize:'11px',fontWeight:700,color:'white',background:'linear-gradient(90deg,#10b981,#059669)',border:'none',cursor:'pointer'}}>
                      Save
                    </button>
                    <button onClick={()=>setLogCheckin(false)} style={{padding:'5px 10px',borderRadius:'6px',fontSize:'11px',color:'#475569',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',cursor:'pointer'}}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>}
          </div>
        )}
      </div>

      {/* RIGHT: Chat */}
      <div style={{flex:'0 0 45%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{fontSize:'11px',fontWeight:700,color:'#475569',marginBottom:'8px',letterSpacing:'0.1em',flexShrink:0}}>LIFE PLANNER · claude-opus-4-7</div>
        <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:'10px',paddingRight:'4px',minHeight:0}}>
          {!planner.chatHistory?.length&&!streaming&&(
            <div style={{padding:'32px 16px',textAlign:'center'}}>
              <div style={{fontSize:'28px',marginBottom:'10px'}}>🗺️</div>
              <div style={{fontSize:'13px',color:'#e2e8f0',marginBottom:'8px',fontWeight:600}}>Your life planner</div>
              <div style={{fontSize:'12px',color:'#334155',lineHeight:'1.6'}}>Tell me what you're working on, what you want to achieve, or who you want to reconnect with. I'll help you build and maintain a real plan — not just a list.</div>
            </div>
          )}
          {planner.chatHistory?.map(msg=>(
            <div key={msg.id} style={{display:'flex',flexDirection:'column',gap:'4px',alignItems:msg.role==='user'?'flex-end':'flex-start'}}>
              {msg.toolCalls?.map(tc=>(
                <div key={tc.id} style={{fontSize:'11px',color:'#6ee7b7',background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:'8px',padding:'4px 10px',maxWidth:'90%'}}>✓ {tc.result||tc.name}</div>
              ))}
              {msg.content&&(
                <div style={{maxWidth:'90%',padding:'9px 12px',borderRadius:msg.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',fontSize:'13px',lineHeight:'1.6',background:msg.role==='user'?'rgba(99,102,241,0.2)':'rgba(255,255,255,0.05)',border:msg.role==='user'?'1px solid rgba(99,102,241,0.3)':'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',wordBreak:'break-word',whiteSpace:'pre-wrap'}}>{msg.content}</div>
              )}
            </div>
          ))}
          {streaming&&(
            <div style={{display:'flex',flexDirection:'column',gap:'4px',alignItems:'flex-start'}}>
              {inFlightTools.map((tc,i)=>(
                <div key={i} style={{fontSize:'11px',color:'#6ee7b7',background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:'8px',padding:'4px 10px'}}>✓ {tc.result||tc.name}</div>
              ))}
              {streamText?(
                <div style={{maxWidth:'90%',padding:'9px 12px',borderRadius:'16px 16px 16px 4px',fontSize:'13px',lineHeight:'1.6',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',whiteSpace:'pre-wrap'}}>
                  {streamText}<span style={{display:'inline-block',width:'3px',height:'13px',background:'#6366f1',marginLeft:'2px',verticalAlign:'text-bottom',animation:'pulse 0.8s ease-in-out infinite'}}/>
                </div>
              ):(
                <div style={{display:'flex',gap:'4px',padding:'12px'}}>
                  {[0,1,2].map(i=><div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',background:'#334155',animation:`float${i%2+1} 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>
        {liveText&&<div style={{fontSize:'12px',color:'#64748b',fontStyle:'italic',padding:'4px 0',flexShrink:0}}>{liveText}</div>}
        <div style={{marginTop:'8px',display:'flex',gap:'6px',alignItems:'flex-end',flexShrink:0}}>
          <textarea style={{flex:1,padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',fontSize:'13px',color:'#e2e8f0',resize:'none',minHeight:'40px',maxHeight:'120px',lineHeight:'1.5',fontFamily:'inherit'}}
            placeholder="What are you working on? Goals, people, plans…"
            value={chatInput} onChange={e=>setChatInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(chatInput);}}} rows={1}/>
          <button onMouseDown={startListening} onMouseUp={stopListening} onTouchStart={startListening} onTouchEnd={stopListening}
            style={{width:'38px',height:'38px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:listening?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.06)',border:`1px solid ${listening?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`,fontSize:'17px',cursor:'pointer',position:'relative'}}>
            {listening&&<span style={{position:'absolute',inset:'-5px',borderRadius:'15px',border:'2px solid rgba(239,68,68,0.4)',animation:'pulse 1s ease-in-out infinite'}}/>}🎤
          </button>
          <button onClick={()=>sendMessage(chatInput)} disabled={streaming||!chatInput.trim()}
            style={{width:'38px',height:'38px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:streaming||!chatInput.trim()?'rgba(99,102,241,0.15)':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',fontSize:'18px',cursor:streaming?'default':'pointer',border:'none',fontWeight:'bold'}}>↑</button>
        </div>
      </div>
    </div>
  );
}

function PlannerAreaDetail({planner,area,onBack,onToggleGoal,onToggleAction,apiKey}){
  const goals=(planner.goals||[]).filter(g=>g.areaId===area.id&&g.status!=='archived');
  const actions=planner.actions||[];
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState('');
  const [streaming,setStreaming]=useState(false);
  const [streamText,setStreamText]=useState('');
  const [collapsed,setCollapsed]=useState({});
  const [showTimeline,setShowTimeline]=useState(true);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[msgs.length,streamText]);
  const toggle=id=>setCollapsed(c=>({...c,[id]:!c[id]}));

  const now=new Date();
  const msStart=new Date(now.getFullYear(),now.getMonth(),1).getTime();
  const msEnd=new Date(now.getFullYear(),now.getMonth()+12,1).getTime();
  const totalMs=msEnd-msStart;
  const todayPct=((now.getTime()-msStart)/totalMs)*100;
  const months=[];for(let i=0;i<12;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1);months.push(d.toLocaleDateString('en',{month:'short'}));}

  async function sendAreaMsg(text){
    if(!text.trim()||!apiKey) return;
    const userMsg={role:'user',id:uid(),content:text,at:Date.now()};
    setMsgs(m=>[...m,userMsg]);setInput('');setStreaming(true);setStreamText('');
    // Active goals: full detail with open actions only. Done goals: title summary.
    const ctx={
      activeGoals:goals.filter(g=>g.status!=='done').map(g=>({
        id:g.id, title:g.title, status:g.status, targetDate:g.targetDate||null,
        openActions:actions.filter(a=>a.goalId===g.id&&a.status!=='done').map(a=>({title:a.title,dueDate:a.dueDate||null})),
        doneActionCount:actions.filter(a=>a.goalId===g.id&&a.status==='done').length,
      })),
      completedGoals:goals.filter(g=>g.status==='done').map(g=>g.title),
    };
    const system=`You are a focused advisor for the "${area.name}" area of the user's life plan.\n\nCURRENT STATE:\n${JSON.stringify(ctx,null,2)}\n\nBe specific, actionable, and direct. Reference their actual goals and actions by name. Today: ${now.toISOString().slice(0,10)}.`;
    try{
      const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-opus-4-7',max_tokens:1200,stream:true,system,messages:[...msgs,userMsg].map(m=>({role:m.role,content:m.content}))})});
      const reader=resp.body.getReader(),dec=new TextDecoder();let buf='',out='';
      while(true){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop();for(const line of lines){if(!line.startsWith('data:'))continue;const d=line.slice(5).trim();if(d==='[DONE]')break;try{const j=JSON.parse(d);if(j.type==='content_block_delta'&&j.delta?.type==='text_delta'){out+=j.delta.text;setStreamText(out);}}catch{}}}
      setMsgs(m=>[...m,{role:'assistant',id:uid(),content:out,at:Date.now()}]);
    }catch(e){setMsgs(m=>[...m,{role:'assistant',id:uid(),content:'Error: '+e.message,at:Date.now()}]);}
    setStreamText('');setStreaming(false);
  }

  const W='#f1f5f9'; // near-white for primary text
  const WM='#cbd5e1'; // mid-white for secondary
  const WD='#94a3b8'; // dimmer for tertiary

  return(
    <div style={{height:'calc(100vh - 215px)',minHeight:'520px',display:'flex',flexDirection:'column'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:'12px',paddingBottom:'12px',borderBottom:`1px solid ${area.color}30`,marginBottom:'14px',flexShrink:0}}>
        <button onClick={onBack} style={{padding:'5px 12px',borderRadius:'7px',fontSize:'13px',color:W,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',cursor:'pointer',fontFamily:'inherit'}}>← Back</button>
        <div style={{width:'13px',height:'13px',borderRadius:'50%',background:area.color,boxShadow:`0 0 14px ${area.color}90`,flexShrink:0}}/>
        <div style={{fontSize:'18px',fontWeight:700,color:area.color}}>{area.name}</div>
        {area.description&&<div style={{fontSize:'13px',color:WM}}>{area.description}</div>}
        <div style={{marginLeft:'auto',fontSize:'12px',color:WD}}>{goals.filter(g=>g.status==='done').length}/{goals.length} goals complete</div>
      </div>

      <div style={{flex:1,display:'flex',gap:'18px',overflow:'hidden',minHeight:0}}>
        {/* LEFT: Timeline + Goals */}
        <div style={{flex:'0 0 54%',display:'flex',flexDirection:'column',gap:'10px',overflow:'hidden'}}>

          {/* Collapsible mini timeline */}
          {goals.filter(g=>g.targetDate).length>0&&(
            <div style={{flexShrink:0,background:'rgba(255,255,255,0.03)',border:`1px solid ${area.color}20`,borderRadius:'10px',overflow:'hidden'}}>
              <button onClick={()=>setShowTimeline(t=>!t)} style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',padding:'8px 12px',background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
                <div style={{fontSize:'10px',fontWeight:700,color:area.color,letterSpacing:'0.08em',flex:1}}>TIMELINE</div>
                <div style={{fontSize:'10px',color:WD}}>{showTimeline?'▲ hide':'▼ show'}</div>
              </button>
              {showTimeline&&(
                <div style={{padding:'0 12px 12px'}}>
                  <div style={{display:'flex',marginBottom:'6px'}}>
                    {months.map((m,i)=><div key={i} style={{flex:1,fontSize:'9px',color:WD,borderLeft:'1px solid rgba(255,255,255,0.06)',paddingLeft:'3px'}}>{m}</div>)}
                  </div>
                  <div style={{position:'relative',height:'14px',marginBottom:'4px'}}>
                    <div style={{position:'absolute',left:`${todayPct}%`,transform:'translateX(-50%)',fontSize:'8px',color:'#818cf8',fontWeight:800}}>▼ TODAY</div>
                  </div>
                  {goals.filter(g=>g.targetDate).map(g=>{
                    const isDone=g.status==='done';
                    const tPct=Math.max(2,Math.min(98,((new Date(g.targetDate+'T12:00:00').getTime()-msStart)/totalMs)*100));
                    const isPast=new Date(g.targetDate+'T12:00:00').getTime()<now.getTime()&&!isDone;
                    return(
                      <div key={g.id} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                        <div style={{width:'88px',flexShrink:0,fontSize:'11px',color:isDone?WD:WM,textAlign:'right',paddingRight:'6px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:isDone?'line-through':'none'}} title={g.title}>{g.title}</div>
                        <div style={{flex:1,height:'18px',position:'relative',background:'rgba(255,255,255,0.02)',borderRadius:'4px'}}>
                          <div style={{position:'absolute',left:`${todayPct}%`,top:0,bottom:0,width:'2px',background:'rgba(99,102,241,0.6)',zIndex:2}}/>
                          {!isDone&&!isPast&&<div style={{position:'absolute',left:`${todayPct}%`,width:`${Math.max(0,tPct-todayPct)}%`,top:'4px',bottom:'4px',borderRadius:'2px',background:`${area.color}35`}}/>}
                          <div style={{position:'absolute',left:`calc(${tPct}% - 8px)`,top:'1px',width:'16px',height:'16px',borderRadius:'50%',background:isDone?area.color:isPast?'#ef4444':area.color,border:'2px solid rgba(0,0,0,0.3)',opacity:isDone?0.5:1,zIndex:3,boxShadow:isDone?'none':`0 0 10px ${area.color}70`}}/>
                        </div>
                        <div style={{fontSize:'10px',color:isPast?'#f87171':WD,flexShrink:0,width:'38px',textAlign:'right'}}>{g.targetDate?.slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Goals list — scrollable */}
          <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:'8px',minHeight:0,paddingRight:'4px'}}>
            {goals.length===0&&(
              <div style={{padding:'32px',textAlign:'center',color:WD,fontSize:'14px',fontStyle:'italic'}}>No goals yet — chat to add some!</div>
            )}
            {goals.map(g=>{
              const ga=actions.filter(a=>a.goalId===g.id);
              const doneAct=ga.filter(a=>a.status==='done').length;
              const isC=collapsed[g.id];
              const isDone=g.status==='done';
              return(
                <div key={g.id} style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${isDone?area.color+'30':area.color+'25'}`,borderRadius:'10px',overflow:'hidden'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'11px 14px',cursor:'pointer'}} onClick={()=>toggle(g.id)}>
                    <button onClick={e=>{e.stopPropagation();onToggleGoal&&onToggleGoal(g.id,g.status);}}
                      style={{width:'18px',height:'18px',borderRadius:'50%',flexShrink:0,border:`2px solid ${isDone?area.color:'rgba(255,255,255,0.3)'}`,background:isDone?area.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:0,color:'white',fontSize:'10px',fontWeight:700,transition:'all .15s'}}>
                      {isDone?'✓':''}
                    </button>
                    <div style={{flex:1,fontSize:'14px',color:isDone?WD:W,fontWeight:600,textDecoration:isDone?'line-through':'none',lineHeight:'1.3'}}>{g.title}</div>
                    {g.targetDate&&<div style={{fontSize:'11px',color:WD,flexShrink:0}}>{g.targetDate}</div>}
                    {ga.length>0&&<div style={{fontSize:'11px',color:doneAct===ga.length?'#34d399':WD,flexShrink:0,marginLeft:'4px'}}>{doneAct}/{ga.length}</div>}
                    <div style={{fontSize:'11px',color:WD,flexShrink:0,marginLeft:'4px'}}>{isC?'▶':'▼'}</div>
                  </div>
                  {!isC&&(
                    <div style={{padding:'0 14px 12px 42px',display:'flex',flexDirection:'column',gap:'5px'}}>
                      {ga.map(a=>(
                        <div key={a.id} style={{display:'flex',alignItems:'center',gap:'9px',padding:'6px 10px',borderRadius:'7px',background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)'}}>
                          <button onClick={()=>onToggleAction&&onToggleAction(a.id,a.status)}
                            style={{width:'15px',height:'15px',borderRadius:'3px',flexShrink:0,border:`1.5px solid ${a.status==='done'?area.color:'rgba(255,255,255,0.3)'}`,background:a.status==='done'?area.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:0,color:'white',fontSize:'9px',transition:'all .15s'}}>
                            {a.status==='done'?'✓':''}
                          </button>
                          <div style={{flex:1,fontSize:'13px',color:a.status==='done'?WD:WM,textDecoration:a.status==='done'?'line-through':'none'}}>{a.title}</div>
                          {a.dueDate&&<div style={{fontSize:'11px',color:WD,flexShrink:0}}>{a.dueDate}</div>}
                        </div>
                      ))}
                      {ga.length===0&&<div style={{fontSize:'12px',color:WD,fontStyle:'italic'}}>No actions yet — ask the planner to add some</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Area chat */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',borderLeft:`1px solid ${area.color}15`,paddingLeft:'18px'}}>
          <div style={{fontSize:'11px',fontWeight:700,color:WD,marginBottom:'10px',letterSpacing:'0.1em',flexShrink:0}}>FOCUS CHAT · {area.name.toUpperCase()}</div>
          <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:'10px',minHeight:0}}>
            {msgs.length===0&&!streaming&&(
              <div style={{padding:'32px 16px',textAlign:'center'}}>
                <div style={{fontSize:'28px',marginBottom:'10px',color:area.color}}>◎</div>
                <div style={{fontSize:'15px',color:W,marginBottom:'8px',fontWeight:600}}>Focused on {area.name}</div>
                <div style={{fontSize:'13px',color:WM,lineHeight:'1.7'}}>Ask me to review your progress, challenge your goals, suggest next actions, or help you work through obstacles in this area.</div>
              </div>
            )}
            {msgs.map(m=>(
              <div key={m.id} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                <div style={{maxWidth:'90%',padding:'10px 14px',borderRadius:m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',fontSize:'14px',lineHeight:'1.7',background:m.role==='user'?`${area.color}25`:'rgba(255,255,255,0.05)',border:m.role==='user'?`1px solid ${area.color}45`:'1px solid rgba(255,255,255,0.1)',color:W,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{m.content}</div>
              </div>
            ))}
            {streaming&&(
              <div style={{display:'flex',justifyContent:'flex-start'}}>
                <div style={{maxWidth:'90%',padding:'10px 14px',borderRadius:'16px 16px 16px 4px',fontSize:'14px',lineHeight:'1.7',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:W,whiteSpace:'pre-wrap'}}>
                  {streamText||'…'}<span style={{display:'inline-block',width:'3px',height:'14px',background:area.color,marginLeft:'2px',verticalAlign:'text-bottom',animation:'pulse 0.8s ease-in-out infinite'}}/>
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
          <div style={{marginTop:'10px',display:'flex',gap:'6px',flexShrink:0}}>
            <textarea style={{flex:1,padding:'10px 14px',background:'rgba(255,255,255,0.05)',border:`1px solid ${area.color}35`,borderRadius:'12px',fontSize:'14px',color:W,resize:'none',minHeight:'42px',maxHeight:'110px',lineHeight:'1.5',fontFamily:'inherit',outline:'none'}}
              placeholder={`Ask about your ${area.name} goals…`}
              value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAreaMsg(input);}}} rows={1}/>
            <button onClick={()=>sendAreaMsg(input)} disabled={streaming||!input.trim()||!apiKey}
              style={{width:'40px',height:'40px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:streaming||!input.trim()||!apiKey?'rgba(99,102,241,0.2)':`linear-gradient(135deg,${area.color},${area.color}cc)`,color:'white',fontSize:'18px',cursor:streaming?'default':'pointer',border:'none',fontWeight:'bold'}}>↑</button>
          </div>
          {!apiKey&&<div style={{fontSize:'11px',color:WD,marginTop:'5px',textAlign:'center'}}>Add API key in Settings to enable chat</div>}
        </div>
      </div>
    </div>
  );
}

function PlannerCardsView({planner,onSelect,selectedId,onOpenArea}){
  const areas=planner.areas||[],goals=planner.goals||[],actions=planner.actions||[];
  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'12px'}}>
      {areas.map(area=>{
        const ag=goals.filter(g=>g.areaId===area.id&&g.status!=='archived');
        const active=ag.filter(g=>g.status==='active');
        const done=ag.filter(g=>g.status==='done').length;
        const totalAct=actions.filter(a=>ag.some(g=>g.id===a.goalId)).length;
        const doneAct=actions.filter(a=>ag.some(g=>g.id===a.goalId)&&a.status==='done').length;
        const pct=totalAct>0?Math.round(doneAct/totalAct*100):0;
        return(
          <div key={area.id} style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${area.color}25`,borderRadius:'12px',padding:'12px',borderTop:`3px solid ${area.color}`,display:'flex',flexDirection:'column',gap:'8px',cursor:'pointer',transition:'background .15s'}}
            onClick={()=>onOpenArea&&onOpenArea(area.id)}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}>
            {/* Area header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontSize:'11px',fontWeight:700,color:area.color,letterSpacing:'0.08em'}}>{area.name.toUpperCase()}</div>
              <div style={{fontSize:'10px',color:'#94a3b8'}}>{done}/{ag.length} done</div>
            </div>
            {/* Progress bar */}
            <div style={{height:'3px',borderRadius:'2px',background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,borderRadius:'2px',background:area.color,transition:'width .3s'}}/>
            </div>
            {/* Goals list — all of them */}
            {ag.length===0&&<div style={{fontSize:'12px',color:'#94a3b8',fontStyle:'italic'}}>No goals yet — open to add some</div>}
            {ag.map(g=>{
              const ga=actions.filter(a=>a.goalId===g.id),dA=ga.filter(a=>a.status==='done').length;
              return(
                <div key={g.id} onClick={e=>{e.stopPropagation();onSelect('goal',g.id);}} style={{padding:'7px 9px',borderRadius:'7px',background:selectedId===g.id?`${area.color}20`:'rgba(255,255,255,0.04)',border:`1px solid ${selectedId===g.id?area.color+'40':'rgba(255,255,255,0.07)'}`,cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                    <div style={{width:'7px',height:'7px',borderRadius:'50%',flexShrink:0,background:g.status==='done'?area.color:'transparent',border:`1.5px solid ${g.status==='done'?area.color:'rgba(255,255,255,0.35)'}`}}/>
                    <div style={{fontSize:'12px',color:g.status==='done'?'#94a3b8':'#f1f5f9',fontWeight:500,lineHeight:'1.3',textDecoration:g.status==='done'?'line-through':'none',flex:1}}>{g.title}</div>
                    {ga.length>0&&<div style={{fontSize:'10px',color:dA===ga.length?area.color:'#94a3b8',flexShrink:0}}>{dA}/{ga.length}</div>}
                  </div>
                  {g.targetDate&&<div style={{fontSize:'10px',color:'#94a3b8',marginTop:'2px',marginLeft:'14px'}}>{g.targetDate}</div>}
                </div>
              );
            })}
            {/* Open prompt */}
            <div style={{fontSize:'10px',color:area.color,opacity:0.7,textAlign:'center',marginTop:'2px'}}>Open area →</div>
          </div>
        );
      })}
    </div>
  );
}

function PlannerTimelineView({planner,onSelect,onToggleGoal,onOpenArea}){
  const allGoals=(planner.goals||[]).filter(g=>g.targetDate&&g.status!=='archived'),areas=planner.areas||[],actions=planner.actions||[];
  const areaIds=areas.map(a=>a.id);
  const [visibleAreas,setVisibleAreas]=useState(()=>new Set(areaIds));
  const toggleArea=id=>setVisibleAreas(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const goals=allGoals.filter(g=>visibleAreas.has(g.areaId)||(g.areaId===undefined&&visibleAreas.size>0));
  if(!allGoals.length)return<div style={{textAlign:'center',padding:'40px',color:'#334155',fontSize:'12px'}}>No goals with target dates. Ask the planner to set some!</div>;
  const now=new Date();
  const msStart=new Date(now.getFullYear(),now.getMonth(),1).getTime();
  const msEnd=new Date(now.getFullYear(),now.getMonth()+12,1).getTime();
  const totalMs=msEnd-msStart;
  const todayPct=Math.min(100,Math.max(0,((now.getTime()-msStart)/totalMs)*100));
  const months=[];for(let i=0;i<12;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1);months.push({label:d.toLocaleDateString('en',{month:'short',year:i===0||i===11?'2-digit':undefined})});}
  const LABEL_W=120,META_W=90,ROW_H=38;
  const groupedByArea=areas.map(area=>({area,goals:goals.filter(g=>g.areaId===area.id)})).filter(g=>g.goals.length>0);
  const renderGoalRow=(g,area,isLast)=>{
    const isDone=g.status==='done';
    const color=area?.color||'#6366f1';
    const targetMs=new Date(g.targetDate+'T12:00:00').getTime();
    const targetPct=Math.max(1,Math.min(99,((targetMs-msStart)/totalMs)*100));
    const isPast=targetMs<now.getTime()&&!isDone;
    const ga=actions.filter(a=>a.goalId===g.id);
    const doneAct=ga.filter(a=>a.status==='done').length;
    // bar start: clamp to 0 if target is in past, else use today
    const barStartPct=isPast?0:todayPct;
    return(
      <div key={g.id} style={{display:'flex',alignItems:'center',height:`${ROW_H}px`,gap:'0',borderBottom:isLast?'none':`1px solid rgba(255,255,255,0.025)`}}>
        {/* Done toggle */}
        <div style={{width:`${LABEL_W}px`,flexShrink:0,display:'flex',alignItems:'center',gap:'7px',paddingRight:'10px',justifyContent:'flex-end'}}>
          <button onClick={e=>{e.stopPropagation();onToggleGoal&&onToggleGoal(g.id,g.status);}}
            style={{width:'16px',height:'16px',borderRadius:'50%',flexShrink:0,border:`2px solid ${isDone?color:'rgba(255,255,255,0.2)'}`,background:isDone?color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:0,color:'white',fontSize:'9px',fontWeight:700,transition:'all .15s'}}>
            {isDone?'✓':''}
          </button>
          <div onClick={()=>onSelect('goal',g.id)} title={g.title}
            style={{fontSize:'11px',color:isDone?'#334155':'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:isDone?'line-through':'none',cursor:'pointer',maxWidth:'88px',textAlign:'right'}}>
            {g.title}
          </div>
        </div>
        {/* Track */}
        <div style={{flex:1,height:'28px',position:'relative',background:'rgba(255,255,255,0.015)',borderLeft:'1px solid rgba(255,255,255,0.04)',cursor:'pointer'}} onClick={()=>onSelect('goal',g.id)}>
          {/* Today line */}
          <div style={{position:'absolute',left:`${todayPct}%`,top:0,bottom:0,width:'2px',background:'rgba(99,102,241,0.55)',zIndex:3}}/>
          {/* Filled bar */}
          {isDone?(
            <div style={{position:'absolute',left:'4px',right:'4px',top:'8px',height:'12px',borderRadius:'6px',background:`${color}30`,border:`1px solid ${color}40`}}/>
          ):(
            <div style={{position:'absolute',left:`${barStartPct}%`,width:`${Math.max(0,targetPct-barStartPct)}%`,top:'8px',height:'12px',borderRadius:'0 6px 6px 0',background:isPast?'rgba(239,68,68,0.18)':`linear-gradient(90deg,${color}18,${color}40)`,border:`1px solid ${isPast?'rgba(239,68,68,0.3)':color+'35'}`}}/>
          )}
          {/* Target marker */}
          <div style={{position:'absolute',left:`${targetPct}%`,top:'4px',width:'20px',height:'20px',transform:'translateX(-50%)',zIndex:4}}>
            <div style={{width:'20px',height:'20px',borderRadius:'50%',background:isDone?`${color}80`:isPast?'rgba(239,68,68,0.7)':color,border:`2.5px solid ${isDone?'rgba(255,255,255,0.25)':isPast?'#ef4444':'rgba(255,255,255,0.2)'}`,boxShadow:isDone?'none':isPast?'0 0 8px rgba(239,68,68,0.5)':`0 0 12px ${color}70`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',color:'white',fontWeight:700}}>
              {isDone?'✓':isPast?'!':''}
            </div>
          </div>
          {/* Overdue label */}
          {isPast&&<div style={{position:'absolute',left:`calc(${Math.min(targetPct,80)}% + 14px)`,top:'7px',fontSize:'9px',color:'#f87171',fontWeight:700,whiteSpace:'nowrap'}}>overdue</div>}
        </div>
        {/* Meta: actions + date */}
        <div style={{width:`${META_W}px`,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'flex-end',paddingLeft:'10px',paddingRight:'4px',gap:'2px'}}>
          {ga.length>0&&<div style={{fontSize:'10px',color:doneAct===ga.length?'#10b981':'#475569',fontWeight:doneAct===ga.length?700:400}}>{doneAct}/{ga.length} actions</div>}
          <div style={{fontSize:'10px',color:isPast?'#f87171':'#334155'}}>{g.targetDate?.slice(5)}</div>
        </div>
      </div>
    );
  };
  return(
    <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
      {/* Area filter chips */}
      <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'14px'}}>
        {areas.map(area=>{
          const on=visibleAreas.has(area.id);
          return(
            <button key={area.id} onClick={()=>toggleArea(area.id)}
              style={{display:'flex',alignItems:'center',gap:'5px',padding:'4px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:600,cursor:'pointer',transition:'all .15s',background:on?`${area.color}20`:'rgba(255,255,255,0.03)',border:`1px solid ${on?area.color+'50':'rgba(255,255,255,0.08)'}`,color:on?area.color:'#334155'}}>
              <div style={{width:'7px',height:'7px',borderRadius:'50%',background:on?area.color:'#334155'}}/>
              {area.name}
            </button>
          );
        })}
      </div>
      {/* Timeline grid */}
      <div style={{overflowX:'auto'}}>
        <div style={{minWidth:'680px'}}>
          {/* Month headers row */}
          <div style={{display:'flex',marginLeft:`${LABEL_W}px`,marginRight:`${META_W}px`,marginBottom:'4px'}}>
            {months.map((m,i)=>(
              <div key={i} style={{flex:1,fontSize:'10px',color:'#475569',borderLeft:'1px solid rgba(255,255,255,0.05)',paddingLeft:'5px',fontWeight:500,paddingBottom:'4px'}}>{m.label}</div>
            ))}
          </div>
          {/* Today label */}
          <div style={{marginLeft:`${LABEL_W}px`,marginRight:`${META_W}px`,position:'relative',height:'14px',marginBottom:'8px'}}>
            <div style={{position:'absolute',left:`${todayPct}%`,transform:'translateX(-50%)',fontSize:'9px',color:'#6366f1',fontWeight:800,letterSpacing:'0.06em',whiteSpace:'nowrap'}}>▼ TODAY</div>
          </div>
          {/* Area sections */}
          {groupedByArea.map(({area,goals:ag},si)=>(
            <div key={area.id} style={{marginBottom:'20px',borderRadius:'10px',overflow:'hidden',border:`1px solid ${area.color}20`,boxShadow:`inset 0 0 0 1px ${area.color}08`}}>
              {/* Section header */}
              <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px',background:`${area.color}10`,borderBottom:`1px solid ${area.color}20`,cursor:'pointer'}} onClick={()=>onOpenArea&&onOpenArea(area.id)}>
                <div style={{width:'10px',height:'10px',borderRadius:'50%',background:area.color,flexShrink:0,boxShadow:`0 0 8px ${area.color}80`}}/>
                <div style={{fontSize:'12px',fontWeight:700,color:area.color,letterSpacing:'0.06em',flex:1}}>{area.name.toUpperCase()}</div>
                <div style={{fontSize:'10px',color:area.color,opacity:0.7}}>{ag.filter(g=>g.status==='done').length}/{ag.length} complete</div>
                <div style={{fontSize:'10px',color:area.color,opacity:0.5,marginLeft:'8px'}}>Open ›</div>
              </div>
              {/* Goal rows */}
              <div style={{background:'rgba(255,255,255,0.008)'}}>
                {ag.map((g,i)=>renderGoalRow(g,area,i===ag.length-1))}
              </div>
            </div>
          ))}
          {goals.filter(g=>!areas.find(a=>a.id===g.areaId)).map(g=>renderGoalRow(g,null,false))}
        </div>
      </div>
    </div>
  );
}

function PlannerTreeView({planner,onSelect,selectedId}){
  const areas=planner.areas||[],goals=planner.goals||[],actions=planner.actions||[];
  const [collapsed,setCollapsed]=useState({});
  const toggle=id=>setCollapsed(c=>({...c,[id]:!c[id]}));
  return(
    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
      {areas.map(area=>{
        const ag=goals.filter(g=>g.areaId===area.id&&!g.parentGoalId&&g.status!=='archived'),isC=collapsed[area.id];
        return(
          <div key={area.id}>
            <button onClick={()=>toggle(area.id)} style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',textAlign:'left',padding:'6px 10px',borderRadius:'8px',background:`${area.color}10`,border:`1px solid ${area.color}22`,cursor:'pointer',marginBottom:'3px'}}>
              <span style={{fontSize:'9px',color:area.color,width:'8px'}}>{isC?'▶':'▼'}</span>
              <span style={{fontSize:'12px',fontWeight:700,color:area.color}}>{area.name}</span>
              <span style={{marginLeft:'auto',fontSize:'10px',color:'#475569'}}>{ag.length} goal{ag.length!==1?'s':''}</span>
            </button>
            {!isC&&ag.map(g=>{
              const ga=actions.filter(a=>a.goalId===g.id),isGC=collapsed[g.id];
              return(
                <div key={g.id} style={{marginLeft:'16px',marginBottom:'2px'}}>
                  <button onClick={()=>{toggle(g.id);onSelect('goal',g.id);}} style={{display:'flex',alignItems:'center',gap:'7px',width:'100%',textAlign:'left',padding:'5px 8px',borderRadius:'6px',background:selectedId===g.id?'rgba(255,255,255,0.07)':'transparent',border:`1px solid ${selectedId===g.id?'rgba(255,255,255,0.1)':'transparent'}`,cursor:'pointer'}}>
                    {ga.length?<span style={{fontSize:'9px',color:'#475569',width:'8px'}}>{isGC?'▶':'▼'}</span>:<span style={{width:'8px'}}/>}
                    <span style={{fontSize:'12px',color:'#e2e8f0'}}>{g.title}</span>
                    {g.targetDate&&<span style={{marginLeft:'auto',fontSize:'10px',color:'#334155'}}>{g.targetDate}</span>}
                  </button>
                  {!isGC&&ga.map(a=>(
                    <button key={a.id} onClick={()=>onSelect('action',a.id)} style={{display:'flex',alignItems:'center',gap:'6px',marginLeft:'18px',width:'calc(100% - 18px)',textAlign:'left',padding:'3px 7px',borderRadius:'5px',cursor:'pointer'}}>
                      <span style={{fontSize:'10px',color:a.status==='done'?'#10b981':'#334155'}}>{a.status==='done'?'✓':'○'}</span>
                      <span style={{fontSize:'11px',color:a.status==='done'?'#475569':'#94a3b8',textDecoration:a.status==='done'?'line-through':'none'}}>{a.title}</span>
                      {a.dueDate&&<span style={{marginLeft:'auto',fontSize:'10px',color:'#334155'}}>{a.dueDate}</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const CADENCE_DAYS={weekly:7,biweekly:14,monthly:30,quarterly:90};
function PlannerPeopleView({planner,onSelect,selectedId,onScheduleCheckin}){
  const people=planner.people||[];
  const [schedulingFor,setSchedulingFor]=useState(null);
  const [checkinDate,setCheckinDate]=useState('');
  if(!people.length)return<div style={{textAlign:'center',padding:'40px',color:'#334155',fontSize:'12px'}}>No people tracked yet. Tell the planner about someone you want to stay in touch with.</div>;
  const ws=people.map(p=>{const days=p.lastInteraction?Math.floor((Date.now()-new Date(p.lastInteraction))/86400000):null,cd=CADENCE_DAYS[p.cadence]||30;return{...p,days,overdue:days!==null&&days>cd,urgent:days!==null&&days>cd*1.5};}).sort((a,b)=>{if(a.urgent&&!b.urgent)return -1;if(!a.urgent&&b.urgent)return 1;if(a.overdue&&!b.overdue)return -1;if(!a.overdue&&b.overdue)return 1;return(b.days||0)-(a.days||0);});
  const todayStr=new Date().toISOString().slice(0,10);
  return(
    <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
      {ws.map(p=>(
        <div key={p.id} style={{borderRadius:'10px',background:selectedId===p.id?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.02)',border:`1px solid ${p.urgent?'rgba(239,68,68,0.3)':p.overdue?'rgba(245,158,11,0.3)':'rgba(255,255,255,0.06)'}`,overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',cursor:'pointer'}} onClick={()=>onSelect(p.id)}>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:p.urgent?'rgba(239,68,68,0.15)':p.overdue?'rgba(245,158,11,0.15)':'rgba(99,102,241,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:700,color:p.urgent?'#f87171':p.overdue?'#fcd34d':'#818cf8',flexShrink:0}}>{p.name[0]?.toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'13px',color:'#e2e8f0',fontWeight:500}}>{p.name}</div>
              <div style={{fontSize:'11px',color:'#475569'}}>{p.relationship} · {p.cadence}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0,marginRight:'8px'}}>
              {p.days===null?<div style={{fontSize:'11px',color:'#334155'}}>Never logged</div>:<><div style={{fontSize:'12px',fontWeight:600,color:p.urgent?'#f87171':p.overdue?'#fcd34d':'#6ee7b7'}}>{p.days}d ago</div>{p.overdue&&<div style={{fontSize:'10px',color:'#334155'}}>Overdue</div>}</>}
            </div>
            <button onClick={e=>{e.stopPropagation();setSchedulingFor(schedulingFor===p.id?null:p.id);setCheckinDate(todayStr);}}
              style={{flexShrink:0,padding:'4px 8px',borderRadius:'6px',fontSize:'10px',fontWeight:600,color:schedulingFor===p.id?'#6ee7b7':'#6366f1',background:schedulingFor===p.id?'rgba(16,185,129,0.12)':'rgba(99,102,241,0.1)',border:`1px solid ${schedulingFor===p.id?'rgba(16,185,129,0.3)':'rgba(99,102,241,0.25)'}`,cursor:'pointer',whiteSpace:'nowrap'}}>
              {schedulingFor===p.id?'Cancel':'☎ Schedule'}
            </button>
          </div>
          {schedulingFor===p.id&&(
            <div onClick={e=>e.stopPropagation()} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 12px 10px',borderTop:'1px solid rgba(255,255,255,0.05)',background:'rgba(255,255,255,0.015)'}}>
              <span style={{fontSize:'11px',color:'#64748b',flexShrink:0}}>Check-in date:</span>
              <input type="date" value={checkinDate} onChange={e=>setCheckinDate(e.target.value)}
                style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'6px',padding:'4px 8px',color:'#e2e8f0',fontSize:'12px',colorScheme:'dark',outline:'none'}}/>
              <button onClick={()=>{if(checkinDate&&onScheduleCheckin){onScheduleCheckin(p.id,checkinDate);setSchedulingFor(null);}}}
                style={{flexShrink:0,padding:'4px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,color:'white',background:'linear-gradient(90deg,#6366f1,#8b5cf6)',border:'none',cursor:'pointer'}}>
                Add to Calendar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HabitsSubtab({data, setData, toasts}){
  const habits = data.habits || [];
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('indigo');

  const today = new Date().toISOString().slice(0,10);
  // last 7 days
  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().slice(0,10); });
  const dayLabels = last7.map(d=>{ const dt=new Date(d+'T12:00:00'); return dt.toLocaleDateString('en',{weekday:'short'}); });

  function addHabit(){
    if(!newName.trim()) return;
    setData(d=>({...d, habits:[...(d.habits||[]),{id:uid(),name:newName,color:newColor,completions:[]}]}));
    setNewName(''); setShowAdd(false); toasts.push('Habit added');
  }
  function toggleDay(hid, dateStr){
    setData(d=>({...d, habits:(d.habits||[]).map(h=>{
      if(h.id!==hid) return h;
      const cs = h.completions||[];
      const has = cs.includes(dateStr);
      return {...h, completions: has? cs.filter(c=>c!==dateStr) : [...cs,dateStr]};
    })}));
  }
  function removeHabit(hid){ setData(d=>({...d, habits:(d.habits||[]).filter(h=>h.id!==hid)})); }

  const colorMap = {indigo:'bg-indigo-500',violet:'bg-violet-500',emerald:'bg-emerald-500',rose:'bg-rose-500',amber:'bg-amber-500',cyan:'bg-cyan-500'};

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button className="px-3 py-1 rounded bg-indigo-600" onClick={()=>setShowAdd(true)}>+ Add Habit</button>
      </div>

      {habits.length===0 && <div className="text-center opacity-50 mt-12">No habits yet  -  add one to start tracking.</div>}

      <div className="glass rounded border-subtle overflow-hidden">
        {/* header row */}
        <div className="grid items-center border-b border-white/5 px-4 py-2" style={{gridTemplateColumns:'1fr repeat(7,2.5rem)'}}>
          <div className="text-xs opacity-50">Habit</div>
          {dayLabels.map((dl,i)=> (
            <div key={i} className={`text-center text-xs ${last7[i]===today?'text-indigo-400 font-semibold':'opacity-50'}`}>{dl}</div>
          ))}
        </div>
        {habits.map(h=> {
          const streak = (() => { let s=0; const d=new Date(); while(true){ const ds=d.toISOString().slice(0,10); if(!(h.completions||[]).includes(ds)) break; s++; d.setDate(d.getDate()-1); } return s; })();
          return (
            <div key={h.id} className="grid items-center border-b border-white/5 px-4 py-3 hover:bg-white/2 group" style={{gridTemplateColumns:'1fr repeat(7,2.5rem)'}}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${colorMap[h.color]||'bg-indigo-500'}`}></div>
                <span className="text-sm">{h.name}</span>
                {streak>0 && <span className="text-xs text-amber-400 ml-1">🔥{streak}</span>}
                <button className="ml-auto opacity-0 group-hover:opacity-60 hover:opacity-100 text-xs px-1" onClick={()=>removeHabit(h.id)}>×</button>
              </div>
              {last7.map(dateStr=> {
                const done = (h.completions||[]).includes(dateStr);
                return (
                  <div key={dateStr} className="flex justify-center">
                    <button
                      onClick={()=>toggleDay(h.id,dateStr)}
                      className={`w-7 h-7 rounded-full border transition-all ${done? (colorMap[h.color]||'bg-indigo-500')+' border-transparent' : 'border-white/20 hover:border-white/40'}`}
                      title={dateStr}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setShowAdd(false)}></div>
          <div className="glass p-5 rounded z-50 w-80 flex flex-col gap-3">
            <h3 className="font-semibold">New Habit</h3>
            <input className="w-full p-2 bg-transparent border border-white/10 rounded" placeholder="Habit name" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') addHabit(); }} />
            <div className="flex gap-2 flex-wrap">
              {Object.keys(colorMap).map(c=> (
                <button key={c} onClick={()=>setNewColor(c)} className={`w-7 h-7 rounded-full ${colorMap[c]} ${newColor===c?'ring-2 ring-white/70':''}`} />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded" onClick={()=>setShowAdd(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-indigo-600" onClick={addHabit}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- Stock Picks Widget -------------------- */
const STOCK_POOL = [
  {
    ticker:'NVDA', name:'NVIDIA Corporation', sector:'Semiconductors', tags:['AI Infrastructure','High Growth'],
    summary:'Near-monopoly on AI training hardware at the epicenter of the largest infrastructure buildout in tech history.',
    thesis:`NVIDIA's H100 and Blackwell GPU architectures are backlogged 12+ months, with Microsoft, Google, Amazon, and Meta collectively committing hundreds of billions in AI capex through 2026. The data center segment now represents over 85% of revenue, growing triple-digits year-over-year. CUDA's decade-long developer ecosystem creates a software moat that AMD and Intel are years behind replicating.\n\nThe Blackwell Ultra and Rubin architectures suggest NVIDIA is pulling 2–3 years ahead of competitors on performance-per-watt. Sovereign AI spending (governments building national AI infrastructure) adds an entirely new demand vector beyond hyperscalers. Risks include US export restrictions on advanced chips to China, customer concentration, and valuation compression if AI capex sentiment reverses.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/NVDA'},{label:'Recent News',url:'https://news.google.com/search?q=NVIDIA+NVDA+stock+AI+chips'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/NVDA'},{label:'Investor Relations',url:'https://investor.nvidia.com/'}]
  },
  {
    ticker:'MSFT', name:'Microsoft Corporation', sector:'Cloud / Software', tags:['Cloud','AI','Defensive'],
    summary:'Azure cloud growth plus deep OpenAI integration makes Microsoft the enterprise AI stack of record.',
    thesis:`Microsoft's $13B OpenAI investment gives it exclusive access to frontier models baked directly into Azure, Office 365, GitHub Copilot, and Dynamics. The result is an AI-first enterprise suite with switching costs so high that most Fortune 500 companies effectively cannot leave. Azure is the #2 cloud provider globally and gaining share in AI workloads.\n\nCopilot at $30/seat/month on top of existing M365 subscriptions — for a company with 400M+ commercial seats, even 10% penetration represents ~$14B in incremental annual revenue. Risks include antitrust scrutiny of the OpenAI relationship and the possibility that open-source models commoditize the AI layer.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/MSFT'},{label:'Recent News',url:'https://news.google.com/search?q=Microsoft+MSFT+Azure+Copilot+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/MSFT'},{label:'Investor Relations',url:'https://www.microsoft.com/en-us/investor'}]
  },
  {
    ticker:'BRK-B', name:'Berkshire Hathaway B', sector:'Conglomerate', tags:['Value','Defensive','Dividend'],
    summary:'Buffett\'s all-weather conglomerate with $330B+ in cash reserves and a 60-year track record of capital allocation.',
    thesis:`Berkshire's $330B+ cash pile — the largest in corporate history — gives it unmatched optionality to deploy capital into a recession or transformative acquisition. The insurance float (~$170B) is effectively free leverage compounded at 20%+ annually for decades. Core holdings like BNSF Railroad, Berkshire Hathaway Energy, and GEICO provide durable cash flows uncorrelated with tech cycles.\n\nIn an environment of elevated valuations, BRK-B acts as a capital-preservation vehicle with equity-like upside. Risks include succession uncertainty post-Buffett, the challenge of deploying capital at scale, and underperformance in sustained bull markets.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/BRK-B'},{label:'Recent News',url:'https://news.google.com/search?q=Berkshire+Hathaway+Buffett+BRK'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/BRK.B'},{label:'Annual Letters',url:'https://www.berkshirehathaway.com/letters/letters.html'}]
  },
  {
    ticker:'META', name:'Meta Platforms', sector:'Digital Advertising', tags:['AI','Advertising','Social'],
    summary:'Dominant ad duopoly with Instagram Reels monetization accelerating and Ray-Ban AI glasses as the next hardware platform.',
    thesis:`Meta controls roughly 20% of global digital advertising spend across Facebook, Instagram, and WhatsApp — a reach of 3.3 billion daily active users. AI-driven ad targeting (Advantage+) is driving click-through rates 30–50% above prior baselines, and Reels monetization now matches Stories.\n\nRay-Ban Meta AI glasses sold out repeatedly and represent the leading contender for the first mass-market AI wearable. WhatsApp Business (1B+ business users) is barely monetized — a massive revenue unlock as Meta rolls out commerce features. Risks include EU regulatory pressure and Reality Labs burning ~$15B/year.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/META'},{label:'Recent News',url:'https://news.google.com/search?q=Meta+Platforms+META+stock+AI+advertising'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/META'},{label:'Investor Relations',url:'https://investor.fb.com/'}]
  },
  {
    ticker:'PLTR', name:'Palantir Technologies', sector:'AI Software', tags:['AI','Government','Enterprise'],
    summary:'First pure-play AI software company to achieve GAAP profitability, with AIP bridging foundation models to real enterprise operations.',
    thesis:`Palantir's AI Platform (AIP) connects foundation models to live data pipelines, compliance workflows, and decision systems — not just a chatbot layer. The US government business (defense, intelligence) provides a high-margin, sticky revenue floor. Commercial revenue is now the growth engine, up 55%+ YoY in the US.\n\nThe AIP "bootcamp" sales model — 5-day workshops where clients build working AI applications — has become a flywheel for contract conversion. Palantir is uniquely positioned for regulated industries where most AI vendors struggle. Risks include high valuation multiples and dependence on government contract cycles.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/PLTR'},{label:'Recent News',url:'https://news.google.com/search?q=Palantir+PLTR+AIP+stock+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/PLTR'},{label:'Investor Relations',url:'https://investors.palantir.com/'}]
  },
  {
    ticker:'AMZN', name:'Amazon.com Inc.', sector:'Cloud / E-Commerce', tags:['Cloud','Advertising','Logistics'],
    summary:'AWS margin expansion and a rapidly growing advertising business are transforming Amazon into a high-margin cash machine.',
    thesis:`AWS generates ~60% of total operating income on ~17% of revenue — and margin is expanding as AI workloads displace legacy compute. The advertising business ($50B+ run rate) sits on top of the highest-intent shopping data in the world, making it structurally superior to most ad platforms.\n\nPrime's logistics network is a 15-year, $300B+ capital investment no competitor can replicate. Same-day delivery is now available to 65%+ of US customers. Internationally, Amazon is still sub-scale in SE Asia, India, and Latin America — the next decade of growth. Risks include AWS competition from Azure and regulatory pressure on the marketplace.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/AMZN'},{label:'Recent News',url:'https://news.google.com/search?q=Amazon+AMZN+AWS+stock+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/AMZN'},{label:'Investor Relations',url:'https://ir.aboutamazon.com/'}]
  },
  {
    ticker:'GOOGL', name:'Alphabet Inc.', sector:'Search / Cloud / AI', tags:['AI','Search','Cloud','Advertising'],
    summary:'Search monopoly with Gemini AI integration, YouTube dominance, and Google Cloud accelerating — a diversified AI powerhouse at a reasonable multiple.',
    thesis:`Google processes 8.5 billion searches per day and monetizes every one — a distribution advantage that no AI startup can replicate. Gemini integration across Search, Workspace, and Android lets Google layer AI on top of its existing usage without disrupting the ad flywheel. Google Cloud is the #3 provider but growing the fastest in AI workloads thanks to TPU hardware and Vertex AI.\n\nYouTube (2.7B monthly users) is the world's largest video platform and its ad revenue is still undermonetized relative to engagement. Waymo is a wildcard with fully autonomous robotaxi rides expanding in major US cities. Risks include AI search disrupting its own ad model, antitrust breakup risk, and regulatory headwinds in the EU.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/GOOGL'},{label:'Recent News',url:'https://news.google.com/search?q=Alphabet+Google+GOOGL+AI+Gemini+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/GOOGL'},{label:'Investor Relations',url:'https://abc.xyz/investor/'}]
  },
  {
    ticker:'TSLA', name:'Tesla Inc.', sector:'EV / AI / Energy', tags:['AI','Robotics','Energy','EV'],
    summary:'The only vertically integrated EV + AI + energy company in the world, with Full Self-Driving and Optimus as long-term optionality.',
    thesis:`Tesla is simultaneously an EV manufacturer, AI company, energy storage business, and robotics pioneer — making traditional valuation frameworks largely insufficient. The Supercharger network (now the US standard after Ford and GM adoptions) is a durable infrastructure moat. Energy storage (Megapack) is growing faster than automotive and at higher margins.\n\nFull Self-Driving subscriber revenue is nascent but could scale dramatically with a robotaxi launch. Optimus (humanoid robot) production is ramping with the goal of millions of units — potentially the largest revenue opportunity in company history. Risks include competition from BYD in China, margin pressure from price cuts, and execution risk on FSD and Optimus timelines.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/TSLA'},{label:'Recent News',url:'https://news.google.com/search?q=Tesla+TSLA+FSD+Optimus+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/TSLA'},{label:'Investor Relations',url:'https://ir.tesla.com/'}]
  },
  {
    ticker:'AAPL', name:'Apple Inc.', sector:'Consumer Tech / Services', tags:['Services','Hardware','AI','Ecosystem'],
    summary:'The world\'s most profitable consumer brand, transitioning from hardware cycles to a high-margin recurring services business.',
    thesis:`Apple's 2.2 billion active device install base is the most valuable consumer ecosystem in the world. Services (App Store, Apple TV+, iCloud, Apple Pay, Apple Card) generate 75%+ gross margins and are growing 15%+ annually — transforming Apple from a hardware cyclical into a software compounder. Apple Intelligence (on-device AI) differentiates hardware in ways that competitors cannot quickly replicate.\n\nThe Vision Pro headset and a potential Apple Car represent hardware optionality bets. Apple Pay and financial services (Apple Card, Apple Savings) are early-stage but growing rapidly. Risks include China revenue concentration (~20% of revenue), antitrust pressure on App Store fees, and the challenge of sustaining premium pricing in a maturing smartphone market.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/AAPL'},{label:'Recent News',url:'https://news.google.com/search?q=Apple+AAPL+services+AI+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/AAPL'},{label:'Investor Relations',url:'https://investor.apple.com/'}]
  },
  {
    ticker:'AMD', name:'Advanced Micro Devices', sector:'Semiconductors', tags:['AI','Chips','Data Center'],
    summary:'The best-positioned NVIDIA alternative for AI compute, with MI300X GPUs gaining traction and x86 CPU market share continuing to grow.',
    thesis:`AMD's MI300X GPU is the only chip competitive with NVIDIA's H100 for certain AI inference workloads, and Microsoft, Meta, and Google are actively deploying it at scale to reduce NVDA dependency. The x86 CPU business (Ryzen, EPYC) continues taking market share from Intel, which is structurally disadvantaged on manufacturing. EPYC server CPUs are now the preferred choice for most major hyperscalers.\n\nThe combination of CPU + GPU gives AMD a unique cross-sell opportunity in the data center. AMD is 2–3 years behind NVIDIA on the software ecosystem (ROCm vs. CUDA), but hyperscalers are investing heavily to close that gap. Risks include CUDA moat, China export restrictions, and execution risk on future GPU roadmap.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/AMD'},{label:'Recent News',url:'https://news.google.com/search?q=AMD+Advanced+Micro+Devices+MI300+GPU+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/AMD'},{label:'Investor Relations',url:'https://ir.amd.com/'}]
  },
  {
    ticker:'ASML', name:'ASML Holding', sector:'Semiconductor Equipment', tags:['Monopoly','Semiconductors','Deep Tech'],
    summary:'The only company in the world that makes EUV lithography machines — the indispensable tool for making every advanced chip on the planet.',
    thesis:`ASML holds a literal monopoly on extreme ultraviolet (EUV) lithography — the machines required to manufacture chips at 7nm and below. Every advanced chip from TSMC, Samsung, and Intel is made on ASML equipment. The technology took 30+ years and billions in R&D to develop; no other company is close. This creates a durable, sovereign-grade competitive moat.\n\nNext-generation High-NA EUV machines (priced at $380M each) extend ASML's lead by enabling the next decade of Moore's Law progress. As AI infrastructure investment surges, semiconductor capital expenditures rise with it — and ASML captures a cut of every new fab built globally. Risks include US-Dutch export restrictions on sales to China and customer concentration at TSMC.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/ASML'},{label:'Recent News',url:'https://news.google.com/search?q=ASML+EUV+lithography+semiconductor+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/ASML'},{label:'Investor Relations',url:'https://www.asml.com/en/investors'}]
  },
  {
    ticker:'TSM', name:'Taiwan Semiconductor Mfg.', sector:'Chip Foundry', tags:['Monopoly','AI','Semiconductors'],
    summary:'Manufactures ~90% of the world\'s most advanced chips — Apple, NVIDIA, AMD, Qualcomm all depend on TSMC\'s fabs.',
    thesis:`TSMC's 3nm and 2nm process nodes are 2–3 generations ahead of Samsung Foundry and 5+ years ahead of Intel Foundry. Every company designing AI chips (NVIDIA, AMD, Google TPU, Apple) relies on TSMC to actually manufacture them. This makes TSMC the picks-and-shovels play on AI hardware without the product cycle risk of any individual chip designer.\n\nThe Arizona fab construction (with $6.6B in US CHIPS Act subsidies) reduces geopolitical concentration risk. Pricing power is structural — customers have no credible alternative at advanced nodes. Risks include Taiwan geopolitical risk (China), customer concentration, and the enormous capital requirements of leading-edge fabs.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/TSM'},{label:'Recent News',url:'https://news.google.com/search?q=TSMC+TSM+semiconductor+AI+foundry+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/TSM'},{label:'Investor Relations',url:'https://investor.tsmc.com/'}]
  },
  {
    ticker:'CRWD', name:'CrowdStrike Holdings', sector:'Cybersecurity', tags:['AI','Cybersecurity','SaaS'],
    summary:'The AI-native cybersecurity platform winning enterprise endpoint and cloud security at the expense of legacy players.',
    thesis:`CrowdStrike's Falcon platform is the only cybersecurity solution built cloud-native and AI-first from day one — giving it a structural advantage over legacy vendors like Symantec and McAfee that retrofitted AI onto aging architectures. The platform now covers endpoints, cloud workloads, identity, and SIEM/SOC — a security data lake that gets more powerful with each new module added.\n\nNet retention rates above 120% indicate customers consistently expand their CrowdStrike footprint once deployed. The ARR consolidation story (replacing 5–10 vendors with a single platform) is a massive TAM expansion opportunity. Risks include enterprise cybersecurity spend slowdowns, the July 2024 incident damaging near-term sales cycles, and competition from Microsoft Defender.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/CRWD'},{label:'Recent News',url:'https://news.google.com/search?q=CrowdStrike+CRWD+Falcon+cybersecurity+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/CRWD'},{label:'Investor Relations',url:'https://ir.crowdstrike.com/'}]
  },
  {
    ticker:'APP', name:'AppLovin Corporation', sector:'Mobile Advertising', tags:['AI','Advertising','Mobile'],
    summary:'AI-powered mobile advertising platform that is quietly compounding at triple digits, flying under most investors\' radars.',
    thesis:`AppLovin's AXON AI advertising engine has driven revenue growth from $2.8B to $4.7B in a single year — a rate that puts it among the fastest-growing large-cap companies in the US. The platform connects mobile game developers with advertisers through an AI matching system that outperforms Meta's ad network for gaming verticals.\n\nThe e-commerce ad expansion (moving from mobile gaming to all app categories) is the next growth vector, potentially doubling the addressable market. Software segment gross margins exceed 70% and are climbing. Risks include algorithmic ad platform volatility, competition from Meta and Google, and concentration of revenue in the mobile gaming category.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/APP'},{label:'Recent News',url:'https://news.google.com/search?q=AppLovin+APP+AXON+advertising+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/APP'},{label:'Investor Relations',url:'https://ir.applovin.com/'}]
  },
  {
    ticker:'LLY', name:'Eli Lilly and Company', sector:'Pharmaceuticals', tags:['GLP-1','Biotech','Obesity'],
    summary:'Owns two of the three most important drugs in the world right now — Mounjaro and Zepbound — in the obesity treatment revolution.',
    thesis:`Eli Lilly's GLP-1 drugs (tirzepatide) for diabetes and obesity are among the fastest-adopted pharmaceuticals in history. Mounjaro (diabetes) and Zepbound (obesity) generated $5B+ in combined quarterly revenue and are still supply-constrained — Lilly is spending $18B+ on manufacturing expansion to meet demand. The obesity market alone is estimated to reach $100B+ annually within a decade.\n\nBeyond GLP-1, Lilly has a deep pipeline in Alzheimer's (donanemab), cancer, and immune diseases. The company's oncology pipeline includes multiple Phase 3 assets that could become multi-billion-dollar franchises. Risks include GLP-1 patent cliffs, manufacturing execution, competitive pressure from Novo Nordisk's Ozempic/Wegovy, and pricing pressure from US drug price negotiation.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/LLY'},{label:'Recent News',url:'https://news.google.com/search?q=Eli+Lilly+LLY+GLP-1+Mounjaro+obesity+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/LLY'},{label:'Investor Relations',url:'https://investor.lilly.com/'}]
  },
  {
    ticker:'NVO', name:'Novo Nordisk A/S', sector:'Pharmaceuticals', tags:['GLP-1','Biotech','Obesity'],
    summary:'The Danish pharma giant that created the GLP-1 category and still commands 60%+ market share with Ozempic and Wegovy.',
    thesis:`Novo Nordisk pioneered GLP-1 receptor agonists and remains the dominant market leader with Ozempic (diabetes) and Wegovy (obesity). The company generates ~60% of its revenue from GLP-1 medications, and global demand is still far exceeding supply. New formulations (once-monthly injections, oral pills) could expand the addressable market dramatically by removing injection barriers.\n\nNovo is investing in cardiovascular disease, NASH, and rare disease pipelines that reduce dependence on GLP-1 long-term. Denmark's largest company by far, Novo trades at a discount to Lilly despite comparable GLP-1 exposure. Risks include Lilly's tirzepatide competition, next-generation GLP-1 from AstraZeneca and Roche, and European drug pricing regulation.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/NVO'},{label:'Recent News',url:'https://news.google.com/search?q=Novo+Nordisk+NVO+Ozempic+Wegovy+GLP-1+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/NVO'},{label:'Investor Relations',url:'https://www.novonordisk.com/investors.html'}]
  },
  {
    ticker:'COIN', name:'Coinbase Global', sector:'Crypto Infrastructure', tags:['Crypto','Fintech','Regulated'],
    summary:'The dominant regulated crypto exchange in the US — structured to win regardless of which cryptocurrencies ultimately win.',
    thesis:`Coinbase is the infrastructure layer of the US crypto economy — earning transaction fees, custody fees, and interest income regardless of whether Bitcoin, Ethereum, or another asset wins. The regulatory clarity from Bitcoin ETF approvals and a more crypto-friendly US administration has materially de-risked the business model that dominated bearish sentiment for years.\n\nBase (Coinbase's Ethereum L2 chain) is growing rapidly and represents an early stake in the on-chain economy. Institutional custody is expanding as traditional finance adopts crypto infrastructure. Risks include crypto market cyclicality (revenue is highly correlated to BTC price), regulatory reversals, and competition from Kraken and Binance globally.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/COIN'},{label:'Recent News',url:'https://news.google.com/search?q=Coinbase+COIN+crypto+Bitcoin+ETF+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/COIN'},{label:'Investor Relations',url:'https://investor.coinbase.com/'}]
  },
  {
    ticker:'SHOP', name:'Shopify Inc.', sector:'E-Commerce Infrastructure', tags:['E-Commerce','Fintech','AI'],
    summary:'The operating system for independent commerce — powering 10%+ of US e-commerce with embedded payments, logistics, and AI tooling.',
    thesis:`Shopify is the platform that enables any business to sell online — from solo entrepreneurs to enterprise brands like Gymshark, Heinz, and Kylie Cosmetics. The payments business (Shopify Payments, Shopify Capital) is growing faster than the subscription software business and at higher margins, following the SaaS-to-fintech evolution that made Square's ecosystem so durable.\n\nMerchant Solutions (payments, lending, fulfillment) now represent 73%+ of total revenue and are expanding internationally. The partnership with Amazon to integrate Shopify's buy button natively into Amazon is a distribution breakthrough. Risks include macroeconomic sensitivity of small business spending, competition from BigCommerce and WooCommerce, and margin compression during the fulfillment network build-out.`,
    links:[{label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/SHOP'},{label:'Recent News',url:'https://news.google.com/search?q=Shopify+SHOP+e-commerce+payments+earnings'},{label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/SHOP'},{label:'Investor Relations',url:'https://investors.shopify.com/'}]
  },
];

// Seeded daily rotation — deterministic per UTC day, changes every 24h
function getDailyStocks(count=6){
  const dayIdx = Math.floor(Date.now() / 86400000);
  const arr = [...STOCK_POOL];
  let s = (dayIdx ^ 0xdeadbeef) >>> 0;
  for(let i=arr.length-1;i>0;i--){
    s = (Math.imul(s,1664525)+1013904223)>>>0;
    const j=s%(i+1);
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr.slice(0,count);
}

const QUOTES_CACHE_KEY = 'magverse:stockquotes:v2';
const QUOTES_CACHE_TTL = 8 * 60 * 60 * 1000; // 8 hours

const PROXIES = [
  u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

async function proxyFetch(url){
  for(const proxy of PROXIES){
    try{
      const r = await fetch(proxy(url), {signal: AbortSignal.timeout(6000)});
      if(!r.ok) continue;
      const j = await r.json();
      if(j) return j;
    }catch(e){}
  }
  throw new Error('all proxies failed');
}

async function fetchAllQuotes(tickers){
  // Attempt 1: batch v7 quote endpoint
  try{
    const syms = tickers.join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${syms}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent`;
    const j = await proxyFetch(url);
    const result = {};
    (j?.quoteResponse?.result||[]).forEach(q=>{
      result[q.symbol] = {price:q.regularMarketPrice, chg:q.regularMarketChange, pct:q.regularMarketChangePercent};
    });
    if(Object.keys(result).length > 0) return result;
  }catch(e){}

  // Attempt 2: per-ticker v8 chart endpoint
  const result = {};
  await Promise.all(tickers.map(async ticker=>{
    try{
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2d`;
      const j = await proxyFetch(url);
      const meta = j?.chart?.result?.[0]?.meta;
      if(!meta) return;
      const price = meta.regularMarketPrice;
      const prev  = meta.chartPreviousClose || meta.previousClose;
      const chg   = price - prev;
      result[ticker] = {price, chg, pct:(chg/prev)*100};
    }catch(e){}
  }));
  if(Object.keys(result).length > 0) return result;

  throw new Error('all fetch strategies failed');
}

function useStockQuotes(){
  const dayIdx = Math.floor(Date.now() / 86400000);
  const picks = getDailyStocks();
  const tickers = picks.map(s=>s.ticker);
  const cacheKey = `${QUOTES_CACHE_KEY}:${dayIdx}`;
  const [quotes, setQuotes] = useState(()=>{
    try{
      const c = JSON.parse(localStorage.getItem(cacheKey));
      if(c && Date.now()-c.ts < QUOTES_CACHE_TTL) return c.data;
    }catch(e){}
    return {};
  });
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = async (force=false)=>{
    if(!force){
      try{
        const c = JSON.parse(localStorage.getItem(cacheKey));
        if(c && Date.now()-c.ts < QUOTES_CACHE_TTL){ setFetchedAt(new Date(c.ts)); return; }
      }catch(e){}
    }
    setLoading(true); setError(false);
    try{
      const result = await fetchAllQuotes(tickers);
      setQuotes(result);
      const now = Date.now();
      localStorage.setItem(cacheKey, JSON.stringify({ts:now, data:result}));
      setFetchedAt(new Date(now));
    }catch(e){
      setError(true);
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); },[]);

  return {picks, quotes, fetchedAt, loading, error, refetch:()=>load(true)};
}

function StockCard({pick, quote}){
  const [expanded, setExpanded] = useState(false);
  const {ticker,name,sector,tags,summary,thesis,links} = pick;
  const q = quote;
  const up = q && q.chg >= 0;

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)'}}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold">{ticker}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(99,102,241,0.15)',color:'#a5b4fc'}}>{sector}</span>
          </div>
          <div className="text-xs mt-0.5" style={{color:'#64748b'}}>{name}</div>
        </div>
        {q ? (
          <div className="text-right">
            <div className="font-semibold">${q.price.toFixed(2)}</div>
            <div className="text-xs font-medium" style={{color:up?'#34d399':'#f87171'}}>
              {up?'+':''}{q.chg.toFixed(2)} ({up?'+':''}{q.pct.toFixed(2)}%)
            </div>
          </div>
        ) : (
          <div className="skeleton w-20 h-9 rounded-lg"/>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t=>(
          <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(255,255,255,0.05)',color:'#475569'}}>{t}</span>
        ))}
      </div>

      {/* Summary always visible */}
      <p className="text-sm leading-relaxed" style={{color:'#94a3b8'}}>{summary}</p>

      {/* Full thesis */}
      {expanded && (
        <div className="text-sm leading-relaxed space-y-3" style={{color:'#94a3b8'}}>
          {thesis.split('\n\n').map((para,i)=><p key={i}>{para}</p>)}
          <div className="pt-2 flex flex-wrap gap-2">
            {links.map(({label,url})=>(
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc'}}>
                {label} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={()=>setExpanded(e=>!e)}
        className="text-xs font-semibold self-start transition-all hover:opacity-80"
        style={{color:'#6366f1'}}>
        {expanded ? 'Show less ↑' : 'Full thesis + sources ↓'}
      </button>
    </div>
  );
}

function StockPicker({isMobile}){
  const {picks, quotes, fetchedAt, loading, error, refetch} = useStockQuotes();
  const todayLabel = new Date().toLocaleDateString([], {month:'short', day:'numeric'});

  return (
    <div className="mb-10">
      <div className={`flex ${isMobile?'flex-col gap-1':'items-center justify-between'} mb-4`}>
        <div>
          <h3 className="text-base font-bold tracking-tight">Today's Picks</h3>
          <div className="text-xs mt-0.5" style={{color:'#475569'}}>{todayLabel} · rotates daily</div>
        </div>
        <div className="text-xs flex items-center gap-2" style={{color:'#475569'}}>
          {loading && <span style={{color:'#818cf8'}}>Fetching prices…</span>}
          {fetchedAt && !loading && <span>Updated {fetchedAt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>}
          {error && !loading && (
            <button onClick={refetch} className="font-semibold transition-all hover:opacity-80" style={{color:'#f87171'}}>
              ↻ Retry
            </button>
          )}
          <span>· Not financial advice</span>
        </div>
      </div>
      <div className={`grid ${isMobile?'grid-cols-1':'grid-cols-2'} gap-4`}>
        {picks.map(pick=>(
          <StockCard key={pick.ticker} pick={pick} quote={quotes[pick.ticker]}/>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Philosophy Quiz -------------------- */
const PHILOSOPHY_QUESTIONS = [
  "Is free will compatible with determinism? Can you truly be the author of your actions if every choice is the result of prior causes?",
  "What makes an action morally right — its consequences, the intention behind it, or something else entirely?",
  "Can we ever truly know anything with certainty, or is all knowledge ultimately based on assumptions we cannot prove?",
  "What gives life meaning? Is meaning discovered or created, and does it require an audience?",
  "Is morality objective — something that exists independently of human opinion — or is it constructed by culture and society?",
  "What is the self? If your body and memories gradually change over decades, are you the same person you were as a child?",
  "Is it ever morally justified to lie? Does the duty to tell the truth hold even when honesty causes serious harm?",
  "What is justice? Is a just society one that maximizes overall happiness, or one that protects individual rights regardless of outcomes?",
  "Do animals have moral rights? If so, how should we weigh their interests against human interests?",
  "Is death something to be feared? Epicurus argued that death cannot harm us — do you agree?",
  "What is beauty? Is aesthetic judgment purely subjective, or are there objective standards we converge on?",
  "What obligations do we have to future generations who do not yet exist and cannot advocate for themselves?",
  "Does technology expand or diminish human freedom? Can a tool change what it means to be free?",
  "Is democracy the best form of government, or merely the least bad option? What would a truly just political system look like?",
  "What is the relationship between language and thought? Can we think clearly about something we lack words for?",
  "Can science answer all meaningful questions, or are there genuine limits to what empirical inquiry can tell us?",
  "Is it rational to believe in God? What standard of evidence should apply to metaphysical claims?",
  "Do wealthy nations have a moral obligation to help poorer ones, even at real cost to their own citizens?",
  "Is civil disobedience ever morally justified? Under what conditions does breaking the law become a duty?",
  "What is the relationship between happiness and the good life? Can someone live well while being mostly unhappy?",
];

function getPhilosophyQuestion(offset = 0) {
  const dayIdx = Math.floor(Date.now() / 86400000);
  return PHILOSOPHY_QUESTIONS[(dayIdx + offset) % PHILOSOPHY_QUESTIONS.length];
}

function PhilosophyQuiz({ onClose, data }) {
  const isMobile = useIsMobile();
  const [qOffset, setQOffset] = useState(0);
  const question = getPhilosophyQuestion(qOffset);
  // phase: 'prompt' | 'recording' | 'review' | 'grading' | 'result'
  const [phase, setPhase] = useState('prompt');
  const [transcript, setTranscript] = useState('');
  const [liveText, setLiveText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const recogRef = useRef(null);

  const startRecording = () => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) { setError('Speech recognition not supported in this browser.'); return; }
    const r = new R();
    r.lang = 'en-US';
    r.interimResults = true;
    r.continuous = true;
    r.maxAlternatives = 1;
    let accumulated = '';
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) accumulated += t + ' ';
        else interim = t;
      }
      setLiveText(accumulated + interim);
    };
    r.onerror = (e) => {
      if (e.error !== 'no-speech') setError('Mic error: ' + e.error);
      setPhase('prompt');
    };
    r.onend = () => {
      const final = accumulated.trim();
      if (final) { setTranscript(final); setPhase('review'); }
      else setPhase('prompt');
    };
    recogRef.current = r;
    r.start();
    setLiveText('');
    setPhase('recording');
  };

  const stopRecording = () => {
    recogRef.current?.stop();
  };

  const grade = async () => {
    setPhase('grading');
    setError('');
    const savedSettings = ls('magverse:v1')?.settings || {};
    const apiKey = savedSettings.apiKey || '';
    if (!apiKey) {
      setError('Add your Anthropic API key in Settings to enable grading.');
      setPhase('review');
      return;
    }
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system: `You are a demanding but fair philosophy professor grading a student's spoken answer to a philosophy question. Evaluate on: clarity of argument, philosophical depth, use of relevant concepts, and intellectual honesty. Then write a model answer showing what an excellent response looks like. Return ONLY valid JSON in exactly this shape, no extra text:
{"score":7,"grade":"B","summary":"One sentence summary of overall quality.","strengths":"What they got right — 1-2 sentences.","improvements":"What they missed or could deepen — 1-2 sentences.","modelAnswer":"A model answer of 3-5 sentences that demonstrates the ideal philosophical response — covering key thinkers, core arguments, and nuances a strong student would address."}
Scores: 9-10=A, 7-8=B, 5-6=C, 3-4=D, 1-2=F.`,
          messages: [{
            role: 'user',
            content: `Question: ${question}\n\nStudent's answer: ${transcript}`,
          }],
        }),
      });
      if (!resp.ok) { const j = await resp.json(); throw new Error(j.error?.message || 'API error'); }
      const j = await resp.json();
      const raw = j.content[0].text.trim();
      const parsed = JSON.parse(raw);
      setResult(parsed);
      setPhase('result');
    } catch (e) {
      setError('Grading failed: ' + e.message);
      setPhase('review');
    }
  };

  const reset = (newQ = false) => {
    if (newQ) setQOffset(o => o + 1);
    setTranscript('');
    setLiveText('');
    setResult(null);
    setError('');
    setPhase('prompt');
  };

  const gradeColor = (g) => {
    if (g === 'A') return '#6ee7b7';
    if (g === 'B') return '#93c5fd';
    if (g === 'C') return '#fcd34d';
    if (g === 'D') return '#fb923c';
    return '#f87171';
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(5px)'}} onClick={onClose}/>
      <div className={`relative z-50 flex flex-col ${isMobile?'w-full rounded-t-3xl':'rounded-2xl w-[540px] mb-8'}`}
        style={{background:'#12121c',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 -8px 40px rgba(0,0,0,0.8)',maxHeight:'92vh',overflowY:'auto'}}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <div>
              <div className="font-bold text-base">Philosophy</div>
              <div className="text-xs" style={{color:'#475569'}}>Daily Question</div>
            </div>
          </div>
          <button onClick={onClose} style={{color:'#475569',fontSize:'20px',lineHeight:1}}>✕</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Question card */}
          <div className="rounded-2xl p-4" style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.25)'}}>
            <div className="text-xs mb-2 font-semibold tracking-wide" style={{color:'#818cf8'}}>TODAY'S QUESTION</div>
            <div className="text-sm leading-relaxed" style={{color:'#e2e8f0'}}>{question}</div>
          </div>

          {error && <div className="text-xs rounded-xl p-3" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#f87171'}}>{error}</div>}

          {/* Phase: prompt */}
          {phase === 'prompt' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm text-center" style={{color:'#64748b'}}>Press the mic and speak your answer — aim for 30–90 seconds.</p>
              <button onClick={startRecording}
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all"
                style={{background:'rgba(99,102,241,0.2)',border:'2px solid rgba(99,102,241,0.5)',color:'#a5b4fc'}}>
                🎤
              </button>
              <button onClick={()=>reset(true)} className="text-xs transition-all hover:opacity-80" style={{color:'#475569'}}>
                Skip · get new question →
              </button>
            </div>
          )}

          {/* Phase: recording */}
          {phase === 'recording' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm font-semibold" style={{color:'#f87171'}}>Recording… speak your answer</p>
              <div className="relative">
                <span style={{position:'absolute',inset:0,borderRadius:'50%',background:'rgba(239,68,68,0.25)',animation:'pulse 1s ease-in-out infinite'}}/>
                <button onClick={stopRecording}
                  className="relative w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all"
                  style={{background:'rgba(239,68,68,0.8)',border:'2px solid rgba(239,68,68,0.6)',color:'#fff'}}>
                  ■
                </button>
              </div>
              {liveText && (
                <div className="w-full rounded-xl p-3 text-sm italic" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#94a3b8',minHeight:'60px'}}>
                  {liveText}
                </div>
              )}
            </div>
          )}

          {/* Phase: review */}
          {phase === 'review' && (
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-xs mb-1 font-semibold" style={{color:'#475569'}}>YOUR ANSWER</div>
                <div className="rounded-xl p-3 text-sm leading-relaxed" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}>
                  {transcript}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={grade}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.5)',color:'#a5b4fc'}}>
                  Grade my answer
                </button>
                <button onClick={()=>reset(false)}
                  className="px-4 py-2.5 rounded-xl text-sm transition-all"
                  style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b'}}>
                  Redo
                </button>
              </div>
            </div>
          )}

          {/* Phase: grading */}
          {phase === 'grading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="text-2xl" style={{animation:'pulse 1s ease-in-out infinite'}}>⚖️</div>
              <p className="text-sm" style={{color:'#64748b'}}>Grading your answer…</p>
            </div>
          )}

          {/* Phase: result */}
          {phase === 'result' && result && (
            <div className="flex flex-col gap-3">
              {/* Score card */}
              <div className="rounded-2xl p-4 flex items-center gap-4" style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${gradeColor(result.grade)}40`}}>
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl flex-shrink-0"
                  style={{background:`${gradeColor(result.grade)}18`,border:`2px solid ${gradeColor(result.grade)}50`}}>
                  <div className="text-2xl font-black" style={{color:gradeColor(result.grade)}}>{result.grade}</div>
                  <div className="text-xs" style={{color:`${gradeColor(result.grade)}99`}}>{result.score}/10</div>
                </div>
                <div className="text-sm leading-relaxed" style={{color:'#cbd5e1'}}>{result.summary}</div>
              </div>
              {/* Strengths */}
              <div className="rounded-xl p-3" style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)'}}>
                <div className="text-xs font-semibold mb-1" style={{color:'#6ee7b7'}}>STRENGTHS</div>
                <div className="text-sm" style={{color:'#d1fae5'}}>{result.strengths}</div>
              </div>
              {/* Improvements */}
              <div className="rounded-xl p-3" style={{background:'rgba(251,146,60,0.08)',border:'1px solid rgba(251,146,60,0.2)'}}>
                <div className="text-xs font-semibold mb-1" style={{color:'#fb923c'}}>TO DEEPEN</div>
                <div className="text-sm" style={{color:'#fed7aa'}}>{result.improvements}</div>
              </div>
              {/* Model answer */}
              {result.modelAnswer && (
                <div className="rounded-xl p-3" style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.25)'}}>
                  <div className="text-xs font-semibold mb-1" style={{color:'#818cf8'}}>MODEL ANSWER</div>
                  <div className="text-sm leading-relaxed" style={{color:'#c7d2fe'}}>{result.modelAnswer}</div>
                </div>
              )}
              {/* Transcript */}
              <details className="text-xs" style={{color:'#475569'}}>
                <summary className="cursor-pointer mb-1">Your answer</summary>
                <div className="rounded-xl p-2 mt-1" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>{transcript}</div>
              </details>
              <div className="flex gap-2 pt-1">
                <button onClick={()=>reset(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.4)',color:'#a5b4fc'}}>
                  Try again
                </button>
                <button onClick={()=>reset(true)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b'}}>
                  New question
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Deal of the Day -------------------- */
const DEAL_POOL = [
  { id:'d01', title:'Microsoft / Activision Blizzard', announced:'Jan 18, 2022', closed:'Oct 13, 2023', sector:'Technology · Gaming', value:'$69B', type:'Acquisition',
    summary:'Microsoft acquired Activision Blizzard to become the third-largest gaming company by revenue. The deal gave Microsoft a massive content library — Call of Duty, World of Warcraft, Candy Crush — and strengthened its Game Pass subscription. It faced an 18-month antitrust battle across the US, EU, and UK before closing.',
    keyFacts:['Largest gaming acquisition in history','Faced CMA block; Microsoft agreed to cloud-gaming licensing concessions to close','Added ~10,000 employees and ~$8B in annual gaming revenue'] },
  { id:'d02', title:'Elon Musk / Twitter (X)', announced:'Apr 25, 2022', closed:'Oct 27, 2022', sector:'Technology · Social Media', value:'$44B', type:'LBO / Take-Private',
    summary:'Musk took Twitter private at $54.20/share after an erratic public process — offering, then trying to pull out citing bot accounts, then completing under threat of litigation. Funded with $13B of bank debt, $7B from equity co-investors, and $21B personal equity. Post-close, he cut ~80% of staff and rebranded to X.',
    keyFacts:['Debt load of $13B left banks stuck holding leveraged loans at a loss','Twitter/X has never turned an annual profit','Musk\'s stated goal: build an "everything app" modeled on WeChat'] },
  { id:'d03', title:'Amazon / MGM', announced:'May 26, 2021', closed:'Mar 17, 2022', sector:'Technology · Media', value:'$8.5B', type:'Acquisition',
    summary:'Amazon bought MGM primarily for its 4,000-film and 17,000-TV-episode library, including the James Bond franchise, to bulk up Prime Video against Netflix and Disney+. MGM\'s content catalog was seen as dramatically undervalued relative to what streamers were paying per subscriber.',
    keyFacts:['Bond franchise alone valued at ~$2-3B','FTC opposed but ultimately cleared the deal','Amazon\'s third-largest acquisition after Whole Foods and Zappos'] },
  { id:'d04', title:'Salesforce / Slack', announced:'Dec 1, 2020', closed:'Jul 21, 2021', sector:'Enterprise Software', value:'$27.7B', type:'Acquisition',
    summary:'Salesforce acquired Slack to compete with Microsoft Teams in the enterprise collaboration market. The deal valued Slack at a 55% premium. The strategic logic: embed Slack as the front-end interface for the entire Salesforce Customer 360 platform and stop Microsoft from owning the daily workflow of every enterprise employee.',
    keyFacts:['Slack had been losing ground to Teams, which was free with Office 365','Largest Salesforce acquisition ever','CEO Marc Benioff called it "the most strategic deal in the history of Salesforce"'] },
  { id:'d05', title:'Broadcom / VMware', announced:'May 26, 2022', closed:'Nov 22, 2023', sector:'Technology · Enterprise Infrastructure', value:'$69B', type:'Acquisition',
    summary:'Broadcom acquired VMware to transform from a chip company into a diversified infrastructure software platform. The deal followed Broadcom\'s playbook from its CA Technologies and Symantec acquisitions: buy a mature software business, cut costs aggressively, and convert to subscription pricing to drive recurring revenue.',
    keyFacts:['Broadcom immediately restructured VMware into a subscription-only model, angering enterprise customers','Closed after 18 months of regulatory review across US, EU, and China','CEO Hock Tan expected to achieve $8.5B in annualized EBITDA within three years post-close'] },
  { id:'d06', title:'Disney / 21st Century Fox', announced:'Dec 14, 2017', closed:'Mar 20, 2019', sector:'Media & Entertainment', value:'$71B', type:'Acquisition',
    summary:'Disney bought Fox\'s entertainment assets (not news or sports) to bulk up its content library for the Disney+ launch. Disney gained X-Men, Deadpool, Avatar, FX, and National Geographic. This was a defining defensive move: Disney chose to build a streaming business rather than slowly lose the cable bundle.',
    keyFacts:['Comcast bid against Disney, driving the price from $52B to $71B','Disney assumed $19.8B of Fox debt','Marvel can now use X-Men and Fantastic Four characters in the MCU'] },
  { id:'d07', title:'AT&T / Time Warner', announced:'Oct 22, 2016', closed:'Jun 14, 2018', sector:'Telecom · Media', value:'$85B', type:'Vertical Merger',
    summary:'AT&T acquired Time Warner (CNN, HBO, Warner Bros.) to combine a content owner with a distribution network. The DOJ tried to block it on antitrust grounds — an unusual vertical-merger challenge — but AT&T won in court. Four years later AT&T reversed course, spinning out WarnerMedia and merging it with Discovery.',
    keyFacts:['First major vertical merger the DOJ litigated in decades','AT&T paid $107/share, a 35% premium','AT&T ultimately wrote off ~$30B on the deal when it unwound it in 2022'] },
  { id:'d08', title:'AB InBev / SABMiller', announced:'Nov 11, 2015', closed:'Oct 10, 2016', sector:'Consumer Staples · Beverages', value:'$107B', type:'Acquisition',
    summary:'The combination of the world\'s two largest brewers created a company with ~30% global beer market share. To gain regulatory approval AB InBev divested SABMiller\'s US stake in MillerCoors to Molson Coors and sold several other regional brands. The deal was largely synergy-driven: $1.4B in annual cost cuts within four years.',
    keyFacts:['Largest-ever consumer-goods M&A deal at the time','Regulators required divestitures in US, China, Europe, and Africa','AB InBev financed with ~$75B of debt, took years to deleverage'] },
  { id:'d09', title:'Bayer / Monsanto', announced:'Sep 14, 2016', closed:'Jun 7, 2018', sector:'Agriculture · Chemicals', value:'$66B', type:'Acquisition',
    summary:'Bayer bought Monsanto to combine crop protection chemicals with seeds and biotech traits, creating an integrated agriculture platform. The deal has been widely considered one of the worst acquisitions in corporate history: Bayer inherited $10B+ in Roundup/glyphosate litigation and the Monsanto brand was so toxic that Bayer retired it immediately.',
    keyFacts:['Bayer\'s share price fell ~40% in the two years after closing','Over 100,000 Roundup cancer lawsuits filed against Bayer post-acquisition','Bayer wrote down the deal by €9.8B in 2019'] },
  { id:'d10', title:'Dell / EMC', announced:'Oct 12, 2015', closed:'Sep 7, 2016', sector:'Technology · Enterprise Storage', value:'$67B', type:'Acquisition',
    summary:'Dell acquired EMC — including an 80% stake in VMware — to transform from a PC company into an enterprise infrastructure giant. Michael Dell took Dell private in 2013 specifically to execute this kind of long-term bet without public-market pressure. The deal was financed with $49.5B of debt.',
    keyFacts:['Largest technology acquisition in history at the time','VMware\'s public market value alone was ~$33B at close — nearly half the deal price','Dell re-listed publicly in 2018 via a controversial tracking stock conversion'] },
  { id:'d11', title:'CVS Health / Aetna', announced:'Dec 3, 2017', closed:'Nov 28, 2018', sector:'Healthcare · Insurance', value:'$69B', type:'Vertical Merger',
    summary:'CVS bought insurer Aetna to create a vertically integrated healthcare company — combining pharmacy benefits, retail clinics, mail-order pharmacy, and insurance. The logic: reduce healthcare costs by keeping patients within the CVS ecosystem and away from expensive hospitals.',
    keyFacts:['Aetna had 22 million medical members at close','DOJ approved with a condition: Aetna divest its Medicare Part D business','CVS subsequently converted thousands of stores into HealthHUB locations'] },
  { id:'d12', title:'T-Mobile / Sprint', announced:'Apr 29, 2018', closed:'Apr 1, 2020', sector:'Telecom', value:'$26B', type:'Merger',
    summary:'After two failed attempts, T-Mobile and Sprint finally merged, reducing US wireless carriers from four to three. T-Mobile paid 0.10256 of its shares per Sprint share. The deal was approved after T-Mobile committed to deploying a nationwide 5G network and divesting prepaid brand Boost Mobile to DISH.',
    keyFacts:['T-Mobile pledged to deploy 5G to 97% of Americans within 3 years','DISH paid $1.4B for Boost and became a nominal fourth carrier','T-Mobile quickly surpassed AT&T in subscriber additions post-merger'] },
  { id:'d13', title:'Amazon / Whole Foods', announced:'Jun 16, 2017', closed:'Aug 28, 2017', sector:'Retail · Grocery', value:'$13.7B', type:'Acquisition',
    summary:'Amazon entered physical retail by acquiring upscale grocer Whole Foods. On day one of ownership, Amazon cut prices across Whole Foods and began integrating Prime member discounts. The deal was as much about real estate and last-mile logistics as it was about groceries.',
    keyFacts:['Closed 4 weeks after announcement — unusually fast for a deal of this size','Amazon paid $42/share, a 27% premium','Whole Foods revenue has stagnated since acquisition; critics say it was more about strategic signaling than grocery profits'] },
  { id:'d14', title:'Dow Chemical / DuPont', announced:'Dec 11, 2015', closed:'Sep 1, 2017', sector:'Chemicals · Agriculture', value:'$130B', type:'Merger of Equals',
    summary:'Two legacy industrial chemicals giants merged, then immediately announced plans to split into three separate companies: agriculture (Corteva), materials science (Dow), and specialty products (DuPont). This structure-to-break-up deal was explicitly designed to unlock value by separating businesses with different growth profiles.',
    keyFacts:['Took two years from announcement to close due to regulatory review','Resulted in three separately listed companies by 2019','Cost synergies of $3B targeted; break-up itself was estimated to create $4B of value'] },
  { id:'d15', title:'Kraft / Heinz (3G Capital & Berkshire)', announced:'Mar 25, 2015', closed:'Jul 2, 2015', sector:'Consumer Staples · Food', value:'$100B combined entity', type:'Merger',
    summary:'3G Capital and Berkshire Hathaway merged Kraft and Heinz using 3G\'s infamous zero-based budgeting approach — cutting costs to the bone to fund a dividend. The combined company then attempted to buy Unilever for $143B in 2017 (rejected). In 2019, Kraft Heinz took a $15.4B write-down and the model was widely viewed as broken.',
    keyFacts:['3G cut Kraft Heinz headcount by ~13% in the first two years','Kraft Heinz offered $50/share for Unilever in 2017; Unilever refused in 48 hours','Buffett later admitted the Kraft acquisition was a mistake, saying they overpaid'] },
  { id:'d16', title:'Facebook (Meta) / Instagram', announced:'Apr 9, 2012', closed:'Sep 6, 2012', sector:'Technology · Social Media', value:'$1B', type:'Acquisition',
    summary:'Facebook bought the 13-employee photo-sharing app for $1B when it had zero revenue. At the time it was widely mocked as overpriced. By 2018, Instagram was estimated to be worth $100B — 100x what Facebook paid. The deal is now studied as the clearest example of a platform acqui-hire eliminating a competitive threat.',
    keyFacts:['Instagram had 13 employees and $0 revenue at time of acquisition','FTC later tried to unwind the deal in its 2020 antitrust lawsuit against Meta','By 2022, Instagram generated roughly 50% of Meta\'s total advertising revenue'] },
  { id:'d17', title:'Google / YouTube', announced:'Oct 9, 2006', closed:'Nov 13, 2006', sector:'Technology · Media', value:'$1.65B', type:'Acquisition',
    summary:'Google paid $1.65B in stock for 18-month-old YouTube, which had 67 employees and no clear revenue model. The risk: massive copyright liability from user-uploaded content. Google resolved this through licensing deals with major labels. YouTube now generates ~$30B/year in ad revenue and is arguably worth $400B+.',
    keyFacts:['YouTube was burning $1M/day in bandwidth costs at acquisition','Google\'s biggest concern was copyright suits — Universal, Sony, and Warner had all threatened action','Chad Hurley and Steve Chen (founders) each became Google millionaires overnight at 28'] },
  { id:'d18', title:'Nvidia / ARM (terminated)', announced:'Sep 13, 2020', closed:'Feb 8, 2022 (terminated)', sector:'Technology · Semiconductors', value:'$40B', type:'Acquisition (blocked)',
    summary:'Nvidia attempted to buy UK chip designer ARM from SoftBank in the largest semiconductor deal ever. ARM\'s architecture underlies virtually every smartphone chip on earth. The deal was blocked by regulators in the US, UK, and EU on competition grounds — Nvidia is a major ARM licensee and giving it ownership over ARM\'s IP was seen as an existential threat to the entire chip industry.',
    keyFacts:['Blocked by FTC, UK CMA, and EU competition regulators','SoftBank bought ARM for $32B in 2016; ARM IPO\'d in 2023 at a ~$60B valuation','Every major ARM licensee — Apple, Qualcomm, Samsung — opposed the deal'] },
  { id:'d19', title:'Adobe / Figma (terminated)', announced:'Sep 15, 2022', closed:'Dec 18, 2023 (terminated)', sector:'Technology · Design Software', value:'$20B', type:'Acquisition (blocked)',
    summary:'Adobe attempted to buy collaborative design tool Figma for $20B — the highest price ever for a private software company on a revenue multiple basis (50x ARR). The EU and UK blocked it on competition grounds, finding the deal would eliminate the greatest competitive threat to Adobe\'s Creative Cloud. Adobe paid Figma a $1B breakup fee.',
    keyFacts:['50x ARR multiple was unprecedented in SaaS M&A','Figma CEO Dylan Field kept the $1B break-up fee and relaunched Figma independently','Figma subsequently launched AI features that directly competed with Adobe Firefly'] },
  { id:'d20', title:'Walmart / Flipkart', announced:'May 9, 2018', closed:'Aug 18, 2018', sector:'Retail · E-Commerce', value:'$16B (77% stake)', type:'Acquisition',
    summary:'Walmart bought a controlling stake in Indian e-commerce giant Flipkart to compete with Amazon in India\'s massive and fast-growing online retail market. The deal was a direct response to Amazon\'s aggressive India expansion. Flipkart has since grown significantly but still loses money; Walmart is playing a very long game.',
    keyFacts:['Amazon had previously tried to acquire Flipkart but was outbid','SoftBank sold its ~20% stake for a ~$1.5B profit; Tiger Global did the same','Flipkart IPO ambitions have been repeatedly delayed; still privately held as of 2024'] },
];

function getDailyDeal(seenIds){
  const seen = new Set(seenIds || []);
  const start = Math.floor(Date.now() / 86400000) % DEAL_POOL.length;
  for(let i = 0; i < DEAL_POOL.length; i++){
    const deal = DEAL_POOL[(start + i) % DEAL_POOL.length];
    if(!seen.has(deal.id)) return deal;
  }
  return DEAL_POOL[start];
}

const LIVE_DEALS_CACHE_KEY = 'magverse:livedeals:';
function useLiveDeals(){
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    const dayIdx = Math.floor(Date.now() / 86400000);
    const cacheKey = LIVE_DEALS_CACHE_KEY + dayIdx;
    const cached = ls(cacheKey);
    if(cached){ setDeals(cached); return; }

    const savedSettings = ls('magverse:v1')?.settings || {};
    const apiKey = savedSettings.apiKey || '';
    if(!apiKey) return;

    setLoading(true);
    fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key': apiKey,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true',
      },
      body: JSON.stringify({
        model:'claude-haiku-4-5-20251001',
        max_tokens:1200,
        system:'You are a financial data assistant. Return ONLY valid JSON, no markdown, no explanation.',
        messages:[{
          role:'user',
          content:`List 4 significant M&A, private equity, or major corporate deals announced or closed in the past 6 months (as of early 2025). Include real deals with accurate facts. Return a JSON array of objects with exactly these fields: id (string, prefix "live-"), title, announced (e.g. "Mar 4, 2025"), closed (e.g. "Jun 1, 2025" or "pending"), sector, value, type, summary (2-3 sentences), keyFacts (array of 3 strings). Prioritize deals over $5B.`
        }]
      })
    }).then(r=>r.json()).then(j=>{
      try{
        const text = j.content[0].text.trim();
        const parsed = JSON.parse(text);
        if(Array.isArray(parsed) && parsed.length){
          ls(cacheKey, parsed);
          setDeals(parsed);
        }
      }catch(e){}
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  return { deals, loading };
}

function DealCard({deal, onChat, onDismiss, live}){
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-2xl p-4" style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${live?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.08)'}`}}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm leading-tight mb-1.5" style={{color:'#e2e8f0'}}>{deal.title}</div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs px-2 py-0.5 rounded-md" style={{background:'rgba(99,102,241,0.15)',color:'#a5b4fc'}}>{deal.type}</span>
            <span className="text-xs px-2 py-0.5 rounded-md" style={{background:'rgba(255,255,255,0.06)',color:'#64748b'}}>{deal.sector}</span>
            <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{background:'rgba(16,185,129,0.12)',color:'#6ee7b7'}}>{deal.value}</span>
          </div>
          <div className="text-xs mt-1.5 space-x-2" style={{color:'#334155'}}>
            <span>📅 Announced {deal.announced}</span>
            {deal.closed && <span>· Closed {deal.closed}</span>}
          </div>
        </div>
        {live && <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{background:'rgba(16,185,129,0.15)',color:'#6ee7b7',border:'1px solid rgba(16,185,129,0.3)'}}>Recent</span>}
      </div>
      <p className="text-xs leading-relaxed mb-2" style={{color:'#94a3b8'}}>{deal.summary}</p>
      {expanded && (
        <div className="mb-2 space-y-1">
          {deal.keyFacts.map((f,i)=>(
            <div key={i} className="flex gap-2 text-xs" style={{color:'#cbd5e1'}}>
              <span style={{color:'#6366f1',flexShrink:0}}>▸</span><span>{f}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <button onClick={onChat}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.4)',color:'#a5b4fc'}}>
          Ask questions →
        </button>
        <button onClick={()=>setExpanded(e=>!e)}
          className="px-2.5 py-1.5 rounded-xl text-xs transition-all"
          style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:'#475569'}}>
          {expanded?'Less ↑':'Key facts ↓'}
        </button>
        {onDismiss && <button onClick={onDismiss}
          className="px-2.5 py-1.5 rounded-xl text-xs transition-all ml-auto"
          style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',color:'#334155'}}>
          Seen it →
        </button>}
      </div>
    </div>
  );
}

function DealOfDay({data, setData, isMobile}){
  const [dealOffset, setDealOffset] = useState(0);
  const { deals: liveDeals, loading: liveLoading } = useLiveDeals();
  const [chatDeal, setChatDeal] = useState(null);
  const seenCount = (data.seenDeals||[]).length;

  // Build pool starting from today's seed so offset 0 is "today's deal"
  const start = Math.floor(Date.now() / 86400000) % DEAL_POOL.length;
  const orderedPool = Array.from({length: DEAL_POOL.length}, (_,i) => DEAL_POOL[(start+i) % DEAL_POOL.length]);
  const deal = orderedPool[dealOffset % DEAL_POOL.length];
  const total = DEAL_POOL.length;

  const markSeen = (id) => setData(d=>({...d, seenDeals:[...new Set([...(d.seenDeals||[]),id])]}));
  const prev = () => setDealOffset(o => (o - 1 + total) % total);
  const next = () => setDealOffset(o => (o + 1) % total);

  const makeDealHub = (d) => ({
    id: 'deal-hub-'+d.id,
    emoji: '🏦',
    name: d.title,
    system: `${NO_MARKDOWN}\n\nYou are a senior McKinsey M&A partner and former investment banker. The deal under discussion: ${d.title} — announced ${d.announced}${d.closed?', closed '+d.closed:''}. Value: ${d.value}. Type: ${d.type}. Sector: ${d.sector}. Context: ${d.summary} Key facts: ${d.keyFacts.join('. ')}. Answer questions with the depth and directness of a top-tier advisor — strategy, valuation, regulatory dynamics, synergies, mistakes, what bankers were actually thinking. Give your real opinion. Don't hedge.`,
  });

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold tracking-tight">Deal of the Day</h3>
          <div className="text-xs mt-0.5" style={{color:'#475569'}}>
            {liveLoading ? 'fetching recent…' : liveDeals.length ? `${liveDeals.length} recent deals loaded` : 'recent deals via Claude'}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b'}}>‹</button>
          <span className="text-xs px-1.5" style={{color:'#475569'}}>{dealOffset + 1} / {total}</span>
          <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b'}}>›</button>
        </div>
      </div>

      {/* Current deal */}
      <DealCard deal={deal} onChat={()=>setChatDeal(deal)} onDismiss={()=>markSeen(deal.id)} />

      {/* Live deals */}
      {liveDeals.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="text-xs font-semibold" style={{color:'#475569'}}>RECENT DEALS · updated daily via Claude</div>
          {liveDeals.map(d=>(
            <DealCard key={d.id} deal={d} onChat={()=>setChatDeal(d)} live />
          ))}
        </div>
      )}

      {chatDeal && <ChatDrawer hub={makeDealHub(chatDeal)} onClose={()=>setChatDeal(null)} data={data} setData={setData} toasts={[]} />}
    </div>
  );
}

/* -------------------- Learning Hub Panel -------------------- */
function buildCareerHubSystem(baseSystem, data){
  const planner = data?.planner;
  if(!planner) return baseSystem;
  // Pull active career-related goals from all areas — surface any with career keywords or the Career area
  const careerAreaIds = (planner.areas||[])
    .filter(a=>/career|work|job|intern|consult|strateg|profession/i.test(a.name+' '+(a.description||'')))
    .map(a=>a.id);
  const activeGoals = (planner.goals||[]).filter(g=>
    (careerAreaIds.includes(g.areaId) || /career|intern|consult|strateg|bain|mckinsey|oliver|bofa|bank/i.test(g.title)) &&
    g.status!=='archived' && g.status!=='done'
  );
  if(!activeGoals.length) return baseSystem;
  const actions = planner.actions||[];
  const plannerCtx = activeGoals.map(g=>({
    goal: g.title,
    targetDate: g.targetDate||null,
    openActions: actions.filter(a=>a.goalId===g.id&&a.status!=='done').map(a=>a.title),
  }));
  return baseSystem + `\n\nCURRENT CAREER PLAN (from Life Planner, as of today):\n${JSON.stringify(plannerCtx,null,2)}\n\nReference these goals and actions when relevant. Today: ${new Date().toISOString().slice(0,10)}.`;
}

function ChatHubsPanel({data, setData, toasts, isMobile}){
  const [openHub, setOpenHub] = useState(null);
  const hubs = data.hubs || [];
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Learning Hub</h2>
      <StockPicker isMobile={isMobile} />
      <DealOfDay data={data} setData={setData} isMobile={isMobile} />
      <h3 className="text-base font-bold mb-3">AI Assistants</h3>
      <div className={`grid ${isMobile?'grid-cols-2':'grid-cols-3'} gap-4`}>
        {hubs.map(h=> (
          <div key={h.id} className="glass p-4 rounded cursor-pointer" onClick={()=>setOpenHub(h)}>
            <div className="text-3xl">{h.emoji}</div>
            <div className="font-semibold mt-2">{h.name}</div>
            <div className="text-xs opacity-80 mt-1">{h.system.slice(0,80)}...</div>
          </div>
        ))}
      </div>

      {openHub && openHub.id === 'hub1' && <PhilosophyQuiz onClose={()=>setOpenHub(null)} data={data} />}
      {openHub && openHub.id !== 'hub1' && <ChatDrawer hub={openHub} onClose={()=>setOpenHub(null)} data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
    </div>
  );
}

function ChatDrawer({hub, onClose, data, setData, toasts}){
  const historyKey = `magverse:hub:${hub.id}:history`;
  const [messages, setMessages] = useState(()=> ls(historyKey) || []);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const audioRef = useRef(null);
  const speakGenRef = useRef(0);
  const isMobile = useIsMobile();

  useEffect(()=>{ ls(historyKey, messages); }, [messages]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages, typing]);

  const stripMarkdown = (txt) => txt
    .replace(/#{1,6}\s*/g,'')
    .replace(/\*\*\*(.+?)\*\*\*/g,'$1').replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1')
    .replace(/__(.+?)__/g,'$1').replace(/_(.+?)_/g,'$1').replace(/~~(.+?)~~/g,'$1')
    .replace(/`{1,3}[^`]*`{1,3}/g,'').replace(/\[(.+?)\]\(.+?\)/g,'$1')
    .replace(/^>\s*/gm,'').replace(/^[-*+]\s+/gm,'').replace(/^\d+\.\s+/gm,'')
    .replace(/^-{3,}$/gm,'').replace(/→|←|↑|↓|▶|►/g,' ').replace(/\n{3,}/g,'\n\n').trim();

  // Split text into sentence-sized chunks (~200 chars max, break on sentence boundaries)
  const splitSentences = (txt) => {
    const raw = txt.match(/[^.!?]+[.!?]+(\s|$)?/g) || [txt];
    const chunks = [];
    let buf = '';
    for(const s of raw){
      buf += s;
      if(buf.length >= 180){ chunks.push(buf.trim()); buf = ''; }
    }
    if(buf.trim()) chunks.push(buf.trim());
    return chunks.length ? chunks : [txt];
  };

  const fetchTtsUrl = async (text, settings) => {
    const provider = settings.ttsProvider || 'browser';
    if(provider === 'elevenlabs' && settings.elevenLabsKey){
      const voiceId = settings.elevenLabsVoice || '21m00Tcm4TlvDq8ikWAM';
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method:'POST',
        headers:{'xi-api-key':settings.elevenLabsKey,'Content-Type':'application/json'},
        body:JSON.stringify({text,model_id:'eleven_turbo_v2_5',voice_settings:{stability:0.45,similarity_boost:0.75,style:0.3}})
      });
      if(!res.ok) throw new Error('ElevenLabs error '+res.status);
      return URL.createObjectURL(await res.blob());
    }
    if(provider === 'openai' && settings.openaiTtsKey){
      const res = await fetch('https://api.openai.com/v1/audio/speech',{
        method:'POST',
        headers:{'Authorization':'Bearer '+settings.openaiTtsKey,'Content-Type':'application/json'},
        body:JSON.stringify({model:'tts-1',voice:settings.openaiTtsVoice||'nova',input:text,speed:1.25})
      });
      if(!res.ok) throw new Error('OpenAI TTS error '+res.status);
      return URL.createObjectURL(await res.blob());
    }
    return null;
  };

  const playUrl = (url, gen) => new Promise(resolve=>{
    if(speakGenRef.current !== gen){ URL.revokeObjectURL(url); resolve(); return; }
    const audio = new Audio(url);
    audioRef.current = audio;
    const done = ()=>{ URL.revokeObjectURL(url); audioRef.current = null; resolve(); };
    audio.onended = done; audio.onerror = done;
    audio.play().catch(done);
  });

  const speak = async (txt) => {
    const gen = ++speakGenRef.current;
    const clean = stripMarkdown(txt);
    const settings = ls('magverse:v1')?.settings || {};
    const provider = settings.ttsProvider || 'browser';

    if(audioRef.current){ audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
    setSpeaking(true);

    try {
      if((provider==='elevenlabs' && settings.elevenLabsKey) || (provider==='openai' && settings.openaiTtsKey)){
        const chunks = splitSentences(clean);
        // Pipeline: fetch chunk[i+1] while playing chunk[i]
        let currentFetch = fetchTtsUrl(chunks[0], settings);
        let prefetch = chunks.length > 1 ? fetchTtsUrl(chunks[1], settings) : null;
        for(let i = 0; i < chunks.length; i++){
          if(speakGenRef.current !== gen) break;
          const url = await currentFetch;
          currentFetch = prefetch;
          prefetch = (i+2 < chunks.length) ? fetchTtsUrl(chunks[i+2], settings) : null;
          await playUrl(url, gen);
        }
        if(speakGenRef.current === gen) setSpeaking(false);
        return;
      }
    } catch(e){
      console.warn('TTS API failed, falling back to browser TTS:', e.message);
    }

    // Browser TTS fallback
    if(speakGenRef.current !== gen){ setSpeaking(false); return; }
    if(!window.speechSynthesis){ setSpeaking(false); return; }
    const doSpeak = () => {
      if(speakGenRef.current !== gen) return;
      const voices = window.speechSynthesis.getVoices();
      const savedVoiceName = settings.ttsVoice || '';
      const ranked = [
        v => savedVoiceName && v.name === savedVoiceName,
        v => v.name === 'Samantha', v => v.name === 'Karen', v => v.name === 'Daniel',
        v => v.name.includes('Aria') && v.name.includes('Natural'),
        v => v.name.includes('Jenny') && v.name.includes('Natural'),
        v => v.name.includes('Guy') && v.name.includes('Natural'),
        v => v.name.includes('Microsoft Aria'), v => v.name.includes('Microsoft Jenny'),
        v => v.name.includes('Google US English'),
        v => v.lang==='en-US' && v.localService===false,
        v => v.lang==='en-US', v => v.lang.startsWith('en'),
      ];
      let voice = null;
      for(const test of ranked){ voice = voices.find(test); if(voice) break; }
      const utt = new SpeechSynthesisUtterance(clean);
      if(voice) utt.voice = voice;
      utt.rate = 1.15; utt.pitch = 1.0; utt.volume = 1.0;
      utt.onstart = ()=>setSpeaking(true);
      utt.onend = ()=>setSpeaking(false);
      utt.onerror = ()=>setSpeaking(false);
      window.speechSynthesis.speak(utt);
    };
    if(window.speechSynthesis.getVoices().length === 0){
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, {once:true});
    } else { doSpeak(); }
  };

  const cancelSpeak = () => {
    speakGenRef.current++;
    if(audioRef.current){ audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const sendMsg = async (msgText) => {
    const content = (msgText||text).trim();
    if(!content) return;
    const userMsg = {id:uid(), role:'user', text:content, at:new Date().toISOString()};
    setMessages(m=>[...m, userMsg]); setText(''); setTyping(true);
    try{
      const savedSettings = ls('magverse:v1')?.settings || {};
      const apiKey = savedSettings.apiKey || '';
      if(!apiKey){
        await new Promise(r=>setTimeout(r,600));
        const reply = 'Add your Anthropic API key in Settings to enable real AI responses.';
        setMessages(m=>[...m, {id:uid(), role:'ai', text:reply, at:new Date().toISOString()}]);
        setTyping(false); return;
      }

      const PLAIN_REMINDER = ' (Reply in plain spoken sentences only. Absolutely no markdown, no asterisks, no bullet points, no headers, no arrows, no bold, no numbered lists.)';
      const history = [...messages, userMsg].map(m=>({
        role: m.role==='user' ? 'user' : 'assistant',
        content: m.role==='user' ? m.text + PLAIN_REMINDER : m.text,
      }));

      const useApiTts = (savedSettings.ttsProvider==='openai' && savedSettings.openaiTtsKey) ||
                        (savedSettings.ttsProvider==='elevenlabs' && savedSettings.elevenLabsKey);

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          ...(useApiTts && {stream: true}),
          system: hub.id==='hub-career' ? buildCareerHubSystem(hub.system, data) : hub.system,
          messages: history,
        })
      });

      if(!resp.ok){ const j=await resp.json(); throw new Error(j.error?.message||'API error'); }

      const cleanText = (raw) => raw
        .replace(/#{1,6}\s*/g,'').replace(/\*\*\*(.+?)\*\*\*/g,'$1').replace(/\*\*(.+?)\*\*/g,'$1')
        .replace(/\*(.+?)\*/g,'$1').replace(/__(.+?)__/g,'$1').replace(/_(.+?)_/g,'$1')
        .replace(/`{1,3}[^`]*`{1,3}/g,'').replace(/\[(.+?)\]\(.+?\)/g,'$1')
        .replace(/^>\s*/gm,'').replace(/^[-*+]\s+/gm,'').replace(/^\d+\.\s+/gm,'')
        .replace(/^-{3,}$/gm,'').replace(/→|←|↑|↓/g,'').replace(/\|.+\|/g,'')
        .replace(/\n{3,}/g,'\n\n').trim();

      if(useApiTts){
        // ── Streaming path: pipe sentences to TTS as Claude generates them ──
        const gen = ++speakGenRef.current;
        if(audioRef.current){ audioRef.current.pause(); audioRef.current = null; }
        setSpeaking(true);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let fullRaw = '';
        let sentenceBuf = '';
        let playChain = Promise.resolve(); // sequential playback promise chain
        const botId = uid();
        setTyping(false);
        setMessages(m=>[...m, {id:botId, role:'ai', text:'…', at:new Date().toISOString()}]);

        const enqueueSentence = (sentence) => {
          const s = sentence.trim();
          if(!s || speakGenRef.current !== gen) return;
          const urlPromise = fetchTtsUrl(s, savedSettings);
          playChain = playChain.then(async ()=>{
            if(speakGenRef.current !== gen) return;
            try{ const url = await urlPromise; await playUrl(url, gen); } catch(e){}
          });
        };

        try{
          while(true){
            const {done, value} = await reader.read();
            if(done) break;
            const lines = decoder.decode(value).split('\n');
            for(const line of lines){
              if(!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if(data==='[DONE]') break;
              try{
                const ev = JSON.parse(data);
                if(ev.type==='content_block_delta' && ev.delta?.type==='text_delta'){
                  const token = ev.delta.text;
                  fullRaw += token;
                  sentenceBuf += token;
                  // Fire TTS as soon as we hit a sentence boundary
                  const m = sentenceBuf.match(/^([\s\S]*[.!?])\s+([\s\S]*)$/);
                  if(m){ enqueueSentence(m[1]); sentenceBuf = m[2]; }
                  // Update displayed text live
                  const live = cleanText(fullRaw);
                  setMessages(msgs => msgs.map(x => x.id===botId ? {...x, text: live||'…'} : x));
                }
              }catch(e){}
            }
          }
        }finally{ reader.cancel?.(); }

        if(sentenceBuf.trim()) enqueueSentence(sentenceBuf);
        const finalOut = cleanText(fullRaw) || '(no response)';
        setMessages(msgs => msgs.map(x => x.id===botId ? {...x, text: finalOut} : x));
        playChain.then(()=>{ if(speakGenRef.current===gen) setSpeaking(false); });

      } else {
        // ── Non-streaming path (browser TTS or no TTS provider) ──
        const j = await resp.json();
        if(j.error) throw new Error(j.error.message||'API error');
        const out = cleanText(j?.content?.[0]?.text || '(no response)');
        setMessages(m=>[...m, {id:uid(), role:'ai', text:out, at:new Date().toISOString()}]);
        setTyping(false);
        speak(out);
        return;
      }
    }catch(e){
      const errMsg = 'Error: '+String(e.message||e);
      setMessages(m=>[...m, {id:uid(), role:'ai', text:errMsg, at:new Date().toISOString()}]);
    }finally{ setTyping(false); }
  };

  const dict = useDictation((t)=>{ setListening(false); sendMsg(t); });
  const startVoice = ()=>{ dict.start(); setListening(true); };

  const clear = ()=>{ cancelSpeak(); setMessages([]); toasts.push('Session cleared'); };

  return (
    <div className={`fixed top-0 bottom-0 right-0 z-50 flex flex-col ${isMobile?'w-full':'w-[460px]'}`}
      style={{background:'#13131a',borderLeft:'1px solid rgba(255,255,255,0.07)',boxShadow:'-8px 0 40px rgba(0,0,0,0.5)'}}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:'rgba(255,255,255,0.07)'}}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">{hub.emoji}</div>
          <div>
            <div className="font-bold">{hub.name}</div>
            <div className="text-xs" style={{color:'#475569'}}>AI Assistant</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {speaking && <button onClick={cancelSpeak} className="px-2 py-1 rounded-lg text-xs font-medium" style={{background:'rgba(248,113,113,0.15)',color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>■ Stop</button>}
          <button onClick={clear} className="px-2 py-1 rounded-lg text-xs hover:bg-white/5" style={{color:'#64748b'}}>Clear</button>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10" style={{color:'#64748b'}}>×</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
        {messages.length===0 && (
          <div className="text-center mt-12" style={{color:'#334155'}}>
            <div className="text-4xl mb-3">{hub.emoji}</div>
            <div className="text-sm font-medium">{hub.name}</div>
            <div className="text-xs mt-1">Ask me anything</div>
          </div>
        )}
        {messages.map(m=>(
          <div key={m.id} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
            <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
              style={m.role==='user'
                ?{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',borderRadius:'18px 18px 4px 18px'}
                :{background:'rgba(255,255,255,0.05)',color:'#e2e8f0',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'18px 18px 18px 4px'}}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)'}}>
              <div className="flex gap-1.5 items-center">
                {[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full" style={{background:'#6366f1',animation:`float1 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t" style={{borderColor:'rgba(255,255,255,0.07)'}}>
        {listening && <div className="text-xs text-center mb-2" style={{color:'#818cf8'}}>Listening… speak now</div>}
        <div className="flex gap-2 items-end">
          <textarea
            className="flex-1 p-3 rounded-2xl text-sm resize-none focus:outline-none transition-all"
            style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',maxHeight:'120px'}}
            onFocus={e=>e.target.style.borderColor='rgba(99,102,241,0.5)'}
            onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'}
            rows={1} value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMsg(); } }}
            placeholder="Message…" />
          {HAS_SPEECH_API && (
            <button onClick={startVoice}
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{background:listening?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:listening?'#818cf8':'#64748b'}}>
              {IconMic()}
            </button>
          )}
          <button onClick={()=>sendMsg()}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white'}}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Settings Panel -------------------- */
const ELEVENLABS_VOICES = [
  {id:'21m00Tcm4TlvDq8ikWAM', name:'Rachel (warm, American female)'},
  {id:'AZnzlk1XvdvUeBnXmlld', name:'Domi (strong, American female)'},
  {id:'EXAVITQu4vr4xnSDxMaL', name:'Bella (soft, American female)'},
  {id:'ErXwobaYiN019PkySvjV', name:'Antoni (well-rounded, American male)'},
  {id:'MF3mGyEYCl7XYWbV9V6O', name:'Elli (emotional, American female)'},
  {id:'TxGEqnHWrfWFTfGW9XjX', name:'Josh (deep, American male)'},
  {id:'VR6AewLTigWG4xSOukaG', name:'Arnold (crisp, American male)'},
  {id:'pNInz6obpgDQGcFmaJgB', name:'Adam (deep, American male)'},
  {id:'yoZ06aMxZJJ28mfd3POQ', name:'Sam (raspy, American male)'},
];

function SettingsPanel({data, setData, toasts, lastBackup}){
  const s = data.settings || {};
  const [apiKey, setApiKey] = useState(s.apiKey || '');
  const [accent, setAccent] = useState(s.accent || 'indigo');
  const [name, setName] = useState(s.userName || 'You');
  const [syncEndpoint, setSyncEndpoint] = useState(s.syncEndpoint || '');
  const [syncKey, setSyncKey] = useState(s.syncKey || '');
  const [ttsProvider, setTtsProvider] = useState(s.ttsProvider || 'browser');
  const [ttsVoice, setTtsVoice] = useState(s.ttsVoice || '');
  const [elevenLabsKey, setElevenLabsKey] = useState(s.elevenLabsKey || '');
  const [elevenLabsVoice, setElevenLabsVoice] = useState(s.elevenLabsVoice || '21m00Tcm4TlvDq8ikWAM');
  const [openaiTtsKey, setOpenaiTtsKey] = useState(s.openaiTtsKey || '');
  const [openaiTtsVoice, setOpenaiTtsVoice] = useState(s.openaiTtsVoice || 'nova');
  const [voyageKey, setVoyageKey] = useState(s.voyageKey || '');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(()=>{
    const load = ()=>{
      const v = window.speechSynthesis?.getVoices().filter(v=>v.lang.startsWith('en')) || [];
      setAvailableVoices(v);
    };
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return ()=>window.speechSynthesis?.removeEventListener('voiceschanged', load);
  },[]);

  const testVoice = async ()=>{
    const testText = "Hey, this is what I sound like. Pretty natural, right?";
    setTestLoading(true);
    try {
      if(ttsProvider === 'elevenlabs' && elevenLabsKey){
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoice}`, {
          method:'POST',
          headers:{'xi-api-key':elevenLabsKey,'Content-Type':'application/json'},
          body:JSON.stringify({text:testText,model_id:'eleven_turbo_v2_5',voice_settings:{stability:0.45,similarity_boost:0.75,style:0.3}})
        });
        if(!res.ok) throw new Error('ElevenLabs error '+res.status);
        const blob = await res.blob();
        new Audio(URL.createObjectURL(blob)).play();
      } else if(ttsProvider === 'openai' && openaiTtsKey){
        const res = await fetch('https://api.openai.com/v1/audio/speech',{
          method:'POST',
          headers:{'Authorization':'Bearer '+openaiTtsKey,'Content-Type':'application/json'},
          body:JSON.stringify({model:'tts-1-hd',voice:openaiTtsVoice,input:testText})
        });
        if(!res.ok) throw new Error('OpenAI TTS error '+res.status);
        const blob = await res.blob();
        new Audio(URL.createObjectURL(blob)).play();
      } else {
        if(!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(testText);
        const voice = availableVoices.find(v=>v.name===ttsVoice);
        if(voice) utt.voice = voice;
        utt.rate = 1.15; utt.pitch = 1.0;
        window.speechSynthesis.speak(utt);
      }
    } catch(e){ toasts.push('Test failed: '+e.message); }
    setTestLoading(false);
  };

  const save = ()=>{
    setData(d=>({...d, settings:{...d.settings, apiKey, accent, userName:name, avatarInitial:(name[0]||'Y').toUpperCase(),
      ttsProvider, ttsVoice, elevenLabsKey, elevenLabsVoice, openaiTtsKey, openaiTtsVoice, voyageKey, syncEndpoint, syncKey}}));
    toasts.push('Settings saved');
  };
  const exportAll = ()=>{
    // Collect hub chat histories stored at separate localStorage keys
    const hubHistories = {};
    for(let i = 0; i < localStorage.length; i++){
      const key = localStorage.key(i);
      if(key && key.startsWith('magverse:hub:') && key.endsWith(':history')){
        try{ hubHistories[key] = JSON.parse(localStorage.getItem(key)); }catch(e){}
      }
    }
    const exportObj = { ...data, _hubHistories: hubHistories };
    const json = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([json],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`magverse-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
    toasts.push('Backup downloaded');
  };
  const importData = ()=>{
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e)=>{
      const file = e.target.files[0]; if(!file) return;
      const reader = new FileReader();
      reader.onload = (ev)=>{
        try {
          const parsed = JSON.parse(ev.target.result);
          if(typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid format');
          // Restore hub chat histories to their separate keys
          const hubHistories = parsed._hubHistories || {};
          Object.entries(hubHistories).forEach(([key, val])=>{ localStorage.setItem(key, JSON.stringify(val)); });
          // Restore main data (strip the meta key before saving)
          const { _hubHistories: _ignored, ...mainData } = parsed;
          setData(mainData);
          toasts.push('Data restored from backup');
        } catch(err) { toasts.push('Import failed: ' + err.message); }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  const clearAll = ()=>{ if(!confirm('Clear all data? This cannot be undone.')) return; localStorage.clear(); location.reload(); };
  const resetHubs = ()=>{ if(!confirm('Reset all hub prompts to defaults? Custom edits will be lost.')) return; setData(d=>({...d, hubs:DEFAULT_HUBS()})); toasts.push('Hub prompts reset'); };
  return (
    <div className="glass p-4 rounded border-subtle w-full max-w-2xl space-y-5">
      <h2 className="text-xl font-semibold">Settings</h2>

      {/* General */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{color:'#475569'}}>General</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs opacity-80 mb-1">Anthropic API Key</label>
            <input className="w-full p-2 bg-transparent border border-white/5 rounded" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-..." />
          </div>
          <div>
            <label className="block text-xs opacity-80 mb-1">Voyage AI Key <span className="opacity-50">(Journal graph — optional)</span></label>
            <input className="w-full p-2 bg-transparent border border-white/5 rounded" value={voyageKey} onChange={e=>setVoyageKey(e.target.value)} placeholder="pa-... · voyageai.com" />
          </div>
          <div>
            <label className="block text-xs opacity-80 mb-1">Accent Preset</label>
            <select className="w-full p-2 bg-transparent border border-white/5 rounded" value={accent} onChange={e=>setAccent(e.target.value)}>
              <option value="indigo">Indigo</option><option value="violet">Violet</option>
              <option value="cyan">Cyan</option><option value="rose">Rose</option><option value="amber">Amber</option>
            </select>
          </div>
          <div>
            <label className="block text-xs opacity-80 mb-1">Name</label>
            <input className="w-full p-2 bg-transparent border border-white/5 rounded" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs opacity-80 mb-1">Avatar Initial</label>
            <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center">{(name[0]||'Y').toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* TTS */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{color:'#475569'}}>Voice for AI Responses</div>
        <div className="mb-3">
          <label className="block text-xs opacity-80 mb-1">Provider</label>
          <select className="w-full p-2 bg-transparent border border-white/5 rounded text-sm" value={ttsProvider} onChange={e=>setTtsProvider(e.target.value)}>
            <option value="browser">Browser TTS (built-in, free)</option>
            <option value="elevenlabs">ElevenLabs (most natural — requires API key)</option>
            <option value="openai">OpenAI TTS (very natural — requires API key)</option>
          </select>
        </div>

        {ttsProvider === 'browser' && (
          <div>
            <label className="block text-xs opacity-80 mb-1">Browser Voice</label>
            <div className="flex gap-2">
              <select className="flex-1 p-2 bg-transparent border border-white/5 rounded text-sm" value={ttsVoice} onChange={e=>setTtsVoice(e.target.value)}>
                <option value="">(Auto — best available)</option>
                {availableVoices.map(v=><option key={v.name} value={v.name}>{v.name} {v.localService?'':'🌐'}</option>)}
              </select>
            </div>
            <p className="text-xs mt-1" style={{color:'#334155'}}>On Windows: install Microsoft Neural voices in System Settings → Time & Language → Speech for best quality.</p>
          </div>
        )}

        {ttsProvider === 'elevenlabs' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs opacity-80 mb-1">ElevenLabs API Key</label>
              <input className="w-full p-2 bg-transparent border border-white/5 rounded text-sm" value={elevenLabsKey} onChange={e=>setElevenLabsKey(e.target.value)} placeholder="Free tier: 10k chars/month · elevenlabs.io" />
            </div>
            <div>
              <label className="block text-xs opacity-80 mb-1">Voice</label>
              <select className="w-full p-2 bg-transparent border border-white/5 rounded text-sm" value={elevenLabsVoice} onChange={e=>setElevenLabsVoice(e.target.value)}>
                {ELEVENLABS_VOICES.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {ttsProvider === 'openai' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs opacity-80 mb-1">OpenAI API Key</label>
              <input className="w-full p-2 bg-transparent border border-white/5 rounded text-sm" value={openaiTtsKey} onChange={e=>setOpenaiTtsKey(e.target.value)} placeholder="sk-..." />
            </div>
            <div>
              <label className="block text-xs opacity-80 mb-1">Voice</label>
              <select className="w-full p-2 bg-transparent border border-white/5 rounded text-sm" value={openaiTtsVoice} onChange={e=>setOpenaiTtsVoice(e.target.value)}>
                <option value="nova">Nova (upbeat, female — recommended)</option>
                <option value="shimmer">Shimmer (expressive, female)</option>
                <option value="alloy">Alloy (neutral)</option>
                <option value="echo">Echo (smooth, male)</option>
                <option value="fable">Fable (expressive, British male)</option>
                <option value="onyx">Onyx (deep, male)</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-3">
          <button onClick={testVoice} disabled={testLoading}
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{background:'rgba(99,102,241,0.2)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.3)'}}>
            {testLoading ? 'Loading…' : '▶ Test Voice'}
          </button>
        </div>
      </div>

      {/* Data Backup */}
      <div style={{borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'16px'}}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{color:'#475569'}}>Data Backup</div>
          {lastBackup && (
            <div className="text-xs" style={{color:'#334155'}}>
              Auto-backed up {new Date(lastBackup).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
            </div>
          )}
        </div>
        <p className="text-xs mb-4 leading-relaxed" style={{color:'#64748b'}}>
          All your data is stored in this browser. Auto-backup writes to IndexedDB every 5 s. Export a JSON file to save externally or restore on another device.
        </p>
        <div className="flex gap-3 flex-wrap mb-4">
          <button onClick={exportAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{background:'rgba(99,102,241,0.18)',color:'#a5b4fc',border:'1px solid rgba(99,102,241,0.3)'}}>
            ↓ Export Backup
          </button>
          <button onClick={importData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{background:'rgba(16,185,129,0.15)',color:'#34d399',border:'1px solid rgba(16,185,129,0.28)'}}>
            ↑ Restore from Backup
          </button>
        </div>

        {/* Cloud sync (§2) */}
        <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{color:'#334155'}}>Cloud Sync (optional)</div>
        <p className="text-xs mb-3" style={{color:'#475569'}}>Point to a Supabase endpoint or self-hosted JSON API — leave blank to skip. Syncs every 2 min when configured.</p>
        <div className="grid grid-cols-1 gap-2">
          <input className="w-full p-2 bg-transparent border border-white/5 rounded text-sm" placeholder="Sync endpoint URL (https://...)" value={syncEndpoint} onChange={e=>setSyncEndpoint(e.target.value)} />
          <input className="w-full p-2 bg-transparent border border-white/5 rounded text-sm" placeholder="Sync key / token (optional)" value={syncKey} onChange={e=>setSyncKey(e.target.value)} />
        </div>
        <p className="text-xs mt-2" style={{color:'#334155'}}>Import replaces all current data. Cloud sync is a no-op until you configure an endpoint.</p>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t" style={{borderColor:'rgba(255,255,255,0.05)'}}>
        <button className="px-3 py-1 rounded bg-indigo-600 text-white text-sm font-medium" onClick={save}>Save Settings</button>
        <button className="px-3 py-1 rounded text-sm" onClick={resetHubs} style={{background:'rgba(99,102,241,0.2)',color:'#a5b4fc'}}>Reset Hub Prompts</button>
        <button className="px-3 py-1 rounded bg-red-600 text-white text-sm" onClick={clearAll}>Clear All Data</button>
      </div>
    </div>
  );
}

/* -------------------- UI bits -------------------- */
function ChatLauncher({onOpen}){
  return (
    <button onClick={onOpen} className="fixed right-6 bottom-20 w-14 h-14 rounded-full accent-grad flex items-center justify-center text-lg shadow-lg z-40">💬</button>
  );
}

function OnboardModal({onClose, open, setActive}){
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="glass p-6 rounded z-50 w-[640px]">
        <h2 className="text-2xl font-semibold mb-2">Welcome to The Magverse</h2>
        <p className="mb-4">A personal productivity and growth hub. Tabs: Schedule, Assignments, Gym, Social, Chat Hubs, Settings.</p>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1 rounded" onClick={()=>{ setActive('schedule'); onClose(); }}>Get started</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Icons -------------------- */
function IconCalendar(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> }
function IconKanban(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="4" /><rect x="14" y="11" width="7" height="10" /><rect x="3" y="11" width="7" height="10" /></svg> }
function IconDumbbell(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 12h3m14 0h3M7 12h10" /><rect x="1" y="9" width="3" height="6" rx="1" /><rect x="20" y="9" width="3" height="6" rx="1" /></svg> }
function IconUsers(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> }
function IconChat(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> }
function IconGear(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 0 1 2.27 17.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.21 4.9A2 2 0 0 1 7 2.27l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 10 2.27V2a2 2 0 0 1 4 0v.09c.15.37.44.7.82.92h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 0 1 19.73 6l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09c.22.38.56.69.92.82H20a2 2 0 0 1 0 4h-.09c-.37.15-.7.44-.92.82v.09z" /></svg> }
function IconMic(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 1v11" /><path d="M19 11v1a7 7 0 0 1-14 0v-1" /><path d="M8 21h8" /></svg> }
function IconNotes(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg> }
function IconInbox(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg> }
function IconBriefcase(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12"/><path d="M2 12h20"/></svg> }

/* -------------------- Career Panel -------------------- */

const KANBAN_COLS = [
  {id:'wishlist',     label:'Wishlist',      color:'#6366f1'},
  {id:'applied',      label:'Applied',       color:'#3b82f6'},
  {id:'phone_screen', label:'Phone Screen',  color:'#8b5cf6'},
  {id:'interview',    label:'Interview',     color:'#f59e0b'},
  {id:'offer',        label:'Offer',         color:'#10b981'},
  {id:'rejected',     label:'Rejected',      color:'#ef4444'},
];

const Q_CATEGORIES = ['Leadership','Teamwork','Conflict','Problem Solving','Communication','Initiative','Adaptability','Other'];

const DEFAULT_QUESTIONS = [
  {id:'dq1', question:'Tell me about a time you led a team through a challenge.', category:'Leadership', situation:'', task:'', action:'', result:'', practiced:false},
  {id:'dq2', question:'Describe a conflict with a coworker and how you resolved it.', category:'Conflict', situation:'', task:'', action:'', result:'', practiced:false},
  {id:'dq3', question:'Give an example of a time you had to learn something quickly.', category:'Adaptability', situation:'', task:'', action:'', result:'', practiced:false},
  {id:'dq4', question:'Tell me about a project you led from start to finish.', category:'Leadership', situation:'', task:'', action:'', result:'', practiced:false},
  {id:'dq5', question:'Describe a time when you worked with a difficult team member.', category:'Teamwork', situation:'', task:'', action:'', result:'', practiced:false},
];

function followUpStatus(lastContacted, followUpDays=14){
  if(!lastContacted) return {color:'#64748b', label:'Never contacted', urgent:false};
  const days = Math.floor((Date.now()-new Date(lastContacted).getTime())/86400000);
  if(days > followUpDays)         return {color:'#ef4444', label:`${days}d ago — overdue`, urgent:true};
  if(days > followUpDays * 0.6)   return {color:'#f59e0b', label:`${days}d ago — follow up soon`, urgent:false};
  return {color:'#10b981', label:`${days}d ago`, urgent:false};
}

function CareerPanel({data, setData, toasts}){
  const [tab, setTab] = useState('overview');
  const career = data.career || {contacts:[], questions:DEFAULT_QUESTIONS, applications:[]};

  const setCareer = (updater) => {
    setData(d => {
      const cur = d.career || {contacts:[], questions:DEFAULT_QUESTIONS, applications:[]};
      const next = typeof updater === 'function' ? updater(cur) : updater;
      return {...d, career: next};
    });
  };

  const addContact = (c) => { setCareer(cr=>({...cr, contacts:[...cr.contacts,{...c,id:uid()}]})); toasts.push('Contact added'); };
  const updateContact = (id, patch) => setCareer(cr=>({...cr, contacts:cr.contacts.map(c=>c.id===id?{...c,...patch}:c)}));
  const deleteContact = (id) => { setCareer(cr=>({...cr, contacts:cr.contacts.filter(c=>c.id!==id)})); toasts.push('Contact removed'); };

  const addApp = (a) => { setCareer(cr=>({...cr, applications:[...cr.applications,{...a,id:uid()}]})); toasts.push('Application added'); };
  const updateApp = (id, patch) => setCareer(cr=>({...cr, applications:cr.applications.map(a=>a.id===id?{...a,...patch}:a)}));
  const deleteApp = (id) => { setCareer(cr=>({...cr, applications:cr.applications.filter(a=>a.id!==id)})); toasts.push('Application removed'); };

  const addQ = (q) => setCareer(cr=>({...cr, questions:[...(cr.questions||[]),{...q,id:uid()}]}));
  const updateQ = (id, patch) => setCareer(cr=>({...cr, questions:(cr.questions||[]).map(q=>q.id===id?{...q,...patch}:q)}));
  const deleteQ = (id) => setCareer(cr=>({...cr, questions:(cr.questions||[]).filter(q=>q.id!==id)}));

  const TABS = [{id:'overview',label:'Overview'},{id:'network',label:'Network'},{id:'applications',label:'Applications'},{id:'prep',label:'Interview Prep'}];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Internship & Career</h2>
          <p className="text-xs mt-0.5" style={{color:'var(--muted)'}}>Track applications, network, and prep</p>
        </div>
      </div>
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',overflowX:'auto',width:'fit-content',maxWidth:'100%'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={tab===t.id?{background:'rgba(255,255,255,0.1)',color:'#e2e8f0'}:{color:'#64748b'}}>
            {t.label}
          </button>
        ))}
      </div>
      {tab==='overview'     && <CareerOverview career={career} />}
      {tab==='network'      && <NetworkTracker contacts={career.contacts||[]} addContact={addContact} updateContact={updateContact} deleteContact={deleteContact} />}
      {tab==='applications' && <AppPipeline applications={career.applications||[]} addApp={addApp} updateApp={updateApp} deleteApp={deleteApp} />}
      {tab==='prep'         && <InterviewPrep questions={career.questions||DEFAULT_QUESTIONS} addQ={addQ} updateQ={updateQ} deleteQ={deleteQ} />}
    </div>
  );
}

/* ---- Career Overview ---- */
function CareerOverview({career}){
  const apps = career.applications||[];
  const contacts = career.contacts||[];
  const now = Date.now();
  const total = apps.length;
  const applied = apps.filter(a=>a.status!=='wishlist').length;
  const responses = apps.filter(a=>['phone_screen','interview','offer'].includes(a.status)).length;
  const interviews = apps.filter(a=>a.status==='interview').length;
  const offers = apps.filter(a=>a.status==='offer').length;
  const responseRate = applied>0?Math.round(responses/applied*100):0;
  const overdueContacts = contacts.filter(c=>{
    if(!c.lastContacted) return false;
    return Math.floor((now-new Date(c.lastContacted).getTime())/86400000)>(c.followUpDays||14);
  });
  const neverContacted = contacts.filter(c=>!c.lastContacted);
  const reminders = [...overdueContacts, ...neverContacted].slice(0,5);
  const stats = [
    {label:'Total Applications',value:total,color:'#6366f1'},
    {label:'Response Rate',value:`${responseRate}%`,color:'#3b82f6'},
    {label:'Interviews',value:interviews,color:'#f59e0b'},
    {label:'Offers',value:offers,color:'#10b981'},
  ];
  return (
    <div className="space-y-6">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'12px'}}>
        {stats.map(s=>(
          <div key={s.label} className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-3xl font-bold mb-1" style={{color:s.color}}>{s.value}</div>
            <div className="text-xs" style={{color:'#64748b'}}>{s.label}</div>
          </div>
        ))}
      </div>
      {reminders.length>0 && (
        <div className="rounded-xl p-4" style={{background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)'}}>
          <div className="text-sm font-semibold mb-3" style={{color:'#fca5a5'}}>⚠ Follow-up Reminders ({reminders.length})</div>
          <div className="space-y-2">
            {reminders.map(c=>{
              const st=followUpStatus(c.lastContacted,c.followUpDays);
              return (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div><span className="font-medium" style={{color:'#e2e8f0'}}>{c.name}</span><span style={{color:'#64748b'}}> · {c.company}</span></div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{background:`${st.color}22`,color:st.color}}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}>
        <div className="text-sm font-semibold mb-3">Application Pipeline</div>
        <div className="space-y-2">
          {KANBAN_COLS.map(col=>{
            const count=apps.filter(a=>a.status===col.id).length;
            const pct=total>0?(count/total*100):0;
            return (
              <div key={col.id} className="flex items-center gap-3">
                <div className="text-xs flex-shrink-0" style={{color:'#64748b',width:'96px'}}>{col.label}</div>
                <div className="flex-1 h-2 rounded-full" style={{background:'rgba(255,255,255,0.05)'}}>
                  <div className="h-2 rounded-full transition-all" style={{width:`${pct}%`,background:col.color}}/>
                </div>
                <div className="text-xs w-5 text-right" style={{color:'#64748b'}}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---- Network Tracker ---- */
function NetworkTracker({contacts, addContact, updateContact, deleteContact}){
  const [search, setSearch] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({name:'',company:'',role:'',howMet:'',linkedIn:'',lastContacted:'',followUpDays:14,notes:''});
  const isMobile = useIsMobile();

  const filtered = contacts.filter(c=>{
    const q = search.toLowerCase();
    if(q && !c.name.toLowerCase().includes(q) && !(c.company||'').toLowerCase().includes(q)) return false;
    if(filterOverdue){
      const st = followUpStatus(c.lastContacted, c.followUpDays);
      return st.urgent || !c.lastContacted;
    }
    return true;
  });

  const openAdd = () => { setForm({name:'',company:'',role:'',howMet:'',linkedIn:'',lastContacted:'',followUpDays:14,notes:''}); setEditId(null); setShowModal(true); };
  const openEdit = (c) => { setForm({...c}); setEditId(c.id); setShowModal(true); };
  const save = () => {
    if(!form.name.trim()) return;
    if(editId) updateContact(editId, form); else addContact(form);
    setShowModal(false);
  };

  return (
    <div>
      <div className={`flex ${isMobile?'flex-col gap-2':'items-center gap-3'} mb-5`}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or company…"
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent"
          style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}} />
        <button onClick={()=>setFilterOverdue(f=>!f)}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={filterOverdue?{background:'rgba(239,68,68,0.15)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.3)'}:{color:'#64748b',border:'1px solid rgba(255,255,255,0.08)'}}>
          {filterOverdue?'⚠ Overdue only':'Show overdue'}
        </button>
        <button onClick={openAdd} className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
          style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white'}}>+ Add Contact</button>
      </div>
      <div className="space-y-3">
        {filtered.length===0 && <div className="text-sm text-center py-12" style={{color:'#334155'}}>{contacts.length===0?'No contacts yet — add your first networking connection.':'No contacts match your search.'}</div>}
        {filtered.map(c=>{
          const st=followUpStatus(c.lastContacted,c.followUpDays);
          const isExp=expanded===c.id;
          return (
            <div key={c.id} className="rounded-xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}>
              <div className={`flex items-start gap-3 p-4 ${isMobile?'flex-wrap':''}`}>
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
                  style={{background:'rgba(99,102,241,0.18)',color:'#818cf8'}}>
                  {(c.name||'?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs" style={{color:'#64748b'}}>{[c.role,c.company].filter(Boolean).join(' · ')}</div>
                  {c.howMet&&<div className="text-xs mt-0.5" style={{color:'#475569'}}>Met via {c.howMet}</div>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{background:`${st.color}22`,color:st.color}}>{st.label}</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {c.linkedIn&&<a href={c.linkedIn} target="_blank" rel="noreferrer" className="text-xs px-2 py-0.5 rounded" style={{background:'rgba(14,118,168,0.18)',color:'#38bdf8'}}>LinkedIn</a>}
                    <button onClick={()=>setExpanded(isExp?null:c.id)} className="text-xs px-2 py-0.5 rounded" style={{color:'#818cf8',background:'rgba(99,102,241,0.1)'}}>{isExp?'Hide':'Notes'}</button>
                    <button onClick={()=>openEdit(c)} className="text-xs px-2 py-0.5 rounded" style={{color:'#64748b',background:'rgba(255,255,255,0.05)'}}>Edit</button>
                    <button onClick={()=>deleteContact(c.id)} className="text-xs px-2 py-0.5 rounded" style={{color:'#ef4444',background:'rgba(239,68,68,0.08)'}}>✕</button>
                  </div>
                </div>
              </div>
              {isExp&&(
                <div className="px-4 pb-4 border-t" style={{borderColor:'rgba(255,255,255,0.04)'}}>
                  <div className="text-xs font-semibold mt-3 mb-2" style={{color:'#475569'}}>Meeting Notes</div>
                  <textarea value={c.notes||''} onChange={e=>updateContact(c.id,{notes:e.target.value})}
                    placeholder="Notes from your coffee chat, call, or meeting…" rows={3}
                    className="w-full p-2 rounded-lg text-sm bg-transparent resize-none"
                    style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0',outline:'none'}} />
                  <button onClick={()=>updateContact(c.id,{lastContacted:new Date().toISOString().split('T')[0]})}
                    className="mt-2 text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{background:'rgba(16,185,129,0.12)',color:'#34d399',border:'1px solid rgba(16,185,129,0.22)'}}>
                    ✓ Mark as contacted today
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)'}}>
          <div className="glass rounded-2xl p-6 w-full max-w-md" style={{border:'1px solid rgba(255,255,255,0.1)',maxHeight:'90vh',overflowY:'auto'}}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{editId?'Edit Contact':'Add Contact'}</h3>
              <button onClick={()=>setShowModal(false)} style={{color:'#64748b',fontSize:'20px'}}>×</button>
            </div>
            <div className="space-y-3">
              {[['name','Name *'],['company','Company'],['role','Role / Title'],['howMet','How you met'],['linkedIn','LinkedIn URL']].map(([k,l])=>(
                <div key={k}>
                  <label className="block text-xs mb-1" style={{color:'#64748b'}}>{l}</label>
                  <input value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-transparent"
                    style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}} />
                </div>
              ))}
              <div>
                <label className="block text-xs mb-1" style={{color:'#64748b'}}>Last contacted</label>
                <input type="date" value={form.lastContacted||''} onChange={e=>setForm(f=>({...f,lastContacted:e.target.value}))}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-transparent"
                  style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none',colorScheme:'dark'}} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{color:'#64748b'}}>Follow-up reminder after (days)</label>
                <input type="number" min={1} max={90} value={form.followUpDays||14} onChange={e=>setForm(f=>({...f,followUpDays:parseInt(e.target.value,10)||14}))}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-transparent"
                  style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={save} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white'}}>{editId?'Save Changes':'Add Contact'}</button>
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 rounded-xl text-sm" style={{background:'rgba(255,255,255,0.06)',color:'#94a3b8'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Application Pipeline (Kanban) ---- */
function AppPipeline({applications, addApp, updateApp, deleteApp}){
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({company:'',role:'',type:'internship',status:'wishlist',dateApplied:'',deadline:'',salaryRange:'',notes:'',url:''});
  const isMobile = useIsMobile();

  const openAdd = () => { setForm({company:'',role:'',type:'internship',status:'wishlist',dateApplied:'',deadline:'',salaryRange:'',notes:'',url:''}); setEditId(null); setShowModal(true); };
  const openEdit = (a) => { setForm({...a}); setEditId(a.id); setShowModal(true); };
  const save = () => { if(!form.company.trim()) return; if(editId) updateApp(editId,form); else addApp(form); setShowModal(false); };
  const moveApp = (id, status) => updateApp(id,{status});

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white'}}>+ Add Application</button>
      </div>
      {isMobile ? (
        <div className="space-y-5">
          {KANBAN_COLS.map(col=>{
            const colApps=applications.filter(a=>a.status===col.id);
            if(!colApps.length) return null;
            return (
              <div key={col.id}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{background:col.color}}/>
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:`${col.color}22`,color:col.color}}>{colApps.length}</span>
                </div>
                <div className="space-y-2">
                  {colApps.map(a=><AppCard key={a.id} app={a} col={col} onEdit={openEdit} onDelete={deleteApp} onMove={moveApp} mobile />)}
                </div>
              </div>
            );
          })}
          {applications.length===0&&<div className="text-sm text-center py-12" style={{color:'#334155'}}>No applications yet.</div>}
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:`repeat(6,minmax(155px,1fr))`,gap:'10px',overflowX:'auto',paddingBottom:'8px'}}>
          {KANBAN_COLS.map(col=>{
            const colApps=applications.filter(a=>a.status===col.id);
            const isOver=dragOver===col.id;
            return (
              <div key={col.id} className="rounded-xl p-3" style={{background:isOver?'rgba(99,102,241,0.06)':'rgba(255,255,255,0.02)',border:`1px solid ${isOver?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)'}`,minHeight:'120px',transition:'background .15s,border .15s'}}
                onDragOver={e=>{e.preventDefault();setDragOver(col.id);}}
                onDragLeave={()=>setDragOver(null)}
                onDrop={()=>{if(dragId)moveApp(dragId,col.id);setDragId(null);setDragOver(null);}}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:col.color}}/>
                  <span className="text-xs font-semibold">{col.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full ml-auto" style={{background:`${col.color}22`,color:col.color}}>{colApps.length}</span>
                </div>
                <div className="space-y-2">
                  {colApps.map(a=><AppCard key={a.id} app={a} col={col} onEdit={openEdit} onDelete={deleteApp} onMove={moveApp} draggable onDragStart={()=>setDragId(a.id)} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showModal&&<AppFormModal form={form} setForm={setForm} editId={editId} save={save} onClose={()=>setShowModal(false)} />}
    </div>
  );
}

function AppCard({app, col, onEdit, onDelete, onMove, draggable:isDrag, onDragStart, mobile}){
  const [showMove, setShowMove] = useState(false);
  const tc = app.type==='full-time'?'#f59e0b':'#6366f1';
  const deadline = app.deadline ? new Date(app.deadline+'T12:00:00') : null;
  const dlSoon = deadline&&(deadline-Date.now())<3*86400000&&deadline>Date.now();
  const dlPast = deadline&&deadline<Date.now();
  return (
    <div className="rounded-lg p-3 select-none" draggable={isDrag} onDragStart={onDragStart}
      style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',cursor:isDrag?'grab':'default'}}>
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="font-semibold text-xs leading-tight">{app.company}</div>
        <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{background:`${tc}22`,color:tc,fontSize:'9px'}}>{app.type==='full-time'?'FT':'INT'}</span>
      </div>
      {app.role&&<div className="text-xs mb-1.5" style={{color:'#64748b'}}>{app.role}</div>}
      {app.salaryRange&&<div className="text-xs mb-1" style={{color:'#94a3b8'}}>💵 {app.salaryRange}</div>}
      {deadline&&<div className="text-xs mb-1" style={{color:dlPast?'#ef4444':dlSoon?'#f59e0b':'#475569'}}>{dlPast?'⚠ Past deadline':'⏰ '}{deadline.toLocaleDateString('en',{month:'short',day:'numeric'})}</div>}
      {app.notes&&<div className="text-xs mt-1 mb-1.5 leading-relaxed" style={{color:'#475569',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{app.notes}</div>}
      <div className="flex gap-1 mt-2 flex-wrap">
        <button onClick={()=>onEdit(app)} className="text-xs px-1.5 py-0.5 rounded" style={{color:'#64748b',background:'rgba(255,255,255,0.05)'}}>Edit</button>
        {mobile&&(
          <div style={{position:'relative'}}>
            <button onClick={()=>setShowMove(m=>!m)} className="text-xs px-1.5 py-0.5 rounded" style={{color:'#818cf8',background:'rgba(99,102,241,0.1)'}}>Move ▾</button>
            {showMove&&(
              <div className="absolute left-0 top-full mt-1 z-20 rounded-lg overflow-hidden shadow-xl" style={{background:'#1a1a24',border:'1px solid rgba(255,255,255,0.1)',minWidth:'140px'}}>
                {KANBAN_COLS.filter(c=>c.id!==app.status).map(c=>(
                  <button key={c.id} className="w-full text-left text-xs px-3 py-2" style={{color:c.color}} onClick={()=>{onMove(app.id,c.id);setShowMove(false);}}>→ {c.label}</button>
                ))}
              </div>
            )}
          </div>
        )}
        <button onClick={()=>onDelete(app.id)} className="text-xs px-1.5 py-0.5 rounded ml-auto" style={{color:'#ef4444',background:'rgba(239,68,68,0.08)'}}>✕</button>
      </div>
    </div>
  );
}

function AppFormModal({form, setForm, editId, save, onClose}){
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)'}}>
      <div className="glass rounded-2xl p-6 w-full max-w-md" style={{border:'1px solid rgba(255,255,255,0.1)',maxHeight:'90vh',overflowY:'auto'}}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">{editId?'Edit Application':'Add Application'}</h3>
          <button onClick={onClose} style={{color:'#64748b',fontSize:'20px'}}>×</button>
        </div>
        <div className="space-y-3">
          {[['company','Company *'],['role','Role / Position'],['url','Application URL'],['salaryRange','Salary / Stipend Range']].map(([k,l])=>(
            <div key={k}><label className="block text-xs mb-1" style={{color:'#64748b'}}>{l}</label>
            <input value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}} /></div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs mb-1" style={{color:'#64748b'}}>Type</label>
            <select value={form.type||'internship'} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}>
              <option value="internship">Internship</option><option value="full-time">Full-time</option>
            </select></div>
            <div><label className="block text-xs mb-1" style={{color:'#64748b'}}>Status</label>
            <select value={form.status||'wishlist'} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}>
              {KANBAN_COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs mb-1" style={{color:'#64748b'}}>Date Applied</label>
            <input type="date" value={form.dateApplied||''} onChange={e=>setForm(f=>({...f,dateApplied:e.target.value}))} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none',colorScheme:'dark'}} /></div>
            <div><label className="block text-xs mb-1" style={{color:'#64748b'}}>Deadline</label>
            <input type="date" value={form.deadline||''} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none',colorScheme:'dark'}} /></div>
          </div>
          <div><label className="block text-xs mb-1" style={{color:'#64748b'}}>Notes</label>
          <textarea value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} className="w-full px-3 py-2 rounded-lg text-sm bg-transparent resize-none" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}} /></div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={save} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white'}}>{editId?'Save Changes':'Add Application'}</button>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm" style={{background:'rgba(255,255,255,0.06)',color:'#94a3b8'}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Interview Prep ---- */
function InterviewPrep({questions, addQ, updateQ, deleteQ}){
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({question:'',category:'Leadership',situation:'',task:'',action:'',result:'',practiced:false});
  const isMobile = useIsMobile();

  const filtered = questions.filter(q=>{
    if(filterCat!=='All'&&q.category!==filterCat) return false;
    if(filterStatus==='practiced'&&!q.practiced) return false;
    if(filterStatus==='needs_work'&&q.practiced) return false;
    if(search&&!q.question.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openEdit = (q) => { setForm({...q}); setShowModal(true); };
  const save = () => {
    if(!form.question.trim()) return;
    if(form.id) updateQ(form.id,form); else addQ({...form});
    setShowModal(false);
    setForm({question:'',category:'Leadership',situation:'',task:'',action:'',result:'',practiced:false});
  };

  return (
    <div>
      <div className={`flex ${isMobile?'flex-col gap-2':'flex-wrap items-center gap-3'} mb-5`}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search questions…"
          className="px-3 py-2 rounded-lg text-sm bg-transparent"
          style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none',flex:'1',minWidth:'140px'}} />
        <div className="flex flex-wrap gap-1">
          {['All',...Q_CATEGORIES].map(c=>(
            <button key={c} onClick={()=>setFilterCat(c)} className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={filterCat===c?{background:'rgba(99,102,241,0.22)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.35)'}:{color:'#475569',border:'1px solid rgba(255,255,255,0.06)'}}>
              {c}
            </button>
          ))}
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm bg-transparent"
          style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}>
          <option value="all">All</option>
          <option value="practiced">Practiced</option>
          <option value="needs_work">Needs work</option>
        </select>
        <button onClick={()=>{setForm({question:'',category:'Leadership',situation:'',task:'',action:'',result:'',practiced:false});setShowModal(true);}}
          className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
          style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white'}}>+ Add Question</button>
      </div>
      <div className="space-y-3">
        {filtered.length===0&&<div className="text-sm text-center py-12" style={{color:'#334155'}}>No questions match.</div>}
        {filtered.map(q=>{
          const isExp=expanded===q.id;
          const hasStar=q.situation||q.task||q.action||q.result;
          return (
            <div key={q.id} className="rounded-xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}>
              <div className="flex items-start gap-3 p-4">
                <button onClick={()=>updateQ(q.id,{practiced:!q.practiced})}
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
                  style={{background:q.practiced?'rgba(16,185,129,0.18)':'rgba(255,255,255,0.05)',border:`1px solid ${q.practiced?'#10b981':'rgba(255,255,255,0.1)'}`,color:q.practiced?'#10b981':'transparent',fontSize:'10px'}}>
                  ✓
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-snug mb-1.5">{q.question}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(99,102,241,0.12)',color:'#818cf8'}}>{q.category}</span>
                    <span className="text-xs" style={{color:q.practiced?'#10b981':'#64748b'}}>{q.practiced?'✓ Practiced':'Needs work'}</span>
                    {hasStar&&<span className="text-xs" style={{color:'#475569'}}>· STAR saved</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={()=>setExpanded(isExp?null:q.id)} className="text-xs px-2 py-1 rounded" style={{color:'#818cf8',background:'rgba(99,102,241,0.1)'}}>{isExp?'Hide':'STAR'}</button>
                  <button onClick={()=>openEdit(q)} className="text-xs px-2 py-1 rounded" style={{color:'#64748b',background:'rgba(255,255,255,0.05)'}}>Edit</button>
                  <button onClick={()=>deleteQ(q.id)} className="text-xs px-2 py-1 rounded" style={{color:'#ef4444',background:'rgba(239,68,68,0.08)'}}>✕</button>
                </div>
              </div>
              {isExp&&(
                <div className="px-4 pb-4 space-y-3 border-t" style={{borderColor:'rgba(255,255,255,0.04)'}}>
                  {[['situation','S — Situation','What was the context?'],['task','T — Task','What was your responsibility?'],['action','A — Action','What did you do specifically?'],['result','R — Result','What was the outcome?']].map(([k,label,ph])=>(
                    <div key={k} className="mt-3">
                      <label className="block text-xs font-bold mb-1.5" style={{color:'#6366f1'}}>{label}</label>
                      <textarea value={q[k]||''} onChange={e=>updateQ(q.id,{[k]:e.target.value})}
                        placeholder={ph} rows={2} className="w-full p-2.5 rounded-lg text-sm bg-transparent resize-none"
                        style={{border:'1px solid rgba(255,255,255,0.07)',color:'#e2e8f0',outline:'none'}} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.7)'}}>
          <div className="glass rounded-2xl p-6 w-full max-w-md" style={{border:'1px solid rgba(255,255,255,0.1)',maxHeight:'90vh',overflowY:'auto'}}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{form.id?'Edit Question':'Add Question'}</h3>
              <button onClick={()=>setShowModal(false)} style={{color:'#64748b',fontSize:'20px'}}>×</button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs mb-1" style={{color:'#64748b'}}>Question *</label>
              <textarea value={form.question} onChange={e=>setForm(f=>({...f,question:e.target.value}))} rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent resize-none"
                style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}} /></div>
              <div><label className="block text-xs mb-1" style={{color:'#64748b'}}>Category</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent"
                style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}>
                {Q_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={save} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white'}}>{form.id?'Save Changes':'Add Question'}</button>
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 rounded-xl text-sm" style={{background:'rgba(255,255,255,0.06)',color:'#94a3b8'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- Render -------------------- */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App, null));
