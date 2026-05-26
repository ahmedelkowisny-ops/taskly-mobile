# Mobile Notifications And Deep Links Contract

Phase 31A documents the safe future contract for mobile push notifications and deep links across Core and Pro workflows.

Phase 31B adds the push token registration and notification settings foundation. It does not add backend event sending hooks or full deep-link routing.

## Expo SDK 54 Reference Notes

- The app currently reports Expo SDK `54.0.0`; future notification work must use SDK 54-compatible packages and docs.
- Expo SDK 54 lists `Notifications` and `Linking` as SDK modules. `expo-linking` is already installed, and Phase 31B installs `expo-notifications`.
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
- Phase 31B installs `expo-notifications`.
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
- Phase 31B adds local push token storage.
- Phase 31B adds a delayed notification permission/settings shell in Account screens.
- Customer and Provider account screens include notification preference controls.
- Message routes are role-specific, so a future generic notification target such as `/messages/[threadId]` needs a safe resolver or must include workspace-specific routes.

## Missing Mobile API And Deep-Link Gaps

- Phase 31B adds mobile Expo push token registration, unregister, and preferences routes.
- Phase 31B adds mobile notification API wrappers.
- Phase 31B adds Expo-native token and preference persistence.
- Phase 31B installs `expo-notifications` and configures the app plugin.
- Phase 31B adds an Account/settings permission UX shell.
- No mobile notification event audit/read model.
- No deep-link intake/resolver logic for auth redirects, workspace mismatch, or inaccessible resources.
- No mobile notification payload schema for Core vs Pro labeling.

## Phase 31B Implementation Note

- Installed SDK 54-compatible `expo-notifications` and configured the app plugin with the existing `taskly-default` Android channel.
- Registered the existing custom sound asset `./assets/sounds/taskly_notification.wav` in the Expo notifications plugin. Runtime channel setup uses that sound only when `soundEnabled` is true.
- Added backend models for native mobile push tokens and mobile notification preferences. This is separate from existing web/PWA `WebPushSubscription` storage.
- Added mobile routes:
  - `POST /api/mobile/notifications/register-token`
  - `POST /api/mobile/notifications/unregister-token`
  - `GET /api/mobile/notifications/preferences`
  - `PATCH /api/mobile/notifications/preferences`
- Added preference fields:
  - `pushEnabled`
  - `soundEnabled`
  - `vibrationEnabled`
  - `coreAlertsEnabled`
  - `proAlertsEnabled`
  - `messageAlertsEnabled`
  - `paymentAlertsEnabled`
  - `completionAlertsEnabled`
  - `supportAlertsEnabled`
  - `siteVisitAlertsEnabled`
  - `marketingAlertsEnabled` defaults to false and is not surfaced in mobile UI.
- Added mobile wrappers, local token storage, and a notification service that requests permission only when the user taps `Enable alerts`.
- Added Customer and Provider account notification settings cards. Demo mode updates settings locally and never registers a real push token.
- Logout performs best-effort unregister of the stored mobile token before clearing auth tokens.
- No backend event sending hooks were added.
- No full deep-link routing was added.

Sound and vibration notes:

- Sound and vibration are stored as user preferences.
- Android channel setup uses the custom sound asset when sound is enabled and an empty vibration pattern when vibration is disabled.
- iOS sound and vibration remain subject to device/system notification settings. Future event sending should map these preferences into notification payload behavior where supported.
- Custom sound asset changes require a new native build to be fully reflected.

## Phase 31C Implementation Note

- Added a backend Expo mobile push sender that uses `MobilePushToken` and `MobileNotificationPreference`.
- Mobile push sending is best-effort. It logs failures and does not throw through the business action that triggered the notification.
- The sender loads active Expo tokens for the backend-decided recipient user.
- The sender applies preference gates:
  - `pushEnabled`
  - `coreAlertsEnabled`
  - `proAlertsEnabled`
  - `messageAlertsEnabled`
  - `paymentAlertsEnabled`
  - `completionAlertsEnabled`
  - `supportAlertsEnabled`
  - `siteVisitAlertsEnabled`
