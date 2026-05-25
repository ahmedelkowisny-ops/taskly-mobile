# Mobile Customer Completion Contract

Phase 23A documents the existing customer-side completion approval/rejection behavior for future mobile wiring. It does not add mobile mutations.

## Backend Sources Inspected

Backend/web:

- `D:\Taskly\prisma\schema.prisma`
- `D:\Taskly\src\app\actions.ts`
- `D:\Taskly\src\app\actions\payments.ts`
- `D:\Taskly\src\lib\stripe-ops.ts`
- `D:\Taskly\src\lib\mobile-customer-readonly.ts`
- `D:\Taskly\src\app\api\mobile\customer\tasks\route.ts`
- `D:\Taskly\src\app\api\mobile\customer\tasks\[taskId]\route.ts`
- `D:\Taskly\src\components\customer\CustomerDashboardContent.tsx`

Mobile:

- `app/customer/tasks.tsx`
- `app/customer/tasks/[taskId].tsx`
- `src/lib/api/customer.ts`
- `src/lib/api/domain.ts`
- `src/lib/api/mockApi.ts`

## Current Source Of Truth

The current customer dashboard calls task-id based server actions:

- `approveCompletion(taskId: number)`
- `rejectCompletion(taskId: number, reason: string)`

Important mobile guardrail:

- The inspected task-id actions do not derive the current customer from mobile auth and do not perform an explicit customer ownership check inside the action body.
- Future mobile endpoints must wrap or reimplement the behavior with mobile auth, ownership, task state, booking/payment, and eligibility checks before performing the action.

Older booking-id helpers also exist:

- `approveTaskCompletion(bookingId: number)`
- `rejectTaskCompletion(bookingId: number)`

The mobile contract should follow the active task-id flow unless the backend web flow is intentionally changed first.

## Current Approval Behavior

`approveCompletion(taskId)` is the payment-sensitive completion path.

Current behavior:

- Loads the task with payment, tasker, and author.
- Returns success idempotently when the task is already `COMPLETED`.
- Requires task status `PENDING_COMPLETION`.
- Requires `startedAt`.
- Resolves the payment id for the task.
- Checks the Stripe PaymentIntent state when a `stripePaymentIntentId` exists and payment is not already `RELEASED`.
- Captures the PaymentIntent when it is capturable.
- Blocks approval when the authorization is cancelled or payment is not ready for capture.
- Calculates tasker payout as 90% of gross task amount in the current action.
- Creates a Stripe transfer when possible.
- If transfer fails or the tasker payout account is missing, the task can still complete with `payoutStatus = "PAYOUT_PENDING"` and a warning.
- Updates task status to `COMPLETED`.
- Updates task `reservationState` to `RELEASED`.
- Updates payment status to `RELEASED`, sets `releasedAt`, stores `stripeTransferId`, and records payout pending/completed state.
- Updates all bookings for the task to `COMPLETED`.
- Marks task interests as `NOT_SELECTED`.
- Sends push/Telegram/admin notifications.

Current approval result:

- The task is completed.
- Payment is released in Taskly state.
- Stripe capture may happen during approval.
- Payout can be completed, Stripe-managed, or pending.
- Customer/mobile must treat backend success with warning as success plus a visible non-blocking note.

Approval does not belong in mobile until a dedicated mutation phase because it can capture payment.

## Current Rejection Behavior

`rejectCompletion(taskId, reason)` is the current customer rejection path.

Current behavior:

- Loads the task with payment and author.
- Returns success if the task is already `DISPUTED`.
- Requires task status `PENDING_COMPLETION`.
- Updates task status back to `IN_PROGRESS`.
- Creates a tasker notification with the customer-provided reason.
- Revalidates customer/tasker dashboard paths.

Current rejection result:

- The task goes back to in-progress work.
- The provider can request completion again later through the existing provider action.
- Payment remains protected/held according to the existing payment state.
- No payment capture, release, refund, or Stripe mutation happens in this action.

The current web UI gathers the reason with a prompt. Future mobile/backend wiring should validate a non-empty, length-limited reason server-side instead of trusting the client.

## Payment Dependency

Approval is payment-sensitive:

- It may call `getPaymentIntentState`.
- It may call `capturePaymentIntent`.
- It may call `createTransfer`.
- It updates `Payment.status` to `RELEASED`.
- It can return payment-readiness errors.
- It can complete with payout warnings when provider payout is pending.

Rejection is not payment-release logic:

- It does not capture, release, refund, or create Stripe objects.
- It should keep payment protected while the task returns to work.

Mobile must never calculate capture/release/refund eligibility. The backend must own all payment and lifecycle decisions.

