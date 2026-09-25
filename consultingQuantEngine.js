// consultingQuantEngine.js
// ONE deterministic quant engine — Learn's numeric exercises AND Case quantProblems both run
// through checkQuantAnswer(). Math correctness is always deterministic; AI is only ever asked to
// grade the SEPARATE concern of business-implication communication (see
// buildQualitativeQuantFeedbackPrompt), never arithmetic. Plain classic script, loaded early.

// Convention for every authored problem in this app: correctAnswer/toleranceAbs are always in
// RAW magnitude (e.g. 4200000, not "4.2" meaning millions) — never a shorthand scale. This keeps
// grading unambiguous. To still accept a user answering "4.2" or "$4.2 million" for a raw target
// of 4,200,000, checkQuantAnswer additionally tries the parsed value scaled by 1e3/1e6/1e9 (only
// for targets >=1000, so small percentage/ratio targets are never affected) — a deliberately
// permissive design per "do not grade on brittle string equality," not a precision bug.

function parseNumericAnswer(raw){
  if(raw==null) return {value:null, isRange:false, raw};
  let s = String(raw).trim();
  if(!s) return {value:null, isRange:false, raw};

  // range: "40-45" / "40 to 45" -> midpoint (estimation-style answers)
  const looksLikeRange = /^\$?-?[\d,.]+\s*(?:-|to|–|—)\s*\$?-?[\d,.]+/i.test(s);
  if(looksLikeRange){
    const parts = s.split(/-|to|–|—/i).map(p=>p.trim()).filter(Boolean);
    if(parts.length===2){
      const lo = parseNumericAnswer(parts[0]).value;
      const hi = parseNumericAnswer(parts[1]).value;
      if(lo!=null && hi!=null) return {value:(lo+hi)/2, isRange:true, rangeLo:Math.min(lo,hi), rangeHi:Math.max(lo,hi), raw};
    }
  }

  let negative = false;
  const paren = s.match(/^\(([^)]+)\)$/); // accounting-style negative: (12) -> -12
  if(paren){ negative = true; s = paren[1]; }

  s = s.replace(/[$,\s]/g,'');
  let mult = 1;
  const suffixMatch = s.match(/(million|thousand|billion|mm|bn|[kmb])$/i);
  if(suffixMatch){
    const suf = suffixMatch[1].toLowerCase();
    if(suf==='k'||suf==='thousand') mult=1e3;
    else if(suf==='m'||suf==='mm'||suf==='million') mult=1e6;
    else if(suf==='b'||suf==='bn'||suf==='billion') mult=1e9;
    s = s.slice(0, s.length-suffixMatch[1].length);
  }
  s = s.replace(/%$/,'');
  if(s.startsWith('-')){ negative = true; s = s.slice(1); }

  const num = parseFloat(s);
  if(isNaN(num)) return {value:null, isRange:false, raw};
  return {value:(negative?-num:num)*mult, isRange:false, raw};
}

function checkQuantAnswer(problem, userAnswer){
  const parsed = parseNumericAnswer(userAnswer);
  const target = problem.correctAnswer;
  const unit = problem.unit||'';
  const modelAnswer = problem.modelAnswer||'';
  if(parsed.value==null) return {correct:false, parsed:null, target, unit, modelAnswer, reason:'Could not read a number from your answer.'};

  const withinTol = v => problem.toleranceAbs!=null
    ? Math.abs(v-target) <= problem.toleranceAbs
    : Math.abs(v-target) <= Math.abs(target) * ((problem.tolerancePct!=null?problem.tolerancePct:5)/100);

  const candidates = Math.abs(target)>=1000 ? [parsed.value, parsed.value*1e3, parsed.value*1e6, parsed.value*1e9] : [parsed.value];
  const correct = candidates.some(withinTol);
  return {correct, parsed:parsed.value, target, unit, modelAnswer, isRangeAnswer:parsed.isRange};
}

// Named alias — case quantProblems[] and Learn exercise:{type:'numeric'} both call the identical
// function above; this exists only so call sites read clearly ("evaluate this case's quant
// moment") without implying a second engine.
function evaluateQuantProblem(quantProblem, userAnswer){
  return checkQuantAnswer(quantProblem, userAnswer);
}

// Math correctness (above) and math COMMUNICATION are graded separately. This builder is used
// only when a problem is marked requiresSoWhat — the AI is told the arithmetic is ALREADY graded
// and must not re-judge it, only the business-implication explanation that follows it.
function buildQualitativeQuantFeedbackPrompt(problem, checkResult){
  return `You are a case coach. The candidate's arithmetic has ALREADY been graded deterministically — correct: ${checkResult.correct}. Do NOT re-judge whether the number is right. Your ONLY job is to grade the business-implication explanation that follows the calculation: did they explain what the number means for the case, not just restate it? Return JSON: {"score":0,"feedback":"1-2 sentences, specific"}. Score 1-10: high if they connect the number to a concrete implication for the case objective; low if they only restated the figure ("the answer is X") with no "so what."`;
}
