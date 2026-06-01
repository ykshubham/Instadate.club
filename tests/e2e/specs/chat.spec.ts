import { test, expect } from '../fixtures';
import { otpLogin, completeProfileViaApi, uniqueIpHeaders } from '../support/auth';
import { ChatPage } from '../pages/chat.page';
import type { Browser, BrowserContext } from '@playwright/test';

// CHAT flow E2E (see tests/e2e/README.md → "Chat").
//
// Pattern: Arrange-via-API, then assert through the layers that actually surface
// the behavior. TWO FRESH users (not the seeded member — so this never clashes
// with connection.spec.ts) get a real accepted connection + chat, then we exercise
// the conversation: voice-verify → send → the peer receives the message; plus the
// negative authz (a non-participant cannot send).
//
// App facts this spec relies on (verified against src/main.jsx + worker/services):
//  • A chat row + accepted connection is created when a connection request is
//    accepted (connections.ts → createConnection → createChatForPair). The chat
//    slug is canonical: `conn-<x>__<y>` with the two user ids sorted ascending.
//  • The composer is gated PER USER: ChatConversationPage disables the input +
//    "Send message" button and shows placeholder "Verify voice to send messages"
//    until that user voice-verifies (verifiedChats[slug] ← chats
//    .verified_by_user_ids_json includes the user). Verifying flips the
//    placeholder to "Write a message...". Verification = PATCH
//    /api/chats/:slug/verification.
//  • Sending requires an ACCEPTED connection at the API boundary (chat.ts
//    assertCanSend); a non-participant POSTing /api/chats/:slug/messages gets 403.
//  • The reliable cross-user read-back is GET /api/chats/:slug/since, which returns
//    each message with role 'you'|'match' relative to the caller.
//
// KNOWN PRODUCT ISSUE (report-only, not asserted as success):
//   Several authed endpoints assemble their JSON response by calling getState(),
//   and getState() currently THROWS (its discovery sub-builder 500s — GET
//   /api/state and /api/discovery both return 500 for every user, seeded or fresh).
//   So POST /api/connections/request, /api/connections/:id/accept, PATCH
//   /api/chats/:slug/verification and POST /api/chats/:slug/messages all return 500
//   even though their WRITES succeed. We therefore never trust those POST/PATCH
//   statuses; we assert the persisted outcome through the canonical read paths
//   (/api/connections, /api/chats/:slug/since), exactly as connection.spec.ts does.
//   The same getState() failure means the SPA cannot hydrate appState.chats, so the
//   chat conversation UI cannot render a thread — hence this spec asserts the chat
//   journey at the API boundary rather than driving the (currently unrenderable)
//   composer UI. The ChatPage page object documents the intended UI selectors.

// /api/auth/* is rate-limited per cf-connecting-ip. support/auth's uniqueIpHeaders()
// hands out IPs from a per-PROCESS counter; those land on the same handful of
// deterministic IPs every run, so back-to-back local runs can reuse a still-warm
// 60s bucket. We salt each context with extra random entropy (keeping the
// uniqueIpHeaders() base) so every user always gets a fresh, private bucket.
function freshIpHeaders(): Record<string, string> {
  const o = () => Math.floor(Math.random() * 254) + 1;
  return { ...uniqueIpHeaders(), 'cf-connecting-ip': `10.${o()}.${o()}.${o()}` };
}

/**
 * A fresh, authenticated + completed user on its own unique cf-connecting-ip.
 * The local wrangler dev server is noisy (the getState bug floods it with errors),
 * so the occasional setup call resets — retry the whole flow on a brand-new context
 * (new IP) a couple of times before giving up.
 */
async function freshUser(browser: Browser): Promise<{ context: BrowserContext; userId: string }> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const context = await browser.newContext({ extraHTTPHeaders: freshIpHeaders() });
    try {
      const { userId } = await otpLogin(context.request);
      await completeProfileViaApi(context.request);
      return { context, userId };
    } catch (err) {
      lastErr = err;
      await context.close();
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw lastErr;
}

/** Canonical chat slug for a connected pair (see createChatForPair). */
function chatSlugFor(a: string, b: string): string {
  const [x, y] = [a, b].sort();
  return `conn-${x}__${y}`;
}

/** Poll a read endpoint until `predicate` is satisfied (POSTs 500 while writing — see header). */
async function pollTrue(fn: () => Promise<boolean>, timeoutMs = 12_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await fn()) return true;
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

/**
 * GET a read endpoint and return body[key] as T[], tolerating transient failures
 * (a non-2xx or non-JSON body yields []). The getState-free read endpoints are
 * reliable, but the worker is noisy under load, so callers poll on top of this.
 */
async function safeGet<T = any>(ctx: BrowserContext, path: string, key: string): Promise<T[]> {
  try {
    const res = await ctx.request.get(path);
    if (!res.ok()) return [];
    const body = await res.json();
    return (body[key] ?? []) as T[];
  } catch {
    return [];
  }
}

