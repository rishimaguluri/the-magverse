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
  hubs: DEFAULT_HUBS()
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

  if(isMobile) return null;

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
            <button className="px-3 py-1 rounded" onClick={()=>{ if(listening){ dict.stop(); setListening(false); } else { dict.start(); setListening(true); } }}>{listening? 'Stop' : 'Voice'}</button>
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
  // Collect all additions first, then do ONE setData call to avoid React batch stomping
  const newEvents=[], newAssignments=[], newWorkouts=[], newSocial=[];
  actions.forEach(a=>{
    if(a.type==='event'){
      newEvents.push({...a.payload, id:uid()});
    }else if(a.type==='assignment'){
      newAssignments.push({...a.payload, id:uid(), status:'To Do'});
    }else if(a.type==='workout'){
      newWorkouts.push({...a.payload, id:uid()});
    }else if(a.type==='reminder'){
      newSocial.push({...a.payload, id:uid()});
    }
  });
  setData(d=>({
    ...d,
    events:      [...(d.events||[]),      ...newEvents],
    assignments: [...(d.assignments||[]), ...newAssignments],
    workouts:    [...(d.workouts||[]),    ...newWorkouts],
    social:      [...(d.social||[]),      ...newSocial],
  }));
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
function normAmPm(s){ return s.replace(/\ba\.m\./gi,'am').replace(/\bp\.m\./gi,'pm'); }

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
  let h = parseInt(hStr);
  const a = (ap||'').toLowerCase();
  if(a==='pm' && h!==12) h+=12;
  if(a==='am' && h===12) h=0;
  return h;
}

function parseHour(s){
  const t = normAmPm(s).toLowerCase();
  // HH:MM + am/pm
  const m1 = t.match(/(\d{1,2}):\d{2}\s*(am|pm)/);
  if(m1) return parseHourStr(m1[1], m1[2]);
  // HH:MM only
  const m2 = t.match(/(\d{1,2}):\d{2}/);
  if(m2) return parseInt(m2[1]);
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

function heuristicParse(text){
  const norm = normAmPm(text);
  const globalDay = parseDay(norm);

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
    const day  = globalDay;
    const when = (day!==undefined||hour!==undefined) ? {day,hour} : undefined;
    const rawTitle = cleanTitle(norm);
    const title = rawTitle.length>1 ? rawTitle.charAt(0).toUpperCase()+rawTitle.slice(1) : text.trim();
    const type = detectType(norm);
    const actions = [];
    if(/assignment|homework|due/.test(norm.toLowerCase())) actions.push({type:'assignment',payload:{title,subject:'Other',notes:text}});
    if(/remind me|reminder/i.test(norm)) actions.push({type:'reminder',payload:{title:text,date:new Date().toISOString()}});
    if(when || (!actions.length && title.length>1)) actions.push({type:'event',payload:{title,type,notes:text,when}});
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

    if(/assignment|homework|due/.test(seg.toLowerCase())) actions.push({type:'assignment',payload:{title,subject:'Other',notes:text}});
    actions.push({type:'event', payload:{title, type, notes:text, when:{day, hour}}});
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
    {id:'assignments', label:'Assignments', icon:IconKanban},
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

function fmtHour(h){ if(h===0) return '12 AM'; if(h<12) return h+' AM'; if(h===12) return '12 PM'; return (h-12)+' PM'; }

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
      {expandedEvent && <EventDetailModal ev={expandedEvent} onClose={()=>setExpandedEvent(null)} onRemove={(ev)=>{ removeEvent(ev); setExpandedEvent(null); }} onEdit={(ev)=>{ setExpandedEvent(null); setModal({editId:ev.id, when:ev.when, prefill:ev}); }} />}
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
      <button
        onClick={e=>{e.stopPropagation(); onRemove&&onRemove(ev);}}
        className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-white/20 text-white/70">
        ×
      </button>
    </div>
  );
}

