# Mobile Web Route Parity Audit

Phase 38B audit for aligning the Taskly Expo app with the Taskly web product and design system. This is documentation only; no route redesigns were implemented in this phase.

## Executive Summary

The web app currently has the stronger product structure. It uses guided modals, richer task lifecycle detail, policy-aware support/payment sections, structured Taskly Pro response cards, and a clearer premium visual system. The mobile app has many backend-connected flows already, but several screens are still basic native forms or card lists and do not yet mirror the web app's guided sections, modal hierarchy, address/map picker, review steps, and polished card language.

Highest-risk parity gaps:

- Customer post Taskly task is functional but much simpler than the web six-step wizard. Mobile lacks the web map/address picker, tier/add-on budget guidance, checklist confirmation, preferred language, and final review step.
- Customer post Taskly Pro request is functional but misses web fields such as map-derived address/district, project size, property type, site visit needed, internal location details, category tags, and richer photo preparation guidance.
- Task detail on mobile has lifecycle actions, payment protected setup, cancellation/support, completion approve/reject, images, and timeline, but the layout is flatter than the web task detail modal and does not yet match web policy/action hierarchy.
- Provider Pro response exists on mobile, but web uses controlled option sets for intent, materials, estimate confidence, site visit policy, availability, included/excluded items, and contact-leakage messaging. Mobile currently uses more free-text fields.
- Navigation parity is partial. Phase 38A improved the public entry shell, but authenticated mobile still uses bottom tabs only. Web has a stronger sidebar/drawer model.

Recommended implementation order:

1. Phase 38C: Customer Home + Drawer from Web Design
2. Phase 38D: Customer Post Task Web-Parity Form
3. Phase 38E: Customer Task Cards + Task Detail Lifecycle
4. Phase 38F: Customer Taskly Pro Request + Access Parity
5. Phase 38G: Provider Dashboard + Taskly Work Parity
6. Phase 38H: Provider Taskly Pro Response/Site Visit Parity
7. Phase 38I: Message/account/settings polish and remaining copy/layout parity

## Files Inspected

Web/backend source in `D:\Taskly`:

- `src/app/page.tsx`
- `src/components/TasklyLogo.tsx`
- `src/components/LanguageSwitcher.tsx`
- `src/components/Sidebar.tsx`
- `src/components/SidebarWrapper.tsx`
- `src/components/MarketplacePreviewSection.tsx`
- `src/components/PostTaskModal.tsx`
- `src/components/BookTaskerModal.tsx`
- `src/components/MapPicker.tsx`
- `src/components/GoogleMapPicker.tsx`
- `src/components/customer/CustomerDashboardContent.tsx`
- `src/components/pro/ProRequestModal.tsx`
- `src/components/pro/CustomerProResponsesSection.tsx`
- `src/components/pro/ProResponseFormClient.tsx`
- `src/app/dashboard/tasker/page.tsx`
- `src/app/dashboard/pro/requests/page.tsx`
- `src/app/dashboard/pro/requests/[id]/page.tsx`
- `src/app/dashboard/pro/requests/[id]/respond/page.tsx`
- `src/app/dashboard/customer/page.tsx`
- `src/app/dashboard/customer/tasks/page.tsx`
- `src/app/dashboard/customer/pro/page.tsx`
- `src/app/dashboard/customer/pro/[id]/page.tsx`
- `src/app/globals.css`
- `messages/en.json`
- `messages/bg.json`

Mobile source in `D:\Taskly-app`:

