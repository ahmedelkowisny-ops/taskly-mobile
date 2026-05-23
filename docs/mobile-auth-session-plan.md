# Taskly Mobile Auth and Session Plan

## 1. Current Web Auth Summary

This audit inspected the existing web/backend project at `D:\Taskly`. The mobile app was not connected to auth and no backend code was changed.

Files inspected:

- `D:\Taskly\middleware.ts`
- `D:\Taskly\prisma\schema.prisma`
- `D:\Taskly\src\app\actions.ts`
- `D:\Taskly\src\app\auth\actions.ts`
- `D:\Taskly\src\app\login\LoginClient.tsx`
- `D:\Taskly\src\app\register\page.tsx`
- `D:\Taskly\src\app\register\pro\page.tsx`
- `D:\Taskly\src\app\dashboard\page.tsx`
- `D:\Taskly\src\lib\auth-user.ts`
- `D:\Taskly\src\lib\customer-auth.ts`
- `D:\Taskly\src\lib\tasker-auth.ts`
- `D:\Taskly\src\lib\admin-auth.ts`
- `D:\Taskly\src\lib\user-capabilities.ts`
- `D:\Taskly\src\lib\tasker-verification.ts`
- `D:\Taskly\src\lib\password-policy.ts`
- `D:\Taskly\src\lib\rate-limit.ts`
- `D:\Taskly\src\i18n\config.ts`
- `D:\Taskly\src\app\api\tasker\onboarding\route.ts`
- `D:\Taskly\src\app\api\notifications\push-subscriptions\route.ts`
- `D:\Taskly\src\app\api\cities\route.ts`

### User Identity

The web app uses a Prisma `User` model with:

- `id`, `firstName`, `lastName`, `email`, `password`, `phone`
- `role` enum with `CUSTOMER` and `ADMIN`
- `sessionVersion` for session invalidation
- Core Tasker flags/fields such as `isTasker`, `taskerVerificationStatus`, `stripeAccountId`, `stripeChargesEnabled`, `stripePayoutsEnabled`, and `stripeRequirementsCurrentlyDueCount`
- Relations to `TaskerProfile` and `ProProfile`

The schema stores password hashes in `User.password`. Login compares passwords with `bcrypt.compare`.

### Login

Web login is implemented as a server action: `loginUser` in `src/app/actions.ts`.

Observed behavior:

- Normalizes email.
- Loads user by email.
- Compares password with `bcrypt`.
- Builds a session payload containing user identity, role, tasker fields, Stripe/tasker verification fields, and Pro profile status.
- Sets an HTTP-only `taskly_session` cookie for 7 days.
- Returns `{ success, user }` to the client.

The login UI in `src/app/login/LoginClient.tsx` calls `loginUser`, then routes based on `getUserCapabilities`.

### Logout

Web logout is implemented as `logoutUser` in `src/app/actions.ts`.

Observed behavior:

- Deletes the `taskly_session` cookie.
- Revalidates `/`.
- Returns `{ success: true }`.

### Registration

Registration is server-action based in `src/app/actions.ts`:

- `registerCustomer`
- `registerTasker`
- `registerProApplicant`

The unified registration page at `src/app/register/page.tsx` selects the role mode and calls one of those actions.

Observed behavior:

- Password policy is validated by `validatePasswordPolicy`.
- Passwords are hashed with `bcrypt.hash`.
- Customer registration creates a `User` with `role: "CUSTOMER"`.
- Tasker registration creates or updates a `User`, sets `isTasker: true`, and stores tasker-related fields.
- Pro registration creates a `User` plus a `ProProfile` with status `DRAFT`.
- Registration sets the same HTTP-only `taskly_session` cookie.
- Welcome email language is based on the `taskly_locale` cookie.

### Sessions, Cookies, and Invalidation

The web session is currently an HTTP-only cookie named `taskly_session`.

Observed behavior:

- Cookie payload is JSON, not a JWT in the inspected files.
- Cookie is `httpOnly`, `secure` in production, path `/`, max age 7 days.
- Session payload includes `id` and `sessionVersion`.
- Server helpers re-read the user from the database and compare `sessionVersion`.
- Password reset and password changes increment `sessionVersion`, invalidating old sessions.

Important mobile note: mobile should not rely on or reproduce the internal cookie JSON shape. Dedicated mobile API routes should return a mobile-safe session shape.

### Roles and Permissions

Role/capability helpers are in `src/lib/user-capabilities.ts`.

