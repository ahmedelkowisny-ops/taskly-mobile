# Taskly Mobile API Integration Plan

## A) Overview

Taskly mobile is one public app with two role-based workspaces:

- Customer Workspace under `/customer/*`
- Provider Workspace under `/provider/*`

The Provider Workspace supports Core Taskers, Taskly Pro professionals, and dual providers who can use both modes. Core Tasks and Pro Requests must remain visually and functionally separated in mobile.

The backend remains the source of truth for users, roles, workspace access, task state, Pro request state, payments, cancellations, disputes, matching, Pro unlock gating, refunds, and support decisions. Mobile should render backend state and submit user intent through stable API routes.

## B) Integration Principles

- Mobile never accesses the database directly.
- Mobile calls stable backend API routes only.
- Payment, cancellation, dispute, matching, role checks, Pro unlock gating, and refunds remain server-authoritative.
- Mobile can display next actions returned by the backend, but must not calculate sensitive eligibility alone.
- Mobile should use typed API clients with typed request and response payloads.
- Every API-connected screen must support loading, empty, error, and unauthorized states.
- Mobile should refresh session and relevant screen data when the app returns to foreground.
- Mobile should refresh after important mutations such as task posting, task cancellation, completion actions, Pro response submission, unlock attempts, and notification preference changes.
- API responses should include user-safe labels or next-action metadata when business logic is sensitive.
- Mobile mocks should remain available until the corresponding API contract is implemented and verified.

## C) Auth/Session Plan

Detailed auth audit and recommendations live in [`docs/mobile-auth-session-plan.md`](./mobile-auth-session-plan.md).

Phase 8 adds the first backend mobile auth endpoint, `GET /api/mobile/auth/session`, plus a mobile wrapper at `src/lib/api/auth.ts`. This endpoint validates the existing web `taskly_session` cookie server-side and returns the mobile-safe `UserSession` shape. Screens are still mock-driven until the AuthProvider/session shell phase.

Mobile needs API support for:

- Login
- Logout
- Session refresh
- Current user
- Workspace permissions
- Role/capability summary
- Language preference

Likely mobile session response shape:

```ts
{
  user: {
    id: string;
    displayName: string;
    email: string;
    preferredLocale: 'en' | 'bg';
  };
  workspaceAccess: {
    customer: boolean;
    provider: boolean;
  };
  providerCapabilities: {
    coreTaskerStatus: 'none' | 'applicant' | 'approved' | 'needsStripe';
    proStatus: 'none' | 'draft' | 'pending' | 'approved';
  };
  permissions: {
    canPostTask: boolean;
    canPostProRequest: boolean;
    canViewCoreTasks: boolean;
    canViewProRequests: boolean;
  };
  nextAction: {
    type: string;
    label: string | null;
    href: string | null;
  };
}
```

Mobile should eventually replace `src/lib/auth/mockAuth.ts` with session data from this API, while keeping helpers such as `canAccessCustomerWorkspace`, `canAccessProviderWorkspace`, and provider next-action display logic driven by backend-safe fields.

Auth/session integration should happen before customer/provider data APIs. The backend must provide `workspaceAccess` and `providerCapabilities` so mobile can route and render workspaces without duplicating role logic.

## D) Customer API Map

### Customer home summary

- Purpose: Populate Customer Home with active task count, active Pro requests, unread messages, and safe next actions.
- Screens: `/customer/home`
- Sensitive backend rules: Next actions, payment labels, unlock eligibility, and support prompts must be backend-provided.
- Suggested response shape: `{ activeTasksCount, activeProRequestsCount, unreadMessagesCount, nextActions[] }`

### My Core tasks list

- Purpose: List customer Core tasks and high-level statuses.
- Screens: `/customer/tasks`, `/customer/home`
- Sensitive backend rules: Matching, cancellation availability, payment state, dispute state, and completion state are backend-owned.
- Suggested response shape: `{ tasks: TaskSummary[], emptyState, nextActions[] }`

