# Taskly Customer Web -> Mobile Parity Report

Audit date: 2026-06-08  
Web repository: `D:\Taskly`  
Mobile repository: `D:\Taskly-app`  
Scope: customer account and customer-facing task/Pro/support/payment workflows only.

## 1. Executive Summary

The mobile customer app has broad functional coverage and is not merely a read-only companion. It already supports customer task and Pro request creation, image upload after creation, Tasker selection, protected-payment setup/finalization, cancellation, completion approval/rejection, support requests, Pro Access checkout, response selection/discard, site-visit invitations, text/image messaging, and support-resolution responses.

The largest remaining parity gaps are account security, rewards/referrals, richer support conversation management, standalone approved-Pro profiles, full Pro chat parity, and web-only task management conveniences such as changing budget/schedule and booking again.

The web and mobile information architectures differ:

- Web uses one dense customer dashboard with task detail modals plus separate customer pages.
- Mobile uses focused list/detail routes, a customer drawer, a floating bottom navigation bar, and dedicated posting wizards.
- This route-based mobile UX is appropriate, but several web actions and trust/help links are not yet reachable.

### Audit counts

| Measure | Count |
|---|---:|
| In-scope web customer routes/surfaces | 14 |
| Mobile customer screens/routes, excluding layout | 16 |
| Parity features assessed | 29 |
| MATCHED | 10 |
| PARTIAL | 13 |
| MISSING | 5 |
| DIFFERENT UX BUT ACCEPTABLE | 1 |
| High-risk gaps | 6 |

### Top findings

1. Mobile customer account security lacks change-password and change-email actions.
2. Web rewards/referrals and free Pro unlock credits have no customer mobile screen.
3. Mobile support can create requests and read/respond through message threads, but does not match the web support-conversation workspace.
4. Mobile Pro detail is strong, but lacks a standalone full approved-Pro profile route and does not fully match web Pro chat presentation.
5. Web supports task budget/schedule changes and “book again”; mobile does not expose equivalents.
6. Mobile legal/help links inside the customer account are incomplete; Terms & Privacy is visibly marked “Coming soon.”
7. Mobile task actions are strongly backend-authoritative and cover the core lifecycle.
8. Mobile posting flows are more explicitly step-based and mobile-friendly than the web modals.
9. Both repositories contain customer-facing copy using “Core,” despite the current wording rule.
10. Some Bulgarian web customer translations remain English or mixed-language; mobile localization is generally more consistent but still needs a formal parity pass.

## 2. Web Customer Route Inventory

### Route inventory

