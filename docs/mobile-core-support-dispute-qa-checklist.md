# Mobile Core Support and Dispute QA Checklist

Phase 26A verifies the Core cancellation, support, refund-review, dispute, provider issue, and cannot-attend state system after Phases 25B through 25F. This checklist is for QA and safe regression review only. Backend remains the source of truth for lifecycle, payment, cancellation, refund, dispute, payout, commission, and provider eligibility decisions.

## Files Reviewed

- Mobile contracts and QA docs:
  - `docs/mobile-core-cancellation-support-contract.md`
  - `docs/mobile-provider-core-issue-support-contract.md`
  - `docs/mobile-core-payment-qa-checklist.md`
  - `docs/mobile-core-real-device-test-runbook.md`
- Mobile Customer Core screens:
  - `app/customer/tasks.tsx`
  - `app/customer/tasks/[taskId].tsx`
- Mobile Provider Core screens:
  - `app/provider/core-tasks.tsx`
  - `app/provider/core-tasks/[taskId].tsx`
- Mobile API/domain/i18n:
  - `src/lib/api/client.ts`
  - `src/lib/api/endpoints.ts`
  - `src/lib/api/customer.ts`
  - `src/lib/api/provider.ts`
  - `src/lib/api/domain.ts`
  - `src/lib/api/mockApi.ts`
  - `src/lib/i18n/en.ts`
  - `src/lib/i18n/bg.ts`
- Backend read models, action helpers, and routes:
  - `D:\Taskly\src/lib/mobile-customer-readonly.ts`
  - `D:\Taskly\src/lib/mobile-provider-readonly.ts`
  - `D:\Taskly\src/lib/mobile-customer-core-actions.ts`
  - `D:\Taskly\src/lib/mobile-provider-core-actions.ts`
  - `D:\Taskly\src/app/api/mobile/customer/tasks/[taskId]/cancel/route.ts`
  - `D:\Taskly\src/app/api/mobile/customer/tasks/[taskId]/support-request/route.ts`
  - `D:\Taskly\src/app/api/mobile/provider/core-tasks/[taskId]/report-issue/route.ts`
  - `D:\Taskly\src/app/api/mobile/provider/core-tasks/[taskId]/cannot-attend/route.ts`
  - `D:\Taskly\src/app/api/mobile/provider/core-tasks/[taskId]/support-request/route.ts`

## Customer Cancellation QA Scenarios

- Free cancellation available:
  - Backend read model returns `nextActions.canCancel: true`, `canCancelFree: true`, `canCancelLate: false`, and `cancellationState.status: free_cancellation_available`.
  - Customer detail shows `Cancel task`, free-cancellation copy, and backend-authored policy text.
  - Submit calls `cancelCustomerTask` with only `confirmationAccepted: true` and optional `reason`.
  - Success refreshes the task from the backend response.

- Late cancellation warning:
  - Backend read model returns `nextActions.canCancel: true`, `canCancelLate: true`, and `cancellationState.status: late_cancellation_available`.
  - Customer detail shows a warning state, visible reason field, and backend-authored `estimatedPolicyOutcomeLabel`, `feeLabel`, or `refundLabel` when present.
  - Mobile does not calculate late fees, refund amounts, Tasker share, platform share, or policy windows.
  - Missing reason shows a visible field error before submit.

- Cancellation blocked:
  - Backend returns `cancellationState.status: blocked_after_start` or `nextActions.canCancel: false`.
  - Direct cancellation button is hidden.
  - Support action appears only if backend returns `canRequestHelp`, `canRequestRefund`, or `canOpenSupport` with the supported primary action.

- Cancelled task:
  - Backend returns a cancelled status and refreshed `cancellationState`.
  - Customer UI shows cancelled state and does not show lifecycle or payment mutation buttons unless backend next actions change.

## Customer Support and Refund Request QA Scenarios

- Support after work started:
  - Backend returns `supportState.status: help_available` and `nextActions.canRequestHelp: true`.
  - Customer detail shows `Request support review`, visible reason/details fields, loading state, success message, and safe backend errors.
  - Submit calls `requestCustomerTaskSupport` with only `reason` and optional `details`.

- Refund/support review:
  - Backend returns `supportState`, `refundState`, or `disputeState` as `under_review`.
  - Customer list/detail shows `Under support review` or `Refund review`.
  - Mobile does not calculate refund values or dispute outcomes.

- Backend errors:
  - `MISSING_REASON` maps to a visible reason error.
  - `SUPPORT_NOT_AVAILABLE`, `CANCELLATION_REQUIRES_SUPPORT`, unauthorized, forbidden, and not-found errors display safe user-facing messages.
  - Raw payment, Stripe, fee, payout, or admin details are not exposed.

## Provider Report Issue QA Scenarios

- Report issue available:
  - Backend returns `nextActions.canReportIssue: true`.
  - Provider detail shows `Report issue` in the issue/support card.
  - Submit requires a visible reason, accepts optional details, and calls `reportProviderCoreTaskIssue`.
  - Success refreshes the provider task detail and shows submitted/under-review state.

