# Mobile Notifications And Deep Links Contract

Phase 31A documents the safe future contract for mobile push notifications and deep links across Core and Pro workflows. This is documentation only. Do not install `expo-notifications`, add push token routes, add notification sending hooks, add deep-link routing code, change app config, change payment/support/Pro/site visit logic, or upgrade Expo in this phase.

## Expo SDK 54 Reference Notes

- The app currently reports Expo SDK `54.0.0`; future notification work must use SDK 54-compatible packages and docs.
- Expo SDK 54 lists `Notifications` and `Linking` as SDK modules. `expo-linking` is already installed in the app, but `expo-notifications` is not installed.
- Expo push notifications require a native/device setup phase. Android push notification testing should use a development build or production build rather than Expo Go.
- Expo linking supports custom schemes and universal/app links. Expo Router can map app routes to incoming links once scheme/link handling is configured.

Reference docs:

- https://docs.expo.dev/versions/v54.0.0/
- https://docs.expo.dev/push-notifications/overview/
- https://docs.expo.dev/linking/overview/

## Existing Backend Notification Patterns Found

- Prisma has a `Notification` model with `userId`, `title`, `message`, `type`, `read`, `link`, and `createdAt`.
- Prisma has a `WebPushSubscription` model for browser/PWA push with endpoint, keys, role, locale, app-installed flag, permission state, active state, and timestamps.
- Existing web push registration route:
  - `POST /api/notifications/push-subscriptions`
  - `DELETE /api/notifications/push-subscriptions`
- Existing web push helper files:
  - `src/lib/push-subscription.ts`
  - `src/lib/push/templates.ts`
  - `src/lib/push/events.ts`
  - `src/lib/push/sender.ts`
- Existing web push delivery uses VAPID/web-push subscriptions and is not suitable as-is for Expo native push tokens.
- Existing push event templates currently cover Core-style events:
  - `customer_task_accepted`
  - `customer_helper_on_the_way`
  - `customer_new_message`
  - `customer_task_completed`
  - `tasker_selected_for_task`
  - `tasker_new_message`
  - `tasker_task_updated`
- Existing Telegram support includes `TelegramConnection`, `TelegramConnectionToken`, and helpers such as `sendTelegramMessageToUser` and `sendAdminTelegramAlert`.
- Existing email support uses `sendEmail` with backend-only SMTP environment variables.
- Existing Core mobile/backend actions already call some server-side notification helpers after lifecycle/payment-sensitive events.
- Admin/support notifications exist through web/admin patterns, but no mobile-native notification delivery contract was found.

## Existing Mobile Notification And Deep-Link Readiness

- `expo-linking` is installed.
- `expo-notifications` is not installed.
- `app.json` has the current custom scheme `tasklyapp`.
- Expo Router routes exist for:
  - `/customer/tasks`
  - `/customer/tasks/[taskId]`
  - `/provider/core-tasks`
  - `/provider/core-tasks/[taskId]`
  - `/customer/pro-requests`
  - `/customer/pro-requests/[proRequestId]`
  - `/provider/pro-requests`
  - `/provider/pro-requests/[proRequestId]`
  - `/customer/messages`
  - `/customer/messages/[threadId]`
  - `/provider/messages`
  - `/provider/messages/[threadId]`
  - `/customer/account`
  - `/provider/account`
- Mobile auth uses `AuthProvider`, `useAuth()`, and token storage through `src/lib/auth/tokenStorage.ts`.
- API calls go through `src/lib/api/client.ts`.
- Endpoint constants already contain placeholders for mobile notification preferences and push registration, but no mobile notification API wrapper or backend mobile route was found.
- No push token storage exists in mobile.
- No mobile notification permission prompt exists.
- Account screens mention future notification preferences, but no settings controls exist.
- Message routes are role-specific, so a future generic notification target such as `/messages/[threadId]` needs a safe resolver or must include workspace-specific routes.

## Missing Mobile API And Deep-Link Gaps