| Web route/surface | Primary file(s) | Purpose and navigation | Main sections, states, and actions | Data/action dependencies |
|---|---|---|---|---|
| `/dashboard/customer` | `src/app/dashboard/customer/page.tsx`; `src/components/customer/CustomerDashboardContent.tsx` | Main customer dashboard; sidebar entry | Summary links, task lifecycle cards, interested Taskers, active bookings, Pro request summary, messages/payments shortcuts, detail overlay; loading/auth/error/empty handling | Web server actions in `src/app/actions.ts`, payment actions, image actions |
| `/dashboard/customer/tasks` | `src/app/dashboard/customer/tasks/page.tsx`; `CustomerDashboardContent.tsx` | Customer Taskly task list | Task list/history, task detail overlay, post task, select Tasker, payment, chat, cancel/support, approve/reject completion, update budget/schedule, upload images, book again | Shared dashboard actions and payment/image actions |
| Customer task detail overlay | `CustomerDashboardContent.tsx` | Modal detail surface from dashboard/tasks | Timeline/status, Tasker interest, booking/payment, schedule, chat, cancellation policy, support, completion review, images | Backend/server-authored task state plus web actions |
| Post Task modal | `src/components/PostTaskModal.tsx` | Create a Taskly task | Multi-step form: category, scope, details, budget, address/map, schedule, images, review; back/cancel/continue/post | Posting actions, cities/categories, image upload |
| `/dashboard/customer/pro` | `src/app/dashboard/customer/pro/page.tsx`; `src/components/pro/ProRequestModal.tsx` | Taskly Pro request list/dashboard | Metrics, active/history cards, status badges, response/unlock counts, site-visit count, empty states, post Pro request | Prisma read model; Pro request modal actions |
| `/dashboard/customer/pro/[id]` | `src/app/dashboard/customer/pro/[id]/page.tsx`; `src/components/pro/CustomerProResponsesSection.tsx` | Pro request detail and response comparison | Request summary, images, unlock state, response previews/full comparison, profile links, Pro chat links, select/discard response, unlock payment/credit, selected Pro | Pro Access checkout, credit use, select/discard actions, Pro chat read model |
| `/pro/pros/[proProfileId]` | `src/app/pro/pros/[proProfileId]/page.tsx` | Full approved-Pro profile | Profile, portfolio, approvals/coverage, request context, contact/privacy-gated information | Pro profile read model and unlock/request context |
| `/pro-chat/[threadId]` | `src/app/pro-chat/[threadId]/page.tsx`; `ProChatComposer.tsx` | Pro response chat after allowed unlock/contact flow | Thread history and composer with capability gating | Pro chat actions and participant checks |
| `/dashboard/customer/messages` | `src/app/dashboard/customer/messages/page.tsx`; `CustomerMessagesPage.tsx` | Official Taskly/admin inbox | Inbox/detail split view, unread count, mark/read on open, empty/auth/loading states | `getMyAdminMessages`, `getMyAdminMessageById` |
| `/chat/[id]` | `src/app/chat/[id]/page.tsx` | Customer/Tasker task chat | Text and image messages, schedule/task context, polling, composer lock during support review, address/maps when allowed | Message, booking, image-upload actions |
| `/dashboard/support` | `src/app/dashboard/support/page.tsx`; reply/resolution components | Full customer support workspace | Conversation list/detail, task/Pro context, text/image replies, read-only resolved history, accept/refuse resolution | Customer support request/message models and support actions |
| `/dashboard/customer/help` | `src/app/dashboard/customer/help/page.tsx` | Help and policy hub | Official messages link, contact support link, Terms, Payments policy, Privacy | Static/localized copy and legal routes |
| `/contact` | `src/app/contact/page.tsx` | Contact/support entry reached from customer help | Contact form/support path | Contact/support action |
| `/dashboard/customer/payments` | `src/app/dashboard/customer/payments/page.tsx` | Payments & Unlocks history | Task payments, Pro Access payments, statuses, amounts, empty states, links to related items | Customer-authenticated payment read models |
| `/dashboard/customer/profile` | `src/app/dashboard/customer/profile/page.tsx` | Profile and security | View/edit name/phone, change email, change password, validation, install/Telegram banners | `updateCustomerProfile`, `changeCustomerEmail`, `changeCustomerPassword` |
| `/dashboard/rewards` | `src/app/dashboard/rewards/page.tsx`; `src/components/rewards/RewardsDashboardView.tsx` | Shared account rewards/referrals | Referral link/copy, balances/history, redemption, free Pro unlock credits, empty/error states | Rewards dashboard and redemption/referral actions |

### Web navigation inventory

Customer sidebar entries in `src/components/Sidebar.tsx`:

- Home
- Customer Dashboard
- My Taskly Tasks
- My Taskly Pro Projects
- Messages
- Support conversations
- Payments & Unlocks
- Rewards
- Profile
- Help & Support
- Notifications and mark-all-read
- Logout

The web mobile sidebar wrapper also exposes a context-dependent primary action.

### Web state/design patterns

- Dense dashboard cards and modal task detail.
- Blue Taskly surfaces and amber/gold Taskly Pro surfaces.
- Explicit payment, cancellation, support-review, and lifecycle status cards.
- Server-authenticated pages commonly redirect unauthorized users.
- Empty states are present for tasks, Pro requests, payments, messages, support, and rewards.
- Several customer web pages query Prisma/server actions directly as appropriate for the web server, while mobile uses dedicated authenticated API routes.

## 3. Mobile Customer Screen Inventory

