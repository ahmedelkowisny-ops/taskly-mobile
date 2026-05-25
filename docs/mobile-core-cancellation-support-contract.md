# Mobile Core Cancellation and Support Contract

Phase 25A reviews existing Core cancellation, help, refund, and dispute behavior before mobile mutations are added. This document is a contract proposal for future mobile work; it does not add product behavior or change backend business logic.

## Existing Backend/Web Logic Found

### Cancellation Policy Helpers

- `D:\Taskly\src\lib\cancellation.ts`
  - Defines the backend-owned policy constants:
    - `LATE_CANCEL_WINDOW_HOURS = 24`
    - `CANCEL_FEE_PCT_TOTAL = 0.25`
    - `CANCEL_FEE_PCT_TASKER = 0.2`
    - `CANCEL_FEE_PCT_PLATFORM = 0.05`
  - Provides `getCancellationFeeBreakdown(totalCents)`.
  - Mobile must never duplicate these calculations. Mobile may display backend-authored labels or amounts only.

### Customer Cancels Open/Reserved Task Before Payment

- `D:\Taskly\src\app\actions.ts` exports `cancelOpenTask(taskId)`.
- Current web/server-action behavior:
  - Requires authenticated owner.
  - Requires schedule to exist.
  - Blocks while `reservationState === "PAYMENT_PENDING"`.
  - Blocks if payment is already protected/held.
  - Allows only `OPEN` tasks or `RESERVED` tasks with `reservationState === "RESERVED"`.
  - Sets task status to `CANCELLED`.
  - Notifies the reserved Tasker if one exists.
- This is not currently exposed as a mobile API route.

### Customer Cancels In-Progress Task Before Work Starts

- `D:\Taskly\src\app\actions.ts` exports `cancelTaskWithPolicy(taskId, cancellationReason?)` and `cancelTaskWithPolicyForUser(taskId, userId, cancellationReason?)`.
- Current web/server-action behavior:
  - Requires authenticated owner.
  - Idempotently returns existing cancellation fee fields if task is already cancelled.
  - Applies only when task status is `IN_PROGRESS`.
  - Blocks if `startedAt` exists and tells the customer to contact support.
  - Requires `scheduledStartAt`.
  - Uses backend time comparison against the 24-hour free cancellation deadline.
  - Requires a reason after the free cancellation window.
  - Handles Stripe/payment settlement server-side.
  - Updates task, booking, payment, task interests, notifications, and revalidation server-side.
- This is not currently exposed as a mobile API route.

### Customer Help Request After Work Has Started

- `D:\Taskly\src\app\actions.ts` exports `submitInProgressCancellationSupportRequest(input)`.
- Current web/server-action behavior:
  - Requires authenticated customer owner.
  - Requires `reason` and `taskId`.
  - Requires task status `IN_PROGRESS` and `startedAt` present.
  - Creates `CustomerSupportRequest`.
  - Sets task status to `DISPUTED`.
  - Sets payment status to `DISPUTED` when a payment exists and stores backend dispute reason.
  - Notifies admins, customer, and provider through existing backend notification paths.
- This is not currently exposed as a mobile API route.

### Completion Rejection

- `D:\Taskly\src\app\actions.ts` exports `rejectCompletion(taskId, reason)`.
- The current task-id action used by mobile completion routes moves `PENDING_COMPLETION -> IN_PROGRESS` and notifies the Tasker. It does not open a dispute by itself.
- `D:\Taskly\src\app\actions\payments.ts` also exports an older `rejectTaskWithPayment(bookingId, reason)` helper that moves payment and task to `DISPUTED`.
- Future mobile cancellation/support work should not wire the older booking-id dispute helper unless the product flow explicitly changes.

### Older Refund/Dispute Helpers

- `D:\Taskly\src\app\actions\payments.ts` includes older helper actions:
  - `cancelUnpaidTask(taskId)`
  - `reportNoShow(bookingId, role, reason, notes?)`
  - `taskerDisputeJob(bookingId, reason, notes?)`
  - `requestRefund(bookingIdOrTaskId, reason)`
  - `resolveDispute(paymentId, resolution)`