- `app/index.tsx`
- `app/login.tsx`
- `app/customer/_layout.tsx`
- `app/customer/home.tsx`
- `app/customer/tasks.tsx`
- `app/customer/tasks/[taskId].tsx`
- `app/customer/post-task.tsx`
- `app/customer/post-pro-request.tsx`
- `app/customer/pro-requests.tsx`
- `app/customer/pro-requests/[proRequestId].tsx`
- `app/customer/messages.tsx`
- `app/customer/messages/[threadId].tsx`
- `app/customer/account.tsx`
- `app/provider/_layout.tsx`
- `app/provider/dashboard.tsx`
- `app/provider/start.tsx`
- `app/provider/core-tasks.tsx`
- `app/provider/core-tasks/[taskId].tsx`
- `app/provider/pro-requests.tsx`
- `app/provider/pro-requests/[proRequestId].tsx`
- `app/provider/messages.tsx`
- `app/provider/messages/[threadId].tsx`
- `app/provider/profile.tsx`
- `app/provider/account.tsx`
- `src/lib/api/customer.ts`
- `src/lib/api/provider.ts`
- `src/lib/api/domain.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/api/mockApi.ts`
- `src/components/taskly/*`
- `src/components/ui/*`

## Route-By-Route Parity Table

| Web route/component | Mobile route/component | Parity | Missing mobile sections | Missing mobile UI states | Missing mobile form fields | Missing card/modal elements | Backend/API availability | Recommended phase |
|---|---|---:|---|---|---|---|---|---|
| Landing `src/app/page.tsx` | `app/index.tsx` | Partial | Authenticated drawer still deferred | Menu is local entry-only | None for entry | Needs full authenticated drawer parity | Already available for auth/session | 38C |
| Web header/nav/language | `app/index.tsx`, `app/login.tsx`, layouts | Partial | Authenticated header/drawer | Role-aware drawer open/close states | None | Sidebar icon rows, overlay drawer | UI-only | 38C |
| Customer dashboard `dashboard/customer` | `app/customer/home.tsx` | Partial | Web command-center sections, richer highlights, web card style | Notification/install/Telegram equivalents are not fully adapted | None | Web-style command cards and drawer | Customer home API available | 38C |
| Customer post task `PostTaskModal` | `app/customer/post-task.tsx` | Basic | Six-step wizard, tier/add-ons, checklist, preferred language, review step | Step progress, locked-step errors, photo minimum by category | Tier code, add-ons, scope data, checklist, preferred language, map-derived address | Wizard tabs, budget recommendation card, final summary | Create route available; some web-specific fields may need backend/mobile route review | 38D |
| Customer tasks list/cards | `app/customer/tasks.tsx` | Partial | Web card grouping and richer next-action hierarchy | Budget nudge, schedule edit, payment action grouping | None | Web status chips, policy tags, richer cards | List API available | 38E |
| Customer task detail modal | `app/customer/tasks/[taskId].tsx` | Partial | Web modal section hierarchy, tasker modal polish, policy layout | Budget increase prompt, schedule edit, detailed payment breakdown | Schedule update/budget update not mobile-connected | Web hero detail card, modal sections, policy tags | Detail/actions mostly available; schedule/budget update need backend route later | 38E |
| Customer payment protected flow | `app/customer/tasks/[taskId].tsx` | Partial | Web payment explanation/breakdown styling | Payment card retry/failure states are present but flatter | None | Stripe card/payment panel parity | Mobile setup/finalize available | 38E |
| Customer cancellation/support/refund | `app/customer/tasks/[taskId].tsx` | Partial | Web late-cancel modal structure and support-review hierarchy | Support modal/passive cards present but visual parity missing | Mostly present | Web modal copy and policy summary layout | Mobile cancel/support routes available | 38E |
| Customer completion approve/reject | `app/customer/tasks/[taskId].tsx` | Partial | Web approval dialog style and review handoff | Payout warning exists but not web-styled | None | Web confirmation modal | Mobile approve/reject routes available | 38E |
| Customer Pro dashboard/list | `app/customer/pro-requests.tsx` | Partial | Web command-center and response health cards | Unlock/payment/support badges present but basic | None | Web Pro card surfaces and response previews | Mobile Pro list API available | 38F |
| Customer Pro request form `ProRequestModal` | `app/customer/post-pro-request.tsx` | Basic | Category tags, map/address picker, property details, site visit needed, internal details | Photo preparation and submission states are simpler | propertyType, projectSizeSqm, siteVisitNeeded, internalLocationDetails, address/location coords, tag keys | Web modal sections and Pro gold styling | Create/image upload available; missing fields need mobile API/body review | 38F |
| Customer Pro detail | `app/customer/pro-requests/[proRequestId].tsx` | Partial | Web comparison card density and unlock modal hierarchy | Support/refund and site visit states exist but need polish | Site visit fields mostly present | Web unlock banner, response cards, removed-response handling | Detail, checkout, support, site visit available | 38F |
| Customer Pro Access checkout | `app/customer/pro-requests/[proRequestId].tsx` | Partial | Web checkout explanation and return-state hierarchy | Payment pending/failed/unlocked present | None | Web unlock modal and assistant panel parity | Mobile checkout route available | 38F |
| Customer Pro comparison cards | `app/customer/pro-requests/[proRequestId].tsx` | Partial | Web rich response fields and remove-from-comparison UX | Removed response state may be less prominent | None | Pro profile image/portfolio/intent cards | Detail response available | 38F |
| Customer site visit invite/cancel | `app/customer/pro-requests/[proRequestId].tsx` | Partial | Web state hierarchy and invite card visual polish | Invite/cancel states exist | None obvious | Web Pro site visit cards | Mobile site visit routes available | 38F |
| Customer messages/admin messages | `app/customer/messages.tsx`, detail | Partial | Web admin/support message grouping | Thread capability states exist but need design parity | Attachments deferred | Web message list/detail shell | Mobile messages API available | 38I |
| Customer profile/settings/account | `app/customer/account.tsx` | Basic | Web account/settings structure | Notification/settings states partial | Profile edit fields unknown | Web settings cards | Some APIs available; profile edit unknown | 38I |
| Tasker dashboard `dashboard/tasker` | `app/provider/dashboard.tsx` | Partial | Web provider command center, install/notification banners, invoice/review surfaces | Provider approval states basic | None | Web provider summary cards | Provider dashboard API available | 38G |
| Available Taskly tasks | `app/provider/core-tasks.tsx` | Partial | Web available task feed card detail | Eligibility states present but flatter | None | Web task feed cards | Mobile provider task list API available | 38G |
| Provider Taskly task detail | `app/provider/core-tasks/[taskId].tsx` | Partial | Web modal hierarchy, payout breakdown, invoice/no-show details | Interest/lifecycle/support states exist | Completion note partly supported in API wrapper | Web lifecycle panels | Mobile lifecycle/support routes available | 38G |
| Provider cannot attend/support | `app/provider/core-tasks/[taskId].tsx` | Partial | Web no-show/cancel modal parity | Reason/details present | Mostly present | Web modal surfaces | Mobile issue/support routes available | 38G |
| Provider profile/status | `app/provider/profile.tsx`, `app/provider/start.tsx` | Partial | Web onboarding/profile detail, category capability summary | Pending/rejected/approved present but simpler | Verification/profile edit unknown | Web profile cards | Provider profile API available; mutations unknown | 38G |
| Pro Tasker workspace requests | `app/provider/pro-requests.tsx` | Partial | Web profile-gated empty states and rich cards | Profile/category approval states present but basic | None | Web Pro request card style | Mobile Pro request list API available | 38H |
| Pro request detail | `app/provider/pro-requests/[proRequestId].tsx` | Partial | Web metadata grid, response summary, images layout | Eligibility and response states exist | None | Web Pro detail sections | Mobile detail API available | 38H |
| Pro response form | `app/provider/pro-requests/[proRequestId].tsx` | Partial | Web option sets for intent, materials, estimate confidence, site visit policy, availability, included/excluded items | Contact-leakage error messaging exists backend-side, mobile form less structured | responseType/intent, estimateConfidence, included/excluded item arrays as structured options | Web accordion/section card form | Mobile response route available; wrapper/schema may need parity review | 38H |
| Pro site visit invite actions | `app/provider/pro-requests/[proRequestId].tsx` | Partial | Web cards and state labels | Accept/decline/propose states exist | None obvious | Web action card styling | Mobile routes available | 38H |
| Admin routes | None | Complete | Admin is web-only by design | Web-only | Web-only | Web-only | No mobile admin routes needed | N/A |

