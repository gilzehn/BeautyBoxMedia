-- ============================================================
-- BizManage — full Supabase setup (run once)
-- Creates public.brands + public.dropdown_options, seeds 58 brands
-- and 21 dropdown options, and adds the temporary anon policies the
-- console needs while it still uses the placeholder login.
-- Safe to re-run: IF NOT EXISTS + upsert throughout.
-- ============================================================

-- ---------- 20260707000000_create_brands.sql ----------
-- Migration: create the brands table
-- Source of truth: iCommerceteam Brand Portfolio ("CURRENT BRANDS - AS OF JUNE 2026")
-- Backs the BizManage console (app/bizmanage/page.tsx), replacing its hardcoded
-- placeholder rows with live data.
--
-- Column names mirror the brand portfolio schema (see supabase/README.md).
-- Dropdown columns (account_name, brand_registry, reseller_type, owned_by,
-- urgency, status) are NOT constrained here: their allowed values live in the
-- public.dropdown_options table (see 20260707010000_dropdown_options.sql), so a
-- new option can be added with a single row insert instead of a migration. A
-- trigger in that migration validates brand rows against those options.

create table if not exists public.brands (
  id             bigint primary key,
  brand          text        not null,

  -- Which seller account the brand belongs to. Dropdown → dropdown_options.
  account_name   text        not null,

  -- Amazon Brand Registry status. Dropdown → dropdown_options.
  brand_registry text        not null,

  -- Affiliation / reseller relationship. Dropdown → dropdown_options.
  reseller_type  text        not null,

  -- Number of ASINs; free text, entered manually. '' until filled in.
  num_asins      text        not null default '',

  -- Owner; '' means unassigned. Dropdown → dropdown_options.
  owned_by       text        not null default '',

  -- Work urgency; '' means unset. Dropdown → dropdown_options.
  urgency        text        not null default '',

  -- Global rank 1-30, unique across all brands; null until ranked.
  priority       integer     unique
                   check (priority is null or priority between 1 and 30),

  -- Lifecycle status. Dropdown → dropdown_options.
  status         text        not null default 'Active',

  est_sow        text        not null default '',
  note           text        not null default '',

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.brands is
  'iCommerceteam multi-brand Amazon portfolio (NRG/RMR + The Beauty Box). A brand may appear on both account lists, so (brand) is not unique; id is the stable key.';

-- Helpful filters for the console (account tabs, status, ranked ordering).
create index if not exists brands_account_name_idx  on public.brands (account_name);
create index if not exists brands_status_idx       on public.brands (status);
create index if not exists brands_priority_idx     on public.brands (priority);

-- Keep updated_at fresh on every write.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
  before update on public.brands
  for each row
  execute function public.set_updated_at();

-- Row Level Security ---------------------------------------------------------
-- BizManage is an internal console. Lock the table down: only signed-in users
-- may read, and only signed-in users may write. The service_role key (used by
-- trusted server-side code) bypasses RLS automatically. Tighten further to
-- specific roles/claims once real auth is wired up.
alter table public.brands enable row level security;

drop policy if exists brands_select_authenticated on public.brands;
create policy brands_select_authenticated
  on public.brands
  for select
  to authenticated
  using (true);

drop policy if exists brands_write_authenticated on public.brands;
create policy brands_write_authenticated
  on public.brands
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------- 20260707010000_dropdown_options.sql ----------
-- Migration: dropdown_options — one table driving every dropdown in BizManage.
--
-- Instead of hardcoding allowed values as CHECK constraints on public.brands,
-- the values for every dropdown live here as rows. Adding or renaming an option
-- is a single INSERT/UPDATE — no migration, no code deploy. The console builds
-- each dropdown by reading this table (filtered by `field`, `active = true`,
-- ordered by `sort_order`).
--
--   -- Example: add a new "Owned By" person
--   insert into public.dropdown_options (field, value) values ('owned_by', 'New Person');

create table if not exists public.dropdown_options (
  id         bigint generated always as identity primary key,
  field      text    not null,   -- which dropdown, e.g. 'owned_by', 'urgency'
  value      text    not null,   -- the stored value, e.g. 'Regina'
  label      text,               -- display text; UI falls back to value when null
  sort_order integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (field, value)
);

comment on table public.dropdown_options is
  'Allowed values for every BizManage dropdown (account_name, brand_registry, reseller_type, owned_by, urgency, status). One row per option. Add a value by inserting a row — no migration needed.';

create index if not exists dropdown_options_field_idx
  on public.dropdown_options (field, active, sort_order);

-- Seed the current option sets (from the June 2026 brand portfolio).
-- Idempotent: re-running only adds missing options, never clobbers edits.
-- Empty / unassigned states (owned_by = '', urgency = '') are represented by a
-- blank value on the brand row and a "— unassigned" placeholder in the UI, so
-- they are intentionally NOT seeded as options here.
insert into public.dropdown_options (field, value, sort_order) values
  ('account_name', 'NRG', 1),
  ('account_name', 'RMR', 2),
  ('account_name', 'TBB', 3),
  ('account_name', 'TB', 4),

  ('brand_registry', 'Yes', 1),
  ('brand_registry', 'No', 2),
  ('brand_registry', 'N/A', 3),

  ('reseller_type', 'Exclusive', 1),
  ('reseller_type', 'Semi-Exclusive', 2),
  ('reseller_type', 'Pending Exclusive', 3),
  ('reseller_type', 'Reseller', 4),
  ('reseller_type', 'Exclusive under Skin Revolution', 5),
  ('reseller_type', 'Not specified', 6),

  ('owned_by', 'BBMEDIA', 1),
  ('owned_by', 'Regina', 2),
  ('owned_by', 'Mariann', 3),

  ('urgency', 'High', 1),
  ('urgency', 'Medium', 2),
  ('urgency', 'Low', 3),

  ('status', 'Active', 1),
  ('status', 'Closing Out', 2)
on conflict (field, value) do nothing;

-- RLS: same shape as public.brands — signed-in users read/write; service_role
-- (trusted server-side code) bypasses RLS automatically.
alter table public.dropdown_options enable row level security;

drop policy if exists dropdown_options_select_authenticated on public.dropdown_options;
create policy dropdown_options_select_authenticated
  on public.dropdown_options
  for select
  to authenticated
  using (true);

drop policy if exists dropdown_options_write_authenticated on public.dropdown_options;
create policy dropdown_options_write_authenticated
  on public.dropdown_options
  for all
  to authenticated
  using (true)
  with check (true);

-- Validation trigger ---------------------------------------------------------
-- Replaces the CHECK constraints removed from public.brands: on insert/update,
-- each dropdown column must be either empty ('' / NULL) or a known option for
-- its field. Additions are never blocked — insert the option row first, then
-- the value is accepted. To turn enforcement off entirely, drop this trigger;
-- the app can validate on its own.
create or replace function public.validate_brand_dropdowns()
returns trigger
language plpgsql
set search_path = ''
as $
declare
  bad_field text;
  bad_value text;
begin
  -- Find the first dropdown column whose (non-empty) value isn't a known option.
  select p.field, p.value
    into bad_field, bad_value
  from (values
    ('account_name',   new.account_name),
    ('brand_registry', new.brand_registry),
    ('reseller_type',  new.reseller_type),
    ('owned_by',       new.owned_by),
    ('urgency',        new.urgency),
    ('status',         new.status)
  ) as p(field, value)
  where p.value is not null and p.value <> ''
    and not exists (
      select 1 from public.dropdown_options o
      where o.field = p.field and o.value = p.value
    )
  limit 1;

  if bad_field is not null then
    raise exception
      'Invalid % value %; add it to dropdown_options first',
      bad_field, quote_literal(bad_value)
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists brands_validate_dropdowns on public.brands;
create trigger brands_validate_dropdowns
  before insert or update on public.brands
  for each row
  execute function public.validate_brand_dropdowns();

-- ---------- 20260707020000_brands_id_identity.sql ----------
-- Give brands.id an auto-generated default so the console can insert new
-- brands without picking an id itself (avoids duplicate-id races between two
-- people adding at once). Explicitly-provided ids (the seed) still work; the
-- seed ends with setval() so the sequence continues after the highest seeded
-- id.
--
-- Wrapped in a guard so re-running (e.g. via setup.sql) is a no-op.
do $$
begin
  if not exists (
    select 1
    from pg_attribute
    where attrelid = 'public.brands'::regclass
      and attname = 'id'
      and attidentity <> ''
  ) then
    alter table public.brands
      alter column id add generated by default as identity;
  end if;
end
$$;

-- ---------- 20260707030000_temp_anon_access.sql ----------
-- TEMPORARY ACCESS while the console still uses its client-side placeholder
-- gate instead of Supabase Auth.
--
-- The browser talks to the database with the public anon key, so these
-- policies let the console work today: anon may READ both tables and INSERT
-- brands. Anyone who extracts the anon key from the deployed page bundle gets
-- exactly this access — acceptable for a low-sensitivity internal brand list,
-- not for anything more.
--
-- When real Supabase Auth is wired up, remove this file's policies:
--   drop policy brands_anon_select_temp          on public.brands;
--   drop policy brands_anon_insert_temp          on public.brands;
--   drop policy dropdown_options_anon_select_temp on public.dropdown_options;
-- (the authenticated policies from the earlier migrations stay).

drop policy if exists brands_anon_select_temp on public.brands;
create policy brands_anon_select_temp
  on public.brands
  for select
  to anon
  using (true);

drop policy if exists brands_anon_insert_temp on public.brands;
create policy brands_anon_insert_temp
  on public.brands
  for insert
  to anon
  with check (true);

drop policy if exists dropdown_options_anon_select_temp on public.dropdown_options;
create policy dropdown_options_anon_select_temp
  on public.dropdown_options
  for select
  to anon
  using (true);

-- ---------- seed.sql ----------
-- Seed: iCommerceteam Brand Portfolio
-- Generated from the "CURRENT BRANDS - AS OF JUNE 2026" export (58 brands).
-- Idempotent: re-running refreshes every row from this file (upsert on id).
-- account_name is the seller account (dropdown); pairs were split NRG/RMR->NRG,
-- TBB/TB->TBB (re-assign the RMR / TB ones per brand as needed).
-- num_asins is free text, entered manually (empty until filled).
-- Column order:
--   id, brand, account_name, brand_registry, reseller_type, num_asins,
--   owned_by, urgency, priority, status, est_sow, note

insert into public.brands
  (id, brand, account_name, brand_registry, reseller_type, num_asins,
   owned_by, urgency, priority, status, est_sow, note)
values
  (1, 'Ariston', 'NRG', 'Yes', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (2, 'Baobab', 'NRG', 'No', 'Reseller', '', '', '', null, 'Active', '', 'Affiliation not specified in source'),
  (3, 'Bodi Fresh', 'NRG', 'Yes', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (4, 'Brandywine', 'NRG', 'No', 'Reseller', '', '', '', null, 'Active', '', ''),
  (5, 'Demeter', 'NRG', 'Yes', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (6, 'H-42', 'NRG', 'Yes', 'Exclusive under Skin Revolution', '', '', '', null, 'Active', '', ''),
  (7, 'Inglot', 'NRG', 'No', 'Reseller', '', '', '', null, 'Active', '', 'Also on TBB/TB list (Semi-Exclusive)'),
  (8, 'Kitoko', 'NRG', 'No', 'Reseller', '', '', '', null, 'Active', '', ''),
  (9, 'Leather Luster', 'NRG', 'Yes', 'Exclusive under Skin Revolution', '', '', '', null, 'Active', '', ''),
  (10, 'Midway', 'NRG', 'No', 'Reseller', '', '', '', null, 'Active', '', ''),
  (11, 'Milagros', 'NRG', 'Yes', 'Exclusive under Skin Revolution', '', '', '', null, 'Active', '', ''),
  (12, 'Mina Brow', 'NRG', 'Yes', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (13, 'Olé Capilar', 'NRG', 'Yes', 'Exclusive under Skin Revolution', '', '', '', null, 'Active', '', ''),
  (14, 'Ritual Botanico', 'NRG', 'Yes', 'Exclusive under Skin Revolution', '', '', '', null, 'Active', '', ''),
  (15, 'Scimera', 'NRG', 'Yes', 'Exclusive', '', '', '', null, 'Active', '', 'Also on TBB/TB list (Exclusive)'),
  (16, 'Sqwinchers', 'NRG', 'No', 'Reseller', '', '', '', null, 'Active', '', ''),
  (17, 'Two Old Goats', 'NRG', 'No', 'Reseller', '', '', '', null, 'Active', '', ''),
  (18, 'WPP', 'NRG', 'Yes', 'Exclusive', '', '', '', null, 'Active', '', 'Color mask variation only, for now'),
  (19, 'Y-Not Natural', 'NRG', 'Yes', 'Exclusive', '', '', '', null, 'Active', '', 'Need to determine if there is a path forward'),
  (20, 'Do/Mastey', 'NRG', 'No', 'Not specified', '', '', '', null, 'Closing Out', '', ''),
  (21, 'Glimmer Goddess', 'NRG', 'No', 'Not specified', '', '', '', null, 'Closing Out', '', 'Closing out on NRG; still active on TBB/TB'),
  (22, 'Kiara Sky', 'NRG', 'No', 'Not specified', '', '', '', null, 'Closing Out', '', 'Also closing out on TBB/TB'),
  (23, 'Life Factory', 'NRG', 'No', 'Not specified', '', '', '', null, 'Closing Out', '', ''),
  (24, 'Lineco', 'NRG', 'No', 'Not specified', '', '', '', null, 'Closing Out', '', ''),
  (25, 'Plantlife', 'NRG', 'No', 'Not specified', '', '', '', null, 'Closing Out', '', ''),
  (26, 'Saratoga Olive Oil Co', 'NRG', 'No', 'Not specified', '', '', '', null, 'Closing Out', '', ''),
  (27, 'Staleks', 'NRG', 'No', 'Not specified', '', '', '', null, 'Closing Out', '', 'Also closing out on TBB/TB'),
  (28, 'NutriRoot', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (29, 'Cosmedica Skincare', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (30, 'Chihtsai', 'TBB', 'N/A', 'Pending Exclusive', '', '', '', null, 'Active', '', ''),
  (31, 'Eagle Fortress', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (32, 'El Gallito Coffee', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (33, 'French Farm', 'TBB', 'N/A', 'Not specified', '', '', '', null, 'Active', '', ''),
  (34, 'Glimmer Goddess', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (35, 'Golden Rabbit', 'TBB', 'N/A', 'Semi-Exclusive', '', '', '', null, 'Active', '', ''),
  (36, 'Govino', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (37, 'H2Pro', 'TBB', 'N/A', 'Not specified', '', '', '', null, 'Active', '', ''),
  (38, 'Inglot', 'TBB', 'N/A', 'Semi-Exclusive', '', '', '', null, 'Active', '', 'Also on NRG list (Reseller)'),
  (39, 'Kai', 'TBB', 'N/A', 'Not specified', '', '', '', null, 'Active', '', ''),
  (40, 'Le Blanc', 'TBB', 'N/A', 'Not specified', '', '', '', null, 'Active', '', ''),
  (41, 'Lifefactory', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (42, 'Lisap Haircare', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (43, 'Mason Pearson', 'TBB', 'N/A', 'Not specified', '', '', '', null, 'Active', '', ''),
  (44, 'Mizon', 'TBB', 'N/A', 'Semi-Exclusive', '', '', '', null, 'Active', '', 'Korean skincare · Shopify full SKU / Amazon all besides snail mucin'),
  (45, 'Nailplex Shield', 'TBB', 'N/A', 'Semi-Exclusive', '', '', '', null, 'Active', '', ''),
  (46, 'Nailtiques', 'TBB', 'N/A', 'Not specified', '', '', '', null, 'Active', '', ''),
  (47, 'Orange Chronic', 'TBB', 'N/A', 'Not specified', '', '', '', null, 'Active', '', ''),
  (48, 'Redavid', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (49, 'Restorsea', 'TBB', 'N/A', 'Semi-Exclusive', '', '', '', null, 'Active', '', ''),
  (50, 'Roxanne Rizzo', 'TBB', 'N/A', 'Semi-Exclusive', '', '', '', null, 'Active', '', ''),
  (51, 'Ruminae', 'TBB', 'N/A', 'Pending Exclusive', '', '', '', null, 'Active', '', ''),
  (52, 'Scimera', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', 'Also on NRG list (Exclusive)'),
  (53, 'Sonoma Syrup Co', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', ''),
  (54, 'The Balm Cosmetics', 'TBB', 'N/A', 'Semi-Exclusive', '', '', '', null, 'Active', '', ''),
  (55, 'Three Lollies', 'TBB', 'N/A', 'Not specified', '', '', '', null, 'Active', '', ''),
  (56, 'Toweldry', 'TBB', 'N/A', 'Pending Exclusive', '', '', '', null, 'Active', '', ''),
  (57, 'Vivioptal', 'TBB', 'N/A', 'Pending Exclusive', '', '', '', null, 'Active', '', ''),
  (58, 'Watercolors Haircare', 'TBB', 'N/A', 'Exclusive', '', '', '', null, 'Active', '', '')
on conflict (id) do update set
  brand          = excluded.brand,
  account_name   = excluded.account_name,
  brand_registry = excluded.brand_registry,
  reseller_type  = excluded.reseller_type,
  num_asins      = excluded.num_asins,
  owned_by       = excluded.owned_by,
  urgency        = excluded.urgency,
  priority       = excluded.priority,
  status         = excluded.status,
  est_sow        = excluded.est_sow,
  note           = excluded.note;

-- Keep the id sequence ahead of the explicitly-seeded ids so new console
-- inserts don't collide with them. (brands.id is GENERATED BY DEFAULT AS
-- IDENTITY; explicit inserts above do not advance its sequence.)
select setval(
  pg_get_serial_sequence('public.brands', 'id'),
  greatest((select max(id) from public.brands), 1)
);

