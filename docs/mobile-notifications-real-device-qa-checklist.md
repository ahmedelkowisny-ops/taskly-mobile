# Mobile Notifications Real-Device QA Checklist

Phase 31E verifies the mobile notification chain across permission UX, token registration, saved preferences, backend push sending, sound/vibration behavior, and notification tap routing.

## Required Accounts

- Customer account with mobile login enabled.
- Approved Core Tasker/provider account with Provider Workspace access.
- Approved Pro account with matching city/category access.
- Customer account with at least one Pro request.
- Optional second customer/provider account for workspace mismatch and unauthorized-resource checks.

## Required Backend Setup

- Backend is reachable from the device using `EXPO_PUBLIC_TASKLY_API_BASE_URL`.
- Mobile auth routes are working for login, session restore, refresh, and logout.
- Database is migrated with `MobilePushToken` and `MobileNotificationPreference`.
- Mobile notification routes are deployed:
  - `POST /api/mobile/notifications/register-token`
  - `POST /api/mobile/notifications/unregister-token`
  - `GET /api/mobile/notifications/preferences`
  - `PATCH /api/mobile/notifications/preferences`
- Backend mobile push sender can reach Expo Push Service.
- Backend has event hooks for the Phase 31C first event set.
- No push title/body includes address, phone, email, payment object ids, admin notes, support details, or free-text message bodies.

## Required Mobile Setup

- App reports Expo SDK `54.0.0`.
- `expo-notifications` is installed.
- `expo-linking` is installed.
- Existing scheme remains `tasklyapp`.
- `assets/sounds/taskly_notification.wav` exists.
- Expo notifications plugin includes:
  - `defaultChannel: taskly-default`
  - `sounds: ./assets/sounds/taskly_notification.wav`
- Customer and Provider account screens show notification settings.
- Demo mode remains available and does not register real push tokens.

## Real-Device Matrix

- Android physical device on a development build or internal/production build.
- iOS physical device if available, using a development build or internal/production build.
- Android emulator with Google Play services may be useful for basic push checks, but final QA should use a physical device.
- Expo Go is not enough for full Android remote push/custom sound verification on SDK 54; use a development or store-style build.
- Custom sound verification requires a native build after the sound asset/plugin config is included.

## Permission UX Checklist

- Fresh install does not request notification permission on first launch.
- Permission prompt appears only after tapping `Enable alerts` in Account notification settings.
- User can choose `Not now` without an OS permission prompt.
- Denied permission shows a concise error and an `Open system settings` action.
- Reopening Account settings does not nag repeatedly after denial.
- Web preview reports native push as unavailable instead of attempting token registration.

## Token Registration Checklist

- Login as customer and open Customer Account.
- Enable alerts.
- Confirm backend receives only safe token fields:
  - `token`
  - `tokenType`
  - `platform`
  - `deviceId`
  - `appWorkspace`
  - `locale`
  - `timezone`
  - `appVersion`
- Confirm backend derives `userId` from auth and rejects submitted `userId`, `role`, `recipientId`, `permission`, or admin fields.
- Confirm `MobilePushToken` is active and tied to the authenticated user.
- Confirm `MobileNotificationPreference.pushEnabled` is true after successful registration.
- Repeat in Provider Account and confirm `appWorkspace` reflects provider context.

## Token Unregister And Logout Checklist

- Disable push notifications from Account settings.
- Confirm stored token is unregistered/deactivated backend-side for the authenticated user only.
- Re-enable notifications and then log out.
- Confirm logout performs best-effort unregister before local auth tokens are cleared.
- Confirm logout does not throw user-facing errors if unregister fails.

## Preferences Checklist

- Confirm default preferences for a new account/preference record:
  - `pushEnabled: false`
  - `soundEnabled: true`
  - `vibrationEnabled: true`
  - `coreAlertsEnabled: true`
  - `proAlertsEnabled: true`
  - `messageAlertsEnabled: true`
  - `paymentAlertsEnabled: true`
  - `completionAlertsEnabled: true`
  - `supportAlertsEnabled: true`
  - `siteVisitAlertsEnabled: true`
  - `marketingAlertsEnabled: false` or absent from active UI.
- Toggle and save:
  - Push notifications
  - Sound
  - Vibration
  - Core task alerts
  - Pro request alerts
  - Messages
  - Payment and completion updates
  - Support updates
  - Site visit updates
- Confirm backend returns canonical preference state after each change.
- Confirm unsupported preference fields are rejected.
- Confirm demo mode saves settings locally/mock-only and does not call register/unregister routes.
- After the user enables push notifications, confirm Taskly uses sound and vibration by default unless the user toggles them off.

## Sound Enabled/Disabled Checklist

- With `soundEnabled: true`, trigger a supported notification and confirm the push payload requests `taskly_notification.wav`.
- With `soundEnabled: false`, trigger the same event and confirm backend does not include a sound value.
- Confirm device silent mode, Focus, Do Not Disturb, or equivalent OS settings may suppress sound even when Taskly preferences allow it.
- Confirm custom sound behavior only after a build that includes `assets/sounds/taskly_notification.wav`.