### Core task detail

- Purpose: Show a single task with provider status, timeline, payment state, and available actions.
- Screens: future `/customer/tasks/[id]`
- Sensitive backend rules: Completion, cancellation, refund/help eligibility, payment protection label, and provider visibility are backend-owned.
- Suggested response shape: `{ task: TaskDetail, paymentState, timeline[], availableActions[] }`

### Post Core task

- Purpose: Submit a new small fixed-scope task.
- Screens: `/customer/onboarding`, future post flow
- Sensitive backend rules: Category availability, location availability, price/payment requirements, fraud checks, and task validation are backend-owned.
- Suggested response shape: `{ taskId, status, nextAction }`

### Upload task images

- Purpose: Attach images to Core task drafts or submitted tasks.
- Screens: future post/edit flows
- Sensitive backend rules: Upload authorization, file limits, moderation, and storage keys are backend-owned.
- Suggested response shape: `{ uploadUrl | assetId, expiresAt, constraints }`

### Cancel Core task

- Purpose: Let a customer request task cancellation.
- Screens: future Core task detail
- Sensitive backend rules: Cancellation fee, refund, provider impact, timing windows, and final allowed action are backend-owned.
- Suggested response shape: `{ confirmationRequired, amount, split, impact, nextAction }`

### Approve completion

- Purpose: Customer approves provider completion request.
- Screens: future Core task detail
- Sensitive backend rules: Payment release, review prompts, dispute windows, and completion eligibility are backend-owned.
- Suggested response shape: `{ taskStatus, paymentState, nextAction }`

### Reject completion

- Purpose: Customer rejects completion request and explains why.
- Screens: future Core task detail
- Sensitive backend rules: Dispute/help escalation, messaging requirements, and rejection eligibility are backend-owned.
- Suggested response shape: `{ taskStatus, supportState, nextAction }`

### Request help/refund

- Purpose: Start support, dispute, or refund assistance.
- Screens: future Core task detail, account/support
- Sensitive backend rules: Refund eligibility, evidence requirements, dispute workflow, and admin handling are backend-owned.
- Suggested response shape: `{ supportCaseId, status, requiredInputs[], nextAction }`

### My Pro requests list

- Purpose: List customer Pro requests and their response/unlock states.
- Screens: `/customer/pro-requests`, `/customer/home`
- Sensitive backend rules: Response counts, meaningful response threshold, unlock availability, and contact visibility are backend-owned.
- Suggested response shape: `{ proRequests: ProRequestSummary[], emptyState, nextActions[] }`

### Pro request detail

- Purpose: Show one Pro request, response previews, unlock state, and allowed actions.
- Screens: future `/customer/pro-requests/[id]`
- Sensitive backend rules: Pro response preview limits, unlock gating, contact visibility, site-visit availability, and fee state are backend-owned.
- Suggested response shape: `{ proRequest: ProRequestDetail, responsePreviews[], unlockState, availableActions[] }`

### Post Pro request

- Purpose: Submit a larger quote-based professional request.
- Screens: `/customer/onboarding`, future Pro post flow
- Sensitive backend rules: Category availability, location/city support, moderation, and validation are backend-owned.
- Suggested response shape: `{ proRequestId, status, nextAction }`

### Upload Pro request images

- Purpose: Attach images to Pro request drafts or submitted requests.
- Screens: future Pro post/edit flows
- Sensitive backend rules: Upload authorization, file limits, moderation, and storage keys are backend-owned.
- Suggested response shape: `{ uploadUrl | assetId, expiresAt, constraints }`

### Pro response previews

- Purpose: Show safe previews of Pro responses before unlock.
- Screens: future Pro request detail, `/customer/pro-requests`
- Sensitive backend rules: Preview redaction, meaningful response threshold, response ordering, and contact masking are backend-owned.
- Suggested response shape: `{ previews: ProResponsePreview[], unlockAvailable, responseCount }`

