-- Account-level settlement lines (no SKU attached) for one account + window.
-- Feeds analysis/data/<ACCOUNT>_account_costs.json. Totals are negative in the
-- ledger; store them as positive costs in the JSON.
SELECT CASE
    WHEN amount_type IN ('Cost of Advertising','Refund for Advertiser') THEN 'advertising'
    WHEN amount_type LIKE '%Storage%' OR amount_description LIKE '%Storage%' THEN 'storage'
    WHEN amount_type LIKE '%Inbound%' OR amount_description LIKE '%Inbound%'
      OR amount_type LIKE '%Partnered Carrier%' OR amount_description LIKE '%Shipping label%' THEN 'inbound_logistics'
    WHEN amount_type LIKE '%Removal%' OR amount_description LIKE '%Removal%'
      OR amount_description LIKE '%Disposal%' OR amount_type LIKE '%Grade and Resell%' THEN 'removals_disposal'
    WHEN amount_description = 'Subscription Fee' THEN 'subscription'
    WHEN amount_type LIKE '%Customer Returns Fee%' THEN 'returns_processing'
    WHEN amount_description IN ('Current Reserve Amount','Previous Reserve Amount Balance') THEN 'reserve'
    ELSE 'other_adjustments' END AS bucket,
  COUNT(*) AS n, ROUND(SUM(amount),2) AS total
FROM `amzbi-418608.amazon_source_data.sellercentral_settlement_report_v2`
WHERE account_id = {{ACCOUNT_ID}}
  AND posted_date BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}'
  AND (sku IS NULL OR sku = '')
GROUP BY 1 ORDER BY ABS(SUM(amount)) DESC
