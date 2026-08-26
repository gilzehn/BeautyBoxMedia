-- Landed cost per SKU — Supabase (BBMEDIA project), NOT BigQuery.
-- Run with the Supabase MCP / SQL editor; save the payload as
-- analysis/data/<ACCOUNT>_cogs_supabase.json  (see build_report.py).
select json_agg(json_build_array(
         c.sku, c.asin, c.brand, c.product_group, c.title,
         round(c.purchase_cost,2),
         round(coalesce(ue.prep_cost,0),2),
         round(coalesce(ue.inbound_cost,0),2),
         round(coalesce(ue.current_price,0),2),
         round(coalesce(ue.storage_fee,0),4),
         round(coalesce(ue.fulfillment_fee,0),2),
         round(coalesce(ue.referral_fee,0),2),
         coalesce(ue.size_tier,'')
       ) order by c.sku)::text as payload
from public.cogs c
left join public.unit_economics ue on ue.account = c.account and ue.sku = c.sku
where c.account = '{{ACCOUNT}}';
