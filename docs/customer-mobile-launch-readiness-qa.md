# Taskly Customer Mobile Launch-Readiness QA

Audit date: 2026-06-09  
Mobile repo: `D:\Taskly-app`  
Web/backend repo inspected: `D:\Taskly`  
Scope: customer-facing mobile launch readiness after the recent parity, support/trust, image, rewards, security, Pro, and help/legal batches.

Status legend: PASS, PASS WITH NOTES, NEEDS MANUAL PHONE TEST, ISSUE FOUND, LAUNCH BLOCKER, NOT APPLICABLE.

## 1. Executive summary

Overall status: **PASS WITH NOTES**.

The customer mobile app is close to launch-ready from a static QA and validation perspective. Core customer journeys are present: landing, auth/account, customer navigation, task posting, task detail/lifecycle, task edit/book-again, task photo upload, messages, support workspace, payment/cancellation trust copy, Taskly Pro requests, Pro unlock/payment/free-credit paths, approved-Pro profiles, Pro chat/photo messaging, rewards/referrals, help/legal, and profile/security.

No launch blockers were found in this audit. The main remaining risk is not missing code, but physical-device verification: Stripe test mode, map/address picker behavior, keyboard avoidance, photo library permissions, notification deep links, long Bulgarian copy, and real backend data states must be exercised on an Android phone before store submission.

Summary counts:

| Measure | Count |
|---|---:|
| QA areas checked | 23 |
| PASS | 8 |
| PASS WITH NOTES | 10 |
| NEEDS MANUAL PHONE TEST | 5 |
| ISSUE FOUND | 0 |
| LAUNCH BLOCKER | 0 |
| NOT APPLICABLE | 0 |

## 2. Test environment assumptions

Status: **PASS WITH NOTES**

- This was a static code and report audit, not a physical phone run.
- Mobile validation ran in `D:\Taskly-app`.
- The app uses Expo SDK 54-era dependencies in `package.json`, including `expo@^54.0.34`, `expo-router`, `expo-image-picker`, `expo-image-manipulator`, `expo-location`, `expo-notifications`, `react-native-maps`, and Stripe React Native.
- `app.config.ts` configures Android package `com.tasklyco.app`, Google Maps keys via `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY`, and location permission copy.
- Backend/mobile API behavior was inspected in `D:\Taskly`; no backend code was changed by this QA task.

## 3. Customer auth/account QA

Status: **PASS WITH NOTES**

Evidence:

- Mobile auth routes and wrappers exist in `src/lib/api/auth.ts`, `src/lib/auth/AuthProvider.tsx`, `src/lib/auth/tokenStorage.ts`, and `src/lib/api/endpoints.ts`.
- Login/register/logout routes are registered in `app/_layout.tsx`.
- Customer profile/security routes exist: `app/customer/profile.tsx`, `app/customer/settings.tsx`, `app/customer/security.tsx`.
- Change email/password wrappers exist in `src/lib/api/account.ts`; endpoints are centralized in `src/lib/api/endpoints.ts`.
- `tokenStorage.ts` stores auth tokens through a helper, not ad hoc screen storage.
- Customer routes use `useAuth()` and show login/demo/error states rather than reading refresh tokens directly.

Notes:

- Static inspection supports the flow, but refreshed-session behavior after change email should be tested against a real backend session on phone.
- Provider/admin routes are not linked from customer drawer/profile; workspace access helpers are backend-session driven.

Issue list: none.

## 4. Landing page QA

Status: **PASS WITH NOTES**

Evidence:

- `app/index.tsx` uses `TASKLY_WEBSITE_URL = 'https://tasklyco.com'`.
- Landing footer links use `https://tasklyco.com/{locale}/legal/terms` and `/privacy`.
- No `www.tasklyco.com` runtime links were found in inspected customer mobile surfaces.
- Shared logo usage is through `TasklyLogoText` in `PublicTopBar`, `CustomerTopBar`, drawer, and posting flows.
- Search did not find old `taskly-logo` or `taskly-logo-icon` runtime usage in inspected customer files.

Notes:

- Help/legal hub uses apex `https://tasklyco.com/terms`, `/privacy`, and `/legal`.
- Manual phone test should open every external link and confirm no SSL warning or in-app browser failure.

