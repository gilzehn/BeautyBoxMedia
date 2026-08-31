// Perfect Image LLC - Amazon channel diligence dataset.
//
// Source: Amazon seller-central settlement (62,069 transactions, 01 Jan 2025 -
// 20 Aug 2026), business report, account health export and the account health
// screen of 31 Aug 2026. Figures are settlement GROSS product sales - before
// platform fees, refunds and promotional rebates - because that is the basis
// the target's P&L uses.
//
// Nothing here is modelled. Every number reconciles to a source file; the two
// exceptions (2026 Amazon ad spend, the 2025 paid/organic apportionment) are
// labelled as inferred on the face of the dashboard.

export type ProductStatus =
  | 'clean'
  | 'watch'
  | 'impaired'
  | 'at_risk_family'
  | 'at_risk_cited'
  | 'at_risk_high'
  | 'removed';

export interface MonthRow {
  month: string;
  gross_sales: number;
  units: number;
  promo_rebates: number;
  refunds: number;
  selling_fees: number;
  fba_fees: number;
  net_deposit_basis: number;
}

export interface ProductRow {
  product: string;
  asin: string;
  fy2025: number;
  units_2025: number;
  y2026_to_20aug: number;
  units_2026: number;
  run_rate: number;
  /** null on SKUs that never sold inside the settlement window. */
  last_sale: string | null;
  status: ProductStatus;
  path: string;
  why: string;
  monthly: Record<string, number>;
}

export interface LiquidationRow {
  product: string;
  events: number;
  units: number;
  proceeds: number;
}

export interface FeeRow {
  item: string;
  count: number;
  amount: number;
}

export interface RemovalMonthRow {
  month: string;
  events: number;
}

export interface AccountHealthRow {
  date: string;
  asin: string;
  product: string;
  at_risk_sales: number;
  action: string;
  ahr_impact: string;
  appeal: string;
  note?: string;
}

export interface ViolationRow {
  date: string;
  asin: string;
  category: string;
  note?: string;
}

export interface ListingStatusEvent {
  date: string;
  asin: string;
  status: 'Removed' | 'At risk' | 'Deactivated' | string;
  reason?: string;
}

export interface EnforcementPath {
  id: string;
  name: string;
  trigger: string;
  realized_against: string;
}

export interface ExposureBucket {
  bucket: string;
  run_rate: number;
  share: number;
}

export interface PerfectImageData {
  meta: {
    source: string;
    settlement_window: string;
    generated: string;
    reconciliation: {
      fy2025_gross: number;
      y2026_to_20aug_gross: number;
      pnl_2025_amazon: number;
      pnl_2026_stub_amazon: number;
      note: string;
    };
  };
  ad_spend: {
    basis: string;
    /** What the seller confirmed, and when. */
    resolved: string;
    /** Findings this restatement withdraws. They stay on the page as withdrawn. */
    withdrawn: string[];
    ppc_sales_2025: number;
    ppc_sales_2026_to_aug: number;
    ad_spend_2025: number;
    ad_spend_2026_to_aug: number;
    organic_sales_2025: number;
    organic_sales_2026_to_aug: number;
    organic_share_2025: number;
    organic_share_2026: number;
    roas_2025: number;
    roas_2026: number;
    acos_2025: number;
    acos_2026: number;
    tacos_2025: number;
    tacos_2026: number;
    like_for_like_jan_to_20aug: {
      total_2025: number;
      total_2026: number;
      total_chg_pct: number;
      paid_2025: number;
      paid_2026: number;
      paid_chg_pct: number;
      organic_2025: number;
      organic_2026: number;
      organic_chg_pct: number;
    };
    pnl_advertising_2025: number;
    pnl_advertising_2026_stub: number;
    non_amazon_ad_2025: number;
    non_amazon_ad_2026: number;
    shopify_revenue_2025: number;
    shopify_revenue_2026_stub: number;
    implied_shopify_tacos_2025: number;
    implied_shopify_tacos_2026: number;
  };
  monthly: MonthRow[];
  products: ProductRow[];
  liquidations: LiquidationRow[];
  fba_fees: FeeRow[];
  adjustments: FeeRow[];
  removal_orders_by_month: RemovalMonthRow[];
  account_health_dashboard: AccountHealthRow[];
  violations: ViolationRow[];
  listing_status_events: ListingStatusEvent[];
  enforcement_paths: EnforcementPath[];
  exposure_buckets: ExposureBucket[];
}

