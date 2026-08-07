# Operations Scripts

These scripts run only on the AWS EC2 instance. They never belong in a frontend build and must not print secrets.

## One-Time Prerequisites

1. Create a private S3 bucket in the same AWS region as EC2.
2. Enable S3 default encryption and block all public access.
3. Create an EC2 IAM role limited to `s3:PutObject`, `s3:GetObject` and `s3:ListBucket` for only this bucket/prefix. Copy `aws/miniface-backup-policy.json`, replacing `YOUR_PRIVATE_BACKUP_BUCKET` first.
4. Add `BACKUP_S3_BUCKET=<bucket-name>` to the server-only `.env.production` file.
5. Configure an S3 lifecycle rule to expire `miniface/mongodb/` objects after the chosen retention period, initially 30 days.

## Backup

```bash
cd ~/apps/MiniFaceBook
chmod +x deploy/ops/*.sh
deploy/ops/backup-mongodb-atlas.sh
deploy/ops/verify-mongodb-backup.sh
```

`backup-mongodb-atlas.sh` streams a gzip archive from Atlas to S3. It does not leave the archive on EC2 disk. Run it once daily via a systemd timer after a successful manual backup and restore drill.

Install the timer only after the first manual backup succeeds:

```bash
sudo cp deploy/ops/systemd/miniface-mongodb-backup.service /etc/systemd/system/
sudo cp deploy/ops/systemd/miniface-mongodb-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now miniface-mongodb-backup.timer
systemctl list-timers miniface-mongodb-backup.timer
```

## Release And Rollback

```bash
deploy/ops/release.sh <approved-commit-sha>
deploy/ops/rollback.sh <known-good-commit-sha>
```

The release script builds the exact Git commit, requires a local health check, and records the timestamp/current SHA/rollback SHA in `~/apps/MiniFaceBook/releases/deployments.tsv`.

## Restore Drill

Do not restore into the live production database first. Restore a selected archive into a temporary Atlas database, validate document counts and one application workflow, then document the result in the release ledger.
