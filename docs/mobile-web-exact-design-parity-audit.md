# Phase 39A - Mobile Web Exact Design Parity Audit

## Executive Summary

The Taskly web app has a clear premium design system: Inter typography, soft off-white surfaces, rounded white cards, subtle shadows, exact Taskly blue accents, warm Taskly Pro orange/gold accents, compact chips, and a left sidebar that feels product-ready. The mobile app has started moving in the same direction on the entry screen, customer home, and post-task flow, but it still mixes approximate colors, older card styles, inconsistent radii, and developer-looking surfaces in several authenticated routes.

Mobile already partially matches web in these areas:
- Public entry now has a branded Taskly / Taskly Pro split, visible language toggle, and role-based entry.
- Customer home includes Taskly and Taskly Pro action cards, compact stats, and a drawer concept.
- Post Task now follows a multi-step booking structure inspired by the web PostTaskModal.
- Customer task list/detail screens have premium card sections and payment protected wording in progress.
- Logo assets and EN/BG localization infrastructure exist.

Mobile does not yet match web in these key areas:
- Primary Taskly blue is approximate in mobile (`#2563EB`) instead of the web app surface/action blue (`#5A8EC7`, hover `#4F80B5`) or the web landing CTA blue (`#2C6BED`) where appropriate.
- Taskly Pro orange is often too red (`#EA580C`) instead of the repeated web Pro palette (`#F59E0B`, `#D97706`, `#B45309`).
- Mobile does not load the web Inter font strategy yet.
- Shared cards/buttons/badges use smaller radii and older shadows than web.
- Mobile drawer is right-aligned and visually different from the web left sidebar.
- Several provider, account, workspace guard, and settings surfaces still contain internal wording or lower-fidelity UI.
- Some screens use one-off colors and card styles instead of shared design tokens.

Highest-priority parity fixes:
1. Lock exact mobile design tokens and shared components to web values.
2. Rebuild the customer drawer/sidebar to mirror the web sidebar.
3. Bring Customer Home, Post Task, My Tasks, and Task Detail onto the exact shared token system.
4. Apply the same system to Customer Pro request/access screens.
5. Rebuild provider shell and provider work screens from the same web-derived primitives.
6. Remove internal/debug wording from account, guard, loading, empty, and support surfaces.

## Web Files Inspected

- `D:\Taskly\src\app\globals.css`
- `D:\Taskly\src\app\layout.tsx`
- `D:\Taskly\src\app\page.tsx`
- `D:\Taskly\src\app\login\page.tsx`
- `D:\Taskly\src\app\login\LoginClient.tsx`
- `D:\Taskly\src\app\register\page.tsx`
- `D:\Taskly\src\components\TasklyLogo.tsx`
- `D:\Taskly\src\components\LanguageSwitcher.tsx`
- `D:\Taskly\src\components\Sidebar.tsx`
- `D:\Taskly\src\components\SidebarWrapper.tsx`
- `D:\Taskly\src\components\PostTaskModal.tsx`
- `D:\Taskly\src\components\customer\CustomerDashboardContent.tsx`
- `D:\Taskly\src\components\pro\ProRequestModal.tsx`
- `D:\Taskly\src\components\pro\CustomerProResponsesSection.tsx`
- `D:\Taskly\src\components\pro\ProResponseFormClient.tsx`

No separate Tailwind config was found during inspection. The active web design tokens are mostly centralized in `globals.css` and repeated in component classes.

## Mobile Files Inspected

