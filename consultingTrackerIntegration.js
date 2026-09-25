// consultingTrackerIntegration.js
// Automatic Tracker draft on case completion + external-case AI feedback extraction (paste ->
// propose -> user must confirm, nothing auto-applies). Plain classic script.

// Fires once when a case reaches 'done' — pre-filled, still fully user-editable in the Tracker
// table (no separate review-modal step). Additive fields (firmStyle/durationMin/mode/
// whatIDidWell/whatIStruggledWith/nextCaseFocus/transcriptCaseId) extend the original Tracker
// entry shape — existing rows simply don't have them, and the Tracker UI renders them only when
// present, so this is backward compatible with every pre-Pass-2 entry.
function buildAutoTrackerDraft(finishedCase, caseContent, elapsedMs){
  const scores = Object.entries(finishedCase.competencyScores||{});
  const numericScores = scores.map(([,v])=>v).filter(v=>typeof v==='number');
  const rating = numericScores.length ? Math.round(numericScores.reduce((a,b)=>a+b,0)/numericScores.length) : 5;
  const wellTags = scores.filter(([,v])=>v>=7).map(([k])=>PRIMARY_COMPETENCY_LABELS[migrateConsultingDimension(k)]||k);
  const struggleTags = scores.filter(([,v])=>v>0&&v<=4).map(([k])=>PRIMARY_COMPETENCY_LABELS[migrateConsultingDimension(k)]||k);
  const durationMin = elapsedMs!=null ? Math.round(elapsedMs/60000) : null;
  return {
    id: uid('cl'), date: new Date().toISOString().slice(0,10),
    caseName: finishedCase.title, source:'Magverse', caseType: (caseContent&&caseContent.caseType) || finishedCase.type,
    industry: (caseContent&&caseContent.industry) || finishedCase.industry || '',
    mainFeedback: finishedCase.debriefInsight || '',
    wellTags, struggleTags, rating,
    takeaway: finishedCase.topNextCaseFocus || '',
    magverseCaseId: finishedCase.id, createdAt: Date.now(),
    firmStyle: finishedCase.firmStyle || 'general', durationMin, mode: finishedCase.mode || 'practice',
    whatIDidWell: (finishedCase.strengths||[]).join(' '), whatIStruggledWith: (finishedCase.weaknesses||[]).join(' '),
    nextCaseFocus: finishedCase.topNextCaseFocus || '',
    transcriptCaseId: finishedCase.id,
  };
}

// Conservative by design — only proposes a competency if the pasted text actually supports it,
// and the result is always a PROPOSAL the candidate reviews before anything touches the learner
// model (Part 25: never silently auto-apply).
function buildExternalFeedbackExtractionPrompt(){
  return `You are a case coach helping a candidate log feedback from an external practice case (not run on this platform — e.g. RocketBlocks, a case partner, a club mock). The candidate will paste raw feedback text from a partner, coach, or peer. Extract: (1) which competencies were praised as STRENGTHS, (2) which competencies need DEVELOPMENT, (3) one specific NEXT FOCUS behavior. Use ONLY these canonical competency labels: ${PRIMARY_COMPETENCIES.map(c=>c.label).join(', ')}. Only include a competency if the feedback text actually supports it — do not guess or pad the list to look complete. Return JSON: {"strengths":["Competency Label"],"developmentAreas":["Competency Label"],"nextFocus":"one specific sentence","confidence":"HIGH|MEDIUM|LOW"}. This is a proposal the candidate will review and can edit before anything is saved.`;
}

function mapExtractedToTrackerFields(extracted, pastedText){
  return {
    wellTags: extracted.strengths||[], struggleTags: extracted.developmentAreas||[],
    mainFeedback: pastedText||'', takeaway: extracted.nextFocus||'',
  };
}