## Proposed Phase Order

1. Phase 23B: add customer completion capability `nextActions` to read-only mobile task list/detail responses. Implemented.
2. Phase 23C: connect customer reject-completion, including reason validation and refreshed detail response. Implemented.
3. Phase 23D: connect customer approve-completion, using only the existing backend payment-sensitive action. Implemented.
4. Phase 23E: polish completion decision UI, review/invoice entry points, and support/help copy.

Rejection is recommended before approval because it does not release payment and is lower risk.

## Proposed Endpoint: Reject Completion

`POST /api/mobile/customer/tasks/[taskId]/reject-completion`

Phase 23C implementation status: implemented.

Auth and authorization:

- Require mobile auth.
- Derive the authenticated customer from the backend session/token.
- Verify the task exists, is not deleted, and belongs to the authenticated customer.
- Verify the task is eligible for rejection from the backend source of truth.
- Do not trust customer id, task status, booking status, or payment state sent by mobile.

Request body:

```json
{
  "reason": "Short customer reason"
}
```

Validation:

- `reason` required.
- Trim whitespace.
- Reject empty reason.
- Use a mobile-friendly max length, for example 1000 characters, unless backend web rules define a different limit.
- Reject server-owned fields.

Rejected fields:

- `customerId`
- `taskerId`
- `providerId`
- `status`
- `bookingStatus`
- `reservationState`
- `paymentStatus`
- `paymentId`
- `stripePaymentIntentId`
- `amount`
- `payout`
- `completedAt`
- `startedAt`
- lifecycle/admin fields

Response:

```ts
type RejectCompletionResponse = {
  task: CustomerTaskDetail;
  nextActions: CustomerCoreTaskNextActions;
  message?: string;
};
```

Errors:

- `UNAUTHORIZED`
- `TASK_NOT_FOUND`
- `NOT_OWNER`
- `NOT_PENDING_COMPLETION`
- `INVALID_REASON`
- `TASK_DISPUTED`
- `UNEXPECTED_ERROR`

Mobile UI:

- Show only when `nextActions.canRejectCompletion === true`.
- Ask for a short reason.
- Explain that the provider can continue work and request completion again.
- Do not mention refunds, disputes, or payment release.
- Do not show customer approve completion yet.

## Proposed Endpoint: Approve Completion

`POST /api/mobile/customer/tasks/[taskId]/approve-completion`

Phase 23D implementation status: implemented.

Auth and authorization:

- Require mobile auth.
- Derive the authenticated customer from the backend session/token.
- Verify the task exists, is not deleted, and belongs to the authenticated customer.
- Verify backend `nextActions.canApproveCompletion === true` or equivalent server-side eligibility.
- Verify task status, booking/reservation, started state, and payment readiness server-side.

Request body:

```json
{}
```

Rejected fields:

- `customerId`
- `taskerId`
- `providerId`
- `status`
- `bookingStatus`
- `reservationState`
- `paymentStatus`
- `paymentId`
- `stripePaymentIntentId`
- `amountGross`
- `amountNet`
- `amountFee`
- `stripeTransferId`
- `payoutOwed`
- `payoutStatus`
- `completedAt`
- `startedAt`
- lifecycle/admin fields

Response:

```ts
type ApproveCompletionResponse = {
  task: CustomerTaskDetail;
  nextActions: CustomerCoreTaskNextActions;
  payment?: {
    statusLabel: string;
    warning?: string;
    reasonCode?: "PAYOUT_ACCOUNT_MISSING" | "PAYOUT_PENDING" | string;
  };
  message?: string;
};
```

Errors:

- `UNAUTHORIZED`
- `TASK_NOT_FOUND`
- `NOT_OWNER`
- `NOT_PENDING_COMPLETION`
- `TASK_NOT_STARTED`
- `PAYMENT_AUTHORIZATION_CANCELLED`
- `PAYMENT_NOT_READY`
- `PAYMENT_CAPTURE_FAILED`
- `TASK_CANCELLED`
- `TASK_DISPUTED`
- `UNEXPECTED_ERROR`

Mobile UI:

- Show only when `nextActions.canApproveCompletion === true`.
- Confirm that the customer is approving completed work.
- Use backend wording for payment warnings.
- Use "payment protected" wording before approval.
- Avoid "escrow".
- Do not show Stripe/capture/release calculations.
- Keep reject-completion available only when backend `nextActions.canRejectCompletion` allows it.

## Proposed Customer NextActions Shape

Phase 23B implemented the structured customer Core task `nextActions` shape for mobile read-only list/detail responses.

The mobile customer task detail previously returned only a disabled display-action array:

```ts
type DetailNextAction = {
  accent?: "core" | "neutral" | "pro" | "warning";
  href: string | null;
  label: string;
  type: string;
};
```

The current customer Core list/detail response now uses a backend-authored capability object while keeping `displayActions` for compatibility where needed:

```ts
type CustomerCoreTaskBlockedReasonCode =
  | "NOT_OWNER"
  | "TASK_NOT_PENDING_COMPLETION"
  | "TASK_NOT_STARTED"
  | "PAYMENT_NOT_READY"
  | "PAYMENT_AUTHORIZATION_CANCELLED"
  | "TASK_CANCELLED"
  | "TASK_DISPUTED"
  | "ALREADY_COMPLETED"
  | "WAITING_FOR_PROVIDER"
  | "UNKNOWN";

type CustomerCoreTaskNextActions = {
  canSelectTasker: boolean;
  canPreparePayment: boolean;
  canChat: boolean;
  canCancel: boolean;
  canApproveCompletion: boolean;
  canRejectCompletion: boolean;
  canRequestHelp: boolean;
  canViewInvoice: boolean;
  canReview: boolean;
  primary?: {
    type:
      | "select_tasker"
      | "prepare_payment"
      | "open_chat"
      | "approve_completion"
      | "reject_completion"
      | "request_help"
      | "view_invoice"
      | "review"
      | "none";
    label: string;
    method?: "POST";
    endpoint?: string;
  };
  blockedReason?: string;
  blockedReasonCode?: CustomerCoreTaskBlockedReasonCode;
};
```

Backend must calculate this object. Mobile may use it for display, but action routes must repeat all checks.

Phase 23B eligibility behavior:

- `canApproveCompletion` requires `PENDING_COMPLETION`, `startedAt`, an assigned/reserved tasker, a booking, and payment status known as `HELD`, `HOLDING`, or `RELEASED`.
- `canRejectCompletion` requires `PENDING_COMPLETION`, an assigned/reserved tasker, and a booking.
- Cancelled, completed, and disputed tasks do not expose approve/reject completion flags.
- If payment readiness is not known from the read-only query, approval is blocked with `PAYMENT_NOT_READY` rather than guessed.
- This phase exposes eligibility only and does not execute lifecycle or payment changes.

## UI Wording Guardrails

Use:

- "Approve completion"
- "Ask for changes"
- "Payment protected"
- "The provider will continue work"
- "Payment is still finalizing. Try again in a moment."
- "Payout is pending and will be processed by Taskly."

Avoid:

- "Escrow"
- "Release Stripe payment" as customer-facing wording
- "Refund" during reject-completion
- "Dispute" unless a dedicated support/dispute phase is connected
- Any wording that implies mobile calculates payment or payout

## Blocked Reason Mapping

Suggested mobile-friendly mappings:

| Backend reason | Mobile copy |
| --- | --- |
| `TASK_NOT_PENDING_COMPLETION` | This task is not waiting for completion approval. |
| `TASK_NOT_STARTED` | The task has not started yet. |
| `PAYMENT_NOT_READY` | Payment is still finalizing. Try again in a moment. |
| `PAYMENT_AUTHORIZATION_CANCELLED` | Payment protection needs to be checked before approval. |
| `TASK_CANCELLED` | This task is cancelled. |
| `TASK_DISPUTED` | This task is under support review. |
| `ALREADY_COMPLETED` | This task is already completed. |
| `NOT_OWNER` | This action is not available for this account. |

Raw backend codes should not be shown directly.

## Risks And Open Questions

- Approval captures/releases payment through existing backend logic. Future mobile UI must be careful with retries and backend warnings.
- Future mobile routes must not expose the existing task-id actions directly without adding authenticated customer ownership checks.
- Transfer/payout can be pending even when approval succeeds.
- Current task-id approval updates booking status but does not set `completedAt` or `reviewStatus`; review/invoice visibility should be checked before adding mobile review prompts.
- The older booking-id approval helper has different review behavior and should not be used by mobile unless backend explicitly standardizes on it.
- Rejection currently has no server-side reason length validation in the inspected action.
- Rejection returning success for already `DISPUTED` should be reviewed before mobile turns it into user-facing behavior.
- Approval/rejection should be allowed only from backend-confirmed pending-completion states.
- Support/dispute/refund/cancellation flows must remain separate.

## Phase 23A Scope Confirmation

Phase 23A added documentation only:

- No customer approve-completion mutation was connected.
- No customer reject-completion mutation was connected.
- No mobile action buttons were connected.
- No payment capture/release/refund logic was changed.
- No Stripe, cancellation, dispute, help, provider action, Pro response, Pro Access payment/unlock, or lifecycle rule was changed.
