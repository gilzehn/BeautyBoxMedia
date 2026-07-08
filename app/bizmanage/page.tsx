'use client';

import { useState, useEffect, FormEvent } from 'react';
import styles from './bizmanage.module.css';
import { supabase } from '@/lib/supabase';

// --- Placeholder access gate ---------------------------------------------
// Client-side only — NOT real security. Swap for a real auth backend
// (e.g. Supabase) before this holds anything sensitive.
const ACCESS_EMAIL = 'admin@thebeautyboxmedia.com';
const ACCESS_PASSWORD = 'beautybox';
const SESSION_KEY = 'bizmanage:auth';

// Offline fallback only (used when Supabase env vars are missing): brands
// added via the form are mirrored to localStorage so they survive a refresh.
// When Supabase is configured, the database is the store and this is unused.
const BRANDS_KEY = 'bizmanage:brands';

// --- Schema (mirrors the Supabase `brands` table) ------------------------
// Dropdown-driven fields are plain strings: their allowed values live in the
// dropdown_options table, not in code.
interface BrandRow {
  id: number;
  brand: string;
  accountName: string;
  brandRegistry: string;
  resellerType: string;
  numAsins: string;
  ownedBy: string;
  urgency: string;
  priority: number | null;
  status: string;
  estSow: string;
  note: string;
}

// A public.brands row as Supabase returns it (snake_case).
interface DbBrand {
  id: number;
  brand: string;
  account_name: string;
  brand_registry: string;
  reseller_type: string;
  num_asins: string;
  owned_by: string;
  urgency: string;
  priority: number | null;
  status: string;
  est_sow: string;
  note: string;
}

const fromDb = (r: DbBrand): BrandRow => ({
  id: r.id,
  brand: r.brand,
  accountName: r.account_name,
  brandRegistry: r.brand_registry,
  resellerType: r.reseller_type,
  numAsins: r.num_asins,
  ownedBy: r.owned_by,
  urgency: r.urgency,
  priority: r.priority,
  status: r.status,
  estSow: r.est_sow,
  note: r.note,
});

const toDb = (r: Omit<BrandRow, 'id'>): Omit<DbBrand, 'id'> => ({
  brand: r.brand,
  account_name: r.accountName,
  brand_registry: r.brandRegistry,
  reseller_type: r.resellerType,
  num_asins: r.numAsins,
  owned_by: r.ownedBy,
  urgency: r.urgency,
  priority: r.priority,
  status: r.status,
  est_sow: r.estSow,
  note: r.note,
});

// dropdown_options.field (snake_case) -> UI key.
const FIELD_KEYS = {
  account_name: 'accountName',
  brand_registry: 'brandRegistry',
  reseller_type: 'resellerType',
  owned_by: 'ownedBy',
  urgency: 'urgency',
  status: 'status',
} as const;
type DropdownKey = (typeof FIELD_KEYS)[keyof typeof FIELD_KEYS];
type Dropdowns = Record<DropdownKey, string[]>;

// Fallback dropdown lists, used until the live ones load (and as the offline
// default). The live lists come from the dropdown_options table — add a row
// there and it shows up here with no code change.
const DEFAULT_DROPDOWNS: Dropdowns = {
  accountName: ['NRG', 'RMR', 'TBB', 'TB'],
  brandRegistry: ['Yes', 'No', 'N/A'],
  resellerType: [
    'Exclusive',
    'Semi-Exclusive',
    'Pending Exclusive',
    'Reseller',
    'Exclusive under Skin Revolution',
    'Not specified',
  ],
  ownedBy: ['BBMEDIA', 'Regina', 'Mariann'],
  urgency: ['High', 'Medium', 'Low'],
  status: ['Active', 'Closing Out'],
};

// Seed rows: only the non-empty fields are listed; operational fields
// (# ASINs, account name, owner, urgency, priority, SOW) default to empty and
// are filled later. Mirror of supabase/seed.sql.
type SeedRow = {
  id: number;
  brand: string;
  accountName: string;
  brandRegistry: string;
  resellerType: string;
  status: string;
  note?: string;
};

