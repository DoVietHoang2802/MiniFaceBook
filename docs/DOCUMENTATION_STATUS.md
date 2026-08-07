# Documentation Status

## Purpose

This tracker records whether documentation reflects the source tree rather than an assumed release state. It is reviewed alongside code changes and release evidence.

## Review Snapshot

| Area | Source of truth | Status | Notes |
|---|---|---|---|
| Product overview | `README.md` + `ROADMAP.md` | Updated | Uses Phase 0-8 taxonomy and separates core completion from release gates. |
| Backend/API | Controllers + `docs/api/API_REFERENCE.md` | Updated | Swagger remains the executable endpoint reference. |
| Frontend | `frontend/src` + `frontend/README.md` | Updated | Documents Vite config, routes, transports and build command. |
| Data model | Mongo documents + `DATABASE_SCHEMA.md` | Updated | Includes post counters/soft delete, comment image and chat shared-post snapshot. |
| Realtime | SSE controllers, STOMP config, call hook | Updated | REST uses `VITE_API_BASE_URL`; notifications use recipient-scoped SSE/STOMP; chat/calls use STOMP. |
| Deployment | `deploy/`, Vercel, `AWS_DEPLOYMENT_CHECKLIST.md` | Updated | Manual SHA-reviewed backend release `1627b10`; Actions is CI only. |
| Security/release | `SecurityConfig`, readiness checklist | Open gates | CSRF/Origin policy, secret rotation, backup/restore and k6 verification remain. `/dev/**` is denied in production. |
| Testing | `ci.yml`, backend tests, Playwright, `tests/performance/k6-read-only.js` | Updated | CI runs backend tests plus Chromium/mobile Playwright. Production k6 health baseline passed at 5/10 VUs; authenticated feed/search throughput remains a separate test-account run. |

## Documentation Maintenance Checklist

| Trigger | Required update |
|---|---|
| New API, event or message type | API reference, schema, backend/frontend architecture and tests. |
| UI/mobile behavior change | Mobile plan, frontend README and manual browser test matrix. |
| Data/document field change | `DATABASE_SCHEMA.md`, migration notes and API contract. |
| Deployment or environment change | AWS checklist, readiness checklist, domain config and handoff. |
| Release decision | Record deployed SHA, timestamp, smoke-test evidence, rollback target and unresolved gates in handoff. |

## Evidence Standard

- A merged commit is not proof of deployment.
- A healthy endpoint is not proof of authenticated browser behavior.
- A CI pass is not a production release.
- Never place production secrets, private registration data or copied environment files in documentation.