Issue list: none.

## 5. Customer navigation QA

Status: **PASS WITH NOTES**

Evidence:

- Customer drawer: `src/components/taskly/CustomerDrawer.tsx`.
- Bottom nav: `src/components/taskly/CustomerBottomNav.tsx`.
- Top bar: `src/components/taskly/CustomerTopBar.tsx`.
- Drawer links include Home, Activity summary, Tasks, Post Taskly Task, Pro projects, Start Pro Project, Messages, Support Messages, Help/legal, Contact support, Rewards, Payments & Unlocks, Profile, Security, Settings, and Logout.
- Bottom nav targets Home, Tasks, central Post action, Messages, and Profile.
- Post-task and post-Pro flows use wizard footer visibility helpers and bottom spacing.
- Public label for `/customer/dashboard` is now `Activity summary`, reducing Home/Dashboard confusion.

Notes:

- Navigation routes are intentionally preserved; this audit recommends no route removal.
- Scroll hide/reappear behavior and bottom padding require phone verification on long pages and during wizard flows.

Issue list: none.

## 6. Post task flow QA

Status: **NEEDS MANUAL PHONE TEST**

Evidence:

- `app/customer/post-task.tsx` includes category, city, address/map, description, images, schedule/date-time, budget, validations, image compression, image upload after creation, and safe API message handling.
- It uses catalog/posting rules from backend wrappers in `src/lib/api/catalog.ts`.
- It uses `pickTasklyImages`, `compressSelectedImages`, and `uploadSelectedImagesSequentially`.
- It uses `KeyboardAwareFormScreen` and a sticky footer with animated visibility.

Manual focus:

- Verify address/map selection does not block posting.
- Verify keyboard does not hide active inputs or footer CTAs.
- Verify date/time picker on Android.
- Verify category-specific budget/rule copy and Bulgarian labels fit.
- Verify image permissions, compression, upload progress, and partial upload warning.

Issue list: none from static audit.

## 7. Task list/detail/lifecycle QA

Status: **PASS WITH NOTES**

Evidence:

- Task list: `app/customer/tasks.tsx`.
- Task detail: `app/customer/tasks/[taskId].tsx`.
- API wrappers: `src/lib/api/customer.ts`; domain types: `src/lib/api/domain.ts`.
- Detail shows summary, scope checklist, schedule, budget, payment state, interested Taskers, images, timeline, next actions, cancellation/support cards, and completion approval/rejection.
- Sensitive lifecycle actions use backend-authored `nextActions`.
- Backend read model is in `D:\Taskly\src\lib\mobile-customer-readonly.ts`.

Notes:

- No lifecycle decision was found to be calculated only on mobile.
- Real backend task states should still be sampled manually: open, reserved/payment pending, in progress, pending completion, completed, cancelled, support review.

Issue list: none.

## 8. Task edit/book-again QA

Status: **PASS WITH NOTES**

Evidence:

- `app/customer/tasks/[taskId].tsx` shows the management card only from backend-authored `canEditBudget`, `canEditSchedule`, and `canBookAgain`.
- Budget/schedule update uses `updateCustomerTask`.
- Book again uses `bookAgainCustomerTask` and routes into post-task prefill.
- Backend read model exposes edit/book-again capability in `D:\Taskly\src\lib\mobile-customer-readonly.ts`.

Notes:

- Static code indicates safe prefill rather than duplicating payment, reservation, tasker, messages, or lifecycle state.
- Manual phone test should verify all validation messages and prefilled fields in EN/BG.

Issue list: none.

## 9. Task photo upload QA

Status: **PASS WITH NOTES**

Evidence:

- `app/customer/tasks/[taskId].tsx` supports safe post-creation add/upload when `task.nextActions.canUploadImages` is true.
- Upload uses existing picker/compression/upload helpers.
- Backend endpoint `D:\Taskly\src\app\api\mobile\customer\tasks\[taskId]\images\route.ts` checks auth, customer access, task ownership, max images, and blocks completed/disputed/cancelled states.
- Mobile shows count, loading/progress, success, error, and locked-state helper copy.
- Delete/manage UI is not shown, because no customer mobile delete endpoint was present.

Notes:

