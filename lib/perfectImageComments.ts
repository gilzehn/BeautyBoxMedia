// Analyst commentary for the Perfect Image Amazon diligence dashboard.
//
// These are findings, not suggestions: each one states what the data shows,
// names the file it comes from, and carries the consequence. Stance is
// recorded honestly - the notes that help the seller are marked as such and
// stay on the page, because a one-sided deck gets discounted on sight.

export type Stance = 'verified' | 'buyer' | 'seller' | 'flag' | 'ask' | 'withdrawn';

export type SectionId =
  | 'headline'
  | 'products'
  | 'removed'
  | 'enforcement'
  | 'danger'
  | 'inventory'
  | 'conclusions';

export interface Comment {
  id: string;
  section: SectionId;
  stance: Stance;
  title: string;
  body: string;
  evidence?: string;
  figure?: string;
  /** Internal-only: our own posture or price working. Hidden in the seller-facing view. */
  internal?: boolean;
}

export const STANCE_LABEL: Record<Stance, string> = {
  verified: 'Ties out',
  buyer: 'Against price',
  seller: 'For the seller',
  flag: 'Unconfirmed',
  ask: 'Diligence ask',
  withdrawn: 'Withdrawn',
};

export const SECTIONS: { id: SectionId; n: number; title: string; answers: string }[] = [
  { id: 'headline', n: 1, title: 'Headline: sales, spend, organic', answers: 'What happened at the top line' },
  { id: 'products', n: 2, title: 'Product breakdown, 2026 vs 2025', answers: 'Where it happened' },
  { id: 'removed', n: 3, title: 'What changed: products removed', answers: 'What broke' },
  { id: 'enforcement', n: 4, title: 'Enforcement: notifications and account health', answers: 'Why it broke' },
  { id: 'danger', n: 5, title: 'Still in danger, and why', answers: 'What breaks next' },
  { id: 'inventory', n: 6, title: 'Inventory: liquidations and disposals', answers: 'What the physical evidence confirms' },
  { id: 'conclusions', n: 7, title: 'Conclusions', answers: 'So what' },
];