## Vibration Enabled/Disabled Checklist

- With `vibrationEnabled: true`, confirm Android registration creates `taskly-default` with vibration pattern.
- With `vibrationEnabled: true`, confirm backend includes Android `channelId: taskly-default`.
- With `vibrationEnabled: false`, confirm backend avoids Android channel routing for the event payload.
- Confirm OS/device vibration, Focus, Do Not Disturb, or Android notification-channel settings may override app preference behavior.

## Android Channel Checklist

- On a clean install, enable alerts with sound/vibration enabled and confirm Android channel is created.
- Test sound/vibration changes after toggling preferences.
- If a device has an old `taskly-default` channel, clear app data or reinstall before final sound/vibration QA.
- Note: Android notification channels are device-level state; changing channel sound/vibration after creation may require a new channel strategy in a later phase.

## iOS Permission And Sound Notes

- iOS notification behavior depends on system notification settings, Focus, Silent Mode, and APNs/build configuration.
- Confirm permission state after first prompt.
- Confirm sound enabled/disabled behavior with device sound settings enabled.
- Confirm production/internal builds use the expected APNs environment and credentials.

## Notification Event Checklist

- Core interest -> customer:
  - Provider expresses interest in a Core task.
  - Customer receives a generic Core update.
- Customer selects Tasker -> provider:
  - Customer selects a Tasker.
  - Provider receives a generic Core update.
- Provider requests completion -> customer:
  - Provider requests completion.
  - Customer receives a completion update.
- Customer rejects completion -> provider:
  - Customer requests corrections.
  - Provider receives a completion update.
- Customer approves completion -> provider:
  - Customer approves completion.
  - Provider receives a completion update.
- First Pro response submitted -> customer:
  - Approved Pro submits first response.
  - Customer receives a Pro update.
- Pro Access unlocked -> customer:
  - Pro Access payment is verified/unlocked.
  - Customer receives a Pro/payment update.
- Site visit invite -> provider:
  - Customer invites a Pro for site visit.
  - Provider receives a site visit update.
- Site visit accepted/declined/proposed time -> customer:
  - Provider responds to invite.
  - Customer receives the corresponding site visit update.

## Deep-Link Tap Checklist

- Tap customer Core task notification and land on `/customer/tasks/[taskId]`.
- Tap provider Core task notification and land on `/provider/core-tasks/[taskId]`.
- Tap customer Pro request notification and land on `/customer/pro-requests/[proRequestId]`.
- Tap provider Pro request notification and land on `/provider/pro-requests/[proRequestId]`.
- Tap site visit notification and land on the relevant Pro request detail.
- Confirm the destination screen refetches from backend and does not display payload data as resource data.
- Confirm unsupported or malformed payloads fall back to a safe workspace home.

## Cold-Start Checklist

- Kill the app.
- Trigger a notification.
- Tap the notification.
- Confirm the app opens, restores session, and routes to the target if the user has access.
- Confirm unsupported payloads fall back safely.
- Confirm logged-out users are sent to login first.

## Background Checklist

- Put the app in background.
- Trigger each event category.
- Tap the notification.
- Confirm route opens correctly after session/workspace checks.
- Confirm destination screens show loading and then backend-refetched data.

## Foreground Checklist

- Keep the app foregrounded.
- Trigger each event category.
- Confirm foreground display behavior is acceptable for the build/platform.
- Tap or interact with notification response where available.
- Confirm duplicate navigation does not occur for the same notification response.

## Workspace Mismatch Checklist

- Log in as a customer-only account.
- Open a provider-targeted notification.
- Confirm the app routes to a safe fallback and does not expose provider resource details.
- Log in as a provider-only/limited account if available and open a customer-targeted notification.
- Confirm safe fallback behavior.

## Logged-Out Pending Route Checklist

- Log out.
- Tap a valid notification.
- Confirm login screen opens.
- Log in as the correct account.
- Confirm pending route opens only if the session has the target workspace.
- Log in as the wrong account.
- Confirm fallback opens and no resource details leak.

## Sensitive-Data Checklist

- Inspect received push title/body for every Phase 31C event.
- Confirm no exact address appears.
- Confirm no phone or email appears.
- Confirm no Stripe/payment object id appears.
- Confirm no admin note, support detail, moderation status, ranking, or hidden Pro response detail appears.
- Confirm free-text site visit invite/propose/decline messages are not included in push payloads.
- Confirm notification data payload includes only routing hints.

## Demo-Mode Checklist

- Enter demo mode.
- Open Customer and Provider notification settings.
- Toggle preferences and confirm local/mock-only behavior.
- Tap `Enable alerts` and confirm no real push token is requested or registered.
- Confirm demo notification/deep-link simulation, if used manually, routes only to mock-supported screens.

## Known Deferred Items

- Notification history/inbox UI.
- Message notification hooks if not included in a later scoped phase.
- Advanced Android channel migration for preference changes after channel creation.
- Store-build cold-start testing.
- Production APNs/FCM/EAS credential hardening if needed.
- Broader notification event taxonomy beyond the first safe Phase 31C event set.
