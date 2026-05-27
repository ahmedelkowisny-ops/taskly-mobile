# Phase 37A - Premium Entry, Auth Role Selection & Navigation Blueprint

## Product Owner Design Vision

- The first screen should feel like a polished mobile onboarding/auth experience, not a dashboard.
- The layout should use a strong branded top visual area and a clean white rounded lower panel.
- The tone should feel premium, friendly, and trustworthy for users in Bulgaria who may be ready to pay for local help.
- Public copy should use Taskly for normal small tasks and Taskly Pro for bigger professional projects.
- Public copy should avoid internal words such as workspace, session, demo, admin, backend, or phase.

## Entry/Auth Screen Blueprint

- Top area:
  - One clean Taskly wordmark on the left.
  - BG/EN language toggle in the top-right.
  - Trust headline: "Trusted help for your home."
  - Short marketplace positioning without implying Taskly performs the work.
  - Compact trust chips:
    - Payment protected.
    - Approved Pros.
    - Local help.
- Lower panel:
  - White rounded panel.
  - Compact headline and helper text.
  - Three role cards for login.
  - Register line that switches the panel into registration role choices.

## Login Role Selection Blueprint

- Roles:
  - Customer
  - Tasker
  - Pro Tasker
- EN labels:
  - Continue as Customer
  - Continue as Tasker
  - Continue as Pro Tasker
- BG labels:
  - Вход като клиент
  - Вход като Tasker
  - Вход като Pro Tasker
- Role helper text:
  - Customer: post tasks and compare trusted help.
  - Tasker: find small nearby jobs.
  - Pro Tasker: respond to larger professional projects.
- Current implementation passes a UI-only role hint to the existing login screen. It does not change backend auth, roles, or permissions.

## Register Role Selection Blueprint

- The entry screen can switch into registration role selection from the "Create an account" line.
- Registration choices:
  - Create customer account
  - Register as Tasker
  - Apply as Pro Tasker
- BG choices:
  - Създай клиентски профил
  - Регистрирай се като Tasker
  - Кандидатствай като Pro Tasker
- Supporting copy stays short and non-technical.
- Full registration creation remains deferred until a dedicated auth/registration phase reviews backend contracts.

## Language Toggle Rules

- The BG/EN toggle must be visible on every public/auth screen.
- It must stay above the fold and not require scrolling.
- It must use the existing `I18nProvider` and SecureStore persistence.
- Screens with the toggle must subscribe to `useI18n()` so text updates immediately.
- EN and BG should not be mixed on the same public/auth screen.

## Customer Navigation Recommendation

- Bottom navigation should be minimal and icon-led:
  - Home
  - Tasks
  - Post
  - Chat
  - Profile
- A burger/sidebar drawer should hold full navigation:
  - Home
  - My Taskly tasks
  - My Taskly Pro projects
  - Post Taskly task
  - Start Taskly Pro project
  - Chat
  - Admin/support messages
  - Profile
  - Settings
  - Language
  - Logout
- All navigation items should use icons from the existing icon library.
- Taskly task surfaces should use blue accents.
- Taskly Pro surfaces should use gold/orange accents.

## Provider Navigation Recommendation

- Bottom navigation should stay minimal:
  - Home
  - Tasks
  - Pro
  - Chat
  - Profile
- A burger/sidebar drawer should include:
  - Taskly tasks
  - Taskly Pro projects
  - Responses
  - Site visits
  - Messages
  - Profile
  - Settings
  - Support
  - Logout
- Provider navigation should keep Taskly and Taskly Pro visually distinct without splitting the app into separate products.

## Taskly vs Taskly Pro Visual Rules

- Taskly:
  - Use Taskly blue.
  - Use for customers posting small tasks and Taskers finding nearby jobs.
- Taskly Pro:
  - Use orange/gold accents.
  - Use for larger professional projects, approved Pros, comparison, and site visits.
- Keep shared typography, spacing, and card shape unified so the app still feels like one brand.

## Trust/Copy Rules For Paying Users

- Use:
  - "Trusted help for your home."
  - "Payment protected."
  - "Approved Pros."
  - "Local help."
- Avoid:
  - Any wording that says Taskly performs the service.
  - Guaranteed renovation outcomes.
  - "Pay to get phone numbers."
  - "Escrow."
  - Internal product/version labels.

## Implementation Changes Made

- Replaced the public entry screen with a premium role-based onboarding layout.
- Added role-selection cards for Customer, Tasker, and Pro Tasker.
- Added a registration-choice mode inside the entry lower panel.
- Kept BG/EN toggle visible at the top-right of entry and login.
- Added a wordmark-only logo option for public/auth top bars so the header does not show duplicate icons.
- Reduced hero height and replaced large trust cards with compact chips.
- Added role context to the existing login screen when a role is selected.
- Removed public entry workspace/session/debug card patterns.
- Added EN/BG i18n keys for entry, login role, registration role, and trust copy.
- No backend, payment, refund, payout, admin, or API contract changes were made.

## Deferred Next Phases

- Dedicated mobile registration implementation after backend registration/auth contracts are reviewed.
- Customer home navigation redesign with minimal bottom nav and drawer/sidebar.
- Provider navigation redesign with minimal bottom nav and drawer/sidebar.
- Real-device visual QA on narrow Android and iPhone sizes.
- Final logo/splash polish after all brand assets are approved.
