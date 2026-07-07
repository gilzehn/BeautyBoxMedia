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

## 2. Create the table + seed data

1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Open [`supabase/schema.sql`](./supabase/schema.sql) from this repo, copy its
   full contents, paste into the editor, and click **Run**.
3. This creates the `brands` table, turns on RLS, adds the access policy, and
   inserts the 8 starter brands. You can confirm under **Table Editor → brands**.

> Re-running the script is safe — it only seeds rows when the table is empty.

## 3. Create your admin login

The console uses real Supabase accounts. Create one for yourself:

1. **Authentication → Users → Add user**.
2. Enter an email and password.
3. Check **Auto Confirm User** (so you can log in immediately without a
   confirmation email). If you don't see that option, you can instead go to
   **Authentication → Providers → Email** and turn **Confirm email** off.
4. Repeat for anyone else who needs access.

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
