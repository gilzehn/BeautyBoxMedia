'use client';

import { Fragment, useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import styles from './bizmanage.module.css';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  BrandRow,
  BrandInput,
  getBrands,
  addBrand,
  updateBrand,
  deleteBrand,
  getDropdownOptions,
  addDropdownOption,
} from '@/lib/brands';
import { AdminUserRow, getUsers, createUser } from '@/lib/adminUsers';

// Column definitions drive the header (sorting), the read cells, the edit
// inputs, and the toolbar filters. `select` columns pull their allowed values
// from the `dropdown_options` table (keyed by `dropdownField`).
type ColKey = keyof Omit<BrandRow, 'id'>;
type ColKind = 'text' | 'select';
interface Column {
  key: ColKey;
  label: string;
  kind: ColKind;
  dropdownField?: string; // dropdown_options.field for select columns
  numericAlign?: boolean; // right-align numeric-ish values
}
// The `note` field is intentionally not a column: it stays in the data (and in
// search) but is only shown/edited via the full-width row in edit mode.
const COLUMNS: Column[] = [
  { key: 'brand', label: 'Brand', kind: 'text' },
  { key: 'accountName', label: 'Account', kind: 'select', dropdownField: 'account_name' },
  { key: 'brandRegistry', label: 'Brand Registry', kind: 'select', dropdownField: 'brand_registry' },
  { key: 'resellerType', label: 'Reseller Type', kind: 'select', dropdownField: 'reseller_type' },
  { key: 'numAsins', label: '# ASINs', kind: 'text', numericAlign: true },
  { key: 'ownedBy', label: 'Owned By', kind: 'select', dropdownField: 'owned_by' },
  { key: 'urgency', label: 'Urgency', kind: 'select', dropdownField: 'urgency' },
  { key: 'priority', label: 'Priority', kind: 'select', dropdownField: 'priority' },
  { key: 'status', label: 'Status', kind: 'select', dropdownField: 'status' },
  { key: 'estSow', label: 'Est. SOW', kind: 'select', dropdownField: 'est_sow' },
];

const FILTER_COLUMNS = COLUMNS.filter((c) => c.kind === 'select');
const SEARCH_KEYS: ColKey[] = [...COLUMNS.map((c) => c.key), 'note'];

// Value -> pill styling per column. Level pills (High/Medium/Low) are shared
// by Urgency and Est. SOW; unmapped values (e.g. added via "+ Add new…") fall
// back to a neutral badge or plain text.
const LEVEL_CLASS: Record<string, string> = {
  High: 'levelHigh',
  Medium: 'levelMedium',
  Low: 'levelLow',
};
const LEVEL_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
const LEVEL_SORT_KEYS: ColKey[] = ['urgency', 'estSow', 'priority'];
const ACCOUNT_CLASS: Record<string, string> = {
  NRG: 'accountNRG',
  TBB: 'accountTBB',
};
const PILL_CLASS: Partial<Record<ColKey, (v: string) => string | undefined>> = {
  urgency: (v) => LEVEL_CLASS[v],
  estSow: (v) => LEVEL_CLASS[v],
  priority: (v) => LEVEL_CLASS[v],
  status: (v) =>
    v === 'Active' ? 'levelLow' : v === 'Closing Out' ? 'levelMedium' : 'badgeNeutral',
  accountName: (v) => ACCOUNT_CLASS[v] ?? 'badgeNeutral',
  brandRegistry: (v) => (v === 'Yes' ? 'levelLow' : undefined),
  resellerType: () => 'badgeNeutral',
};

// Sentinel option in edit dropdowns that prompts for a brand-new value.
const ADD_NEW = '__add_new__';

// The editable draft keeps every field as a string for smooth typing; it is
// converted to a BrandInput on save.
type Draft = Record<ColKey, string>;
const EMPTY_DRAFT: Draft = {
  brand: '',
  accountName: '',
  brandRegistry: '',
  resellerType: '',
  numAsins: '',
  ownedBy: '',
  urgency: '',
  priority: '',
  status: 'Active',
  estSow: '',
  note: '',
};

