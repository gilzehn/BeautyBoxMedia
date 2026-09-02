/**
 * Sonoma Syrup Co on Amazon: our advertising investment against brand income.
 *
 * Framing note: the advertising is *ours*. Beauty Box Media runs and funds the
 * Sonoma campaigns on the THE Boutique US account; Sonoma contributes co-op
 * against it. So "spend" throughout is our investment in the brand, not the
 * brand's own outlay, and the copy on the page says so.
 *
 * Source: Amazon Selling Partner + Advertising data warehoused in BigQuery
 * (project `amzbi-418608`, dataset `amazon_source_data`), account
 * "THE Boutique Seller US" (account_id 1614400).
 *
 *   Income / units
 *     sellercentral_salesandtrafficbychildasin_report, restricted to the 29
 *     child ASINs carrying brand_name = 'Sonoma Syrup Co' in
 *     catalog_item_summary. "Income" is `ordered_product_sales_amt`: total
 *     ordered product sales, every order, advertised or not.
 *
 *   Spend / ad-attributed income
 *     ad_sponsoredproducts_campaign_report plus the Sponsored Brands and
 *     Sponsored Display equivalents, restricted to campaigns matching
 *     '%sonoma%' (six campaigns, all "iComm | Sonoma - Syrups").
 *     Attribution is Amazon's 14-day click window.
 *
 * Pulled and re-verified 2026-09-02. Complete through 2026-08-30, so August
 * 2026 is one day short of a full month while August 2025 is whole, a small
 * bias against the current year in that row.
 */

export interface MonthRow {
  /** Calendar month, 1-12. */
  m: number;
  /** Short axis/column label. */
  label: string;
  /** Our advertising investment. */
  spend: number;
  /** Total ordered product sales, advertised and organic. */
  income: number;
  /** Total units ordered. */
  units: number;
  /** Income Amazon attributes to an ad click within 14 days. */
  adIncome: number;
}

const L = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const row = (m: number, spend: number, income: number, units: number, adIncome: number): MonthRow => ({
  m,
  label: L[m - 1],
  spend,
  income,
  units,
  adIncome,
});

export const MONTHS_2025: MonthRow[] = [
  row(1, 352.27, 46306.41, 1774, 469.0),
  row(2, 880.87, 32971.43, 1268, 3358.95),
  row(3, 2026.77, 34239.69, 1327, 5547.52),
  row(4, 5450.32, 61207.58, 2429, 20500.41),
  row(5, 4233.55, 52968.38, 2116, 15841.3),
  row(6, 2402.37, 49167.26, 1938, 9034.74),
  row(7, 2644.85, 47034.98, 1999, 10364.48),
  row(8, 3209.63, 46791.46, 1825, 11385.96),
  row(9, 3048.36, 58475.56, 2264, 11057.09),
  row(10, 3780.99, 62747.49, 2590, 13079.97),
  row(11, 3173.42, 59636.95, 2228, 10723.65),
  row(12, 3565.85, 74289.53, 2920, 17566.67),
];

export const MONTHS_2026: MonthRow[] = [
  row(1, 3345.69, 70720.95, 2719, 17471.23),
  row(2, 2716.67, 62381.1, 2356, 14171.64),
  row(3, 3312.87, 71998.02, 2902, 18887.93),
  row(4, 7329.58, 85368.34, 3408, 30174.7),
  row(5, 10695.4, 85656.13, 3328, 26324.46),
  row(6, 5400.37, 82163.69, 3128, 24339.3),
  row(7, 4355.88, 83092.81, 3179, 19284.35),
  row(8, 4739.61, 85871.64, 3304, 21827.34),
];

/** How many months of 2026 are in hand: the like-for-like window. */
export const MONTHS_ELAPSED = MONTHS_2026.length;

// --- Totals -------------------------------------------------------------

export interface Totals {
  spend: number;
  income: number;
  units: number;
  adIncome: number;
  /** Our ad spend as a share of total income. */
  adCostOfIncome: number;
  /** Return on ad spend, on attributed income only. */
  roas: number;
}

export function total(rows: MonthRow[]): Totals {
  const spend = rows.reduce((t, r) => t + r.spend, 0);
  const income = rows.reduce((t, r) => t + r.income, 0);
  const adIncome = rows.reduce((t, r) => t + r.adIncome, 0);
  return {
    spend,
    income,
    units: rows.reduce((t, r) => t + r.units, 0),
    adIncome,
    adCostOfIncome: (spend / income) * 100,
    roas: adIncome / spend,
  };
}

/** Jan to Aug 2026. */
export const YTD_2026 = total(MONTHS_2026);
/** Jan to Aug 2025, the like-for-like window. */
export const YTD_2025 = total(MONTHS_2025.slice(0, MONTHS_ELAPSED));
/** All twelve months of 2025, for context on what a full year looks like. */
export const FY_2025 = total(MONTHS_2025);

/** Percentage change, 2026 against the same months of 2025. */
export const yoy = (now: number, before: number) => (now / before - 1) * 100;

export const YOY = {
  spend: yoy(YTD_2026.spend, YTD_2025.spend),
  income: yoy(YTD_2026.income, YTD_2025.income),
  units: yoy(YTD_2026.units, YTD_2025.units),
};

/** The two years' rows paired up month by month, for the comparison table. */
export interface PairedMonth {
  label: string;
  now: MonthRow;
  before: MonthRow;
  incomeYoY: number;
  spendYoY: number;
}

export const PAIRED: PairedMonth[] = MONTHS_2026.map((now) => {
  const before = MONTHS_2025[now.m - 1];
  return {
    label: now.label,
    now,
    before,
    incomeYoY: yoy(now.income, before.income),
    spendYoY: yoy(now.spend, before.spend),
  };
});

/**
 * 2026 split into its three spending regimes. Budget moved hard in both
 * directions while the catalogue stayed put, which makes the comparison the
 * closest thing the account has to a controlled test.
 */
export const PHASES = [
  { name: 'Baseline', span: 'Jan to Mar', months: MONTHS_2026.slice(0, 3) },
  { name: 'Investment push', span: 'Apr to May', months: MONTHS_2026.slice(3, 5) },
  { name: 'Pull-back', span: 'Jun to Aug', months: MONTHS_2026.slice(5) },
];

export function phaseAvg(p: (typeof PHASES)[number]) {
  const n = p.months.length;
  const t = total(p.months);
  return { spend: t.spend / n, income: t.income / n, units: t.units / n };
}

// --- Formatting ---------------------------------------------------------

export const usd = (n: number, dp = 0) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

export const num = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export const pct = (n: number, dp = 1) => `${n.toFixed(dp)}%`;

export const signedPct = (n: number, dp = 0) => `${n >= 0 ? '+' : ''}${n.toFixed(dp)}%`;
