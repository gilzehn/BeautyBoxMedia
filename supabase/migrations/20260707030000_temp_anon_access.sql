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
