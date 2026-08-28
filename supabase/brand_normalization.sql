-- Brand name normalization for public.cogs and public.brands
--
-- Problem: the same brand is spelled differently in the two tables (and in
-- different casings inside cogs), so any join or GROUP BY on brand splits one
-- brand into several. Examples: "Baobab" vs "Baobab Collection",
-- "Sqwinchers" vs "Sqwincher", "WATERCOLORS" vs "Watercolors Haircare".
--
-- This script maps every known variant to one canonical spelling and applies it
-- to both tables. It is idempotent: re-running it changes nothing.
--
-- Preview before applying:
--   select account, brand, count(*) from cogs
--    where brand in (<variant list below>) group by 1,2 order by 3 desc;

begin;

create temporary table brand_map (variant text primary key, canonical text not null) on commit drop;

insert into brand_map (variant, canonical) values
  -- casing only
  ('CRISAN',                    'Crisan'),
  ('DEMETER',                   'Demeter'),
  ('EAGLE FORTRESS',            'Eagle Fortress'),
  ('H2PRO',                     'H2Pro'),
  ('kai',                       'Kai'),
  ('LE BLANC',                  'Le Blanc'),
  ('MIZON',                     'Mizon'),
  ('CABELINNA',                 'Cabelinna'),
  ('KATIVA',                    'Kativa'),
  ('PASTIGLIE LEONE',           'Pastiglie Leone'),
  ('ELLA TU',                   'Ella Tu'),
  -- spelling variants between the two tables
  ('Baobab',                    'Baobab Collection'),
  ('EL GALLITO',                'El Gallito Coffee'),
  ('H-42',                      'H-42 Clean Clippers'),
  ('H-42 CLEAN CLIPPERS',       'H-42 Clean Clippers'),
  ('Life Factory',              'Lifefactory'),
  ('OLÉ',                       'Olé Capilar'),
  ('Scimera',                   'Scimera Bioscience'),
  ('Scimera - ?',               'Scimera Bioscience'),
  ('Sqwinchers',                'Sqwincher'),
  ('The Balm Cosmetics',        'TheBalm Cosmetics'),
  ('Toweldry',                  'Towel Dry'),
  ('Vivioptal',                 'Vivioptal Vitamins'),
  ('Y-Not Natural',             'Y Not Natural'),
  -- judgement calls: a short label in brands vs the full trade name in cogs
  ('Lisap Haircare',            'Lisap Milano'),
  ('WPP',                       'Wellness Premium Products'),
  ('WATERCOLORS',               'Watercolors Haircare');

update cogs c
   set brand = m.canonical, updated_at = now()
  from brand_map m
 where c.brand = m.variant and c.brand <> m.canonical;

update brands b
   set brand = m.canonical, updated_at = now()
  from brand_map m
 where b.brand = m.variant and b.brand <> m.canonical;

commit;

-- Verification: every brand in cogs should now have a matching row in brands.
-- Rows returned here are real gaps in the brands table, not spelling problems.
select distinct c.brand as cogs_brand_missing_from_brands_table
  from cogs c
 where not exists (select 1 from brands b where b.brand = c.brand)
 order by 1;
