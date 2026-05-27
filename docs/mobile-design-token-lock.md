# Phase 39B - Mobile Design Token Lock

## Web Files Inspected

- `D:\Taskly\src\app\globals.css`
- `D:\Taskly\src\app\layout.tsx`
- `D:\Taskly\src\components\TasklyLogo.tsx`
- `D:\Taskly\src\components\LanguageSwitcher.tsx`
- `D:\Taskly\src\components\Sidebar.tsx`
- `D:\Taskly\src\components\PostTaskModal.tsx`
- `D:\Taskly\src\components\customer\CustomerDashboardContent.tsx`
- `D:\Taskly\src\components\pro\ProRequestModal.tsx`

## Mobile Files Inspected

- `src/theme/colors.ts`
- `src/theme/spacing.ts`
- `src/theme/typography.ts`
- `src/components/ui/AppButton.tsx`
- `src/components/ui/AppCard.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/components/taskly/TasklyLogoText.tsx`
- `src/components/taskly/LanguageToggle.tsx`
- `src/components/taskly/CustomerDrawer.tsx`
- `src/components/taskly/ModeBadge.tsx`
- `app/_layout.tsx`
- `app/index.tsx`
- `app/customer/home.tsx`
- `app/customer/post-task.tsx`
- `app/customer/tasks.tsx`
- `app/customer/tasks/[taskId].tsx`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/bg.ts`

## Exact Web Token Values Found

The source values are repeated in `globals.css` and the web shell/components. No separate Tailwind config was found.

| Token | Value | Web source |
| --- | --- | --- |
| Page background | `#F7F9FB` | `globals.css --background` |
| Foreground text | `#1F2A33` | `globals.css --foreground` |
| Foreground hover | `#273641` | `globals.css --foreground-hover` |
| Muted text | `#6B7280` | `globals.css --text-secondary` |
| Card background | `#FFFFFF` | shared card classes |
| Border | `#E6EBF0` | `globals.css --border-color` |
| Taskly app blue | `#5A8EC7` | `globals.css --accent-color`, button classes |
| Taskly app blue pressed | `#4F80B5` | button classes |
| Taskly disabled blue | `#9EB8D3` | button disabled class |
| Taskly landing CTA blue | `#2C6BED` | landing cards |
| Taskly landing CTA pressed | `#1F5DE0` | landing cards |
| Taskly Pro primary | `#F59E0B` | Pro cards/forms |
| Taskly Pro pressed | `#D97706` | Pro buttons/sidebar |
| Taskly Pro text | `#B45309` | Pro sidebar/cards |
| Taskly Pro surface | `#FFF7ED` | Pro cards |
| Taskly Pro border | `#F3D6AF` | Pro cards |
| Sidebar background | `#FFFCF8` | `Sidebar.tsx` |
| Sidebar border | `#E8DDD0` | `Sidebar.tsx` |
| Button height | `48px` | `.taskly-btn-primary` |
| Button radius | `14px` | `.taskly-btn-primary` |
| Compact control radius | `12px` | compact buttons/sidebar |
| Card radius | `20px` | `.taskly-card` |
| Modal radius | `18px` | `.taskly-modal-card` |
| Surface shadow | `0 8px 24px rgba(31, 42, 51, 0.06)` | `globals.css --surface-shadow` |
| Card shadow | `0 6px 18px rgba(31, 42, 51, 0.05)` | `.taskly-card` |
| Primary button shadow | `0 4px 12px rgba(90, 142, 199, 0.25)` | `.taskly-btn-primary` |

## Mobile Token Source

Created `src/theme/designTokens.ts`.

It now defines:
- Exact web colors for Taskly, Taskly Pro, surface, border, text, sidebar, and landing CTA.
- Radius values for controls, compact controls, cards, modals, sheets, and pills.
- Shared spacing values.
- Button/input/chip/icon sizing.
- Mobile typography sizes based on the web Inter scale.
- React Native shadow presets for cards, surfaces, Taskly buttons, and Pro buttons.

Updated existing theme exports:
- `src/theme/colors.ts` now maps legacy mobile color names to exact web token values so existing screens inherit the web palette.
- `src/theme/spacing.ts` now exposes web-aligned radii while preserving existing names.
- `src/theme/typography.ts` now uses the locked typography scale and adds `cardTitle` and `button` variants.

