import { D1Database } from '@cloudflare/workers-types';

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  session_id: string | null;
  event_name: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata_json: string | null;
  created_at: string;
}

export async function logEvent(
  db: D1Database,
  params: {
    user_id: string | null;
    session_id?: string | null;
    event_name: string;
    entity_type?: string | null;
    entity_id?: string | null;
    metadata?: Record<string, any> | null;
  }
): Promise<string> {
  const eventId = `evt-${crypto.randomUUID()}`;
  const metadataJson = params.metadata ? JSON.stringify(params.metadata) : null;
  
  try {
    await db.prepare(`
      INSERT INTO analytics_events (id, user_id, session_id, event_name, entity_type, entity_id, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      eventId,
      params.user_id,
      params.session_id || null,
      params.event_name,
      params.entity_type || null,
      params.entity_id || null,
      metadataJson
    ).run();
  } catch (err) {
    console.error('Failed to log analytics event:', err);
  }

  return eventId;
}

export async function getRecentActivityFeed(db: D1Database, limit = 50): Promise<any[]> {
  const { results } = await db.prepare(`
    SELECT ae.*, u.full_name, u.avatar_url 
    FROM analytics_events ae
    LEFT JOIN users u ON ae.user_id = u.id
    ORDER BY ae.created_at DESC
    LIMIT ?
  `).bind(limit).all();

  return results.map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    session_id: r.session_id,
    event_name: r.event_name,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    metadata: r.metadata_json ? JSON.parse(r.metadata_json) : null,
    created_at: r.created_at,
    user: r.user_id ? {
      fullName: r.full_name || 'Anonymous User',
      avatarUrl: r.avatar_url || ''
    } : null
  }));
}
