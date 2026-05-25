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

Login/logout should be implemented only after the token/cookie strategy is confirmed in [`docs/mobile-login-logout-plan.md`](./mobile-login-logout-plan.md). The recommended path is a hybrid model: keep web cookie auth intact and add native mobile access/refresh token routes later.

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

## Phase 12 Customer Read-Only APIs

Phase 12 adds the first read-only customer data integration.

Backend endpoints added:

- `GET /api/mobile/customer/home`
- `GET /api/mobile/customer/tasks`
- `GET /api/mobile/customer/pro-requests`

Mobile wrappers live in `src/lib/api/customer.ts`, and endpoint paths remain centralized in `src/lib/api/endpoints.ts`. Customer Home, My Tasks, and My Pro Requests now fetch read-only data through these wrappers when an authenticated token is available.

Scope remains intentionally limited:

- No task or Pro request creation.
- No payment, cancellation, approval, rejection, refund, help, image upload, messaging, or notification mutations.
- No provider/private contact details are exposed.
- Customer screen CTAs remain placeholders until dedicated mutation phases.

The backend remains the source of truth for status labels, workspace access, permissions, and `nextAction` fields. Mobile displays those fields and does not calculate sensitive eligibility. Demo mode still uses local mock responses when selected.

## Phase 13 Provider Read-Only APIs

Phase 13 adds read-only Provider Workspace data integration while keeping Core and Pro modes separate.

Backend endpoints added:

- `GET /api/mobile/provider/dashboard`
- `GET /api/mobile/provider/core-tasks`
- `GET /api/mobile/provider/pro-requests`
- `GET /api/mobile/provider/profile`

Mobile wrappers live in `src/lib/api/provider.ts`, with paths centralized in `src/lib/api/endpoints.ts`. Provider Dashboard, Core Tasks, Pro Requests, and Profile now fetch read-only data when an authenticated token is available.

Scope remains intentionally limited:

- No Core task accept/respond, on-the-way, start task, or completion request actions.
- No Stripe onboarding action.
- No Pro response create/edit flow.
- No payment, cancellation, dispute, refund, help, image upload, messaging, or notification mutations.
- No customer private contact/address data is exposed by mobile unless the backend explicitly returns safe preview fields.

The backend remains the source of truth for provider capabilities, matching, status labels, permissions, and `nextAction` fields. Mobile displays backend-provided values and keeps demo responses available for development.

## Phase 14 Read-Only Detail Screens

Phase 14 adds read-only detail endpoints and mobile screens for both workspaces.

Backend endpoints added:

- `GET /api/mobile/customer/tasks/[taskId]`
- `GET /api/mobile/customer/pro-requests/[proRequestId]`
- `GET /api/mobile/provider/core-tasks/[taskId]`
- `GET /api/mobile/provider/pro-requests/[proRequestId]`

Mobile detail routes added:

- `/customer/tasks/[taskId]`
- `/customer/pro-requests/[proRequestId]`
- `/provider/core-tasks/[taskId]`
- `/provider/pro-requests/[proRequestId]`

The screens show read-only status, safe preview fields, images, timelines, and backend-provided `nextActions`. List cards now navigate to these detail routes. The CTAs on detail screens are placeholders only; they do not execute sensitive actions.

Scope remains read-only:

- No Core task accept, start, on-the-way, completion, cancellation, dispute, refund, help, payment, or Stripe actions.
- No Pro response create/edit, unlock payment, site visit invite, or contact flow.
- No image upload or messaging integration.
- No private Pro contact details or customer private address/contact details are exposed unless the backend explicitly returns safe fields for the authenticated user and lifecycle state.

The backend remains the source of truth for access checks, status labels, visibility, and `nextAction` fields. Demo detail payloads remain available so the mobile app can open detail screens without backend data.

## Phase 15 Catalogs And Posting Form Foundations

Phase 15 adds read-only catalog/config endpoints and UI-only customer posting foundations. These screens prepare the mobile UX for future Core task and Pro request creation without submitting anything yet.

Backend endpoints added:

- `GET /api/mobile/catalog/cities`
- `GET /api/mobile/catalog/core-categories`
- `GET /api/mobile/catalog/pro-categories`
- `GET /api/mobile/catalog/posting-rules`

Mobile form routes added:

- `/customer/post-task`
- `/customer/post-pro-request`

The mobile screens fetch cities, category catalogs, and posting rules through `src/lib/api/catalog.ts`. Demo catalog responses remain available in `src/lib/api/mockApi.ts` so the forms can be previewed without a backend.

