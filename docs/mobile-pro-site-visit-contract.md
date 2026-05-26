# Mobile Pro Site Visit Contract

Phase 29A documents the safe future mobile contract for inviting an approved Pro to a site visit after Pro Access unlock. This is a contract review only. Do not implement site visit invite routes, provider site visit actions, Pro chat, refund/support routes, payment changes, Stripe changes, Core logic changes, or Expo upgrades in this phase.

## Existing Backend/Web Site Visit And Contact Logic Found

- `ProRequestStatus` already includes `SITE_VISIT_INVITED`.
- `ProSiteVisitInvite` exists in Prisma with `proRequestId`, `proProfileId`, `customerId`, `status`, `proposedAt`, `scheduledAt`, `notes`, and timestamps.
- `ProSiteVisitStatus` currently supports `INVITED`, `ACCEPTED`, `DECLINED`, `CANCELLED`, and `COMPLETED`.
- `ProRequest` has `siteVisitInvites` and `internalAddressProtected`.
- Mobile Pro request creation can store `locationAddress`, map pin, and internal location notes through backend-owned `internalAddressProtected`.
- `ProProfile.siteVisitPreference` stores a profile-level site visit preference.
- `ProResponse.siteVisitRequirement` stores response-level site visit policy.
- Customer web Pro profile has disabled Chat and Invite for site visit controls. The invite action is not wired.
- Admin Pro request detail can inspect customer phone, protected address, site visit invites, final quotes, access payments, and Pro responses.
- Backend contact-leakage guard exists for Pro response free-text fields and blocks phone/email/social/external-link style content before an allowed flow.
- No implemented customer site visit invite mutation was found.
- No implemented provider accept, decline, or propose alternate time mutation was found.
- No mobile site visit notification, audit event, support review, or admin workflow mutation was found.

## Existing Routes, Actions, Helpers, And Models Found

- Model: `ProSiteVisitInvite`
- Enum: `ProSiteVisitStatus`
- Enum status: `ProRequestStatus.SITE_VISIT_INVITED`
- Request create helper: `createProRequestRecord`
- Pro matching/view helper: `canProViewRequest`
- Pro response helper: `canProRespondToRequest`
- Customer unlock helper: `canCustomerViewUnlockedProResponses`
- Contact guard: `hasProResponseContactLeakage` and `hasProResponseContactLeakageInFields`
- Customer mobile Pro routes:
  - `GET /api/mobile/customer/pro-requests`
  - `POST /api/mobile/customer/pro-requests`
  - `GET /api/mobile/customer/pro-requests/[proRequestId]`
  - `POST /api/mobile/customer/pro-requests/[proRequestId]/access/checkout`
  - `POST /api/mobile/customer/pro-requests/[proRequestId]/images`
- Provider mobile Pro routes:
  - `GET /api/mobile/provider/pro-requests`
  - `GET /api/mobile/provider/pro-requests/[proRequestId]`
  - `POST /api/mobile/provider/pro-requests/[proRequestId]/response`
- Web reference only:
  - Customer Pro profile page shows a disabled invite CTA after unlock.
  - Admin Pro request detail displays invite records read-only.

## Current Mobile Site Visit And Contact Coverage

- Customer Pro detail shows limited response previews before Pro Access unlock.
- Customer Pro detail shows backend-returned `unlockedComparison` after Pro Access unlock.
- The unlocked comparison can display safe response/profile fields, including response-level site visit policy.
- Provider Pro detail can display and submit/edit response-level `siteVisitPolicy`.
- Mobile API endpoints do not include site visit invite routes.
- Mobile API domain types do not include `siteVisitState`, `siteVisitInvites`, `siteVisitNextActions`, `contactVisibilityState`, `addressVisibilityState`, or `allowedContactFields`.
- Customer mobile does not receive exact address/contact details through Pro comparison data.
- Provider mobile does not receive customer exact address/contact details in Pro request detail.
- Demo mode has no site visit invite behavior and no real contact data.

## Missing Mobile API Gaps

- Customer read-only site visit state on Pro request detail.
- Provider read-only site visit state on Pro request detail.
- Backend-authored `canInviteForSiteVisit`.
- Backend-authored `canCancelSiteVisitInvite`.
- Backend-authored `canAcceptSiteVisit`.
- Backend-authored `canDeclineSiteVisit`.
- Backend-authored `canProposeSiteVisitTime`.
- Blocked reason and blocked reason code for site visit actions.
- Duplicate active invite handling per Pro request and Pro profile.
- Customer invite creation route.
- Customer invite cancellation route.
- Provider accept route.
- Provider decline route.
- Provider propose alternate time route.
- Explicit contact/address visibility state.
- Explicit allowed contact fields returned only after backend policy allows sharing.
- Contact-leakage policy for invite messages and provider response messages.
- Notification/audit/support hooks for invite lifecycle changes.
- Product decision for alternate time status, because the current enum has no dedicated `PROPOSED_TIME` status.

