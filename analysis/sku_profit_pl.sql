-- ============================================================================
-- Brand Profit Analysis — SKU-level P&L by month, from the Amazon settlement
-- ledger plus the ad, storage, returns and traffic reports.
--
-- Source : BigQuery `amzbi-418608.amazon_source_data` (Intentwise daily export)
-- Costs  : NOT here — purchase/prep/inbound cost comes from Supabase
--          (BBMEDIA, public.cogs / public.unit_economics), joined by
--          (account, sku) in analysis/build_report.py.
--
-- Placeholders:
--   {{ACCOUNT_ID}}  TBB 1614310 · TB 1614400 · NRG 2156840 · RMR 1728680 · BCP 2839050
--   {{DATE_FROM}} / {{DATE_TO}}  the whole span; the query returns one row per
--                                calendar month per SKU inside it.
--
-- One row per (month, seller SKU) with any activity. Every money column is a
-- POSITIVE number in the direction it moves profit: `gross`, `reimb` and
-- `ad_sales` are money in, everything else is a cost. Tax is excluded on both
-- sides — marketplace-facilitator tax is collected and withheld in the same
-- amount, so it nets to zero.
-- ============================================================================

WITH
set_sku AS (
  SELECT FORMAT_DATE('%Y-%m', posted_date) AS ym, sku,
    SUM(IF(transaction_type='Order' AND amount_type='ItemPrice'
           AND amount_description IN ('Principal','Shipping','GiftWrap','RestockingFee','ReturnShipping'), amount,0)) AS gross,
    SUM(IF(transaction_type='Order' AND amount_type='ItemPrice'
           AND amount_description='Principal', quantity_purchased,0))                     AS units,
    -SUM(IF(transaction_type='Order' AND amount_type='Promotion', amount,0))              AS promo,
    -SUM(IF(transaction_type IN ('Refund','Refund_Retrocharge','Chargeback Refund')
            AND amount_type IN ('ItemPrice','Promotion')
            AND amount_description NOT LIKE '%Tax%', amount,0))                           AS refund_amt,
    -SUM(IF(amount_type='ItemFees'
            AND amount_description IN ('Commission','RefundCommission'), amount,0))       AS referral,
    -SUM(IF(amount_type='ItemFees' AND amount_description LIKE 'FBA%', amount,0))         AS fba_fee,
    -SUM(IF(amount_type='ItemFees' AND amount_description NOT IN ('Commission','RefundCommission')
            AND amount_description NOT LIKE 'FBA%', amount,0))                            AS other_fee,
    SUM(IF(amount_type='FBA Inventory Reimbursement', amount,0))                          AS reimb
  FROM `amzbi-418608.amazon_source_data.sellercentral_settlement_report_v2`
  WHERE account_id={{ACCOUNT_ID}} AND posted_date BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
    AND sku IS NOT NULL AND sku<>''
  GROUP BY 1,2),

ret AS (
  SELECT FORMAT_DATE('%Y-%m', return_date) AS ym, sku,
         SUM(quantity) AS ret_units,
         SUM(IF(detailed_disposition='SELLABLE', quantity,0)) AS ret_sellable
  FROM `amzbi-418608.amazon_source_data.sellercentral_fbareturns_report`
  WHERE account_id={{ACCOUNT_ID}} AND return_date BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY 1,2),

lst AS (
  SELECT seller_sku AS sku, item_name, asin1 AS asin, price, quantity AS on_hand, status, fulfillment_channel
  FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY seller_sku ORDER BY report_date DESC) rn
        FROM `amzbi-418608.amazon_source_data.sellercentral_alllistings_report`
        WHERE account_id={{ACCOUNT_ID}}) WHERE rn=1),

fee AS (
  SELECT sku, brand, product_size_tier
  FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY sku ORDER BY report_date DESC) rn
        FROM `amzbi-418608.amazon_source_data.sellercentral_fbafeepreview_report`
        WHERE account_id={{ACCOUNT_ID}}) WHERE rn=1),

sp AS (
  SELECT FORMAT_DATE('%Y-%m', r.reportdate) AS ym, pa.asin, SUM(r.cost) AS cost, SUM(r.attributedsales14d) AS sales
  FROM `amzbi-418608.amazon_source_data.ad_sponsoredproducts_productads_report` r
  JOIN (SELECT DISTINCT adid, asin FROM `amzbi-418608.amazon_source_data.ad_sponsoredproducts_productads`
        WHERE account_id={{ACCOUNT_ID}} AND asin IS NOT NULL) pa USING (adid)
  WHERE r.account_id={{ACCOUNT_ID}} AND r.reportdate BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY 1,2),
sd AS (
  SELECT FORMAT_DATE('%Y-%m', r.reportdate) AS ym, pa.asin, SUM(r.cost) AS cost, SUM(r.attributedsales14d) AS sales
  FROM `amzbi-418608.amazon_source_data.ad_sponsoreddisplay_productads_report` r
  JOIN (SELECT DISTINCT adid, asin FROM `amzbi-418608.amazon_source_data.ad_sponsoreddisplay_productads`
        WHERE account_id={{ACCOUNT_ID}} AND asin IS NOT NULL) pa USING (adid)
  WHERE r.account_id={{ACCOUNT_ID}} AND r.reportdate BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY 1,2),
