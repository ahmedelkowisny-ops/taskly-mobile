# Phase 39C - Customer Drawer Web Parity

## Web Sidebar Files Inspected

- `D:\Taskly\src\components\Sidebar.tsx`
- `D:\Taskly\src\components\SidebarWrapper.tsx`
- `D:\Taskly\src\components\TasklyLogo.tsx`
- `D:\Taskly\src\components\LanguageSwitcher.tsx`
- `D:\Taskly\src\app\globals.css`

## Mobile Drawer Files Inspected

- `src/components/taskly/CustomerDrawer.tsx`
- `app/customer/_layout.tsx`
- `app/customer/home.tsx`
- `src/components/taskly/TasklyLogoText.tsx`
- `src/components/taskly/LanguageToggle.tsx`
- `src/theme/designTokens.ts`
- `src/theme/colors.ts`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/bg.ts`

## Exact Web Patterns Copied Or Adapted

- Left-side drawer behavior, matching the web mobile drawer direction.
- Soft dark overlay using the web overlay feel.
- Warm sidebar surface `#FFFCF8`.
- Warm sidebar border `#E8DDD0`.
- Drawer width adapted to native mobile at 88% of screen width, capped at 344px.
- 44px navigation row height.
- 32px icon boxes.
- Rounded 12px nav rows and icon boxes.
- Active item with white background, subtle shadow, and a left accent bar.
- Taskly active accent uses locked blue `#5A8EC7`.
- Taskly Pro active/accent uses locked gold/orange tokens.
- Language toggle lives near the top like the web sidebar.
- Logout is separated in the footer area.

## Drawer Structure Implemented

1. Header
   - Readable Taskly wordmark.
   - Close button.
   - Localized subtitle: Customer area / Клиентска зона.

2. Language
   - EN/BG toggle in a compact bordered card.
   - Labels update through the existing i18n mechanism.

3. Navigation groups
   - Main
   - Taskly
   - Taskly Pro
   - Communication
   - Account

4. Footer
   - Small trust note:
     - EN: Taskly connects you with independent Taskers and approved Pros.
     - BG: Taskly те свързва с независими Tasker-и и одобрени Pro специалисти.
   - Logout button separated by a top border.

## Nav Items And Routes

| Drawer item | Route | Notes |
| --- | --- | --- |
| Home | `/customer/home` | Active on customer home. |
| My Taskly tasks | `/customer/tasks` | Active for task list and task detail routes. |
| My Taskly Pro projects | `/customer/pro-requests` | Active for Pro request list/detail routes. |
| Post Taskly task | `/customer/post-task` | Active on post-task route. |
| Start Taskly Pro project | `/customer/post-pro-request` | Active on post-Pro route. |
| Chat | `/customer/messages` | Active for customer message routes. |
| Support messages | `/customer/messages` | Routes to existing messages area. Dedicated support-message route remains deferred. |
| Profile | `/customer/account` | Active on account route. |
| Settings | `/customer/account` | Routes to existing account/settings surface. Dedicated settings route remains deferred. |
| Logout | auth logout action | Uses existing auth provider logout. |

## EN/BG Wording

Added or updated:
- `close`
- `drawerCustomerArea`
- `drawerGroupMain`
- `drawerGroupTaskly`
- `drawerGroupTasklyPro`
- `drawerGroupCommunication`
- `drawerGroupAccount`
- `drawerSupportMessages`
- `drawerTrustNote`

Public wording uses Taskly and Taskly Pro. The old "Admin/support messages" drawer label was replaced with "Support messages" and the Bulgarian equivalent.

## Color And Token Usage

- Drawer surface: `colors.sidebarBackground` -> `#FFFCF8`.
- Drawer border: `colors.sidebarBorder` -> `#E8DDD0`.
- Taskly active bar: `colors.tasklyBlue600` -> `#5A8EC7`.
- Taskly Pro active bar: `colors.proOrange500` -> `#D97706`.
- Taskly Pro text/icon accent: `colors.proOrangeText` -> `#B45309`.
- Icon boxes use the locked 32px drawer icon size.
- Radius and spacing use the shared locked mobile tokens.

## Bottom Navigation

Customer bottom navigation was inspected but not redesigned in this phase. It remains minimal and does not duplicate hidden routes. Its labels already use short localized values:
- Home / Начало
- Tasks / Задачи
- Post / Плюс
- Messages / Чат
- Profile / Профил

## Deferred Route Gaps

- Dedicated customer support-message route is not present, so Support messages routes to `/customer/messages`.
- Dedicated settings route is not present, so Settings routes to `/customer/account`.
- Full notification drawer behavior from the web sidebar was not copied because mobile notification settings and push behavior already have their own scoped flows.
- Provider drawer parity remains a later phase.

## Manual QA Checklist

- Drawer opens from the left with calm motion.
- Drawer closes by tapping the backdrop or close button.
- Logo is readable and not duplicated.
- Language toggle is visible near the top.
- English drawer has no Bulgarian text.
- Bulgarian drawer has no English text except Taskly, Taskly Pro, and Tasker brand terms.
- Active item matches the current real route.
- Taskly item active state uses blue accent.
- Taskly Pro item active state uses gold/orange accent.
- Drawer spacing feels like the web sidebar.
- No debug, workspace, session, phase, or backend wording appears.
- No admin control panel is exposed.
- Bottom navigation remains clean and unclipped.