| Mobile route | File | Purpose/navigation | Main sections, states, and actions | API usage |
|---|---|---|---|---|
| `/customer/home` | `app/customer/home.tsx` | Primary mobile customer home | Greeting, post Task/Pro cards, active tasks, Pro requests, payment-protected trust card; loading/error/empty/demo | Home summary, tasks, Pro requests |
| `/customer/dashboard` | `app/customer/dashboard.tsx` | Compact summary dashboard | Metrics and upcoming activity; loading/error/empty | Home summary |
| `/customer/tasks` | `app/customer/tasks.tsx` | Task list | Status/lifecycle/payment cards, detail navigation, empty/error/loading/unauthorized | Customer tasks |
| `/customer/tasks/[taskId]` | `app/customer/tasks/[taskId].tsx` | Full task detail | Timeline/state, images, interested Taskers, selection, payment setup/finalize, cancellation, support, approve/reject completion; capability-gated actions | Task detail and all customer task mutation wrappers |
| `/customer/post-task` | `app/customer/post-task.tsx` | Task creation wizard | Category/scope/details/budget/images/address/map/schedule/review; validation and upload after creation | Catalogs, create task, image upload |
| `/customer/pro-requests` | `app/customer/pro-requests.tsx` | Pro request list | Response/access/refund/support summaries, status cards, empty/error/loading | Customer Pro requests |
| `/customer/pro-requests/[proRequestId]` | `app/customer/pro-requests/[proRequestId].tsx` | Pro request detail/comparison | Limited/full response views, access checkout, support request, select/discard response, site-visit invite/cancel, images, statuses | Pro detail and customer Pro mutation wrappers |
| `/customer/post-pro-request` | `app/customer/post-pro-request.tsx` | Pro request creation wizard | Category/property/scope/details/budget/timeline/images/review; validation and upload after creation | Catalogs, create Pro request, image upload |
| `/customer/messages` | `app/customer/messages.tsx` | Combined task/support message threads | Thread list, support context filtering, unread/read-only indicators, loading/error/empty | Message threads |
| `/customer/messages/[threadId]` | `app/customer/messages/[threadId].tsx` | Thread detail | Text/image sending when capabilities allow; support-resolution accept/refuse; loading/error/read-only | Thread detail, send text/image, support resolution |
| `/customer/support` | `app/customer/support.tsx` | Create support request | Issue type, subject, details, validation, success, open support messages | Submit customer support request |
| `/customer/payments-unlocks` | `app/customer/payments-unlocks.tsx` | Payments & Unlocks history | Summary counts, task/Pro access records, statuses, related-item links, empty/error/loading | Payments/unlocks read model |
| `/customer/profile` | `app/customer/profile.tsx` | Profile/account hub | View/edit name/phone, account links, legal placeholder, logout, loading/error/demo | Get/update profile |
| `/customer/settings` | `app/customer/settings.tsx` | Preferences | Language, notification settings, profile link, logout | Notification preferences/auth |
| `/customer/onboarding` | `app/customer/onboarding.tsx` | Customer onboarding guidance | Customer entry guidance | No sensitive mutation |
| `/customer/account` | `app/customer/account.tsx` | Compatibility redirect | Redirects to profile | None |

### Mobile navigation inventory

`CustomerDrawer.tsx`:

- Home and My Dashboard
- My Taskly Tasks and Post Taskly Task
- My Taskly Pro Projects and Start Taskly Pro Project
- Messages, Support Messages, Contact Support
- Payments & Unlocks, Profile, Settings
- Logout

`CustomerBottomNav.tsx`:

- Home
- Tasks
- Central Post action sheet
- Messages
- Profile

`CustomerTopBar.tsx`:

- Official wordmark
- Notifications
- Language
- Account sheet: Profile, Settings, Help & Support, Logout

### Mobile shared states/design

- Shared `Screen` and `KeyboardAwareFormScreen` provide scrolling and customer bottom-nav clearance.
- API-connected screens generally implement loading, empty, error, unauthorized/demo states.
- Taskly and Taskly Pro use clearly separate blue and amber/gold treatments.
- Sensitive actions are displayed from backend-authored capabilities/`nextActions`.

## 4. Route/Page Parity Matrix

