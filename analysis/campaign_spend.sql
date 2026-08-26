-- Advertising by the brand token in the campaign name.
-- Convention in use on NRG:  iComm | <Brand> - <product line> | <SP|SB|SD> | <targeting>
-- The P&L attributes ad dollars by the ad's ASIN; this is the same money seen
-- the way the ad team manages it. Feeds analysis/data/<ACCOUNT>_campaign_spend.json.
WITH camp AS (
  SELECT 'SP' typ, campaignid, ANY_VALUE(name) nm FROM `amzbi-418608.amazon_source_data.ad_sponsoredproducts_campaign` WHERE account_id={{ACCOUNT_ID}} GROUP BY 1,2
  UNION ALL SELECT 'SB', campaignid, ANY_VALUE(name) FROM `amzbi-418608.amazon_source_data.ad_sponsoredbrand_campaign` WHERE account_id={{ACCOUNT_ID}} GROUP BY 1,2
  UNION ALL SELECT 'SD', campaignid, ANY_VALUE(name) FROM `amzbi-418608.amazon_source_data.ad_sponsoreddisplay_campaign` WHERE account_id={{ACCOUNT_ID}} GROUP BY 1,2
), rep AS (
  SELECT 'SP' typ, campaignid, FORMAT_DATE('%Y-%m', reportdate) ym, SUM(cost) cost, SUM(attributedsales14d) sales
  FROM `amzbi-418608.amazon_source_data.ad_sponsoredproducts_campaign_report`
  WHERE account_id={{ACCOUNT_ID}} AND reportdate BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}' GROUP BY 1,2,3
  UNION ALL
  SELECT 'SB', campaignid, FORMAT_DATE('%Y-%m', reportdate), SUM(cost), SUM(attributedsales14d)
  FROM `amzbi-418608.amazon_source_data.ad_sponsoredbrand_campaign_report`
  WHERE account_id={{ACCOUNT_ID}} AND reportdate BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}' GROUP BY 1,2,3
  UNION ALL
  SELECT 'SD', campaignid, FORMAT_DATE('%Y-%m', reportdate), SUM(cost), SUM(attributedsales14d)
  FROM `amzbi-418608.amazon_source_data.ad_sponsoreddisplay_campaign_report`
  WHERE account_id={{ACCOUNT_ID}} AND reportdate BETWEEN '{{DATE_FROM}}' AND '{{DATE_TO}}' GROUP BY 1,2,3
)
SELECT r.ym,
  TRIM(SPLIT(SPLIT(COALESCE(c.nm,'(unnamed)'),'|')[SAFE_OFFSET(1)],' - ')[SAFE_OFFSET(0)]) AS brand_token,
  r.typ, ROUND(SUM(r.cost),2) cost, ROUND(SUM(r.sales),2) sales
FROM rep r LEFT JOIN camp c ON c.campaignid=r.campaignid AND c.typ=r.typ
WHERE r.cost > 0
GROUP BY 1,2,3 ORDER BY 2,1,3
