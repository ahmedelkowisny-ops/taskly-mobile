# Mobile Provider Core Issue and Support Contract

Phase 25D reviews provider-side Core issue reporting before mobile mutations are added. This document is a contract proposal only. It does not add provider issue buttons, mobile routes, payment behavior, admin behavior, or backend business logic.

## Existing Backend/Web Logic Found

### Provider Core Mobile Runtime Helpers

- `D:\Taskly\src\lib\mobile-provider-core-actions.ts`
  - `expressMobileProviderCoreTaskInterest(user, taskId, payload?)`
    - Requires an approved/verified Core Tasker.
    - Validates task visibility, city, category, scope/photo readiness, and tools confirmation where required.
    - Creates or updates `TaskInterest`.
    - Does not reserve or assign the task.
  - `markMobileProviderCoreTaskOnTheWay(user, taskId)`
    - Requires assigned/reserved provider relationship.
    - Requires task status `RESERVED` or `IN_PROGRESS`.
    - Requires schedule and payment readiness.
    - Has a backend-owned timing gate near scheduled start.
    - Updates only `onTheWayAt`.
    - Does not start the task and does not change payment settlement.
  - `startMobileProviderCoreTask(user, taskId)`
    - Requires assigned/reserved provider relationship.
    - Requires task status `RESERVED` or `IN_PROGRESS`.
    - Requires schedule and payment readiness.
    - Has backend-owned timing gates.
    - Updates only `startedAt`.
    - Does not capture, release, refund, or pay out funds.
  - `requestMobileProviderCoreTaskCompletion(user, taskId)`
    - Requires assigned provider relationship through booking.
    - Requires `IN_PROGRESS` task with `startedAt`.
    - Moves `IN_PROGRESS -> PENDING_COMPLETION`.
    - Notifies the customer.
    - Does not complete the task and does not settle payment.

### Provider Core Next Actions

- `getProviderCoreTaskNextActions(...)` currently exposes:
  - `canExpressInterest`
  - `canMarkOnTheWay`
  - `canStart`
  - `canRequestCompletion`
  - `canChat`
  - `canCancelOrReportIssue`
- `canCancelOrReportIssue` is always `false` today.
- Existing blocked reason codes cover lifecycle/status gates such as:
  - `TASK_CANCELLED`
  - `TASK_DISPUTED`
  - `TASK_NOT_READY`
  - `TASK_NOT_STARTED`
  - `TASK_PENDING_COMPLETION`
  - `PAYMENT_NOT_READY`
  - `NOT_ASSIGNED_TASKER`
  - timing gates for on-the-way/start.

### Provider Web Dashboard

- `D:\Taskly\src\app\dashboard\tasker\page.tsx`
  - Shows active Core jobs and runtime actions.
  - Shows `Contact support` as a mail link only when `task.status === "DISPUTED"`.
  - Shows support-review locked messaging for disputed tasks.
  - Shows provider-facing customer cancellation/support policy copy.
  - Does not expose a first-class provider cannot-attend mutation.
  - Does not expose a first-class provider issue-reporting mutation.
  - Does not expose a provider dispute-customer-rejection mutation.

### Customer Cancellation and Support Helpers

- `D:\Taskly\src\app\actions.ts`
  - `cancelOpenTaskForUser(taskId, userId)` was added for mobile customer auth and wraps open/reserved owner cancellation.
  - `cancelTaskWithPolicyForUser(taskId, userId, cancellationReason?)` applies backend-owned cancellation/payment policy for customer cancellation before task start.
  - `submitInProgressCancellationSupportRequestForUser(input, userId)` creates a support request after work has started, moves task/payment into support review, and notifies admin/customer/provider.
- These helpers are customer-owner flows. They should not be reused for provider issue reporting without a provider-specific contract.

### Older Payment/Dispute Helpers

- `D:\Taskly\src\app\actions\payments.ts`
  - `rejectTaskWithPayment(bookingId, reason)` moves payment and task to disputed using older booking-id behavior.
  - `reportNoShow(bookingId, role, reason, notes?)` writes payment refund/dispute fields with raw SQL.
  - `taskerDisputeJob(bookingId, reason, notes?)` writes `DISPUTED` to payment with raw SQL.
  - `requestRefund(bookingIdOrTaskId, reason)` writes an older `REFUND_REQUESTED` status.
  - `resolveDispute(paymentId, resolution)` writes release/refund states directly.