- No mobile Expo push token registration route.
- No mobile push token unregister route.
- No mobile notification preferences route implementation.
- No mobile notification API wrapper.
- No Expo push token database model or mobile-safe extension to existing push subscription storage.
- No `expo-notifications` installation or app config plugin setup.
- No permission UX or account notification preference UI.
- No mobile notification event audit/read model.
- No deep-link intake/resolver logic for auth redirects, workspace mismatch, or inaccessible resources.
- No mobile notification payload schema for Core vs Pro labeling.

## Proposed Push Token Registration Contract

Suggested future route:

```http
POST /api/mobile/notifications/register-token
```

Alternative route shape is acceptable if aligned with existing endpoint naming. The mobile endpoint placeholder currently says `/api/mobile/notifications/register-push-token`; Phase 31B should choose one canonical route and keep `src/lib/api/endpoints.ts` aligned.

Auth and ownership:

- Require mobile auth.
- Associate the token with the authenticated backend user.
- Backend derives user id and workspace access from the mobile session.
- Backend may store multiple active tokens per user/device.

Suggested payload:

```ts
type MobilePushTokenRegistrationPayload = {
  expoPushToken: string;
  nativePushToken?: string | null;
  platform: 'ios' | 'android';
  deviceId?: string | null;
  appWorkspace: 'customer' | 'provider' | 'both';
  locale?: 'en' | 'bg';
  timezone?: string;
  appVersion?: string;
};
```

Forbidden client-owned fields:

- `userId`
- role override
- admin flags
- arbitrary recipient ids
- notification event permissions
- server-side preference overrides
- payment state
- Core/Pro eligibility state

Server behavior:

- Validate token format and platform.
- Upsert token against the authenticated user and device identity when available.
- Store locale/timezone as hints only.
- Do not trust client workspace as authorization; use backend session capabilities.
- Return a mobile-safe registration state and current notification preference summary.

Suggested response:

```ts
type MobilePushTokenRegistrationResponse = {
  tokenRegistration: {
    id: string;
    platform: 'ios' | 'android';
    appWorkspace: 'customer' | 'provider' | 'both';
    registeredAt: string;
    lastSeenAt: string;
    isActive: boolean;
  };
  preferences: MobileNotificationPreferences;
};
```

## Proposed Unregister And Preferences Contract

Suggested future routes:

```http
POST /api/mobile/notifications/unregister-token
PATCH /api/mobile/notifications/preferences
GET /api/mobile/notifications/preferences
```

Unregister payload:

```ts
type MobilePushTokenUnregisterPayload = {
  expoPushToken?: string;
  deviceId?: string | null;
};
```

Preferences payload:

```ts
type MobileNotificationPreferencesPatch = {
  coreCustomer?: boolean;
  coreProvider?: boolean;
  proCustomer?: boolean;
  proProvider?: boolean;
  messages?: boolean;
  paymentUpdates?: boolean;
  siteVisitUpdates?: boolean;
  quietHours?: {
    enabled: boolean;
    startLocalTime?: string;
    endLocalTime?: string;
  };
};
```

Preference rules:

- Backend decides which preference groups are available to the account.
- Mobile must not enable Provider alerts for accounts without Provider Workspace access.
- Mobile must not enable admin alerts.
- Server should return the canonical preference state after every change.
- If preferences are not implemented yet, Phase 31B can expose read-only defaults first.

## Proposed Backend Delivery Contract

- Backend decides recipients.
- Backend decides event type.
- Backend decides Core vs Pro label.
- Backend decides title, body, route, and deep-link target.
- Backend avoids sensitive personal data in push title/body.
- Backend may include entity ids only in data payload, not as sensitive visible copy.
- Backend respects user preferences and workspace access.
- Backend de-duplicates repeated events where possible.
- Backend can keep Telegram/email as parallel channels.
- Backend should record delivery attempts or event audit rows if needed for support.
- Backend should avoid sending notifications for hidden, unavailable, admin-disabled, or unauthorized resources.
- Backend should return no Stripe internals, payment secrets, admin notes, phone/email, exact address, or protected contact details in notification payloads.

