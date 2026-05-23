# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v53.0.0/ before writing any code.

# Taskly Mobile Rules

- Taskly mobile is one public Expo React Native app with role-based workspaces.
- The Customer workspace lives under `/customer/*`.
- The Provider workspace lives under `/provider/*`.
- Keep Admin web-only. Do not create admin mobile routes, screens, or navigation.
- The Provider workspace supports Core Taskers, Taskly Pro professionals, and users who may be both.
- Keep Customer and Provider screens clearly separated.
- Keep Core Tasks and Pro Requests visually and functionally separated inside Provider.
- Do not change backend business logic unless explicitly asked.
- Mobile must call the existing Taskly backend/API later; keep the backend server-authoritative.
- Do not duplicate payment, matching, cancellation, dispute, role, or Pro unlock logic on mobile.
- Do not require Stripe verification for a Pro-only flow.
- Do not expose Pro phone/email before the allowed unlock/contact flow.
- Do not use public or professional UI wording like "V1".
- Keep layouts mobile-friendly and suitable for Bulgarian text length.
- Every screen should support loading, empty, error, and unauthorized states when real data is added later.

# Mobile API Integration Rules

- Never call the database directly from mobile.
- Use a typed API client for backend communication.
- API calls must go through `src/lib/api/client.ts`.
- Endpoint paths should be centralized in `src/lib/api/endpoints.ts`.
- Screens must not hardcode API URLs.
- Never store secrets in the app bundle.
- Only `EXPO_PUBLIC_*` variables are available to the app and are not secret.
- Backend owns sensitive decisions and remains server-authoritative.
- Payment, cancellation, refund, matching, role, and Pro unlock logic must never be calculated only on mobile.
- Sensitive decisions must come from backend response fields such as `nextAction`, permissions, and eligibility flags.
- All API-connected screens need loading, empty, error, and unauthorized states.
- Customer read-only screens may call customer API wrappers only.
- Screens must use an `AuthProvider` token helper and must never read refresh tokens directly.
- Do not add mutations to read-only screens without a dedicated phase.
- Display backend `nextAction` values; do not invent sensitive eligibility on mobile.

# Mobile Auth Rules

- Do not implement auth by guessing.
- Inspect existing web auth before changing mobile auth behavior.
- Mobile auth must use dedicated backend routes.
- `/api/mobile/auth/session` is the first backend auth endpoint.
- Mobile screens should not directly call `/api/mobile/auth/session` until an AuthProvider/session shell is implemented.
- Do not replace mock UI state without a dedicated phase.
- `AuthProvider` is the only app-shell owner of session state.
- Screens should use `useAuth()` instead of calling the session endpoint directly.
- Demo mode is allowed until real login is implemented.
- Do not block routes with mobile-only assumptions; use backend `workspaceAccess` when enforcing later.
- Do not implement mobile login/logout without following `docs/mobile-login-logout-plan.md`.
- Do not store refresh tokens in plaintext.
- Do not log tokens or passwords.
- Do not bypass `sessionVersion` checks.
- Existing web cookie auth must remain intact.
- Session, role, and workspace access must come from the backend.
- Do not store raw passwords or secrets.
- Tokens must only be stored through `src/lib/auth/tokenStorage.ts`.
- Screens must use `AuthProvider` actions instead of calling auth API functions directly.
- Never log passwords or tokens.
- Demo mode must remain available during development.
- Do not implement registration without a dedicated phase.
- Use secure storage only for tokens if a token strategy is chosen.
- `WorkspaceGuard` is UI guidance only; backend must still enforce access.
- Do not use mobile guards as a security boundary.
- Workspace access must come from backend session response or demo mock only.
- Do not infer provider approval from local UI state.
- Admin is web-only. Do not add admin mobile screens or workspace routing.
