import { supabase } from './supabaseClient';

// Self-service profile updates for the signed-in user: display metadata via
// auth.updateUser and the profile photo via the public `avatars` bucket
// (storage RLS restricts writes to the caller's own `<user-id>/…` folder).

export interface ProfileUpdate {
  fullName?: string;
  username?: string;
  avatarUrl?: string;
  password?: string;
}

const AVATAR_BUCKET = 'avatars';
const AVATAR_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function client() {
  if (!supabase) {
    throw new Error('Supabase is not configured. See SUPABASE_SETUP.md.');
  }
  return supabase;
}

// Uploads to a fresh timestamped path so the returned public URL is new on
// every change — no CDN cache-busting needed.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error('Photo is too large — 2 MB max.');
  }
  const rawExt = file.name.split('.').pop()?.toLowerCase() ?? '';
  const ext = AVATAR_EXTENSIONS.includes(rawExt) ? rawExt : 'png';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await client()
    .storage.from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined, cacheControl: '3600' });
  if (error) throw new Error(error.message || 'Photo upload failed.');
  return client().storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function updateProfile(update: ProfileUpdate): Promise<void> {
  const data: Record<string, string> = {};
  if (update.fullName !== undefined) data.full_name = update.fullName.trim();
  if (update.username !== undefined) data.username = update.username.trim();
  if (update.avatarUrl !== undefined) data.avatar_url = update.avatarUrl;
  const { error } = await client().auth.updateUser({
    ...(update.password ? { password: update.password } : {}),
    ...(Object.keys(data).length > 0 ? { data } : {}),
  });
  if (error) throw new Error(error.message || 'Profile update failed.');
}
