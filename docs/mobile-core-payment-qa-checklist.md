# Mobile Core Payment QA Checklist

Phase 24F verifies the Core happy path and protected payment setup before adding cancellation, disputes, Pro responses, Pro unlock, notifications, or store-readiness work.

## Required Local Env Variables

Mobile repo: `D:\Taskly-app`

```env
EXPO_PUBLIC_TASKLY_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

- `EXPO_PUBLIC_TASKLY_API_BASE_URL` must point to the local Taskly backend. Android emulators may need `http://10.0.2.2:3000`; physical devices usually need the computer LAN IP.
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` is a publishable Stripe key only. It is safe for the app bundle but still belongs in local `.env`, not source control.
- Do not put Stripe secret keys, webhook secrets, database URLs, mobile token secrets, refresh tokens, or raw card data in the mobile app.

Backend repo: `D:\Taskly`

- Configure backend-only Stripe/payment variables in the backend environment, not in mobile.
- Use backend test/mock payment settings only in local or approved non-production environments.

## Backend Prerequisites

- Backend server is running and reachable from the device or simulator.
- Mobile auth routes are available:
  - `POST /api/mobile/auth/login`
  - `GET /api/mobile/auth/session`
  - `POST /api/mobile/auth/refresh`
- Customer Core routes are available:
  - `GET /api/mobile/customer/tasks`
  - `GET /api/mobile/customer/tasks/[taskId]`
  - `POST /api/mobile/customer/tasks`
  - `POST /api/mobile/customer/tasks/[taskId]/select-tasker`
  - `POST /api/mobile/customer/tasks/[taskId]/payment/setup`
  - `POST /api/mobile/customer/tasks/[taskId]/payment/finalize`
  - `POST /api/mobile/customer/tasks/[taskId]/reject-completion`
  - `POST /api/mobile/customer/tasks/[taskId]/approve-completion`
- Provider Core routes are available:
  - `GET /api/mobile/provider/core-tasks`
  - `GET /api/mobile/provider/core-tasks/[taskId]`
  - `POST /api/mobile/provider/core-tasks/[taskId]/interest`
  - `POST /api/mobile/provider/core-tasks/[taskId]/on-the-way`
  - `POST /api/mobile/provider/core-tasks/[taskId]/start`
  - `POST /api/mobile/provider/core-tasks/[taskId]/request-completion`
- Catalog/posting routes return current cities, categories, and posting rules.
- Customer and provider accounts have valid mobile sessions.
- The Core category/city/schedule used in the test matches the approved Tasker profile.
- Stripe test mode or `MOCK_PAYMENTS` is configured on the backend. Mobile must never use backend secrets.
- Scheduled payment hold behavior is understood: mobile setup saves/links the payment method and finalizes assignment, while backend hold/capture/release remains server-owned.

## Mobile Prerequisites

- Dependencies are installed in `D:\Taskly-app`.
- `.env` exists locally and is ignored by Git.
- Demo mode remains available from the auth shell.
- The app uses `AuthProvider` and `useAuth()` for session/token access.
- API calls go through `src/lib/api/client.ts`, with paths centralized in `src/lib/api/endpoints.ts`.
- Stripe is initialized by `StripeProvider` with `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` only.
- Customer and Provider workspaces remain separated under `/customer/*` and `/provider/*`.
- Admin screens are not present in mobile.

## Test Users Needed

- Customer account:
  - Customer Workspace access.
  - Can create Core tasks.
  - Has no admin-only assumptions.
- Approved Tasker account:
  - Provider Workspace access.
  - Core Tasker status approved.
  - Stripe verification ready for Core payout-gated provider actions where required.
  - City and category match the test Core task.
- Optional dual-role provider:
  - Customer and Provider Workspace access.
  - Useful for checking workspace switching without leaking actions across roles.

## Stripe Test Card Guidance

- Use Stripe test card numbers only in local/test mode.
- Enter card data only in Stripe SDK UI (`CardField`), never in custom mobile fields.
- Mobile should receive only a backend-created SetupIntent client secret when setup is required.
- Mobile should send only safe references to finalize:
  - `paymentMethodId`, when returned by Stripe SDK.
  - `setupIntentId`, when returned by Stripe SDK.
- Mobile must not create SetupIntents, PaymentIntents, holds, captures, refunds, transfers, payouts, or fee calculations.
- Do not expose or commit `STRIPE_SECRET_KEY`, webhook secrets, connected account secrets, or raw card data.

## Core Happy Path

1. Customer logs in on mobile and opens Customer Workspace.
2. Customer creates a Core task with category, city, address/location, schedule, budget, description, and any allowed local images.
3. Confirm task creation response returns the created task and backend-authored `nextActions`.
4. Provider logs in on mobile and opens Provider Workspace.
5. Provider opens Core Tasks and sees the matching task.
6. Provider sees `Express interest`, not `Accept` or `Reserve`.
7. Provider expresses interest.
8. Confirm the provider response does not assign or reserve the task.
9. Customer opens task detail and sees interested Tasker previews without private contact data.
10. Customer selects the Tasker.
11. Confirm backend returns refreshed task detail with payment-required/payment-setup `nextActions`.
12. Customer prepares payment from task detail.
13. Stripe SDK confirms the backend-created SetupIntent.
14. Mobile calls payment finalize with safe Stripe references only.
15. Confirm the task refreshes into the backend-authored assigned/in-progress or payment-prepared state.
16. Provider sees the assigned task in Provider Core tasks.
17. Provider marks on the way only when backend `nextActions.canMarkOnTheWay` allows it.
18. Provider starts the task only when backend `nextActions.canStart` allows it.
19. Provider requests completion only when backend `nextActions.canRequestCompletion` allows it.
20. Customer sees completion review only when backend `nextActions.canApproveCompletion` or `canRejectCompletion` allows it.
21. Customer asks for changes with a non-empty reason.
22. Confirm task returns to in progress, without dispute/refund/help side effects.
23. Provider requests completion again.
24. Customer approves completion.
25. Confirm backend owns payment release/capture/payout behavior and mobile only displays the returned result or warning.

## Payment Setup Verification

- Payment setup UI appears only when at least one backend flag is true:
  - `canPreparePayment`
  - `canConfirmPayment`
  - `canRetryPayment`
- Missing `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` shows a safe unavailable message and does not call Stripe confirmation.
- `STRIPE_NOT_CONFIGURED` shows a safe unavailable message.
- `SETUP_NOT_AVAILABLE` shows a safe unavailable message.
- `MOCK_PAYMENTS` and `PAYMENT_NOT_REQUIRED` skip Stripe confirmation and call backend finalize only through the documented fallback path.
- Live Stripe setup calls happen in this order:
  1. `setupCustomerTaskPayment`
  2. Stripe SDK `confirmSetupIntent`
  3. `finalizeCustomerTaskPayment`
  4. Detail refresh from backend response
- Finalize payload contains only `paymentMethodId` and/or `setupIntentId`.
- No PaymentSheet flow is used.
- No Stripe secret key appears in mobile code, docs examples, logs, or `.env.example`.
- No raw card data is collected, stored, logged, or sent by mobile.

## Demo Mode Verification

- Continue in demo mode from the auth shell.
- Customer task detail can simulate:
  - Tasker selection.
  - Payment setup completion.
  - Reject completion with reason.
  - Approve completion.
- Provider task detail can simulate:
  - Express interest.
  - Mark on the way.
  - Start task.
  - Request completion.
- Demo payment setup must not call Stripe or backend payment endpoints.
- Demo copy uses:
  - `Express interest`
  - `Request completion`
  - `Approve completion`
  - `Ask for changes`
  - `Payment protected`
- Demo copy must not use `accept`, `reserve`, `complete task`, `escrow`, or public version labels.

## Failure-State Checklist

- Loading states render for list/detail API reads.
- Empty states render for no customer tasks and no provider Core tasks.
- Unauthorized/forbidden states show login/workspace guidance and do not expose task data.
- Network/backend errors show retry and demo-mode options where relevant.
- Missing API base URL becomes a safe API error.
- Payment setup errors show friendly text for:
  - `STRIPE_NOT_CONFIGURED`
  - `PAYMENT_NOT_CONFIGURED`
  - `PAYMENT_METHOD_REQUIRED`
  - `PAYMENT_SETUP_NOT_AVAILABLE`
  - `PAYMENT_SETUP_REQUIRED`
  - `PAYMENT_SETUP_INVALID`
  - `SETUP_NOT_AVAILABLE`
  - `TASK_NOT_RESERVED`
  - `NO_RESERVED_TASKER`
  - `RESERVATION_EXPIRED`
  - `BOOKING_NOT_FOUND`
  - `INVALID_PAYMENT_STATE`
  - `UNAUTHORIZED`
  - `FORBIDDEN`
- Stripe confirmation cancellation shows a friendly cancellation message.
- Customer reject completion requires a visible reason and enforces max length.
- Customer approve completion handles backend payment-not-ready responses.
- Provider actions show backend blocked reasons for too early, not assigned, not verified, not started, already waiting, completed, cancelled, disputed, and payment-not-ready cases.

## Regression Checklist

- Mobile does not import Prisma or call the database.
- Screens do not hardcode backend URLs.
- Mobile does not store secrets or refresh tokens outside `src/lib/auth/tokenStorage.ts`.
- `.env` remains ignored by Git.
- `.env.example` documents only safe public mobile variables.
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` is used only as a publishable key.
- No `STRIPE_SECRET_KEY`, `sk_test`, `sk_live`, or webhook secret exists in mobile source.
- Customer and Provider routes remain separated.
- Admin remains web-only.
- Provider Core and Provider Pro views remain visually/functionally separated.
- Provider Core open-task action says `Express interest`, not `Accept` or `Reserve`.
- Provider request-completion is not labeled as completing the task.
- UI uses `Payment protected` or `protected payment flow`, never `escrow`.
- Bulgarian labels fit narrow mobile widths and do not contain public version labels or rough placeholder wording.
- Sensitive actions rely on backend `nextActions`, not raw status-only mobile inference.
- Payment, cancellation, refund, dispute, matching, role, Pro unlock, commission, payout, capture, release, and lifecycle rules remain backend-owned.

## Known Blockers / Open Questions

- Real device testing still needs a reachable local backend URL and real test accounts with matching city/category data.
- Stripe test behavior must be verified on an iOS/Android device or simulator with the native Stripe SDK available.
- Expo package versions in the mobile repo should be reconciled with the repo instruction to consult Expo SDK v53 docs before future SDK-sensitive changes.
- The backend scheduled hold job remains separate from mobile payment setup; QA should confirm product copy does not imply an immediate hold.
- Provider runtime actions depend on schedule windows, so full happy-path testing may need controlled test times or test data.
- Cancellation, dispute, refund, support/help, Pro Access unlock/payment, Pro responses, notifications, store metadata, and production observability are intentionally out of scope for Phase 24F.