- `app/index.tsx`
- `app/login.tsx`
- `app/customer/home.tsx`
- `app/customer/_layout.tsx`
- `app/customer/tasks.tsx`
- `app/customer/tasks/[taskId].tsx`
- `app/customer/post-task.tsx`
- `app/customer/post-pro-request.tsx`
- `app/customer/pro-requests.tsx`
- `app/customer/pro-requests/[proRequestId].tsx`
- `app/customer/account.tsx`
- `app/customer/messages/*`
- `app/provider/dashboard.tsx`
- `app/provider/start.tsx`
- `app/provider/core-tasks.tsx`
- `app/provider/core-tasks/[taskId].tsx`
- `app/provider/pro-requests.tsx`
- `app/provider/pro-requests/[proRequestId].tsx`
- `app/provider/profile.tsx`
- `app/provider/account.tsx`
- `src/components/taskly/CustomerDrawer.tsx`
- `src/components/taskly/LanguageToggle.tsx`
- `src/components/taskly/TasklyLogoText.tsx`
- `src/components/taskly/WorkspaceGuard.tsx`
- `src/components/ui/AppButton.tsx`
- `src/components/ui/AppCard.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/theme/colors.ts`
- `src/theme/spacing.ts`
- `src/theme/typography.ts`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/bg.ts`

## Exact Web Design Tokens

### Foundation

| Token | Web value | Source |
| --- | --- | --- |
| Page background | `#F7F9FB` | `globals.css --background` |
| Foreground text | `#1F2A33` | `globals.css --foreground` |
| Foreground hover | `#273641` | `globals.css --foreground-hover` |
| Muted text | `#6B7280` | `globals.css --text-secondary` |
| Card/surface background | `#FFFFFF` | repeated card classes |
| Sidebar background | `#FFFFFF`, sidebar shell often `#FFFCF8` | `globals.css`, `Sidebar.tsx` |
| Sidebar hover | `#F7F9FB` | `globals.css --sidebar-hover` |
| Border | `#E6EBF0` | `globals.css --border-color` |
| Sidebar warm border | `#E8DDD0` | `Sidebar.tsx` |
| Hover background | `#F1F5F9` | `globals.css --hover-background` |
| Soft blue tint | `#EAF2FB` | `globals.css --soft-blue-tint` |

### Taskly Blue

| Use | Web value |
| --- | --- |
| App/form primary blue | `#5A8EC7` |
| App/form primary hover | `#4F80B5` |
| App/form focus ring | `rgba(90, 142, 199, 0.22)` |
| App/form shadow | `0 4px 12px rgba(90, 142, 199, 0.25)` |
| Landing CTA blue | `#2C6BED` |
| Landing CTA hover | `#1F5DE0` |
| Landing blue accent | `#1D4ED8` |

Mobile rule: use `#5A8EC7` as the default Taskly app UI action/accent token. Use `#2C6BED` only when intentionally mirroring landing-page CTA cards.

### Taskly Pro Orange/Gold

| Use | Web value |
| --- | --- |
| Pro primary | `#F59E0B` |
| Pro hover/pressed | `#D97706` |
| Pro text/accent | `#B45309` |
| Pro dark text | `#92400E` |
| Pro card background | `#FFF7ED` |
| Pro card border | `#F3D6AF` |
| Pro chip border | `#FCD9A8` |
| Pro modal border | `#F2D3A5` |
| Pro footer border | `#F2E3CE` |
| Pro submit shadow | `rgba(217, 119, 6, 0.24)` |

Mobile rule: do not use `#EA580C` as the main Pro token unless a web component specifically uses it. The mobile default Pro action color should be `#F59E0B`, with `#D97706` for pressed/active and `#B45309` for text accents.

### Radius, Shadows, Cards

| Pattern | Web value |
| --- | --- |
| Premium surface radius | `20px` |
| Card radius | `20px` |
| Button radius | `14px` |
| Compact button radius | `12px` |
| Modal radius | `18px` |
| Sheet/large panel radius | `24px` to `32px` depending surface |
| Surface shadow | `0 8px 24px rgba(31, 42, 51, 0.06)` |
| Card shadow | `0 6px 18px rgba(31, 42, 51, 0.05)` |
| Hover card shadow | `0 6px 18px rgba(0, 0, 0, 0.06)` |
| Active task shadow | `0 14px 34px rgba(90, 142, 199, 0.16)` |

Mobile rule: app cards should default to radius 20, border `#E6EBF0`, white background, and subtle shadows. Smaller radius 8 should be reserved for inner controls only.

### Buttons

| Pattern | Web value |
| --- | --- |
| Primary min height | `48px` |
| Primary radius | `14px` |
| Primary border | `#4F80B5` |
| Primary background | `#5A8EC7` |
| Primary hover | `#4F80B5` |
| Primary shadow | `0 4px 12px rgba(90, 142, 199, 0.25)` |
| Secondary min height | `48px` |
| Secondary radius | `14px` |
| Secondary border | `#E6EBF0` |
| Secondary background | `#FFFFFF` |
| Compact min height | `44px` |
| Compact radius | `12px` |
| Compact font | `13px`, semibold/bold |