function rowToDraft(row: BrandRow): Draft {
  const { id: _id, ...fields } = row;
  return { ...fields };
}

function draftToInput(draft: Draft): BrandInput {
  return {
    brand: draft.brand.trim(),
    accountName: draft.accountName.trim(),
    brandRegistry: draft.brandRegistry.trim(),
    resellerType: draft.resellerType.trim(),
    numAsins: draft.numAsins.trim(),
    ownedBy: draft.ownedBy.trim(),
    urgency: draft.urgency.trim(),
    priority: draft.priority.trim(),
    status: draft.status.trim(),
    estSow: draft.estSow.trim(),
    note: draft.note.trim(),
  };
}

// Preserve-order de-dupe.
function uniq(values: string[]): string[] {
  return Array.from(new Set(values));
}

// Admin-only user management modal. Visibility is gated client-side on the
// session's app_metadata.role, but authorization is enforced server-side by
// the admin-users edge function.
function UsersPanel({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) =>
        setListError(err instanceof Error ? err.message : 'Failed to load users.')
      )
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');
    try {
      const created = await createUser({ email: email.trim(), password, isAdmin });
      setUsers((prev) => [...prev, created]);
      setEmail('');
      setPassword('');
      setIsAdmin(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>Users</h3>
          <button className={styles.rowBtn} onClick={onClose} type="button">
            Close
          </button>
        </div>

        {loading ? (
          <p className={styles.pageMeta}>Loading users…</p>
        ) : listError ? (
          <p className={styles.error}>{listError}</p>
        ) : (
          <ul className={styles.userList}>
            {users.map((u) => (
              <li key={u.id} className={styles.userRow}>
                <div>
                  <div className={styles.userEmail}>{u.email}</div>
                  <div className={styles.userMeta}>
                    Created {new Date(u.createdAt).toLocaleDateString()}
                    {u.lastSignInAt
                      ? ` · last sign-in ${new Date(u.lastSignInAt).toLocaleDateString()}`
                      : ' · never signed in'}
                  </div>
                </div>
                <span
                  className={`${styles.pill} ${
                    u.role === 'admin' ? styles.accountTBB : styles.badgeNeutral
                  }`}
                >
                  {u.role}
                </span>
              </li>
            ))}
          </ul>
        )}

        <form className={styles.addUserForm} onSubmit={handleCreate}>
          <h4 className={styles.addUserTitle}>Add user</h4>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@thebeautyboxmedia.com"
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder="At least 8 characters"
              required
            />
          </label>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
            />
            <span>Administrator (can manage users)</span>
          </label>
          {formError && <p className={styles.error}>{formError}</p>}
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Creating…' : 'Create user'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BizManagePage() {
  // --- Auth state ---------------------------------------------------------
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSigningIn(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setAuthError(error.message || 'Incorrect email or password.');
    } else {
      setPassword('');
    }
    setSigningIn(false);
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setEmail('');
    setPassword('');
    setUsersOpen(false);
  };

  // Admin-only affordances (enforced for real by the admin-users edge function).
  const isAdmin = session?.user?.app_metadata?.role === 'admin';
  const [usersOpen, setUsersOpen] = useState(false);

  // --- Data state ---------------------------------------------------------
  const [rows, setRows] = useState<BrandRow[]>([]);
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  const loadData = useCallback(async () => {
    setDataLoading(true);
    setDataError('');
    try {
      const [brands, opts] = await Promise.all([getBrands(), getDropdownOptions()]);
      setRows(brands);
      setOptions(opts);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadData();
  }, [session, loadData]);

  // Allowed values for a select column: dropdown_options first, then any extra
  // values present in the data (so nothing is un-selectable / un-filterable).
  const valuesFor = useCallback(
    (col: Column): string[] => {
      const base = col.dropdownField ? options[col.dropdownField] ?? [] : [];
      const present = rows.map((r) => String(r[col.key] ?? '')).filter(Boolean);
      return uniq([...base, ...present]);
    },
    [options, rows]
  );

  // --- Filter / search / sort --------------------------------------------
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Partial<Record<ColKey, string>>>({});
  const [sortKey, setSortKey] = useState<ColKey>('brand');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const out = rows.filter((row) => {
      for (const col of FILTER_COLUMNS) {
        const active = filters[col.key];
        if (active && String(row[col.key] ?? '') !== active) return false;
      }
      if (!term) return true;
      return SEARCH_KEYS.some((key) =>
        String(row[key] ?? '').toLowerCase().includes(term)
      );
    });
    out.sort((a, b) => {
      const av = String(a[sortKey] ?? '');
      const bv = String(b[sortKey] ?? '');
      let cmp: number;
      if (sortKey === 'numAsins') {
        // Numeric-ish text column: non-numbers/empties always sort last.
        const an = av.trim() === '' || Number.isNaN(Number(av)) ? null : Number(av);
        const bn = bv.trim() === '' || Number.isNaN(Number(bv)) ? null : Number(bv);
        if (an === null && bn === null) cmp = 0;
        else if (an === null) return 1;
        else if (bn === null) return -1;
        else cmp = an - bn;
      } else if (LEVEL_SORT_KEYS.includes(sortKey)) {
        // Level columns: High -> Medium -> Low; unknown/empty always last.
        const ar = LEVEL_RANK[av] ?? null;
        const br = LEVEL_RANK[bv] ?? null;
        if (ar === null && br === null) cmp = 0;
        else if (ar === null) return 1;
        else if (br === null) return -1;
        else cmp = ar - br;
      } else {
        cmp = av.localeCompare(bv);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return out;
  }, [rows, search, filters, sortKey, sortDir]);

  const toggleSort = (key: ColKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const anyFilterActive = search.trim() !== '' || Object.values(filters).some(Boolean);
  const clearFilters = () => {
    setSearch('');
    setFilters({});
  };

  // Per-column value counts shown in the filter dropdown labels.
  const filterCounts = useMemo(() => {
    const counts: Partial<Record<ColKey, Map<string, number>>> = {};
    for (const col of FILTER_COLUMNS) {
      const m = new Map<string, number>();
      for (const r of rows) {
        const v = String(r[col.key] ?? '');
        if (v) m.set(v, (m.get(v) ?? 0) + 1);
      }
      counts[col.key] = m;
    }
    return counts;
  }, [rows]);

  // --- Editing ------------------------------------------------------------
  // editingId is a stringified row id, 'new' for the add-row, or null.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState('');

  const startEdit = (row: BrandRow) => {
    setEditingId(String(row.id));
    setDraft(rowToDraft(row));
    setRowError('');
  };
  const startAdd = () => {
    setEditingId('new');
    setDraft(EMPTY_DRAFT);
    setRowError('');
  };
  const cancelEdit = () => {
    setEditingId(null);
    setRowError('');
  };
  const setField = (key: ColKey, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Select change for dropdown-backed cells. Picking the sentinel prompts for
  // a brand-new value and persists it to dropdown_options for next time.
  const handleSelectChange = async (col: Column, raw: string) => {
    if (raw !== ADD_NEW) {
      setField(col.key, raw);
      return;
    }
    const entered = window.prompt(`Add a new ${col.label} option:`);
    const value = entered?.trim();
    if (!value || value === ADD_NEW) return; // cancel/empty: draft untouched
    const existing = valuesFor(col).find((v) => v.toLowerCase() === value.toLowerCase());
    if (existing) {
      setField(col.key, existing); // reuse canonical casing
      return;
    }
    setField(col.key, value);
    const field = col.dropdownField;
    if (!field) return;
    try {
      await addDropdownOption(field, value);
      setOptions((prev) => ({ ...prev, [field]: [...(prev[field] ?? []), value] }));
    } catch {
      setRowError(
        `"${value}" is set on this row, but saving it as a reusable ${col.label} option failed.`
      );
    }
  };

  const saveEdit = async () => {
    const input = draftToInput(draft);
    if (!input.brand) {
      setRowError('Brand name is required.');
      return;
    }
    setSaving(true);
    setRowError('');
    try {
      if (editingId === 'new') {
        const created = await addBrand(input);
        setRows((prev) => [...prev, created]);
      } else if (editingId) {
        const updated = await updateBrand(Number(editingId), input);
        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      }
      setEditingId(null);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (row: BrandRow) => {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${row.brand}"?`)) return;
    setRowError('');
    try {
      await deleteBrand(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  // --- Cell renderers -----------------------------------------------------
  const renderEditCell = (col: Column) => {
    const alignClass = col.numericAlign ? styles.numCol : undefined;
    if (col.kind === 'select') {
      const opts = uniq([...valuesFor(col), draft[col.key]].filter(Boolean));
      return (
        <td key={col.key}>
          <select
            className={styles.cellSelect}
            value={draft[col.key]}
            onChange={(e) => handleSelectChange(col, e.target.value)}
          >
            <option value="">—</option>
            {opts.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            <option value={ADD_NEW}>＋ Add new…</option>
          </select>
        </td>
      );
    }
    return (
      <td key={col.key} className={alignClass}>
        <input
          className={styles.cellInput}
          type="text"
          inputMode={col.key === 'numAsins' ? 'numeric' : undefined}
          value={draft[col.key]}
          onChange={(e) => setField(col.key, e.target.value)}
        />
      </td>
    );
  };

  const renderReadCell = (col: Column, row: BrandRow) => {
    const alignClass = col.numericAlign ? styles.numCol : undefined;
    if (col.key === 'brand') {
      return (
        <td key={col.key} className={styles.strong}>
          {row.brand}
        </td>
      );
    }
    const value = row[col.key];
    const text = value === null ? '' : String(value);
    if (text === '') {
      return (
        <td key={col.key} className={alignClass}>
          <span className={styles.muted}>—</span>
        </td>
      );
    }
    const pillClass = PILL_CLASS[col.key]?.(text);
    if (pillClass && styles[pillClass]) {
      return (
        <td key={col.key}>
          <span className={`${styles.pill} ${styles[pillClass]}`}>{text}</span>
        </td>
      );
    }
    if (col.key === 'brandRegistry') {
      // Only "Yes" earns a pill; No / N/A stay quiet.
      return (
        <td key={col.key}>
          <span className={styles.muted}>{text}</span>
        </td>
      );
    }
    return (
      <td key={col.key} className={alignClass}>
        {text}
      </td>
    );
  };

  // Full-width companion row shown beneath an editing row: the note lives
  // here instead of occupying a table column.
  const renderNoteEditRow = () => (
    <tr className={styles.editingRow}>
      <td colSpan={COLUMNS.length + 1}>
        <label className={styles.noteEditInner}>
          <span className={styles.label}>Note</span>
          <input
            className={styles.cellInput}
            type="text"
            value={draft.note}
            onChange={(e) => setField('note', e.target.value)}
            placeholder="Optional note"
          />
        </label>
      </td>
    </tr>
  );

  // --- Not-configured guard ----------------------------------------------
  if (!isSupabaseConfigured) {
    return (
      <div className={styles.authScreen}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>
            Biz<span className={styles.accent}>Manage</span>
          </h1>
          <p className={styles.authSubtitle}>Supabase isn&apos;t configured yet.</p>
          <p className={styles.notice}>
            Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment, then reload.
            See <code>SUPABASE_SETUP.md</code> for the step-by-step guide.
          </p>
        </div>
      </div>
    );
  }

  // --- Auth loading -------------------------------------------------------
  if (!authReady) {
    return (
      <div className={styles.authScreen}>
        <p className={styles.pageMeta}>Loading…</p>
      </div>
    );
  }

  // --- Sign-in screen -----------------------------------------------------
  if (!session) {
    return (
      <div className={styles.authScreen}>
        <form className={styles.authCard} onSubmit={handleSignIn}>
          <h1 className={styles.authTitle}>
            Biz<span className={styles.accent}>Manage</span>
          </h1>
          <p className={styles.authSubtitle}>Sign in to the management console.</p>

          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@thebeautyboxmedia.com"
              autoComplete="username"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {authError && <p className={styles.error}>{authError}</p>}

          <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={signingIn}>
            {signingIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  // --- Console ------------------------------------------------------------
  const editingNew = editingId === 'new';
  const colSpan = COLUMNS.length + 1;

  return (
    <div className={styles.console}>
      <header className={styles.topbar}>
        <div className={styles.brandMark}>
          Biz<span className={styles.accent}>Manage</span>
        </div>
        <div className={styles.topbarActions}>
          {isAdmin && (
            <button
              className={`btn btn-outline ${styles.signOut}`}
              onClick={() => setUsersOpen(true)}
              type="button"
            >
              Users
            </button>
          )}
          <button className={`btn btn-outline ${styles.signOut}`} onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      {isAdmin && usersOpen && <UsersPanel onClose={() => setUsersOpen(false)} />}

      <main className={styles.content}>
        <div className={styles.pageHead}>
          <h2 className={styles.pageTitle}>Brand Accounts</h2>
          <p className={styles.pageMeta}>
            {visibleRows.length}
            {visibleRows.length !== rows.length ? ` of ${rows.length}` : ''} brands
          </p>
        </div>

        {/* Toolbar: search + filters + add */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarFilters}>
            <input
              className={styles.searchInput}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
            />
            {FILTER_COLUMNS.map((col) => (
              <select
                key={col.key}
                className={`${styles.filterSelect} ${
                  filters[col.key] ? styles.filterSelectActive : ''
                }`}
                value={filters[col.key] ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, [col.key]: e.target.value || undefined }))
                }
              >
                <option value="">All {col.label}</option>
                {valuesFor(col).map((v) => (
                  <option key={v} value={v}>
                    {v} ({filterCounts[col.key]?.get(v) ?? 0})
                  </option>
                ))}
              </select>
            ))}
            {anyFilterActive && (
              <button className={styles.clearBtn} onClick={clearFilters} type="button">
                Clear
              </button>
            )}
          </div>
          <button
            className={`btn btn-primary ${styles.addBtn}`}
            onClick={startAdd}
            disabled={editingNew}
            type="button"
          >
            + Add brand
          </button>
        </div>

        {dataError && <p className={styles.error}>{dataError}</p>}
        {rowError && <p className={styles.error}>{rowError}</p>}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`${styles.sortable} ${col.numericAlign ? styles.numCol : ''}`}
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    <span className={styles.sortArrow}>
                      {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </span>
                  </th>
                ))}
                <th className={styles.actionsHead}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Inline add row */}
              {editingNew && (
                <>
                  <tr className={styles.editingRow}>
                    {COLUMNS.map((col) => renderEditCell(col))}
                    <td className={styles.actionsCell}>
                      <button className={styles.rowBtnPrimary} onClick={saveEdit} disabled={saving} type="button">
                        {saving ? '…' : 'Save'}
                      </button>
                      <button className={styles.rowBtn} onClick={cancelEdit} type="button">
                        Cancel
                      </button>
                    </td>
                  </tr>
                  {renderNoteEditRow()}
                </>
              )}

              {dataLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className={styles.emptyCell}>
                    Loading…
                  </td>
                </tr>
              ) : visibleRows.length === 0 && !editingNew ? (
                <tr>
                  <td colSpan={colSpan} className={styles.emptyCell}>
                    {rows.length === 0 ? 'No brands yet. Add your first one.' : 'No matches.'}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) =>
                  editingId === String(row.id) ? (
                    <Fragment key={row.id}>
                      <tr className={styles.editingRow}>
                        {COLUMNS.map((col) => renderEditCell(col))}
                        <td className={styles.actionsCell}>
                          <button className={styles.rowBtnPrimary} onClick={saveEdit} disabled={saving} type="button">
                            {saving ? '…' : 'Save'}
                          </button>
                          <button className={styles.rowBtn} onClick={cancelEdit} type="button">
                            Cancel
                          </button>
                        </td>
                      </tr>
                      {renderNoteEditRow()}
                    </Fragment>
                  ) : (
                    <tr key={row.id}>
                      {COLUMNS.map((col) => renderReadCell(col, row))}
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.rowBtn}
                          onClick={() => startEdit(row)}
                          disabled={editingId !== null}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className={styles.rowBtnDanger}
                          onClick={() => removeRow(row)}
                          disabled={editingId !== null}
                          type="button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