## Customer Taskly Task Parity

| Area | Web behavior | Mobile behavior | Parity | Gap / action |
|---|---|---|---:|---|
| Post task form structure | Six-step wizard: service, budget/tier, schedule/location, photos, checklist, review/post | Single scroll form with sections | Basic | Rebuild as native mobile stepper matching web logic. |
| Map/address picker | `GoogleMapPicker` with address autocomplete/pin; defaults to Sofia | Manual address plus latitude/longitude inputs | Basic | Replace raw lat/lng with native map/address picker or backend-compatible location selector. |
| City/category | Catalog-driven category/city; localized labels; step gating | Catalog-driven category/city cards | Partial | Keep mobile catalog APIs; improve card design and selection hierarchy. |
| Date/time selection | Date plus start/end time with lead-time, duration min/max, time slots | Raw date string fields for scheduled start/end | Basic | Add mobile date/time controls and helper validation matching web rules. |
| Schedule start/end | Web validates future date, start/end order, min/max duration | Mobile parses dates but UX is raw | Basic | Native date/time selectors needed. |
| Photos | Required photo count by category, image optimization, preview grid, upload after create | Image picker, compression, upload after create | Partial | Add category photo minimum and web-like preview/review. |
| Budget/price | Category budget range, recommended budget, tier/add-ons | Single budget field | Basic | Add range/recommendation from backend/catalog; avoid client-owned payment decisions. |
| Review/confirmation | Final summary and scope confirmation checkbox | Validation summary only | Basic | Add review step and confirmation. |
| Task list card | Rich badges, policy/payment summaries, selected tasker cues | Basic cards with badges and detail CTA | Partial | Mirror web card hierarchy and next-action emphasis. |
| Task detail | Web detail modal with hero, payment breakdown, images, interests, lifecycle, policy sections | Connected detail screen with actions/cards/timeline | Partial | Restructure into web-inspired native sections. |
| Payment protected state | Detailed setup/finalize, policy copy, payment breakdown | Stripe card setup and backend setup/finalize present | Partial | Visual/copy parity; do not change payment logic. |
| Cancellation/support/refund | Policy-aware modals and passive support states | Cancel/support routes and forms present | Partial | Match web modal hierarchy and late-cancel copy. |
| Completion approve/reject | Confirm approval/release and rejection reason | Confirm dialogs and reason field present | Partial | Polish to web-style confirmation cards. |

