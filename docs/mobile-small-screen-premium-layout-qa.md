# Mobile Small-Screen Premium Layout QA

## Screens Inspected

- Public entry: `app/index.tsx`
- Login: `app/login.tsx`
- Customer: home, onboarding, tasks, task detail, post task, post Taskly Pro project, Taskly Pro list/detail, messages, account
- Provider: dashboard, start, account, profile, Taskly task list/detail, Taskly Pro list/detail, messages
- Shared UI: `AppButton`, `StatusBadge`, `Screen`, `AppCard`, `SessionStatusCard`, workspace cards, notification settings, image picker placeholder
- Localization: `src/lib/i18n/en.ts`, `src/lib/i18n/bg.ts`
- Copy docs: `docs/mobile-premium-copy-guide.md`, `docs/mobile-premium-copy-audit.md`

## Small-Screen Risks Found

- Entry and login screens had no visible language selector before login, so Bulgarian users could not switch language from the first surface.
- Some long badge labels could crowd narrow screens because badges did not explicitly cap their width.
- Long button labels in Bulgarian could shrink poorly without explicit label shrink behavior.
- Public entry page had hardcoded English copy, so a future language toggle would not update key first-screen text.
- Customer account had a bad separator character in the signed-in identity line.

## Bulgarian Overflow Risks Found

- Long CTAs such as provider onboarding, payment setup, support review, and site visit proposal remain the highest risk on small Android screens.
- Bulgarian workspace descriptions are naturally longer; they should stay in body text, not button labels.
- Short EN/BG toggle labels are safer than full "English / Български" labels in the header area.

## Visual And Copy Polish Applied

- Added a compact `LanguageToggle` pill using `BG` and `EN`.
- Added `I18nProvider` with SecureStore-backed locale persistence and kept the existing `t()` helper.
- Added the language toggle to the public entry page, login page, and provider start surface.
- Converted high-visibility entry-page copy to i18n keys so switching language updates the main page.
- Added badge `maxWidth: '100%'` so long status labels wrap instead of overflowing.
- Added button label `flexShrink: 1` so long labels fit better on narrow screens.
- Fixed the customer account identity separator from a mojibake character to a safe ASCII separator.
- Preserved Taskly blue for normal Taskly flows and orange/gold for Taskly Pro flows.

## Before And After Rationale

- Before: public entry and login had no language control. After: users can switch EN/BG before login without crowding the page.
- Before: the first screen mixed i18n strings and hardcoded English. After: the main explanatory copy changes with the selected language.
- Before: badges and buttons relied on default text behavior. After: they have small layout safeguards for longer Bulgarian labels.
- Before: account identity displayed a corrupted separator. After: it uses a plain safe separator.

## Deferred Layout Items

- Backend-returned labels still need backend localization or a label contract to fully switch EN/BG.
- A real device pass should verify the longest Bulgarian labels on a small Android viewport.
- Some deep task/detail screens remain dense because they expose many backend-owned states; future polish can group secondary status rows if product wants a calmer detail layout.
- Full dynamic font scaling QA remains manual.

## Manual Device QA Notes

- Test on a small Android device or emulator around 360 x 640.
- On the entry page, tap `EN` and `BG`; confirm the hero, workspace cards, and "How Taskly works" copy update.
- On login, tap `EN` and `BG`; confirm labels and error text update.
- Restart the app in a development build or Expo Go; confirm the last selected language restores when SecureStore is available.
- Check customer and provider cards for badge wrapping and button labels with Bulgarian selected.
- The Expo Go remote push warning for SDK 54 is expected and is not related to layout QA.

## Final Readiness Verdict

Static small-screen polish is ready for commit after validation. Real-device QA is still recommended for Bulgarian text wrapping and persisted language selection.
