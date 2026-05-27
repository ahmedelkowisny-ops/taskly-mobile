# Mobile Full E2E QA Results

## Test Metadata

- Test date: 2026-05-27
- Phase: 34B Manual Real-Device QA Execution
- Device/simulator used: Codex Windows workspace static-assisted QA only. No physical iOS/Android device or simulator session was attached in this environment.
- Backend environment used: Not exercised through live authenticated test accounts in this session. Mobile API wrappers and endpoint wiring were inspected against the local app source.
- Mobile project: `D:\Taskly-app`
- Backend project: `D:\Taskly`, not changed in this phase.
- Expo SDK: confirmed by config as `54.0.0`

## Test Accounts Used

- Real customer account: Not available in this Codex session.
- Real provider Core Tasker account: Not available in this Codex session.
- Real provider Pro account: Not available in this Codex session.
- Non-owner/negative test accounts: Not available in this Codex session.
- Demo account/session: Verified by code inspection through `useDemoSession()` and demo mock paths. No passwords or secrets were used or recorded.

## Checklist Execution Summary

| Section | Status | Result |
| --- | --- | --- |
| Required test accounts | Blocked | Real accounts were not available from this environment. Demo/static paths inspected. |
| Backend/mobile prerequisites | Pass with manual follow-up | API base URL config, centralized endpoints, typed wrappers, and SDK 54 config verified. Live backend reachability from a device still needs manual confirmation. |
| Stripe test-mode prerequisites | Pass with manual follow-up | Mobile uses publishable-key path and backend-created payment/checkout wrappers. Native card entry and Checkout return need real device/manual test. |
| Notification/device prerequisites | Pass with manual follow-up | Settings, token registration/unregister, sound/vibration preferences, and deep-link resolver inspected. Actual push receipt/tap needs physical device. |
| Customer Core | Pass with manual follow-up | Screens, wrappers, demo states, backend `nextActions`, payment protected copy, completion/cancellation/support paths inspected. Full live journey needs real accounts. |
| Provider Core | Pass with manual follow-up | Matching/detail screens, express interest, lifecycle, cannot-attend/report/support paths, and provider wording inspected. Full live journey needs real accounts. |
| Customer Pro | Pass with manual follow-up | Request/list/detail, Pro Access, comparison, site visit, support/refund review, demo paths, and safe payloads inspected. Full live journey needs real accounts. |
| Provider Pro | Pass with manual follow-up | Matching/detail, submit/edit response, site visit accept/decline/propose paths, contact guard, and demo paths inspected. Full live journey needs real accounts. |
| Pro Access Checkout | Pass with manual follow-up | Backend-created checkout wrapper and browser handoff inspected. Stripe test checkout/return needs manual device test. |
| Site visit | Pass with manual follow-up | Customer invite/cancel and provider accept/decline/propose wrappers/UI inspected. Live backend state transitions need manual accounts. |
| Pro Access support/refund | Pass with manual follow-up | Request form, wrapper payload, demo under-review state, and copy inspected. Live duplicate/non-owner cases need backend test accounts. |
| Notification/deep link | Pass with manual follow-up | Pending logged-out route, workspace fallback, route sanitization, and settings card inspected. Real notification tap routing needs physical device. |
| Security/role | Pass with manual follow-up | Workspace guards, auth token usage, endpoint centralization, and wrapper payloads inspected. Live API denial checks need non-owner accounts. |
| i18n/layout | Pass with manual follow-up | EN/BG keys and copy sweep inspected. Narrow-screen screenshots still needed. |
| Demo mode | Pass | Demo branches keep payment, push, support, and Pro Access support simulation local where inspected. |

## Files Inspected

