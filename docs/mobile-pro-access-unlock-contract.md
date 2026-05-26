# Mobile Pro Access Unlock Contract

Phase 28A documents the existing backend/web Pro Access payment and unlock behavior, plus the safe future mobile API and UI contract. This is a contract review only. Do not implement Pro Access payment, unlock routes, Stripe UI, customer comparison UI, or Pro chat until a dedicated phase.

Use Expo SDK 54 documentation for mobile work because this project currently reports `sdkVersion 54.0.0`. Do not upgrade Expo SDK during feature phases unless the prompt explicitly scopes an Expo upgrade.

## Source Of Truth

- Backend/web remains authoritative for Pro Access fee amount, currency, payment state, unlock state, response visibility, meaningful response eligibility, refunds/support, matching, contact-leakage protection, and lifecycle rules.
- Mobile must use typed backend APIs through `src/lib/api/client.ts`, centralized endpoint paths in `src/lib/api/endpoints.ts`, and backend-authored `nextActions`.
- Mobile must not call Prisma, store secrets, calculate Pro Access fees/refunds, infer unlock eligibility, create Stripe objects directly, expose contact details before the allowed flow, or duplicate response visibility rules.
- Taskly is a marketplace/intermediary. Copy must talk about independent Pros, approved Pros, and comparing professionals; it must not present Taskly as the renovation or project provider.

## Existing Backend/Web Pro Access Logic Found

### Models and statuses

Found in `D:\Taskly\prisma\schema.prisma`:

- `ProRequest.accessStatus` stores request-level access with `ProAccessStatus`.
- `ProRequest.accessPayments` links one request to Pro Access payment records.
- `ProResponse` is unique by `(proRequestId, proProfileId)` and can be `SUBMITTED`, `WITHDRAWN`, or `HIDDEN_BY_ADMIN`.
- `ProAccessPayment` is unique by `proRequestId`, belongs to the customer, stores `amountCents`, `currency`, `status`, `stripePaymentIntentId`, `paidAt`, and `refundedAt`.

Relevant enums:

- `ProAccessStatus`: `NOT_PAID`, `PAID`, `REFUNDED`, `CREDITED`
- `ProAccessPaymentStatus`: `NOT_STARTED`, `PENDING`, `PAID`, `REFUNDED`, `CREDITED`, `FAILED`
- `ProRequestStatus`: `OPEN`, `RESPONSES_RECEIVED`, `ACCESS_UNLOCKED`, `SITE_VISIT_INVITED`, `QUOTE_RECEIVED`, `CLOSED`, `CANCELLED`
- `ProResponseStatus`: `SUBMITTED`, `WITHDRAWN`, `HIDDEN_BY_ADMIN`

### Fee amount and payment constants

Found in `D:\Taskly\src\lib\pro-access-payments.ts`:

- `PRO_ACCESS_FEE_AMOUNT_CENTS = 490`
- `PRO_ACCESS_FEE_CURRENCY = "EUR"`
- `PRO_ACCESS_FEE_PURPOSE = "pro_access_fee"`

Mobile must display only backend-authored fee values/labels in future read models. It must not hardcode or calculate these constants.

### Web checkout setup

Found in `D:\Taskly\src\app\api\pro-access\create-checkout-session\route.ts`:

- Current web route is `POST /api/pro-access/create-checkout-session`.
- It uses web customer auth through `requireCustomerUser`.
- It accepts `{ proRequestId }`.
- It checks customer ownership.
- It treats an already-paid/credited request or paid access payment as already unlocked.
- It requires at least one `SUBMITTED` response from an approved Pro profile.
- It returns `no_responses`, `not_found`, `unauthorized`, `stripe_not_configured`, or `checkout_failed` failure codes.
- It upserts a `ProAccessPayment` as `PENDING`.
- It creates a Stripe Checkout Session in payment mode.
- Stripe metadata includes `purpose`, `proRequestId`, `customerId`, and `userId`.
- Stripe line item is the Pro Access Fee and uses the backend amount/currency.
- It returns a Checkout URL for browser redirect.

This route is web-oriented and not a mobile API contract. A mobile route should be added separately when implementation is scoped.

### Payment finalization and unlock

