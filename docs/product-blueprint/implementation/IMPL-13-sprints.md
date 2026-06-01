# STEP 13 — Development Sprints

Effort: S ≤0.5d · M 1–2d · L 3–5d · XL 1–2wk. Tasks reference IDs from IMPL-01…11.

## Sprint 1 — Launch Blockers (P0)
Goal: close every gate that makes the app unsafe/illegal to expose.

| Task | ID | Pri | Effort | Depends | DoD |
|---|---|---|---|---|---|
| Remove auth backdoor; guest principal | AUTH-BE-01 | P0 | L | 0012 | No request maps guest→real user_id; security test passes |
| Authz middleware (`requireAuth/Status/Published/Verified`) | AUTH-BE-03 | P0 | M | BE-01 | All writes gated server-side |
| `visibleTo` guard on all lists | DISC-BE-01 | P0 | M | BE-01 | Blocked/banned never appear anywhere |
| Sanitised DTOs | DISC-BE-02 | P0 | M | — | Guests/non-conns get no PII |
| Status (suspended/banned) gate + screens | AUTH-BE-07, PROF-FE-05 | P0 | M | 0012 | Banned no session; suspended no writes |
| Migration 0012 | DB | P0 | M | — | Applies clean local+remote |
| Account deletion + export + purge job | AUTH-BE-08 | P0 | L | 0012 | Delete→grace→purge verified |
| Message send authz (`assertCanSend`) | CHAT-BE-01 | P0 | M | conn model | Non-member/non-conn 403 |
| Connection request/accept/reject + inbox | CONN-BE-01/02, CONN-FE-01 | P0 | L | 0013 | Chat only after accept |
| Reports + block enforcement + block list UI | CONN-BE-03/04, SET-FE-05 | P0 | M | 0013 | Reports queued; blocks enforced |
| Honest verification relabel | PROF-BE-03 | P0 | S | — | No fake "Highly Verified" for real users |
| Remove fake billing/safety copy | SET-FE-01 | P0 | S | — | Copy gone |
| getState hot-path split (summary/chats/events) | STATE-BE-01, STATE-FE-03 | P0 | L | — | 3s full poll removed |
| ProfileRouter state selection (remove isGuest literal) | PROF-FE-01, AUTH-FE-01 | P0 | M | BE-01 | Correct state renders |

Exit: all `12-qa.md` security + P0 gates green → **invite-only beta**.

## Sprint 2 — Core Product (P1)
| Task | ID | Pri | Effort | Depends | DoD |
|---|---|---|---|---|---|
| Phone OTP auth (+real verification) | AUTH-BE-06, AUTH-FE-05 | P1 | L | 0012 | OTP sets real verification |
| Email magic-link | AUTH-BE-05, AUTH-FE-04 | P1 | M | 0012 | Round-trip works |
| Onboarding step-machine + persistence | ONB-FE-01..07, ONB-BE-* | P1 | XL | auth | No data discarded; resumable |
| Completion model rewrite | PROF-FE-06 | P1 | S | — | Mandatory-aware |
| Discovery filters + batched enrichment | DISC-FE-01, DISC-BE-03/04 | P1 | L | visibleTo | Filters server-side; N+1 gone |
| Unmatch + report UI in chat | CONN-FE-04/05 | P1 | M | conn | Freeze + report work |
| Event edit/cancel/waitlist + atomic claim | EVT-BE-01..04, EVT-FE-01..03 | P1 | L | 0013 | No oversell; waitlist promote |
| Notifications (in-app) | CONN-BE-05, notifications API | P1 | M | 0013 | Request/accept notify |
| Settings: privacy/notifications/sessions | SET-FE-02..06, SET-BE-* | P1 | L | 0013 | Persisted + honoured |
| Loose FK rebuild (0015) | DB | P1 | M | backfill | FK check clean |

Exit: core flows complete; full QA matrix attempted.

## Sprint 3 — Scale & Reliability (P2)
| Task | ID | Pri | Effort | Depends | DoD |
|---|---|---|---|---|---|
| Chat realtime (Durable Object) | CHAT-BE-03, CHAT-FE-03 | P2 | XL | Sprint1 chat | WS delivery; poll removed |
| Read receipts/typing/online | CHAT-BE-04, CHAT-FE-02 | P2 | M | DO | States work |
| Image/voice messages | CHAT-BE-05, CHAT-FE-04 | P2 | M | R2 | Upload+scan |
| Query layer + `/api/updates` delta | STATE-FE-02, STATE-BE-02 | P2 | L | split | Bounded queries |
| Trust metric caching | STATE-BE-03 | P2 | M | — | No per-read recompute |
| Perf indexes (0014) | DB | P2 | S | — | Indexes live |
| meetup_feedback consolidate (0016) | DB | P2 | M | backup | Single source of truth |
| Rate limiting | AUTH-BE-09 | P2 | M | — | Limits fire |

Exit: load test p95 target met; no N+1.

## Sprint 4 — Launch Preparation
| Task | ID | Pri | Effort | DoD |
|---|---|---|---|---|
| Empty states everywhere | DISC-FE-02, EVT-FE-06 | P2 | S | Consistent component |
| Degraded/offline mode polish | STATE-FE-06, G1 | P2 | M | Retry UX, no destructive logout |
| Admin role + gate analytics | API admin | P2 | S | Admin-only |
| Automation suite + CI | 12-qa automation | P1 | L | Green in CI |
| E2E Playwright critical paths | 12-qa E2E | P1 | L | Pass |
| Store compliance (deletion, privacy policy) | H1 | P0 | S | Apple/Google ready |
| Full manual QA gate | 12-qa | P0 | M | 100% green |
| Production load + security review | — | P0 | M | Sign-off |

Exit: all gates in `12-qa.md` green → **public launch**.

## Critical path
0012 → AUTH-BE-01/03 → DISC-BE-01/02 → CHAT-BE-01 + CONN-BE-01/02 (0013) → Sprint-1 exit (beta) → Sprint 2 core → Sprint 3 scale → Sprint 4 GA.
