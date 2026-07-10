// BizManage user administration. Runs with the service-role key (available
// only inside the edge environment), so it can call the GoTrue admin API.
// Deployed with verify_jwt on; on top of that, every request must carry a
// session whose app_metadata.role is 'admin' — regular members get a 403.
//
// POST JSON body:
//   { "action": "list" }
//   { "action": "create", "firstName": "...", "email": "...", "password": "...", "isAdmin": false }
//   { "action": "update", "userId": "...", "role"?: "admin"|"member",
//     "sections"?: string[]|null, "firstName"?: "..." }
import { createClient } from 'npm:@supabase/supabase-js@2';

// Sidebar sections a member can be granted. `sections: null` (or absent)
// means the default: every section visible.
const SECTION_KEYS = ['brands', 'agency-clients', 'tasks', 'sales', 'finance', 'analysis'];

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
  firstName: string;
  email: string;
  role: 'admin' | 'member';
  sections: string[] | null;
  createdAt: string;
  lastSignInAt: string | null;
}

// deno-lint-ignore no-explicit-any
function toRow(u: any): UserRow {
  const rawSections = u.app_metadata?.sections;
  return {
    id: u.id,
    firstName: u.user_metadata?.first_name ?? '',
    email: u.email ?? '',
    role: u.app_metadata?.role === 'admin' ? 'admin' : 'member',
    sections: Array.isArray(rawSections)
      ? rawSections.filter((s: unknown) => typeof s === 'string' && SECTION_KEYS.includes(s))
      : null,
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

  let body: {
    action?: string;
    firstName?: string;
    email?: string;
    password?: string;
    isAdmin?: boolean;
    userId?: string;
    role?: string;
    sections?: unknown;
  };
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
    const firstName = String(body.firstName ?? '').trim();
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
      user_metadata: firstName ? { first_name: firstName } : {},
    });
    if (error) return json(error.status ?? 500, { error: error.message });
    return json(200, { user: toRow(data.user) });
  }

  if (body.action === 'update') {
    const userId = String(body.userId ?? '');
    if (!userId) return json(400, { error: 'userId is required.' });

    const app: Record<string, unknown> = {};
    const meta: Record<string, unknown> = {};
    if (body.role !== undefined) {
      // Blocking self role-changes guarantees at least one admin remains.
      if (userId === caller.user.id) {
        return json(400, { error: "You can't change your own role." });
      }
      if (body.role !== 'admin' && body.role !== 'member') {
        return json(400, { error: 'Invalid role.' });
      }
      app.role = body.role;
    }
    if (body.sections !== undefined) {
      app.sections = Array.isArray(body.sections)
        ? body.sections.filter((s: unknown) => typeof s === 'string' && SECTION_KEYS.includes(s))
        : null; // null resets to the default (all sections visible)
    }
    if (body.firstName !== undefined) meta.first_name = String(body.firstName).trim();

    // GoTrue shallow-merges *_metadata, so only send the keys being changed.
    const attrs: Record<string, unknown> = {};
    if (Object.keys(app).length > 0) attrs.app_metadata = app;
    if (Object.keys(meta).length > 0) attrs.user_metadata = meta;
    if (Object.keys(attrs).length === 0) return json(400, { error: 'Nothing to update.' });

    const { data, error } = await admin.auth.admin.updateUserById(userId, attrs);
    if (error) return json(error.status ?? 500, { error: error.message });
    return json(200, { user: toRow(data.user) });
  }

  return json(400, { error: 'Unknown action.' });
});
