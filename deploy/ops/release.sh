#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <approved-commit-sha>" >&2
  exit 1
fi

APP_DIR="${APP_DIR:-$HOME/apps/MiniFaceBook}"
COMPOSE_DIR="$APP_DIR/deploy"
SHA="$1"
RELEASE_LOG="$APP_DIR/releases/deployments.tsv"

mkdir -p "$(dirname "$RELEASE_LOG")"
cd "$APP_DIR"
git fetch origin --tags
git cat-file -e "$SHA^{commit}"

previous_sha="$(git rev-parse HEAD)"
git checkout --detach "$SHA"

cd "$COMPOSE_DIR"
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
curl --fail --silent --show-error http://127.0.0.1:8080/api/actuator/health >/dev/null

printf '%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$SHA" "$previous_sha" "health-up" >> "$RELEASE_LOG"
printf 'Release verified. Current SHA: %s; rollback SHA: %s\n' "$SHA" "$previous_sha"
