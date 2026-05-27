# Mobile Pro Access Support/Refund Contract

Phase 30A reviews the existing Pro Access support/refund surface before any mobile route or UI is added. This document is a contract proposal only. It does not add product behavior, refund logic, Stripe behavior, admin workflow changes, or mobile mutations.

## Product Context

- Posting a Pro request is free.
- Pro Access is paid only when meaningful approved Pro responses exist.
- Pro Access unlocks comparison access for approved Pros; it is not payment for renovation work.
- Pros are independent professionals responsible for their own quotes, site visits, and work.
- Final work agreement and payment remain between customer and Pro unless a future platform-managed milestone system is added.
- Pro Access support/refund may be needed for invalid responses, no meaningful response after payment, Pro cancellation/no-show issues, payment problems, accidental payment, or admin-approved edge cases.
- Admin remains web-only and should own final support/refund decisions.

## Existing Backend/Web/Admin Logic Found

### Pro Access payment and access state

The backend already has Pro Access payment/access state in Prisma:

- `ProRequest.accessStatus`
  - `NOT_PAID`
  - `PAID`
  - `REFUNDED`
  - `CREDITED`
- `ProAccessPayment.status`
  - `NOT_STARTED`
  - `PENDING`
  - `PAID`
  - `REFUNDED`
  - `CREDITED`
  - `FAILED`
- `ProAccessPayment.refundedAt`
- `ProAccessPayment.stripePaymentIntentId`

The mobile read model already maps refunded/credited payment state to customer-safe labels:

- `Pro Access refunded`
- `Pro Access credited`
- `proAccessPaymentState.refundedAt`
- `proAccessPaymentState.status`
- `proAccessPaymentState.statusLabel`

The current read model keeps `proAccessNextActions.canRequestProAccessRefund` set to `false`.

### Pro Access checkout/unlock flow

Existing helpers/routes inspected:

- `D:\Taskly\src\lib\pro-access-checkout.ts`
- `D:\Taskly\src\lib\pro-access-payments.ts`
- `D:\Taskly\src\app\api\mobile\customer\pro-requests\[proRequestId]\access\checkout\route.ts`

Current behavior:

- Mobile checkout requires mobile auth and customer ownership.
- Backend requires at least one submitted response from an approved Pro profile.
- Backend blocks closed/cancelled Pro requests.
- Backend owns Pro Access amount, currency, Stripe Checkout creation, metadata, and paid/unlocked finalization.
- Mobile checkout route rejects server-owned payment/unlock fields.
- `markProAccessPaidFromMetadata` marks `ProRequest.accessStatus = PAID`, upserts a paid `ProAccessPayment`, and sends a safe Pro Access unlocked notification.

No Pro Access refund creation helper or customer support request helper was found in these files.

### Admin support/payment inspection

Existing admin pages inspected:

- `D:\Taskly\src\app\admin\pro\support\page.tsx`
- `D:\Taskly\src\app\admin\pro\fees\page.tsx`
- `D:\Taskly\src\app\admin\pro\fees\export\route.ts`
- `D:\Taskly\src\app\admin\pro\requests\[id]\page.tsx`

Current admin support/payment coverage:

- Admin can inspect Pro application/support queues.
- Admin can inspect Pro requests with no responses.
- Admin can inspect Pro requests with responses but unpaid access.
- Admin can inspect failed/refunded Pro Access payments.
- Admin Pro fees page lists Pro Access payment records, customer, request, amount, status, Stripe PaymentIntent id, paid date, and refunded date.
- Admin export includes Pro Access payment inspection data.

No customer-facing Pro Access support/refund submission route was found. No web admin action for issuing a Pro Access Stripe refund was confirmed during this review.

### Core support/refund pattern for reference only

Existing Core mobile support route inspected:

- `D:\Taskly\src\app\api\mobile\customer\tasks\[taskId]\support-request\route.ts`

Useful pattern:

- Requires mobile auth.
- Requires customer workspace and customer ownership.
- Accepts only safe fields.
- Rejects unsupported/server-owned fields.
- Uses backend action helpers.
- Returns refreshed customer task detail support/refund/dispute state.

This Core route is a reference pattern only. Pro Access support/refund must remain separate because Pro Access is not a Core task payment, booking, payout, or protected payment completion flow.

## Existing Routes/Actions/Helpers/Models Found

Backend models:

- `ProRequest`
- `ProAccessPayment`
- `ProAccessStatus`
- `ProAccessPaymentStatus`
- `CustomerSupportRequest` for existing Core-style support requests

Backend helpers/routes:

- `createProAccessCheckoutSessionForCustomer`
- `markProAccessPaidFromMetadata`
- `markProAccessPaymentFailedFromMetadata`
- `POST /api/mobile/customer/pro-requests/[proRequestId]/access/checkout`
- Stripe webhook/checkout-return finalization paths that call the Pro Access payment helper
- Core-only `POST /api/mobile/customer/tasks/[taskId]/support-request`

Admin web surfaces:

- `/admin/pro/support`
- `/admin/pro/fees`
- `/admin/pro/fees/export`
- `/admin/pro/requests/[id]`

Missing today:

- No Pro Access customer support/refund request route.
- No Pro Access refund/support request model tied to `ProRequest` or `ProAccessPayment`.
- No mobile Pro Access support/refund wrapper.
- No mobile Pro Access support/refund form.
- No customer-visible Pro Access support review state beyond refunded/credited payment labels.

## Current Mobile Coverage

Mobile currently exposes and renders:

- `proAccessState`
- `proUnlockState`
- `proAccessPaymentState`
- `proAccessSummary`
- `proAccessBlockedReason`
- `proAccessBlockedReasonCode`
- `proAccessNextActions`
- `proAccessNextActions.canRequestProAccessRefund` as a typed field, currently backend-authored `false`
- Pro Access checkout wrapper:
  - `createCustomerProAccessCheckout(proRequestId, authToken)`
- Customer Pro detail Pro Access card and checkout confirmation.
- Unlocked comparison UI after backend-authored unlock state.
- Site visit invite/cancel actions after unlock where backend allows them.

Mobile does not currently expose:

- Pro Access support/refund request UI.
- Pro Access support/refund route wrapper.
- Pro Access support/refund request payload type.
- Pro Access support/review status card.
- Pro Access refund/support demo state.

## Missing Mobile API Gaps

Future mobile work needs backend-authored support/refund state before any active customer route is useful:

- Read-only Pro Access support state.
- Read-only Pro Access refund state.
- Admin review outcome visibility.
- Backend-authored blocked reasons and reason codes.
- Duplicate active request handling.
- Customer request route.
- Customer-safe support/refund request status after submission.
- Notification hooks for support/refund outcome, if product decides to notify later.

## Proposed Read-Only Fields

Add these fields to the customer Pro request detail/list read model when backend support state exists:

```ts
type ProAccessSupportState = {
  blockedReason: string | null;
  blockedReasonCode: string | null;
  helperText: string;
  latestRequestCreatedAt: string | null;
  latestRequestId: string | null;
  latestRequestType: string | null;
  status:
    | 'none'
    | 'support_available'
    | 'refund_review_available'
    | 'submitted'
    | 'under_review'
    | 'resolved'
    | 'not_available'
    | 'unknown';
  statusLabel: string;
  supportReviewLabel: string | null;
};

type ProAccessRefundState = {
  helperText: string;
  outcomeLabel: string | null;
  status:
    | 'not_requested'
    | 'request_available'
    | 'requested'
    | 'under_review'
    | 'refunded'
    | 'credited'
    | 'declined'
    | 'not_available'
    | 'unknown';
  statusLabel: string;
};
```

Suggested fields on `CustomerProRequestDetail`:

- `proAccessSupportState`
- `proAccessRefundState`
- `proAccessRefundSummary`
- `proAccessSupportReviewLabel`
- `proAccessRefundBlockedReason`
- `proAccessRefundBlockedReasonCode`
- `proAccessRefundSubmittedAt`

Suggested additions to `proAccessNextActions`:

- `canRequestProAccessRefund`
- `canOpenProAccessSupport`
- `canViewProAccessSupportStatus`

Rules:

- These fields must be backend-authored.
- Mobile must not infer refund eligibility from `accessStatus`, payment status, response count, site visit status, or raw Stripe state.
- Mobile must not show a refund amount unless backend returns a customer-safe amount label.

## Proposed Future Mobile Route

Preferred route:

```http
POST /api/mobile/customer/pro-requests/[proRequestId]/access/support-request
```

Alternative route if product wants a narrower label:

```http
POST /api/mobile/customer/pro-requests/[proRequestId]/access/refund-request
```

The support-request route is preferred because some cases may need admin review without a refund.

### Route Requirements

- Require mobile auth.
- Require customer workspace access.
- Require customer ownership of the Pro request.
- Require an eligible Pro Access payment or payment attempt, according to backend policy.
- Require Pro Access was paid/unlocked if the issue type depends on unlocked comparison access.
- Reject if no eligible Pro Access payment exists.
- Prevent duplicate active support/refund requests unless backend explicitly supports updates.
- Keep admin review and actual refund decisions backend/web-owned.
- Return refreshed customer Pro request detail response with updated support/refund state.

