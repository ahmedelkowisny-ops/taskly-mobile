# Mobile Pro Site Visit QA Checklist

Phase 29D verifies the Pro site visit invite and response flow after the read-only state and mutation phases. This checklist is for QA and safe fixes only. Do not add Pro chat, payment/refund/support routes, Stripe changes, Core logic changes, admin workflow changes, or Expo upgrades.

## Required Test Users And Accounts

- Customer with an unlocked Pro request and Pro Access paid/credited/unlocked by backend state.
- Approved matching Pro with a submitted structured response visible after unlock.
- Provider account receiving the site visit invite for that approved Pro profile.
- Optional non-owner customer to verify access denial for another customer's Pro request.
- Optional second approved Pro to verify no cross-Pro invite/contact leakage.
- Optional pending/rejected Pro profile to verify no invite target or provider action is available.

## Backend And Mobile Prerequisites

- Backend is running with the Phase 29C mobile site visit routes.
- Mobile app points at the backend through `src/lib/api/client.ts` and centralized endpoints.
- Test Pro request has at least one submitted response from an approved matching Pro profile.
- Pro Access unlock is completed by backend-owned state before testing invite actions.
- Contact-leakage guard is enabled for Pro/site visit free-text fields.
- Demo mode remains available for local simulations without backend mutation calls.

## Customer Invite Happy Path

- Open Customer Pro request detail for an unlocked request.
- Confirm limited preview remains limited before unlock in a separate locked test case.
- Confirm unlocked comparison cards show only backend-visible approved Pro responses.
- Confirm `Invite for site visit` appears only when `siteVisitNextActions.canInviteForSiteVisit` is true.
- Confirm the invite form sends only `proResponseId`, `preferredDate`, `preferredTimeWindow`, `message`, `accessNotes`, and safe confirmation data.
- Confirm the form does not send `customerId`, `providerId`, `proProfileId`, unlock/access state, visibility state, contact/address state, admin fields, payment fields, ranking, or scoring fields.
- Confirm the confirmation copy says the site visit is not a final work agreement.
- Confirm the confirmation copy says independent Pros are responsible for their own quotes and work.
- Confirm contact/address sharing copy is based on backend-returned visibility state.
- Submit a valid invite and verify loading, success, and backend validation error states.
- Confirm the response refreshes the customer detail with updated `siteVisitState`, `siteVisitInvites`, `siteVisitNextActions`, `contactVisibilityState`, `addressVisibilityState`, and `allowedContactFields`.
- Confirm duplicate active invites for the same Pro are blocked by backend validation.

## Customer Cancel Checklist

- Confirm cancel appears only when `siteVisitNextActions.canCancelSiteVisitInvite` is true.
- Cancel a pending or alternate-time invite when backend allows it.
- Confirm the route requires customer auth and request ownership.
- Confirm the invite must belong to the customer's Pro request.
- Confirm cancellation updates status and preserves the invite record for audit history.
- Confirm cancellation does not expose new contact/address details.
- Confirm backend validation errors render clearly.
- Confirm forbidden client fields are rejected if submitted.

## Provider Accept Checklist

- Open Provider Pro request detail as the provider connected to the invite.
- Confirm the site visit action card appears only when the backend returns a relevant invite.
- Confirm `Accept site visit` appears only when `siteVisitNextActions.canAcceptSiteVisit` is true.
- Accept the invite and verify loading, success, and backend validation error states.
- Confirm the route requires provider auth, Provider Workspace access, approved Pro profile ownership, submitted response relationship, and invite/request relationship.
- Confirm the refreshed provider detail shows accepted state.
- Confirm exact address/access notes appear only after backend read model allows accepted/completed site visit visibility.
- Confirm phone/email are not shown unless a future backend policy explicitly returns them.

## Provider Decline Checklist

- Confirm `Decline` appears only when `siteVisitNextActions.canDeclineSiteVisit` is true.
- Submit decline with optional reason/message according to backend validation.
- Confirm free-text fields pass contact-leakage guard.
- Confirm declined state is returned in refreshed provider detail.
- Confirm declining does not expose customer contact/address details.
- Confirm backend validation errors render clearly.

## Provider Propose-Time Checklist

