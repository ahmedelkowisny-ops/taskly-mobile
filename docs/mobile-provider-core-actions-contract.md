# Mobile Provider Core Actions Contract

Phase 22A reviewed the existing backend/web Core Tasker lifecycle so future mobile provider actions can use backend-owned rules instead of recreating eligibility on the device.

This document is a contract proposal only. It does not connect provider mutations.

## Scope

- Core Tasker actions for existing Core tasks.
- Provider mobile action contracts and sequencing.
- Backend remains the source of truth for eligibility, lifecycle, payment, matching, schedule, and privacy.

Out of scope:

- Pro request provider responses.
- Pro Access payment or unlock.
- Customer cancellation/refund/dispute/help mutations.
- Payment or Stripe flows.
- New lifecycle statuses.
- Mobile exposure of private customer data before the backend allows it.

## Backend Sources Reviewed

- `D:\Taskly\prisma\schema.prisma`
- `D:\Taskly\src\app\actions.ts`
- `D:\Taskly\src\app\actions\payments.ts`
- `D:\Taskly\src\lib\stripe-ops.ts`
- `D:\Taskly\src\lib\tasker-verification.server.ts`
- `D:\Taskly\src\lib\mobile-provider-readonly.ts`
- `D:\Taskly\src\app\api\mobile\provider\core-tasks\route.ts`
- `D:\Taskly\src\app\api\mobile\provider\core-tasks\[taskId]\route.ts`
- `D:\Taskly\src\app\dashboard\tasker\page.tsx`
- `D:\Taskly\src\app\tasks\page.tsx`
- `D:\Taskly\src\components\customer\CustomerDashboardContent.tsx`

Mobile reference files reviewed:

- `app/provider/core-tasks.tsx`
- `app/provider/core-tasks/[taskId].tsx`
- `src/lib/api/provider.ts`
- `src/lib/api/domain.ts`
- `src/lib/api/endpoints.ts`

## Current Backend Model

Core task status is stored in `Task.status`:

- `OPEN`
- `RESERVED`
- `IN_PROGRESS`
- `PENDING_COMPLETION`
- `COMPLETED`
- `DISPUTED`
- `CANCELLED_BY_CUSTOMER_GRACE`
- `CANCELLED_BY_CUSTOMER_LATE`
- `CANCELLED`

Reservation/payment readiness uses additional fields:

- `Task.reservationState`: `NONE`, `RESERVED`, `PAYMENT_PENDING`, `PAID_HELD`, `RELEASED`, `REFUNDED`, `FAILED`
- `Task.reservedTaskerId`
- `Task.reservationToken`
- `Task.reservationExpiresAt`
- `Task.taskerId`
- `Task.assignedAt`
- `Task.onTheWayAt`
- `Task.startedAt`
- `Payment.status`: `INITIATED`, `HOLDING`, `HELD`, `RELEASED`, `DISPUTED`, `REFUNDED`, `CANCELLED_WITH_FEE`, `FAILED`
- `Booking.status`: `REQUESTED`, `RESERVED`, `EXPIRED`, `CANCELLED`, `ACTIVE`, `COMPLETED`
- `TaskInterest.status`: `INTERESTED`, `NOT_SELECTED`, `SELECTED`, `WITHDRAWN`

## Current Mobile Read-Only Behavior

The provider mobile Core task list is read-only.

`mobile-provider-readonly.ts` currently returns:

- Open matching tasks when the provider Core Tasker status is approved and the task matches the tasker's city and service categories.
- Assigned/reserved provider tasks for `RESERVED`, `IN_PROGRESS`, `PENDING_COMPLETION`, and `DISPUTED`.
- Private address as the real address only when the provider is assigned or reserved; otherwise it returns `Address shared after selection`.
- Coarse `nextAction` labels only, with buttons disabled in the mobile detail screen.

## Existing Provider Core Action Map

