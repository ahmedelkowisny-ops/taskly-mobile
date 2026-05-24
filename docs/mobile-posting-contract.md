# Mobile Posting Contract Review

Phase 16.5 reviews the current mobile posting form state against the existing Taskly web/backend create logic. This is a planning document only. Mobile submit remains disabled and unconnected.

## Files Reviewed

Mobile:

- `app/customer/post-task.tsx`
- `app/customer/post-pro-request.tsx`
- `src/lib/api/catalog.ts`
- `src/lib/images/types.ts`
- `src/lib/images/imagePicker.ts`

Backend reference:

- `src/app/actions.ts`
- `src/app/pro/customer-actions.ts`
- `src/app/actions/images.ts`
- `src/lib/mobile-catalog-readonly.ts`
- `prisma/schema.prisma`

## Current Mobile Post Task State

The Post Task screen currently loads:

- Cities from `GET /api/mobile/catalog/cities`
- Core categories from `GET /api/mobile/catalog/core-categories`
- Posting rules from `GET /api/mobile/catalog/posting-rules`

State currently stored in React:

- `selectedCategoryId: string | null`
- `selectedCityId: string | null`
- `title: string`
- `description: string`
- `images: LocalSelectedImage[]`
- local image processing/error state

Fields rendered but not currently stored as controlled state:

- Address/location text
- Schedule start
- Schedule end
- Budget/price estimate

Not present yet:

- Latitude/longitude or map pin
- Estimated time/time window value
- Tier selection
- Add-on selection
- Scope data
- Scope confirmation
- Checklist state
- Preferred language
- Preferred Tasker flow
- Image upload IDs or persisted image URLs

Selected images are local-only. Each image may include original `uri`, `compressedUri`, dimensions, file metadata, and local processing status.

## Current Mobile Post Pro Request State

The Post Pro Request screen currently loads:

- Cities from `GET /api/mobile/catalog/cities`
- Pro categories from `GET /api/mobile/catalog/pro-categories`
- Posting rules from `GET /api/mobile/catalog/posting-rules`

State currently stored in React:

- `selectedCategoryId: string | null`
- `selectedCityId: string | null`
- `title: string`
- `description: string`
- `images: LocalSelectedImage[]`
- local image processing/error state

Fields rendered but not currently stored as controlled state:

- District/area
- Preferred timeline
- Budget range

Not present yet:

- Preferred start date
- Timing flexibility
- Budget min/max numeric parsing
- Property type
- Project size
- Site visit preference
- Internal/private location notes
- Location address or map pin
- Selected Pro specialty tags
- Image upload IDs or persisted image URLs

Selected images are local-only and must not be included in create payloads until an upload/storage phase defines the contract.

## Backend Create Logic Summary

### Core Task

The current web/backend has two task creation paths in `src/app/actions.ts`:

- `createTask(...)`: older generic task path.
- `createV1Task(...)`: current structured Core task path.

The mobile Core task creation phase should align with `createV1Task` unless backend direction changes. That path validates category slug, tier, city, address, coordinates, budget, schedule, scope confirmation, checklist, and required photo count. It creates a `Task`, stores server-owned lifecycle defaults, and returns a serialized task plus a structured summary.

Relevant `Task` model fields include:

- `category`
- `title`
- `description`
- `address`
- `cityId`
- `lat`
- `lng`
- `price`
- `serviceCategoryId`
- `priceTierId`
- `selectedAddonCodes`
- `scopeChecklistJson`
- `scopeSummaryAcceptedAt`
- `status`
- `reservationState`
- `authorId`
- `scheduledStartAt`
- `scheduledEndAt`
- `estimatedTime`
- `preferredLanguageCode`
- `images`

Mobile must not set lifecycle, payment, assignment, cancellation, matching, or reservation fields directly.

### Pro Request

The current web/backend Pro request logic lives in `src/app/pro/customer-actions.ts`.

Relevant paths:

- `createProRequest(formData)` for the web form.
- `createProRequestFromModal(input)` for structured modal input.
- `createProRequestRecord(input)` for shared persistence.

The mobile Pro request creation phase should align with the structured modal input shape, while exposing a dedicated mobile API route rather than calling server actions directly.

The backend validates customer session, category, active city, district, title, description length, timeline, and budget range. It creates a `ProRequest` with `status: OPEN` and `accessStatus: NOT_PAID`.