### Inputs

| Pattern | Web value |
| --- | --- |
| Input min height | `52px` |
| Input radius | `14px` |
| Input border | `#E6EBF0` |
| Input background | `#FFFFFF` |
| Input text | `#1F2A33` |
| Placeholder | `#6B7280` |
| Focus border | `#5A8EC7` |
| Focus ring | `rgba(90, 142, 199, 0.12)` |
| Compact form control min height | `42px` |
| Compact form control radius | `12px` |
| Compact form font | `14px` |

### Chips and Badges

| Pattern | Web value |
| --- | --- |
| Chip min height | `28px` |
| Chip radius | `999px` |
| Chip border | `#E6EBF0` |
| Chip background | `#F7F9FB` |
| Chip text | `#1F2A33` |
| Chip font | `11px`, semibold |
| Chip padding | roughly `0.3rem 0.75rem` |

### Motion

| Token | Web value |
| --- | --- |
| Fast | `160ms` |
| Normal | `220ms` |
| Panel | `260ms` |
| Reveal | `480ms` |
| Premium ease | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Card lift | `2px` |
| Button lift | `1px` |

Mobile rule: use subtle press feedback only. Avoid bouncy or attention-seeking motion.

### Typography

The web app uses Inter in `layout.tsx`:

`Inter({ subsets: ["latin", "cyrillic"], display: "swap" })`

Mobile currently uses the native system font through `src/theme/typography.ts`. Exact Inter parity is not implemented yet. A later scoped phase should either:
- Load Inter safely if assets or an approved Expo-compatible font setup already exist.
- Or document the fallback and tune native typography to the Inter-derived scale.

Recommended native mobile scale based on web:

| Mobile role | Size | Weight |
| --- | --- | --- |
| Screen title | `24-28` | `800-900` |
| Section title | `18-20` | `800` |
| Card title | `15-17` | `700-800` |
| Body | `14-15` | `400-500` |
| Caption | `11-12` | `600` |
| CTA | `14-15` | `700` |

## Web-To-Mobile Component Parity Rules

### Header

Web pattern:
- Clean white or near-white surface.
- Logo has meaningful visual weight.
- Navigation controls are compact and aligned.
- Subtle border/shadow.

Mobile rule:
- Header must use one Taskly wordmark only.
- Logo should be readable on small phones.
- Use white surface, subtle bottom border `#E6EBF0`, and compact height.
- Do not show session/workspace/debug information in the header.

### Logo

Web pattern:
- `TasklyLogo` renders `/logo.png`.
- Visual sizes range from `h-14` to `h-24`.
- Optional text uses uppercase tracking and dark text.

Mobile rule:
- Use existing `assets/branding/taskly-logo.png` or icon asset.
- Avoid duplicate icon plus wordmark unless matching a specific web component.
- Header logo should be larger than earlier mobile prototypes and must not look tiny.

### Language Toggle

Web pattern:
- Compact pill.
- Container background `#F9FAFB`.
- Border `#F3F4F6`.
- Active option white with subtle shadow.
- Active text `#374151`, inactive `#6B7280`.

Mobile rule:
- Keep EN/BG visible on public/auth screens and key shell screens.
- Use the same pill proportions and colors.
- Switching language must not mix EN/BG on the same screen.

### Burger Menu

Web pattern:
- Compact icon button.
- Opens a left drawer/sidebar on mobile web.
- Overlay is calm and translucent.

Mobile rule:
- Use an icon button from the existing icon library.
- Keep hit target comfortable.
- Drawer should open from the left to match web unless a specific mobile pattern later overrides it.

### Sidebar/Drawer

Web pattern:
- Width `256px` on desktop, mobile max `85vw`.
- Background `#FFFCF8`.
- Border `#E8DDD0`.
- Navigation items min height `44px`.
- Item radius `12px`.
- Icons sit in 32x32 rounded boxes.
- Active item has white background, soft shadow, and a left accent bar.
- Taskly active accent uses `#5A8EC7`.
- Taskly Pro active accent uses `#D97706`.
- Labels are compact, uppercase/tracked on web.

