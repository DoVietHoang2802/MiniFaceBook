# K6 Read-Only Load Testing

## Purpose

`tests/performance/k6-read-only.js` exercises only read endpoints. It never creates posts, comments, messages, reactions, uploads, or users.

## Installation

On Windows PowerShell:

```powershell
winget install --id Grafana.k6 --exact --source winget
k6 version
```

## Safe Production Smoke Test

This checks the public health endpoint with 5 virtual users for one minute:

```powershell
k6 run -e BASE_URL=https://api.miniface.site/api tests/performance/k6-read-only.js
```

Run this before higher load. It should not be treated as an application-flow test because health does not query MongoDB or authenticate a user.

## Authenticated Read Test

Use a dedicated verified test account. Do not put the email or password in Git, terminal history, screenshots, or chat.

```powershell
$env:BASE_URL = "https://api.miniface.site/api"
$env:TEST_EMAIL = "verified-test-account@example.com"
$env:TEST_PASSWORD = "set-the-password-locally"
$env:LOAD_VUS = "10"
k6 run tests/performance/k6-read-only.js
Remove-Item Env:TEST_EMAIL, Env:TEST_PASSWORD
```

When credentials are present, k6 logs in once and then tests only `GET /posts/newsfeed` and `GET /posts/search` using the received HttpOnly cookies.

## Production Limits

- Begin with 5 VUs. The current EC2 instance is a small 2 vCPU/1 GB MVP host.
- Increase to 10, then 20 VUs only when error rate stays below 1% and p95 stays below 2 seconds. The initial health check includes real internet latency from the load-test machine to AWS.
- Do not run 100 VUs against this production host without a staging-sized environment and a traffic window.
- Save the terminal summary with the release SHA and Sentry error count before marking a release verified.

## Recorded Production Baseline

Run from Windows against backend release `1627b10` on 2026-08-07. These runs used the health-only path and did not create data or authenticate a user.

| Profile | Checks | Failed requests | Average | p95 | Maximum |
| --- | ---: | ---: | ---: | ---: | ---: |
| 5 VUs, 60 seconds | 171/171 | 0% | 360.70 ms | 365.85 ms | 425.68 ms |
| 10 VUs, 60 seconds | 339/339 | 0% | 356.39 ms | 360.77 ms | 377.84 ms |

The baseline passes the `p95 < 2 seconds` and `< 1%` error-rate thresholds. It proves public health-path availability through the production network, Nginx and Spring Boot. It does not prove authenticated MongoDB feed/search throughput; use the dedicated test-account profile before increasing traffic materially.
