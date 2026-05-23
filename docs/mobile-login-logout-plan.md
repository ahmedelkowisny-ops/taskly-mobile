# Taskly Mobile Login/Logout Plan

Phase 10A is a design and implementation plan only. No login routes, logout routes, refresh tokens, migrations, secure storage, or login UI are implemented in this phase.

## A) Current Auth Foundation

The existing web/backend project at `D:\Taskly` uses custom authentication built around an HTTP-only `taskly_session` cookie.

Files inspected:

- `D:\Taskly\src\app\actions.ts`
- `D:\Taskly\src\app\auth\actions.ts`
- `D:\Taskly\src\lib\auth-user.ts`
- `D:\Taskly\src\lib\password-policy.ts`
- `D:\Taskly\src\lib\rate-limit.ts`
- `D:\Taskly\prisma\schema.prisma`
- `D:\Taskly\middleware.ts`
- `D:\Taskly\src\app\api\mobile\auth\session\route.ts`

What exists today:

- Web login uses `loginUser` in `src/app/actions.ts`.
- Passwords are verified with `bcrypt.compare`.
- Registration and password changes hash passwords with `bcrypt.hash`.
- Web logout deletes the `taskly_session` cookie.
- The session cookie payload includes user id and `sessionVersion`.
- Backend helpers parse the cookie, fetch the user from Prisma, and reject stale sessions when `sessionVersion` does not match.
- Password reset and password changes increment `User.sessionVersion`.
- Password reset tokens are stored hashed in `PasswordResetToken.tokenHash`.
- Rate limiting exists through `enforceRateLimit` and the `RateLimit` Prisma model.
- Admin route protection exists for web only; mobile must not add an admin workspace.
- `GET /api/mobile/auth/session` exists and returns a mobile-safe session summary from the existing cookie.
- The mobile app has `AuthProvider`, `useAuth`, `getCurrentSession()`, and demo mode.

What is missing for native mobile login/logout:

- No mobile login route.
- No mobile logout route.
- No mobile refresh route.
- No mobile token issuance or verification utilities.
- No Prisma model for mobile refresh tokens.
- No secure mobile token storage.
- No mobile login screen.
- No route guarding based on backend `workspaceAccess`.

## B) Recommended Native Mobile Auth Model

Recommendation: use a hybrid model.

- Keep the existing HTTP-only cookie auth for web.
- Add native mobile auth with short-lived access tokens and refresh tokens.
- Store refresh tokens hashed in the backend database.
- Store tokens on the device later with `expo-secure-store`.
- Reuse backend session derivation so mobile receives `workspaceAccess`, `providerCapabilities`, `permissions`, and `nextAction`.

Why this is the best fit:

- Cookie auth is good for the current web app and should remain intact.
- Native Expo apps are more predictable with `Authorization: Bearer` access tokens than browser cookie persistence.
- Access tokens keep normal API calls simple and short-lived.
- Refresh tokens allow app-open session restore without keeping a long-lived access token.
- `sessionVersion` can continue to invalidate all sessions after password reset/change.
- The backend remains the only source of truth for workspace access and sensitive decisions.

Cookie-based mobile auth is acceptable for local validation of `/api/mobile/auth/session`, but it is not the recommended production native strategy.

## C) Backend Changes Needed

### `POST /api/mobile/auth/login`

Purpose: authenticate a mobile user with email/password and issue a mobile session.

Request body:

```json
{
  "email": "user@example.com",
  "password": "plain password",
  "deviceName": "Ahmed's Android",
  "preferredLocale": "en"
}
```

Success response:

```json
{
  "accessToken": "...",
  "accessTokenExpiresAt": "2026-05-23T12:15:00.000Z",
  "refreshToken": "...",
  "refreshTokenExpiresAt": "2026-06-22T12:00:00.000Z",
  "session": {
    "user": {
      "id": "123",
      "displayName": "Ahmed Ahmedov",
      "email": "user@example.com",
      "preferredLocale": "en"
    },
    "workspaceAccess": {
      "customer": true,
      "provider": true
    },
    "providerCapabilities": {
      "coreTaskerStatus": "none",
      "proStatus": "draft"
    },
    "permissions": {
      "canPostTask": true,
      "canPostProRequest": true,
      "canViewCoreTasks": false,
      "canViewProRequests": false
    },
    "nextAction": {
      "type": "continue_pro_application",
      "label": "Continue Pro application",
      "href": "/provider/start"
    }
  }
}
```

