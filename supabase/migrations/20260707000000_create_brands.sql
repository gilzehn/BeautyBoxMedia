-- Migration: create the brands table
-- Source of truth: iCommerceteam Brand Portfolio ("CURRENT BRANDS - AS OF JUNE 2026")
-- Backs the BizManage console (app/bizmanage/page.tsx), replacing its hardcoded
-- placeholder rows with live data.
--
-- Column names mirror the brand portfolio schema (see supabase/README.md).
-- Enumerated columns use CHECK constraints rather than native ENUM types so the
-- allowed sets can be widened later with a plain ALTER ... DROP/ADD CONSTRAINT.

create table if not exists public.brands (
  id             bigint primary key,
  brand          text        not null,

  -- Which account list the brand belongs to.
  source         text        not null
                   check (source in ('NRG/RMR', 'TBB/TB')),

  -- Amazon Brand Registry status.
  brand_registry text        not null
                   check (brand_registry in ('Yes', 'No', 'N/A')),

  -- Affiliation / reseller relationship.
  reseller_type  text        not null
                   check (reseller_type in (
                     'Exclusive',
                     'Semi-Exclusive',
                     'Pending Exclusive',
                     'Reseller',
                     'Exclusive for ASINs we create under Skin Revolution',
                     'Created new ASINs under TBB Brand Registry',
                     'Not specified'
                   )),

  -- Number of ASINs; null until filled in.
  num_asins      integer     check (num_asins is null or num_asins >= 0),

  account_name   text        not null default '',

  -- Owner; '' means unassigned.
  owned_by       text        not null default ''
                   check (owned_by in ('', 'BBMEDIA', 'Regina', 'Mariann')),

  -- Work urgency; '' means unset.
  urgency        text        not null default ''
                   check (urgency in ('', 'High', 'Medium', 'Low')),

  -- Global rank 1-30, unique across all brands; null until ranked.
  priority       integer     unique
                   check (priority is null or priority between 1 and 30),

  -- Lifecycle status.
  status         text        not null default 'Active'
                   check (status in ('Active', 'Closing Out')),

  est_sow        text        not null default '',
  note           text        not null default '',

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.brands is
  'iCommerceteam multi-brand Amazon portfolio (NRG/RMR + The Beauty Box). A brand may appear on both account lists, so (brand) is not unique; id is the stable key.';

-- Helpful filters for the console (source tabs, status, ranked ordering).
create index if not exists brands_source_idx   on public.brands (source);
create index if not exists brands_status_idx   on public.brands (status);
create index if not exists brands_priority_idx on public.brands (priority);

-- Keep updated_at fresh on every write.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
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
