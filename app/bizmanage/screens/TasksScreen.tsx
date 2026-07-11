'use client';

import { Fragment, useEffect, useMemo, useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import { TaskRow, TaskInput, getTasks, addTask, updateTask, deleteTask } from '@/lib/tasks';
import { FilterMulti, NoteIcon, TrashIcon, ScreenHead, uniq } from './shared';

const STATUS_FIELD = 'task_status';
const STATUS_CLASS: Record<string, string> = {
  'To do': 'badgeNeutral',
  'In progress': 'levelMedium',
  Done: 'levelLow',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function TasksScreen({
  options,
  onAddOption,
}: {
  options: Record<string, string[]>;
  onAddOption: (field: string, value: string) => Promise<void>;
}) {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<TaskInput>({
    title: '',
    status: 'To do',
    assignee: '',
    dueDate: '',
    brand: '',
    note: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getTasks()
      .then(setRows)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load tasks.'))
      .finally(() => setLoading(false));
  }, []);

  const statusValues = uniq([...(options[STATUS_FIELD] ?? []), ...rows.map((r) => r.status)]).filter(Boolean);
  const assigneeValues = uniq([...(options['assignee'] ?? []), ...rows.map((r) => r.assignee)]).filter(Boolean);

  const counts = useMemo(() => {
    const status = new Map<string, number>();
    const assignee = new Map<string, number>();
    for (const r of rows) {
      if (r.status) status.set(r.status, (status.get(r.status) ?? 0) + 1);
      if (r.assignee) assignee.set(r.assignee, (assignee.get(r.assignee) ?? 0) + 1);
    }
    return { status, assignee };
  }, [rows]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter.length > 0 && !statusFilter.includes(r.status)) return false;
      if (assigneeFilter.length > 0 && !assigneeFilter.includes(r.assignee)) return false;
      if (!term) return true;
      return [r.title, r.brand, r.assignee, r.note].some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter, assigneeFilter]);

  const setSaving = (id: number, on: boolean) =>
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // Optimistic partial-patch save with revert on failure.
  const patch = async (row: TaskRow, changes: Partial<TaskInput>) => {
    setSaveError('');
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...changes } : r)));
    setSaving(row.id, true);
    try {
      const saved = await updateTask(row.id, changes);
      setRows((prev) => prev.map((r) => (r.id === row.id ? saved : r)));
    } catch (err) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
      setSaveError(
        `Couldn't save "${row.title || 'task'}": ${err instanceof Error ? err.message : 'save failed'}`
      );
    } finally {
      setSaving(row.id, false);
    }
  };

  const handleSelect = async (row: TaskRow, key: 'status' | 'assignee', field: string, raw: string) => {
    if (raw !== '__add_new__') {
      patch(row, { [key]: raw });
      return;
    }
    const entered = window.prompt(`Add a new option:`)?.trim();
    if (!entered) return;
    patch(row, { [key]: entered });
    try {
      await onAddOption(field, entered);
    } catch {
      setSaveError(`"${entered}" is saved on this task, but adding it as a reusable option failed.`);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    setCreating(true);
    setSaveError('');
    try {
      const created = await addTask({ ...draft, title: draft.title.trim() });
      setRows((prev) => [...prev, created]);
      setDraft({ title: '', status: 'To do', assignee: '', dueDate: '', brand: '', note: '' });
      setAddOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to add task.');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (row: TaskRow) => {
    if (!window.confirm(`Delete task "${row.title}"?`)) return;
    setSaveError('');
    try {
      await deleteTask(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  const openCount = rows.filter((r) => r.status !== 'Done').length;

  return (
    <>
      <ScreenHead
        title="Tasks"
        meta={loading ? undefined : `${openCount} open · ${rows.length} total`}
      />

      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <input
            className={styles.searchInput}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
          />
          <FilterMulti
            label="Status"
            values={statusValues}
            counts={counts.status}
            selected={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterMulti
            label="Assignee"
            values={assigneeValues}
            counts={counts.assignee}
            selected={assigneeFilter}
            onChange={setAssigneeFilter}
          />
        </div>
        <button className={`btn btn-primary ${styles.addBtn}`} onClick={() => setAddOpen((o) => !o)} type="button">
          + Add task
        </button>
      </div>

      {addOpen && (
        <form className={styles.inlineAdd} onSubmit={handleAdd}>
          <input
            className={styles.input}
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Task title"
            autoFocus
            required
          />
          <select
            className={styles.input}
            value={draft.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            aria-label="Status"
          >
            {statusValues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            className={styles.input}
            value={draft.assignee}
            onChange={(e) => setDraft((d) => ({ ...d, assignee: e.target.value }))}
            aria-label="Assignee"
          >
            <option value="">Assignee…</option>
            {assigneeValues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            type="date"
            value={draft.dueDate}
            onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
            aria-label="Due date"
          />
          <input
            className={styles.input}
            value={draft.brand}
            onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
            placeholder="Brand (optional)"
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
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Due</th>
              <th>Brand</th>
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
                  {rows.length === 0 ? 'No tasks yet — add the first one.' : 'No tasks match the filters.'}
                </td>
              </tr>
            ) : (
              visible.map((row) => {
                const overdue = row.dueDate !== '' && row.status !== 'Done' && row.dueDate < todayIso();
                return (
                  <Fragment key={row.id}>
                    <tr className={savingIds.has(row.id) ? styles.rowSaving : undefined}>
                      <td>
                        <input
                          className={`${styles.ghostInput} ${styles.ghostInputStrong}`}
                          type="text"
                          defaultValue={row.title}
                          aria-label="Task title"
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v && v !== row.title) patch(row, { title: v });
                            else e.target.value = row.title;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                        />
                      </td>
                      <td>
                        <div className={styles.selectCell}>
                          <span className={`${styles.pill} ${styles[STATUS_CLASS[row.status]] ?? styles.badgeNeutral}`}>
                            {row.status || '—'}
                          </span>
                          <select
                            className={styles.overlaySelect}
                            value={row.status}
                            aria-label={`Status for ${row.title}`}
                            onChange={(e) => handleSelect(row, 'status', STATUS_FIELD, e.target.value)}
                          >
                            {uniq([...statusValues, row.status]).filter(Boolean).map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className={styles.selectCell}>
                          {row.assignee || <span className={styles.muted}>—</span>}
                          <select
                            className={styles.overlaySelect}
                            value={row.assignee}
                            aria-label={`Assignee for ${row.title}`}
                            onChange={(e) => handleSelect(row, 'assignee', 'assignee', e.target.value)}
                          >
                            <option value="">—</option>
                            {uniq([...assigneeValues, row.assignee]).filter(Boolean).map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                            <option value="__add_new__">＋ Add new…</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <input
                          className={`${styles.ghostInput} ${styles.dateInput} ${overdue ? styles.dateOverdue : ''}`}
                          type="date"
                          value={row.dueDate}
                          aria-label={`Due date for ${row.title}`}
                          onChange={(e) => patch(row, { dueDate: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className={`${styles.ghostInput} ${styles.cellMinS}`}
                          type="text"
                          defaultValue={row.brand}
                          aria-label={`Brand for ${row.title}`}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== row.brand) patch(row, { brand: v });
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
                          aria-label={`Note for ${row.title}`}
                          onClick={() => setOpenNoteId((id) => (id === row.id ? null : row.id))}
                        >
                          <NoteIcon />
                        </button>
                        <button
                          className={styles.iconBtn}
                          type="button"
                          aria-label={`Delete ${row.title}`}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
