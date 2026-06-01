# STEP 12 — QA Execution

## Manual QA checklist (release gate)
### Auth
- [ ] Google/Email/Phone each → authed + intended route restored
- [ ] No cookie → `/api/profile` returns guest DTO/401, never real PII
- [ ] Expired/replayed OAuth state rejected; `//evil.com` redirect blocked
- [ ] Wrong OTP locks after 5; magic-link single-use/expiry
- [ ] Banned email → ban screen, no session; suspended → writes 403
- [ ] 401 mid-action → one silent refresh → fallback logout keeps route
- [ ] Two devices + sign-out-everywhere; reinstall restores
### Onboarding
- [ ] Cannot finish without name/age18+/gender/photo/intent/city
- [ ] Kill+resume at each step; offline during photo; goal/energy persisted
### Profile
- [ ] Correct state renders (logged-out/incomplete/complete/suspended/banned)
- [ ] Completion mandatory-aware; badges honest; no fake billing/safety copy
- [ ] >8MB/non-image/7th photo/profanity/<18 rejected; delete primary reassigns
### Discovery
- [ ] Blocked/rejected/banned never appear; guest gets sanitised DTO
- [ ] Filters narrow; zero-result empty state
### Connections
- [ ] request→accept→chat; mutual instant match; reject silent; 14d expiry
- [ ] block bidirectional + voids request; report → queue
### Chat
- [ ] Non-connection/non-member send → 403; realtime delivery; read/typing/online
- [ ] Block freezes both ways; peer deletion read-only; offline queue+dedup
### Events
- [ ] No oversell under concurrency; waitlist auto-promote; edit/cancel notify+refund
- [ ] Join unpublished→403; invite-only link denied
### Settings/Account
- [ ] Every setting persists + honoured; deactivate→reactivate; export complete
- [ ] Delete→grace→purge; cannot re-login post-grace; cannot unlink last method

## Automation checklist
- [ ] Unit: validators (age/email/phone/profile limits), completion calc, `visibleTo`, `assertCanSend`, redirect allowlist, state-hash.
- [ ] Integration (Worker + D1 test DB): auth flows, connection lifecycle, message authz, event concurrency (parallel join → no oversell), account deletion cascade.
- [ ] Security: automated no-PII-without-session test; rate-limit hit tests; suspended/banned write blocks.
- [ ] E2E (Playwright): onboarding happy path, login modal resume, request→accept→chat, event join+waitlist, delete account.
- [ ] Load: split endpoints + `/api/updates` under N concurrent clients; assert bounded query counts (no N+1).

## Definition of Done
- 100% manual gate checklist green; automation suite passing in CI; load test meets target p95; security tests pass.
