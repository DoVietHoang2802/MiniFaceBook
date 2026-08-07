#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/apps/MiniFaceBook}"
ENV_FILE="${ENV_FILE:-$APP_DIR/deploy/.env.production}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-26}"

BACKUP_S3_BUCKET="$(sed -n 's/^BACKUP_S3_BUCKET=//p' "$ENV_FILE" | tail -n 1)"
if [[ -z "$BACKUP_S3_BUCKET" ]]; then
  echo "BACKUP_S3_BUCKET must be set in $ENV_FILE" >&2
  exit 1
fi

last_modified="$(aws s3api list-objects-v2 --bucket "$BACKUP_S3_BUCKET" --prefix miniface/mongodb/ \
  --query 'sort_by(Contents,&LastModified)[-1].LastModified' --output text)"
if [[ -z "$last_modified" || "$last_modified" == "None" ]]; then
  echo "No MongoDB backup found" >&2
  exit 1
fi

age_seconds=$(( $(date +%s) - $(date -d "$last_modified" +%s) ))
if (( age_seconds > MAX_AGE_HOURS * 3600 )); then
  echo "Latest backup is older than ${MAX_AGE_HOURS}h: $last_modified" >&2
  exit 1
fi

printf 'Latest MongoDB backup: %s\n' "$last_modified"
