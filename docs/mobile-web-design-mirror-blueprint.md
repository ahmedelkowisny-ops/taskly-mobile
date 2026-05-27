# Phase 38A - Mobile Web Design Mirror Blueprint

## Web Files Inspected

- `D:\Taskly\src\app\page.tsx`
- `D:\Taskly\src\app\globals.css`
- `D:\Taskly\src\components\TasklyLogo.tsx`
- `D:\Taskly\src\components\LanguageSwitcher.tsx`
- `D:\Taskly\src\components\Sidebar.tsx`
- `D:\Taskly\src\components\SidebarWrapper.tsx`
- `D:\Taskly\src\components\MarketplacePreviewSection.tsx`
- `D:\Taskly\src\components\customer\CustomerDashboardContent.tsx`
- `D:\Taskly\src\lib\motion.ts`
- `D:\Taskly\messages\en.json`
- `D:\Taskly\messages\bg.json`

## Key Web Patterns Extracted

- White fixed header with logo left and compact language/menu controls right.
- Soft app background close to `#FCFDFF` / `#F7F9FB`.
- Premium white hero surface with large radius, quiet border, and soft shadow.
- Taskly and Taskly Pro shown together as small segmented brand pills.
- Two primary action cards:
  - Taskly uses blue background/tint, blue CTA, blue service-chip icons.
  - Taskly Pro uses warm orange/gold background/tint, gold CTA, warm service-chip icons.
- Small rounded service chips with icons and short labels.
- Compact trust chips for payment protection, approved Pros, and privacy/local-help cues.
- Sidebar/drawer navigation uses a soft cream surface, icon tiles, rounded rows, and a dark overlay.
- Typography is bold for key headings, but cards and helper text stay compact.

## Colors And Tokens

- App background: `#FCFDFF`, `#F7F9FB`
- Text: `#1F2A33`, `#0F172A`, secondary `#4B5563`, `#6B7280`
- Border: `#E5E7EB`, `#E6EBF0`
- Taskly blue: `#2C6BED`, existing mobile `#2563EB`
- Taskly Pro gold/orange: `#F59E0B`, `#D97706`, `#B45309`
- Taskly tint: `#F8FBFF`, `#EFF6FF`, `#EEF5FF`
- Pro tint: `#FFF7ED`
- Drawer surface: `#FFFCF8`

## Spacing, Radius, Shadow, Cards

- Cards use 16-28px radius depending on hierarchy.
- Main hero surface uses a larger radius, quiet border, and soft shadow.
- Action cards use smaller radius, tinted background, and compact internal spacing.
- Chips are pill-shaped, small, and icon-led.
- Shadows are subtle and vertical, not heavy or dramatic.

## Header Pattern

- Logo left, language switcher and menu right.
- Header background is white, bordered, and compact.
- Avoid duplicate logo icon/wordmark combinations.
- Header should feel like app chrome, not a marketing poster.

## Language Toggle Pattern

- Web switcher uses a soft gray container and white active segment.
- Mobile now mirrors that feeling with compact BG/EN segments.
- The toggle remains visible on public/auth surfaces and uses the existing i18n provider.

## Burger/Sidebar Pattern

- Web drawer/sidebar uses:
  - Soft cream/white surface.
  - Icon tiles.
  - Rounded navigation rows.
  - Dark translucent overlay.
  - Language switcher near the top.
- Mobile Phase 38A implements only a lightweight public entry drawer for role navigation.
- Full authenticated customer/provider drawer navigation remains deferred.

## Taskly vs Taskly Pro Card Pattern

- Taskly:
  - Blue CTA.
  - Pale blue surface.
  - Service chips: Mount TV, Furniture, Fix sink, Small repairs.
- Taskly Pro:
  - Gold/orange CTA.
  - Pale orange surface.
  - Service chips: Bathroom, Electrical, Kitchen, Renovation.

## Hero Pattern

- Web hero is a rounded white section, not a full-screen colored poster.
- Mobile adaptation keeps the hero card compact so role actions stay reachable.
- Copy is shorter than desktop to fit mobile:
  - EN: "Your marketplace for home tasks and renovation projects"
  - BG: "Платформа за домашни задачи и професионални ремонти"

## Typography Pattern

- Mobile headings should sit around 28-32px on entry.
- Card titles should stay around 16-18px.
- Helper text should stay around 13-15px.
- Avoid uppercase tracking except very small labels.
- Bulgarian labels must stay short and wrap naturally.

## Mobile Adaptation Rules

- Recreate the web feeling, not the exact desktop layout.
- Use native `View`, `Pressable`, `Modal`, `Image`, and Ionicons.
- Keep first-screen actions visible without excessive scrolling.
- Do not use web-only CSS, Tailwind classes, DOM assumptions, or videos.
- Keep the entry screen clean and useful above the fold.

## What Not To Copy Literally

- Do not copy Tailwind class strings into React Native.
- Do not use desktop two-column hero layout on mobile.
- Do not copy web admin/sidebar behavior into public mobile.
- Do not add web-only hover interactions.
- Do not add video hero media in this mobile shell pass.
- Do not duplicate backend permissions or role decisions on the client.

## Mobile Implementation In Phase 38A

- Reworked `app/index.tsx` into a web-inspired mobile entry:
  - White header with logo, BG/EN toggle, and menu button.
  - Premium white hero card.
  - Taskly and Taskly Pro brand pills.
  - Dual Taskly/Taskly Pro action cards.
  - Compact service chips.
  - Compact trust chips.
  - Role login/register panel.
  - Lightweight public entry drawer.
- Updated `LanguageToggle` to match the web switcher feel.
- Added EN/BG i18n keys for web-aligned hero, CTA, chip, and menu copy.
- No backend, payment, refund, payout, admin, or API contract changes were made.

## Implementation Plan For Later Mobile Phases

- Build authenticated customer drawer/sidebar with icons:
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
- Build provider drawer/sidebar with icons:
  - Taskly tasks
  - Taskly Pro projects
  - Responses
  - Site visits
  - Messages
  - Profile
  - Settings
  - Support
  - Logout
- Bring web card/radius/shadow tokens into shared mobile components gradually.
- Run real-device visual QA for BG text wrapping and narrow Android screens.
