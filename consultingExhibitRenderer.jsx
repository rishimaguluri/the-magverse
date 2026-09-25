// consultingExhibitRenderer.jsx
// The ONE exhibit renderer — used identically by Learn, Drills, Cases, and Review. No per-feature
// chart components, no charting library (hand-rolled inline SVG, consistent with this app's
// zero-new-runtime-deps posture). Classic Babel-transformed script.

const EXHIBIT_COLORS = ['#818cf8','#34d399','#f59e0b','#f87171','#a78bfa','#22d3ee'];
const EX_TEXT = {text:'#e2e8f0', dim:'#94a3b8', faint:'#64748b', grid:'rgba(255,255,255,0.08)'};

function exFmt(v, unit){
  if(typeof v!=='number') return String(v);
  const s = Math.abs(v)>=1000 ? v.toLocaleString('en-US') : (Number.isInteger(v)?String(v):v.toFixed(1));
  if(unit==='$') return '$'+s;
  if(unit) return s+unit;
  return s;
}

/* ---------- SVG chart types ---------- */

function ExBarChart({data, horizontal, stacked}){
  const W=440, H=220, padL=horizontal?90:30, padB=horizontal?24:36, padT=16, padR=16;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const cats=data.categories, series=data.series;
  const stackedTotals = stacked ? cats.map((_,i)=>series.reduce((s,ser)=>s+ser.values[i],0)) : null;
  const maxV = stacked ? Math.max(...stackedTotals,1) : Math.max(...series.flatMap(s=>s.values),1);
  const n=cats.length;
  const groupW=(horizontal?plotH:plotW)/n;
  const barGap=groupW*0.2;
  const barW = stacked ? groupW-barGap : (groupW-barGap)/series.length;

  if(horizontal){
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
        {cats.map((c,i)=>{
          const y=padT+i*groupW+barGap/2;
          let xOffset=padL;
          return (
            <g key={c}>
              <text x={padL-8} y={y+barW/2+4} textAnchor="end" fontSize="11" fill={EX_TEXT.dim}>{c}</text>
              {series.map((s,si)=>{
                const w=(s.values[i]/maxV)*plotW;
                const bx=xOffset; if(!stacked) xOffset=bx; else xOffset+=w;
                const by=stacked? y : y+si*(barW);
                return <rect key={s.label} x={bx} y={stacked?y:by} width={Math.max(w,0)} height={stacked?barW:barW*0.8} fill={EXHIBIT_COLORS[si%EXHIBIT_COLORS.length]} rx="2"/>;
              })}
              {!stacked && series.map((s,si)=>(
                <text key={s.label} x={padL+(s.values[i]/maxV)*plotW+4} y={y+si*barW+barW*0.4+4} fontSize="10" fill={EX_TEXT.faint}>{exFmt(s.values[i], data.valueUnit)}</text>
              ))}
            </g>
          );
        })}
      </svg>
    );
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke={EX_TEXT.grid}/>
      {cats.map((c,i)=>{
        const gx=padL+i*groupW;
        let yStack=H-padB;
        return (
          <g key={c}>
            <text x={gx+groupW/2} y={H-padB+16} textAnchor="middle" fontSize="11" fill={EX_TEXT.dim}>{c}</text>
            {series.map((s,si)=>{
              const h=(s.values[i]/maxV)*plotH;
              const bx = stacked ? gx+barGap/2 : gx+barGap/2+si*barW;
              const by = stacked ? yStack-h : H-padB-h;
              if(stacked) yStack -= h;
              return <rect key={s.label} x={bx} y={by} width={barW} height={Math.max(h,0)} fill={EXHIBIT_COLORS[si%EXHIBIT_COLORS.length]} rx="2"/>;
            })}
          </g>
        );
      })}
    </svg>
  );
}