## Proposed Read-Only Site Visit And Contact State Fields

Add read-only fields before wiring mutations, so mobile can render backend-authored state without deciding eligibility.

```ts
type MobileSiteVisitStatus =
  | 'none'
  | 'invite_available'
  | 'invited'
  | 'accepted'
  | 'declined'
  | 'alternate_time_proposed'
  | 'cancelled'
  | 'completed'
  | 'blocked'
  | 'unknown';

type MobileAllowedContactField =
  | 'customer_address'
  | 'customer_phone'
  | 'customer_access_notes'
  | 'pro_phone'
  | 'pro_email';

type MobileSiteVisitState = {
  status: MobileSiteVisitStatus;
  statusLabel: string;
  helperText: string;
  activeInviteCount: number;
  blockedReason: string | null;
  blockedReasonCode: string | null;
};

type MobileSiteVisitInviteSummary = {
  id: string;
  proRequestId: string;
  proResponseId: string | null;
  proProfileId: string;
  proDisplayName: string;
  status: MobileSiteVisitStatus;
  statusLabel: string;
  preferredDate: string | null;
  preferredTimeWindow: string | null;
  scheduledAt: string | null;
  proposedAt: string | null;
  messagePreview: string | null;
  accessNotesPreview: string | null;
  createdAt: string;
  updatedAt: string;
};

type MobileSiteVisitNextActions = {
  canInviteForSiteVisit: boolean;
  canCancelSiteVisitInvite: boolean;
  canAcceptSiteVisit: boolean;
  canDeclineSiteVisit: boolean;
  canProposeSiteVisitTime: boolean;
  blockedReason: string | null;
  blockedReasonCode: string | null;
};

type MobileContactVisibilityState = {
  state: 'hidden' | 'site_visit_pending' | 'site_visit_shared' | 'not_available';
  stateLabel: string;
  helperText: string;
  allowedContactFields: MobileAllowedContactField[];
};

type MobileAddressVisibilityState = {
  state: 'hidden' | 'confirmation_required' | 'shared_for_site_visit' | 'not_available';
  stateLabel: string;
  helperText: string;
  addressLabel: string | null;
  accessNotesLabel: string | null;
};
```

Customer detail should attach these fields at request level and, where useful, per visible comparison response. Provider detail should expose only invites addressed to the authenticated provider's approved Pro profile.

## Proposed Future Customer Site Visit Invite Routes

### `POST /api/mobile/customer/pro-requests/[proRequestId]/site-visits`

- Auth: mobile authenticated customer.
- Ownership: authenticated customer must own the Pro request.
- Pro Access: request must be paid or credited, using backend unlock state.
- Relationship: invite should target a submitted visible response from an approved Pro profile. Prefer `proResponseId` in the payload so backend can derive the Pro profile and verify visibility.
- Request status: allowed only for active Pro request states selected by backend, likely `ACCESS_UNLOCKED` and `SITE_VISIT_INVITED`. Do not allow closed or cancelled requests.
- Required payload fields:
  - `proResponseId`
  - `preferredDate`
  - `preferredTimeWindow`
  - `addressConfirmation` or `selectedAddressId` if a saved address model is used later
- Optional payload fields:
  - `message`
  - `accessNotes`
  - `phoneVisibilityConsent`
- Backend helper/action:
  - Add a dedicated helper such as `createCustomerProSiteVisitInvite`.
  - Reuse customer ownership, Pro Access unlock, response visibility, approved Pro profile, and contact guard helpers.
- Response returned to mobile:
  - Refreshed `CustomerProRequestDetailResponse`, including `siteVisitState`, `siteVisitInvites`, `siteVisitNextActions`, `contactVisibilityState`, and `addressVisibilityState`.
- Customer-facing impact:
  - Invite is sent to the selected independent Pro for a site visit only.
  - Confirmation must explain what address/contact details will be shared.
- Provider-facing impact:
  - Provider sees a site visit invitation only if addressed to their Pro profile.
- Admin/support impact:
  - Admin/support can inspect invite status, selected Pro, timestamps, and any moderation/contact leakage flags.