- This mirrors add/upload safely; full delete/manage parity remains deferred by design.
- Manual phone test should verify permission denial, max image count, and blocked task states.

Issue list: none.

## 10. Customer messages/chat/photo QA

Status: **PASS WITH NOTES**

Evidence:

- Message list: `app/customer/messages.tsx`.
- Thread detail: `app/customer/messages/[threadId].tsx`.
- API wrappers: `src/lib/api/messages.ts`.
- Thread detail gates composer and attachment UI using backend `capabilities.canSendText` and `capabilities.canSendAttachments`.
- Photo sending uses `sendMessageImage`, local picker/compression, and multipart upload.
- Read-only states and support resolution actions are handled.
- Backend message ownership/capability logic is in `D:\Taskly\src\lib\mobile-messages-readonly.ts`.

Notes:

- Real customer/task/Pro/support thread mixes should be tested with live backend data.
- Phone/email leakage prevention depends on backend read model; static inspection showed Pro/contact visibility remains capability driven.

Issue list: none.

## 11. Support workspace QA

Status: **PASS WITH NOTES**

Evidence:

- `/customer/messages?context=support` shows support case summary cards in `app/customer/messages.tsx`.
- Support case cards display issue type, linked task/Pro context, status, created/latest dates, photo evidence badge, message count, next recommended action, Open/reply CTA, and New support request CTA.
- Support form exists in `app/customer/support.tsx`.
- Backend support thread summaries are customer-scoped in `D:\Taskly\src\lib\mobile-messages-readonly.ts`.
- Support text/photo sends verify `customerUserId` server-side and reject resolved threads.

Notes:

- Admin-only notes/private fields were not found in the mobile support response shape.
- Needs real data testing for open, resolution requested, resolved, with-photo, task-linked, and Pro-linked support cases.

Issue list: none.

## 12. Payment/cancellation/refund/trust copy QA

Status: **PASS WITH NOTES**

Evidence:

- Customer task detail includes payment state card, payment setup card, cancellation/support card, support action card, and completion approval/rejection.
- Copy uses "payment protected" / "protected payment flow"; forbidden "escrow" search returned no customer-visible hits.
- Payments/unlocks screen exists at `app/customer/payments-unlocks.tsx`.
- Pro Access support/refund states are surfaced in Pro request detail.
- Backend remains source of truth for payment, cancellation, refund, and support states.

Notes:

- Stripe test mode and failure/retry paths require manual phone test with configured publishable key and backend test objects.

Issue list: none.

## 13. Taskly Pro request QA

Status: **PASS WITH NOTES**

Evidence:

- Pro request list: `app/customer/pro-requests.tsx`.
- Pro request creation: `app/customer/post-pro-request.tsx`.
- Pro detail/compare/unlock/site visit/support: `app/customer/pro-requests/[proRequestId].tsx`.
- Posting is free; image upload happens after creation.
- Locked/unlocked state and response comparison are backend-authored through `src/lib/api/customer.ts` and domain types.

Notes:

- Manual data-state test should include no responses, limited previews, meaningful responses, paid unlocked, credited, refunded/support review, selected Pro, and site visit states.

Issue list: none.

## 14. Pro unlock by payment QA

Status: **NEEDS MANUAL PHONE TEST**

Evidence:

- Pro detail includes Pro Access checkout wrapper and payment/support state display.
- Backend mobile endpoints exist under `/api/mobile/customer/pro-requests/[proRequestId]/access/checkout`.
- Mobile avoids Stripe secrets; it calls backend-created checkout/setup state.

Manual focus:

- Test Stripe mode setup, checkout return/reload, failed payment, pending payment, paid unlock, and refresh behavior.
- Confirm full comparison appears only after backend unlock state.

Issue list: none from static audit.

## 15. Pro unlock by free credit QA

Status: **PASS WITH NOTES**

Evidence:

- Rewards/free-credit state exists in `app/customer/rewards.tsx`.
- Pro detail uses the free-credit unlock path when backend state says it is available.
- Backend credit endpoint is centralized in `src/lib/api/endpoints.ts`.
- Reward logic remains backend-authored.

Notes:

- Must manually test with an account that actually has an eligible free Pro unlock credit.

Issue list: none.

## 16. Approved-Pro profile/portfolio QA

Status: **PASS WITH NOTES**