Relevant `ProRequest` model fields include:

- `customerId`
- `title`
- `description`
- `categoryId`
- `categoryName`
- `cityId`
- `cityName`
- `district`
- `internalAddressProtected`
- `timeline`
- `budgetMin`
- `budgetMax`
- `status`
- `accessStatus`
- `images`

Mobile must not set access, payment, response, unlock, site visit, or final quote fields directly.

## Core Task Creation API Contract

Status: implemented in Phase 17.

Route:

- `POST /api/mobile/customer/tasks`

Auth:

- Required.
- Bearer mobile access token.
- Backend must derive `authorId` from the authenticated session.
- Backend must verify customer workspace access and `permissions.canPostTask`.

Request body:

```ts
type MobileCreateCoreTaskRequest = {
  categorySlug: string;
  cityId: string;
  title: string;
  detailsText: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  scheduledStartAt: string;
  scheduledEndAt: string;
  estimatedTime: string;
  budgetEur: number;
  tierCode?: string;
  addonCodes?: string[];
  checklistState?: Record<string, boolean>;
  scopeData?: Record<string, unknown>;
  scopeConfirmed: boolean;
  preferredLanguageCode?: string;
  preferredTaskerId?: number | null;
  preferredFallbackToMarketplace?: boolean;
  localImageCount?: number;
};
```

Required for first mobile mutation phase:

- `categorySlug`
- `cityId`
- `title`
- `detailsText`
- `address`
- `location.lat`
- `location.lng`
- `scheduledStartAt`
- `scheduledEndAt`
- `estimatedTime`
- `budgetEur`
- `scopeConfirmed`

Conditionally required:

- `tierCode`, `checklistState`, and `scopeData` if the backend category config requires them.
- `localImageCount` may be sent only as a count for backend validation until real upload is connected. It must not contain local URIs.

Server-owned fields mobile must not send:

- `authorId`
- `status`
- `reservationState`
- `paymentId`
- `taskerId`
- `reservedTaskerId`
- `assignmentState`
- `startedAt`
- `onTheWayAt`
- `canceledAt`
- cancellation fee fields
- `serviceCategoryId`
- `priceTierId`
- `scopeChecklistJson`
- `scopeSummaryAcceptedAt`
- payment status or Stripe identifiers

Suggested success response:

```ts
type MobileCreateCoreTaskResponse = {
  task: CustomerTaskDetail;
  nextActions: DetailNextAction[];
  uploadState?: {
    imageUploadRequired: boolean;
    uploadedImagesCount: number;
    maxImages: number;
  };
};
```

Suggested error response:

```ts
type MobileCreatePostingError = {
  error: {
    code:
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "VALIDATION_ERROR"
      | "INVALID_CITY"
      | "INVALID_CATEGORY"
      | "INVALID_SCHEDULE"
      | "INVALID_BUDGET"
      | "PRICE_MISMATCH"
      | "UPLOAD_REQUIRED"
      | "SERVER_ERROR";
    message: string;
    fieldErrors?: Record<string, string>;
    nextAction?: DetailNextAction | null;
  };
};
```

Validation notes:

- Backend remains final for all category, city, schedule, price, scope, checklist, and photo-count rules.
- Mobile may show helpful local validation but cannot treat it as authoritative.
- Backend should return customer-readable field errors for mobile display.

## Pro Request Creation API Contract

Status: implemented in Phase 18.

Route:

- `POST /api/mobile/customer/pro-requests`

Auth:

- Required.
- Bearer mobile access token.
- Backend must derive `customerId` from the authenticated session.
- Backend must verify customer workspace access and `permissions.canPostProRequest`.

Request body:

```ts
type MobileCreateProRequestRequest = {
  categoryKey: string;
  selectedTagKeys?: string[];
  cityId: string;
  district: string;
  title: string;
  description: string;
  preferredStartAt?: string;
  timeline?: string;
  timingFlexibility?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  projectSizeSqm?: string;
  propertyType?: string;
  siteVisitNeeded?: string;
  internalLocationDetails?: string;
  locationAddress?: string;
  location?: {
    lat: number;
    lng: number;
  } | null;
  localImageCount?: number;
};
```

Required for first mobile mutation phase:

