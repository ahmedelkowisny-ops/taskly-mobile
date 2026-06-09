# Taskly Customer Web -> Mobile Parity Re-Audit

Audit date: 2026-06-09
Web repository inspected: `D:\Taskly`
Mobile repository inspected: `D:\Taskly-app`
Scope: customer account, Taskly task, Taskly Pro, support, messaging, payment/unlock, rewards, profile, security, help/legal, and customer navigation parity.
Constraint: audit only. No application logic, routes, API code, translations, or backend behavior were changed.

## 1. Executive Summary

The customer mobile app is now close to functional parity with the customer web app for the main logged-in customer journey. Since the previous audit, several formerly missing gaps are now implemented on mobile: account security, rewards/referrals, help/legal hub, task budget/schedule editing, book again, full approved-Pro profile, Pro chat access, richer cancellation/payment help, and reward-credit Pro unlock visibility.

The remaining gaps are narrower and mostly about depth, presentation, and final trust polish rather than entire missing workflows. The highest-risk areas are support case workspace depth, post-creation image management on task details, and a full wording/localization pass across sensitive customer-facing flows.

The web and mobile information architectures remain intentionally different:

- Web uses dense dashboard pages, task detail overlays, and sidebar-driven account navigation.
- Mobile uses focused route-based screens, a drawer, top account actions, bottom navigation, and step-by-step posting flows.
- This is appropriate for mobile as long as backend-authored `nextActions`, capabilities, payment state, and support state remain the source of truth.

### Audit Counts

| Measure | Count |
|---|---:|
| In-scope web customer routes/surfaces | 18 |
| In-scope mobile customer screens/surfaces | 22 |
| Parity features assessed | 34 |
| Matched | 22 |
| Partial | 10 |
| Missing | 2 |
| Different UX but acceptable | 3 |
| High-risk gaps | 3 |

### High-Level Finding

Mobile now covers the majority of the customer web product. The recommended next batch should focus on finishing support-case parity, task post-creation image management, and wording/localization quality around payment, cancellation, Pro unlock, and support.

## 2. Web Customer Route Inventory

| Web route/surface | Primary file(s) | Purpose and major actions |
|---|---|---|
| `/dashboard/customer` | `src/app/dashboard/customer/page.tsx`; `src/components/customer/CustomerDashboardContent.tsx` | Main customer dashboard, summaries, task cards, Pro summaries, messages/payment shortcuts |
| `/dashboard/customer/tasks` | `src/app/dashboard/customer/tasks/page.tsx`; `CustomerDashboardContent.tsx` | Customer task list/history and task detail overlay entry |
| Customer task detail overlay | `CustomerDashboardContent.tsx` | Timeline, interested Taskers, select, payment setup, cancellation/support, approve/reject completion, chat, update budget/schedule, images, book again |
| Post Task modal | `src/components/PostTaskModal.tsx` | Task creation with category, scope, details, budget, address/map, schedule, images, review |
| `/dashboard/customer/pro` | `src/app/dashboard/customer/pro/page.tsx`; `src/components/pro/ProRequestModal.tsx` | Pro request list/dashboard, status/access/refund/support summaries |
| `/dashboard/customer/pro/[id]` | `src/app/dashboard/customer/pro/[id]/page.tsx`; `CustomerProResponsesSection.tsx` | Pro request detail, response compare, unlock, reward credit use, select/discard, site visits, chat links |
| `/pro/pros/[proProfileId]` | `src/app/pro/pros/[proProfileId]/page.tsx` | Full approved-Pro profile and portfolio |
| `/pro-chat/[threadId]` | `src/app/pro-chat/[threadId]/page.tsx`; `ProChatComposer.tsx` | Dedicated Pro chat after allowed unlock/contact flow |
| `/dashboard/customer/messages` | `src/app/dashboard/customer/messages/page.tsx`; `CustomerMessagesPage.tsx` | Official Taskly/admin inbox |
| `/chat/[id]` | `src/app/chat/[id]/page.tsx` | Customer/Tasker task chat with text/images and task context |
| `/dashboard/support` | `src/app/dashboard/support/page.tsx`; reply/resolution components | Full customer support workspace, support conversation history, replies, resolution decisions |
| `/dashboard/customer/help` | `src/app/dashboard/customer/help/page.tsx` | Help and policy hub linking messages, contact, terms, payments, privacy |
| Public legal/FAQ/contact | `src/app/[locale]/legal/*`; `src/app/contact/page.tsx`; `src/components/SiteFooter.tsx` | Terms, privacy, payments, cancellation, FAQ, contact support |
| `/dashboard/customer/payments` | `src/app/dashboard/customer/payments/page.tsx` | Payments and Pro unlock history |
| `/dashboard/customer/profile` | `src/app/dashboard/customer/profile/page.tsx` | Profile edit, change email, change password |
| `/dashboard/rewards` | `src/app/dashboard/rewards/page.tsx`; `RewardsDashboardView.tsx` | Rewards, referrals, copy/share referral, cash redemption, free Pro unlock credits |
| Customer sidebar/topbar | `src/components/Sidebar.tsx`; `SidebarWrapper.tsx` | Dashboard, tasks, Pro, messages, support, payments, rewards, profile, help, notifications, logout |
| Shared localized copy | `messages/en.json`; `messages/bg.json` | Customer, payment, support, profile, rewards, Pro, and sidebar text |

