# Phase 13 — QA Plan & Launch Readiness

Scenario key: **(+)** positive · **(−)** negative · **(E)** edge.

## 1. Authentication
- (+) Google login → authed → intended route restored.
- (+) Email magic-link round-trip; phone OTP success sets verification.
- (−) Expired/replayed OAuth state rejected; wrong OTP locks after 5; expired magic-link rejected.
- (−) `redirectTo=//evil.com` blocked; banned email gets ban screen, no session.
- (E) 401 mid-action → silent refresh → fallback logout preserves route; two-device sessions + sign-out-everywhere; reinstall restores.
- **Security:** confirm no unauthenticated request resolves to a real user (A1); cookie flags HttpOnly/Secure/SameSite; rate limits fire.

## 2. Onboarding
- (+) Full happy path reaches feed; all data persisted.
- (−) Cannot finish without name/age(18+)/gender/photo/intent/city.
- (E) Resume after kill at each step; offline during photo; permission denials degrade gracefully; goal/energy persisted (G3).

## 3. Profile
- (+) Create/publish; completion meter reflects mandatory+quality (G4); honest badges.
- (−) >8MB, non-image, 7th photo, profanity all rejected; <18 blocked.
- (E) Delete primary reassigns; last photo deletion drops from discovery; concurrent edits consistent; R2 outage handled.

## 4. Access control (per Phase 6 matrix)
- (+) Each principal can do exactly its allowed actions.
- (−) Guest/incomplete blocked from gated writes server-side (not just UI); suspended→403 writes; banned→403 all.
- (E) Crafted direct API calls bypassing UI are rejected (E2, A1).

## 5. Connections
- (+) Request → recipient inbox → accept → chat opens; mutual like = instant match.
- (−) Request to self/blocked/unpublished rejected; duplicate request blocked.
- (E) Expiry at 14d; recipient deletes before accept; unmatch freezes chat; reject hidden from sender.

## 6. Chat
- (+) Connected users message; realtime delivery; read receipts/typing/online (when enabled).
- (−) Non-connection/non-member send → 403; empty/oversized/spam rejected.
- (E) Block mid-chat freezes both ways; peer deletion → read-only; offline queue + dedup; report → queue; image NSFW hold.

## 7. Events
- (+) Create→publish→join→attend→review; host edit/cancel; waitlist auto-promote.
- (−) Oversell prevented under concurrency; join unpublished → 403; invite-only link denied to outsiders.
- (E) Cancel notifies+refunds; date edit re-confirms; capacity lowered handling; host deletion cascade.

## 8. Account & data
- (+) Deactivate→reactivate within grace; export produces complete bundle.
- (+) Delete → grace → hard purge; immediate logout; peers see "unavailable."
- (−) Deleted user cannot log back in post-grace.
- (E) Delete during active chat / hosted event handled (cancel + notify).

## 9. Performance / resilience
- Load test `getState` replacement endpoints; verify no N+1 (C1); verify polling removed/throttled (C2).
- Backend-down → retry UX, cached reads, no destructive logout (G1).
- Shimmer/loading states present on all lists (members done; extend to events/discovery G2).

---

## Launch Readiness Report

### Go / No-Go gates
| Gate | Requirement | Status |
|---|---|---|
| **G-Auth** | A1 backdoor removed; sessions rotate; rate limits | ❌ TODO |
| **G-Trust** | Verification real *or* honestly relabelled (B1) | ❌ TODO |
| **G-Safety** | Block/report enforced everywhere + moderation queue (B2) | ❌ TODO |
| **G-Status** | Suspended/banned states enforced (B3) | ❌ TODO |
| **G-Consent** | Mutual connection accept/reject (E1) | ❌ TODO |
| **G-Perf** | getState split + polling fixed (C1/C2) | ❌ TODO |
| **G-Legal** | In-app account deletion + export (H1) | ❌ TODO |
| **G-Authz** | Server-side message/write authz (E2) | ❌ TODO |

### Verdict
**No-Go for public launch** until all P0 gates pass. **Conditional Go for closed/invite beta** once G-Auth, G-Safety, G-Status, G-Consent, G-Legal are met (perf acceptable at small N if polling throttled).

### Recommended sequence
1. **Sprint 1 (Safety & Auth):** A1, B1 relabel, B2 enforce + reports, B3 states, H1 deletion, E2 authz.
2. **Sprint 2 (Core product):** E1 connection handshake + inbox, F1 event edit/cancel/waitlist, A4 phone OTP (makes B1 real).
3. **Sprint 3 (Scale & polish):** C1 state split, C2 realtime/throttle, D1/D3 schema, settings (Phase 10), empty states.
4. **Beta → GA:** QA matrix green, load test passed, store-compliance (deletion) verified.
