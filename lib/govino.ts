/**
 * govino on Amazon: monthly performance, 2026 against 2025.
 *
 * Source: Amazon Selling Partner + Advertising data warehoused in BigQuery
 * (project `amzbi-418608`, dataset `amazon_source_data`), account
 * "The Beauty Box Seller US" (account_id 1614310, seller A2IJCZCJ7EX3N7, US).
 *
 * govino is a brand *inside* the Beauty Box seller account, not an account of
 * its own, so every figure below is scoped to the 44 child ASINs carrying
 * brand_name = 'govino' in catalog_item_summary. The brand name is stored in
 * mixed case ('govino' and 'Govino'), so the scoping filter lowercases it.
 *
 *   Revenue / units / sessions
 *     sellercentral_salesandtrafficbychildasin_report. "Revenue" is
 *     `ordered_product_sales_amt`: total ordered product sales, every order,
 *     advertised or not.
 *
 *   Spend / ad-attributed sales
 *     ad_sponsoredproducts_productads_report + ad_sponsoreddisplay_productads_report,
 *     each joined through its productads dimension table to restrict to govino
 *     ASINs. Attribution is Amazon's 14-day click window.
 *
 *     This SP+SD definition was reverse-engineered from, and reconciles to, the
 *     legacy "Govino Monthly" Google Sheet the brand has been receiving: Mar
 *     through Jul 2026 match that sheet's Spend, PPC Sales and Gross sales rows
 *     to the dollar. Sponsored Brands is included in the definition for
 *     completeness but govino has run none of it in either year, so it
 *     contributes nothing.
 *
 *   Branded vs generic
 *     ad_sponsoredproducts_keywordsearchterm_report +
 *     ad_sponsoredproducts_autosearchterm_report, restricted to campaigns that
 *     serve govino ASINs. "Branded" is any customer search term matching
 *     /go\s?vino/. Coverage note: these two reports carry 92% of Sponsored
 *     Products spend; the remainder is product/ASIN targeting, which has no
 *     search term to classify, and Sponsored Display is excluded for the same
 *     reason. So the branded/generic panel describes keyword and auto
 *     targeting, not the whole ad account.
 *
 * Pulled and verified 2026-09-11. Sales data is complete through 2026-09-08 and
 * ad data through 2026-09-09, so September 2026 is a partial month and is kept
 * out of every comparison below. The reporting window is January to August,
 * complete on both sides.
 */

export interface MonthRow {
  /** Calendar month, 1-12. */
  m: number;
  /** Short axis/column label. */
  label: string;
  /** Sponsored Products + Sponsored Display cost. */
  spend: number;
  /** Sales Amazon attributes to an ad click within 14 days. */
  ppcSales: number;
  /** Total ordered product sales, advertised and organic. */
  gross: number;
  units: number;
  orders: number;
  sessions: number;
  clicks: number;
  impressions: number;
}

const L = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const row = (
  m: number,
  spend: number,
  ppcSales: number,
  gross: number,
  units: number,
  orders: number,
  sessions: number,
  clicks: number,
  impressions: number,
): MonthRow => ({ m, label: L[m - 1], spend, ppcSales, gross, units, orders, sessions, clicks, impressions });

/**
 * August 2026 ad spend, set by hand rather than taken from the warehouse.
 *
 * BigQuery reports $12,662.00 for August across Sponsored Products ($12,567.95)
 * and Sponsored Display ($94.05), scoped to the govino ASINs the same way every
 * other month here is. The figure below was supplied by Beauty Box Media and
 * replaces it, a difference of $2,984.00.
 *
 * It is kept as a named constant, with the warehouse figure recorded beside it,
 * so the override is visible to anyone reading or updating this file rather
 * than buried in a data row. ACOS and TACOS for August, and every aggregate
 * that includes August (the Jan-Aug totals and the Q3 pair), are computed from
 * this number, so the whole page stays internally consistent.
 *
 * If the intent was only ever to restate the client-facing spend, the reported
 * figure is still here to reconcile against. Whoever refreshes this file next
 * should decide whether the override still applies before re-pulling.
 */
export const AUG_2026_SPEND = 9678;
/** What BigQuery actually reports for the same month and scope. */
export const AUG_2026_SPEND_REPORTED = 12662.0;

