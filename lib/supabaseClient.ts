import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Public config. These NEXT_PUBLIC_* values are baked into the static build and
// are safe to expose in the browser — data access is protected by Row-Level
// Security (RLS) policies in Supabase, not by hiding these keys.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// True only when both env vars are present. The UI uses this to show a clear
// "not configured" message instead of crashing before Supabase is wired up.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// A single shared browser client. Created only when configured; the non-null
// assertion is guarded by callers checking `isSupabaseConfigured` first.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
