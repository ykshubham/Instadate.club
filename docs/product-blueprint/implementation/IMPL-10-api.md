# STEP 10 — API Specification (Keep / Modify / Delete / Replace)

Disposition per existing endpoint + new endpoints. All writes: `requireAuth`→`requireStatusActive`→(`requirePublished`/`requireVerified`)→`visibleTo`.

## Auth
| Endpoint | Disposition | Notes |
|---|---|---|
| `GET /api/auth/google/start|url|callback` | **Modify** | hash state, allowlist redirect, rate-limit |
| `POST /api/auth/login` | Keep | token login |
| `GET /api/auth/me` | **Modify** | remove dev auto-seed; return guest DTO/null when no session |
| `POST /api/auth/logout` | Keep | clears session row+cookie |
| `POST /api/auth/otp/start` `/otp/verify` | **Add** | phone OTP |
| `POST /api/auth/email/start`, `GET /api/auth/email/callback` | **Add** | magic-link |
| `GET /api/auth/sessions`, `DELETE /api/auth/sessions` | **Add** | device list / sign-out-everywhere |

## Account / Profile
| `GET /api/profile` | **Modify** | own only via session, never guest→real |
| `PATCH /api/profile` | **Modify** | partial-safe, returns completion%, status-gated |
| `POST|GET|DELETE /api/profile/photo[/:id]` | **Modify** | magic-byte check, orphan cleanup |
| `PUT /api/users/me` | **Delete** | redundant with PATCH profile |
| `GET /api/me/summary` | **Add** | batched counts/stats |
| `DELETE /api/account`, `GET /api/account/export`, `POST /api/account/deactivate` | **Add** | H1 |

## Discovery
| `GET /api/state` | **Replace** | split into `/api/me/summary`, `/api/me/chats`, `/api/me/events`, `/api/me/pending-reviews` + `/api/updates?since=` |
| `GET /api/discovery` | **Modify** | filters + visibleTo + sanitised DTO + batched |
| `GET /api/members` | **Modify** | filters + visibleTo + sanitised DTO |
| `GET /api/recommendations` | **Modify** | visibleTo applied to all (already excludes blocks) |

## Connections (replaces matches)
| `POST /api/matches` | **Replace** | alias→`/connections/request` during transition, then remove |
| `POST /api/connections/request` | **Add** |
| `POST /api/connections/:id/accept` `/reject` | **Add** |
| `DELETE /api/connections/:id` | **Add** | unmatch |
| `GET /api/connections`, `GET /api/connections/requests` | **Add** |
| `POST /api/rejections` | Keep | reject-in-discovery |
| `POST /api/blocks`, `GET /api/blocks`, `DELETE /api/blocks/:id` | **Add/Modify** | enforce in visibleTo |
| `POST /api/reports` | **Add** | moderation |

## Chat
| `POST /api/chats/:slug/messages` | **Modify** | assertCanSend authz + idempotency + attachments |
| `PATCH /api/chats/:slug/verification` | Keep | enforce server-side if feature kept |
| `GET /api/chats/:id/since?cursor=`, `POST /api/chats/:id/read`, `DELETE /api/messages/:id`, `GET /api/chats/:id/ws` | **Add** |

## Events
| `POST /api/events` | **Modify** | requirePublished/Verified host gate |
| join/leave `/api/events/:id/attendees/me` | **Modify** | atomic claim; offer waitlist; auto-promote |
| approve / attend | Keep | host-only (verified) |
| `PATCH /api/events/:id`, `POST /api/events/:id/cancel`, `POST|DELETE /api/events/:id/waitlist` | **Add** |
| `GET /api/events/recommended` | **Modify** | hide under-review/banned hosts |
| `POST /api/events/:id/review` | Keep |

## Instant plans
| list/create/join/leave/complete | Keep | apply status/visibleTo filters |

## Notifications / Settings
| `GET /api/notifications`, `POST /api/notifications/read` | **Add** |
| `GET|POST /api/notifications/prefs` | **Add** |

## Admin / Analytics
| `POST /api/analytics/event` | Keep |
| `GET /api/admin/analytics|health` | **Modify** | gate behind admin role (add `users.role`) |

## Definition of Done
- Every endpoint has explicit disposition implemented; deprecated ones return 410/alias; new ones documented with request/response schemas in code.