export const MONTHS_2025: MonthRow[] = [
  row(1, 979.87, 4640.52, 9439.22, 355, 295, 3449, 1503, 424900),
  row(2, 1714.5, 5705.97, 11611.85, 522, 431, 3828, 2017, 381353),
  row(3, 2086.21, 5521.25, 12195.53, 505, 381, 4639, 1745, 266896),
  row(4, 3201.76, 10317.73, 19792.73, 872, 674, 6312, 3223, 488591),
  row(5, 1489.06, 7296.12, 19311.31, 680, 512, 5456, 1451, 220941),
  row(6, 5127.17, 17352.58, 29167.41, 968, 797, 7716, 4014, 667092),
  row(7, 5923.26, 22344.3, 40184.36, 1559, 1325, 8886, 4304, 702403),
  row(8, 5496.41, 15102.69, 29866.66, 1075, 918, 6555, 3341, 620305),
  row(9, 5497.66, 14815.75, 30551.52, 1121, 946, 6198, 3389, 540522),
  row(10, 5340.87, 10316.63, 21877.79, 875, 765, 5337, 3094, 588155),
  row(11, 10739.72, 21305.52, 55538.66, 2589, 2199, 15508, 7307, 1380262),
  row(12, 1805.02, 7489.0, 27502.62, 1171, 1016, 6534, 1693, 284194),
];

/** January to August 2026. September is partial and deliberately excluded. */
export const MONTHS_2026: MonthRow[] = [
  row(1, 2429.7, 5604.54, 18059.16, 748, 641, 4851, 2304, 287807),
  row(2, 1241.44, 5014.27, 15241.58, 560, 466, 3657, 1572, 210374),
  row(3, 5167.97, 6211.09, 18378.97, 672, 581, 5744, 4806, 1364246),
  row(4, 1940.41, 10228.48, 21033.06, 745, 613, 5157, 3384, 356093),
  row(5, 12918.27, 18378.6, 33555.78, 1213, 1047, 9099, 5786, 1352408),
  row(6, 12068.21, 26060.97, 50754.77, 1823, 1545, 12955, 6691, 1474133),
  row(7, 11836.56, 21105.55, 41149.98, 1344, 1172, 9566, 5635, 1207453),
  row(8, AUG_2026_SPEND, 20810.39, 35697.7, 1110, 986, 8969, 6250, 1395931),
];

export const MONTHS_ELAPSED = MONTHS_2026.length;

/**
 * September 2026 so far: 1 to 8 September, not a full month.
 *
 * Kept apart from MONTHS_2026 on purpose. Eight days cannot sit in an array of
 * whole months without quietly corrupting every total and quarter built from
 * it. It exists only so the commentary can show where ACOS and TACOS have moved
 * since the August rebalance, and anything rendered from it has to say it is a
 * part-month.
 *
 * Note this is the figure as reported by BigQuery. August's spend is overridden
 * by hand (see AUG_2026_SPEND), so an August-to-September comparison is not
 * strictly like for like on the spend line.
 */
export const SEP_MTD = {
  label: '1-8 September',
  days: 8,
  spend: 1467.26,
  ppcSales: 3832.19,
  gross: 6073.4,
  units: 209,
  get acos() {
    return (this.spend / this.ppcSales) * 100;
  },
  get tacos() {
    return (this.spend / this.gross) * 100;
  },
};

/** Where the data stops, for the stamp line and the footnotes. */
export const DATA_THROUGH = '31 August 2026';
export const PULLED_ON = '11 September 2026';
export const ASIN_COUNT = 44;

// --- Totals -------------------------------------------------------------

export interface Totals {
  spend: number;
  ppcSales: number;
  gross: number;
  units: number;
  orders: number;
  sessions: number;
  clicks: number;
  /** Revenue not attributed to an ad click. See the caveat in the report. */
  organic: number;
  organicShare: number;
  /** Spend as a share of ad-attributed sales. */
  acos: number;
  /** Spend as a share of total revenue. */
  tacos: number;
  /** Return on ad spend, on attributed sales only. */
  roas: number;
  aov: number;
  cpc: number;
  /** Orders per session. */
  cvr: number;
}

const sum = (rows: MonthRow[], f: (r: MonthRow) => number) => rows.reduce((t, r) => t + f(r), 0);

export function total(rows: MonthRow[]): Totals {
  const spend = sum(rows, (r) => r.spend);
  const ppcSales = sum(rows, (r) => r.ppcSales);
  const gross = sum(rows, (r) => r.gross);
  const orders = sum(rows, (r) => r.orders);
  const sessions = sum(rows, (r) => r.sessions);
  const clicks = sum(rows, (r) => r.clicks);
  return {
    spend,
    ppcSales,
    gross,
    units: sum(rows, (r) => r.units),
    orders,
    sessions,
    clicks,
    organic: gross - ppcSales,
    organicShare: ((gross - ppcSales) / gross) * 100,
    acos: (spend / ppcSales) * 100,
    tacos: (spend / gross) * 100,
    roas: ppcSales / spend,
    aov: gross / orders,
    cpc: spend / clicks,
    cvr: (orders / sessions) * 100,
  };
}