## Customer Taskly Pro Parity

| Area | Web behavior | Mobile behavior | Parity | Gap / action |
|---|---|---|---:|---|
| Post Pro request form | Single premium modal with category tags, map, address-derived district, budget, photos, property details, site visit | Basic scroll form with category, city, district, title, description, timeline, budget, photos | Basic | Add missing Pro project metadata and web-like sectioning. |
| Category/city | Catalog categories with localized descriptions and tags | Catalog category/city cards | Partial | Add tag chips and richer category descriptions. |
| Address/privacy | Map/address picker plus internal location details | District only; no map/address privacy controls | Basic | Add safe location section; ensure backend owns contact/address visibility. |
| Photos | Up to 10 with preview/preparation states | Image picker/upload after create | Partial | Add richer preview and web helper copy. |
| Budget range | Min/max currency inputs | Min/max fields | Partial | Improve formatting and helper copy. |
| Timeline | Preferred start date | Text timeline field | Partial | Align with web field semantics. |
| Response preview count | Web response section with locked/unlocked preview cards | List/detail response summaries | Partial | Redesign cards to match web. |
| Pro Access checkout/unlock | Web unlock banner/modal and Stripe redirect | Mobile checkout route opens browser | Partial | Visual parity and return-state polish. |
| Comparison cards | Rich Pro response cards with profiles, portfolio, quote, site visit, included/excluded fields | Mobile unlocked comparison exists but basic | Partial | Match web card density and controls. |
| Site visit invite/cancel | Web invite/cancel states, Pro cards | Mobile invite/cancel exists | Partial | Polish layout/state clarity. |
| Support/refund review | Web/admin support read-only patterns; mobile request exists | Mobile request form and passive state exist | Partial | Visual parity only; no refund logic changes. |

