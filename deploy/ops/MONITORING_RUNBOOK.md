# Monitoring And Alert Runbook

## Sentry

1. Create an alert for a new issue with at least one event in 5 minutes.
2. Create an alert for a regression or error-count spike in 15 minutes.
3. Send alerts to the maintainer email; never include request bodies, tokens or passwords.
4. Keep the Sentry project URL private, outside Git.

## AWS CloudWatch

| Alarm | Suggested threshold | Action |
|---|---|---|
| Status check failed | `>= 1` for 2 minutes | Send an SNS/email alert immediately. |
| CPU utilization | `>= 80%` for 10 minutes | Inspect traffic, JVM memory and jobs. |
| Disk usage | `>= 80%` | Requires CloudWatch Agent custom metric; clean logs before disk fills. |
| Backup verification | Latest backup older than 26h | Investigate the S3 backup job before the next release. |

## Minimum Response Procedure

1. Check public health and Docker container status.
2. Check the Sentry issue and Docker logs without copying secrets.
3. For release regressions, run `rollback.sh` with the known-good SHA.
4. For data incidents, restore to a temporary Atlas database first.
5. Record incident time, SHA, diagnosis and recovery in the release ledger or handoff.
