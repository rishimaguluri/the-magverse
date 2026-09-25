// consultingExhibits.js
// ONE exhibit schema + pure helpers, shared by Learn, Drills, Cases, and Review — no per-feature
// chart systems. Plain classic script, loaded early (before content/case/engine files).
//
// Exhibit shape: {id, type, title, subtitle?, sourceNote?, footnote?, unit?, revealPolicy, data}
// revealPolicy: 'PROACTIVELY_GIVEN' | 'AVAILABLE_ON_REQUEST' | 'NOT_AVAILABLE' | 'IRRELEVANT'
// `data` is type-specific — see EXHIBIT_TYPES below and validateExhibitSchema for exact shapes.

const EXHIBIT_TYPES = ['table','bar','hbar','stackedBar','line','waterfall','scatter','pnl','marketSizing','customerSegmentation','operationalMetrics','capacityUtilization','memo'];
const REVEAL_POLICIES = ['PROACTIVELY_GIVEN','AVAILABLE_ON_REQUEST','NOT_AVAILABLE','IRRELEVANT'];

function validateExhibitSchema(ex){
  const errors=[];
  if(!ex.id) errors.push('missing id');
  if(!ex.title) errors.push('missing title');
  if(!EXHIBIT_TYPES.includes(ex.type)) errors.push('invalid type: '+ex.type);
  if(!REVEAL_POLICIES.includes(ex.revealPolicy)) errors.push('invalid revealPolicy: '+ex.revealPolicy);
  if(!ex.data){ errors.push('missing data'); return {valid:false, errors}; }
  const d=ex.data;
  const numOk=v=>typeof v==='number'&&!isNaN(v);
  switch(ex.type){
    case 'table':
      if(!Array.isArray(d.columns)||!d.columns.length) errors.push('table: columns required');
      if(!Array.isArray(d.rows)||!d.rows.length) errors.push('table: rows required');
      else if(Array.isArray(d.columns)) { const keys=d.columns.map(c=>c.key); d.rows.forEach((r,i)=>keys.forEach(k=>{ if(!(k in r)) errors.push(`table: row ${i} missing column "${k}"`); })); }
      break;
    case 'bar': case 'hbar': case 'stackedBar':
      if(!Array.isArray(d.categories)||!d.categories.length) errors.push(ex.type+': categories required');
      if(!Array.isArray(d.series)||!d.series.length) errors.push(ex.type+': series required');
      else d.series.forEach(s=>{
        if(!Array.isArray(s.values)||s.values.length!==d.categories.length) errors.push(`${ex.type}: series "${s.label}" values length must match categories length`);
        else if(s.values.some(v=>!numOk(v))) errors.push(`${ex.type}: series "${s.label}" has a non-numeric/NaN value`);
      });
      break;
    case 'line':
      if(!Array.isArray(d.xLabels)||!d.xLabels.length) errors.push('line: xLabels required');
      if(!Array.isArray(d.series)||!d.series.length) errors.push('line: series required');
      else d.series.forEach(s=>{
        if(!Array.isArray(s.values)||s.values.length!==d.xLabels.length) errors.push(`line: series "${s.label}" values length must match xLabels length`);
        else if(s.values.some(v=>!numOk(v))) errors.push(`line: series "${s.label}" has a non-numeric/NaN value`);
      });
      break;
    case 'waterfall':
      if(!numOk(d.startValue)) errors.push('waterfall: startValue required (numeric)');
      if(!Array.isArray(d.steps)||!d.steps.length) errors.push('waterfall: steps required');
      else d.steps.forEach(s=>{ if(!numOk(s.delta)) errors.push(`waterfall: step "${s.label}" delta must be numeric`); });
      break;
    case 'scatter':
      if(!Array.isArray(d.points)||!d.points.length) errors.push('scatter: points required');
      else d.points.forEach(p=>{ if(!numOk(p.x)||!numOk(p.y)) errors.push(`scatter: point "${p.label}" needs numeric x/y`); });
      break;
    case 'pnl':
      if(!Array.isArray(d.rows)||!d.rows.length) errors.push('pnl: rows required');
      else d.rows.forEach(r=>{ if(!numOk(r.value)) errors.push(`pnl: row "${r.label}" value must be numeric`); });
      break;
    case 'marketSizing':
      if(!Array.isArray(d.segments)||!d.segments.length) errors.push('marketSizing: segments required');
      if(!numOk(d.totalValue)) errors.push('marketSizing: totalValue required (numeric)');
      break;
    case 'customerSegmentation':
      if(!Array.isArray(d.segments)||!d.segments.length) errors.push('customerSegmentation: segments required');
      else { const sum=d.segments.reduce((s,x)=>s+(x.sharePct||0),0); if(Math.abs(sum-100)>1.5) errors.push('customerSegmentation: sharePct should sum to ~100, got '+sum); }
      break;
    case 'operationalMetrics':
      if(!Array.isArray(d.metrics)||!d.metrics.length) errors.push('operationalMetrics: metrics required');
      break;
    case 'capacityUtilization':
      if(!Array.isArray(d.lines)||!d.lines.length) errors.push('capacityUtilization: lines required');
      break;
    case 'memo':
      if(!d.body||!d.body.trim()) errors.push('memo: body required');
      break;
  }
  return {valid:errors.length===0, errors};
}

function validateExhibitSetUnique(exhibits){
  const ids=(exhibits||[]).map(e=>e.id);
  const dupes=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
  return {valid:dupes.length===0, dupes};
}

