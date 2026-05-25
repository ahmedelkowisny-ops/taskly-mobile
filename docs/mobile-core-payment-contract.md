# Mobile Core Payment Contract

Phase 24A is a review and contract phase only. It does not connect mobile payment, add Stripe SDK code, create payment routes, or change backend payment behavior.

## Backend Files Inspected

Backend/web repo: `D:\Taskly`

- `prisma/schema.prisma`
- `src/app/actions.ts`
- `src/app/actions/payments.ts`
- `src/lib/stripe-ops.ts`
- `src/components/customer/CustomerDashboardContent.tsx`
- `src/components/SaveCardSetupForm.tsx`
- `src/lib/mobile-customer-readonly.ts`
- `src/lib/mobile-provider-readonly.ts`
- `src/lib/mobile-provider-core-actions.ts`
- Existing mobile customer/provider API route patterns under `src/app/api/mobile/*`

Mobile repo: `D:\Taskly-app`

- `docs/mobile-api-integration-plan.md`
- `docs/mobile-customer-completion-contract.md`
- `docs/mobile-provider-core-actions-contract.md`
- `docs/mobile-core-journey-qa-checklist.md`
- `src/lib/api/domain.ts`
- `src/lib/api/endpoints.ts`
- `AGENTS.md`

Expo SDK v53 docs were checked before this review, per repo instructions.

## Current Web/Backend Core Payment Flow

The current Core payment flow is customer-owned and split across reservation, card/payment method setup, assignment finalization, scheduled authorization hold, and completion approval.

1. Provider expresses interest.
   - This is separate from payment.
   - Provider interest does not reserve, assign, create payment, or start any Stripe object.

2. Customer selects a tasker through `reserveTasker(taskId, taskerId)` in `src/app/actions.ts`.
   - Requires authenticated customer ownership, schedule, city match, matching preflight, verified tasker, category eligibility, and schedule conflict checks.
   - Sets task `status = RESERVED`.
   - Sets `reservationState = RESERVED`.
   - Sets `reservedTaskerId`, `reservationToken`, and `reservationExpiresAt` for a 10 minute reservation window.
   - Creates a `Booking` with `status = RESERVED` and the same reservation token.
   - Marks the selected interest as `SELECTED` and other interests as `NOT_SELECTED`.
   - Does not create a Stripe PaymentIntent.
   - Does not assign `taskerId` yet.

3. Customer starts payment through `startPayment(taskId, reservationToken)` in `src/app/actions.ts`.
   - Requires Stripe configuration or `MOCK_PAYMENTS=true`.
   - Requires authenticated non-admin customer ownership.
   - Requires task `status = RESERVED`, `reservationState = RESERVED`, matching token, unexpired reservation, and schedule.
   - Moves `reservationState` to `PAYMENT_PENDING`.
   - Is idempotent for the same token when already `PAYMENT_PENDING`.
   - Does not create a SetupIntent or PaymentIntent.

4. Web tries `finalizePayment(taskId, reservationToken)` in `src/app/actions/payments.ts`.
   - Requires Stripe configuration or mock payments.
   - Requires authenticated customer ownership and matching booking token.
   - Requires schedule.
   - Accepts idempotent re-entry when task is already `IN_PROGRESS` and payment is `HELD`, `PAID_HELD`, `INITIATED`, or `HOLDING`.
   - Requires `reservationState = PAYMENT_PENDING` and matching token.
   - Re-checks selected tasker and schedule conflicts.
   - In live Stripe mode, if no saved `stripePaymentMethodId` exists, it resets `reservationState` to `RESERVED` and returns `reasonCode: PAYMENT_METHOD_REQUIRED`.
   - In mock/non-live mode, it can create mock customer/payment method ids.
   - Upserts a `Payment` as `INITIATED` with amount, fee, net, tasker, Stripe customer id, and saved payment method id.
   - Sets task `status = IN_PROGRESS`, `reservationState = NONE`, `taskerId = reservedTaskerId`, `assignedAt`, `paymentId`, and clears reservation token/expiry.
   - Sets booking `status = ACTIVE`.
   - Does not immediately authorize or capture the payment hold.