- These are not mobile API routes. Several use raw SQL and/or older payment statuses, so they require a separate backend review before mobile exposure.

### Admin/Support Review

- Admin remains web-only.
- Existing web-only support and dispute surfaces:
  - `D:\Taskly\src\app\admin\support-requests\page.tsx`
  - `D:\Taskly\src\app\admin\disputes\page.tsx`
  - `D:\Taskly\src\app\admin\disputes\actions.ts`
  - `D:\Taskly\src\app\admin\data.ts`
- Admin dispute resolution can resolve customer-favor, late-cancellation, or rejected-refund outcomes and performs Stripe/payment effects server-side.
- Mobile should only display safe customer/provider status returned by backend mobile APIs.

## Existing Mobile Routes and Actions Found

### Backend Mobile Routes Already Present

- Customer Core read/mutation routes:
  - `GET /api/mobile/customer/tasks`
  - `POST /api/mobile/customer/tasks`
  - `GET /api/mobile/customer/tasks/[taskId]`
  - `POST /api/mobile/customer/tasks/[taskId]/select-tasker`
  - `POST /api/mobile/customer/tasks/[taskId]/payment/setup`
  - `POST /api/mobile/customer/tasks/[taskId]/payment/finalize`
  - `POST /api/mobile/customer/tasks/[taskId]/reject-completion`
  - `POST /api/mobile/customer/tasks/[taskId]/approve-completion`
- Provider Core routes:
  - `GET /api/mobile/provider/core-tasks`
  - `GET /api/mobile/provider/core-tasks/[taskId]`
  - `POST /api/mobile/provider/core-tasks/[taskId]/interest`
  - `POST /api/mobile/provider/core-tasks/[taskId]/on-the-way`
  - `POST /api/mobile/provider/core-tasks/[taskId]/start`
  - `POST /api/mobile/provider/core-tasks/[taskId]/request-completion`

### Mobile App Endpoint Registry

- `D:\Taskly-app\src\lib\api\endpoints.ts` has no cancellation, support request, refund request, or dispute mobile endpoint entries yet.
- `D:\Taskly-app\src\lib\api\customer.ts` has no cancellation/support/refund wrappers yet.
- `D:\Taskly-app\src\lib\api\provider.ts` has no provider cancellation/report-issue wrapper yet.

### Existing Mobile Read Models

- `D:\Taskly-app\src\lib\api\domain.ts` currently exposes:
  - Customer `nextActions.canCancel`
  - Customer `nextActions.canRequestHelp`
  - Provider `nextActions.canCancelOrReportIssue`
  - Customer payment statuses including `refunded`, `cancelled`, and `disputed`
- `D:\Taskly\src\lib\mobile-customer-readonly.ts` currently derives:
  - `canCancel: task.status === IN_PROGRESS && !startedAt`
  - `canRequestHelp: task.status === DISPUTED`
  - `paymentState.status = "disputed"` when task/payment is disputed
  - `paymentState.status = "cancelled"` for cancelled states
- `D:\Taskly\src\lib\mobile-provider-core-actions.ts` currently keeps `canCancelOrReportIssue` false and provides blocked reasons for cancelled/disputed tasks.

## Missing Mobile API Routes/Actions

The following are missing and should be added only in a dedicated implementation phase:

- Read-only enhancements to existing task list/detail responses:
  - Customer cancellation/support/refund/dispute state objects.
  - Provider cancellation/support outcome state objects.
  - Backend-authored policy labels and blocked reasons.
- Customer cancellation route:
  - `POST /api/mobile/customer/tasks/[taskId]/cancel`
  - Should wrap `cancelOpenTask` or `cancelTaskWithPolicyForUser` based on backend-owned task/payment state.
- Customer support/help route:
  - `POST /api/mobile/customer/tasks/[taskId]/support-requests`
  - Should wrap `submitInProgressCancellationSupportRequest` or a mobile-safe equivalent.
- Customer refund-review route:
  - Prefer folding refund requests into the support route unless backend product rules define a separate route.