- `categoryKey`
- `cityId`
- `district`
- `title`
- `description`
- one timeline field, preferably `preferredStartAt` or `timeline`
- `budgetMin`
- `budgetMax`

Optional:

- `selectedTagKeys`
- `timingFlexibility`
- `projectSizeSqm`
- `propertyType`
- `siteVisitNeeded`
- `internalLocationDetails`
- `locationAddress`
- `location`
- `localImageCount`

Server-owned fields mobile must not send:

- `customerId`
- `categoryName`
- `cityName`
- `status`
- `accessStatus`
- response counts
- unlock/payment/access fields
- Pro response fields
- site visit invite state
- final quote state
- admin review/moderation fields

Suggested success response:

```ts
type MobileCreateProRequestResponse = {
  proRequest: CustomerProRequestDetail;
  nextActions: DetailNextAction[];
  uploadState?: {
    imageUploadRequired: boolean;
    uploadedImagesCount: number;
    maxImages: number;
  };
};
```

Suggested error response uses the same `MobileCreatePostingError` shape as Core task creation.

Validation notes:

- Backend remains final for category/city, description length, budget range, and Pro posting/unlock rules.
- Backend should create Pro requests as free-to-post with unlock/payment state controlled server-side.
- Backend should not expose Pro contact details or unlock private fields in the create response.
- Phase 18 mobile submit sends customer-entered fields plus `localImageCount` only. It does not send local image URIs, compressed URIs, base64 data, image URLs, status/access/payment/unlock fields, provider fields, or response fields.

## Image Handling Recommendation

Current mobile image behavior:

- Local selection only.
- Local preview and removal.
- Conservative local compression/resizing.
- Original `uri` and `compressedUri` are retained in form state.
- Nothing is uploaded.
- Nothing is persisted.

Do not include local image URIs in create payloads. Local URIs are device-local and are not usable by the backend.

Recommended future upload/storage approach:

1. Define a dedicated upload/storage phase before connecting posting submit with images.
2. Prefer backend-created upload targets or signed upload URLs.
3. Upload compressed files using `compressedUri` when available.
4. Return persisted image IDs or URLs from the upload endpoint.
5. Use those persisted image references in create or attach calls.

Viable sequencing options:

- Create first, upload after: create task/request, then upload images to `/api/mobile/customer/tasks/[taskId]/images` or `/api/mobile/customer/pro-requests/[proRequestId]/images`.
- Upload first, create after: backend issues temporary upload targets, mobile uploads files, then create payload references temporary image IDs.
- Avoid base64 request bodies unless intentionally chosen as a short-lived development fallback.

The existing web backend has separate upload actions for task images and Pro request images. Mobile should follow the same separation and should not mix image upload into the initial create contract unless the backend explicitly designs that flow.

## Mobile Gaps Before Submit Can Be Connected

Post Task needs controlled state and UI for:

- Address/location plus map pin or geocoding strategy
- Schedule start/end
- Estimated time
- Budget/tier selection
- Scope details/checklist confirmation
- Optional add-ons
- Optional preferred language
- Optional preferred Tasker flow if mobile supports it

Post Pro Request needs controlled state and UI for:

- District/area
- Preferred timeline/start date
- Budget min/max numeric values
- Optional tags/specialties
- Optional property type/project size/site visit fields
- Optional private location notes/address/map pin

Both forms need:

- Field-level validation display
- Backend validation error mapping
- Loading/submitting state
- Success routing to the created read-only detail screen
- Upload/storage design before images are sent

## Phase Boundary

After Phase 16.5:

- Submit remains disabled.
- No backend create API routes are added.
- No upload routes are added.
- No backend business logic is changed.
- Existing demo mode remains unchanged.

After Phase 17:

- Core task submit is connected through `POST /api/mobile/customer/tasks`.
- Pro request submit remains disabled and future.
- Images remain local-only and are not included in the create payload.
- Payment entry points remain separate from creation.

After Phase 18:

- Pro request submit is connected through `POST /api/mobile/customer/pro-requests`.
- Created Pro requests use the existing backend initial state (`OPEN` with Pro access not paid) and return the mobile customer Pro request detail shape.
- Post Pro Request validation displays missing/invalid fields before submit.
- Images remain local-only and are not uploaded, persisted, or sent as URIs.
- Pro Access payment/unlock, Stripe, provider responses/actions, and image upload/storage remain future phases.