5. If `PAYMENT_METHOD_REQUIRED`, web calls `createSetupIntentForTask(taskId)`.
   - Requires authenticated customer ownership.
   - Requires schedule.
   - Allows task `status = RESERVED` and `reservationState` of `RESERVED` or `PAYMENT_PENDING`.
   - Creates or updates the `Payment` as `INITIATED`.
   - In live Stripe mode, creates a Stripe customer if needed and returns a SetupIntent `clientSecret` plus `customerId`.
   - If a payment method already exists, returns `reasonCode: ALREADY_HAS_PM` and the stored payment method id.
   - In mock/non-live mode, stores a mock payment method and returns `mock: true`, `customerId`, and `paymentMethodId`.

6. Web card collection uses `SaveCardSetupForm`.
   - Uses Stripe.js `confirmCardSetup(clientSecret, { payment_method: { card } })`.
   - Extracts a `paymentMethodId`.
   - Calls `savePaymentMethodForTask(taskId, paymentMethodId, customerId)`.

7. `savePaymentMethodForTask` stores the payment method server-side.
   - Requires authenticated customer ownership and schedule.
   - In live mode, verifies the `customerId` matches the payment's stored Stripe customer id.
   - Rejects invalid payment method ids.
   - Upserts `Payment` as `INITIATED` and stores `stripeCustomerId` and `stripePaymentMethodId`.
   - Sets the Stripe customer's default payment method in live mode.
   - Does not assign the task and does not create a PaymentIntent.

8. Web re-runs `startPayment` and `finalizePayment`.
   - On success, the task becomes `IN_PROGRESS`, booking becomes `ACTIVE`, and payment remains `INITIATED`.
   - The provider can see the assigned task and may become eligible for runtime actions because the saved payment method or `INITIATED` status is treated as execution-ready by current backend checks.

9. Scheduled hold runs through `holdScheduledPayments()` in `src/app/actions.ts`.
   - Scans tasks scheduled within the next 24 hours, not started, and not in terminal or blocked statuses.
   - Requires an existing `Payment` with `stripeCustomerId`, `stripePaymentMethodId`, no `stripePaymentIntentId`, and not already held/released/refunded/cancelled/disputed.
   - Sets payment `status = HOLDING`.
   - Calls `createManualPaymentIntent(amount, customerId, paymentMethodId, idempotencyKey)`.
   - `createManualPaymentIntent` creates a live Stripe PaymentIntent with `confirm: true`, `capture_method: "manual"`, and `off_session: true`.
   - In mock/non-live conditions, it returns a mock PaymentIntent id with `requires_capture`.
   - On success, sets payment `status = HELD` and stores `stripePaymentIntentId`.
   - On failure, resets payment `status = INITIATED`.

10. Provider runtime actions use backend payment readiness.
    - `markOnTheWay` and `startTask` require assigned tasker, verified tasker, allowed task state, schedule, and payment execution readiness.
    - Current execution readiness is true when a saved payment method exists or payment status is `INITIATED`, `HOLDING`, `HELD`, or legacy `PAID_HELD`.
    - These actions do not create payment, booking, assignment, reservation, hold, capture, release, or refund records.

11. Customer approval uses existing completion/payment logic.
    - `approveCompletion(taskId)` requires `PENDING_COMPLETION`, started task, and payment readiness.
    - If a `stripePaymentIntentId` exists and payment is not already `RELEASED`, it checks Stripe state and captures if capturable.
    - Updates task `status = COMPLETED`, `reservationState = RELEASED`.
    - Updates payment `status = RELEASED`, `releasedAt`, transfer/payout fields.
    - Updates bookings to `COMPLETED`.
    - Mobile approve-completion already wraps this existing logic and must remain separate from payment setup phases.

