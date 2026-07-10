'use client';

import { Fragment, useEffect, useMemo, useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import {
  FinanceEntryRow,
  FinanceEntryInput,
  FinanceKind,
  getFinanceEntries,
  addFinanceEntry,
  updateFinanceEntry,
  deleteFinanceEntry,
} from '@/lib/finance';
import { FilterMulti, NoteIcon, TrashIcon, ScreenHead, formatMoney, monthKey, monthLabel, uniq } from './shared';

const todayIso = () => new Date().toISOString().slice(0, 10);

// One screen serves both ledgers: page.tsx renders it with kind="income" for
// the Income view and kind="expense" for Expenses (keyed, so it remounts).
export default function FinanceScreen({
  kind,
  options,
  onAddOption,
}: {
  kind: FinanceKind;
  options: Record<string, string[]>;
  onAddOption: (field: string, value: string) => Promise<void>;
}) {
  const categoryField = kind === 'income' ? 'income_category' : 'expense_category';
  const title = kind === 'income' ? 'Income' : 'Expenses';

  const [rows, setRows] = useState<FinanceEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);

  const [month, setMonth] = useState(''); // '' = all months
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<FinanceEntryInput>({
    kind,
    entryDate: todayIso(),
    description: '',
    category: '',
    amount: 0,
    account: '',
    note: '',
  });
  const [draftAmount, setDraftAmount] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getFinanceEntries(kind)
      .then(setRows)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load entries.'))
      .finally(() => setLoading(false));
  }, [kind]);

  const categoryValues = uniq([...(options[categoryField] ?? []), ...rows.map((r) => r.category)]).filter(Boolean);
  const monthsPresent = uniq(rows.map((r) => monthKey(r.entryDate))).sort().reverse();

  const counts = useMemo(() => {
    const category = new Map<string, number>();
    for (const r of rows) {
      if (r.category) category.set(r.category, (category.get(r.category) ?? 0) + 1);
    }
    return category;
  }, [rows]);

  const visible = useMemo(
    () =>
      rows.filter((r) => {
        if (month && monthKey(r.entryDate) !== month) return false;
        if (categoryFilter.length > 0 && !categoryFilter.includes(r.category)) return false;
        return true;
      }),
    [rows, month, categoryFilter]
  );

  const visibleTotal = visible.reduce((sum, r) => sum + r.amount, 0);

  const setSaving = (id: number, on: boolean) =>
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const patch = async (row: FinanceEntryRow, changes: Partial<FinanceEntryInput>) => {
    setSaveError('');
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...changes } : r)));
    setSaving(row.id, true);
    try {
      const saved = await updateFinanceEntry(row.id, changes);
      setRows((prev) => prev.map((r) => (r.id === row.id ? saved : r)));
    } catch (err) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
      setSaveError(`Couldn't save the entry: ${err instanceof Error ? err.message : 'save failed'}`);
    } finally {
      setSaving(row.id, false);
    }
  };

  const handleCategory = async (row: FinanceEntryRow, raw: string) => {
    if (raw !== '__add_new__') {
      patch(row, { category: raw });
      return;
    }
    const entered = window.prompt('Add a new category:')?.trim();
    if (!entered) return;
    patch(row, { category: entered });
    try {
      await onAddOption(categoryField, entered);
    } catch {
      setSaveError(`"${entered}" is saved on this entry, but adding it as a reusable category failed.`);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(draftAmount.replace(/[$,]/g, ''));
    if (Number.isNaN(amount)) return;
    setCreating(true);
    setSaveError('');
    try {
      const created = await addFinanceEntry({ ...draft, kind, amount });
      setRows((prev) => [created, ...prev]);
      setDraft({ kind, entryDate: todayIso(), description: '', category: '', amount: 0, account: '', note: '' });
      setDraftAmount('');
      setAddOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to add the entry.');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (row: FinanceEntryRow) => {
    if (!window.confirm(`Delete this ${kind} entry (${formatMoney(row.amount)})?`)) return;
    setSaveError('');
    try {
      await deleteFinanceEntry(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  return (
    <>
      <ScreenHead
        title={title}
        meta={loading ? undefined : `${visible.length} entries · ${formatMoney(visibleTotal)}`}
      />

      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <select
            className={styles.searchInput}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Month"
          >
            <option value="">All months</option>
            {monthsPresent.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
          <FilterMulti
            label="Category"
            values={categoryValues}
            counts={counts}
            selected={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>
        <button className={`btn btn-primary ${styles.addBtn}`} onClick={() => setAddOpen((o) => !o)} type="button">
          + Add entry
        </button>
      </div>

      {addOpen && (
        <form className={styles.inlineAdd} onSubmit={handleAdd}>
          <input
            className={styles.input}
            type="date"
            value={draft.entryDate}
            onChange={(e) => setDraft((d) => ({ ...d, entryDate: e.target.value }))}
            aria-label="Date"
            required
          />
          <input
            className={styles.input}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Description"
            autoFocus
            required
          />
          <select
            className={styles.input}
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            aria-label="Category"
          >
            <option value="">Category…</option>
            {categoryValues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            type="text"
            inputMode="decimal"
            value={draftAmount}
            onChange={(e) => setDraftAmount(e.target.value)}
            placeholder="Amount ($)"
            aria-label="Amount"
            required
          />
          <input
            className={styles.input}
            value={draft.account}
            onChange={(e) => setDraft((d) => ({ ...d, account: e.target.value }))}
            placeholder="Account (optional)"
          />
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Adding…' : 'Add'}
          </button>
        </form>
      )}

      {loadError && <p className={styles.error}>{loadError}</p>}
      {saveError && (
        <div className={styles.errorBar} role="alert">
          <span>{saveError}</span>
          <button className={styles.errorDismiss} onClick={() => setSaveError('')} type="button">
            Dismiss
          </button>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.tableFlexSecond}`}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th className={styles.numCol}>Amount</th>
              <th>Account</th>
              <th className={styles.actionsHead} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  {rows.length === 0
                    ? `No ${kind} entries yet — add the first one.`
                    : 'No entries match the filters.'}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <Fragment key={row.id}>
                  <tr className={savingIds.has(row.id) ? styles.rowSaving : undefined}>
                    <td>
                      <input
                        className={`${styles.ghostInput} ${styles.dateInput}`}
                        type="date"
                        value={row.entryDate}
                        aria-label="Entry date"
                        onChange={(e) => {
                          if (e.target.value) patch(row, { entryDate: e.target.value });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.ghostInput}
                        type="text"
                        defaultValue={row.description}
                        aria-label="Description"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== row.description) patch(row, { description: v });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td>
                      <div className={styles.selectCell}>
                        {row.category ? (
                          <span className={`${styles.pill} ${styles.badgeNeutral}`}>{row.category}</span>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                        <select
                          className={styles.overlaySelect}
                          value={row.category}
                          aria-label="Category"
                          onChange={(e) => handleCategory(row, e.target.value)}
                        >
                          <option value="">—</option>
                          {uniq([...categoryValues, row.category]).filter(Boolean).map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                          <option value="__add_new__">＋ Add new…</option>
                        </select>
                      </div>
                    </td>
                    <td className={styles.numCol}>
                      <input
                        className={`${styles.ghostInput} ${styles.numInput}`}
                        type="text"
                        inputMode="decimal"
                        defaultValue={String(row.amount)}
                        aria-label="Amount"
                        onBlur={(e) => {
                          const raw = e.target.value.trim().replace(/[$,]/g, '');
                          const n = Number(raw);
                          if (raw === '' || Number.isNaN(n)) {
                            e.target.value = String(row.amount);
                            return;
                          }
                          if (n !== row.amount) patch(row, { amount: n });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className={`${styles.ghostInput} ${styles.cellMinS}`}
                        type="text"
                        defaultValue={row.account}
                        aria-label="Account"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== row.account) patch(row, { account: v });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td className={styles.rowActions}>
                      <button
                        className={`${styles.iconBtn} ${row.note ? styles.iconBtnActive : ''}`}
                        type="button"
                        aria-label="Note"
                        onClick={() => setOpenNoteId((id) => (id === row.id ? null : row.id))}
                      >
                        <NoteIcon />
                      </button>
                      <button
                        className={styles.iconBtn}
                        type="button"
                        aria-label="Delete entry"
                        onClick={() => remove(row)}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                  {openNoteId === row.id && (
                    <tr className={styles.noteRow}>
                      <td colSpan={6}>
                        <label className={styles.noteRowInner}>
                          <span className={styles.label}>Note</span>
                          <input
                            className={styles.cellInput}
                            type="text"
                            placeholder="Optional note"
                            defaultValue={row.note}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v !== row.note) patch(row, { note: v });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur();
                            }}
                          />
                        </label>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
          {visible.length > 0 && (
            <tfoot>
              <tr className={styles.totalsRow}>
                <td colSpan={3}>Total ({month ? monthLabel(month) : 'all months'})</td>
                <td className={styles.numCol}>{formatMoney(visibleTotal)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
}
