# Mobile Pro Provider Response Contract

Phase 27A documents the existing Taskly Pro backend/web behavior and the safe future mobile contract for Provider Workspace Pro response submission and editing. This is a contract review only. Do not implement mobile response mutations until a dedicated phase.

Use Expo SDK 54 documentation for mobile work because this project currently reports `sdkVersion 54.0.0`. Do not upgrade Expo SDK during feature phases unless the prompt explicitly scopes an Expo upgrade.

## Source of Truth

- Backend/web remains authoritative for Pro profile status, category approval, city coverage, request matching, response editability, Pro Access Fee unlock state, customer preview visibility, and contact-leakage enforcement.
- Mobile must use typed backend APIs through `src/lib/api/client.ts`, centralized paths in `src/lib/api/endpoints.ts`, and backend-authored `nextActions`.
- Mobile must not call Prisma, store secrets, infer Pro approval/matching locally, expose contact details before the allowed unlock/contact flow, or implement Pro Access payment/unlock in this phase.

## Existing Backend/Web Pro Logic Found

### Models and statuses

Found in `D:\Taskly\prisma\schema.prisma`:

- `ProProfile` owns Pro identity, status, internal phone/email, portfolio, city coverage, category approvals, responses, site visits, and final quotes.
- `ProCategoryApproval` tracks per-category approval with `PENDING`, `APPROVED`, `REJECTED`, and `SUSPENDED`.
- `ProCityCoverage` tracks selected service cities for a Pro profile.
- `ProRequest` stores customer project details, status, `accessStatus`, images, responses, access payments, site visit invites, and final quotes.
- `ProResponse` is unique by `(proRequestId, proProfileId)` and stores:
  - `status`
  - `shortMessage`
  - `roughPriceMin`
  - `roughPriceMax`
  - `includedText`
  - `customerPreparationText`
  - `availabilityText`
  - `siteVisitRequirement`
  - `assumptionsText`
- `ProAccessPayment` stores Pro Access Fee payment state separately from Core payment/payout flows.

Relevant enums:

- `ProProfileStatus`: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`
- `ProRequestStatus`: `OPEN`, `RESPONSES_RECEIVED`, `ACCESS_UNLOCKED`, `SITE_VISIT_INVITED`, `QUOTE_RECEIVED`, `CLOSED`, `CANCELLED`
- `ProAccessStatus`: `NOT_PAID`, `PAID`, `REFUNDED`, `CREDITED`
- `ProResponseStatus`: `SUBMITTED`, `WITHDRAWN`, `HIDDEN_BY_ADMIN`

### Matching and response eligibility

Found in `D:\Taskly\src\lib\taskly-pro.ts`:

- `getMatchingProRequestsForPro(userId)` returns active Pro requests only for approved Pro profiles whose approved category and selected city coverage match the request.
- Matching includes active request states: `OPEN`, `RESPONSES_RECEIVED`, `ACCESS_UNLOCKED`, `SITE_VISIT_INVITED`, and `QUOTE_RECEIVED`.
- `canProViewRequest(userId, proRequestId)` rejects missing profiles, non-approved profiles, inactive requests, unapproved categories, and uncovered cities.
- `canProRespondToRequest(userId, proRequestId)` builds on `canProViewRequest` and only allows respondable request states `OPEN` and `RESPONSES_RECEIVED`.
- Existing responses may be edited only when the existing response status is `SUBMITTED`. Non-submitted response states are blocked.

### Pro request creation

Found in `D:\Taskly\src\lib\pro-request-create.ts` and `D:\Taskly\src\app\api\mobile\customer\pro-requests\route.ts`:

- Customer Pro request creation validates authenticated customer access, category key, active city, district, title, description, timeline, and budget range.
- The backend creates requests with `status: OPEN` and `accessStatus: NOT_PAID`.
- Mobile creation rejects server-owned fields such as `customerId`, `status`, `accessStatus`, `responses`, `paymentStatus`, `stripePaymentIntentId`, images, provider/pro ids, and unlock state.

### Pro response submission/editing

Found in `D:\Taskly\src\app\dashboard\pro\requests\respond-actions.ts`:

- `submitStructuredProResponse(proRequestId, formData)` is the current structured web action.
- It requires authenticated web user context.
- It parses structured choices for response type, materials, estimate confidence, site visit policy, availability, included items, excluded items, duration, short note, and rough price range.
- Price range is required unless the response type is `NEEDS_SITE_VISIT` or `NEEDS_MORE_DETAILS`.
- It rejects invalid enum selections, partial price ranges, max less than min, contact leakage, missing response permission, non-respondable request states, and withdrawn existing responses.
- It upserts by `(proRequestId, proProfileId)`, setting response status to `SUBMITTED`.
- It updates the existing response or creates a new one; this means the future mobile contract should prefer an upsert route unless product requires explicit create/edit separation.
- A TODO notes that edits should be restricted later after Pro Access Fee unlock/payment is live.

Found in `D:\Taskly\src\app\pro\request-actions.ts`:

- `submitProResponse(proRequestId, formData)` is an older/simple response action.
- It validates required free-text fields, rough price range, site visit requirement, contact leakage, `canProRespondToRequest`, and request state.
- It creates or updates the Pro response and changes a request from `OPEN` to `RESPONSES_RECEIVED`.
- The mobile implementation should avoid duplicating this older path unless backend owners choose it as the shared helper.

### Structured response defaults

Found in `D:\Taskly\src\lib\pro-response-form.ts`:

- `parseStructuredProResponseDefaults(response)` converts existing stored response text fields back into structured form defaults.
- It currently maps structured values encoded in response text fields rather than a separate normalized response detail model.
- Mobile should not parse these encoded fields independently once mutations are implemented; the backend should expose mobile-safe defaults.

### Contact-leakage prevention

Found in `D:\Taskly\src\lib\pro-contact-guard.ts`:

- `hasProResponseContactLeakageInFields(fields)` blocks or flags emails, phone-like numbers, URLs, messaging/social handles, and direct contact instructions in English and Bulgarian.
- Both web response actions call this guard before saving.
- Mobile may show friendly validation errors, but backend validation must remain final.

### Pro Access Fee and customer visibility

Found in `D:\Taskly\src\lib\pro-access-payments.ts`:

- Pro Access Fee payment state is backend-owned and separate from Core payment/payout logic.
- `markProAccessPaidFromMetadata` validates Stripe metadata, customer ownership, and at least one submitted response by an approved Pro before marking access as paid.
- Mobile must not implement Pro Access Fee payment/unlock in this phase.

Found in `D:\Taskly\src\lib\mobile-customer-readonly.ts`:

- Customer mobile detail returns limited response previews before unlock.
- Before unlock, customer sees generic response availability, generic `Taskly Pro`, and locked rough quote wording.
- After unlock, customer sees response headline, Pro display/trade name, and rough quote label.
- Responses with `HIDDEN_BY_ADMIN` are excluded from customer mobile response previews.

### Admin/support inspection

Found in `D:\Taskly\src\app\admin\pro\*`:

- Admin has web-only views for Pro requests, Pro responses, access fees, profile/category approvals, and support queues.
- Admin can hide Pro responses by setting `HIDDEN_BY_ADMIN`.
- Admin surfaces are inspection/support context only for this phase; mobile should not add admin workflows.

## Existing Backend Mobile Routes Found

Provider read-only:

- `GET /api/mobile/provider/pro-requests`
- `GET /api/mobile/provider/pro-requests/[proRequestId]`

Customer read/create:

- `GET /api/mobile/customer/pro-requests`
- `POST /api/mobile/customer/pro-requests`
- `GET /api/mobile/customer/pro-requests/[proRequestId]`

No mobile Pro response write route exists yet.

## Current Mobile Pro Coverage

Found in `D:\Taskly-app`:

- `app/customer/pro-requests.tsx` and `app/customer/pro-requests/[proRequestId].tsx` are read-oriented customer Pro screens. They show response counts, locked/unlocked preview state, backend `nextActions`, and avoid private contact details.
- `app/provider/pro-requests.tsx` and `app/provider/pro-requests/[proRequestId].tsx` are read-only provider Pro screens. They show matching request summaries, eligibility text, backend `nextActions`, and `myResponse` summary if present.
- `src/lib/api/endpoints.ts` centralizes Pro request read paths and customer Pro request creation. It has no provider response mutation path.
- `src/lib/api/provider.ts` exposes only `getProviderProRequests` and `getProviderProRequestDetail` for Pro request mobile APIs.
- `src/lib/api/domain.ts` has `ProviderProRequestSummary`, `ProviderProRequestDetail`, and `ProviderProResponseSummary`, but no payload/response types for response submission or editing.
- `src/lib/api/mockApi.ts` demo mode returns read-only Pro request states and does not simulate Pro response mutation.
- `src/lib/i18n/en.ts` and `src/lib/i18n/bg.ts` contain Pro request posting/list wording, but no provider Pro response form wording yet.

## Missing Mobile API Gaps

Before mobile can submit or edit Provider Pro responses safely, backend mobile read models should expose:

- Explicit provider Pro response capabilities, not just a generic `nextAction`.
- `canSubmitResponse`, `canEditResponse`, and backend-authored blocked reason code/label.
- Profile gating detail for `PROFILE_PENDING`, `PROFILE_REJECTED`, `PROFILE_SUSPENDED`, `CATEGORY_NOT_APPROVED`, `CITY_NOT_COVERED`, and `REQUEST_NOT_AVAILABLE`.
- Existing response detail/defaults in a mobile-safe structured shape when editing is allowed.
- Whether an existing response is `SUBMITTED`, `WITHDRAWN`, or hidden/admin-blocked.
- Whether edits are blocked after Pro Access Fee unlock/payment, if backend product policy adds that gate.
- Field-level validation error shape for contact leakage, price range, invalid enum selections, and required fields.
- A refreshed provider Pro request detail response after mutation.

## Proposed Provider Pro Response Mutation Contract

Prefer one upsert route aligned with current web behavior:

`POST /api/mobile/provider/pro-requests/[proRequestId]/responses`

If product later requires separate edit semantics, add:

`PATCH /api/mobile/provider/pro-requests/[proRequestId]/responses/[responseId]`

The route must:

- Require mobile auth through the existing mobile auth session helper.
- Require Provider workspace access.
- Resolve provider identity server-side from the authenticated user.
- Require an existing `ProProfile`.
- Require `ProProfileStatus.APPROVED`.
- Require approved category match against `ProCategoryApprovalStatus.APPROVED`.
- Require city coverage match.
- Require request state `OPEN` or `RESPONSES_RECEIVED`.
- Use a shared backend helper/action equivalent to `canProRespondToRequest`.
- Enforce uniqueness by `(proRequestId, proProfileId)`.
- Use backend contact-leakage validation.
- Reject forbidden client-owned fields.
- Return a refreshed mobile provider Pro request detail with updated `nextActions`.
- Never trust client-provided profile id, provider id, request status, response status, approval status, access status, matching state, unlock state, customer id, admin status, or moderation outcome.

### Suggested request payload

Structured payload fields should adapt to the current backend/web model:

```ts
type ProviderProResponsePayload = {
  responseType: 'CAN_HANDLE' | 'NEEDS_SITE_VISIT' | 'NEEDS_MORE_DETAILS' | 'CAN_HANDLE_PART' | 'SUITABLE_FOR_TEAM';
  roughQuoteMin?: number | null;
  roughQuoteMax?: number | null;
  currency?: 'EUR';
  materialsIncluded: 'LABOR_ONLY' | 'LABOR_AND_MATERIALS' | 'PARTIAL_MATERIALS' | 'MATERIALS_NOT_INCLUDED' | 'NEEDS_CONFIRMATION';
  estimateConfidence?: 'ROUGH_ESTIMATE' | 'FAIR_FROM_DETAILS' | 'REQUIRES_SITE_VISIT';
  includedItems?: string[];
  excludedItems?: string[];
  availability: 'THIS_WEEK' | 'NEXT_WEEK' | 'TWO_TO_THREE_WEEKS' | 'THIS_MONTH' | 'DEPENDS_ON_PROJECT' | 'EVENINGS_WEEKENDS';
  earliestStartDate?: string | null;
  estimatedDuration?: string | null;
  siteVisitPolicy: 'NOT_NEEDED' | 'FREE_SITE_VISIT' | 'PAID_SITE_VISIT' | 'REQUIRED_BEFORE_FINAL_QUOTE' | 'DEPENDS';
  customerPreparationNotes?: string | null;
  assumptions?: string | null;
  shortMessage?: string | null;
};
```

The backend may continue to encode structured values into existing `ProResponse` text fields until a normalized schema migration is scoped. Mobile should send structured data and let backend map it.

### Required fields

- `responseType`
- `materialsIncluded`
- `availability`
- `siteVisitPolicy`
- A valid rough quote range unless backend rules waive price for `NEEDS_SITE_VISIT` or `NEEDS_MORE_DETAILS`.

### Optional fields

- `roughQuoteMin`
- `roughQuoteMax`
- `currency` as display metadata only if backend chooses to expose it; the current model has no ProResponse currency column.
- `estimateConfidence`
- `includedItems`
- `excludedItems`
- `earliestStartDate`
- `estimatedDuration`
- `customerPreparationNotes`
- `assumptions`
- `shortMessage`

### Forbidden client-owned fields

Reject any request containing:

- `id`
- `userId`
- `customerId`
- `providerId`
- `proProfileId`
- `proRequestId` outside the route parameter
- `status`
- `responseStatus`
- `canEdit`
- `isEligibleToRespond`
- `profileStatus`
- `categoryApprovalStatus`
- `cityCoverageStatus`
- `matchingState`
- `accessStatus`
- `unlockStatus`
- `paymentStatus`
- `stripePaymentIntentId`
- `adminStatus`
- `hiddenByAdmin`
- `createdAt`
- `updatedAt`
- `contactPhone`
- `contactEmail`
- `externalUrl`
- `socialHandle`

### Response shape

Return a refreshed provider detail shape, extending the existing mobile detail response:

```ts
type ProviderProResponseMutationResponse = {
  proRequest: ProviderProRequestDetail;
  responseState: {
    canSubmitResponse: boolean;
    canEditResponse: boolean;
    blockedReasonCode: string | null;
    blockedReasonLabel: string | null;
    submittedResponseId: string | null;
    status: 'none' | 'submitted' | 'withdrawn' | 'hidden_by_admin';
    statusLabel: string;
  };
  nextActions: DetailNextAction[];
};
```

If the backend keeps response state inside `proRequest`, the shape should still include the same fields in a stable nested object.

## Gating Rules

Block response submission/editing when:

- Mobile auth is missing or invalid.
- Provider workspace access is unavailable.
- Pro profile is missing.
- Pro profile is `DRAFT`, `PENDING_REVIEW`, `REJECTED`, or `SUSPENDED`.
- Matching category is not approved.
- Request city is not covered.
- Pro request is missing, closed, cancelled, expired/unavailable, or otherwise not respondable.
- Duplicate response is attempted and backend policy does not allow upsert.
- Existing response is `WITHDRAWN` or `HIDDEN_BY_ADMIN`.
- Contact leakage is detected.
- Payload includes forbidden server-owned fields.
- Payload has invalid enum values, invalid money range, partial money range, or missing required fields.

Backend should return concise error codes and mobile-friendly messages. Mobile should display these messages safely and avoid guessing the policy.

## Anti-Contact-Leakage Requirements

- Backend must block or sanitize phone numbers, emails, social handles, external links, and direct contact instructions before unlock/allowed contact flow.
- Mobile should provide helper text and may pre-warn, but backend remains final.
- Mobile must show backend field errors such as `contact_not_allowed` or `CONTACT_DETAILS_NOT_ALLOWED`.
- Customer mobile preview must not reveal contact details before unlock.
- Provider response copy should remind Pros that the customer compares responses inside Taskly first.

## Proposed Provider Mobile UI States

Provider Pro request detail should show:

- `Respond to Pro request` when backend says the Pro can respond.
- `Update response` when a submitted response is editable.
- A submitted response summary card after save, with rough quote range, response status, submitted date, and edit action only when backend allows editing.
- Blocked state with backend-authored reason:
  - profile pending
  - profile rejected/suspended
  - category not approved
  - city not covered
  - request no longer available
  - response hidden/withdrawn/not editable
- Structured form sections:
  - intent/response type
  - rough quote range
  - materials
  - what is included
  - what is not included
  - availability
  - site visit policy
  - assumptions/notes
- Use `Submit response` and `Update response`, not `Accept`.
- Rough quote should be presented as an estimate/range, not a final legal commitment.
- Keep Pro response actions visually separate from Core task actions.
- Use the Pro orange/gold accent lightly.

## Customer Preview/Unlock Impact

- Before Pro Access unlock, customer should see response count and safe limited preview only.
- Customer should not see Pro contact details, full profile/contact actions, external links, direct contact instructions, or full response detail before unlock.
- After unlock, customer comparison may show richer response/profile data only when backend read models allow it.
- Customer comparison/unlock UI remains out of scope for this phase.

## EN/BG Wording Guidance

| Meaning | EN | BG |
| --- | --- | --- |
| Respond to Pro request | Respond to Pro request | Отговори на Pro заявка |
| Submit response | Submit response | Изпрати отговор |
| Update response | Update response | Обнови отговор |
| Rough quote | Rough quote | Ориентировъчна оферта |
| Materials included | Materials included | Материалите са включени |
| What is included | What is included | Какво е включено |
| What is not included | What is not included | Какво не е включено |
| Site visit needed | Site visit needed | Нужен е оглед |
| Earliest availability | Earliest availability | Най-ранна възможност |
| Submitted success | Your response was submitted | Отговорът е изпратен |
| Request unavailable | This request is not available anymore | Заявката вече не е налична |
| Profile/category review | Your Pro profile/category is still under review | Pro профилът или категорията ти още се преглежда |
| Contact leakage | Please remove contact details before submitting | Премахни контактните данни преди изпращане |
| Customer comparison | Customer will compare your response after access is unlocked | Клиентът ще сравни отговора след отключване на достъпа |

Keep button text short. Avoid wording that implies Taskly performs the renovation/project. Use marketplace/intermediary wording such as independent Pros, approved Pros, and compare professionals.

## Non-Scope

- No Pro response mobile mutations/buttons/routes in this phase.
- No Pro Access Fee payment or unlock implementation.
- No customer Pro comparison/unlock UI implementation.
- No Pro chat unless an explicit backend/product model is later scoped.
- No Core payment, cancellation, support, refund, payout, commission, or dispute changes.
- No Stripe changes.
- No admin mobile routes or admin workflow changes.
- No Expo SDK upgrade, dependency changes, native library changes, or app config changes.

## Recommended Next Phase

Recommended Phase 27B: Provider Pro response read-only/nextActions state.

Reason: current mobile provider Pro detail exposes only `eligibility.isEligibleToRespond`, a generic reason label, a generic `nextAction`, and a small `myResponse` summary. It does not yet expose stable response capabilities, blocked reason codes, editable structured defaults, contact-leakage error shape, or edit policy. Adding this backend-authored read state first will make the later mutation phase safer and keep mobile from inventing Pro response eligibility.

After Phase 27B confirms sufficient read state, a later implementation phase can add the upsert mutation route and mobile form.
