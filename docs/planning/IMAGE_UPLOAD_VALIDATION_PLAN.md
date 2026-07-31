# Image Upload Validation Plan

> **Status:** Phase 1 proxy validation implemented locally; Direct Signed Cloudinary Upload remains planned
> **Scope:** Post image selection, compression, upload validation and storage sanitation

## 1. Current State

| Layer | Current behavior | Assessment |
| --- | --- | --- |
| Quantity | Maximum 10 images enforced in client selection, DTO and post service | Implemented; direct multipart bypass is rejected server-side. |
| Client raw-file limit | `CreatePostCard.tsx` rejects files larger than 20 MB before compression | Useful device-protection guard, but not an authoritative security limit. |
| Compression | Non-GIF files are sequentially converted to adaptive-budget WebP in a Web Worker, max dimension 1920 | Implemented transport optimization; final payload is revalidated. |
| GIF preservation | GIF bypasses WebP conversion | Correct for animation fidelity, but creates a separate size/resource policy requirement. |
| Backend MIME check | Apache Tika detects Magic Bytes and allows JPEG, PNG, WebP, GIF | Correct server trust boundary, but not a full image safety check. |
| Spring Multipart | 10 MB per final file and 30 MB per request | Implemented authoritative perimeter for post media; avatar/cover retain 5 MB policy. |

## 2. Is Client Compression Logically Correct?

Yes. Client-side compression is logically correct when its purpose is understood as **transport optimization**, not security validation.

The intended data flow for a normal JPEG/PNG/WebP is:

```text
Original local file (up to raw admission limit)
  -> browser dimension/decode guard
  -> Web Worker WebP compression
  -> compressed payload revalidation
  -> multipart upload
  -> backend trust validation
  -> Cloudinary sanitation/transformation
```

This reduces upload bandwidth, Cloudinary storage/processing cost and perceived publish time. Using `useWebWorker: true` is appropriate because image compression is CPU-heavy and should not block typing, scrolling or modal interaction.

### Important distinction

- **20 MB client raw admission limit:** protects mobile memory/CPU and prevents an expensive attempt to decode very large originals. It may reject an image that theoretically could compress smaller; that is an acceptable UX/performance trade-off.
- **Backend accepted payload limit:** protects the API, application memory, queueing and storage. It is authoritative and cannot be bypassed.
- **Compressed output limit:** must be checked after compression because `maxSizeMB: 1` is a target, not a guarantee for every image format/content.

Therefore, accepting a 15 MB JPEG in the browser and uploading a 900 KB WebP is correct. GIF bypasses compression but is now rejected before upload if it exceeds the 10 MB final payload policy.

## 3. Current Gaps And Risks

### 3.1 Inconsistent Size Policy

The original client/server size mismatch has been resolved for post media: raw input is capped at 20 MB, while final payload is capped at 10 MB/file and 30 MB/post. A remaining future concern is direct signed upload, which changes where final payload validation occurs.

The 30 MB aggregate request limit intentionally means ten selected images cannot all reach the 10 MB individual cap. FE calculates an adaptive compression target from the remaining aggregate budget and rejects output that exceeds it.

### 3.2 Missing Quantity Constraint

This gap is closed: client selection calculates remaining slots, `CreatePostRequest.images` has `@Size(max = 10)`, and `PostService` validates count, per-file bytes and aggregate bytes before Cloudinary upload.

### 3.3 MIME Detection Is Necessary But Not Sufficient

Tika Magic Bytes prevents simple extension and browser `Content-Type` spoofing. It does not fully protect against:

- Corrupt or maliciously crafted decodable images.
- Pixel/decompression bombs with small byte size but extreme memory use.
- GIFs with huge frame counts or duration.
- EXIF metadata leakage, including GPS location.
- Storage of originals that are never needed for display.

### 3.4 Client Compression Failure Path

The current implementation uploads the original file when compression throws. This preserves user intent, but it must re-check backend-compatible file and aggregate limits and show a specific warning.

## 4. Recommended Policy

### Phase 1 Limits

| Policy | Recommended value | Enforcement |
| --- | --- | --- |
| Maximum images per post | 10 | Client, DTO and service |
| Client raw admission limit | 20 MB per non-GIF original | Client only, before decode/compression |
| Backend accepted payload | 5 MB per uploaded file | Spring Multipart and service |
| Backend aggregate payload | 25 MB per post request | Spring Multipart and service |
| GIF accepted payload | 5 MB until a dedicated GIF policy exists | Client and backend |
| Target compressed file | 1 MB, 1920 px max dimension | Client optimization only |

