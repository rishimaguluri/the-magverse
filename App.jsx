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
];

// Default data
const defaultState = () => ({
  settings: { apiKey: '', accent: 'indigo', userName: 'You', avatarInitial: 'Y' },
  events: [],
  assignments: [],
  workouts: [],
  notes: [],
  journals: [],
  habits: [],
  social: [],
  hubs: DEFAULT_HUBS(),
  career: { contacts: [], questions: [], applications: [] }
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

// Simple voice recognition helper
function useDictation(onResult){
  const recogRef = useRef(null);
  useEffect(()=>{
    if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new R(); r.lang='en-US'; r.interimResults=false; r.maxAlternatives=1;
    r.onresult = (e)=>{ const t = e.results[0][0].transcript; onResult && onResult(t); };
    r.onerror = ()=>{};
    recogRef.current = r;
  },[onResult]);
  const start = ()=>{ recogRef.current && recogRef.current.start(); };
  const stop = ()=>{ recogRef.current && recogRef.current.stop(); };
  return { start, stop };
}

// Main App
function App(){
  const [data, setData] = useLocalState('magverse:v1', defaultState);
  const [active, setActive] = useLocalState('magverse:activeTab','schedule');
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalState('magverse:sidebarCollapsed', false);
  const toasts = useToasts();
  const [isOnboardSeen, setOnboardSeen] = useLocalState('magverse:onboardSeen', false);
  const isMobile = useIsMobile();

  useEffect(()=>{ document.title = 'The Magverse'; },[]);

  return (
    <div className="h-full flex text-sm">
      {!isMobile && <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} active={active} setActive={setActive} data={data} />}
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar setActive={setActive} data={data} toasts={toasts} isMobile={isMobile} />
        <main className="flex-1 overflow-auto" style={{padding: isMobile ? '12px 12px 80px' : '24px'}}>
          <div className="max-w-full">
            {active==='schedule' && <SchedulePanel data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='assignments' && <AssignmentsPanel data={data} setData={setData} toasts={toasts} />}
            {active==='gym' && <GymPanel data={data} setData={setData} toasts={toasts} />}
            {active==='social' && <SocialPanel data={data} setData={setData} toasts={toasts} />}
            {active==='notes' && <NotesPanel data={data} setData={setData} toasts={toasts} />}
            {active==='chathubs' && <ChatHubsPanel data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='settings' && <SettingsPanel data={data} setData={setData} toasts={toasts} />}
            {active==='career' && <CareerPanel data={data} setData={setData} toasts={toasts} />}
          </div>
        </main>
      </div>

      {isMobile && <BottomNav active={active} setActive={setActive} />}
      {!isMobile && <ChatLauncher onOpen={()=>setActive('chathubs')} />}

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

  // Bulk schedule detection: 3+ time expressions → split into individual events
  if(_depth === 0){
    const allTimes = [...norm.matchAll(/\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi)];
    if(allTimes.length >= 3){
      // Split on newlines and before "then at/from TIME" or "then i have/want"
      const chunks = norm
        .split(/\n+|(?:,\s*|\s+(?:and\s+)?)then\s+(?=(?:at|from|i\s+have|i\s+want)\s)/i)
        .map(s => s
          .replace(/^(?:then\s+|,\s*)/i,'')
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
    // Title = everything before "from" minus noise words
    const beforeFrom = norm.slice(0, norm.search(/\bfrom\s+\d/i));
    const rawTitle = cleanTitle(beforeFrom).trim();
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

function BottomNav({active, setActive}){
  const items = [
    {id:'schedule',     label:'Schedule', icon:IconCalendar},
    {id:'assignments',  label:'Tasks',    icon:IconKanban},
    {id:'career',       label:'Career',   icon:IconBriefcase},
    {id:'gym',          label:'Gym',      icon:IconDumbbell},
    {id:'social',       label:'Social',   icon:IconUsers},
    {id:'notes',        label:'Notes',    icon:IconNotes},
    {id:'chathubs',     label:'Learn',    icon:IconChat},
    {id:'settings',     label:'More',     icon:IconGear},
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center py-2 safe-area-bottom"
      style={{background:'rgba(10,10,15,0.97)',backdropFilter:'blur(16px)',borderTop:'1px solid rgba(255,255,255,0.07)',paddingBottom:'max(8px,env(safe-area-inset-bottom))'}}>
      {items.map(it=>(
        <button key={it.id} onClick={()=>setActive(it.id)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
          style={{color:active===it.id?'#818cf8':'#475569',minWidth:'40px'}}>
          <it.icon />
          <span style={{fontSize:'9px',fontWeight:active===it.id?700:400}}>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

function Sidebar({collapsed, setCollapsed, active, setActive}){
  const items = [
    {id:'schedule', label:'Schedule', icon:IconCalendar},
    {id:'assignments', label:'Tasks', icon:IconKanban},
    {id:'career', label:'Career', icon:IconBriefcase},
    {id:'gym', label:'Gym', icon:IconDumbbell},
    {id:'social', label:'Social', icon:IconUsers},
    {id:'notes', label:'Notes', icon:IconNotes},
    {id:'chathubs', label:'Learning Hub', icon:IconChat},
    {id:'settings', label:'Settings', icon:IconGear},
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
          <button key={it.id} onClick={()=>setActive(it.id)} className={`flex items-center gap-3 w-full p-2 rounded ${active===it.id? 'bg-white/6':''} hover:bg-white/3`}>
            <it.icon />
            {!collapsed && <span>{it.label}</span>}
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
    </div>
  );
}

/* ---- Positioned calendar helpers ---- */
const ROW_H = 56; // px per hour slot

function getEventsForDayColumn(events, di){
  return events.filter(ev=>{
    if(ev.when?.hour === undefined) return false;
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
  return (
    <div onClick={e=>{e.stopPropagation();onExpand&&onExpand(ev);}}
      className={`group w-full h-full rounded-lg overflow-hidden cursor-pointer select-none ${removingIds?.includes(ev.id)?'removing':''}`}
      style={{background:c.bg,border:`1px solid ${c.border}`,padding:'3px 6px',boxSizing:'border-box',transition:'filter .1s'}}>
      <div className="flex items-start justify-between gap-0.5">
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight" style={{fontSize:'11px',color:c.text,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:tall?3:1,WebkitBoxOrient:'vertical'}}>{ev.title}</div>
          {tall && timeStr && <div style={{fontSize:'10px',color:c.text,opacity:0.7,marginTop:'1px'}}>{timeStr}</div>}
          {tall && subtasks.length>0 && <div style={{fontSize:'10px',color:c.text,opacity:0.7}}>{doneCount}/{subtasks.length} done</div>}
          {!tall && subtasks.length>0 && <div style={{fontSize:'9px',color:c.text,opacity:0.6}}>{doneCount}/{subtasks.length}</div>}
        </div>
        <button onClick={e=>{e.stopPropagation();onRemove&&onRemove(ev);}}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center hover:bg-white/25"
          style={{color:c.text,fontSize:'11px',lineHeight:1}}>×</button>
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
          const colEvs = layoutDayEvents(getEventsForDayColumn(events,di), 6);
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
  const colEvs = layoutDayEvents(getEventsForDayColumn(events, displayDi), 6);

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

function AssignmentsPanel({data, setData, toasts}){
  const [modalCat, setModalCat] = useState(null); // category to add to
  const [editTask, setEditTask] = useState(null);
  const [sort, setSort] = useState('smart');
  const [filter, setFilter] = useState('active'); // active | all | done
  const [collapsed, setCollapsed] = useState({});

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
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold">Tasks</h2>
          <div className="text-xs mt-0.5" style={{color:'#475569'}}>
            {totalActive} active{totalOverdue>0 && <span style={{color:'#f87171'}}> · {totalOverdue} overdue</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter */}
          <div className="flex rounded overflow-hidden border" style={{borderColor:'rgba(255,255,255,0.07)'}}>
            {['active','all','done'].map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                className="px-3 py-1 text-xs capitalize transition-all"
                style={{background:filter===f?'rgba(99,102,241,0.3)':'transparent', color:filter===f?'#a5b4fc':'#64748b'}}>
                {f}
              </button>
            ))}
          </div>
          {/* Sort */}
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
              {/* Section header */}
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                style={{borderBottom: isCollapsed?'none':'1px solid rgba(255,255,255,0.05)'}}
                onClick={()=>setCollapsed(c=>({...c,[cat.id]:!c[cat.id]}))}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{background:cat.dot}}/>
                  <span className="font-semibold text-sm">{cat.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:cat.bg, color:cat.color}}>
                    {allCatTasks.filter(t=>t.status!=='Done').length} left
                  </span>
                  {doneCount>0 && <span className="text-xs" style={{color:'#334155'}}>{doneCount} done</span>}
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

              {/* Tasks list */}
              {!isCollapsed && (
                <div className="divide-y" style={{borderColor:'rgba(255,255,255,0.04)'}}>
                  {catTasks.length===0 && (
                    <div className="px-4 py-5 text-xs text-center" style={{color:'#334155'}}>
                      {filter==='done' ? 'No completed tasks' : 'No tasks — click + Add to get started'}
                    </div>
                  )}
                  {catTasks.map(task=>{
                    const due = formatDue(task.dueDate);
                    const pm = PRIORITY_META[task.priority] || PRIORITY_META.Med;
                    const isDone = task.status==='Done';
                    return (
                      <div key={task.id} className="group flex items-start gap-3 px-4 py-3 transition-all hover:bg-white/[0.02]">
                        {/* Checkbox */}
                        <button onClick={()=>toggleDone(task)}
                          className="mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all"
                          style={{borderColor: isDone ? cat.color : 'rgba(255,255,255,0.15)', background: isDone ? cat.bg : 'transparent'}}>
                          {isDone && <span style={{color:cat.color, fontSize:'9px'}}>✓</span>}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium leading-snug" style={{textDecoration:isDone?'line-through':'none', color:isDone?'#475569':'#e2e8f0'}}>
                              {task.title}
                            </span>
                            {/* Priority chip */}
                            <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 font-medium"
                              style={{background:pm.bg, color:pm.color}}>
                              {pm.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {task.subject && <span className="text-xs" style={{color:'#475569'}}>{task.subject}</span>}
                            {due && (
                              <span className="text-xs font-medium"
                                style={{color: due.overdue?'#f87171': due.urgent?'#fbbf24':'#64748b'}}>
                                {due.overdue && '⚠ '}{due.text}
                              </span>
                            )}
                            {task.notes && <span className="text-xs italic truncate max-w-[200px]" style={{color:'#334155'}}>{task.notes}</span>}
                          </div>
                        </div>

                        {/* Edit / Delete on hover */}
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

      <TasksAssistant tasks={tasks} sort={sort} setSort={setSort} filter={filter} setFilter={setFilter} onAddTask={addTask} toasts={toasts} />
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
  let category = 'personal';
  if(/(class|course|homework|assignment|lecture|exam|essay|quiz|problem set|school|study)/i.test(t)) category = 'classroom';
  else if(/(club|sport|extracurricular|activity|practice|rehearsal|team|meet)/i.test(t)) category = 'extracurricular';

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

function TasksAssistant({tasks, sort, setSort, filter, setFilter, onAddTask, toasts}){
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
          {['notes','journal','habits'].map(t=> (
            <button key={t} className={`px-3 py-1 rounded capitalize ${subtab===t?'bg-white/10':'hover:bg-white/3'}`} onClick={()=>setSubtab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
      </div>
      {subtab==='notes'  && <NotesSubtab  data={data} setData={setData} toasts={toasts} />}
      {subtab==='journal'&& <JournalSubtab data={data} setData={setData} toasts={toasts} />}
      {subtab==='habits' && <HabitsSubtab  data={data} setData={setData} toasts={toasts} />}
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

function JournalSubtab({data, setData, toasts}){
  const journals = data.journals || [];
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const existing = journals.find(j=>j.date===date);
  const [body, setBody] = useState(existing?.body || '');

  // sync body when date changes
  useEffect(()=>{ const e = (data.journals||[]).find(j=>j.date===date); setBody(e?.body||''); }, [date]);

  function save(){
    if(!body.trim()) return;
    if(existing){
      setData(d=>({...d, journals:(d.journals||[]).map(j=>j.date===date?{...j,body,updatedAt:new Date().toISOString()}:j)}));
    } else {
      setData(d=>({...d, journals:[...(d.journals||[]),{id:uid(),date,body,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}]}));
    }
    toasts.push('Journal entry saved');
  }

  const sorted = [...journals].sort((a,b)=>b.date.localeCompare(a.date));

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 glass p-5 rounded border-subtle flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input type="date" className="p-2 bg-transparent border border-white/10 rounded text-sm" value={date} onChange={e=>setDate(e.target.value)} />
          <span className="text-sm opacity-60">{date===today? 'Today' : ''}</span>
        </div>
        <textarea
          className="flex-1 w-full p-3 bg-transparent border border-white/10 rounded text-sm resize-none min-h-[360px]"
          placeholder="Write your thoughts for the day..."
          value={body}
          onChange={e=>setBody(e.target.value)}
        />
        <button className="self-end px-4 py-1.5 rounded bg-indigo-600" onClick={save}>Save Entry</button>
      </div>
      <div className="glass p-4 rounded border-subtle">
        <div className="font-semibold mb-3 text-sm">Past Entries</div>
        {sorted.length===0 && <div className="text-xs opacity-50">No entries yet.</div>}
        <div className="flex flex-col gap-2">
          {sorted.map(j=> (
            <button key={j.id} className={`text-left p-2 rounded hover:bg-white/5 ${j.date===date?'bg-white/10':''}`} onClick={()=>setDate(j.date)}>
              <div className="text-xs font-medium">{j.date}</div>
              <div className="text-xs opacity-60 line-clamp-2 mt-0.5">{j.body}</div>
            </button>
          ))}
        </div>
      </div>
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

/* -------------------- Learning Hub Panel -------------------- */
function ChatHubsPanel({data, setData, toasts, isMobile}){
  const [openHub, setOpenHub] = useState(null);
  const hubs = data.hubs || [];
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Learning Hub</h2>
      <StockPicker isMobile={isMobile} />
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

      {openHub && <ChatDrawer hub={openHub} onClose={()=>setOpenHub(null)} data={data} setData={setData} toasts={toasts} />}
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
          system: hub.system,
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
          <button onClick={startVoice}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{background:listening?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:listening?'#818cf8':'#64748b'}}>
            {IconMic()}
          </button>
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

function SettingsPanel({data, setData, toasts}){
  const s = data.settings || {};
  const [apiKey, setApiKey] = useState(s.apiKey || '');
  const [accent, setAccent] = useState(s.accent || 'indigo');
  const [name, setName] = useState(s.userName || 'You');
  const [ttsProvider, setTtsProvider] = useState(s.ttsProvider || 'browser');
  const [ttsVoice, setTtsVoice] = useState(s.ttsVoice || '');
  const [elevenLabsKey, setElevenLabsKey] = useState(s.elevenLabsKey || '');
  const [elevenLabsVoice, setElevenLabsVoice] = useState(s.elevenLabsVoice || '21m00Tcm4TlvDq8ikWAM');
  const [openaiTtsKey, setOpenaiTtsKey] = useState(s.openaiTtsKey || '');
  const [openaiTtsVoice, setOpenaiTtsVoice] = useState(s.openaiTtsVoice || 'nova');
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
      ttsProvider, ttsVoice, elevenLabsKey, elevenLabsVoice, openaiTtsKey, openaiTtsVoice}}));
    toasts.push('Settings saved');
  };
  const exportAll = ()=>{ const json = JSON.stringify(data,null,2); const blob = new Blob([json],{type:'application/json'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='magverse-export.json'; a.click(); URL.revokeObjectURL(url); };
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

      <div className="flex flex-wrap gap-2 pt-2 border-t" style={{borderColor:'rgba(255,255,255,0.05)'}}>
        <button className="px-3 py-1 rounded bg-indigo-600 text-white text-sm font-medium" onClick={save}>Save Settings</button>
        <button className="px-3 py-1 rounded text-sm" style={{background:'rgba(255,255,255,0.05)'}} onClick={exportAll}>Export JSON</button>
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
