// bainDiligenceContent.js
// Content for the "PE Diligence Case" mode inside Bain Capital Sprint -> Cases (a second,
// faster, candidate-led case format alongside the existing "Investment Case" mode).
//
// IMPORTANT — source discipline: this practice format is modeled on a candidate-led PE
// diligence case style seen in EXTERNAL interview-prep material (see bainSprintContent.js's
// practiceSources entry). It is NOT an official Bain Capital case. Every case below is
// ORIGINAL synthetic content — no dialogue, numbers, or structure copied from any source.
//
// Schema deliberately mirrors consultingCaseContent.js's proven shape (hiddenFacts/exhibits/
// revealPolicy/quantProblems/gradingEvidence) so the reused engine pieces (resolveCaseReveal,
// checkQuantAnswer, validateExhibitSchema, describeExhibitForPrompt) work unmodified. Two
// differences from the Consulting schema, both intentional:
//   - no `objective` block / objective phase (PE_CASE_STATES has no 'objective' state — this
//     format is candidate-led from the opening, not objective-gated like Consulting cases)
//   - no `supportedFirmStyles` (one fixed interviewer persona, no firm-style selector)
// Plain classic script. Load after the consulting* files (reuses their exhibit schema) and
// before bainDiligenceEngine.js.

const PE_DILIGENCE_CASES = [
  {
    id: 'peakform-fitness',
    label: 'Consumer Services',
    title: 'PeakForm Studios — A Premium Fitness Roll-Up',
    industry: 'Consumer Services — Fitness & Wellness',
    difficulty: 'Foundational',
    estimatedMin: 25,
    prompt: 'PeakForm Studios is a regional premium fitness chain with 40 locations across the Mid-Atlantic. The founder is exploring a sale. Our fund is evaluating whether to acquire PeakForm. Walk me through how you\'d think about this, and tell me whether you\'d recommend we proceed.',
    hiddenFacts: [
      { id: 'pf-f1', category: 'financials', fact: 'PeakForm has 40 studios, each averaging $1.8M in annual revenue — $72M total revenue.', revealPolicy: 'PROACTIVELY_GIVEN' },
      { id: 'pf-f2', category: 'financials', fact: 'Current blended EBITDA margin across the chain is 18%.', revealPolicy: 'PROACTIVELY_GIVEN' },
      { id: 'pf-f3', category: 'deal', fact: 'The founder is asking for a purchase price of 9.0x trailing EBITDA.', revealPolicy: 'PROACTIVELY_GIVEN' },
      { id: 'pf-f4', category: 'deal', fact: 'Comparable premium-fitness-chain transactions over the past two years have closed in the 7.0x-8.0x EBITDA range.', revealPolicy: 'AVAILABLE_ON_REQUEST' },
      { id: 'pf-f5', category: 'financing', fact: 'Lenders have indicated they would provide roughly $55M of term debt against this business (about 4.2x current EBITDA), and that debt capacity would not scale up just because a higher price is paid.', revealPolicy: 'AVAILABLE_ON_REQUEST' },
      { id: 'pf-f6', category: 'market', fact: 'Membership churn runs approximately 38% annually, in line with the premium-fitness industry average.', revealPolicy: 'AVAILABLE_ON_REQUEST' },
      { id: 'pf-f7', category: 'market', fact: 'The premium-fitness segment has grown mid-single-digits annually for five straight years, as consumers increasingly favor boutique group classes over big-box gyms.', revealPolicy: 'AVAILABLE_ON_REQUEST' },
      { id: 'pf-f8', category: 'risk', fact: 'Three of PeakForm\'s 40 studios sit within 5 miles of a new low-cost competitor that opened within the past year.', revealPolicy: 'AVAILABLE_ON_REQUEST' },
      { id: 'pf-f9', category: 'diligence-gap', fact: 'Instructor retention and member-satisfaction scores have not yet been shared by the founder.', revealPolicy: 'NOT_AVAILABLE' },
    ],
    exhibits: [
      {
        id: 'pf-ex1', type: 'bar', title: 'Revenue-growth initiatives under consideration', revealPolicy: 'AVAILABLE_ON_REQUEST', unit: '$M',
        subtitle: 'Projected incremental run-rate EBITDA from each initiative, phased over the hold period',
        data: {
          categories: ['Membership price increase', '5 new studio openings', 'Ancillary revenue (retail, coaching)'],
          valueUnit: '$M',
          series: [{ label: 'Incremental run-rate EBITDA', values: [1.2, 0.9, 0.5] }],
        },
        sourceNote: 'Management estimates, unaudited.',
      },
    ],
    valueCreationLevers: [
      { id: 'pf-lev1', lever: 'Membership pricing', hint: 'A modest price increase on a loyal, habitual membership base — quantify it against the stated churn rate, not in isolation.' },
      { id: 'pf-lev2', lever: 'New studio openings', hint: 'Each new studio costs real buildout capital and takes time to mature — a lever with a real cost and a lag, not a free add.' },
      { id: 'pf-lev3', lever: 'Ancillary revenue', hint: 'Retail and coaching attach-rate revenue — smaller in size, but close to pure margin if cross-sold to an existing member base.' },
    ],
    quantProblems: [
      {
        id: 'pf-q1', prompt: 'What enterprise value is implied by the founder\'s ask of 9.0x EBITDA?',
        type: 'numeric', correctAnswer: 116640000, tolerancePct: 5, unit: '$', triggerPhase: 'economics',
        modelAnswer: 'EBITDA = $72M x 18% = $12.96M. At 9.0x, implied EV = $116.64M.',
        competency: 'returnsReasoning', requiresSoWhat: false,
      },
      {
        id: 'pf-q2', prompt: 'If the three initiatives above add a combined $2.6M of run-rate EBITDA over the hold, what does pro forma EBITDA become?',
        type: 'numeric', correctAnswer: 15560000, tolerancePct: 3, unit: '$', relatedExhibitId: 'pf-ex1', triggerPhase: 'valueCreation',
        modelAnswer: '$12.96M + $2.6M = $15.56M pro forma EBITDA.',
        competency: 'valueCreation', requiresSoWhat: false,
      },
      {
        id: 'pf-q3', prompt: 'Debt capacity here is fixed at roughly $55M regardless of price paid. If you pay the 9.0x ask, EBITDA grows to $15.56M, and you exit at the SAME 9.0x multiple after a 3-year hold with no debt paydown, what equity MOIC do you get — and is that an attractive return?',
        type: 'numeric', correctAnswer: 1.38, tolerancePct: 5, unit: 'x', triggerPhase: 'revisedValuation',
        modelAnswer: 'Equity invested = $116.64M - $55M = $61.64M. Exit EV = $15.56M x 9.0 = $140.04M; exit equity = $140.04M - $55M = $85.04M. MOIC = 85.04 / 61.64 ~= 1.38x over 3 years (~11% IRR) — modest, and below what most PE funds target for a hold this length, so the 9.0x ask is hard to justify on returns alone.',
        competency: 'returnsReasoning', requiresSoWhat: true,
      },
    ],
    synthesisMoments: [
      { id: 'pf-syn1', triggerPhase: 'valueCreation', prompt: 'Before moving to a price recommendation, summarize in 2-3 sentences what you now believe about this business and this price.', idealSynthesis: 'A durable, modestly-growing consumer services business with identifiable but modest value-creation levers (~$2.6M), where the founder\'s 9.0x ask produces a return that doesn\'t clear a typical PE bar even after the value creation is realized — meaning price, not quality, is the blocker here.' },
    ],
    recommendationCriteria: {
      mustAddress: ['entry price vs. the 7.0x-8.0x comp range', 'the value-creation levers, quantified rather than just named', 'a returns check (MOIC/IRR), not just "value exceeds price"', 'the named competitive-proximity risk and a mitigation or diligence next step', 'a concrete next step, not just a verdict'],
      strongAnswerLooksLike: 'Declines the deal at the 9.0x asking price — even after crediting the identified value-creation levers, the resulting ~1.4x MOIC / ~11% IRR over a 3-year hold is below a typical PE return threshold — but states a walk-away price (near or below the 7.0x-8.0x comp range) at which the same logic would clear the bar, and names instructor/member-satisfaction diligence and the nearby low-cost competitor as open items before any price is finalized.',
      conclusion: 'DO_NOT_INVEST_AT_ASK',
    },
    interviewerNotes: 'If the candidate jumps straight to "value > price, so invest," push them toward a returns check: "what return does that actually produce, and over what hold?" If they ask about financing/debt capacity, reveal pf-f5 verbatim — it is the fact that makes entry price matter to the equity check. If they never ask about financing, let the case proceed, but the debrief should note that the returns math was incomplete without it.',
    idealInsights: [
      'Debt capacity here is effectively fixed in dollar terms, not a percentage of the price paid — which is exactly why the price paid matters so much to the equity check and to MOIC.',
      'A business can be a genuinely good business (durable category, real pricing power, identifiable levers) and still be a bad investment at the wrong price.',
      'Quantified value creation ($2.6M) still was not enough to clear a reasonable return bar at the asking price — that is useful, specific information, not a failure of the analysis.',
    ],
    commonMistakes: [
      'Treating "the brand is strong" or "the market is growing" as sufficient grounds to recommend investing, without ever running a returns check.',
      'Naming value-creation levers (pricing, new studios, ancillary revenue) without quantifying any of them.',
      'Never asking about financing/debt capacity, so never noticing why entry price matters to the equity check.',
      'Stopping at "I would negotiate a lower price" with no stated target price or threshold.',
    ],
    gradingEvidence: {
      opening: ['investmentThesis'],
      hypothesis: ['investmentThesis', 'marketAttractiveness'],
      economics: ['businessQuality', 'returnsReasoning'],
      valueCreation: ['valueCreation'],
      exhibit: ['businessQuality'],
      revisedValuation: ['returnsReasoning'],
      recommendation: ['investmentJudgment', 'downsideRisk'],
    },
  },
  {
    id: 'meadowbrook-vet-rollup',
    label: 'Healthcare Services',
    title: 'Meadowbrook Veterinary Group — A Clinic Roll-Up',
    industry: 'Healthcare Services — Veterinary Clinics',
    difficulty: 'Standard',
    estimatedMin: 35,
    prompt: 'Meadowbrook Veterinary Group operates 22 small-animal veterinary clinics across three adjacent states, built through an active roll-up strategy over the past four years. The founders are seeking a growth-equity partner to fund the next phase of consolidation. How would you think about this opportunity, and what would you want to know before recommending we proceed?',
    hiddenFacts: [
      { id: 'mv-f1', category: 'financials', fact: '22 clinics, combined trailing-twelve-month revenue of $96M.', revealPolicy: 'PROACTIVELY_GIVEN' },
      { id: 'mv-f2', category: 'deal', fact: 'The founders are seeking $140M of new growth equity for a 65% post-money ownership stake.', revealPolicy: 'PROACTIVELY_GIVEN' },
      { id: 'mv-f3', category: 'operations', fact: 'Of the 22 clinics, 14 are "mature" (owned 2+ years, fully integrated) and 8 are "recent" (acquired within the last 18 months, still integrating).', revealPolicy: 'AVAILABLE_ON_REQUEST' },
      { id: 'mv-f4', category: 'risk', fact: '2 of the 8 recently-acquired clinics have lost their lead veterinarian within the past year — a common integration risk in clinic roll-ups when the founding vet leaves after a sale.', revealPolicy: 'AVAILABLE_ON_REQUEST' },
      { id: 'mv-f5', category: 'market', fact: 'The regional veterinary-services market is fragmented, with hundreds of independent single-location practices as potential future acquisition targets.', revealPolicy: 'AVAILABLE_ON_REQUEST' },
      { id: 'mv-f6', category: 'diligence-gap', fact: 'Clinic-level patient retention and referral-source data for the 8 recent clinics has not yet been shared by the founders.', revealPolicy: 'NOT_AVAILABLE' },
    ],
    exhibits: [
      {
        id: 'mv-ex1', type: 'table', title: 'Clinic cohort economics', revealPolicy: 'AVAILABLE_ON_REQUEST',
        subtitle: 'Mature vs. recently-acquired clinics',
        data: {
          columns: [
            { key: 'cohort', label: 'Cohort' }, { key: 'count', label: '# Clinics' },
            { key: 'avgRevenue', label: 'Avg. Revenue / Clinic', unit: '$' }, { key: 'margin', label: 'EBITDA Margin', unit: '%' },
          ],
          rows: [
            { cohort: 'Mature (2+ yrs)', count: 14, avgRevenue: 4800000, margin: 22 },
            { cohort: 'Recent (<18 mo)', count: 8, avgRevenue: 3600000, margin: 8 },
          ],
        },
        sourceNote: 'Management-reported, unaudited.',
      },
      {
        id: 'mv-ex2', type: 'bar', title: 'Cost structure vs. industry benchmark — recent cohort', revealPolicy: 'AVAILABLE_ON_REQUEST', unit: '%',
        subtitle: 'Cost as a % of clinic revenue, recent cohort vs. mature veterinary-industry benchmark',
        data: {
          categories: ['Staffing % of revenue', 'Supplies % of revenue', 'Facilities % of revenue'],
          valueUnit: '%',
          series: [
            { label: 'Meadowbrook recent cohort', values: [52, 18, 9] },
            { label: 'Mature industry benchmark', values: [46, 15, 7] },
          ],
        },
        sourceNote: 'Industry benchmark from trade-association reporting; Meadowbrook figures are management-reported.',
      },
    ],
    valueCreationLevers: [
      { id: 'mv-lev1', lever: 'Integration / margin convergence', hint: 'The recent cohort is well below the mature cohort\'s margin — quantify how much EBITDA converging them to the mature margin would add, and whether the cost-benchmark exhibit supports that being achievable.' },
      { id: 'mv-lev2', lever: 'Procurement scale', hint: 'Supplies cost as a % of revenue is already close to benchmark — a smaller, more plausible lever than staffing.' },
      { id: 'mv-lev3', lever: 'Cross-referral network', hint: 'A larger regional network can refer specialty cases between clinics — real, but harder to quantify without more data than is available in this case.' },
    ],
    quantProblems: [
      {
        id: 'mv-q1', prompt: 'What is Meadowbrook\'s blended EBITDA today, combining the mature and recent clinic cohorts?',
        type: 'numeric', correctAnswer: 17088000, tolerancePct: 5, unit: '$', relatedExhibitId: 'mv-ex1', triggerPhase: 'economics',
        modelAnswer: 'Mature: 14 x $4.8M x 22% = $14.78M. Recent: 8 x $3.6M x 8% = $2.30M. Blended EBITDA ~= $17.09M.',
        competency: 'returnsReasoning', requiresSoWhat: false,
      },
      {
        id: 'mv-q2', prompt: 'If the founders are seeking $140M for a 65% post-money stake, what post-money equity value does that imply, and roughly what multiple of today\'s ~$17.09M blended EBITDA is that?',
        type: 'numeric', correctAnswer: 12.6, tolerancePct: 6, unit: 'x', triggerPhase: 'valuation',
        modelAnswer: 'Post-money equity value = $140M / 65% ~= $215.4M. $215.4M / $17.09M ~= 12.6x blended EBITDA — rich for a business where more than a third of clinics are still sub-scale and integrating.',
        competency: 'returnsReasoning', requiresSoWhat: true,
      },
      {
        id: 'mv-q3', prompt: 'If the 8 recent clinics are fully integrated up to the mature cohort\'s 22% margin, what would total blended EBITDA become?',
        type: 'numeric', correctAnswer: 21120000, tolerancePct: 5, unit: '$', relatedExhibitId: 'mv-ex2', triggerPhase: 'valueCreation',
        modelAnswer: 'Recent clinics at the mature margin: 8 x $3.6M x 22% = $6.34M (vs. $2.30M today, +$4.03M). New blended EBITDA ~= $17.09M + $4.03M = $21.12M.',
        competency: 'valueCreation', requiresSoWhat: true,
      },
      {
        id: 'mv-q4', prompt: 'If that integrated EBITDA of ~$21.12M were later valued at the SAME 12.6x multiple, what total equity value would that imply, and how does that compare with the $215.4M post-money value being paid in today?',
        type: 'numeric', correctAnswer: 266112000, tolerancePct: 5, unit: '$', triggerPhase: 'revisedValuation',
        modelAnswer: '$21.12M x 12.6 ~= $266.1M — about $50.7M (~24%) above the $215.4M being paid in today, IF integration fully succeeds and the multiple holds. That upside is the case FOR the deal; it is only as credible as the integration-risk and retention diligence behind it.',
        competency: 'returnsReasoning', requiresSoWhat: true,
      },
    ],
    synthesisMoments: [
      { id: 'mv-syn1', triggerPhase: 'valueCreation', prompt: 'Before you land on a recommendation, summarize what has to be true for this deal to work.', idealSynthesis: 'The deal only works if the 8 recent clinics can actually be integrated to something close to the mature cohort\'s margin — which hinges on resolving the lead-vet attrition risk at 2 of those clinics and getting real patient-retention data that hasn\'t been shared yet. Absent that, the 12.6x ask is too rich for a business that is one-third unproven.' },
    ],
    recommendationCriteria: {
      mustAddress: ['cohort-level economics, not just the blended average', 'the integration/margin-convergence lever, explicitly quantified', 'the lead-veterinarian attrition risk and a mitigation or diligence ask', 'a returns check at the asking price (12.6x), not just "value could exceed price"', 'a concrete next step — price adjustment, earnout tied to integration milestones, or named diligence before closing'],
      strongAnswerLooksLike: 'A conditional recommendation: proceed only if (a) the price is restructured — e.g. an earnout or holdback tied to the 8 recent clinics actually reaching close to mature-cohort margins — and (b) vet-retention and patient-retention diligence on those clinics is completed before closing; absent both, the 12.6x ask is too rich for a business that is one-third unproven.',
      conclusion: 'CONDITIONAL — a candidate can defensibly land on either INVEST (with the above conditions) or DO NOT INVEST at the asking price; the debrief should grade the quality of the reasoning behind whichever conclusion is reached, not the conclusion itself.',
    },
    interviewerNotes: 'This case has no single "correct" verdict — grade the quality of the price/risk/returns reasoning, not which side of INVEST/DO NOT INVEST the candidate lands on. If the candidate never splits the cohorts and only uses the $96M/blended-margin headline, let them proceed once, then have a later turn gently surface mv-f3 ("would it help to know how the 22 clinics break down?") if they still have not asked after the economics phase. Reveal mv-f4 (vet attrition) only on request; if asked for patient-level retention data, state plainly that it is not available (mv-f6).',
    idealInsights: [
      'A blended average across a "mature" and "recent" cohort hides the real story — the recent cohort is running at a third of the mature cohort\'s margin.',
      'The cost-vs-benchmark exhibit shows the recent cohort\'s staffing ratio is the single largest gap to benchmark — the margin-convergence lever is plausible, not just hoped-for.',
      'The embedded upside ($266M vs. $215M paid in) is real only if the integration risk — concretely, the lead-vet attrition already seen at 2 of 8 recent clinics — is addressed, not assumed away.',
    ],
    commonMistakes: [
      'Using the $96M revenue / blended-margin headline without ever asking for the cohort breakdown.',
      'Recommending INVEST because "the embedded upside exceeds the price," without naming the integration risk that upside depends on.',
      'Recommending DO NOT INVEST on "roll-ups are risky" without ever quantifying the specific margin-convergence lever available here.',
      'Treating the unresolved vet-attrition and patient-retention gaps as reasons to end the conversation rather than as diligence items to put in a next step.',
    ],
    gradingEvidence: {
      opening: ['investmentThesis'],
      hypothesis: ['investmentThesis', 'marketAttractiveness'],
      economics: ['businessQuality', 'returnsReasoning'],
      exhibit: ['businessQuality', 'diligence'],
      valueCreation: ['valueCreation'],
      revisedValuation: ['returnsReasoning'],
      recommendation: ['investmentJudgment', 'downsideRisk'],
    },
  },
];

function getPEDiligenceCaseConfig(id){ return PE_DILIGENCE_CASES.find(c => c.id === id) || PE_DILIGENCE_CASES[0]; }