- Provider issue route:
  - `POST /api/mobile/provider/core-tasks/[taskId]/support-requests`
  - Should be reviewed separately because provider inability-to-attend and no-show flows have different ownership and payment consequences.
- Mobile status history/case view:
  - Optional read-only route only if task detail cannot safely carry support status.

## Proposed Mobile API Contract

Add the following read-only fields to `CustomerTaskSummary`, `CustomerTaskDetail`, `ProviderCoreTaskSummary`, and `ProviderCoreTaskDetail` as needed. Money fields must be backend-authored display strings or backend-authored minor-unit values with labels; mobile must not calculate them.

```ts
type CoreCancellationState = {
  status:
    | 'not_available'
    | 'free_cancellation_available'
    | 'late_cancellation_available'
    | 'blocked_after_start'
    | 'cancelled_free'
    | 'cancelled_late'
    | 'cancelled'
    | 'support_required'
    | 'support_review'
    | 'unknown';
  statusLabel: string;
  helperText: string;
  policySummary: string;
  freeCancellationUntil: string | null;
  requiresReason: boolean;
  blockedReason: string | null;
  blockedReasonCode: string | null;
  estimatedPolicyOutcomeLabel: string | null;
  feeLabel: string | null;
  refundLabel: string | null;
  taskerFeeLabel: string | null;
  platformFeeLabel: string | null;
};

type CoreSupportState = {
  status:
    | 'none'
    | 'help_available'
    | 'refund_review_available'
    | 'support_submitted'
    | 'under_review'
    | 'resolved'
    | 'unknown';
  statusLabel: string;
  helperText: string;
  latestRequestId: string | null;
  latestRequestType: string | null;
  latestRequestCreatedAt: string | null;
  blockedReason: string | null;
  blockedReasonCode: string | null;
};

type CoreRefundState = {
  status:
    | 'not_requested'
    | 'request_available'
    | 'requested'
    | 'under_review'
    | 'refunded'
    | 'rejected'
    | 'not_available'
    | 'unknown';
  statusLabel: string;
  helperText: string;
  outcomeLabel: string | null;
};

type CoreDisputeState = {
  status:
    | 'none'
    | 'opened'
    | 'under_review'
    | 'resolved_customer_favor'
    | 'resolved_late_cancellation'
    | 'rejected'
    | 'unknown';
  statusLabel: string;
  helperText: string;
  resolutionLabel: string | null;
};
```

Extend `nextActions` with backend-authored fields:

```ts
type CustomerCoreTaskNextActions = {
  canCancel: boolean;
  canCancelFree?: boolean;
  canCancelLate?: boolean;
  canRequestHelp: boolean;
  canRequestRefund?: boolean;
  canOpenSupport?: boolean;
  cancellationBlockedReason?: string;
  cancellationBlockedReasonCode?: string;
  estimatedPolicyOutcomeLabel?: string;
  primaryAction:
    | 'cancel_task'
    | 'confirm_late_cancellation'
    | 'request_help'
    | 'request_refund_review'
    | 'open_support_status'
    | existingCustomerPrimaryAction;
};
```

Recommended mutation responses:

```ts
type CancelCustomerCoreTaskPayload = {
  reason?: string;
  confirmationAccepted?: true;
};

type CancelCustomerCoreTaskResponse = {
  message: string;
  task: CustomerTaskDetail | null;
  nextActions: CustomerCoreTaskNextActions | null;
  cancellationState: CoreCancellationState | null;
  paymentState: CustomerCorePaymentState | null;
};

type CreateCustomerCoreSupportRequestPayload = {
  reason: string;
  details?: string;
  messageType: 'CANCEL_AFTER_START' | 'REFUND_REVIEW' | 'TASK_HELP';
};

type CreateCustomerCoreSupportRequestResponse = {
  message: string;
  requestId: string;
  task: CustomerTaskDetail | null;
  nextActions: CustomerCoreTaskNextActions | null;
  supportState: CoreSupportState | null;
  disputeState: CoreDisputeState | null;
};
```

## Proposed Task Detail UI States

### Customer Detail