| Web route/feature | Mobile equivalent | Status | Main gap/difference | Risk | Priority |
|---|---|---|---|---|---|
| Customer dashboard | `/customer/home`, `/customer/dashboard` | PARTIAL | Mobile splits rich web dashboard into home and summary screens; fewer inline management actions | Medium | P1 |
| Task list | `/customer/tasks` | MATCHED | Mobile has focused route and strong lifecycle summaries | Low | P2 |
| Web task detail overlay | `/customer/tasks/[taskId]` | DIFFERENT UX BUT ACCEPTABLE | Route instead of modal; appropriate for mobile | Low | Later |
| Task creation modal | `/customer/post-task` | MATCHED | Mobile wizard is more explicit; preserves server-authoritative creation/upload separation | Low | P2 |
| Task edit/budget/schedule/book-again tools | No direct mobile equivalent | MISSING | Web exposes post-creation budget/schedule updates and book again | Medium | P1 |
| Tasker interest/select | Task detail | MATCHED | Mobile uses authenticated selection wrapper and backend capabilities | High-sensitive, covered | P0 complete |
| Task payment setup/finalize | Task detail | MATCHED | Mobile Stripe flow exists and uses backend-created objects | High-sensitive, covered | P0 complete |
| Task cancellation/support | Task detail and support | PARTIAL | Core behavior exists; web has richer cancellation fee/support modals and explanatory detail | High | P0 |
| Completion approve/reject | Task detail | MATCHED | Mobile uses backend next actions and separate confirmation/reason flows | High-sensitive, covered | P0 complete |
| Task chat | `/customer/messages/[threadId]` | PARTIAL | Mobile supports text/images and capability gating; web exposes richer schedule/address context | Medium | P1 |
| Pro request list/dashboard | `/customer/pro-requests` | MATCHED | Mobile preserves access/refund/support summaries | Low | P2 |
| Pro request creation modal | `/customer/post-pro-request` | MATCHED | Dedicated mobile wizard; strong field validation | Low | P2 |
| Pro request detail | `/customer/pro-requests/[proRequestId]` | PARTIAL | Strong mobile coverage, but presentation and full profile depth differ | Medium | P1 |
| Unlock Pro responses | Pro detail | PARTIAL | Paid checkout exists; web free-reward-credit unlock depends on missing customer rewards surface | High | P0 |
| Compare/select/discard Pro responses | Pro detail | PARTIAL | Mutations exist; standalone full Pro profile comparison is missing | Medium | P1 |
| Site-visit invite/cancel | Pro detail | PARTIAL | Core invitation/cancel actions exist; web/profile/chat context is richer | Medium | P1 |
| Full approved-Pro profile | No standalone customer route | MISSING | Mobile embeds profile data but lacks full portfolio/profile route | Medium | P1 |
| Pro chat | Message thread if backend exposes it | PARTIAL | No dedicated Pro-chat product surface equivalent to web | High | P0 |
| Official Taskly/admin messages | `/customer/messages` support/official threads | MATCHED | Mobile combines thread types rather than split inbox/detail page | Low | P2 |
| Support request creation | `/customer/support` | PARTIAL | Mobile creation is good; web support conversation workspace is richer | High | P0 |
| Support conversation history/replies/resolution | `/customer/messages?context=support`, thread detail | PARTIAL | Mobile handles resolution responses and thread capabilities, but lacks web-style support case workspace/context depth | High | P0 |
| Help/policy hub | Support/profile placeholders | PARTIAL | Mobile lacks dedicated help hub and customer-account legal/payment policy links | Medium | P1 |
| Payments & Unlocks | `/customer/payments-unlocks` | MATCHED | Mobile summary/list/detail links align well | Low | P2 |
| Profile basic edit | `/customer/profile` | MATCHED | Name/phone edit and validation available | Low | P2 |
| Change email/password | No customer equivalent | MISSING | Email is read-only; customer change-password action absent | High | P0 |
| Rewards/referrals/free unlock credits | No customer route | MISSING | Web rewards dashboard has no mobile customer equivalent | Medium | P1 |
| Reviews/history convenience | Placeholder only | MISSING | Reviews marked coming soon; book-again convenience absent | Low | Later |
| Customer navigation | Drawer/bottom nav/top bar | PARTIAL | Mobile omits Rewards and dedicated Help/legal links; adds Settings and central Post sheet | Medium | P1 |
| EN/BG customer localization | `src/lib/i18n/en.ts`, `bg.ts` | PARTIAL | Different key systems and incomplete semantic parity; web BG contains mixed English | Medium | P1 |

### Parity status totals

- MATCHED: 10
- PARTIAL: 13
- MISSING: 5
- DIFFERENT UX BUT ACCEPTABLE: 1

## 5. Button/Action Parity Matrix

Labels below summarize observed meaning; exact labels vary by lifecycle state and locale.

