import { supabase } from './supabaseClient';

// Mirrors `public.tasks`. Status/priority/assignee vocabularies live in
// dropdown_options (fields `task_status`, `task_priority`, `assignee`).

export interface TaskRow {
  id: number;
  title: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string; // ISO date or '' when unset
  brand: string;
  note: string;
  createdAt: string;
}

export type TaskInput = Omit<TaskRow, 'id' | 'createdAt'>;

interface TaskRecord {
  id: number;
  title: string | null;
  status: string | null;
  priority: string | null;
  assignee: string | null;
  due_date: string | null;
  brand: string | null;
  note: string | null;
  created_at: string;
}

const TABLE = 'tasks';

function fromRecord(r: TaskRecord): TaskRow {
  return {
    id: r.id,
    title: r.title ?? '',
    status: r.status ?? '',
    priority: r.priority ?? '',
    assignee: r.assignee ?? '',
    dueDate: r.due_date ?? '',
    brand: r.brand ?? '',
    note: r.note ?? '',
    createdAt: r.created_at,
  };
}

function toRecord(input: Partial<TaskInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.title !== undefined) out.title = input.title;
  if (input.status !== undefined) out.status = input.status;
  if (input.priority !== undefined) out.priority = input.priority;
  if (input.assignee !== undefined) out.assignee = input.assignee;
  if (input.dueDate !== undefined) out.due_date = input.dueDate || null;
  if (input.brand !== undefined) out.brand = input.brand;
  if (input.note !== undefined) out.note = input.note;
  return out;
}

function client() {
  if (!supabase) {
    throw new Error('Supabase is not configured. See SUPABASE_SETUP.md.');
  }
  return supabase;
}

export async function getTasks(): Promise<TaskRow[]> {
  const { data, error } = await client()
    .from(TABLE)
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as TaskRecord[]).map(fromRecord);
}

export async function addTask(input: TaskInput): Promise<TaskRow> {
  const { data, error } = await client().from(TABLE).insert(toRecord(input)).select().single();
  if (error) throw error;
  return fromRecord(data as TaskRecord);
}

export async function updateTask(id: number, patch: Partial<TaskInput>): Promise<TaskRow> {
  const { data, error } = await client()
    .from(TABLE)
    .update(toRecord(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromRecord(data as TaskRecord);
}

export async function deleteTask(id: number): Promise<void> {
  const { error } = await client().from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
