# Supabase — Brand Portfolio

Database schema and seed data for the **iCommerceteam Brand Portfolio**
(the multi-brand Amazon portfolio across the NRG/RMR and The Beauty Box
accounts). This backs the **BizManage** console at `app/bizmanage/page.tsx`,
which currently renders hardcoded placeholder rows.

Generated from the `CURRENT BRANDS - AS OF JUNE 2026` export (58 brands).

## Files

| File | Purpose |
| --- | --- |
| `migrations/20260707000000_create_brands.sql` | Creates the `public.brands` table, indexes, `updated_at` trigger, and Row Level Security policies. |
| `migrations/20260707010000_dropdown_options.sql` | Creates `public.dropdown_options` (values for every dropdown), seeds it, and adds a trigger validating brand rows against it. |
| `seed.sql` | Upserts all 58 brands. Idempotent — safe to re-run; it refreshes every row by `id`. |

This is the standard Supabase CLI layout: `supabase db reset` applies every
file in `migrations/` in timestamp order, then runs `seed.sql`.

## `brands` table

Column names mirror the source portfolio schema:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `bigint` PK | Stable row id from the source export. |
| `brand` | `text` | Brand name. Not unique — a brand can appear on both account lists (e.g. Inglot, Scimera, Glimmer Goddess). |
| `account_name` | `text` | Seller account: `NRG`, `RMR`, `TBB`, `TB`. **Dropdown** → `dropdown_options`. |
| `brand_registry` | `text` | Amazon Brand Registry status. **Dropdown** → `dropdown_options`. |
| `reseller_type` | `text` | Affiliation. **Dropdown** → `dropdown_options`. |
| `num_asins` | `text` | Free text, entered manually; `''` until filled. |
| `owned_by` | `text` | Owner; `''` = unassigned. **Dropdown** → `dropdown_options`. |
| `urgency` | `text` | `''` = unset. **Dropdown** → `dropdown_options`. |
| `priority` | `integer` | Global rank 1–30, **unique**; nullable until ranked. |
| `status` | `text` | Lifecycle status. **Dropdown** → `dropdown_options`. |
| `est_sow` | `text` | Estimated scope of work; `''` until filled. |
| `note` | `text` | Free-text caveats / cross-references. |
| `created_at` / `updated_at` | `timestamptz` | `updated_at` is bumped by a trigger on every update. |

The dropdown columns are **not** constrained on the table itself — their allowed
values live in `dropdown_options` (below) and a trigger validates each brand row
against it. This is what lets you add an option with one row insert instead of a
migration. `priority` keeps a plain range check (1–30, unique).

### Row Level Security

RLS is **enabled**. BizManage is internal, so the shipped policies allow only
signed-in users (`authenticated` role) to read and write. The `service_role`
key used by trusted server-side code bypasses RLS automatically. Tighten to
specific users/claims once real auth is wired up.

## `dropdown_options` table

One table holds the values for **every** dropdown, so the option lists can change
without a migration or code deploy. The console builds each dropdown by reading
this table filtered by `field` and `active = true`, ordered by `sort_order`.

| Column | Notes |
| --- | --- |
| `field` | Which dropdown: `account_name`, `brand_registry`, `reseller_type`, `owned_by`, `urgency`, `status`. |
| `value` | The stored value, e.g. `Regina`. Unique per `field`. |
| `label` | Optional display text; the UI falls back to `value`. |
| `sort_order` | Order the option appears in the list. |
| `active` | `false` hides it from new selections without deleting history. |

**Add or change an option — one statement, no migration:**

```sql
-- New "Owned By" person
insert into public.dropdown_options (field, value) values ('owned_by', 'New Person');

-- Rename a value (updates the option; existing brand rows keep the old string
-- until re-assigned, so update those too if needed)
update public.dropdown_options set value = 'Reg' where field = 'owned_by' and value = 'Regina';

-- Retire an option without deleting it
update public.dropdown_options set active = false where field = 'urgency' and value = 'Low';
```

A `before insert/update` trigger on `brands` (`validate_brand_dropdowns`) rejects
any dropdown value that isn't a known option (empty `''`/`NULL` is always allowed).
Add the option row first, then set it on the brand. To turn enforcement off, drop
that trigger and validate in the app instead.

## Applying it

**One-shot (Supabase SQL Editor):** paste all of `supabase/setup.sql` into a
new query and Run. It concatenates every migration plus the seed and is safe
to re-run.

**Supabase CLI (local dev):**

```bash
supabase db reset          # re-applies migrations + seed against local db
```

**psql:** apply the files in `migrations/` in timestamp order, then `seed.sql`.

> The `anon`, `authenticated`, and `service_role` roles referenced by the RLS
> policies are pre-created on every Supabase project. On a plain Postgres
> instance, create them first.

## BizManage wiring (done)

`app/bizmanage/page.tsx` talks to Supabase through `lib/supabase.ts`:

- **Env:** copy `.env.example` to `.env.local` and fill in
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project
  Settings → API). Without them the console falls back to its built-in seed
  data and localStorage ("offline — seed data" in the header).
- **Reads:** brands from `public.brands` (ordered by id) and every dropdown
  list from `public.dropdown_options` (`active = true`, ordered by
  `sort_order`) — add an option row in the database and the form picks it up
  on next load, no deploy.
- **Writes:** "+ Add brand" inserts into `public.brands`; the database assigns
  the id (identity) and the validation trigger / unique priority constraint
  reject bad values, which surface inline in the form.

### Temporary access model — read before shipping anything sensitive

The console still uses its **client-side placeholder login**, so the browser
reaches the database with the public **anon key**. The
`20260707030000_temp_anon_access.sql` migration therefore grants `anon`
read on both tables and insert on `brands`. Anyone who extracts the anon key
from the page bundle gets that same access — acceptable for this
low-sensitivity brand list, not for more. To harden: switch the gate to
Supabase Auth (email/password), then drop the three `*_anon_*_temp` policies;
the `authenticated` policies already in place take over.
