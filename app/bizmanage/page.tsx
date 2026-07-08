'use client';

import { useState, useEffect, FormEvent } from 'react';
import styles from './bizmanage.module.css';

// --- Placeholder access gate ---------------------------------------------
// Client-side only — NOT real security. Swap for a real auth backend
// (e.g. Supabase) before this holds anything sensitive.
const ACCESS_EMAIL = 'admin@thebeautyboxmedia.com';
const ACCESS_PASSWORD = 'beautybox';
const SESSION_KEY = 'bizmanage:auth';

// Where brands added via the form are persisted so they survive a refresh.
// Only user-added brands are stored; the 58 seed rows always come from code, so
// updates to the seed still flow through. Swap for Supabase later.
const BRANDS_KEY = 'bizmanage:brands';

// --- Schema (mirrors the Supabase `brands` table) ------------------------
type Source = 'NRG/RMR' | 'TBB/TB';
type Registry = 'Yes' | 'No' | 'N/A';
type Status = 'Active' | 'Closing Out';
type Urgency = '' | 'High' | 'Medium' | 'Low';
type Owner = '' | 'BBMEDIA' | 'Regina' | 'Mariann';

interface BrandRow {
  id: number;
  brand: string;
  source: Source;
  brandRegistry: Registry;
  resellerType: string;
  numAsins: number | null;
  accountName: string;
  ownedBy: Owner;
  urgency: Urgency;
  priority: number | null;
  status: Status;
  estSow: string;
  note: string;
}

// Dropdown option lists. These mirror the values seeded into the Supabase
// `dropdown_options` table — once the app reads from Supabase, fetch them from
// there (`select value from dropdown_options where field = … and active`) so a
// new option added in the database shows up here without a code change.
const DROPDOWNS = {
  source: ['NRG/RMR', 'TBB/TB'] as Source[],
  brandRegistry: ['Yes', 'No', 'N/A'] as Registry[],
  resellerType: [
    'Exclusive',
    'Semi-Exclusive',
    'Pending Exclusive',
    'Reseller',
    'Exclusive for ASINs we create under Skin Revolution',
    'Created new ASINs under TBB Brand Registry',
    'Not specified',
  ],
  ownedBy: ['BBMEDIA', 'Regina', 'Mariann'] as Exclude<Owner, ''>[],
  urgency: ['High', 'Medium', 'Low'] as Exclude<Urgency, ''>[],
  status: ['Active', 'Closing Out'] as Status[],
};

// Seed rows: only the non-empty fields are listed; operational fields
// (# ASINs, account name, owner, urgency, priority, SOW) default to empty and
// are filled later. Mirror of supabase/seed.sql.
type SeedRow = {
  id: number;
  brand: string;
  source: Source;
  brandRegistry: Registry;
  resellerType: string;
  status: Status;
  note?: string;
};

