# Prompt — Brand Profit Analysis, one account per chat

Paste the block below into a **new chat**, replacing `{{ACCOUNT}}` and the two dates.
Run one account per chat: the SKU tables are large and the accounts share nothing
except the method.

| Code | Account | `account_id` | Branch |
|------|---------|--------------|--------|
| TBB | The Beauty Box Seller US | 1614310 | `TBB-Brand-Profit-Analysis` |
| TB | THE Boutique Seller US | 1614400 | `TB-Brand-Profit-Analysis` |
| NRG | National Retail Group Seller US | 2156840 | `NRG-Brand-Profit-Analysis` ✅ done |
| RMR | RM REVOLUTION GROUP Seller US | 1728680 | `RMR-Brand-Profit-Analysis` |
| BCP | Brush Clean Pro Seller US | 2839050 | `BCP-Brand-Profit-Analysis` |

---

## The prompt

```text
Build the Brand Profit Analysis for account {{ACCOUNT}} covering {{DATE_FROM}} to {{DATE_TO}},
working on the branch {{ACCOUNT}}-Brand-Profit-Analysis of gilzehn/BeautyBoxMedia.
Break the window into calendar months plus the part month at the end (May, Jun, Jul, MTD on NRG),
with a period switcher on the report and a combined "all months" view.

NRG is already built — follow analysis/build_report.py, analysis/sku_profit_pl.sql,
analysis/cogs.sql, analysis/account_costs.sql and analysis/report_template.html exactly
rather than inventing a new method, so the five accounts stay comparable.

WHERE THE DATA COMES FROM — do not substitute other sources.
- Every Amazon number comes from BigQuery `amzbi-418608.amazon_source_data`
  (Intentwise daily export): sellercentral_settlement_report_v2 is the spine — it holds
  every order, refund, promotion, referral and FBA fee, storage, inbound, removal,
  reimbursement, credit and advertising charge. Supporting tables: sellercentral_fbareturns_report,
  sellercentral_alllistings_report (the live catalog — the SKU list must match it),
  sellercentral_fbafeepreview_report, sellercentral_fbastoragefees_report,
  sellercentral_salesandtrafficbysku_report, and the ad_sponsoredproducts / _sponsoredbrand /
  _sponsoreddisplay report + productads tables.
- COGS comes ONLY from Supabase, project BBMEDIA (ref xrkwenrgohaukqvyffru),
  public.cogs joined to public.unit_economics. Landed cost = purchase_cost + prep_cost +
  inbound_cost. Never estimate a cost, never pull cost from BigQuery, never fill a gap
  with a guess — a missing cost is a finding, not a number to invent.

STEPS
1. Run analysis/sku_profit_pl.sql with ACCOUNT_ID / DATE_FROM / DATE_TO substituted.
   Save the rows to analysis/data/{{ACCOUNT}}_{{DATE_FROM}}_{{DATE_TO}}_bq.json in the
   same positional-array shape the NRG file uses.
2. Run analysis/cogs.sql for '{{ACCOUNT}}' against Supabase →
   analysis/data/{{ACCOUNT}}_cogs_supabase.json
3. Run analysis/account_costs.sql → analysis/data/{{ACCOUNT}}_account_costs.json
   (settlement lines with no SKU, BY MONTH, stored as POSITIVE costs).
4. Run analysis/campaign_spend.sql → analysis/data/{{ACCOUNT}}_campaign_spend.json, and map each
   campaign-name brand token to its Brand List name.
5. Pull public.brands for the account from Supabase → analysis/data/{{ACCOUNT}}_brand_list.json,
   adding for each brand the `aliases` Amazon actually uses (Amazon spells brands differently:
   "Sqwincher Zero", "STALEKS PRO", "Lifefactory") and a `focus` flag for the brands the team
   wants recommendations on. Ask which brands are in focus if nobody has said.
6. python3 analysis/build_report.py --account {{ACCOUNT}} --from {{DATE_FROM}} --to {{DATE_TO}}
7. Open the generated HTML in a browser, confirm it renders in light and dark, and commit the
   data files, the HTML and any threshold changes to the branch.

THE P&L — state every money column as a positive number in the direction it moves profit.
  net sales      = principal + shipping + gift wrap − promotional rebates − refunds
                   (marketplace-facilitator tax excluded on both sides; it nets to zero)
  Amazon fees    = referral (net of RefundCommission) + FBA per-unit fulfilment
                   + shipping/gift-wrap chargebacks + allocated storage + allocated inbound
  advertising    = SP + SB + SD cost attributed to the ASIN, scaled so the total ties to the
                   settlement "Cost of Advertising" line
  COGS           = landed cost × (units shipped − units returned sellable)
  contribution   = net sales + reimbursements − Amazon fees − advertising − COGS
  net profit     = contribution − allocated account overhead
  break-even ACOS= contribution before advertising ÷ net sales

ALLOCATIONS — only three, and name them in the report:
  advertising by ASIN → SKU on revenue share, scaled to the settlement total
  storage by each ASIN's share of the FBA storage-fee report, scaled to the settlement total
  inbound & placement per unit shipped; removals, disposals, returns processing, subscription
  and adjustments by net-sales share
Everything else is charged where Amazon charged it.

RECONCILE BEFORE YOU REPORT — say so explicitly in your summary:
  ad spend from the ad reports vs the settlement Cost of Advertising line (expect ±2%)
  referral + FBA fee totals vs the settlement ItemFees totals
  gross sales vs settlement Order/ItemPrice/Principal
If a check is off by more than a couple of percent, find out why before publishing.

ADVERTISING — answer this the same way. Ad dollars are attributed BY THE AD'S ASIN, not by
campaign name: each ad id maps to its ASIN through the product-ads tables, a Sponsored Brands
creative is split evenly across the ASINs on it, and ASIN spend is then shared across that
ASIN's SKUs by revenue. Campaign names are a cross-check, not the source: NRG names campaigns
"iComm | Brand - line | SP | targeting", and the campaign-name total should land within a couple
of percent of the settlement Cost of Advertising. Show both on the brand rows if the account
names campaigns consistently, and say which one the profit column uses.

WHAT THE REPORT MUST SHOW — keep it simple, it is a working sheet, not a deck.
  ONE table: brand totals, click to expand to EVERY SKU under that brand — the ones with a landed
  cost and the ones without. No product-group level.
  SKU filters: All · With COGS · Without COGS · Profitable · Loss, plus a text filter and an
  export of the missing-cost SKUs as CSV ready for Supabase public.cogs.
  A period switcher across the months and the combined window; every number responds to it.
  A prominent cost-coverage gate: how many SKUs and how much net sales carry purchase_cost = 0,
  and the profit figure restricted to SKUs where cost IS known — that restricted figure is the
  honest headline. Mark brands where NO SKU has a cost.
  Recommendations ONLY for the focus brands, grouped brand-first then by SKU inside that brand:
  sells at a loss, ad spend above break-even ACOS, refund rate above 5%, fee ratio above 40% of
  net sales, promotions above 10% of gross, unsellable returns, dead stock still accruing storage,
  Buy Box below 85%, missing landed cost, dormant catalog, single-SKU concentration, and whether
  the part month is tracking above or below the full months. Every other brand is data only.
  Say plainly that the findings overlap and the pool is gross opportunity, not a sum of wins.

THEN WRITE ME, in chat, no more than 15 lines:
  the headline P&L by month including the part month, the honest cost-covered profit, the three
  brands to fix first with the dollar figure and the one action each, and anything you do not trust.
```

---

## Notes for whoever runs it

- **Window** — three full calendar months is the default. Settlement is posted-date based,
  so a window ending on today's date will be missing the tail; end on a completed month.
- **Data starts** — NRG, RMR and BCP settlements begin 2025-11-20/24; TBB and TB go back to 2021.
- **Cost coverage is the gate.** On NRG, 651 of 883 SKUs had no landed cost and the account's
  reported +$203k profit turned into −$53k on the SKUs where cost was actually known. Do not
  present a profit number without the coverage figure beside it.
- **Cost is a Supabase job, not an analysis job.** The fastest win on every account is filling
  `purchase_cost` in `public.cogs` for the SKUs the report flags — the report exports that list as CSV.
- **A brand on the Brand List with no Amazon activity is a finding, not a gap to hide.** NRG's
  Milagros is Active and Exclusive with zero SKUs mapped and zero settlement activity.
