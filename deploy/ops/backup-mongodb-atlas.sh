#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/apps/MiniFaceBook}"
ENV_FILE="${ENV_FILE:-$APP_DIR/deploy/.env.production}"
PREFIX="${BACKUP_S3_PREFIX:-miniface/mongodb}"

read_env() {
  local key="$1"
  sed -n "s/^${key}=//p" "$ENV_FILE" | tail -n 1
}

MONGODB_URI="$(read_env MONGODB_URI)"
BACKUP_S3_BUCKET="$(read_env BACKUP_S3_BUCKET)"

if [[ -z "$MONGODB_URI" || -z "$BACKUP_S3_BUCKET" ]]; then
  echo "MONGODB_URI and BACKUP_S3_BUCKET must be set in $ENV_FILE" >&2
  exit 1
fi

timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
object_key="$PREFIX/$timestamp.archive.gz"
destination="s3://$BACKUP_S3_BUCKET/$object_key"

docker run --rm -e MONGODB_URI mongo:7 \
  mongodump --quiet --uri="$MONGODB_URI" --archive --gzip \
  | aws s3 cp - "$destination" --sse AES256 --only-show-errors

aws s3api head-object --bucket "$BACKUP_S3_BUCKET" --key "$object_key" >/dev/null
printf 'Backup verified: %s\n' "$destination"