- Sound is included only when `soundEnabled` is true, using `taskly_notification.wav`.
- Android channel routing is included only when `vibrationEnabled` is true. Full per-device channel migration remains a later QA/build concern because Android channels are device-level native state.
- Expo ticket errors that clearly indicate `DeviceNotRegistered` deactivate the stored mobile token.
- Safe data payload fields are included for future deep-link routing:
  - `type`
  - `workspace`
  - `category`
  - `entityType`
  - `entityId`
  - `routeHint`
  - `createdAt`
- No full mobile deep-link routing was added.
- No mobile notification history UI was added.

First event hooks added:

- Core task interest: `core.task.interest`, customer recipient, `core` category.
- Customer selects a Tasker: `core.task.selected`, provider recipient, `core` category.
- Provider requests completion: `core.task.completion_requested`, customer recipient, `completion` category.
- Customer rejects completion: `core.task.completion_rejected`, provider recipient, `completion` category.
- Customer approves completion: `core.task.completed`, provider recipient, `completion` category.
- Provider submits a first Pro response: `pro.response.submitted`, customer recipient, `pro` category.
- Pro Access unlock succeeds after verified payment: `pro.access.unlocked`, customer recipient, `pro` and `payment` categories.
- Customer invites a Pro for site visit: `pro.site_visit.invited`, provider recipient, `site_visit` category.
- Provider accepts, declines, or proposes another site visit time:
  - `pro.site_visit.accepted`
  - `pro.site_visit.declined`
  - `pro.site_visit.proposed_time`
  - customer recipient, `site_visit` category.

Sensitive-data protections:

- Push title/body copy is generic and does not include addresses, phone numbers, emails, payment object ids, Stripe ids, admin notes, support details, free-text invite messages, ranking, moderation data, or hidden Pro response data.
- Entity ids are included only in the data payload for future routing, and screens must still refetch from backend APIs.
- Support/issue mobile push hooks are deferred because the safe recipient behavior needs a separate product pass.

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
  token: string;
  tokenType: 'expo' | 'native';
  platform: 'ios' | 'android' | 'web' | 'unknown';
  deviceId?: string | null;
  appWorkspace?: 'customer' | 'provider' | 'both';
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
  token?: string;
  deviceId?: string | null;
};
```

Preferences payload:

```ts
type MobileNotificationPreferencesPatch = {
  pushEnabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  coreAlertsEnabled?: boolean;
  proAlertsEnabled?: boolean;
  messageAlertsEnabled?: boolean;
  paymentAlertsEnabled?: boolean;
  completionAlertsEnabled?: boolean;
  supportAlertsEnabled?: boolean;
  siteVisitAlertsEnabled?: boolean;
  marketingAlertsEnabled?: boolean;
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
- Use approved protected payment wording only.
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

- Implementing deep-link routing or redirect handling.
- Changing the app scheme, associated domains, or broad native build config beyond the Phase 31B notification plugin foundation.
- Changing Core payment/cancellation/support logic.
- Changing Pro Access payment logic.
- Changing Provider Pro response logic.
- Changing Pro site visit logic.
- Adding Pro chat.
- Adding Expo upgrades.
- Adding secrets or local `.env` files.

## Recommended Next Phases

### Phase 31B: Push Token Registration And Notification Settings Foundation

- Added SDK 54-compatible notification package/setup.
- Added mobile-safe token registration/unregister routes.
- Added mobile API wrappers and domain types.
- Added stored notification settings with sound and vibration preferences.
- Added delayed permission UX shell without event hooks.
- Kept demo mode from registering real tokens.

### Phase 31C: Backend Event Notification Hooks

- Added backend event hooks for selected Core and Pro events.
- Added mobile Expo event taxonomy for Core, Pro, completion, payment, and site visit updates.
- Respects preferences and avoids duplicate interest/edit notifications where the hook can safely detect repeats.
- Kept Telegram/email parallel where already present.

### Phase 31D: Deep-Link Routing

- Add deep-link intake/resolver behavior.
- Handle auth redirects, workspace mismatch, unauthorized resources, and encoded message thread ids.
- Ensure every opened route fetches fresh backend data.

### Phase 31E: Real-Device Notification QA

- Test on physical iOS/Android or development builds.
- Verify permissions, token registration, notification delivery, deep-link open behavior, disabled preferences, logout/unregister, and privacy-safe payloads.
