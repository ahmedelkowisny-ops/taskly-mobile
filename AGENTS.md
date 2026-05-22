# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v53.0.0/ before writing any code.

# Taskly Mobile Rules

- This repository is the shared Expo React Native foundation for the Taskly Customer app and Taskly Provider app.
- Keep Admin web-only. Do not create admin mobile routes, screens, or navigation.
- Do not change backend business logic unless explicitly asked.
- Do not duplicate payment, matching, cancellation, dispute, role, or Pro unlock logic on mobile.
- Mobile must call the existing Taskly backend/API later; keep the backend server-authoritative.
- Keep Customer and Provider routes separate.
- In Provider, Core Tasker and Pro Tasker modes must be visibly separated.
- Do not require Stripe verification for a Pro-only flow.
- Do not expose Pro phone/email before the allowed unlock/contact flow.
- Do not use public or professional UI wording like "V1".
- Keep layouts mobile-friendly and suitable for Bulgarian text length.
- Every screen should support loading, empty, error, and unauthorized states when real data is added later.
