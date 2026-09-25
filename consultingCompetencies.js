// consultingCompetencies.js
// The ONE canonical Consulting competency model. Every Learn module, drill, case debrief,
// Unprompted response, and Tracker tag maps into this — no parallel taxonomies.
// Plain classic script, loaded before consultingContent/*, consultingEngine.js, and App.jsx
// (all share one global scope in the browser — see index.html).

const PRIMARY_COMPETENCIES = [
  {id:'problemDefinition', label:'Problem Definition'},
  {id:'structuring', label:'Structuring'},
  {id:'prioritization', label:'Prioritization'},
  {id:'hypothesisDriven', label:'Hypothesis-Driven Thinking'},
  {id:'quantitativeReasoning', label:'Quantitative Reasoning'},
  {id:'exhibitInterpretation', label:'Exhibit Interpretation'},
  {id:'businessJudgment', label:'Business Judgment'},
  {id:'ideation', label:'Ideation'},
  {id:'synthesis', label:'Synthesis'},
  {id:'recommendation', label:'Recommendation'},
  {id:'communication', label:'Communication'},
  {id:'caseManagement', label:'Case Management'},
];
const FIT_COMPETENCIES = [
  {id:'storyStructure', label:'Story Structure'},
  {id:'specificity', label:'Specificity'},
  {id:'personalOwnership', label:'Personal Ownership'},
  {id:'impact', label:'Impact'},
  {id:'reflection', label:'Reflection'},
  {id:'fitCommunication', label:'Communication'},
  {id:'authenticity', label:'Authenticity'},
  {id:'handlingFollowUps', label:'Handling Follow-Ups'},
];

const PRIMARY_COMPETENCY_IDS = PRIMARY_COMPETENCIES.map(c=>c.id);
const FIT_COMPETENCY_IDS = FIT_COMPETENCIES.map(c=>c.id);
const PRIMARY_COMPETENCY_LABELS = Object.fromEntries(PRIMARY_COMPETENCIES.map(c=>[c.id,c.label]));
const FIT_COMPETENCY_LABELS = Object.fromEntries(FIT_COMPETENCIES.map(c=>[c.id,c.label]));

// Old C_DIMS string (App.jsx, pre-rebuild) -> new canonical id. Lets every historically-
// persisted consulting.drills[]/errorLog[] record keep reading correctly with zero migration.
const LEGACY_DIMENSION_ALIAS = {
  Structuring:'structuring', Ideation:'ideation', Quant:'quantitativeReasoning', Charts:'exhibitInterpretation',
  BusinessJudgment:'businessJudgment', Hypothesis:'hypothesisDriven', Prioritization:'prioritization',
  Synthesis:'synthesis', Communication:'communication', CaseManagement:'caseManagement',
};
function migrateConsultingDimension(id){
  return LEGACY_DIMENSION_ALIAS[id] || id;
}
function primaryCompetencyLabel(id){
  return PRIMARY_COMPETENCY_LABELS[migrateConsultingDimension(id)] || id;
}