Failure response:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password."
  }
}
```

Security and behavior:

- Normalize email the same way web login does.
- Verify password with `bcrypt.compare`.
- Return generic credential errors.
- Apply backend rate limiting by IP and normalized email.
- Do not change current web login behavior.
- Do not reuse the server action directly as a public API handler; extract shared validation/session derivation helpers if needed.
- Check the current user `sessionVersion` and store it with the refresh-token record.
- Return the same mobile-safe session shape as `/api/mobile/auth/session`.

### `POST /api/mobile/auth/logout`

Purpose: revoke the current mobile refresh token and let the app clear local tokens.

Request:

- `Authorization: Bearer <accessToken>` when available.
- Refresh token in body if refresh-token revocation should identify the exact record:

```json
{
  "refreshToken": "..."
}
```

Response:

```json
{
  "success": true
}
```

Behavior:

- Hash the provided refresh token and revoke the matching DB record.
- If access token is valid, backend can also revoke all active refresh tokens for that session/device if requested later.
- Return success even if the token was already missing/revoked to keep logout idempotent.
- Mobile clears local access and refresh tokens after a successful or locally forced logout.

### `POST /api/mobile/auth/refresh`

Purpose: exchange a valid refresh token for a new short-lived access token and rotated refresh token.

Request body:

```json
{
  "refreshToken": "..."
}
```

Success response:

```json
{
  "accessToken": "...",
  "accessTokenExpiresAt": "2026-05-23T12:15:00.000Z",
  "refreshToken": "...",
  "refreshTokenExpiresAt": "2026-06-22T12:00:00.000Z",
  "session": {}
}
```

Behavior:

- Hash the incoming refresh token and find a non-revoked, non-expired record.
- Fetch the user and compare stored token `sessionVersion` with current `User.sessionVersion`.
- Rotate refresh tokens on every refresh:
  - Mark old token `revokedAt`.
  - Create a new hashed refresh token record.
  - Return the new plain refresh token only once.
- Update `lastUsedAt`.
- Reuse-detection should revoke the token family if an already-revoked refresh token is presented.
- Return safe generic errors for invalid, expired, revoked, or stale tokens.

### `GET /api/mobile/auth/session`

Current behavior: accepts the existing web `taskly_session` cookie.

Needed later if token strategy is chosen:

- Accept `Authorization: Bearer <accessToken>`.
- Validate access token signature, expiry, user id, token session id/family id, and `sessionVersion`.
- Continue accepting the web cookie so browser/local validation remains useful.
- Return the same mobile-safe session shape from shared backend session derivation.
- Keep no-cache headers.
- Never expose admin mobile permissions or Pro contact internals.

## D) Token/Session Storage Design

Recommended access token lifetime:

- 10 to 15 minutes.

Recommended refresh token lifetime:

- 30 days for normal mobile sessions.
- Consider a shorter lifetime for early launch if operational monitoring is still limited.

Storage and invalidation:

- Store refresh tokens hashed in the database, never plaintext.
- Store only the plaintext refresh token on the device, later using `expo-secure-store`.
- Access tokens can be kept in memory and persisted only if the team accepts that tradeoff; safer default is in-memory access token plus secure refresh token.
- Include `sessionVersion` on refresh-token records.
- Password reset/change invalidates mobile sessions because `User.sessionVersion` increments and no longer matches stored token records.
- Logout current device revokes the current refresh token.
- Logout all devices can either increment `sessionVersion` or revoke all refresh-token records for the user.
- Never store raw passwords.
- Never log access tokens, refresh tokens, or password values.

Token family/session id:

- Include a random `familyId` or `sessionId` on refresh-token records to support rotation and reuse detection.
- If a revoked token in a family is reused, revoke the active tokens in that family.

## E) Prisma/Data Model Impact

If token auth is implemented, add a backend Prisma model such as `MobileRefreshToken` or `UserSessionToken`.

Proposed fields:

```prisma
model MobileRefreshToken {
  id             String    @id @default(cuid())
  userId         Int
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash      String    @unique @db.Char(64)
  familyId       String    @db.VarChar(64)
  sessionVersion Int
  deviceName     String?   @db.VarChar(120)
  userAgent      String?   @db.VarChar(255)
  ipAddress      String?   @db.VarChar(64)
  createdAt      DateTime  @default(now())
  expiresAt      DateTime
  revokedAt      DateTime?
  lastUsedAt     DateTime?

  @@index([userId])
  @@index([familyId])
  @@index([expiresAt])
  @@index([revokedAt])
  @@map("mobile_refresh_tokens")
}
```

Why hash refresh tokens:

- A database leak should not immediately expose usable long-lived mobile credentials.
- The backend only needs to compare hashes, similar to password reset tokens.
- Plain refresh tokens should be shown only once to the mobile client at issuance/rotation time.

No migration is added in Phase 10A.

## F) Mobile App Changes Needed Later

Future mobile implementation should:

- Install `expo-secure-store`.
- Create `src/lib/auth/tokenStorage.ts`.
- Add `login`, `logout`, and `refreshSession` API wrappers in `src/lib/api/auth.ts`.
- Allow API requests to attach the current access token.
- Update `AuthProvider` with login/logout/refresh behavior.
- Add `app/login.tsx`.
- Update welcome screen with a real login CTA.
- Keep demo mode available in development until production auth is fully stable.
- Add route guards later based on backend `workspaceAccess` and `permissions`.
- Keep `/customer/*` and `/provider/*` route groups, with no admin route.

## G) Security Guardrails

- Use generic login error messages.
- Apply rate limiting backend-side.
- Do not store secrets in the mobile bundle.
- Do not log raw passwords, access tokens, or refresh tokens.
- Require HTTPS in production.
- Send access token only through the `Authorization` header.
- Send refresh token only to refresh/logout endpoints.
- Backend must validate `sessionVersion`.
- Password reset/change must invalidate existing mobile sessions.
- Admin remains web-only.
- Role, workspace, payment, matching, cancellation, dispute, and Pro unlock permissions must come from backend response fields.
- Do not expose Pro phone/email before the allowed unlock/contact flow.
- Keep existing web cookie auth intact.

## H) Implementation Sequence

1. Add Prisma model/migration for hashed mobile refresh tokens if the token strategy is confirmed.
2. Add backend token utilities for random token generation, hashing, access-token signing, verification, rotation, and revocation.
3. Update `/api/mobile/auth/session` to accept `Authorization: Bearer` access tokens while preserving cookie support.
4. Add `POST /api/mobile/auth/login`.
5. Add `POST /api/mobile/auth/refresh`.
6. Add `POST /api/mobile/auth/logout`.
7. Add mobile secure storage.
8. Add mobile auth API functions.
9. Add login screen.
10. Update `AuthProvider` to use login/logout/refresh.
11. Add route guarding later using backend `workspaceAccess`.
12. Add registration later.

## I) Testing Plan

Backend tests:

- Invalid credentials return generic failure.
- Valid credentials return tokens and mobile session shape.
- Revoked refresh token is rejected.
- Expired refresh token is rejected.
- `sessionVersion` mismatch after password reset/change invalidates refresh/session.
- Logout invalidates the refresh token.
- Refresh rotates token and revokes the prior token.
- Reused revoked refresh token revokes the token family.
- Admin user does not receive a mobile admin workspace.
- `/api/mobile/auth/session` works with Bearer token and still works with valid web cookie.

Mobile tests:

- App opens with no tokens.
- Login success stores tokens and loads session.
- Login failure shows safe error and does not store tokens.
- Session restores on app open through refresh/session.
- Backend unavailable shows error state.
- Logout clears secure storage and local session.
- Demo mode still works in development.
- Workspace navigation remains separate for Customer and Provider.

## J) Open Questions

- Exact access-token lifetime.
- Exact refresh-token lifetime.
- Whether access tokens should be memory-only or securely persisted.
- Device naming and whether users can manage devices.
- Whether multiple mobile devices are supported from launch.
- Whether to add "logout all devices" in the first auth release.
- Whether social login is planned later.
- Production API base URL and HTTPS deployment details.
- Local physical-device testing against the backend LAN IP.
- Whether refresh-token family reuse detection should force global `sessionVersion` increment.
- Whether preferred locale should become a persisted `User` field.

## Phase 10B Backend Foundation Implemented

The backend now has the first native mobile token-auth foundation:

- Prisma model: `MobileRefreshToken`
- Backend routes:
  - `POST /api/mobile/auth/login`
  - `POST /api/mobile/auth/refresh`
  - `POST /api/mobile/auth/logout`
  - `GET /api/mobile/auth/session` with Bearer-token support while preserving cookie fallback
- Access token lifetime: 15 minutes by default.
- Refresh token lifetime: 30 days by default.
- Refresh tokens are stored hashed in the database and rotate on refresh.

The mobile app is not connected to login/logout yet. The next mobile step is to add secure storage, mobile auth API functions for login/logout/refresh, and a login UI while keeping demo mode available during rollout.

## Phase 10C Mobile Login Shell Implemented

The mobile side now has:

- Expo SecureStore installed.
- SecureStore-backed token storage in `src/lib/auth/tokenStorage.ts`.
- Login/logout/refresh API wrappers in `src/lib/api/auth.ts`.
- AuthProvider restore, login, logout, refresh, and demo-mode flows.
- A first login screen at `/login`.

The backend routes already exist, but the next phase should test end-to-end login against the local backend using a real `EXPO_PUBLIC_TASKLY_API_BASE_URL`. Workspace route guarding should come later and must use backend `workspaceAccess` and `permissions`.

## Phase 11 Workspace Guidance Implemented

Login now feeds the workspace entry UI through `AuthProvider` session state. Customer and Provider route groups use `WorkspaceGuard`, and the welcome screen uses workspace cards driven by backend `workspaceAccess`, provider capabilities, permissions, and next actions.

The guards are not a security boundary. Backend routes must continue to enforce all sensitive access and business rules.
