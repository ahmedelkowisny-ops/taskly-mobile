# Mobile Pro Provider Response QA Checklist

Phase 27D reviews the Provider Workspace Pro response read/write flow added in Phases 27B and 27C. This is a QA checklist and safe-fix phase only.

Use Expo SDK 54 documentation for mobile work because this project currently reports `sdkVersion 54.0.0`. Do not upgrade Expo SDK during feature phases unless the prompt explicitly scopes an Expo upgrade.

## Scope Guardrails

- Backend/web remains authoritative for Pro identity, approval, category, city coverage, request state, response editability, customer unlock, contact-leakage checks, and response visibility.
- Mobile must use backend APIs through the typed API client and centralized endpoints.
- Mobile must not call Prisma, store secrets, infer matching locally, expose contact details before the allowed flow, or implement Pro Access payment/unlock.
- Mobile must rely on `nextActions`, `proResponseCapabilities`, `proResponseBlockedReason`, `proResponseBlockedReasonCode`, `proResponseSummary`, and `responseEditDefaults` authored by the backend.
- Do not add Pro chat, customer comparison/unlock UI, admin workflow changes, Core logic changes, Stripe changes, or Expo upgrades in this QA phase.

## Required Test Users And Accounts

- Approved matching Pro: approved Pro profile, approved category matching the request, and city coverage matching the request city.
- Pending Pro: Pro profile in review, with Provider Workspace access if available.
- Rejected or non-approved Pro: rejected/suspended profile or provider without a valid approved Pro profile.
- Wrong city/category Pro: approved Pro profile whose city coverage or approved category does not match the request.
- Customer with Pro request: customer owns at least one open Pro request with images if available.
- Optional admin account for read-only inspection of hidden/admin-disabled responses; do not change admin workflows during this pass.

## Backend And Mobile Prerequisites

- Backend is running with mobile auth enabled.
- Mobile app can authenticate as the Provider Workspace users above or use demo mode where real accounts are unavailable.
- The customer Pro request is in a respondable state for the happy path: `OPEN` or `RESPONSES_RECEIVED`.
- At least one non-respondable request exists or can be inspected: `CLOSED`, `CANCELLED`, expired, or otherwise unavailable.
- Provider Pro request list and detail routes return Phase 27B fields:
  - `proResponseState`
  - `proResponseCapabilities`
  - `proResponseBlockedReason`
  - `proResponseBlockedReasonCode`
  - `proResponseSummary`
  - detail-only `responseEditDefaults`
  - `nextActions.canSubmitResponse`
  - `nextActions.canEditResponse`
  - `nextActions.canViewSubmittedResponse`
  - `nextActions.canOpenProResponseForm`

## Provider Pro Response Happy Path

- Sign in as the approved matching Pro.
- Open Provider Workspace, then Pro request list.
- Confirm the list shows a clean response badge such as `Can respond` when the backend allows response submission.
- Open the matching Pro request detail.
- Confirm the capability card shows backend response state and customer preview guidance.
- Confirm the response form can open only when:
  - `nextActions.canOpenProResponseForm` is true.
  - `nextActions.canSubmitResponse` or `nextActions.canEditResponse` is true.
- Submit a structured response with:
  - `shortMessage`
  - optional `roughQuoteMin`
  - optional `roughQuoteMax`
  - optional `currency`
  - optional `materialsIncluded`
  - optional `includedNotes`
  - optional `excludedNotes`
  - optional `availability`
  - optional `earliestStartDate`
  - optional `siteVisitPolicy`
  - optional `customerPreparationNotes`
  - optional `assumptions`
- Confirm submit shows a loading state and prevents repeated taps.
- Confirm success closes the form.
- Confirm the detail screen refreshes from the backend response, not local inference.
- Confirm the submitted response summary card appears with status, message preview, rough quote label, materials/site visit labels if present, and submitted date.
- Confirm the list badge remains consistent after navigating back or refreshing.

## Edit Response Checklist

- Sign in as the same approved matching Pro after a submitted response exists.
- Confirm the backend returns `canEditResponse` only when the response is editable.
- Confirm the detail screen labels the action as `Update response`, not `Accept`, `Reserve`, or task completion.
- Open the form.
- Confirm fields prefill from backend `responseEditDefaults`.
- Change a safe field such as `availability` or `includedNotes`.
- Submit the update.
- Confirm loading state, success notice, closed form, and refreshed response summary.
- Confirm duplicate response behavior follows the backend upsert route: the same provider/request pair updates one response rather than creating multiple visible responses.
- If backend blocks editing, confirm the form does not open and the backend-authored blocked reason is displayed.

## Blocked State Checklist