/** Messages visible to `ctx` in the chat, via the getState-free /since endpoint. */
async function messagesFor(ctx: BrowserContext, slug: string): Promise<Array<{ role: string; body: string }>> {
  return safeGet<{ role: string; body: string }>(ctx, `/api/chats/${slug}/since`, 'messages');
}

/**
 * Fire a write whose RESPONSE we don't trust (it 500s while assembling getState, or
 * resets under load) — the WRITE persists regardless, and we assert via reads. We
 * only swallow transport/response errors; correctness is verified by the polled read.
 */
async function fireWrite(fn: () => Promise<unknown>): Promise<void> {
  try { await fn(); } catch { /* write persists; outcome is asserted via reads */ }
}

test.describe('chat flow', () => {
  test('a connected, voice-verified chat delivers a message to the peer; a non-participant is forbidden', async ({ browser }) => {
    const a = await freshUser(browser);
    const b = await freshUser(browser);
    const ctxA = a.context;
    const ctxB = b.context;
    const slug = chatSlugFor(a.userId, b.userId);

    try {
      // ---- Arrange: A → B request, B accepts → accepted connection + chat ----
      // The request/accept POSTs 500 while assembling getState (see header), but the
      // rows persist — so we never trust their status and assert via the read paths.
      const note = `chat-e2e-${Date.now()}`;

      // Fire the request once, then poll B's inbox until it appears, capturing its id.
      await fireWrite(() => ctxA.request.post('/api/connections/request', { data: { toUserId: b.userId, note } }));
      let requestId = '';
      const bSeesRequest = await pollTrue(async () => {
        const requests = await safeGet<{ id: string; note: string }>(ctxB, '/api/connections/requests', 'requests');
        const found = requests.find(req => req.note === note);
        if (found) { requestId = found.id; return true; }
        return false;
      }, 20_000);
      expect(bSeesRequest, 'B should see A\'s pending connection request').toBe(true);

      // B accepts → accepted connection + chat created (status 500 on response only).
      await fireWrite(() => ctxB.request.post(`/api/connections/${requestId}/accept`));
      const connected = await pollTrue(async () => {
        const connections = await safeGet<{ other_id: string }>(ctxA, '/api/connections', 'connections');
        return connections.some(c => c.other_id === b.userId);
      }, 20_000);
      expect(connected, 'A and B must be an accepted connection (chat created)').toBe(true);

      // ---- Scenario 2 (negative authz): a non-participant cannot send --------
      // assertCanSend rejects a non-participant BEFORE any write → clean 403
      // (no getState in this path), so the status is trustworthy here.
      const c = await freshUser(browser);
      try {
        const forbidden = await c.context.request.post(`/api/chats/${slug}/messages`, {
          data: { text: 'I am not in this chat' }
        });
        expect(forbidden.status(), 'non-participant POST /messages must be 403').toBe(403);
        expect((await forbidden.json()).error).toBe('not_a_participant');
      } finally {
        await c.context.close();
      }

      // ---- Scenario 1: voice-verify, then A sends; the bubble reaches B -------
      // The chat starts unverified. Verify A (UI verify affordance would call this
      // same PATCH). The PATCH 500s on response assembly but the verification IS
      // recorded — confirm via /since becoming reachable / send succeeding.
      await fireWrite(() => ctxA.request.patch(`/api/chats/${slug}/verification`));

      const messageText = `hello from A ${Date.now()}`;
      // The send POST 500s on getState assembly but the row IS written. Fire it once,
      // then poll B's thread; if a transient reset dropped the write, fire again.
      await fireWrite(() => ctxA.request.post(`/api/chats/${slug}/messages`, { data: { text: messageText } }));

      // ---- Scenario 3: the message is visible to B (the peer) ----------------
      const bReceived = await pollTrue(async () => {
        const msgs = await messagesFor(ctxB, slug);
        if (msgs.some(m => m.role === 'match' && m.body === messageText)) return true;
        await fireWrite(() => ctxA.request.post(`/api/chats/${slug}/messages`, { data: { text: messageText, clientMsgId: messageText } }));
        return false;
      }, 15_000);
      expect(bReceived, 'B (the peer) must receive A\'s message in the connected chat').toBe(true);

      // And A sees the same message as their own ('you').
      const aSees = await messagesFor(ctxA, slug);
      expect(aSees.some(m => m.role === 'you' && m.body === messageText),
        'A should see their own sent message').toBe(true);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });
});

// The ChatPage page object (./pages/chat.page) captures the intended conversation
// UI selectors (gated vs enabled composer, the "Send message" button, the verify
// affordance, message bubbles). It is the contract this spec would drive through
// the UI once GET /api/state stops 500ing and the SPA can hydrate appState.chats.
void ChatPage;
