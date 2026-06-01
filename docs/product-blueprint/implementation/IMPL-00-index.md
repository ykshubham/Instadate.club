# Instadate — Implementation Plan (Developer-Executable)

Each step follows: **Current State · Problems · Target State · Frontend · Backend · Database · API · QA · Definition of Done.**
All file/line refs point to the real repo. Task IDs are stable (e.g. `AUTH-FE-01`) for sprint tracking in `IMPL-13-sprints.md`.

| Step | File | Gate |
|---|---|---|
| 1 Authentication | `IMPL-01-auth.md` | P0 |
| 2 Onboarding | `IMPL-02-onboarding.md` | P1 |
| 3 Profile | `IMPL-03-profile.md` | P0/P1 |
| 4 Discovery | `IMPL-04-discovery.md` | P1 |
| 5 Connections | `IMPL-05-connections.md` | P0 |
| 6 Chat | `IMPL-06-chat.md` | P0/P2 |
| 7 Events | `IMPL-07-events.md` | P1 |
| 8 Settings | `IMPL-08-settings.md` | P0/P1 |
| 9 Migrations | `IMPL-09-migrations.md` | — |
| 10 API spec | `IMPL-10-api.md` | — |
| 11 State mgmt | `IMPL-11-state.md` | P1 |
| 12 QA | `IMPL-12-qa.md` | — |
| 13 Sprints | `IMPL-13-sprints.md` | — |

## Conventions
- **Backend** = `worker/index.ts` + `worker/services/*`. **Frontend** = `src/*`. **DB** = `migrations/00NN_*.sql`.
- New helper modules to create: `worker/auth.ts`, `worker/authz.ts`, `worker/services/connections.ts`, `worker/services/chat.ts`, `worker/services/moderation.ts`, `worker/services/notifications.ts`, `src/contexts/QueryClient.jsx`, `src/lib/api.js`.
- Every write endpoint goes through `requireAuth` → `requireStatusActive` → (optional `requirePublished`/`requireVerified`) → `visibleTo` guard. Defined in Step 1.
