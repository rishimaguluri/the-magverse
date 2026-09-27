// strategyVisualRenderer.jsx
// The ONE visual renderer for Strategy lesson content — dispatches on visual.type, one
// hand-rolled inline-SVG function per type (mirrors consultingExhibitRenderer.jsx's
// ExhibitViewer; no charting library, no new dependency). Classic Babel-transformed script.

const SV_COLORS = ['#818cf8','#34d399','#f59e0b','#f87171','#a78bfa','#22d3ee'];
const SV_TEXT = {text:'#e2e8f0', dim:'#cbd5e1', mid:'#94a3b8', faint:'#64748b', grid:'rgba(255,255,255,0.1)'};

function svFmt(v, unit){
  if(typeof v!=='number') return String(v);
  const s = Math.abs(v)>=1000 ? v.toLocaleString('en-US') : (Number.isInteger(v)?String(v):v.toFixed(1));
  if(unit==='$') return '$'+s;
  if(unit) return s+unit;
  return s;
}

/* ---------- causal-chain: A -> B -> C, optionally branching ---------- */
function VCausalChain({visual}){
  const nodes = visual.nodes;
  const n = nodes.length;
  const W = Math.max(460, n*150), H = 120;
  const gap = (W-80)/(n-1||1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      {nodes.map((node,i)=>{
        if(i===n-1) return null;
        const x1=40+i*gap+60, x2=40+(i+1)*gap;
        const y=H/2;
        return (
          <g key={'e'+i}>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={SV_TEXT.faint} strokeWidth="1.5" markerEnd="url(#svArrow)"/>
            {visual.edges && visual.edges[i]?.label && <text x={(x1+x2)/2} y={y-8} textAnchor="middle" fontSize="10" fill={SV_TEXT.faint}>{visual.edges[i].label}</text>}
          </g>
        );
      })}
      <defs>
        <marker id="svArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={SV_TEXT.faint}/></marker>
      </defs>
      {nodes.map((node,i)=>{
        const x=40+i*gap;
        const y=H/2;
        return (
          <g key={node.id||i}>
            <rect x={x} y={y-26} width={120} height={52} rx="10" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.35)"/>
            <foreignObject x={x} y={y-26} width={120} height={52}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',padding:'0 6px',textAlign:'center'}}>
                <div style={{fontSize:11,fontWeight:600,color:SV_TEXT.text,lineHeight:1.25}}>{node.label}</div>
                {node.sub && <div style={{fontSize:9,color:SV_TEXT.faint,marginTop:2}}>{node.sub}</div>}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- value-wedge: WTP / Price / SOC vertical bar ---------- */
function VValueWedge({visual}){
  const {wtp, price, soc, unit} = visual;
  const W=360, H=240, top=20, bottom=210;
  const maxV = wtp.value, minV = Math.min(soc.value, 0);
  const scale = v => top + (1-((v-minV)/((maxV-minV)||1)))*(bottom-top);
  const yWtp = scale(wtp.value), yPrice = scale(price.value), ySoc = scale(soc.value);
  const barX=140, barW=70;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      <rect x={barX} y={yWtp} width={barW} height={Math.max(yPrice-yWtp,0)} fill="rgba(52,211,153,0.35)"/>
      <rect x={barX} y={yPrice} width={barW} height={Math.max(ySoc-yPrice,0)} fill="rgba(99,102,241,0.35)"/>
      {[
        {y:yWtp, label:wtp.label||'WTP', value:wtp.value, color:'#34d399'},
        {y:yPrice, label:price.label||'Price', value:price.value, color:'#818cf8'},
        {y:ySoc, label:soc.label||'SOC', value:soc.value, color:'#f59e0b'},
      ].map((row,i)=>(
        <g key={i}>
          <line x1={barX-8} y1={row.y} x2={barX+barW+8} y2={row.y} stroke={row.color} strokeWidth="1.5" strokeDasharray="3,2"/>
          <text x={barX+barW+14} y={row.y+4} fontSize="11" fill={row.color} fontWeight="600">{row.label}: {svFmt(row.value, unit)}</text>
        </g>
      ))}
      <text x={barX+barW/2} y={(yWtp+yPrice)/2+4} textAnchor="middle" fontSize="10" fill="#34d399">buyer captures</text>
      <text x={barX+barW/2} y={(yPrice+ySoc)/2+4} textAnchor="middle" fontSize="10" fill="#818cf8">seller captures</text>
    </svg>
  );
}

/* ---------- activity-map: hub + activities around it, with fit links ---------- */
function VActivityMap({visual}){
  const {hub, activities, links} = visual;
  const W=420, H=340, cx=W/2, cy=H/2, r=120;
  const n = activities.length;
  const pos = activities.map((a,i)=>{
    const angle = (i/n)*2*Math.PI - Math.PI/2;
    return {...a, x:cx+r*Math.cos(angle), y:cy+r*Math.sin(angle)};
  });
  const byId = Object.fromEntries(pos.map(a=>[a.id,a]));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      {(links||[]).map(([a,b],i)=>{
        const pa=byId[a], pb=byId[b];
        if(!pa||!pb) return null;
        return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>;
      })}
      {pos.map(a=>(
        <line key={'h'+a.id} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      ))}
      <circle cx={cx} cy={cy} r="46" fill="rgba(99,102,241,0.18)" stroke="rgba(99,102,241,0.4)"/>
      <foreignObject x={cx-44} y={cy-24} width={88} height={48}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',textAlign:'center',fontSize:10,fontWeight:700,color:SV_TEXT.text}}>{hub.label}</div>
      </foreignObject>
      {pos.map(a=>(
        <g key={a.id}>
          <circle cx={a.x} cy={a.y} r="34" fill="rgba(52,211,153,0.12)" stroke="rgba(52,211,153,0.35)"/>
          <foreignObject x={a.x-32} y={a.y-20} width={64} height={40}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',textAlign:'center',fontSize:9,color:SV_TEXT.dim,lineHeight:1.2}}>{a.label}</div>
          </foreignObject>
        </g>
      ))}
    </svg>
  );
}

/* ---------- decision-tree: root -> branches, with EV computed ---------- */
function VDecisionTree({visual}){
  const {root, branches, unit} = visual;
  const W=460, H=Math.max(180, branches.length*56+40);
  const rootX=60, rootY=H/2, endX=W-140;
  const ev = branches.reduce((s,b)=>s+b.prob*b.payoff,0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      <rect x={10} y={rootY-22} width={100} height={44} rx="8" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)"/>
      <text x={60} y={rootY+4} textAnchor="middle" fontSize="10" fontWeight="600" fill={SV_TEXT.text}>{root.label}</text>
      {branches.map((b,i)=>{
        const y = 30 + i*((H-60)/(branches.length-1||1));
        return (
          <g key={i}>
            <line x1={110} y1={rootY} x2={endX} y2={y} stroke={SV_TEXT.faint} strokeWidth="1.25"/>
            <text x={(110+endX)/2} y={(rootY+y)/2-6} textAnchor="middle" fontSize="9" fill={SV_TEXT.faint}>p={Math.round(b.prob*100)}%</text>
            <rect x={endX} y={y-16} width={110} height={32} rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"/>
            <text x={endX+55} y={y-2} textAnchor="middle" fontSize="9.5" fill={SV_TEXT.dim}>{b.label}</text>
            <text x={endX+55} y={y+11} textAnchor="middle" fontSize="9.5" fontWeight="600" fill={b.payoff>=0?'#34d399':'#f87171'}>{svFmt(b.payoff, unit)}</text>
          </g>
        );
      })}
      <text x={W/2} y={H-6} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#a5b4fc">Expected value = {svFmt(Math.round(ev*100)/100, unit)}</text>
    </svg>
  );
}

/* ---------- bar-compare: simple vertical grouped bars ---------- */
function VBarCompare({visual}){
  const {categories, series, unit} = visual;
  const W=440, H=220, padL=44, padB=32, padT=14, padR=14;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const maxV = Math.max(...series.flatMap(s=>s.values), 1);
  const n=categories.length, groupW=plotW/n, barGap=groupW*0.22;
  const barW=(groupW-barGap)/series.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke={SV_TEXT.grid}/>
      {categories.map((c,i)=>{
        const gx = padL+i*groupW;
        return (
          <g key={c}>
            <text x={gx+groupW/2} y={H-padB+16} textAnchor="middle" fontSize="10" fill={SV_TEXT.dim}>{c}</text>
            {series.map((s,si)=>{
              const h=(s.values[i]/maxV)*plotH;
              const bx = gx+barGap/2+si*barW;
              const by = H-padB-h;
              return (
                <g key={s.label}>
                  <rect x={bx} y={by} width={barW*0.86} height={Math.max(h,0)} fill={SV_COLORS[si%SV_COLORS.length]} rx="2"/>
                  <text x={bx+barW*0.43} y={by-4} textAnchor="middle" fontSize="9" fill={SV_TEXT.faint}>{svFmt(s.values[i], unit)}</text>
                </g>
              );
            })}
          </g>
        );
      })}
      {series.length>1 && (
        <foreignObject x={padL} y={0} width={plotW} height={14}>
          <div style={{display:'flex',gap:10,fontSize:10}}>
            {series.map((s,si)=><span key={s.label} style={{color:SV_COLORS[si%SV_COLORS.length]}}>● {s.label}</span>)}
          </div>
        </foreignObject>
      )}
    </svg>
  );
}

/* ---------- tradeoff-scale: horizontal scale with points plotted 0-1 ---------- */
function VTradeoffScale({visual}){
  const {leftLabel, rightLabel, points} = visual;
  const W=440, H=70+points.length*4, padX=30, y=40;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      <line x1={padX} y1={y} x2={W-padX} y2={y} stroke={SV_TEXT.grid} strokeWidth="2"/>
      <text x={padX} y={y+22} fontSize="10.5" fill={SV_TEXT.mid}>{leftLabel}</text>
      <text x={W-padX} y={y+22} textAnchor="end" fontSize="10.5" fill={SV_TEXT.mid}>{rightLabel}</text>
      {points.map((p,i)=>{
        const x = padX + p.position*(W-2*padX);
        const stagger = (i%2===0) ? -14 : 14;
        return (
          <g key={p.label}>
            <circle cx={x} cy={y} r="5" fill={SV_COLORS[i%SV_COLORS.length]}/>
            <text x={x} y={y+stagger+(stagger<0?-4:14)} textAnchor="middle" fontSize="9.5" fill={SV_TEXT.text}>{p.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- 2x2-matrix ---------- */
function V2x2Matrix({visual}){
  const {xAxis, yAxis, points, quadrantLabels} = visual;
  const W=360, H=320, padX=60, padY=40;
  const plotW=W-2*padX, plotH=H-2*padY;
  const px = v => padX + v*plotW;
  const py = v => padY + (1-v)*plotH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      <rect x={padX} y={padY} width={plotW} height={plotH} fill="rgba(255,255,255,0.02)" stroke={SV_TEXT.grid}/>
      <line x1={padX+plotW/2} y1={padY} x2={padX+plotW/2} y2={padY+plotH} stroke={SV_TEXT.grid}/>
      <line x1={padX} y1={padY+plotH/2} x2={padX+plotW} y2={padY+plotH/2} stroke={SV_TEXT.grid}/>
      <text x={padX-6} y={padY-8} fontSize="9.5" fill={SV_TEXT.faint} textAnchor="start">{yAxis.top}</text>
      <text x={padX-6} y={padY+plotH+16} fontSize="9.5" fill={SV_TEXT.faint} textAnchor="start">{yAxis.bottom}</text>
      <text x={padX} y={padY+plotH+30} fontSize="9.5" fill={SV_TEXT.faint} textAnchor="start">{xAxis.left}</text>
      <text x={padX+plotW} y={padY+plotH+30} fontSize="9.5" fill={SV_TEXT.faint} textAnchor="end">{xAxis.right}</text>
      {points.map(p=>(
        <g key={p.label}>
          <circle cx={px(p.x)} cy={py(p.y)} r="6" fill="#818cf8" opacity="0.9"/>
          <text x={px(p.x)+9} y={py(p.y)+3} fontSize="10" fill={SV_TEXT.text}>{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

/* ---------- dispatcher ---------- */

function VisualBody({visual}){
  switch(visual.type){
    case 'causal-chain': return <VCausalChain visual={visual}/>;
    case 'value-wedge': return <VValueWedge visual={visual}/>;
    case 'activity-map': return <VActivityMap visual={visual}/>;
    case 'decision-tree': return <VDecisionTree visual={visual}/>;
    case 'bar-compare': return <VBarCompare visual={visual}/>;
    case 'tradeoff-scale': return <VTradeoffScale visual={visual}/>;
    case '2x2-matrix': return <V2x2Matrix visual={visual}/>;
    default: return <div style={{fontSize:12,color:SV_TEXT.faint}}>Unsupported visual type: {visual.type}</div>;
  }
}

// The ONE visual component every lesson block renders through.
function VisualBlock({visual}){
  if(!visual) return null;
  return (
    <div className="rounded-xl" style={{padding:16, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)'}}>
      {visual.title && <div style={{fontSize:11,color:SV_TEXT.faint,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:8}}>{visual.title}</div>}
      <VisualBody visual={visual}/>
      {visual.caption && <div style={{fontSize:11.5,color:SV_TEXT.faint,marginTop:10,lineHeight:1.5}}>{visual.caption}</div>}
    </div>
  );
}
