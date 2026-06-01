// Shared test helpers for the worker-pool suites (integration / api / security).
// Everything here talks to the real Miniflare D1 via `env` from cloudflare:test.
import { env, SELF } from 'cloudflare:test';
import { SESSION_COOKIE } from '../worker/auth';

export interface SeedUserOpts {
  id: string;
  email?: string | null;
  fullName?: string;
  status?: 'active' | 'suspended' | 'banned' | 'deactivated';
  role?: 'member' | 'moderator' | 'admin';
  completed?: boolean;
  verificationLevel?: string;
  phoneVerified?: boolean;
}

/** Insert a user + matching profile row. Returns the user id. */
export async function seedUser(opts: SeedUserOpts): Promise<string> {
  const {
    id,
    email = `${id}@test.local`,
    fullName = id,
    status = 'active',
    role = 'member',
    completed = true,
    verificationLevel = 'none',
    phoneVerified = false
  } = opts;

  await env.DB.prepare(
    `INSERT INTO users (id, email, full_name, auth_provider, completed, status, role, profile_json)
     VALUES (?, ?, ?, 'test', ?, ?, ?, '{}')`
  ).bind(id, email, fullName, completed ? 1 : 0, status, role).run();

  await env.DB.prepare(
    `INSERT INTO profiles (user_id, full_name, age, city, gender, intent, completed, verification_level, phone_verified)
     VALUES (?, ?, '25', 'Mumbai', 'female', 'Friendship', ?, ?, ?)`
  ).bind(id, fullName, completed ? 1 : 0, verificationLevel, phoneVerified ? 1 : 0).run();

  return id;
}

/** Create a live (non-expired) session for a user; returns the session id. */
export async function createSession(userId: string, sessionId = `sess-${userId}-${cryptoId()}`): Promise<string> {
  await env.DB.prepare(
    "INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, datetime(CURRENT_TIMESTAMP, '+30 days'))"
  ).bind(sessionId, userId).run();
  return sessionId;
}

/** Build a Cookie header value carrying the session. */
export function cookieFor(sessionId: string): string {
  return `${SESSION_COOKIE}=${sessionId}`;
}

/** Seed a user AND an authenticated session in one call. */
export async function seedAuthed(opts: SeedUserOpts): Promise<{ userId: string; cookie: string; sessionId: string }> {
  const userId = await seedUser(opts);
  const sessionId = await createSession(userId);
  return { userId, sessionId, cookie: cookieFor(sessionId) };
}

/** Create an accepted connection + chat between two users (canonical a<b ordering). */
export async function connect(a: string, b: string): Promise<{ chatId: string; slug: string }> {
  const [x, y] = a < b ? [a, b] : [b, a];
  const chatId = `chat-${x}-${y}`;
  const slug = `${x}-${y}`;
  await env.DB.prepare(
    'INSERT INTO chats (id, slug, participant_a_user_id, participant_b_user_id) VALUES (?, ?, ?, ?)'
  ).bind(chatId, slug, x, y).run();
  await env.DB.prepare(
    "INSERT INTO connections (id, user_a_id, user_b_id, chat_id, status) VALUES (?, ?, ?, ?, 'accepted')"
  ).bind(`conn-${x}-${y}`, x, y, chatId).run();
  return { chatId, slug };
}

/** Block target from the perspective of blocker. */
export async function block(blocker: string, target: string): Promise<void> {
  await env.DB.prepare(
    'INSERT OR IGNORE INTO user_blocks (user_id, blocked_user_id) VALUES (?, ?)'
  ).bind(blocker, target).run();
}

export interface ApiOpts {
  method?: string;
  cookie?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

/** Fire a request at the worker via SELF.fetch. JSON-encodes object bodies. */
export function api(path: string, opts: ApiOpts = {}): Promise<Response> {
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  if (opts.cookie) headers.cookie = opts.cookie;
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
  }
  return SELF.fetch(`https://example.com${path}`, { method: opts.method || 'GET', headers, body });
}

/** Count helper for assertions against the DB. */
export async function count(sql: string, ...binds: unknown[]): Promise<number> {
  const row = await env.DB.prepare(sql).bind(...binds).first<{ n: number }>();
  return Number(row?.n ?? 0);
}

function cryptoId(): string {
  return Math.random().toString(36).slice(2, 10);
}
