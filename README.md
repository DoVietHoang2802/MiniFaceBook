# Vizo

Vizo is a realtime social network for sharing posts, building friend connections, messaging, and 1-1 video calls. This repository contains the Vizo application source, internally named MiniFaceBook.

## Live Application

- App: [www.miniface.site](https://www.miniface.site)
- API health: [api.miniface.site/api/actuator/health](https://api.miniface.site/api/actuator/health)
- API docs: [api.miniface.site/api/docs](https://api.miniface.site/api/docs)

## Highlights

- Cookie-based authentication with Google OAuth, refresh-token rotation, RBAC, email verification and password recovery.
- Posts, images, nested comments, reactions, notifications, profile privacy and friend connections.
- Realtime 1-1 chat with media, post sharing, typing, presence, reactions and read state.
- WebRTC audio/video calls with STOMP signaling and mobile-friendly picture-in-picture controls.
- On-demand chat AI insights powered server-side with per-user limits and no persisted AI output.
- Responsive React UI for desktop and mobile, with Vizo branding and a Vizo favicon.

## Architecture

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, TanStack Query |
| Backend | Java 21, Spring Boot 3, Modular Monolith, Spring Security |
| Data | MongoDB Atlas, Redis cache/pub-sub/JWT blacklist |
| Realtime | STOMP/SockJS, SSE, WebRTC |
| Services | Cloudinary, Resend, DeepSeek, Sentry |
| Delivery | Docker Compose, AWS EC2, Vercel, GitHub Actions CI |

## Local Development

Start local infrastructure:

```bash
docker compose up -d
```

Run the backend:

```bash
cd backend
mvn "-Dspring-boot.run.profiles=local" spring-boot:run
```

Run the frontend:

```bash
cd frontend
npm ci
npm run dev
```

The local app runs at `http://localhost:5173`, the API at `http://localhost:8080/api`, and Mailpit at `http://localhost:8025`.

## Verification

```bash
cd backend
mvn clean test

cd ../frontend
npm run build
npx playwright test
```

The production-safe k6 baseline and Redis benchmark are documented in [docs/testing/K6_LOAD_TESTING.md](docs/testing/K6_LOAD_TESTING.md).

## Documentation

Current product, architecture, operations and testing documentation is indexed in [docs/README.md](docs/README.md).
