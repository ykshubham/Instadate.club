# Sprint 4 — Task 6: Prepare Store Compliance (H1, P0)

**Sprint table ref:** IMPL-13 → "Store compliance (deletion, privacy policy) | H1 | P0 | S | Apple/Google ready".

**Scope of this review (only):** Apple App Store requirements · Google Play requirements · Account-deletion compliance · Privacy requirements · User-reporting requirements · Safety requirements.

**Method:** each store requirement cross-checked against shipped code — `worker/services/account.ts`, `moderation.ts`, `settings.ts`, `worker/visibility.ts`, `worker/index.ts` routes, `src/ProfileDashboard.jsx`, `src/main.jsx`, `src/OnboardingFlow.jsx`, `public/`.

**Distribution note:** the app ships today as a **PWA** (`public/manifest.webmanifest`, `display:standalone`). Submitting to the App Store / Play Store means wrapping it (Capacitor / TWA / WebView). That wrapper is itself a compliance surface (Apple 4.2 minimum-functionality; Play WebView/permissions) — flagged below where it bites.

Status legend: ✅ done · ⚠️ partial / risk · ❌ missing.

**Headline verdict:** Account **deletion, data export, blocking, and report intake are genuinely shipped and correct** — the hard-engineering half of H1 is done. The blockers are **documents and disclosures, not features**: there is **no privacy policy, no terms/EULA, and no public data-deletion URL anywhere in the repo**, the legal footer links are dead (`href="#"`), there is **no EULA-acceptance / age-gate at signup**, and **fabricated "Payment/Refund/Aadhaar/Safety Shield" copy still ships** (the very thing SET-FE-01 was meant to delete). None of these will pass either store review.

---

## 0. P0 launch-blockers (must close before either store will approve)

| # | Blocker | Store rule | Evidence | Fix size |
|---|---|---|---|---|
| B1 | **No privacy policy** exists (no page, no URL) | Apple 5.1.1; Play User Data | footer links are `href="#"` (`ProfileDashboard.jsx:3450-3452`); no `public/privacy*`; no route | M |
| B2 | **No Terms of Service / EULA** | Apple 1.2 (UGC EULA); Play UGC | `href="#"` (`:3451`); no TOS acceptance in onboarding | M |
| B3 | **No public web "delete my account/data" URL** | Play Data-deletion policy (must be reachable without reinstalling) | only in-app `DELETE /api/account` exists | S |
| B4 | **Fabricated copy still shipping** — "💳 Payment Methods & Refund Center / UPI / refund tracks", "🛡️ Safety Shield Guards", "👤 Aadhaar & Photo face scan verified / 100% Secure", "📞 VIP Concierge" | Apple 2.3.1 (hidden/undocumented), 2.3.7; Play Misrepresentation | `main.jsx:5022-5056` (also footer "Manually Reviewed…") | S |
| B5 | **No EULA/18+ acknowledgement at signup**; age is a free-text number mid-onboarding, no neutral age screen | Apple 1.2 (agree to terms before UGC), 5.1.1(ix); Play Families/Target-audience | `OnboardingFlow.jsx:547-548` (age input), `:230` (≥18 check) | S |
| B6 | **No proactive media moderation (NSFW/CSAE)** on photos & chat attachments | Apple 1.2 (filter objectionable); Play UGC + **CSAE standards** | uploads go live immediately (`index.ts uploadChatAttachment`); Sprint-3 review §5 confirms "NSFW hook ❌" | M–L |
| B7 | **No CSAE standards doc + in-app CSAE reporting + published contact** | Play Child-Safety-Standards policy (mandatory for Social/Dating) | absent | M |

Everything below expands these and lists what *is* already compliant.

---

## 1. Apple App Store — exact checklist

