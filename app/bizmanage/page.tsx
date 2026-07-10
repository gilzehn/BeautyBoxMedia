'use client';

import { Fragment, useState, useEffect, useMemo, useCallback, useRef, FormEvent } from 'react';
import Image from 'next/image';
import type { Session } from '@supabase/supabase-js';
import styles from './bizmanage.module.css';
import Sidebar, { ViewId, VIEW_TITLES } from './Sidebar';
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

// Column definitions drive the header (sorting), the always-editable cells,
// and the per-column header filters. `select` columns pull their allowed
// values from the `dropdown_options` table (keyed by `dropdownField`).
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
// search) and is edited via the expandable note row under each brand.
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

// Blank row used by the add-brand flow.
const EMPTY_INPUT: BrandInput = {
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

// Preserve-order de-dupe.
function uniq(values: string[]): string[] {
  return Array.from(new Set(values));
}

function NoteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
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

// Pop-up card for creating a brand. Only the essentials are asked here —
// every other field is edited directly on the table afterwards.
function AddBrandModal({
  accounts,
  onClose,
  onCreated,
}: {
  accounts: string[];
  onClose: () => void;
  onCreated: (row: BrandRow) => void;
}) {
  const [brand, setBrand] = useState('');
  const [account, setAccount] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = brand.trim();
    if (!name) return;
    setCreating(true);
    setError('');
    try {
      const created = await addBrand({ ...EMPTY_INPUT, brand: name, accountName: account });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add brand.');
      setCreating(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <form
        className={`${styles.modalCard} ${styles.modalCardSm}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>Add brand</h3>
          <button className={styles.rowBtn} onClick={onClose} type="button">
            Cancel
          </button>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Brand name</span>
          <input
            className={styles.input}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Glow Theory"
            autoFocus
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Account (optional)</span>
          <select
            className={styles.input}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          >
            <option value="">—</option>
            {accounts.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <p className={styles.modalHint}>
          The brand starts as Active. Everything else — registry, urgency, priority, notes —
          is filled in right on the table.
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={creating || !brand.trim()}>
          {creating ? 'Adding…' : 'Add brand'}
        </button>
      </form>
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

  // --- View switching -------------------------------------------------------
  // The sidebar swaps what <main> renders; the hash keeps the view across
  // refreshes (static export, so hash is the only shareable URL mechanism).
  const [view, setView] = useState<ViewId>('brands');
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && hash in VIEW_TITLES) setView(hash as ViewId);
  }, []);
  const handleNavigate = (next: ViewId) => {
    setView(next);
    history.replaceState(null, '', `#${next}`);
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
      for (const col of COLUMNS) {
        const active = filters[col.key];
        if (!active) continue;
        const value = String(row[col.key] ?? '');
        // Select columns filter by exact value; text columns by contains.
        if (col.kind === 'select') {
          if (value !== active) return false;
        } else if (!value.toLowerCase().includes(active.trim().toLowerCase())) {
          return false;
        }
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

  // --- Inline editing ------------------------------------------------------
  // Every cell is always editable: selects save immediately on change, text
  // cells save on blur/Enter (Escape reverts). Saves are optimistic; each
  // row's saves run serialized on a promise chain so rapid edits can't race.
  const [cellDraft, setCellDraft] = useState<{ rowId: number; key: ColKey; value: string } | null>(
    null
  );
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState('');
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const rowsRef = useRef<BrandRow[]>([]);
  rowsRef.current = rows;
  const saveChains = useRef(new Map<number, Promise<void>>());
  const pendingCounts = useRef(new Map<number, number>());
  // Escape must suppress the save in the blur that follows it; a ref (not
  // state) because the blur fires before a state update would land.
  const skipBlurSave = useRef(false);

  const saveField = (rowId: number, key: ColKey, value: string) => {
    const current = rowsRef.current.find((r) => r.id === rowId);
    if (!current || String(current[key] ?? '') === value) return;
    if (key === 'brand' && !value.trim()) {
      setSaveError('Brand name is required — change reverted.');
      return;
    }
    const prevValue = String(current[key] ?? '');
    const brandLabel = current.brand;
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));
    pendingCounts.current.set(rowId, (pendingCounts.current.get(rowId) ?? 0) + 1);
    setSavingIds((prev) => new Set(prev).add(rowId));

    const chain = (saveChains.current.get(rowId) ?? Promise.resolve())
      .then(async () => {
        const latest = rowsRef.current.find((r) => r.id === rowId);
        if (!latest) return; // row deleted while queued
        const { id: _id, ...input } = latest;
        // The server echo is deliberately ignored: writing it back could
        // clobber a newer optimistic edit already queued behind this save.
        await updateBrand(rowId, input);
      })
      .catch((err) => {
        // Revert only if the field still holds the value that failed.
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId && String(r[key] ?? '') === value ? { ...r, [key]: prevValue } : r
          )
        );
        const label = COLUMNS.find((c) => c.key === key)?.label ?? key;
        const msg = err instanceof Error ? err.message : 'save failed';
        setSaveError(`Couldn't save ${label} for "${brandLabel}": ${msg}`);
      })
      .finally(() => {
        const left = (pendingCounts.current.get(rowId) ?? 1) - 1;
        if (left <= 0) {
          pendingCounts.current.delete(rowId);
          saveChains.current.delete(rowId);
          setSavingIds((prev) => {
            const next = new Set(prev);
            next.delete(rowId);
            return next;
          });
        } else {
          pendingCounts.current.set(rowId, left);
        }
      });
    saveChains.current.set(rowId, chain);
  };

  // Select change straight from a cell. Picking the sentinel prompts for a
  // brand-new value and persists it to dropdown_options for next time.
  const handleCellSelect = async (row: BrandRow, col: Column, raw: string) => {
    if (raw !== ADD_NEW) {
      saveField(row.id, col.key, raw);
      return;
    }
    const entered = window.prompt(`Add a new ${col.label} option:`);
    const value = entered?.trim();
    if (!value || value === ADD_NEW) return; // cancel/empty: select snaps back
    const existing = valuesFor(col).find((v) => v.toLowerCase() === value.toLowerCase());
    if (existing) {
      saveField(row.id, col.key, existing); // reuse canonical casing
      return;
    }
    saveField(row.id, col.key, value);
    const field = col.dropdownField;
    if (!field) return;
    try {
      await addDropdownOption(field, value);
      setOptions((prev) => ({ ...prev, [field]: [...(prev[field] ?? []), value] }));
    } catch {
      setSaveError(
        `"${value}" is saved on this row, but adding it as a reusable ${col.label} option failed.`
      );
    }
  };

  const handleBrandCreated = (created: BrandRow) => {
    setRows((prev) => [...prev, created]);
    clearFilters(); // make sure the new row isn't hidden by an active filter
  };

  const removeRow = async (row: BrandRow) => {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${row.brand}"?`)) return;
    setSaveError('');
    try {
      await deleteBrand(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      if (openNoteId === row.id) setOpenNoteId(null);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  // --- Cell renderers -----------------------------------------------------
  // The read-only look of a value (pill / muted dash / plain), shown under
  // the invisible overlay select.
  const renderDisplayValue = (col: Column, text: string) => {
    if (text === '') return <span className={styles.muted}>—</span>;
    const pillClass = PILL_CLASS[col.key]?.(text);
    if (pillClass && styles[pillClass]) {
      return <span className={`${styles.pill} ${styles[pillClass]}`}>{text}</span>;
    }
    if (col.key === 'brandRegistry') {
      // Only "Yes" earns a pill; No / N/A stay quiet.
      return <span className={styles.muted}>{text}</span>;
    }
    return <>{text}</>;
  };

  const renderCell = (col: Column, row: BrandRow) => {
    const text = String(row[col.key] ?? '');
    const alignClass = col.numericAlign ? styles.numCol : undefined;
    if (col.kind === 'select') {
      const opts = uniq([...valuesFor(col), text].filter(Boolean));
      return (
        <td key={col.key} className={alignClass}>
          <div className={styles.selectCell}>
            {renderDisplayValue(col, text)}
            {/* Invisible overlay: the first click opens the native picker,
                and it keeps the cell keyboard-focusable. */}
            <select
              className={styles.overlaySelect}
              value={text}
              aria-label={`${col.label} for ${row.brand}`}
              onChange={(e) => handleCellSelect(row, col, e.target.value)}
            >
              <option value="">—</option>
              {opts.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
              <option value={ADD_NEW}>＋ Add new…</option>
            </select>
          </div>
        </td>
      );
    }
    const isDrafting = cellDraft?.rowId === row.id && cellDraft.key === col.key;
    return (
      <td key={col.key} className={alignClass}>
        <input
          className={`${styles.ghostInput} ${col.key === 'brand' ? styles.ghostInputStrong : ''}`}
          type="text"
          inputMode={col.key === 'numAsins' ? 'numeric' : undefined}
          aria-label={`${col.label} for ${row.brand}`}
          value={isDrafting ? cellDraft.value : text}
          onFocus={() => setCellDraft({ rowId: row.id, key: col.key, value: text })}
          onChange={(e) => setCellDraft((d) => (d ? { ...d, value: e.target.value } : d))}
          onBlur={(e) => {
            const v = e.target.value;
            setCellDraft(null);
            if (skipBlurSave.current) {
              skipBlurSave.current = false;
              return; // Escape: revert without saving
            }
            saveField(row.id, col.key, v.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            else if (e.key === 'Escape') {
              skipBlurSave.current = true;
              e.currentTarget.blur();
            }
          }}
        />
      </td>
    );
  };

  // Expandable full-width note editor under a row (toggled by the note icon).
  const renderNoteRow = (row: BrandRow) => {
    const isDrafting = cellDraft?.rowId === row.id && cellDraft.key === 'note';
    return (
      <tr className={styles.noteRow}>
        <td colSpan={COLUMNS.length + 1}>
          <label className={styles.noteRowInner}>
            <span className={styles.label}>Note</span>
            <input
              className={styles.cellInput}
              type="text"
              placeholder="Optional note"
              value={isDrafting ? cellDraft.value : row.note}
              onFocus={() => setCellDraft({ rowId: row.id, key: 'note', value: row.note })}
              onChange={(e) => setCellDraft((d) => (d ? { ...d, value: e.target.value } : d))}
              onBlur={(e) => {
                const v = e.target.value;
                setCellDraft(null);
                if (skipBlurSave.current) {
                  skipBlurSave.current = false;
                  return;
                }
                saveField(row.id, 'note', v.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                else if (e.key === 'Escape') {
                  skipBlurSave.current = true;
                  e.currentTarget.blur();
                  setOpenNoteId(null);
                }
              }}
            />
          </label>
        </td>
      </tr>
    );
  };

  // --- Not-configured guard ----------------------------------------------
  if (!isSupabaseConfigured) {
    return (
      <div className={styles.authScreen}>
        <div className={styles.authWrap}>
          <Image src="/logo.svg" alt="Beauty Box Media" width={216} height={52} priority />
          <div className={styles.authCard}>
            <h1 className={styles.authTitle}>
              Business <span className={styles.accent}>Console</span>
            </h1>
            <p className={styles.authSubtitle}>Supabase isn&apos;t configured yet.</p>
            <p className={styles.notice}>
              Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment, then reload.
              See <code>SUPABASE_SETUP.md</code> for the step-by-step guide.
            </p>
          </div>
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
        <div className={styles.authWrap}>
          <Image src="/logo.svg" alt="Beauty Box Media" width={216} height={52} priority />
          <form className={styles.authCard} onSubmit={handleSignIn}>
            <h1 className={styles.authTitle}>
              Business <span className={styles.accent}>Console</span>
            </h1>
            <p className={styles.authSubtitle}>Sign in to continue.</p>

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
      </div>
    );
  }

  // --- Console ------------------------------------------------------------
  const colSpan = COLUMNS.length + 1;

  return (
    <div className={styles.console}>
      <header className={styles.topbar}>
        <div className={styles.brandMark}>
          <Image src="/logo.svg" alt="Beauty Box Media" width={148} height={36} priority />
          <span className={styles.brandDivider} aria-hidden="true" />
          <span className={styles.brandName}>
            Business <span className={styles.accent}>Console</span>
          </span>
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

      <div className={styles.shell}>
        <Sidebar view={view} onNavigate={handleNavigate} />
        <main className={styles.content}>
          {view !== 'brands' ? (
            <>
              <div className={styles.pageHead}>
                <h2 className={styles.pageTitle}>{VIEW_TITLES[view]}</h2>
              </div>
              <div className={styles.comingSoonCard}>
                <p>Coming soon</p>
              </div>
            </>
          ) : (
            <>
              <div className={styles.pageHead}>
                <h2 className={styles.pageTitle}>Brand List</h2>
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
                  {anyFilterActive && (
                    <button className={styles.clearBtn} onClick={clearFilters} type="button">
                      Clear
                    </button>
                  )}
                </div>
                <button
                  className={`btn btn-primary ${styles.addBtn}`}
                  onClick={() => setAddOpen(true)}
                  type="button"
                >
                  + Add brand
                </button>
              </div>

              {addOpen && (
                <AddBrandModal
                  accounts={options['account_name'] ?? []}
                  onClose={() => setAddOpen(false)}
                  onCreated={handleBrandCreated}
                />
              )}

              {dataError && <p className={styles.error}>{dataError}</p>}
              {saveError && (
                <div className={styles.errorBar} role="alert">
                  <span>{saveError}</span>
                  <button className={styles.errorDismiss} onClick={() => setSaveError('')} type="button">
                    Dismiss
                  </button>
                </div>
              )}

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
                      <th className={styles.actionsHead} aria-label="Actions" />
                    </tr>
                    <tr className={styles.filterRow}>
                      {COLUMNS.map((col) =>
                        col.kind === 'select' ? (
                          <th key={col.key}>
                            <select
                              className={`${styles.columnFilter} ${
                                filters[col.key] ? styles.columnFilterActive : ''
                              }`}
                              value={filters[col.key] ?? ''}
                              onChange={(e) =>
                                setFilters((f) => ({ ...f, [col.key]: e.target.value || undefined }))
                              }
                              aria-label={`Filter ${col.label}`}
                            >
                              <option value="">All</option>
                              {valuesFor(col).map((v) => (
                                <option key={v} value={v}>
                                  {v} ({filterCounts[col.key]?.get(v) ?? 0})
                                </option>
                              ))}
                            </select>
                          </th>
                        ) : (
                          <th key={col.key}>
                            <input
                              type="search"
                              className={`${styles.columnFilter} ${
                                filters[col.key] ? styles.columnFilterActive : ''
                              }`}
                              value={filters[col.key] ?? ''}
                              onChange={(e) =>
                                setFilters((f) => ({ ...f, [col.key]: e.target.value || undefined }))
                              }
                              placeholder="Filter…"
                              aria-label={`Filter ${col.label}`}
                            />
                          </th>
                        )
                      )}
                      <th aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading && rows.length === 0 ? (
                      <tr>
                        <td colSpan={colSpan} className={styles.emptyCell}>
                          Loading…
                        </td>
                      </tr>
                    ) : visibleRows.length === 0 ? (
                      <tr>
                        <td colSpan={colSpan} className={styles.emptyCell}>
                          {rows.length === 0 ? 'No brands yet. Add your first one.' : 'No matches.'}
                        </td>
                      </tr>
                    ) : (
                      // An edit that changes the sorted column repositions the row,
                      // and one excluded by an active filter hides it — accepted,
                      // spreadsheet-style.
                      visibleRows.map((row, i) => (
                        <Fragment key={row.id}>
                          <tr className={i % 2 === 1 ? styles.rowEven : undefined}>
                            {COLUMNS.map((col) => renderCell(col, row))}
                            <td className={styles.actionsCell}>
                              {savingIds.has(row.id) && (
                                <span className={styles.savingSpinner} aria-label="Saving" />
                              )}
                              <button
                                className={`${styles.iconBtn} ${row.note ? styles.iconBtnAccent : ''} ${
                                  openNoteId === row.id ? styles.iconBtnActive : ''
                                }`}
                                onClick={() => setOpenNoteId((v) => (v === row.id ? null : row.id))}
                                aria-expanded={openNoteId === row.id}
                                title={row.note ? `Note: ${row.note}` : 'Add note'}
                                type="button"
                              >
                                <NoteIcon />
                              </button>
                              <button
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                onClick={() => removeRow(row)}
                                disabled={savingIds.has(row.id)}
                                title={`Delete ${row.brand}`}
                                type="button"
                              >
                                <TrashIcon />
                              </button>
                            </td>
                          </tr>
                          {openNoteId === row.id && renderNoteRow(row)}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
