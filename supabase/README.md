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
| `seed.sql` | Upserts all 58 brands. Idempotent — safe to re-run; it refreshes every row by `id`. |

This is the standard Supabase CLI layout: `supabase db reset` applies every
file in `migrations/` in timestamp order, then runs `seed.sql`.

## `brands` table

Column names mirror the source portfolio schema:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `bigint` PK | Stable row id from the source export. |
| `brand` | `text` | Brand name. Not unique — a brand can appear on both account lists (e.g. Inglot, Scimera, Glimmer Goddess). |
| `source` | `text` | Account list: `NRG/RMR` or `TBB/TB`. |
| `brand_registry` | `text` | Amazon Brand Registry status: `Yes`, `No`, `N/A`. |
| `reseller_type` | `text` | Affiliation (Exclusive, Semi-Exclusive, Pending Exclusive, Reseller, …). |
| `num_asins` | `integer` | Nullable until filled in. |
| `account_name` | `text` | Seller account name; `''` until filled. |
| `owned_by` | `text` | `''`, `BBMEDIA`, `Regina`, or `Mariann`. |
| `urgency` | `text` | `''`, `High`, `Medium`, `Low`. |
| `priority` | `integer` | Global rank 1–30, **unique**; nullable until ranked. |
| `status` | `text` | `Active` or `Closing Out`. |
| `est_sow` | `text` | Estimated scope of work; `''` until filled. |
| `note` | `text` | Free-text caveats / cross-references. |
| `created_at` / `updated_at` | `timestamptz` | `updated_at` is bumped by a trigger on every update. |

Enumerated columns use `CHECK` constraints (not native `ENUM` types) so the
allowed sets can be widened later with a plain `ALTER TABLE … DROP/ADD
CONSTRAINT`.

### Row Level Security

RLS is **enabled**. BizManage is internal, so the shipped policies allow only
signed-in users (`authenticated` role) to read and write. The `service_role`
key used by trusted server-side code bypasses RLS automatically. Tighten to
specific users/claims once real auth is wired up.

## Applying it

**Supabase CLI (local dev):**

```bash
supabase db reset          # re-applies migrations + seed against local db
```

**Hosted project (SQL editor / psql):** run the migration file once, then the
seed file:

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260707000000_create_brands.sql
psql "$DATABASE_URL" -f supabase/seed.sql
```

> The `anon`, `authenticated`, and `service_role` roles referenced by the RLS
> policies are pre-created on every Supabase project. On a plain Postgres
> instance, create them first.

## Next step: wire up BizManage

`app/bizmanage/page.tsx` still uses a hardcoded `ROWS` array and a
placeholder client-side login. To go live:

1. Add `@supabase/supabase-js` and set `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Replace the placeholder gate with Supabase Auth (the `authenticated` role
   is what the RLS policies key off).
3. Fetch from `public.brands` (e.g. `order by priority nulls last, brand`)
   instead of the seed array.
