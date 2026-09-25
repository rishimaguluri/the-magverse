// consultingContent/_base.js
// Declares the 12 Learn tracks + the shared CONSULTING_MODULES registry that every
// consultingContent/*.js file pushes into. Loaded first among the content files (see
// index.html) so later files can safely CONSULTING_MODULES.push(...).
//
// Module shape (every field the user's spec requires):
// {id, trackId, title, estimatedMinutes, primaryCompetency, secondaryCompetencies:[],
//  prerequisites:[], concepts:[], thinkFirst:{prompt,sampleAnswerNote}, coreIdea,
//  badExample:{text,why}, strongExample:{text,why}, explanation, exercise:{...},
//  commonMistakes:[], reusableRule, nextDrillId, relatedCaseIds:[], relatedFrameworkIds:[]}

const CONSULTING_TRACKS = [
  {id:'fundamentals', num:1, name:'Case Fundamentals', status:'authored'},
  {id:'structuring', num:2, name:'Structuring', status:'authored'},
  {id:'quant', num:3, name:'Quantitative Reasoning', status:'authored'},
  {id:'exhibits', num:4, name:'Exhibit Interpretation', status:'authored'},
  {id:'businessJudgment', num:5, name:'Business Judgment', status:'authored'},
  {id:'ideation', num:6, name:'Ideation / Brainstorming', status:'authored'},
  {id:'synthesis', num:7, name:'Synthesis', status:'authored'},
  {id:'recommendation', num:8, name:'Recommendations', status:'authored'},
  {id:'caseManagement', num:9, name:'Case Management', status:'authored'},
  {id:'caseTypes', num:10, name:'Case Types', status:'placeholder'},
  {id:'fit', num:11, name:'Fit / Behavioral', status:'authored'},
  {id:'interviewExecution', num:12, name:'Interview Execution', status:'placeholder'},
];

const CONSULTING_MODULES = [];
