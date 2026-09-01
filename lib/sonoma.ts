/**
 * Sonoma Syrup Co — 2026 advertising investment vs. total sales.
 *
 * Source: Amazon Selling Partner + Advertising data warehoused in BigQuery
 * (project `amzbi-418608`, dataset `amazon_source_data`), account
 * "THE Boutique Seller US" (account_id 1614400).
 *
 *   Sales / units / sessions
 *     sellercentral_salesandtrafficbychildasin_report, restricted to the 29
 *     child ASINs carrying brand_name = 'Sonoma Syrup Co' in
 *     catalog_item_summary. `ordered_product_sales_amt` is total ordered
 *     product sales — every order, advertised or not.
 *
 *   Ad spend / ad-attributed sales
 *     ad_sponsoredproducts_campaign_report + the Sponsored Brands and
 *     Sponsored Display equivalents, restricted to campaigns whose name
 *     matches '%sonoma%' (six live campaigns, all "iComm | Sonoma - Syrups").
 *     Attribution is Amazon's 14-day click window.
 *
 * Pulled 2026-09-01. Data is complete through 2026-08-30; August is therefore
 * one day short of the full month. Spend here differs by ~0.5% from the sheet
 * mailed to the brand on 2026-07-30 because Amazon restates attribution for a
 * few days after the fact — the later figure is the accurate one.
 */

export interface MonthRow {
  /** ISO year-month. */
  month: string;
  /** Short axis label. */
  label: string;
  /** Total advertising cost, all ad types. */
  spend: number;
  /** Total ordered product sales for the brand — advertised and organic. */
  sales: number;
  /** Total units ordered. */
  units: number;
  /** Sales Amazon attributes to an ad click within 14 days. */
  adSales: number;
  /** Units Amazon attributes to an ad click within 14 days. */
  adUnits: number;
}

export const MONTHS_2026: MonthRow[] = [
  { month: '2026-01', label: 'Jan', spend: 3345.69, sales: 70720.95, units: 2719, adSales: 17471.23, adUnits: 730 },
  { month: '2026-02', label: 'Feb', spend: 2716.67, sales: 62381.1, units: 2356, adSales: 14171.64, adUnits: 589 },
  { month: '2026-03', label: 'Mar', spend: 3312.87, sales: 71998.02, units: 2902, adSales: 18887.93, adUnits: 847 },
  { month: '2026-04', label: 'Apr', spend: 7329.58, sales: 85368.34, units: 3408, adSales: 30174.7, adUnits: 1307 },
  { month: '2026-05', label: 'May', spend: 10695.4, sales: 85656.13, units: 3328, adSales: 26324.46, adUnits: 1107 },
  { month: '2026-06', label: 'Jun', spend: 5400.37, sales: 82163.69, units: 3128, adSales: 24339.3, adUnits: 991 },
  { month: '2026-07', label: 'Jul', spend: 4355.88, sales: 83092.81, units: 3179, adSales: 19284.35, adUnits: 816 },
  { month: '2026-08', label: 'Aug', spend: 4739.61, sales: 85871.64, units: 3304, adSales: 21827.34, adUnits: 913 },
];

/** Same eight months of 2025, for the year-on-year anchor only. */
export const PRIOR_YEAR_JAN_AUG = {
  spend: 21200.63,
  sales: 370687.19,
  units: 14676,
  adSales: 76502.36,
};

// --- Derived ------------------------------------------------------------

export function sum(rows: MonthRow[], key: keyof Omit<MonthRow, 'month' | 'label'>): number {
  return rows.reduce((t, r) => t + r[key], 0);
}

export const YTD = {
  spend: sum(MONTHS_2026, 'spend'),
  sales: sum(MONTHS_2026, 'sales'),
  units: sum(MONTHS_2026, 'units'),
  adSales: sum(MONTHS_2026, 'adSales'),
};

/** Advertising cost as a share of *total* sales — the number that matters to a brand. */
export const YTD_TACOS = (YTD.spend / YTD.sales) * 100;
/** Return on ad spend, on Amazon-attributed sales only. */
export const YTD_ROAS = YTD.adSales / YTD.spend;

export const YOY = {
  spend: (YTD.spend / PRIOR_YEAR_JAN_AUG.spend - 1) * 100,
  sales: (YTD.sales / PRIOR_YEAR_JAN_AUG.sales - 1) * 100,
  units: (YTD.units / PRIOR_YEAR_JAN_AUG.units - 1) * 100,
};

/**
 * The year splits into three natural spending regimes. Comparing them is the
 * closest thing to a controlled test the account has: budget moved sharply in
 * both directions while everything else about the catalogue stayed put.
 */
export interface Phase {
  id: string;
  name: string;
  span: string;
  note: string;
  months: MonthRow[];
}

export const PHASES: Phase[] = [
  {
    id: 'base',
    name: 'Baseline',
    span: 'Jan – Mar',
    note: 'Spend held near $3K a month.',
    months: MONTHS_2026.slice(0, 3),
  },
  {
    id: 'push',
    name: 'Investment push',
    span: 'Apr – May',
    note: 'Budget raised sharply, peaking at $10.7K in May.',
    months: MONTHS_2026.slice(3, 5),
  },
  {
    id: 'hold',
    name: 'Pull-back',
    span: 'Jun – Aug',
    note: 'Budget cut back by nearly half. Sales did not follow it down.',
    months: MONTHS_2026.slice(5),
  },
];

export function phaseAvg(p: Phase) {
  const n = p.months.length;
  const spend = sum(p.months, 'spend') / n;
  const sales = sum(p.months, 'sales') / n;
  const adSales = sum(p.months, 'adSales') / n;
  return {
    spend,
    sales,
    units: sum(p.months, 'units') / n,
    tacos: (spend / sales) * 100,
    roas: adSales / spend,
  };
}

/** Pearson correlation coefficient. */
export function pearson(x: number[], y: number[]): number {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}

export const R_SPEND_SALES = pearson(
  MONTHS_2026.map((m) => m.spend),
  MONTHS_2026.map((m) => m.sales),
);

export const R_SPEND_UNITS = pearson(
  MONTHS_2026.map((m) => m.spend),
  MONTHS_2026.map((m) => m.units),
);

// --- Formatting ---------------------------------------------------------

export const usd = (n: number, dp = 0) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

export const num = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export const pct = (n: number, dp = 1) => `${n.toFixed(dp)}%`;

export const signedPct = (n: number, dp = 0) => `${n >= 0 ? '+' : ''}${n.toFixed(dp)}%`;