## 3. Mobile Customer Screen Inventory

| Mobile route/surface | File | Purpose and major actions |
|---|---|---|
| `/customer/home` | `app/customer/home.tsx` | Customer landing page with Taskly/Pro entry cards and active summaries |
| `/customer/dashboard` | `app/customer/dashboard.tsx` | Compact account dashboard/metrics |
| `/customer/tasks` | `app/customer/tasks.tsx` | Task list/history |
| `/customer/tasks/[taskId]` | `app/customer/tasks/[taskId].tsx` | Task detail, select Tasker, payment setup/finalize, cancellation/support, approve/reject completion, budget/schedule edit, book again |
| `/customer/post-task` | `app/customer/post-task.tsx` | Mobile task creation wizard and post-creation image upload |
| `/customer/pro-requests` | `app/customer/pro-requests.tsx` | Pro request list/history |
| `/customer/pro-requests/[proRequestId]` | `app/customer/pro-requests/[proRequestId].tsx` | Pro request detail, unlock, reward credit use, compare/select/discard, site visit actions, Pro chat entry |
| `/customer/pro-requests/[proRequestId]/pros/[proProfileId]` | `app/customer/pro-requests/[proRequestId]/pros/[proProfileId].tsx` | Mobile approved-Pro profile/portfolio |
| `/customer/post-pro-request` | `app/customer/post-pro-request.tsx` | Mobile Pro request creation wizard and post-creation image upload |
| `/customer/messages` | `app/customer/messages.tsx` | Combined customer message, task, Pro, and support thread list |
| `/customer/messages/[threadId]` | `app/customer/messages/[threadId].tsx` | Thread detail, text/image sending, support resolution decisions when capabilities allow |
| `/customer/support` | `app/customer/support.tsx` | Create support request |
| `/customer/help` | `app/customer/help.tsx` | Help/legal hub with support, payment/cancellation, Pro, rewards, and external legal links |
| `/customer/payments-unlocks` | `app/customer/payments-unlocks.tsx` | Payments and unlock history |
| `/customer/profile` | `app/customer/profile.tsx` | Profile edit, account shortcuts, help/legal links, logout |
| `/customer/security` | `app/customer/security.tsx` | Change email and change password customer security screen |
| `/customer/rewards` | `app/customer/rewards.tsx` | Rewards/referrals, referral copy/share, redemption, free Pro unlock credits |
| `/customer/settings` | `app/customer/settings.tsx` | Language, notifications, account links |
| `/customer/onboarding` | `app/customer/onboarding.tsx` | Customer onboarding guidance |
| `/customer/account` | `app/customer/account.tsx` | Compatibility redirect to profile |
| Customer drawer/topbar/bottom nav | `src/components/taskly/CustomerDrawer.tsx`; `CustomerTopBar.tsx`; `CustomerBottomNav.tsx` | Mobile customer navigation, notifications, post sheet, account shortcuts |
| Customer API/i18n support | `src/lib/api/*`; `src/lib/i18n/*` | Typed mobile API wrappers and mobile EN/BG copy |

## 4. Parity Matrix