## Proposed Notification Payload Shape

Suggested push data payload:

```ts
type MobileNotificationPayload = {
  type: string;
  title: string;
  body: string;
  workspace: 'customer' | 'provider';
  productArea: 'core' | 'pro' | 'messages' | 'account';
  entityType: 'core_task' | 'pro_request' | 'message_thread' | 'notification_settings';
  entityId: string;
  route: string;
  deepLink: string;
  createdAt: string;
  priority: 'normal' | 'high';
  silent?: boolean;
};
```

Avoid in title, body, and data:

- Full addresses.
- Phone/email/contact details.
- Stripe ids, client secrets, payment method ids, raw payment objects, webhook ids, or payout internals.
- Admin/internal notes.
- Moderation/ranking/scoring internals.
- Pro hidden/admin-disabled response details.
- Sensitive personal details beyond safe display names and generic project/task context.

## Proposed Deep-Link Route Map

Current app scheme is `tasklyapp`; do not change it in this phase. Future links should use the current scheme unless a dedicated config phase changes it.

Suggested custom-scheme targets:

- `tasklyapp://customer/tasks/[taskId]`
- `tasklyapp://provider/core-tasks/[taskId]`
- `tasklyapp://customer/pro-requests/[proRequestId]`
- `tasklyapp://provider/pro-requests/[proRequestId]`
- `tasklyapp://customer/messages/[encodedThreadId]`
- `tasklyapp://provider/messages/[encodedThreadId]`
- `tasklyapp://customer/account`
- `tasklyapp://provider/account`

Optional future resolver targets:

- `tasklyapp://messages/[encodedThreadId]`
- `tasklyapp://account/notifications`

Resolver rules:

- Authenticated user is required for all resource links.
- If session is expired, send the user to login and preserve the intended route only if safe.
- If the user has the wrong workspace selected, switch only when backend session says the workspace is available.
- If the resource is not accessible, show a safe not-found/unauthorized state.
- Do not reveal details in the notification body just because a route contains an id.
- Route open should refresh the target detail from backend APIs, not trust notification payload fields.
- Message thread ids must be URL-encoded because Core thread ids may include prefixes such as `booking:`.

## Customer Notification Events

Core customer events:

- Tasker expressed interest.
- Tasker selected / reservation created.
- Payment setup needed.
- Payment protected / payment status update.
- Tasker on the way.
- Task started.
- Completion requested.
- Completion approved/rejected.
- Cancellation/support/refund/dispute state update.
- New Core message.

Pro customer events:

- Pro responded to request.
- Pro Access unlock available.
- Pro Access payment/unlock status.
- Site visit invite status changed.
- Provider accepted/declined/proposed time.
- Pro request/support/refund state, if later added.

## Provider Notification Events

Core provider events:

- New matching Core task.
- Customer selected provider.
- Payment protected / ready to start.
- Upcoming task reminder.
- On-the-way available.
- Start task available.
- Customer rejected completion.
- Customer approved completion.
- Customer cancelled / support review.
- New Core message.

Pro provider events:

- New matching Pro request.
- Response submitted/edited confirmation if needed.
- Customer unlocked/compared responses if backend tracks it safely.
- Site visit invitation received.
- Site visit cancelled.
- Customer accepted/proposed time if later added.
- Pro request no longer available.

## Core Vs Pro Labeling Rules

- Every notification should clearly identify Core or Pro when the event could be ambiguous.
- Use `Core task` for Core workflow notifications.
- Use `Pro request` or `Pro site visit` for Pro workflow notifications.
- Use `Taskly message` only when the thread context is clear in the payload or body.
- Do not use public version labels.
- Do not use `escrow`.
- Payment wording should use `payment protected` or `payment update`.
- Pro notifications should use `approved Pros` and `independent Pros` where relevant.