| Action | Existing backend/web source | Current owner | Key server-side checks found | Side effect |
| --- | --- | --- | --- | --- |
| View available matching task | `getAvailableTasks`, `getMatchingCoreTaskRows`, `canProviderSeeCoreTask` | Provider read-only | Tasker access, approved Core status, profile city, service categories, task `OPEN`, `reservationState: NONE`, no reserved tasker, task readiness/preflight | None |
| Express interest / respond | `interestTask`, `expressInterest`, web `/tasks` page | Provider | Authenticated same tasker, verified tasker/Stripe readiness, task `OPEN`, assignment state `OPEN`, not own task, city match, category eligibility, task preflight, preferred-tasker window, tools confirmation for risky categories | Creates or updates `TaskInterest` as `INTERESTED`; not an assignment |
| Customer selects tasker | `reserveTasker`, customer dashboard | Customer/admin | Authenticated task owner/admin, schedule required, tasker city match, task preflight, verified tasker, category eligibility, schedule conflict lock, task still open/reservable | Sets task `RESERVED`, `reservationState: RESERVED`, `reservedTaskerId`, reservation token/expiry, creates `Booking` as `RESERVED`, updates interest statuses |
| Customer starts payment setup | `startPayment` | Customer | Authenticated customer, matching reservation token, task `RESERVED`, `reservationState: RESERVED`, unexpired reservation, schedule present | Moves `reservationState` to `PAYMENT_PENDING` |
| Payment finalizes assignment | payment finalization in `actions/payments.ts` | Customer/payment system | Customer ownership, token, `PAYMENT_PENDING`, schedule, no tasker schedule conflict, payment method/Stripe or mock availability | Sets task `IN_PROGRESS`, clears reservation token, assigns `taskerId`, creates/updates payment as `INITIATED`, booking `ACTIVE` |
| Chat with customer | Core booking chat APIs from messaging phases | Customer/provider participants | Booking participant access and supported Core booking thread | Message rows only; no lifecycle change |
| Mark on the way | `markOnTheWay`, tasker dashboard | Provider | Authenticated assigned tasker, verified tasker, task `RESERVED`/`IN_PROGRESS`/`PENDING_COMPLETION`/`DISPUTED`, schedule present, payment execution-ready, within 2 hours of scheduled start | Sets `onTheWayAt`, notifies customer |
| Start task | `startTask`, tasker dashboard | Provider | Authenticated assigned tasker, verified tasker, task `RESERVED` or `IN_PROGRESS`, schedule present, payment execution-ready, at scheduled start unless `onTheWayAt` exists, not after scheduled end | Sets `startedAt`; current function does not change `Task.status` |
| Request completion | `requestTaskCompletion`, tasker dashboard | Provider | Authenticated assigned tasker, verified tasker, booking exists, task `IN_PROGRESS` or `PENDING_COMPLETION`, task not completed, `startedAt` exists | Transitions task to `PENDING_COMPLETION`, keeps booking `ACTIVE`, notifies customer |
| Customer approves completion | `approveCompletion`, `approveTaskCompletion` | Customer | Customer/booking checks and payment release logic | Completes booking/task and releases payment |
| Customer rejects completion | `rejectCompletion`, `rejectTaskCompletion` | Customer | Customer/booking checks | Moves task back to `IN_PROGRESS` |
| Provider cannot attend / cancel | No clear mobile-safe provider cancellation contract found | Unknown | Web tasker UI shows cancellation/support policy messaging; payment helpers include no-show/dispute helpers | Needs separate product/backend review |
| Completed job artifacts | Tasker dashboard invoice/review UI | Provider read-only/future | Completed booking context | Invoice/review behavior should be separate from lifecycle actions |

## Recommended Mobile Phase Order

1. Phase 22B: Provider express interest/respond to an open matching Core task. Implemented.
   - Use `expressInterest` semantics.
   - Do not expose a direct provider "accept" unless product confirms a direct-accept backend path. Current reservation is customer-owned.
   - Support tools-confirmation requirements when the backend returns that reason code.

2. Phase 22C: Provider "On the way". Implemented.
   - Use the existing `markOnTheWay` server logic.
   - Keep the two-hour schedule gate server-side.

