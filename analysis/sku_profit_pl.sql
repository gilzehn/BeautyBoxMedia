-- ============================================================================
-- Brand Profit Analysis — SKU-level P&L from Amazon settlement + ads + traffic
--
-- Source : BigQuery `amzbi-418608.amazon_source_data` (Intentwise daily export)
-- Costs  : NOT here — purchase/prep/inbound cost comes from Supabase
--          (BBMEDIA project, public.cogs / public.unit_economics), joined by
--          (account, sku) in analysis/build_report.py.
--
-- Replace the three placeholders and run in BigQuery:
--   {{ACCOUNT_ID}}  Amazon account_id  (TBB 1614310 · TB 1614400 ·
--                   NRG 2156840 · RMR 1728680 · BCP 2839050)
--   {{DATE_FROM}}   inclusive start of the analysis window, e.g. 2026-05-01
--   {{DATE_TO}}     inclusive end,   e.g. 2026-07-31
--
-- One row per seller SKU with any activity in the window. Every money column
-- is stated as a POSITIVE number in the direction it moves profit:
-- `gross`, `reimb`, `ad_sales` are money in; every other money column is a
-- cost. Taxes are excluded on both sides (marketplace-facilitator tax is
-- collected and withheld in the same amount, so it nets to zero).
-- ============================================================================

WITH
-- 1. Settlement ledger, SKU-attributable rows -------------------------------
set_sku AS (
  SELECT
    sku,
    -- Money in: item principal + shipping + gift wrap charged to the customer.
    SUM(IF(transaction_type = 'Order' AND amount_type = 'ItemPrice'
           AND amount_description IN ('Principal','Shipping','GiftWrap','RestockingFee','ReturnShipping'),
           amount, 0))                                                    AS gross,
    SUM(IF(transaction_type = 'Order' AND amount_type = 'ItemPrice'
           AND amount_description = 'Principal', quantity_purchased, 0))  AS units,
    -- Promotional rebates (coupons, deals, S&S discounts) — a cost.
    -SUM(IF(transaction_type = 'Order' AND amount_type = 'Promotion', amount, 0))
                                                                          AS promo,
    -- Refunds: principal + shipping given back, net of the promo share
    -- Amazon claws back with them. Tax lines excluded.
    -SUM(IF(transaction_type IN ('Refund','Refund_Retrocharge','Chargeback Refund')
            AND amount_type IN ('ItemPrice','Promotion')
            AND amount_description NOT LIKE '%Tax%', amount, 0))          AS refund_amt,
    -- Referral commission, net of the portion refunded back on returns.
    -SUM(IF(amount_type = 'ItemFees'
            AND amount_description IN ('Commission','RefundCommission'), amount, 0))
                                                                          AS referral,
    -- FBA pick & pack (per-unit fulfilment fee).
    -SUM(IF(amount_type = 'ItemFees' AND amount_description LIKE 'FBA%', amount, 0))
                                                                          AS fba_fee,
    -- Shipping / gift-wrap chargebacks, liquidation brokerage, etc.
    -SUM(IF(amount_type = 'ItemFees'
            AND amount_description NOT IN ('Commission','RefundCommission')
            AND amount_description NOT LIKE 'FBA%', amount, 0))           AS other_fee,
    -- Money back from Amazon for lost/damaged/mis-charged inventory
    -- (net: clawbacks are negative rows in the same bucket).
    SUM(IF(amount_type = 'FBA Inventory Reimbursement', amount, 0))       AS reimb
  FROM `amzbi-418608.amazon_source_data.sellercentral_settlement_report_v2`
  WHERE account_id = {{ACCOUNT_ID}}
    AND posted_date BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
    AND sku IS NOT NULL AND sku <> ''
  GROUP BY sku
),

