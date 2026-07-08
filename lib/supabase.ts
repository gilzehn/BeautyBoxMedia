import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Null when the env vars are missing (see .env.example) — the BizManage
// console then falls back to its built-in seed data, so the repo still runs
// without any configuration.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