3. Phase 22D: Provider "Start task". Implemented.
   - Use the existing `startTask` server logic.
   - Keep payment readiness and schedule gates server-side.
   - Confirm whether the existing `startTask` timestamp-only behavior is intentional before mobile labels imply a status transition.

4. Phase 22E: Provider "Request completion". Implemented.
   - Use the existing `requestTaskCompletion` server logic.
   - Requires `startedAt` and an active/in-progress task.

5. Phase 22F: Provider action UI/nextActions consistency.
   - Expand mobile read-only `nextActions` so list/detail cards show server-owned eligibility and blocked reasons consistently.

Later phases should separately review provider cancellation/cannot-attend, invoices, reviews, no-show, disputes, and payment entry points.

## Proposed Mobile Endpoint Contracts

All provider action endpoints must:

- Require mobile auth through existing mobile session helpers.
- Derive the authenticated user from the mobile token/session.
- Verify provider/tasker role and Core Tasker approval/verification server-side.
- Verify task visibility, assignment, or participant status server-side.
- Return a refreshed mobile task detail or at least refreshed `nextActions`.
- Never accept server-owned fields from mobile: task status, booking status, reservation state, payment status, assignment, taskerId, customerId, lifecycle timestamps, Stripe/payment fields, dispute/refund fields, or private customer contact fields.

### Express Interest

`POST /api/mobile/provider/core-tasks/[taskId]/interest`

Status: implemented in Phase 22B.

Request:

```json
{
  "toolsConfirmed": true
}
```

`toolsConfirmed` is optional and only meaningful when the backend requires category tools confirmation. The route otherwise accepts an empty JSON body. The current `TaskInterest` model does not have a customer-facing message/note field, so mobile does not send or store an interest message in this phase.

Checks:

- Authenticated provider is the tasker expressing interest.
- Tasker is verified through existing `requireVerifiedTaskerById`.
- Task exists, is not deleted, is `OPEN`, and assignment state is open.
- Task is not authored by the tasker.
- Provider city matches task city.
- Provider service/category eligibility matches the task.
- Task preflight passes.
- Preferred-tasker window allows this tasker.
- Tools confirmation is present when required.

Success response proposal:

```json
{
  "alreadyInterested": false,
  "task": {
    "...": "ProviderCoreTaskDetail",
    "nextActions": {
      "canExpressInterest": false,
      "canChat": false,
      "canMarkOnTheWay": false,
      "canStart": false,
      "canRequestCompletion": false,
      "canCancelOrReportIssue": false,
      "primary": {
        "type": "interest_sent",
        "label": "Interest sent"
      }
    }
  }
}
```

Errors:

- `UNAUTHORIZED`
- `TASKER_NOT_VERIFIED`
- `TASK_NOT_OPEN`
- `TASK_CITY_MISMATCH`
- `TASKER_SERVICE_CATEGORY_MISMATCH`
- `TASK_SCOPE_CHECKLIST_INCOMPLETE`
- `TASK_REQUIRED_PHOTOS_MISSING`
- `PREFERRED_TASKER_ONLY`
- `TOOLS_CONFIRMATION_REQUIRED`
- `TASKER_TIME_CONFLICT` if future backend rules add it

Mobile display:

- Show only for eligible `OPEN` matching tasks.
- Hide or disable with backend `blockedReasonCode` for non-eligible tasks.
- Use "Express interest" / "respond" wording only. Do not show "Accept" or "Reserve".

### Direct Accept / Reserve

Do not propose a provider direct-accept endpoint yet.

The current source of truth uses:

- Provider expresses interest.
- Customer selects a tasker with `reserveTasker`.
- Customer/payment flow moves reservation/payment state forward.

If a product decision later introduces direct provider accept, it needs a backend design that explicitly handles customer consent, payment setup, reservation locks, schedule conflicts, and notifications.

### Mark On The Way

`POST /api/mobile/provider/core-tasks/[taskId]/on-the-way`

Status: implemented in Phase 22C.

Request:

```json
{}
```

Checks:

- Authenticated user is the assigned/reserved tasker.
- Tasker is verified.
- Task is in an actionable state allowed by existing backend logic.
- Schedule exists.
- Payment is execution-ready by backend logic.
- Current time is within two hours of scheduled start.
- Idempotent when `onTheWayAt` already exists.
- Mobile must not send `startedAt`, completion, payment, booking, reservation, tasker/customer, Stripe, status, or lifecycle fields.

Success response proposal:

```json
{
  "task": { "...": "ProviderCoreTaskDetail" },
  "onTheWayAt": "2026-05-24T10:00:00.000Z",
  "nextActions": { "...": "ProviderCoreTaskNextActions" }
}
```

Errors:

- `UNAUTHORIZED`
- `TASKER_NOT_VERIFIED`
- `NOT_ASSIGNED_TASKER`
- `TASK_NOT_ACTIONABLE`
- `SCHEDULE_REQUIRED`
- `PAYMENT_NOT_READY`
- `TOO_EARLY_ON_THE_WAY`

Mobile display:

- Show only when backend says `canMarkOnTheWay`.
- Display the exact backend blocked reason when too early.
- The UI must make clear that On the way does not start the task.
- Start Task remains a future phase.

### Start Task

`POST /api/mobile/provider/core-tasks/[taskId]/start`

Status: implemented in Phase 22D.

Request:

```json
{}
```

Checks:

- Authenticated user is the assigned/reserved tasker.
- Tasker is verified.
- Task is `RESERVED` or `IN_PROGRESS` according to existing backend logic.
- Schedule exists.
- Payment is execution-ready.
- Current time is at/after scheduled start unless `onTheWayAt` exists.
- Current time is before scheduled end.
- Idempotent when `startedAt` already exists.

Success response proposal:

```json
{
  "task": { "...": "ProviderCoreTaskDetail" },
  "startedAt": "2026-05-24T10:15:00.000Z"
}
```

Errors:

- `UNAUTHORIZED`
- `TASKER_NOT_VERIFIED`
- `NOT_ASSIGNED_TASKER`
- `TASK_NOT_READY`
- `SCHEDULE_REQUIRED`
- `PAYMENT_NOT_READY`
- `TOO_EARLY_START_TASK`
- `TOO_LATE_START_TASK`

Mobile display:

- Show only when backend says `canStart`.
- Show a confirmation prompt before calling the endpoint.
- Explain that the provider should use it only when ready to begin the work.
- Keep helper copy schedule-aware for too-early cases.
- Do not show or connect Request Completion in this phase.
- Do not imply that mobile captures, releases, refunds, or changes payment objects.

### Request Completion

`POST /api/mobile/provider/core-tasks/[taskId]/request-completion`

Status: implemented in Phase 22E.

Request:

```json
{}
```

Checks:

- Authenticated user is assigned tasker on the booking.
- Tasker is verified.
- Booking exists.
- Task is `IN_PROGRESS` or already `PENDING_COMPLETION`.
- Task is not completed.
- Cancelled and disputed tasks are blocked.
- `startedAt` exists.
- Non-empty `note` is rejected because the current web request-completion action has no completion note field.
- Already `PENDING_COMPLETION` is idempotent and does not create another customer notification.

Success response:

```json
{
  "alreadyPending": false,
  "task": { "...": "ProviderCoreTaskDetail" },
}
```

Errors:

- `UNAUTHORIZED`
- `TASKER_NOT_VERIFIED`
- `BOOKING_NOT_FOUND`
- `NOT_ASSIGNED_TASKER`
- `TASK_COMPLETED`
- `TASK_CANCELLED`
- `TASK_DISPUTED`
- `TASK_NOT_IN_PROGRESS`
- `TASK_NOT_STARTED`
- `NOTE_NOT_SUPPORTED`

Mobile display:

- Show only when backend says `canRequestCompletion`.
- Show a confirmation prompt before calling the endpoint.
- Explain that the customer must approve before the task is completed.
- After success, show pending customer approval.
- Do not add customer approve/reject actions.
- Do not mark the task completed locally unless the backend response says so in a future customer/payment phase.
- Do not imply that mobile captures, releases, refunds, or changes payment objects.

### Cancel / Cannot Attend

