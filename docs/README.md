# MiniFace Documentation

This directory contains the current product and operations documentation. Historical working notes, phase plans and session handoffs remain local-only and are intentionally excluded from Git.

## Product

- [API Reference](api/API_REFERENCE.md): REST, realtime and AI integration contract.
- [System Design](architecture/SYSTEM_DESIGN.md): system overview and database model.
- [Backend Architecture](architecture/BACKEND_ARCHITECTURE.md): module boundaries and Clean Architecture rules.
- [Frontend Architecture](architecture/FRONTEND_ARCHITECTURE.md): React module and realtime client structure.
- [Database Schema](architecture/DATABASE_SCHEMA.md): MongoDB, Redis and migration details.
- [Profile Privacy Policy](guidelines/PROFILE_PRIVACY_POLICY.md): viewer-aware profile data contract.
- [UI/UX Design](guidelines/UI_UX_DESIGN.md): maintained visual and interaction guidelines.

## Operations

- [AWS Deployment Checklist](planning/AWS_DEPLOYMENT_CHECKLIST.md): AWS, Vercel, DNS and release procedure.
- [Production Readiness Checklist](planning/PRODUCTION_READINESS_CHECKLIST.md): current release gates and evidence.
- [Domain Configuration](planning/DOMAIN_CONFIGURATION.md): public domain and DNS setup.
- [Local Configuration](guidelines/LOCAL_CONFIGURATION.md): local environment setup without secrets.
- [Monitoring Runbook](../deploy/ops/MONITORING_RUNBOOK.md): Sentry and CloudWatch response guidance.

## Quality And Scale

- [Testing Guide](testing/TESTING_GUIDE.md): backend, frontend and CI verification.
- [K6 Load Testing](testing/K6_LOAD_TESTING.md): production-safe load and Redis benchmark evidence.
- [Roadmap](planning/ROADMAP.md): remaining product and hardening work.
- [Scale Architecture](scale/SCALE_ARCHITECTURE.md): scale-out direction.
- [Tech Stack Analysis](scale/TECH_STACK_ANALYSIS.md): technology trade-offs.