-- A Sponsored Brands ad promotes several ASINs at once; split its cost evenly.
sb AS (
  SELECT FORMAT_DATE('%Y-%m', r.reportdate) AS ym, a.asin,
         SUM(r.cost/a.n) AS cost, SUM(r.attributedsales14d/a.n) AS sales
  FROM `amzbi-418608.amazon_source_data.ad_sponsoredbrand_ad_report` r
  JOIN (SELECT adid, asin, COUNT(*) OVER (PARTITION BY adid) n
        FROM (SELECT DISTINCT adid, asin FROM `amzbi-418608.amazon_source_data.ad_sponsoredbrand_ad_asin`
              WHERE account_id={{ACCOUNT_ID}} AND asin IS NOT NULL)) a USING (adid)
  WHERE r.account_id={{ACCOUNT_ID}} AND r.reportdate BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY 1,2),
ads AS (
  SELECT ym, asin, SUM(cost) AS ad_spend, SUM(sales) AS ad_sales
  FROM (SELECT * FROM sp UNION ALL SELECT * FROM sd UNION ALL SELECT * FROM sb)
  GROUP BY 1,2),

storage AS (
  SELECT FORMAT_DATE('%Y-%m', report_end_date) AS ym, asin,
         SUM(estimated_monthly_storage_fee) AS storage_fee
  FROM `amzbi-418608.amazon_source_data.sellercentral_fbastoragefees_report`
  WHERE account_id={{ACCOUNT_ID}} AND report_end_date BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY 1,2),

traffic AS (
  SELECT FORMAT_DATE('%Y-%m', DATE(sale_date)) AS ym, sku,
         SUM(traffic_by_asin_sessions) AS sessions,
         SAFE_DIVIDE(SUM(traffic_by_asin_buy_box_prcntg*traffic_by_asin_sessions),
                     NULLIF(SUM(traffic_by_asin_sessions),0)) AS bb
  FROM `amzbi-418608.amazon_source_data.sellercentral_salesandtrafficbysku_report`
  WHERE account_id={{ACCOUNT_ID}} AND DATE(sale_date) BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  GROUP BY 1,2),

base AS (
  SELECT s.*, COALESCE(NULLIF(l.asin,''),'') AS asin, l.item_name, l.price, l.on_hand,
         l.status, l.fulfillment_channel, f.brand, f.product_size_tier
  FROM set_sku s LEFT JOIN lst l USING (sku) LEFT JOIN fee f USING (sku)),

-- ASIN-level costs are shared across that ASIN's SKUs by revenue, within the month.
w AS (
  SELECT b.ym, b.sku,
         CASE WHEN t.asin_gross>0 THEN GREATEST(b.gross,0)/t.asin_gross ELSE 1/t.asin_skus END AS share
  FROM base b
  JOIN (SELECT ym, asin, SUM(GREATEST(gross,0)) AS asin_gross, COUNT(*) AS asin_skus
        FROM base WHERE asin<>'' GROUP BY 1,2) t
    ON t.ym=b.ym AND t.asin=b.asin)

SELECT
  b.ym, b.sku, b.asin,
  SUBSTR(COALESCE(b.item_name,''),0,55)                          AS item_name,
  COALESCE(b.brand,'')                                           AS bq_brand,
  COALESCE(b.product_size_tier,'')                               AS size_tier,
  COALESCE(b.status,'')                                          AS listing_status,
  COALESCE(b.fulfillment_channel,'')                             AS fulfillment_channel,
  ROUND(COALESCE(b.price,0),2)                                   AS price,
  COALESCE(b.on_hand,0)                                          AS on_hand,
  b.units, ROUND(b.gross,2) AS gross, ROUND(b.promo,2) AS promo,
  ROUND(b.refund_amt,2)                                          AS refund_amt,
  COALESCE(r.ret_units,0)                                        AS ret_units,
  COALESCE(r.ret_sellable,0)                                     AS ret_sellable,
  ROUND(b.referral,2) AS referral, ROUND(b.fba_fee,2) AS fba_fee,
  ROUND(b.other_fee,2) AS other_fee, ROUND(b.reimb,2) AS reimb,
  ROUND(COALESCE(sg.storage_fee,0)*COALESCE(w.share,0),2)        AS storage,
  ROUND(COALESCE(ad.ad_spend,0)*COALESCE(w.share,0),2)           AS ad_spend,
  ROUND(COALESCE(ad.ad_sales,0)*COALESCE(w.share,0),2)           AS ad_sales,
  COALESCE(t.sessions,0)                                         AS sessions,
  ROUND(COALESCE(t.bb,0),3)                                      AS buy_box
FROM base b
LEFT JOIN w       ON w.ym=b.ym  AND w.sku=b.sku
LEFT JOIN ret r   ON r.ym=b.ym  AND r.sku=b.sku
LEFT JOIN traffic t ON t.ym=b.ym AND t.sku=b.sku
LEFT JOIN ads ad  ON ad.ym=b.ym AND ad.asin=b.asin
LEFT JOIN storage sg ON sg.ym=b.ym AND sg.asin=b.asin
ORDER BY b.ym, b.gross DESC