function ExLineChart({data}){
  const W=440,H=220,padL=36,padB=28,padT=16,padR=16;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const n=data.xLabels.length;
  const stepX = n>1 ? plotW/(n-1) : 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke={EX_TEXT.grid}/>
      {data.xLabels.map((x,i)=><text key={x} x={padL+i*stepX} y={H-padB+16} textAnchor="middle" fontSize="10" fill={EX_TEXT.dim}>{x}</text>)}
      {data.series.map((s,si)=>{
        // each series independently scaled 0-100% of plot height so differing units/scales still
        // show direction/shape clearly — describeExhibitForPrompt carries the exact numbers.
        const lo=Math.min(...s.values), hi=Math.max(...s.values);
        const range = hi-lo || 1;
        const pts = s.values.map((v,i)=>`${padL+i*stepX},${padT+plotH-((v-lo)/range)*plotH}`).join(' ');
        const color=EXHIBIT_COLORS[si%EXHIBIT_COLORS.length];
        return (
          <g key={s.label}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2"/>
            {s.values.map((v,i)=><circle key={i} cx={padL+i*stepX} cy={padT+plotH-((v-lo)/range)*plotH} r="3" fill={color}/>)}
          </g>
        );
      })}
      <foreignObject x={padL} y={0} width={plotW} height={14}>
        <div style={{display:'flex',gap:12,fontSize:10}}>
          {data.series.map((s,si)=><span key={s.label} style={{color:EXHIBIT_COLORS[si%EXHIBIT_COLORS.length]}}>● {s.label}{s.unit?` (${s.unit})`:''}</span>)}
        </div>
      </foreignObject>
    </svg>
  );
}