### Pro access unlock status

- Purpose: Display whether Pro comparison details can be unlocked.
- Screens: future Pro request detail
- Sensitive backend rules: Pro Access Fee availability, response threshold, previous unlock state, accounting treatment, and amount are backend-owned.
- Suggested response shape: `{ unlockAvailable, reason, amount, currency, alreadyUnlocked }`

### Unlock and compare Pros

- Purpose: Trigger unlock/payment flow for detailed Pro comparison when allowed.
- Screens: future Pro request detail
- Sensitive backend rules: Unlock eligibility, fee amount, payment intent, invoice/accounting handling, refund policy, and contact reveal are backend-owned.
- Suggested response shape: `{ paymentActionState, unlockState, nextAction }`

### Invite Pro for site visit

- Purpose: Let a customer invite a Pro to continue with a site visit when allowed.
- Screens: future Pro request detail
- Sensitive backend rules: Eligibility, contact rules, scheduling windows, and message templates are backend-owned.
- Suggested response shape: `{ invitationId, status, nextAction }`

### Customer messages

- Purpose: List and open customer message threads for Core tasks and Pro requests.
- Screens: `/customer/messages`, future thread detail
- Sensitive backend rules: Thread access, Core/Pro context, contact redaction, attachment permissions, and blocked states are backend-owned.
- Suggested response shape: `{ threads: MessageThreadSummary[], unreadCount }`

## E) Provider API Map

### Provider dashboard summary

- Purpose: Show provider mode status, counts, unread messages, and backend-safe next action.
- Screens: `/provider/dashboard`
- Sensitive backend rules: Role/capability status, approval state, payout readiness, and matching availability are backend-owned.
- Suggested response shape: `{ providerCapabilities, counts, profileStrength, nextActions[] }`

### Core available tasks

- Purpose: List Core tasks available to an approved Tasker by city/category.
- Screens: `/provider/core-tasks`
- Sensitive backend rules: Matching, task visibility, tasker eligibility, city/category filters, and availability are backend-owned.
- Suggested response shape: `{ tasks: ProviderCoreTaskSummary[], emptyState, filters }`

### Core task detail

- Purpose: Show a provider-facing Core task detail and allowed actions.
- Screens: future `/provider/core-tasks/[id]`
- Sensitive backend rules: Visibility, response/acceptance eligibility, payment protection status, customer contact rules, and lifecycle actions are backend-owned.
- Suggested response shape: `{ task: TaskDetail, providerState, availableActions[] }`

### Accept/respond to Core task

- Purpose: Let a Tasker express interest, respond, or accept when allowed.
- Screens: future Core task detail
- Sensitive backend rules: Assignment, matching, capacity limits, approval state, and anti-abuse checks are backend-owned.
- Suggested response shape: `{ taskStatus, providerState, nextAction }`

### On the way

- Purpose: Provider marks travel/status update for a Core task.
- Screens: future active Core task detail
- Sensitive backend rules: Allowed state transitions and customer notifications are backend-owned.
- Suggested response shape: `{ taskStatus, timelineEvent, nextAction }`

### Start task

- Purpose: Provider marks Core task as started.
- Screens: future active Core task detail
- Sensitive backend rules: State transition eligibility, timing, and customer notification are backend-owned.
- Suggested response shape: `{ taskStatus, timelineEvent, nextAction }`

### Request completion

- Purpose: Provider asks customer to approve completion.
- Screens: future active Core task detail
- Sensitive backend rules: Completion eligibility, payment release rules, dispute windows, and evidence requirements are backend-owned.
- Suggested response shape: `{ taskStatus, completionRequestId, nextAction }`

### Stripe onboarding/status for Core payouts