## Payment State Machine

### TaskStatus

- `OPEN`: posted and available for provider interest.
- `RESERVED`: customer selected a provider and the reservation lock is active.
- `IN_PROGRESS`: payment setup/finalization assigned the task; provider runtime can proceed when backend gates allow it.
- `PENDING_COMPLETION`: provider requested completion; customer may approve or ask for changes.
- `COMPLETED`: customer approval completed the task and release path.
- `DISPUTED`: support review.
- `CANCELLED_BY_CUSTOMER_GRACE`, `CANCELLED_BY_CUSTOMER_LATE`, `CANCELLED`: cancellation states. Cancellation/refund/help remain out of this mobile payment phase.

### ReservationState

- `NONE`: no active reservation/payment lock.
- `RESERVED`: customer selected a provider; payment has not started or was reset after missing payment method.
- `PAYMENT_PENDING`: customer started payment finalization for a matching token.
- `PAID_HELD`: legacy state present in enum and checks, but current finalization sets task reservation state back to `NONE` and payment status `INITIATED`.
- `RELEASED`: task completion approval released the payment.
- `REFUNDED`: refund/cancellation path, not part of mobile payment entry.
- `FAILED`: failed reservation/payment state, not a mobile-owned transition.

### BookingStatus

- `REQUESTED`: enum exists, not the active selection flow observed.
- `RESERVED`: created by `reserveTasker` with the reservation token.
- `EXPIRED`: set when reservation or payment-pending reservation expires.
- `CANCELLED`: cancellation paths.
- `ACTIVE`: set by `finalizePayment` after payment method/finalization succeeds.
- `COMPLETED`: set by completion approval.

### PaymentStatus

- `INITIATED`: payment record exists, card/payment method is prepared, and scheduled hold has not succeeded yet.
- `HOLDING`: scheduled hold job is currently attempting manual authorization.
- `HELD`: manual authorization hold exists and can later be captured on approval.
- `RELEASED`: approval/capture/release path completed.
- `DISPUTED`: support review.
- `REFUNDED`: refund path.
- `CANCELLED_WITH_FEE`: late cancellation fee path.
- `FAILED`: failed payment path.

### Important Transition Map

| Step | TaskStatus | ReservationState | BookingStatus | PaymentStatus |
| --- | --- | --- | --- | --- |
| Task posted | `OPEN` | `NONE` | none | none |
| Customer selects tasker | `RESERVED` | `RESERVED` | `RESERVED` | none |
| Customer starts payment | `RESERVED` | `PAYMENT_PENDING` | `RESERVED` | none or existing `INITIATED` |
| Card setup needed | `RESERVED` | reset to `RESERVED` | `RESERVED` | `INITIATED` after setup intent/payment upsert |
| Card saved | `RESERVED` | `RESERVED` or `PAYMENT_PENDING` | `RESERVED` | `INITIATED` with `stripePaymentMethodId` |
| Finalize after card | `IN_PROGRESS` | `NONE` | `ACTIVE` | `INITIATED` |
| Scheduled hold running | usually `IN_PROGRESS` | `NONE` | `ACTIVE` | `HOLDING` |
| Scheduled hold succeeds | usually `IN_PROGRESS` | `NONE` | `ACTIVE` | `HELD` |
| Hold fails | usually `IN_PROGRESS` | `NONE` | `ACTIVE` | `INITIATED` |
| Provider requests completion | `PENDING_COMPLETION` | unchanged | `ACTIVE` | `HELD` or compatible status expected |
| Customer rejects completion | `IN_PROGRESS` | unchanged | `ACTIVE` | unchanged |
| Customer approves completion | `COMPLETED` | `RELEASED` | `COMPLETED` | `RELEASED` |

## Recommended Mobile Phase Order

