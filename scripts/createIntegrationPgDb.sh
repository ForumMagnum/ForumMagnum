#!/bin/bash

set -euxo pipefail

yarn ea-start-testing-db &
./scripts/timeout.sh 60 ./scripts/waitForServer.sh
curl -X POST http://localhost:3000/api/dropAndCreatePg \
	-d '{"seed": false, "templateId": "jest_template", "dropExisting": true}' \
	-H "Content-Type: application/json"
curl -X POST http://localhost:3000/api/quit

BASE=`sed 's|\(.*\)/.*|\1|' <<< $PG_URL`
export PG_URL="${BASE}/unittest_jest_template"
psql $PG_URL -c '\d'