- Report issue blocked:
  - Backend returns `canReportIssue: false` with `providerBlockedReason` or `providerBlockedReasonCode`.
  - Provider UI hides the report button and displays backend-authored read-only guidance.

## Provider Cannot-Attend QA Scenarios

- Cannot-attend available:
  - Backend returns `nextActions.canReportCannotAttend: true`.
  - Provider detail shows `I can't attend`.
  - Reason is required and the UI shows a destructive confirmation alert before submit.
  - Submit calls `reportProviderCannotAttend` with only `reason` and optional `details`.

- Cannot-attend blocked:
  - Backend returns `canReportCannotAttend: false`.
  - Provider UI hides the action and shows backend-authored state or blocked reason.
  - Mobile does not reopen, cancel, reassign, penalize, refund, capture, release, or calculate payout.

## Provider Support Request QA Scenarios

- Provider support available:
  - Backend returns `nextActions.canRequestProviderSupport: true`.
  - Provider detail shows `Request support`.
  - Submit requires reason, accepts optional details, and calls `requestProviderCoreTaskSupport`.

- Provider support under review:
  - Backend returns `providerIssueState`, `providerSupportState`, `providerCancellationState`, or `providerDisputeState` with `under_review`.
  - Provider list/detail show task-under-review copy and hide runtime actions unless backend next actions allow them.
  - `canDisputeRejection` remains false because no safe backend provider dispute-rejection path exists yet.

## Support-Review State Checks

- Customer and provider list/detail screens render loading, empty, error, unauthorized, and read-only states.
- Support review states are carried by backend read models:
  - Customer: `cancellationState`, `supportState`, `refundState`, `disputeState`, `supportReviewLabel`.
  - Provider: customer-originated states plus provider-specific issue/support/cancellation/dispute states.
- UI uses backend `nextActions` for action availability and does not infer sensitive eligibility from raw status alone.
- Private customer address/contact data is not exposed to providers before the backend detail response includes it for assigned tasks.

## Dispute and Rejection State Checks

- Customer completion rejection remains `Ask for changes`, not a dispute or refund flow.
- Provider request-completion remains `Request completion`; it is not labeled as completing the task directly.
- Provider customer-rejection handling stays read-only/correction-oriented. `canDisputeRejection` remains false until a backend path exists.
- Mobile does not decide dispute outcome, refund settlement, provider penalty, or admin resolution.

## Demo-Mode Checks

- Customer demo cancellation updates local task state only and does not call backend mutation routes.
- Customer demo support request updates local support/dispute/refund review state only.
- Provider demo report issue, cannot-attend, and support request update local provider support-review state only.
- Demo mode does not simulate cancellation fees, refunds, penalties, payouts, captures, releases, commissions, or Stripe behavior.
- Demo copy uses `Express interest`, `Request completion`, `Payment protected`, and `protected payment flow`.

## Forbidden Client Fields and Security Checks

- Mobile routes require mobile auth through `getMobileAuthenticatedUser`.
- Customer routes require Customer Workspace access and task ownership.
- Provider routes require Provider Workspace access, approved Core Tasker state, and assigned/reserved provider relationship where required.
- Customer cancellation accepts only `confirmationAccepted` and `reason`.
- Customer support accepts only `reason` and `details`.
- Provider issue/support/cannot-attend routes accept only `reason` and `details`.
- Forbidden client-owned fields must be rejected, including status, task status, lifecycle, assignment, reservation, customer/provider/tasker ownership, payment status, payment IDs, payout, commission, fee, refund, Stripe IDs, capture/release, and dispute resolution fields.
- Mobile API wrappers send payloads through `src/lib/api/client.ts` and endpoint paths from `src/lib/api/endpoints.ts`.
- Mobile must not store secrets in the app bundle. Only `EXPO_PUBLIC_*` values are available and non-secret.

## i18n and Copy Checks

- No mobile UI copy should use `escrow`.
- No mobile UI copy should expose public version labels.
- Provider open-task action must be `Express interest`, not accept/reserve wording.
- Core payment copy should use `Payment protected` or `protected payment flow`.
- Provider issue/support copy should stay concise:
  - `Report issue`
  - `I can't attend`
  - `Request support`
  - `Task under review`
  - `Support review in progress`
- Bulgarian strings should remain short enough for narrow mobile screens.

## Issues Found

- Provider issue API wrappers were passing the typed payload object directly. The wrapper now shapes the request body to only `reason` and optional `details`, matching the backend route allowlists.
- Provider issue copy used stale protected-payment wording; it now says `protected payment flow`.
- The endpoint registry comment was stale and implied implemented routes were still placeholders; it now describes the file as the centralized mobile route registry.
- The provider cannot-attend route currently relies on UI confirmation and accepts only `reason`/`details`; it does not require a backend `confirmationAccepted` flag. This is acceptable for Phase 26A QA but should be revisited if product wants server-enforced confirmation semantics.

## Known Deferred Items

- Provider dispute-rejection.
- Admin support resolution improvements.
- Refund/dispute settlement workflows.
- Push notifications.
- Any new payment/refund/payout/capture/release/commission logic.
- Pro Access payment/unlock.
- Pro responses.