Found in `D:\Taskly\src\lib\pro-access-payments.ts`, `D:\Taskly\src\app\api\webhooks\stripe\route.ts`, and `D:\Taskly\src\app\pro-access\checkout-return\route.ts`:

- `markProAccessPaidFromMetadata` validates metadata purpose, positive `proRequestId`, positive `customerId`, customer ownership, and at least one submitted response by an approved Pro.
- On success, it updates `ProRequest.accessStatus` to `PAID`.
- It upserts `ProAccessPayment` to `PAID` with backend amount/currency and Stripe PaymentIntent id.
- `markProAccessPaymentFailedFromMetadata` upserts the access payment to `FAILED`.
- Stripe webhook handles `payment_intent.succeeded`, `payment_intent.payment_failed`, and `checkout.session.completed`.
- The checkout return route retrieves the Checkout Session, confirms paid/complete status, calls the same marker helper, and redirects to the web Pro request detail with success/failed query state.

Backend finalization is the source of truth. Mobile must not mark access unlocked from client state alone.

### Unlock visibility and comparison

Found in `D:\Taskly\src\app\dashboard\customer\pro\[id]\page.tsx` and `D:\Taskly\src\components\pro\CustomerProResponsesSection.tsx`:

- Unlock is request-level: one Pro Access unlock opens comparison for the interested Pros on that Pro request.
- Web detail considers access unlocked when `accessStatus` is `PAID` or `CREDITED`, or when request status is `ACCESS_UNLOCKED`.
- Web response comparison includes `SUBMITTED` and `WITHDRAWN` approved-Pro responses, then separates active from removed responses.
- Hidden/admin-disabled responses are excluded from customer comparison.
- Before unlock, web shows locked Pro identities and limited preview details.
- After unlock, web shows Pro display name, profile image if available, category/city summary, portfolio count, years experience, response details, rough quote, materials, site visit, availability, included/excluded items, and short note.
- Web full Pro profile page checks that the customer has a matching request for the profile and at least one unlocked request before showing full profile/portfolio details.
- Chat and site visit buttons are disabled/coming later; Pro chat is not implemented.

### Contact-leakage prevention

Found in `D:\Taskly\src\lib\pro-contact-guard.ts` and the provider response actions:

- Backend blocks emails, phone-like numbers, URLs, messaging/social handles, and direct contact instructions in Pro response fields.
- Customer visibility relies on backend-saved clean response content. Mobile must not expose contact details that backend does not return.
- Mobile may show backend validation errors later, but final enforcement belongs to backend.

### Refund/support state

Found by searching Pro Access payment/admin/customer payment code:

- `ProAccessPayment` and `ProAccessStatus` include `REFUNDED` and `CREDITED`.
- Admin Pro fees/support pages list failed/refunded payments and show `refundedAt`.
- Customer payments page lists Pro unlock payments and states that the Pro Access Fee unlocks platform access, not project outcome.
- No dedicated customer mobile Pro Access refund/support route or mobile read model exists yet.
- No specific Pro Access refund policy helper was found in the mobile API layer.

This is a contract gap: future mobile must receive backend-authored refund/support state and `nextActions`; mobile must not decide refund eligibility or amount.

## Existing Routes, Actions, Helpers, And Models Found

- `D:\Taskly\prisma\schema.prisma`
  - `ProRequest`
  - `ProResponse`
  - `ProAccessPayment`
  - `ProAccessStatus`
  - `ProAccessPaymentStatus`
  - `ProResponseStatus`
- `D:\Taskly\src\lib\pro-access-payments.ts`
  - `PRO_ACCESS_FEE_AMOUNT_CENTS`
  - `PRO_ACCESS_FEE_CURRENCY`
  - `PRO_ACCESS_FEE_PURPOSE`
  - `parsePositiveInt`
  - `markProAccessPaidFromMetadata`
  - `markProAccessPaymentFailedFromMetadata`
- `D:\Taskly\src\app\api\pro-access\create-checkout-session\route.ts`
  - Web Checkout Session creation.
- `D:\Taskly\src\app\api\webhooks\stripe\route.ts`
  - Stripe webhook finalization/failure handling.
