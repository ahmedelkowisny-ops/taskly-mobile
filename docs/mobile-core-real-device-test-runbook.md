# Mobile Core Real-Device Test Runbook

Phase 24G prepares manual testing for the Core happy path on Expo Go, Android emulator, iOS simulator, or a real device. This runbook does not add product behavior and does not change backend business logic.

## Backend Startup

1. Open a terminal in `D:\Taskly`.
2. Confirm backend `.env` has local/test values for:
   - `DATABASE_URL`
   - `MOBILE_ACCESS_TOKEN_SECRET`
   - `MOBILE_ACCESS_TOKEN_TTL_SECONDS`
   - `MOBILE_REFRESH_TOKEN_TTL_DAYS`
   - `STRIPE_SECRET_KEY` for Stripe test mode, or `MOCK_PAYMENTS=true` for local mock payment behavior
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` when the backend checks Stripe configured state
   - `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_BASE_URL` if local notifications/links need a base URL
3. Start the backend:

```powershell
npm.cmd run dev
```

4. For Expo Go on a physical device, bind the backend to the LAN:

```powershell
npm.cmd run dev -- --hostname 0.0.0.0
```

5. Confirm the backend is reachable in a browser:
   - Same machine: `http://localhost:3000/api/mobile/catalog/cities`
   - Android emulator: `http://10.0.2.2:3000/api/mobile/catalog/cities`
   - Real device: `http://<computer-lan-ip>:3000/api/mobile/catalog/cities`

Expected result: the endpoint returns JSON or an auth-safe API response, not a browser connection error.

## Mobile Startup

1. Open a terminal in `D:\Taskly-app`.
2. Set local mobile `.env` values:

```env
EXPO_PUBLIC_TASKLY_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

3. Start Expo:

```powershell
npm.cmd run start
```

4. Choose the runtime:
   - Press the Expo shortcut for Android emulator.
   - Press the Expo shortcut for iOS simulator if available.
   - Scan the QR code from Expo Go on a real device.

Expected result: the app opens to the Taskly auth/workspace shell and can switch into demo mode if the backend is unavailable.

## Choosing The API Base URL

Use the URL from the device's point of view:

- Web browser on development machine: `http://localhost:3000`
- iOS simulator on the same Mac: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`
- Expo Go on a physical phone: `http://<computer-lan-ip>:3000`

For physical devices:

- Keep the phone and computer on the same Wi-Fi.
- Start the backend with `--hostname 0.0.0.0`.
- Allow the Windows firewall prompt for Node/Next if it appears.
- Find the computer LAN IP with `ipconfig` and use the active Wi-Fi IPv4 address.
- After changing `.env`, restart Expo so `EXPO_PUBLIC_*` values are reloaded.

## Confirm Mobile Can Reach Backend

1. Set `EXPO_PUBLIC_TASKLY_API_BASE_URL` to the runtime-specific URL.
2. Open `EXPO_PUBLIC_TASKLY_API_BASE_URL/api/mobile/catalog/cities` from the same device browser where possible.
3. In the app, leave demo mode and attempt login.
4. If login fails with a network/backend message, verify:
   - Backend terminal is still running.
   - The URL uses `http`, not `https`, for local dev.
   - Port is `3000`.
   - Physical device and computer are on the same Wi-Fi.
   - Backend is bound to `0.0.0.0` for physical device testing.
   - `.env` was changed before Expo was restarted.

Expected result: login reaches the backend and returns either a valid session or a normal auth error, not a network failure.

## Required Test Users

- Customer account:
  - Has Customer Workspace access.
  - Can create Core tasks.
  - Is not relying on admin-only web workflows.
- Approved Tasker account:
  - Has Provider Workspace access.
  - Core Tasker status is approved.
  - Stripe verification is ready for Core payout-gated provider actions when the backend requires it.
  - Tasker city and service category match the test task.
- Optional dual-role provider:
  - Has both Customer and Provider Workspace access.
  - Useful for checking workspace switching without exposing actions across roles.

## Required Task Setup

- City: use the same city as the approved Tasker profile.
- Category: use a Core category the approved Tasker can handle.
- Schedule timing:
  - Use a near-future schedule when testing `Mark on the way`; backend allows it only close to start.
  - Use a schedule that permits `Start task` according to backend time gates.
  - If time gates block runtime actions, confirm the blocked reason is friendly and backend-authored.
- Images: optional unless backend posting rules require them for the selected category.
- Price/budget: use normal test data from backend posting rules.

## Stripe Test-Mode Checklist