| Guideline | Requirement | Status | Evidence / gap |
|---|---|---|---|
| **5.1.1(v)** Account deletion | App that supports account creation must let users **initiate deletion from within the app** (full delete, not just deactivate) | ✅ | `DELETE /api/account` → `requestDeletion` (30-day grace → `purgeUser`); UI `DangerZone` with typed "DELETE" confirm (`ProfileDashboard.jsx:1890-1905, 1964-1982`). Deactivate offered separately ✅. Grace period disclosed in copy ✅ (`:1968`). |
| **5.1.1(v)** deletion completeness | Deletion must remove the account & associated data | ✅ | `purgeUser` removes owned rows + R2 photos, de-identifies shared chat rows (`account.ts:159-196`); scheduled purge after grace (`runScheduledPurge`). |
| **5.1.1 / 5.1.2** Privacy policy in app | A privacy policy link must be accessible **in the app** and in App Store Connect | ❌ | Footer "Privacy" is `href="#"` (`ProfileDashboard.jsx:3450`). **B1.** |
| **App Privacy "nutrition label"** | Declare all data types collected/linked/tracked in App Store Connect | ❌ (not derivable) | App collects phone, email, photos, Instagram handle, city/location, profession, college, chat content. No label drafted. See §6 for the data map. |
| **1.2** UGC — filter objectionable content | Method to filter objectionable material | ⚠️ | Text reports + admin queue exist; **no proactive image/text scan** before content goes live. **B6.** |
| **1.2** UGC — report mechanism | Mechanism to report + timely response | ⚠️ | Report user/message/event → `createReport` (`moderation.ts:60`), UI `main.jsx:3044-3062`. Gaps: no reporter acknowledgement, **no 24h SLA / auto-hide**, message-report not surfaced in chat UI (only profile). See §7. |
| **1.2** UGC — block abusive users | Ability to block | ✅ | `/api/blocks`; enforced both directions in every list & on chat-send (`visibility.ts:13-42`); block-list + unblock UI (`main.jsx:5285`, `:3048`). |
| **1.2** UGC — **EULA** | Users must agree to terms with zero tolerance for objectionable content/abusive users | ❌ | No TOS/EULA page; no acceptance gate at signup. **B2 + B5.** |
| **1.2 / Support URL** | Published contact info to reach you | ⚠️ | Only a hard-coded WhatsApp `wa.me/919999999999` (`main.jsx:5053`) — placeholder number, no support email/URL. |
| **2.3.1 / 2.3.7** Accurate metadata | No hidden, dormant, or misleading features/claims | ❌ | Fake Payment/Refund/Aadhaar/Safety-Shield rows (`main.jsx:5022-5056`). **B4.** |
| **3.1.1** In-app purchase | Digital goods must use IAP; **real-world events are exempt** (3.1.3) | ✅ (currently) | No payment SDK in repo; event `price` is display-only for in-person events. ⚠️ The fake "Refund Center/UPI" copy still implies a payment system → resolve via B4. If a real paid membership ships later, IAP rules re-engage. |
| **4.8** Login services | If using a third-party social login (Google), must also offer a privacy-preserving equivalent (Sign in with Apple, or email/phone that limits data to name+email) | ⚠️ | Google login present; **email magic-link + phone OTP** also present (`OnboardingFlow.jsx`), which plausibly satisfies the "equivalent option." Verify against current 4.8 wording before submission; safest is to add Sign in with Apple on iOS. |
| **5.1.1(ix) / Age rating** | Age screening; dating apps rate 17+ (18+ tier emerging); don't collect DOB unless needed | ⚠️ | Self-declared age ≥18 enforced **server-side** (`index.ts:1032-1033`) and client-side (`OnboardingFlow.jsx:230`) ✅, but it's a free-text number captured mid-flow, **no neutral age gate at entry**. Set 17+/18+ rating in App Store Connect. **B5.** |
| **4.2** Minimum functionality | A thin WebView wrapper of a website may be rejected | ⚠️ | PWA today. The iOS wrapper must feel native (push, etc.) or risk 4.2. Distribution decision, flagged. |
| **5.1.2** Data use & sharing consent | Get consent before collecting; no undisclosed third-party sharing | ⚠️ | No consent screen / privacy notice at signup (see §6). In-app privacy *controls* exist (incognito, show-age, show-distance — `settings.ts`). |

---

## 2. Google Play — exact checklist

