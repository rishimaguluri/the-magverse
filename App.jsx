// Using global React and ReactDOM UMD builds (loaded in index.html)
console.log('[Magverse] App.jsx v86 executing');
const { useEffect, useState, useRef, useReducer } = React;

// Simple helpers
const uid = (p = '') => Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + p;
function ls(k, v) {
  if (typeof v !== 'undefined') {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {}
    return;
  }
  try {
    const t = localStorage.getItem(k);
    return t ? JSON.parse(t) : null;
  } catch(e) { return null; }
}

// Hub system prompts
const NO_MARKDOWN = `CRITICAL FORMATTING RULE: You are speaking out loud. Never use markdown. No asterisks, no pound signs, no dashes as bullets, no numbered lists, no arrows, no blockquotes, no bold, no italics, no headers, no horizontal rules. Write only in plain natural spoken sentences and paragraphs, exactly as you would say it out loud to someone's face. If you need to list things, weave them into a sentence naturally.`;

/* §10 — Dynamic prompt builders for state-driven briefing hubs */
function buildPhilosophyPrompt(pb){
  if(!pb) return NO_MARKDOWN + '\n\nYou are a philosophy professor. Have a deep Socratic conversation.';
  const avg = pb.speakingScoreHistory?.length ? (pb.speakingScoreHistory.reduce((s,x)=>s+x.score,0)/pb.speakingScoreHistory.length).toFixed(1) : 'N/A';
  const lastS = pb.speakingScoreHistory?.at?.(-1);
  const cbList = (pb.conceptCallbackPool||[]).map(c=>`${c.concept}: ${c.answer}`).join(' | ');
  const daysLog = (pb.completedInCurrentTheme||[]).join('\n  ');
  return `${NO_MARKDOWN}

You are Rishi Maguluri's philosophy training system. Follow every instruction precisely.

CURRICULUM STATE: Theme = "${pb.currentTheme}" | Today = Day ${pb.currentDay}
Days completed in this theme:
  ${daysLog||'(none yet)'}

SPEAKING TRAINING (do every session): After a conceptual question, assign one speaking challenge using this 5-beat rubric: Beat 1 = state your claim (1 crisp sentence). Beat 2 = give the principle or mechanism, not an example yet. Beat 3 = steelman the best objection to your own view, do not thin it out. Beat 4 = dismantle that objection, close its best comeback. Beat 5 = one concrete example. Score out of 100. Say the score, which beat was weakest, and the single most important fix.
ACTIVE WEAKNESS (focus here): ${pb.activeWeakness||'none'}
Score history: ${pb.speakingScoreHistory?.map(s=>`#${s.n}=${s.score}`).join(', ')||'none'} | Avg = ${avg} | Last = ${lastS?`#${lastS.n} "${lastS.topic}" = ${lastS.score}`:'N/A'}

CONCEPT CALLBACK POOL (open each session with a random one from here): ${cbList}

USED LISTS — DO NOT REPEAT: Greek stories used: ${(pb.greekStoriesUsed||[]).join(', ')||'none'}. Reasoning tools used: ${(pb.reasoningToolsUsed||[]).join(', ')||'none'}. Terms introduced: ${(pb.termsUsed||[]).join(', ')||'none'}. Flow Reps done: ${(pb.flowRepsUsed||[]).join(', ')||'none'}.

SESSION FORMAT for Day ${pb.currentDay}: 1) Open with one callback drill. 2) Introduce 3-4 new concepts from the theme via Socratic questions, weave in one NEW Greek story (not from the used list), one NEW reasoning tool (not from the used list), and define 2-3 new philosophical terms. 3) Assign one speaking challenge at a conceptual peak. 4) Close with one practical Flow Rep (a concrete action Rishi will do today — not from the used list). 5) At the very end of your response include this exact hidden update block on its own line: <!--STATE_UPDATE:{"type":"philosophy","dayAdvanced":true,"greekStoryUsed":"STORY_NAME","reasoningToolUsed":"TOOL_NAME","termsDefined":["term1","term2"],"flowRepUsed":"REP_NAME","speakingScore":{"n":${(pb.speakingScoreHistory?.length||0)+1},"topic":"TOPIC","score":0,"grade":"TBD"}}-->

When Rishi says "philosophy", "let's go", or "start" — begin the Day ${pb.currentDay} session immediately.`;
}

function buildAcumenPrompt(ba){
  if(!ba) return NO_MARKDOWN + '\n\nYou are a Wall Street business acumen trainer. Run a structured daily session.';
  const avg = ba.speakingScoreHistory?.length ? (ba.speakingScoreHistory.reduce((s,x)=>s+x.score,0)/ba.speakingScoreHistory.length).toFixed(2) : 'N/A';
  const lastS = ba.speakingScoreHistory?.at?.(-1);
  const cbList = (ba.callbackQueue||[]).map(c=>`${c.concept}: ${c.answer}`).join(' | ');
  const themes = (ba.completedThemes||[]).join('; ');
  return `${NO_MARKDOWN}

You are Rishi Maguluri's business acumen training system. Follow every instruction precisely.

CURRICULUM STATE: Theme = "${ba.currentWeekTheme}" | Today = Day ${ba.currentDayInTheme}
Portfolio status: ${ba.portfolioStatus==='paused_cash'?'100% cash — portfolio paused':ba.portfolioStatus}
Continuity note: ${ba.continuityNote||'(none)'}
Completed prior themes: ${themes||'(none)'}

SPEAKING TRAINING (mandatory): Format rotation — last format was "${ba.lastSpeakingFormat||'explain-why'}". Pick next unused from: explain-why, CFO-decision, teach-back-to-beginner, compare-and-judge, evaluate-a-claim, explain-a-paradox, synthesis, self-reflection/diagnose, herd-behavior-challenge, diagnose-the-crowd. Score out of 10: clarity of claim (2), precision of mechanism (3), concrete numbers/examples (2), terminology accuracy (2), concision (1). Give score, one-line highlight, one-line fix.
ACTIVE WEAKNESS (drill hard): ${ba.activeWeakness||'none'}
Score history: ${ba.speakingScoreHistory?.map(s=>`#${s.n}=${s.score}`).join(', ')||'none'} | Avg = ${avg}/10 | Last = ${lastS?`#${lastS.n} "${lastS.topic}" = ${lastS.score}`:'N/A'}

CONCEPT CALLBACK QUEUE (open with 2 rapid-fire callbacks from these): ${cbList}

SESSION FORMAT for Day ${ba.currentDayInTheme}: 1) Open with 2 rapid-fire callback drills. 2) Today's content: Behavioral Finance Day ${ba.currentDayInTheme} — cover herd behavior, FOMO, momentum effects, how crowds create and amplify price moves, practical examples from recent markets. 3) Introduce 2-3 new vocab terms. 4) Assign one speaking challenge using the next format in rotation. 5) At the very end of your response include this hidden update block on its own line: <!--STATE_UPDATE:{"type":"acumen","dayAdvanced":true,"callbacksReviewed":["concept1","concept2"],"vocabBusiness":["term1","term2"],"speakingScore":{"n":${(ba.speakingScoreHistory?.length||0)+1},"topic":"TOPIC","score":0}}-->

When Rishi says "today", "let's go", or "start" — begin Day ${ba.currentDayInTheme} immediately.`;
}

/* Parse hidden STATE_UPDATE block from AI response and persist to data */
function applyStateUpdate(rawText, setData){
  const m = rawText.match(/<!--STATE_UPDATE:(\{[\s\S]*?\})-->/);
  if(!m) return;
  let upd;
  try{ upd = JSON.parse(m[1]); }catch(e){ return; }
  if(!upd?.type) return;
  if(upd.type === 'philosophy'){
    setData(d=>{
      const pb = {...(d.philosophyBriefing||{})};
      if(upd.dayAdvanced) pb.currentDay = (pb.currentDay||1)+1;
      if(upd.greekStoryUsed) pb.greekStoriesUsed = [...(pb.greekStoriesUsed||[]), upd.greekStoryUsed];
      if(upd.reasoningToolUsed) pb.reasoningToolsUsed = [...(pb.reasoningToolsUsed||[]), upd.reasoningToolUsed];
      if(upd.termsDefined?.length) pb.termsUsed = [...(pb.termsUsed||[]), ...upd.termsDefined];
      if(upd.flowRepUsed) pb.flowRepsUsed = [...(pb.flowRepsUsed||[]), upd.flowRepUsed];
      if(upd.speakingScore?.score > 0){
        pb.speakingScoreHistory = [...(pb.speakingScoreHistory||[]), upd.speakingScore];
      }
      return {...d, philosophyBriefing: pb};
    });
  } else if(upd.type === 'acumen'){
    setData(d=>{
      const ba = {...(d.businessAcumenBriefing||{})};
      if(upd.dayAdvanced) ba.currentDayInTheme = (ba.currentDayInTheme||1)+1;
      if(upd.speakingScore?.score > 0){
        ba.speakingScoreHistory = [...(ba.speakingScoreHistory||[]), upd.speakingScore];
      }
      return {...d, businessAcumenBriefing: ba};
    });
  }
}

const DEFAULT_HUBS = () => [
  { id:'hub1', emoji:'🏛️', name:'Philosophy', stateDriven:true, system:`${NO_MARKDOWN}\n\nYou are a brilliant philosophy professor running Rishi's structured daily briefing. When Rishi opens this hub, run the full state-driven session.` },
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
  { id:'hub-acumen', emoji:'📊', name:'Business Acumen', stateDriven:true, system:`${NO_MARKDOWN}\n\nYou are Rishi's structured daily business acumen trainer. Run the state-driven session when Rishi opens this hub.` },
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
  resumeEditor: null,
  consulting: null,
  reflect: null,
  seenDeals: [],
  inbox: [], // §3 universal capture
  // §7 Research panels
  theses: [],
  companyWatchlist: [],
  decisionJournal: [],
  // §8 Mental models library
  mentalModels: [
    {id:'mm1',name:'Variant Perception',description:'An investment thesis only generates alpha if it differs from consensus in a way that is correct. The goal is to find cases where the market is wrong and you know why.',whenToUse:'Before any investment: what is the market pricing in, and how does my view differ specifically?',example:'Market thinks growth is mean-reverting; variant view: structural tailwind makes this durable.',tags:['investing']},
    {id:'mm2',name:"Porter's Five Forces",description:'Framework for analyzing competitive intensity: threat of new entrants, supplier power, buyer power, threat of substitutes, competitive rivalry.',whenToUse:'Sector analysis, business quality assessment.',example:'High supplier power + high rivalry = poor industry economics. Seek industries with structural barriers.',tags:['strategy','investing']},
    {id:'mm3',name:'Margin of Safety',description:'Buy assets at a significant discount to intrinsic value to protect against estimation errors and bad luck.',whenToUse:'Valuation and position sizing.',example:'Intrinsic value $100 → only buy at $60-70. The gap absorbs mistakes.',tags:['investing','valuation']},
    {id:'mm4',name:'Economic Moats',description:'Durable competitive advantages: network effects, switching costs, cost advantages, efficient scale, intangible assets. Moats determine whether high returns on capital are sustainable.',whenToUse:'Business quality analysis.',example:'Software with high switching costs → evaluate depth of integration, not current margins alone.',tags:['investing','strategy']},
    {id:'mm5',name:'Core-Satellite Portfolio',description:'Stable core (diversified, low-turnover) + smaller satellite of higher-conviction active ideas. Core limits catastrophic error; satellite captures upside of concentrated research.',whenToUse:'Portfolio construction and risk management.',example:'70% core exposure, 30% satellite of 5-10 high-conviction small-cap positions.',tags:['portfolio','investing']},
    {id:'mm6',name:'Uncorrelated Return Streams',description:"Dalio: combining 15-20 genuinely uncorrelated return streams reduces portfolio risk ~75% while keeping expected return constant. Diversification only works when correlations are truly low.",whenToUse:'Portfolio construction, risk budgeting.',example:'Domestic equity + EM + commodities + TIPS + alternatives — check correlation matrix, not just asset class labels.',tags:['portfolio','investing']},
  ],
  // §12 Deep Work Ramp
  rampSessions: [],
  rampRitual: { cue: '', timerMin: 75 },
  /* §10 — Philosophy briefing (seeded from session state as of Aug 2026) */
  philosophyBriefing: {
    currentTheme:"The Good Life — Happiness, Flow & Deep Focus",
    currentDay:5,
    completedThemes:[],
    conceptCallbackPool:[
      {concept:"Virtue ethics",answer:"becoming a certain kind of person via practical wisdom; virtue as a disposition, not mere rule-following"},
      {concept:"Eudaimonia",answer:"human flourishing through excellent activity over a whole life; something you DO, not a mood"},
      {concept:"Dichotomy of control",answer:"separate what is up to you (judgments, choices) from what is not (outcomes, others' reactions)"},
      {concept:"Preference vs. dependence",answer:"preferring an outcome vs. making it your 'end all be all'"},
      {concept:"The absurd",answer:"collision between the human need for meaning and the universe's silence; response is revolt; imagine Sisyphus happy"},
      {concept:"Adlerian teleology",answer:"behavior understood by the future goal it serves, not only past cause"},
      {concept:"Compensation / inferiority feelings",answer:"universal felt inferiority as the engine of healthy striving"},
      {concept:"Creative self / style of life",answer:"we interpret and construct personality; style of life largely set in early childhood but revisable"},
      {concept:"Hedonic treadmill",answer:"return to baseline as aspiration level rises"},
      {concept:"Flow + challenge-skill balance",answer:"~4% past current skill; too-hard=anxiety, too-easy=boredom; three entry conditions"},
      {concept:"Three life tasks",answer:"work, friendship, love; neurosis = evasion of a task"},
      {concept:"Autotelic",answer:"done for its own sake; the doing is the reward"},
      {concept:"Deep work / attention residue",answer:"switching tasks leaves residue; deep work = protected focus time"},
      {concept:"Separation of tasks",answer:"whose-task test: who bears the consequences? Only own your task"},
      {concept:"Aristotle's three friendships",answer:"utility, pleasure, virtue — only virtue is lasting"},
    ],
    greekStoriesUsed:["Sword of Damocles","Oedipus and the prophecy","Orestes on trial","King Midas","Daedalus in the Labyrinth","the Lotus-Eaters","Achilles chooses his fate"],
    reasoningToolsUsed:["necessary vs. sufficient conditions","false dichotomy","genetic fallacy","fallacy of composition","continuum fallacy","is-ought gap","Goodhart's Law","Goldilocks principle","opportunity cost","motte-and-bailey"],
    termsUsed:["Eudaimonia","Teleology","Dichotomy of control","Social interest","The Absurd","Compensation","Determinism","Readiness potential","Style of life","Reactive attitudes","Hedonic adaptation","Gemeinschaftsgefuehl","Flow","Autotelic","Attention residue","The Three Life Tasks","Separation of tasks","Friendship of virtue"],
    flowRepsUsed:["Challenge Dial framing","Distraction Dump + Single Tab","single-deliverable time-block"],
    speakingScoreHistory:[
      {n:1,topic:"Virtue ethics",score:83,grade:"B"},
      {n:2,topic:"Dichotomy of control",score:87,grade:"B+"},
      {n:3,topic:"The absurd (Camus)",score:79,grade:"C+"},
      {n:4,topic:"Determinism & the creative self",score:85,grade:"B"},
      {n:5,topic:"Libet experiment",score:77,grade:"C+"},
      {n:6,topic:"Hedonic treadmill",score:84,grade:"B"},
      {n:7,topic:"Flow",score:90,grade:"A-"},
      {n:8,topic:"Three life tasks",score:85,grade:"B"},
    ],
    activeWeakness:"Restating view instead of DISMANTLING objection; not closing objection's best comeback",
    completedInCurrentTheme:[
      "Day 1: Hedonic vs. eudaimonic happiness; hedonic treadmill; King Midas story; Goodhart's Law; Treadmill Audit",
      "Day 2: Flow; challenge-skill balance; three entry conditions; autotelic; Daedalus story; Goldilocks principle; Challenge Dial exercise",
      "Day 3: Deep work + attention residue; Lotus-Eaters story; Three Life Tasks; opportunity cost; Three-Legged Stool Check",
      "Day 4: Separation of tasks; Achilles-chooses-his-fate; Aristotle's three friendships; motte-and-bailey; Whose-Task-Is-It Audit",
    ],
  },
  /* §10 — Business Acumen briefing (seeded from session state as of Aug 2026) */
  businessAcumenBriefing: {
    currentWeekTheme:"Behavioral Finance & Market Psychology",
    currentDayInTheme:2,
    completedThemes:[
      "Capital Allocation (capex, sector rotation, buybacks vs M&A, execution beats strategy, Apple-vs-Amazon return-vs-reinvest)",
      "Valuation (Price vs Value & P/E, PEG ratio, priced for perfection, short selling/short squeeze, discount rate & present value, bad news is good news/Fed put)",
    ],
    portfolioStatus:"paused_cash",
    callbackQueue:[
      {concept:"Expectations treadmill",answer:"performing well raises the bar so a company must keep exceeding ever-higher expectations"},
      {concept:"Capex + timing gap",answer:"spending on long-term assets hits now, returns come later"},
      {concept:"Sector rotation",answer:"investors move money between industry groups by cycle/sentiment"},
      {concept:"Free cash flow",answer:"operating cash flow minus capex; hard to fake"},
      {concept:"P/E ratio",answer:"price / EPS; high P/E = high growth expectations + high risk"},
      {concept:"PEG ratio",answer:"P/E divided by growth; ~1 fair, >1 expensive, <1 cheap"},
      {concept:"Priced for perfection",answer:"price assumes flawless execution; good news isn't enough"},
      {concept:"Short selling / short squeeze",answer:"betting a stock falls; unlimited loss; forced buy-ins push price up"},
      {concept:"Discount rate / present value",answer:"future cash / (1+r)^n; higher r shrinks distant cash most"},
      {concept:"Bad news is good news / Fed put",answer:"weak data lowers rate expectations, lifts present values"},
      {concept:"Loss aversion",answer:"losses feel ~2x as intense as equal gains"},
      {concept:"Disposition effect",answer:"sell winners early, hold losers too long"},
    ],
    speakingScoreHistory:[
      {n:1,topic:"Why a growing AI market doesn't benefit all tech equally",score:6.5},
      {n:2,topic:"Acquisition with sound logic can still destroy value",score:7},
      {n:3,topic:"Cheaper competing AI model / pricing pressure",score:6.5},
      {n:4,topic:"Masco: profit up while sales fell",score:8.5},
      {n:5,topic:"Microsoft vs. Meta (same AI spend, opposite reaction)",score:8.75},
      {n:6,topic:"Teach P/E to a 15-year-old",score:6.5},
      {n:7,topic:"PEG comparison (two firms, same P/E, different growth)",score:8.75},
      {n:8,topic:"Judge the Bear - Burry short of NVDA/TSLA/PLTR",score:8.5},
      {n:9,topic:"Rate paradox (why growth stocks are more rate-sensitive)",score:6},
      {n:10,topic:"Disposition-effect self-diagnosis of GOOGL sale",score:8},
    ],
    activeWeakness:"Terminology & mechanism precision: exact terms, precise mechanisms, cash flow sources",
    lastSpeakingFormat:"self-reflection/diagnose",
    continuityNote:"Aug 11: Behavioral Finance Day 1 — loss aversion, Teach-In, self-diagnosis of GOOGL disposition effect, scored 8/10. Next = Day 2 = HERD BEHAVIOR/FOMO.",
  },
  /* §9 — Golden Egg Capital workspace */
  goldenEgg: {
    strategyStatement:"We will specialize in small/mid-cap companies where deep sector knowledge, filing analysis, and qualitative judgment can identify durable businesses or improving situations before they are fully appreciated by the market.",
    currentPhase:0,
    roles:{researchLead:"Rishi",systemsLead:"Rohan"},
    curriculum:[
      {id:"ge-t1",name:"Accounting & Financial Statements",owner:"both",topics:[
        {id:"ge-t1-1",title:"Income statement anatomy",done:false},{id:"ge-t1-2",title:"Balance sheet reading",done:false},
        {id:"ge-t1-3",title:"Cash flow statement (ops/inv/fin)",done:false},{id:"ge-t1-4",title:"Working capital dynamics",done:false},
        {id:"ge-t1-5",title:"Revenue recognition nuances",done:false},{id:"ge-t1-6",title:"Gross vs. operating margin",done:false},
        {id:"ge-t1-7",title:"Free cash flow",done:false},{id:"ge-t1-8",title:"Accruals and earnings quality",done:false},
        {id:"ge-t1-9",title:"Debt, covenants, and refinancing risk",done:false},{id:"ge-t1-10",title:"Dilution — shares, options, converts",done:false},
        {id:"ge-t1-11",title:"ROIC and capital efficiency",done:false},{id:"ge-t1-12",title:"Inventory & receivables red flags",done:false},
      ]},
      {id:"ge-t2",name:"Valuation",owner:"both",topics:[
        {id:"ge-t2-1",title:"Intrinsic value concept",done:false},{id:"ge-t2-2",title:"DCF basics + owner earnings",done:false},
        {id:"ge-t2-3",title:"P/E, EV/EBITDA, FCF yield multiples",done:false},{id:"ge-t2-4",title:"Sum-of-the-parts analysis",done:false},
        {id:"ge-t2-5",title:"Margin of safety",done:false},{id:"ge-t2-6",title:"Downside/base/upside case building",done:false},
      ]},
      {id:"ge-t3",name:"Business Quality",owner:"rishi",topics:[
        {id:"ge-t3-1",title:"Economic moats overview",done:false},{id:"ge-t3-2",title:"Switching costs",done:false},
        {id:"ge-t3-3",title:"Network effects",done:false},{id:"ge-t3-4",title:"Scale advantages",done:false},
        {id:"ge-t3-5",title:"Brand moats",done:false},{id:"ge-t3-6",title:"Cost advantages",done:false},
        {id:"ge-t3-7",title:"Recurring revenue structures",done:false},{id:"ge-t3-8",title:"Pricing power signals",done:false},
        {id:"ge-t3-9",title:"Customer concentration risk",done:false},{id:"ge-t3-10",title:"Capital intensity analysis",done:false},
        {id:"ge-t3-11",title:"Cyclicality and timing",done:false},{id:"ge-t3-12",title:"Management quality assessment",done:false},
      ]},
      {id:"ge-t4",name:"Small/Mid-Cap Specifics",owner:"both",topics:[
        {id:"ge-t4-1",title:"Liquidity and bid-ask spread risk",done:false},{id:"ge-t4-2",title:"Promotional management red flags",done:false},
        {id:"ge-t4-3",title:"Dilution patterns in small caps",done:false},{id:"ge-t4-4",title:"Governance issues to screen for",done:false},
        {id:"ge-t4-5",title:"Why weak coverage creates edge",done:false},{id:"ge-t4-6",title:"Catalyst identification",done:false},
        {id:"ge-t4-7",title:"Why small caps can stay cheap (patience required)",done:false},
      ]},
      {id:"ge-t5",name:"SEC Filings Mastery",owner:"both",topics:[
        {id:"ge-t5-1",title:"10-K deep read",done:false},{id:"ge-t5-2",title:"10-Q quarterly tracking",done:false},
        {id:"ge-t5-3",title:"8-K material events",done:false},{id:"ge-t5-4",title:"DEF 14A proxy (compensation, board)",done:false},
        {id:"ge-t5-5",title:"Form 4 insider transaction analysis",done:false},{id:"ge-t5-6",title:"13D/13G ownership changes",done:false},
        {id:"ge-t5-7",title:"S-3 shelf registration implications",done:false},{id:"ge-t5-8",title:"Revenue recognition footnotes",done:false},
        {id:"ge-t5-9",title:"Risk factors (what to take seriously)",done:false},{id:"ge-t5-10",title:"MD&A reading for management tone",done:false},
      ]},
      {id:"ge-t6",name:"Sector Expertise",owner:"rishi",topics:[
        {id:"ge-t6-1",title:"Business models in target sectors",done:false},{id:"ge-t6-2",title:"KPIs and unit economics",done:false},
        {id:"ge-t6-3",title:"Customer behavior patterns",done:false},{id:"ge-t6-4",title:"Regulatory environment",done:false},
        {id:"ge-t6-5",title:"Value chain mapping",done:false},{id:"ge-t6-6",title:"Competitive dynamics",done:false},
        {id:"ge-t6-7",title:"Margin structure benchmarks",done:false},
      ]},
      {id:"ge-t7",name:"Research Writing",owner:"rishi",topics:[
        {id:"ge-t7-1",title:"Write a 1-page thesis",done:false},{id:"ge-t7-2",title:"Write a full investment memo",done:false},
        {id:"ge-t7-3",title:"Build bull/base/bear case",done:false},{id:"ge-t7-4",title:"Identify disconfirming evidence",done:false},
        {id:"ge-t7-5",title:"Track thesis evolution",done:false},{id:"ge-t7-6",title:"Write postmortems",done:false},
      ]},
      {id:"ge-t8",name:"AI & Data Systems",owner:"rohan",topics:[
        {id:"ge-t8-1",title:"EDGAR API + SEC data pipelines",done:false},{id:"ge-t8-2",title:"Basic Python for financial data",done:false},
        {id:"ge-t8-3",title:"Watchlist database design",done:false},{id:"ge-t8-4",title:"Prompt design for filing analysis",done:false},
        {id:"ge-t8-5",title:"News filtering automation",done:false},{id:"ge-t8-6",title:"Paper-trading logs and audit trails",done:false},
      ]},
    ],
    phases:[
      {id:"ph1",name:"Summer Before Sophomore Year",status:"in_progress",timeframe:"May–Aug 2026",goal:"Build foundations",deliverable:"Strategy doc + starter watchlist (20-50 co.) + 3 research memos"},
      {id:"ph2",name:"Sophomore Year",status:"future",timeframe:"Sep 2026–May 2027",goal:"Build competence",deliverable:"50+ companies tracked, 10 deep memos, 1 internship application"},
      {id:"ph3",name:"Summer Before Junior Year",status:"future",timeframe:"May–Aug 2027",goal:"Build the system",deliverable:"Automated watchlist pipeline, sector framework complete"},
      {id:"ph4",name:"Junior Year",status:"future",timeframe:"Sep 2027–May 2028",goal:"Validate the process",deliverable:"Thesis track record, paper portfolio with documented reasoning"},
      {id:"ph5",name:"Summer Before Senior Year",status:"future",timeframe:"May–Aug 2028",goal:"Pre-live readiness",deliverable:"Audited process, risk framework, capital planning"},
      {id:"ph6",name:"Senior Year (Columbus)",status:"future",timeframe:"Sep 2028–May 2029",goal:"Potential execution",deliverable:"Live fund decision based on track record"},
    ],
    firstThirtyDays:[
      {id:"f30-1",text:"Write the shared one-paragraph strategy statement",done:false},
      {id:"f30-2",text:"Rishi: bring 1 candidate sector + why it's inefficient + 5 example companies",done:false},
      {id:"f30-3",text:"Rohan: bring 1 candidate sector + why it's inefficient + 5 example companies",done:false},
      {id:"f30-4",text:"Pick a 3rd sector to explore together",done:false},
      {id:"f30-5",text:"Build starter watchlist: 20-50 companies across 3 sectors",done:false},
      {id:"f30-6",text:"Complete 3 company research memos (one each + one shared)",done:false},
      {id:"f30-7",text:"Decide on a shared filing/data tool (EDGAR direct, Koyfin, Tikr, or custom)",done:false},
    ],
    sectorCandidates:[
      {name:"Niche software / SaaS",notes:"",status:"exploring"},{name:"Industrials (specialty)",notes:"",status:"exploring"},
      {name:"Healthcare services",notes:"",status:"exploring"},{name:"Medical devices (small cap)",notes:"",status:"exploring"},
      {name:"Specialty finance",notes:"",status:"exploring"},{name:"Consumer brands (regional)",notes:"",status:"exploring"},
      {name:"Payments / fintech infrastructure",notes:"",status:"exploring"},{name:"Aerospace & defense suppliers",notes:"",status:"exploring"},
      {name:"Environmental / waste services",notes:"",status:"exploring"},{name:"Education & workforce services",notes:"",status:"exploring"},
    ],
    watchlist:[],
    aiCourse:{
      startDate:null,
      weeks: GE_COURSE_WEEKS.map(w=>({...w})),
      firstFourteen: GE_COURSE_DAYS14.map(d=>({...d})),
      weekProgress: {},
      courseVersion: 2,
    },
  },
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
            {active==='notes'       && <NotesPanel       data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='consulting'  && <ConsultingPanel  data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='chathubs'    && <ChatHubsPanel    data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='settings'    && <SettingsPanel    data={data} setData={setData} toasts={toasts} lastBackup={lastBackup} />}
            {active==='career'      && <CareerPanel      data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='inbox'       && <InboxPanel       data={data} setData={setData} toasts={toasts} isMobile={isMobile} setActive={setActive} />}
            {active==='golden-egg'    && <GoldenEggPanel    data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='research'      && <ResearchPanel     data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
            {active==='mental-models' && <MentalModelsPanel data={data} setData={setData} toasts={toasts} />}
            {active==='ramp'          && <DeepWorkRampPanel data={data} setData={setData} toasts={toasts} />}
            {active==='review'        && <ReviewPanel       data={data} toasts={toasts} />}
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
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const dict = useDictation(async (t)=>{ setText(prev=> prev ? prev + ' ' + t : t); setListening(false); await handleSend(t); });

  async function handleSend(msg){
    if(!msg || !msg.trim()) return;
    // try OpenAI if api key present
    const apiKey = (ls('magverse:v1')?.settings?.apiKey) || '';
    if(apiKey){
      try{
        toasts.push('Sending to assistant...');
        const resp = await fetch('https://api.openai.com/v1/chat/completions',{
          method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
          body: JSON.stringify({model:'gpt-4o-mini',max_tokens:800,messages:[
            {role:'system',content:'You are a planning assistant. Parse user intent and return JSON with an "actions" array.'},
            {role:'user',content:msg}
          ]})
        });
        const j = await resp.json();
        const out = j?.choices?.[0]?.message?.content || '';
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
    .replace(/\b(\d{1,2})([0-5]\d)\s*(am|pm)/gi, (_,h,m,ap)=>`${h}:${m} ${ap}`)
    .replace(/\b(from|to|at)\s+(\d{1,2})([0-5]\d)\b/gi, (_,prep,h,m)=>`${prep} ${h}:${m}`)
    .replace(/\bnoon\b/gi,'12:00 pm')
    .replace(/\bmidday\b/gi,'12:00 pm')
    .replace(/\bmidnight\b/gi,'12:00 am');
}

// Insert am/pm for bare hour numbers preceded by time prepositions.
// Uses context words + simple hour-range heuristics, then sequence order.
function insertAmPm(s){
  const eveningCtx = /\b(dinner|supper|movie|film|show|game|party|date|evening|tonight|night|drinks|bar|club|concert)\b/i;
  const morningCtx = /\b(breakfast|morning|wake|woke|gym|workout|jog|run|commute|class|lecture|meeting|standup)\b/i;

  // Collect all bare-time occurrences in order
  const bareRe = /\b(at|from|to|until|till|around|by)\s+(\d{1,2}(?::\d{2})?)(?!\s*(?:am|pm|:\d))\b/gi;
  const hits = [];
  let m;
  while((m = bareRe.exec(s)) !== null){
    hits.push({ index: m.index, len: m[0].length, prep: m[1], time: m[2], h: parseInt(m[2], 10) });
  }
  if(!hits.length) return s;

  let lastFull = -1;
  const assigned = hits.map(hit => {
    const { h, index, len } = hit;
    const ctx = s.slice(Math.max(0, index - 80), index + len + 80);
    const isEvening = eveningCtx.test(ctx);
    const isMorning = morningCtx.test(ctx);

    let fullH;
    if(h === 12)        { fullH = 12; }           // noon
    else if(h >= 13)    { fullH = h; }             // 24h already
    else if(h >= 7 && h <= 11){
      // Morning range: default am, but push to pm if evening context
      const amH = h, pmH = h + 12;
      if(lastFull >= 12 && amH < lastFull - 12)    { fullH = pmH; } // keep sequence
      else if(isEvening && !isMorning)              { fullH = pmH; }
      else                                          { fullH = amH; }
    }
    else if(h >= 1 && h <= 6){
      // Afternoon range: default pm, but if sequence is still in am keep am
      const amH = h, pmH = h + 12;
      if(lastFull < 7 && lastFull > 0 && amH > lastFull){ fullH = amH; } // still morning
      else                                                { fullH = pmH; }
    }
    else { fullH = h; }

    // Sequence guard: if result < last, try switching am↔pm
    if(lastFull >= 0 && fullH < lastFull){
      const alt = fullH < 12 ? fullH + 12 : fullH - 12;
      if(alt > lastFull) fullH = alt;
    }
    lastFull = fullH;
    return { ...hit, ap: fullH >= 12 ? 'pm' : 'am' };
  });

  // Rebuild string in reverse order to preserve offsets
  let result = s;
  for(let i = assigned.length - 1; i >= 0; i--){
    const { index, len, prep, time, ap } = assigned[i];
    result = result.slice(0, index) + `${prep} ${time} ${ap}` + result.slice(index + len);
  }
  return result;
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
    // Spoken intent phrases
    .replace(/\bi(?:'ll|'m going to| will| am going to| plan to| want to| need to|'m planning to)\s+/gi,'')
    .replace(/\b(i want to|i need to|i will|i'm going to|i am going to|i'm planning to|i should|i gotta|i got to)\b/gi,'')
    // Motion verbs with destination
    .replace(/\b(head|go|walk|drive|run|get|make it)\s+to\s+(the\s+|a\s+)?/gi,'')
    .replace(/\b(go|head|walk|drive)\b\s*/gi,'')
    // Possession / consumption verbs at segment start (strip only when followed by noun)
    .replace(/^(grab|have|eat|pick\s+up|take|do)\s+/i,'')
    // Scheduling helper words
    .replace(/\b(please|can you|add|schedule|put|block|set up|then|afterwards|after that|followed by|next|also|just|maybe|probably|hopefully)\b/gi,'')
    .replace(/\band\s+then\b/gi,'')
    // Duration expressions (kept from title)
    .replace(/\bfor\s+\d+\.?\d*\s*(and\s+a\s+half\s+)?(hour|hours|hr|hrs|minute|minutes|min|mins)\b/gi,'')
    // Day references
    .replace(/\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,'')
    .replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi,'')
    // Time references
    .replace(/\b(at|by|around|from|to|until|till)\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi,'')
    .replace(/\d{1,2}\s*:\s*\d{2}\s*(am|pm)?/gi,'')
    .replace(/\d{1,2}\s*(am|pm)/gi,'')
    // Punctuation and conjunction cleanup
    .replace(/^[\s,;.:!?]+|[\s,;.:!?]+$/g,'')
    .replace(/^\s*(and|but|or|so|then)\s+/i,'')
    .replace(/\s+(and|or|but)\s*$/i,'')
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

  // Preprocess: normalize spoken words, then insert am/pm for bare times
  const norm = insertAmPm(normAmPm(text));
  const globalDay = parseDay(norm);

  // Bulk schedule detection: 2+ time expressions OR 2+ "from…to" ranges → split
  if(_depth === 0){
    const allTimes  = [...norm.matchAll(/\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)/gi)];
    const allRanges = [...norm.matchAll(/\bfrom\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s+to\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi)];
    if(allTimes.length >= 2 || allRanges.length >= 1){
      // Split on natural speech boundaries:
      // - newlines
      // - "then [after that]" / "after that" / "next" / "followed by" / "and then"
      // - comma or semicolon followed by time preposition or activity verb
      const chunks = norm
        .split(/\n+|(?:,\s*(?=(?:at|from|around|then|after|next|I|go|head|grab|have|wake|study|lunch|dinner|breakfast|gym|class|\d{1,2}\s*(?:am|pm))\b))|(?:\s+(?:and\s+)?(?:then|after\s+that|next|followed\s+by)\s+(?=(?:at|from|around|i|go|head|\d{1,2}\s*(?:am|pm))\b))/i)
        .map(s => s
          .replace(/^(?:then\s+|after\s+that\s+|next\s+|followed\s+by\s+|,\s*)/i,'')
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
              if(a.payload.when?.hour === undefined) continue;
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
    // Duration: "for N hours" or "for N and a half hours"
    const durMatch = norm.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(and\s+a\s+half\s+)?(hour|hours|hr|hrs)\b/i)
      || norm.match(/\bfor\s+(\d+)\s+and\s+a\s+half\s+(hour|hours)\b/i);
    const durH = durMatch ? (parseFloat(durMatch[1]) + (durMatch[2] ? 0.5 : 0)) : undefined;
    const endHour = hour !== undefined && durH !== undefined ? hour + durH : undefined;
    const when = (day!==undefined||hour!==undefined) ? {day, hour, ...(endHour!==undefined?{endHour}:{})} : undefined;
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
    {id:'schedule',     label:'Schedule',    icon:IconCalendar},
    {id:'assignments',  label:'Tasks',       icon:IconKanban},
    {id:'inbox',        label:'Inbox',       icon:IconInbox, badge:inboxCount},
    {id:'consulting',   label:'Consulting',  icon:IconConsulting},
    {id:'chathubs',     label:'Learn',       icon:IconChat},
    {id:'golden-egg',   label:'Fund',        icon:IconEgg},
    {id:'research',     label:'Research',    icon:IconResearch},
    {id:'ramp',         label:'Ramp',        icon:IconRamp},
    {id:'review',       label:'Review',      icon:IconReview},
    {id:'settings',     label:'More',        icon:IconGear},
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
    {id:'consulting',  label:'Consulting',   icon:IconConsulting},
    {id:'golden-egg',  label:'Golden Egg',   icon:IconEgg},
    {id:'research',    label:'Research',     icon:IconResearch},
    {id:'mental-models',label:'Models',      icon:IconBrain},
    {id:'ramp',        label:'Deep Work',    icon:IconRamp},
    {id:'review',      label:'Review',       icon:IconReview},
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
    if(!apiKey){setError('Add your OpenAI API key in Settings.');return;}
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
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
        body:JSON.stringify({model:'gpt-4o-mini',max_tokens:1400,stream:true,messages:[{role:'system',content:system},{role:'user',content:userMsg}]})
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
          try{const ev=JSON.parse(raw);if(ev.choices?.[0]?.delta?.content){full+=ev.choices[0].delta.content;setSections(extractInsightSections(full));}}catch(e){}
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
  // Voice bar state machine: idle | listening | reviewing
  const [dayVoicePhase, setDayVoicePhase] = useState('idle');
  const [dayTranscript, setDayTranscript] = useState('');
  const [reviewItems, setReviewItems] = useState([]); // parsed actions with preview ids
  const dayRecogRef = useRef(null);
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

  const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  function fmtReviewTime(hour, endHour){
    if(hour === undefined) return 'No time';
    const fmt = h => {
      const wh = Math.floor(h), mins = Math.round((h - wh)*60);
      const ap = wh >= 12 ? 'PM' : 'AM';
      const d = wh > 12 ? wh - 12 : wh === 0 ? 12 : wh;
      return mins > 0 ? `${d}:${String(mins).padStart(2,'0')} ${ap}` : `${d} ${ap}`;
    };
    return endHour !== undefined ? `${fmt(hour)} – ${fmt(endHour)}` : fmt(hour);
  }
  function fmtReviewDay(day){
    const todayDi = jsDayToMv(new Date().getDay());
    const tomorrowDi = jsDayToMv(new Date(Date.now()+86400000).getDay());
    if(day === undefined) return 'Today';
    if(day === todayDi) return 'Today';
    if(day === tomorrowDi) return 'Tomorrow';
    return DAY_LABELS[day] || 'Today';
  }
  const TYPE_EMOJI = {Gym:'🏋️', Assignments:'📚', Social:'🍽️', Manual:'📅'};

  function toggleDayMic(){
    if(dayVoicePhase === 'listening'){
      dayRecogRef.current && dayRecogRef.current.stop();
      setDayVoicePhase('idle');
      return;
    }
    if(dayVoicePhase === 'reviewing'){
      setDayVoicePhase('idle');
      setDayTranscript('');
      setReviewItems([]);
      return;
    }
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!R){ toasts.push('Speech recognition not supported in this browser'); return; }
    const r = new R();
    r.lang = 'en-US';
    r.interimResults = true;
    r.continuous = true;
    r.maxAlternatives = 1;
    dayRecogRef.current = r;
    let finalAccum = '';
    r.onresult = (e) => {
      let interim = '';
      for(let i = e.resultIndex; i < e.results.length; i++){
        const t = e.results[i][0].transcript;
        if(e.results[i].isFinal) finalAccum += t + ' ';
        else interim += t;
      }
      setDayTranscript((finalAccum + interim).trimStart());
    };
    r.onend = () => {
      const full = finalAccum.trim();
      if(!full){ setDayVoicePhase('idle'); return; }
      const acts = heuristicParse(full);
      const eventActs = acts.filter(a => a.type === 'event');
      if(!eventActs.length){ toasts.push('No events recognized — try again'); setDayVoicePhase('idle'); return; }
      // Attach a review-id to each for individual removal
      setReviewItems(eventActs.map((a,i) => ({...a, _rid: `r${i}`})));
      setDayVoicePhase('reviewing');
    };
    r.onerror = () => { setDayVoicePhase('idle'); };
    r.start();
    setDayVoicePhase('listening');
    setDayTranscript('');
    setReviewItems([]);
    finalAccum = '';
  }

  function confirmReview(){
    if(!reviewItems.length) return;
    applyActions(reviewItems, setData, toasts);
    setDayVoicePhase('idle');
    setDayTranscript('');
    setReviewItems([]);
  }

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

      {/* ── Voice Day Bar ── */}
      <div className="mb-5 rounded-2xl overflow-hidden" style={{
        border:`1px solid ${dayVoicePhase==='listening'?'rgba(99,102,241,0.45)':dayVoicePhase==='reviewing'?'rgba(16,185,129,0.35)':'rgba(255,255,255,0.06)'}`,
        background:dayVoicePhase==='listening'?'rgba(99,102,241,0.05)':dayVoicePhase==='reviewing'?'rgba(16,185,129,0.03)':'rgba(255,255,255,0.01)',
        transition:'all 0.25s ease'
      }}>

        {/* Top row: mic + transcript / idle hint */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div style={{position:'relative',flexShrink:0}}>
            {dayVoicePhase==='listening' && (
              <span style={{position:'absolute',inset:'-7px',borderRadius:'50%',background:'rgba(99,102,241,0.2)',animation:'pulse 1s ease-in-out infinite',pointerEvents:'none'}}/>
            )}
            <button onClick={toggleDayMic}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all"
              style={{
                background:dayVoicePhase==='listening'?'rgba(99,102,241,0.35)':dayVoicePhase==='reviewing'?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.05)',
                border:dayVoicePhase==='listening'?'1px solid rgba(99,102,241,0.5)':dayVoicePhase==='reviewing'?'1px solid rgba(16,185,129,0.35)':'1px solid rgba(255,255,255,0.1)',
                color:dayVoicePhase==='listening'?'#a5b4fc':dayVoicePhase==='reviewing'?'#34d399':'#475569',
                position:'relative',zIndex:1
              }}>
              {dayVoicePhase==='listening' ? '◉' : dayVoicePhase==='reviewing' ? '✓' : '🎤'}
            </button>
          </div>

          <div className="flex-1 min-w-0">
            {dayVoicePhase==='listening' ? (
              dayTranscript
                ? <div className="text-sm leading-relaxed" style={{color:'#c7d2fe'}}>{dayTranscript}<span style={{display:'inline-block',width:'2px',height:'13px',background:'#818cf8',marginLeft:'3px',verticalAlign:'middle',animation:'pulse 0.7s ease-in-out infinite'}}/></div>
                : <div className="text-sm italic animate-item" style={{color:'#6366f1'}}>Listening — speak your full day…</div>
            ) : dayVoicePhase==='reviewing' ? (
              <div>
                <div className="text-sm font-semibold" style={{color:'#34d399'}}>Review before adding</div>
                <div className="text-xs mt-0.5" style={{color:'#475569'}}>Remove anything wrong, then confirm.</div>
              </div>
            ) : (
              <div>
                <div className="text-sm font-medium" style={{color:'#64748b'}}>Plan your day by voice</div>
                <div className="text-xs mt-0.5" style={{color:'#334155'}}>Speak naturally — <span style={{color:'#818cf8'}}>"gym at 7, class at 10, lunch at noon, study from 2 to 5, dinner at 6"</span></div>
              </div>
            )}
          </div>

          {dayVoicePhase==='idle' && dayTranscript && (
            <button onClick={()=>setDayTranscript('')} className="flex-shrink-0 text-xs px-2 py-1 rounded" style={{color:'#334155',border:'1px solid rgba(255,255,255,0.06)'}}>Clear</button>
          )}
        </div>

        {/* Review cards */}
        {dayVoicePhase==='reviewing' && (
          <div style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            {/* Event chips */}
            <div className="px-4 pt-3 pb-2 space-y-2">
              {reviewItems.map(item => {
                const p = item.payload;
                const emoji = TYPE_EMOJI[p.type] || '📅';
                const timeStr = fmtReviewTime(p.when?.hour, p.when?.endHour);
                const dayStr  = fmtReviewDay(p.when?.day);
                const noTime  = p.when?.hour === undefined;
                return (
                  <div key={item._rid} className="flex items-center gap-2 p-2.5 rounded-xl animate-item"
                    style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${noTime?'rgba(245,158,11,0.25)':'rgba(255,255,255,0.06)'}`}}>
                    <span style={{fontSize:'15px',flexShrink:0}}>{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{color:'#e2e8f0'}}>{p.title || '(untitled)'}</div>
                      <div className="text-xs mt-0.5" style={{color:noTime?'#f59e0b':'#475569'}}>
                        {noTime ? '⚠ No time detected' : `${timeStr} · ${dayStr}`}
                      </div>
                    </div>
                    <button onClick={()=>setReviewItems(prev=>prev.filter(x=>x._rid!==item._rid))}
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-all hover:bg-white/10"
                      style={{color:'#475569'}}>×</button>
                  </div>
                );
              })}
              {!reviewItems.length && (
                <div className="text-sm text-center py-2" style={{color:'#334155'}}>All events removed — dismiss or try again.</div>
              )}
            </div>
            {/* Confirm row */}
            <div className="flex gap-2 px-4 pb-3">
              <button onClick={confirmReview} disabled={!reviewItems.length}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                style={{background:reviewItems.length?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.04)',color:reviewItems.length?'#10b981':'#334155',border:reviewItems.length?'1px solid rgba(16,185,129,0.3)':'1px solid rgba(255,255,255,0.06)'}}>
                {reviewItems.length ? `✓ Add ${reviewItems.length} event${reviewItems.length>1?'s':''}` : 'Nothing to add'}
              </button>
              <button onClick={()=>{ setDayVoicePhase('idle'); setDayTranscript(''); setReviewItems([]); }}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{color:'#475569',border:'1px solid rgba(255,255,255,0.06)'}}>
                Dismiss
              </button>
            </div>
          </div>
        )}
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
    return `You are Rishi's personal task assistant in Magverse.

## RULE #1 — ACT IMMEDIATELY, NEVER CONFIRM
When the user's intent is clear, execute the action in your FIRST response. NEVER echo back a proposed title and wait. NEVER say "I'll add..." without also including the <magverse-actions> tag in that same message. Do not ask "shall I add this?" or anything like it.

## HOW ACTIONS WORK
Every add/update/delete/mark-done MUST include a <magverse-actions> JSON block at the end of your response. Without it, nothing happens.
Schema: {"type":"add_task","task":{"title":"","category":"classroom","priority":"High","dueDate":"YYYY-MM-DD or null","subject":"","notes":"","status":"To Do"}}
Other types: {"type":"mark_done","taskId":"id"} | {"type":"update_task","taskId":"id","patch":{}} | {"type":"delete_task","taskId":"id"}
category = "classroom"|"extracurricular"|"personal". priority = "High"|"Med"|"Low".

## TITLE NORMALIZATION
Polish the raw input into a clean task title: Title Case, action verb first, 3–8 words, concise.
Examples: "stats hw #1" → "Complete Statistics Homework #1" | "study econ midterm" → "Prepare for Economics Midterm" | "call mom" → "Call Mom"

## EXAMPLE OF CORRECT BEHAVIOR
User: "add stats homework #1 classroom"
You: "Added Complete Statistics Homework #1 to Classroom Tasks.
<magverse-actions>[{"type":"add_task","task":{"title":"Complete Statistics Homework #1","category":"classroom","priority":"High","dueDate":null,"subject":"","notes":"","status":"To Do"}}]</magverse-actions>"

Be concise. Plain text only, no markdown. Today: ${today}
TASKS: ${JSON.stringify(taskList)}`;
  }

  function execActions(text) {
    const m = text.match(/<magverse-actions>([\s\S]*?)<\/magverse-actions>/);
    if (!m) return { added: [], hasActions: false };
    const added = [];
    try {
      JSON.parse(m[1]).forEach(a => {
        if (a.type === 'add_task') {
          const t = a.task || {};
          // Dedup: skip if same title+category already exists (prevents retry duplicates)
          const exists = tasks.some(x =>
            x.title.trim().toLowerCase() === (t.title||'').trim().toLowerCase() &&
            x.category === t.category
          );
          if (!exists) { onAddTask(t); added.push(t); }
        }
        else if (a.type === 'mark_done') onUpdateTask(a.taskId, { status: 'Done', doneAt: new Date().toISOString() });
        else if (a.type === 'update_task') onUpdateTask(a.taskId, a.patch);
        else if (a.type === 'delete_task') onDeleteTask(a.taskId);
      });
    } catch(e) {}
    return { added, hasActions: true };
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
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 1000, stream: true, messages: [{role:'system',content:buildSystem()}, ...history.map(m => ({ role: m.role, content: m.content }))] })
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        const errMsg = errJson.error?.message || `HTTP ${resp.status}`;
        throw new Error(errMsg);
      }
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
            if (j.choices?.[0]?.delta?.content) {
              full += j.choices[0].delta.content;
              setMsgs(m => { const a = [...m]; a[a.length-1] = { role: 'assistant', content: full }; return a; });
            }
          } catch(_e) {}
        }
      }
      const { added } = execActions(full);
      if (added.length > 0) {
        // Attach confirmed-added tasks to the message for the confirmation card
        setMsgs(m => { const c=[...m]; c[c.length-1]={...c[c.length-1], addedTasks:added}; return c; });
      }
    } catch(e) {
      setMsgs(m => [...m, { role: 'assistant', content: `Error: ${e.message || 'unknown'}. Check your OpenAI API key in Settings.` }]);
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
          const hasCard = m.addedTasks?.length > 0;
          if (!txt && !hasCard && !(m.role === 'assistant' && loading && i === msgs.length - 1)) return null;
          return (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:m.role==='user'?'flex-end':'flex-start', gap:'5px' }}>
              {(txt || (m.role === 'assistant' && loading && i === msgs.length - 1)) && (
                <div style={{
                  maxWidth:'88%', padding:'8px 11px',
                  borderRadius: m.role==='user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                  background: m.role==='user' ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${m.role==='user'?'rgba(99,102,241,0.28)':'rgba(255,255,255,0.07)'}`,
                  fontSize:'12px', color:'#e2e8f0', lineHeight:1.55, whiteSpace:'pre-wrap'
                }}>
                  {txt || <span style={{color:'#475569'}}>...</span>}
                </div>
              )}
              {hasCard && m.addedTasks.map((task, ti) => {
                const catMeta = TASK_CATEGORIES.find(c=>c.id===task.category);
                const priMeta = PRIORITY_META[task.priority];
                return (
                  <div key={ti} style={{ maxWidth:'88%', padding:'9px 12px', borderRadius:9, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.22)' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#6ee7b7', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:5 }}>✓ Task Added</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', marginBottom:6, lineHeight:1.3 }}>{task.title}</div>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {catMeta && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:catMeta.bg, color:catMeta.color }}>{catMeta.label.replace(' Tasks','')}</span>}
                      {priMeta && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:priMeta.bg, color:priMeta.color }}>{priMeta.label} Priority</span>}
                      {task.dueDate && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,0.06)', color:'#64748b' }}>Due {task.dueDate}</span>}
                    </div>
                  </div>
                );
              })}
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

      <div className="glass rounded-xl p-4 mb-5 border-subtle" style={{borderLeft:'3px solid #6366f1'}}>
        <div className="text-sm font-medium mb-1" style={{color:'#818cf8'}}>How to use Inbox</div>
        <div className="text-xs leading-relaxed" style={{color:'#94a3b8'}}>
          Press <kbd style={{background:'rgba(255,255,255,0.07)',borderRadius:'3px',padding:'0 4px',fontFamily:'monospace'}}>C</kbd> anywhere in the app to drop a quick capture — a raw thought, task, link, or idea — without interrupting what you're doing. Items land here for triage. Once something arrives, use the colored buttons to route it: <strong>Task</strong> moves it to your task board, <strong>Note</strong> saves it to Notes, <strong>Journal</strong> adds it to your journal, <strong>Event</strong> puts it on the calendar. Items older than 48 hours are flagged in amber so nothing stagnates.
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


/* -------------------- Notes / Journal / Habits Panel -------------------- */
function NotesPanel({data, setData, toasts, isMobile}){
  const [subtab, setSubtab] = useState('notes');
  const [reflectEntryId, setReflectEntryId] = useState(null);
  function goReflect(entryId){setReflectEntryId(entryId||null);setSubtab('reflect');}
  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-semibold">Notes</h2>
        <div className="flex gap-1 flex-wrap">
          {[['notes','Notes'],['journal','Journal'],['habits','Habits'],['planner','Life Planner'],['reflect','Reflect']].map(([t,label])=> (
            <button key={t} className={`px-3 py-1 rounded text-sm ${subtab===t?'bg-white/10':'hover:bg-white/5'}`}
              style={subtab===t?{color:'#a5b4fc'}:{}} onClick={()=>setSubtab(t)}>{label}</button>
          ))}
        </div>
      </div>
      {subtab==='notes'   && <NotesSubtab        data={data} setData={setData} toasts={toasts} />}
      {subtab==='journal' && <JournalSubtab       data={data} setData={setData} toasts={toasts} onTalkAboutThis={goReflect}/>}
      {subtab==='habits'  && <HabitsSubtab        data={data} setData={setData} toasts={toasts} />}
      {subtab==='planner' && <LifePlannerSubtab   data={data} setData={setData} toasts={toasts} />}
      {subtab==='reflect' && <ReflectPanel        data={data} setData={setData} toasts={toasts} isMobile={isMobile} initialEntryId={reflectEntryId}/>}
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

function JournalSubtab({data, setData, toasts, onTalkAboutThis}){
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
            <div className="flex gap-2 self-end">
              {existing&&onTalkAboutThis&&<button className="px-3 py-1.5 rounded text-sm" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.3)'}} onClick={()=>onTalkAboutThis(existing.id)}>Talk About This →</button>}
              <button className="px-4 py-1.5 rounded bg-indigo-600" onClick={save}>Save Entry</button>
            </div>
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
  {type:'function',function:{name:'add_area',description:'Create a new life area',parameters:{type:'object',properties:{name:{type:'string'},description:{type:'string'},color:{type:'string',description:'CSS hex like #6366f1'}},required:['name']}}},
  {type:'function',function:{name:'add_goal',description:'Add a goal to a life area. Use when the user mentions something they want to achieve.',parameters:{type:'object',properties:{areaId:{type:'string',description:'Life area ID'},title:{type:'string'},description:{type:'string'},targetDate:{type:'string',description:'YYYY-MM-DD'},parentGoalId:{type:'string'},status:{type:'string',enum:['active','paused']}},required:['areaId','title']}}},
  {type:'function',function:{name:'update_goal',description:'Update an existing goal',parameters:{type:'object',properties:{goalId:{type:'string'},title:{type:'string'},description:{type:'string'},targetDate:{type:'string'},status:{type:'string',enum:['active','paused','done','archived']}},required:['goalId']}}},
  {type:'function',function:{name:'add_action',description:'Add a concrete action/task under a goal',parameters:{type:'object',properties:{goalId:{type:'string'},title:{type:'string'},dueDate:{type:'string'},estimatedDuration:{type:'string',description:'e.g. "30min","2hr"'},people:{type:'array',items:{type:'string'}},notes:{type:'string'}},required:['goalId','title']}}},
  {type:'function',function:{name:'update_action',description:'Update or complete an action',parameters:{type:'object',properties:{actionId:{type:'string'},title:{type:'string'},status:{type:'string',enum:['todo','done','skipped']},dueDate:{type:'string'},notes:{type:'string'}},required:['actionId']}}},
  {type:'function',function:{name:'add_person',description:'Add a person to the relationship tracker',parameters:{type:'object',properties:{name:{type:'string'},relationship:{type:'string',description:'friend, mentor, family, colleague'},cadence:{type:'string',description:'weekly, biweekly, monthly, quarterly'},notes:{type:'string'}},required:['name']}}},
  {type:'function',function:{name:'update_person',description:'Update person info or log an interaction',parameters:{type:'object',properties:{personId:{type:'string'},name:{type:'string'},relationship:{type:'string'},cadence:{type:'string'},lastInteraction:{type:'string',description:'ISO date YYYY-MM-DD'},notes:{type:'string'}},required:['personId']}}},
  {type:'function',function:{name:'log_checkin',description:'Log a reflection or weekly check-in',parameters:{type:'object',properties:{summary:{type:'string'},areaUpdates:{type:'array',items:{type:'object',properties:{areaId:{type:'string'},note:{type:'string'}}}}},required:['summary']}}},
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
    const systemMsg=`You are a thoughtful life planner — direct, honest, and analytical. Reference the existing plan in every response. Push back on vague goals and unrealistic timelines. Surface conflicts. When someone is mentioned, check the People list. Never invent commitments the user didn't make.

CURRENT PLAN:
${JSON.stringify(ctx.plan,null,2)}

PEOPLE:
${JSON.stringify(ctx.people,null,2)}

RECENT JOURNAL (7 days):
${JSON.stringify(ctx.recentJournals,null,2)}

Today: ${ctx.today} (${ctx.dayOfWeek})`;
    const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+k},body:JSON.stringify({model:'gpt-4o',max_tokens:2000,stream:true,tools:PLANNER_TOOLS,messages:[{role:'system',content:systemMsg},...messages]})});
    if(!resp.ok){const j=await resp.json();throw new Error(j.error?.message||'API error '+resp.status);}
    const reader=resp.body.getReader(),dec=new TextDecoder();
    let buf='',fullText='',finishReason='stop';
    // tool_calls accumulator: index → {id, name, argsBuf}
    const tcMap={};
    while(true){
      const{done,value}=await reader.read();if(done)break;
      buf+=dec.decode(value,{stream:true});
      const lines=buf.split('\n');buf=lines.pop()||'';
      for(const line of lines){
        if(!line.startsWith('data:'))continue;
        const raw=line.slice(5).trim();if(raw==='[DONE]')break;
        try{
          const ev=JSON.parse(raw);
          const delta=ev.choices?.[0]?.delta;
          if(ev.choices?.[0]?.finish_reason)finishReason=ev.choices[0].finish_reason;
          if(delta?.content){fullText+=delta.content;onText(fullText);}
          if(delta?.tool_calls){
            for(const tc of delta.tool_calls){
              const i=tc.index;
              if(!tcMap[i])tcMap[i]={id:tc.id||'',name:tc.function?.name||'',argsBuf:''};
              if(tc.id)tcMap[i].id=tc.id;
              if(tc.function?.name)tcMap[i].name=tc.function.name;
              if(tc.function?.arguments)tcMap[i].argsBuf+=tc.function.arguments;
            }
          }
        }catch(e){}
      }
    }
    const toolCalls=[];
    const rawToolCalls=[];
    if(finishReason==='tool_calls'){
      for(const i of Object.keys(tcMap).sort((a,b)=>+a-+b)){
        const tc=tcMap[i];
        try{
          const inp=JSON.parse(tc.argsBuf||'{}');
          const result=executeTool(tc.name,inp);
          const call={id:tc.id,name:tc.name,input:inp,result};
          toolCalls.push(call);onTool(call);
          rawToolCalls.push({id:tc.id,type:'function',function:{name:tc.name,arguments:tc.argsBuf}});
        }catch(e){}
      }
    }
    const rawAssistant={role:'assistant',content:fullText||null,tool_calls:rawToolCalls.length?rawToolCalls:undefined};
    return{text:fullText,toolCalls,stopReason:finishReason==='tool_calls'?'tool_calls':'end_turn',rawAssistant};
  }

  async function sendMessage(text){
    if(!text.trim()||streaming)return;
    const userMsg={role:'user',content:text.trim(),id:uid(),at:Date.now()};
    setData(d=>{const p=d.planner||getDefaultPlanner();return{...d,planner:{...p,chatHistory:[...(p.chatHistory||[]),userMsg]}};});
    setChatInput('');setStreamText('');setInFlightTools([]);
    if(!apiKey){
      const e={role:'assistant',content:'Add your OpenAI API key in Settings.',id:uid(),at:Date.now()};
      setData(d=>({...d,planner:{...d.planner,chatHistory:[...d.planner.chatHistory,e]}}));return;
    }
    setStreaming(true);
    const collected=[];
    try{
      const history=(planner.chatHistory||[]).slice(-10).map(m=>({role:m.role,content:m.content}));
      const messages=[...history,{role:'user',content:text.trim()}];
      const{text:t1,toolCalls:tc1,stopReason,rawAssistant}=await streamRound(messages,ft=>setStreamText(ft),tc=>{collected.push(tc);setInFlightTools([...collected]);});
      let finalText=t1;
      if(tc1.length>0&&stopReason==='tool_calls'){
        const toolResults=tc1.map(tc=>({role:'tool',tool_call_id:tc.id,content:String(tc.result)}));
        setStreamText('');
        const{text:t2}=await streamRound([...messages,rawAssistant,...toolResults],ft=>setStreamText(ft),()=>{});
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
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o',max_tokens:1200,stream:true,messages:[{role:'system',content:system},...[...msgs,userMsg].map(m=>({role:m.role,content:m.content}))]})});
      const reader=resp.body.getReader(),dec=new TextDecoder();let buf='',out='';
      while(true){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop();for(const line of lines){if(!line.startsWith('data:'))continue;const d=line.slice(5).trim();if(d==='[DONE]')break;try{const j=JSON.parse(d);if(j.choices?.[0]?.delta?.content){out+=j.choices[0].delta.content;setStreamText(out);}}catch{}}}
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

/* ==================== REFLECT ==================== */
function getDefaultReflect(){
  return{sessions:[],memories:[],lifeContext:'',prefs:{useJournalEntries:true,useReflectHistory:true,useLifeContext:true,personalizedStarters:true,challengeMode:'balanced',voiceEnabled:true,autoSaveReflections:false}};
}

const REFLECT_MODES=[
  {id:'talk',    label:'Just Talk',         emoji:'💬', hint:'Open conversation. Follow the user wherever they need to go.'},
  {id:'checkin', label:'Check In',          emoji:'📊', hint:'Brief structured reflection. Ask about energy, recent highlights, what\'s on their mind. Keep it short.'},
  {id:'untangle',label:'Untangle',          emoji:'🧶', hint:'Something is bothering the user but they can\'t name it. Help identify the root. Ask what specifically happened, separate feeling from interpretation.'},
  {id:'decide',  label:'Decide',            emoji:'⚖️', hint:'Help with a decision. Surface facts, assumptions, emotions, values, and tradeoffs separately. Do not push toward any outcome. Offer a Decision Snapshot when the conversation reaches a natural conclusion.'},
  {id:'relationships',label:'Relationships',emoji:'👥', hint:'Think through interpersonal dynamics. What did the user observe vs. what are they interpreting? Do not diagnose other people.'},
  {id:'goals',   label:'Goals',             emoji:'🎯', hint:'Connect daily behavior to longer-term intentions. Ask whether goals still feel alive. Surface discrepancies without shaming.'},
  {id:'patterns',label:'Pattern Finder',    emoji:'🔍', hint:'Look across journal history for recurring themes. Report with confidence levels. Show evidence, not invented narratives.'},
  {id:'weekly',  label:'Weekly Reflection', emoji:'📅', hint:'Review recent journal entries and produce a structured weekly reflection: what occupied their mind, what went well, what drained them, what they may be avoiding.'},
  {id:'socratic',label:'Examine a Belief',  emoji:'🔬', hint:'SOCRATIC_MODE'},
];

const REFLECT_CRISIS=['suicide','kill myself','end my life','want to die','self-harm','cutting myself','hurt myself','don\'t want to be here','no reason to live','thinking about suicide'];

function checkCrisis(text){
  const l=text.toLowerCase();
  if(REFLECT_CRISIS.some(w=>l.includes(w))) return "What you're describing sounds serious — this is beyond what this tool can appropriately support. Please reach out to someone right now. In the US: 988 Suicide & Crisis Lifeline (call or text 988). You deserve real support from a real person.";
  return null;
}

function retrieveRelevantEntries(journals,query,prefs){
  if(!prefs?.useJournalEntries||!journals?.length) return [];
  const filtered=journals.filter(j=>!j.excludeFromReflect);
  if(!filtered.length) return [];
  const STOP=new Set(['the','and','for','that','this','with','have','from','but','are','was','were','been','has','had','will','would','could','should','its','their','they','them','then','than','when','what','which','who','how','not','can','all','out','into','our','you','your','about','more','just','also','time','some','like','very','only','even','any','there','one','two','i','me','my','im','ive','its']);
  const tok=t=>t.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>2&&!STOP.has(w));
  const qTokens=new Set(tok(query));
  if(!qTokens.size) return filtered.slice(-3).reverse();
  const now=Date.now();
  const scored=filtered.map(j=>{
    const bToks=tok(j.body||'');
    const tToks=tok((j.tags||[]).join(' '));
    const bodyMatch=bToks.filter(w=>qTokens.has(w)).length;
    const tagMatch=tToks.filter(w=>qTokens.has(w)).length;
    let score=bodyMatch*0.7+tagMatch*1.5;
    const daysAgo=(now-new Date(j.date).getTime())/86400000;
    if(daysAgo<14) score+=0.4; else if(daysAgo<60) score+=0.15;
    return {j,score};
  });
  return scored.filter(x=>x.score>0.3).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.j);
}

function buildReflectSystem(mode,lifeCtx,memories,relevantEntries,challengeMode,userName){
  const modeHint=REFLECT_MODES.find(m=>m.id===mode)?.hint||'Open conversation.';
  const challenge=challengeMode==='challenge'
    ?'Challenge the user\'s assumptions frequently. Ask for evidence. Note when they repeat patterns without changing them. Remain respectful but direct.'
    :challengeMode==='gentle'
    ?'Be warm and gentle. Still ask clarifying questions — just avoid hard pushback.'
    :'Balance empathy with honest challenge. Acknowledge feelings without treating every interpretation as fact.';

  const socraticProtocol=mode==='socratic'?`

SOCRATIC QUESTIONING MODE
The user will state a belief they hold — strongly or loosely. Your job is NOT to argue against it or validate it. Your job is to interrogate it rigorously until they understand exactly WHY they believe it, under WHAT CONDITIONS it holds, and what evidence would change their mind.

INTERROGATION SEQUENCE — work through these one at a time, not all at once:
1. DEFINE — "What specifically do you mean by [key term]?" Force precision. Vague words ("harder", "better", "success", "toxic") hide confused thinking.
2. EVIDENCE — "What makes you believe this is actually true?" Distinguish direct observation from inherited assumption.
3. COUNTEREXAMPLE — "When has this belief been wrong, or made things worse?" One real counterexample is more powerful than ten objections.
4. HIDDEN ASSUMPTION — "What are you taking for granted that might not be true?" Surface the upstream premise the belief depends on.
5. FALSIFICATION — "What would have to be true for you to conclude this belief is wrong?" If nothing could change their mind, that's a red flag.
6. REFINED STATEMENT — At the end, help them arrive at a more precise version: not "X" but "X because Y, under conditions Z, except when W."

RULES:
- Ask ONE question at a time. Never list all five at once.
- Follow the thread. If their answer reveals something worth pressing on, press on it before moving to the next step.
- Do not solve the belief. The user should do the thinking. You only dig.
- Do not validate the belief prematurely. "Good point" or "That makes sense" shuts down inquiry.
- Do not argue against the belief either. You are not the opposition — you are the process.
- When they reach a refined, precise version of their belief, name what changed: "You started with X. What you actually believe is closer to Y."
- This is not endless skepticism. The goal is a STRONGER, more accurate belief — not demolishing it.

OPENING: Ask them to state the belief plainly in one sentence, then start with DEFINE.`:'';

  let sys=`You are Reflect — a thoughtful personal reflection companion for ${userName||'this user'}.

Your job: help the user understand themselves, think clearly, recognize patterns, examine assumptions, make decisions, and connect present experiences with relevant context from their life.

YOU ARE NOT a licensed therapist, psychologist, or counselor. Never claim to be. Never diagnose the user or people in their life.

BEHAVIORAL PRINCIPLES:
- Understand before advising. Ask before prescribing.
- Prefer one good specific question over a list of observations.
- Use retrieved context naturally — never announce "According to your journal from..."
- Distinguish facts from interpretations. Separate feelings from conclusions.
- Never invent memories. If uncertain, ask.
- Use calibrated language: "you've mentioned this a few times", "this seems similar to what you described before", "I may be connecting two things incorrectly, but..."
- Avoid these hollow phrases: "That sounds really hard", "Your feelings are valid", "Let's unpack that", "Give yourself grace". They are generic and empty.
- Response length: 1–3 paragraphs for conversation. One strong observation + one specific question is often enough.
- ${challenge}

CURRENT MODE: ${mode==='socratic'?'Examine a Belief — Socratic Questioning':modeHint}${socraticProtocol}

SAFETY: If the user mentions self-harm, suicidal ideation, or immediate danger — stop the normal conversation and provide crisis resources (988 in the US).`;
  if(lifeCtx?.trim()) sys+=`\n\nUSER'S LIFE CONTEXT (explicitly provided by them):\n${lifeCtx.trim().slice(0,600)}`;
  const activeMems=(memories||[]).filter(m=>m.active&&m.userApproved);
  if(activeMems.length) sys+=`\n\nKNOWN ABOUT USER:\n${activeMems.slice(0,12).map(m=>`[${m.type.toUpperCase()}] ${m.content}`).join('\n')}`;
  if(relevantEntries?.length){
    const excerpts=relevantEntries.map(j=>`Journal — ${j.date}${(j.tags||[]).length?' ['+j.tags.join(', ')+']':''}:\n"${(j.body||'').slice(0,350)}${(j.body||'').length>350?'…':''}"`).join('\n\n');
    sys+=`\n\nRELEVANT JOURNAL CONTEXT (use naturally, never cite mechanically):\n${excerpts}`;
  }
  return sys;
}

function ReflectPanel({data,setData,toasts,isMobile,initialEntryId}){
  const reflect=data.reflect||getDefaultReflect();
  const setReflect=patch=>setData(d=>({...d,reflect:{...(d.reflect||getDefaultReflect()),...(typeof patch==='function'?patch(d.reflect||getDefaultReflect()):patch)}}));
  const [view,setView]=useState(initialEntryId?'talk':'home');
  const [mode,setMode]=useState('talk');
  const [sessionMsgs,setSessionMsgs]=useState([]);
  const [sessionCtx,setSessionCtx]=useState(()=>{
    if(!initialEntryId) return [];
    const e=(data.journals||[]).find(j=>j.id===initialEntryId);
    return e?[e]:[];
  });
  const [sessionPrivate,setSessionPrivate]=useState(false);
  const apiKey=data.settings?.apiKey||'';
  const userName=data.settings?.userName||'You';
  function startSession(m,entryId){
    setMode(m);
    if(entryId){const e=(data.journals||[]).find(j=>j.id===entryId);if(e)setSessionCtx([e]);}
    else setSessionCtx([]);
    setSessionMsgs([]);setView('talk');
  }
  function endSession(msgs){
    if(!sessionPrivate&&msgs.length>1){
      const session={id:uid('rs'),startedAt:new Date().toISOString(),endedAt:new Date().toISOString(),mode,messages:msgs,private:false};
      setReflect(r=>({...r,sessions:[...(r.sessions||[]).slice(-29),session]}));
    }
    setSessionMsgs([]);setSessionCtx([]);setView('home');
  }
  function saveToJournal(text){
    const today=new Date().toISOString().slice(0,10);
    const body=`REFLECT SESSION — ${today}\n\n${text}`;
    setData(d=>{
      const existing=(d.journals||[]).find(j=>j.date===today);
      if(existing) return{...d,journals:(d.journals||[]).map(j=>j.date===today?{...j,body:j.body+'\n\n---\n'+body,updatedAt:new Date().toISOString()}:j)};
      return{...d,journals:[...(d.journals||[]),{id:uid(),date:today,body,tags:['reflect'],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}]};
    });
    toasts.push('Reflection saved to Journal');
  }
  function addMemory(content,type='reflection',opts={}){
    const memId=opts.id||uid('rm');
    const mem={id:memId,type,content,sourceType:opts.auto?'auto':'explicit',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),userApproved:true,active:true,confidence:'high'};
    setReflect(r=>({...r,memories:[...(r.memories||[]),mem]}));
    if(!opts.silent) toasts.push('Remembered');
  }
  function removeMemory(id){
    setReflect(r=>({...r,memories:(r.memories||[]).filter(m=>m.id!==id)}));
  }
  return(
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {[['home','Home'],['talk','Talk'],['insights','Insights'],['context','My Context']].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} className={`px-3 py-1 rounded text-sm ${view===v?'bg-white/10':'hover:bg-white/5'}`} style={view===v?{color:'#a5b4fc'}:{color:'#94a3b8'}}>{l}</button>
          ))}
        </div>
        <div className="text-xs opacity-40">AI companion — not a therapist</div>
      </div>
      {view==='home'&&<ReflectHome reflect={reflect} journals={data.journals||[]} onStart={startSession}/>}
      {view==='talk'&&<ReflectTalk msgs={sessionMsgs} setMsgs={setSessionMsgs} mode={mode} reflect={reflect} journals={data.journals||[]} apiKey={apiKey} toasts={toasts} userName={userName} sessionCtx={sessionCtx} setSessionCtx={setSessionCtx} sessionPrivate={sessionPrivate} setSessionPrivate={setSessionPrivate} onEnd={endSession} onSaveToJournal={saveToJournal} onAddMemory={addMemory} onRemoveMemory={removeMemory} isMobile={isMobile}/>}
      {view==='insights'&&<ReflectInsights reflect={reflect} journals={data.journals||[]} apiKey={apiKey} toasts={toasts}/>}
      {view==='context'&&<ReflectContext reflect={reflect} setReflect={setReflect} toasts={toasts}/>}
    </div>
  );
}

function ReflectHome({reflect,journals,onStart}){
  const prefs=reflect.prefs||{};
  const recentSession=(reflect.sessions||[]).slice(-1)[0];
  let starter='What\'s on your mind?';
  if(prefs.personalizedStarters!==false&&journals?.length){
    const recent=journals.filter(j=>(Date.now()-new Date(j.date).getTime())/86400000<4).sort((a,b)=>b.date.localeCompare(a.date));
    if(recent[0]?.tags?.length) starter=`You've been writing about ${recent[0].tags[0]}. Want to talk through it?`;
    else if(recent[0]) starter='There might be something from your recent writing worth talking through.';
  }
  return(
    <div className="flex flex-col items-center gap-6 mt-4">
      <div className="text-center">
        <div className="text-2xl font-light mb-2" style={{color:'#e2e8f0',opacity:0.85}}>{starter}</div>
      </div>
      <div className="grid gap-2 w-full max-w-xl" style={{gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))' }}>
        {REFLECT_MODES.map(m=>(
          <button key={m.id} onClick={()=>onStart(m.id)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:bg-white/8"
            style={{border:'1px solid rgba(255,255,255,0.07)'}}>
            <span className="text-xl">{m.emoji}</span>
            <span className="text-xs text-center leading-tight" style={{color:'#94a3b8'}}>{m.label}</span>
          </button>
        ))}
      </div>
      {recentSession&&(
        <div className="glass p-4 rounded-xl w-full max-w-xl" style={{border:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium" style={{color:'#a5b4fc'}}>Recent session</span>
            <span className="text-xs" style={{color:'#64748b'}}>{recentSession.startedAt?.slice(0,10)}</span>
          </div>
          <div className="text-xs mb-2" style={{color:'#64748b'}}>{REFLECT_MODES.find(m=>m.id===recentSession.mode)?.label||'Talk'} · {recentSession.messages?.length||0} messages</div>
          <button onClick={()=>onStart(recentSession.mode)} className="text-xs px-3 py-1 rounded"
            style={{background:'rgba(99,102,241,0.15)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.3)'}}>
            Start new session →
          </button>
        </div>
      )}
    </div>
  );
}

function ReflectTalk({msgs,setMsgs,mode,reflect,journals,apiKey,toasts,userName,sessionCtx,setSessionCtx,sessionPrivate,setSessionPrivate,onEnd,onSaveToJournal,onAddMemory,onRemoveMemory,isMobile}){
  const [input,setInput]=useState('');
  const [streaming,setStreaming]=useState(false);
  const [listening,setListening]=useState(false);
  const [showCtx,setShowCtx]=useState(false);
  const [showSummary,setShowSummary]=useState(false);
  const [summaryText,setSummaryText]=useState('');
  const [genSummary,setGenSummary]=useState(false);
  const [rememberText,setRememberText]=useState('');
  const [rememberType,setRememberType]=useState('reflection');
  const [showRemember,setShowRemember]=useState(false);
  const [lastAutoMemId,setLastAutoMemId]=useState(null);
  const scrollRef=useRef(null);
  const prefs=reflect.prefs||{};
  const speaker=useSpeaker();
  const dict=useDictation(t=>{setListening(false);if(t.trim())sendMsg(t.trim());});
  useEffect(()=>{scrollRef.current?.scrollIntoView({behavior:'smooth'});},[msgs.length,streaming]);

  async function sendMsg(text){
    if(!text.trim()||streaming) return;
    const crisis=checkCrisis(text);
    if(crisis){setMsgs(m=>[...m,{id:uid(),role:'user',text,at:new Date().toISOString()},{id:uid(),role:'ai',text:crisis,at:new Date().toISOString()}]);setInput('');return;}
    if(!apiKey){setMsgs(m=>[...m,{id:uid(),role:'user',text,at:new Date().toISOString()},{id:uid(),role:'ai',text:'Add your OpenAI API key in Settings to use Reflect.',at:new Date().toISOString()}]);setInput('');return;}
    const relevant=retrieveRelevantEntries(journals,text,prefs);
    const newCtx=[...sessionCtx,...relevant.filter(e=>!sessionCtx.find(c=>c.id===e.id))];
    setSessionCtx(newCtx);
    const userMsg={id:uid(),role:'user',text,at:new Date().toISOString()};
    const allMsgs=[...msgs,userMsg];
    setMsgs(allMsgs);setInput('');setStreaming(true);
    const system=buildReflectSystem(mode,prefs.useLifeContext!==false?reflect.lifeContext||'':'',reflect.memories||[],newCtx,prefs.challengeMode||'balanced',userName);
    const history=allMsgs.slice(-10).map(m=>({role:m.role==='user'?'user':'assistant',content:m.text}));
    const botId=uid();
    setMsgs(m=>[...m,{id:botId,role:'ai',text:'…',at:new Date().toISOString()}]);
    try{
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
        body:JSON.stringify({model:'gpt-4o',stream:true,max_tokens:700,messages:[{role:'system',content:system},...history]})
      });
      if(!resp.ok){const j=await resp.json();throw new Error(j.error?.message||'API error');}
      const reader=resp.body.getReader(),dec=new TextDecoder();
      let buf='',full='';
      while(true){
        const{done,value}=await reader.read();if(done)break;
        buf+=dec.decode(value,{stream:true});
        const lines=buf.split('\n');buf=lines.pop()||'';
        for(const line of lines){
          if(!line.startsWith('data:'))continue;
          const d=line.slice(5).trim();if(d==='[DONE]')break;
          try{const ev=JSON.parse(d);if(ev.choices?.[0]?.delta?.content){full+=ev.choices[0].delta.content;setMsgs(m=>m.map(x=>x.id===botId?{...x,text:full||'…'}:x));}}catch{}
        }
      }
      const finalText=full||'(no response)';
      setMsgs(m=>m.map(x=>x.id===botId?{...x,text:finalText}:x));
      if(prefs.voiceEnabled!==false) speaker.speak(finalText);
    }catch(e){
      setMsgs(m=>m.map(x=>x.id===botId?{...x,text:'Error: '+e.message}:x));
      toasts.push('Reflect error: '+e.message);
    }finally{setStreaming(false);}
  }

  async function generateSummary(){
    if(!apiKey||msgs.length<2){toasts.push('Nothing to summarize yet');return;}
    setGenSummary(true);
    try{
      const transcript=msgs.map(m=>`${m.role==='user'?userName:'Reflect'}: ${m.text}`).join('\n');
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
        body:JSON.stringify({model:'gpt-4o-mini',max_tokens:400,messages:[
          {role:'system',content:'Summarize this reflection session concisely. Format:\n\nWhat I came in thinking:\n...\n\nWhat emerged:\n...\n\nStill uncertain about:\n...\n\nOne thing to remember:\n...'},
          {role:'user',content:transcript}
        ]})
      });
      const j=await resp.json();
      const summaryContent=j.choices?.[0]?.message?.content||'';
      setSummaryText(summaryContent);
      setShowSummary(true);
      // Auto-save the "One thing to remember" as a memory
      const remMatch=summaryContent.match(/One thing to remember:\s*([^\n]+)/i);
      if(remMatch&&remMatch[1].trim()){
        const memId=uid('rm');
        setLastAutoMemId(memId);
        onAddMemory(remMatch[1].trim(),'reflection',{id:memId,silent:true,auto:true});
      }
    }catch(e){toasts.push('Summary error: '+e.message);}
    setGenSummary(false);
  }

  const modeInfo=REFLECT_MODES.find(m=>m.id===mode)||REFLECT_MODES[0];
  return(
    <div className="flex flex-col gap-3">
      {/* header bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded" style={{background:'rgba(99,102,241,0.15)',color:'#a5b4fc'}}>{modeInfo.emoji} {modeInfo.label}</span>
        <button onClick={()=>setShowCtx(s=>!s)} className="text-xs px-2 py-0.5 rounded hover:bg-white/5" style={{color:'#64748b'}}>
          Context {sessionCtx.length?`(${sessionCtx.length})`:''}
        </button>
        <label className="ml-auto text-xs flex items-center gap-1 cursor-pointer" style={{color:'#64748b'}}>
          <input type="checkbox" checked={sessionPrivate} onChange={e=>setSessionPrivate(e.target.checked)} className="w-3 h-3"/>
          Private session
        </label>
      </div>
      {/* context drawer */}
      {showCtx&&(
        <div className="glass p-3 rounded-lg text-xs" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="font-medium mb-2" style={{color:'#a5b4fc'}}>Context used this session</div>
          {!sessionCtx.length&&<div className="opacity-50">No journal context retrieved yet — context is pulled automatically as you talk.</div>}
          {sessionCtx.map(j=>(
            <div key={j.id} className="mb-2 pb-2 border-b border-white/5 last:border-0">
              <div className="font-medium" style={{color:'#e2e8f0'}}>{j.date}{(j.tags||[]).length?` · ${j.tags.join(', ')}`:''}</div>
              <div className="opacity-60 mt-0.5 line-clamp-2">{(j.body||'').slice(0,120)}</div>
            </div>
          ))}
        </div>
      )}
      {/* messages */}
      <div className="flex flex-col gap-3" style={{minHeight:'300px'}}>
        {msgs.length===0&&(
          <div className="flex flex-col items-center justify-center text-center mt-10 gap-2" style={{opacity:0.4}}>
            <div className="text-4xl">{modeInfo.emoji}</div>
            <div className="text-sm">{modeInfo.label}</div>
            <div className="text-xs">{mode==='socratic'?'State a belief you hold. It will be interrogated — not destroyed.':'Speak or type to begin'}</div>
          </div>
        )}
        {msgs.map(m=>(
          <div key={m.id} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
            <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
              style={m.role==='user'
                ?{background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.3)',color:'#e2e8f0'}
                :{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:'#e2e8f0'}}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef}/>
      </div>
      {/* input */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        <div className="flex gap-2">
          <textarea className="flex-1 p-3 rounded-xl text-sm resize-none"
            style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none',minHeight:'52px',maxHeight:'120px'}}
            placeholder="Type here or use voice…" rows={2} value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg(input);}}}
            disabled={streaming}/>
          <button onClick={()=>sendMsg(input)} disabled={streaming||!input.trim()}
            className="px-4 rounded-xl text-sm font-medium flex-shrink-0"
            style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',opacity:streaming||!input.trim()?0.4:1}}>
            Send
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {dict.hasSpeech&&(
            <button onClick={()=>{if(listening){dict.stop();setListening(false);}else{dict.start();setListening(true);}}}
              className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
              style={listening?{background:'rgba(239,68,68,0.15)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.4)'}:{background:'rgba(99,102,241,0.1)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.25)'}}>
              {listening?'● Listening…':'🎤 Voice'}
            </button>
          )}
          {speaker.speaking&&<button onClick={speaker.cancel} className="text-xs px-2 py-1 rounded hover:bg-white/5" style={{color:'#64748b'}}>Stop speaking</button>}
          <div className="flex gap-1.5 ml-auto">
            <button onClick={()=>setShowRemember(true)} className="text-xs px-2 py-1 rounded hover:bg-white/5" style={{color:'#64748b'}}>Remember this</button>
            <button onClick={generateSummary} disabled={genSummary||msgs.length<2} className="text-xs px-2 py-1 rounded hover:bg-white/5" style={{color:'#64748b'}}>
              {genSummary?'Summarizing…':'End & summarize'}
            </button>
          </div>
        </div>
      </div>
      {/* Remember modal */}
      {showRemember&&(
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setShowRemember(false)}/>
          <div className="glass p-5 rounded-xl z-50 flex flex-col gap-3" style={{width:'min(400px,90vw)'}}>
            <h3 className="font-semibold">Remember this</h3>
            <textarea className="w-full p-2 bg-transparent border border-white/10 rounded text-sm" rows={3}
              placeholder="What should Reflect remember?" value={rememberText} onChange={e=>setRememberText(e.target.value)}/>
            <div>
              <div className="text-xs opacity-50 mb-1">Type</div>
              <div className="flex gap-1 flex-wrap">
                {['value','goal','commitment','decision','reflection','profile'].map(t=>(
                  <button key={t} onClick={()=>setRememberType(t)} className="px-2 py-0.5 rounded text-xs"
                    style={rememberType===t?{background:'rgba(99,102,241,0.3)',color:'#a5b4fc'}:{background:'rgba(255,255,255,0.05)',color:'#94a3b8'}}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded text-sm hover:bg-white/5" style={{color:'#64748b'}} onClick={()=>setShowRemember(false)}>Cancel</button>
              <button className="px-3 py-1 rounded text-sm bg-indigo-600" onClick={()=>{if(rememberText.trim()){onAddMemory(rememberText.trim(),rememberType);setRememberText('');setShowRemember(false);}}}>Save</button>
            </div>
          </div>
        </div>
      )}
      {/* Summary modal */}
      {showSummary&&(
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setShowSummary(false)}/>
          <div className="glass p-5 rounded-xl z-50 flex flex-col gap-4 overflow-y-auto" style={{width:'min(500px,92vw)',maxHeight:'80vh'}}>
            <h3 className="font-semibold">Session Summary</h3>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{color:'#cbd5e1'}}>{summaryText}</div>
            {lastAutoMemId&&(
              <div className="flex items-center gap-2 text-xs py-2 px-3 rounded-lg" style={{background:'rgba(110,231,183,0.08)',border:'1px solid rgba(110,231,183,0.2)'}}>
                <span style={{color:'#6ee7b7'}}>✓ Memory auto-saved</span>
                <button onClick={()=>{onRemoveMemory(lastAutoMemId);setLastAutoMemId(null);}} className="ml-auto hover:opacity-80" style={{color:'#64748b'}}>Don't save</button>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <button onClick={()=>{onSaveToJournal(summaryText);setShowSummary(false);onEnd(msgs);}}
                className="px-3 py-1.5 rounded text-sm"
                style={{background:'rgba(99,102,241,0.2)',color:'#a5b4fc',border:'1px solid rgba(99,102,241,0.3)'}}>
                Save to Journal
              </button>
              <button onClick={()=>{setShowSummary(false);onEnd(msgs);}} className="px-3 py-1.5 rounded text-sm hover:bg-white/5" style={{color:'#64748b'}}>End session</button>
              <button onClick={()=>setShowSummary(false)} className="px-3 py-1.5 rounded text-sm hover:bg-white/5" style={{color:'#64748b'}}>Keep talking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReflectInsights({reflect,journals,apiKey,toasts}){
  const [insightsText,setInsightsText]=useState('');
  const [generating,setGenerating]=useState(false);
  async function runAnalysis(){
    if(!apiKey){toasts.push('API key required for insights');return;}
    const recent=(journals||[]).filter(j=>(Date.now()-new Date(j.date).getTime())/86400000<=14).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10);
    if(recent.length<2){toasts.push('Write at least 2 recent journal entries first');return;}
    setGenerating(true);
    try{
      const entries=recent.map(j=>`${j.date}${(j.tags||[]).length?' ['+j.tags.join(', ')+']':''}: ${j.body.slice(0,400)}`).join('\n\n---\n\n');
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
        body:JSON.stringify({model:'gpt-4o',max_tokens:600,messages:[
          {role:'system',content:'Analyze these recent journal entries. Be specific and evidence-based. Do not invent patterns. For each section note confidence: HIGH (3+ entries) or TENTATIVE (1-2 mentions). Format:\n\nWHAT\'S BEEN ON YOUR MIND\n...\n\nWHAT SEEMS TO ENERGIZE YOU\n...\n\nWHAT SEEMS TO DRAIN YOU\n...\n\nSOMETHING YOU MAY BE AVOIDING\n...\n\nOPEN QUESTION WORTH CARRYING\n...\n\nOnly include a section if genuinely supported by the entries.'},
          {role:'user',content:entries}
        ]})
      });
      const j=await resp.json();setInsightsText(j.choices?.[0]?.message?.content||'');
    }catch(e){toasts.push('Insights error: '+e.message);}
    setGenerating(false);
  }
  const activeMems=(reflect.memories||[]).filter(m=>m.active&&m.userApproved);
  const sessions=(reflect.sessions||[]).slice().reverse().slice(0,10);
  return(
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium text-sm" style={{color:'#a5b4fc'}}>Recent Patterns</div>
          <button onClick={runAnalysis} disabled={generating} className="text-xs px-3 py-1 rounded"
            style={{background:'rgba(99,102,241,0.15)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.3)'}}>
            {generating?'Analyzing…':'Analyze last 2 weeks'}
          </button>
        </div>
        {!insightsText&&<div className="text-sm opacity-50">Click "Analyze last 2 weeks" to surface patterns from your recent journal entries.</div>}
        {insightsText&&<div className="text-sm leading-relaxed whitespace-pre-wrap glass p-4 rounded-xl" style={{color:'#cbd5e1',border:'1px solid rgba(255,255,255,0.06)'}}>{insightsText}</div>}
      </div>
      {activeMems.length>0&&(
        <div>
          <div className="font-medium text-sm mb-3" style={{color:'#a5b4fc'}}>What Reflect Knows About You</div>
          <div className="flex flex-col gap-2">
            {activeMems.map(m=>(
              <div key={m.id} className="glass px-3 py-2 rounded-lg flex items-start gap-2" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>{m.type}</span>
                <span className="text-sm" style={{color:'#cbd5e1'}}>{m.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {sessions.length>0&&(
        <div>
          <div className="font-medium text-sm mb-3" style={{color:'#a5b4fc'}}>Past Sessions</div>
          <div className="flex flex-col gap-1.5">
            {sessions.map(s=>(
              <div key={s.id} className="glass px-3 py-2 rounded-lg text-xs flex items-center gap-2" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
                <span style={{color:'#94a3b8'}}>{s.startedAt?.slice(0,10)}</span>
                <span style={{color:'#64748b'}}>·</span>
                <span style={{color:'#cbd5e1'}}>{REFLECT_MODES.find(m=>m.id===s.mode)?.label||'Talk'}</span>
                <span className="ml-auto" style={{color:'#64748b'}}>{s.messages?.length||0} messages</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReflectContext({reflect,setReflect,toasts}){
  const prefs=reflect.prefs||{};
  const memories=reflect.memories||[];
  const [lifeCtx,setLifeCtx]=useState(reflect.lifeContext||'');
  const [savedFlag,setSavedFlag]=useState(false);
  const [editId,setEditId]=useState(null);
  const [editText,setEditText]=useState('');
  function saveCtx(){setReflect(r=>({...r,lifeContext:lifeCtx}));setSavedFlag(true);setTimeout(()=>setSavedFlag(false),2000);toasts.push('Context saved');}
  function updatePref(k,v){setReflect(r=>({...r,prefs:{...(r.prefs||{}),[k]:v}}));}
  function forgetMem(id){setReflect(r=>({...r,memories:(r.memories||[]).map(m=>m.id===id?{...m,active:false}:m)}));toasts.push('Forgotten');}
  function saveMem(id){
    setReflect(r=>({...r,memories:(r.memories||[]).map(m=>m.id===id?{...m,content:editText,updatedAt:new Date().toISOString()}:m)}));
    setEditId(null);toasts.push('Memory updated');
  }
  function clearAll(){if(!confirm('Clear all Reflect data? Sessions, memories, and context will be deleted.')) return; setReflect(getDefaultReflect());toasts.push('Reflect data cleared');}
  const activeMems=memories.filter(m=>m.active);
  return(
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <div className="font-medium text-sm mb-2" style={{color:'#a5b4fc'}}>My Context</div>
        <div className="text-xs opacity-50 mb-2">Tell Reflect about your life — goals, values, relationships, stressors. The more context you give, the more grounded the conversations will be.</div>
        <textarea className="w-full p-3 rounded-xl text-sm resize-none"
          style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none',minHeight:'140px'}}
          placeholder={"E.g.\nMy biggest goal right now is...\nI tend to...\nThe people closest to me are...\nI want you to challenge me when..."}
          value={lifeCtx} onChange={e=>setLifeCtx(e.target.value)}/>
        <button onClick={saveCtx} className="mt-2 px-4 py-1.5 rounded text-sm font-medium"
          style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white'}}>
          {savedFlag?'Saved ✓':'Save Context'}
        </button>
      </div>
      <div>
        <div className="font-medium text-sm mb-3" style={{color:'#a5b4fc'}}>Reflect Settings</div>
        <div className="flex flex-col">
          {[['useJournalEntries','Use journal entries as context'],['useLifeContext','Include my context notes'],['useReflectHistory','Use past Reflect sessions'],['personalizedStarters','Personalized conversation starters'],['voiceEnabled','Read responses aloud']].map(([k,label])=>(
            <label key={k} className="flex items-center justify-between py-2 border-b border-white/5 cursor-pointer">
              <span className="text-sm" style={{color:'#cbd5e1'}}>{label}</span>
              <input type="checkbox" checked={!!(prefs[k]??true)} onChange={e=>updatePref(k,e.target.checked)} className="w-4 h-4"/>
            </label>
          ))}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{color:'#cbd5e1'}}>Reflect style</span>
            <select value={prefs.challengeMode||'balanced'} onChange={e=>updatePref('challengeMode',e.target.value)}
              className="text-sm rounded px-2 py-1" style={{background:'rgba(255,255,255,0.05)',color:'#e2e8f0',border:'1px solid rgba(255,255,255,0.1)'}}>
              <option value="gentle">Gentle</option>
              <option value="balanced">Balanced</option>
              <option value="challenge">Challenge Me</option>
            </select>
          </div>
        </div>
      </div>
      {activeMems.length>0&&(
        <div>
          <div className="font-medium text-sm mb-3" style={{color:'#a5b4fc'}}>What Reflect Remembers</div>
          <div className="flex flex-col gap-2">
            {activeMems.map(m=>(
              <div key={m.id} className="glass px-3 py-2 rounded-lg" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
                {editId===m.id?(
                  <div className="flex flex-col gap-2">
                    <textarea className="w-full p-2 text-sm bg-transparent border border-white/10 rounded resize-none" rows={2} value={editText} onChange={e=>setEditText(e.target.value)}/>
                    <div className="flex gap-2">
                      <button onClick={()=>saveMem(m.id)} className="text-xs px-2 py-1 rounded bg-indigo-600">Save</button>
                      <button onClick={()=>setEditId(null)} className="text-xs px-2 py-1 rounded hover:bg-white/5" style={{color:'#64748b'}}>Cancel</button>
                    </div>
                  </div>
                ):(
                  <div className="flex items-start gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>{m.type}</span>
                    <span className="text-sm flex-1" style={{color:'#cbd5e1'}}>{m.content}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={()=>{setEditId(m.id);setEditText(m.content);}} className="text-xs px-1.5 py-0.5 rounded hover:bg-white/5" style={{color:'#64748b'}}>Edit</button>
                      <button onClick={()=>forgetMem(m.id)} className="text-xs px-1.5 py-0.5 rounded hover:bg-red-900/30" style={{color:'#f87171'}}>Forget</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="glass p-4 rounded-xl" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
        <div className="text-xs font-medium mb-1" style={{color:'#94a3b8'}}>Privacy</div>
        <div className="text-xs opacity-50 leading-relaxed mb-3">Reflect stores conversations and context in this browser's local storage. Nothing is sent to any server except to OpenAI to generate responses. Use Private Session in the Talk tab to skip saving a conversation.</div>
        <button onClick={clearAll} className="text-xs px-3 py-1.5 rounded"
          style={{background:'rgba(239,68,68,0.1)',color:'#f87171',border:'1px solid rgba(239,68,68,0.2)'}}>
          Clear all Reflect data
        </button>
      </div>
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
      setError('Add your OpenAI API key in Settings to enable grading.');
      setPhase('review');
      return;
    }
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 600,
          messages: [
            {role:'system',content:`You are a demanding but fair philosophy professor grading a student's spoken answer to a philosophy question. Evaluate on: clarity of argument, philosophical depth, use of relevant concepts, and intellectual honesty. Then write a model answer showing what an excellent response looks like. Return ONLY valid JSON in exactly this shape, no extra text:
{"score":7,"grade":"B","summary":"One sentence summary of overall quality.","strengths":"What they got right — 1-2 sentences.","improvements":"What they missed or could deepen — 1-2 sentences.","modelAnswer":"A model answer of 3-5 sentences that demonstrates the ideal philosophical response — covering key thinkers, core arguments, and nuances a strong student would address."}
Scores: 9-10=A, 7-8=B, 5-6=C, 3-4=D, 1-2=F.`},
            {role:'user',content:`Question: ${question}\n\nStudent's answer: ${transcript}`},
          ],
        }),
      });
      if (!resp.ok) { const j = await resp.json(); throw new Error(j.error?.message || 'API error'); }
      const j = await resp.json();
      const raw = j.choices[0].message.content.trim();
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
    fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+apiKey,
      },
      body: JSON.stringify({
        model:'gpt-4o-mini',
        max_tokens:1200,
        messages:[
          {role:'system',content:'You are a financial data assistant. Return ONLY valid JSON, no markdown, no explanation.'},
          {role:'user',content:`List 4 significant M&A, private equity, or major corporate deals announced or closed in the past 6 months (as of early 2025). Include real deals with accurate facts. Return a JSON array of objects with exactly these fields: id (string, prefix "live-"), title, announced (e.g. "Mar 4, 2025"), closed (e.g. "Jun 1, 2025" or "pending"), sector, value, type, summary (2-3 sentences), keyFacts (array of 3 strings). Prioritize deals over $5B.`}
        ]
      })
    }).then(r=>r.json()).then(j=>{
      try{
        const text = j.choices[0].message.content.trim();
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
            <div className="text-xs opacity-80 mt-1">{(h.system||'').slice(0,80)}...</div>
          </div>
        ))}
      </div>

      {openHub && <ChatDrawer hub={openHub} onClose={()=>setOpenHub(null)} data={data} setData={setData} toasts={toasts} isMobile={isMobile} />}
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
        const reply = 'Add your OpenAI API key in Settings to enable AI responses.';
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

      const systemContent = hub.id==='hub-career' ? buildCareerHubSystem(hub.system, data)
                : hub.id==='hub1' ? buildPhilosophyPrompt(data.philosophyBriefing)
                : hub.id==='hub-acumen' ? buildAcumenPrompt(data.businessAcumenBriefing)
                : hub.system;

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 1024,
          stream: useApiTts ? true : false,
          messages: [{role:'system',content:systemContent}, ...history],
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
                if(ev.choices?.[0]?.delta?.content){
                  const token = ev.choices[0].delta.content;
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
        if(hub.stateDriven) applyStateUpdate(fullRaw, setData);

      } else {
        // ── Non-streaming path (browser TTS or no TTS provider) ──
        const j = await resp.json();
        if(j.error) throw new Error(j.error.message||'API error');
        const rawOut = j?.choices?.[0]?.message?.content || '(no response)';
        const out = cleanText(rawOut);
        setMessages(m=>[...m, {id:uid(), role:'ai', text:out, at:new Date().toISOString()}]);
        setTyping(false);
        if(hub.stateDriven) applyStateUpdate(rawOut, setData);
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
            {hub.id==='hub1' && data.philosophyBriefing && (
              <div className="text-xs" style={{color:'#818cf8'}}>Day {data.philosophyBriefing.currentDay} · {data.philosophyBriefing.currentTheme.split('—')[0].trim()}</div>
            )}
            {hub.id==='hub-acumen' && data.businessAcumenBriefing && (
              <div className="text-xs" style={{color:'#10b981'}}>Day {data.businessAcumenBriefing.currentDayInTheme} · {data.businessAcumenBriefing.currentWeekTheme}</div>
            )}
            {!hub.stateDriven && <div className="text-xs" style={{color:'#475569'}}>AI Assistant</div>}
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
          <div className="mt-8 px-2">
            <div className="text-center mb-6" style={{color:'#334155'}}>
              <div className="text-4xl mb-2">{hub.emoji}</div>
              <div className="text-sm font-medium" style={{color:'#64748b'}}>{hub.name}</div>
            </div>
            {hub.id==='hub1' && data.philosophyBriefing && (
              <div className="glass rounded-xl p-4 space-y-3 text-xs" style={{border:'1px solid rgba(99,102,241,0.2)'}}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm" style={{color:'#818cf8'}}>Philosophy Briefing — Day {data.philosophyBriefing.currentDay}</div>
                    <div style={{color:'#64748b',marginTop:'2px'}}>{data.philosophyBriefing.currentTheme}</div>
                  </div>
                  <div className="text-right">
                    <div style={{color:'#a5b4fc'}}>Avg {data.philosophyBriefing.speakingScoreHistory?.length ? (data.philosophyBriefing.speakingScoreHistory.reduce((s,x)=>s+x.score,0)/data.philosophyBriefing.speakingScoreHistory.length).toFixed(0) : '—'}/100</div>
                    <div style={{color:'#475569'}}>Sessions {data.philosophyBriefing.speakingScoreHistory?.length||0}</div>
                  </div>
                </div>
                <div style={{color:'#f59e0b',background:'rgba(245,158,11,0.08)',borderRadius:'6px',padding:'6px 8px'}}>⚠ Weakness: {data.philosophyBriefing.activeWeakness}</div>
                <div style={{color:'#475569'}}>Say "philosophy" or "start" to begin Day {data.philosophyBriefing.currentDay}.</div>
              </div>
            )}
            {hub.id==='hub-acumen' && data.businessAcumenBriefing && (
              <div className="glass rounded-xl p-4 space-y-3 text-xs" style={{border:'1px solid rgba(16,185,129,0.2)'}}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm" style={{color:'#10b981'}}>Business Acumen — Day {data.businessAcumenBriefing.currentDayInTheme}</div>
                    <div style={{color:'#64748b',marginTop:'2px'}}>{data.businessAcumenBriefing.currentWeekTheme}</div>
                  </div>
                  <div className="text-right">
                    <div style={{color:'#34d399'}}>Avg {data.businessAcumenBriefing.speakingScoreHistory?.length ? (data.businessAcumenBriefing.speakingScoreHistory.reduce((s,x)=>s+x.score,0)/data.businessAcumenBriefing.speakingScoreHistory.length).toFixed(1) : '—'}/10</div>
                    <div style={{color:'#475569'}}>Sessions {data.businessAcumenBriefing.speakingScoreHistory?.length||0}</div>
                  </div>
                </div>
                <div style={{color:'#f59e0b',background:'rgba(245,158,11,0.08)',borderRadius:'6px',padding:'6px 8px'}}>⚠ Weakness: {data.businessAcumenBriefing.activeWeakness}</div>
                <div style={{color:'#475569',fontSize:'11px'}}>{data.businessAcumenBriefing.continuityNote}</div>
                <div style={{color:'#475569'}}>Say "today" or "start" to begin Day {data.businessAcumenBriefing.currentDayInTheme}.</div>
              </div>
            )}
            {!hub.stateDriven && <div className="text-center text-xs" style={{color:'#334155'}}>Ask me anything</div>}
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
            <label className="block text-xs opacity-80 mb-1">OpenAI API Key</label>
            <input className="w-full p-2 bg-transparent border border-white/5 rounded" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-..." />
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
function IconEgg(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2C8 2 4 8 4 13a8 8 0 0 0 16 0c0-5-4-11-8-11z"/></svg> }
function IconResearch(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></svg> }
function IconBrain(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.66"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.66"/></svg> }
function IconRamp(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function IconReview(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> }
function IconConsulting(){ return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M12 11l-4 4"/><path d="M12 11l4 4"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/></svg> }

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

// ---- Consulting ----
function getDefaultConsulting(){
  return {drills:[],cases:[],errorLog:[],practiceplan:null};
}

// ---- Resume Editor ----
function getDefaultResumeEditor(){
  return{versions:[],activeVersionId:null,originalDocxBase64:null,originalDocxXml:null,paragraphs:[],uploadMode:'text',jd:'',goals:[],interview:{questions:[],currentIdx:0,done:false},diagnosis:null,jobMatch:null,changes:[],chatHistory:[]};
}
const RESUME_GOALS=[
  {id:'improve',  label:'Improve overall',          icon:'✨',desc:'Strengthen wording, structure, and impact across the board'},
  {id:'tailor',   label:'Tailor to a specific job', icon:'🎯',desc:'Align language and emphasis with a target role'},
  {id:'concise',  label:'Make more concise',         icon:'✂️',desc:'Tighten language, cut filler, improve density'},
  {id:'impact',   label:'Stronger accomplishments',  icon:'💥',desc:'Transform task descriptions into outcome-driven bullets'},
  {id:'ats',      label:'Optimize for ATS',          icon:'🤖',desc:'Improve keyword alignment and machine-parseable formatting'},
  {id:'transition',label:'Career transition',        icon:'🔄',desc:'Reframe experience for a new domain or role type'},
];
const GEN_MSGS=['Reading your resume…','Identifying your strongest experience…','Comparing against the target role…','Reviewing bullet quality…','Checking for unsupported claims…','Targeting high-impact edits…','Preparing surgical improvements…'];

async function resumeAICall(messages,apiKey,maxTokens=4096){
  const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
    body:JSON.stringify({model:'gpt-4o',max_tokens:maxTokens,response_format:{type:'json_object'},messages})});
  if(!resp.ok){const j=await resp.json();throw new Error(j.error?.message||'API error '+resp.status);}
  const j=await resp.json();
  return JSON.parse(j.choices[0].message.content.trim());
}

function ResumeImportStep({onNext,data}){
  const [text,setText]=useState('');
  const [dragging,setDragging]=useState(false);
  const [parsing,setParsing]=useState(false);
  const [parseMode,setParseMode]=useState('text');
  const [docxMeta,setDocxMeta]=useState(null);
  const fileRef=useRef(null);

  const readFile=async f=>{
    const name=f.name.toLowerCase();
    if(name.endsWith('.docx')&&window.JSZip){
      setParsing(true);setParseMode('docx');
      try{
        const arrayBuffer=await f.arrayBuffer();
        const bytes=new Uint8Array(arrayBuffer);
        let binary='';bytes.forEach(b=>binary+=String.fromCharCode(b));
        const base64=btoa(binary);
        const zip=await JSZip.loadAsync(arrayBuffer);
        const docXml=await zip.file('word/document.xml').async('string');
        const NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        const parser=new DOMParser();
        const xmlDoc=parser.parseFromString(docXml,'application/xml');
        const pNodes=xmlDoc.getElementsByTagNameNS(NS,'p');
        const paragraphs=[];let plainText='';
        for(let i=0;i<pNodes.length;i++){
          const tns=pNodes[i].getElementsByTagNameNS(NS,'t');
          let t='';for(let j=0;j<tns.length;j++)t+=tns[j].textContent;
          if(t.trim()){paragraphs.push({id:`p-${i}`,text:t.trim()});plainText+=t.trim()+'\n';}
        }
        setText(plainText.trim());setDocxMeta({base64,docXml,paragraphs});
      }catch(e){
        setText('');setDocxMeta(null);setParseMode('text');
        alert('Could not parse DOCX: '+e.message+'\n\nPlease paste your resume text instead.');
      }
      setParsing(false);
    }else if(name.endsWith('.pdf')&&window.pdfjsLib){
      setParsing(true);setParseMode('pdf');
      try{
        const buf=await f.arrayBuffer();
        const pdf=await pdfjsLib.getDocument({data:buf}).promise;
        let out='';
        for(let p=1;p<=pdf.numPages;p++){
          const page=await pdf.getPage(p);const content=await page.getTextContent();
          const lines={};
          content.items.forEach(item=>{const y=Math.round(item.transform[5]);lines[y]=(lines[y]||[]);lines[y].push({x:item.transform[4],str:item.str});});
          const sorted=Object.keys(lines).map(Number).sort((a,b)=>b-a);
          sorted.forEach(y=>{const row=lines[y].sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ').trim();if(row)out+=row+'\n';});
          if(p<pdf.numPages)out+='\n';
        }
        setText(out.trim());
      }catch(e){setText('PDF extraction failed: '+e.message+'\n\nPlease paste your resume text manually.');}
      setParsing(false);
    }else{
      const r=new FileReader();r.onload=e=>{setText(e.target.result||'');setParseMode('text');setDocxMeta(null);};r.readAsText(f);
    }
  };

  const onDrop=e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)readFile(f);};
  const wc=text.trim().split(/\s+/).filter(Boolean).length;
  const ok=wc>=30&&!parsing;

  const handleContinue=()=>{
    if(parseMode==='docx'&&docxMeta){
      onNext(text,{mode:'docx',base64:docxMeta.base64,docXml:docxMeta.docXml,paragraphs:docxMeta.paragraphs});
    }else{
      onNext(text,{mode:parseMode});
    }
  };

  const aiCourse=data.goldenEgg?.aiCourse;
  const doneWeeks=(aiCourse?.weeks||[]).filter(w=>{const p=aiCourse?.weekProgress?.[w.id];return p?.deliverableDone;});
  const appendProjects=()=>{
    const lines=doneWeeks.map(w=>`• ${w.title} — completed project deliverable (Week ${w.week})`).join('\n');
    setText(t=>(t?t+'\n\n':'')+'PROJECTS (from Magverse curriculum):\n'+lines);
    setParseMode('text');setDocxMeta(null);
  };

  return(
    <div style={{maxWidth:680,margin:'0 auto'}}>
      <h3 style={{fontSize:22,fontWeight:700,color:'#e2e8f0',marginBottom:6}}>Start with your resume</h3>
      <p style={{color:'#64748b',fontSize:14,marginBottom:12}}>Upload a <strong style={{color:'#a5b4fc'}}>DOCX</strong> to preserve your formatting — AI will apply surgical edits to the original. PDF and text work too.</p>

      {parseMode==='docx'&&text&&(
        <div style={{marginBottom:10,padding:'9px 14px',borderRadius:9,background:'rgba(16,185,129,0.07)',border:'1px solid rgba(16,185,129,0.2)',fontSize:13,color:'#6ee7b7'}}>
          ✓ DOCX parsed — your original formatting is preserved. You'll download a real .docx file.
        </div>
      )}
      {parseMode==='pdf'&&text&&(
        <div style={{marginBottom:10,padding:'9px 14px',borderRadius:9,background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)',fontSize:13,color:'#fbbf24'}}>
          ⚠ PDF text extracted — formatting cannot be preserved. Output will be downloadable as text.
        </div>
      )}

      <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={onDrop} style={{position:'relative',marginBottom:10}}>
        <textarea value={text} onChange={e=>{setText(e.target.value);setParseMode('text');setDocxMeta(null);}} placeholder="Paste resume text, or drag & drop a DOCX / PDF file…" rows={16}
          style={{width:'100%',padding:'16px',borderRadius:12,resize:'vertical',fontFamily:'inherit',fontSize:13,lineHeight:1.6,color:'#e2e8f0',outline:'none',boxSizing:'border-box',
            background:dragging?'rgba(99,102,241,0.08)':'rgba(255,255,255,0.03)',border:dragging?'1.5px solid rgba(99,102,241,0.5)':'1px solid rgba(255,255,255,0.08)',transition:'all 0.2s'}}/>
        {dragging&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:12,background:'rgba(99,102,241,0.1)',pointerEvents:'none'}}>
          <span style={{color:'#a5b4fc',fontWeight:600}}>Drop your DOCX, PDF, or .txt here</span></div>}
        {parsing&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:12,background:'rgba(0,0,0,0.65)'}}>
          <span style={{color:'#a5b4fc',fontSize:14,fontWeight:600}}>Reading file…</span></div>}
      </div>

      {doneWeeks.length>0&&!text&&(
        <div style={{marginBottom:12,padding:'10px 14px',borderRadius:9,background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.15)',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:13,color:'#a5b4fc'}}>📚 {doneWeeks.length} completed course project{doneWeeks.length>1?'s':''} detected</span>
          <button onClick={appendProjects} style={{marginLeft:'auto',padding:'4px 12px',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.25)',color:'#a5b4fc'}}>Add to resume</button>
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>fileRef.current?.click()} style={{padding:'7px 14px',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'inherit',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8'}}>Upload DOCX / PDF / .txt</button>
          <input ref={fileRef} type="file" accept=".docx,.pdf,.txt" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f)readFile(f);e.target.value='';}}/>
          {wc>0&&<span style={{fontSize:12,color:'#475569'}}>{wc} words</span>}
        </div>
        <button onClick={handleContinue} disabled={!ok}
          style={{padding:'9px 24px',borderRadius:9,fontSize:14,fontWeight:600,cursor:ok?'pointer':'not-allowed',fontFamily:'inherit',border:'none',
            background:ok?'linear-gradient(90deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.06)',color:ok?'#fff':'#475569',transition:'all 0.2s'}}>
          Continue →
        </button>
      </div>
    </div>
  );
}

function ResumeGoalStep({onNext,onBack}){
  const [selected,setSelected]=useState([]);
  const [jd,setJd]=useState('');
  const needsJd=selected.includes('tailor');
  const ok=selected.length>0&&(!needsJd||jd.trim().length>50);
  const toggle=id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  return(
    <div style={{maxWidth:680,margin:'0 auto'}}>
      <button onClick={onBack} style={{marginBottom:20,background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:13,padding:0,fontFamily:'inherit'}}>← Back</button>
      <h3 style={{fontSize:22,fontWeight:700,color:'#e2e8f0',marginBottom:6}}>What do you want to do?</h3>
      <p style={{color:'#64748b',fontSize:14,marginBottom:20}}>Select everything that applies.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10,marginBottom:20}}>
        {RESUME_GOALS.map(g=>{const active=selected.includes(g.id);return(
          <button key={g.id} onClick={()=>toggle(g.id)} style={{padding:'14px 16px',borderRadius:10,textAlign:'left',cursor:'pointer',fontFamily:'inherit',
            border:active?'1.5px solid rgba(99,102,241,0.6)':'1px solid rgba(255,255,255,0.07)',background:active?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.03)',transition:'all 0.15s'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <span style={{fontSize:16}}>{g.icon}</span>
              <span style={{fontSize:14,fontWeight:600,color:active?'#a5b4fc':'#e2e8f0'}}>{g.label}</span>
              {active&&<span style={{marginLeft:'auto',color:'#6366f1',fontSize:14}}>✓</span>}
            </div>
            <div style={{fontSize:12,color:'#64748b',paddingLeft:24}}>{g.desc}</div>
          </button>
        );})}
      </div>
      {needsJd&&(
        <div style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:13,fontWeight:600,color:'#94a3b8',marginBottom:8}}>Paste the job description</label>
          <textarea value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste the full job description here…" rows={8}
            style={{width:'100%',padding:'14px',borderRadius:10,resize:'vertical',fontFamily:'inherit',fontSize:13,lineHeight:1.6,color:'#e2e8f0',outline:'none',boxSizing:'border-box',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}/>
        </div>
      )}
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <button onClick={()=>onNext(selected,jd)} disabled={!ok}
          style={{padding:'9px 28px',borderRadius:9,fontSize:14,fontWeight:600,cursor:ok?'pointer':'not-allowed',fontFamily:'inherit',border:'none',
            background:ok?'linear-gradient(90deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.06)',color:ok?'#fff':'#475569',transition:'all 0.2s'}}>
          Continue →
        </button>
      </div>
    </div>
  );
}

function ResumeInterviewStep({resumeText,goals,jd,interview,onUpdateInterview,onComplete,onBack,apiKey}){
  const [loading,setLoading]=useState(!interview.questions.length);
  const [current,setCurrent]=useState(interview.currentIdx||0);
  const [answer,setAnswer]=useState('');
  const [error,setError]=useState('');
  const startedRef=useRef(false);
  const questions=interview.questions;

  useEffect(()=>{
    if(interview.questions.length||startedRef.current)return;
    startedRef.current=true;
    if(!apiKey){setError('No API key. Add one in Settings.');setLoading(false);return;}
    const sys=`You are an elite resume coach. Analyze this resume and generate exactly 5 targeted questions to uncover missing metrics, scope, and business impact. Be specific — reference actual content. Never ask about information already stated. NEVER ask users to invent numbers. Return ONLY valid JSON: {"questions":[{"id":"q1","q":"..."},{"id":"q2","q":"..."},{"id":"q3","q":"..."},{"id":"q4","q":"..."},{"id":"q5","q":"..."}]}`;
    const usr=`RESUME:\n${resumeText}\n\nGOALS: ${goals.join(', ')}\nTARGET JD: ${jd||'Not provided'}`;
    resumeAICall([{role:'system',content:sys},{role:'user',content:usr}],apiKey,1200)
      .then(r=>{const qs=(r.questions||[]).map(q=>({...q,a:''}));onUpdateInterview({...interview,questions:qs,currentIdx:0});setLoading(false);})
      .catch(e=>{setError('Failed to generate questions: '+e.message);setLoading(false);});
  },[]);

  const currentQ=questions[current];
  const total=questions.length;

  const advance=(ans)=>{
    const updatedQs=questions.map((q,i)=>i===current?{...q,a:ans}:q);
    if(current+1>=total){
      onUpdateInterview({...interview,questions:updatedQs,done:true});
      onComplete();
    }else{
      onUpdateInterview({...interview,questions:updatedQs,currentIdx:current+1});
      setCurrent(c=>c+1);
      setAnswer(questions[current+1]?.a||'');
    }
  };

  if(loading)return(
    <div style={{maxWidth:600,margin:'0 auto',textAlign:'center',paddingTop:60}}>
      <div style={{fontSize:28,marginBottom:16}}>🔍</div>
      <div style={{fontSize:16,fontWeight:600,color:'#e2e8f0',marginBottom:8}}>Analyzing your resume…</div>
      <div style={{fontSize:13,color:'#64748b'}}>Generating targeted questions based on your specific experience</div>
    </div>
  );
  if(error)return(
    <div style={{maxWidth:600,margin:'0 auto'}}>
      <div style={{padding:16,borderRadius:10,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5',marginBottom:16}}>{error}</div>
      <button onClick={onBack} style={{padding:'8px 16px',borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontFamily:'inherit'}}>← Back</button>
    </div>
  );

  return(
    <div style={{maxWidth:640,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
        <button onClick={onBack} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:13,padding:0,fontFamily:'inherit'}}>← Back</button>
        <div style={{flex:1,height:4,borderRadius:4,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
          <div style={{height:'100%',background:'linear-gradient(90deg,#6366f1,#8b5cf6)',borderRadius:4,width:`${((current+1)/total)*100}%`,transition:'width 0.4s ease'}}/>
        </div>
        <span style={{fontSize:12,color:'#64748b',whiteSpace:'nowrap'}}>Question {current+1} of {total}</span>
      </div>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:12,fontWeight:600,letterSpacing:'0.08em',color:'#6366f1',textTransform:'uppercase',marginBottom:12}}>Quick Question</div>
        <div style={{fontSize:18,fontWeight:600,color:'#e2e8f0',lineHeight:1.5,marginBottom:8}}>{currentQ?.q}</div>
        <div style={{fontSize:12,color:'#475569'}}>"I don't know" and "skip" are always fine — never make up numbers.</div>
      </div>
      <textarea value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey))advance(answer);}}
        placeholder="Your answer… (Ctrl+Enter to continue)" rows={5}
        style={{width:'100%',padding:'14px',borderRadius:10,resize:'vertical',fontFamily:'inherit',fontSize:14,lineHeight:1.6,color:'#e2e8f0',outline:'none',boxSizing:'border-box',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',marginBottom:16}}/>
      <div style={{display:'flex',gap:10}}>
        <button onClick={()=>advance('skip')} style={{padding:'9px 20px',borderRadius:9,fontSize:13,cursor:'pointer',fontFamily:'inherit',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b'}}>Skip</button>
        <button onClick={()=>advance(answer)} style={{padding:'9px 24px',borderRadius:9,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',border:'none',background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff'}}>
          {current+1>=total?'Finish →':'Next →'}
        </button>
      </div>
    </div>
  );
}

function ResumeGeneratingStep({resumeText,goals,jd,interview,onComplete,onError,apiKey}){
  const [msgIdx,setMsgIdx]=useState(0);
  const startedRef=useRef(false);

  useEffect(()=>{
    let i=0;
    const t=setInterval(()=>{i=Math.min(i+1,GEN_MSGS.length-1);setMsgIdx(i);},2300);
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    if(startedRef.current)return;
    startedRef.current=true;
    const interviewCtx=interview.questions.map(q=>`Q: ${q.q}\nA: ${q.a||'(skipped)'}`).join('\n\n');
    const goalLabels=goals.map(id=>RESUME_GOALS.find(g=>g.id===id)?.label||id).join(', ');
    const sys=`You are a professional resume editor. Analyze this resume and propose targeted improvements as discrete edit operations.

FACTUAL RULES — non-negotiable:
- NEVER fabricate: jobs, employers, dates, degrees, GPAs, certifications, skills, technologies, metrics, titles, or accomplishments
- NEVER add information not present in the original resume or interview answers
- If an interview answer provides a legitimate metric, incorporate it. Never invent numbers.
- Preserve all factual content: names, dates, companies, titles

BULLET CONSTRUCTION — optimize every bullet in this exact order:
1. TRUTH — every claim must be in the original or verified interview answers. Never invent.
2. RELEVANCE — would a recruiter in this field actually care about this specific point?
3. SPECIFICITY — what exactly was built, deployed, analyzed, or led? Name it.
4. IMPACT — why did it matter? Only include if facts support it. Never fabricate.
5. SCOPE — team size, user count, venue count, dataset volume, number of units. Use originals only.
6. OWNERSHIP — what did the candidate personally own vs. assist vs. participate in?
7. CONCISION — every word must earn its place. If a word adds nothing, cut it.
8. FLOW — does it read cleanly in under 5 seconds?

TARGET LENGTH: 1–2 dense lines. A tight one-liner is ideal. A two-liner is correct if the substance fills it. Never 3+ lines. Never pad — if the content is thin, make one precise line, not one vague long line.

STRONG OPENING VERBS: Built, Developed, Designed, Launched, Led, Automated, Deployed, Evaluated, Analyzed, Mapped, Modeled, Implemented, Founded, Created, Optimized, Forecasted, Restructured, Streamlined, Consolidated, Managed, Directed, Authored, Executed

WEAK OPENING VERBS — avoid unless factually accurate: Guided, Worked on, Helped, Assisted, Participated in, Was responsible for, Supported

TONE — write like a sharp, specific person, not like AI:
- BANNED: "spearheaded", "orchestrated", "leveraged" (verb), "synergized", "cross-functional", "robust", "scalable", "impactful", "bandwidth", "move the needle", "best-in-class", "innovative", "passionate", "results-driven", "proactive", "utilized", "facilitated"
- BANNED EMPTY OUTCOME LANGUAGE — cut immediately, they consume space without evidence: "enhancing operational efficiency", "driving strategic outcomes", "boosting business performance", "delivering value", "improving stakeholder alignment", "improving customer experiences", "to drive growth"
- Do NOT template every bullet as "Verb + object + resulting in X%". Vary structure.
- Do NOT force metrics where none exist in the source.
- Sound like the person wrote it about their actual work.
${jd?'- Align language and keywords with the target role naturally (no keyword stuffing)':''}

Return ONLY valid JSON (no markdown fences):
{
  "diagnosis":{"scores":{"clarity":75,"impact":65,"specificity":70,"relevance":80,"ats":72,"formatting":85},"observations":["obs1","obs2","obs3","obs4","obs5"]},
  "edits":[
    {"id":"e1","section":"Experience","targetText":"EXACT text from the resume copied verbatim — must match character-for-character (trim leading/trailing whitespace only)","replacementText":"improved version of exactly that text only — max 95 chars","why":"brief explanation"}
  ],
  "jobMatch":{"strong":["skill1"],"partial":[{"skill":"...","note":"..."}],"missing":[{"skill":"...","question":"Do you have experience with ...?"}]}
}

targetText must be exact text lifted from the resume — no paraphrasing, no summarizing. Propose 5-15 targeted edits. JobMatch: only if JD provided, else empty arrays.`;
    const usr=`ORIGINAL RESUME:\n${resumeText}\n\nGOALS: ${goalLabels}\n${jd?`\nTARGET JOB DESCRIPTION:\n${jd}\n`:''}\nINTERVIEW ANSWERS:\n${interviewCtx||'(none)'}`;
    resumeAICall([{role:'system',content:sys},{role:'user',content:usr}],apiKey,8192)
      .then(r=>onComplete(r))
      .catch(e=>onError(e.message));
  },[]);

  return(
    <div style={{maxWidth:500,margin:'80px auto 0',textAlign:'center'}}>
      <div style={{fontSize:36,marginBottom:20}}>✨</div>
      <div style={{fontSize:17,fontWeight:600,color:'#e2e8f0',marginBottom:10,minHeight:28}}>{GEN_MSGS[msgIdx]}</div>
      <div style={{fontSize:13,color:'#475569',marginBottom:32}}>This takes about 20–30 seconds</div>
      <div style={{height:3,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden',maxWidth:320,margin:'0 auto'}}>
        <div style={{height:'100%',background:'linear-gradient(90deg,#6366f1,#8b5cf6)',borderRadius:3,animation:'shimmer 2s linear infinite',backgroundSize:'200% 100%'}}/>
      </div>
    </div>
  );
}

function applyEditsToDocxXml(originalXml,edits){
  const NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const parser=new DOMParser();
  const doc=parser.parseFromString(originalXml,'application/xml');
  const pNodes=doc.getElementsByTagNameNS(NS,'p');
  for(const edit of edits){
    const target=(edit.targetText||edit.before||'').trim().replace(/\s+/g,' ');
    const replacement=edit.replacementText||edit.after||'';
    if(!target)continue;
    for(let i=0;i<pNodes.length;i++){
      const p=pNodes[i];
      const runs=p.getElementsByTagNameNS(NS,'r');
      let fullText='';
      for(let j=0;j<runs.length;j++){const tns=runs[j].getElementsByTagNameNS(NS,'t');for(let k=0;k<tns.length;k++)fullText+=tns[k].textContent;}
      if(fullText.trim().replace(/\s+/g,' ')===target){
        if(runs.length>0){
          const ftns=runs[0].getElementsByTagNameNS(NS,'t');
          if(ftns.length>0){
            ftns[0].textContent=replacement;
            if(/^\s|\s$/.test(replacement))ftns[0].setAttribute('xml:space','preserve');
          }
          for(let j=1;j<runs.length;j++){const tns2=runs[j].getElementsByTagNameNS(NS,'t');for(let k=0;k<tns2.length;k++)tns2[k].textContent='';}
        }
        break;
      }
    }
  }
  return new XMLSerializer().serializeToString(doc);
}

function postProcessMammothHtml(html){
  if(!html)return html;
  const div=document.createElement('div');
  div.innerHTML=html;
  // Apply full-width table styles
  div.querySelectorAll('table').forEach(t=>{
    t.style.width='100%';t.style.borderCollapse='collapse';t.style.borderSpacing='0';
  });
  div.querySelectorAll('td,th').forEach(cell=>{
    cell.style.verticalAlign='top';cell.style.padding='0 0 2pt 0';
  });
  // Key fix: bullet rows trapped in first column of a two-column layout table.
  // When a DOCX uses a table for company/location headers AND bullets in the same
  // table, mammoth renders bullets in col 1 with an empty col 2 — constraining width.
  // Collapse those empty right cells so bullets span the full row.
  div.querySelectorAll('table tr').forEach(row=>{
    const cells=Array.from(row.querySelectorAll('td,th'));
    if(cells.length<2)return;
    const rightEmpty=cells.slice(1).every(c=>!c.textContent.replace(/[\s ]/g,'').length&&!c.querySelector('img'));
    if(rightEmpty){
      cells[0].setAttribute('colspan',String(cells.length));
      cells[0].style.width='100%';
      cells.slice(1).forEach(c=>c.remove());
    }
  });
  return div.innerHTML;
}

async function buildDocxBlob(originalDocxBase64,modifiedDocXml){
  const bStr=atob(originalDocxBase64);
  const bytes=new Uint8Array(bStr.length);
  for(let i=0;i<bStr.length;i++)bytes[i]=bStr.charCodeAt(i);
  const zip=await JSZip.loadAsync(bytes.buffer);
  if(modifiedDocXml)zip.file('word/document.xml',modifiedDocXml);
  return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',compression:'DEFLATE',compressionOptions:{level:6}});
}

function ResumeEditingStep({re,setRe,original,apiKey,toasts}){
  const [view,setView]=useState('resume');
  const [chatInput,setChatInput]=useState('');
  const [chatStreaming,setChatStreaming]=useState(false);
  const [showExport,setShowExport]=useState(false);
  const [savingVersion,setSavingVersion]=useState(false);
  const [versionName,setVersionName]=useState('');
  const [docxPreviewHtml,setDocxPreviewHtml]=useState('');
  const [previewTick,setPreviewTick]=useState(0);
  const chatEndRef=useRef(null);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[re.chatHistory?.length,chatStreaming]);

  const activeVersion=(re.versions||[]).find(v=>v.id===re.activeVersionId)||(re.versions||[]).slice(-1)[0];
  const currentResume=activeVersion?.content||'';
  const isDocxMode=re.uploadMode==='docx'&&!!re.originalDocxBase64;
  const diag=re.diagnosis;
  const allChanges=re.changes||[];
  const pending=allChanges.filter(c=>c.status==='pending');
  const scoreColor=s=>s>=80?'#10b981':s>=65?'#f59e0b':'#ef4444';

  // Mammoth DOCX preview — rebuilds when active version's docXml changes
  useEffect(()=>{
    if(!isDocxMode||!window.mammoth||!window.JSZip)return;
    const currentXml=activeVersion?.docxXml||re.originalDocxXml;
    if(!currentXml)return;
    let cancelled=false;
    (async()=>{
      try{
        const blob=await buildDocxBlob(re.originalDocxBase64,currentXml);
        const buf=await blob.arrayBuffer();
        if(cancelled)return;
        const r=await mammoth.convertToHtml({arrayBuffer:buf});
        if(!cancelled)setDocxPreviewHtml(postProcessMammothHtml(r.value||''));
      }catch(e){console.warn('DOCX preview error',e);}
    })();
    return()=>{cancelled=true;};
  },[re.activeVersionId,previewTick,isDocxMode]);

  const rebuildDocxFromChanges=(changes)=>{
    if(!isDocxMode||!re.originalDocxXml)return null;
    const toApply=changes.filter(c=>c.status!=='rejected');
    return applyEditsToDocxXml(re.originalDocxXml,toApply);
  };

  const setChangeStatus=(id,status)=>{
    const newChanges=re.changes.map(c=>c.id===id?{...c,status}:c);
    if(isDocxMode){
      const newDocXml=rebuildDocxFromChanges(newChanges);
      const newVersions=re.versions.map(v=>v.id===activeVersion?.id?{...v,docxXml:newDocXml}:v);
      setRe(r=>({...r,changes:newChanges,versions:newVersions}));
      setPreviewTick(t=>t+1);
    }else{
      let content=currentResume;
      if(status==='rejected'){
        const ch=re.changes.find(c=>c.id===id);
        const target=ch?.replacementText||ch?.after||'';
        const orig=ch?.targetText||ch?.before||'';
        if(target&&orig)content=content.replace(target,orig);
      }
      const newVersions=re.versions.map(v=>v.id===activeVersion?.id?{...v,content}:v);
      setRe(r=>({...r,changes:newChanges,versions:newVersions}));
    }
  };

  const acceptAll=()=>{
    const newChanges=re.changes.map(c=>c.status==='pending'?{...c,status:'accepted'}:c);
    setRe(r=>({...r,changes:newChanges}));
  };

  const sendChatMessage=async()=>{
    if(!chatInput.trim()||chatStreaming||!apiKey)return;
    const userMsg={role:'user',content:chatInput.trim()};
    const hist=[...(re.chatHistory||[]),userMsg];
    setRe(r=>({...r,chatHistory:hist}));
    setChatInput('');setChatStreaming(true);
    const sys=`You are editing a professional resume. Make the requested changes as targeted edit operations.

FACTUAL: NEVER fabricate jobs, employers, dates, degrees, certifications, skills, metrics, or accomplishments not in the original resume or conversation.

BULLET QUALITY — optimize in order: Truth → Specificity → Impact → Scope → Concision → Flow.
- Target 1–2 dense lines. A tight one-liner is ideal. Never pad.
- Strong verbs: Built, Deployed, Led, Automated, Analyzed, Developed, Designed, Implemented, Launched, Optimized
- Weak verbs to avoid: Guided, Helped, Assisted, Worked on, Was responsible for
- Banned: "spearheaded", "orchestrated", "leveraged" (verb), "synergized", "cross-functional", "impactful", "proactive", "results-driven", "utilizing", "facilitating"
- Banned empty outcome phrases — cut them, they add no evidence: "enhancing operational efficiency", "driving strategic outcomes", "delivering value", "improving stakeholder alignment", "boosting business performance"
- Vary sentence structure — do NOT template every bullet as "Verb + object + resulting in X%"
- Never invent metrics, scope, or impact not in the original or this conversation

Current resume:\n${currentResume}\n\nOriginal (factual reference — add nothing not in original):\n${original?.content||currentResume}

Return ONLY valid JSON:
{"edits":[{"id":"cx1","section":"Chat edit","targetText":"exact text from current resume","replacementText":"improved version, max 95 chars","why":"reason"}],"note":"brief message to user"}`;
    try{
      const result=await resumeAICall([{role:'system',content:sys},...hist.map(m=>({role:m.role,content:m.content}))],apiKey,8192);
      const edits=(result.edits||result.changes||[]).map(c=>({
        ...c,id:c.id||uid('c'),
        targetText:c.targetText||c.before||'',
        replacementText:c.replacementText||c.after||'',
        status:'pending'
      }));
      const newVid=uid('v');
      let newContent=currentResume;
      let newDocXml=activeVersion?.docxXml||null;
      if(isDocxMode&&re.originalDocxXml){
        const allEdits=[...re.changes.filter(c=>c.status!=='rejected'),...edits];
        newDocXml=applyEditsToDocxXml(re.originalDocxXml,allEdits);
      }else{
        for(const e of edits){if(e.targetText&&e.replacementText)newContent=newContent.replace(e.targetText,e.replacementText);}
      }
      const newV={id:newVid,name:`Edit ${new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}`,content:newContent,docxXml:newDocXml,isEdited:true,createdAt:Date.now()};
      const aMsg={role:'assistant',content:result.note||'Done.'};
      setRe(r=>({...r,versions:[...r.versions,newV],activeVersionId:newVid,changes:[...r.changes,...edits],chatHistory:[...hist,aMsg]}));
      setPreviewTick(t=>t+1);
    }catch(e){
      setRe(r=>({...r,chatHistory:[...hist,{role:'assistant',content:'Error: '+e.message}]}));
    }
    setChatStreaming(false);
  };

  const saveVersion=()=>{
    const name=versionName.trim()||`Version ${re.versions.length}`;
    const id=uid('v');
    setRe(r=>({...r,versions:[...r.versions,{id,name,content:currentResume,docxXml:activeVersion?.docxXml||null,isEdited:true,createdAt:Date.now()}],activeVersionId:id}));
    setSavingVersion(false);setVersionName('');
    toasts.push('Saved: '+name);
  };

  const copyText=()=>{
    navigator.clipboard?.writeText(currentResume).then(()=>toasts.push('Copied to clipboard!')).catch(()=>{
      const el=document.createElement('textarea');el.value=currentResume;document.body.appendChild(el);el.select();document.execCommand('copy');document.body.removeChild(el);toasts.push('Copied!');
    });
  };

  const downloadDocx=async()=>{
    if(!window.JSZip||!re.originalDocxBase64){toasts.push('No DOCX source available — try uploading a .docx file');return;}
    try{
      const blob=await buildDocxBlob(re.originalDocxBase64,activeVersion?.docxXml||re.originalDocxXml);
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='resume-edited.docx';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
      toasts.push('Downloaded resume-edited.docx');
    }catch(e){toasts.push('Download failed: '+e.message);}
  };

  const printPDF=()=>{
    const w=window.open('','_blank');
    if(!w){toasts.push('Allow popups to print resume');return;}
    const bodyContent=isDocxMode&&docxPreviewHtml
      ?`<div id="resume">${docxPreviewHtml}</div>`
      :`<pre>${currentResume.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`;
    w.document.write(`<!DOCTYPE html><html><head><title></title><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Times New Roman',Georgia,serif;font-size:11pt;line-height:1.55;color:#000;background:#fff}
      #resume,pre{padding:0.75in}
      pre{white-space:pre-wrap;font-family:inherit;font-size:inherit}
      #resume p{margin:0 0 0.05in}
      #resume h1,#resume h2,#resume h3{font-size:inherit;font-weight:bold;margin:0.08in 0 0.03in}
      #resume ul{padding-left:0.18in;margin:0 0 0.05in}
      #resume li{margin-bottom:0.02in}
      #resume strong{font-weight:bold}#resume em{font-style:italic}
      #resume table{width:100%;border-collapse:collapse;border-spacing:0}
      #resume td,#resume th{vertical-align:top;padding:0 0 2pt}
      @page{margin:0;size:letter}
      @media print{body{padding:0}#resume,pre{padding:0.75in}}
    </style></head><body>${bodyContent}</body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),600);
    toasts.push('Tip: uncheck "Headers and footers" in the print dialog for clean output');
  };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 220px)',minHeight:480}}>
      {/* Toolbar */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,flexShrink:0,flexWrap:'wrap'}}>
        <select value={re.activeVersionId||''} onChange={e=>setRe(r=>({...r,activeVersionId:e.target.value}))}
          style={{padding:'6px 10px',borderRadius:7,fontSize:12,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontFamily:'inherit',maxWidth:180}}>
          {(re.versions||[]).map(v=><option key={v.id} value={v.id} style={{background:'#1a1a24'}}>{v.name}</option>)}
        </select>
        {isDocxMode&&<span style={{fontSize:11,padding:'3px 8px',borderRadius:5,background:'rgba(16,185,129,0.12)',border:'1px solid rgba(16,185,129,0.2)',color:'#6ee7b7'}}>DOCX</span>}
        <div style={{display:'flex',gap:1,padding:3,borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
          {[['resume','Resume'],['changes',`Changes${pending.length>0?` (${pending.length})`:''}` ],['jobmatch','Job Match']].map(([id,label])=>(
            <button key={id} onClick={()=>setView(id)} style={{padding:'5px 11px',borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:'inherit',border:'none',transition:'all 0.15s',
              background:view===id?'rgba(255,255,255,0.1)':'transparent',color:view===id?'#e2e8f0':'#64748b'}}>{label}</button>
          ))}
        </div>
        {pending.length>0&&<button onClick={acceptAll} style={{padding:'5px 12px',borderRadius:7,fontSize:12,cursor:'pointer',fontFamily:'inherit',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',color:'#6ee7b7'}}>Accept All ({pending.length})</button>}
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button onClick={()=>setSavingVersion(true)} style={{padding:'6px 12px',borderRadius:7,fontSize:12,cursor:'pointer',fontFamily:'inherit',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8'}}>Save Version</button>
          <div style={{position:'relative'}}>
            <button onClick={()=>setShowExport(x=>!x)} style={{padding:'6px 14px',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',background:'linear-gradient(90deg,#6366f1,#8b5cf6)',border:'none',color:'#fff'}}>Export ↓</button>
            {showExport&&(
              <div style={{position:'absolute',top:'110%',right:0,background:'#1a1a24',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'4px',minWidth:190,zIndex:100,boxShadow:'0 16px 40px rgba(0,0,0,0.6)'}}>
                {[
                  ...(isDocxMode?[['⬇ Download .docx',downloadDocx]]:[] ),
                  ['📋 Copy Text',copyText],
                  ['🖨 Print / Save PDF',printPDF],
                ].map(([l,fn])=>(
                  <button key={l} onClick={()=>{fn();setShowExport(false);}} style={{display:'block',width:'100%',padding:'9px 12px',borderRadius:7,textAlign:'left',fontSize:13,cursor:'pointer',fontFamily:'inherit',background:'none',border:'none',color:'#e2e8f0'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>{l}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save version modal */}
      {savingVersion&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={()=>setSavingVersion(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#1a1a24',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:24,width:320}}>
            <div style={{fontSize:15,fontWeight:600,color:'#e2e8f0',marginBottom:14}}>Save as version</div>
            <input value={versionName} onChange={e=>setVersionName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveVersion()} autoFocus
              placeholder="e.g. Equity Research — BlackRock"
              style={{width:'100%',padding:'9px 12px',borderRadius:8,fontSize:13,color:'#e2e8f0',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',outline:'none',fontFamily:'inherit',boxSizing:'border-box',marginBottom:14}}/>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setSavingVersion(false)} style={{padding:'7px 14px',borderRadius:7,fontSize:13,cursor:'pointer',fontFamily:'inherit',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#64748b'}}>Cancel</button>
              <button onClick={saveVersion} style={{padding:'7px 14px',borderRadius:7,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',background:'linear-gradient(90deg,#6366f1,#8b5cf6)',border:'none',color:'#fff'}}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Split view */}
      <div style={{flex:1,display:'flex',gap:14,minHeight:0,overflow:'hidden'}}>
        {/* Left: Resume / Changes / Job Match */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
          {view==='resume'&&(
            <div style={{flex:1,overflow:'auto',background:'rgba(255,255,255,0.02)',borderRadius:12,border:'1px solid rgba(255,255,255,0.07)',padding:'24px 28px'}}>
              {diag&&(
                <div style={{marginBottom:20,padding:'14px 16px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:16,flexWrap:'wrap'}}>
                  {Object.entries(diag.scores||{}).map(([k,v])=>(
                    <div key={k} style={{textAlign:'center',minWidth:58}}>
                      <div style={{fontSize:20,fontWeight:700,color:scoreColor(v)}}>{v}</div>
                      <div style={{fontSize:10,color:'#475569',textTransform:'capitalize'}}>{k}</div>
                    </div>
                  ))}
                </div>
              )}
              {isDocxMode&&docxPreviewHtml?(
                <div style={{fontFamily:'Georgia,"Times New Roman",serif',fontSize:13,lineHeight:1.7,color:'#e2e8f0',wordBreak:'break-word',overflowWrap:'break-word'}}
                  dangerouslySetInnerHTML={{__html:docxPreviewHtml}}/>
              ):(
                isDocxMode&&!docxPreviewHtml?(
                  <div style={{color:'#475569',fontSize:13,textAlign:'center',paddingTop:40}}>Loading DOCX preview…</div>
                ):(
                  <pre style={{whiteSpace:'pre-wrap',fontFamily:'Georgia,"Times New Roman",serif',fontSize:13,lineHeight:1.75,color:'#e2e8f0',margin:0}}>{currentResume}</pre>
                )
              )}
            </div>
          )}
          {view==='changes'&&(
            <div style={{flex:1,overflow:'auto'}}>
              {allChanges.length===0?(
                <div style={{textAlign:'center',padding:40,color:'#475569'}}>No changes recorded yet.</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {allChanges.map(ch=>{
                    const beforeText=ch.targetText||ch.before||'';
                    const afterText=ch.replacementText||ch.after||'';
                    return(
                    <div key={ch.id} style={{borderRadius:10,border:`1px solid ${ch.status==='rejected'?'rgba(239,68,68,0.2)':ch.status==='accepted'?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.07)'}`,background:'rgba(255,255,255,0.02)',overflow:'hidden'}}>
                      <div style={{padding:'8px 14px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'#475569'}}>{ch.section||'Edit'}</span>
                        <span style={{marginLeft:'auto',fontSize:11,fontWeight:600,textTransform:'uppercase',color:ch.status==='accepted'?'#6ee7b7':ch.status==='rejected'?'#fca5a5':'#94a3b8'}}>
                          {ch.status==='accepted'?'✓ Accepted':ch.status==='rejected'?'✗ Rejected':'Pending'}
                        </span>
                      </div>
                      <div style={{padding:'12px 14px'}}>
                        <div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:600,color:'#ef4444',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>Before</div><div style={{fontSize:13,color:'#94a3b8',lineHeight:1.5,background:'rgba(239,68,68,0.06)',padding:'7px 10px',borderRadius:6}}>{beforeText}</div></div>
                        <div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:600,color:'#10b981',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>After</div><div style={{fontSize:13,color:'#e2e8f0',lineHeight:1.5,background:'rgba(16,185,129,0.06)',padding:'7px 10px',borderRadius:6}}>{afterText}</div></div>
                        <div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:600,color:'#6366f1',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>Why</div><div style={{fontSize:12,color:'#64748b',lineHeight:1.5}}>{ch.why}</div></div>
                        {ch.status==='pending'&&(
                          <div style={{display:'flex',gap:8,marginTop:8}}>
                            <button onClick={()=>setChangeStatus(ch.id,'accepted')} style={{padding:'4px 14px',borderRadius:7,fontSize:12,cursor:'pointer',fontFamily:'inherit',background:'rgba(16,185,129,0.12)',border:'1px solid rgba(16,185,129,0.25)',color:'#6ee7b7'}}>Accept</button>
                            <button onClick={()=>setChangeStatus(ch.id,'rejected')} style={{padding:'4px 14px',borderRadius:7,fontSize:12,cursor:'pointer',fontFamily:'inherit',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',color:'#fca5a5'}}>Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );})}
                </div>
              )}
            </div>
          )}
          {view==='jobmatch'&&(
            <div style={{flex:1,overflow:'auto'}}>
              {!re.jobMatch||(re.jobMatch.strong?.length===0&&re.jobMatch.partial?.length===0&&re.jobMatch.missing?.length===0)?(
                <div style={{textAlign:'center',padding:40,color:'#475569'}}>No job description was provided, or the match analysis is empty. Paste a JD and run again to see match analysis.</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {(re.jobMatch.strong||[]).length>0&&(
                    <div style={{background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.15)',borderRadius:10,padding:'14px 16px'}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#6ee7b7',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>Strong Matches</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>{(re.jobMatch.strong||[]).map(s=><span key={s} style={{padding:'3px 10px',borderRadius:20,fontSize:12,background:'rgba(16,185,129,0.15)',color:'#6ee7b7'}}>✓ {s}</span>)}</div>
                    </div>
                  )}
                  {(re.jobMatch.partial||[]).length>0&&(
                    <div style={{background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.15)',borderRadius:10,padding:'14px 16px'}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#fbbf24',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>Partial Matches</div>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>{(re.jobMatch.partial||[]).map(p=>(
                        <div key={p.skill}><div style={{fontSize:13,fontWeight:600,color:'#fbbf24'}}>△ {p.skill}</div><div style={{fontSize:12,color:'#64748b',marginTop:2}}>{p.note}</div></div>
                      ))}</div>
                    </div>
                  )}
                  {(re.jobMatch.missing||[]).length>0&&(
                    <div style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:10,padding:'14px 16px'}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#fca5a5',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>Missing Evidence</div>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>{(re.jobMatch.missing||[]).map(m=>(
                        <div key={m.skill}><div style={{fontSize:13,fontWeight:600,color:'#fca5a5'}}>○ {m.skill}</div><div style={{fontSize:12,color:'#64748b',marginTop:2}}>{m.question}</div></div>
                      ))}</div>
                      <div style={{marginTop:12,padding:'9px 12px',borderRadius:8,background:'rgba(255,255,255,0.03)',fontSize:12,color:'#64748b',fontStyle:'italic'}}>Only add a skill if you actually have it. Ask the AI: "I have [skill] experience — add it."</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: AI Chat */}
        <div style={{width:290,flexShrink:0,display:'flex',flexDirection:'column',borderLeft:'1px solid rgba(255,255,255,0.06)',paddingLeft:14,overflow:'hidden'}}>
          <div style={{fontSize:11,fontWeight:600,color:'#6366f1',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.08em'}}>AI Resume Assistant</div>
          {diag?.observations&&(re.chatHistory||[]).length===0&&(
            <div style={{marginBottom:12}}>
              {(diag.observations||[]).map((obs,i)=>(
                <div key={i} style={{fontSize:12,color:'#94a3b8',lineHeight:1.5,padding:'7px 10px',borderRadius:7,background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.1)',marginBottom:5}}>{obs}</div>
              ))}
            </div>
          )}
          <div style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column',gap:7,marginBottom:10,minHeight:0}}>
            {(re.chatHistory||[]).length===0&&!diag?.observations&&(
              <div style={{fontSize:12,color:'#475569',textAlign:'center',padding:'20px 0'}}>Ask me to make changes, strengthen bullets, or tailor for a role.</div>
            )}
            {(re.chatHistory||[]).map((m,i)=>(
              <div key={i} style={{padding:'8px 10px',borderRadius:8,fontSize:12,lineHeight:1.5,background:m.role==='user'?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.04)',color:m.role==='user'?'#a5b4fc':'#e2e8f0',alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'90%'}}>{m.content}</div>
            ))}
            {chatStreaming&&<div style={{padding:'8px 10px',borderRadius:8,fontSize:12,color:'#64748b',background:'rgba(255,255,255,0.03)',alignSelf:'flex-start'}}>Editing…</div>}
            <div ref={chatEndRef}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
            {(re.chatHistory||[]).length===0&&(
              <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:4}}>
                {['Make bullets more impactful','Tighten to one page','Emphasize technical skills','Remove filler language'].map(p=>(
                  <button key={p} onClick={()=>setChatInput(p)} style={{padding:'4px 8px',borderRadius:6,fontSize:11,cursor:'pointer',fontFamily:'inherit',background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)',color:'#a5b4fc'}}>{p}</button>
                ))}
              </div>
            )}
            <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey))sendChatMessage();}}
              placeholder="Ask AI to edit your resume… (Ctrl+Enter)" rows={3}
              style={{width:'100%',padding:'9px',borderRadius:8,resize:'none',fontFamily:'inherit',fontSize:12,lineHeight:1.5,color:'#e2e8f0',outline:'none',boxSizing:'border-box',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}/>
            <button onClick={sendChatMessage} disabled={!chatInput.trim()||chatStreaming||!apiKey}
              style={{padding:'8px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',border:'none',background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff',opacity:(!chatInput.trim()||chatStreaming||!apiKey)?0.4:1}}>
              {chatStreaming?'Editing…':'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumeEditorTab({data,setData,toasts}){
  const apiKey=data.settings?.apiKey||'';
  const re=data.resumeEditor||getDefaultResumeEditor();
  const [genError,setGenError]=useState('');
  const setRe=updater=>setData(d=>{const cur=d.resumeEditor||getDefaultResumeEditor();const next=typeof updater==='function'?updater(cur):updater;return{...d,resumeEditor:next};});
  const versions=re.versions||[];
  const original=versions.find(v=>v.isOriginal);
  const step=!versions.length?'import':!re.goals.length?'goal':!re.interview.done?'interview':!re.diagnosis?'generating':'editing';
  const reset=()=>{if(!confirm('Start over? This clears your current resume session.'))return;setRe(getDefaultResumeEditor());setGenError('');};

  const STEP_LABELS=[['import','Import'],['goal','Goal'],['interview','Interview'],['generating','Analysis'],['editing','Editor']];
  const stepOrder=['import','goal','interview','generating','editing'];
  const curIdx=stepOrder.indexOf(step);

  if(!apiKey)return(
    <div style={{textAlign:'center',padding:'48px 20px'}}>
      <div style={{fontSize:32,marginBottom:14}}>🔑</div>
      <div style={{fontSize:16,fontWeight:600,color:'#e2e8f0',marginBottom:8}}>OpenAI API Key Required</div>
      <div style={{fontSize:13,color:'#64748b'}}>Add your key in Settings to use the AI Resume Editor.</div>
    </div>
  );

  return(
    <div>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,gap:12}}>
        <div>
          <h3 style={{fontSize:18,fontWeight:700,color:'#e2e8f0',margin:0}}>
            {step==='import'?'AI Resume Editor':step==='goal'?'Set Your Goal':step==='interview'?'Quick Interview':step==='generating'?'Analyzing…':'Resume Editor'}
          </h3>
          <p style={{fontSize:12,color:'#64748b',marginTop:4,margin:0}}>
            {step==='import'?'Upload your resume and get a stronger, more targeted version back.':
             step==='goal'?'Tell us what you want to achieve with this resume.':
             step==='interview'?'A few specific questions to strengthen your bullets.':
             step==='generating'?'Analyzing your resume and generating improvements…':
             'Review edits, chat with AI, and export your finished resume.'}
          </p>
        </div>
        {step!=='import'&&<button onClick={reset} style={{padding:'6px 12px',borderRadius:7,fontSize:12,cursor:'pointer',fontFamily:'inherit',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#475569',whiteSpace:'nowrap',flexShrink:0}}>Start Over</button>}
      </div>

      {step!=='import'&&step!=='generating'&&(
        <div style={{display:'flex',gap:4,alignItems:'center',marginBottom:22,flexWrap:'wrap'}}>
          {STEP_LABELS.map(([s,label],i)=>{
            const idx=stepOrder.indexOf(s);const done=idx<curIdx;const active=s===step;
            return(
              <React.Fragment key={s}>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:20,height:20,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,
                    background:done?'rgba(16,185,129,0.2)':active?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.05)',
                    border:done?'1.5px solid rgba(16,185,129,0.5)':active?'1.5px solid rgba(99,102,241,0.6)':'1px solid rgba(255,255,255,0.1)',
                    color:done?'#6ee7b7':active?'#a5b4fc':'#475569'}}>
                    {done?'✓':i+1}
                  </div>
                  <span style={{fontSize:11,color:active?'#a5b4fc':done?'#6ee7b7':'#475569'}}>{label}</span>
                </div>
                {i<STEP_LABELS.length-1&&<div style={{width:16,height:1,background:'rgba(255,255,255,0.07)'}}/>}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {step==='import'&&<ResumeImportStep onNext={(text,meta={})=>{const id=uid('v');setRe(r=>({...r,versions:[{id,name:'Original',content:text,docxXml:meta.docXml||null,isOriginal:true,createdAt:Date.now(),mode:meta.mode||'text'}],activeVersionId:id,originalDocxBase64:meta.base64||null,originalDocxXml:meta.docXml||null,paragraphs:meta.paragraphs||[],uploadMode:meta.mode||'text'}));}} data={data}/>}
      {step==='goal'&&<ResumeGoalStep onNext={(goals,jd)=>setRe(r=>({...r,goals,jd:jd||''}))} onBack={()=>setRe(r=>({...r,versions:[],activeVersionId:null}))}/>}
      {step==='interview'&&<ResumeInterviewStep resumeText={original?.content||''} goals={re.goals} jd={re.jd} interview={re.interview}
        onUpdateInterview={iv=>setRe(r=>({...r,interview:iv}))} onComplete={()=>setRe(r=>({...r,interview:{...r.interview,done:true}}))}
        onBack={()=>setRe(r=>({...r,goals:[],jd:''}))} apiKey={apiKey}/>}
      {step==='generating'&&(
        genError?(
          <div style={{maxWidth:500,margin:'0 auto',textAlign:'center',paddingTop:40}}>
            <div style={{padding:16,borderRadius:10,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5',marginBottom:16}}>{genError}</div>
            <button onClick={()=>{setGenError('');setRe(r=>({...r,interview:{...r.interview,done:false}}));}} style={{padding:'8px 16px',borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8',cursor:'pointer',fontFamily:'inherit'}}>← Retry from Interview</button>
          </div>
        ):(
          <ResumeGeneratingStep resumeText={original?.content||''} goals={re.goals} jd={re.jd} interview={re.interview}
            onComplete={result=>{
              const id=uid('v');
              // Normalize to new edits schema (supports both old {changes:[{before,after}]} and new {edits:[{targetText,replacementText}]})
              const rawEdits=result.edits||result.changes||[];
              const changes=rawEdits.map(c=>({...c,id:c.id||uid('c'),targetText:c.targetText||c.before||'',replacementText:c.replacementText||c.after||'',status:'pending'}));
              const isDocx=re.uploadMode==='docx'&&re.originalDocxXml;
              let editedContent=result.editedResume||original?.content||'';
              let editedDocXml=null;
              if(isDocx){
                try{editedDocXml=applyEditsToDocxXml(re.originalDocxXml,changes);}catch(e){console.warn('DOCX patch failed, text-only mode',e);editedDocXml=null;}
                let txt=original?.content||'';
                for(const c of changes){if(c.targetText&&c.replacementText)txt=txt.replace(c.targetText,c.replacementText);}
                editedContent=txt;
              }else if(!result.editedResume&&result.edits){
                let txt=original?.content||'';
                for(const c of changes){if(c.targetText&&c.replacementText)txt=txt.replace(c.targetText,c.replacementText);}
                editedContent=txt;
              }
              const nv={id,name:'AI Edit',content:editedContent,docxXml:editedDocXml,isEdited:true,createdAt:Date.now()};
              setRe(r=>({...r,versions:[...r.versions,nv],activeVersionId:id,diagnosis:result.diagnosis||null,jobMatch:result.jobMatch||null,changes}));
              setGenError('');
            }}
            onError={setGenError} apiKey={apiKey}/>
        )
      )}
      {step==='editing'&&<ResumeEditingStep re={re} setRe={setRe} original={original} apiKey={apiKey} toasts={toasts}/>}
    </div>
  );
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

  const TABS = [{id:'overview',label:'Overview'},{id:'network',label:'Network'},{id:'applications',label:'Applications'},{id:'prep',label:'Interview Prep'},{id:'resume',label:'Resume Editor'}];

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
      {tab==='resume'       && <ResumeEditorTab data={data} setData={setData} toasts={toasts} />}
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

/* -------------------- §9 Golden Egg Capital -------------------- */
const GE_PHASE_COLORS = {in_progress:'#6366f1', future:'#334155', done:'#10b981'};
const GE_OWNER_COLORS = {rishi:'#6366f1', rohan:'#10b981', both:'#8b5cf6'};

const GE_COURSE_WEEKS = [
  {id:'wk1', num:1,  name:'No Time Machine',                   notebook:'01_data_contract.ipynb',          deliverable:'Data contract + leakage checklist + 20–30-stock starter universe', hours:'5–6h', done:false, bossFight:false,
   phase:'Foundations', emoji:'⏳',
   objectives:['Set up Git repo, data dirs, Python env, SEC identification header, CIK/ticker mapping','Understand point-in-time data, survivorship bias, look-ahead bias, and decision timestamps','Build available_at, source, accession, retrieved_at fields — write automated leakage assertions that fail when violated'],
   readings:['SEC EDGAR APIs — no key needed; submissions + XBRL facts update throughout the day','When Alpha Disappears (2026) — how minor timing conventions inflate backtests substantially']},

  {id:'wk2', num:2,  name:'Build the Boring Portfolio',        notebook:'02_baseline_portfolio.ipynb',     deliverable:'Investment Policy v0.1 + baseline performance report + live $1M paper ledger', hours:'5h', done:false, bossFight:false,
   phase:'Foundations', emoji:'📊',
   objectives:['Compute arithmetic/log returns, CAGR, Sharpe, drawdown, beta, turnover, diversification','Create equal-weight and market-cap-weight portfolios; add trading-cost sensitivity','Initialize the $1M paper ledger — every AI strategy needs a naïve baseline to beat first'],
   readings:['Kenneth French Data Library — downloadable factor + portfolio returns, updated through 2026','Georgia Tech CS7646 — practical ML-for-trading portfolio foundation (free online)']},

  {id:'wk3', num:3,  name:'Rank the Street',                   notebook:'03_cross_sectional_ranker.ipynb', deliverable:'Model card, OOS rank-IC series, decile returns, feature-stability plot', hours:'6h', done:false, bossFight:false,
   phase:'Machine Learning', emoji:'🏆',
   objectives:['Reframe stock selection as cross-sectional ranking, not price prediction','Build lagged price/volume/fundamental features; compare linear baseline vs. gradient-boosted ML','Learn rank IC, top-minus-bottom spreads, monthly walk-forward — measure ranking quality not forecast accuracy'],
   readings:['Charting by Machines (2024) — nonlinear ML extracts genuine OOS signal from historical price patterns','AlphaGlass (NBER 2026) — portfolio-oriented ranking links interpretable characteristics directly to decisions']},

  {id:'wk4', num:4,  name:'Kill Your Alpha',                   notebook:'04_backtest_audit.ipynb',         deliverable:'Signed leakage/robustness report — you must destroy your own best backtest', hours:'6–7h', done:false, bossFight:true,
   phase:'Machine Learning', emoji:'⚔️',
   objectives:['Walk-forward evaluation, purge/embargo logic, hyperparameter overfitting, robustness testing','Run a specification multiverse over horizons, algorithms, costs, and portfolio construction rules','BOSS FIGHT: receive a suspiciously profitable contaminated strategy — diagnose exactly why it is wrong'],
   readings:['When Alpha Disappears — decision-time leakage effects demonstrated concretely with real code','Lalwani 2026 (European Financial Management) — research-design choices cause large variation in ML results']},

  {id:'wk5', num:5,  name:'EDGAR Detective',                   notebook:'05_edgar_pipeline.ipynb',         deliverable:'Searchable 10-company filing warehouse + "what changed?" change-detection report', hours:'5–6h', done:false, bossFight:false,
   phase:'Research Intelligence', emoji:'🔍',
   objectives:['Master CIKs, accession numbers, 10-K/10-Q/8-K, XBRL Company Facts, filing dates vs. fiscal periods','Critical rule: fiscal-period date ≠ availability date — only admit data from filings available at decision time','Build an immutable filing store; extract + compare current vs. prior filing sections for change detection'],
   readings:['SEC EDGAR public API — submissions history + XBRL facts, no authentication, <10 req/sec','JFE Cao et al. — AI most useful where information is transparent but voluminous (SEC filings are exactly this)']},

  {id:'wk6', num:6,  name:'Citation or It Didn\'t Happen',     notebook:'06_financial_rag.ipynb',          deliverable:'Retrieval eval with Recall@k + evidence-grounded filing Q&A tool', hours:'6h', done:false, bossFight:false,
   phase:'Research Intelligence', emoji:'📎',
   objectives:['Learn chunking, embeddings, semantic search, hybrid retrieval, reranking, and RAG','Attach accession/section/filing-date metadata to every retrieved chunk — provenance is mandatory','Separate retrieval errors from generation errors; build 25 manually verified ground-truth questions'],
   readings:['Fin-RATE (2026) — LLM performance drops when tasks cross documents or reporting periods','FinRank (Aug 2026) — retrieving the correct evidence from filings is hard even when documents are available']},

  {id:'wk7', num:7,  name:'Become the Allocator',              notebook:'07_portfolio_optimizer.ipynb',    deliverable:'Allocator function: ML scores → auditable constrained target weights (CVXPY)', hours:'6h', done:false, bossFight:false,
   phase:'Portfolio Management', emoji:'⚖️',
   objectives:['Move from "best stocks" to portfolios — covariance, risk budgets, rank weighting, mean-variance','Build constrained optimization with CVXPY: position limits, sector exposure, turnover penalties','Understand why expected-return errors matter — the forecast and the optimizer are not independent problems'],
   readings:['Machine Learning Meets Markowitz (NBER 2026) — integrate ML with portfolio objective, not two steps','AlphaGlass (NBER 2026) — interpretable direct portfolio objectives vs. isolated prediction-then-optimize']},

  {id:'wk8', num:8,  name:'Crash the Portfolio',               notebook:'08_risk_and_drift.ipynb',         deliverable:'Risk limits + model-disable rules', hours:'5–7h', done:false, bossFight:true,
   phase:'Portfolio Management', emoji:'💥',
   objectives:['Factor regression, concentration dashboard, drawdown stress, cost shocks, model drift monitor','Volatility regimes, liquidity proxies, macro vintages — FRED/ALFRED APIs supply vintage-dated observations','BOSS FIGHT: understand why good average performance can conceal catastrophic fragility in stress scenarios'],
   readings:['FRED/ALFRED — historical macro + vintage dates so macro features can be tested point-in-time','Chen, Sialm & Xu (NBER 2026) — early AI fund outperformance diminishes; AI is not a durable alpha source']},

  {id:'wk9', num:9,  name:'Build an AI Analyst, Not an Oracle',notebook:'09_llm_analyst.ipynb',           deliverable:'5 AI research memos graded against human-verified facts', hours:'6h', done:false, bossFight:false,
   phase:'AI Analysts', emoji:'🧠',
   objectives:['Structured LLM outputs — JSON with thesis, risks, uncertainties, evidence source IDs, unanswered questions','Prompt contracts: LLM may reason only from supplied, timestamp-approved evidence — never from memory alone','Force every material investment claim to cite an evidence ID; document everything the agent cannot answer'],
   readings:['JFE Cao et al. — conceptual anchor: AI processes volume, humans supply context and catch extreme errors','Finance Agent Benchmark (2025) — best model scored only 46.8% on 537 real SEC-grounded research tasks']},

  {id:'wk10',num:10, name:'Bull vs. Bear',                     notebook:'10_agent_red_team.ipynb',         deliverable:'Agent eval matrix + escalation rules', hours:'6h', done:false, bossFight:true,
   phase:'AI Analysts', emoji:'🐂',
   objectives:['Build a multi-agent committee: Fundamental → Quant → Bear → Risk → human synthesis','Adversarial debate, model independence, correlated LLM errors, concentration and media bias','BOSS FIGHT: introduce misleading evidence into the pipeline — does the adversarial agent catch it?'],
   readings:['Carlin et al. (NBER 2026) — LLM portfolios: concentrated, momentum/media-tilted, no statistically significant alpha','LangGraph — stateful workflows + human-in-the-loop gates (or implement in plain Python first)']},

  {id:'wk11',num:11, name:'Build the War Room',                notebook:'11_platform_integration.ipynb',   deliverable:'Platform v1.0: ticker → evidence → quant → AI → human gate → weights → log', hours:'7h', done:false, bossFight:false,
   phase:'Integration', emoji:'🏗️',
   objectives:['Integrate data lake + ML ranker + RAG + multi-agent committee + optimizer + audit log + paper ledger','Establish the deterministic boundary: agents analyze, deterministic code controls weights and execution','The human approval gate is arguably more important than any choice of agent framework'],
   readings:['Ollama structured outputs — Pydantic/JSON-schema-constrained outputs for reliable agent parsing','LangGraph — optional stateful orchestration; plain Python is better until you understand the workflow']},

  {id:'wk12',num:12, name:'The $1M Investment Committee',      notebook:'12_final_ic.ipynb',               deliverable:'Final repo + IC deck + $1M paper portfolio + preregistered forward-testing protocol', hours:'7h', done:false, bossFight:false,
   phase:'Integration', emoji:'💰',
   objectives:['Freeze models, evidence dates, portfolio rules, and benchmark — no post-hoc changes allowed','Convert rankings + AI research into a paper portfolio; defend every position with thesis + disconfirming evidence','12 weeks builds a credible research operation — not a statistically credible track record (that takes years)'],
   readings:['"Summoning the Oracle to Slay It" (2026) — LLM historical backtests inherit future knowledge via model parameters','Mo & Ouyang "GenAI in Financial Economics" (Jul 2026) — synthesis across asset pricing, investment, and market risks']},
];

const GE_COURSE_RULES = [
  {name:'The Mission',      icon:'🎯', color:'#6366f1', desc:'Every week ships a working component of the same platform. By Week 11 the whole system runs end-to-end.'},
  {name:'Boss Fight',       icon:'⚔️', color:'#ef4444', desc:'Weeks 4, 8, and 10 each hand you a suspiciously profitable model or misleading evidence. Your job: prove it wrong before it breaks the portfolio.'},
  {name:'Bull vs. Bear',    icon:'🐂', color:'#f59e0b', desc:'Once agents are live, no bullish research memo is accepted without a separate adversarial Bear agent attacking it first.'},
  {name:'No-Time-Machine',  icon:'⏳', color:'#8b5cf6', desc:'Every feature, filing, macro observation, and LLM prompt context must satisfy available_at ≤ decision_time. No exceptions, ever.'},
  {name:'Evidence Rule',    icon:'📎', color:'#3b82f6', desc:'An LLM statement about a company is not accepted because it sounds plausible. It must resolve to a filing accession, section, data observation, or source.'},
  {name:'$1M Scoreboard',   icon:'💰', color:'#10b981', desc:'Paper portfolio graded on return, vol, drawdown, turnover, concentration, factor exposure, thesis accuracy, and process errors — not P&L alone.'},
];

const GE_RESEARCH_SPINE = [
  {title:'From Man vs. Machine to Man + Machine',    authors:'Cao, Jiang, Wang & Yang',     venue:'JFE 2024',      why:'Best evidence for hybrid design: AI scales information processing, humans reduce extreme errors — combining both beats either alone'},
  {title:'The Growth and Performance of AI in AM',   authors:'Chen, Sialm & Xu',             venue:'NBER 2026',     why:'Early AI hedge-fund outperformance diminished over time — AI is not itself a durable source of alpha'},
  {title:'AlphaGlass',                               authors:'Bell et al.',                  venue:'NBER 2026',     why:'Modern example: interpretable stock characteristics linked directly to portfolio decisions, not isolated prediction'},
  {title:'Machine Learning Meets Markowitz',         authors:'Wang et al.',                  venue:'NBER 2026',     why:'Forecast-then-optimize is suboptimal; integrate the investor\'s objective and constraints into the modeling problem'},
  {title:'AlphaPortfolio',                           authors:'Cong, Tang & Wang',            venue:'NBER 2026',     why:'Frontier: transformer + deep RL for direct portfolio construction — stretch reading, not the beginner baseline'},
  {title:'AI Managed Household Portfolios',          authors:'Carlin, Israelsen & Wazzan',   venue:'NBER 2026',     why:'Warning: LLM portfolios concentrated in large, momentum, media-visible stocks — no statistically significant abnormal return'},
  {title:'Finance Agent Benchmark',                  authors:'(community)',                   venue:'2025',          why:'537 expert SEC-research questions; best model achieved 46.8% — agents need human oversight, not autonomous delegation'},
  {title:'Fin-RATE',                                 authors:'(community)',                   venue:'2026',          why:'LLM performance degrades when financial tasks cross documents, entities, or reporting periods'},
  {title:'FinRank',                                  authors:'(community)',                   venue:'Aug 2026',      why:'Evidence provenance in 10-K/10-Q retrieval is hard even for state-of-the-art systems — evaluate it explicitly'},
  {title:'When Alpha Disappears',                    authors:'(community)',                   venue:'2026',          why:'Core reading on decision-time leakage — minor timing conventions can materially inflate financial ML backtests'},
  {title:'Summoning the Oracle to Slay It',          authors:'(community)',                   venue:'2026',          why:'LLM historical backtests can inherit future knowledge through model parameters (parametric look-ahead bias)'},
  {title:'(Generative) AI in Financial Economics',   authors:'Mo & Ouyang',                  venue:'SSRN Jul 2026', why:'Broad synthesis tying GenAI to asset pricing, investment, and financial-market risks — good Week 12 capstone read'},
];

const GE_COURSE_DAYS14 = [
  {id:'d1', day:1,  action:'Create repository and Python environment — notebooks/, src/, data/, tests/, decisions/ exist; Git initialized', done:false},
  {id:'d2', day:2,  action:'Pick 20–30 company educational universe — CSV: ticker, company, CIK, sector, inclusion rationale', done:false},
  {id:'d3', day:3,  action:'Connect to SEC EDGAR — retrieve each company\'s submissions metadata; respect <10 req/sec fair-access limit', done:false},
  {id:'d4', day:4,  action:'Acquire EOD price history — raw data saved unchanged; data source and licensing documented', done:false},
  {id:'d5', day:5,  action:'Build data contract — every table has source, retrieved_at, available_at, and primary key', done:false},
  {id:'d6', day:6,  action:'Write leakage tests — code fails if any feature or filing appears after its simulated decision time', done:false},
  {id:'d7', day:7,  action:'Boss Fight: deliberately leak one feature — test suite must catch and fail on it', done:false},
  {id:'d8', day:8,  action:'Calculate returns, volatility, and drawdowns — one clean performance notebook runs start to finish', done:false},
  {id:'d9', day:9,  action:'Build $1M equal-weight paper baseline — ledger contains shares, weights, timestamp, decision ID', done:false},
  {id:'d10',day:10, action:'Add benchmark and factor diagnostics — baseline compared to preregistered benchmark/factors', done:false},
  {id:'d11',day:11, action:'Add transaction-cost scenarios — results shown at multiple assumed cost levels, not one convenient assumption', done:false},
  {id:'d12',day:12, action:'Write Investment Policy v0.1 — universe, benchmark, rebalance schedule, constraints, "no live trading" rule', done:false},
  {id:'d13',day:13, action:'Write first one-page company memo manually — no LLM; establish what good human research looks like', done:false},
  {id:'d14',day:14, action:'Review and freeze the foundation — tag repository foundation-v1; Week 3 ML work may begin', done:false},
];

/* ──────────────────────────────────────────────────────────
   GE COURSE CURRICULUM CONTENT  (immutable — user state overlays via weekProgress)
   ────────────────────────────────────────────────────────── */
const GE_WEEK_CONTENT = {
  wk1: {
    mission:{
      objective:"Prove that your data pipeline cannot see the future, and build automated tests that make temporal leakage impossible.",
      output:"A reproducible data-contract notebook: universe CSV, point-in-time filing timestamps, automated leakage assertions that fail when violated, and documented data sources.",
      failCondition:"You report a research result without a verified available_at timestamp on every input feature.",
      whatWouldChangeMind:"A systematic process that assigns filing timestamps to every data row — and a test suite that catches any violation."
    },
    whyItMatters:"Every spectacular backtest that fails in live trading shares one trait: it accidentally saw the future. Temporal integrity is the highest-leverage habit in quantitative research. Researchers who internalize it first build better strategies faster, with fewer expensive surprises.",
    prerequisites:['Python environment','Basic pandas/NumPy','SEC EDGAR account (free)'],
    lessons:[
      {id:'w01-l01', title:'Why Backtests Lie', duration:'10 min', competency:'DATA',
       content:"A researcher builds a momentum strategy. It shows a 2.4 Sharpe ratio over ten years. During code review, a colleague spots one error: every signal was tagged with fiscal year-end date rather than the actual SEC filing date. After correcting this single date field, the Sharpe falls to 0.7.\n\nWhich result represents the strategy?\n\nOnly the 0.7. The 2.4 was not a measurement of the strategy. It was a measurement of the researcher's access to information that market participants in 2012 did not possess. The performance was real in the simulation. It was never real in the market.\n\nA backtest simulates trading decisions in the past. Its only value is the assumption that it reconstructed exactly the information available at each historical decision moment. When that assumption is wrong, the backtest measures nothing useful.\n\n── THE INFORMATION TIMELINE ──\n\nEvery piece of financial data moves through a sequence of timestamps before it reaches a trader:\n\n  OBSERVATION DATE  → the economic event occurs (fiscal year ends Dec 31)\n  REPORTING PERIOD  → the data describes this interval (FY 2021)\n  PUBLICATION DATE  → the document is filed and publicly accessible (Feb 28, 2022)\n  INGESTION DATE    → your data vendor captures it (often +2–7 days)\n  REVISION DATE     → a historical value is updated (GDP revisions, earnings restatements)\n  DECISION DATE     → the strategy makes its simulated trade (Jan 3, 2022)\n\nFor a backtest to be valid, every feature used at the decision date must have a publication date on or before that date. In the example above, the researcher used Publication Date February 28 to tag a trade on January 3 — a 56-day time machine.\n\n── THE THREE FAMILIES OF ERROR ──\n\nLOOK-AHEAD BIAS — using information that did not yet exist at decision time:\n  → Financial statements tagged with period-end instead of filing date\n  → Earnings tagged with quarter-end instead of announcement date\n  → Features normalized using the full dataset including future observations\n  → Index membership defined from today rather than historically\n  → Improperly aligned rolling windows or preprocessing\n\nSURVIVORSHIP BIAS — defining the universe from the future:\n  → Today's S&P 500 constituents applied to a 2005 backtest\n  → Datasets that exclude delisted and bankrupt companies\n  → ETF backtests assuming all current constituents were always tradeable\n\nDATA SNOOPING — reporting a selected result as if it were pre-specified:\n  → Testing 200 lookback windows and reporting the best\n  → Optimizing parameters after seeing backtest results\n  → Trying many factor definitions, universes, or date ranges\n\nThese three families frequently interact. A researcher might simultaneously use today's index constituents (survivorship), tag data with fiscal year-end (look-ahead), and report the best of 200 parameter combinations (snooping). Each bias individually inflates results. Together they can produce backtests that look extraordinary and contain almost no information about forward performance.",

       mechanics:"A valid research pipeline executes this sequence for each decision date:\n\nFOR each trading_date in simulation:\n\n  STEP 1 — Assemble available information\n    available_data = all rows where available_at <= trading_date\n    → Reject any row where available_at > trading_date\n\n  STEP 2 — Compute features from available_data only\n    features = f(available_data)\n    → Normalization parameters computed from available_data only\n    → No future observations enter computation at any stage\n\n  STEP 3 — Generate signal\n    signal = model.predict(features)\n    → Training window must end strictly before trading_date\n    → Hyperparameters must not be tuned using future information\n\n  STEP 4 — Determine and log position\n    position = allocator(signal, constraints)\n    log(trading_date, position, features_hash)\n\n  STEP 5 — Realize forward return\n    return = price[trading_date + holding_period] / price[trading_date] - 1\n\nContamination enters at Steps 1, 2, or 3.\nStep 4 and 5 are mechanical — contamination cannot enter there.\nThe most common entry point: Step 1 (wrong available_at timestamps).\nThe most subtle entry point: Step 2 (full-sample preprocessing).",

       intuition:"Imagine a sealed historical archive. Every document is timestamped and locked in a vault until its public release date. You are allowed to consult only documents that were unlocked on or before your decision date. To conduct a valid backtest, you must operate entirely within those constraints — never reaching for a document still in the sealed wing.\n\nLook-ahead bias is an accidental breach of that archive. The researcher reaches for a filing that has not yet been unlocked. The data is real and describes genuine financial facts — it just was not available to any market participant at the simulated trade time. The backtest becomes a simulation of a trader who could read sealed files.\n\nWhat makes this particularly dangerous: the breach is almost always unintentional. Researchers do not plan to contaminate their backtests. They mark data with the period it describes rather than the date it became public. The contamination is invisible in the data itself — you only detect it by tracing the provenance of every input back to its original source.\n\nSurvivorship bias is a different archive problem. The researcher has not read sealed files — they have quietly discarded a large section of the archive. All files belonging to companies that failed before the study end date are simply missing. What remains is a curated collection of survivors. Testing a strategy on survivors tells you how the strategy would have performed with perfect foreknowledge of which companies would still exist.\n\nData snooping corrupts the scientific question itself. Testing 200 strategies and presenting the winner as 'the strategy' is not one experiment — it is 200 experiments followed by one extremely optimistic selection. The winner looks good because of the search process, not because of genuine signal.",

       example:"CONTAMINATED PIPELINE — Fiscal Year-End Tagging\n\n  Company:             Acme Corp\n  Fiscal year:         Jan 1, 2021 – Dec 31, 2021\n  Revenue 2021:        $1.2B  (up 20% from $1.0B in 2020)\n  Actual 10-K filing:  February 28, 2022\n  Researcher tags:     available_at = 2021-12-31\n  Strategy trades:     January 3, 2022\n\n  What the contaminated backtest does:\n    Jan 3, 2022 → sees revenue growth = 20% → BUYS Acme Corp\n    Reality:       10-K not yet filed → data was sealed until Feb 28\n\nVALID PIPELINE — Using Actual Filing Date\n\n  Same data, correct: available_at = 2022-02-28\n\n  What the valid backtest does:\n    Jan 3, 2022 → revenue row locked (available_at > decision_date) → NOT USED\n    Mar 1, 2022 → first rebalance after filing → signal now eligible\n\nBEFORE / AFTER COMPARISON (hypothetical illustration)\n\n  Metric          Contaminated    Valid (corrected)\n  ──────────────  ────────────    ─────────────────\n  CAGR            22.8%           8.3%\n  Sharpe Ratio     2.4             0.7\n  Max Drawdown   -14%           -29%\n  Win Rate        68%             52%\n\nThe contaminated backtest did not find alpha.\nIt found the filing delay — information real traders did not possess.",

       subtleVersion:"The obvious version — using tomorrow's price to make today's decision — is rarely the real problem. Sophisticated researchers know to lag their signals. The subtle versions are far more common.\n\nFULL-SAMPLE NORMALIZATION\n\nYou standardize features using z-scores:\n  z_t = (x_t - mean(x_ALL)) / std(x_ALL)\n\nIf x_ALL includes observations from future years, then mean and std embed future information. The normalization is leaky even if every individual x_t is correctly timestamped. The feature 'knows' how extreme it is relative to history that has not happened yet.\n\nCorrect approach: use expanding or rolling window statistics:\n  z_t = (x_t - mean(x[0:t])) / std(x[0:t])\n\nPREPROCESSING LEAKAGE\n\nYou fit a StandardScaler, Imputer, or encoder on the full dataset, then split into train and test. Even if the model sees only training labels during fitting, the preprocessing parameters were computed using test-period statistics. Future distribution information has leaked backward into training features.\n\nCorrect approach: fit ALL transformations exclusively on training data, then apply (not re-fit) those same parameters to test data.\n\nMISSING VALUE STRATEGIES\n\nForward-filling missing values creates another common leakage path. If a company stopped reporting in 2019, forward-filling its last known value through 2022 implies the strategy 'knew' the company remained a going concern. Point-in-time universes handle this by tracking which companies had active filings at each decision date.",

       warning:"THE TRAP: PERIOD END AS AVAILABILITY DATE\n\nTHE TRAP\nMarking data as available on the date the observation describes (fiscal year-end, quarter-end) rather than the date it was published and accessible to the public.\n\nWHY IT LOOKS LEGITIMATE\nFiscal year-end IS embedded in the data. Most database schemas use 'period' or 'date' as the primary timestamp. That timestamp describes what the data covers, not when it was released. The error feels like a minor labeling choice.\n\nWHY IT MATTERS\nFundamental data is typically published 30–90 days after the period it describes. A strategy using December 31 instead of February 28 captures a 60-day lead on an entire dataset. Multiplied across many stocks and many quarters, this generates systematic positioning before public announcements — producing simulated returns with no market counterpart.\n\nHOW TO DETECT IT\n  1. Pull three random rows from your feature dataset\n  2. Look up the actual SEC filing date for each observation\n  3. Compare your available_at to the real filing date\n  4. If available_at = fiscal period end → this problem is present\n\nHOW TO FIX IT\n  → For SEC filings: use the 'filed' field from EDGAR submissions JSON\n  → For earnings: use announcement timestamp, not quarter-end\n  → For macro data: use ALFRED (Archival FRED) for vintage-dated releases\n  → Add validate_availability() to assert the contract automatically",

       misconception:"COMMON MISCONCEPTION\n\n'I used .shift(1) on all my features — my backtest cannot have look-ahead bias.'\n\n.shift(1) lags every feature by one row. It addresses one specific alignment problem: using today's closing price when the trade executes at tomorrow's open.\n\nIt does NOT fix:\n  → Point-in-time errors (fiscal year-end used instead of filing date)\n  → Full-sample normalization leakage\n  → Survivorship bias in the universe\n  → Revised macroeconomic data used instead of vintage values\n  → Preprocessing parameters fitted on the full dataset before train/test split\n  → Index membership defined from the future\n\nA backtest with .shift(1) applied to a contaminated feature set is still contaminated. The shift merely moves contaminated values one row backward — the wrong information is still present, just slightly displaced in time. The source of the leakage is the timestamp in the data, not the alignment of the signal.",

       yourTurn:"YOUR TURN\n\nYour dataset contains quarterly earnings data. The only timestamp available is:\n  period_end = 2023-03-31\n\nYou cannot find a filing date. What do you do?\n\nA. Assume March 31 is correct and proceed\nB. Add 1 day (April 1) as a conservative buffer and proceed\nC. Apply a fixed lag of 45 days after quarter-end for all companies\nD. Investigate actual filing dates and determine point-in-time availability\n\nAnswer: D is the correct research approach. Then, if investigation confirms consistent timing, C is defensible.\n\nOption A is look-ahead bias. Option B barely helps. Option C acknowledges uncertainty with a meaningful buffer. But D is what careful researchers do first: check 5–10 actual SEC filings for companies in your universe. If they consistently file within 40 days of quarter-end, a 45-day lag assumption may be defensible. Document every lag assumption in your data contract.",

       synthesis:"KEY TAKEAWAY\n\nA backtest is credible only if its simulated trader knew no more than any real market participant could have known at each historical moment. When temporal contamination is present — even from one mislabeled timestamp — performance metrics can be dramatically overstated and meaningless as forward-performance evidence.\n\nThe most important research habit: treat every data field as a claim about when information became available, and verify that claim against the original source.\n\nBEFORE YOU CONTINUE, you should be able to:\n  ✓ Explain why fiscal year-end is not the same as data availability date\n  ✓ Identify two subtle forms of leakage beyond simple date misuse\n  ✓ Describe what .shift(1) does and does not fix\n  ✓ Explain why reporting the best of 200 backtest variants is misleading\n  ✓ Describe the correct temporal sequence: observation → publication → decision\n\nNEXT: Lesson 2 builds the formal data contract infrastructure that makes temporal leakage mechanically impossible to commit accidentally.",

       equation:"VALIDITY RULE (must hold for every row, every feature)\n  available_at(x_t) <= decision_date(t)\n\n  available_at   = date the data was publicly accessible\n  decision_date  = date the simulated trade was made\n\nIf this inequality is violated even once, every downstream result is suspect.\nVerify this contract with automated assertions — never assume it holds."},

      {id:'w01-l02', title:'Point-in-Time Data Contracts', duration:'12 min', competency:'DATA',
       content:"A data contract is a formal specification of what guarantees hold about a dataset. In software engineering, contracts specify API behavior. In quantitative research, the most important contract is temporal: it guarantees that every value in the dataset was available to a real market participant at or before the timestamp assigned to it.\n\nWithout a data contract, every feature in your research system is a trust claim. You believe it is point-in-time correct. You have not verified it. That belief is not evidence.\n\n── THE FIVE TIMESTAMP PROBLEM ──\n\nFinancial data carries multiple timestamps, and confusing them is the primary source of look-ahead bias. For any data observation, you must distinguish:\n\n  OBSERVATION DATE    When the underlying event occurred\n                      (company fiscal year ends December 31, 2021)\n\n  REPORTING PERIOD    The interval the data summarizes\n                      (full-year 2021 financials)\n\n  PUBLICATION DATE    When the document became publicly accessible\n                      (10-K filed February 28, 2022)\n\n  INGESTION DATE      When your data vendor captured it\n                      (often 1–7 days after publication)\n\n  REVISION DATE       When a historical value was subsequently updated\n                      (GDP initial estimate vs. third revision)\n\nFor your research pipeline, only PUBLICATION DATE and INGESTION DATE are relevant for available_at. The other timestamps describe what the data is about — not when you may use it.\n\n── THE FOUR REQUIRED FIELDS ──\n\nEvery table in a rigorous research system carries these fields:\n\n  source          Where did this data originate?\n                  (SEC EDGAR, FRED, Bloomberg, FactSet, etc.)\n\n  retrieved_at    When did you download this data?\n                  (your retrieval timestamp — proves data existed at this time)\n\n  available_at    When was this data publicly accessible?\n                  (the critical field — drives all temporal filtering)\n\n  primary_key     A unique identifier for this observation\n                  (ticker + period_end + accession_number)\n\nWithout these fields, you cannot construct a point-in-time view of your data. Without a point-in-time view, you cannot run a valid backtest.\n\n── THE VALIDATE_AVAILABILITY CONTRACT ──\n\nA data contract is only as good as its enforcement. Write a validator that asserts the contract programmatically:\n\n  def validate_availability(features_df, decision_dates):\n    for date in decision_dates:\n      leakers = features_df[\n        (features_df.index == date) &\n        (features_df.available_at > date)\n      ]\n      if len(leakers) > 0:\n        raise ValueError(f'Leakage on {date}: {leakers}')\n\nThis validator should run before every backtest run. Treat a validation failure as a hard error, not a warning. If it passes silently, you may have a bug in the validator itself — test it deliberately by introducing a known leaker and confirming it is caught.\n\n── MACRO DATA AND VINTAGE RELEASES ──\n\nEconomic data (GDP, unemployment, inflation) presents a particularly complex timestamp problem: many economic series are revised repeatedly after initial release.\n\nExample: Q3 2022 US GDP\n  Initial release (advance estimate):    October 27, 2022   +2.6%\n  Second estimate:                       November 30, 2022  +2.9%\n  Third estimate (final):                December 22, 2022  +3.2%\n\nIf your strategy makes a decision on November 1, 2022, it should see only +2.6%. Using the final +3.2% is look-ahead bias — that number was not public until late December.\n\nThe solution: ALFRED (Archival FRED) provides vintage-dated releases of all FRED economic series. Never use plain FRED for backtesting — always use ALFRED to retrieve the value that was available on your specific decision date.",

       mechanics:"ENFORCING THE CONTRACT IN A RESEARCH PIPELINE:\n\n1. ACQUISITION\n   Download raw data → record retrieved_at timestamp immediately\n   Never modify raw files — raw data is immutable\n\n2. ENRICHMENT\n   For each row: determine available_at from the original source\n   → SEC filings: use 'filed' date from EDGAR submissions API\n   → Earnings: use announcement_date from earnings calendar\n   → Macro: use ALFRED vintage_date for the series\n\n3. STORAGE\n   Persist all four contract fields: source, retrieved_at, available_at, primary_key\n   Store raw and processed data separately\n   Never overwrite historical rows — append new versions\n\n4. CONSUMPTION\n   Apply temporal filter at query time:\n     filtered = data[data.available_at <= query_date]\n   This is the point-in-time view\n\n5. VALIDATION\n   Before every backtest run:\n     validate_availability(features, decision_dates)\n   Test the validator itself: deliberately introduce a leaker and assert it fails\n\n6. DOCUMENTATION\n   For each data source, document:\n     → Typical lag between observation date and publication date\n     → Whether historical revisions occur\n     → How you handle the revision problem",

       intuition:"Think of available_at as the postmark on a sealed letter. The letter contains financial information. You are not allowed to read a letter until the postmark date has passed. Reading it early — even if you own the letter — violates the contract.\n\nA data contract is the formal specification of those postmarks. It says: this row of financial data was mailed on date X. You may not use it before date X in any simulation.\n\nWithout a data contract, you are handling a pile of undated letters. Some of them might be from the future. You do not know which ones. Every time you grab a letter to build a feature, you might be grabbing information your historical traders could not have seen.\n\nThe deeper problem: a strategy that performs well using future information is not merely overstated — it is structurally impossible to replicate in live trading. The edge that looks real in the backtest does not exist in the forward environment. The data contract is the mechanism that prevents you from mistaking a data artifact for a genuine market insight.\n\nVintage data adds another dimension to this. For economic series that are revised, the 'letter' is actually rewritten over time. The advance GDP estimate is one letter. The revised estimate is a correction letter, mailed months later. In a valid backtest, your strategy reads only the letters available at its decision date — not the corrected versions that came later.",

       example:"SEC EDGAR API RESPONSE — Three Timestamps for One Filing\n\n  Query: Apple Inc., fiscal Q4 2022 (period ending September 2022)\n\n  API response fields:\n    'period_of_report': '2022-09-30'   ← OBSERVATION DATE  (fiscal quarter end)\n    'filed':            '2022-10-28'   ← PUBLICATION DATE  (SEC receipt timestamp)\n    'accepted':         '2022-10-28T18:01:23'   ← exact acceptance time\n    'form':             '10-Q'\n    'accession_number': '0000320193-22-000108'\n\n  WRONG: available_at = '2022-09-30'  (period end — look-ahead bias, 28-day error)\n  RIGHT: available_at = '2022-10-28'  (filing date — point-in-time correct)\n\nALFRED VINTAGE DATA — GDP Revisions\n\n  Q3 2022 US GDP quarterly growth rate:\n\n  vintage_date    value    notes\n  ───────────     ─────    ─────\n  2022-10-27      +2.6%    advance estimate (first public release)\n  2022-11-30      +2.9%    second estimate\n  2022-12-22      +3.2%    third estimate (final)\n\n  Strategy decision date: November 1, 2022\n  Correct value to use:   +2.6% (advance estimate, available Oct 27)\n  Using +3.2% would be look-ahead bias\n\n  ALFRED query: get_vintage_series('GDP', observation_date='2022-11-01')\n  Returns: +2.6%  ← the value available on that specific date",

       subtleVersion:"INTRADAY TIMING AND ANNOUNCEMENT WINDOWS\n\nEarnings announcements have precise timing that matters for decision validity:\n  → Pre-market (before 9:30 AM ET): tradeable at the open\n  → After-hours (after 4:00 PM ET): tradeable the next morning\n\nIf your strategy assumes daily frequency and a company reports at 6:00 PM on day T, the information should not be available until day T+1. Using it for a day T position is a half-day time machine. For daily backtests, the safe convention: treat any after-hours announcement as available on T+1.\n\nDATA VENDOR LATENCY\n\nEven when you know the correct publication date, your data vendor processes it later. A 10-K filed February 28 might not appear in your vendor's database until March 2 due to processing, normalization, and quality checks. For conservative research, use available_at = max(filing_date, ingestion_date). For a production system with real-time data feeds, verify actual latency empirically.\n\nCURRENCY AND CROSS-COUNTRY TIMING\n\nInternational research adds complexity: different fiscal year structures, different regulatory filing deadlines, and different market hours. A Japanese company's annual report may be filed in June for a March fiscal year. Applying the US 90-day assumption would be wrong. Always verify filing deadlines country-by-country.",

       warning:"THE TRAP: TRUSTING THE DATA VENDOR'S TIMESTAMP\n\nTHE TRAP\nAssuming that the date field in your data provider's API or export represents when the information was publicly available.\n\nWHY IT HAPPENS\nData vendors often use 'date' or 'period' as their primary key — meaning the period the data describes, not the publication date. This is a reasonable choice for data organization, but it is wrong for point-in-time research.\n\nWHY IT MATTERS\nA data vendor providing quarterly earnings with date = quarter_end gives you data that appears to arrive 30-60 days before it was actually public. This is not a vendor error — it is a usage error. The vendor is not promising point-in-time correctness; the researcher is incorrectly assuming it.\n\nHOW TO VERIFY\nFor any new data source:\n  1. Find 5-10 observations with known public release dates\n  2. Compare the vendor's 'date' field to the actual release date\n  3. If they differ, you need a separate available_at mapping\n  4. Document whether the vendor provides point-in-time data at all\n\nHOW TO FIX\n  → For fundamentals: build your own available_at from SEC EDGAR filings\n  → For earnings: subscribe to or build an earnings calendar with announcement timestamps\n  → For macro: use ALFRED, not plain FRED\n  → For price data: use adjusted prices with careful ex-dividend handling",

       misconception:"COMMON MISCONCEPTION\n\n'retrieved_at and available_at are the same thing.'\n\nThey are almost always different.\n\nretrieved_at = when YOU downloaded the data (today, or whenever you ran the collection script)\navailable_at = when the information was PUBLIC (the original filing date or announcement date)\n\nIf you collect SEC filings in 2025 for data going back to 2015, your retrieved_at is 2025. Your available_at should be the actual 2015 filing date. Using retrieved_at as available_at makes every historical observation look like it was available only when you collected it — which would make backtesting impossible or meaningless.\n\nretrieved_at matters for auditing your pipeline (proving you had the data). available_at drives your backtest temporal filter. They serve different purposes and must be stored separately.",

       yourTurn:"YOUR TURN\n\nYour EDGAR pipeline returns this for a company's 10-K:\n  period_of_report: 2022-12-31\n  filed:            2023-03-15\n  accepted:         2023-03-15T16:42:11\n  form:             10-K\n\nYour strategy rebalances on the first trading day of each month.\n\nWhich of these is the correct available_at for this filing?\nA. 2022-12-31 (fiscal year end)\nB. 2023-01-01 (next day after fiscal year end)\nC. 2023-03-15 (SEC filing date)\nD. 2023-03-16 (day after filing, to allow indexing delay)\n\nAnswer: C or D are both defensible. C is technically correct (filing is publicly accessible via EDGAR immediately upon acceptance). D is more conservative and accounts for the time it takes for data vendors to index and process the filing. A and B are wrong — they use the fiscal period end, not the publication date. In this example, using A or B gives your strategy a 74-day time machine.",

       synthesis:"KEY TAKEAWAY\n\nA data contract is not bureaucracy — it is the mechanism that separates research from data artifact hunting. Every timestamp claim in your dataset is an assertion about when information was available to real market participants. That assertion must be verified, not assumed.\n\nThe four fields (source, retrieved_at, available_at, primary_key) and the validate_availability() function are not optional features. They are the foundation that makes every downstream result interpretable.\n\nBEFORE YOU CONTINUE, you should be able to:\n  ✓ Distinguish the five timestamp types: observation, reporting period, publication, ingestion, revision\n  ✓ Explain why retrieved_at and available_at are different fields\n  ✓ Describe what validate_availability() does and why it must be tested with deliberate failures\n  ✓ Explain the ALFRED/FRED distinction for macroeconomic backtesting\n  ✓ Verify any data source's available_at guarantee against the original source\n\nNEXT: Lesson 3 extends these principles to the hardest part of universe construction — identifying which companies existed at each historical decision date.",

       equation:"POINT-IN-TIME FILTER\n  features_at_t = data[data.available_at <= t]\n\nDATA CONTRACT FIELDS (required on every table)\n  source        — origin of the data\n  retrieved_at  — when YOU collected it (audit trail)\n  available_at  — when it was public (drives backtest filter)\n  primary_key   — unique row identifier\n\nCONSERVATIVE available_at ASSIGNMENT\n  available_at = max(filing_date, ingestion_date)\n  (or filing_date alone if no vendor delay is expected)"},

      {id:'w01-l03', title:'Survivorship Bias and Universe Construction', duration:'8 min', competency:'DATA',
       content:"If you backtest a strategy on today's S&P 500 constituents from 2005 to 2024, you have not tested how that strategy would have performed. You have tested how it would have performed on a portfolio of companies that you already knew, in 2025, had survived to the end of the sample period.\n\nThat is not a historical test. It is a test of your knowledge of the future, applied to the past.\n\nSurvivorship bias is the inflation of backtest performance caused by testing only on entities that survived to the present day, while excluding all entities that failed, were acquired at distressed prices, were delisted, or were otherwise removed during the test period.\n\nThe bias is structural: you cannot avoid it by being careful, by lagging your signals, or by using quality data. You can only avoid it by constructing a point-in-time universe — one that includes, at each historical decision date, exactly the companies that would have been eligible for inclusion at that moment.\n\n── HOW SURVIVORSHIP BIAS INFLATES PERFORMANCE ──\n\nThe mechanism is straightforward. Companies fail for reasons that often involve poor financial performance, deteriorating fundamentals, or sector-wide distress. If your strategy selects based on any fundamental signal (value, growth, profitability, quality), it will naturally prefer companies with strong fundamentals. Many companies with weak fundamentals eventually fail. By excluding failures from the universe, you are removing the companies your strategy was most likely to short or underweight — improving your apparent returns mechanically, not through skill.\n\nSurvivorship bias also affects benchmark comparisons. If both the strategy and its benchmark are constructed from survivors, the comparison may still be internally consistent — but the absolute return numbers are inflated relative to what a real investor could have achieved.\n\n── WHERE SURVIVORSHIP BIAS HIDES ──\n\nCurrent index constituents: The S&P 500 in 2025 contains 500 companies that exist and are large enough today. The index in 2005 contained many different companies. Applying 2025 membership to a 2005 start date excludes every company that was in the 2005 index but was later removed — typically due to poor performance, mergers, or bankruptcy.\n\nFinancial databases: Many academic and commercial financial databases are not survivorship-bias-free. Companies that delisted before the database was constructed are simply absent. The CRSP database is well known for handling this correctly; many others do not.\n\nMutual fund performance: Studies of mutual fund performance using survivorship-biased databases consistently show higher average returns than are actually achievable — because the worst-performing funds that were closed or merged are not represented.\n\nETF and factor backtests: Factor ETFs and smart-beta strategies sometimes publish 'simulated historical performance' calculated using current constituents or methodology applied historically. This should be treated with extreme skepticism.",

       mechanics:"BUILDING A POINT-IN-TIME UNIVERSE\n\nA point-in-time universe assigns to each decision date exactly the companies that were eligible at that moment.\n\nMETHOD: SEC EDGAR Active Filers\n\n  FOR each company in candidate_set:\n    FOR each decision_date:\n      filings = EDGAR.get_filings(cik, form=['10-K','10-Q'])\n      recent_filing = max(f for f in filings if f.filed <= decision_date)\n\n      # Include if company filed within the past 18 months\n      if (decision_date - recent_filing.filed).days <= 548:  # 18 months\n        universe_at_date.add(company)\n      # Else: company may have stopped reporting → exclude\n\nWHAT THIS CAPTURES:\n  → Companies that went bankrupt (stop filing → excluded going forward)\n  → Companies acquired (filings stop → excluded)\n  → Companies added to index later (not included before they were eligible)\n  → Companies removed from index (still included if still filing)\n\nWHAT ADDITIONAL DATA IS NEEDED:\n  → Actual index constituency records (CRSP for S&P 500 historical constituents)\n  → Delisting reason codes (merger, bankruptcy, voluntary, etc.)\n  → Price adjustment for delistings (final delisting returns matter for strategy evaluation)",

       intuition:"Imagine testing a diet by interviewing 1,000 people who followed it and are still alive. The population you surveyed was defined by the outcome you are trying to measure — survival. Of course they will report better health than a randomly selected group. You have selected for survival, then asked about health.\n\nSurvivorship bias in backtesting is exactly this. The universe is defined by companies that survived to today. You then ask: would these survivors have been good investments? The answer is biased toward yes before any strategy logic is applied — because you have already filtered out the worst outcomes.\n\nA point-in-time universe is the equivalent of interviewing everyone who started the diet in 2005, not just those who are still alive in 2025. Some of them stopped. Some of them got sicker. Some of them died. Including those outcomes gives you an honest picture of what the diet actually does.\n\nThe practical implication: almost every backtest you encounter in casual research contexts contains some survivorship bias. When someone tells you their strategy earns 15% CAGR since 2005, the first question to ask is: 'What was your universe, and did it include companies that subsequently failed?' If they do not know, treat the number with significant skepticism.",

       example:"EXAMPLE: S&P 500 BACKTEST 2005–2024\n\n  Universe method: today's S&P 500 constituents (2025 membership)\n  Backtest period: January 2005 – December 2024\n\nWHAT YOU TESTED ON:\n  → 500 companies that are large and healthy enough to be in S&P 500 in 2025\n  → All 500 existed and survived through the 2008-09 financial crisis\n  → All 500 survived COVID-19 market dislocations\n  → All 500 avoided bankruptcy, forced delisting, or distressed merger\n\nWHAT YOU EXCLUDED (partial list):\n  → Bear Stearns (2005 S&P 500 constituent, failed March 2008)\n  → Lehman Brothers (major S&P 500 constituent, failed September 2008)\n  → Washington Mutual (largest US bank failure in history, 2008)\n  → Kodak (S&P 500 constituent for decades, Chapter 11 in 2012)\n  → Sears Holdings (S&P 500 constituent, filed for bankruptcy 2018)\n  → And hundreds of other companies removed for various performance reasons\n\nCONSEQUENCE:\n  If your fundamental signal had identified any of these companies as undervalued,\n  your backtest never records the resulting losses.\n  Performance appears better than any real investor could have achieved.",

       subtleVersion:"MUTUAL FUND DATABASE BIAS\n\nAcademic studies of mutual fund performance often use databases that are not survivorship-bias-free. Funds that underperformed and were closed or merged into other funds are absent. Studies using such databases systematically overestimate the average skill of active managers.\n\nThe same problem applies to any alternative investment category where funds close when performance is poor: hedge funds, commodity trading advisors, private equity. Databases of 'live' funds always show better historical performance than the actual investor experience.\n\nETF SIMULATED PERFORMANCE BIAS\n\nWhen a factor ETF or smart-beta strategy publishes 'historical simulated performance,' they sometimes reconstruct the portfolio using the current factor definition and current-period eligible universe. This is particularly common for recently launched ETFs that want to show 10+ years of history. The resulting track record is not a genuine historical record — it is a backtest constructed with knowledge of the current state of every company in the universe.\n\nLOOK-AHEAD BIAS IN UNIVERSE ELIGIBILITY\n\nA subtler form: you define universe eligibility based on characteristics that require future knowledge. For example, requiring that a company be 'profitable for at least 3 of the past 5 years.' If you apply this filter as of today and use that set historically, companies that became profitable only later are included in their early years — when the filter should have excluded them.",

       warning:"THE TRAP: ASSUMING THE DATA PROVIDER'S UNIVERSE IS SURVIVORSHIP-FREE\n\nTHE TRAP\nUsing a data provider's 'historical index data' or 'universe' without verifying whether it handles delistings, removals, and failures correctly.\n\nWHY IT HAPPENS\nData providers often advertise 'point-in-time data' for price and fundamental data. This may be true for the data values — but not for universe construction. Having point-in-time pricing for a set of companies that was selected using survivorship criteria does not make the backtest survivorship-bias-free.\n\nHOW TO DETECT IT\nAsk your data provider:\n  'Does your historical universe include companies that were later delisted?'\n  'Can you tell me the exact constituents of the S&P 500 on January 3, 2005?'\n  'Do you have delisting return data for bankrupt companies?'\n\nIf they cannot answer these questions specifically, assume survivorship bias is present.\n\nHOW TO FIX IT\n  → Use CRSP (Center for Research in Security Prices) for survivorship-bias-free US equity data\n  → Build your universe from SEC EDGAR active filers (free, point-in-time by construction)\n  → Document your universe construction methodology in your data contract\n  → Test your universe: verify it includes companies you know failed during the test period",

       yourTurn:"YOUR TURN\n\nYou want to backtest a value strategy from 2010 to 2024 on US equities.\nYour data vendor offers two universe options:\n\nOption A: 'Russell 1000 Historical Constituents' — $800/year\n  Documentation says: 'Historical Russell 1000 membership data'\n  No mention of delisting data or bankrupt company returns\n\nOption B: SEC EDGAR active filers — Free\n  Requires building your own universe from filing metadata\n  Includes all filing companies, including those that later delisted\n\nWhich do you choose, and what questions do you ask?\n\nRight approach: Ask Option A's vendor specifically whether their data includes companies that were in the Russell 1000 in 2010 but were later delisted or bankrupt. Ask whether they provide final delisting returns. If they cannot answer clearly, Option B is actually more trustworthy for this purpose — despite requiring more work — because its universe construction mechanism is transparent and survivorship-bias-free by design.",

       synthesis:"KEY TAKEAWAY\n\nSurvivorship bias is not a data quality problem — it is a universe construction problem. The data about surviving companies may be perfectly accurate. The bias comes from which companies are in the dataset at all.\n\nA rigorous research process treats universe construction as carefully as it treats signal construction. Both require explicit, verifiable, point-in-time decisions. A strategy that 'selects' stocks from a survivor-only pool is not testing stock selection — it is testing hindsight.\n\nBEFORE YOU CONTINUE, you should be able to:\n  ✓ Explain why using today's index members to backtest from 2005 introduces bias\n  ✓ Describe the mechanism by which survivorship bias inflates every performance metric\n  ✓ Identify three settings where survivorship bias commonly appears\n  ✓ Explain how to construct a point-in-time universe from SEC EDGAR active filers\n  ✓ Describe what questions to ask a data vendor to detect survivorship bias\n\nNEXT LESSON: In Week 2, we build the baseline portfolio against which all future strategies must be measured. The baseline is also the first opportunity to test your data contract end-to-end with real data.",

       equation:"POINT-IN-TIME UNIVERSE\n  Universe(t) = { companies where last_filing_date >= t - 548_days }\n                (548 days = 18 months — companies with active SEC filings)\n\nSURVIVOR-BIASED UNIVERSE (invalid)\n  Universe = current_index_members  ← known today, not at time t\n\nBIAS MAGNITUDE (empirical research estimates)\n  Annual return inflation from survivorship bias varies by study,\n  asset class, and time period. Rather than cite a specific number,\n  verify it empirically: compare your strategy returns between\n  a survivorship-biased and a point-in-time universe. The difference\n  is your bias estimate for your specific setup."}
    ],
    quiz:{id:'w01-quiz', questions:[
      {id:'w01-q01', type:'scenario', scenario:"A researcher downloads 10-K data and marks each row's available_at as the fiscal year-end date (e.g. December 31) rather than the actual SEC filing date (e.g. March 2 of the following year).", question:"What is the primary research error?", options:['Survivorship bias','Look-ahead bias','Data snooping','Multicollinearity'], correct:1, explanation:"Look-ahead bias. The fiscal year-end is when the period ended — not when the data became public. The SEC filing date is when investors could legally access the information. Using December 31 as available_at gives the strategy a 2-3 month time machine."},
      {id:'w01-q02', type:'scenario', scenario:"A strategy backtested on 'S&P 500 stocks from 2005–2024' shows 15% CAGR. The researcher used today's index membership to define the universe.", question:"Which bias most likely inflates this result?", options:['Look-ahead bias','Parameter overfitting','Survivorship bias','Transaction cost omission'], correct:2, explanation:"Survivorship bias. Today's S&P 500 members all survived to 2024. Companies that went bankrupt, were acquired at distressed prices, or removed for poor performance are excluded. The strategy was tested on a curated set of survivors."},
      {id:'w01-q03', type:'scenario', scenario:"A strategy has Gross CAGR 18%, Sharpe 1.8. The researcher later discovers the signal was computed using price data from day T+1, not day T.", question:"How severe is this error?", options:['Minor — 1 day is negligible','Severe look-ahead bias — the signal used tomorrow\'s prices','Survivorship bias — some stocks were delisted','Model overfitting'], correct:1, explanation:"Using day T+1 data to generate a day T signal is direct look-ahead bias. Even a 1-day shift is extremely impactful for short-horizon signals — the strategy effectively 'knows' tomorrow's prices. An 18% Sharpe-1.8 backtest built on overnight gaps is not a strategy; it's a time machine."},
      {id:'w01-q04', type:'multiple_choice', question:"Which field is NOT required in a point-in-time data contract?", options:['available_at','source','retrieved_at','analyst_rating'], correct:3, explanation:"analyst_rating is derived/subjective data, not a data contract field. The four required fields are: source, retrieved_at, available_at, and a primary key that uniquely identifies each observation."},
      {id:'w01-q05', type:'scenario', scenario:"You backtest using FRED GDP data. Q3 2022 GDP was: advance estimate Oct 27, revised Nov 30, final Dec 22. Your backtest decision date is Oct 28, 2022.", question:"Which value should appear for Q3 2022 GDP on Oct 28, 2022?", options:['The final revised value (most accurate)','The advance estimate (available Oct 27)','An average of all three','Q2 2022 GDP (prior confirmed quarter)'], correct:1, explanation:"The advance estimate is correct — it was the only value available on October 28. Using the final revised figure would be look-ahead bias. ALFRED (Archival FRED) provides vintage-dated releases specifically to enable point-in-time macro testing."}
    ]},
    lab:{id:'w01-lab', objective:"Build a point-in-time data contract for your research universe. Every dataset must pass automated leakage assertions before Week 2 begins.", dataset:"SEC EDGAR (free), any EOD price source (yfinance for educational use)", steps:["Create repository: notebooks/, src/, data/raw/, data/processed/, tests/, decisions/","Define universe: 20-30 companies. CSV with ticker, CIK, sector, inclusion_rationale, inclusion_date","Query SEC EDGAR submissions API for each CIK","Record fiscal_period_end, filing_date, accession_number for every 10-K and 10-Q","Compute available_at = filing_date (conservative; some add +1 business day)","Build validate_availability(features, decision_dates) that raises if any row violates the contract","Write a test: deliberately shift available_at 90 days backward. Assert validator catches and fails.","Acquire EOD prices. Save raw data unchanged. Document source, license, retrieval date.","Verify no forward-fill or look-ahead in return alignment","Run full test suite — all assertions green before commit"],
     checks:[
       {id:'w01-c01', text:'Repo structure: notebooks/, src/, data/, tests/, decisions/ exist'},
       {id:'w01-c02', text:'Universe CSV: ticker, CIK, sector, inclusion_rationale, inclusion_date'},
       {id:'w01-c03', text:'SEC EDGAR API connected; filings retrieved with respect for 10 req/s limit'},
       {id:'w01-c04', text:'fiscal_period_end, filing_date, accession_number recorded per filing'},
       {id:'w01-c05', text:'available_at field computed on all fundamental data rows'},
       {id:'w01-c06', text:'validate_availability() exists and raises on any violation'},
       {id:'w01-c07', text:'Deliberate leakage test written — validator correctly catches and fails'},
       {id:'w01-c08', text:'Price data acquired and saved raw with source documentation'},
       {id:'w01-c09', text:'Return computation has no forward-fill or look-ahead'},
       {id:'w01-c10', text:'Full test suite passes — zero leakage violations'},
     ], deliverable:"Commit 01_data_contract.ipynb. Every cell runs clean. Leakage tests green. README documents lag assumptions for every source."},
    evidencePrompts:["What is the average lag between fiscal year-end and 10-K filing for your universe?","Did the deliberate leakage test actually fail (not silently pass)?","Are there any data sources without a documented available_at guarantee?"]
  },

  wk2:{
    mission:{objective:"Build the naïve baseline that every future strategy must beat. Freeze its benchmark and performance metrics before attempting anything sophisticated.",output:"Investment Policy v0.1 and a live $1M paper baseline with frozen benchmark comparison.",failCondition:"Reporting a strategy result without first showing what a naïve equal-weight portfolio achieves.",whatWouldChangeMind:"A strategy that materially outperforms equal-weight on a net-of-costs basis across multiple subperiods."},
    whyItMatters:"You cannot know if a strategy is good without knowing what good looks like. A boring equal-weight portfolio beating inflation is not nothing — it is the minimum bar every sophisticated strategy must clear first.",
    lessons:[
      {id:'w02-l01', title:'Returns: Arithmetic vs. Log', duration:'10 min', competency:'STATISTICS',
       content:"Two return types dominate quantitative finance. They answer different questions — and confusing them produces errors that compound silently across every downstream calculation.\n\n**Arithmetic Return (Simple Return)**\nR = (P₁ - P₀) / P₀\n\nThis is the intuitive definition. Arithmetic returns are additive across assets in the same period. If you hold 50% AAPL (+10%) and 50% MSFT (+6%), portfolio return = 0.5×10% + 0.5×6% = 8%. This cross-sectional additivity makes arithmetic returns the right choice for portfolio construction math.\n\n**Log Return (Continuously Compounded Return)**\nr = ln(P₁/P₀) = ln(1 + R)\n\nLog returns are additive across time. If a stock returns r₁ on day 1 and r₂ on day 2, the two-day log return is exactly r₁ + r₂. This time-series additivity makes log returns the right choice for compounding math, CAGR calculations, and time-series models.\n\n**The Volatility Drag Problem**\nFor any asset with annualized volatility σ:\nGeometric mean ≈ Arithmetic mean − σ²/2\n\nThis is volatility drag — permanent and compounding. A strategy with arithmetic mean 12% and volatility 20% has geometric mean ≈ 12% − 2% = 10%. Over 10 years, this 2% gap creates a 22% wealth shortfall versus what the arithmetic return implied.",
       mechanics:"# Return Calculation Pipeline\nFOR each asset in universe:\n  # 1. Raw price series (adjusted for splits/dividends)\n  prices = get_adjusted_close(asset, start, end)\n\n  # 2. Arithmetic returns — use for cross-sectional work, IC, factor construction\n  arith_ret = prices.pct_change()  # (P_t - P_{t-1}) / P_{t-1}\n\n  # 3. Log returns — use for compounding, CAGR, time-series models\n  log_ret = np.log(prices / prices.shift(1))\n\n  # 4. CAGR — always geometric, never arithmetic mean\n  T_years = len(prices) / 252\n  cagr = (prices.iloc[-1] / prices.iloc[0]) ** (1/T_years) - 1\n\n  # 5. Volatility drag quantification\n  vol = log_ret.std() * np.sqrt(252)\n  arith_ann = arith_ret.mean() * 252\n  drag = arith_ann - cagr  # should ≈ vol²/2\n\n# RED FLAG: if drag > 3%, strategy has very high volatility eating compound growth",
       intuition:"The arithmetic vs. log distinction is not academic — it determines whether your CAGR numbers are honest or flattering.\n\nConsider the simplest possible case: a stock loses 50% one year, then gains 100% the next. Arithmetic average return: +25%. This sounds like a good investment. Actual compound result: $100 × 0.50 × 2.00 = $100 exactly. Every dollar of apparent arithmetic return was consumed by volatility drag.\n\nThe log return framework makes this obvious: ln(0.5) + ln(2.0) = −0.693 + 0.693 = 0.000. The zero compound growth is built into the math. No trickery needed. This is why CAGR uses geometric compounding — it is the only formula that correctly converts periodic returns into actual wealth.",
       example:"**4-Year Portfolio: Where Arithmetic Mean Deceives**\n\nStarting capital: $100,000\nYear 1: −30%  → $100,000 × 0.70 = $70,000\nYear 2: +20%  → $70,000 × 1.20 = $84,000\nYear 3: +40%  → $84,000 × 1.40 = $117,600\nYear 4: −20%  → $117,600 × 0.80 = $94,080\n\nArithmetic mean: (−30+20+40−20)/4 = +2.5%/yr\nPredicted ending value at +2.5%: $110,381 ← does not exist\n\nActual CAGR: ($94,080/$100,000)^(0.25) − 1 = −1.5%/yr\nActual ending value: $94,080\n\nThe 4% gap (2.5% reported − (−1.5%) actual) = volatility drag\nApprox. σ²/2: variance of annual returns ≈ 8% → drag ≈ 4%  ✓",
       subtleVersion:"**Jensen's Inequality: The Precise Statement**\nFor any concave function f, E[f(X)] ≤ f(E[X]). Compound growth is concave in returns. Expected compound wealth is always ≤ compound of expected returns. The gap is σ²/2 in continuous time.\n\nThis has a direct implication for leverage: 2× leverage squares volatility, which quadruples drag. A 2× fund with 25% underlying volatility has 50% levered vol → drag ≈ 50²/2 = 12.5%/yr. Even a +15% arithmetic mean strategy has near-zero geometric return when over-levered.\n\n**Log-Normal Prices**: Stock prices are conventionally modeled log-normal (log returns normally distributed). This means high-performing stock distributions look fat-tailed because compounding amplifies winners and caps losers at −100%. The distribution skew is a mathematical artifact, not evidence of genuine outlier events.",
       warning:"**Trap: Reporting Arithmetic Mean as Strategy Return**\n\nTrap: Presenting annualized arithmetic mean of monthly returns as the strategy's annual return figure in performance reports.\n\nWhy it is dangerous: arithmetic mean consistently overstates compound growth. The overstatement grows with volatility. A 20% volatility strategy overstates CAGR by ~2%/yr. Over 10 years: 12% reported vs. 10% actual — a 22% wealth shortfall that was never disclosed.\n\nSymptom: a deck showing '14% annualized returns' where 14% = (mean monthly return) × 12, not the CAGR from starting to ending NAV.\n\nDetect it: compute (ending_NAV / starting_NAV)^(1/T) − 1. If this geometric CAGR is materially below the reported figure, arithmetic mean was used.\n\nFix: always report CAGR as the headline. Label arithmetic returns explicitly when showing return distributions. Both numbers are valid — but they answer different questions.",
       misconception:"**Misconception: 'Log returns are only for continuous-time models'**\n\nMany practitioners treat log returns as an academic construction for Black-Scholes math and use arithmetic returns for everything practical. This is wrong.\n\nFirst, log returns are the natural representation for time-series additivity. Summing daily returns into weekly returns requires simple addition for log returns — but (1+R₁)(1+R₂)...(1+R₅) − 1 for arithmetic, which is messier and more error-prone.\n\nSecond, log returns are approximately normally distributed for small time steps, making statistical tests (t-tests, Sharpe ratio t-stats) more valid. Arithmetic returns for individual stocks are right-skewed by construction — pretending they are normal underestimates extreme loss probabilities.\n\nUse arithmetic for: cross-sectional portfolio math, factor IC construction. Use log for: any time-series analysis, compounding, CAGR.",
       yourTurn:"**Scenario**: A colleague's backtest shows:\n• Strategy arithmetic mean return: +16%/yr\n• Strategy annual volatility: 35%\n• Benchmark (equal-weight) CAGR: 11%/yr\n• Strategy 'reported alpha': +5%\n\n1. Estimate the strategy's approximate CAGR using the volatility drag formula.\n2. Does the strategy actually beat the benchmark?\n3. What number should appear in the report's headline?\n\n**Answer**:\n1. CAGR ≈ 16% − (35%)²/2 = 16% − 6.1% ≈ 9.9%\n2. No. 9.9% CAGR < 11% benchmark CAGR. The strategy underperforms the simple baseline when measured correctly.\n3. ~9.9% CAGR — not the 16% arithmetic mean. The +5% 'alpha' evaporates entirely when comparing compound returns.",
       synthesis:"**Week 2, Lesson 1 — Key Takeaways**\n\n☑ Arithmetic returns are additive across assets (use for cross-sectional and portfolio-weight math)\n☑ Log returns are additive across time (use for compounding, CAGR, time-series models)\n☑ Volatility drag = σ²/2 — always reduces geometric mean below arithmetic mean\n☑ CAGR (geometric) is the honest measure of wealth creation\n☑ Never report arithmetic mean as compound annual return — it systematically overstates\n\n**Next**: With honest return computation established, Lesson 2 builds the Sharpe ratio framework your strategy's risk-adjusted performance must justify.",
       equation:"CAGR = (V_final / V_initial)^(1/T) − 1     |     Geometric ≈ Arithmetic − σ²/2"
      },
      {id:'w02-l02', title:'The Sharpe Ratio: Construction and Interpretation', duration:'8 min', competency:'STATISTICS',
       content:"The Sharpe ratio is the most widely cited performance metric in quantitative finance — and one of the most frequently misused. Understanding what it measures, and what it deliberately ignores, is prerequisite to an honest performance framework.\n\n**The Formula**\nSharpe = (R_p − R_f) / σ_p\n\nWhere R_p = portfolio annualized return (geometric, not arithmetic), R_f = risk-free rate (use 3-month T-bill — never zero), σ_p = annualized standard deviation of excess returns.\n\nFor a monthly series: Sharpe = (mean_monthly_excess / std_monthly_excess) × √12\n\n**What Sharpe Measures**\nRisk-adjusted return: how much excess return per unit of total volatility? Sharpe 1.0 means: for every 1% of annualized vol accepted, the portfolio delivers 1% excess return. Sharpe 0.5 means half that efficiency.\n\n**What Sharpe Does Not Measure**\n• Drawdown depth or duration — Sharpe 1.0 is consistent with a 60% drawdown\n• Return distribution shape — leptokurtic (fat-tail) strategies hide crash risk\n• Autocorrelation — smoothed NAVs inflate Sharpe by compressing measured volatility\n• Tail risk — selling options produces high Sharpe until catastrophic unwind\n\n**Practical Benchmarks**\n• Sharpe < 0.5: difficult to distinguish from noise\n• Sharpe 0.5–1.0: acceptable for long-only equity\n• Sharpe 1.0–1.5: strong\n• Sharpe > 2.0: examine carefully — autocorrelation? costs included? selection bias?",
       mechanics:"# Sharpe Computation — Correct Procedure\ndef compute_sharpe(returns, freq='monthly', rf_annual=0.045):\n  # 1. Convert rf to period frequency\n  if freq == 'daily':\n    periods = 252\n    rf_period = (1 + rf_annual)**(1/252) - 1\n  else:  # monthly\n    periods = 12\n    rf_period = (1 + rf_annual)**(1/12) - 1\n\n  # 2. Excess returns\n  excess = returns - rf_period\n\n  # 3. Annualize mean and std independently\n  mean_ann = excess.mean() * periods\n  std_ann = excess.std() * np.sqrt(periods)  # multiply by SQRT, not periods\n\n  # 4. Sharpe\n  return mean_ann / std_ann if std_ann > 0 else np.nan\n\n# WRONG approaches (both common):\n# sharpe = returns.mean() / returns.std()   <- ignores rf, mixes scaling\n# sharpe = (returns.mean()*12) / (returns.std()*12)  <- std should be ×√12 not ×12",
       intuition:"Sharpe is a signal-to-noise ratio for investment returns. The numerator is signal (excess return above doing nothing). The denominator is noise (how much does your return fluctuate?). A high Sharpe means your signal reliably rises above its own noise floor.\n\nBut Sharpe rewards volatility indiscriminately. A strategy that makes +1% every day has near-infinite Sharpe — even if it crashes to zero on day 366. This is the fundamental limitation: standard deviation treats upside and downside volatility symmetrically. Strategies designed around selling volatility (options writing, credit, anything with limited upside and catastrophic downside) will produce inflated Sharpe ratios for years before a single event wipes out the track record. Always pair Sharpe with maximum drawdown and tail-risk measures.",
       example:"**Computing Sharpe: Step by Step**\n\nMonthly excess returns (rf = 0.367%/month for 4.5% annual T-bill):\nJan: 2.1−0.37 = +1.73%\nFeb: 0.8−0.37 = +0.43%\nMar: −1.4−0.37 = −1.77%\nApr: 1.9−0.37 = +1.53%\nMay: 1.5−0.37 = +1.13%\n\nMean excess (monthly): 1.01%\nStd excess (monthly): 1.17%\n\nSharpe = (1.01% × 12) / (1.17% × √12) = 12.12% / 4.05% = 2.99\n\nCritical caveat: 5 monthly observations means this Sharpe estimate has huge uncertainty. Standard error of Sharpe ≈ √(1 + SR²/2) / √T = √(1 + 9/2) / √5 ≈ 1.12. The 95% confidence interval is roughly [0.76, 5.22] — completely uninformative. You need 36+ months for a Sharpe estimate worth reporting.",
       subtleVersion:"**Lo (2002): Sharpe Inflation from Autocorrelation**\n\nIf strategy returns are autocorrelated (smoothed monthly marks, illiquid holdings, momentum-following), annualized std underestimates true risk. The correction factor: σ_true = σ_reported × √(1 + 2ρ₁(1−ρ₁ⁿ)/(1−ρ₁) / n) for first-order autocorrelation ρ₁.\n\nA private credit fund reporting +0.7% every month (ρ₁ ≈ 0.70) has roughly 2× understated volatility. If reported Sharpe is 2.4, the autocorrelation-adjusted Sharpe is ~1.2.\n\n**Deflated Sharpe (Bailey & López de Prado, 2012)**\nTesting multiple variants inflates the best observed Sharpe. Expected maximum Sharpe from N tests of a zero-edge strategy: E[max SR] ≈ (1 − γ − ln(ln N) + ln(4π ln N))^0.5 / √T. With 50 tested variants and 36 monthly observations, a Sharpe of ~1.4 is consistent with zero edge. Always report whether a Sharpe is from a single pre-specified variant or the best of many.",
       warning:"**Trap: Using Risk-Free Rate = 0**\n\nTrap: Setting rf = 0 in Sharpe calculations, especially in a 4–5% rate environment.\n\nWhy it matters: excess return = gross return − rf. With rf = 0, a strategy earning 10% appears to have 10% excess return (Sharpe = 10/vol) instead of 5% excess (Sharpe = 5/vol). This doubles the Sharpe ratio. This error was invisible in 2015–2021 near-zero rate environment. At current rates, it dramatically inflates reported Sharpe.\n\nDetect: check whether a backtest states the risk-free rate. If it does not, assume it may be zero.\n\nFix: use the 3-month T-bill rate as rf. For long backtests spanning rate cycles, use time-varying monthly T-bill rates (available from FRED: DTB3). Never use a constant historical rf that doesn't match the backtest period.",
       misconception:"**Misconception: 'Higher Sharpe is always better'**\n\nSharpe can be manufactured by compressing volatility without generating genuine edge. A strategy that sells at-the-money index options collects premium (excess return) with low measured volatility — until a crash event wipes out years of gains. Pre-crash Sharpe ratios for such strategies routinely exceeded 2.0.\n\nEqually important: Sharpe does not capture absolute return magnitude. A market-neutral strategy with 2% net return and 1% volatility has Sharpe 2.0 — but is economically trivial and unscalable. A strategy with Sharpe 0.8 and 15% net CAGR at $100M AUM delivers far more economic value.\n\nAlways evaluate Sharpe alongside: absolute CAGR, maximum drawdown, Calmar ratio (CAGR / max drawdown), turnover costs, and strategy capacity.",
       yourTurn:"**Scenario**: Two strategies, 36-month backtest, rf = 4% annual:\n\nStrategy A: mean monthly return +1.0%, std 1.0%\nStrategy B: mean monthly return +1.8%, std 3.2%\nMarket benchmark: +0.9%/mo, std 3.8%\n\nCalculate annualized Sharpe for each. Which do you prefer, and what additional data do you need?\n\n**Answer**:\nrf monthly = (1.04)^(1/12)−1 = 0.327%\nA excess mean = 0.673%/mo → Sharpe = (0.673×12)/(1.0×√12) = 2.33\nB excess mean = 1.473%/mo → Sharpe = (1.473×12)/(3.2×√12) = 1.60\nMarket Sharpe = (0.573×12)/(3.8×√12) = 0.52\n\nStrategy A is better risk-adjusted. But you still need: drawdown (does A have autocorrelated returns masking hidden risk?), Lo autocorrelation check, and capacity analysis (2.33 Sharpe at $10M may be noise at $1B).",
       synthesis:"**Week 2, Lesson 2 — Key Takeaways**\n\n☑ Sharpe = (geometric excess return) / (annualized std of excess returns) — never arithmetic mean, never rf=0\n☑ Annualize correctly: multiply mean by T, std by √T\n☑ Sharpe ignores drawdown, tail risk, autocorrelation, capacity — always pair with drawdown metrics\n☑ Autocorrelated returns inflate Sharpe — apply Lo (2002) correction for illiquid strategies\n☑ With multiple tested variants, use Deflated Sharpe to account for selection bias\n\n**Next**: The lab builds your frozen equal-weight baseline with these exact metrics, locking in the benchmark before any optimization begins.",
       equation:"Sharpe = (R_p − R_f) / σ_p     |     Annualize: mean×T, std×√T     |     Lo adj: σ_true = σ×√(1+2ρ₁+...)"
      }
    ],
    quiz:{id:'w02-quiz', questions:[
      {id:'w02-q01', type:'scenario', scenario:"A $100 investment loses 50% in Year 1 then gains 100% in Year 2.", question:"What is the final value and the true CAGR?", options:['$150 / 22% CAGR','$100 / 0% CAGR','$200 / 41% CAGR','$75 / -13% CAGR'], correct:1, explanation:"$100 × 0.50 × 2.00 = $100. Despite a +100% gain, you only recovered to breakeven. The arithmetic average is +25% — the geometric (compound) result is 0%. Always use geometric compounding for CAGR."},
      {id:'w02-q02', type:'multiple_choice', question:"A strategy reports 18% annualized return with 30% annual volatility. Estimate the CAGR using the volatility drag approximation.", options:['18% (no adjustment needed)','~13.5%','~15%','~22%'], correct:1, explanation:"CAGR ≈ arithmetic mean − σ²/2 = 18% − (0.30)²/2 = 18% − 4.5% = 13.5%. The 4.5% annual drag is permanent and compounds across years. Never report arithmetic mean as CAGR for high-volatility strategies."},
      {id:'w02-q03', type:'multiple_choice', question:"You compute Sharpe with risk-free rate = 0 in a 5% T-bill environment. What is the direction and approximate magnitude of the bias?", options:['Sharpe understated by ~0.5×','Sharpe overstated — numerator inflated by 5% per year','No material bias since rf is small','Sharpe understated — risk premium must be added back'], correct:1, explanation:"With rf=0, excess return equals gross return instead of (gross − 5%). For a strategy earning 10% with 10% vol: true Sharpe = (10−5)/10 = 0.50, biased Sharpe = 10/10 = 1.00 — doubled by the omission. At current rate levels this is a material error."}
    ]},
    lab:{id:'w02-lab', objective:"Build the baseline portfolio and freeze metrics.", checks:[{id:'w02-c01',text:'Equal-weight portfolio constructed with log + arithmetic returns both computed'},{id:'w02-c02',text:'CAGR (geometric), Sharpe (with current T-bill rf), max drawdown computed and logged'},{id:'w02-c03',text:'Sharpe autocorrelation check: first-order autocorrelation of returns computed'},{id:'w02-c04',text:'Benchmark comparison table built and frozen with timestamp'},{id:'w02-c05',text:'Investment Policy v0.1 written: universe, benchmark, constraints, rules, and disconfirmation criteria'}], deliverable:"02_baseline_portfolio.ipynb + Investment Policy v0.1"},
    evidencePrompts:["Does equal-weight beat inflation over your sample period?","What does annual turnover cost the baseline?","How does Sharpe change when you use actual T-bill rates vs. rf=0?"]
  },

  wk3:{
    mission:{objective:"Reframe stock selection as a ranking problem. Build a model that orders stocks cross-sectionally and measure its quality via rank-IC — not price forecast accuracy.",output:"Model card with OOS rank-IC series, decile return spreads, and feature stability analysis.",failCondition:"Reporting only in-sample IC or optimizing the model after observing OOS results.",whatWouldChangeMind:"Consistent positive rank-IC out-of-sample across at least 3 independent subperiods."},
    whyItMatters:"Most ML tutorials minimize prediction error. Quantitative investing needs something different: can you rank stocks in the right order? A model directionally right about relative returns is economically valuable even when its absolute predictions are noisy.",
    lessons:[{id:'w03-l01', title:'Rank IC and Walk-Forward Evaluation', duration:'8 min', competency:'SIGNALS',
     content:"Information Coefficient (IC) = Spearman rank correlation between predicted rank and actual rank of forward returns. It is the central diagnostic for cross-sectional signal quality.\n\n**IC Interpretation Scale**\n• IC < 0.02: no economically meaningful signal\n• IC = 0.02–0.05: weak, possibly exploitable in large universes (500+ stocks)\n• IC = 0.05–0.10: meaningful signal, typical for factor models\n• IC > 0.10: strong signal — verify carefully for data leakage\n• IC < 0: the model anti-predicts (short it, or throw it away)\n\nIC is measured monthly (or at your rebalance frequency): each measurement is one observation from a single period. The IC time series — not any single value — is the diagnostic.\n\n**The IC Information Ratio (ICIR)**\nICIR = Mean(IC) / Std(IC)\n\nICIR > 0.5 indicates the signal is consistently directional. High mean IC with high volatility (ICIR < 0.3) means the signal works sometimes and fails randomly — hard to rely on.\n\n**Walk-Forward Evaluation Protocol**\nWalk-forward testing is the only valid evaluation method for time-series models. Never look at OOS data while selecting model parameters or features:\nPeriod 1 (train): 2015–2017 → predict Jan 2018\nPeriod 2 (train): 2015–2018 → predict Jan 2019\nPeriod 3 (train): 2015–2019 → predict Jan 2020\n\nEach prediction window must be completely independent. Even one OOS observation used for model selection contaminates the entire evaluation.",
     mechanics:"# Walk-Forward IC Evaluation\ndef walk_forward_ic(features_df, returns_df, train_start, oos_dates, freq='ME'):\n  \"\"\"features_df, returns_df: indexed by (date, ticker)\"\"\"\n  ic_series = []\n\n  for oos_date in oos_dates:\n    # 1. Define train window: all data strictly before oos_date\n    train_mask = features_df.index.get_level_values('date') < oos_date\n    X_train = features_df[train_mask]\n    y_train = returns_df[train_mask]\n\n    # 2. Fit model on train — no peeking at oos_date features\n    model = LightGBMRanker().fit(X_train, y_train)\n\n    # 3. Predict on oos_date cross-section\n    X_oos = features_df.xs(oos_date, level='date')\n    pred_ranks = model.predict(X_oos)\n\n    # 4. Compute IC: Spearman correlation of predicted vs actual ranks\n    actual_fwd_rets = returns_df.xs(oos_date + pd.DateOffset(months=1), level='date')\n    ic = spearmanr(pred_ranks, actual_fwd_rets.values)[0]\n    ic_series.append({'date': oos_date, 'ic': ic})\n\n  ic_df = pd.DataFrame(ic_series).set_index('date')\n  return ic_df, ic_df.mean()[0], ic_df.mean()[0]/ic_df.std()[0]  # IC, mean_IC, ICIR",
     intuition:"You do not need to know a stock will go up exactly 12.3%. You only need to rank it above 60% of its peers. Ranking is a fundamentally more tractable problem than precise return forecasting — and it is the problem that actually translates into portfolio returns.\n\nThink of it this way: a sports ranking system does not need to predict scores. It just needs to be right about relative quality most of the time. A cross-sectional ranker that is directionally correct 55% of the time consistently outperforms, because over hundreds of stock-months, that edge compounds into real return spreads between your long book and your short book.",
     example:"**IC Calculation — One Month**\n\nUniverse: 5 stocks (simplified for clarity)\nModel predicted ranks (1=worst, 5=best): [2, 4, 1, 5, 3]\nActual forward return ranks: [3, 5, 1, 4, 2]\n\nSpearman: ρ = 1 − 6Σd²/(n(n²−1))\nd² values: (2-3)²=1, (4-5)²=1, (1-1)²=0, (5-4)²=1, (3-2)²=1 → Σd² = 4\nIC = 1 − 6×4/(5×24) = 1 − 24/120 = 1 − 0.20 = 0.80 ← one period, too small to mean anything\n\nReal example: 200-stock universe, 24 OOS months\nMean IC = 0.063, Std IC = 0.048, ICIR = 0.063/0.048 = 1.31 ← strong, consistent signal\nTop decile avg return: +2.8%/mo, Bottom decile: −1.4%/mo, Spread: 4.2%/mo",
     subtleVersion:"**IC Decay and Feature Staleness**\n\nIC measured at a 1-month horizon captures the signal at that frequency. Many fundamental signals decay quickly — the IC measured at a 3-month horizon is lower than at 1 month. Decay rate characterizes how long a signal remains useful.\n\nIf IC decays to zero within 2 months, you need monthly rebalancing to capture it. If IC holds for 6 months, quarterly rebalancing suffices. Always plot IC vs. horizon (1, 2, 3, 6, 12 months) — rapid decay means high turnover cost.\n\n**Conditional IC and Regime Dependence**\nA signal with mean IC = 0.06 across all regimes may have IC = 0.11 in trending markets and IC = −0.01 in reverting markets. Conditional IC analysis separates signal quality from regime luck. A model with strong conditional IC in only one regime is not robust — it is a regime bet disguised as an alpha model.",
     warning:"**Trap: Optimizing After Observing OOS IC**\n\nTrap: Checking OOS results, adding or removing features, then re-running the 'OOS' evaluation — and reporting the improved numbers as genuine out-of-sample performance.\n\nWhy it is fatal: any model modification after observing OOS results contaminates those results. The OOS window becomes in-sample. You are now fitting to two datasets instead of one, and calling the second one 'OOS.'\n\nSymptom: research showing suspiciously stable OOS IC that never has a losing year; or OOS evaluation that began only after finding interesting signals.\n\nDetect it: require a timestamped commit of model specification before any OOS data is examined. Code frozen before evaluation, results computed once.\n\nFix: walk-forward protocol must be fully automated. No human-in-the-loop decisions after train window closes.",
     misconception:"**Misconception: 'IC of 0.05 is too low to be useful'**\n\nResearchers trained on ML benchmarks expect R² > 0.90 or F1 > 0.85. An IC of 0.05 looks trivially small by comparison. But quantitative finance is a different problem domain.\n\nIn a 500-stock universe with monthly rebalancing, consistent IC = 0.05 translates into top-decile spreads of 1–3% per month over the long run — substantial economic value. The Fundamental Law of Active Management formalizes this: information ratio ≈ IC × √(number of independent bets). With 12 monthly bets per year across 500 stocks, even IC = 0.05 generates a healthy information ratio.\n\nDo not dismiss small IC. Do verify it is genuine (ICIR > 0.5, consistent across periods) rather than noisy.",
     yourTurn:"**Scenario**: You run a 3-year walk-forward evaluation:\n\nYear 1 OOS: IC = 0.08\nYear 2 OOS: IC = −0.04\nYear 3 OOS: IC = 0.09\n\nMean IC = 0.043, ICIR = 0.043/0.065 = 0.66\n\n1. Is this a tradeable signal? What is your concern?\n2. What would you investigate about Year 2?\n3. What would strengthen your conviction before trading?\n\n**Answer**:\n1. ICIR 0.66 is borderline — marginal. The Year 2 failure is the concern: one negative year out of three suggests regime sensitivity rather than genuine robustness.\n2. Year 2 regime: Was it a strong momentum/mean-reversion market that penalizes your signal type? Check if other factors also failed in Year 2 (common factor risk) or if your signal alone failed (model-specific risk).\n3. More OOS periods (5+ years), subperiod analysis, and understanding why Year 2 failed mechanically.",
     synthesis:"**Week 3 — Key Takeaways**\n\n☑ IC = Spearman rank correlation between predicted and actual return ranks — not prediction error\n☑ ICIR = mean(IC)/std(IC) > 0.5 indicates consistent directional signal\n☑ Walk-forward is the only valid evaluation protocol — no model changes after OOS data is observed\n☑ IC of 0.05 can be economically valuable in large universes — do not dismiss small values\n☑ IC decay analysis reveals required rebalance frequency and true signal shelf life\n\n**Next**: Week 4 attacks your best result systematically — testing every assumption that could be wrong before you trust a single backtest number.",
     equation:"IC = Spearman(predicted_ranks, rank(forward_returns))     |     ICIR = mean(IC)/std(IC)"
    }],
    quiz:{id:'w03-quiz', questions:[
      {id:'w03-q01', type:'multiple_choice', question:"A model has IS IC=0.09 and OOS IC=-0.02. What does this indicate?", options:['Strong signal — IS IC above 0.05 is excellent','Likely overfitting — positive IS IC does not generalize','Survivorship bias in the universe','Normal variance — difference is within statistical noise'], correct:1, explanation:"A large positive IS IC with a negative OOS IC is a classic overfitting signature. The model learned the historical sample but the signal does not generalize. The gap is the red flag, not the absolute values."},
      {id:'w03-q02', type:'multiple_choice', question:"What does ICIR (IC Information Ratio) measure, and what threshold suggests a tradeable signal?", options:['IC scaled by universe size — threshold > 0.01','Consistency of IC over time (mean/std) — ICIR > 0.5 suggests consistent signal','IC measured at different horizons — threshold > 1.0','IC adjusted for transaction costs — threshold > 0.03'], correct:1, explanation:"ICIR = mean(IC)/std(IC) measures consistency. A high mean IC with equally high volatility means the signal is unreliable — it works sometimes and fails other times. ICIR > 0.5 indicates that positive IC is not just lucky noise, but a consistent directional signal across periods."},
      {id:'w03-q03', type:'scenario', scenario:"You check OOS results, notice IC is low in months with high volatility, add a volatility filter, and re-run the 'OOS' evaluation showing improved IC.", question:"What is the problem with this evaluation?", options:['The filter is too complex','The OOS evaluation is contaminated — it became IS by using observed OOS results to guide feature selection','Volatility is not a valid feature','The filter should have been applied to training data only'], correct:1, explanation:"Any model modification after observing OOS results converts those results from OOS to IS. The evaluation is no longer genuinely out-of-sample. Walk-forward OOS must be computed exactly once, from a frozen model specification, before any OOS data is examined."}
    ]},
    lab:{id:'w03-lab', objective:"Build and evaluate a walk-forward cross-sectional ranker.", checks:[{id:'w03-c01',text:'All features computed and lagged (no future information used — verified with available_at timestamps)'},{id:'w03-c02',text:'Walk-forward splits defined with no overlap between train and test windows'},{id:'w03-c03',text:'IC and ICIR calculated for each independent OOS period'},{id:'w03-c04',text:'Simple linear baseline implemented as comparison (not just ML)'},{id:'w03-c05',text:'IC decay curve plotted at 1, 2, 3, 6-month horizons'}], deliverable:"03_cross_sectional_ranker.ipynb with OOS IC series and ICIR"},
    evidencePrompts:["Is IC consistent across all OOS periods, or driven by one regime?","Does ML significantly outperform a simple linear ranking?","What is the IC decay rate and what does it imply for rebalance frequency?"]
  },

  wk4:{
    mission:{objective:"Systematically destroy your best backtest. Find every assumption that could be wrong. Boss Fight: receive a contaminated strategy and diagnose exactly why it is wrong.",output:"Signed leakage and robustness report detailing every vulnerability found in your Week 3 strategy.",failCondition:"Concluding a backtest is robust without testing parameter sensitivity, subperiod stability, and cost sensitivity.",whatWouldChangeMind:"A strategy that maintains meaningful performance across all dimensions of the specification multiverse."},
    whyItMatters:"The purpose of a backtest is not to prove a strategy works. It is to find every reason it might not work. A researcher who cannot attack their own backtest will be attacked by the market instead.",
    lessons:[{id:'w04-l01', title:'The Specification Multiverse', duration:'9 min', competency:'BACKTESTING',
     content:"A specification multiverse runs your strategy across all plausible implementation variants — not just the one you happened to choose. The goal is to characterize the distribution of outcomes across the parameter space, not to find the best outcome.\n\n**Dimensions to Test**\n• Lookback periods: 3mo, 6mo, 9mo, 12mo, 18mo\n• Rebalance frequencies: weekly, monthly, quarterly\n• Universe sizes: top 50, 100, 200, 500 stocks\n• Cost assumptions: 0 bps, 10 bps, 20 bps, 50 bps round-trip\n• Signal formation windows × holding periods\n• Winsorization thresholds for outlier handling\n\n**The Distribution, Not the Maximum**\nFor a multiverse of N combinations, what matters is the distribution of Sharpe ratios:\n• Median Sharpe: your realistic expectation (selection-bias-adjusted)\n• 10th percentile Sharpe: your bad-luck scenario\n• Gap between best and median: your data-snooping exposure\n\nIf Median Sharpe is 0.4 and Best Sharpe is 2.1, reporting 2.1 overstates expected forward performance by 4× or more.\n\n**Subperiod Stability**\nDivide your sample into thirds. If the strategy only works in one third, it is not robust — it is a regime bet. Robust strategies should have positive Sharpe in at least 2 of 3 subperiods even if magnitude varies.",
     mechanics:"# Specification Multiverse Runner\nimport itertools\n\ndef run_multiverse(signal_fn, returns_df, param_grid):\n  results = []\n\n  for params in itertools.product(*param_grid.values()):\n    p = dict(zip(param_grid.keys(), params))\n\n    # 1. Compute signal with this parameter set\n    signals = signal_fn(returns_df, **p)\n\n    # 2. Run backtest (no optimization in here)\n    bt = backtest(signals, returns_df,\n                  costs_bps=p['costs_bps'],\n                  rebalance_freq=p['rebalance_freq'])\n\n    # 3. Record key metrics\n    results.append({\n      'params': p,\n      'sharpe': bt.sharpe,\n      'cagr': bt.cagr,\n      'max_dd': bt.max_drawdown,\n      'subperiod_sharpes': bt.subperiod_sharpes  # list of 3\n    })\n\n  df = pd.DataFrame(results)\n  return {\n    'median_sharpe': df.sharpe.median(),\n    'best_sharpe': df.sharpe.max(),\n    'p10_sharpe': df.sharpe.quantile(0.1),\n    'pct_positive': (df.sharpe > 0).mean(),\n    'full_results': df\n  }",
     intuition:"If a map is only accurate in one specific town, it is not a useful map. A strategy that only works at exactly 12-month lookback, monthly rebalance, at exactly 0 bps costs is not a useful strategy — it is an overfitted artifact that happens to look impressive in one corner of parameter space.\n\nThe specification multiverse forces you to confront this directly. If the median outcome across 100 reasonable implementations is a Sharpe of 0.4, then 0.4 is your honest estimate — not the 2.1 you found after searching. Every parameter choice you made that wasn't theoretically motivated in advance is a trial in the multiverse that should count against you.",
     example:"**Multiverse of 96 Combinations: Reading the Distribution**\n\n4 lookbacks × 4 rebalance freqs × 6 cost levels = 96 combinations\n\nDistribution of Sharpe ratios:\nBest: 2.1  (12-month lookback, weekly, 0 bps)\nMedian: 0.43\nP10 worst: −0.18\nPct combinations with Sharpe > 1.0: 11% (11 out of 96)\nPct combinations with positive Sharpe: 62%\n\nAt 20 bps costs (realistic for most strategies):\nMedian Sharpe drops to 0.21\nPct positive drops to 44%\n\nHonest interpretation: the strategy barely beats random at realistic costs. The 2.1 Sharpe was a lucky corner — not the expected outcome.",
     subtleVersion:"**The Deflated Sharpe and Multiple Testing**\n\nHarvey, Liu & Zhu (2016) documented that roughly half of published factor strategies fail to survive out-of-sample. Their proposed t-stat threshold for a 'new' factor rises from 2.0 to 3.0+ once you account for the multiple comparisons problem across all published strategies.\n\nFor your own research: if you tested N strategy variants, the expected maximum Sharpe from random chance is approximately √(2 × ln(N)). With N=96 combinations, E[max SR from noise] ≈ √(2 × ln 96) = √9.1 ≈ 3.0 for a single asset with 36 monthly observations. This is why a Sharpe of 2.1 from a 96-combination multiverse is not impressive — it barely exceeds noise.\n\nThe Deflated Sharpe Ratio (Bailey & López de Prado, 2012) formalizes this adjustment. Always report DSR alongside raw Sharpe when testing multiple variants.",
     warning:"**Trap: The Best-Parameter Selection Bias**\n\nTrap: Testing N parameter combinations, selecting the best-performing combination, and reporting that combination's Sharpe as the strategy's expected performance.\n\nWhy it is dangerous: with enough combinations, you will find a lucky configuration even if the strategy has zero edge. The best result from 100 trials of a random strategy has positive Sharpe by construction — you are selecting a winner from noise.\n\nSymptom: strategy performance is highly sensitive to exact parameter values — a 1-month change in lookback drops Sharpe from 2.1 to 0.3. This sensitivity fingerprints overfitting.\n\nDetect: run the multiverse. If best >> median, you have snooping exposure proportional to the gap.\n\nFix: pre-specify parameters before evaluation using theory or prior literature. Report median and distribution, not just best. If selecting a parameter set based on performance, apply the Deflated Sharpe correction.",
     misconception:"**Misconception: 'Testing more combinations produces more evidence'**\n\nMore combinations tested produces more data snooping risk, not more evidence. The more combinations you test, the higher the probability that your best result is a statistical artifact.\n\nThe correct interpretation: a strategy found after testing 1,000 combinations requires much stronger OOS evidence than a strategy with a single pre-specified parameter set. The pre-specified strategy's OOS test is clean evidence. The post-search strategy's 'OOS' test needs to be genuinely held-out — not just the last slice of data you looked at least carefully.\n\nIf you must search over parameters, reserve a true holdout period that was never examined during any part of the search process. This requires real discipline — it means you cannot look at holdout performance at all until the strategy specification is completely frozen.",
     yourTurn:"**Scenario**: Your multiverse results:\n• Best Sharpe (9-month lookback, monthly, 0 bps): 1.8\n• Median Sharpe (all 96 combos): 0.38\n• Median Sharpe at 20 bps costs: 0.12\n• Subperiod analysis: Period 1 Sharpe +0.9, Period 2 +0.1, Period 3 +0.7\n\n1. Should you trade this strategy? What is your honest Sharpe estimate?\n2. What does the subperiod analysis reveal?\n3. What would you do next before committing capital?\n\n**Answer**:\n1. Honest estimate is the median at realistic costs: 0.12. The 1.8 is a lucky parameter corner, not the expected outcome. Do not trade this strategy based on current evidence.\n2. Period 2 near-zero suggests regime sensitivity — the strategy failed in one of three subperiods, possibly during a different market regime (e.g., a mean-reverting period for a momentum signal).\n3. Investigate Period 2 specifically. If you can explain why the signal should fail in that regime (mechanistically), that is evidence. If you cannot explain it, the strategy may just be a regime bet.",
     synthesis:"**Week 4 — Key Takeaways**\n\n☑ Report median Sharpe across the multiverse, not best — the gap between best and median reveals data-snooping exposure\n☑ Subperiod stability: robust strategies have positive Sharpe in at least 2 of 3 subperiods\n☑ Costs at realistic levels (20+ bps) often cut median Sharpe to near zero — always test with costs\n☑ More parameter combinations = more snooping risk, not more evidence\n☑ Pre-specify parameters using theory; compute performance exactly once on OOS data\n\n**Next**: Phase 2 begins — Week 5 builds the data infrastructure that makes all future signals trustworthy from day one.",
     equation:"E[Forward Sharpe] ≤ Median[Backtest Sharpe across multiverse]     |     DSR adjusts for N tested variants"
    }],
    quiz:{id:'w04-quiz', questions:[
      {id:'w04-q01', type:'scenario', scenario:"You test 96 parameter combinations. Best Sharpe: 2.1. Median Sharpe: 0.4. You report the best combination.", question:"What is the primary concern?", options:['Median Sharpe 0.4 is too low to be useful','The gap suggests data snooping — the reported result overstates expected forward performance','Too few combinations were tested','Nothing — always report the best result'], correct:1, explanation:"The gap between best (2.1) and median (0.4) across 96 combinations is a classic data-snooping signature. With many combinations, finding one that looks excellent by chance is highly likely. The reported 2.1 dramatically overstates expected forward performance."},
      {id:'w04-q02', type:'multiple_choice', question:"A strategy has Sharpe 1.6 at 0 bps costs and Sharpe 0.1 at 20 bps costs. What does this reveal?", options:['The strategy needs leverage to overcome costs','The economic value of the strategy is minimal — turnover destroys the edge at realistic cost levels','20 bps is too high an assumption','The strategy should use options instead of stock positions'], correct:1, explanation:"If realistic trading costs (20 bps per round-trip is conservative for most execution environments) reduce Sharpe from 1.6 to 0.1, the signal exists only in a frictionless world. A strategy with no net-of-cost edge is not a strategy."},
      {id:'w04-q03', type:'multiple_choice', question:"Strategy Sharpe in three equal subperiods: +0.8, +0.9, −0.6. What is your primary concern?", options:['Sample period is too short','The negative third-period Sharpe suggests regime sensitivity or deteriorating signal','The average Sharpe is still positive so this is acceptable','The first two periods must have a data error'], correct:1, explanation:"One out of three subperiods with negative Sharpe (-0.6) is a significant red flag. Either the signal is regime-dependent (works in trending markets, fails in mean-reverting ones) or it has deteriorated over time. You need to understand why before trusting the average."}
    ]},
    lab:{id:'w04-lab', objective:"Run a specification multiverse and robustness audit on your Week 3 ranker.", checks:[{id:'w04-c01',text:'Parameter sensitivity tested across ≥3 alternatives per major parameter (lookback, frequency, costs)'},{id:'w04-c02',text:'Subperiod analysis: performance in each third of sample period documented'},{id:'w04-c03',text:'Cost sensitivity at 0, 10, 20, and 50 bps round-trip computed'},{id:'w04-c04',text:'Leakage audit: all features re-verified with available_at timestamps'},{id:'w04-c05',text:'Boss Fight: contaminated strategy received, flaw diagnosed, and write-up signed'}], deliverable:"04_backtest_audit.ipynb + signed robustness report"},
    evidencePrompts:["What is worst-case performance under stressed parameters?","Does the strategy survive using median parameters instead of the best?","What did the Boss Fight teach you about contamination detection?"]
  },

  wk5:{
    mission:{objective:"Build an immutable filing warehouse that allows querying any company's financials as of any historical date without ever using future information.",output:"10-company immutable filing store with change-detection comparing current vs. prior filings.",failCondition:"Treating fiscal period end date as data availability date for any XBRL fact.",whatWouldChangeMind:"A clear, verifiable mapping from SEC accession number to exact availability date for every document."},
    whyItMatters:"SEC EDGAR is one of the richest free data sources in quantitative research. Companies must file standardized statements with mandatory timing rules. The filing metadata tells you exactly when information became public.",
    lessons:[{id:'w05-l01', title:'EDGAR Architecture and the Availability Rule', duration:'8 min', competency:'DATA',
     content:"SEC EDGAR is a timestamped public ledger of every material corporate disclosure since 1993. It is the closest thing to a free, legally certified point-in-time financial database available to individual researchers.\n\n**Filing Types and What They Contain**\n• 10-K: Annual report — full audited financials, risk factors, business description\n• 10-Q: Quarterly report — unaudited interim financials (3 per year, Q1/Q2/Q3)\n• 8-K: Material event — earnings announcements, M&A disclosures, leadership changes\n• DEF 14A: Proxy — executive compensation, governance, shareholder proposals\n\n**The Availability Rule — The Most Important Concept**\nFiling deadline from fiscal period end:\n• Large accelerated filer 10-K: 60 days\n• Accelerated filer 10-K: 75 days\n• Non-accelerated filer 10-K: 90 days\n• All filers 10-Q: 40–45 days\n\nThe fiscal period end date (e.g., December 31) is NOT the availability date. December 31 financials are not public until the filing is accepted by the SEC — typically late February or early March. Any model that uses December 31 numbers on January 1 has traveled back in time.\n\n**API Access**\n• Submissions: data.sec.gov/submissions/CIK{cik}.json — filing history per company\n• Company Facts: data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json — all XBRL financials\n• Full-text search: efts.sec.gov/LATEST/search-index?q=...&dateRange=custom\n• Rate limit: 10 requests/second — always include User-Agent header with your contact email",
     mechanics:"# EDGAR PIT Data Pipeline\nimport requests, json, time\n\nBASE = 'https://data.sec.gov'\nHEADERS = {'User-Agent': 'YourName contact@email.com'}  # required by EDGAR\n\ndef get_filings(cik, form_types=['10-K','10-Q']):\n  # 1. Get submission history\n  url = f'{BASE}/submissions/CIK{str(cik).zfill(10)}.json'\n  resp = requests.get(url, headers=HEADERS); time.sleep(0.1)\n  data = resp.json()\n\n  filings = data['filings']['recent']\n  results = []\n  for i, form in enumerate(filings['form']):\n    if form in form_types:\n      results.append({\n        'accession': filings['accessionNumber'][i],\n        'form': form,\n        'fiscal_end': filings['reportDate'][i],  # period end — DO NOT USE as available_at\n        'filed': filings['filingDate'][i],        # SEC receipt — this is available_at\n      })\n  return results\n\ndef get_xbrl_facts(cik, concept='Revenues'):\n  # 2. Get XBRL facts — each fact has 'end' (period) and 'filed' (availability)\n  url = f'{BASE}/api/xbrl/companyfacts/CIK{str(cik).zfill(10)}.json'\n  data = requests.get(url, headers=HEADERS).json()\n  facts = data['facts']['us-gaap'].get(concept, {}).get('units', {}).get('USD', [])\n\n  # 3. Build PIT record — available_at = filed date, NOT end date\n  return [{'value': f['val'], 'period_end': f['end'],\n           'available_at': f['filed'], 'accession': f['accn']} for f in facts]",
     intuition:"EDGAR is a timestamped public record — think of it as the official postmark system for corporate financial disclosure. Every document has a filed date that represents the legal moment it became accessible to the public.\n\nThe crucial distinction: fiscal period end (December 31) tells you when the accounting period closed. Filing date (February 28) tells you when the world learned about it. Using the wrong date means your model is operating with information the market did not have — a legal impossibility in real trading. If your model consistently earns returns that could only be achieved with advance knowledge of financial statements, the backtest is fraudulent in the statistical sense: it measures an information advantage that never existed.",
     example:"**Apple Q4 FY2022 — Availability Timeline**\n\nFiscal year end: September 24, 2022 (Apple's FY ends in late September)\nSEC filing date: October 28, 2022 (10-K submitted)\nEDGAR acceptance: October 28, 2022 (same day for electronic filings)\nAvailable_at: 2022-10-28\n\nXBRL fact for Net Sales:\n  'val': 394328000000 (=$394.3B)\n  'end': '2022-09-24'  ← fiscal period end — DO NOT USE\n  'filed': '2022-10-28' ← this is available_at\n  'accn': '0000320193-22-000108'\n\nA model using September 24 numbers on September 25 has a 33-day look-ahead.\nA model using October 28 numbers on October 29 is honest.\n\nAvg lag for S&P 500 large-cap 10-K: ~45 days from fiscal year end to SEC filing.",
     subtleVersion:"**Amended Filings and Restated Financials**\n\nCompanies sometimes amend filings (10-K/A, 10-Q/A) to correct errors. EDGAR records both the original and the amendment. For PIT research, the original filing is available_at = original_filed_date. The amendment is available_at = amendment_filed_date. Queries for a historical date T should use whichever version was available as of T.\n\nThis creates the 'vintage' problem from Week 1: the number for Q4 2020 revenue may be different in the original 10-K (filed March 2021) versus the 10-K/A amendment (filed July 2021). A properly constructed warehouse stores both vintages with their respective availability dates and returns the correct vintage for any query date.\n\n**XBRL Taxonomy Drift**: XBRL concept names change across years. 'Revenues' in 2015 filings may be 'RevenueFromContractWithCustomerExcludingAssessedTax' in 2020 filings due to ASC 606. Your pipeline must handle concept aliases.",
     warning:"**Trap: Using 'period.end' as available_at in XBRL Data**\n\nTrap: Treating the XBRL 'end' date (fiscal period end) as the date the information became available — and filtering data by 'end <= query_date'.\n\nWhy it is fatal: fiscal year-end December 31 financials are published in February or March. A model filtered by 'end <= 2023-01-15' includes Q4 2022 data that was not available until February 2023. Every signal computed from such a model has ~6 weeks of forward-looking contamination.\n\nSymptom: suspiciously good performance in January (before 10-Q/10-K filings), or strategies that seem to anticipate earnings. Detection: sort XBRL facts by 'end' date vs. 'filed' date — the gap is the contamination window.\n\nFix: always filter by 'filed' <= query_date, never by 'end' <= query_date. Store both dates; use 'filed' for PIT queries.",
     misconception:"**Misconception: 'EDGAR is too slow/complex for research use'**\n\nMany researchers avoid EDGAR's raw API due to rate limits and JSON complexity, and instead pay for vendor-normalized fundamental data. This is a valid operational choice — but it shifts the point-in-time problem to the vendor.\n\nCommercial vendors also make availability-date errors. Compustat and Bloomberg both have documented cases where restated financials were retroactively applied to historical dates, contaminating historical backtests. If you cannot audit a vendor's availability_at timestamps against EDGAR filing dates for a sample of companies, you cannot verify the vendor's data is PIT-clean.\n\nEDGAR gives you the ground truth — the legal filing date is unambiguous. Use it to audit any commercial dataset by spot-checking 10-20 companies across the historical period.",
     yourTurn:"**Scenario**: You query your financial database for all companies' revenue data as of 2023-01-15. Your database returns Q3 2022 earnings (fiscal period Oct–Dec 2022 for calendar-year companies) with dates showing '2022-12-31' as the data date.\n\n1. Is this a PIT violation? Explain the mechanism.\n2. What data should actually be available on 2023-01-15 for a December-fiscal-year company?\n3. How would you fix the database query?\n\n**Answer**:\n1. Yes — critical PIT violation. Q4 2022 (fiscal end Dec 31) 10-K filings are not accepted by EDGAR until February–March 2023. Using them on January 15, 2023 requires knowledge of financials not yet public.\n2. Q3 2022 (fiscal end September 30, 2022), filed ~November 2022, is the correct latest-available quarterly data on January 15, 2023.\n3. Filter by filed_date <= '2023-01-15' instead of period_end <= '2023-01-15'. Return the row with the latest filed_date that is still ≤ query_date.",
     synthesis:"**Week 5 — Key Takeaways**\n\n☑ available_at = SEC filing date ('filed' in EDGAR), NOT fiscal period end ('end')\n☑ 10-K filing lag: 60–90 days from fiscal year end — using December 31 numbers in January is a time machine\n☑ Store both period_end and filed_date; always query by filed_date\n☑ Amended filings create 'vintages' — PIT-correct databases store each vintage with its own available_at\n☑ Audit any commercial dataset against EDGAR filing dates for at least 20 companies\n\n**Next**: With filing data properly timestamped, Week 6 builds the retrieval system that lets you ask natural-language research questions and get evidence-grounded answers.",
     equation:"available_at = filing_date (from EDGAR submissions JSON 'filingDate' field)"
    }],
    quiz:{id:'w05-quiz', questions:[
      {id:'w05-q01', type:'multiple_choice', question:"An XBRL fact shows 'end: 2022-12-31' and 'filed: 2023-03-02'. What is the correct available_at for a PIT query on 2023-01-15?", options:['2022-12-31 — use this fact','2023-03-02 — but the fact is not yet available on Jan 15','2023-01-15 — use today as available_at','The midpoint: 2023-01-16'], correct:1, explanation:"2023-03-02 is when the SEC received the filing. On January 15, 2023, this fact is NOT yet available — the filing has not been submitted. The correct behavior is to exclude this fact from any query dated before 2023-03-02."},
      {id:'w05-q02', type:'multiple_choice', question:"A company's fiscal year ends December 31. It is a 'large accelerated filer.' Approximately when will its 10-K be filed?", options:['January 1 — immediately after year-end','Late February (60 days from Dec 31)','April 15 (IRS deadline)','December 31 itself'], correct:1, explanation:"Large accelerated filers must file 10-K within 60 days of fiscal year-end. December 31 + 60 days ≈ late February. This means Q4 annual figures are not publicly available until late February at the earliest — any model using them before that date has forward-looking contamination."},
      {id:'w05-q03', type:'scenario', scenario:"A vendor claims their financial database is 'point-in-time clean' for all data back to 2010.", question:"How would you audit this claim for a sample of 20 companies?", options:['Take the vendor at their word — they have legal liability','Check 10-20 company/quarter pairs: compare the vendor available_at to the actual EDGAR filing date for that accession number','Run a backtest and see if returns look too good','Ask the vendor for their methodology document'], correct:1, explanation:"The only rigorous verification is to spot-check vendor available_at dates against the actual EDGAR filing dates (from the submissions JSON). If a vendor marks October 1 as available_at for a December fiscal-year Q3 filing (which wouldn't be filed until November), the database has contamination. Methodological documents are not a substitute for empirical verification."}
    ]},
    lab:{id:'w05-lab', objective:"Build an immutable SEC EDGAR filing warehouse.", checks:[{id:'w05-c01',text:'Submissions API queried for all universe companies with proper User-Agent header'},{id:'w05-c02',text:'10-K and 10-Q filings catalogued: fiscal_period_end, filing_date, accession_number — all three stored'},{id:'w05-c03',text:'XBRL facts extracted with available_at = filing_date (not period end)'},{id:'w05-c04',text:'Change detection: current vs. prior filing text comparison built (TF-IDF or embedding-based)'},{id:'w05-c05',text:'Raw store is append-only: new downloads append, nothing overwritten — immutability enforced'}], deliverable:"05_edgar_pipeline.ipynb + filing warehouse + change-detection report"},
    evidencePrompts:["What is the average lag between fiscal year-end and 10-K filing for your companies?","Are there irregular filing patterns in any company's history?","How many amended filings (10-K/A, 10-Q/A) exist in your sample, and how does that affect your PIT query logic?"]
  },

  wk6:{
    mission:{objective:"Build and evaluate a retrieval system that answers research questions about filings. Prove it works quantitatively against manually verified ground truth.",output:"RAG pipeline with Recall@k evaluation report and evidence-grounded Q&A tool.",failCondition:"Claiming the system works without a quantified retrieval evaluation against human-labeled questions.",whatWouldChangeMind:"Recall@5 > 0.80 on ≥25 manually verified research questions."},
    whyItMatters:"Language models that read filings without retrieval evaluation are unaudited systems. You cannot trust an AI analyst that cannot demonstrate it finds the right evidence.",
    lessons:[{id:'w06-l01', title:'RAG: From Fluency to Evidence', duration:'9 min', competency:'RESEARCH',
     content:"Retrieval-Augmented Generation forces a language model to answer only from documents you supply — with mandatory citation to the source chunk. This constraint is the most important property of a trustworthy AI research system.\n\n**The Standard RAG Pipeline**\n1. Chunk: divide filing text into ~400–600 token passages, preserving section headers as metadata\n2. Embed: encode each chunk with a text embedding model (e.g., text-embedding-3-small)\n3. Index: store embeddings in a vector database (FAISS, ChromaDB, Pinecone)\n4. Query: embed the research question; retrieve top-k chunks by cosine similarity\n5. Generate: pass retrieved chunks as context; LLM answers from this context only\n6. Cite: every factual claim must reference chunk_id, accession, and section\n\n**Why Evaluation is Non-Optional**\nRAG systems can fail in two independent ways:\n1. Retrieval fails: the correct chunk is not in the top-k results → LLM has no evidence to cite\n2. Generation fails: retrieval succeeds but LLM ignores the retrieved chunk and produces a hallucinated answer\n\nRecall@k measures failure mode 1: does the right evidence reach the LLM?\nRecall@k = |{questions where correct chunk ∈ top-k results}| / |all questions|\n\nFor financial research systems, Recall@5 > 0.75 is a baseline requirement. Below 0.75, your LLM is generating answers without consistent access to the relevant evidence.\n\n**Grounding Protocol**\nFor every LLM-generated claim, the output schema must include 'evidence_ids' field listing the chunk IDs that support the claim. Empty evidence_ids = rejected claim. This is not optional — it is what separates an auditable AI analyst from a confident text generator.",
     mechanics:"# RAG Pipeline: Build and Evaluate\nfrom sentence_transformers import SentenceTransformer\nimport faiss, numpy as np\n\n# 1. CHUNKING\ndef chunk_filing(text, accession, section, chunk_size=500):\n  words = text.split()\n  chunks = []\n  for i in range(0, len(words), chunk_size):\n    chunk_text = ' '.join(words[i:i+chunk_size])\n    chunks.append({'text': chunk_text,\n                   'chunk_id': f'{accession}-{section}-{i//chunk_size}',\n                   'accession': accession, 'section': section})\n  return chunks\n\n# 2. EMBEDDING + INDEXING\nmodel = SentenceTransformer('all-MiniLM-L6-v2')\ndef build_index(chunks):\n  texts = [c['text'] for c in chunks]\n  embeddings = model.encode(texts, normalize_embeddings=True)\n  index = faiss.IndexFlatIP(embeddings.shape[1])  # inner product = cosine for normalized vecs\n  index.add(embeddings)\n  return index, embeddings\n\n# 3. RETRIEVAL EVALUATION (Recall@k)\ndef eval_recall(questions, correct_chunk_ids, index, chunks, k=5):\n  hits = 0\n  for question, correct_id in zip(questions, correct_chunk_ids):\n    q_embed = model.encode([question], normalize_embeddings=True)\n    _, top_idx = index.search(q_embed, k)\n    retrieved_ids = [chunks[i]['chunk_id'] for i in top_idx[0]]\n    if correct_id in retrieved_ids:\n      hits += 1\n  return hits / len(questions)  # Recall@k",
     intuition:"A language model without retrieval is like a lawyer who memorized thousands of legal textbooks but cannot open the actual brief when arguing a case. They can produce fluent, convincing arguments that are completely wrong. RAG forces the model to open the brief — and then mandates a citation to the specific paragraph.\n\nThe citation requirement is the key safeguard. Without it, you cannot distinguish between an LLM that found the right evidence and one that generated a plausible-sounding answer from training data. In financial research, training data includes years of analyst reports, earnings summaries, and news articles — a model can reproduce confident financial analysis about any large company without ever consulting the actual filing. Mandatory chunk citations expose this immediately: if the claimed evidence is not in the cited chunks, the claim is fabricated.",
     example:"**Retrieval Success vs. Failure: Same Question, Different Outcomes**\n\nQuestion: 'What did Apple disclose about China revenue concentration risk in FY2022 10-K?'\n\nRETRIEVAL FAILURE (Recall@5 miss):\nTop-5 chunks: Q1 earnings call transcript, 2019 annual report risk factors, news article, analyst report summary, 2022 Q2 10-Q\nChunk with actual FY2022 10-K risk factor language: not retrieved\nResult: LLM generates plausible answer from training data — may be accurate by luck, but is unverifiable\n\nRETRIEVAL SUCCESS:\nTop-1 chunk: 0000320193-22-000108 / Risk Factors / chunk_47\nActual text: 'A significant portion of our net sales are made to customers in China...'\nLLM answer: 'Apple disclosed that a significant portion of net sales are made to China-based customers, citing geographic concentration as a material risk [chunk_id: 0000320193-22-000108-RiskFactors-47].'\nVerifiable: open EDGAR filing, navigate to Risk Factors, find the exact paragraph.",
     subtleVersion:"**Chunking Strategy Matters More Than Embedding Model**\n\nMost RAG tutorials spend effort on embedding model selection. In practice, chunking strategy has larger impact on Recall@k for structured documents like 10-K filings.\n\n10-K filings have natural section boundaries: Item 1 (Business), Item 1A (Risk Factors), Item 7 (MD&A), Item 8 (Financial Statements). Chunking across section boundaries loses context — the heading tells you what the paragraph is about.\n\nBetter: section-aware chunking. Parse the filing into sections first, then chunk within sections. Include the section header in each chunk's text and metadata. This dramatically improves retrieval for section-specific questions.\n\n**Reranking**: After top-k retrieval, a cross-encoder reranker (BGE-reranker, Cohere Rerank) rescores retrieved chunks for relevance to the specific question. Reranking often improves Recall@3 by 10–20 percentage points at trivial latency cost.",
     warning:"**Trap: Treating High Fluency as Evidence of High Accuracy**\n\nTrap: Evaluating RAG quality by reading generated answers and judging whether they sound correct — without verifying the cited evidence.\n\nWhy it is dangerous: LLMs are trained to produce fluent, authoritative-sounding text. A model with Recall@5 of 0.40 (retrieving the right evidence only 40% of the time) still produces complete, confident-sounding answers 100% of the time. The 60% of answers without correct evidence are generated from training data associations — potentially hallucinated or from the wrong company, period, or context.\n\nDetect: build a 25-question ground-truth set with manually identified correct chunks. Compute Recall@k before evaluating generation quality.\n\nFix: never trust generated quality without measuring retrieval quality first. Retrieval failure is silent — it produces answers anyway.",
     misconception:"**Misconception: 'If the LLM cites a chunk, the claim is verified'**\n\nCitation to a chunk_id proves the claim was grounded in retrieval, not that the claim is accurate. Two separate verification failures remain possible:\n\n1. The cited chunk does not actually support the claim (hallucination despite retrieval — LLM ignored the chunk content)\n2. The cited chunk is the wrong document — e.g., it retrieved Q3 2022 instead of Q4 2022, or MSFT instead of AAPL due to similar boilerplate language\n\nTrue verification requires a human to open the cited accession on EDGAR, navigate to the section, find the chunk text, and confirm the claim matches. Automated verification can catch case 1 (entailment check: does chunk text entail the claim?), but case 2 requires metadata verification.\n\nFor production research systems: spot-check at least 20% of claims against original source documents.",
     yourTurn:"**Scenario**: Your RAG system shows:\n• Recall@1: 0.48\n• Recall@3: 0.64\n• Recall@5: 0.71\n\nYour target is Recall@5 > 0.80. You have budget for one improvement.\n\n1. What does Recall@1 = 0.48 tell you about retrieval precision?\n2. The gap between Recall@1 and Recall@5 is 0.23 — what does this suggest?\n3. What improvement would you prioritize: better embedding model, section-aware chunking, or cross-encoder reranking?\n\n**Answer**:\n1. The top-ranked result is wrong 52% of the time. Retrieval is finding relevant material but ranking it poorly.\n2. The correct chunk is often in positions 2–5 but not position 1. The system finds the right evidence but ranks it below less relevant chunks.\n3. Cross-encoder reranking — it directly addresses the ranking problem (correct chunk retrieved but poorly ranked). Section-aware chunking would help if recall@5 were lower; better embedding model is less likely to close the gap than fixing the ranking step.",
     synthesis:"**Week 6 — Key Takeaways**\n\n☑ RAG forces grounding: LLMs answer only from supplied documents with mandatory chunk citations\n☑ Recall@k measures retrieval quality — compute it before evaluating generation quality\n☑ Recall@5 > 0.75 is a minimum bar for financial research systems; below this, answers are unreliable\n☑ Fluency and accuracy are independent — a model with 40% recall produces confident answers 100% of the time\n☑ Chunking strategy (section-aware) often matters more than embedding model choice for structured documents\n\n**Next**: Week 7 turns retrieval output into portfolio construction — translating ML signal rankings into constrained weight vectors.",
     equation:"Recall@k = |{q : correct_chunk ∈ top_k(q)}| / |Q|     Minimum bar: Recall@5 > 0.75"
    }],
    quiz:{id:'w06-quiz', questions:[
      {id:'w06-q01', type:'multiple_choice', question:"Why is citation to a specific accession number required for every AI financial claim?", options:['Legal compliance requirement','Allows verification that the claim is grounded, not hallucinated','Improves LLM response speed','Required by EDGAR API terms'], correct:1, explanation:"Accession number citation allows any reader to open the exact filing and verify the claim. Without this, an LLM answer is completely unauditable — it could be hallucinated, based on outdated training data, or from a different company or period than intended."},
      {id:'w06-q02', type:'scenario', scenario:"Your RAG system has Recall@5 = 0.45. You present the generated answers to a colleague who says 'these look great!'", question:"What is the appropriate response?", options:['Agree — the answers do look good, suggesting retrieval is not a bottleneck','The colleague is right — Recall@5 = 0.45 means 45% accuracy, which is acceptable','The system retrieves the right evidence only 45% of the time. The other 55% of answers are generated without correct evidence and cannot be trusted — regardless of how they sound.','Request more evaluation data before concluding anything'], correct:2, explanation:"Recall@5 = 0.45 means the correct evidence is not in the retrieved context 55% of the time. The LLM produces answers anyway — from training data, related documents, or hallucination. Looking good ≠ being correct. The system fails more than half the time before the LLM even sees the evidence."},
      {id:'w06-q03', type:'multiple_choice', question:"What is the most likely cause of Recall@1=0.42 but Recall@5=0.78 in a RAG system?", options:['The embedding model is wrong for this domain','Retrieval finds relevant chunks but ranks them poorly — a reranker would help','Chunk size is too large','The vector index has too many dimensions'], correct:1, explanation:"The large gap between Recall@1 and Recall@5 means the correct chunk is being retrieved (it appears in top-5) but is ranked below position 1. This is a ranking problem, not a retrieval problem. A cross-encoder reranker, which scores each retrieved chunk against the query, directly addresses this by re-sorting the top-k results."}
    ]},
    lab:{id:'w06-lab', objective:"Build and evaluate a RAG pipeline for SEC filings.", checks:[{id:'w06-c01',text:'Filings chunked with section-aware boundaries and accession/section/chunk_id metadata'},{id:'w06-c02',text:'Embeddings generated and stored in vector index (FAISS or equivalent)'},{id:'w06-c03',text:'25+ manually verified ground-truth Q&A pairs created with correct chunk IDs identified'},{id:'w06-c04',text:'Recall@1, Recall@3, Recall@5 computed on held-out questions'},{id:'w06-c05',text:'Every generated answer cites accession_number and chunk_id — empty evidence_ids rejected'}], deliverable:"06_financial_rag.ipynb with retrieval evaluation report (Recall@k)"},
    evidencePrompts:["What is your Recall@5 score?","What question types does retrieval fail on most often?","How does section-aware chunking vs. fixed-size chunking affect Recall@k?"]
  },

  wk7:{
    mission:{objective:"Move from ranking stocks to building a portfolio. Translate ML signals into auditable constrained target weights using CVXPY.",output:"Allocator function: ML scores → constrained portfolio weights, reproducibly.",failCondition:"Treating top-N equal-weight as sufficient portfolio construction.",whatWouldChangeMind:"A constrained optimizer that improves risk-adjusted returns vs. naive top-N with measurable reduction in concentration risk."},
    whyItMatters:"Stock picking and portfolio construction are different problems. A list of great stocks still produces a bad portfolio if they are all in the same sector or correlated drawdowns.",
    lessons:[{id:'w07-l01', title:'Mean-Variance and Why Simple Alternatives Often Win', duration:'10 min', competency:'PORTFOLIO',
     content:"Stock ranking and portfolio construction are separate problems that require separate solutions. A list of the 20 best-ranked stocks is not a portfolio — it is a collection of picks that may be heavily correlated, sector-concentrated, or sized incorrectly relative to their risk contribution.\n\n**Markowitz Mean-Variance (1952)**\nObjective: maximize μᵀw − (λ/2)wᵀΣw\nSubject to: Σwᵢ = 1, wᵢ ≥ 0, sector limits...\n\nTheoretically optimal: for given expected returns and covariance matrix, this produces the efficient frontier. Every investor who prefers more return to less risk, and less variance to more, should hold a portfolio on the efficient frontier.\n\n**Why It Often Fails in Practice**\nExpected return estimation is the problem. Small errors in μ produce dramatically different portfolios. Michaud (1989) showed that the optimizer amplifies input estimation errors — it concentrates weight in stocks with overestimated expected returns and underweights stocks with underestimated returns. The resulting portfolios are fragile, concentrated, and unstable over time.\n\n**Practical Alternatives**\n• Minimum variance: set μ = 0 and minimize wᵀΣw only. Ignores the noisy return estimates entirely, producing more stable portfolios at the cost of expected-return optimality.\n• Risk parity: weight each stock so its risk contribution (wᵢ × marginal variance) is equal. More robust than min-variance for concentrated industries.\n• Rank-weighted: set weights proportional to signal rank normalized to sum to 1. Simple, transparent, zero covariance estimation required.\n\n**Turnover Costs: The Hidden Performance Tax**\nRebalancing costs are not modeled in most textbook treatments. A high-IC signal with 100% monthly turnover at 30 bps round-trip costs 30 bps × 12 months × 2 (buy + sell) = 7.2% per year just in transaction costs. Incorporating a turnover penalty in the optimization directly reduces costs and often improves net Sharpe even if it reduces gross Sharpe.",
     mechanics:"# CVXPY Portfolio Optimizer\nimport cvxpy as cp\nimport numpy as np\n\ndef optimize_portfolio(signal_scores, cov_matrix, prev_weights,\n                        max_weight=0.05, sector_map=None, max_sector=0.20,\n                        turnover_penalty=0.001, risk_aversion=2.0):\n  n = len(signal_scores)\n  w = cp.Variable(n)  # target weights\n\n  # 1. Objective: signal score − risk penalty − turnover penalty\n  objective = (\n    signal_scores @ w                              # signal return (normalized ranks)\n    - risk_aversion * cp.quad_form(w, cov_matrix)  # variance penalty\n    - turnover_penalty * cp.norm1(w - prev_weights) # turnover cost\n  )\n\n  # 2. Constraints\n  constraints = [\n    cp.sum(w) == 1,      # fully invested\n    w >= 0,              # long-only\n    w <= max_weight,     # position limit per stock\n  ]\n\n  # 3. Sector limits (if sector_map provided)\n  if sector_map is not None:\n    for sector_id, idx_list in sector_map.items():\n      constraints.append(cp.sum(w[idx_list]) <= max_sector)\n\n  # 4. Solve\n  prob = cp.Problem(cp.Maximize(objective), constraints)\n  prob.solve(solver=cp.OSQP, warm_start=True)\n\n  return w.value if prob.status in ['optimal', 'optimal_inaccurate'] else prev_weights",
     intuition:"Mean-variance optimization is like using a noisy GPS that is occasionally off by 50 miles. If you follow it precisely, you end up far from your destination. A fixed speed limit (minimum variance: just control risk, ignore noisy return estimates) is worse in theory but gets you there reliably in practice.\n\nThe mathematical reason: Σ (covariance) can be estimated with reasonable precision using historical returns. μ (expected returns) cannot — the signal-to-noise ratio for expected return estimation is so low that even 10 years of monthly data does not reliably distinguish a 7% expected return from an 8% expected return. The optimizer treats both estimates as if they were precise, amplifying the noise into concentrated positions.",
     example:"**Three Approaches: 20-Stock Universe, 36-Month OOS Backtest**\n\nSignal: cross-sectional momentum ranker (Week 3 model)\nResult comparison (36-month OOS, monthly rebalancing, 20 bps round-trip costs):\n\n                    Gross Sharpe  Net Sharpe  Max Drawdown  Ann. Turnover\nTop-20 equal-wt       0.71         0.44         -28%          142%\nMean-variance         0.84         0.29         -24%          218%  ← higher gross, lower net\nMinimum variance      0.78         0.58         -19%          96%\nRank-weighted (w∝rank) 0.73        0.52         -23%          118%\n\nMin-variance wins net of costs. Mean-variance has highest gross Sharpe but highest turnover — costs destroy it. Top-N equal-weight underperforms both. Rank-weighted is nearly as good as min-variance with simpler implementation.",
     subtleVersion:"**The Covariance Estimation Problem**\n\nEven covariance estimation degrades with large universes. For N=500 stocks and T=60 monthly observations, the sample covariance matrix Σ has 500×501/2 = 125,250 parameters estimated from 30,000 data points. This matrix is rank-deficient and its eigenstructure is distorted by estimation error — small eigenvalues are underestimated, large ones overestimated.\n\nShrinkage estimators (Ledoit-Wolf) blend the sample Σ with a structured target (identity or factor model). This consistently improves out-of-sample optimization performance versus raw sample covariance. For universes >100 stocks, always use Ledoit-Wolf or a factor-model covariance estimate.\n\n**Risk Parity Subtlety**: Risk parity equalizes volatility contributions but not correlation contributions. In 2008, all assets with high volatility also had high pairwise correlations — risk parity portfolios were not diversified at the level that mattered (correlation), only at the level that was easy to measure (volatility).",
     warning:"**Trap: Ignoring Turnover Costs in Optimizer Objective**\n\nTrap: Formulating the portfolio optimization problem without a turnover penalty term, then reporting net-of-costs performance as if the optimizer minimized costs.\n\nWhy it matters: an unconstrained optimizer rebalances as dramatically as the signal allows each period. For a monthly signal with high turnover, this can mean 150–200% annual turnover at 20–30 bps per trade. Even at 20 bps round-trip, 200% turnover costs 4% per year — enough to eliminate a marginal strategy's entire Sharpe.\n\nSymptom: gross Sharpe looks excellent; net Sharpe (after realistic cost assumptions) is near zero.\n\nFix: add a turnover penalty term: λ_to × ||w_target − w_current||₁ directly in the CVXPY objective. Tune λ_to to balance signal capture vs. cost reduction. The optimizer then endogenously finds the turnover level where marginal signal gain equals marginal cost.",
     misconception:"**Misconception: 'Top-N equal-weight is good enough for a first pass'**\n\nTop-N equal-weight is a fine baseline — but it is not a portfolio construction method. It makes an implicit claim: all top-N stocks have equal expected risk-adjusted return and zero pairwise correlation differences. Both assumptions are wrong.\n\nMore practically: top-N equal-weight ignores signal strength gradations. A stock ranked 1st (very strong signal) receives the same weight as a stock ranked 20th (weak signal). Rank-weighted sizing directly exploits signal strength differences and consistently outperforms equal-weight in the top decile.\n\nAdditionally, equal-weight with no sector constraints allows 80% sector concentration when signals cluster in one industry. This happened with momentum strategies in 2020 (tech) and 2022 (energy) — a sector rotation completely destroyed the strategy when it had no sector limits.",
     yourTurn:"**Scenario**: Your signal ranks 100 stocks. You optimize a portfolio and observe:\n• Target weights: 60% of weight in 3 Technology stocks\n• Max weight per stock: 10% (enforced)\n• Sector constraint: none specified\n• Turnover penalty: none\n• Gross Sharpe: 1.4, Net Sharpe at 30 bps: 0.3\n\n1. Why is 60% weight in 3 stocks occurring despite a 10% per-stock cap?\n2. What is the likely cause of the gross-to-net Sharpe collapse?\n3. What two constraints would you add?\n\n**Answer**:\n1. No sector constraint allows full concentration in one sector — three tech stocks at 10% each = 30%, not 60%. If it is 60%, the per-stock cap is not being enforced (check CVXPY constraint definition) or there are 6 tech stocks each at 10%.\n2. Turnover penalty is absent — optimizer rebalances fully each month, generating ~150%+ annual turnover at 30 bps = ~4.5% annual cost drag.\n3. Add: (1) sector constraint: max 25–30% per sector, and (2) turnover penalty λ × ||w_new − w_old||₁ in the objective.",
     synthesis:"**Week 7 — Key Takeaways**\n\n☑ Mean-variance is theoretically optimal but practically fragile — estimation errors in μ dominate\n☑ Minimum variance (ignore μ, minimize risk only) often produces better net-of-cost outcomes\n☑ Always include a turnover penalty in the optimizer objective — unconstrained optimizers destroy net returns\n☑ Sector constraints prevent concentration risk when signals cluster in one industry\n☑ Rank-weighted sizing exploits signal strength gradations that equal-weight ignores\n\n**Next**: Week 8 dissects what is actually driving portfolio returns — factor decomposition reveals whether you are generating genuine alpha or just taking on more systematic risk.",
     equation:"Portfolio variance = wᵀΣw     |     Turnover cost = λ × ||w_new − w_old||₁     |     Risk contribution of asset i = wᵢ × (Σw)ᵢ"
    }],
    quiz:{id:'w07-quiz', questions:[
      {id:'w07-q01', type:'multiple_choice', question:"Why does mean-variance optimization often underperform simpler alternatives in practice?", options:['Too computationally expensive','Small errors in expected return estimates produce dramatically different, often concentrated portfolios','Cannot handle constraints','Requires normally distributed returns'], correct:1, explanation:"The optimizer treats expected return estimates as precise inputs. But expected returns are extremely hard to estimate — errors are large relative to the signal. These errors get amplified into concentrated, unstable portfolios. Minimum variance sidesteps this by ignoring the noisy return estimates entirely."},
      {id:'w07-q02', type:'scenario', scenario:"A strategy has Gross Sharpe 1.4 and Net Sharpe 0.2 at 25 bps round-trip costs. Annual turnover is 210%.", question:"What is the approximate annual cost drag, and what is the most direct fix?", options:['Cost drag ≈ 1%/yr; use cheaper broker','Cost drag ≈ 5.25%/yr; add a turnover penalty to the optimizer objective','Cost drag ≈ 0.25%/yr; costs are not the issue — signal has degraded','Cost drag ≈ 3%/yr; switch to a lower-frequency signal'], correct:1, explanation:"Annual cost drag = 210% turnover × 25 bps × 2 sides = 210% × 0.50% = 1.05% per round-trip × 2 = ~5.25%/yr. This is catastrophic. The direct fix is a turnover penalty term in the CVXPY objective: it forces the optimizer to balance signal capture against transaction costs endogenously."},
      {id:'w07-q03', type:'multiple_choice', question:"Why does Ledoit-Wolf shrinkage consistently outperform sample covariance in portfolio optimization?", options:['It is more computationally efficient','It blends the noisy sample covariance with a structured target, reducing estimation error especially in the eigenstructure','It produces sparser weight vectors','It accounts for non-normality in returns'], correct:1, explanation:"For N=500 stocks with T=60 observations, the sample covariance has 125,250 parameters estimated from limited data. The eigenstructure is distorted — small eigenvalues underestimated, large ones overestimated. Ledoit-Wolf shrinks toward a structured target (e.g., identity) with optimal weighting, reducing estimation error and producing more stable out-of-sample portfolio weights."}
    ]},
    lab:{id:'w07-lab', objective:"Build a constrained portfolio optimizer.", checks:[{id:'w07-c01',text:'CVXPY problem defined with explicit objective and all constraints written out'},{id:'w07-c02',text:'Position limits enforced (max weight per stock, min weight = 0 for long-only)'},{id:'w07-c03',text:'Sector/industry constraints enforced (max 25–30% per sector)'},{id:'w07-c04',text:'Turnover penalty term included in objective — coefficient tuned'},{id:'w07-c05',text:'Output weights sum to 1.0 and satisfy all constraints — verified numerically'}], deliverable:"07_portfolio_optimizer.ipynb with auditable weight function"},
    evidencePrompts:["Does constrained optimization outperform naive top-N on a net-of-costs basis?","How sensitive are output weights to small changes in signal inputs?","What is the optimal turnover penalty coefficient that maximizes net Sharpe?"]
  },

  wk8:{
    mission:{objective:"Stress-test your portfolio against factor exposures, drawdown scenarios, and model drift. Define conditions under which you would disable the model.",output:"Risk limits document and model-disable rules.",failCondition:"Reporting portfolio results without examining factor exposures or stress-testing drawdown scenarios.",whatWouldChangeMind:"A clearly defined drawdown or exposure threshold that would trigger mandatory model review."},
    whyItMatters:"A strategy with good average performance can still be catastrophic if it concentrates risk in a single factor that reverses sharply. Risk management means understanding your exposure sources before they blow up.",
    lessons:[{id:'w08-l01', title:'Factor Decomposition: What Really Drives Returns', duration:'8 min', competency:'RISK',
     content:"Factor regression decomposes portfolio returns into exposures to known systematic risks. Its purpose is to answer the most important question in quant research: how much of your strategy's return is genuine alpha versus compensation for known risk exposures?\n\n**Fama-French 5-Factor Model**\nr_portfolio = α + β_mkt×Mkt-RF + β_smb×SMB + β_hml×HML + β_rmw×RMW + β_cma×CMA + ε\n\nFactors (Kenneth French Data Library — free download):\n• Mkt-RF: excess market return — compensation for general equity market risk\n• SMB (Small Minus Big): size premium — small caps historically earn more than large caps\n• HML (High Minus Low): value premium — high book/market stocks vs. growth stocks\n• RMW (Robust Minus Weak): profitability premium — profitable vs. unprofitable firms\n• CMA (Conservative Minus Aggressive): investment premium — low-investment vs. high-investment firms\n\nAlpha (α) = intercept = annualized return unexplained by all five factors = potential skill\n\n**Why Factor Betas Matter for Capital Allocation**\nFactor exposures are compensated risks. If β_mkt = 1.4, you could replicate that market exposure with 1.4× leveraged index funds — no strategy needed. True alpha is only what remains after all these systematic compensations are subtracted. A strategy with α = 0 and β_mkt = 1.4 delivers the same expected return as levered index exposure — with strategy-specific risk on top.\n\n**Drawdown Regime Analysis**\nBeyond factor regression, decompose drawdowns by market regime:\n• Crisis periods (2008, 2020 COVID): does the strategy drawdown more than the market?\n• Low-volatility regimes vs. high-volatility regimes: does IC hold in both?\n• Rising rate environments: what is the interest rate factor sensitivity?",
     mechanics:"# Factor Regression + Drawdown Analysis\nimport pandas as pd, numpy as np\nfrom scipy.stats import linregress\nimport statsmodels.api as sm\n\ndef factor_decompose(portfolio_returns, factor_returns, frequency='monthly'):\n  \"\"\"portfolio_returns, factor_returns: pd.DataFrame aligned by date\"\"\"\n\n  # 1. Align and compute excess returns\n  rf = factor_returns['RF']  # risk-free rate (from French data)\n  excess_port = portfolio_returns - rf\n  factor_cols = ['Mkt-RF','SMB','HML','RMW','CMA']\n  X = sm.add_constant(factor_returns[factor_cols])\n\n  # 2. OLS regression\n  model = sm.OLS(excess_port, X).fit()\n  alpha_monthly = model.params['const']\n  betas = model.params[factor_cols]\n\n  # 3. Annualize alpha\n  periods = 12 if frequency == 'monthly' else 252\n  alpha_annual = alpha_monthly * periods\n\n  # 4. Factor-explained return vs. alpha decomposition\n  factor_contribution = {f: betas[f] * factor_returns[f].mean() * periods\n                         for f in factor_cols}\n\n  return {'alpha_annual': alpha_annual,\n          'alpha_tstat': model.tvalues['const'],\n          'betas': betas.to_dict(),\n          'r_squared': model.rsquared,\n          'factor_contributions': factor_contribution}\n\ndef drawdown_by_regime(returns, market_returns):\n  # Identify bear market periods (market drawdown > 15%)\n  peak = market_returns.cummax()\n  dd_mkt = (market_returns - peak) / peak\n  crisis_mask = dd_mkt < -0.15\n  print('Bear regime performance:', returns[crisis_mask].mean() * 12)\n  print('Bull regime performance:', returns[~crisis_mask].mean() * 12)",
     intuition:"If your strategy has market beta of 1.4 and momentum loading of 0.8, you are mostly being paid for taking on known risks — not generating new information. This matters because leveraged index exposure and momentum factor ETFs cost nearly nothing. Alpha is only the return that justifies your strategy's complexity and cost.\n\nThink of it as salary decomposition. Total compensation = base salary (beta-compensated risk) + performance bonus (true alpha). If the regression shows your entire return is base salary, the strategy is overpaying for market exposure in an expensive structure. A 5-factor alpha t-stat below 2.0 means you cannot statistically reject the hypothesis that your strategy has zero genuine skill.",
     example:"**Factor Decomposition: Strategy with Apparent 18% CAGR**\n\nMonthly regression on Fama-French 5 factors (60 months):\n\nα (intercept): +0.08%/month = 0.96%/yr  [t-stat: 0.7, NOT significant]\nβ_mkt: 1.41  [t-stat: 11.2, highly significant]\nβ_smb: 0.38  [t-stat: 2.1]\nβ_hml: -0.22  [t-stat: -1.4, not significant]\nβ_rmw: 0.31  [t-stat: 1.8]\nβ_cma: -0.05  [t-stat: -0.3]\nR²: 0.87  (87% of return variance explained by factors)\n\nFactor attribution (annualized):\nMarket (1.41 × 12.3%): +17.3%\nSize (0.38 × 2.1%): +0.8%\nAll other factors: +0.2%\nAlpha: +0.96% (not statistically significant)\nTotal explained: ~18.3% ✓\n\nConclusion: the entire 18% CAGR is explained by high market beta and a small-cap tilt. True alpha ≈ 0. This strategy is levered small-cap index exposure, not genuine alpha generation.",
     subtleVersion:"**Alpha t-Stat Decay and Overfitting**\n\nA strategy with a significant alpha t-stat in-sample will typically show lower t-stats out-of-sample, due to the same overfitting dynamic as IC. Lopez de Prado (2018) argues that the correct p-value threshold for a published alpha is not 5% (t > 2.0) but approximately 1% (t > 2.5) after adjusting for multiple testing across strategies tested during research.\n\n**Factor Model Choice Matters**\nFama-French 5-factor omits the momentum factor (UMD = Up Minus Down). A momentum strategy will show large positive alpha in the 5-factor model because the momentum exposure is not controlled. Adding the 6th factor (MOM from French's website) will absorb that apparent alpha. Always test robustness of alpha across different factor model specifications.\n\n**Conditional Factor Betas**: Factor betas are not stable across market regimes. β_mkt often rises during crises (flight to safety affects different stocks asymmetrically). Rolling 12-month factor regressions reveal whether your exposures are stable or regime-dependent.",
     warning:"**Trap: Claiming Alpha Without Factor Adjustment**\n\nTrap: Comparing strategy return to market return and calling the difference 'alpha' — without running a factor regression.\n\nWhy it is invalid: if your strategy has β_mkt = 1.4, it should earn 40% more than the market's excess return by construction. A strategy earning 18% vs. a market that returned 12% actually underperformed a passive 1.4× levered index. The comparison to a 1.0× index makes this look like +6% alpha when the true 5-factor alpha is close to zero.\n\nSymptom: research reports that show 'alpha = strategy return − benchmark return' without controlling for factor exposures. This is not alpha — it is return after a single, possibly incorrect, benchmark comparison.\n\nFix: always run a multifactor regression. Require alpha t-stat > 2.0 (and ideally > 2.5 after multiple testing correction) before claiming skill-based performance.",
     misconception:"**Misconception: 'High R² is bad — it means the strategy is just a factor fund'**\n\nHigh R² in the factor regression means the factor model explains most return variance — but it says nothing directly about alpha. A strategy with R² = 0.90 and statistically significant positive alpha is excellent: the factors capture the systematic risk, and the alpha is the genuine residual skill.\n\nWhat matters is the intercept (alpha) and its t-statistic, not R². A strategy with R² = 0.20 and alpha t-stat = 0.5 is worse than a strategy with R² = 0.85 and alpha t-stat = 2.8, despite the former having 'more unexplained variance.'\n\nLow R² just means the strategy takes on idiosyncratic risk that the factor model does not capture — which could be genuine skill or could be unpriced stock-specific noise.",
     yourTurn:"**Scenario**: Factor regression results for your Week 7 portfolio (60 monthly observations):\n\nα: +0.31%/month [t-stat: 2.3]\nβ_mkt: 0.89, β_smb: 0.52, β_hml: 0.18, β_rmw: 0.44, β_cma: 0.07\nR²: 0.81\n\n1. Is the alpha statistically significant? What does this mean?\n2. What systematic risks are you taking on beyond market exposure?\n3. Would you report this as a successful strategy?\n\n**Answer**:\n1. t-stat 2.3 > 2.0 threshold — marginally significant. With 60 observations and a single pre-specified model, this is borderline. If you tested multiple variants, the threshold should be higher (~2.5). It is encouraging, not conclusive.\n2. Beyond market: meaningful small-cap tilt (β_smb = 0.52) and profitability tilt (β_rmw = 0.44). These are compensated risk factors — some of your return is from small-cap and quality premia, not pure skill.\n3. Cautiously yes — the alpha is marginally significant, R² = 0.81 is reasonable, and factor exposures are explicable. But extend the OOS period and test whether alpha persists before committing capital.",
     synthesis:"**Week 8 — Key Takeaways**\n\n☑ Factor regression decomposes returns into beta-compensated risk vs. true alpha — run it before claiming outperformance\n☑ Alpha t-stat > 2.0 (pre-specified) or > 2.5 (post-search) required to reject the null of zero skill\n☑ High R² does not indicate a bad strategy — it means systematic risk is well-captured\n☑ Factor betas are not stable across regimes — run rolling regressions to check stability\n☑ Model-disable rules must be written before going live: drawdown threshold, factor exposure drift limit, IC decay trigger\n\n**Next**: Week 9 builds the AI analyst layer — with structured output schemas that enforce evidence grounding at every step.",
     equation:"True alpha = r_portfolio − (β_mkt×Mkt-RF + β_smb×SMB + β_hml×HML + β_rmw×RMW + β_cma×CMA)"
    }],
    quiz:{id:'w08-quiz', questions:[
      {id:'w08-q01', type:'scenario', scenario:"Your strategy has 18% CAGR. Factor regression: β_mkt=1.4, β_momentum=0.8, both significant. Market returned 12%.", question:"What is the primary implication?", options:['Excellent — 18% >> 12%','True alpha may be zero after adjusting for factor exposures','Beta 1.4 is too low — use more leverage','Momentum loading invalidates the strategy'], correct:1, explanation:"With β_mkt=1.4, expected return from market beta alone ≈ 16.8% (= 1.4 × 12%). The momentum loading explains most of the remainder. True 5-factor alpha is statistically indistinguishable from zero. The entire 18% CAGR is compensated systematic risk, not skill."},
      {id:'w08-q02', type:'multiple_choice', question:"What is the correct interpretation of a Fama-French 5-factor regression R² = 0.87?", options:['The strategy has 87% alpha','87% of return variance is explained by the five systematic factors — does not determine alpha','The strategy is 87% correlated with the market','Low R² would be better — high R² means no diversification'], correct:1, explanation:"R² measures how much of the return variance the factor model explains. It says nothing about whether alpha is positive, negative, or zero. A strategy with R²=0.87 and alpha t-stat=2.5 is excellent. A strategy with R²=0.15 and alpha t-stat=0.3 is poor. Focus on the alpha intercept and its t-statistic, not R²."},
      {id:'w08-q03', type:'multiple_choice', question:"Why do rolling 12-month factor betas provide more useful information than a single full-period beta estimate?", options:['Rolling betas have less estimation error due to more data','Rolling betas reveal regime-dependent changes in factor exposure that a static estimate hides','Rolling betas are required by SEC regulation','Rolling betas use more recent data which is always more accurate'], correct:1, explanation:"Factor betas change across market regimes. A momentum strategy may have β_mkt = 0.8 in normal markets and β_mkt = 1.5 during crashes (momentum crashes are well-documented). A single 5-year average hides this variation. Rolling estimates reveal whether risk characteristics are stable or whether the strategy takes on dramatically more market risk during the periods when you can least afford it."}
    ]},
    lab:{id:'w08-lab', objective:"Build a risk dashboard and define model-disable rules.", checks:[{id:'w08-c01',text:'Factor regression completed using French 5-factor data (French library download)'},{id:'w08-c02',text:'Alpha t-stat computed and documented (threshold: > 2.0 for pre-specified, > 2.5 for post-search)'},{id:'w08-c03',text:'Drawdown decomposed by market regime (crisis vs. bull, pre-defined dates)'},{id:'w08-c04',text:'Rolling 12-month factor betas plotted to check stability'},{id:'w08-c05',text:'Model-disable rules written: drawdown threshold, factor drift limit, IC decay trigger'}], deliverable:"08_risk_and_drift.ipynb + risk limits document"},
    evidencePrompts:["What is the strategy's true alpha after factor adjustment? Is it statistically significant?","Under what stress scenario does performance deteriorate most severely?","Are factor betas stable across all subperiods, or regime-dependent?"]
  },

  wk9:{
    mission:{objective:"Build an AI analyst that produces research memos grounded in verifiable evidence — with mandatory citation to specific filing sections.",output:"5 AI research memos graded against human-verified filing facts.",failCondition:"Accepting an AI memo as valid when claims cannot be traced to specific accession numbers.",whatWouldChangeMind:"Consistent above-60% accuracy on verifiable factual questions using your pipeline."},
    whyItMatters:"The Finance Agent Benchmark showed best AI models answer only ~47% of expert SEC questions correctly. AI analysts are useful for scale — but they require mandatory citation and human oversight to be trustworthy.",
    lessons:[{id:'w09-l01', title:'Structured Outputs and Evidence Contracts', duration:'9 min', competency:'RESEARCH',
     content:"Free-form LLM answers to financial questions may be confident, fluent, and wrong simultaneously. An AI analyst without a strict output contract is an unauditable system — you cannot distinguish accurate analysis from confident hallucination.\n\n**The Evidence Contract**\nEvery claim output by the system must carry mandatory evidence fields. No evidence = rejected claim. This is enforced at the schema level, not as a guideline:\n\n{\n  'claim': string,\n  'evidence_ids': [string],     // REQUIRED — empty array = claim auto-rejected\n  'confidence': 'low'|'medium'|'high',\n  'uncertainties': [string],    // what the LLM is not sure about\n  'unanswered_questions': [string]  // what it could not find evidence for\n}\n\n**System Prompt Contract**\nThe LLM's system prompt must include hard constraints:\n'You may ONLY make factual claims that are directly supported by the document chunks provided. For EVERY factual claim, you MUST cite at least one chunk_id. If you cannot find supporting evidence for a claim in the provided chunks, you MUST explicitly state the evidence is absent — do NOT generate a claim without evidence.'\n\n**Why 47% Accuracy on Expert SEC Questions?**\nThe Finance Agent Benchmark (2024) evaluated leading LLMs on expert-level SEC research questions. Best models achieved ~47% accuracy — barely above chance for 4-option questions. The failure modes were:\n1. Retrieval failure: relevant chunk not retrieved, model generated from training data\n2. Temporal confusion: model conflated 2021 filing data with 2019 filing data\n3. Hallucinated numbers: model invented precise financial figures that sounded plausible\n4. Reasoning errors: retrieved correct evidence but drew wrong analytical conclusions\n\nMandatory citations expose failure modes 1 and 3 immediately. Modes 2 and 4 require human audit.",
     mechanics:"# AI Research Analyst with Evidence Contract\nfrom anthropic import Anthropic\nimport json\n\nclient = Anthropic()\n\nOUTPUT_SCHEMA = {\n  'type': 'object',\n  'required': ['claims', 'uncertainties', 'unanswered_questions'],\n  'properties': {\n    'claims': {\n      'type': 'array',\n      'items': {\n        'type': 'object',\n        'required': ['claim_text', 'evidence_ids', 'confidence'],\n        'properties': {\n          'claim_text': {'type': 'string'},\n          'evidence_ids': {'type': 'array', 'items': {'type': 'string'},\n                           'minItems': 1},  # enforce: at least 1 citation\n          'confidence': {'enum': ['low', 'medium', 'high']}\n        }\n      }\n    },\n    'uncertainties': {'type': 'array', 'items': {'type': 'string'}},\n    'unanswered_questions': {'type': 'array', 'items': {'type': 'string'}}\n  }\n}\n\ndef analyze_company(company, retrieved_chunks, question):\n  chunk_context = '\\n\\n'.join(\n    f'[{c[\"chunk_id\"]}] {c[\"text\"]}' for c in retrieved_chunks\n  )\n  messages = [{\n    'role': 'user',\n    'content': f'Research question: {question}\\n\\nAvailable evidence:\\n{chunk_context}'\n  }]\n\n  response = client.messages.create(\n    model='claude-haiku-4-5-20251001',\n    max_tokens=2048,\n    system='You are a financial analyst. Only make claims directly supported by provided chunks. Every claim MUST cite at least one chunk_id in evidence_ids. If evidence is absent, state it in unanswered_questions.',\n    messages=messages\n  )\n  # Parse and validate — reject any claim with empty evidence_ids\n  result = json.loads(response.content[0].text)\n  result['claims'] = [c for c in result.get('claims',[]) if c.get('evidence_ids')]\n  return result",
     intuition:"A claims-based analyst without citations is like a lawyer who argues from memory without looking at the brief. They can make a compelling case that is completely disconnected from the actual statute. Mandatory citation forces the model to open the brief first — and then requires a specific page number.\n\nThe deeper issue is that LLMs trained on financial text have memorized vast amounts of information about public companies. They can produce detailed, numerically precise analysis of Apple, Microsoft, or Amazon without ever consulting a filing — because this information exists in their training data from news articles, analyst reports, and earnings summaries. Mandatory citation makes this memorization visible: if the chunk IDs cited do not contain the claimed information, the claim is fabricated regardless of its plausibility.",
     example:"**Same Question — Constrained vs. Unconstrained Output**\n\nQuestion: 'What supply chain risks did Apple disclose in its FY2022 annual report?'\n\nUNCONSTRAINED (dangerous):\n'Apple disclosed significant supply chain concentration risk related to single-source suppliers for key components, with approximately 98% of manufacturing in Asia...'\nNo citation — may be training data memorization, may be from wrong year\n\nCONSTRAINED (required):\n{\n  'claims': [{\n    'claim_text': 'Apple disclosed concentration risk from geographic manufacturing in Asia',\n    'evidence_ids': ['0000320193-22-000108-1A-chunk23'],\n    'confidence': 'high'\n  }],\n  'uncertainties': ['Exact supplier count not stated in retrieved chunks'],\n  'unanswered_questions': ['Specific components at risk — not found in top-5 retrieved chunks']\n}\nVerifiable: open accession 0000320193-22-000108, Item 1A, find chunk 23.",
     subtleVersion:"**Automated Fact Verification (Entailment Checking)**\n\nAfter generating structured output, you can run automated fact verification using natural language inference (NLI) models. The NLI model takes the claim_text and the cited chunk text as inputs and classifies: 'entails' / 'neutral' / 'contradicts.'\n\nAny claim marked 'contradicts' or 'neutral' by the NLI model failed the citation check — the cited chunk does not support the claim. This catches cases where the LLM cited a real chunk but misread or hallucinated its content.\n\nModels for NLI: cross-encoder/nli-deberta-v3-small (fast), or zero-shot classification via a larger LLM ('Does the following passage support this claim? Answer yes or no.').\n\n**Confidence Calibration**: High-confidence claims should be correct more often than low-confidence claims. If your system's high-confidence claims are correct 50% of the time and low-confidence claims are correct 48% of the time, confidence is not calibrated. Measure calibration across your 25+ audit questions and tune the system prompt if needed.",
     warning:"**Trap: Trusting LLM Self-Assessment of Confidence**\n\nTrap: Using the model's stated confidence ('high confidence: Apple grew revenue 24%') as a proxy for claim accuracy. High LLM confidence has essentially zero correlation with factual accuracy on specific financial figures.\n\nWhy: LLMs are trained to produce fluent, decisive-sounding text. Confidence language is a stylistic register, not an epistemic signal. A model will state '24.3% revenue growth (high confidence)' with identical stylistic certainty whether the number came from a retrieved filing or from training-data hallucination.\n\nDetect: audit high-confidence claims in your test set. If high-confidence accuracy is not materially above low-confidence accuracy, confidence is noise.\n\nFix: treat confidence as a coarse filter only. All claims, regardless of stated confidence, must carry chunk citations. Accuracy must be measured empirically against source documents.",
     misconception:"**Misconception: 'The LLM will naturally stay within provided documents'**\n\nWithout an explicit evidence contract in the system prompt, LLMs will blend retrieved chunk content with training data associations. The model does not have a clear conceptual distinction between 'what I found in the provided documents' and 'what I know about this company from training.' Both feel like memory retrieval from the model's perspective.\n\nThis is not a bug — it is how language model inference works. Suppressing training data requires explicit instruction ('you may ONLY use the provided document chunks') AND validation via citation requirements. Even with explicit instructions, some training-data leakage occurs. The citation requirement is what makes it detectable.",
     yourTurn:"**Scenario**: Your AI analyst produces this output for a question about a company's debt maturity schedule:\n\n{\n  'claims': [{\n    'claim_text': '$2.3B in debt matures within 12 months',\n    'evidence_ids': ['0001234-23-00001-MD&A-chunk15'],\n    'confidence': 'high'\n  }],\n  'uncertainties': []\n}\n\nYou open the cited chunk and it reads: 'The company maintains a $2.3B revolving credit facility, none of which was drawn at year-end.'\n\n1. Is this claim valid? What error type is this?\n2. What does it imply about confidence calibration?\n3. How would you improve the system to catch this automatically?\n\n**Answer**:\n1. Invalid. The cited chunk describes a revolving credit facility (available credit, not debt), not a debt maturity obligation. This is a reasoning error — the chunk was retrieved correctly, but the model misinterpreted its meaning.\n2. High-confidence claim is wrong — confidence is not calibrated. This should be flagged as a low-confidence claim or as 'evidence does not directly support' by the model.\n3. Add an NLI entailment check: input (claim, chunk_text) → does chunk entail claim? This would flag 'neutral' — revolving facility ≠ debt maturity — and require human review.",
     synthesis:"**Week 9 — Key Takeaways**\n\n☑ Evidence contracts enforce mandatory citations at the schema level — empty evidence_ids means auto-rejected claim\n☑ LLM confidence language has near-zero correlation with factual accuracy — treat it as metadata, not truth signal\n☑ Finance Agent Benchmark: ~47% accuracy for best models on expert SEC questions — human oversight is not optional\n☑ Four failure modes: retrieval failure, temporal confusion, hallucinated numbers, reasoning errors\n☑ Automated entailment checking catches reasoning errors (wrong interpretation of correctly retrieved chunks)\n\n**Next**: Week 10 builds the adversarial layer — a bear agent that actively searches for contradicting evidence to challenge every bull claim.",
     equation:"Claim validity = (evidence_ids.length > 0) AND entailment(claim, cited_chunks) = 'entails'"
    }],
    quiz:{id:'w09-quiz', questions:[
      {id:'w09-q01', type:'multiple_choice', question:"The Finance Agent Benchmark found best AI models correctly answered approximately what fraction of expert SEC research questions?", options:['85%','67%','47%','29%'], correct:2, explanation:"~47% — barely above chance for 4-option questions. This is why AI analysts require human oversight and mandatory citation. High accuracy on general benchmarks does not transfer to reliable SEC financial research."},
      {id:'w09-q02', type:'scenario', scenario:"Your AI analyst cites chunk_id 'accession-1A-chunk5' for the claim 'revenue grew 24% YoY.' You open the chunk and it contains the text: 'Net sales increased from $8.2B in 2021 to $10.2B in 2022.'", question:"Is this claim valid? What type of verification succeeded?", options:['Invalid — the exact percentage must appear in the chunk text','Valid — the chunk entails the claim ($10.2B/$8.2B - 1 = 24.4%)','Invalid — chunk must state the percentage explicitly','Valid — any revenue citation makes the claim valid'], correct:1, explanation:"$10.2B / $8.2B − 1 = 24.4% — the claim is arithmetically derivable from the cited chunk. The entailment check passes: the chunk logically entails the percentage claim. However, note this requires the verifier to compute the arithmetic — automated entailment models may classify this as 'neutral' without reasoning support."},
      {id:'w09-q03', type:'multiple_choice', question:"Why does requiring 'evidence_ids' as a required schema field (rather than a prompt instruction) provide stronger guarantees?", options:['Schema validation is faster than prompt interpretation','A required schema field is validated programmatically before the output is accepted — a prompt instruction may be ignored by the model under certain conditions','Schema fields are encrypted and more secure','Prompt instructions are not supported by Anthropic models'], correct:1, explanation:"Schema validation (via JSON Schema, tool definitions, or structured output parsing) enforces constraints at the API layer — the output is rejected or re-requested if evidence_ids is missing or empty. A prompt instruction ('you must cite evidence') can be overridden by the model when it generates a high-confidence answer from training memory. Programmatic validation does not rely on the model's compliance."}
    ]},
    lab:{id:'w09-lab', objective:"Build and audit an AI research analyst.", checks:[{id:'w09-c01',text:'Structured output schema defined with evidence_ids as required field (minItems: 1)'},{id:'w09-c02',text:'System prompt evidence contract written — LLM restricted to supplied chunks with explicit fallback to unanswered_questions'},{id:'w09-c03',text:'5 research memos generated for universe companies using RAG retrieval + structured output'},{id:'w09-c04',text:'Each memo audited: every claim verified against cited chunk text'},{id:'w09-c05',text:'Accuracy rate and error type breakdown documented (hallucination vs. retrieval failure vs. reasoning error)'}], deliverable:"09_llm_analyst.ipynb + 5 audited research memos with accuracy analysis"},
    evidencePrompts:["What accuracy rate did your analyst achieve on verifiable factual questions?","Which error type was most common: hallucination, retrieval failure, or reasoning error?","How does accuracy differ between high-confidence and low-confidence claims?"]
  },

  wk10:{
    mission:{objective:"Build a multi-agent adversarial committee. Boss Fight: introduce misleading evidence — does the bear agent catch it?",output:"Agent evaluation matrix and escalation rules.",failCondition:"Claiming multi-agent system works without testing it against deliberately planted misleading inputs.",whatWouldChangeMind:"Bear agent correctly identifying ≥80% of deliberately planted misleading claims."},
    whyItMatters:"The Bull vs. Bear principle is the most important safeguard against LLM overconfidence. A single agent evaluating a company will nearly always find reasons to be bullish — especially on media-covered names.",
    lessons:[{id:'w10-l01', title:'Why AI Is Systematically Bullish', duration:'8 min', competency:'RESEARCH',
     content:"A single LLM agent evaluating a company will nearly always find reasons to be optimistic. This is not a calibration failure — it is a structural property of how language models learn from text.\n\n**The Media Coverage Bias**\nLLMs are trained on text corpora. Companies with extensive positive media coverage (AAPL, MSFT, NVDA, AMZN) generate vastly more training text than obscure small-caps. The model learns to associate 'extensive coverage' and 'confident analyst language' with 'good investment' — not because coverage predicts returns, but because positive coverage is more prevalent in training data than negative coverage.\n\nCarlin et al. (NBER 2026) empirically confirmed this: LLM-managed portfolios concentrate in large-cap, momentum-driven, media-visible names with no statistically significant risk-adjusted alpha after factor adjustment.\n\n**The Correlated Failure Problem**\nThe obvious solution — use two agents, have one be bullish and one bearish — fails when both agents use the same foundation model. Shared training data means shared biases, shared blind spots, and shared failure modes. When both agents fail on a question, they fail for the same reason, in the same direction.\n\nA 'bear agent' created by adding 'be critical' to the system prompt is not a genuinely independent perspective. It is the same model running the same associations with a different stylistic instruction. Under adversarial conditions (misleading evidence planted in retrieved chunks), both agents will likely be fooled by the same manipulation.\n\n**True Adversarial Design**\nGenuine adversarial diversity requires structural differences in evidence targeting:\n• Bull agent: retrieve chunks that discuss growth, competitive advantage, management guidance, future outlook\n• Bear agent: retrieve chunks from risk factors, debt schedules, regulatory filings, competitor analyses, short-seller reports\n• Neither agent is given the other's retrieved chunks — they work from different evidence pools\n• A synthesis step then reconciles claims with contradicting evidence",
     mechanics:"# Bull-Bear Committee Design\ndef build_bull_agent(retriever, llm_client):\n  def analyze(company, query):\n    # Bull agent retrieves growth/positive evidence\n    bull_query = f'{query} growth opportunity competitive advantage guidance'\n    chunks = retriever.retrieve(bull_query, company, k=5)\n    return run_agent(llm_client, chunks, stance='bull',\n      system_suffix='Search for evidence of competitive advantage, growth drivers, and management execution.')\n  return analyze\n\ndef build_bear_agent(retriever, llm_client):\n  def analyze(company, query):\n    # Bear agent retrieves risk/negative evidence — DIFFERENT query\n    bear_query = f'{query} risk factor debt regulatory competition lawsuit'\n    chunks = retriever.retrieve(bear_query, company, k=5)\n    # Also retrieve from competitor filings, not just target company\n    comp_chunks = retriever.retrieve(bear_query, company + '_competitors', k=3)\n    return run_agent(llm_client, chunks + comp_chunks, stance='bear',\n      system_suffix='Search for evidence of risks, vulnerabilities, execution failures, and disconfirming data.')\n  return analyze\n\ndef committee_decision(bull_result, bear_result, human_gate):\n  # Identify contradicting claims between bull and bear\n  contradictions = find_contradictions(bull_result, bear_result)\n  if contradictions:\n    return human_gate.review(bull_result, bear_result, contradictions)\n  else:\n    return {'consensus': True, 'result': bear_result}  # default to bear on consensus",
     intuition:"Asking the same model to argue both sides of a trade is like asking one person to debate themselves in different costumes. The underlying beliefs — learned from identical training data — are identical. The bear costume produces adversarial-sounding language but not genuinely adversarial analysis.\n\nTrue adversarial research works differently. A short-seller building a bear case on a company does not read the company's own press releases. They dig into supplier filings, read customer complaints, track insider selling, and stress-test the accounting. A genuine bear agent should be doing the equivalent: retrieving from a fundamentally different document set than the bull agent, not just applying a negative framing to the same documents.",
     example:"**Planted Misinformation Test — Does the Bear Agent Catch It?**\n\nTest case: Company ACME Corp\nPlanted misleading evidence: a chunk that says 'Revenue grew 34% YoY in Q4 2022' (actual filing shows 14%)\n\nBull agent (retrieves growth-themed chunks):\n'ACME demonstrated strong revenue acceleration, with Q4 2022 growth of 34% YoY [chunk_id: acme-planted-fake], outpacing industry average...'\nResult: FOOLED — cited the planted chunk with high confidence\n\nBear agent (retrieves risk-themed chunks — different retrieval query):\nBear query does not retrieve the planted chunk (it is labeled as a growth fact)\nBear agent does not find the planted evidence in its evidence pool\nResult: MISSED the plant — not fooled, but did not catch it either\n\nCorrect adversarial architecture would have the bear agent explicitly search for claims in the bull report and attempt to find contradicting evidence for each one.",
     subtleVersion:"**Red-Teaming the Evidence Pool**\n\nBeyond planted individual facts, adversarial testing should include planted coherent narratives — internally consistent but factually wrong stories that reinforce a bull or bear thesis. A fake narrative across 5 planted chunks is much harder to detect than a single wrong number because each chunk appears to support the others.\n\nEffective red-team: create a synthetic filing section that is plausible but describes events that did not happen (merger announcement, regulatory approval, product launch). Test whether both agents cite this synthetic evidence as high-confidence.\n\n**Escalation Rules Must Be Pre-Defined**\nThe point of the bull-bear committee is not to reach consensus — it is to identify disagreements that require human judgment. Escalation rules must be written before the system runs in production:\n• Any claim with contradicting evidence from the bear agent → escalate\n• Any high-confidence bull claim with evidence_ids ∩ bear_evidence_ids = ∅ → escalate\n• Any contradiction in financial figures > 5% → escalate automatically",
     warning:"**Trap: Calling a 'Be Critical' Prompt a Bear Agent**\n\nTrap: Building a 'bear agent' by adding 'be critical of this company' to the system prompt of the same LLM that runs the bull agent, then claiming the system is adversarial.\n\nWhy it is insufficient: the model's underlying associations are unchanged. When processing the same retrieved chunks, the 'critical' prompt produces caveats and qualifications — but the fundamental bias toward prominent, media-covered companies persists. Under adversarial conditions (planted positive evidence), the 'critical' version will still be fooled if the bull version is fooled.\n\nDetect: run the planted evidence test. If both agents cite the planted claim, the adversarial design has failed.\n\nFix: build structural asymmetry into the evidence retrieval step, not just the generation step. Asymmetric evidence pools produce genuinely different perspectives.",
     misconception:"**Misconception: 'Two agents produce twice the confidence'**\n\nTwo agents using the same foundation model and similar evidence pools produce approximately the same information, not 2× the information. Their agreement is correlated confirmation, not independent validation.\n\nConsider the mathematical analogy: if two weather sensors are installed next to each other and both read 72°F, you have not confirmed the temperature more strongly than with one sensor — you have confirmed that both sensors work. Independent measurement requires independent instruments measuring independently.\n\nFor AI research committees, independence requires: different retrieval strategies, access to different document types, potentially different model families, and systematic tracking of when they agree vs. disagree (and which was right in retrospect).",
     yourTurn:"**Scenario**: You plant 10 misleading facts across your test company's evidence pool:\n• 5 bullish misinformation items (inflated growth figures)\n• 5 bearish misinformation items (invented regulatory problems)\n\nResults:\n• Bull agent cited 4 of 5 bullish plants (80% fooled rate)\n• Bear agent cited 0 of 5 bearish plants (0% fooled — did not retrieve them)\n• Bear agent caught 1 of 5 bullish plants (20% catch rate)\n\n1. What does the 0% bear-agent-fooled rate actually tell you?\n2. Why is the 20% catch rate the more important metric?\n3. What architectural change would most improve the system?\n\n**Answer**:\n1. The bear agent simply did not retrieve the bearish plants — they were not in its evidence pool. Not being fooled by evidence you never see is not robustness. The bear retrieval is too narrow.\n2. 20% catch rate means 80% of dangerous bull misinformation reaches the human gate without a challenge. That is the failure that matters for investment safety.\n3. Add a cross-checking step: after the bull agent produces citations, have the bear agent explicitly search for contradicting evidence for each cited chunk — not just retrieve from its default evidence pool. This transforms the bear from passive to active adversarial.",
     synthesis:"**Week 10 — Key Takeaways**\n\n☑ LLMs are structurally bullish — media coverage bias is trained into the weights, not a prompt-level issue\n☑ Same-model adversarial prompting produces correlated errors, not independent perspectives\n☑ True adversarial diversity requires asymmetric evidence retrieval — different document pools, not different prompts\n☑ The bull-bear catch rate on planted evidence is the performance metric — agreement rate is not\n☑ Pre-define escalation rules before production: contradiction → human review, always\n\n**Next**: Week 11 integrates every component into a complete platform — with the human approval gate as the most important architectural component.",
     equation:null
    }],
    quiz:{id:'w10-quiz', questions:[
      {id:'w10-q01', type:'multiple_choice', question:"Why do two agents using the same foundation model produce correlated rather than independent errors?", options:['They share API rate limits','They share learned associations from identical training data','They output identical text','They use the same hardware'], correct:1, explanation:"Shared training data means shared biases, blind spots, and failure modes. When both agents fail on a question, they typically fail for the same reason. True adversarial diversity requires structurally different evidence-seeking approaches — not just different prompts on the same model."},
      {id:'w10-q02', type:'scenario', scenario:"Your bear agent has a 15% catch rate on planted misleading bull-case evidence. Your bull agent has an 80% fooled rate by the same planted evidence.", question:"What does this combination reveal, and what is the primary fix?", options:['The bear agent is working — 15% is statistically significant','The system fails: most bull-case misinformation reaches the human gate without challenge. The fix is asymmetric evidence retrieval — bear explicitly searches for contradictions to bull claims.','The planted evidence test is too hard — real evidence would not fool the system','The bull agent should be retrained on more skeptical data'], correct:1, explanation:"15% catch rate means 85% of dangerous misinformation gets through. The bear agent is not retrieving the planted evidence because it uses a different retrieval query. Adding a contradiction-checking step — where the bear agent explicitly retrieves evidence against each bull citation — transforms the architecture from passive to genuinely adversarial."},
      {id:'w10-q03', type:'multiple_choice', question:"When should a bull-bear committee result trigger automatic human escalation?", options:['When both agents agree — consensus may reflect shared bias','When agents disagree on any factual claim, or when bull evidence_ids and bear evidence_ids are entirely disjoint','Only when the financial figures differ by more than 50%','Human review is optional — the committee is sufficient for portfolio decisions'], correct:1, explanation:"Disagreement on factual claims means the evidence is genuinely ambiguous or misleading — exactly the conditions requiring human judgment. Completely disjoint evidence pools means the two agents were never looking at overlapping information, and their apparent agreement or disagreement is not actually about the same evidence. Both conditions are escalation triggers."}
    ]},
    lab:{id:'w10-lab', objective:"Build and test a bull-bear agent committee against planted misinformation.", checks:[{id:'w10-c01',text:'Bull agent implemented: retrieves growth/opportunity chunks, produces structured output with evidence_ids'},{id:'w10-c02',text:'Bear agent implemented: retrieves risk/vulnerability chunks from DIFFERENT retrieval query (not same as bull)'},{id:'w10-c03',text:'10 test cases with planted misleading evidence (5 bullish plants, 5 bearish plants)'},{id:'w10-c04',text:'Bear agent catch rate and bull agent fooled rate measured separately'},{id:'w10-c05',text:'Escalation rules defined and documented: contradiction → human review, high-confidence + disjoint evidence → escalate'}], deliverable:"10_agent_red_team.ipynb + agent evaluation matrix"},
    evidencePrompts:["What percentage of planted misleading claims did the bear agent catch?","What systematic patterns exist in what the bear agent misses?","Is there evidence of correlated failure (both agents fooled by same planted items)?"]
  },

  wk11:{
    mission:{objective:"Integrate all components into a working end-to-end pipeline with a human approval gate between AI recommendations and portfolio execution.",output:"Platform v1.0: ticker → evidence → quant → AI → human gate → weights → audit log.",failCondition:"Skipping the human approval gate or allowing AI agents to directly control portfolio weights.",whatWouldChangeMind:"An audit log showing the human gate prevented at least one problematic AI recommendation."},
    whyItMatters:"Integration is where complexity compounds. The human gate is the most important safeguard — the moment where probabilistic AI recommendations meet deterministic execution and human judgment.",
    lessons:[{id:'w11-l01', title:'The Deterministic Boundary', duration:'7 min', competency:'RESEARCH',
     content:"The most important architectural principle in AI-assisted investing: agents analyze. Deterministic code controls weights and execution. These two layers must never be merged.\n\n**The Two-Layer Architecture**\n\nProbabilistic (AI) layer:\n• LLM analysts and RAG retrieval systems\n• ML cross-sectional rankers\n• Bull-bear agent committee\nThese components produce recommendations, explanations, and evidence citations. They are fundamentally uncertain — they can be wrong, hallucinate, or fail in systematic ways. They should NEVER directly set portfolio weights.\n\nDeterministic (execution) layer:\n• Portfolio optimizer (CVXPY — same inputs always produce same outputs)\n• Position sizing and constraint enforcement\n• Order generation and audit logging\nThis code must be: auditable, reproducible, version-controlled, constraint-enforcing, and independent of any LLM call.\n\n**The Human Approval Gate**\nThe gate sits between the AI recommendation layer and the deterministic execution layer. Its job:\n1. Present AI recommendations with confidence levels and evidence citations\n2. Show constraint status, risk limits, and factor exposures\n3. Surface any bull-bear committee contradictions\n4. Require explicit human approval before execution\n5. Log the full decision context: timestamp, AI recommendation, evidence IDs, human decision\n\n**What the Gate Prevents**\nThe audit log is not bureaucracy — it is the primary mechanism for detecting AI systematic failures. When you review 3 months of logged decisions, you will see patterns: does the AI consistently recommend overweight in sectors where the bear agent found contradicting evidence? Does it recommend ignoring its own high-stated uncertainties? The gate gives you data about the AI's failure modes.",
     mechanics:"# Platform Integration — Data Flow\nclass ResearchPlatform:\n  def __init__(self, edgar_store, rag_pipeline, ml_ranker, optimizer, audit_log):\n    self.store = edgar_store\n    self.rag = rag_pipeline\n    self.ranker = ml_ranker\n    self.optimizer = optimizer\n    self.log = audit_log\n\n  def analyze_ticker(self, ticker, query_date):\n    # LAYER 1: Data (deterministic — PIT-correct EDGAR queries)\n    filings = self.store.query(ticker, as_of=query_date)\n\n    # LAYER 2: Quantitative signal (deterministic)\n    signal_score = self.ranker.score(ticker, features_as_of=query_date)\n\n    # LAYER 3: AI analysis (probabilistic)\n    chunks = self.rag.retrieve(ticker, filings, k=5)\n    bull = build_bull_agent()(chunks, query=f'{ticker} investment thesis')\n    bear = build_bear_agent()(chunks, query=f'{ticker} risk assessment')\n    contradictions = find_contradictions(bull, bear)\n\n    # LAYER 4: Human gate (REQUIRED — never skip)\n    recommendation = HumanGate().present(\n      ticker=ticker, signal=signal_score,\n      bull_case=bull, bear_case=bear,\n      contradictions=contradictions\n    )  # blocks until human approves or rejects\n\n    # LAYER 5: Deterministic execution (only if human approved)\n    if recommendation.approved:\n      weights = self.optimizer.solve(signal_scores, constraints)\n      self.log.record(ticker, query_date, recommendation, weights)  # immutable\n    return weights",
     intuition:"A surgeon's diagnostic tools inform the surgeon who then performs the procedure. The diagnostic images, lab results, and AI-assisted pattern recognition are probabilistic — they can produce false positives and must be interpreted by a trained clinician. The tools never hold the scalpel. This is not a limitation on AI capability — it is an acknowledgment that consequences are asymmetric: a wrong diagnosis followed by human clinical judgment can be caught and corrected; a wrong diagnosis that directly controls the procedure cannot.\n\nThe same asymmetry applies to investment management. An AI recommendation that goes through human review and is rejected costs nothing — you simply do not trade. An AI recommendation that directly executes a position can generate real losses, regulatory violations, or concentration risk that compounds before anyone notices.",
     example:"**A Full End-to-End Flow: One Ticker**\n\nInput: MSFT, query_date = 2024-01-15\n\nLayer 1 — Data: latest 10-K filed 2023-07-27, latest 10-Q filed 2023-10-26\nLayer 2 — Signal: ML ranker score 0.78 (78th percentile cross-sectional rank)\nLayer 3 — AI analysis:\n  Bull: 'Strong Azure growth trajectory, diversified revenue [chunk_id: 000...8-q2-chunk31]'\n  Bear: 'Increased capex for AI infrastructure raises FCF concerns [chunk_id: 000...8-1A-chunk12]'\n  Contradiction: Azure revenue growth figure in bull case (18%) not confirmed by bear agent retrieval\nLayer 4 — Human gate: presents all above + proposed weight 4.2%\n  Human: approves with note 'Azure figure needs verification — reduce to 3.0% until confirmed'\nLayer 5 — Execution: optimizer runs with modified constraint, produces weights summing to 1.0\nAudit log: timestamp 2024-01-15 14:32:07, ticker MSFT, AI proposed 4.2%, human approved 3.0%, evidence_ids listed",
     subtleVersion:"**Audit Log as Feedback Signal**\n\nThe audit log is not just compliance documentation — it is a supervised dataset for improving the AI recommendation layer. For each human decision:\n• Human approved AI recommendation → eventual forward return is a label for 'good recommendation'\n• Human rejected AI recommendation → eventual return on the rejected trade (if tracked) is a label for 'poor recommendation'\n\nAfter 6 months of operation, you have a labeled dataset of (AI recommendation, human decision, forward return). This enables:\n1. Calibration analysis: does AI high-confidence correlate with better forward returns?\n2. Error pattern detection: which types of recommendations are consistently rejected and subsequently correct (human over-rides AI incorrectly)?\n3. Systematic bias detection: does the AI over-recommend one sector or size tier?\n\n**Versioning Discipline**: Every code change to any component (ranker, optimizer, prompt) must be logged with a version number. The audit log must record which version produced each recommendation. Without this, you cannot attribute outcome changes to specific system modifications.",
     warning:"**Trap: Treating the Human Gate as Optional During Development**\n\nTrap: Removing or bypassing the human gate 'for speed' during development or paper-trading, with the intention of adding it back before going live.\n\nWhy it is dangerous: skipping the gate during paper trading means you have no audit data about AI recommendation quality before committing to live operation. You also build habits and mental models that do not include the gate. And the code paths that implement human-gated decisions are untested.\n\nBeyond process discipline: the value of the gate is the data it generates. Every human decision, every override, every flagged contradiction is a labeled data point about your system's failure modes. A paper portfolio run without the gate generates no such data.\n\nFix: implement the gate from day one, even for paper trading. The gate can be a simple command-line prompt that logs inputs and outputs — it does not need to be a polished UI.",
     misconception:"**Misconception: 'The human gate introduces unacceptable latency'**\n\nFor daily or weekly rebalancing strategies, human review time is not a bottleneck. The gate adds minutes to hours of latency to a decision that would otherwise be acted on in milliseconds — and the rebalance trades on end-of-day prices regardless. The latency argument applies only to high-frequency strategies where decisions must be made in milliseconds, which is not this course's scope.\n\nFor longer-frequency fundamental research strategies, a human reviewing AI analysis for 5–15 minutes per position is not a cost — it is due diligence. The alternative (fully automated execution of AI recommendations) is operationally riskier, not faster in any meaningful sense.\n\nThe gate's cost is not latency. The cost is the organizational discipline required to make every team member treat it as non-negotiable.",
     yourTurn:"**Scenario**: Your platform's audit log shows the following pattern over 60 decisions:\n• AI recommended LONG with high confidence: 28 cases\n• Human approved: 19 of 28 (68%)\n• Human rejected 9 of 28 — average forward return of rejected trades: +4.2% (AI was right, human was wrong)\n• Human approved 19 trades — average forward return: +2.1%\n\n1. What does this pattern suggest about your AI system vs. human judgment?\n2. Is this a reason to remove the human gate?\n3. What would you investigate before changing the system?\n\n**Answer**:\n1. The AI's high-confidence recommendations are generating better returns than the ones the human approved — suggesting the human may be applying idiosyncratic preferences that hurt performance, or the AI is picking up a genuine signal the human is overriding.\n2. No — 60 decisions is insufficient statistical evidence to conclude the AI is superior. The forward-return comparison has huge standard error. Also, the audit log contains only one period; regime dependence is unknown.\n3. Investigate why the human rejected those 9 cases — were there undisclosed quality concerns? Were they in a specific sector? Were the bull-bear contradictions unusually high? Build a richer decision-quality model before changing the gate behavior.",
     synthesis:"**Week 11 — Key Takeaways**\n\n☑ Agents analyze — deterministic code executes. These layers must never be merged.\n☑ The human gate is not optional and not just compliance — it generates the feedback data for improving the AI layer\n☑ Every decision must be logged with timestamp, AI inputs, human decision, and evidence IDs\n☑ Version all components — you cannot attribute outcome changes without knowing which system version produced each recommendation\n☑ Audit log patterns reveal AI systematic failures that are invisible in individual recommendations\n\n**Next**: Week 12 freezes everything, writes the preregistered forward-test protocol, and begins the actual test that matters.",
     equation:null
    }],
    quiz:{id:'w11-quiz', questions:[
      {id:'w11-q01', type:'multiple_choice', question:"Which components should NEVER directly control portfolio weights?", options:['The portfolio optimizer','LLM agents and retrieval systems','The audit logging system','The risk limit engine'], correct:1, explanation:"LLM agents are probabilistic — they can be wrong, hallucinate, or produce confident errors. Portfolio weights must be set by deterministic, constraint-enforcing code. The human gate sits between AI recommendations and deterministic execution."},
      {id:'w11-q02', type:'multiple_choice', question:"Why should the human approval gate be implemented during paper trading, not added later before going live?", options:['Regulatory requirement applies to paper trading too','The gate generates audit data about AI failure modes — skipping it means no quality data before live operation','Paper trading is riskier than live trading','The optimizer requires human approval to function'], correct:1, explanation:"Every human decision is a labeled data point about AI recommendation quality. Without gate operation during paper trading, you have no empirical evidence about your system's failure patterns before committing capital. You also leave the gate's code paths untested and fail to build the organizational habits required to use it consistently."},
      {id:'w11-q03', type:'scenario', scenario:"Your audit log shows AI recommendations rejected by humans had better forward returns (+4.2%) than approved recommendations (+2.1%) over 60 decisions.", question:"What is the appropriate response?", options:['Remove the human gate — AI is outperforming human judgment','Investigate why the 9 rejections were made before drawing any conclusions — 60 decisions is insufficient evidence','Increase AI autonomy by reducing human override authority','Add a second human reviewer to prevent these overrides'], correct:1, explanation:"60 decisions has very high standard error for return comparisons. Before concluding the AI is superior, investigate: what were the rejection reasons? Were they in specific sectors? Were there undisclosed concerns? The pattern is a hypothesis requiring investigation, not a policy conclusion."}
    ]},
    lab:{id:'w11-lab', objective:"Wire together the end-to-end research platform.", checks:[{id:'w11-c01',text:'Data pipeline → ML ranker → optimizer connected end-to-end with no manual data hand-offs'},{id:'w11-c02',text:'RAG → bull-bear committee → human gate → optimizer → audit log connected'},{id:'w11-c03',text:'Every decision logged with timestamp, AI inputs/outputs, evidence_ids, human decision, and code version'},{id:'w11-c04',text:'End-to-end test: one full ticker analysis from data query to logged decision completed'}], deliverable:"11_platform_integration.ipynb + end-to-end test run log"},
    evidencePrompts:["Where does the integrated pipeline break most frequently?","What does the audit log reveal about AI recommendation quality over time?","Is every component version-tracked so you can attribute outcomes to specific system states?"]
  },

  wk12:{
    mission:{objective:"Freeze your models, evidence dates, and portfolio rules. Build the final Investment Committee package and defend every position against adversarial questioning.",output:"Final repo + IC deck + paper portfolio + preregistered forward-testing protocol.",failCondition:"Modifying model parameters or evidence dates after seeing final performance results.",whatWouldChangeMind:"Consistent preregistered forward-test performance after the research is completely frozen."},
    whyItMatters:"Week 12 is not the end — it is the start of the real test. Every model here will eventually face live market data not seen during research. The strength of your package is determined by process discipline, not backtest beauty.",
    lessons:[{id:'w12-l01', title:'Why 12 Weeks Is Not a Track Record', duration:'7 min', competency:'RESEARCH',
     content:"A credible investment track record requires years of live performance data. Twelve weeks of research — even with rigorous PIT data and robust backtesting — establishes a methodology, not an edge. This distinction matters.\n\n**What a Backtest Proves and Does Not Prove**\n\nA well-constructed backtest proves: you can operationalize a hypothesis in code. You understand data timestamp rules. You did not overfit to a narrow parameter corner. You understand what drove historical returns. None of this is worthless — it is the prerequisite for finding genuine alpha.\n\nA backtest does not prove: the signal will persist forward. The historical period is representative of future market regimes. The strategy is economically viable at realistic costs and capacity. The effect survives publication (factor zoo decay documented by McLean & Pontiff, 2016).\n\n**Parametric Look-Ahead Bias in LLM Strategies**\nA unique and severe risk for AI-assisted research: LLMs trained through a recent date have memorized outcomes from historical periods you are testing. An LLM 'analyzing' a company's 2019 10-K may produce insights that reflect training on 2021 news about what that company subsequently did — not genuine analysis of 2019 information. This is parametric look-ahead bias (Summoning the Oracle to Slay It, 2026): the AI model's parameters contain future knowledge that the strategy's historical analysis appears to have 'discovered.'\n\n**Preregistration: The Single Most Important Discipline**\nPreregistration requires committing in writing, before observing any forward results, to:\n• The exact model specification (frozen parameters, frozen evidence dates)\n• What success looks like (CAGR threshold, IR threshold, benchmark comparison)\n• What failure looks like (drawdown threshold, IC decay trigger, regime conditions)\n• When you will abandon the strategy\n\nA strategy without a preregistered stopping condition can be kept running indefinitely, surviving failures on the logic that 'the regime was wrong' or 'the model needs more time.' This is the equivalent of never-ending hypothesis testing with perpetual excuse generation.",
     mechanics:"# Preregistration Template (write BEFORE observing forward data)\n\nPREREGISTRATION DATE: {today}\nFORWARD TEST START: {today + 1 month}\nFORWARD TEST END: {today + 13 months}\n\n# Frozen model specification\nMODEL VERSION: git commit hash {hash}\nDATA VERSION: EDGAR store snapshot {timestamp}\nUNIVERSE: S&P 500 constituent list as of {today} (FROZEN — no additions)\n\n# Success criteria (pre-specified — cannot be revised after forward test begins)\nSUCCESS = (\n  net_cagr(forward_12mo) > equal_weight_cagr(forward_12mo) + 0.02  # +200bps over baseline\n  AND information_ratio(monthly_excess_returns) >= 0.30\n  AND max_drawdown(forward_12mo) < 0.20  # less than 20%\n)\n\n# Stopping conditions (pre-specified)\nIMMEDIATE_STOP_IF = (\n  drawdown > 0.15  # 15% peak-to-trough at any point\n  OR monthly_ic_rolling_3mo < -0.02  # signal has reversed\n  OR any_factor_exposure > 1.5  # unexpected factor concentration\n)\n\n# Revision rules\nMODEL_PARAMETERS: cannot be changed after forward test begins\nEVIDENCE_DATES: cannot be amended retroactively\nSUCCESS_CRITERIA: cannot be weakened after forward data observed",
     intuition:"A beautiful 12-week backtest is like a perfect practice round before the actual tournament. It proves you understand the rules, can execute the shots, and have studied the course. But the tournament is played with real stakes, real opponents, and real uncertainty — against market participants who have also been preparing, many with far more resources.\n\nPreregistration is how you separate genuine prediction from post-hoc rationalization. Anyone can explain why a strategy worked after seeing the results. Only pre-specified, timestamped predictions can distinguish skill from luck. This is why academic journals now require preregistration for clinical trials and, increasingly, for empirical finance papers. Your forward test without preregistration is anecdote. Your forward test with preregistration is evidence.",
     example:"**Preregistration Statement: Written Before Observing Forward Data**\n\nWritten: January 15, 2025\nStrategy: Week 7 Constrained Optimizer with Week 3 cross-sectional ranker\nForward test period: February 1, 2025 – January 31, 2026\n\nSuccess criterion:\n'This strategy will be considered to have shown statistical evidence of value if, over the 12-month forward period beginning February 1, 2025, the paper portfolio net CAGR (after 20 bps round-trip assumed costs) exceeds the simultaneously tracked equal-weight paper portfolio CAGR by ≥ 2.0%, AND the rolling 12-month information ratio of monthly excess returns is ≥ 0.30.'\n\nStopping condition:\n'The strategy will be paused for mandatory review if peak-to-trough drawdown exceeds 15% at any point during the forward period, or if the rolling 3-month rank-IC falls below -0.02 for two consecutive months.'\n\nThis statement was timestamped and stored in the Git commit log before February 1 data was observed. It cannot be revised after February 1.",
     subtleVersion:"**McLean & Pontiff (2016): Factor Zoo Decay**\n\nA landmark study documented that anomaly returns drop by ~32% post-publication, and a further fraction from the date of data collection. The mechanism: publication reveals the signal to arbitrageurs who trade against it, reducing profitability. This implies that even genuinely out-of-sample backtests suffer from a form of look-ahead bias — the research community's awareness of the signal class already occurred by the time your test begins.\n\nFor LLM-based strategies, the decay mechanism is especially severe: LLM training data includes published factor research, analyst reports, and earnings call summaries that may describe the patterns you are trying to 'discover.'\n\n**Statistical Power of 12-Month Forward Tests**\nA 12-month forward test with monthly rebalancing gives 12 monthly return observations. The standard error of a Sharpe ratio estimate with 12 observations is √(1 + SR²/2)/√12 ≈ 0.30 for SR=0.5. The 95% CI is [SR − 0.59, SR + 0.59]. You cannot reject zero alpha with this precision. Plan for a 36-month forward test as the minimum for statistically meaningful evidence.",
     warning:"**Trap: Modifying the Model After Observing Forward Performance**\n\nTrap: Running a forward test, observing that returns in months 4–6 are below expectations, 'debugging' the model by adjusting a feature weight or adding a regime filter, and continuing to call the result a 'forward test.'\n\nWhy it is fatal: any model modification after observing forward results converts subsequent forward performance into in-sample performance. The evaluation is contaminated. The original 12 months of forward data that prompted the change becomes part of the model's training universe, however indirectly.\n\nThis is the most common failure mode in live strategy management. Every practitioner knows it is wrong. Almost every practitioner eventually does it under business pressure.\n\nFix: preregistration with explicit modification rules. The preregistered document must state: 'Any modification to model parameters, data sources, or universe rules after the forward test start date voids the evaluation and requires a new 12-month forward test from a new start date.'",
     misconception:"**Misconception: 'I can start a forward test and evaluate monthly as it progresses'**\n\nMonthly evaluation of an active forward test introduces a form of continuous multiple testing. If you evaluate performance monthly and would stop or modify the strategy based on any given month's observation, you are running 12 sequential hypothesis tests — each at 5% significance — giving a family-wise error rate far above 5%.\n\nThe Bonferroni correction for 12 tests requires each individual test significance level to be 0.05/12 ≈ 0.4%. The practical implication: do not treat monthly forward test results as evidence of anything. The only valid evaluation point is the preregistered end date, evaluated against preregistered success criteria.\n\nYou can and should monitor for stopping conditions (15% drawdown trigger, IC reversal) during the forward test. But this is risk management, not evaluation. The evaluation happens once, at the end.",
     yourTurn:"**Scenario**: Your forward test results at month 6:\n• Net CAGR (annualized): +5.2% vs. baseline +8.1% (strategy is underperforming)\n• Rolling 3-month IC: +0.02 (barely positive)\n• Max drawdown: -8% (within the 15% limit)\n• Factor exposure check: all within limits\n\nYour preregistered success criteria required net CAGR > baseline + 2%.\n\n1. Have any stopping conditions been triggered?\n2. Should you modify the model to try to improve performance?\n3. What is the correct action?\n\n**Answer**:\n1. No stopping conditions triggered — drawdown is -8% (limit is 15%), IC is positive (limit is -0.02). Rolling 3-month IC at +0.02 is thin but positive.\n2. No — absolutely not. Modifying the model after observing that month-6 performance is below expectations converts all subsequent performance into in-sample. The preregistration prohibits this.\n3. Continue to the preregistered end date (month 12) without modification. Underperformance at month 6 is expected variance — 12 months of monthly observations have enormous uncertainty. Document your observation in a log, but do not act on it. The evaluation happens at month 12 against the preregistered criteria.",
     synthesis:"**Week 12 — Key Takeaways**\n\n☑ 12 weeks of research produces a methodology and hypothesis — not a track record or proof of edge\n☑ Parametric look-ahead bias is unique to LLM strategies: model weights may contain future knowledge about historical periods\n☑ Preregistration is the single most important discipline: commit to success criteria and stopping conditions before observing forward data\n☑ Factor zoo decay (McLean & Pontiff): published anomalies lose ~32% of returns post-publication — replications are always less valuable than original discovery\n☑ The only valid evaluation point is the preregistered end date — monthly monitoring is risk management, not evaluation\n\n**This is the beginning**: the research platform is built, the methodology is documented, and the real test has started. Evidence-based alpha discovery is a years-long process — this course built the foundation.",
     equation:null
    }],
    quiz:{id:'w12-quiz', questions:[
      {id:'w12-q01', type:'multiple_choice', question:"What is 'parametric look-ahead bias' in LLM-based backtesting?", options:['Using too many hyperparameters','LLM training data containing outcomes from the backtest period — making past predictions informed by future knowledge','Running too many parameter combinations','Not adjusting for lookback period'], correct:1, explanation:"LLMs trained through a recent date may 'know' which companies succeeded, failed, merged, or made notable decisions during a historical backtest period. This means the model's apparent historical insights may reflect training data memorization rather than genuine signal discovery — a subtle but severe form of look-ahead bias."},
      {id:'w12-q02', type:'multiple_choice', question:"McLean & Pontiff (2016) found that anomaly returns after publication dropped by approximately what fraction?", options:['~5%','~32%','~65%','~90%'], correct:1, explanation:"~32% — returns decline post-publication as arbitrageurs discover and trade against the anomaly. A further fraction decays even before publication once a researcher uses data collected by others who are aware of the pattern. Any strategy replicating published factor research starts with a head start disadvantage."},
      {id:'w12-q03', type:'scenario', scenario:"At month 7 of your forward test, strategy is underperforming the baseline. You identify a new feature that would have significantly improved the backtest. You add it, call months 8-12 a 'forward test of the improved model.'", question:"What has occurred?", options:['A valid iterative improvement — research should be adaptive','The forward test is contaminated — months 1-7 (which prompted the change) are now in-sample for the new model. The evaluation is invalidated.','The improvement is valid only if back-tested independently','The improvement is valid because the first 7 months are still OOS'], correct:1, explanation:"Any modification triggered by observing forward results converts subsequent forward performance into in-sample. Months 1-7 of underperformance became training signal for the new model. The only valid path is to freeze the original model through the preregistered end date and start a new 12-month forward test for the improved model from scratch."}
    ]},
    lab:{id:'w12-lab', objective:"Produce the final Investment Committee package.", checks:[{id:'w12-c01',text:'All models frozen with documented version hashes (git commit SHA recorded)'},{id:'w12-c02',text:'Evidence dates frozen — EDGAR store snapshot timestamped, no post-hoc additions'},{id:'w12-c03',text:'Final paper portfolio positions documented: thesis + disconfirming evidence for each position'},{id:'w12-c04',text:'Forward-testing protocol preregistered (timestamped, committed to repo) before any forward data observed'},{id:'w12-c05',text:'Preregistration includes: success criteria, stopping conditions, and modification prohibition rule'}], deliverable:"12_final_ic.ipynb + IC deck + preregistered forward test protocol"},
    evidencePrompts:["What is the strongest argument against your final strategy?","Under what conditions would you expect the strategy to fail?","What is your preregistered forward-test stopping condition?"]
  }
};

/* ── Pure helpers ── */
function getWkProgress(course, wkId){
  return (course.weekProgress||{})[wkId] || {};
}
function calcWeekCompletion(wk, prog, content){
  if(!content) return wk.done ? 100 : 0;
  const lessons = content.lessons || [];
  const labChecks = content.lab?.checks || [];
  const quizQs = content.quiz?.questions || [];
  const lessonsDone = lessons.filter(l=>(prog.lessonsRead||[]).includes(l.id)).length;
  const labDone = labChecks.filter(c=>(prog.labChecks||[]).includes(c.id)).length;
  const hasAttemptedQuiz = (prog.quizAttempts||[]).length > 0;
  const delivDone = prog.deliverableDone;
  let score = 0, total = 0;
  if(lessons.length){ score += lessonsDone; total += lessons.length; }
  if(labChecks.length){ score += labDone; total += labChecks.length; }
  if(quizQs.length){ score += hasAttemptedQuiz ? 1 : 0; total += 1; }
  if(total){ score += delivDone ? 1 : 0; total += 1; }
  return total ? Math.round(100*score/total) : (wk.done?100:0);
}
function calcWeekMastery(prog, content){
  if(!content) return 0;
  const lessons = content.lessons || [];
  const labChecks = content.lab?.checks || [];
  const quizQs = content.quiz?.questions || [];
  const lessonPct = lessons.length ? (prog.lessonsRead||[]).filter(id=>lessons.find(l=>l.id===id)).length / lessons.length : 0;
  const labPct = labChecks.length ? (prog.labChecks||[]).filter(id=>labChecks.find(c=>c.id===id)).length / labChecks.length : 0;
  const bestScore = (prog.quizAttempts||[]).reduce((best,a)=>Math.max(best,a.score||0),0);
  const quizPct = quizQs.length ? bestScore / quizQs.length : 0;
  const bullBearPct = ((prog.bullCase||'').length>20 && (prog.bearCase||'').length>20) ? 1 : 0;
  return Math.round(100*(0.30*lessonPct + 0.35*quizPct + 0.25*labPct + 0.10*bullBearPct));
}
function totalCourseXP(weekProgressMap, allContent){
  let xp = 0;
  Object.entries(weekProgressMap||{}).forEach(([wkId, prog])=>{
    const content = allContent[wkId];
    if(!content) return;
    xp += (prog.lessonsRead||[]).length * 10;
    const best = (prog.quizAttempts||[]).reduce((b,a)=>Math.max(b,a.score||0),0);
    const total = (content.quiz?.questions||[]).length;
    if(best>0) xp += total>0 && best===total ? 50 : 20;
    const labPct = content.lab?.checks?.length ? (prog.labChecks||[]).length/content.lab.checks.length : 0;
    if(labPct>=1) xp += 40;
    else if(labPct>=0.5) xp += 20;
    if(prog.deliverableDone) xp += 100;
    xp += (prog.evidenceItems||[]).length * 15;
  });
  return xp;
}

/* ─────────────────── WEEK WORKSPACE ─────────────────── */
function WeekWorkspace({wk, content, prog, onProgress, onBack, isMobile}){
  const [wsTab, setWsTab] = useState('overview');
  const [lessonOpen, setLessonOpen] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [evidenceDraft, setEvidenceDraft] = useState({claim:'',for:'',against:'',confidence:'medium',notes:''});
  const [journalDraft, setJournalDraft] = useState('');
  const [showJournal, setShowJournal] = useState(false);

  const phaseColor = wk.num<=2?'#6366f1':wk.num<=4?'#8b5cf6':wk.num<=6?'#3b82f6':wk.num<=8?'#10b981':wk.num<=10?'#f59e0b':'#f97316';
  const completion = calcWeekCompletion(wk, prog, content);
  const mastery = calcWeekMastery(prog, content);
  const lessons = content?.lessons || [];
  const quizQs  = content?.quiz?.questions || [];
  const labChecks = content?.lab?.checks || [];

  function markLessonRead(id){
    const next = [...new Set([...(prog.lessonsRead||[]), id])];
    onProgress({lessonsRead: next});
  }
  function toggleLabCheck(id){
    const curr = prog.labChecks || [];
    const next = curr.includes(id) ? curr.filter(x=>x!==id) : [...curr, id];
    onProgress({labChecks: next});
  }
  function submitQuiz(){
    if(Object.keys(quizAnswers).length < quizQs.length){ return; }
    const score = quizQs.filter(q=>quizAnswers[q.id]===q.correct).length;
    const attempt = {score, answers:quizAnswers, total:quizQs.length, ts:new Date().toISOString()};
    const prevAttempts = prog.quizAttempts || [];
    onProgress({quizAttempts:[...prevAttempts, attempt]});
    setQuizSubmitted(true);
  }
  function retryQuiz(){ setQuizAnswers({}); setQuizSubmitted(false); }
  function addEvidence(){
    if(!evidenceDraft.claim.trim()) return;
    const items = [...(prog.evidenceItems||[]), {...evidenceDraft, id:uid(), ts:new Date().toISOString()}];
    onProgress({evidenceItems:items});
    setEvidenceDraft({claim:'',for:'',against:'',confidence:'medium',notes:''});
  }
  function removeEvidence(id){ onProgress({evidenceItems:(prog.evidenceItems||[]).filter(e=>e.id!==id)}); }
  function addJournal(){
    if(!journalDraft.trim()) return;
    const entries = [...(prog.journal||[]), {id:uid(), text:journalDraft, ts:new Date().toISOString(), context:wsTab}];
    onProgress({journal:entries});
    setJournalDraft('');
  }

  const bestScore = (prog.quizAttempts||[]).reduce((b,a)=>Math.max(b,a.score||0),0);
  const latestAttempt = (prog.quizAttempts||[]).slice(-1)[0];

  const TABS = [
    {id:'overview',label:'Overview'},
    {id:'learn',label:'Learn'},
    {id:'lab',label:'Lab'},
    {id:'test',label:'Test'},
    {id:'evidence',label:'Evidence'},
    {id:'submit',label:'Submit'},
  ];

  return (
    <div>
      {/* Workspace header */}
      <div className="mb-4">
        <button onClick={onBack} className="text-xs mb-3 flex items-center gap-1.5" style={{color:phaseColor}}>← Back to Missions</button>
        <div className="glass rounded-xl p-4" style={{border:`1px solid ${wk.bossFight?'rgba(239,68,68,0.3)':phaseColor+'30'}`}}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl w-10 text-center">{wk.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{color:phaseColor}}>Week {wk.num} · {wk.phase}</div>
              <div className="text-lg font-bold" style={{color:'#e2e8f0'}}>{wk.name}</div>
              <div className="text-xs mt-1" style={{color:'#475569'}}>{wk.hours} · {content?.lessons?.length||0} lessons · {labChecks.length} lab checks</div>
              {wk.bossFight && <div className="text-xs mt-1 font-bold" style={{color:'#f87171'}}>⚔️ Boss Fight Week</div>}
            </div>
          </div>
          {/* Completion vs Mastery */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <div className="flex justify-between text-xs mb-1"><span style={{color:'#475569'}}>Completion</span><span style={{color:'#64748b'}}>{completion}%</span></div>
              <div style={{height:'5px',background:'rgba(255,255,255,0.05)',borderRadius:'3px',overflow:'hidden'}}>
                <div style={{width:`${completion}%`,height:'100%',background:'#10b981',borderRadius:'3px',transition:'width .3s'}}/>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span style={{color:'#475569'}}>Mastery</span><span style={{color:'#64748b'}}>{mastery}%</span></div>
              <div style={{height:'5px',background:'rgba(255,255,255,0.05)',borderRadius:'3px',overflow:'hidden'}}>
                <div style={{width:`${mastery}%`,height:'100%',background:phaseColor,borderRadius:'3px',transition:'width .3s'}}/>
              </div>
            </div>
          </div>
          <div className="text-xs mt-2" style={{color:'#334155'}}>Completion ≠ Mastery. Clicking labs and lessons builds completion. Quiz scores, Bull/Bear analysis, and evidence quality build mastery.</div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mb-4" style={{overflowX:'auto'}}>
        <div className="flex gap-0.5 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',minWidth:'max-content'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setWsTab(t.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={{background:wsTab===t.id?`${phaseColor}20`:'transparent',color:wsTab===t.id?phaseColor:'#475569',border:wsTab===t.id?`1px solid ${phaseColor}40`:'1px solid transparent'}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {wsTab==='overview' && content && (
        <div className="space-y-3">
          {/* Mission brief */}
          <div className="rounded-xl p-4" style={{background:'rgba(0,0,0,0.3)',border:`1px solid ${phaseColor}30`}}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:phaseColor}}>Mission Brief</div>
            <div className="text-sm font-medium mb-2" style={{color:'#e2e8f0'}}>{content.mission.objective}</div>
            <div className="space-y-2">
              {[['Your Output',content.mission.output,'#10b981'],['Fail Condition',content.mission.failCondition,'#ef4444'],['Evidence That Changes Your Mind',content.mission.whatWouldChangeMind,'#6366f1']].map(([label,text,c])=>(
                <div key={label} className="text-xs p-2.5 rounded-lg" style={{background:`${c}08`,border:`1px solid ${c}20`}}>
                  <div className="font-semibold mb-0.5" style={{color:c}}>{label}</div>
                  <div style={{color:'#94a3b8'}}>{text}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Why it matters */}
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:'#475569'}}>Why This Matters</div>
            <div className="text-sm leading-relaxed" style={{color:'#94a3b8'}}>{content.whyItMatters}</div>
          </div>
          {/* Objectives */}
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:phaseColor}}>Learning Objectives</div>
            <ul className="space-y-1.5">
              {(wk.objectives||[]).map((o,i)=>(
                <li key={i} className="flex items-start gap-2 text-xs" style={{color:'#94a3b8'}}>
                  <span style={{color:phaseColor,flexShrink:0}}>▸</span>{o}
                </li>
              ))}
            </ul>
          </div>
          {/* No-Time-Machine check */}
          <div className="p-3 rounded-xl" style={{background:'rgba(139,92,246,0.06)',border:'1px solid rgba(139,92,246,0.2)'}}>
            <div className="text-xs font-bold mb-1" style={{color:'#a78bfa'}}>⏳ No-Time-Machine Check</div>
            <div className="text-xs" style={{color:'#7c3aed'}}>Every feature, filing, and data point used in this week must satisfy: available_at ≤ decision_time. No exceptions.</div>
          </div>
          {/* Boss Fight briefing */}
          {wk.bossFight && (
            <div className="p-4 rounded-xl" style={{background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.25)'}}>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:'#f87171'}}>⚔️ Boss Fight Briefing</div>
              <div className="text-sm" style={{color:'#f87171'}}>You will receive a suspiciously profitable strategy or misleading evidence. Your job: diagnose exactly why it is wrong before it corrupts your portfolio. Hint: the most dangerous errors are subtle. Look for timing, survivorship, and parameter selection issues first.</div>
              <div className="mt-2 text-xs" style={{color:'#ef4444'}}>After submission: the After-Action Review will reveal what was deliberately planted.</div>
            </div>
          )}
        </div>
      )}
      {wsTab==='overview' && !content && (
        <div className="glass rounded-xl p-6 text-center" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="text-sm" style={{color:'#334155'}}>Week content is loading. Mark complete or check objectives above.</div>
        </div>
      )}

      {/* ── LEARN TAB ── */}
      {wsTab==='learn' && (
        <div className="space-y-3">
          {!lessons.length && <div className="text-sm text-center py-6" style={{color:'#334155'}}>No lessons defined for this week yet.</div>}
          {lessons.map(lesson=>{
            const isRead = (prog.lessonsRead||[]).includes(lesson.id);
            const isOpen = lessonOpen===lesson.id;
            return (
              <div key={lesson.id} className="glass rounded-xl" style={{border:`1px solid ${isRead?phaseColor+'30':'rgba(255,255,255,0.06)'}`}}>
                <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={()=>setLessonOpen(isOpen?null:lesson.id)}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{background:isRead?`${phaseColor}20`:'rgba(255,255,255,0.04)',border:`1px solid ${isRead?phaseColor+'40':'rgba(255,255,255,0.08)'}`,color:isRead?phaseColor:'#475569'}}>
                    {isRead?'✓':'📖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{color:'#e2e8f0'}}>{lesson.title}</div>
                    <div className="text-xs mt-0.5" style={{color:'#475569'}}>{lesson.duration} · {lesson.competency}</div>
                  </div>
                  <span style={{color:'#334155',fontSize:'11px'}}>{isOpen?'▲':'▼'}</span>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3" style={{borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                    <div className="h-1"/>
                    {/* Main content */}
                    <div className="text-sm leading-relaxed whitespace-pre-line" style={{color:'#94a3b8'}}>{lesson.content}</div>
                    {/* Mechanics */}
                    {lesson.mechanics && (
                      <div className="p-3 rounded-lg" style={{background:'rgba(6,182,212,0.06)',border:'1px solid rgba(6,182,212,0.18)'}}>
                        <div className="text-xs font-bold mb-2" style={{color:'#22d3ee'}}>⚙ Mechanics</div>
                        <div className="text-xs leading-relaxed whitespace-pre-line font-mono" style={{color:'#67e8f9'}}>{lesson.mechanics}</div>
                      </div>
                    )}
                    {/* Intuition */}
                    {lesson.intuition && (
                      <div className="p-3 rounded-lg" style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)'}}>
                        <div className="text-xs font-bold mb-2" style={{color:'#818cf8'}}>💡 Intuition</div>
                        <div className="text-xs leading-relaxed whitespace-pre-line" style={{color:'#a5b4fc'}}>{lesson.intuition}</div>
                      </div>
                    )}
                    {/* Example */}
                    {lesson.example && (
                      <div className="p-3 rounded-lg" style={{background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.15)'}}>
                        <div className="text-xs font-bold mb-2" style={{color:'#10b981'}}>Worked Example</div>
                        <div className="text-xs leading-relaxed whitespace-pre-line font-mono" style={{color:'#6ee7b7'}}>{lesson.example}</div>
                      </div>
                    )}
                    {/* Subtle Version */}
                    {lesson.subtleVersion && (
                      <div className="p-3 rounded-lg" style={{background:'rgba(139,92,246,0.07)',border:'1px solid rgba(139,92,246,0.2)'}}>
                        <div className="text-xs font-bold mb-2" style={{color:'#a78bfa'}}>🔍 Subtle Version</div>
                        <div className="text-xs leading-relaxed whitespace-pre-line" style={{color:'#c4b5fd'}}>{lesson.subtleVersion}</div>
                      </div>
                    )}
                    {/* Equation */}
                    {lesson.equation && (
                      <div className="p-3 rounded-lg" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                        <div className="text-xs font-bold mb-2" style={{color:'#475569'}}>Formula</div>
                        <div className="text-sm font-mono whitespace-pre-line" style={{color:'#c7d2fe'}}>{lesson.equation}</div>
                      </div>
                    )}
                    {/* Warning */}
                    {lesson.warning && (
                      <div className="p-3 rounded-lg" style={{background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.2)'}}>
                        <div className="text-xs font-bold mb-2" style={{color:'#f59e0b'}}>⚠ Research Trap</div>
                        <div className="text-xs leading-relaxed whitespace-pre-line" style={{color:'#fcd34d'}}>{lesson.warning}</div>
                      </div>
                    )}
                    {/* Common Misconception */}
                    {lesson.misconception && (
                      <div className="p-3 rounded-lg" style={{background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.18)'}}>
                        <div className="text-xs font-bold mb-2" style={{color:'#f87171'}}>✗ Common Misconception</div>
                        <div className="text-xs leading-relaxed whitespace-pre-line" style={{color:'#fca5a5'}}>{lesson.misconception}</div>
                      </div>
                    )}
                    {/* Your Turn */}
                    {lesson.yourTurn && (
                      <div className="p-3 rounded-lg" style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)'}}>
                        <div className="text-xs font-bold mb-2" style={{color:'#fbbf24'}}>◎ Your Turn</div>
                        <div className="text-xs leading-relaxed whitespace-pre-line" style={{color:'#fde68a'}}>{lesson.yourTurn}</div>
                      </div>
                    )}
                    {/* Synthesis */}
                    {lesson.synthesis && (
                      <div className="p-3 rounded-lg" style={{background:'rgba(16,185,129,0.05)',border:'1px solid rgba(16,185,129,0.18)'}}>
                        <div className="text-xs font-bold mb-2" style={{color:'#34d399'}}>✦ Key Takeaway</div>
                        <div className="text-xs leading-relaxed whitespace-pre-line" style={{color:'#6ee7b7'}}>{lesson.synthesis}</div>
                      </div>
                    )}
                    {/* Mark read */}
                    <button onClick={()=>markLessonRead(lesson.id)} className="w-full py-2 rounded-lg text-xs font-bold transition-all"
                      style={{background:isRead?'rgba(16,185,129,0.08)':'rgba(99,102,241,0.15)',color:isRead?'#10b981':'#818cf8',border:`1px solid ${isRead?'rgba(16,185,129,0.25)':'rgba(99,102,241,0.3)'}`}}>
                      {isRead?'✓ Lesson Read':'Mark as Read +10 XP'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {/* Journal prompt */}
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-widest" style={{color:'#475569'}}>Research Journal</div>
              <button onClick={()=>setShowJournal(!showJournal)} className="text-xs" style={{color:'#475569'}}>{showJournal?'▲':'▼'}</button>
            </div>
            {showJournal && (
              <div className="space-y-2">
                <div className="text-xs" style={{color:'#334155'}}>What surprised you? What assumption are you least confident about?</div>
                <textarea rows={3} value={journalDraft} onChange={e=>setJournalDraft(e.target.value)} className="w-full bg-transparent text-xs rounded-lg p-2.5 resize-none" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}} placeholder="Your observation..."/>
                <button onClick={addJournal} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(255,255,255,0.06)',color:'#94a3b8'}}>Save Note</button>
                {(prog.journal||[]).filter(j=>j.context==='learn').map(j=>(
                  <div key={j.id} className="text-xs p-2 rounded" style={{background:'rgba(255,255,255,0.02)',color:'#64748b'}}>{j.text}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LAB TAB ── */}
      {wsTab==='lab' && (
        <div className="space-y-3">
          {content?.lab ? (
            <>
              <div className="glass rounded-xl p-4" style={{border:`1px solid ${phaseColor}20`}}>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:phaseColor}}>Lab Objective</div>
                <div className="text-sm leading-relaxed" style={{color:'#94a3b8'}}>{content.lab.objective}</div>
                {content.lab.dataset && <div className="text-xs mt-2" style={{color:'#475569'}}>Dataset: {content.lab.dataset}</div>}
              </div>
              {/* Steps */}
              {(content.lab.steps||[]).length>0 && (
                <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#475569'}}>Steps</div>
                  <ol className="space-y-2">
                    {(content.lab.steps||[]).map((step,i)=>(
                      <li key={i} className="flex items-start gap-2 text-xs" style={{color:'#94a3b8'}}>
                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs" style={{background:'rgba(255,255,255,0.04)',color:'#475569'}}>{i+1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {/* Interactive validation checklist */}
              <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-widest" style={{color:'#475569'}}>Validation Checklist</div>
                  <div className="text-xs font-semibold" style={{color:(prog.labChecks||[]).filter(id=>labChecks.find(c=>c.id===id)).length===labChecks.length&&labChecks.length>0?'#10b981':'#475569'}}>
                    {(prog.labChecks||[]).filter(id=>labChecks.find(c=>c.id===id)).length}/{labChecks.length}
                  </div>
                </div>
                <div className="space-y-2">
                  {labChecks.map(check=>{
                    const checked = (prog.labChecks||[]).includes(check.id);
                    return (
                      <label key={check.id} className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg" style={{background:checked?'rgba(16,185,129,0.04)':'rgba(255,255,255,0.01)',border:`1px solid ${checked?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.04)'}`}}>
                        <input type="checkbox" checked={checked} onChange={()=>toggleLabCheck(check.id)} className="flex-shrink-0 mt-0.5" style={{accentColor:'#10b981'}}/>
                        <span className="text-xs leading-relaxed" style={{color:checked?'#6ee7b7':'#94a3b8',textDecoration:checked?'line-through':'none'}}>{check.text}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-3 p-2.5 rounded-lg text-xs" style={{background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.15)',color:'#f59e0b'}}>
                  ⚠ Checking boxes = completion. Passing the checks correctly = mastery. These are not the same.
                </div>
              </div>
              {/* Deliverable */}
              {content.lab.deliverable && (
                <div className="glass rounded-xl p-4" style={{border:`1px solid ${phaseColor}20`,background:`${phaseColor}04`}}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{color:phaseColor}}>Deliverable</div>
                  <div className="text-xs leading-relaxed" style={{color:'#94a3b8'}}>{content.lab.deliverable}</div>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-center py-6" style={{color:'#334155'}}>Lab content for this week is being finalized.</div>
          )}
        </div>
      )}

      {/* ── TEST TAB ── */}
      {wsTab==='test' && (
        <div className="space-y-3">
          {!quizQs.length ? (
            <div className="text-sm text-center py-6" style={{color:'#334155'}}>Knowledge check for this week coming soon.</div>
          ) : (
            <>
              {/* Score history */}
              {(prog.quizAttempts||[]).length>0 && (
                <div className="glass rounded-xl p-3 flex items-center gap-4" style={{border:`1px solid ${phaseColor}25`}}>
                  <div className="text-xs"><span style={{color:'#475569'}}>Best: </span><span className="font-bold" style={{color:phaseColor}}>{bestScore}/{quizQs.length}</span></div>
                  <div className="text-xs"><span style={{color:'#475569'}}>Attempts: </span><span style={{color:'#94a3b8'}}>{(prog.quizAttempts||[]).length}</span></div>
                  {(prog.quizAttempts||[]).length>0 && <button onClick={retryQuiz} className="ml-auto text-xs px-2 py-1 rounded" style={{color:'#6366f1',border:'1px solid rgba(99,102,241,0.2)'}}>Retry</button>}
                </div>
              )}
              {/* Questions */}
              {quizQs.map((q,qi)=>(
                <div key={q.id} className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{color:'#475569'}}>Question {qi+1}</div>
                  {q.scenario && (
                    <div className="p-2.5 rounded-lg mb-3 text-xs leading-relaxed" style={{background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.12)',color:'#94a3b8'}}>{q.scenario}</div>
                  )}
                  <div className="text-sm font-medium mb-3" style={{color:'#e2e8f0'}}>{q.question}</div>
                  <div className="space-y-2">
                    {q.options.map((opt,oi)=>{
                      const selected = quizAnswers[q.id]===oi;
                      const correct = quizSubmitted && oi===q.correct;
                      const wrong = quizSubmitted && selected && oi!==q.correct;
                      return (
                        <button key={oi} onClick={()=>!quizSubmitted&&setQuizAnswers(a=>({...a,[q.id]:oi}))}
                          className="w-full text-left text-xs p-2.5 rounded-lg transition-all"
                          style={{background:correct?'rgba(16,185,129,0.12)':wrong?'rgba(239,68,68,0.1)':selected?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.02)',
                            border:`1px solid ${correct?'rgba(16,185,129,0.4)':wrong?'rgba(239,68,68,0.3)':selected?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.05)'}`,
                            color:correct?'#10b981':wrong?'#ef4444':selected?'#a5b4fc':'#94a3b8',cursor:quizSubmitted?'default':'pointer'}}>
                          {String.fromCharCode(65+oi)}. {opt}
                        </button>
                      );
                    })}
                  </div>
                  {quizSubmitted && (
                    <div className="mt-3 p-3 rounded-lg text-xs leading-relaxed" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',color:'#64748b'}}>
                      <span className="font-bold" style={{color:'#94a3b8'}}>Explanation: </span>{q.explanation}
                    </div>
                  )}
                </div>
              ))}
              {!quizSubmitted ? (
                <button onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length<quizQs.length}
                  className="w-full py-3 rounded-xl text-sm font-bold"
                  style={{background:Object.keys(quizAnswers).length<quizQs.length?'rgba(255,255,255,0.04)':'rgba(99,102,241,0.2)',color:Object.keys(quizAnswers).length<quizQs.length?'#334155':'#818cf8',border:`1px solid ${Object.keys(quizAnswers).length<quizQs.length?'rgba(255,255,255,0.06)':'rgba(99,102,241,0.3)'}`}}>
                  {Object.keys(quizAnswers).length<quizQs.length?`Answer all ${quizQs.length} questions to submit`:'Submit Answers'}
                </button>
              ) : (
                <div className="glass rounded-xl p-4 text-center" style={{border:`1px solid ${bestScore===quizQs.length?'rgba(16,185,129,0.3)':'rgba(245,158,11,0.3)'}`}}>
                  <div className="text-2xl font-bold" style={{color:bestScore===quizQs.length?'#10b981':'#f59e0b'}}>{latestAttempt?.score}/{quizQs.length}</div>
                  <div className="text-xs mt-1" style={{color:'#475569'}}>{latestAttempt?.score===quizQs.length?'Perfect score — mastery demonstrated':'Review explanations above, then retry for higher mastery'}</div>
                  <button onClick={retryQuiz} className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(99,102,241,0.12)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.2)'}}>Retry Quiz</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── EVIDENCE TAB ── */}
      {wsTab==='evidence' && (
        <div className="space-y-3">
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:'#475569'}}>Evidence Ledger</div>
            <div className="text-xs mb-3" style={{color:'#334155'}}>Log evidence for and against claims you are investigating. A negative result is as valuable as a positive one.</div>
            {/* Evidence prompts */}
            {(content?.evidencePrompts||[]).length>0 && (
              <div className="space-y-1 mb-3">
                {(content.evidencePrompts||[]).map((p,i)=>(
                  <div key={i} className="text-xs p-2 rounded-lg cursor-pointer" style={{background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.1)',color:'#818cf8'}}
                    onClick={()=>setEvidenceDraft(d=>({...d,claim:p}))}>
                    → {p}
                  </div>
                ))}
              </div>
            )}
            {/* Add form */}
            <div className="space-y-2">
              <input value={evidenceDraft.claim} onChange={e=>setEvidenceDraft(d=>({...d,claim:e.target.value}))} placeholder="Claim you are testing..." className="w-full bg-transparent text-sm rounded-lg px-2.5 py-2" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}/>
              <div className="grid grid-cols-2 gap-2">
                <textarea rows={2} value={evidenceDraft.for} onChange={e=>setEvidenceDraft(d=>({...d,for:e.target.value}))} placeholder="Evidence supporting the claim..." className="bg-transparent text-xs rounded-lg p-2 resize-none" style={{border:'1px solid rgba(16,185,129,0.2)',color:'#6ee7b7'}}/>
                <textarea rows={2} value={evidenceDraft.against} onChange={e=>setEvidenceDraft(d=>({...d,against:e.target.value}))} placeholder="Evidence against the claim..." className="bg-transparent text-xs rounded-lg p-2 resize-none" style={{border:'1px solid rgba(239,68,68,0.2)',color:'#f87171'}}/>
              </div>
              <div className="flex gap-2 items-center">
                <select value={evidenceDraft.confidence} onChange={e=>setEvidenceDraft(d=>({...d,confidence:e.target.value}))} className="bg-transparent text-xs rounded px-2 py-1.5 border" style={{borderColor:'rgba(255,255,255,0.1)',color:'#94a3b8'}}>
                  <option value="low">Low confidence</option><option value="medium">Medium</option><option value="high">High confidence</option>
                </select>
                <button onClick={addEvidence} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.25)'}}>Add Evidence +15 XP</button>
              </div>
            </div>
          </div>
          {/* Evidence list */}
          {(prog.evidenceItems||[]).length===0 && (
            <div className="text-center py-6 text-xs" style={{color:'#334155'}}>No evidence recorded yet. Start by writing the claim you are trying to test.</div>
          )}
          {(prog.evidenceItems||[]).map(item=>(
            <div key={item.id} className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-sm font-medium" style={{color:'#e2e8f0'}}>{item.claim}</div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{background:item.confidence==='high'?'rgba(16,185,129,0.1)':item.confidence==='medium'?'rgba(245,158,11,0.1)':'rgba(99,102,241,0.1)',color:item.confidence==='high'?'#10b981':item.confidence==='medium'?'#f59e0b':'#818cf8'}}>{item.confidence}</span>
                  <button onClick={()=>removeEvidence(item.id)} style={{color:'#475569',fontSize:'12px'}}>×</button>
                </div>
              </div>
              {item.for && <div className="text-xs mb-1"><span style={{color:'#10b981'}}>For: </span><span style={{color:'#6ee7b7'}}>{item.for}</span></div>}
              {item.against && <div className="text-xs"><span style={{color:'#ef4444'}}>Against: </span><span style={{color:'#f87171'}}>{item.against}</span></div>}
            </div>
          ))}
        </div>
      )}

      {/* ── SUBMIT TAB ── */}
      {wsTab==='submit' && (
        <div className="space-y-3">
          {/* Bull vs Bear */}
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#475569'}}>🐂 Bull vs 🐻 Bear Analysis</div>
            <div className="text-xs mb-2" style={{color:'#334155'}}>Required before a research experiment can be considered fully evaluated. Both fields must contain substantive analysis.</div>
            <div className="space-y-3">
              {[['bullCase','🐂 Bull Case — Why might this work?','rgba(16,185,129,0.15)','#10b981'],['bearCase','🐻 Bear Case — Why might the result be fake?','rgba(239,68,68,0.08)','#ef4444']].map(([field,ph,bg,c])=>(
                <div key={field}>
                  <div className="text-xs font-semibold mb-1" style={{color:c}}>{ph}</div>
                  <textarea rows={3} className="w-full bg-transparent text-sm rounded-lg p-2.5 resize-none" style={{border:`1px solid ${c}30`,color:'#94a3b8',background:bg}}
                    placeholder={field==='bullCase'?'Economic mechanism, behavioral bias, structural edge, risk premium...':'Noise, data mining, leakage, omitted costs, survivorship, regime dependence, parameter instability...'}
                    value={prog[field]||''} onChange={e=>onProgress({[field]:e.target.value})}/>
                </div>
              ))}
            </div>
          </div>
          {/* Research Decision */}
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#475569'}}>Research Decision</div>
            <div className="text-xs mb-2" style={{color:'#334155'}}>A scientifically justified REJECT earns full research credit. Do not manufacture positive results.</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[['ship','🟢 Ship','rgba(16,185,129,0.15)','#10b981'],['revise','🟡 Revise','rgba(245,158,11,0.1)','#f59e0b'],['reject','🔴 Reject','rgba(239,68,68,0.1)','#ef4444'],['inconclusive','⚪ Inconclusive','rgba(255,255,255,0.04)','#94a3b8']].map(([v,l,bg,c])=>(
                <button key={v} onClick={()=>onProgress({decision:v})} className="p-2 rounded-lg text-xs font-bold transition-all"
                  style={{background:prog.decision===v?bg:'transparent',color:prog.decision===v?c:'#475569',border:`1px solid ${prog.decision===v?c+'40':'rgba(255,255,255,0.06)'}`}}>
                  {l}
                </button>
              ))}
            </div>
            <textarea rows={2} className="w-full bg-transparent text-xs rounded-lg p-2.5 resize-none" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#94a3b8'}}
              placeholder="Rationale for your decision..." value={prog.decisionRationale||''} onChange={e=>onProgress({decisionRationale:e.target.value})}/>
          </div>
          {/* Deliverable note */}
          <div className="glass rounded-xl p-4" style={{border:`1px solid ${phaseColor}20`}}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:phaseColor}}>Deliverable</div>
            {content?.lab?.deliverable && <div className="text-xs mb-2" style={{color:'#475569'}}>{content.lab.deliverable}</div>}
            <textarea rows={2} className="w-full bg-transparent text-xs rounded-lg p-2.5 resize-none" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#94a3b8'}}
              placeholder="Notes about your deliverable, notebook path, etc." value={prog.deliverableNote||''} onChange={e=>onProgress({deliverableNote:e.target.value})}/>
            <button onClick={()=>onProgress({deliverableDone:!prog.deliverableDone})} className="w-full mt-2 py-2 rounded-lg text-xs font-bold"
              style={{background:prog.deliverableDone?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.04)',color:prog.deliverableDone?'#10b981':'#475569',border:`1px solid ${prog.deliverableDone?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)'}`}}>
              {prog.deliverableDone?'✓ Deliverable Shipped — +100 XP':'Mark Deliverable Complete'}
            </button>
          </div>
          {/* Reflection prompts */}
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:'#475569'}}>Reflection Prompts</div>
            {['What surprised you this week?','What assumption are you least confident about?','What would you test next?','What did not work, and why?'].map((p,i)=>(
              <div key={i} className="text-xs mb-1" style={{color:'#334155'}}>→ {p}</div>
            ))}
            <textarea rows={3} className="w-full bg-transparent text-xs rounded-lg p-2.5 resize-none mt-2" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#94a3b8'}}
              placeholder="Your reflections for this week..." value={prog.reflection||''} onChange={e=>onProgress({reflection:e.target.value})}/>
            <button onClick={()=>{if(prog.reflection) addJournal();}} className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(255,255,255,0.05)',color:'#64748b'}}>Save to Journal</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GoldenEggPanel({data, setData, toasts, isMobile}){
  const ge = data.goldenEgg || {};
  const [tab, setTab] = useState('overview');
  const [editStrategy, setEditStrategy] = useState(false);
  const [strategyDraft, setStrategyDraft] = useState(ge.strategyStatement||'');
  const [expandedTrack, setExpandedTrack] = useState(null);
  const [sectorNote, setSectorNote] = useState({});
  const [activeWeek, setActiveWeek] = useState(null);
  const [show14, setShow14] = useState(true);
  const [courseSection, setCourseSection] = useState('missions');

  const upGE = (patch) => setData(d=>({...d, goldenEgg:{...(d.goldenEgg||{}), ...patch}}));
  const upWeekProgress = (wkId, patch) => {
    const curr = (course.weekProgress||{})[wkId] || {};
    upGE({aiCourse:{...course, weekProgress:{...(course.weekProgress||{}), [wkId]:{...curr,...patch}}}});
  };

  const course = ge.aiCourse || {};
  const _savedWkDone = Object.fromEntries((course.weeks||[]).filter(w=>w.done).map(w=>[w.id,true]));
  const _savedDayDone = Object.fromEntries((course.firstFourteen||[]).filter(d=>d.done).map(d=>[d.id,true]));
  const courseWeeks = GE_COURSE_WEEKS.map(w=>({...w, done:!!_savedWkDone[w.id]}));
  const days14 = GE_COURSE_DAYS14.map(d=>({...d, done:!!_savedDayDone[d.id]}));
  const courseWeeksDone = courseWeeks.filter(w=>w.done).length;
  const days14Done = days14.filter(d=>d.done).length;

  const toggleWeek = (id) => {
    const next = courseWeeks.map(w=>w.id===id?{...w,done:!w.done}:w);
    upGE({aiCourse:{...course, weeks:next.map(w=>({id:w.id,done:w.done}))}});
  };
  const toggleDay14 = (id) => {
    const next = days14.map(d=>d.id===id?{...d,done:!d.done}:d);
    upGE({aiCourse:{...course, firstFourteen:next.map(d=>({id:d.id,done:d.done}))}});
  };

  const toggleTopic = (trackId, topicId) => {
    const curr = ge.curriculum||[];
    upGE({curriculum: curr.map(t=> t.id===trackId ? {
      ...t, topics: t.topics.map(tp=> tp.id===topicId ? {...tp, done:!tp.done} : tp)
    } : t)});
  };

  const toggleF30 = (id) => {
    upGE({firstThirtyDays:(ge.firstThirtyDays||[]).map(i=>i.id===id?{...i,done:!i.done}:i)});
  };

  const saveStrategy = () => {
    upGE({strategyStatement: strategyDraft});
    setEditStrategy(false);
    toasts.push('Strategy statement saved');
  };

  const totalTopics = (ge.curriculum||[]).reduce((s,t)=>s+t.topics.length,0);
  const doneTopics  = (ge.curriculum||[]).reduce((s,t)=>s+t.topics.filter(tp=>tp.done).length,0);
  const pct = totalTopics ? Math.round(100*doneTopics/totalTopics) : 0;
  const f30done = (ge.firstThirtyDays||[]).filter(i=>i.done).length;
  const f30total = (ge.firstThirtyDays||[]).length;

  const tabs = [{id:'overview',label:'Overview'},{id:'curriculum',label:'Curriculum'},{id:'timeline',label:'Timeline'},{id:'sectors',label:'Sectors'},{id:'ai-course',label:'Course'}];

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{fontSize:'22px'}}>🥚</span>
            <h2 className="text-xl font-bold" style={{background:'linear-gradient(90deg,#f59e0b,#f97316)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Golden Egg Capital</h2>
          </div>
          <div className="text-xs" style={{color:'#64748b'}}>Small/mid-cap research fund · Rishi (Research) + Rohan (Systems)</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold" style={{color:'#f59e0b'}}>{pct}% curriculum</div>
          <div className="text-xs" style={{color:'#475569'}}>{doneTopics}/{totalTopics} topics</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{background:tab===t.id?'rgba(245,158,11,0.15)':'transparent',color:tab===t.id?'#f59e0b':'#475569',border:tab===t.id?'1px solid rgba(245,158,11,0.25)':'1px solid transparent'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab==='overview' && (
        <div className="space-y-4">
          {/* Strategy */}
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(245,158,11,0.15)'}}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold uppercase tracking-widest" style={{color:'#f59e0b'}}>Strategy Statement</div>
              <button onClick={()=>{setStrategyDraft(ge.strategyStatement||'');setEditStrategy(!editStrategy);}} className="text-xs px-2 py-0.5 rounded" style={{color:'#64748b',background:'rgba(255,255,255,0.05)'}}>
                {editStrategy?'Cancel':'Edit'}
              </button>
            </div>
            {editStrategy ? (
              <div className="space-y-2">
                <textarea rows={4} value={strategyDraft} onChange={e=>setStrategyDraft(e.target.value)}
                  className="w-full text-sm p-2 rounded bg-transparent resize-none"
                  style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none',fontFamily:'inherit',lineHeight:1.6}} />
                <button onClick={saveStrategy} className="px-3 py-1 rounded text-xs font-semibold" style={{background:'linear-gradient(90deg,#f59e0b,#f97316)',color:'#000'}}>Save</button>
              </div>
            ) : (
              <p className="text-sm leading-relaxed" style={{color:'#94a3b8'}}>{ge.strategyStatement}</p>
            )}
          </div>

          {/* Roles */}
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{color:'#475569'}}>Roles</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg" style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.15)'}}>
                <div className="text-xs" style={{color:'#818cf8'}}>Research Lead</div>
                <div className="font-semibold mt-1">{ge.roles?.researchLead||'—'}</div>
                <div className="text-xs mt-1" style={{color:'#475569'}}>Thesis writing · business quality analysis · investment memos · sector frameworks</div>
              </div>
              <div className="p-3 rounded-lg" style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.15)'}}>
                <div className="text-xs" style={{color:'#10b981'}}>Systems Lead</div>
                <div className="font-semibold mt-1">{ge.roles?.systemsLead||'—'}</div>
                <div className="text-xs mt-1" style={{color:'#475569'}}>AI/data infra · EDGAR pipeline · automation · monitoring · paper-trading logs</div>
              </div>
            </div>
          </div>

          {/* First 30 Days */}
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold uppercase tracking-widest" style={{color:'#475569'}}>First 30 Days</div>
              <div className="text-xs" style={{color:f30done===f30total?'#10b981':'#64748b'}}>{f30done}/{f30total} done</div>
            </div>
            <div className="space-y-2">
              {(ge.firstThirtyDays||[]).map(item=>(
                <div key={item.id} className="flex items-start gap-3 cursor-pointer" onClick={()=>toggleF30(item.id)}>
                  <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{background:item.done?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.04)',border:item.done?'1px solid rgba(16,185,129,0.4)':'1px solid rgba(255,255,255,0.08)',color:'#10b981',fontSize:'12px'}}>
                    {item.done?'✓':''}
                  </div>
                  <div className="text-sm" style={{color:item.done?'#475569':'#e2e8f0',textDecoration:item.done?'line-through':'none'}}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CURRICULUM */}
      {tab==='curriculum' && (
        <div className="space-y-3">
          {(ge.curriculum||[]).map(track=>{
            const done = track.topics.filter(t=>t.done).length;
            const total = track.topics.length;
            const pctT = total ? Math.round(100*done/total) : 0;
            const isOpen = expandedTrack===track.id;
            const ownerColor = GE_OWNER_COLORS[track.owner]||'#6366f1';
            return (
              <div key={track.id} className="glass rounded-xl" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={()=>setExpandedTrack(isOpen?null:track.id)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div>
                      <div className="font-medium text-sm">{track.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:`${ownerColor}18`,color:ownerColor}}>{track.owner}</span>
                        <span className="text-xs" style={{color:'#475569'}}>{done}/{total} done</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div style={{width:'60px',height:'6px',background:'rgba(255,255,255,0.06)',borderRadius:'3px',overflow:'hidden'}}>
                      <div style={{width:`${pctT}%`,height:'100%',background:`${ownerColor}`,borderRadius:'3px',transition:'width 0.3s'}}/>
                    </div>
                    <span className="text-xs font-medium" style={{color:ownerColor,minWidth:'30px',textAlign:'right'}}>{pctT}%</span>
                    <span style={{color:'#334155',fontSize:'12px'}}>{isOpen?'▲':'▼'}</span>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 grid grid-cols-1 gap-1.5" style={{borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                    <div className="h-2"/>
                    {track.topics.map(tp=>(
                      <div key={tp.id} className="flex items-center gap-2.5 cursor-pointer py-1" onClick={()=>toggleTopic(track.id, tp.id)}>
                        <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                          style={{background:tp.done?`${ownerColor}20`:'rgba(255,255,255,0.04)',border:tp.done?`1px solid ${ownerColor}50`:'1px solid rgba(255,255,255,0.08)',color:ownerColor,fontSize:'10px'}}>
                          {tp.done?'✓':''}
                        </div>
                        <span className="text-xs" style={{color:tp.done?'#475569':'#94a3b8',textDecoration:tp.done?'line-through':'none'}}>{tp.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TIMELINE */}
      {tab==='timeline' && (
        <div className="space-y-3">
          {(ge.phases||[]).map((ph,i)=>{
            const isActive = ph.status==='in_progress';
            const isDone   = ph.status==='done';
            const color = isActive?'#6366f1':isDone?'#10b981':'#334155';
            return (
              <div key={ph.id} className="glass rounded-xl p-4" style={{border:`1px solid ${isActive?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)'}`,background:isActive?'rgba(99,102,241,0.05)':'transparent'}}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{background:`${color}20`,color,border:`1px solid ${color}40`}}>
                    {isDone?'✓':i+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-sm">{ph.name}</div>
                      {isActive && <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.25)'}}>Current</span>}
                    </div>
                    <div className="text-xs mt-0.5" style={{color:'#475569'}}>{ph.timeframe}</div>
                    <div className="text-xs mt-2" style={{color:'#64748b'}}><span style={{color:'#94a3b8',fontWeight:600}}>Goal:</span> {ph.goal}</div>
                    <div className="text-xs mt-1" style={{color:'#64748b'}}><span style={{color:'#94a3b8',fontWeight:600}}>Deliverable:</span> {ph.deliverable}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI COURSE */}
      {tab==='ai-course' && (
        <div className="space-y-4">

          {/* ── Hero header ── */}
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(245,158,11,0.3)',background:'linear-gradient(135deg,rgba(245,158,11,0.06),rgba(249,115,22,0.04))'}}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color:'#f59e0b'}}>$0 · Free · 12-Week Build</div>
                <div className="text-base font-bold leading-snug" style={{color:'#fbbf24'}}>AI Portfolio Investing Course</div>
                <div className="text-xs mt-1 italic" style={{color:'#78716c'}}>"Build a research OS where ML ranks, LLMs read and challenge, deterministic code controls, and humans decide."</div>
              </div>
              <div className="text-3xl flex-shrink-0">📈</div>
            </div>
            {/* Stat chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                [`${courseWeeksDone}/12`,'Weeks Done','#6366f1'],
                [`${days14Done}/14`,'Sprint Days','#10b981'],
                [`${courseWeeks.filter(w=>w.bossFight&&w.done).length}/3`,'Boss Fights','#ef4444'],
                ['~65h','Total Time','#8b5cf6'],
              ].map(([v,l,c])=>(
                <div key={l} className="px-3 py-1.5 rounded-lg text-center" style={{background:`${c}12`,border:`1px solid ${c}25`}}>
                  <div className="text-sm font-bold" style={{color:c}}>{v}</div>
                  <div className="text-xs" style={{color:'#475569'}}>{l}</div>
                </div>
              ))}
            </div>
            {/* Master progress bar */}
            <div className="mt-3">
              <div style={{height:'8px',background:'rgba(255,255,255,0.05)',borderRadius:'4px',overflow:'hidden'}}>
                <div style={{width:`${Math.round(100*courseWeeksDone/12)}%`,height:'100%',background:'linear-gradient(90deg,#6366f1,#f59e0b,#f97316)',borderRadius:'4px',transition:'width 0.4s ease'}}/>
              </div>
            </div>
            {/* Phase strip */}
            <div className="flex gap-1 mt-2">
              {[['Foundations','#6366f1',1,2],['Machine Learning','#8b5cf6',3,4],['Research Intel','#3b82f6',5,6],['Portfolio','#10b981',7,8],['AI Analysts','#f59e0b',9,10],['Integration','#f97316',11,12]].map(([ph,c,s,e])=>{
                const pd=courseWeeks.filter(w=>w.num>=s&&w.num<=e&&w.done).length;
                const done=pd===2;
                return (
                  <div key={ph} className="flex-1 text-center py-1 rounded" style={{background:done?`${c}20`:'rgba(255,255,255,0.02)',border:`1px solid ${done?c+'40':'rgba(255,255,255,0.04)'}`}}>
                    <div className="text-xs" style={{color:done?c:'#334155',fontSize:'9px',fontWeight:600}}>{done?'✓ ':''}{ph.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Rules of the Game ── */}
          <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{color:'#475569'}}>Rules of the Game</div>
            <div className="grid grid-cols-2 gap-2">
              {GE_COURSE_RULES.map(r=>(
                <div key={r.name} className="p-2.5 rounded-lg" style={{background:`${r.color}08`,border:`1px solid ${r.color}20`}}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{fontSize:'14px'}}>{r.icon}</span>
                    <span className="text-xs font-bold" style={{color:r.color}}>{r.name}</span>
                  </div>
                  <div className="text-xs leading-relaxed" style={{color:'#475569'}}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section nav ── */}
          <div className="flex gap-1 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)'}}>
            {[['missions','🗺 Missions'],['sprint','⚡ Sprint'],['library','📚 Library'],['arsenal','🛠 Arsenal']].map(([s,l])=>(
              <button key={s} onClick={()=>setCourseSection(s)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{background:courseSection===s?'rgba(245,158,11,0.15)':'transparent',color:courseSection===s?'#f59e0b':'#475569',border:courseSection===s?'1px solid rgba(245,158,11,0.25)':'1px solid transparent'}}>
                {l}
              </button>
            ))}
          </div>

          {/* ── MISSIONS section ── */}
          {courseSection==='missions' && (
            activeWeek ? (
              /* ── Full Week Workspace ── */
              (() => {
                const wk = courseWeeks.find(w=>w.id===activeWeek);
                if(!wk) return null;
                const contentKey = `wk${wk.num}`;
                const content = GE_WEEK_CONTENT[contentKey] || null;
                const prog = getWkProgress(course, wk.id);
                return (
                  <WeekWorkspace
                    wk={wk}
                    content={content}
                    prog={prog}
                    onProgress={(patch)=>upWeekProgress(wk.id, patch)}
                    onBack={()=>setActiveWeek(null)}
                    isMobile={isMobile}
                  />
                );
              })()
            ) : (
              /* ── Mission List ── */
              <div className="space-y-2">
                {/* XP & mastery summary */}
                <div className="glass rounded-xl p-3 mb-1" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-xs"><span style={{color:'#475569'}}>Total XP: </span><span className="font-bold" style={{color:'#f59e0b'}}>{totalCourseXP(course.weekProgress, GE_WEEK_CONTENT)}</span></div>
                    <div className="text-xs"><span style={{color:'#475569'}}>Completed: </span><span className="font-bold" style={{color:'#10b981'}}>{courseWeeks.filter(w=>w.done).length}/{courseWeeks.length} weeks</span></div>
                    <div className="text-xs" style={{color:'#334155'}}>Click a week to open its workspace. Mastery ≠ completion.</div>
                  </div>
                </div>
                {courseWeeks.map((wk)=>{
                  const pc = wk.num<=2?'#6366f1':wk.num<=4?'#8b5cf6':wk.num<=6?'#3b82f6':wk.num<=8?'#10b981':wk.num<=10?'#f59e0b':'#f97316';
                  const contentKey = `wk${wk.num}`;
                  const prog = getWkProgress(course, wk.id);
                  const content = GE_WEEK_CONTENT[contentKey] || null;
                  const completion = calcWeekCompletion(wk, prog, content);
                  const mastery = calcWeekMastery(prog, content);
                  return (
                    <div key={wk.id} className="glass rounded-xl cursor-pointer" onClick={()=>setActiveWeek(wk.id)}
                      style={{border:`1px solid ${wk.done?'rgba(16,185,129,0.3)':wk.bossFight?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)'}`,background:wk.done?'rgba(16,185,129,0.02)':wk.bossFight&&!wk.done?'rgba(239,68,68,0.02)':'transparent'}}>
                      <div className="flex items-center gap-3 p-3">
                        <div className="flex-shrink-0 text-xl w-8 text-center">{wk.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-sm font-semibold" style={{color:'#e2e8f0'}}>Wk {wk.num}: {wk.name}</span>
                            {wk.bossFight && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{background:'rgba(239,68,68,0.15)',color:'#f87171',border:'1px solid rgba(239,68,68,0.3)'}}>⚔️ Boss</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:`${pc}12`,color:pc}}>{wk.phase}</span>
                            <span className="text-xs" style={{color:'#334155'}}>{wk.hours}</span>
                          </div>
                          {/* Dual progress bars */}
                          <div className="flex gap-2 mt-1.5 items-center">
                            <div style={{flex:1,height:'3px',background:'rgba(255,255,255,0.05)',borderRadius:'2px',overflow:'hidden'}}>
                              <div style={{width:`${completion}%`,height:'100%',background:'#10b981',borderRadius:'2px'}}/>
                            </div>
                            <div style={{flex:1,height:'3px',background:'rgba(255,255,255,0.05)',borderRadius:'2px',overflow:'hidden'}}>
                              <div style={{width:`${mastery}%`,height:'100%',background:pc,borderRadius:'2px'}}/>
                            </div>
                            <span className="text-xs font-mono flex-shrink-0" style={{color:'#334155',fontSize:'10px'}}>{completion}%/{mastery}%</span>
                          </div>
                        </div>
                        <span style={{color:pc,fontSize:'12px',flexShrink:0}}>→</span>
                      </div>
                    </div>
                  );
                })}
                <div className="text-xs text-center mt-2" style={{color:'#1e293b'}}>Left bar = completion · Right bar = mastery</div>
              </div>
            )
          )}

          {/* ── SPRINT section ── */}
          {courseSection==='sprint' && (
            <div className="space-y-3">
              <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(16,185,129,0.2)',background:'rgba(16,185,129,0.03)'}}>
                <div className="text-sm font-bold mb-1" style={{color:'#10b981'}}>Foundation Sprint — First 14 Days</div>
                <div className="text-xs leading-relaxed" style={{color:'#64748b'}}>After these 14 days you'll have something most AI-investing tutorials never build: a point-in-time data system, a reproducible $1M benchmark, an explicit investment policy, and automated tests designed to stop you from cheating. <em>Only then should AI begin.</em></div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1" style={{height:'6px',background:'rgba(255,255,255,0.06)',borderRadius:'3px',overflow:'hidden'}}>
                    <div style={{width:`${Math.round(100*days14Done/14)}%`,height:'100%',background:'linear-gradient(90deg,#10b981,#6366f1)',borderRadius:'3px',transition:'width 0.3s'}}/>
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0" style={{color:days14Done===14?'#10b981':'#475569'}}>{days14Done}/14 done</span>
                </div>
              </div>
              <div className="space-y-2">
                {days14.map(d=>(
                  <div key={d.id} className="glass rounded-xl flex items-start gap-3 p-3 cursor-pointer" onClick={()=>toggleDay14(d.id)}
                    style={{border:`1px solid ${d.done?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.05)'}`,background:d.done?'rgba(16,185,129,0.03)':'transparent'}}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold"
                      style={{background:d.done?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.04)',border:d.done?'1px solid rgba(16,185,129,0.4)':'1px solid rgba(255,255,255,0.08)',color:d.done?'#10b981':'#475569'}}>
                      {d.done ? <span style={{fontSize:'16px'}}>✓</span> : <><span style={{fontSize:'9px',color:'#334155'}}>Day</span><span style={{fontSize:'13px',lineHeight:1}}>{d.day}</span></>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs leading-relaxed" style={{color:d.done?'#334155':'#94a3b8',textDecoration:d.done?'line-through':'none'}}>{d.action}</div>
                    </div>
                  </div>
                ))}
              </div>
              {days14Done===14 && (
                <div className="glass rounded-xl p-4 text-center" style={{border:'1px solid rgba(16,185,129,0.3)',background:'rgba(16,185,129,0.05)'}}>
                  <div className="text-2xl mb-1">🎉</div>
                  <div className="text-sm font-bold" style={{color:'#10b981'}}>Foundation Complete!</div>
                  <div className="text-xs mt-1" style={{color:'#64748b'}}>Tag the repo <code style={{background:'rgba(255,255,255,0.08)',padding:'1px 4px',borderRadius:'3px'}}>foundation-v1</code>. Week 3 ML work may begin.</div>
                </div>
              )}
            </div>
          )}

          {/* ── LIBRARY section ── */}
          {courseSection==='library' && (
            <div className="space-y-3">
              <div className="text-xs mb-1 leading-relaxed" style={{color:'#475569'}}>
                The reading list is weighted toward 2024–2026 primary research. Older material is used only where it remains foundational. Note: many 2026 results are NBER working papers or arXiv preprints — excellent material for understanding the frontier, but not yet settled evidence of persistent alpha.
              </div>
              {GE_RESEARCH_SPINE.map((p,i)=>(
                <div key={i} className="glass rounded-xl p-3" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{background:'rgba(99,102,241,0.12)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.2)'}}>{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold leading-snug" style={{color:'#e2e8f0'}}>{p.title}</div>
                      <div className="text-xs mt-0.5" style={{color:'#475569'}}>{p.authors && `${p.authors} · `}{p.venue}</div>
                      <div className="text-xs mt-1.5 leading-relaxed" style={{color:'#64748b'}}>→ {p.why}</div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Free path comparison */}
              <div className="glass rounded-xl p-4 mt-2" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{color:'#475569'}}>vs. Existing Free Paths</div>
                {[
                  ['Georgia Tech CS7646','🟡','Excellent ML/finance foundation. Missing: LLM/RAG era, SEC-RAG, agent benchmarks, 2026 leakage work.','Best older foundation — supplement, not replace.'],
                  ['Udacity Free AI Modules','🟡','Very current GenAI concepts (updated mid-2026). Missing: rigorous portfolio research discipline.','Best for current GenAI concepts — not a complete investing curriculum.'],
                  ['MIT OCW — Investments','🟢','Strong portfolio theory and asset pricing fundamentals. Missing: modern ML/LLM stack entirely.','Best theory supplement — weakest match to "modern AI research platform."'],
                ].map(([name,dot,missing,verdict])=>(
                  <div key={name} className="mb-3 pb-3" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{dot}</span>
                      <span className="text-xs font-semibold" style={{color:'#94a3b8'}}>{name}</span>
                    </div>
                    <div className="text-xs" style={{color:'#475569'}}>Missing: {missing}</div>
                    <div className="text-xs mt-0.5 italic" style={{color:'#64748b'}}>{verdict}</div>
                  </div>
                ))}
                <div className="text-xs p-2.5 rounded-lg" style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.15)',color:'#818cf8'}}>
                  This course borrows portfolio fundamentals from MIT, practical ML habits from Georgia Tech, and current LLM concepts from Udacity — then connects them with SEC APIs and 2024–2026 financial-AI research.
                </div>
              </div>
            </div>
          )}

          {/* ── ARSENAL section ── */}
          {courseSection==='arsenal' && (
            <div className="space-y-4">
              {/* Weekly time budget */}
              <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{color:'#475569'}}>Weekly Time Budget (~5–6h/week)</div>
                <div className="space-y-2">
                  {[
                    ['Interactive concept lesson','50–60 min','#6366f1'],
                    ['"Paper clinic" — current research digest','35–45 min','#8b5cf6'],
                    ['Guided Python notebook','90–110 min','#3b82f6'],
                    ['Build mission — ship a working component','90–120 min','#10b981'],
                    ['Quiz + red-team review','20–30 min','#f59e0b'],
                  ].map(([component,time,c])=>(
                    <div key={component} className="flex items-center justify-between py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:c}}/>
                        <span className="text-xs" style={{color:'#94a3b8'}}>{component}</span>
                      </div>
                      <span className="text-xs font-semibold flex-shrink-0 ml-2" style={{color:c}}>{time}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Free Stack */}
              <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color:'#475569'}}>Free Stack — $0 Required</div>
                <div className="text-xs mb-3" style={{color:'#334155'}}>No mandatory paid model, financial-data API, compute service, textbook, or certificate.</div>
                <div className="space-y-1.5">
                  {[
                    ['SEC EDGAR / data.sec.gov','Core','No API key; submissions + XBRL update daily; 10 req/sec limit'],
                    ['yfinance','Educational','Convenient EOD prices — unofficial; intended for personal/research use only'],
                    ['FRED / ALFRED','Core macro','Historical observations + vintage dates; essential for point-in-time macro testing'],
                    ['Kenneth French Lib','Core factors','Market, size, value, profitability, investment factors + benchmark portfolios'],
                    ['Ollama','Core LLM','Run local LLMs with no per-token fees; supports JSON/Pydantic-schema-constrained outputs'],
                    ['VectorBT','Default backtester','Fast portfolio simulation + strategy sweeps; pandas/NumPy-native'],
                    ['CVXPY','Core optimizer','Portfolio constraints + quadratic mean-variance optimization'],
                    ['DuckDB + Parquet','Data lake','Point-in-time data storage; fast analytical queries on immutable raw data'],
                    ['scikit-learn','ML models','Gradient-boosted rankers, linear baselines, walk-forward cross-validation'],
                    ['Pydantic + requests','Agent layer','Structured agent outputs + SEC EDGAR API calls'],
                    ['LangGraph','Optional','Stateful workflows + human-in-the-loop gates; plain Python is fine until Week 11'],
                    ['IEX Cloud','⛔ Avoid','Sunset Aug 31 2024 — no longer viable'],
                  ].map(([name,badge,note])=>(
                    <div key={name} className="flex items-start gap-2 py-1.5" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                      <span className="text-xs font-bold flex-shrink-0" style={{color:'#94a3b8',minWidth:'140px'}}>{name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{background:badge==='Core'||badge==='Core LLM'||badge==='Core macro'||badge==='Core factors'||badge==='Core optimizer'?'rgba(16,185,129,0.1)':badge==='Optional'?'rgba(99,102,241,0.1)':badge==='⛔ Avoid'?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.05)',color:badge==='Core'||badge==='Core LLM'||badge==='Core macro'||badge==='Core factors'||badge==='Core optimizer'?'#10b981':badge==='Optional'?'#818cf8':badge==='⛔ Avoid'?'#f87171':'#64748b'}}>{badge}</span>
                      <span className="text-xs leading-relaxed" style={{color:'#475569'}}>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Rubric */}
              <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color:'#475569'}}>Final Project Rubric — 100 pts</div>
                <div className="text-xs mb-3" style={{color:'#334155'}}>Grading makes it impossible to pass by producing a lucky backtest alone.</div>
                <div className="space-y-2">
                  {[
                    [20,'Point-in-time data integrity','#ef4444','Immutable raw data, availability timestamps, no label leakage, automated leakage tests, filing accession provenance'],
                    [15,'ML methodology','#f97316','Walk-forward design, simple baselines, robustness testing, cost sensitivity, interpretable diagnostics, honest limitations'],
                    [15,'Financial retrieval / RAG','#f59e0b','Evidence-grounded answers, provenance to filings, evaluated retrieval (Recall@k), correct period/entity, abstention when evidence is absent'],
                    [15,'Portfolio construction','#10b981','Explicit objective, sensible constraints, comparison vs. naïve allocations, turnover/risk treatment, no hidden discretionary edits'],
                    [10,'Risk management','#3b82f6','Concentration/exposure controls, stress scenarios, model-drift triggers, kill switch, benchmark discipline'],
                    [10,'LLM / agent engineering','#8b5cf6','Structured output, separate roles, deterministic tool boundaries, evidence validation, adversarial review, human approval gate'],
                    [10,'$1M investment memo','#6366f1','Every position: thesis + evidence + sizing rationale + risks + disconfirming evidence + exit/review conditions'],
                    [5,'Reproducibility & audit trail','#94a3b8','Git history, config files, model versions, decision IDs, saved prompts/evidence, one-command or documented rebuild'],
                  ].map(([pts,c,color,desc])=>(
                    <div key={c} className="p-3 rounded-lg" style={{background:`${color}06`,border:`1px solid ${color}18`}}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold" style={{color:'#e2e8f0'}}>{c}</span>
                        <span className="text-sm font-bold" style={{color}}>{pts} pts</span>
                      </div>
                      <div className="text-xs leading-relaxed" style={{color:'#475569'}}>{desc}</div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)'}}>
                    <span className="text-sm font-bold" style={{color:'#e2e8f0'}}>Total</span>
                    <span className="text-xl font-bold" style={{color:'#f59e0b'}}>100 pts</span>
                  </div>
                  <div className="p-3 rounded-lg" style={{background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.15)'}}>
                    <div className="text-xs font-bold mb-1" style={{color:'#f87171'}}>⚠ Hard Penalties</div>
                    <div className="text-xs leading-relaxed" style={{color:'#f87171',opacity:0.8}}>
                      Undisclosed look-ahead / data leakage → <strong>score capped</strong> until repaired.<br/>
                      Fabricated source or evidence IDs → <strong>evidence component failed</strong>.<br/>
                      A model that makes no money but passes all rubric tests is a <em>better outcome</em> than a spectacular contaminated Sharpe ratio.
                    </div>
                  </div>
                </div>
              </div>
              {/* Milestones */}
              <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
                <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{color:'#475569'}}>Project Milestones</div>
                <div className="space-y-2">
                  {[
                    ['Data contract','End Wk 1','Every dataset has source, timestamp, availability rule, and licensing note'],
                    ['Baseline $1M ledger','End Wk 2','Dumb benchmark is live; metrics and benchmark frozen'],
                    ['ML Ranker v1','End Wk 3','Walk-forward predictions and ranks saved out-of-sample'],
                    ['Research audit','End Wk 4','Leakage checks and specification sensitivity pass'],
                    ['EDGAR warehouse','End Wk 5','Filing metadata/text/XBRL retrievable by decision date'],
                    ['RAG v1','End Wk 6','Evidence retrieval measured against manually labeled questions'],
                    ['Portfolio engine','End Wk 7','ML scores → constrained target weights, reproducibly'],
                    ['Risk engine','End Wk 8','Exposure, concentration, drawdown, and drift rules active'],
                    ['AI Analyst','End Wk 9','Every material assertion carries valid evidence IDs'],
                    ['Multi-agent committee','End Wk 10','Bull/bear/risk outputs evaluated; human gate enforced'],
                    ['Platform v1','End Wk 11','End-to-end candidate-to-paper-decision workflow works'],
                    ['$1M launch packet','End Wk 12','Models/rules frozen; IC memo, target allocation, forward protocol complete'],
                  ].map(([ms,deadline,def])=>(
                    <div key={ms} className="flex items-start gap-3 py-1.5" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                      <div className="flex-shrink-0">
                        <div className="text-xs font-semibold" style={{color:'#e2e8f0'}}>{ms}</div>
                        <div className="text-xs" style={{color:'#f59e0b'}}>{deadline}</div>
                      </div>
                      <div className="text-xs leading-relaxed" style={{color:'#475569'}}>{def}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SECTORS */}
      {tab==='sectors' && (
        <div className="space-y-3">
          <div className="text-xs mb-4" style={{color:'#475569'}}>Explore these sectors to find where small/mid-cap inefficiencies exist. Narrow to 2-3 by end of Phase 1.</div>
          {(ge.sectorCandidates||[]).map((s,i)=>(
            <div key={i} className="glass rounded-xl p-3" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{s.name}</div>
                <select value={s.status} onChange={e=>{
                  const updated = [...(ge.sectorCandidates||[])];
                  updated[i]={...updated[i],status:e.target.value};
                  upGE({sectorCandidates:updated});
                }} className="text-xs rounded px-2 py-0.5 bg-transparent"
                  style={{border:'1px solid rgba(255,255,255,0.08)',color:s.status==='selected'?'#10b981':s.status==='eliminated'?'#ef4444':'#64748b'}}>
                  <option value="exploring">Exploring</option>
                  <option value="selected">Selected</option>
                  <option value="eliminated">Eliminated</option>
                </select>
              </div>
              <input value={sectorNote[i]!==undefined?sectorNote[i]:(s.notes||'')}
                onChange={e=>setSectorNote(prev=>({...prev,[i]:e.target.value}))}
                onBlur={e=>{
                  const updated=[...(ge.sectorCandidates||[])];
                  updated[i]={...updated[i],notes:e.target.value};
                  upGE({sectorCandidates:updated});
                  setSectorNote(prev=>{const n={...prev};delete n[i];return n;});
                }}
                placeholder="Notes…"
                className="mt-2 w-full text-xs bg-transparent"
                style={{border:'none',outline:'none',color:'#64748b',padding:0}} />
            </div>
          ))}

          {/* Watchlist */}
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{color:'#475569'}}>Company Watchlist</div>
            {(ge.watchlist||[]).length===0 ? (
              <div className="glass rounded-xl p-6 text-center text-xs" style={{color:'#334155'}}>No companies yet. Add your first research target after choosing sectors.</div>
            ) : (
              <div className="space-y-2">
                {(ge.watchlist||[]).map((co,i)=>(
                  <div key={i} className="glass rounded-xl p-3 flex items-center justify-between" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
                    <div>
                      <div className="font-medium text-sm">{co.ticker} — {co.name}</div>
                      <div className="text-xs mt-0.5" style={{color:'#475569'}}>{co.sector} · {co.notes}</div>
                    </div>
                    <button onClick={()=>upGE({watchlist:(ge.watchlist||[]).filter((_,j)=>j!==i)})} className="text-xs px-2 py-1 rounded" style={{color:'#ef4444',background:'rgba(239,68,68,0.08)'}}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <WatchlistAddForm onAdd={co=>upGE({watchlist:[...(ge.watchlist||[]),co]})} />
          </div>
        </div>
      )}
    </div>
  );
}

function WatchlistAddForm({onAdd}){
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [notes, setNotes] = useState('');
  const save = ()=>{
    if(!ticker.trim()) return;
    onAdd({ticker:ticker.trim().toUpperCase(), name:name.trim(), sector:sector.trim(), notes:notes.trim()});
    setTicker(''); setName(''); setSector(''); setNotes(''); setOpen(false);
  };
  if(!open) return (
    <button onClick={()=>setOpen(true)} className="mt-3 w-full py-2 rounded-xl text-xs font-medium" style={{background:'rgba(245,158,11,0.1)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.2)'}}>
      + Add company to watchlist
    </button>
  );
  return (
    <div className="mt-3 glass rounded-xl p-4 space-y-2" style={{border:'1px solid rgba(245,158,11,0.2)'}}>
      <div className="grid grid-cols-2 gap-2">
        <input value={ticker} onChange={e=>setTicker(e.target.value)} placeholder="Ticker *" className="px-2 py-1.5 rounded text-xs bg-transparent" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}} />
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Company name" className="px-2 py-1.5 rounded text-xs bg-transparent" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}} />
      </div>
      <input value={sector} onChange={e=>setSector(e.target.value)} placeholder="Sector" className="w-full px-2 py-1.5 rounded text-xs bg-transparent" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}} />
      <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Quick thesis / why watching" className="w-full px-2 py-1.5 rounded text-xs bg-transparent" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}} />
      <div className="flex gap-2">
        <button onClick={save} className="px-3 py-1.5 rounded text-xs font-semibold" style={{background:'linear-gradient(90deg,#f59e0b,#f97316)',color:'#000'}}>Add</button>
        <button onClick={()=>setOpen(false)} className="px-3 py-1.5 rounded text-xs" style={{color:'#64748b',background:'rgba(255,255,255,0.05)'}}>Cancel</button>
      </div>
    </div>
  );
}

/* ================== §7 RESEARCH PANEL ================== */
function ResearchPanel({data, setData, toasts, isMobile}){
  const [subtab, setSubtab] = useState('thesis');
  const theses = data.theses || [];
  const watchlist = data.companyWatchlist || [];
  const decisions = data.decisionJournal || [];

  const upTheses = v => setData(d=>({...d, theses:v}));
  const upWatch  = v => setData(d=>({...d, companyWatchlist:v}));
  const upDec    = v => setData(d=>({...d, decisionJournal:v}));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">Research</h2>
        <div className="flex gap-0.5 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
          {[['thesis','Theses'],['watchlist','Watchlist'],['decisions','Decisions']].map(([v,l])=>(
            <button key={v} onClick={()=>setSubtab(v)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={subtab===v?{background:'rgba(255,255,255,0.1)',color:'#e2e8f0'}:{color:'#64748b'}}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {subtab==='thesis'    && <ThesisSubtab    theses={theses}    upTheses={upTheses}    toasts={toasts} watchlist={watchlist} isMobile={isMobile} />}
      {subtab==='watchlist' && <WatchlistSubtab  watchlist={watchlist} upWatch={upWatch} theses={theses}  toasts={toasts} />}
      {subtab==='decisions' && <DecisionSubtab   decisions={decisions} upDec={upDec}     toasts={toasts} theses={theses} />}
    </div>
  );
}

const CONVICTION_COLORS = {low:'#475569', medium:'#f59e0b', high:'#10b981', very_high:'#6366f1'};
const STATUS_COLORS = {watching:'#64748b', active:'#6366f1', closed:'#334155'};

function ThesisSubtab({theses, upTheses, toasts, watchlist, isMobile}){
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({company:'',thesis:'',variantPerception:'',catalysts:'',counterArgument:'',convictionLevel:'medium',status:'watching'});

  function save(){
    if(!draft.company.trim()){ toasts.push('Company name required'); return; }
    const entry = {...draft, id:uid(), catalysts:draft.catalysts.split(',').map(s=>s.trim()).filter(Boolean), lastUpdated:new Date().toISOString()};
    upTheses([...theses, entry]);
    setDraft({company:'',thesis:'',variantPerception:'',catalysts:'',counterArgument:'',convictionLevel:'medium',status:'watching'});
    setShowForm(false);
    toasts.push('Thesis saved');
  }

  function del(id){ upTheses(theses.filter(t=>t.id!==id)); toasts.push('Deleted'); setDetail(null); }
  function toggle(id, field){ upTheses(theses.map(t=>t.id===id?{...t,[field]:!t[field],lastUpdated:new Date().toISOString()}:t)); }
  function patch(id, updates){ upTheses(theses.map(t=>t.id===id?{...t,...updates,lastUpdated:new Date().toISOString()}:t)); }

  const filtered = filter==='all' ? theses : theses.filter(t=>t.status===filter || t.convictionLevel===filter);

  if(detail){
    const t = theses.find(x=>x.id===detail);
    if(!t) { setDetail(null); return null; }
    return (
      <div className="space-y-4">
        <button onClick={()=>setDetail(null)} className="text-sm" style={{color:'#6366f1'}}>← Back to list</button>
        <div className="glass rounded-xl p-5" style={{border:'1px solid rgba(255,255,255,0.08)'}}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-xl font-bold">{t.company}</div>
              <div className="flex gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{background:`${CONVICTION_COLORS[t.convictionLevel]||'#475569'}20`,color:CONVICTION_COLORS[t.convictionLevel]||'#475569'}}>{t.convictionLevel} conviction</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{background:`${STATUS_COLORS[t.status]||'#475569'}20`,color:STATUS_COLORS[t.status]||'#475569'}}>{t.status}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <select value={t.status} onChange={e=>patch(t.id,{status:e.target.value})} className="text-xs rounded px-2 py-1 bg-transparent border" style={{borderColor:'rgba(255,255,255,0.1)',color:'#94a3b8'}}>
                {['watching','active','closed'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={()=>del(t.id)} className="text-xs px-2 py-1 rounded" style={{color:'#ef4444',border:'1px solid rgba(239,68,68,0.2)'}}>Delete</button>
            </div>
          </div>
          {[['Thesis',t.thesis,'thesis'],['Variant Perception',t.variantPerception,'variantPerception'],['Counter-Argument',t.counterArgument,'counterArgument']].map(([label,val,field])=>(
            <div key={field} className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{color:'#475569'}}>{label}</div>
              <textarea rows={3} className="w-full bg-transparent text-sm rounded-lg p-2.5 resize-none" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}}
                value={val||''} onChange={e=>patch(t.id,{[field]:e.target.value})} placeholder={`Write ${label.toLowerCase()}…`}/>
            </div>
          ))}
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{color:'#475569'}}>Catalysts</div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(t.catalysts||[]).map((c,i)=>(
                <span key={i} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>
                  {c} <button onClick={()=>patch(t.id,{catalysts:(t.catalysts||[]).filter((_,j)=>j!==i)})} style={{color:'#475569'}}>×</button>
                </span>
              ))}
            </div>
            <input className="w-full bg-transparent text-xs rounded px-2 py-1.5" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#94a3b8'}}
              placeholder="Add catalyst and press Enter…" onKeyDown={e=>{ if(e.key==='Enter'&&e.target.value.trim()){ patch(t.id,{catalysts:[...(t.catalysts||[]),e.target.value.trim()]}); e.target.value=''; }}}/>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{color:'#475569'}}>Conviction:</span>
            {['low','medium','high','very_high'].map(lv=>(
              <button key={lv} onClick={()=>patch(t.id,{convictionLevel:lv})} className="text-xs px-2 py-0.5 rounded-full transition-all"
                style={{background:t.convictionLevel===lv?`${CONVICTION_COLORS[lv]}25`:'transparent',color:t.convictionLevel===lv?CONVICTION_COLORS[lv]:'#475569',border:`1px solid ${t.convictionLevel===lv?CONVICTION_COLORS[lv]+'40':'rgba(255,255,255,0.06)'}`}}>
                {lv.replace('_',' ')}
              </button>
            ))}
          </div>
          {t.lastUpdated && <div className="text-xs mt-3" style={{color:'#334155'}}>Last updated {new Date(t.lastUpdated).toLocaleDateString()}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex gap-1 flex-wrap">
          {['all','watching','active','closed'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className="text-xs px-2.5 py-1 rounded-full transition-all"
              style={{background:filter===f?'rgba(99,102,241,0.15)':'transparent',color:filter===f?'#818cf8':'#475569',border:`1px solid ${filter===f?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)'}`}}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="ml-auto px-3 py-1.5 rounded-xl text-sm font-semibold"
          style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white'}}>+ Thesis</button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-4 space-y-3" style={{border:'1px solid rgba(99,102,241,0.2)'}}>
          <div className="text-sm font-semibold" style={{color:'#818cf8'}}>New Thesis</div>
          {[['company','Company / Ticker'],['thesis','Thesis'],['variantPerception','Variant Perception'],['counterArgument','Counter-Argument']].map(([k,ph])=>(
            <textarea key={k} rows={k==='company'?1:2} className="w-full bg-transparent text-sm rounded-lg p-2.5 resize-none block" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}}
              placeholder={ph} value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}/>
          ))}
          <input className="w-full bg-transparent text-sm rounded-lg px-2.5 py-2" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}}
            placeholder="Catalysts (comma-separated)" value={draft.catalysts} onChange={e=>setDraft(d=>({...d,catalysts:e.target.value}))}/>
          <div className="flex gap-3 items-center">
            <select value={draft.convictionLevel} onChange={e=>setDraft(d=>({...d,convictionLevel:e.target.value}))} className="bg-transparent text-xs rounded px-2 py-1.5 border" style={{borderColor:'rgba(255,255,255,0.1)',color:'#94a3b8'}}>
              {['low','medium','high','very_high'].map(v=><option key={v} value={v}>{v.replace('_',' ')} conviction</option>)}
            </select>
            <button onClick={save} className="px-4 py-1.5 rounded-xl text-sm font-bold" style={{background:'rgba(16,185,129,0.15)',color:'#10b981',border:'1px solid rgba(16,185,129,0.25)'}}>Save</button>
            <button onClick={()=>setShowForm(false)} className="text-xs" style={{color:'#475569'}}>Cancel</button>
          </div>
        </div>
      )}

      {!filtered.length && <div className="text-sm text-center py-8" style={{color:'#334155'}}>No theses yet — tap + to add your first.</div>}
      {filtered.map(t=>(
        <div key={t.id} className="glass rounded-xl p-4 cursor-pointer hover:bg-white/3 transition-colors" onClick={()=>setDetail(t.id)}
          style={{border:`1px solid ${t.convictionLevel==='very_high'?'rgba(99,102,241,0.25)':t.convictionLevel==='high'?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.06)'}`}}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold" style={{color:'#e2e8f0'}}>{t.company}</div>
              {t.thesis && <div className="text-sm mt-1 line-clamp-2" style={{color:'#64748b'}}>{t.thesis}</div>}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{background:`${CONVICTION_COLORS[t.convictionLevel]||'#475569'}20`,color:CONVICTION_COLORS[t.convictionLevel]||'#475569'}}>{t.convictionLevel?.replace('_',' ')}</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{background:'rgba(255,255,255,0.03)',color:STATUS_COLORS[t.status]||'#475569'}}>{t.status}</span>
            </div>
          </div>
          {(t.catalysts||[]).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(t.catalysts||[]).slice(0,3).map((c,i)=><span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{background:'rgba(99,102,241,0.1)',color:'#818cf8'}}>{c}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const SECTOR_LIST = ['Technology','Industrials','Healthcare','Financial','Consumer','Energy','Materials','Utilities','Real Estate','Niche Software','Payments/Fintech','Aerospace/Defense','Waste/Environmental','Education/Workforce','Medical Devices','Specialty Finance'];

function WatchlistSubtab({watchlist, upWatch, theses, toasts}){
  const [detail, setDetail] = useState(null);
  const [sectorFilter, setSectorFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ticker:'',name:'',sector:'',thesisSummary:'',linkedThesisId:'',goldenEgg:false});

  function save(){
    if(!draft.ticker.trim()){ toasts.push('Ticker required'); return; }
    upWatch([...watchlist, {...draft, id:uid(), ticker:draft.ticker.toUpperCase(), redFlags:[], catalysts:[], lastUpdated:new Date().toISOString()}]);
    setDraft({ticker:'',name:'',sector:'',thesisSummary:'',linkedThesisId:'',goldenEgg:false});
    setShowForm(false); toasts.push('Added to watchlist');
  }
  function patch(id,updates){ upWatch(watchlist.map(w=>w.id===id?{...w,...updates,lastUpdated:new Date().toISOString()}:w)); }
  function del(id){ upWatch(watchlist.filter(w=>w.id!==id)); setDetail(null); toasts.push('Removed'); }

  const now = Date.now();
  const filtered = watchlist
    .filter(w=>sectorFilter==='all'||w.sector===sectorFilter)
    .filter(w=>!search||w.ticker.toLowerCase().includes(search.toLowerCase())||w.name?.toLowerCase().includes(search.toLowerCase()));

  const sectors = [...new Set(watchlist.map(w=>w.sector).filter(Boolean))];

  if(detail){
    const w = watchlist.find(x=>x.id===detail);
    if(!w){ setDetail(null); return null; }
    const stale = w.lastUpdated && (now - new Date(w.lastUpdated).getTime()) > 60*24*3600000;
    return (
      <div className="space-y-4">
        <button onClick={()=>setDetail(null)} className="text-sm" style={{color:'#6366f1'}}>← Back</button>
        <div className="glass rounded-xl p-5" style={{border:`1px solid ${stale?'rgba(245,158,11,0.3)':'rgba(255,255,255,0.08)'}`}}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{color:'#e2e8f0'}}>{w.ticker}</span>
                {w.goldenEgg && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{background:'rgba(245,158,11,0.15)',color:'#f59e0b'}}>🥚 Fund</span>}
                {stale && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:'rgba(245,158,11,0.1)',color:'#f59e0b'}}>⚠ Stale 60d+</span>}
              </div>
              <div className="text-sm mt-0.5" style={{color:'#64748b'}}>{w.name} · {w.sector}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>patch(w.id,{goldenEgg:!w.goldenEgg})} className="text-xs px-2 py-1 rounded" style={{color:w.goldenEgg?'#f59e0b':'#475569',border:`1px solid ${w.goldenEgg?'rgba(245,158,11,0.3)':'rgba(255,255,255,0.08)'}`}}>
                {w.goldenEgg?'🥚 Fund':'+ Fund'}
              </button>
              <button onClick={()=>del(w.id)} className="text-xs px-2 py-1 rounded" style={{color:'#ef4444',border:'1px solid rgba(239,68,68,0.2)'}}>Remove</button>
            </div>
          </div>
          {[['thesisSummary','Thesis Summary',3],['valuationSnapshot','Valuation Snapshot',2]].map(([f,label,rows])=>(
            <div key={f} className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color:'#475569'}}>{label}</div>
              <textarea rows={rows} className="w-full bg-transparent text-sm rounded-lg p-2.5 resize-none" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}}
                value={w[f]||''} onChange={e=>patch(w.id,{[f]:e.target.value})} placeholder={`Add ${label.toLowerCase()}…`}/>
            </div>
          ))}
          {/* Red flags */}
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color:'#ef4444'}}>Red Flags</div>
            {(w.redFlags||[]).map((f,i)=>(
              <div key={i} className="flex items-center gap-2 mb-1">
                <span className="flex-1 text-sm" style={{color:'#f87171'}}>{f}</span>
                <button onClick={()=>patch(w.id,{redFlags:(w.redFlags||[]).filter((_,j)=>j!==i)})} style={{color:'#475569',fontSize:'12px'}}>×</button>
              </div>
            ))}
            <input className="w-full bg-transparent text-xs rounded px-2 py-1.5 mt-1" style={{border:'1px solid rgba(239,68,68,0.2)',color:'#94a3b8'}}
              placeholder="Add red flag…" onKeyDown={e=>{ if(e.key==='Enter'&&e.target.value.trim()){ patch(w.id,{redFlags:[...(w.redFlags||[]),e.target.value.trim()]}); e.target.value=''; }}}/>
          </div>
          {/* Catalysts */}
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color:'#10b981'}}>Catalysts</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {(w.catalysts||[]).map((c,i)=>(
                <span key={i} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{background:'rgba(16,185,129,0.12)',color:'#10b981'}}>
                  {c} <button onClick={()=>patch(w.id,{catalysts:(w.catalysts||[]).filter((_,j)=>j!==i)})} style={{color:'#475569'}}>×</button>
                </span>
              ))}
            </div>
            <input className="w-full bg-transparent text-xs rounded px-2 py-1.5" style={{border:'1px solid rgba(16,185,129,0.15)',color:'#94a3b8'}}
              placeholder="Add catalyst…" onKeyDown={e=>{ if(e.key==='Enter'&&e.target.value.trim()){ patch(w.id,{catalysts:[...(w.catalysts||[]),e.target.value.trim()]}); e.target.value=''; }}}/>
          </div>
          {/* Link to thesis */}
          {theses.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color:'#475569'}}>Linked Thesis</div>
              <select value={w.linkedThesisId||''} onChange={e=>patch(w.id,{linkedThesisId:e.target.value})} className="bg-transparent text-sm rounded-lg px-2.5 py-2 border w-full" style={{borderColor:'rgba(255,255,255,0.08)',color:'#94a3b8'}}>
                <option value="">None</option>
                {theses.map(t=><option key={t.id} value={t.id}>{t.company}</option>)}
              </select>
            </div>
          )}
          {w.lastUpdated && <div className="text-xs mt-3" style={{color:'#334155'}}>Updated {new Date(w.lastUpdated).toLocaleDateString()}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-2">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ticker or name…" className="flex-1 bg-transparent text-sm rounded-xl px-3 py-2" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}/>
        <button onClick={()=>setShowForm(!showForm)} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white',flexShrink:0}}>+ Add</button>
      </div>
      {sectors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button onClick={()=>setSectorFilter('all')} className="text-xs px-2 py-0.5 rounded-full" style={{background:sectorFilter==='all'?'rgba(99,102,241,0.15)':'transparent',color:sectorFilter==='all'?'#818cf8':'#475569',border:`1px solid ${sectorFilter==='all'?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)'}`}}>All ({watchlist.length})</button>
          {sectors.map(s=>(
            <button key={s} onClick={()=>setSectorFilter(s)} className="text-xs px-2 py-0.5 rounded-full" style={{background:sectorFilter===s?'rgba(99,102,241,0.15)':'transparent',color:sectorFilter===s?'#818cf8':'#475569',border:`1px solid ${sectorFilter===s?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.06)'}`}}>{s}</button>
          ))}
        </div>
      )}
      {showForm && (
        <div className="glass rounded-xl p-4 space-y-3" style={{border:'1px solid rgba(99,102,241,0.2)'}}>
          <div className="text-sm font-semibold" style={{color:'#818cf8'}}>Add to Watchlist</div>
          <div className="grid grid-cols-2 gap-2">
            <input className="bg-transparent text-sm rounded-lg px-2.5 py-2" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}} placeholder="Ticker *" value={draft.ticker} onChange={e=>setDraft(d=>({...d,ticker:e.target.value.toUpperCase()}))}/>
            <input className="bg-transparent text-sm rounded-lg px-2.5 py-2" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}} placeholder="Company Name" value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/>
          </div>
          <select value={draft.sector} onChange={e=>setDraft(d=>({...d,sector:e.target.value}))} className="w-full bg-transparent text-sm rounded-lg px-2.5 py-2 border" style={{borderColor:'rgba(255,255,255,0.08)',color:'#94a3b8'}}>
            <option value="">Select sector…</option>
            {SECTOR_LIST.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-3">
            <button onClick={save} className="px-4 py-1.5 rounded-xl text-sm font-bold" style={{background:'rgba(16,185,129,0.15)',color:'#10b981',border:'1px solid rgba(16,185,129,0.25)'}}>Add</button>
            <button onClick={()=>setShowForm(false)} className="text-xs" style={{color:'#475569'}}>Cancel</button>
            <label className="flex items-center gap-1.5 ml-auto text-xs" style={{color:'#f59e0b'}}>
              <input type="checkbox" checked={draft.goldenEgg} onChange={e=>setDraft(d=>({...d,goldenEgg:e.target.checked}))}/> 🥚 Fund
            </label>
          </div>
        </div>
      )}
      {!filtered.length && <div className="text-sm text-center py-8" style={{color:'#334155'}}>No companies yet. Aim for 50–300 entries across 2–3 sectors.</div>}
      <div className="grid gap-2">
        {filtered.map(w=>{
          const stale = w.lastUpdated && (now - new Date(w.lastUpdated).getTime()) > 60*24*3600000;
          return (
            <div key={w.id} className="glass rounded-xl px-4 py-3 cursor-pointer flex items-center gap-3" onClick={()=>setDetail(w.id)}
              style={{border:`1px solid ${stale?'rgba(245,158,11,0.2)':'rgba(255,255,255,0.06)'}`}}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{color:'#e2e8f0'}}>{w.ticker}</span>
                  {w.goldenEgg && <span style={{fontSize:'13px'}}>🥚</span>}
                  {stale && <span className="text-xs" style={{color:'#f59e0b'}}>⚠</span>}
                </div>
                <div className="text-xs mt-0.5 truncate" style={{color:'#475569'}}>{w.name} {w.sector && `· ${w.sector}`}</div>
              </div>
              {(w.redFlags||[]).length > 0 && <span className="text-xs flex-shrink-0" style={{color:'#f87171'}}>⚑ {(w.redFlags||[]).length}</span>}
              {w.lastUpdated && <span className="text-xs flex-shrink-0" style={{color:'#334155'}}>{new Date(w.lastUpdated).toLocaleDateString('en',{month:'short',day:'numeric'})}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DecisionSubtab({decisions, upDec, toasts, theses}){
  const [detail, setDetail] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({decision:'',reasoningAtTheTime:'',expectedOutcome:'',confidenceLevel:'medium',linkedThesisId:''});

  function save(){
    if(!draft.decision.trim()){ toasts.push('Decision text required'); return; }
    upDec([...decisions, {...draft, id:uid(), date:new Date().toISOString(), actualOutcome:'', whatIWasRight:'', whatIWasWrong:''}]);
    setDraft({decision:'',reasoningAtTheTime:'',expectedOutcome:'',confidenceLevel:'medium',linkedThesisId:''});
    setShowForm(false); toasts.push('Decision logged');
  }
  function patch(id,u){ upDec(decisions.map(d=>d.id===id?{...d,...u}:d)); }
  function del(id){ upDec(decisions.filter(d=>d.id!==id)); setDetail(null); }

  const now = Date.now();
  const needsPostmortem = decisions.filter(d=>!d.actualOutcome&&(now-new Date(d.date).getTime())>90*24*3600000);

  if(detail){
    const d = decisions.find(x=>x.id===detail);
    if(!d){ setDetail(null); return null; }
    const daysOld = Math.floor((now-new Date(d.date).getTime())/86400000);
    const pmDue = !d.actualOutcome && daysOld >= 90;
    return (
      <div className="space-y-4">
        <button onClick={()=>setDetail(null)} className="text-sm" style={{color:'#6366f1'}}>← Back</button>
        <div className="glass rounded-xl p-5 space-y-4" style={{border:`1px solid ${pmDue?'rgba(245,158,11,0.3)':'rgba(255,255,255,0.08)'}`}}>
          {pmDue && <div className="text-xs p-2.5 rounded-lg" style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',color:'#f59e0b'}}>⚠ {daysOld} days old — postmortem due</div>}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color:'#475569'}}>Decision</div>
            <textarea rows={2} className="w-full bg-transparent text-sm rounded-lg p-2.5 resize-none" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}} value={d.decision} onChange={e=>patch(d.id,{decision:e.target.value})}/>
          </div>
          {[['reasoningAtTheTime','Reasoning at the Time'],['expectedOutcome','Expected Outcome'],['actualOutcome','Actual Outcome (postmortem)'],['whatIWasRight','What I Was Right About'],['whatIWasWrong','What I Was Wrong About']].map(([f,label])=>(
            <div key={f}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color:f.startsWith('actual')||f.startsWith('what')?'#10b981':'#475569'}}>{label}</div>
              <textarea rows={2} className="w-full bg-transparent text-sm rounded-lg p-2.5 resize-none" style={{border:`1px solid ${f.startsWith('actual')||f.startsWith('what')?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.06)'}`,color:'#e2e8f0'}}
                value={d[f]||''} onChange={e=>patch(d.id,{[f]:e.target.value})} placeholder={label}/>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <div className="text-xs" style={{color:'#334155'}}>Logged {new Date(d.date).toLocaleDateString()} · {daysOld}d ago · Confidence: {d.confidenceLevel}</div>
            <button onClick={()=>del(d.id)} className="text-xs px-2 py-1 rounded" style={{color:'#ef4444',border:'1px solid rgba(239,68,68,0.2)'}}>Delete</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {needsPostmortem.length > 0 && (
        <div className="p-3 rounded-xl" style={{background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.2)'}}>
          <div className="text-xs font-semibold" style={{color:'#f59e0b'}}>⚠ {needsPostmortem.length} decision{needsPostmortem.length>1?'s':''} 90d+ old without postmortem</div>
          {needsPostmortem.slice(0,2).map(d=><div key={d.id} className="text-xs mt-1 cursor-pointer underline" style={{color:'#f59e0b'}} onClick={()=>setDetail(d.id)}>{d.decision.slice(0,60)}…</div>)}
        </div>
      )}
      <div className="flex justify-end">
        <button onClick={()=>setShowForm(!showForm)} className="px-3 py-1.5 rounded-xl text-sm font-semibold" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white'}}>+ Log Decision</button>
      </div>
      {showForm && (
        <div className="glass rounded-xl p-4 space-y-3" style={{border:'1px solid rgba(99,102,241,0.2)'}}>
          <div className="text-sm font-semibold" style={{color:'#818cf8'}}>Log Decision — right now, at decision time</div>
          {[['decision','Decision (what exactly are you deciding?)'],['reasoningAtTheTime','Reasoning at this moment'],['expectedOutcome','Expected outcome']].map(([k,ph])=>(
            <textarea key={k} rows={k==='decision'?1:2} className="w-full bg-transparent text-sm rounded-lg p-2.5 resize-none block" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}}
              placeholder={ph} value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}/>
          ))}
          <div className="flex gap-3 items-center">
            <select value={draft.confidenceLevel} onChange={e=>setDraft(d=>({...d,confidenceLevel:e.target.value}))} className="bg-transparent text-xs rounded px-2 py-1.5 border" style={{borderColor:'rgba(255,255,255,0.1)',color:'#94a3b8'}}>
              {['low','medium','high'].map(v=><option key={v} value={v}>{v} confidence</option>)}
            </select>
            {theses.length > 0 && <select value={draft.linkedThesisId} onChange={e=>setDraft(d=>({...d,linkedThesisId:e.target.value}))} className="bg-transparent text-xs rounded px-2 py-1.5 border" style={{borderColor:'rgba(255,255,255,0.1)',color:'#94a3b8'}}>
              <option value="">Link thesis…</option>
              {theses.map(t=><option key={t.id} value={t.id}>{t.company}</option>)}
            </select>}
            <button onClick={save} className="px-4 py-1.5 rounded-xl text-sm font-bold" style={{background:'rgba(16,185,129,0.15)',color:'#10b981',border:'1px solid rgba(16,185,129,0.25)'}}>Log</button>
            <button onClick={()=>setShowForm(false)} className="text-xs" style={{color:'#475569'}}>Cancel</button>
          </div>
        </div>
      )}
      {!decisions.length && <div className="text-sm text-center py-8" style={{color:'#334155'}}>No decisions logged yet. Log at decision time — not after.</div>}
      {decisions.slice().reverse().map(d=>{
        const daysOld = Math.floor((now-new Date(d.date).getTime())/86400000);
        const pmDue = !d.actualOutcome && daysOld>=90;
        const pmDone = !!d.actualOutcome;
        return (
          <div key={d.id} className="glass rounded-xl p-4 cursor-pointer" onClick={()=>setDetail(d.id)}
            style={{border:`1px solid ${pmDue?'rgba(245,158,11,0.25)':pmDone?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.06)'}`}}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-2" style={{color:'#e2e8f0'}}>{d.decision}</div>
                <div className="text-xs mt-1" style={{color:'#475569'}}>{new Date(d.date).toLocaleDateString()} · {daysOld}d ago · {d.confidenceLevel} confidence</div>
              </div>
              <span className="text-xs flex-shrink-0 px-1.5 py-0.5 rounded" style={{background:pmDone?'rgba(16,185,129,0.1)':pmDue?'rgba(245,158,11,0.1)':'rgba(255,255,255,0.04)',color:pmDone?'#10b981':pmDue?'#f59e0b':'#334155'}}>
                {pmDone?'✓ PM done':pmDue?'PM due':'pending'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================== §8 MENTAL MODELS PANEL ================== */
function MentalModelsPanel({data, setData, toasts}){
  const models = data.mentalModels || [];
  const [detail, setDetail] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState({name:'',description:'',whenToUse:'',example:'',tags:''});

  function save(){
    if(!draft.name.trim()){ toasts.push('Name required'); return; }
    setData(d=>({...d, mentalModels:[...d.mentalModels||[], {...draft, id:uid(), tags:draft.tags.split(',').map(s=>s.trim()).filter(Boolean)}]}));
    setDraft({name:'',description:'',whenToUse:'',example:'',tags:''}); setShowForm(false); toasts.push('Model saved');
  }
  function del(id){ setData(d=>({...d, mentalModels:(d.mentalModels||[]).filter(m=>m.id!==id)})); setDetail(null); }
  function patch(id,u){ setData(d=>({...d, mentalModels:(d.mentalModels||[]).map(m=>m.id===id?{...m,...u}:m)})); }

  const filtered = models.filter(m=>!search||m.name.toLowerCase().includes(search.toLowerCase())||m.description?.toLowerCase().includes(search.toLowerCase())||(m.tags||[]).some(t=>t.toLowerCase().includes(search.toLowerCase())));

  if(detail){
    const m = models.find(x=>x.id===detail);
    if(!m){ setDetail(null); return null; }
    return (
      <div className="space-y-4">
        <button onClick={()=>setDetail(null)} className="text-sm" style={{color:'#6366f1'}}>← Back</button>
        <div className="glass rounded-xl p-5 space-y-4" style={{border:'1px solid rgba(139,92,246,0.2)'}}>
          <div className="text-xl font-bold">{m.name}</div>
          {(m.tags||[]).length > 0 && <div className="flex flex-wrap gap-1">{(m.tags||[]).map(t=><span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(139,92,246,0.12)',color:'#a78bfa'}}>{t}</span>)}</div>}
          {[['description','Description','#e2e8f0'],['whenToUse','When to Use','#94a3b8'],['example','Example','#64748b']].map(([f,label,c])=>(
            <div key={f}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{color:'#475569'}}>{label}</div>
              <textarea rows={3} className="w-full bg-transparent text-sm rounded-lg p-2.5 resize-none" style={{border:'1px solid rgba(255,255,255,0.06)',color:c}}
                value={m[f]||''} onChange={e=>patch(m.id,{[f]:e.target.value})} placeholder={label}/>
            </div>
          ))}
          <button onClick={()=>del(m.id)} className="text-xs px-2 py-1 rounded" style={{color:'#ef4444',border:'1px solid rgba(239,68,68,0.2)'}}>Delete model</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">Mental Models</h2>
        <button onClick={()=>setShowForm(!showForm)} className="px-3 py-1.5 rounded-xl text-sm font-semibold" style={{background:'linear-gradient(90deg,#8b5cf6,#6366f1)',color:'white'}}>+ Add</button>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search models…" className="w-full bg-transparent text-sm rounded-xl px-3 py-2 mb-4" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}/>
      {showForm && (
        <div className="glass rounded-xl p-4 mb-4 space-y-3" style={{border:'1px solid rgba(139,92,246,0.2)'}}>
          <div className="text-sm font-semibold" style={{color:'#a78bfa'}}>New Mental Model</div>
          <input className="w-full bg-transparent text-sm rounded-lg px-2.5 py-2" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}} placeholder="Name *" value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/>
          {[['description','Description'],['whenToUse','When to Use'],['example','Example']].map(([k,ph])=>(
            <textarea key={k} rows={2} className="w-full bg-transparent text-sm rounded-lg p-2.5 resize-none block" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}}
              placeholder={ph} value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}/>
          ))}
          <input className="w-full bg-transparent text-sm rounded-lg px-2.5 py-2" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}} placeholder="Tags (comma-separated): investing, strategy…" value={draft.tags} onChange={e=>setDraft(d=>({...d,tags:e.target.value}))}/>
          <div className="flex gap-3">
            <button onClick={save} className="px-4 py-1.5 rounded-xl text-sm font-bold" style={{background:'rgba(139,92,246,0.2)',color:'#a78bfa',border:'1px solid rgba(139,92,246,0.3)'}}>Save</button>
            <button onClick={()=>setShowForm(false)} className="text-xs" style={{color:'#475569'}}>Cancel</button>
          </div>
        </div>
      )}
      {!filtered.length && <div className="text-sm text-center py-8" style={{color:'#334155'}}>No models match — search or add one.</div>}
      <div className="grid gap-3">
        {filtered.map(m=>(
          <div key={m.id} className="glass rounded-xl p-4 cursor-pointer" onClick={()=>setDetail(m.id)} style={{border:'1px solid rgba(139,92,246,0.12)'}}>
            <div className="font-semibold mb-1" style={{color:'#e2e8f0'}}>{m.name}</div>
            <div className="text-sm line-clamp-2" style={{color:'#64748b'}}>{m.description}</div>
            {(m.tags||[]).length > 0 && <div className="flex flex-wrap gap-1 mt-2">{(m.tags||[]).map(t=><span key={t} className="text-xs px-1.5 py-0.5 rounded-full" style={{background:'rgba(139,92,246,0.1)',color:'#a78bfa'}}>{t}</span>)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================== §12 DEEP WORK RAMP PANEL ================== */
function DeepWorkRampPanel({data, setData, toasts}){
  const rampSessions = data.rampSessions || [];
  const ritual = data.rampRitual || {cue:'',timerMin:75};
  const [phase, setPhase] = useState('start'); // start | step1..7 | running | closeout | history
  const [stepIdx, setStepIdx] = useState(0);
  const [sessionDraft, setSessionDraft] = useState({deliverable:'',residue:'',intention:'',challengeRating:'edge',envChecks:[false,false,false,false],cueConfirmed:false,timerLengthMin:ritual.timerMin||75});
  const [timerSecs, setTimerSecs] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [cueInput, setCueInput] = useState(ritual.cue||'');
  const timerRef = useRef(null);
  const sessionStartRef = useRef(null);

  const DW_END_KEY   = 'magverse:deepwork:timerEndMs';
  const DW_DRAFT_KEY = 'magverse:deepwork:timerDraft';
  const DW_START_KEY = 'magverse:deepwork:timerStartedAt';

  // On mount: restore timer if it was running while user navigated away
  useEffect(()=>{
    try{
      const endMs = parseInt(localStorage.getItem(DW_END_KEY)||'0');
      if(!endMs) return;
      const remaining = Math.ceil((endMs - Date.now())/1000);
      const draftJson = localStorage.getItem(DW_DRAFT_KEY);
      const startedAt = localStorage.getItem(DW_START_KEY);
      if(draftJson) try{ setSessionDraft(JSON.parse(draftJson)); }catch{}
      if(startedAt) sessionStartRef.current = startedAt;
      if(remaining > 0){
        setTimerSecs(remaining);
        setTimerActive(true);
        setPhase('running');
      } else {
        // expired while away — go straight to closeout
        localStorage.removeItem(DW_END_KEY);
        localStorage.removeItem(DW_DRAFT_KEY);
        localStorage.removeItem(DW_START_KEY);
        setPhase('closeout');
      }
    }catch{}
  },[]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer tick — recalculate from stored end timestamp to stay accurate across navigation
  useEffect(()=>{
    if(timerActive){
      timerRef.current = setInterval(()=>{
        try{
          const endMs = parseInt(localStorage.getItem(DW_END_KEY)||'0');
          const remaining = endMs ? Math.ceil((endMs - Date.now())/1000) : 0;
          if(remaining <= 0){
            clearInterval(timerRef.current);
            localStorage.removeItem(DW_END_KEY);
            localStorage.removeItem(DW_DRAFT_KEY);
            localStorage.removeItem(DW_START_KEY);
            setTimerSecs(0);
            setTimerActive(false);
            setPhase('closeout');
          } else {
            setTimerSecs(remaining);
          }
        }catch{}
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return ()=>clearInterval(timerRef.current);
  },[timerActive]);

  function startTimer(){
    const secs = (sessionDraft.timerLengthMin||75)*60;
    const endMs = Date.now() + secs*1000;
    const startedAt = new Date().toISOString();
    sessionStartRef.current = startedAt;
    try{
      localStorage.setItem(DW_END_KEY, String(endMs));
      localStorage.setItem(DW_DRAFT_KEY, JSON.stringify(sessionDraft));
      localStorage.setItem(DW_START_KEY, startedAt);
    }catch{}
    setTimerSecs(secs);
    setTimerActive(true);
    setPhase('running');
  }

  function stopEarly(){
    try{
      localStorage.removeItem(DW_END_KEY);
      localStorage.removeItem(DW_DRAFT_KEY);
      localStorage.removeItem(DW_START_KEY);
    }catch{}
    setTimerActive(false);
    setPhase('closeout');
  }

  const [closeoutNote, setCloseoutNote] = useState('');
  const [nextMicro, setNextMicro] = useState('');

  function finishSession(){
    try{
      localStorage.removeItem(DW_END_KEY);
      localStorage.removeItem(DW_DRAFT_KEY);
      localStorage.removeItem(DW_START_KEY);
    }catch{}
    const session = {
      id:uid(), startedAt:sessionStartRef.current||new Date().toISOString(),
      deliverable:sessionDraft.deliverable, implementationIntention:sessionDraft.intention,
      challengeRating:sessionDraft.challengeRating,
      timerLengthMin:sessionDraft.timerLengthMin, completed:true,
      outcomeNote:closeoutNote, nextMicroAction:nextMicro,
    };
    setData(d=>({...d, rampSessions:[...(d.rampSessions||[]), session]}));
    toasts.push('Session logged');
    setPhase('start');
    setStepIdx(0);
    setCloseoutNote(''); setNextMicro('');
    setSessionDraft({deliverable:'',residue:'',intention:'',challengeRating:'edge',envChecks:[false,false,false,false],cueConfirmed:false,timerLengthMin:ritual.timerMin||75});
  }

  const ENV_ITEMS = ['Single focused tab/app open','Phone in another room or on DND','Water or coffee ready','Headphones/quiet environment set'];
  const totalSecs = (sessionDraft.timerLengthMin||75)*60;
  const pct = timerSecs > 0 ? Math.round(100*timerSecs/totalSecs) : 0;
  const minsLeft = Math.floor(timerSecs/60), secsLeft = timerSecs%60;
  const recentSessions = rampSessions.slice(-10).reverse();

  // STEPS
  const steps = [
    {label:'Residue Dump', emoji:'🧠', tip:'Leave the last task behind. What were you doing, and exactly where did you leave it?'},
    {label:'Define Deliverable', emoji:'🎯', tip:'One concrete, checkable output for this session. Not "work on X" — "complete the Y section of Z."'},
    {label:'Implementation Intention', emoji:'✍️', tip:'"When the timer starts, I will [deliverable] until [stopping point]."'},
    {label:'Environment Lock', emoji:'🔒', tip:'Quick checklist. Distraction removal is the cheapest focus upgrade.'},
    {label:'Challenge Calibration', emoji:'⚖️', tip:'Flow requires the task to sit slightly above current skill. Too easy or too hard → adjust scope.'},
    {label:'Entry Cue', emoji:'🎬', tip:'Run your fixed micro-ritual — the same sequence every time. Consistency is the mechanism, not the content.'},
  ];

  if(phase==='history'){
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={()=>setPhase('start')} className="text-sm" style={{color:'#6366f1'}}>← Back</button>
          <h2 className="text-xl font-bold">Session History</h2>
        </div>
        {!recentSessions.length && <div className="text-sm text-center py-8" style={{color:'#334155'}}>No sessions yet.</div>}
        <div className="space-y-3">
          {recentSessions.map(s=>(
            <div key={s.id} className="glass rounded-xl p-4" style={{border:'1px solid rgba(255,255,255,0.06)'}}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{color:'#e2e8f0'}}>{s.deliverable}</div>
                  <div className="text-xs mt-1" style={{color:'#475569'}}>{new Date(s.startedAt).toLocaleDateString()} · {s.timerLengthMin}min · {s.challengeRating}</div>
                  {s.outcomeNote && <div className="text-xs mt-1" style={{color:'#64748b'}}>Outcome: {s.outcomeNote}</div>}
                  {s.nextMicroAction && <div className="text-xs mt-0.5" style={{color:'#6366f1'}}>Next: {s.nextMicroAction}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if(phase==='running'){
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-6">
        <div className="text-xs font-semibold uppercase tracking-widest" style={{color:'#475569'}}>Deep Work Session</div>
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#6366f1" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2*Math.PI*42}`} strokeDashoffset={`${2*Math.PI*42*(1-pct/100)}`} style={{transition:'stroke-dashoffset 1s linear'}}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold tabular-nums">{String(minsLeft).padStart(2,'0')}:{String(secsLeft).padStart(2,'0')}</div>
            <div className="text-xs" style={{color:'#475569'}}>remaining</div>
          </div>
        </div>
        <div className="glass rounded-xl p-3 text-sm text-center max-w-xs" style={{border:'1px solid rgba(99,102,241,0.2)',color:'#a5b4fc'}}>
          {sessionDraft.intention || sessionDraft.deliverable}
        </div>
        <button onClick={stopEarly} className="px-4 py-2 rounded-xl text-sm" style={{color:'#475569',border:'1px solid rgba(255,255,255,0.08)'}}>Stop early →</button>
      </div>
    );
  }

  if(phase==='closeout'){
    return (
      <div className="space-y-4">
        <div className="text-xl font-bold">Session Close-Out</div>
        <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(16,185,129,0.2)'}}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{color:'#10b981'}}>Deliverable was: {sessionDraft.deliverable}</div>
          <textarea rows={3} className="w-full bg-transparent text-sm rounded-lg p-2.5 resize-none" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}}
            placeholder="What actually got done vs. what you planned?" value={closeoutNote} onChange={e=>setCloseoutNote(e.target.value)}/>
        </div>
        <div className="glass rounded-xl p-4" style={{border:'1px solid rgba(99,102,241,0.2)'}}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{color:'#6366f1'}}>Exact next micro-action</div>
          <div className="text-xs mb-2" style={{color:'#475569'}}>Capture where exactly you left off — this feeds the next session's residue dump and lowers intrusive "unfinished" pull.</div>
          <textarea rows={2} className="w-full bg-transparent text-sm rounded-lg p-2.5 resize-none" style={{border:'1px solid rgba(255,255,255,0.06)',color:'#e2e8f0'}}
            placeholder="The NEXT specific micro-action when I return: …" value={nextMicro} onChange={e=>setNextMicro(e.target.value)}/>
        </div>
        <button onClick={finishSession} className="w-full py-3 rounded-xl font-bold text-sm" style={{background:'rgba(16,185,129,0.15)',color:'#10b981',border:'1px solid rgba(16,185,129,0.25)'}}>Log & Finish</button>
      </div>
    );
  }

  // WIZARD: steps 0–5
  if(phase==='steps'){
    const step = steps[stepIdx];
    return (
      <div className="space-y-4">
        {/* Progress bar */}
        <div className="flex gap-1 mb-2">
          {steps.map((_,i)=>(
            <div key={i} className="flex-1 h-1 rounded-full" style={{background:i<=stepIdx?'#6366f1':'rgba(255,255,255,0.08)'}}/>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span style={{fontSize:'24px'}}>{step.emoji}</span>
          <div>
            <div className="font-bold">Step {stepIdx+1} of {steps.length}: {step.label}</div>
            <div className="text-xs mt-0.5" style={{color:'#475569'}}>{step.tip}</div>
          </div>
        </div>

        {/* Step 0: Residue dump */}
        {stepIdx===0 && (
          <textarea rows={4} className="w-full bg-transparent text-sm rounded-xl p-3 resize-none" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}
            placeholder="What were you just doing, and where exactly did you leave it?" value={sessionDraft.residue} onChange={e=>setSessionDraft(d=>({...d,residue:e.target.value}))}/>
        )}

        {/* Step 1: Deliverable */}
        {stepIdx===1 && (
          <>
            <textarea rows={3} className="w-full bg-transparent text-sm rounded-xl p-3 resize-none" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}
              placeholder='E.g. "Write the counter-argument section of the [[Company X]] thesis"' value={sessionDraft.deliverable} onChange={e=>setSessionDraft(d=>({...d,deliverable:e.target.value}))}/>
            {!sessionDraft.deliverable.trim() && <div className="text-xs" style={{color:'#f59e0b'}}>⚠ Be specific — reject vague goals like "work on thesis"</div>}
          </>
        )}

        {/* Step 2: Implementation intention */}
        {stepIdx===2 && (
          <>
            <div className="text-xs mb-2" style={{color:'#475569'}}>Auto-generated from your deliverable — edit freely:</div>
            <textarea rows={3} className="w-full bg-transparent text-sm rounded-xl p-3 resize-none" style={{border:'1px solid rgba(99,102,241,0.2)',color:'#c7d2fe'}}
              value={sessionDraft.intention || `When the timer starts, I will ${sessionDraft.deliverable||'[deliverable]'} until the session ends.`}
              onChange={e=>setSessionDraft(d=>({...d,intention:e.target.value}))}/>
          </>
        )}

        {/* Step 3: Environment lock */}
        {stepIdx===3 && (
          <div className="space-y-2">
            {ENV_ITEMS.map((item,i)=>(
              <label key={i} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${sessionDraft.envChecks[i]?'rgba(16,185,129,0.25)':'rgba(255,255,255,0.06)'}`}}>
                <input type="checkbox" checked={sessionDraft.envChecks[i]} onChange={e=>{const c=[...sessionDraft.envChecks]; c[i]=e.target.checked; setSessionDraft(d=>({...d,envChecks:c}));}}/>
                <span className="text-sm" style={{color:sessionDraft.envChecks[i]?'#10b981':'#94a3b8'}}>{item}</span>
              </label>
            ))}
          </div>
        )}

        {/* Step 4: Challenge calibration */}
        {stepIdx===4 && (
          <div className="space-y-3">
            {[['easy','Too easy','#475569','Cut the scope or add a harder constraint'],['edge','Right at the edge ✓','#10b981','Perfect — proceed'],['hard','Too hard','#f59e0b','Narrow scope: cut to just the outline or first sub-section']].map(([v,l,c,hint])=>(
              <div key={v} onClick={()=>setSessionDraft(d=>({...d,challengeRating:v}))} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                style={{background:sessionDraft.challengeRating===v?`${c}15`:'rgba(255,255,255,0.02)',border:`1px solid ${sessionDraft.challengeRating===v?c+'40':'rgba(255,255,255,0.06)'}`}}>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{borderColor:c,background:sessionDraft.challengeRating===v?c:'transparent'}}>
                  {sessionDraft.challengeRating===v && <div className="w-2 h-2 rounded-full bg-white"/>}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{color:c}}>{l}</div>
                  <div className="text-xs" style={{color:'#475569'}}>{hint}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 5: Entry cue */}
        {stepIdx===5 && (
          <div className="space-y-3">
            <div className="text-sm" style={{color:'#94a3b8'}}>Your fixed entry ritual — write the full sequence you run every session:</div>
            <textarea rows={4} className="w-full bg-transparent text-sm rounded-xl p-3 resize-none" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}}
              placeholder={`E.g. "Start lo-fi playlist, open only one tab, type 'focus mode activated', take 3 deep breaths, read my deliverable"`}
              value={cueInput} onChange={e=>setCueInput(e.target.value)}/>
            {cueInput.trim()!==ritual.cue&&(
              <button onClick={()=>setData(d=>({...d,rampRitual:{...(d.rampRitual||{}),cue:cueInput.trim()}}))}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{background:'rgba(99,102,241,0.15)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.25)'}}>
                Save ritual
              </button>
            )}
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{color:'#94a3b8'}}>Session length:</span>
              <input type="number" min={25} max={180} className="w-20 bg-transparent text-sm rounded px-2 py-1 text-center" style={{border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0'}}
                value={sessionDraft.timerLengthMin} onChange={e=>setSessionDraft(d=>({...d,timerLengthMin:parseInt(e.target.value)||75}))}/>
              <span className="text-sm" style={{color:'#475569'}}>min</span>
            </div>
            <div className="text-xs" style={{color:'#334155'}}>Suggested: 50–90 min blocks. Take a real break between.</div>
          </div>
        )}

        {/* Nav */}
        <div className="flex gap-3 pt-2">
          {stepIdx > 0 && <button onClick={()=>setStepIdx(i=>i-1)} className="px-4 py-2 rounded-xl text-sm" style={{color:'#475569',border:'1px solid rgba(255,255,255,0.08)'}}>← Back</button>}
          {stepIdx < steps.length-1 ? (
            <button onClick={()=>{
              if(stepIdx===1&&!sessionDraft.deliverable.trim()){ toasts.push('Write a specific deliverable first'); return; }
              if(stepIdx===2&&!sessionDraft.intention.trim()) setSessionDraft(d=>({...d,intention:`When the timer starts, I will ${d.deliverable} until the session ends.`}));
              setStepIdx(i=>i+1);
            }} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8',border:'1px solid rgba(99,102,241,0.25)'}}>
              Next →
            </button>
          ) : (
            <button onClick={startTimer} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white',boxShadow:'0 0 20px rgba(99,102,241,0.4)'}}>
              🚀 Start {sessionDraft.timerLengthMin}min session
            </button>
          )}
        </div>
      </div>
    );
  }

  // START screen
  const streak = rampSessions.length;
  const lastNext = rampSessions.length ? rampSessions[rampSessions.length-1].nextMicroAction : null;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deep Work Ramp</h2>
          <div className="text-xs mt-1" style={{color:'#475569'}}>Pre-session protocol · ~3 min to start · {streak} session{streak!==1?'s':''} logged</div>
        </div>
        <button onClick={()=>setPhase('history')} className="text-xs px-2 py-1 rounded" style={{color:'#475569',border:'1px solid rgba(255,255,255,0.08)'}}>History</button>
      </div>
      {lastNext && (
        <div className="glass rounded-xl p-3" style={{border:'1px solid rgba(99,102,241,0.2)'}}>
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{color:'#6366f1'}}>Next micro-action from last session:</div>
          <div className="text-sm" style={{color:'#c7d2fe'}}>{lastNext}</div>
        </div>
      )}
      <div className="grid gap-2">
        {steps.map((s,i)=>(
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)'}}>
            <span style={{fontSize:'18px'}}>{s.emoji}</span>
            <div>
              <div className="text-sm font-medium">Step {i+1}: {s.label}</div>
              <div className="text-xs" style={{color:'#334155'}}>{s.tip.slice(0,60)}…</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>{ setPhase('steps'); setStepIdx(0); }}
        className="w-full py-4 rounded-2xl text-base font-bold transition-all"
        style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'white',boxShadow:'0 0 24px rgba(99,102,241,0.35)'}}>
        Begin Ramp Protocol →
      </button>
    </div>
  );
}

/* ================== §6 REVIEW DIGEST PANEL ================== */
function ReviewPanel({data, toasts}){
  const [mode, setMode] = useState('daily');

  const now = new Date();
  const todayStr = now.toISOString().slice(0,10);
  const weekAgo  = new Date(now.getTime()-7*86400000);

  // ── Daily digest data ──
  const todayJournals = (data.journals||[]).filter(j=>j.date===todayStr);
  const todayTasks = (data.assignments||[]).filter(t=>{ const d=t.dueDate; return d===todayStr; });
  const doneTodayTasks = todayTasks.filter(t=>t.status==='Done');
  const slippedTasks = todayTasks.filter(t=>t.status!=='Done');
  const todayHabits = (data.habits||[]);
  const inboxUntriaged = (data.inbox||[]);
  const oldInbox = inboxUntriaged.filter(i=>new Date(i.createdAt)<new Date(now.getTime()-48*3600000));
  const todayEvents = (data.events||[]).filter(e=>e.when?.day===((now.getDay()+6)%7));
  const rampToday = (data.rampSessions||[]).filter(s=>s.startedAt?.slice(0,10)===todayStr);
  const decisionsPmDue = (data.decisionJournal||[]).filter(d=>!d.actualOutcome&&(now-new Date(d.date).getTime())>90*86400000);

  // People follow-up
  const followUps = (data.social||[]).filter(s=>{
    if(!s.nextFollowUp) return false;
    return new Date(s.nextFollowUp)<=now;
  });

  // ── Weekly digest data ──
  const weekJournals = (data.journals||[]).filter(j=>new Date(j.date)>=weekAgo);
  const weekTasks = (data.assignments||[]).filter(t=>{
    if(t.status==='Done'&&t.completedAt) return new Date(t.completedAt)>=weekAgo;
    return false;
  });
  const weekWatchUpdated = (data.companyWatchlist||[]).filter(w=>w.lastUpdated&&new Date(w.lastUpdated)>=weekAgo);
  const weekTheses = (data.theses||[]).filter(t=>t.lastUpdated&&new Date(t.lastUpdated)>=weekAgo);
  const weekRamp = (data.rampSessions||[]).filter(s=>s.startedAt&&new Date(s.startedAt)>=weekAgo);

  // GE progress
  const geWeeks = (data.goldenEgg?.aiCourse?.weeks||[]);
  const geDone = geWeeks.filter(w=>w.done).length;

  // Philosophy streak approximation
  const philDay = data.philosophyBriefing?.currentDay || 0;
  const philTheme = data.philosophyBriefing?.currentTheme || '—';
  const bizTheme = data.businessAcumenBriefing?.currentWeekTheme || '—';
  const bizDay = data.businessAcumenBriefing?.currentDayInTheme || 0;

  // Mental models weakness
  const activeWeaknessPhil = data.philosophyBriefing?.activeWeakness || null;
  const activeWeaknessBiz  = data.businessAcumenBriefing?.activeWeakness || null;

  const Section = ({title, color, children}) => (
    <div className="glass rounded-xl p-4 mb-3" style={{border:`1px solid ${color||'rgba(255,255,255,0.06)'}`}}>
      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:color||'#475569'}}>{title}</div>
      {children}
    </div>
  );

  const Row = ({label, value, sub, valueColor}) => (
    <div className="flex items-start justify-between gap-3 py-1.5" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
      <div>
        <div className="text-sm" style={{color:'#94a3b8'}}>{label}</div>
        {sub && <div className="text-xs" style={{color:'#334155'}}>{sub}</div>}
      </div>
      <div className="text-sm font-semibold flex-shrink-0" style={{color:valueColor||'#e2e8f0'}}>{value}</div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">Review</h2>
        <div className="flex gap-0.5 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
          {[['daily','Daily'],['weekly','Weekly']].map(([v,l])=>(
            <button key={v} onClick={()=>setMode(v)} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={mode===v?{background:'rgba(255,255,255,0.1)',color:'#e2e8f0'}:{color:'#64748b'}}>{l}</button>
          ))}
        </div>
      </div>

      {mode==='daily' && (
        <div>
          <div className="text-xs mb-4" style={{color:'#475569'}}>{now.toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'})}</div>

          {oldInbox.length > 0 && (
            <div className="p-3 rounded-xl mb-3" style={{background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.2)'}}>
              <div className="text-xs font-semibold" style={{color:'#f59e0b'}}>⚠ {oldInbox.length} inbox item{oldInbox.length>1?'s':''} 48h+ untriaged</div>
            </div>
          )}

          <Section title="Journal" color="rgba(99,102,241,0.3)">
            <Row label="Entries today" value={todayJournals.length}/>
            {todayJournals.map(j=><div key={j.id} className="text-xs mt-1 line-clamp-2" style={{color:'#475569'}}>{j.body.slice(0,100)}…</div>)}
          </Section>

          <Section title="Tasks" color="rgba(16,185,129,0.3)">
            <Row label="Due today — done" value={`${doneTodayTasks.length}/${todayTasks.length}`} valueColor={doneTodayTasks.length===todayTasks.length&&todayTasks.length>0?'#10b981':'#e2e8f0'}/>
            {slippedTasks.slice(0,3).map(t=><div key={t.id} className="text-xs mt-1" style={{color:'#f87171'}}>⚑ {t.title}</div>)}
          </Section>

          {todayHabits.length > 0 && (
            <Section title="Habits" color="rgba(139,92,246,0.3)">
              {todayHabits.map(h=><Row key={h.id} label={h.name} value={h.streak||0+' day streak'} valueColor="#a78bfa"/>)}
            </Section>
          )}

          <Section title="Calendar" color="rgba(255,255,255,0.1)">
            <Row label="Events today" value={todayEvents.length}/>
            {todayEvents.slice(0,4).map(e=><div key={e.id} className="text-xs mt-1" style={{color:'#64748b'}}>{e.title}</div>)}
          </Section>

          {rampToday.length > 0 && (
            <Section title="Deep Work" color="rgba(99,102,241,0.2)">
              <Row label="Sessions today" value={rampToday.length}/>
              {rampToday.map(s=><div key={s.id} className="text-xs mt-1" style={{color:'#475569'}}>{s.deliverable?.slice(0,80)}</div>)}
            </Section>
          )}

          {followUps.length > 0 && (
            <Section title="People Follow-ups Due" color="rgba(245,158,11,0.3)">
              {followUps.map(p=><Row key={p.id} label={p.name} value="Follow up" valueColor="#f59e0b"/>)}
            </Section>
          )}

          {decisionsPmDue.length > 0 && (
            <Section title="Decisions Awaiting Postmortem" color="rgba(239,68,68,0.2)">
              {decisionsPmDue.map(d=><div key={d.id} className="text-xs mb-1" style={{color:'#f87171'}}>{d.decision.slice(0,80)}</div>)}
            </Section>
          )}

          <Section title="Inbox" color="rgba(255,255,255,0.06)">
            <Row label="Untriaged items" value={inboxUntriaged.length} valueColor={inboxUntriaged.length>5?'#f59e0b':'#e2e8f0'}/>
            <Row label="48h+ stale" value={oldInbox.length} valueColor={oldInbox.length>0?'#f59e0b':'#e2e8f0'}/>
          </Section>
        </div>
      )}

      {mode==='weekly' && (
        <div>
          <div className="text-xs mb-4" style={{color:'#475569'}}>Week of {weekAgo.toLocaleDateString('en',{month:'short',day:'numeric'})} – {now.toLocaleDateString('en',{month:'short',day:'numeric'})}</div>

          <Section title="Journal & Tasks" color="rgba(99,102,241,0.2)">
            <Row label="Journal entries" value={weekJournals.length}/>
            <Row label="Tasks completed" value={weekTasks.length}/>
            <Row label="Deep work sessions" value={weekRamp.length}/>
          </Section>

          <Section title="Research" color="rgba(16,185,129,0.2)">
            <Row label="Watchlist updates" value={weekWatchUpdated.length}/>
            <Row label="Thesis updates" value={weekTheses.length}/>
            <Row label="Active theses" value={(data.theses||[]).filter(t=>t.status==='active').length}/>
          </Section>

          <Section title="Golden Egg Capital" color="rgba(245,158,11,0.2)">
            <Row label="AI Course progress" value={`${geDone}/12 weeks`} valueColor="#f59e0b"/>
          </Section>

          <Section title="Briefing Streaks" color="rgba(139,92,246,0.2)">
            <Row label="Philosophy — Day" value={philDay} sub={philTheme}/>
            <Row label="Business Acumen — Day" value={bizDay} sub={bizTheme}/>
            {activeWeaknessPhil && <div className="text-xs mt-1" style={{color:'#a78bfa'}}>Phil weakness: {activeWeaknessPhil}</div>}
            {activeWeaknessBiz  && <div className="text-xs mt-1" style={{color:'#a78bfa'}}>Biz weakness: {activeWeaknessBiz}</div>}
          </Section>
        </div>
      )}
    </div>
  );
}

/* ================== CONSULTING PANEL ================== */

const C_DIMS = ['Structuring','Ideation','Quant','Charts','BusinessJudgment','Hypothesis','Prioritization','Synthesis','Communication','CaseManagement'];
const C_DIM_LABELS = {Structuring:'Structuring',Ideation:'Ideation',Quant:'Quant',Charts:'Charts',BusinessJudgment:'Business Judgment',Hypothesis:'Hypothesis',Prioritization:'Prioritization',Synthesis:'Synthesis',Communication:'Communication',CaseManagement:'Case Mgmt'};

const DRILL_CATALOG = [
  {dimension:'Structuring',type:'framework-gen',label:'Framework Generation',timeLimit:120,
    prompts:['A mid-size retailer\'s profits fell 15% over two years while revenue held flat. Walk through how you\'d structure this problem.','A SaaS company\'s churn rate doubled last quarter. How would you structure diagnosing and fixing this?','A regional hospital network wants to grow revenue 20% in three years. Outline your structure.']},
  {dimension:'Structuring',type:'framework-critique',label:'Framework Critique',timeLimit:90,
    prompts:['A consultant proposes diagnosing a profit decline using only the income statement. What is wrong with this approach and what would you add?','A team plans to analyze market entry by only looking at market size and competition. What critical dimensions are missing?','An analyst breaks down a cost problem as fixed vs. variable. What\'s missing from this structure?']},
  {dimension:'Quant',type:'estimation',label:'Market Estimation',timeLimit:180,
    prompts:['Estimate the annual revenue of all coffee shops in New York City.','Estimate the US market size for electric vehicle charging stations.','How many commercial flights take off from US airports on an average day?']},
  {dimension:'Quant',type:'mental-math',label:'Mental Math',timeLimit:60,
    prompts:['A factory produces 850 units/day and operates 5.5 days/week. What is the annual output (52 weeks)?','Revenue is $240M and growing 15% per year. What will revenue be in 3 years?','A company has 12,000 employees: 60% full-time at $85K, 40% contractors at $70K. What is the annual wage bill?']},
  {dimension:'Ideation',type:'brainstorm',label:'Brainstorm Sprint',timeLimit:60,
    prompts:['List as many ways as possible that a grocery chain could increase revenue.','What are all the reasons a customer might stop using a streaming service?','List every possible growth lever for a mid-market hotel chain.']},
  {dimension:'Charts',type:'chart-read',label:'Chart Interpretation',timeLimit:90,
    prompts:['Q1–Q4 revenue: Product A: $4M, $4.5M, $4.8M, $3.9M. Product B: $2M, $2.8M, $3.9M, $5.2M. What is the headline insight and what two questions would you ask the CEO?','COGS margin went from 42% to 51% over 8 quarters while gross revenue grew 18%. What does this tell you and what would you investigate first?','Customer acquisition cost rose steadily for 6 quarters (+60% total) while new customer volume fell 20%. Headline insight and your first hypothesis?']},
  {dimension:'BusinessJudgment',type:'profit-decline',label:'Profit Decline Diagnosis',timeLimit:150,
    prompts:['A convenience store chain\'s operating margin fell from 8% to 4% in 18 months while revenue grew 5%. What is your leading hypothesis?','A software company\'s net income fell 25% while revenue rose 12%. What are the three most likely causes?','A retailer\'s gross margin expanded but EBIT fell. What structure would you use to find the cause?']},
  {dimension:'Hypothesis',type:'hyp-gen',label:'Hypothesis Generation',timeLimit:90,
    prompts:['A restaurant chain\'s same-store sales fell 8% in Q2. State your leading hypothesis specifically, and explain why it leads.','A B2B SaaS company\'s trial-to-paid conversion dropped from 40% to 22% in one quarter. What is your leading hypothesis?','A manufacturer\'s defect rate doubled in 60 days. State your most specific hypothesis and the first thing you would check.']},
  {dimension:'Prioritization',type:'issue-rank',label:'Issue Prioritization',timeLimit:120,
    prompts:['For diagnosing a B2B SaaS company\'s 30% decline in new logos, rank from most to least likely and explain: (1) product-market fit degraded, (2) sales underperformance, (3) competitive pressure, (4) pricing issues, (5) marketing funnel problems.','A restaurant chain is losing money. Rank these workstreams by urgency: (1) menu pricing, (2) labor cost, (3) food waste, (4) traffic decline, (5) lease costs.','A hospital system wants to cut costs. Rank from highest to lowest expected impact: (1) staffing, (2) supply chain, (3) facility utilization, (4) billing efficiency, (5) IT systems.']},
  {dimension:'Synthesis',type:'conclusion',label:'Conclusion Writing',timeLimit:90,
    prompts:['Revenue is up 8% but net income fell 12%. COGS increased 20% driven by raw material costs. Write a one-sentence synthesis of the situation.','Customer acquisition cost doubled while LTV held flat and churn is stable at 5%. Write a one-sentence synthesis of the key issue.','Market share fell from 32% to 28% while the industry grew 10% and the company\'s revenue is flat. Write a one-sentence competitive diagnosis.']},
  {dimension:'Communication',type:'verbal-answer',label:'Structured Response',timeLimit:120,
    prompts:['Answer as you would in a case interview: "How would you think about whether our client should enter the electric vehicle charging market?"','Structure a response to: "Our largest customer asked for a 15% price reduction. Should we agree? Walk me through your thinking."','Answer concisely and top-down: "What factors would you weigh in deciding whether to acquire a competitor?"']},
  {dimension:'CaseManagement',type:'client-question',label:'Client Question Handling',timeLimit:120,
    prompts:['Your client interrupts your structure: "We already know costs are fine — can\'t we just focus on revenue?" How do you respond?','The CEO says: "I don\'t need a full analysis. Just tell me right now: should we cut headcount?" How do you handle this?','A client asks mid-case: "Your framework seems generic. How is this specific to our situation?" How do you respond?']},
];

function getActiveDrill(dim,type){
  return DRILL_CATALOG.find(d=>(!dim||d.dimension===dim)&&(!type||d.type===type))||DRILL_CATALOG[0];
}
function getDrillPrompt(drill){
  const arr=drill.prompts;
  return arr[Math.floor(Math.random()*arr.length)];
}

async function streamFeedback(apiKey,system,userMsg,onChunk){
  const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o',stream:true,max_tokens:600,messages:[{role:'system',content:system},{role:'user',content:userMsg}]})});
  if(!resp.ok){const j=await resp.json();throw new Error(j.error?.message||'API error '+resp.status);}
  const reader=resp.body.getReader(),dec=new TextDecoder();let buf='',out='';
  while(true){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop()||'';for(const line of lines){if(!line.startsWith('data:'))continue;const d=line.slice(5).trim();if(d==='[DONE]')break;try{const j=JSON.parse(d);if(j.choices?.[0]?.delta?.content){out+=j.choices[0].delta.content;onChunk(out);}}catch{}}}
  return out;
}

async function getScoreJson(apiKey,prompt,response,feedbackText){
  const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},max_tokens:200,messages:[{role:'system',content:'Return JSON only: {"score":0-10,"improvements":["specific fix 1","specific fix 2"]}'},{role:'user',content:`Prompt: ${prompt}\nResponse: ${response}\nFeedback: ${feedbackText}`}]})});
  const j=await resp.json();
  try{return JSON.parse(j.choices[0].message.content);}catch{return {score:6,improvements:['Review your structure for completeness','Add specificity to your analysis']};}
}

/* ----------- Consulting Home ----------- */
function ConsultingHome({consulting,setConsulting,apiKey,toasts,setSubtab,onDrillFromError}){
  const drills=consulting.drills||[];
  const cases=consulting.cases||[];
  const errorLog=consulting.errorLog||[];

  const dimScores=C_DIMS.reduce((acc,d)=>{
    const dimDrills=drills.filter(x=>x.dimension===d).slice(-5);
    const dimCases=cases.flatMap(c=>c.competencyScores?Object.entries(c.competencyScores).filter(([k])=>k===d).map(([,v])=>v):[]).slice(-5);
    const all=[...dimDrills.map(x=>x.score),...dimCases];
    acc[d]=all.length?Math.round(all.reduce((s,v)=>s+v,0)/all.length*10)/10:null;
    return acc;
  },{});

  const openErrors=errorLog.filter(e=>!e.resolved).slice(0,10);
  const recommended=[...new Set(openErrors.map(e=>e.dimension))].slice(0,3);
  const recentDrills=drills.slice(-5).reverse();
  const streak=(()=>{let s=0;const today=new Date().toISOString().slice(0,10);const dates=[...new Set([...drills,...cases.filter(c=>c.finishedAt)].map(x=>(x.at||x.finishedAt||'').slice(0,10)).filter(Boolean).sort().reverse())];for(let i=0;i<dates.length;i++){const d=new Date(today);d.setDate(d.getDate()-i);if(dates[i]===d.toISOString().slice(0,10))s++;else break;}return s;})();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="glass rounded-xl p-4 border-subtle flex-1 min-w-40">
          <div className="text-xs mb-1" style={{color:'#64748b'}}>Practice streak</div>
          <div className="text-3xl font-bold" style={{color:'#818cf8'}}>{streak}<span className="text-base ml-1" style={{color:'#64748b'}}>days</span></div>
        </div>
        <div className="glass rounded-xl p-4 border-subtle flex-1 min-w-40">
          <div className="text-xs mb-1" style={{color:'#64748b'}}>Drills completed</div>
          <div className="text-3xl font-bold" style={{color:'#34d399'}}>{drills.length}</div>
        </div>
        <div className="glass rounded-xl p-4 border-subtle flex-1 min-w-40">
          <div className="text-xs mb-1" style={{color:'#64748b'}}>Cases completed</div>
          <div className="text-3xl font-bold" style={{color:'#f59e0b'}}>{cases.filter(c=>c.state==='done').length}</div>
        </div>
        <div className="glass rounded-xl p-4 border-subtle flex-1 min-w-40">
          <div className="text-xs mb-1" style={{color:'#64748b'}}>Open weaknesses</div>
          <div className="text-3xl font-bold" style={{color:'#f87171'}}>{openErrors.length}</div>
        </div>
      </div>

      <div className="glass rounded-xl p-5 border-subtle">
        <div className="text-sm font-semibold mb-4">Competency Radar</div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {C_DIMS.map(d=>{
            const score=dimScores[d];
            const pct=score!=null?score*10:0;
            return (
              <div key={d} className="flex items-center gap-3">
                <div className="text-xs w-28 flex-shrink-0" style={{color:'#94a3b8'}}>{C_DIM_LABELS[d]}</div>
                <div className="flex-1 h-1.5 rounded-full" style={{background:'rgba(255,255,255,0.06)'}}>
                  <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:pct>=70?'#34d399':pct>=50?'#f59e0b':'#f87171'}}></div>
                </div>
                <div className="text-xs w-8 text-right" style={{color:'#64748b'}}>{score!=null?score.toFixed(1):'—'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {recommended.length>0 && (
        <div className="glass rounded-xl p-5 border-subtle">
          <div className="text-sm font-semibold mb-3">Recommended Practice</div>
          <div className="space-y-2">
            {recommended.map((dim,i)=>{
              const drill=DRILL_CATALOG.find(d=>d.dimension===dim)||DRILL_CATALOG[0];
              return (
                <div key={dim} className="flex items-center justify-between p-3 rounded-lg" style={{background:'rgba(255,255,255,0.03)'}}>
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full mr-2" style={{background:'rgba(99,102,241,0.2)',color:'#818cf8'}}>#{i+1}</span>
                    <span className="text-sm">{C_DIM_LABELS[dim]}</span>
                    <span className="text-xs ml-2" style={{color:'#64748b'}}>— {drill.label}</span>
                  </div>
                  <button onClick={()=>onDrillFromError?onDrillFromError(dim):setSubtab('drills')} className="text-xs px-3 py-1 rounded-lg" style={{background:'rgba(99,102,241,0.2)',color:'#818cf8'}}>Drill →</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recentDrills.length>0 && (
        <div className="glass rounded-xl p-5 border-subtle">
          <div className="text-sm font-semibold mb-3">Recent Drills</div>
          <div className="space-y-2">
            {recentDrills.map(d=>(
              <div key={d.id} className="flex items-center justify-between text-sm">
                <div><span style={{color:'#94a3b8'}}>{C_DIM_LABELS[d.dimension]}</span><span className="mx-2" style={{color:'#334155'}}>·</span><span style={{color:'#64748b'}}>{d.drillType}</span></div>
                <span className="font-semibold" style={{color:d.score>=7?'#34d399':d.score>=5?'#f59e0b':'#f87171'}}>{d.score}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {drills.length===0&&cases.length===0&&(
        <div className="glass rounded-xl p-10 text-center border-subtle">
          <div style={{fontSize:'40px',marginBottom:'12px'}}>🎯</div>
          <div className="font-semibold mb-1">Start your practice</div>
          <div className="text-sm" style={{color:'#64748b'}}>Use Drills to build individual skills, or Cases for a full mock interview. Both track your progress automatically.</div>
        </div>
      )}
    </div>
  );
}

/* ----------- Drills ----------- */
function DrillsSubtab({consulting,setConsulting,apiKey,toasts,initDim='',initType=''}){
  const [phase,setPhase]=useState('pick'); // pick | drill | grading | result
  const [selDim,setSelDim]=useState(initDim);
  const [selType,setSelType]=useState(initType);
  const [activeDrill,setActiveDrill]=useState(null);
  const [prompt,setPrompt]=useState('');
  const [response,setResponse]=useState('');
  const [timeLeft,setTimeLeft]=useState(0);
  const [timerActive,setTimerActive]=useState(false);
  const [feedback,setFeedback]=useState('');
  const [scoreData,setScoreData]=useState(null);
  const [grading,setGrading]=useState(false);
  const dict=useDictation(t=>{setResponse(p=>p?p+' '+t:t);});

  useEffect(()=>{
    if(!timerActive)return;
    if(timeLeft<=0){setTimerActive(false);return;}
    const id=setTimeout(()=>setTimeLeft(t=>t-1),1000);
    return()=>clearTimeout(id);
  },[timerActive,timeLeft]);

  const startDrill=()=>{
    const drill=getActiveDrill(selDim,selType)||DRILL_CATALOG[0];
    const p=getDrillPrompt(drill);
    setActiveDrill(drill);setPrompt(p);setResponse('');setFeedback('');setScoreData(null);
    setTimeLeft(drill.timeLimit);setTimerActive(true);
    setPhase('drill');
  };

  const submitDrill=async()=>{
    if(!response.trim()){toasts.push('Enter a response first');return;}
    if(!apiKey){toasts.push('Add API key in Settings');return;}
    setTimerActive(false);setGrading(true);setPhase('grading');
    const dimLabel=activeDrill.dimension;
    const system=`You are an expert McKinsey/BCG case coach. Grade the candidate's response to this ${dimLabel} drill with specific, actionable feedback. Be honest — most responses have real gaps. Lead with what was done well, then name the 1-2 most important improvements. Be specific: quote the response if needed. 3-4 sentences max.`;
    try{
      const fbText=await streamFeedback(apiKey,system,`Drill: ${activeDrill.label}\nPrompt: ${prompt}\nCandidate response: ${response}`,setFeedback);
      const sd=await getScoreJson(apiKey,prompt,response,fbText);
      setScoreData(sd);
      const attempt={id:uid('dr'),dimension:activeDrill.dimension,drillType:activeDrill.type,prompt,response,score:sd.score,feedback:fbText,improvements:sd.improvements||[],at:Date.now()};
      setConsulting(c=>({...c,drills:[...(c.drills||[]),attempt]}));
      if(sd.score<7){
        const errEntry={id:uid('er'),dimension:activeDrill.dimension,drillId:attempt.id,caseId:null,description:sd.improvements?.[0]||'Score below threshold',feedback:fbText,createdAt:Date.now(),resolved:false};
        setConsulting(c=>({...c,errorLog:[...(c.errorLog||[]),errEntry]}));
      }
    }catch(e){toasts.push('Grading failed: '+e.message);}
    setGrading(false);setPhase('result');
  };

  const nextDrill=()=>{setPhase('drill');startDrill();};
  const backToPick=()=>{setPhase('pick');setActiveDrill(null);setPrompt('');setResponse('');setFeedback('');setScoreData(null);};

  const dimOptions=[{value:'',label:'Any dimension'},...C_DIMS.map(d=>({value:d,label:C_DIM_LABELS[d]}))];
  const typeOptions=selDim?[{value:'',label:'Any type'},...DRILL_CATALOG.filter(d=>d.dimension===selDim).map(d=>({value:d.type,label:d.label}))]:[{value:'',label:'Pick a dimension first'}];

  const timerColor=timeLeft>30?'#34d399':timeLeft>10?'#f59e0b':'#f87171';
  const mm=Math.floor(timeLeft/60),ss=timeLeft%60;

  if(phase==='pick') return (
    <div className="max-w-xl">
      <div className="glass rounded-xl p-6 border-subtle mb-4">
        <div className="text-sm font-semibold mb-4">Configure drill</div>
        <div className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{color:'#64748b'}}>Dimension</label>
            <select value={selDim} onChange={e=>{setSelDim(e.target.value);setSelType('');}} className="w-full px-3 py-2 rounded-lg text-sm" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}}>
              {dimOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{color:'#64748b'}}>Drill type</label>
            <select value={selType} onChange={e=>setSelType(e.target.value)} disabled={!selDim} className="w-full px-3 py-2 rounded-lg text-sm" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',outline:'none'}}>
              {typeOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <button onClick={startDrill} className="mt-5 w-full py-2.5 rounded-lg font-semibold text-sm" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff'}}>Start Drill</button>
      </div>
      {(consulting.drills||[]).length>0&&(
        <div className="glass rounded-xl p-4 border-subtle">
          <div className="text-xs font-semibold mb-3" style={{color:'#64748b'}}>RECENT</div>
          {(consulting.drills||[]).slice(-5).reverse().map(d=>(
            <div key={d.id} className="flex justify-between items-center text-sm py-1.5 border-b border-white/3 last:border-0">
              <span style={{color:'#94a3b8'}}>{C_DIM_LABELS[d.dimension]} · {d.drillType}</span>
              <span style={{color:d.score>=7?'#34d399':d.score>=5?'#f59e0b':'#f87171',fontWeight:600}}>{d.score}/10</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if(phase==='drill') return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs px-2 py-0.5 rounded-full mr-2" style={{background:'rgba(99,102,241,0.2)',color:'#818cf8'}}>{C_DIM_LABELS[activeDrill.dimension]}</span>
          <span className="text-sm font-medium">{activeDrill.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-mono font-bold" style={{color:timerColor}}>{mm}:{ss.toString().padStart(2,'0')}</span>
          <button onClick={backToPick} className="text-xs px-2 py-1 rounded" style={{color:'#64748b'}}>✕ Exit</button>
        </div>
      </div>
      <div className="glass rounded-xl p-5 border-subtle mb-4">
        <div className="text-sm font-medium mb-1" style={{color:'#64748b'}}>Prompt</div>
        <div className="text-sm leading-relaxed">{prompt}</div>
      </div>
      <div className="glass rounded-xl p-4 border-subtle mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs" style={{color:'#64748b'}}>Your response</label>
          <button onClick={()=>dict.start()} title="Dictate" className="text-xs px-2 py-1 rounded" style={{color:'#818cf8',background:'rgba(99,102,241,0.1)'}}>🎙 Voice</button>
        </div>
        <textarea value={response} onChange={e=>setResponse(e.target.value)} rows={6} placeholder="Type or dictate your response..." className="w-full bg-transparent text-sm resize-none outline-none" style={{color:'#e2e8f0'}} />
      </div>
      <button onClick={submitDrill} disabled={!response.trim()} className="w-full py-2.5 rounded-lg font-semibold text-sm" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff',opacity:response.trim()?1:0.4}}>Submit for Feedback</button>
    </div>
  );

  if(phase==='grading') return (
    <div className="max-w-2xl">
      <div className="glass rounded-xl p-6 border-subtle">
        <div className="text-sm font-semibold mb-4">Grading your response…</div>
        <div className="text-sm leading-relaxed" style={{color:'#94a3b8',whiteSpace:'pre-wrap'}}>{feedback||'Analyzing…'}</div>
        {!grading&&scoreData&&<div className="mt-4 text-2xl font-bold" style={{color:scoreData.score>=7?'#34d399':scoreData.score>=5?'#f59e0b':'#f87171'}}>{scoreData.score}/10</div>}
      </div>
    </div>
  );

  // result
  return (
    <div className="max-w-2xl">
      <div className="glass rounded-xl p-6 border-subtle mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Result</div>
          <div className="text-3xl font-bold" style={{color:scoreData?.score>=7?'#34d399':scoreData?.score>=5?'#f59e0b':'#f87171'}}>{scoreData?.score??'—'}<span className="text-base" style={{color:'#64748b'}}>/10</span></div>
        </div>
        <div className="text-sm leading-relaxed mb-4" style={{color:'#94a3b8',whiteSpace:'pre-wrap'}}>{feedback}</div>
        {scoreData?.improvements?.length>0&&(
          <div>
            <div className="text-xs font-semibold mb-2" style={{color:'#f59e0b'}}>KEY IMPROVEMENTS</div>
            <ul className="space-y-1">{scoreData.improvements.map((imp,i)=><li key={i} className="text-sm" style={{color:'#e2e8f0'}}>• {imp}</li>)}</ul>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={nextDrill} className="flex-1 py-2.5 rounded-lg font-semibold text-sm" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff'}}>Next Drill</button>
        <button onClick={backToPick} className="px-6 py-2.5 rounded-lg text-sm" style={{background:'rgba(255,255,255,0.05)',color:'#94a3b8'}}>Pick Different Drill</button>
      </div>
    </div>
  );
}

/* ----------- Cases ----------- */
const CASE_STATES=['opening','clarify','objective','structure','exploration','synthesis','recommendation','debrief','done'];
const CASE_STATE_LABELS={opening:'Opening',clarify:'Clarification',objective:'Objective',structure:'Structure',exploration:'Analysis',synthesis:'Synthesis',recommendation:'Recommendation',debrief:'Debrief',done:'Complete'};

const CASES_CATALOG=[
  {id:'profitability',label:'Profitability',difficulty:'Intermediate',estimatedMin:20,
    title:'Specialty Retail Profitability',industry:'Retail',
    description:'A specialty retailer\'s margin fell from 8% to 3%. Revenue held flat at $800M. Find the root cause and a fix.',
    setup:'Our client is a mid-size specialty retail chain with 200 stores across the US. Their net profit margin has declined from 8% to 3% over the past two years, despite revenue holding flat at approximately $800M. The CEO wants to understand why margins fell and what they should do about it.',
    explorationData:'COGS margin expanded 6pp due to raw material cost increases and supplier pricing changes. Labor costs rose 2pp from wage inflation and increased overtime. Rent and D&A are flat. Revenue is flat in aggregate, but transaction volume fell 12% — offset by an 8% price increase. The online channel grew 40% but carries a 3pp lower gross margin than stores.',
    objectiveComponents:['diagnose the root causes of the margin decline','recommend actions to restore profitability'],
    constraints:['US market','200-store retail chain','revenue has held flat at $800M'],
    successCriteria:'restore net profit margin toward historical 8% level',
  },
  {id:'market-entry',label:'Market Entry',difficulty:'Intermediate',estimatedMin:25,
    title:'EV Charging Market Entry',industry:'Energy & Transportation',
    description:'A major oil company with 4,000 gas stations considers entering EV charging. Should they, and how?',
    setup:'Our client is one of the largest petroleum companies in the US with $12B in annual revenue and a network of approximately 4,000 owned and operated gas stations. They are evaluating whether to enter the electric vehicle (EV) charging market. They want to know: should they enter, and if so, how and where?',
    explorationData:'US EV charging market: $5B today, projected $40B by 2030 (35% CAGR). The leading network holds 35% share. DC fast chargers cost $50K–$200K per station; Level 2 chargers $5K–$20K. Average public fast-charger utilization is currently 28%. The client\'s highway and high-traffic suburban locations are ideal for fast charging. Competitors (BP Pulse, EVgo) are already spending aggressively. The client has no EV charging technology or brand today.',
    objectiveComponents:['determine whether to enter the EV charging market','if entering, recommend how and where to enter'],
    constraints:['US market','existing 4,000-station network as a potential asset'],
    successCriteria:'a clear go/no-go decision with a viable entry approach if yes',
  },
  {id:'growth',label:'Growth Strategy',difficulty:'Advanced',estimatedMin:30,
    title:'Regional Bank Revenue Growth',industry:'Financial Services',
    description:'A regional bank growing at 2% needs a path to 7% revenue growth in 3 years.',
    setup:'Our client is a regional bank headquartered in Atlanta with $20B in assets and operations across six states in the Southeast US. They have grown revenue at approximately 2% per year, well below the regional banking industry average of 5% and their own target of 7%. The new CEO has engaged us to identify the best path to 7% revenue growth within three years.',
    explorationData:'Revenue mix: retail banking 60% ($480M), growing 1% YoY; commercial banking 30% ($240M), declining 3% YoY; wealth management 10% ($80M), growing 15% YoY. Digital banking adoption is 40% vs. industry average of 68% — the gap drives higher branch servicing costs. Net interest margin compressed 30bps from deposit repricing. The client has not entered the mortgage market (a gap vs. peers). Geographic footprint is concentrated in metro areas while peer banks expanded into fast-growing secondary cities.',
    objectiveComponents:['identify the best path to 7% annual revenue growth','deliver growth within three years'],
    constraints:['Southeast US six-state footprint','three-year timeframe','7% revenue growth target'],
    successCriteria:'achieve 7% annual revenue growth within three years',
  },
  {id:'ma',label:'M&A',difficulty:'Advanced',estimatedMin:30,
    title:'Software Acquisition Decision',industry:'Technology',
    description:'An enterprise software firm considers acquiring a B2B SaaS startup at $800M. Worth it?',
    setup:'Our client is a large enterprise software company with $5B in revenue serving Fortune 1000 firms. They are considering acquiring a B2B SaaS startup called Flowdesk, which provides project management and workflow automation tools. Flowdesk is privately held and asking $800M. The client needs to decide: should they acquire Flowdesk at this valuation, and if so, how should they integrate it?',
    explorationData:'Flowdesk: $50M ARR, growing 60% YoY, 120% net revenue retention (excellent), -15% EBITDA margin. Average contract $62K; 800 customers. Our client\'s current PM module generates $120M in revenue growing only 5% and has been losing deals to Flowdesk. Our client has 3,000 enterprise customers with no Flowdesk overlap — significant cross-sell potential, estimated $30–50M ARR within 2 years. At $800M, the acquisition is priced at 16x ARR. Integration risk: Flowdesk\'s team is 120 people, engineering-heavy, and culture is startup-oriented.',
    objectiveComponents:['determine whether to acquire Flowdesk at $800M','if acquiring, recommend an integration approach'],
    constraints:['$800M asking price','Flowdesk is privately held'],
    successCriteria:'a clear acquire/pass decision with strategic and financial justification',
  },
  {id:'operations',label:'Operations',difficulty:'Intermediate',estimatedMin:25,
    title:'Manufacturing Plant Efficiency',industry:'Consumer Goods',
    description:'A production plant at 68% utilization with 4.2% defects needs to hit 90% / 1.5% in 18 months.',
    setup:'Our client is a consumer goods manufacturer with $1.2B in annual revenue. Their flagship plant, responsible for 40% of total output, is running at 68% capacity utilization with a 4.2% defect rate. The industry best-in-class benchmark is 90% utilization and 1.5% defects. The COO has given the plant manager 18 months to reach those benchmarks or the plant faces downsizing.',
    explorationData:'Three production lines: Line A (85% utilization, 1.8% defects — best performer), Line B (65% utilization, 4.5% defects — HVAC failure causing temperature variance on heat-sensitive components), Line C (55% utilization, 6.5% defects — 2005-vintage equipment, unplanned downtime averaging 18 hours/month). Changeover time averages 4.2 hours across all lines vs. the benchmark of 1.8 hours — root cause is manual calibration procedures not yet digitized. No predictive maintenance system in place.',
    objectiveComponents:['identify the root causes of low utilization and high defect rates','recommend specific actions to reach 90% utilization and 1.5% defects within 18 months'],
    constraints:['18-month deadline','flagship plant cannot be shut down','benchmark targets: 90% utilization, 1.5% defect rate'],
    successCriteria:'reach 90% utilization and 1.5% defect rate within 18 months',
  },
];

function getCaseConfig(type){return CASES_CATALOG.find(c=>c.id===type)||CASES_CATALOG[0];}

function buildCaseSystemPrompt(caseConfig,caseState,userObjective=''){
  const objCtx=userObjective?`\n\nCandidate's stated case objective: "${userObjective}"`:''
  const stateGuide={
    opening:'Introduce the case naturally as a real McKinsey interviewer would — name the client, industry, and central question. Do not volunteer any data yet.',
    clarify:'Answer clarifying questions with concise specific answers. Reveal only what is directly asked. Typical questions: timeframe, client description, geography, competitive context.',
    objective:'The candidate is about to state their understanding of the case objective. Do not prompt them yet — this is handled separately in the UI.',
    structure:`The candidate will present their structure. Give honest brief feedback on whether it is MECE and complete.${userObjective?' Explicitly assess whether the structure would actually answer the stated objective: "'+userObjective+'". If the structure drifts from the objective, name the gap.':''} Then move into exploration.`,
    exploration:`Provide data from the exploration dataset only when directly asked. Guide toward the key insight without giving it away. If they pursue an unproductive branch, let them spend 1-2 turns before redirecting.${userObjective?' Occasionally check that analysis stays relevant to the stated objective.':''}`,
    synthesis:`Ask the candidate to summarize findings in 2-3 sentences. Push back if they are vague or missing a key driver.${userObjective?' Verify that the synthesis addresses the original objective: "'+userObjective+'"':''}`,
    recommendation:`Ask for a clear actionable recommendation with quantitative rationale. Push back if it is too generic or ignores risk.${userObjective?' Critically: ensure the recommendation directly answers the stated objective ("'+userObjective+'"). If it does not, flag the gap explicitly.':''}`,
    debrief:'Give specific coaching: what they did well, where they lost time or missed key issues, and one concrete thing to practice next.',
  };
  return `You are a professional case interview coach playing the role of a McKinsey senior interviewer. You are conducting a ${caseConfig.label} case interview. Be realistic but instructive. Stay in character throughout. Give information only when directly asked — never volunteer data. When the candidate makes a sound move, acknowledge briefly and continue. When they struggle, ask a guiding question. Keep responses concise (2–4 sentences typically).

Case: "${caseConfig.setup}"

Exploration data (reveal only when asked): ${caseConfig.explorationData}${objCtx}

Current phase: ${CASE_STATE_LABELS[caseState]||caseState}. Your role now: ${stateGuide[caseState]||'Continue the interview naturally.'}`;
}

function CasesSubtab({consulting,setConsulting,apiKey,toasts}){
  const [view,setView]=useState('lobby'); // lobby | active | debrief
  const [activeCase,setActiveCase]=useState(null);
  const [input,setInput]=useState('');
  const [streaming,setStreaming]=useState(false);
  const [streamText,setStreamText]=useState('');
  const [objInput,setObjInput]=useState('');
  const [objFeedback,setObjFeedback]=useState(null);
  const [objSubmitting,setObjSubmitting]=useState(false);
  const [showObjTips,setShowObjTips]=useState(false);
  const [objBannerOpen,setObjBannerOpen]=useState(true);
  const scrollRef=useRef(null);
  const dict=useDictation(t=>{setInput(p=>p?p+' '+t:t);});

  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[activeCase?.sessionLog,streamText]);

  const startCase=(cfg)=>{
    const nc={id:uid('cs'),title:cfg.title,industry:cfg.industry,type:cfg.id,state:'opening',sessionLog:[],competencyScores:{},weaknesses:[],userObjective:'',objectiveFeedback:null,objectiveScore:null,startedAt:Date.now(),finishedAt:null};
    setConsulting(c=>({...c,cases:[...(c.cases||[]),nc]}));
    setActiveCase(nc);setView('active');setStreamText('');setObjInput('');setObjFeedback(null);
    sendInterviewerOpener(nc,cfg);
  };

  const resumeCase=(c)=>{
    setActiveCase(c);setView('active');
    if(c.state==='objective'){setObjInput(c.userObjective||'');setObjFeedback(c.objectiveFeedback||null);}
    else{setObjInput('');setObjFeedback(null);}
  };

  const evaluateObjective=async()=>{
    const text=objInput.trim();
    if(!text||objSubmitting||!apiKey)return;
    setObjSubmitting(true);
    try{
      const cfg=getCaseConfig(activeCase.type);
      const comps=(cfg.objectiveComponents||[]).join('; ');
      const cons=(cfg.constraints||[]).join('; ')||'none stated';
      const sc=cfg.successCriteria||'not specified';
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},max_tokens:500,messages:[
        {role:'system',content:`You are a case interview coach evaluating a candidate's case objective statement.\n\nCase prompt: "${cfg.setup}"\nRequired components a strong objective must cover: ${comps}\nKey constraints (if any): ${cons}\nSuccess criteria: ${sc}\n\nEvaluate the candidate's statement on these dimensions:\n- clientCentered: reflects what the client actually cares about\n- decisionOriented: identifies a clear decision or outcome\n- specific: captures the actual problem, not a generic restatement\n- complete: covers ALL required components\n- notOverSpecified: does not assume or prescribe the solution prematurely\n- concise: 1-2 sentences, not a paragraph\n\nReturn JSON only: {"rating":"STRONG|SOLID|DEVELOPING|WEAK","assessment":"2-3 sentence assessment, be specific","whatsMissing":null or "what is missing","strongVersion":"one strong version in 1-2 sentences","dimensions":{"clientCentered":true,"decisionOriented":true,"specific":true,"complete":true,"notOverSpecified":true,"concise":true}}\n\nScore MEANING not wording. Many phrasings can be STRONG. STRONG=captures decision and all components concisely. SOLID=good but slightly incomplete or imprecise. DEVELOPING=shows understanding but misses something important. WEAK=misses the core decision or too generic.`},
        {role:'user',content:`My case objective: "${text}"`}
      ]})});
      const j=await resp.json();
      const parsed=JSON.parse(j.choices[0].message.content);
      setObjFeedback(parsed);
      const uc={...activeCase,userObjective:text,objectiveFeedback:parsed,objectiveScore:parsed.rating};
      setActiveCase(uc);setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===uc.id?uc:x)}));
    }catch(e){toasts.push('Error: '+e.message);}
    setObjSubmitting(false);
  };

  const confirmObjective=()=>{
    const next='structure';
    const nc={...activeCase,state:next};
    setActiveCase(nc);setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===nc.id?nc:x)}));
    setObjFeedback(null);setObjInput('');setObjBannerOpen(true);
  };

  const sendInterviewerOpener=async(nc,cfg)=>{
    const caseConfig=cfg||getCaseConfig(nc.type);
    if(!apiKey){const updated={...nc,sessionLog:[{role:'interviewer',content:'Add your OpenAI API key in Settings to start.',at:Date.now()}]};setActiveCase(updated);setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===updated.id?updated:x)}));return;}
    setStreaming(true);
    try{
      const opener=await streamFeedback(apiKey,buildCaseSystemPrompt(caseConfig,'opening'),'Introduce the case to the candidate now.',t=>setStreamText(t));
      const updated={...nc,sessionLog:[{role:'interviewer',content:opener,at:Date.now()}]};
      setActiveCase(updated);setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===updated.id?updated:x)}));
      setStreamText('');
    }catch(e){toasts.push('Error: '+e.message);}
    setStreaming(false);
  };

  const sendMessage=async()=>{
    if(!input.trim()||streaming||!activeCase)return;
    if(!apiKey){toasts.push('Add API key in Settings');return;}
    const caseConfig=getCaseConfig(activeCase.type);
    const userMsg={role:'candidate',content:input.trim(),at:Date.now()};
    const updatedLog=[...activeCase.sessionLog,userMsg];
    const uc={...activeCase,sessionLog:updatedLog};
    setActiveCase(uc);setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===uc.id?uc:x)}));
    setInput('');setStreaming(true);setStreamText('');
    try{
      const history=updatedLog.slice(-14).map(m=>({role:m.role==='interviewer'?'assistant':'user',content:m.content}));
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o',stream:true,max_tokens:400,messages:[{role:'system',content:buildCaseSystemPrompt(caseConfig,uc.state,uc.userObjective||'')},...history]})});
      if(!resp.ok){const j=await resp.json();throw new Error(j.error?.message||'API error');}
      const reader=resp.body.getReader(),dec=new TextDecoder();let buf='',out='';
      while(true){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop()||'';for(const line of lines){if(!line.startsWith('data:'))continue;const d=line.slice(5).trim();if(d==='[DONE]')break;try{const j=JSON.parse(d);if(j.choices?.[0]?.delta?.content){out+=j.choices[0].delta.content;setStreamText(out);}}catch{}}}
      const aiMsg={role:'interviewer',content:out,at:Date.now()};
      const fc={...uc,sessionLog:[...updatedLog,aiMsg]};
      setActiveCase(fc);setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===fc.id?fc:x)}));
      setStreamText('');
    }catch(e){toasts.push('Error: '+e.message);}
    setStreaming(false);
  };

  const advanceState=()=>{
    const cur=CASE_STATES.indexOf(activeCase.state);
    if(cur<0||cur>=CASE_STATES.length-2)return;
    const next=CASE_STATES[cur+1];
    const nc={...activeCase,state:next};
    setActiveCase(nc);setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===nc.id?nc:x)}));
    if(next==='debrief')runDebrief(nc);
  };

  const runDebrief=async(nc)=>{
    if(!apiKey)return;
    setStreaming(true);
    try{
      const transcript=nc.sessionLog.map(m=>`${m.role==='interviewer'?'Interviewer':'Candidate'}: ${m.content}`).join('\n\n');
      const objLine=nc.userObjective?`\nCandidate's stated case objective: "${nc.userObjective}"`:'\nCandidate did not state a case objective.';
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},max_tokens:800,messages:[
        {role:'system',content:'You are a case coach. Score the candidate 1-10 on each dimension based on the transcript. For ObjectiveDiscipline: did they understand the objective, did their structure address it, did their analysis stay relevant to it, did their recommendation resolve it? Return JSON: {"competencyScores":{"Structuring":0,"Quant":0,"Hypothesis":0,"Synthesis":0,"Communication":0,"BusinessJudgment":0,"CaseManagement":0,"ObjectiveDiscipline":0},"objectiveDisciplineAssessment":"1-2 sentences on objective discipline","weaknesses":["specific weakness 1","specific weakness 2"],"strengths":["strength 1"],"insight":"1 sentence overall summary"}'},
        {role:'user',content:`Case type: ${nc.type}${objLine}\n\nTranscript:\n${transcript}`}
      ]})});
      const j=await resp.json();
      const parsed=JSON.parse(j.choices[0].message.content);
      const weak=Object.entries(parsed.competencyScores||{}).filter(([,v])=>v<6).map(([k])=>k);
      const finished={...nc,state:'done',competencyScores:parsed.competencyScores||{},objectiveDisciplineAssessment:parsed.objectiveDisciplineAssessment||'',weaknesses:parsed.weaknesses||weak,strengths:parsed.strengths||[],debriefInsight:parsed.insight||'',finishedAt:Date.now()};
      setActiveCase(finished);setConsulting(c=>({...c,cases:(c.cases||[]).map(x=>x.id===finished.id?finished:x)}));
      for(const dim of weak){
        const errEntry={id:uid('er'),dimension:dim,drillId:null,caseId:nc.id,description:(parsed.weaknesses||[]).find(w=>w.toLowerCase().includes(dim.toLowerCase()))||'Below threshold in '+dim,feedback:parsed.insight||'',createdAt:Date.now(),resolved:false};
        setConsulting(cc=>({...cc,errorLog:[...(cc.errorLog||[]),errEntry]}));
      }
      setView('debrief');
    }catch(e){toasts.push('Debrief error: '+e.message);}
    setStreaming(false);
  };

  const DIFF_COLORS={Intermediate:'#f59e0b',Advanced:'#f87171'};

  if(view==='lobby'){
    const inProgress=(consulting.cases||[]).filter(c=>c.state!=='done'&&c.state!=='debrief');
    const pastDone=(consulting.cases||[]).filter(c=>c.state==='done').slice(-5).reverse();
    return (
      <div style={{maxWidth:'800px'}}>
        {inProgress.length>0&&(
          <div className="glass rounded-xl p-4 border-subtle mb-5" style={{borderLeft:'3px solid #f59e0b'}}>
            <div className="text-xs font-semibold mb-3" style={{color:'#f59e0b'}}>IN PROGRESS</div>
            {inProgress.map(c=>(
              <div key={c.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium">{c.title}</span>
                  <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>{CASE_STATE_LABELS[c.state]||c.state}</span>
                </div>
                <button onClick={()=>resumeCase(c)} className="text-xs px-3 py-1 rounded-lg font-semibold" style={{background:'rgba(245,158,11,0.15)',color:'#f59e0b'}}>Resume →</button>
              </div>
            ))}
          </div>
        )}
        <div className="text-sm font-semibold mb-3">Choose a case</div>
        <div className="grid gap-3 mb-6" style={{gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))'}}>
          {CASES_CATALOG.map(cfg=>(
            <div key={cfg.id} className="glass rounded-xl p-5 border-subtle flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>{cfg.label}</span>
                    <span className="text-xs" style={{color:DIFF_COLORS[cfg.difficulty]||'#64748b'}}>{cfg.difficulty}</span>
                    <span className="text-xs" style={{color:'#475569'}}>~{cfg.estimatedMin}min</span>
                  </div>
                  <div className="text-sm font-semibold">{cfg.title}</div>
                  <div className="text-xs mt-0.5" style={{color:'#64748b'}}>{cfg.industry}</div>
                </div>
              </div>
              <div className="text-xs leading-relaxed" style={{color:'#94a3b8'}}>{cfg.description}</div>
              <button onClick={()=>startCase(cfg)} className="py-2 rounded-lg text-sm font-semibold mt-auto" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff'}}>Start Case</button>
            </div>
          ))}
        </div>
        {pastDone.length>0&&(
          <div className="glass rounded-xl p-4 border-subtle">
            <div className="text-xs font-semibold mb-3" style={{color:'#64748b'}}>RECENT COMPLETIONS</div>
            {pastDone.map(c=>(
              <div key={c.id} className="py-2 border-b border-white/3 last:border-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{c.title}</span>
                  <span className="text-xs" style={{color:'#64748b'}}>{new Date(c.startedAt).toLocaleDateString()}</span>
                </div>
                {c.competencyScores&&<div className="flex gap-3 flex-wrap mt-1">{Object.entries(c.competencyScores).map(([k,v])=><span key={k} className="text-xs" style={{color:v>=7?'#34d399':v>=5?'#f59e0b':'#f87171'}}>{k.slice(0,5)}:{v}</span>)}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if(view==='debrief'&&activeCase){
    const {ObjectiveDiscipline:objScore,...otherScores}=activeCase.competencyScores||{};
    const RATING_LABEL={STRONG:'STRONG',SOLID:'SOLID',DEVELOPING:'DEVELOPING',WEAK:'WEAK'};
    const objRating=activeCase.objectiveScore;
    return (
      <div className="max-w-2xl">
        <div className="glass rounded-xl p-6 border-subtle mb-4">
          <div className="text-sm font-semibold mb-1">Debrief — {activeCase.title}</div>
          {activeCase.debriefInsight&&<div className="text-xs mb-4 p-3 rounded-lg" style={{background:'rgba(99,102,241,0.1)',color:'#818cf8'}}>{activeCase.debriefInsight}</div>}
          {/* Objective Discipline block */}
          <div className="mb-4 p-4 rounded-xl" style={{background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.15)'}}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold tracking-widest" style={{color:'#818cf8'}}>OBJECTIVE DISCIPLINE</div>
              {objScore!=null&&<span className="text-sm font-bold" style={{color:objScore>=7?'#34d399':objScore>=5?'#f59e0b':'#f87171'}}>{objScore}/10</span>}
            </div>
            {activeCase.userObjective&&<div className="text-xs mb-2 italic" style={{color:'#64748b'}}>Stated objective: "{activeCase.userObjective}"</div>}
            {objRating&&<div className="text-xs font-semibold mb-1" style={{color:objRating==='STRONG'?'#34d399':objRating==='SOLID'?'#a5b4fc':objRating==='DEVELOPING'?'#f59e0b':'#f87171'}}>{RATING_LABEL[objRating]||objRating}</div>}
            {activeCase.objectiveDisciplineAssessment&&<div className="text-xs leading-relaxed" style={{color:'#94a3b8'}}>{activeCase.objectiveDisciplineAssessment}</div>}
          </div>
          {/* Core competency scores */}
          {Object.keys(otherScores).length>0&&(
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(otherScores).map(([k,v])=>(
                <div key={k} className="flex items-center justify-between p-2 rounded-lg" style={{background:'rgba(255,255,255,0.03)'}}>
                  <span className="text-xs" style={{color:'#94a3b8'}}>{C_DIM_LABELS[k]||k}</span>
                  <span className="text-sm font-bold" style={{color:v>=7?'#34d399':v>=5?'#f59e0b':'#f87171'}}>{v}/10</span>
                </div>
              ))}
            </div>
          )}
          {activeCase.strengths?.length>0&&<div className="mb-3"><div className="text-xs font-semibold mb-1" style={{color:'#34d399'}}>STRENGTHS</div><ul className="space-y-1">{activeCase.strengths.map((s,i)=><li key={i} className="text-sm" style={{color:'#94a3b8'}}>+ {s}</li>)}</ul></div>}
          {activeCase.weaknesses?.length>0&&<div><div className="text-xs font-semibold mb-1" style={{color:'#f87171'}}>AREAS TO WORK ON</div><ul className="space-y-1">{activeCase.weaknesses.map((w,i)=><li key={i} className="text-sm" style={{color:'#94a3b8'}}>• {w}</li>)}</ul></div>}
        </div>
        <button onClick={()=>setView('lobby')} className="px-6 py-2.5 rounded-lg text-sm" style={{background:'rgba(255,255,255,0.05)',color:'#94a3b8'}}>← All Cases</button>
      </div>
    );
  }

  // active case view
  const caseStateIdx=CASE_STATES.indexOf(activeCase?.state||'opening');
  const isObjPhase=activeCase?.state==='objective';
  const showObjBanner=['structure','exploration','synthesis','recommendation'].includes(activeCase?.state)&&activeCase?.userObjective;
  const RATING_COLOR_MAP={STRONG:'#34d399',SOLID:'#a5b4fc',DEVELOPING:'#f59e0b',WEAK:'#f87171'};

  // ── Objective step — dedicated UI ──────────────────────────────────────
  if(isObjPhase&&activeCase) return (
    <div className="flex flex-col" style={{height:'calc(100vh - 140px)'}}>
      {/* header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{activeCase.title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(99,102,241,0.2)',color:'#818cf8'}}>Objective</span>
          <div className="flex gap-0.5">{CASE_STATES.slice(0,-1).map((s,i)=><div key={s} className="w-2 h-2 rounded-full" style={{background:i<=caseStateIdx?'#6366f1':'rgba(255,255,255,0.1)'}}/>)}</div>
        </div>
        <button onClick={()=>setView('lobby')} className="text-xs px-2 py-1 rounded" style={{color:'#64748b'}}>Exit</button>
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        {/* heading */}
        <div className="mb-5">
          <div className="text-lg font-bold mb-1" style={{color:'#e2e8f0',letterSpacing:'0.02em'}}>WHAT IS THE GOAL OF THIS CASE?</div>
          <div className="text-sm" style={{color:'#64748b'}}>Before you structure the problem, state the decision the client needs you to resolve.</div>
        </div>
        {/* prompt reminder */}
        <div className="glass rounded-xl p-4 mb-4 text-sm leading-relaxed" style={{color:'#94a3b8',border:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="text-xs font-semibold mb-2" style={{color:'#475569'}}>CASE PROMPT</div>
          {getCaseConfig(activeCase.type).setup}
        </div>
        {/* input or feedback */}
        {!objFeedback?(
          <div className="flex flex-col gap-3 mb-4">
            <textarea value={objInput} onChange={e=>setObjInput(e.target.value)} rows={3}
              placeholder="e.g. Determine the root causes of the margin decline and recommend actions to restore profitability."
              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
              style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0'}}/>
            <button onClick={evaluateObjective} disabled={objSubmitting||!objInput.trim()||!apiKey}
              className="self-start px-5 py-2 rounded-lg text-sm font-semibold"
              style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff',opacity:objSubmitting||!objInput.trim()||!apiKey?0.4:1}}>
              {objSubmitting?'Evaluating…':'Submit Objective'}
            </button>
          </div>
        ):(
          <div className="flex flex-col gap-3 mb-4">
            {/* submitted objective */}
            <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
              <div className="text-xs font-bold tracking-widest mb-2" style={{color:'#475569'}}>YOUR OBJECTIVE</div>
              <div className="text-sm italic" style={{color:'#cbd5e1'}}>"{activeCase.userObjective}"</div>
            </div>
            {/* rating badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-base font-bold" style={{color:RATING_COLOR_MAP[objFeedback.rating]||'#e2e8f0'}}>{objFeedback.rating}</span>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(objFeedback.dimensions||{}).map(([k,v])=>(
                  <span key={k} className="text-xs px-2 py-0.5 rounded-full" style={{background:v?'rgba(52,211,153,0.1)':'rgba(248,113,113,0.1)',color:v?'#34d399':'#f87171',border:`1px solid ${v?'rgba(52,211,153,0.25)':'rgba(248,113,113,0.25)'}`}}>
                    {v?'✓':''} {k.replace(/([A-Z])/g,' $1').trim()}
                  </span>
                ))}
              </div>
            </div>
            {/* assessment */}
            <div className="text-sm leading-relaxed" style={{color:'#94a3b8'}}>{objFeedback.assessment}</div>
            {/* what's missing */}
            {objFeedback.whatsMissing&&<div className="text-xs p-3 rounded-lg" style={{background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)',color:'#fbbf24'}}><span className="font-semibold">Missing: </span>{objFeedback.whatsMissing}</div>}
            {/* strong version */}
            {objFeedback.strongVersion&&(
              <div className="p-4 rounded-xl" style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)'}}>
                <div className="text-xs font-bold tracking-widest mb-2" style={{color:'#818cf8'}}>ONE STRONG VERSION</div>
                <div className="text-sm italic" style={{color:'#e2e8f0'}}>"{objFeedback.strongVersion}"</div>
              </div>
            )}
            {/* actions */}
            <div className="flex gap-2 flex-wrap mt-1">
              <button onClick={confirmObjective} className="px-5 py-2 rounded-lg text-sm font-semibold" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff'}}>Continue to Structure →</button>
              <button onClick={()=>{setObjFeedback(null);setObjInput('');}} className="px-4 py-2 rounded-lg text-sm" style={{background:'rgba(255,255,255,0.05)',color:'#94a3b8'}}>Try Again</button>
            </div>
          </div>
        )}
        {/* tips section */}
        <div className="mt-2">
          <button onClick={()=>setShowObjTips(s=>!s)} className="text-xs flex items-center gap-1" style={{color:'#475569'}}>
            {showObjTips?'▼':'▶'} How to craft a strong case objective
          </button>
          {showObjTips&&(
            <div className="mt-3 glass rounded-xl p-5 text-xs leading-relaxed flex flex-col gap-3" style={{color:'#94a3b8',border:'1px solid rgba(255,255,255,0.06)'}}>
              <div>
                <div className="font-semibold mb-1" style={{color:'#e2e8f0'}}>1. Find the decision</div>
                <div>Ask: "What does the client actually need to decide?" — enter, acquire, fix, grow, launch, reduce costs?</div>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{color:'#e2e8f0'}}>2. Identify the success metric</div>
                <div>If the prompt gives one (profit, revenue growth, ROI), preserve it. Do not invent one the case does not provide.</div>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{color:'#e2e8f0'}}>3. Capture key constraints</div>
                <div>Time, geography, budget, profitability requirements — include them when they materially shape the answer.</div>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{color:'#e2e8f0'}}>4. Don't solve the case yet</div>
                <div>The objective defines WHAT must be solved. Your framework determines HOW you will solve it. Do not assume the answer.</div>
              </div>
              <div>
                <div className="font-semibold mb-1" style={{color:'#e2e8f0'}}>5. Keep it short</div>
                <div>A strong case objective can usually be stated in one sentence.</div>
              </div>
              <div className="pt-2 border-t border-white/5">
                <div className="font-semibold mb-2" style={{color:'#818cf8'}}>Mental template (optional)</div>
                <div className="italic mb-3" style={{color:'#64748b'}}>"Determine [WHAT] so the client can [DECISION / OUTCOME], while considering [CONSTRAINT if relevant]."</div>
                <div className="grid gap-1.5">
                  {[['Profitability','Identify the primary causes of the decline and recommend how management can restore sustainable margins.'],['Market entry','Determine whether the client should enter the market and, if so, how.'],['Growth','Determine how the client can achieve its growth target while maintaining acceptable profitability.'],['M&A','Determine whether the acquisition would create sufficient strategic and financial value, and if so, how to integrate.']].map(([t,ex])=>(
                    <div key={t}><span className="font-medium" style={{color:'#475569'}}>{t}: </span><span className="italic">{ex}</span></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Normal chat view ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{height:'calc(100vh - 140px)'}}>
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{activeCase?.title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(99,102,241,0.2)',color:'#818cf8'}}>{CASE_STATE_LABELS[activeCase?.state]||'Active'}</span>
          <div className="flex gap-0.5">
            {CASE_STATES.slice(0,-1).map((s,i)=>(
              <div key={s} className="w-2 h-2 rounded-full" style={{background:i<=caseStateIdx?'#6366f1':'rgba(255,255,255,0.1)'}}/>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeCase&&caseStateIdx<CASE_STATES.length-2&&(
            <button onClick={advanceState} disabled={streaming} className="text-xs px-3 py-1 rounded-lg" style={{background:'rgba(245,158,11,0.15)',color:'#f59e0b',opacity:streaming?0.4:1}}>Next Phase →</button>
          )}
          <button onClick={()=>setView('lobby')} className="text-xs px-2 py-1 rounded" style={{color:'#64748b'}}>Exit</button>
        </div>
      </div>
      {/* sticky objective banner for structure+ phases */}
      {showObjBanner&&(
        <div className="flex-shrink-0 mb-3 rounded-xl px-4 py-2.5 flex items-start gap-3" style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.18)'}}>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold tracking-widest mb-0.5" style={{color:'#818cf8'}}>CASE OBJECTIVE</div>
            {objBannerOpen&&<div className="text-xs leading-relaxed" style={{color:'#94a3b8'}}>{activeCase.userObjective}</div>}
          </div>
          <button onClick={()=>setObjBannerOpen(o=>!o)} className="text-xs flex-shrink-0 mt-0.5" style={{color:'#475569'}}>{objBannerOpen?'▲ hide':'▼ show'}</button>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {(activeCase?.sessionLog||[]).map((m,i)=>(
          <div key={i} className={`flex ${m.role==='candidate'?'justify-end':''}`}>
            <div className="max-w-lg rounded-xl px-4 py-3 text-sm" style={{background:m.role==='interviewer'?'rgba(255,255,255,0.04)':'rgba(99,102,241,0.15)',color:'#e2e8f0'}}>
              <div className="text-xs mb-1 font-semibold" style={{color:m.role==='interviewer'?'#64748b':'#818cf8'}}>{m.role==='interviewer'?'Interviewer':'You'}</div>
              {m.content}
            </div>
          </div>
        ))}
        {streaming&&streamText&&(
          <div className="flex">
            <div className="max-w-lg rounded-xl px-4 py-3 text-sm" style={{background:'rgba(255,255,255,0.04)',color:'#94a3b8'}}>
              <div className="text-xs mb-1 font-semibold" style={{color:'#64748b'}}>Interviewer</div>
              {streamText}<span className="animate-pulse">▋</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 flex gap-2">
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}} rows={2} placeholder="Your response… (Enter to send, Shift+Enter for newline)" className="flex-1 px-3 py-2 rounded-xl text-sm bg-transparent resize-none outline-none" style={{border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0'}} />
        <div className="flex flex-col gap-1">
          <button onClick={()=>dict.start()} title="Dictate" className="px-3 rounded-lg text-xs" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8',height:'50%'}}>🎙</button>
          <button onClick={sendMessage} disabled={streaming||!input.trim()} className="px-3 rounded-lg text-xs font-semibold" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff',height:'50%',opacity:streaming||!input.trim()?0.4:1}}>Send</button>
        </div>
      </div>
    </div>
  );
}

/* ----------- Unprompted ----------- */
function UnpromptedSubtab({consulting,setConsulting,apiKey,toasts}){
  const [mode,setMode]=useState('structured'); // structured | rapid-brief
  const [phase,setPhase]=useState('setup'); // setup | reading | responding | grading | result
  const [situation,setSituation]=useState('');
  const [readTimer,setReadTimer]=useState(15);
  const [respTimer,setRespTimer]=useState(90);
  const [timerActive,setTimerActive]=useState(false);
  const [response,setResponse]=useState('');
  const [feedback,setFeedback]=useState('');
  const [scoreData,setScoreData]=useState(null);
  const dict=useDictation(t=>{setResponse(p=>p?p+' '+t:t);});

  const SITUATIONS=[
    'A fast-food chain\'s same-store sales fell 11% in Q1. Traffic is down 15%, but average ticket is up. Costs are flat.',
    'A logistics company\'s margins compressed from 12% to 6% in 18 months. Volume grew 20%. No price changes.',
    'A mid-market software firm doubled its sales team but missed revenue targets by 30%. Win rate held stable.',
    'An e-commerce retailer\'s return rate jumped from 18% to 31% over six months with no product changes.',
    'A hotel chain\'s RevPAR fell 14% despite industry RevPAR growing 8% in the same period.',
    'A healthcare network\'s cost per patient visit rose 22% while patient volume held flat.',
  ];

  useEffect(()=>{
    if(!timerActive)return;
    const setter=phase==='reading'?setReadTimer:setRespTimer;
    const cur=phase==='reading'?readTimer:respTimer;
    if(cur<=0){setTimerActive(false);if(phase==='reading'){setPhase('responding');setRespTimer(mode==='structured'?90:60);setTimerActive(true);}else{setPhase('grading');submitResponse();}return;}
    const id=setTimeout(()=>setter(t=>t-1),1000);
    return()=>clearTimeout(id);
  },[timerActive,phase,readTimer,respTimer]);

  const startSession=()=>{
    const sit=SITUATIONS[Math.floor(Math.random()*SITUATIONS.length)];
    setSituation(sit);setResponse('');setFeedback('');setScoreData(null);
    setReadTimer(15);setRespTimer(mode==='structured'?90:60);
    setPhase('reading');setTimerActive(true);
  };

  const submitResponse=async()=>{
    setTimerActive(false);setPhase('grading');
    if(!apiKey){setFeedback('Add API key in Settings.');setPhase('result');return;}
    const modeLabel=mode==='structured'?'Structured Response (90s)':'Rapid Brief (60s)';
    const system=mode==='structured'
      ?'You are a case coach. Grade this structured response on: (1) top-down structure (2) MECE categories (3) synthesis quality. 3-4 sentences. Be specific and honest.'
      :'You are a case coach. Grade this rapid brief on: (1) concision (2) clarity (3) whether the headline insight is stated first. 2-3 sentences. Be blunt.';
    try{
      const fb=await streamFeedback(apiKey,system,`Mode: ${modeLabel}\nSituation: ${situation}\nResponse: ${response||'(no response)'}`,setFeedback);
      const sd=await getScoreJson(apiKey,situation,response||'(no response)',fb);
      setScoreData(sd);
    }catch(e){toasts.push('Error: '+e.message);}
    setPhase('result');
  };

  const timerDisplay=(t)=>`${Math.floor(t/60)}:${(t%60).toString().padStart(2,'0')}`;
  const timerColor=(t)=>t>15?'#34d399':t>5?'#f59e0b':'#f87171';

  if(phase==='setup') return (
    <div className="max-w-xl">
      <div className="glass rounded-xl p-6 border-subtle">
        <div className="text-sm font-semibold mb-4">Unprompted Practice</div>
        <div className="flex gap-2 mb-5">
          {[['structured','Structured Response (90s)'],['rapid-brief','Rapid Brief (60s)']].map(([m,label])=>(
            <button key={m} onClick={()=>setMode(m)} className="flex-1 py-2 rounded-lg text-xs font-medium transition-all" style={{background:mode===m?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)',color:mode===m?'#818cf8':'#94a3b8',border:'1px solid rgba(255,255,255,0.06)'}}>{label}</button>
          ))}
        </div>
        <div className="text-xs mb-5 leading-relaxed" style={{color:'#64748b'}}>
          {mode==='structured'?'You\'ll have 15 seconds to read a business situation, then 90 seconds to structure a response. AI grades for top-down structure, MECE categories, and synthesis.':'You\'ll have 15 seconds to read a business situation, then 60 seconds to give a rapid headline-first brief. AI grades for concision, clarity, and whether you led with the insight.'}
        </div>
        <button onClick={startSession} className="w-full py-2.5 rounded-lg font-semibold text-sm" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff'}}>Start Session</button>
      </div>
    </div>
  );

  if(phase==='reading') return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium" style={{color:'#f59e0b'}}>Read the situation</div>
        <span className="text-2xl font-mono font-bold" style={{color:timerColor(readTimer)}}>{readTimer}s</span>
      </div>
      <div className="glass rounded-xl p-6 border-subtle text-sm leading-relaxed">{situation}</div>
    </div>
  );

  if(phase==='responding') return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium">Your response</div>
        <span className="text-2xl font-mono font-bold" style={{color:timerColor(respTimer)}}>{timerDisplay(respTimer)}</span>
      </div>
      <div className="glass rounded-xl p-3 border-subtle mb-3 text-xs" style={{color:'#64748b'}}>{situation}</div>
      <div className="glass rounded-xl p-4 border-subtle mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs" style={{color:'#64748b'}}>Response</span>
          <button onClick={()=>dict.start()} className="text-xs px-2 py-0.5 rounded" style={{color:'#818cf8',background:'rgba(99,102,241,0.1)'}}>🎙 Voice</button>
        </div>
        <textarea value={response} onChange={e=>setResponse(e.target.value)} rows={5} placeholder="Start speaking or typing…" className="w-full bg-transparent text-sm resize-none outline-none" style={{color:'#e2e8f0'}} />
      </div>
      <button onClick={()=>{setTimerActive(false);setPhase('grading');submitResponse();}} className="w-full py-2.5 rounded-lg font-semibold text-sm" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff'}}>Submit Early</button>
    </div>
  );

  if(phase==='grading') return (
    <div className="max-w-2xl glass rounded-xl p-6 border-subtle">
      <div className="text-sm font-semibold mb-4">Grading…</div>
      <div className="text-sm leading-relaxed" style={{color:'#94a3b8',whiteSpace:'pre-wrap'}}>{feedback||'Analyzing your response…'}</div>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="glass rounded-xl p-6 border-subtle mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Result</div>
          <div className="text-3xl font-bold" style={{color:scoreData?.score>=7?'#34d399':scoreData?.score>=5?'#f59e0b':'#f87171'}}>{scoreData?.score??'—'}<span className="text-base" style={{color:'#64748b'}}>/10</span></div>
        </div>
        <div className="text-sm leading-relaxed mb-4" style={{color:'#94a3b8',whiteSpace:'pre-wrap'}}>{feedback}</div>
        {scoreData?.improvements?.length>0&&<ul className="space-y-1">{scoreData.improvements.map((imp,i)=><li key={i} className="text-sm" style={{color:'#e2e8f0'}}>• {imp}</li>)}</ul>}
      </div>
      <button onClick={()=>setPhase('setup')} className="px-6 py-2.5 rounded-lg text-sm" style={{background:'rgba(255,255,255,0.05)',color:'#94a3b8'}}>← New Session</button>
    </div>
  );
}

/* ----------- Learn ----------- */
const LEARN_CARDS=[
  {id:'mece',title:'MECE',tag:'Foundation',body:'Mutually Exclusive, Collectively Exhaustive. Every good structure covers all relevant space with no overlap. Test: does adding more items change the total, or just move it between buckets?'},
  {id:'issue-tree',title:'Issue Trees',tag:'Structuring',body:'A top-down decomposition of a problem. The root is the question; each branch is a potential cause or component; leaves are the facts you need. Good trees are MECE at every level.'},
  {id:'hyp-led',title:'Hypothesis-Led Thinking',tag:'Hypothesis',body:'State your best answer first, then test it. Don\'t explore a problem with an open mind — explore it with a specific prediction you are actively trying to disprove. McKinsey calls this "point of view from day one."'},
  {id:'profit',title:'Profitability Framework',tag:'Frameworks',body:'Profit = Revenue − Cost. Revenue = Price × Volume. Costs split into fixed and variable. Always check both sides. Within each: segment by product, channel, geography, or customer to find where the divergence is.'},
  {id:'market-entry',title:'Market Entry Framework',tag:'Frameworks',body:'Assess: (1) Market attractiveness — size, growth, competition, profitability. (2) Competitive position — can our client win? (3) Entry mode — build, buy, partner. (4) Financials — does it meet the hurdle rate?'},
  {id:'ma',title:'M&A Framework',tag:'Frameworks',body:'Assess: (1) Strategic rationale — why this deal, why now? (2) Target quality — business, financials, culture. (3) Valuation — what is it worth, what are we paying? (4) Integration risk — can we actually capture synergies?'},
  {id:'charts',title:'Chart Reading',tag:'Charts',body:'Four steps: (1) State what the chart shows (axes, units, time range). (2) State the headline number or trend. (3) State the key insight (what is surprising or actionable). (4) State what you would investigate first.'},
  {id:'synthesis',title:'Top-Down Communication',tag:'Communication',body:'Lead with the conclusion, then support it. Never narrate your analysis first. The Pyramid Principle: Answer → Key arguments → Evidence. In a case: "The root cause is X. This is supported by A, B, and C."'},
  {id:'estimation',title:'Estimation Technique',tag:'Quant',body:'Segment, estimate each segment, multiply. Anchor on facts you know (US population ≈ 330M, avg household ≈ 2.5 people). Show your math explicitly. State your key assumptions. Sanity-check the answer.'},
  {id:'case-mgmt',title:'Managing the Case',tag:'Case Management',body:'You run the conversation: summarize what you\'ve learned, state what you will do next, ask one focused question at a time. If the client pushes back, acknowledge the constraint and redirect — never freeze.'},
];

function LearnSubtab(){
  const [seen,setSeen]=useLocalState('magverse:learnSeen',{});
  const [open,setOpen]=useState(null);
  const tags=[...new Set(LEARN_CARDS.map(c=>c.tag))];
  const [filterTag,setFilterTag]=useState('');
  const filtered=filterTag?LEARN_CARDS.filter(c=>c.tag===filterTag):LEARN_CARDS;

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={()=>setFilterTag('')} className="text-xs px-3 py-1 rounded-full" style={{background:!filterTag?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)',color:!filterTag?'#818cf8':'#64748b'}}>All</button>
        {tags.map(t=><button key={t} onClick={()=>setFilterTag(t)} className="text-xs px-3 py-1 rounded-full" style={{background:filterTag===t?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)',color:filterTag===t?'#818cf8':'#64748b'}}>{t}</button>)}
      </div>
      <div className="grid grid-cols-1 gap-3" style={{maxWidth:'720px'}}>
        {filtered.map(card=>(
          <div key={card.id} className="glass rounded-xl p-4 border-subtle cursor-pointer hover:bg-white/2" onClick={()=>setOpen(open===card.id?null:card.id)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>{card.tag}</span>
                <span className="text-sm font-medium">{card.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {seen[card.id]&&<span className="text-xs" style={{color:'#34d399'}}>✓</span>}
                <span className="text-xs" style={{color:'#475569'}}>{open===card.id?'▲':'▼'}</span>
              </div>
            </div>
            {open===card.id&&(
              <div className="mt-3">
                <div className="text-sm leading-relaxed mb-3" style={{color:'#94a3b8'}}>{card.body}</div>
                <button onClick={e=>{e.stopPropagation();setSeen(s=>({...s,[card.id]:true}));}} className="text-xs px-3 py-1 rounded-lg" style={{background:'rgba(52,211,153,0.15)',color:'#34d399'}}>Mark as reviewed</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------- Review ----------- */
function ReviewSubtab({consulting,setConsulting,apiKey,toasts,onDrillFromError}){
  const [dimFilter,setDimFilter]=useState('');
  const [genPlan,setGenPlan]=useState(false);
  const errorLog=consulting.errorLog||[];
  const cases=consulting.cases||[];
  const plan=consulting.practiceplan;

  const filtered=dimFilter?errorLog.filter(e=>e.dimension===dimFilter):errorLog;
  const open=filtered.filter(e=>!e.resolved).sort((a,b)=>b.createdAt-a.createdAt);
  const resolved=filtered.filter(e=>e.resolved);

  const resolve=(id)=>setConsulting(c=>({...c,errorLog:(c.errorLog||[]).map(e=>e.id===id?{...e,resolved:true}:e)}));

  const generatePlan=async()=>{
    if(!apiKey){toasts.push('Add API key in Settings');return;}
    setGenPlan(true);
    try{
      const logSummary=(consulting.errorLog||[]).slice(-30).map(e=>`${e.dimension}: ${e.description}`).join('\n');
      const drillSummary=(consulting.drills||[]).slice(-20).map(d=>`${d.dimension} ${d.drillType}: ${d.score}/10`).join('\n');
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model:'gpt-4o-mini',response_format:{type:'json_object'},max_tokens:400,messages:[{role:'system',content:'You are a case coach. Return JSON: {"drills":[{"dimension":"","drillType":"","rationale":"","priority":1},{"dimension":"","drillType":"","rationale":"","priority":2},{"dimension":"","drillType":"","rationale":"","priority":3}],"insight":"1 sentence summary of current weakness pattern"}'},{role:'user',content:`Error log (recent):\n${logSummary||'(none)'}\n\nDrill history:\n${drillSummary||'(none)'}`}]})});
      const j=await resp.json();
      const parsed=JSON.parse(j.choices[0].message.content);
      setConsulting(c=>({...c,practiceplan:{...parsed,generatedAt:Date.now(),weekOf:new Date().toISOString().slice(0,10)}}));
      toasts.push('Practice plan updated');
    }catch(e){toasts.push('Error: '+e.message);}
    setGenPlan(false);
  };

  return (
    <div className="space-y-6" style={{maxWidth:'720px'}}>
      {plan&&(
        <div className="glass rounded-xl p-5 border-subtle" style={{borderLeft:'3px solid #6366f1'}}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">This Week's Practice Plan</div>
            <span className="text-xs" style={{color:'#64748b'}}>Generated {new Date(plan.generatedAt).toLocaleDateString()}</span>
          </div>
          {plan.insight&&<div className="text-xs mb-3 p-2 rounded" style={{background:'rgba(99,102,241,0.1)',color:'#818cf8'}}>{plan.insight}</div>}
          <div className="space-y-2">
            {(plan.drills||[]).map((d,i)=>(
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{background:'rgba(255,255,255,0.03)'}}>
                <span className="text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-bold" style={{background:'rgba(99,102,241,0.2)',color:'#818cf8'}}>#{d.priority||i+1}</span>
                <div>
                  <span className="text-sm font-medium">{C_DIM_LABELS[d.dimension]||d.dimension}</span>
                  <span className="text-xs ml-2" style={{color:'#64748b'}}>— {d.drillType}</span>
                  {d.rationale&&<div className="text-xs mt-0.5" style={{color:'#64748b'}}>{d.rationale}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>setDimFilter('')} className="text-xs px-3 py-1 rounded-full" style={{background:!dimFilter?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)',color:!dimFilter?'#818cf8':'#64748b'}}>All</button>
          {[...new Set(errorLog.map(e=>e.dimension))].map(d=><button key={d} onClick={()=>setDimFilter(d)} className="text-xs px-3 py-1 rounded-full" style={{background:dimFilter===d?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)',color:dimFilter===d?'#818cf8':'#64748b'}}>{C_DIM_LABELS[d]||d}</button>)}
        </div>
        <button onClick={generatePlan} disabled={genPlan} className="text-xs px-4 py-1.5 rounded-lg font-medium" style={{background:'linear-gradient(90deg,#6366f1,#8b5cf6)',color:'#fff',opacity:genPlan?0.5:1}}>
          {genPlan?'Generating…':'Generate Practice Plan'}
        </button>
      </div>

      <div>
        <div className="text-xs font-semibold mb-3" style={{color:'#f87171'}}>OPEN WEAKNESSES ({open.length})</div>
        {open.length===0&&<div className="text-sm" style={{color:'#64748b'}}>No open weaknesses{dimFilter?' in this dimension':''}. Complete drills and cases to populate this.</div>}
        <div className="space-y-2">
          {open.map(e=>(
            <div key={e.id} className="glass rounded-xl p-4 border-subtle">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(248,113,113,0.15)',color:'#f87171'}}>{C_DIM_LABELS[e.dimension]||e.dimension}</span>
                    <span className="text-xs" style={{color:'#475569'}}>{new Date(e.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm">{e.description}</div>
                  {e.feedback&&<div className="text-xs mt-1" style={{color:'#64748b'}}>{e.feedback.slice(0,150)}{e.feedback.length>150?'…':''}</div>}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {onDrillFromError&&<button onClick={()=>onDrillFromError(e.dimension)} className="text-xs px-2 py-1 rounded whitespace-nowrap" style={{color:'#818cf8',background:'rgba(99,102,241,0.12)'}}>Drill →</button>}
                  <button onClick={()=>resolve(e.id)} className="text-xs px-2 py-1 rounded" style={{color:'#34d399',background:'rgba(52,211,153,0.1)'}}>Resolve</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {resolved.length>0&&(
        <div>
          <div className="text-xs font-semibold mb-3" style={{color:'#34d399'}}>RESOLVED ({resolved.length})</div>
          <div className="space-y-2">
            {resolved.slice(0,5).map(e=>(
              <div key={e.id} className="glass rounded-xl p-3 border-subtle opacity-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(52,211,153,0.1)',color:'#34d399'}}>{C_DIM_LABELS[e.dimension]||e.dimension}</span>
                  <span className="text-sm">{e.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cases.filter(c=>c.state==='done').length>0&&(
        <div>
          <div className="text-xs font-semibold mb-3" style={{color:'#64748b'}}>CASE HISTORY</div>
          <div className="space-y-2">
            {cases.filter(c=>c.state==='done').slice(-10).reverse().map(c=>(
              <div key={c.id} className="glass rounded-xl p-4 border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{c.title}</span>
                  <span className="text-xs" style={{color:'#64748b'}}>{new Date(c.startedAt).toLocaleDateString()}</span>
                </div>
                {c.competencyScores&&<div className="flex gap-2 flex-wrap">{Object.entries(c.competencyScores).map(([k,v])=><span key={k} className="text-xs" style={{color:v>=7?'#34d399':v>=5?'#f59e0b':'#f87171'}}>{k.slice(0,4)}:{v}</span>)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------- Main ConsultingPanel ----------- */
function ConsultingPanel({data, setData, toasts, isMobile}){
  const [subtab,setSubtab]=useState('home');
  const [drillInit,setDrillInit]=useState({dim:'',type:''});
  const consulting=data.consulting||getDefaultConsulting();
  const setConsulting=patch=>setData(d=>({...d,consulting:{...(d.consulting||getDefaultConsulting()),...(typeof patch==='function'?patch(d.consulting||getDefaultConsulting()):patch)}}));
  const apiKey=data.settings?.apiKey||'';

  const goToDrill=(dim,type='')=>{setDrillInit({dim,type});setSubtab('drills');};

  const SUBTABS=[{id:'home',label:'Home'},{id:'drills',label:'Drills'},{id:'cases',label:'Cases'},{id:'unprompted',label:'Unprompted'},{id:'learn',label:'Learn'},{id:'review',label:'Review'}];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold">Consulting Practice</h2>
          <div className="text-xs mt-0.5" style={{color:'#64748b'}}>Case interview and consulting skill builder</div>
        </div>
      </div>
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',overflowX:'auto',width:'fit-content',maxWidth:'100%'}}>
        {SUBTABS.map(t=>(
          <button key={t.id} onClick={()=>setSubtab(t.id)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={{background:subtab===t.id?'rgba(99,102,241,0.25)':'transparent',color:subtab===t.id?'#818cf8':'#94a3b8'}}>
            {t.label}
          </button>
        ))}
      </div>
      {subtab==='home'       &&<ConsultingHome consulting={consulting} setConsulting={setConsulting} apiKey={apiKey} toasts={toasts} setSubtab={setSubtab} onDrillFromError={goToDrill}/>}
      {subtab==='drills'     &&<DrillsSubtab consulting={consulting} setConsulting={setConsulting} apiKey={apiKey} toasts={toasts} initDim={drillInit.dim} initType={drillInit.type}/>}
      {subtab==='cases'      &&<CasesSubtab consulting={consulting} setConsulting={setConsulting} apiKey={apiKey} toasts={toasts}/>}
      {subtab==='unprompted' &&<UnpromptedSubtab consulting={consulting} setConsulting={setConsulting} apiKey={apiKey} toasts={toasts}/>}
      {subtab==='learn'      &&<LearnSubtab/>}
      {subtab==='review'     &&<ReviewSubtab consulting={consulting} setConsulting={setConsulting} apiKey={apiKey} toasts={toasts} onDrillFromError={goToDrill}/>}
    </div>
  );
}

/* -------------------- Error Boundary -------------------- */
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={error:null}; }
  static getDerivedStateFromError(e){ return {error:e}; }
  componentDidCatch(e, info){ console.error('React render error:', e, info); }
  render(){
    if(this.state.error){
      const msg = this.state.error && (this.state.error.stack || this.state.error.message || String(this.state.error));
      return React.createElement('div',{style:{color:'#ff6b6b',padding:'24px',fontFamily:'monospace',fontSize:'13px',whiteSpace:'pre-wrap',background:'#1e0000',border:'2px solid #ff0000',borderRadius:'8px',margin:'20px'}},
        'React render error:\n\n' + msg
      );
    }
    return this.props.children;
  }
}

/* -------------------- Render -------------------- */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(ErrorBoundary, null, React.createElement(App, null)));
