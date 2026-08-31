// Analyst commentary for the Perfect Image Amazon diligence dashboard.
//
// These are findings, not suggestions: each one states what the data shows,
// names the file it comes from, and carries the consequence. Stance is
// recorded honestly - the notes that help the seller are marked as such and
// stay on the page, because a one-sided deck gets discounted on sight.

export type Stance = 'verified' | 'buyer' | 'seller' | 'flag' | 'ask';

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
      'Jan-Jul like-for-like, revenue is down 6.0% and units are down 13.8%, with average selling price up 9.1% from $26.30 to $29.20. Volume is falling at twice the rate of revenue. We can no longer say the advertising cut is the mechanism - paid sales halved while organic grew - but the unit trend stands on its own and it is the trend a buyer inherits.',
    evidence: 'Settlement units, Jan-Jul 2025 vs Jan-Jul 2026',
  },
  {
    id: 'c-organic',
    section: 'headline',
    stance: 'seller',
    title: 'Organic sales are measured, and they grew while paid halved',
    figure: 'Organic +17.5% like-for-like',
    body:
      'Organic is gross minus ad-attributed sales - a subtraction, not a model. It is 68.1% of 2025 revenue rising to 84.3% in 2026, and in dollars it rose from $451,406 to $530,356 (+17.5%) while paid sales fell 53.3%. The obvious read is that a meaningful share of 2025 spend was buying clicks on branded searches it would have won anyway. That is a real efficiency finding, it is a brand asset that transfers with the business, and the seller is entitled to it. Concede it plainly; it costs us nothing and buys credibility for the enforcement section.',
    evidence: 'Seller-supplied PPC sales, corrected 31 Aug 2026',
  },
  {
    id: 'c-99k',
    section: 'headline',
    stance: 'flag',
    title: 'One sentence from the seller decides where the advertising problem sits',
    body:
      'The seller has confirmed the 2025 $311,000 is PPC sales against $90,000 of spend. He has not said which metric the 2026 $99,000 is. Read as sales - the symmetric reading used here - paid halved, organic grew and spend fell to roughly $45,000 annualized. Read as spend, Amazon TACOS goes from 9.2% to 15.7%, annualized spend rises 72% while revenue fell 6%, and the implied Shopify TACOS drops to 29.8%. Both readings are unfavourable, in different places. The 2026 paid/organic split on this page carries an unconfirmed marker until it is answered.',
    evidence: 'Open question, ask 7a',
  },
  {
    id: 'c-shopify',
    section: 'headline',
    stance: 'buyer',
    title: 'Amazon is the efficient channel. Shopify is bought at fifty cents on the dollar',
    figure: 'Implied Shopify TACOS 32.9% → 47.6%',
    body:
      'Subtracting Amazon from the P&L blended advertising line is the only channel split we have. Non-Amazon advertising was $148,869 against $452,096 of Shopify revenue in 2025 (32.9%), and roughly $187,366 against $393,278 in the 2026 stub (~47.6%). At a 55-67% gross margin, a 47.6% TACOS leaves single-digit contribution before any other cost. The seller’s headline growth story is Shopify at +49%; if this holds, that growth is close to contribution-neutral and cannot carry a 3.5x multiple. The 2026 Amazon spend inside this split is inferred at a constant 28.9% ACOS - confirm against console invoices before it goes in front of anyone.',
    evidence: 'P&L advertising line less Amazon spend',
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
    title: 'The 2026 earnings improvement is more than fully explained by non-operating effects',
    figure: 'Underlying -$117,354',
    body:
      'Amazon ad-cost reduction of ~$45,177 annualized plus $154,537 of product-cost understatement and inventory drawdown gives $199,714 of non-operating contribution against an $82,360 actual SDE improvement. The conclusion survives the advertising correction, but it now rests almost entirely on the inventory finding rather than on advertising - which raises the stakes on the contract-manufacturing documents.',
    evidence: 'SDE bridge, restated 31 Aug 2026',
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
    title: '2a. Is the 2026 $99,000 ad sales or ad spend?',
    body:
      'One sentence. It decides whether the advertising problem sits in Shopify or in Amazon, and it is the only unconfirmed figure on the front page of this dashboard.',
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