1. Phase 24B: Backend-authored customer payment nextActions/read-only state alignment.
   - Extend customer task list/detail read-only responses with payment capability fields before any button is wired.
   - Include payment state, payment required/prepared/protected indicators, and blocked reasons from backend logic.

2. Phase 24C: Mobile customer select/reserve tasker entry point.
   - Only if product wants selection in mobile before payment.
   - Must wrap the existing `reserveTasker` behavior through a dedicated mobile route with mobile auth and customer ownership.
   - Must return refreshed task detail and `nextActions`.

3. Phase 24D: Mobile payment setup endpoint contract.
   - Server creates/reuses Stripe customer and SetupIntent using existing backend rules.
   - Mobile may receive SetupIntent `clientSecret` only when required by the approved Stripe mobile setup flow.
   - No PaymentIntent creation or hold from mobile.

4. Phase 24E: Mobile Stripe SDK integration/card collection.
   - Add Stripe mobile SDK only in this phase.
   - Collect card details using server-created setup parameters after the exact Stripe mobile flow is approved.
   - No mobile business logic beyond Stripe SDK collection and backend-authored follow-up.

5. Phase 24F: Mobile payment method save/finalize endpoint.
   - Backend verifies customer, task, reservation token, saved payment method, schedule, tasker, conflicts, booking, and payment state.
   - Backend assigns task and returns refreshed task detail/nextActions.
   - Still no immediate capture/release/refund logic.

6. Phase 24G: Payment error/retry UI.
   - Show backend error codes and retry states.
   - Keep cancellation/refund/dispute/help separate.

This order keeps read-only truth first, then selection, then payment setup, then Stripe collection, then backend finalization, then retry polish.

## Proposed Mobile Endpoint Contracts

These are proposals only. Do not create these routes until their dedicated phases.

### `POST /api/mobile/customer/tasks/[taskId]/select-tasker`

Purpose: customer selects a provider and creates the short reservation lock.

- Auth: mobile auth required.
- Workspace: customer workspace access required.
- Ownership: task `authorId` must equal authenticated customer id.
- Task requirements: not deleted, scheduled start/end present, task currently selectable according to existing `reserveTasker` rules.
- Provider requirements: selected tasker id must be backend-validated for verification, city, category/capability, and schedule conflicts.
- Request body:

```ts
{
  taskerId: string;
}
```

- Mobile must not send: customer id, provider ownership fields other than the selected `taskerId`, status, booking status, reservation state/token/expiry, payment fields, Stripe fields, schedule conflict results, assignment fields, lifecycle timestamps, fees, commission, payout, refund, or cancellation fields.
- Response:

```ts
{
  reservationToken?: string;
  bookingId?: string;
  task: CustomerCoreTaskDetail;
  nextActions: CustomerCoreTaskNextActions;
}
```

- Notes:
  - Returning `reservationToken` is currently needed by the web flow, but mobile should prefer not to persist it long term.
  - A safer alternative is for the backend to keep token lookup server-side and let later mobile payment routes use the latest valid reservation for the task.
- Error states: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `SCHEDULE_REQUIRED`, `TASK_CITY_MISMATCH`, category/capability mismatch codes, schedule conflict codes, `TASK_ALREADY_RESERVED`, `VALIDATION_ERROR`.
- UI wording: "Select provider" or "Choose provider"; avoid "accept" or "reserve" as provider wording.

### `POST /api/mobile/customer/tasks/[taskId]/payment/setup`

Purpose: backend creates or reuses the customer/payment setup state and returns safe Stripe setup parameters.

- Auth: mobile auth required.
- Workspace: customer workspace access required.
- Ownership: task `authorId` must equal authenticated customer id.
- Task requirements: schedule present, task `RESERVED`, reservation state `RESERVED` or `PAYMENT_PENDING`, valid selected/reserved tasker.
- Booking requirements: matching active reserved booking should exist.
- Payment requirements: no released/refunded/cancelled/disputed terminal payment state.
- Request body:

