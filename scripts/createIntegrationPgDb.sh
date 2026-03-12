#!/bin/bash

set -euxo pipefail

# Default to local docker DB for local runs (same port as `yarn playwright-db`)
: "${PG_URL:=postgres://postgres:password@localhost:5433/postgres}"

if [[ -z "${CI:-}" ]]; then
  if [[ "$PG_URL" != *"localhost"* && "$PG_URL" != *"127.0.0.1"* ]]; then
    echo "Refusing to create integration test DB against non-local PG_URL: $PG_URL" >&2
    echo "Set PG_URL to a local docker instance (e.g. postgres://postgres:password@localhost:5433/postgres) or export ALLOW_REMOTE_TEST_DB=1 (not recommended)." >&2
    exit 1
  fi
fi

# yarn ea-start-testing-db &
yarn next dev --turbopack &
./scripts/timeout.sh 120 ./scripts/waitForServer.sh
curl --fail -X POST http://localhost:3000/api/dropAndCreatePg \
	-d '{"templateId": "jest_template"}' \
	-H "Content-Type: application/json"
curl --fail -X POST http://localhost:3000/api/quit

BASE=`sed 's|\(.*\)/.*|\1|' <<< $PG_URL`
export PG_URL="${BASE}/unittest_jest_template"
psql $PG_URL -c '\d'
