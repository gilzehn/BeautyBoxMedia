'use client';

import { useState, useEffect, FormEvent } from 'react';
import styles from './bizmanage.module.css';

// --- Placeholder access gate ---------------------------------------------
// Client-side only — NOT real security. Swap for a real auth backend
// (e.g. Supabase) before this holds anything sensitive.
const ACCESS_EMAIL = 'admin@thebeautyboxmedia.com';
const ACCESS_PASSWORD = 'beautybox';
const SESSION_KEY = 'bizmanage:auth';

type Level = 'High' | 'Medium' | 'Low';

interface BrandRow {
  brand: string;
  registry: string;
  resellerType: string;
  asins: number;
  accountName: string;
  ownedBy: string;
  urgency: Level;
  priority: Level;
}

// Seed rows so the table layout is visible. Replace with live data later.
const ROWS: BrandRow[] = [
  { brand: 'Cosmedica', registry: 'Approved', resellerType: '1P', asins: 42, accountName: 'Cosmedica Skincare', ownedBy: 'Regina', urgency: 'High', priority: 'High' },
  { brand: 'Glimmer Goddess', registry: 'Approved', resellerType: '3P', asins: 18, accountName: 'Glimmer Goddess LLC', ownedBy: 'Mariann', urgency: 'Medium', priority: 'High' },
  { brand: 'Kai', registry: 'Pending', resellerType: '3P', asins: 7, accountName: 'Kai Fragrance', ownedBy: 'Regina', urgency: 'High', priority: 'Medium' },
  { brand: 'LifeFactory', registry: 'Approved', resellerType: 'Hybrid', asins: 63, accountName: 'LifeFactory Inc.', ownedBy: 'Mariann', urgency: 'Low', priority: 'Medium' },
  { brand: 'Water Colors', registry: 'Not Enrolled', resellerType: '3P', asins: 5, accountName: 'Water Colors Beauty', ownedBy: 'Regina', urgency: 'Medium', priority: 'Low' },
  { brand: 'Nina Ibrow', registry: 'Approved', resellerType: '1P', asins: 24, accountName: 'Nina Ibrow Studio', ownedBy: 'Mariann', urgency: 'Low', priority: 'Low' },
  { brand: 'Brush Clean Pro', registry: 'Pending', resellerType: '3P', asins: 11, accountName: 'Brush Clean Pro', ownedBy: 'Regina', urgency: 'High', priority: 'High' },
  { brand: 'Demeter', registry: 'Approved', resellerType: 'Hybrid', asins: 88, accountName: 'Demeter Fragrance Library', ownedBy: 'Mariann', urgency: 'Medium', priority: 'Medium' },
];

export default function BizManagePage() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Restore a remembered session on load.
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1') {
      setAuthed(true);
    }
  }, []);

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
          <h2 className={styles.pageTitle}>Brand Accounts</h2>
          <p className={styles.pageMeta}>{ROWS.length} brands</p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Brand Registry</th>
                <th>Reseller Type</th>
                <th className={styles.numCol}># ASINs</th>
                <th>Account Name</th>
                <th>Owned By</th>
                <th>Urgency</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.brand}>
                  <td className={styles.strong}>{row.brand}</td>
                  <td>{row.registry}</td>
                  <td>{row.resellerType}</td>
                  <td className={styles.numCol}>{row.asins}</td>
                  <td>{row.accountName}</td>
                  <td>{row.ownedBy}</td>
                  <td><span className={`${styles.pill} ${styles[`level${row.urgency}`]}`}>{row.urgency}</span></td>
                  <td><span className={`${styles.pill} ${styles[`level${row.priority}`]}`}>{row.priority}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