- Backend uses Stripe test credentials or local `MOCK_PAYMENTS=true`.
- Mobile uses only `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Do not place `STRIPE_SECRET_KEY`, webhook secrets, connected account secrets, database URLs, or raw card data in `D:\Taskly-app`.
- Enter card details only into the Stripe SDK `CardField`.
- Expected live test flow:
  1. Mobile calls backend payment setup.
  2. Backend returns a server-created SetupIntent client secret.
  3. Stripe SDK confirms the SetupIntent.
  4. Mobile sends only safe `paymentMethodId` and/or `setupIntentId` to finalize.
  5. Backend refreshes the task and returns backend-authored state.

## Full Happy-Path Checklist

1. Customer logs in.
   - Expected: Customer Workspace is available from backend session data.
2. Customer creates a Core task.
   - Expected: task appears in Customer `My Tasks`; submit validation explains any missing fields.
3. Provider logs in.
   - Expected: Provider Workspace is available; Core and Pro spaces remain separated.
4. Provider sees matching task.
   - Expected: task appears only when backend city/category/readiness rules match.
5. Provider expresses interest.
   - Expected: button says `Express interest`; success says interest was sent; task is not reserved or assigned by provider.
6. Customer selects provider.
   - Expected: customer detail shows interested Tasker preview without private contact details; selection returns payment setup as next step.
7. Customer sees payment protected setup UI.
   - Expected: UI appears only from backend `canPreparePayment`, `canConfirmPayment`, or `canRetryPayment`.
8. Customer enters Stripe test card.
   - Expected: card entry happens only inside Stripe SDK `CardField`.
9. SetupIntent confirms.
   - Expected: no raw card data is sent through Taskly mobile code.
10. Finalize payment succeeds.
   - Expected: mobile sends only safe Stripe references; backend returns refreshed task/payment state.
11. Provider sees assigned task.
   - Expected: task appears in Provider Core list/detail; private address appears only if backend returns it.
12. Provider marks on the way when allowed.
   - Expected: action appears only from backend `nextActions`; this does not start the task.
13. Provider starts task when allowed.
   - Expected: action appears only from backend `nextActions`; no payment capture/release/refund happens from mobile.
14. Provider requests completion.
   - Expected: action is labeled `Request completion`; task waits for customer approval and is not completed by provider.
15. Customer rejects completion with reason.
   - Expected: non-empty reason is required; task returns to in progress; no dispute/refund/help flow starts.
16. Provider requests completion again.
   - Expected: task returns to waiting for customer approval.
17. Customer approves completion.
   - Expected: backend owns payment release/capture/payout behavior; mobile displays success or backend warning.

## Common Failure Cases

- App cannot reach backend:
  - Check API base URL, backend bind address, Wi-Fi, firewall, and Expo restart after `.env` changes.
- Android emulator cannot reach `localhost`:
  - Use `http://10.0.2.2:3000`.
- Real device cannot reach `localhost`:
  - Use `http://<computer-lan-ip>:3000` and start backend with `--hostname 0.0.0.0`.
- Login returns unauthorized:
  - Verify test credentials and mobile auth routes.
- Provider cannot see task:
  - Check Core Tasker approval, Stripe/Core payout readiness, city, category, schedule, task status, and required photos/checklist.
- `Express interest` is blocked:
  - Check backend blocked reason; do not add provider accept/reserve behavior.
- Payment setup does not show:
  - Check customer selected a Tasker, task is reserved, reservation is not expired, and backend `nextActions` allow setup.
- Stripe setup fails:
  - Check backend Stripe test config, mobile publishable key, SetupIntent response, and that the native Stripe SDK is running.
- Provider runtime actions are missing:
  - Check schedule window, assignment, payment readiness, started state, and backend `nextActions`.
- Customer approval is blocked:
  - Check task is pending completion, task has started, payment state is backend-approved for approval, and backend returned `canApproveCompletion`.

## Do Not Test Yet

- Cancellation.
- Help/support mutations.
- Dispute/refund flows.
- Pro Access unlock or Pro payment.
- Provider Pro response submission.
- Pro chat.
- Push notifications.
- Store-readiness metadata.

## Safety Regression Checks

- Mobile uses backend APIs only.
- Mobile does not import Prisma or access the database.
- Mobile does not contain Stripe secret keys or webhook secrets.
- Mobile does not calculate fees, commission, payout, hold, capture, release, refund, cancellation penalty, matching, role, Pro unlock, or lifecycle eligibility.
- Sensitive buttons follow backend `nextActions`.
- Customer and Provider screens stay separated.
- Admin remains web-only.
- Core uses Taskly blue; Pro remains visually separate with orange/gold accents.
- Copy uses `Payment protected` / `protected payment flow`, never `escrow`.
- Provider open-task copy uses `Express interest`, not `Accept` or `Reserve`.
- Provider completion copy uses `Request completion`, not completing the task directly.
