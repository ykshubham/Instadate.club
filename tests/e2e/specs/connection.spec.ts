import { test, expect } from '../fixtures';
import { ConnectionPage } from '../pages/connection.page';
import { otpLogin, completeProfileViaApi, uniqueIpHeaders } from '../support/auth';

// CONNECTION flow E2E (see tests/e2e/README.md → "Connection").
//
// Pattern: Arrange-via-API, Act-via-UI, Assert-via-UI.
//   • Actor = the seeded member (seededPage / seededContext — authenticated,
//     completed, visible to peers).
//   • Peer B = a fresh, completed user in its OWN BrowserContext on its OWN IP
//     (uniqueIpHeaders) so the per-IP auth rate limit is never shared.
//
// App facts this spec relies on (verified against src/main.jsx):
//   - The discovery card → MemberProfileModal primary action is "Send Vibe Check"
//     which opens VibeRequestModal; sending POSTs /api/connections/request.
//   - /requests (ConnectionRequestsPage) lists incoming pending requests with
//     Accept / Decline; Accept POSTs /api/connections/<id>/accept.
//   - sendConnectionRequest rejects a self-target with HTTP 400 { error:'invalid_target' }.
//
// KNOWN SERVER BUG (report-only — see final report): every connection mutation that
// returns app state (`POST /api/connections/request`, `/accept`, `PATCH /api/profile`)
// currently 500s while ASSEMBLING that state (GET /api/state also 500s). The DB write
// itself succeeds; only the response throws. Because the SPA only shows the
// success toast / navigates on a 2xx, this spec drives the UI action and then asserts
// the PERSISTED effect through the read endpoints that still work
// (GET /api/connections, /api/connections/requests), rather than on the toast/redirect.