- Pending Pro is blocked and sees a concise profile-under-review reason.
- Rejected or non-approved Pro is blocked and does not see response form access.
- Approved Pro with a non-approved category is blocked with category reason.
- Approved Pro outside city coverage is blocked with city coverage reason.
- Closed/cancelled/expired/unavailable request is blocked with request unavailable reason.
- Provider without Pro identity is blocked and does not receive hidden customer or request details.
- Direct navigation to a non-matching request ID does not leak private details or enable response submission.
- Admin-hidden or non-editable response state is displayed only with provider-safe labels and does not expose customer-only or admin-only details.
- Backend route still rejects blocked submissions even if mobile UI is bypassed.

## Contact-Leakage Checklist

Submit or update attempts should be rejected by the backend when response text contains:

- Phone number.
- Email address.
- Social handle.
- External link.
- Direct contact instruction.

Expected result:

- Mobile displays a clear backend validation/contact-leakage error.
- The response is not saved.
- The customer preview remains unchanged.
- Mobile does not attempt final contact-leakage enforcement as the source of truth.

## Quote Validation Checklist

- Empty `shortMessage` is rejected on mobile and by backend.
- Too-short or whitespace-only message is rejected.
- Negative quote values are rejected.
- Non-numeric quote values are rejected.
- `roughQuoteMax` lower than `roughQuoteMin` is rejected.
- Optional quote range can be omitted if backend/product rules allow it.
- Currency is backend-controlled/defaulted where applicable and mobile does not calculate totals, fees, payment, access, ranking, payout, commission, or unlock state.

## Customer Preview Safety Checklist

- Before Pro Access unlock, customer Pro request detail shows limited previews only.
- Customer sees response count and safe preview text.
- Customer does not see full Pro profile/contact details before unlock.
- Customer does not see phone, email, external link, social handle, or direct contact instructions from responses.
- Admin-hidden responses are not exposed as customer-visible previews.
- Pro Access payment/unlock and full comparison UI remain out of scope for this phase.

## Demo-Mode Checklist

- Demo mode can open Provider Pro request list/detail without real backend mutation calls.
- Demo mode shows safe read-only response capability states.
- Demo mode simulates Pro response submit/edit locally.
- Demo submit/edit updates the local response summary and edit defaults.
- Demo mode does not call `POST /api/mobile/provider/pro-requests/[proRequestId]/response`.
- Demo mode does not simulate Pro Access payment/unlock.
- Demo mode does not expose customer contact details or Pro unlock-protected information.

## Security And Forbidden Client Field Checks

Route under test:

- `POST /api/mobile/provider/pro-requests/[proRequestId]/response`

Mobile wrapper under test:

- `submitOrUpdateProviderProResponse(proRequestId, payload, authToken)`

The wrapper must only send:

- `shortMessage`
- `roughQuoteMin`
- `roughQuoteMax`
- `currency`
- `materialsIncluded`
- `includedNotes`
- `excludedNotes`
- `availability`
- `earliestStartDate`
- `siteVisitPolicy`
- `customerPreparationNotes`
- `assumptions`

Backend route/action must reject or ignore forbidden client-owned fields, including:

- `providerId`
- `proProfileId`
- `userId`
- `customerId`
- request status or lifecycle fields
- response status
- visibility fields
- unlock/access/payment fields
- hidden/admin moderation fields
- ranking/scoring fields
- contact-leakage result fields
- customer or provider contact details

Backend route/action checks:

- Requires mobile auth.
- Requires Provider Workspace access.
- Requires valid Pro identity.
- Uses `canProRespondToRequest`.
- Enforces Pro approval, category approval, city coverage, request state, and response editability gates.
- Validates JSON body.
- Validates `shortMessage`.
- Validates rough quote values and range.
- Applies backend contact-leakage guard.
- Returns refreshed provider Pro request detail with Phase 27B response state fields.

## I18n And Copy Checks

- No `escrow`.
- No `V1` or public version labels.
- No `Accept` or `Reserve` wording for Pro responses.
- Use `Submit response` and `Update response`.
- Copy does not imply Taskly performs the renovation/project.
- Marketplace wording uses independent Pros, approved Pros, and compare professionals where explanatory text is needed.
- Customer preview copy preserves that the customer sees a limited preview before access is unlocked.
- English and Bulgarian strings are concise and fit mobile layouts.
- Provider Pro detail labels are localized, including loading, budget, timeline, created, submitted, images, and next steps.

## Known Deferred Items

- Pro Access payment/unlock.
- Customer comparison/unlock UI.
- Pro chat.
- Admin moderation enhancements.
- Product decision on restricting edits after Pro Access unlock/payment.