- These helpers are not mobile routes.
- `reportNoShow` and `requestRefund` reference `REFUND_REQUESTED`, which is not in the current Prisma `PaymentStatus` enum.
- These helpers should not be exposed to mobile provider routes without a separate backend review and likely replacement with typed, current-schema helpers.

### Admin and Support Review

- Web-only admin support/dispute surfaces exist:
  - `D:\Taskly\src\app\admin\support-requests\page.tsx`
  - `D:\Taskly\src\app\admin\disputes\page.tsx`
  - `D:\Taskly\src\app\admin\disputes\actions.ts`
  - `D:\Taskly\src\app\admin\data.ts`
- `getAdminSupportRequests(...)` reads `CustomerSupportRequest`.
- `getAdminDisputes(...)` reads unresolved payment disputes/refund/dispute reasons.
- `adminResolveRefundDecision(...)` owns dispute resolution and payment effects.
- Admin remains web-only.

## Existing Routes/Actions/Helpers Found

### Existing Mobile Provider Routes

- `GET /api/mobile/provider/core-tasks`
- `GET /api/mobile/provider/core-tasks/[taskId]`
- `POST /api/mobile/provider/core-tasks/[taskId]/interest`
- `POST /api/mobile/provider/core-tasks/[taskId]/on-the-way`
- `POST /api/mobile/provider/core-tasks/[taskId]/start`
- `POST /api/mobile/provider/core-tasks/[taskId]/request-completion`

### Existing Mobile Customer Support Routes

- `POST /api/mobile/customer/tasks/[taskId]/cancel`
- `POST /api/mobile/customer/tasks/[taskId]/support-request`

These routes show the desired pattern for future provider routes:

- require mobile auth
- require workspace access
- reject client-owned lifecycle/payment fields
- call backend-owned helper logic
- return refreshed mobile task detail with updated `nextActions` and read-only state

## Current Mobile Provider Read-Only State Coverage

Phase 25B already exposes generic provider-safe fields on provider Core list/detail responses:

- `cancellationState`
- `supportState`
- `disputeState`
- `refundState`
- `cancellationPolicySummary`
- `cancellationBlockedReason`
- `supportReviewLabel`

Current provider UI displays:

- cancelled state
- support review state
- provider-safe refund/dispute summary
- no fee/refund internals
- no provider issue action buttons

This is enough to display customer-driven cancellation/support outcomes, but it is not enough to power provider-originated issue flows because the states do not identify provider-submitted issue type, provider issue eligibility, or provider-specific blocked reasons.

## Missing Provider Mobile API Gaps

Missing mobile routes/actions:

- Provider cannot attend before task start.
- Provider cannot continue after task start.
- Provider reports unsafe, incorrect, or materially different task details.
- Provider reports customer no-show.
- Provider requests support during active work.
- Provider disputes a customer rejection after completion was requested.
- Provider views provider-originated support request state distinctly from customer-originated support state.

Missing read-only response fields:

- `providerIssueState`
- `providerSupportState`
- `providerCancellationState`
- `providerDisputeState`
- `providerIssueSummary`
- `providerSupportReviewLabel`
- `providerBlockedReason`
- `nextActions.canReportIssue`
- `nextActions.canRequestProviderSupport`
- `nextActions.canReportCannotAttend`
- `nextActions.canDisputeRejection`

## Proposed Read-Only Provider State Additions

The current generic Core states can remain for customer-originated cancellation/support outcomes. Add provider-specific fields only if the next phase needs to distinguish provider-originated cases:

```ts
type ProviderCoreIssueState = {
  status:
    | 'none'
    | 'report_available'
    | 'cannot_attend_available'
    | 'support_available'
    | 'dispute_rejection_available'
    | 'submitted'
    | 'under_review'
    | 'resolved'
    | 'not_available'
    | 'unknown';
  statusLabel: string;
  helperText: string;
  latestRequestId: string | null;
  latestRequestType: string | null;
  latestRequestCreatedAt: string | null;
  blockedReason: string | null;
  blockedReasonCode: string | null;
  providerIssueSummary: string | null;
  providerSupportReviewLabel: string | null;
};

type ProviderCoreTaskNextActions = {
  canReportIssue: boolean;
  canRequestProviderSupport: boolean;
  canReportCannotAttend: boolean;
  canDisputeRejection: boolean;
  providerBlockedReason?: string;
  providerBlockedReasonCode?: string;
};
```

