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
  'Allowed values for every BizManage dropdown (source, brand_registry, reseller_type, owned_by, urgency, status). One row per option. Add a value by inserting a row — no migration needed.';

create index if not exists dropdown_options_field_idx
  on public.dropdown_options (field, active, sort_order);

-- Seed the current option sets (from the June 2026 brand portfolio).
-- Idempotent: re-running only adds missing options, never clobbers edits.
-- Empty / unassigned states (owned_by = '', urgency = '') are represented by a
-- blank value on the brand row and a "— unassigned" placeholder in the UI, so
-- they are intentionally NOT seeded as options here.
insert into public.dropdown_options (field, value, sort_order) values
  ('source', 'NRG/RMR', 1),
  ('source', 'TBB/TB', 2),

  ('brand_registry', 'Yes', 1),
  ('brand_registry', 'No', 2),
  ('brand_registry', 'N/A', 3),

  ('reseller_type', 'Exclusive', 1),
  ('reseller_type', 'Semi-Exclusive', 2),
  ('reseller_type', 'Pending Exclusive', 3),
  ('reseller_type', 'Reseller', 4),
  ('reseller_type', 'Exclusive for ASINs we create under Skin Revolution', 5),
  ('reseller_type', 'Created new ASINs under TBB Brand Registry', 6),
  ('reseller_type', 'Not specified', 7),

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
as $$
declare
  bad_field text;
  bad_value text;
begin
  -- Find the first dropdown column whose (non-empty) value isn't a known option.
  select p.field, p.value
    into bad_field, bad_value
  from (values
    ('source',         new.source),
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
