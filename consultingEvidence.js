// consultingEvidence.js
// ONE evidence-writing pathway for Cases (full adoption) and an additive pathway for Learn/
// Unprompted (alongside their existing Pass-1 writes, which stay the source of truth for their
// own derived states — see consultingLearnPanel.jsx's recordAttempt). Mastery is DERIVED, never
// stored directly, mirroring consultingEngine.js's deriveModuleState discipline. Plain script.

function recordConsultingEvidence({sourceType, sourceId, competency, score, observation, timestamp, metadata}, setConsulting){
  const id = uid('ev');
  const cid = migrateConsultingDimension(competency);
  const entry = {id, sourceType, sourceId, competency:cid, score, observation:observation||'', timestamp:timestamp||Date.now(), metadata:metadata||{}};
  setConsulting(c=>({...c, evidenceLog:[...(c.evidenceLog||[]), entry]}));
  return entry;
}

// Rolling-average-of-last-5 derivation — same transparency discipline as deriveModuleState:
// one sentence, explainable, no black box. Requires at least 2 data points before committing to
// a WEAK/STRONG label (a single rep is never enough evidence either way).
function deriveCompetencyMastery(evidenceLog, competencyId){
  const rows=(evidenceLog||[]).filter(e=>migrateConsultingDimension(e.competency)===competencyId).slice(-5);
  if(rows.length<2) return 'INSUFFICIENT_DATA';
  const avg=rows.reduce((s,r)=>s+r.score,0)/rows.length;
  if(avg>=7 && rows.length>=3) return 'STRONG';
  if(avg>=5) return 'DEVELOPING';
  return 'WEAK';
}