| Action | Web behavior | Mobile behavior | Status / notes |
|---|---|---|---|
| Post task / Публикувайте задача | Opens multi-step modal and submits task | Dedicated wizard, creates authenticated task, uploads images afterward | MATCHED |
| Post Pro request / Публикувайте Pro заявка | Opens Pro modal | Dedicated Pro wizard | MATCHED |
| Add/upload photos | Posting and web task/chat surfaces | Posting upload after creation; chat images supported | PARTIAL: no equivalent post-creation task-detail upload action found |
| Edit/update task budget | Web dashboard detail modal | No mobile action | MISSING |
| Set/update schedule | Web dashboard detail modal | Set during creation; no post-creation customer action | MISSING |
| Book again | Web booking history action | No mobile action | MISSING |
| Select Tasker | Selects interested Tasker with backend checks | Capability-gated authenticated selection | MATCHED |
| Prepare/pay/finalize task payment | Stripe-backed web flow | Backend setup/finalize plus mobile Stripe confirmation | MATCHED |
| Cancel task | Free/late/support-review-aware modal | Backend-authoritative cancellation confirmation/reason | PARTIAL: mobile explanation/modal depth differs |
| Contact task support | Opens/sends contextual support request | Contextual task support request | MATCHED |
| Approve completion | Releases through existing backend payment logic | Capability-gated approval using existing backend payment logic | MATCHED |
| Reject completion | Returns task/support lifecycle according to backend | Requires reason and backend capability | MATCHED |
| Open/send task chat | Text/images plus rich task context | Text/images and capability gating | PARTIAL |
| Unlock Pro responses | Paid unlock and reward-credit unlock | Paid checkout supported | PARTIAL: reward-credit/customer rewards UI missing |
| Compare Pros | Full response comparison and profile links | Full/limited response detail and selection cards | PARTIAL |
| View full Pro profile | Standalone route | Embedded summaries only | MISSING |
| Select Pro | Selects response | Authenticated select response | MATCHED |
| Remove/discard Pro response | Removes from comparison | Authenticated discard action | MATCHED |
| Invite/cancel site visit | Pro request/profile/chat workflow | Invite and cancel from Pro detail | PARTIAL |
| Open Pro chat | Dedicated Pro chat route | Depends on message thread exposure; no dedicated route | PARTIAL |
| Submit support request | Contact/support flows | Customer support form | MATCHED |
| Reply to support / confirm resolution | Full support conversation workspace | Message thread and accept/refuse resolution | PARTIAL |
| Open legal/help links | Help page links Terms, Payments, Privacy | Customer profile legal row is disabled/coming soon | MISSING |
| Edit profile | Name/phone | Name/phone | MATCHED |
| Change email | Password-confirmed web form | Email read-only | MISSING |
| Change password | Customer profile security form | No customer action | MISSING |
| Logout | Sidebar/profile | Drawer/topbar/settings/profile | MATCHED |
| Language switch | Web switcher | Topbar/settings toggle | MATCHED |
| Rewards/referral copy/redeem | Rewards dashboard | No customer mobile screen | MISSING |

## 6. Navigation Parity Matrix

| Navigation area | Web | Mobile | Finding |
|---|---|---|---|
| Primary customer home | `/dashboard/customer` | `/customer/home` plus `/customer/dashboard` | Mobile split is acceptable but may confuse users because both appear in drawer |
| Taskly tasks | Sidebar Tasks | Drawer Tasks, bottom-nav Tasks | MATCHED |
| Taskly Pro | Sidebar Pro projects | Drawer Pro projects; posting sheet | MATCHED and visually separated |
| Posting | Dashboard/modal CTAs and wrapper primary action | Central bottom Post sheet and drawer entries | DIFFERENT UX BUT ACCEPTABLE |
| Messages | Official messages sidebar; task/Pro chats elsewhere | Combined message thread list | PARTIAL but mobile consolidation is sensible |
| Support | Dedicated support conversations and Help | Contact Support plus filtered support messages | PARTIAL |
| Payments | Sidebar Payments & Unlocks | Drawer/Profile Payments & Unlocks | MATCHED |
| Rewards | Sidebar Rewards | Missing from customer drawer/profile | MISSING |
| Profile/security | Sidebar Profile | Drawer/Profile/Topbar account sheet | PARTIAL: security actions missing |
| Help/legal | Sidebar Help & Support | Support screen and disabled Terms & Privacy row | MISSING/PARTIAL |
| Notifications | Sidebar notification panel | Topbar bell and settings | MATCHED |
| Logout | Sidebar | Drawer/topbar/settings/profile | MATCHED |

Taskly and Taskly Pro are clearly separated in both products. Mobile’s blue/amber grouping is especially clear.

## 7. Design/UX Parity Findings

### Strong parity

