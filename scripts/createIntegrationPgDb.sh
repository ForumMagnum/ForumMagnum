#!/bin/bash

set -euxo pipefail

yarn ea-start-testing-db &
./scripts/timeout.sh 60 ./scripts/waitForServer.sh
curl -X POST http://localhost:3000/api/dropAndCreatePg \
	-d '{"seed": false, "templateId": "jest_template"}' \
	-H "Content-Type: application/json"
curl -X POST http://localhost:3000/api/quit