### Safe Payload

```ts
type CustomerProAccessSupportRequestPayload = {
  details?: string;
  reason: string;
  selectedIssueType?:
    | 'no_useful_responses'
    | 'response_quality_issue'
    | 'pro_cancelled_or_no_show'
    | 'payment_problem'
    | 'accidental_payment'
    | 'other';
};
```

Suggested validation:

- `reason`: required, trimmed, reasonable minimum and maximum length.
- `details`: optional, trimmed, maximum length.
- `selectedIssueType`: optional enum, if it fits the eventual admin workflow.
- Free text should pass the same contact-leakage guard if the product does not allow direct contact details in this flow.

### Forbidden Client-Owned Fields

The route must reject these fields if sent by mobile:

- `customerId`
- `userId`
- `proRequestId` in body
- `proAccessPaymentId`
- `amount`
- `amountCents`
- `currency`
- `refundAmount`
- `refundAmountCents`
- `paymentStatus`
- `accessStatus`
- `unlockStatus`
- `stripePaymentIntentId`
- `stripeRefundId`
- `stripeChargeId`
- `stripeSessionId`
- `adminDecision`
- `adminNotes`
- `supportStatus`
- `refundStatus`
- `responseVisibility`
- `comparisonEligibility`
- `ranking`
- `score`

## Refund and Payment Guardrails

- Mobile must never calculate refund amount or eligibility.
- Mobile must never call Stripe directly.
- Mobile must never receive Stripe secrets or raw Stripe internals.
- Backend/admin must decide whether support review results in no action, credit, refund, or another outcome.
- Actual Stripe refund behavior must remain server-only and admin-controlled.
- Pro Access refund/support must not change Core payment, cancellation, payout, or protected payment logic.
- Pro Access support/refund state must not alter Pro comparison visibility unless backend explicitly changes access state.
- Customer copy must avoid promising automatic refunds.
- Customer copy must state that Pro Access unlocks comparison access, not renovation work.

## Customer Mobile UX Guidance

On Customer Pro request detail:

- Show passive support/refund state only when backend returns it.
- Show `Request Pro Access support` or `Request refund review` only when backend `nextActions` allows it.
- Explain that Taskly will review the request.
- Explain that submitting a request does not automatically guarantee a refund.
- Explain that Pro Access unlocks comparison access, not the renovation work.
- Keep the action secondary to comparison/site visit actions.
- Do not show refund amount unless backend returns it.
- Do not show Stripe IDs or internal payment details.
- Do not imply Taskly performs the renovation/project.
- After submission, show refreshed backend state:
  - request submitted
  - review in progress
  - refund approved
  - refund declined
  - credited
  - resolved

## Admin/Support Workflow Guidance

- Admin remains web-only.
- Mobile submits customer intent and displays status only.
- Admin web should own review, notes, decisions, audit trail, and Stripe refund action if added later.
- Admin should be able to inspect the Pro request, Pro Access payment, visible responses, hidden/admin-disabled responses, site visit history, and customer support request details.
- Admin-only notes, moderation internals, Stripe IDs, and raw payment internals must not be returned to mobile.

## Notification Guidance

Do not add notification hooks in this phase.

Future notification hooks may be useful for:

- Support request submitted confirmation.
- Admin review outcome.
- Refund/credit outcome.

Any future push body must remain safe and avoid refund amounts, Stripe IDs, admin notes, contact details, and sensitive support text.

## EN/BG Wording Guidance

| EN | BG |
| --- | --- |
| Request Pro Access support | Заяви Pro Access помощ |
| Request refund review | Заяви преглед за връщане |
| Support review | Преглед от поддръжка |
| Refund review | Преглед за връщане |
| Tell us what happened | Опиши какво се случи |
| Taskly will review your request | Taskly ще прегледа заявката |
| This does not automatically guarantee a refund | Това не гарантира автоматично връщане |
| Pro Access unlocks comparison access, not the renovation work | Pro Access отключва сравнение, не ремонта |
| Request submitted | Заявката е изпратена |
| Review in progress | Прегледът е в ход |
| Refund approved | Връщането е одобрено |
| Refund declined | Връщането е отказано |
| Could not submit request | Не успяхме да изпратим заявката |

Button labels should stay short. Prefer `Support review` / `Преглед` in compact cards when space is tight.

## Non-Scope

