# Production Readiness Checklist

Deployment execution order is documented in [AWS_DEPLOYMENT_CHECKLIST.md](AWS_DEPLOYMENT_CHECKLIST.md).

## Current State

- Backend health is available through `https://api.miniface.site/api/actuator/health`.
- The frontend is deployed on Vercel at `https://www.miniface.site`.
- Latest documented local backend suite passed with 65 tests; CI status and deployed SHA must still be recorded for each release.
- Production CORS preflight succeeds for both `miniface.site` and `www.miniface.site` with credentials enabled.
- SSE and SockJS production endpoints are deployed; browser-level verification of notifications, realtime post counts, chat, and calls remains required.
- Active WebRTC calls persist across protected-route navigation through a global draggable PIP; browser-level verification of route changes and page reload cleanup remains required.
- WebRTC signals carry a unique call session ID so delayed END/ICE messages from a previous call cannot terminate its replacement.
- Post notifications use persistent post IDs and open the exact post detail route; friend notifications open the friends screen.
- Posts can be shared into an existing conversation as a server-validated preview card; recipients can open the current post from chat.
- Comment replies notify the parent-comment author, mobile comment input prevents Safari focus zoom, and Friends tab badges preload on page entry.
- Comments and replies support one validated image attachment, tap emoji selection, and touch-friendly reaction controls.

## High Priority Validation

- [ ] Verify real Cloudinary uploads for avatar, cover, and multi-image posts.
- [ ] Confirm the Cloudinary API key has only the required `create/upload` permissions and uploads use the intended folders.
- [ ] Manually verify Google OAuth locally for a new user, returning user, verified-email auto-link, banned account, logout, and refresh.
- [x] Add Google OAuth automated coverage for callback handling, onboarding-token expiry/replay, account linking, account bans, and Google-only password guards.
- [ ] Re-run the complete Playwright suite and investigate any long-suite auth/session flakes.
- [x] Profile-exclude and deny `/dev/**` in production; public deploy verification returns `401` before reaching a controller.
- [ ] Define and test CSRF/Origin policy for state-changing cookie-authenticated requests.

## AWS Production Setup

- [x] Keep local-only credentials in `backend/config/application-local.yml`, outside the built JAR.
- [x] Add the fail-fast `prod` Spring profile with environment-only secrets and Secure OAuth cookies.
- [ ] Rotate Cloudinary and Google OAuth credentials that were used during local setup.
- [x] Configure AWS HTTPS and the production frontend/backend custom domains.
- [x] Store JWT, Cloudinary, Google OAuth, MongoDB, Redis, and mail credentials in AWS-only environment variables.
- [ ] Configure and manually test the production Google OAuth redirect URI, consent screen, privacy-policy URL, and terms URL.
- [x] Verify a Resend sending domain and set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `APP_API_URL`.
- [x] Deploy `CORS_ALLOWED_ORIGINS` and verify credentialed requests from both production frontend origins.
- [x] Verify SSE and SockJS endpoint CORS over HTTPS without `localhost` fallback requests.
- [x] Validate reverse proxy headers, health checks, Docker restart policy, and persistent Redis storage.
- [ ] Configure database backup, log retention, monitoring, and error/latency alerts.
- [ ] Run a staging-sized load test for feed, search, upload, and authentication flows.
- [ ] Record deployed backend/frontend SHA, UTC timestamp, smoke-test evidence and rollback target for each release.

## Deferred Enhancements

- [ ] Let Google-only users create a local password after recent Google reauthentication.
- [ ] Evaluate Cloudinary Direct Signed Upload after ownership, ticket, cleanup, and monitoring controls are ready.
- [ ] Extend search with user discovery, relevance tuning, cache metrics, and query performance SLOs.

## Release Gate

Do not enable production Google OAuth or Direct Signed Upload until all High Priority Validation and AWS Production Setup items required by the selected deployment scope are complete.
