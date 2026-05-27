# Phase 38E - Customer Task Cards + Task Detail Lifecycle Web Parity

## Web Files Inspected

- `D:\Taskly\src\components\customer\CustomerDashboardContent.tsx`
- `D:\Taskly\src\components\TaskScheduleRow.tsx`
- `D:\Taskly\src\components\payments\AcceptedCardBrands.tsx`
- `D:\Taskly\src\components\TasklyLogo.tsx`

## Mobile Files Inspected

- `app/customer/tasks.tsx`
- `app/customer/tasks/[taskId].tsx`
- `app/customer/home.tsx`
- `src/lib/api/customer.ts`
- `src/lib/api/domain.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/api/mockApi.ts`
- `src/components/ui/AppCard.tsx`
- `src/components/ui/AppButton.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/bg.ts`

## Web Patterns Extracted

- Customer task cards use compact white surfaces, soft borders, subtle shadows, status chips, schedule chips, payment-protected messaging, and one obvious next action.
- Task detail is section-based: hero/status, cancellation policy, photos, interested Taskers, description, schedule, current phase, payment value, support/cancellation actions, and completion review.
- Web lifecycle presentation emphasizes customer guidance instead of raw status fields.
- Payment copy is reassuring and user-facing; mobile must keep payment decisions backend-authored.

## Task List Parity Changes

- Rebuilt `app/customer/tasks.tsx` around premium Taskly cards.
- Added compact status/payment/cancellation/support chips.
- Added budget, schedule, and location summary rows.
- Added a clear next-step panel using backend `nextActions`.
- Added unread message count when available.
- Replaced customer-facing workspace/debug-style wording with Taskly wording.
- Kept task opening routed to the existing detail screen.

## Task Detail Parity Changes

- Reordered the detail screen into web-style sections:
  - Header/status hero
  - Task summary
  - Schedule and selected Tasker
  - Payment protected
  - Payment setup
  - Tasker responses
  - Photos
  - Progress
  - Cancellation/support
  - Completion review
- Preserved existing backend-driven action handlers for payment setup, Tasker selection, cancellation, support request, approve completion, and reject completion.
- Converted hardcoded loading/not-found/error/detail labels to localized copy.
- Improved Tasker response cards without changing selection rules.

## Payment Protected Section Changes

- The list and detail screens now consistently use `Payment protected` / `Плащането е защитено`.
- No Stripe internals are shown beyond the already-existing secure card setup copy.
- Mobile still uses backend `paymentState` and `nextActions` only.
- No payment capture, release, refund, fee, payout, or Stripe decisions were added.

## Lifecycle Action Section Changes

- Existing lifecycle actions remain gated by backend `nextActions`.
- Read-only next-step copy now appears as a compact section instead of a raw disabled action area.
- Completion approval/rejection, cancellation, and support request behavior was not changed.

## EN/BG Wording Changes

- Added concise EN/BG labels for:
  - Taskly task intro
  - Loading/error states
  - Budget, schedule, location, next step
  - Task summary, selected Tasker, photos, progress
  - Missing schedule and no selected Tasker states
- Bulgarian strings are short enough for card labels and small screens.

## API/Backend Parity Gaps

- Mobile can only render fields exposed by the current mobile task read models.
- Web has richer inline schedule/budget editing and photo management in the task detail modal; mobile keeps the existing implemented mutation surface and does not add new upload/edit flows in this phase.
- Some web tasker profile detail fields are richer than mobile previews; mobile shows only the safe backend-provided preview.

## Deferred Items

- Full web-parity schedule editing on mobile.
- Full web-parity task photo add/delete management on mobile.
- Rich Tasker profile modal from task detail.
- More detailed cancellation policy expansion if backend exposes mobile-ready copy.
- Manual device screenshot review for compact Bulgarian labels.

## Manual QA Checklist

- Open My Taskly tasks in EN and BG.
- Confirm task cards show status, payment protected state, budget, schedule, location, next step, and unread count without clipping.
- Open a task detail with interested Taskers and confirm selection action still appears only when backend allows it.
- Open reserved/payment-needed task and confirm payment protected setup still appears only when backend allows it.
- Open in-progress and pending-completion tasks and confirm completion approval/rejection remains backend-gated.
- Open cancellation/support demo states and confirm no refund/payment decision is made on mobile.
- Confirm no public “Core”, “workspace”, “read-only”, “phase”, or “escrow” wording appears on these screens.
