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
