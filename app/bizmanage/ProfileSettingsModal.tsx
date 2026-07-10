'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import styles from './bizmanage.module.css';
import { uploadAvatar, updateProfile, AVATAR_MAX_BYTES } from '@/lib/profile';

// Self-service profile editor opened from the sidebar account menu. Saving
// fires supabase.auth.updateUser, and the page's onAuthStateChange listener
// (USER_UPDATED) refreshes the session, so the sidebar avatar/name update
// without any manual refetch here.
export default function ProfileSettingsModal({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  const [fullName, setFullName] = useState(typeof meta.full_name === 'string' ? meta.full_name : '');
  const [username, setUsername] = useState(typeof meta.username === 'string' ? meta.username : '');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentAvatar = typeof meta.avatar_url === 'string' ? meta.avatar_url : '';
  const previewUrl = useMemo(
    () => (photo ? URL.createObjectURL(photo) : currentAvatar),
    [photo, currentAvatar]
  );
  useEffect(() => {
    return () => {
      if (photo && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [photo, previewUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePhotoChange = (file: File | null) => {
    setError('');
    if (file && file.size > AVATAR_MAX_BYTES) {
      setError('Photo is too large — 2 MB max.');
      return;
    }
    setPhoto(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let avatarUrl: string | undefined;
      if (photo) avatarUrl = await uploadAvatar(session.user.id, photo);
      await updateProfile({
        fullName,
        username,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(password ? { password } : {}),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
      setSaving(false);
    }
  };

  const initial = (fullName || session.user.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <form
        className={`${styles.modalCard} ${styles.modalCardSm}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>Profile settings</h3>
          <button className={styles.rowBtn} onClick={onClose} type="button">
            Cancel
          </button>
        </div>

        <div className={styles.profileEditAvatar}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Profile photo" className={styles.profileEditAvatarImg} />
          ) : (
            <span className={styles.profileEditAvatarFallback}>{initial}</span>
          )}
          <label className={styles.photoPickBtn}>
            {photo ? photo.name : 'Upload photo'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className={styles.photoPickInput}
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Full name</span>
          <input
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Username</span>
          <input
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. umar"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>New password</span>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            placeholder="Leave blank to keep the current one"
            autoComplete="new-password"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
