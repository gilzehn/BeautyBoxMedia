'use client';

import { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
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
} from '@/lib/brands';

// Column definitions drive the header (sorting), the read cells, the edit
// inputs, and the toolbar filters. `select` columns pull their allowed values
// from the `dropdown_options` table (keyed by `dropdownField`).
type ColKey = keyof Omit<BrandRow, 'id'>;
type ColKind = 'text' | 'number' | 'select';
interface Column {
  key: ColKey;
  label: string;
  kind: ColKind;
  dropdownField?: string; // dropdown_options.field for select columns
  numericAlign?: boolean; // right-align numeric-ish values
}
const COLUMNS: Column[] = [
  { key: 'brand', label: 'Brand', kind: 'text' },
  { key: 'accountName', label: 'Account', kind: 'select', dropdownField: 'account_name' },
  { key: 'brandRegistry', label: 'Brand Registry', kind: 'select', dropdownField: 'brand_registry' },
  { key: 'resellerType', label: 'Reseller Type', kind: 'select', dropdownField: 'reseller_type' },
  { key: 'numAsins', label: '# ASINs', kind: 'text', numericAlign: true },
  { key: 'ownedBy', label: 'Owned By', kind: 'select', dropdownField: 'owned_by' },
  { key: 'urgency', label: 'Urgency', kind: 'select', dropdownField: 'urgency' },
  { key: 'priority', label: 'Priority', kind: 'number', numericAlign: true },
  { key: 'status', label: 'Status', kind: 'select', dropdownField: 'status' },
  { key: 'estSow', label: 'Est. SOW', kind: 'text' },
  { key: 'note', label: 'Note', kind: 'text' },
];

const FILTER_COLUMNS = COLUMNS.filter((c) => c.kind === 'select');
const PILL_LEVELS = ['High', 'Medium', 'Low'];

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
  return {
    brand: row.brand,
    accountName: row.accountName,
    brandRegistry: row.brandRegistry,
    resellerType: row.resellerType,
    numAsins: row.numAsins,
    ownedBy: row.ownedBy,
    urgency: row.urgency,
    priority: row.priority === null ? '' : String(row.priority),
    status: row.status,
    estSow: row.estSow,
    note: row.note,
  };
}

function draftToInput(draft: Draft): BrandInput {
  const p = parseInt(draft.priority, 10);
  return {
    brand: draft.brand.trim(),
    accountName: draft.accountName.trim(),
    brandRegistry: draft.brandRegistry.trim(),
    resellerType: draft.resellerType.trim(),
    numAsins: draft.numAsins.trim(),
    ownedBy: draft.ownedBy.trim(),
    urgency: draft.urgency.trim(),
    priority: draft.priority.trim() === '' || Number.isNaN(p) ? null : p,
    status: draft.status.trim(),
    estSow: draft.estSow.trim(),
    note: draft.note.trim(),
  };
}

// Preserve-order de-dupe.
function uniq(values: string[]): string[] {
  return Array.from(new Set(values));
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
  };

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
      return COLUMNS.some((col) =>
        String(row[col.key] ?? '').toLowerCase().includes(term)
      );
    });
    out.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp: number;
      if (typeof av === 'number' || typeof bv === 'number' || av === null || bv === null) {
        // Numeric column (priority): nulls always sort last regardless of dir.
        const an = typeof av === 'number' ? av : null;
        const bn = typeof bv === 'number' ? bv : null;
        if (an === null && bn === null) cmp = 0;
        else if (an === null) return 1;
        else if (bn === null) return -1;
        else cmp = an - bn;
      } else {
        cmp = String(av).localeCompare(String(bv));
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
            onChange={(e) => setField(col.key, e.target.value)}
          >
            <option value="">—</option>
            {opts.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </td>
      );
    }
    return (
      <td key={col.key} className={alignClass}>
        <input
          className={styles.cellInput}
          type={col.kind === 'number' ? 'number' : 'text'}
          min={col.kind === 'number' ? 1 : undefined}
          max={col.kind === 'number' ? 30 : undefined}
          value={draft[col.key]}
          onChange={(e) => setField(col.key, e.target.value)}
          placeholder={col.key === 'priority' ? '1–30' : undefined}
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
    if (col.key === 'urgency') {
      const val = row.urgency;
      return (
        <td key={col.key}>
          {PILL_LEVELS.includes(val) ? (
            <span className={`${styles.pill} ${styles[`level${val}`]}`}>{val}</span>
          ) : (
            val
          )}
        </td>
      );
    }
    const value = row[col.key];
    return (
      <td key={col.key} className={alignClass}>
        {value === null || value === '' ? <span className={styles.muted}>—</span> : String(value)}
      </td>
    );
  };

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
        <button className={`btn btn-outline ${styles.signOut}`} onClick={handleSignOut}>
          Sign out
        </button>
      </header>

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
                className={styles.filterSelect}
                value={filters[col.key] ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, [col.key]: e.target.value || undefined }))
                }
              >
                <option value="">All {col.label}</option>
                {valuesFor(col).map((v) => (
                  <option key={v} value={v}>
                    {v}
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
                    <tr key={row.id} className={styles.editingRow}>
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
