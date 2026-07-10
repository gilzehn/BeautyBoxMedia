'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../bizmanage.module.css';
import { FinanceEntryRow, getFinanceEntries } from '@/lib/finance';
import { CopyButton, ScreenHead, formatMoney, monthKey, monthLabel, uniq } from './shared';

// P&L statement computed from the Income/Expenses ledger for a month range.
export default function ProfitLossScreen() {
  const [rows, setRows] = useState<FinanceEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [from, setFrom] = useState(''); // '' = earliest
  const [to, setTo] = useState(''); // '' = latest

  useEffect(() => {
    getFinanceEntries()
      .then(setRows)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load entries.'))
      .finally(() => setLoading(false));
  }, []);

  const monthsPresent = useMemo(() => uniq(rows.map((r) => monthKey(r.entryDate))).sort(), [rows]);

  const statement = useMemo(() => {
    const inRange = rows.filter((r) => {
      const m = monthKey(r.entryDate);
      if (from && m < from) return false;
      if (to && m > to) return false;
      return true;
    });
    const sumByCategory = (kind: 'income' | 'expense') => {
      const map = new Map<string, number>();
      for (const r of inRange) {
        if (r.kind !== kind) continue;
        const cat = r.category || 'Uncategorized';
        map.set(cat, (map.get(cat) ?? 0) + r.amount);
      }
      return [...map.entries()].sort((a, b) => b[1] - a[1]);
    };
    const income = sumByCategory('income');
    const expenses = sumByCategory('expense');
    const totalIncome = income.reduce((s, [, v]) => s + v, 0);
    const totalExpenses = expenses.reduce((s, [, v]) => s + v, 0);
    return { income, expenses, totalIncome, totalExpenses, net: totalIncome - totalExpenses };
  }, [rows, from, to]);

  const rangeLabel = `${from ? monthLabel(from) : monthsPresent[0] ? monthLabel(monthsPresent[0]) : '—'} – ${
    to ? monthLabel(to) : monthsPresent.at(-1) ? monthLabel(monthsPresent.at(-1)!) : '—'
  }`;

  const plainText = [
    `Profit & Loss — ${rangeLabel}`,
    '',
    'Income',
    ...statement.income.map(([cat, v]) => `  ${cat}: ${formatMoney(v)}`),
    `  Total income: ${formatMoney(statement.totalIncome)}`,
    '',
    'Expenses',
    ...statement.expenses.map(([cat, v]) => `  ${cat}: ${formatMoney(v)}`),
    `  Total expenses: ${formatMoney(statement.totalExpenses)}`,
    '',
    `Net profit: ${formatMoney(statement.net)}`,
  ].join('\n');

  return (
    <>
      <ScreenHead title="Profit and Loss" meta="Derived from Income and Expenses entries" />

      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <select
            className={styles.searchInput}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="From month"
          >
            <option value="">From: earliest</option>
            {monthsPresent.map((m) => (
              <option key={m} value={m}>
                From: {monthLabel(m)}
              </option>
            ))}
          </select>
          <select
            className={styles.searchInput}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="To month"
          >
            <option value="">To: latest</option>
            {monthsPresent.map((m) => (
              <option key={m} value={m}>
                To: {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <CopyButton text={plainText} label="Copy statement" />
      </div>

      {loadError && <p className={styles.error}>{loadError}</p>}

      {loading ? (
        <p className={styles.pageMeta}>Loading…</p>
      ) : rows.length === 0 ? (
        <div className={styles.comingSoonCard}>
          <p>No finance entries yet — add income and expenses to build the statement.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              <tr className={styles.statementSection}>
                <td colSpan={2}>Income</td>
              </tr>
              {statement.income.length === 0 ? (
                <tr>
                  <td className={styles.muted}>No income in this period</td>
                  <td className={styles.numCol}>{formatMoney(0)}</td>
                </tr>
              ) : (
                statement.income.map(([cat, v]) => (
                  <tr key={`in-${cat}`}>
                    <td>{cat}</td>
                    <td className={styles.numCol}>{formatMoney(v)}</td>
                  </tr>
                ))
              )}
              <tr className={styles.totalsRow}>
                <td>Total income</td>
                <td className={styles.numCol}>{formatMoney(statement.totalIncome)}</td>
              </tr>

              <tr className={styles.statementSection}>
                <td colSpan={2}>Expenses</td>
              </tr>
              {statement.expenses.length === 0 ? (
                <tr>
                  <td className={styles.muted}>No expenses in this period</td>
                  <td className={styles.numCol}>{formatMoney(0)}</td>
                </tr>
              ) : (
                statement.expenses.map(([cat, v]) => (
                  <tr key={`ex-${cat}`}>
                    <td>{cat}</td>
                    <td className={styles.numCol}>{formatMoney(v)}</td>
                  </tr>
                ))
              )}
              <tr className={styles.totalsRow}>
                <td>Total expenses</td>
                <td className={styles.numCol}>{formatMoney(statement.totalExpenses)}</td>
              </tr>

              <tr className={`${styles.totalsRow} ${styles.netRow}`}>
                <td>Net profit</td>
                <td
                  className={`${styles.numCol} ${
                    statement.net >= 0 ? styles.moneyPositive : styles.moneyNegative
                  }`}
                >
                  {formatMoney(statement.net)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
