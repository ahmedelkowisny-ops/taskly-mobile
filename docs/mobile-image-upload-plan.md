# Mobile Image Upload Plan

## Phase 19 Scope

Phase 19 is an architecture review for mobile image upload and storage. It does not connect image upload, does not add upload API routes, and does not change Core task or Pro request creation payloads.

The goal is to define the safest Phase 20 implementation for attaching customer-selected photos to:

- Core tasks
- Pro requests

Image upload must remain separate from payment, lifecycle, provider actions, matching, cancellation, dispute, refund, help, and Pro unlock logic.

## Backend Image Handling Findings

### Core Task Images

Inspected backend files:

- `D:\Taskly\src\app\actions\images.ts`
- `D:\Taskly\src\app\actions.ts`
- `D:\Taskly\prisma\schema.prisma`
- `D:\Taskly\src\components\customer\CustomerDashboardContent.tsx`
- `D:\Taskly\src\components\PostTaskModal.tsx`
- `D:\Taskly\src\lib\client-image-optimize.ts`

Current storage model:

- Core task images are persisted as `TaskImage` records.
- `TaskImage.url` is `String @db.LongText` in Prisma and maps to the `task_images` table.
- `TaskImage` rows cascade delete with the parent task.
- The upload action stores either a public URL or a `data:` URL in the `url` column.

Current upload behavior:

- Web upload uses the `uploadTaskImage(taskId, formData)` server action.
- The action requires an authenticated user from the backend session.
- The backend checks that the task exists, is not deleted, and belongs to the authenticated user.
- The backend enforces a max of 5 images per Core task.
- The backend enforces a max file size of 10 MB.
- Accepted MIME types are `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`, `image/heic`, and `image/heif`.
- The backend writes to `public/uploads/tasks/[taskId]` when the filesystem is writable.
- On read-only or serverless filesystems, including Vercel/AWS Lambda style environments, it falls back to a base64 `data:` URL.
- The web customer dashboard optimizes images before upload and sends a single image in `FormData`.

Storage constraints:

- Local filesystem storage is useful in development but is not durable serverless storage.
- The `LONGTEXT` data URL fallback keeps upload working without external storage, but it increases database size and can make image-heavy reads expensive.
- The current architecture does not use signed object storage for task images.

### Pro Request Images

Inspected backend files:

- `D:\Taskly\src\app\pro\customer-actions.ts`
- `D:\Taskly\prisma\schema.prisma`
- `D:\Taskly\src\components\pro\ProRequestModal.tsx`
- `D:\Taskly\src\app\api\mobile\customer\pro-requests\route.ts`

Current storage model:

- Pro request images are persisted as `ProRequestImage` records.
- `ProRequestImage.url` is `String @db.LongText` in Prisma and maps to the `pro_request_images` table.
- `ProRequestImage` has `sortOrder` for display ordering.
- Rows cascade delete with the parent Pro request.

Current upload behavior:

- Web upload uses `uploadProRequestImageAction(proRequestId, formData)`.
- The action requires an authenticated customer.
- The backend checks that the Pro request belongs to the authenticated customer.
- The backend enforces a max of 10 images per Pro request.
- The backend enforces a max file size of 10 MB.
- Accepted MIME types are `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`, `image/heic`, and `image/heif`.
- The backend writes to `public/uploads/pro-requests/[proRequestId]` when the filesystem is writable.
- On read-only or serverless filesystems it falls back to a base64 `data:` URL.
- The web Pro request modal creates the Pro request first, then uploads prepared photos one by one.
- If a Pro request photo upload fails on web, the Pro request still exists and the user gets a non-blocking warning.
- The mobile Pro request creation route currently returns upload state but creates no image records.

Storage constraints:

- The Pro request image path matches the Core task pattern: local file URL when possible, database data URL fallback otherwise.
- This is compatible with a conservative post-create mobile upload route, but not ideal for long-term scale.

## Mobile Local Image Findings

Inspected mobile files:

