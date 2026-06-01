# Phase 4 & 5 — Profile Creation + Profile Tab States

## Phase 4 — Profile creation

### Fields (current limits from `worker/index.ts:154-170`)
**Mandatory:** Name (≤90), Age (numeric, 18+), Gender, Bio*, Photos (≥1, ≤6, ≤8MB, jpeg/png/webp/gif), City (≤80).
*Bio is currently optional in code but listed mandatory in the brief — recommend **required, ≥40 chars**.

**Optional:** Profession (≤90), College/Education (≤120), Instagram (≤60), WhatsApp (≤20 digits), Interests (array+weight 1/3/5), Languages (add), Lifestyle (add), Intent, Weekend status (≤280), Vibe (≤120), Preferences (gender/age/distance).

### Validation rules
| Field | Rule |
|---|---|
| Name | trim+collapse; letters/spaces/.'- ; 2–90 |
| Age | integer 18–99; **block <18 hard** |
| Gender | enum (Woman/Man/Non-binary/Other) |
| Bio | ≤900; recommend ≥40; profanity filter |
| Photos | ≥1 to publish; ≤6; ≤8MB; type-checked; first = primary |
| City | from curated list (geocodable) |
| Instagram | handle format; optional verification |
| WhatsApp | E.164 digits; never shown publicly until connected |

### Profile completion model (replace current optional-only meter — G4)
Weighted, mandatory-aware:
```
Mandatory (60%): name, age, gender, ≥1 photo, city, intent  → 10% each
Quality   (40%): ≥3 photos(10) · bio≥40(8) · interests≥3(7)
                · phone_verified(8) · instagram_verified(7)
Published requires 100% of mandatory. % shown = mandatory% capped at 60
                until all mandatory done, then + quality.
```
Display: `40% → Add photos & bio`, `80% → Verify phone`, `100% → You're discovery-ready`.

---

## Phase 5 — Profile tab for every state

> Today `ProfileDashboard.jsx:212` hardcodes `isGuest=false`, so only one branch ever renders (B4). Target: derive state from `AuthContext` + `account_status` + `completed`.

### State 1 — Logged-out
- **UI:** Login wall. Brand hero, value props, **Continue with Google / Email / Phone**, "Explore as guest."
- **Empty state:** "Sign in to build your profile, connect, and host."
- **Disabled:** every personal action (edit, photos, RSVP, message, host).
- **Login-triggering taps:** any of the above open the **login modal** with contextual reason.
- **Shown benefits:** verified community, activity plans, safety.

### State 2 — Logged in, profile incomplete
- **UI:** Completion meter at top (the new model), ordered checklist of missing **mandatory** items first, then quality.
- **Alerts:** "Add a photo to appear in discovery," "Add your city," etc.
- **Required actions block discovery visibility** until mandatory complete.
- Deep-link each checklist row to the relevant editor step.

### State 3 — Profile complete (full dashboard)
Keep the rich dashboard already built, wired to real data:
- Photos carousel, name/age, **honest** verification badges (Phase 2/B1).
- Stats: events joined, events hosted, connections made, reliability/trust, no-shows.
- Weekend status editor, interests, preferences.
- Pending reviews center, recommended members/events, instant plans.
- **Settings** entry (Phase 10).

### State 4 — Suspended (new)
- **Behaviour:** On auth, middleware detects `status=suspended` → render **Suspension screen** instead of app.
- **UI:** Reason, duration/until-date, what's restricted (read-only or full lock), **Appeal** CTA → support.
- **Backend:** all write endpoints return 403 `account_suspended`; reads optionally allowed; user remains in DB.

### State 5 — Banned (new)
- **Behaviour:** `status=banned` → **Ban screen**, no app access. Auth does not create a usable session (Phase 2 validation).
- **UI:** "Your account has been permanently removed for violating community guidelines," appeal link, support email.
- **Backend:** all endpoints 403 `account_banned`; profile hidden from everyone; existing chats frozen; content retained for moderation/legal, hidden from peers.

### State 6 — Deactivated (self, new)
- User-initiated pause: hidden from discovery, chats frozen, can reactivate by logging in within grace window; after window + deletion request → hard delete (H1).