Mobile rule:
- Drawer should feel like the same sidebar adapted to native.
- Use left slide-in, warm white surface, icon boxes, active state, and bottom logout.
- Do not expose admin dashboards.
- "Admin/support messages" can remain a support/message concept only.

### Primary Button

Mobile must mirror web:
- Height about 48.
- Radius 14.
- Background `#5A8EC7`.
- Pressed/active `#4F80B5`.
- White text, 14-15, bold.
- Subtle shadow.

Landing-specific CTA may use `#2C6BED` when matching the landing hero cards.

### Secondary Button

Mobile must mirror web:
- Height about 48.
- Radius 14.
- White background.
- Border `#E6EBF0`.
- Text `#1F2A33`.

### Taskly CTA Card

Web pattern:
- White card, blue accent, rounded 20.
- Service chips are compact.
- CTA is blue and clear.

Mobile rule:
- Use exact Taskly blue tokens.
- Keep card body compact.
- Avoid oversized hero typography in authenticated screens.

### Taskly Pro CTA Card

Web pattern:
- Warm Pro surface `#FFF7ED`.
- Border `#F3D6AF`.
- Accent/action `#F59E0B` or `#D97706`.
- Text accent `#B45309`.

Mobile rule:
- Pro cards must visually differ from Taskly cards but stay in the same brand system.
- Do not use red-orange as the main Pro color.

### Service Chips and Trust Chips

Mobile rule:
- Chips should be compact, 28-32 high.
- Use pill radius, subtle border, and short text.
- Trust chips should not become large marketing cards.

### Status Badge

Mobile rule:
- Badges should match web chip proportions.
- Do not expose raw backend statuses.
- Map backend statuses to localized user-facing labels.

### Task Card

Web pattern:
- White card, soft border, rounded corners, clear status, compact metadata, next action.

Mobile rule:
- Card must include title/category, city/address summary when safe, schedule summary, budget/price summary, payment protected state when relevant, and next action if backend provides it.
- Use Taskly blue accent.
- Do not show raw lifecycle or payment jargon.

### Pro Request Card

Mobile rule:
- Use Pro orange/gold accents.
- Show response count/previews, access state, site visit/support state when backend returns them.
- Do not expose private contact details before backend allows it.

### Payment Protected Card

Mobile rule:
- Use "payment protected".
- Never use "escrow".
- Display backend-authored state and next actions only.
- Do not calculate payment, refund, payout, or eligibility locally.

### Support/Help Card

Mobile rule:
- Calm copy, clear state, backend-authored support/refund status only.
- No promise of automatic refunds.
- No admin-only data.

### Modal/Sheet/Booking Flow

Web pattern from `PostTaskModal`:
- Soft outer overlay.
- Rounded white/soft card.
- Thin progress bar.
- Compact step pills.
- Focused section card.
- Sticky footer actions.

Mobile rule:
- Use a native booking sheet feel.
- Hide or control bottom tabs on focused booking routes.
- No clipped step labels.
- No raw coordinates or developer fields.
- Photo step must not say "later update" in public UI.

### Form Input

Mobile rule:
- Rounded 14.
- Height around 52.
- Subtle border.
- Clear labels.
- No database-style field names.

### Select Card

Mobile rule:
- Compact card with icon square, title, body, selected border/background/check.
- Selected state should use Taskly blue or Pro orange depending flow.

### Stepper/Progress

Mobile rule:
- Show current step and total compactly.
- Thin progress track.
- Use horizontal scroll with padding or a condensed stepper.
- Never clip labels like "PH" or "CH".

### Sticky Footer

Mobile rule:
- Compact action row or stacked buttons depending width.
- Primary action clear.
- Footer must not cover content or compete with bottom tabs.
- Helper note 12-13px.

### Empty, Loading, Error States

Mobile rule:
- Calm, localized, user-facing.
- No "backend", "connected later", "read-only", "phase", "workspace", or session-debug wording.
- Include clear next action when appropriate.

## Sidebar/Drawer Parity

### Web Sidebar

