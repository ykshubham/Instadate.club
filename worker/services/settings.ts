import type { D1Database } from '@cloudflare/workers-types';
import { recomputeTrustMetrics } from './trust';

export interface UserSettings {
  showAge: boolean;
  showDistance: boolean;
  incognitoMode: boolean;
  emailNotifications: boolean;
  connectionNotifications: boolean;
  eventNotifications: boolean;
}

/**
 * Retrieves the settings for a user. Creates defaults if they do not exist.
 */
export async function getSettings(db: D1Database, userId: string): Promise<UserSettings> {
  let settings = await db.prepare('SELECT * FROM user_settings WHERE user_id = ?').bind(userId).first<any>();
  
  if (!settings) {
    await db.prepare(
      `INSERT OR IGNORE INTO user_settings (
         user_id, show_age, show_distance, incognito_mode,
         email_notifications, connection_notifications, event_notifications
       ) VALUES (?, 1, 1, 0, 1, 1, 1)`
    ).bind(userId).run();
    
    settings = await db.prepare('SELECT * FROM user_settings WHERE user_id = ?').bind(userId).first<any>();
  }
  
  return {
    showAge: Boolean(settings.show_age),
    showDistance: Boolean(settings.show_distance),
    incognitoMode: Boolean(settings.incognito_mode),
    emailNotifications: Boolean(settings.email_notifications),
    connectionNotifications: Boolean(settings.connection_notifications),
    eventNotifications: Boolean(settings.event_notifications)
  };
}

/**
 * Updates the user's settings.
 */
export async function updateSettings(db: D1Database, userId: string, updates: Partial<UserSettings>): Promise<void> {
  // Ensure default row exists
  await getSettings(db, userId);

  const fields: string[] = [];
  const binds: any[] = [];

  if (updates.showAge !== undefined) {
    fields.push('show_age = ?');
    binds.push(updates.showAge ? 1 : 0);
  }
  if (updates.showDistance !== undefined) {
    fields.push('show_distance = ?');
    binds.push(updates.showDistance ? 1 : 0);
  }
  if (updates.incognitoMode !== undefined) {
    fields.push('incognito_mode = ?');
    binds.push(updates.incognitoMode ? 1 : 0);
  }
  if (updates.emailNotifications !== undefined) {
    fields.push('email_notifications = ?');
    binds.push(updates.emailNotifications ? 1 : 0);
  }
  if (updates.connectionNotifications !== undefined) {
    fields.push('connection_notifications = ?');
    binds.push(updates.connectionNotifications ? 1 : 0);
  }
  if (updates.eventNotifications !== undefined) {
    fields.push('event_notifications = ?');
    binds.push(updates.eventNotifications ? 1 : 0);
  }

  if (fields.length === 0) return;

  binds.push(userId);
  
  await db.prepare(
    `UPDATE user_settings
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(...binds).run();
}

/**
 * Updates user verification flags and recalculates the verification level.
 */
export async function verifyAction(
  db: D1Database,
  userId: string,
  type: 'phone' | 'instagram' | 'selfie'
): Promise<void> {
  const profile = await db.prepare(
    'SELECT phone_verified, instagram_verified, profile_verified FROM profiles WHERE user_id = ?'
  ).bind(userId).first<any>();

  if (!profile) return;

  let phone = Number(profile.phone_verified);
  let instagram = Number(profile.instagram_verified);
  let selfie = Number(profile.profile_verified);

  if (type === 'phone') phone = 1;
  if (type === 'instagram') instagram = 1;
  if (type === 'selfie') selfie = 1;

  let level = 'none';
  if (phone && instagram && selfie) {
    level = 'highly_verified';
  } else if (phone && selfie) {
    level = 'identity';
  } else if (phone) {
    level = 'basic';
  }

  await db.prepare(
    `UPDATE profiles
     SET phone_verified = ?,
         instagram_verified = ?,
         profile_verified = ?,
         verification_level = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(phone, instagram, selfie, level, userId).run();

  // Keep trust metrics in sync via authoritative recalculation
  await recomputeTrustMetrics(db, userId);
}