- Purpose: Show Core payout readiness and launch backend-created Stripe onboarding when needed.
- Screens: `/provider/start`, `/provider/dashboard`, `/provider/account`
- Sensitive backend rules: Stripe account state, payout eligibility, requirements, and onboarding link creation are backend-owned.
- Suggested response shape: `{ coreTaskerStatus, stripeAccountState, requirements[], onboardingAction }`

### Pro profile/application status

- Purpose: Show current Pro profile/application review status.
- Screens: `/provider/start`, `/provider/profile`, `/provider/dashboard`
- Sensitive backend rules: Review state, category approval, visibility, and rejection reasons are backend-owned.
- Suggested response shape: `{ proStatus, approvedCategories[], cities[], reviewNotes, nextAction }`

### Pro profile draft save

- Purpose: Save Pro profile draft details.
- Screens: future Pro profile edit flow
- Sensitive backend rules: Field validation, category constraints, moderation, and draft ownership are backend-owned.
- Suggested response shape: `{ proStatus, draftCompleteness, nextAction }`

### Pro profile submit for review

- Purpose: Submit a Pro profile for review.
- Screens: future Pro profile edit flow
- Sensitive backend rules: Completeness checks, review queue, category approval, and duplicate prevention are backend-owned.
- Suggested response shape: `{ proStatus, submittedAt, nextAction }`

### Matching Pro requests

- Purpose: List Pro requests matching approved provider categories and cities.
- Screens: `/provider/pro-requests`
- Sensitive backend rules: Category/city approval, request visibility, response limits, and matching are backend-owned.
- Suggested response shape: `{ proRequests: ProviderProRequestSummary[], emptyState, filters }`

### Pro request detail

- Purpose: Show provider-facing Pro request details.
- Screens: future `/provider/pro-requests/[id]`
- Sensitive backend rules: Visibility, contact masking, response eligibility, and request status are backend-owned.
- Suggested response shape: `{ proRequest: ProRequestDetail, providerResponseState, availableActions[] }`

### Submit/edit Pro response

- Purpose: Let a Pro submit or edit a quote-style response.
- Screens: future Pro request detail/response editor
- Sensitive backend rules: Eligibility, response limits, contact redaction, moderation, and edit windows are backend-owned.
- Suggested response shape: `{ responseId, responseStatus, nextAction }`

### Pro response status

- Purpose: Show provider response status and customer unlock/contact state.
- Screens: `/provider/pro-requests`, future Pro request detail
- Sensitive backend rules: Customer unlock status, contact permissions, response visibility, and accounting are backend-owned.
- Suggested response shape: `{ responseStatus, customerUnlocked, contactAllowed, nextAction }`

### Provider messages

- Purpose: List and open provider message threads for Core tasks and Pro requests.
- Screens: `/provider/messages`, future thread detail
- Sensitive backend rules: Thread access, Core/Pro context, contact redaction, attachment permissions, and blocked states are backend-owned.
- Suggested response shape: `{ threads: MessageThreadSummary[], unreadCount }`

### Notification preferences

- Purpose: Read and update provider notification preferences.
- Screens: `/provider/account`
- Sensitive backend rules: Channel availability, role-specific notification rules, and opt-out compliance are backend-owned.
- Suggested response shape: `{ preferences, availableChannels, nextAction }`

## F) Payments/API Safety

- Core card/payment flows must use Stripe mobile SDK or backend-created payment sheet/intents.
- Mobile never handles raw card data.
- Core payment protected wording should be preserved and should be driven by backend payment state.
- Pro Access Fee should only appear when meaningful responses exist and the backend says unlock is available.
- Mobile must not infer Pro Access Fee eligibility from response count alone.
- Cancellation fee logic must come from the backend.
- Late cancellation confirmation must display backend-calculated amount, split, timing impact, and provider/customer impact.
- Disputes, refunds, and support flows must be backend/admin-controlled.
- Mobile can show backend-created payment actions, payment sheet configuration, or next-action labels, but should not create sensitive payment decisions locally.

