'use client';

import { useEffect, useState, FormEvent } from 'react';
import styles from '../bizmanage.module.css';
import { AdminUserRow, getUsers, createUser, updateUser, deleteUser } from '@/lib/adminUsers';
import { ALL_VIEWS, PERMISSION_GROUPS, PermissionGroup, ViewId } from '../Sidebar';
import { ScreenHead, TrashIcon } from './shared';

// Settings → Users: list every console user, edit their type (Admin/Member)
// and which pages they can open, set a new password, create users, and delete
// them. All writes go through the admin-users edge function (admin-gated,
// service role).
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

  const viewChecked = (u: AdminUserRow, id: ViewId): boolean =>
    u.views == null || u.views.includes(id);

  const saveViews = (u: AdminUserRow, next: ViewId[]) =>
    applyUpdate(u, { views: next }, { userId: u.id, views: next });

  const toggleView = (u: AdminUserRow, id: ViewId) =>
    saveViews(u, ALL_VIEWS.filter((v) => (v === id ? !viewChecked(u, v) : viewChecked(u, v))));

  // Group checkbox: everything on -> clear the group, otherwise grant it all.
  const toggleGroup = (u: AdminUserRow, group: PermissionGroup) => {
    const ids = group.views.map((v) => v.id);
    const allOn = ids.every((id) => viewChecked(u, id));
    saveViews(u, ALL_VIEWS.filter((v) => (ids.includes(v) ? !allOn : viewChecked(u, v))));
  };

  const resetPassword = (u: AdminUserRow) => {
    const entered = window.prompt(`New password for ${u.email} (at least 8 characters):`);
    if (entered === null) return;
    if (entered.length < 8) {
      setSaveError(`Couldn't set a password for ${u.email}: at least 8 characters required.`);
      return;
    }
    applyUpdate(u, {}, { userId: u.id, password: entered });
  };

  const removeUser = async (u: AdminUserRow) => {
    if (!window.confirm(`Delete ${u.email}? They will no longer be able to sign in.`)) return;
    setSaveError('');
    setSaving(u.id, true);
    try {
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'delete failed';
      setSaveError(`Couldn't delete ${u.email}: ${msg}`);
    } finally {
      setSaving(u.id, false);
    }
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
          <table className={`${styles.table} ${styles.tableFlexPenult}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Activity</th>
                <th>Visible pages</th>
                <th className={styles.actionsHead} aria-label="Actions" />
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
                        <div className={styles.permGroups}>
                          {PERMISSION_GROUPS.map((group) => {
                            const multi = group.views.length > 1;
                            const onCount = group.views.filter((v) =>
                              viewChecked(u, v.id)
                            ).length;
                            return (
                              <div key={group.key}>
                                <label
                                  className={`${styles.permItem} ${
                                    multi ? styles.permGroupHead : ''
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={onCount === group.views.length}
                                    ref={(el) => {
                                      // A partially-granted group shows as indeterminate.
                                      if (el) el.indeterminate = multi && onCount > 0 && onCount < group.views.length;
                                    }}
                                    disabled={saving}
                                    onChange={() =>
                                      multi
                                        ? toggleGroup(u, group)
                                        : toggleView(u, group.views[0].id)
                                    }
                                  />
                                  <span>{group.label}</span>
                                </label>
                                {multi && (
                                  <div className={styles.permGroupItems}>
                                    {group.views.map((v) => (
                                      <label key={v.id} className={styles.permItem}>
                                        <input
                                          type="checkbox"
                                          checked={viewChecked(u, v.id)}
                                          disabled={saving}
                                          onChange={() => toggleView(u, v.id)}
                                        />
                                        <span>{v.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.rowBtn}
                          type="button"
                          disabled={saving}
                          onClick={() => resetPassword(u)}
                        >
                          Set password
                        </button>
                        {!self && (
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            type="button"
                            disabled={saving}
                            title={`Delete ${u.email}`}
                            onClick={() => removeUser(u)}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className={styles.settingsNote}>
        Role and page changes take effect the next time the user opens or reloads the console.
        A new password applies from their next sign-in.
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
