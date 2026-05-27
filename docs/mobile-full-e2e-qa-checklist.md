# Mobile Full E2E QA Checklist

Phase 34A verifies the Taskly mobile app across Customer and Provider workspaces, Core and Pro journeys, notifications, deep links, demo mode, role boundaries, and copy/layout. This is a QA runbook only. It must not add product features, admin mobile surfaces, Pro chat, payment/refund/payout workflows, or backend-owned business decisions.

## Blocker Severity Definitions

- `P0 blocker`: security, payment, role, contact visibility, or data ownership issue that can expose private data, charge incorrectly, release/refund incorrectly, bypass backend decisions, or break login for normal users.
- `P1 blocker`: primary journey cannot be completed for a valid user, such as Core payment setup, provider lifecycle action, Pro Access checkout, Pro response submit, site visit action, or support review request.
- `P2 major`: important state, copy, validation, loading, error, notification, or layout problem that confuses users but has a clear workaround and does not weaken backend authority.
- `P3 minor`: typo, spacing, low-risk copy mismatch, or non-blocking demo/documentation issue.

## Required Test Accounts

- Customer account with Customer Workspace access.
- Customer account with at least one open Core task and at least one task with interested Taskers.
- Customer account with a selected Tasker and Core task ready for payment protected setup.
- Customer account with an in-progress Core task and a task waiting for completion approval.
- Customer account with cancellation, support, refund, or disputed Core states.
- Customer account with a Pro request that has approved Pro responses and Pro Access not yet unlocked.
- Customer account with a paid/unlocked Pro Access request.
- Customer account with a Pro Access support/refund review available or under review.
- Provider account approved as a Core Tasker for a matching city/category.
- Provider account approved as a Taskly Pro professional for a matching city/category.
- Provider account that is pending/rejected as Pro or not eligible for the target city/category.
- Optional non-owner customer/provider accounts for access-denial checks.

## Backend/Mobile Prerequisites

- Backend API is running and reachable from the mobile device or simulator.
- Mobile app uses `EXPO_PUBLIC_TASKLY_API_BASE_URL` for the backend base URL.
- Mobile calls go through `src/lib/api/client.ts` and centralized endpoints in `src/lib/api/endpoints.ts`.
- Test users have known credentials and expected workspace access.
- Database contains test Core tasks, Pro requests, Pro responses, site visit invites, support states, and notification-capable users.
- Admin web is available for setup/inspection only; no admin mobile flow should appear.
- Expo config remains on SDK 54 and no Expo SDK upgrade is performed.

## Stripe Test-Mode Prerequisites