Scope remains UI-only:

- No Core task creation.
- No Pro request creation.
- No image picker or image upload.
- No payment, Stripe, cancellation, dispute, refund, help, Pro unlock, or provider action logic.
- Submit buttons stay disabled and clearly say that submission will be connected later.

Catalogs and posting rules must come from backend APIs or demo mocks. The backend remains the source of truth for final city/category availability, validation constraints, payment wording, and future mutation eligibility.

## Phase 16 Image Picker And Compression Foundation

Phase 16 adds local photo selection to the customer posting foundations.

Mobile changes:

- `expo-image-picker` is used for selecting local images from the device library.
- `expo-image-manipulator` is used for conservative local resizing/compression.
- Post Task and Post Pro Request forms now support local preview, removal, validation, and processing state.
- The forms use backend posting rules for `maxImages` and `acceptedImageTypes` when available.
- Demo posting rules remain available when demo mode is active or backend catalogs are unavailable.

Scope remains local-only:

- No image upload.
- No permanent image storage.
- No Core task creation.
- No Pro request creation.
- No payment, Stripe, cancellation, dispute, refund, help, provider action, or Pro unlock behavior.

Selected images stay in form state only. The app keeps both the original local URI and a compressed URI where processing succeeds so a later upload/storage phase can decide how to send files safely.

## Phase 16.5 Posting Form Data Contract Review

Phase 16.5 reviews the current mobile Post Task and Post Pro Request form state against existing backend create logic. See `docs/mobile-posting-contract.md` for the detailed contract proposal.

Summary:

- Post Task currently stores selected city, selected Core category, title, description, and local images.
- Post Task currently renders address, schedule, and budget placeholders, but those fields are not controlled submit-ready state yet.
- Post Pro Request currently stores selected city, selected Pro category, title, description, and local images.
- Post Pro Request currently renders district/area, preferred timeline, and budget range placeholders, but those fields are not controlled submit-ready state yet.
- Proposed future mobile creation routes are `POST /api/mobile/customer/tasks` and `POST /api/mobile/customer/pro-requests`.
- Mobile must not send server-owned lifecycle, payment, matching, role, Pro unlock, assignment, access, or status fields.
- Images remain a separate upload/storage concern. Local image URIs must not be sent in create payloads.
- Submit remains disabled and no backend business logic changed in this phase.

## Phase 17 Core Task Creation Mutation

Phase 17 connects Customer Workspace Core task creation only.

Backend endpoint added:

- `POST /api/mobile/customer/tasks`

Mobile behavior:

- `/customer/post-task` now submits through the typed customer API wrapper.
- The mobile route uses the authenticated bearer token and never sends a customer/user ID.
- On success, the app navigates to `/customer/tasks/[taskId]`.
- Demo mode does not call the backend and shows a demo-only success message instead.
- Selected local images remain local. Mobile sends only `localImageCount`; it does not send local image URIs, compressed URIs, base64 data, or image records.

Scope remains limited:

- No Pro request creation.
- No image upload or storage.
- No payment, Stripe, cancellation, dispute, refund, help, provider action, or Pro unlock behavior.
- No mobile-sent lifecycle, payment, matching, status, reservation, assignment, or provider fields.

The backend route derives the customer identity from the mobile session, validates customer workspace permission, rejects server-owned fields, creates the Core task through existing backend task creation logic, and returns the created task using the existing mobile customer task detail shape plus backend-provided next actions.

## Phase 17.1 Post Task Submit Validation Visibility

Phase 17.1 improves `/customer/post-task` validation visibility without changing backend business logic.

- Post Task now shows a compact missing/invalid field summary near the submit button whenever submit is disabled.
- Submit activation currently requires city, Core category, title, description meeting the backend minimum length, address, schedule start, schedule end after start, estimated time, positive budget, and valid latitude/longitude coordinates.
- Required fields used by submit activation now have visible helper/error messaging, and backend `fieldErrors` are mapped back to matching fields when possible.
- Latitude/longitude remain required because the current backend route requires a valid service location; the mobile screen keeps temporary coordinate inputs until a map/location picker phase replaces them.
- Selected images remain local-only. Mobile still sends only `localImageCount` and never sends local image URIs, compressed URIs, base64 data, or image records.
- Pro request creation remains unconnected.
- No payment, provider, lifecycle, matching, cancellation, refund, dispute, help, Stripe, image upload, or Pro unlock logic was added.

