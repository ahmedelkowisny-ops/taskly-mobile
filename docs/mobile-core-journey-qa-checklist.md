# Mobile Core Journey QA Checklist

Manual test plan for one full Core task journey across customer and provider mobile workspaces.

## A. Setup

- Backend project `D:\Taskly` is running locally with the expected mobile API routes.
- Mobile project `D:\Taskly-app` is running in Expo with `EXPO_PUBLIC_TASKLY_API_BASE_URL` pointing to the backend.
- Use one customer account with Customer Workspace access.
- Use one approved Core Tasker/provider account with Provider Workspace access.
- Customer task city/category must match the provider Core Tasker profile city/category.
- Stripe/payment test mode should be configured through the existing backend/web flow. Mobile must only show backend payment readiness and must not calculate it.
- Schedule the task so provider runtime gates can be tested:
  - `Mark on the way` is expected only near the scheduled start window.
  - `Start task` is expected at the allowed time, or after on-the-way if backend rules allow it.

## B. Customer Creates Core Task

- Open Customer Workspace and start Core task posting.
- Verify required-field validation shows visible helper/error text.
- Create a fixed-scope Core task with category, city, address/location, schedule, budget/price inputs, and description.
- Add images where allowed; verify upload happens after creation.
- If image upload fails, verify the task remains created and a friendly warning is shown.
- Verify the task appears in My Tasks.
- Open task detail and confirm title, description, category, city, schedule, price, status, payment status, images, and timeline render.

## C. Provider Expresses Interest

- Log in as the approved provider.
- Open Provider Workspace, then Core Tasks.
- Verify the matching task appears with `Available` and `Express interest`.
- Tap `Express interest`.
- Verify success copy says interest was sent and the customer will choose a Tasker.
- Try expressing interest again; verify duplicate interest is handled safely.
- Confirm the provider did not reserve or assign the task directly.

## D. Customer Selection And Payment Setup

- Use the existing customer-owned selection/payment flow. If mobile payment entry is not connected, complete this through the current web/customer flow.
- Select the interested Tasker through the existing customer-owned flow.
- Prepare payment through the existing backend/web payment flow.
- Verify the task becomes assigned/reserved/upcoming.
- Verify mobile shows `Payment protected` only when the backend payment state says it is ready/protected.
- Confirm mobile never calls `reserveTasker` from provider screens.

## E. Messaging

- Open the Core task conversation as customer.
- Send a text message.
- Send an image message if backend capabilities allow attachments.
- Open the same conversation as provider.
- Verify text and image messages are visible to both participants.
- Verify attachment UI is hidden or blocked when `canSendAttachments` is false.
- Verify no private phone/email/contact details are exposed.

## F. Provider Runtime Actions

- On the provider task detail, verify only one primary action is emphasized at a time.
- When available, tap `Mark on the way`; verify it notifies status only and does not start the task.
- When available, tap `Start task`; verify status moves to in progress through backend response.
- When available, tap `Request completion`; verify the task waits for customer approval and is not completed by provider.

## G. Customer Completion Decision

- Open customer task detail while completion is pending.
- Verify the completion card explains approval and protected payment release.
- Tap `Ask for changes`, enter a reason, and submit.
- Verify the task returns to in progress and no dispute/refund/help flow is created.
- As provider, request completion again after the task is ready.
- As customer, tap `Approve completion`.
- Verify payment release behavior follows existing backend approve-completion/payment logic.
- Verify safe payment warnings may appear, but raw Stripe/payment errors do not.

## H. Negative Tests

- Wrong customer cannot view or act on another customer's task.
- Wrong provider cannot start, mark on the way, request completion, or view private address/contact data.
- Unassigned provider cannot run reserved/in-progress task actions.
- Too-early on-the-way/start actions are blocked with friendly copy.
- Payment-not-ready approval is blocked with friendly copy.
- Completed, cancelled, and disputed tasks show no active lifecycle actions.
- API errors show retry/demo options without secrets or raw backend stack traces.

## I. Bulgarian UI Pass

- Switch app language/session to Bulgarian where supported.
- Check Core list/detail status labels, buttons, and completion card copy.
- Verify long labels fit on mobile widths:
  - `Плащането е защитено`
  - `Заяви интерес`
  - `Поискай корекции`
  - `Чака одобрение от клиента`
  - `Заяви завършване`
  - `Одобри завършването`

## J. Demo Mode Pass

- Enable demo mode.
- Verify demo screens do not call backend APIs.
- Check demo Core states: available, interest sent, reserved/upcoming, in progress, waiting for customer approval, and completed.
- Verify demo labels use `Express interest`, `Request completion`, `Approve completion`, `Ask for changes`, and `Payment protected`.

## K. Known Out Of Scope

- Cancellation, refund, dispute, and help flows.
- Pro Access unlock/payment.
- Pro request provider responses.
- Push notifications.
- App Store polish.
