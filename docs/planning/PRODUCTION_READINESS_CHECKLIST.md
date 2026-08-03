# Production Readiness Checklist

## Current State

- Core Google OAuth local flow, post search, and image upload validation are committed in `0e07188`.
- Admin bulk post deletion, explicit Google account selection, and local registration autofill guards are ready for review.
- Frontend build and backend suite (59 tests) passed locally.
- Production deployment is not yet approved.

## High Priority Validation

- [ ] Verify real Cloudinary uploads for avatar, cover, and multi-image posts.
- [ ] Confirm the Cloudinary API key has only the required `create/upload` permissions and uploads use the intended folders.
- [ ] Manually verify Google OAuth locally for a new user, returning user, verified-email auto-link, banned account, logout, and refresh.
- [x] Add Google OAuth automated coverage for callback handling, onboarding-token expiry/replay, account linking, account bans, and Google-only password guards.
- [ ] Re-run the complete Playwright suite and investigate any long-suite auth/session flakes.

## AWS Production Setup

- [ ] Rotate Cloudinary and Google OAuth credentials that were used during local setup.
- [ ] Configure AWS HTTPS and the production frontend/backend custom domains.
- [ ] Store JWT, Cloudinary, Google OAuth, MongoDB, Redis, and mail credentials in environment variables or a secrets manager.
- [ ] Configure production Google OAuth redirect URI, consent screen, privacy-policy URL, and terms URL.
- [ ] Enable Secure cookies and restrict CORS to production HTTPS origins.
- [ ] Validate reverse proxy headers, health checks, Docker restart policy, and persistent MongoDB/Redis storage.
- [ ] Configure database backup, log retention, monitoring, and error/latency alerts.
- [ ] Run a staging-sized load test for feed, search, upload, and authentication flows.

## Deferred Enhancements

- [ ] Let Google-only users create a local password after recent Google reauthentication.
- [ ] Evaluate Cloudinary Direct Signed Upload after ownership, ticket, cleanup, and monitoring controls are ready.
- [ ] Extend search with user discovery, relevance tuning, cache metrics, and query performance SLOs.

## Release Gate

Do not enable production Google OAuth or Direct Signed Upload until all High Priority Validation and AWS Production Setup items required by the selected deployment scope are complete.