All labels and blocked reasons must be backend-authored. Mobile must not infer provider issue eligibility from raw task status alone.

## Proposed Future Provider Mutation Routes

### `POST /api/mobile/provider/core-tasks/[taskId]/report-issue`

Use for provider-visible task problems that may not require immediate cancellation, such as unsafe details, incorrect address/scope after selection, or general issue reporting.

- Allowed statuses:
  - `OPEN` only for visible matching-task safety/reporting cases, if product approves pre-interest reporting.
  - `RESERVED`
  - `IN_PROGRESS`
  - `PENDING_COMPLETION`
- Relationship checks:
  - If `OPEN`: provider must be an approved Core Tasker and task must be visible by backend matching rules.
  - If assigned/reserved/active: provider must be `taskerId` or `reservedTaskerId`.
- Required payload:
  - `reason: string`
- Optional safe payload:
  - `details?: string`
  - `issueType?: 'UNSAFE' | 'WRONG_DETAILS' | 'CUSTOMER_UNREACHABLE' | 'OTHER'`
- Forbidden fields:
  - status, taskStatus, lifecycle, assignmentState, reservationState
  - customerId, providerId, taskerId
  - payment, paymentStatus, paymentId
  - payout, commission, fee, refund
  - stripe, stripePaymentIntentId, stripeTransferId, stripeAccountId
- Expected backend helper:
  - New typed helper, for example `submitProviderCoreIssueRequestForUser(user, taskId, input)`.
  - It should create a support/admin review record or provider issue record.
  - It should not directly settle payment.
- Expected response:
  - refreshed provider Core task detail
  - updated `providerIssueState`
  - updated `supportState`/`disputeState` if backend opens review
  - updated `nextActions`
- Customer impact:
  - Backend decides whether the customer is notified.
  - For pre-start non-blocking reports, customer may see no state change.
  - For serious reports, customer may see support review.
- Provider impact:
  - Provider sees submitted/under-review state.
  - Runtime actions remain visible only when backend `nextActions` allow them.
- Admin impact:
  - Admin/support queue receives enough safe context to review.
- Payment protection implications:
  - No immediate capture, release, refund, payout, or fee decision from the mobile request.

### `POST /api/mobile/provider/core-tasks/[taskId]/cannot-attend`

Use for serious provider inability to attend before work starts.

- Allowed statuses:
  - `RESERVED`
  - `IN_PROGRESS` only when `startedAt` is null.
- Relationship checks:
  - Provider must be assigned/reserved on the task.
  - Provider must be an approved Core Tasker.
- Required payload:
  - `reason: string`
  - `confirmationAccepted: true`
- Optional safe payload:
  - `details?: string`
- Forbidden fields:
  - same forbidden field set as `report-issue`
- Expected backend helper:
  - New typed helper, for example `submitProviderCannotAttendForUser(user, taskId, input)`.
  - Backend decides whether to cancel, reopen, mark support review, notify customer, or require admin review.
- Expected response:
  - refreshed provider Core task detail
  - refreshed customer-safe state from existing customer task detail route if customer is notified
  - provider issue/support state
  - updated `nextActions`
- Customer impact:
  - Backend decides whether customer sees cancellation, support review, or re-selection guidance.
  - Backend owns all notification copy and timing.
- Provider impact:
  - Provider sees cannot-attend submitted/under-review/resolved state.
  - Provider actions are blocked or allowed only by returned `nextActions`.
- Admin impact:
  - Admin/support may need review if payment protection is active or timing is late.
- Payment protection implications:
  - Backend decides if there is any penalty, refund, reauthorization, reassignment, or support review.
  - Mobile must not send or display calculated fees unless backend returns provider-safe labels.

### `POST /api/mobile/provider/core-tasks/[taskId]/support-request`

Use for active-task help that is not strictly inability to attend, such as customer unreachable during task, scope changed on site, unsafe conditions, or task cannot continue.

