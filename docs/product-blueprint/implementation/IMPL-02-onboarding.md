# STEP 2 — Onboarding (P1)

## Current State
`src/OnboardingFlow.jsx` — 6 marketing slides (`:10-85`). Only slide 4 collects `goal`/`energy` (`:102-103`), **discarded**. Ends → `/login` (`src/main.jsx:668`). No permissions, no profile capture.

## Problems
- **G3** collected data discarded.
- No identity/profile capture during onboarding; user lands incomplete with no guidance.
- No permission requests, no skip/resume logic, no draft persistence.

## Target State
13-step journey (see `03-onboarding.md`): value → trust → auth → OTP → basics → photos → bio → intent/prefs → interests → city → permissions → ready. Mandatory gates; skippable optionals; draft saved at every step; resumable.

## Frontend Tasks
- `ONB-FE-01` Refactor `OnboardingFlow.jsx` into a step-machine: `steps[]` config with `{id, component, mandatory, validate}`; progress bar; back/next with validation gate.
- `ONB-FE-02` Step components: `WelcomeStep`, `HowItWorksStep`, `TrustStep` (reuse existing visuals), `AuthStep` (mounts LoginModal methods), `OtpStep`, `BasicsStep` (name/age18+/gender), `PhotosStep` (1–6 upload+reorder), `BioStep` (skippable), `IntentPrefsStep` (intent mandatory + gender/age/distance), `InterestsStep` (skippable), `CityStep` (mandatory), `PermissionsStep`, `ReadyStep`.
- `ONB-FE-03` Draft persistence: write each step to `localStorage onboarding_draft` + debounced `PATCH /api/profile` (partial) once authed.
- `ONB-FE-04` Resume: on mount, read `users.onboarding_step` + local draft → jump to first incomplete mandatory step.
- `ONB-FE-05` Permission prompts with rationale (location at CityStep, notifications at PermissionsStep, camera at PhotosStep). Graceful denial paths.
- `ONB-FE-06` Map legacy `goal`/`energy` into IntentPrefsStep/InterestsStep and persist.
- `ONB-FE-07` Skip buttons only on optional steps; mandatory steps disable Next until valid.

## Backend Tasks
- `ONB-BE-01` `users.onboarding_step` (int) + `onboarding_completed_at`; update on each step PATCH.
- `ONB-BE-02` Partial `PATCH /api/profile` must accept incremental fields without flipping `completed` until all mandatory present (reuse `worker/index.ts` profile validation `:154-170`).
- `ONB-BE-03` `completed` flips true only when: name, age(18+), gender, ≥1 photo, intent, city all present.

## Database Tasks
- `users.onboarding_step INTEGER DEFAULT 0`, `users.onboarding_completed_at TEXT` (migration `0012`).

## API Tasks
- Modify `PATCH /api/profile` to be partial-safe + return updated completion %.
- Reuse `POST /api/profile/photo`, `POST /api/preferences`, `POST /api/interests`, `POST /api/intents`.

## QA Tasks
- (+) full path → feed, all data persisted. (−) cannot finish without mandatory set; <18 blocked. (E) kill+resume at each step; offline during photo; permission denials degrade; goal/energy persisted.

## Definition of Done
- No collected field discarded.
- Cannot reach main app without account+name+age(18+)+gender+≥1 photo+intent+city.
- Every permission requested with rationale, degrades on denial.
- Interrupt at any step resumes correctly.

## Fix log

### 2026-06-02 — Onboarding restarts at step 1 after Google sign-in
**Symptom:** At the auth step (step 4) the user connects Google, sees "Successfully logged in", then is bounced to step 1.

**Root cause (two compounding bugs):**
1. *Client* — only the form *draft* (`onboarding_draft`) was mirrored to `localStorage`; the current **step index was not**. `signIn()` does a full-page `window.location` redirect to Google and back, which re-mounts the React app and reset `index` to `0`.
2. *Server* — the intended `ONB-FE-04` resume fallback was dead: `/api/auth/me` (`currentAuth`) never `SELECT`ed `onboarding_step`, so `authUser.onboardingStep` was always `undefined` → `serverStep` always `0`. At the auth gate the step was never written server-side anyway (`updateDraft` only syncs when already authenticated).

**Fix:**
- `OnboardingFlow.jsx` — mirror `index` to `localStorage` (`onboarding_step`) on every change; restore it synchronously in the `useState` initializer; clear it on completion. The step now survives reloads and the OAuth redirect independently of the server.
- `worker/index.ts` — add `onboarding_step` + `onboarding_completed_at` to the `/api/auth/me`, login, and OTP-verify `SELECT`s so the server resume path (cross-device) actually works. Regression test: `tests/api/auth-me.test.ts`.
- Added filterable diagnostics (`[onboarding]` / `[auth]` console logs, on by default in beta; silence with `localStorage.setItem('onboarding_debug','0')`): step before OAuth, step after return, auth-state changes, navigation decisions, profile-fetch results.

**Follow-up (same day) — "Cannot read properties of undefined (reading 'eyebrow')" after sign-in:** reviving the server resume surfaced a latent crash. A *completed* account stores the sentinel `onboarding_step = 13` (written by the final-step save), so the resume effect did `setIndex(13)` — one past the 10-entry `stepHeaders[]` table (covers index 3–12) → `SlideHeader` read `undefined.eyebrow` and the `RouteErrorBoundary` showed "View could not render". Fixed by clamping the resume target to `LAST_STEP` (12) and making `currentHeader()` fall back to the last header instead of crashing on any out-of-range index.

### 2026-06-02 — Existing (completed) users forced back through onboarding after Google sign-in
**Symptom:** A user who had already finished onboarding signs in with Google from the onboarding auth gate and is shown the onboarding flow again instead of entering the app.

**Root cause:** the post-OAuth redirect lands on `/onboarding`, and the route guard treats `/onboarding` as an always-public route — so even an authenticated, completed user rendered the flow. Completion status was never consulted when routing.

**Fix (route on completion):**
- *Server* — `userDto` now exposes a derived boolean `onboardingCompleted` (`onboarding_completed_at IS NOT NULL` OR `users.completed = 1`); `/api/auth/me`, login, and OTP-verify now `SELECT u.completed`. No new column — `onboarding_completed_at` (migration 0012) + `users.completed` are the authoritative markers, set when the final step saves `completed: true`. Adding a third boolean would duplicate state and risk drift.
- *Client (`main.jsx`)* — completion drives routing: `canBrowseApp` keys off `onboardingCompleted` (primary signal `authUser.onboardingCompleted`, resolves first; `profile.completed` fallback), and the guard sends an authenticated+completed user off `/onboarding` to `/`. Incomplete users still resume onboarding. Keying `canBrowseApp` on the same flag avoids a `/onboarding`↔`/` redirect ping-pong while the profile fetch is in flight.
- Added `[routing] decision` logs (user id, profile found/status, `onboardingCompleted`, route, final navigateTo). Tests: `tests/api/auth-me.test.ts` (completed vs incomplete).

*Note:* the side-drawer "Onboarding 🚀" link now bounces completed users to home (onboarding cannot be replayed once finished), per "skip onboarding entirely".