-- 2. Customer returns — units and what came back sellable -------------------
ret AS (
  SELECT sku,
         SUM(quantity)                                             AS ret_units,
         SUM(IF(detailed_disposition = 'SELLABLE', quantity, 0))   AS ret_sellable
  FROM `amzbi-418608.amazon_source_data.sellercentral_fbareturns_report`
  WHERE account_id = {{ACCOUNT_ID}}
    AND return_date BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY sku
),

-- 3. Catalog identity — latest All Listings row per SKU ---------------------
lst AS (
  SELECT seller_sku AS sku, item_name, asin1 AS asin, price, quantity AS on_hand,
         status, fulfillment_channel
  FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY seller_sku ORDER BY report_date DESC) AS rn
    FROM `amzbi-418608.amazon_source_data.sellercentral_alllistings_report`
    WHERE account_id = {{ACCOUNT_ID}}
  )
  WHERE rn = 1
),

-- 4. Brand / size tier from the latest FBA fee preview ----------------------
fee AS (
  SELECT sku, brand, product_size_tier
  FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY sku ORDER BY report_date DESC) AS rn
    FROM `amzbi-418608.amazon_source_data.sellercentral_fbafeepreview_report`
    WHERE account_id = {{ACCOUNT_ID}}
  )
  WHERE rn = 1
),

-- 5. Advertising by ASIN — Sponsored Products + Display + Brands ------------
sp AS (
  SELECT pa.asin, SUM(r.cost) AS cost, SUM(r.attributedsales14d) AS sales
  FROM `amzbi-418608.amazon_source_data.ad_sponsoredproducts_productads_report` r
  JOIN (SELECT DISTINCT adid, asin
        FROM `amzbi-418608.amazon_source_data.ad_sponsoredproducts_productads`
        WHERE account_id = {{ACCOUNT_ID}} AND asin IS NOT NULL) pa USING (adid)
  WHERE r.account_id = {{ACCOUNT_ID}}
    AND r.reportdate BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY 1
),
sd AS (
  SELECT pa.asin, SUM(r.cost) AS cost, SUM(r.attributedsales14d) AS sales
  FROM `amzbi-418608.amazon_source_data.ad_sponsoreddisplay_productads_report` r
  JOIN (SELECT DISTINCT adid, asin
        FROM `amzbi-418608.amazon_source_data.ad_sponsoreddisplay_productads`
        WHERE account_id = {{ACCOUNT_ID}} AND asin IS NOT NULL) pa USING (adid)
  WHERE r.account_id = {{ACCOUNT_ID}}
    AND r.reportdate BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY 1
),
-- A Sponsored Brands ad promotes several ASINs at once, so its cost is split
-- evenly across the ASINs on the creative.
sb AS (
  SELECT a.asin,
         SUM(r.cost / a.n)               AS cost,
         SUM(r.attributedsales14d / a.n) AS sales
  FROM `amzbi-418608.amazon_source_data.ad_sponsoredbrand_ad_report` r
  JOIN (SELECT adid, asin, COUNT(*) OVER (PARTITION BY adid) AS n
        FROM (SELECT DISTINCT adid, asin
              FROM `amzbi-418608.amazon_source_data.ad_sponsoredbrand_ad_asin`
              WHERE account_id = {{ACCOUNT_ID}} AND asin IS NOT NULL)) a USING (adid)
  WHERE r.account_id = {{ACCOUNT_ID}}
    AND r.reportdate BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY 1
),
ads AS (
  SELECT asin, SUM(cost) AS ad_spend, SUM(sales) AS ad_sales
  FROM (SELECT * FROM sp UNION ALL SELECT * FROM sd UNION ALL SELECT * FROM sb)
  GROUP BY asin
),

-- 6. Monthly + long-term storage by ASIN ------------------------------------
storage AS (
  SELECT asin, SUM(estimated_monthly_storage_fee) AS storage_fee
  FROM `amzbi-418608.amazon_source_data.sellercentral_fbastoragefees_report`
  WHERE account_id = {{ACCOUNT_ID}}
    AND report_end_date BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY asin
),

