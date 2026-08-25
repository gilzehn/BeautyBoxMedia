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

### `unit_economics` — Amazon data + planning inputs

One row per account + SKU (only where Amazon data exists):

- **Synced from BigQuery** (`amzbi-418608.amazon_source_data`): `size_tier`,
  `storage_fee` (per-unit, trailing-12-month average), `fulfillment_fee`,
  `current_price`, `referral_fee`, `synced_at`.
- **Manual planning inputs**: `prep_cost`, `inbound_cost` (seeded from the
  Profit-Calc sheet), `discount_pct` (e.g. `0.20` = plan a 20% discount),
  `desired_profit_pct` (e.g. `0.25` = target a 25% margin).

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
`discount_pct`, `desired_profit_pct`) during a sync.

## Security

Both tables have RLS enabled with authenticated-only policies (same model as
the other `/bizconsole` tables), and the view runs with
`security_invoker = true`, so the anon key alone can read nothing.