export const perfectImage: PerfectImageData = {
  "meta": {
    "source": "Amazon seller-central settlement + business report + account health",
    "settlement_window": "2025-01-01 to 2026-08-20",
    "generated": "2026-08-31",
    "reconciliation": {
      "fy2025_gross": 973483.85,
      "y2026_to_20aug_gross": 629356.36,
      "pnl_2025_amazon": 973364,
      "pnl_2026_stub_amazon": 499026,
      "note": "P&L 2026 stub Amazon line equals Jan 1 - Jun 30 settlement gross ($499,803), not seven months ($578,827)."
    }
  },
  "ad_spend": {
    "basis": "RESOLVED 31 Aug 2026. The seller has now given both 2026 figures: Amazon ad SPEND of $99,000 and ad-attributed SALES of $294,965.88, both to 20 Aug. 2025 remains $90,000 of spend against $311,000 of attributed sales.",
    "resolved": "The open question - whether the 2026 $99,000 was ad sales or ad spend - is answered: it is spend. Organic is measured on both sides again, and it falls.",
    "withdrawn": [
      "Organic +17.5% like-for-like. Organic sales fell 25.9% on the same window.",
      "Organic share rising 68.1% to 84.3%. It fell to 53.1%.",
      "Paid sales more than halved. Ad-attributed sales rose 39.2% like-for-like.",
      "Amazon ad-cost reduction of ~$45,177 in the SDE bridge. Spend rose, it did not fall.",
      "Implied Shopify TACOS of ~47.6%. On confirmed Amazon spend it is 29.8%."
    ],
    "ppc_sales_2025": 311000,
    "ppc_sales_2026_to_aug": 294965.88,
    "ad_spend_2025": 90000,
    "ad_spend_2026_to_aug": 99000,
    "organic_sales_2025": 662484,
    "organic_sales_2026_to_aug": 334390.48,
    "organic_share_2025": 68.1,
    "organic_share_2026": 53.1,
    "roas_2025": 3.46,
    "roas_2026": 2.98,
    "acos_2025": 28.9,
    "acos_2026": 33.6,
    "tacos_2025": 9.2,
    "tacos_2026": 15.7,
    "like_for_like_jan_to_20aug": {
      "total_2025": 663317,
      "total_2026": 629356,
      "total_chg_pct": -5.1,
      "paid_2025": 211911,
      "paid_2026": 294966,
      "paid_chg_pct": 39.2,
      "organic_2025": 451406,
      "organic_2026": 334390,
      "organic_chg_pct": -25.9
    },
    "pnl_advertising_2025": 238869,
    "pnl_advertising_2026_stub": 216016,
    "non_amazon_ad_2025": 148869,
    "non_amazon_ad_2026": 117016,
    "shopify_revenue_2025": 452096,
    "shopify_revenue_2026_stub": 393278,
    "implied_shopify_tacos_2025": 32.9,
    "implied_shopify_tacos_2026": 29.8
  },
  "monthly": [
    {
      "month": "2025-01",
      "gross_sales": 93453.33,
      "units": 3404,
      "promo_rebates": -1572.77,
      "refunds": -3505.85,
      "selling_fees": -13313.16,
      "fba_fees": -14411.29,
      "net_deposit_basis": 63088.12
    },
    {
      "month": "2025-02",
      "gross_sales": 85086.61,
      "units": 3205,
      "promo_rebates": -1728.92,
      "refunds": -3292.05,
      "selling_fees": -12217.82,
      "fba_fees": -13329.04,
      "net_deposit_basis": 56933.68
    },
    {
      "month": "2025-03",
      "gross_sales": 91796.61,
      "units": 3420,
      "promo_rebates": -2053.29,
      "refunds": -2603.82,
      "selling_fees": -13529.63,
      "fba_fees": -13483.88,
      "net_deposit_basis": 63754.97
    },
    {
      "month": "2025-04",
      "gross_sales": 93357.9,
      "units": 3488,
      "promo_rebates": -2185.68,
      "refunds": -3808.25,
      "selling_fees": -13415.51,
      "fba_fees": -13922.7,
      "net_deposit_basis": 61721.89
    },
    {
      "month": "2025-05",
      "gross_sales": 91678.33,
      "units": 3423,
      "promo_rebates": -2284.97,
      "refunds": -3617.45,
      "selling_fees": -13147.77,
      "fba_fees": -14212.36,
      "net_deposit_basis": 60456.91
    },
    {
      "month": "2025-06",
      "gross_sales": 84722.55,
      "units": 3240,
      "promo_rebates": -1942.74,
      "refunds": -2668.2,
      "selling_fees": -12189.01,
      "fba_fees": -13605.74,
      "net_deposit_basis": 56285.7
    },
    {
      "month": "2025-07",
      "gross_sales": 75680.2,
      "units": 2866,
      "promo_rebates": -1422.45,
      "refunds": -2575.4,
      "selling_fees": -11025.3,
      "fba_fees": -11529.73,
      "net_deposit_basis": 52269.08
    },
    {
      "month": "2025-08",
      "gross_sales": 70148.26,
      "units": 2706,
      "promo_rebates": -1507.88,
      "refunds": -2430.45,
      "selling_fees": -10105.96,
      "fba_fees": -10720.42,
      "net_deposit_basis": 46317.67
    },
    {
      "month": "2025-09",
      "gross_sales": 78656.96,
      "units": 2969,
      "promo_rebates": -1833.36,
      "refunds": -2775.2,
      "selling_fees": -11232.65,
      "fba_fees": -11639.32,
      "net_deposit_basis": 52946.61
    },
    {
      "month": "2025-10",
      "gross_sales": 71239.68,
      "units": 2855,
      "promo_rebates": -1114.1,
      "refunds": -2916.16,
      "selling_fees": -10287.86,
      "fba_fees": -10511.05,
      "net_deposit_basis": 48014.73
    },
    {
      "month": "2025-11",
      "gross_sales": 69226.56,
      "units": 2772,
      "promo_rebates": -1340.47,
      "refunds": -2074.95,
      "selling_fees": -9950.5,
      "fba_fees": -11260.15,
      "net_deposit_basis": 46033.96
    },
    {
      "month": "2025-12",
      "gross_sales": 68436.86,
      "units": 2673,
      "promo_rebates": -1105.53,
      "refunds": -2100.86,
      "selling_fees": -9790.89,
      "fba_fees": -10998.3,
      "net_deposit_basis": 45012.63
    },
    {
      "month": "2026-01",
      "gross_sales": 86304.52,
      "units": 3064,
      "promo_rebates": -2082.6,
      "refunds": -3291.59,
      "selling_fees": -12215.82,
      "fba_fees": -12398.33,
      "net_deposit_basis": 56370.15
    },
    {
      "month": "2026-02",
      "gross_sales": 92611.21,
      "units": 3200,
      "promo_rebates": -2455.37,
      "refunds": -3711.89,
      "selling_fees": -13077.27,
      "fba_fees": -13260.25,
      "net_deposit_basis": 61332.37
    },
    {
      "month": "2026-03",
      "gross_sales": 92766.0,
      "units": 3167,
      "promo_rebates": -2424.22,
      "refunds": -3070.15,
      "selling_fees": -13163.48,
      "fba_fees": -13046.43,
      "net_deposit_basis": 62883.94
    },
    {
      "month": "2026-04",
      "gross_sales": 80927.54,
      "units": 2772,
      "promo_rebates": -1979.0,
      "refunds": -3805.69,
      "selling_fees": -11376.5,
      "fba_fees": -11364.19,
      "net_deposit_basis": 54384.18
    },
    {
      "month": "2026-05",
      "gross_sales": 71084.06,
      "units": 2454,
      "promo_rebates": -1362.61,
      "refunds": -2835.6,
      "selling_fees": -10004.35,
      "fba_fees": -9845.8,
      "net_deposit_basis": 48195.82
    },
    {
      "month": "2026-06",
      "gross_sales": 76109.41,
      "units": 2563,
      "promo_rebates": -1381.8,
      "refunds": -3574.22,
      "selling_fees": -10771.96,
      "fba_fees": -10026.08,
      "net_deposit_basis": 51540.89
    },
    {
      "month": "2026-07",
      "gross_sales": 79024.36,
      "units": 2638,
      "promo_rebates": -1604.86,
      "refunds": -3527.2,
      "selling_fees": -11203.42,
      "fba_fees": -11325.86,
      "net_deposit_basis": 52780.73
    },
    {
      "month": "2026-08",
      "gross_sales": 50529.26,
      "units": 1698,
      "promo_rebates": -1268.62,
      "refunds": -1818.55,
      "selling_fees": -7208.23,
      "fba_fees": -7577.26,
      "net_deposit_basis": 34406.45
    }
  ],
  "products": [
    {
      "product": "Glycolic 50% Gel Peel",
      "asin": "B00COD5H9U",
      "fy2025": 327904.3,
      "units_2025": 11028,
      "y2026_to_20aug": 201318.15,
      "units_2026": 5826,
      "run_rate": 280311.04,
      "last_sale": "2026-08-20",
      "status": "clean",
      "path": "",
      "why": "No formulation or claim exposure identified.",
      "monthly": {
        "2025-01": 37018.2,
        "2025-02": 27074.8,
        "2025-03": 38246.15,
        "2025-04": 35138.85,
        "2025-05": 35161.3,
        "2025-06": 30354.35,
        "2025-07": 23510.75,
        "2025-08": 23660.5,
        "2025-09": 23175.31,
        "2025-10": 16314.35,
        "2025-11": 19339.03,
        "2025-12": 18910.71,
        "2026-01": 27686.46,
        "2026-02": 29926.04,
        "2026-03": 32206.66,
        "2026-04": 25920.27,
        "2026-05": 18457.75,
        "2026-06": 26527.16,
        "2026-07": 25092.85,
        "2026-08": 15500.96
      }
    },
    {
      "product": "Glycolic 30% Gel Peel",
      "asin": "B006ZBKH2Y",
      "fy2025": 164120.96,
      "units_2025": 5570,
      "y2026_to_20aug": 120316.67,
      "units_2026": 4004,
      "run_rate": 165269.48,
      "last_sale": "2026-08-20",
      "status": "clean",
      "path": "",
      "why": "No formulation or claim exposure identified.",
      "monthly": {
        "2025-01": 16412.6,
        "2025-02": 18658.85,
        "2025-03": 17371.0,
        "2025-04": 16472.5,
        "2025-05": 15903.45,
        "2025-06": 11440.9,
        "2025-07": 11560.7,
        "2025-08": 9973.35,
        "2025-09": 11590.65,
        "2025-10": 9973.35,
        "2025-11": 11164.45,
        "2025-12": 13599.16,
        "2026-01": 16280.66,
        "2026-02": 19991.82,
        "2026-03": 17307.0,
        "2026-04": 15067.92,
        "2026-05": 13482.52,
        "2026-06": 13455.9,
        "2026-07": 14378.95,
        "2026-08": 10351.9
      }
    },
    {
      "product": "Salicylic 20% Gel Peel",
      "asin": "B006ZA0A5Y",
      "fy2025": 87131.38,
      "units_2025": 2923,
      "y2026_to_20aug": 27792.93,
      "units_2026": 891,
      "run_rate": 67053.4,
      "last_sale": "2026-08-20",
      "status": "impaired",
      "path": "B",
      "why": "Removed 20 Nov 2025 as non-compliant OTC drug, dark 3.5 months, relisted Mar 2026 at 23% below prior run rate.",
      "monthly": {
        "2025-01": 7876.85,
        "2025-02": 6618.95,
        "2025-03": 8317.13,
        "2025-04": 7966.7,
        "2025-05": 9584.0,
        "2025-06": 9973.35,
        "2025-07": 8423.45,
        "2025-08": 7217.95,
        "2025-09": 7607.3,
        "2025-10": 9095.83,
        "2025-11": 4449.87,
        "2026-03": 1670.64,
        "2026-04": 5081.97,
        "2026-05": 5183.38,
        "2026-06": 5148.56,
        "2026-07": 6431.41,
        "2026-08": 4276.97
      }
    },
    {
      "product": "Lactic 50% Gel Peel",
      "asin": "B006ZBP8NM",
      "fy2025": 76267.18,
      "units_2025": 2575,
      "y2026_to_20aug": 0.0,
      "units_2026": 0,
      "run_rate": 0.0,
      "last_sale": "2025-12-20",
      "status": "removed",
      "path": "A",
      "why": "Lactic 50% vs Amazon 45% lactic cap. Removed 17 Dec 2025; Amazon evaluation complete, still removed.",
      "monthly": {
        "2025-01": 7547.4,
        "2025-02": 7068.2,
        "2025-03": 2536.78,
        "2025-04": 8176.35,
        "2025-05": 7098.15,
        "2025-06": 8206.3,
        "2025-07": 6896.0,
        "2025-08": 6798.65,
        "2025-09": 7547.4,
        "2025-10": 5988.45,
        "2025-11": 5285.31,
        "2025-12": 3118.19
      }
    },
    {
      "product": "Glycolic 70% Gel Peel",
      "asin": "B0DS6QCFST",
      "fy2025": 39942.85,
      "units_2025": 1146,
      "y2026_to_20aug": 80381.85,
      "units_2026": 2031,
      "run_rate": 104602.0,
      "last_sale": "2026-08-20",
      "status": "at_risk_high",
      "path": "A",
      "why": "Glycolic 70% sits exactly at the 70% glycolic cap. Largest source of 2026 growth.",
      "monthly": {
        "2025-01": 943.65,
        "2025-02": 2935.8,
        "2025-03": 4368.75,
        "2025-04": 2551.35,
        "2025-06": 1083.45,
        "2025-07": 3844.5,
        "2025-08": 1782.45,
        "2025-09": 5766.75,
        "2025-10": 3984.3,
        "2025-11": 5521.1,
        "2025-12": 7160.75,
        "2026-01": 12891.3,
        "2026-02": 13842.6,
        "2026-03": 11549.5,
        "2026-04": 9506.05,
        "2026-05": 6830.8,
        "2026-06": 9032.65,
        "2026-07": 10287.05,
        "2026-08": 6441.9
      }
    },
    {
      "product": "Gly+Sal Exfoliating Body Lotion",
      "asin": "B00OQR2MG8",
      "fy2025": 36491.11,
      "units_2025": 1223,
      "y2026_to_20aug": 21112.83,
      "units_2026": 669,
      "run_rate": 23822.8,
      "last_sale": "2026-08-20",
      "status": "at_risk_family",
      "path": "C+B",
      "why": "Bearberry and licorice plus 2% salicylic acid.",
      "monthly": {
        "2025-01": 2806.33,
        "2025-02": 3255.58,
        "2025-03": 3923.45,
        "2025-04": 3114.8,
        "2025-05": 3054.9,
        "2025-06": 3594.0,
        "2025-07": 2905.15,
        "2025-08": 3294.5,
        "2025-09": 3174.7,
        "2025-10": 2276.2,
        "2025-11": 2396.0,
        "2025-12": 2695.5,
        "2026-01": 5391.0,
        "2026-02": 3240.93,
        "2026-03": 2686.15,
        "2026-04": 2042.05,
        "2026-05": 1752.45,
        "2026-06": 2196.6,
        "2026-07": 2006.65,
        "2026-08": 1797.0
      }
    },
    {
      "product": "Salicylic 10% Gel Peel",
      "asin": "B06XY9XL5H",
      "fy2025": 34572.75,
      "units_2025": 1733,
      "y2026_to_20aug": 15045.35,
      "units_2026": 613,
      "run_rate": 9680.6,
      "last_sale": "2026-05-30",
      "status": "removed",
      "path": "B",
      "why": "Cited as non-compliant OTC drug 19 May 2026. Amazon evaluation complete, still removed.",
      "monthly": {
        "2025-01": 2613.45,
        "2025-02": 3012.45,
        "2025-03": 3451.35,
        "2025-04": 2753.1,
        "2025-05": 2852.85,
        "2025-06": 3471.3,
        "2025-07": 2972.55,
        "2025-08": 2533.65,
        "2025-09": 2573.55,
        "2025-10": 3012.45,
        "2025-11": 2493.15,
        "2025-12": 2832.9,
        "2026-01": 2282.65,
        "2026-02": 3207.35,
        "2026-03": 3614.7,
        "2026-04": 3520.5,
        "2026-05": 2420.15
      }
    },
    {
      "product": "Hydro-Glo Peel Pads 40%",
      "asin": "B00H8ZLVTE",
      "fy2025": 34433.53,
      "units_2025": 1156,
      "y2026_to_20aug": 23540.7,
      "units_2026": 788,
      "run_rate": 35221.2,
      "last_sale": "2026-08-20",
      "status": "at_risk_family",
      "path": "C",
      "why": "Kojic, glutathione, licorice, bearberry. Cited Oct 2024, unresolved.",
      "monthly": {
        "2025-01": 3594.0,
        "2025-02": 2815.3,
        "2025-03": 1797.0,
        "2025-04": 2695.5,
        "2025-05": 3264.55,
        "2025-06": 2605.65,
        "2025-07": 3324.45,
        "2025-08": 3165.73,
        "2025-09": 2396.0,
        "2025-10": 3474.2,
        "2025-11": 2875.2,
        "2025-12": 2425.95,
        "2026-01": 3084.85,
        "2026-02": 3024.95,
        "2026-03": 3743.75,
        "2026-04": 2965.05,
        "2026-05": 3534.1,
        "2026-06": 2815.3,
        "2026-07": 2455.9,
        "2026-08": 1916.8
      }
    },
    {
      "product": "Salicylic Deep Exfoliating Cleanser",
      "asin": "B007004PZO",
      "fy2025": 30301.65,
      "units_2025": 1527,
      "y2026_to_20aug": 16937.39,
      "units_2026": 784,
      "run_rate": 26703.76,
      "last_sale": "2026-08-20",
      "status": "at_risk_cited",
      "path": "D+B",
      "why": "Jurisdictionally restricted 07 Aug 2026 under WA Toxic-Free Cosmetics Act. Appeal not filed.",
      "monthly": {
        "2025-01": 2653.35,
        "2025-02": 2613.45,
        "2025-03": 2134.65,
        "2025-04": 2354.1,
        "2025-05": 2573.55,
        "2025-06": 2633.4,
        "2025-07": 2134.65,
        "2025-08": 2852.85,
        "2025-09": 2533.65,
        "2025-10": 2852.85,
        "2025-11": 2713.2,
        "2025-12": 2251.95,
        "2026-01": 2412.15,
        "2026-02": 2392.8,
        "2026-03": 2172.75,
        "2026-04": 2091.75,
        "2026-05": 2144.85,
        "2026-06": 2346.69,
        "2026-07": 2184.4,
        "2026-08": 1192.0
      }
    },
    {
      "product": "Peel Application Pads 50ct",
      "asin": "B081QPY2VZ",
      "fy2025": 24641.6,
      "units_2025": 3517,
      "y2026_to_20aug": 22731.9,
      "units_2026": 2519,
      "run_rate": 35595.8,
      "last_sale": "2026-08-20",
      "status": "clean",
      "path": "",
      "why": "No formulation or claim exposure identified.",
      "monthly": {
        "2025-01": 1184.55,
        "2025-02": 1861.4,
        "2025-03": 2015.5,
        "2025-04": 1890.4,
        "2025-05": 1613.4,
        "2025-06": 2098.9,
        "2025-07": 1904.3,
        "2025-08": 2086.0,
        "2025-09": 2244.85,
        "2025-10": 2793.9,
        "2025-11": 2335.2,
        "2025-12": 2613.2,
        "2026-01": 2957.85,
        "2026-02": 2829.25,
        "2026-03": 3184.4,
        "2026-04": 3309.3,
        "2026-05": 3715.2,
        "2026-06": 2762.0,
        "2026-07": 2421.75,
        "2026-08": 1552.15
      }
    },
    {
      "product": "Salicylic 30% Gel Peel",
      "asin": "B0DR68Y3RH",
      "fy2025": 24358.15,
      "units_2025": 698,
      "y2026_to_20aug": 29645.84,
      "units_2026": 825,
      "run_rate": 44250.4,
      "last_sale": "2026-08-20",
      "status": "at_risk_high",
      "path": "A+B",
      "why": "Salicylic 30% sits exactly at the 30% salicylic cap; salicylic also carries OTC-drug exposure.",
      "monthly": {
        "2025-01": 1223.25,
        "2025-02": 1118.4,
        "2025-03": 1013.55,
        "2025-04": 1607.7,
        "2025-05": 1712.55,
        "2025-06": 489.3,
        "2025-07": 1642.65,
        "2025-08": 1363.05,
        "2025-09": 3005.7,
        "2025-10": 3564.9,
        "2025-11": 3598.85,
        "2025-12": 4018.25,
        "2026-01": 4473.6,
        "2026-02": 4844.99,
        "2026-03": 4508.95,
        "2026-04": 2938.3,
        "2026-05": 3846.9,
        "2026-06": 2326.7,
        "2026-07": 4889.0,
        "2026-08": 1817.4
      }
    },
    {
      "product": "Glycolic 10% Gel Peel",
      "asin": "B06XY72JGR",
      "fy2025": 21194.4,
      "units_2025": 1054,
      "y2026_to_20aug": 18593.25,
      "units_2026": 759,
      "run_rate": 27744.0,
      "last_sale": "2026-08-20",
      "status": "clean",
      "path": "",
      "why": "No formulation or claim exposure identified.",
      "monthly": {
        "2025-01": 1037.4,
        "2025-02": 2812.95,
        "2025-03": 1117.2,
        "2025-04": 1336.65,
        "2025-05": 2394.0,
        "2025-06": 2074.8,
        "2025-07": 1655.85,
        "2025-08": 1177.05,
        "2025-09": 1596.0,
        "2025-10": 1536.15,
        "2025-11": 1895.25,
        "2025-12": 2561.1,
        "2026-01": 2286.1,
        "2026-02": 2894.2,
        "2026-03": 2554.85,
        "2026-04": 2055.85,
        "2026-05": 2430.1,
        "2026-06": 1786.4,
        "2026-07": 2719.5,
        "2026-08": 1866.25
      }
    },
    {
      "product": "Lactic 30% Gel Peel",
      "asin": "B08977J2Z6",
      "fy2025": 16364.9,
      "units_2025": 604,
      "y2026_to_20aug": 17517.92,
      "units_2026": 597,
      "run_rate": 28421.92,
      "last_sale": "2026-08-20",
      "status": "at_risk_family",
      "path": "C",
      "why": "Kojic, bearberry, licorice. Cited Oct 2024, unresolved.",
      "monthly": {
        "2025-01": 2145.7,
        "2025-02": 873.3,
        "2025-03": 499.15,
        "2025-04": 1526.95,
        "2025-05": 1796.45,
        "2025-06": 1671.65,
        "2025-07": 1592.2,
        "2025-08": 389.35,
        "2025-09": 1647.25,
        "2025-10": 1432.6,
        "2025-11": 1272.85,
        "2025-12": 1517.45,
        "2026-01": 1816.95,
        "2026-02": 2123.93,
        "2026-03": 2505.8,
        "2026-04": 2405.88,
        "2026-05": 2268.63,
        "2026-06": 2550.7,
        "2026-07": 2286.15,
        "2026-08": 1559.88
      }
    },
    {
      "product": "Pineapple Pumpkin Enzyme Peel",
      "asin": "B00GROHBAK",
      "fy2025": 13768.03,
      "units_2025": 460,
      "y2026_to_20aug": 8796.33,
      "units_2026": 294,
      "run_rate": 12063.92,
      "last_sale": "2026-08-20",
      "status": "clean",
      "path": "",
      "why": "No formulation or claim exposure identified.",
      "monthly": {
        "2025-01": 1168.05,
        "2025-02": 1248.93,
        "2025-03": 1048.25,
        "2025-04": 1317.8,
        "2025-05": 1108.15,
        "2025-06": 1527.45,
        "2025-07": 269.55,
        "2025-08": 958.4,
        "2025-09": 988.35,
        "2025-10": 1767.05,
        "2025-11": 1048.25,
        "2025-12": 1317.8,
        "2026-01": 1467.55,
        "2026-02": 1347.75,
        "2026-03": 1227.95,
        "2026-04": 1018.3,
        "2026-05": 1009.33,
        "2026-06": 1078.2,
        "2026-07": 928.45,
        "2026-08": 718.8
      }
    },
    {
      "product": "Hydra-Repair Wrinkle Cream",
      "asin": "B00700H128",
      "fy2025": 12230.5,
      "units_2025": 492,
      "y2026_to_20aug": 7282.65,
      "units_2026": 248,
      "run_rate": 11860.2,
      "last_sale": "2026-08-20",
      "status": "clean",
      "path": "",
      "why": "No formulation or claim exposure identified.",
      "monthly": {
        "2025-01": 923.15,
        "2025-02": 1097.8,
        "2025-03": 1127.75,
        "2025-04": 1097.8,
        "2025-05": 1072.85,
        "2025-06": 1322.35,
        "2025-07": 748.5,
        "2025-08": 1197.6,
        "2025-09": 673.65,
        "2025-10": 1197.6,
        "2025-11": 898.2,
        "2025-12": 873.25,
        "2026-01": 963.2,
        "2026-02": 808.65,
        "2026-03": 1108.15,
        "2026-04": 898.5,
        "2026-05": 1287.85,
        "2026-06": 1138.1,
        "2026-07": 539.1,
        "2026-08": 539.1
      }
    },
    {
      "product": "Tri-Clarity Peel Pads",
      "asin": "B00UXYWFF6 / B06XXZSYW8",
      "fy2025": 11284.41,
      "units_2025": 414,
      "y2026_to_20aug": 5717.95,
      "units_2026": 195,
      "run_rate": 11890.2,
      "last_sale": "2026-08-19",
      "status": "watch",
      "path": "B",
      "why": "Salicylic 25%, under the cap, but on the OTC-drug path.",
      "monthly": {
        "2025-01": 1167.85,
        "2025-02": 1048.0,
        "2025-03": 1327.5,
        "2025-04": 1097.8,
        "2025-05": 872.23,
        "2025-06": 868.4,
        "2025-07": 1147.9,
        "2025-08": 500.18,
        "2025-09": 1168.05,
        "2025-10": 449.25,
        "2025-11": 589.0,
        "2025-12": 1048.25,
        "2026-01": 589.0,
        "2026-02": 718.8,
        "2026-03": 748.75,
        "2026-04": 419.3,
        "2026-05": 1138.1,
        "2026-06": 808.65,
        "2026-07": 1025.8,
        "2026-08": 269.55
      }
    },
    {
      "product": "Hydro-Glo Peel Pads 10%",
      "asin": "B06XXTFKQS",
      "fy2025": 10220.5,
      "units_2025": 514,
      "y2026_to_20aug": 8517.85,
      "units_2026": 349,
      "run_rate": 14031.8,
      "last_sale": "2026-08-20",
      "status": "at_risk_family",
      "path": "C",
      "why": "Kojic, glutathione, licorice, bearberry. Cited Oct 2024, unresolved.",
      "monthly": {
        "2025-01": 1216.95,
        "2025-02": 678.3,
        "2025-03": 698.25,
        "2025-04": 1496.25,
        "2025-05": 1177.05,
        "2025-06": 638.4,
        "2025-07": 718.2,
        "2025-08": 658.35,
        "2025-09": 219.45,
        "2025-10": 997.5,
        "2025-11": 817.95,
        "2025-12": 903.85,
        "2026-01": 918.15,
        "2026-02": 918.15,
        "2026-03": 1442.1,
        "2026-04": 1182.6,
        "2026-05": 1067.85,
        "2026-06": 1671.65,
        "2026-07": 768.45,
        "2026-08": 548.9
      }
    },
    {
      "product": "Hydra-Repair Super Moisturizer",
      "asin": "B0896WDB2Q",
      "fy2025": 6961.05,
      "units_2025": 279,
      "y2026_to_20aug": 3972.55,
      "units_2026": 149,
      "run_rate": 6289.2,
      "last_sale": "2026-08-12",
      "status": "clean",
      "path": "",
      "why": "No formulation or claim exposure identified.",
      "monthly": {
        "2025-01": 1097.8,
        "2025-02": 249.5,
        "2025-03": 773.45,
        "2025-04": 723.55,
        "2025-05": 399.2,
        "2025-06": 648.7,
        "2025-07": 374.25,
        "2025-08": 499.0,
        "2025-09": 723.55,
        "2025-10": 499.0,
        "2025-11": 474.05,
        "2025-12": 499.0,
        "2026-01": 698.6,
        "2026-02": 499.0,
        "2026-03": 523.95,
        "2026-04": 499.0,
        "2026-05": 514.1,
        "2026-06": 449.25,
        "2026-07": 608.95,
        "2026-08": 179.7
      }
    },
    {
      "product": "Lactic 10% Gel Peel",
      "asin": "B06XXNYBH1",
      "fy2025": 498.75,
      "units_2025": 25,
      "y2026_to_20aug": 0.0,
      "units_2026": 0,
      "run_rate": 0.0,
      "last_sale": "2025-01-16",
      "status": "removed",
      "path": "C",
      "why": "Skin-lightening. Deactivated Mar 2025.",
      "monthly": {
        "2025-01": 498.75
      }
    },
    {
      "product": "Brushes, applicators, booties",
      "asin": "4 ASINs",
      "fy2025": 456.7,
      "units_2025": 66,
      "y2026_to_20aug": 134.25,
      "units_2026": 15,
      "run_rate": 59.6,
      "last_sale": "2026-06-16",
      "status": "clean",
      "path": "",
      "why": "No formulation or claim exposure identified.",
      "monthly": {
        "2025-01": 24.8,
        "2025-02": 44.65,
        "2025-03": 29.75,
        "2025-04": 39.75,
        "2025-05": 39.7,
        "2025-06": 19.9,
        "2025-07": 54.6,
        "2025-08": 39.65,
        "2025-09": 24.8,
        "2025-10": 29.75,
        "2025-11": 59.65,
        "2025-12": 49.7,
        "2026-01": 104.45,
        "2026-03": 9.95,
        "2026-04": 4.95,
        "2026-06": 14.9
      }
    },
    {
      "product": "Hydro-Glo Pre-Peel Brightening Cleanser",
      "asin": "B08972Y9C8",
      "fy2025": 339.15,
      "units_2025": 17,
      "y2026_to_20aug": 0.0,
      "units_2026": 0,
      "run_rate": 0.0,
      "last_sale": "2025-12-27",
      "status": "removed",
      "path": "C+D",
      "why": "Kojic + arbutin + \"Brightening\" in title. Cited Oct 2024, Dec 2025 and 27 Aug 2026.",
      "monthly": {
        "2025-01": 299.25,
        "2025-12": 39.9
      }
    },
    {
      "product": "Anti-Aging Resurfacing Cleanser",
      "asin": "B0896YSTL6",
      "fy2025": 0,
      "units_2025": 0,
      "y2026_to_20aug": 0,
      "units_2026": 0,
      "run_rate": 0,
      "last_sale": null,
      "status": "removed",
      "path": "D",
      "why": "Cited 29 Jul 2026 under WA Toxic-Free Cosmetics Act. Appeal not filed. No sales in 12 months.",
      "monthly": {}
    },
    {
      "product": "Dead before window (2 ASINs)",
      "asin": "B018IVXS1K / B08S5CNFKL",
      "fy2025": 0,
      "units_2025": 0,
      "y2026_to_20aug": 0,
      "units_2026": 0,
      "run_rate": 0,
      "last_sale": null,
      "status": "removed",
      "path": "C",
      "why": "Skin-lightening. Deactivated Oct-Nov 2024, before the settlement window opens.",
      "monthly": {}
    }
  ],
  "liquidations": [
    {
      "product": "50 ct - Premium Chemical Peel Application Pads",
      "events": 23,
      "proceeds": 7.17,
      "units": 23
    },
    {
      "product": "Glycolic Gel Peel - Enhanced with Retinol and Green Tea Extract (70% S",
      "events": 39,
      "proceeds": 95.81,
      "units": 39
    },
    {
      "product": "Hydro-Glo Peel Pads - Enhanced with Kojic, Mandelic, Glutathione, Lico",
      "events": 22,
      "proceeds": 23.25,
      "units": 22
    },
    {
      "product": "Lactic 50% Gel Peel, Chemical Peels for Face Breakout Scars, Chemical ",
      "events": 35,
      "proceeds": 74.48,
      "units": 35
    },
    {
      "product": "Salicylic Gel Chemical Peel - Enhanced with Green Tea Extract and Tea ",
      "events": 13,
      "proceeds": 31.76,
      "units": 13
    },
    {
      "product": "Tri-Clarity Peel Pads, Enhanced with Salicylic Acid, Mandelic Acid, Te",
      "events": 10,
      "proceeds": 19.46,
      "units": 10
    }
  ],
  "fba_fees": [
    {
      "item": "FBA Amazon-Partnered Carrier Shipment Fee",
      "count": 229,
      "amount": -3892.93
    },
    {
      "item": "FBA Inbound Placement Service Fee",
      "count": 731,
      "amount": -3107.3
    },
    {
      "item": "FBA Removal Order: Return Fee",
      "count": 215,
      "amount": -1020.97
    },
    {
      "item": "FBA Removal Order: Disposal Fee",
      "count": 491,
      "amount": -661.47
    },
    {
      "item": "Subscription",
      "count": 20,
      "amount": -569.73
    },
    {
      "item": "FBA storage fee",
      "count": 18,
      "amount": -451.83
    },
    {
      "item": "FBA Inventory Storage Fee",
      "count": 2,
      "amount": -27.28
    },
    {
      "item": "FBA Customer Returns Fee (Non-Apparel and Non-Shoes) for ASIN: B08977J2Z6 (2026-",
      "count": 1,
      "amount": -16.52
    },
    {
      "item": "AWD Processing Fee",
      "count": 2,
      "amount": -10.0
    },
    {
      "item": "FBA Customer Returns Fee (Non-Apparel and Non-Shoes) for ASIN: B0DS6QCFST (2026-",
      "count": 1,
      "amount": -7.08
    },
    {
      "item": "FBA Long-Term Storage Fee",
      "count": 18,
      "amount": -6.26
    },
    {
      "item": "FBA Customer Returns Fee (Non-Apparel and Non-Shoes) for ASIN: B0DS6QCFST (2025-",
      "count": 1,
      "amount": -4.72
    },
    {
      "item": "FBA Customer Returns Fee (Non-Apparel and Non-Shoes) for ASIN: B06XXTFKQS (2024-",
      "count": 1,
      "amount": -2.7
    },
    {
      "item": "FBA Customer Returns Fee (Non-Apparel and Non-Shoes) for ASIN: B00UXYWFF6 (2024-",
      "count": 1,
      "amount": -2.7
    },
    {
      "item": "FBA Customer Returns Fee (Non-Apparel and Non-Shoes) for ASIN: B007004PZO (2026-",
      "count": 1,
      "amount": -2.7
    },
    {
      "item": "FBA Customer Returns Fee (Non-Apparel and Non-Shoes) for ASIN: B06XXTFKQS (2024-",
      "count": 1,
      "amount": -2.7
    },
    {
      "item": "AWD Transportation Fee",
      "count": 2,
      "amount": -2.01
    },
    {
      "item": "FBA Long Term Storage Fee",
      "count": 2,
      "amount": -1.4
    },
    {
      "item": "AWD Storage Fee",
      "count": 1,
      "amount": -0.09
    }
  ],
  "adjustments": [
    {
      "item": "FBA Inventory Reimbursement - General Adjustment",
      "count": 115,
      "amount": -3374.28
    },
    {
      "item": "FBA Inventory Reimbursement - Damaged:Inbound",
      "count": 1,
      "amount": 25.6
    },
    {
      "item": "Other",
      "count": 4,
      "amount": 164.41
    },
    {
      "item": "Non-subscription Fee Adjustment",
      "count": 3,
      "amount": 300.0
    },
    {
      "item": "FBA Inventory Reimbursement - Lost:Warehouse",
      "count": 42,
      "amount": 398.31
    },
    {
      "item": "FBA Inventory Reimbursement - Damaged:Warehouse",
      "count": 60,
      "amount": 1097.39
    },
    {
      "item": "FBA Inventory Reimbursement - Customer Service Issue",
      "count": 139,
      "amount": 2615.43
    },
    {
      "item": "FBA Inventory Reimbursement - Lost:Inbound",
      "count": 95,
      "amount": 3884.98
    },
    {
      "item": "FBA Inventory Reimbursement - Customer Return",
      "count": 356,
      "amount": 7111.99
    }
  ],
  "removal_orders_by_month": [
    {
      "month": "2025-01",
      "events": 4
    },
    {
      "month": "2025-02",
      "events": 18
    },
    {
      "month": "2025-03",
      "events": 35
    },
    {
      "month": "2025-04",
      "events": 78
    },
    {
      "month": "2025-05",
      "events": 48
    },
    {
      "month": "2025-06",
      "events": 30
    },
    {
      "month": "2025-07",
      "events": 34
    },
    {
      "month": "2025-08",
      "events": 20
    },
    {
      "month": "2025-09",
      "events": 26
    },
    {
      "month": "2025-10",
      "events": 24
    },
    {
      "month": "2025-11",
      "events": 9
    },
    {
      "month": "2025-12",
      "events": 17
    },
    {
      "month": "2026-01",
      "events": 171
    },
    {
      "month": "2026-02",
      "events": 29
    },
    {
      "month": "2026-03",
      "events": 28
    },
    {
      "month": "2026-04",
      "events": 27
    },
    {
      "month": "2026-05",
      "events": 24
    },
    {
      "month": "2026-06",
      "events": 44
    },
    {
      "month": "2026-07",
      "events": 22
    },
    {
      "month": "2026-08",
      "events": 18
    }
  ],
  "account_health_dashboard": [
    {
      "date": "2026-08-27",
      "asin": "B08972Y9C8",
      "product": "Hydro-Glo Pre-Peel Skin Brightening Cleanser (lactic, mandelic, kojic, arbutin)",
      "at_risk_sales": 50,
      "action": "Jurisdictionally restricted",
      "ahr_impact": "No impact",
      "appeal": "Submission required - NOT FILED"
    },
    {
      "date": "2026-08-07",
      "asin": "B007004PZO",
      "product": "Salicylic Acid Deep Exfoliating Gel Based Cleanser",
      "at_risk_sales": 28308,
      "action": "Jurisdictionally restricted",
      "ahr_impact": "No impact",
      "appeal": "Submission required - NOT FILED"
    },
    {
      "date": "2026-07-29",
      "asin": "B0896YSTL6",
      "product": "Anti-Aging Resurfacing Cleanser (glycolic, retinol)",
      "at_risk_sales": 0,
      "action": "Jurisdictionally restricted",
      "ahr_impact": "No impact",
      "appeal": "Submission required - NOT FILED",
      "note": "No sales in past 12 months"
    },
    {
      "date": "2026-05-19",
      "asin": "B06XY9XL5H",
      "product": "Salicylic 10% Gel Peel",
      "at_risk_sales": 26308,
      "action": "Listing removed",
      "ahr_impact": "No impact",
      "appeal": "Evaluation complete - STILL REMOVED"
    },
    {
      "date": "2026-04-23",
      "asin": "B006ZBP8NM",
      "product": "Lactic 50% Gel Peel",
      "at_risk_sales": 21988,
      "action": "Listing removed",
      "ahr_impact": "No impact",
      "appeal": "Evaluation complete - STILL REMOVED"
    }
  ],
  "violations": [
    {
      "date": "2026-08-27",
      "asin": "B08972Y9C8",
      "category": "Restricted Products - jurisdictional",
      "note": "Not in the seller export"
    },
    {
      "date": "2026-08-07",
      "asin": "B007004PZO",
      "category": "WA Toxic-Free Cosmetics Act"
    },
    {
      "date": "2026-07-29",
      "asin": "B0896YSTL6",
      "category": "WA Toxic-Free Cosmetics Act"
    },
    {
      "date": "2026-05-19",
      "asin": "B06XY9XL5H",
      "category": "Non-compliant OTC drug"
    },
    {
      "date": "2026-04-23",
      "asin": "B006ZBP8NM",
      "category": "High-concentration acid (lactic>45%)"
    },
    {
      "date": "2026-01-21",
      "asin": "B018IVXS1K",
      "category": "Skin lightening"
    },
    {
      "date": "2025-12-26",
      "asin": "B08972Y9C8",
      "category": "Skin lightening"
    },
    {
      "date": "2024-10-31",
      "asin": "B08S5CNFKL",
      "category": "Skin lightening"
    },
    {
      "date": "2024-10-26",
      "asin": "B00H8ZLVTE",
      "category": "Skin lightening"
    },
    {
      "date": "2024-10-26",
      "asin": "B08977J2Z6",
      "category": "Skin lightening"
    },
    {
      "date": "2024-10-26",
      "asin": "B006ZBP8NM",
      "category": "Skin lightening"
    },
    {
      "date": "2024-10-26",
      "asin": "B06XXTFKQS",
      "category": "Skin lightening"
    },
    {
      "date": "2024-10-24",
      "asin": "B06XXNYBH1",
      "category": "Skin lightening"
    }
  ],
  "listing_status_events": [
    {
      "date": "2024-10-21",
      "asin": "B018IVXS1K",
      "status": "Removed"
    },
    {
      "date": "2024-10-22",
      "asin": "B08S5CNFKL",
      "status": "Removed"
    },
    {
      "date": "2024-10-26",
      "asin": "B08972Y9C8",
      "status": "At risk"
    },
    {
      "date": "2024-10-27",
      "asin": "B06XXTFKQS",
      "status": "At risk"
    },
    {
      "date": "2024-10-31",
      "asin": "B08S5CNFKL",
      "status": "Deactivated"
    },
    {
      "date": "2024-11-01",
      "asin": "B018IVXS1K",
      "status": "Deactivated"
    },
    {
      "date": "2024-12-25",
      "asin": "B0DR68Y3RH",
      "status": "At risk"
    },
    {
      "date": "2024-12-31",
      "asin": "B08S5CNFKL",
      "status": "Deactivated"
    },
    {
      "date": "2025-01-01",
      "asin": "B018IVXS1K",
      "status": "Deactivated"
    },
    {
      "date": "2025-01-24",
      "asin": "B08972Y9C8",
      "status": "Deactivated"
    },
    {
      "date": "2025-03-27",
      "asin": "B08972Y9C8",
      "status": "Deactivated"
    },
    {
      "date": "2025-03-27",
      "asin": "B018IVXS1K",
      "status": "Deactivated"
    },
    {
      "date": "2025-03-27",
      "asin": "B06XXNYBH1",
      "status": "Deactivated"
    },
    {
      "date": "2025-03-27",
      "asin": "B08S5CNFKL",
      "status": "Deactivated"
    },
    {
      "date": "2025-11-20",
      "asin": "B006ZA0A5Y",
      "status": "Removed",
      "reason": "Non-compliant OTC drug"
    },
    {
      "date": "2025-12-17",
      "asin": "B006ZBP8NM",
      "status": "Removed",
      "reason": "High-concentration acid"
    },
    {
      "date": "2025-12-27",
      "asin": "B08972Y9C8",
      "status": "At risk"
    },
    {
      "date": "2025-12-29",
      "asin": "B08972Y9C8",
      "status": "Deactivated"
    },
    {
      "date": "2026-01-21",
      "asin": "B018IVXS1K",
      "status": "At risk"
    },
    {
      "date": "2026-01-23",
      "asin": "B018IVXS1K",
      "status": "Deactivated"
    },
    {
      "date": "2026-01-28",
      "asin": "B08972Y9C8",
      "status": "Deactivated"
    },
    {
      "date": "2026-02-22",
      "asin": "B018IVXS1K",
      "status": "Deactivated"
    }
  ],
  "enforcement_paths": [
    {
      "id": "A",
      "name": "Acid concentration cap",
      "trigger": "Lactic >45%, glycolic >70%, salicylic >30%",
      "realized_against": "B006ZBP8NM Lactic 50% - removed, ruling final"
    },
    {
      "id": "B",
      "name": "Unapproved OTC drug",
      "trigger": "Salicylic acid is an FDA OTC monograph acne active; therapeutic copy makes it a drug",
      "realized_against": "B006ZA0A5Y Nov 2025; B06XY9XL5H May 2026 - removed, ruling final"
    },
    {
      "id": "C",
      "name": "Skin-lightening policy",
      "trigger": "Kojic, arbutin, glutathione, licorice, bearberry, or \"brightening\" claims",
      "realized_against": "6 ASINs Oct 2024, plus Dec 2025, Jan 2026, Aug 2026"
    },
    {
      "id": "D",
      "name": "State cosmetic ingredient statutes",
      "trigger": "Washington Toxic-Free Cosmetics Act; other states following",
      "realized_against": "3 citations Jul-Aug 2026, all three appeals unfiled"
    }
  ],
  "exposure_buckets": [
    {
      "bucket": "Clean",
      "run_rate": 551083,
      "share": 60.9
    },
    {
      "bucket": "Impaired - cited once, relisted",
      "run_rate": 67053,
      "share": 7.4
    },
    {
      "bucket": "Skin-lightening family, still selling",
      "run_rate": 101498,
      "share": 11.2
    },
    {
      "bucket": "Cited and still selling under state restriction",
      "run_rate": 26704,
      "share": 3.0
    },
    {
      "bucket": "At the concentration cap, not yet cited",
      "run_rate": 148852,
      "share": 16.4
    },
    {
      "bucket": "Residual tail of a removed SKU",
      "run_rate": 9681,
      "share": 1.1
    }
  ]
};

