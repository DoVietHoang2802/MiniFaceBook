# Repository Structure

MiniFace is a monorepo with a Spring Boot backend, a Vite/React frontend and production deployment assets.

| Directory | Purpose |
| --- | --- |
| `backend/` | Java 21 Spring Boot modular monolith, tests and Dockerfile. |
| `frontend/` | React, TypeScript, Vite, Playwright tests and Vercel configuration. |
| `deploy/` | Production Docker Compose, release/rollback scripts and operations runbooks. |
| `tests/` | Cross-application performance scripts such as k6. |
| `docs/` | Current product, architecture, operations and testing documentation. |
| `.github/` | CI workflow. |

## Documentation Policy

- Keep current contracts, architecture, operations runbooks and reproducible test guidance in Git.
- Keep local secrets, generated output, reports and completed working notes out of Git.
- The maintained documentation index is [docs/README.md](../README.md).