Evidence:

- Mobile approved-Pro profile route exists: `app/customer/pro-requests/[proRequestId]/pros/[proProfileId].tsx`.
- It is reached from unlocked Pro response/profile CTAs.
- Backend read model in `D:\Taskly\src\lib\mobile-customer-readonly.ts` controls unlocked profile fields and privacy.
- Portfolio image rendering/fallback is present in the profile route.

Notes:

- Manual test should confirm locked requests cannot deep-link into full profile and that phone/email/private contact fields remain hidden.

Issue list: none.

## 17. Pro chat/text/photo QA

Status: **PASS WITH NOTES**

Evidence:

- Pro chat uses unified mobile message thread route from Pro detail/profile.
- `app/customer/messages/[threadId].tsx` shows Pro context and Back to comparison.
- Text/photo sending uses backend message capabilities and `sendMessageImage`.
- Backend `D:\Taskly\src\lib\mobile-messages-readonly.ts` supports `pro_response` / `pro_chat` thread kinds and capability checks.

Notes:

- Manual test must confirm chat availability after unlock, selected-Pro separation, address/detail sharing rules, locked/closed rejection, and no phone/email leakage.

Issue list: none.

## 18. Rewards/referrals QA

Status: **PASS WITH NOTES**

Evidence:

- Rewards screen exists at `app/customer/rewards.tsx`.
- It displays balances, referral code/link, stats, activity/history, free Pro unlock credits, copy, native share, redemption, and action states.
- API wrapper exists in `src/lib/api/rewards.ts`.
- Customer-visible reward wording uses Taskly/Taskly Pro language; no visible "Core" leakage was found in the customer screen search.

Notes:

- Native share and clipboard behavior require device testing.
- Cash redemption state should be tested with backend data for enough/not-enough points and pending redemption.

Issue list: none.

## 19. Help/legal links QA

Status: **PASS WITH NOTES**

Evidence:

- Help/legal hub: `app/customer/help.tsx`.
- Legal links use:
  - `https://tasklyco.com/terms`
  - `https://tasklyco.com/privacy`
  - `https://tasklyco.com/legal`
- Landing footer uses apex `https://tasklyco.com` and localized legal routes.
- Profile/settings/customer drawer route to help/legal and support.
- No `www.tasklyco.com` runtime link was found in inspected customer surfaces.

Notes:

- Manual phone test should verify every external link opens correctly and no SSL warning appears.

Issue list: none.

## 20. Profile/settings/security QA

Status: **PASS WITH NOTES**

Evidence:

- Profile: `app/customer/profile.tsx`.
- Settings: `app/customer/settings.tsx`.
- Security: `app/customer/security.tsx`.
- Profile links reach security, settings/language, rewards, payments, tasks, Pro requests, help/legal, support, and support messages.
- Security screen includes change password and change email.
- Settings includes language and notification preferences.

Notes:

- Change email must be tested against live backend for refreshed session/token behavior.
- Language toggle should be tested mid-form to ensure no form progress loss where applicable.

Issue list: none.

## 21. EN/BG localization QA

Status: **NEEDS MANUAL PHONE TEST**

Evidence:

- Customer visible strings live in `src/lib/i18n/en.ts` and `src/lib/i18n/bg.ts`.
- Recent trust copy uses natural Bulgarian for "payment protected", support, task photos, and help/legal.
- Static search did not find obvious missing keys in inspected customer screens.

Manual focus:

- Bulgarian button/card overflow on post-task, task detail actions, support workspace, Pro unlock, rewards, and security.
- Mixed English in runtime customer screens.
- All-caps Bulgarian labels in badges/cards.
- Long Pro/legal/support labels on smaller Android devices.

Issue list: none from static audit.

## 22. Forbidden public wording QA

Status: **PASS**

Search targets:

- Core
- V1
- Version 1
- escrow
- our workers
- our electricians

Result:

- No customer-visible forbidden wording was found in inspected customer routes/translations.
- Remaining `core` hits are internal identifiers, type values, status badge tone names, backend context names, or provider/auth helper labels.
- Customer-visible wording uses Taskly, Taskly Pro, Taskly task, independent Taskers, approved Pros, and payment protected.

Issue list: none.

## 23. Bottom nav / scroll / keyboard spacing QA