// --- Derived series ------------------------------------------------------

export const MONTHS: string[] = perfectImage.monthly.map((m) => m.month);

export const MONTH_LABEL: Record<string, string> = MONTHS.reduce((acc, m) => {
  const [y, mm] = m.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  acc[m] = `${names[Number(mm) - 1]} ${y.slice(2)}`;
  return acc;
}, {} as Record<string, string>);

/** May-Jul 2026 x 4. Strips the Jan-Mar seasonal peak; the honest forward number. */
export const RUN_RATE_MONTHS = ['2026-05', '2026-06', '2026-07'];

/** Enforcement removals that show up as vertical breaks in the monthly series. */
export const REMOVAL_MARKERS = [
  { month: '2025-11', date: '20 Nov 2025', asin: 'B006ZA0A5Y', label: 'Salicylic 20% removed' },
  { month: '2025-12', date: '17 Dec 2025', asin: 'B006ZBP8NM', label: 'Lactic 50% removed' },
  { month: '2026-05', date: '19 May 2026', asin: 'B06XY9XL5H', label: 'Salicylic 10% removed' },
];

export const sum = (ns: number[]): number => ns.reduce((a, b) => a + b, 0);

export const fy2025Total = sum(perfectImage.products.map((p) => p.fy2025));
export const y2026Total = sum(perfectImage.products.map((p) => p.y2026_to_20aug));
export const runRateTotal = sum(perfectImage.products.map((p) => p.run_rate));

