import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

// Client for the `admin-users` edge function (supabase/functions/admin-users).
// The function holds the service-role key and only answers callers whose
// app_metadata.role is 'admin'; this module just forwards the session token.

export interface AdminUserRow {
  id: string;
  firstName: string;
  email: string;
  role: 'admin' | 'member';
  // Console pages visible to this user; null = default (all pages).
  views: string[] | null;
  createdAt: string;
  lastSignInAt: string | null;
}

export interface NewUserInput {
  firstName: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

export interface UpdateUserInput {
  userId: string;
  role?: 'admin' | 'member';
  views?: string[] | null;
  firstName?: string;
  // Admin password reset; takes effect at the user's next sign-in.
  password?: string;
}

const FUNCTION = 'admin-users';

function client() {
  if (!supabase) {
    throw new Error('Supabase is not configured. See SUPABASE_SETUP.md.');
  }
  return supabase;
}

// functions.invoke buries non-2xx response bodies inside error.context, so
// unwrap it to surface the function's { error } message to the UI.
async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await client().functions.invoke(FUNCTION, { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? error.message);
    }
    throw new Error(error.message ?? 'User service is unavailable.');
  }
  return data as T;
}

export async function getUsers(): Promise<AdminUserRow[]> {
  const { users } = await invoke<{ users: AdminUserRow[] }>({ action: 'list' });
  return users;
}

export async function createUser(input: NewUserInput): Promise<AdminUserRow> {
  const { user } = await invoke<{ user: AdminUserRow }>({ action: 'create', ...input });
  return user;
}

export async function updateUser(input: UpdateUserInput): Promise<AdminUserRow> {
  const { user } = await invoke<{ user: AdminUserRow }>({ action: 'update', ...input });
  return user;
}

export async function deleteUser(userId: string): Promise<void> {
  await invoke<{ ok: boolean }>({ action: 'delete', userId });
}
