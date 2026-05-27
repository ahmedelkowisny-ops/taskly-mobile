# Mobile Pro Access Support/Refund QA Checklist

Phase 30D verifies the Pro Access support/refund review request flow added in Phase 30B and Phase 30C. This QA pass must not add Stripe refund behavior, refund outcome decisions, admin resolution workflow changes, or new product areas.

## Required Test Users/Accounts

- Customer with a paid/unlocked Pro Access request and visible approved Pro responses.
- Customer with a Pro request that has no eligible Pro Access payment.
- Optional customer with a failed Pro Access payment attempt.
- Optional non-owner customer account for ownership rejection checks.

## Backend/Mobile Prerequisites

- Backend is running with the latest Prisma migration applied.
- Mobile app points to the same backend environment through the typed API client.
- Customer mobile auth is available and returns customer workspace access.
- Demo mode remains available for local mobile checks.
- Admin web access is available for read-only inspection of support requests.

## Support/Refund Request Happy Path

- Open a paid/unlocked customer Pro request detail screen.
- Confirm the support/refund card displays backend-authored support and refund state.
- Confirm the review request action is secondary and appears only when backend next actions allow it.
- Open the request form and select a safe issue type.
- Enter a valid reason and optional details.
- Submit once and confirm the button enters a loading state.
- Confirm repeated taps are disabled while submitting.
- Confirm the backend returns refreshed Pro request detail state.
- Confirm the support/refund card changes to review in progress or equivalent backend state.
- Confirm the UI does not promise an automatic refund.
- Confirm the UI explains that Pro Access unlocks comparison access, not the renovation work.

## Blocked-State Checklist

- Pro request with no eligible Pro Access payment cannot submit a request.
- Closed, unavailable, or ineligible support states show backend blocked copy instead of a submit action.
- Failed payment state allows payment-problem review only if backend rules allow it.
- Refunded or credited states remain read-only and do not expose a new request action.
- Customer without customer workspace access receives an authorization/workspace error.
- Non-owner customer receives a not found or forbidden response and cannot see private request state.

## Duplicate Request Checklist

- Submit a valid support/refund review for an eligible Pro request.
- Try submitting another request for the same customer and Pro request.
- Confirm the backend returns the existing under-review state instead of creating a second active review.
- Confirm the mobile UI displays review in progress after the duplicate attempt.

## Forbidden Client Field/Security Checklist

- Confirm the mobile wrapper sends only `issueType`, `reason`, and `details`.
- Manually send `customerId` and confirm the backend rejects it.
- Manually send `amount`, `amountCents`, or `currency` and confirm the backend rejects it.
- Manually send `refundAmount` or `refundAmountCents` and confirm the backend rejects it.
- Manually send `paymentStatus`, `accessStatus`, or `supportStatus` and confirm the backend rejects it.
- Manually send Stripe identifiers such as `stripePaymentIntentId` or `stripeRefundId` and confirm the backend rejects them.
- Confirm the response does not expose admin notes, Stripe internals, refund calculations, or hidden admin fields.

## Contact-Leakage Checklist

- Enter a valid reason with no contact details and confirm submission works when otherwise eligible.
- Enter an email address in reason or details and confirm the backend blocks or safely flags it.
- Enter a phone number in reason or details and confirm the backend blocks or safely flags it.
- Confirm mobile also shows a clear validation message when obvious contact details are entered.
- Confirm support text is not reused in push notifications or other public surfaces.

## Demo-Mode Checklist

- Enable demo mode and open an eligible Pro Access demo request.
- Submit a local support/refund review request.
- Confirm demo mode does not call the backend route.
- Confirm demo mode does not simulate a Stripe refund.
- Confirm demo mode does not claim that a real refund was issued.
- Confirm local state changes to under review and preserves the read-only support/refund card.

## Admin Read-Only Inspection Checklist

- After a real backend submission, open the admin support request list.
- Confirm the support request is visible to admin web users.
- Confirm the linked Pro request can be inspected from the admin support list.
- Confirm admin-only inspection remains web-only.
- Confirm no mobile admin route or admin mobile workflow was added.
- Confirm there is no admin refund execution or outcome decision added by this phase.

## i18n/Copy Checklist

- Confirm EN and BG copy is concise and fits mobile layouts.
- Confirm action labels use Pro Access, support review, refund review, approved Pros, and independent Pros.
- Confirm the UI never uses public version labels.
- Confirm the UI never uses forbidden protected-payment wording for this Pro Access flow.
- Confirm reason-required, too-long, loading, success, and error states are translated.
- Confirm Bulgarian strings remain natural and short enough for compact cards and buttons.

## Known Deferred Items

- Admin support/refund resolution improvements.
- Stripe refund execution.
- Outcome notifications.
- Refund policy/accounting review.
- Advanced support evidence upload if later needed.