- `D:\Taskly\src\app\pro-access\checkout-return\route.ts`
  - Web Checkout return finalization.
- `D:\Taskly\src\app\dashboard\customer\pro\[id]\page.tsx`
  - Web customer Pro request comparison visibility.
- `D:\Taskly\src\components\pro\CustomerProResponsesSection.tsx`
  - Web unlock modal, Checkout redirect, limited/full response comparison.
- `D:\Taskly\src\app\dashboard\customer\payments\page.tsx`
  - Customer payments/unlocks history.
- `D:\Taskly\src\lib\taskly-pro.ts`
  - `canCustomerViewUnlockedProResponses`.
- `D:\Taskly\src\lib\mobile-customer-readonly.ts`
  - Current mobile Customer Pro request list/detail read models.
- `D:\Taskly\src\app\api\mobile\customer\pro-requests\route.ts`
  - Mobile customer Pro list/create.
- `D:\Taskly\src\app\api\mobile\customer\pro-requests\[proRequestId]\route.ts`
  - Mobile customer Pro detail.

## Current Mobile Customer Pro Read-Only Coverage

Found in `D:\Taskly-app`:

- `app/customer/pro-requests.tsx` shows customer Pro request list, response count, unlock status label, and detail navigation.
- `app/customer/pro-requests/[proRequestId].tsx` shows Pro request detail, images, response previews, rough quote labels, locked/unlocked labels, and disabled backend `nextActions`.
- `src/lib/api/customer.ts` has `getCustomerProRequests`, `getCustomerProRequestDetail`, and `createCustomerProRequest`.
- `src/lib/api/endpoints.ts` has customer Pro request list/detail/create endpoints only.
- `src/lib/api/domain.ts` includes:
  - `CustomerProRequestSummary`
  - `CustomerProRequestsResponse`
  - `CustomerProResponsePreview`
  - `CustomerProRequestDetail`
  - `CustomerProRequestDetailResponse`
- `src/lib/api/mockApi.ts` provides demo Customer Pro list/detail data.
- No mobile wrapper, endpoint, payload type, or screen exists for Pro Access setup/finalize.

Current mobile Pro detail gets:

- `isUnlocked`
- `responsesCount`
- `unlockStatusLabel`
- `responsePreviews`
- generic `nextActions`

Current mobile gaps:

- No explicit Pro Access fee amount/currency/label.
- No `proAccessState` or `proAccessPaymentState`.
- No blocked reason code for unlock.
- No distinction between total responses and meaningful submitted approved responses.
- No explicit payment retry/finalize/refund/support actions.
- No unlocked full comparison structure beyond limited response preview fields.

## Missing Mobile API Gaps

### Read-only state gaps

Mobile needs backend-authored state before payment implementation:

- Whether the request is eligible for Pro Access unlock.
- Whether enough meaningful responses exist.
- Whether the request is closed/cancelled or otherwise blocked.
- Whether a Pro Access payment is not started, pending, paid, failed, refunded, or credited.
- Whether access is already unlocked.
- Whether the customer can retry payment.
- Whether the customer can request support/refund.
- Which response fields are safe to show before unlock and after unlock.
- Whether hidden/admin-disabled responses were excluded.

### Payment mutation gaps

Mobile has no routes for:

- Pro Access payment setup/initiation.
- Pro Access payment confirmation/finalization.
- Unlock state refresh after payment.
- Pro Access retry after failure.
- Pro Access refund/support request.

### Customer comparison gaps

Mobile has no backend-shaped full comparison model for:

- Full response details after unlock.
- Full allowed Pro profile/portfolio summary after unlock.
- Removed/withdrawn response handling.
- Contact/chat/site visit capabilities after unlock.
- Pro profile page gating from mobile.

## Proposed Read-Only Pro Access Fields

Add these fields first to customer Pro request list/detail responses where appropriate:

```ts
type CustomerProAccessState = {
  status:
    | 'not_available'
    | 'waiting_for_responses'
    | 'available'
    | 'payment_pending'
    | 'payment_failed'
    | 'unlocked'
    | 'credited'
    | 'refunded'
    | 'request_closed'
    | 'unknown';
  statusLabel: string;
  helperText: string;
  isUnlocked: boolean;
  meaningfulResponsesCount: number;
  totalResponsesCount: number;
  submittedResponsesCount: number;
  hiddenResponsesExcluded: boolean;
};

type CustomerProAccessPaymentState = {
  status: 'not_started' | 'pending' | 'paid' | 'failed' | 'refunded' | 'credited' | 'unknown';
  statusLabel: string;
  amountLabel: string | null;
  amountCents: number | null;
  currency: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  retryAvailable: boolean;
};

type CustomerProAccessNextActions = {
  canUnlockProResponses: boolean;
  canPrepareProAccessPayment: boolean;
  canConfirmProAccessPayment: boolean;
  canRetryProAccessPayment: boolean;
  canRequestProAccessRefund: boolean;
  canViewUnlockedResponses: boolean;
  blockedReason?: string | null;
  blockedReasonCode?: string | null;
};
```

Suggested response fields:

- `proAccessState`
- `proAccessPaymentState`
- `proUnlockState`
- `proAccessSummary`
- `proAccessFeeLabel`
- `proAccessFeeAmount`
- `proAccessFeeCurrency`
- `proAccessBlockedReason`
- `proAccessBlockedReasonCode`
- `responsePreviewSummary`
- `unlockedResponseSummary`
- `comparisonState`
- `nextActions.canUnlockProResponses`
- `nextActions.canPrepareProAccessPayment`
- `nextActions.canConfirmProAccessPayment`
- `nextActions.canRetryProAccessPayment`
- `nextActions.canRequestProAccessRefund`
- `nextActions.canViewUnlockedResponses`

## Proposed Future Mobile Pro Access Payment Route Contract

Do not implement these routes in Phase 28A.

### Recommended mobile route shape

Use mobile-specific routes instead of reusing the web Checkout route:

- `POST /api/mobile/customer/pro-requests/[proRequestId]/access/setup`
- `POST /api/mobile/customer/pro-requests/[proRequestId]/access/finalize`

Alternative if backend owners prefer mobile Checkout redirect:

- `POST /api/mobile/customer/pro-requests/[proRequestId]/access/checkout-session`

For a React Native Stripe SDK flow, setup/finalize should be preferred because mobile can confirm a backend-created PaymentIntent client secret without browser Checkout. If backend chooses Checkout, mobile must use an approved browser/deep-link return design in a dedicated phase.

### Setup route contract

`POST /api/mobile/customer/pro-requests/[proRequestId]/access/setup`

Requires:

- Mobile auth.
- Customer Workspace access.
- Customer ownership of the Pro request.
- Request not closed/cancelled.
- Access not already paid/credited/unlocked.
- At least one meaningful submitted response by an approved Pro.
- Backend-controlled Pro Access fee amount/currency.
- Stripe configured if real payment is required.

Accepts only safe payload fields:

- `returnUrl?: string` only if a browser/Checkout route is chosen.
- `idempotencyKey?: string` only if backend chooses to accept a client-provided key; backend should prefer server-derived idempotency.

Returns:

- Refreshed customer Pro request detail read model.
- `proAccessPaymentState`.
- For PaymentIntent flow: backend-created `clientSecret`, publishable-key-compatible metadata only, and no secret keys.
- For Checkout flow: backend-created Checkout URL and explicit return/deep-link instructions.
- Backend-authored `nextActions`.

Failure states:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `REQUEST_NOT_AVAILABLE`
- `ALREADY_UNLOCKED`
- `NO_MEANINGFUL_RESPONSES`
- `PAYMENT_ALREADY_PENDING`
- `STRIPE_NOT_CONFIGURED`
- `PAYMENT_SETUP_FAILED`

### Finalize route contract

`POST /api/mobile/customer/pro-requests/[proRequestId]/access/finalize`

Requires:

- Mobile auth.
- Customer Workspace access.
- Customer ownership of the Pro request.
- A backend-created Pro Access payment object.
- Stripe confirmation that the PaymentIntent/Checkout Session succeeded.
- The same response eligibility checks before unlock.

Accepts only safe payload fields:

- `paymentIntentId?: string`
- `checkoutSessionId?: string`