The web sidebar uses:
- Left placement.
- Width `w-64` (`256px`) on desktop.
- Mobile drawer max width `85vw`.
- Background `#FFFCF8`.
- Warm border `#E8DDD0`.
- Logo block at the top.
- Full-width language switcher near the top.
- Nav item min height `44px`, radius `12px`.
- 32x32 icon boxes.
- Active item with white background, soft shadow, and left accent bar.
- Taskly blue active accent for normal task routes.
- Pro orange active accent for Taskly Pro routes.
- Logout pinned at the bottom.

### Current Mobile Drawer

Current mobile drawer is partially aligned but still different:
- It opens from the right.
- It uses a plain white surface rather than web warm white.
- It lacks the exact active route treatment.
- It uses mostly blue icon styling instead of web neutral/icon-box styling.
- It does not fully mirror web spacing, icon boxes, logout placement, or active accent bars.

### Required Mobile Changes

- Move customer drawer to left slide-in.
- Use width around `min(340, 85vw)`.
- Use background `#FFFCF8`.
- Use border `#E8DDD0`.
- Put a readable Taskly logo at the top.
- Place language toggle near the top.
- Use icon boxes sized 32x32.
- Use item height around 44, radius 12.
- Add active route state with left accent bar.
- Use `#5A8EC7` for Taskly active items.
- Use `#D97706` and `#B45309` for Pro active items.
- Keep logout at bottom.
- Localize all labels.
- Do not show admin dashboards or internal permissions.

## Route-By-Route Design Parity

| Web source | Mobile route/component | Score | Main differences | Exact changes needed | Phase |
| --- | --- | --- | --- | --- | --- |
| `app/page.tsx` landing | `app/index.tsx` | Medium | Similar structure but mobile tokens/radii not exact. | Use exact landing CTA colors, web card radius/shadows, exact language toggle. | 39B |
| `login/LoginClient.tsx` | `app/login.tsx` | Medium | Role flow exists but input/button styling not fully web-aligned. | Apply exact button/input/card tokens and Inter strategy. | 39B |
| `CustomerDashboardContent.tsx` | `app/customer/home.tsx` | Medium | Premium direction exists, but tokens and card proportions differ. | Rebuild from shared web-derived cards, exact blue/pro palette. | 39D |
| `Sidebar.tsx`, `SidebarWrapper.tsx` | `src/components/taskly/CustomerDrawer.tsx` | Low | Mobile drawer opens from right and uses different visual language. | Left drawer, warm white, icon boxes, active bar, web spacing. | 39C |
| Customer task cards | `app/customer/tasks.tsx` | Medium | Useful cards exist, but card primitives and colors are not exact. | Use exact AppCard, badge, chip, payment protected card styles. | 39F |
| Customer task detail/lifecycle | `app/customer/tasks/[taskId].tsx` | Medium | Section structure exists, lifecycle card style still mobile-specific. | Mirror web lifecycle cards, exact action hierarchy, exact token system. | 39F |
| `PostTaskModal.tsx` | `app/customer/post-task.tsx` | Medium | Structure matches, but exact spacing, colors, stepper, and sheet details still need polish. | Apply exact booking modal tokens and tab proportions; hide tabs cleanly. | 39E |
| Pro request modal | `app/customer/post-pro-request.tsx` | Low/Medium | Mobile form exists but does not fully mirror Pro modal card language. | Rebuild with Pro modal tokens and exact Pro form sections. | 39G |
| Customer Pro responses/access | `app/customer/pro-requests.tsx` | Low/Medium | Functional state exists, visual parity inconsistent. | Use Pro cards, access/support sections, response cards from web patterns. | 39G |
| Customer Pro request detail | `app/customer/pro-requests/[proRequestId].tsx` | Low/Medium | Many features exist but colors/cards are approximate. | Exact Pro palette, web comparison cards, site visit/support card style. | 39G |
| Customer messages | `app/customer/messages/*` | Low | Messaging works but visual language is not fully audited against web. | Apply shared header/card/input primitives and safe thread visual fallbacks. | 39J |
| Customer account/settings | `app/customer/account.tsx` | Low | Contains workspace/session-style wording. | Remove internal wording, web-style settings cards, admin web-only notice. | 39J |
| Provider dashboard | `app/provider/dashboard.tsx` | Low | Still feels separate from web provider dashboard. | Rebuild shell/cards with web tokens and provider/pro grouping. | 39H |
| Provider navigation/drawer | provider layouts | Missing/Low | No exact web-style provider drawer parity. | Add provider drawer/sidebar from web pattern. | 39H |
| Provider Taskly tasks | `app/provider/core-tasks.tsx` | Low | Public "Core" risk in route/code, visual parity low. | User-facing Taskly wording, exact task cards, backend nextActions only. | 39I |
| Provider task detail | `app/provider/core-tasks/[taskId].tsx` | Low | Lifecycle sections need web parity. | Web task detail/action sections, payment protected wording, no accept/reserve. | 39I |
| Provider Pro requests | `app/provider/pro-requests.tsx` | Low/Medium | Pro flow exists but card system differs. | Exact Pro request card and approval/status cards. | 39I |
| Provider Pro response form | `app/provider/pro-requests/[proRequestId].tsx` | Partial | Functional response/site visit states exist. | Mirror `ProResponseFormClient` and Pro detail cards. | 39I |
| Provider profile/account | `app/provider/profile.tsx`, `app/provider/account.tsx` | Low | Internal/provider workspace wording and lower fidelity cards. | Web-style settings/profile/status cards, localize, remove debug wording. | 39J |
| Admin visual reference | web admin routes | Web-only | Admin is not a mobile workspace. | Use only generic card/sidebar polish if useful; no admin mobile routes. | None |