## Phase 18 Pro Request Creation Mutation

Phase 18 connects Customer Workspace Pro request creation only.

Backend endpoint added:

- `POST /api/mobile/customer/pro-requests`

Mobile behavior:

- `/customer/post-pro-request` now submits through the typed customer API wrapper.
- The mobile route uses the authenticated bearer token and never sends a customer/user ID.
- Submit activation requires city, Pro category, area/district, project title, project description meeting the backend minimum length, preferred timeline/start date, and a valid min/max budget range.
- The form shows a compact missing/invalid field summary and field-level helper/error messaging while submit is disabled.
- On success, the app navigates to `/customer/pro-requests/[proRequestId]`.
- Demo mode does not call the backend and shows a demo-only message instead.
- Selected local images remain local. Mobile sends only `localImageCount`; it does not send local image URIs, compressed URIs, base64 data, image URLs, or image records.

Scope remains limited:

- No Core task creation changes beyond shared API exports/types.
- No image upload or storage.
- No Pro Access Fee, unlock, Stripe, payment, provider response/action, cancellation, dispute, refund, help, matching, access, or lifecycle logic.
- No mobile-sent status, access, unlock, payment, matching, provider, response, or admin fields.

The backend derives the customer identity from the mobile session, verifies customer workspace permission, rejects server-owned fields, creates the Pro request through shared backend persistence logic, and returns the created Pro request using the existing mobile customer Pro request detail shape plus backend-provided next actions.

## Phase 19 Image Upload/Storage Architecture Review

Phase 19 reviews image handling for future mobile uploads. See `docs/mobile-image-upload-plan.md` for the detailed architecture comparison and Phase 20 contract proposal.

Current backend findings:

- Core task images are stored as `TaskImage` rows with `url` stored in a `LONGTEXT` column. Web upload accepts up to 5 images per task, 10 MB per file, and image MIME types including JPEG, PNG, WebP, GIF, HEIC, and HEIF.
- Pro request images are stored as `ProRequestImage` rows with `url` stored in a `LONGTEXT` column and `sortOrder`. Web upload accepts up to 10 images per Pro request, 10 MB per file, and the same broad image MIME set.
- Web upload attempts to write files under `public/uploads/tasks/*` or `public/uploads/pro-requests/*` when the filesystem is writable. On read-only/serverless environments it falls back to a `data:` URL persisted in the database.
- The filesystem path is convenient locally but is not durable serverless storage. The `LONGTEXT` data URL fallback keeps uploads working but can increase database size and query payloads.

Current mobile findings:

- Post Task and Post Pro Request keep selected images local in form state only.
- Mobile has original local `uri`, optional `compressedUri`, optional `fileName`, `fileSize`, `mimeType`, `width`, and `height`, plus image processing status.
- `compressedUri` should be the preferred upload source when `status` is `compressed`.
- Mobile still sends only `localImageCount` during creation. It does not send local image URIs, compressed URIs, base64 data, image URLs, or image records.

Recommended Phase 20 strategy:

- Keep image upload separate from entity creation.
- Add authenticated post-create upload endpoints:
  - `POST /api/mobile/customer/tasks/[taskId]/images`
  - `POST /api/mobile/customer/pro-requests/[proRequestId]/images`
- Upload compressed mobile images after the Core task or Pro request is created.
- Treat upload failure as non-blocking: the created task/request remains, and mobile shows a clear "photos could not be added" warning.
- Prefer `multipart/form-data` with one image per request so ownership checks, size validation, partial success, and retries stay simple.
- Reuse or extract the existing backend upload validation/persistence paths instead of duplicating storage rules.

Scope remains limited:

- No upload is connected in Phase 19.
- No image storage API is implemented in Phase 19.
- No payment, Stripe, provider action, lifecycle, cancellation, refund, dispute, help, matching, or Pro unlock logic is added.
- Core task creation and Pro request creation remain separate from image upload.

Open risks before Phase 20:

- The mobile posting rules currently need to stay aligned with backend image limits, especially Core task max images.
- Serverless filesystem writes are not durable; data URL fallback is acceptable only as a conservative bridge, not long-term media storage.
- Mobile compressed image metadata is partial, so backend validation must remain authoritative for size and MIME type.
- Phase 20 should decide whether upload is allowed only immediately after creation or also while the customer-owned entity remains editable.

## Phase 20A Backend Mobile Image Upload Endpoints

Phase 20A adds backend upload endpoints only. Mobile upload remains unconnected until Phase 20B.