- Taskly blue and Taskly Pro amber/gold are consistently separated.
- Mobile list/detail cards use clear status badges and backend-authored state summaries.
- Payment-protected wording is prominent in mobile.
- Mobile posting wizards are more suitable for small screens than web modals.
- Mobile loading/error/empty/unauthorized/demo states are broadly implemented.
- Mobile sticky/floating navigation and safe-area-aware bottom clearance are platform-appropriate.

### Differences needing attention

- Web dashboard supports dense inline management; mobile requires navigation into details. This is acceptable, but key next actions must remain prominent.
- Web support conversations expose richer case context and attachments; mobile support threads are less explicit.
- Full Pro profile/portfolio comparison is substantially richer on web.
- Customer profile on mobile presents disabled “Coming soon” rows for Reviews and Terms & Privacy, which weakens trust.
- Mobile has both Home and My Dashboard entries; their distinct purpose is not obvious.
- Web uses richer cancellation/payment explanatory modals; mobile needs equivalent clarity without duplicating business logic.
- Bulgarian text fit should be checked particularly for task lifecycle actions, cancellation reasons, Pro unlock/support cards, and bottom-sheet actions.

## 8. Translation Parity Findings

### Architecture

- Web: nested namespaces in `messages/en.json` and `messages/bg.json`, including `customer_dashboard`, `customer_profile`, `customer_pro_dashboard`, `customer_pro_detail`, `customer_pro_responses`, `rewards`, `sidebar`, and `admin_messages`.
- Mobile: flat typed keys in `src/lib/i18n/en.ts` and `src/lib/i18n/bg.ts`.

Exact key parity is therefore not expected; semantic/action parity should be tracked.

### Gaps and risks

- Web Bulgarian customer translations include English fallbacks/mixed-language strings in support-review and cancellation/support copy.
- Web customer-facing copy includes “Core” in payment/legal/help-related text, conflicting with the current public wording rule.
- Mobile contains internal/visible keys using “Core” in some contexts; visible customer surfaces need a dedicated wording audit.
- Mobile lacks translated customer-account legal-link actions because the UI link is still disabled.
- Rewards/referral/free-unlock translation families exist on web but have no customer mobile screen.
- Web uses detailed cancellation/payment copy that is not fully represented in mobile translations.

Recommended translation work:

1. Build a semantic EN/BG action glossary for customer lifecycle/payment/support states.
2. Remove public-facing “Core,” “V1,” “Version 1,” “escrow,” “our workers,” and “our electricians.”
3. Replace mixed English strings in Bulgarian web customer namespaces.
4. Add mobile translations alongside each approved parity phase rather than copying web keys mechanically.

## 9. Payment/Support/Security-Sensitive Parity Findings

### Payments

- Mobile task payment setup/finalize is implemented through authenticated backend endpoints.
- Mobile task actions respect backend-authored capabilities/next actions.
- Mobile Pro Access checkout is implemented.
- Payments & Unlocks history is matched.
- Free Pro unlock credits from Rewards are not surfaced on customer mobile.
- Cancellation/payment explanation depth is lower on mobile; implementation must continue relying on backend results.

### Support

- Mobile can submit general and contextual task/Pro Access support requests.
- Mobile message threads can expose support history and resolution decisions.
- Web has a dedicated support-case workspace with richer context, attachments, reply history, and resolved-state presentation.
- Closing this gap must preserve participant/ownership checks and support capabilities from the backend.

### Account security

- Web customer profile supports authenticated change email and change password.
- Mobile customer profile makes email read-only and has no change-password action.
- A mobile account change-password endpoint exists, but the only discovered connected UI is provider-side.
- Change email lacks a dedicated confirmed mobile customer flow.

This is a P0 parity gap because customers need a secure account-recovery/security path without relying on web.

## 10. Missing Mobile Features Grouped by Priority

### P0

1. Customer change-password flow using the existing authenticated account endpoint and AuthProvider conventions.
2. Customer change-email product/API decision and secure implementation.
3. Richer customer support conversation/history/reply parity, including explicit support-case context.
4. Confirm and complete Pro chat parity after unlock/contact rules.
5. Verify cancellation/payment/support-review action clarity against web while preserving backend authority.

### P1

1. Customer Rewards/referrals/free Pro unlock credits screen.
2. Standalone full approved-Pro profile/portfolio route from comparison.
3. Customer-account Help & Policy hub with Terms, Payments policy, and Privacy links.
4. Task post-creation update decisions: budget, schedule, and image additions.
5. Clarify Home versus My Dashboard navigation.
6. Expand Pro comparison/site-visit context where backend already exposes safe fields.
7. Customer-facing EN/BG wording cleanup and removal of forbidden public wording.