## Provider Taskly Parity

| Area | Web behavior | Mobile behavior | Parity | Gap / action |
|---|---|---|---:|---|
| Available task cards | Dashboard feed with status, schedule, payment, interest state | Provider task list cards | Partial | Match web cards and eligibility copy. |
| Task detail | Web selected booking/task modal with lifecycle and payment/payout summaries | Detail screen with express interest, on the way, start, request completion, issues | Partial | Native section hierarchy needed. |
| Express interest | Eligibility checked, tools confirmation where required | Mobile route and tools confirmation support present | Partial | Better UI parity for tools confirmation. |
| Assigned task state | Web booking/task state cards and schedule row | Mobile status/timeline/action cards | Partial | Match web lifecycle styling. |
| Lifecycle actions | On the way, start, request completion, no-show/dispute flows | Mobile actions connected to backend | Partial | Polish action ordering and confirmation UI. |
| Cannot attend/support | Web modal states with reason/notes | Mobile issue modes with reason/details | Partial | Match web modal copy and passive cards. |
| Profile/status/verification | Web profile/setup/status views | Mobile provider start/profile basic | Partial | Bring web status cards to mobile. |

## Provider Taskly Pro Parity

| Area | Web behavior | Mobile behavior | Parity | Gap / action |
|---|---|---|---:|---|
| Matching Pro request cards | Web Pro gold cards with category/city/budget/timeline/property/site visit/photos | Mobile Pro request cards with title/category/city/timeline/status | Partial | Add metadata grid and web visual style. |
| Request detail | Web request summary plus response CTA/summary | Mobile detail screen with request and response state | Partial | Re-section and add images/metadata prominence. |
| Submit/edit response form | Web structured radio/checkbox options and summary mode | Mobile free-text/boolean/numeric form | Partial | Convert to web option-set parity if backend supports same fields. |
| Response summary | Web collapsed summary with quote, availability, site visit, note | Mobile summary fields present | Partial | Match web summary card. |
| Site visit invite actions | Web accept/decline/propose states | Mobile actions connected | Partial | Polish with web Pro cards. |
| Profile/category approval | Web blocks/empty states for pending/rejected/no categories | Mobile profile/status basic | Partial | Add web-like profile/category state cards. |

## Design Parity

| Design area | Web source pattern | Mobile current state | Parity | Recommendation |
|---|---|---|---:|---|
| Header | White fixed header, logo left, language/menu right | Entry improved; authenticated headers inconsistent | Partial | Add shared native app header. |
| Burger/sidebar | Web sidebar/drawer with icon rows and soft cream surface | Entry menu only; authenticated tabs only | Basic | Add role-aware drawer/sidebar in a focused phase. |
| Cards/modals | Rounded 2xl/3xl cards, soft borders, subtle shadows, clear badges | `AppCard` uses small radius and left accent; some screens basic | Partial | Introduce web-inspired native card variants. |
| Taskly blue | Web uses blue for normal Taskly flows | Mobile uses blue accents | Partial | Keep but standardize surfaces and CTA tones. |
| Taskly Pro gold/orange | Web uses gold/orange cards and CTAs | Mobile uses orange on Pro screens | Partial | Standardize Pro cards/chips/buttons. |
| Typography/spacing | Compact premium web headings and small badge text | Mobile still has mixed screen-level sizes and crowded cards | Partial | Apply mobile-native type scale across route redesigns. |
| EN/BG copy tone | Web has broad localization; some older Core wording remains in legal/admin | Mobile copy improved but still has hardcoded English in lists/details | Partial | Audit route copy during each redesign. |
| Modal structure | Web uses modal overlays for forms/details | Mobile mostly full screens | Partial | Use full screens for mobile but keep web section hierarchy. |

