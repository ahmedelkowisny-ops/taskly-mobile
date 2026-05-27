# Mobile Post Task Web Parity

## Phase

Phase 38D correction pass - Customer Post Taskly task booking sheet.

## Web Files Inspected

- `D:\Taskly\src\components\PostTaskModal.tsx`
- `D:\Taskly\src\components\GoogleMapPicker.tsx`
- `D:\Taskly\src\app\globals.css`
- `D:\Taskly\messages\en.json`
- `D:\Taskly\messages\bg.json`

## Mobile Files Inspected

- `app/customer/post-task.tsx`
- `app/customer/_layout.tsx`
- `app/customer/home.tsx`
- `src/components/taskly/TasklyLogoText.tsx`
- `src/components/taskly/ImagePickerPlaceholder.tsx`
- `src/lib/api/customer.ts`
- `src/lib/api/catalog.ts`
- `src/lib/api/domain.ts`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/bg.ts`

## Web Visual Pattern

The web `PostTaskModal` uses a compact premium booking modal:

- rounded shell with subtle border and soft shadow
- compact header with `Structured Booking`
- small step indicator text
- thin progress bar
- horizontal pills around 10-12px text
- focused white content card
- compact service cards with icon, title, helper text, and selected state
- sticky footer with secondary and primary actions

## Previous Mobile Attempt Rejected

The previous mobile implementation was technically multi-step but visually missed the web quality bar:

- logo felt tiny and weak
- header used too much vertical space
- title and subtitles were oversized
- step pills clipped on small screens
- cards were too large and heavy
- bottom tab bar competed with the booking footer
- latitude/longitude were visible to customers
- photo copy sounded unfinished
- required-field summary was too dominant

## Corrections Made

- Rebuilt `app/customer/post-task.tsx` as a focused native booking sheet.
- Reduced title, step subtitle, section title, card title, helper, and button proportions.
- Made the Taskly wordmark readable in a compact header with a close button.
- Added a thin progress bar and horizontally scrollable step pills with full labels.
- Tightened service cards to match the web modal proportions.
- Added a compact money input and quick budget chips.
- Reworked fields into premium rounded inputs with subtle borders.
- Removed customer-facing latitude/longitude fields.
- Kept coordinates as an internal fallback until native map picker parity is implemented.
- Replaced unfinished photo copy with customer-facing copy:
  - “Add photos to help Taskers understand the job.”
  - “Photos are attached when you submit the task.”
- Added a calm review checklist for missing required fields.
- Hid the customer bottom tab bar while `/customer/post-task` is active.
- Preserved existing backend create-task and photo-upload-after-create behavior.

## Backend/API Contract

No backend or API contract changes were made.

The mobile submit still sends the existing backend-owned creation shape:

- `address`
- `budgetEur`
- `categorySlug`
- `cityId`
- `description`
- `estimatedTime`
- `localImageCount`
- `location`
- `scheduledEndAt`
- `scheduledStartAt`
- `title`

No payment, lifecycle, matching, assignment, support, refund, payout, or admin fields are sent.

## Remaining Missing Web Parity

- Native map/address picker matching the web Google map picker.
- Rich native date/time controls.
- Full category-specific scope/checklist logic from the web modal.
- Web budget slider/tier model if the mobile backend contract later supports it.
- Preferred language and preferred Tasker sections from the web modal.

## Manual Screenshot QA Checklist

- Open `/customer/post-task` on a small Android phone.
- Confirm the bottom tab bar is hidden on this screen.
- Confirm the Taskly wordmark is readable and only one logo appears.
- Confirm the header height feels compact.
- Confirm `Structured Booking` is 24-28px, not oversized.
- Confirm step subtitle is compact and readable.
- Confirm step pills do not show clipped labels.
- Confirm service cards are compact and premium.
- Confirm no latitude/longitude fields are visible.
- Confirm photo step does not mention future availability.
- Confirm footer actions stay visible without covering content.
- Test EN and BG labels for overflow.
- Test each step validation.
- Submit in demo mode and confirm no real task is created.
- Submit in authenticated mode and confirm existing backend task creation still works.