- No Pro Access support/refund route implementation.
- No Stripe refund implementation.
- No Pro Access payment logic changes.
- No checkout/webhook/return finalization changes.
- No Pro comparison logic changes.
- No site visit logic changes.
- No notification/deep-link logic changes.
- No Pro chat.
- No Core payment/cancellation/support logic changes.
- No admin workflow changes.
- No Expo upgrade.

## Recommended Next Phase

Recommended Phase 30B: Pro Access support/refund read-only state.

Reason: the backend already exposes payment/access statuses including refunded/credited, but there is no customer-safe support/refund state model or active request state yet. Add backend-authored read-only support/refund fields first, keep `canRequestProAccessRefund` backend-controlled, and display a passive mobile card only when those fields are present.

Recommended follow-up after read-only state: Phase 30C: Pro Access support/refund request implementation.

Phase 30C should add the mobile-safe request route, wrappers, form UI, demo behavior, admin review linkage, and QA checklist without changing Stripe refund behavior unless explicitly scoped.

## Phase 30C Implementation Note

Phase 30C added a customer-facing Pro Access support/refund review request flow.

Backend route added:

- `POST /api/mobile/customer/pro-requests/[proRequestId]/access/support-request`

Backend helper/model approach:

- Added a narrow `submitCustomerProAccessSupportRequest(...)` helper.
- The helper requires mobile-authenticated customer ownership and an eligible Pro Access state.
- Paid/unlocked Pro Access can request support/refund review.
- Failed Pro Access payment attempts can request payment-problem support only.
- Duplicate active Pro Access support reviews are blocked by returning the existing request state.
- Requests are stored in `CustomerSupportRequest` with a new optional `proRequestId` relation.
- Existing Core task support behavior remains separate.
- Existing admin support request inspection can read the related Pro request.

Mobile API and UI:

- Added typed wrapper `requestCustomerProAccessSupport(proRequestId, payload, authToken)`.
- Payload is limited to `issueType`, `reason`, and optional `details`.
- Customer Pro request detail shows a secondary review request action only when backend next actions allow it.
- The form captures issue type, required reason, and optional details.
- After submission, the screen refreshes from the backend response and shows the read-only support/refund review card.
- Demo mode simulates an under-review Pro Access support request locally and does not call the backend.

Guardrails preserved:

- No Stripe refund behavior was added.
- No refund outcome, amount, payment state, access state, comparison state, site visit state, notification/deep-link behavior, Core logic, or admin resolution workflow is changed.
- Mobile does not send customer id, payment status, amount, currency, Stripe ids, access status, admin decision, or support status.
- Mobile does not show refund amounts or Stripe/internal payment details.

Deferred:

- Admin support/refund resolution improvements.
- Stripe refund execution.
- Notification hooks for support/refund outcomes.
- Refund policy/accounting review.

## Phase 30B Implementation Note

Phase 30B added backend-authored read-only Pro Access support/refund state to customer Pro request list and detail responses.

Fields added:

- `proAccessSupportState`
- `proAccessRefundState`
- `proAccessRefundSummary`
- `proAccessSupportReviewLabel`
- `proAccessRefundBlockedReason`
- `proAccessRefundBlockedReasonCode`
- `proAccessRefundSubmittedAt`
- `proAccessRefundResolvedAt`
- `proAccessRefundOutcomeLabel`
- `proAccessSupportNextActions`
- `proAccessNextActions.canOpenProAccessSupport`
- `proAccessNextActions.canViewProAccessSupportStatus`

Current state source:

- Uses existing `ProRequest.accessStatus`.
- Uses existing `ProAccessPayment.status`.
- Uses existing `ProAccessPayment.refundedAt`.
- Does not create a dedicated support/refund request model.
- Does not infer admin review state when it is not stored.
- Keeps `canRequestProAccessRefund` false because no customer mutation route exists yet.

Mobile UI added:

- Customer Pro request list shows compact badges only for relevant support/refund states: payment failed, refund review, refunded, or credited.
- Customer Pro request detail shows a passive Pro Access support/refund card when a relevant backend state exists.
- The card does not include an active request button.
- The card explains that Pro Access unlocks comparison access, not renovation work.
- The card avoids promising automatic refunds and does not show Stripe/internal payment details.

Demo mode:

- Includes no-support/refund, review in progress, refunded, credited, and payment-failed states.
- Does not call refund/support routes.
- Does not simulate a real Stripe refund.

Still deferred:

- Customer support/refund request mutation.
- Dedicated Pro Access support/refund request persistence.
- Admin support/refund resolution improvements.
- Stripe refund execution.
- Notification hooks for support/refund outcomes.
- Real-world refund policy/accounting review.
