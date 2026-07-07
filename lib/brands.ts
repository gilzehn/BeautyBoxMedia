import { supabase } from './supabaseClient';

// --- Types ---------------------------------------------------------------
export type Level = 'High' | 'Medium' | 'Low';

// The camelCase shape used throughout the UI.
export interface BrandRow {
  id: string;
  brand: string;
  registry: string;
  resellerType: string;
  asins: number;
  accountName: string;
  ownedBy: string;
  urgency: Level;
  priority: Level;
}

// Fields the user can edit / provide (everything except the DB-managed id).
export type BrandInput = Omit<BrandRow, 'id'>;

// The snake_case shape as stored in the Postgres `brands` table.
interface BrandRecord {
  id: string;
  brand: string;
  registry: string;
  reseller_type: string;
  asins: number;
  account_name: string;
  owned_by: string;
  urgency: Level;
  priority: Level;
}

const TABLE = 'brands';

// --- Mapping helpers -----------------------------------------------------
function fromRecord(r: BrandRecord): BrandRow {
  return {
    id: r.id,
    brand: r.brand ?? '',
    registry: r.registry ?? '',
    resellerType: r.reseller_type ?? '',
    asins: r.asins ?? 0,
    accountName: r.account_name ?? '',
    ownedBy: r.owned_by ?? '',
    urgency: (r.urgency ?? 'Low') as Level,
    priority: (r.priority ?? 'Low') as Level,
  };
}

function toRecord(input: BrandInput): Omit<BrandRecord, 'id'> {
  return {
    brand: input.brand,
    registry: input.registry,
    reseller_type: input.resellerType,
    asins: Number.isFinite(input.asins) ? input.asins : 0,
    account_name: input.accountName,
    owned_by: input.ownedBy,
    urgency: input.urgency,
    priority: input.priority,
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

export async function updateBrand(id: string, input: BrandInput): Promise<BrandRow> {
  const { data, error } = await client()
    .from(TABLE)
    .update(toRecord(input))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromRecord(data as BrandRecord);
}

export async function deleteBrand(id: string): Promise<void> {
  const { error } = await client().from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