export const comments: Comment[] = [
  // --- 1. Headline ------------------------------------------------------
  {
    id: 'c-tie-out',
    section: 'headline',
    stance: 'verified',
    title: 'The 2025 Amazon revenue line ties to the cent',
    figure: '0.01% variance',
    body:
      'Settlement gross product sales for calendar 2025 are $973,483.85 against $973,364 on the P&L Amazon line - a $120 variance. This is the first independent verification of any revenue figure in this deal and it passes. It raises confidence in the 2024-2025 P&L generally and narrows the remaining doubt onto the 2026 stub and the cost lines.',
    evidence: 'Payment_Reports.csv, 62,069 settlement lines · P&L 2025',
  },
  {
    id: 'c-basis',
    internal: true,
    section: 'headline',
    stance: 'flag',
    title: 'Never compare $973,484 to $629,356',
    body:
      'They are different period lengths. Every year-over-year figure on this page uses one of two stated bases and each chart says which: like-for-like Jan-Jul ($578,827 vs $615,776, -6.0%) or run rate (May-Jul 2026 x 4 = $904,871 vs FY2025, -7.0%). Our own 16 Aug analysis annualized at x12/7 and read a 12.1% decline. That was wrong. The honest number is -6%, and it is still a decline in the largest channel.',
    evidence: 'Correcting our own record before the seller does',
  },
  {
    id: 'c-price-masking',
    section: 'headline',
    stance: 'buyer',
    title: 'Price is holding the revenue line up, not demand',
    figure: 'Units -13.8% vs revenue -6.0%',
    body:
      'Jan-Jul like-for-like, revenue is down 6.0% and units are down 13.8%, with average selling price up 9.1% from $26.30 to $29.20. Volume is falling at twice the rate of revenue, and the advertising figures now point the same way: ad spend rose 10% in eight months against a full prior year while units fell. Price and paid media are both holding the revenue line up. Demand is not.',
    evidence: 'Settlement units, Jan-Jul 2025 vs Jan-Jul 2026',
  },
  {
    id: 'c-organic',
    section: 'headline',
    stance: 'buyer',
    title: 'Organic sales fell 25.9%. The revenue that remains is increasingly bought',
    figure: 'Organic 68.1% → 53.1% of gross',
    body:
      'With both sides of 2026 measured, organic is $334,390 against $451,406 on the same Jan – 20 Aug window a year earlier, a 25.9% fall, while ad-attributed sales rose 39.2% to $294,966. Nearly half of Amazon revenue is now paid for, against under a third in 2025. The unpaid demand that a buyer is really acquiring — the part that transfers without a media budget — shrank by roughly $117,000 in eight months while the top line moved only 5.1%. This is the same story the unit line tells, and it is now visible in two independent measures.',
    evidence: 'Seller-supplied PPC sales and spend, both years',
  },
  {
    id: 'c-99k',
    section: 'headline',
    stance: 'verified',
    title: 'Answered: the $99,000 is spend, and the seller has now given the sales figure too',
    figure: '$99,000 spend · $294,966 attributed sales',
    body:
      'The open question is closed. 2026 to 20 Aug: Amazon ad spend $99,000 against $294,965.88 of ad-attributed sales. Both sides of 2026 are now measured, as 2025 already was ($90,000 against $311,000), so organic is a subtraction on both years and every advertising figure on this page is stated rather than inferred. The answer is the unfavourable one: it moves the advertising problem out of Shopify and into Amazon, and it reverses the organic finding.',
    evidence: 'Seller confirmation · supersedes ask 7a',
  },
  {
    id: 'c-organic-withdrawn',
    section: 'headline',
    stance: 'withdrawn',
    title: 'Withdrawn: organic +17.5%, and the paid-cannibalisation read that went with it',
    body:
      'The earlier version of this dashboard read the 2026 $99,000 as ad-attributed sales, which made organic $530,356 (84.3% of gross, +17.5% like-for-like) and paid sales look halved. On the confirmed figures none of that holds: organic is $334,390 (53.1%), down 25.9%, and paid sales rose 39.2%. Withdraw the branded-search cannibalisation reading with it — it was built on the same misreading. Do not circulate the earlier version.',
    evidence: 'Restated 31 Aug 2026 on the seller\u2019s confirmation',
  },
  {
    id: 'c-shopify',
    section: 'headline',
    stance: 'buyer',
    title: 'Amazon is still the cheaper channel, but the gap has halved and it is closing from the wrong end',
    figure: 'Shopify TACOS 32.9% → 29.8% · Amazon 9.2% → 15.7%',
    body:
      'With Amazon spend confirmed at $99,000, non-Amazon advertising in the 2026 stub is $117,016 against $393,278 of Shopify revenue — an implied 29.8% TACOS, not the ~47.6% carried on the inferred figure. Shopify acquisition cost is roughly flat, and slightly improved. The deterioration is on Amazon: TACOS 9.2% to 15.7%, ROAS 3.46x to 2.98x, ACOS 28.9% to 33.6%. The channel that was the efficient one is the one that moved. Shopify at ~30% TACOS against a 55-67% gross margin is still thin, and still needs the monthly spend detail to confirm, but it is no longer the largest open question in the deal.',
    evidence: 'P&L advertising line less confirmed Amazon spend',
  },
  {
    id: 'c-6vs7',
    section: 'headline',
    stance: 'flag',
    title: 'The P&L "seven month" Amazon figure is six months of trading',
    body:
      'Cumulative 2026 settlement gross reaches $499,026 - the P&L stub figure - on 30 June 2026 at 21:12 PST. Seven months of Amazon revenue is $578,827. Either the whole 2026 column is a six-month period mislabelled, in which case every annualization on both sides is wrong by 14% and in the seller’s favour, or Amazon alone is booked on a lagging cash basis. Ask for the 2026 general ledger, Amazon revenue account, by month.',
    evidence: 'Settlement cumulative vs P&L 2026 stub',
  },

  // --- 2. Products ------------------------------------------------------
  {
    id: 'c-two-skus',
    section: 'products',
    stance: 'buyer',
    title: 'Strip out the two growing SKUs and the catalogue is down ~15%',
    figure: 'Glycolic 70% +162% · Salicylic 30% +82%',
    body:
      'Glycolic 70% (B0DS6QCFST) and Salicylic 30% (B0DR68Y3RH) together add $84,551 of run rate over FY2025 and are the entire 2026 Amazon stabilization. Both sit exactly on Amazon’s published concentration caps - glycolic ≤70%, salicylic ≤30% - the same line that has already destroyed three of their siblings. The rest of the Amazon catalogue is down roughly 15% year over year.',
    evidence: 'Per-ASIN settlement revenue, Appendix A',
  },
  {
    id: 'c-concentration',
    section: 'products',
    stance: 'buyer',
    title: 'Concentration is worse than the seller’s materials suggest',
    figure: '60.7% in one variation family',
    body:
      'Share of 20-month ordered sales: Glycolic 50% 33.0%, Glycolic 30% 17.7%, top two ASINs 50.7%, and the glycolic parent family B0CYHNDQ94 at 60.7%. A parent-level suppression - the mechanism Amazon used on the lactic and salicylic families - is a single-event 60% revenue loss. The seller’s report does not disclose ASIN-level concentration.',
    evidence: 'BusinessReport-8-22-26.csv, 36 parent/child rows',
  },
  {
    id: 'c-lactic-line',
    section: 'products',
    stance: 'buyer',
    title: 'The Lactic 50% row is the single most persuasive line in this file',
    body:
      'Expand B006ZBP8NM and the monthly series runs flat at zero from January 2026 onward. It is a lactic 50% product against a 45% lactic cap - over the line on its face - and the seller’s own listing materials present it as a flagship asset. $76,267 of FY2025 revenue, ruling final.',
    evidence: 'products[].monthly, B006ZBP8NM',
  },

  // --- 3. Removed -------------------------------------------------------
  {
    id: 'c-zeroes',
    section: 'removed',
    stance: 'buyer',
    title: 'Five SKUs at zero, every one by enforcement',
    figure: '$111,678 · 11.5% of the channel',
    body:
      'None of this was lost to competition, price or a listing that stopped converting. Five ASINs carrying $111,678 of FY2025 revenue - 11.5% of the 2025 Amazon channel - are now $0, and each has a policy notice attached to it. That is the distinction that matters in valuation: competitive decline can be worked; a platform ruling cannot be out-executed.',
    evidence: 'Account_Health.xlsx · Performance_Notifications.xlsx',
  },
  {
    id: 'c-relisted',
    section: 'removed',
    stance: 'buyer',
    title: 'The one that came back came back impaired',
    figure: '-23% below its pre-removal level',
    body:
      'Salicylic 20% (B006ZA0A5Y) was removed 20 Nov 2025, went dark for three and a half months and was relisted in March 2026 at roughly $5.6K/month against a ~$7.9K prior run rate. Recovery is possible on this platform and it is not full. Ask for the remediation record: what was submitted to get it back, and whether the same path is open for the Lactic 50% and Salicylic 10%.',
    evidence: 'Monthly settlement, B006ZA0A5Y',
  },

  // --- 4. Enforcement ---------------------------------------------------
  {
    id: 'c-sweeps',
    section: 'enforcement',
    stance: 'buyer',
    title: 'Amazon enforces in sweeps, by ingredient and claim pattern',
    figure: '6 ASINs cited across three days in Oct 2024',
    body:
      'Six skin-lightening ASINs were cited on 24, 26 and 31 October 2024 - not one listing at a time. Two of the six are dead; four are still selling $101,498 of run rate on citations that were never resolved. The exposure follows product families, so the right unit of analysis is the ingredient and the claim, not the ASIN.',
    evidence: 'violations[] · listing_status_events[]',
  },
  {
    id: 'c-amazon-agrees',
    section: 'enforcement',
    stance: 'verified',
    title: 'Our per-ASIN revenue work agrees with Amazon’s own numbers',
    figure: '0.6% match on B007004PZO',
    body:
      'Amazon’s at-risk figure is trailing-twelve-month sales for the ASIN. On B007004PZO it reads $28,308 against our computed $28,471; on B08972Y9C8, $50 against $40. The per-ASIN build in section 2 is verified against the platform’s own dashboard, not just against seller-supplied files.',
    evidence: 'Account health screen, 31 Aug 2026',
  },
  {
    id: 'c-unfiled',
    section: 'enforcement',
    stance: 'buyer',
    title: 'Three appeals have never been filed',
    body:
      'All three jurisdictional restrictions sit at "Your submission is required." The 29 Jul item is over a month old and the 07 Aug item carries $28,308 of trailing sales with no response lodged. Either the owner is not monitoring account health, or he has judged the products unfixable, or he is deliberately not creating a paper trail during a sale process. Ask which, directly, and in writing.',
    evidence: 'Appeal status column, account health screen',
  },
  {
    id: 'c-closed',
    section: 'enforcement',
    stance: 'buyer',
    title: 'Two are closed rulings, not appeals in flight',
    figure: '$48,296 of trailing sales ruled on and lost',
    body:
      'B06XY9XL5H and B006ZBP8NM both read "evaluation is complete" with the listings still removed. Amazon has ruled. This removes the seller’s natural rebuttal - that it is all pending and will clear - on the two largest realized losses.',
    evidence: 'Account health screen, rows 4 and 5',
  },
  {
    id: 'c-stale',
    section: 'enforcement',
    stance: 'flag',
    title: 'The seller’s export was stale on arrival',
    body:
      'Account_Health.xlsx ends 07 Aug 2026. A thirteenth violation landed 27 Aug 2026 - four days before this analysis, and after every file the seller sent - against B08972Y9C8, now cited three times in twenty-two months (Oct 2024, Dec 2025, Aug 2026) for a title containing "Skin Brightening" over an ingredient list led by kojic acid and arbutin. Whatever was pulled is not the current state of the account. Ask for a live screen-share, not another export.',
    evidence: 'Account health screen vs Account_Health.xlsx',
  },
  {
    id: 'c-ahr',
    section: 'enforcement',
    stance: 'seller',
    title: 'Account Health Rating is unaffected - and that is the problem',
    body:
      'AHR impact reads "No impact" on all five restricted-product rows. That is genuinely favourable: the account is not at suspension risk and a buyer inherits a healthy one. Say so plainly. Then state the consequence: every dollar of damage was done at ASIN level while the headline metric stayed green. AHR is useless as an early-warning system for this business, and "no impact on account health" is not evidence that none of this matters. Three SKUs are at zero and the rating never moved.',
    evidence: 'AHR impact column, all five rows',
  },
  {
    id: 'c-jurisdiction',
    section: 'enforcement',
    stance: 'buyer',
    title: '"Jurisdictionally restricted" is the softer outcome, and it is the one trending',
    body:
      'The three 2026 state-law citations block a listing in specific jurisdictions rather than removing it globally, which is why B007004PZO still sells ~$2,200/month. That does not make the finding smaller. Washington was first to enforce and more states have comparable cosmetic-ingredient statutes taking effect; each additional jurisdiction removes another slice of the same SKUs. The trajectory is a widening geographic exclusion on the cleanser line.',
    evidence: 'WA Toxic-Free Cosmetics Act citations, Jul-Aug 2026',
  },

  // --- 5. Danger --------------------------------------------------------
  {
    id: 'c-exposure',
    section: 'danger',
    stance: 'buyer',
    title: 'A third of the run rate sits on the same fault line',
    figure: '$277,054 · 30.6% of Amazon',
    body:
      'At-cap but uncited $148,852, skin-lightening family still selling $101,498, cited and still selling under state restriction $26,704. Only the clean bucket is genuinely insulated, and even the flagship Glycolic 50% carries therapeutic peel copy of the kind FDA cited in its July 2024 sweep. This is ~15% of total company revenue exposed to a decision by a counterparty neither side controls.',
    evidence: 'exposure_buckets[] against the $904,871 run rate',
  },
  {
    id: 'c-two-numbers',
    section: 'danger',
    stance: 'verified',
    title: 'Both exposure numbers are right; they count different things',
    figure: '$76,654 vs $277,054',
    body:
      'Amazon’s dashboard total counts only ASINs that already carry a live violation - that is realized and pending damage the platform itself acknowledges. Ours adds the two SKUs sitting exactly at the caps with no citation yet ($148,852), which Amazon has no reason to flag until it acts. They are not in conflict, and both belong in the negotiation.',
    evidence: 'Reconciliation, addendum §4',
  },
  {
    id: 'c-scenario',
    internal: true,
    section: 'danger',
    stance: 'buyer',
    title: 'If the Glycolic 70% measures 70.4%, the growth story goes with it',
    figure: '$104,602 of run rate',
    body:
      'The at-cap bucket is the default scenario on this page for a reason: it is the only bucket where a single lab number decides the outcome. Total loss is not the base case - but three realized zeroes in twenty-two months, against SKUs no further over the line than the ones still selling, makes a probability-weighted haircut of $140,000-$190,000 defensible and makes formulation compliance a condition precedent, not a rep. Full realization of the exposed run rate is roughly $139,000 of SDE, about $346,000 of value at 2.5x.',
    evidence: 'Contribution at 2026 gross margin, advertising flexed',
  },

  // --- 6. Inventory -----------------------------------------------------
  {
    id: 'c-liquidations',
    section: 'inventory',
    stance: 'buyer',
    title: 'The seller’s own conduct values dead stock at approximately nothing',
    figure: '$251.93 from 142 events',
    body:
      '142 liquidation events across six products returned $251.93 in total proceeds - and the products liquidated are the compliance-hit ones: Lactic 50%, Glycolic 70%, Salicylic 30%, Hydro-Glo 10%, Tri-Clarity, application pads. This is the argument for the 50-100% haircut past six months on the $250K of inventory in the ask, made out of the seller’s own behaviour rather than our assumption.',
    evidence: 'liquidations[], settlement data',
  },
  {
    id: 'c-disposals',
    section: 'inventory',
    stance: 'buyer',
    title: 'Stock is being actively withdrawn from FBA, not routinely tidied',
    figure: '491 disposal fees · 215 removal returns',
    body:
      'The disposal and removal-return events cluster around the enforcement dates, and 171 of them land in January 2026 alone - the month after the Lactic 50% removal. Disposals here are a compliance consequence, and they corroborate the removal timeline independently of the notification files.',
    evidence: 'removal_orders_by_month[] · fba_fees[]',
  },
  {
    id: 'c-storage',
    section: 'inventory',
    stance: 'flag',
    title: 'Storage fees are implausibly low - where is the $250K?',
    figure: '$487 over 20 months, 0.03% of revenue',
    body:
      'On $1.6M of throughput, FBA storage of $487 against a 1-2% norm means either inventory is held extremely lean or storage is billed outside these settlements. Combined with zero inventory on the balance sheet and a $250K inventory ask, the question is specific: where is the $250K, how old is it, and how much of it is formulations Amazon has already banned? Also note $12,224 of net FBA reimbursement adjustments over twenty months (~$7,300/yr) - non-operating income if it has been booked to revenue.',
    evidence: 'fba_fees[] · adjustments[]',
  },

  // --- 7. Conclusions ---------------------------------------------------
  {
    id: 'c-bridge',
    section: 'conclusions',
    stance: 'buyer',
    title: 'The SDE bridge, restated on confirmed spend: the inventory finding now carries it alone',
    figure: 'Underlying −$72,177',
    body:
      'The earlier bridge credited $45,177 of annualized Amazon ad-cost reduction to 2026. That item is gone — spend rose from $90,000 to $99,000 in eight months, roughly $142,000 annualized on the run-rate basis. Non-operating contribution is now the $154,537 of product-cost understatement and inventory drawdown alone, against an $82,360 actual SDE improvement: underlying deterioration of $72,177. Smaller than the $117,354 we carried, and resting entirely on the inventory finding, which raises the stakes on the contract-manufacturing documents further. Note the direction of the correction is against us on size and for us on quality — the higher ad spend is a real operating cost the seller absorbed, and the improvement still does not come from trading.',
    evidence: 'SDE bridge, restated on confirmed 2026 spend',
  },
  {
    id: 'c-position',
    internal: true,
    section: 'conclusions',
    stance: 'buyer',
    title: 'The range does not move. The composition does',
    figure: '$1.26-1.56M all-in',
    body:
      'Restating the Amazon decline from -12.1% to -6.0% helps the seller and removes a bad argument from our side. The compliance finding is large enough to substitute for it, and it is the finding the seller can least easily rebut, because it comes out of their own account. Opening posture unchanged at $1.15M plus inventory at count; the walk-away above $1.6M now has a second independent basis.',
    evidence: 'Net effect on position, addendum §9',
  },
  {
    id: 'c-well-run',
    section: 'conclusions',
    stance: 'seller',
    title: 'The listing operation is well run. The exposure is regulatory, not operational',
    body:
      'Buy box 96-99% with no hijackers, refund rate 3-5% stable over twenty months, 10.2% blended conversion with the flagship at 9.2%, one A-to-z claim and one chargeback across ~58,000 units, and August 2026 tracking +6.3% on August 2025. None of the damage in this file came from how the account is operated. We are arguing about price, not about whether this is a bad business.',
    evidence: 'BusinessReport-8-22-26.csv, 20-month averages',
  },

  // --- Diligence asks ---------------------------------------------------
  {
    id: 'ask-coa',
    section: 'conclusions',
    stance: 'ask',
    title: '1. Third-party COAs on every live SKU against the caps',
    figure: '$277,054 turns on it',
    body:
      'Measured acid concentrations against lactic ≤45%, glycolic ≤70%, salicylic ≤30%. Highest-priority document in the deal alongside the manufacturing agreement, and a condition precedent rather than a representation.',
  },
  {
    id: 'ask-shopify',
    section: 'conclusions',
    stance: 'ask',
    title: '2. Shopify, Meta and Google spend, monthly, 24 months, reconciled to the GL',
    body:
      'The implied Shopify TACOS of 32.9% rising to ~47.6% is the largest open question in the deal after manufacturing cost. If it holds, the growth being capitalised at 3.5x is close to contribution-neutral.',
  },
  {
    id: 'ask-99k',
    section: 'conclusions',
    stance: 'ask',
    title: '2a. Amazon Advertising console reports, monthly by campaign type, 2024–2026',
    body:
      'The headline ad question is answered — $99,000 of 2026 spend against $294,966 of attributed sales — so this becomes confirmation rather than discovery: the console export behind those two figures, monthly and by campaign type, plus what the spend increase was buying. Defensive branded spend against a shrinking organic base reads differently from launch spend behind the two growth SKUs, and the two point to different forward budgets for a buyer.',
  },
  {
    id: 'ask-health',
    section: 'conclusions',
    stance: 'ask',
    title: '3. Full account health screen-share, all categories, current',
    body:
      'The AHR score itself, ODR, policy compliance score, IPI and late shipment rate - not the Restricted Products filter, and not another export, which was already missing the 27 Aug 2026 citation.',
  },
  {
    id: 'ask-appeals',
    section: 'conclusions',
    stance: 'ask',
    title: '4. Why three appeals are unfiled, in writing',
    body:
      'B007004PZO (07 Aug), B0896YSTL6 (29 Jul) and B08972Y9C8 (27 Aug) all sit at "submission required". Only B007004PZO still carries revenue. If they are appealable, file them before close and make the outcome a condition; if not, we need to know why.',
  },
  {
    id: 'ask-inventory',
    section: 'conclusions',
    stance: 'ask',
    title: '5. Inventory count by SKU, non-compliant formulations valued at zero',
    body:
      'Broken out by SKU with age, and with the banned formulations identified separately. The 10% holdback should explicitly cover stock of any SKU banned or reformulated within 12 months of close.',
  },
];

export const commentsFor = (section: SectionId): Comment[] =>
  comments.filter((c) => c.section === section);