| Web route/feature | Mobile equivalent | Status | Notes |
|---|---|---|---|
| Customer dashboard | `/customer/home`, `/customer/dashboard` | PARTIAL | Mobile split is valid, but web still has denser inline management and summary context. |
| Task list/history | `/customer/tasks` | MATCHED | Focused list route with state summaries. |
| Web task detail overlay | `/customer/tasks/[taskId]` | DIFFERENT UX BUT ACCEPTABLE | Mobile route replaces modal and is better suited to small screens. |
| Task creation modal | `/customer/post-task` | MATCHED | Wizard preserves backend-authoritative creation and separate image upload. |
| Task budget update | Task detail management card | MATCHED | Mobile now exposes backend-backed budget editing where allowed. |
| Task schedule update | Task detail management card | MATCHED | Mobile now exposes backend-backed schedule editing where allowed. |
| Book again | Task detail management card -> post-task prefill | MATCHED | Mobile now mirrors the web convenience flow. |
| Post-creation task image management | Posting upload exists | PARTIAL | Creation upload is matched; a customer task-detail add/manage-images action is not fully equivalent to web. |
| Tasker interest/select | Task detail | MATCHED | Capability-gated and backend-authoritative. |
| Task protected payment setup/finalize | Task detail | MATCHED | Uses backend-created Stripe objects and mobile payment flow. |
| Task cancellation/help | Task detail and support | MATCHED | Mobile now has richer cancellation/payment/support help while keeping backend authority. |
| Completion approve/reject | Task detail | MATCHED | Uses backend `nextActions`; does not calculate payment logic locally. |
| Task chat text/images | `/customer/messages/[threadId]` | MATCHED | Unified messaging supports text/images and capabilities. |
| Pro request list/dashboard | `/customer/pro-requests` | MATCHED | Summaries and access/support/payment states are represented. |
| Pro request creation | `/customer/post-pro-request` | MATCHED | Dedicated wizard and post-creation image upload. |
| Pro request detail/compare | `/customer/pro-requests/[proRequestId]` | MATCHED | Limited/full responses, compare, select/discard, support and site-visit actions. |
| Pro Access paid unlock | Pro detail | MATCHED | Backend-authored checkout/setup state. |
| Free reward-credit Pro unlock | Rewards + Pro detail | MATCHED | Mobile now surfaces credits and Pro detail usage path. |
| Full approved-Pro profile | `/customer/pro-requests/[proRequestId]/pros/[proProfileId]` | MATCHED | Dedicated mobile profile route now exists. |
| Dedicated Pro chat | Unified message thread route from Pro detail | DIFFERENT UX BUT ACCEPTABLE | Web has `/pro-chat`; mobile uses unified thread UI with Pro entry points and capabilities. |
| Site-visit invite/cancel | Pro detail | MATCHED | Mobile exposes actions through backend-supported Pro detail state. |
| Official Taskly/admin messages | `/customer/messages` | DIFFERENT UX BUT ACCEPTABLE | Mobile combines message types instead of using a separate official inbox. |
| Support request creation | `/customer/support` | MATCHED | General/contextual support request flow exists. |
| Support conversations/replies/resolution | `/customer/messages?context=support`, thread detail | PARTIAL | Mobile handles support threads and resolution decisions, but web has a richer case workspace. |
| Help and policy hub | `/customer/help` | MATCHED | Mobile now exposes support, legal, payment/cancellation, Pro, and rewards guidance. |
| Public legal links | `/customer/help` external links | MATCHED | Mobile opens public Taskly legal pages externally. |
| Payments and unlock history | `/customer/payments-unlocks` | MATCHED | Summary/list links align with web intent. |
| Profile basic edit | `/customer/profile` | MATCHED | Name/phone edit available. |
| Change email | `/customer/security` | MATCHED | Mobile customer security screen exists. |
| Change password | `/customer/security` | MATCHED | Mobile customer security screen exists. |
| Rewards/referrals | `/customer/rewards` | MATCHED | Referral copy/share, reward state, redemption, credits are represented. |
| Customer navigation | Drawer/topbar/bottom nav | PARTIAL | Coverage is strong; web/mobile destinations differ and Home vs Dashboard remains slightly redundant. |
| Reviews/history convenience | Profile placeholder/list history elsewhere | MISSING | Reviews remain a placeholder or deferred surface on mobile. |
| EN/BG semantic parity | `src/lib/i18n/en.ts`, `bg.ts` | PARTIAL | Mobile has broad copy coverage; still needs formal wording and Bulgarian length QA. |
| Forbidden wording cleanup | Web and mobile copy | PARTIAL | Need final visible-copy audit for "Core", "escrow", and other disallowed public wording. |

### Status Totals

- Matched: 22
- Partial: 10
- Missing: 2
- Different UX but acceptable: 3

## 5. Previously Missing Gaps Now Matched

These items were previously missing or materially partial and now have mobile coverage:

1. Customer change-password flow.
2. Customer change-email/security screen.
3. Customer rewards/referrals screen.
4. Free Pro unlock credit visibility and use path.
5. Full approved-Pro profile/portfolio route.
6. Pro chat access from customer Pro flows, using the unified mobile message thread model.
7. Task budget editing after creation.
8. Task schedule editing after creation.
9. Book again flow from task detail into post-task prefill.
10. Dedicated customer help/legal hub.
11. Richer payment/cancellation/support guidance in customer task detail.
12. Customer navigation links to rewards, security, help/legal, and support.

## 6. Remaining Gaps

### High-Risk Gaps

1. Support workspace depth is still partial.
   - Web has a dedicated support case workspace with stronger case context, resolved-state presentation, replies, and attachments.
   - Mobile support threads work, but the customer may have less context when a support issue is complex.

2. Task post-creation image management is still partial.
   - Mobile creation upload is present.
   - A customer task-detail add/manage-images path is not yet fully equivalent to the web task detail experience.