- Allowed statuses:
  - `IN_PROGRESS`
  - `PENDING_COMPLETION` if customer rejection created a support-eligible state.
- Relationship checks:
  - Provider must be assigned to the task.
  - Provider must be an approved Core Tasker.
- Required payload:
  - `reason: string`
- Optional safe payload:
  - `details?: string`
  - `supportType?: 'CUSTOMER_UNREACHABLE' | 'SCOPE_CHANGED' | 'UNSAFE' | 'PAYMENT_PROTECTION_REVIEW' | 'OTHER'`
- Forbidden fields:
  - same forbidden field set as `report-issue`
- Expected backend helper:
  - New typed helper, for example `submitProviderCoreSupportRequestForUser(user, taskId, input)`.
  - It may create `CustomerSupportRequest` only if that model is intentionally broadened, or a new provider-specific support model.
- Expected response:
  - refreshed provider Core task detail
  - provider support state
  - support/dispute state if backend opens review
  - updated `nextActions`
- Customer impact:
  - Backend decides whether customer sees support review.
  - Backend decides if task continues, pauses, or is locked.
- Provider impact:
  - Provider sees submitted/under-review state.
- Admin impact:
  - Admin/support queue receives provider issue context.
- Payment protection implications:
  - Request may lead to admin review, but mobile does not decide any payment outcome.

### `POST /api/mobile/provider/core-tasks/[taskId]/dispute-rejection`

Use only if product decides that a provider may escalate after customer asks for changes. Today, customer rejection returns the task to `IN_PROGRESS`; it does not open a dispute.

- Allowed statuses:
  - `IN_PROGRESS` after a customer rejection, only if backend can identify a recent rejection/change request.
  - Potentially `PENDING_COMPLETION` only if backend defines a rejection-dispute window before status returns.
- Relationship checks:
  - Provider must be assigned to the task.
  - Provider must be an approved Core Tasker.
- Required payload:
  - `reason: string`
- Optional safe payload:
  - `details?: string`
- Forbidden fields:
  - same forbidden field set as `report-issue`
- Expected backend helper:
  - New typed helper, for example `submitProviderCompletionRejectionDisputeForUser(user, taskId, input)`.
  - Do not wire the older `rejectTaskWithPayment(bookingId, reason)` helper for this without a product/backend review.
- Expected response:
  - refreshed provider Core task detail
  - `providerDisputeState`
  - support/dispute state if backend opens review
  - updated `nextActions`
- Customer impact:
  - Customer may see support review only if backend opens it.
- Provider impact:
  - Provider sees review state and no longer relies on retrying completion alone.
- Admin impact:
  - Admin/support receives rejection dispute context.
- Payment protection implications:
  - Backend decides whether protected payment remains held, is reviewed, is released, or is refunded.

## Customer, Provider, and Admin Impact

Customer-facing effects must be backend-authored:

- whether the task status changes
- whether customer sees support review
- whether customer can still approve/reject completion
- whether customer can cancel or request help
- whether customer receives notifications

Provider-facing effects must be backend-authored:

- whether lifecycle actions are blocked
- whether issue/support state is submitted, under review, or resolved
- whether the provider can continue work or request completion
- whether the provider sees customer-safe outcome copy

Admin/support effects must remain web-owned:

- queue placement
- dispute review
- support request triage
- payment/refund/payout decisions
- final resolution copy

## Payment, Payout, Refund, and Dispute Guardrails

Mobile must never decide:

- whether the Tasker owes a penalty
- whether the customer gets a refund
- whether the provider receives payout
- whether payment is captured, released, refunded, cancelled, or transferred
- whether a dispute is resolved
- whether task status becomes cancelled, disputed, completed, or reopened
- whether Taskly platform share or provider share applies
- whether Stripe action is available

Mobile may only:

- submit safe text fields such as `reason` and `details`
- submit explicit confirmation booleans for destructive actions
- display backend-authored labels, states, and next actions
- refresh from backend after success/failure

## Provider Mobile UX Guidance

- Add a passive issue/support card on provider task detail once backend read-only provider issue state exists.
- Keep `Report issue` secondary, visually calm, and below primary lifecycle actions.
- Keep `I can't attend` serious/destructive with explicit confirmation.
- Use reason/details inputs with visible validation.
- Show submitted and under-review states after backend success.
- Avoid blame-heavy wording toward customer or provider.
- Explain that Taskly support/admin will review when needed.
- Do not hide backend lifecycle actions unless backend `nextActions` remove them.
- Do not make issue reporting look like normal task progress.
- Keep provider request-completion wording separate from task completion.