## Typography Parity

Web exact font:
- Inter from Next font with latin and cyrillic subsets.
- `display: "swap"`.

Mobile current state:
- `src/theme/typography.ts` uses native system font.
- No confirmed Inter asset loading is implemented.

Required later work:
- Inspect whether Inter assets already exist in the mobile project.
- If assets exist, load them through the existing Expo font setup if present.
- If no safe font setup exists, create a scoped Phase 39B plan before adding any dependency.
- Do not add font packages without explicit approval.

Native typography rules:
- Authenticated screen titles should stay around 24-28.
- Functional section titles should be 18-20.
- Card titles should be 15-17.
- Body text should be 14-15.
- Captions/helper text should be 11-13.
- Avoid giant marketing headings in task, provider, payment, support, and messaging screens.
- Avoid excessive letter spacing in mobile UI.

## Color Parity

### Exact Palette To Use First

- Taskly app blue: `#5A8EC7`
- Taskly app blue pressed: `#4F80B5`
- Taskly landing CTA blue: `#2C6BED`
- Taskly landing CTA pressed: `#1F5DE0`
- Taskly Pro primary: `#F59E0B`
- Taskly Pro pressed: `#D97706`
- Taskly Pro text: `#B45309`
- Taskly Pro dark text: `#92400E`
- Pro surface: `#FFF7ED`
- Pro border: `#F3D6AF`
- Page background: `#F7F9FB`
- Text: `#1F2A33`
- Muted text: `#6B7280`
- Border: `#E6EBF0`
- Warm sidebar background: `#FFFCF8`
- Warm sidebar border: `#E8DDD0`

### Mobile Files Currently Using Approximate Or Wrong Colors

- `src/theme/colors.ts`: default Taskly blue and Pro orange do not match web defaults.
- `src/components/ui/AppButton.tsx`: uses current mobile token values and smaller radius.
- `src/components/ui/AppCard.tsx`: radius/shadow/border differ from web.
- `src/components/ui/StatusBadge.tsx`: badge palette should use exact chip/pro tokens.
- `src/components/taskly/LanguageToggle.tsx`: close but not exact web colors/proportions.
- `src/components/taskly/CustomerDrawer.tsx`: drawer placement, background, borders, icon boxes, active states differ.
- `app/index.tsx`: uses direct landing colors that need explicit mapping to web tokens.
- `app/customer/home.tsx`: premium direction exists but needs exact shared tokens.
- `app/customer/post-task.tsx`: booking flow uses close approximations rather than exact modal tokens.
- `app/customer/tasks.tsx`: card/badge/action colors need shared token migration.
- `app/customer/tasks/[taskId].tsx`: lifecycle cards need shared token migration.
- `app/customer/pro-requests.tsx`: Pro colors need exact Pro palette.
- `app/customer/pro-requests/[proRequestId].tsx`: Pro/site visit/support cards need exact Pro palette.
- Provider routes: mostly need shell-wide token and component parity work.