This policy intentionally permits up to 10 selected images, while rejecting a selection whose final multipart payload exceeds 25 MB. The UI must show how many files were omitted and why; it must not imply that all 10 files are guaranteed to upload at their maximum size.

If product requirements require ten 5 MB files, increase `max-request-size` to at least 50 MB only after load, timeout and abuse review.

## 5. Target Six-Layer Architecture

### Layer 0: Request Perimeter

- Configure Spring `max-file-size` and `max-request-size` from one documented policy source.
- Apply authenticated upload rate limits and request timeout limits.
- Reject oversized requests before business logic.

### Layer 1: Client Selection And Quantity

- Calculate `remaining = 10 - currentFiles.length` before accepting a new selection.
- Filter browser MIME types for early UX only: JPEG, PNG, WebP and GIF.
- Reject raw non-GIF files over 20 MB before decode/compression.
- Reset file input after every selection so choosing the same file behaves predictably.

### Layer 2: Client Compression

- Compress non-GIF files sequentially in a Web Worker.
- Enforce dimensions before compression where possible.
- Support cancellation when a user removes a file or closes the composer.
- Re-check compressed output against the 5 MB server limit and the 25 MB aggregate budget.
- On failure, either reject the original with a clear message or accept it only if it still satisfies all payload limits.

### Layer 3: Animation Preservation

- Keep animated GIFs as GIFs; never silently convert them to static WebP.
- Apply the same 5 MB payload limit initially.
- Before allowing larger GIFs, introduce validated frame count, dimensions, duration and storage/bandwidth budgets.

### Layer 4: Backend Trust Validation

- Validate non-null files, count `<= 10`, per-file bytes and aggregate bytes in the post service.
- Detect Magic Bytes with Tika; do not trust file extension, declared MIME type or client compression.
- Decode/inspect image metadata with a format-capable library and reject unsupported, corrupt, oversized or pixel-bomb content.
- Enforce max width, height and total pixels. Enforce GIF frame and duration limits.
- Return field-level validation errors so the client can identify rejected files.

### Layer 5: Storage Sanitation

- Add `uploadPostImage`, rather than reusing avatar upload semantics/foldering.
- Strip EXIF metadata and distribute a transformed derivative rather than an unbounded original.
- Keep Cloudinary `allowed_formats` as a downstream defense-in-depth control.
- Store only HTTPS secure URLs and do not derive paths from user-provided filenames.

## 6. Implementation Order

1. Centralize the 5 MB/25 MB policy and display matching client copy.
2. Add client remaining-slot and final aggregate-size checks.
3. Add `@Size(max = 10)` to request DTO and service-level count/aggregate validation.
4. Add post-specific media upload method and tests.
5. Add safe image metadata/decode limits and EXIF stripping.
6. Add GIF frame/dimension policy before increasing GIF allowance.

## 7. Required Tests

- Selecting 11 images in one action and through repeated selections.
- Direct multipart request with 11 files, an oversized file and an oversized aggregate request.
- JPEG/PNG/WebP compression output below and above the backend limit.
- Compression failure fallback behavior.
- Spoofed extension/MIME, invalid bytes, corrupt image and polyglot file.
- Extreme dimensions/pixel count and animated GIF frame count.
- EXIF GPS removal in the stored/distributed image.
- Mobile device profiling for ten sequential compression operations.

## 8. Success Criteria

- The client and server communicate the same final upload budget.
- No route can upload more than 10 images or exceed server byte limits.
- Magic Bytes, image decodability and dimension/frame constraints all pass before storage.
- Animated GIF behavior is explicit and tested.
- Image metadata that could expose user location is removed before public delivery.

## 9. Recommended Scale Architecture: Direct Signed Cloudinary Upload

The current backend-proxy upload is acceptable for a small MVP but should not be the final path for ten high-resolution images. A post with ten 20 MB local originals can create unnecessary backend bandwidth, multipart buffering and request-duration pressure even when client compression is enabled.

The recommended production architecture sends optimized image bytes directly from the browser to Cloudinary. The backend remains the authority for authorization and post publication; it does not proxy image binaries.

```text
User selects up to 10 local originals, each <= 20 MB
  -> FE validates count and raw admission limits
  -> FE processes at most 2 images concurrently in Web Workers
  -> FE adaptively compresses non-GIF images to a shared post budget
  -> FE requests short-lived signed upload tickets from BE
  -> FE uploads optimized bytes directly to Cloudinary
  -> FE sends asset IDs, not arbitrary URLs, to BE to create the post
  -> BE verifies ticket ownership, format, bytes and aggregate budget
  -> BE persists approved Cloudinary asset references with the post
```

### 9.1 Why Direct Upload