The route must not trust mobile-sent status, amount, currency, unlock state, customer id, request status, or Stripe payment outcome.

Returns:

- Refreshed customer Pro request detail read model.
- Updated `proAccessState`.
- Updated `proAccessPaymentState`.
- Updated `responsePreviewSummary` / `unlockedResponseSummary`.
- Updated `nextActions`.

Failure states:

- `PAYMENT_NOT_FOUND`
- `PAYMENT_NOT_SUCCEEDED`
- `PAYMENT_CUSTOMER_MISMATCH`
- `PAYMENT_AMOUNT_MISMATCH`
- `PAYMENT_CURRENCY_MISMATCH`
- `NO_MEANINGFUL_RESPONSES`
- `UNLOCK_FAILED`

## Payment Guardrails

- Mobile may use Stripe SDK only with a publishable key and backend-created client secret.
- Mobile must never receive Stripe secret keys, webhook secrets, connected-account secrets, raw card data, or raw Stripe server objects.
- Mobile must never create a PaymentIntent/SetupIntent directly.
- Mobile must not calculate amount, currency, refund amount, unlock eligibility, response visibility, or payment result.
- Backend must decide amount, currency, eligibility, idempotency, payment state, unlock state, and refund/support state.
- Backend must finalize unlock only after payment success according to current backend/web logic.
- Pro Access is not a payout to Pros and must not require Stripe verification for Pro-only professionals.
- Do not mix Pro Access with Core protected payment, Core payout, release, refund, commission, cancellation, or dispute logic.

## Forbidden Client-Owned Fields

Future mobile Pro Access routes must reject or ignore:

- `customerId`
- `userId`
- `proRequestId` in body when path param is authoritative
- `providerId`
- `proProfileId`
- `responseId`
- `accessStatus`
- `unlockStatus`
- `paymentStatus`
- `amountCents`
- `amount`
- `currency`
- `fee`
- `refundAmount`
- `stripePaymentIntentId` when not part of finalize verification
- `stripeCustomerId`
- `stripePaymentMethodId`
- `stripeSecretKey`
- `clientSecret` sent from the client
- request lifecycle/status fields
- response visibility/status fields
- hidden/admin moderation fields
- matching/eligibility fields
- contact-leakage result fields

## Unlock Visibility Rules

- Unlock is per Pro request.
- Unlock opens comparison details for all eligible interested Pros/responses on that request.
- Backend must exclude `HIDDEN_BY_ADMIN` responses.
- Backend should define whether withdrawn/removed responses appear as removed history or are hidden from mobile.
- Backend should use meaningful response count for unlock eligibility: submitted response, approved Pro profile, not admin-hidden.
- Backend should provide full response/profile/portfolio fields only after unlock.
- Mobile must render only fields returned by backend; it must not infer hidden profile/contact fields.
- Mobile must not invent chat, site visit, direct contact, or full profile routes unless backend returns those capabilities.

## Customer Preview And Full Response Rules

Before unlock:

- Show response count and safe limited previews only.
- Show generic Pro labels if backend withholds identity.
- Show locked rough quote text if backend withholds quote details.
- Explain posting was free.
- Explain Pro Access unlocks comparison details.
- Do not expose Pro phone, email, social, external links, direct contact instructions, or full contact/profile details.

After unlock:

- Show unlocked comparison state.
- Show full allowed response details returned by backend.
- Show allowed Pro profile/portfolio summary returned by backend.
- Continue to respect contact-leakage and visibility rules.
- Do not expose data backend does not return.
- Do not create Pro chat.

## Refund And Support Gaps

Existing backend model supports `REFUNDED` and `CREDITED` Pro Access states, and admin/customer web pages can inspect payment history. A dedicated customer mobile Pro Access refund/support route was not found.

Future mobile read models should add:

- `proAccessRefundState`
- `proAccessSupportState`
- `nextActions.canRequestProAccessRefund`
- `nextActions.canContactSupportAboutProAccess`
- Backend-authored refund/support blocked reason and reason code.

Future mobile mutations should be scoped separately and must:

- Require mobile auth.
- Require customer ownership.
- Use backend policy for refund eligibility.
- Never calculate refund amount on mobile.
- Return refreshed Pro request detail/payment state.

