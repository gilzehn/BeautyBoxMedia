-- ============================================================================
-- BeautyBoxMedia /bizmanage — Supabase schema
-- Run this once in your Supabase project: SQL Editor -> paste -> Run.
-- Creates the `brands` table, enables Row-Level Security, restricts all access
-- to signed-in (authenticated) users, and seeds the initial 8 brand rows.
-- ============================================================================

-- 1. Table -------------------------------------------------------------------
create table if not exists public.brands (
  id            uuid primary key default gen_random_uuid(),
  brand         text        not null default '',
  registry      text        not null default '',
  reseller_type text        not null default '',
  asins         integer     not null default 0,
  account_name  text        not null default '',
  owned_by      text        not null default '',
  urgency       text        not null default 'Low',
  priority      text        not null default 'Low',
  created_at    timestamptz not null default now()
);

-- 2. Row-Level Security ------------------------------------------------------
-- With RLS on and only an "authenticated" policy, the public anon key cannot
-- read or write anything unless a user is signed in. This is what makes it safe
-- to ship the anon key in the static site.
alter table public.brands enable row level security;

drop policy if exists "Authenticated users have full access" on public.brands;
create policy "Authenticated users have full access"
  on public.brands
  for all
  to authenticated
  using (true)
  with check (true);

-- 3. Seed data ---------------------------------------------------------------
-- Only inserts when the table is empty, so re-running this file is safe.
insert into public.brands (brand, registry, reseller_type, asins, account_name, owned_by, urgency, priority)
select * from (values
  ('Cosmedica',       'Approved',     '1P',     42, 'Cosmedica Skincare',          'Regina',  'High',   'High'),
  ('Glimmer Goddess', 'Approved',     '3P',     18, 'Glimmer Goddess LLC',         'Mariann', 'Medium', 'High'),
  ('Kai',             'Pending',      '3P',      7, 'Kai Fragrance',               'Regina',  'High',   'Medium'),
  ('LifeFactory',     'Approved',     'Hybrid', 63, 'LifeFactory Inc.',            'Mariann', 'Low',    'Medium'),
  ('Water Colors',    'Not Enrolled', '3P',      5, 'Water Colors Beauty',         'Regina',  'Medium', 'Low'),
  ('Nina Ibrow',      'Approved',     '1P',     24, 'Nina Ibrow Studio',           'Mariann', 'Low',    'Low'),
  ('Brush Clean Pro', 'Pending',      '3P',     11, 'Brush Clean Pro',             'Regina',  'High',   'High'),
  ('Demeter',         'Approved',     'Hybrid', 88, 'Demeter Fragrance Library',   'Mariann', 'Medium', 'Medium')
) as seed(brand, registry, reseller_type, asins, account_name, owned_by, urgency, priority)
where not exists (select 1 from public.brands);