- Backend uses Stripe test-mode keys and test webhooks.
- Mobile uses only the publishable key through `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- No Stripe secret keys, webhook secrets, connected account secrets, or raw card data are present in the app bundle.
- Core payment setup uses backend-created setup/finalize endpoints and Stripe card collection only.
- Pro Access Checkout uses backend-created Checkout sessions and browser return behavior.
- Test cards are available for success, failure, and authentication-required paths.
- Verify no mobile path calculates fees, holds, captures, releases, refunds, payouts, or refund amounts.

## Notification/Device Prerequisites

- Use at least one physical iOS or Android device for push-token and tap-routing checks.
- Expo project id is configured for push token registration.
- Notification permission can be granted and denied during testing.
- Backend notification token registration/unregister routes are available.
- Sound and vibration preferences default to enabled unless backend/user settings say otherwise.
- Test notification payloads include safe `workspace`, `entityType`, `entityId`, and/or `routeHint` values only.
- Do not include private addresses, contact details, support text, Stripe ids, or payment internals in notification bodies or payloads.

## Customer Core Checklist

- Log in as a customer and confirm Customer Workspace screens load.
- Create a Core task from the mobile posting form.
- Confirm creation sends only customer-authored task fields and no lifecycle, payment, matching, provider, or image upload-owned fields.
- Confirm created task detail/list refresh from backend state.
- Confirm interested Taskers appear only when backend returns them.
- Select a Tasker from the customer screen and confirm backend returns selected/reserved state.
- Set up payment protected flow with Stripe test card.
- Confirm card handling is Stripe-owned and mobile does not store/send raw card data.
- Confirm payment protected badges/helper text appear only from backend payment state.
- With provider account, mark on the way, start task, and request completion.
- Return as customer and verify completion approval/rejection actions only show from backend `nextActions`.
- Reject completion with a reason and confirm the task returns to backend-authored in-progress/changes-requested state.
- Approve completion and confirm backend returns completed/released read-only state.
- Verify cancellation states: free cancellation, late cancellation, blocked after start, cancelled, and support review.
- Submit customer Core support/help request only when backend allows it.
- Verify Core refund/support state is read-only and does not promise automatic refunds.
- Verify loading, empty, error, unauthorized, and retry/demo states on list and detail screens.

## Provider Core Checklist

- Log in as an approved Core Tasker and open matching Core tasks.
- Confirm matching list respects backend city/category/approval filters.
- Open available task detail and confirm action label is `Express interest`.
- Submit interest and confirm it does not assign, reserve, create payment, or start work.
- Confirm duplicate interest returns safe already-interested state.
- Open assigned/reserved task and confirm private address/contact is shown only if backend returns it.
- Mark on the way only when backend allows it; confirm it does not start the task.
- Start task only when backend allows it; confirm it does not create payment or assignment records.
- Request completion only after start; confirm customer approval is still required.
- Report issue, cannot attend, or request support only when backend allows it.
- Confirm provider issue/support forms send only reason/details-style fields.
- Confirm pending/rejected/unverified Core Tasker sees blocked states and cannot mutate tasks.
- Verify loading, empty, error, unauthorized, and demo states.

## Customer Pro Checklist

- Log in as customer and create a Pro request.
- Confirm creation sends only customer-authored Pro request fields and no payment, access, unlock, response, admin, provider, or image-owned fields.
- Confirm Pro request list/detail shows response counts and limited previews from backend.
- Confirm Pro contact details remain hidden before backend unlock/contact rules allow them.
- Start Pro Access Checkout only when backend next actions allow it.
- Confirm unlock state refreshes after successful test checkout/return.
- Confirm unlocked comparison shows approved Pros and backend-authored comparison/contact fields.
- Confirm Pro Access copy says it unlocks comparison access and is not payment for renovation work.
- Invite an approved Pro for a site visit only after backend allows it.
- Cancel an active site visit invite only when backend allows it.
- Request Pro Access support/refund review only when backend allows it.
- Confirm support request form sends only `issueType`, `reason`, and `details`.
- Confirm support/refund card becomes read-only under-review state after submission.
- Verify no refund amount is shown unless backend returns a customer-safe amount label.
- Verify no Stripe ids/internal payment details are shown.

## Provider Pro Checklist

- Log in as an approved Pro and open matching Pro requests.
- Confirm matching respects Pro approval, city, and category eligibility.
- Confirm pending/rejected/wrong city/category Pro accounts see blocked states and cannot respond.
- Submit a Pro response with short message, rough quote range, materials selection, availability, and assumptions.
- Confirm response payload does not include customer contact details, lifecycle, matching, payment, access, or admin fields.
- Edit an existing response only when backend allows it.
- Confirm customer preview remains limited before Pro Access unlock.
- Receive a site visit invite and confirm contact/address fields are shown only when backend returns them.
- Accept, decline, or propose another time only when backend next actions allow each action.
- Confirm site visit actions do not imply final work agreement, payment, booking, or hiring.
- Verify loading, empty, error, unauthorized, and demo states.

## Pro Access Checkout Checklist

- Pro Access payment button appears only with backend `canUnlockProResponses` and payment next actions.
- Checkout route uses mobile auth and customer ownership.
- Mobile opens backend-provided Checkout URL and does not build Stripe sessions.
- Mobile sends no amount, currency, payment status, access status, Stripe id, or admin decision fields.
- Browser return/deep link refresh shows unlocked state after backend confirms payment.
- Failed/payment-problem state displays backend-authored error/retry state.
- Refunded/credited states remain read-only and do not trigger mobile refund behavior.
- Confirm Pro Access payment wording is separate from Core payment protected wording.

## Site Visit Checklist

- Customer invite action appears only for unlocked approved Pros when backend allows it.
- Customer invite form validates time window and blocks obvious contact details when required.
- Customer cancel invite action appears only when backend allows it.
- Provider accept/decline/propose actions appear only from backend next actions.
- Provider propose-another-time requires a proposed time window.
- Contact/address visibility is backend-owned and changes only when returned by backend.
- Copy states site visit is not a final work agreement.
- No site visit copy implies hiring, reservation, direct booking, deposit, or platform-managed work payment.

## Pro Access Support/Refund Checklist

- Support/refund card displays backend-authored state on list/detail.
- Request action appears only from `proAccessSupportNextActions` or `proAccessNextActions`.
- Form issue types are limited to safe supported values.
- Reason is required; details are optional.
- Backend validation errors display safely.
- Duplicate active review returns existing under-review state.
- No eligible Pro Access/payment context blocks request.
- Failed payment allows payment-problem review only if backend policy allows it.
- Non-owner customer cannot submit or view another customer request.
- Mobile sends no customer id, amount, currency, refund amount, payment/access status, Stripe id, admin decision, or support/refund status.
- No Stripe refund is issued and no refunded/credited state is marked automatically.
- Copy says Taskly will review the request and does not guarantee a refund.

## Notification/Deep-Link Checklist

- Customer and provider account screens load notification settings.
- Enabling push requests OS permission and registers an Expo token only on supported native devices.
- Denying permission leaves push disabled and shows a clear error.
- Disabling push unregisters the stored token and clears local token storage.
- Toggling sound/vibration/core/pro/message/payment/support/site-visit preferences saves through backend API.
- Demo mode updates notification settings locally and does not register tokens.
- Notification payloads route customer Core task, provider Core task, customer Pro request, provider Pro request, message thread, and settings targets.
- Tapping notification while logged out routes to login and preserves the pending safe target.
- Tapping notification with workspace mismatch routes to the correct fallback home instead of private detail.
- Unknown or malformed route data falls back safely.
- Deep link ids are encoded and reject path/query injection.

## Security/Role Checklist

- Customer cannot access provider routes without Provider Workspace access.
- Provider cannot access customer-owned resources without Customer Workspace access.
- Admin remains web-only with no admin mobile route or navigation entry.
- Non-owner customer task and Pro request detail/mutation calls are rejected.
- Non-assigned provider Core task lifecycle actions are rejected.
- Pending/rejected Pro cannot submit/edit Pro responses or act on site visit invites.
- Wrong city/category provider cannot see or act on non-matching Core/Pro work.
- Contact details, exact address, allowed contact fields, and site visit sharing are entirely backend-owned.
- Mobile wrappers do not send server-owned lifecycle, payment, payout, refund, matching, access, unlock, role, or admin fields.
- Mobile never reads Prisma/database directly and never includes secrets in source/config.

## i18n/Layout Checklist

- EN and BG strings exist for visible buttons, cards, validation, loading, success, and error states.
- Bulgarian copy fits buttons/cards on narrow screens without overflow or overlap.
- Customer and Provider workspaces use distinct Core and Pro visual/state wording.
- Public/professional copy uses no public version labels.
- Copy uses `payment protected`/`protected payment flow` only for Core protected payment contexts.
- Copy avoids the forbidden held-funds marketplace term.
- Provider open-task action says `Express interest`, not direct assignment/reservation wording.
- Provider Pro response action says submit/update response, not job acceptance wording.
- Site visit copy avoids hiring/reservation/final-agreement language.
- Pro Access copy consistently uses Pro Access, approved Pros, independent Pros, support review, and refund review.

## Demo-Mode Checklist

- Demo login/session switch remains available.
- Demo Customer Core states cover posting, selection, payment setup, in progress, pending completion, completion approval/rejection, cancellation, and support.
- Demo Provider Core states cover matching, interest sent, assigned/upcoming, on the way, started, completion request, and issue/support review.
- Demo Customer Pro states cover request creation, limited previews, Pro Access checkout simulation, unlocked comparison, site visit invite/cancel, and support/refund review.
- Demo Provider Pro states cover matching, response submit/edit, site visit accept/decline/propose.
- Demo notifications do not register or unregister real push tokens.
- Demo support/refund requests do not call backend mutation routes.
- Demo payment flows do not create real Stripe sessions, charge cards, issue refunds, release funds, or simulate real payouts.
- Demo copy clearly describes simulated/local behavior where needed.

## Known Deferred Items

- Admin mobile workspace remains out of scope.
- Pro chat remains out of scope until there is a dedicated backend/product decision.
- Advanced evidence uploads for support/refund reviews.
- Full admin support/refund resolution improvements.
- Stripe refund execution and refund accounting review.
- Outcome notifications for support/refund decisions.
- Store-release automation, accessibility audit, and long-form device matrix beyond this runbook.
