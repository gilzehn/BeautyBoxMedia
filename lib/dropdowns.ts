import { supabase } from './supabaseClient';

// --- Types ---------------------------------------------------------------
// Admin view of `public.dropdown_options`: full rows (with ids) for the
// Settings → Dropdowns screen, rather than the grouped value lists the other
// screens consume (see getDropdownOptions in lib/brands.ts).
export interface DropdownOptionRow {
  id: number;
  field: string;
  value: string;
  sortOrder: number;
}

interface OptionRecord {
  id: number;
  field: string;
  value: string;
  sort_order: number;
}

// Where a field's chosen values are stored, so renames can rewrite the rows
// that already hold the old text. `where` narrows the update when a column
// is shared (finance_entries.category serves both income and expense).
interface ValueReference {
  table: string;
  column: string;
  where?: Record<string, string>;
}

// One entry per select field the console offers, in display order. `usedIn`
// tells admins which screen(s) a list drives. Priority is absent on purpose:
// it's a computed 1-30 ranking, not served from dropdown_options.
export interface DropdownFieldMeta {
  field: string;
  label: string;
  usedIn: string;
  references: ValueReference[];
}

export const DROPDOWN_FIELDS: DropdownFieldMeta[] = [
  {
    field: 'account_name',
    label: 'Account',
    usedIn: 'Brand List',
    references: [{ table: 'brands', column: 'account_name' }],
  },
  {
    field: 'brand_registry',
    label: 'Brand Registry',
    usedIn: 'Brand List',
    references: [{ table: 'brands', column: 'brand_registry' }],
  },
  {
    field: 'reseller_type',
    label: 'Reseller Type',
    usedIn: 'Brand List',
    references: [{ table: 'brands', column: 'reseller_type' }],
  },
  {
    field: 'owned_by',
    label: 'Owned By',
    usedIn: 'Brand List',
    references: [{ table: 'brands', column: 'owned_by' }],
  },
  {
    field: 'assignee',
    label: 'Assignee',
    usedIn: 'Brand List · Tasks · Leads',
    references: [
      { table: 'brands', column: 'assignee' },
      { table: 'tasks', column: 'assignee' },
      { table: 'leads', column: 'assignee' },
    ],
  },
  {
    field: 'urgency',
    label: 'Urgency',
    usedIn: 'Brand List',
    references: [{ table: 'brands', column: 'urgency' }],
  },
  {
    field: 'status',
    label: 'Status',
    usedIn: 'Brand List',
    references: [{ table: 'brands', column: 'status' }],
  },
  {
    field: 'est_sow',
    label: 'Est. SOW',
    usedIn: 'Brand List',
    references: [{ table: 'brands', column: 'est_sow' }],
  },
  {
    field: 'task_status',
    label: 'Task Status',
    usedIn: 'Tasks',
    references: [{ table: 'tasks', column: 'status' }],
  },
  {
    field: 'lead_stage',
    label: 'Lead Stage',
    usedIn: 'Leads',
    references: [{ table: 'leads', column: 'stage' }],
  },
  {
    field: 'income_category',
    label: 'Income Category',
    usedIn: 'Finance · Income',
    references: [{ table: 'finance_entries', column: 'category', where: { kind: 'income' } }],
  },
  {
    field: 'expense_category',
    label: 'Expense Category',
    usedIn: 'Finance · Expenses',
    references: [{ table: 'finance_entries', column: 'category', where: { kind: 'expense' } }],
  },
];

// Retired fields whose rows may still exist in live databases.
const HIDDEN_FIELDS = new Set(['priority']);

const TABLE = 'dropdown_options';

function client() {
  if (!supabase) {
    throw new Error('Supabase is not configured. See SUPABASE_SETUP.md.');
  }
  return supabase;
}

function fromRecord(r: OptionRecord): DropdownOptionRow {
  return { id: r.id, field: r.field, value: r.value, sortOrder: r.sort_order };
}

// --- Data access ---------------------------------------------------------
export async function getDropdownRows(): Promise<DropdownOptionRow[]> {
  const { data, error } = await client()
    .from(TABLE)
    .select('id,field,value,sort_order')
    .eq('active', true)
    .order('field', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  return (data as OptionRecord[])
    .filter((r) => !HIDDEN_FIELDS.has(r.field))
    .map(fromRecord);
}

export async function addOption(
  field: string,
  value: string,
  sortOrder: number
): Promise<DropdownOptionRow> {
  const { data, error } = await client()
    .from(TABLE)
    .insert({ field, value, sort_order: sortOrder })
    .select('id,field,value,sort_order')
    .single();
  if (error) throw error;
  return fromRecord(data as OptionRecord);
}

// Renames the option AND rewrites every row currently holding the old text.
// Without the cascade the old value would linger on rows and resurface in
// the pickers (screens merge in-data values), making the rename look broken.
export async function renameOption(option: DropdownOptionRow, newValue: string): Promise<void> {
  const { error } = await client()
    .from(TABLE)
    .update({ value: newValue })
    .eq('id', option.id);
  if (error) throw error;

  const meta = DROPDOWN_FIELDS.find((f) => f.field === option.field);
  for (const ref of meta?.references ?? []) {
    let query = client()
      .from(ref.table)
      .update({ [ref.column]: newValue })
      .eq(ref.column, option.value);
    for (const [key, val] of Object.entries(ref.where ?? {})) {
      query = query.eq(key, val);
    }
    const { error: refError } = await query;
    if (refError) {
      throw new Error(
        `Option renamed, but updating existing ${ref.table} rows failed: ${refError.message}`
      );
    }
  }
}

// Hard delete rather than active=false: the (field, lower(value)) unique
// index would otherwise block ever re-adding the same value. Rows already
// holding the value keep it — the screens merge in-data values, so nothing
// becomes unreadable or unfilterable.
export async function deleteOption(id: number): Promise<void> {
  const { error } = await client().from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function setOptionOrder(id: number, sortOrder: number): Promise<void> {
  const { error } = await client().from(TABLE).update({ sort_order: sortOrder }).eq('id', id);
  if (error) throw error;
}
