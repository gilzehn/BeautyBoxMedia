'use client';

import { Fragment, useEffect, useMemo, useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import { TaskRow, TaskInput, getTasks, addTask, updateTask, deleteTask } from '@/lib/tasks';
import { FilterMulti, NoteIcon, TrashIcon, ScreenHead, uniq } from './shared';

const STATUS_FIELD = 'task_status';
const PRIORITY_FIELD = 'task_priority';
const STATUS_CLASS: Record<string, string> = {
  'To do': 'badgeNeutral',
  'In progress': 'levelMedium',
  Done: 'levelLow',
};
const PRIORITY_CLASS: Record<string, string> = {
  High: 'levelHigh',
  Medium: 'levelMedium',
  Low: 'levelLow',
};
// Board columns when neither options nor data provide statuses yet.
const FALLBACK_STATUSES = ['To do', 'In progress', 'Done'];

const VIEW_KEY = 'bizmanage.tasksView';

type ViewMode = 'list' | 'board';
type SortKey = 'title' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'brand';

const PRIORITY_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
// Known levels first, then custom values, then unset.
const priorityRank = (v: string) => (v in PRIORITY_RANK ? PRIORITY_RANK[v] : v ? 3 : 4);

const todayIso = () => new Date().toISOString().slice(0, 10);

// '2026-07-15' -> 'Jul 15' (year shown only when it differs from the current one).
function formatDue(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const sameYear = y === new Date().getFullYear();
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ListViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function BoardViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="5" height="7" rx="1" />
    </svg>
  );
}