/** Jan to Aug 2026. */
export const YTD_2026 = total(MONTHS_2026);
/** Jan to Aug 2025, the like-for-like window. */
export const YTD_2025 = total(MONTHS_2025.slice(0, MONTHS_ELAPSED));
/** All twelve months of 2025, for Q4 context. */
export const FY_2025 = total(MONTHS_2025);
/** Sep to Dec 2025: the quarter still ahead of us. */
export const Q4_2025 = total(MONTHS_2025.slice(8));

export const yoy = (now: number, before: number) => (now / before - 1) * 100;

export const YOY = {
  spend: yoy(YTD_2026.spend, YTD_2025.spend),
  ppcSales: yoy(YTD_2026.ppcSales, YTD_2025.ppcSales),
  gross: yoy(YTD_2026.gross, YTD_2025.gross),
  units: yoy(YTD_2026.units, YTD_2025.units),
  sessions: yoy(YTD_2026.sessions, YTD_2025.sessions),
  organic: yoy(YTD_2026.organic, YTD_2025.organic),
};

export interface PairedMonth {
  label: string;
  now: MonthRow;
  before: MonthRow;
  grossYoY: number;
  spendYoY: number;
}

export const PAIRED: PairedMonth[] = MONTHS_2026.map((now) => {
  const before = MONTHS_2025[now.m - 1];
  return {
    label: now.label,
    now,
    before,
    grossYoY: yoy(now.gross, before.gross),
    spendYoY: yoy(now.spend, before.spend),
  };
});

// --- Quarters ------------------------------------------------------------

/**
 * Calendar quarters, paired year on year.
 *
 * Q3 is the awkward one: 2026 only has July and August in hand, so a plain
 * Jul-Sep quarter would set two months against 2025's three and understate the
 * current year by about a third. Each quarter is therefore built from the
 * months actually available on the 2026 side, and the 2025 side is restricted
 * to those same months — so every bar pair compares like with like. `partial`
 * marks the quarter that is short so the chart can say so.
 */
export interface PairedQuarter {
  label: string;
  /** Which calendar months the pair covers, e.g. "Jul-Aug". */
  span: string;
  partial: boolean;
  now: Totals;
  before: Totals;
  grossYoY: number;
  spendYoY: number;
}

const QUARTER_DEFS = [
  { label: 'Q1', months: [1, 2, 3] },
  { label: 'Q2', months: [4, 5, 6] },
  { label: 'Q3', months: [7, 8, 9] },
  { label: 'Q4', months: [10, 11, 12] },
];

export const PAIRED_QUARTERS: PairedQuarter[] = QUARTER_DEFS.flatMap((q) => {
  const have = MONTHS_2026.filter((r) => q.months.includes(r.m));
  if (have.length === 0) return [];
  const months = have.map((r) => r.m);
  const now = total(have);
  const before = total(MONTHS_2025.filter((r) => months.includes(r.m)));
  return [
    {
      label: q.label,
      span: `${L[months[0] - 1]}-${L[months[months.length - 1] - 1]}`,
      partial: have.length < q.months.length,
      now,
      before,
      grossYoY: yoy(now.gross, before.gross),
      spendYoY: yoy(now.spend, before.spend),
    },
  ];
});

/** Per-month derived rates, for the trend panels. */
export const TREND_2026 = MONTHS_2026.map((r) => ({
  label: r.label,
  acos: (r.spend / r.ppcSales) * 100,
  tacos: (r.spend / r.gross) * 100,
  cpc: r.spend / r.clicks,
  organic: r.gross - r.ppcSales,
  ppcSales: r.ppcSales,
  organicShare: ((r.gross - r.ppcSales) / r.gross) * 100,
}));

// --- Branded vs generic search terms -------------------------------------

export interface SplitRow {
  label: string;
  brandedSpend: number;
  brandedSales: number;
  brandedClicks: number;
  genericSpend: number;
  genericSales: number;
  genericClicks: number;
}

const split = (
  label: string,
  bs: number,
  bsa: number,
  bc: number,
  gs: number,
  gsa: number,
  gc: number,
): SplitRow => ({
  label,
  brandedSpend: bs,
  brandedSales: bsa,
  brandedClicks: bc,
  genericSpend: gs,
  genericSales: gsa,
  genericClicks: gc,
});

export const SPLIT_2026: SplitRow[] = [
  split('Jan', 361, 1149, 248, 1980, 4158, 1956),
  split('Feb', 266, 1745, 273, 949, 3153, 1255),
  split('Mar', 426, 1900, 353, 1693, 2906, 1706),
  split('Apr', 689, 6354, 714, 809, 2477, 1005),
  split('May', 3632, 11215, 1619, 9148, 7019, 3599),
  split('Jun', 2879, 11099, 1600, 8145, 12724, 4036),
  split('Jul', 1226, 6612, 744, 9542, 12327, 3865),
  split('Aug', 1956, 9075, 1085, 8823, 9406, 3692),
];

