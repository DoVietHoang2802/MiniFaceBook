# MiniFace API Reference

## Scope

This is a concise contract guide for consumers and reviewers. Swagger at `/api/docs` is the executable REST reference; controller source is authoritative when a mismatch is found.

## Base URLs

| Environment | Frontend | API |
|---|---|---|
| Local | `http://localhost:5173` | `http://localhost:8080/api` |
| Production | `https://www.miniface.site` | `https://api.miniface.site/api` |

The frontend uses `VITE_API_BASE_URL`. Do not configure browser clients with localhost in production.

## Authentication

- Registration, password login, Google OAuth, refresh and logout are under `/auth`.
- Access and refresh JWTs are HttpOnly cookies; browser clients use `withCredentials`.
- `GET /auth/me` returns `401` for an anonymous visitor by design.
- Production cookies require HTTPS. Do not place access tokens in query strings, local storage or documentation examples.

## REST Areas

| Area | Representative endpoints | Notes |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | Cookie session and refresh rotation. |
| OAuth | `GET /oauth2/authorization/google`, callback `/login/oauth2/code/google` | Production callback is served by the API domain. |
| Posts | `GET /posts/newsfeed`, `GET /posts/{postId}`, `POST /posts`, `POST /posts/{id}/reactions` | `postId` supports detail deep links and chat share cards. |
| Comments | `GET /posts/{id}/comments`, multipart `POST /posts/{id}/comments`, comment reactions/delete | A comment/reply accepts text and/or one image; replies use `parentId`. |
| Friends | requests, pending/sent lists, accept/reject, suggestions | Client preloads list counts for tab badges. |
| Conversations | `GET /conversations`, paged messages, `POST /conversations/{id}/messages`, `POST /conversations/{id}/ai-insights` | Supports `TEXT`, `IMAGE`, `FILE`, `POST`; AI insights are member-only and use a short-lived unread-text snapshot. |
| Notifications | list, unread count, mark read | Like/comment/reply/friend/comment-reaction notifications deep-link to their entity. |
| Users/Admin | profile, settings, moderation and broadcast endpoints | Authorization is role/ownership guarded. |
| Health | `GET /actuator/health` | Used for infrastructure health checks. |

## Realtime Contracts

| Transport | Purpose | Client behavior |
|---|---|---|
| SSE | Post counts and notification fallback/streaming | Uses credentialed `EventSource`; no token query parameter. |
| STOMP/SockJS | Chat, calls, typing, message reactions, updates | Connects at `/api/ws`; user queues isolate private events. |
| WebRTC | 1-1 audio/video media | STOMP relays OFFER/ANSWER/ICE/END. Every call includes `callId` so stale signals cannot terminate a new call. |

## Error Contract

JSON errors are produced centrally by `GlobalExceptionHandler`. Clients should use stable error codes and messages, not HTTP text alone. Typical response categories: validation (`400`), unauthenticated (`401`), unauthorized (`403`), not found (`404`), conflict/rate limit where applicable, and unexpected (`500`).

## Chat AI Insights

- `POST /conversations/{id}/ai-insights` accepts `{ "task": "UNREAD_SUMMARY" }` or `{ "task": "EMOTION_ANALYSIS" }`.
- The caller must belong to the conversation. The backend sends at most 50 unread `TEXT` messages to the configured provider; images, files and results are not persisted in MongoDB.
- Opening a conversation snapshots the matching unread text context in Redis for 24 hours before messages are marked seen, so the user can explicitly run either insight afterward.
- Redis enforces 10 successful uses per user/day and a 60-second cooldown per task/conversation. Provider quota, timeout and user-limit errors are returned as user-safe messages.
- Production configuration is server-only: `AI_ENABLED`, `DEEPSEEK_API_KEY`, `AI_MODEL=deepseek-v4-flash`, `AI_DAILY_LIMIT=10`, `AI_MESSAGE_LIMIT=50`, and `AI_TIMEOUT_SECONDS=20`. Never expose the key to browser code or commit it.

## Media Policy

- Posts: up to 10 images; browser compression targets WebP while GIF behavior is preserved; backend validates final payload.
- Comments/replies: one optional image, uploaded through the existing media service.
- Chat: image uploads use the conversation media endpoint and render in an in-app lightbox.
- Production media credentials are environment-only.