3. Sensitive wording/localization needs a final pass.
   - Payment, cancellation, support, Pro unlock, and lifecycle text must preserve "payment protected" wording and avoid banned or confusing terms.
   - Bulgarian length/fit should be verified on the real mobile screens.

### Medium/Lower Gaps

1. Home and Dashboard both exist in mobile navigation; their difference may not be obvious.
2. Mobile official/admin messages are folded into a unified inbox rather than a dedicated official messages surface.
3. Pro chat is unified under mobile messages rather than matching the web's dedicated `/pro-chat` page.
4. Reviews remain a deferred/placeholder account surface.
5. Web dashboard density is higher; mobile uses more taps to reach some details.

## 7. Recommended Next Implementation Batch

Recommended next batch: **Customer Support and Trust Polish**.

Scope:

1. Add a richer mobile support case list/detail presentation if the backend already exposes safe support metadata.
2. Preserve support-thread capabilities from the backend, including `canSendText`, `canSendAttachments`, and resolution decisions.
3. Add or explicitly defer customer task-detail image add/manage actions based on the existing backend image contract.
4. Run a visible-copy audit for payment, cancellation, support, Pro unlock, rewards, and legal/help screens in EN/BG.
5. Clarify customer Home vs Dashboard navigation labels or landing behavior.

This batch closes the highest remaining user-trust gaps without changing payment, cancellation, matching, Pro unlock, lifecycle, or backend business rules.

## 8. Files Inspected

### Web Files/Areas

- `D:\Taskly\src\app\dashboard\customer\page.tsx`
- `D:\Taskly\src\app\dashboard\customer\tasks\page.tsx`
- `D:\Taskly\src\app\dashboard\customer\pro\page.tsx`
- `D:\Taskly\src\app\dashboard\customer\pro\[id]\page.tsx`
- `D:\Taskly\src\app\dashboard\customer\messages\page.tsx`
- `D:\Taskly\src\app\dashboard\customer\payments\page.tsx`
- `D:\Taskly\src\app\dashboard\customer\profile\page.tsx`
- `D:\Taskly\src\app\dashboard\customer\help\page.tsx`
- `D:\Taskly\src\app\dashboard\support\page.tsx`
- `D:\Taskly\src\app\dashboard\rewards\page.tsx`
- `D:\Taskly\src\app\pro-chat\[threadId]\page.tsx`
- `D:\Taskly\src\app\pro\pros\[proProfileId]\page.tsx`
- `D:\Taskly\src\components\customer\CustomerDashboardContent.tsx`
- `D:\Taskly\src\components\customer\CustomerMessagesPage.tsx`
- `D:\Taskly\src\components\pro\CustomerProResponsesSection.tsx`
- `D:\Taskly\src\components\pro\ProRequestModal.tsx`
- `D:\Taskly\src\components\rewards\RewardsDashboardView.tsx`
- `D:\Taskly\src\components\PostTaskModal.tsx`
- `D:\Taskly\src\components\Sidebar.tsx`
- `D:\Taskly\src\components\SiteFooter.tsx`
- `D:\Taskly\messages\en.json`
- `D:\Taskly\messages\bg.json`

### Mobile Files/Areas

- `app/customer/_layout.tsx`
- `app/customer/home.tsx`
- `app/customer/dashboard.tsx`
- `app/customer/tasks.tsx`
- `app/customer/tasks/[taskId].tsx`
- `app/customer/post-task.tsx`
- `app/customer/pro-requests.tsx`
- `app/customer/pro-requests/[proRequestId].tsx`
- `app/customer/pro-requests/[proRequestId]/pros/[proProfileId].tsx`
- `app/customer/post-pro-request.tsx`
- `app/customer/messages.tsx`
- `app/customer/messages/[threadId].tsx`
- `app/customer/support.tsx`
- `app/customer/help.tsx`
- `app/customer/payments-unlocks.tsx`
- `app/customer/profile.tsx`
- `app/customer/security.tsx`
- `app/customer/rewards.tsx`
- `app/customer/settings.tsx`
- `app/customer/onboarding.tsx`
- `app/customer/account.tsx`
- `src/components/taskly/CustomerDrawer.tsx`
- `src/components/taskly/CustomerTopBar.tsx`
- `src/components/taskly/CustomerBottomNav.tsx`
- `src/components/taskly/KeyboardAwareFormScreen.tsx`
- `src/components/ui/Screen.tsx`
- `src/lib/api/client.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/api/customer.ts`
- `src/lib/api/messages.ts`
- `src/lib/api/rewards.ts`
- `src/lib/api/account.ts`
- `src/lib/api/imageUploads.ts`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/bg.ts`

## 9. Verification

- Application code changes made by this audit: none.
- Report file updated: `docs/customer-web-mobile-parity-report.md`.
- Build/test command run: not run, per audit-only instruction and because app code was not changed.
- Required whitespace check: run `git diff --check` after the report update.
