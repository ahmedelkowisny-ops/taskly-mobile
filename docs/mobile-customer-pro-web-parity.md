# Phase 39D - Customer Taskly Pro Web Parity

## Focused Correction Pass - Pro Posting Wizard

The first Phase 39D pass improved colors and Pro surface styling, but the mobile `Post Taskly Pro project` screen still behaved like one long form. That was rejected because it did not mirror the web `ProRequestModal` experience.

The corrected mobile flow now uses a focused native wizard/sheet:

- Compact Taskly wordmark header with a close/back button.
- Taskly Pro title, compact trust chips, step label, thin progress bar, and horizontal step pills.
- One focused step visible at a time.
- Sticky footer with Back/Cancel and Continue/Submit request actions.
- Customer bottom tabs hidden on `/customer/post-pro-request`.

Corrected steps:

1. Project type: Pro category selection and property type chips.
2. Location: city, district, address guidance, and private location notes.
3. Project details: title, description, project size, and specialty notes.
4. Budget and timeline: quick budget chips, min/max budget, preferred start, site visit need.
5. Photos: premium photo picker area with customer-facing Pro copy.
6. Review: structured summary and calm missing-field checklist.

Unsupported web fields are not sent as new API fields. Where the user adds safe descriptive details such as property type, project size, site visit need, address guidance, private location notes, or specialty notes, mobile folds them into the supported `description` text rather than changing the backend contract.

## Focused Polish Pass - Header/Footer Density

Real-device review showed the wizard was structurally correct, but the header/intro area and persistent footer note still took too much attention from the step content.

Polish applied:

- Reduced modal header padding and title size.
- Replaced the longer intro with: "Create a clear request for approved Pros." / "Създай ясна заявка за одобрени Pro специалисти."
- Converted header badges into smaller trust chips.
- Kept the compact `Step X of 6 · current step` label, thin progress bar, and step pills.
- Removed the persistent footer helper note below the buttons.
- Moved the longer Pro Access reassurance into a small trust card on the Review step only.
- Tightened step pill and content padding so the first selectable card appears higher on small phones.

## Web Files Inspected

- `D:\Taskly\src\components\pro\ProRequestModal.tsx`
- `D:\Taskly\src\components\pro\CustomerProResponsesSection.tsx`
- `D:\Taskly\src\components\pro\ProResponseFormClient.tsx`
- `D:\Taskly\src\components\pro\UnlockProOffersButton.tsx`
- `D:\Taskly\src\app\dashboard\customer\pro\page.tsx`
- `D:\Taskly\src\app\dashboard\customer\pro\[id]\page.tsx`
- `D:\Taskly\messages\en.json`
- `D:\Taskly\messages\bg.json`

## Mobile Files Inspected

- `app/customer/post-pro-request.tsx`
- `app/customer/pro-requests.tsx`
- `app/customer/pro-requests/[proRequestId].tsx`
- `src/lib/api/customer.ts`
- `src/lib/api/domain.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/api/mockApi.ts`
- `src/components/taskly/FormSection.tsx`
- `src/components/taskly/SelectOptionCard.tsx`
- `src/components/taskly/FormField.tsx`
- `src/components/taskly/ImagePickerPlaceholder.tsx`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/bg.ts`

## Pro Request Form Parity Changes

- Replaced the customer-mode/debug-style header with a Taskly Pro hero card using the locked web Pro gold/orange surface, border, and shadow language.
- Localized category and city labels from catalog `nameBg` / `nameEn` and descriptions where available.
- Replaced internal setup copy with customer-facing Taskly Pro guidance.
- Added a compact review summary for category, city, budget, timeline, and photos without changing the create payload.
- Kept the create mutation backend-safe. Mobile still sends only supported fields: category, city, district, title, description, timeline, budget min/max, and local image count.
- Replaced the long page with a 6-step wizard modeled after the web `ProRequestModal` groupings.
- Added a modal-like sheet with progress, step pills, focused step content, and sticky footer actions.

## Pro Request List Parity Changes

- Rebuilt the list header as a web-inspired Taskly Pro command card.
- Added compact metric cards for open projects, active projects, Pro responses, and unlocked access.
- Reworked request cards with web-like white surfaces, Pro borders, status/access badges, metadata rows, and a Pro access line.
- Kept list behavior read-only and driven by existing backend response fields.

## Pro Request Detail Parity Changes

- Removed the customer workspace badge from the detail header.
- Added a Taskly Pro detail hero with status, unlock state, title, description, and Pro chips.
- Added a project summary section for category, location/privacy, budget, timeline, responses, and photos.
- Polished comparison, response, image, and site visit card radii/borders to use locked Pro tokens.
- Kept Pro Access checkout, unlocked comparison, site visit invite/cancel, and support/refund review behavior unchanged and backend-authoritative.

## Pro Access / Unlock Changes

- The UI now frames Pro Access as comparison access, aligned with the web unlock banner language.
- No Stripe refund behavior was added.
- No refund amount, support outcome, access eligibility, or payment state is calculated on mobile.
- Checkout still uses the existing backend-created checkout route and returned state.

## Site Visit / Support Changes

- Site visit and support/refund cards remain driven by backend `nextActions` and read models.
- Visual treatment now uses the locked Pro card radius, border, and shadow language.
- Support/refund review copy remains careful: Taskly reviews the request and does not promise an automatic refund.

## EN/BG Wording Changes

- Added Taskly Pro form/list/detail copy for setup loading, category/city guidance, project details, photo helper text, review summaries, project summary, and location privacy.
- Replaced unfinished photo-upload wording with customer-facing copy.
- Localized the shared selected badge used by Pro category/city cards.
- Updated Bulgarian Pro copy to be shorter and more natural for mobile.

## API / Backend Parity Gaps

- Web `ProRequestModal` includes fields that are not currently in the mobile create payload: map/address coordinates, internal location notes, category specialty tags, preferred start date, property type, project size, and site visit needed.
- Mobile does not invent those fields or send unsupported payload values.
- Mobile can collect safe descriptive equivalents for property type, project size, site visit need, address guidance, location notes, and specialty notes. These are folded into the supported description field until the backend exposes structured mobile fields.
- Budget/photo/timeline parity on list cards is limited by the current summary read model.
- Native map/address picker parity remains deferred until a backend-supported mobile contract is scoped.

## Deferred Items

- Exact multi-step Pro request sheet if product wants the web modal sequence mirrored more literally.
- Native map/address picker and address privacy controls.
- Property type, project size, site visit needed, and specialty tags if the mobile API adds them.
- More detailed locked response preview cards if the backend exposes the same web preview metadata.
- Manual screenshot pass on small Android and iOS devices.

## Manual QA Checklist

- Open `Post Taskly Pro project` in EN and BG.
- Confirm the hero, form sections, selected badges, review card, and submit states are localized.
- Confirm the wizard header is compact and the first content card appears high enough on small phones.
- Confirm the footer has only action buttons and no persistent helper note.
- Confirm the Pro Access reassurance appears only on the Review step.
- Confirm category and city labels switch language where backend catalog labels exist.
- Submit in demo mode and confirm no real backend create call is made.
- Submit authenticated happy path with safe payload only.
- Open `My Taskly Pro projects` and confirm metric cards and Pro request cards fit on small screens.
- Open a Pro detail with locked responses and confirm Pro Access card appears without contact details.
- Open a Pro detail with unlocked comparison and confirm comparison cards use Pro styling.
- Confirm site visit invite/cancel states still use backend next actions.
- Confirm support/refund review request still does not promise a refund.
- Confirm no Stripe/refund/admin logic changed.
