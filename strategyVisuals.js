// strategyVisuals.js
// ONE reusable visual schema for the Strategy tab's lesson content — no per-lesson custom
// diagrams, no charting library (hand-rolled inline SVG via strategyVisualRenderer.jsx,
// consistent with this app's zero-new-runtime-deps posture; mirrors consultingExhibits.js).
// Plain classic script, loaded before strategyContent.js.
//
// Visual shape: {type, title?, ...type-specific fields}
// Seven types this pass — the exact subset needed to cover the Pass-B gold-standard lessons.
// Adding a new instance is pure data; adding a new TYPE means one schema case here + one
// renderer case in strategyVisualRenderer.jsx — no other file changes.

const STRATEGY_VISUAL_TYPES = ['causal-chain','value-wedge','activity-map','decision-tree','bar-compare','tradeoff-scale','2x2-matrix'];

function validateVisualSchema(v){
  const errors = [];
  if(!v || typeof v!=='object'){ return {valid:false, errors:['visual must be an object']}; }
  if(!STRATEGY_VISUAL_TYPES.includes(v.type)) errors.push('invalid type: '+v.type);
  const numOk = x => typeof x==='number' && !isNaN(x);
  switch(v.type){
    case 'causal-chain':
      if(!Array.isArray(v.nodes) || v.nodes.length<2) errors.push('causal-chain: needs >=2 nodes');
      else v.nodes.forEach((n,i)=>{ if(!n.label) errors.push(`causal-chain: node ${i} missing label`); });
      break;
    case 'value-wedge':
      if(!v.wtp || !numOk(v.wtp.value)) errors.push('value-wedge: wtp.value required (numeric)');
      if(!v.soc || !numOk(v.soc.value)) errors.push('value-wedge: soc.value required (numeric)');
      if(!v.price || !numOk(v.price.value)) errors.push('value-wedge: price.value required (numeric)');
      if(v.wtp && v.soc && numOk(v.wtp.value) && numOk(v.soc.value) && v.wtp.value < v.soc.value) errors.push('value-wedge: wtp.value should be >= soc.value');
      break;
    case 'activity-map':
      if(!v.hub || !v.hub.label) errors.push('activity-map: hub.label required');
      if(!Array.isArray(v.activities) || v.activities.length<3) errors.push('activity-map: needs >=3 activities');
      break;
    case 'decision-tree':
      if(!v.root || !v.root.label) errors.push('decision-tree: root.label required');
      if(!Array.isArray(v.branches) || v.branches.length<2) errors.push('decision-tree: needs >=2 branches');
      else v.branches.forEach((b,i)=>{
        if(!numOk(b.prob)) errors.push(`decision-tree: branch ${i} prob required (numeric)`);
        if(!numOk(b.payoff)) errors.push(`decision-tree: branch ${i} payoff required (numeric)`);
      });
      if(Array.isArray(v.branches) && v.branches.length){
        const sum = v.branches.reduce((s,b)=>s+(numOk(b.prob)?b.prob:0),0);
        if(Math.abs(sum-1) > 0.02) errors.push('decision-tree: branch probabilities must sum to ~1, got '+sum.toFixed(2));
      }
      break;
    case 'bar-compare':
      if(!Array.isArray(v.categories) || !v.categories.length) errors.push('bar-compare: categories required');
      if(!Array.isArray(v.series) || !v.series.length) errors.push('bar-compare: series required');
      else v.series.forEach(s=>{
        if(!Array.isArray(s.values) || s.values.length!==(v.categories||[]).length) errors.push(`bar-compare: series "${s.label}" values length must match categories length`);
      });
      break;
    case 'tradeoff-scale':
      if(!v.leftLabel || !v.rightLabel) errors.push('tradeoff-scale: leftLabel/rightLabel required');
      if(!Array.isArray(v.points) || !v.points.length) errors.push('tradeoff-scale: points required');
      else v.points.forEach(p=>{ if(!numOk(p.position) || p.position<0 || p.position>1) errors.push(`tradeoff-scale: point "${p.label}" needs position 0-1`); });
      break;
    case '2x2-matrix':
      if(!v.xAxis || !v.xAxis.left || !v.xAxis.right) errors.push('2x2-matrix: xAxis.left/right required');
      if(!v.yAxis || !v.yAxis.top || !v.yAxis.bottom) errors.push('2x2-matrix: yAxis.top/bottom required');
      if(!Array.isArray(v.points) || !v.points.length) errors.push('2x2-matrix: points required');
      else v.points.forEach(p=>{
        if(!numOk(p.x) || p.x<0 || p.x>1) errors.push(`2x2-matrix: point "${p.label}" needs x 0-1`);
        if(!numOk(p.y) || p.y<0 || p.y>1) errors.push(`2x2-matrix: point "${p.label}" needs y 0-1`);
      });
      break;
    default: break;
  }
  return {valid: errors.length===0, errors};
}