- The backend does not receive up to 200 MB of raw local files for one post.
- Browser-to-Cloudinary upload is more resilient for slow client networks and does not occupy application server request threads.
- Cloudinary is the media/CDN provider and should carry binary upload bandwidth, transformations and delivery.
- The backend receives a small metadata request only after media upload has succeeded.
- The client can show per-file progress, retry a single upload and cancel unused uploads.

### 9.2 Final Budget Policy

| Policy | Recommended value | Meaning |
| --- | --- | --- |
| Local source selection | Up to 10 files, 20 MB each | Raw-device admission guard; not sent unchanged by default |
| Non-GIF compression | WebP, 1920 px maximum dimension | Sequential/adaptive browser optimization |
| Per-file final payload | Soft target derived from selected image count; hard cap 6 MB | Allows panoramas or complex photos without allowing unbounded files |
| Aggregate final payload | 25 MB per post | Total bytes uploaded to Cloudinary for one post session |
| GIF final payload | 5-10 MB, subject to frame/dimension policy | Animation remains GIF; never silently flattened to WebP |

The compression target must be adaptive rather than permanently 1 MB per file. For example, with a 25 MB total budget:

| Selected image count | Approximate target per non-GIF image |
| ---: | ---: |
| 1 | 5-6 MB |
| 2 | 4-5 MB |
| 5 | 3-4 MB |
| 10 | 2-2.5 MB |

The browser may allow a complex image to use more than its average target if the projected aggregate remains within 25 MB. If the final output exceeds the budget, the UI offers lower quality/resolution or removal of selected images before upload.

### 9.3 Frontend Upload Queue

The frontend must not decode/compress all ten 20 MB files at once. It should:

1. Read lightweight metadata and validate raw selection count/size.
2. Process a queue with concurrency of 1-2 Web Workers.
3. Calculate a dynamic target from remaining aggregate budget and remaining file count.
4. Revalidate each final Blob's bytes, dimensions and projected total.
5. Request a signed ticket immediately before the individual upload.
6. Upload directly to Cloudinary with progress, retry and cancellation.
7. Keep asset IDs and upload session state locally until the post is published or abandoned.

This controls mobile memory pressure while allowing a ten-image post to complete incrementally.

### 9.4 Backend Signed Ticket Contract

The client must never use an unsigned public upload preset or receive the Cloudinary API secret.

`POST /media/post-upload-tickets` should return a short-lived, user-bound ticket for one asset. The backend signs the Cloudinary upload parameters and records the session server-side.

Ticket constraints:

- Expiry of approximately 5 minutes.
- A server-generated `public_id` and folder such as `miniface/posts/{userId}/{sessionId}`.
- Allowed formats: JPEG, PNG, WebP and GIF only.
- Expected resource type `image`.
- Maximum bytes according to final payload policy.
- Upload context containing opaque session and owner identifiers.
- At most 10 tickets issued/consumed for one post session.

The final create-post request must submit Cloudinary `public_id` values or server-issued asset IDs, not arbitrary `secure_url` values.

### 9.5 Backend Publication Validation

Before creating a post, the backend verifies every referenced asset:

- It belongs to the authenticated user and active upload session.
- It is in the expected folder and has not expired or been previously consumed.
- Its detected Cloudinary resource type, format, bytes and aggregate bytes meet policy.
- It passes the image/GIF metadata policy, including dimensions and frame constraints when available.
- It has a secure HTTPS delivery URL generated from the validated public ID.

Assets that upload successfully but are never attached to a post should be deleted by a scheduled cleanup job after a short retention period.

### 9.6 Cloudinary Transformation And Privacy

- Store/distribute a sanitized derivative rather than exposing original uploads unnecessarily.
- Strip EXIF metadata, especially GPS location, during transformation.
- Define post-specific transformations and folders; do not reuse avatar upload semantics.
- Preserve animated GIFs only when required; apply frame, duration and dimension limits before public delivery.

### 9.7 Migration Path

1. Keep the current backend-proxy upload for MVP while implementing count and final-payload validation.
2. Add post-specific Cloudinary media service and signed ticket endpoints behind a feature flag.
3. Ship the frontend queue and direct upload flow with progress/cancel/retry.
4. Verify ownership/publication checks, abandoned-asset cleanup and monitoring in staging.
5. Enable direct uploads gradually; remove binary proxying for post media only after metrics are stable.

### 9.8 Required Cloudinary Account Setup

- Create a restricted signed upload preset or use server-generated signatures.
- Keep `api_secret` only in backend environment variables; never expose it to the frontend.
- Configure allowed image formats, folder naming policy and transformation presets.
- Configure upload/webhook verification if Cloudinary callbacks are used.
- Create separate development and production credentials.