### P2

1. Book-again convenience.
2. Reviews/history surface.
3. Additional dashboard summary/polish parity.
4. Denser payment/cancellation explanatory copy and trust cards.

### Later

- Web-only installation/Telegram connection banners unless they become part of the mobile product strategy.
- Exact visual reproduction of dense desktop dashboard/modal layouts.

## 11. Recommended Implementation Phases

### Phase 1: Customer security and trust

- Add customer change-password UI using existing mobile account endpoint.
- Decide and document mobile change-email behavior.
- Connect real legal/help links inside customer account.
- Complete forbidden-wording and Bulgarian fallback audit.

### Phase 2: Support and communication parity

- Define support-case list/detail response shape and capabilities.
- Improve support conversation context and reply/history UI.
- Confirm Pro chat thread model and allowed mobile exposure.

### Phase 3: Pro comparison confidence

- Add full approved-Pro profile/portfolio screen.
- Improve comparison, selected-Pro, chat, and site-visit transitions.
- Preserve unlock/contact privacy rules.

### Phase 4: Rewards and conversion

- Add customer Rewards/referrals screen.
- Expose free Pro unlock credits through backend-authored state.
- Keep rewards separate from payment/access calculations.

### Phase 5: Task management convenience

- Decide whether mobile should support post-creation budget/schedule/image changes.
- Add book-again and reviews only after backend contracts/product rules are explicit.

## 12. Open Questions / Needs Founder Decision

1. Should `/customer/home` and `/customer/dashboard` remain separate, or should one become the canonical customer landing screen?
2. Should customer mobile support change email directly, or guide users to support/web after password confirmation?
3. Is a dedicated mobile support-case workspace required, or should support remain unified with Messages?
4. Should mobile expose dedicated Pro chat, or continue using the unified message thread model?
5. How much approved-Pro profile and portfolio detail should be visible before and after Pro Access unlock?
6. Should customers edit task budget/schedule after posting on mobile, and which backend next actions authorize it?
7. Should mobile expose Rewards at launch, including referral redemption and free Pro unlock credits?
8. Are Reviews and Book Again launch requirements or later retention features?
9. Should Help & Support be a dedicated mobile hub separate from Contact Support?
10. Which customer web wording should be replaced first to remove public-facing “Core” and mixed Bulgarian/English strings?

## Audit Evidence

### Key web files inspected

- `D:\Taskly\src\app\dashboard\customer\**\page.tsx`
- `D:\Taskly\src\components\customer\CustomerDashboardContent.tsx`
- `D:\Taskly\src\components\customer\CustomerMessagesPage.tsx`
- `D:\Taskly\src\components\Sidebar.tsx`
- `D:\Taskly\src\components\SidebarWrapper.tsx`
- `D:\Taskly\src\components\PostTaskModal.tsx`
- `D:\Taskly\src\components\pro\ProRequestModal.tsx`
- `D:\Taskly\src\components\pro\CustomerProResponsesSection.tsx`
- `D:\Taskly\src\app\dashboard\support\page.tsx`
- `D:\Taskly\src\app\dashboard\rewards\page.tsx`
- `D:\Taskly\src\components\rewards\RewardsDashboardView.tsx`
- `D:\Taskly\src\app\chat\[id]\page.tsx`
- `D:\Taskly\src\app\pro-chat\[threadId]\page.tsx`
- `D:\Taskly\src\app\pro\pros\[proProfileId]\page.tsx`
- `D:\Taskly\messages\en.json`
- `D:\Taskly\messages\bg.json`

### Key mobile files inspected

- `app/customer/**`
- `src/components/taskly/CustomerDrawer.tsx`
- `src/components/taskly/CustomerTopBar.tsx`
- `src/components/taskly/CustomerBottomNav.tsx`
- `src/components/taskly/CustomerCreateBarVisibility.tsx`
- `src/components/taskly/KeyboardAwareFormScreen.tsx`
- `src/components/ui/Screen.tsx`
- `src/lib/api/customer.ts`
- `src/lib/api/messages.ts`
- `src/lib/api/imageUploads.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/api/domain.ts`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/bg.ts`

No application logic, routes, translations, APIs, or backend behavior were changed during this audit.