## Customer Mobile UX Guidance

### Before unlock

- Show response count and limited previews.
- Show `Posting is free` near request creation/read-only context.
- Show `Pro Access` as the paid comparison unlock.
- Show what unlock includes:
  - full Pro responses
  - rough quotes
  - portfolio/profile details where allowed
  - availability/work style/site visit policy where allowed
- Show backend fee label.
- Show unlock CTA only when backend `nextActions.canUnlockProResponses` and `canPrepareProAccessPayment` allow it.
- Show backend blocked reason for no meaningful responses or unavailable request.

### Payment

- Use a calm premium bottom sheet or card.
- Explain secure payment and what happens next.
- Say the payment unlocks comparison access, not the renovation work.
- Do not use raw Stripe jargon.
- Do not use payment-holding wording for Pro Access.
- Do not present Taskly as the project provider.

### After unlock

- Show unlocked comparison state.
- Show full allowed response cards.
- Keep Pro orange/gold accent light.
- Preserve contact-leakage rules.
- Do not add Pro chat or customer unlock/comparison features beyond backend-returned data.

## EN/BG Wording Guidance

| Intent | EN | BG |
| --- | --- | --- |
| Unlock and compare Pros | Unlock and compare Pros | Отключи и сравни Pro |
| Pro Access | Pro Access | Pro достъп |
| Pro Access Fee | Pro Access Fee | Такса за Pro достъп |
| Posting is free | Posting is free | Публикуването е безплатно |
| Pros have responded | Pros have responded | Има Pro отговори |
| Unlock full responses | Unlock full responses | Отключи пълните отговори |
| Compare rough quotes and profiles | Compare rough quotes and profiles | Сравни ориентировъчни оферти и профили |
| Secure payment | Secure payment | Сигурно плащане |
| Access unlocked | Access unlocked | Достъпът е отключен |
| No responses yet | No responses yet | Все още няма отговори |
| Unlock available after Pro responses | Unlock available after Pro responses | Отключването е налично след Pro отговори |
| Request support/refund | Request support/refund | Поискай помощ/възстановяване |
| Access, not project work | This payment unlocks comparison access, not the renovation work. | Това плащане отключва сравнение, не ремонта. |
| Independent Pros | Independent Pros | Независими Pro |
| Approved Pros | Approved Pros | Одобрени Pro |

Keep Bulgarian button labels short. Prefer explanatory text below the CTA instead of long buttons.

## Non-Scope

- No Pro Access refund/support routes.
- No comparison mutations, Pro chat, site-visit invites, or advanced ranking/filtering.
- No Pro chat.
- No admin workflow changes.
- No Core payment, cancellation, support, refund, payout, commission, or dispute changes.
- No Expo SDK upgrade.
- No secrets or `.env` changes.

## Recommended Next Phase

Recommended Phase 28B: Customer Pro Access read-only/unlock state.

Phase 28B should:

- Add backend-authored Pro Access read-only fields to customer Pro request list/detail.
- Add meaningful response counts distinct from total response counts.
- Add Pro Access fee label/amount/currency from backend.
- Add payment/refund/support state labels and blocked reasons.
- Add `nextActions` for unlock/payment/refund/support capabilities.
- Update mobile types, mocks, i18n, and read-only UI to show this state.
- Continue to avoid payment mutation routes and Stripe UI until a later implementation phase.

Only after Phase 28B proves read-only state is sufficient should a later phase implement Pro Access payment setup/finalize.

## Phase 28B Implementation Note

Phase 28B added backend-authored read-only Pro Access state to customer mobile Pro request list/detail responses.

Added fields include:

- `proAccessState`
- `proAccessPaymentState`
- `proUnlockState`
- `proAccessSummary`
- `proAccessFeeLabel`
- `proAccessFeeAmount`
- `proAccessFeeCurrency`
- `proAccessBlockedReason`
- `proAccessBlockedReasonCode`
- `responsePreviewSummary`
- `unlockedResponseSummary`
- `comparisonState`
- `meaningfulResponseCount`
- `submittedResponseCount`
- `visiblePreviewResponseCount`
- `unlockedResponseCount`
- `proAccessNextActions`