- Confirm `Propose another time` appears only when `siteVisitNextActions.canProposeSiteVisitTime` is true.
- Confirm proposed time window is required.
- Confirm proposed date, proposed time window, and message are the only provider-owned payload fields sent.
- Confirm free-text fields pass contact-leakage guard.
- Confirm the refreshed provider detail maps the invite to `alternate_time_proposed` when backend uses `INVITED` plus `proposedAt`.
- Confirm proposal does not expose new contact/address details.

## Contact And Address Visibility Checklist

- Confirm no phone/email sharing was added.
- Confirm exact address/access notes are hidden before backend-allowed accepted/completed site visit state.
- Confirm mobile does not infer or construct address/contact details from city, area, invite status, Pro Access state, or local UI.
- Confirm `allowedContactFields`, `contactVisibilityState`, and `addressVisibilityState` are backend-authored and rendered passively.
- Confirm hidden/admin-only fields are not returned to customer/provider mobile detail responses.
- Confirm customer sees only their own safe message/access-note previews.
- Confirm provider sees access notes/address only for the provider relationship and only when allowed by backend read model.
- Confirm a second Pro cannot see another Pro's invite or address/contact details.

## Blocked-State Checklist

- Locked customer cannot see or submit full invite actions.
- Non-owner customer cannot access or mutate another customer's site visit invite.
- Pending/rejected Pro profile cannot receive provider actions.
- Provider without the connected Pro response cannot accept, decline, or propose time.
- Closed/cancelled Pro requests block invite and provider response mutations.
- Duplicate active invite to the same Pro is blocked.
- Backend blocked reasons and blocked reason codes are shown without mobile inventing eligibility.

## Security And Forbidden Client Field Checks

- Customer invite rejects `customerId`, `providerId`, `proProfileId`, `unlockStatus`, `accessStatus`, `responseVisibility`, `contactVisibilityState`, `addressVisibilityState`, `adminStatus`, `paymentStatus`, `ranking`, `score`, and status overrides.
- Customer cancel rejects status overrides, provider/payment/access/contact/address/admin fields.
- Provider actions reject `customerId`, customer contact/address fields, unlock/access state, payment fields, contact/address visibility state, admin/moderation fields, and status overrides.
- Route handlers require mobile auth before helper execution.
- Customer routes require Customer workspace access.
- Provider routes require Provider workspace access.
- Backend validates relationship and state again even when mobile hides actions.
- Free-text invite, cancel, decline, accept message, and propose-time fields are checked by contact-leakage guard.

## Demo-Mode Checklist

- Customer invite is simulated locally in demo mode.
- Customer cancel is simulated locally in demo mode.
- Provider accept is simulated locally in demo mode.
- Provider decline is simulated locally in demo mode.
- Provider propose-time is simulated locally in demo mode.
- Demo mode does not call backend mutation routes.
- Demo mode does not expose real phone, email, exact address, or real access details.
- Demo copy does not imply real booking, payment, deposit, or final work agreement.

## i18n And Copy Checklist

- No `escrow` wording.
- No public version labels.
- No `Accept job`, `Reserve`, or `Hire now` wording.
- Use `site visit`, `invite for site visit`, `approved Pros`, and `independent Pros`.
- Copy does not imply Taskly performs the renovation/project.
- English strings are concise and mobile-friendly.
- Bulgarian strings are concise enough for buttons and cards.
- Longer Bulgarian explanations are body text, not button labels.

## Known Deferred Items

- Notifications.
- Pro chat.
- Pro Access refund/support route.
- Advanced phone/email contact sharing.
- Admin workflow enhancements.

## Phase 29D QA Notes

- Backend routes and helpers were inspected for auth, workspace access, ownership, response/profile relationship checks, unavailable request blocking, duplicate active invite prevention, forbidden client-owned fields, contact-leakage checks, and detail refresh behavior.
- Customer and Provider mobile wrappers were inspected for safe payload shaping through centralized endpoints.
- Customer and Provider detail screens were inspected for backend-authored next-action gating, loading/error/success states, and safe copy.
- Demo behavior was inspected for local-only invite/cancel/accept/decline/propose simulation.
- The existing contract document Bulgarian cancel-invite wording was adjusted to a clearer concise label.
- Alternate-time remains represented by backend `INVITED` plus `proposedAt`; a dedicated customer response-to-proposed-time flow is deferred.