test.describe('connection flow', () => {
  // Run this file's tests sequentially in a single worker. The dev environment's
  // /api/state currently 500s (see report) which forces the SPA through a retry/
  // backoff settle on every page load; under 4 parallel browser workers the single
  // local D1 gets swamped and requests stall. Serial keeps the suite stable.
  test.describe.configure({ mode: 'serial' });

  test('seeded member sends a connection request via the UI', async ({
    seededPage,
    browser
  }) => {
    // Arrange a fresh, completed, discoverable target with a UNIQUE display name so
    // its discovery card and its incoming-requests are unambiguous.
    const uniqueName = `Ztestpeer${String(Date.now()).slice(-7)}`;
    const ctxT = await browser.newContext({ extraHTTPHeaders: uniqueIpHeaders() });
    try {
      await otpLogin(ctxT.request);
      await completeProfileViaApi(ctxT.request);
      // Re-PATCH the full mandatory set with a UNIQUE name + a vibe (the write persists
      // even though the response 500s). PATCH /api/profile rebuilds the row from the
      // body, so we must resend every mandatory field to keep the profile `completed`
      // (and thus discoverable). `vibe` is required for the discovery card to render —
      // MemberCard reads member.vibe.replace(...) — and the unique name disambiguates it.
      await ctxT.request.patch('/api/profile', {
        data: {
          profile: {
            fullName: uniqueName,
            age: '26',
            gender: 'female',
            intent: 'Friendship',
            city: 'Mumbai',
            bio: 'Automated end-to-end test target.',
            vibe: 'Cafe Hopper Vibe'
          }
        }
      });

      const connection = new ConnectionPage(seededPage);
      await connection.gotoMembers();

      // Open the target's profile → vibe modal → fill note → send.
      const card = connection.memberCardByName(uniqueName);
      await expect(card).toBeVisible();
      await connection.openMemberProfileByName(uniqueName);
      await connection.openVibeRequestModalFromProfile();
      await connection.sendVibeRequest('Coffee this week? Loved your vibe.');

      // UI confirmation: the request is recorded optimistically, so the vibe sheet
      // flips to its "sent" state — heading "Vibe Check Sent" and a disabled
      // "Already Sent" button. (The success toast is intentionally NOT asserted: it
      // auto-dismisses in ~2.4s and, under the known state-assembly 500, the app may
      // show the offline/degraded fallback toast instead — both are too transient to
      // assert reliably. The stable sheet state + the persisted-effect check below
      // are the durable signals.)
      await expect(connection.vibeAlreadySentButton()).toBeVisible();
      await expect(connection.vibeSheet().getByRole('heading', { name: /vibe check sent/i }))
        .toBeVisible();

      // Real outcome: the target now has a pending request from the seeded member
      // (canonical read path, unaffected by the state-assembly bug).
      await expect
        .poll(async () => {
          const r = await ctxT.request.get('/api/connections/requests');
          const requests = (await r.json()).requests as Array<{ from?: { id?: string } }>;
          return requests.some(req => Boolean(req.from?.id));
        })
        .toBe(true);
    } finally {
      await ctxT.close();
    }
  });

  test('seeded member accepts an incoming request from a fresh peer', async ({
    seededPage,
    seededContext,
    browser
  }) => {
    // The seeded user's id (target of B's request).
    const me = await seededContext.request.get('/api/auth/me');
    expect(me.ok()).toBeTruthy();
    const seededUserId = (await me.json()).user?.id as string;
    expect(seededUserId).toBeTruthy();

    // Peer B: own context, own IP, authenticated + completed (so it's visible and
    // allowed to send a request).
    const ctxB = await browser.newContext({ extraHTTPHeaders: uniqueIpHeaders() });
    try {
      const { userId: peerBId } = await otpLogin(ctxB.request);
      await completeProfileViaApi(ctxB.request);

      // A note unique to this run so we can pick B's card out of the inbox even if
      // other fresh test users share the default display name ("E2E Tester").
      const note = `connect-me-${Date.now()}`;
      await ctxB.request.post('/api/connections/request', {
        data: { toUserId: seededUserId, note }
      });
      // NOTE: this endpoint currently 500s for a freshly-created peer (the request
      // row IS written, but assembling the response state throws — see report).
      // So we assert the precondition through the canonical read path instead of
      // trusting the POST status: the request must now be pending for the seeded user.
      await expect
        .poll(async () => {
          const r = await seededContext.request.get('/api/connections/requests');
          const requests = (await r.json()).requests as Array<{ note: string }>;
          return requests.some(req => req.note === note);
        })
        .toBe(true);

      // Act in the seeded UI: open the requests inbox, find B's request, accept it.
      const connection = new ConnectionPage(seededPage);
      await connection.gotoRequests();

      const card = connection.requestCardByName(note);
      await expect(card).toBeVisible();
      await expect(card.getByText('E2E Tester')).toBeVisible();

      await connection.acceptRequestByName(note);

      // The accept write succeeds server-side (the request flips to 'accepted' and a
      // connection + chat are created). NOTE: the endpoint currently 500s while
      // assembling the response (see report); the client only navigates to /chat on a
      // 2xx, so we verify the outcome through the canonical read paths instead.
      await expect
        .poll(async () => {
          const conns = await seededContext.request.get('/api/connections');
          const list = (await conns.json()).connections as Array<{ other_id: string }>;
          return list.some(c => c.other_id === peerBId);
        })
        .toBe(true);

      // And the request is no longer pending: a reloaded inbox shows the card gone.
      await connection.gotoRequests();
      await expect(connection.requestCardByName(note)).toHaveCount(0);
    } finally {
      await ctxB.close();
    }
  });

  test('the API rejects a self-targeted connection request', async ({ seededContext }) => {
    const me = await seededContext.request.get('/api/auth/me');
    const seededUserId = (await me.json()).user?.id as string;
    expect(seededUserId).toBeTruthy();

    // sendConnectionRequest: toUserId === fromUserId → { ok:false, error:'invalid_target' }
    // surfaced by the route as HTTP 400 { error }.
    const res = await seededContext.request.post('/api/connections/request', {
      data: { toUserId: seededUserId, note: 'self' }
    });
    expect(res.ok()).toBeFalsy();
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe('invalid_target');
  });
});
