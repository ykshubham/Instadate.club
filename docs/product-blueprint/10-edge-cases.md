# Phase 11 — Edge Cases (100+)

Format: **#. Scenario → Expected UX → Backend handling.**

## Onboarding (1–12)
1. Close app mid-onboarding → reopen resumes at last incomplete mandatory step → draft persisted (server `onboarding_step` + local).
2. Internet drops during photo upload → "Upload failed, retry" + keep queued → R2 PUT idempotent by photoId; no orphan row until success.
3. User under 18 enters age → hard block, account not created → server rejects age<18.
4. User abandons after auth but before profile → next login lands on Basics, not feed → `completed=false` gate.
5. Duplicate email via Google + email link → merge to one account by verified email → upsert by email.
6. Skips photos → cannot finish; cannot appear in discovery → `completed=false`.
7. Skips notifications → in-app inbox only; re-prompt after first request.
8. Denies location → city-level matching only → no GPS distance.
9. Picks city not in list → force selection from geocodable list → reject free-text.
10. Rotates device mid-flow → layout responsive; state preserved.
11. Bot/spam signup burst → rate-limit + OTP gate → throttle per IP/number.
12. Re-runs onboarding after completion → routed to edit-profile, not wizard.

## Authentication & session (13–28)
13. Token expires mid-action → silent refresh; if fail, soft logout preserving intended route.
14. Reinstall app → no local session → login → restore server profile.
15. Cookie cleared manually → next request 401 → login wall.
16. Two devices logged in → both valid until expiry; "sign out everywhere" kills all.
17. OAuth `state` expired → "Sign-in expired, try again."
18. OAuth callback replayed → state already consumed → reject.
19. `redirectTo=//evil.com` → blocked by allowlist → home.
20. Banned email signs in → ban screen, no session (Phase 2).
21. Suspended user signs in → suspension screen, reads only.
22. Network flaps during login → retry CTA; no partial session.
23. Clock skew vs `expires_at` → tolerate small skew; server authoritative.
24. Logout while offline → clear local, queue server logout, reconcile on reconnect.
25. Session hijack suspected (IP/device change) → optional re-verify; rotate token.
26. Concurrent refresh from two tabs → idempotent rotation; one wins, other retries.
27. Google account has no verified email → reject with explanation.
28. User deletes Google account upstream → our session valid until expiry; re-auth fails gracefully.

## Profile & photos (29–42)
29. Upload >8MB → reject with size hint → server 413/400.
30. Upload non-image (renamed .exe) → content-type/magic check reject.
31. Upload 7th photo → blocked "max 6."
32. Delete primary photo → next becomes primary; if last, profile drops from discovery.
33. Two tabs edit profile simultaneously → last-write-wins + version warning.
34. Profanity in bio/name → filtered/blocked.
35. Emoji-only name → reject (needs letters).
36. Extremely long paste → truncated to limit.
37. R2 outage during upload → "try later"; no DB row.
38. Photo passes upload but DB insert fails → orphan-cleanup job removes R2 object.
39. User sets age boundary 18 exactly → allowed.
40. Changes city → recompute lat/long; refresh nearby feeds.
41. Unverified user views own profile → "Verify phone to get more reach" nudge.
42. Profile 100% but no intent → cannot appear in intent-matched feeds → prompt.

## Connections (43–58)
43. Send Vibe to someone who blocked you → silently no-op (looks sent) → server rejects via `visibleTo`.
44. Both send Vibe simultaneously → instant match; one connection row (dedup on pair).
45. Send Vibe twice → second blocked until expiry.
46. Recipient deletes account before accept → request auto-expires; sender sees "unavailable."
47. Accept a request from a now-banned user → blocked; request removed.
48. Reject then re-discover same user → hidden by rejection filter.
49. Unmatch mid-chat → thread frozen both sides; cannot re-message.
50. Connection expires (14d) → removed from pending; can re-request.
51. Request to self (crafted) → rejected.
52. Connect with no published profile (crafted) → 403 requirePublished.
53. Recipient at request cap → throttle.
54. Block someone with pending request → request voided.
55. Mass-like script → rate-limit + shadow throttle.
56. Discovery returns 0 (filters too tight) → empty state + "loosen filters."
57. Connection accepted but chat creation fails → retry; surface error; no half-state.
58. Viewing a profile that gets deactivated mid-view → "no longer available" on action.

## Chat (59–74)
59. Logged-out taps Chat → login wall.
60. Message a non-connection (crafted) → 403 (E2 fix).
61. Send to chat you're not in → 403 (membership check).
62. Peer blocks you mid-conversation → composer disables; "unavailable."
63. You block peer → thread frozen; unblock restores (history intact).
64. Peer deletes account → "account no longer available," history read-only.
65. Send empty/whitespace message → rejected (exists).
66. Send 10k-char message → truncate/limit.
67. Rapid spam → rate-limited.
68. Offline send → queued, "sending…", flush on reconnect; dedup by client id.
69. Same message double-tap → idempotent (client message id).
70. Image with NSFW → scan hook flags/holds.
71. Read receipt with privacy off → don't send receipt.
72. Two devices same chat → both receive via Durable Object; read state merges.
73. Report a message → moderation queue; optional auto-block.
74. Voice note exceeds duration cap → reject.

## Events (75–90)
75. Host cancels after RSVPs → notify all + refund (F1).
76. Host edits date → attendees re-confirm; non-confirmers dropped.
77. Event fills during your join tap → offer waitlist (no oversell, atomic claim).
78. Two users claim last seat concurrently → one succeeds, other waitlisted.
79. Leave event → first waitlisted auto-promoted + notified.
80. Waitlist promotion ignored T min → next promoted.
81. Paid event, payment fails → seat released.
82. Host marks no-show wrongly → attendee can dispute (appeal/report).
83. Host deletes account → event reassigned or cancelled + attendees notified.
84. Join own event → blocked (host already implicit).
85. RSVP without published profile → 403.
86. Event date passes with no attendance marks → auto-complete; feedback window opens.
87. Capacity edited below current attendees → block or trigger removal policy (last-joined → waitlist).
88. Report event → under-review hides it.
89. Invite-only event public link shared → access denied to non-invitees.
90. Banned user shown in attendee list → filtered out.

## Account/data & system (91–105)
91. Delete account during active chat → peers see "account no longer available"; messages handled per policy.
92. Delete during hosted upcoming event → event cancelled + attendees notified + refunds.
93. Deactivate then log back in within grace → reactivate seamlessly.
94. Export data request → JSON bundle generated; emailed/download link.
95. Suspended user tries any write → 403 `account_suspended`.
96. Banned user’s old messages → hidden from peers, retained for moderation.
97. Backend down → "Cloud storage unavailable" replaced with retry + status; reads from cache (G1).
98. Worker deploy mid-session → client retries; session intact.
99. D1 latency spike → loading shimmers (already added for members); timeouts handled.
100. R2 image 404 → avatar fallback (already in `SideDrawer` onError).
101. Clock/timezone: event times shown in user tz; stored UTC.
102. Concurrent profile + photo edit → consistent final state.
103. Migration adds NOT NULL to legacy loose FK rows → backfill first (D1).
104. Notification sent to user who disabled them → suppressed at send.
105. Guest hits a write endpoint directly (crafted) → 401, never resolves to a real user (A1 fix).

## Acceptance criteria
Each case has a deterministic, user-visible response and a safe backend outcome; none leaves a half-written state or leaks another user's data.