## Backend/API Availability Notes

Already available in mobile wrappers:

- Customer home, tasks list/detail, task create, image upload
- Customer task select Tasker, payment setup/finalize, cancel, support, approve/reject completion
- Customer Pro list/detail/create, image upload, Pro Access checkout, support request, site visit invite/cancel
- Provider dashboard, Taskly task list/detail, interest, on the way, start, request completion, cannot attend/report/support
- Provider Pro list/detail, submit/update response, site visit accept/decline/propose
- Messages, notifications, catalog cities/categories/posting rules

Needs mobile wrapper only if backend already exposes equivalent mobile route:

- Any missing read-only refinements that are already in backend response but not displayed
- Additional Pro response option labels if already returned safely

Needs backend route later or contract review:

- Customer task schedule edit from mobile
- Customer task budget update/no-response nudge from mobile
- Web parity fields for Taskly task wizard if current mobile create route does not accept tier/add-ons/scope/checklist/preferred language
- Web parity fields for Pro request if current mobile create route does not accept location coordinates, internal location details, property type, project size, site visit needed, and category tags
- Native map/address picker support endpoints if geocoding/autocomplete must be backend-owned

Unknown:

- Full account/profile edit parity
- Provider onboarding/profile/category mutation parity
- Invoice download/review handoff parity on mobile

## Implementation Roadmap

### Phase 38C: Customer Home + Drawer from Web Design

- Add shared authenticated mobile header.
- Add role-aware drawer/sidebar with icons.
- Polish customer home summary/highlights with web card language.
- Preserve current backend APIs and role guards.

### Phase 38D: Customer Post Task Web-Parity Form

- Rebuild post-task as native mobile wizard.
- Add map/address picker plan or backend contract review.
- Add category budget guidance, schedule picker, photos, checklist, review confirmation.
- Keep mobile create payload server-owned and contract-safe.

### Phase 38E: Customer Task Cards + Task Detail Lifecycle

- Redesign task list cards to mirror web cards.
- Redesign task detail as native sections matching web modal hierarchy.
- Polish payment protected, cancellation/support, interested Taskers, completion approve/reject.
- Keep payment/cancellation/completion logic backend-owned.

### Phase 38F: Customer Taskly Pro Request + Access Parity

- Rebuild Pro request form with web sections.
- Add metadata fields only after confirming mobile route contract.
- Redesign Pro list/detail, response previews, unlock, comparison, site visit, support/refund cards.
- No Stripe refund or admin workflow changes.

### Phase 38G: Provider Dashboard + Taskly Work Parity

- Redesign provider dashboard and Taskly task list/detail.
- Polish approval/pending states, express interest, lifecycle actions, cannot attend/support.
- Preserve backend `nextActions` gating.

### Phase 38H: Provider Taskly Pro Response/Site Visit Parity

- Redesign matching Pro request cards and detail.
- Convert response form to web-style option sets where mobile API supports it.
- Polish response summary and site visit action states.

### Phase 38I: Messages, Account, Settings, Notifications

- Align message list/detail shell with web.
- Polish account/settings/notification cards.
- Ensure EN/BG copy and layout are clean on small screens.

## Deferred Decisions

- Native map implementation approach and whether geocoding/autocomplete should be backend-proxied.
- Whether mobile create routes should accept the full web wizard payload or a mobile-specific safe subset.
- Whether task schedule/budget update should be exposed on mobile.
- Whether provider profile/category edits should be implemented in mobile or kept web-only for now.
- Whether invoice/review flows should be mobile-native in a later phase.