const SEED: SeedRow[] = [
  { id: 1, brand: 'Ariston', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active' },
  { id: 2, brand: 'Baobab', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active', note: 'Affiliation not specified in source' },
  { id: 3, brand: 'Bodi Fresh', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active' },
  { id: 4, brand: 'Brandywine', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active' },
  { id: 5, brand: 'Demeter', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active' },
  { id: 6, brand: 'H-42', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive under Skin Revolution', status: 'Active' },
  { id: 7, brand: 'Inglot', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active', note: 'Also on TBB/TB list (Semi-Exclusive)' },
  { id: 8, brand: 'Kitoko', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active' },
  { id: 9, brand: 'Leather Luster', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive under Skin Revolution', status: 'Active' },
  { id: 10, brand: 'Midway', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active' },
  { id: 11, brand: 'Milagros', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive under Skin Revolution', status: 'Active' },
  { id: 12, brand: 'Mina Brow', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active' },
  { id: 13, brand: 'Olé Capilar', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive under Skin Revolution', status: 'Active' },
  { id: 14, brand: 'Ritual Botanico', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive under Skin Revolution', status: 'Active' },
  { id: 15, brand: 'Scimera', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active', note: 'Also on TBB/TB list (Exclusive)' },
  { id: 16, brand: 'Sqwinchers', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active' },
  { id: 17, brand: 'Two Old Goats', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active' },
  { id: 18, brand: 'WPP', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active', note: 'Color mask variation only, for now' },
  { id: 19, brand: 'Y-Not Natural', accountName: 'NRG', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active', note: 'Need to determine if there is a path forward' },
  { id: 20, brand: 'Do/Mastey', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out' },
  { id: 21, brand: 'Glimmer Goddess', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out', note: 'Closing out on NRG; still active on TBB/TB' },
  { id: 22, brand: 'Kiara Sky', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out', note: 'Also closing out on TBB/TB' },
  { id: 23, brand: 'Life Factory', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out' },
  { id: 24, brand: 'Lineco', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out' },
  { id: 25, brand: 'Plantlife', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out' },
  { id: 26, brand: 'Saratoga Olive Oil Co', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out' },
  { id: 27, brand: 'Staleks', accountName: 'NRG', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out', note: 'Also closing out on TBB/TB' },
  { id: 28, brand: 'NutriRoot', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 29, brand: 'Cosmedica Skincare', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 30, brand: 'Chihtsai', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Pending Exclusive', status: 'Active' },
  { id: 31, brand: 'Eagle Fortress', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 32, brand: 'El Gallito Coffee', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 33, brand: 'French Farm', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 34, brand: 'Glimmer Goddess', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 35, brand: 'Golden Rabbit', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active' },
  { id: 36, brand: 'Govino', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 37, brand: 'H2Pro', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 38, brand: 'Inglot', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active', note: 'Also on NRG list (Reseller)' },
  { id: 39, brand: 'Kai', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 40, brand: 'Le Blanc', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 41, brand: 'Lifefactory', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 42, brand: 'Lisap Haircare', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 43, brand: 'Mason Pearson', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 44, brand: 'Mizon', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active', note: 'Korean skincare · Shopify full SKU / Amazon all besides snail mucin' },
  { id: 45, brand: 'Nailplex Shield', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active' },
  { id: 46, brand: 'Nailtiques', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 47, brand: 'Orange Chronic', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 48, brand: 'Redavid', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 49, brand: 'Restorsea', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active' },
  { id: 50, brand: 'Roxanne Rizzo', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active' },
  { id: 51, brand: 'Ruminae', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Pending Exclusive', status: 'Active' },
  { id: 52, brand: 'Scimera', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active', note: 'Also on NRG list (Exclusive)' },
  { id: 53, brand: 'Sonoma Syrup Co', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 54, brand: 'The Balm Cosmetics', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active' },
  { id: 55, brand: 'Three Lollies', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 56, brand: 'Toweldry', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Pending Exclusive', status: 'Active' },
  { id: 57, brand: 'Vivioptal', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Pending Exclusive', status: 'Active' },
  { id: 58, brand: 'Watercolors Haircare', accountName: 'TBB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
];

const withDefaults = (r: SeedRow): BrandRow => ({
  numAsins: '',
  ownedBy: '',
  urgency: '',
  priority: null,
  estSow: '',
  note: '',
  ...r,
});

const INITIAL_ROWS: BrandRow[] = SEED.map(withDefaults);

// --- Add-brand form draft ------------------------------------------------
interface Draft {
  brand: string;
  accountName: string;
  brandRegistry: string;
  resellerType: string;
  numAsins: string;
  ownedBy: string;
  urgency: string;
  priority: string;
  status: string;
  estSow: string;
  note: string;
}

const blankDraft = (d: Dropdowns): Draft => ({
  brand: '',
  accountName: d.accountName[0] ?? '',
  brandRegistry: d.brandRegistry[0] ?? '',
  resellerType: d.resellerType[0] ?? '',
  numAsins: '',
  ownedBy: '',
  urgency: '',
  priority: '',
  status: d.status[0] ?? 'Active',
  estSow: '',
  note: '',
});

const dash = (v: string | number | null) =>
  v === null || v === '' ? <span className={styles.dash}>—</span> : v;

export default function BizManagePage() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [rows, setRows] = useState<BrandRow[]>(INITIAL_ROWS);
  const [dropdowns, setDropdowns] = useState<Dropdowns>(DEFAULT_DROPDOWNS);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => blankDraft(DEFAULT_DROPDOWNS));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Restore a remembered session on load.
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1') {
      setAuthed(true);
    }
  }, []);

  // Offline fallback: rehydrate locally-added brands. Runs after mount so the
  // server/initial render matches. Skipped entirely when Supabase is live.
  useEffect(() => {
    if (supabase || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(BRANDS_KEY);
      if (!raw) return;
      const added = JSON.parse(raw) as BrandRow[];
      if (Array.isArray(added) && added.length) {
        setRows([...added, ...INITIAL_ROWS]);
      }
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  // Live data: once signed in, load brands and dropdown option lists from
  // Supabase. The seed rows render until this resolves.
  useEffect(() => {
    if (!authed || !supabase) return;
    const sb = supabase;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      // Don't spin forever if the network blackholes the request.
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timed out after 10s — check your network and keys')), 10_000);
      });
      try {
        const [brandsRes, optionsRes] = await Promise.race([
          Promise.all([
            sb.from('brands').select('*').order('id'),
            sb
              .from('dropdown_options')
              .select('field,value,sort_order')
              .eq('active', true)
              .order('sort_order'),
          ]),
          timeout,
        ]);
        if (cancelled) return;
        if (brandsRes.error || optionsRes.error) {
          setLoadError(
            `Could not load from Supabase: ${(brandsRes.error ?? optionsRes.error)!.message}`,
          );
        } else {
          setRows((brandsRes.data as DbBrand[]).map(fromDb));
          const live: Partial<Dropdowns> = {};
          for (const o of optionsRes.data as { field: string; value: string }[]) {
            const key = FIELD_KEYS[o.field as keyof typeof FIELD_KEYS];
            if (key) (live[key] ??= []).push(o.value);
          }
          setDropdowns({ ...DEFAULT_DROPDOWNS, ...live });
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          `Could not load from Supabase: ${err instanceof Error ? err.message : String(err)} — showing built-in seed data.`,
        );
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authed]);

  // Close the form on Escape.
  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowForm(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm]);

  const handleSignIn = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === ACCESS_EMAIL && password === ACCESS_PASSWORD) {
      setAuthed(true);
      setError('');
      setPassword('');
      if (typeof window !== 'undefined') sessionStorage.setItem(SESSION_KEY, '1');
    } else {
      setError('Incorrect email or password.');
    }
  };

  const handleSignOut = () => {
    setAuthed(false);
    setEmail('');
    setPassword('');
    if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_KEY);
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Offline fallback: keep the new brand in state + localStorage. The live
  // path inserts into Supabase inside submitForm instead.
  const saveBrandLocal = (row: BrandRow) => {
    setRows((prev) => [row, ...prev]);
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(BRANDS_KEY);
      const added = raw ? (JSON.parse(raw) as BrandRow[]) : [];
      localStorage.setItem(BRANDS_KEY, JSON.stringify([row, ...added]));
    } catch {
      /* ignore storage write failures (e.g. private mode) */
    }
  };

  const openForm = () => {
    setDraft(blankDraft(dropdowns));
    setFormError('');
    setShowForm(true);
  };

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();

    if (!draft.brand.trim()) {
      setFormError('Brand name is required.');
      return;
    }
    const pri = draft.priority.trim();
    if (pri !== '' && (!/^\d+$/.test(pri) || Number(pri) < 1 || Number(pri) > 30)) {
      setFormError('Priority must be a whole number from 1 to 30.');
      return;
    }
    if (pri !== '' && rows.some((r) => r.priority === Number(pri))) {
      setFormError(`Priority ${pri} is already used by another brand.`);
      return;
    }

    const newBrand: Omit<BrandRow, 'id'> = {
      brand: draft.brand.trim(),
      accountName: draft.accountName,
      brandRegistry: draft.brandRegistry,
      resellerType: draft.resellerType,
      numAsins: draft.numAsins.trim(),
      ownedBy: draft.ownedBy,
      urgency: draft.urgency,
      priority: pri === '' ? null : Number(pri),
      status: draft.status,
      estSow: draft.estSow.trim(),
      note: draft.note.trim(),
    };

    if (supabase) {
      // Live path: the database assigns the id and enforces the dropdown +
      // priority rules; surface any rejection inline.
      setSaving(true);
      const { data, error: insertError } = await supabase
        .from('brands')
        .insert(toDb(newBrand))
        .select()
        .single();
      setSaving(false);
      if (insertError) {
        setFormError(insertError.message);
        return;
      }
      setRows((prev) => [fromDb(data as DbBrand), ...prev]);
    } else {
      const nextId = rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
      saveBrandLocal({ id: nextId, ...newBrand });
    }
    setShowForm(false);
  };

  if (!authed) {
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

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={`btn btn-primary ${styles.submit}`}>
            Sign in
          </button>
        </form>
      </div>
    );
  }

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
          <div>
            <h2 className={styles.pageTitle}>Brand Accounts</h2>
            <p className={styles.pageMeta}>
              {loading
                ? 'Loading from Supabase…'
                : `${rows.length} brands · ${supabase ? 'live — Supabase' : 'offline — seed data'}`}
            </p>
          </div>
          <button className={`btn btn-primary ${styles.addBtn}`} onClick={openForm}>
            <span className={styles.plus} aria-hidden="true">+</span> Add brand
          </button>
        </div>

        {loadError && <p className={styles.error}>{loadError}</p>}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Account Name</th>
                <th>Brand Registry</th>
                <th>Reseller Type</th>
                <th># ASINs</th>
                <th>Owned By</th>
                <th>Urgency</th>
                <th className={styles.numCol}>Priority</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={styles.strong}>{row.brand}</td>
                  <td><span className={styles.tag}>{row.accountName}</span></td>
                  <td>{row.brandRegistry}</td>
                  <td>{row.resellerType}</td>
                  <td>{dash(row.numAsins)}</td>
                  <td>{dash(row.ownedBy)}</td>
                  <td>
                    {row.urgency
                      ? <span className={`${styles.pill} ${styles[`level${row.urgency}`]}`}>{row.urgency}</span>
                      : <span className={styles.dash}>—</span>}
                  </td>
                  <td className={styles.numCol}>{dash(row.priority)}</td>
                  <td>
                    <span className={`${styles.pill} ${row.status === 'Active' ? styles.statusActive : styles.statusClosing}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className={styles.noteCell}>{dash(row.note)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {showForm && (
        <div
          className={styles.overlay}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <form className={styles.modal} onSubmit={submitForm}>
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>Add brand</h3>
              <button
                type="button"
                className={styles.close}
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={styles.formGrid}>
              <label className={`${styles.field} ${styles.full}`}>
                <span className={styles.label}>Brand <span className={styles.req}>*</span></span>
                <input
                  className={styles.input}
                  value={draft.brand}
                  onChange={(e) => set('brand', e.target.value)}
                  placeholder="e.g. Ariston"
                  autoFocus
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Account Name</span>
                <select className={styles.select} value={draft.accountName} onChange={(e) => set('accountName', e.target.value)}>
                  {dropdowns.accountName.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Brand Registry</span>
                <select className={styles.select} value={draft.brandRegistry} onChange={(e) => set('brandRegistry', e.target.value)}>
                  {dropdowns.brandRegistry.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>

              <label className={`${styles.field} ${styles.full}`}>
                <span className={styles.label}>Reseller Type</span>
                <select className={styles.select} value={draft.resellerType} onChange={(e) => set('resellerType', e.target.value)}>
                  {dropdowns.resellerType.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}># ASINs</span>
                <input
                  className={styles.input}
                  value={draft.numAsins}
                  onChange={(e) => set('numAsins', e.target.value)}
                  placeholder="optional"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Owned By</span>
                <select className={styles.select} value={draft.ownedBy} onChange={(e) => set('ownedBy', e.target.value)}>
                  <option value="">— Unassigned</option>
                  {dropdowns.ownedBy.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Urgency</span>
                <select className={styles.select} value={draft.urgency} onChange={(e) => set('urgency', e.target.value)}>
                  <option value="">— None</option>
                  {dropdowns.urgency.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Priority</span>
                <input
                  className={styles.input}
                  value={draft.priority}
                  onChange={(e) => set('priority', e.target.value)}
                  inputMode="numeric"
                  placeholder="1–30, optional"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Status</span>
                <select className={styles.select} value={draft.status} onChange={(e) => set('status', e.target.value)}>
                  {dropdowns.status.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>

              <label className={`${styles.field} ${styles.full}`}>
                <span className={styles.label}>Est. SOW</span>
                <input
                  className={styles.input}
                  value={draft.estSow}
                  onChange={(e) => set('estSow', e.target.value)}
                  placeholder="optional"
                />
              </label>

              <label className={`${styles.field} ${styles.full}`}>
                <span className={styles.label}>Note</span>
                <textarea
                  className={styles.textarea}
                  value={draft.note}
                  onChange={(e) => set('note', e.target.value)}
                  rows={2}
                  placeholder="optional"
                />
              </label>
            </div>

            {formError && <p className={styles.error}>{formError}</p>}

            <div className={styles.formActions}>
              <button type="button" className={`btn btn-outline ${styles.cancelBtn}`} onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className={`btn btn-primary ${styles.saveBtn}`} disabled={saving}>
                {saving ? 'Adding…' : 'Add brand'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