```ts
{
  reservationToken?: string;
}
```

- Mobile must not send: payment method id unless the design explicitly separates save from setup, customer id, Stripe customer id, Stripe account id, PaymentIntent id, SetupIntent id, fees, commission, payout, amount, task status, booking status, reservation state, provider assignment, lifecycle fields, refund/cancellation/dispute fields.
- Response, live Stripe:

```ts
{
  mode: "stripe_setup";
  clientSecret: string;
  customerId?: string;
  publishableKey?: string;
  task: CustomerCoreTaskDetail;
  nextActions: CustomerCoreTaskNextActions;
}
```

- Response, already has payment method:

```ts
{
  mode: "already_prepared";
  reasonCode: "ALREADY_HAS_PM";
  task: CustomerCoreTaskDetail;
  nextActions: CustomerCoreTaskNextActions;
}
```

- Response, mock/dev:

```ts
{
  mode: "mock_prepared";
  task: CustomerCoreTaskDetail;
  nextActions: CustomerCoreTaskNextActions;
}
```

- Safe Stripe fields: SetupIntent client secret, publishable key, ephemeral key if a future PaymentSheet design requires it, Stripe customer id only if needed by Stripe SDK.
- Never return: Stripe secret key, webhook secret, connected account secret, raw card data, full PaymentMethod object with billing details beyond safe labels, PaymentIntent secret unless a dedicated PaymentIntent mobile flow is designed, transfer ids, payout fields, platform fee internals, cancellation/refund calculations.
- Error states: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `SCHEDULE_REQUIRED`, `TASK_NOT_READY`, `PAYMENT_TERMINAL`, `STRIPE_NOT_CONFIGURED`, `PAYMENT_SETUP_FAILED`.
- UI wording: "Save card for protected payment flow", "Payment will be authorized close to the scheduled start"; avoid "escrow".

### `POST /api/mobile/customer/tasks/[taskId]/payment/finalize`

Purpose: backend finalizes selection/payment method readiness and assigns the task using existing backend rules.

- Auth: mobile auth required.
- Workspace: customer workspace access required.
- Ownership: task `authorId` must equal authenticated customer id.
- Task requirements: schedule present, selected/reserved tasker present, valid reservation token or server-resolved valid reservation, task and reservation state aligned with existing `startPayment`/`finalizePayment`.
- Booking requirements: reserved booking exists and belongs to task/customer/tasker.
- Payment requirements: live mode requires server-known saved payment method; mock mode may use mock payment method behavior.
- Request body:

```ts
{
  reservationToken?: string;
  setupIntentId?: string;
}
```

- `setupIntentId` should be used only if backend verifies it against Stripe and the task's Stripe customer. Mobile must not send a raw PaymentMethod id unless the backend design intentionally keeps the existing web `savePaymentMethodForTask` style.
- Mobile must not send: amount, fee, commission, payout, transfer, payment status, PaymentIntent id, capture/release/refund/cancellation fields, booking status, task status, provider assignment, lifecycle timestamps, Stripe secret/client secret values, local card data.
- Response:

```ts
{
  message: string;
  paymentState: CustomerCorePaymentState;
  task: CustomerCoreTaskDetail;
  nextActions: CustomerCoreTaskNextActions;
}
```

- Error states: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `SCHEDULE_REQUIRED`, `INVALID_STATE`, `EXPIRED`, `TOKEN_MISMATCH`, `PAYMENT_METHOD_REQUIRED`, `PAYMENT_SETUP_REQUIRED`, `STRIPE_NOT_CONFIGURED`, tasker conflict codes, `FINALIZE_PAYMENT_FAILED`.
- UI wording: "Confirm protected payment flow" or "Confirm task"; do not imply immediate capture.

### `GET /api/mobile/customer/tasks/[taskId]/payment-state`

Purpose: read-only payment state for UI alignment and retry guidance.