Status: **NEEDS MANUAL PHONE TEST**

Evidence:

- Shared `Screen` and `KeyboardAwareFormScreen` provide content padding/keyboard behavior.
- Customer post-task and post-Pro wizards use footer visibility logic.
- Bottom nav visibility is centralized in `CustomerBottomNav`.
- Posting flows use large bottom padding and animated footer pointer events.

Manual focus:

- Scroll every customer page to bottom.
- Confirm final content is not hidden behind bottom nav.
- Confirm bottom nav hides/reappears as expected.
- Confirm keyboard does not cover active input or submit CTA.
- Confirm bottom nav reappears after submit/exit.

Issue list: none from static audit.

## 24. Performance and image-handling QA

Status: **PASS WITH NOTES**

Evidence:

- Image picker/compression helpers live in `src/lib/images/imagePicker.ts`.
- Task/Pro creation and task detail upload use compression before upload.
- Message photo sending uses one selected image and multipart upload.
- Official logo is rendered as reusable text/logo component, not a large legacy bitmap.
- Lists are mostly ordinary React Native maps; expected launch data volume is moderate.

Notes:

- Manual test should watch memory/performance while selecting multiple large photos.
- Long lists may need virtualization later if real production data volume grows substantially.

Issue list: none.

## 25. Deep links / notification readiness QA

Status: **NEEDS MANUAL PHONE TEST**

Evidence:

- Notification APIs and preference wrappers exist in `src/lib/api/notifications.ts` and `src/lib/api/endpoints.ts`.
- `NotificationBell` and `NotificationDeepLinkHandler` inspect workspace access before navigation.
- Route data supports customer/provider workspace targeting.

Manual focus:

- Push token registration/unregistration.
- Notification permission prompt.
- Customer task/message/Pro request deep links.
- Workspace mismatch behavior.
- Cold-start notification open.

Issue list: none from static audit.

## 26. High-risk launch blockers

Status: **PASS**

No launch blockers found.

Potential launch-blocker candidates that still need phone confirmation:

- Stripe test-mode unlock/payment setup works end to end.
- Android map/address picker does not block posting.
- Photo permissions and uploads work on a real device.
- Notification deep links open the correct customer routes.

None of those were proven broken by static inspection.

## 27. Medium-risk issues

Status: **PASS WITH NOTES**

1. Physical-device coverage is still required.
   - Screen/route: multiple customer routes
   - File path: `app/customer/**`
   - Problem: static validation cannot prove keyboard, picker, Stripe, notification, or external link behavior.
   - Expected behavior: all device integrations work on Android without blocking core flows.
   - Risk level: Medium
   - Recommended fix: run the manual phone checklist below before store submission.
   - Blocks launch: No, unless manual testing finds failures.

2. Task photo delete/manage remains intentionally deferred.
   - Screen/route: `/customer/tasks/[taskId]`
   - File path: `app/customer/tasks/[taskId].tsx`
   - Problem: mobile supports safe add/upload but does not show delete/manage because no customer mobile delete endpoint was present.
   - Expected behavior: no delete/manage UI unless backend support exists.
   - Risk level: Medium
   - Recommended fix: defer to a dedicated image-management phase if product requires delete.
   - Blocks launch: No.

3. Registration terms text should be manually checked for link behavior.
   - Screen/route: `/register`
   - File path: `src/components/taskly/RegistrationScreens.tsx`
   - Problem: static scan confirms terms/privacy text, but this audit did not prove it opens legal pages from registration.
   - Expected behavior: users can review Terms/Privacy before accepting.
   - Risk level: Medium
   - Recommended fix: verify on phone; add explicit link handlers later if missing.
   - Blocks launch: No, but important for store/legal polish.

## 28. Low-risk polish items

Status: **PASS WITH NOTES**

1. Reviews remain deferred/placeholder account functionality.
   - Risk level: Low
   - Blocks launch: No.

2. Mobile unifies support/admin/task/Pro messages differently than web.
   - Risk level: Low
   - Blocks launch: No.

3. The parity report is older than the latest support/trust polish.
   - Risk level: Low
   - Blocks launch: No.
   - Recommendation: refresh parity report after this QA report is accepted.

4. Real production list volumes may require virtualization later.
   - Risk level: Low
   - Blocks launch: No.

