# Automated Testing — Sprint 4 Task 4

Automated test suite for the Instadate worker: **unit · integration · API · security**.
Runner: [Vitest 3.2] with [`@cloudflare/vitest-pool-workers`] — worker-pool tests
execute inside the real `workerd` runtime against an in-memory Miniflare **D1**
with every migration in `./migrations` applied per file.

## Commands

| Script | What it runs |
|---|---|
| `npm test` | All suites (unit + worker), once. |
| `npm run test:unit` | Pure-function unit suite only (fast, no DB). |
| `npm run test:worker` | Integration + API + security (workerd + D1). |
| `npm run test:coverage` | All suites + Istanbul coverage with threshold gates. |
| `npm run test:watch` | Watch mode. |

## Structure

```
vitest.config.ts            # two projects: `unit` (forks/node) + `worker` (workers pool)
tests/
  apply-migrations.ts       # beforeAll: applies ./migrations to the test D1
  env.d.ts                  # types for cloudflare:test ProvidedEnv (DB, R2, DO, bindings)
  helpers.ts                # seedUser / seedAuthed / createSession / connect / block / api() / count()
  unit/                     # PURE functions — import worker source directly, no bindings
    normalize-phone.test.ts   redirect.test.ts     cookies.test.ts
    authz-gate.test.ts        trust-score.test.ts  ratelimit-response.test.ts  dto.test.ts
  integration/              # service functions vs real D1 (env.DB)
    chat-authz.test.ts        visibility.test.ts   ratelimit.test.ts
    connections.test.ts       moderation.test.ts   admin.test.ts
  api/                      # HTTP routes via SELF.fetch
    auth-me.test.ts           otp.test.ts          chat-messages.test.ts
    chat-since-delete.test.ts reports.test.ts      admin-routes.test.ts  updates.test.ts
  security/                 # adversarial / authz / privacy
    no-pii.test.ts            open-redirect.test.ts cookie-flags.test.ts
    status-gates.test.ts      rate-limit.test.ts    admin-authz.test.ts   otp-lockout.test.ts
```

**148 tests** across 27 files: 55 unit · 50 integration · 24 API · 18 security (+ minor).

## What each layer covers (maps to `12-qa.md` automation checklist)

- **Unit** — validators & pure logic: `normalizePhone`, `safeRedirect` (open-redirect
  allowlist), cookie builders + flags, `base64UrlEncode`, `requireAuthedActive` gate,
  `calculateTrustScore` weighting/tiers, `sanitizeProfile`, `rateLimitResponse`.
- **Integration** — services against D1: `assertCanSend` (membership/connection/block/
  status), `visibleTo`/`hiddenUserIds`, `checkRateLimit` atomicity + window reset +
  `pruneRateLimits`, connection lifecycle (request→accept→chat, mutual match, self/
  blocked/dup), `setAccountStatus`/`createReport`/`listReports`/`resolveReport`,
  admin role resolution + role grant + event moderation + audit log.
- **API** — routes via `SELF.fetch`: `/auth/me`, OTP start/verify, chat send authz +
  idempotency, `/chats/:slug/since`, soft-delete `DELETE /messages/:id`, `/reports`,
  admin routes, `/updates` delta.
- **Security** — no-PII-without-session, no-PII in member DTO, open-redirect blocked,
  cookie flags (HttpOnly/SameSite/Secure), suspended→writes-403/reads-ok, banned→all-403,
  rate-limit fires (429 + Retry-After), admin/moderator authorization, OTP brute-force lockout.

## Coverage targets (gated in `vitest.config.ts`)

Coverage is scoped to the security-critical + core service surface. `worker/index.ts`
(the 3k-line router) is exercised end-to-end by the API/security suites but is **not**
line-gated (gating a monolith of untested feature routes would force a meaningless floor).

**Global floor (gated set):** lines 82% · statements 82% · functions 85% · branches 68%.
**Achieved:** lines ~87% · statements ~85% · functions ~91% · branches ~69%.

| Module | Lines | Funcs | Branch | Role |
|---|---|---|---|---|
| `dto.ts` | 100 | 100 | 100 | PII sanitiser |
| `visibility.ts` | 100 | 100 | 95 | block/ban visibility |
| `services/chat.ts` | 100 | 100 | 85 | message authz |
| `services/moderation.ts` | 95 | 100 | 90 | status/reports |
| `auth.ts` | 90 | 95 | 85 | sessions/cookies/redirect |
| `services/connections.ts` | 90 | 90 | 60 | consent handshake |
| `services/ratelimit.ts` | 90 | 100 | 65 | throttling |
| `services/otp.ts` | 85 | 100 | 60 | phone auth |
| `services/trust.ts` | 72 | 75 | 60 | trust scoring |
| `authz.ts` | 70 | 60 | 65 | write/status gates |
| `services/admin.ts` | 70 | 80 | 55 | roles/audit |

Per-file gates are set just under current actuals so any regression fails CI.

## Notes
- Test D1s are deterministic: `DATABASE_EMPTY` is forced `false` in the test env so the
  dev auto-seeder never runs. Each test file gets isolated storage.
- The `EBUSY: Unable to remove temporary directory` lines on Windows are Miniflare
  temp-dir cleanup warnings on shutdown — not failures (run exits 0).
- `ADMIN_USER_IDS` is bound to `admin-seed` in the test env; seed a user with that id to
  exercise admin routes.