First update order:
1. `src/theme/colors.ts`
2. `src/theme/spacing.ts`
3. `src/components/ui/AppButton.tsx`
4. `src/components/ui/AppCard.tsx`
5. `src/components/ui/StatusBadge.tsx`
6. `src/components/taskly/LanguageToggle.tsx`
7. `src/components/taskly/CustomerDrawer.tsx`

## Implementation Roadmap

### Phase 39B - Lock Mobile Design Tokens, Font, Logo, Buttons, Cards

Goal:
- Centralize exact web colors, radius, border, shadows, button, card, input, chip, and badge styles.
- Document font loading result.
- Make shared primitives match web before touching more screens.

### Phase 39C - Customer Drawer/Sidebar Exact Web Parity

Goal:
- Rebuild the customer drawer as a left web-style sidebar adapted to mobile.
- Add active state, icon boxes, warm background, language placement, and bottom logout.

### Phase 39D - Customer Home Exact Web Parity

Goal:
- Rebuild customer home with exact shared tokens.
- Match web customer dashboard card hierarchy and Taskly / Taskly Pro CTA cards.

### Phase 39E - Post Task Exact Web Modal Parity Polish

Goal:
- Finish exact booking modal visual parity.
- Use exact stepper, cards, progress, inputs, sticky footer, and sheet behavior.

### Phase 39F - Customer Task List/Detail Exact Web Parity Polish

Goal:
- Apply exact task card, lifecycle section, payment protected, support, completion, and action hierarchy patterns.

### Phase 39G - Customer Pro Request/Access Exact Web Parity

Goal:
- Align Pro request creation, list, detail, Pro Access, comparison, site visit, and support/refund cards to web Pro patterns.

### Phase 39H - Provider Shell/Drawer Exact Web Parity

Goal:
- Build provider shell and drawer from the same web sidebar pattern.
- Separate Taskly and Taskly Pro provider areas with exact blue/gold accents.

### Phase 39I - Provider Taskly/Pro Work Screens Exact Web Parity

Goal:
- Align provider task cards, task detail lifecycle, Pro request cards, Pro response form, and site visit actions with web.

### Phase 39J - Messages, Account, Settings Polish

Goal:
- Remove workspace/session/debug wording.
- Align messages/account/settings with exact cards, headers, chips, empty states, and admin web-only behavior.

## Codex Implementation Rules For Future UI Phases

- Every UI change must name the web source component or route it mirrors.
- Do not introduce a new card, button, drawer, badge, modal, or chip style unless it maps to a documented web pattern.
- Use exact web design tokens from this audit.
- Do not use approximate colors when exact tokens are known.
- Do not create random one-off shadows or radii.
- Do not expose raw backend statuses, IDs, coordinates, Stripe internals, workspace internals, session internals, debug controls, or unfinished future-update copy.
- Public UI must say "Taskly" for normal task flows and "Taskly Pro" for larger professional project flows.
- Public UI must not say "Core".
- Use "payment protected"; never use "escrow".
- Admin remains web-only.
- Backend remains source of truth for lifecycle, matching, payment, refund, payout, support, Pro unlock, contact visibility, and provider eligibility.
- Every changed screen must be checked in EN and BG.
- Bulgarian labels must be short enough for mobile buttons/cards.
- Screens must feel native mobile, not squeezed desktop layouts.
- For booking sheets and focused flows, bottom tabs must be hidden or visually controlled so they do not compete with the flow.
- Demo mode must remain clearly simulated and must not call unsafe payment, push, or support mutation routes.

## Blockers And Open Questions

- Inter font parity is not complete on mobile. A later phase should verify available assets and choose a safe Expo SDK 54-compatible loading approach.
- Exact color migration should be done in shared tokens first to avoid inconsistent per-screen fixes.
- Provider web parity needs a dedicated pass because many provider screens still use older shell/card patterns.
- Some mobile route parity gaps may require backend wrapper exposure later, but this phase found no reason to change backend logic.

## Readiness Verdict

This audit is ready to guide implementation phases. The next safest step is Phase 39B: lock shared mobile tokens and primitives before redesigning more route screens.
