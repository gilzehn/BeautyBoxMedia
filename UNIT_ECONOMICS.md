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

**A scrollbar sits above the table** as well as below it — with hundreds of
rows the bottom one is unreachable. It hides itself when every column already
fits.

**Columns and saved views.** `Columns ▾` toggles any column off (SKU, the
checkbox and the row actions always stay). Save an arrangement with
**＋ Save current view…** in the view dropdown: it stores the visible columns
and their widths in `public.saved_views` and is **shared with the whole team**.
Editing a view's columns marks it *Modified* with Save / Revert, so a shared
view is never overwritten by accident. A view saved before a column existed
still works — unknown keys are dropped and new columns appear rather than the
table blanking out.

**Bulk editing on Unit Economics.** Tick rows, choose a field — Discount %,
Desired Profit %, Desired Price, Prep, Inbound, or Purchase Cost — type one
value and Apply. Purchase Cost writes to `cogs`, the rest to `unit_economics`;
either way the affected rows are re-read from the view so the recomputed
profit, margin and suggestions come straight back.

### Planning defaults, 2026-08-26

Every row was seeded with **Prep $0.50, Inbound $0.30, Discount 15%, Desired
Profit 20%**. The inbound figure **replaced the $0.52 that came from the
Profit-Calc sheet** on ~2,700 rows, at the user's explicit request: total cost
falls $0.22 per unit there, so profit and margin rise correspondingly (e.g. NRG
`KITOKO-3.8` went from 17.9% to 18.7% margin). Every row now shows a discounted
price and a suggested price where most previously showed "—".

A future Amazon sync will not disturb this: the refresh rules above never touch
`prep_cost`, `inbound_cost`, `discount_pct`, `desired_profit_pct` or
`desired_price`. Re-running the *Profit-Calc cost import*, however, would
reintroduce $0.52 unless inbound is excluded from it.

### Govino repricing, 2026-09-26

Govino sits entirely in **TBB**. Three changes were made, all to data rather than
code.

**1. `amzn.gr.*` remnants removed.** 77 of Govino's 103 rows were
Amazon-generated SKUs (`amzn.gr.<real-sku>-<hash>-<suffix>`, some
double-prefixed) shadowing 17 real listings. All carried `purchase_cost = 0`, so
the view showed them at 52–77% margin and they dominated any brand-level
average. They were deleted from **both** `cogs` and `unit_economics` — the two
tables join on `(account, sku)` with no foreign key, so deleting from `cogs`
alone would have left orphan rows. Govino is now 26 rows: 17 costed, 9 awaiting
a cost. Average margin across the costed rows is **23.1%**; the pre-cleanup
figure was inflated by the zero-cost remnants. A backup of the deleted rows is
in the session scratchpad (`govino/amzn_gr_cogs_backup.json`).

**560 such rows exist table-wide** across 5 brands — Golden Rabbit (TB) alone
has 470, plus Lifefactory, Mason Pearson and Rescue Detox. None has a cost.
Only Govino's were cleaned here; the rest still distort those brands.

**2. Per-SKU discount ceilings replaced the blanket 15%.** `discount_pct` on
each costed Govino row is now the largest discount that still leaves a **10%
margin**, derived from that row's own `referral_rate` rather than a flat
assumption:

```sql
(total_cost + storage_fee + fulfillment_fee) / (1 - referral_rate - 0.10)
```

Eleven rows were already safe at 15% and kept it. Six were cut:

| SKU | ASIN | Was | Now |
|---|---|---|---|
| J2-P3P8-FZPP | B07792YXG3 | 15% | **0.1%** |
| 6R-7I4D-UTXY | B084KQCD2X | 15% | 2.7% |
| 16ozBEER-6PACK | B00K1KHUU2 | 15% | 4.3% |
| RN-GETQ-L1MF | B002WXSAT6 | 15% | 5.6% |
| BJ-UH1N-K0JI | B0FXYH3CCT | 15% | 9.8% |
| 6D-B6P5-T55Z | B073D7HF23 | 15% | 14.5% |

At the old 15%, J2-P3P8-FZPP ran at **−3.2%** and 6R-7I4D-UTXY at **−0.8%**.

**3. Price targets set.** `desired_price` on the four thinnest SKUs is the price
that yields 20% at list (the view's `suggested_price`): J2-P3P8-FZPP $14.95 →
**$17.24**, 6R-7I4D-UTXY $24.95 → **$28.00**, 16ozBEER-6PACK $29.95 →
**$33.08**, RN-GETQ-L1MF $24.95 → **$27.05**. These are targets recorded for
review — nothing was pushed to Amazon.

#### Still open on Govino

- **Nine listings have no cost**, four of them carrying real revenue:
  `12ozWINE-8PACK` (B0F2PYKHGW, ~$40.5k trailing 12m), `AC-NDSJ-WEJ5`
  (B075QPYS96, ~$12.5k), `R3-32CD-R6HT` (B00KWD90GA, ~$9.8k), and
  `0C-KONW-R1GG` (B099H7HMTD). They cannot be priced or discounted safely until
  a cost is entered.
- **Duplicate SKUs on one ASIN.** B07792YXG3 has both `J2-P3P8-FZPP` (costed)
  and `IV-YKC7-5EQJ` ($0); B009T7NSFE has both `X9-40QM-EMB1` and
  `AL-OFZ3-GHCB`. Worth confirming which is the live offer.
- **Ad spend outruns margin on two ASINs.** B009T7NSFE runs ~59% TACOS against
  a 38.8% margin, and B075QPYS96 ~47% TACOS with no cost recorded at all. Both
  lose money on every ad-driven sale at current settings.
