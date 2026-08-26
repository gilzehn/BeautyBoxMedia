# Brand Profit Analysis

A per-account Amazon P&L that reads down from the brand to the individual ASIN, built from
the settlement ledger rather than from Seller Central summary screens — so refunds,
promotions, referral and FBA fees, storage, inbound, removals, reimbursements, credits and
advertising all land on the SKU that caused them.

**Built so far:** [`nrg-brand-profit-analysis.html`](./nrg-brand-profit-analysis.html)
(NRG, 2026-05-01 → 2026-07-31). Open the file in a browser — it is self-contained.

## Where the numbers come from

| | Source |
|---|---|
| Amazon activity | BigQuery `amzbi-418608.amazon_source_data` — settlement v2, FBA returns, All Listings, fee preview, storage fees, sales & traffic by SKU, SP/SB/SD ad reports |
| **Landed cost** | **Supabase BBMEDIA `public.cogs` + `public.unit_economics` only** — never BigQuery, never estimated |
| Brand / product group | Supabase `cogs.brand` / `cogs.product_group`, falling back to the FBA fee preview brand |

## Rebuilding a report

```bash
# 1. BigQuery  → analysis/data/<ACCOUNT>_<FROM>_<TO>_bq.json
#    substitute {{ACCOUNT_ID}} {{DATE_FROM}} {{DATE_TO}} in:
analysis/sku_profit_pl.sql
analysis/account_costs.sql        # → data/<ACCOUNT>_account_costs.json (costs as positives)

# 2. Supabase → analysis/data/<ACCOUNT>_cogs_supabase.json
analysis/cogs.sql

# 3. Render
python3 analysis/build_report.py --account NRG --from 2026-05-01 --to 2026-07-31
```

`build_report.py` holds the P&L definitions, the three allocations and the thresholds that
turn a number into a finding. `report_template.html` is the page; the builder injects the
computed JSON into it.

## Running the other accounts

One account per chat, using [`PROMPT-brand-profit-analysis.md`](./PROMPT-brand-profit-analysis.md).
Each account has its own branch: `TBB-`, `TB-`, `NRG-`, `RMR-`, `BCP-Brand-Profit-Analysis`.

## What NRG showed (May–Jul 2026)

$1.39M net sales, a reported $203k net profit — but 651 of 883 SKUs have no landed cost in
Supabase. On the 232 SKUs where cost **is** known the account lost **$53k**. Filling
`purchase_cost` is the prerequisite for trusting anything else on the page.
