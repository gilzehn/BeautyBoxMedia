'use client';

import { Fragment, useEffect, useMemo, useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import { LeadRow, LeadInput, getLeads, addLead, updateLead, deleteLead } from '@/lib/leads';
import { FilterMulti, NoteIcon, TrashIcon, ScreenHead, formatMoney, uniq } from './shared';

const STAGE_FIELD = 'lead_stage';
const STAGE_CLASS: Record<string, string> = {
  New: 'badgeNeutral',
  Contacted: 'levelMedium',
  Meeting: 'levelMedium',
  Proposal: 'levelHigh',
  Won: 'levelLow',
  Lost: 'badgeNeutral',
};
const CLOSED_STAGES = ['Won', 'Lost'];

export default function LeadsScreen({
  options,
  onAddOption,
}: {
  options: Record<string, string[]>;
  onAddOption: (field: string, value: string) => Promise<void>;
}) {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<LeadInput>({
    company: '',
    contactName: '',
    email: '',
    stage: 'New',
    assignee: '',
    estValue: null,
    note: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getLeads()
      .then(setRows)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load leads.'))
      .finally(() => setLoading(false));
  }, []);

  const stageValues = uniq([...(options[STAGE_FIELD] ?? []), ...rows.map((r) => r.stage)]).filter(Boolean);
  const assigneeValues = uniq([...(options['assignee'] ?? []), ...rows.map((r) => r.assignee)]).filter(Boolean);

  const counts = useMemo(() => {
    const stage = new Map<string, number>();
    const assignee = new Map<string, number>();
    for (const r of rows) {
      if (r.stage) stage.set(r.stage, (stage.get(r.stage) ?? 0) + 1);
      if (r.assignee) assignee.set(r.assignee, (assignee.get(r.assignee) ?? 0) + 1);
    }
    return { stage, assignee };
  }, [rows]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (stageFilter.length > 0 && !stageFilter.includes(r.stage)) return false;
      if (assigneeFilter.length > 0 && !assigneeFilter.includes(r.assignee)) return false;
      if (!term) return true;
      return [r.company, r.contactName, r.email, r.note].some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, stageFilter, assigneeFilter]);

  const pipeline = rows
    .filter((r) => !CLOSED_STAGES.includes(r.stage))
    .reduce((sum, r) => sum + (r.estValue ?? 0), 0);

  const setSaving = (id: number, on: boolean) =>
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const patch = async (row: LeadRow, changes: Partial<LeadInput>) => {
    setSaveError('');
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...changes } : r)));
    setSaving(row.id, true);
    try {
      const saved = await updateLead(row.id, changes);
      setRows((prev) => prev.map((r) => (r.id === row.id ? saved : r)));
    } catch (err) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
      setSaveError(
        `Couldn't save "${row.company || 'lead'}": ${err instanceof Error ? err.message : 'save failed'}`
      );
    } finally {
      setSaving(row.id, false);
    }
  };

  const handleStage = async (row: LeadRow, raw: string) => {
    if (raw !== '__add_new__') {
      patch(row, { stage: raw });
      return;
    }
    const entered = window.prompt('Add a new stage:')?.trim();
    if (!entered) return;
    patch(row, { stage: entered });
    try {
      await onAddOption(STAGE_FIELD, entered);
    } catch {
      setSaveError(`"${entered}" is saved on this lead, but adding it as a reusable stage failed.`);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.company.trim()) return;
    setCreating(true);
    setSaveError('');
    try {
      const created = await addLead({ ...draft, company: draft.company.trim() });
      setRows((prev) => [created, ...prev]);
      setDraft({ company: '', contactName: '', email: '', stage: 'New', assignee: '', estValue: null, note: '' });
      setAddOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to add lead.');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (row: LeadRow) => {
    if (!window.confirm(`Delete lead "${row.company}"?`)) return;
    setSaveError('');
    try {
      await deleteLead(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  return (
    <>
      <ScreenHead
        title="Leads"
        meta={loading ? undefined : `${rows.length} leads · ${formatMoney(pipeline)} open pipeline`}
      />

      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <input
            className={styles.searchInput}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads…"
          />
          <FilterMulti
            label="Stage"
            values={stageValues}
            counts={counts.stage}
            selected={stageFilter}
            onChange={setStageFilter}
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
          + Add lead
        </button>
      </div>

      {addOpen && (
        <form className={styles.inlineAdd} onSubmit={handleAdd}>
          <input
            className={styles.input}
            value={draft.company}
            onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))}
            placeholder="Company"
            autoFocus
            required
          />
          <input
            className={styles.input}
            value={draft.contactName}
            onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))}
            placeholder="Contact name"
          />
          <input
            className={styles.input}
            type="email"
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            placeholder="Email"
          />
          <select
            className={styles.input}
            value={draft.stage}
            onChange={(e) => setDraft((d) => ({ ...d, stage: e.target.value }))}
            aria-label="Stage"
          >
            {stageValues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            type="number"
            min="0"
            step="0.01"
            value={draft.estValue ?? ''}
            onChange={(e) =>
              setDraft((d) => ({ ...d, estValue: e.target.value === '' ? null : Number(e.target.value) }))
            }
            placeholder="Est. value ($)"
            aria-label="Estimated value"
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
              <th>Company</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Stage</th>
              <th>Assignee</th>
              <th className={styles.numCol}>Est. value</th>
              <th className={styles.actionsHead} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  {rows.length === 0 ? 'No leads yet — add the first one.' : 'No leads match the filters.'}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <Fragment key={row.id}>
                  <tr className={savingIds.has(row.id) ? styles.rowSaving : undefined}>
                    <td>
                      <input
                        className={`${styles.ghostInput} ${styles.ghostInputStrong}`}
                        type="text"
                        defaultValue={row.company}
                        aria-label="Company"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== row.company) patch(row, { company: v });
                          else e.target.value = row.company;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.ghostInput}
                        type="text"
                        defaultValue={row.contactName}
                        aria-label={`Contact for ${row.company}`}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== row.contactName) patch(row, { contactName: v });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.ghostInput}
                        type="text"
                        defaultValue={row.email}
                        aria-label={`Email for ${row.company}`}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== row.email) patch(row, { email: v });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td>
                      <div className={styles.selectCell}>
                        <span className={`${styles.pill} ${styles[STAGE_CLASS[row.stage]] ?? styles.badgeNeutral}`}>
                          {row.stage || '—'}
                        </span>
                        <select
                          className={styles.overlaySelect}
                          value={row.stage}
                          aria-label={`Stage for ${row.company}`}
                          onChange={(e) => handleStage(row, e.target.value)}
                        >
                          {uniq([...stageValues, row.stage]).filter(Boolean).map((v) => (
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
                          aria-label={`Assignee for ${row.company}`}
                          onChange={(e) => patch(row, { assignee: e.target.value })}
                        >
                          <option value="">—</option>
                          {uniq([...assigneeValues, row.assignee]).filter(Boolean).map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className={styles.numCol}>
                      <input
                        className={`${styles.ghostInput} ${styles.numInput}`}
                        type="text"
                        inputMode="decimal"
                        defaultValue={row.estValue == null ? '' : String(row.estValue)}
                        placeholder="—"
                        aria-label={`Estimated value for ${row.company}`}
                        onBlur={(e) => {
                          const raw = e.target.value.trim().replace(/[$,]/g, '');
                          if (raw === '') {
                            if (row.estValue !== null) patch(row, { estValue: null });
                            return;
                          }
                          const n = Number(raw);
                          if (Number.isNaN(n)) {
                            e.target.value = row.estValue == null ? '' : String(row.estValue);
                            return;
                          }
                          if (n !== row.estValue) patch(row, { estValue: n });
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
                        aria-label={`Note for ${row.company}`}
                        onClick={() => setOpenNoteId((id) => (id === row.id ? null : row.id))}
                      >
                        <NoteIcon />
                      </button>
                      <button
                        className={styles.iconBtn}
                        type="button"
                        aria-label={`Delete ${row.company}`}
                        onClick={() => remove(row)}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                  {openNoteId === row.id && (
                    <tr className={styles.noteRow}>
                      <td colSpan={7}>
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
        </table>
      </div>
    </>
  );
}