function fmtExhibitNum(v, unit){
  if(typeof v!=='number') return String(v);
  const s = Math.abs(v)>=1000 ? v.toLocaleString('en-US') : String(v);
  if(unit==='$') return '$'+s;
  if(unit) return s+unit;
  return s;
}

// The ONLY form the AI interviewer ever receives an exhibit in — deterministic plain text, never
// raw JSON. This is what bounds what the model can say: it cannot invent a number that isn't
// printed here, because this text (not the exhibit object) is what gets pasted into the prompt.
function describeExhibitForPrompt(ex){
  const d=ex.data||{}; const lines=[`Exhibit "${ex.title}" (${ex.type})`];
  if(ex.subtitle) lines.push(ex.subtitle);
  switch(ex.type){
    case 'table':
      lines.push((d.columns||[]).map(c=>c.label).join(' | '));
      (d.rows||[]).forEach(r=>lines.push((d.columns||[]).map(c=>fmtExhibitNum(r[c.key], c.unit)).join(' | ')));
      break;
    case 'bar': case 'hbar': case 'stackedBar':
      (d.series||[]).forEach(s=>lines.push(`${s.label}: `+(d.categories||[]).map((c,i)=>`${c}=${fmtExhibitNum(s.values[i], d.valueUnit)}`).join(', ')));
      break;
    case 'line':
      (d.series||[]).forEach(s=>lines.push(`${s.label}: `+(d.xLabels||[]).map((x,i)=>`${x}=${fmtExhibitNum(s.values[i], s.unit)}`).join(', ')));
      break;
    case 'waterfall': {
      lines.push(`${d.startLabel}=${fmtExhibitNum(d.startValue, ex.unit)}`);
      let running=d.startValue;
      (d.steps||[]).forEach(s=>{ running+=s.delta; lines.push(`${s.label}: ${s.delta>=0?'+':''}${fmtExhibitNum(s.delta, ex.unit)} (running total ${fmtExhibitNum(running, ex.unit)})`); });
      lines.push(`${d.endLabel}=${fmtExhibitNum(running, ex.unit)}`);
      break;
    }
    case 'scatter':
      lines.push(`${d.xLabel} vs ${d.yLabel}: `+(d.points||[]).map(p=>`${p.label}(${p.x}, ${p.y})`).join(', '));
      break;
    case 'pnl':
      (d.rows||[]).forEach(r=>lines.push(`${r.label}: ${fmtExhibitNum(r.value, d.unit)}${r.isTotal?' (TOTAL)':r.isSubtotal?' (subtotal)':''}`));
      break;
    case 'marketSizing':
      (d.segments||[]).forEach(s=>lines.push(`${s.label}: ${fmtExhibitNum(s.value, s.unit)}`));
      lines.push(`${d.totalLabel}: ${fmtExhibitNum(d.totalValue)}`);
      break;
    case 'customerSegmentation':
      (d.segments||[]).forEach(s=>lines.push(`${s.label}: ${s.sharePct}% share`+(s.metrics?', '+Object.entries(s.metrics).map(([k,v])=>`${k}=${v}`).join(', '):'')));
      break;
    case 'operationalMetrics':
      (d.metrics||[]).forEach(m=>lines.push(`${m.label}: ${fmtExhibitNum(m.value, m.unit)}`+(m.benchmark!=null?` (benchmark ${fmtExhibitNum(m.benchmark, m.unit)})`:'')));
      break;
    case 'capacityUtilization':
      (d.lines||[]).forEach(l=>lines.push(`${l.label}: ${l.utilizationPct}% utilization, ${l.defectPct}% defects`+(l.notes?` — ${l.notes}`:'')));
      break;
    case 'memo':
      lines.push(d.body);
      break;
  }
  if(ex.sourceNote) lines.push('Source: '+ex.sourceNote);
  return lines.join('\n');
}

// Backs the Drills "Chart Interpretation" type — real exhibits instead of text-described charts.
const DRILL_EXHIBITS = {
  'drill-chart-1': {
    id:'drill-chart-1', type:'line', title:'Quarterly Revenue by Product', revealPolicy:'PROACTIVELY_GIVEN', unit:'$M',
    data:{ xLabels:['Q1','Q2','Q3','Q4'], series:[
      {label:'Product A', values:[4,4.5,4.8,3.9]},
      {label:'Product B', values:[2,2.8,3.9,5.2]},
    ]}, sourceNote:'Internal financial reporting.',
  },
  'drill-chart-2': {
    id:'drill-chart-2', type:'line', title:'COGS Margin Trend', revealPolicy:'PROACTIVELY_GIVEN', unit:'%',
    data:{ xLabels:['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8'], series:[
      {label:'COGS Margin', values:[42,43.5,45,46.5,48,49,50,51]},
    ]}, sourceNote:'Gross revenue grew 18% over the same 8-quarter period (not plotted here).',
  },
  'drill-chart-3': {
    id:'drill-chart-3', type:'line', title:'Customer Acquisition Cost vs. New Customer Volume', revealPolicy:'PROACTIVELY_GIVEN',
    data:{ xLabels:['Q1','Q2','Q3','Q4','Q5','Q6'], series:[
      {label:'CAC', values:[50,58,66,72,78,80], unit:'$'},
      {label:'New Customers', values:[20,19,17,16.5,16,16], unit:'K'},
    ]}, footnote:'Two series on independent scales — read exact values from the legend, not pixel height.', sourceNote:'CAC rose ~60% total; new customer volume fell ~20% over the same period.',
  },
};
