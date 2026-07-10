import { supabase } from './supabaseClient';

// Mirrors `public.finance_entries` — one ledger for both money directions.
// The Income and Expenses screens filter by `kind`; Cashflow and P&L
// aggregate the whole ledger. Categories live in dropdown_options
// (fields `income_category` / `expense_category`).

export type FinanceKind = 'income' | 'expense';

export interface FinanceEntryRow {
  id: number;
  kind: FinanceKind;
  entryDate: string; // ISO date
  description: string;
  category: string;
  amount: number;
  account: string;
  note: string;
}

export type FinanceEntryInput = Omit<FinanceEntryRow, 'id'>;

interface FinanceRecord {
  id: number;
  kind: FinanceKind;
  entry_date: string;
  description: string | null;
  category: string | null;
  amount: number | string;
  account: string | null;
  note: string | null;
}

const TABLE = 'finance_entries';

function fromRecord(r: FinanceRecord): FinanceEntryRow {
  return {
    id: r.id,
    kind: r.kind,
    entryDate: r.entry_date,
    description: r.description ?? '',
    category: r.category ?? '',
    // PostgREST can serialize numeric as string — always coerce.
    amount: Number(r.amount),
    account: r.account ?? '',
    note: r.note ?? '',
  };
}

function toRecord(input: Partial<FinanceEntryInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.kind !== undefined) out.kind = input.kind;
  if (input.entryDate !== undefined) out.entry_date = input.entryDate;
  if (input.description !== undefined) out.description = input.description;
  if (input.category !== undefined) out.category = input.category;
  if (input.amount !== undefined) out.amount = input.amount;
  if (input.account !== undefined) out.account = input.account;
  if (input.note !== undefined) out.note = input.note;
  return out;
}

function client() {
  if (!supabase) {
    throw new Error('Supabase is not configured. See SUPABASE_SETUP.md.');
  }
  return supabase;
}

export async function getFinanceEntries(kind?: FinanceKind): Promise<FinanceEntryRow[]> {
  let query = client().from(TABLE).select('*').order('entry_date', { ascending: false });
  if (kind) query = query.eq('kind', kind);
  const { data, error } = await query;
  if (error) throw error;
  return (data as FinanceRecord[]).map(fromRecord);
}

export async function addFinanceEntry(input: FinanceEntryInput): Promise<FinanceEntryRow> {
  const { data, error } = await client().from(TABLE).insert(toRecord(input)).select().single();
  if (error) throw error;
  return fromRecord(data as FinanceRecord);
}

export async function updateFinanceEntry(
  id: number,
  patch: Partial<FinanceEntryInput>
): Promise<FinanceEntryRow> {
  const { data, error } = await client()
    .from(TABLE)
    .update(toRecord(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromRecord(data as FinanceRecord);
}

export async function deleteFinanceEntry(id: number): Promise<void> {
  const { error } = await client().from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
