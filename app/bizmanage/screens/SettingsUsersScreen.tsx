'use client';

import { useEffect, useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import { AdminUserRow, getUsers, createUser, updateUser } from '@/lib/adminUsers';
import { ALL_SECTIONS, SECTION_LABELS, SectionKey } from '../Sidebar';
import { ScreenHead } from './shared';

// Settings → Users: list every console user, edit their type (Admin/Member)
// and which sidebar sections they can see, and create new users. All writes
// go through the admin-users edge function (admin-gated, service role).
export default function SettingsUsersScreen({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState('');

  // Add-user form
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) => setListError(err instanceof Error ? err.message : 'Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  const setSaving = (id: string, on: boolean) =>
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  // Optimistic update: swap in `next`, call the edge function, revert on error.
  const applyUpdate = async (
    user: AdminUserRow,
    next: Partial<AdminUserRow>,
    payload: Parameters<typeof updateUser>[0]
  ) => {
    setSaveError('');
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...next } : u)));
    setSaving(user.id, true);
    try {
      const saved = await updateUser(payload);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? saved : u)));
    } catch (err) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
      const msg = err instanceof Error ? err.message : 'save failed';
      setSaveError(`Couldn't update ${user.email}: ${msg}`);
    } finally {
      setSaving(user.id, false);
    }
  };

  const sectionChecked = (u: AdminUserRow, key: SectionKey): boolean =>
    u.sections == null || u.sections.includes(key);

  const toggleSection = (u: AdminUserRow, key: SectionKey) => {
    const next = ALL_SECTIONS.filter((k) =>
      k === key ? !sectionChecked(u, k) : sectionChecked(u, k)
    );
    applyUpdate(u, { sections: next }, { userId: u.id, sections: next });
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');
    try {
      const created = await createUser({
        firstName: firstName.trim(),
        email: email.trim(),
        password,
        isAdmin,
      });
      setUsers((prev) => [...prev, created]);
      setFirstName('');
      setEmail('');
      setPassword('');
      setIsAdmin(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <ScreenHead
        title="Users"
        meta={loading ? undefined : `${users.length} user${users.length === 1 ? '' : 's'}`}
      />

      {saveError && (
        <div className={styles.errorBar} role="alert">
          <span>{saveError}</span>
          <button className={styles.errorDismiss} onClick={() => setSaveError('')} type="button">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <p className={styles.pageMeta}>Loading users…</p>
      ) : listError ? (
        <p className={styles.error}>{listError}</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.tableFlexLast}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Activity</th>
                <th>Visible sections</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === currentUserId;
                const saving = savingIds.has(u.id);
                return (
                  <tr key={u.id} className={saving ? styles.rowSaving : undefined}>
                    <td>
                      <input
                        className={`${styles.ghostInput} ${styles.cellMinM}`}
                        type="text"
                        defaultValue={u.firstName}
                        placeholder="First name"
                        aria-label={`First name for ${u.email}`}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          if (value !== u.firstName) {
                            applyUpdate(u, { firstName: value }, { userId: u.id, firstName: value });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td className={styles.userEmail}>{u.email}</td>
                    <td>
                      <div className={styles.selectCell}>
                        <span
                          className={`${styles.pill} ${
                            u.role === 'admin' ? styles.accountTBB : styles.badgeNeutral
                          }`}
                        >
                          {u.role}
                        </span>
                        <select
                          className={styles.overlaySelect}
                          value={u.role}
                          disabled={self}
                          title={self ? "You can't change your own role." : undefined}
                          aria-label={`Role for ${u.email}`}
                          onChange={(e) => {
                            const role = e.target.value as 'admin' | 'member';
                            applyUpdate(u, { role }, { userId: u.id, role });
                          }}
                        >
                          <option value="admin">admin</option>
                          <option value="member">member</option>
                        </select>
                      </div>
                    </td>
                    <td className={styles.userMeta}>
                      Created {new Date(u.createdAt).toLocaleDateString()}
                      <br />
                      {u.lastSignInAt
                        ? `Last sign-in ${new Date(u.lastSignInAt).toLocaleDateString()}`
                        : 'Never signed in'}
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className={styles.muted}>Always full access</span>
                      ) : (
                        <div className={styles.permGrid}>
                          {ALL_SECTIONS.map((key) => (
                            <label key={key} className={styles.permItem}>
                              <input
                                type="checkbox"
                                checked={sectionChecked(u, key)}
                                disabled={saving}
                                onChange={() => toggleSection(u, key)}
                              />
                              <span>{SECTION_LABELS[key]}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className={styles.settingsNote}>
        Role and section changes take effect on the user&apos;s next sign-in or token refresh
        (within about an hour).
      </p>

      <form className={styles.addUserForm} onSubmit={handleCreate}>
        <h4 className={styles.addUserTitle}>Add user</h4>
        <label className={styles.field}>
          <span className={styles.label}>First name</span>
          <input
            type="text"
            className={styles.input}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Teammate's first name"
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@thebeautyboxmedia.com"
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
            minLength={8}
            placeholder="At least 8 characters"
            required
          />
        </label>
        <label className={styles.checkboxRow}>
          <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
          <span>Administrator (can manage users)</span>
        </label>
        {formError && <p className={styles.error}>{formError}</p>}
        <button type="submit" className="btn btn-primary" disabled={creating}>
          {creating ? 'Creating…' : 'Create user'}
        </button>
      </form>
    </>
  );
}
