#!/bin/bash

set -euxo pipefail

# yarn ea-start-testing-db &
yarn run-next &
./scripts/timeout.sh 120 ./scripts/waitForServer.sh
curl --fail -X POST http://localhost:3000/api/dropAndCreatePg \
	-d '{"templateId": "jest_template"}' \
	-H "Content-Type: application/json"
curl --fail -X POST http://localhost:3000/api/quit

BASE=`sed 's|\(.*\)/.*|\1|' <<< $PG_URL`
export PG_URL="${BASE}/unittest_jest_template"
psql $PG_URL -c '\d'
