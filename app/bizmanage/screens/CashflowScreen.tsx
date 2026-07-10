'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../bizmanage.module.css';
import { FinanceEntryRow, getFinanceEntries } from '@/lib/finance';
import { ScreenHead, formatMoney, monthKey, monthLabel } from './shared';

// Cashflow is derived entirely from the Income/Expenses ledger — it has no
// storage of its own.
export default function CashflowScreen() {
  const [rows, setRows] = useState<FinanceEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getFinanceEntries()
      .then(setRows)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load entries.'))
      .finally(() => setLoading(false));
  }, []);

  const months = useMemo(() => {
    const byMonth = new Map<string, { income: number; expenses: number }>();
    for (const r of rows) {
      const key = monthKey(r.entryDate);
      const bucket = byMonth.get(key) ?? { income: 0, expenses: 0 };
      if (r.kind === 'income') bucket.income += r.amount;
      else bucket.expenses += r.amount;
      byMonth.set(key, bucket);
    }
    let balance = 0;
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { income, expenses }]) => {
        const net = income - expenses;
        balance += net;
        return { key, income, expenses, net, balance };
      });
  }, [rows]);

  return (
    <>
      <ScreenHead title="Cashflow" meta="Derived from Income and Expenses entries" />

      {loadError && <p className={styles.error}>{loadError}</p>}

      {loading ? (
        <p className={styles.pageMeta}>Loading…</p>
      ) : months.length === 0 ? (
        <div className={styles.comingSoonCard}>
          <p>No finance entries yet — add income and expenses to see the cashflow.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Month</th>
                <th className={styles.numCol}>Income</th>
                <th className={styles.numCol}>Expenses</th>
                <th className={styles.numCol}>Net</th>
                <th className={styles.numCol}>Running balance</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.key}>
                  <td>{monthLabel(m.key)}</td>
                  <td className={styles.numCol}>{formatMoney(m.income)}</td>
                  <td className={styles.numCol}>{formatMoney(m.expenses)}</td>
                  <td className={`${styles.numCol} ${m.net >= 0 ? styles.moneyPositive : styles.moneyNegative}`}>
                    {formatMoney(m.net)}
                  </td>
                  <td
                    className={`${styles.numCol} ${
                      m.balance >= 0 ? styles.moneyPositive : styles.moneyNegative
                    }`}
                  >
                    {formatMoney(m.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
