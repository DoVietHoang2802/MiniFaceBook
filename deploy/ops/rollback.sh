#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <known-good-commit-sha>" >&2
  exit 1
fi

APP_DIR="${APP_DIR:-$HOME/apps/MiniFaceBook}"
exec "$APP_DIR/deploy/ops/release.sh" "$1"