- `D:\Taskly-app\src\lib\images\types.ts`
- `D:\Taskly-app\src\lib\images\imagePicker.ts`
- `D:\Taskly-app\src\components\taskly\ImagePickerPlaceholder.tsx`
- `D:\Taskly-app\app\customer\post-task.tsx`
- `D:\Taskly-app\app\customer\post-pro-request.tsx`

Current mobile image shape:

```ts
type LocalSelectedImage = {
  id: string;
  uri: string;
  compressedUri?: string;
  compressedFileSize?: number;
  errorMessage?: string;
  fileName?: string;
  fileSize?: number;
  height?: number;
  mimeType?: string;
  status: 'compressed' | 'error' | 'selected';
  width?: number;
};
```

Current mobile behavior:

- The image picker stores selected photos in React state only.
- The original local `uri` is always present for selected images.
- `compressedUri` is set after successful processing. When compression is unnecessary, it is set to the original `uri`.
- `compressedFileSize` is defined in the type but is not currently populated by the compression helper.
- `mimeType`, `fileName`, `fileSize`, `width`, and `height` are optional because Expo image picker assets may not always include every field.
- Compression uses Expo Image Manipulator with a max width of 1600 and JPEG output when resizing/compressing.
- Compression errors are represented by `status: 'error'` and `errorMessage`.
- Preview uses `compressedUri || uri`.
- Post Task and Post Pro Request send only `localImageCount`; selected local images are not uploaded or sent.

Future upload source:

- Phase 20 should prefer `compressedUri` when `status === 'compressed'`.
- If `compressedUri` equals the original URI because compression was not needed, it is still the safest field for consistency.
- Images with `status === 'error'` should not be uploaded unless the user retries processing or removes/reselects them.
- Local `uri` and `compressedUri` must never be persisted as permanent backend image values.

## Strategy Options

### Option A: Upload After Entity Creation

Endpoints:

- `POST /api/mobile/customer/tasks/[taskId]/images`
- `POST /api/mobile/customer/pro-requests/[proRequestId]/images`

Pros:

- Matches current web behavior for Pro requests.
- Keeps Core task and Pro request creation small and reliable.
- Allows the task/request to exist even if photo upload fails.
- Makes ownership checks simple because the backend can validate the authenticated customer owns the existing entity.
- Works with one-image-per-request partial success and simple retry behavior.
- Reuses current `TaskImage` and `ProRequestImage` persistence models.

Cons:

- Requires mobile to handle a second phase after creation.
- A user may see a created task/request with fewer images if upload fails.
- Needs careful loading and warning UI so upload failure is understandable.

Security concerns:

- Backend must verify authenticated ownership for every upload.
- Backend must enforce max image count, file size, MIME type, and allowed entity state.
- Mobile must not send lifecycle, payment, matching, provider, access, or unlock fields.

Mobile reliability:

- Good. Creation is not held hostage by large media transfer.
- Failed images can be retried individually.
- Local images are ephemeral, so reliable background retry would require a later draft/outbox design.

Vercel/serverless suitability:

- Works with the existing data URL fallback.
- Long-term object storage would still be better than filesystem or database data URLs.

Database impact:

- Same as current web fallback. It may store large base64 strings in `LONGTEXT`.
- Acceptable as a conservative bridge, but not ideal at scale.

Ease of implementation:

- Low to moderate. Add API route wrappers around existing validation and persistence patterns.
- Best implemented by extracting shared upload helpers so web server actions and mobile routes use the same rules.

Architecture match:

- Strongest match to current Taskly backend architecture.

### Option B: Upload First To Temporary Storage, Attach IDs During Creation

Pros:

- Creation payload can reference already uploaded assets.
- Good fit for future object storage with cleanup jobs.
- Can support drafts and resumable workflows later.

Cons:

- Requires temporary asset records, cleanup rules, and orphan handling.
- More moving parts before Taskly has dedicated mobile upload storage.
- Harder to reason about ownership before the final task/request exists.