- Auth: mobile auth required.
- Workspace: customer workspace access required.
- Ownership: task `authorId` must equal authenticated customer id.
- Response:

```ts
{
  paymentState: CustomerCorePaymentState;
  nextActions: CustomerCoreTaskNextActions;
}
```

- This endpoint must not create Stripe objects, update payment rows, or execute lifecycle transitions.
- It can be folded into customer task detail if the detail response becomes authoritative enough.

## Proposed Customer Payment State Shape

```ts
export type CustomerCorePaymentState = {
  status:
    | "not_started"
    | "selection_reserved"
    | "payment_setup_required"
    | "payment_method_saved"
    | "authorization_pending"
    | "authorization_holding"
    | "payment_protected"
    | "released"
    | "failed"
    | "refunded"
    | "cancelled_with_fee"
    | "disputed";
  statusLabel: string;
  paymentRequired: boolean;
  paymentPrepared: boolean;
  paymentProtected: boolean;
  paymentReleased: boolean;
  canRetry: boolean;
  blockedReason?: string;
  blockedReasonCode?: string;
};
```

Mapping from current backend states:

- No payment, `OPEN`: `not_started`.
- `RESERVED` and `reservationState = RESERVED`: `selection_reserved` or `payment_setup_required`.
- Payment `INITIATED` with saved payment method: `payment_method_saved` or `authorization_pending`.
- Payment `HOLDING`: `authorization_holding`.
- Payment `HELD`: `payment_protected`.
- Payment `RELEASED`: `released`.
- Payment `FAILED`: `failed`.
- Payment `REFUNDED`: `refunded`.
- Payment `CANCELLED_WITH_FEE`: `cancelled_with_fee`.
- Payment `DISPUTED`: `disputed`.

## Proposed Customer `nextActions` Shape

The existing mobile customer response has structured completion/read-only actions. Payment phases should extend it carefully:

```ts
type CustomerCoreTaskNextActions = {
  canSelectTasker?: boolean;
  canPreparePayment?: boolean;
  canConfirmPayment?: boolean;
  canRetryPayment?: boolean;
  canChat?: boolean;
  canCancel?: boolean;
  canApproveCompletion?: boolean;
  canRejectCompletion?: boolean;
  canRequestHelp?: boolean;
  paymentRequired?: boolean;
  paymentProtected?: boolean;
  blockedReason?: string;
  blockedReasonCode?: string;
  primaryAction?:
    | "select_tasker"
    | "prepare_payment"
    | "confirm_payment"
    | "retry_payment"
    | "chat"
    | "approve_completion"
    | "reject_completion"
    | "request_help"
    | "none";
};
```

Rules:

- `canSelectTasker` comes only from backend selection eligibility.
- `canPreparePayment` is true only when backend says payment setup can begin for the selected/reserved tasker.
- `canConfirmPayment` is true only after backend knows a payment method/setup can be finalized.
- `canRetryPayment` is true only for backend-authored retryable payment setup/finalization failures.
- `paymentRequired` is true for customer-owned Core flows where selection is waiting for protected payment setup.
- `paymentProtected` is true only when backend payment state is `HELD`/`HOLDING` or a later backend-approved equivalent.
- `primaryAction` should show at most one payment action at a time.
- Completion actions must continue to use the existing approve/reject completion contract.

## Stripe Safety Rules

- Mobile payment flows must use backend-created Stripe objects only.
- Mobile must never receive Stripe secret keys, webhook secrets, connected account secrets, or raw card data.
- Mobile may receive a SetupIntent client secret only when created server-side for the authenticated customer's task and required by the approved Stripe mobile flow.
- Mobile must not create, capture, release, cancel, refund, or transfer PaymentIntents directly.
- Mobile must not calculate amount, fee, commission, net payout, hold, release, refund, cancellation penalty, or provider eligibility.
- Backend must verify customer ownership, task state, booking/reservation, selected tasker, schedule, payment state, Stripe customer, and SetupIntent/PaymentMethod ownership.
- Payment implementation remains separate from cancellation, refund, dispute, help, provider runtime actions, Pro Access payment/unlock, and completion approval/rejection.
- Do not expose Stripe ids unless mobile genuinely needs them for SDK calls; prefer opaque backend states and labels.
- Use `EXPO_PUBLIC_*` only for public mobile configuration. No secrets belong in the app bundle.