Backend endpoints added:

- `POST /api/mobile/customer/tasks/[taskId]/images`
- `POST /api/mobile/customer/pro-requests/[proRequestId]/images`

Endpoint behavior:

- Both routes require existing mobile authentication and derive identity from the backend session/token.
- Both routes accept `multipart/form-data` with one file field named `image`.
- Both routes verify that the target entity exists and belongs to the authenticated customer.
- Both routes reject attempts to attach images to another customer's task/request.
- Both routes append images and return the created image plus upload state.

Rules used:

- Core task max images: 5, matching the current backend `TaskImage` upload action.
- Pro request max images: 10, matching the current backend `ProRequestImage` upload action.
- Max file size: 10 MB per image.
- Accepted MIME types follow current backend upload logic: JPEG, JPG, PNG, WebP, GIF, HEIC, and HEIF.
- Storage follows the existing backend pattern: write under `public/uploads/*` when available and fall back to a DB `data:` URL in the `LONGTEXT` image URL column on read-only/serverless filesystems.

Known limitations:

- The DB `LONGTEXT`/data URL bridge is compatible with current web behavior but is not a long-term scalable media storage strategy.
- Mobile compressed image upload is not wired yet.
- Phase 20B should add mobile API client/types and upload selected compressed images after creation.

Scope remains limited:

- No mobile submit flow changes.
- No images are sent in create payloads.
- No payment, provider, lifecycle, matching, cancellation, refund, dispute, help, Stripe, or Pro unlock logic is added.

## Phase 20B Mobile Image Upload After Creation

Phase 20B wires mobile image upload after successful Customer Workspace creation mutations.

Mobile behavior:

- Post Task still creates the Core task first through `POST /api/mobile/customer/tasks`.
- Post Pro Request still creates the Pro request first through `POST /api/mobile/customer/pro-requests`.
- Creation payloads still send only `localImageCount`; they do not include local image URIs, compressed URIs, base64 data, image URLs, or image records.
- After creation succeeds, mobile uploads selected images one at a time through the Phase 20A backend endpoints.
- `compressedUri` is preferred when the selected image status is `compressed`; the original local `uri` is used only as a fallback file source for React Native multipart upload.
- Each upload uses `multipart/form-data` with one React Native file object field named `image`.
- Mobile skips images with processing errors and continues uploading remaining images if one upload fails.
- Creation remains successful if image upload fails. The user sees a non-blocking warning and the app still navigates to the created detail screen.
- Demo mode does not call upload endpoints.

Scope remains limited:

- No upload happens before entity creation.
- No payment, provider, lifecycle, matching, cancellation, refund, dispute, help, Stripe, or Pro unlock logic is added.
- Detail refresh is kept simple by navigating after the upload sequence completes, so existing detail APIs can include the uploaded images.

## Phase 20C Uploaded Image Display Verification

Phase 20C verifies and improves mobile display after Phase 20B upload.

Findings:

- Customer Core task detail already returns `task.images` with image `id` and `url`, ordered by creation time.
- Customer Pro request detail already returns `proRequest.images` with image `id` and `url`, ordered by `sortOrder`.
- The backend detail APIs did not need a read-only shape change for display.
- Detail screens already reload on focus through `useFocusEffect`, and Phase 20B navigates after upload completes, so the created detail fetch can include uploaded images.

Mobile display update:

- Customer Core task detail and Customer Pro request detail now resolve backend media URLs before rendering images.
- `data:` URLs render unchanged.
- Absolute `http://` and `https://` URLs render unchanged.
- Relative backend paths such as `/uploads/tasks/...` are resolved against `EXPO_PUBLIC_TASKLY_API_BASE_URL`.

Scope remains limited:

- No upload endpoint behavior changed.
- No create mutation behavior changed.
- No payment, provider, lifecycle, matching, cancellation, refund, dispute, help, Stripe, or Pro unlock logic is added.

## Phase 21A Mobile Messaging Read-Only Foundation

Phase 21A adds read-only mobile messaging APIs and screens. Message sending remains unconnected.

Backend endpoints added:

- `GET /api/mobile/messages/threads`
- `GET /api/mobile/messages/threads/[threadId]`

Backend behavior:

- Both routes require existing mobile authentication and derive the user from the backend session/token.
- Thread list returns only conversations where the authenticated user is a participant or the recipient of an official Taskly message.
- Core chat threads are based on existing `Booking` and `Message` records and are limited to customer/tasker participants on non-deleted tasks with chat-ready task statuses.
- Official Taskly/admin messages are exposed as read-only support threads for the recipient only.
- Pro request chat is not exposed because no existing Pro message thread model was found in this phase.
- Thread detail returns safe metadata and chronological messages.
- Chat attachments are intentionally returned as empty arrays in this phase.
- Admin message detail is not marked read by the mobile read-only API.
- No admin management, private contact details, Pro contact/unlock behavior, or cross-user threads are exposed.

Mobile behavior:

- Customer Messages now loads thread cards and opens read-only conversation detail.
- Provider Messages now loads the same participant-safe thread cards and keeps Core/Support context labels visible.
- Demo mode uses local demo message threads and does not call the backend.
- Detail screens show messages in chronological order and a disabled/future-state note that sending will be connected later.

Scope remains limited:

- No message sending.
- No chat image attachments.
- No payment, provider action, lifecycle, matching, cancellation, refund, dispute, help, Stripe, or Pro unlock logic is added.

## Phase 21B Mobile Text Message Sending

Phase 21B connects plain text sending for existing Core booking conversations only.

Backend endpoint added:

- `POST /api/mobile/messages/threads/[threadId]/messages`

Backend behavior:

- The route requires existing mobile authentication and derives the sender from the backend session/token.
- Sending is supported for existing Core booking threads with ids like `booking:[id]`.
- The sender must be the booking customer or tasker, the task must be non-deleted, and the task status must already be chat-ready.
- Tasker sending preserves the existing backend tasker verification gate used by web chat.
- The request body is text-only: `{ body: string }`.
- Empty messages are rejected, messages are trimmed, and the max text length is 2000 characters.
- Attachment/media/image/file/base64/local URI fields are rejected.
- Official Taskly/admin messages remain one-way support threads because the backend has `AdminMessage` but no safe user-reply thread model.
- No Pro request chat was added because no existing Pro chat/thread model exists.

Mobile behavior:

- Customer and Provider message detail screens now show a text-only composer for Core booking conversations.
- On successful send, the returned message is appended locally.
- Support/admin conversations show that sending is not available.
- Demo mode appends a local demo message and does not call the backend.

Scope remains limited:

- No image attachments, camera/gallery, files, voice, typing indicators, read receipts, or push notification work was added.
- No payment, provider action, task lifecycle, Pro request lifecycle/access, cancellation, refund, dispute, help, Stripe, or Pro unlock logic is added.

### Phase 21B Mobile Text Message Sending UI

The mobile Customer and Provider thread detail screens are connected to the hardened backend send route when `thread.capabilities.canSendText` is true.

- The composer posts `{ body }` through `src/lib/api/messages.ts` to `POST /api/mobile/messages/threads/[threadId]/messages`.
- The request sends text only and does not include attachment, image, local URI, base64, file, voice, or media fields.
- Empty, whitespace-only, and over-2000-character messages are blocked client-side before submit.
- The returned message is appended locally after a successful response, with duplicate ids ignored.
- Demo Core threads append a local demo message and never call the backend.
- Support/admin threads remain read-only because their capabilities return `canSendText: false`.
- Pro request chat remains unavailable because there is still no backend Pro chat/thread model.
- Attachments remain unavailable and no camera/gallery/file controls are shown.
- No payment, provider action, lifecycle, matching, cancellation, refund, dispute, help, Stripe, or Pro unlock logic is added.

## Phase 21B.1 Messaging Thread Capability Cleanup

Phase 21B.1 makes mobile messaging capabilities explicit before future attachment work.

Response shape update:

- Message thread list cards and thread detail metadata now include:
  - `capabilities.canRead`
  - `capabilities.canSendText`
  - `capabilities.canSendAttachments`
  - optional `capabilities.readOnlyReason`

Thread behavior:

- Core booking chats return `canRead: true`, `canSendText: true`, and `canSendAttachments: false`.
- Official Taskly/admin messages return `canRead: true`, `canSendText: false`, `canSendAttachments: false`, and `readOnlyReason: "SUPPORT_READ_ONLY"`.
- Pro request chat remains unavailable because no real backend Pro chat/thread model exists. Mobile must not expose or invent Pro chat threads without a backend model and product decision.
- Unsupported thread types remain non-sendable and should use `readOnlyReason: "UNSUPPORTED_THREAD_TYPE"` if exposed in the future.

Mobile behavior:

- Thread cards show a compact read-only indicator when text sending is not available.
- Thread detail screens show the text composer only when `capabilities.canSendText` is true.
- Read-only support/admin conversations show a clear explanation instead of a disabled mystery state.
- Attachments remain unavailable and no camera/gallery/media controls are shown.

Backend enforcement:

- The text send route still validates mobile auth, participant access, supported thread type, and text-only payloads server-side.
- The send route does not allow Pro request chat, support/admin replies, cross-user sending, attachments, or media fields.

Scope remains limited:

- No new messaging models.
- No chat attachments.
- No Pro request chat.
- No payment, provider action, lifecycle, matching, cancellation, refund, dispute, help, Stripe, or Pro unlock logic is added.

## Phase 21C Mobile Chat Image Attachments

Phase 21C adds image attachments only for existing Core booking chat threads.

Backend behavior:

- `POST /api/mobile/messages/threads/[threadId]/messages` now accepts `multipart/form-data` with one image file field named `image`.
- The route still requires mobile authentication and derives the sender from the backend session/token.
- Image sends are supported only for existing Core booking threads where the authenticated user is the customer or tasker participant.
- Support/admin threads remain read-only and cannot receive attachments.
- Pro request chat remains unavailable because no backend Pro chat/thread model exists.
- The backend validates supported thread type, participant access, chat-ready task state, image MIME type, and max file size.
- Chat images reuse the existing storage bridge: write under `/uploads/chat/[bookingId]` when filesystem uploads are available, otherwise persist a DB `data:` URL fallback through the JSON `Message.content` attachment payload.
- The `Message` model remains unchanged; image messages are stored as normal `Message` rows with JSON content containing `text` and `attachments`.

Mobile behavior:

- Customer and Provider Core chat detail screens show an Add photo button only when backend capabilities include `canSendText: true` and `canSendAttachments: true`.
- The mobile app picks one library image at a time, compresses it locally, uploads it as multipart, and appends the returned image message after success.
- Text sending remains working.
- Message rendering now displays image attachments from `data:` URLs, absolute URLs, and relative `/uploads/...` paths resolved through the API base URL.
- Demo Core chat can append a local image message without calling the backend; support/admin demo threads remain read-only.

Scope remains limited:

- One image per multipart request/message.
- No camera capture, multi-image chat send, files, voice messages, Pro request chat, support/admin attachments, payment, provider action, lifecycle, matching, cancellation, refund, dispute, help, Stripe, or Pro unlock logic is added.

## Phase 22A Provider Core Action Contract Review

Phase 22A reviewed the existing backend/web Core Tasker action flow and documented the safe mobile contract in `docs/mobile-provider-core-actions-contract.md`.

Backend files inspected:

- `D:\Taskly\prisma\schema.prisma`
- `D:\Taskly\src\app\actions.ts`
- `D:\Taskly\src\app\actions\payments.ts`
- `D:\Taskly\src\lib\stripe-ops.ts`
- `D:\Taskly\src\lib\tasker-verification.server.ts`
- `D:\Taskly\src\lib\mobile-provider-readonly.ts`
- `D:\Taskly\src\app\api\mobile\provider\*`
- Web tasker/customer dashboards that call the existing actions

Current action map findings:

- Providers view matching open tasks through backend city/category/readiness rules.
- Providers currently express interest through `interestTask` / `expressInterest`; this does not assign the task.
- Customers select a tasker through `reserveTasker`, which creates the reservation lock and booking.
- Customer/payment logic then moves the selected task into assigned/in-progress state.
- Provider runtime actions already exist on web for `markOnTheWay`, `startTask`, and `requestTaskCompletion`.
- Provider cancellation/cannot-attend is not yet a clean mobile-safe contract and needs a separate cancellation/dispute review.

Recommended mobile action order:

1. Phase 22B: Provider express interest/respond for open matching Core tasks.
2. Phase 22C: Provider "On the way" using existing schedule/payment gates.
3. Phase 22D: Provider "Start task" using existing payment and schedule gates.
4. Phase 22E: Provider "Request completion".
5. Phase 22F: Provider task action UI and `nextActions` consistency.

Proposed mobile endpoints:

- `POST /api/mobile/provider/core-tasks/[taskId]/interest`
- `POST /api/mobile/provider/core-tasks/[taskId]/on-the-way`
- `POST /api/mobile/provider/core-tasks/[taskId]/start`
- `POST /api/mobile/provider/core-tasks/[taskId]/request-completion`

No provider direct-accept endpoint is recommended yet because the current source of truth uses provider interest followed by customer selection/reservation/payment setup.

