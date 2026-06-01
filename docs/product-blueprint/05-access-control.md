# Phase 6 — Access Control Matrix

Principals: **Guest** (anonymous, sanitised) · **Logged-out** (no session, on a gated screen) · **Authed-Incomplete** (session, profile not published) · **Authed-Complete** · **Verified** (phone/selfie) · **Suspended** · **Banned**.

> "Logged-out" and "Guest" differ: Guest has explicitly chosen to browse sanitised content; Logged-out is any no-session view that should present a login wall. Both have identical *permissions* (read-only public), so they share a column.

| Feature | Guest / Logged-out | Authed-Incomplete | Authed-Complete | Verified | Suspended | Banned |
|---|---|---|---|---|---|---|
| View sanitised discovery cards | ✅ | ✅ | ✅ | ✅ | 👁 read-only | ❌ |
| View **full** profile (contact, IG) | ❌ → login | ⚠ limited | ✅ | ✅ | 👁 | ❌ |
| View public events | ✅ | ✅ | ✅ | ✅ | 👁 | ❌ |
| Create/edit own profile | ❌ → login | ✅ | ✅ | ✅ | ❌ | ❌ |
| Upload photos | ❌ → login | ✅ | ✅ | ✅ | ❌ | ❌ |
| Appear in discovery | ❌ | ❌ (until published) | ✅ | ✅ (boosted) | ❌ | ❌ |
| Like / send connection (Vibe) | ❌ → login | ⚠ after publish | ✅ | ✅ | ❌ | ❌ |
| Accept/Reject connection | ❌ | ⚠ after publish | ✅ | ✅ | ❌ | ❌ |
| Send message | ❌ → login | ❌ | ✅ (accepted conn only) | ✅ | ❌ | ❌ |
| Join (RSVP) event | ❌ → login | ⚠ after publish | ✅ | ✅ | ❌ | ❌ |
| Host event | ❌ → login | ❌ | ✅ | ✅ (recommend verified-only) | ❌ | ❌ |
| Approve attendees (own event) | — | — | ✅ | ✅ | ❌ | ❌ |
| Report / block user | ❌ → login | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit preferences | ❌ → login | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete account | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |

Legend: ✅ allowed · ⚠ conditional · 👁 read-only · ❌ blocked · "→ login" opens login modal.

## Enforcement rules
1. **Server is source of truth.** Every ⚠/❌ enforced in the worker, not just UI (fixes E2, A1).
2. **`requireAuth` middleware** on all writes; **`requirePublished`** on discovery-affecting writes; **`requireVerified`** (configurable) on hosting/messaging if policy demands.
3. **`visibleTo(viewer, target)`** guard applied to *every* list and profile fetch: excludes either-direction blocks, banned/suspended/deactivated targets (fixes B2).
4. **Status gate** runs first: suspended → 403 on writes; banned → 403 everywhere (B3).
5. **Guest never maps to a real user_id** (A1). Public endpoints return only sanitised DTOs (no phone/IG/exact location).

## Login-modal contract
Any `→ login` tap opens a modal stating the *specific* benefit ("Sign in to message Kavya," "Sign in to RSVP"), with the chosen action resumed after auth (intended-route restoration from Phase 2).
