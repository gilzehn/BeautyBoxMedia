'use client';

import { Fragment, useEffect, useMemo, useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import {
  ClientRow,
  ClientInput,
  getClients,
  addClient,
  updateClient,
  deleteClient,
} from '@/lib/clients';
import { FilterMulti, NoteIcon, TrashIcon, ScreenHead, formatMoney, uniq } from './shared';

const STATUS_FIELD = 'client_status';
const SERVICE_FIELD = 'client_service';
const STATUS_CLASS: Record<string, string> = {
  Active: 'levelLow',
  Onboarding: 'levelMedium',
  Paused: 'levelHigh',
  Ended: 'badgeNeutral',
};
// Retainers on these statuses don't count toward the monthly total.
const NON_BILLING_STATUSES = ['Paused', 'Ended'];

export default function ClientsScreen({
  options,
  onAddOption,
}: {
  options: Record<string, string[]>;
  onAddOption: (field: string, value: string) => Promise<void>;
}) {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<ClientInput>({
    client: '',
    contactName: '',
    email: '',
    phone: '',
    service: '',
    status: 'Active',
    assignee: '',
    startDate: '',
    retainer: null,
    note: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getClients()
      .then(setRows)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load clients.'))
      .finally(() => setLoading(false));
  }, []);

  const statusValues = uniq([...(options[STATUS_FIELD] ?? []), ...rows.map((r) => r.status)]).filter(Boolean);
  const serviceValues = uniq([...(options[SERVICE_FIELD] ?? []), ...rows.map((r) => r.service)]).filter(Boolean);
  const assigneeValues = uniq([...(options['assignee'] ?? []), ...rows.map((r) => r.assignee)]).filter(Boolean);

  const counts = useMemo(() => {
    const status = new Map<string, number>();
    const service = new Map<string, number>();
    const assignee = new Map<string, number>();
    for (const r of rows) {
      if (r.status) status.set(r.status, (status.get(r.status) ?? 0) + 1);
      if (r.service) service.set(r.service, (service.get(r.service) ?? 0) + 1);
      if (r.assignee) assignee.set(r.assignee, (assignee.get(r.assignee) ?? 0) + 1);
    }
    return { status, service, assignee };
  }, [rows]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter.length > 0 && !statusFilter.includes(r.status)) return false;
      if (serviceFilter.length > 0 && !serviceFilter.includes(r.service)) return false;
      if (assigneeFilter.length > 0 && !assigneeFilter.includes(r.assignee)) return false;
      if (!term) return true;
      return [r.client, r.contactName, r.email, r.phone, r.note].some((v) =>
        v.toLowerCase().includes(term)
      );
    });
  }, [rows, search, statusFilter, serviceFilter, assigneeFilter]);

  const monthly = rows
    .filter((r) => !NON_BILLING_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + (r.retainer ?? 0), 0);

  const setSaving = (id: number, on: boolean) =>
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // Optimistic partial-patch save with revert on failure.
  const patch = async (row: ClientRow, changes: Partial<ClientInput>) => {
    setSaveError('');
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...changes } : r)));
    setSaving(row.id, true);
    try {
      const saved = await updateClient(row.id, changes);
      setRows((prev) => prev.map((r) => (r.id === row.id ? saved : r)));
    } catch (err) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)));
      setSaveError(
        `Couldn't save "${row.client || 'client'}": ${err instanceof Error ? err.message : 'save failed'}`
      );
    } finally {
      setSaving(row.id, false);
    }
  };

  const handleSelect = async (
    row: ClientRow,
    key: 'service' | 'status' | 'assignee',
    field: string,
    raw: string
  ) => {
    if (raw !== '__add_new__') {
      patch(row, { [key]: raw });
      return;
    }
    const entered = window.prompt('Add a new option:')?.trim();
    if (!entered) return;
    patch(row, { [key]: entered });
    try {
      await onAddOption(field, entered);
    } catch {
      setSaveError(`"${entered}" is saved on this client, but adding it as a reusable option failed.`);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.client.trim()) return;
    setCreating(true);
    setSaveError('');
    try {
      const created = await addClient({ ...draft, client: draft.client.trim() });
      setRows((prev) => [created, ...prev]);
      setDraft({
        client: '',
        contactName: '',
        email: '',
        phone: '',
        service: '',
        status: 'Active',
        assignee: '',
        startDate: '',
        retainer: null,
        note: '',
      });
      setAddOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to add client.');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (row: ClientRow) => {
    if (!window.confirm(`Delete client "${row.client}"?`)) return;
    setSaveError('');
    try {
      await deleteClient(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  return (
    <>
      <ScreenHead
        title="Agency Clients"
        meta={loading ? undefined : `${rows.length} clients · ${formatMoney(monthly)}/mo retained`}
      />

      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <input
            className={styles.searchInput}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
          />
          <FilterMulti
            label="Status"
            values={statusValues}
            counts={counts.status}
            selected={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterMulti
            label="Service"
            values={serviceValues}
            counts={counts.service}
            selected={serviceFilter}
            onChange={setServiceFilter}
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
          + Add client
        </button>
      </div>

      {addOpen && (
        <form className={styles.inlineAdd} onSubmit={handleAdd}>
          <input
            className={styles.input}
            value={draft.client}
            onChange={(e) => setDraft((d) => ({ ...d, client: e.target.value }))}
            placeholder="Client name"
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
            value={draft.service}
            onChange={(e) => setDraft((d) => ({ ...d, service: e.target.value }))}
            aria-label="Service"
          >
            <option value="">Service…</option>
            {serviceValues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            type="date"
            value={draft.startDate}
            onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
            aria-label="Start date"
          />
          <input
            className={styles.input}
            type="number"
            min="0"
            step="0.01"
            value={draft.retainer ?? ''}
            onChange={(e) =>
              setDraft((d) => ({ ...d, retainer: e.target.value === '' ? null : Number(e.target.value) }))
            }
            placeholder="Retainer ($/mo)"
            aria-label="Monthly retainer"
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
              <th>Client</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Service</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Since</th>
              <th className={styles.numCol}>Retainer /mo</th>
              <th className={styles.actionsHead} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className={styles.emptyCell}>
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={10} className={styles.emptyCell}>
                  {rows.length === 0 ? 'No clients yet — add the first one.' : 'No clients match the filters.'}
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
                        defaultValue={row.client}
                        aria-label="Client"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== row.client) patch(row, { client: v });
                          else e.target.value = row.client;
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
                        defaultValue={row.contactName}
                        aria-label={`Contact for ${row.client}`}
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
                        className={`${styles.ghostInput} ${styles.cellMinM}`}
                        type="text"
                        defaultValue={row.email}
                        aria-label={`Email for ${row.client}`}
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
                      <input
                        className={`${styles.ghostInput} ${styles.cellMinS}`}
                        type="text"
                        inputMode="tel"
                        defaultValue={row.phone}
                        aria-label={`Phone for ${row.client}`}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== row.phone) patch(row, { phone: v });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td>
                      <div className={styles.selectCell}>
                        {row.service ? (
                          <span className={`${styles.pill} ${styles.badgeNeutral}`}>{row.service}</span>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                        <select
                          className={styles.overlaySelect}
                          value={row.service}
                          aria-label={`Service for ${row.client}`}
                          onChange={(e) => handleSelect(row, 'service', SERVICE_FIELD, e.target.value)}
                        >
                          <option value="">—</option>
                          {uniq([...serviceValues, row.service]).filter(Boolean).map((v) => (
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
                        <span className={`${styles.pill} ${styles[STATUS_CLASS[row.status]] ?? styles.badgeNeutral}`}>
                          {row.status || '—'}
                        </span>
                        <select
                          className={styles.overlaySelect}
                          value={row.status}
                          aria-label={`Status for ${row.client}`}
                          onChange={(e) => handleSelect(row, 'status', STATUS_FIELD, e.target.value)}
                        >
                          {uniq([...statusValues, row.status]).filter(Boolean).map((v) => (
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
                          aria-label={`Assignee for ${row.client}`}
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
                        className={`${styles.ghostInput} ${styles.dateInput}`}
                        type="date"
                        value={row.startDate}
                        aria-label={`Start date for ${row.client}`}
                        onChange={(e) => patch(row, { startDate: e.target.value })}
                      />
                    </td>
                    <td className={styles.numCol}>
                      <input
                        className={`${styles.ghostInput} ${styles.numInput}`}
                        type="text"
                        inputMode="decimal"
                        defaultValue={row.retainer == null ? '' : String(row.retainer)}
                        placeholder="—"
                        aria-label={`Monthly retainer for ${row.client}`}
                        onBlur={(e) => {
                          const raw = e.target.value.trim().replace(/[$,]/g, '');
                          if (raw === '') {
                            if (row.retainer !== null) patch(row, { retainer: null });
                            return;
                          }
                          const n = Number(raw);
                          if (Number.isNaN(n)) {
                            e.target.value = row.retainer == null ? '' : String(row.retainer);
                            return;
                          }
                          if (n !== row.retainer) patch(row, { retainer: n });
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
                        aria-label={`Note for ${row.client}`}
                        onClick={() => setOpenNoteId((id) => (id === row.id ? null : row.id))}
                      >
                        <NoteIcon />
                      </button>
                      <button
                        className={styles.iconBtn}
                        type="button"
                        aria-label={`Delete ${row.client}`}
                        onClick={() => remove(row)}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                  {openNoteId === row.id && (
                    <tr className={styles.noteRow}>
                      <td colSpan={10}>
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
