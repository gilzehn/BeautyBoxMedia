---
name: verify
description: Build, run, and drive the BeautyBoxMedia site and /bizmanage console to verify changes at the browser surface.
---

# Verifying changes in this repo

Next.js static-export site. The `/bizmanage` console is the only dynamic
surface; it talks directly to Supabase (no server), gated by `NEXT_PUBLIC_*`
env vars baked in at build time.

## Build / launch

```bash
npm ci                       # node_modules is not checked in
npm run build                # static export; this is also the type-check
NEXT_PUBLIC_SUPABASE_URL=https://fakeref.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key \
npx next dev -p 3100         # console shows "not configured" without the env vars
```

`npm run lint` is broken (next lint deprecated, no eslint config) — skip it.

## Driving /bizmanage without real Supabase

Playwright + the pre-installed Chromium. The installed playwright npm package
is newer than the provisioned browsers, so launch with
`chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`.

- **Auth**: supabase-js reads the session from localStorage. Seed it before
  page load with `page.addInitScript`: key `sb-<ref>-auth-token` where `<ref>`
  is the first host label of the URL (`fakeref` above). Value: a JSON session
  `{ access_token, token_type: 'bearer', expires_at: <far future>, refresh_token,
  user: { id, aud: 'authenticated', role: 'authenticated', email, app_metadata,
  user_metadata } }`. Admin = `app_metadata.role: 'admin'`; member sections come
  from `app_metadata.sections`.
- **Data**: intercept `https://fakeref.supabase.co/**` with `context.route` and
  serve `/rest/v1/<table>` from an in-memory store. GETs return JSON arrays;
  writes without `.select()` accept a `204` empty body; `.single()` inserts
  expect a single JSON object back. The captured request log doubles as the
  assertion surface for writes (URLs carry the `eq.` filters).
- **Views**: navigate with the hash, e.g. `/bizmanage#settings-dropdowns` —
  that's the only routing the console has.
- `window.confirm` gates deletes (Brand List rows, dropdown options):
  handle `page.on('dialog')`.

A known-good driver from a past session: mock store + request log + per-check
PASS/FAIL lines. Flows worth re-driving after console changes: sign-in guard,
sidebar flyouts and permissions (admin vs member), Brand List inline edits,
and each Settings screen's writes.