The proposed `nextActions` structure adds backend-owned booleans such as `canExpressInterest`, `canChat`, `canMarkOnTheWay`, `canStart`, and `canRequestCompletion`, plus blocked reason codes. Mobile may use these to render controls, but every mutation endpoint must repeat the checks server-side.

Scope remains limited:

- No provider mutations were connected.
- No payment, Stripe, cancellation, refund, dispute, help, Pro Access payment/unlock, Pro request provider response, task lifecycle, matching, or provider action logic was changed.
- Customer private address/contact data remains protected by the current mobile detail shape.

## Phase 22B Provider Core Express-Interest Action

Phase 22B connects only the provider Core task interest/respond action for open matching Core tasks.

Backend behavior:

- Added `POST /api/mobile/provider/core-tasks/[taskId]/interest`.
- The route requires mobile auth and derives the provider/tasker identity from the backend mobile session.
- The route rejects server-owned fields such as tasker/customer ids, status, reservation, booking, payment, Stripe, assignment, lifecycle, and price fields.
- The route accepts an empty JSON body, plus `toolsConfirmed: true` only when a risky Core category requires tools confirmation.
- The existing `TaskInterest` model is used. No note/message is stored because the current web interest model has no message field.
- Duplicate interest is idempotently handled through the existing unique `(taskId, taskerId)` interest model and returns an already-interested state instead of creating duplicates.
- The backend verifies approved/verified tasker status, open task status, assignment state, city match, service category eligibility, restricted category capability, preferred-tasker window, task preflight, and tools confirmation.
- The endpoint returns the refreshed provider Core task detail shape with backend-authored `nextActions`.

Mobile behavior:

- Provider Core task detail shows `Express interest` only when `nextActions.canExpressInterest` is true.
- The screen uses wording that the customer will choose a tasker and that expressing interest does not reserve the task.
- After success, the screen refreshes from the backend and disables repeat interest.
- Demo mode simulates interest locally and does not call the backend.
- Provider Core task list shows a compact interest-available indicator when the backend response says it is actionable.

Scope remains limited:

- No direct provider accept/reserve was added.
- The mobile app does not call `reserveTasker`.
- Customer selection/reservation remains customer-owned.
- No booking, assignment, payment, Stripe, cancellation, refund, dispute, help, provider runtime action, Pro response, Pro Access payment/unlock, or lifecycle logic was added.

## Phase 22C Provider Core On-The-Way Action

Phase 22C connects only the provider Core runtime "On the way" action for assigned Core tasks.

Backend behavior:

- Added `POST /api/mobile/provider/core-tasks/[taskId]/on-the-way`.
- The route requires mobile auth and derives the provider/tasker identity from the backend mobile session.
- The route rejects server-owned fields such as tasker/customer ids, status, reservation, booking, payment, Stripe, assignment, lifecycle, `startedAt`, and `completedAt` fields.
- The backend verifies approved/verified Core tasker status, task existence, assignment/reservation to the authenticated tasker, eligible task status, schedule presence, payment execution readiness, and the existing two-hour scheduled-start gate.
- The action is idempotent when `onTheWayAt` is already set.
- The action sets only `onTheWayAt` and returns the refreshed Provider Core task detail shape with backend-authored `nextActions`.

Mobile behavior:

- Provider Core task detail shows `Mark on the way` only when `nextActions.canMarkOnTheWay` is true.
- The UI explains that the action notifies the customer and does not start the task.
- After success, the screen refreshes from the backend and disables repeat marking.
- Demo mode simulates on-the-way locally and does not call the backend.
- Provider Core task list shows a compact on-the-way indicator when the backend response says it is actionable.

Scope remains limited:

- No Start Task or Request Completion action was added.
- No direct provider accept/reserve was added.
- No payment, Stripe, booking, assignment, reservation, cancellation, refund, dispute, help, provider cancellation, Pro response, Pro Access payment/unlock, or lifecycle transition logic was added.

## Phase 22D Provider Core Start-Task Action

Phase 22D connects only the provider Core runtime "Start task" action for eligible assigned Core tasks.

Backend behavior:

- Added `POST /api/mobile/provider/core-tasks/[taskId]/start`.
- The route requires mobile auth and derives the provider/tasker identity from the backend mobile session.
- The route rejects server-owned fields such as tasker/customer ids, status, reservation, booking, payment, Stripe, assignment, lifecycle, `startedAt`, and `completedAt` fields.
- The backend reuses the existing start-task rules: approved/verified Core tasker, task existence, assignment/reservation to the authenticated tasker, task `RESERVED` or `IN_PROGRESS`, schedule presence, payment execution readiness, start time reached unless `onTheWayAt` exists, and not after scheduled end.
- The action is idempotent when `startedAt` is already set.
- The action sets only `startedAt` and returns the refreshed Provider Core task detail shape with backend-authored `nextActions`.

Mobile behavior:

- Provider Core task detail shows `Start task` only when `nextActions.canStart` is true.
- The UI asks for confirmation and explains that the action should be used only when ready to begin the work.
- After success, the screen refreshes from the backend and disables repeat starting.
- Demo mode simulates start locally and does not call the backend.
- Provider Core task list shows a compact start-available indicator when the backend response says it is actionable.

Scope remains limited:

- No Request Completion action was added.
- No direct provider accept/reserve was added.
- No payment capture, release, refund, Stripe flow, booking, assignment, reservation, cancellation, dispute, help, provider cancellation, Pro response, Pro Access payment/unlock, or additional lifecycle logic was added.

## Phase 22E Provider Core Request-Completion Action

Phase 22E connects only the provider Core runtime "Request completion" action for eligible assigned Core tasks that have already started.

Backend behavior:

- Added `POST /api/mobile/provider/core-tasks/[taskId]/request-completion`.
- The route requires mobile auth and derives the provider/tasker identity from the backend mobile session.
- The route rejects server-owned fields such as tasker/customer ids, status, reservation, booking, payment, payout, Stripe, assignment, lifecycle, `startedAt`, `completedAt`, and completion approval fields.
- The backend follows the existing request-completion rules: approved/verified Core tasker, booking exists, authenticated provider is the booking tasker, task is `IN_PROGRESS` or already `PENDING_COMPLETION`, task is started, and completed/cancelled/disputed tasks are blocked.
- The current web action does not support provider completion notes, so the mobile route accepts an empty body and rejects non-empty `note`.
- Repeated requests while already `PENDING_COMPLETION` are treated as idempotent and do not create another customer notification.
- The action moves only `IN_PROGRESS -> PENDING_COMPLETION`, keeps booking active if needed, notifies the customer for review, and returns the refreshed Provider Core task detail shape with backend-authored `nextActions`.

Mobile behavior:

- Provider Core task detail shows `Request completion` only when `nextActions.canRequestCompletion` is true.
- The UI asks for confirmation and explains that the customer must approve before the task is completed.
- After success, the screen refreshes from the backend and shows the pending approval state.
- Demo mode simulates completion requested locally and does not call the backend.
- Provider Core task list shows a compact request-completion indicator when the backend response says it is actionable.

Scope remains limited:

- No customer approve/reject completion action was added.
- The task is not marked completed directly by the provider mobile action.
- No payment capture, release, refund, Stripe flow, cancellation, dispute, help, provider cancellation, direct accept/reserve, booking creation, assignment, reservation, Pro response, Pro Access payment/unlock, or additional lifecycle logic was added.

## Phase 22F Provider Core Action UI And NextActions Consistency

Phase 22F cleans up the Provider Core task list/detail UI after the express-interest, on-the-way, start, and request-completion mutations.

Behavior:

- Provider Core task actions use backend-authored `nextActions` for availability.
- The detail screen normalizes one primary action at a time from `nextActions.primary` plus capability flags.
- The detail screen priority is express interest, chat when backend marks it primary, mark on the way, start task, then request completion.
- The list screen shows the current provider-facing phase label and one compact next-action hint instead of several simultaneous action badges.
- Blocked states show short friendly helper text mapped from `blockedReasonCode`; raw backend codes are not shown to the user.
- Status/phase labels now cover available, interest sent, upcoming/reserved, on the way, in progress, waiting for customer approval, completed, cancelled, disputed, and not available.
- Provider wording avoids direct accept/reserve language and does not imply payment release or task completion from the provider request-completion action.
- The provider detail preserves backend privacy behavior for address display and falls back to a generic shared-when-reserved label when no exact address is returned.
- Demo mode remains local and uses the same one-primary-action display rules.

Scope remains limited:

- No new provider mutations were added.
- No customer approve/reject completion action was added.
- No payment capture, release, refund, Stripe flow, cancellation, dispute, help, provider cancellation, direct accept/reserve, Pro response, Pro Access payment/unlock, or lifecycle rule changes were added.

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
