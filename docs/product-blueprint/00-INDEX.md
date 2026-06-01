# Instadate — Production Readiness Blueprint

> Complete product audit, UX blueprint, and implementation specification.
> Authored as a combined Product / UX / Architecture / Security / QA review against the live codebase (`worker/index.ts`, `src/main.jsx`, `src/ProfileDashboard.jsx`, `src/OnboardingFlow.jsx`, `src/contexts/*`, `migrations/*`).
> Status date: 2026-05-31 · Branch: master

## Positioning
**"Find a Partner, Not a Match."** Real people · Verified profiles · Offline meetups · Activity-based connection · Safety & trust.

## Document Map
| File | Phase(s) | Contents |
|------|----------|----------|
| `01-audit.md` | 1 | Full product audit — every issue with problem / cause / impact / fix / priority |
| `02-authentication.md` | 2 | Auth architecture: Google, Email, OTP, Guest; sessions, refresh, expiry, deletion |
| `03-onboarding.md` | 3 | Screen-by-screen onboarding + permissions + skip conditions |
| `04-profile.md` | 4–5 | Profile creation, completion scoring, Profile-tab states (logged-out → banned) |
| `05-access-control.md` | 6 | Full permissions matrix |
| `06-chat.md` | 7 | Chat architecture, states, messaging rules, features |
| `07-connections.md` | 8 | Discovery + connection request / accept / reject flow |
| `08-events.md` | 9 | Event lifecycle, capacity, waitlist, moderation |
| `09-settings.md` | 10 | Settings & account module |
| `10-edge-cases.md` | 11 | 100+ edge cases with expected behaviour |
| `11-database-api.md` | 12 | Schema + API architecture (current vs target) |
| `12-qa-plan.md` | 13 | QA testing plan + launch-readiness report |

## TL;DR — Launch Verdict
**NOT launch-ready.** The app is a high-fidelity, well-designed **prototype running almost entirely on seeded demo data** with **simulated trust/verification** and **no real moderation enforcement**. It can ship as an invite-only beta after the **P0** items in `01-audit.md` are closed (auth hardening, real verification or honest labelling, block/report enforcement, getState() performance, account deletion). See `12-qa-plan.md` for the gated checklist.