Security concerns:

- Temporary assets must be bound to the authenticated customer.
- Attach operations must ensure temp assets cannot be claimed by another user.
- Cleanup must prevent long-lived private files.

Mobile reliability:

- Mixed. Upload can happen before creation, but create failure leaves temporary assets.
- Requires more retry and cleanup behavior.

Vercel/serverless suitability:

- Good only if external object storage exists.
- Weak if implemented with local filesystem or database data URLs.

Database impact:

- Potentially lower if using object storage.
- Higher operational complexity if using DB-backed temporary data URLs.

Ease of implementation:

- Moderate to high. Requires new lifecycle for temporary uploads.

Architecture match:

- Not the best fit for the current backend, which already attaches images to existing entities.

### Option C: Send Base64/Data URLs Inside Creation Payload

Pros:

- Smallest number of HTTP requests.
- Could be a quick local development fallback.

Cons:

- Bloats JSON payloads and increases timeout risk.
- Couples image upload failure to task/request creation.
- Makes validation and partial success awkward.
- Encourages large base64 payloads in mobile memory.

Security concerns:

- Backend must still validate image count, size, MIME type, and ownership.
- Payload size limits can become an attack surface.

Mobile reliability:

- Poor for real devices and unstable networks.
- A single failed upload can fail the entire creation flow.

Vercel/serverless suitability:

- Poor to mixed. Large JSON bodies are fragile in serverless environments.

Database impact:

- Highest risk if every creation payload carries base64 data.

Ease of implementation:

- Easy initially, costly to unwind later.

Architecture match:

- Weak. Current mobile creation intentionally sends only `localImageCount`.

Recommendation:

- Avoid for Phase 20 except as a clearly size-limited development fallback if multipart proves impossible.

### Option D: Signed Upload / External Object Storage

Pros:

- Best long-term media architecture.
- Avoids storing large images in the database.
- Can support CDN delivery, lifecycle policies, virus scanning, and durable storage.
- Works well with mobile direct upload and retry.

Cons:

- Requires choosing and configuring a storage provider.
- Needs signed URL routes, object keys, metadata records, cleanup, and access policy design.
- More infrastructure than Phase 20 needs if existing DB-backed image storage is acceptable short term.

Security concerns:

- Signed upload keys must be scoped to the authenticated customer and intended entity.
- Backend must finalize/attach uploaded assets after validating ownership and object metadata.
- Private/public access rules need a product decision.

Mobile reliability:

- Strong if using direct uploads, retries, and progress events.

Vercel/serverless suitability:

- Strong. It avoids durable filesystem assumptions.

Database impact:

- Best. Store URLs/object keys and metadata rather than base64 image data.

Ease of implementation:

- Higher than Option A.

Architecture match:

- Good long term, but not currently implemented in Taskly image handling.

## Recommended Phase 20 Implementation

Implement Option A first: authenticated post-create mobile upload endpoints that reuse the existing backend image validation and persistence model.

Phase 20 should:

- Add `POST /api/mobile/customer/tasks/[taskId]/images`.
- Add `POST /api/mobile/customer/pro-requests/[proRequestId]/images`.
- Accept `multipart/form-data` with one file per request.
- Require mobile authentication and derive the customer/user identity from the backend session/token.
- Verify the authenticated customer owns the target task or Pro request.
- Enforce existing backend count, size, and MIME limits.
- Persist images using the same storage behavior as web: filesystem path when writable, `data:` URL fallback when needed.
- Append new images rather than replacing existing images.
- Return the created image record plus updated upload state.
- Keep creation successful even when later image upload fails.
- Show a non-blocking mobile warning if selected photos could not be added.

Phase 20 should not:

- Send images in the task/request creation payload.
- Persist local file URIs.
- Add external storage unless it is introduced as a separate storage phase.
- Add payment, provider action, lifecycle, matching, cancellation, refund, dispute, help, or Pro unlock behavior.

Backend implementation note:

- Prefer extracting shared upload helpers from the existing server actions so web actions and mobile routes share validation constants, storage fallback logic, and DB persistence.
- If extraction is too risky, copy only the minimal current behavior into the mobile route and schedule helper consolidation immediately after Phase 20.

## Phase 20A Backend Endpoint Status

Phase 20A implements the backend upload endpoints only. Mobile upload is still not wired.

Added backend endpoints:

- `POST /api/mobile/customer/tasks/[taskId]/images`
- `POST /api/mobile/customer/pro-requests/[proRequestId]/images`

Request format:

- `multipart/form-data`
- One image per request
- File field name: `image`

Auth and ownership:

- Both endpoints require mobile authentication.
- The backend derives the authenticated customer/user identity from the session/token.
- The Core task endpoint checks that the task exists, is not deleted, and has `authorId` matching the authenticated user.
- The Pro request endpoint checks that the request exists and has `customerId` matching the authenticated user.
- Neither endpoint accepts mobile-supplied owner IDs, status fields, payment fields, provider fields, lifecycle fields, matching fields, access/unlock fields, local URIs, image URLs, base64 strings, or image records.

Limits:

- Core task images: 5 max, matching current backend Core task upload logic.
- Pro request images: 10 max, matching current backend Pro request upload logic.
- Max file size: 10 MB.
- Accepted MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`, `image/heic`, `image/heif`.

Response shape:

```ts
{
  image: {
    id: string;
    url: string;
    sortOrder?: number;
    createdAt: string;
  };
  uploadState: {
    uploadedCount: number;
    maxImages: number;
    remainingSlots: number;
  };
}
```

Lifecycle gating:

- Phase 20A matches existing web upload behavior and does not add new lifecycle state transitions or payment/provider gating.
- Core task uploads are allowed for the authenticated owner while the task exists and is not soft-deleted.
- Pro request uploads are allowed for the authenticated owner while the Pro request exists.
- More restrictive edit windows can be added later only as a dedicated backend rule change.

Storage:

- The endpoints use the existing storage pattern: write to `public/uploads/tasks/*` or `public/uploads/pro-requests/*` when the filesystem is writable.
- In read-only/serverless environments, the endpoints fall back to a `data:` URL persisted in the existing `LONGTEXT` image URL column.
- This keeps mobile compatible with current web behavior, but external object storage remains the preferred long-term design.

Phase 20B should:

- Add mobile API client/types for both upload endpoints.
- Upload selected compressed images after Core task or Pro request creation.
- Show progress and non-blocking warnings when images cannot be added.
- Keep creation separate from upload and keep demo mode local-only.

## Phase 20B Mobile Status

Phase 20B is implemented on mobile.

Mobile helpers added:

- `src/lib/api/imageUploads.ts` adds typed wrappers for task and Pro request image upload endpoints.
- `src/lib/images/uploadSelectedImages.ts` uploads selected images sequentially and returns `{ total, uploaded, failed, skipped, errors }`.
- The shared API client now passes `FormData` bodies through without JSON encoding or manually setting `Content-Type`.

Upload sequence:

- Post Task calls Core task creation first.
- Post Pro Request calls Pro request creation first.
- If creation succeeds and selected images exist, mobile uploads them one by one.
- If creation fails, no image upload is attempted.
- The app navigates to the created detail screen after the upload sequence completes.

React Native multipart behavior:

- Uploads use `FormData`.
- The field name is `image`.
- The file part uses the React Native shape `{ uri, name, type }`.
- `compressedUri` is preferred when `status === 'compressed'`.
- `uri` is used only as the local file source fallback for multipart upload.
- Local URI values are never sent as JSON or persisted as backend image values.
- Base64 is not sent.

Partial failure behavior:

- Images with `status === 'error'` or `data:` URIs are skipped.
- A failed upload does not stop the remaining uploads.
- A failed or skipped upload does not roll back the created task/request.
- Users see a non-blocking warning when some photos fail or are skipped.

Demo behavior:

- Demo mode does not call creation or upload endpoints.
- Selected photos remain local in demo mode.

Remaining limitations:

- There is no durable background retry/outbox yet.
- Upload progress is simple sequential count progress.
- Long-term object storage remains a future storage architecture improvement.

## Phase 20 API Contracts

### Core Task Image Upload

Endpoint:

- `POST /api/mobile/customer/tasks/[taskId]/images`

Auth:

- Requires mobile authentication.
- Derives the user/customer identity from the backend session/token.
- Does not accept `userId`, `customerId`, provider IDs, lifecycle fields, payment fields, matching fields, or status fields.

Ownership and permissions:

- The task must exist.
- The task must belong to the authenticated customer.
- Deleted tasks must reject uploads.
- Phase 20 should explicitly decide whether uploads are allowed after cancellation/completion. Current web upload checks ownership and not-deleted state, so matching that behavior is the lowest-risk initial path unless product rules require stricter lifecycle gating.

Limits:

- Max total images: 5, matching current backend Core task upload logic.
- Max file size: 10 MB.
- Accepted MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`, `image/heic`, `image/heif`.

Request format:

- Recommended: `multipart/form-data`.
- Required field: `file`.
- Optional field: `clientImageId` for client-side reconciliation and future duplicate prevention.

Response shape:

```ts
{
  image: {
    id: number;
    taskId: number;
    url: string;
    createdAt: string;
  };
  uploadState: {
    uploadedImagesCount: number;
    maxImages: number;
    remainingSlots: number;
  };
}
```

Error states:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `TOO_MANY_IMAGES`
- `FILE_REQUIRED`
- `FILE_TOO_LARGE`
- `INVALID_FILE_TYPE`
- `UPLOAD_FAILED`
- `VALIDATION_FAILED`
- `SERVER_ERROR`

Partial success:

- Phase 20 should upload one image per request. Partial success is then represented by successful requests plus failed requests.
- A later batch endpoint could return `{ uploaded: [], failed: [] }`, but it is not necessary for Phase 20.

Duplicate handling:

- Appends by default.
- Duplicate prevention can use a future `clientImageId` idempotency key. Phase 20 can keep this optional and avoid retrying a successfully uploaded local image in memory.

### Pro Request Image Upload

Endpoint:

- `POST /api/mobile/customer/pro-requests/[proRequestId]/images`

Auth:

- Requires mobile authentication.
- Derives the customer identity from the backend session/token.
- Does not accept `userId`, `customerId`, provider IDs, response IDs, status fields, access/unlock fields, payment fields, matching fields, or lifecycle/admin fields.

Ownership and permissions:

- The Pro request must exist.
- The Pro request must belong to the authenticated customer.
- Phase 20 should explicitly decide whether uploads are allowed after closed/cancelled states. Current web upload checks customer ownership, so matching that behavior is the lowest-risk initial path unless product rules require stricter lifecycle gating.

Limits:

- Max total images: 10.
- Max file size: 10 MB.
- Accepted MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`, `image/heic`, `image/heif`.

Request format:

- Recommended: `multipart/form-data`.
- Required field: `file`.
- Optional field: `clientImageId`.

Response shape:

```ts
{
  image: {
    id: number;
    proRequestId: number;
    url: string;
    sortOrder: number;
    createdAt: string;
  };
  uploadState: {
    uploadedImagesCount: number;
    maxImages: number;
    remainingSlots: number;
  };
}
```

Error states:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `TOO_MANY_IMAGES`
- `FILE_REQUIRED`
- `FILE_TOO_LARGE`
- `INVALID_FILE_TYPE`
- `UPLOAD_FAILED`
- `VALIDATION_FAILED`
- `SERVER_ERROR`

Partial success:

- Phase 20 should upload one image per request and allow later requests to continue after one failure only if the user chooses retry.

Duplicate handling:

- Appends by default.
- Preserve `sortOrder` based on existing image count.
- Future duplicate prevention can use `clientImageId` or checksum metadata.

## Phase 20 Mobile Plan

### Post Task

Planned behavior:

- User selects photos locally.
- User submits the Core task creation form.
- Backend creates the task first.
- Mobile uploads selected images to `POST /api/mobile/customer/tasks/[taskId]/images` using `compressedUri`.
- Mobile should skip images with `status === 'error'` and show a clear warning.
- If uploads succeed, navigate to the created task detail screen and refresh so images can appear if the detail API includes them.
- If uploads fail, keep the task and show a non-blocking warning such as "Task created, but photos could not be added."
- Do not send local image URIs, compressed URIs, base64 data, or image records in the creation payload.

Recommended loading behavior:

- Show "Creating task..." during creation.
- After creation, show "Adding photos..." with simple progress if images are selected.
- Navigate after uploads finish or after the user acknowledges a warning. This avoids hiding upload failure behind an immediate route change.

Retry behavior:

- Phase 20 can offer a same-screen retry while local image URIs are still available.
- Full background retry or draft persistence should wait for a later offline/outbox phase.

Demo mode:

- Demo mode must not call backend upload endpoints.
- Demo mode can keep showing selected photos as local previews and a demo-only success state.

Offline/network failure:

- If task creation fails, no upload should be attempted.
- If creation succeeds but upload fails, the task remains created and the user sees a non-blocking warning.
- Local images should not be assumed recoverable after app restart.

### Post Pro Request

Planned behavior:

- User selects photos locally.
- User submits the Pro request creation form.
- Backend creates the Pro request first.
- Mobile uploads selected images to `POST /api/mobile/customer/pro-requests/[proRequestId]/images` using `compressedUri`.
- Mobile should skip images with `status === 'error'` and show a clear warning.
- If uploads succeed, navigate to the created Pro request detail screen and refresh so images can appear if the detail API includes them.
- If uploads fail, keep the Pro request and show a non-blocking warning such as "Pro request created, but photos could not be added."
- Do not send local image URIs, compressed URIs, base64 data, image URLs, or image records in the creation payload.

Recommended loading behavior:

- Show "Creating Pro request..." during creation.
- After creation, show "Adding photos..." with simple progress if images are selected.
- Navigate after uploads finish or after the user acknowledges a warning.

Retry behavior:

- Same-screen retry is acceptable while local image URIs remain available.
- Persistent retry should wait for a later draft/outbox design.

Demo mode:

- Demo mode must not call backend upload endpoints.
- Demo mode can keep selected images local and show a demo-only success state.

Offline/network failure:

- If Pro request creation fails, no upload should be attempted.
- If creation succeeds but upload fails, the Pro request remains created and the user sees a non-blocking warning.

## Risks And Open Questions

- Core task max images differ across some planning surfaces. The current backend upload action allows 5 Core task images, while mobile posting rules must be checked and aligned before Phase 20.
- The serverless fallback stores base64 `data:` URLs in `LONGTEXT`. This is compatible with current web behavior but can increase database size quickly.
- Local filesystem writes under `public/uploads/*` are not durable on Vercel/serverless deployments.
- Mobile compression outputs JPEG when it processes an image. Phase 20 should ensure uploaded `FormData` uses an accurate MIME type such as `image/jpeg` for compressed outputs.
- `compressedFileSize` is not currently populated, so backend validation must remain authoritative for file size.
- Expo image picker metadata is optional. Phase 20 should handle missing `fileName`, `mimeType`, and `fileSize` gracefully.
- Upload lifecycle gating should be confirmed. Current web upload actions primarily enforce ownership and existence, not detailed task/request status rules.
- Duplicate retry behavior is not fully designed. Phase 20 can avoid obvious duplicate retries in memory, while durable idempotency can come later.
- Image moderation, virus scanning, and EXIF stripping are not visible in the current backend upload path and may need future product/security work.
- Long-term external object storage remains the preferred architecture once Taskly needs durable, scalable image storage.
