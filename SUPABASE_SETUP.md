# BizManage — Supabase setup guide

The `/bizmanage` console reads and writes its brand table to **Supabase**. Because
the website is a static site (GitHub Pages, no server), the browser talks to
Supabase directly. Access is protected by **Row-Level Security (RLS)**: only a
signed-in user can read or change data, so it is safe to ship the public "anon"
key in the site.

Follow these steps once to go live.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → pick a name, a database password, and a region → **Create**.
3. Wait ~1–2 minutes for it to finish provisioning.

## 2. Create the tables + dropdown values

1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Open [`supabase/schema.sql`](./supabase/schema.sql) from this repo, copy its
   full contents, paste into the editor, and click **Run**.
3. This creates two tables — **`brands`** (the portfolio) and
   **`dropdown_options`** (the allowed values for each select field) — turns on
   RLS, adds the authenticated-only access policies, and seeds the dropdown
   values. You can confirm under **Table Editor**.

> Re-running the script is safe — it only seeds the dropdowns when empty and uses
> `create table if not exists`. Brand rows are managed from the app, not seeded here.

### The columns

The `brands` table has: **Brand**, **Account** (`account_name`), **Brand
Registry**, **Reseller Type**, **# ASINs** (`num_asins`), **Owned By**,
**Urgency**, **Priority**, **Status**, **Est. SOW** (`est_sow`), and **Note**.
The note isn't shown as a table column — it appears as a full-width field
while a row is being edited (and is still covered by search).

The **Account, Brand Registry, Reseller Type, Owned By, Urgency, Priority,
Status, and Est. SOW** fields are chosen from dropdowns (Urgency, Priority,
and Est. SOW share the High/Medium/Low levels). To add a new
dropdown value, pick **＋ Add new…** inside any dropdown while editing a row —
it's saved to **`dropdown_options`** automatically. You can also edit that table
directly (insert a row with the `field` + `value`, or set `active = false` to
hide one) — no code change or redeploy needed.

## 3. Admin login and managing users

The console uses real Supabase accounts. An **administrator** account is any
user whose `app_metadata` contains `"role": "admin"` — admins get a
**Settings → Users** page in the sidebar where they can:

- create accounts (optionally as admins) that can sign in immediately with the
  password the admin typed;
- switch an account between **admin** and **member**;
- grant a member access to individual console pages (**Visible pages** — the
  checkboxes mirror the sidebar's grouping, and a group checkbox toggles the
  whole group). Admins always see everything;
- set a new password for an account;
- delete an account (you can't delete your own).

Page grants are stored in the user's `app_metadata.views` (`null`/absent means
every page). The console re-reads role and grants from the auth server each
time it loads, so a change applies as soon as the affected user reloads —
no waiting for their login token to refresh. Note that page grants control
navigation in the console; every signed-in account still holds the same
database access underneath (see the security note below).

User management is powered by the `admin-users` edge function
(`supabase/functions/admin-users/index.ts`), which runs with the project's
service-role key (available only inside the edge environment — it is never
shipped to the browser) and rejects any caller who isn't an admin.

If you ever need to create the *first* admin without the app (e.g. a fresh
project), use the dashboard: **Authentication → Users → Add user** (check
**Auto Confirm User**), then set the role via SQL Editor:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                        || '{"role": "admin"}'::jsonb
where email = 'you@example.com';
```

(The role lands in the login token at sign-in, so sign out and back in after
changing it.)

> **Security note — disable public signups.** The RLS policies give *every*
> signed-in user full read/write access to the data, and the anon key ships in
> the static site. Leave signups open and anyone could self-provision an
> account. In the dashboard go to **Authentication → Sign In / Up** and turn
> **Allow new users to sign up** off — admin-created accounts are unaffected.
> (This toggle only exists in the dashboard; it can't be set from SQL.)

## 4. Copy your API keys

1. **Project Settings → API**.
2. Copy the **Project URL** (looks like `https://xxxx.supabase.co`).
3. Copy the **anon public** key (a long `eyJ...` string). *Do not use the
   `service_role` key — that one is secret and must never go in the site.*

## 5. Run it locally

1. In the repo root, copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Paste your two values into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open <http://localhost:3000/bizmanage>, sign in with the account from step 3,
   and try filtering, editing a cell, adding, and deleting a brand. Changes show
   up in the Supabase **Table Editor**.

## 6. Deploy to production (GitHub Pages)

The build injects the same two values from GitHub repository secrets.

1. In GitHub: **Settings → Secrets and variables → Actions → New repository
   secret**. Add both:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Push to `master` (or run the **Deploy to GitHub Pages** workflow manually).
   The workflow passes the secrets into `npm run build`, so the live site at
   `thebeautyboxmedia.com/bizmanage` connects to Supabase automatically.

---

## How it fits together

- `lib/supabaseClient.ts` — creates the browser Supabase client from the env vars.
- `lib/brands.ts` — the only file that talks to the database (`getBrands`,
  `addBrand`, `updateBrand`, `deleteBrand`). Swap this out to change backends.
- `app/bizmanage/page.tsx` — the login + filterable, editable table UI.
- `supabase/schema.sql` — the table, RLS policy, and seed rows.

## Troubleshooting

- **"Supabase isn't configured yet"** on `/bizmanage` — the env vars are missing.
  Check `.env.local` locally (restart `npm run dev` after editing it) or the
  GitHub secrets for production.
- **Sign-in fails** — confirm the user exists and is confirmed (step 3), and that
  you're using the **anon public** key, not `service_role`.
- **Rows don't load / permission denied** — make sure `supabase/schema.sql` ran
  fully so RLS and the policy exist, and that you're signed in.
