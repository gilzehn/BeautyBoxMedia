import { supabase } from './supabaseClient';

// Mirrors `public.leads`. Stage vocabulary lives in dropdown_options
// (field `lead_stage`); assignees share the brands `assignee` field.

export interface LeadRow {
  id: number;
  company: string;
  contactName: string;
  email: string;
  stage: string;
  assignee: string;
  estValue: number | null;
  note: string;
  createdAt: string;
}

export type LeadInput = Omit<LeadRow, 'id' | 'createdAt'>;

interface LeadRecord {
  id: number;
  company: string | null;
  contact_name: string | null;
  email: string | null;
  stage: string | null;
  assignee: string | null;
  est_value: number | string | null;
  note: string | null;
  created_at: string;
}

const TABLE = 'leads';

function fromRecord(r: LeadRecord): LeadRow {
  return {
    id: r.id,
    company: r.company ?? '',
    contactName: r.contact_name ?? '',
    email: r.email ?? '',
    stage: r.stage ?? '',
    assignee: r.assignee ?? '',
    // PostgREST can serialize numeric as string — always coerce.
    estValue: r.est_value == null ? null : Number(r.est_value),
    note: r.note ?? '',
    createdAt: r.created_at,
  };
}

function toRecord(input: Partial<LeadInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.company !== undefined) out.company = input.company;
  if (input.contactName !== undefined) out.contact_name = input.contactName;
  if (input.email !== undefined) out.email = input.email;
  if (input.stage !== undefined) out.stage = input.stage;
  if (input.assignee !== undefined) out.assignee = input.assignee;
  if (input.estValue !== undefined) out.est_value = input.estValue;
  if (input.note !== undefined) out.note = input.note;
  return out;
}

function client() {
  if (!supabase) {
    throw new Error('Supabase is not configured. See SUPABASE_SETUP.md.');
  }
  return supabase;
}

export async function getLeads(): Promise<LeadRow[]> {
  const { data, error } = await client()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as LeadRecord[]).map(fromRecord);
}

export async function addLead(input: LeadInput): Promise<LeadRow> {
  const { data, error } = await client().from(TABLE).insert(toRecord(input)).select().single();
  if (error) throw error;
  return fromRecord(data as LeadRecord);
}

export async function updateLead(id: number, patch: Partial<LeadInput>): Promise<LeadRow> {
  const { data, error } = await client()
    .from(TABLE)
    .update(toRecord(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromRecord(data as LeadRecord);
}

export async function deleteLead(id: number): Promise<void> {
  const { error } = await client().from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
