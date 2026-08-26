# Unit Economics database — BBMEDIA Supabase

The Profit-Calc spreadsheet now lives in the **BBMEDIA** Supabase project
(ref `xrkwenrgohaukqvyffru`) as two tables plus a computed view. It covers the
five managed accounts, keyed by the same short codes used in `/bizconsole`:

| Code | Account | BigQuery `account_id` |
|------|---------|-----------------------|
| TBB  | The Beauty Box Seller US | 1614310 |
| TB   | THE Boutique Seller US | 1614400 |
| NRG  | National Retail Group Seller US | 2156840 |
| RMR  | RM REVOLUTION GROUP Seller US | 1728680 |
| BCP  | Brush Clean Pro Seller US | 2839050 |

Schema file: [`supabase/unit_economics.sql`](./supabase/unit_economics.sql)
(idempotent — re-running it is safe).

## The tables

### `cogs` — product + cost master (managed by the team)

One row per **account + SKU**: `asin`, `title`, `item_name`, `brand`,
`purchase_cost`, `product_group`, `fulfillment_channel` (FBA/FBM), `note`.
Only products present here appear in the unit-economics view — adding a
product means inserting its row (at minimum account, sku, purchase_cost)
here. Identity fields are filled by the Amazon sync when the SKU exists in
BigQuery.

Initial data came from the **Profit-Calc sheets** of the two Unit Economics
workbooks (NRGRMR and TBBTB): `P. Cost` → `purchase_cost`, and Prep / Inbound
seeded the matching `unit_economics` rows. Loaded 2026-08-25: NRG 350,
RMR 260, TBB 1,398, TB 754 (zero-cost rows included); BCP starts empty.

**`brand` comes from the Profit-Calc sheet, not from Amazon.** Amazon's own
`brand` field is dirty — the same brand appears as `govino`/`Govino`, three
invisibly-different `Inglot` spellings, occasionally the wrong brand, and 217
rows had none at all. Rows then scatter across several dropdown entries and
look "missing". The sheets' Brand column is curated (0 blanks, 57 brands), so
it is the source of truth. A brand fixed in the sheet is re-applied by
re-running the brand update; new SKUs imported from Amazon are labelled with
the sheet's spelling for their brand, resolved through aliases learned from
SKUs already carrying that brand.

**Numeric SKUs.** The first load read the workbooks with openpyxl, which
returns numeric-looking SKUs as floats — `75` arrived as `75.0`,
`159015302` as `159015302.0`. Those 23 rows matched nothing in Amazon (no
title, no fees). Repaired 2026-08-26 from the CSV exports, which keep SKUs as
text: 12 were duplicates of a correct row and were deleted, 11 were renamed to
the real SKU and re-synced. **Export the Profit-Calc tab as CSV rather than
reading the .xlsx** to avoid reintroducing this.

**2026-08-26 brand completion.** For 37 named brands, every remaining Amazon
SKU was imported (1,259 rows: TB 719, TBB 293, NRG 189, RMR 58) so a brand's
catalogue is complete rather than limited to whatever the sheet listed. These
arrive with `purchase_cost = 0` — they are real listings awaiting a cost, and
the screen flags them ("Needs cost" filter, counted separately from the
average-margin stat) so a missing cost never reads as a fat margin.

### `unit_economics` — Amazon data + planning inputs

One row per account + SKU (only where Amazon data exists):

- **Synced from BigQuery** (`amzbi-418608.amazon_source_data`): `size_tier`,
  `storage_fee` (per-unit, trailing-12-month average), `fulfillment_fee`,
  `current_price`, `referral_fee`, `synced_at`.
- **Manual planning inputs**: `prep_cost`, `inbound_cost` (seeded from the
  Profit-Calc sheet), `discount_pct` (e.g. `0.20` = plan a 20% discount),
  `desired_profit_pct` (e.g. `0.25` = target a 25% margin), and
  `desired_price` (a target sell price to price-check).

### `unit_economics_view` — the Profit-Calc formulas

Join of the two tables with every derived column computed:

| Column | Formula |
|---|---|
| `total_cost` | purchase_cost + prep_cost + inbound_cost |
| `total_fee` | storage_fee + fulfillment_fee + referral_fee |
| `profit` | current_price − total_cost − total_fee |
| `margin_pct` / `be_tacos` | profit ÷ current_price |
| `discounted_price` | current_price × (1 − discount_pct) |
| `discounted_profit` | discounted_price − total_cost − storage_fee − fulfillment_fee − referral_rate × discounted_price |
| `discounted_margin_pct` | discounted_profit ÷ discounted_price |
| `suggested_price` | (total_cost + storage_fee + fulfillment_fee) ÷ (1 − referral_rate − desired_profit_pct) |
| `desired_price_profit` | desired_price − total_cost − storage_fee − fulfillment_fee − referral_rate × desired_price |
| `desired_price_margin_pct` | desired_price_profit ÷ desired_price |
| `breakeven_price` | (total_cost + storage_fee + fulfillment_fee) ÷ (1 − referral_rate) |

