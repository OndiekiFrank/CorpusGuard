#!/usr/bin/env bash
#
# demo-reset.sh — tear down, rebuild, and relaunch CorpusGuard to a known-good
# state. Use this to recover a botched demo in under a minute.
#
#   ./scripts/demo-reset.sh
#
# It brings the full stack (API + React UI + Redis) back up, waits for the API
# healthcheck to go healthy, and smoke-tests both ports.
set -euo pipefail

cd "$(dirname "$0")/.."

# Pick whichever Compose CLI is available.
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "ERROR: neither 'docker compose' nor 'docker-compose' found." >&2
  exit 1
fi

echo "==> Tearing down existing stack (containers + anonymous volumes)…"
$DC down --remove-orphans --volumes || true

echo "==> Rebuilding images…"
$DC build

echo "==> Launching stack…"
$DC up -d

echo -n "==> Waiting for API to become healthy"
for _ in $(seq 1 40); do
  status="$(docker inspect --format '{{.State.Health.Status}}' corpusguard-api 2>/dev/null || echo starting)"
  if [ "$status" = "healthy" ]; then echo " — healthy."; break; fi
  echo -n "."
  sleep 3
done

echo "==> Smoke test:"
code_api="$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/v1/health || echo 000)"
code_ui="$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 000)"
echo "    API  http://localhost:8000/api/v1/health -> $code_api"
echo "    UI   http://localhost:3000               -> $code_ui"

if [ "$code_api" = "200" ] && [ "$code_ui" = "200" ]; then
  echo "==> Ready. Dashboard: http://localhost:3000 | API docs: http://localhost:8000/docs"
else
  echo "==> WARNING: a service is not answering 200. Check '$DC logs'." >&2
  exit 1
fi
