import { supabase } from './supabaseClient';

// --- Types ---------------------------------------------------------------
// Mirrors the live `public.brands` table. `id` is a bigint identity (number).
// All other fields are text; select values (including the High/Medium/Low
// levels for urgency, priority, and est_sow) come from the `dropdown_options`
// table (see getDropdownOptions).
export interface BrandRow {
  id: number;
  brand: string;
  accountName: string;
  brandRegistry: string;
  resellerType: string;
  numAsins: string;
  ownedBy: string;
  assignee: string;
  urgency: string;
  priority: string;
  status: string;
  estSow: string;
  note: string;
}

// Fields the user can edit / provide (everything except the DB-managed id).
export type BrandInput = Omit<BrandRow, 'id'>;

// The snake_case shape as stored in Postgres.
interface BrandRecord {
  id: number;
  brand: string | null;
  account_name: string | null;
  brand_registry: string | null;
  reseller_type: string | null;
  num_asins: string | null;
  owned_by: string | null;
  assignee: string | null;
  urgency: string | null;
  priority: string | null;
  status: string | null;
  est_sow: string | null;
  note: string | null;
}

const TABLE = 'brands';
const DROPDOWN_TABLE = 'dropdown_options';

// --- Mapping helpers -----------------------------------------------------
function fromRecord(r: BrandRecord): BrandRow {
  return {
    id: r.id,
    brand: r.brand ?? '',
    accountName: r.account_name ?? '',
    brandRegistry: r.brand_registry ?? '',
    resellerType: r.reseller_type ?? '',
    numAsins: r.num_asins ?? '',
    ownedBy: r.owned_by ?? '',
    assignee: r.assignee ?? '',
    urgency: r.urgency ?? '',
    priority: r.priority ?? '',
    status: r.status ?? '',
    estSow: r.est_sow ?? '',
    note: r.note ?? '',
  };
}

function toRecord(input: BrandInput): Omit<BrandRecord, 'id'> {
  return {
    brand: input.brand,
    account_name: input.accountName,
    brand_registry: input.brandRegistry,
    reseller_type: input.resellerType,
    num_asins: input.numAsins,
    owned_by: input.ownedBy,
    assignee: input.assignee,
    urgency: input.urgency,
    priority: input.priority,
    status: input.status,
    est_sow: input.estSow,
    note: input.note,
  };
}

// Guards against calling the API before Supabase is configured.
function client() {
  if (!supabase) {
    throw new Error('Supabase is not configured. See SUPABASE_SETUP.md.');
  }
  return supabase;
}

// --- Data access ---------------------------------------------------------
export async function getBrands(): Promise<BrandRow[]> {
  const { data, error } = await client()
    .from(TABLE)
    .select('*')
    .order('brand', { ascending: true });
  if (error) throw error;
  return (data as BrandRecord[]).map(fromRecord);
}

export async function addBrand(input: BrandInput): Promise<BrandRow> {
  const { data, error } = await client()
    .from(TABLE)
    .insert(toRecord(input))
    .select()
    .single();
  if (error) throw error;
  return fromRecord(data as BrandRecord);
}

export async function updateBrand(id: number, input: BrandInput): Promise<BrandRow> {
  const { data, error } = await client()
    .from(TABLE)
    .update(toRecord(input))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromRecord(data as BrandRecord);
}

export async function deleteBrand(id: number): Promise<void> {
  const { error } = await client().from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

// --- Dropdown options ----------------------------------------------------
interface DropdownRecord {
  field: string;
  value: string;
}

// Returns allowed values grouped by field, e.g.
// { account_name: ['NRG','RMR',...], urgency: ['High','Medium','Low'], ... }
export async function getDropdownOptions(): Promise<Record<string, string[]>> {
  const { data, error } = await client()
    .from(DROPDOWN_TABLE)
    .select('field,value')
    .eq('active', true)
    .order('field', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw error;

  const grouped: Record<string, string[]> = {};
  for (const row of data as DropdownRecord[]) {
    (grouped[row.field] ??= []).push(row.value);
  }
  return grouped;
}

// Adds a new allowed value for a select field (used by the "+ Add new…"
// affordance in the edit dropdowns). New values sort after the seeded ones.
export async function addDropdownOption(field: string, value: string): Promise<void> {
  const { error } = await client()
    .from(DROPDOWN_TABLE)
    .insert({ field, value, sort_order: 999 });
  if (error) throw error;
}