## UI Wording Guardrails

- Use "payment protected" or "protected payment flow".
- Avoid "escrow".
- Do not say payment is captured when only the payment method is saved.
- Use "save card" or "prepare payment" before scheduled authorization.
- Use "authorized close to the scheduled start" for the observed hold model.
- Use "payment protected" only when backend state says the hold/protection is active.
- Keep labels short enough for Bulgarian translations.
- Do not expose raw Stripe failure text to customers.

## Failure And Retry States

Known backend error/reason codes and cases:

- `STRIPE_NOT_CONFIGURED`: payment unavailable unless Stripe or mock payments are configured.
- `UNAUTHORIZED`/`FORBIDDEN`: missing auth, admin user, or workspace/customer ownership failure.
- `SCHEDULE_REQUIRED`: schedule must be present before selection/payment.
- `TASK_CITY_MISMATCH`, category/capability codes, schedule conflict codes: selection cannot proceed.
- `EXPIRED`, `TOKEN_MISMATCH`, `INVALID_STATE`, `NOT_RESERVED_STATUS`, `STATE_MISMATCH`: reservation/payment token no longer valid.
- `PAYMENT_METHOD_REQUIRED`: live Stripe finalization needs card setup before assignment.
- `PAYMENT_SETUP_REQUIRED`: customer/payment method verification failed.
- `PAYMENT_NOT_READY`: payment is not ready for approval/capture.
- `PAYMENT_AUTHORIZATION_CANCELLED`: existing authorization is no longer active.
- `PAYMENT_CAPTURE_FAILED`: approval capture failed.

Mobile retry behavior should be backend-authored:

- Retry setup when backend returns payment setup required or retryable setup failure.
- Retry finalization only when backend `nextActions.canConfirmPayment` or `canRetryPayment` allows it.
- Do not roll back a task locally.
- Do not invent cancellation/refund/help fallback actions in payment phases.

## Risky Or Unclear Areas

- Whether mobile should pass reservation tokens, or whether backend should resolve the latest valid reservation server-side.
- Whether mobile should save a `paymentMethodId` directly, or backend should verify a `setupIntentId` and derive the payment method from Stripe.
- Whether Stripe PaymentSheet or another Stripe mobile setup flow should be used.
- Whether mobile setup should return an ephemeral key and customer id for PaymentSheet.
- Whether `STRIPE_NOT_CONFIGURED` should block mobile users or expose a development-only mock path.
- Whether mock payments should be available through mobile in non-live environments.
- Provider runtime readiness currently treats saved payment method or `INITIATED` as execution-ready even before `HELD`; product and backend should confirm whether that is intentional for mobile copy.
- The hold is currently scheduled near start by `holdScheduledPayments`, not immediate at finalization. Mobile must not promise immediate hold.
- Assignment currently happens at finalization after payment method readiness, before scheduled hold succeeds.
- Completion approval can capture/release existing held PaymentIntents and may complete with payout pending if transfer fails.
- Cancellation/refund/dispute/help states have existing backend logic but are intentionally outside this contract.
- Pro Access payment/unlock is a separate product/payment flow and must not be merged with Core payment.

## Confirmation

- No mobile payment implementation was connected in Phase 24A.
- No mobile payment endpoints were added.
- No Stripe mobile SDK was added.
- No SetupIntent or PaymentIntent creation was added for mobile.
- No payment capture, release, refund, cancellation, dispute, help, provider action, Prisma schema, or lifecycle logic was changed.
