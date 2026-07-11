'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import {
  DropdownOptionRow,
  DropdownFieldMeta,
  DROPDOWN_FIELDS,
  getDropdownRows,
  addOption,
  renameOption,
  deleteOption,
  setOptionOrder,
} from '@/lib/dropdowns';
import { ScreenHead, TrashIcon, uniq } from './shared';

function ChevronUpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// Settings → Dropdowns: one card per select field, where admins add, rename,
// reorder, and remove the options every console dropdown offers. Renames
// cascade to the rows already holding the old value; removals only stop the
// value being offered for new picks.
export default function SettingsDropdownsScreen({ onChanged }: { onChanged: () => void }) {
  const [rows, setRows] = useState<DropdownOptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [error, setError] = useState('');
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [addingFields, setAddingFields] = useState<Set<string>>(new Set());

  const load = () =>
    getDropdownRows()
      .then(setRows)
      .catch((err) => setListError(err instanceof Error ? err.message : 'Failed to load options.'));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  // Cards in curated order; any field present in the data but unknown to the
  // curated list (e.g. added straight in Supabase) still gets a card so its
  // options aren't invisible here.
  const groups = useMemo(() => {
    const known = new Set(DROPDOWN_FIELDS.map((f) => f.field));
    const extras: DropdownFieldMeta[] = uniq(rows.map((r) => r.field))
      .filter((field) => !known.has(field))
      .map((field) => ({ field, label: field, usedIn: 'Custom field', references: [] }));
    return [...DROPDOWN_FIELDS, ...extras].map((meta) => ({
      meta,
      list: rows
        .filter((r) => r.field === meta.field)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    }));
  }, [rows]);

  const setBusy = (id: number, on: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const handleAdd = async (meta: DropdownFieldMeta, list: DropdownOptionRow[], e: FormEvent) => {
    e.preventDefault();
    const value = (drafts[meta.field] ?? '').trim();
    if (!value) return;
    setError('');
    if (list.some((o) => o.value.toLowerCase() === value.toLowerCase())) {
      setError(`"${value}" is already in the ${meta.label} list.`);
      return;
    }
    setAddingFields((prev) => new Set(prev).add(meta.field));
    try {
      const created = await addOption(meta.field, value, (list.at(-1)?.sortOrder ?? 0) + 1);
      setRows((prev) => [...prev, created]);
      setDrafts((prev) => ({ ...prev, [meta.field]: '' }));
      onChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'add failed';
      setError(`Couldn't add "${value}": ${msg}`);
    } finally {
      setAddingFields((prev) => {
        const next = new Set(prev);
        next.delete(meta.field);
        return next;
      });
    }
  };

  // Uncontrolled rename input: on any failure the DOM value is put back by
  // hand (defaultValue doesn't track re-renders), on success state catches up.
  const handleRename = async (
    list: DropdownOptionRow[],
    option: DropdownOptionRow,
    input: HTMLInputElement
  ) => {
    const value = input.value.trim();
    if (value === option.value) {
      input.value = option.value;
      return;
    }
    setError('');
    if (!value) {
      setError('Option text is required — change reverted.');
      input.value = option.value;
      return;
    }
    if (list.some((o) => o.id !== option.id && o.value.toLowerCase() === value.toLowerCase())) {
      setError(`"${value}" is already an option in this list — change reverted.`);
      input.value = option.value;
      return;
    }
    input.value = value; // show the trimmed text
    setRows((prev) => prev.map((r) => (r.id === option.id ? { ...r, value } : r)));
    setBusy(option.id, true);
    try {
      await renameOption(option, value);
      onChanged();
    } catch (err) {
      setRows((prev) => prev.map((r) => (r.id === option.id ? option : r)));
      input.value = option.value;
      const msg = err instanceof Error ? err.message : 'save failed';
      setError(`Couldn't rename "${option.value}": ${msg}`);
    } finally {
      setBusy(option.id, false);
    }
  };

  const handleDelete = async (meta: DropdownFieldMeta, option: DropdownOptionRow) => {
    if (
      !window.confirm(
        `Remove "${option.value}" from the ${meta.label} options?\n\nRows already set to "${option.value}" keep it — it just stops being offered for new picks.`
      )
    ) {
      return;
    }
    setError('');
    setBusy(option.id, true);
    try {
      await deleteOption(option.id);
      setRows((prev) => prev.filter((r) => r.id !== option.id));
      onChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'delete failed';
      setError(`Couldn't remove "${option.value}": ${msg}`);
    } finally {
      setBusy(option.id, false);
    }
  };

  const moveOption = async (list: DropdownOptionRow[], index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    // Persist positions as 1..n, so legacy 999s from "+ Add new…" get real
    // slots the first time a list is reordered.
    const changes = next
      .map((o, i) => ({ o, order: i + 1 }))
      .filter(({ o, order }) => o.sortOrder !== order);
    setError('');
    setRows((prev) =>
      prev.map((r) => {
        const change = changes.find((c) => c.o.id === r.id);
        return change ? { ...r, sortOrder: change.order } : r;
      })
    );
    setBusy(moved.id, true);
    try {
      await Promise.all(changes.map(({ o, order }) => setOptionOrder(o.id, order)));
      onChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'save failed';
      setError(`Couldn't reorder "${moved.value}": ${msg}`);
      await load(); // partial writes possible: re-sync with the server
    } finally {
      setBusy(moved.id, false);
    }
  };

  return (
    <>
      <ScreenHead
        title="Dropdowns"
        meta={loading ? undefined : `${groups.length} lists · ${rows.length} options`}
      />

      {error && (
        <div className={styles.errorBar} role="alert">
          <span>{error}</span>
          <button className={styles.errorDismiss} onClick={() => setError('')} type="button">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <p className={styles.pageMeta}>Loading options…</p>
      ) : listError ? (
        <p className={styles.error}>{listError}</p>
      ) : (
        <div className={styles.optionCards}>
          {groups.map(({ meta, list }) => (
            <section key={meta.field} className={styles.optionCard} aria-label={`${meta.label} options`}>
              <div className={styles.optionCardHead}>
                <h4 className={styles.optionCardTitle}>{meta.label}</h4>
                <span className={styles.optionCardMeta}>{meta.usedIn}</span>
              </div>

              {list.length === 0 ? (
                <p className={styles.optionEmpty}>No options yet — add the first one below.</p>
              ) : (
                <ul className={styles.optionList}>
                  {list.map((option, i) => {
                    const busy = busyIds.has(option.id);
                    return (
                      <li
                        key={option.id}
                        className={`${styles.optionRow} ${busy ? styles.rowSaving : ''}`}
                      >
                        <input
                          className={styles.ghostInput}
                          type="text"
                          defaultValue={option.value}
                          disabled={busy}
                          aria-label={`Rename ${meta.label} option ${option.value}`}
                          onBlur={(e) => handleRename(list, option, e.currentTarget)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                            else if (e.key === 'Escape') {
                              e.currentTarget.value = option.value;
                              e.currentTarget.blur();
                            }
                          }}
                        />
                        <span className={styles.rowActions}>
                          <button
                            className={styles.iconBtn}
                            type="button"
                            disabled={busy || i === 0}
                            aria-label={`Move ${option.value} up`}
                            title="Move up"
                            onClick={() => moveOption(list, i, -1)}
                          >
                            <ChevronUpIcon />
                          </button>
                          <button
                            className={styles.iconBtn}
                            type="button"
                            disabled={busy || i === list.length - 1}
                            aria-label={`Move ${option.value} down`}
                            title="Move down"
                            onClick={() => moveOption(list, i, 1)}
                          >
                            <ChevronDownIcon />
                          </button>
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            type="button"
                            disabled={busy}
                            aria-label={`Remove ${option.value}`}
                            title={`Remove ${option.value}`}
                            onClick={() => handleDelete(meta, option)}
                          >
                            <TrashIcon />
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <form className={styles.optionAddRow} onSubmit={(e) => handleAdd(meta, list, e)}>
                <input
                  className={styles.input}
                  type="text"
                  value={drafts[meta.field] ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [meta.field]: e.target.value }))
                  }
                  placeholder="New option…"
                  aria-label={`New ${meta.label} option`}
                />
                <button
                  type="submit"
                  className={styles.rowBtn}
                  disabled={addingFields.has(meta.field) || !(drafts[meta.field] ?? '').trim()}
                >
                  {addingFields.has(meta.field) ? 'Adding…' : 'Add'}
                </button>
              </form>
            </section>
          ))}
        </div>
      )}

      <p className={styles.settingsNote}>
        Renaming an option also updates the rows that already use it. Removing an option only
        stops it being offered for new picks — rows keep the value they hold. Other people see
        changes after their next reload.
      </p>
    </>
  );
}