const SEED: SeedRow[] = [
  { id: 1, brand: 'Ariston', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active' },
  { id: 2, brand: 'Baobab', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active', note: 'Affiliation not specified in source' },
  { id: 3, brand: 'Bodi Fresh', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active' },
  { id: 4, brand: 'Brandywine', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active' },
  { id: 5, brand: 'Demeter', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active' },
  { id: 6, brand: 'H-42', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive for ASINs we create under Skin Revolution', status: 'Active' },
  { id: 7, brand: 'Inglot', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active', note: 'Also on TBB/TB list (Semi-Exclusive)' },
  { id: 8, brand: 'Kitoko', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active' },
  { id: 9, brand: 'Leather Luster', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive for ASINs we create under Skin Revolution', status: 'Active' },
  { id: 10, brand: 'Midway', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active' },
  { id: 11, brand: 'Milagros', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive for ASINs we create under Skin Revolution', status: 'Active' },
  { id: 12, brand: 'Mina Brow', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active' },
  { id: 13, brand: 'Olé Capilar', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive for ASINs we create under Skin Revolution', status: 'Active' },
  { id: 14, brand: 'Ritual Botanico', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive for ASINs we create under Skin Revolution', status: 'Active' },
  { id: 15, brand: 'Scimera', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active', note: 'Also on TBB/TB list (Exclusive)' },
  { id: 16, brand: 'Sqwinchers', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active' },
  { id: 17, brand: 'Two Old Goats', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Reseller', status: 'Active' },
  { id: 18, brand: 'WPP', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active', note: 'Color mask variation only, for now' },
  { id: 19, brand: 'Y-Not Natural', source: 'NRG/RMR', brandRegistry: 'Yes', resellerType: 'Exclusive', status: 'Active', note: 'Need to determine if there is a path forward' },
  { id: 20, brand: 'Do/Mastey', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out' },
  { id: 21, brand: 'Glimmer Goddess', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out', note: 'Closing out on NRG; still active on TBB/TB' },
  { id: 22, brand: 'Kiara Sky', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out', note: 'Also closing out on TBB/TB' },
  { id: 23, brand: 'Life Factory', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out' },
  { id: 24, brand: 'Lineco', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out' },
  { id: 25, brand: 'Plantlife', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out' },
  { id: 26, brand: 'Saratoga Olive Oil Co', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out' },
  { id: 27, brand: 'Staleks', source: 'NRG/RMR', brandRegistry: 'No', resellerType: 'Not specified', status: 'Closing Out', note: 'Also closing out on TBB/TB' },
  { id: 28, brand: 'NutriRoot', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 29, brand: 'Cosmedica Skincare', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 30, brand: 'Chihtsai', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Pending Exclusive', status: 'Active' },
  { id: 31, brand: 'Eagle Fortress', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 32, brand: 'El Gallito Coffee', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 33, brand: 'French Farm', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Created new ASINs under TBB Brand Registry', status: 'Active' },
  { id: 34, brand: 'Glimmer Goddess', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 35, brand: 'Golden Rabbit', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active' },
  { id: 36, brand: 'Govino', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 37, brand: 'H2Pro', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 38, brand: 'Inglot', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active', note: 'Also on NRG list (Reseller)' },
  { id: 39, brand: 'Kai', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 40, brand: 'Le Blanc', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 41, brand: 'Lifefactory', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 42, brand: 'Lisap Haircare', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 43, brand: 'Mason Pearson', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 44, brand: 'Mizon', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active', note: 'Korean skincare · Shopify full SKU / Amazon all besides snail mucin' },
  { id: 45, brand: 'Nailplex Shield', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active' },
  { id: 46, brand: 'Nailtiques', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 47, brand: 'Orange Chronic', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Created new ASINs under TBB Brand Registry', status: 'Active' },
  { id: 48, brand: 'Redavid', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 49, brand: 'Restorsea', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active' },
  { id: 50, brand: 'Roxanne Rizzo', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active' },
  { id: 51, brand: 'Ruminae', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Pending Exclusive', status: 'Active' },
  { id: 52, brand: 'Scimera', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active', note: 'Also on NRG list (Exclusive)' },
  { id: 53, brand: 'Sonoma Syrup Co', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
  { id: 54, brand: 'The Balm Cosmetics', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Semi-Exclusive', status: 'Active' },
  { id: 55, brand: 'Three Lollies', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Not specified', status: 'Active' },
  { id: 56, brand: 'Toweldry', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Pending Exclusive', status: 'Active' },
  { id: 57, brand: 'Vivioptal', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Pending Exclusive', status: 'Active' },
  { id: 58, brand: 'Watercolors Haircare', source: 'TBB/TB', brandRegistry: 'N/A', resellerType: 'Exclusive', status: 'Active' },
];

const withDefaults = (r: SeedRow): BrandRow => ({
  numAsins: null,
  accountName: '',
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
  source: Source;
  brandRegistry: Registry;
  resellerType: string;
  numAsins: string;
  accountName: string;
  ownedBy: Owner;
  urgency: Urgency;
  priority: string;
  status: Status;
  estSow: string;
  note: string;
}

const blankDraft = (): Draft => ({
  brand: '',
  source: 'NRG/RMR',
  brandRegistry: 'Yes',
  resellerType: 'Exclusive',
  numAsins: '',
  accountName: '',
  ownedBy: '',
  urgency: '',
  priority: '',
  status: 'Active',
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
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [formError, setFormError] = useState('');

  // Restore a remembered session on load.
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1') {
      setAuthed(true);
    }
  }, []);

  // Rehydrate brands added in a previous session (kept in localStorage until
  // Supabase is wired). Runs after mount so the server/initial render matches.
  useEffect(() => {
    if (typeof window === 'undefined') return;
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

  // Persist a new brand. For now it updates state and mirrors user-added brands
  // to localStorage so they survive a refresh. TODO(supabase): replace the body
  // with `await supabase.from('brands').insert(row)` then refetch — kept
  // isolated so wiring Supabase is a one-function change.
  const saveBrand = (row: BrandRow) => {
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
    setDraft(blankDraft());
    setFormError('');
    setShowForm(true);
  };

  const submitForm = (e: FormEvent) => {
    e.preventDefault();

    if (!draft.brand.trim()) {
      setFormError('Brand name is required.');
      return;
    }
    const num = draft.numAsins.trim();
    if (num !== '' && (!/^\d+$/.test(num) || Number(num) < 0)) {
      setFormError('# ASINs must be a whole number (0 or more).');
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

    const nextId = rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    saveBrand({
      id: nextId,
      brand: draft.brand.trim(),
      source: draft.source,
      brandRegistry: draft.brandRegistry,
      resellerType: draft.resellerType,
      numAsins: num === '' ? null : Number(num),
      accountName: draft.accountName.trim(),
      ownedBy: draft.ownedBy,
      urgency: draft.urgency,
      priority: pri === '' ? null : Number(pri),
      status: draft.status,
      estSow: draft.estSow.trim(),
      note: draft.note.trim(),
    });
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
            <p className={styles.pageMeta}>{rows.length} brands</p>
          </div>
          <button className={`btn btn-primary ${styles.addBtn}`} onClick={openForm}>
            <span className={styles.plus} aria-hidden="true">+</span> Add brand
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Account</th>
                <th>Brand Registry</th>
                <th>Reseller Type</th>
                <th className={styles.numCol}># ASINs</th>
                <th>Account Name</th>
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
                  <td><span className={styles.tag}>{row.source}</span></td>
                  <td>{row.brandRegistry}</td>
                  <td>{row.resellerType}</td>
                  <td className={styles.numCol}>{dash(row.numAsins)}</td>
                  <td>{dash(row.accountName)}</td>
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
                <span className={styles.label}>Account</span>
                <select className={styles.select} value={draft.source} onChange={(e) => set('source', e.target.value as Source)}>
                  {DROPDOWNS.source.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Brand Registry</span>
                <select className={styles.select} value={draft.brandRegistry} onChange={(e) => set('brandRegistry', e.target.value as Registry)}>
                  {DROPDOWNS.brandRegistry.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>

              <label className={`${styles.field} ${styles.full}`}>
                <span className={styles.label}>Reseller Type</span>
                <select className={styles.select} value={draft.resellerType} onChange={(e) => set('resellerType', e.target.value)}>
                  {DROPDOWNS.resellerType.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}># ASINs</span>
                <input
                  className={styles.input}
                  value={draft.numAsins}
                  onChange={(e) => set('numAsins', e.target.value)}
                  inputMode="numeric"
                  placeholder="optional"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Account Name</span>
                <input
                  className={styles.input}
                  value={draft.accountName}
                  onChange={(e) => set('accountName', e.target.value)}
                  placeholder="optional"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Owned By</span>
                <select className={styles.select} value={draft.ownedBy} onChange={(e) => set('ownedBy', e.target.value as Owner)}>
                  <option value="">— Unassigned</option>
                  {DROPDOWNS.ownedBy.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Urgency</span>
                <select className={styles.select} value={draft.urgency} onChange={(e) => set('urgency', e.target.value as Urgency)}>
                  <option value="">— None</option>
                  {DROPDOWNS.urgency.map((o) => <option key={o} value={o}>{o}</option>)}
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
                <select className={styles.select} value={draft.status} onChange={(e) => set('status', e.target.value as Status)}>
                  {DROPDOWNS.status.map((o) => <option key={o} value={o}>{o}</option>)}
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
              <button type="submit" className={`btn btn-primary ${styles.saveBtn}`}>
                Add brand
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
