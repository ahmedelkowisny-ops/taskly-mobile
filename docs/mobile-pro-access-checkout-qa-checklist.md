# Mobile Pro Access Checkout QA Checklist

Phase 28D verifies the Customer Pro Access Checkout flow added in Phase 28C. This QA pass does not add refund/support mutations, full customer comparison UI, Pro chat, admin workflow changes, Core payment changes, Stripe architecture changes, or Expo upgrades.

Use Expo SDK 54 documentation for mobile work because this project currently reports `sdkVersion 54.0.0`. Do not upgrade Expo SDK during feature phases unless the prompt explicitly scopes an Expo upgrade.

## Required Test Users And Accounts

- Customer A with a Pro request that has at least one submitted response from an approved matching Pro.
- Customer A with a Pro request that has no responses.
- Approved matching Pro with approved city/category and one submitted response for Customer A's request.
- Optional Customer B who does not own Customer A's Pro request.
- Optional Pro request with responses that are not eligible for unlock because responses are hidden/admin-disabled, withdrawn, or from a non-approved Pro.

## Backend And Mobile Prerequisites

- Backend is running with the Phase 28C mobile route available:
  - `POST /api/mobile/customer/pro-requests/[proRequestId]/access/checkout`
- Mobile app points to the backend through `EXPO_PUBLIC_TASKLY_API_BASE_URL`.
- Customer auth works through the mobile `AuthProvider` token flow.
- Customer Pro request list/detail read models include Phase 28B fields:
  - `proAccessState`
  - `proAccessPaymentState`
  - `proAccessNextActions`
  - response counts and summaries
- Customer Pro detail screen is refreshed from backend state after Checkout returns or closes.
- Demo mode remains available and does not call backend payment routes.

## Stripe Test-Mode Prerequisites

- Backend has test-mode Stripe server configuration.
- Webhook route is reachable for test events:
  - `POST /api/webhooks/stripe`
- Checkout return route is reachable:
  - `GET /pro-access/checkout-return?session_id=...`
- Stripe test payment cards are available to the tester.
- No Stripe secret key, webhook secret, raw card data, PaymentIntent creation, or Checkout Session creation is present in the mobile app.

## Backend Mobile Route Checklist

- Requires mobile auth; unauthenticated requests return `UNAUTHORIZED`.
- Requires Customer Workspace access; non-customer accounts return `FORBIDDEN`.
- Uses path `proRequestId` as the authoritative request id.
- Checks customer ownership through the shared backend Checkout helper.
- Blocks closed/cancelled requests with a safe error.
- Blocks no-response or non-meaningful-response requests with a safe error.
- Treats already paid/credited/unlocked requests as already unlocked and does not create a new Checkout Session.
- Uses backend Pro Access fee constants only.
- Creates Stripe Checkout Session server-side only.
- Returns only mobile-safe fields:
  - `checkoutUrl`
  - `sessionId`
  - `alreadyUnlocked`
  - refreshed customer Pro request detail
- Accepts an empty JSON body from mobile.
- Rejects mobile-sent payment/unlock fields, including amount, currency, fee, customer id, access status, payment status, unlock status, response count, visibility, Checkout URL, session id, Stripe metadata, or client secret.

## Shared Helper Checklist

- Existing web route still calls the shared helper and keeps existing web response shape.
- Mobile route calls the same helper and therefore shares ownership, response eligibility, fee, metadata, and Checkout creation rules.
- Helper verifies:
  - positive Pro request id
  - customer ownership
  - request is not closed/cancelled
  - not already paid/credited/unlocked
  - at least one submitted approved-Pro response
  - Stripe server configuration
- Helper upserts `ProAccessPayment` as `PENDING` before creating Checkout.
- Helper uses backend amount/currency constants.
- Helper includes backend-authored metadata for finalization.
- Helper does not expose Stripe secret key or raw Stripe server objects to mobile.

## Mobile Wrapper Checklist

- `createCustomerProAccessCheckout(proRequestId, authToken)` uses the centralized endpoint helper.
- Wrapper sends an empty body only.
- Wrapper sends the bearer token through the typed API client.
- Wrapper does not send amount, currency, fee, unlock state, payment state, response count, visibility, Stripe metadata, Checkout URL, session id, or client secret.
- Wrapper returns typed checkout response fields and refreshed Pro request detail.
- Backend errors are surfaced through the standard `ApiResult` error shape.

## Checkout Happy Path

- Login as Customer A.
- Open Customer Pro request detail for a request with at least one submitted approved-Pro response.
- Confirm Pro Access card shows:
  - response count
  - approved Pro count
  - backend fee label
  - unlock available state
  - limited preview before unlock
- Tap `Unlock and compare Pros`.
- Confirm the payment card explains:
  - posting was free
  - Pro Access unlocks comparison access
  - payment is not for the renovation work
  - independent Pros remain responsible for their own work and agreement