## Components Updated

### AppButton

- Primary Taskly button now uses `#5A8EC7`.
- Pressed/border Taskly value now uses `#4F80B5`.
- Pro button now uses `#F59E0B` with `#D97706` border/pressed token.
- Button min height is now 48.
- Button radius is now 14.
- Filled buttons use the locked Taskly/Pro shadow presets.
- Button text uses the locked `button` typography variant.

### AppCard

- Card border now uses `#E6EBF0`.
- Card radius now uses 20.
- Card shadow now matches the web card shadow direction and softness.
- Existing accent support remains for compatibility, but future phases should avoid one-off accent styles unless a web component uses them.

### StatusBadge

- Badges now include subtle borders like web chips.
- Taskly badge uses `#EAF2FB` with blue text.
- Taskly Pro badge uses `#FFF7ED`, `#F3D6AF`, and `#B45309`.
- Neutral badge uses the page background and exact border.

### LanguageToggle

- Toggle now uses the web language switcher surface:
  - `#F9FAFB` container
  - `#F3F4F6` border
  - white active pill
  - `#374151` active text
  - `#6B7280` inactive text
  - compact `/` separator

### TasklyLogoText

- The default logo treatment is now a single clean wordmark to avoid the duplicate icon/wordmark look.
- Wordmark size was increased for better web-like visual weight.
- `showMark` is available when a screen intentionally needs the icon, but it is off by default.

### CustomerDrawer

- Drawer now consumes the locked sidebar colors and icon-box pattern needed for the next exact drawer parity phase.
- It now opens from the left with the warm web sidebar surface.
- Pro drawer items use the locked Pro text accent.
- This is not the full Phase 39C drawer rebuild; active route styling and exact sidebar interaction remain deferred.

## Font Parity Result

The web app uses Inter through Next font:

`Inter({ subsets: ["latin", "cyrillic"], display: "swap" })`

Mobile currently has `expo-font` installed and loads only `assets/fonts/SpaceMono-Regular.ttf` in `app/_layout.tsx`. No Inter font asset was found under `assets/fonts`, and no existing Inter package/import was found.

Result:
- Inter was not wired in this phase because no safe existing Inter asset is present.
- The mobile typography scale was adjusted to match web proportions using the current safe native font fallback.
- Deferred next step: add Inter assets or an approved Expo SDK 54-compatible font setup in a dedicated font phase.

## Colors Changed

The main mobile color corrections are:
- Taskly blue: `#2563EB` -> `#5A8EC7`
- Taskly blue pressed: `#1D4ED8` -> `#4F80B5`
- Taskly surface tint: `#EFF6FF` -> `#EAF2FB`
- Pro primary: `#EA580C` -> `#F59E0B`
- Pro pressed: `#F97316` -> `#D97706`
- Page background: `#F8FAFC` -> `#F7F9FB`
- Border: `#F1F5F9` -> `#E6EBF0`
- Main text: `#0F172A` -> `#1F2A33`

## Screens Lightly Touched

No route screens were redesigned in this phase. The visual changes flow into screens through shared components and theme aliases only.

## Deferred Items

- Full customer drawer/sidebar exact web parity, including active route bar, route grouping, and logout placement.
- Provider drawer/sidebar parity.
- Full Inter font loading.
- Exact input/select shared component parity, if a central input component is introduced.
- Per-route cleanup for old one-off colors and card styles.
- Account/provider/settings removal of remaining internal wording.

## Manual QA Checklist

- Taskly blue button visually matches the web app primary button.
- Taskly Pro orange/gold button visually matches the web Pro action color.
- Logo is readable and no longer shows an accidental duplicate icon/wordmark pair.
- Shared cards feel closer to web: white, soft border, 20px radius, subtle shadow.
- Badges look like compact web chips.
- Language toggle feels like the web switcher.
- Customer drawer has the locked sidebar colors and icon boxes ready for Phase 39C.
- EN/BG switching still works.
- No broad screen redesign happened.
- No backend/payment/refund/admin behavior changed.
