# Phase 3 — Onboarding System

## Current state
6 marketing slides (`OnboardingFlow.jsx:10-85`). Only slide 4 collects data (`goal`, `energy`) and it is **discarded** (G3). Ends by redirecting to `/login`. No permission requests, no profile capture, no location/notification asks.

## Target new-user journey

Principle: **value → trust → identity → profile → preferences → permissions**, with a draft saved at every step so nothing is lost (fixes G3). Mandatory steps gate progress; optional steps are skippable with explicit "Skip for now."

| # | Screen | Purpose | UI | Primary CTA | Mandatory? |
|---|--------|---------|----|-------------|-----------|
| 1 | Welcome / Positioning | Communicate "Find a Partner, Not a Match" | Hero, 3 value chips | **Get Started** | — |
| 2 | How it works | Activity-first model | 4-step timeline (Verify→Pick→Connect→Meet) | Continue | — |
| 3 | Trust & Safety | Why verification matters | Trust badges explainer | Continue | — |
| 4 | **Sign in / Sign up** | Identity | Google / Email / Phone (Phase 2) | Continue with… | **Yes** |
| 5 | **Phone OTP** | First real trust signal | Country+number → 6-digit | Verify | **Yes** (recommended) |
| 6 | **Basics** | Core profile | Name, Age (18+), Gender | Continue | **Yes** |
| 7 | **Photos** | Identity & appeal | Upload 1–6 (drag to reorder) | Continue | **Yes (≥1)** |
| 8 | Bio & Profession | Substance | Bio (≤900), profession, college | Continue / Skip | No |
| 9 | Intent & Dating prefs | Matchability | Intent chips; preferred gender, age range, distance | Continue | **Yes (intent)** |
| 10 | Interests & Activities | Discovery fuel | Multi-select interests + weights | Continue / Skip | No |
| 11 | **City / Location** | Local matching | City picker; optional precise location permission | Continue | **Yes (city)** |
| 12 | Permissions | Engagement | Notifications (and location if not granted) | Enable / Not now | No |
| 13 | Ready | Confirmation | Completion meter + "what's next" | **Enter Instadate** | — |

Goal/energy from the old slide 4 fold into steps 9–10 and are **persisted**.

## Permission requests (just-in-time, with rationale)
- **Location:** ask at step 11 *with context* ("to show people and plans near you"). If denied → fall back to city-level only; never block the app.
- **Notifications:** ask at step 12 ("get notified when someone wants to connect or your event fills"). If denied → in-app inbox still works.
- **Camera/Photos:** ask at step 7 only when the user taps upload.

## Skip conditions — exact behaviour
| Skipped | System behaviour |
|---|---|
| **Interests** | Allowed. Discovery falls back to city + intent only; completion −; soft nudge later. |
| **Photos** | **Not allowed to finish** (≥1 required). Without a photo, profile is hidden from discovery (`completed` stays false). |
| **Bio** | Allowed. Profile shows "No bio yet"; completion −; nudge banner. |
| **Gender** | **Not allowed** (mandatory; needed for preference matching). |
| **Location/City** | City mandatory (text). Precise GPS optional → distance features degrade to city-bucket. |
| **Notifications** | Allowed; rely on in-app inbox; re-prompt after first connection request. |
| **OTP (if added)** | If skippable: account stays `verification_level=none`, flagged "Unverified," limited reach; re-prompt before messaging. |

## Resume & interruption
- Draft persisted locally + server `onboarding_step` per user.
- Close app mid-flow → reopen resumes at last incomplete mandatory step.
- Auth completes but profile incomplete → land on step 6, not the home feed (ties to Profile State 2).

## Acceptance criteria
- No collected field is ever discarded.
- Cannot reach the main app without: account + name + age(18+) + gender + ≥1 photo + intent + city.
- Every permission is requested with a rationale and degrades gracefully on denial.