## Security And Privacy Guardrails

- Backend remains the source of truth for recipients, event eligibility, resource visibility, and route target.
- Mobile must not calculate notification eligibility.
- Mobile must not register tokens for another user.
- Mobile must not send arbitrary recipient ids.
- Mobile must not include secrets in token registration.
- Push body must not include exact address, phone, email, access notes, Stripe internals, admin notes, moderation state, ranking, or hidden response data.
- Deep-linked screens must fetch fresh backend data and enforce existing workspace/ownership guards.
- Notifications for Pro comparison/site visits must respect unlock, visibility, approved profile, hidden/admin-disabled response, and contact/address rules.
- Notifications for messages must verify thread participant access server-side.
- Demo mode should not register real push tokens or call notification routes.

## Permission UX Guidance

- Do not request notification permission immediately on first launch.
- Ask after login/onboarding, after a meaningful moment, or when a Provider enables alerts for matching work.
- Explain the value before the OS permission prompt:
  - New Core task updates.
  - New Pro request alerts.
  - Messages.
  - Payment/completion updates.
  - Site visit updates.
- Let users continue without notifications.
- Account/settings should later expose notification preferences and disabled/off states.
- If permissions are denied, show a calm explanation and a route to system settings only when useful.
- Do not nag repeatedly after denial or dismissal.

## EN/BG Wording Guidance

| Meaning | EN | BG |
| --- | --- | --- |
| Enable notifications | Enable notifications | Включи известия |
| Get task updates | Get task updates | Получавай обновления |
| Get Pro request alerts | Get Pro request alerts | Известия за Pro заявки |
| New matching task | New matching task | Нова подходяща задача |
| New Pro request | New Pro request | Нова Pro заявка |
| New message | New message | Ново съобщение |
| Payment update | Payment update | Обновление за плащане |
| Completion requested | Completion requested | Поискано завършване |
| Site visit invitation | Site visit invitation | Покана за оглед |
| Site visit updated | Site visit updated | Обновен оглед |
| You can change this later in settings | You can change this later in settings | Можеш да промениш това в настройките |
| Not now | Not now | Не сега |
| Enable alerts | Enable alerts | Включи известия |

Bulgarian button labels should stay short. Longer privacy and permission explanations should be body text.

## Non-Scope

- Installing `expo-notifications`.
- Implementing push token registration.
- Implementing unregister/preferences routes.
- Implementing notification sending hooks.
- Implementing deep-link routing or redirect handling.
- Changing `app.json`, app scheme, associated domains, or native build config.
- Changing Core payment/cancellation/support logic.
- Changing Pro Access payment logic.
- Changing Provider Pro response logic.
- Changing Pro site visit logic.
- Adding Pro chat.
- Adding Expo upgrades.
- Adding secrets or local `.env` files.

## Recommended Next Phases

### Phase 31B: Push Token Registration And Read-Only Notification Settings

- Install SDK 54-compatible `expo-notifications` only if explicitly scoped.
- Add mobile-safe token registration/unregister routes.
- Add mobile API wrappers and domain types.
- Add read-only/default notification settings state.
- Add delayed permission UX shell without event hooks.
- Keep demo mode from registering real tokens.

### Phase 31C: Backend Event Notification Hooks

- Add backend event hooks for selected Core and Pro events.
- Extend template/event taxonomy for Pro and site visit events.
- Respect preferences and de-duplicate noisy events.
- Keep Telegram/email parallel where useful.

### Phase 31D: Deep-Link Routing

- Add deep-link intake/resolver behavior.
- Handle auth redirects, workspace mismatch, unauthorized resources, and encoded message thread ids.
- Ensure every opened route fetches fresh backend data.

### Phase 31E: Real-Device Notification QA

- Test on physical iOS/Android or development builds.
- Verify permissions, token registration, notification delivery, deep-link open behavior, disabled preferences, logout/unregister, and privacy-safe payloads.
