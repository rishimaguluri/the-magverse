// bainSprintContent.js
// Static content for the Bain Capital Sprint: firm module, deal library, investor-mindset
// learn modules, paper-LBO drills, investment cases. Loaded as a plain classic <script> before
// bainSprintEngine.js/bainSprintPanel.jsx. Deal facts are researched from primary sources (Bain
// Capital's own press releases / press-release wire distribution) with every factual claim
// source-tagged; qualitative value-creation/risk/exit material is explicitly labeled MY
// INVESTMENT INFERENCE wherever it is not something Bain has itself disclosed.

const BAIN_SPRINT_CONTENT = {

  firmModule: {
    id: 'bain-firm',
    title: 'Bain Capital: What It Is, How It Invests',
    sourceLabel: 'OFFICIAL BAIN CAPITAL',
    sourceUrls: [
      { url: 'https://www.baincapitalprivateequity.com/strategy-and-approach', fetchedDate: '2026-10-05' },
      { url: 'https://www.baincapitalprivateequity.com/industries', fetchedDate: '2026-10-05' },
    ],
    whatItIs: 'Bain Capital is a global private investment firm founded in 1984, with Private Equity as its founding, flagship business alongside credit, growth/venture, real estate, and other strategies. Bain Capital Private Equity has executed over 1,000 primary and add-on investments.',
    verticals: [
      { name: 'Consumer', description: 'Deep expertise in consumer, retail, and dining — large retailers, multinational franchises, quick-service restaurants, food distribution, consumer durables.' },
      { name: 'Healthcare', description: 'Hospitals, life sciences, pharmaceuticals, medical products, manufacturers, distributors, and service providers, via approaches including corporate carve-outs and take-privates.' },
      { name: 'Industrials', description: 'Active since 1986 — construction, manufacturing, diversified industrial technology, automotive, paper/packaging, chemicals.' },
      { name: 'Services', description: 'One of the most active investors in financial and business services — payments, software, banking/insurance/credit, brokerage/exchange, business services/outsourcing.' },
      { name: 'Technology', description: 'Software, hardware, internet, digital media, and information services — application software, infrastructure software, cybersecurity, semiconductors.' },
    ],
    valueCreationPhilosophy: {
      coreStatement: 'Bain Capital describes its goal as being "the partner of choice for great companies as they grow" — a growth-oriented model it states "results in stronger companies that employ the best people, are socially responsible, and deliver strong returns over the long-term."',
      portfolioGroup: 'Bain Capital states it was among the first PE firms to build "a dedicated global portfolio group staffed with operating and strategy professionals who partner with management teams" — combined with investment professionals (predominantly from consulting backgrounds) into one collaborative team.',
      managementPartnership: [
        'Trust-based relationships with "significant commitment of time on-the-ground," including the ability to step into interim leadership roles when needed.',
        'A "comprehensive multi-year agenda" with "ownership of total company performance" — not just board-level oversight.',
        'A "consistent senior team from investment to realization" — the same people who diligence the deal stay through the hold.',
      ],
    },
    operatingVsFinancialEngineering: {
      statement: "Bain Capital is widely credited — including by outside PE economists — with pioneering the in-house \"operating partner\" model now common across the industry. Industry summaries of Bain Capital's approach (e.g. Umbrex's practitioner database) report that roughly 80% of its PE value creation over the past decade came from operating improvements rather than financial engineering.",
      sourceLabel: 'THIRD-PARTY / UNOFFICIAL — not a figure Bain Capital itself publishes; treat as directional, not exact.',
    },
    implication: "This changes how you should approach every Bain case. The default lever is NOT \"add debt and wait.\" It's: what can we actually make better operationally — growth, pricing, efficiency, M&A — and how does that translate into EBITDA?",
  },

  deals: [
    {
      id: 'fdh-aero',
      company: 'FDH Aero',
      sector: 'Industrials — Aerospace & Defense Supply Chain',
      announcedDate: '2026-06-08',
      sourceLabel: 'PRESS RELEASE (JOINT ANNOUNCEMENT)',
      sourceUrl: 'https://www.globenewswire.com/news-release/2026/06/08/3308146/0/en/fdh-aero-enters-next-phase-of-growth-through-partnership-with-bain-capital-and-audax-private-equity.html',
      basicIntro: 'FDH Aero distributes hardware, electrical components, and consumables to aerospace and defense OEM and aftermarket customers.',
      thinkFirstQuestion: 'Before reading on: what would make a parts-and-components distributor for aerospace & defense an attractive private equity investment?',
      marketFacts: [
        'Aerospace & defense supply chains are fragmented across many small specialty distributors — a classic buy-and-build consolidation setup.',
        'OEM and aftermarket demand for aerospace components has long replacement/maintenance cycles, supporting recurring, less-cyclical revenue relative to new-aircraft production.',
      ],
      companyFacts: [
        'FDH Aero operates across 15 countries with 1,500+ employees and 650,000+ sq ft of inventory space.',
        'Existing majority owner Audax Private Equity (since 2017) is expected to remain a significant investor alongside Bain Capital — a continuity signal, not a full exit.',
        'Since 2017, FDH Aero has completed 12 acquisitions and expanded into 15 countries under Audax ownership — a proven buy-and-build playbook is already running.',
        'Financial terms were not disclosed. Jefferies, RBC Capital Markets, and BMO Capital Markets are providing committed debt financing.',
      ],
      bainStatedRationale: [
        { quote: 'FDH has built an exceptional platform in aerospace and defense logistics, distinguished by deep customer relationships, a service-first culture, and a level of execution that gives us tremendous confidence in the business.', speaker: 'Stephen Thomas', role: 'Partner, Bain Capital' },
        { quote: "We are excited to partner with Ian and the full FDH team. Together, we plan to continue investing in the company's capabilities and inventory availability to further strengthen its customer-centric growth strategy.", speaker: 'Ajay Kumar', role: 'Partner, Bain Capital' },
      ],
      bainStatedGrowthPlans: ['Accelerate organic growth', 'Pursue strategic acquisitions', 'Expand global reach and capabilities', 'Strengthen customer-focused innovation'],
      myInvestmentInference: {
        label: "MY INVESTMENT INFERENCE — not Bain's disclosed view",
        valueCreationLevers: ['Continue the existing 12-deal buy-and-build playbook in a fragmented market', 'Expand inventory availability/fill rates — a direct retention lever in a distribution business', 'Cross-sell across the combined Audax + Bain network and geographies'],
        risks: ["Thesis depends on continuing an acquisition pace that gets harder to sustain at larger scale (integration risk compounds)", 'Aerospace demand, while less cyclical than new-build, is not immune to a commercial-aviation downturn', 'Joint ownership with Audax could complicate governance/exit timing versus a clean majority buyout'],
        possibleExit: 'Strategic sale to a larger aerospace distribution platform, or an IPO once scale and margin profile mature — unconfirmed, inferred from the buy-and-build pattern.',
      },
      dealValueEstimate: null,
    },
    {
      id: 'gong-cha',
      company: 'Gong cha',
      sector: 'Consumer — Global F&B Franchise',
      announcedDate: '2026-08-06',
      sourceLabel: 'OFFICIAL BAIN CAPITAL',
      sourceUrl: 'https://www.baincapital.com/news/bain-capital-acquire-gong-cha-one-worlds-fastest-growing-tea-brands-ta-associates',
      basicIntro: 'Gong cha is a global premium tea brand, founded in Taiwan in 2006, operating primarily through franchising.',
      thinkFirstQuestion: 'Before reading on: what would make a global franchise beverage brand an attractive PE asset — and what would worry you about it?',
      marketFacts: [
        'Premium ready-to-drink tea is a global, still-growing category with low capital intensity per store under a franchise model.',
        'Franchise-model consumer brands convert store growth into high-margin royalty/fee revenue rather than carrying the capex themselves.',
      ],
      companyFacts: [
        'Nearly 2,200 stores across 33 markets, serving 150M+ beverages annually.',
        'Proprietary "Digital Kitchen" drink-dispensing technology — a potential operating differentiator versus manual-pour competitors.',
        '240+ U.S. locations today against a stated long-term goal of 1,000 domestically — the U.S. is still early relative to its own ambition.',
        'Seller TA Associates held a majority stake since 2019 (a 7-year hold) and backed international growth, acquisitions, and restaurant-tech investment.',
        'Financial terms were not disclosed; deal expected to close Q4 2026.',
      ],
      bainStatedRationale: [
        { quote: 'Gong cha has built a distinctive and globally recognised brand with loyal customers and strong franchisee economics.', speaker: 'Naofumi Nishi', role: 'Partner, Bain Capital' },
      ],
      bainStatedGrowthPlans: ['Disciplined store expansion in Japan and Korea (established markets)', 'Accelerate U.S. growth through direct franchising', 'Deepen customer engagement via product innovation, digital marketing, and loyalty programs'],
      myInvestmentInference: {
        label: "MY INVESTMENT INFERENCE — not Bain's disclosed view",
        valueCreationLevers: ["U.S. unit growth toward the stated 1,000-store ambition is the clearest, most quantifiable growth lever", 'Digital Kitchen technology could be a real same-store-economics lever (speed/labor), worth diligencing beyond the marketing angle', 'Loyalty/digital engagement to lift same-store sales without needing new units'],
        risks: ["Franchisee economics are \"strong\" per Bain's own statement, but franchisee health/concentration in any one market is unverified from public information", 'Premium beverage categories can face real fashion/trend risk — bubble tea demand has cycled before', "Entering the brand's 3rd ownership cycle (founders → TA → Bain) raises the bar for what's left to improve without over-franchising or diluting the brand"],
        possibleExit: 'Strategic sale to a larger global restaurant/beverage platform, or a future IPO if U.S. scale materializes — unconfirmed, inferred.',
      },
      dealValueEstimate: { value: '~$635M', source: 'Nikkei Asia (secondary reporting)', label: 'UNOFFICIAL ESTIMATE — Bain did not disclose terms' },
    },
    {
      id: 'vitabiotics',
      company: 'Vitabiotics',
      sector: 'Healthcare / Consumer — Vitamins, Minerals & Supplements',
      announcedDate: '2026-07-24',
      sourceLabel: 'OFFICIAL BAIN CAPITAL',
      sourceUrl: 'https://www.baincapital.com/news/bain-capital-acquire-vitabiotics-uks-no1-vitamin-company',
      basicIntro: "Vitabiotics is the UK's #1 vitamin, mineral and supplement company, founded in 1971.",
      thinkFirstQuestion: "Before reading on: a 55-year-old, founder-led, #1-in-category consumer-health brand is for sale. What would make this attractive — and what would make you cautious?",
      marketFacts: [
        'Vitamins/supplements is a durable, largely non-discretionary consumer-health category with real pricing power at the premium/clinically-positioned end.',
        "Science-led, healthcare-professional-endorsed positioning (vs. mass commodity vitamins) is harder to copy than shelf space alone.",
      ],
      companyFacts: [
        'Brand portfolio includes Pregnacare, Perfectil, Wellman, Wellwoman, Osteocare, and an Ultra range.',
        'Operates in 70+ countries, with established operations in India (via Meyer Organics), China, Egypt, and West Africa — the international footprint already exists; this is not a from-zero expansion story.',
        "Founder/CEO Tej Lalvani (UK Dragons' Den) remains; the deal is framed as continuity, not a distressed sale.",
        "Investment is led by Bain Capital's Asia Private Equity team, supported by the global platform — a signal of where Bain sees the biggest growth lever.",
        'Financial terms were not disclosed.',
      ],
      bainStatedRationale: [
        { quote: 'Vitabiotics is exactly the type of business we support: a trusted, science-led brand platform with category leadership.', speaker: 'Pawan Singh', role: 'Partner, Bain Capital' },
        { quote: "We see a compelling opportunity to help Vitabiotics build on its UK leadership and strengthen its global platform.", speaker: 'Rishi Mandawat', role: 'Partner, Bain Capital' },
      ],
      bainStatedGrowthPlans: ['International expansion acceleration', 'Digital capabilities and e-commerce investment', 'Supply chain resilience', 'New product development', 'Strengthened distribution in MENA and China'],
      myInvestmentInference: {
        label: "MY INVESTMENT INFERENCE — not Bain's disclosed view",
        valueCreationLevers: ["An Asia-led deal team plus existing India/China footprint suggests the real thesis is accelerating Asia/MENA distribution, not just \"more UK growth\"", 'E-commerce/digital is a margin lever (DTC economics) as much as a growth one, if the brand over-indexes on traditional retail today', 'Portfolio rationalization/premiumization across the VB Group brands if currently run as loosely federated units'],
        risks: ["Family-founder transition risk — Lalvani's personal credibility is part of the brand; management-transition execution matters", 'Regulatory/registration friction is real and slow in some target expansion markets (supplement regulation varies sharply by country)', 'Premium, science-led positioning could erode if international scaling pushes toward lower price points'],
        possibleExit: 'Strategic sale to a larger global consumer-health/pharma platform once international scale is proven — unconfirmed, inferred.',
      },
      dealValueEstimate: { value: '~$1.2B / £900M', source: 'Bloomberg (secondary reporting)', label: 'UNOFFICIAL ESTIMATE — Bain did not disclose terms' },
    },
  ],

  learnModules: [
    {
      id: 'inv-01', title: 'Strategy vs. Investment Judgment', subtitle: 'Investor Mindset', estimatedMinutes: 8,
      bigQuestion: 'Why isn\'t "what should this company do?" the right first question for a PE investor?',
      blocks: [
        { type: 'question', freeText: true, prompt: 'Before reading on: a consultant and a PE investor both look at the same company. What question does the investor ask that the consultant doesn\'t have to?' },
        { type: 'text', heading: 'Core Idea', body: 'A consultant\'s job ends at a good recommendation. A PE investor\'s job doesn\'t start until after a price is paid — so every judgment is filtered through "would I commit capital to this, at this price, and could I lose it?" A great strategic recommendation for a company you don\'t own is not the same question as a great investment decision.' },
        { type: 'visual', visual: { type: '2x2-matrix', title: 'Quality vs. price — the investor\'s real grid', xAxis: { left: 'Cheap', right: 'Expensive' }, yAxis: { top: 'Great business', bottom: 'Weak business' },
          points: [{ label: 'Invest', x: 0.2, y: 0.85 }, { label: 'Price-dependent', x: 0.8, y: 0.85 }, { label: 'Walk away (usually)', x: 0.2, y: 0.15 }, { label: 'Avoid', x: 0.8, y: 0.15 }] } },
        { type: 'text', heading: 'Why It Matters', body: 'A great business bought at the wrong price is a bad investment. A mediocre business bought cheap enough with a clear plan can be a good one. Investment judgment is a two-variable problem — quality AND price — not company admiration alone.' },
        { type: 'counterexample', heading: 'Counterexample', body: 'Describing a company as having "large market, strong management, good growth" is strategy-shaped praise, not an investment thesis — it says nothing about price, downside, or what specifically would make Bain able to create more value than the current owner.' },
        { type: 'question', prompt: 'A target has a wonderful market position and management team, but the seller is asking 18x EBITDA against a realistic 12x comp set. What should drive your recommendation?',
          choices: [{ label: 'Recommend investing — great businesses are always worth paying up for' }, { label: 'Price matters as much as quality — at 18x this may not clear a reasonable return, regardless of how good the business is', correct: true }, { label: 'Quality is irrelevant once a price is quoted' }],
          explanation: 'A great business is not automatically a great investment — every advanced case eventually has to ask "at what price?"' },
        { type: 'text', heading: 'Application', emphasis: true, body: 'For the next company you look at — in this Sprint or in the news — force yourself to answer both "is this a great business?" AND "at what price would I actually invest?" separately, before combining them into a recommendation.' },
        { type: 'takeaway', body: 'Investment judgment = business quality × price. Admiring the business is not the same as underwriting the investment.' },
      ],
      strategicQuestion: 'Think of a company you personally admire. What price would make it a bad investment anyway?',
      nextConnections: [{ label: 'What Makes a Great PE Business?' }],
    },
    {
      id: 'inv-02', title: 'What Makes a Great PE Business?', subtitle: 'Investor Mindset', estimatedMinutes: 9,
      bigQuestion: 'What should you actually investigate when sizing up a potential PE target?',
      blocks: [
        { type: 'question', freeText: true, prompt: 'Before reading on: name three things you\'d want to know about a business before deciding it\'s a strong PE candidate — not a checklist, just your real instinct.' },
        { type: 'text', heading: 'Core Idea', body: 'There is no single formula — different assets win for different reasons. But a useful investigation covers: market growth/durability and fragmentation; revenue predictability (retention, switching costs, pricing power); unit economics (gross/EBITDA margin, cash conversion, capex, working capital); customer concentration and cyclicality; competitive differentiation and management quality; and a credible growth runway including M&A.' },
        { type: 'visual', visual: { type: 'bar-compare', title: 'Illustrative: a strong vs. a weak PE candidate', unit: '%', categories: ['Revenue retention', 'EBITDA margin', 'Customer concentration (lower=better, inverted for display)'], series: [{ label: 'Strong candidate', values: [92, 28, 8] }, { label: 'Weak candidate', values: [60, 11, 45] }] } },
        { type: 'example', heading: 'Real Example', body: "Vitabiotics (this Sprint's Deal Room) scores well on several of these: durable, non-discretionary category; science-led differentiation; 70+-country footprint already built. What it doesn't publicly reveal — customer concentration, exact margins, working-capital intensity — is exactly what diligence exists to answer." },
        { type: 'counterexample', heading: 'Counterexample / Limitation', body: "Do not turn this into a mechanical checklist scored and summed. A business can be weak on one dimension (e.g. high customer concentration) and still be a great investment if the price and the specific fix are right — judgment, not scoring, is the actual skill." },
        { type: 'text', heading: 'Application', emphasis: true, body: 'Pick one of this Sprint\'s three Deal Room companies. Using only the FACT fields (not the inference), rate it on 3 of the dimensions above and say why.' },
        { type: 'source', body: 'Investigation checklist synthesized from standard PE diligence practice; not a single cited source.' },
        { type: 'takeaway', body: 'Investigate market durability, revenue quality, unit economics, concentration, and management — but combine them with judgment, not a scorecard.' },
      ],
      strategicQuestion: 'Which of these dimensions do you personally find easiest to assess from the outside, and which is hardest without real diligence access?',
      nextConnections: [{ label: 'Market Attractiveness' }, { label: 'Revenue Quality & Recurring Revenue' }],
    },
    {
      id: 'inv-03', title: 'Market Attractiveness, for an Investor', subtitle: 'Investor Mindset', estimatedMinutes: 8,
      bigQuestion: 'Why does a fragmented, consolidating market matter more to a PE investor than to a strategy consultant?',
      blocks: [
        { type: 'question', freeText: true, prompt: 'Before reading on: FDH Aero sits in a fragmented aerospace-distribution market. Why would fragmentation specifically matter to a PE buyer, beyond "it\'s a big market"?' },
        { type: 'text', heading: 'Core Idea', body: "A consultant asks if a market is structurally attractive (Five Forces). An investor asks the same thing PLUS: is this market fragmented enough to consolidate profitably, and is there a credible buyer (us) with the capital and playbook to do it? Market attractiveness for PE is inseparable from the specific ownership thesis — growing, fragmented, and acquirable beats growing-but-already-consolidated." },
        { type: 'visual', visual: { type: 'causal-chain', title: 'From market structure to PE thesis', nodes: [{ id: 'a', label: 'Fragmented, growing market', sub: 'Many small players' }, { id: 'b', label: 'Buy-and-build thesis', sub: 'Consolidate + integrate' }, { id: 'c', label: 'Multiple + margin expansion', sub: 'Larger, more efficient platform' }], edges: [{ label: 'enables' }, { label: 'can produce' }] } },
        { type: 'example', heading: 'Real Example', body: "FDH Aero has already run exactly this playbook — 12 acquisitions since 2017 under Audax, expanding into 15 countries. The market's fragmentation is precisely what made that possible, and it's the most likely reason Bain's growth language explicitly includes \"pursue strategic acquisitions.\"" },
        { type: 'counterexample', heading: 'Counterexample', body: "A large, growing market that's already consolidated into 2-3 dominant players is often a worse PE target than a smaller, fragmented one — there's no credible path to the same kind of multiple-and-scale improvement through M&A." },
        { type: 'question', prompt: 'Which market structure is usually MORE attractive to a buy-and-build PE investor?',
          choices: [{ label: 'A $50B market with 3 dominant players and high entry barriers' }, { label: 'A $5B market with hundreds of small regional players and no dominant leader', correct: true }, { label: 'Market size alone determines attractiveness, structure doesn\'t matter' }],
          explanation: 'Fragmentation creates a credible path to value creation through consolidation — scale and multiple arbitrage on add-ons — that a market size number alone never guarantees.' },
        { type: 'text', heading: 'Application', emphasis: true, body: 'For Gong cha: is its market (global premium RTD tea) more fragmented-and-consolidating, or already-concentrated? What does that imply about how Bain should grow it?' },
        { type: 'takeaway', body: 'For a PE investor, "is the market fragmented and acquirable" is as important as "is the market growing."' },
      ],
      strategicQuestion: 'Of the three Deal Room companies, which one\'s market structure most clearly supports a buy-and-build thesis, and which doesn\'t?',
      nextConnections: [{ label: 'Value-Creation Levers' }],
    },
    {
      id: 'inv-04', title: 'Revenue Quality & Recurring Revenue', subtitle: 'Investor Mindset', estimatedMinutes: 8,
      bigQuestion: 'Why do two companies with identical revenue growth deserve very different valuations?',
      blocks: [
        { type: 'question', freeText: true, prompt: 'Before reading on: Company A grows 20% a year from subscriptions with 95% retention. Company B grows 20% a year from one-off project sales with no repeat customers. Same growth rate — same value?' },
        { type: 'text', heading: 'Core Idea', body: 'Revenue quality is about HOW predictable future revenue is, not just its size or growth rate. Recurring revenue, high retention, high switching costs, and real pricing power all mean next year\'s revenue is more knowable — which directly lowers the risk in an LBO and supports a higher sustainable multiple and more leverage.' },
        { type: 'visual', visual: { type: 'bar-compare', title: 'Same growth rate, very different revenue quality', unit: '%', categories: ['Revenue growth', 'Retention', 'Repeat purchase'], series: [{ label: 'Recurring model', values: [20, 95, 90] }, { label: 'Project/one-off model', values: [20, 40, 15] }] } },
        { type: 'example', heading: 'Real Example', body: "Vitabiotics' brands (Pregnacare, Wellman, etc.) benefit from habitual, repeat-purchase consumer behavior — once a consumer adopts a daily supplement, switching is friction-y. That's a real revenue-quality advantage over a brand bought on one-time promotional discounting." },
        { type: 'counterexample', heading: 'Counterexample / Limitation', body: "\"Recurring\" can be overstated — a subscription with easy, frictionless cancellation and no real switching cost is only mildly more predictable than one-off sales. Ask what's actually creating the retention, not just whether the label says \"recurring.\"" },
        { type: 'text', heading: 'Application', emphasis: true, body: "For Gong cha, most revenue flows through franchisees (royalties/fees), not direct consumer subscriptions. Is that recurring in the quality sense, or just a different kind of concentration risk (franchisee health)?" },
        { type: 'takeaway', body: "Growth rate tells you how big revenue might get. Revenue quality tells you how much you should trust that it will." },
      ],
      strategicQuestion: 'Name a business you know personally where the headline growth number hides weak underlying revenue quality.',
      nextConnections: [{ label: 'Downside Protection & Risk' }],
    },
    {
      id: 'inv-05', title: 'Value-Creation Levers (Beyond Financial Engineering)', subtitle: 'Investor Mindset', estimatedMinutes: 9,
      bigQuestion: 'If "buy, add debt, wait, sell higher" isn\'t the model, what actually is?',
      blocks: [
        { type: 'question', freeText: true, prompt: "Before reading on: Bain Capital's own materials emphasize operating improvement over financial engineering. Name three concrete ways a PE owner could improve a business operationally — not financially." },
        { type: 'text', heading: 'Core Idea', body: 'Operating value-creation levers include: organic growth (pricing, sales effectiveness, new markets/products), digital transformation, operating efficiency, procurement, supply chain, talent/management systems, and M&A/add-ons. The discipline is translating each lever into a specific, quantified EBITDA impact — not just naming the lever.' },
        { type: 'visual', visual: { type: 'causal-chain', title: 'From lever to return (the discipline, not just the list)', nodes: [{ id: 'a', label: 'Lever identified', sub: 'e.g. pricing, procurement' }, { id: 'b', label: 'Quantified EBITDA impact', sub: 'How much, by when' }, { id: 'c', label: 'Required investment + execution risk', sub: 'What it costs to get there' }], edges: [{ label: 'must become' }, { label: 'weighed against' }] } },
        { type: 'worked-example',
          question: 'A case says "we can improve margins through operational efficiency." Evaluate this as an investment argument.',
          weakAnswer: 'Sounds reasonable — operational efficiency usually helps margins.',
          whyWeak: 'It names a lever without quantifying it, without saying what investment it requires, and without naming the execution risk. It could mean anything from a 50bps procurement win to a multi-year ERP overhaul.',
          strongerAnswer: 'State it as: "Procurement consolidation across the 12 acquired businesses could realistically save 150-200bps of COGS within 18 months, requiring one dedicated integration hire, with execution risk concentrated in the smaller recent acquisitions that haven\'t yet been integrated."',
          whyStrong: 'It\'s specific, quantified, time-bound, and names the risk — exactly what Bain\'s own "comprehensive multi-year agenda" language implies they actually do.',
          yourTurnPrompt: 'Pick one lever for FDH Aero or Gong cha from this Sprint\'s Deal Room and write it in this same quantified form.' },
        { type: 'text', heading: 'Application', emphasis: true, body: "Re-read the firm module's note that ~80% of Bain's PE value creation has reportedly come from operating improvement, not financial engineering. What does that imply about how much weight 'add leverage' should get in your own case answers?" },
        { type: 'takeaway', body: 'A value-creation lever is only a real argument once it\'s quantified, time-bound, and risk-rated — not just named.' },
      ],
      strategicQuestion: "What's the laziest value-creation lever you're tempted to name in a case without quantifying it?",
      nextConnections: [{ label: 'Downside Protection & Risk' }, { label: 'Exit Thinking' }],
    },
    {
      id: 'inv-06', title: 'Downside Protection & Risk', subtitle: 'Investor Mindset', estimatedMinutes: 9,
      bigQuestion: 'What happens to the return if your base case is simply wrong?',
      blocks: [
        { type: 'question', freeText: true, prompt: "Before reading on: you've built a confident base case. What's the single most important question left to ask before you'd actually commit capital?" },
        { type: 'text', heading: 'Core Idea', body: 'Downside thinking means explicitly stress-testing the thesis: what if growth is half the base case, margin expansion fails, the exit multiple compresses, working capital absorbs cash, capex runs higher, integration takes longer, or customer concentration breaks? The question is never just "what could go wrong" generically — it\'s "would the investment still be attractive if this specific thing happened?"' },
        { type: 'visual', visual: { type: 'decision-tree', title: 'Base case vs. downside — same deal, different outcomes', unit: '$M', root: { label: 'Invest at proposed price?' }, branches: [{ label: 'Base case holds', prob: 0.5, payoff: 400 }, { label: 'Growth is half of plan', prob: 0.35, payoff: 80 }, { label: 'Multiple compresses 2x on exit', prob: 0.15, payoff: -60 }] } },
        { type: 'example', heading: 'Real Example', body: "For FDH Aero, a credible downside isn't \"the whole aerospace market collapses\" — it's narrower and more testable: \"the acquisition pace slows because good targets get scarcer/pricier as the platform scales, and growth falls back toward organic-only levels.\" That's a specific, falsifiable downside, not a vague worry." },
        { type: 'counterexample', heading: 'Counterexample / Limitation', body: '"What if the economy gets worse" is not a useful downside case — it\'s too generic to test or price. A good downside case is specific enough that you could say today whether early evidence is trending toward it.' },
        { type: 'question', prompt: 'Which is the stronger downside case for a consumer brand being taken through international expansion?',
          choices: [{ label: '"The macro environment could deteriorate"' }, { label: '"Regulatory approval in two of the five target expansion markets takes 12+ months longer than planned, delaying the main growth lever"', correct: true }, { label: '"Something unexpected could happen"' }],
          explanation: 'Specific, falsifiable downside cases are testable against real evidence as the investment plays out — generic ones are not.' },
        { type: 'text', heading: 'Application', emphasis: true, body: 'For one Deal Room company, write one specific, falsifiable downside case — not "something could go wrong," but a named mechanism with a number attached.' },
        { type: 'takeaway', body: 'A real downside case is specific and falsifiable. Ask: would I still invest if THIS exact thing happened — not "if things went badly."' },
      ],
      strategicQuestion: 'What would make you walk away from an otherwise-attractive deal — name the specific threshold, not just "too much risk."',
      nextConnections: [{ label: 'Diligence as Hypothesis Testing' }],
    },
    {
      id: 'inv-07', title: 'Diligence as Hypothesis Testing', subtitle: 'Investor Mindset', estimatedMinutes: 8,
      bigQuestion: 'What separates five great diligence questions from a thirty-item checklist?',
      blocks: [
        { type: 'question', freeText: true, prompt: "Before reading on: why might five well-chosen diligence questions be worth more than thirty generic ones?" },
        { type: 'text', heading: 'Core Idea', body: 'Diligence is not a generic checklist — it is hypothesis testing. Every diligence question should trace back to a specific thing that would have to be true for the thesis to hold, and should be prioritized by how much it would change your view if the answer came back wrong, not by how easy it is to ask.' },
        { type: 'visual', visual: { type: '2x2-matrix', title: 'Prioritizing diligence questions', xAxis: { left: 'Low info value', right: 'High info value' }, yAxis: { top: 'Thesis-critical', bottom: 'Nice to know' },
          points: [{ label: '"What % of revenue comes from top 5 customers?"', x: 0.85, y: 0.85 }, { label: '"What color is the logo?"', x: 0.1, y: 0.1 }, { label: '"How long is the average sales cycle?"', x: 0.6, y: 0.5 }] } },
        { type: 'example', heading: 'Real Example', body: 'For Vitabiotics, "what % of revenue comes from the top 3 retail customers in the UK?" is a high-value diligence question — it directly tests whether the "category leadership" claim is broad-based or concentrated in a few relationships that could walk. "What font is used on packaging?" is not.' },
        { type: 'counterexample', heading: 'Counterexample / Limitation', body: 'A 20-question diligence list that mixes a few thesis-critical questions with many generic ones dilutes attention and signals you haven\'t identified what actually matters most.' },
        { type: 'text', heading: 'Application', emphasis: true, body: 'For one Deal Room company, write your 5 highest-value diligence questions — ranked — and for each, state which specific part of the thesis it would confirm or break.' },
        { type: 'takeaway', body: 'Score diligence on priority and thesis-linkage, not on question count.' },
      ],
      strategicQuestion: 'What is the one diligence question that, if answered badly, would make you walk away from a deal you otherwise like?',
      nextConnections: [{ label: 'Exit Thinking' }],
    },
    {
      id: 'inv-08', title: 'Exit Thinking', subtitle: 'Investor Mindset', estimatedMinutes: 7,
      bigQuestion: 'Why should you think about the exit before you\'ve even made the investment?',
      blocks: [
        { type: 'question', freeText: true, prompt: 'Before reading on: why would an investor want a credible answer to "who would buy this from us in 5 years?" before even signing the deal?' },
        { type: 'text', heading: 'Core Idea', body: 'An investment thesis that never considers the exit is incomplete — returns are realized at exit, and a business can be great to own and still hard to sell well (narrow buyer pool, unclear next owner, scale mismatch). Common exit routes: strategic sale to a larger player, sponsor-to-sponsor sale, or IPO once scale/profile support public markets.' },
        { type: 'visual', visual: { type: 'bar-compare', title: 'Illustrative exit-route attractiveness by scale', unit: '', categories: ['Strategic sale', 'Sponsor-to-sponsor', 'IPO'], series: [{ label: 'Smaller platform today', values: [7, 5, 1] }, { label: 'After scaling (hypothetical)', values: [6, 6, 7] }] } },
        { type: 'example', heading: 'Real Example', body: "Gong cha is TA Associates' exit (to Bain) after a 7-year hold — a sponsor-to-sponsor sale. That tells you one real exit route exists (other PE firms buying scaled consumer brands); Bain's own eventual exit will need a credible next buyer once Gong cha is larger again." },
        { type: 'counterexample', heading: 'Counterexample / Limitation', body: "Don't treat exit multiple assumptions as free optimism — assuming you'll sell for more than you paid, for no stated reason, is exactly the \"relies on multiple expansion\" error this Sprint's error log tracks." },
        { type: 'text', heading: 'Application', emphasis: true, body: 'For FDH Aero, name a plausible next owner in 5 years and explain, in one sentence, why they would want it then and not now.' },
        { type: 'takeaway', body: 'A thesis isn\'t complete until it names a credible next owner — exit is part of underwriting, not an afterthought.' },
      ],
      strategicQuestion: 'For the deal you find most interesting in this Sprint, who is the most credible buyer at exit, and why them specifically?',
      nextConnections: [{ label: 'Strategy vs. Investment Judgment' }],
    },
  ],

  lboDrills: [
    {
      id: 'lbo-l1-a', level: 'Level 1', title: 'Flat-multiple base case',
      inputs: { revenue: 500, ebitdaMargin: 0.20, entryMultiple: 12, debtPct: 0.5, ebitdaGrowthPct: 0.10, years: 5, exitMultiple: 12, paydownPct: 0 },
      prompt: 'Revenue $500M, EBITDA margin 20%, entry multiple 12x, 50% debt financing, EBITDA grows 10% annually for 5 years, exit multiple 12x (flat vs. entry). Work through purchase price, equity invested, exit equity, and MOIC.',
    },
    {
      id: 'lbo-l1-b', level: 'Level 1', title: 'Multiple compression stress test',
      inputs: { revenue: 300, ebitdaMargin: 0.25, entryMultiple: 10, debtPct: 0.55, ebitdaGrowthPct: 0.08, years: 4, exitMultiple: 8, paydownPct: 0 },
      prompt: 'Revenue $300M, EBITDA margin 25%, entry multiple 10x, 55% debt, EBITDA grows 8% annually for 4 years, but exit multiple compresses to 8x. What happens to the return?',
    },
    {
      id: 'lbo-l2-a', level: 'Level 2', title: 'Growth + debt paydown',
      inputs: { revenue: 400, ebitdaMargin: 0.22, entryMultiple: 11, debtPct: 0.6, ebitdaGrowthPct: 0.12, years: 5, exitMultiple: 11, paydownPct: 0.4 },
      prompt: 'Revenue $400M, EBITDA margin 22%, entry multiple 11x, 60% debt, EBITDA grows 12% annually for 5 years, exit multiple flat at 11x, and 40% of the original debt is paid down by exit. How much of the return comes from deleveraging vs. growth?',
    },
  ],

  cases: [
    {
      id: 'dental-rollup-2026',
      title: 'Would You Invest? A Dental-Services Rollup',
      sector: 'Healthcare Services',
      difficulty: 'Hard',
      suggestedTimeMin: 40,
      prompt: 'A dental-services rollup is raising capital. It has grown revenue 20% annually, driven by an aggressive acquisition strategy of independent dental practices. EBITDA margin is 15%. The market is highly fragmented, with high dentist/clinician turnover reported across the industry.\n\nWould you invest? At what price, if any? Defend your recommendation — what has to be true for it to be right, and what would make you walk away?',
      exhibits: [
        'Revenue growth: 20% annually for the past 3 years.',
        'EBITDA margin: 15%, roughly flat over the same period despite revenue growth.',
        'Growth composition: majority of revenue growth has come from new-clinic acquisitions rather than same-store growth at existing locations (reported, not independently verified).',
        'Industry-wide clinician (dentist/hygienist) turnover is reported as high across the dental-services-rollup sector generally.',
        'Market structure: highly fragmented, with thousands of independent single-location practices as potential acquisition targets.',
        'No data provided yet on customer (patient) retention, same-store sales growth specifically, integration costs, or acquisition multiples being paid for targets — these are open diligence questions, not disclosed facts.',
      ],
      _category: 'business-quality-vs-price',
    },
  ],

  // 60-second IC mode (Part "60-Second IC Mode") — self-graded, no new AI call needed, mirrors
  // Strategy Review's reveal-then-self-rate interaction pattern.
  ic60Scenarios: [
    {
      id: 'ic60-tea', snapshot: 'A global bubble-tea franchise — ~2,200 stores, 33 markets, 150M+ drinks/year — is for sale by its PE owner of 7 years. The partner walks into the elevator. 60 seconds. Would you invest?',
      modelAnswer: 'Lean yes, conditionally. The franchise model (royalty economics, low capex) and a clear, quantifiable U.S. white-space gap (240 of a stated 1,000-store ambition) make this a credible growth story, not just a mature-brand flip. The key risk is franchisee concentration and category fashion risk — I\'d want franchisee-level economics before committing, and I\'d size the price against how much of the U.S. gap is realistically achievable in a normal hold period, not the full 1,000.',
    },
    {
      id: 'ic60-aero', snapshot: 'An aerospace & defense parts distributor has done 12 acquisitions in 8 years under its current PE owner, who is bringing in a new majority investor rather than fully exiting. 60 seconds. Would you invest?',
      modelAnswer: 'Lean yes. A continuing (not exiting) existing owner is a real signal the playbook still has room to run, and the buy-and-build thesis in a fragmented market is the clearest, most testable growth lever here. My biggest concern is whether the acquisition pace is sustainable as the platform gets bigger — integration risk compounds, and the pool of attractive, reasonably-priced targets shrinks. I\'d diligence the last 3 acquisitions\' actual integration outcomes before trusting the next 12.',
    },
  ],

  // Weeks 2-6 exist as a visible roadmap only — no authored content yet, mirroring exactly how
  // Strategy's own Phases 6-10 are placeholder-status. The adaptive recommender never routes
  // into these; they are purely a visible "what's coming" list on Sprint Home.
  roadmap: [
    { week: 1, name: 'Investor Mindset + Bain Capital', status: 'authored' },
    { week: 2, name: 'Business Quality + Returns', status: 'placeholder' },
    { week: 3, name: 'Deal Reverse-Engineering (Deep Dive)', status: 'placeholder' },
    { week: 4, name: 'Investment Cases', status: 'placeholder' },
    { week: 5, name: 'Written Case + CIM', status: 'placeholder' },
    { week: 6, name: 'Interview Simulation', status: 'placeholder' },
  ],
};
