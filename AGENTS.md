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

# Mobile Auth Rules

- Do not implement auth by guessing.
- Inspect existing web auth before changing mobile auth behavior.
- Mobile auth must use dedicated backend routes.
- `/api/mobile/auth/session` is the first backend auth endpoint.
- Mobile screens should not directly call `/api/mobile/auth/session` until an AuthProvider/session shell is implemented.
- Do not replace mock UI state without a dedicated phase.
- Session, role, and workspace access must come from the backend.
- Do not store raw passwords or secrets.
- Use secure storage only for tokens if a token strategy is chosen.
- Admin is web-only. Do not add admin mobile screens or workspace routing.