export const gross2025Monthly = perfectImage.monthly.filter((m) => m.month.startsWith('2025'));
export const gross2026Monthly = perfectImage.monthly.filter((m) => m.month.startsWith('2026'));

export const units2025 = sum(gross2025Monthly.map((m) => m.units));
export const units2026 = sum(gross2026Monthly.map((m) => m.units));

/** Jan-Jul like-for-like: the only clean year-over-year comparison in the file. */
export const JAN_JUL_2025 = 615776;
export const JAN_JUL_2026 = 578827;
export const LIKE_FOR_LIKE_PCT = -6.0;
export const UNITS_LFL_PCT = -13.8;
export const ASP_2025 = 26.3;
export const ASP_2026 = 29.2;

/**
 * 2026 Amazon ad spend annualized on the dashboard's own basis (the 15.7% TACOS
 * carried onto the May-Jul run rate). A straight calendar annualization of the
 * $99,000 over 7.65 months gives ~$155,000; both are shown, the run-rate figure
 * leads because that is the basis every other annualized number here uses.
 */
export const AD_SPEND_2026_ANNUALIZED =
  (perfectImage.ad_spend.ad_spend_2026_to_aug / 629356.36) * 904871.32;
export const AD_SPEND_2026_CALENDAR = perfectImage.ad_spend.ad_spend_2026_to_aug * (12 / 7.65);

