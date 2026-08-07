# Production Readiness Checklist

Deployment execution order is documented in [AWS_DEPLOYMENT_CHECKLIST.md](AWS_DEPLOYMENT_CHECKLIST.md).

## Current State

- Backend health is available through `https://api.miniface.site/api/actuator/health`.
- The frontend is deployed on Vercel at `https://www.miniface.site`.
- Latest documented local backend suite passed with 68 tests; the backend release `1627b10` is health-verified with rollback `f00ef6a`.
- Sentry production error capture and email alerts are active for backend/frontend; the API error handler forces JSON responses to avoid the historic JavaScript content-type converter event.
- Chat AI is deployed with the server-side DeepSeek configuration, a 10-use daily Redis quota, a 50-message text limit and no MongoDB persistence for AI output.
- Production CORS preflight succeeds for both `miniface.site` and `www.miniface.site` with credentials enabled.
- SSE and SockJS production endpoints are deployed; browser-level verification of notifications, realtime post counts, chat, and calls remains required.
- Active WebRTC calls persist across protected-route navigation through a global draggable PIP; browser-level verification of route changes and page reload cleanup remains required.
- WebRTC signals carry a unique call session ID so delayed END/ICE messages from a previous call cannot terminate its replacement.
- Post notifications use persistent post IDs and open the exact post detail route; friend notifications open the friends screen.
- Posts can be shared into an existing conversation as a server-validated preview card; recipients can open the current post from chat.
- Comment replies notify the parent-comment author, mobile comment input prevents Safari focus zoom, and Friends tab badges preload on page entry.
- Comments and replies support one validated image attachment, tap emoji selection, and touch-friendly reaction controls.

## High Priority Validation

- [x] Verify real Cloudinary uploads for avatar, cover, and multi-image posts.
- [x] Confirm the Cloudinary API key has only the required `create/upload` permissions and uploads use the intended folders.
- [x] Manually verify Google OAuth locally and in production for new/returning user flows and logout.
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
- [x] Add `DEEPSEEK_API_KEY` only to AWS `deploy/.env.production` and enable `AI_ENABLED`; run a manual private-chat AI smoke test before broad release.
- [x] Configure Sentry production error capture and email alerting.
- [ ] Configure database backup, log retention and CloudWatch latency/down alerts.
- [x] Run the production-safe k6 health-only profile: 5 and 10 VUs for 60 seconds, 0% failures, p95 under 366 ms; see `docs/testing/K6_LOAD_TESTING.md`.
- [ ] Run authenticated k6 feed/search reads with a dedicated test account before increasing production traffic materially.
- [x] Record deployed backend SHA `1627b10`, timestamp `2026-08-07T08:19:10Z`, health evidence and rollback SHA `f00ef6a`.

## Deferred Enhancements

- [ ] Let Google-only users create a local password after recent Google reauthentication.
- [ ] Evaluate Cloudinary Direct Signed Upload after ownership, ticket, cleanup, and monitoring controls are ready.
- [ ] Extend search with user discovery, relevance tuning, cache metrics, and query performance SLOs.

## Release Gate

Do not enable production Google OAuth or Direct Signed Upload until all High Priority Validation and AWS Production Setup items required by the selected deployment scope are complete.