| Policy | Requirement | Status | Evidence / gap |
|---|---|---|---|
| **Account-deletion policy** | Apps allowing account creation must offer (a) **in-app** deletion of account+data AND (b) a **web URL** to request deletion without reinstalling; declare both in Play Console | ⚠️ | In-app ✅ (`DELETE /api/account`, export, 30-day purge). **Web deletion URL ❌ — B3.** Must also fill the Data-deletion section in the Console. |
| **User Data / Privacy policy** | Privacy policy link in **both** store listing and within the app; must cover collection, use, sharing, retention, deletion | ❌ | None in repo. **B1.** |
| **Data Safety form** | Declare data collected/shared, purposes, encryption-in-transit, deletion option | ❌ (not derivable) | Needs the §6 data map. App uses HTTPS + HttpOnly session cookie (`auth.ts:34`) ✅ as a security input. |
| **User-Generated Content policy** | In-app reporting + blocking + content moderation; remove objectionable content | ⚠️ | Report ✅, block ✅, manual moderation queue ✅ (`AdminModerationPage.jsx`), but **no proactive scan** & no defined removal SLA. **B6.** |
| **Child Safety Standards (CSAE)** | Social/Dating apps must: comply with CSAE standards, **publish CSAE standards**, provide an **in-app CSAE reporting mechanism**, and a **published CSAE point of contact**; declare in Console | ❌ | None present. **B7.** Hard requirement for this category. |
| **Target audience & content** | Declare adult (18+) target audience; neutral age screen; no appeal to children | ⚠️ | 18+ enforced (see Apple row) but no neutral age screen; Console declaration pending. **B5.** |
| **Permissions & prominent disclosure** | Runtime consent + prominent disclosure for sensitive permissions (camera, microphone, location) | ⚠️ | App uses camera (photos), mic (voice notes `main.jsx:3490+`), city/location. Web prompts exist; **native wrapper must add prominent-disclosure dialogs** + Data-Safety entries. |
| **Misrepresentation / Deceptive behaviour** | No fake/non-functional features or false claims | ❌ | Fake Payment/Refund/Aadhaar/Safety rows. **B4.** |
| **Health/Sensitive, Financial** | If real money handled, declare; refunds policy | ✅/⚠️ | No real payments today; remove "Refund Center" copy (B4) to avoid implying a financial feature. |
| **Account/Data export (DPDP/GDPR alignment)** | Not a Play gate per se, but supports the privacy policy claims | ✅ | `GET /api/account/export` full JSON bundle (`account.ts:96-152`). |

---

## 3. Account-deletion compliance (cross-store) — detail

**What's compliant ✅**
- In-app **initiation** of permanent deletion (`DELETE /api/account` → `requestDeletion`, `account.ts:50-71`).
- Clear disclosure of the 30-day grace + what is erased (`ProfileDashboard.jsx:1966-1969`).
- Reversible **deactivation** offered as a distinct, lighter option (`/api/account/deactivate`).
- Actual **hard purge**: owned rows + R2 photos deleted, shared chat rows de-identified, scheduled sweep (`account.ts:159-213`).
- **Data export** before deletion (`/api/account/export`).
- Pending connection requests voided on deletion so peers aren't left hanging (`account.ts:64-68`).

