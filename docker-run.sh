#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if ! command -v docker &>/dev/null; then
  echo "Error: docker is not installed." >&2
  exit 1
fi

if ! docker info &>/dev/null; then
  echo "Error: Docker daemon is not running. Start Docker and try again." >&2
  exit 1
fi

docker compose up -d --build

echo "Nazmo.AI is running at http://localhost:8080"