- Free cancellation available:
  - Show a secondary `Cancel task` action only when backend `nextActions.canCancelFree` or `canCancel` allows it.
  - Confirmation copy should say the backend policy allows free cancellation before the displayed deadline.
- Late cancellation available:
  - Show `Cancel task` with warning tone only when backend `nextActions.canCancelLate` allows it.
  - Require a visible reason.
  - Show backend-authored `estimatedPolicyOutcomeLabel`, `feeLabel`, and `refundLabel`.
  - Do not compute or reformat percentages on mobile.
- Cancellation blocked after start:
  - Hide direct cancellation.
  - Show `Request help` or `Contact support` only when backend allows it.
  - Copy should explain that the task has already started and support can review next steps.
- Support review/disputed:
  - Show `Under support review`.
  - Hide cancellation, payment setup, completion approval, and refund buttons unless backend `nextActions` explicitly allow a safe action.
- Completion rejection:
  - Keep existing `Ask for changes` flow separate from disputes.
  - Continue to require a reason and return the task to work when backend returns `IN_PROGRESS`.
- Cancelled:
  - Show cancelled status, backend-authored outcome label, and payment state.
  - Do not show lifecycle/payment mutation buttons.

### Provider Detail

- Open matching task:
  - No cancellation/support card.
  - Keep `Express interest` wording only.
- Assigned task cancelled:
  - Show `Cancelled` with backend-authored outcome label.
  - Do not show customer refund details unless backend explicitly returns provider-safe copy.
- Support review/disputed:
  - Show `Under support review`.
  - Hide lifecycle buttons unless backend `nextActions` author a safe next action.
- Provider cannot attend/report issue:
  - Future phase only.
  - Must be backend-authoritative and must not directly cancel or settle payment from mobile.

## Proposed Task List Badge/Summary States

- Customer list:
  - `Free cancellation available` only when backend says so.
  - `Late cancellation fee may apply` only from backend policy state.
  - `Support review` for task/payment disputed states.
  - `Cancelled` plus backend-authored outcome summary.
  - `Refunded` only from backend payment state.
- Provider list:
  - `Cancelled` when task is cancelled.
  - `Support review` when task/payment is disputed.
  - `Payment protected` only when backend payment state says protection is active.
  - No provider-facing refund/fee amounts unless backend returns a provider-safe label.

## Customer UX Flow

1. Customer opens task detail.
2. Mobile reads backend task detail, `nextActions`, and cancellation/support/refund/dispute states.
3. If free cancellation is allowed:
   - Customer taps `Cancel task`.
   - Mobile shows backend-authored deadline/policy copy.
   - Backend executes cancellation and returns refreshed task detail.
4. If late cancellation is allowed:
   - Customer taps `Cancel task`.
   - Mobile shows backend-authored late-cancellation outcome and requires a reason.
   - Backend recalculates policy at submit time and executes or blocks.
5. If work has started:
   - Direct cancellation is blocked.
   - Customer can request help only if backend `nextActions.canRequestHelp` or `canOpenSupport` allows it.
6. If customer asks for completion changes:
   - Existing completion rejection remains separate and returns the task to `IN_PROGRESS`.
7. If task is under review:
   - Mobile displays support/dispute state and waits for backend/admin resolution.

## Provider UX Flow

1. Provider opens Provider Core task detail.
2. Mobile reads backend task detail, `nextActions`, and support/cancellation outcome state.
3. If customer cancelled:
   - Provider sees `Cancelled` and backend-authored outcome label.
4. If task is under support review:
   - Provider sees `Under support review`.
   - Provider lifecycle actions are hidden unless backend permits them.
5. Provider report-issue/cannot-attend is a later phase:
   - It must use a dedicated mobile route.
   - It must not reserve, cancel, refund, release, capture, transfer, or calculate payout from the client.

## Payment, Cancellation, and Refund Guardrails

- Backend remains the source of truth for cancellation windows, fees, refunds, support state, dispute state, payment state, and payout state.
- Mobile must not calculate:
  - cancellation fee
  - refund amount
  - Tasker share
  - platform share
  - capture amount
  - release amount
  - payout amount
  - commission
  - Stripe eligibility
  - dispute outcome