function EventDetailModal({ev, onClose, onRemove, onEdit}){
  const isMobile = useIsMobile();
  const c = TYPE_COLORS[ev.type] || TYPE_COLORS.Manual;
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const dayStr = ev.when?.day!==undefined ? days[ev.when.day] : null;
  const timeStr = ev.when?.hour!==undefined ? fmtHour(ev.when.hour) : null;
  return (
    <div className={`fixed inset-0 z-50 flex ${isMobile?'items-end':'items-center'} justify-center`}>
      <div className="absolute inset-0" style={{background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)'}} onClick={onClose}/>
      <div className={`relative z-50 p-6 ${isMobile?'w-full rounded-t-3xl':'rounded-2xl w-[380px]'}`} style={{background:'#1a1a24',border:`1px solid ${c.border}`,boxShadow:`0 -8px 40px rgba(0,0,0,0.7), 0 0 40px ${c.bg}`}}>
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
            <span className="text-sm" style={{color:'#94a3b8'}}>
              {[dayStr, timeStr].filter(Boolean).join(' at ')}
            </span>
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
        {/* Notes */}
        {ev.notes && ev.notes !== ev.title && (
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:'#334155'}}>Notes</div>
            <p className="text-sm leading-relaxed" style={{color:'#94a3b8'}}>{ev.notes}</p>
          </div>
        )}
        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-4" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <button
            onClick={()=>{onRemove(ev);onClose();}}
            className="px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-red-900/30"
            style={{color:'#f87171',border:'1px solid rgba(248,113,113,0.2)'}}>
            Delete
          </button>
          <button
            onClick={()=>onEdit&&onEdit(ev)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{background:'rgba(255,255,255,0.06)',color:'#e2e8f0'}}>
            Edit
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white'}}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function WeekView({events, onAdd, onRemove, onExpand, removingIds, offset=0}){
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours = Array.from({length:18}, (_,i)=>6+i);
  const now = new Date();
  const nowDow = (now.getDay()+6)%7;
  // Monday of displayed week
  const weekMon = new Date(now); weekMon.setDate(now.getDate()-nowDow+offset*7);
  // Today's day index — only relevant if we're on the current week
  const todayDi = offset===0 ? nowDow : -1;
  const currentHour = offset===0 ? now.getHours() : -1;

  return (
    <div className="rounded-2xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.01)'}}>
      {/* Day headers */}
      <div className="grid border-b" style={{gridTemplateColumns:'56px repeat(7,1fr)',borderColor:'rgba(255,255,255,0.06)'}}>
        <div className="border-r" style={{borderColor:'rgba(255,255,255,0.06)'}}/>
        {dayNames.map((d,i)=>{
          const colDate = new Date(weekMon); colDate.setDate(weekMon.getDate()+i);
          const isToday = i===todayDi;
          return (
            <div key={d} className="py-3 text-center border-r last:border-r-0" style={{borderColor:'rgba(255,255,255,0.06)',background:isToday?'rgba(99,102,241,0.08)':'transparent'}}>
              <div className="text-xs font-bold uppercase tracking-widest" style={{color:isToday?'#818cf8':'#475569'}}>{d}</div>
              <div className="text-xs mt-0.5" style={{color:isToday?'#6366f1':'#334155'}}>
                {isToday?'Today':colDate.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div style={{maxHeight:'calc(100vh - 300px)', overflowY:'auto'}}>
        {hours.map(h=>(
          <div key={h} className="grid border-b last:border-b-0" style={{gridTemplateColumns:'56px repeat(7,1fr)',borderColor:'rgba(255,255,255,0.04)',minHeight:'54px'}}>
            {/* Time gutter */}
            <div className="border-r flex items-start justify-end pr-3 pt-2 flex-shrink-0" style={{borderColor:'rgba(255,255,255,0.06)'}}>
              <span className="text-xs" style={{color:h===currentHour?'#6366f1':'#334155',fontWeight:h===currentHour?600:400}}>{fmtHour(h)}</span>
            </div>
            {/* Day cells */}
            {dayNames.map((d,di)=>{
              const slotEvs = events.filter(ev=>eventMatchesSlot(ev,di,h));
              const isToday = di===todayDi;
              const isCurrent = isToday && h===currentHour;
              return (
                <div key={d}
                  onClick={()=>onAdd(di,h)}
                  className="group/cell border-r last:border-r-0 p-1 cursor-pointer relative transition-colors"
                  style={{
                    borderColor:'rgba(255,255,255,0.04)',
                    background: isCurrent?'rgba(99,102,241,0.07)' : isToday?'rgba(255,255,255,0.01)':'transparent',
                  }}
                  onMouseEnter={e=>{ if(!slotEvs.length) e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=isCurrent?'rgba(99,102,241,0.07)':isToday?'rgba(255,255,255,0.01)':'transparent'; }}>
                  {isCurrent && <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{background:'#6366f1',opacity:0.7}}></div>}
                  <div className="flex flex-col gap-0.5">
                    {slotEvs.map((ev,idx)=><EventChip key={ev.id} ev={ev} onRemove={onRemove} onExpand={onExpand} removingIds={removingIds} delay={idx*40}/>)}
                  </div>
                  {slotEvs.length===0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                      <span className="text-xs" style={{color:'#334155'}}>+</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayView({events, onAdd, onRemove, onExpand, removingIds, offset=0}){
  const hours = Array.from({length:18}, (_,i)=>6+i);
  const now = new Date();
  const displayDate = new Date(now); displayDate.setDate(now.getDate()+offset);
  const displayDi = (displayDate.getDay()+6)%7;
  const isToday = offset===0;
  const currentHour = isToday ? now.getHours() : -1;
  const dayLabel = displayDate.toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'});

  return (
    <div className="rounded-2xl overflow-hidden" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{borderColor:'rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}>
        <span className="text-sm font-semibold">{dayLabel}</span>
        <span className="text-xs" style={{color:'#475569'}}>{events.filter(ev=>ev.when&&ev.when.day===displayDi).length} events</span>
      </div>
      <div style={{maxHeight:'calc(100vh - 280px)',overflowY:'auto'}}>
        {hours.map(h=>{
          const slotEvs = events.filter(ev=>eventMatchesSlot(ev,displayDi,h));
          const isCurrent = h===currentHour;
          return (
            <div key={h}
              onClick={()=>onAdd(displayDi,h)}
              className="flex border-b last:border-b-0 cursor-pointer group/row transition-colors"
              style={{borderColor:'rgba(255,255,255,0.04)',minHeight:'52px',background:isCurrent?'rgba(99,102,241,0.06)':'transparent'}}
              onMouseEnter={e=>{ if(!slotEvs.length) e.currentTarget.style.background='rgba(255,255,255,0.02)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=isCurrent?'rgba(99,102,241,0.06)':'transparent'; }}>
              {/* Time */}
              <div className="w-20 flex-shrink-0 flex items-start justify-end pr-4 pt-2 border-r" style={{borderColor:'rgba(255,255,255,0.06)'}}>
                <span className="text-xs" style={{color:isCurrent?'#6366f1':'#334155',fontWeight:isCurrent?600:400}}>{fmtHour(h)}</span>
              </div>
              {isCurrent && <div className="w-0.5 flex-shrink-0 self-stretch" style={{background:'#6366f1',opacity:0.8}}></div>}
              {/* Events */}
              <div className="flex-1 p-1.5" onClick={e=>e.stopPropagation()}>
                {slotEvs.map((ev,i)=>{
                  const c = TYPE_COLORS[ev.type]||TYPE_COLORS.Manual;
                  return (
                    <div key={ev.id}
                      onClick={e=>{e.stopPropagation();onExpand&&onExpand(ev);}}
                      className={`group/ev flex items-center gap-2 p-2 rounded-xl mb-1 text-sm font-medium animate-item cursor-pointer ${removingIds?.includes(ev.id)?'removing':''}`}
                      style={{background:c.bg,border:`1px solid ${c.border}`,color:c.text,animationDelay:`${i*50}ms`}}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:c.dot}}></div>
                      <span className="flex-1">{ev.title}</span>
                      {ev.notes && ev.notes!==ev.title && <span className="text-xs opacity-50 truncate max-w-[120px]">{ev.notes}</span>}
                      <button
                        onClick={e=>{e.stopPropagation();onRemove&&onRemove(ev);}}
                        className="opacity-0 group-hover/ev:opacity-100 transition-opacity w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 text-xs">
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Add hint */}
              {slotEvs.length===0 && (
                <div className="flex items-center pr-4 opacity-0 group-hover/row:opacity-100 transition-opacity">
                  <span className="text-xs" style={{color:'#334155'}}>+ Add</span>
                </div>
              )}
            </div>
          );
        })}
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
  const [recurrence, setRecurrence] = useState(p?.recurrence || '');
  const [customDays, setCustomDays] = useState(p?.customDays || []);

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

  const save = () => {
    if(!title.trim()) return;
    const when = (day!==''||hour!=='') ? {day:day!==''?Number(day):undefined, hour:hour!==''?Number(hour):undefined} : undefined;
    const rec = recurrence||undefined;
    const cd  = rec==='custom' && customDays.length ? customDays : undefined;
    onSave({title,type,notes,when,recurrence:rec,customDays:cd});
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
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs mb-1" style={{color:'#475569'}}>Day</label>
            <select className="w-full p-2 rounded-xl text-sm focus:outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}
              value={day} onChange={e=>setDay(e.target.value)}>
              <option value="">No specific day</option>
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d,i)=><option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{color:'#475569'}}>Time</label>
            <select className="w-full p-2 rounded-xl text-sm focus:outline-none" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}
              value={hour} onChange={e=>setHour(e.target.value)}>
              <option value="">No time</option>
              {Array.from({length:18},(_,i)=>6+i).map(h=><option key={h} value={h}>{fmtHour(h)}</option>)}
            </select>
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

/* -------------------- Assignments Panel -------------------- */
function AssignmentsPanel({data, setData, toasts}){
  const columns = ['To Do','In Progress','Review','Done'];
  const [showAdd, setShowAdd] = useState(false);
  const addCard = (card)=>{ setData(d=> ({ ...d, assignments:[...(d.assignments||[]), {...card, id:uid()}] })); toasts.push('Card added'); };

  const grouped = columns.reduce((acc,c)=>{ acc[c]= (data.assignments||[]).filter(a=>a.status===c); return acc; },{});

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Assignments</h2>
        <div>
          <button className="px-3 py-1 rounded bg-indigo-600" onClick={()=>setShowAdd(true)}>New Assignment</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map(col=> (
          <div key={col} className="glass p-3 rounded border-subtle min-h-[200px]">
            <div className="font-semibold mb-2">{col}</div>
            <div className="flex flex-col gap-2">
              {(grouped[col]||[]).map(card=> (
                <div key={card.id} className={`p-2 rounded ${card.dueDate && new Date(card.dueDate) < new Date() ? 'bg-red-700':'bg-white/3'}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{card.title}</div>
                    <div className="text-xs opacity-80">{card.priority||'Med'}</div>
                  </div>
                  <div className="text-xs opacity-70">{card.subject} {card.dueDate && <span className="ml-2 text-xs">• due {new Date(card.dueDate).toLocaleDateString()}</span>}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AssignmentModal onClose={()=>setShowAdd(false)} onSave={(c)=>{ addCard(c); setShowAdd(false); }} />}
    </div>
  );
}

function AssignmentModal({onClose, onSave}){
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Other');
  const [priority, setPriority] = useState('Med');
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="glass p-4 rounded z-50 w-96">
        <h3 className="font-semibold mb-2">New Assignment</h3>
        <input className="w-full p-2 mb-2 bg-transparent border border-white/5 rounded" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <div className="flex gap-2 mb-2">
          <select className="flex-1 p-2 bg-transparent border border-white/5 rounded" value={subject} onChange={e=>setSubject(e.target.value)}>
            <option>Accounting</option>
            <option>Engineering</option>
            <option>Finance</option>
            <option>CS</option>
            <option>Other</option>
          </select>
          <select className="w-28 p-2 bg-transparent border border-white/5 rounded" value={priority} onChange={e=>setPriority(e.target.value)}>
            <option>High</option>
            <option>Med</option>
            <option>Low</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 rounded" onClick={onClose}>Cancel</button>
          <button className="px-3 py-1 rounded bg-indigo-600" onClick={()=>onSave({title,subject,priority,status:'To Do'})}>Save</button>
        </div>
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
const STOCK_PICKS = [
  {
    ticker:'NVDA', name:'NVIDIA Corporation', sector:'Semiconductors', tags:['AI Infrastructure','High Growth'],
    summary:'Near-monopoly on AI training hardware at the epicenter of the largest infrastructure buildout in tech history.',
    thesis:`NVIDIA's H100 and Blackwell GPU architectures are backlogged 12+ months, with Microsoft, Google, Amazon, and Meta collectively committing hundreds of billions in AI capex through 2026. The data center segment now represents over 85% of revenue, growing triple-digits year-over-year. CUDA's decade-long developer ecosystem creates a software moat that AMD and Intel are years behind replicating — switching costs are enormous because models, toolchains, and entire research workflows are built on CUDA.\n\nThe upcoming Blackwell Ultra and Rubin architectures suggest NVIDIA is pulling 2–3 years ahead of competitors on performance-per-watt. Sovereign AI spending (governments building national AI infrastructure) adds an entirely new demand vector beyond hyperscalers. Risks include US export restrictions on advanced chips to China, customer concentration among a handful of hyperscalers, and valuation compression if AI capex sentiment reverses.`,
    links:[
      {label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/NVDA'},
      {label:'Recent News',url:'https://news.google.com/search?q=NVIDIA+NVDA+stock+AI+chips'},
      {label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/NVDA'},
      {label:'Investor Relations',url:'https://investor.nvidia.com/'},
    ]
  },
  {
    ticker:'MSFT', name:'Microsoft Corporation', sector:'Cloud / Software', tags:['Cloud','AI','Defensive'],
    summary:'Azure cloud growth plus deep OpenAI integration makes Microsoft the enterprise AI stack of record.',
    thesis:`Microsoft's $13B OpenAI investment gives it exclusive access to GPT-4 and future models baked directly into Azure, Office 365, GitHub Copilot, and Dynamics. The result is an AI-first enterprise suite with switching costs so high that most Fortune 500 companies effectively cannot leave. Azure is the #2 cloud provider globally and gaining share in the AI workload category where margins are highest.\n\nCopilot is being rolled out at $30/seat/month on top of existing M365 subscriptions — for a company with 400M+ commercial seats, even 10% penetration represents ~$14B in incremental annual revenue. The gaming division (via Activision) adds a consumer entertainment optionality layer. Risks include antitrust scrutiny of the OpenAI relationship, Azure growth deceleration, and the possibility that open-source models commoditize the AI layer.`,
    links:[
      {label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/MSFT'},
      {label:'Recent News',url:'https://news.google.com/search?q=Microsoft+MSFT+Azure+Copilot+earnings'},
      {label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/MSFT'},
      {label:'Investor Relations',url:'https://www.microsoft.com/en-us/investor'},
    ]
  },
  {
    ticker:'BRK-B', name:'Berkshire Hathaway B', sector:'Conglomerate', tags:['Value','Defensive','Dividend'],
    summary:'Buffett\'s all-weather conglomerate with $330B+ in cash reserves and a 60-year track record of capital allocation.',
    thesis:`Berkshire's $330B+ cash pile — the largest in corporate history — gives it unmatched optionality to deploy capital into a recession, market crash, or transformative acquisition. The insurance float (~$170B) is effectively free leverage that Buffett has compounded at 20%+ annually for decades. Core holdings like BNSF Railroad, Berkshire Hathaway Energy, and GEICO provide durable cash flows uncorrelated with tech cycles.\n\nIn an environment of elevated valuations, BRK-B acts as a capital-preservation vehicle with equity-like upside. The conglomerate structure means it is implicitly diversified across industrials, energy, financials, and consumer brands. Risks include succession uncertainty post-Buffett/Munger, the challenge of deploying capital at scale, and underperformance in a sustained bull market where concentrated growth bets outperform.`,
    links:[
      {label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/BRK-B'},
      {label:'Recent News',url:'https://news.google.com/search?q=Berkshire+Hathaway+Buffett+BRK'},
      {label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/BRK.B'},
      {label:'Annual Letters',url:'https://www.berkshirehathaway.com/letters/letters.html'},
    ]
  },
  {
    ticker:'META', name:'Meta Platforms', sector:'Digital Advertising', tags:['AI','Advertising','Social'],
    summary:'Dominant ad duopoly with Instagram Reels monetization accelerating and Ray-Ban AI glasses as the next hardware platform.',
    thesis:`Meta controls roughly 20% of global digital advertising spend across Facebook, Instagram, and WhatsApp — a reach of 3.3 billion daily active users. After a painful 2022 reset, the company has emerged leaner: headcount cut by 20%+, AI-driven ad targeting (Advantage+) driving click-through rates 30–50% above prior baselines, and Reels monetization now matching Stories.\n\nThe hardware optionality is underappreciated: Ray-Ban Meta AI glasses sold out repeatedly in 2024 and represent the leading contender to be the first mass-market AI wearable. WhatsApp Business (1B+ business users) is barely monetized — a massive revenue unlock as Meta rolls out commerce and payment features across emerging markets. Risks include regulatory pressure in the EU, advertiser concentration, and Reality Labs burning ~$15B/year with no clear near-term monetization path.`,
    links:[
      {label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/META'},
      {label:'Recent News',url:'https://news.google.com/search?q=Meta+Platforms+META+stock+AI+advertising'},
      {label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/META'},
      {label:'Investor Relations',url:'https://investor.fb.com/'},
    ]
  },
  {
    ticker:'PLTR', name:'Palantir Technologies', sector:'AI Software', tags:['AI','Government','Enterprise'],
    summary:'First pure-play AI software company to achieve GAAP profitability, with a growing commercial AIP platform alongside its government moat.',
    thesis:`Palantir's AI Platform (AIP) bridges the gap between foundation models and real enterprise operations — it's not just a chatbot layer but a system that connects AI to live data pipelines, compliance workflows, and decision-making processes. The US government business (defense, intelligence) provides a high-margin, sticky revenue floor that private-sector competitors can't access. Commercial revenue is now the growth engine, up 55%+ YoY in the US.\n\nThe AIP "bootcamp" sales model — intensive 5-day workshops where clients build working AI applications — has become a flywheel for contract conversion. As one of the few software companies that built its architecture around secure, auditable AI from day one, Palantir is well-positioned for the regulated industries (defense, healthcare, finance) where most AI vendors struggle. Risks include high valuation multiples, customer concentration, and dependence on government contract cycles.`,
    links:[
      {label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/PLTR'},
      {label:'Recent News',url:'https://news.google.com/search?q=Palantir+PLTR+AIP+stock+earnings'},
      {label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/PLTR'},
      {label:'Investor Relations',url:'https://investors.palantir.com/'},
    ]
  },
  {
    ticker:'AMZN', name:'Amazon.com Inc.', sector:'Cloud / E-Commerce', tags:['Cloud','Advertising','Logistics'],
    summary:'AWS margin expansion and a rapidly growing advertising business are transforming Amazon into a high-margin cash machine.',
    thesis:`Amazon Web Services generates ~60% of total operating income on ~17% of total revenue — and its operating margin is expanding as AI workloads (higher margin) displace legacy compute. The advertising business ($50B+ run rate) is the most underappreciated division: it sits on top of the highest-intent shopping data in the world, making it structurally superior to most other ad platforms.\n\nPrime's logistics network is a 15-year, $300B+ capital investment that no competitor can replicate. Same-day and next-day delivery is now available to 65%+ of US customers, creating a retention flywheel. Internationally, Amazon is still sub-scale in Southeast Asia, India, and Latin America — these markets represent the next decade of growth. Risks include AWS competition from Azure and Google Cloud, antitrust regulation of the marketplace, and the capital intensity of logistics infrastructure.`,
    links:[
      {label:'Yahoo Finance',url:'https://finance.yahoo.com/quote/AMZN'},
      {label:'Recent News',url:'https://news.google.com/search?q=Amazon+AMZN+AWS+stock+earnings'},
      {label:'Seeking Alpha',url:'https://seekingalpha.com/symbol/AMZN'},
      {label:'Investor Relations',url:'https://ir.aboutamazon.com/'},
    ]
  },
];

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
  const tickers = STOCK_PICKS.map(s=>s.ticker);
  const [quotes, setQuotes] = useState(()=>{
    try{
      const c = JSON.parse(localStorage.getItem(QUOTES_CACHE_KEY));
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
        const c = JSON.parse(localStorage.getItem(QUOTES_CACHE_KEY));
        if(c && Date.now()-c.ts < QUOTES_CACHE_TTL){ setFetchedAt(new Date(c.ts)); return; }
      }catch(e){}
    }
    setLoading(true); setError(false);
    try{
      const result = await fetchAllQuotes(tickers);
      setQuotes(result);
      const now = Date.now();
      localStorage.setItem(QUOTES_CACHE_KEY, JSON.stringify({ts:now, data:result}));
      setFetchedAt(new Date(now));
    }catch(e){
      setError(true);
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); },[]);

  return {quotes, fetchedAt, loading, error, refetch:()=>load(true)};
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
  const {quotes, fetchedAt, loading, error, refetch} = useStockQuotes();

  return (
    <div className="mb-10">
      <div className={`flex ${isMobile?'flex-col gap-1':'items-center justify-between'} mb-4`}>
        <h3 className="text-base font-bold tracking-tight">Stock Picks</h3>
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
        {STOCK_PICKS.map(pick=>(
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
  const isMobile = useIsMobile();

  useEffect(()=>{ ls(historyKey, messages); }, [messages]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages, typing]);

  const speak = (txt) => {
    if(!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Strip all markdown so it reads naturally out loud
    const clean = txt
      .replace(/#{1,6}\s*/g,'')           // headers
      .replace(/\*\*\*(.+?)\*\*\*/g,'$1') // bold+italic
      .replace(/\*\*(.+?)\*\*/g,'$1')     // bold
      .replace(/\*(.+?)\*/g,'$1')         // italic
      .replace(/__(.+?)__/g,'$1')         // bold underscore
      .replace(/_(.+?)_/g,'$1')           // italic underscore
      .replace(/~~(.+?)~~/g,'$1')         // strikethrough
      .replace(/`{1,3}[^`]*`{1,3}/g,'')  // code
      .replace(/\[(.+?)\]\(.+?\)/g,'$1') // links
      .replace(/^>\s*/gm,'')             // blockquotes
      .replace(/^[-*+]\s+/gm,'')        // unordered bullets
      .replace(/^\d+\.\s+/gm,'')        // numbered lists
      .replace(/^-{3,}$/gm,'')          // horizontal rules ---
      .replace(/→|←|↑|↓|▶|►/g,' ')     // arrows
      .replace(/\n{3,}/g,'\n\n')        // excess newlines
      .trim();

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      // Priority: best natural/neural voices first
      const savedVoiceName = ls('magverse:v1')?.settings?.ttsVoice || '';
      const ranked = [
        v => savedVoiceName && v.name === savedVoiceName,
        v => v.name === 'Samantha',
        v => v.name === 'Karen',
        v => v.name === 'Daniel',
        v => v.name.includes('Aria') && v.name.includes('Natural'),
        v => v.name.includes('Jenny') && v.name.includes('Natural'),
        v => v.name.includes('Guy') && v.name.includes('Natural'),
        v => v.name.includes('Microsoft Aria'),
        v => v.name.includes('Microsoft Jenny'),
        v => v.name.includes('Google US English'),
        v => v.lang==='en-US' && v.localService===false,
        v => v.lang==='en-US',
        v => v.lang.startsWith('en'),
      ];
      let voice = null;
      for(const test of ranked){ voice = voices.find(test); if(voice) break; }

      const utt = new SpeechSynthesisUtterance(clean);
      if(voice) utt.voice = voice;
      utt.rate = 0.90; utt.pitch = 1.0; utt.volume = 1.0;
      utt.onstart = ()=>setSpeaking(true);
      utt.onend = ()=>setSpeaking(false);
      utt.onerror = ()=>setSpeaking(false);
      window.speechSynthesis.speak(utt);
    };

    if(window.speechSynthesis.getVoices().length === 0){
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, {once:true});
    } else {
      doSpeak();
    }
  };

  const cancelSpeak = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };

  const sendMsg = async (msgText) => {
    const content = (msgText||text).trim();
    if(!content) return;
    const userMsg = {id:uid(), role:'user', text:content, at:new Date().toISOString()};
    setMessages(m=>[...m, userMsg]); setText(''); setTyping(true);
    try{
      const apiKey = (ls('magverse:v1')?.settings?.apiKey) || '';
      if(!apiKey){
        await new Promise(r=>setTimeout(r,600));
        const reply = 'Add your Anthropic API key in Settings to enable real AI responses.';
        setMessages(m=>[...m, {id:uid(), role:'ai', text:reply, at:new Date().toISOString()}]);
        setTyping(false); return;
      }
      // Build conversation history — append plain-text reminder to every user turn
      const PLAIN_REMINDER = ' (Reply in plain spoken sentences only. Absolutely no markdown, no asterisks, no bullet points, no headers, no arrows, no bold, no numbered lists.)';
      const history = [...messages, userMsg].map(m=>({
        role: m.role==='user' ? 'user' : 'assistant',
        content: m.role==='user' ? m.text + PLAIN_REMINDER : m.text,
      }));
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
          system: hub.system,
          messages: history,
        })
      });
      const j = await resp.json();
      if(j.error) throw new Error(j.error.message || 'API error');
      const raw = j?.content?.[0]?.text || '(no response)';
      // Strip any residual markdown from display too
      const out = raw
        .replace(/#{1,6}\s*/g,'').replace(/\*\*\*(.+?)\*\*\*/g,'$1').replace(/\*\*(.+?)\*\*/g,'$1')
        .replace(/\*(.+?)\*/g,'$1').replace(/__(.+?)__/g,'$1').replace(/_(.+?)_/g,'$1')
        .replace(/`{1,3}[^`]*`{1,3}/g,'').replace(/\[(.+?)\]\(.+?\)/g,'$1')
        .replace(/^>\s*/gm,'').replace(/^[-*+]\s+/gm,'').replace(/^\d+\.\s+/gm,'')
        .replace(/^-{3,}$/gm,'').replace(/→|←|↑|↓/g,'').replace(/\|.+\|/g,'')
        .replace(/\n{3,}/g,'\n\n').trim();
      const bot = {id:uid(), role:'ai', text:out, at:new Date().toISOString()};
      setMessages(m=>[...m, bot]);
      speak(out);
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
function SettingsPanel({data, setData, toasts}){
  const [apiKey, setApiKey] = useState(data.settings?.apiKey || '');
  const [accent, setAccent] = useState(data.settings?.accent || 'indigo');
  const [name, setName] = useState(data.settings?.userName || 'You');
  const [ttsVoice, setTtsVoice] = useState(data.settings?.ttsVoice || '');
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(()=>{
    const load = ()=>{
      const v = window.speechSynthesis?.getVoices().filter(v=>v.lang.startsWith('en')) || [];
      setAvailableVoices(v);
    };
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return ()=>window.speechSynthesis?.removeEventListener('voiceschanged', load);
  },[]);

  const testVoice = ()=>{
    if(!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance("Hey, this is what I sound like. Pretty natural, right?");
    const voice = availableVoices.find(v=>v.name===ttsVoice);
    if(voice) utt.voice = voice;
    utt.rate = 0.90; utt.pitch = 1.0;
    window.speechSynthesis.speak(utt);
  };

  const save = ()=>{ setData(d=>({...d, settings:{...d.settings, apiKey,accent,userName:name,avatarInitial:(name[0]||'Y').toUpperCase(),ttsVoice}})); toasts.push('Settings saved'); };
  const exportAll = ()=>{ const json = JSON.stringify(data,null,2); const blob = new Blob([json],{type:'application/json'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='magverse-export.json'; a.click(); URL.revokeObjectURL(url); };
  const clearAll = ()=>{ if(!confirm('Clear all data? This cannot be undone.')) return; localStorage.clear(); location.reload(); };
  const resetHubs = ()=>{ if(!confirm('Reset all hub prompts to defaults? Custom edits will be lost.')) return; setData(d=>({...d, hubs:DEFAULT_HUBS()})); toasts.push('Hub prompts reset'); };
  return (
    <div className="glass p-4 rounded border-subtle w-full max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs opacity-80">Anthropic API Key</label>
          <input className="w-full p-2 bg-transparent border border-white/5 rounded" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-..." />
        </div>
        <div>
          <label className="block text-xs opacity-80">Accent Preset</label>
          <select className="w-full p-2 bg-transparent border border-white/5 rounded" value={accent} onChange={e=>setAccent(e.target.value)}>
            <option value="indigo">Indigo</option>
            <option value="violet">Violet</option>
            <option value="cyan">Cyan</option>
            <option value="rose">Rose</option>
            <option value="amber">Amber</option>
          </select>
        </div>
        <div>
          <label className="block text-xs opacity-80">Name</label>
          <input className="w-full p-2 bg-transparent border border-white/5 rounded" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs opacity-80">Avatar Initial</label>
          <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center">{(name[0]||'Y').toUpperCase()}</div>
        </div>
        <div className="col-span-2">
          <label className="block text-xs opacity-80 mb-1">Voice for AI Responses</label>
          <div className="flex gap-2">
            <select className="flex-1 p-2 bg-transparent border border-white/5 rounded text-sm" value={ttsVoice} onChange={e=>setTtsVoice(e.target.value)}>
              <option value="">(Auto — best available)</option>
              {availableVoices.map(v=>(
                <option key={v.name} value={v.name}>{v.name} {v.localService?'':'🌐'}</option>
              ))}
            </select>
            <button onClick={testVoice} className="px-3 py-1 rounded text-sm" style={{background:'rgba(255,255,255,0.06)',color:'#94a3b8'}}>▶ Test</button>
          </div>
          <p className="text-xs mt-1" style={{color:'#334155'}}>🌐 = online (higher quality) · For best results on Windows, install Microsoft Neural voices in System Settings → Speech</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="px-3 py-1 rounded bg-indigo-600" onClick={save}>Save</button>
        <button className="px-3 py-1 rounded" onClick={exportAll}>Export JSON</button>
        <button className="px-3 py-1 rounded" onClick={resetHubs} style={{background:'rgba(99,102,241,0.3)',color:'#a5b4fc'}}>Reset Hub Prompts</button>
        <button className="px-3 py-1 rounded bg-red-600" onClick={clearAll}>Clear All Data</button>
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

/* -------------------- Render -------------------- */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App, null));