Mobile now displays passive Pro Access/unlock state on Customer Pro list/detail screens, with demo examples for no responses, unlock available, and access unlocked. Payment setup/finalize routes, Stripe UI, Pro Access mutation behavior, Pro chat, and full post-unlock comparison expansion remain deferred.

Recommended next phase: Phase 28C should implement the mobile Pro Access payment setup/finalize contract only after confirming the Phase 28B read-only state is stable across real customer/pro test accounts.

## Phase 28C Implementation Note

Phase 28C implemented a mobile-safe Stripe Checkout launch flow for Customer Pro Access.

Chosen approach:

- Reuse the existing backend/web Stripe Checkout source of truth instead of introducing a new PaymentIntent/PaymentSheet path.
- Add a shared backend helper for Pro Access Checkout eligibility, pending payment upsert, Stripe Checkout Session creation, metadata, amount, currency, and idempotency.
- Keep webhook/checkout-return finalization authoritative. Mobile never marks access as paid or unlocked from client state alone.

Backend route added:

- `POST /api/mobile/customer/pro-requests/[proRequestId]/access/checkout`

The route:

- Requires mobile auth.
- Requires Customer Workspace access.
- Requires customer ownership through the shared backend Checkout helper.
- Requires at least one submitted approved-Pro response.
- Rejects forbidden client-owned payment/unlock fields such as amount, currency, fee, customer id, access status, payment status, visibility, Stripe metadata, client secret, checkout URL, and session id.
- Uses backend Pro Access fee constants and Stripe server configuration only.
- Returns a mobile-safe `checkoutUrl`, `sessionId`, `alreadyUnlocked`, and refreshed customer Pro request detail.

Mobile wrapper added:

- `createCustomerProAccessCheckout(proRequestId, authToken)`

Mobile UI behavior added:

- Customer Pro request detail now shows an active unlock CTA only when backend `proAccessNextActions` allow payment preparation/retry and unlock.
- Before Checkout, the app shows a confirmation card explaining that posting was free, Pro responses are available, the backend fee label, and that Pro Access unlocks comparison access rather than renovation work.
- The app opens the backend-created Checkout URL with Expo SDK 54 `expo-web-browser`.
- After Checkout closes, the app refreshes Pro request detail from the backend and shows pending confirmation/unlocked state based only on backend response fields.
- A manual `Refresh access status` action is available.
- Demo mode simulates local unlock only and does not call Stripe or backend payment routes.

Deferred after Phase 28C:

- Full customer comparison UI expansion beyond backend-returned read-only previews.
- Pro chat.
- Pro Access refund/support route.
- Deep-link polish for store builds and dedicated return URL handling.
- Real-device Checkout return testing against configured Stripe webhook/return URLs.

## Phase 28E Implementation Note

Phase 28E added the first read-only Customer mobile comparison view after Pro Access is paid/unlocked.

Backend read model update:

- Customer Pro request detail now returns `unlockedComparison` only as backend-shaped read data.
- The comparison model is detail-only and uses submitted responses from approved Pro profiles.
- Hidden/admin-disabled responses remain excluded.
- Returned response/profile fields are safe customer comparison fields: Pro display/trade name, reviewed/independent labels, profile summary, rough quote range, materials/site visit/availability notes, included/excluded notes, assumptions, customer preparation notes, portfolio count, category/city summaries, and safe profile image URL.
- The read model does not return admin-only fields, Stripe/payment internals, ranking internals, payout data, moderation internals, or private contact details.

Mobile update:

- Customer Pro request detail renders a `Compare approved Pros` section only when backend `unlockedComparison.canViewFullComparison` is true.
- Before unlock, the screen keeps the existing Pro Access card and limited response preview behavior.
- After unlock, comparison cards show only backend-returned fields and include copy that the final agreement is between the customer and the independent Pro.
- Demo mode includes local safe unlocked comparison examples and does not call payment routes or simulate real settlement.

Still deferred:

- Pro chat.
- Site visit invite flow.
- Pro Access refund/support route.
- Deep-link/store Checkout polish.
- Advanced ranking, sorting, and filtering.
- Admin moderation enhancements.
