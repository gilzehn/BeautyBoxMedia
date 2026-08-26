# Brand Profit Analysis

A per-account Amazon P&L that reads down from the brand to the individual ASIN, built from
the settlement ledger rather than from Seller Central summary screens — so refunds,
promotions, referral and FBA fees, storage, inbound, removals, reimbursements, credits and
advertising all land on the SKU that caused them.

**Built so far:** [`nrg-brand-profit-analysis.html`](./nrg-brand-profit-analysis.html)
(NRG, 2026-05-01 → 2026-08-20, split into May / Jun / Jul / Aug MTD). Open it in a browser — it is
self-contained. Brand totals expand to every SKU; filter to **Without COGS** and export the list to
see exactly which costs to add in Supabase.

## Where the numbers come from

| | Source |
|---|---|
| Amazon activity | BigQuery `amzbi-418608.amazon_source_data` — settlement v2, FBA returns, All Listings, fee preview, storage fees, sales & traffic by SKU, SP/SB/SD ad reports |
| **Landed cost** | **Supabase BBMEDIA `public.cogs` + `public.unit_economics` only** — never BigQuery, never estimated |
| Brand / product group | Supabase `cogs.brand` / `cogs.product_group`, falling back to the FBA fee preview brand |

## Rebuilding a report

```bash
# 1. BigQuery — substitute {{ACCOUNT_ID}} {{DATE_FROM}} {{DATE_TO}}
analysis/sku_profit_pl.sql     # → data/<ACCOUNT>_<FROM>_<TO>_bq.json   (one row per month per SKU)
analysis/account_costs.sql     # → data/<ACCOUNT>_account_costs.json    (by month, costs as positives)
analysis/campaign_spend.sql    # → data/<ACCOUNT>_campaign_spend.json   (ad spend by campaign-name brand)

# 2. Supabase
analysis/cogs.sql              # → data/<ACCOUNT>_cogs_supabase.json
#   plus public.brands for the account → data/<ACCOUNT>_brand_list.json (aliases + focus flags)

# 3. Render
python3 analysis/build_report.py --account NRG --from 2026-05-01 --to 2026-08-20
```

`build_report.py` holds the P&L definitions, the three allocations and the thresholds that
turn a number into a finding. `report_template.html` is the page; the builder injects the
computed JSON into it.

## Running the other accounts

One account per chat, using [`PROMPT-brand-profit-analysis.md`](./PROMPT-brand-profit-analysis.md).
Each account has its own branch: `TBB-`, `TB-`, `NRG-`, `RMR-`, `BCP-Brand-Profit-Analysis`.

## Advertising attribution

Ad dollars follow **the ad's ASIN**, not the campaign name: each ad id maps to its ASIN through the
product-ads tables, a Sponsored Brands creative is split evenly across its ASINs, and ASIN spend is
shared across that ASIN's SKUs by revenue, scaled so each month ties to the settlement's
`Cost of Advertising`. Campaign names are the cross-check — NRG names campaigns
`iComm | Brand - line | SP | targeting`, and that view totals $129,521 against $129,088 charged.

## What NRG showed (May 1 – Aug 20, 2026)

$1.69M net sales and a reported $220k net profit — but 672 of 907 SKUs have no landed cost in
Supabase. On the 235 SKUs where cost **is** known the account lost **$62k**. Filling
`purchase_cost` is the prerequisite for trusting anything else on the page. Aug MTD margin is
running at 5.6% against 14–16% in the full months.