**Gaps ❌/⚠️**
- **B3 — no public web deletion URL** (Play requires a reinstall-free path). Add a `/delete-account` web route/form that calls the same flow.
- ⚠️ `requestDeletion` does not explicitly purge `auth_sessions` (purge happens at grace end). Acceptable because the status guard blocks non-active users and re-login is intentionally allowed to *cancel* deletion — but document this so reviewers understand sessions persist only to enable cancellation.
- ⚠️ Confirm the purge cron is actually registered in `scheduled()` and in `wrangler.jsonc` triggers (the function exists; verify it's wired and tested end-to-end — Sprint-1 DoD "Delete→grace→purge verified").

---

## 4. Privacy requirements — detail

**Missing (documents/disclosures):**
- **B1 — Privacy policy**: no document, no in-app link, no listing URL. Must describe: identity/contact data (phone, email, full name), photos, Instagram handle, city/approx location, profession/college, chat content & attachments, device/session, analytics (`analytics_events`); purposes; retention (incl. 30-day deletion); third parties (SMS provider for OTP — `services/sms.ts`; any future maps); user rights (export ✅, delete ✅).
- **Consent at signup**: no notice-and-consent step before collecting personal/sensitive data (India **DPDP Act 2023** + GDPR-style notice). Add to onboarding alongside the EULA/age gate (ties to B2/B5).

**Already present (helps the privacy story):**
- Data **export** (access/portability right) ✅.
- Data **deletion** (erasure right) ✅.
- In-app **privacy controls**: incognito mode, show-age, show-distance toggles, persisted server-side (`settings.ts:16-84`) ✅.
- HttpOnly, `SameSite=Lax`, secure-attribute session cookie (`auth.ts:34`) ✅.

---

## 5. User-reporting requirements — detail

**Present ✅**
- Report **user / message / event** with typed reason + details; server validation, self-report blocked, reason/detail length caps (`moderation.ts:60-80`).
- Report UI on member profiles with reason picker (`main.jsx:3044-3062`).
- Admin **moderation queue** with status workflow open→reviewing→actioned→dismissed + resolver audit (`moderation.ts:104-117`, `AdminModerationPage.jsx`).
- Reports surface open-report counts on users/events for triage (`admin.ts`).

**Gaps ⚠️/❌**
- ❌ **No reporter acknowledgement / receipt** ("thanks, we'll review") — modal just closes (`main.jsx:2772-2781`). Both stores expect the reporter to see their report was received.
- ❌ **No response SLA / auto-mitigation.** Apple 1.2 expects acting on objectionable content (commonly read as ~24h) and the ability to remove it & eject the user. There's no auto-hide of reported content pending review, and no SLA tracking on `reports.status`.
- ⚠️ **Message reporting is reachable in code but not surfaced in the chat UI** — `createReport` accepts `target_type:'message'`, but the in-thread UI exposes report only at the profile level. Add an in-context "report this message" affordance.
- ❌ **No CSAE-specific report path** (distinct category + routing). Required by Play (B7).

---

## 6. Safety requirements — detail

**Present ✅**
- **Blocking** fully enforced both directions across all lists and chat-send (`visibility.ts:13-42`); block-list management UI (`main.jsx:5285`).
- **Suspend / ban / deactivate** account-status machine with reasons + status screens (`moderation.ts:20-47`, `main.jsx:738-781`).
- **18+ gate** enforced server-side (`index.ts:1032-1033`) and client-side (`OnboardingFlow.jsx:230`).
- **Verification** (phone OTP, selfie, Instagram) feeding a trust level (`settings.ts:89-129`) — note honesty relabel already done in Sprint 1.

**Gaps ❌/⚠️**
- **B6 — No proactive media moderation.** Profile photos and chat image/voice uploads go live with only MIME/size checks; no NSFW/CSAM scan or quarantine (Sprint-3 review §5 already flagged "NSFW hook ❌"). Apple 1.2 + Play UGC/CSAE expect filtering.
- **B7 — No CSAE program**: no published child-safety standards, no dedicated in-app CSAE reporting, no published point of contact. Mandatory for a dating app on Play.
- **B5 — No EULA/zero-tolerance acceptance** before posting UGC; no neutral age screen.
- ⚠️ **Fake "Safety Shield Guards / anti-harassment triggers / slow mode"** row (`main.jsx:5042-5045`) advertises safety features that don't exist → both a 1.2 honesty problem and B4.
- ⚠️ **Voice/recording duration cap is client-side only** (Sprint-3 review §6) — minor abuse surface.
- ⚠️ **Support contact is a placeholder** WhatsApp number (`main.jsx:5053`) — safety/abuse escalation has no real destination.

---

## 7. Missing requirements (consolidated)

**Documents / store-console artifacts (no code, but launch-blocking):**
1. Privacy Policy (hosted page + in-app link + listing URL). — B1
2. Terms of Service / EULA with zero-tolerance UGC clause. — B2
3. Child-Safety (CSAE) Standards document + published point of contact. — B7
4. Apple App Privacy nutrition label answers. — §1
5. Google Play Data Safety form answers + Data-deletion section (incl. web URL). — §2, B3
6. Age-rating questionnaire (Apple 17+/18+) and Play target-audience (18+) declaration. — B5
7. Real support contact (email/URL) replacing the placeholder WhatsApp number.

**Feature/flow requirements still missing:**
8. Public web account/data-deletion endpoint (reinstall-free). — B3
9. EULA + 18+ acknowledgement + privacy consent step at signup. — B2/B5
10. Proactive NSFW/CSAM scanning (or human pre-moderation) for photos & chat media. — B6
11. In-app CSAE reporting category + routing. — B7
12. Reporter acknowledgement + report-response SLA + ability to auto-hide/remove reported content. — §5

---

## 8. Implementation gaps (code-level, with refs)

| Gap | File / location | Action |
|---|---|---|
| Dead legal links | `src/ProfileDashboard.jsx:3448-3452` | Point About/Safety/Privacy/Terms/Guidelines to real hosted pages. |
| Fabricated settings rows | `src/main.jsx:5022-5056` | Remove "Payment Methods & Refund Center", "Safety Shield Guards", hard "100% Secure / Aadhaar verified" claim, placeholder WhatsApp; keep `BlockedMembersSection`. (Finishes SET-FE-01.) |
| Misleading footer claim | `src/ProfileDashboard.jsx:3454` "Manually Reviewed…" | Only keep if literally true; otherwise soften. |
| No legal pages | `public/` (none) + no worker route | Add hosted `privacy`, `terms`, `child-safety`, `delete-account` pages/routes. |
| No signup consent/age/EULA gate | `src/OnboardingFlow.jsx` (auth + Basics steps) | Add 18+ neutral gate + "I agree to Terms & Privacy" before account creation; persist consent + version. |
| In-app report has no receipt | `src/main.jsx:2772-2781` | Show confirmation; optionally return report id. |
| Message report not in chat UI | chat thread render (`main.jsx`) | Add per-message report action (backend already supports `target_type:'message'`). |
| Reports lack SLA/auto-mitigation | `worker/services/moderation.ts` + `reports` schema | Add `first_response_due_at`, optional auto-hide of reported target pending review. |
| No media scan hook | `uploadChatAttachment` / photo upload (`worker/index.ts`) | Add scan/quarantine step before content is visible (carry-over from Sprint-3 §5). |
| No web deletion path | new worker route | `GET/POST /delete-account` web form reusing `requestDeletion`. |
| Verify purge cron wiring | `worker/index.ts scheduled()`, `wrangler.jsonc` | Confirm `runScheduledPurge` is scheduled + e2e tested. |

---

## 9. Verdict

| Area | Verdict | Blocking? |
|---|---|---|
| Account deletion (in-app) | ✅ Shipped & correct | No |
| Account deletion (web URL) | ❌ Missing | **Yes (Play)** |
| Privacy policy / Terms / EULA | ❌ Missing entirely | **Yes (both)** |
| Privacy consent at signup | ❌ Missing | **Yes** |
| Reporting | ⚠️ Intake done; receipt/SLA/CSAE missing | **Yes (CSAE)** / partial |
| Blocking | ✅ Shipped & enforced | No |
| Proactive moderation (NSFW/CSAE) | ❌ Missing | **Yes (Play CSAE)** |
| Age gate (18+) | ⚠️ Enforced but no neutral/consent gate | Partial |
| Honest copy (no fake features) | ❌ Fake payment/safety/verify copy | **Yes (both)** |
| Login services (Apple 4.8) | ⚠️ Likely OK via email/phone; verify | Verify |

**Bottom line:** the engineering for H1's deletion/privacy-controls/reporting/blocking is done and good. To be **"Apple/Google ready"** the remaining work is almost entirely **(a) publish the four legal/policy documents and wire their links, (b) add a signup consent+age+EULA gate and a web deletion URL, (c) delete the fabricated copy, and (d) stand up media moderation + a CSAE program.** Items (a)–(c) are small-to-medium and unblock submission; (d) is the largest and is mandatory for Play's dating-category review.