/**
 * SDE bridge, restated once the 2026 spend was confirmed. The ad-cost reduction
 * that carried $45,177 of the earlier bridge does not exist - spend rose - so the
 * inventory drawdown now carries it alone.
 */
export const SDE_IMPROVEMENT_2026 = 82360;
export const INVENTORY_DRAWDOWN = 154537;
export const UNDERLYING_DETERIORATION = SDE_IMPROVEMENT_2026 - INVENTORY_DRAWDOWN;

export const EXPOSED_RUN_RATE = 277054;
export const EXPOSED_SHARE = 30.6;
export const AMAZON_AT_RISK_TOTAL = 76654;

export const REMOVED_FY2025_REVENUE = 111678;
export const REMOVED_SHARE_OF_CHANNEL = 11.5;

// --- Formatters ----------------------------------------------------------

export function usd(n: number, opts: { cents?: boolean } = {}): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });
}

export function pct(n: number, digits = 1): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`;
}

export function num(n: number): string {
  return n.toLocaleString('en-US');
}

// --- Acceptance checks ---------------------------------------------------
// The point of this dashboard is that it survives being audited across a
// negotiating table, so the totals are asserted at render time and any drift
// is shown on the face of the page rather than swallowed.

export interface AcceptanceCheck {
  label: string;
  expected: number;
  actual: number;
  ok: boolean;
  tolerance: number;
}

function check(label: string, expected: number, actual: number, tolerance = 1): AcceptanceCheck {
  return { label, expected, actual, ok: Math.abs(expected - actual) <= tolerance, tolerance };
}

export function acceptanceChecks(): AcceptanceCheck[] {
  const asinsInProducts = new Set<string>();
  perfectImage.products.forEach((p) =>
    p.asin.split('/').forEach((a) => asinsInProducts.add(a.trim()))
  );
  const citedAsins = [
    ...perfectImage.violations.map((v) => v.asin),
    ...perfectImage.account_health_dashboard.map((r) => r.asin),
  ];
  const unresolved = citedAsins.filter((a) => !asinsInProducts.has(a));

  return [
    check('sum(products.fy2025) = 973,483.85', 973483.85, fy2025Total, 0.01),
    check('sum(products.y2026_to_20aug) = 629,356.36', 629356.36, y2026Total, 0.01),
    check('sum(products.run_rate) = 904,871.32', 904871.32, runRateTotal, 0.01),
    check(
      'sum(monthly.gross_sales) 2025 = 973,483.85',
      973483.85,
      sum(gross2025Monthly.map((m) => m.gross_sales)),
      0.01
    ),
    check(
      'sum(monthly.gross_sales) 2026 = 629,356.36',
      629356.36,
      sum(gross2026Monthly.map((m) => m.gross_sales)),
      0.01
    ),
    check(
      'exposure buckets sum to run rate 904,871',
      904871,
      sum(perfectImage.exposure_buckets.map((b) => b.run_rate)),
      1
    ),
    check('every cited ASIN resolves to a product row', 0, unresolved.length, 0),
    check(
      '2026 organic = gross - ad-attributed sales',
      y2026Total - perfectImage.ad_spend.ppc_sales_2026_to_aug,
      perfectImage.ad_spend.organic_sales_2026_to_aug,
      0.01
    ),
    check(
      '2026 non-Amazon ad = P&L line - Amazon spend',
      perfectImage.ad_spend.pnl_advertising_2026_stub - perfectImage.ad_spend.ad_spend_2026_to_aug,
      perfectImage.ad_spend.non_amazon_ad_2026,
      1
    ),
  ];
}