Observed behavior:

- `role === "ADMIN"` means admin.
- `isCoreTasker` is true when `user.isTasker` or `taskerProfile` exists.
- Pro capability is based on `proProfile` / `proProfileId` / `isProApplicant`.
- Approved Pro is based on `proProfile.status === "APPROVED"`.
- `preferredDashboard` chooses Pro first, then Core Tasker, then Admin, then Customer.
- `isCustomer` currently returns true for all users in `getUserCapabilities`.

Mobile should not copy this logic directly. The backend should expose derived `workspaceAccess`, `providerCapabilities`, `permissions`, and `nextAction`.

### Customer, Tasker, Pro, and Admin Guards

Observed guards:

- `requireAuthenticatedUser` in `src/lib/auth-user.ts`
- `requireCustomerUser` in `src/lib/customer-auth.ts`
- `requireTaskerUser` in `src/lib/tasker-auth.ts`
- `requireAdmin` in `src/lib/admin-auth.ts`

Each helper reads `taskly_session`, parses it, checks `id`, fetches the user from Prisma, and compares `sessionVersion` when present.

Customer guard allows `CUSTOMER` and `ADMIN` modes for web compatibility. Mobile should keep Admin web-only and should not expose an admin workspace.

### Core Tasker Status

Core Tasker readiness is not only `isTasker`.

Relevant fields and helpers:

- `User.isTasker`
- `TaskerProfile.status`
- `User.taskerVerificationStatus`
- `stripeAccountId`
- `stripeChargesEnabled`
- `stripePayoutsEnabled`
- `stripeRequirementsCurrentlyDueCount`
- `isTaskerVerified` in `src/lib/tasker-verification.ts`

`isTaskerVerified` requires:

- Stripe account id exists.
- `taskerVerificationStatus === "VERIFIED"`.
- Charges enabled.
- Payouts enabled.
- No currently due Stripe requirements.

Mobile mapping should treat Core payout/readiness as backend-derived. Stripe verification applies to Core payouts, not Pro-only access.

### Pro Status

Taskly Pro is represented by `ProProfile`.

Relevant fields:

- `ProProfile.status`: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`
- `ProCategoryApproval.status`: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- `ProProfile.internalPhone` and `internalEmail` exist in the schema and must not be exposed to customers before allowed unlock/contact flow.

A Pro is not automatically a Core Tasker. A Core Tasker is not automatically a Pro.

### Protected Routes

The root dashboard route calls `getCurrentUser`, then `getUserCapabilities`, then redirects to the preferred web dashboard.

Admin protection uses:

- `middleware.ts` for `/admin/:path*`, checking whether the cookie parses with `role === "ADMIN"`.
- `requireAdmin` in admin layouts/pages/actions, which verifies the user in the database and checks `sessionVersion`.

The middleware is a coarse early redirect; database-backed checks still happen in admin code.

### Existing API Routes Related to Auth

No dedicated `/api/mobile/auth/*` routes were found.

Existing JSON API routes that inspect sessions include:

- `src/app/api/tasker/onboarding/route.ts`
- `src/app/api/notifications/push-subscriptions/route.ts`

Both parse `taskly_session`, fetch the user from Prisma, and compare `sessionVersion`.

### Password Reset and Session Invalidation

Password reset is implemented in `src/app/auth/actions.ts`.

Observed behavior:

- `PasswordResetToken` stores hashed reset tokens.
- Rate limiting is applied by IP, email, and token.
- Password reset validates the new password, hashes it, increments `sessionVersion`, marks the token used, deletes `taskly_session`, and logs audit events.

Password changes in `src/app/actions.ts` also increment `sessionVersion`.

### Locale and Language Preference

The web app uses `next-intl` and locale helpers in `src/i18n/config.ts`.

Observed behavior:

- Supported locales are `en` and `bg`.
- Locale cookie is `taskly_locale`.
- Locale local storage key is `taskly_locale`.
- Registration/welcome emails inspect the locale cookie.
- I did not find a persisted `preferredLocale` field on `User` in the Prisma schema.

Mobile should include `preferredLocale` in its session contract, but the backend may need to derive it from cookie, request headers, or a future user profile field.

## 2. Mobile Auth Requirements

The mobile app needs:

- Login with email/password or the existing supported auth method.
- Logout.
- Restore session on app open.
- Refresh or validate session.
- Fetch current user/session.
- Return workspace access:
  - `customer: boolean`
  - `provider: boolean`
- Return provider capabilities:
  - `coreTaskerStatus: "none" | "applicant" | "approved" | "needsStripe"`
  - `proStatus: "none" | "draft" | "pending" | "approved"`
- Return an admin flag only for informational/blocked routing if needed. There must be no admin mobile workspace.
- Return preferred locale.
- Return notification preferences later.

Mobile should receive backend-derived `permissions` and `nextAction` fields rather than calculating sensitive capability decisions from raw database-like fields.

## 3. Recommended Mobile Session Response Shape

Recommended response for:

`GET /api/mobile/auth/session`

```json
{
  "user": {
    "id": "123",
    "displayName": "Ahmed Ahmedov",
    "email": "ahmed@example.com",
    "preferredLocale": "en"
  },
  "workspaceAccess": {
    "customer": true,
    "provider": false
  },
  "providerCapabilities": {
    "coreTaskerStatus": "none",
    "proStatus": "none"
  },
  "permissions": {
    "canPostTask": true,
    "canPostProRequest": true,
    "canViewCoreTasks": false,
    "canViewProRequests": false
  },
  "nextAction": {
    "type": "none",
    "label": null,
    "href": null
  }
}
```

This response must be generated by backend logic. Mobile must not infer workspace access, Core readiness, Pro approval, Stripe readiness, unlock eligibility, or payment/cancellation permissions from raw local assumptions.

Suggested status mapping:

- `coreTaskerStatus: "none"`: no Core Tasker profile/intent.
- `coreTaskerStatus: "applicant"`: tasker profile exists or onboarding is in review but Core payout/work readiness is not complete.
- `coreTaskerStatus: "needsStripe"`: Core tasker is otherwise approved enough to continue, but Stripe requirements block Core payouts/tasks.
- `coreTaskerStatus: "approved"`: backend says Core Tasker can access matching Core work.
- `proStatus: "none"`: no Pro profile.
- `proStatus: "draft"`: Pro profile exists as draft or rejected-editable state.
- `proStatus: "pending"`: Pro profile pending review.
- `proStatus: "approved"`: Pro profile and required category/city approvals allow Pro request visibility.

## 4. Proposed Mobile Auth API Routes

### POST `/api/mobile/auth/login`

- Purpose: Authenticate email/password and create a mobile session.
- Request shape: `{ "email": string, "password": string }`
- Response shape: `{ "session": MobileSession, "tokens"?: TokenEnvelope }`
- Security notes:
  - Return generic credential errors.
  - Apply backend rate limiting.
  - Reuse password policy and `bcrypt` validation.
  - Do not return raw password hashes or internal verification details.
- Reuse existing web logic: can reuse `loginUser` validation concepts, but should not directly expose the server action.
- Likely needs new backend route: yes.

### POST `/api/mobile/auth/logout`

- Purpose: End the mobile session.
- Request shape:
  - Cookie strategy: empty body.
  - Token strategy: optional refresh token/device id if needed.
- Response shape: `{ "success": true }`
- Security notes:
  - Must clear server-side refresh token/session if token strategy is used.
  - Mobile must clear local token/session state.
- Reuse existing web logic: can reuse `logoutUser` behavior conceptually.
- Likely needs new backend route: yes.

### GET `/api/mobile/auth/session`

- Purpose: Return current mobile-safe user/session/workspace state.
- Request shape: authenticated request via cookie or bearer token.
- Response shape: `MobileSession`.
- Security notes:
  - Must verify session backend-side.
  - Must compare `sessionVersion`.
  - Must derive `workspaceAccess`, `providerCapabilities`, `permissions`, and `nextAction` server-side.
  - Must not expose admin workspace or Pro contact internals.
- Reuse existing web logic: can reuse `getCurrentUser`, `getUserCapabilities`, tasker verification helpers, and Pro profile status logic.
- Likely needs new backend route: yes.

### POST `/api/mobile/auth/refresh`

- Purpose: Refresh short-lived access token if token strategy is chosen.
- Request shape: `{ "refreshToken": string }` or secure cookie refresh token.
- Response shape: `{ "accessToken": string, "expiresAt": string, "session": MobileSession }`
- Security notes:
  - Refresh tokens should be rotated and revocable.
  - Refresh tokens should be stored hashed server-side if persisted.
  - Must check `sessionVersion`.
- Reuse existing web logic: can reuse user/sessionVersion lookup, but token storage is new.
- Likely needs new backend route: yes, if token strategy is chosen.

### POST `/api/mobile/auth/register/customer`

- Purpose: Register a customer account from mobile if mobile registration is enabled.
- Request shape: `{ "firstName": string, "lastName": string, "email": string, "phone": string, "password": string, "preferredLocale"?: "en" | "bg" }`
- Response shape: `{ "session": MobileSession, "tokens"?: TokenEnvelope }`
- Security notes:
  - Reuse backend password policy.
  - Rate limit registration attempts.
  - Return safe duplicate-account errors.
- Reuse existing web logic: can reuse `registerCustomer` business behavior, but should expose through a dedicated JSON API route.
- Likely needs new backend route: yes.

### POST `/api/mobile/auth/register/provider-start`

- Purpose: Create an initial provider-capable account or start provider onboarding from mobile.
- Request shape: `{ "mode": "core" | "pro", "firstName": string, "lastName": string, "email": string, "phone": string, "password": string, "preferredLocale"?: "en" | "bg" }`
- Response shape: `{ "session": MobileSession, "tokens"?: TokenEnvelope, "nextAction": NextAction }`
- Security notes:
  - Core and Pro flows must remain distinct.
  - Pro-only flow must not require Stripe verification.
  - Core payout readiness must remain backend-derived.
- Reuse existing web logic: can reuse `registerTasker` and `registerProApplicant` concepts, but route should be mobile-specific.
- Likely needs new backend route: yes.

## 5. Cookie vs Token Strategy

### Option A: HTTP-only Cookie Session

Pros:

- Matches the existing web implementation.
- Server-side revocation through `sessionVersion` already exists.
- HTTP-only cookies reduce JavaScript token exposure on web.
- Existing API routes already demonstrate cookie parsing and database session validation.

Cons for Expo/native mobile:

- Native fetch cookie persistence can be inconsistent across platforms and environments.
- Cookie handling is harder to inspect/debug in Expo Go.
- CSRF protection becomes important for cookie-authenticated mutating routes.
- Mobile logout/restore flows may be less predictable than explicit token storage.

CSRF considerations:

- Cookie-authenticated POST/PATCH/DELETE routes need CSRF protection or same-site/origin controls.
- Native mobile clients do not behave like normal browsers, so CSRF assumptions must be designed deliberately.

### Option B: Short-Lived Access Token + Refresh Token

Pros:

- Predictable for native mobile.
- Works cleanly with `Authorization: Bearer`.
- Easy to clear on logout.
- Easier to support app-open session restore and refresh.
- Allows mobile routes to be independent of browser cookie behavior.

Cons:

- Requires secure token storage.
- Requires refresh token issuance, rotation, revocation, and likely DB storage.
- More backend work than reusing the current cookie directly.
- Token leakage risk must be handled with short lifetimes and secure storage.

Secure storage needs:

- Use `expo-secure-store` or equivalent if token strategy is chosen.
- Do not install it in this audit phase.
- Never store raw passwords.

### Option C: Hybrid Approach

Hybrid can make sense if:

- Web keeps HTTP-only cookies.
- Mobile uses bearer tokens.
- Backend exposes shared session derivation logic but separate transport adapters.

This avoids forcing native mobile into browser cookie behavior while preserving the web auth model.

### Recommendation

Use a hybrid approach:

- Keep existing web cookie auth for web.
- Add dedicated `/api/mobile/auth/*` routes for mobile.
- Use short-lived mobile access tokens plus refresh tokens stored with secure storage.
- Store refresh token records server-side and tie them to `User.sessionVersion`.
- Reuse backend role/session derivation logic so mobile receives `workspaceAccess`, `providerCapabilities`, `permissions`, and `nextAction`.

If the team wants the fastest prototype first, cookie auth can be tested against Expo Go, but the production mobile path should prefer a token-based native session.

## 6. Role/Workspace Mapping

Backend should determine:

### Customer Workspace Access

Customer access should be true for normal customer-capable accounts. Existing web `getUserCapabilities` treats all users as customer-capable; mobile can follow that only if product confirms dual workspace access should always include customer.

### Provider Workspace Access

Provider access should be true if any provider capability exists:

- Core Tasker applicant/profile/onboarding state.
- Core Tasker approved/needs Stripe state.
- Pro profile draft/pending/approved state.

### Core Tasker Status

Recommended backend mapping:

- `none`: no Core Tasker profile and no Core intent.
- `applicant`: Core onboarding/profile exists but review or required setup is incomplete.
- `needsStripe`: Core profile/review is acceptable but Stripe payout requirements are incomplete.
- `approved`: backend says the user can view/manage Core tasks.

Stripe verification is required for Core payouts only.

### Pro Status

Recommended backend mapping:

- `none`: no Pro profile.
- `draft`: Pro profile exists as draft or editable not-yet-approved state.
- `pending`: Pro profile is pending review.
- `approved`: backend says Pro profile and required category/city approvals allow Pro request access.

Pro-only flow does not require Stripe verification.

### Dual Provider State

A dual provider is a user with both Core capability and Pro capability. The Provider Workspace should show both modes, but Core and Pro screens/actions remain separate.

Clarifications:

- A Pro is not automatically a Core Tasker.
- A Core Tasker is not automatically a Pro.
- Admin remains web-only.

## 7. Security Guardrails

- No secrets in the mobile app.
- No raw password persistence.
- No role decisions only on mobile.
- No payment eligibility decisions on mobile.
- Mobile receives `permissions`, `workspaceAccess`, `providerCapabilities`, and `nextAction` from backend.
- Logout must clear local tokens/session state.
- Failed auth should return safe generic errors.
- Rate limiting and brute-force protection belong backend-side.
- All sensitive routes must verify session backend-side.
- Mobile must not expose Pro phone/email before allowed unlock/contact flow.
- Mobile must not trust locally cached permissions for sensitive mutations.
- Session refresh must re-check `sessionVersion` or equivalent server-side revocation state.

## 8. Mobile Implementation Sequence

1. Add secure token/session storage dependency if token strategy is chosen.
2. Add auth endpoint types in mobile.
3. Add auth API functions under `src/lib/api/auth.ts`.
4. Add `AuthProvider`/session context.
5. Replace mock session only at the app shell level.
6. Keep Customer/Provider screens guarded by backend `workspaceAccess`.
7. Add logout.
8. Add login screen.
9. Add registration later.
10. Add role-specific onboarding continuation later.

## Phase 8 Mobile Session Endpoint

The first backend auth endpoint has been added at:

`GET /api/mobile/auth/session`

It returns a mobile-safe session summary when the existing `taskly_session` cookie is valid and returns `401` with a safe JSON error when no valid session exists.

Authenticated response shape:

```json
{
  "user": {
    "id": "123",
    "displayName": "Ahmed Ahmedov",
    "email": "ahmed@example.com",
    "preferredLocale": "en"
  },
  "workspaceAccess": {
    "customer": true,
    "provider": true
  },
  "providerCapabilities": {
    "coreTaskerStatus": "approved",
    "proStatus": "pending"
  },
  "permissions": {
    "canPostTask": true,
    "canPostProRequest": true,
    "canViewCoreTasks": true,
    "canViewProRequests": false
  },
  "nextAction": {
    "type": "wait_for_pro_review",
    "label": "Pro application under review",
    "href": "/provider/start"
  }
}
```

The mobile wrapper is `getCurrentSession()` in `src/lib/api/auth.ts`. It calls the centralized endpoint registry and returns `ApiResult<UserSession>`.

Current limitation: this cookie-based endpoint is useful for web/local validation and for confirming the backend session contract. Production native mobile auth will likely still need a token-based strategy with secure storage and dedicated login/logout/refresh routes.

Screens still use the mock session until a dedicated AuthProvider/session shell phase replaces the app-level session source.

## 9. Risks/Open Questions

- Current web auth uses server actions for login/register/logout/current user; mobile likely needs new dedicated Next.js API routes.
- Cookie-authenticated API routes exist, but no `/api/mobile/auth/*` routes were found.
- Password auth is currently validated with `bcrypt` and password policy checks; mobile should reuse those backend checks.
- Session invalidation exists through `User.sessionVersion`.
- Refresh tokens would require a new backend storage/revocation design.
- Social login was not found in inspected files; confirm whether it is planned.
- Preferred Bulgarian/English locale appears cookie/local-storage based; no persisted `preferredLocale` user field was found.
- Local physical phone testing requires backend served on a LAN IP, not plain `localhost`.
- Existing admin middleware checks cookie role before database verification, while admin pages/actions use `requireAdmin`; mobile must not rely on admin cookie payloads and must not expose admin workspace.
- Mobile auth errors should not leak whether an email exists.
- Dedicated mobile API routes should avoid returning bulky or sensitive web session payload fields such as internal Pro contact details.
