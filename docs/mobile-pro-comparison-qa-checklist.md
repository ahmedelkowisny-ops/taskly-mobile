# Mobile Pro Comparison QA Checklist

Phase 28F verifies the Customer unlocked Pro comparison UI and backend read-only comparison data added in Phase 28E. This QA pass allows documentation and safe read-shape fixes only. It does not add Pro chat, site-visit invites, Pro Access refund/support mutations, payment changes, Stripe changes, admin workflow changes, Core logic changes, or Expo upgrades.

Use Expo SDK 54 documentation for mobile work because this project currently reports `sdkVersion 54.0.0`. Do not upgrade Expo SDK during feature phases unless the prompt explicitly scopes an Expo upgrade.

## Required Test Users And Accounts

- Customer with a locked Pro request.
- Customer with an unlocked Pro request.
- Approved matching Pro with a submitted response.
- Pending or rejected Pro profile with a response, if available.
- Hidden or admin-disabled Pro response scenario, if available.
- Optional non-owner customer for ownership checks.

## Backend And Mobile Prerequisites

- Backend is running with Phase 28E customer Pro detail read model available.
- Mobile app points to the backend through `EXPO_PUBLIC_TASKLY_API_BASE_URL`.
- Customer auth works through `AuthProvider` and token helpers.
- Customer Pro detail uses `GET /api/mobile/customer/pro-requests/[proRequestId]`.
- Mobile screens do not hardcode API URLs and do not call Prisma/database code.
- `unlockedComparison` is returned only when backend state allows full comparison.
- Comparison data is read-only and backend-shaped.
- Demo mode remains available.

## Locked Preview Checklist

- Locked customer request does not receive or render full `unlockedComparison` data.
- Limited response previews remain limited.
- Pro identity, rough quote, profile details, notes, assumptions, and preparation details remain hidden unless explicitly returned by backend preview fields.
- Unlock card uses backend-authored `proAccessState`, `proUnlockState`, `proAccessNextActions`, `comparisonState`, and `nextActions`.
- Unlock availability is not inferred from raw response count alone.
- No Pro chat appears.
- No site-visit invite action appears.
- No contact details appear.

## Unlocked Comparison Checklist

- Paid/unlocked customer request returns `unlockedComparison.canViewFullComparison = true`.
- `Compare approved Pros` appears only after backend says full comparison is viewable.
- Cards are readable on narrow mobile screens.
- Rough quote range displays from backend fields.
- Materials included/not included display correctly.
- Site visit policy displays as backend-provided display text.
- Availability and earliest start display correctly or show a friendly TBD state.
- Included notes, excluded notes, assumptions, and preparation notes are shown only when backend returns safe text.
- Profile summary, portfolio count, city summary, and category summary display safely.
- Empty comparison state shows a friendly message.
- No ranking, moderation, admin-only, Stripe, payout, or payment-internal fields appear.

## Visibility And Security Checklist

- Backend requires mobile auth.
- Backend requires Customer Workspace access.
- Backend requires customer ownership of the Pro request.
- Non-owner customer gets `NOT_FOUND`, `FORBIDDEN`, or another safe failure without comparison data.
- Unpaid customer cannot see full comparison.
- Paid/unlocked customer sees only backend-approved visible responses.
- Comparison state remains backend-authored.
- Manual refresh after Checkout reveals comparison only after backend state is paid/unlocked.

## Hidden/Admin-Disabled Response Checklist

- `HIDDEN_BY_ADMIN` responses are excluded from previews and comparison.
- Hidden/admin-disabled responses are not counted as meaningful visible comparison responses.
- Withdrawn responses are not included in mobile full comparison unless a future backend contract explicitly adds removed-response history.
- Responses from pending, rejected, suspended, or otherwise unapproved Pro profiles are excluded.
- Responses outside backend matching/availability rules are excluded where applicable.

## Contact-Leakage Checklist

- Backend read model does not select Pro internal phone/email fields.
- Backend read model does not select customer private contact details.
- Backend read model does not expose Stripe customer ids, payment intent ids, or payment method ids.
- Response text fields are protected by backend response validation and read-shape contact omission.
- Profile summary/name fields do not expose phone, email, URLs, social handles, or direct contact instructions.
- Mobile renders only returned fields and does not create contact links.
- `contactPolicyLabel` explains that contact details are shared only when allowed by Taskly.

## Demo-Mode Checklist

- Locked demo request shows limited preview only.
- Locked demo request has no full comparison payload.
- Unlocked demo request shows safe comparison cards.
- Demo unlock does not call backend payment routes.
- Demo mode does not call Stripe.
- Demo copy says no real payment was processed.
- Demo mode does not simulate refund, settlement, payout, or real money movement.
- Demo mode does not expose real contact details.

## i18n And Copy Checklist

- Copy uses `Pro Access`, `unlock and compare`, `approved Pros`, and `independent Pros`.
- Copy does not use `escrow`.
- Copy does not use public version labels.
- Copy does not imply Taskly performs the project or renovation.
- English strings are concise and mobile-friendly.
- Bulgarian strings are concise enough for buttons/cards.
- Use `payment protected` wording only for Core protected payment flows, not Pro Access comparison payment.

## Known Deferred Items

- Pro chat.
- Site visit invite flow.
- Pro Access refund/support route.
- Deep-link/store Checkout polish.
- Advanced ranking/sorting/filtering.
- Admin moderation enhancements.

## Phase 28F Notes

- Safe fix: locked backend and demo detail responses should omit `unlockedComparison` instead of returning a false comparison envelope.
- Safe fix: backend comparison text fields should omit values that match the existing Pro contact-leakage guard.
- No payment, Stripe, refund/support, Pro chat, site-visit invite, Core, provider response mutation, or admin workflow behavior should change in this phase.
