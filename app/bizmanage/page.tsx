'use client';

import { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import styles from './bizmanage.module.css';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  BrandRow,
  BrandInput,
  Level,
  getBrands,
  addBrand,
  updateBrand,
  deleteBrand,
} from '@/lib/brands';

const LEVELS: Level[] = ['High', 'Medium', 'Low'];

// Column definitions drive both the header (with sorting) and the cells.
type ColKey = keyof Omit<BrandRow, 'id'>;
type ColType = 'text' | 'number' | 'level';
interface Column {
  key: ColKey;
  label: string;
  type: ColType;
  filterable?: boolean;
}
const COLUMNS: Column[] = [
  { key: 'brand', label: 'Brand', type: 'text' },
  { key: 'registry', label: 'Brand Registry', type: 'text', filterable: true },
  { key: 'resellerType', label: 'Reseller Type', type: 'text', filterable: true },
  { key: 'asins', label: '# ASINs', type: 'number' },
  { key: 'accountName', label: 'Account Name', type: 'text' },
  { key: 'ownedBy', label: 'Owned By', type: 'text', filterable: true },
  { key: 'urgency', label: 'Urgency', type: 'level', filterable: true },
  { key: 'priority', label: 'Priority', type: 'level', filterable: true },
];

// The editable draft keeps every field as a string for smooth typing; it is
// converted to a BrandInput on save.
type Draft = Record<ColKey, string>;
const EMPTY_DRAFT: Draft = {
  brand: '',
  registry: '',
  resellerType: '',
  asins: '0',
  accountName: '',
  ownedBy: '',
  urgency: 'Low',
  priority: 'Low',
};

function rowToDraft(row: BrandRow): Draft {
  return {
    brand: row.brand,
    registry: row.registry,
    resellerType: row.resellerType,
    asins: String(row.asins),
    accountName: row.accountName,
    ownedBy: row.ownedBy,
    urgency: row.urgency,
    priority: row.priority,
  };
}

function draftToInput(draft: Draft): BrandInput {
  return {
    brand: draft.brand.trim(),
    registry: draft.registry.trim(),
    resellerType: draft.resellerType.trim(),
    asins: parseInt(draft.asins, 10) || 0,
    accountName: draft.accountName.trim(),
    ownedBy: draft.ownedBy.trim(),
    urgency: (LEVELS.includes(draft.urgency as Level) ? draft.urgency : 'Low') as Level,
    priority: (LEVELS.includes(draft.priority as Level) ? draft.priority : 'Low') as Level,
  };
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
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  const loadRows = useCallback(async () => {
    setDataLoading(true);
    setDataError('');
    try {
      setRows(await getBrands());
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to load brands.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadRows();
  }, [session, loadRows]);

  // --- Filter / search / sort --------------------------------------------
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Partial<Record<ColKey, string>>>({});
  const [sortKey, setSortKey] = useState<ColKey>('brand');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filterOptions = useMemo(() => {
    const opts: Partial<Record<ColKey, string[]>> = {};
    for (const col of COLUMNS) {
      if (!col.filterable) continue;
      const values = Array.from(new Set(rows.map((r) => String(r[col.key])).filter(Boolean)));
      values.sort();
      opts[col.key] = values;
    }
    return opts;
  }, [rows]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    let out = rows.filter((row) => {
      // Column filters (exact match).
      for (const col of COLUMNS) {
        const active = filters[col.key];
        if (active && String(row[col.key]) !== active) return false;
      }
      // Free-text search across every field.
      if (!term) return true;
      return COLUMNS.some((col) => String(row[col.key]).toLowerCase().includes(term));
    });
    out = [...out].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp: number;
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return out;
  }, [rows, search, filters, sortKey, sortDir]);

  const toggleSort = (key: ColKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
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
  // editingId is a row id, 'new' for the add-row, or null when not editing.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState('');

  const startEdit = (row: BrandRow) => {
    setEditingId(row.id);
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
        const updated = await updateBrand(editingId, input);
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
    if (col.type === 'level') {
      return (
        <td key={col.key}>
          <select
            className={styles.cellSelect}
            value={draft[col.key]}
            onChange={(e) => setField(col.key, e.target.value)}
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </td>
      );
    }
    return (
      <td key={col.key} className={col.type === 'number' ? styles.numCol : undefined}>
        <input
          className={styles.cellInput}
          type={col.type === 'number' ? 'number' : 'text'}
          value={draft[col.key]}
          onChange={(e) => setField(col.key, e.target.value)}
        />
      </td>
    );
  };

  const renderReadCell = (col: Column, row: BrandRow) => {
    if (col.type === 'level') {
      const val = row[col.key] as Level;
      return (
        <td key={col.key}>
          <span className={`${styles.pill} ${styles[`level${val}`]}`}>{val}</span>
        </td>
      );
    }
    if (col.key === 'brand') {
      return (
        <td key={col.key} className={styles.strong}>
          {row.brand}
        </td>
      );
    }
    return (
      <td key={col.key} className={col.type === 'number' ? styles.numCol : undefined}>
        {String(row[col.key])}
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
            {COLUMNS.filter((c) => c.filterable).map((col) => (
              <select
                key={col.key}
                className={styles.filterSelect}
                value={filters[col.key] ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, [col.key]: e.target.value || undefined }))
                }
              >
                <option value="">All {col.label}</option>
                {(filterOptions[col.key] ?? []).map((v) => (
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
                    className={`${styles.sortable} ${col.type === 'number' ? styles.numCol : ''}`}
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
                    <button
                      className={styles.rowBtnPrimary}
                      onClick={saveEdit}
                      disabled={saving}
                      type="button"
                    >
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
                  <td colSpan={COLUMNS.length + 1} className={styles.emptyCell}>
                    Loading…
                  </td>
                </tr>
              ) : visibleRows.length === 0 && !editingNew ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className={styles.emptyCell}>
                    {rows.length === 0 ? 'No brands yet. Add your first one.' : 'No matches.'}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) =>
                  editingId === row.id ? (
                    <tr key={row.id} className={styles.editingRow}>
                      {COLUMNS.map((col) => renderEditCell(col))}
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.rowBtnPrimary}
                          onClick={saveEdit}
                          disabled={saving}
                          type="button"
                        >
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
