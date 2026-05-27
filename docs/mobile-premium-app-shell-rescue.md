# Phase 36A - Premium App Shell & Home Experience Rescue

## Product feedback addressed

- Language switcher was missing or too easy to miss on signed-in high-traffic screens.
- Public entry, customer home, and provider start/home surfaces showed internal workspace/session wording.
- Customer home used oversized, prototype-style cards and mixed hardcoded English with localized strings.
- Provider start/dashboard read like disabled setup/debug surfaces instead of a professional provider area.
- Bottom tabs could expose nested message thread routes as extra tabs, causing duplicated or clipped message labels.
- Admin-style explanations appeared on the public entry surface instead of a calm mobile-safe notice.

## Files inspected

- `app/_layout.tsx`
- `app/index.tsx`
- `app/login.tsx`
- `app/customer/_layout.tsx`
- `app/customer/home.tsx`
- `app/provider/_layout.tsx`
- `app/provider/start.tsx`
- `app/provider/dashboard.tsx`
- `src/components/taskly/LanguageToggle.tsx`
- `src/components/taskly/SessionStatusCard.tsx`
- `src/components/taskly/WorkspaceAccessCard.tsx`
- `src/components/taskly/ModeBadge.tsx`
- `src/lib/auth/workspaceAccess.ts`
- `src/lib/i18n/index.tsx`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/bg.ts`

## Changes made

- Added localized tab labels for customer and provider tab shells.
- Hid nested `messages/[threadId]` routes from bottom tabs to prevent duplicate message tabs.
- Kept the EN/BG language toggle visible on the public entry, customer home, provider start, provider dashboard, and login surfaces.
- Reworked the public entry screen into a calmer brand/workspace chooser without session/debug cards.
- Reworked customer home above the fold with a compact logo/language header, greeting, brand promise, compact stats, and two clear action cards.
- Reworked provider start with a compact language/header row, review/ready state messaging, and localized Taskly/Taskly Pro status cards.
- Reduced provider dashboard crowding by removing repeated debug-like guidance cards and keeping a cleaner summary plus Taskly/Taskly Pro cards.
- Localized ModeBadge and SessionStatusCard user-facing copy.
- Added a neutral admin-web-only notice for signed-in users without mobile customer/provider area access.

## Design rationale

- Entry screens now lead with Taskly trust and the next useful action instead of account diagnostics.
- Customer home separates normal Taskly tasks with blue accents and Taskly Pro projects with orange/gold accents.
- Provider start avoids disabled/developer language and explains review status in plain user terms.
- Bottom tabs use short labels only: Home/Tasks/Pro/Messages/Account and Начало/Задачи/Pro/Чат/Профил.
- The app shell now favors compact 24-28px screen titles, 18-22px card titles, and short CTAs suitable for Bulgarian text.

## Language toggle behavior

- The toggle uses the existing `I18nProvider` and SecureStore persistence.
- It appears before login on entry and login screens.
- It appears after login on customer home and provider start/dashboard.
- Screens using the toggle subscribe to `useI18n()` so language changes update visible copy immediately.

## Mixed-language fixes

- Replaced hardcoded English on the rescued entry/customer/provider screens with i18n keys.
- Avoided rendering internal workspace helper descriptions from auth helpers on the public entry screen.
- Localized high-traffic tab labels and customer/provider home labels.
- Kept backend-authored item titles/statuses as server-owned data where they are part of API responses.

## Bottom tab fixes

- Customer tabs now use localized labels and hide customer message thread detail routes.
- Provider tabs now use localized labels and hide provider message thread detail routes.
- Provider bottom tab labels were shortened from Dashboard/Profile to Home/Account equivalents.

## Deferred design issues

- Some deeper task/detail flows still include older copy and should be reviewed in later screen-specific polish passes.
- Backend-authored demo/status labels may need a server-side localization strategy later.
- Logo image assets are still expected under `assets/branding/` when the product owner provides them.
- Real-device visual QA is still needed for Bulgarian text wrapping and bottom tab fit across narrow Android screens.

## Manual QA checklist

- Open entry screen in EN and BG and confirm the language toggle is visible at the top.
- Switch language on entry and confirm the current screen updates immediately.
- Open login in EN and BG and confirm toggle visibility.
- Open customer home in EN and BG and confirm no mixed language above the fold.
- Confirm Taskly card uses blue accent and Taskly Pro card uses orange/gold accent.
- Confirm customer stats are compact and labels do not overflow.
- Open provider start in EN and BG and confirm pending/ready copy is calm and localized.
- Open provider dashboard in EN and BG and confirm the provider home no longer feels like a debug surface.
- Confirm bottom tabs show only Home, Tasks, Pro, Messages, Account in EN.
- Confirm bottom tabs show only Начало, Задачи, Pro, Чат, Профил in BG.
- Open a message thread and confirm it does not create an extra visible tab.
- Sign in with an admin-only account, if available, and confirm admin tools are not exposed as mobile controls.