function splitSide(pick: (r: SplitRow) => { s: number; sa: number; c: number }) {
  const s = SPLIT_2026.reduce((t, r) => t + pick(r).s, 0);
  const sa = SPLIT_2026.reduce((t, r) => t + pick(r).sa, 0);
  const c = SPLIT_2026.reduce((t, r) => t + pick(r).c, 0);
  return { spend: s, sales: sa, clicks: c, acos: (s / sa) * 100, roas: sa / s, cpc: s / c };
}

export const BRANDED = splitSide((r) => ({ s: r.brandedSpend, sa: r.brandedSales, c: r.brandedClicks }));
export const GENERIC = splitSide((r) => ({ s: r.genericSpend, sa: r.genericSales, c: r.genericClicks }));
export const SPLIT_TOTAL_SPEND = BRANDED.spend + GENERIC.spend;

// --- Per-ASIN, June to August 2026 ---------------------------------------

export interface AsinRow {
  asin: string;
  name: string;
  spend: number;
  ppcSales: number;
  gross: number;
  cpc: number;
  /** Orders per click, on ad traffic. */
  adCvr: number;
  /** Units sold in the 30 days to 8 Sep. */
  units30: number;
  /** Fulfillable FBA units at the latest inventory snapshot. */
  stock: number;
  inbound: number;
}

const asin = (
  a: string,
  name: string,
  spend: number,
  ppcSales: number,
  gross: number,
  cpc: number,
  adCvr: number,
  units30: number,
  stock: number,
  inbound: number,
): AsinRow => ({ asin: a, name, spend, ppcSales, gross, cpc, adCvr, units30, stock, inbound });

/** Ad spend and revenue over Jun-Aug 2026, with current cover. Spend > $100 only. */
export const ASINS: AsinRow[] = [
  asin('B00XCHX78K', 'Stemless 16oz, set of 4', 7702, 15470, 20189, 2.03, 13.0, 208, 319, 360),
  asin('B0F2PYKHGW', 'Stemless 12oz, set of 8', 5765, 10942, 14993, 2.87, 9.5, 89, 306, 8),
  asin('B075QPYS96', 'Stemless 16oz, set of 2', 5177, 7070, 7498, 1.43, 9.6, 149, 197, 303),
  asin('B073D7HF23', 'Stemless 16oz, set of 8', 4450, 9368, 32996, 2.65, 10.7, 103, 407, 1),
  asin('B002WXSAT6', 'Stemless 16oz, set of 4', 4086, 5701, 9820, 1.89, 7.8, 92, 207, 240),
  asin('B009T7NSFE', 'Stemless 12oz, set of 4', 3018, 6410, 8303, 2.33, 14.5, 83, 505, 182),
  asin('B07792YXG3', 'Stemless 12oz, set of 2', 2463, 4652, 3466, 1.47, 9.9, 69, 129, 180),
  asin('B084KQCD2X', 'Stemless 16oz, set of 4', 1418, 2798, 4164, 2.44, 13.6, 27, 82, 122),
  asin('B0FTTM9X4V', 'Whiskey rocks 12.5oz, set of 6', 432, 1141, 2374, 1.22, 7.1, 8, 121, 1),
  asin('B00I5O6E9O', 'Flute 8oz, set of 8', 417, 1653, 4234, 1.45, 15.3, 26, 184, 0),
  asin('B0FXYH3CCT', 'Flute 9oz, set of 4', 374, 965, 1035, 1.33, 9.3, 8, 63, 0),
  asin('B00KWD90GA', 'Stemless 12oz, set of 12', 322, 390, 4040, 2.01, 5.6, 15, 108, 1),
  asin('B099H7HMTD', 'Highball 14oz, set of 4', 290, 778, 867, 1.18, 9.4, 7, 60, 0),
  asin('B01DMFI1A0', 'Stemless 16oz, set of 72', 257, 50, 3868, 2.8, 2.2, 8, 4, 6),
  asin('B0FXYHZR1P', 'Flute 9oz, set of 12', 112, 255, 928, 1.35, 7.2, 3, 92, 0),
];

/** Days of cover at the trailing 30-day rate, counting stock on hand only. */
export const daysCover = (r: AsinRow) => (r.units30 > 0 ? r.stock / (r.units30 / 30) : Infinity);

/** ASINs with under 60 days of cover, worst first: the Q4 restock list. */
export const RESTOCK = ASINS.filter((r) => daysCover(r) < 60).sort((a, b) => daysCover(a) - daysCover(b));

// --- Formatting ---------------------------------------------------------

export const usd = (n: number, dp = 0) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

export const num = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export const pct = (n: number, dp = 1) => `${n.toFixed(dp)}%`;

export const signedPct = (n: number, dp = 0) => `${n >= 0 ? '+' : ''}${n.toFixed(dp)}%`;
