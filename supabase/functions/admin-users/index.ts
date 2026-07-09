// BizManage user administration. Runs with the service-role key (available
// only inside the edge environment), so it can call the GoTrue admin API.
// Deployed with verify_jwt on; on top of that, every request must carry a
// session whose app_metadata.role is 'admin' — regular members get a 403.
//
// POST JSON body:
//   { "action": "list" }
//   { "action": "create", "email": "...", "password": "...", "isAdmin": false }
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*', // token-gated; no cookies involved
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

interface UserRow {
  id: string;
  email: string;
  role: 'admin' | 'member';
  createdAt: string;
  lastSignInAt: string | null;
}

// deno-lint-ignore no-explicit-any
function toRow(u: any): UserRow {
  return {
    id: u.id,
    email: u.email ?? '',
    role: u.app_metadata?.role === 'admin' ? 'admin' : 'member',
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Resolve the caller from their access token and require the admin role.
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!jwt) return json(401, { error: 'Missing access token.' });
  const { data: caller, error: callerError } = await admin.auth.getUser(jwt);
  if (callerError || !caller?.user) return json(401, { error: 'Invalid or expired session.' });
  if (caller.user.app_metadata?.role !== 'admin') {
    return json(403, { error: 'Admin access required.' });
  }

  let body: { action?: string; email?: string; password?: string; isAdmin?: boolean };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  if (body.action === 'list') {
    // perPage 200 comfortably covers this team-sized console.
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return json(500, { error: error.message });
    return json(200, { users: data.users.map(toRow) });
  }

  if (body.action === 'create') {
    const email = String(body.email ?? '').trim();
    const password = String(body.password ?? '');
    if (!email || password.length < 8) {
      return json(400, { error: 'Email and a password of at least 8 characters are required.' });
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // usable immediately with the password the admin typed
      app_metadata: body.isAdmin ? { role: 'admin' } : {},
    });
    if (error) return json(error.status ?? 500, { error: error.message });
    return json(200, { user: toRow(data.user) });
  }

  return json(400, { error: 'Unknown action.' });
});