function ExWaterfallChart({data, unit}){
  const W=440,H=220,padL=16,padB=32,padT=16,padR=16;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const items=[{label:data.startLabel, value:data.startValue, isTotal:true}];
  let running=data.startValue;
  data.steps.forEach(s=>{ items.push({label:s.label, delta:s.delta}); running+=s.delta; });
  items.push({label:data.endLabel, value:running, isTotal:true});
  const allVals=[0, data.startValue, running, ...items.filter(i=>i.delta!=null).map((_,idx)=>{ let r=data.startValue; for(let j=0;j<=idx;j++) r+=data.steps[j].delta; return r; })];
  const maxV=Math.max(...allVals,1), minV=Math.min(...allVals,0);
  const scale = v => ((v-minV)/((maxV-minV)||1))*plotH;
  const n=items.length, bw=plotW/n*0.6, gap=plotW/n;
  let cum=0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke={EX_TEXT.grid}/>
      {items.map((it,i)=>{
        const x=padL+i*gap+gap*0.2;
        let y,h,color;
        if(it.isTotal){
          y=H-padB-scale(it.value); h=scale(it.value); color='#818cf8'; cum=it.value;
        } else {
          const before=cum; cum+=it.delta;
          y = H-padB-scale(Math.max(before,cum)); h=Math.abs(scale(cum)-scale(before))||1;
          color = it.delta>=0 ? '#34d399' : '#f87171';
        }
        return (
          <g key={it.label+i}>
            <rect x={x} y={y} width={bw} height={Math.max(h,1)} fill={color} rx="2"/>
            <text x={x+bw/2} y={y-4} textAnchor="middle" fontSize="10" fill={EX_TEXT.faint}>{exFmt(it.isTotal?it.value:it.delta, unit)}</text>
            <text x={x+bw/2} y={H-padB+14} textAnchor="middle" fontSize="9" fill={EX_TEXT.dim}>{it.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ExScatterChart({data}){
  const W=440,H=220,padL=40,padB=32,padT=16,padR=16;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const xs=data.points.map(p=>p.x), ys=data.points.map(p=>p.y);
  const xMin=Math.min(...xs,0), xMax=Math.max(...xs,1), yMin=Math.min(...ys,0), yMax=Math.max(...ys,1);
  const sx=v=>padL+((v-xMin)/((xMax-xMin)||1))*plotW;
  const sy=v=>padT+plotH-((v-yMin)/((yMax-yMin)||1))*plotH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto'}}>
      <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke={EX_TEXT.grid}/>
      <line x1={padL} y1={padT} x2={padL} y2={H-padB} stroke={EX_TEXT.grid}/>
      <text x={W/2} y={H-4} textAnchor="middle" fontSize="10" fill={EX_TEXT.dim}>{data.xLabel}</text>
      <text x={10} y={H/2} textAnchor="middle" fontSize="10" fill={EX_TEXT.dim} transform={`rotate(-90,10,${H/2})`}>{data.yLabel}</text>
      {data.points.map(p=>(
        <g key={p.label}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r="5" fill="#818cf8" opacity="0.85"/>
          <text x={sx(p.x)+7} y={sy(p.y)+3} fontSize="9" fill={EX_TEXT.faint}>{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

/* ---------- HTML/table exhibit types ---------- */

function ExTable({data}){
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead><tr>{data.columns.map(c=><th key={c.key} style={{textAlign:'left',padding:'6px 10px',color:EX_TEXT.faint,borderBottom:`1px solid ${EX_TEXT.grid}`,fontWeight:600}}>{c.label}</th>)}</tr></thead>
        <tbody>{data.rows.map((r,i)=>(
          <tr key={i}>{data.columns.map(c=><td key={c.key} style={{padding:'6px 10px',color:EX_TEXT.text,borderBottom:`1px solid ${EX_TEXT.grid}`}}>{exFmt(r[c.key], c.unit)}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}
function ExPnl({data}){
  return (
    <div>{data.rows.map((r,i)=>(
      <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 2px',fontSize:13,
        fontWeight:r.isTotal?700:r.isSubtotal?600:400,
        borderTop:r.isTotal?`1px solid ${EX_TEXT.grid}`:'none',
        color:r.isTotal?EX_TEXT.text:EX_TEXT.dim}}>
        <span>{r.label}</span><span>{exFmt(r.value, data.unit)}</span>
      </div>
    ))}</div>
  );
}
function ExMarketSizing({data}){
  return (
    <div>
      {data.segments.map((s,i)=>(
        <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 2px',fontSize:13,color:EX_TEXT.dim}}>
          <span>{s.label}</span><span>{exFmt(s.value, s.unit)}</span>
        </div>
      ))}
      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 2px',fontSize:13,fontWeight:700,borderTop:`1px solid ${EX_TEXT.grid}`,color:EX_TEXT.text}}>
        <span>{data.totalLabel}</span><span>{exFmt(data.totalValue)}</span>
      </div>
    </div>
  );
}
function ExCustomerSegmentation({data}){
  return (
    <div className="space-y-2">
      {data.segments.map((s,i)=>(
        <div key={i}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:EX_TEXT.text,marginBottom:2}}>
            <span>{s.label}</span><span>{s.sharePct}%</span>
          </div>
          <div style={{height:6,borderRadius:99,background:'rgba(255,255,255,0.06)'}}>
            <div style={{height:'100%',borderRadius:99,width:`${s.sharePct}%`,background:EXHIBIT_COLORS[i%EXHIBIT_COLORS.length]}}></div>
          </div>
          {s.metrics && <div style={{fontSize:11,color:EX_TEXT.faint,marginTop:2}}>{Object.entries(s.metrics).map(([k,v])=>`${k}: ${v}`).join(' · ')}</div>}
        </div>
      ))}
    </div>
  );
}
function ExOperationalMetrics({data}){
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {data.metrics.map((m,i)=>(
        <div key={i} style={{padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.03)'}}>
          <div style={{fontSize:11,color:EX_TEXT.faint}}>{m.label}</div>
          <div style={{fontSize:16,fontWeight:700,color:EX_TEXT.text}}>{exFmt(m.value, m.unit)}</div>
          {m.benchmark!=null && <div style={{fontSize:11,color:EX_TEXT.faint}}>benchmark {exFmt(m.benchmark, m.unit)}</div>}
        </div>
      ))}
    </div>
  );
}
function ExCapacityUtilization({data}){
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead><tr>
          <th style={{textAlign:'left',padding:'6px 10px',color:EX_TEXT.faint,borderBottom:`1px solid ${EX_TEXT.grid}`}}>Line</th>
          <th style={{textAlign:'left',padding:'6px 10px',color:EX_TEXT.faint,borderBottom:`1px solid ${EX_TEXT.grid}`}}>Utilization</th>
          <th style={{textAlign:'left',padding:'6px 10px',color:EX_TEXT.faint,borderBottom:`1px solid ${EX_TEXT.grid}`}}>Defects</th>
          <th style={{textAlign:'left',padding:'6px 10px',color:EX_TEXT.faint,borderBottom:`1px solid ${EX_TEXT.grid}`}}>Notes</th>
        </tr></thead>
        <tbody>{data.lines.map((l,i)=>(
          <tr key={i}>
            <td style={{padding:'6px 10px',color:EX_TEXT.text,borderBottom:`1px solid ${EX_TEXT.grid}`}}>{l.label}</td>
            <td style={{padding:'6px 10px',color:EX_TEXT.dim,borderBottom:`1px solid ${EX_TEXT.grid}`}}>{l.utilizationPct}%</td>
            <td style={{padding:'6px 10px',color:EX_TEXT.dim,borderBottom:`1px solid ${EX_TEXT.grid}`}}>{l.defectPct}%</td>
            <td style={{padding:'6px 10px',color:EX_TEXT.faint,borderBottom:`1px solid ${EX_TEXT.grid}`,fontSize:12}}>{l.notes||''}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
function ExMemo({data}){
  return <div style={{fontSize:13,lineHeight:1.6,color:EX_TEXT.dim,whiteSpace:'pre-line'}}>{data.body}</div>;
}

/* ---------- dispatcher ---------- */

function ExhibitBody({exhibit}){
  const d=exhibit.data;
  switch(exhibit.type){
    case 'table': return <ExTable data={d}/>;
    case 'bar': return <ExBarChart data={d}/>;
    case 'hbar': return <ExBarChart data={d} horizontal/>;
    case 'stackedBar': return <ExBarChart data={d} stacked/>;
    case 'line': return <ExLineChart data={d}/>;
    case 'waterfall': return <ExWaterfallChart data={d} unit={exhibit.unit}/>;
    case 'scatter': return <ExScatterChart data={d}/>;
    case 'pnl': return <ExPnl data={d}/>;
    case 'marketSizing': return <ExMarketSizing data={d}/>;
    case 'customerSegmentation': return <ExCustomerSegmentation data={d}/>;
    case 'operationalMetrics': return <ExOperationalMetrics data={d}/>;
    case 'capacityUtilization': return <ExCapacityUtilization data={d}/>;
    case 'memo': return <ExMemo data={d}/>;
    default: return <div style={{fontSize:12,color:EX_TEXT.faint}}>Unsupported exhibit type: {exhibit.type}</div>;
  }
}

// The ONE exhibit component — Learn, Drills, Cases, and Review all render exhibits through this,
// with only `mode` differing by context (panel = inline card, compact = small inline reference,
// focus = full-attention modal).
function ExhibitViewer({exhibit, mode='panel', onExpand, onClose}){
  if(!exhibit) return null;
  if(mode==='compact'){
    return (
      <button onClick={onExpand} className="text-left w-full rounded-lg p-2" style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${EX_TEXT.grid}`}}>
        <div style={{fontSize:11,color:EX_TEXT.faint}}>Exhibit</div>
        <div style={{fontSize:12,color:EX_TEXT.text}}>{exhibit.title}</div>
      </button>
    );
  }
  const isFocus = mode==='focus';
  const content = (
    <div className="glass rounded-xl border-subtle" style={{padding:16}}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div style={{fontSize:11,color:EX_TEXT.faint,textTransform:'uppercase',letterSpacing:'0.04em'}}>Exhibit</div>
          <div style={{fontSize:15,fontWeight:600,color:EX_TEXT.text}}>{exhibit.title}</div>
          {exhibit.subtitle && <div style={{fontSize:12,color:EX_TEXT.faint}}>{exhibit.subtitle}</div>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {!isFocus && onExpand && <button onClick={onExpand} className="text-xs px-2 py-1 rounded" style={{color:'#818cf8',background:'rgba(99,102,241,0.1)'}}>Expand</button>}
          {isFocus && onClose && <button onClick={onClose} className="text-xs px-2 py-1 rounded" style={{color:EX_TEXT.faint}}>Close</button>}
        </div>
      </div>
      <ExhibitBody exhibit={exhibit}/>
      {exhibit.footnote && <div style={{fontSize:11,color:EX_TEXT.faint,marginTop:8,fontStyle:'italic'}}>{exhibit.footnote}</div>}
      {exhibit.sourceNote && <div style={{fontSize:11,color:EX_TEXT.faint,marginTop:4}}>Source: {exhibit.sourceNote}</div>}
    </div>
  );
  if(!isFocus) return content;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative w-full" style={{maxWidth:640}}>{content}</div>
    </div>
  );
}
