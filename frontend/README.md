# MiniFace Frontend

React + TypeScript + Vite client for MiniFace.

## Responsibilities

- Cookie-based authentication, Google OAuth callback and profile completion.
- Feed, post detail/deep links, reactions, nested comments and comment attachments.
- Friends, notification badges/deep links, responsive mobile navigation and admin routes.
- 1-1 chat with media, post sharing, typing, reactions, replies, unread state and in-app image lightbox.
- WebRTC calls with STOMP signaling, global draggable PiP and mobile-safe controls.

## Local Development

```bash
npm install
npm run dev
```

The default Vite URL is `http://localhost:5173`.

## Environment

```text
VITE_API_BASE_URL=http://localhost:8080/api
```

Production Vercel builds use `https://api.miniface.site/api`. Do not use `VITE_API_URL`; all REST, SSE and SockJS URLs derive from `VITE_API_BASE_URL`.

## Scripts

```bash
npm run dev       # Vite development server
npm run build     # TypeScript check and production build
npm run test:e2e  # Playwright suite
```

## Module Map

| Module | Main responsibility |
|---|---|
| `core/` | API client, auth context, monitoring and shared hooks. |
| `modules/auth` | Registration, login, OAuth and verification. |
| `modules/post` | Feed, post detail, comments, media and reactions. |
| `modules/friends` | Requests, lists, suggestions and profile relations. |
| `modules/chat` | Conversations, media, post sharing, STOMP and WebRTC. |
| `modules/notification` | Notification state, deep links and recipient-scoped realtime events. |
| `modules/profile` | Profile and account settings. |
| `modules/admin` | Moderation and system operations. |

## Mobile Expectations

- Use 16px text inputs to avoid iOS auto-zoom.
- Important actions need touch targets of at least 44px.
- Tap is the default quick action; long-press opens reaction choices where supported.
- Respect safe-area insets and dynamic viewport behavior.

## Further Reading

- [Root README](../README.md)
- [API Reference](../docs/api/API_REFERENCE.md)
- [Testing Guide](../docs/testing/TESTING_GUIDE.md)
- [Documentation Index](../docs/README.md)