## 29. Manual phone test checklist

Status: **NEEDS MANUAL PHONE TEST**

Run this on an Android phone using a real backend test environment:

1. Fresh install/open app.
2. Confirm landing logo, sticky navigation, footer, website link, Terms link, Privacy link.
3. Register a customer account or log in with a fresh customer test account.
4. Log out and log in again.
5. Switch EN/BG from settings; return to EN and BG at least once.
6. Open customer drawer and every drawer destination.
7. Use bottom nav: Home, Tasks, Post, Messages, Profile.
8. Scroll every customer page to the bottom and confirm bottom content is not hidden.
9. Start Post Task.
10. Select category, city, address/map, schedule/date/time, budget, description.
11. Add an image from photo library.
12. Deny photo permission once if possible, then allow and retry.
13. Submit task and confirm image upload progress/success.
14. Open created task detail.
15. Edit schedule.
16. Edit budget where allowed.
17. Upload an additional task photo after posting.
18. Confirm completed/disputed/cancelled tasks do not allow photo upload.
19. Open task chat and send text.
20. Send a task chat photo.
21. Create/open a support request.
22. Open support workspace and verify issue type, linked context, status, dates, photo badge, message count, next action.
23. Send a support text reply.
24. Send a support photo.
25. Test support resolution accept/refuse if backend data is available.
26. Post a Taskly Pro request with image.
27. Open Pro request list/detail.
28. Confirm locked state shows limited previews only.
29. Unlock Pro by payment in Stripe test mode.
30. Unlock Pro by free credit with an eligible test account.
31. Confirm full comparison appears after unlock.
32. Open approved-Pro profile/portfolio.
33. Confirm no phone/email/private contact fields are exposed before allowed selection/contact flow.
34. Open Pro chat and send text.
35. Send a Pro chat photo.
36. Select Pro where allowed and verify address/details sharing copy.
37. Open Rewards; copy referral link.
38. Use native Share for referral.
39. Redeem free Pro unlock credit where eligible.
40. Open Help/legal and all legal links: `https://tasklyco.com/terms`, `https://tasklyco.com/privacy`, `https://tasklyco.com/legal`.
41. Change password.
42. Change email and confirm session remains valid or refreshes safely.
43. Trigger/read a customer notification if available.
44. Open notification deep link from foreground/background/cold start if possible.
45. Log out and log back in.

## 30. Recommended next actions before store submission

Status: **PASS WITH NOTES**

1. Run the full Android manual checklist above.
2. Test Stripe payment/Pro unlock in backend test mode with at least one success, fail, pending, and retry case.
3. Test address/map picker with the production Google Maps Android key.
4. Test photo upload on real camera-library images larger than 5 MB.
5. Test notification permission, token registration, and deep links.
6. Test BG text on a small Android screen.
7. Confirm registration Terms/Privacy link behavior.
8. Refresh `docs/customer-web-mobile-parity-report.md` to reflect the latest support/trust polish and this QA result.
9. Keep task image delete/manage deferred unless product requires it before launch.

## Files inspected

Mobile:

- `app/index.tsx`
- `app/customer/**`
- `src/components/taskly/CustomerDrawer.tsx`
- `src/components/taskly/CustomerBottomNav.tsx`
- `src/components/taskly/CustomerTopBar.tsx`
- `src/components/taskly/PublicTopBar.tsx`
- `src/components/taskly/TasklyLogoText.tsx`
- `src/components/ui/**`
- `src/lib/api/**`
- `src/lib/auth/**`
- `src/lib/images/**`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/bg.ts`
- `app.config.ts`
- `package.json`
- `docs/customer-web-mobile-parity-report.md`

Web/backend:

- `D:\Taskly\src\app\api\mobile\**`
- `D:\Taskly\src\lib\mobile-customer-readonly.ts`
- `D:\Taskly\src\lib\mobile-messages-readonly.ts`
- `D:\Taskly\messages\en.json`
- `D:\Taskly\messages\bg.json`

## Validation

This QA task changed only this markdown report.

Validation commands requested for `D:\Taskly-app`:

- `npx tsc --noEmit`
- `npm run lint`
- `git diff --check`

Results are recorded in the assistant final response for this audit run.