## EN/BG Wording Guidance

English:

- `Report an issue`
- `I can't attend`
- `Request support`
- `Support review`
- `Task under review`
- `Explain what happened`
- `This may affect the customer and protected payment flow.`
- `Taskly support will review and update the task if needed.`

Bulgarian:

- `Съобщи за проблем`
- `Не мога да присъствам`
- `Поискай помощ`
- `Преглед от поддръжката`
- `Задачата е в преглед`
- `Опиши какво се случи`
- `Това може да засегне клиента и защитения платежен процес.`
- `Поддръжката на Taskly ще прегледа случая.`

Keep Bulgarian concise for narrow screens. Avoid long legal wording and avoid held-funds marketplace jargon. Use `защитен платежен процес` for protected payment flow.

## Non-Scope

- Provider issue buttons.
- Provider cannot-attend route.
- Provider support/dispute mutation routes.
- Payment capture, release, refund, payout, transfer, commission, or cancellation penalty changes.
- Stripe changes.
- Pro Access payment/unlock.
- Pro responses.
- Pro chat.
- Admin mobile screens.
- Admin workflow changes.
- Store-readiness work.

## Recommended Next Phase

Recommended Phase 25E: Provider Core issue/support read-only state.

Reason: Phase 25B's generic provider cancellation/support states are enough for customer-originated cancellation/support outcomes, but they do not distinguish provider-originated issue eligibility or provider-specific support cases. Add backend-authored provider issue state and provider `nextActions` first, then wire mutations in a later phase after the UI can rely on those states.

Suggested Phase 25E scope:

1. Add provider-authored read-only fields to provider Core list/detail responses:
   - `providerIssueState`
   - `providerSupportState`
   - `providerIssueSummary`
   - `providerSupportReviewLabel`
   - `nextActions.canReportIssue`
   - `nextActions.canRequestProviderSupport`
   - `nextActions.canReportCannotAttend`
   - `nextActions.canDisputeRejection`
2. Render passive provider issue/support badges and detail card.
3. Do not add provider mutation buttons yet unless backend `nextActions` and product states are complete.
4. Keep provider issue/cannot-attend mutations for Phase 25F.

## Phase 25E Implementation Note

- Phase 25E added the provider-safe read-only state fields and provider-specific `nextActions` booleans to mobile provider Core list/detail responses.
- `nextActions.canDisputeRejection` is intentionally returned as `false` until the backend has an explicit provider-safe signal that a customer rejection is disputeable. The current completion rejection flow returns the task to `IN_PROGRESS`, where the safe provider path is to correct the work and request completion again.
- No provider issue, cannot-attend, support, or dispute mutation route was added in Phase 25E.

## Phase 25F Implementation Note

- Phase 25F added provider mobile mutation routes for:
  - `POST /api/mobile/provider/core-tasks/[taskId]/report-issue`
  - `POST /api/mobile/provider/core-tasks/[taskId]/cannot-attend`
  - `POST /api/mobile/provider/core-tasks/[taskId]/support-request`
- Because there is no current provider-specific cancellation/settlement helper, the backend uses a mobile-safe support-review wrapper that creates a support request, moves the task/payment into support review, notifies relevant users/admins, and returns refreshed provider task detail.
- The wrapper does not calculate or decide provider penalties, customer refunds, payout, commission, capture, release, or final dispute outcome.
- Provider dispute-rejection remains deferred because the current customer rejection flow returns the task to `IN_PROGRESS`, where the provider can correct the work and request completion again.

## Open Questions

- Should provider issue requests reuse `CustomerSupportRequest`, or should backend add a provider-specific support request model?
- Should providers be able to report visible `OPEN` tasks before expressing interest, or only assigned/reserved tasks?
- Should `cannot-attend` reopen the task automatically, create support review, or require admin approval when payment protection is active?
- Should customer rejection create a provider-disputable state, or should provider simply request completion again after fixing the issue?
- What provider-safe copy is acceptable when a customer cancellation leads to a late-cancellation outcome?