- Tap `Continue to secure payment`.
- Verify mobile calls only the backend mobile Checkout route.
- Verify Checkout opens through Expo WebBrowser using the backend-created `checkoutUrl`.
- Complete a Stripe test payment.
- Return to Taskly.
- Verify mobile refreshes request detail.
- Verify backend state becomes paid/unlocked only after webhook or checkout-return finalization.
- Verify unlocked state is shown from backend response fields.

## Already-Unlocked Checklist

- Open an already paid/credited/unlocked Pro request.
- Verify no active payment CTA appears.
- Verify `Access unlocked` or equivalent backend-authored state is shown.
- Call the mobile checkout route directly for the request.
- Verify it returns `alreadyUnlocked` and refreshed detail without creating a new Checkout Session.

## Blocked-State Checklist

- No responses yet:
  - Pro Access card shows backend blocked reason.
  - Unlock CTA is not active.
  - Direct route call returns a safe no-response error.
- Responses exist but are not meaningful/eligible:
  - Unlock CTA is not active.
  - Hidden/admin-disabled responses are not counted as eligible.
  - Direct route call returns a safe no-response or not-eligible error.
- Closed/cancelled request:
  - Unlock CTA is not active.
  - Direct route call returns a safe request-not-available error.
- Non-owner customer:
  - Detail route does not expose the request.
  - Checkout route returns `NOT_FOUND` or a safe ownership failure.
- Stripe not configured:
  - Checkout route returns a safe configuration error.
  - Mobile shows `Could not start payment` or backend-safe message.
- Checkout creation failure:
  - Route returns a safe failure.
  - Mobile does not update local state to unlocked.

## Checkout-Cancelled Or No-Payment Checklist

- Start Checkout and close the browser without paying.
- Return to Taskly.
- Verify mobile refreshes Pro request detail.
- Verify access remains locked if backend still reports locked/pending.
- Verify UI shows confirmation/pending guidance or allows manual refresh.
- Verify the app does not infer payment success from browser close/open result.

## Webhook And Return Finalization Checklist

- Stripe `checkout.session.completed` calls `markProAccessPaidFromMetadata`.
- Stripe `payment_intent.succeeded` calls `markProAccessPaidFromMetadata`.
- Stripe `payment_intent.payment_failed` calls `markProAccessPaymentFailedFromMetadata`.
- Checkout return route retrieves the Checkout Session and only marks paid when Stripe reports paid/complete.
- `markProAccessPaidFromMetadata` verifies:
  - purpose metadata
  - valid Pro request id
  - valid customer id
  - customer owns the request
  - at least one submitted approved-Pro response still exists
- Backend sets `ProRequest.accessStatus = PAID` only after verified payment.
- Backend upserts `ProAccessPayment` with backend amount/currency and Stripe PaymentIntent id.

## Preview And Unlock Visibility Checklist

- Before unlock, customer sees limited previews only.
- Before unlock, rough quote/profile/contact details remain hidden unless backend explicitly returns them.
- Hidden/admin-disabled responses are excluded from customer-visible counts and comparison.
- After unlock, mobile renders only fields returned by backend.
- Full comparison UI expansion remains deferred unless backend already returns read-only safe fields.
- No Pro chat appears.
- No Pro/customer contact details are exposed before backend allows them.

## Demo-Mode Checklist

- Demo Pro Access CTA appears only for the demo request with unlock-available `proAccessNextActions`.
- Demo unlock updates local mock state to the unlocked request.
- Demo mode does not call:
  - mobile Checkout route
  - web Checkout route
  - Stripe
- Demo copy clearly says no real payment was processed.
- Demo mode does not simulate refunds, support settlement, or real money movement.

## Security And Forbidden Client Field Checks

Use direct API calls against the mobile Checkout route and verify rejection for bodies containing:

- `amount`
- `amountCents`
- `currency`
- `fee`
- `customerId`
- `userId`
- `accessStatus`
- `paymentStatus`
- `unlockStatus`
- `responseCount`
- `visibility`
- `metadata`
- `stripeMetadata`
- `clientSecret`
- `checkoutUrl`
- `sessionId`

Also verify arbitrary non-empty mobile body fields are rejected, since this route accepts no mobile-controlled payment payload.

## i18n And Copy Checks

- Copy uses `Pro Access`, `unlock and compare`, `approved Pros`, and `independent Pros`.
- Copy does not use forbidden payment-holding wording.
- Copy does not use release labels.
- Copy does not present Taskly as the renovation or project provider.
- EN/BG button labels are short enough for mobile widths.
- Confirmation copy avoids raw Stripe jargon in the mobile UI.
- Bulgarian wording remains concise and natural.

## Known Deferred Items

- Full customer comparison UI.
- Pro Access refund/support route.
- Pro chat.
- Deep-link/store-build polish.
- Store-device testing of Checkout return behavior.