- Mobile may display backend-authored labels and backend-authored values only.
- Mobile must not receive Stripe secret keys, webhook secrets, connected account secrets, database credentials, raw card data, or admin-only details.
- Cancellation/support mutations must reject forbidden client fields such as status, payment, payout, refund, fee, Stripe, lifecycle, tasker, provider, and customer ownership fields.
- Payment language must use `Payment protected` or `protected payment flow`.
- Admin/support resolution stays web-only.

## i18n Wording Guidance

### English

- Use:
  - `Cancel task`
  - `Free cancellation available`
  - `Late cancellation fee may apply`
  - `Payment protected`
  - `Protected payment flow`
  - `Request help`
  - `Request refund review`
  - `Under support review`
  - `This task has already started. Contact support for help.`
- Avoid:
  - Direct claims that Taskly performs the physical service.
  - Provider `Accept` or `Reserve` for open Core tasks.
  - Provider wording that says request-completion completes the task.
  - The term `escrow`.
  - Public version labels.

### Bulgarian

- Suggested labels:
  - `Откажи задачата`
  - `Безплатно отказване`
  - `Може да има такса за късно отказване`
  - `Плащането е защитено`
  - `Защитен платежен процес`
  - `Поискай помощ`
  - `Поискай преглед за възстановяване`
  - `В процес на преглед от поддръжката`
  - `Задачата вече е започнала. Свържи се с поддръжката за помощ.`
- Keep Bulgarian copy concise enough for narrow mobile screens.
- Avoid overly legal, rough placeholder, or public version-label wording.

## Non-Scope for the Next Implementation Phase

- Admin mobile screens or admin resolution workflows.
- Stripe changes, PaymentSheet, new PaymentIntent/SetupIntent behavior, captures, releases, transfers, payouts, or refunds from mobile.
- Mobile-side policy math or fee estimates.
- Pro Access payment/unlock.
- Provider Pro responses.
- Push notifications.
- Pro chat.
- New dispute outcome logic.
- Store-readiness metadata.

## Recommended Phase 25B Implementation Plan

1. Add backend read-only cancellation/support/refund/dispute state builders to existing mobile task list/detail responses.
2. Extend mobile TypeScript domain types and render passive badges/cards for customer and provider Core task detail/list.
3. Add customer cancellation mobile route:
   - `POST /api/mobile/customer/tasks/[taskId]/cancel`
   - Mobile auth required.
   - Customer ownership required.
   - Reject forbidden fields.
   - Delegate to existing backend cancellation logic.
   - Return refreshed task detail and backend-authored states.
4. Add customer support request mobile route:
   - `POST /api/mobile/customer/tasks/[taskId]/support-requests`
   - Mobile auth required.
   - Customer ownership required.
   - Reason required.
   - Safe message types only.
   - Delegate to existing support request logic or a mobile-safe equivalent.
5. Add mobile UI only after read-only states exist:
   - free cancellation confirmation
   - late cancellation confirmation with required reason
   - blocked-after-start help request
   - under-review display
6. Keep provider report-issue/cannot-attend as a later, separately reviewed phase unless Phase 25B explicitly expands.

## Open Questions and Blockers

- `scripts/cancellation-policy.test.ts` appears stale against current code: it imports `getGraceInfo`, which is not present in `src/lib/cancellation.ts`, and it expects completion rejection to open a dispute while the active `rejectCompletion(taskId, reason)` action returns the task to `IN_PROGRESS`.
- `reportNoShow` and `requestRefund` reference older payment statuses such as `REFUND_REQUESTED`, but the current Prisma `PaymentStatus` enum does not include `REFUND_REQUESTED`.
- `cancelTaskWithPolicyForUser` stores final task status as `CANCELLED` while idempotency also checks more specific cancellation status names. Phase 25B should confirm whether mobile should receive only generic `CANCELLED` or more specific policy outcome fields.
- The exact provider-safe cancellation fee/outcome copy should be approved before exposing any fee-related labels to providers.
- Real-device testing should confirm that support/dispute states do not expose private contact data or admin-only resolution details.
