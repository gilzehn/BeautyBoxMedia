import { supabase } from './supabaseClient';

// Mirrors `public.agency_clients`. Service/status vocabularies live in
// dropdown_options (fields `client_service`, `client_status`); assignees
// share the brands `assignee` field.

export interface ClientRow {
  id: number;
  client: string;
  contactName: string;
  email: string;
  phone: string;
  service: string;
  status: string;
  assignee: string;
  startDate: string; // ISO date or '' when unset
  retainer: number | null; // monthly retainer, USD
  note: string;
  createdAt: string;
}

export type ClientInput = Omit<ClientRow, 'id' | 'createdAt'>;

interface ClientRecord {
  id: number;
  client: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  service: string | null;
  status: string | null;
  assignee: string | null;
  start_date: string | null;
  retainer: number | string | null;
  note: string | null;
  created_at: string;
}

const TABLE = 'agency_clients';

function fromRecord(r: ClientRecord): ClientRow {
  return {
    id: r.id,
    client: r.client ?? '',
    contactName: r.contact_name ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    service: r.service ?? '',
    status: r.status ?? '',
    assignee: r.assignee ?? '',
    startDate: r.start_date ?? '',
    // PostgREST can serialize numeric as string — always coerce.
    retainer: r.retainer == null ? null : Number(r.retainer),
    note: r.note ?? '',
    createdAt: r.created_at,
  };
}

function toRecord(input: Partial<ClientInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.client !== undefined) out.client = input.client;
  if (input.contactName !== undefined) out.contact_name = input.contactName;
  if (input.email !== undefined) out.email = input.email;
  if (input.phone !== undefined) out.phone = input.phone;
  if (input.service !== undefined) out.service = input.service;
  if (input.status !== undefined) out.status = input.status;
  if (input.assignee !== undefined) out.assignee = input.assignee;
  if (input.startDate !== undefined) out.start_date = input.startDate || null;
  if (input.retainer !== undefined) out.retainer = input.retainer;
  if (input.note !== undefined) out.note = input.note;
  return out;
}

function client() {
  if (!supabase) {
    throw new Error('Supabase is not configured. See SUPABASE_SETUP.md.');
  }
  return supabase;
}

export async function getClients(): Promise<ClientRow[]> {
  const { data, error } = await client()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ClientRecord[]).map(fromRecord);
}

export async function addClient(input: ClientInput): Promise<ClientRow> {
  const { data, error } = await client().from(TABLE).insert(toRecord(input)).select().single();
  if (error) throw error;
  return fromRecord(data as ClientRecord);
}

export async function updateClient(id: number, patch: Partial<ClientInput>): Promise<ClientRow> {
  const { data, error } = await client()
    .from(TABLE)
    .update(toRecord(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromRecord(data as ClientRecord);
}

export async function deleteClient(id: number): Promise<void> {
  const { error } = await client().from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