export default function TasksScreen({
  options,
  brands,
  onAddOption,
}: {
  options: Record<string, string[]>;
  brands: string[];
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
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // localStorage is read after mount only, so the static-export prerender
  // (list view) always matches the first client render.
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  useEffect(() => {
    if (localStorage.getItem(VIEW_KEY) === 'board') setViewMode('board');
  }, []);
  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_KEY, mode);
  };

  // Board drag state: the task being dragged and the column under the pointer.
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<TaskInput>({
    title: '',
    status: 'To do',
    priority: '',
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

  const statusValues = useMemo(() => {
    const all = uniq([...(options[STATUS_FIELD] ?? []), ...rows.map((r) => r.status)]).filter(Boolean);
    return all.length > 0 ? all : FALLBACK_STATUSES;
  }, [options, rows]);
  const priorityValues = useMemo(
    () =>
      uniq([...(options[PRIORITY_FIELD] ?? []), ...rows.map((r) => r.priority)])
        .filter(Boolean)
        .sort((a, b) => priorityRank(a) - priorityRank(b)),
    [options, rows]
  );
  const assigneeValues = useMemo(
    () => uniq([...(options['assignee'] ?? []), ...rows.map((r) => r.assignee)]).filter(Boolean),
    [options, rows]
  );
  // Brand List names plus whatever the tasks already hold (legacy free text).
  const brandValues = useMemo(
    () =>
      uniq([...brands, ...rows.map((r) => r.brand)])
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [brands, rows]
  );

  const counts = useMemo(() => {
    const status = new Map<string, number>();
    const priority = new Map<string, number>();
    const assignee = new Map<string, number>();
    for (const r of rows) {
      if (r.status) status.set(r.status, (status.get(r.status) ?? 0) + 1);
      if (r.priority) priority.set(r.priority, (priority.get(r.priority) ?? 0) + 1);
      if (r.assignee) assignee.set(r.assignee, (assignee.get(r.assignee) ?? 0) + 1);
    }
    return { status, priority, assignee };
  }, [rows]);

  const today = todayIso();
  const isOverdue = (r: TaskRow) => r.dueDate !== '' && r.status !== 'Done' && r.dueDate < today;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter.length > 0 && !statusFilter.includes(r.status)) return false;
      if (priorityFilter.length > 0 && !priorityFilter.includes(r.priority)) return false;
      if (assigneeFilter.length > 0 && !assigneeFilter.includes(r.assignee)) return false;
      if (overdueOnly && !(r.dueDate !== '' && r.status !== 'Done' && r.dueDate < today)) return false;
      if (!term) return true;
      return [r.title, r.brand, r.assignee, r.note].some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter, priorityFilter, assigneeFilter, overdueOnly, today]);

  const sorted = useMemo(() => {
    const statusRank = (v: string) => {
      const i = statusValues.indexOf(v);
      return i === -1 ? statusValues.length : i;
    };
    const out = [...visible];
    out.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      // Empty cells always sink to the bottom, in both directions.
      if (!av && bv) return 1;
      if (av && !bv) return -1;
      let cmp = 0;
      if (sortKey === 'status') cmp = statusRank(av) - statusRank(bv);
      else if (sortKey === 'priority') cmp = priorityRank(av) - priorityRank(bv);
      else cmp = av.localeCompare(bv); // ISO due dates compare correctly as text
      if (cmp === 0) cmp = a.id - b.id;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return out;
  }, [visible, sortKey, sortDir, statusValues]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

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

  const handleSelect = async (
    row: TaskRow,
    key: 'status' | 'priority' | 'assignee' | 'brand',
    field: string,
    raw: string
  ) => {
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

  const toggleDone = (row: TaskRow) =>
    patch(row, { status: row.status === 'Done' ? 'To do' : 'Done' });

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    setCreating(true);
    setSaveError('');
    try {
      const created = await addTask({ ...draft, title: draft.title.trim() });
      setRows((prev) => [...prev, created]);
      setDraft({ title: '', status: 'To do', priority: '', assignee: '', dueDate: '', brand: '', note: '' });
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
  const overdueCount = rows.filter(isOverdue).length;

  // Tasks whose status isn't a known column (legacy/free-text values) get a
  // read-only bucket at the end of the board so nothing disappears.
  const orphans = sorted.filter((r) => !statusValues.includes(r.status));

  const sortableTh = (key: SortKey, label: string) => (
    <th className={styles.sortable} onClick={() => handleSort(key)}>
      {label}
      <span className={styles.sortArrow}>{sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</span>
    </th>
  );

  const quickCompleteBtn = (row: TaskRow) => (
    <button
      className={`${styles.checkBtn} ${row.status === 'Done' ? styles.checkBtnDone : ''}`}
      type="button"
      aria-label={row.status === 'Done' ? `Reopen ${row.title}` : `Mark ${row.title} done`}
      title={row.status === 'Done' ? 'Reopen' : 'Mark done'}
      onClick={() => toggleDone(row)}
    >
      <CheckIcon />
    </button>
  );

  const renderCard = (row: TaskRow) => {
    const overdue = isOverdue(row);
    return (
      <article
        key={row.id}
        className={`${styles.boardCard} ${dragId === row.id ? styles.boardCardDragging : ''} ${
          savingIds.has(row.id) ? styles.rowSaving : ''
        }`}
        draggable
        onDragStart={(e) => {
          setDragId(row.id);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(row.id));
        }}
        onDragEnd={() => {
          setDragId(null);
          setDragOverCol(null);
        }}
      >
        <div className={styles.boardCardTop}>
          <span className={styles.boardCardTitle}>{row.title || 'Untitled task'}</span>
          {quickCompleteBtn(row)}
        </div>
        {(row.priority || row.dueDate || row.brand || row.assignee) && (
          <div className={styles.boardCardMeta}>
            {row.priority && (
              <span className={`${styles.pill} ${styles[PRIORITY_CLASS[row.priority]] ?? styles.badgeNeutral}`}>
                {row.priority}
              </span>
            )}
            {row.dueDate && (
              <span className={overdue ? styles.boardCardDueOverdue : styles.boardCardDue}>
                {overdue ? '⚠ ' : ''}
                {formatDue(row.dueDate)}
              </span>
            )}
            {row.brand && <span>{row.brand}</span>}
            {row.assignee && <span>{row.assignee}</span>}
          </div>
        )}
      </article>
    );
  };

  const renderBoardColumn = (col: string, cards: TaskRow[], droppable: boolean) => (
    <section
      key={col}
      className={`${styles.boardCol} ${droppable && dragOverCol === col ? styles.boardColOver : ''}`}
      aria-label={`${col} column`}
      onDragOver={
        droppable
          ? (e) => {
              if (dragId === null) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverCol !== col) setDragOverCol(col);
            }
          : undefined
      }
      onDragLeave={
        droppable
          ? (e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverCol((c) => (c === col ? null : c));
              }
            }
          : undefined
      }
      onDrop={
        droppable
          ? (e) => {
              e.preventDefault();
              setDragOverCol(null);
              const row = rows.find((r) => r.id === dragId);
              setDragId(null);
              if (row && row.status !== col) patch(row, { status: col });
            }
          : undefined
      }
    >
      <header className={styles.boardColHead}>
        <span>{col}</span>
        <span className={styles.boardColCount}>{cards.length}</span>
      </header>
      <div className={styles.boardCards}>
        {cards.length === 0 ? <p className={styles.boardEmpty}>No tasks</p> : cards.map(renderCard)}
      </div>
      {droppable && (
        <button
          className={styles.boardAddBtn}
          type="button"
          onClick={() => {
            setDraft((d) => ({ ...d, status: col }));
            setAddOpen(true);
          }}
        >
          + Add task
        </button>
      )}
    </section>
  );

  return (
    <>
      <ScreenHead
        title="Tasks"
        meta={
          loading
            ? undefined
            : `${openCount} open · ${overdueCount} overdue · ${rows.length} total`
        }
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
            label="Priority"
            values={priorityValues}
            counts={counts.priority}
            selected={priorityFilter}
            onChange={setPriorityFilter}
          />
          <FilterMulti
            label="Assignee"
            values={assigneeValues}
            counts={counts.assignee}
            selected={assigneeFilter}
            onChange={setAssigneeFilter}
          />
          <button
            className={`${styles.chipToggle} ${overdueOnly ? styles.chipToggleActive : ''}`}
            type="button"
            aria-pressed={overdueOnly}
            onClick={() => setOverdueOnly((o) => !o)}
          >
            Overdue{overdueCount > 0 ? ` (${overdueCount})` : ''}
          </button>
        </div>
        <div className={styles.toolbarFilters}>
          <div className={styles.viewToggle} role="group" aria-label="View mode">
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.viewToggleBtnActive : ''}`}
              aria-pressed={viewMode === 'list'}
              onClick={() => switchView('list')}
            >
              <ListViewIcon /> List
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === 'board' ? styles.viewToggleBtnActive : ''}`}
              aria-pressed={viewMode === 'board'}
              onClick={() => switchView('board')}
            >
              <BoardViewIcon /> Board
            </button>
          </div>
          <button className={`btn btn-primary ${styles.addBtn}`} onClick={() => setAddOpen((o) => !o)} type="button">
            + Add task
          </button>
        </div>
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
            value={draft.priority}
            onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
            aria-label="Priority"
          >
            <option value="">Priority…</option>
            {priorityValues.map((v) => (
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
          <select
            className={styles.input}
            value={draft.brand}
            onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
            aria-label="Brand"
          >
            <option value="">Brand…</option>
            {brandValues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
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

      {viewMode === 'board' ? (
        loading ? (
          <p className={styles.boardEmpty}>Loading…</p>
        ) : (
          <div className={styles.board}>
            {statusValues.map((col) =>
              renderBoardColumn(
                col,
                sorted.filter((r) => r.status === col),
                true
              )
            )}
            {orphans.length > 0 && renderBoardColumn('No status', orphans, false)}
          </div>
        )
      ) : (
        <div className={styles.tableWrap}>
          {/* Check circle hugs; the Task column absorbs the leftover width. */}
          <table className={`${styles.table} ${styles.tableFlexSecond}`}>
            <thead>
              <tr>
                <th className={styles.checkHead} aria-label="Done" />
                {sortableTh('title', 'Task')}
                {sortableTh('status', 'Status')}
                {sortableTh('priority', 'Priority')}
                {sortableTh('assignee', 'Assignee')}
                {sortableTh('dueDate', 'Due')}
                {sortableTh('brand', 'Brand')}
                <th className={styles.actionsHead} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={styles.emptyCell}>
                    Loading…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyCell}>
                    {rows.length === 0 ? 'No tasks yet — add the first one.' : 'No tasks match the filters.'}
                  </td>
                </tr>
              ) : (
                sorted.map((row) => {
                  const overdue = isOverdue(row);
                  const done = row.status === 'Done';
                  return (
                    <Fragment key={row.id}>
                      <tr className={savingIds.has(row.id) ? styles.rowSaving : undefined}>
                        <td className={styles.checkCell}>{quickCompleteBtn(row)}</td>
                        <td>
                          <input
                            className={`${styles.ghostInput} ${styles.ghostInputStrong} ${
                              done ? styles.titleDone : ''
                            }`}
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
                            {row.priority ? (
                              <span className={`${styles.pill} ${styles[PRIORITY_CLASS[row.priority]] ?? styles.badgeNeutral}`}>
                                {row.priority}
                              </span>
                            ) : (
                              <span className={styles.muted}>—</span>
                            )}
                            <select
                              className={styles.overlaySelect}
                              value={row.priority}
                              aria-label={`Priority for ${row.title}`}
                              onChange={(e) => handleSelect(row, 'priority', PRIORITY_FIELD, e.target.value)}
                            >
                              <option value="">—</option>
                              {uniq([...priorityValues, row.priority]).filter(Boolean).map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                              <option value="__add_new__">＋ Add new…</option>
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
                          <div className={styles.selectCell}>
                            {row.brand || <span className={styles.muted}>—</span>}
                            <select
                              className={styles.overlaySelect}
                              value={row.brand}
                              aria-label={`Brand for ${row.title}`}
                              onChange={(e) => patch(row, { brand: e.target.value })}
                            >
                              <option value="">—</option>
                              {uniq([...brandValues, row.brand]).filter(Boolean).map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </div>
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
                          <td colSpan={8}>
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
      )}
    </>
  );
}
