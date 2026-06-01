# End-to-End Tests (Playwright) — Sprint 4 Task 5

Browser E2E covering the seven critical journeys: **login · onboarding · discovery ·
connection · chat · event · account deletion**.

## Architecture

```
playwright.config.ts          # baseURL :8787, chromium, webServer (build + wrangler dev), globalSetup
tests/e2e/
  global-setup.ts             # mock-Google login as seeded member → storageState (.auth/seeded.json)
  fixtures.ts                 # seededPage/seededContext (authed) · freshPage/freshContext (unauth)
  support/auth.ts             # otpLogin · loginAsSeeded · completeProfileViaApi · freshPhone · uniqueIp
  pages/*.page.ts             # one Page Object per flow (selectors live here)
  specs/*.spec.ts             # one spec per flow
  .auth/  .report/  .output/  # storage state · HTML report · traces (git-ignored)
```

- **Real stack.** `wrangler dev --local` serves the built SPA (`./dist`) + worker
  (`/api/*`) + local D1/R2/Durable Objects on `http://127.0.0.1:8787`. No mocks.
- **Dev auth** (no real Google): OTP console provider returns `devCode` in the JSON
  response; `/api/auth/google/start` mints a mock session for the seeded member.
- **Seed data.** `.dev.vars` sets `DATABASE_EMPTY=true`, so the worker seeds ~10
  members + events on first `/api` hit — discovery/event specs have data.
- **Rate-limit isolation.** `/api/auth/*` is 5/60s per IP keyed on `cf-connecting-ip`.
  Every context sends a **unique** `cf-connecting-ip` (fixtures + `uniqueIp()`), so
  parallel specs never share a bucket.
- **Auth reuse.** Most specs reuse the seeded `storageState` (logged in once in
  global-setup) instead of re-authing — only login/onboarding/deletion auth fresh.

## Commands
```
npm run test:e2e            # full suite (boots the server automatically)
npm run test:e2e -- login   # one spec by name
npm run test:e2e:report     # open last HTML report
```

## Fixtures (import from `../fixtures`)
- `seededPage` / `seededContext` — authenticated as the seeded, **completed** member
  (has peers, events, and default chats). Use for discovery/connection/chat/event.
- `freshPage` / `freshContext` — brand-new **unauthenticated** context on a unique IP.
  Use for login, onboarding, and account-deletion (throwaway user).
- Arrange-via-API, Act-via-UI: you MAY set up preconditions with `context.request`
  against `/api/*` (e.g. create a peer, a connection, an event), then drive the
  journey through the UI. Assert through the UI.

## App-behavior facts every spec must respect
1. **Nav = header buttons:** `Home`, `Members`, `Inbox`, `Events`, `Profile`
   (`getByRole('button', { name })`). The bottom `<nav aria-label="Primary navigation">`
   is mobile-only and may be hidden on desktop.
2. **Guest mode is ON by default.** The route guard redirects `/login` → `/`, and
   renders `/onboarding` only when NOT browsing. To land on `/login` or `/onboarding`
   directly, disable it first:
   `await page.addInitScript(() => sessionStorage.setItem('instadate_guest_mode','false'));`
3. **Authed signal:** banner shows the member's name button and NO "Login with Google".

## Per-flow selector map (verified against the running app)
- **Login** (`/login`, component `LoginPage` in `src/main.jsx`): country `select.login-input`,
  `getByPlaceholder('Phone number')`, button `Send code`, info text `/Dev code: (\d{6})/`,
  `getByPlaceholder('6-digit code')`, button `Verify & sign in`. Email stage: button to
  switch to email, `getByPlaceholder('Enter your email')`, `Send Magic Link`, `devLink`.
- **Onboarding** (`/onboarding`, `src/OnboardingFlow.jsx`): single primary button per step —
  `Start the club pass` (step 0), `Continue` (most), `Enter Instadate` (final, index 12).
  Includes a phone-OTP step and GPS/notification permission steps (click through). On
  finish it calls `onComplete` → navigates to the feed.
- **Discovery** (`/members`, `MembersPage`): member cards; a `Connect` button (card +
  `MemberProfileModal`). Clicking `Connect` opens `VibeRequestModal`.
- **Connection** (`VibeRequestModal` + `/requests` `ConnectionRequestsPage`): note field +
  send button in the modal; accept/reject in the requests inbox. API: `POST
  /api/connections/request {toUserId,note}`, `/api/connections/:id/accept|reject`,
  `GET /api/connections`, `/api/connections/requests`.
- **Chat** (`/chat` inbox, `/chat/:slug` `ChatConversationPage`): composer
  `getByPlaceholder('Write a message...')` (enabled only when the chat is
  voice-verified — otherwise placeholder is `Verify voice to send messages`), send button
  `getByRole('button',{name:'Send message'})`. Sending requires an **accepted connection**
  (`assertCanSend`); set that up via API between two fresh users. Verification can be
  driven by the UI verify affordance or `PATCH /api/chats/:slug/verification`.
- **Event** (`/events` `EventsPage`, host at `/host` `HostEventPage`): event cards + an RSVP
  toggle button; review modal via `onReviewClick`. API: `POST /api/events`,
  `POST/DELETE /api/events/:id/attendees/me`.
- **Account deletion** (`/profile` → `ProfileDashboard` “Account & Data”): button
  `Delete account` → modal → `getByPlaceholder('DELETE')` type `DELETE` → button
  `Delete forever`. Calls `DELETE /api/account` then logs out → `/login`.
```