## G) Notifications Plan

Future mobile notification support needs:

- Push token registration after user consent.
- Notification preference read/update APIs.
- Deep links to:
  - Customer Core task detail
  - Customer Pro request detail
  - Provider Core task detail
  - Provider Pro request detail
  - Message thread
- Alerts must identify Core vs Pro context clearly.
- Notification payloads should avoid sensitive contact/payment details.
- Telegram remains optional/parallel and should not replace mobile push state.
- Mobile should refresh relevant screens after opening a notification deep link.

## H) Data Models/Types To Introduce Later

Eventually add shared API types under `src/lib/api/types.ts`:

- `ApiResult`
- `UserSession`
- `WorkspaceAccess`
- `ProviderCapabilities`
- `CustomerHomeSummary`
- `TaskSummary`
- `TaskDetail`
- `ProRequestSummary`
- `ProRequestDetail`
- `ProResponsePreview`
- `ProviderDashboardSummary`
- `ProviderCoreTaskSummary`
- `ProviderProRequestSummary`
- `MessageThreadSummary`
- `PaymentActionState`
- `NextAction`

This phase adds only the low-risk foundation types needed to plan the API client.

## Phase 6 API Client Foundation

Phase 6 adds the mobile API client foundation without connecting screens to real backend data.

- Environment variable: `EXPO_PUBLIC_TASKLY_API_BASE_URL`.
- Local default example: `http://localhost:3000`.
- Android emulator may need `http://10.0.2.2:3000`.
- Expo Go on a physical phone should use the computer LAN IP on the same network.
- Only `EXPO_PUBLIC_*` values are exposed to the app, so they must not contain secrets.

The endpoint registry lives in `src/lib/api/endpoints.ts`. It centralizes proposed mobile API paths such as `/api/mobile/auth/session`, `/api/mobile/customer/tasks`, and `/api/mobile/provider/dashboard`. These are placeholders until the backend exposes stable mobile JSON contracts.

The typed client uses `ApiResult<T>`:

- Success: `{ ok: true; data; status }`
- Failure: `{ ok: false; error; status? }`

The request helper should return failures for normal HTTP/network errors instead of throwing into screens. Screens are not connected yet because the first real integration should define auth/session behavior, token storage, unauthorized handling, and workspace permission routing. The next recommended phase is auth/session integration using the typed client and endpoint registry.

## Phase 9 App-Shell Session Checking

The mobile app now wraps Expo Router with `AuthProvider`, which calls `GET /api/mobile/auth/session` once at startup through `getCurrentSession()`. The shell exposes loading, authenticated, unauthenticated, error, and demo states through `useAuth()`.

Screens should use the AuthProvider state for session display and later route guarding. They should not call the session endpoint directly. Demo mode remains available while login/logout/token storage are still unimplemented.

## I) Recommended Integration Order

1. API client foundation and environment config.
2. Auth/session/current user.
3. Workspace permission routing.
4. Customer read-only summaries/lists.
5. Provider read-only summaries/lists.
6. Details screens.
7. Non-payment mutations.
8. Image upload/compression.
9. Messaging.
10. Notifications/deep links.
11. Payment entry points.
12. Cancellation/refund/help flows.

## J) Risks/Open Questions

- Existing web backend may use server actions that are not directly callable by mobile.
- Mobile may need dedicated API routes with stable JSON contracts.
- Auth token/session strategy must be chosen for Expo Go, native builds, and web.
- Image upload storage strategy must be confirmed, including compression, moderation, and signed upload URLs.
- Stripe mobile flow must be designed carefully for Core payments and payouts.
- Pro Access Fee accounting/invoice treatment must remain aligned with accountant/legal advice.
- Exact brand color tokens should be checked against the web repo before final release.
- Deep link route naming should be confirmed before push notification implementation.
- Offline/retry behavior should be designed before user-facing mutations are connected.