- Contact/address implication:
  - Backend decides whether address, access notes, or phone are shared. Mobile must only render returned allowed fields.

### `PATCH /api/mobile/customer/pro-requests/[proRequestId]/site-visits/[siteVisitId]/cancel`

- Auth: mobile authenticated customer.
- Ownership: authenticated customer must own the Pro request and invite.
- Allowed statuses: backend should decide, likely only `INVITED` and `alternate_time_proposed` equivalent states.
- Required payload fields:
  - none, unless backend requires a cancellation confirmation.
- Optional payload fields:
  - `reason`
- Backend helper/action:
  - Add a dedicated helper such as `cancelCustomerProSiteVisitInvite`.
- Response returned to mobile:
  - Refreshed customer Pro detail or a site visit action result with updated read-only state.
- Contact/address implication:
  - Cancellation must not reveal new contact/address fields.

## Proposed Future Provider Site Visit Response Routes

### `POST /api/mobile/provider/pro-requests/[proRequestId]/site-visits/[siteVisitId]/accept`

- Auth: mobile authenticated provider.
- Relationship: invite must belong to the authenticated provider's approved Pro profile.
- Required response relationship: provider should have a submitted response for the same Pro request, unless backend product policy explicitly allows a different relationship.
- Request status: active only. Do not allow closed or cancelled requests.
- Required payload fields:
  - none.
- Optional payload fields:
  - `message`
- Backend helper/action:
  - Add `acceptProviderProSiteVisitInvite`.
- Response returned to mobile:
  - Refreshed `ProviderProRequestDetailResponse`, including site visit read-only state and next actions.
- Provider-facing impact:
  - Accepting confirms the site visit invitation, not the renovation job or final work agreement.
- Contact/address implication:
  - Backend may return allowed address/contact fields only after acceptance if product policy allows it.

### `POST /api/mobile/provider/pro-requests/[proRequestId]/site-visits/[siteVisitId]/decline`

- Auth: mobile authenticated provider.
- Relationship: invite must belong to the authenticated provider's approved Pro profile.
- Required payload fields:
  - none.
- Optional payload fields:
  - `reason`
  - `message`
- Backend helper/action:
  - Add `declineProviderProSiteVisitInvite`.
- Response returned to mobile:
  - Refreshed provider Pro detail or updated site visit action result.
- Contact/address implication:
  - Declining must not reveal new contact/address fields.

### `POST /api/mobile/provider/pro-requests/[proRequestId]/site-visits/[siteVisitId]/propose-time`

- Auth: mobile authenticated provider.
- Relationship: invite must belong to the authenticated provider's approved Pro profile.
- Required payload fields:
  - `proposedDate`
  - `proposedTimeWindow`
- Optional payload fields:
  - `message`
- Backend helper/action:
  - Add `proposeProviderProSiteVisitTime`.
- Response returned to mobile:
  - Refreshed provider Pro detail or updated site visit action result.
- Product note:
  - Current enum has no dedicated proposed-time status. Backend should either add one in a dedicated phase or represent the proposal with `proposedAt` plus an explicit mobile read-state field.
- Contact/address implication:
  - Proposing another time must not reveal new contact/address fields unless backend policy explicitly returns them.

## Payload Contracts

Suggested customer invite payload:

```ts
type CustomerCreateSiteVisitInvitePayload = {
  proResponseId: string;
  preferredDate: string;
  preferredTimeWindow: string;
  message?: string;
  addressConfirmation?: {
    useProtectedRequestAddress: boolean;
    confirmed: boolean;
  };
  selectedAddressId?: string;
  accessNotes?: string;
  phoneVisibilityConsent?: boolean;
};
```

Suggested customer cancel payload:

```ts
type CustomerCancelSiteVisitInvitePayload = {
  reason?: string;
};
```

Suggested provider decline payload:

```ts
type ProviderDeclineSiteVisitPayload = {
  reason?: string;
  message?: string;
};
```

Suggested provider propose-time payload:

```ts
type ProviderProposeSiteVisitTimePayload = {
  proposedDate: string;
  proposedTimeWindow: string;
  message?: string;
};
```

## Forbidden Client-Owned Fields

Customer site visit payloads must not accept:

- `customerId`
- `providerId`
- `proProfileId` when backend can derive it from `proResponseId`
- `unlockStatus`
- `accessStatus`
- `responseVisibility`
- `contactVisibilityState`
- `addressVisibilityState`
- `adminStatus`
- `moderationStatus`
- `paymentStatus`
- `ranking`
- `score`

Provider site visit payloads must not accept:

- `customerId`
- `customerPhone`
- `customerEmail`
- `customerAddress`
- `accessStatus`
- `unlockStatus`
- `paymentStatus`
- `adminStatus`
- `moderationStatus`
- `status`

## Contact And Address Visibility Rules

- Exact address and direct contact details are backend-controlled.
- Mobile must never infer address/contact visibility from Pro Access, request status, or invite status alone.
- Mobile must render only `allowedContactFields` and explicit contact/address values returned by the backend.
- Customer must see a confirmation step before sending any invite that shares address, access notes, or phone.
- Provider must understand that accepting a site visit is not accepting the renovation job.
- Contact-leakage guard should still block phone/email/social/external-link content in free-text messages unless the flow explicitly allows those fields.
- If phone/address sharing is allowed after invite or acceptance, backend must return those fields explicitly and only to the correct customer/Pro relationship.
- Admin/support views may inspect protected contact/address data, but mobile customer/provider read models should stay minimal and role-specific.

## Customer Mobile UX Guidance

- Show Invite for site visit only after Pro Access is unlocked and only for visible approved Pro responses.
- Treat Invite for site visit as a secondary CTA inside comparison cards.
- Do not use Hire now, Book now, Reserve, or Accept job wording.
- Show a confirmation screen before sharing address/contact details.
- Show site visit statuses:
  - invite sent
  - accepted
  - declined
  - alternate time proposed
  - cancelled
  - completed, if backend supports it
- Do not add payment, deposit, protected payment, refund, or support language to the invite flow.
- Do not imply Taskly is responsible for the renovation work or its outcome.
- Empty states should say that site visit invites will appear after the customer chooses an approved Pro.

## Provider Mobile UX Guidance

- Provider should see site visit invitations in Provider Pro request detail or a future Work area only when backend returns them.
- Provider can accept, decline, or propose another time only when backend `siteVisitNextActions` allows it.
- Provider should see customer-safe project context and location/contact details only when backend returns them.
- Use action wording:
  - Accept site visit
  - Decline
  - Propose another time
- Do not use Accept job, Reserve, or Hire wording.
- The provider UI should state that the site visit is for inspection/quote discussion only, not a final work agreement.

## EN/BG Wording Guidance

| Meaning | EN | BG |
| --- | --- | --- |
| Invite for site visit | Invite for site visit | Покани за оглед |
| Site visit | Site visit | Оглед |
| Preferred time | Preferred time | Предпочитан час |
| Access notes | Access notes | Бележки за достъп |
| Share address for site visit | Share address for site visit | Сподели адрес за оглед |
| Invite sent | Invite sent | Поканата е изпратена |
| Site visit accepted | Site visit accepted | Огледът е приет |
| Site visit declined | Site visit declined | Огледът е отказан |
| Pro proposed another time | Pro proposed another time | Pro предложи друг час |
| Cancel invite | Cancel invite | Откажи поканата |
| This is only a site visit, not a final work agreement | This is only a site visit, not a final work agreement | Това е само оглед, не финална уговорка |
| Independent Pros are responsible for their own quotes and work | Independent Pros are responsible for their own quotes and work | Независимите Pro отговарят за офертите и работата си |
| Contact details are shared only when allowed by Taskly | Contact details are shared only when allowed by Taskly | Контакти се споделят само когато Taskly го позволи |
| Accept site visit | Accept site visit | Приеми оглед |
| Propose another time | Propose another time | Предложи друг час |
| Decline | Decline | Откажи |

Bulgarian button labels should stay short. Longer explanatory copy belongs in body text or confirmation screens.

## Non-Scope

- Implementing customer site visit invite routes.
- Implementing provider accept, decline, or propose-time routes.
- Implementing site visit UI mutations.
- Implementing Pro chat.
- Implementing Pro Access refund/support routes.
- Changing Pro Access payment or Stripe logic.
- Changing provider Pro response mutation logic.
- Changing Core payment, cancellation, support, lifecycle, payout, commission, or dispute logic.
- Changing admin workflows.
- Exposing new contact/address fields.
- Adding Expo upgrades.

## Recommended Next Phase

Recommended Phase 29B: Pro site visit read-only state.

Rationale:

- The database model and admin inspection already exist, but customer/provider mobile read models do not expose invite state, contact/address visibility state, or site visit next actions.
- Read-only state lets mobile display existing backend-authored site visit records safely before adding mutations.
- It also gives backend a place to settle alternate-time representation and contact/address visibility semantics before any invite action can share sensitive data.

Only after read-only state is stable should a later phase implement customer invite and provider response mutations.