- `docs/mobile-full-e2e-qa-checklist.md`
- `app/customer/tasks.tsx`
- `app/customer/tasks/[taskId].tsx`
- `app/provider/core-tasks.tsx`
- `app/provider/core-tasks/[taskId].tsx`
- `app/customer/pro-requests.tsx`
- `app/customer/pro-requests/[proRequestId].tsx`
- `app/provider/pro-requests.tsx`
- `app/provider/pro-requests/[proRequestId].tsx`
- `src/lib/api/customer.ts`
- `src/lib/api/provider.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/api/domain.ts`
- `src/lib/api/mockApi.ts`
- `src/lib/api/notifications.ts`
- `src/lib/auth/AuthProvider.tsx`
- `src/lib/auth/workspaceAccess.ts`
- `src/components/taskly/WorkspaceGuard.tsx`
- `src/components/taskly/NotificationSettingsCard.tsx`
- `src/components/taskly/NotificationDeepLinkHandler.tsx`
- `src/lib/notifications/mobileNotifications.ts`
- `src/lib/navigation/deepLinks.ts`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/bg.ts`

## Customer Core Results

- Status: Pass with manual follow-up.
- Verified by inspection:
  - List/detail screens load through customer wrappers and `AuthProvider` token helper.
  - Customer task creation wrapper sends the typed creation payload through the centralized API client.
  - Select Tasker sends only `taskerId`.
  - Payment setup/finalize uses backend setup/finalize routes and Stripe card collection; mobile does not calculate release/capture behavior.
  - Completion approve/reject actions are shown from backend `nextActions`.
  - Cancellation/support forms send reason/details-style fields only.
  - Demo mode simulates selection, payment setup completion, completion approval/rejection, cancellation, and support review locally.
- Manual follow-up:
  - Complete the full live customer journey with a real customer/provider pair.
  - Capture screenshots for posting, selection, payment setup, pending completion, approval/rejection, and support states.

## Provider Core Results

- Status: Pass with manual follow-up.
- Verified by inspection:
  - Provider Core list/detail load through provider wrappers and Provider Workspace guard.
  - Open task action uses `Express interest`.
  - Express interest can pass only the tools confirmation flag.
  - On-the-way, start task, and request completion call dedicated backend routes and send empty/minimal payloads.
  - Cannot-attend/report/support flows send only `reason` and optional `details`.
  - Demo mode simulates interest sent, on the way, start, completion request, and issue/support review locally.
- Manual follow-up:
  - Run live approved, pending/rejected, wrong-city, wrong-category, duplicate-interest, and non-assigned lifecycle denial checks.

## Customer Pro Results

- Status: Pass with manual follow-up.
- Verified by inspection:
  - Customer Pro list/detail load through customer wrappers.
  - Pro Access checkout starts only through backend checkout wrapper.
  - Unlocked comparison and site visit actions are gated by backend state/next actions.
  - Site visit invite form validates time window and blocks obvious contact details.
  - Pro Access support/refund request sends only `issueType`, `reason`, and optional `details`.
  - Copy says Pro Access unlocks comparison access and is not payment for renovation work.
  - Demo mode simulates unlocked comparison, site visit invite/cancel, and support review without real backend/payment behavior.
- Manual follow-up:
  - Run live Pro request creation, response preview, Pro Access Checkout, unlock refresh, site visit invite/cancel, and support/refund review submission.

## Provider Pro Results

- Status: Pass with manual follow-up.
- Verified by inspection:
  - Provider Pro list/detail load through provider wrappers.
  - Submit/update response sends quote/message/availability/scope fields, not lifecycle/payment/access/admin fields.
  - Contact leakage guard is present in response and site visit forms.
  - Site visit accept/decline/propose actions use dedicated backend routes and backend next-action gating.
  - Site visit copy avoids final work agreement/payment implications.
  - Demo mode simulates response submit/edit and site visit actions locally.
- Manual follow-up:
  - Run live approved Pro, pending/rejected Pro, wrong-city/category Pro, response edit, and site visit action tests.

## Pro Access Checkout Results

- Status: Pass with manual follow-up.
- Verified by inspection:
  - Mobile opens backend-provided Checkout URL through browser handoff.
  - Checkout wrapper sends an empty body and does not send amount, currency, payment status, access status, Stripe ids, or admin decisions.
  - Pro Access support/refund states remain separate from Stripe refund execution.
- Manual follow-up:
  - Use Stripe test-mode cards on a physical device or simulator to verify success, failure, browser return, and refresh behavior.

## Site Visit Results

- Status: Pass with manual follow-up.
- Verified by inspection:
  - Customer invite/cancel and provider accept/decline/propose-time actions use centralized endpoints.
  - Customer invite requires safe user-authored fields and `proResponseId`.
  - Provider propose another time requires a time window.
  - Contact/address visibility is displayed only from backend-returned state.
- Manual follow-up:
  - Run live invite, cancel, accept, decline, propose another time, contact visibility, and address visibility scenarios.

## Pro Access Support/Refund Results

- Status: Pass with manual follow-up.
- Verified by inspection:
  - Form action appears from backend support/refund next actions.
  - Mobile validation covers required reason, max lengths, and obvious contact details.
  - Wrapper sends only safe fields.
  - Demo mode moves local state to under review and does not claim a real refund.
  - No mobile refund amount/outcome calculation or Stripe refund behavior was found.
- Manual follow-up:
  - Run live paid/unlocked, no-payment, failed-payment, duplicate active review, forbidden field, and non-owner cases against backend test accounts.

## Notification/Deep-Link Results

- Status: Pass with manual follow-up.
- Verified by inspection:
  - Notification settings use backend preferences routes.
  - Demo mode stores notification preference changes locally and does not register tokens.
  - Native token registration checks permissions, configures Android channel, and registers Expo token with backend.
  - Unregister clears stored token.
  - Deep-link resolver supports customer/provider Core tasks, Pro requests, message threads, and notification settings.
  - Logged-out pending route and workspace mismatch fallback are implemented.
  - Entity ids are encoded and path/query injection is rejected.
- Manual follow-up:
  - Physical iOS/Android device push permission, token registration, token unregister, sound/vibration, notification receipt, and notification tap routing.

## Security/Role Results

- Status: Pass with manual follow-up.
- Verified by inspection:
  - Workspace guards separate Customer and Provider surfaces.
  - API wrappers are split by customer/provider and use `AuthProvider` token helper from screens.
  - Centralized endpoints avoid hardcoded API URLs in screens.
  - Admin mobile routes/navigation were not found.
  - Mobile code does not directly access Prisma/database.
  - No secrets were added.
- Manual follow-up:
  - Use real non-owner and ineligible accounts to verify backend 401/403/404 behavior through mobile screens.

## i18n/Layout Results

- Status: Pass with manual follow-up.
- Verified by inspection:
  - EN/BG strings exist for current Core, Pro, support, notification, and demo surfaces inspected.
  - Copy sweep found expected Core payment wording and provider `Express interest` wording.
  - No app/source public UI copy using public version labels or the forbidden held-funds marketplace term was found.
- Manual follow-up:
  - Capture EN and BG screenshots on narrow mobile screens for Core detail, Provider Core detail, Customer Pro detail, Provider Pro detail, notification settings, and support/review forms.

## Demo-Mode Results

- Status: Pass.
- Verified by inspection:
  - Demo Customer Core covers selection, payment setup simulation, cancellation, completion approval/rejection, and support review.
  - Demo Provider Core covers interest, on the way, start, completion request, and issue/support review.
  - Demo Customer Pro covers unlocked comparison, Pro Access simulation, site visit invite/cancel, and support/refund review.
  - Demo Provider Pro covers response submit/edit and site visit accept/decline/propose.
  - Demo notifications do not register real push tokens.
  - Demo payment/support states are local simulations and do not issue real payment/refund/push behavior.

## Issues Found

- No P0/P1 code blockers found during static-assisted QA.
- No safe code fix was required.
- Manual execution gap: physical-device push testing, Stripe test payment/Checkout return, real backend account journeys, and screenshots could not be completed from this Codex environment.

## Screenshots Needed / Manual Follow-Up Notes

- Customer Core: task creation, Tasker selection, payment protected setup, provider lifecycle reflected to customer, completion reject/approve, cancellation/support.
- Provider Core: matching task, express interest, assigned task, on the way, start, request completion, cannot attend/support.
- Customer Pro: create Pro request, response previews, Pro Access Checkout, unlocked comparison, site visit invite/cancel, Pro Access support/refund review.
- Provider Pro: matching Pro request, submit/edit response, site visit accept/decline/propose.
- Notifications: permission prompt, settings toggles, token registration success/failure, notification tap route.
- EN/BG narrow-screen layout for all high-density forms and cards.

## Safe Fixes Made

- None. This phase added the execution report only.

## Deferred / Manual-Only Items

- Physical-device notification receipt and tap routing.
- Native Stripe card entry and Pro Access Checkout return.
- Live backend end-to-end account journeys.
- Non-owner and ineligible-account denial checks against real backend data.
- Screenshot capture across EN/BG and small-screen devices.
- Store-release accessibility/device matrix.

## Final Readiness Verdict

- Ready to commit this QA execution report: yes.
- Ready for final real-device release signoff: not yet. Manual device/account execution remains required for push notifications, Stripe flows, real backend state transitions, role denial checks, and screenshots.