`referral_rate` is `referral_fee / current_price` (falls back to the 15%
default when there is no price). Discount/suggested columns stay NULL until
their input is set on the row. Example:

```sql
select account, brand, sku, current_price, profit, margin_pct
from unit_economics_view
where account = 'NRG'
order by margin_pct;
```

## Refreshing the Amazon data

The sync sources live in BigQuery project `amzbi-418608`, dataset
`amazon_source_data` (Intentwise export, updated daily). For each of the five
`account_id`s:

1. **Fees, size tier, price fallback** — latest row per account+SKU from
   `sellercentral_fbafeepreview_report`:
   ```sql
   SELECT account_id, sku, asin, product_name, brand, product_group,
          product_size_tier, estimated_referral_fee_per_unit,
          expected_fulfillment_fee_per_unit, your_price, sales_price
   FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY account_id, sku
                                      ORDER BY report_date DESC) rn
         FROM `amzbi-418608.amazon_source_data.sellercentral_fbafeepreview_report`
         WHERE account_id IN (2156840,1728680,1614310,1614400,2839050))
   WHERE rn = 1
   ```
2. **Current price, item name, channel** — same latest-row pattern over
   `sellercentral_alllistings_report` (`seller_sku`, `item_name`,
   `fulfillment_channel`, `price`; `AMAZON_NA` → FBA, `DEFAULT` → FBM).
3. **Per-unit storage fee** — trailing 12 months of
   `sellercentral_fbastoragefees_report`:
   ```sql
   SELECT account_id, asin,
          ROUND(SUM(estimated_monthly_storage_fee)
                / NULLIF(SUM(average_quantity_on_hand), 0), 4) AS storage_fee_per_unit
   FROM `amzbi-418608.amazon_source_data.sellercentral_fbastoragefees_report`
   WHERE account_id IN (2156840,1728680,1614310,1614400,2839050)
     AND report_end_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
   GROUP BY account_id, asin
   ```

Blend rules used by the loader (keep the same when automating, e.g. in n8n):
`current_price` = listing price, else fee-preview `your_price`, else
`sales_price`; `referral_fee` = fee-preview estimate, else 15% of price;
upsert on `(account, sku)` and set `synced_at = now()`; never touch the
manual columns (`purchase_cost`, `prep_cost`, `inbound_cost`,
`discount_pct`, `desired_profit_pct`, `desired_price`) during a sync.

## Security

Both tables have RLS enabled with authenticated-only policies (same model as
the other `/bizconsole` tables), and the view runs with
`security_invoker = true`, so the anon key alone can read nothing.

## The Accounts screen

`/bizconsole` → **Accounts** in the sidebar. Pick an **account** (or "All
accounts") and a **brand**, then switch between two chip tabs:

- **COGS** — the product master. Edit **Purchase Cost** and **Product Type**
  inline (they save on blur/change), add a product manually, or delete one.
  Changing a cost immediately moves the profit shown on the other tab.
  **Bulk product type:** tick rows (or the header box to take everything
  currently shown), pick a type in the bar that appears, and hit Apply — one
  request updates them all. **Needs cost** filters to rows still at $0.00.
- **Unit Economics** — profitability per product at the current Amazon price,
  plus three planning inputs you can type into:

| Input | What it answers |
|---|---|
| **Discount %** | "If I run 20% off, what happens?" → discounted price, profit, margin |
| **Desired Profit %** | "What price gives me a 25% margin?" → suggested price |
| **Desired Price** | "If I sell at $13.90, what do I make?" → profit and margin at that price |

All three save to the database, so a plan persists and the whole team sees it.
Each scenario re-derives the referral fee from the scenario's own price (Amazon
charges it as a percentage), which is why a discount cuts the fee too.

The **Break-even** column is the price at which profit is exactly zero — any
product priced below it is losing money on every unit, and the header line
counts them for the current filter.

> **Permissions:** `accounts` is its own menu section. Admins and users without
> an explicit `app_metadata.sections` allowlist see it right away; a user with a
> restricted allowlist needs `accounts` added via the Users screen.

**Column widths are draggable** on both tabs: grab the divider on a column
header's right edge, or double-click it to reset that column. Widths are saved
per table in your browser, so your layout survives a reload.