-- 7. Traffic — sessions and Buy Box, for conversion diagnostics -------------
traffic AS (
  SELECT sku,
         SUM(traffic_by_asin_sessions)     AS sessions,
         SUM(traffic_by_asin_page_views)   AS page_views,
         SAFE_DIVIDE(SUM(traffic_by_asin_buy_box_prcntg * traffic_by_asin_sessions),
                     NULLIF(SUM(traffic_by_asin_sessions), 0)) AS buy_box_pct
  FROM `amzbi-418608.amazon_source_data.sellercentral_salesandtrafficbysku_report`
  WHERE account_id = {{ACCOUNT_ID}}
    AND DATE(sale_date) BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY sku
),

-- 8. SKU spine with its ASIN -----------------------------------------------
base AS (
  SELECT s.*,
         COALESCE(NULLIF(l.asin, ''), '') AS asin,
         l.item_name, l.price, l.on_hand, l.status, l.fulfillment_channel,
         f.brand, f.product_size_tier
  FROM set_sku s
  LEFT JOIN lst l USING (sku)
  LEFT JOIN fee f USING (sku)
),
-- ASIN-level costs are shared out across that ASIN's SKUs by revenue
-- (falling back to an even split when the ASIN had no sales in the window).
weights AS (
  SELECT asin,
         SUM(GREATEST(gross, 0))  AS asin_gross,
         COUNT(*)                 AS asin_skus
  FROM base WHERE asin <> '' GROUP BY asin
)

SELECT
  b.sku,
  b.asin,
  SUBSTR(COALESCE(b.item_name, ''), 0, 90)                       AS item_name,
  COALESCE(b.brand, '')                                          AS bq_brand,
  COALESCE(b.product_size_tier, '')                              AS size_tier,
  COALESCE(b.status, '')                                         AS listing_status,
  COALESCE(b.fulfillment_channel, '')                            AS fulfillment_channel,
  ROUND(COALESCE(b.price, 0), 2)                                 AS price,
  COALESCE(b.on_hand, 0)                                         AS on_hand,
  b.units,
  ROUND(b.gross, 2)                                              AS gross,
  ROUND(b.promo, 2)                                              AS promo,
  ROUND(b.refund_amt, 2)                                         AS refund_amt,
  COALESCE(r.ret_units, 0)                                       AS ret_units,
  COALESCE(r.ret_sellable, 0)                                    AS ret_sellable,
  ROUND(b.referral, 2)                                           AS referral,
  ROUND(b.fba_fee, 2)                                            AS fba_fee,
  ROUND(b.other_fee, 2)                                          AS other_fee,
  ROUND(b.reimb, 2)                                              AS reimb,
  ROUND(COALESCE(st.storage_fee, 0) * COALESCE(w.share, 0), 2)   AS storage,
  ROUND(COALESCE(ad.ad_spend, 0)   * COALESCE(w.share, 0), 2)    AS ad_spend,
  ROUND(COALESCE(ad.ad_sales, 0)   * COALESCE(w.share, 0), 2)    AS ad_sales,
  COALESCE(t.sessions, 0)                                        AS sessions,
  COALESCE(t.page_views, 0)                                      AS page_views,
  ROUND(COALESCE(t.buy_box_pct, 0), 4)                           AS buy_box_pct
FROM base b
LEFT JOIN (
  SELECT b2.sku, b2.asin,
         CASE WHEN w2.asin_gross > 0 THEN GREATEST(b2.gross, 0) / w2.asin_gross
              ELSE 1 / w2.asin_skus END AS share
  FROM base b2 JOIN weights w2 USING (asin)
) w USING (sku)
LEFT JOIN ret     r  USING (sku)
LEFT JOIN traffic t  USING (sku)
LEFT JOIN ads     ad ON ad.asin = b.asin
LEFT JOIN storage st ON st.asin = b.asin
ORDER BY b.gross DESC