No mobile endpoint should be added in Phase 22B-22E.

The current codebase has customer cancellation policy logic and no-show/dispute helpers, but no clearly isolated provider cannot-attend contract for mobile. This should be reviewed as a separate cancellation/dispute phase because it may affect fees, payment state, support review, and customer notifications.

## Proposed Provider NextActions Shape

The current mobile provider response returns simple actions:

```ts
type ProviderNextAction = {
  accent?: "core" | "neutral" | "pro";
  href: string | null;
  label: string;
  type: string;
};
```

Future action phases should add a backend-authored Core capability object to list and detail responses while keeping the existing label/action list for display compatibility:

```ts
type ProviderCoreTaskBlockedReasonCode =
  | "TASKER_NOT_APPROVED"
  | "TASKER_NOT_VERIFIED"
  | "CITY_MISMATCH"
  | "CATEGORY_MISMATCH"
  | "TASK_NOT_OPEN"
  | "INTEREST_ALREADY_SENT"
  | "TASK_RESERVED_FOR_OTHER_TASKER"
  | "PAYMENT_NOT_READY"
  | "SCHEDULE_REQUIRED"
  | "TOO_EARLY_ON_THE_WAY"
  | "TOO_EARLY_START_TASK"
  | "TOO_LATE_START_TASK"
  | "TASK_NOT_STARTED"
  | "THREAD_NOT_AVAILABLE"
  | "SUPPORT_REVIEW"
  | "UNKNOWN";

type ProviderCoreTaskNextActions = {
  canExpressInterest: boolean;
  canChat: boolean;
  canMarkOnTheWay: boolean;
  canStart: boolean;
  canRequestCompletion: boolean;
  canCancelOrReportIssue: boolean;
  primary?: {
    type:
      | "express_interest"
      | "interest_sent"
      | "open_chat"
      | "mark_on_the_way"
      | "start_task"
      | "request_completion"
      | "await_customer_approval"
      | "view_completed"
      | "contact_support";
    label: string;
    method?: "POST";
    endpoint?: string;
  };
  blockedReason?: string;
  blockedReasonCode?: ProviderCoreTaskBlockedReasonCode;
};
```

Mobile may use this object to show, hide, or disable controls, but the backend endpoint must still repeat all checks.

## Risky Or Unclear Areas

- Direct provider accept is not the current web flow. Current web flow is provider interest, then customer selection/reservation/payment setup.
- `reserveTasker` is customer-owned and should not be exposed as a provider mobile action.
- The payment flow can move `PAYMENT_PENDING` to `IN_PROGRESS` and assign `taskerId`; mobile provider code must not reproduce that.
- `startTask` currently sets `startedAt` but does not update task status. Do not change or reinterpret that behavior in mobile without a backend lifecycle decision.
- `markOnTheWay` allows existing backend states including `DISPUTED`; mobile should not assume this means all disputed actions are available.
- Provider cancellation/cannot-attend behavior is not a safe standalone contract yet.
- Stripe verification currently gates provider actions through `requireVerifiedTaskerById`; mobile should display backend reasons, not recreate Stripe eligibility.
- Schedule gates and payment readiness must remain server-enforced.
- City/category matching must use the backend provider profile and category eligibility logic, including restricted category capabilities.
- Private address is currently shown only after provider assignment/reservation in mobile read-only detail; this must remain true for action phases.
- Customer completion approval/rejection remains customer-side and should not be mixed into provider action phases.

## Phase 22B Recommendation

Phase 22B implemented only:

- `POST /api/mobile/provider/core-tasks/[taskId]/interest`
- Mobile action UI for open matching tasks when backend `nextActions.canExpressInterest` is true
- Tools-confirmation handling when the backend returns `TOOLS_CONFIRMATION_REQUIRED`
- Refetch of provider Core task detail/list after success

Phase 22B did not:

- Reserve or assign the tasker.
- Start payment.
- Move task status or reservation state.
- Expose private address/contact details.
- Add cancellation, dispute, payment, Stripe, provider response, Pro unlock, or lifecycle actions beyond expressing interest.
